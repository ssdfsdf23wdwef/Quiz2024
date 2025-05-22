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
        <div className="inline-flex items-center justify-center p-4 bg-gradient-to-tr from-sky-100 to-indigo-100 dark:from-sky-800/50 dark:to-indigo-800/50 rounded-full shadow-lg mb-6">
          {icon}
        </div>
      )}
      <h3 className="text-2xl font-semibold text-slate-800 dark:text-white mb-3">
        {title}
      </h3>
      {description && (
        <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
          {description}
        </p>
      )}
      {actionText && (actionLink || onActionClick) && (
        actionLink ? (
          <Link
            href={actionLink}
            className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-lg font-semibold text-base transition-all duration-300 ease-in-out shadow-md hover:shadow-lg hover:from-sky-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 transform hover:scale-105"
          >
            {actionText}
          </Link>
        ) : (
          <button
            onClick={onActionClick}
            type="button" // Explicitly set button type
            className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-lg font-semibold text-base transition-all duration-300 ease-in-out shadow-md hover:shadow-lg hover:from-sky-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 transform hover:scale-105"
          >
            {actionText}
          </button>
        )
      )}
    </div>
  );
};

export default EmptyState;
