import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto, UpdateCourseDto } from './dto';
import { FirebaseGuard } from '../auth/firebase/firebase.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RequestWithUser } from '../types/request.type';
import { Course } from '../types/course.type';
import { LearningTarget } from '../types/learning-target.type';
import { LoggerService } from '../common/services/logger.service';
import { FlowTrackerService } from '../common/services/flow-tracker.service';
import { LogMethod } from '../common/decorators';

@ApiTags('Dersler')
@Controller('courses')
@UseGuards(FirebaseGuard)
@ApiBearerAuth('Firebase JWT')
export class CoursesController {
  private readonly logger: LoggerService;
  private readonly flowTracker: FlowTrackerService;

  constructor(private readonly coursesService: CoursesService) {
    this.logger = LoggerService.getInstance();
    this.flowTracker = FlowTrackerService.getInstance();
    this.logger.debug(
      'CoursesController başlatıldı',
      'CoursesController.constructor',
      __filename,
      30,
    );
  }

  @Post()
  @ApiOperation({ summary: 'Yeni ders oluşturur' })
  @ApiResponse({ status: 201, description: 'Ders başarıyla oluşturuldu' })
  @ApiResponse({ status: 400, description: 'Geçersiz veri' })
  @ApiResponse({ status: 401, description: 'Yetkisiz erişim' })
  @LogMethod()
  create(
    @Body() createCourseDto: CreateCourseDto,
    @Request() req: RequestWithUser,
  ): Promise<Course> {
    this.flowTracker.trackStep('Yeni ders oluşturuluyor', 'CoursesController');
    try {
      return this.coursesService.create(req.user.uid, createCourseDto);
    } catch (error) {
      this.logger.logError(error, 'CoursesController.create', {
        userId: req.user.uid,
        courseData: createCourseDto,
        additionalInfo: 'Ders oluşturulurken hata oluştu',
      });
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Kullanıcının tüm derslerini listeler' })
  @ApiResponse({ status: 200, description: 'Dersler başarıyla listelendi' })
  @ApiResponse({ status: 401, description: 'Yetkisiz erişim' })
  @LogMethod()
  findAll(@Request() req: RequestWithUser): Promise<Course[]> {
    this.flowTracker.trackStep('Tüm dersler listeleniyor', 'CoursesController');
    try {
      return this.coursesService.findAll(req.user.uid);
    } catch (error) {
      this.logger.logError(error, 'CoursesController.findAll', {
        userId: req.user.uid,
        additionalInfo: 'Dersler listelenirken hata oluştu',
      });
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Belirli bir dersi getirir' })
  @ApiResponse({ status: 200, description: 'Ders başarıyla getirildi' })
  @ApiResponse({ status: 401, description: 'Yetkisiz erişim' })
  @ApiResponse({ status: 403, description: 'Erişim izni yok' })
  @ApiResponse({ status: 404, description: 'Ders bulunamadı' })
  @LogMethod()
  findOne(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<Course & { learningTargets: LearningTarget[] }> {
    this.flowTracker.trackStep(
      `${id} ID'li ders getiriliyor`,
      'CoursesController',
    );
    try {
      return this.coursesService.findOne(id, req.user.uid);
    } catch (error) {
      this.logger.logError(error, 'CoursesController.findOne', {
        userId: req.user.uid,
        courseId: id,
        additionalInfo: 'Ders getirilirken hata oluştu',
      });
      throw error;
    }
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Dersin istatistiklerini getirir' })
  @ApiResponse({
    status: 200,
    description: 'İstatistikler başarıyla getirildi',
  })
  @ApiResponse({ status: 401, description: 'Yetkisiz erişim' })
  @ApiResponse({ status: 403, description: 'Erişim izni yok' })
  @ApiResponse({ status: 404, description: 'Ders bulunamadı' })
  @LogMethod()
  getCourseStats(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<{
    pending: number;
    failed: number;
    medium: number;
    mastered: number;
    total: number;
  }> {
    this.flowTracker.trackStep(
      `${id} ID'li dersin istatistikleri alınıyor`,
      'CoursesController',
    );
    try {
      return this.coursesService.getStats(id, req.user.uid);
    } catch (error) {
      this.logger.logError(error, 'CoursesController.getCourseStats', {
        userId: req.user.uid,
        courseId: id,
        additionalInfo: 'Ders istatistikleri alınırken hata oluştu',
      });
      throw error;
    }
  }

  @Get(':id/dashboard')
  @ApiOperation({
    summary: 'Dersin öğrenme takip (dashboard) verilerini getirir',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard verileri başarıyla getirildi',
    schema: {
      type: 'object',
      properties: {
        overallProgress: {
          type: 'object',
          properties: {
            pending: { type: 'number', example: 5 },
            failed: { type: 'number', example: 3 },
            medium: { type: 'number', example: 8 },
            mastered: { type: 'number', example: 15 },
            total: { type: 'number', example: 31 },
          },
        },
        recentQuizzes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: '507f1f77bcf86cd799439011' },
              timestamp: { type: 'string', format: 'date-time' },
              score: { type: 'number', example: 85 },
              totalQuestions: { type: 'number', example: 10 },
            },
          },
        },
        progressByTopic: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              subTopic: { type: 'string', example: 'Diferansiyel Denklemler' },
              status: { type: 'string', example: 'medium' },
              scorePercent: { type: 'number', example: 75 },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Yetkisiz erişim' })
  @ApiResponse({ status: 403, description: 'Erişim izni yok' })
  @ApiResponse({ status: 404, description: 'Ders bulunamadı' })
  @LogMethod()
  getDashboardData(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<{
    overallProgress: {
      pending: number;
      failed: number;
      medium: number;
      mastered: number;
      total: number;
    };
    recentQuizzes: Array<{
      id: string;
      timestamp: string;
      score: number;
      totalQuestions: number;
    }>;
    progressByTopic: Array<{
      subTopic: string;
      status: string;
      scorePercent: number;
    }>;
  }> {
    this.flowTracker.trackStep(
      `${id} ID'li dersin gösterge paneli verileri alınıyor`,
      'CoursesController',
    );
    try {
      return this.coursesService.getDashboardData(id, req.user.uid);
    } catch (error) {
      this.logger.logError(error, 'CoursesController.getDashboardData', {
        userId: req.user.uid,
        courseId: id,
        additionalInfo: 'Gösterge paneli verileri alınırken hata oluştu',
      });
      throw error;
    }
  }

  @Get(':id/related-items')
  @ApiOperation({ summary: 'Derse ait ilişkili öğelerin sayısını getirir' })
  @ApiResponse({
    status: 200,
    description: 'İlişkili öğe sayıları başarıyla getirildi',
    schema: {
      type: 'object',
      properties: {
        courseId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        learningTargets: { type: 'number', example: 24 },
        quizzes: { type: 'number', example: 5 },
        failedQuestions: { type: 'number', example: 12 },
        documents: { type: 'number', example: 3 },
        total: { type: 'number', example: 44 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Yetkisiz erişim' })
  @ApiResponse({ status: 403, description: 'Erişim izni yok' })
  @ApiResponse({ status: 404, description: 'Ders bulunamadı' })
  @LogMethod()
  getRelatedItemsCount(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<{
    courseId: string;
    learningTargets: number;
    quizzes: number;
    failedQuestions: number;
    documents: number;
    total: number;
  }> {
    this.flowTracker.trackStep(
      `${id} ID'li dersin ilişkili öğe sayıları alınıyor`,
      'CoursesController',
    );
    try {
      return this.coursesService.getRelatedItemsCount(id, req.user.uid);
    } catch (error) {
      this.logger.logError(error, 'CoursesController.getRelatedItemsCount', {
        userId: req.user.uid,
        courseId: id,
        additionalInfo: 'İlişkili öğe sayıları alınırken hata oluştu',
      });
      throw error;
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Dersi günceller' })
  @ApiResponse({ status: 200, description: 'Ders başarıyla güncellendi' })
  @ApiResponse({ status: 400, description: 'Geçersiz veri' })
  @ApiResponse({ status: 401, description: 'Yetkisiz erişim' })
  @ApiResponse({ status: 403, description: 'Erişim izni yok' })
  @ApiResponse({ status: 404, description: 'Ders bulunamadı' })
  @LogMethod()
  update(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @Request() req: RequestWithUser,
  ): Promise<Course> {
    this.flowTracker.trackStep(
      `${id} ID'li ders güncelleniyor`,
      'CoursesController',
    );
    try {
      return this.coursesService.update(id, req.user.uid, updateCourseDto);
    } catch (error) {
      this.logger.logError(error, 'CoursesController.update', {
        userId: req.user.uid,
        courseId: id,
        updateData: updateCourseDto,
        additionalInfo: 'Ders güncellenirken hata oluştu',
      });
      throw error;
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Dersi siler' })
  @ApiResponse({ status: 200, description: 'Ders başarıyla silindi' })
  @ApiResponse({ status: 401, description: 'Yetkisiz erişim' })
  @ApiResponse({ status: 403, description: 'Erişim izni yok' })
  @ApiResponse({ status: 404, description: 'Ders bulunamadı' })
  @LogMethod()
  remove(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<{ message: string; courseId: string }> {
    this.flowTracker.trackStep(
      `${id} ID'li ders siliniyor`,
      'CoursesController',
    );
    try {
      return this.coursesService.remove(id, req.user.uid);
    } catch (error) {
      this.logger.logError(error, 'CoursesController.remove', {
        userId: req.user.uid,
        courseId: id,
        additionalInfo: 'Ders silinirken hata oluştu',
      });
      throw error;
    }
  }
}
