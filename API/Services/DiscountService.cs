using API.Entities;
using Stripe;

namespace API.Services;

public class DiscountService
{
    public DiscountService(IConfiguration config)
    {
        StripeConfiguration.ApiKey = config["StripeSettings:SecretKey"];
    }
    public async Task<AppCoupon?> GetCouponFromPromoCode(string code)
{
    var promotionService = new PromotionCodeService();

    var promotionCodes = await promotionService.ListAsync(new PromotionCodeListOptions
    {
        Limit = 100,
        Expand = new List<string> { "data.promotion", "data.promotion.coupon" }
    });



    var promotionCode = promotionCodes.Data
        .FirstOrDefault(p => p.Code.Equals(code, StringComparison.OrdinalIgnoreCase));

    if (promotionCode != null && promotionCode.Promotion?.Coupon != null)
    {
        return new AppCoupon
        {
            Name = promotionCode.Promotion.Coupon.Name,
            AmountOff = promotionCode.Promotion.Coupon.AmountOff,
            PercentOff = promotionCode.Promotion.Coupon.PercentOff,
            CouponId = promotionCode.Promotion.Coupon.Id,
            PromotionCode = promotionCode.Code,
        };
    }
    return null;
}

    public async Task<long> CalculateDiscountFromAmount(AppCoupon appCoupon, long amount, bool removeDiscount = false)
    {
        var couponService = new CouponService();

        var coupon = await couponService.GetAsync(appCoupon.CouponId);

        if (coupon.AmountOff.HasValue && !removeDiscount)
        {
            return (long)coupon.AmountOff;
        }
        else if (coupon.PercentOff.HasValue && !removeDiscount)
        {
            return (long)Math.Round(amount * (coupon.PercentOff.Value / 100), MidpointRounding.AwayFromZero);
        }
        return 0;
    }

}

