using API.Data;
using API.DTOs;
using API.Entities.OrderAggregate;
using API.Extensions;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Stripe;

namespace API.Controllers;

public class PaymentsController(
    PaymentService paymentService,
    StoreContext context,
    IConfiguration config,
    ILogger<PaymentsController> logger,
    UserManager<User> userManager) : BaseApiController
{
  [Authorize]
[HttpPost]
public async Task<ActionResult<BasketDTO>> CreateOrUpdatePaymentIntent()
{
    var user = await userManager.GetUserAsync(User);
    if (user == null) return Unauthorized();

    var basket = await context.Baskets
        .Include(b => b.Items)
        .ThenInclude(i => i.Product)
        .FirstOrDefaultAsync(b => b.UserId == user.Id && b.IsActive);

    if (basket == null) return BadRequest(new { error = "Problem with the basket" });

    var intent = await paymentService.CreateOrUpdatePaymentIntent(basket);
    if (intent == null) return BadRequest(new { error = "Problem creating payment intent" });


    basket.PaymentIntentId = intent.Id;
    basket.ClientSecret = intent.ClientSecret;

    await context.SaveChangesAsync();

    return basket.ToDto();
}
    [HttpPost("webhook")]
    public async Task<IActionResult> StripeWebhook()
    {
        var json = await new StreamReader(Request.Body).ReadToEndAsync();
        try
        {
            var stripeEvent = EventUtility.ConstructEvent(json, Request.Headers["Stripe-Signature"], config["StripeSettings:WhSecret"]);

            if (stripeEvent.Data.Object is not PaymentIntent intent)
            {
                return BadRequest("Invalid event data");
            }

            if (intent.Status == "succeeded")
                await HandlePaymentIntentSucceeded(intent);
            else
                await HandlePaymentIntentFailed(intent);

            return Ok();
        }
        catch (StripeException ex)
        {
            logger.LogError(ex, "Stripe webhook error");
            return StatusCode(StatusCodes.Status500InternalServerError, "Webhook Error");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An unexpected error");
            return StatusCode(StatusCodes.Status500InternalServerError, "Unexpected Error");
        }
    }

    private async Task HandlePaymentIntentFailed(PaymentIntent intent)
    {
        var order = await context.Orders.Include(x => x.OrderItems).FirstOrDefaultAsync(x => x.PaymentIntentId == intent.Id)
                         ?? throw new Exception("Order not found");

        foreach (var item in order.OrderItems)
        {
            var productItem = await context.Products.FindAsync(item.ItemOrdered.ProductId) ?? throw new Exception("Problem updating order stock");
            productItem.QuantityInStock += item.Quantity;
        }
        order.OrderStatus = OrderStatus.PaymentFailed;
        await context.SaveChangesAsync();
    }

private async Task HandlePaymentIntentSucceeded(Stripe.PaymentIntent intent)
{
    var basket = await context.Baskets
        .Include(b => b.Items)
        .FirstOrDefaultAsync(b => b.PaymentIntentId == intent.Id);

    if (basket == null) return;


    await context.SaveChangesAsync();
}

    private Event ConstructStripeEvent(string json)
    {
        try
        {
            return EventUtility.ConstructEvent(json, Request.Headers["Stripe-Signature"], config["StripeSettings:WhSecret"]);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to contruct stripe event");
            throw new StripeException("Invalid Signature");
        }
    }
}
