/**
 * This is the root layout for the entire SkillSphere application.
 * It sets up the main HTML structure, global styles, fonts, and providers
 * that are shared across all pages.
 */

import { Inter } from "next/font/google";
import "./globals.css";

// --- FIX: Using relative paths for all component imports ---
import { AuthProvider } from '../context/AuthContext';
import LayoutClient from '@/components/LayoutClient';

// Initialize the Inter font for the application
const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    // --- FIX: Restoring the required <html> and <body> tags ---
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>SkillSphere - AI Career Advisor</title>
        <meta name="description" content="Personalized Career and Skills Advisor powered by Google Gemini AI." />
      </head>
      <body>
        {/* AuthProvider wraps the entire application, making user data available everywhere. */}
        <AuthProvider>
          <LayoutClient fontClassName={inter.className}>
            {children}
          </LayoutClient>
        </AuthProvider>
      </body>
    </html>
  );
}