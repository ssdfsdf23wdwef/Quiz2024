import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserRefreshToken } from '../types/user-refresh-token.type';
import { v4 as uuidv4 } from 'uuid';
import * as admin from 'firebase-admin';
import { FIRESTORE_COLLECTIONS } from '../common/constants';
import { logError, logFlow } from '../common/utils/logger.utils';
import { LoggerService } from '../common/services/logger.service';
import { FlowTrackerService } from '../common/services/flow-tracker.service';
import { LogMethod } from '../common/decorators';

@Injectable()
export class AuthService {
  private readonly logger: LoggerService;
  private readonly flowTracker: FlowTrackerService;
  private readonly SALT_ROUNDS = 10;
  private readonly REFRESH_TOKEN_VALIDITY_DAYS = 7;

  constructor(
    private firebaseService: FirebaseService,
    private usersService: UsersService,
    private configService: ConfigService,
  ) {
    this.logger = LoggerService.getInstance();
    this.flowTracker = FlowTrackerService.getInstance();
    logFlow('AuthService başlatıldı', 'AuthService.constructor');
  }

  @LogMethod({ trackParams: true })
  async loginWithIdToken(
    idToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ user: any; token: string; refreshToken?: string }> {
    logFlow('ID token ile giriş yapılıyor', 'AuthService.loginWithIdToken');
    try {
      this.flowTracker.trackStep('ID token ile giriş yapılıyor', 'AuthService');
      // Verify Firebase ID token
      const decodedToken =
        await this.firebaseService.auth.verifyIdToken(idToken);

      if (!decodedToken.uid) {
        logFlow('Geçersiz kimlik: UID yok', 'AuthService.loginWithIdToken');
        throw new UnauthorizedException('Geçersiz kimlik');
      }

      // Get user info from Firebase
      logFlow(
        `Firebase kullanıcısı alınıyor: ${decodedToken.uid}`,
        'AuthService.loginWithIdToken',
      );
      const firebaseUser = await this.firebaseService.auth.getUser(
        decodedToken.uid,
      );

      if (!firebaseUser.email) {
        logError(
          new Error(`Firebase user has no email: ${firebaseUser.uid}`),
          'AuthService.loginWithIdToken',
          __filename,
        );
        throw new BadRequestException(
          'Kullanıcı email bilgisi eksik. Firebase hesabınızda email adresinizi doğrulayın.',
        );
      }

      // Backend kullanıcı tablosunda da kullanıcıyı bul veya oluştur
      logFlow(
        `Kullanıcı bulunuyor veya oluşturuluyor: ${firebaseUser.email}`,
        'AuthService.loginWithIdToken',
      );
      const user = await this.usersService.findOrCreateUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
      });

      // Her başarılı girişte son giriş tarihini güncelle
      logFlow(
        `Son giriş tarihi güncelleniyor: ${user.id}`,
        'AuthService.loginWithIdToken',
      );
      await this.usersService.updateLastLogin(user.id);

      // Kullanıcı bilgilerini veritabanından al
      const userData = {
        id: user.id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        profileImageUrl: user.profileImageUrl || null,
        role: user.role,
        onboarded: user.onboarded,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        settings: user.settings || {},
      };

      // Refresh token oluştur
      logFlow('Refresh token oluşturuluyor', 'AuthService.loginWithIdToken');
      const refreshToken = await this.createRefreshToken(
        user.id,
        ipAddress,
        userAgent,
      );

