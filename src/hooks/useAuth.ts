"use client";

import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define the shape of the auth context state
interface AuthContextType {
  // In a real app, the user object would be more detailed
  user: { name: string } | null;
  // In a real app, these would handle actual login/logout logic
  login: () => void;
  logout: () => void;
}

// Create the context with a default undefined value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the AuthProvider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // NOTE: This is a MOCK implementation.
  // In a real application, you would fetch the user's status from an API
  // or a cookie on initial load.
  const [user, setUser] = useState<{ name: string } | null>(null);

  // Mock login function
  const login = () => {
    // In a real app, this would be the result of a successful API call
    setUser({ name: "Test User" });
  };

  // Mock logout function
  const logout = () => {
    setUser(null);
  };

  const value = { user, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Create the useAuth hook for easy consumption
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
