import React from 'react';

interface ShapeSvgProps {
  className?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export const CylinderShape: React.FC<ShapeSvgProps> = ({
  className = '',
  fill = 'currentColor',
  stroke = 'currentColor',
  strokeWidth = 2
}) => (
  <svg
    viewBox="0 0 200 240"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="none"
  >
    {/* Top ellipse */}
    <ellipse cx="100" cy="30" rx="90" ry="25" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    {/* Body */}
    <rect x="10" y="30" width="180" height="180" fill={fill} stroke="none" />
    {/* Left edge */}
    <line x1="10" y1="30" x2="10" y2="210" stroke={stroke} strokeWidth={strokeWidth} />
    {/* Right edge */}
    <line x1="190" y1="30" x2="190" y2="210" stroke={stroke} strokeWidth={strokeWidth} />
    {/* Bottom ellipse */}
    <ellipse cx="100" cy="210" rx="90" ry="25" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
  </svg>
);

export const HexagonShape: React.FC<ShapeSvgProps> = ({
  className = '',
  fill = 'currentColor',
  stroke = 'currentColor',
  strokeWidth = 2
}) => (
  <svg
    viewBox="0 0 200 180"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="none"
  >
    <polygon
      points="50,10 150,10 190,90 150,170 50,170 10,90"
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
  </svg>
);

export const DiamondShape: React.FC<ShapeSvgProps> = ({
  className = '',
  fill = 'currentColor',
  stroke = 'currentColor',
  strokeWidth = 2
}) => (
  <svg
    viewBox="0 0 200 200"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="none"
  >
    <polygon
      points="100,10 190,100 100,190 10,100"
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
  </svg>
);

export const ParallelogramShape: React.FC<ShapeSvgProps> = ({
  className = '',
  fill = 'currentColor',
  stroke = 'currentColor',
  strokeWidth = 2
}) => (
  <svg
    viewBox="0 0 220 120"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="none"
  >
    <polygon
      points="40,10 200,10 180,110 20,110"
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
  </svg>
);

export const CloudShape: React.FC<ShapeSvgProps> = ({
  className = '',
  fill = 'currentColor',
  stroke = 'currentColor',
  strokeWidth = 2
}) => (
  <svg
    viewBox="0 0 240 160"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M60,100 Q60,60 90,50 Q100,30 130,35 Q160,20 180,40 Q220,40 220,80 Q220,110 190,110 L60,110 Q30,110 30,80 Q30,100 60,100 Z"
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
  </svg>
);

export const ActorShape: React.FC<ShapeSvgProps> = ({
  className = '',
  fill = 'currentColor',
  stroke = 'currentColor',
  strokeWidth = 2
}) => (
  <svg
    viewBox="0 0 120 200"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Head */}
    <circle cx="60" cy="35" r="25" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    {/* Body */}
    <line x1="60" y1="60" x2="60" y2="120" stroke={stroke} strokeWidth={strokeWidth * 2} />
    {/* Arms */}
    <line x1="20" y1="85" x2="100" y2="85" stroke={stroke} strokeWidth={strokeWidth * 2} />
    {/* Legs */}
    <line x1="60" y1="120" x2="30" y2="180" stroke={stroke} strokeWidth={strokeWidth * 2} />
    <line x1="60" y1="120" x2="90" y2="180" stroke={stroke} strokeWidth={strokeWidth * 2} />
  </svg>
);

export const DocumentShape: React.FC<ShapeSvgProps> = ({
  className = '',
  fill = 'currentColor',
  stroke = 'currentColor',
  strokeWidth = 2
}) => (
  <svg
    viewBox="0 0 200 240"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="none"
  >
    <path
      d="M20,10 L140,10 L180,50 L180,230 L20,230 Z"
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
    {/* Folded corner */}
    <path
      d="M140,10 L140,50 L180,50"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
  </svg>
);

export const QueueShape: React.FC<ShapeSvgProps> = ({
  className = '',
  fill = 'currentColor',
  stroke = 'currentColor',
  strokeWidth = 2
}) => (
  <svg
    viewBox="0 0 240 100"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="none"
  >
    {/* Multiple stacked rectangles representing queue */}
    <rect x="20" y="15" width="60" height="70" fill={fill} stroke={stroke} strokeWidth={strokeWidth} opacity="0.4" />
    <rect x="50" y="15" width="60" height="70" fill={fill} stroke={stroke} strokeWidth={strokeWidth} opacity="0.6" />
    <rect x="80" y="15" width="60" height="70" fill={fill} stroke={stroke} strokeWidth={strokeWidth} opacity="0.8" />
    <rect x="110" y="15" width="60" height="70" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
  </svg>
);

export const StorageShape: React.FC<ShapeSvgProps> = ({
  className = '',
  fill = 'currentColor',
  stroke = 'currentColor',
  strokeWidth = 2
}) => (
  <svg
    viewBox="0 0 200 160"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="none"
  >
    {/* Drawer-like storage */}
    <rect x="20" y="20" width="160" height="40" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    <rect x="20" y="65" width="160" height="40" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    <rect x="20" y="110" width="160" height="40" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    {/* Handles */}
    <circle cx="100" cy="40" r="5" fill={stroke} />
    <circle cx="100" cy="85" r="5" fill={stroke} />
    <circle cx="100" cy="130" r="5" fill={stroke} />
  </svg>
);

// Export map for easy lookup
export const SVG_SHAPES = {
  cylinder: CylinderShape,
  hexagon: HexagonShape,
  diamond: DiamondShape,
  parallelogram: ParallelogramShape,
  cloud: CloudShape,
  actor: ActorShape,
  document: DocumentShape,
  queue: QueueShape,
  storage: StorageShape,
};
