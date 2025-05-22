import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Res,
  UnauthorizedException,
  HttpStatus,
  HttpCode,
  Logger,
  Req,
  Param,
  NotFoundException,
  Query,
  ValidationPipe,
  Ip,
  InternalServerErrorException,
} from '@nestjs/common';
import { Response, Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto, GoogleLoginDto } from './dto';
import { AuthGuard } from '@nestjs/passport';
import { Public } from '../common/decorators/decorators/public.decorator';
import { RequestWithUser } from '../common/types/request.type';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { LoggerService } from '../common/services/logger.service';
import { FlowTrackerService } from '../common/services/flow-tracker.service';
import { LogMethod } from '../common/decorators/log-method.decorator';
import { FirebaseGuard } from './firebase/firebase.guard';

@ApiTags('Kimlik Doğrulama')
@Controller('auth')
export class AuthController {
  private readonly logger: LoggerService;
  private readonly flowTracker: FlowTrackerService;

  constructor(private authService: AuthService) {
    this.logger = LoggerService.getInstance();
    this.flowTracker = FlowTrackerService.getInstance();
    this.logger.info(
      'AuthController başlatıldı',
      'AuthController.constructor',
      __filename,
      29,
    );
  }

  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Auth modülü sağlık kontrolü' })
  getHealth(): string {
    return 'Auth Service is healthy!';
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Yeni kullanıcı kaydı' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'Kayıt başarılı' })
  @ApiResponse({ status: 400, description: 'Geçersiz istek' })
  @LogMethod()
  async register(
    @Body() registerDto: RegisterDto,
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
    @Ip() ipAddress: string,
  ) {
    this.flowTracker.trackStep('Kayıt işlemi başlatılıyor', 'AuthController');
    try {
      // Kayıt işlemi için ID token kullanılıyor
      const { user } = await this.authService.loginWithIdToken(
        registerDto.idToken,
        ipAddress,
        req.headers['user-agent'] || 'unknown', // undefined olmaması için default değer
        res,
        {
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
          password: registerDto.password, // Şifreyi additionalData olarak ilet
        },
      );

      this.logger.info(
        `Kullanıcı kaydı başarılı: ${user.email} (ID: ${user.id})`,
        'AuthController.register',
        __filename,
        '84',
      );

      return {
        message: 'Kayıt başarılı',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
          role: user.role, // Rol bilgisini de döndür
          onboarded: user.onboarded,
        },
      };
    } catch (error) {
      this.logger.logError(error, 'AuthController.register', __filename, '100');
      this.logger.error(
        `Kayıt hatası: ${error.message}`,
        'AuthController.register',
        __filename,
        '102',
        error,
      );
      throw error;
    }
  }

  @Public()
  @Post('login-via-idtoken')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Firebase ID Token ile giriş' })
  @ApiBody({
    schema: {
      properties: {
        idToken: { type: 'string' },
        userData: {
          type: 'object',
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Giriş başarılı' })
  @ApiResponse({ status: 401, description: 'Geçersiz token' })
  @LogMethod({ trackParams: false })
  async loginWithIdToken(
    @Body('idToken') idToken: string,
    @Body('userData') userData: { firstName?: string; lastName?: string },
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
    @Ip() ipAddress: string,
  ) {
    this.flowTracker.trackStep(
      'ID Token ile giriş başlatılıyor',
      'AuthController',
    );

    try {
      // Mevcut aktif refresh token'ı kontrol et
      const existingRefreshToken = req.cookies?.refresh_token;
      let skipTokenCreation = false;

      if (existingRefreshToken) {
        try {
          // Eğer geçerli bir oturum varsa, yeni token oluşturma
          await this.authService.refreshToken(existingRefreshToken);

          // Token geçerliyse, yeni token oluşturmayı atla
          this.logger.info(
            `Geçerli bir refresh token zaten var. Yeni token oluşturulmayacak.`,
            'AuthController.loginWithIdToken',
            __filename,
            150,
          );
          skipTokenCreation = true;
        } catch (tokenError) {
          this.logger.debug(
            'Mevcut token geçersiz, yeni token oluşturulacak',
            'AuthController.loginWithIdToken',
            __filename,
            160,
          );
          // Bu durumda yeni token oluşturmaya devam et
        }
      }

      // Kullanıcı adı ve soyadı bilgilerini işlemek için loginWithIdToken çağrısı
      const { user } = await this.authService.loginWithIdToken(
        idToken,
        ipAddress,
        req.headers['user-agent'] || 'unknown', // undefined olmaması için default değer
        skipTokenCreation ? null : res, // Token oluşturmayı atlayacaksak null gönder
        userData, // Kullanıcı verilerini ilet
      );

      this.logger.info(
        `Kullanıcı giriş yaptı: ${user.email} (ID: ${user.id})`,
        'AuthController.loginWithIdToken',
        __filename,
        174,
      );

      return { user };
    } catch (error) {
      this.logger.logError(
        error,
        'AuthController.loginWithIdToken',
        __filename,
        174,
      );
      this.logger.error(
        `ID Token ile giriş hatası: ${error.message}`,
        'AuthController.loginWithIdToken',
        __filename,
        174,
        error,
        {
          hasToken: !!idToken,
          additionalInfo: 'ID Token ile giriş hatası',
        },
      );
      throw error;
    }
  }

  @Post('google-login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Google ile giriş yap' })
  @ApiBody({ type: GoogleLoginDto })
  @ApiResponse({ status: 200, description: 'Giriş başarılı' })
  @ApiResponse({ status: 400, description: 'Geçersiz istek' })
  @ApiResponse({ status: 401, description: 'Kimlik doğrulama başarısız' })
  async loginWithGoogle(
    @Body() loginDto: GoogleLoginDto,
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
    @Ip() ipAddress: string,
  ) {
    const { user } = await this.authService.loginWithIdToken(
      loginDto.idToken,
      ipAddress,
      req.headers['user-agent'] || 'unknown', // undefined olmaması için default değer
      res,
    );

    return {
      message: 'Google ile giriş başarılı',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        onboarded: user.onboarded,
      },
    };
  }

  @Post('refresh-token')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh token ile yeni access token al' })
  @ApiResponse({ status: 200, description: 'Token başarıyla yenilendi' })
  @ApiResponse({
    status: 401,
    description: 'Geçersiz veya süresi dolmuş refresh token',
  })
  @LogMethod()
  async refreshToken(
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.logger.debug(
      `Refresh token isteği alındı.`,
      'AuthController.refreshToken',
      __filename,
      240,
    );

    try {
      // Cookie'den refresh token alma
      const refreshTokenFromCookie = req.cookies?.refresh_token;

      if (!refreshTokenFromCookie) {
        this.logger.warn(
          'Refresh token cookie bulunamadı',
          'AuthController.refreshToken',
     