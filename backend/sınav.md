# Sınav Oluşturma Promptu

## Tarih: 2025-05-31T21:54:29.710Z

## Trace ID: quiz-1748728469673-0sybu

## Alt Konular (7 adet):
```
## AKTİF KONULAR (SORU ÜRETİLECEK)

**Aşağıdaki alt konular için belirtilen sayıda soru üretilecektir:**

1. **Süperbilgisayar Sıralama Listeleri** (2 soru)
2. **Top500 Listesi** (2 soru)
3. **Hpcğilistesi** (2 soru)
4. **Green500 Listesi** (2 soru)
5. **Linpack Testi** (2 soru)

**Toplam Aktif: 5 alt konu, 10 soru**

## BEKLEYEN KONULAR (SORU ÜRETİLMEYECEK)

**Aşağıdaki konulardan soru üretilmeyecektir:**

1. Hpcğitesti
2. Flops Watt Oranı

```

## Soru Sayısı: 10

## Zorluk: mixed

## Tam Prompt:
```
// ====================================================
// ============ TEST SORULARI OLUŞTURMA PROMPT ============
// ====================================================

**📋 TEMEL GÖREV:** 
Sen bir eğitim içeriği ve test geliştirme uzmanısın. Verilen metin içeriğini derinlemesine analiz ederek, kaliteli ve içerik-odaklı test soruları oluşturacaksın.

// ----------------------------------------------------
// ------------------- GİRDİLER -----------------------
// ----------------------------------------------------

**📥 GİRDİLER:**
- **Konu Bilgileri:** ## AKTİF KONULAR (SORU ÜRETİLECEK)

**Aşağıdaki alt konular için belirtilen sayıda soru üretilecektir:**

1. **Süperbilgisayar Sıralama Listeleri** (2 soru)
2. **Top500 Listesi** (2 soru)
3. **Hpcğilistesi** (2 soru)
4. **Green500 Listesi** (2 soru)
5. **Linpack Testi** (2 soru)

**Toplam Aktif: 5 alt konu, 10 soru**

## BEKLEYEN KONULAR (SORU ÜRETİLMEYECEK)

**Aşağıdaki konulardan soru üretilmeyecektir:**

1. Hpcğitesti
2. Flops Watt Oranı

  *Lütfen dikkat: Bu bölümde "AKTİF KONULAR (SORU ÜRETİLECEK)" ve "BEKLEYEN KONULAR (SORU ÜRETİLMEYECEK)" olmak üzere iki liste görebilirsin.*
- **Eğitim İçeriği:** 

Bilgisayar Mühendisliği Bölümü
Bahar –2025(ÖÖ.,İÖ.)
MBM7-452 -Eksaskala Bilgisayar Sistemleri
(Sunu 6)
Dr. Öğr. Üyesi Esra Çelik

Süperbilgisayar Dünyasında Sıralama
•Süperbilgisayarlar, yüksek hesaplama gücüyle bilimsel
araştırmalardan yapay zekaya kadar pek çok alanda kullanılır.
•Bu sistemlerin hızını, verimliliğini ve gerçek performansını
değerlendiren üç temel liste vardır:
•TOP500
•HPCG (High Performance Conjugate Gradient)
•Green500

TOP500
•TOP500,
•dünyanın en hızlı 500 süperbilgisayarını hesaplama gücüne göre
sıralar.
•1993’ten bu yana yılda iki kez (Haziran ve Kasım aylarında)
yayımlanmaktadır.
•Performansodaklıdır.
•En yüksek hesaplama gücü kimde?sorusunun cevabını verir.

TOP500
•Sıralama ölçütü olarak LINPACK testi kullanılır.
•Bu test:
•Süperbilgisayarın ne kadar hızlı işlem yapabildiğini yanisistemin
floating-point işlemleri (FLOPS) performansını ölçer.
•Matris çözümlemeye dayalıdır.
•Bellek kullanımı, veri aktarımı veya gerçek dünya uygulamalarındaki
performansı tam olarak yansıtmaz.

TOP500
•Kasım 2024 TOP500 listesinde ElCapiton ilk sırada yer alır.

HPCG
•HPCG,
•bellek, iletişim ve veri akış performansını test eder.
•Gerçek dünya uygulamalarına odaklanır.
•TOP500’ün eksik kaldığı noktaları tamamlamak için alternatif olarak
geliştirilmiştir.
•Gerçek dünya uygulamalarına (mühendislik hesaplamaları vb.) daha
yakındır.

HPCG
•Sıralama ölçütü olarak HPCG testi kullanılır.
•Bu test:
•İteratif bir doğrusal denklem çözme yöntemi olan Konjugat
Gradyanyöntemini kullanılır.
•Bellek erişimi, iletişim yeteneği ve veri transfer performansını test
eder

HPCG
•Kasım 2024 HPCG listesinde Fugaku ilk sırada yer alır.

Green500
•Green500,
•enerji verimliliğini temel alarak süperbilgisayarları sıralayan
listedir.
•Çevreci yaklaşıma odaklanır.
•Verimli, sürdürülebilir HPC sistemlerini teşvik eder.
•Sıralama ölçütü olarak FLOPS/Wattoranına bakar.
•Yani, 1 watt enerji başına ne kadar işlem yapıldığı değerlendirilir.

Green500
•Kasım 2024 Green500 listesinde JEDI ilk sırada yer alır.

Listelerin Karşılaştırılması
ListeOdak NoktasıTest (Benchmark)Amaç
TOP500Ham hesaplama gücü
(FLOPS)
LINPACKEn hızlı
süperbilgisayarları
belirlemek
HPCGBellek, iletişim ve
gerçekçi yük
HPCGGerçek
uygulamalardaki
performansı ölçmek
Green500Enerji verimliliğiFLOPS/WattEn verimli
süperbilgisayarları
sıralamak
- **İstenen Toplam Soru Sayısı:** 10 soru
- **Zorluk Seviyesi:** mixed

// ----------------------------------------------------
// ------------- METİN ANALİZ SÜRECİ -----------------
// ----------------------------------------------------

**🔍 İÇERİK ANALİZ ADIMLARI:**
1. Önce metni dikkatlice oku ve anla
2. "Konu Bilgileri" bölümündeki "AKTİF KONULAR (SORU ÜRETİLECEK)" listesindeki alt konulara odaklan
3. Her bir aktif alt konu için anahtar kavramları tespit et
4. Her kavram için öğrenilmesi gereken temel noktaları listele
5. İçeriğin mantık akışını ve bölümleri arasındaki ilişkiyi kavra

**⚠️ METİN SORUNLARIYLA BAŞA ÇIKMA:**
- Eğer metin formatı bozuk görünüyorsa (satır sonları eksik vb.), cümle yapısını anlamaya çalış
- Anlamsız veya hatalı karakterler varsa yok say
- Metin kısımları eksik veya kopuk görünüyorsa, mevcut bilgilerden yararlanan sorular oluştur
- Türkçe karakter sorunları varsa (ş, ç, ğ, ü, ö, ı) anlamı koruyarak düzelt

// ----------------------------------------------------
// ------------- SORU OLUŞTURMA KURALLARI ------------
// ----------------------------------------------------

**⭐ ALT KONU DAĞILIMI VE SORU KURGULAMASI:**
1. SADECE "Konu Bilgileri" bölümündeki "AKTİF KONULAR (SORU ÜRETİLECEK)" listesinde belirtilen alt konular için soru üret
2. "BEKLEYEN KONULAR (SORU ÜRETİLMEYECEK)" listesindeki konulardan KESİNLİKLE soru ÜRETME
3. Her aktif alt konu için tam olarak o alt konu yanında belirtilen sayıda soru üret
   Örneğin: "Nesne Yönelimli Programlama (3 soru)" ifadesi, bu konu için tam 3 soru oluşturulmalıdır
4. Toplam soru sayısının 10 olduğundan emin ol (Bu sayı, aktif konulardaki toplam soru sayısına eşit olmalıdır)
5. Belirtilen aktif alt konular ve soru sayılarına MUTLAKA UYULMALIDIR
6. Her sorunun hangi alt konuya ait olduğu JSON çıktısında "subTopicName" alanında AÇIKÇA belirtilmelidir
7. Her soruyu üretirken, o sorunun hangi aktif alt konudan geldiğini mutlaka kontrol et
8. Soru dağılımları dengesiz olabilir! Örneğin: "Veri Yapıları" için 5 soru, "Algoritma Analizi" için 2 soru

**📊 ZORLUK SEVİYELERİ (SADECE İNGİLİZCE KULLAN):**
- "easy" (kolay): Temel hatırlama ve anlama soruları
- "medium" (orta): Uygulama ve analiz soruları
- "hard" (zor): Karmaşık analiz, değerlendirme ve yaratma soruları
- "mixed" (karışık): Farklı zorluk seviyelerinin karışımı

**🧠 BLOOM TAKSONOMİSİ DÜZEYLERİ:**
- Kolay (easy): "remembering", "understanding"
- Orta (medium): "applying", "analyzing" (temel düzeyde)
- Zor (hard): "analyzing" (karmaşık), "evaluating", "creating"

**📝 SORU TÜRLERİ VE KULLANIM:**
- "multiple_choice": Kavramları test etmek için en yaygın format (4 şık)
- "true_false": Yaygın yanlış anlamaları test etmek için ideal
- "fill_in_blank": Terminoloji ve kesin bilgi için
- "short_answer": Öğrencinin kendi ifadesiyle açıklamasını gerektiren konular için

**📋 TEMEL KURALLAR:**
1. Sorular SADECE verilen içeriğe dayanmalı, dışarıdan bilgi eklenmemeli
2. Her soru bir alt konuyu ölçmeli ve doğrudan içerikle ilgili olmalı
3. Her sorunun TEK doğru cevabı olmalı, bu cevap açıkça içerikte belirtilmiş olmalı
4. Çeldiriciler (yanlış şıklar) makul ama ayırt edilebilir olmalı
5. Konu dağılımında belirtilen ağırlıklara uyulmalı
6. Sorular kavramsal anlayışı ölçmeli, sadece ezber bilgiyi değil
7. Metin içindeki kelimeler birebir kopyalanmak yerine yeniden ifade edilmeli

**💡 AÇIKLAMA YAZMA KURALLARI:**
- Her açıklama, doğru cevabı net şekilde belirtmeli
- Açıklamada öğrenciyi içeriğin ilgili bölümüne yönlendirmeli
- Sadece neyin doğru olduğunu değil, neden doğru olduğunu da açıklamalı
- Çeldiricilerin neden yanlış olduğunu kısaca belirtmeli
- Kısa ve öz olmalı, ama yeterince bilgilendirici olmalı

// ----------------------------------------------------
// -------------- JSON ÇIKTI FORMATI -----------------
// ----------------------------------------------------

**⚙️ JSON ÇIKTI KURALLARI:**
- Yanıt SADECE geçerli bir JSON nesnesi olmalıdır, ek açıklama içermemelidir
- JSON dışında hiçbir ek metin eklenmemelidir
- JSON yapısı tam ve doğru olmalı - tüm parantezleri dengeli olmalı
- Zorunlu alanlar: id, questionText, options, correctAnswer, explanation, subTopicName, difficulty
- Her soru için zorluk seviyesi SADECE İngilizce olmalı ("easy", "medium", "hard", "mixed")

**📄 JSON FORMATI:**
```
{
  "questions": [
    {
      "id": "q1",
      "questionText": "Soru metni?",
      "questionType": "multiple_choice",
      "cognitiveDomain": "remembering",
      "options": ["Seçenek A", "Seçenek B", "Seçenek C", "Seçenek D"],
      "correctAnswer": "Seçenek B",
      "explanation": "Doğru cevabın açıklaması",
      "subTopicName": "Nesne Yönelimli Programlama",
      "normalizedSubTopicName": "nesne_yonelimli_programlama",
      "difficulty": "medium"
    },
    {
      "id": "q2",
      "questionText": "İkinci soru metni?",
      "questionType": "multiple_choice",
      "cognitiveDomain": "understanding",
      "options": ["Seçenek A", "Seçenek B", "Seçenek C", "Seçenek D"],
      "correctAnswer": "Seçenek A",
      "explanation": "Doğru cevabın açıklaması",
      "subTopicName": "Nesne Yönelimli Programlama",
      "normalizedSubTopicName": "nesne_yonelimli_programlama",
      "difficulty": "easy"
    },
    {
      "id": "q3",
      "questionText": "Üçüncü soru metni?",
      "questionType": "multiple_choice",
      "cognitiveDomain": "applying",
      "options": ["Seçenek A", "Seçenek B", "Seçenek C", "Seçenek D"],
      "correctAnswer": "Seçenek C",
      "explanation": "Doğru cevabın açıklaması",
      "subTopicName": "Nesne Yönelimli Programlama",
      "normalizedSubTopicName": "nesne_yonelimli_programlama",
      "difficulty": "medium"
    },
    {
      "id": "q4",
      "questionText": "Başka bir alt konudan soru?",
      "questionType": "multiple_choice",
      "cognitiveDomain": "analyzing",
      "options": ["Seçenek A", "Seçenek B", "Seçenek C", "Seçenek D"],
      "correctAnswer": "Seçenek D",
      "explanation": "Doğru cevabın açıklaması",
      "subTopicName": "Algoritma Analizi",
      "normalizedSubTopicName": "algoritma_analizi",
      "difficulty": "hard"
    }
  ]
}
```

// ----------------------------------------------------
// -------------- KALİTE KRİTERLERİ ------------------
// ----------------------------------------------------

**🎯 SORU KALİTESİ KRİTERLERİ:**
1. İÇERİK ODAKLILIK: Her soru, direkt olarak verilen metinden çıkarılmalı
2. AÇIKLIK: Soru ifadeleri açık, net ve anlaşılır olmalı
3. UYGUNLUK: Zorluk seviyesi ve bilişsel düzey uyumlu olmalı
4. DENGELİ ÇELDİRİCİLER: Yanlış şıklar mantıklı ama açıkça yanlış olmalı
5. KAVRAMSAL DERINLIK: Yüzeysel bilgi yerine kavramsal anlayışı ölçmeli
6. DİL KALİTESİ: Türkçe dilbilgisi ve yazım kurallarına uygun olmalı

**✅ SON KONTROLLER:**
- Tüm soruların doğru cevapları kesinlikle metinde yer almalı
- Zorluk seviyeleri MUTLAKA İngilizce olmalı ("easy", "medium", "hard", "mixed")
- JSON formatının doğruluğundan emin ol
- Sorular farklı bilişsel düzeyleri içermeli
- Tüm gerekli alanlar doldurulmalı
- ALT KONU DAĞILIMI ve SORU SAYISI:
  1. Toplam soru sayısı tam olarak 10 adet olmalı (aktif konulardaki toplam soru sayısıyla eşleşmeli)
  2. "Konu Bilgileri" bölümündeki "AKTİF KONULAR (SORU ÜRETİLECEK)" listesindeki HER BİR alt konu için belirtilen SORU SAYISINA MUTLAKA uyulmalı
     Örneğin: "Veri Tabanı Sistemleri (3 soru)" yazıyorsa, bu konudan tam 3 soru üretilmeli
  3. "BEKLEYEN KONULAR (SORU ÜRETİLMEYECEK)" listesindeki konulardan KESİNLİKLE soru üretilmediğinden emin ol
  4. Her sorunun "subTopicName" alanında, o sorunun geldiği alt konunun TAM ADI belirtilmeli
     Örneğin: "Nesne Yönelimli Programlama", "Veri Yapıları" gibi konu adları aynen kullanılmalı
- Her alt konu için soruların zorluk dağılımı dengeli olmalı

// ====================================================
// ================ PROMPT SONU ======================
// ====================================================
```



