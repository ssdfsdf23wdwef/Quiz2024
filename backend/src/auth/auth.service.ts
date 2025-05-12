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
  private readonly ACCESS_TOKEN_EXPIRES_IN_MS = 15 * 60 * 1000; // 15 dakika
  private readonly REFRESH_TOKEN_EXPIRES_IN_MS = 7 * 24 * 60 * 60 * 1000; // 7 gün

  constructor(
    private firebaseService: FirebaseService,
    private usersService: UsersService,
    private configService: ConfigService,
  ) {
    this.logger = LoggerService.getInstance();
    this.flowTracker = FlowTrackerService.getInstance();
    logFlow('AuthService başlatıldı', 'AuthService.constructor');
  }

  /**
   * Sistem production modunda mı çalışıyor
   * @returns {boolean} Production modunda ise true
   */
  isProduction(): boolean {
    return this.configService.get<string>('NODE_ENV') === 'production';
  }

  /**
   * Access token'ın geçerlilik süresini milisaniye cinsinden döndürür
   * @returns {number} Access token'ın geçerlilik süresi (ms)
   */
  getAccessTokenExpiresInMs(): number {
    return this.ACCESS_TOKEN_EXPIRES_IN_MS;
  }

  /**
   * Refresh token'ın geçerlilik süresini milisaniye cinsinden döndürür
   * @returns {number} Refresh token'ın geçerlilik süresi (ms)
   */
  getRefreshTokenExpiresInMs(): number {
    return this.REFRESH_TOKEN_EXPIRES_IN_MS;
  }

  /**
   * Google ID token ile giriş yapar
   * @param idToken Google ID token
   * @param ipAddress Kullanıcının IP adresi
   * @param userAgent Kullanıcının tarayıcı bilgisi
   * @param res HTTP yanıt nesnesi (cookie ayarlamak için)
   */
  @LogMethod({ trackParams: true })
  async loginWithGoogle(
    idToken: string,
    ipAddress?: string,
    userAgent?: string,
    res?: any,
  ): Promise<{ user: any; token?: string; refreshToken?: string }> {
    this.logger.debug(
      'Google ID token ile giriş yapılıyor',
      'AuthService.loginWithGoogle',
      __filename,
      66,
    );

    // Aslında Google ID token ile giriş, normal ID token ile aynı
    // işlemi yapıyor, sadece token'ın kaynağı farklı
    return this.loginWithIdToken(idToken, ipAddress, userAgent, res);
  }

  /**
   * Firebase ID token ile giriş yapar ve kullanıcıyı sisteme kaydeder
   * @param idToken Firebase ID token
   * @param ipAddress Kullanıcının IP adresi (isteğe bağlı)
   * @param userAgent Kullanıcının tarayıcı bilgisi (isteğe bağlı)
   * @param res HTTP yanıt nesnesi (cookie ayarlamak için)
   * @param additionalData İsteğe bağlı ek veri (ilk ve soyadı)
   */
  @LogMethod({ trackParams: false })
  async loginWithIdToken(
    idToken: string,
    ipAddress?: string,
    userAgent?: string,
    res?: any,
    additionalData?: { firstName?: string; lastName?: string },
  ): Promise<{ user: any; token?: string; refreshToken?: string }> {
    logFlow('ID token ile giriş yapılıyor', 'AuthService.loginWithIdToken');
    try {
      this.flowTracker.trackStep('ID token ile giriş yapılıyor', 'AuthService');
      // Verify Firebase ID token
      this.logger.debug(
        `ID token doğrulanıyor: ${idToken.substring(0, 30)}...`,
        'AuthService.loginWithIdToken',
        __filename,
        '46', // String olarak satır numarası
      );
      const decodedToken =
        await this.firebaseService.auth.verifyIdToken(idToken);
      this.logger.debug(
        `ID token doğrulandı. UID: ${decodedToken.uid}`,
        'AuthService.loginWithIdToken',
        __filename,
        '53', // String olarak satır numarası
      );

      if (!decodedToken.uid) {
        logFlow('Geçersiz kimlik: UID yok', 'AuthService.loginWithIdToken');
        throw new UnauthorizedException('Geçersiz kimlik');
      }

      // Get user info from Firebase
      logFlow(
        `Firebase kullanıcısı alınıyor: ${decodedToken.uid}`,
        'AuthService.loginWithIdToken',
      );
      this.logger.debug(
        `Firebase'den kullanıcı bilgisi alınıyor: ${decodedToken.uid}`,
        'AuthService.loginWithIdToken',
        __filename,
        '67', // String olarak satır numarası
      );
      const firebaseUser = await this.firebaseService.auth.getUser(
        decodedToken.uid,
      );
      this.logger.debug(
        `Firebase kullanıcı bilgisi alındı: ${firebaseUser.email}`,
        'AuthService.loginWithIdToken',
        __filename,
        '74', // String olarak satır numarası
      );

      if (!firebaseUser.email) {
        // Error için doğru obje loglaması
        const error = new Error(
          `Firebase user has no email: ${firebaseUser.uid}`,
        );
        logError(error, 'AuthService.loginWithIdToken', __filename, '83', {
          userId: firebaseUser.uid,
          stack: error.stack,
          context: 'Email validation',
        });
        throw new BadRequestException(
          'Kullanıcı email bilgisi eksik. Firebase hesabınızda email adresinizi doğrulayın.',
        );
      }

      // Backend kullanıcı tablosunda da kullanıcıyı bul veya oluştur
      logFlow(
        `Kullanıcı bulunuyor veya oluşturuluyor: ${firebaseUser.email}`,
        'AuthService.loginWithIdToken',
      );
      this.logger.debug(
        `Yerel kullanıcı bulunuyor veya oluşturuluyor: ${firebaseUser.email}, Ek Veri: ${JSON.stringify(additionalData)}`,
        'AuthService.loginWithIdToken',
        __filename,
        '92', // String olarak satır numarası
      );
      const user = await this.usersService.findOrCreateUser(
        {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        },
        additionalData,
      );

      // Her başarılı girişte son giriş tarihini güncelle
      logFlow(
        `Son giriş tarihi güncelleniyor: ${user.id}`,
        'AuthService.loginWithIdToken',
      );
      this.logger.debug(
        `Son giriş tarihi güncelleniyor: ${user.id}`,
        'AuthService.loginWithIdToken',
        __filename,
        107, // Satır numarasını kontrol et
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
      this.logger.debug(
        `Refresh token oluşturuluyor: Kullanıcı ID: ${user.id}`,
        'AuthService.loginWithIdToken',
        __filename,
        127, // Satır numarasını kontrol et
      );
      const refreshToken = await this.createRefreshToken(
        user.id,
        ipAddress,
        userAgent,
      );

      // Cookie'ler için yapılandırma - backend tarafında token yönetimi için HTTP Only cookie'ler kullan
      if (res && res.cookie) {
        this.setAuthCookies(res, idToken, refreshToken, user.id);
        this.logger.debug(
          "Auth cookie'leri başarıyla ayarlandı",
          'AuthService.loginWithIdToken',
          __filename,
          90,
          { userId: user.id },
        );
      } else {
        this.logger.warn(
          "Yanıt nesnesi olmadığı için cookie'ler ayarlanamadı",
          'AuthService.loginWithIdToken',
          __filename,
          97,
        );
      }

      logFlow('Giriş başarılı', 'AuthService.loginWithIdToken');
      this.logger.info(
        'Kullanıcı başarıyla giriş yaptı',
        'AuthService.loginWithIdToken',
        __filename,
        undefined,
        { userId: user.id, email: user.email },
      );

      // Client stratejisine bağlı olarak token'ı paylaş veya paylaşma
      // Client token'ı cookie olarak alacaksa, burada dönmemize gerek yok
      const responseData = {
        user: userData,
        ...(!res || !res.cookie
          ? { token: idToken, refreshToken: refreshToken }
          : {}),
      };

      return responseData;
    } catch (error) {
      // Hata bilgilerini hazırla
      const errorInfo = {
        name: error instanceof Error ? error.name : 'UnknownError',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        idToken: idToken ? '***' : undefined,
        ipAddress,
      };

      // Hata loglaması - doğru parametrelerle
      logError(
        error instanceof Error ? error : new Error(String(error)),
        'AuthService.loginWithIdToken',
        __filename,
        undefined,
        errorInfo,
      );

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
   * Bir HTTP yanıtında auth cookie'leri ayarlar
   * @param res HTTP yanıt nesnesi
   * @param token Access token
   * @param refreshToken Refresh token
   * @param userId Kullanıcı ID'si
   */
  private setAuthCookies(
    res: any,
    token: string,
    refreshToken: string,
    userId: string,
  ): void {
    if (!res || !res.cookie) {
      this.logger.warn(
        'Cookie ayarlama fonksiyonu bulunamadı',
        'AuthService.setAuthCookies',
        __filename,
        149,
      );
      return;
    }

    try {
      // Üretim ortamı için secure cookie ayarı
      const isProduction = process.env.NODE_ENV === 'production';

      // Access token cookie - kısa ömürlü (1 saat)
      res.cookie('access_token', token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 60 * 60 * 1000, // 1 saat
        path: '/',
      });

      // Refresh token cookie - uzun ömürlü (7 gün)
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: this.REFRESH_TOKEN_VALIDITY_DAYS * 24 * 60 * 60 * 1000, // 7 gün
        path: '/',
      });

      // Oturum cookie - kullanıcı ID'si içerir, tarayıcı tarafından erişilebilir
      res.cookie(
        'auth_session',
        JSON.stringify({
          userId,
          isLoggedIn: true,
          expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        }),
        {
          httpOnly: false, // Client JavaScript tarafından okunabilir
          secure: isProduction,
          sameSite: 'lax',
          maxAge: 60 * 60 * 1000, // 1 saat
          path: '/',
        },
      );

      this.logger.debug(
        "Auth cookie'leri ayarlandı",
        'AuthService.setAuthCookies',
        __filename,
        189,
      );
    } catch (error) {
      this.logger.error(
        'Cookie ayarlama sırasında hata',
        'AuthService.setAuthCookies',
        __filename,
        196,
        undefined,
        {
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      );
    }
  }

  /**
   * Refresh token kullanarak yeni bir access token (Firebase Custom Token) oluşturur
   * @param refreshToken Cookie'den alınan orijinal (hashlenmemiş) refresh token
   * @returns Yeni access token (Firebase Custom Token)
   */
  async refreshToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; newRefreshToken?: string }> {
    this.logger.debug(
      `Token yenileme isteği: Token: ${refreshToken ? refreshToken.substring(0, 10) + '...' : 'Yok'}`,
      'AuthService.refreshToken',
      __filename,
      218,
    );
    try {
      // Yeni doğrulama metodunu kullan
      const validationResult =
        await this.validateAndGetUserByRefreshToken(refreshToken);
      if (!validationResult) {
        throw new UnauthorizedException(
          'Geçersiz veya süresi dolmuş refresh token',
        );
      }

      const { user, storedTokenId } = validationResult; // Artık null değil, güvenle erişebiliriz

      // Firebase'den yeni bir özel token (custom token) oluştur
      const customToken = await this.firebaseService.auth.createCustomToken(
        user.firebaseUid,
      );

      // İsteğe bağlı: Refresh token rotasyonu
      // await this.removeRefreshTokenById(storedTokenId);
      // const newRefreshTokenString = await this.createRefreshToken(user.id, /* ip */, /* agent */);

      this.logger.info(
        `Kullanıcı ${user.id} için token yenilendi`,
        'AuthService.refreshToken',
        __filename,
        242,
      );

      return {
        accessToken: customToken,
        // newRefreshToken: newRefreshTokenString // Rotasyon aktifse
      };
    } catch (error) {
      this.logger.logError(error, 'AuthService.refreshToken', {
        hasRefreshToken: !!refreshToken,
        errorContext: 'Token yenileme sırasında hata',
      });
      if (error instanceof UnauthorizedException) {
        throw error;
      }
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
    this.logger.debug(
      `createRefreshToken çağrıldı: Kullanıcı ID: ${userId}`,
      'AuthService.createRefreshToken',
      __filename,
      // Satır numarasını kontrol et
    );
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
        `Refresh token oluşturma hatası: ${error instanceof Error ? error.message : String(error)}`,
        'AuthService.createRefreshToken',
        __filename,
        undefined,
        error instanceof Error ? error : undefined,
      );
      throw new InternalServerErrorException('Refresh token oluşturulamadı');
    }
  }

  /**
   * Orijinal (hashlenmemiş) refresh token'ı doğrular, ilgili kullanıcıyı ve token ID'sini döndürür.
   * Veritabanındaki *tüm* tokenları taramak yerine, potansiyel eşleşmeleri bulmak için daha verimli bir yol izler.
   * Not: Bu yöntem hala tüm tokenları getirebilir, daha büyük sistemlerde tokenları hash'lerine göre indekslemek daha iyi olabilir.
   * @param token Doğrulanacak orijinal refresh token (hashlenMEmiş)
   * @returns { user: Kullanıcı nesnesi, storedTokenId: Veritabanındaki token ID'si } veya hata
   */
  private async validateAndGetUserByRefreshToken(
    token: string,
  ): Promise<{ user: any; storedTokenId: string } | null> {
    this.logger.debug(
      `validateAndGetUserByRefreshToken çağrıldı: Token: ${token ? token.substring(0, 10) + '...' : 'Yok'}`,
      'AuthService.validateAndGetUserByRefreshToken',
      __filename,
      308, // Satır numarasını kontrol et
    );
    try {
      // TODO: Daha verimli hale getirilebilir. Örneğin, token'ın bir kısmını veya hash'ini kullanarak filtreleme yapılabilir.
      // Şimdilik, süresi dolmamış tüm tokenları getiriyoruz.
      const now = admin.firestore.Timestamp.now();
      const potentialTokens =
        await this.firebaseService.findMany<UserRefreshToken>(
          FIRESTORE_COLLECTIONS.REFRESH_TOKENS,
          [
            {
              field: 'expiresAt',
              operator: '>=',
              value: now,
            },
          ],
        );

      if (!potentialTokens || potentialTokens.length === 0) {
        this.logger.warn(
          'Veritabanında geçerli refresh token bulunamadı',
          'AuthService.validateAndGetUserByRefreshToken',
          __filename,
        );
        return null;
      }

      // Gelen token ile eşleşen hash'i bul
      let validTokenInfo: { user: any; storedTokenId: string } | null = null;
      for (const storedToken of potentialTokens) {
        try {
          const isValid = await bcrypt.compare(token, storedToken.hashedToken);
          if (isValid) {
            // Eşleşme bulundu! Kullanıcıyı getir.
            const user = await this.usersService.findById(storedToken.userId);
            if (user) {
              validTokenInfo = { user, storedTokenId: storedToken.id };
              break; // İlk eşleşmeyi bulduktan sonra döngüden çık
            } else {
              // Token geçerli ama kullanıcı bulunamadı? Bu bir tutarsızlık.
              this.logger.error(
                `Refresh token (${storedToken.id}) geçerli ancak ilişkili kullanıcı (${storedToken.userId}) bulunamadı!`,
                'AuthService.validateAndGetUserByRefreshToken',
                __filename,
                350,
              );
            }
          }
        } catch (compareError) {
          // bcrypt.compare hatası (nadir)
          this.logger.error(
            `bcrypt.compare hatası: ${compareError.message}`,
            'AuthService.validateAndGetUserByRefreshToken',
            __filename,
          );
          continue; // Diğer tokenları kontrol etmeye devam et
        }
      }

      if (!validTokenInfo) {
        this.logger.warn(
          'Sağlanan refresh token ile eşleşen geçerli token bulunamadı',
          'AuthService.validateAndGetUserByRefreshToken',
          __filename,
        );
        return null;
      }

      this.logger.debug(
        `Refresh token başarıyla doğrulandı: Kullanıcı ID ${validTokenInfo.user.id}`,
        'AuthService.validateAndGetUserByRefreshToken',
      );
      return validTokenInfo;
    } catch (error) {
      this.logger.logError(
        error,
        'AuthService.validateAndGetUserByRefreshToken',
        {
          errorContext: 'Refresh token doğrulama sırasında genel hata',
        },
      );
      return null;
    }
  }

  /**
   * Belirtilen ID'ye sahip refresh token'ı siler.
   * @param tokenId Silinecek token'ın Firestore ID'si
   */
  private async removeRefreshTokenById(tokenId: string): Promise<void> {
    this.logger.debug(
      `removeRefreshTokenById çağrıldı: Token ID: ${tokenId}`,
      'AuthService.removeRefreshTokenById',
      __filename,
      400, // Satır numarasını kontrol et
    );
    try {
      await this.firebaseService.delete(
        FIRESTORE_COLLECTIONS.REFRESH_TOKENS,
        tokenId,
      );
    } catch (error) {
      this.logger.logError(error, 'AuthService.removeRefreshTokenById', {
        tokenId,
        errorContext: 'Refresh token ID ile silinirken hata',
      });
      // Hata olsa bile devam et, logout/refresh işlemini engelleme
    }
  }

  /**
   * Eski: Refresh token'ı doğrular ve ilişkili kullanıcıyı döndürür (Artık kullanılmıyor olabilir)
   * @param userId Kullanıcı ID'si
   * @param token Doğrulanacak orijinal refresh token (hashlenMEmiş)
   * @returns İlişkili kullanıcı veya hata (token geçersizse)
   */
  private async validateRefreshToken_OLD(
    userId: string,
    token: string,
  ): Promise<any> {
    this.logger.debug(
      `validateRefreshToken_OLD çağrıldı: Kullanıcı ID: ${userId}, Token: ${token ? token.substring(0, 10) + '...' : 'Yok'}`,
      'AuthService.validateRefreshToken_OLD',
      __filename,
      308, // Satır numarasını kontrol et
    );
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
        `Refresh token doğrulama hatası: ${error instanceof Error ? error.message : String(error)}`,
        'AuthService.validateRefreshToken_OLD',
        __filename,
        342, // Satır numarasını kontrol et
        error instanceof Error ? error : undefined,
      );
      return null;
    }
  }

  /**
   * Refresh token'ı silmek için kullanılır (logout işlemi sırasında)
   */
  async removeRefreshToken(userId: string, token: string): Promise<void> {
    this.logger.debug(
      `removeRefreshToken çağrıldı: Kullanıcı ID: ${userId}, Token: ${token ? token.substring(0, 10) + '...' : 'Yok'}`,
      'AuthService.removeRefreshToken',
      __filename,
      353, // Satır numarasını kontrol et
    );
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
        `Refresh token silme hatası: ${error instanceof Error ? error.message : String(error)}`,
        'AuthService.removeRefreshToken',
        __filename,
        385, // Satır numarasını kontrol et
        error instanceof Error ? error : undefined,
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
    this.logger.debug(
      `logout çağrıldı: Kullanıcı ID: ${userId}, Token: ${refreshToken ? refreshToken.substring(0, 10) + '...' : 'Yok'}`,
      'AuthService.logout',
      __filename,
      397, // Satır numarasını kontrol et
    );
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
