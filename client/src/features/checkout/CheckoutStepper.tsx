// CheckoutStepper.tsx
import { Box, Button, FormControlLabel, Paper, Step, StepLabel, Stepper, Checkbox, Typography } from "@mui/material";
import { AddressElement, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useState, useCallback, useEffect } from "react";
import { useFetchAddressQuery, useUpdateUserAddressMutation } from "../account/accountApi";
import { useBasket } from "../../lib/hooks/useBasket";
import { currencyFormat } from "../../lib/util";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useCreateOrderMutation } from "../orders/orderApi";
import { useDispatch, useSelector } from "react-redux";
import { setBasket, setPaymentSummary, setShippingAddress } from "./checkoutSlice";
import type { RootState } from "../../app/store/store";
import type { ShippingAddress } from "../../app/models/Order";
import type { ConfirmationToken, StripeAddressElementChangeEvent, StripePaymentElementChangeEvent } from "@stripe/stripe-js";
import Review from "./Review";

const steps = ["Address", "Payment", "Review"];

export default function CheckoutStepper() {
  const [activeStep, setActiveStep] = useState(0);
  const { basket, total } = useBasket();
  const elements = useElements();
  const stripe = useStripe();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [saveAddressChecked, setSaveAddressChecked] = useState(false);
  const [addressComplete, setAddressComplete] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationToken, setConfirmationToken] = useState<ConfirmationToken | null>(null);

  const [createOrder] = useCreateOrderMutation();
  const [updateAddress] = useUpdateUserAddressMutation();
  const { data: userAddress, isLoading, refetch } = useFetchAddressQuery();

  const snapshot = useSelector((state: RootState) => state.checkout);

  const [defaultAddress, setDefaultAddress] = useState({
    name: "",
    address: { line1: "", line2: "", city: "", state: "", postal_code: "", country: "" },
  });

  useEffect(() => {
    if (userAddress) {
      setDefaultAddress({
        name: userAddress.name ?? "",
        address: {
          line1: userAddress.line1 ?? "",
          line2: userAddress.line2 ?? "",
          city: userAddress.city ?? "",
          state: userAddress.state ?? "",
          postal_code: userAddress.postal_code ?? "",
          country: userAddress.country ?? "",
        },
      });
    }
  }, [userAddress]);

  useEffect(() => {
    if (basket) dispatch(setBasket(basket));
  }, [basket, dispatch]);

  const getStripeAddress = useCallback(async (): Promise<ShippingAddress | null> => {
    const addressElement = elements?.getElement("address");
    if (!addressElement) return null;
    const { value } = await addressElement.getValue();
    const { name, address } = value;
    if (!name || !address) return null;
    return {
      name,
      line1: address.line1 ?? "",
      line2: address.line2 ?? "",
      city: address.city ?? "",
      state: address.state ?? "",
      postal_code: address.postal_code ?? "",
      country: address.country ?? "",
    };
  }, [elements]);

  const handleNext = async () => {
    try {
      if (activeStep === 0) {
        const address = await getStripeAddress();
        if (!address) return;

        if (saveAddressChecked) {
          try {
            await updateAddress(address).unwrap();
            toast.success("Default address saved");
            await refetch();
          } catch {
            toast.error("Failed to save default address");
          }
        }

        dispatch(setShippingAddress(address));
        if (!addressComplete) return;
      }

      if (activeStep === 1) {
        if (!elements || !stripe) return;
        const result = await elements.submit();
        if (result.error) return toast.error(result.error.message);

        const stripeResult = await stripe.createConfirmationToken({ elements });
        if (stripeResult.error) return toast.error(stripeResult.error.message);

        setConfirmationToken(stripeResult.confirmationToken);
        if (!paymentComplete) return;

        const paymentSummary = stripeResult.confirmationToken.payment_method_preview.card!;
        dispatch(setPaymentSummary(paymentSummary));
      }

      if (activeStep === 2) {
        await confirmPayment();
        return;
      }

      setActiveStep((prev) => prev + 1);
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
    }
  };

  const confirmPayment = async () => {
    setSubmitting(true);
    try {
      if (!confirmationToken || !basket?.clientSecret || !basket?.paymentIntentId) {
        throw new Error("Unable to process payment");
      }
      if (!snapshot.shippingAddress || !snapshot.paymentSummary) {
        throw new Error("Checkout snapshot incomplete");
      }
      console.log("Basket from useBasket:", basket);
      console.log("Snapshot from checkout slice:", snapshot.basket);

      await createOrder({
        shippingAddress: snapshot.shippingAddress,
        paymentSummary: snapshot.paymentSummary,
      }).unwrap();

      const paymentResult = await stripe?.confirmPayment({
        clientSecret: basket.clientSecret,
        redirect: "if_required",
        confirmParams: { confirmation_token: confirmationToken.id },
      });

      if (paymentResult?.paymentIntent?.status === "succeeded") {
        navigate("/checkout/success", { state: { paymentIntentId: basket.paymentIntentId } });
      } else if (paymentResult?.error) {
        throw new Error(paymentResult.error.message);
      } else {
        throw new Error("Payment failed");
      }
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
      setActiveStep((prev) => Math.max(0, prev - 1));
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) return <Typography variant="h6">Loading checkout...</Typography>;

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Stepper activeStep={activeStep}>
        {steps.map((label, i) => (
          <Step key={i}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ mt: 2 }}>
        {activeStep === 0 && (
          <>
            <AddressElement
              key={defaultAddress.address.line1 + defaultAddress.address.postal_code}
              options={{ mode: "shipping", defaultValues: defaultAddress }}
              onChange={(e: StripeAddressElementChangeEvent) => setAddressComplete(e.complete)}
            />
            <FormControlLabel
              sx={{ display: "flex", justifyContent: "end", mt: 2 }}
              control={<Checkbox checked={saveAddressChecked} onChange={(e) => setSaveAddressChecked(e.target.checked)} />}
              label="Save as default"
            />
          </>
        )}
        {activeStep === 1 && (
          <PaymentElement
            options={{ wallets: { applePay: "never", googlePay: "never" } }}
            onChange={(e: StripePaymentElementChangeEvent) => setPaymentComplete(e.complete)}
          />
        )}
        {activeStep === 2 && (
          <Review
            basket={snapshot.basket}
            shippingAddress={snapshot.shippingAddress}
            paymentSummary={snapshot.paymentSummary}
            title="Billing and delivery information"
          />
        )}
      </Box>

      <Box display="flex" pt={2} justifyContent="space-between">
        <Button onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))} disabled={activeStep === 0}>
          Back
        </Button>
        <Button disabled={submitting || (activeStep === 0 && !addressComplete) || (activeStep === 1 && !paymentComplete)} onClick={handleNext}>
          {activeStep === steps.length - 1 ? `Pay ${currencyFormat(total)}` : "Next"}
        </Button>
      </Box>
    </Paper>
  );
}
