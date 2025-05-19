"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    // Get user from storage
    const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!userStr) {
      router.push("/signin");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.role !== "SUPER_ADMIN") {
        toast.error("You don't have permission to access this page");
        // Redirect based on role
        if (user.role === "AGENCY_ADMIN") {
          router.push("/agency/dashboard");
        } else {
          router.push("/staff/dashboard");
        }
      }
    } catch (error) {
      router.push("/signin");
    }
  }, [router]);

  return <>{children}</>;
}
