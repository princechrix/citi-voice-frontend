"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useApi } from "@/hooks/useApi";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";

interface ComplaintHistory {
  id: string;
  complaintId: string;
  fromUserId: string | null;
  toUserId: string;
  fromAgencyId: string | null;
  toAgencyId: string;
  action: string;
  metadata: any;
  timestamp: string;
  complaint: {
    id: string;
    subject: string;
    trackingCode: string;
    status: string;
  };
  fromUser: {
    id: string;
    name: string;
    email: string;
  } | null;
  toUser: {
    id: string;
    name: string;
    email: string;
  };
  fromAgency: {
    id: string;
    name: string;
    acronym: string;
    logoUrl: string;
  } | null;
  toAgency: {
    id: string;
    name: string;
    acronym: string;
    logoUrl: string;
  };
}

interface Complaint {
  id: string;
  subject: string;
  description: string;
  citizenEmail: string;
  citizenName: string;
  trackingCode: string;
  categoryId: string;
  agencyId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  agency: {
    id: string;
    name: string;
    acronym: string;
    isActive: boolean;
    description: string;
    logoUrl: string;
    createdAt: string;
  };
  category: {
    id: string;
    name: string;
    description: string;
    createdAt: string;
    primaryAgencyId: string;
  };
}

const ComplaintDetailsContent = () => {
  const params = useParams();
  const trackingCode = params.trackingCode as string;
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [history, setHistory] = useState<ComplaintHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { fetcher } = useApi();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetcher(`/complaints/tracking/${trackingCode}`);
        
        if (!response.success || !response.data) {
          throw new Error('Complaint not found');
        }

        const complaintData = response.data;
        const historyResponse = await fetcher(`/complaint-history/${complaintData.id}`);
        
        setComplaint(complaintData);
        setHistory(historyResponse.data || []);
      } catch (err) {
        setError('Failed to load complaint details');
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [trackingCode]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600">{error || 'Complaint not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto pt-[100px]">
        <Link 
          href="/track"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Search
        </Link>
        {/* Complaint Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-2xl font-bold mb-4">Complaint Details</h1>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Tracking Code</p>
              <p className="font-semibold">{complaint.trackingCode}</p>
            </div>
            <div>
              <p className="text-gray-600">Status</p>
              <p className="font-semibold">{complaint.status}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-600">Subject</p>
              <p className="font-semibold">{complaint.subject}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-600">Description</p>
              <p className="font-semibold">{complaint.description}</p>
            </div>
            <div>
              <p className="text-gray-600">Agency</p>
              <div className="flex items-center gap-3">
                {complaint.agency.logoUrl && (
                  <Image 
                    src={complaint.agency.logoUrl} 
                    alt={`${complaint.agency.name} logo`}
                    width={32}
                    height={32}
                    className="object-contain rounded"
                  />
                )}
                <p className="font-semibold">{complaint.agency.name}</p>
              </div>
            </div>
            <div>
              <p className="text-gray-600">Category</p>
              <p className="font-semibold">{complaint.category.name}</p>
            </div>
            <div>
              <p className="text-gray-600">Submitted On</p>
              <p className="font-semibold">
                {new Date(complaint.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6">Complaint Timeline</h2>
          <div className="space-y-6">
            {history
              .filter(item => 
                item.action === 'ASSIGNED' || 
                item.action === 'IN_PROGRESS' || 
                (item.action === 'REASSIGNED' && item.fromAgency?.id !== item.toAgency.id) ||
                item.action === 'RESOLVED' ||
                item.action === 'TRANSFERRED' ||
                item.action === 'REJECTED'
              )
              .map((item, index, filteredHistory) => (
              <div key={item.id} className="relative pl-8">
                {/* Timeline line */}
                {index !== filteredHistory.length - 1 && (
                  <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-gray-200" />
                )}
                {/* Timeline dot */}
                <div className="absolute left-0 top-2 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-white" />
                </div>
                <div>
                  <p className="font-semibold">{item.action}</p>
                  <p className="text-gray-600 text-sm mb-2">
                    {new Date(item.timestamp).toLocaleString()}
                  </p>
                  <div className="text-gray-700 space-y-1">
                    {item.action === 'ASSIGNED' && (
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          {item.toAgency.logoUrl && (
                            <Image 
                              src={item.toAgency.logoUrl} 
                              alt={`${item.toAgency.name} logo`}
                              width={24}
                              height={24}
                              className="object-contain rounded"
                            />
                          )}
                          <p>Assigned to: {item.toAgency.name} ({item.toAgency.acronym})</p>
                        </div>
                        {item.metadata && (
                          <p className="text-gray-600 text-sm mt-1">Reason: &quot;{item.metadata}&quot;</p>
                        )}
                      </div>
                    )}
                    {item.action === 'REASSIGNED' && item.fromAgency?.id !== item.toAgency.id && (
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          {item.fromAgency?.logoUrl && (
                            <Image 
                              src={item.fromAgency.logoUrl} 
                              alt={`${item.fromAgency?.name} logo`}
                              width={24}
                              height={24}
                              className="object-contain rounded"
                            />
                          )}
                          <p>From: {item.fromAgency?.name} ({item.fromAgency?.acronym})</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.toAgency.logoUrl && (
                            <Image 
                              src={item.toAgency.logoUrl} 
                              alt={`${item.toAgency.name} logo`}
                              width={24}
                              height={24}
                              className="object-contain rounded"
                            />
                          )}
                          <p>To: {item.toAgency.name} ({item.toAgency.acronym})</p>
                        </div>
                        {item.metadata && (
                          <p className="text-gray-600 text-sm mt-1">Reason: &quot;{item.metadata}&quot;</p>
                        )}
                      </div>
                    )}
                    {item.action === 'IN_PROGRESS' && (
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          {item.toAgency.logoUrl && (
                            <Image 
                              src={item.toAgency.logoUrl} 
                              alt={`${item.toAgency.name} logo`}
                              width={24}
                              height={24}
                              className="object-contain rounded"
                            />
                          )}
                          <p>Status updated to In Progress by {item.toAgency.name}</p>
                        </div>
                        {item.metadata && (
                          <p className="text-gray-600 text-sm mt-1">Reason: &quot;{item.metadata}&quot;</p>
                        )}
                      </div>
                    )}
                    {item.action === 'RESOLVED' && (
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          {item.toAgency.logoUrl && (
                            <Image 
                              src={item.toAgency.logoUrl} 
                              alt={`${item.toAgency.name} logo`}
                              width={24}
                              height={24}
                              className="object-contain rounded"
                            />
                          )}
                          <p>Resolved by {item.toAgency.name}</p>
                        </div>
                        {item.metadata && (
                          <p className="text-gray-600 text-sm mt-1">Reason: &quot;{item.metadata}&quot;</p>
                        )}
                      </div>
                    )}
                    {item.action === 'TRANSFERRED' && (
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          {item.fromAgency?.logoUrl && (
                            <Image 
                              src={item.fromAgency.logoUrl} 
                              alt={`${item.fromAgency?.name} logo`}
                              width={24}
                              height={24}
                              className="object-contain rounded"
                            />
                          )}
                          <p>Transferred from: {item.fromAgency?.name} ({item.fromAgency?.acronym})</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.toAgency.logoUrl && (
                            <Image 
                              src={item.toAgency.logoUrl} 
                              alt={`${item.toAgency.name} logo`}
                              width={24}
                              height={24}
                              className="object-contain rounded"
                            />
                          )}
                          <p>To: {item.toAgency.name} ({item.toAgency.acronym})</p>
                        </div>
                        {item.metadata && (
                          <p className="text-gray-600 text-sm mt-1">Reason: &quot;{item.metadata}&quot;</p>
                        )}
                      </div>
                    )}
                    {item.action === 'REJECTED' && (
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          {item.toAgency.logoUrl && (
                            <Image 
                              src={item.toAgency.logoUrl} 
                              alt={`${item.toAgency.name} logo`}
                              width={24}
                              height={24}
                              className="object-contain rounded"
                            />
                          )}
                          <p>Rejected by {item.toAgency.name}</p>
                        </div>
                        {item.metadata && (
                          <p className="text-gray-600 text-sm mt-1">Reason: &quot;{item.metadata}&quot;</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

const ComplaintDetailsPage = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ComplaintDetailsContent />
    </Suspense>
  );
};

export default ComplaintDetailsPage;
