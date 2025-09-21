/**
 * This file sets up the Authentication Context for the entire application.
 * It uses React Context to provide a global state for the current user's
 * authentication status, allowing any component to access it without
 * passing props down through many levels (prop drilling).
 */
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

// --- TYPE DEFINITION ---
/**
 * Defines the shape of the data that will be available in the AuthContext.
 */
interface AuthContextType {
  user: User | null; // The Firebase user object, or null if logged out.
  loading: boolean;  // True while the initial authentication state is being determined.
}

// --- CONTEXT CREATION ---
// Create the context with a default value.
const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

// --- PROVIDER COMPONENT ---
/**
 * The AuthProvider component wraps the application and provides the AuthContext
 * to all of its children. It contains the core logic for listening to
 * Firebase authentication changes.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // --- STATE MANAGEMENT ---
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // --- EFFECT HOOK ---
  // This effect runs once when the component mounts and sets up the Firebase listener.
  useEffect(() => {
    // onAuthStateChanged returns an 'unsubscribe' function that we can use for cleanup.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user); // Update the user state when auth status changes.
      setLoading(false); // Set loading to false once we have the initial state.
    });

    // Cleanup: This function is called when the component unmounts to prevent memory leaks.
    return () => unsubscribe();
  }, []); // The empty dependency array ensures this effect only runs once.

  // --- RENDER ---
  return (
    <AuthContext.Provider value={{ user, loading }}>
      {/* We wait until the initial loading is false before rendering children to prevent UI flicker. */}
      {!loading && children}
    </AuthContext.Provider>
  );
};

// --- CUSTOM HOOK ---
/**
 * A custom hook that simplifies accessing the AuthContext data in any component.
 * Instead of using `useContext(AuthContext)`, components can just use `useAuth()`.
 */
export const useAuth = () => useContext(AuthContext);
