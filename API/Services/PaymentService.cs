using API.Data;
using API.Entities;
using Stripe;

namespace API.Services;

public class PaymentService(StoreContext context, IConfiguration config, DiscountService discountService)
{
    public async Task<PaymentIntent?> CreateOrUpdatePaymentIntent(Basket basket, bool removeCoupon = false)
    {
        StripeConfiguration.ApiKey = config["StripeSettings:SecretKey"];

        var subtotal = basket.Items.Sum(i => i.Quantity * i.Product.Price);
        var deliveryFee = subtotal > 1000 ? 0 : 500;

        long discount = 0;
        if (basket.Coupon != null && !removeCoupon)
        {
            discount = await discountService.CalculateDiscountFromAmount(basket.Coupon, subtotal);
        }

        var amount = subtotal + deliveryFee - discount;

        var service = new PaymentIntentService();
        PaymentIntent intent;

        if (string.IsNullOrEmpty(basket.PaymentIntentId))
        {
            var createOptions = new PaymentIntentCreateOptions
            {
                Amount = amount,
                Currency = "usd",
                PaymentMethodTypes = new List<string> { "card" },
                Metadata = new Dictionary<string, string>
                {
                    { "basketId", basket.Id.ToString() },
                    { "userId", basket.UserId }
                }
            };

            intent = await service.CreateAsync(createOptions);
            basket.PaymentIntentId = intent.Id;
            basket.ClientSecret = intent.ClientSecret;
        }
        else
        {
            var updateOptions = new PaymentIntentUpdateOptions
            {
                Amount = amount,
                Metadata = new Dictionary<string, string>
                {
                    { "basketId", basket.Id.ToString() },
                    { "userId", basket.UserId }
                }
            };

            intent = await service.UpdateAsync(basket.PaymentIntentId, updateOptions);
            basket.ClientSecret = intent.ClientSecret ?? basket.ClientSecret;
        }

        context.Baskets.Update(basket);
        await context.SaveChangesAsync();

        return intent;
    }
}
