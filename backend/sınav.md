# Sınav Oluşturma Promptu

## Tarih: 2025-05-24T19:16:25.245Z

## Trace ID: quiz-1748114185241-tk351

## Alt Konular (1 adet):
```
## AKTİF KONULAR (SORU ÜRETİLECEK)

**Aşağıdaki alt konular için belirtilen sayıda soru üretilecektir:**

1. **Yaz L M Testinin Nemi** (10 soru)

**Toplam Aktif: 1 alt konu, 10 soru**

## BEKLEYEN KONULAR (SORU ÜRETİLMEYECEK)

Bekleyen konu yok.

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

1. **Yaz L M Testinin Nemi** (10 soru)

**Toplam Aktif: 1 alt konu, 10 soru**

## BEKLEYEN KONULAR (SORU ÜRETİLMEYECEK)

Bekleyen konu yok.

  *Lütfen dikkat: Bu bölümde "AKTİF KONULAR (SORU ÜRETİLECEK)" ve "BEKLEYEN KONULAR (SORU ÜRETİLMEYECEK)" olmak üzere iki liste görebilirsin.*
- **Eğitim İçeriği:** 

Yazılım Testine Giriş
YazılımDoğrulamaveGeçerleme
1

Yazılımheryerde
2

Test nedengerekli?
4

YazılımTestiNedenÖnemlidir?
•China Airlines Airbus A300
5
26 Nisan 1994'te biryazılımhatasınedeniyledüştüve264 masuminsanöldü

YazılımTestiNedenÖnemlidir?
•Kanada'nınTherac-25 radyasyontedavisimakinesi
6
1985 yılındayazılımhatasınedeniylearızalandıvehastalaraölümcülradyasyondozları
verdi, 3 kişiöldüve3 kişide ağıryaralandı.

YazılımTestiNedenÖnemlidir?
•1,2 milyardolarlıkaskeriuydufırlatma(Titan IV-B)
7
Nisan 1999'da biryazılımhatasınedeniylebaşarısızoldu. Tarihinenpahalıkazası

YazılımTestiNedenÖnemlidir?
•ABD Banka Hesapları
8
Bir yazılımhatası, 823 müşterinin920 milyondolarkredilendirilmesinenedenoldu

EkonomikEtki
•CISQ Bilgi veYazılımKalitesiKonsorsiyumutarafındanhazırlananABD
2020 RaporundaDüşükYazılımKalitesininMaliyeti:
•ABD'dekiDüşükYazılımKalitesinin(CPSQ) toplammaliyeti2.08 trilyonABD
dolarıdır.
•Operasyonelarızalar1.56 trilyon
•Eskisistemler520 milyar
•Yazılımsistemleriningüvenilirolmasınıistiyoruz
•Test, çoğudurumda, olupolmadıklarınıöğrenmeyolumuzdur.
9

YazılımTestiNedenÖnemlidir?
•Tarihbutürörneklerledoludur.
•Test etmekönemlidirçünküyazılımhatalarıpahalıvehatta
tehlikeliolabilir.
•Yazılımhatalarıpotansiyelolarakpara veinsankaybınaneden
olabilir.
14

Programlarnedenbaşarısızoluyor?
Tebrikler!
•Kodunuztamamlandı. Derleniyor. Çalışıyor...
•Ama Programınızçalışmasırasındaarızaverdi. Bu nasılolabilir?
•Koddabirkusurvar. Kodyürütüldüğünde, kusurdahasonrabirhataolarakgörünürhale gelen
kötüdavranışanedenolur.
•Bir programdahataayıklanmadanönce, onutest edilebilecekşekildeayarlamalıyız-yani, arıza
vermesiamacıylayürütülür.
•Hataayıklamanınilk adımı, sözkonususorunuyenidenoluşturmaktır—yani, programınbelirtilen
şekildearızavermesinenedenolanbirtest durumuoluşturmaktır.
•İlk neden, gözlemlenebilecekşekildekontrolaltınaalmaktır.
•İkincineden, düzeltmeninbaşarısınıdoğrulamaktır.
15

NedenTest Ediyoruz?
•Te s t pahalıdır.
•Başarısızlıklarda öyle!
•Bu maliyettenne kazanıyoruz?
•Hatalarıbulma
•Veardından:
•Hatalarıdüzeltme
•Test ettiğimizprogramınveyasisteminkalitesiniyükseltmek
16

MaliyetveBaşarısızlıklarınÖdünleşimleri
(trade-off)
ToplamKaliteMaliyeti(CoQ) =
UygunlukMaliyeti(CoC) +
UygunsuzlukMaliyeti(CoNC)
UygunlukMaliyeti
•Önleme: kaliteplanlaması, araçlarayatırım, kaliteeğitimi
•Değerlendirme: test etme, inspection
UygunsuzlukMaliyeti
•İçarızalar: düzeltme(rework)
•Dışarızalar: sorumluluk, mal kaybı, can kaybı
17

MaliyetveBaşarısızlıklarınÖdünleşimleri
(trade-off)
•Test, UygunlukMaliyetinekatkıdabulunur
•UygunsuzlukMaliyetinidoğrudanazaltmalıdır
18

Yazılımsistemleribağlamı
•Yazılımsistemlerihayatınönemli
birparçasıdır:
19
•Çoğukişi, beklendiğigibi
çalışmayanyazılımlarlailgili
deneyimesahiptir.
•Yazılımsistemidoğruşekilde
çalışmazsa, aşağıdakigibi
sorunlarayolaçabilir:
•Para kaybı
•Ticariitibarkaybı
•Yaralanmaveyaölüm

Yazılımhatalarınınnedenleri
•İnsanHatası
•Kontroledilemeyenolaylar
20

Yazılımhatalarınınnedenleri
•Her ikihatanedenide koddakusurlar(hatalar) üretir.
•Kusurlar, yürütülürse, yazılımsistemininarızalanmasınanedenolabilir
(sistemyapmasıgerekeniyapamaz).
•Arızalar, yazılımsistemininkullanıcılarınıciddişekildeetkileyebilir,
örneğin:
•Frenpedalıçalışmıyor
•Finansalyazılımsistemlerindeyanlışhesaplamalar
21

Dörttipiksenaryo
22

Onarımmaliyeti
23

Testinrolü
•Test, biryazılımürünününyaşamdöngüsününtümaşamalarında
önemlibirrole sahiptir:
•Planlama
•Geliştirme
•Bakım
•Işletim
24

Testinrolü
•Çalışmasırasındaortayaçıkansorunriskiniazaltmakiçin
•Yazılımsistemininaşağıdakilerikarşılayıpkarşılamadığınıkontrol
etmekiçin:
•Yasalyükümlülükler
•Sektöreözelstandartlar
•Yazılımsistemihakkındadahafazlabilgiedinmekiçin
25

Test etme...
•İşlevselyönler
•İşlevselolmayanyönler(Güvenilirlik,
Kullanılabilirlik, Taşınabilirlik)
Bulunankusurlaraçısından
SW kalitesiniölçer
•Düzgünbirşekildetest edilmişseveminimum
kusurbulunursa
SW kalitesinegüvenyaratır
•Kusurlarıntemelnedenlerinianlayaraksüreçler
iyileştirilebilir. Bu, kusurlarıntekrarlanmasını
önleyebilir.
Gelecektekiprojelerde
uygulamamıziçinbize
dersleröğretir
26

Test nedir?
27

YazılımTestiNedir?
•Geliştirilenyazılımındoğruluğunu, eksiksizliğinivekalitesini
belirlemekiçinkullanılansistematikbirsüreçtir. Ürünson kullanıcılara
sunulmadanöncedüzeltilebilmesiiçinbiryazılımdakihatalarıbulmak
amacıylayürütülenbirdizi faaliyetiiçerir
•Basit birdeyişle: Yazılımtesti, yazılımsistemininhatasızolmasını
amaçlayanbirfaaliyettir.
•Manuelolarakveyaotomatikaraçlarkullanılarakyapılabilir.
28

Testintanımı
•Tümyazılımyaşamdöngüsüfaaliyetlerinitest etmesüreci:
•Hem statikhem de dinamik,
•ilgi:
•Planlama, HazırlıkveDeğerlendirme
•nesne:
•Yazılımürünleriveilgiliişürünleri
•hedef:
•belirtilengereksinimlerikarşıladıklarınıbelirlemek
•Amacauygunolduklarınıgöstermek
•kusurlarıtespitetmek
29

Testintanımı
•Test sürecininamaçlarınabağlıolarak, test şunlaraodaklanabilir:
•Yazılımsisteminingereksinimlerikarşıladığınınonayı
•Mümkünolduğuncaazsayıdaarızayamahal vermek
•Değişikliklersırasındahe...(Kısaltıldı)
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

