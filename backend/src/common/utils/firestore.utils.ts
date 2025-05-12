import {
  CollectionReference,
  DocumentReference,
  getFirestore,
  Firestore,
  WriteBatch,
  WhereFilterOp,
  QueryDocumentSnapshot,
  Query,
  DocumentData,
  WithFieldValue,
  PartialWithFieldValue,
} from 'firebase-admin/firestore';
import { LoggerService } from '../services/logger.service';
import { FlowTrackerService } from '../services/flow-tracker.service';

const logger = LoggerService.getInstance();
const flowTracker = FlowTrackerService.getInstance();

flowTracker.track('Firestore utils yükleniyor', 'firestore.utils');

/**
 * Firestore işlemleri için yardımcı fonksiyonlar
 * Bu fonksiyonlar, tekrarlanan işlemleri merkezi olarak yönetmek için kullanılır
 */

/**
 * Batch işlemlerini yönetmek için yardımcı fonksiyon
 * Firestore'un 500 işlem limitini aşmamak için chunklara böler
 *
 * @param batch Firestore WriteBatch nesnesi
 * @param items İşlem yapılacak öğeler listesi
 * @param operation Her öğe için uygulanacak işlem (batch ve öğe alır)
 * @param firestore Firestore instance
 */
export const handleBatchOperation = async <T>(
  batch: WriteBatch,
  items: T[],
  operation: (batch: WriteBatch, item: T) => void,
  firestore: Firestore,
): Promise<void> => {
  // Her 500 öğede bir batch commit (Firestore limiti)
  const BATCH_SIZE = 500;

  try {
    if (items.length <= BATCH_SIZE) {
      // Limit içindeyse direkt işlem yap
      items.forEach((item) => operation(batch, item));
      await batch.commit();
    } else {
      // Limit aşılıyorsa, chunklara böl
      for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const tempBatch = firestore.batch();
        const chunk = items.slice(i, i + BATCH_SIZE);
        chunk.forEach((item) => operation(tempBatch, item));
        await tempBatch.commit();
        logger.debug(
          `Batch işlemi tamamlandı: ${i} - ${i + chunk.length} / ${items.length}`,
          'firestore.utils.handleBatchOperation',
          __filename,
          49,
          { start: i, end: i + chunk.length, total: items.length },
        );
      }
    }
  } catch (error) {
    logger.error(
      `Batch işlemi sırasında hata: ${error.message}`,
      'firestore.utils.handleBatchOperation',
      __filename,
      58,
    );
    throw error;
  }
};

/**
 * Entity koleksiyonda var mı kontrol eder
 *
 * @param firestore Firestore referansı
 * @param collection Koleksiyon adı
 * @param field Sorgulanacak alan
 * @param value Alan değeri
 * @returns Eğer varsa true, yoksa false
 */
export const entityExists = async (
  firestore: Firestore,
  collection: string,
  field: string,
  value: any,
): Promise<boolean> => {
  try {
    const snapshot = await firestore
      .collection(collection)
      .where(field, '==', value)
      .limit(1)
      .get();

    return !snapshot.empty;
  } catch (error) {
    logger.error(
      `Entity kontrol sırasında hata: ${error.message}`,
      'firestore.utils.entityExists',
      __filename,
      85,
    );
    throw error;
  }
};

/**
 * Cascade silme işlemi için yardımcı fonksiyon
 * Bir ana belge ile ilişkili tüm alt belgeleri siler
 *
 * @param parentCollection Ana koleksiyon adı
 * @param parentId Ana belge ID'si
 * @param firestore Firestore referansı
 * @param relatedCollections İlişkili koleksiyonlar ve ilişki alanları
 */
export const cascadeDelete = async (
  parentCollection: string,
  parentId: string,
  firestore: Firestore,
  relatedCollections: Array<{
    collection: string;
    field: string;
    additionalWhere?: { field: string; value: any };
  }>,
): Promise<void> => {
  try {
    await firestore.runTransaction(async (transaction) => {
      // Ana belgeyi kontrol et
      const parentRef = firestore.collection(parentCollection).doc(parentId);
      const parentDoc = await transaction.get(parentRef);

      if (!parentDoc.exists) {
        throw new Error(`${parentCollection}/${parentId} bulunamadı`);
      }

      // Her ilişkili koleksiyonda silme işlemi
      for (const related of relatedCollections) {
        let query = firestore
          .collection(related.collection)
          .where(related.field, '==', parentId);

        // Ek where koşulu varsa ekle
        if (related.additionalWhere) {
          query = query.where(
            related.additionalWhere.field,
            '==',
            related.additionalWhere.value,
          );
        }

        const snapshot = await transaction.get(query);
        snapshot.docs.forEach((doc) => {
          transaction.delete(doc.ref);
        });

        logger.debug(
          `Cascade delete: ${related.collection} içinde ${snapshot.size} belge silindi`,
          'firestore.utils.cascadeDelete',
          __filename,
          141,
          { collection: related.collection, deletedCount: snapshot.size },
        );
      }

      // Ana belgeyi sil
      transaction.delete(parentRef);
    });
  } catch (error) {
    logger.error(
      `Cascade silme sırasında hata: ${error.message}`,
      'firestore.utils.cascadeDelete',
      __filename,
      153,
    );
    throw error;
  }
};