      logFlow('Giriş başarılı', 'AuthService.loginWithIdToken');
      this.logger.info(
        'Kullanıcı başarıyla giriş yaptı',
        'AuthService.loginWithIdToken',
        __filename,
        undefined,
        { userId: user.id, email: user.email },
      );
      return {
        user: userData,
        token: idToken,
        refreshToken,
      };
    } catch (error) {
      logError(error, 'AuthService.loginWithIdToken', __filename, undefined, {
        idToken: idToken ? '***' : undefined,
        ipAddress,
      });

      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Giriş işlemi sırasında bir hata oluştu',
      );
    }
  }

  /**
   * Refresh token kullanarak yeni bir access token oluşturur
   */
  async refreshToken(
    refreshToken: string,
    userId: string,
  ): Promise<{ token: string }> {
    try {
      // Refresh token'ı doğrula
      const user = await this.validateRefreshToken(userId, refreshToken);
      if (!user) {
        throw new UnauthorizedException('Geçersiz refresh token');
      }

      // Firebase'den yeni bir özel token (custom token) oluştur
      const customToken = await this.firebaseService.auth.createCustomToken(
        user.firebaseUid,
      );

      return { token: customToken };
    } catch (error) {
      this.logger.error('Token refresh failed', error);
      throw new UnauthorizedException('Token yenileme başarısız oldu');
    }
  }

  /**
   * Kullanıcı için güvenli bir refresh token oluşturur ve Firestore'da saklar
   * @param userId Kullanıcı ID'si
   * @param ipAddress İsteğin yapıldığı IP adresi (isteğe bağlı)
   * @param userAgent Kullanıcının tarayıcı/cihaz bilgisi (isteğe bağlı)
   * @returns Oluşturulan orijinal refresh token (hashlenMEmiş)
   */
  private async createRefreshToken(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<string> {
    try {
      // Benzersiz bir token oluştur
      const originalToken = uuidv4();

      // Token'ı hashle
      const hashedToken = await bcrypt.hash(originalToken, this.SALT_ROUNDS);

      // Geçerlilik tarihini hesapla
      const expiresAtDate = new Date();
      expiresAtDate.setDate(
        expiresAtDate.getDate() + this.REFRESH_TOKEN_VALIDITY_DAYS,
      );

      // UserRefreshToken nesnesi oluştur
      const refreshToken: UserRefreshToken = {
        userId,
        hashedToken,
        expiresAt: admin.firestore.Timestamp.fromDate(expiresAtDate),
        createdAt: admin.firestore.Timestamp.now(),
      };

      // İsteğe bağlı alanları sadece tanımlıysa ekle
      if (ipAddress) {
        refreshToken.ipAddress = ipAddress;
      }

      if (userAgent) {
        refreshToken.userAgent = userAgent;
      }

      // Firestore'a kaydet
      await this.firebaseService.create(
        FIRESTORE_COLLECTIONS.REFRESH_TOKENS,
        refreshToken,
      );

      // Orijinal token'ı döndür (hashlenMEmiş)
      return originalToken;
    } catch (error) {
      this.logger.error(
        `Refresh token oluşturma hatası: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Refresh token oluşturulamadı');
    }
  }

  /**
   * Refresh token'ı doğrular ve ilişkili kullanıcıyı döndürür
   * @param userId Kullanıcı ID'si
   * @param token Doğrulanacak orijinal refresh token (hashlenMEmiş)
   * @returns İlişkili kullanıcı veya hata (token geçersizse)
   */
  private async validateRefreshToken(
    userId: string,
    token: string,
  ): Promise<any> {
    try {
      // Kullanıcının tüm refresh token'larını getir
      const tokens = await this.firebaseService.findMany<UserRefreshToken>(
        FIRESTORE_COLLECTIONS.REFRESH_TOKENS,
        [
          {
            field: 'userId',
            operator: '==',
            value: userId,
          },
        ],
      );

      // Şimdi geçerli token'ı bul
      const now = admin.firestore.Timestamp.now();
      const validToken = await Promise.all(
        tokens.map(async (refreshToken) => {
          // Süresi dolmuş tokenları kontrol et
          if (refreshToken.expiresAt.toMillis() < now.toMillis()) {
            return null;
          }

          // Hash'i karşılaştır
          const isValid = await bcrypt.compare(token, refreshToken.hashedToken);
          return isValid ? refreshToken : null;
        }),
      ).then((results) => results.find((result) => result !== null));

      if (!validToken) {
        return null;
      }

      // Valid token bulundu, kullanıcı bilgilerini getir
      return this.usersService.findById(userId);
    } catch (error) {
      this.logger.error(
        `Refresh token doğrulama hatası: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  /**
   * Refresh token'ı silmek için kullanılır (logout işlemi sırasında)
   */
  async removeRefreshToken(userId: string, token: string): Promise<void> {
    try {
      // Kullanıcının tüm refresh token'larını getir
      const tokens = await this.firebaseService.findMany<UserRefreshToken>(
        FIRESTORE_COLLECTIONS.REFRESH_TOKENS,
        [
          {
            field: 'userId',
            operator: '==',
            value: userId,
          },
        ],
      );

      // Eşleşen token'ı bul
      for (const refreshToken of tokens) {
        try {
          const isValid = await bcrypt.compare(token, refreshToken.hashedToken);
          if (isValid) {
            // Bulunan token'ı sil
            await this.firebaseService.delete(
              FIRESTORE_COLLECTIONS.REFRESH_TOKENS,
              refreshToken.id,
            );
            break;
          }
        } catch (error) {
          // Hash karşılaştırma hatası, devam et
          continue;
        }
      }
    } catch (error) {
      this.logger.error(
        `Refresh token silme hatası: ${error.message}`,
        error.stack,
      );
      // Sessizce başarısız ol - kullanıcı deneyimini etkilememek için
    }
  }

  /**
   * Kullanıcı çıkış işlemi
   */
  async logout(
    userId: string,
    refreshToken: string,
  ): Promise<{ success: boolean }> {
    try {
      // Refresh token'ı sil
      await this.removeRefreshToken(userId, refreshToken);
      return { success: true };
    } catch (error) {
      this.logger.error(`Çıkış işlemi hatası: ${error.message}`, error.stack);
      return { success: false };
    }
  }

  @LogMethod({ trackParams: true })
  async validateUser(email: string, password: string): Promise<any> {
    try {
      this.flowTracker.trackStep(
        `${email} için kullanıcı doğrulaması başlatıldı`,
        'AuthService',
      );

      // Mevcut kod
      // ...

      // Örnek başarılı log
      this.logger.info(
        'Kullanıcı başarıyla doğrulandı',
        'AuthService.validateUser',
        __filename,
        undefined,
        { email },
      );

      // Mevcut return ifadesi
    } catch (error) {
      this.logger.logError(error, 'AuthService.validateUser', {
        email,
        errorContext: 'Kullanıcı doğrulama hatası',
      });
      throw error;
    }
  }

  @LogMethod({ trackParams: true })
  async register(registerDto: any) {
    try {
      this.flowTracker.trackStep(
        `${registerDto.email} için kayıt işlemi başlatıldı`,
        'AuthService',
      );

      // Mevcut kod
      // ...

      this.logger.info(
        'Yeni kullanıcı başarıyla oluşturuldu',
        'AuthService.register',
        __filename,
        undefined,
        { email: registerDto.email },
      );

      // Mevcut return ifadesi
    } catch (error) {
      this.logger.logError(error, 'AuthService.register', {
        email: registerDto.email,
      });
      throw error;
    }
  }
}
