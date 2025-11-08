"use client"; // Important: Use client-side rendering for interactivity (hooks, state, browser API calls)

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

// Define the shape of the user input data
interface LoginData {
  email: string;
  password: string;
}

// 1. Helper function for client-side email format validation
const isValidEmailFormat = (email: string): boolean => {
  // Simple regex for email format validation (e.g., user@domain.com)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState<LoginData>({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

  // Handler for form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handler for form submission (API call)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // --- Client-Side Validation (Immediate Feedback) ---
    if (!formData.email || !formData.password) {
      setError('Please enter both email and password.');
      return;
    }
    if (!isValidEmailFormat(formData.email)) {
      // ✅ Check for incorrect email FORMAT (Client-side)
      setError('Please enter a valid email address format.');
      return;
    }

    setIsLoading(true);

    try {
      // Call your secure login API route
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        // --- Server-Side Error Parsing ---
        const message = data.message || 'Login failed. Please check your credentials.';

        if (message.includes('user not found')) {
          // ✅ Check for non-existent email (Server-side)
          setError('User not found. Check your email address.');
        } else if (message.includes('Invalid credentials')) {
          // Error for correct email, but wrong password
          setError('Invalid password. Try again.');
        } else if (message.includes('inactive')) {
          setError(message); // Displays "Account is inactive..."
        }
        else {
          setError(message);
        }
        
        setIsLoading(false);
        return;
      }

      // 3. Success: Store the JWT
      if (data.token) {
        localStorage.setItem('authToken', data.token);
        // We assume 'data.user' contains the role name for simple storage, though 
        // a dedicated Redux/Context approach would be better.
        // localStorage.setItem('userRole', data.user.roleName); 
        
        // 4. Redirect after successful login
        router.push('/dashboard'); 
      }
      
    } catch (err) {
      console.error('Network or parsing error:', err);
      setError('A connection error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-2xl">
        <h2 className="text-3xl font-bold text-center text-gray-800">Inovera HR Login 🔑</h2>
        <p className="text-center text-gray-500">Sign in to access your employee portal.</p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          
          {/* Error Message Display */}
          {error && (
            <div className="p-3 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md">
              🚨 {error}
            </div>
          )}

          {/* Email Input */}
          <div>
            <label htmlFor="emailInput" className="block text-sm font-medium text-gray-700">Email address</label>
            <input
              type="email"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              id="emailInput"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g., hr.admin@inovera.com"
              required
            />
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="passwordInput" className="form-label">Password</label>
            <input
              type="password"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              id="passwordInput"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="********"
              required
            />
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors duration-150 ${
              isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            }`}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;