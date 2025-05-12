import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
  Param,
  Req,
  ForbiddenException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { RequestWithUser } from '../types/request.type';
import { FirebaseGuard } from '../auth/firebase/firebase.guard';
import { FirebaseService } from '../firebase/firebase.service';
import { ThemeType } from '../types/theme.type';
import { Course } from '../types/course.type';
import * as admin from 'firebase-admin';
import { LoggerService } from '../common/services/logger.service';
import { FlowTrackerService } from '../common/services/flow-tracker.service';
import { LogMethod } from '../common/decorators/log-method.decorator';

@ApiTags('Kullanıcılar')
@Controller('users')
export class UsersController {
  private readonly quizzesCollection = 'quizzes';
  private readonly coursesCollection = 'courses';
  private readonly logger: LoggerService;
  private readonly flowTracker: FlowTrackerService;

  constructor(
    private readonly usersService: UsersService,
    private readonly firebaseService: FirebaseService,
  ) {
    this.logger = LoggerService.getInstance();
    this.flowTracker = FlowTrackerService.getInstance();
    this.logger.debug(
      'UsersController başlatıldı',
      'UsersController.constructor',
      __filename,
      35,
    );
  }

  /**
   * Kullanıcı profilini getirir (PRD 4.1.2)
   */
  @Get('profile')
  @UseGuards(FirebaseGuard)
  @ApiBearerAuth('Firebase JWT')
  @ApiOperation({ summary: 'Kullanıcı profilini getirir' })
  @ApiResponse({
    status: 200,
    description: 'Kullanıcı profili başarıyla getirildi',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        firebaseUid: { type: 'string', example: 'firebase_uid_example' },
        email: { type: 'string', example: 'kullanici@example.com' },
        firstName: { type: 'string', example: 'Ahmet' },
        lastName: { type: 'string', example: 'Yılmaz' },
        profileImageUrl: {
          type: 'string',
          example: 'https://example.com/profile.jpg',
        },
        onboarded: { type: 'boolean', example: true },
        role: { type: 'string', enum: ['USER', 'ADMIN'], example: 'USER' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Yetkisiz erişim' })
  @ApiResponse({ status: 404, description: 'Kullanıcı bulunamadı' })
  @LogMethod()
  async getProfile(@Request() req: RequestWithUser) {
    this.flowTracker.trackStep('Kullanıcı profili alınıyor', 'UsersController');

    if (!req.user || !req.user.uid) {
      this.logger.warn(
        'Kullanıcı bilgisi olmadan profil alınmaya çalışıldı',
        'UsersController.getProfile',
        __filename,
        77,
      );
      throw new UnauthorizedException('Yetkilendirme bilgisi eksik');
    }

    try {
      this.flowTracker.trackStep(
        'UsersService.getUserProfile çağrılıyor',
        'UsersController',
      );
      // Kullanıcı profilini getirmeyi dene
      return await this.usersService.getUserProfile(req.user.uid);
    } catch (error) {
      // Kullanıcı bulunamadı hatası durumunda
      if (error.status === 404) {
        this.logger.info(
          `Kullanıcı (${req.user.uid}) bulunamadı, Firebase'den bilgi alınıyor`,
          'UsersController.getProfile',
          __filename,
          91,
        );
        this.flowTracker.trackStep(
          'Firebase kullanıcı bilgisi alınıyor',
          'UsersController',
        );

        // Firebase'den kullanıcı bilgilerini al
        const firebaseUser = await this.firebaseService.auth.getUser(
          req.user.uid,
        );

        // Email kontrol et
        if (!firebaseUser.email) {
          this.logger.warn(
            `Kullanıcı (${req.user.uid}) email bilgisi eksik`,
            'UsersController.getProfile',
            __filename,
            103,
          );
          throw new BadRequestException('Kullanıcı email bilgisi eksik');
        }

        this.flowTracker.trackStep(
          'Yeni kullanıcı oluşturuluyor',
          'UsersController',
        );
        // Kullanıcıyı oluştur
        return await this.usersService.findOrCreateUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });
      }

      // Diğer hataları logla ve yeniden fırlat
      this.logger.logError(error, 'UsersController.getProfile', {
        userId: req.user.uid,
        additionalInfo: 'Profil bilgisi alınırken hata oluştu',
      });
      throw error;
    }
  }

  /**
   * Kullanıcı profilini günceller (PRD 4.1.2)
   */
  @Put('profile')
  @UseGuards(FirebaseGuard)
  @ApiBearerAuth('Firebase JWT')
  @ApiOperation({ summary: 'Kullanıcı profilini günceller' })
  @ApiResponse({
    status: 200,
    description: 'Kullanıcı profili başarıyla güncellendi',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        firebaseUid: { type: 'string', example: 'firebase_uid_example' },
        email: { type: 'string', example: 'kullanici@example.com' },
        firstName: { type: 'string', example: 'Ahmet' },
        lastName: { type: 'string', example: 'Yılmaz' },
        profileImageUrl: {
          type: 'string',
          example: 'https://example.com/profile.jpg',
        },
        onboarded: { type: 'boolean', example: true },
        role: { type: 'string', enum: ['USER', 'ADMIN'], example: 'USER' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Geçersiz veri' })
  @ApiResponse({ status: 401, description: 'Yetkisiz erişim' })
  @ApiResponse({ status: 404, description: 'Kullanıcı bulunamadı' })
  @LogMethod()
  async updateProfile(
    @Request() req: RequestWithUser,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    this.flowTracker.trackStep(
      'Kullanıcı profili güncelleniyor',
      'UsersController',
    );

    if (!req.user || !req.user.uid) {
      this.logger.warn(
        'Kullanıcı bilgisi olmadan profil güncellenmeye çalışıldı',
        'UsersController.updateProfile',
        __filename,
        169,
      );
      throw new UnauthorizedException('Yetkilendirme bilgisi eksik');
    }

    const userDataToUpdate = {
      firstName: updateUserDto.firstName,
      lastName: updateUserDto.lastName,
      profileImageUrl: updateUserDto.profileImageUrl,
      onboarded: updateUserDto.onboarded,
    };

    this.logger.debug(
      `Kullanıcı (${req.user.uid}) profil bilgileri güncelleniyor`,
      'UsersController.updateProfile',
      __filename,
      184,
      { updateData: JSON.stringify(userDataToUpdate) },
    );

    try {
      return await this.usersService.updateProfile(
        req.user.uid,
        userDataToUpdate,
      );
    } catch (error) {
      this.logger.logError(error, 'UsersController.updateProfile', {
        userId: req.user.uid,
        updateData: userDataToUpdate,
        additionalInfo: 'Profil güncellenirken hata oluştu',
      });
      throw error;
    }
  }

  /**
   * Kullanıcının tema ayarını getirir (PRD 4.1.2)
   */
  @Get('settings/theme')
  @UseGuards(FirebaseGuard)
  @ApiBearerAuth('Firebase JWT')
  @ApiOperation({ summary: 'Kullanıcının tema ayarını getirir' })
  @ApiResponse({
    status: 200,
    description: 'Tema ayarı başarıyla getirildi',
    schema: {
      type: 'string',
      enum: ['light', 'dark', 'system'],
      example: 'dark',
    },
  })
  @ApiResponse({ status: 401, description: 'Yetkisiz erişim' })
  @ApiResponse({ status: 404, description: 'Kullanıcı bulunamadı' })
  @LogMethod()
  async getTheme(@Request() req: RequestWithUser) {
    this.flowTracker.trackStep(
      'Kullanıcı tema ayarı alınıyor',
      'UsersController',
    );

    if (!req.user || !req.user.uid) {
      this.logger.warn(
        'Kullanıcı bilgisi olmadan tema ayarı alınmaya çalışıldı',
        'UsersController.getTheme',
        __filename,
        221,
      );
      throw new UnauthorizedException('Yetkilendirme bilgisi eksik');
    }

    try {
      return await this.usersService.getTheme(req.user.uid);
    } catch (error) {
      this.logger.logError(error, 'UsersController.getTheme', {
        userId: req.user.uid,
        additionalInfo: 'Tema ayarı alınırken hata oluştu',
      });
      throw error;
    }
  }

  /**
   * Kullanıcının tema ayarını günceller (PRD 4.1.2)
   */
  @Put('settings/theme/:theme')
  @UseGuards(FirebaseGuard)
  @ApiBearerAuth('Firebase JWT')
  @ApiOperation({ summary: 'Kullanıcının tema ayarını günceller' })
  @ApiParam({
    name: 'theme',
    enum: ['light', 'dark', 'system'],
    description: 'Tema değeri',
  })
  @ApiResponse({
    status: 200,
    description: 'Tema ayarı başarıyla güncellendi',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        theme: { type: 'string', enum: ['light', 'dark', 'system'] },
      },
    },
  })
  @LogMethod()
  async updateTheme(
    @Request() req: RequestWithUser,
    @Param('theme') theme: ThemeType,
  ) {
    this.flowTracker.trackStep(
      'Kullanıcı tema ayarı güncelleniyor',
      'UsersController',
    );

    if (!req.user || !req.user.uid) {
      this.logger.warn(
        'Kullanıcı bilgisi olmadan tema ayarı güncellenmeye çalışıldı',
        'UsersController.updateTheme',
        __filename,
        269,
      );
      throw new UnauthorizedException('Yetkilendirme bilgisi eksik');
    }

    if (!['light', 'dark', 'system'].includes(theme)) {
      this.logger.warn(
        `Geçersiz tema değeri: ${theme}`,
        'UsersController.updateTheme',
        __filename,
        278,
      );
      throw new BadRequestException(
        `Geçersiz tema: ${theme}. Geçerli değerler: light, dark, system`,
      );
    }

    try {
      return await this.usersService.updateTheme(req.user.uid, theme);
    } catch (error) {
      this.logger.logError(error, 'UsersController.updateTheme', {
        userId: req.user.uid,
        theme,
        additionalInfo: 'Tema ayarı güncellenirken hata oluştu',
      });
      throw error;
    }
  }

  /**
   * Kullanıcının belirli bir ayarını günceller (PRD 4.1.2)
   */
  @Put('settings/:key/:value')
  @UseGuards(FirebaseGuard)
  @ApiBearerAuth('Firebase JWT')
  @ApiOperation({ summary: 'Kullanıcının belirli bir ayarını günceller' })
  @ApiParam({
    name: 'key',
    description: 'Ayar anahtarı',
    example: 'language',
  })
  @ApiParam({
    name: 'value',
    description: 'Ayar değeri',
    example: 'tr',
  })
  @ApiResponse({
    status: 200,
    description: 'Ayar başarıyla güncellendi',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        firebaseUid: { type: 'string', example: 'firebase_uid_example' },
        settings: {
          type: 'object',
          example: { language: 'tr' },
          additionalProperties: true,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Yetkisiz erişim' })
  @ApiResponse({ status: 404, description: 'Kullanıcı bulunamadı' })
  async updateSetting(
    @Request() req: RequestWithUser,
    @Param('key') key: string,
    @Param('value') value: string,
  ) {
    if (!req.user || !req.user.uid) {
      throw new UnauthorizedException('Yetkilendirme bilgisi eksik');
    }

    return this.usersService.updateSetting(req.user.uid, key, value);
  }

  @UseGuards(FirebaseGuard)
  @Get('quizzes')
  async getUserQuizzes(@Req() req) {
    if (!req.user || !req.user.uid) {
      throw new UnauthorizedException('Yetkilendirme bilgisi eksik');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const user = await this.usersService.findByUid(req.user.uid);
    if (!user) return [];

    return this.firebaseService.findMany(
      this.quizzesCollection,
      [
        {
          field: 'userId',
          operator: '==' as admin.firestore.WhereFilterOp,
          value: user.id,
        },
      ],
      { field: 'timestamp', direction: 'desc' },
    );
  }

  @UseGuards(FirebaseGuard)
  @Get('courses/:id')
  async getCourse(@Req() req, @Param('id') id: string) {
    if (!req.user || !req.user.uid) {
      throw new UnauthorizedException('Yetkilendirme bilgisi eksik');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const user = await this.usersService.findByUid(req.user.uid);
    if (!user) {
      throw new UnauthorizedException(
        'Kullanıcı bulunamadı veya yetkisiz erişim.',
      );
    }

    const course = await this.firebaseService.findById<Course>(
      this.coursesCollection,
      id,
    );

    if (!course || course.userId !== user.id) {
      throw new ForbiddenException();
    }

    return course;
  }
}
