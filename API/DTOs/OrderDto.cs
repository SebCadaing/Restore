using System;
using System.Text.Json.Serialization;
using API.Entities.OrderAggregate;

namespace API.DTOs;

public class OrderDto
{
    public int Id { get; set; }
    public string BuyerEmail { get; set; } = "";
    public ShippingAddress ShippingAddress { get; set; } = default!;
    public DateTime OrderDate { get; set; }

    public List<OrderItemDto> OrderItems { get; set; } = [];

    public long Subtotal { get; set; }
    public long DeliveryFee { get; set; }
    public long Discount { get; set; }
    public long Total { get; set; }

    public string OrderStatus { get; set; } = "";

    [JsonPropertyName("paymentSummary")]
    public PaymentSummary PaymentSummary { get; set; } = default!;
}

