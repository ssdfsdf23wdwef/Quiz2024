/**
 * Eksik tip tanımlamaları için declaration dosyası
 */

// Eksik paketler için boş tip tanımlamaları
declare module 'helmet';
declare module 'compression';
declare module 'passport-jwt';
declare module '@nestjs/jwt';
declare module '@ntegral/nestjs-sentry';
declare module '@nestjs/swagger';
declare module 'swagger-ui-express';
declare module '@nestjs/cache-manager';
declare module 'pdf-parse';
declare module 'mammoth';

// cache-manager için genişletilmiş tip tanımları
declare module 'cache-manager' {
  export interface Cache {
    get<T>(key: string): Promise<T | undefined>;
    set<T>(key: string, value: T, options?: { ttl?: number }): Promise<void>;
    del(key: string): Promise<void>;
    reset(): Promise<void>;
    wrap<T>(
      key: string,
      fn: () => Promise<T>,
      options?: { ttl?: number },
    ): Promise<T>;
  }
}

// Firebase-admin için namespace tiplerini tanımla
declare namespace FirebaseFirestore {
  type WhereFilterOp =
    | '<'
    | '<='
    | '=='
    | '>='
    | '>'
    | 'array-contains'
    | 'array-contains-any'
    | 'in'
    | 'not-in';

  interface Query {
    where(field: string, op: WhereFilterOp, value: any): Query;
    orderBy(field: string, direction?: 'asc' | 'desc'): Query;
    limit(limit: number): Query;
    startAfter(snapshot: QueryDocumentSnapshot): Query;
    get(): Promise<QuerySnapshot>;
  }

  interface QuerySnapshot {
    empty: boolean;
    size: number;
    docs: QueryDocumentSnapshot[];
  }

  interface QueryDocumentSnapshot {
    id: string;
    ref: DocumentReference;
    exists: boolean;
    data(): any;
  }

  interface DocumentReference {
    id: string;
    path: string;
    get(): Promise<DocumentSnapshot>;
    set(data: any): Promise<WriteResult>;
    update(data: any): Promise<WriteResult>;
    delete(): Promise<WriteResult>;
  }

  interface DocumentSnapshot {
    id: string;
    ref: DocumentReference;
    exists: boolean;
    data(): any;
  }

  interface CollectionReference extends Query {
    doc(documentPath?: string): DocumentReference;
    add(data: any): Promise<DocumentReference>;
  }

  interface WriteBatch {
    set(documentRef: DocumentReference, data: any): WriteBatch;
    update(documentRef: DocumentReference, data: any): WriteBatch;
    delete(documentRef: DocumentReference): WriteBatch;
    commit(): Promise<any>;
  }

  interface WriteResult {
    writeTime: FirebaseFirestore.Timestamp;
  }

  interface Timestamp {
    toDate(): Date;
    toMillis(): number;
    valueOf(): number;
    isEqual(other: Timestamp): boolean;
  }
}
