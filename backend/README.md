# Kişiselleştirilmiş Quiz Platformu - Backend

Bu proje, PRD v8.3 gereksinimlerine göre geliştirilmiş NestJS tabanlı bir backend uygulamasıdır. Platform, öğrenme hedeflerini takip eden, dökümanlardan konu çıkarımı yapan ve kullanıcı özelinde kişiselleştirilmiş sınavlar oluşturan bir API sunar.

## Özellikler

- Firebase Authentication ile güvenli kullanıcı yönetimi
- Firebase Firestore ile veritabanı işlemleri
- Google Gemini AI ile doküman analizi ve soru üretimi
- Firebase Storage ile doküman depolama
- PDF, DOCX ve TXT dosyalarından metin çıkarımı
- Kişiselleştirilmiş sınav oluşturma ve analiz etme
- Öğrenme hedeflerini takip etme ve ilerleme raporlama
- RESTful API ve Swagger dokümantasyonu

## Teknik Yığın

- [NestJS](https://nestjs.com/) - Backend framework
- [TypeScript](https://www.typescriptlang.org/) - Programlama dili
- [Firebase Authentication](https://firebase.google.com/products/auth) - Kimlik doğrulama
- [Firebase Firestore](https://firebase.google.com/products/firestore) - Veritabanı
- [Firebase Storage](https://firebase.google.com/products/storage) - Dosya depolama
- [Google Gemini API](https://ai.google.dev/) - Yapay zeka entegrasyonu

## Kurulum

### Ön Gereksinimler

- Node.js 18+ ve npm
- Firebase projesi ve servis hesabı anahtarı
- Google Gemini API anahtarı

### Adımlar

1. Projeyi klonlayın:

```bash
git clone https://github.com/yourusername/quiz-platform-backend.git
cd quiz-platform-backend
```

2. Bağımlılıkları yükleyin:

```bash
npm install
npm install firebase-admin
```

3. `.env` dosyasını oluşturun (örnek olarak `.env.example` dosyasını kullanabilirsiniz):

```bash
cp .env.example .env
```

4. `.env` dosyasını kendi bilgilerinizle düzenleyin.

5. Firebase servis hesabı anahtarınızı uygun konuma yerleştirin.

6. Uygulamayı geliştirme modunda başlatın:

```bash
npm run start:dev
```

## API Dokümantasyonu

Uygulama çalıştığında, Swagger API dokümantasyonuna şu adresten erişebilirsiniz:

```
http://localhost:3001/api/docs
```

## Ana Endpoint'ler

- `POST /api/auth/register` - Yeni kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı girişi
- `GET/POST /api/courses` - Ders yönetimi
- `POST /api/documents/upload` - Belge yükleme
- `POST /api/learning-targets/detect-topics` - Konuları tespit etme
- `POST /api/quizzes/generate` - Sınav oluşturma
- `POST /api/quizzes/submit` - Sınav yanıtlarını kaydetme ve analiz etme

## Geliştirme

### Testleri Çalıştırma

```bash
# Birim testleri
npm run test

# E2E testleri
npm run test:e2e

# Test coverage
npm run test:cov
```

### Derleme

```bash
npm run build
```

### Canlı Ortama Dağıtım

```bash
npm run start:prod
```

## Lisans

Bu proje [MIT lisansı](LICENSE) altında lisanslanmıştır.

## Mimarinin Özeti

- **Kimlik Doğrulama:** Firebase Auth
- **Veri Tabanı:** Firebase Firestore
- **Backend:** NestJS
- **Dosya Depolama:** Firebase Storage

## Kurulum Adımları

### 1. Gerekli Paketler

```sh
npm install
npm install firebase-admin
```

### 2. .env Dosyası

Aşağıdaki gibi bir `.env` dosyası oluşturun:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="your-private-key"
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
GEMINI_API_KEY=your-google-ai-key
```

### 3. Firebase Admin SDK Kurulumu

Firebase Admin için servis hesabı anahtarınızı indirin ve güvenli bir şekilde saklayın. Bilgilerini `.env` dosyasında belirtin.

### 4. Firebase Admin Başlatma (Örnek)

FirebaseService sınıfı otomatik olarak Firebase Admin SDK'yı başlatır ve aşağıdaki servisleri sağlar:

- Authentication (auth)
- Firestore (firestore)
- Storage (storage)
- Realtime Database (db)

### 5. Auth Guard (örnek)

```ts
// src/auth/firebase-auth.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private firebaseService: FirebaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split('Bearer ')[1];
    if (!token) throw new UnauthorizedException('Token yok');
    try {
      const decoded = await this.firebaseService.verifyIdToken(token);
      request.user = decoded;
      return true;
    } catch {
      throw new UnauthorizedException('Geçersiz token');
    }
  }
}
```

### 6. Firebase Auth ve Firestore Kullanımı

```ts
// src/users/users.service.ts
async findOrCreateUser(firebaseUser: { uid: string; email: string }) {
  // Firestore'da kullanıcıyı ara
  let user = await this.firebaseService.findOne('users', 'firebaseUid', '==', firebaseUser.uid);
  if (!user) {
    // Kullanıcı yoksa yeni kullanıcı oluştur
    user = await this.firebaseService.create('users', {
      firebaseUid: firebaseUser.uid,
      email: firebaseUser.email,
      // diğer alanlar...
    });
  }
  return user;
}
```

### 7. Frontend'den API'ye İstek

Kullanıcı giriş yaptıktan sonra alınan Firebase ID Token'ı backend'e şu şekilde gönderin:

```
Authorization: Bearer <FIREBASE_ID_TOKEN>
```

## Firebase Entegrasyonu

Bu proje, veritabanı işlemleri için Firebase Firestore kullanmaktadır. Firebase yapılandırmasını tamamlamak için aşağıdaki adımları izleyin:

### Firebase Projesi Oluşturma

1. [Firebase Console](https://console.firebase.google.com/)'a gidin ve bir hesap oluşturun veya mevcut hesabınızla giriş yapın.
2. "Proje ekle" butonuna tıklayın ve yeni bir proje oluşturun.
3. Firestore veritabanını başlatın (Firestore Database -> Create Database).
4. Authentication hizmetini etkinleştirin ve istediğiniz giriş yöntemlerini (e-posta/şifre, Google, vb.) ayarlayın.
5. Storage hizmetini kurarak dosya depolama için hazırlayın.

### Firebase Admin SDK Kurulumu

#### 1. Yöntem: Güvenli Base64 Kodlanmış Servis Hesabı (Önerilen)

1. Firebase konsolunda "Proje ayarları -> Servis hesapları" kısmına gidin.
2. "Firebase Admin SDK" altında "Node.js" seçeneğini seçin.
3. "Yeni özel anahtar oluştur" butonuna tıklayarak bir JSON dosyası indirin.
4. Bu JSON dosyasını base64 formatına dönüştürün:

```sh
# Linux/Mac terminalinde
cat path/to/your-service-account-key.json | base64

# Windows PowerShell'de
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($(Get-Content -Raw -Path "path\to\your-service-account-key.json")))
```

5. Elde edilen base64 string'ini `.env` dosyanızda `FIREBASE_SERVICE_ACCOUNT_BASE64` olarak saklayın:

```
FIREBASE_SERVICE_ACCOUNT_BASE64=VGhpcyBpcyBqdXN0IGFuIGV4YW1wbGUgYmFzZTY0IHN0cmluZw==
```

#### 2. Yöntem: Ayrı Ortam Değişkenleri (Alternatif)

Bu yöntem hala desteklenmektedir, ancak yukarıdaki base64 yöntemi daha güvenli ve kullanışlıdır.

1. `.env` dosyanızda aşağıdaki değişkenleri ayarlayın:

```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="your-private-key"
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

Not: `FIREBASE_PRIVATE_KEY` değeri, indirdiğiniz JSON dosyasında bulunan `private_key` değeridir. Bu değeri tırnak işaretleri içinde kullanmayı unutmayın.

### Firestore İndeksleme

Uygulamanın performanslı çalışması için aşağıdaki Firestore indekslerini oluşturmanız gerekmektedir:

#### Tekli Alanlar İndeksleri

- `users` koleksiyonu → `firebaseUid` alanı (ascending)

#### Bileşik İndeksler

- `courses` koleksiyonu → `userId` (ascending) + `createdAt` (descending)
- `quizzes` koleksiyonu → `userId` (ascending) + `courseId` (ascending) + `createdAt` (descending)
- `quizzes` koleksiyonu → `userId` (ascending) + `createdAt` (descending)
- `learning_targets` koleksiyonu → `userId` (ascending) + `courseId` (ascending) + `status` (ascending) + `createdAt` (descending)
- `learning_targets` koleksiyonu → `userId` (ascending) + `status` (ascending) + `createdAt` (descending)
- `documents` koleksiyonu → `userId` (ascending) + `courseId` (ascending) + `createdAt` (descending)

Bu indeksleri Firebase konsolunda "Firestore Database -> Indexes" bölümünden manuel olarak ekleyebilir veya API ilk kez kullanıldığında alınan hata mesajındaki bağlantıyı takip ederek otomatik olarak oluşturabilirsiniz.

### Firestore Yapılandırması

Firebase'de şu koleksiyonları kurmalısınız:

- `users` - Kullanıcı bilgileri
- `courses` - Kurs bilgileri
- `learning_targets` - Öğrenme hedefleri
- `quizzes` - Sınav bilgileri
- `failed_questions` - Başarısız soru kayıtları
- `documents` - Belge metadata

Indexleme gereksinimleri için aşağıdaki bileşik indeksleri oluşturun:

1. `quizzes` koleksiyonu:

   - `userId` ASC, `courseId` ASC, `timestamp` DESC

2. `learning_targets` koleksiyonu:

   - `courseId` ASC, `subTopicName` ASC

3. `failed_questions` koleksiyonu:

   - `userId` ASC, `normalizedSubTopicName` ASC, `failedTimestamp` DESC

4. `documents` koleksiyonu:
   - `userId` ASC, `courseId` ASC, `createdAt` DESC

### Güvenlik Kuralları

Firestore güvenlik kurallarını aşağıdaki gibi ayarlayın:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Kullanıcılar sadece kendi verilerine erişebilir
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.firebaseUid;
    }

    // Kurslar
    match /courses/{courseId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }

    // Öğrenme hedefleri
    match /learning_targets/{targetId} {
      allow read, write: if request.auth != null &&
                        exists(/databases/$(database)/documents/courses/$(resource.data.courseId)) &&
                        get(/databases/$(database)/documents/courses/$(resource.data.courseId)).data.userId == request.auth.uid;
    }

    // Diğer koleksiyonlar için benzer kurallar...
  }
}
```

### Storage Kuralları

Firebase Storage için aşağıdaki güvenlik kurallarını ayarlayın:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allFiles=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /courses/{courseId}/{allFiles=**} {
      allow read, write: if request.auth != null &&
                         exists(/databases/$(database)/documents/courses/$(courseId)) &&
                         get(/databases/$(database)/documents/courses/$(courseId)).data.userId == request.auth.uid;
    }
  }
}
```

