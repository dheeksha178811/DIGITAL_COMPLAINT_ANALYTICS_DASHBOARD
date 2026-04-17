import api from './api';

export const performanceService = {
    // Get performance for all officers (Level 2+ only)
    getBulkPerformance: async () => {
        const response = await api.get('/analytics/officer-performance');
        return response.data;
    },

    // Get performance for a specific admin 
    getOfficerPerformance: async (adminId) => {
        const response = await api.get(`/analytics/officer-performance/${adminId}`);
        return response.data;
    }
};
