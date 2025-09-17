import React from 'react';
import { render, screen } from '@testing-library/react';
import Auth from '../Auth';

// We need to mock the useAuth hook that the Auth component depends on.
// This tells Jest: "Whenever any component tries to call useAuth,
// give them this fake data instead of trying to connect to Firebase."
jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// We also need to mock the next/image component for testing
jest.mock('next/image', () => ({
    __esModule: true,
    // @ts-ignore
    default: (props: any) => {
      // eslint-disable-next-line @next/next/no-img-element
      return <img {...props} />;
    },
}));


// Import the hook *after* mocking it
import { useAuth } from '@/context/AuthContext';

// Typecast the mocked hook so TypeScript understands it
const useAuthMock = useAuth as jest.Mock;

describe('Auth Component', () => {

  // Test case 1: When the user is logged out
  it('shows the "Sign in with Google" button when user is logged out', () => {
    // 1. Arrange: Set up our mock to return a "logged out" state.
    useAuthMock.mockReturnValue({
      user: null, // No user
      loading: false,
    });

    // 2. Act: Render the Auth component.
    render(<Auth />);

    // 3. Assert: Check if an element with the text "Sign in with Google" is visible on the screen.
    // The `getByText` function will throw an error if the text is not found, failing the test.
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
  });

  // Test case 2: When the user is logged in
  it('shows the user display name and sign out button when user is logged in', () => {
    // 1. Arrange: Set up our mock to return a fake "logged in" user.
    useAuthMock.mockReturnValue({
      user: {
        displayName: 'Amit Verma',
        photoURL: 'http://example.com/avatar.png',
      },
      loading: false,
    });

    // 2. Act: Render the Auth component.
    render(<Auth />);

    // 3. Assert: Check if the user's name and the "Sign Out" button are visible.
    expect(screen.getByText('Amit Verma')).toBeInTheDocument();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();

    // We can also assert that the "Sign in" button is NOT there
    expect(screen.queryByText('Sign in with Google')).not.toBeInTheDocument();
  });

});
