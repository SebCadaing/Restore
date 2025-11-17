using API.Data;
using API.DTOs;
using API.Entities;
using API.Extensions;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;



public class BasketController(StoreContext context, DiscountService discountService, PaymentService paymentService, UserManager<User> userManager) : BaseApiController
{
    [HttpGet]
    public async Task<ActionResult<BasketDTO>> GetBasket()
    {
        var basket = await RetrieveBasket();
        if (basket == null) return NoContent();

        return basket.ToDto();
    }
 [Authorize]
[HttpPost]
public async Task<ActionResult<BasketDTO>> AddItemToBasket(int productId, int quantity)
{
    var basket = await RetrieveBasket();
    basket ??= await CreateBasket();

    var product = await context.Products.FindAsync(productId);
    if (product == null) return BadRequest("Problem adding item to basket");

    basket.AddItem(product, quantity);

    var result = await context.SaveChangesAsync() > 0;
    if (result) return CreatedAtAction(nameof(GetBasket), basket.ToDto());

    return BadRequest("Problem updating basket");
}
[Authorize]
    [HttpDelete]
    public async Task<ActionResult> RemoveBasketItem(int productId, int quantity)
    {

        var basket = await RetrieveBasket();

        if (basket == null) return BadRequest("Unable to retrieve basket");
        basket.RemoveItem(productId, quantity);

        var result = await context.SaveChangesAsync() > 0;
        if (result) return Ok();
        return BadRequest("Failed to remove item from basket");
    }

private async Task<Basket?> RetrieveBasket()
{
    var user = await userManager.GetUserAsync(User);
    if (user == null) return null;

    return await context.Baskets
        .Include(b => b.Items)
        .ThenInclude(i => i.Product)
        .Where(b => b.UserId == user.Id && b.IsActive)
        .OrderByDescending(b => b.Id)
        .FirstOrDefaultAsync();
}


  private async Task<Basket> CreateBasket()
{
    var user = await userManager.GetUserAsync(User);
    if (user == null) throw new UnauthorizedAccessException("You must be logged in");


    var basket = new Basket { UserId = user.Id, IsActive = true };
    context.Baskets.Add(basket);
    await context.SaveChangesAsync();
    return basket;
}
[Authorize]
[HttpPost("{code}")]
public async Task<ActionResult<BasketDTO>> AddCouponCode(string code)
{
    var basket = await RetrieveBasket();
    if (basket == null || string.IsNullOrEmpty(basket.ClientSecret))
        return BadRequest("Unable to apply voucher");

    var coupon = await discountService.GetCouponFromPromoCode(code);
    if (coupon == null) return BadRequest("Invalid coupon");

    basket.Coupon = coupon;

    var intent = await paymentService.CreateOrUpdatePaymentIntent(basket);
    if (intent == null) return BadRequest("Problem applying coupon to basket");

    await context.SaveChangesAsync();

    return CreatedAtAction(nameof(GetBasket), basket.ToDto());
}

[Authorize]
[HttpDelete("remove-coupon")]
public async Task<ActionResult> RemoveCouponFromBasket()
{
    var basket = await RetrieveBasket();
    if (basket == null || basket.Coupon == null || string.IsNullOrEmpty(basket.ClientSecret))
        return BadRequest("Unable to update basket with coupon");

    var intent = await paymentService.CreateOrUpdatePaymentIntent(basket, true);
    if (intent == null) return BadRequest("Problem removing coupon from basket");

    basket.Coupon = null;

    await context.SaveChangesAsync(); 

    return Ok();
}



}
