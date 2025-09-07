import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { AuthProvider } from "@/context/AuthContext"; // Import the AuthProvider
import Auth from "@/components/Auth";                 // Import the Auth button component

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SkillSphere",
  description: "Personalized Career and Skills Advisor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* 1. Wrap your entire application with the AuthProvider */}
        <AuthProvider>
          <div className="flex min-h-screen bg-slate-900">
            <Sidebar />
            <div className="flex-1 flex flex-col">
              {/* 2. Create a header to hold the login button */}
              <header className="flex justify-end p-4 border-b border-slate-700">
                <Auth /> {/* 3. Add the login/logout button here */}
              </header>
              <main className="flex-1 p-8 overflow-y-auto">
                {children}
              </main>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}

