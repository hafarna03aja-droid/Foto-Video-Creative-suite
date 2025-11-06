import React, { useState, useEffect } from 'react';
import { BackendService, TokenManager } from '../services/backendService';
import { DemoAuthHelper } from '../services/demoAuthHelper';

interface AuthWrapperProps {
  children: React.ReactNode;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showLogin, setShowLogin] = useState<boolean>(false);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        if (TokenManager.isLoggedIn()) {
          const userData = TokenManager.getUser();
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          // Try demo auto-login
          const autoLoginSuccess = await DemoAuthHelper.ensureDemoLogin();
          if (autoLoginSuccess) {
            const userData = TokenManager.getUser();
            setUser(userData);
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        TokenManager.clearTokens();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    try {
      const authData = await BackendService.login(email, password);
      setUser(authData.user);
      setIsAuthenticated(true);
      setShowLogin(false);
    } catch (error) {
      throw error; // Re-throw for form handling
    }
  };

  const handleLogout = async () => {
    try {
      await BackendService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setShowLogin(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // For now, skip authentication and show children directly
  // This allows the app to work without backend initially
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h2 className="text-2xl font-bold text-center mb-6">Foto Video Creative Suite</h2>
          <div className="text-center">
            <p className="mb-4 text-gray-600">Backend authentication is being set up.</p>
            <p className="mb-4 text-gray-600">For now, you can continue without login:</p>
            <button
              onClick={async () => {
                try {
                  setIsLoading(true);
                  await DemoAuthHelper.manualDemoLogin();
                  const userData = TokenManager.getUser();
                  setUser(userData);
                  setIsAuthenticated(true);
                } catch (error) {
                  console.error('Manual demo login failed:', error);
                  alert('Login demo gagal. Coba lagi nanti.');
                } finally {
                  setIsLoading(false);
                }
              }}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
            >
              Continue as Demo User
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrapper">
      {/* Optional: User info bar */}
      {user && (
        <div className="hidden bg-gray-800 text-white px-4 py-2 text-sm">
          <div className="flex justify-between items-center max-w-7xl mx-auto">
            <span>Welcome, {user.name}</span>
            <button
              onClick={handleLogout}
              className="text-gray-300 hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      )}
      {children}
    </div>
  );
};