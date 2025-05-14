import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
import { LoggerService } from '../common/services/logger.service';
import { FlowTrackerService } from '../common/services/flow-tracker.service';
import { LogMethod } from '../common/decorators';
import * as path from 'path';

@Injectable()
export class FirebaseService implements OnModuleInit {
  public auth: admin.auth.Auth;
  public firestore: admin.firestore.Firestore;
  public db: admin.firestore.Firestore;
  public storage: admin.storage.Storage;
  private readonly logger: LoggerService;
  private readonly flowTracker: FlowTrackerService;

  constructor() {
    this.logger = LoggerService.getInstance();
    this.flowTracker = FlowTrackerService.getInstance();
    this.flowTracker.trackStep(
      'Firebase servisini başlatma',
      'FirebaseService',
    );

    // Ortam değişkeni yerine doğrudan yolu kullan ve path.join ile çöz
    const serviceAccountFileName = 'firebase-service-account.json';
    // __dirname, çalışan JS dosyasının olduğu dizindir (dist/firebase)
    // ../../secrets/ yoluna ulaşmak için
    const absolutePath = path.join(
      __dirname,
      '../../secrets',
      serviceAccountFileName,
    );

    try {
      // Servis anahtarı dosyasının varlığını kontrol et (isteğe bağlı ama önerilir)
      // const serviceAccount = require(absolutePath); // Bu da bir yöntemdir
      // Veya fs modülü kullanılabilir: import * as fs from 'fs'; fs.existsSync(absolutePath)

      this.logger.info(
        `Firebase servis anahtarı yolu deneniyor: ${absolutePath}`,
        'FirebaseService.constructor',
      );

      // admin.apps kontrolünü initializeApp'ten önce yapmaya gerek yok,
      // initializeApp zaten tekrar başlatmayı engeller.
      admin.initializeApp({
        credential: admin.credential.cert(absolutePath),
        // Storage bucket'ı belirtmezsek Firebase otomatik olarak default bucket'ı kullanır
        // Bu formatlar denenebilir:
        // storageBucket: 'my-app-71530.appspot.com',
        // storageBucket: 'my-app-71530.appspot.com',
        // storageBucket: 'my-app-71530',
        // İsim olmadan da çalışabilir, bu durumda default bucket kullanılır
      });

      this.logger.info(
        'Firebase Admin başarıyla başlatıldı (Doğrudan Yol ile)',
        'FirebaseService.constructor',
        __filename,
        67, // Satır numarası yaklaşık
      );

      // Başlatma başarılıysa servisleri ata
      this.auth = admin.auth();
      this.firestore = admin.firestore();
      this.db = this.firestore;
      // Storage için bucket adı lazım olacak, şimdilik yorumda bırakalım veya varsayılanı kullanır
      try {
        this.storage = admin.storage(); // Varsayılan bucket'ı kullanmayı dener
        this.logger.info(
          'Storage servisi (varsayılan bucket) atandı.',
          'FirebaseService.constructor',
        );
      } catch (storageError) {
        this.logger.warn(
          `Varsayılan Storage bucket'ı başlatılamadı: ${storageError.message}. Storage işlemleri için bucket adı yapılandırılmalı.`,
          'FirebaseService.constructor',
        );
      }
    } catch (error) {
      this.logger.error(
        `Firebase Admin başlatılamadı (Doğrudan Yol ile): ${error.message}`,
        'FirebaseService.constructor',
        __filename,
        72, // Satır numarası yaklaşık
      );
      this.logger.error(
        `Lütfen ${absolutePath} yolunu ve dosya içeriğini kontrol edin. Kodun çalıştığı dizin: ${process.cwd()}, __dirname: ${__dirname}`,
        'FirebaseService.constructor',
        __filename,
        85, // Satır numarası yaklaşık
      );
      // Hata durumunda servislerin null/undefined kalmasını sağla
      // ve uygulamanın başlamasını engellemek isteyebilirsin: throw error;
    }
  }

  @LogMethod()
  async onModuleInit() {
    const startTime = Date.now();
    this.logger.info(
      'FirebaseService onModuleInit başlıyor',
      'FirebaseService.onModuleInit',
      __filename,
      93, // Satır numarası yaklaşık
    );

    // Bu kısım constructor'a taşındığı için kaldırıldı.
    // Gerekirse başka onModuleInit işlemleri buraya eklenebilir.

    // Servislerin constructor'da atanıp atanmadığını kontrol et (opsiyonel loglama)
    if (this.auth && this.firestore) {
      this.logger.info(
        'Firebase servisleri (Auth, Firestore) onModuleInit sırasında mevcut.',
        'FirebaseService.onModuleInit',
      );
    } else {
      this.logger.error(
        'Firebase servisleri onModuleInit sırasında EKSİK! Constructor başlatması başarısız olmuş olabilir.',
        'FirebaseService.onModuleInit',
      );
    }

    this.logger.info(
      `FirebaseService onModuleInit tamamlandı (${Date.now() - startTime}ms)`,
      'FirebaseService.onModuleInit',
    );
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

      if (!this.storage) {
        throw new Error(
          'Firebase Storage servisi başlatılamadı veya mevcut değil.',
        );
      }
      const bucket = this.storage.bucket();
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
      return `https://storage.googleapis.com/${bucket.name}/${destination}`;
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

      if (!this.storage) {
        throw new Error(
          'Firebase Storage servisi başlatılamadı veya mevcut değil.',
        );
      }
      const bucket = this.storage.bucket();
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

      // Undefined değerleri filtreleme işlemi
      const filteredData = Object.entries(data).reduce((acc, [key, value]) => {
        // Undefined değilse değeri ekle
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const dataWithTimestamp = {
        ...filteredData,
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
  @LogMethod()
  async findOne<T>(
    collection: string,
    field: string,
    operator: FirebaseFirestore.WhereFilterOp,
    value: any,
  ): Promise<(T & { id: string }) | null> {
    const startTime = Date.now();
    const logContext = 'FirebaseService.findOne';
    const operationDesc = `${collection} koleksiyonundan ${field} ${operator} ${value} için döküman alınıyor`;

    this.flowTracker.trackStep(operationDesc, 'FirebaseService');

    try {
      const collectionRef = this.firestore.collection(collection);
      const querySnapshot = await collectionRef
        .where(field, operator, value)
        .limit(1)
        .get();

      const endTime = Date.now();
      this.flowTracker.trackDbOperation(
        'READ',
        collection,
        endTime - startTime,
        'FirebaseService.findOne',
      );

      if (querySnapshot.empty) {
        this.logger.debug(
          `Döküman bulunamadı: ${operationDesc}`,
          logContext,
          __filename,
          455,
        );
        return null;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data() as T;

      this.logger.debug(
        `Döküman bulundu: ${doc.id}`,
        logContext,
        __filename,
        468,
        { documentId: doc.id },
      );

      return {
        id: doc.id,
        ...data,
      };
    } catch (error) {
      this.logger.logError(error, logContext, {
        collection,
        field,
        operator,
        value,
        additionalInfo: 'findOne işlemi sırasında hata oluştu',
      });
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
