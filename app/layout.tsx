import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Cursor } from "./_components/cursor";
import { Header } from "./_components/header";
import { LiquidCanvas } from "./_components/liquid-canvas";
import { Loader } from "./_components/loader";
import { SmoothScroll } from "./_components/smooth-scroll";
import "lenis/dist/lenis.css";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "naufal muttaqin",
  description:
    "Full-stack developer in Bandung, Indonesia. From database schema to the button you tap.",
};

// Marks the document as scripted before first paint, so text that GSAP is
// about to reveal starts hidden instead of flashing in and then animating.
const markJs = "document.documentElement.classList.add('js')";

export default function RootLayout({ children, sheet }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jakarta.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: markJs }} />
      </head>
      <body className="min-h-full">
        <SmoothScroll />
        <Loader />
        <Header />
        {children}
        {sheet}
        <LiquidCanvas />
        <Cursor />
      </body>
    </html>
  );
}
