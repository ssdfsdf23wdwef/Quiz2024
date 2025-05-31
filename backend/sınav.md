# Sınav Oluşturma Promptu

## Tarih: 2025-05-31T14:36:59.598Z

## Trace ID: quiz-1748702219587-oxju5

## Alt Konular (9 adet):
```
## AKTİF KONULAR (SORU ÜRETİLECEK)

**Aşağıdaki alt konular için belirtilen sayıda soru üretilecektir:**

1. **Paralel Programlama Paradigmaları** (2 soru)
2. **Paylaşımlı Bellek Paradigması** (2 soru)
3. **Dağıtık Bellek Paradigması** (2 soru)
4. **Hibrit Paralel Programlama** (2 soru)
5. **Döngü Açma Loop Unrolling** (2 soru)

**Toplam Aktif: 5 alt konu, 10 soru**

## BEKLEYEN KONULAR (SORU ÜRETİLMEYECEK)

**Aşağıdaki konulardan soru üretilmeyecektir:**

1. Döngü Birleştirme Loop Fusion
2. Vektörizasyon Vectorization
3. Profilleme Araçları
4. Hata Ayıklama Araçları

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

1. **Paralel Programlama Paradigmaları** (2 soru)
2. **Paylaşımlı Bellek Paradigması** (2 soru)
3. **Dağıtık Bellek Paradigması** (2 soru)
4. **Hibrit Paralel Programlama** (2 soru)
5. **Döngü Açma Loop Unrolling** (2 soru)

**Toplam Aktif: 5 alt konu, 10 soru**

## BEKLEYEN KONULAR (SORU ÜRETİLMEYECEK)

**Aşağıdaki konulardan soru üretilmeyecektir:**

1. Döngü Birleştirme Loop Fusion
2. Vektörizasyon Vectorization
3. Profilleme Araçları
4. Hata Ayıklama Araçları

  *Lütfen dikkat: Bu bölümde "AKTİF KONULAR (SORU ÜRETİLECEK)" ve "BEKLEYEN KONULAR (SORU ÜRETİLMEYECEK)" olmak üzere iki liste görebilirsin.*
- **Eğitim İçeriği:** 

Bilgisayar Mühendisliği Bölümü
Bahar –2025(ÖÖ.,İÖ.)
MBM7-452 -Eksaskala Bilgisayar Sistemleri
(Sunu 3)
Dr. Öğr. Üyesi Esra Çelik

Günün Sorusu
Eksaskala bilgisayarlarda kullanılan
programlama modelleri ve araçları
nelerdir?

Programlama Modelleri ve Araçları
•Programlama modelleri ve araçları,
•tasarımcılara eksaskala sistemlerin yüksek hesaplama gücünü
kullanabilmeleri için bir köprü görevi görür.
•Eksaskala bilgisayar sistemleri için kritik bir roloynar.
•Programlamada kullanılan en temel modeller ve araçlar:
•Paralel Programlama Paradigmaları
•Derleyici Optimizasyonları
•Performans Profilleme ve Hata Ayıklama’dir.

Paralel Programlama Paradigmaları
•Eksaskala sistemlerde verimliliği artırmak için paralellikgücünden yararlanılır.
•Paralel programlama paradigması:
•Bir işlemin küçük parçalara bölünerek aynı anda birden fazla işlemcide
yürütülmesini sağlayan yazılımlardır.
•Büyük ölçekli hesaplamalarda performansı maksimize etmek için kritik bir
bileşendir.

Paralel Programlama Paradigmaları
•Eksaskala sistemlerde kullanılan başlıca paralel programlama
paradigmaları şunlardır:
•Paylaşımlı Bellek Paradigması
•Dağıtık Bellek Paradigması
•Hibrit Paralel Programlama

Paralel Programlama Paradigmaları
•Paylaşımlı bellek paradigması:
•Çok çekirdekli işlemciler için idealdir;
tüm işlemciler ortak belleğe erişir.
•Bu paradigmada:
•OpenMP, mevcut koda direktifler
ekleyerek uygulama geliştirmeyi
kolaylaştırır.
•Düşük iletişim gecikmesi avantajıdır.

Paralel Programlama Paradigmaları
•OpenMP (Open Multi-Processing),
•çok çekirdekli işlemciler ve paylaşımlı bellek mimarileriile paralel uygulamalar
geliştirmek için kullanılır.
•Eksaskala sistemlerde, her düğümdeki yüksek çekirdek sayısı sayesinde görevlerin paralel
çalıştırılmasına olanak tanır.
•Paralellik sağlamak için derleyici direktiflerikullanılır. Örneğin,
•#pragma omp parallel direktifi, paralel bir bölge başlatır ve derleyici, kapsanan görevleri
paralel çalıştırmak için kod üretir.
•#pragma omp for direktifi, for-döngülerinin paralelleştirilmesi için kullanılır.

Paralel Programlama Paradigmaları
•Dağıtık bellek paradigması
•Her işlemci kendi düğümünün
belleğine erişir; veri değişimi
mesajlaşmaile sağlanır.
•Bu paradigmada:
•MPI,yaygın olarak kullanılır.
•Mesajlaşma ek yük getirebilir.

Paralel Programlama Paradigmaları
•Message Passing Interface (MPI),
•dağıtık bellekli ortamlarda paralel uygulamalar geliştirmek için kullanılır.
•Eksaskala sistemlerde bağımsız işlemciler arasında veri alışverişi ve paralel görev
koordinasyonu sağlanır.
•MPI, işlemler arasında doğrudan veri alışverişi sağlayan point-to-point iletişim
mekanizmaları sunar.
•Örneğin MPI_Send ve MPI_Recv fonksiyonları.
MPI

Paralel Programlama Paradigmaları
•Hibrit paralellik,
•farklı paralel programlama paradigmalarının gücünden yararlanmak için birden fazla
paradigma birleştirir.
•Eksaskala bilişimde,
•MPI ve OpenMP paralellik modellerinin kombinasyonu yaygın bir hibrit
yaklaşımdır.
•Bu hibrit yaklaşım,
•hem her bir düğümlerdeki paralel işlem hemde tüm sistem genelindeki paralel
işlemlerinverimli bir şekilde yapılmasını sağlar.
•MPI, işlemler arası iletişimsağlarken, OpenMP, düğüm içindeki paralellikten faydalanarak
paralelleme verimliliğini artırır.
MPI

Paralel Programlama Paradigmaları
•MPI + OpenMP kombinasyonunda:
•MPI:İşlemciler arası iletişim sağlar (dış paralelleştirme).
•OpenMP: Çok çekirdekli işlemciler içinde iş parçacıklarını yönetir (iç
paralelleştirme).
•Avantajı:
•Daha fazla işlem gücü ve daha hızlı veri işleme.
•Kaynak kullanımını optimize eder.
•OpenMP, paylaşımlı bellek içinde çalışarak MPI’nin iletişim yükünü azaltır ve
performansı artırır.

Derleyici Optimizasyonları
•Derleyici optimizasyonları:
•kaynak kodun yüksek verimli makine koduna dönüştürülmesi sürecidir.
•Eksaskala sistemlerde amaç,
•hesaplama verimliliğini artırmak ve bellek erişim gecikmesini azaltılmaktır.
•Derleyici optimizasyonu ile performans iyileştirimesinde,
•döngü açma,
•döngü birleştirme
•ve döngü vektörleştirme teknikleri kullanılır.
•Bu optimizasyonlar, eksaskala sistemlerde optimal performanssağlamak için gereklidir.
Derleyici
Optimizasyonu
Kaynak
kodu
Makine
kodu
(yüksek
verimli)
Hatalar

Derleyici Optimizasyonları
•Döngü açma (Loop Unrolling),
•döngü kontrol yapılarının yükünü azaltmayı amaçlayan bir derleyici
optimizasyon tekniğidir.
•Birden fazla iterasyon tek bir döngüde açılır ve bu da işlemcinin birden fazla talimatı
aynı anda çalıştırmasını mümkün kılar.
•Döngü açma, derleyicinin daha fazla talimat seviyesinde paralellik açığa çıkarmasını
sağlar.

Peki ama
nasıl?

Derleyici Optimizasyonları
•Örneğin, N çift sayı olsun:
for (int i = 0; i < N; i++) {
array[i] = array[i] * 2;
}
•Yukarıdakidöngüde döngü kontrolü (i'nin artırılması ve i < N koşulunun kontrolü) her
iterasyonda bir kez çalışır.
•Her iterasyon bir dizi elemanını işler, toplamda N iterasyon yapılır.

Bu döngüyü nasıl
açabilirsiniz?

Derleyici Optimizasyonları
Çözüm:
•Her iterasyonda tek eleman yerine iki eleman işleyerek toplam iterasyon sayısını
yarıyaindirebilirsiniz. Bunun için:
•i değerini 2 artırılarak döngüye giriş yapılır(i += 2).
•N yerine N/2 iterasyon gerçekleşir.
•Bu şekildebirbirine bağlı olmayaniki eleman(array[i]ve array[i + 1])aynı anda
işlenirve paralellikoluşur.
for (int i = 0; i < N; i += 2) {örneğin bu satır core 1 ile işlenir.
array[i] = array[i] * 2;
array[i + 1] = array[i + 1] * 2;bu satır core 2 ile işlenir.
}

Derleyici Optimizasyonları
Döngü koşulunun kontrol edilmesi ve i'nin artırılması daha az
yapılır.
Her iterasyonda işlenen eleman sayısı arttırılır.
Paralellik sağlanır.
Daha az işlem daha hızlı sonuç alınır.


Döngü açma ile birlikte:



Derleyici Optimizasyonları
•Döngü açmada dikkat edilmesi gereken en temel faktör döngü sınırlarıdır.
•Örneğin:
for (int i = 0; i < N; i++) {
array[i] = array[i] * 2;
}
•Yukarıdaki döndü yapısında N tek sayıise,
•son iterasyon (yani i == N -1) array[i + 1]'e erişmeye çalışacaktır,
•bu da sınır dışı bellek erişimine yol açabilir.

Bu sorunu nasıl
çözersiniz?

Derleyici Optimizasyonları
Çözüm:
•N tek olduğunda döngü içindeki elemanlar (örneğin array[0] ve array[1], array[2] ve
array[3]) çifter çifter işlenir.
•Sadece son eleman (örneğin array[N-1]) döngü dışındabir kez işlenir.
for (int i = 0; i < N -1; i += 2) {
array[i] = array[i] * 2; örneğin bu satır core 1 ile işlenir.
array[i + 1] = array[i + 1] * 2; bu satır core 2 ile işlenir.
}
array[N -1] = array[N -1] * 2;

Derleyici Optimizasyonları
•Döngü birleştirme (Loop Fusion),
•iki veya daha fazla döngünün tek bir döngüde birleştirilmesi işlemidir.
•Eksaskala sistemlerde bu optimizasyon,
•bellek erişimini iyileştirmek ve döngü başlatma maliyetlerini azaltmakiçin
kullanılır.

Peki ama
nasıl?

Derleyici Optimizasyonları
•Örneğin, aşağıdaki iki ayrı döngüolsun:
for (int i = 0; i < N; i++) {
A[i] = B[i] * 2;
}
for (int i = 0; i < N; i++) {
C[i] = A[i]+ 5;
}
•Bu kodda ilk döngü A dizisini hesaplar, ikinci döngü ise A'nın sonuçlarını C dizisine
işler.
•A dizisine iki kez erişilir:
•Birinci döngüde yazılır, ikinci döngüde okunur.
•Bu da gereksiz bellek erişimine neden olur.

Derleyici Optimizasyonları
Çözüm:
•Bu iki döngüyü tek bir döngüyebirleştirerek bellek erişimini optimize edebiliriz:
for (int i = 0; i < N; i++) {
A[i]= B[i] * 2;
C[i] = A[i] + 5;
}
•A[i] birinci satırda hesaplanır ve hemen ikinci satırda kullanılır.
•Tek bir döngü başlatılır.
•Bellek erişimi azaltılır.
Seri
programlama
kullanılmakta

Derleyici Optimizasyonları
Bağımsız işlem adımları içeren döngüler varsa (Örneğin A[i]
önce hesaplanıp sonra C[i]'de kullanılıyorsa)
Diziler arasındaki veri bağımlılığı yoksa
Yada veri bağımlılığı kontrol ediliyorsa
Bellek performansı artırılmak isteniyorsa


Döngü birleştirme ne zaman kullanılır?



Derleyici Optimizasyonları
•Vektörizasyon (Vectorization):
•Tek Komut Çoklu Veri (SIMD) paralelliğiolarak da bilinen bir
optimizasyon tekniğidir.
•Bu teknik,
•aynı işlemci komutunun birden fazla veri elemanına aynı anda
uygulanmasını sağlar
•Özellikle diziler veya vektörler üzerinde çalışan döngüler için oldukça
etkilidir.
•Modern işlemciler, SIMD komut setleri (SSE, AVX, Neon vb.) ile vektör
işlemlerini hızlandırır.

Derleyici Optimizasyonları
•Örneğin 8 elemanlı bir dizininher elemanı 2 ile çarpılmak istensin:
•Skaler işlem yapılır. Yani standart bir for döngüsüyle her elemanı tek tek çarpılır:
int array[8] = {1, 2, 3, 4, 5, 6, 7, 8};
for (int i = 0; i < 8; i++) {
array[i] = array[i] * 2;
}
•İşlem Adımları:
•İlk iterasyon: array[0] = 1 * 2
•İkinci iterasyon: array[1] = 2 * 2
•Üçüncü iterasyon: array[2] = 3 * 2
•...
•Sekizinci iterasyon: array[7] = 8 * 2
•Toplamda 8 işlem yapılır (8 döngü turu).

Bu işlem
vektörleştirme
ile nasıl olur?

Derleyici Optimizasyonları
Çözüm 1:
•4’lü SIMDile Vektörizasyonda4 tane sayı tek seferde işlenebilir.
int array[8] = {1, 2, 3, 4, 5, 6, 7, 8};
#pragma omp simd
for (int i = 0; i < 8; i++) {
array[i] = array[i] * 2;
}
•İşlem adımları:
•İlk adımda işlemci 4 elemanı aynı andaçarpar: {1, 2, 3, 4} * 2 → {2, 4, 6, 8}
•İkinci adımda diğer 4 elemanı aynı anda çarpar: {5, 6, 7, 8} * 2 → {10, 12, 14, 16}
•Toplamda 2 döngü turu ile işlem tamamlanır.

Derleyici Optimizasyonları
Çözüm 2:
•8’lü SIMDile Vektörizasyonda8tane sayı tek seferde işlenebilir.
int array[8] = {1, 2, 3, 4, 5, 6, 7, 8};
#pragma omp simd
for (int i = 0; i < 8; i++) {
array[i] = array[i] * 2;
}
•İşlem adımları:
•Tek adımda işlemci 8elemanı aynı andaçarpar:
•{1, 2, 3, 4, 5, 6, 7, 8} * 2 → {2, 4, 6, 8, 10, 12, 14, 16}
•Toplamda 1 döngü turu ile işlem tamamlanır.

Derleyici Optimizasyonları
Tek bir saat döngüsünde birden fazla veri elemanını işler.
İşlem süresini hızlandırır.
Bellekten okuma ve yazma işlemlerinin sayısını azaltır.
Güç tüketimini azaltır.


Vektörizasyonun avantajları nelerdir?



Performans Profilleme ve Hata Ayıklama
•Eksaskala sistemlerde, işlemci veya çekirdek sayısı arttıkça uygulamanın
performansı analiz edilir.
•Profilleme ve hata ayıklama,
•Eksaskala sistemlerde kod verimliliğini optimize etmek ve performans
sorunlarını tespit etmek için kullanılır.
•Profilleme,
•programın çalışma zamanı davranışını analiz etmeye ve darboğazları tespit
etmeyeyardımcı olur.
•Hata ayıklama,
•performans, eşzamanlılık ve kaynak kullanımıyla ilgili hataları giderir ve
programın doğruluğunu sağlar.

Performans Profilleme ve Hata Ayıklama
•Eksaskala sistemlerde profilleme araçları genel olarak işlemci, bellek ve I/O
kullanımıgibi farklı kaynakların nasıl kullanıldığını analiz eder.
•Eksaskala sistemlerde en sık kullanılan profilleme araçlar:
•Intel VTune Amplifier
•Cray Pat
•TAU (Tuning and Analysis Utilities)
•gprof
•perf

Performans Profilleme ve Hata Ayıklama
•Eksaskala sistemlerde hata ayıklama araçları genel olarak bellek hataları, veri
yarışları gibi hataları analiz eder.
•Eksaskala sistemlerde en sık kullanılan hata ayıklama araçları:
•TotalView
•GDB (GNU Debugger)
•Allinea DDT
•Intel Debugger (IDB)
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

  - Paralel Programlama Paradigmaları: 2 soru
  - Paylaşımlı Bellek Paradigması: 2 soru
  - Dağıtık Bellek Paradigması: 2 soru
  - Hibrit Paralel Programlama: 2 soru
  - Döngü Açma Loop Unrolling: 2 soru


### Soru Örnekleri (Her Alt Konudan 1 Adet):

#### Paralel Programlama Paradigmaları:
- Soru: Aşağıdakilerden hangisi eksaskala sistemlerde verimliliği artırmak için kullanılan temel yaklaşımlardan biridir?
- Seçenekler: Tek çekirdekli işlemci kullanımı | Paralellikten yararlanma | Bellek erişimini en aza indirme | Seri programlama
- Doğru Cevap: Paralellikten yararlanma
- Zorluk: medium

#### Paylaşımlı Bellek Paradigması:
- Soru: Paylaşımlı bellek paradigması için aşağıdakilerden hangisi doğrudur?
- Seçenekler: Her işlemci kendi özel belleğine sahiptir. | Tüm işlemciler ortak bir belleğe erişir. | Veri iletişimi mesajlaşma yoluyla sağlanır. | Sadece dağıtık sistemlerde kullanılır.
- Doğru Cevap: Tüm işlemciler ortak bir belleğe erişir.
- Zorluk: easy

#### Dağıtık Bellek Paradigması:
- Soru: Dağıtık bellek paradigmasında veri değişimi nasıl sağlanır?
- Seçenekler: Ortak bir bellek alanı üzerinden | Mesajlaşma ile | Paylaşımlı değişkenler aracılığıyla | Sanal bellek yönetimi ile
- Doğru Cevap: Mesajlaşma ile
- Zorluk: easy

#### Hibrit Paralel Programlama:
- Soru: Hibrit paralel programlama yaklaşımının temel özelliği nedir?
- Seçenekler: Sadece paylaşımlı bellek paradigmasını kullanması | Sadece dağıtık bellek paradigmasını kullanması | Farklı paralel programlama paradigmalarının gücünden yararlanmak için birden fazla paradigmayı birleştirmesi | Sadece tek çekirdekli işlemcilerde çalışması
- Doğru Cevap: Farklı paralel programlama paradigmalarının gücünden yararlanmak için birden fazla paradigmayı birleştirmesi
- Zorluk: easy

#### Döngü Açma Loop Unrolling:
- Soru: Döngü açma (Loop Unrolling) tekniğinin temel amacı nedir?
- Seçenekler: Döngü kontrol yapılarının yükünü azaltmak | Döngüleri birleştirerek bellek erişimini artırmak | Döngüleri vektörleştirerek SIMD paralelliği sağlamak | Döngüleri tamamen ortadan kaldırmak
- Doğru Cevap: Döngü kontrol yapılarının yükünü azaltmak
- Zorluk: easy

