/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
  Put,
  Query,
  BadRequestException,
  Request,
  HttpCode,
  HttpStatus,
  SetMetadata,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiQuery,
  getSchemaPath,
} from '@nestjs/swagger';
import { LearningTargetsService } from './learning-targets.service';
import {
  UpdateLearningTargetDto,
  DetectTopicsDto,
  CreateBatchLearningTargetsDto,
  DetectNewTopicsDto,
  ConfirmNewTopicsDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LearningTargetWithQuizzes } from '../common/interfaces';
import { RequestWithUser } from '../common/types';
import { LoggerService } from '../common/services/logger.service';
import { FlowTrackerService } from '../common/services/flow-tracker.service';
import { LogMethod } from '../common/decorators';
import { DocumentsService } from '../documents/documents.service';
import { TopicDetectionService } from '../ai/services/topic-detection.service';

// Dummy class for Swagger schema reference if LearningTargetWithQuizzes is an interface
// This is a common workaround for NestJS Swagger when using interfaces for response types.
// Ensure this class matches the structure of LearningTargetWithQuizzes interface.
class LearningTargetWithQuizzesResponse implements LearningTargetWithQuizzes {
  id: string;
  courseId: string;
  userId: string;
  subTopicName: string;
  normalizedSubTopicName: string;
  status: 'pending' | 'failed' | 'medium' | 'mastered';
  failCount: number;
  mediumCount: number;
  successCount: number;
  lastAttemptScorePercent: number | null;
  lastAttempt: Date | null;
  firstEncountered: Date;
  lastPersonalizedQuizId: string | null;
  // quizzes: any[]; // Define more accurately if possible, e.g., Quiz[]
}

@ApiTags('Öğrenme Hedefleri')
@ApiBearerAuth('Firebase JWT')
@UseGuards(JwtAuthGuard)
@Controller('learning-targets')
export class LearningTargetsController {
  private readonly logger: LoggerService;
  private readonly flowTracker: FlowTrackerService;

  constructor(
    private readonly learningTargetsService: LearningTargetsService,
    private readonly documentsService: DocumentsService,
    private readonly topicDetectionService: TopicDetectionService,
  ) {
    this.logger = LoggerService.getInstance();
    this.flowTracker = FlowTrackerService.getInstance();
    this.logger.debug(
      'LearningTargetsController başlatıldı',
      'LearningTargetsController.constructor',
      __filename,
      37,
    );
  }

  @Get()
  @ApiOperation({
    summary:
      'Tüm öğrenme hedeflerini veya courseId parametresi ile bir derse ait hedefleri listeler',
  })
  @ApiQuery({
    name: 'courseId',
    required: false,
    description: "Ders ID'si (opsiyonel)",
  })
  @ApiResponse({
    status: 200,
    description: 'Öğrenme hedefleri başarıyla listelendi',
  })
  @LogMethod()
  async findAll(
    @Query('courseId') courseId: string | undefined,
    @Request() req: RequestWithUser,
  ) {
    try {
      this.flowTracker.trackStep(
        courseId
          ? `${courseId} ID'li derse ait öğrenme hedefleri listeleniyor`
          : 'Tüm öğrenme hedefleri listeleniyor',
        'LearningTargetsController',
      );

      if (courseId) {
        return await this.learningTargetsService.findByCourse(
          courseId,
          req.user.uid,
        );
      }

      return await this.learningTargetsService.findAll(req.user.uid);
    } catch (error) {
      this.logger.logError(error, 'LearningTargetsController.findAll', {
        userId: req.user.uid,
        courseId,
        additionalInfo: 'Öğrenme hedefleri listelenirken hata oluştu',
      });
      throw error;
    }
  }