/**
 * Firestore belgelerini paginate etmek için yardımcı fonksiyon
 *
 * @param firestore Firestore referansı
 * @param collection Koleksiyon adı
 * @param whereConditions Where koşulları
 * @param orderBy Sıralama alanı ve yönü
 * @param limit Sayfa başına belge sayısı
 * @param startAfter Başlangıç belge snapshot'ı
 * @returns Belge array'i ve bir sonraki sayfa için cursor
 */
export const paginateFirestore = async <T>(
  firestore: Firestore,
  collection: string,
  whereConditions: Array<{
    field: string;
    operator: WhereFilterOp;
    value: any;
  }> = [],
  orderBy: { field: string; direction: 'asc' | 'desc' } = {
    field: 'createdAt',
    direction: 'desc',
  },
  limit: number = 10,
  startAfter?: QueryDocumentSnapshot,
): Promise<{
  items: Array<T & { id: string }>;
  nextCursor: QueryDocumentSnapshot | null;
}> => {
  try {
    let query: Query = firestore.collection(collection);

    // Where koşullarını ekle
    whereConditions.forEach((condition) => {
      query = query.where(condition.field, condition.operator, condition.value);
    });

    // Sıralama ekle
    query = query.orderBy(orderBy.field, orderBy.direction);

    // Başlangıç noktası varsa ekle
    if (startAfter) {
      query = query.startAfter(startAfter);
    }

    // Limit ekle
    query = query.limit(limit);

    // Sorguyu çalıştır
    const querySnapshot = await query.get();

    // Sonuçları ve sonraki sayfanın cursor'ını döndür
    return {
      items: querySnapshot.docs.map((doc) => ({
        ...(doc.data() as T),
        id: doc.id,
      })),
      nextCursor:
        querySnapshot.docs.length === limit
          ? querySnapshot.docs[querySnapshot.docs.length - 1]
          : null,
    };
  } catch (error) {
    logger.error(
      `Paginate işlemi sırasında hata: ${error.message}`,
      'firestore.utils.paginateFirestore',
      __filename,
      221,
    );
    throw error;
  }
};

/**
 * Koleksiyon referansı alır
 * @param collectionPath Koleksiyon yolu
 * @returns Koleksiyon referansı
 */
export function getCollection<T = any>(
  collectionPath: string,
): CollectionReference<T> {
  try {
    flowTracker.trackStep(
      `${collectionPath} koleksiyonu alınıyor`,
      'firestore.utils',
    );

    const firestore = getFirestore();
    const collection = firestore.collection(
      collectionPath,
    ) as CollectionReference<T>;

    logger.debug(
      `${collectionPath} koleksiyonu başarıyla alındı`,
      'firestore.utils.getCollection',
      __filename,
      32,
    );

    return collection;
  } catch (error) {
    logger.logError(error, 'firestore.utils.getCollection', {
      additionalInfo: `${collectionPath} koleksiyonu alınırken hata oluştu`,
      collectionPath,
    });
    throw error;
  }
}

/**
 * Belge referansı alır
 * @param collectionPath Koleksiyon yolu
 * @param documentId Belge ID'si
 * @returns Belge referansı
 */
export function getDocument<T extends DocumentData = DocumentData>(
  collectionPath: string,
  documentId: string,
): DocumentReference<T> {
  try {
    flowTracker.trackStep(
      `${collectionPath}/${documentId} belgesi alınıyor`,
      'firestore.utils',
    );

    const collection = getCollection<T>(collectionPath);
    const document = collection.doc(documentId) as DocumentReference<T>;

    logger.debug(
      `${collectionPath}/${documentId} belgesi başarıyla alındı`,
      'firestore.utils.getDocument',
      __filename,
      65,
    );

    return document;
  } catch (error) {
    logger.logError(error, 'firestore.utils.getDocument', {
      additionalInfo: `${collectionPath}/${documentId} belgesi alınırken hata oluştu`,
      collectionPath,
      documentId,
    });
    throw error;
  }
}

