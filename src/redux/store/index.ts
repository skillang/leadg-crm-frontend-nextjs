// src/redux/store/index.ts (UPDATED with Documents API)
import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { combineReducers } from "@reduxjs/toolkit";
import { leadsApi } from "../slices/leadsApi";
import { authApi } from "../slices/authApi";
import { notesApi } from "../slices/notesApi";
import { tasksApi } from "../slices/tasksApi";
import { documentsApi } from "../slices/documentsApi"; // NEW: Import documentsApi
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
  [notesApi.reducerPath]: notesApi.reducer,
  [tasksApi.reducerPath]: tasksApi.reducer,
  [documentsApi.reducerPath]: documentsApi.reducer, // NEW: Add documentsApi reducer
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
    }).concat(
      leadsApi.middleware,
      authApi.middleware,
      notesApi.middleware,
      tasksApi.middleware,
      documentsApi.middleware // NEW: Add documentsApi middleware
    ),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
