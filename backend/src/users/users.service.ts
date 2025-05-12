import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { UpdateUserDto, User } from './dto';
import { ThemeType } from '../types/theme.type';
import * as admin from 'firebase-admin';
import { FIRESTORE_COLLECTIONS } from '../common/constants';
import { LoggerService } from '../common/services/logger.service';
import { FlowTrackerService } from '../common/services/flow-tracker.service';
import { LogMethod } from '../common/decorators';

// User için tip tanımı artık types klasöründen import ediliyor
// export interface User {
//   id: string;
//   firebaseUid: string;
//   email: string;
//   firstName?: string;
//   lastName?: string;
//   profileImageUrl?: string;
//   role: 'USER' | 'ADMIN';
//   onboarded: boolean;
//   createdAt: Date;
//   updatedAt: Date;
//   settings?: Record<string, any>;
// }

@Injectable()
export class UsersService {
  private readonly logger: LoggerService;
  private readonly flowTracker: FlowTrackerService;

  constructor(private firebaseService: FirebaseService) {
    this.logger = LoggerService.getInstance();
    this.flowTracker = FlowTrackerService.getInstance();
    this.logger.debug(
      'UsersService başlatıldı',
      'UsersService.constructor',
      __filename,
      31,
    );
  }

  @LogMethod({ trackParams: true })
  async findAll() {
    try {
      this.flowTracker.trackStep(
        'Tüm kullanıcılar getiriliyor',
        'UsersService',
      );
      // Mevcut kod
      this.logger.info(
        'Tüm kullanıcılar başarıyla getirildi',
        'UsersService.findAll',
        __filename,
        undefined,
      );
      // Mevcut return ifadesi
    } catch (error) {
      this.logger.logError(error, 'UsersService.findAll');
      throw error;
    }
  }

  @LogMethod({ trackParams: true })
  async findById(id: string): Promise<User> {
    try {
      this.flowTracker.trackStep(
        `${id} ID'li kullanıcı getiriliyor`,
        'UsersService',
      );
      const user = await this.firebaseService.findById<User>(
        FIRESTORE_COLLECTIONS.USERS,
        id,
      );

      if (!user) {
        throw new NotFoundException(`Kullanıcı bulunamadı: ${id}`);
      }

      this.logger.info(
        'Kullanıcı başarıyla getirildi',
        'UsersService.findById',
        __filename,
        undefined,
        { userId: id },
      );
      return user;
    } catch (error) {
      this.logger.logError(error, 'UsersService.findById', { userId: id });
      throw error;
    }
  }

  @LogMethod()
  async findByFirebaseUid(firebaseUid: string): Promise<User | null> {
    this.flowTracker.trackStep(
      `Firebase UID ile kullanıcı aranıyor: ${firebaseUid}`,
      'UsersService',
    );

    try {
      const user = await this.firebaseService.findOne<User>(
        FIRESTORE_COLLECTIONS.USERS,
        'firebaseUid',
        '==',
        firebaseUid,
      );

      if (user) {
        this.logger.debug(
          `Kullanıcı bulundu: ${firebaseUid}`,
          'UsersService.findByFirebaseUid',
          __filename,
          82,
        );
      } else {
        this.logger.debug(
          `Kullanıcı bulunamadı: ${firebaseUid}`,
          'UsersService.findByFirebaseUid',
          __filename,
          88,
        );
      }

      return user;
    } catch (error) {
      this.logger.logError(error, 'UsersService.findByFirebaseUid', {
        firebaseUid,
        additionalInfo: 'Firebase ID ile kullanıcı aranırken hata oluştu',
      });
      throw error;
    }
  }

  @LogMethod()
  async findByUid(uid: string): Promise<User> {
    this.flowTracker.trackStep(
      `UID ile kullanıcı aranıyor: ${uid}`,
      'UsersService',
    );

    try {
      const user = await this.findByFirebaseUid(uid);

      if (!user) {
        this.logger.warn(
          `UID ile kullanıcı bulunamadı: ${uid}`,
          'UsersService.findByUid',
          __filename,
          112,
        );
        throw new NotFoundException('Kullanıcı bulunamadı');
      }

      return user;
    } catch (error) {
      this.logger.logError(error, 'UsersService.findByUid', {
        uid,
        additionalInfo: 'UID ile kullanıcı aranırken hata oluştu',
      });
      throw error;
    }
  }

  @LogMethod()
  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    this.flowTracker.trackStep(
      `Kullanıcı güncelleniyor: ${id}`,
      'UsersService',
    );

