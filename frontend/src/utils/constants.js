export const CATEGORIES = [
  { value: 'WATER_SUPPLY', label: 'Water Supply' },
  { value: 'ELECTRICITY', label: 'Electricity' },
  { value: 'ROAD_MAINTENANCE', label: 'Road Maintenance' },
  { value: 'GARBAGE_COLLECTION', label: 'Garbage Collection' },
  { value: 'STREET_LIGHTING', label: 'Street Lighting' },
  { value: 'DRAINAGE', label: 'Drainage' },
  { value: 'PUBLIC_HEALTH', label: 'Public Health' },
  { value: 'TRAFFIC', label: 'Traffic' },
  { value: 'POLLUTION', label: 'Pollution' },
  { value: 'ILLEGAL_CONSTRUCTION', label: 'Illegal Construction' },
  { value: 'PARKS_GARDENS', label: 'Parks & Gardens' },
  { value: 'OTHER', label: 'Other' }
];

export const STATUS_OPTIONS = [
  { value: 'SUBMITTED', label: 'Submitted', color: '#2196F3' },
  { value: 'ASSIGNED', label: 'Assigned', color: '#9C27B0' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: '#FF9800' },
  { value: 'RESOLVED', label: 'Resolved', color: '#4CAF50' },
  { value: 'REJECTED', label: 'Rejected', color: '#F44336' },
  { value: 'OVERDUE', label: 'Overdue', color: '#D32F2F' }
];

export const IMPACT_LEVELS = [
  { value: 'LOW', label: 'Low', color: '#4CAF50' },
  { value: 'MODERATE', label: 'Moderate', color: '#FF9800' },
  { value: 'HIGH', label: 'High', color: '#FF5722' },
  { value: 'CRITICAL', label: 'Critical', color: '#F44336' }
];

export const ROLE_LABELS = {
  CITIZEN: 'Resident',
  ADMIN: 'Officer',
  SUPER_ADMIN: 'Super Admin',
  GOVERNMENT_ANALYST: 'Analyst'
};

export const ADMIN_LEVELS = [
  { value: 1, label: 'Level 1 Officer (Field)' },
  { value: 2, label: 'Level 2 Officer (Division)' },
  { value: 3, label: 'Level 3 Officer (District)' }
];

export const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDateTime = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getStatusColor = (status) => {
  const option = STATUS_OPTIONS.find(s => s.value === status);
  return option?.color || '#757575';
};

export const getImpactColor = (level) => {
  const option = IMPACT_LEVELS.find(i => i.value === level);
  return option?.color || '#757575';
};

export const getCategoryLabel = (value) => {
  const category = CATEGORIES.find(c => c.value === value);
  return category?.label || value;
};

export const truncateText = (text, length = 100) => {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
};
