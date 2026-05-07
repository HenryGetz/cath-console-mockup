import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { BodyScaler } from "@/components/BodyScaler";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ACIST Pro",
  description: "ACIST Pro Contrast Injection System",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-screen w-screen overflow-hidden bg-neutral-950"
    >
      <body
        className={`${inter.variable} flex min-h-screen w-screen items-start justify-start overflow-hidden bg-neutral-950 font-sans antialiased`}
      >
        <BodyScaler>
          <div className="relative h-[800px] w-[1423px] overflow-hidden bg-background shadow-2xl">
            {children}
          </div>
        </BodyScaler>
        <Analytics />
      </body>
    </html>
  );
}
