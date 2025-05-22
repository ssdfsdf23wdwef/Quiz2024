# Sınav Oluşturma Promptu

## Tarih: 2025-05-22T14:41:00.441Z

## Trace ID: quiz-1747924860173-cd4io

## Alt Konular (8 adet):
```
## AKTİF KONULAR (SORU ÜRETİLECEK)

**Aşağıdaki alt konular için belirtilen sayıda soru üretilecektir:**

1. **Eksaskala Sistemlerde Uygulama Geli Tirme Zorluklar** (2 soru)
2. **Donan M Karma Kl Ve Y Netimi** (2 soru)
3. **Veri Hareketi Y Netiminin Nemi** (2 soru)
4. **Y Ksek D Zeyde Paralellik Ve Kontrol** (2 soru)
5. **Donan M Bazl Ğirev Da L M Stratejileri** (2 soru)

**Toplam Aktif: 5 alt konu, 10 soru**

## BEKLEYEN KONULAR (SORU ÜRETİLMEYECEK)

**Aşağıdaki konulardan soru üretilmeyecektir:**

1. Bellek Hiyerar İsinde Veri Yerle İmi
2. Ğirev Ba Ml L Kontrol
3. İ Y K Dengeleme Teknikleri

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

1. **Eksaskala Sistemlerde Uygulama Geli Tirme Zorluklar** (2 soru)
2. **Donan M Karma Kl Ve Y Netimi** (2 soru)
3. **Veri Hareketi Y Netiminin Nemi** (2 soru)
4. **Y Ksek D Zeyde Paralellik Ve Kontrol** (2 soru)
5. **Donan M Bazl Ğirev Da L M Stratejileri** (2 soru)

**Toplam Aktif: 5 alt konu, 10 soru**

## BEKLEYEN KONULAR (SORU ÜRETİLMEYECEK)

**Aşağıdaki konulardan soru üretilmeyecektir:**

1. Bellek Hiyerar İsinde Veri Yerle İmi
2. Ğirev Ba Ml L Kontrol
3. İ Y K Dengeleme Teknikleri

  *Lütfen dikkat: Bu bölümde "AKTİF KONULAR (SORU ÜRETİLECEK)" ve "BEKLEYEN KONULAR (SORU ÜRETİLMEYECEK)" olmak üzere iki liste görebilirsin.*
- **Eğitim İçeriği:** 

Bilgisayar Mühendisliği Bölümü
Bahar –2025(ÖÖ.,İÖ.)
MBM7-452 -Eksaskala Bilgisayar Sistemleri
(Sunu 7)
Dr. Öğr. Üyesi Esra Çelik

Günün Sorusu
Eksaskala bilgisayar sistemlerinde
uygulama geliştirme neden zor olabilir?

Uygulama Geliştirmenin Zorlukları -1
•Donanım karmaşıklığı vardır ve kontrol gerektirir:
•Çünkü, milyonlarca çekirdek, heterojen mimariler (CPU, GPU,
TPU vb.) ve farklı bellek türleri kullanılır.

Donanım Karmaşıklığı
Örneğin, İklim Simülasyonuyapan bir uygulama geliştirmek isteniliyor.
Sistemde:
1.Yürütülecek görevler/işlemler neler olabilir?
2.Görev dağılımı nasıl yapılmalı, hangi işlemler hangi donanımda
daha verilmli çalışır?
3.Hangi veriler hangi belleklere yerleştirilmeli?

Donanım Karmaşıklığı
1.Sistemde yürütülecek görevler/işlemler neler olabilir?
•Ana kontrol işlemleri ve seri görevler
•Atmosfer modellemesinde yüksek paralellik gerektiren işlemler
•Öğrenen modellerle iklim değişkenlerini tahmin etme işlemleri
**Bu görevler/işlemler hangi donanım(lar) üzerinde yürütülmeli?

Donanım Karmaşıklığı
2. Görev dağılımı nasıl yapılmalı, hangi işlemler hangi donanımda
daha verilmli çalışır?
•Ana kontrol işlemleri ve seri görevleriçin CPU
•Atmosfer modellemesinde yüksek paralellik gerektiren işlemler için GPU
•Öğrenen modellerle iklim değişkenlerini tahmin etme işlemleri için TPU
**Bu görevler/işlemler için kullanılacak veriler hangi belleklere
kaydedilmeli?

Donanım Karmaşıklığı
3. Hangi veriler hangi belleklere yerleştirilmeli?
•Büyük ve nadir erişim gerektiren ham sensör verileri için CPU
belleği / RAM / SSD
•Paralel işleme için hızlı erişim gerektiren hesaplama verileri için GPU
belleği
•Makine öğrenmesi için optimize donanım gerektiren model
parameteleri için TPU belleği

Donanım Karmaşıklığı
Eksaskalabilgisayarsistemlerindemimari,bellekvb.yapıların
çeşitlenmesineveartışınabağlıolaraksistemdegörülentemel
zorluklar:
•Donanımkarmaşıklığı
•Görev/işlemdağılımıbazlıplanlamazorlukları
•Veridağılımıbazlıplanlamazorlukları

Uygulama Geliştirmenin Zorlukları -2
•Veri hareketi yönetimi planlı olmalıdır:
•Çünkü, bellekten işlemciye veri taşıma maliyeti yüksektir.

Veri Hareketi Yönetimi
Örneğin, İklim Simülasyonuyapan uygulama için,
Sistemde:
1. Veri hareketi yönetimi neden önemli?
•Veriye erişim süresi, işlem süresinden daha fazla maliyet
oluşturabilir.
•Bellekten GPU’ya veri taşımak CPU işleminden daha pahalıya
mal olabilir.
•Yanlış yerleştirilmiş veri, işlemcinin beklemesine yani performans
kaybına neden olur.

Veri Hareketi Yönetimi
Eksaskalabilgisayarsistemlerindeverihareketiyönetimindetemel
zorluk,sistemdekiverimiktarınınartışınabağlıolarak
•Verilerinuygunişlemcibelleklerineyerleştirilmesindeki
karmaşıklığınartmasıdır.

Uygulama Geliştirmenin Zorlukları -3
•Yüksek düzeyde paralellik için kontrol gerektirir:
•Çünkü, görev bağımlılığı ve doğru yük dengelemesi kontrolü
yapmamak hatalı sonuçlara sebep olur ve performansı büyük
ölçüde düşürür.

Yüksek Düzeyde Paralellik
Örneğin,herbirifarklısürelerdeçalışan6farklıgörevinparalel
çalıştırılmasıgereken2çekirdeklibirsistemileilgilibilgileraşağıdayer
alır:
1.Görev A: Veritabanından veri çekme (5 saniye)
2.Görev B:Veritabanı verilerini işleme (10 saniye)
3.Görev C:İşlenen veriyi raporlama (8saniye)
4.Görev D:Hata kontrolü ve sonuçları değerlendirme (2 saniye)
5.Görev E:Sistemin izlenmesi (35 saniye)
6.Görev F:Arka plan işlemleri (10 saniye)
** Bu sistemde ne tür zorluklarla karşılaşılabilir?

Yüksek Düzeyde Paralellik
Busistemdegörülebilecekentemelzorluklar:
•görevbağımlılığıkontrolüve
•işyüküdengelemedir.

Yüksek Düzeyde Paralellik
Görevbağımlılığıkontrolüyapıldığında:
•GörevB'yiçalıştırmakiçinGörevA'nınverileriçekmesigeretiği
•GörevC'yiçalıştırmakiçinGörevB'ninverileriişlemesigerektiği
•GörevD'yiçalıştırmakiçinGörevC'ninraporlamaişleminiyapması
gerektiği
•GörevEveF’ninherhangibirgörevileparalelçalıştırılabilirolduğu
görülür.
**DolayısıylaGörevEveFdışındakalangörevlerfarklıişlemcilerdeparalel
olarakyürütülemezler.

Yüksek Düzeyde Paralellik
Görevbağımlılığıkontrolüyapılmazsa
•GörevBeksikveyahatalıverileredayanarakçalışabilir.
•GörevChatalıişlenmişverilerikullanır.
•GörevDyanlışbirraporilehatalıbirdeğerlendirmeyapar.
**Sonuçolaraktümgörevlerarasındabağımlılıkkontrolüyapılması
zorunludur.

Yüksek Düzeyde Paralellik
Eksaskalabilgisayarsistemlerindegörevbağımlılığıkontrolündeki
temelzorluk,sistemdekigörevsayısınınartışınabağlıolarakşunları
içerir:
•Görevbağımlılıklarınkarmaşıklaşması
•Görevlerinzamanlanmasıvesenkronizasyonsorunları

Yüksek Düzeyde Paralellik
İşyüküdengelemeyapılmazsa:
•Çekirdek1:GörevA(5saniye)+GörevB(10saniye)+GörevC(8saniye)+GörevD(2saniye)
•Çekirdek1,toplam25saniyeçalışır.
•Çekirdek2:GörevE(35saniye)+GörevF(10saniye)
•Çekirdek2,toplam45saniyeçalışır.
**Budağılımda,Çekirdek1çokdahaazbirsüreçalışırkenÇekirdek2daha
uzunsüreçalışacaktır.Budaişyüküaçısındandengesizbirdağılımoluşturur.

Yüksek Düzeyde Paralellik
İşyüküdengelemeyapılırsa:
•Çekirdek1:GörevA(5saniye)+GörevB(10saniye)+GörevC(8saniye)+GörevD(2saniye)+Görev
F(10saniye)
•Çekirdek1,toplam35saniyeçalışır.
•Çekirdek2:GörevE(35saniye)
•Çekirdek2,toplam35saniyeçalışır.
**Buşekildedengelidağılımparalelişlemeyidahaverimlihalegetirir.

Yüksek Düzeyde Paralellik
Eksaskalabilgisayarsistemlerindeişyüküdengelemedetemelzorluk,
sistemdekigörevsayısınınveçekirdeksayısınınartışınabağlıolarak
•Görevveçekirdekeşleşmesininkarmaşıklığınınartmasıdır.

Uygulama Geliştirmenin Zorlukları -4
•Eksaskala bilgisayar sistemlerinde programlama modelleri,
kütüphaneler ve araçları bakımından temel zorluk:
•Bu modeller, kütüphaneler ve araçların çeşitliliği arttıkça
kullanımları için karmaşık ve platforma özel bilgi
gerektiriyor olmasıdır.

Uygulama Geliştirmenin Zorlukları -5
•Eksaskala bilgisayar sistemlerinin öğrenilmesinin güç olmasıyla
ilgili temel zorluk:
•Uygulama geliştiriciler için eksaskala sistemleri öğrenmek
zaman alıcı olması ve hem teorik bilgi hem de pratik beceri
gerektiriyor olmasıdır.
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



## AI Yanıtı:
```json
```json
{
  "questions": [
    {
      "id": "q1",
      "questionText": "Eksaskala bilgisayar sistemlerinde uygulama geliştirmenin zorluklarından biri olan donanım karmaşıklığı, hangi temel faktörlerle ilişkilidir?",
      "questionType": "multiple_choice",
      "cognitiveDomain": "understanding",
      "options": [
        "Sadece CPU çekirdeklerinin sayısının artmasıyla",
        "Yalnızca GPU ve TPU gibi heterojen mimarilerin kullanımının azalmasıyla",
        "Milyonlarca çekirdek, heterojen mimariler (CPU, GPU, TPU vb.) ve farklı bellek türlerinin kullanılmasıyla",
        "Sadece bellek türlerinin sayısının azalmasıyla"
      ],
      "correctAnswer": "Milyonlarca çekirdek, heterojen mimariler (CPU, GPU, TPU vb.) ve farklı bellek türlerinin kullanılmasıyla",
      "explanation": "Eksaskala sistemlerdeki donanım karmaşıklığı, çok sayıda çekirdek, farklı mimariler ve çeşitli bellek türlerinin bir arada kullanılmasından kaynaklanır. Bu durum, uygulama geliştirme sürecini zorlaştırır. Diğer seçenekler bu karmaşıklığı tam olarak yansıtmamaktadır.",
      "subTopicName": "Eksaskala Sistemlerde Uygulama Geli Tirme Zorluklar",
      "normalizedSubTopicName": "eksaskala_sistemlerde_uygulama_geli_tirme_zorluklar",
      "difficulty": "medium"
    },
    {
      "id": "q2",
      "questionText": "İklim simülasyonu yapan bir uygulamada, öğrenen modellerle iklim değişkenlerini tahmin etme işlemleri için en uygun donanım hangisidir?",
      "questionType": "multiple_choice",
      "cognitiveDomain": "applying",
      "options": [
        "CPU",
        "GPU",
        "TPU",
        "SSD"
      ],
      "correctAnswer": "TPU",
      "explanation": "TPU'lar (Tensor İşlem Birimleri), makine öğrenmesi iş yükleri için optimize edilmişlerdir ve öğrenen modellerle iklim değişkenlerini tahmin etme gibi işlemler için en uygun donanımı oluştururlar. CPU'lar genel amaçlı işlemler için, GPU'lar ise yüksek paralellik gerektiren işlemler için daha uygundur.",
      "subTopicName": "Eksaskala Sistemlerde Uygulama Geli Tirme Zorluklar",
      "normalizedSubTopicName": "eksaskala_sistemlerde_uygulama_geli_tirme_zorluklar",
      "difficulty": "medium"
    },
    {
      "id": "q3",
      "questionText": "Eksaskala sistemlerde donanım karmaşıklığı bağlamında, görev dağılımı yapılırken hangi husus dikkate alınmalıdır?",
      "questionType": "multiple_choice",
      "cognitiveDomain": "analyzing",
      "options": [
        "Tüm görevlerin aynı donanım üzerinde çalıştırılması",
        "Görevlerin hangi donanımda daha verimli çalıştığının belirlenmesi",
        "Sadece CPU kullanımının optimize edilmesi",
        "Sadece GPU kullanımının optimize edilmesi"
      ],
      "correctAnswer": "Görevlerin hangi donanımda daha verimli çalıştığının belirlenmesi",
      "explanation": "Donanım karmaşıklığı dikkate alındığında, görev dağılımı yapılırken her görevin hangi donanım üzerinde daha verimli çalıştığının belirlenmesi önemlidir. Bu, performansı artırır ve kaynakların etkin kullanımını sağlar. Diğer seçenekler, sistemin potansiyelini tam olarak kullanmamıza engel olur.",
      "subTopicName": "Donan M Karma Kl Ve Y Netimi",
      "normalizedSubTopicName": "donan_m_karma_kl_ve_y_netimi",
      "difficulty": "medium"
    },
    {
      "id": "q4",
      "questionText": "Eksaskala bilgisayar sistemlerinde, mimari ve bellek yapılarının çeşitlenmesi ve artmasıyla ortaya çıkan temel zorluklardan biri aşağıdakilerden hangisidir?",
      "questionType": "multiple_choice",
      "cognitiveDomain": "remembering",
      "options": [
        "Donanım karmaşıklığı",
        "Yazılım basitliği",
        "Enerji verimliliği",
        "Maliyet düşüklüğü"
      ],
      "correctAnswer": "Donanım karmaşıklığı",
      "explanation": "Eksaskala sistemlerde mimari ve bellek yapılarının çeşitlenmesi ve artması, donanım karmaşıklığını artırır. Bu durum, sistemlerin yönetimi ve optimizasyonu açısından zorluklar yaratır. Diğer seçenekler genellikle hedeflenen özellikler olsa da, bu sistemlerin doğasında var olan zorlukları yansıtmaz.",
      "subTopicName": "Donan M Karma Kl Ve Y Netimi",
      "normalizedSubTopicName": "donan_m_karma_kl_ve_y_netimi",
      "difficulty": "easy"
    },
    {
      "id": "q5",
      "questionText": "Eksaskala bilgisayar sistemlerinde veri hareketi yönetiminin önemi nedir?",
      "questionType": "multiple_choice",
      "cognitiveDomain": "understanding",
      "options": [
        "Veri hareketi maliyetinin düşük olması",
        "Veriye erişim süresinin işlem süresinden daha az maliyet oluşturması",
        "Bellekten işlemciye veri taşıma maliyetinin yüksek olması",
        "Yanlış yerleştirilmiş verinin performansı artırması"
      ],
      "correctAnswer": "Bellekten işlemciye veri taşıma maliyetinin yüksek olması",
      "explanation": "Veri hareketi yönetimi, eksaskala sistemlerde önemlidir çünkü bellekten işlemciye veri taşıma maliyeti yüksektir. Veriye erişim süresi, işlem süresinden daha fazla maliyet oluşturabilir ve yanlış yerleştirilmiş veri performans kaybına neden olabilir.",
      "subTopicName": "Veri Hareketi Y Netiminin Nemi",
      "normalizedSubTopicName": "veri_hareketi_y_netiminin_nemi",
      "difficulty": "medium"
    },
    {
      "id": "q6",
      "questionText": "Eksaskala bilgisayar sistemlerinde veri hareketi yönetimindeki temel zorluk nedir?",
      "questionType": "multiple_choice",
      "cognitiveDomain": "understanding",
      "options": [
        "Veri miktarının azalması",
        "Verilerin uygun işlemci belleklerine yerleştirilmesindeki karmaşıklığın artması",
        "Veri erişim hızının artması",
        "Bellek teknolojilerinin basitleşmesi"
      ],
      "correctAnswer": "Verilerin uygun işlemci belleklerine yerleştirilmesindeki karmaşıklığın artması",
      "explanation": "Eksaskala sistemlerde veri miktarının artmasıyla birlikte, verilerin uygun işlemci belleklerine yerleştirilmesindeki karmaşıklık artar. Bu durum, veri hareketi yönetimini zorlaştırır ve performans optimizasyonu gerektirir.",
      "subTopicName": "Veri Hareketi Y Netiminin Nemi",
      "normalizedSubTopicName": "veri_hareketi_y_netiminin_nemi",
      "difficulty": "medium"
    },
    {
      "id": "q7",
      "questionText": "Eksaskala bilgisayar sistemlerinde yüksek düzeyde paralellik için kontrolün gerekliliği neden önemlidir?",
      "questionType": "multiple_choice",
      "cognitiveDomain": "understanding",
      "options": [
        "Görev bağımlılığı ve doğru yük dengelemesi kontrolü yapmamak hatalı sonuçlara sebep olur ve performansı büyük ölçüde düşürür.",
        "Paralel işlemlerde kontrol ihtiyacının azalması",
        "Görev bağımlılığının önemsiz hale gelmesi",
        "Yük dengelemesinin otomatik olarak sağlanması"
      ],
      "correctAnswer": "Görev bağımlılığı ve doğru yük dengelemesi kontrolü yapmamak hatalı sonuçlara sebep olur ve performansı büyük ölçüde düşürür.",
      "explanation": "Yüksek düzeyde paralellik için kontrol gereklidir çünkü görev bağımlılığı ve doğru yük dengelemesi kontrolü yapılmadığında hatalı sonuçlar ortaya çıkar ve performans düşer. Bu nedenle, görevler arasındaki ilişkilerin ve iş yükünün dengeli dağılımının kontrol edilmesi önemlidir.",
      "subTopicName": "Y Ksek D Zeyde Paralellik Ve Kontrol",
      "normalizedSubTopicName": "y_ksek_d_zeyde_paralellik_ve_kontrol",
      "difficulty": "medium"
    },
    {
      "id": "q8",
      "questionText": "Eksaskala bilgisayar sistemlerinde görev bağımlılığı kontrolündeki temel zorluk nedir?",
      "questionType": "multiple_choice",
      "cognitiveDomain": "understanding",
      "options": [
        "Görev sayısının azalması",
        "Görev bağımlılıklarının karmaşıklaşması",
        "Görevlerin basitleşmesi",
        "Görevlerin eş zamanlı çalıştırılmasının kolaylaşması"
      ],
      "correctAnswer": "Görev bağımlılıklarının karmaşıklaşması",
      "explanation": "Eksaskala sistemlerde görev sayısının artmasıyla birlikte görev bağımlılıkları karmaşıklaşır. Bu durum, görevlerin doğru sırada ve zamanda yürütülmesini zorlaştırır, bu da hatalı sonuçlara ve performans sorunlarına yol açabilir.",
      "subTopicName": "Y Ksek D Zeyde Paralellik Ve Kontrol",
      "normalizedSubTopicName": "y_ksek_d_zeyde_paralellik_ve_kontrol",
      "difficulty": "medium"
    },
    {
      "id": "q9",
      "questionText": "Donanım bazlı görev dağılımı stratejilerinde, bir görevin hangi donanımda daha verimli çalışacağını belirlemek için hangi faktörler göz önünde bulundurulmalıdır?",
      "questionType": "multiple_choice",
      "cognitiveDomain": "analyzing",
      "options": [
        "Sadece görevin karmaşıklığı",
        "Görevin türü, veri erişim gereksinimleri ve donanımın özellikleri",
        "Sadece donanımın maliyeti",
        "Sadece görevin önceliği"
      ],
      "correctAnswer": "Görevin türü, veri erişim gereksinimleri ve donanımın özellikleri",
      "explanation": "Donanım bazlı görev dağılımı stratejilerinde, görevin türü (örneğin, hesaplama yoğun, veri yoğun), veri erişim gereksinimleri (hızlı bellek erişimi, büyük veri setleri) ve donanımın özellikleri (CPU, GPU, TPU) dikkate alınmalıdır. Bu faktörler, görevin hangi donanımda daha verimli çalışacağını belirlemede kritik öneme sahiptir.",
      "subTopicName": "Donan M Bazl Ğirev Da L M Stratejileri",
      "normalizedSubTopicName": "donan_m_bazl_girev_da_l_m_stratejileri",
      "difficulty": "medium"
    },
    {
      "id": "q10",
      "questionText": "Eksaskala sistemlerde donanım bazlı görev dağılımı stratejileri uygulanırken, hangi temel amaç güdülmelidir?",
      "questionType": "multiple_choice",
      "cognitiveDomain": "understanding",
      "options": [
        "Sadece maliyeti düşürmek",
        "Sadece enerji tüketimini azaltmak",
        "Görevleri en uygun donanım kaynaklarına atayarak performansı en üst düzeye çıkarmak",
        "Sadece belirli bir donanım türünü kullanmak"
      ],
      "correctAnswer": "Görevleri en uygun donanım kaynaklarına atayarak performansı en üst düzeye çıkarmak",
      "explanation": "Donanım bazlı görev dağılımı stratejilerinin temel amacı, görevleri en uygun donanım kaynaklarına atayarak performansı en üst düzeye çıkarmaktır. Bu, sistem kaynaklarının verimli kullanılmasını ve uygulamaların daha hızlı çalışmasını sağlar.",
      "subTopicName": "Donan M Bazl Ğirev Da L M Stratejileri",
      "normalizedSubTopicName": "donan_m_bazl_girev_da_l_m_stratejileri",
      "difficulty": "medium"
    }
  ]
}
```
```



## İşlenen Sorular Analizi:

- Toplam Soru Sayısı: 10
- Alt Konu Dağılımı:

  - Eksaskala Sistemlerde Uygulama Geli Tirme Zorluklar: 2 soru
  - Donan M Karma Kl Ve Y Netimi: 2 soru
  - Veri Hareketi Y Netiminin Nemi: 2 soru
  - Y Ksek D Zeyde Paralellik Ve Kontrol: 2 soru
  - Donan M Bazl Ğirev Da L M Stratejileri: 2 soru


### Soru Örnekleri (Her Alt Konudan 1 Adet):

#### Eksaskala Sistemlerde Uygulama Geli Tirme Zorluklar:
- Soru: Eksaskala bilgisayar sistemlerinde uygulama geliştirmenin zorluklarından biri olan donanım karmaşıklığı, hangi temel faktörlerle ilişkilidir?
- Seçenekler: Sadece CPU çekirdeklerinin sayısının artmasıyla | Yalnızca GPU ve TPU gibi heterojen mimarilerin kullanımının azalmasıyla | Milyonlarca çekirdek, heterojen mimariler (CPU, GPU, TPU vb.) ve farklı bellek türlerinin kullanılmasıyla | Sadece bellek türlerinin sayısının azalmasıyla
- Doğru Cevap: Milyonlarca çekirdek, heterojen mimariler (CPU, GPU, TPU vb.) ve farklı bellek türlerinin kullanılmasıyla
- Zorluk: medium

#### Donan M Karma Kl Ve Y Netimi:
- Soru: Eksaskala sistemlerde donanım karmaşıklığı bağlamında, görev dağılımı yapılırken hangi husus dikkate alınmalıdır?
- Seçenekler: Tüm görevlerin aynı donanım üzerinde çalıştırılması | Görevlerin hangi donanımda daha verimli çalıştığının belirlenmesi | Sadece CPU kullanımının optimize edilmesi | Sadece GPU kullanımının optimize edilmesi
- Doğru Cevap: Görevlerin hangi donanımda daha verimli çalıştığının belirlenmesi
- Zorluk: medium

#### Veri Hareketi Y Netiminin Nemi:
- Soru: Eksaskala bilgisayar sistemlerinde veri hareketi yönetiminin önemi nedir?
- Seçenekler: Veri hareketi maliyetinin düşük olması | Veriye erişim süresinin işlem süresinden daha az maliyet oluşturması | Bellekten işlemciye veri taşıma maliyetinin yüksek olması | Yanlış yerleştirilmiş verinin performansı artırması
- Doğru Cevap: Bellekten işlemciye veri taşıma maliyetinin yüksek olması
- Zorluk: medium

#### Y Ksek D Zeyde Paralellik Ve Kontrol:
- Soru: Eksaskala bilgisayar sistemlerinde yüksek düzeyde paralellik için kontrolün gerekliliği neden önemlidir?
- Seçenekler: Görev bağımlılığı ve doğru yük dengelemesi kontrolü yapmamak hatalı sonuçlara sebep olur ve performansı büyük ölçüde düşürür. | Paralel işlemlerde kontrol ihtiyacının azalması | Görev bağımlılığının önemsiz hale gelmesi | Yük dengelemesinin otomatik olarak sağlanması
- Doğru Cevap: Görev bağımlılığı ve doğru yük dengelemesi kontrolü yapmamak hatalı sonuçlara sebep olur ve performansı büyük ölçüde düşürür.
- Zorluk: medium

#### Donan M Bazl Ğirev Da L M Stratejileri:
- Soru: Donanım bazlı görev dağılımı stratejilerinde, bir görevin hangi donanımda daha verimli çalışacağını belirlemek için hangi faktörler göz önünde bulundurulmalıdır?
- Seçenekler: Sadece görevin karmaşıklığı | Görevin türü, veri erişim gereksinimleri ve donanımın özellikleri | Sadece donanımın maliyeti | Sadece görevin önceliği
- Doğru Cevap: Görevin türü, veri erişim gereksinimleri ve donanımın özellikleri
- Zorluk: medium

