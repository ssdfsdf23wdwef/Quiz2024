/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { QuizzesService } from './quizzes.service';
import { FirebaseGuard } from '../auth/firebase/firebase.guard';
import { Quiz, QuizSummary } from '../common/types/quiz.type';
import { FailedQuestion } from '../common/types/question.type';
import { RequestWithUser } from '../common/types/request.type';
import { LoggerService } from '../common/services/logger.service';
import { FlowTrackerService } from '../common/services/flow-tracker.service';
import { LogMethod } from '../common/decorators';

@Controller('quizzes')
@ApiTags('quizzes')
@UseGuards(FirebaseGuard)
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class QuizzesController {
  private readonly logger: LoggerService;
  private readonly flowTracker: FlowTrackerService;

  constructor(private readonly quizzesService: QuizzesService) {
    this.logger = LoggerService.getInstance();
    this.flowTracker = FlowTrackerService.getInstance();
    this.logger.debug(
      'QuizzesController başlatıldı',
      'QuizzesController.constructor',
      __filename,
      28,
    );
  }

  @Get()
  @LogMethod({ trackParams: true })
  @ApiOperation({ summary: 'Kullanıcının tüm sınavlarını getirir' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sınavlar başarıyla getirildi',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Kimlik doğrulama hatası - yetkilendirme gerekli',
  })
  async findAll(): Promise<QuizSummary[]> {
    try {
      this.flowTracker.trackStep(
        'Kullanıcının tüm sınavları getiriliyor',
        'QuizzesController',
      );

      const quizzes = await this.quizzesService.findAll();

      this.logger.info(
        `${quizzes.length} adet sınav getirildi`,
        'QuizzesController.findAll',
        __filename,
        52,
        { quizzesCount: quizzes.length },
      );

      return quizzes.map((quiz: Quiz) => quiz as unknown as QuizSummary);
    } catch (error) {
      this.logger.logError(error, 'QuizzesController.findAll', {
        additionalInfo: 'Sınavlar getirilirken bir hata oluştu',
      });

      throw new InternalServerErrorException(
        'Sınavlar getirilirken bir hata oluştu',
        { cause: error },
      );
    }
  }

  @Get('by-course/:courseId')
  @LogMethod({ trackParams: true })
  @ApiOperation({ summary: 'Belirli bir dersin sınavlarını getirir' })
  @ApiParam({ name: 'courseId', description: 'Ders ID', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Derse ait sınavlar başarıyla getirildi',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Kimlik doğrulama hatası - yetkilendirme gerekli',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Ders bulunamadı',
  })
  async findByCourse(
    @Param('courseId') courseId: string,
  ): Promise<QuizSummary[]> {
    try {
      this.flowTracker.trackStep(
        `${courseId} ID'li derse ait sınavlar getiriliyor`,
        'QuizzesController',
      );

      const quizzes = await this.quizzesService.findAllByCourse(
        courseId,
        'dummyUserId',
      );

      this.logger.info(
        `${courseId} ID'li derse ait ${quizzes.length} adet sınav getirildi`,
        'QuizzesController.findByCourse',
        __filename,
        96,
        { courseId, quizzesCount: quizzes.length },
      );

      return quizzes.map((quiz: Quiz) => quiz as unknown as QuizSummary);
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.warn(
          `${courseId} ID'li ders bulunamadı`,
          'QuizzesController.findByCourse',
          __filename,
          105,
          { courseId },
        );
        throw error;
      }

      this.logger.logError(error, 'QuizzesController.findByCourse', {
        courseId,
        additionalInfo: 'Derse ait sınavlar getirilirken bir hata oluştu',
      });

      throw new InternalServerErrorException(
        'Derse ait sınavlar getirilirken bir hata oluştu',
        { cause: error },
      );
    }
  }

  @Get('failed-questions')
  @LogMethod({ trackParams: true })
  @ApiOperation({ summary: 'Kullanıcının başarısız olduğu soruları getirir' })
  @ApiQuery({
    name: 'courseId',
    description: 'Ders ID (opsiyonel)',
    required: false,
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Başarısız sorular başarıyla getirildi',
  })
  async findFailedQuestions(
    @Query('courseId') courseId?: string,
  ): Promise<unknown[]> {
    try {
      this.flowTracker.trackStep(
        courseId
          ? `${courseId} ID'li derse ait başarısız sorular getiriliyor`
          : 'Kullanıcının tüm başarısız soruları getiriliyor',
        'QuizzesController',
      );

      const failedQuestions = await this.quizzesService.getFailedQuestions(
        'dummyUserId',
        courseId,
      );

      this.logger.info(
        `${failedQuestions.length} adet başarısız soru getirildi`,
        'QuizzesController.findFailedQuestions',
        __filename,
        148,
        { courseId, questionsCount: failedQuestions.length },
      );

      return failedQuestions;
    } catch (error) {
      this.logger.logError(error, 'QuizzesController.findFailedQuestions', {
        courseId,
        additionalInfo: 'Başarısız sorular getirilirken bir hata oluştu',
      });

      throw new InternalServerErrorException(
        'Başarısız sorular getirilirken bir hata oluştu',
        { cause: error },
      );
    }
  }

  // @Get(':id')
  // @ApiOperation({ summary: 'Belirli bir sınavı getirir' })
  // @ApiParam({ name: 'id', description: 'Sınav ID', type: String })
  // @ApiResponse({
  //   status: HttpStatus.OK,
  //   description: 'Sınav başarıyla getirildi',
  // })
  // @ApiResponse({
  //   status: HttpStatus.NOT_FOUND,
  //   description: 'Sınav bulunamadı',
  // })
  // async findOne(
  //   @Param('id', ParseUUIDPipe) id: string,
  // ): Promise<any> {
  //   try {
  //     const quiz = await this.quizzesService.findOne(id);
  //     return quiz;
  //   } catch (error) {
  //     if (error instanceof NotFoundException) {
  //       throw error;
  //     }
  //     throw new InternalServerErrorException(
  //       'Sınav getirilirken bir hata oluştu',
  //       { cause: error },
  //     );
  //   }
  // }

  // @Get(':id/analysis')
  // @ApiOperation({ summary: 'Sınav analiz sonuçlarını getirir' })
  // @ApiParam({ name: 'id', description: 'Sınav ID', type: String })
  // @ApiResponse({
  //   status: HttpStatus.OK,
  //   description: 'Sınav analizi başarıyla getirildi',
  // })
  // @ApiResponse({
  //   status: HttpStatus.NOT_FOUND,
  //   description: 'Sınav bulunamadı',
  // })
  // async getAnalysis(
  //   @Param('id', ParseUUIDPipe) id: string,
  // ): Promise<any> {
  //   try {
  //     const analysis = await this.quizzesService.getAnalysis(id);
  //     return analysis;
  //   } catch (error) {
  //     if (error instanceof NotFoundException) {
  //       throw error;
  //     }
  //     throw new InternalServerErrorException(
  //       'Sınav analizi getirilirken bir hata oluştu',
  //       { cause: error },
  //     );
  //   }
  // }

  // @Post('generate')
  // @HttpCode(HttpStatus.CREATED)
  // @ApiOperation({ summary: 'Yeni bir sınav oluşturur' })
  // @ApiBody({ type: GenerateQuizDto })
  // @ApiResponse({
  //   status: HttpStatus.CREATED,
  //   description: 'Sınav başarıyla oluşturuldu',
  // })
  // @ApiResponse({
  //   status: HttpStatus.BAD_REQUEST,
  //   description: 'Geçersiz istek - sınav oluşturulamadı',
  // })
  // async generate(
  //   @Body(new ValidationPipe({ transform: true, whitelist: true }))
  //   generateQuizDto: GenerateQuizDto,
  // ): Promise<any> {
  //   try {
  //     const quiz = await this.quizzesService.generate(generateQuizDto);
  //     return quiz;
  //   } catch (error) {
  //     if (error instanceof BadRequestException) {
  //       throw error;
  //     }
  //     throw new InternalServerErrorException(
  //       'Sınav oluşturulurken bir hata oluştu',
  //       { cause: error },
  //     );
  //   }
  // }

  // @Post('submit')
  // @HttpCode(HttpStatus.OK)
  // @ApiOperation({ summary: 'Sınav yanıtlarını gönderir ve değerlendirir' })
  // @ApiBody({ type: SubmitQuizDto })
  // @ApiResponse({
  //   status: HttpStatus.OK,
  //   description: 'Sınav başarıyla değerlendirildi',
  // })
  // @ApiResponse({
  //   status: HttpStatus.BAD_REQUEST,
  //   description: 'Geçersiz istek - sınav değerlendirilemedi',
  // })
  // async submit(
  //   @Body(new ValidationPipe({ transform: true, whitelist: true }))
  //   submitQuizDto: SubmitQuizDto,
  // ): Promise<any> {
  //   try {
  //     const quiz = await this.quizzesService.submit(submitQuizDto);
  //     return quiz;
  //   } catch (error) {
  //     if (error instanceof BadRequestException) {
  //       throw error;
  //     }
  //     throw new InternalServerErrorException(
  //       'Sınav değerlendirilirken bir hata oluştu',
  //       { cause: error },
  //     );
  //   }
  // }

  // @Delete(':id')
  // @HttpCode(HttpStatus.NO_CONTENT)
  // @ApiOperation({ summary: 'Belirli bir sınavı siler' })
  // @ApiParam({ name: 'id', description: 'Sınav ID', type: String })
  // @ApiResponse({
  //   status: HttpStatus.NO_CONTENT,
  //   description: 'Sınav başarıyla silindi',
  // })
  // @ApiResponse({
  //   status: HttpStatus.NOT_FOUND,
  //   description: 'Sınav bulunamadı',
  // })
  // async remove(
  //   @Param('id', ParseUUIDPipe) id: string,
  // ): Promise<void> {
  //   try {
  //     await this.quizzesService.remove(id);
  //   } catch (error) {
  //     if (error instanceof NotFoundException) {
  //       throw error;
  //     }
  //     throw new InternalServerErrorException(
  //       'Sınav silinirken bir hata oluştu',
  //       { cause: error },
  //     );
  //   }
  // }
}
