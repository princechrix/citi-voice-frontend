import { atom } from "jotai";
import { Role } from "@/types/types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Agency = {
  id: string;
  name: string;
  acronym: string;
  description: string;
  logoUrl: string | null;
};

type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  isTempPassword: boolean;
  agencyId: string | null;
  agency: Agency | null;
  token: string;
};

export const userAtom = atom<User | null>(null);
export const isLoggingOutAtom = atom(false);

// Auto-load from localStorage on hydrate
export const loadUserAtom = atom(null, (_, set) => {
  // Check localStorage first
  const token = localStorage.getItem("_tk") || sessionStorage.getItem("_tk");
  const userData = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "null");

  if (token && userData) {
    setTimeout(() => set(userAtom, { ...userData, token }), 0);
  }
});

// Login helper
export const loginAtom = atom(
  null,
  (_, set, user: User) => {
    // Store in both localStorage and sessionStorage
    localStorage.setItem("_tk", user.token);
    localStorage.setItem("user", JSON.stringify(user));
    sessionStorage.setItem("_tk", user.token);
    sessionStorage.setItem("user", JSON.stringify(user));
    
    // Store in cookies for middleware access with secure options
    const cookieOptions = 'path=/; SameSite=Strict; secure';
    document.cookie = `_tk=${user.token}; ${cookieOptions}`;
    document.cookie = `user=${JSON.stringify(user)}; ${cookieOptions}`;
    
    set(userAtom, user);
  }
);

// Logout helper
export const logoutAtom = atom(null, (_, set) => {
  // Set logging out state
  set(isLoggingOutAtom, true);
  
  // Show toast notification
  toast.success("Logged out successfully");
  
  // Clear all storage
  localStorage.clear();
  sessionStorage.clear();
  
  // Clear cookies with proper options
  const cookieOptions = 'path=/; SameSite=Strict; secure';
  document.cookie = `_tk=; ${cookieOptions}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  document.cookie = `user=; ${cookieOptions}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  
  // Clear the user atom state
  set(userAtom, null);
});
