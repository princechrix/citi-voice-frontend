import React from "react";
import Logo from "../../assets/images/logo-gray.png";
import Image from "next/image";
import { FaHeart, FaBug, FaCoffee } from "react-icons/fa";

const FooterSection = () => {
  return (
    <footer className="bg-gray-900/6 text-white py-6">
      <div className="container  px-[8%]">
        <div className="flex flex-col md:flex-row items-center justify-between ">
          {/* Logo */}
          <div className="flex items-center">
            <Image src={Logo} alt="Citi Voice Logo" height={30} width={30} />
          </div>

          {/* Copyright */}
          <div className="text-gray-400 text-sm pl-[80px] flex flex-col items-center gap-1 text-center">
            <span className="flex items-center gap-1">
              Built with <FaHeart className="text-gray-400" /> and{" "}
              <FaCoffee className="text-gray-400" /> by Prince Christian
            </span>
            <span className="flex items-center gap-1">
              <FaBug className="text-green-500" /> No bugs were harmed in the
              making of this app
            </span>
          </div>

          {/* Links */}
          <div className="flex flex-col md:flex-row items-center gap-2 text-sm">
            <a
              href="/terms"
              className="text-gray-400 hover:text-primary transition"
            >
              Terms of Service
            </a>
            <a
              href="/privacy"
              className="text-gray-400 hover:text-primary transition"
            >
              Privacy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
