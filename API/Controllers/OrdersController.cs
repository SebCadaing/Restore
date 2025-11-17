using System;
using API.Data;
using API.DTOs;
using API.Entities;
using API.Entities.OrderAggregate;
using API.Extensions;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

[Authorize]
public class OrdersController(StoreContext context, DiscountService discountService, UserManager<User> userManager) : BaseApiController
{
    [HttpGet]
    public async Task<ActionResult<List<OrderDto>>> GetOrders()
    {
        var orders = await context.Orders
            .ProjectToDto()
            .Where(x => x.BuyerEmail == User.GetUsername())
            .ToListAsync();

        return orders;
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<OrderDto>> GetOrderDetails(int id)
    {
        var order = await context.Orders
            .ProjectToDto()
            .Where(x => x.BuyerEmail == User.GetUsername() && id == x.Id)
            .FirstOrDefaultAsync();

        if (order == null) return NotFound();
        return order;
    }

    [HttpGet("by-intent/{paymentIntentId}")]
    public async Task<ActionResult<OrderDto>> GetOrderByPaymentIntent(string paymentIntentId)
    {
        var order = await context.Orders
            .Include(o => o.OrderItems)
            .ThenInclude(i => i.ItemOrdered)
            .FirstOrDefaultAsync(o => o.PaymentIntentId == paymentIntentId);

        if (order == null) return NotFound();

        return order.ToDto();
    }

    [HttpPost]
    public async Task<ActionResult<OrderDto>> CreateOrder(CreateOrderDto orderDto)
    {
        var user = await userManager.GetUserAsync(User);
        if (user == null) return Unauthorized(new { error = "User not authenticated" });

        var basket = await context.Baskets
            .Include(b => b.Items)
            .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(b => b.UserId == user.Id && b.IsActive);

        if (basket == null) return BadRequest(new { error = "No basket found for user" });
        if (basket.Items.Count == 0) return BadRequest(new { error = "Basket has no items" });
        if (string.IsNullOrEmpty(basket.PaymentIntentId)) return BadRequest(new { error = "Basket missing PaymentIntentId" });

        var items = CreateOrderItems(basket.Items);
        if (items == null) return BadRequest(new { error = "Some items out of stock" });

        var subtotal = items.Sum(x => x.Price * x.Quantity);
        var deliveryFee = CalculateDeliveryFee(subtotal);
        long discount = 0;

        if (basket.Coupon != null)
        {
            discount = await discountService.CalculateDiscountFromAmount(basket.Coupon, subtotal);
        }

        var order = await context.Orders
            .Include(x => x.OrderItems)
            .FirstOrDefaultAsync(x => x.PaymentIntentId == basket.PaymentIntentId);

        if (order == null)
        {
            order = new Order
            {
                OrderItems = items,
                BuyerEmail = User.GetUsername(),
                ShippingAddress = orderDto.ShippingAddress ?? throw new Exception("Shipping address missing"),
                DeliveryFee = deliveryFee,
                Subtotal = subtotal,
                Discount = discount,
                PaymentSummary = orderDto.PaymentSummary ?? throw new Exception("Payment summary missing"),
                PaymentIntentId = basket.PaymentIntentId,
                OrderStatus = OrderStatus.Pending,
                OrderDate = DateTime.UtcNow
            };
            context.Orders.Add(order);
        }
        else
        {
            order.OrderItems = items;
            order.Subtotal = subtotal;
            order.DeliveryFee = deliveryFee;
            order.Discount = discount;
            order.OrderDate = DateTime.UtcNow;
        }

        var result = await context.SaveChangesAsync() > 0;
        if (!result) return BadRequest(new { error = "Problem creating order" });


        basket.IsActive = false;
        basket.ClientSecret = null;
        basket.PaymentIntentId = null;
        basket.Coupon = null;
        await context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetOrderDetails), new { id = order.Id }, order.ToDto());
    }

    private long CalculateDeliveryFee(long subtotal)
    {
        return subtotal > 1000 ? 0 : 500;
    }

    private List<OrderItem>? CreateOrderItems(List<BasketItem> items)
    {
        var orderItems = new List<OrderItem>();
        foreach (var item in items)
        {
            if (item.Product.QuantityInStock < item.Quantity) return null;

            var orderItem = new OrderItem
            {
                ItemOrdered = new ProductItemOrdered
                {
                    ProductId = item.ProductId,
                    PictureUrl = item.Product.PictureURL,
                    Name = item.Product.Name
                },
                Price = item.Product.Price,
                Quantity = item.Quantity
            };
            orderItems.Add(orderItem);
            item.Product.QuantityInStock -= item.Quantity;
        }
        return orderItems;
    }
}
