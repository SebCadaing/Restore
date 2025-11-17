import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import { catalogAPI } from "../../features/catalog/catalogAPI";
import { uiSlice } from "../layout/uiSlice";
import { errorApi } from "../../features/about/errorApi";
import { basketApi } from "../../features/basket/basketApi";
import { catalogSlice } from "../../features/catalog/catalogSlice";
import { accountApi } from "../../features/account/accountApi";
import { checkoutApi } from "../../features/checkout/checkoutApi";
import { orderApi } from "../../features/orders/orderApi";
import { adminApi } from "../../features/admin/adminApi";
import { accountSlice } from "../../features/account/accountSlice";
import { checkoutSlice } from "../../features/checkout/checkoutSlice";

export const store = configureStore({
  reducer: {
    [catalogAPI.reducerPath]: catalogAPI.reducer,
    [errorApi.reducerPath]: errorApi.reducer,
    [basketApi.reducerPath]: basketApi.reducer,
    [accountApi.reducerPath]: accountApi.reducer,
    [checkoutApi.reducerPath]: checkoutApi.reducer,
    [orderApi.reducerPath]: orderApi.reducer,
    [adminApi.reducerPath]: adminApi.reducer,
    checkout: checkoutSlice.reducer,
    account: accountSlice.reducer,
    ui: uiSlice.reducer,
    catalog: catalogSlice.reducer,
  },
  middleware: (getDefaultMiddleWare) =>
    getDefaultMiddleWare().concat(
      catalogAPI.middleware,
      errorApi.middleware,
      basketApi.middleware,
      orderApi.middleware,
      accountApi.middleware,
      checkoutApi.middleware,
      adminApi.middleware
    ),
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
