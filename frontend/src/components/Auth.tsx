/**
 * This component handles the user authentication display and logic in the header.
 * It uses the AuthContext to determine the current user's state and renders
 * either a "Sign in" button or the user's profile information.
 */
'use client';

import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import Link from 'next/link';

const Auth = () => {
  const { user, loading } = useAuth();

  // Display a loading skeleton while the authentication state is being determined.
  if (loading) {
    return <div className="h-9 w-24 skeleton"></div>;
  }

  return (
    <div className="flex items-center">
      {user ? (
        // User Profile View
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-teal/50 transition-all duration-300">
          <div className="flex-shrink-0 w-8 h-8 min-h-[32px] rounded-full ring-1 ring-teal/30 overflow-hidden relative">
            <Image
              src={user.photoURL || '/logo.png'}
              alt={user.displayName || 'User'}
              fill
              sizes="32px"
              className="object-cover"
            />
          </div>
          <span className="text-secondary text-sm font-medium hidden sm:block pr-1">{user.displayName}</span>
        </div>
      ) : (
        // Sign In CTA
        <Link
          href="/signin"
          className="btn-gradient no-underline"
        >
          Sign In →
        </Link>
      )
      }
    </div >
  );
};

export default Auth;
