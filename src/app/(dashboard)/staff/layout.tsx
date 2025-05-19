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
      if (user.role !== "STAFF") {
        toast.error("You don't have permission to access this page");
        // Redirect based on role
        if (user.role === "SUPER_ADMIN") {
          router.push("/admin/dashboard");
        } else {
          router.push("/agency/dashboard");
        }
      }
    } catch (error) {
      router.push("/signin");
    }
  }, [router]);

  return <>{children}</>;
}
