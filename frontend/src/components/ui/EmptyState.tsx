import React from "react";
import Link from "next/link";
import { FiAlertTriangle } from "react-icons/fi"; // Default icon if none provided

interface EmptyStateProps {
  title: string;
  description?: string;
  actionText?: string;
  actionLink?: string;
  onActionClick?: () => void;
  icon?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  actionLink,
  onActionClick,
  icon = <FiAlertTriangle className="text-slate-500 text-5xl" />, // Default icon
}) => {
  return (
    <div className="text-center py-10 sm:py-16 px-6 flex flex-col items-center">
      {icon && (
        <div className="inline-flex items-center justify-center p-4 bg-tertiary rounded-full shadow-md mb-6">
          {icon}
        </div>
      )}
      <h3 className="text-2xl font-semibold text-primary mb-3">
        {title}
      </h3>
      {description && (
        <p className="text-secondary mb-8 max-w-md mx-auto">
          {description}
        </p>
      )}
      {actionText && (actionLink || onActionClick) && (
        actionLink ? (
          <Link
            href={actionLink}
            className="inline-flex items-center justify-center px-6 py-3 bg-brand-primary text-white rounded-lg font-semibold text-base transition-all duration-normal shadow-sm hover:bg-brand-primary-hover focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
          >
            {actionText}
          </Link>
        ) : (
          <button
            onClick={onActionClick}
            type="button"
            className="inline-flex items-center justify-center px-6 py-3 bg-brand-primary text-white rounded-lg font-semibold text-base transition-all duration-normal shadow-sm hover:bg-brand-primary-hover focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
          >
            {actionText}
          </button>
        )
      )}
    </div>
  );
};

export default EmptyState;
