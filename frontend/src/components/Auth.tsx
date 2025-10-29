/**
 * This component handles the user authentication display and logic in the header.
 * It uses the AuthContext to determine the current user's state and renders
 * either a "Sign in" button or the user's profile information.
 */
'use client';

import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

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

  /**
   * Signs the current user out of the application.
   */
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
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
        // If the user is logged in, display their avatar, name, and a sign-out button.
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10">
            <img
              src={user.photoURL || '/logo.png'} // Use a fallback image if no photo is available
              alt={user.displayName || 'User'}
              width="40"
              height="40"
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <span className="text-white font-medium hidden sm:block">{user.displayName}</span>
          <button
            onClick={handleSignOut}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-2 rounded-md"
          >
            Sign Out
          </button>
        </div>
      ) : (
        // If the user is logged out, display the "Sign in" button.
        <button
          onClick={signInWithGoogle}
          className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-md"
        >
          Sign in with Google
        </button>
      )}
    </div>
  );
};

export default Auth;
