using API.DTOs;
using API.Entities;

namespace API.Extensions;

public static class BasketExtensions
{
    public static BasketDTO ToDto(this Basket basket)//baset.ToDto()
    {
         return new BasketDTO
        {
            BasketId = basket.BasketId,
            Items = basket.Items.Select(x => new BasketItemDto
            {
                ProductId = x.ProductId,
                Name = x.Product.Name,
                Price = x.Product.Price,
                Brand = x.Product.Brand,
                Type = x.Product.Type,
                PictureURL = x.Product.PictureURL,
                Quantity=x.Quantity,
            }).ToList()

        };
    }
} 
