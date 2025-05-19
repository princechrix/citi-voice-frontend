"use client"
import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { IoArrowBack } from 'react-icons/io5'
import { Eye, EyeOff, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import Logo from "@/assets/images/Logo.png"
import dashImage from "@/assets/images/dashImage.png"
import dashImage1 from "@/assets/images/dashImage1.png"
import { useMutation } from '@tanstack/react-query'
import { useApi } from '@/hooks/useApi'
import { useRouter } from 'next/navigation'
import { useSetAtom } from 'jotai'
import { loginAtom } from '@/store/auth'
import { toast } from 'sonner'

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  remember: z.boolean().default(false),
})

type FormValues = z.infer<typeof formSchema>

const SignIn = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const { poster } = useApi()
  const router = useRouter()
  const login = useSetAtom(loginAtom)

  useEffect(() => {
    // Check if user is already logged in
    const localToken = localStorage.getItem("_tk")
    const sessionToken = sessionStorage.getItem("_tk")
    const token = localToken || sessionToken
    
    if (token) {
      const userStr = localStorage.getItem("user") || sessionStorage.getItem("user")
      if (userStr) {
        const user = JSON.parse(userStr)
        if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
          router.push('/admin/dashboard')
        } else {
          router.push('/staff/dashboard')
        }
      }
    }
  }, [router])

  const features = [
    {
      title: "Empower Your Voice",
      description: "Make a difference in your community by submitting and tracking complaints in real-time. Your feedback matters.",
      image: dashImage
    },
    {
      title: "Direct Communication",
      description: "Connect directly with government agencies and get timely responses to your concerns.",
      image: dashImage1
    },
    {
      title: "Track Progress",
      description: "Stay informed about your complaint status with our real-time tracking system.",
      image: dashImage
    }
  ]

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % features.length)
  }, [features.length])

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + features.length) % features.length)
  }

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000)
    return () => clearInterval(timer)
  }, [nextSlide])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  })

  const loginMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const { remember, ...loginData } = data
      const response = await poster('/auth/login', loginData)
      return { ...response, remember }
    },
    onSuccess: async (data) => {
      toast.dismiss('login')
      
      // Check if user is staff and account is deactivated
      if (data.user.role === 'STAFF' && !data.user.isActive) {
        toast.error('Your account has been deactivated. If you believe this is a mistake, please contact your agency administrator.')
        return
      } else if (data.user.role === 'AGENCY_ADMIN' && !data.user.isActive) {
        toast.error('Your account has been deactivated. If you believe this is a mistake, please contact a citivoice administrator.')
        return
      }
      
      const storage = data.remember ? localStorage : sessionStorage
      
      // Clear any existing tokens
      localStorage.removeItem('_tk')
      localStorage.removeItem('user')
      sessionStorage.removeItem('_tk')
      sessionStorage.removeItem('user')
      
      // Set new tokens
      storage.setItem('_tk', data.access_token)
      storage.setItem('user', JSON.stringify(data.user))
      
      // Update auth state
      login({ ...data.user, token: data.access_token })
      
      toast.success('Login successful!')
      
      // Wait for state to be updated
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Redirect based on role
      if (data.user.role === 'SUPER_ADMIN') {
        router.push('/admin/dashboard')
      } else if (data.user.role === 'AGENCY_ADMIN') {
        router.push('/agency/dashboard')
      } else {
        router.push('/staff/dashboard')
      }
    },
    onError: (error: any) => {
      toast.dismiss('login')
      const errorMessage = error?.message || 'Login failed. Please try again.'
      toast.error(errorMessage)
    }
  })

  const onSubmit = (data: FormValues) => {
    toast.loading('Signing in...', { id: 'login' })
    loginMutation.mutate(data)
  }

  return (
    <div className='min-h-screen w-full flex flex-col lg:flex-row'>
      
      {/* Left side - Form */}
      <div className='w-full lg:w-1/2 flex items-center justify-center p-8'>
        <div className='w-full max-w-md space-y-8'>
          <div className='flex flex-col space-y-6'>
            <Link href="/" className='flex items-center space-x-2 w-fit'>
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

          <div className='text-start'>
            <h1 className='text-3xl font-bold text-gray-900'>Sign in to your account</h1>
            <p className='mt-2 text-gray-600'>Please sign in to your account</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="Enter your password" 
                          {...field} 
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='flex items-center justify-between'>
                <FormField
                  control={form.control}
                  name="remember"
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-center space-x-2 space-y-0'>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className='text-sm font-normal'>
                        Remember me
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <Link href="/reset" className='text-sm text-blue-600 hover:text-blue-500'>
                  Forgot password?
                </Link>
              </div>
              <Button 
                type="submit" 
                className='w-full font-semibold h-[45px] rounded-full bg-blue-600 hover:bg-blue-700'
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>

      {/* Right side - Visual */}
      <div className='hidden lg:block w-1/2 bg-blue-600 relative overflow-hidden'>
        <div className='absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800'>
          {/* Grid Pattern */}
          <div className='absolute inset-0 bg-[url("/grid.svg")] opacity-10'></div>
          {/* Dots Pattern */}
          <div className='absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,#ffffff_1px,transparent_0)] bg-[size:40px_40px] opacity-5'></div>
          {/* City Skyline Pattern */}
          <div className='absolute inset-0 opacity-10'>
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* City Buildings */}
              <path d="M0,70 L5,70 L5,40 L10,40 L10,60 L15,60 L15,30 L20,30 L20,50 L25,50 L25,45 L30,45 L30,65 L35,65 L35,35 L40,35 L40,55 L45,55 L45,25 L50,25 L50,45 L55,45 L55,40 L60,40 L60,60 L65,60 L65,30 L70,30 L70,50 L75,50 L75,35 L80,35 L80,55 L85,55 L85,25 L90,25 L90,45 L95,45 L95,70 L100,70 L100,100 L0,100 Z" fill="white" />
              {/* Windows */}
              <g fill="white" opacity="0.3">
                <rect x="7" y="45" width="2" height="2" />
                <rect x="12" y="65" width="2" height="2" />
                <rect x="17" y="35" width="2" height="2" />
                <rect x="22" y="55" width="2" height="2" />
                <rect x="27" y="50" width="2" height="2" />
                <rect x="32" y="70" width="2" height="2" />
                <rect x="37" y="40" width="2" height="2" />
                <rect x="42" y="60" width="2" height="2" />
                <rect x="47" y="30" width="2" height="2" />
                <rect x="52" y="50" width="2" height="2" />
                <rect x="57" y="45" width="2" height="2" />
                <rect x="62" y="65" width="2" height="2" />
                <rect x="67" y="35" width="2" height="2" />
                <rect x="72" y="55" width="2" height="2" />
                <rect x="77" y="40" width="2" height="2" />
                <rect x="82" y="60" width="2" height="2" />
                <rect x="87" y="30" width="2" height="2" />
                <rect x="92" y="50" width="2" height="2" />
              </g>
            </svg>
          </div>
          {/* Circles Pattern */}
          <div className='absolute inset-0'>
            <div className='absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-white/5 blur-3xl'></div>
            <div className='absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-white/5 blur-3xl'></div>
          </div>
          {/* Gradient Overlay */}
          <div className='absolute inset-0 bg-gradient-to-t from-black/50 to-transparent'></div>
        </div>
        <div className='relative h-full flex flex-col items-center justify-center text-white p-12'>
          <div className='max-w-lg text-center'>
            {/* Feature Slider */}
            <div className='relative'>
              <div className='overflow-hidden'>
                <div 
                  className='flex transition-transform duration-500 ease-in-out'
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {features.map((feature, index) => (
                    <div 
                      key={index} 
                      className='w-full flex-shrink-0 px-4'
                    >
                      <div className='space-y-6'>
                        <div className='relative w-full h-48 mb-6 rounded-lg overflow-hidden'>
                          <Image
                            src={feature.image}
                            alt={feature.title}
                            fill
                            className='object-cover'
                          />
                        </div>
                        <h2 className='text-4xl font-bold'>{feature.title}</h2>
                        <p className='text-lg text-blue-100'>
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Slide Indicators with Navigation */}
              <div className='flex items-center justify-center gap-4 mt-8'>
                <button
                  onClick={prevSlide}
                  className='bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors'
                >
                  <ChevronLeft className='h-6 w-6' />
                </button>
                <div className='flex gap-2'>
                  {features.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        currentSlide === index ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={nextSlide}
                  className='bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors'
                >
                  <ChevronRight className='h-6 w-6' />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignIn;
