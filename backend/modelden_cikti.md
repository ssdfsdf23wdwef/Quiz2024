# AI Model Yanıtı

Tarih: 2025-05-31T14:37:14.528Z
Trace ID: quiz-1748702219587-oxju5
Yanıt Uzunluğu: 9214 karakter

## Ham Çıktı:
```json
```json
{
  "questions": [
    {
      "id": "q1",
      "questionText": "Aşağıdakilerden hangisi eksaskala sistemlerde verimliliği artırmak için kullanılan temel yaklaşımlardan biridir?",
      "questionType": "multiple_choice",
      "cognitiveDomain": "understanding",
      "options": [
        "Tek çekirdekli işlemci kullanımı",
        "Paralellikten yararlanma",
        "Bellek erişimini en aza indirme",
        "Seri programlama"
      ],
      "correctAnswer": "Paralellikten yararlanma",
      "explanation": "Eksaskala sistemlerde verimliliği artırmak için paralellik gücünden yararlanılır. İşlemler küçük parçalara bölünerek aynı anda birden fazla işlemcide yürütülür. Diğer seçenekler ise bu sistemlerin verimliliğini azaltır.",
      "subTopicName": "Paralel Programlama Paradigmaları",
      "normalizedSubTopicName": "paralel_programlama_paradigmaları",
      "difficulty": "medium"
    },
    {
      "id": "q2",
      "questionText": "Paralel programlama paradigması nedir?",
      "questionType": "multiple_choice",
      "cognitiveDomain": "understanding",
      "options": [
        "Bir işlemin tek bir işlemcide sıralı olarak yürütülmesini sağlayan yazılımlardır.",
        "Bir işlemin küçük parçalara bölünerek aynı anda birden fazla işlemcide yürütülmesini sağlayan yazılımlardır.",
        "Sadece tek çekirdekli işlemcilerde çalışan yazılımlardır.",
        "Sadece grafik işlem birimlerinde (GPU) çalışan yazılımlardır."
      ],
      "correctAnswer": "Bir işlemin küçük parçalara bölünerek aynı anda birden fazla işlemcide yürütülmesini sağlayan yazılımlardır.",
      "explanation": "Paralel programlama paradigması, bir işlemin küçük parçalara bölünerek aynı anda birden fazla işlemcide yürütülmesini sağlayan yazılımlardır. Bu, büyük ölçekli hesaplamalarda performansı maksimize etmek için kritik bir bileşendir.",
      "subTopicName": "Paralel Programlama Paradigmaları",
      "normalizedSubTopicName": "paralel_programlama_paradigmaları",
      "difficulty": "easy"
    },
    {
      "id": "q3",
      "questionText": "Paylaşımlı bellek paradigması için aşağıdakilerden hangisi doğrudur?",
      "questionType": "multiple_choice",
      "cognitiveDomain": "understanding",
      "options": [
        "Her işlemci kendi özel belleğine sahiptir.",
        "Tüm işlemciler ortak bir belleğe erişir.",
        "Veri iletişimi mesajlaşma yoluyla sağlanır.",
        "Sadece dağıtık sistemlerde kullanılır."
      ],
      "correctAnswer": "Tüm işlemciler ortak bir belleğe erişir.",
      "explanation": "Paylaşımlı bellek paradigmasında tüm işlemciler ortak belleğe erişir, bu da onu çok çekirdekli işlemciler için ideal kılar. OpenMP bu paradigmayı destekleyen bir API'dir.",
      "subTopicName": "Paylaşımlı Bellek Paradigması",
      "normalizedSubTopicName": "paylasimli_bellek_paradigmasi",
      "difficulty": "easy"
    },
    {
      "id": "q4",
      "questionText": "OpenMP'nin paylaşımlı bellek paradigmasındaki rolü nedir?",
      "questionType": "multiple_choice",
      "cognitiveDomain": "understanding",
      "options": [
        "Dağıtık bellekli sistemlerde veri transferini yönetmek.",
        "Mevcut koda direktifler ekleyerek uygulama geliştirmeyi kolaylaştırmak.",
        "İşlemciler arasında mesajlaşmayı sağlamak.",
        "Sadece tek çekirdekli uygulamaları optimize etmek."
      ],
      "correctAnswer": "Mevcut koda direktifler ekleyerek uygulama geliştirmeyi kolaylaştırmak.",
      "explanation": "OpenMP, mevcut koda direktifler ekleyerek paylaşımlı bellek mimarilerinde paralel uygulamalar geliştirmeyi kolaylaştırır. Örneğin, #pragma omp parallel direktifi paralel bir bölge başlatır.",
      "subTopicName": "Paylaşımlı Bellek Paradigması",
      "normalizedSubTopicName": "paylasimli_bellek_paradigmasi",
      "difficulty": "medium"
    },
    {
      "id": "q5",
      "questionText": "Dağıtık bellek paradigmasında veri değişimi nasıl sağlanır?",
      "questionType": "multiple_choice",
      "cognitiveDomain": "understanding",
      "options": [
        "Ortak bir bellek alanı üzerinden",
        "Mesajlaşma ile",
        "Paylaşımlı değişkenler aracılığıyla",
        "Sanal bellek yönetimi ile"
      ],
      "correctAnswer": "Mesajlaşma ile",
      "explanation": "Dağıtık bellek paradigmasında her işlemci kendi düğümünün belleğine erişir ve veri değişimi mesajlaşma ile sağlanır. MPI bu paradigmanın yaygın bir örneğidir.",
      "subTopicName": "Dağıtık Bellek Paradigması",
      "normalizedSubTopicName": "dagitik_bellek_paradigmasi",
      "difficulty": "easy"
    },
    {
      "id": "q6",
      "questionText": "MPI'ın (Message Passing Interface) temel amacı nedir?",
      "questionType": "multiple_choice",
      "cognitiveDomain": "understanding",
      "options": [
        "Paylaşımlı bellek mimarilerinde paralellik sağlamak",
        "Dağıtık bellekli ortamlarda paralel uygulamalar geliştirmek",
        "Tek çekirdekli işlemcilerde performansı artırmak",
        "Grafik işlem birimlerinde (GPU) hesaplama yapmak"
      ],
      "correctAnswer": "Dağıtık bellekli ortamlarda paralel uygulamalar geliştirmek",
      "explanation": "MPI (Message Passing Interface), dağıtık bellekli ortamlarda paralel uygulamalar geliştirmek için kullanılır. İşlemler arasında veri alışverişi ve paralel görev koordinasyonu sağlar.",
      "subTopicName": "Dağıtık Bellek Paradigması",
      "normalizedSubTopicName": "dagitik_bellek_paradigmasi",
      "difficulty": "medium"
    },
    {
      "id": "q7",
      "questionText": "Hibrit paralel programlama yaklaşımının temel özelliği nedir?",
      "questionType": "multiple_choice",
      "cognitiveDomain": "understanding",
      "options": [
        "Sadece paylaşımlı bellek paradigmasını kullanması",
        "Sadece dağıtık bellek paradigmasını kullanması",
        "Farklı paralel programlama paradigmalarının gücünden yararlanmak için birden fazla paradigmayı birleştirmesi",
        "Sadece tek çekirdekli işlemcilerde çalışması"
      ],
      "correctAnswer": "Farklı paralel programlama paradigmalarının gücünden yararlanmak için birden fazla paradigmayı birleştirmesi",
      "explanation": "Hibrit paralellik, farklı paralel programlama paradigmalarının gücünden yararlanmak için birden fazla paradigmayı birleştirir. Eksaskala bilişimde MPI ve OpenMP kombinasyonu yaygın bir örnektir.",
      "subTopicName": "Hibrit Paralel Programlama",
      "normalizedSubTopicName": "hibrit_paralel_programlama",
      "difficulty": "easy"
    },
    {
      "id": "q8",
      "questionText": "MPI ve OpenMP'nin hibrit kullanımında, her bir teknolojinin rolü nedir?",
      "questionType": "multiple_choice",
      "cognitiveDomain": "understanding",
      "options": [
        "MPI: Düğüm içindeki paralellik, OpenMP: İşlemler arası iletişim",
        "MPI: İşlemler arası iletişim, OpenMP: Düğüm içindeki paralellik",
        "Her ikisi de sadece düğüm içindeki paralelliği sağlar",
        "Her ikisi de sadece işlemler arası iletişimi sağlar"
      ],
      "correctAnswer": "MPI: İşlemler arası iletişim, OpenMP: Düğüm içindeki paralellik",
      "explanation": "MPI + OpenMP kombinasyonunda MPI işlemciler arası iletişim sağlarken (dış paralelleştirme), OpenMP çok çekirdekli işlemciler içinde iş parçacıklarını yönetir (iç paralelleştirme).",
      "subTopicName": "Hibrit Paralel Programlama",
      "normalizedSubTopicName": "hibrit_paralel_programlama",
      "difficulty": "medium"
    },
    {
      "id": "q9",
      "questionText": "Döngü açma (Loop Unrolling) tekniğinin temel amacı nedir?",
      "questionType": "multiple_choice",
      "cognitiveDomain": "understanding",
      "options": [
        "Döngü kontrol yapılarının yükünü azaltmak",
        "Döngüleri birleştirerek bellek erişimini artırmak",
        "Döngüleri vektörleştirerek SIMD paralelliği sağlamak",
        "Döngüleri tamamen ortadan kaldırmak"
      ],
      "correctAnswer": "Döngü kontrol yapılarının yükünü azaltmak",
      "explanation": "Döngü açma (Loop Unrolling), döngü kontrol yapılarının yükünü azaltmayı amaçlayan bir derleyici optimizasyon tekniğidir. Birden fazla iterasyon tek bir döngüde açılır.",
      "subTopicName": "Döngü Açma Loop Unrolling",
      "normalizedSubTopicName": "dongu_acma_loop_unrolling",
      "difficulty": "easy"
    },
    {
      "id": "q10",
      "questionText": "Döngü açma (Loop Unrolling) uygularken döngü sınırlarına dikkat etmenin nedeni nedir?",
      "questionType": "multiple_choice",
      "cognitiveDomain": "analyzing",
      "options": [
        "Sonsuz döngü oluşmasını engellemek",
        "Döngü değişkeninin yanlış değerler almasını önlemek",
        "Sınır dışı bellek erişimini engellemek",
        "Döngünün daha yavaş çalışmasını önlemek"
      ],
      "correctAnswer": "Sınır dışı bellek erişimini engellemek",
      "explanation": "Döngü açmada dikkat edilmesi gereken en temel faktör döngü sınırlarıdır. Özellikle döngüdeki eleman sayısı döngü açma işlemine uygun değilse (örneğin tek sayı ise), sınır dışı bellek erişimi gibi sorunlar ortaya çıkabilir.",
      "subTopicName": "Döngü Açma Loop Unrolling",
      "normalizedSubTopicName": "dongu_acma_loop_unrolling",
      "difficulty": "medium"
    }
  ]
}
```
```
