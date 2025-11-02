using System;
using API.Entities;

namespace API.DTOs;

public class BasketDTO
{
    public required string BasketId { get; set; }

    public List<BasketItemDto> Items { get; set; } = [];
    public string? ClientSecret { get; set; }
    public string? PaymentIntentId { get; set; }
    public AppCoupon? Coupon { get; set; }

}
