import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { FileText, Users, Shield, Upload, Download, BarChart3 } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
     

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
              Streamline Your
              <span className="text-blue-600"> Bill Reports</span>
            </h2>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              A comprehensive solution for managing electric bill reports with role-based access control, 
              secure file uploads, and efficient report distribution.
            </p>
            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
              <div className="rounded-md shadow">
                <Link to="/register">
                  <Button size="lg" className="w-full">
                    Get Started
                  </Button>
                </Link>
              </div>
              <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                <Link to="/login">
                  <Button variant="outline" size="lg" className="w-full">
                    Login
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-3xl font-bold text-gray-900">Key Features</h3>
            <p className="mt-4 text-lg text-gray-600">
              Everything you need to manage your bill reports efficiently
            </p>
          </div>
          
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 text-blue-600" />
                <CardTitle>Role-Based Access</CardTitle>
                <CardDescription>
                  Secure access control with Admin, Operations Manager, and User roles
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Upload className="h-8 w-8 text-green-600" />
                <CardTitle>File Upload</CardTitle>
                <CardDescription>
                  Drag & drop file uploads with support for PDF, Word, Excel, and more
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Download className="h-8 w-8 text-purple-600" />
                <CardTitle>Easy Downloads</CardTitle>
                <CardDescription>
                  Download reports in original format or export as CSV/Excel
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-orange-600" />
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Comprehensive user management with profile information and assignments
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <FileText className="h-8 w-8 text-red-600" />
                <CardTitle>Report Tracking</CardTitle>
                <CardDescription>
                  Track report status, priority, and assignment with detailed metadata
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-indigo-600" />
                <CardTitle>Analytics</CardTitle>
                <CardDescription>
                  System statistics and audit logs for complete transparency
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-3xl font-bold text-gray-900">Choose Your Role</h3>
            <p className="mt-4 text-lg text-gray-600">
              Different interfaces for different user types
            </p>
          </div>
          
          <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
            <Card className="text-center">
              <CardHeader>
                <Shield className="h-12 w-12 text-blue-600 mx-auto" />
                <CardTitle>Administrator</CardTitle>
                <CardDescription>
                  Manage users, assign roles, verify changes, and view system analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium">Demo Credentials:</p>
                  <p className="text-xs text-blue-600">admin@example.com</p>
                  <p className="text-xs text-blue-600">admin123</p>
                </div>
                <Link to="/login">
                  <Button variant="outline" className="w-full">
                    Admin Login
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Upload className="h-12 w-12 text-green-600 mx-auto" />
                <CardTitle>Operations Manager</CardTitle>
                <CardDescription>
                  Upload, edit, delete reports and assign files to users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800 font-medium">Demo Credentials:</p>
                  <p className="text-xs text-green-600">manager@example.com</p>
                  <p className="text-xs text-green-600">manager123</p>
                </div>
                <Link to="/login">
                  <Button variant="outline" className="w-full">
                    Manager Login
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Users className="h-12 w-12 text-purple-600 mx-auto" />
                <CardTitle>User</CardTitle>
                <CardDescription>
                  View and download assigned reports, search by registration number
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-800 font-medium">Demo Credentials:</p>
                  <p className="text-xs text-purple-600">user@example.com</p>
                  <p className="text-xs text-purple-600">user123</p>
                </div>
                <Link to="/login">
                  <Button variant="outline" className="w-full">
                    User Login
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-blue-400 mr-2" />
              <h4 className="text-xl font-bold">Electric Bill Management</h4>
            </div>
            <p className="text-gray-400">
              Streamlining bill report management for modern organizations
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
