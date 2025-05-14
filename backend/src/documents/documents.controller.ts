import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
  UseInterceptors,
  UploadedFile,
  Body,
  MaxFileSizeValidator,
  ParseFilePipe,
  FileTypeValidator,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { FirebaseGuard } from '../auth/firebase/firebase.guard';
import { UploadDocumentDto, CreateQuizFromDocumentDto } from './dto';
import { LoggerService } from '../common/services/logger.service';
import { FlowTrackerService } from '../common/services/flow-tracker.service';
import { LogMethod } from '../common/decorators';
import { AiService } from '../ai/ai.service';
import { QuizzesService } from '../quizzes/quizzes.service';

@ApiTags('Belgeler')
@ApiBearerAuth('Firebase JWT')
@UseGuards(FirebaseGuard)
@Controller('documents')
export class DocumentsController {
  private readonly logger: LoggerService;
  private readonly flowTracker: FlowTrackerService;

  constructor(
    private readonly documentsService: DocumentsService,
    private readonly aiService: AiService,
    @Inject(forwardRef(() => QuizzesService))
    private readonly quizzesService: QuizzesService,
  ) {
    this.logger = LoggerService.getInstance();
    this.flowTracker = FlowTrackerService.getInstance();
    this.logger.debug(
      'DocumentsController başlatıldı',
      'DocumentsController.constructor',
      __filename,
      38,
    );
  }

