# AI Model Yanıtı

Tarih: 2025-05-31T22:04:11.630Z
Trace ID: quiz-1748729035256-qj772
Yanıt Uzunluğu: 10529 karakter

## Ham Çıktı:
```json
```json
{
  "questions": [
    {
      "id": "q1",
      "questionText": "Aşağıdakilerden hangisi, eksaskala sistemlerde verimliliği artırmak amacıyla kullanılan temel bir yaklaşımdır?",
      "questionType": "multiple_choice",
      "cognitiveDomain": "understanding",
      "options": [
        "Tek çekirdekli işlemci kullanımı",
        "Paralellikten yararlanma",
        "Bellek erişimini kısıtlama",
        "Seri programlama"
      ],
      "correctAnswer": "Paralellikten yararlanma",
      "explanation": "Eksaskala sistemlerde verimliliği artırmak için paralellik gücünden yararlanılır. İşlemler küçük parçalara bölünerek aynı anda birden fazla işlemcide yürütülür. Diğer seçenekler (tek çekirdekli işlemci, bellek erişimini kısıtlama, seri programlama) paralelliğin zıttı veya verimliliği düşüren yaklaşımlardır.",
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
        "İşlemlerin sıralı bir şekilde yürütülmesini sağlayan yazılımlardır.",
        "Bir işlemin küçük parçalara bölünerek aynı anda birden fazla işlemcide yürütülmesini sağlayan yazılımlardır.",
        "Sadece tek bir işlemci üzerinde çalışan yazılımlardır.",
        "Bellek kullanımını en aza indiren yazılımlardır."
      ],
      "correctAnswer": "Bir işlemin küçük parçalara bölünerek aynı anda birden fazla işlemcide yürütülmesini sağlayan yazılımlardır.",
      "explanation": "Paralel programlama paradigması, büyük ölçekli hesaplamalarda performansı maksimize etmek için kritik bir bileşendir. İşlemlerin sıralı yürütülmesi, tek işlemci kullanımı veya bellek optimizasyonu paralel programlamanın temel amacı değildir.",
      "subTopicName": "Paralel Programlama Paradigmaları",
      "normalizedSubTopicName": "paralel_programlama_paradigmaları",
      "difficulty": "easy"
    },
    {
      "id": "q3",
      "questionText": "Aşağıdakilerden hangisi, paylaşımlı bellek paradigmasının temel özelliğidir?",
      "questionType": "multiple_choice",
      "cognitiveDomain": "understanding",
      "options": [
        "Her işlemcinin kendi özel belleği olması",
        "Tüm işlemcilerin ortak bir belleğe erişmesi",
        "Veri iletişiminin mesajlaşma ile sağlanması",
        "Sadece tek çekirdekli işlemcilerde çalışabilmesi"
      ],
      "correctAnswer": "Tüm işlemcilerin ortak bir belleğe erişmesi",
      "explanation": "Paylaşımlı bellek paradigmasında tüm işlemciler ortak belleğe erişir, bu da çok çekirdekli işlemciler için idealdir. Diğer seçenekler (özel bellek, mesajlaşma, tek çekirdekli çalışma) paylaşımlı bellek paradigmasının özelliklerini yansıtmaz.",
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
        "Dağıtık bellekli sistemlerde veri iletişimini sağlamak",
        "Mevcut koda direktifler ekleyerek uygulama geliştirmeyi kolaylaştırmak",
        "Tek çekirdekli işlemcilerde performansı artırmak",
        "Bellek erişimini kısıtlayarak güvenliği sağlamak"
      ],
      "correctAnswer": "Mevcut koda direktifler ekleyerek uygulama geliştirmeyi kolaylaştırmak",
      "explanation": "OpenMP, paylaşımlı bellek mimarilerinde paralel uygulamalar geliştirmek için kullanılır ve mevcut koda direktifler ekleyerek uygulama geliştirmeyi kolaylaştırır. Diğer seçenekler (dağıtık bellek, tek çekirdekli işlemci, bellek erişimini kısıtlama) OpenMP'nin rolünü doğru bir şekilde tanımlamaz.",
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
        "Ortak bir belleğe erişerek",
        "Mesajlaşma ile",
        "Paylaşımlı değişkenler kullanarak",
        "Donanım yoluyla"
      ],
      "correctAnswer": "Mesajlaşma ile",
      "explanation": "Dağıtık bellek paradigmasında her işlemci kendi düğümünün belleğine erişir ve veri değişimi mesajlaşma ile sağlanır. Ortak bellek, paylaşımlı değişkenler veya donanım yoluyla veri değişimi dağıtık bellek paradigmasının temel özelliği değildir.",
      "subTopicName": "Dağıtık Bellek Paradigması",
      "normalizedSubTopicName": "dagitik_bellek_paradigmasi",
      "difficulty": "easy"
    },
    {
      "id": "q6",
      "questionText": "MPI (Message Passing Interface) ne için kullanılır?",
      "questionType": "multiple_choice",
      "cognitiveDomain": "understanding",
      "options": [
        "Paylaşımlı bellekli ortamlarda paralel uygulamalar geliştirmek için",
        "Dağıtık bellekli ortamlarda paralel uygulamalar geliştirmek için",
        "Tek çekirdekli işlemcilerde performansı artırmak için",
        "Grafik işlem birimlerinde (GPU) hesaplama yapmak için"
      ],
      "correctAnswer": "Dağıtık bellekli ortamlarda paralel uygulamalar geliştirmek için",
      "explanation": "MPI, dağıtık bellekli ortamlarda paralel uygulamalar geliştirmek için kullanılır. İşlemler arasında doğrudan veri alışverişi sağlayan point-to-point iletişim mekanizmaları sunar. Diğer seçenekler (paylaşımlı bellek, tek çekirdekli işlemci, GPU hesaplama) MPI'ın kullanım alanlarını doğru bir şekilde tanımlamaz.",
      "subTopicName": "Dağıtık Bellek Paradigması",
      "normalizedSubTopicName": "dagitik_bellek_paradigmasi",
      "difficulty": "medium"
    },
    {
      "id": "q7",
      "questionText": "Hibrit paralellik yaklaşımı neyi ifade eder?",
      "questionType": "multiple_choice",
      "cognitiveDomain": "understanding",
      "options": [
        "Sadece paylaşımlı bellek paradigmasını kullanmayı",
        "Sadece dağıtık bellek paradigmasını kullanmayı",
        "Farklı paralel programlama paradigmalarının gücünden yararlanmak için birden fazla paradigmayı birleştirmeyi",
        "Sadece tek bir işlemci üzerinde çalışmayı"
      ],
      "correctAnswer": "Farklı paralel programlama paradigmalarının gücünden yararlanmak için birden fazla paradigmayı birleştirmeyi",
      "explanation": "Hibrit paralellik, farklı paralel programlama paradigmalarının gücünden yararlanmak için birden fazla paradigmayı birleştirir. Eksaskala bilişimde MPI ve OpenMP paralellik modellerinin kombinasyonu yaygın bir hibrit yaklaşımdır. Diğer seçenekler (sadece paylaşımlı bellek, sadece dağıtık bellek, tek işlemci) hibrit paralelliğin tanımını doğru bir şekilde yansıtmaz.",
      "subTopicName": "Hibrit Paralel Programlama",
      "normalizedSubTopicName": "hibrit_paralel_programlama",
      "difficulty": "easy"
    },
    {
      "id": "q8",
      "questionText": "MPI ve OpenMP kombinasyonunda, MPI ve OpenMP'nin rolleri nelerdir?",
      "questionType": "multiple_choice",
      "cognitiveDomain": "understanding",
      "options": [
        "MPI: Çok çekirdekli işlemciler içinde iş parçacıklarını yönetir; OpenMP: İşlemciler arası iletişim sağlar.",
        "MPI: İşlemciler arası iletişim sağlar; OpenMP: Çok çekirdekli işlemciler içinde iş parçacıklarını yönetir.",
        "Her ikisi de sadece işlemciler arası iletişim sağlar.",
        "Her ikisi de sadece çok çekirdekli işlemciler içinde iş parçacıklarını yönetir."
      ],
      "correctAnswer": "MPI: İşlemciler arası iletişim sağlar; OpenMP: Çok çekirdekli işlemciler içinde iş parçacıklarını yönetir.",
      "explanation": "MPI, işlemciler arası iletişim sağlarken (dış paralelleştirme), OpenMP çok çekirdekli işlemciler içinde iş parçacıklarını yönetir (iç paralelleştirme). Bu kombinasyon daha fazla işlem gücü ve daha hızlı veri işleme sağlar. Diğer seçenekler MPI ve OpenMP'nin rollerini yanlış bir şekilde tanımlar.",
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
        "Döngüleri karmaşıklaştırarak hata ayıklamayı zorlaştırmak",
        "Sadece tek çekirdekli işlemcilerde performansı artırmak"
      ],
      "correctAnswer": "Döngü kontrol yapılarının yükünü azaltmak",
      "explanation": "Döngü açma (Loop Unrolling), döngü kontrol yapılarının yükünü azaltmayı amaçlayan bir derleyici optimizasyon tekniğidir. Birden fazla iterasyon tek bir döngüde açılır ve bu da işlemcinin birden fazla talimatı aynı anda çalıştırmasını mümkün kılar. Diğer seçenekler (bellek erişimini artırmak, hata ayıklamayı zorlaştırmak, tek çekirdekli işlemci) döngü açmanın amacını doğru bir şekilde tanımlamaz.",
      "subTopicName": "Döngü Açma Loop Unrolling",
      "normalizedSubTopicName": "dongu_acma_loop_unrolling",
      "difficulty": "easy"
    },
    {
      "id": "q10",
      "questionText": "Döngü açma (Loop Unrolling) ile ilgili olarak, döngü sınırlarına dikkat etmenin nedeni nedir?",
      "questionType": "multiple_choice",
      "cognitiveDomain": "understanding",
      "options": [
        "Döngü açma işleminin daha hızlı tamamlanmasını sağlamak",
        "Sınır dışı bellek erişimini önlemek",
        "Döngülerin daha az bellek kullanmasını sağlamak",
        "Döngülerin daha kolay birleştirilmesini sağlamak"
      ],
      "correctAnswer": "Sınır dışı bellek erişimini önlemek",
      "explanation": "Döngü açmada dikkat edilmesi gereken en temel faktör döngü sınırlarıdır. Özellikle döngü açma işleminden sonra döngü sınırlarının aşılması, sınır dışı bellek erişimine yol açabilir. Diğer seçenekler (daha hızlı tamamlanma, daha az bellek, kolay birleştirme) döngü sınırlarına dikkat etmenin temel nedenini doğru bir şekilde tanımlamaz.",
      "subTopicName": "Döngü Açma Loop Unrolling",
      "normalizedSubTopicName": "dongu_acma_loop_unrolling",
      "difficulty": "medium"
    }
  ]
}
```
```
