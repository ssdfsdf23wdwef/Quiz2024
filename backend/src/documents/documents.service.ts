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
   * Upload a document to storage and process its text
   */
  @LogMethod({ trackParams: true })
  async uploadDocument(
    file: Express.Multer.File,
    dto: UploadDocumentDto,
    userId: string,
  ) {
    try {
      this.flowTracker.trackStep('Doküman yükleniyor', 'DocumentsService');
      const startTime = Date.now();

      // Validate file
      if (!file) {
        throw new BadRequestException('Dosya bulunamadı');
      }

      // Process file upload - store in Firebase Storage
      const storagePath = `documents/${userId}/${dto.courseId || 'general'}/${Date.now()}_${file.originalname}`;

      // Upload to Firebase Storage
      const storageUrl = await this.firebaseService.uploadFile(
        file.buffer,
        storagePath,
        file.mimetype,
      );

      // Extract text from document (could be async)
      const extractedText = await this.documentProcessingService.extractText(
        file.buffer,
        file.mimetype,
      );
      const normalizedText =
        this.documentProcessingService.normalizeText(extractedText);

      // Create document metadata record in database if course is provided
      let documentRecord: Document | null = null;
      if (dto.courseId) {
        // Verify course ownership
        const course = await this.firebaseService.findOne<{ userId: string }>(
          FIRESTORE_COLLECTIONS.COURSES,
          'id',
          '==',
          dto.courseId,
        );

        if (!course) {
          throw new NotFoundException('Ders bulunamadı');
        }

        // Store document metadata
        const docData: Omit<Document, 'id' | 'createdAt'> = {
          userId,
          courseId: dto.courseId,
          fileName: file.originalname,
          storagePath,
          storageUrl,
          fileType: file.mimetype,
          fileSize: file.size,
          extractedText: normalizedText,
        };

        const createdDoc = await this.firebaseService.create<
          Omit<Document, 'id' | 'createdAt'>
        >(FIRESTORE_COLLECTIONS.DOCUMENTS, docData);

        documentRecord = {
          ...createdDoc,
          createdAt: new Date().toISOString(),
        };
      }

      const elapsedTime = Date.now() - startTime;
      this.flowTracker.track(
        `Doküman yükleme tamamlandı (${elapsedTime}ms)`,
        'DocumentsService',
      );

      this.logger.info(
        'Doküman başarıyla yüklendi',
        'DocumentsService.uploadDocument',
        __filename,
        undefined,
        {
          userId,
          courseId: dto.courseId,
          fileName: file.originalname,
          fileSize: file.size,
          processingTime: elapsedTime,
        },
      );

      return {
        success: true,
        document: {
          fileName: file.originalname,
          storagePath,
          storageUrl,
          fileType: file.mimetype,
          fileSize: file.size,
          id: documentRecord ? documentRecord.id : undefined,
          courseId: documentRecord ? documentRecord.courseId : undefined,
        },
        extractedText: normalizedText.substring(0, 200) + '...',
        textLength: normalizedText.length,
      };
    } catch (error) {
      this.logger.logError(error, 'DocumentsService.uploadDocument', {
        userId,
        courseId: dto?.courseId,
        fileName: dto?.fileName,
        fileSize: dto?.fileSize,
      });

      // Attempt to clean up any partially uploaded file
      if (error.storagePath) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          await this.firebaseService.deleteFile(error.storagePath);
        } catch (deleteError) {
          this.logger.error(
            `Storage temizleme hatası: ${deleteError.message}`,
            deleteError.stack,
          );
        }
      }

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
