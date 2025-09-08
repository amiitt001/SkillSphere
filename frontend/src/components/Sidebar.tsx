'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
// ... (rest of your imports)
import { useAuth } from '@/context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';


// ... (LogoutIcon component is the same)
const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
  </svg>
);


const Sidebar = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const navItems = [
    { href: '/', label: 'Dashboard' },
    { href: '/history', label: 'History' },
  ];

  return (
    <aside className="w-64 bg-slate-800 text-white flex-shrink-0 p-4 flex flex-col">
      <div className="mb-10">
        <Link href="/" className="flex items-center gap-2">
          {/* --- THIS IS THE FIX --- */}
          <div className="flex-shrink-0">
            <Image
              src="/logo.png"
              alt="SkillSphere Logo"
              width={40}
              height={40}
              priority
            />
          </div>
          <span className="text-2xl font-bold">SkillSphere</span>
        </Link>
      </div>
      
      {/* ... (rest of the component is the same) ... */}
      <nav className="flex-grow">
        <ul>
          {navItems.map((item) => (
            <li key={item.href} className="mb-4">
              <Link
                href={item.href}
                className={`flex items-center p-2 rounded-md text-sm transition-colors ${
                  pathname === item.href
                    ? 'bg-sky-600'
                    : 'hover:bg-slate-700'
                }`}
              >
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-slate-700 pt-4">
        {user ? (
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 p-2 rounded-md text-sm text-slate-300 hover:bg-red-600 hover:text-white transition-colors"
          >
            <LogoutIcon />
            <span>Sign Out</span>
          </button>
        ) : (
          <div className="text-sm text-slate-500 text-center">
            Please sign in.
          </div>
        )}
      </div>

    </aside>
  );
};

export default Sidebar;

