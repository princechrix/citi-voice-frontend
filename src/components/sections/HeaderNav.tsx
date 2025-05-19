"use client";
import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import Logo from "@/assets/images/Logo.png";
import Image from "next/image";
import { ArrowRight, Menu, X, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const HeaderNav = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/80 backdrop-blur-sm shadow-sm py-[15px]"
          : "bg-transparent py-[20px]"
      }`}
    >
      <div className="w-full flex items-center justify-between px-[8%]">
        <div className="left flex items-center gap-[30px]">
          <div className="logo-wrapper flex items-center gap-2">
            <Image src={Logo} alt="CitiVoice Logo" width={35} height={35} />
            <h1 className="font-space-grotesk text-2xl font-bold text-primary leading-[100%]">
              CitiVoice
            </h1>
          </div>
          <div className="nav-links hidden lg:flex items-center gap-2">
            <ul className="flex items-center gap-[30px] list-none">
              <Link href="/">
                <li className="font-public-sans text-sm font-semibold text-gray-500 leading-[100%] hover:text-primary transition-colors duration-300 relative after:content-[''] after:absolute after:w-0 after:h-[2px] after:bg-primary after:left-0 after:-bottom-1 after:transition-all after:duration-300 hover:after:w-full list-none">
                  Home
                </li>
              </Link>
              <Link href="/">
                <li className="font-public-sans text-sm font-semibold text-gray-500 leading-[100%] hover:text-primary transition-colors duration-300 relative after:content-[''] after:absolute after:w-0 after:h-[2px] after:bg-primary after:left-0 after:-bottom-1 after:transition-all after:duration-300 hover:after:w-full list-none">
                  How it works
                </li>
              </Link>
              <Link href="/">
                <li className="font-public-sans text-sm font-semibold text-gray-500 leading-[100%] hover:text-primary transition-colors duration-300 relative after:content-[''] after:absolute after:w-0 after:h-[2px] after:bg-primary after:left-0 after:-bottom-1 after:transition-all after:duration-300 hover:after:w-full list-none">
                  Terms of Service
                </li>
              </Link>
              <Link href="/">
                <li className="font-public-sans text-sm font-semibold text-gray-500 leading-[100%] hover:text-primary transition-colors duration-300 relative after:content-[''] after:absolute after:w-0 after:h-[2px] after:bg-primary after:left-0 after:-bottom-1 after:transition-all after:duration-300 hover:after:w-full list-none">
                  Privacy Policy
                </li>
              </Link>
            </ul>
          </div>
        </div>
        <div className="right hidden lg:flex items-center gap-2">
          <Link href="/complaint">
            <Button
              onClick={() => router.push("/complaint")}
              className="rounded-full h-[45px] cursor-pointer bg-transparent text-gray-500 border border-gray-500 font-semibold hover:border-primary hover:bg-primary/15 hover:text-primary transition-all duration-300 flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Submit Complaint
            </Button>
          </Link>
          <Link href="/signin">
          <Button className="rounded-full font-semibold hover:bg-blue-700 h-[45px] w-[100px] cursor-pointer flex items-center gap-2 group">
            Sign In
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>

        {/* Mobile Menu */}
        <div
          className={`lg:hidden absolute top-full backdrop-blur px-[4%] left-0 w-full bg-white shadow-lg transition-all duration-300 ${
            isMenuOpen ? "opacity-100 visible " : "opacity-0 invisible"
          }`}
        >
          <div className="flex flex-col p-4 gap-4">
            <Link href="/" className="w-full">
              <li className="font-public-sans text-sm font-semibold text-gray-500 leading-[100%] hover:text-primary transition-colors duration-300 py-2 list-none">
                Home
              </li>
            </Link>
            <Link href="/" className="w-full">
              <li className="font-public-sans text-sm font-semibold text-gray-500 leading-[100%] hover:text-primary transition-colors duration-300 py-2 list-none">
                How it works
              </li>
            </Link>
            <Link href="/" className="w-full">
              <li className="font-public-sans text-sm font-semibold text-gray-500 leading-[100%] hover:text-primary transition-colors duration-300 py-2 list-none">
                Terms of Service
              </li>
            </Link>
            <Link href="/" className="w-full">
              <li className="font-public-sans text-sm font-semibold text-gray-500 leading-[100%] hover:text-primary transition-colors duration-300 py-2 list-none">
                Privacy Policy
              </li>
            </Link>
            <div className="flex flex-col gap-2 pt-2 border-t">
              <Button className="w-full rounded-full h-[45px] cursor-pointer bg-transparent text-gray-500 border border-gray-500 font-semibold hover:border-primary hover:bg-primary/15 hover:text-primary transition-all duration-300 flex items-center justify-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Submit Complaint
              </Button>
              <Button className="w-full font-semibold rounded-full h-[45px] cursor-pointer flex items-center justify-center gap-2 group">
                Sign In
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeaderNav;
