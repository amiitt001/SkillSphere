import React from 'react';
import { render } from '@testing-library/react';
import Auth from '../common/Auth';

// We need to mock the useAuth hook that the Auth component depends on.
// This tells Jest: "Whenever any component tries to call useAuth,
// give them this fake data instead of trying to connect to Firebase."
jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// We also need to mock the next/image component for testing
jest.mock('next/image', () => ({
  __esModule: true,

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || 'mocked image'} />;
  },
}));

// Import the hook *after* mocking it
import { useAuth } from '@/context/AuthContext';

// Typecast the mocked hook so TypeScript understands it
const useAuthMock = useAuth as jest.Mock;

describe('Auth Component', () => {

  // Test case 1: When the user is logged out
  it('shows the "Sign In →" link when user is logged out', () => {
    // 1. Arrange: Set up our mock to return a "logged out" state.
    useAuthMock.mockReturnValue({
      user: null, // No user
      loading: false,
    });

    // 2. Act: Render the Auth component.
    const { getByText } = render(<Auth />);

    // 3. Assert: Check if an element with the text "Sign In →" is visible on the screen.
    expect(getByText('Sign In →')).toBeInTheDocument();
  });

  // Test case 2: When the user is logged in
  it('shows the user display name when user is logged in', () => {
    // 1. Arrange: Set up our mock to return a fake "logged in" user.
    useAuthMock.mockReturnValue({
      user: {
        displayName: 'Amit Verma',
        photoURL: 'http://example.com/avatar.png',
      },
      loading: false,
    });

    // 2. Act: Render the Auth component.
    const { getByText, queryByText } = render(<Auth />);

    // 3. Assert: Check if the user's name is visible.
    expect(getByText('Amit Verma')).toBeInTheDocument();

    // We can also assert that the "Sign In →" link is NOT there
    expect(queryByText('Sign In →')).not.toBeInTheDocument();
  });

});
