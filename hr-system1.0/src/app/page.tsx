// src/app/page.tsx

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Users, Briefcase, Calendar } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      
      {/* Header/Navigation */}
      <header className="flex items-center justify-between p-6 bg-white shadow-md dark:bg-gray-800">
        <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">Inovera HR Portal</h1>
        <nav className="space-x-4">
          <Link href="/login">
            <Button variant="outline">Employee Login</Button>
          </Link>
          <Link href="#features">
            <Button variant="ghost">Learn More</Button>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="py-20 text-center bg-indigo-50 dark:bg-gray-700">
        <div className="container mx-auto px-6">
          <Zap className="mx-auto h-12 w-12 text-indigo-600 mb-4" />
          <h2 className="text-5xl font-extrabold text-gray-900 dark:text-gray-50 mb-4">
            Simplify Human Resources, Empower Your Team
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Welcome to the Inovera HR Management System. Access staff directories, manage leave requests, and streamline onboarding—all in one secure place.
          </p>
          <Link href="/login">
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg">
              Get Started (Login)
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16">
        <div className="container mx-auto px-6">
          <h3 className="text-3xl font-bold text-center mb-10 text-gray-900 dark:text-gray-50">Core Capabilities</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <Card className="text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <Users className="mx-auto h-8 w-8 text-indigo-500 mb-2" />
                <CardTitle className="text-xl">Staff Directory</CardTitle>
              </CardHeader>
              <CardContent>
                Manage employee profiles, roles, and contact information with powerful search and filtering.
              </CardContent>
            </Card>

            <Card className="text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <Calendar className="mx-auto h-8 w-8 text-indigo-500 mb-2" />
                <CardTitle className="text-xl">Leave Management</CardTitle>
              </CardHeader>
              <CardContent>
                Employees can easily submit time-off requests, and managers can approve or deny with real-time tracking.
              </CardContent>
            </Card>

            <Card className="text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <Briefcase className="mx-auto h-8 w-8 text-indigo-500 mb-2" />
                <CardTitle className="text-xl">Role-Based Access</CardTitle>
              </CardHeader>
              <CardContent>
                Secure system ensures HR Admins have full access while staff members see only their relevant data.
              </CardContent>
            </Card>

          </div>
        </div>
      </section>
    </div>
  );
}