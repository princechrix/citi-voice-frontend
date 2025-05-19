"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";
import Image from "next/image";
import Logo from "@/assets/images/Logo.png";

// Dynamically import confetti to avoid SSR issues
const ReactConfetti = dynamic(() => import("react-confetti"), {
  ssr: false,
});

const SuccessVerification = () => {
  const router = useRouter();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // Set window dimensions
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
        numberOfPieces={200}
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
            <div className="p-3 bg-blue-50 rounded-full">
              <CheckCircle className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">
            Verification Successful!
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Please check your email for your new credentials. You can now sign
            in to your account.
          </p>
        </div>

        <div className="pt-4">
          <Button
            onClick={() => router.push("/signin")}
            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200 h-[45px] rounded-full"
          >
            Sign In
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SuccessVerification;
