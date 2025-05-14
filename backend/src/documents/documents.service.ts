import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
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
      // Basit bir çözüm - gerçek uygulamada farklı dosya türlerine göre işlem yapılmalı
      // PDF, DOCX, TXT gibi dosya türlerini işleyen bir servis entegrasyonu gerekiyor
      if (file.mimetype.includes('text/plain')) {
        return file.buffer.toString('utf-8');
      }

      // Diğer dosya türleri için örnek metin döndür
      return `Bu dosya türü (${file.mimetype}) için metin çıkarma henüz desteklenmiyor. 
      Örnek metin olarak bu içerik oluşturuldu. Gerçek uygulamada OCR veya belge işleme servisleri kullanılmalıdır.`;
    } catch (error) {
      this.logger.error(
        `Metin çıkarma hatası: ${error.message}`,
        'DocumentsService.extractTextFromFile',
        __filename,
      );
      return '';
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

      console.log(
        `📄 Dosyadan metin çıkarma tamamlandı (${extractedText.length} karakter)`,
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
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Firestore'a kaydet
      console.log(`💾 Döküman Firestore'a kaydediliyor...`);

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
  async getDocumentText(id: string, userId: string) {
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

    return { text: document.extractedText };
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
