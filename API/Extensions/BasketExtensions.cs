using API.DTOs;
using API.Entities;
using Microsoft.EntityFrameworkCore;


namespace API.Extensions;

public static class BasketExtensions
{
    public static BasketDTO ToDto(this Basket basket)//baset.ToDto()
    {
        return new BasketDTO
        {
            BasketId = basket.BasketId,
            ClientSecret = basket.ClientSecret,
            PaymentIntentId = basket.PaymentIntentId,
            Coupon = basket.Coupon,
            Items = basket.Items.Select(x => new BasketItemDto
            {
                ProductId = x.ProductId,
                Name = x.Product.Name,
                Price = x.Product.Price,
                Brand = x.Product.Brand,
                Type = x.Product.Type,
                PictureURL = x.Product.PictureURL,
                Quantity = x.Quantity,
            }).ToList()

        };
    }
    public static async Task<Basket> GetBasketWithItems( this IQueryable<Basket> query, string? basketId)
    {
        
        return await query.Include(x => x.Items).ThenInclude(x => x.Product).FirstOrDefaultAsync(x => x.BasketId == basketId) ??
            throw new Exception("Cannot get basket");
    }
} 
