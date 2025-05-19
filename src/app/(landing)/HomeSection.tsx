"use client";
import React from "react";
import Image from "next/image";
import blob from "../../assets/images/blob.png";
import systemScreenshot from "../../assets/images/dashImage.png";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Search, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const HomeSection = () => {
  const router = useRouter();
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div className="container mx-auto px-[8%] py-16 relative z-[12]">
        <div className="max-w-5xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold mb-6 leading-[100%] tracking-wide"
          >
            Your Voice Matters
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-600 mb-8 leading-[150%] tracking-wide md:px-[15%]"
          >
            CitiVoice connects citizens with government agencies to address public concerns and improve communities.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-2 justify-center mb-12"
          >
            <Link href="/complaint" className="bg-transparent px-5 h-[45px] rounded-full cursor-pointer text-gray-500 border border-gray-500 font-semibold hover:border-primary hover:bg-primary/15 hover:text-primary transition-all duration-300 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Submit a Complaint
            </Link>
            <Link href="/track" className="bg-blue-600 font-semibold cursor-pointer text-white !px-5 h-[45px] rounded-full hover:bg-blue-700 transition-colors flex items-center gap-2">
              <Search className="w-4 h-4" />
              Track Status
            </Link>
          </motion.div>
          <div className="relative w-full flex justify-center">
            {/* MacBook Frame */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="relative w-[90%] max-w-[900px]"
            >
              {/* MacBook Top Bar */}
              <div className="h-7 bg-gradient-to-b from-gray-900 to-gray-800 rounded-t-xl relative shadow-lg">
                {/* Camera */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gray-600"></div>
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-gray-400"></div>
              </div>
              {/* MacBook Screen */}
              <div className="bg-gray-800 p-3 rounded-b-xl shadow-2xl">
                <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-gray-900">
                  {/* Browser Interface */}
                  <div className="absolute inset-0 flex flex-col">
                    {/* Browser Controls */}
                    <div className="h-10 bg-gray-800 border-b border-gray-700 flex items-center px-4 gap-2">
                      {/* Window Controls */}
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                      </div>
                      {/* Search Bar */}
                      <div className="flex-1 mx-4 h-6 bg-gray-700 rounded-full flex items-center px-3">
                        <div className="w-3 h-3 rounded-full bg-gray-500 mr-2"></div>
                        <div className="text-xs text-gray-400">citivoice.gov</div>
                      </div>
                      {/* Browser Icons */}
                      <div className="flex gap-2">
                        <div className="w-4 h-4 rounded-full bg-gray-600"></div>
                        <div className="w-4 h-4 rounded-full bg-gray-600"></div>
                        <div className="w-4 h-4 rounded-full bg-gray-600"></div>
                      </div>
                    </div>
                    {/* Content Area */}
                    <div className="flex-1 relative bg-white">
                      <Image
                        src={systemScreenshot}
                        alt="CitiVoice System Screenshot"
                        fill
                        className="object-cover w-full h-full"
                        sizes="(max-width: 900px) 100vw, 900px"
                        priority
                      />
                    </div>
                  </div>
                </div>
              </div>
              {/* MacBook Base */}
              <div className="h-10 bg-gradient-to-b from-gray-800 to-gray-900 rounded-b-xl relative shadow-lg">
                <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-40 h-1.5 bg-gray-700 rounded-b-xl"></div>
                <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-20 h-0.5 bg-gray-600 rounded-b-xl"></div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      <div className="blob-image absolute bottom-[105px] left-[-140px] z-[1]">
        <Image src={blob} width={400} height={400} alt="blob" />
      </div>
      <div className="blob-image absolute top-[-15px] right-[-305px] z-[1]">
        <Image src={blob} width={500} height={500} alt="blob" />
      </div>
    </div>
  );
};

export default HomeSection;