## İşlenen Sorular Analizi:

- Toplam Soru Sayısı: 10
- Alt Konu Dağılımı:

  - Süperbilgisayar Sıralama Listeleri: 2 soru
  - Top500 Listesi: 2 soru
  - Hpcğilistesi: 2 soru
  - Green500 Listesi: 2 soru
  - Linpack Testi: 2 soru


### Soru Örnekleri (Her Alt Konudan 1 Adet):

#### Süperbilgisayar Sıralama Listeleri:
- Soru: Aşağıdakilerden hangisi süperbilgisayarların performansını değerlendiren temel listelerden biridir?
- Seçenekler: BigData500 | TOP500 | Cloud100 | AIindex
- Doğru Cevap: TOP500
- Zorluk: easy

#### Top500 Listesi:
- Soru: TOP500 listesi hangi sıklıkla yayınlanmaktadır?
- Seçenekler: Yılda bir kez | İki yılda bir | Yılda iki kez | Ayda bir kez
- Doğru Cevap: Yılda iki kez
- Zorluk: easy

#### Hpcğilistesi:
- Soru: HPCG listesi neyi test etmeye odaklanır?
- Seçenekler: Sadece işlemci hızını | Bellek, iletişim ve veri akış performansını | Sadece enerji tüketimini | Sadece disk okuma hızını
- Doğru Cevap: Bellek, iletişim ve veri akış performansını
- Zorluk: easy

#### Green500 Listesi:
- Soru: Green500 listesi süperbilgisayarları neye göre sıralar?
- Seçenekler: İşlemci hızına | Enerji verimliliğine | Bellek kapasitesine | Disk alanına
- Doğru Cevap: Enerji verimliliğine
- Zorluk: easy

#### Linpack Testi:
- Soru: LINPACK testi temel olarak neyi ölçer?
- Seçenekler: Sistemin enerji tüketimini | Sistemin bellek kapasitesini | Sistemin floating-point işlemleri (FLOPS) performansını | Sistemin disk okuma hızını
- Doğru Cevap: Sistemin floating-point işlemleri (FLOPS) performansını
- Zorluk: medium

