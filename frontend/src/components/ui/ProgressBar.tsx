import React from "react";

interface ProgressBarProps {
  percentage: number;
  color?: "default" | "success" | "warning" | "danger";
  size?: "sm" | "md" | "lg";
  showPercentage?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  color = "default",
  size = "md",
  showPercentage = false,
}) => {
  // Renk sınıflarını tanımla
  const colorClasses = {
    default: "bg-gradient-to-r from-indigo-500 to-purple-500",
    success: "bg-gradient-to-r from-emerald-400 to-emerald-500",
    warning: "bg-gradient-to-r from-amber-400 to-amber-500",
    danger: "bg-gradient-to-r from-rose-400 to-rose-500",
  };

  // Boyut sınıflarını tanımla
  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  return (
    <div className="relative w-full">
      <div
        className={`w-full ${sizeClasses[size]} bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden`}
      >
        <div
          className={`${sizeClasses[size]} ${colorClasses[color]} transition-all duration-500 ease-out`}
          style={{ width: `${Math.min(Math.max(percentage, 0), 100)}%` }}
        />
      </div>

      {showPercentage && (
        <div className="absolute right-0 top-0 transform -translate-y-full mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">
          %{Math.round(percentage)}
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
