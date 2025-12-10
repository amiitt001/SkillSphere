/**
 * This component handles the user authentication display and logic in the header.
 * It uses the AuthContext to determine the current user's state and renders
 * either a "Sign in" button or the user's profile information.
 */
'use client';

import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import Link from 'next/link';

const Auth = () => {
  // --- STATE & CONTEXT ---
  // The useAuth hook provides the current user object and a loading state.
  const { user, loading } = useAuth();

  /**
   * Initiates the Google Sign-In process using a Firebase pop-up window.
   */
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  // --- RENDER ---

  // Display a loading skeleton while the authentication state is being determined.
  // This prevents a flicker between the "Sign in" and user profile views on page load.
  if (loading) {
    return <div className="h-10 w-40 bg-slate-700 rounded-md animate-pulse"></div>;
  }

  return (
    <div>
      {user ? (
        // If the user is logged in, display their avatar and name with enhanced styling.
        <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-gradient-to-r from-slate-700/30 to-slate-700/10 border border-slate-600/30 hover:border-sky-500/50 transition-all duration-300">
          <div className="flex-shrink-0 w-9 h-9 rounded-full ring-2 ring-sky-500/50 overflow-hidden">
            <Image
              src={user.photoURL || '/logo.png'} // Use a fallback image if no photo is available
              alt={user.displayName || 'User'}
              width={36}
              height={36}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-slate-200 font-semibold hidden sm:block">{user.displayName}</span>
        </div>
      ) : (
        // If the user is logged out, display the "Sign in" button with enhanced styling.
        <Link
          href="/signin"
          className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold py-2.5 px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-sky-500/50 transform hover:scale-105 active:scale-95 inline-block"
        >
          Sign in
        </Link>
      )}
    </div>
  );
};

export default Auth;
