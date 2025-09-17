import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
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
  Plus, 
  Search, 
  Filter, 
  Download, 
  Edit, 
  Trash2, 
  Eye, 
  Upload,
  FileText,
  Users,
  Calendar,
  Tag
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

const EnhancedReportManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Report Management</h1>
          <p className="mt-2 text-gray-600">Manage and organize your bill reports</p>
        </div>
        
        <Routes>
          <Route path="/" element={<ReportOverview />} />
          <Route path="/create" element={<CreateReport />} />
          <Route path="/edit/:id" element={<EditReport />} />
          <Route path="/view/:id" element={<ViewReport />} />
        </Routes>
      </div>
    </div>
  );
};

const ReportOverview = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchReports();
  }, [currentPage, searchTerm, filterStatus]);

  const fetchReports = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        status: filterStatus !== 'all' ? filterStatus : ''
      });

      const response = await axios.get(`http://localhost:5001/api/reports?${params}`);
      setReports(response.data.reports || response.data);
      setTotalPages(response.data.pagination?.pages || 1);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteReport = async (reportId) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      try {
        await axios.delete(`http://localhost:5001/api/reports/${reportId}`);
        fetchReports();
      } catch (error) {
        console.error('Error deleting report:', error);
        alert('Error deleting report');
      }
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'archived': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search reports..."
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
        <Button onClick={() => navigate('create')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Report
        </Button>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <Card key={report._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{report.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {report.description || 'No description'}
                  </CardDescription>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`view/${report._id}`)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`edit/${report._id}`)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteReport(report._id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                    {report.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Priority</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(report.priority)}`}>
                    {report.priority}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Assigned Users</span>
                  <span className="text-sm font-medium">
                    {report.assignedUsers?.length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Created</span>
                  <span className="text-sm">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Files</span>
                  <div className="flex items-center space-x-1">
                    {report.files && report.files.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {report.files.slice(0, 2).map((file, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => downloadReportFile(report._id, file._id || index, file.originalName)}
                            className="text-xs px-2 py-1 h-6"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            {file.originalName.length > 8 ? 
                              file.originalName.substring(0, 8) + '...' : 
                              file.originalName
                            }
                          </Button>
                        ))}
                        {report.files.length > 2 && (
                          <span className="text-xs text-gray-500">+{report.files.length - 2}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">No files</span>
                    )}
                  </div>
                </div>
                {report.tags && report.tags.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <Tag className="h-3 w-3 text-gray-400" />
                    <div className="flex flex-wrap gap-1">
                      {report.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                      {report.tags.length > 3 && (
                        <span className="text-xs text-gray-500">+{report.tags.length - 3}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

const CreateReport = () => {
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

      alert('Report created successfully!');
      navigate('');
    } catch (error) {
      console.error('Error creating report:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Error creating report';
      alert(`Error creating report: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Report</CardTitle>
        <CardDescription>
          Fill in the details to create a new bill report
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
              onClick={() => navigate('')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Report'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

const EditReport = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const navigate = useNavigate();
  const { id } = useParams();

  // Helper functions for colors
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'archived': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
    fetchReport();
    fetchUsers();
  }, [id]);

  const fetchReport = async () => {
    try {
      console.log('Fetching report with ID:', id);
      const response = await axios.get(`http://localhost:5001/api/reports/${id}`);
      console.log('Report data received:', response.data);
      setReport(response.data);
      
      // Set form values
      setValue('title', response.data.title);
      setValue('description', response.data.description);
      setValue('category', response.data.category);
      setValue('priority', response.data.priority);
      setValue('amount', response.data.amount || 0);
      setValue('dueDate', response.data.dueDate ? new Date(response.data.dueDate).toISOString().split('T')[0] : '');
      setValue('status', response.data.status);
      setValue('assignedUsers', response.data.assignedUsers?.map(u => u._id) || []);
      setValue('tags', response.data.tags?.join(', ') || '');
      console.log('Form values set');
    } catch (error) {
      console.error('Error fetching report:', error);
      alert('Error fetching report');
    } finally {
      setLoading(false);
    }
  };

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

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      console.log('Submitting edit form with data:', data);
      
      // If there are new files to upload, use FormData
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('description', data.description || '');
        formData.append('category', data.category);
        formData.append('priority', data.priority);
        formData.append('status', data.status);
        formData.append('amount', data.amount || 0);
        formData.append('dueDate', data.dueDate || '');
        formData.append('assignedUsers', JSON.stringify(assignedUsers));
        formData.append('tags', JSON.stringify(data.tags ? data.tags.split(',').map(tag => tag.trim()) : []));
        
        // Add new files
        selectedFiles.forEach((file, index) => {
          formData.append('file', file);
        });

        console.log('Sending update request with FormData');
        const response = await axios.put(`http://localhost:5001/api/reports/${id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        console.log('Update response:', response.data);
      } else {
        // No new files, send regular JSON data
        const reportData = {
          ...data,
          assignedUsers: assignedUsers,
          tags: data.tags ? data.tags.split(',').map(tag => tag.trim()) : []
        };
        console.log('Sending update request with data:', reportData);

        const response = await axios.put(`http://localhost:5001/api/reports/${id}`, reportData);
        console.log('Update response:', response.data);
      }
      
      alert('Report updated successfully!');
      navigate('/report-management');
    } catch (error) {
      console.error('Error updating report:', error);
      alert('Error updating report');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!report) {
    return <div>Report not found</div>;
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Edit Report</CardTitle>
        <CardDescription>
          Update the report details
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                {...register('category')}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount
              </label>
              <Input
                {...register('amount')}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <Input
                {...register('dueDate')}
                type="date"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              {...register('status')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign to Users
            </label>
            <select
              multiple
              value={assignedUsers}
              onChange={(e) => {
                const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                setValue('assignedUsers', selectedOptions);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {users.map(user => (
                <option key={user._id} value={user._id}>
                  {user.name} ({user.registrationNumber})
                </option>
              ))}
            </select>
            <small className="text-gray-500">Hold Ctrl/Cmd to select multiple users</small>
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

          {/* Existing Files Section */}
          {report && report.files && report.files.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Existing Files
              </label>
              <div className="flex flex-wrap gap-2">
                {report.files.map((file, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => downloadReportFile(report._id, file._id || index, file.originalName)}
                    className="flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>{file.originalName}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* New File Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Add New Files
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
              onClick={() => navigate('/report-management')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Updating...' : 'Update Report'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

const ViewReport = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { id } = useParams();

  // Helper functions for colors
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'archived': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/api/reports/${id}`);
      setReport(response.data);
    } catch (error) {
      console.error('Error fetching report:', error);
      alert('Error fetching report');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!report) {
    return <div>Report not found</div>;
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">{report.title}</CardTitle>
            <CardDescription>
              Created by {report.createdBy?.name} on {new Date(report.createdAt).toLocaleDateString()}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/report-management')}
          >
            Back to Reports
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Report Details</h3>
            <div className="space-y-3">
              <div>
                <span className="font-medium">Description:</span>
                <p className="text-gray-600 mt-1">{report.description || 'No description provided'}</p>
              </div>
              <div>
                <span className="font-medium">Category:</span>
                <p className="text-gray-600 mt-1">{report.category || 'Not specified'}</p>
              </div>
              <div>
                <span className="font-medium">Priority:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(report.priority)}`}>
                  {report.priority}
                </span>
              </div>
              <div>
                <span className="font-medium">Status:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                  {report.status}
                </span>
              </div>
              <div>
                <span className="font-medium">Amount:</span>
                <p className="text-gray-600 mt-1">${report.amount || 0}</p>
              </div>
              <div>
                <span className="font-medium">Due Date:</span>
                <p className="text-gray-600 mt-1">
                  {report.dueDate ? new Date(report.dueDate).toLocaleDateString() : 'Not set'}
                </p>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Assigned Users</h3>
            {report.assignedUsers && report.assignedUsers.length > 0 ? (
              <div className="space-y-2">
                {report.assignedUsers.map(user => (
                  <div key={user._id} className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">
                        {user.name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.registrationNumber}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No users assigned</p>
            )}
          </div>
        </div>

        {report.tags && report.tags.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {report.tags.map((tag, index) => (
                <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {report.files && report.files.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Attached Files</h3>
            <div className="flex flex-wrap gap-2">
              {report.files.map((file, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => downloadReportFile(report._id, file._id || index, file.originalName)}
                  className="flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>{file.originalName}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate(`/report-management/edit/${id}`)}
          >
            Edit Report
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedReportManagement;
