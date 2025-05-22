# Sınav Oluşturma Promptu

## Tarih: 2025-05-22T20:50:42.154Z

## Trace ID: quiz-1747947042138-no3lz

## Alt Konular (9 adet):
```
## AKTİF KONULAR (SORU ÜRETİLECEK)

**Aşağıdaki alt konular için belirtilen sayıda soru üretilecektir:**

1. **S Perbilgisayar S Ralama Listeleri** (2 soru)
2. **Top500 Tan M Ve Amac** (2 soru)
3. **Hpcğitan M Ve Amac** (2 soru)
4. **Green500 Tan M Ve Amac** (2 soru)
5. **Linpack Testi Ve Flops** (2 soru)

**Toplam Aktif: 5 alt konu, 10 soru**

## BEKLEYEN KONULAR (SORU ÜRETİLMEYECEK)

**Aşağıdaki konulardan soru üretilmeyecektir:**

1. Top500 N S N Rlamalar
2. Konjugat Gradyan Y Ntemi
3. Bellek Ve Veri Transfer Performans
4. Flops Watt Oran

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

1. **S Perbilgisayar S Ralama Listeleri** (2 soru)
2. **Top500 Tan M Ve Amac** (2 soru)
3. **Hpcğitan M Ve Amac** (2 soru)
4. **Green500 Tan M Ve Amac** (2 soru)
5. **Linpack Testi Ve Flops** (2 soru)

**Toplam Aktif: 5 alt konu, 10 soru**

## BEKLEYEN KONULAR (SORU ÜRETİLMEYECEK)

**Aşağıdaki konulardan soru üretilmeyecektir:**

1. Top500 N S N Rlamalar
2. Konjugat Gradyan Y Ntemi
3. Bellek Ve Veri Transfer Performans
4. Flops Watt Oran

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



## AI Yanıtı:
```json
```json
{
  "questions": [
    {
      "id": "q1",
      "questionText": "Süperbilgisayarların kullanım alanları düşünüldüğünde, aşağıdakilerden hangisi bu sistemlerin yaygın olarak kullanıldığı bir alan değildir?",
      "questionType": "multiple_choice",
      "cognitiveDomain": "understanding",
      "options": [
        "Bilimsel araştırmalar",
        "Yapay zeka",
        "Finansal modelleme",
        "Ev kullanımı"
      ],
      "correctAnswer": "Ev kullanımı",
      "explanation": "Süperbilgisayarlar yüksek hesaplama gücü gerektiren bilimsel araştırmalar, yapay zeka ve finansal modelleme gibi alanlarda kullanılırken, ev kullanımı için uygun değildir. Metinde süperbilgisayarların bilimsel araştırmalardan yapay zekaya kadar pek çok alanda kullanıldığı belirtilmiştir.",
      "subTopicName": "S Perbilgisayar S Ralama Listeleri",
      "normalizedSubTopicName": "s_perbilgisayar_s_ralama_listeleri",
      "difficulty": "easy"
    },
    {
      "id": "q2",
      "questionText": "Aşağıdakilerden hangisi süperbilgisayarların hızını, verimliliğini ve gerçek performansını değerlendiren temel listelerden biridir?",
      "questionType": "multiple_choice",
      "cognitiveDomain": "remembering",
      "options": [
        "CPU-Z",
        "TOP500",
        "Geekbench",
        "3DMark"
      ],
      "correctAnswer": "TOP500",
      "explanation": "TOP500, HPCG ve Green500 süperbilgisayarların hızını, verimliliğini ve gerçek performansını değerlendiren temel listelerdir. Metinde bu üç listenin adı açıkça belirtilmiştir.",
      "subTopicName": "S Perbilgisayar S Ralama Listeleri",
      "normalizedSubTopicName": "s_perbilgisayar_s_ralama_listeleri",
      "difficulty": "easy"
    },
    {
      "id": "q3",
      "questionText": "TOP500 listesi hangi özelliği temel alarak dünyanın en hızlı 500 süperbilgisayarını sıralar?",
      "questionType": "multiple_choice",
      "cognitiveDomain": "understanding",
      "options": [
        "Enerji verimliliği",
        "Bellek kapasitesi",
        "Hesaplama gücü",
        "Veri depolama alanı"
      ],
      "correctAnswer": "Hesaplama gücü",
      "explanation": "TOP500 listesi, süperbilgisayarları hesaplama gücüne göre sıralar. Metinde TOP500'ün en hızlı süperbilgisayarları hesaplama gücüne göre sıraladığı belirtilmiştir.",
      "subTopicName": "Top500 Tan M Ve Amac",
      "normalizedSubTopicName": "top500_tan_m_ve_amac",
      "difficulty": "easy"
    },
    {
      "id": "q4",
      "questionText": "TOP500 listesi ilk olarak ne zaman yayınlanmıştır ve hangi aralıklarla güncellenmektedir?",
      "questionType": "multiple_choice",
      "cognitiveDomain": "remembering",
      "options": [
        "1990'dan beri yılda bir kez",
        "1993'ten beri yılda iki kez",
        "2000'den beri her çeyrekte",
        "2005'ten beri yılda bir kez"
      ],
      "correctAnswer": "1993'ten beri yılda iki kez",
      "explanation": "TOP500 listesi 1993'ten beri yılda iki kez (Haziran ve Kasım aylarında) yayımlanmaktadır. Metinde bu bilgi açıkça belirtilmiştir.",
      "subTopicName": "Top500 Tan M Ve Amac",
      "normalizedSubTopicName": "top500_tan_m_ve_amac",
      "difficulty": "easy"
    },
    {
      "id": "q5",
      "questionText": "HPCG'nin (High Performance Conjugate Gradient) temel amacı nedir?",
      "questionType": "multiple_choice",
      "cognitiveDomain": "understanding",
      "options": [
        "Enerji tüketimini en aza indirmek",
        "Bellek, iletişim ve veri akış performansını test etmek",
        "Sadece işlemci hızını ölçmek",
        "Grafik işleme yeteneklerini değerlendirmek"
      ],
      "correctAnswer": "Bellek, iletişim ve veri akış performansını test etmek",
      "explanation": "HPCG, bellek, iletişim ve veri akış performansını test etmeyi amaçlar. Metinde HPCG'nin bellek, iletişim ve veri akış performansını test ettiği belirtilmiştir.",
      "subTopicName": "Hpcğitan M Ve Amac",
      "normalizedSubTopicName": "hpcğitan_m_ve_amac",
      "difficulty": "medium"
    },
    {
      "id": "q6",
      "questionText": "HPCG, TOP500 listesinin hangi eksikliğini gidermek için geliştirilmiştir?",
      "questionType": "multiple_choice",
      "cognitiveDomain": "understanding",
      "options": [
        "Enerji verimliliği ölçümü",
        "Gerçek dünya uygulamalarına odaklanmama",
        "Daha fazla süperbilgisayarı sıralayamama",
        "Donanım maliyetini dikkate almama"
      ],
      "correctAnswer": "Gerçek dünya uygulamalarına odaklanmama",
      "explanation": "HPCG, TOP500’ün eksik kaldığı noktaları tamamlamak için alternatif olarak geliştirilmiştir ve gerçek dünya uygulamalarına daha yakındır. Metinde bu durum açıkça ifade edilmiştir.",
      "subTopicName": "Hpcğitan M Ve Amac",
      "normalizedSubTopicName": "hpcğitan_m_ve_amac",
      "difficulty": "medium"
    },
    {
      "id": "q7",
      "questionText": "Green500 listesi süperbilgisayarları hangi kritere göre sıralar?",
      "questionType": "multiple_choice",
      "cognitiveDomain": "remembering",
      "options": [
        "İşlemci çekirdek sayısı",
        "Enerji verimliliği",
        "Bellek miktarı",
        "Depolama kapasitesi"
      ],
      "correctAnswer": "Enerji verimliliği",
      "explanation": "Green500, enerji verimliliğini temel alarak süperbilgisayarları sıralar. Metinde Green500'ün enerji verimliliğine odaklandığı belirtilmiştir.",
      "subTopicName": "Green500 Tan M Ve Amac",
      "normalizedSubTopicName": "green500_tan_m_ve_amac",
      "difficulty": "easy"
    },
    {
      "id": "q8",
      "questionText": "Green500 listesinde sıralama ölçütü olarak kullanılan metrik nedir?",
      "questionType": "multiple_choice",
      "cognitiveDomain": "remembering",
      "options": [
        "FLOPS",
        "Watt başına düşen işlem sayısı (FLOPS/Watt)",
        "CPU kullanım oranı",
        "Bellek bant genişliği"
      ],
      "correctAnswer": "Watt başına düşen işlem sayısı (FLOPS/Watt)",
      "explanation": "Green500 listesinde sıralama ölçütü olarak FLOPS/Watt oranına bakılır. Yani, 1 watt enerji başına ne kadar işlem yapıldığı değerlendirilir. Metinde bu bilgi açıkça belirtilmiştir.",
      "subTopicName": "Green500 Tan M Ve Amac",
      "normalizedSubTopicName": "green500_tan_m_ve_amac",
      "difficulty": "easy"
    },
    {
      "id": "q9",
      "questionText": "LINPACK testi, süperbilgisayarların hangi performansını ölçmek için kullanılır?",
      "questionType": "multiple_choice",
      "cognitiveDomain": "understanding",
      "options": [
        "Enerji tüketimi",
        "Bellek erişim hızı",
        "Floating-point işlemleri (FLOPS)",
        "Veri depolama kapasitesi"
      ],
      "correctAnswer": "Floating-point işlemleri (FLOPS)",
      "explanation": "LINPACK testi, süperbilgisayarın ne kadar hızlı işlem yapabildiğini, yani sistemin floating-point işlemleri (FLOPS) performansını ölçer. Metinde bu bilgi açıkça belirtilmiştir.",
      "subTopicName": "Linpack Testi Ve Flops",
      "normalizedSubTopicName": "linpack_testi_ve_flops",
      "difficulty": "medium"
    },
    {
      "id": "q10",
      "questionText": "LINPACK testinin temelinde hangi matematiksel işlem yatar?",
      "questionType": "multiple_choice",
      "cognitiveDomain": "remembering",
      "options": [
        "İstatistiksel analiz",
        "Matris çözümleme",
        "Veri sıkıştırma",
        "Kriptografik şifreleme"
      ],
      "correctAnswer": "Matris çözümleme",
      "explanation": "LINPACK testi matris çözümlemeye dayalıdır. Metinde bu bilgi açıkça belirtilmiştir.",
      "subTopicName": "Linpack Testi Ve Flops",
      "normalizedSubTopicName": "linpack_testi_ve_flops",
      "difficulty": "easy"
    }
  ]
}
```
```



## İşlenen Sorular Analizi:

- Toplam Soru Sayısı: 10
- Alt Konu Dağılımı:

  - S Perbilgisayar S Ralama Listeleri: 2 soru
  - Top500 Tan M Ve Amac: 2 soru
  - Hpcğitan M Ve Amac: 2 soru
  - Green500 Tan M Ve Amac: 2 soru
  - Linpack Testi Ve Flops: 2 soru


### Soru Örnekleri (Her Alt Konudan 1 Adet):

#### S Perbilgisayar S Ralama Listeleri:
- Soru: Süperbilgisayarların kullanım alanları düşünüldüğünde, aşağıdakilerden hangisi bu sistemlerin yaygın olarak kullanıldığı bir alan değildir?
- Seçenekler: Bilimsel araştırmalar | Yapay zeka | Finansal modelleme | Ev kullanımı
- Doğru Cevap: Ev kullanımı
- Zorluk: easy

#### Top500 Tan M Ve Amac:
- Soru: TOP500 listesi hangi özelliği temel alarak dünyanın en hızlı 500 süperbilgisayarını sıralar?
- Seçenekler: Enerji verimliliği | Bellek kapasitesi | Hesaplama gücü | Veri depolama alanı
- Doğru Cevap: Hesaplama gücü
- Zorluk: easy

#### Hpcğitan M Ve Amac:
- Soru: HPCG'nin (High Performance Conjugate Gradient) temel amacı nedir?
- Seçenekler: Enerji tüketimini en aza indirmek | Bellek, iletişim ve veri akış performansını test etmek | Sadece işlemci hızını ölçmek | Grafik işleme yeteneklerini değerlendirmek
- Doğru Cevap: Bellek, iletişim ve veri akış performansını test etmek
- Zorluk: medium

#### Green500 Tan M Ve Amac:
- Soru: Green500 listesi süperbilgisayarları hangi kritere göre sıralar?
- Seçenekler: İşlemci çekirdek sayısı | Enerji verimliliği | Bellek miktarı | Depolama kapasitesi
- Doğru Cevap: Enerji verimliliği
- Zorluk: easy

#### Linpack Testi Ve Flops:
- Soru: LINPACK testi, süperbilgisayarların hangi performansını ölçmek için kullanılır?
- Seçenekler: Enerji tüketimi | Bellek erişim hızı | Floating-point işlemleri (FLOPS) | Veri depolama kapasitesi
- Doğru Cevap: Floating-point işlemleri (FLOPS)
- Zorluk: medium