---

Daha fazla detay ve örnek için kodu inceleyin veya sorularınızı iletin.

## Ortam Değişkenleri (Environment Variables)

Projenin düzgün çalışması için aşağıdaki ortam değişkenlerinin tanımlanması gerekmektedir.
Bu değişkenleri `.env` dosyasında tanımlayabilirsiniz.

### Temel Yapılandırma

| Değişken      | Açıklama                                        | Örnek                   |
| ------------- | ----------------------------------------------- | ----------------------- |
| `PORT`        | API'nin çalışacağı port                         | `3001`                  |
| `NODE_ENV`    | Uygulama ortamı (development, test, production) | `development`           |
| `CORS_ORIGIN` | CORS izinleri için origin                       | `http://localhost:3000` |

### Firebase Yapılandırması

| Değişken                            | Açıklama                             | Zorunlu |
| ----------------------------------- | ------------------------------------ | ------- |
| `FIREBASE_PROJECT_ID`               | Firebase proje ID'si                 | Evet    |
| `FIREBASE_PRIVATE_KEY`              | Firebase özel anahtarı               | Evet    |
| `FIREBASE_CLIENT_EMAIL`             | Firebase istemci e-posta adresi      | Evet    |
| `FIREBASE_DATABASE_URL`             | Firebase Realtime Database URL'si    | Hayır   |
| `FIREBASE_STORAGE_BUCKET`           | Firebase Storage bucket adı          | Evet    |
| `FIREBASE_SERVICE_ACCOUNT_KEY_JSON` | Firebase servis hesabı JSON anahtarı | Evet    |

