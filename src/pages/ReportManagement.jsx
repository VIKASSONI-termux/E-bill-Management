import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const ReportManagement = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard-container">
      <style jsx>{`
        .file-buttons {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .download-btn {
          background: #e5f3ff;
          border: 1px solid #b3d9ff;
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 11px;
          cursor: pointer;
          color: #0066cc;
          text-align: left;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .download-btn:hover {
          background: #cce7ff;
        }
        .no-files {
          color: #999;
          font-size: 12px;
          font-style: italic;
        }
      `}</style>
      <div className="dashboard-header">
        <h1>Report Management</h1>
        <p>Welcome, {user?.name}</p>
      </div>
      
      <div className="dashboard-content">
        <Routes>
          <Route path="/" element={<ReportOverview />} />
          <Route path="/upload" element={<UploadReport />} />
          <Route path="/edit/:id" element={<EditReport />} />
        </Routes>
      </div>
    </div>
  );
};

const ReportOverview = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/reports');
      setReports(response.data);
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

  if (loading) {
    return <div className="loading">Loading reports...</div>;
  }

  return (
    <div className="report-overview">
      <div className="page-header">
        <h2>All Reports</h2>
        <a href="/report-management/upload" className="upload-btn">
          Upload New Report
        </a>
      </div>
      
      <div className="reports-table">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Description</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Assigned Users</th>
              <th>Status</th>
              <th>Files</th>
              <th>Uploaded By</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map(report => (
              <tr key={report._id}>
                <td>{report.title}</td>
                <td>{report.description || 'No description'}</td>
                <td>{report.category || 'Not specified'}</td>
                <td>${report.amount || 0}</td>
                <td>
                  {report.assignedUsers?.length > 0 
                    ? report.assignedUsers.map(user => user.name).join(', ')
                    : 'No users assigned'
                  }
                </td>
                <td>
                  <span className={`status ${report.status}`}>
                    {report.status}
                  </span>
                </td>
                <td>
                  {report.files && report.files.length > 0 ? (
                    <div className="file-buttons">
                      {report.files.map((file, index) => (
                        <button
                          key={index}
                          onClick={() => downloadReportFile(report._id, file._id || index, file.originalName)}
                          className="download-btn"
                          title={file.originalName}
                        >
                          📄 {file.originalName.length > 15 ? 
                            file.originalName.substring(0, 15) + '...' : 
                            file.originalName
                          }
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="no-files">No files</span>
                  )}
                </td>
                <td>{report.createdBy?.name || report.uploadedBy?.name}</td>
                <td>{new Date(report.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      onClick={() => navigate(`/report-management/edit/${report._id}`)}
                      className="edit-btn"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => deleteReport(report._id)}
                      className="delete-btn"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const UploadReport = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    amount: '',
    dueDate: '',
    assignedUsers: [],
    tags: []
  });
  const [file, setFile] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/reports/users/assignable');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUserSelection = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData({
      ...formData,
      assignedUsers: selectedOptions
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setLoading(true);
    setError('');

    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('title', formData.title);
    uploadData.append('description', formData.description);
    uploadData.append('category', formData.category);
    uploadData.append('amount', formData.amount);
    if (formData.dueDate) uploadData.append('dueDate', formData.dueDate);
    uploadData.append('assignedUsers', JSON.stringify(formData.assignedUsers));
    uploadData.append('tags', JSON.stringify(formData.tags));

    try {
      await axios.post('http://localhost:5001/api/reports', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      alert('Report uploaded successfully!');
      window.location.href = '/report-management';
    } catch (error) {
      setError(error.response?.data?.message || 'Error uploading report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-report">
      <h2>Upload New Report</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label htmlFor="file">Select File</label>
          <input
            type="file"
            id="file"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
            required
            className="file-input"
          />
          <small>Supported formats: PDF, Word, Excel, Text files (Max 10MB)</small>
        </div>

        <div className="form-group">
          <label htmlFor="title">Report Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="form-input"
            placeholder="Enter report title"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="form-textarea"
            placeholder="Enter report description"
            rows="4"
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">Category *</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="form-select"
            required
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
        </div>

        <div className="form-group">
          <label htmlFor="amount">Amount *</label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            className="form-input"
            placeholder="0.00"
            step="0.01"
            min="0"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="dueDate">Due Date</label>
          <input
            type="date"
            id="dueDate"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleInputChange}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="assignedUsers">Assign to Users</label>
          <select
            id="assignedUsers"
            multiple
            value={formData.assignedUsers}
            onChange={handleUserSelection}
            className="form-select"
          >
            {users.map(user => (
              <option key={user._id} value={user._id}>
                {user.name} ({user.registrationNumber})
              </option>
            ))}
          </select>
          <small>Hold Ctrl/Cmd to select multiple users</small>
        </div>

        <div className="form-group">
          <label htmlFor="tags">Tags (comma-separated)</label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags.join(', ')}
            onChange={(e) => setFormData({
              ...formData,
              tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
            })}
            className="form-input"
            placeholder="Enter tags separated by commas"
          />
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'Uploading...' : 'Upload Report'}
          </button>
          <button 
            type="button" 
            onClick={() => window.location.href = '/report-management'}
            className="cancel-btn"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

const EditReport = () => {
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other',
    priority: 'medium',
    amount: 0,
    dueDate: '',
    assignedUsers: [],
    tags: [],
    status: 'active'
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const reportId = window.location.pathname.split('/').pop();
    fetchReport(reportId);
    fetchUsers();
  }, []);

  const fetchReport = async (reportId) => {
    try {
      const response = await axios.get(`http://localhost:5001/api/reports/${reportId}`);
      const reportData = response.data;
      setReport(reportData);
      setFormData({
        title: reportData.title,
        description: reportData.description || '',
        category: reportData.category || 'other',
        priority: reportData.priority || 'medium',
        amount: reportData.amount || 0,
        dueDate: reportData.dueDate ? new Date(reportData.dueDate).toISOString().split('T')[0] : '',
        assignedUsers: reportData.assignedUsers?.map(user => user._id) || [],
        tags: reportData.tags || [],
        status: reportData.status
      });
    } catch (error) {
      console.error('Error fetching report:', error);
      setError('Error loading report');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/reports/users/assignable');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleUserSelection = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData({
      ...formData,
      assignedUsers: selectedOptions
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await axios.put(`http://localhost:5001/api/reports/${report._id}`, {
        ...formData,
        assignedUsers: JSON.stringify(formData.assignedUsers),
        tags: JSON.stringify(formData.tags)
      });
      
      alert('Report updated successfully!');
      navigate('/report-management');
    } catch (error) {
      setError(error.response?.data?.message || 'Error updating report');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading report...</div>;
  }

  if (!report) {
    return <div className="error">Report not found</div>;
  }

  return (
    <div className="edit-report">
      <h2>Edit Report: {report.title}</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="edit-form">
        <div className="form-group">
          <label htmlFor="title">Report Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="form-textarea"
            rows="4"
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="form-select"
            required
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

        <div className="form-group">
          <label htmlFor="priority">Priority</label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleInputChange}
            className="form-select"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="amount">Amount</label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            className="form-input"
            step="0.01"
            min="0"
          />
        </div>

        <div className="form-group">
          <label htmlFor="dueDate">Due Date</label>
          <input
            type="date"
            id="dueDate"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleInputChange}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className="form-select"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="assignedUsers">Assign to Users</label>
          <select
            id="assignedUsers"
            multiple
            value={formData.assignedUsers}
            onChange={handleUserSelection}
            className="form-select"
          >
            {users.map(user => (
              <option key={user._id} value={user._id}>
                {user.name} ({user.registrationNumber})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className="form-select"
          >
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="tags">Tags (comma-separated)</label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags.join(', ')}
            onChange={(e) => setFormData({
              ...formData,
              tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
            })}
            className="form-input"
          />
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="submit-btn"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button 
            type="button" 
            onClick={() => window.location.href = '/report-management'}
            className="cancel-btn"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReportManagement;
