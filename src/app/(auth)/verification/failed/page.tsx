"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Logo from "@/assets/images/Logo.png";

// Dynamically import confetti to avoid SSR issues
const ReactConfetti = dynamic(() => import("react-confetti"), {
  ssr: false,
});

const FailedVerification = () => {
  const router = useRouter();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <ReactConfetti
        width={dimensions.width}
        height={dimensions.height}
        recycle={false}
        numberOfPieces={100}
        colors={["#ef4444", "#f87171", "#fca5a5"]}
      />

      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <Image
            src={Logo}
            alt="CitiVoice Logo"
            width={48}
            height={48}
            className="object-contain"
          />
          <span className="text-2xl font-bold text-blue-700 tracking-tight">
            CitiVoice
          </span>
        </div>
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-red-50 rounded-full">
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">
            Verification Failed
          </h2>
          <p className="text-gray-600">We couldn&apos;t verify your email address.</p>
        </div>

        <div className="pt-4">
          <Button
            onClick={() => router.push("/signin")}
            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white transition-colors duration-200 h-[45px] rounded-full"
          >
            Back to Sign In
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FailedVerification;