### Google Gemini API Yapılandırması

| Değişken         | Açıklama                   | Zorunlu |
| ---------------- | -------------------------- | ------- |
| `GEMINI_API_KEY` | Google Gemini API anahtarı | Evet    |

### Önbellekleme (Caching) Yapılandırması

| Değişken            | Açıklama                                  | Varsayılan |
| ------------------- | ----------------------------------------- | ---------- |
| `CACHE_TTL_SECONDS` | Önbellek giriş süresi (saniye)            | `300`      |
| `CACHE_MAX_ITEMS`   | Önbellekte saklanacak maksimum öğe sayısı | `100`      |

### Hata İzleme (Sentry) Yapılandırması

| Değişken      | Açıklama                      | Zorunlu          |
| ------------- | ----------------------------- | ---------------- |
| `SENTRY_DSN`  | Sentry Data Source Name (DSN) | Evet (prod için) |
| `APP_VERSION` | Uygulama versiyonu            | Hayır            |

## Önemli Notlar

1. `GEMINI_API_KEY`: Yapay zeka özellikleri (konu tespiti, soru üretimi vb.) için Google Gemini API anahtarı gereklidir. Anahtar olmadan bu özellikler çalışmaz.
2. `FIREBASE_SERVICE_ACCOUNT_KEY_JSON`: Firebase kimlik doğrulama ve veritabanı işlemleri için gereklidir. Firebase Console'dan servis hesabı anahtarını JSON formatında alabilirsiniz.
3. Güvenlik için tüm API anahtarlarını ve hassas bilgileri ortam değişkenlerinde saklayın, kodunuza gömmeyin.

