'use client'; // This component now needs state, so it must be a client component

import { useState } from 'react';
// Metadata cannot be in a client component, so we export it separately
// import type { Metadata } from "next"; 
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { AuthProvider } from "@/context/AuthContext";
import Header from '@/components/Header'; // Import our new Header component

const inter = Inter({ subsets: ["latin"] });

// We can't use the metadata export in a client component, 
// but you can manage the title in other ways if needed.
// export const metadata: Metadata = {
//   title: "SkillSphere",
//   description: "Personalized Career and Skills Advisor",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Create a state variable to track if the mobile sidebar is open
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="flex min-h-screen bg-slate-900">
            {/* Pass the state and the function to close it down to the Sidebar */}
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            
            {/* This div will contain the header and the main content */}
            <div className="flex-1 flex flex-col w-full min-w-0"> {/* min-w-0 is important for flexbox shrinking */}
              
              {/* Add the new Header, and pass it the function to open the sidebar */}
              <Header onMenuClick={() => setIsSidebarOpen(true)} />
              
              {/* This is where your pages (like the dashboard or history) will be displayed */}
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

