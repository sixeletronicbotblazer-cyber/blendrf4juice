import type { Metadata, Viewport } from "next";
import { DM_Sans, Outfit } from "next/font/google";
import "./globals.css";
import "./blendr.css";
import { Toaster } from "@/components/ui/toaster";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Blendr — Mini. Portable. Powerful.",
  description:
    "Meet Blendr: a mini portable blender made for fresh blends wherever life takes you.",
  keywords: [
    "Blendr",
    "portable blender",
    "bottle blender",
    "smoothie",
    "fresh juice",
  ],
  authors: [{ name: "Blendr" }],
  icons: {
    icon: "/assets/logo.png",
  },
  openGraph: {
    title: "Blendr — Mini. Portable. Powerful.",
    description:
      "Meet Blendr: a mini portable blender made for fresh blends wherever life takes you.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blendr — Mini. Portable. Powerful.",
    description:
      "Meet Blendr: a mini portable blender made for fresh blends wherever life takes you.",
  },
};

export const viewport: Viewport = {
  themeColor: "#f8f3eb",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} ${outfit.variable} antialiased`}
        style={{
          fontFamily: "'DM Sans', var(--font-dm-sans), Arial, sans-serif",
        }}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
