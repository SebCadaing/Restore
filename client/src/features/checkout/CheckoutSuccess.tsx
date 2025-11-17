import { useEffect } from "react";
import { useLocation, Navigate, Link } from "react-router-dom";
import { Box, Button, CircularProgress, Container, Divider, Paper, Typography } from "@mui/material";
import { useFetchOrderByPaymentIntentQuery } from "../orders/orderApi";
import { skipToken } from "@reduxjs/toolkit/query";
import { useBasket } from "../../lib/hooks/useBasket";
import { currencyFormat, formatPaymentString, formatAddressString } from "../../lib/util";
import { format } from "date-fns"; // ✅ import date-fns

type LocationState = { paymentIntentId?: string };

export default function CheckoutSuccess() {
  const { state } = useLocation();
  const { paymentIntentId } = (state as LocationState) || {};
  const { clearBasket } = useBasket();

  const { data: order, isLoading, isError } = useFetchOrderByPaymentIntentQuery(paymentIntentId ?? skipToken);

  useEffect(() => {
    if (order) {
      clearBasket();
    }
  }, [order, clearBasket]);

  if (!paymentIntentId) {
    return <Navigate to="/orders" replace />;
  }

  if (isLoading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !order) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height="50vh">
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Unable to load your order
          </Typography>
          <Typography color="textSecondary">Please try again or view your orders.</Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Container maxWidth="md">
      <>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Thank you for your Order
        </Typography>
        <Typography variant="body1" color="textSecondary" gutterBottom>
          Your order <strong>#{order.id}</strong>
        </Typography>

        <Paper
          elevation={1}
          sx={{
            p: 2,
            mb: 2,
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
          }}
        >
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="textSecondary">
              Order Date
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {format(new Date(order.orderDate), "dd MMM yyyy")}
            </Typography>
          </Box>
          <Divider />
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="textSecondary">
              Payment method
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {formatPaymentString(order.paymentSummary)}
            </Typography>
          </Box>
          <Divider />
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="textSecondary">
              Shipping Address
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {formatAddressString(order.shippingAddress)}
            </Typography>
          </Box>
          <Divider />
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="textSecondary">
              Amount
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {currencyFormat(order.total)}
            </Typography>
          </Box>
        </Paper>

        <Box display="flex" justifyContent="flex-start" gap={2}>
          <Button variant="contained" color="primary" component={Link} to={`/orders/${order.id}`}>
            View your order
          </Button>
          <Button component={Link} to="/catalog" variant="outlined" color="primary">
            Continue Shopping
          </Button>
        </Box>
      </>
    </Container>
  );
}
