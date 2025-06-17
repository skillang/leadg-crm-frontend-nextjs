// src/redux/store/index.ts
import { configureStore } from "@reduxjs/toolkit";
import { leadsApi } from "../slices/leadsApi";
import leadsReducer from "../slices/leadsSlices";

export const store = configureStore({
  reducer: {
    // RTK Query API
    [leadsApi.reducerPath]: leadsApi.reducer,
    // UI state
    leads: leadsReducer,
  },
  // Adding the api middleware enables caching, invalidation, polling, and other useful features of RTK Query
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(leadsApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
