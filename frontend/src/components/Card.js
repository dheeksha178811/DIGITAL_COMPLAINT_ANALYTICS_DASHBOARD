import React from 'react';
import './Card.css';

const Card = ({ title, value, icon, color = '#3b82f6', subtitle }) => {
  return (
    <div className="card" style={{ borderTopColor: color }}>
      <div className="card-header">
        <div className="card-icon" style={{ background: `${color}20`, color }}>
          {icon}
        </div>
        <div className="card-info">
          <div className="card-title">{title}</div>
          <div className="card-value">{value}</div>
          {subtitle && <div className="card-subtitle">{subtitle}</div>}
        </div>
      </div>
    </div>
  );
};

export default Card;
