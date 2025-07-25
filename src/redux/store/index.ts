// src/redux/store/index.ts (UPDATED with StatusesApi)
import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { combineReducers } from "@reduxjs/toolkit";
import { leadsApi } from "../slices/leadsApi";
import { authApi } from "../slices/authApi";
import { notesApi } from "../slices/notesApi";
import { tasksApi } from "../slices/tasksApi";
import { documentsApi } from "../slices/documentsApi";
import { timelineApi } from "../slices/timelineApi";
import { contactsApi } from "../slices/contactsApi";
import { categoriesApi } from "../slices/categoriesApi";
import { stagesApi } from "../slices/stagesApi";
import { statusesApi } from "../slices/statusesApi"; // ADDED: Import statusesApi
import leadsReducer from "../slices/leadsSlices";
import authReducer from "../slices/authSlice";
import whatsappReducer from "../slices/whatsappSlice";
import { whatsappApi } from "../slices/whatsappApi";
import { courseLevelsApi } from "../slices/courseLevelsApi";
import { experienceLevelsApi } from "../slices/experienceLevelsApi";
import { sourcesApi } from "../slices/sourcesApi";
import emailReducer from "../slices/emailSlice";
import { emailApi } from "../slices/emailApi";

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
  [documentsApi.reducerPath]: documentsApi.reducer,
  [timelineApi.reducerPath]: timelineApi.reducer,
  [contactsApi.reducerPath]: contactsApi.reducer,
  [categoriesApi.reducerPath]: categoriesApi.reducer,
  [stagesApi.reducerPath]: stagesApi.reducer,
  [statusesApi.reducerPath]: statusesApi.reducer,
  [experienceLevelsApi.reducerPath]: experienceLevelsApi.reducer,
  whatsapp: whatsappReducer, // ADD THIS
  whatsappApi: whatsappApi.reducer,
  [courseLevelsApi.reducerPath]: courseLevelsApi.reducer,
  [sourcesApi.reducerPath]: sourcesApi.reducer,
  // UI state
  leads: leadsReducer,
  auth: authReducer,
  email: emailReducer,
  emailApi: emailApi.reducer,
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
      documentsApi.middleware,
      timelineApi.middleware,
      contactsApi.middleware,
      categoriesApi.middleware,
      stagesApi.middleware,
      statusesApi.middleware,
      courseLevelsApi.middleware,
      experienceLevelsApi.middleware,
      whatsappApi.middleware,
      sourcesApi.middleware,
      emailApi.middleware // Add email API middleware
    ),
});

export const persistor = persistStore(store);
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
