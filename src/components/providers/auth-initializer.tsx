// components/providers/auth-initializer.tsx
"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/redux/hooks";
import { setAuthFromStorage } from "@/redux/slices/authSlice";

export function AuthInitializer() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Initialize auth from localStorage on app load
    dispatch(setAuthFromStorage());
  }, [dispatch]);

  return null; // This component doesn't render anything
}
