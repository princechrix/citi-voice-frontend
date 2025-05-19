"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  House,
  Buildings,
  Users,
  List,
  Chat,
  CaretRight,
  X,
  Eye,
  EyeSlash,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAtom } from "jotai";
import { isSidebarCollapsedAtom } from "@/store/sidebar";
import logo from "@/assets/images/Logo.png";
import { useApi } from "@/hooks/useApi";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const getUserRole = () => {
  const userStr =
    localStorage.getItem("user") || sessionStorage.getItem("user");
  if (!userStr) return null;
  try {
    const user = JSON.parse(userStr);
    return user.role;
  } catch (error) {
    return null;
  }
};

const getUserData = () => {
  const userStr =
    localStorage.getItem("user") || sessionStorage.getItem("user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (error) {
    return null;
  }
};

const ChangePasswordDialog = ({ isOpen, onClose, onPasswordChanged }: { 
  isOpen: boolean; 
  onClose: () => void;
  onPasswordChanged: () => void;
}) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { poster } = useApi();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const userData = getUserData();
      await poster("/auth/reset-password", {
        userId: userData?.id,
        token: userData?.token,
        newPassword,
      });
      
      // Update isTempPassword in storage
      const storage = localStorage.getItem("user") ? localStorage : sessionStorage;
      const updatedUserData = { ...userData, isTempPassword: false };
      storage.setItem("user", JSON.stringify(updatedUserData));
      
      toast.success("Password changed successfully");
      onClose();
      onPasswordChanged();
    } catch (error) {
      toast.error("Failed to change password");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                type={showNewPassword ? "text" : "password"}
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showNewPassword ? (
                  <EyeSlash size={20} weight="regular" />
                ) : (
                  <Eye size={20} weight="regular" />
                )}
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? (
                  <EyeSlash size={20} weight="regular" />
                ) : (
                  <Eye size={20} weight="regular" />
                )}
              </button>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" className="w-full">
              Change Password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const Sidebar = () => {
  const [role, setRole] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useAtom(isSidebarCollapsedAtom);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const [userData, setUserData] = useState<any>(null);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setIsCollapsed]);

  useEffect(() => {
    setRole(getUserRole());
  }, []);

  useEffect(() => {
    setUserData(getUserData());
  }, []);

  const getNavLinks = () => {
    const baseLinks = [
      { name: "Dashboard", icon: House, href: `/${role == "SUPER_ADMIN" ? "admin" : role == "AGENCY_ADMIN" ? "agency" : "staff"}/dashboard` },
    ];

    if (role === "SUPER_ADMIN") {
      return [
        ...baseLinks,
        { name: "Agencies", icon: Buildings, href: "/admin/agencies" },
        { name: "Users", icon: Users, href: "/admin/users" },
        {
          name: "Complaints Categories",
          icon: List,
          href: "/admin/categories",
        },
        { name: "Complaints", icon: Chat, href: "/admin/complaints" },
      ];
    } else if (role === "AGENCY_ADMIN") {
      return [
        ...baseLinks,
        { name: "Users", icon: Users, href: "/agency/users" },
        { name: "Complaints", icon: Chat, href: "/agency/complaints" },
      ];
    } else if (role === "STAFF") {
      return [
        ...baseLinks,
        { name: "Complaints", icon: Chat, href: "/staff/complaints" },
      ];
    }

    return baseLinks;
  };

  const navLinks = getNavLinks();

  const handlePasswordChanged = () => {
    setUserData(getUserData());
  };

  return (
    <>
      {!isCollapsed && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}
      <div
        className={`wrapper p-[10px] h-screen ${isMobile ? "fixed z-50" : ""}`}
      >
        <div
          className={`border h-full bg-white border-border rounded-[16px] transition-[width,padding,transform] duration-300 ease-in-out ${
            isCollapsed ? "w-[76px] p-[16px]" : "w-[280px] p-[24px]"
          } ${
            isMobile && !isCollapsed
              ? "translate-x-0"
              : isMobile && isCollapsed
              ? "-translate-x-full"
              : ""
          } flex flex-col`}
        >
          <div
            className={`sidebar-header pb-[24px] ${
              isCollapsed ? "flex items-center justify-center" : "pb-[24px]"
            }`}
          >
            <div className="sidebar-header-logo flex items-center gap-[8px] relative">
              <Image
                src={logo}
                alt="logo"
                width={32}
                height={32}
                style={{ height: "auto" }}
              />
              {!isCollapsed && (
                <>
                  <h1 className="font-space-grotesk text-[20px] font-bold text-primary leading-[100%] transition-opacity duration-300">
                    CitiVoice
                  </h1>
                </>
              )}

              <div
                className={`sidebar-header-menu-button absolute cursor-pointer bg-white flex items-center justify-center border border-border h-[24px] w-[24px] rounded-full transition-[right] duration-300 ease-in-out ${
                  isCollapsed ? "right-[-95%]" : "right-[-15%]"
                }`}
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                <CaretRight
                  className={`w-[16px] h-[16px] text-primary transition-transform duration-300 ease-in-out ${
                    isCollapsed ? "rotate-[0]" : "rotate-[-180deg]"
                  }`}
                  weight="regular"
                />
              </div>
            </div>
          </div>

          <nav className="space-y-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center whitespace-nowrap gap-3 text-[14px] font-medium h-[44px] rounded-full transition-all duration-300 ease-in-out ${
                    isCollapsed ? "p-[12px]" : "px-[16px] py-[12px]"
                  } ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-[#64748B] hover:bg-primary/10 hover:text-primary"
                  }`}
                  title={isCollapsed ? link.name : undefined}
                >
                  <link.icon className="!w-[20px] !h-[20px]" weight="regular" />
                  {!isCollapsed && (
                    <span className="transition-opacity duration-300">
                      {link.name}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {(userData?.isTempPassword && !isCollapsed) && (
            <div className="mt-auto pt-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm font-medium">
                  Temporary Password Detected
                </p>
                <p className="text-red-500 text-xs mt-1">
                  Please change your password for security reasons
                </p>
                <button
                  onClick={() => setIsChangePasswordOpen(true)}
                  className="mt-2 block w-full text-center text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg px-3 py-2 transition-colors duration-200"
                >
                  Change Password
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <ChangePasswordDialog 
        isOpen={isChangePasswordOpen} 
        onClose={() => setIsChangePasswordOpen(false)}
        onPasswordChanged={handlePasswordChanged}
      />
    </>
  );
};

export default Sidebar;
