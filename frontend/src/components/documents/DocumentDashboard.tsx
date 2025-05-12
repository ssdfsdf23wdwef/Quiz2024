import React from "react";
import DocumentUploader from "./DocumentUploader";
import DocumentList from "./DocumentList";
import {
  useDocuments,
  useUploadDocument,
  useDeleteDocument,
} from "@/hooks/useDocumentQuery";
import { useDocumentStore } from "@/store/useDocumentStore";

const DocumentDashboard: React.FC = () => {
  // Zustand store'dan action al
  const setSelectedDocument = useDocumentStore(
    (state) => state.setSelectedDocument,
  );

  // TanStack Query hooks
  const { data: documents, isLoading, error } = useDocuments();
  const { mutate: uploadDocument } = useUploadDocument();
  const { mutate: deleteDocument } = useDeleteDocument();

  const handleUpload = (file: File) => {
    // TanStack Query mutation ile belgeyi yükle
    uploadDocument({
      name: file.name,
      uploadedAt: new Date().toLocaleDateString("tr-TR"),
      size: file.size,
    });
  };

  const handleDelete = (id: string) => {
    // TanStack Query mutation ile belgeyi sil
    deleteDocument(id);
  };

  if (isLoading) {
    return <div className="text-center py-6">Yükleniyor...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-6 text-red-500">
        Bir hata oluştu. Lütfen tekrar deneyin.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DocumentUploader onUpload={handleUpload} />
      <DocumentList
        documents={documents || []}
        onDelete={handleDelete}
        onSelect={setSelectedDocument}
      />
    </div>
  );
};

export default DocumentDashboard;
