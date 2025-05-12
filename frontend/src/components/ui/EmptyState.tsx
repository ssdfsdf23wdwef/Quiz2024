import React from "react";
import Image from "next/image";
import Link from "next/link";

interface EmptyStateProps {
  title: string;
  description?: string;
  actionText?: string;
  actionLink?: string;
  imageSrc?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  actionLink,
  imageSrc = "/images/empty-state.svg", // Varsayılan görsel
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 min-h-[60vh] bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
      <div className="w-full max-w-md text-center">
        {imageSrc && (
          <div className="mx-auto w-24 h-24 mb-6 relative opacity-80">
            <Image
              src={imageSrc}
              alt="Boş durum görseli"
              fill
              className="object-contain"
            />
          </div>
        )}

        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
          {title}
        </h3>

        {description && (
          <p className="text-gray-600 dark:text-gray-400 mb-6">{description}</p>
        )}

        {actionText && actionLink && (
          <Link
            href={actionLink}
            className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
          >
            {actionText}
          </Link>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
