import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithErrorHandling } from "../../app/api/baseAPI";
import type { CreateOrder, Order } from "../../app/models/Order";

export const orderApi = createApi({
  reducerPath: "orderApi",
  baseQuery: baseQueryWithErrorHandling,
  tagTypes: ["Orders"],
  endpoints: (builder) => ({
    fetchOrders: builder.query<Order[], void>({
      query: () => "orders",
      providesTags: ["Orders"],
    }),
    fetchOrderDetails: builder.query<Order, number>({
      query: (id) => ({
        url: `orders/${id}`,
      }),
    }),
    fetchOrderByPaymentIntent: builder.query<Order, string>({
      query: (paymentIntentId) => ({
        url: `orders/by-intent/${paymentIntentId}`,
      }),
    }),

    createOrder: builder.mutation<Order, CreateOrder>({
      query: (order) => ({
        url: "orders",
        method: "POST",
        body: order,
      }),
      onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
        await queryFulfilled;
        dispatch(orderApi.util.invalidateTags(["Orders"]));
      },
    }),
  }),
});

export const { useFetchOrderDetailsQuery, useFetchOrdersQuery, useCreateOrderMutation, useFetchOrderByPaymentIntentQuery } = orderApi;
