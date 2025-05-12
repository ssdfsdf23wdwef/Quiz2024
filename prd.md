---

## **Kişiselleştirilmiş Quiz Platformu - Ürün Gereksinim Dokümanı (PRD)**


**İçindekiler**

1.  **Giriş ve Kapsam**
    * 1.1. Platform Vizyonu
    * 1.2. Temel Çalışma Prensibi
    * 1.3. Hedef Kullanıcı Kitlesi
2.  **Temel Kavramlar ve Terminoloji**
3.  **Genel Kullanıcı Akışı**
4.  **Platform Yetenekleri ve Özellikler**
    * 4.1. Kullanıcı Yönetimi
    * 4.2. Ders (Çalışma Alanı) Yönetimi
    * 4.3. İçerik Yönetimi ve İşleme
    * 4.4. Yapay Zeka Destekli Analiz ve İçerik Üretimi
    * 4.5. Öğrenme Hedefleri (Learning Targets) ve Takibi
    * 4.6. Sınav (Quiz) Sistemi
    * 4.7. Performans Değerlendirme ve Geri Bildirim
5.  **Kullanıcı Deneyimi (UX/UI) ve Tasarım**
6.  **Teknik Mimari ve Teknoloji Seçimleri**
    * 6.1. Genel Mimari Yaklaşımı
    * 6.2. Teknoloji Yığını
    * 6.3. Frontend Mimarisi (Next.js)
    * 6.4. Backend Mimarisi (NestJS)
    * 6.5. Veritabanı ve Veri Yönetimi
    * 6.6. API İletişimi (REST)
    * 6.7. Alt Konu Normalizasyonu
    * 6.8. Performans, Ölçeklenebilirlik ve Maliyet
7.  **Veri Modelleri (Firestore Önerisi)**
8.  **Kalite Güvencesi ve Güvenlik**
    * 8.1. Test Stratejisi
    * 8.2. Kod Kalitesi Standartları
    * 8.3. Güvenlik Öncelikleri ve Stratejileri
9.  **Geliştirme Yol Haritası (Aşamalandırma)**
10. **Potansiyel Riskler ve Yönetim Stratejileri**

---

### **1. Giriş ve Kapsam**

#### **1.1. Platform Vizyonu**

