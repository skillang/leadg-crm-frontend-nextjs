// src/redux/store/index.ts
import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { combineReducers } from "@reduxjs/toolkit";
import { leadsApi } from "../slices/leadsApi";
import { authApi } from "../slices/authApi";
import leadsReducer from "../slices/leadsSlices";
import authReducer from "../slices/authSlice";

// Persist configuration - only persist auth state
const persistConfig = {
  key: "leadg-crm",
  storage,
  whitelist: ["auth"], // Only persist auth state
  blacklist: ["leads"], // Don't persist leads UI state
};

// Combine reducers
const rootReducer = combineReducers({
  // RTK Query APIs
  [leadsApi.reducerPath]: leadsApi.reducer,
  [authApi.reducerPath]: authApi.reducer,
  // UI state
  leads: leadsReducer,
  auth: authReducer,
});

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  // Adding the api middleware enables caching, invalidation, polling, and other useful features of RTK Query
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          "persist/PERSIST",
          "persist/REHYDRATE",
          "persist/REGISTER",
          "persist/PURGE",
          "persist/FLUSH",
          "persist/PAUSE",
        ],
      },
    }).concat(leadsApi.middleware, authApi.middleware),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
