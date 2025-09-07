import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import FileUpload from '../components/FileUpload';
import { 
  Upload, 
  FileText, 
  Download, 
  Eye, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Plus,
  BarChart3,
  Receipt,
  CreditCard,
  Home,
  Zap
} from 'lucide-react';

const UserDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/user', icon: Home, current: location.pathname === '/user' || location.pathname === '/user/' },
    { name: 'My Bills', href: '/user/my-bills', icon: Receipt, current: location.pathname.endsWith('/my-bills') },
    { name: 'Upload Bill', href: '/user/upload', icon: Upload, current: location.pathname.endsWith('/upload') },
    { name: 'Bill Analytics', href: '/user/analytics', icon: BarChart3, current: location.pathname.endsWith('/analytics') },
    { name: 'Search Bills', href: '/user/search', icon: Search, current: location.pathname.endsWith('/search') },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">User Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Welcome back, {user?.name} ({user?.registrationNumber})
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.profileInfo?.department}</p>
                  <p className="text-sm text-gray-500">{user?.profileInfo?.position}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold text-lg">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-64">
            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      item.current
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-3 py-2 text-sm font-medium border-l-4 transition-colors`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<UserOverview />} />
              <Route path="my-bills" element={<MyBills />} />
              <Route path="upload" element={<UploadBill />} />
              <Route path="analytics" element={<BillAnalytics />} />
              <Route path="search" element={<SearchBills />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
};

const UserOverview = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBills: 0,
    pendingBills: 0,
    totalAmount: 0,
    thisMonthBills: 0
  });

  useEffect(() => {
    fetchMyBills();
  }, []);

  const fetchMyBills = async () => {
    try {
      console.log('Fetching user bills...');
      const response = await axios.get('http://localhost:5001/api/bills/my-bills');
      console.log('User bills response:', response.data);
      setBills(response.data.bills || response.data);
      
      // Calculate stats
      const billsData = response.data.bills || response.data;
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthBills = billsData.filter(bill => 
        new Date(bill.createdAt) >= thisMonth
      ).length;
      
      const pendingBills = billsData.filter(bill => 
        bill.status === 'draft' || bill.status === 'pending'
      ).length;
      
      setStats({
        totalBills: billsData.length,
        pendingBills,
        totalAmount: billsData.reduce((sum, bill) => sum + (bill.amount || 0), 0),
        thisMonthBills
      });
    } catch (error) {
      console.error('Error fetching bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadBillFile = async (billId, fileId, fileName) => {
    try {
      const response = await axios.get(`http://localhost:5001/api/bills/${billId}/files/${fileId}/download`, {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading your bills...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome to Bill Management</h1>
        <p className="text-blue-100">Track, manage, and analyze your bills in one place</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Bills</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalBills}</dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Bills</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.pendingBills}</dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Amount</dt>
                  <dd className="text-lg font-medium text-gray-900">${stats.totalAmount.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">This Month</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.thisMonthBills}</dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link to="/user/upload">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Upload New Bill</h3>
              <p className="text-sm text-gray-500">Upload your latest bill for processing</p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link to="/user/my-bills">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">View My Bills</h3>
              <p className="text-sm text-gray-500">Browse and manage all your bills</p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link to="/user/analytics">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Bill Analytics</h3>
              <p className="text-sm text-gray-500">Analyze your spending patterns</p>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Recent Bills */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Receipt className="w-5 h-5 mr-2" />
            Recent Bills
          </CardTitle>
          <CardDescription>Your latest bill uploads and updates</CardDescription>
        </CardHeader>
        <CardContent>
          {bills.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No bills uploaded yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start by uploading your first bill to get started with bill management.
              </p>
              <div className="mt-6">
                <Link to="/user/upload">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Upload Your First Bill
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {bills.slice(0, 5).map(bill => (
                <div key={bill._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{bill.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">{bill.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                        <span>Uploaded: {new Date(bill.createdAt).toLocaleDateString()}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          bill.status === 'active' ? 'bg-green-100 text-green-800' :
                          bill.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {bill.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {bill.files && bill.files.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {bill.files.slice(0, 2).map((file, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => downloadBillFile(bill._id, file._id, file.originalName)}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            {file.originalName.length > 10 ? 
                              file.originalName.substring(0, 10) + '...' : 
                              file.originalName
                            }
                          </Button>
                        ))}
                        {bill.files.length > 2 && (
                          <span className="text-xs text-gray-500">+{bill.files.length - 2} more</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">No files</span>
                    )}
                  </div>
                </div>
              ))}
              
              {bills.length > 5 && (
                <div className="text-center pt-4">
                  <Link to="/user/my-bills">
                    <Button variant="outline">
                      View all {bills.length} bills
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const MyBills = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchMyBills();
  }, []);

  const fetchMyBills = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/bills/my-bills');
      setBills(response.data.bills || response.data);
    } catch (error) {
      console.error('Error fetching bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadBillFile = async (billId, fileId, fileName) => {
    try {
      const response = await axios.get(`http://localhost:5001/api/bills/${billId}/files/${fileId}/download`, {
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

  const filteredBills = bills.filter(bill => {
    const matchesSearch = bill.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bill.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || bill.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading your bills...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Bills</h1>
          <p className="text-gray-600">Manage and track all your bills</p>
        </div>
        <Link to="upload">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Upload New Bill
          </Button>
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search bills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Bills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBills.map(bill => (
          <Card key={bill._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{bill.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {bill.description || 'No description'}
                  </CardDescription>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  bill.status === 'active' ? 'bg-green-100 text-green-800' :
                  bill.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {bill.status}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Category</span>
                  <span className="text-sm font-medium">{bill.category || 'Not specified'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Priority</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    bill.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                    bill.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                    bill.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {bill.priority}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Created</span>
                  <span className="text-sm">
                    {new Date(bill.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {bill.tags && bill.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {bill.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                    {bill.tags.length > 3 && (
                      <span className="text-xs text-gray-500">+{bill.tags.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                {bill.files && bill.files.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Files:</p>
                    <div className="flex flex-wrap gap-2">
                      {bill.files.map((file, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => downloadBillFile(bill._id, file._id, file.originalName)}
                          className="text-xs"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          {file.originalName}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center">No files attached</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBills.length === 0 && (
        <div className="text-center py-12">
          <Receipt className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No bills found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filterStatus !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Start by uploading your first bill.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

const UploadBill = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [billData, setBillData] = useState({
    title: '',
    description: '',
    category: '',
    amount: '',
    dueDate: '',
    tags: ''
  });
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBillData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Create the bill first
      const billDataToSend = {
        title: billData.title,
        description: billData.description,
        category: billData.category,
        amount: parseFloat(billData.amount) || 0,
        dueDate: billData.dueDate,
        priority: 'medium',
        tags: billData.tags ? billData.tags.split(',').map(tag => tag.trim()) : []
      };

      const response = await axios.post('http://localhost:5001/api/bills', billDataToSend);
      
      // Upload files if any
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        selectedFiles.forEach(file => {
          formData.append('files', file);
        });
        
        await axios.post(`http://localhost:5001/api/bills/${response.data.bill._id}/files`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      alert('Bill uploaded successfully!');
      navigate('/user/my-bills');
    } catch (error) {
      console.error('Error uploading bill:', error);
      alert('Error uploading bill');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload New Bill</h1>
        <p className="text-gray-600">Upload and categorize your bill for easy management</p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Bill Information</CardTitle>
          <CardDescription>
            Fill in the details about your bill
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bill Title *
              </label>
              <Input
                name="title"
                value={billData.title}
                onChange={handleInputChange}
                placeholder="e.g., Electric Bill - January 2024"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={billData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Additional details about this bill..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  name="category"
                  value={billData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select category</option>
                  <option value="electricity">Electricity</option>
                  <option value="water">Water</option>
                  <option value="gas">Gas</option>
                  <option value="internet">Internet</option>
                  <option value="phone">Phone</option>
                  <option value="rent">Rent</option>
                  <option value="insurance">Insurance</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount ($)
                </label>
                <Input
                  name="amount"
                  type="number"
                  step="0.01"
                  value={billData.amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <Input
                name="dueDate"
                type="date"
                value={billData.dueDate}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <Input
                name="tags"
                value={billData.tags}
                onChange={handleInputChange}
                placeholder="Enter tags separated by commas (e.g., urgent, monthly, auto-pay)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attach Bill Files
              </label>
              <FileUpload
                onFileSelect={setSelectedFiles}
                maxFiles={5}
                acceptedTypes={{
                  'application/pdf': ['.pdf'],
                  'image/*': ['.jpg', '.jpeg', '.png', '.gif'],
                  'application/msword': ['.doc'],
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
                }}
              />
              <p className="mt-1 text-xs text-gray-500">
                Supported formats: PDF, Images, Word documents (Max 5 files)
              </p>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/user/my-bills')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Uploading...' : 'Upload Bill'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

const BillAnalytics = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalAmount: 0,
    averageAmount: 0,
    categoryBreakdown: {},
    monthlyTrend: [],
    statusBreakdown: {}
  });

  useEffect(() => {
    fetchBillsAndAnalytics();
  }, []);

  const fetchBillsAndAnalytics = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/bills/analytics');
      const analyticsData = response.data;
      
      setBills([]); // We don't need individual bills for analytics
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bill Analytics</h1>
        <p className="text-gray-600">Insights and trends from your bill data</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Amount</dt>
                  <dd className="text-lg font-medium text-gray-900">${analytics.totalAmount.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Average Amount</dt>
                  <dd className="text-lg font-medium text-gray-900">${analytics.averageAmount.toFixed(2)}</dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Bills</dt>
                  <dd className="text-lg font-medium text-gray-900">{bills.length}</dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Bills by Category</CardTitle>
          <CardDescription>Distribution of your bills across different categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(analytics.categoryBreakdown).map(([category, count]) => {
              const percentage = bills.length > 0 ? (count / bills.length) * 100 : 0;
              return (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-900 capitalize">{category}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-500 w-12 text-right">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Trend</CardTitle>
          <CardDescription>Your bill activity over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.monthlyTrend.map((month, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-900">{month.month}</span>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">{month.count} bills</span>
                  <span className="text-sm font-medium text-gray-900">${month.amount.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Bill Status Overview</CardTitle>
          <CardDescription>Current status of all your bills</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(analytics.statusBreakdown).map(([status, count]) => (
              <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 ${
                  status === 'active' ? 'bg-green-100' :
                  status === 'draft' ? 'bg-yellow-100' :
                  'bg-gray-100'
                }`}>
                  {status === 'active' ? <CheckCircle className="w-5 h-5 text-green-600" /> :
                   status === 'draft' ? <Clock className="w-5 h-5 text-yellow-600" /> :
                   <AlertCircle className="w-5 h-5 text-gray-600" />}
                </div>
                <h3 className="text-lg font-medium text-gray-900">{count}</h3>
                <p className="text-sm text-gray-500 capitalize">{status}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const SearchBills = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchType, setSearchType] = useState('title');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setError('Please enter a search term');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Search through all user bills
      const response = await axios.get('http://localhost:5001/api/bills/my-bills');
      const allBills = response.data.bills || response.data;
      
      // Filter bills based on search term and type
      const filteredBills = allBills.filter(bill => {
        const searchLower = searchTerm.toLowerCase();
        switch (searchType) {
          case 'title':
            return bill.title.toLowerCase().includes(searchLower);
          case 'category':
            return bill.category?.toLowerCase().includes(searchLower);
          case 'tags':
            return bill.tags?.some(tag => tag.toLowerCase().includes(searchLower));
          case 'description':
            return bill.description?.toLowerCase().includes(searchLower);
          default:
            return bill.title.toLowerCase().includes(searchLower) ||
                   bill.description?.toLowerCase().includes(searchLower) ||
                   bill.category?.toLowerCase().includes(searchLower);
        }
      });
      
      setBills(filteredBills);
    } catch (error) {
      setError(error.response?.data?.message || 'Error searching for bills');
      setBills([]);
    } finally {
      setLoading(false);
    }
  };

  const downloadBillFile = async (billId, fileId, fileName) => {
    try {
      const response = await axios.get(`http://localhost:5001/api/bills/${billId}/files/${fileId}/download`, {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Search Bills</h1>
        <p className="text-gray-600">Find bills by title, category, tags, or description</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Bills</CardTitle>
          <CardDescription>Search through your bills using different criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Type
                </label>
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="title">Title</option>
                  <option value="category">Category</option>
                  <option value="tags">Tags</option>
                  <option value="description">Description</option>
                  <option value="all">All Fields</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Term
                </label>
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Enter search term..."
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              {loading ? 'Searching...' : 'Search Bills'}
            </Button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {bills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>Found {bills.length} bill(s) matching your search</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bills.map(bill => (
                <div key={bill._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-medium text-gray-900">{bill.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      bill.status === 'active' ? 'bg-green-100 text-green-800' :
                      bill.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {bill.status}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{bill.description || 'No description'}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Category:</span>
                      <span className="font-medium">{bill.category || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Priority:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        bill.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        bill.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        bill.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {bill.priority}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Created:</span>
                      <span>{new Date(bill.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {bill.tags && bill.tags.length > 0 && (
                    <div className="mt-3">
                      <div className="flex flex-wrap gap-1">
                        {bill.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                        {bill.tags.length > 3 && (
                          <span className="text-xs text-gray-500">+{bill.tags.length - 3}</span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    {bill.files && bill.files.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">Files:</p>
                        <div className="flex flex-wrap gap-2">
                          {bill.files.map((file, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              onClick={() => downloadBillFile(bill._id, file._id, file.originalName)}
                              className="text-xs"
                            >
                              <Download className="w-3 h-3 mr-1" />
                              {file.originalName}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 text-center">No files attached</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {bills.length === 0 && !loading && searchTerm && (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No bills found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search criteria or search term.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserDashboard;
