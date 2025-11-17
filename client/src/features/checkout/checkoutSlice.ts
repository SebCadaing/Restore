import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Basket } from "../../app/models/basket";
import type { ShippingAddress, PaymentSummary } from "../../app/models/Order";

export type CheckoutSnapshotState = {
  basket: Basket | null;
  shippingAddress: ShippingAddress | null;
  paymentSummary: PaymentSummary | null;
};

const initialState: CheckoutSnapshotState = {
  basket: null,
  shippingAddress: null,
  paymentSummary: null,
};

export const checkoutSlice = createSlice({
  name: "checkout",
  initialState,
  reducers: {
    setBasket: (state, action: PayloadAction<Basket>) => {
      state.basket = {
        ...state.basket,
        ...action.payload,
      };
    },
    setShippingAddress: (state, action: PayloadAction<ShippingAddress>) => {
      state.shippingAddress = action.payload;
    },
    setPaymentSummary: (state, action: PayloadAction<PaymentSummary>) => {
      state.paymentSummary = action.payload;
    },
    clearSnapshot: (state) => {
      state.basket = null;
      state.shippingAddress = null;
      state.paymentSummary = null;
    },
  },
});

export const { setBasket, setShippingAddress, setPaymentSummary, clearSnapshot } = checkoutSlice.actions;
