import React from "react";
import "./TopBar.css";

const TopBarComp = () => {
  // Get current URL path (fallback method without router dependency)
  const getCurrentPath = () => {
    if (typeof window !== "undefined") {
      return window.location.pathname;
    }
    return "/dashboard"; // fallback
  };

  // Get current date and format it
  const getCurrentDate = () => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    };
    return today.toLocaleDateString("en-US", options);
  };

  // Convert URL path to readable title
  const getPageTitle = () => {
    const path = getCurrentPath();

    // Remove leading slash and split by '/'
    const segments = path.replace(/^\//, "").split("/");
    const lastSegment = segments[segments.length - 1];

    // Handle empty path (home/dashboard)
    if (!lastSegment || lastSegment === "") {
      return "Dashboard";
    }

    // Convert kebab-case or snake_case to Title Case
    const title = lastSegment
      .replace(/[-_]/g, " ") // Replace hyphens and underscores with spaces
      .replace(/([a-z])([A-Z])/g, "$1 $2") // Handle camelCase
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

    return title;
  };

  return (
    <div className="w-full top-bar">
      <h3 className="text-xl font-semibold text-foreground">
        {getPageTitle()}
      </h3>
      <p className="text-sm text-muted-foreground">{getCurrentDate()}</p>
    </div>
  );
};

export default TopBarComp;
