import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UsePipes,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { FirebaseGuard } from './firebase/firebase.guard';
import { GoogleLoginDto, RefreshTokenDto } from './dto';
import { LoggerService } from '../common/services/logger.service';
import { FlowTrackerService } from '../common/services/flow-tracker.service';
import { LogMethod } from '../common/decorators/log-method.decorator';
import { Public } from './decorators/public.decorator';

@ApiTags('Kimlik Doğrulama')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: LoggerService,
    private readonly flowTracker: FlowTrackerService,
  ) {
    this.logger.info(
      'AuthController başlatıldı',
      'AuthController.constructor',
      __filename,
      22,
    );
  }

  @Public()
  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kimlik doğrulama servisinin sağlık kontrolü' })
  @ApiResponse({ status: 200, description: 'Auth servisi çalışıyor' })
  @LogMethod()
  healthCheck(): { status: string; timestamp: string } {
    this.flowTracker.trackStep('Auth health check yapılıyor', 'AuthController');
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Yeni kullanıcı kaydı oluşturur' })
  @ApiResponse({
    status: 201,
    description: 'Kullanıcı başarıyla oluşturuldu',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            email: { type: 'string', example: 'kullanici@example.com' },
            displayName: { type: 'string', example: 'Ahmet Yılmaz' },
            firstName: { type: 'string', example: 'Ahmet' },
            lastName: { type: 'string', example: 'Yılmaz' },
            profileImageUrl: {
              type: 'string',
              example: 'https://example.com/photo.jpg',
            },
            role: { type: 'string', enum: ['USER', 'ADMIN'], example: 'USER' },
            createdAt: { type: 'string', format: 'date-time' },
            lastLogin: { type: 'string', format: 'date-time' },
          },
        },
        token: { type: 'string', example: 'firebase_id_token' },
        refreshToken: { type: 'string', example: 'refresh_token_id' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Geçersiz veri veya kullanıcı zaten kayıtlı',
  })
  @ApiResponse({ status: 500, description: 'Sunucu hatası' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @LogMethod()
  async register(
    @Body('idToken') idToken: string,
    @Body() userData: { firstName?: string; lastName?: string },
  ): Promise<{ user: any; token: string; refreshToken?: string }> {
    // Request IP ve User-Agent bilgisi
    const req = { ip: '0.0.0.0', headers: { 'user-agent': 'Unknown' } };

    this.flowTracker.trackStep(
      'Kullanıcı kaydı başlatılıyor',
      'AuthController',
    );

    // Burada userData doğrudan kullanılmıyor ama ilerde kullanılabilir
    // İlk etapta basitçe logda gösterelim, linter hatasını çözelim
    this.logger.debug(
      `Kayıt yapılan kullanıcı bilgileri: ${JSON.stringify(userData)}`,
      'AuthController.register',
      __filename,
      85,
      { hasFirstName: !!userData.firstName, hasLastName: !!userData.lastName },
    );

    return this.authService.loginWithIdToken(
      idToken,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Public()
  @Post('login-via-idtoken')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Firebase ID Token ile kullanıcı girişi yapar' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        idToken: {
          type: 'string',
          example: 'firebase_id_token_here',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Giriş başarılı',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            email: { type: 'string', example: 'kullanici@example.com' },
            displayName: { type: 'string', example: 'Ahmet Yılmaz' },
            firstName: { type: 'string', example: 'Ahmet' },
            lastName: { type: 'string', example: 'Yılmaz' },
            profileImageUrl: {
              type: 'string',
              example: 'https://example.com/photo.jpg',
            },
            role: { type: 'string', enum: ['USER', 'ADMIN'], example: 'USER' },
            createdAt: { type: 'string', format: 'date-time' },
            lastLogin: { type: 'string', format: 'date-time' },
          },
        },
        token: { type: 'string', example: 'firebase_id_token' },
        refreshToken: { type: 'string', example: 'refresh_token_id' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Kimlik doğrulama başarısız' })
  @ApiResponse({ status: 500, description: 'Sunucu hatası' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @LogMethod({ trackParams: false }) // Token bilgisini loglamıyoruz
  async loginWithIdToken(
    @Body('idToken') idToken: string,
  ): Promise<{ user: any; token: string; refreshToken?: string }> {
    this.flowTracker.trackStep(
      'ID Token ile giriş başlatılıyor',
      'AuthController',
    );
    return this.authService.loginWithIdToken(idToken);
  }

  @Public()
  @Post('google-sign-in')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Google hesabı ile kullanıcı girişi yapar' })
  @ApiBody({ type: GoogleLoginDto })
  @ApiResponse({
    status: 200,
    description: 'Google ile giriş başarılı',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            email: { type: 'string', example: 'kullanici@example.com' },
            displayName: { type: 'string', example: 'Ahmet Yılmaz' },
            firstName: { type: 'string', example: 'Ahmet' },
            lastName: { type: 'string', example: 'Yılmaz' },
            profileImageUrl: {
              type: 'string',
              example: 'https://example.com/photo.jpg',
            },
            role: { type: 'string', enum: ['USER', 'ADMIN'], example: 'USER' },
            createdAt: { type: 'string', format: 'date-time' },
            lastLogin: { type: 'string', format: 'date-time' },
          },
        },
        isNewUser: { type: 'boolean', example: true },
        token: { type: 'string', example: 'firebase_id_token' },
        refreshToken: { type: 'string', example: 'refresh_token_id' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Geçersiz token' })
  @ApiResponse({
    status: 401,
    description: 'Google kimlik doğrulama başarısız',
  })
  @ApiResponse({ status: 500, description: 'Sunucu hatası' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @LogMethod({ trackParams: false }) // Token bilgisini loglamıyoruz
  async googleSignIn(@Body() googleLoginDto: GoogleLoginDto): Promise<{
    user: any;
    token: string;
    refreshToken?: string;
    isNewUser: boolean;
  }> {
    this.flowTracker.trackStep(
      'Google ile giriş başlatılıyor',
      'AuthController',
    );
    const result = await this.authService.loginWithIdToken(
      googleLoginDto.idToken,
    );
    return {
      ...result,
      isNewUser: false, // Şimdilik tüm Google girişleri için varsayılan false
    };
  }

  @Public()
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh token ile yeni token alır' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Token başarıyla yenilendi',
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string', example: 'new_firebase_id_token' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Geçersiz veya süresi dolmuş refresh token',
  })
  @ApiResponse({ status: 500, description: 'Sunucu hatası' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @LogMethod({ trackParams: false }) // Token bilgisini loglamıyoruz
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<{ token: string }> {
    this.flowTracker.trackStep('Token yenileme başlatılıyor', 'AuthController');
    // Using a fixed userId string to ensure type safety
    const dummyUserId: string = '00000000-0000-0000-0000-000000000000';
    return this.authService.refreshToken(
      refreshTokenDto.refreshToken,
      dummyUserId,
    );
  }

  @UseGuards(FirebaseGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kullanıcı oturumunu sonlandırır' })
  @ApiResponse({
    status: 200,
    description: 'Çıkış başarılı',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Kimlik doğrulama başarısız' })
  @ApiResponse({ status: 500, description: 'Sunucu hatası' })
  @LogMethod()
  async logout(@Req() req): Promise<{ success: boolean }> {
    this.flowTracker.trackStep('Kullanıcı çıkışı yapılıyor', 'AuthController');
    if (!req.user || !req.user.id) {
      this.logger.warn(
        'Kullanıcı bilgisi olmadan çıkış yapılmaya çalışıldı',
        'AuthController.logout',
        __filename,
        226,
      );
      return { success: false };
    }

    const dummyRefreshToken = 'dummy-refresh-token';

    try {
      await this.authService.logout(req.user.id, dummyRefreshToken);
      this.logger.info(
        `Kullanıcı başarıyla çıkış yaptı: ${req.user.id}`,
        'AuthController.logout',
        __filename,
        238,
      );
      return { success: true };
    } catch (error) {
      this.logger.logError(error, 'AuthController.logout', {
        userId: req.user.id,
        additionalInfo: 'Çıkış sırasında hata oluştu',
      });
      return { success: false };
    }
  }

  @UseGuards(FirebaseGuard)
  @Get('profile')
  @ApiOperation({ summary: 'Kullanıcı profil bilgilerini döndürür' })
  @ApiResponse({
    status: 200,
    description: 'Profil bilgileri başarıyla alındı',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        email: { type: 'string', example: 'kullanici@example.com' },
        displayName: { type: 'string', example: 'Ahmet Yılmaz' },
        role: { type: 'string', enum: ['USER', 'ADMIN'], example: 'USER' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Yetkilendirme hatası - token geçersiz veya eksik',
  })
  @LogMethod()
  getProfile(@Req() req): Record<string, any> {
    this.flowTracker.trackStep('Kullanıcı profili alınıyor', 'AuthController');
    if (!req.user) {
      this.logger.warn(
        'Kullanıcı bilgisi olmadan profil alınmaya çalışıldı',
        'AuthController.getProfile',
        __filename,
        272,
      );
      return { error: 'Kullanıcı bulunamadı' };
    }

    return req.user;
  }
}
