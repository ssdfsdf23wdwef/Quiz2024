import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import documentService from "@/services/document.service";

// Query hook'ları
export const useDocuments = (courseId?: string) => {
  return useQuery({
    queryKey: courseId ? ["documents", "course", courseId] : ["documents"],
    queryFn: () => documentService.getDocuments(courseId),
  });
};

export const useDocument = (id: string) => {
  return useQuery({
    queryKey: ["document", id],
    queryFn: () => documentService.getDocumentById(id),
    enabled: !!id, // id varsa query'yi etkinleştir
  });
};

export const useDocumentText = (id: string) => {
  return useQuery({
    queryKey: ["document", id, "text"],
    queryFn: () => documentService.getDocumentText(id),
    enabled: !!id,
  });
};

// Mutation hook'ları
export const useUploadDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, courseId }: { file: File; courseId?: string }) =>
      documentService.uploadDocument(file, courseId),
    onSuccess: (data, variables) => {
      // Belge eklendiğinde ilgili cache'leri invalidate et
      queryClient.invalidateQueries({ queryKey: ["documents"] });

      // Eğer bir derse ait belge yüklendiyse, o dersin belgelerini de güncelleyelim
      if (variables.courseId) {
        queryClient.invalidateQueries({
          queryKey: ["documents", "course", variables.courseId],
        });
        queryClient.invalidateQueries({
          queryKey: ["courses", variables.courseId, "related-items"],
        });
      }
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: documentService.deleteDocument,
    onSuccess: (result, deletedId) => {
      // Belge silindiğinde cache'i güncelle
      queryClient.removeQueries({ queryKey: ["document", deletedId] });
      queryClient.removeQueries({ queryKey: ["document", deletedId, "text"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });

      // Tüm ders belgelerini invalidate et (daha optimal yaklaşımlar da mümkün)
      queryClient.invalidateQueries({ queryKey: ["documents", "course"] });
    },
  });
};
