"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { IoArrowBack } from "react-icons/io5";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import Logo from "@/assets/images/Logo.png";
import { useApi } from "@/hooks/useApi";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";

const formSchema = z.object({
  newPassword: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

const NewPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { poster } = useApi();
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;
  const userId = params.userId as string;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as unknown as any,
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (!token || !userId) {
      setError("Invalid reset link. Please request a new password reset link.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      await poster("/auth/reset-password", {
        userId,
        token,
        newPassword: data.newPassword,
      });

      toast.success("Password has been reset successfully");
      router.push("/signin");
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || "Failed to reset password. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row">
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col space-y-6">
            <Link href="/" className="flex items-center space-x-2 w-fit">
              <IoArrowBack className="h-5 w-5" />
              <span>Back</span>
            </Link>
            <div className="logo-wrapper flex items-center gap-2">
              <Image src={Logo} alt="CitiVoice Logo" width={35} height={35} />
              <h1 className="font-space-grotesk text-2xl font-bold text-primary leading-[100%]">
                CitiVoice
              </h1>
            </div>
          </div>

          <div className="text-start">
            <h1 className="text-3xl font-bold text-gray-900">Set New Password</h1>
            <p className="mt-2 text-gray-600">
              Please enter your new password below.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                  {error}
                </div>
              )}
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type={showNewPassword ? "text" : "password"} 
                          placeholder="Enter new password" 
                          {...field} 
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showNewPassword ? (
                            <IoEyeOffOutline className="h-5 w-5" />
                          ) : (
                            <IoEyeOutline className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type={showConfirmPassword ? "text" : "password"} 
                          placeholder="Confirm new password" 
                          {...field} 
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showConfirmPassword ? (
                            <IoEyeOffOutline className="h-5 w-5" />
                          ) : (
                            <IoEyeOutline className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full h-[45px] rounded-full"
                disabled={isLoading}
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default NewPassword;
