using API.Data;
using API.DTOs;
using API.Entities;
using API.Extensions;
using API.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

public class BasketController(StoreContext context, DiscountService discountService, PaymentService paymentService) : BaseApiController
{
    [HttpGet]
    public async Task<ActionResult<BasketDTO>> GetBasket()
    {
        var basket = await RetrieveBasket();
        if (basket == null) return NoContent();

        return basket.ToDto();
    }
    [HttpPost]
    public async Task<ActionResult<BasketDTO>> AddItemToBasket(int productId, int quantity)
    {
        //get basket
        var basket = await RetrieveBasket();
        // if no basket create basket
        basket ??= CreateBasket();
        //get product
        var product = await context.Products.FindAsync(productId);

        if (product == null) return BadRequest("Problem adding item to basket");
        //add item to basket
        basket.AddItem(product, quantity);
        // save changes
        var result = await context.SaveChangesAsync() >0;

        if (result) return CreatedAtAction(nameof(GetBasket), basket.ToDto());
        return BadRequest("Problem updating basket");
    }

   

    [HttpDelete]
    public async Task<ActionResult> RemoveBasketItem(int productId, int quantity)
    {
        //get basket
        var basket = await RetrieveBasket();
        //remove or reduce item
        if (basket == null) return BadRequest("Unable to retrieve basket");
        basket.RemoveItem(productId, quantity);
        //save changes
        var result = await context.SaveChangesAsync()>0;
        if (result) return Ok();
       return BadRequest("Failed to remove item from basket");
    }

    private async Task<Basket?> RetrieveBasket()
    {
        return await context.Baskets
            .Include(x => x.Items)
            .ThenInclude(x => x.Product)
            .FirstOrDefaultAsync(x => x.BasketId == Request.Cookies["basketId"]);
    }
    private Basket CreateBasket()
    {
        var basketId = Guid.NewGuid().ToString();
        var cookieOptions = new CookieOptions
        {
            IsEssential = true,
            Expires = DateTime.UtcNow.AddDays(30)
        };
        Response.Cookies.Append("basketId", basketId, cookieOptions);
        var basket = new Basket { BasketId = basketId };
        context.Baskets.Add(basket);
        return basket;
    }

    [HttpPost("{code}")]
    public async Task<ActionResult<BasketDTO>> AddCouponCode(string code)
    {
        var basket = await RetrieveBasket();
        if (basket == null || string.IsNullOrEmpty(basket.ClientSecret)) return BadRequest("Unable to apply voucher");

        var coupon = await discountService.GetCouponFromPromoCode(code);
        if (coupon == null) return BadRequest("Invalid coupon");

        basket.Coupon = coupon;

        var intent = await paymentService.CreateOrUpdatePaymentIntent(basket);
        if (intent == null) return BadRequest("Problem applying coupon to basket");

        var result = await context.SaveChangesAsync() > 0;
        if (result) return CreatedAtAction(nameof(GetBasket), basket.ToDto());
        return BadRequest("Problem updating basket");
    }

    [HttpDelete("remove-coupon")]
    public async Task<ActionResult> RemoveCouponFromBasket()
    {
        var basket = await RetrieveBasket();
        if (basket == null || basket.Coupon == null || string.IsNullOrEmpty(basket.ClientSecret)) return BadRequest("Unable to update basket with coupon");

        var intent = await paymentService.CreateOrUpdatePaymentIntent(basket, true);
        if (intent == null) return BadRequest("Problem removing coupon from basket");

        basket.Coupon = null;

        var result = await context.SaveChangesAsync() > 0;
        if (result) return Ok();
        return BadRequest("Problem updating basket");
    }


}
