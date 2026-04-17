import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaintService } from '../services/complaintService';
import { CATEGORIES } from '../utils/constants';
import LoadingSpinner from '../components/LoadingSpinner';
import './NewComplaintPage.css';

const NewComplaintPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: {
      address: '',
      landmark: ''
    },
    image: null
  });
  const [errors, setErrors] = useState({});

  // No need to load geographic units - using user's registered location

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'image') {
      setFormData({ ...formData, image: e.target.files[0] });
    } else if (name.startsWith('location.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        location: { ...formData.location, [field]: value }
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }

    // Clear error for this field
    setErrors({ ...errors, [name]: '' });
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    if (!formData.location.address.trim()) {
      newErrors.address = 'Specific location/address is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);

      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('category', formData.category);
      submitData.append('location_address', formData.location.address);
      if (formData.location.landmark) {
        submitData.append('location_landmark', formData.location.landmark);
      }
      if (formData.image) {
        submitData.append('image', formData.image);
      }

      await complaintService.createComplaint(submitData);

      // Redirect to complaints list
      navigate('/complaints');
    } catch (error) {
      console.error('Error creating complaint:', error);

      // Check if backend validation errors exist
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const backendErrors = {};
        error.response.data.errors.forEach(err => {
          const param = err.path || err.param || '';
          const field = param === 'location_address' ? 'address' : param;
          backendErrors[field] = err.msg;
        });
        setErrors({
          ...backendErrors,
          submit: 'Please fix the errors below'
        });
      } else {
        setErrors({
          submit: error.response?.data?.message || 'Failed to create complaint'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Submitting complaint..." />;
  }

  return (
    <div className="new-complaint-page">
      <div className="page-header">
        <h1>File New Complaint</h1>
        <p>Submit a civic complaint for your registered area</p>
      </div>

      <div className="form-container">
        {errors.submit && (
          <div className="error-alert">{errors.submit}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Complaint Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Brief title for your complaint"
              maxLength={200}
            />
            {errors.title && <span className="error-text">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label>Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
            >
              <option value="">Select a category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            {errors.category && <span className="error-text">{errors.category}</span>}
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Detailed description of the issue"
              rows={6}
              maxLength={2000}
            />
            <div className="char-count">
              {formData.description.length} / 2000
            </div>
            {errors.description && <span className="error-text">{errors.description}</span>}
          </div>

          <div className="form-group">
            <label>Specific Location of Problem *</label>
            <input
              type="text"
              name="location.address"
              value={formData.location.address}
              onChange={handleChange}
              placeholder="e.g., Near City Market, Main Road Junction, Behind School"
            />
            <small className="field-hint">
              Provide the exact location within your area where the issue is occurring
            </small>
            {errors.address && <span className="error-text">{errors.address}</span>}
          </div>

          <div className="form-group">
            <label>Landmark (Optional)</label>
            <input
              type="text"
              name="location.landmark"
              value={formData.location.landmark}
              onChange={handleChange}
              placeholder="e.g., Opposite SBI Bank, Near Bus Stop"
            />
            <small className="field-hint">
              Reference point to help locate the issue easily
            </small>
          </div>

          <div className="form-group">
            <label>Upload Image (Optional)</label>
            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={handleChange}
              className="file-input"
            />
            <small className="field-hint">
              Attach a photo to help authorities understand the issue better (Max: 5MB)
            </small>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/complaints')}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewComplaintPage;
