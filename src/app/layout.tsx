import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Public_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"], // you can customize weights
  variable: "--font-public-sans",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["700"], // headers only
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CitiVoice – Smart Citizen Feedback & Complaint System",
  description:
    "Empower communities with CitiVoice: a streamlined platform for submitting complaints, tracking issues, and enabling responsive governance in real time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${publicSans.variable} ${spaceGrotesk.variable} font-public-sans antialiased`}
      >
        <Providers>
          {children}
        </Providers>
          
        
      </body>
    </html>
  );
}