/**
 * Belgeyi okur
 * @param collectionPath Koleksiyon yolu
 * @param documentId Belge ID'si
 * @returns Belge verisi veya null
 */
export async function readDocument<T extends DocumentData = DocumentData>(
  collectionPath: string,
  documentId: string,
): Promise<T | null> {
  try {
    flowTracker.trackStep(
      `${collectionPath}/${documentId} belgesi okunuyor`,
      'firestore.utils',
    );

    const docRef = getDocument<T>(collectionPath, documentId);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      logger.info(
        `${collectionPath}/${documentId} belgesi bulunamadı`,
        'firestore.utils.readDocument',
        __filename,
        101,
      );
      return null;
    }

    logger.debug(
      `${collectionPath}/${documentId} belgesi başarıyla okundu`,
      'firestore.utils.readDocument',
      __filename,
      109,
    );

    return snapshot.data() as T;
  } catch (error) {
    logger.logError(error, 'firestore.utils.readDocument', {
      additionalInfo: `${collectionPath}/${documentId} belgesi okunurken hata oluştu`,
      collectionPath,
      documentId,
    });
    throw error;
  }
}

/**
 * Belge oluşturur veya günceller
 * @param collectionPath Koleksiyon yolu
 * @param documentId Belge ID'si
 * @param data Belge verisi
 * @param merge Varolan belgeyi güncellerken alanları birleştir
 * @returns İşlem sonucu
 */
export async function writeDocument<T extends DocumentData = DocumentData>(
  collectionPath: string,
  documentId: string,
  data: T,
  merge = true,
): Promise<void> {
  try {
    flowTracker.trackStep(
      `${collectionPath}/${documentId} belgesi yazılıyor`,
      'firestore.utils',
    );

    const docRef = getDocument(collectionPath, documentId);
    await docRef.set(data, { merge });

    logger.debug(
      `${collectionPath}/${documentId} belgesi başarıyla yazıldı`,
      'firestore.utils.writeDocument',
      __filename,
      148,
      { merge },
    );
  } catch (error) {
    logger.logError(error, 'firestore.utils.writeDocument', {
      additionalInfo: `${collectionPath}/${documentId} belgesi yazılırken hata oluştu`,
      collectionPath,
      documentId,
      merge,
    });
    throw error;
  }
}

/**
 * Belgeyi siler
 * @param collectionPath Koleksiyon yolu
 * @param documentId Belge ID'si
 * @returns İşlem sonucu
 */
export async function deleteDocument(
  collectionPath: string,
  documentId: string,
): Promise<void> {
  try {
    flowTracker.trackStep(
      `${collectionPath}/${documentId} belgesi siliniyor`,
      'firestore.utils',
    );

    const docRef = getDocument(collectionPath, documentId);
    await docRef.delete();

    logger.debug(
      `${collectionPath}/${documentId} belgesi başarıyla silindi`,
      'firestore.utils.deleteDocument',
      __filename,
      184,
    );
  } catch (error) {
    logger.logError(error, 'firestore.utils.deleteDocument', {
      additionalInfo: `${collectionPath}/${documentId} belgesi silinirken hata oluştu`,
      collectionPath,
      documentId,
    });
    throw error;
  }
}

/**
 * Koleksiyondaki tüm belgeleri alır
 * @param collectionPath Koleksiyon yolu
 * @returns Belge dizisi
 */
export async function getAllDocuments<T = any>(
  collectionPath: string,
): Promise<T[]> {
  try {
    flowTracker.trackStep(
      `${collectionPath} koleksiyonundaki tüm belgeler alınıyor`,
      'firestore.utils',
    );

    const collection = getCollection<T>(collectionPath);
    const snapshot = await collection.get();

    const documents = snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as unknown as T,
    );

    logger.debug(
      `${collectionPath} koleksiyonundan ${documents.length} belge başarıyla alındı`,
      'firestore.utils.getAllDocuments',
      __filename,
      220,
    );

    return documents;
  } catch (error) {
    logger.logError(error, 'firestore.utils.getAllDocuments', {
      additionalInfo: `${collectionPath} koleksiyonundaki belgeler alınırken hata oluştu`,
      collectionPath,
    });
    throw error;
  }
}