  @Post('upload')
  @ApiOperation({
    summary: 'Bir belge yükler ve metin çıkarma işlemini başlatır',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Yüklenecek PDF, DOCX veya metin dosyası',
        },
        courseId: {
          type: 'string',
          description: 'Bağlı olduğu ders ID (opsiyonel)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Belge başarıyla yüklendi ve işlendi',
  })
  @ApiResponse({
    status: 400,
    description: 'Geçersiz dosya formatı veya eksik dosya',
  })
  @ApiResponse({ status: 413, description: 'Dosya boyutu çok büyük' })
  @UseInterceptors(FileInterceptor('file'))
  @LogMethod()
  async upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({
            fileType:
              /(pdf|docx|doc|txt|application\/pdf|application\/vnd.openxmlformats-officedocument.wordprocessingml.document|text\/plain)/,
          }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
    @Req() req: any,
  ) {
    const userId = req.user.uid;

    this.flowTracker.trackStep(
      `Dosya yükleniyor: ${file.originalname}`,
      'DocumentsController',
    );

    try {
      this.logger.info(
        `Dosya yükleme başladı: ${file.originalname}`,
        'DocumentsController.upload',
        __filename,
        90,
        { userId, fileSize: file.size, fileType: file.mimetype },
      );

      return await this.documentsService.uploadDocument(
        file,
        userId,
        dto.courseId,
        dto.fileName,
      );
    } catch (error) {
      this.logger.logError(error, 'DocumentsController.upload', {
        userId,
        fileName: file.originalname,
        fileSize: file.size,
        courseId: dto.courseId,
        additionalInfo: 'Dosya yükleme işlemi sırasında hata oluştu',
      });
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Kullanıcının tüm belgelerini listeler' })
  @ApiQuery({
    name: 'courseId',
    description: 'Ders ID - belirli bir dersin belgelerini filtrelemek için',
  })
  @ApiResponse({ status: 200, description: 'Belgeler başarıyla listelendi' })
  @LogMethod()
  async findAll(@Query('courseId') courseId: string, @Req() req: any) {
    const userId = req.user.uid;

    this.flowTracker.trackStep(
      courseId
        ? `${courseId} dersine ait belgeler listeleniyor`
        : 'Tüm belgeler listeleniyor',
      'DocumentsController',
    );

    try {
      this.logger.debug(
        'Belge listesi alınıyor',
        'DocumentsController.findAll',
        __filename,
        120,
        { userId, courseId },
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return await this.documentsService.findAll(userId, courseId);
    } catch (error) {
      this.logger.logError(error, 'DocumentsController.findAll', {
        userId,
        courseId,
        additionalInfo: 'Belge listesi alınırken hata oluştu',
      });
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bir belgenin detaylarını getirir' })
  @ApiParam({ name: 'id', description: 'Belge ID' })
  @ApiResponse({ status: 200, description: 'Belge başarıyla getirildi' })
  @ApiResponse({ status: 404, description: 'Belge bulunamadı' })
  @LogMethod()
  async findOne(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.uid;

    this.flowTracker.trackStep(
      `${id} ID'li belge detayları alınıyor`,
      'DocumentsController',
    );

    try {
      this.logger.debug(
        `Belge detayları alınıyor: ${id}`,
        'DocumentsController.findOne',
        __filename,
        148,
        { userId, documentId: id },
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return await this.documentsService.findOne(id, userId);
    } catch (error) {
      this.logger.logError(error, 'DocumentsController.findOne', {
        userId,
        documentId: id,
        additionalInfo: 'Belge detayları alınırken hata oluştu',
      });
      throw error;
    }
  }

  @Get(':id/text')
  @ApiOperation({ summary: 'Bir belgeden çıkarılan metni getirir' })
  @ApiParam({ name: 'id', description: 'Belge ID' })
  @ApiResponse({ status: 200, description: 'Belge metni başarıyla getirildi' })
  @ApiResponse({ status: 404, description: 'Belge bulunamadı' })
  @LogMethod()
  async getDocumentText(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.uid;

    this.flowTracker.trackStep(
      `${id} ID'li belgenin metni alınıyor`,
      'DocumentsController',
    );

    try {
      this.logger.debug(
        `Belge metni alınıyor: ${id}`,
        'DocumentsController.getDocumentText',
        __filename,
        178,
        { userId, documentId: id },
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return await this.documentsService.getDocumentText(id, userId);
    } catch (error) {
      this.logger.logError(error, 'DocumentsController.getDocumentText', {
        userId,
        documentId: id,
        additionalInfo: 'Belge metni alınırken hata oluştu',
      });
      throw error;
    }
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Bir belgeyi siler (hem veritabanından hem de depolamadan)',
  })
  @ApiParam({ name: 'id', description: 'Belge ID' })
  @ApiResponse({ status: 200, description: 'Belge başarıyla silindi' })
  @ApiResponse({ status: 404, description: 'Belge bulunamadı' })
  @LogMethod()
  async remove(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.uid;

    this.flowTracker.trackStep(
      `${id} ID'li belge siliniyor`,
      'DocumentsController',
    );

    try {
      this.logger.debug(
        `Belge siliniyor: ${id}`,
        'DocumentsController.remove',
        __filename,
        210,
        { userId, documentId: id },
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return await this.documentsService.remove(id, userId);
    } catch (error) {
      this.logger.logError(error, 'DocumentsController.remove', {
        userId,
        documentId: id,
        additionalInfo: 'Belge silinirken hata oluştu',
      });
      throw error;
    }
  }

  /**
   * Analyze document and extract topics
   */
  @Post(':id/analyze')
  @UseGuards(FirebaseGuard)
  @ApiOperation({ summary: 'Belgeyi analiz et ve konuları çıkar' })
  @ApiParam({ name: 'id', description: 'Belge ID' })
  @ApiResponse({ status: 200, description: 'Belge analiz edildi' })
  @ApiResponse({ status: 404, description: 'Belge bulunamadı' })
  @LogMethod()
  async analyzeDocument(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.uid;

    this.flowTracker.trackStep(
      `${id} ID'li belge analiz ediliyor`,
      'DocumentsController',
    );

    try {
      // Belge metni getir
      const documentText = await this.documentsService.getDocumentText(
        id,
        userId,
      );

      // Yapay zeka ile konuları tespit et
      const topicResult = await this.aiService.detectTopics(
        documentText.text,
        [], // existingTopics boş başlasın
      );

      this.logger.info(
        `Belge analiz edildi: ${id}`,
        'DocumentsController.analyzeDocument',
        __filename,
        undefined,
        {
          userId,
          documentId: id,
          topicCount: topicResult.topics.length,
        },
      );

      return {
        success: true,
        documentId: id,
        topics: topicResult.topics,
        analysisTime: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.logError(error, 'DocumentsController.analyzeDocument', {
        userId,
        documentId: id,
        additionalInfo: 'Belge analiz edilirken hata oluştu',
      });
      throw error;
    }
  }

  @Post('upload-and-detect-topics')
  @ApiOperation({
    summary: 'Bir belge yükler, metin çıkarır ve konuları tespit eder',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Yüklenecek PDF, DOCX veya metin dosyası',
        },
        courseId: {
          type: 'string',
          description: 'Bağlı olduğu ders ID (opsiyonel)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Belge yüklendi ve konular tespit edildi',
  })
  @ApiResponse({
    status: 400,
    description: 'Geçersiz dosya formatı veya işlem hatası',
  })
  @UseInterceptors(FileInterceptor('file'))
  @LogMethod()
  async uploadAndDetectTopics(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({
            fileType:
              /(pdf|docx|doc|txt|application\/pdf|application\/vnd.openxmlformats-officedocument.wordprocessingml.document|text\/plain)/,
          }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
    @Req() req: any,
  ) {
    const userId = req.user.uid;

    this.flowTracker.trackStep(
      `Dosya yükleniyor ve konular tespit ediliyor: ${file.originalname}`,
      'DocumentsController',
    );

    try {
      this.logger.info(
        `Dosya yükleme ve konu tespiti başladı: ${file.originalname}`,
        'DocumentsController.uploadAndDetectTopics',
        __filename,
        undefined,
        { userId, fileSize: file.size, fileType: file.mimetype },
      );

      // 1. Belgeyi yükle
      const document = await this.documentsService.uploadDocument(
        file,
        userId,
        dto.courseId,
        dto.fileName,
      );

      // 2. Yüklenen belgeden konuları tespit et
      const topicsResult = await this.aiService.detectTopics(
        document.extractedText,
        [], // Mevcut konu listesi yok
        `document_${document.id}`, // Önbellek anahtarı
      );

      // 3. Sonuçları döndür
      return {
        document: {
          id: document.id,
          fileName: document.fileName,
          fileUrl: document.fileUrl,
          extractedTextLength: document.extractedText?.length || 0,
        },
        topics: topicsResult.topics,
      };
    } catch (error) {
      this.logger.logError(error, 'DocumentsController.uploadAndDetectTopics', {
        userId,
        fileName: file.originalname,
        fileSize: file.size,
        courseId: dto.courseId,
        additionalInfo: 'Dosya yükleme ve konu tespiti sırasında hata oluştu',
      });
      throw error;
    }
  }

  @Post(':id/create-quiz')
  @ApiOperation({
    summary: 'Belgedeki konulardan sınav oluştur',
  })
  @ApiParam({
    name: 'id',
    description: 'Belge ID',
    type: 'string',
  })
  @ApiResponse({
    status: 201,
    description: 'Sınav başarıyla oluşturuldu',
  })
  @ApiResponse({
    status: 400,
    description: 'Geçersiz istek veya işlem hatası',
  })
  @LogMethod()
  async createQuizFromDocument(
    @Param('id') documentId: string,
    @Body() dto: CreateQuizFromDocumentDto,
    @Req() req: any,
  ) {
    const userId = req.user.uid;
    const trackingId = this.logger.startPerformanceTracking(
      'createQuizFromDocument',
    );

    this.flowTracker.trackStep(
      `Belgeden sınav oluşturuluyor: ${documentId}`,
      'DocumentsController',
    );

    try {
      this.logger.info(
        `Belgeden sınav oluşturma başladı: ${documentId}`,
        'DocumentsController.createQuizFromDocument',
        __filename,
        undefined,
        { userId, documentId, subTopicsCount: dto.subTopics?.length || 0 },
      );

      // 1. Belge metnini al
      this.logger.debug(
        `1. Adım: Belge metni alınıyor. Belge ID: ${documentId}`,
        'DocumentsController.createQuizFromDocument',
        __filename,
      );

      const documentMetniPerf = this.logger.startPerformanceTracking(
        'document_text_retrieval',
      );

      const documentTextResult = await this.documentsService.getDocumentText(
        documentId,
        userId,
      );

      const documentText = documentTextResult.text;

      const docTextPerfResult =
        this.logger.endPerformanceTracking(documentMetniPerf);
      this.logger.debug(
        `1.1 Belge metni alındı: ${docTextPerfResult.durationMs.toFixed(2)}ms (${documentText.length} karakter)`,
        'DocumentsController.createQuizFromDocument',
        __filename,
        undefined,
        {
          textLength: documentText.length,
          duration: docTextPerfResult.durationMs,
        },
      );

      // 2. Alt konuları al veya tespit et
      let subTopics = dto.subTopics || [];

      // Eğer alt konular belirtilmemişse, tespit et
      if (subTopics.length === 0) {
        this.logger.debug(
          `2. Adım: Alt konular belirtilmemiş, otomatik tespit ediliyor`,
          'DocumentsController.createQuizFromDocument',
          __filename,
        );

        const konuTespitPerf =
          this.logger.startPerformanceTracking('topic_detection');

        const topicsResult = await this.aiService.detectTopics(
          documentText,
          [],
          `document_${documentId}_quiz`,
        );

        subTopics = topicsResult.topics.map((topic) => ({
          subTopicName: topic.subTopicName,
          normalizedSubTopicName: topic.normalizedSubTopicName,
        }));

        const konuPerfResult =
          this.logger.endPerformanceTracking(konuTespitPerf);
        this.logger.debug(
          `2.1 Konular tespit edildi: ${konuPerfResult.durationMs.toFixed(2)}ms (${subTopics.length} konu)`,
          'DocumentsController.createQuizFromDocument',
          __filename,
          undefined,
          { topicCount: subTopics.length, duration: konuPerfResult.durationMs },
        );
      } else {
        this.logger.debug(
          `2. Adım: Gönderilen ${subTopics.length} alt konu kullanılıyor`,
          'DocumentsController.createQuizFromDocument',
          __filename,
          undefined,
          { manualTopics: true, topicCount: subTopics.length },
        );
      }

      // 3. Sınavı oluştur
      this.logger.debug(
        `3. Adım: Sınav oluşturuluyor. ${subTopics.length} konu, ${dto.questionCount || 10} soru, ${dto.difficulty || 'medium'} zorluk`,
        'DocumentsController.createQuizFromDocument',
        __filename,
        undefined,
        {
          topicCount: subTopics.length,
          questionCount: dto.questionCount || 10,
          difficulty: dto.difficulty || 'medium',
        },
      );

      const sinavOlusturmaPerf =
        this.logger.startPerformanceTracking('quiz_creation');

      const quiz = await this.quizzesService.createQuiz({
        userId,
        quizType: 'quick',
        sourceDocument: {
          documentId,
          text: documentText,
        },
        subTopics,
        preferences: {
          questionCount: dto.questionCount || 10,
          difficulty: dto.difficulty || 'medium',
          timeLimit: dto.timeLimit,
          prioritizeWeakAndMediumTopics: false,
        },
      });

      const sinavPerfResult =
        this.logger.endPerformanceTracking(sinavOlusturmaPerf);

      const overallResult = this.logger.endPerformanceTracking(trackingId);
      this.logger.info(
        `Sınav başarıyla oluşturuldu. ID: ${quiz.id}, Toplam süre: ${overallResult.durationMs.toFixed(2)}ms`,
        'DocumentsController.createQuizFromDocument',
        __filename,
        undefined,
        {
          quizId: quiz.id,
          questionCount: quiz.questions?.length || 0,
          documentId,
          totalDuration: overallResult.durationMs,
          documentTextDuration: docTextPerfResult.durationMs,
          quizCreationDuration: sinavPerfResult.durationMs,
        },
      );

      return quiz;
    } catch (error) {
      this.logger.endPerformanceTracking(trackingId); // Hata durumunda da performans izlemeyi sonlandır

      // Normal hata mesajı - özet bilgi
      this.logger.error(
        `Belgeden sınav oluşturma sırasında hata: ${error.message}`,
        'DocumentsController.createQuizFromDocument',
        __filename,
      );

      this.flowTracker.track(
        `🔴 Belgeden sınav oluşturma başarısız: ${error.message}`,
        'DocumentsController.createQuizFromDocument',
      );

      // Detaylı hata kaydı
      this.logger.logError(
        error,
        'DocumentsController.createQuizFromDocument',
        {
          userId,
          documentId,
          subTopicsCount: dto.subTopics?.length || 0,
          additionalInfo: 'Belgeden sınav oluşturma sırasında hata oluştu',
        },
      );
      throw error;
    }
  }
}
