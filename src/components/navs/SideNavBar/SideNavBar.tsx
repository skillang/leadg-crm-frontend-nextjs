"use client";

import React, { useState } from "react";
import {
  Settings,
  BarChart2,
  Contact,
  NotebookText,
  Users,
  LayoutDashboard,
  Bell,
  ChevronDown,
  User,
  LogOut,
  UserCircle,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

// Menu items
const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "My Leads",
    url: "/sample-table",
    icon: Users,
  },
  {
    title: "My Tasks",
    url: "#",
    icon: NotebookText,
  },
  {
    title: "Contacts",
    url: "#",
    icon: Contact,
  },
  {
    title: "Reports",
    url: "#",
    icon: BarChart2,
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
  },
];

const SideNavBarComp = () => {
  const [notificationCount, setNotificationCount] = useState(3);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Mock user data - replace with actual user context
  const currentUser = {
    name: "John Doe",
    email: "myaccount@gmail.com",
    avatar: null,
    role: "Admin",
  };

  return (
    <Sidebar>
      {/* Header */}
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="font-semibold text-lg">leadG</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-4 border-t">
        <div className="space-y-3">
          {/* Notifications */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Notifications</span>
            </div>
            <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs font-medium">
              {notificationCount}
            </span>
          </div>

          {/* User Account */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="w-full flex items-center justify-between p-2 hover:bg-accent rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                  <UserCircle className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium">My account</div>
                  <div className="text-xs text-muted-foreground">
                    {currentUser.email}
                  </div>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground transition-transform ${
                  isUserMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* User Dropdown */}
            {isUserMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-background border rounded-lg shadow-lg z-50">
                <div className="p-2 space-y-1">
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent rounded-md">
                    <User className="w-4 h-4" />
                    <span className="text-sm">Profile</span>
                  </button>
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent rounded-md">
                    <Settings className="w-4 h-4" />
                    <span className="text-sm">Settings</span>
                  </button>
                  <hr className="my-1" />
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-destructive/10 text-destructive rounded-md">
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Role Badge */}
          <div className="flex justify-center">
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
              {currentUser.role}
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default SideNavBarComp;
