"use client"
import React, { useEffect, useState } from 'react'
import { useApi } from '@/hooks/useApi'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { User, Mail, Shield, Calendar, CheckCircle2, Edit2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const nameSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters')
})

type NameFormData = z.infer<typeof nameSchema>

interface User {
  id: string
  name: string
  email: string
  role: string
  agencyId?: string
  isVerified: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const ProfilePage = () => {
  const { fetcher, patcher } = useApi()
  const [userId, setUserId] = useState<string | null>(null)
  const [isEditingName, setIsEditingName] = useState(false)
  const queryClient = useQueryClient()

  const form = useForm<NameFormData>({
    resolver: zodResolver(nameSchema),
    defaultValues: {
      name: ''
    }
  })

  // Get user ID from storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user') || sessionStorage.getItem('user')
      if (userData) {
        try {
          const user = JSON.parse(userData)
          setUserId(user.id)
        } catch (error) {
          console.error('Error parsing user data:', error)
        }
      }
    }
  }, [])

  // Fetch user details
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ['user', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID not found')
      const response = await fetcher(`/users/${userId}`)
      return response.data
    },
    enabled: !!userId
  })

  // Set form default value when user data is loaded
  useEffect(() => {
    if (user) {
      form.reset({ name: user.name })
    }
  }, [user, form])

  const onSubmit = async (data: NameFormData) => {
    try {
      if (!userId) throw new Error('User ID not found')
      
      await patcher(`/users/${userId}`, { name: data.name })
      
      // Update local storage
      const userData = localStorage.getItem('user') || sessionStorage.getItem('user')
      if (userData) {
        const parsedData = JSON.parse(userData)
        const updatedData = { ...parsedData, name: data.name }
        localStorage.setItem('user', JSON.stringify(updatedData))
        sessionStorage.setItem('user', JSON.stringify(updatedData))
      }

      // Invalidate and refetch user data
      await queryClient.invalidateQueries({ queryKey: ['user', userId] })
      
      setIsEditingName(false)
      toast.success('Name updated successfully')
    } catch (error) {
      console.error('Error updating name:', error)
      toast.error('Failed to update name')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-500 bg-red-50 p-4 rounded-lg shadow-sm"
        >
          Error loading user profile
        </motion.div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-gray-500 bg-gray-50 p-4 rounded-lg shadow-sm"
        >
          No user data found
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen  py-12">
      <div className="container ">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Profile Header */}
          <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold text-blue-600">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-gray-500 mt-1">{user.role}</p>
              </div>
            </div>
          </div>

          {/* Edit Name Dialog */}
          <Dialog open={isEditingName} onOpenChange={setIsEditingName}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Name</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditingName(false)
                        form.reset({ name: user.name })
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Save Changes</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Profile Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-gray-900">{user.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Status</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">Verification Status</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      user.isVerified 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.isVerified ? 'Verified' : 'Not Verified'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">Account Status</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      user.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Column */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Member Since</p>
                      <p className="text-gray-900">
                        {new Date(user.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Last Updated</p>
                      <p className="text-gray-900">
                        {new Date(user.updatedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default ProfilePage