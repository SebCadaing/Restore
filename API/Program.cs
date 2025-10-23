using API.Data;
using API.Extensions;
using API.Middleware;
using API.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Stripe;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddEnvironmentVariables();

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddDbContext<StoreContext>(opt =>
{
    opt.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"));
});
builder.Services.AddCors();
builder.Services.AddTransient<ExceptionMiddleware>();
builder.Services.AddScoped<PaymentService>();
builder.Services.AddIdentityApiEndpoints<User>(opt =>
{
    opt.User.RequireUniqueEmail = true;
})
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<StoreContext>();

StripeConfiguration.ApiKey = builder.Configuration["StripeSettings:SecretKey"];

var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseMiddleware<ExceptionMiddleware>();

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseCors(opt =>
{
    opt.AllowAnyHeader()
       .AllowAnyMethod()
       .AllowCredentials()
       .WithOrigins("https://localhost:3000", "https://restore-smtc.azurewebsites.net");
});


app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapGroup("api").MapIdentityApi<User>(); //api/login
app.MapFallbackToController("Index", "Fallback");

await DbInitializer.InitDb(app);

app.Run();
