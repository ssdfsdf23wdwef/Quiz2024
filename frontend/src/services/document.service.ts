import apiService, { httpClient } from "@/services/api.service";
import {
  DocumentType,
  DocumentDeleteResponse,
  DOCUMENT_UPLOAD_CONSTRAINTS,
} from "@/types/document";
import { getLogger, getFlowTracker } from "../lib/logger.utils";
import { LogClass, LogMethod } from "@/decorators/log-method.decorator";

// Logger ve flowTracker nesnelerini elde et
const logger = getLogger();
const flowTracker = getFlowTracker();

/**
 * Belge servisi
 * Belgelerle ilgili API isteklerini yönetir
 */
@LogClass('DocumentService')
class DocumentService {
  /**
   * Tüm belgeleri veya bir derse ait belgeleri getirir
   * @param courseId Opsiyonel ders ID
   * @returns Belge listesi
   */
  @LogMethod('DocumentService', 'API')
  async getDocuments(courseId?: string): Promise<DocumentType[]> {
    flowTracker.markStart('getDocuments');
    
    try {
      let url = "/documents";
      if (courseId) {
        url += `?courseId=${courseId}`;
      }
      
      flowTracker.trackApiCall(url, 'GET', 'DocumentService.getDocuments', {
        hasCourseId: !!courseId
      });
      
      const documents = await apiService.get<DocumentType[]>(url);
      
      // Başarılı sonuç
      const duration = flowTracker.markEnd('getDocuments', 'API', 'DocumentService');
      logger.debug(
        `${documents.length} belge getirildi`,
        'DocumentService.getDocuments',
        __filename,
        30,
        { courseId, count: documents.length, duration }
      );
      
      return documents;
    } catch (error) {
      // Hata durumu
      flowTracker.markEnd('getDocuments', 'API', 'DocumentService');
      logger.error(
        'Belgeler getirilirken hata oluştu',
        'DocumentService.getDocuments',
        __filename,
        41,
        { courseId, error }
      );
      throw error;
    }
  }

  /**
   * Belirli bir belgenin detaylarını getirir
   * @param id Belge ID
   * @returns Belge detayları
   */
  @LogMethod('DocumentService', 'API')
  async getDocumentById(id: string): Promise<DocumentType> {
    flowTracker.markStart(`getDocument_${id}`);
    
    try {
      flowTracker.trackApiCall(`/documents/${id}`, 'GET', 'DocumentService.getDocumentById', { id });
      
      const document = await apiService.get<DocumentType>(`/documents/${id}`);
      
      // Başarılı sonuç
      const duration = flowTracker.markEnd(`getDocument_${id}`, 'API', 'DocumentService');
      logger.debug(
        `Belge getirildi: ${id}`,
        'DocumentService.getDocumentById',
        __filename,
        67,
        { id, documentName: document.fileName, duration }
      );
      
      return document;
    } catch (error) {
      // Hata durumu
      flowTracker.markEnd(`getDocument_${id}`, 'API', 'DocumentService');
      logger.error(
        `Belge getirilirken hata oluştu: ${id}`,
        'DocumentService.getDocumentById',
        __filename,
        78,
        { id, error }
      );
      throw error;
    }
  }

  /**
   * Belgeden çıkarılan metni getirir
   * @param id Belge ID
   * @returns Metin içeriği
   */
  @LogMethod('DocumentService', 'API')
  async getDocumentText(id: string): Promise<{ id: string; text: string }> {
    flowTracker.markStart(`getDocumentText_${id}`);
    
    try {
      flowTracker.trackApiCall(`/documents/${id}/text`, 'GET', 'DocumentService.getDocumentText', { id });
      
      const documentText = await apiService.get<{ id: string; text: string }>(
        `/documents/${id}/text`,
      );
      
      // Başarılı sonuç
      const duration = flowTracker.markEnd(`getDocumentText_${id}`, 'API', 'DocumentService');
      const textLength = documentText.text.length;
      logger.debug(
        `Belge metni getirildi: ${id}`,
        'DocumentService.getDocumentText',
        __filename,
        104,
        { id, textLength, duration }
      );
      
      return documentText;
    } catch (error) {
      // Hata durumu
      flowTracker.markEnd(`getDocumentText_${id}`, 'API', 'DocumentService');
      logger.error(
        `Belge metni getirilirken hata oluştu: ${id}`,
        'DocumentService.getDocumentText',
        __filename,
        115,
        { id, error }
      );
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
  @LogMethod('DocumentService', 'API')
  async uploadDocument(
    file: File,
    courseId?: string,
    onProgress?: (percentage: number) => void,
  ): Promise<DocumentType> {
    flowTracker.markStart('uploadDocument');
    
    // Akış izleme
    flowTracker.trackStep(
      'API',
      'Belge yükleme başlatıldı',
      'DocumentService.uploadDocument',
      {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        courseId
      }
    );
    
    try {
      // Dosya boyutu kontrolü
      if (file.size > DOCUMENT_UPLOAD_CONSTRAINTS.maxSizeBytes) {
        logger.warn(
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
        logger.warn(
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
              flowTracker.trackStep(
                'API',
                `Belge yükleme: %${percentage}`,
                'DocumentService.uploadDocument',
                { fileName: file.name, loaded: progressEvent.loaded, total: progressEvent.total }
              );
            }
          }
        },
      };

      logger.debug(
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
      const duration = flowTracker.markEnd('uploadDocument', 'API', 'DocumentService');
      logger.info(
        `Belge başarıyla yüklendi: ${file.name}`,
        'DocumentService.uploadDocument',
        __filename,
        234,
        { 
          fileName: file.name, 
          fileSize: file.size,
          uploadedId: response.data.id,
          duration 
        }
      );
      
      return response.data;
    } catch (error) {
      // Hata durumu
      flowTracker.markEnd('uploadDocument', 'API', 'DocumentService');
      logger.error(
        `Belge yüklenirken hata oluştu: ${file.name}`,
        'DocumentService.uploadDocument',
        __filename,
        250,
        { fileName: file.name, error }
      );
      throw error;
    }
  }

  /**
   * Belge siler
   * @param id Silinecek belge ID
   * @returns Silme işlemi sonucu
   */
  @LogMethod('DocumentService', 'API')
  async deleteDocument(id: string): Promise<DocumentDeleteResponse> {
    flowTracker.markStart(`deleteDocument_${id}`);
    
    try {
      flowTracker.trackApiCall(`/documents/${id}`, 'DELETE', 'DocumentService.deleteDocument', { id });
      
      const response = await apiService.delete<DocumentDeleteResponse>(`/documents/${id}`);
      
      // Başarılı sonuç
      const duration = flowTracker.markEnd(`deleteDocument_${id}`, 'API', 'DocumentService');
      logger.info(
        `Belge silindi: ${id}`,
        'DocumentService.deleteDocument',
        __filename,
        276,
        { id, duration }
      );
      
      return response;
    } catch (error) {
      // Hata durumu
      flowTracker.markEnd(`deleteDocument_${id}`, 'API', 'DocumentService');
      logger.error(
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