Kullanıcıların kişisel öğrenme materyallerini (PDF, DOCX, TXT formatlarında, 10 MB'a kadar) sisteme yükleyerek, yapay zeka (AI) destekli, kişiselleştirilmiş sınavlar oluşturmalarını sağlayan yenilikçi bir web platformu geliştirmek. Platform, kullanıcının seçtiği **Ders (Course)** bağlamında, yüklenen içerikleri ve geçmiş sınav performansını analiz ederek, öğrenilmesi gereken **Alt Konular** bazında tanımlanan **Öğrenme Hedefleri** üzerindeki yeterliliğini **dört aşamalı bir durum (`beklemede`, `başarısız`, `orta`, `başarılı`)** ile takip eder. Temel amaç, öğrenme sürecini optimize etmek, kullanıcının bilgi eksikliklerini belirlemesine yardımcı olmak ve geçmiş hatalardan ders çıkararak sürekli gelişimi teşvik eden modern bir eğitim aracı sunmaktır.

#### **1.2. Temel Çalışma Prensibi**

Platformun özü, öğrenme deneyimini kullanıcıya ve içeriğe özel kılmaktır. Bu, dinamik bir döngü ile gerçekleştirilir:

**İçerik Yükleme → AI Konu Analizi → Kullanıcı Konu Seçimi → Öğrenme Hedefi Oluşturma/Güncelleme → Kişiselleştirilmiş Sınav → Performans Analizi → Öğrenme Hedefi Durum Güncellemesi.**

Sistem, **Öğrenme Hedefleri** olarak tanımlanan Alt Konuları dinamik olarak yönetir, kullanıcının bu hedeflerdeki ilerlemesini **4 aşamalı durum (status)** göstergesiyle izler ve her **Kişiselleştirilmiş Sınav** sonrasında bu durumları güncelleyerek adaptif bir öğrenme ortamı sağlar. Ayrıca, yanlış cevaplanan sorular kaydedilerek tekrar çalışma imkanı sunulur.

#### **1.3. Hedef Kullanıcı Kitlesi**

Platform, öğrenciler, mesleki gelişimini sürdüren profesyoneller, sürekli öğrenmeyi hedefleyen bireyler ve yaşam boyu öğrenme felsefesini benimsemiş herkes için tasarlanmıştır.

---

### **2. Temel Kavramlar ve Terminoloji**

| Kavram                               | Açıklama                                                                                                                                                                                                                                                                                                      |
| :----------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Kullanıcı (User)**                 | Platforma kimlik doğrulaması yaparak giriş yapan ve öğrenme süreçlerini yöneten birey.                                                                                                                                                                                                                        |
| **Ders (Course)**                    | Kullanıcının öğrenme materyallerini, hedeflerini ve sınav verilerini gruplandırdığı mantıksal çalışma alanı veya konu başlığı (örn: “Yazılım Mimarisi”, “İleri İstatistik”). **Çalışma Alanı** olarak da ifade edilebilir.                                                                                    |
| **İçerik Öğesi (Belge)**             | Kullanıcının bir Derse yüklediği PDF, DOCX veya TXT formatındaki, en fazla 10 MB boyutundaki dosya. Metin içeriği önceliklidir; görsellerdeki veya karmaşık tablolardaki metinlerin işlenmesi sınırlıdır.                                                                                                     |
| **Konu / Alt Konu**                  | Yapay zekanın yüklenen belgeden analiz ederek çıkardığı, **en fazla iki seviyeli** (Ana Konu → Alt Konu) kavramsal hiyerarşi. Başlıklar kısa, standart ve öğrenilebilir/test edilebilir **kavramsal** bilgiyi temsil etmelidir. Bu Alt Konular, Öğrenme Hedeflerinin temelini oluşturur.                      |
| **Öğrenme Hedefi (Learning Target)** | Belirli bir **Ders** içerisindeki bir **Alt Konu** için **Kullanıcının** yeterlilik seviyesini gösteren kayıttır. Her hedefin dört durumdan birini (`pending`, `failed`, `medium`, `mastered`) gösteren bir **`status`** alanı bulunur. Hedefler, **normalize edilmiş alt konu adı** (Bkz 6.7) ile yönetilir. |
| **Sınav (Quiz)**                     | Öğrenme hedeflerini ölçmek veya yüklenen içeriği değerlendirmek amacıyla oluşturulan testtir. Türleri: **Hızlı Sınav** ve **Kişiselleştirilmiş Sınavlar** (alt türleri: Zayıf-Orta Odaklı, Yeni Konu Odaklı, Kapsamlı).                                                                                       |

---

### **3. Genel Kullanıcı Akışı**

1.  **Kimlik Doğrulama:** Kullanıcı, e-posta/şifre veya Google hesabı ile platforma kaydolur veya giriş yapar. (Kişiselleştirilmiş özellikler için giriş zorunludur).
2.  **Ders Yönetimi:** Kullanıcı yeni bir Ders (Çalışma Alanı) oluşturur veya mevcut bir dersi seçerek çalışma ortamına girer.
3.  **İçerik Yükleme:** Kullanıcı, aktif Derse bir Belge (PDF, DOCX, TXT) yükler. Backend (NestJS), belgeyi işleyerek metin içeriğini çıkarır.
4.  **Konu Analizi ve Seçimi:**
    - Backend, çıkarılan metni AI'ye (Gemini) göndererek potansiyel Alt Konuları tespit eder (varsa mevcut hedefleri filtreleyerek).
    - Başarılı tespitte, yeni Alt Konular frontend'deki **Konu Seçim Ekranı**'nda kullanıcıya sunulur. Kullanıcı sınava dahil edilecek konuları onaylar veya seçer.
    - Başarısız tespitte kullanıcı bilgilendirilir ve süreç durdurulur.
5.  **Öğrenme Hedefi Yönetimi:** Seçilen her yeni Alt Konu için backend, ilgili Ders altında `status: 'pending'` ile bir Öğrenme Hedefi kaydı oluşturur (veya mevcut hedefi eşleştirir).
6.  **Sınav Başlatma:** Kullanıcı, ihtiyacına uygun Sınav Modunu (Hızlı veya Kişiselleştirilmiş türlerden biri) ve sınav ayarlarını (soru sayısı, zorluk vb.) seçerek sınavı başlatır.
7.  **Soru Üretimi:** Backend, seçilen mod, ayarlar, ilgili Öğrenme Hedeflerinin durumu ve (gerekiyorsa) belge içeriğine göre AI'ye (Gemini) soruları ürettirir.
8.  **Sınav Çözme:** Sorular frontend arayüzünde kullanıcıya sunulur ve cevaplar kaydedilir.
9.  **Sınav Tamamlama ve Analiz:** Sınav bittiğinde veya süre dolduğunda, cevaplar backend'e gönderilir ve değerlendirilir.
    - Genel skor ve alt konu bazlı performans hesaplanır.
    - Yanlış cevaplanan sorular kaydedilir (`FailedQuestion` koleksiyonu).
    - **Kişiselleştirilmiş Sınavlar:** Analiz sonuçları oluşturulur ve ilgili Öğrenme Hedeflerinin `status` değerleri güncellenir.
    - Sınav kaydı (`Quiz` koleksiyonu) veritabanına yazılır.
10. **Sonuç Görüntüleme ve Takip:** Kullanıcı, sınav sonuçlarını ve (varsa) detaylı analizi frontend'de görür. **Öğrenme Takip Sayfası** üzerinden Ders bazlı genel ilerlemesini ve hedeflerinin güncel durumunu izleyebilir.

---

### **4. Platform Yetenekleri ve Özellikler**

#### **4.1. Kullanıcı Yönetimi**

- **4.1.1. Kimlik Doğrulama:** Güvenli kullanıcı kaydı, girişi, şifre sıfırlama ve oturum yönetimi. Tercihen Firebase Authentication kullanılır ve NestJS backend tarafından doğrulanır. Google ile sosyal giriş desteklenir.
- **4.1.2. Kullanıcı Profili:** Kullanıcıya ait temel bilgiler (e-posta, opsiyonel ad/soyad) ve uygulama tercihleri (örn: tema) yönetilir.

#### **4.2. Ders (Çalışma Alanı) Yönetimi**

- Kullanıcılar mantıksal çalışma alanları olan Dersleri oluşturabilir, isimlendirebilir, listeleyebilir ve (opsiyonel) açıklama ekleyebilir.
- Bir Ders silindiğinde, ilişkili tüm verilerin (İçerik Öğeleri, Hedefler, Sınavlar, Başarısız Sorular) kalıcı olarak silineceği konusunda kullanıcı uyarılır ve silme işlemi **Cascade Delete** mantığıyla gerçekleştirilir (Bkz 8.3).

#### **4.3. İçerik Yönetimi ve İşleme**

- **4.3.1. Belge Yükleme:** PDF, DOCX, TXT formatlarında, UTF-8 kodlamalı, en fazla 10 MB boyutundaki belgeler desteklenir. Kolay kullanım için sürükle-bırak arayüzü sunulur. Dosyalar güvenli bir depolama alanında (örn: Firebase Storage) saklanır.
- **4.3.2. Metin Çıkarma:** Yüklenen belgelerden metin içeriği **NestJS backend** tarafından, uygun kütüphaneler kullanılarak (örn: `pdf-plumber`, `mammoth`) çıkarılır. Görsel veya karmaşık yapısal elemanlardaki metinler işlenmez.
- **4.3.3. Hata Yönetimi:** Desteklenmeyen format, bozuk dosya, boyut aşımı veya metin çıkarma hatası gibi durumlarda kullanıcıya anlaşılır hata mesajları sunulur.

#### **4.4. Yapay Zeka Destekli Analiz ve İçerik Üretimi**

- **4.4.1. AI Konu Tespiti ve Seçimi:**
  - **Model ve Prompt:** Google Gemini (`gemini-1.5-flash`, `temperature=0`) modeli, özel olarak tasarlanmış bir prompt (Bkz. `Prompts/3.md`, `Bitirme/PRD - v8.3.md` Section 4.4.1.1) kullanılarak metinden en fazla iki seviyeli, kavramsal Alt Konuları tespit eder. Prompt, yapısal başlıkları, pratik adımları, tekrarları ve önemsiz detayları elemeye odaklanır. Mevcut Ders hedefleri prompt'a eklenerek tekrar önlenir.
  - **Konu Seçim Ekranı:** AI tarafından önerilen yeni Alt Konular, kullanıcı onayı için frontend'de listelenir. Kullanıcı sınava dahil edilecek konuları seçer.
  - **Başarısız Tespit:** AI konu çıkaramazsa (`Konu tespit edilemedi.` yanıtı), süreç durdurulur ve kullanıcı bilgilendirilir.
- **4.4.2. AI Soru Üretimi:**
  - **Süreç:** NestJS backend, seçilen sınav modu, Öğrenme Hedeflerinin durumu (`status`), kullanıcı tercihleri (zorluk vb.), seçilen Alt Konular ve (gerekiyorsa) hesaplanan soru dağılımına göre Gemini API'sine istek gönderir.
  - **Çıktı:** AI, JSON formatında bir soru listesi döndürür. Her soru; `id`, `questionText`, `options` (seçenekler), `correctAnswer`, `explanation` (açıklama), `subTopic` (orijinal ad), `normalizedSubTopic`, `difficulty` alanlarını içerir. Açıklama (`explanation`) üretilmesi zorunludur.
  - **Güvenlik ve Hata Yönetimi:** API anahtarı backend'de güvenli tutulur. API çağrıları backend üzerinden yapılır. Geçici hatalar için yeniden deneme mekanizması (Exponential Backoff) kullanılır.

#### **4.5. Öğrenme Hedefleri (Learning Targets) ve Takibi**

- **4.5.1. Tanım:** Bir Ders içerisindeki her bir Alt Konu için kullanıcının yeterliliğini temsil eden ve `normalizedSubTopicName` ile eşleştirilen kayıtlardır (`courses/{courseId}/learningTargets/{targetId}`).
- **4.5.2. 4-Seviyeli Durum (`status`) Sistemi:** Her Öğrenme Hedefinin durumu, **sadece** o hedefle ilgili sorular içeren **en son Kişiselleştirilmiş Sınavdaki** başarı yüzdesine (`lastAttemptScorePercent`) göre belirlenir:
  - `'pending'` (Beklemede): Henüz ilgili konuda soru çözülmemiş veya hedef yeni oluşturulmuş.
  - `'failed'` (Başarısız): Başarı %0 - %49 (dahil).
  - `'medium'` (Orta): Başarı %50 (dahil) - %69 (dahil).
  - `'mastered'` (Başarılı): Başarı %70 (dahil) veya üzeri.
- **4.5.3. Oluşturma ve Güncelleme:** Yeni hedefler `'pending'` olarak başlar. İlk ilgili sınavdan sonra durumları (`failed`, `medium`, `mastered`) belirlenir. Sonraki sınavlarda durum, sadece o sınavdaki performansa göre güncellenir. Sınavda soru sorulmayan hedeflerin durumu değişmez. İsteğe bağlı olarak `failCount`, `mediumCount`, `successCount` sayaçları tutulabilir.
- **4.5.4. Kullanım:** Hedeflerin `status` değerleri, Zayıf/Orta Odaklı ve Kapsamlı sınavların içeriğini ve soru dağılımını belirlemede kullanılır.

#### **4.6. Sınav (Quiz) Sistemi**

- **4.6.1. Sınav Oluşturma Modları:**
  - **Hızlı Sınav:** Tek belgeyi hızlıca değerlendirir, Öğrenme Hedeflerini etkilemez.
  - **Kişiselleştirilmiş Sınavlar (Ders İlişkili):**
    - **Zayıf/Orta Odaklı:** Belge gerektirmeden, durumu `'failed'` veya `'medium'` olan mevcut hedeflere odaklanır.
    - **Yeni Konu Odaklı:** Yüklenen belgedeki sadece yeni (ve seçilen) Alt Konuları test eder ve bu hedeflerin ilk durumunu belirler.
    - **Kapsamlı:** Yeni belge içeriği (seçilen konular) ile mevcut tüm Öğrenme Hedeflerini birleştirir. `prioritizeWeakAndMediumTopics` ayarı ile zayıf/orta konulara ağırlık verebilir.
- **4.6.2. Sınav Ayarları:**
  - **Ortak:** Soru Sayısı (5-20, slider), Zorluk Seviyesi (Kolay/Orta/Zor/Karışık, dropdown), Zaman Sınırı (Opsiyonel, dakika girişi).
  - **Kapsamlı Özel:** Başarısız ve Orta Konulara Öncelik Ver (`prioritizeWeakAndMediumTopics`, checkbox, %60 ağırlık).

#### **4.7. Performans Değerlendirme ve Geri Bildirim**

- **4.7.1. Sınav Sonuç Ekranı:** Genel skoru gösterir. Kişiselleştirilmiş Sınavlar için ek olarak; alt konu bazlı performans (başarı %, güncel `status` rozeti - Kırmızı/Sarı/Yeşil/Gri), zorluk bazlı performans, durum bazında konu listeleri ve (varsa) yanlış cevaplanan soruları (açıklamalarıyla) sunar.
- **4.7.2. Öğrenme Takip Sayfası (Dashboard):** Seçili Ders için genel ilerleme grafiği (zamanla ortalama skorlar) ve hedef durumlarının (`status`) dağılımını (pasta/çubuk grafik) gösterir. Alt konuları güncel durumları (renk kodları, son başarı %, sayaçlar) ile listeler. Tasarım referansı: `learning-tracker.html`.
- **4.7.3. Sınav Geçmişi:** Kullanıcıların çözdüğü tüm sınavları (Hızlı ve Kişiselleştirilmiş) listeler ve sonuçları tekrar inceleme imkanı sunar.
- **4.7.4. Başarısız Soru Takibi:** Tüm sınavlardaki yanlış cevaplar, detaylarıyla birlikte merkezi `FailedQuestion` koleksiyonuna kaydedilir. Bu, gelecekteki tekrar veya analizler için kullanılır.

---

### **5. Kullanıcı Deneyimi (UX/UI) ve Tasarım**

- **5.1. Tasarım İlkeleri:** Modern, minimalist, sezgisel, kullanıcı dostu, net ve erişilebilir bir tasarım hedeflenir.
- **5.2. Teknolojiler:** Stil için Tailwind CSS, animasyonlar için Framer Motion, bildirimler için `react-toastify`, grafikler için `Chart.js` kullanılır.
- **5.3. Tema:** Karanlık ve Aydınlık mod desteklenir, kullanıcı tercihine veya sistem ayarlarına göre geçiş yapılır.
- **5.4. Duyarlılık:** Platform, mobil, tablet ve masaüstü cihazlarda sorunsuz çalışacak şekilde duyarlı (responsive) tasarlanır.
- **5.5. Erişilebilirlik:** WCAG 2.1 AA standartlarına uyum hedeflenir.
- **5.6. Akış ve Geri Bildirim:** Kullanıcı akışları pürüzsüz olmalıdır. Onboarding turu (Bkz 5.8), kolay içerik yükleme, net konu seçimi (AI önerisi vurgusuyla), işlem sırasında yükleme göstergeleri, sidebar navigasyonu ve durumlar (başarı, hata, yükleme, hedef `status`) için anlık ve anlaşılır görsel/metinsel geri bildirimler sağlanır.
- **5.7. Hata Yönetimi:** Katmanlı hata yakalama uygulanır. Kullanıcıya spesifik, anlaşılır hata mesajları ve mümkünse çözüm veya alternatif eylemler sunulur. Ağ/API hataları için otomatik yeniden deneme yapılır. Tüm önemli hatalar merkezi olarak (Sentry vb.) loglanır.
- **5.8. Onboarding Turu:** Yeni kullanıcılar için platformun temel mantığını (Ders, Hedef, 4-seviyeli durum, Sınav Türleri) açıklayan, `react-joyride` gibi bir kütüphane ile desteklenen, isteğe bağlı ve tekrar başlatılabilir interaktif bir tanıtım turu sunulur.

---

### **6. Teknik Mimari ve Teknoloji Seçimleri**

#### **6.1. Genel Mimari Yaklaşımı**

Full-stack bir mimari benimsenecektir:

- **Frontend:** Next.js (React tabanlı)
- **Backend:** NestJS (Node.js tabanlı)
- **API İletişimi:** REST API

#### **6.2. Teknoloji Yığını**

- **Frontend:** Next.js (App Router), React, TypeScript.
- **UI (Frontend):** Tailwind CSS, Framer Motion, `react-toastify`, `Chart.js`.
- **State Yönetimi (Frontend):** Zustand (karmaşık/global state), React Context API (basit global state: Auth, Theme).
- **Data Fetching (Frontend):** SWR veya TanStack Query (React Query).
- **Backend:** NestJS, TypeScript.
- **Veritabanı:** Firestore (NoSQL) - _Alternatifler değerlendirilebilir_.
- **ORM (Backend):** Prisma.
- **Kimlik Doğrulama:** Firebase Authentication (Öneri).
- **Dosya Depolama:** Firebase Storage (Öneri).
- **AI:** Google Gemini API (`@google/generative-ai` SDK).
- **Hata Takibi:** Sentry (Öneri).
- **Test Kütüphaneleri:** Jest, React Testing Library, Playwright/Cypress, (Firebase Emulator Suite - eğer Firebase servisleri kullanılıyorsa).

#### **6.3. Frontend Mimarisi (Next.js)**

- **Yapı:** `src/` dizini altında `app/` (routing), `components/` (UI/feature), `lib/` (utils), `services/` (API katmanı), `hooks/`, `store/` (Zustand), `contexts/`, `types/` klasörleri kullanılır.
- **Bileşenler:** Feature-based veya Atomic Design prensiplerine göre organize edilir.
- **Veri Çekme:** `services/` katmanı REST API çağrılarını soyutlar. SWR/TanStack Query ile Client Component'larda veri yönetimi yapılır. Server Component'lar ilk yükleme için kullanılır.
- **State:** Zustand ve Context API belirtilen amaçlar için kullanılır.
- **Auth:** Oturum bilgisi (HttpOnly cookie önerilir) backend tarafından yönetilir, frontend state'i Context/Zustand ile tutulur, route koruması Middleware veya layout/page seviyesinde yapılır.

#### **6.4. Backend Mimarisi (NestJS)**

- **Yapı:** Modüler yapı (Modules, Controllers, Services) benimsenir. Dependency Injection aktif olarak kullanılır.
- **API:** RESTful API endpoint'leri Controller'lar ile tanımlanır. DTO'lar ve ValidationPipe ile istek doğrulaması yapılır.
- **Servisler:** İş mantığı, veritabanı işlemleri (Prisma ile), AI API çağrıları (`@google/generative-ai` SDK ile), metin çıkarma ve diğer harici servis etkileşimleri Servis katmanında implemente edilir.
- **Güvenlik:** Guard'lar (Auth, Roles vb.) ile endpoint güvenliği ve yetkilendirme sağlanır. API anahtarları güvenli yönetilir.
- **Veritabanı:** Prisma ORM ile veritabanı şeması yönetilir ve type-safe sorgular yapılır.

#### **6.6. API İletişimi (REST)**

- Frontend (Next.js) ve Backend (NestJS) arasındaki tüm iletişim standart REST prensiplerine uygun olarak tasarlanmış API endpoint'leri üzerinden gerçekleştirilecektir. İstek ve yanıtlar için JSON formatı kullanılacaktır.

#### **6.7. Alt Konu Normalizasyonu**

- Tutarlılık ve doğru eşleştirme için, AI tarafından tespit edilen veya potansiyel olarak kullanıcı tarafından girilen Alt Konu isimleri, backend'de standart bir formata (`normalizedSubTopicName`) dönüştürülecektir (küçük harf, trim, ardışık boşlukları teke indirme, temel noktalama işaretlerini kaldırma). Tüm Öğrenme Hedefi ve Başarısız Soru eşleştirmeleri bu normalize edilmiş isim üzerinden yapılacaktır.

#### **6.8. Performans, Ölçeklenebilirlik ve Maliyet**

- Uygulamanın performanslı çalışması hedeflenir (verimli sorgular, optimize edilmiş frontend yüklemeleri). Kullanıcıya uzun süren işlemler (AI çağrıları vb.) sırasında geri bildirim (loading state) verilir.
- Mimari, gelecekteki kullanıcı artışını karşılayabilecek şekilde (NestJS'in ölçeklenebilirlik özellikleri, optimize veritabanı kullanımı) tasarlanır.
- AI API kullanımı, veritabanı işlemleri ve hosting maliyetleri göz önünde bulundurulur ve optimize edilir.

---

### **7. Veri Modelleri (Firestore Önerisi)**

_(Bu modeller Firestore için tasarlanmıştır. Farklı bir veritabanı seçilirse Prisma şeması buna göre uyarlanmalıdır. Alanlar PRD v8.3'teki tanımlara uygundur.)_

- **7.1. User:** (`users/{userId}`)
  - `uid`, `email`, `displayName` (nullable), `createdAt`, `lastLogin`, `settings` ({ `theme` })
- **7.2. Course:** (`courses/{courseId}`)
  - `id`, `userId` (index), `name`, `description` (nullable), `createdAt`
- **7.3. LearningTarget:** (`courses/{courseId}/learningTargets/{targetId}`)
  - `id` (UUID), `courseId`, `userId`, `subTopicName`, `normalizedSubTopicName` (index), `status` ('pending'|'failed'|'medium'|'mastered', index), `failCount`, `mediumCount`, `successCount`, `lastAttemptScorePercent` (nullable), `lastAttempt` (nullable), `firstEncountered`
- **7.4. Quiz:** (`quizzes/{quizId}`)
  - `id`, `userId` (index), `quizType` ('quick'|'personalized', index), `personalizedQuizType` ('weakTopicFocused'|'newTopicFocused'|'comprehensive'|null, index), `courseId` (nullable, index), `sourceDocument` ({ `fileName`, `storagePath`? }|null), `selectedSubTopics` (string[]|null), `preferences` ({ `questionCount`, `difficulty`, `timeLimit`, `prioritizeWeakAndMediumTopics` }), `questions` (Question[]), `userAnswers` (Record<string, string>), `score`, `correctCount`, `totalQuestions`, `elapsedTime` (nullable), `analysisResult` (AnalysisResult|null), `timestamp` (index)
- **7.5. Question:** (Quiz.questions içinde)
  - `id` (UUID), `questionText`, `options` (string[]), `correctAnswer`, `explanation` (nullable), `subTopic`, `normalizedSubTopic`, `difficulty`
- **7.6. AnalysisResult:** (Quiz.analysisResult içinde)
  - `overallScore`, `performanceBySubTopic` (Record<normSubTopic, { scorePercent, status, questionCount, correctCount }>), `performanceCategorization` ({ failed[], medium[], mastered[] }), `performanceByDifficulty` (Record<difficulty, { count, correct, score }>), `recommendations` (string[]|null)
- **7.7. FailedQuestion:** (`failedQuestions/{failedQuestionId}`)
  - `id`, `userId` (index), `quizId`, `questionId`, `courseId` (nullable, index), `questionText`, `options`, `correctAnswer`, `userAnswer`, `subTopicName`, `normalizedSubTopicName` (index), `difficulty`, `failedTimestamp` (index)

---

### **8. Kalite Güvencesi ve Güvenlik**

#### **8.1. Test Stratejisi**

- Kapsamlı bir test stratejisi izlenecektir:
  - **Birim Testleri (Jest):** NestJS servisleri ve Next.js hook'ları/utility'leri için iş mantığı, hesaplamalar ve durum güncelleme kuralları test edilir.
  - **Bileşen Testleri (React Testing Library):** Next.js UI bileşenlerinin doğru render edildiği, olaylara tepki verdiği ve beklenen kullanıcı etkileşimlerini desteklediği doğrulanır.
  - **Entegrasyon Testleri:** NestJS endpoint'leri, veritabanı etkileşimleri (Prisma mock'ları veya test veritabanı ile), AI API çağrıları (mock servisler ile) ve (kullanılıyorsa) Firebase servis etkileşimleri (Emulator Suite ile) test edilir.
  - **Uçtan Uca Testler (Playwright/Cypress):** Temel kullanıcı akışları (kayıt/giriş, ders oluşturma, belge yükleme, konu seçimi, farklı sınav türleri, sonuç analizi, hedef durumu güncellemesi, hata senaryoları) baştan sona test edilir.

#### **8.2. Kod Kalitesi Standartları**

- Tüm projede **TypeScript** kullanımı zorunludur. Kod stili tutarlılığı için **ESLint** ve **Prettier** kullanılır ve otomatik formatlama yapılandırılır. Anlamlı isimlendirme, JSDoc/TSDoc ile belgelendirme ve DRY (Don't Repeat Yourself) prensibine uyulur. **Kod Gözden Geçirmeleri (Code Reviews)** geliştirme sürecinin bir parçasıdır.

#### **8.3. Güvenlik Öncelikleri ve Stratejileri**

- **Kimlik Doğrulama & Yetkilendirme:** Güvenli kimlik doğrulama (Firebase Auth önerisi) ve NestJS backend'de token doğrulama/yetkilendirme (Guard'lar) esastır.
- **Veri Erişimi:** Veritabanı erişimi (Firestore Güvenlik Kuralları veya NestJS servis katmanı aracılığıyla) sıkı bir şekilde kontrol edilir, kullanıcılar yalnızca kendi verilerine erişebilir.
- **API Güvenliği:** Tüm API endpoint'leri (NestJS) uygun şekilde korunur (Auth Guard, Rate Limiting, CORS). Hassas API anahtarları (Gemini vb.) backend'de güvenli bir şekilde saklanır ve yönetilir.
- **Dosya Güvenliği:** Dosya depolama (Firebase Storage önerisi) erişimi güvenlik kuralları ile kısıtlanır.
- **Veri Doğrulama:** Hem frontend hem de backend'de (NestJS DTO/ValidationPipe) gelen veriler doğrulanır.
- **Bağımlılık Yönetimi:** Güvenlik açıkları için kullanılan kütüphaneler düzenli olarak (`npm audit`) kontrol edilir.
- **Veri Gizliliği:** İlgili veri gizliliği yönetmeliklerine (GDPR/KVKK) uyum sağlanır ve şeffaf bir gizlilik politikası sunulur.
- **Cascade Delete:** Ders veya Kullanıcı silme işlemlerinde ilişkili tüm verilerin tutarlı bir şekilde silinmesi için mekanizmalar (NestJS servisleri veya DB tetikleyicileri) implemente edilir ve dikkatlice test edilir.

---

### **9. Geliştirme Yol Haritası (Aşamalandırma)**

_(NestJS backend kararı ışığında güncellenmiş aşamalar)_

- **MVP (Minimum Viable Product):**
  - Auth (Kayıt, Giriş - NestJS + Firebase Auth).
  - Ders CRUD (NestJS API).
  - Belge Yükleme (PDF/TXT) & Metin Çıkarma (NestJS).
  - Hızlı Sınav Modu (AI Soru Üretimi (NestJS), Sonuç Gösterimi, Kayıt).
  - Temel Veritabanı Şeması ve Prisma Kurulumu (User, Course, Quiz-Quick, FailedQuestion).
  - Temel UI/UX (Next.js).
- **Faz 2 (Temel Kişiselleştirme):**
  - AI Konu Tespiti & Konu Seçim Ekranı (NestJS + Next.js).
  - Temel Alt Konu Normalizasyonu (NestJS).
  - Temel Learning Target Oluşturma/Güncelleme (4-seviyeli `status`, `pending` dahil) (NestJS + DB).
  - Yeni Konu Odaklı Sınav Modu.
  - DOCX Desteği (NestJS).
  - Basit Sınav Geçmişi (NestJS API + Next.js).
  - Temel Analiz Ekranı (`status` gösterimi).
- **Faz 3 (Gelişmiş Kişiselleştirme ve Hedef Takibi):**
  - AI Konu Tespiti (Mevcut Ders Filtreleme).
  - Kapsamlı Sınav Modu (`prioritizeWeakAndMediumTopics` özelliği).
  - Zayıf/Orta Odaklı Sınav Modu.
  - Learning Target Güncelleme Mantığı (`failed`/`medium`/`mastered`) ve Sayaçlar.
  - Öğrenme Takip Sayfası (Dashboard) (Grafikler, Hedef Listesi).
  - Tema Desteği (Aydınlık/Karanlık).
- **Faz 4 (UX İyileştirmeleri ve Sağlamlaştırma):**
  - UI Animasyonları (Framer Motion).
  - Gelişmiş Hata Yönetimi Stratejisi.
  - Onboarding Turu (`react-joyride`).
  - Cascade Delete Mekanizması.
  - Kapsamlı Testler (Entegrasyon, E2E).
  - Performans Optimizasyonları ve Güvenlik Gözden Geçirmeleri.
- **Gelecek Aşamalar:** Başarısız Soru Yönetimi/Sınavı, PDF Çıktısı, Gelişmiş AI Açıklamaları, Farklı Soru Tipleri, Kullanıcı Konu Düzenleme, Paylaşım, Çoklu Dil, Gelişmiş Konu Eşleştirme, LMS Entegrasyonları.

---

### **10. Potansiyel Riskler ve Yönetim Stratejileri**

1.  **Kritik Güvenlik Riski:** API anahtarlarının sızması veya NestJS API endpoint'lerinin yetersiz korunması.
    - **Yönetim:** Anahtarların backend ortam değişkenleri/Secret Manager ile güvenli yönetimi; tüm hassas çağrıların backend'den yapılması; NestJS Guard'larının etkin kullanımı.
2.  **AI Kalitesi/Tutarlılığı:** Konu tespiti ve soru üretiminde değişkenlik veya hatalar.
    - **Yönetim:** Detaylı prompt mühendisliği, `temperature=0` kullanımı, model izleme, beklenti yönetimi, katı normalizasyon, kullanıcı geri bildirim mekanizması (gelecekte).
3.  **Operasyonel Maliyetler:** AI API kullanımı, veritabanı ve NestJS hosting/altyapı maliyetleri.
    - **Yönetim:** Verimli tasarım (Prisma sorgu optimizasyonu, AI model seçimi), maliyet takibi/uyarıları, optimizasyonlar (caching), uygun maliyetli ve yönetilebilir hosting çözümü seçimi.
4.  **Veri Güvenliği (DB/Storage):** Yetkisiz erişim veya veri ihlali.
    - **Yönetim:** Sıkı erişim kontrolleri (Firestore Güvenlik Kuralları veya NestJS yetkilendirme katmanı), güvenli API yönetimi, düzenli denetimler, Cascade Delete'in dikkatli implementasyonu.
5.  **Kullanıcı Kabulü:** Yeni konseptlerin (4-seviyeli durum, farklı sınav modları) anlaşılması.
    - **Yönetim:** Etkili onboarding turu, net UI/UX, açıklayıcı metinler, görselleştirmeler (Dashboard).
6.  **Metin Çıkarma/Analiz Hataları:** Farklı/karmaşık belge yapıları.
    - **Yönetim:** Robust kütüphaneler, net bilgilendirme, gelişmiş hata yönetimi ve kullanıcıya alternatif sunma.
7.  **Veri Büyümesi:** Veritabanı koleksiyonlarının (Hedefler, Başarısız Sorular) büyümesi ve performans etkisi.
    - **Yönetim:** Etkili indeksleme, sorgu optimizasyonu, (gelecekte) arşivleme/temizleme stratejileri.
8.  **NestJS Altyapı Yönetimi:** Özel backend kullanmanın getirdiği ek altyapı yönetimi (hosting, ölçeklendirme, bakım) sorumluluğu.
    - **Yönetim:** Yönetilen platformlar (PaaS, Serverless - NestJS uyumlu) kullanmak, CI/CD ile süreçleri otomatikleştirmek, Prisma Migrate gibi araçlarla DB yönetimini kolaylaştırmak.
