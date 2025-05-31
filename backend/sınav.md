# Sınav Oluşturma Promptu

## Tarih: 2025-05-31T17:59:37.165Z

## Trace ID: quiz-1748714377151-zfh4a

## Alt Konular (10 adet):
```
## AKTİF KONULAR (SORU ÜRETİLECEK)

**Aşağıdaki alt konular için belirtilen sayıda soru üretilecektir:**

1. **Eksaskala Bilgisayar Sistemleri** (2 soru)
2. **Eksaskala Bilgisayar Tanımı** (2 soru)
3. **Eksaskala Bilgisayar Avantajları** (2 soru)
4. **Von Neumann Mimarisi** (2 soru)
5. **Gpu Ve Tpu Hızlandırıcılar** (2 soru)

**Toplam Aktif: 5 alt konu, 10 soru**

## BEKLEYEN KONULAR (SORU ÜRETİLMEYECEK)

**Aşağıdaki konulardan soru üretilmeyecektir:**

1. Simd Ve Mimd Paralelleştirme
2. Hbm Bellek Teknolojisi
3. 3d Bellek Yığınlama
4. Fat Tree Topolojisi
5. Dragonfly Topolojisi

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

1. **Eksaskala Bilgisayar Sistemleri** (2 soru)
2. **Eksaskala Bilgisayar Tanımı** (2 soru)
3. **Eksaskala Bilgisayar Avantajları** (2 soru)
4. **Von Neumann Mimarisi** (2 soru)
5. **Gpu Ve Tpu Hızlandırıcılar** (2 soru)

**Toplam Aktif: 5 alt konu, 10 soru**

## BEKLEYEN KONULAR (SORU ÜRETİLMEYECEK)

**Aşağıdaki konulardan soru üretilmeyecektir:**

1. Simd Ve Mimd Paralelleştirme
2. Hbm Bellek Teknolojisi
3. 3d Bellek Yığınlama
4. Fat Tree Topolojisi
5. Dragonfly Topolojisi

  *Lütfen dikkat: Bu bölümde "AKTİF KONULAR (SORU ÜRETİLECEK)" ve "BEKLEYEN KONULAR (SORU ÜRETİLMEYECEK)" olmak üzere iki liste görebilirsin.*
- **Eğitim İçeriği:** 

Bilgisayar Mühendisliği Bölümü
Bahar –2025(ÖÖ.,İÖ.)
MBM7-452 -Eksaskala Bilgisayar Sistemleri
(Sunu 2)
Dr. Öğr. Üyesi Esra Çelik

Eksaskala Bilgisayarlar
•Exascale bilgisayarlar,
•saniyedeퟏퟎ
ퟏퟖ
hesaplama yapabilen sistemlerdir.
•Petaskalasistemlerden yaklaşık 1000 kat daha güçlüdür.
•Günümüzün en güncel eksaskala bilgisayar modelleri
•Frontier(2022–saniyede 1.1 exaflopperformans) ve
•El Capitan (2023-saniyede 2exaflopperformans)’dır.

Eksaskala Bilgisayarlar
Doğal afetlerin daha etkili yönetilmesi
Akıllı şehirlerin gelişimini hızlandırılması
Yapay zeka ve büyük veri analitiği uygulamalarından daha
hızlı ve verimli sonuçlar elde edilmesi
STEM (Fen, Teknoloji, Mühendislik, Matematik) alanları ile ilgili
bilimsel okuryazarlığın artırıması
1
2
3
4
Eksaskala bilgisayarların en önemli avantajları aşağıda listelenir:

Günün Sorusu
Eksaskala bilgisayarları son kullanıcı
dizüstü/masaüstü bilgisayarlardan
daha hızlı yapan temel faktörler
nelerdir?

Eksaskala Bilgisayarlarda İşlemciler
•Von Neumann Mimarisi
•Program komutları ve veriler aynı bellekiçinde saklanır.
•İşlemci, komutları bellekte sırayla alır, işler ve yürütür.
•Komutlar, bellekte saklanan yazılımlar aracılığıyla yürütülür.
•Programlar ve veriler aynı hafızada saklanabildiği için esnekliksağlar.
•Genel amaçlı bilgisayarlar (PC, dizüstüvb.)için uygundur.
•Bellek ile işlemci arasındaki veri aktarım hızı, sistemin performansını sınırlar.
Input
Device
Output
Device
Central Processing Unit
(CPU)
Memory Unit
Arithmetic/Logic Unit
(ALU)
Control Unit (CU)

Eksaskala Bilgisayarlarda İşlemciler
•Eksaskala bilgisayarlarda,
•geleneksel Von Neumann mimarisinden farklı olarak
•CPU’nun yanı sıra
•heterojen hesaplama kaynakları olan GPU, TPUgibi hızlandırıcılar
daişlem sürecine dahil edilir.
Input
Device
Output
Device
Central Processing Unit
(CPU)
Memory Unit
Graphics Processing Unit
(GPU)
Tensor Processing Units
(TPU)

GPU ve TPU
nedir?

Eksaskala Bilgisayarlarda İşlemciler
Input
Device
Output
Device
Central Processing Unit
(CPU)
Memory Unit
Graphics Processing Unit
(GPU)
Tensor Processing Units
(TPU)
•Grafik İşleme Birimi (GPU),
•CPU ile birlikte çalışan, grafik ve hesaplama işlemlerini hızlandıran özel
işlemcidir.
•Binlerce çekirdeğe sahiptir.
•Yüksek işlem gücü ile CPU’dan daha hızlı hesaplamalar yapabilirler.
•Aynı anda birçok görevi yürüterek paralel işlem yapabilir.
•Büyük matris işlemlerini hızlandırarak süper bilgisayarlar için kritik rol oynar.
•Grafik işleme, video oluşturma, yapay zekaalanlarında sıkça kullanılır.

Eksaskala Bilgisayarlarda İşlemciler
Input
Device
Output
Device
Central Processing Unit
(CPU)
Memory Unit
Graphics Processing Unit
(GPU)
Tensor Processing Units
(TPU)
•Tensor İşleme Birimi (TPU),
•Google tarafından makine öğrenmesi için özel olarak tasarlanmış
işlemcilerdir.
•GPU’lardan daha hızlı ve enerji verimli çalışabilir.
•Yoğun vektör ve matris hesaplamaları için optimize edilmiştir.
•Aşırı paralel hesaplama kapasitesine sahiptir.

Eksaskala Bilgisayarlarda İşlemciler
•Eksaskala bilgisayarlarda,
•geleneksel Von Neumann mimarisindeki sıralı işlem yapısından
farklı olarak
•SIMD ve MIMD gibi paralelleştirme teknikleri kullanılarak
•büyük ölçekli işlemler aynı anda çalıştırılabilir.

SIMD ve MIMD
teknikleri nedir?

Eksaskala Bilgisayarlarda İşlemciler
•Tek Komut Çoklu Veri(Single Instruction Multiple Data-SIMD),
•Tek bir komut aynı anda birden fazla veri üzerinde çalışır.Buna veri paralelliği denir.
•Vektör işlemciler ve GPU tarafından kullanılır.
•Paralelleştirme ile büyük veri setlerinde yüksek verimlilik sağlar.
•Örneğin,
•1, 2 ve 3 verilerinin (çoklu veri)
•aynı anda (paralel)
•4 katının hesaplanması işlemi (tek komut)
•SIMD tekniği ile aşağıdaki gibi gerçekleştirilebilir:
123
x4
4812
Çoklu Veri
Tek Komut
Sonuç
Tüm çıktılar
tek seferde
alınır.

Eksaskala Bilgisayarlarda İşlemciler
•ÇokluKomut Çoklu Veri(MultipleInstruction Multiple Data-MIMD),
•Farklı komutlar aynı anda farklı veriler üzerinde çalıştırılır. Buna görev paralelliği denir.
•Çok çekirdekli CPU’lar ve süper bilgisayarlar bu yapıyı kullanır.
•Karmaşık işlemleri paralelşekilde gerçekleştirebilir.
•Örneğin,
•1, 2ve 3verilerinin (çoklu veri)
•aynı anda (paralel)
•4 katının, 5 fazlasının, 3 eksiğinin hesaplanması işlemi (çoklu komut)
•MIMD tekniği ile aşağıdaki gibi gerçekleştirilebilir:
123
x4
470
Çoklu Veri
Çoklu Komut
Sonuç
Tüm çıktılar
tek seferde
alınır.
+5-3

Eksaskala Bilgisayarlarda Bellek Mimarileri
•Eksaskala bilgisayarlarda,
•geleneksel Von Neumann mimarisindeki tek bellek yolundan farklı
olarak
•HBM (High Bandwidth Memory)ve
•3D bellek yığınlamagibi
•yüksek hızlı bellek teknolojilerini kullanır.

HBM ve 3D bellek
yığınlama nedir?

Eksaskala Bilgisayarlarda Bellek Mimarileri
•Yüksek Bant Genişlikli Bellek(High Bandwidth Memory-HBM),
•bellek ile işlemci arasındaki veri aktarım hızını artırmak için kullanılan bir bellek teknolojisidir.
•HBM, geleneksel belleklere göre,
•bellek yongalarını yatay yerleştirerekdaha yüksek bant genişliği sağlar. Bu yatay ölçeklemenin bir
türüdür.
•işlemci ile bellek arasındaki veri iletim hızını artırarak daha hızlı erişim sağlar.
•Yüksek performanslı hesaplama uygulamalarında kullanılır.
•Yongaların yatay yerleştirilmesi nedeniyle sınırlı bir alan kullanımı ve kapasiteye sahiptir.

Eksaskala Bilgisayarlarda Bellek Mimarileri
•3D bellek yığınlama,
•HBM'in bir türüdür.
•Bellek yongalarının dikey yerleştirilmesiyle oluşturulur. Bu dikey ölçeklemenin bir
türüdür.
•Bu, daha az alan kullanarak daha fazla:
•bellek kapasitesi, bant genişliği, hızlı veri iletimi ve verimli bir tasarımsağlar.
•HBM ile aynı alanlarda kullanılır ve daha maliyetlidir.

Eksaskala Bilgisayarlarda Bağlantı Teknolojileri
•Exascale bilgisayarlar için ağ topolojileri,
•veri aktarımının gecikmesini minimize edecek şekilde optimize edilmiştir.
•Bu kapsamda:
•Fat-tree,
•Dragonfly,
•Hypercube ve
•HyperXtopolojileri
•hesaplama düğümleri arasındaki bağlantıyı güçlendirmekiçin yaygın olarak
kullanılmaktadır.

Fat-tree, Dragonfly,
Hypercubeve HyperX
topolojilerinedir?

Eksaskala Bilgisayarlarda Bağlantı Teknolojileri
•Fat-tree,
•Yüksek bant genişliği ve düşük tıkanıklıksağlamak için tasarlanmışbir topolojidir.
•Klasikağaç topolojisindeüst katmanlara çıkıldıkça bant genişliği daralır, fat-tree’de ise bağlantılar
güçlendirilir vebant genişiği artar.
•Fat-treetopolojide 3 katman bulunur:
•Core Layer,bant genişliğinin en yüksek olduğu katmandır.
•Aggregation Layer, trafiği optimize eder.
•Edge Layer, serverlar için bağlantı noktasıdır ve bant genişliği düşüktür.
•Süper bilgisayarlar için Core ve Aggregation Layer kritik öneme sahiptir.
Bant
genişliği
artar.

Eksaskala Bilgisayarlarda Bağlantı Teknolojileri
•Dragonfly
•düşük gecikme ve yüksek bant
genişliği sunan ölçeklenebilir bir ağ
topolojisidir.
•Fat-Tree‘den farkılı olarak:
•daha az switch ve kablo ile
•aynı veya daha yüksek performans
sağlar.
•Ölçeklenebilirlik artarken maliyet ve
enerji tüketimi azalır.

Eksaskala Bilgisayarlarda Bağlantı Teknolojileri
•Hypercube topolojisinde:
•Düğümler,küp yapısında birbirine
bağlanır.
•Hızlı veri iletimi sağlar.
•Bağlantı kopmalarında bile çalışır.
•Süper bilgisayarlar ve paralel hesaplama
için idealdir.
•Yeni düğümler eklenerek genişletilebilir.

Eksaskala Bilgisayarlarda Bağlantı Teknolojileri
•HyperX,
•süper bilgisayarlar için tasarlanmış,
hiyerarşik yapılar ve paralel bağlantılar
kullanan topolojidir.
•Bağlantılar, hiyerarşik yapılar ile organize
edilir.
•Veri iletimi paralel yollarile yapılır.
•Hızlı veri iletimi sağlar.
•Ağda bağlantı kopmaları olsa da çalışmaya
devam eder.
•Kolayca genişletilebilir, büyük sistemlere
uygundur.

Eksaskala Bilgisayarlarda Enerji Verimliliği Stratejileri
•Eksaskala bilgisayarlarda enerji verimliliği için:
•düşük güç tüketimli işlemciler ve hızlandırıcılar,
•güç farkındalıklı zamanlama algoritmaları,
•dinamik yük yönetimi,
•sıvı soğutma, faz değişimli soğutma ve adaptif soğutma sistemleri
kullanılır.
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

  - Eksaskala Bilgisayar Sistemleri: 2 soru
  - Eksaskala Bilgisayar Tanımı: 2 soru
  - Eksaskala Bilgisayar Avantajları: 2 soru
  - Von Neumann Mimarisi: 2 soru
  - Gpu Ve Tpu Hızlandırıcılar: 2 soru


### Soru Örnekleri (Her Alt Konudan 1 Adet):

#### Eksaskala Bilgisayar Sistemleri:
- Soru: Aşağıdakilerden hangisi eksaskala bilgisayarların temel özelliklerinden biridir?
- Seçenekler: Saniyede 10^9 hesaplama yapabilme | Saniyede 10^12 hesaplama yapabilme | Saniyede 10^15 hesaplama yapabilme | Saniyede 10^18 hesaplama yapabilme
- Doğru Cevap: Saniyede 10^18 hesaplama yapabilme
- Zorluk: easy

#### Eksaskala Bilgisayar Tanımı:
- Soru: Eksaskala bilgisayarların tanımı aşağıdakilerden hangisidir?
- Seçenekler: Petaskala sistemlerden 10 kat daha güçlü bilgisayarlar | Saniyede 1 trilyon işlem yapabilen bilgisayarlar | Petaskala sistemlerden yaklaşık 1000 kat daha güçlü bilgisayarlar | Yapay zeka uygulamalarında kullanılan özel bilgisayarlar
- Doğru Cevap: Petaskala sistemlerden yaklaşık 1000 kat daha güçlü bilgisayarlar
- Zorluk: medium

#### Eksaskala Bilgisayar Avantajları:
- Soru: Aşağıdakilerden hangisi eksaskala bilgisayarların avantajlarından biri değildir?
- Seçenekler: Doğal afetlerin daha etkili yönetilmesi | Akıllı şehirlerin gelişiminin hızlandırılması | Yapay zeka ve büyük veri analitiği uygulamalarından daha hızlı sonuçlar elde edilmesi | Sosyal medya kullanımının kolaylaştırılması
- Doğru Cevap: Sosyal medya kullanımının kolaylaştırılması
- Zorluk: medium

#### Von Neumann Mimarisi:
- Soru: Von Neumann mimarisinde program komutları ve veriler nerede saklanır?
- Seçenekler: Ayrı belleklerde | Aynı bellekte | Sadece işlemcide | Sadece ekran kartında
- Doğru Cevap: Aynı bellekte
- Zorluk: easy

#### Gpu Ve Tpu Hızlandırıcılar:
- Soru: GPU'lar (Grafik İşleme Birimi) hangi tür işlemler için CPU'lardan daha hızlıdır?
- Seçenekler: Genel amaçlı işlemler | Tekil ve karmaşık işlemler | Büyük matris işlemleri | Veritabanı işlemleri
- Doğru Cevap: Büyük matris işlemleri
- Zorluk: medium

