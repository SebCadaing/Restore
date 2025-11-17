using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using API.DTOs;
using API.Entities;
using API.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace API.Controllers;

public class AccountController(SignInManager<User> signInManager,UserManager<User> userManager, IConfiguration config) : BaseApiController
{

    private string CreateToken(User user)
{
  var claims = new List<Claim>
{
    new Claim(ClaimTypes.Name, user.UserName!),   
    new Claim(ClaimTypes.NameIdentifier, user.Id)
};

    var roles = signInManager.UserManager.GetRolesAsync(user).Result;
    claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));


    var tokenKey = config["Token:Key"] ?? throw new InvalidOperationException("Token key not configured");
    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(tokenKey));

    var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);

    var tokenDescriptor = new SecurityTokenDescriptor
    {
        Subject = new ClaimsIdentity(claims),
        Expires = DateTime.Now.AddDays(7),
        SigningCredentials = creds
    };

    var tokenHandler = new JwtSecurityTokenHandler();
    var token = tokenHandler.CreateToken(tokenDescriptor);

    return tokenHandler.WriteToken(token);
}


    [HttpPost("register")]
    public async Task<ActionResult> RegisterUser(RegisterDto registerDto)
    {
        var user = new User { UserName = registerDto.Email, Email = registerDto.Email };
        var result = await userManager.CreateAsync(user, registerDto.Password);

        if (!result.Succeeded)
        {
            foreach (var error in result.Errors)
                ModelState.AddModelError(error.Code, error.Description);
            return ValidationProblem();
        }

        await userManager.AddToRoleAsync(user, "Member");


        var token = CreateToken(user);
        return Ok(new { Token = token, user.Email, user.UserName });
    }
    [HttpPost("login")]
public async Task<ActionResult> Login(LoginDto loginDto)
{
    var user = await userManager.FindByEmailAsync(loginDto.Email);
    if (user == null) return Unauthorized("Invalid credentials");

    var result = await signInManager.CheckPasswordSignInAsync(user, loginDto.Password, false);
    if (!result.Succeeded) return Unauthorized("Invalid credentials");

    var token = CreateToken(user);
    var roles = await userManager.GetRolesAsync(user);

    return Ok(new
    {
        Token = token,
        user.Email,
        user.UserName,
        Roles = roles
    });
}

    [Authorize]
    [HttpGet("user-info")]
    public async Task<ActionResult> GetUserInfo()
    {
         var user = await userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        var roles = await userManager.GetRolesAsync(user);
        return Ok(new
        {
            user.Email,
            user.UserName,
            Roles = roles
        });
    }
    [HttpPost("logout")]
    public async Task<ActionResult> Logout()
    {
        await signInManager.SignOutAsync();
        return NoContent();
    }
    [Authorize]
    [HttpPost("address")]
    public async Task<ActionResult<Address>> CreateOrUpdateAdress(Address address)
    {
        var user = await signInManager.UserManager.Users.Include(x => x.Address).FirstOrDefaultAsync(x => x.UserName == User.Identity!.Name);

        if (user == null) return Unauthorized();
        user.Address = address;
        var result = await signInManager.UserManager.UpdateAsync(user);
        if (!result.Succeeded) return BadRequest("Problem updating address");
        return Ok(user.Address);
    }
    [Authorize]
    [HttpGet("address")]
    public async Task<ActionResult<Address>> GetSavedAddress()
    {
        var address = await signInManager.UserManager.Users.Where(x => x.UserName == User.Identity!.Name).Select(x => x.Address).FirstOrDefaultAsync();
        if (address == null) return NoContent();
        return address;
    }
}
