import React from 'react';
import './NodeSkeleton.css';

const NodeSkeleton: React.FC = () => {
  return (
    <div className="node-skeleton" aria-hidden="true">
      <div className="skeleton-header"></div>
      <div className="skeleton-content">
        <div className="skeleton-line"></div>
        <div className="skeleton-line short"></div>
      </div>
    </div>
  );
};

export default NodeSkeleton;
