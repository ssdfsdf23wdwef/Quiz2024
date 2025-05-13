import apiService, { httpClient } from "@/services/api.service";
import {
  DocumentType,
  DocumentDeleteResponse,
  DOCUMENT_UPLOAD_CONSTRAINTS,
} from "@/types/document";
import { getLogger, getFlowTracker, trackFlow, startFlow as startAppFlow } from "../lib/logger.utils";
import { LogClass, LogMethod } from "@/decorators/log-method.decorator";
import { FlowCategory } from "@/constants/logging.constants";
import { mapToTrackerCategory } from "../lib/logger.utils";

/**
 * Belge servisi
 * Belgelerle ilgili API isteklerini yönetir
 */
@LogClass('DocumentService')
class DocumentService {
  detectTopics(fileUrl: string) {
    throw new Error("Method not implemented.");
  }
  private readonly logger = getLogger();
  private readonly flowTracker = getFlowTracker();

  /**
   * Tüm belgeleri veya bir derse ait belgeleri getirir
   * @param courseId Opsiyonel ders ID
   * @returns Belge listesi
   */
  @LogMethod('DocumentService', FlowCategory.API)
  async getDocuments(courseId?: string): Promise<DocumentType[]> {
    const flow = startAppFlow(FlowCategory.API, "DocumentService.getDocuments");
    try {
      const url = courseId ? `/documents?courseId=${courseId}` : "/documents";
      trackFlow(`Fetching documents. CourseId: ${courseId || 'all'}`, "DocumentService.getDocuments", FlowCategory.API);
      const documents = await apiService.get<DocumentType[]>(url);
      flow.end("Successfully fetched documents");
      return documents;
    } catch (error) {
      this.logger.error('Error fetching documents', 'DocumentService.getDocuments', __filename, undefined, { courseId, error });
      flow.end(`Error: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Belirli bir belgenin detaylarını getirir
   * @param id Belge ID
   * @returns Belge detayları
   */
  @LogMethod('DocumentService', FlowCategory.API)
  async getDocumentById(id: string): Promise<DocumentType> {
    const flow = startAppFlow(FlowCategory.API, "DocumentService.getDocumentById");
    try {
      trackFlow(`Fetching document by ID: ${id}`, "DocumentService.getDocumentById", FlowCategory.API);
      const document = await apiService.get<DocumentType>(`/documents/${id}`);
      flow.end("Successfully fetched document by ID");
      return document;
    } catch (error) {
      this.logger.error('Error fetching document by ID', 'DocumentService.getDocumentById', __filename, undefined, { id, error });
      flow.end(`Error: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Belgeden çıkarılan metni getirir
   * @param id Belge ID
   * @returns Metin içeriği
   */
  @LogMethod('DocumentService', FlowCategory.API)
  async getDocumentText(id: string): Promise<{ id: string; text: string }> {
    const flow = startAppFlow(FlowCategory.API, "DocumentService.getDocumentText");
    try {
      trackFlow(`Fetching document text for ID: ${id}`, "DocumentService.getDocumentText", FlowCategory.API);
      const documentText = await apiService.get<{ id: string; text: string }>(`/documents/${id}/text`);
      // Başarılı sonuç
      const duration = this.flowTracker.markEnd(`getDocumentText_${id}`, mapToTrackerCategory(FlowCategory.API), 'DocumentService');
      const textLength = documentText.text.length;
      this.logger.debug(
        `Belge metni getirildi: ${id}`,
        'DocumentService.getDocumentText',
        __filename,
        undefined,
        { id, textLength, duration }
      );
      flow.end("Successfully fetched document text");
      return documentText;
    } catch (error) {
      this.flowTracker.markEnd(`getDocumentText_${id}`, mapToTrackerCategory(FlowCategory.API), 'DocumentService');
      this.logger.error('Error fetching document text', 'DocumentService.getDocumentText', __filename, undefined, { id, error });
      flow.end(`Error: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Yeni belge yükler
   * @param file Yüklenecek dosya
   * @param courseId Opsiyonel ders ID
   * @param onProgress İlerleme durumunu bildiren callback
   * @returns Yüklenen belge bilgileri
   */
  @LogMethod('DocumentService', FlowCategory.API)
  async uploadDocument(
    file: File,
    courseId?: string,
    onProgress?: (percentage: number) => void,
  ): Promise<DocumentType> {
    const flow = startAppFlow(FlowCategory.API, "DocumentService.uploadDocument");
    
    // Akış izleme
    trackFlow(
      `Uploading document: ${file.name}`,
      "DocumentService.uploadDocument",
      FlowCategory.API
    );
    
    try {
      // Dosya boyutu kontrolü
      if (file.size > DOCUMENT_UPLOAD_CONSTRAINTS.maxSizeBytes) {
        this.logger.warn(
          'Belge yükleme isteği boyut sınırını aştı',
          'DocumentService.uploadDocument',
          __filename,
          156,
          {
            fileName: file.name,
            fileSize: file.size,
            maxSize: DOCUMENT_UPLOAD_CONSTRAINTS.maxSizeBytes
          }
        );
        throw new Error(
          `Dosya boyutu ${DOCUMENT_UPLOAD_CONSTRAINTS.maxSizeFormatted} sınırını aşamaz`,
        );
      }

      // Dosya tipi kontrolü
      const fileType = file.type.toLowerCase();
      const fileExtension = file.name.split(".").pop()?.toLowerCase();

      const isValidType = DOCUMENT_UPLOAD_CONSTRAINTS.allowedFileTypes.some(
        (type) =>
          type === fileType || (fileExtension && type === `.${fileExtension}`),
      );

      if (!isValidType) {
        this.logger.warn(
          'Belge yükleme isteği geçersiz dosya formatı içeriyor',
          'DocumentService.uploadDocument',
          __filename,
          179,
          {
            fileName: file.name,
            fileType,
            fileExtension,
            allowedTypes: DOCUMENT_UPLOAD_CONSTRAINTS.allowedFileTypes
          }
        );
        throw new Error(
          `Desteklenmeyen dosya formatı. Desteklenen formatlar: PDF, DOCX, TXT`,
        );
      }

      const formData = new FormData();
      formData.append("file", file);

      if (courseId) {
        formData.append("courseId", courseId);
      }

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent: { loaded: number; total?: number }) => {
          if (onProgress && progressEvent.total) {
            const percentage = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            onProgress(percentage);
            
            // İlerleme durumunu izle
            if (percentage === 25 || percentage === 50 || percentage === 75 || percentage === 100) {
              this.flowTracker.trackStep(
                mapToTrackerCategory(FlowCategory.API),
                `Belge yükleme: %${percentage}`,
                'DocumentService.uploadDocument',
                {
                  fileName: file.name,
                  percentage,
                }
              );
            }
          }
        },
      };

      this.logger.debug(
        'Belge yükleme isteği gönderiliyor',
        'DocumentService.uploadDocument',
        __filename,
        221,
        { fileName: file.name, courseId }
      );
      
      const response = await httpClient.post<DocumentType>(
        "/documents/upload",
        formData,
        config,
      );
      
      // Başarılı sonuç
      const duration = this.flowTracker.markEnd('uploadDocument', mapToTrackerCategory(FlowCategory.API), 'DocumentService');
      this.logger.info(
        `Belge başarıyla yüklendi: ${file.name}`,
        'DocumentService.uploadDocument',
        __filename,
        undefined,
        { fileName: file.name, courseId, duration }
      );
      
      flow.end("Successfully uploaded document");
      return response.data;
    } catch (error) {
      this.flowTracker.markEnd('uploadDocument', mapToTrackerCategory(FlowCategory.API), 'DocumentService');
      this.logger.error('Error uploading document', 'DocumentService.uploadDocument', __filename, undefined, { fileName: file.name, error });
      flow.end(`Error: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Belge siler
   * @param id Silinecek belge ID
   * @returns Silme işlemi sonucu
   */
  @LogMethod('DocumentService', FlowCategory.API)
  async deleteDocument(id: string): Promise<DocumentDeleteResponse> {
    this.flowTracker.markStart(`deleteDocument_${id}`);
    
    try {
      this.flowTracker.trackApiCall(`/documents/${id}`, 'DELETE', 'DocumentService.deleteDocument', { id });
      
      const response = await apiService.delete<DocumentDeleteResponse>(`/documents/${id}`);
      
      // Başarılı sonuç
      const duration = this.flowTracker.markEnd(`deleteDocument_${id}`, mapToTrackerCategory(FlowCategory.API), 'DocumentService');
      this.logger.info(
        `Belge silindi: ${id}`,
        'DocumentService.deleteDocument',
        __filename,
        276,
        { id, duration }
      );
      
      return response;
    } catch (error) {
      // Hata durumu
      this.flowTracker.markEnd(`deleteDocument_${id}`, mapToTrackerCategory(FlowCategory.API), 'DocumentService');
      this.logger.error(
        `Belge silinirken hata oluştu: ${id}`,
        'DocumentService.deleteDocument',
        __filename,
        287,
        { id, error }
      );
      throw error;
    }
  }
}

// Singleton instance oluştur ve export et
const documentService = new DocumentService();
export default documentService;
