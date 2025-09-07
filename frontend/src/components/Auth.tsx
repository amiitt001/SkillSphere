'use client';

import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

const Auth = () => {
  const { user, loading } = useAuth();

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  if (loading) {
    return <div className="h-10 w-40 bg-slate-700 rounded-md animate-pulse"></div>;
  }

  return (
    <div>
      {user ? (
        // When logged in, just show the user's info
        <div className="flex items-center gap-3">
          <Image
            src={user.photoURL || '/default-avatar.png'} // Add a fallback avatar
            alt={user.displayName || 'User'}
            width={40}
            height={40}
            className="w-10 h-10 rounded-full"
          />
          <span className="text-white font-medium hidden sm:block">{user.displayName}</span>
        </div>
      ) : (
        // When logged out, show the sign-in button
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

  