// src/components/auth/TokenExpirationMonitor.tsx

"use client";

import React, { useEffect, useRef } from "react";
import { useAuth } from "@/redux/hooks/useAuth";
import { useAppDispatch } from "@/redux/hooks";
import { initializeTokenTimestamp } from "@/redux/slices/authSlice";

interface TokenExpirationMonitorProps {
  children: React.ReactNode;
  warningThresholdMinutes?: number; // Show warning when token expires in X minutes
  autoLogoutEnabled?: boolean; // Automatically logout when token expires
}

const TokenExpirationMonitor: React.FC<TokenExpirationMonitorProps> = ({
  children,
  warningThresholdMinutes = 5,
  autoLogoutEnabled = true,
}) => {
  const dispatch = useAppDispatch();
  const {
    isAuthenticated,
    isTokenExpired,
    isTokenExpiringSoon,
    forceLogout,
    expiresIn,
    tokenCreatedAt,
  } = useAuth();

  const warningShownRef = useRef(false);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize token timestamp on mount
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(initializeTokenTimestamp());
    }
  }, [dispatch, isAuthenticated]);

  // Monitor token expiration
  useEffect(() => {
    if (!isAuthenticated || !expiresIn || !tokenCreatedAt) return;

    const checkTokenStatus = () => {
      // Check if token is expired
      if (isTokenExpired()) {
        // console.log("🚨 Token expired, forcing logout");
        if (autoLogoutEnabled) {
          forceLogout();
        }
        return;
      }

      // Check if token is expiring soon and show warning
      if (isTokenExpiringSoon() && !warningShownRef.current) {
        // console.log("⚠️ Token expiring soon, showing warning");
        showExpirationWarning();
        warningShownRef.current = true;
      }
    };

    // Initial check
    checkTokenStatus();

    // Set up interval to check every minute
    checkIntervalRef.current = setInterval(checkTokenStatus, 60000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [
    isAuthenticated,
    expiresIn,
    tokenCreatedAt,
    isTokenExpired,
    isTokenExpiringSoon,
    forceLogout,
    autoLogoutEnabled,
  ]);

  // Clean up on logout
  useEffect(() => {
    if (!isAuthenticated) {
      warningShownRef.current = false;
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    }
  }, [isAuthenticated]);

  const showExpirationWarning = () => {
    const extendSession = window.confirm(
      `⚠️ Your session will expire in ${warningThresholdMinutes} minutes.\n\nClick OK to extend your session, or Cancel to logout now.`
    );

    if (extendSession) {
      // User wants to extend session - make a simple API call to refresh activity
      // This could be a "ping" endpoint or just fetching user data
      // console.log("🔄 User requested session extension");

      // Reset warning flag so they can be warned again later
      warningShownRef.current = false;

      // You could make an API call here to extend the session
      // For example: refetchUserData() or pingServer()
    } else {
      // User chose to logout
      // console.log("🚪 User chose to logout");
      forceLogout();
    }
  };

  const calculateTimeRemaining = (): string => {
    if (!tokenCreatedAt || !expiresIn) return "Unknown";

    const createdTime = tokenCreatedAt;
    const currentTime = Date.now();
    const expirationTime = createdTime + expiresIn * 1000;
    const timeRemaining = expirationTime - currentTime;

    if (timeRemaining <= 0) return "Expired";

    const minutesRemaining = Math.floor(timeRemaining / (1000 * 60));
    const hoursRemaining = Math.floor(minutesRemaining / 60);

    if (hoursRemaining > 0) {
      return `${hoursRemaining}h ${minutesRemaining % 60}m`;
    }
    return `${minutesRemaining}m`;
  };

  // Debug component - remove in production or make conditional
  const DebugTokenInfo: React.FC = () => {
    if (process.env.NODE_ENV !== "development" || !isAuthenticated) return null;

    return (
      <div className="fixed bottom-4 right-4 bg-black text-white p-2 rounded text-xs z-50 max-w-xs">
        <div>🔐 Token Debug Info:</div>
        <div>Expires in: {calculateTimeRemaining()}</div>
        <div>Expired: {isTokenExpired() ? "Yes" : "No"}</div>
        <div>Expiring soon: {isTokenExpiringSoon() ? "Yes" : "No"}</div>
        {tokenCreatedAt && (
          <div>Created: {new Date(tokenCreatedAt).toLocaleTimeString()}</div>
        )}
        {expiresIn && <div>Lifetime: {Math.floor(expiresIn / 60)}m</div>}
      </div>
    );
  };

  return (
    <>
      {children}
      <DebugTokenInfo />
    </>
  );
};

export default TokenExpirationMonitor;
