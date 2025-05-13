import React from "react";

export interface DocumentType {
  id: string;
  name: string;
  uploadedAt: string;
  size: number; // byte cinsinden
}

interface DocumentListProps {
  documents: DocumentType[];
  onDelete?: (id: string) => void;
  onSelect?: (id: string) => void;
}

/**
 * Belgeleri listeleyen atomik bileşen
 */
export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onDelete,
  onSelect,
}) => {
  if (!documents || documents.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        Hiç belge bulunamadı.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
      {documents.map((doc) => (
        <li
          key={doc.id}
          className="flex items-center justify-between py-3 px-2"
        >
          <div
            className={
              onSelect ? "cursor-pointer hover:text-blue-600 flex-1" : "flex-1"
            }
            onClick={onSelect ? () => onSelect(doc.id) : undefined}
          >
            <div className="font-medium text-gray-900 dark:text-white">
              {doc.name}
            </div>
            <div className="text-xs text-gray-400">
              Yüklenme: {doc.uploadedAt} • {(doc.size / 1024).toFixed(1)} KB
            </div>
          </div>
          {onDelete && (
            <button
              className="text-xs text-red-500 hover:underline ml-2"
              onClick={() => onDelete(doc.id)}
            >
              Sil
            </button>
          )}
        </li>
      ))}
    </ul>
  );
};

export default DocumentList;
