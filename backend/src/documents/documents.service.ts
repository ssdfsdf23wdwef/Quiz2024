import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { DocumentProcessingService } from './document-processing.service';
import { UploadDocumentDto } from './dto';
import { Document, DocumentListItem } from '../common/interfaces';
import * as admin from 'firebase-admin';
import { FIRESTORE_COLLECTIONS } from '../common/constants';
import { LoggerService } from '../common/services/logger.service';
import { FlowTrackerService } from '../common/services/flow-tracker.service';
import { LogMethod } from '../common/decorators';

@Injectable()
export class DocumentsService {
  private readonly logger: LoggerService;
  private readonly flowTracker: FlowTrackerService;

  constructor(
    private documentProcessingService: DocumentProcessingService,
    private firebaseService: FirebaseService,
  ) {
    this.logger = LoggerService.getInstance();
    this.flowTracker = FlowTrackerService.getInstance();
  }

  /**
   * Dosyadan metin çıkarma işlemi
   * @param file Dosya
   * @returns Çıkarılan metin
   */
  async extractTextFromFile(file: Express.Multer.File): Promise<string> {
    this.logger.debug(
      '🔹 Dosyadan metin çıkarılıyor',
      'DocumentsService.extractTextFromFile',
      __filename,
    );

    try {
      // DocumentProcessingService'i kullanarak metin çıkartma
      const extractedText = await this.documentProcessingService.extractText(
        file.buffer,
        file.mimetype,
      );

      // Çıkarılan metni normalize et
      const normalizedText =
        this.documentProcessingService.normalizeText(extractedText);

      this.logger.debug(
        `Metin çıkarma başarılı (${normalizedText.length} karakter)`,
        'DocumentsService.extractTextFromFile',
        __filename,
        undefined,
        {
          fileName: file.originalname,
          fileType: file.mimetype,
          extractedLength: normalizedText.length,
        },
      );

      return normalizedText;
    } catch (error) {
      this.logger.error(
        `Metin çıkarma hatası: ${error.message}`,
        'DocumentsService.extractTextFromFile',
        __filename,
      );
      throw new BadRequestException(
        `Belgeden metin çıkarılırken hata oluştu: ${error.message}`,
      );
    }
  }

  /**
   * Upload a document to storage and process its text
   */
  @LogMethod({ trackParams: true })
  async uploadDocument(
    file: Express.Multer.File,
    userId: string,
    courseId?: string,
    fileName?: string,
  ): Promise<any> {
    this.logger.debug(
      '🔹 Doküman yükleniyor',
      'DocumentsService.uploadDocument',
      __filename,
    );

    try {
      // Benzersiz dosya adı oluştur
      const timestamp = Date.now();
      const originalName = file.originalname;
      const fileExtension = originalName.split('.').pop();
      const uniqueFileName = fileName
        ? `${fileName}.${fileExtension}`
        : `${timestamp}_${originalName}`;

      // Firebase'e dosyayı yükle
      let fileUrl = '';
      let storagePath = `documents/${userId}/general/${uniqueFileName}`;

      try {
        // Firebase Storage'a yüklemeyi dene
        fileUrl = await this.firebaseService.uploadFile(
          file.buffer,
          storagePath,
          file.mimetype,
        );

        console.log(`📤 Dosya Firebase Storage'a yüklendi: ${fileUrl}`);
      } catch (storageError) {
        // Firebase Storage hatası durumunda loglama yap
        this.logger.error(
          `Firebase Storage yükleme hatası: ${storageError.message}`,
          'DocumentsService.uploadDocument',
          __filename,
        );

        // Hata durumunda geçici bir URL oluştur (gerçek projede farklı bir çözüm gerekebilir)
        fileUrl = `http://localhost:3001/api/documents/temp/${uniqueFileName}`;
        console.log(
          `⚠️ Firebase Storage hatası. Geçici URL kullanılıyor: ${fileUrl}`,
        );
      }

      // Metin çıkarma işlemini başlat
      const extractedText = await this.extractTextFromFile(file);

      this.logger.debug(
        `📄 Dosyadan metin çıkarma tamamlandı (${extractedText?.length || 0} karakter). İçerik (ilk 100kr): ${extractedText?.substring(0, 100)}`,
        'DocumentsService.uploadDocument',
        __filename,
        undefined,
        {
          documentId: 'N/A',
          userId,
          fileName: originalName,
          extractedLength: extractedText?.length || 0,
        },
      );

      // Yeni doküman oluştur
      const newDocument = {
        fileName: originalName,
        fileUrl: fileUrl,
        storagePath: storagePath,
        storageUrl: fileUrl,
        fileType: file.mimetype,
        fileSize: file.size,
        extractedText: extractedText,
        userId: userId,
        courseId: courseId || null,
      };

      // Firestore'a kaydetmeden önce logla
      this.logger.debug(
        `💾 Döküman Firestore'a kaydedilmeden ÖNCE: ${originalName}`,
        'DocumentsService.uploadDocument',
        __filename,
        undefined,
        { documentDetails: newDocument },
      );

      // Dokuman koleksiyonuna ekle
      const document = await this.firebaseService.create(
        'documents',
        newDocument,
      );

      console.log(`✅ Döküman başarıyla kaydedildi. ID: ${document.id}`);
      return document;
    } catch (error) {
      this.logger.error(
        `Döküman yükleme hatası: ${error.message}`,
        'DocumentsService.uploadDocument',
        __filename,
      );

      console.error(`❌ Döküman yükleme hatası: ${error.message}`);
      throw error;
    }
  }

