/**
 * This is the root layout for the entire SkillSphere application.
 * It sets up the main HTML structure, global styles, fonts, and providers
 * that are shared across all pages.
 */
'use client'; // This component uses state for the mobile sidebar, so it must be a client component.

import { useState } from 'react';
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { AuthProvider } from "@/context/AuthContext";
import Header from '@/components/Header';

// Initialize the Inter font for the application
const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // --- STATE MANAGEMENT ---
  // This state controls the visibility of the sidebar on mobile devices.
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- RENDER ---
  return (
    <html lang="en">
      <head>
        {/* It's best practice to add a title and meta description here for SEO and clarity */}
        <title>SkillSphere - AI Career Advisor</title>
        <meta name="description" content="Personalized Career and Skills Advisor powered by Google Gemini AI." />
      </head>
      <body className={inter.className}>
        {/* AuthProvider wraps the entire application, making user data available everywhere. */}
        <AuthProvider>
          <div className="flex min-h-screen bg-slate-900">
            
            {/* The Sidebar component is always present, but its visibility is controlled by state on mobile. */}
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            
            {/* Main content area that will contain the header and the current page. */}
            <div className="flex-1 flex flex-col w-full min-w-0">
              
              {/* The Header component is only visible on mobile and contains the menu toggle. */}
              <Header onMenuClick={() => setIsSidebarOpen(true)} />
              
              {/* The 'children' prop is where Next.js will render the content of the current page. */}
              <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
                {children}
              </main>

            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
