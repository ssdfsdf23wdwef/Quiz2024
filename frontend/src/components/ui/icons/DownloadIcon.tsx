import React from 'react';

interface DownloadIconProps {
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export const DownloadIcon: React.FC<DownloadIconProps> = ({
  size = 24,
  strokeWidth = 1.5,
  className = "",
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M12 15L12 3M12 15L8 11M12 15L16 11"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 21H16C18.2091 21 20 19.2091 20 17V15"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 15V17C4 19.2091 5.79086 21 8 21"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}; 