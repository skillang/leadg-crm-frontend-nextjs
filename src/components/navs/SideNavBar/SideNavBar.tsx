"use client";

import React, { useState } from "react";
import {
  Settings,
  BarChart2,
  // Contact,
  Users,
  LayoutDashboard,
  NotebookText,
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
  ChevronUp,
  Globe,
  Mail,
  MessageSquareText,
  Zap,
  Phone,
  ChevronsLeftRightEllipsis,
  BellRingIcon,
  Facebook,
  UserPlus2,
  UserRoundMinus,
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Import authentication hook
import { useAuth } from "@/redux/hooks/useAuth";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

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
    title: "Notification",
    url: "/notifications",
    icon: BellRingIcon,
  },
  {
    title: "My Tasks",
    url: "/my-tasks",
    icon: NotebookText,
  },
  {
    title: "Call Logs",
    url: "/admin/call-dashboard",
    icon: ChevronsLeftRightEllipsis,
  },
  // {
  //   title: "Contacts",
  //   url: "#",
  //   icon: Contact,
  // },
  {
    title: "Reports",
    url: "#",
    icon: BarChart2,
    adminOnly: true,
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
  },
];

const LeadSourceItems = [
  {
    title: "FaceBook Leads",
    url: "/facebook-integration",
    icon: Facebook,
  },
  {
    title: "Unassigned Leads",
    url: "/admin/unassigned-leads",
    icon: UserRoundMinus,
  },
];

// Bulk Actions dropdown items
const bulkActionItems = [
  {
    title: "Email History",
    url: "/bulk/emails",
    icon: Mail,
    description: "View Email History of Bulk Mails sent to leads",
  },
  {
    title: "WA History",
    url: "/bulk/whatsapp",
    icon: MessageSquareText,
    description: "View WhatsApp History of Bulk Whatsapp Jobs sent to leads",
  },
  {
    title: "Bulk Caller",
    url: "#",
    icon: Phone,
    description: "Automated calling system (Coming Soon)",
    disabled: true,
  },
];

// User management dropdown items
const userMenuItems = [
  {
    title: "Register User",
    url: "/admin/register-user",
    icon: UserPlus,
  },
  {
    title: "Users",
    url: "/admin/users",
    icon: UsersRound,
  },
  {
    title: "User Departments",
    url: "/admin/departments",
    icon: Building2,
  },
  {
    title: "Tata Teli Users",
    url: "/admin/tata-teli-user-mapping",
    icon: ChevronsLeftRightEllipsis,
    adminOnly: true,
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
  {
    title: "Manage Sources",
    url: "/admin/lead-sources",
    icon: Globe,
    adminOnly: true,
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
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
        <div className="flex items-center space-x-2">
          <Image
            src="/logo.png"
            alt="LeadG CRM Logo"
            className=" logo-sidebar-img"
            width={95}
            height={15}
          />
          {/* <span className="font-bold text-2xl ml-2 text-gray-600">CRM</span> */}
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
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Bulk Actions with Collapsible Sub-Menu */}
              <Collapsible defaultOpen={false} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="w-full">
                      <Zap />
                      <span>Bulk History</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {bulkActionItems.map((item) => (
                        <SidebarMenuSubItem key={item.title}>
                          {item.disabled ? (
                            <SidebarMenuSubButton className="opacity-50 cursor-not-allowed pointer-events-none">
                              <item.icon />
                              <span>{item.title}</span>
                              <Badge className="text-xs px-1 py-0">Soon</Badge>
                            </SidebarMenuSubButton>
                          ) : (
                            <SidebarMenuSubButton asChild>
                              <Link href={item.url}>
                                <item.icon />
                                <span>{item.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          )}
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
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
                <Collapsible defaultOpen={true} className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="w-full">
                        <UserPlus2 />
                        <span>Lead Source</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {LeadSourceItems.map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton asChild>
                              <Link href={item.url}>
                                <item.icon />
                                <span>{item.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>

                {/* User Actions with Collapsible Sub-Menu */}
                <Collapsible defaultOpen={false} className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="w-full">
                        <UserRoundCog />
                        <span>User Actions</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {userMenuItems.map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton asChild>
                              <Link href={item.url}>
                                <item.icon />
                                <span>{item.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>

                {/* Lead Actions with Collapsible Sub-Menu */}
                <Collapsible defaultOpen={false} className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="w-full">
                        <Users />
                        <span>Lead Actions</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {leadActionItems.map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton asChild>
                              <Link href={item.url}>
                                <item.icon />
                                <span>{item.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-2 border-t">
        <div className="space-y-3">
          {/* User Account Dropdown */}
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="w-full justify-between"
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
                    <ChevronUp className="ml-auto w-4 h-4 text-muted-foreground" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  side="top"
                  align="center"
                  className="w-[--radix-popper-anchor-width] min-w-[245px]"
                >
                  {/* Profile Menu Item */}
                  <Link href="/profile">
                    <DropdownMenuItem className="cursor-pointer">
                      <User className="w-4 h-4 mr-2" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />

                  {/* Sign Out Button */}
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive hover:bg-red-100 data-[highlighted]:bg-red-100"
                    onClick={handleSignOut}
                    disabled={isLoggingOut}
                  >
                    {isLoggingOut ? (
                      <>
                        <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-destructive border-t-transparent" />
                        <span>Signing out...</span>
                      </>
                    ) : (
                      <>
                        <LogOut className="w-4 h-4 mr-2 text-destructive" />
                        <span>Sign Out</span>
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>

          {/* Status and Role Information */}
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
