# Firestore İndeks Optimizasyonu

Bu belge, uygulamanın Firestore sorgularını optimize etmek için gereken indeksleri açıklar.

## Temel İndeks Optimizasyon Kuralları

1. Her bir koleksiyon için, otomatik olarak aşağıdaki indeksler oluşturulur:
   - Her bir alanın tek başına eşitlik sorgularında (`==`) kullanılması için tekli indeksler
   - `__name__` alanının (belge kimliği) sıralama (`orderBy`) sorguları için indeks

2. Aşağıdaki durumlarda kompozit indeksler gereklidir:
   - Birden fazla alan üzerinde filtreleme yaptığınızda (`where` koşulları)
   - Bir alan üzerinde filtreleme yaptıktan sonra başka bir alana göre sıralama yaptığınızda
   - Örneğin: `collection.where('courseId', '==', 'abc').orderBy('createdAt', 'desc')`

## Uygulama İçin Kompozit İndeksler

Aşağıdaki sorgular için kompozit indeksler oluşturulmalıdır:

### Kurslar (Courses)

```
collection: courses
fields:
  - userId (ascending)
  - createdAt (descending)
```

### Öğrenme Hedefleri (Learning Targets)

```
collection: learningTargets
fields:
  - courseId (ascending)
  - status (ascending)
```

```
collection: learningTargets
fields:
  - courseId (ascending)
  - createdAt (descending)
```

### Belgeler (Documents)

```
collection: documents
fields:
  - courseId (ascending)
  - userId (ascending)
  - createdAt (descending)
```

### Sınavlar (Quizzes)

```
collection: quizzes
fields:
  - courseId (ascending)
  - userId (ascending)
  - timestamp (descending)
```

```
collection: quizzes
fields:
  - userId (ascending)
  - timestamp (descending)
```

### Başarısız Sorular (Failed Questions)

```
collection: failedQuestions
fields:
  - courseId (ascending)
  - userId (ascending)
  - timestamp (descending)
```

## Firebase CLI ile İndeks Oluşturma

İndeksleri yerel olarak tanımlamak ve deploy etmek için Firebase CLI kullanabilirsiniz:

1. `firestore.indexes.json` dosyası oluşturun veya güncelleyin:

```json
{
  "indexes": [
    {
      "collectionGroup": "courses",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "learningTargets",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "courseId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "learningTargets",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "courseId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "documents",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "courseId", "order": "ASCENDING" },
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "quizzes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "courseId", "order": "ASCENDING" },
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "quizzes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "failedQuestions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "courseId", "order": "ASCENDING" },
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

2. İndeksleri deploy etmek için:

```bash
firebase deploy --only firestore:indexes
```

## Sorgu Optimizasyonu İpuçları

1. **Sıralanmış ve Filtrelenmiş Sorgular**: Bir sorgu hem `where` koşulları hem de `orderBy` ifadeleri içeriyorsa, kompozit indeks kullanın
2. **Verimli Sorgular İçin Filtreleri Sıralayın**: En kısıtlayıcı filtreleri önce kullanın
3. **İndeks Kullanımını Gözlemleyin**: Firebase Console üzerinden indeks kullanımı ve sorguların performansını izleyin
4. **Gereksiz İndeksleri Kaldırın**: Kullanılmayan indeksler hem bakım maliyeti hem de depolama maliyeti getirir

## Genel Kurallar

1. Eşitlik operatörleri (`==`) her zaman diğer operatörlerden (`>`, `>=`, `<`, `<=`) önce gelmelidir
2. Sorgu içinde en fazla bir alan için aralık operatörü kullanabilirsiniz
3. Karışık sıralama yönlerinde dikkatli olun (asc ve desc birlikte)

## İndeks Bakımı

Yeni sorgular eklediğinizde veya mevcut sorguları değiştirdiğinizde:

1. Firestore konsolunda beliren indeks uyarılarını takip edin
2. İndeks oluşturma için önerilen bağlantıyı kullanın
3. Veya manuel olarak JSON dosyanıza yeni indeksleri ekleyin

Bu indeks yapılandırmasıyla, uygulamanızın sorguları daha hızlı çalışacak ve Firebase'in indeks limitlerine uyacaktır. 