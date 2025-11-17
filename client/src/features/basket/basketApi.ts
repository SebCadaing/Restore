import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithErrorHandling } from "../../app/api/baseAPI";
import { Item, type Basket } from "../../app/models/basket";
import type { Product } from "../../app/models/product";

function isBasketItem(product: Product | Item): product is Item {
  return (product as Item).quantity !== undefined;
}

export const basketApi = createApi({
  reducerPath: "basketApi",
  baseQuery: baseQueryWithErrorHandling,
  tagTypes: ["Basket"],
  endpoints: (builder) => ({
    fetchBasket: builder.query<Basket, void>({
      query: () => "basket",
      providesTags: ["Basket"],
    }),

    addBasketItem: builder.mutation<Basket, { product: Product | Item; quantity: number }>({
      query: ({ product, quantity }) => {
        const productId = isBasketItem(product) ? product.productId : product.id;
        return {
          url: `basket?productId=${productId}&quantity=${quantity}`,
          method: "POST",
        };
      },
      onQueryStarted: async ({ product, quantity }, { dispatch, queryFulfilled }) => {
        const patchResult = dispatch(
          basketApi.util.updateQueryData("fetchBasket", undefined, (draft) => {
            if (!draft) return;
            const productId = isBasketItem(product) ? product.productId : product.id;
            const existingItem = draft.items.find((item) => item.productId === productId);
            if (existingItem) existingItem.quantity += quantity;
            else draft.items.push(isBasketItem(product) ? product : { ...product, productId: product.id, quantity });
          })
        );

        try {
          await queryFulfilled;
          dispatch(basketApi.util.invalidateTags(["Basket"]));
        } catch (error) {
          console.log(error);
          patchResult.undo();
        }
      },
    }),

    removeBasketItem: builder.mutation<void, { productId: number; quantity: number }>({
      query: ({ productId, quantity }) => ({
        url: `basket?productId=${productId}&quantity=${quantity}`,
        method: "DELETE",
      }),
      onQueryStarted: async ({ productId, quantity }, { dispatch, queryFulfilled }) => {
        const patchResult = dispatch(
          basketApi.util.updateQueryData("fetchBasket", undefined, (draft) => {
            const itemIndex = draft.items.findIndex((item) => item.productId === productId);
            if (itemIndex >= 0) {
              draft.items[itemIndex].quantity -= quantity;
              if (draft.items[itemIndex].quantity <= 0) {
                draft.items.splice(itemIndex, 1);
              }
            }
          })
        );
        try {
          await queryFulfilled;
          dispatch(basketApi.util.invalidateTags(["Basket"]));
        } catch (error) {
          console.log(error);
          patchResult.undo();
        }
      },
    }),

    cleaBasket: builder.mutation<void, void>({
      queryFn: () => ({ data: undefined }),
      onQueryStarted: async (_, { dispatch }) => {
        dispatch(
          basketApi.util.updateQueryData("fetchBasket", undefined, (draft) => {
            draft.items = [];
            draft.coupon = null;
            draft.clientSecret = undefined;
            draft.paymentIntentId = undefined;
          })
        );
      },
    }),

    addCoupon: builder.mutation<Basket, string>({
      query: (code: string) => ({
        url: `basket/${code}`,
        method: "POST",
      }),
      onQueryStarted: async (_NEVER, { dispatch, queryFulfilled }) => {
        const { data: updatedBasket } = await queryFulfilled;
        dispatch(
          basketApi.util.updateQueryData("fetchBasket", undefined, (draft) => {
            Object.assign(draft, updatedBasket);
          })
        );
      },
    }),

    removeCoupon: builder.mutation<Basket, void>({
      query: () => ({
        url: "basket/remove-coupon",
        method: "DELETE",
      }),
      onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
        await queryFulfilled;
        dispatch(
          basketApi.util.updateQueryData("fetchBasket", undefined, (draft) => {
            draft.coupon = null;
          })
        );
      },
    }),
  }),
});

export const {
  useFetchBasketQuery,
  useAddBasketItemMutation,
  useRemoveBasketItemMutation,
  useCleaBasketMutation,
  useAddCouponMutation,
  useRemoveCouponMutation,
} = basketApi;
