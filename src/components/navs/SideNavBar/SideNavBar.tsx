"use client";

import React, { useState } from "react";
import {
  Settings,
  BarChart2,
  Contact,
  Users,
  LayoutDashboard,
  NotebookText,
  ChevronDown,
  ChevronRight,
  User,
  LogOut,
  UserCircle,
  UserPlus,
  Building2,
  FolderOpen,
  UsersRound,
  ChartPie,
  ArrowsUpFromLine,
  UserRoundCog,
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

// Import authentication hook
import { useAuth } from "@/redux/hooks/useAuth";

// Main menu items (non-admin)
const mainMenuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "My Leads",
    url: "/my-leads",
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
    adminOnly: true, // Only show to admins
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
  },
];

// User management dropdown items
const userMenuItems = [
  {
    title: "Users",
    url: "/admin/users",
    icon: UsersRound,
  },
  {
    title: "Register User",
    url: "/admin/register-user",
    icon: UserPlus,
  },
  {
    title: "Manage Departments",
    url: "/admin/departments",
    icon: Building2,
  },
];

// Lead Action dropdown items
const leadActionItems = [
  {
    title: "Lead Categories",
    url: "/admin/lead-categories",
    icon: FolderOpen,
  },
  {
    title: "Manage Stages",
    url: "/admin/stages",
    icon: ArrowsUpFromLine,
  },
  {
    title: "Manage Status",
    url: "/admin/status-management",
    icon: ChartPie,
  },
  {
    title: "Manage Edu Levels",
    url: "/admin/course-levels",
    icon: NotebookText,
  },
];

// Other admin items that don't fit in dropdowns
// const otherAdminItems = [
//   {
//     title: "Manage Departments",
//     url: "/admin/departments",
//     icon: Building2,
//   },
// ];

const SideNavBarComp = () => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Dropdown states
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isLeadActionDropdownOpen, setIsLeadActionDropdownOpen] =
    useState(false);

  // Get user data and logout function from auth hook
  const { user, logout, isAdmin, userName, userEmail } = useAuth();

  // Handle sign out
  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
      setIsUserMenuOpen(false);
    }
  };

  // Filter main menu items based on user role
  const filteredMainMenuItems = mainMenuItems.filter((item) => {
    if (item.adminOnly && !isAdmin) {
      return false;
    }
    return true;
  });

  return (
    <Sidebar>
      {/* Header */}
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="font-semibold text-lg">LeadG CRM</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Menu */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMainMenuItems.map((item) => (
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

        {/* Admin Features Section */}
        {isAdmin && (
          <SidebarGroup>
            <div className="px-2 py-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider border-t pt-2">
                Admin Features
              </div>
            </div>
            <SidebarGroupContent>
              <SidebarMenu>
                {/* User Dropdown */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    className="w-full justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <UserRoundCog />
                      <span>User Actions</span>
                    </div>
                    {isUserDropdownOpen ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </SidebarMenuButton>

                  {/* User Dropdown Items */}
                  {isUserDropdownOpen && (
                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-sidebar-border">
                      {userMenuItems.map((item) => (
                        <div key={item.title}>
                          <a
                            href={item.url}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors"
                          >
                            <item.icon className="w-4 h-4" />
                            <span>{item.title}</span>
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </SidebarMenuItem>

                {/* Lead Action Dropdown */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() =>
                      setIsLeadActionDropdownOpen(!isLeadActionDropdownOpen)
                    }
                    className="w-full justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Users />
                      <span>Lead Actions</span>
                    </div>
                    {isLeadActionDropdownOpen ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </SidebarMenuButton>

                  {/* Lead Action Dropdown Items */}
                  {isLeadActionDropdownOpen && (
                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-sidebar-border">
                      {leadActionItems.map((item) => (
                        <div key={item.title}>
                          <a
                            href={item.url}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors"
                          >
                            <item.icon className="w-4 h-4" />
                            <span>{item.title}</span>
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </SidebarMenuItem>

                {/* Other Admin Items */}
                {/* {otherAdminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <a href={item.url} className="relative">
                        <item.icon />
                        <span>{item.title}</span>
                        <span className="ml-auto text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                          Admin
                        </span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))} */}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-2 border-t">
        <div className="space-y-3">
          {/* User Account */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="w-full flex items-center justify-between p-2 hover:bg-accent rounded-lg transition-colors"
              disabled={isLoggingOut}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                  <UserCircle className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium">
                    {userName || "My account"}
                  </div>
                  <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                    {userEmail || "user@example.com"}
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
                  {/* User Info Header */}
                  <div className="px-3 py-2 border-b">
                    <div className="text-sm font-medium text-foreground">
                      {userName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {user?.department}
                    </div>
                  </div>

                  {/* Menu Items */}
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent rounded-md transition-colors">
                    <User className="w-4 h-4" />
                    <span className="text-sm">Profile</span>
                  </button>

                  <hr className="my-1" />

                  {/* Sign Out Button */}
                  <button
                    onClick={handleSignOut}
                    disabled={isLoggingOut}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-destructive/10 text-destructive rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoggingOut ? (
                      <>
                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-destructive border-t-transparent" />
                        <span className="text-sm">Signing out...</span>
                      </>
                    ) : (
                      <>
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm">Sign Out</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-around">
            {/* Status Indicator */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Online</span>
            </div>
            {/* Role Badge */}
            <div className="flex justify-center">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  isAdmin
                    ? "bg-purple-100 text-purple-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {user?.role
                  ? user.role.toLowerCase() === "user"
                    ? "Team Member"
                    : user.role.charAt(0).toUpperCase() + user.role.slice(1)
                  : "User"}
              </span>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default SideNavBarComp;
