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
        <div className="flex items-center gap-3">
          {/* This wrapper div now has explicit sizing and flex properties */}
          <div className="flex-shrink-0 w-10 h-10"> 
            <Image
              src={user.photoURL || '/logo.png'}
              alt={user.displayName || 'User'}
              width={40}
              height={40}
              className="w-full h-full rounded-full object-cover" // Ensures image fills the container
            />
          </div>
          <span className="text-white font-medium hidden sm:block">{user.displayName}</span>
        </div>
      ) : (
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

