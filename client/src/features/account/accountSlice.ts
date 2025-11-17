import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "../../app/models/user";

type AccountState = {
  user: User | null;
};

const storedUser = localStorage.getItem("user");

const initialState: AccountState = {
  user: storedUser ? JSON.parse(storedUser) : null,
};

export const accountSlice = createSlice({
  name: "account",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      localStorage.setItem("user", JSON.stringify(action.payload));
    },
    logout: (state) => {
      state.user = null;
      localStorage.removeItem("user");
    },
  },
});

export const { setUser, logout } = accountSlice.actions;