  /**
   * List all documents for a user, optionally filtered by course
   */
  @LogMethod({ trackParams: true })
  async findAll(
    userId: string,
    courseId?: string,
  ): Promise<DocumentListItem[]> {
    try {
      this.flowTracker.trackStep(
        courseId
          ? `${courseId} kursu için dokümanlar getiriliyor`
          : 'Tüm dokümanlar getiriliyor',
        'DocumentsService',
      );

      // Filtre koşullarını oluştur
      const wheres = [
        {
          field: 'userId',
          operator: '==' as admin.firestore.WhereFilterOp,
          value: userId,
        },
      ];

      if (courseId) {
        // Ders sahipliği kontrolü
        const course = await this.firebaseService.findOne<{ userId: string }>(
          FIRESTORE_COLLECTIONS.COURSES,
          'id',
          '==',
          courseId,
        );

        if (!course) {
          throw new NotFoundException('Ders bulunamadı');
        }

        wheres.push({
          field: 'courseId',
          operator: '==' as admin.firestore.WhereFilterOp,
          value: courseId,
        });
      }

      // Belgeleri getir
      const docs = await this.firebaseService.findMany<Document>(
        FIRESTORE_COLLECTIONS.DOCUMENTS,
        wheres,
        { field: 'createdAt', direction: 'desc' },
      );

      this.logger.info(
        'Dokümanlar başarıyla getirildi',
        'DocumentsService.findAll',
        __filename,
        undefined,
        { userId, courseId },
      );

      return docs.map((doc) => ({
        id: doc.id,
        fileName: doc.fileName,
        storagePath: doc.storagePath,
        storageUrl: doc.storageUrl,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        courseId: doc.courseId,
        createdAt: doc.createdAt
          ? new Date(doc.createdAt).toISOString()
          : doc.createdAt,
      }));
    } catch (error) {
      this.logger.logError(error, 'DocumentsService.findAll', {
        userId,
        courseId,
      });
      throw error;
    }
  }

  /**
   * Get a single document by ID
   */
  @LogMethod({ trackParams: true })
  async findOne(id: string, userId: string): Promise<Document> {
    try {
      this.flowTracker.trackStep(
        `${id} ID'li doküman getiriliyor`,
        'DocumentsService',
      );

      const document = await this.firebaseService.findById<Document>(
        FIRESTORE_COLLECTIONS.DOCUMENTS,
        id,
      );

      if (!document) {
        throw new NotFoundException('Belge bulunamadı');
      }

      if (document.userId !== userId) {
        throw new NotFoundException('Belge bulunamadı');
      }

      this.logger.info(
        'Doküman başarıyla getirildi',
        'DocumentsService.findOne',
        __filename,
        undefined,
        { documentId: id, userId },
      );

      return {
        ...document,
        createdAt: document.createdAt
          ? new Date(document.createdAt).toISOString()
          : document.createdAt,
      };
    } catch (error) {
      this.logger.logError(error, 'DocumentsService.findOne', {
        documentId: id,
        userId,
      });
      throw error;
    }
  }

