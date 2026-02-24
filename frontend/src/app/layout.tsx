import type { Metadata } from "next";
import "./globals.css";

// --- FIX: Using relative paths for all component imports ---
import { AuthProvider } from '../context/AuthContext';
import LayoutClient from '@/components/LayoutClient';

export const metadata: Metadata = {
  title: "SkillSphere - AI Career Advisor",
  description: "Personalized Career and Skills Advisor powered by Google Gemini AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {/* Background Layers — in sync with prototype design */}
        <div className="bg-canvas"></div>
        <div className="bg-grid"></div>
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>

        {/* AuthProvider wraps the entire application, making user data available everywhere. */}
        <AuthProvider>
          <LayoutClient>
            {children}
          </LayoutClient>
        </AuthProvider>
      </body>
    </html>
  );
}