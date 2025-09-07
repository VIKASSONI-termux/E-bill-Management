import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Landing from './pages/Landing';
import ModernLogin from './pages/ModernLogin';
import ModernRegister from './pages/ModernRegister';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import EnhancedReportManagement from './pages/EnhancedReportManagement';
import Navbar from './components/Navbar';

import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<ModernLogin />} />
              <Route path="/register" element={<ModernRegister />} />
              <Route 
                path="/admin/*" 
                element={
                  <PrivateRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/user/*" 
                element={
                  <PrivateRoute allowedRoles={['user']}>
                    <UserDashboard />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/report-management/*" 
                element={
                  <PrivateRoute allowedRoles={['operations_manager']}>
                    <EnhancedReportManagement />
                  </PrivateRoute>
                } 
              />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
