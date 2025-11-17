import { Container, Card, CardContent, Stack, Avatar, Typography } from "@mui/material";

export default function AboutPage() {
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Card elevation={3}>
        <CardContent>
          <Stack spacing={2} alignItems="center">
            <Avatar alt="Restore Logo" src="/images/hero3.jpg" sx={{ width: 80, height: 80 }} />
            <Typography variant="h4" component="h1" gutterBottom>
              About Restore
            </Typography>
            <Typography variant="body1" align="center">
              Restore is a modern e-commerce platform built with React, Vite, and ASP.NET Core. Our mission is to provide a seamless shopping
              experience with secure payments, fast performance, and a clean user interface.
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Built by Sebastian Cadaing. Powered by Stripe for payments and Material UI for design consistency.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
