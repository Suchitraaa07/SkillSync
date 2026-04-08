import type { Metadata, Viewport } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { PwaRegister } from "@/components/PwaRegister";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  title: "SkillSync AI",
  description: "Internship Readiness and Smart Apply Assistant",
  manifest: "/manifest.webmanifest",
  applicationName: "SkillSync AI",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SkillSync AI",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.svg", type: "image/svg+xml" },
      { url: "/icons/icon-512.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icons/icon-192.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#050816",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${manrope.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
