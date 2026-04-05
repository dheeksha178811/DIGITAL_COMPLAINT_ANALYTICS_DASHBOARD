import api from './api';

export const complaintService = {
  // Create complaint
  createComplaint: async (complaintData) => {
    const response = await api.post('/complaints', complaintData);
    return response.data;
  },

  // Get my complaints
  getMyComplaints: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/complaints/my?${params}`);
    return response.data;
  },

  // Get single complaint
  getComplaint: async (id) => {
    const response = await api.get(`/complaints/${id}`);
    return response.data;
  },

  // Vote on complaint
  voteOnComplaint: async (id) => {
    const response = await api.post(`/complaints/${id}/vote`);
    return response.data;
  },

  // Get all complaints (with filters)
  getAllComplaints: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/complaints?${params}`);
    return response.data;
  }
};

export const adminService = {
  // Get admin complaints
  getAdminComplaints: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/admin/complaints?${params}`);
    return response.data;
  },

  // Update complaint
  updateComplaint: async (id, updates) => {
    const response = await api.put(`/admin/complaints/${id}`, updates);
    return response.data;
  },

  // Get escalation history for a complaint
  getEscalationHistory: async (id) => {
    const response = await api.get(`/admin/complaints/${id}/escalations`);
    return response.data;
  },

  // Escalate complaint
  escalateComplaint: async (id, data) => {
    const response = await api.post(`/admin/complaints/${id}/escalate`, data);
    return response.data;
  },

  // Get Level 2 Manual Escalations
  getManualEscalations: async () => {
    const response = await api.get('/admin/manual-escalations');
    return response.data;
  },

  // Create notice
  createNotice: async (noticeData) => {
    const response = await api.post('/admin/notices', noticeData);
    return response.data;
  },

  // Get admin notices
  getAdminNotices: async () => {
    const response = await api.get('/admin/notices');
    return response.data;
  }
};

export const analyticsService = {
  // Get dashboard overview
  getDashboard: async (geoId) => {
    const response = await api.get(`/analytics/dashboard/${geoId}`);
    return response.data;
  },

  // Get resolution rate
  getResolutionRate: async (geoId, startDate, endDate) => {
    const params = new URLSearchParams({ startDate, endDate }).toString();
    const response = await api.get(`/analytics/resolution-rate/${geoId}?${params}`);
    return response.data;
  },

  // Get risk score
  getRiskScore: async (geoId) => {
    const response = await api.get(`/analytics/risk-score/${geoId}`);
    return response.data;
  },

  // Get category distribution
  getCategoryDistribution: async (geoId) => {
    const response = await api.get(`/analytics/category-distribution/${geoId}`);
    return response.data;
  }
};

export const publicService = {
  // Get public stats
  getPublicStats: async () => {
    const response = await api.get('/public/stats');
    return response.data;
  },

  // Get public notices
  getPublicNotices: async (geoUnitId) => {
    const params = geoUnitId ? `?geographic_unit_id=${geoUnitId}` : '';
    const response = await api.get(`/public/notices${params}`);
    return response.data;
  },

  // Get geographic units
  getGeographicUnits: async (parentId = null, type = null) => {
    const params = new URLSearchParams();
    if (parentId !== null && parentId !== undefined) {
      params.append('parent_id', parentId);
    }
    if (type) {
      params.append('type', type);
    }
    const queryString = params.toString();
    const url = `/public/geographic-units${queryString ? '?' + queryString : ''}`;
    console.log('Fetching geographic units:', url, { parentId, type });
    const response = await api.get(url);
    console.log('Geographic units response:', response.data);
    return response.data;
  },

  // Get geographic hierarchy
  getGeographicHierarchy: async (id) => {
    const response = await api.get(`/public/geographic-units/${id}/hierarchy`);
    return response.data;
  }
};
