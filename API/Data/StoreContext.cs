using API.Entities;
using API.Entities.OrderAggregate;
using API.Extensions;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace API.Data;

public class StoreContext(DbContextOptions options) : IdentityDbContext<User>(options)
{
    public required DbSet<Product> Products { get; set; }
    public required DbSet<Basket> Baskets { get; set; }
    public required DbSet<Order> Orders { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<IdentityRole>()
        .HasData(
            new IdentityRole {Id="f6904be3-b419-499d-a364-e2ce5101d8ed", Name = "Member", NormalizedName = "MEMBER" },
            new IdentityRole {Id ="4433e4ac-0798-4dad-910b-899e9632125a", Name = "Admin", NormalizedName = "ADMIN" }
        );
    }
    
}