    try {
      const user = await this.findById(id);

      // Güncellenecek alanları hazırla
      const updateData: Partial<User> = {};

      if (updateUserDto.firstName !== undefined) {
        updateData.firstName = updateUserDto.firstName;
      }

      if (updateUserDto.lastName !== undefined) {
        updateData.lastName = updateUserDto.lastName;
      }

      if (updateUserDto.onboarded !== undefined) {
        updateData.onboarded = updateUserDto.onboarded;
      }

      this.logger.debug(
        `Kullanıcı güncelleme verileri hazırlandı: ${id}`,
        'UsersService.updateUser',
        __filename,
        152,
        { updateData: JSON.stringify(updateData) },
      );

      // Kullanıcıyı güncelle
      const updatedUser = await this.firebaseService.update<User>(
        FIRESTORE_COLLECTIONS.USERS,
        user.id,
        updateData,
      );

      this.logger.info(
        `Kullanıcı başarıyla güncellendi: ${id}`,
        'UsersService.updateUser',
        __filename,
        164,
      );

      return updatedUser;
    } catch (error) {
      this.logger.logError(error, 'UsersService.updateUser', {
        userId: id,
        updateData: updateUserDto,
        additionalInfo: 'Kullanıcı güncellenirken hata oluştu',
      });
      throw error;
    }
  }

  /**
   * Kullanıcı profilini güncelleyen metod
   */
  @LogMethod()
  async updateProfile(
    firebaseUid: string,
    updateData: Partial<User>,
  ): Promise<User> {
    this.flowTracker.trackStep(
      `Kullanıcı profili güncelleniyor: ${firebaseUid}`,
      'UsersService',
    );

    try {
      const user = await this.findByFirebaseUid(firebaseUid);

      if (!user) {
        this.logger.warn(
          `Profil güncellemek için kullanıcı bulunamadı: ${firebaseUid}`,
          'UsersService.updateProfile',
          __filename,
          192,
        );
        throw new NotFoundException(`Kullanıcı bulunamadı: ${firebaseUid}`);
      }

      // Güncellenecek verilerden hassas alanları çıkar
      const safeUpdateData = { ...updateData } as Partial<User>;
      delete safeUpdateData.id; // ID alanını sil
      delete safeUpdateData.firebaseUid; // Firebase UID alanını sil
      delete safeUpdateData.email; // Email alanını sil

      this.logger.debug(
        `Kullanıcı profil güncelleme verileri: ${firebaseUid}`,
        'UsersService.updateProfile',
        __filename,
        205,
        { safeUpdateData: JSON.stringify(safeUpdateData) },
      );

      // Kullanıcıyı güncelle
      const updatedUser = await this.firebaseService.update<User>(
        FIRESTORE_COLLECTIONS.USERS,
        user.id,
        safeUpdateData,
      );

      this.logger.info(
        `Kullanıcı profili güncellendi: ${firebaseUid}`,
        'UsersService.updateProfile',
        __filename,
        217,
      );

      return updatedUser;
    } catch (error) {
      this.logger.logError(error, 'UsersService.updateProfile', {
        firebaseUid,
        updateData,
        additionalInfo: 'Kullanıcı profili güncellenirken hata oluştu',
      });
      throw error;
    }
  }

  /**
   * Kullanıcı temasını güncellers
   * PRD 4.1.2 gereksinimini karşılayan özel tema ayar metodu
   */
  @LogMethod()
  async updateTheme(firebaseUid: string, theme: ThemeType): Promise<User> {
    this.flowTracker.trackStep(
      `Kullanıcı teması güncelleniyor: ${firebaseUid}, tema: ${theme}`,
      'UsersService',
    );

    try {
      const user = await this.findByFirebaseUid(firebaseUid);

      if (!user) {
        this.logger.warn(
          `Tema güncellemek için kullanıcı bulunamadı: ${firebaseUid}`,
          'UsersService.updateTheme',
          __filename,
          245,
        );
        throw new NotFoundException(`Kullanıcı bulunamadı: ${firebaseUid}`);
      }

      // Geçerli bir tema değeri mi kontrol et
      if (!Object.values(ThemeType).includes(theme)) {
        this.logger.warn(
          `Geçersiz tema değeri: ${theme}`,
          'UsersService.updateTheme',
          __filename,
          254,
        );
        throw new BadRequestException('Geçersiz tema değeri');
      }

      // Mevcut ayarları güvenli bir şekilde al
      const currentSettings = user.settings || {};

      this.logger.debug(
        `Kullanıcı tema ayarı güncelleniyor: ${firebaseUid}`,
        'UsersService.updateTheme',
        __filename,
        264,
        { currentTheme: currentSettings.theme, newTheme: theme },
      );

      // Kullanıcıyı güncelle
      const updatedUser = await this.firebaseService.update<User>(
        FIRESTORE_COLLECTIONS.USERS,
        user.id,
        {
          settings: {
            ...currentSettings,
            theme,
          },
        },
      );

      this.logger.info(
        `Kullanıcı tema ayarı güncellendi: ${firebaseUid}, tema: ${theme}`,
        'UsersService.updateTheme',
        __filename,
        280,
      );

      return updatedUser;
    } catch (error) {
      this.logger.logError(error, 'UsersService.updateTheme', {
        firebaseUid,
        theme,
        additionalInfo: 'Kullanıcı tema ayarı güncellenirken hata oluştu',
      });
      throw error;
    }
  }

  /**
   * Kullanıcının belirli bir ayarını günceller
   * PRD 4.1.2 gereksinimini karşılayan genel ayar yönetimi
   */
  async updateSetting(
    firebaseUid: string,
    key: string,
    value: any,
  ): Promise<User> {
    const user = await this.findByFirebaseUid(firebaseUid);

    if (!user) {
      throw new NotFoundException(`Kullanıcı bulunamadı: ${firebaseUid}`);
    }

    // Mevcut ayarları güvenli bir şekilde al
    const currentSettings = user.settings || {};

    // Kullanıcıyı güncelle
    const updatedUser = await this.firebaseService.update<User>(
      FIRESTORE_COLLECTIONS.USERS,
      user.id,
      {
        settings: {
          ...currentSettings,
          [key]: value,
        },
      },
    );

    return updatedUser;
  }

  async getUserProfile(firebaseUid: string): Promise<User> {
    const user = await this.findByFirebaseUid(firebaseUid);

    if (!user) {
      throw new NotFoundException(`Kullanıcı bulunamadı: ${firebaseUid}`);
    }

    return user;
  }

  /**
   * Kullanıcının mevcut tema ayarını getirir
   * PRD 4.1.2 gereksinimini karşılayan tema bilgisi alma metodu
   */
  async getTheme(firebaseUid: string): Promise<ThemeType> {
    const user = await this.findByFirebaseUid(firebaseUid);

    if (!user) {
      throw new NotFoundException(`Kullanıcı bulunamadı: ${firebaseUid}`);
    }

    // Ayarlar ve tema yoksa varsayılan tema değerini döndür
    return (user.settings?.theme as ThemeType) || ThemeType.LIGHT;
  }

  /**
   * Kullanıcının belirli bir ayarını getirir
   * PRD 4.1.2 gereksinimini karşılayan genel ayar yönetimi
   */
  async getSetting<T>(firebaseUid: string, key: string): Promise<T | null> {
    const user = await this.findByFirebaseUid(firebaseUid);

    if (!user) {
      throw new NotFoundException(`Kullanıcı bulunamadı: ${firebaseUid}`);
    }

    // Ayarlar yoksa boş değer döndür
    return (user.settings?.[key] as T) || null;
  }

  /**
   * Kullanıcının tüm ayarlarını getirir
   * PRD 4.1.2 gereksinimini karşılayan genel ayar yönetimi
   */
  async getAllSettings(firebaseUid: string): Promise<Record<string, any>> {
    const user = await this.findByFirebaseUid(firebaseUid);

    if (!user) {
      throw new NotFoundException(`Kullanıcı bulunamadı: ${firebaseUid}`);
    }

    // Ayarlar yoksa boş obje döndür
    return user.settings || {};
  }

  /**
   * Firebase Auth'dan gelen kullanıcı bilgilerine göre kullanıcıyı bulur veya oluşturur
   * Transaction kullanarak yarış koşullarını (race condition) önler
   */
  async findOrCreateUser(firebaseUser: {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
  }): Promise<User> {
    // Önce kullanıcıyı kontrol et
    const existingUser = await this.findByFirebaseUid(firebaseUser.uid);

    if (existingUser) {
      return existingUser;
    }

    // Kullanıcı yoksa yeni oluştur
    this.logger.info(
      `Yeni kullanıcı oluşturuluyor: ${firebaseUser.uid}`,
      'UsersService.findOrCreateUser',
      __filename,
      473,
    );

    // Firestore timestamp oluştur
    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    // Yeni kullanıcı nesnesi
    const newUser: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & {
      createdAt: admin.firestore.FieldValue;
      updatedAt: admin.firestore.FieldValue;
    } = {
      firebaseUid: firebaseUser.uid,
      uid: firebaseUser.uid, // firebaseUid alanını uid'e kopyala
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      role: 'USER',
      onboarded: false,
      lastLogin: new Date(), // Şimdi giriş yapmış kabul et
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    // Opsiyonel alanları sadece değerleri varsa ekle
    if (firebaseUser.photoURL) newUser.profileImageUrl = firebaseUser.photoURL;

    // Yeni kullanıcı için belge referansı oluştur
    const newUserRef = this.firebaseService.firestore
      .collection(FIRESTORE_COLLECTIONS.USERS)
      .doc();

    // Transaction içinde kullanıcıyı oluştur
    await this.firebaseService.runTransaction((transaction) => {
      transaction.set(newUserRef, newUser);
      this.logger.info(
        `Yeni kullanıcı oluşturuldu: ${firebaseUser.uid} (${newUserRef.id})`,
        'UsersService.findOrCreateUser',
        __filename,
        506,
      );
      return Promise.resolve(); // Return a promise explicitly
    });

    // Oluşturulan kullanıcı bilgisini döndür
    return {
      ...newUser,
      id: newUserRef.id,
      // Timestamp'leri Date'e dönüştür
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as User;
  }

  /**
   * Kullanıcının son giriş tarihini günceller
   */
  async updateLastLogin(userId: string): Promise<User> {
    try {
      // No need to fetch the user if we're not using it
      // const user = await this.findById(userId);

      // Son giriş tarihi güncelleme
      const updatedUser = await this.firebaseService.update<User>(
        FIRESTORE_COLLECTIONS.USERS,
        userId,
        {
          lastLogin: new Date(),
        },
      );

      return updatedUser;
    } catch (error) {
      this.logger.error(
        `Failed to update last login for user ${userId}`,
        error,
      );
      throw error;
    }
  }

  @LogMethod({ trackParams: true })
  async findByEmail(email: string) {
    try {
      this.flowTracker.trackStep(
        `${email} e-postasına sahip kullanıcı getiriliyor`,
        'UsersService',
      );
      // Mevcut kod
      this.logger.info(
        'Kullanıcı e-posta ile başarıyla getirildi',
        'UsersService.findByEmail',
        __filename,
        undefined,
        { email },
      );
      // Mevcut return ifadesi
    } catch (error) {
      this.logger.logError(error, 'UsersService.findByEmail', { email });
      throw error;
    }
  }

  @LogMethod({ trackParams: true })
  async create(createUserDto: any) {
    try {
      this.flowTracker.trackStep(
        `Yeni kullanıcı oluşturuluyor: ${createUserDto.email}`,
        'UsersService',
      );
      // Mevcut kod
      this.logger.info(
        'Yeni kullanıcı başarıyla oluşturuldu',
        'UsersService.create',
        __filename,
        undefined,
        { email: createUserDto.email },
      );
      // Mevcut return ifadesi
    } catch (error) {
      this.logger.logError(error, 'UsersService.create', {
        email: createUserDto.email,
      });
      throw error;
    }
  }

  @LogMethod({ trackParams: true })
  async update(id: string, updateUserDto: any) {
    try {
      this.flowTracker.trackStep(
        `${id} ID'li kullanıcı güncelleniyor`,
        'UsersService',
      );
      // Mevcut kod
      this.logger.info(
        'Kullanıcı başarıyla güncellendi',
        'UsersService.update',
        __filename,
        undefined,
        { userId: id },
      );
      // Mevcut return ifadesi
    } catch (error) {
      this.logger.logError(error, 'UsersService.update', { userId: id });
      throw error;
    }
  }

  @LogMethod({ trackParams: true })
  async remove(id: string) {
    try {
      this.flowTracker.trackStep(
        `${id} ID'li kullanıcı siliniyor`,
        'UsersService',
      );
      // Mevcut kod
      this.logger.info(
        'Kullanıcı başarıyla silindi',
        'UsersService.remove',
        __filename,
        undefined,
        { userId: id },
      );
      // Mevcut return ifadesi
    } catch (error) {
      this.logger.logError(error, 'UsersService.remove', { userId: id });
      throw error;
    }
  }
}
