import React from 'react';
import { getStatusColor, getImpactColor } from '../utils/constants';
import './StatusBadge.css';

const StatusBadge = ({ status, type = 'status' }) => {
  const color = type === 'status' ? getStatusColor(status) : getImpactColor(status);
  
  return (
    <span 
      className="status-badge" 
      style={{ 
        backgroundColor: `${color}20`, 
        color: color,
        borderColor: color
      }}
    >
      {status?.replace('_', ' ')}
    </span>
  );
};

export default StatusBadge;
