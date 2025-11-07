// src/app/login/page.tsx

"use client"; // Important: Use client-side rendering for interactivity (hooks, state, browser API calls)

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

// Define the shape of the user input data
interface LoginData {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState<LoginData>({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

  // 1. Handler for form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // 2. Handler for form submission (API call)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
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
        // Handle API errors (e.g., Invalid credentials, User not found)
        setError(data.message || 'Login failed. Please check your credentials.');
        setIsLoading(false);
        return;
      }

      // 3. Success: Store the JWT
      // IMPORTANT: In a real application, you should store the token in an HttpOnly cookie 
      // or a secure state management solution. For this simple example, we use localStorage.
      if (data.token) {
        localStorage.setItem('authToken', data.token);
        // Optional: Store user info (role, name) to update UI immediately
        localStorage.setItem('userRole', data.user.roleName); 
        
        // 4. Redirect based on role (e.g., Admin to Dashboard, Employee to Task view)
        // We'll redirect all users to a generic dashboard for now.
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
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow">
            <div className="card-header text-center bg-primary text-white">
              <h2>Staff Login</h2>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                
                {/* Error Message Display */}
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                {/* Email Input */}
                <div className="mb-3">
                  <label htmlFor="emailInput" className="form-label">Email address</label>
                  <input
                    type="email"
                    className="form-control"
                    id="emailInput"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Password Input */}
                <div className="mb-3">
                  <label htmlFor="passwordInput" className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="passwordInput"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  className="btn btn-primary w-100"
                  disabled={isLoading}
                >
                  {isLoading ? 'Logging in...' : 'Login'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;