## Docker ile Çalıştırma

Bu proje, Docker kullanılarak kolayca çalıştırılabilir. Docker kullanmak, ortam bağımlılık sorunlarını ortadan kaldırır ve tüm geliştirme ekibinin aynı ortamda çalışmasını sağlar.

### Ön Gereksinimler

- [Docker](https://www.docker.com/products/docker-desktop) yüklü olmalı
- [Docker Compose](https://docs.docker.com/compose/install/) yüklü olmalı (Docker Desktop ile birlikte gelir)

### Docker ile Kullanım

Projeyi Docker ile çalıştırmak için aşağıdaki komutları kullanabilirsiniz:

```bash
# Tüm servisleri başlatmak için (ilk çalıştırmada imajları oluşturur)
npm run docker:up:build

# Değişikliklerden sonra yeniden başlatmak için
npm run docker:up

# Servisleri durdurmak için
npm run docker:down

# Logları izlemek için
npm run docker:logs
```

### Sorun Çözümü

#### Bağımlılık Sorunları

Docker containerı içinde bağımlılık sorunlarıyla karşılaşırsanız:

```bash
# Container içine girmek
docker exec -it quiz-platform-backend sh

# Container içinde bağımlılıkları yüklemek
npm install --legacy-peer-deps

# tslib sorunu için
npm install tslib
```

#### Yaygın Hatalar ve Çözümleri

1. **"tslib modülü bulunamadı" hatası**
   - Docker içinde otomatik olarak kontrol edilecek ve gerekirse yüklenecektir
   - Manuel çözüm: `docker exec -it quiz-platform-backend npm install tslib`

2. **NestJS modülleri arasında versiyon uyumsuzluğu**
   - Docker içinde tutarlı bir Node.js ortamı sağlanacaktır
   - Manuel çözüm: `docker exec -it quiz-platform-backend npm install @nestjs/common@X.X.X --legacy-peer-deps`

3. **Port çakışması**
   - `docker-compose.yml` dosyasında port ayarlarını değiştirin: `"3001:3000"`

4. **Container başlatılamıyor**
   - Logları kontrol edin: `npm run docker:logs`
   - Container'ı zorla yeniden oluşturun: `docker-compose up --force-recreate --build`
