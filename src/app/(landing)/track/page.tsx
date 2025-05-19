"use client"
import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { useApi } from '@/hooks/useApi'
import { toast } from 'sonner'

const TrackPageSearch = () => {
  const [trackingCode, setTrackingCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { fetcher } = useApi()

  const handleSearch = async () => {
    if (!trackingCode) return
    
    setIsLoading(true)
    try {
      const response = await fetcher(`/complaints/tracking/${trackingCode}`)
      
      if (response.success && response.data) {
        router.push(`/track/${trackingCode}?c=${response.data.id}`)
      } else {
        toast.error('No complaint found with this tracking code')
      }
    } catch (error) {
      console.error('Error searching complaint:', error)
      toast.error('Error searching for complaint')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="min-h-screen py-[100px] flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl px-4">
        <h1 className="text-3xl font-bold text-center mb-4">Track Your Complaint</h1>
        <p className="text-gray-600 text-center mb-8">
          Enter your tracking code below to check the status of your complaint. You can find your tracking code in the confirmation email we sent you.
        </p>
        <div className="relative">
          <Input
            type="text"
            placeholder="CITIVOICE-XXX-XXX-XXX-XXXX-XXX"
            className="w-full h-12 pr-32 rounded-full"
            value={trackingCode}
            onChange={(e) => setTrackingCode(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button
            className="absolute cursor-pointer right-1 top-1/2 -translate-y-1/2 h-10 px-6 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSearch}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth={2} 
                stroke="currentColor" 
                className="w-5 h-5"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" 
                />
              </svg>
            )}
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default TrackPageSearch;
