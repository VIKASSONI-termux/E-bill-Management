import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import FileUpload from '../components/FileUpload';
import { 
  Users, 
  FileText, 
  BarChart3, 
  Settings, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Eye,
  Download,
  UserCheck,
  UserX,
  Shield,
  TrendingUp,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Plus
} from 'lucide-react';

const reportSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  status: z.enum(['draft', 'active', 'archived']).default('active'),
  assignedUsers: z.array(z.string()).optional(),
  tags: z.string().optional(),
  amount: z.string().min(1, 'Amount is required').transform((val) => {
    const num = parseFloat(val);
    if (isNaN(num) || num < 0) {
      throw new Error('Amount must be a positive number');
    }
    return num;
  }),
  dueDate: z.string().optional(),
});

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome, {user?.name}</p>
        </div>
        
        <Routes>
          <Route path="/" element={<AdminOverview />} />
          <Route path="dashboard" element={<AdminOverview />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="reports" element={<ReportOverview />} />
          <Route path="reports/create" element={<AdminCreateReport />} />
          <Route path="approvals" element={<ApprovalManagement />} />
          <Route path="stats" element={<SystemStats />} />
        </Routes>
      </div>
    </div>
  );
};

const AdminOverview = () => {
  const [stats, setStats] = useState(null);
  const [pendingCount, setPendingCount] = useState({ bills: 0, reports: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchPendingCount();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingCount = async () => {
    try {
      const [billsResponse, reportsResponse, deletionsResponse] = await Promise.all([
        axios.get('http://localhost:5001/api/bills/pending-approval'),
        axios.get('http://localhost:5001/api/reports/pending-approval'),
        axios.get('http://localhost:5001/api/reports/pending-deletion')
      ]);
      
      setPendingCount({
        bills: billsResponse.data.pagination?.total || 0,
        reports: reportsResponse.data.pagination?.total || 0,
        deletions: deletionsResponse.data.pagination?.total || 0
      });
    } catch (error) {
      console.error('Error fetching pending count:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading statistics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">System Overview</h2>
        <Button onClick={() => { fetchStats(); fetchPendingCount(); }} variant="outline" size="sm">
          <TrendingUp className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.users?.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.users?.active || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
              </div>
               <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Bills</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.bills?.total || 0}</p>
              </div> 
            </div>
          </CardContent>
        </Card> */}

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.reports?.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
                <p className="text-2xl font-bold text-gray-900">{pendingCount.bills + pendingCount.reports + pendingCount.deletions}</p>
                <p className="text-xs text-gray-500">
                  {pendingCount.bills} bills, {pendingCount.reports} reports, {pendingCount.deletions} deletions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users by Role */}
      <Card>
        <CardHeader>
          <CardTitle>Users by Role</CardTitle>
          <CardDescription>Distribution of users across different roles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats?.users?.byRole && Object.entries(stats.users.byRole).map(([role, count]) => (
              <div key={role} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Shield className="w-5 h-5 text-gray-400 mr-2" />
                  <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    {role.replace('_', ' ')}
                  </h4>
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-2">{count}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bills by Status */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Bills by Status</CardTitle>
          <CardDescription>Current status distribution of all bills</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {stats?.bills?.byStatus && Object.entries(stats.bills.byStatus).map(([status, count]) => (
              <div key={status} className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  {status === 'paid' && <CheckCircle className="w-5 h-5 text-green-500" />}
                  {status === 'pending' && <Clock className="w-5 h-5 text-yellow-500" />}
                  {status === 'overdue' && <AlertCircle className="w-5 h-5 text-red-500" />}
                  {status === 'draft' && <Edit className="w-5 h-5 text-gray-500" />}
                  {status === 'cancelled' && <UserX className="w-5 h-5 text-gray-400" />}
                </div>
                <h4 className="text-sm font-medium text-gray-500 capitalize">{status}</h4>
                <p className="text-xl font-bold text-gray-900 mt-1">{count}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card> */}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Link to="/admin/users">
              <Button className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                <Users className="w-6 h-6" />
                <span>Manage Users</span>
              </Button>
            </Link>
            <Link to="/admin/approvals">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2 border-yellow-300 text-yellow-700 hover:bg-yellow-50 relative">
                <div className="relative">
                  <Shield className="w-6 h-6" />
                  {(pendingCount.bills + pendingCount.reports + pendingCount.deletions) > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {pendingCount.bills + pendingCount.reports + pendingCount.deletions}
                    </span>
                  )}
                </div>
                <span>Pending Approvals</span>
              </Button>
            </Link>
            <Link to="/admin/reports">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                <FileText className="w-6 h-6" />
                <span>View All Reports</span>
              </Button>
            </Link>
            <Link to="/admin/reports/create">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2 border-green-300 text-green-700 hover:bg-green-50">
                <Plus className="w-6 h-6" />
                <span>Create Report</span>
              </Button>
            </Link>
            <Link to="/admin/stats">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                <BarChart3 className="w-6 h-6" />
                <span>Detailed Statistics</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (roleFilter !== 'all') params.append('role', roleFilter);

      const response = await axios.get(`http://localhost:5001/api/admin/users?${params}`);
      setUsers(response.data.users);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      await axios.put(`http://localhost:5001/api/admin/users/${userId}/role`, {
        role: newRole
      });
      fetchUsers();
      alert('User role updated successfully');
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Error updating user role');
    }
  };

  const toggleUserStatus = async (userId, isActive) => {
    try {
      await axios.put(`http://localhost:5001/api/admin/users/${userId}/status`, {
        isActive: !isActive
      });
      fetchUsers();
      alert('User status updated successfully');
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Error updating user status');
    }
  };

  const deleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`http://localhost:5001/api/admin/users/${userId}`);
        fetchUsers();
        alert('User deleted successfully');
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading users...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <Button onClick={fetchUsers} variant="outline" size="sm">
          <Users className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search users by name, email, or registration number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="md:w-48">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="user">User</option>
                <option value="operations_manager">Operations Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>Manage user roles, status, and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.registrationNumber || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select 
                        value={user.role} 
                        onChange={(e) => updateUserRole(user._id, e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="user">User</option>
                        <option value="operations_manager">Operations Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant={user.isActive ? "destructive" : "default"}
                          onClick={() => toggleUserStatus(user._id, user.isActive)}
                        >
                          {user.isActive ? <UserX className="w-4 h-4 mr-1" /> : <UserCheck className="w-4 h-4 mr-1" />}
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteUser(user._id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const ReportOverview = () => {
  const [reports, setReports] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reports');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingReport, setEditingReport] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, reportId: null, reportTitle: '' });

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReports();
    } else {
      fetchBills();
    }
  }, [activeTab, searchTerm, statusFilter]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await axios.get(`http://localhost:5001/api/admin/reports?${params}`);
      setReports(response.data.reports);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBills = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await axios.get(`http://localhost:5001/api/admin/bills?${params}`);
      setBills(response.data.bills);
    } catch (error) {
      console.error('Error fetching bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReportFile = async (reportId, fileId, fileName) => {
    try {
      const response = await axios.get(`http://localhost:5001/api/reports/${reportId}/files/${fileId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Error downloading file');
    }
  };

  const handleEditReport = (report) => {
    setEditingReport(report);
    setShowEditModal(true);
  };

  const handleDeleteReport = (reportId, reportTitle) => {
    setDeleteConfirm({
      show: true,
      reportId,
      reportTitle
    });
  };

  const confirmDeleteReport = async () => {
    try {
      await axios.delete(`http://localhost:5001/api/admin/reports/${deleteConfirm.reportId}`);
      alert('Report marked for deletion successfully');
      setDeleteConfirm({ show: false, reportId: null, reportTitle: '' });
      fetchReports(); // Refresh the list
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Error deleting report');
    }
  };

  const handleUpdateReport = async (updatedData) => {
    try {
      const response = await axios.put(`http://localhost:5001/api/admin/reports/${editingReport._id}`, updatedData);
      alert('Report updated successfully');
      setShowEditModal(false);
      setEditingReport(null);
      fetchReports(); // Refresh the list
    } catch (error) {
      console.error('Error updating report:', error);
      alert('Error updating report');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Reports Overview</h2>
        <Button onClick={activeTab === 'reports' ? fetchReports : fetchBills} variant="outline" size="sm">
          <FileText className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reports'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Reports ({reports.length})
          </button>
          {/* <button
            onClick={() => setActiveTab('bills')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'bills'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Bills ({bills.length})
          </button> */}
        </nav>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder={`Search ${activeTab} by title or description...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                {activeTab === 'reports' ? (
                  <>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="completed">Completed</option>
                  </>
                ) : (
                  <>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                    <option value="draft">Draft</option>
                    <option value="cancelled">Cancelled</option>
                  </>
                )}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {activeTab === 'reports' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map(report => (
            <Card key={report._id}>
              <CardHeader>
                <CardTitle className="text-lg">{report.title}</CardTitle>
                <CardDescription>{report.description || 'No description'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Created by:</span>
                    <span className="font-medium">{report.createdBy?.name || report.createdBy?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Category:</span>
                    <span className="font-medium">{report.category || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status:</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      report.status === 'active' ? 'bg-green-100 text-green-800' :
                      report.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Created:</span>
                    <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount:</span>
                    <span className="font-medium">${report.amount || 0}</span>
                  </div>
                </div>
                
                {/* Files Section */}
                {report.files && report.files.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Files:</p>
                    <div className="flex flex-wrap gap-2">
                      {report.files.map((file, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => downloadReportFile(report._id, file._id || index, file.originalName)}
                          className="text-xs"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          {file.originalName}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin Actions */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditReport(report)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteReport(report._id, report.title)}
                      className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bills.map(bill => (
            <Card key={bill._id}>
              <CardHeader>
                <CardTitle className="text-lg">{bill.title}</CardTitle>
                <CardDescription>{bill.description || 'No description'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount:</span>
                    <span className="font-medium">${bill.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Category:</span>
                    <span className="font-medium capitalize">{bill.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status:</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      bill.status === 'paid' ? 'bg-green-100 text-green-800' :
                      bill.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      bill.status === 'overdue' ? 'bg-red-100 text-red-800' :
                      bill.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {bill.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Created by:</span>
                    <span className="font-medium">{bill.createdBy?.name || bill.createdBy?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Due Date:</span>
                    <span>{bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : 'Not set'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {((activeTab === 'reports' && reports.length === 0) || (activeTab === 'bills' && bills.length === 0)) && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No {activeTab} found</h3>
            <p className="text-gray-500">No {activeTab} match your current filters.</p>
          </CardContent>
        </Card>
      )}

      {/* Edit Report Modal */}
      {showEditModal && editingReport && (
        <EditReportModal
          report={editingReport}
          onClose={() => {
            setShowEditModal(false);
            setEditingReport(null);
          }}
          onSave={handleUpdateReport}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Confirm Deletion</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the report "{deleteConfirm.reportTitle}"? 
              This action will mark the report for deletion and it will no longer be visible to users.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm({ show: false, reportId: null, reportTitle: '' })}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={confirmDeleteReport}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Report
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const EditReportModal = ({ report, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: report.title || '',
    description: report.description || '',
    category: report.category || 'other',
    priority: report.priority || 'medium',
    status: report.status || 'active',
    amount: report.amount || 0,
    dueDate: report.dueDate ? new Date(report.dueDate).toISOString().split('T')[0] : '',
    assignedUsers: report.assignedUsers ? report.assignedUsers.map(user => user._id).join(',') : '',
    tags: report.tags ? report.tags.join(',') : ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Edit Report</h3>
          <Button variant="outline" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <Input
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Report title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="other">Other</option>
                <option value="financial">Financial</option>
                <option value="operational">Operational</option>
                <option value="technical">Technical</option>
                <option value="compliance">Compliance</option>
                <option value="maintenance">Maintenance</option>
                <option value="safety">Safety</option>
                <option value="quality">Quality</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount
              </label>
              <Input
                name="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <Input
                name="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Report description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assigned Users (comma-separated user IDs)
            </label>
            <Input
              name="assignedUsers"
              value={formData.assignedUsers}
              onChange={handleChange}
              placeholder="user1, user2, user3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma-separated)
            </label>
            <Input
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="tag1, tag2, tag3"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              <Edit className="w-4 h-4 mr-2" />
              Update Report
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SystemStats = () => {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    fetchStats();
    fetchAnalytics();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const response = await axios.get(`http://localhost:5001/api/admin/analytics?period=${period}`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading detailed statistics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Detailed System Statistics</h2>
        <div className="flex space-x-2">
          <select
            value={period}
            onChange={(e) => {
              setPeriod(e.target.value);
              fetchAnalytics();
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <Button onClick={fetchStats} variant="outline" size="sm">
            <BarChart3 className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.users?.total || 0}</p>
                <p className="text-xs text-green-600">+{stats?.users?.recent || 0} this month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.users?.active || 0}</p>
                <p className="text-xs text-gray-500">
                  {stats?.users?.total > 0 ? Math.round((stats.users.active / stats.users.total) * 100) : 0}% of total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Bills</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.bills?.total || 0}</p>
                <p className="text-xs text-green-600">+{stats?.bills?.recent || 0} this month</p>
              </div>
            </div>
          </CardContent>
        </Card> */}

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.reports?.total || 0}</p>
                <p className="text-xs text-gray-500">{stats?.reports?.active || 0} active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* User Role Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>User Role Distribution</CardTitle>
            <CardDescription>Breakdown of users by role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.users?.byRole && Object.entries(stats.users.byRole).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Shield className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {role.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: `${stats.users.total > 0 ? (count / stats.users.total) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold text-gray-900 w-8">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bill Status Distribution */}
        {/* <Card>
          <CardHeader>
            <CardTitle>Bill Status Distribution</CardTitle>
            <CardDescription>Current status of all bills</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.bills?.byStatus && Object.entries(stats.bills.byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center">
                    {status === 'paid' && <CheckCircle className="w-4 h-4 text-green-500 mr-2" />}
                    {status === 'pending' && <Clock className="w-4 h-4 text-yellow-500 mr-2" />}
                    {status === 'overdue' && <AlertCircle className="w-4 h-4 text-red-500 mr-2" />}
                    {status === 'draft' && <Edit className="w-4 h-4 text-gray-500 mr-2" />}
                    {status === 'cancelled' && <UserX className="w-4 h-4 text-gray-400 mr-2" />}
                    <span className="text-sm font-medium text-gray-700 capitalize">{status}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          status === 'paid' ? 'bg-green-500' :
                          status === 'pending' ? 'bg-yellow-500' :
                          status === 'overdue' ? 'bg-red-500' :
                          status === 'draft' ? 'bg-gray-500' :
                          'bg-gray-400'
                        }`}
                        style={{ 
                          width: `${stats.bills.total > 0 ? (count / stats.bills.total) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold text-gray-900 w-8">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card> */}
      </div>

      {/* Analytics Section */}
      {analyticsLoading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </CardContent>
        </Card>
      ) : analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity ({period} days)</CardTitle>
              <CardDescription>New users and bills created</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-blue-600 mr-3" />
                    <span className="text-sm font-medium text-gray-700">New Users</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">
                    {analytics.userAnalytics.reduce((sum, item) => sum + item.count, 0)}
                  </span>
                </div>
                {/* <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-green-600 mr-3" />
                    <span className="text-sm font-medium text-gray-700">New Bills</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    {analytics.billAnalytics.reduce((sum, item) => sum + item.count, 0)}
                  </span>
                </div> */}
              </div>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          {/* <Card>
            <CardHeader>
              <CardTitle>Bill Categories</CardTitle>
              <CardDescription>Distribution by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.categoryBreakdown.map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {category._id}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">{category.count} bills</span>
                      <span className="text-sm font-bold text-gray-900">
                        ${category.totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card> */}
        </div>
      )}
    </div>
  );
};

const ApprovalManagement = () => {
  const [pendingBills, setPendingBills] = useState([]);
  const [pendingReports, setPendingReports] = useState([]);
  const [pendingDeletions, setPendingDeletions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bills');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [pendingRejection, setPendingRejection] = useState(null);

  useEffect(() => {
    fetchPendingItems();
  }, []);

  const fetchPendingItems = async () => {
    try {
      setLoading(true);
      const [billsResponse, reportsResponse, deletionsResponse] = await Promise.all([
        axios.get('http://localhost:5001/api/bills/pending-approval'),
        axios.get('http://localhost:5001/api/reports/pending-approval'),
        axios.get('http://localhost:5001/api/reports/pending-deletion')
      ]);
      
      setPendingBills(billsResponse.data.bills || []);
      setPendingReports(reportsResponse.data.reports || []);
      setPendingDeletions(deletionsResponse.data.reports || []);
    } catch (error) {
      console.error('Error fetching pending items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (type, id) => {
    try {
      const endpoint = type === 'bill' 
        ? `http://localhost:5001/api/bills/${id}/approve`
        : `http://localhost:5001/api/reports/${id}/approve`;
      
      await axios.put(endpoint);
      alert(`${type === 'bill' ? 'Bill' : 'Report'} approved successfully!`);
      fetchPendingItems();
    } catch (error) {
      console.error(`Error approving ${type}:`, error);
      alert(`Error approving ${type}`);
    }
  };

  const handleReject = (type, id) => {
    setPendingRejection({ type, id });
    setShowRejectionModal(true);
  };

  const confirmReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    if (!pendingRejection) return;

    try {
      const endpoint = pendingRejection.type === 'bill' 
        ? `http://localhost:5001/api/bills/${pendingRejection.id}/reject`
        : `http://localhost:5001/api/reports/${pendingRejection.id}/reject`;
      
      await axios.put(endpoint, { rejectionReason });
      alert(`${pendingRejection.type === 'bill' ? 'Bill' : 'Report'} rejected successfully!`);
      setRejectionReason('');
      setShowRejectionModal(false);
      setPendingRejection(null);
      fetchPendingItems();
    } catch (error) {
      console.error(`Error rejecting ${pendingRejection.type}:`, error);
      alert(`Error rejecting ${pendingRejection.type}`);
    }
  };

  const handleApproveDeletion = async (reportId) => {
    try {
      await axios.put(`http://localhost:5001/api/reports/${reportId}/approve-deletion`);
      alert('Report deletion approved successfully!');
      fetchPendingItems();
    } catch (error) {
      console.error('Error approving deletion:', error);
      alert('Error approving deletion');
    }
  };

  const handleRejectDeletion = async (reportId) => {
    try {
      await axios.put(`http://localhost:5001/api/reports/${reportId}/reject-deletion`);
      alert('Report deletion rejected. Report restored.');
      fetchPendingItems();
    } catch (error) {
      console.error('Error rejecting deletion:', error);
      alert('Error rejecting deletion');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading pending approvals...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
          <p className="text-gray-600">Review and approve bills and reports created by operations managers</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {/* <button
            onClick={() => setActiveTab('bills')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'bills'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Bills ({pendingBills.length})
          </button> */}
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reports'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Reports ({pendingReports.length})
          </button>
          <button
            onClick={() => setActiveTab('deletions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'deletions'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Deletion Requests ({pendingDeletions.length})
          </button>
        </nav>
      </div>

      {/* Bills Tab */}
      {activeTab === 'bills' && (
        <div className="space-y-4">
          {pendingBills.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No pending bills</h3>
              <p className="mt-1 text-sm text-gray-500">All bills have been reviewed.</p>
            </div>
          ) : (
            pendingBills.map(bill => (
              <Card key={bill._id} className="border-l-4 border-l-yellow-400">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{bill.title}</CardTitle>
                      <CardDescription>
                        Created by {bill.createdBy?.name} ({bill.createdBy?.role}) • {new Date(bill.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                        Pending Approval
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">{bill.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Amount:</span>
                        <p className="text-gray-900">${bill.amount}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Category:</span>
                        <p className="text-gray-900">{bill.category}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Priority:</span>
                        <p className="text-gray-900">{bill.priority}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Due Date:</span>
                        <p className="text-gray-900">{bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : 'Not set'}</p>
                      </div>
                    </div>

                    {bill.assignedUsers && bill.assignedUsers.length > 0 && (
                      <div>
                        <span className="font-medium text-gray-700 text-sm">Assigned to:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {bill.assignedUsers.map(user => (
                            <span key={user._id} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {user.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end space-x-3 pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => handleReject('bill', bill._id)}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        Reject
                      </Button>
                      <Button
                        onClick={() => handleApprove('bill', bill._id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {pendingReports.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No pending reports</h3>
              <p className="mt-1 text-sm text-gray-500">All reports have been reviewed.</p>
            </div>
          ) : (
            pendingReports.map(report => (
              <Card key={report._id} className="border-l-4 border-l-yellow-400">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                      <CardDescription>
                        Created by {report.createdBy?.name} ({report.createdBy?.role}) • {new Date(report.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                        Pending Approval
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">{report.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Category:</span>
                        <p className="text-gray-900">{report.category || 'Not specified'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Priority:</span>
                        <p className="text-gray-900">{report.priority}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Status:</span>
                        <p className="text-gray-900">{report.status}</p>
                      </div>
                    </div>

                    {report.assignedUsers && report.assignedUsers.length > 0 && (
                      <div>
                        <span className="font-medium text-gray-700 text-sm">Assigned to:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {report.assignedUsers.map(user => (
                            <span key={user._id} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {user.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end space-x-3 pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => handleReject('report', report._id)}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        Reject
                      </Button>
                      <Button
                        onClick={() => handleApprove('report', report._id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Deletion Requests Tab */}
      {activeTab === 'deletions' && (
        <div className="space-y-4">
          {pendingDeletions.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No pending deletion requests</h3>
              <p className="mt-1 text-sm text-gray-500">All deletion requests have been reviewed.</p>
            </div>
          ) : (
            pendingDeletions.map(report => (
              <Card key={report._id} className="border-l-4 border-l-red-400">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg text-red-800">{report.title}</CardTitle>
                      <CardDescription>
                        Deletion requested by {report.createdBy?.name} ({report.createdBy?.role}) • {new Date(report.updatedAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                        Pending Deletion
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">{report.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Category:</span>
                        <p className="text-gray-900">{report.category || 'Not specified'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Priority:</span>
                        <p className="text-gray-900">{report.priority}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Created:</span>
                        <p className="text-gray-900">{new Date(report.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {report.assignedUsers && report.assignedUsers.length > 0 && (
                      <div>
                        <span className="font-medium text-gray-700 text-sm">Assigned to:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {report.assignedUsers.map(user => (
                            <span key={user._id} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {user.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end space-x-3 pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => handleRejectDeletion(report._id)}
                        className="text-green-600 border-green-300 hover:bg-green-50"
                      >
                        Restore Report
                      </Button>
                      <Button
                        onClick={() => handleApproveDeletion(report._id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Approve Deletion
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Rejection Reason Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Reject {pendingRejection?.type === 'bill' ? 'Bill' : 'Report'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this {pendingRejection?.type}:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Please provide a reason for rejection..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
            />
            <div className="flex justify-end space-x-3 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectionModal(false);
                  setPendingRejection(null);
                  setRejectionReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmReject}
                className="bg-red-600 hover:bg-red-700"
              >
                Submit Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminCreateReport = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm({
    resolver: zodResolver(reportSchema),
  });

  const assignedUsers = watch('assignedUsers') || [];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      console.log('Fetching assignable users...');
      const response = await axios.get('http://localhost:5001/api/reports/users/assignable');
      console.log('Users received:', response.data);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Create FormData to handle file upload
      const formData = new FormData();
      
      // Add all form fields
      formData.append('title', data.title);
      formData.append('description', data.description || '');
      formData.append('category', data.category);
      formData.append('priority', data.priority || 'medium');
      formData.append('amount', data.amount);
      if (data.dueDate) formData.append('dueDate', data.dueDate);
      
      // Add assigned users as JSON string
      if (data.assignedUsers && data.assignedUsers.length > 0) {
        formData.append('assignedUsers', JSON.stringify(data.assignedUsers));
      }
      
      // Add tags as JSON string
      if (data.tags) {
        const tagsArray = data.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        formData.append('tags', JSON.stringify(tagsArray));
      }
      
      // Add file if selected
      if (selectedFiles.length > 0) {
        console.log('Uploading file:', selectedFiles[0]);
        formData.append('file', selectedFiles[0]); // Only upload first file for now
      } else {
        console.log('No files selected');
      }

      console.log('Sending report data:', {
        title: data.title,
        category: data.category,
        amount: data.amount,
        hasFile: selectedFiles.length > 0
      });

      const response = await axios.post('http://localhost:5001/api/reports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert('Report created successfully! (Auto-approved as admin)');
      navigate('/admin/reports');
    } catch (error) {
      console.error('Error creating report:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Error creating report';
      alert(`Error creating report: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Create New Report</h2>
          <p className="mt-2 text-gray-600">Create a new report (automatically approved as admin)</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/admin/reports')}>
          Back to Reports
        </Button>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Report Details</CardTitle>
          <CardDescription>
            Fill in the details to create a new report. As an admin, this report will be automatically approved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Report Title *
              </label>
              <Input
                {...register('title')}
                placeholder="Enter report title"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter report description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  {...register('category', { required: 'Category is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Category</option>
                  <option value="electricity">Electricity</option>
                  <option value="water">Water</option>
                  <option value="gas">Gas</option>
                  <option value="internet">Internet</option>
                  <option value="phone">Phone</option>
                  <option value="rent">Rent</option>
                  <option value="insurance">Insurance</option>
                  <option value="other">Other</option>
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount *
                </label>
                <Input
                  {...register('amount')}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className={errors.amount ? 'border-red-500' : ''}
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  {...register('priority')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <Input
                {...register('dueDate')}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign to Users
              </label>
              <select
                multiple
                {...register('assignedUsers')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {users.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.registrationNumber})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">Hold Ctrl/Cmd to select multiple users</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <Input
                {...register('tags')}
                placeholder="Enter tags separated by commas"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attach Files
              </label>
              <FileUpload
                onFileSelect={setSelectedFiles}
                maxFiles={5}
                acceptedTypes={{
                  'application/pdf': ['.pdf'],
                  'application/msword': ['.doc'],
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
                  'application/vnd.ms-excel': ['.xls'],
                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
                  'text/plain': ['.txt'],
                  'image/*': ['.jpg', '.jpeg', '.png', '.gif']
                }}
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/reports')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Report (Auto-Approved)'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
