"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle, Mail, ArrowLeft, Copy } from "lucide-react";
import Link from "next/link";
import Confetti from "react-confetti";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/hooks/useApi";
import Image from "next/image";

interface Complaint {
  id: string;
  trackingCode: string;
  subject: string;
  description: string;
  citizenName: string;
  citizenEmail: string;
  category: {
    name: string;
  };
  agency: {
    name: string;
    logoUrl: string;
  };
  status: string;
  createdAt: string;
}

const SuccessPage = () => {
  const params = useParams();
  const complaintId = params.id as string;
  const { fetcher } = useApi();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: complaint, isLoading } = useQuery<Complaint>({
    queryKey: ["complaint", complaintId],
    queryFn: async () => {
      const response = await fetcher(`/complaints/${complaintId}`);
      return response.data;
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const copyToClipboard = () => {
    if (complaintId) {
      navigator.clipboard.writeText(complaintId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-[100px] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="min-h-screen py-[100px] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Complaint Not Found</h1>
          <p className="text-gray-600 mb-4">The complaint you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Link href="/complaint">
            <Button className="h-[45px] bg-primary text-white rounded-full hover:bg-blue-700 cursor-pointer font-semibold">
              Submit New Complaint
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-[100px] relative overflow-hidden">
      {mounted && <Confetti className="absolute inset-0 w-screen h-screen" recycle={false} numberOfPieces={200} />}
      <div className="container px-[8%] max-w-2xl mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Complaint Submitted Successfully!
            </h1>
            <p className="text-gray-600">
              Thank you for your submission. We&apos;ve sent the tracking details to your email.
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700 mb-2">
                <Mail className="h-5 w-5" />
                <h3 className="font-semibold">Tracking Information</h3>
              </div>
              <p className="text-sm text-blue-600">
                We&apos;ve sent the tracking code to your email address. You can use this code to track the status of your complaint.
              </p>
            </div>

            <div className="border rounded-lg p-4 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Tracking Code</h3>
                <div className="flex items-center gap-4">
                  <p className="text-lg font-semibold text-gray-900">{complaint.trackingCode}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={copyToClipboard}
                    className="h-8 w-8 hover:bg-gray-100"
                  >
                    {copied ? (
                      <span className="text-xs text-green-600">Copied!</span>
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Submitted By</h3>
                <p className="text-gray-900">{complaint.citizenName}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Category</h3>
                <p className="text-gray-900">{complaint.category.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Agency</h3>
                <div className="flex items-center gap-3">
                  {complaint.agency.logoUrl && (
                    <Image 
                      src={complaint.agency.logoUrl} 
                      alt={`${complaint.agency.name} logo`}
                      className="w-8 h-8 object-contain rounded"
                      width={32}
                      height={32}
                    />
                  )}
                  <p className="text-gray-900">{complaint.agency.name}</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
                <p className="text-gray-900">{complaint.description}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                <p className="text-gray-900">{complaint.status}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Link href={`/track/${complaint.trackingCode}`} className="w-full">
                <Button className="w-full h-[45px] bg-primary text-white rounded-full hover:bg-blue-700 cursor-pointer font-semibold">
                  Track Complaint Status
                </Button>
              </Link>
              <Link href="/complaint" className="w-full">
                <Button variant="outline" className="w-full h-[45px] rounded-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Submit Another Complaint
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage; 