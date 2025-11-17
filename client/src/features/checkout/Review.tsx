// Review.tsx
import { Box, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from "@mui/material";
import { currencyFormat } from "../../lib/util";
import type { Basket, Item } from "../../app/models/basket";
import type { ShippingAddress, PaymentSummary, Order } from "../../app/models/Order";

type ReviewProps = {
  basket?: Basket | null;
  shippingAddress?: ShippingAddress | null;
  paymentSummary?: PaymentSummary | null;
  order?: Order;
  title?: string;
};

// Normalize backend order items to Item[]
function mapOrderToItems(order: Order): Item[] {
  return order.orderItems.map((oi) => ({
    productId: oi.productId,
    name: oi.name,
    type: "",
    price: oi.price,
    pictureURL: oi.pictureUrl,
    brand: "",
    quantity: oi.quantity,
  }));
}

export default function Review({ basket, shippingAddress, paymentSummary, order, title = "Billing and delivery information" }: ReviewProps) {
  const items: Item[] = order ? mapOrderToItems(order) : basket?.items ?? [];
  const address = shippingAddress ?? order?.shippingAddress ?? null;
  const payment = paymentSummary ?? order?.paymentSummary ?? null;

  if (items.length === 0) {
    return <Typography mt={4}>Your basket is empty</Typography>;
  }

  return (
    <Box mt={4} width="100%">
      <Typography variant="h6" fontWeight="bold">
        {title}
      </Typography>

      <dl>
        <Typography component="dt" fontWeight="medium">
          Shipping Address
        </Typography>
        <Typography component="dd" mt={1} color="textSecondary">
          {address
            ? `${address.name}, ${address.line1}${address.line2 ? `, ${address.line2}` : ""}, ${address.city}, ${address.state}, ${
                address.postal_code
              }, ${address.country}`
            : "Shipping address unavailable"}
        </Typography>

        <Typography component="dt" fontWeight="medium" mt={2}>
          Payment Details
        </Typography>
        <Typography component="dd" mt={1} color="textSecondary">
          {payment
            ? `${payment.brand.toUpperCase()}, **** **** **** ${payment.last4}, Exp: ${payment.exp_month}/${payment.exp_year}`
            : "Payment info unavailable"}
        </Typography>
      </dl>

      <Box mt={4}>
        <TableContainer>
          <Table>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.productId} sx={{ borderBottom: "1px solid rgba(224,224,224,1)" }}>
                  <TableCell sx={{ py: 3 }}>
                    <Box display="flex" gap={3} alignItems="center">
                      <img src={item.pictureURL} alt={item.name} style={{ width: 40, height: 40, objectFit: "cover" }} />
                      <Typography>{item.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center" sx={{ p: 3 }}>
                    x {item.quantity}
                  </TableCell>
                  <TableCell align="right" sx={{ p: 3 }}>
                    {currencyFormat(item.price * item.quantity)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}