  @Get('by-course/:courseId')
  @ApiOperation({
    summary:
      'Bir derse ait tüm öğrenme hedeflerini listeler (path parametresi ile)',
  })
  @ApiParam({ name: 'courseId', description: "Ders ID'si" })
  @ApiResponse({
    status: 200,
    description: 'Öğrenme hedefleri başarıyla listelendi',
  })
  @ApiResponse({ status: 404, description: 'Ders bulunamadı' })
  @LogMethod()
  async findByCourse(
    @Param('courseId') courseId: string,
    @Request() req: RequestWithUser,
  ) {
    try {
      this.flowTracker.trackStep(
        `${courseId} ID'li derse ait öğrenme hedefleri alınıyor`,
        'LearningTargetsController',
      );

      return await this.learningTargetsService.findByCourse(
        courseId,
        req.user.uid,
      );
    } catch (error) {
      this.logger.logError(error, 'LearningTargetsController.findByCourse', {
        userId: req.user.uid,
        courseId,
        additionalInfo: 'Derse ait öğrenme hedefleri alınırken hata oluştu',
      });
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bir öğrenme hedefinin detaylarını getirir' })
  @ApiParam({ name: 'id', description: "Öğrenme hedefi ID'si" })
  @ApiResponse({
    status: 200,
    description: 'Öğrenme hedefi başarıyla getirildi',
  })
  @ApiResponse({ status: 404, description: 'Öğrenme hedefi bulunamadı' })
  @LogMethod()
  async findOne(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<LearningTargetWithQuizzes> {
    const userId = req.user.uid;

    try {
      this.flowTracker.trackStep(
        `${id} ID'li öğrenme hedefi detayları getiriliyor`,
        'LearningTargetsController',
      );

      return await this.learningTargetsService.findOne(id, userId);
    } catch (error) {
      this.logger.logError(error, 'LearningTargetsController.findOne', {
        userId,
        targetId: id,
        additionalInfo: 'Öğrenme hedefi getirilirken hata oluştu',
      });
      throw error;
    }
  }

  @Get('by-status/:courseId')
  @ApiOperation({ summary: 'Duruma göre öğrenme hedeflerini listeler' })
  @ApiParam({ name: 'courseId', description: "Ders ID'si" })
  @ApiQuery({
    name: 'status',
    description: 'Hedef durumu',
    enum: ['pending', 'failed', 'medium', 'mastered'],
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Öğrenme hedefleri başarıyla listelendi',
  })
  @ApiResponse({ status: 400, description: 'Geçersiz durum parametresi' })
  @ApiResponse({ status: 404, description: 'Ders bulunamadı' })
  @LogMethod()
  async findByStatus(
    @Param('courseId') courseId: string,
    @Query('status') status: string,
    @Req() req: any,
  ) {
    const userId = req.user.uid;

    try {
      this.flowTracker.trackStep(
        `${courseId} ID'li dersin '${status}' durumundaki öğrenme hedefleri listeleniyor`,
        'LearningTargetsController',
      );

      const validStatuses = ['pending', 'failed', 'medium', 'mastered'];
      if (!validStatuses.includes(status)) {
        this.logger.warn(
          `Geçersiz durum parametresi: ${status}`,
          'LearningTargetsController.findByStatus',
          __filename,
          147,
          { validStatuses },
        );
        throw new BadRequestException(
          `Geçersiz durum paramtresi. Geçerli değerler: ${validStatuses.join(', ')}`,
        );
      }

      return await this.learningTargetsService.findByStatus(
        courseId,
        userId,
        status as 'pending' | 'failed' | 'medium' | 'mastered',
      );
    } catch (error) {
      if (!(error instanceof BadRequestException)) {
        this.logger.logError(error, 'LearningTargetsController.findByStatus', {
          userId,
          courseId,
          status,
          additionalInfo: 'Durum bazlı öğrenme hedefleri alınırken hata oluştu',
        });
      }
      throw error;
    }
  }

  @Post('detect-topics')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Detect topics from document text and optionally save as learning targets' })
  @ApiResponse({
    status: 200,
    description: 'Topics detected successfully',
    type: String,
    isArray: true,
  })
  @SetMetadata('anonymousAllowed', true)
  async detectTopics(@Body() dto: DetectTopicsDto, @Req() req: any) {
    const userId = req.user?.uid || 'anonymous';
    const isAuthenticated = userId !== 'anonymous';

    try {
      this.flowTracker.trackStep(
        `${dto.courseId || 'N/A'} ID'li ders için metin içinden konular tespit ediliyor`,
        'LearningTargetsController',
      );

      this.logger.debug(
        'Konu tespiti başlatılıyor',
        'LearningTargetsController.detectTopics',
        __filename,
        183,
        {
          userId,
          courseId: dto.courseId || 'N/A',
          textLength: dto.documentText?.length || 0,
          hasDocumentId: !!dto.documentId,
          isAnonymous: userId === 'anonymous',
          requestDetails: JSON.stringify(dto),
        },
      );

      // Belge ID'si var mı kontrol et
      if (dto.documentId) {
        this.logger.info(
          `Belge ID'si kullanılarak konular tespit ediliyor: ${dto.documentId}`,
          'LearningTargetsController.detectTopics',
          __filename,
        );

        try {
          // Belge ID'si ile konu tespiti yap
          const result =
            await this.learningTargetsService.analyzeDocumentForTopics(
              dto.documentId,
              userId,
            );

          this.logger.info(
            `Belge ID ${dto.documentId} için konu tespiti başarılı: ${result.length} konu bulundu`,
            'LearningTargetsController.detectTopics',
            __filename,
          );
          
          // Eğer kullanıcı giriş yapmış ve courseId varsa, tespit edilen konuları öğrenme hedefleri olarak kaydet
          let savedTargets: LearningTargetWithQuizzes[] = [];
          if (isAuthenticated && dto.courseId) {
            this.logger.info(
              `✨ KONU TESPİTİ: ${result.length} konu tespit edildi, ${dto.courseId} ID'li ders için öğrenme hedefleri olarak kaydediliyor`,
              'LearningTargetsController.detectTopics',
              __filename,
            );
            
            try {
              // Tespit edilen konuları öğrenme hedefi olarak oluşturmak için topic listesi hazırla
              const topics = result.map(topic => ({
                subTopicName: topic,
                normalizedSubTopicName: topic.toLowerCase().replace(/\s+/g, '-'),
              }));
              
              this.logger.info(
                `🔄 KONU KAYDI: createBatch metodu çağrılıyor`,
                'LearningTargetsController.detectTopics',
                __filename,
              );
              
              // Toplu öğrenme hedefi oluştur - "pending" (beklemede) durumu ile kaydedilecek
              savedTargets = await this.learningTargetsService.createBatch(
                dto.courseId,
                userId,
                topics
              );
              
              this.logger.info(
                `✅ BAŞARILI: ${savedTargets.length} adet öğrenme hedefi "pending" durumu ile veritabanına kaydedildi`,
                'LearningTargetsController.detectTopics',
                __filename,
              );
            } catch (saveError) {
              this.logger.error(
                `❌ HATA: Öğrenme hedefleri kaydedilirken hata oluştu: ${saveError.message}`,
                'LearningTargetsController.detectTopics',
                __filename,
              );
              // Kaydetme hatası olsa bile konuları döndürmeye devam et
            }
          } else if (dto.courseId && !isAuthenticated) {
            this.logger.info(
              `⚠️ UYARI: Kullanıcı giriş yapmadığı için öğrenme hedefleri kaydedilmedi`,
              'LearningTargetsController.detectTopics',
              __filename,
            );
          } else {
            this.logger.info(
              `ℹ️ BİLGİ: CourseId sağlanmadığı için öğrenme hedefleri kaydedilmedi`,
              'LearningTargetsController.detectTopics',
              __filename,
            );
          }

          // TopicDetectionResult formatında yanıt döndür
          return {
            topics: result.map((topic) => ({
              subTopicName: topic,
              normalizedSubTopicName: topic
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '-'),
            })),
          };
        } catch (error) {
          this.logger.logError(
            error,
            'LearningTargetsController.detectTopics.documentIdMode',
            {
              userId,
              documentId: dto.documentId,
              errorMessage: error.message,
            },
          );
          throw error;
        }
      } else if (dto.documentText) {
        this.logger.info(
          `Doğrudan metin kullanılarak konular tespit ediliyor (${dto.documentText?.length || 0} karakter)`,
          'LearningTargetsController.detectTopics',
          __filename,
        );

        // AI servisini doğrudan çağırarak konu tespiti yap
        const result = await this.learningTargetsService.analyzeDocumentText(
          dto.documentText || '',
          userId,
        );

        this.logger.debug(
          `Doğrudan metinden konu tespiti tamamlandı: ${result.length} konu bulundu`,
          'LearningTargetsController.detectTopics',
          __filename,
        );
        
        // Eğer kullanıcı giriş yapmış ve courseId varsa, tespit edilen konuları öğrenme hedefleri olarak kaydet
        let savedTargets: LearningTargetWithQuizzes[] = [];
        if (isAuthenticated && dto.courseId) {
          this.logger.info(
            `Tespit edilen ${result.length} konu, ${dto.courseId} ID'li ders için öğrenme hedefi olarak kaydediliyor`,
            'LearningTargetsController.detectTopics',
            __filename,
          );
          
          try {
            // Tespit edilen konuları öğrenme hedefi olarak oluşturmak için topic listesi hazırla
            const topics = result.map(topic => ({
              subTopicName: topic,
              normalizedSubTopicName: topic.toLowerCase().replace(/\s+/g, '-'),
            }));
            
            // Toplu öğrenme hedefi oluştur - "pending" (beklemede) durumu ile kaydedilecek
            // createBatch metoduna uygun parametreler ile çağrı yapıyoruz
            savedTargets = await this.learningTargetsService.createBatch(
              dto.courseId,
              userId,
              topics
            );
            
            this.logger.info(
              `${savedTargets.length} adet öğrenme hedefi "pending" (beklemede) durumu ile başarıyla kaydedildi`,
              'LearningTargetsController.detectTopics',
              __filename,
            );
          } catch (saveError) {
            this.logger.error(
              `Öğrenme hedefleri kaydedilirken hata oluştu: ${saveError.message}`,
              'LearningTargetsController.detectTopics',
              __filename
            );
            // Kaydetme hatası olsa bile konuları döndürmeye devam et
          }
        } else if (dto.courseId && !isAuthenticated) {
          this.logger.info(
            `Kullanıcı giriş yapmadığı için öğrenme hedefleri kaydedilmedi`,
            'LearningTargetsController.detectTopics',
            __filename,
          );
        }

        // TopicDetectionResult formatında yanıt döndür
        return {
          topics: result.map((topic) => ({
            subTopicName: topic,
            normalizedSubTopicName: topic
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '-'),
          })),
        };
      } else {
        // Ne belge metni ne de belge ID'si var
        this.logger.warn(
          "Konu tespiti için ne belge metni ne de belge ID'si belirtilmemiş",
          'LearningTargetsController.detectTopics',
          __filename,
        );

        throw new BadRequestException(
          "Konu tespiti için belge metni veya belge ID'si gerekmektedir",
        );
      }
    } catch (error) {
      this.logger.logError(error, 'LearningTargetsController.detectTopics', {
        userId,
        courseId: dto.courseId || 'N/A',
        documentId: dto.documentId,
        textLength: dto.documentText?.length || 0,
        additionalInfo: 'Konular tespit edilirken hata oluştu',
        errorType: error.constructor.name,
        errorMessage: error.message,
      });
      throw error;
    }
  }

  @Post('batch')
  @ApiOperation({ summary: 'Toplu olarak öğrenme hedefleri oluşturur' })
  @ApiBody({ type: CreateBatchLearningTargetsDto })
  @ApiResponse({
    status: 201,
    description: 'Öğrenme hedefleri başarıyla oluşturuldu',
  })
  @ApiResponse({ status: 400, description: 'Geçersiz istek' })
  @ApiResponse({ status: 404, description: 'Ders bulunamadı' })
  @LogMethod()
  async createBatch(
    @Body() dto: CreateBatchLearningTargetsDto,
    @Req() req: any,
  ) {
    const userId = req.user.uid;

    try {
      this.flowTracker.trackStep(
        `${dto.courseId} ID'li ders için toplu öğrenme hedefleri oluşturuluyor`,
        'LearningTargetsController',
      );

      const topics = dto.topics.map((topic) => ({
        subTopicName: topic.subTopicName,
        normalizedSubTopicName: topic.normalizedSubTopicName ?? '',
      }));

      this.logger.debug(
        `${topics.length} adet öğrenme hedefi oluşturuluyor`,
        'LearningTargetsController.createBatch',
        __filename,
        225,
        {
          userId,
          courseId: dto.courseId,
          topicCount: topics.length,
        },
      );

      return await this.learningTargetsService.createBatch(
        dto.courseId,
        userId,
        topics,
      );
    } catch (error) {
      this.logger.logError(error, 'LearningTargetsController.createBatch', {
        userId,
        courseId: dto.courseId,
        topicCount: dto.topics.length,
        additionalInfo: 'Toplu öğrenme hedefleri oluşturulurken hata oluştu',
      });
      throw error;
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Bir öğrenme hedefini günceller' })
  @ApiParam({ name: 'id', description: "Öğrenme hedefi ID'si" })
  @ApiBody({ type: UpdateLearningTargetDto })
  @ApiResponse({
    status: 200,
    description: 'Öğrenme hedefi başarıyla güncellendi',
    type: LearningTargetWithQuizzesResponse, // Use the class for schema
  })
  @ApiResponse({ status: 404, description: 'Öğrenme hedefi bulunamadı' })
  @LogMethod()
  async update(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
    @Body() updateLearningTargetDto: UpdateLearningTargetDto,
  ): Promise<LearningTargetWithQuizzes> {
    try {
      this.flowTracker.trackStep(
        `${id} ID'li öğrenme hedefi güncelleniyor`,
        'LearningTargetsController',
      );
      const result = await this.learningTargetsService.update(
        id,
        req.user.uid,
        updateLearningTargetDto,
      );
      return {
        ...result,
        lastAttempt: result.lastAttempt ? new Date(result.lastAttempt) : null,
        firstEncountered: new Date(result.firstEncountered),
      };
    } catch (error) {
      this.logger.logError(error, 'LearningTargetsController.update', {
        userId: req.user.uid,
        targetId: id,
        updateData: updateLearningTargetDto,
        additionalInfo: 'Öğrenme hedefi güncellenirken hata oluştu',
      });
      throw error;
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Bir öğrenme hedefini siler' })
  @ApiParam({ name: 'id', description: "Öğrenme hedefi ID'si" })
  @ApiResponse({ status: 200, description: 'Öğrenme hedefi başarıyla silindi' })
  @ApiResponse({ status: 404, description: 'Öğrenme hedefi bulunamadı' })
  @LogMethod()
  async remove(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<void> {
    try {
      this.flowTracker.trackStep(
        `${id} ID'li öğrenme hedefi siliniyor`,
        'LearningTargetsController',
      );
      await this.learningTargetsService.remove(id, req.user.uid);
    } catch (error) {
      this.logger.logError(error, 'LearningTargetsController.remove', {
        userId: req.user.uid,
        targetId: id,
        additionalInfo: 'Öğrenme hedefi silinirken hata oluştu',
      });
      throw error;
    }
  }

  @Post(':courseId/detect-new-topics')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Detect new topics from lesson context compared to existing topics' })
  @ApiParam({ name: 'courseId', description: 'Course ID', type: String })
  @ApiBody({ type: DetectNewTopicsDto })
  @ApiResponse({ status: 200, description: 'New topics detected successfully', type: [String] })
  @ApiResponse({ status: 400, description: 'Bad Request: Invalid input data' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @LogMethod()
  async detectNewTopics(
    @Param('courseId') courseId: string,
    @Body() detectNewTopicsDto: DetectNewTopicsDto,
    @Req() req: RequestWithUser,
  ): Promise<string[]> {
    const userId = req.user.uid;
    try {
      this.flowTracker.trackStep(
        `Detecting new topics for course ${courseId} based on lesson context`,
        'LearningTargetsController.detectNewTopics',
      );
      this.logger.debug(
        'New topic detection started',
        'LearningTargetsController.detectNewTopics',
        __filename,
        undefined, 
        { userId, courseId, existingTopicsCount: detectNewTopicsDto.existingTopicNames.length },
      );

      const newTopics = await this.topicDetectionService.detectExclusiveNewTopics(
        detectNewTopicsDto.lessonContext,
        detectNewTopicsDto.existingTopicNames,
      );

      this.logger.info(
        `${newTopics.length} new topics detected for course ${courseId}`,
        'LearningTargetsController.detectNewTopics',
        __filename,
      );
      return newTopics;
    } catch (error) {
      this.logger.logError(error, 'LearningTargetsController.detectNewTopics', {
        userId,
        courseId,
        lessonContextLength: detectNewTopicsDto.lessonContext?.length,
        existingTopicNames: detectNewTopicsDto.existingTopicNames,
        additionalInfo: 'Error during new topic detection',
      });
      throw error;
    }
  }

  @Post(':courseId/confirm-new-topics')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Confirm and save detected new topics as learning targets' })
  @ApiParam({ name: 'courseId', description: 'Course ID', type: String })
  @ApiBody({ type: ConfirmNewTopicsDto })
  @ApiResponse({ 
    status: 201, 
    description: 'New topics confirmed and saved as learning targets', 
    schema: { type: 'array', items: { $ref: getSchemaPath(LearningTargetWithQuizzesResponse) } }
  })
  @ApiResponse({ status: 400, description: 'Bad Request: Invalid input data' })
  @ApiResponse({ status: 404, description: 'Course not found or no topics to save' })
  @LogMethod()
  async confirmNewTopics(
    @Param('courseId') courseId: string,
    @Body() confirmNewTopicsDto: ConfirmNewTopicsDto,
    @Req() req: RequestWithUser,
  ): Promise<LearningTargetWithQuizzes[]> {
    const userId = req.user.uid;
    try {
      this.flowTracker.trackStep(
        `Confirming and saving ${confirmNewTopicsDto.newTopicNames.length} new topics for course ${courseId}`,
        'LearningTargetsController.confirmNewTopics',
      );
      this.logger.debug(
        'Confirmation of new topics started',
        'LearningTargetsController.confirmNewTopics',
        __filename,
        undefined,
        { userId, courseId, newTopicsCount: confirmNewTopicsDto.newTopicNames.length },
      );

      if (!confirmNewTopicsDto.newTopicNames || confirmNewTopicsDto.newTopicNames.length === 0) {
        this.logger.warn(
          'Attempted to confirm new topics with an empty list.',
          'LearningTargetsController.confirmNewTopics',
          __filename,
          undefined,
          { userId, courseId }
        );
        throw new BadRequestException('No new topic names provided for confirmation.');
      }
      
      const savedLearningTargetsPrisma = await this.learningTargetsService.confirmAndSaveNewTopics(
        courseId,
        confirmNewTopicsDto.newTopicNames,
        userId,
      );

      this.logger.info(
        `${savedLearningTargetsPrisma.length} new learning targets saved for course ${courseId}`,
        'LearningTargetsController.confirmNewTopics',
        __filename,
      );

      const savedLearningTargets: LearningTargetWithQuizzes[] = savedLearningTargetsPrisma.map(target => ({
        ...target,
        lastAttempt: target.lastAttempt ? new Date(target.lastAttempt) : null,
        firstEncountered: new Date(target.firstEncountered),
      }));

      return savedLearningTargets;
    } catch (error) {
      this.logger.logError(error, 'LearningTargetsController.confirmNewTopics', {
        userId,
        courseId,
        newTopicNames: confirmNewTopicsDto.newTopicNames,
        additionalInfo: 'Error during confirmation and saving of new topics',
      });
      throw error;
    }
  }
}
