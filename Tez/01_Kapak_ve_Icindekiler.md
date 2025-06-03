# KAPAK VE İÇİNDEKİLER

T.C.
ATATÜRK ÜNİVERSİTESİ
MÜHENDİSLİK FAKÜLTESİ
BİLGİSAYAR MÜHENDİSLİĞİ BÖLÜMÜ

 


BİLGİSAYAR MÜHENDİSLİĞİ SEÇMELİ TASARIM DERSİ I
YAPAY ZEKA DESTEKLİ KİŞİSELLEŞTİRİLMİŞ ÖĞRENİM QUIZ PLATFORMU

HAZIRLAYANLAR
Ahmet Haman Bekmez - 2025000001

PROJE DANIŞMANI
Dr. Öğr. Üyesi [Danışman Adı Soyadı]

HAZİRAN 2025

## İÇİNDEKİLER

**KISALTMALAR** ................................................. 3

**ŞEKİLLER DİZİNİ** .............................................. 4

**TABLOLAR DİZİNİ** ............................................. 5

**ÖZET** ........................................................ 6

**1. GİRİŞ** .................................................... 8
   1.1 Günümüz Eğitim Teknolojilerindeki Dönüşüm ve İhtiyaçlar ........ 8
   1.2 Çift Modaliteli Eğitim Platformlarının Gerekliliği ............ 9
   1.3 Geliştirilen Platformun Teknik Mimarisi ve İnovatif Yaklaşımı .. 10
   1.4 Platform Özelliklerinin Detaylı Analizi ....................... 15
   1.5 Proje Hedefleri ve Araştırma Soruları ......................... 18
   1.6 Problem Tanımı ve Araştırma Motivasyonu ....................... 20
   1.7 Çözüm Yaklaşımı ve Metodoloji ................................. 24

**2. LİTERATÜR ARAŞTIRMASI** .................................... 26
   2.1 Çift Modaliteli Değerlendirme Sistemleri ...................... 26
   2.2 Hızlı Değerlendirme Sistemleri ................................ 27
   2.3 Kişiselleştirilmiş Öğrenme ve Adaptif Sistemler .............. 28
   2.4 AI Destekli Eğitim Teknolojileri .............................. 30

**3. MATERYAL ve YÖNTEM** ....................................... 32
   3.1 Kuramsal Temeller .............................................. 32
   3.2 Sistem Tasarımı ve Mimarisi ................................... 35
   3.3 Teknoloji Yığını ve Araçlar ................................... 40
   3.4 Geliştirme Metodolojisi ....................................... 45

**4. BULGULAR ve TARTIŞMA** ..................................... 48
   4.1 Çift Modalite Sistem Performans Bulgularıı ................... 48
   4.2 Kullanıcı Deneyimi ve Memnuniyet Analizi ..................... 55
   4.3 AI Model Performans Değerlendirmesi ........................... 60
   4.4 Karşılaştırmalı Analiz ve Tartışma ........................... 65

**5. SONUÇLAR ve ÖNERİLER** ..................................... 70
   5.1 Araştırma Sonuçları ........................................... 70
   5.2 Gelecek Çalışmalar için Öneriler .............................. 75
   5.3 Platform Geliştirme Önerileri ................................. 78

**6. SÜRDÜRÜLEBİLİR KALKINMA İLE İLİŞKİSİ** ..................... 80
   6.1 SDG Hedefleri ile Uyum Analizi ................................ 80
   6.2 Çift Modalite Sistemin Sürdürülebilirlik Katkıları ........... 85

**7. ETİK DEĞERLENDİRME** ....................................... 90
   7.1 Yapay Zeka Etiği ve Şeffaflık ................................. 90
   7.2 Veri Güvenliği ve Gizlilik .................................... 95
   7.3 Adil Kullanım ve Erişilebilirlik .............................. 98

**8. HUKUKİ DEĞERLENDİRME** .................................... 102
   8.1 Kişisel Verilerin Korunması .................................. 102
   8.2 Eğitim Teknolojileri Mevzuatı ................................ 107
   8.3 Uluslararası Hukuki Uyumluluk ................................ 110

**9. SAĞLIK, ÇEVRE ve GÜVENLİK ETKİLERİ** ...................... 115
   9.1 Sağlık Üzerindeki Etkiler .................................... 115
   9.2 Çevresel Etki Analizi ........................................ 120
   9.3 Bilgi Güvenliği ve Siber Güvenlik ........................... 125

**10. KAYNAKÇA** ............................................... 130

**EKLER**
   EK A: Sistem Mimarisi Diyagramları ............................... 140
   EK B: API Dokümantasyonu ......................................... 145
   EK C: Kullanıcı Arayüzü Ekran Görüntüleri ....................... 150

## DEĞİŞİKLİK TARİHÇESİ