  /**
   * Get document text for a document
   */
  @LogMethod({ trackParams: true })
  async getDocumentText(id: string, userId: string): Promise<{ text: string }> {
    try {
      this.logger.debug(
        `Belge metni isteniyor. Belge ID: ${id}, Kullanıcı ID: ${userId}`,
        'DocumentsService.getDocumentText',
        __filename,
        undefined,
        {
          documentId: id,
          userId,
        },
      );

      // Belgeyi getir
      const document = await this.firebaseService.findById<Document>(
        FIRESTORE_COLLECTIONS.DOCUMENTS,
        id,
      );

      this.logger.debug(
        `getDocumentText: firebaseService.findById çağrısı sonrası. Belge ID: ${id}. Dönen 'document' objesinin varlığı: ${!!document}. İçerik (ilk 100 byte): ${document ? JSON.stringify(document).substring(0, 100) : 'NULL'}`,
        'DocumentsService.getDocumentText',
        __filename,
        undefined, // flow.traceId yerine undefined kullandım
        { documentId: id, userId, documentExists: !!document },
      );

      if (!document) {
        // Hata durumunu debug seviyesinde logla, ancak önemli bir hata olduğu için ayrıca error logu da düşülebilir.
        this.logger.debug(
          `Belge bulunamadı (ID: ${id}, Kullanıcı: ${userId})`,
          'DocumentsService.getDocumentText',
          __filename,
          undefined,
          {
            documentId: id,
            userId,
            additionalInfo: 'Belge veritabanında bulunamadı',
          },
        );

        throw new NotFoundException('Belge bulunamadı');
      }

      if (!document.extractedText || document.extractedText.trim() === '') {
        this.logger.debug(
          `Belge bulundu (ID: ${id}) ancak 'extractedText' alanı boş veya tanımsız.`,
          'DocumentsService.getDocumentText',
          __filename,
          undefined,
          {
            documentId: id,
            userId,
            hasExtractedText: !!document.extractedText,
            textLength: document.extractedText?.length || 0,
          },
        );

        // Daha açıklayıcı bir hata mesajı fırlat
        throw new BadRequestException(
          `'extractedText' alanı boş veya tanımsız. Belge ID: ${id}`,
        );
      }

      this.logger.debug(
        `Belge metni başarıyla alındı (ID: ${id}, Uzunluk: ${document.extractedText.length})`,
        'DocumentsService.getDocumentText',
        __filename,
        undefined,
        {
          documentId: id,
          userId,
          textLength: document.extractedText.length,
        },
      );
      return { text: document.extractedText };
    } catch (error) {
      // Hata zaten NotFoundException veya BadRequestException ise tekrar sarmalama
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      // Diğer hatalar için genel bir hata logu
      this.logger.error(
        `Belge metni alınırken hata oluştu: ${error.message}`,
        'DocumentsService.getDocumentText',
        __filename,
        undefined,
      );
      throw new InternalServerErrorException(
        'Belge metni alınırken bir hata oluştu.',
      );
    }
  }

  /**
   * Remove a document
   */
  @LogMethod({ trackParams: true })
  async remove(id: string, userId: string): Promise<Document> {
    try {
      this.flowTracker.trackStep(
        `${id} ID'li doküman siliniyor`,
        'DocumentsService',
      );

      // Önce belge bilgisi alınır
      const document = await this.firebaseService.findById<Document>(
        FIRESTORE_COLLECTIONS.DOCUMENTS,
        id,
      );

      if (!document) {
        throw new NotFoundException('Belge bulunamadı');
      }

      if (document.userId !== userId) {
        throw new NotFoundException('Belge bulunamadı');
      }

      // Depodan silme işlemi
      try {
        await this.firebaseService.deleteFile(document.storagePath);
      } catch (error) {
        this.logger.error(`Dosya silme hatası: ${error.message}`, error.stack);
        // Dosya silinmese bile veritabanı kaydını silmeye devam ediyoruz
      }

      // Veritabanından silme işlemi
      await this.firebaseService.delete(FIRESTORE_COLLECTIONS.DOCUMENTS, id);

      this.logger.info(
        'Doküman başarıyla silindi',
        'DocumentsService.remove',
        __filename,
        undefined,
        { documentId: id, userId },
      );

      return document;
    } catch (error) {
      this.logger.logError(error, 'DocumentsService.remove', {
        documentId: id,
        userId,
      });
      throw error;
    }
  }
}
