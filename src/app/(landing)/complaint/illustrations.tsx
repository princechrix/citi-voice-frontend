"use client"

import { motion } from "framer-motion"

export function SubmitIllustration() {
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="30" cy="30" r="30" fill="#F8FAFC" />
      <motion.path
        d="M20 20H40V40H20V20Z"
        fill="#E2E8F0"
        initial={{ opacity: 0.7 }}
        animate={{ opacity: [0.7, 0.9, 0.7] }}
        transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
      />
      <motion.path
        d="M24 24H36V28H24V24Z"
        fill="#94A3B8"
        initial={{ width: 12 }}
        animate={{ width: [12, 12.5, 12] }}
        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
      />
      <motion.path
        d="M24 30H36V32H24V30Z"
        fill="#CBD5E1"
        initial={{ width: 12 }}
        animate={{ width: [12, 12.3, 12] }}
        transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse", delay: 0.5 }}
      />
      <motion.path
        d="M24 34H32V36H24V34Z"
        fill="#CBD5E1"
        initial={{ width: 8 }}
        animate={{ width: [8, 8.2, 8] }}
        transition={{ duration: 2.2, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse", delay: 1 }}
      />
      <motion.circle
        cx="42"
        cy="18"
        r="6"
        fill="#475569"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
      />
      <motion.path
        d="M40 18L42 20L44 18"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={{ strokeWidth: [1.5, 1.8, 1.5] }}
        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
      />
    </svg>
  )
}

export function AssignmentIllustration() {
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="30" cy="30" r="30" fill="#F8FAFC" />
      <motion.circle
        cx="24"
        cy="26"
        r="6"
        fill="#CBD5E1"
        animate={{ scale: [1, 1.03, 1] }}
        transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse", delay: 0.5 }}
      />
      <motion.path
        d="M20 36C20 33.7909 21.7909 32 24 32C26.2091 32 28 33.7909 28 36V38H20V36Z"
        fill="#94A3B8"
        animate={{ y: [0, -0.3, 0] }}
        transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse", delay: 0.5 }}
      />
      <motion.circle
        cx="36"
        cy="26"
        r="6"
        fill="#475569"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
      />
      <motion.path
        d="M32 36C32 33.7909 33.7909 32 36 32C38.2091 32 40 33.7909 40 36V38H32V36Z"
        fill="#334155"
        animate={{ y: [0, -0.5, 0] }}
        transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
      />
      <motion.path
        d="M30 22V42"
        stroke="#E2E8F0"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="2 2"
        animate={{ strokeDashoffset: [0, 4, 0] }}
        transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
      />
    </svg>
  )
}

export function TrackIllustration() {
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="30" cy="30" r="30" fill="#F8FAFC" />
      <motion.circle
        cx="30"
        cy="30"
        r="12"
        stroke="#CBD5E1"
        strokeWidth="2"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
      />
      <motion.path
        d="M30 22V30L36 34"
        stroke="#475569"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
      />
      <motion.circle
        cx="30"
        cy="30"
        r="3"
        fill="#475569"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
      />
      <motion.path
        d="M42 18L44 20L46 18"
        stroke="#475569"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={{ y: [0, -1, 0] }}
        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
      />
    </svg>
  )
}