| Versiyon | Değişiklik gerekçesi | Değişiklik Talebini yapan/gerçekleştiren kişi | Değişiklik Kapsamı | Değişikliğin Talebinin Projeye Etkileri |
|----------|----------------------|-----------------------------------------------|-------------------|----------------------------------------|
| 1.0 | İlk sürüm | Ahmet Haman Bekmez | Tam sistem implementasyonu | Projenin tamamlanması |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |

## KISALTMALAR

**AI:** Artificial Intelligence (Yapay Zeka)
**API:** Application Programming Interface (Uygulama Programlama Arayüzü)
**CRUD:** Create, Read, Update, Delete (Oluştur, Oku, Güncelle, Sil)
**CSS:** Cascading Style Sheets (Basamaklanmış Stil Sayfaları)
**DTO:** Data Transfer Object (Veri Transfer Nesnesi)
**GDPR:** General Data Protection Regulation (Genel Veri Koruma Yönetmeliği)
**HTML:** HyperText Markup Language (Hiper Metin İşaretleme Dili)
**HTTP:** HyperText Transfer Protocol (Hiper Metin Transfer Protokolü)
**JSON:** JavaScript Object Notation (JavaScript Nesne Notasyonu)
**JWT:** JSON Web Token (JSON Web Simgesi)
**KVKK:** Kişisel Verilerin Korunması Kanunu
**ML:** Machine Learning (Makine Öğrenmesi)
**NoSQL:** Not Only SQL (Yalnızca SQL Değil)
**PWA:** Progressive Web Application (İlerlemeli Web Uygulaması)
**REST:** Representational State Transfer (Temsili Durum Aktarımı)
**SDG:** Sustainable Development Goals (Sürdürülebilir Kalkınma Amaçları)
**SPA:** Single Page Application (Tek Sayfa Uygulaması)
**SQL:** Structured Query Language (Yapılandırılmış Sorgu Dili)
**UI:** User Interface (Kullanıcı Arayüzü)
**UX:** User Experience (Kullanıcı Deneyimi)
**UUID:** Universally Unique Identifier (Evrensel Benzersiz Tanımlayıcı)
**NLP:** Natural Language Processing (Doğal Dil İşleme)
**LLM:** Large Language Model (Büyük Dil Modeli)
**SSR:** Server-Side Rendering (Sunucu Tarafı Render)
**HTTPS:** HyperText Transfer Protocol Secure (Güvenli Hiper Metin Transfer Protokolü)
**CDN:** Content Delivery Network (İçerik Dağıtım Ağı)
**OCR:** Optical Character Recognition (Optik Karakter Tanıma)
**DOM:** Document Object Model (Belge Nesne Modeli)
**CI/CD:** Continuous Integration/Continuous Deployment (Sürekli Entegrasyon/Sürekli Dağıtım)

## ŞEKİLLER DİZİNİ

**Şekil 1.1:** Çift Modaliteli Platform Genel Mimarisi ................... 12
**Şekil 1.2:** Hızlı Sınav Modalitesi Kullanıcı Akış Diyagramı .......... 14
**Şekil 1.3:** Kişiselleştirilmiş Sınav Modalitesi Akış Diyagramı ....... 16
**Şekil 2.1:** AI Destekli Soru Üretim Algoritması ...................... 30
**Şekil 2.2:** Çift Modalite Veri İşleme Süreci ........................ 32
**Şekil 3.1:** Sistem Bileşenleri ve İlişkileri ......................... 38
**Şekil 3.2:** Frontend-Backend Etkileşim Mimarisi ...................... 42
**Şekil 3.3:** Firebase Entegrasyon Şeması .............................. 44
**Şekil 4.1:** Performans Test Sonuçları Grafiği ....................... 52
**Şekil 4.2:** Kullanıcı Memnuniyet Oranları ........................... 58
**Şekil 4.3:** AI Model Doğruluk Oranları Karşılaştırması .............. 62

## TABLOLAR DİZİNİ

**Tablo 1.1:** Çift Modalite AI Model Performans Karşılaştırması ........ 48
**Tablo 1.2:** Konu Bazlı AI Model Performansı ......................... 50
**Tablo 2.1:** Sistem Performans Metrikleri ............................. 53
**Tablo 2.2:** Kullanıcı Deneyimi Değerlendirme Sonuçları .............. 56
**Tablo 2.3:** Modal-Spesifik Başarı Oranları .......................... 59
**Tablo 3.1:** Hızlı vs Kişiselleştirilmiş Modalite Karşılaştırması ... 63
**Tablo 3.2:** Teknoloji Yığını Karşılaştırma Analizi .................. 66
**Tablo 4.1:** SDG Hedefleri ile Platform Uyum Matrisi ................. 82
**Tablo 4.2:** Etik Değerlendirme Kontrol Listesi ...................... 92
**Tablo 4.3:** KVKK Uyumluluk Kontrol Tablosu ......................... 104
