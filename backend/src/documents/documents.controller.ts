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
import { UploadDocumentDto } from './dto';
import { LoggerService } from '../common/services/logger.service';
import { FlowTrackerService } from '../common/services/flow-tracker.service';
import { LogMethod } from '../common/decorators';
import { AiService } from '../ai/ai.service';

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
}
