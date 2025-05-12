import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';
import { ServiceAccount } from 'firebase-admin';
import { LoggerService } from '../common/services/logger.service';
import { FlowTrackerService } from '../common/services/flow-tracker.service';
import { LogMethod } from '../common/decorators';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger: LoggerService;
  private readonly flowTracker: FlowTrackerService;
  public readonly auth: admin.auth.Auth;
  public readonly firestore: admin.firestore.Firestore;
  public readonly db: admin.firestore.Firestore;
  public readonly storage: admin.storage.Storage;

  constructor(private configService: ConfigService) {
    this.logger = LoggerService.getInstance();
    this.flowTracker = FlowTrackerService.getInstance();
    this.flowTracker.trackStep(
      'Firebase servisini başlatma',
      'FirebaseService',
    );

    // Firebase Admin SDK'yı başlat
    if (!admin.apps.length) {
      try {
        // Ortam değişkenlerini kontrol et
        const projectId =
          this.configService.get<string>('FIREBASE_PROJECT_ID') ||
          'my-app-71530';
        const privateKey =
          this.configService.get<string>('FIREBASE_PRIVATE_KEY') ||
          '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCwM9f7msv0Cafc\nrzaWYtbgQC8VOUWPam72ga1NEIH+8yB9k7AOZ/3T7xSNouUPN+KZcOdmJu/RmONJ\nOwIAcVzvzPBJyRH36D6mq7Y21wyTGZ4EgVlqQijDytnaNblvdT5lDGontaFIJjBB\nBKdDd85zVj448IxbZiOc3nabneIZuEHopqGbQDDhW+QEiK2uCDJQADbVCRMNfAN4\n3hF/DpYk19IY+FzIhkLAoBCWzqztdBlEYjbMlFjLjO/XXi9TV+GhV93Nt3ynCy7g\nAV+X6DPcXvEEgbmssZOh7yzxxaJWcr8YC1A4vjJARUJoWNNVddBEIIOg85lGQIfM\nM4nirAVBAgMBAAECggEAQuCikQ5ba/hAPLxKCUFhkkL6O+F9e+YnUKu+hboGxSgt\nhExKbeVdi5O6ZtnVe/W3rYqTYYvUyWZwmgpqA5YDcscDytWk2sXNBcC1y9HKpYh7\nF/WqZPDQfSPglPiANgQ3lu3j2seO/A32ka7891ghRViODFmMxGIbkT5EoWMG/sB0\nNXJZZc2RAiilvsf0TH1V74cusKNsqJ4KFm6+mzTNIJW4J2cR7ODSd92DEJhLR8zd\nd7i6w3CobCgL2XO2L33bg+E1RX8fILkZklhj8l++vSW0sVzz+Io9gfr3IOOJTajw\n+mPkgLkthJdvKmxfBTciRDyq9or8Q7zNK3D33j+/MwKBgQD3Xyh0H9sy+gOgBtz6\nIqrQIFaLBsnZdEnwerF7Y9HHXWpM9zNT5wA2LKMqZwPUfe6hbAzrcyq3lf+6zDKj\njPq3E9/Nn1RG690Lu+4u43STyqxKQ3/C8SJTjywOsqwtEAgdP+H8SC8JkrlfFSct\nFMR6H4tds6i6BIINeauKj2CDawKBgQC2WTLaxX//w6A/GRNKkJoTAjf+BxDqItRC\nJ5rgZwVqILGzKk83rXyGmWlrm1I1NXhAOl6acbEDnWZjEWas4t3Cr8tnTu5OO2l5\n2Ufa1ryCef/R5qnSkq3M9B/Jz13FrouJ00t4ud4RWAyGp7gQdOaXRRbp511ws5MH\nAca6HekxAwKBgDQxu9NktVd4MTOevxl4Hxpy+E+1Svm6867t9GzYjvbF2xwKPKZD\nY2QK3xKfUcuQFr2wkrlLP4Qk/iRn2Xdw06W1Z893As1EDwvex07VZ0+Xv+qbe2Wi\ng1+mIeGoCXQooc2qIQCeKm6Wqs5JJE76xsoNxdYrhjpZoSc+uNcvkWmpAoGAWgPu\ndtDIPxnzITLfsw9u/7M4sM4MK4jF/2JNsjkpExrQngFk2bdqoYdZ4yTpkBq1If+u\nc89r8rzgrkcIyI+1qUXew0DTowrxJpV8Qyt+I2rWPmf/rVN7OJHKn3UedVeUypTj\nzNT0KtusU0y4MGeE7WfNx+nO1rPPAMZ/s6DQXMECgYEA7RZZDEq5C2ZOPZNxAIpp\nc9F9+QO9Iu7ZncaNSJieN9PsC46tddyAdwY4YfMhk0PYJV9Iy0QGt0TT84vzR7cx\nrdnABxR/IpvdPpmB11lFCB5j6NVSy6wU8h32B5K7qY/A0wliIO7fyJyQisFmcwBC\nGh7t9fXPHYoUrf84aVkJp/c=\n-----END PRIVATE KEY-----';
        const clientEmail =
          this.configService.get<string>('FIREBASE_CLIENT_EMAIL') ||
          'firebase-adminsdk-fbsvc@my-app-71530.iam.gserviceaccount.com';
        const databaseURL =
          this.configService.get<string>('FIREBASE_DATABASE_URL') ||
          'https://my-app-71530-default-rtdb.firebaseio.com';
        const storageBucket =
          this.configService.get<string>('FIREBASE_STORAGE_BUCKET') ||
          'my-app-71530.appspot.com';

        // Gerekli değişkenlerin kontrolü - validasyonu geçici olarak kaldırıldı
        /*if (!projectId || !privateKey || !clientEmail) {
          throw new Error(
            'Firebase yapılandırma bilgileri eksik. FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY ve FIREBASE_CLIENT_EMAIL ortam değişkenleri gereklidir.',
          );
        }*/

        // privateKey'deki tırnak işaretleri ve escape karakterlerle ilgili sorunları gider
        const formattedPrivateKey = privateKey
          .replace(/\\n/g, '\n')
          .replace(/^"/, '')
          .replace(/"$/, '');

        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            privateKey: formattedPrivateKey,
            clientEmail,
          } as ServiceAccount),
          databaseURL,
          storageBucket,
        });
        this.logger.info(
          'Firebase Admin başarıyla başlatıldı',
          'FirebaseService.constructor',
          __filename,
          67,
        );
      } catch (error) {
        this.logger.error(
          `Firebase Admin başlatılamadı: ${error.message}`,
          'FirebaseService.constructor',
          __filename,
          72,
        );
        this.logger.error(
          'Lütfen .env dosyasındaki Firebase yapılandırma bilgilerini kontrol edin.',
          'FirebaseService.constructor',
          __filename,
          77,
        );
        // Kritik bir hata, uygulamanın düzgün çalışması için bu servisin başarıyla başlatılması gerekli
        throw error;
      }
    }

    this.auth = admin.auth();
    this.firestore = admin.firestore();
    this.db = admin.firestore();
    this.storage = admin.storage();
  }

  @LogMethod()
  async onModuleInit() {
    this.logger.info(
      'FirebaseService başlatıldı',
      'FirebaseService.onModuleInit',
      __filename,
      93,
    );
    this.flowTracker.trackStep(
      'Firebase servisi başlatıldı',
      'FirebaseService',
    );

    try {
      // Firebase servis hesabı anahtarını ortam değişkeninden oku
      const serviceAccountJsonString = this.configService.get<string>(
        'FIREBASE_SERVICE_ACCOUNT_KEY_JSON',
      );
      const storageBucket = this.configService.get<string>(
        'FIREBASE_STORAGE_BUCKET',
      );

      // Servis hesabı JSON stringi kontrolü
      if (!serviceAccountJsonString) {
        this.logger.warn(
          'Firebase servis hesabı anahtarı JSON stringi tanımlanmamış. Geliştirme modu kullanılıyor.',
          'FirebaseService.onModuleInit',
          __filename,
          110,
        );

        // Geliştirme ortamında mı?
        const isDevelopment =
          this.configService.get<string>('NODE_ENV') !== 'production';

        if (!isDevelopment) {
          // Üretim ortamında ise hata fırlat
          throw new Error(
            'Firebase servis hesabı anahtarı JSON stringi tanımlanmamış.',
          );
        } else {
          // Geliştirme ortamında ise uyarı ver ve devam et
          this.logger.warn(
            'Geliştirme modu: Firebase kimlik doğrulama ve veritabanı işlemleri sınırlı olacak',
            'FirebaseService.onModuleInit',
            __filename,
            125,
          );
          return; // Burada metoddan çık, dummy hesap kullanma
        }
      }

      // Storage bucket kontrolü
      if (!storageBucket) {
        this.logger.warn(
          'Firebase storage bucket tanımlanmamış.',
          'FirebaseService.onModuleInit',
          __filename,
          136,
        );
      }

      // JSON stringi parse et
      const serviceAccount = JSON.parse(
        serviceAccountJsonString,
      ) as ServiceAccount;

      // Eğer zaten başlatılmışsa yeniden başlatmayı atla
      if (admin.apps.length === 0) {
        const appOptions: admin.AppOptions = {
          credential: admin.credential.cert(serviceAccount),
        };

        if (storageBucket) {
          appOptions.storageBucket = storageBucket;
        }

        // Firebase Admin SDK'yı başlat
        admin.initializeApp(appOptions);

        // Await için bir Promise kullanıyoruz (linter hatasını gidermek için)
        await Promise.resolve();

        this.logger.info(
          'Firebase Admin SDK initialized successfully.',
          'FirebaseService.onModuleInit',
          __filename,
          161,
        );
      }
    } catch (error) {
      this.logger.error(
        `Firebase servis hesabı anahtarı yapılandırması sırasında hata: ${error.message}`,
        'FirebaseService.onModuleInit',
        __filename,
        168,
      );

      // Geliştirme ortamında mı?
      const isDevelopment =
        this.configService.get<string>('NODE_ENV') !== 'production';

      if (isDevelopment) {
        // Geliştirme ortamında hataları göster ama uygulamayı çökertme
        this.logger.warn(
          'Geliştirme modu: Firebase hatası görmezden geliniyor',
          'FirebaseService.onModuleInit',
          __filename,
          179,
        );
      } else {
        // Üretim ortamında kritik hata olduğu için hatayı yeniden fırlat
        throw error;
      }
    }
  }

  // Kullanıcı doğrulama yardımcı metodu
  @LogMethod({ trackParams: false })
  async verifyUser(token: string): Promise<admin.auth.DecodedIdToken> {
    try {
      this.flowTracker.trackStep(
        'Kullanıcı token doğrulanıyor',
        'FirebaseService',
      );
      return await this.auth.verifyIdToken(token);
    } catch (error) {
      this.logger.logError(error, 'FirebaseService.verifyUser', {
        additionalInfo: 'Token doğrulama hatası',
      });
      throw error;
    }
  }

  // Kullanıcı bilgilerini getirme metodu
  @LogMethod()
  async getUserById(uid: string): Promise<admin.auth.UserRecord> {
    try {
      this.flowTracker.trackStep(
        `Kullanıcı bilgisi (${uid}) alınıyor`,
        'FirebaseService',
      );
      return await this.auth.getUser(uid);
    } catch (error) {
      this.logger.logError(error, 'FirebaseService.getUserById', {
        userId: uid,
        additionalInfo: 'Kullanıcı bilgisi alınamadı',
      });
      throw error;
    }
  }

  // ID token doğrulama fonksiyonu
  @LogMethod({ trackParams: false })
  async verifyIdToken(token: string): Promise<admin.auth.DecodedIdToken> {
    try {
      this.flowTracker.trackStep('ID token doğrulanıyor', 'FirebaseService');
      return await this.auth.verifyIdToken(token);
    } catch (error) {
      this.logger.logError(error, 'FirebaseService.verifyIdToken', {
        additionalInfo: 'ID token doğrulama hatası',
      });
      throw error;
    }
  }

  // Dosya yükleme fonksiyonu
  @LogMethod({ trackParams: true })
  async uploadFile(
    buffer: Buffer,
    destination: string,
    contentType: string,
  ): Promise<string> {
    try {
      this.flowTracker.trackStep(
        `${destination} yoluna dosya yükleniyor`,
        'FirebaseService',
      );
      const startTime = Date.now();

      const bucketName = this.configService.get<string>(
        'FIREBASE_STORAGE_BUCKET',
      );
      const bucket = admin.storage().bucket(bucketName);
      const file = bucket.file(destination);
      await file.save(buffer, {
        metadata: { contentType },
        public: true,
      });
      // Dosyanın herkese açık URL'sini döndür
      const endTime = Date.now();
      this.flowTracker.track(
        `Dosya yükleme tamamlandı (${endTime - startTime}ms)`,
        'FirebaseService',
      );
      return `https://storage.googleapis.com/${bucketName}/${destination}`;
    } catch (error) {
      this.logger.logError(error, 'FirebaseService.uploadFile', {
        destination,
        contentType,
        additionalInfo: 'Dosya yükleme hatası',
      });
      throw error;
    }
  }

  // Dosya silme fonksiyonu
  @LogMethod({ trackParams: true })
  async deleteFile(storagePath: string): Promise<void> {
    try {
      this.flowTracker.trackStep(
        `${storagePath} yolundaki dosya siliniyor`,
        'FirebaseService',
      );
      const startTime = Date.now();

      const bucketName = this.configService.get<string>(
        'FIREBASE_STORAGE_BUCKET',
      );
      const bucket = admin.storage().bucket(bucketName);
      const file = bucket.file(storagePath);
      await file.delete();

      const endTime = Date.now();
      this.flowTracker.track(
        `Dosya silme tamamlandı (${endTime - startTime}ms)`,
        'FirebaseService',
      );
    } catch (error) {
      this.logger.logError(error, 'FirebaseService.deleteFile', {
        storagePath,
        additionalInfo: 'Dosya silme hatası',
      });
      throw error;
    }
  }

  // Firestore Koleksiyon İşlemleri

  /**
   * Belge oluşturma
   * @param collection Koleksiyon adı
   * @param data Oluşturulacak veri
   * @param id (İsteğe bağlı) Belge ID'si
   * @returns Oluşturulan belge
   */
  @LogMethod({ trackParams: true })
  async create<T>(
    collection: string,
    data: T,
    id?: string,
  ): Promise<T & { id: string }> {
    try {
      this.flowTracker.trackStep(
        `${collection} koleksiyonuna yeni döküman ekleniyor`,
        'FirebaseService',
      );
      const startTime = Date.now();

      const dataWithTimestamp = {
        ...data,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      let docRef;
      let docId;

      if (id) {
        docRef = this.firestore.collection(collection).doc(id);
        await docRef.set(dataWithTimestamp);
        docId = id;
      } else {
        docRef = await this.firestore
          .collection(collection)
          .add(dataWithTimestamp);
        docId = docRef.id;
      }

      // Oluşturulan belgeyi getir (timestamp'ler JS Date objesine dönüştürülerek)
      const snapshot = await docRef.get();

      const endTime = Date.now();
      this.flowTracker.trackDbOperation(
        'CREATE',
        collection,
        endTime - startTime,
        'FirebaseService',
      );

      return {
        ...(snapshot.data() as T),
        id: docId,
      };
    } catch (error) {
      this.logger.error(
        `Firestore belge oluşturma hatası: ${error.message}`,
        'FirebaseService.create',
        __filename,
        393,
      );
      throw error;
    }
  }

  /**
   * Belge güncelleme
   * @param collection Koleksiyon adı
   * @param id Belge ID'si
   * @param data Güncellenecek veri
   * @returns Güncellenen belge
   */
  @LogMethod({ trackParams: true })
  async update<T>(
    collection: string,
    id: string,
    data: Partial<T>,
  ): Promise<T & { id: string }> {
    try {
      this.flowTracker.trackStep(
        `${collection} koleksiyonundaki ${id} ID'li döküman güncelleniyor`,
        'FirebaseService',
      );
      const startTime = Date.now();

      const docRef = this.firestore.collection(collection).doc(id);
      const dataWithTimestamp = {
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await docRef.update(dataWithTimestamp);

      // Güncellenen belgeyi getir
      const snapshot = await docRef.get();
      if (!snapshot.exists) {
        throw new Error(
          `${collection} koleksiyonunda ${id} ID'li belge bulunamadı`,
        );
      }

      const endTime = Date.now();
      this.flowTracker.trackDbOperation(
        'UPDATE',
        collection,
        endTime - startTime,
        'FirebaseService',
      );

      return {
        ...(snapshot.data() as T),
        id: snapshot.id,
      };
    } catch (error) {
      this.logger.error(
        `Firestore belge güncelleme hatası: ${error.message}`,
        'FirebaseService.update',
        __filename,
        447,
      );
      throw error;
    }
  }

  /**
   * Belgeyi ID ile getirme
   * @param collection Koleksiyon adı
   * @param id Belge ID'si
   * @returns Belge
   */
  @LogMethod({ trackParams: true })
  async findById<T>(
    collection: string,
    id: string,
  ): Promise<(T & { id: string }) | null> {
    try {
      this.flowTracker.trackStep(
        `${collection} koleksiyonundan ${id} ID'li döküman alınıyor`,
        'FirebaseService',
      );
      const startTime = Date.now();

      const docRef = this.firestore.collection(collection).doc(id);
      const snapshot = await docRef.get();

      if (!snapshot.exists) {
        return null;
      }

      const endTime = Date.now();
      this.flowTracker.trackDbOperation(
        'READ',
        collection,
        endTime - startTime,
        'FirebaseService',
      );

      return {
        ...(snapshot.data() as T),
        id: snapshot.id,
      };
    } catch (error) {
      this.logger.error(
        `Firestore belge getirme hatası: ${error.message}`,
        'FirebaseService.findById',
        __filename,
        490,
      );
      throw error;
    }
  }

  /**
   * Belgeyi koşula göre getirme
   * @param collection Koleksiyon adı
   * @param field Sorgulanacak alan
   * @param operator Operatör ('==', '>', '<', '>=', '<=', '!=', 'array-contains', 'array-contains-any', 'in', 'not-in')
   * @param value Değer
   * @returns İlk eşleşen belge
   */
  @LogMethod({ trackParams: true })
  async findOne<T>(
    collection: string,
    field: string,
    operator: FirebaseFirestore.WhereFilterOp,
    value: any,
  ): Promise<(T & { id: string }) | null> {
    try {
      this.flowTracker.trackStep(
        `${collection} koleksiyonundan ${field} ${operator} ${value} için döküman alınıyor`,
        'FirebaseService',
      );
      const startTime = Date.now();

      const querySnapshot = await this.firestore
        .collection(collection)
        .where(field, operator, value)
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      const endTime = Date.now();
      this.flowTracker.trackDbOperation(
        'READ',
        collection,
        endTime - startTime,
        'FirebaseService',
      );

      return {
        ...(doc.data() as T),
        id: doc.id,
      };
    } catch (error) {
      this.logger.error(
        `Firestore sorgu hatası: ${error.message}`,
        'FirebaseService.findOne',
        __filename,
        541,
      );
      throw error;
    }
  }

  /**
   * Koleksiyondaki belgeleri koşullara göre getirme
   * @param collection Koleksiyon adı
   * @param wheres Sorgulama koşulları dizisi [{field, operator, value}]
   * @param orderBy Sıralama alanı ve yönü {field, direction}
   * @param limit Sonuç sayısı limiti
   * @returns Belge dizisi
   */
  @LogMethod({ trackParams: true })
  async findMany<T>(
    collection: string,
    wheres: Array<{
      field: string;
      operator: FirebaseFirestore.WhereFilterOp;
      value: any;
    }> = [],
    orderBy?: { field: string; direction: 'asc' | 'desc' },
    limit?: number,
  ): Promise<Array<T & { id: string }>> {
    try {
      this.flowTracker.trackStep(
        `${collection} koleksiyonundan filtrelenmiş dokümanlar alınıyor`,
        'FirebaseService',
      );
      const startTime = Date.now();

      let query: FirebaseFirestore.Query =
        this.firestore.collection(collection);

      // Filtreleri ekle
      wheres.forEach((where) => {
        query = query.where(where.field, where.operator, where.value);
      });

      // Sıralama ekle
      if (orderBy) {
        query = query.orderBy(orderBy.field, orderBy.direction);
      }

      // Limit ekle
      if (limit) {
        query = query.limit(limit);
      }

      const querySnapshot = await query.get();

      return querySnapshot.docs.map((doc) => ({
        ...(doc.data() as T),
        id: doc.id,
      }));
    } catch (error) {
      this.logger.error(
        `Firestore çoklu sorgu hatası: ${error.message}`,
        'FirebaseService.findMany',
        __filename,
        597,
      );
      throw error;
    }
  }

  /**
   * Belgeyi silme
   * @param collection Koleksiyon adı
   * @param id Belge ID'si
   * @returns Silme işlemi sonucu
   */
  async delete(collection: string, id: string): Promise<void> {
    try {
      await this.firestore.collection(collection).doc(id).delete();
    } catch (error) {
      this.logger.error(
        `Firestore belge silme hatası: ${error.message}`,
        'FirebaseService.delete',
        __filename,
        612,
      );
      throw error;
    }
  }

  /**
   * Alt koleksiyondaki belgeleri getirme
   * @param parentCollection Üst koleksiyon adı
   * @param parentId Üst belge ID'si
   * @param subCollection Alt koleksiyon adı
   * @returns Alt koleksiyondaki belge dizisi
   */
  async findSubCollection<T>(
    parentCollection: string,
    parentId: string,
    subCollection: string,
  ): Promise<Array<T & { id: string }>> {
    try {
      const querySnapshot = await this.firestore
        .collection(parentCollection)
        .doc(parentId)
        .collection(subCollection)
        .get();

      return querySnapshot.docs.map((doc) => ({
        ...(doc.data() as T),
        id: doc.id,
      }));
    } catch (error) {
      this.logger.error(
        `Firestore alt koleksiyon getirme hatası: ${error.message}`,
        'FirebaseService.findSubCollection',
        __filename,
        641,
      );
      throw error;
    }
  }

  /**
   * Firestore transaction çalıştırır
   * @param updateFunction Transaction işlevi
   * @returns Transaction sonucu
   */
  async runTransaction<T>(
    updateFunction: (transaction: admin.firestore.Transaction) => Promise<T>,
  ): Promise<T> {
    try {
      // Use the Promise.resolve to ensure type safety
      return (await this.firestore.runTransaction(updateFunction)) as T;
    } catch (error) {
      this.logger.error(`Transaction hatası: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Firestore batch işlemi başlatır
   * @returns Firestore WriteBatch nesnesi
   */
  createBatch(): FirebaseFirestore.WriteBatch {
    return this.firestore.batch();
  }

  /**
   * Koleksiyon referansı döndürür
   * @param collection Koleksiyon adı
   * @returns Koleksiyon referansı
   */
  collection(collection: string): FirebaseFirestore.CollectionReference {
    return this.firestore.collection(collection);
  }

  /**
   * Belge referansı döndürür
   * @param collection Koleksiyon adı
   * @param id Belge ID'si
   * @returns Belge referansı
   */
  doc(collection: string, id: string): FirebaseFirestore.DocumentReference {
    return this.firestore.collection(collection).doc(id);
  }

  /**
   * Atomik sayaç artırma/azaltma işlemi
   * @param collection Koleksiyon adı
   * @param id Belge ID'si
   * @param field Artırılacak/azaltılacak alan
   * @param value Artış/azalış değeri
   */
  async increment(
    collection: string,
    id: string,
    field: string,
    value: number,
  ): Promise<void> {
    try {
      const docRef = this.firestore.collection(collection).doc(id);

      // Transaction kullanarak atomik güncelleme
      await this.runTransaction(async (transaction) => {
        const doc = await transaction.get(docRef);

        if (!doc.exists) {
          throw new Error(`Belge bulunamadı: ${collection}/${id}`);
        }

        // Mevcut değeri al ve artır
        const currentValue = doc.data()?.[field] || 0;
        const newValue = currentValue + value;

        transaction.update(docRef, { [field]: newValue });
        return newValue;
      });
    } catch (error) {
      this.logger.error(
        `Increment işlemi başarısız: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Diziye eleman ekleme işlemi
   * @param collection Koleksiyon adı
   * @param id Belge ID'si
   * @param field Dizi alanının adı
   * @param value Eklenecek değer veya değerler
   */
  async arrayUnion<T>(
    collection: string,
    id: string,
    field: string,
    value: T | T[],
  ): Promise<void> {
    try {
      const valueToAdd = Array.isArray(value)
        ? admin.firestore.FieldValue.arrayUnion(...value)
        : admin.firestore.FieldValue.arrayUnion(value);

      await this.firestore
        .collection(collection)
        .doc(id)
        .update({
          [field]: valueToAdd,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
      this.logger.error(
        `Firestore diziye eleman ekleme hatası: ${error.message}`,
        'FirebaseService.arrayUnion',
        __filename,
        758,
      );
      throw error;
    }
  }

  /**
   * Diziden eleman çıkarma işlemi
   * @param collection Koleksiyon adı
   * @param id Belge ID'si
   * @param field Dizi alanının adı
   * @param value Çıkarılacak değer veya değerler
   */
  async arrayRemove<T>(
    collection: string,
    id: string,
    field: string,
    value: T | T[],
  ): Promise<void> {
    try {
      const valueToRemove = Array.isArray(value)
        ? admin.firestore.FieldValue.arrayRemove(...value)
        : admin.firestore.FieldValue.arrayRemove(value);

      await this.firestore
        .collection(collection)
        .doc(id)
        .update({
          [field]: valueToRemove,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
      this.logger.error(
        `Firestore diziden eleman çıkarma hatası: ${error.message}`,
        'FirebaseService.arrayRemove',
        __filename,
        791,
      );
      throw error;
    }
  }

  /**
   * Veritabanında belge sayısını hesaplama
   * @param collection Koleksiyon adı
   * @param wheres Sorgulama koşulları dizisi [{field, operator, value}]
   * @returns Belge sayısı
   */
  async count(
    collection: string,
    wheres: Array<{
      field: string;
      operator: FirebaseFirestore.WhereFilterOp;
      value: any;
    }> = [],
  ): Promise<number> {
    try {
      let query: FirebaseFirestore.Query =
        this.firestore.collection(collection);

      // Filtreleri ekle
      wheres.forEach((where) => {
        query = query.where(where.field, where.operator, where.value);
      });

      const snapshot = await query.count().get();
      return snapshot.data().count;
    } catch (error) {
      this.logger.error(
        `Firestore sayım hatası: ${error.message}`,
        'FirebaseService.count',
        __filename,
        824,
      );
      throw error;
    }
  }

  /**
   * Find all documents in a collection that match a field value
   */
  async findAll<T>(
    collection: string,
    field: string,
    operator: admin.firestore.WhereFilterOp,
    value: any,
    orderBy?: string,
  ): Promise<T[]> {
    try {
      let query = this.firestore
        .collection(collection)
        .where(field, operator, value);

      if (orderBy) {
        query = query.orderBy(orderBy);
      }

      const querySnapshot = await query.get();

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];
    } catch (error) {
      this.logger.error(`Error in findAll: ${error.message}`, error.stack);
      throw error;
    }
  }
}
