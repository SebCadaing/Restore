using System;
using API.DTOs;
using API.Entities.OrderAggregate;
using Microsoft.EntityFrameworkCore;

namespace API.Extensions;

public static class OrderExtension
{
    public static IQueryable<OrderDto> ProjectToDto(this IQueryable<Order> query)
    {
        return query.Select(order => new OrderDto
        {
            Id = order.Id,
            BuyerEmail = order.BuyerEmail,
            OrderDate = order.OrderDate,
            ShippingAddress = order.ShippingAddress,
            PaymentSummary = order.PaymentSummary,
            DeliveryFee = order.DeliveryFee,
            Subtotal = order.Subtotal,
            Discount = order.Discount,
            OrderStatus = order.OrderStatus.ToString(),
            Total = order.GetTotal(),
            OrderItems = order.OrderItems.Select(item => new OrderItemDto
            {
                ProductId = item.ItemOrdered.ProductId,
                Name = item.ItemOrdered.Name,
                Price = item.Price,
                PictureUrl = item.ItemOrdered.PictureUrl,
                Quantity = item.Quantity
            }).ToList()
        }).AsNoTracking();
    }
      public static OrderDto ToDto(this Order order)
    {
        return new OrderDto
        {
            Id = order.Id,
            BuyerEmail = order.BuyerEmail,
            ShippingAddress = order.ShippingAddress,
            OrderDate = order.OrderDate,
            OrderItems = order.OrderItems.Select(oi => new OrderItemDto
            {
                ProductId = oi.ItemOrdered.ProductId,
                Name = oi.ItemOrdered.Name,
                PictureUrl = oi.ItemOrdered.PictureUrl,
                Price = oi.Price,
                Quantity = oi.Quantity
            }).ToList(),
            Subtotal = order.Subtotal,
            DeliveryFee = order.DeliveryFee,
            Discount = order.Discount,
            Total = order.GetTotal(), 
            OrderStatus = order.OrderStatus.ToString(),
            PaymentSummary = order.PaymentSummary 
        };
    }
}
