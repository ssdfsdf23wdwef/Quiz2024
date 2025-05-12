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
import { Public } from './decorators/public.decorator';
import { RequestWithUser } from '../types/request.type';
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
  @ApiResponse({ status: 201, description: 'Kullanıcı başarıyla oluşturuldu' })
  @ApiResponse({ status: 400, description: 'Geçersiz istek verisi' })
  @LogMethod()
  async register(
    @Body() registerDto: RegisterDto,
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
    @Ip() ipAddress: string,
  ) {
    this.flowTracker.trackStep(
      `${registerDto.email} için kayıt işlemi başlatıldı`,
      'AuthController',
    );

    this.logger.debug(
      `Kayıt yapılan kullanıcı bilgileri: ${JSON.stringify({
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
      })}`,
      'AuthController.register',
      __filename,
      93,
    );

    this.logger.debug(
      'Kayıt işlemi başlatılıyor',
      'AuthController.register',
      __filename,
      95,
      {
        hasFirstName: !!registerDto.firstName,
        hasLastName: !!registerDto.lastName,
      },
    );

    try {
      const { user } = await this.authService.loginWithIdToken(
        registerDto.idToken,
        ipAddress,
        req.headers['user-agent'],
        res,
        {
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
        },
      );

      this.logger.info(
        `Yeni kullanıcı kaydedildi ve giriş yaptı: ${user.email} (ID: ${user.id})`,
        'AuthController.register',
        __filename,
      );
      return {
        message: 'Kullanıcı başarıyla kaydedildi',
        email: user.email,
        id: user.id,
      };
    } catch (error) {
      this.logger.logError(error, 'AuthController.register', __filename, '130');
      this.logger.error(
        `Kayıt işlemi hatası: ${error.message}`,
        'AuthController.register',
        __filename,
        124,
        error,
      );
      throw error;
    }
  }

  @Public()
  @Post('login-via-idtoken')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Firebase ID Token ile giriş' })
  @ApiBody({ schema: { properties: { idToken: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Giriş başarılı' })
  @ApiResponse({ status: 401, description: 'Geçersiz token' })
  @LogMethod({ trackParams: false })
  async loginWithIdToken(
    @Body('idToken') idToken: string,
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
    @Ip() ipAddress: string,
  ) {
    this.flowTracker.trackStep(
      'ID Token ile giriş başlatılıyor',
      'AuthController',
    );
    try {
      const { user } = await this.authService.loginWithIdToken(
        idToken,
        ipAddress,
        req.headers['user-agent'],
        res,
        undefined,
      );
      this.logger.info(
        `Kullanıcı giriş yaptı: ${user.email} (ID: ${user.id})`,
        'AuthController.loginWithIdToken',
        __filename,
        '174',
      );
      return { user };
    } catch (error) {
      this.logger.logError(
        error,
        'AuthController.loginWithIdToken',
        __filename,
        '174',
      );
      this.logger.error(
        `ID Token ile giriş hatası: ${error.message}`,
        'AuthController.loginWithIdToken',
        __filename,
        '174',
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
      req.headers['user-agent'],
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
  @ApiOperation({ summary: 'Access token yenileme' })
  @ApiCookieAuth('refresh_token')
  @ApiResponse({ status: 200, description: 'Token yenilendi' })
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
          __filename,
          250,
        );
        throw new UnauthorizedException('Refresh token bulunamadı');
      }

      // Token yenileme
      const { accessToken, newRefreshToken } =
        await this.authService.refreshToken(refreshTokenFromCookie);

      // Cookie'lere yeni token'ları kaydet
      this.setAuthCookies(res, accessToken, newRefreshToken);

      return { success: true, accessToken };
    } catch (error) {
      this.logger.logError(
        error,
        'AuthController.refreshToken',
        __filename,
        '265',
      );
      if (error instanceof UnauthorizedException) {
        // Kimlik doğrulama hatası durumunda cookie'leri temizle
        this.clearAuthCookies(res);
        throw error;
      }
      throw new UnauthorizedException('Token yenileme başarısız oldu');
    }
  }

  @Post('logout')
  @UseGuards(FirebaseGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kullanıcı çıkışı' })
  @ApiBearerAuth('Firebase JWT')
  @ApiResponse({ status: 200, description: 'Çıkış başarılı' })
  @ApiResponse({ status: 401, description: 'Yetkisiz' })
  @LogMethod()
  async logout(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.flowTracker.trackStep('Çıkış işlemi başlatılıyor', 'AuthController');
    const userId = req.user?.uid;
    const refreshTokenFromCookie = req.cookies?.refresh_token;

    this.logger.debug(
      `Logout isteği: Kullanıcı ID: ${userId || 'Yok'}, Refresh Token Var mı: ${!!refreshTokenFromCookie}`,
      'AuthController.logout',
      __filename,
      300,
    );

    try {
      if (!userId || !refreshTokenFromCookie) {
        this.logger.warn(
          'Çıkış yapılırken kullanıcı/token bilgisi bulunamadı',
          'AuthController.logout',
          __filename,
          308,
        );
        throw new UnauthorizedException('Çıkış için oturum gereklidir');
      }

      // Cookie'leri temizle
      this.clearAuthCookies(res);

      // Çıkış işlemini yap
      const result = await this.authService.logout(
        userId,
        refreshTokenFromCookie,
      );

      if (!result.success) {
        this.logger.warn(
          'Çıkış işlemi tamamlandı ama backend token silme başarısız olabilir',
          'AuthController.logout',
          __filename,
          324,
        );
      }

      return { message: 'Başarıyla çıkış yapıldı' };
    } catch (error) {
      this.logger.logError(error, 'AuthController.logout', __filename, '333');
      throw error;
    }
  }

  @Get('profile')
  @UseGuards(FirebaseGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kullanıcı profil bilgilerini getir' })
  @ApiBearerAuth('Firebase JWT')
  @ApiResponse({ status: 200, description: 'Profil bilgileri' })
  @ApiResponse({ status: 401, description: 'Yetkisiz' })
  @ApiResponse({ status: 404, description: 'Kullanıcı bulunamadı' })
  @LogMethod()
  async getProfile(@Req() req: RequestWithUser) {
    this.flowTracker.trackStep('Profil endpoint çağrıldı', 'AuthController');
    if (!req.user) {
      this.logger.error(
        'FirebaseGuard çalışmasına rağmen req.user bulunamadı!',
        'AuthController.getProfile',
        __filename,
      );
      throw new UnauthorizedException('Kullanıcı bilgisi alınamadı');
    }
    this.logger.debug(
      `Profil isteği alındı: Kullanıcı ID ${req.user.uid}`,
      'AuthController.getProfile',
      __filename,
    );
    return {
      id: req.user.uid,
      email: req.user.email,
      displayName: req.user.displayName,
    };
  }

  private setAccessTokenCookie(res: Response, token: string) {
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: this.authService.isProduction(),
      sameSite: 'lax',
      maxAge: this.authService.getAccessTokenExpiresInMs(),
      path: '/',
    });
  }

  private setRefreshTokenCookie(res: Response, token: string) {
    res.cookie('refresh_token', token, {
      httpOnly: true,
      secure: this.authService.isProduction(),
      sameSite: 'strict',
      maxAge: this.authService.getRefreshTokenExpiresInMs(),
      path: '/api/auth/refresh-token',
    });
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: this.authService.isProduction(),
      sameSite: 'lax',
      path: '/',
    });
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: this.authService.isProduction(),
      sameSite: 'strict',
      path: '/api/auth/refresh-token',
    });
    res.clearCookie('auth_session', {
      httpOnly: false,
      secure: this.authService.isProduction(),
      sameSite: 'lax',
      path: '/',
    });
    this.logger.debug(
      `Auth cookie'leri temizlendi`,
      'AuthController.clearAuthCookies',
      __filename,
    );
  }

  private setAuthCookies(
    res: Response,
    accessToken: string,
    newRefreshToken?: string,
  ) {
    this.setAccessTokenCookie(res, accessToken);
    if (newRefreshToken) {
      this.setRefreshTokenCookie(res, newRefreshToken);
    }
  }
}
