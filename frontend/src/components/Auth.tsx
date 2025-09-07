'use client';

import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext'; // This line will work once the file is found

const Auth = () => {
  const { user, loading } = useAuth(); // This line declares the 'user' and 'loading' variables

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) { // The 'error' variable is declared here
      console.error("Error signing in with Google", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) { // The 'error' variable is declared here
      console.error("Error signing out", error);
    }
  };

  if (loading) {
    return <div className="h-10 w-24 bg-slate-700 rounded-md animate-pulse"></div>;
  }

  return (
    <div>
      {user ? (
        <div className="flex items-center gap-4">
          <img 
            src={user.photoURL || ''} 
            alt={user.displayName || 'User'} 
            className="w-10 h-10 rounded-full"
          />
          <span className="text-white font-medium">{user.displayName}</span>
          <button 
            onClick={handleSignOut}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md text-sm"
          >
            Sign Out
          </button>
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