"use client"
import HeaderNav from '@/components/sections/HeaderNav'
import FooterSection from '@/components/sections/FooterSection'
import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const Layout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter()
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
  return (
    <div className='font-public-sans '>
      <HeaderNav />
      {children}
      <FooterSection />
    </div>
  )
}

export default Layout