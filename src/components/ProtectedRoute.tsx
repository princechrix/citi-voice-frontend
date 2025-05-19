"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { userAtom, loadUserAtom } from "@/store/auth";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Role } from "@/types/types";
import { toast } from "sonner";

export default function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: ("SUPER_ADMIN" | "AGENCY_ADMIN" | "STAFF")[];
}) {    
  const user = useAtomValue(userAtom);
  const loadUser = useSetAtom(loadUserAtom);
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser(); // load on hydration
    setIsMounted(true);
    // Give time for the user data to be loaded
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, [loadUser]);

  useEffect(() => {
    if (!isLoading && isMounted) {
      if (!user) {
        
        // Check if we're logging out
        const isLoggingOut = sessionStorage.getItem("_isLoggingOut") === "true";

        // // Only show toast if we're not logging out and not on signin page
        // if (!isLoggingOut && pathname !== '/signin') {
        //   toast.error("Please login to access this page");
        // }
        console.log(isLoggingOut);

        if (!isLoggingOut) {
          toast.error("Please login to access this page");
        }

        router.push("/signin");

        // Clear the logout flag
        sessionStorage.removeItem("_isLoggingOut");

        return;
      }

      if (
        allowedRoles &&
        user.role &&
        !allowedRoles.includes(user.role as Role)
      ) {
        toast.error("You don't have permission to access this page");
        router.replace("/unauthorized");
      }
    }
  }, [user, isLoading, isMounted, pathname, router, allowedRoles]);

  // Show nothing while loading or not mounted
  if (isLoading || !isMounted) return null;

  // Show nothing if no user or unauthorized
  if (!user || (allowedRoles && !allowedRoles.includes(user.role as Role)))
    return null;

  return <>{children}</>;
}
