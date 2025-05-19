"use client";
import React, { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { isSidebarCollapsedAtom } from "@/store/sidebar";
import { loadUserAtom, logoutAtom, userAtom } from "@/store/auth";
import Sidebar from "./Sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { LogOut, User, Settings, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { toast } from "sonner";
import { formatRole } from "@/lib/utils";
import { CitiAIAssistant } from "@/components/CitiAIAssistant";
import Image from "next/image";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed] = useAtom(isSidebarCollapsedAtom);
  const router = useRouter();
  const [, loadUser] = useAtom(loadUserAtom);
  const [user, setUser] = useAtom(userAtom);
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    // Load user data from storage
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserInfo(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    
    loadUser();
  }, [loadUser]);

  const handleLogout = () => {
    // Set logout flag
    // Clear storage and state first
    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
    
    // Show success toast
    toast.success("Logged out successfully");
    sessionStorage.setItem('_isLoggingOut', 'true');
    
    // Navigate to signin
    router.push('/signin');
  };

  return (
    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "AGENCY_ADMIN", "STAFF"]}>
      <div className="flex min-h-screen gap-4 bg-gray-100">
        <Sidebar />
        <main
          className={`flex-1 h-screen transition-[margin] duration-300 ease-in-out ${
            isCollapsed ? "ml-[0]" : "ml-[0]"
          }`}
        >
          <div className="main-header-wrapper pt-[10px] pr-[20px]">
            <div className="header-wrapper w-full h-[60px] bg-white rounded-[16px] border border-border px-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {userInfo?.role === "SUPER_ADMIN" ? (
                    <>
                      <input
                        type="text"
                        placeholder="Search..."
                        className="w-[300px] h-[40px] pl-10 pr-4 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                      <svg
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                        {userInfo?.agency?.logoUrl ? (
                          <Image
                            src={userInfo.agency.logoUrl}
                            alt={`${userInfo.agency.name} logo`}
                            className="w-full h-full object-cover"
                            width={32}
                            height={32}
                          />
                        ) : (
                          <div className="text-[12px] font-semibold text-muted-foreground">
                            {userInfo?.agency?.acronym}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{userInfo?.agency?.name}</div>
                        <div className="text-sm text-muted-foreground">{userInfo?.agency?.description}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <CitiAIAssistant />
                <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                <Popover>
                  <PopoverTrigger asChild>
                    <div className="flex items-center gap-3 hover:bg-gray-50/80 p-2 rounded-lg transition-all duration-200 group cursor-pointer">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-2 ring-primary/10 group-hover:ring-primary/20 transition-all duration-200">
                          <span className="text-primary font-semibold text-sm">
                            { userInfo?.name?.charAt(0) }
                          </span>
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>
                      <div className="hidden md:block text-left">
                        <p className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors duration-200">
                          {userInfo?.name}
                        </p>
                        <p className="text-xs text-gray-500 group-hover:text-gray-600">
                          {formatRole(userInfo?.role)}
                        </p>
                      </div>
                      <svg
                        className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors duration-200"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2" align="end">
                    <div className="flex flex-col gap-1">
                      <Button
                        onClick={() => {
                          const role = userInfo?.role;
                          if (role === "SUPER_ADMIN") {
                            router.push('/admin/profile');
                          } else if (role === "AGENCY_ADMIN") {
                            router.push('/agency/profile');
                          } else {
                            router.push('/staff/profile');
                          }
                        }}
                        variant="ghost"
                        className="w-full justify-start gap-2"
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </Button>
                   
                      <div className="h-px bg-gray-200 my-1"></div>
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 text-red-600 hover:text-red-600 hover:bg-red-50"
                        onClick={handleLogout}
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <div className="wrapper h-[calc(100vh-70px)] pt-[10px] pr-[20px]">
            <ScrollArea className="h-full w-full rounded-[16px]">
              {children}
            </ScrollArea>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );  
}
