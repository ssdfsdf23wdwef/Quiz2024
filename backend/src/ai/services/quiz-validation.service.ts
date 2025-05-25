import { Injectable, BadRequestException } from '@nestjs/common';
import {
  QuizQuestion,
  QuizMetadata,
  SubTopicType,
} from '../interfaces/quiz-question.interface';
import { LoggerService } from '../../common/services/logger.service';
import { NormalizationService } from '../../shared/normalization/normalization.service';
import {
  QuizGenerationResponseSchema,
  QuizQuestionSchema,
  QuizResponseSchema,
} from '../schemas/quiz-question.schema';
import { FlowTrackerService } from '../../common/services/flow-tracker.service';
import { ConfigService } from '@nestjs/config';

// QuizMetadata tipinin güncellenmesi
// Bu satırı ekleyelim, eğer dosyanın başka bir yerinde tanımlanmışsa burayı silin
// QuizMetadata arayüzünü genişletelim
declare module '../interfaces' {
  interface QuizMetadata {
    courseName?: string;
    userId?: string;
    subTopicsCount?: number;
    // Diğer mevcut alanlar
    traceId: string;
  }
}

/**
 * Quiz yanıtlarını doğrulama servisi
 */
@Injectable()
export class QuizValidationService {
  private readonly logger: LoggerService;
  private readonly flowTracker: FlowTrackerService;

  constructor(
    private readonly normalizationService: NormalizationService,
    private readonly configService: ConfigService,
  ) {
    this.logger = LoggerService.getInstance();
    this.flowTracker = FlowTrackerService.getInstance();
  }

  /**
   * AI yanıtını JSON'a dönüştürür
   * @param text AI yanıt metni
   * @param metadata Loglama için metadata
   */
  parseAIResponseToJSON<T>(
    text: string | undefined | null,
    metadata: QuizMetadata,
  ): T {
    const { traceId } = metadata;

    // DETAYLI LOGLAMA: Start of parsing
    this.logger.debug(
      `[${traceId}] AI yanıtı parse işlemi başlatılıyor`,
      'QuizValidationService.parseAIResponseToJSON',
    );

    // Null veya undefined kontrolü
    if (!text || text.trim().length === 0) {
      this.logger.warn(
        `[${traceId}] Boş veya geçersiz AI yanıtı. Fallback veri kullanılacak.`,
        'QuizValidationService.parseAIResponseToJSON',
      );
      return this.createFallbackData<T>('', metadata);
    }

    // DETAYLI LOGLAMA: Yanıt içeriği
    this.logger.debug(
      `[${traceId}] AI yanıtı uzunluğu: ${text.length} karakter`,
      'QuizValidationService.parseAIResponseToJSON',
    );

    // Markdown kod bloklarını temizle ve dışarıdaki JSON yapısını almaya çalış
    let processedText = text.trim();

    // Markdown kod bloğu varsa, içindeki JSON'u çıkar
    if (text.includes('```json') && text.includes('```')) {
      this.logger.debug(
        `[${traceId}] Markdown kod bloğu tespit edildi, içerik çıkarılıyor`,
        'QuizValidationService.parseAIResponseToJSON',
      );
      const jsonStartIdx = text.indexOf('```json') + '```json'.length;
      const jsonEndIdx = text.lastIndexOf('```');

      if (jsonStartIdx < jsonEndIdx) {
        processedText = text.substring(jsonStartIdx, jsonEndIdx).trim();
        this.logger.debug(
          `[${traceId}] Markdown kod bloğundan JSON çıkarıldı. Uzunluk: ${processedText.length}`,
          'QuizValidationService.parseAIResponseToJSON',
        );
      }
    }

    this.logger.debug(
      `[${traceId}] AI yanıtı parse ediliyor (${text.length} karakter)`,
      'QuizValidationService.parseAIResponseToJSON',
      __filename,
      undefined,
      { responseLength: text.length },
    );

    // Doğrudan JSON olarak parse etmeyi dene (markdown bloğu temizlenmiş metin üzerinde)
    try {
      console.log(`[QUIZ_DEBUG] [${traceId}] Direk JSON parse etme deneniyor`);
      const parsedJson = JSON.parse(processedText);
      console.log(
        `[QUIZ_DEBUG] [${traceId}] Direk JSON parse başarılı! Üst düzey anahtarlar:`,
        Object.keys(parsedJson),
      );

      if (parsedJson.questions && Array.isArray(parsedJson.questions)) {
        console.log(
          `[QUIZ_DEBUG] [${traceId}] Tam yapıda JSON bulundu. ${parsedJson.questions.length} soru içeriyor`,
        );
      }

      return parsedJson as T;
    } catch (error) {
      console.log(
        `[QUIZ_DEBUG] [${traceId}] Direk JSON parse başarısız: ${error.message}. Alternatif yöntemler deneniyor.`,
      );
    }

    // Metin içinden JSON bölümünü çıkar
    console.log(`[QUIZ_DEBUG] [${traceId}] Metin içinden JSON çıkartılıyor...`);
    const jsonContent = this.extractJsonFromAIResponse(processedText);

    if (!jsonContent) {
      console.log(
        `[QUIZ_DEBUG] [${traceId}] KRİTİK HATA: Yanıttan JSON içeriği çıkarılamadı!`,
      );
      this.logger.warn(
        `[${traceId}] AI yanıtından JSON içeriği çıkarılamadı. Ham yanıtın ilk 100 karakteri: "${text.substring(0, 100)}..."`,
        'QuizValidationService.parseAIResponseToJSON',
      );
      return this.createFallbackData<T>(text, metadata);
    }

    // DETAYLI LOGLAMA: Çıkarılan JSON içeriği
    console.log(
      `[QUIZ_DEBUG] [${traceId}] Çıkarılan JSON içeriği (ilk 500 karakter):`,
    );
    console.log(
      jsonContent.substring(0, 500) + (jsonContent.length > 500 ? '...' : ''),
    );

    // JSON içeriğini temizle
    const cleanedJson = this.cleanJsonContent(jsonContent);
    console.log(
      `[QUIZ_DEBUG] [${traceId}] Temizlenmiş JSON uzunluğu: ${cleanedJson.length} karakter`,
    );

    try {
      // İlk olarak düzgün bir JSON parse etmeyi dene
      console.log(`[QUIZ_DEBUG] [${traceId}] JSON parse ediliyor...`);
      const parsedJson = JSON.parse(cleanedJson);

      // DETAYLI LOGLAMA: Parse edilen veri yapısını incele
      console.log(
        `[QUIZ_DEBUG] [${traceId}] JSON parse başarılı! Üst düzey anahtarlar:`,
        Object.keys(parsedJson),
      );

      if (parsedJson.questions && Array.isArray(parsedJson.questions)) {
        console.log(
          `[QUIZ_DEBUG] [${traceId}] 'questions' alanı bulundu, ${parsedJson.questions.length} adet soru içeriyor.`,
        );
        console.log(
          `[QUIZ_DEBUG] [${traceId}] İlk soru örneği:`,
          parsedJson.questions.length > 0
            ? JSON.stringify(parsedJson.questions[0], null, 2)
            : 'Soru yok',
        );
      } else {
        console.log(
          `[QUIZ_DEBUG] [${traceId}] 'questions' alanı bulunamadı veya dizi değil!`,
        );
        console.log(
          `[QUIZ_DEBUG] [${traceId}] Üst düzey anahtarlar:`,
          Object.keys(parsedJson),
        );
      }

      // Başarılı parse durumunu logla
      this.logger.info(
        `[${traceId}] JSON başarıyla parse edildi.`,
        'QuizValidationService.parseAIResponseToJSON',
      );

      // Temel geçerlilik kontrolü
      if (
        !parsedJson ||
        (typeof parsedJson === 'object' && Object.keys(parsedJson).length === 0)
      ) {
        console.log(
          `[QUIZ_DEBUG] [${traceId}] UYARI: JSON parse edildi ancak boş nesne!`,
        );
        this.logger.warn(
          `[${traceId}] JSON parse edildi ancak boş nesne!`,
          'QuizValidationService.parseAIResponseToJSON',
        );
        return this.createFallbackData<T>(text, metadata);
      }

      // Ana veri yapısı kontrolü - eğer bir sorular dizisi yerine tek bir soru objesi geldiyse
      if (
        parsedJson.questionText &&
        parsedJson.options &&
        !parsedJson.questions
      ) {
        console.log(
          `[QUIZ_DEBUG] [${traceId}] Tek soru objesi tespit edildi, questions dizisine dönüştürülüyor.`,
        );
        this.logger.info(
          `[${traceId}] Tek soru objesi tespit edildi, questions dizisine dönüştürülüyor.`,
          'QuizValidationService.parseAIResponseToJSON',
        );
        // Tek soruyu questions dizisine çevir
        return { questions: [parsedJson] } as unknown as T;
      }

      return parsedJson as T;
    } catch (error) {
      // JSON parse hatası - hata mesajını logla
      this.logger.error(
        `[${traceId}] JSON parse hatası: ${error.message}`,
        'QuizValidationService.parseAIResponseToJSON',
        __filename,
        error,
      );

      // Son çare: Ham yanıttan düzenli ifadelerle soruları çıkarmayı dene
      console.log(
        `[QUIZ_DEBUG] [${traceId}] JSON parse başarısız. Ham yanıttan json blokları çıkarılmaya çalışılıyor...`,
      );

      try {
        // İç içe JSON nesnelerini bulmak için daha gelişmiş bir yaklaşım
        // Bu, yanıtın kırık olduğu durumlar için son bir çaredir
        return this.extractAndConsolidateJsonFromText<T>(text, metadata);
      } catch (extractError) {
        console.log(
          `[QUIZ_DEBUG] [${traceId}] Ham yanıttan JSON nesneleri çıkarılamadı: ${extractError.message}`,
        );
        this.logger.error(
          `[${traceId}] Ham yanıttan JSON nesneleri çıkarılamadı: ${extractError.message}`,
          'QuizValidationService.parseAIResponseToJSON',
          __filename,
          extractError,
        );
        return this.createFallbackData<T>(text, metadata);
      }
    }
  }

  /**
   * Ham AI yanıtından birden fazla JSON nesnesi çıkarır ve birleştirir
   * @param text Ham AI yanıtı
   * @param metadata Meta veri
   * @returns Birleştirilmiş JSON nesnesi
   */
  private extractAndConsolidateJsonFromText<T>(
    text: string,
    metadata: QuizMetadata,
  ): T {
    const { traceId } = metadata;
    console.log(
      `[QUIZ_DEBUG] [${traceId}] Ham metin içinden JSON nesneleri çıkarılıyor ve birleştiriliyor`,
    );

    // JSON nesneleri bulmak için regex
    const jsonObjectRegex = /\{(?:[^{}]|(?:\{[^{}]*\}))*\}/g;

    // Tüm JSON nesnesi adaylarını bul
    const jsonCandidates = text.match(jsonObjectRegex) || [];
    console.log(
      `[QUIZ_DEBUG] [${traceId}] ${jsonCandidates.length} adet JSON nesnesi adayı bulundu`,
    );

    // Geçerli JSON objelerini filtrele
    const validJsonObjects: any[] = [];

    for (const candidate of jsonCandidates) {
      try {
        // Minimum uzunluk kontrolü (çok kısa objeler muhtemelen sorun çıkarır)
        if (candidate.length < 10) continue;

        // Temizleme ve düzeltme
        const cleaned = this.cleanJsonContent(candidate);
        const parsed = JSON.parse(cleaned);

        // Soru özelliklerine sahip mi kontrol et
        if (
          parsed.questionText ||
          parsed.options ||
          parsed.questions ||
          parsed.id
        ) {
          console.log(
            `[QUIZ_DEBUG] [${traceId}] Geçerli bir soru JSON'ı bulundu. ID: ${parsed.id || 'tanımsız'}`,
          );
          validJsonObjects.push(parsed);
        }
      } catch (e) {
        // Bu aday geçerli bir JSON değil, atla
        continue;
      }
    }

    console.log(
      `[QUIZ_DEBUG] [${traceId}] ${validJsonObjects.length} adet geçerli JSON nesnesi bulundu`,
    );

    // Hiç geçerli JSON objesi bulunamadıysa fallback data döndür
    if (validJsonObjects.length === 0) {
      console.log(
        `[QUIZ_DEBUG] [${traceId}] Hiç geçerli JSON nesnesi bulunamadı, fallback veri döndürülüyor`,
      );
      return this.createFallbackData<T>(text, metadata);
    }

    // Tek bir questions dizisine sahip bir obje oluştur
    // Her bir soruda questionText, options vb. var mı kontrol et
    const consolidatedQuestions = validJsonObjects.filter((obj: any) => {
      return (
        (obj.questionText && Array.isArray(obj.options)) ||
        (obj.questions && Array.isArray(obj.questions))
      );
    });

    // Eğer objelerden birinde questions dizisi varsa, onu kullan
    const questionsArray = consolidatedQuestions.find(
      (obj: any) => obj.questions && Array.isArray(obj.questions),
    );
    if (questionsArray) {
      console.log(
        `[QUIZ_DEBUG] [${traceId}] questions dizisi içeren bir JSON nesnesi bulundu, bu kullanılacak`,
      );
      return questionsArray as T;
    }

    // questions dizisi yoksa, her bir geçerli soruyu birleştir
    console.log(
      `[QUIZ_DEBUG] [${traceId}] ${consolidatedQuestions.length} adet tekil soru birleştiriliyor`,
    );
    return { questions: consolidatedQuestions } as unknown as T;
  }

  /**
   * JSON içeriğini temizler
   * @param content JSON içeriği
   * @returns Temizlenmiş JSON içeriği
   */
  private cleanJsonContent(content: string): string {
    console.log(
      `[DEBUG] JSON içeriği temizleniyor. Orjinal uzunluk: ${content.length}`,
    );

    // Başlangıçta ve sondaki gereksiz karakterleri temizle
    let cleaned = content.trim();

    // Eğer markdown kod bloğu içindeyse çıkar
    cleaned = cleaned.replace(/^```json\s*|\s*```$/g, '');

    // Escape edilen çift tırnakları düzelt
    cleaned = cleaned.replace(/\\"/g, '"');

    // JSON yapısını bozan özel karakterleri temizle
    cleaned = cleaned.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');

    // Unicode escape karakterlerini düzelt
    cleaned = cleaned.replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) => {
      return String.fromCodePoint(parseInt(hex, 16));
    });

    // Tek tırnak yerine çift tırnak kullan (JSON standardı)
    // Ancak bu tehlikeli olabilir, string içindeki tırnakları etkilememesi gerekir
    // Bu yüzden basit bir regex yerine JSON anahtarlarına uygulanmalı
    cleaned = cleaned.replace(/([{,]\s*)\'([^']+)\'(\s*:)/g, '$1"$2"$3');

    // Gereksiz virgülleri temizle, özellikle son elemanlardan sonraki virgüller
    cleaned = cleaned.replace(/,\s*([\]}])/g, '$1');

    // "undefined" literallerini boş değere çevir
    cleaned = cleaned.replace(/: undefined/g, ': null');

    // Yeni satır, sekme ve formatlama karakterlerini temizle (İsteğe bağlı)
    // cleaned = cleaned.replace(/\s+/g, ' ');

    // Doğru şekillenmiş bir JSON mu diye kontrol et
    try {
      const parsed = JSON.parse(cleaned);
      // Geçerli bir JSON objesi, dokunma
      console.log(
        `[DEBUG] JSON içeriği başarıyla temizlendi ve geçerli. Temizlenmiş uzunluk: ${cleaned.length}`,
      );
      return cleaned;
    } catch (error) {
      // Geçerli JSON oluşturulamadı, ek düzeltme denemeleri
      console.log(
        `[DEBUG] Temizlenmiş JSON hala geçerli bir JSON değil: ${error.message}. Ek düzeltme denemeleri yapılıyor.`,
      );

      try {
        // Daha agresif temizleme denemesi - işe yaramayabilir!
        cleaned = this.attemptToFixJsonContent(cleaned);
        // Kontrol et
        JSON.parse(cleaned);
        console.log(
          `[DEBUG] Ek düzeltme sonrası JSON geçerli hale getirildi. Uzunluk: ${cleaned.length}`,
        );
        return cleaned;
      } catch (finalError) {
        console.log(
          `[DEBUG] Tüm düzeltme denemelerine rağmen JSON geçerli hale getirilemedi: ${finalError.message}`,
        );
        // En azından temizlemeye çalıştık, böyle döndür
        return cleaned;
      }
    }
  }

  /**
   * JSON içeriğini düzeltmeye çalışır
   * @param content Düzeltilecek JSON içeriği
   * @returns Düzeltilmiş JSON içeriği
   */
  private attemptToFixJsonContent(content: string): string {
    let fixedContent = content;

    // Tırnak işaretlerini düzelt (eğik tırnak yerine düz tırnak)
    fixedContent = fixedContent.replace(/[""]/g, '"').replace(/['']/g, "'");

    // Çift virgülleri düzelt
    fixedContent = fixedContent.replace(/,,/g, ',');

    // Son virgülü düzelt (geçersiz JSON'a neden olabilir)
    fixedContent = fixedContent.replace(/,\s*}/g, '}').replace(/,\s*\]/g, ']');

    // Gövdede tırnak unutulmuş property'leri düzelt
    fixedContent = fixedContent.replace(
      /(\{|\,)\s*([a-zA-Z0-9_]+)\s*\:/g,
      '$1"$2":',
    );

    return fixedContent;
  }

  /**
   * AI yanıtından JSON benzeri metni çıkarır
   * @param text AI yanıt metni
   * @returns JSON benzeri metin veya null
   */
  private extractJsonFromAIResponse(text: string): string | null {
    console.log(
      `[DEBUG] AI yanıtındaki JSON çıkarma işlemi başlatılıyor. Metin uzunluğu: ${text.length}`,
    );

    // 1. İlk olarak markdown kod bloklarını temizleyelim
    let cleanText = text.replace(/```json\s*|\s*```/g, '');
    console.log(
      `[DEBUG] Markdown temizleme sonrası metin uzunluğu: ${cleanText.length}`,
    );

    // 2. İlk { ve son } karakterlerini bul (tam JSON yapısını kapsayan)
    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');

    // Eğer tam bir JSON yapısı bulunursa
    if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
      try {
        const candidateJson = cleanText.substring(firstBrace, lastBrace + 1);
        console.log(
          `[DEBUG] Potansiyel tam JSON bulundu (${candidateJson.length} karakter)`,
        );

        // Parantez dengesini kontrol et
        const isBalanced = this.checkParenthesesBalance(candidateJson);
        if (isBalanced) {
          console.log(
            `[DEBUG] Parantez dengesi doğru, JSON parse deneniyor...`,
          );

          // Parse denemesi
          try {
            JSON.parse(candidateJson);
            console.log(`[DEBUG] Tam JSON başarıyla parse edildi!`);
            return candidateJson;
          } catch (parseError) {
            console.log(`[DEBUG] Tam JSON parse hatası: ${parseError.message}`);
          }
        }
      } catch (error) {
        console.log(`[DEBUG] Tam JSON çıkarma hatası: ${error.message}`);
      }
    }

    // 3. Manuel JSON nesnesi oluşturma stratejisi (questions dizisi için)
    try {
      console.log(`[DEBUG] Manuel JSON oluşturma stratejisi uygulanıyor...`);
      const questionObjects = this.extractAllQuestionObjects(cleanText);

      if (questionObjects.length > 0) {
        console.log(
          `[DEBUG] ${questionObjects.length} adet soru nesnesi başarıyla çıkarıldı`,
        );
        // Soru nesnelerini questions dizisinde toplayan bir JSON oluştur
        const combinedJson = `{"questions": ${JSON.stringify(questionObjects)}}`;
        return combinedJson;
      }
    } catch (error) {
      console.log(`[DEBUG] Manuel JSON oluşturma hatası: ${error.message}`);
    }

    // 4. Hiçbir yöntem başarılı olmazsa, original regex yaklaşımını dene
    console.log(`[DEBUG] Geleneksel regex yöntemi deneniyor...`);
    const objectRegex = /\{(?:[^{}]|(?:\{(?:[^{}]|(?:\{[^{}]*\}))*\}))*\}/g;
    const matches = cleanText.match(objectRegex);

    if (matches && matches.length > 0) {
      // En uzun object match'ini bul
      const longestMatch = matches.reduce(
        (longest, current) =>
          current.length > longest.length ? current : longest,
        '',
      );

      if (longestMatch && longestMatch.length > 100) {
        console.log(
          `[DEBUG] Regex ile bulunan en uzun JSON (${longestMatch.length} karakter)`,
        );

        // questions array kontrolü yap
        if (
          longestMatch.includes('"questions"') &&
          longestMatch.includes('"id"')
        ) {
          try {
            const parsed = JSON.parse(longestMatch);
            return longestMatch;
          } catch (e) {
            console.log(`[DEBUG] Bulunan JSON parse edilemedi: ${e.message}`);
          }
        }

        // Eğer tek bir soru objesi gibi görünüyorsa, questions dizisi içine koy
        if (
          longestMatch.includes('"questionText"') &&
          longestMatch.includes('"options"') &&
          !longestMatch.includes('"questions"')
        ) {
          try {
            const parsed = JSON.parse(longestMatch);
            return `{"questions": [${longestMatch}]}`;
          } catch (e) {
            console.log(`[DEBUG] Regex JSON parse edilemedi: ${e.message}`);
          }
        }

        return longestMatch;
      }
    }

    console.log(`[DEBUG] Hiçbir JSON çıkarma yöntemi başarılı olmadı!`);
    return null;
  }

  /**
   * AI yanıtındaki tüm soru objelerini çıkarır
   * @param text Temizlenmiş AI yanıtı
   * @returns Soru objeleri dizisi
   */
  private extractAllQuestionObjects(text: string): any[] {
    const questionObjects: any[] = [];
    const regex =
      /\{\s*"id"\s*:\s*"[^"]+"\s*,\s*"questionText"\s*:\s*"[^"]*"[\s\S]*?\}\s*(?=,\s*\{\s*"id"|\s*\])/g;

    // Tüm potansiyel soru objelerini bul
    const matches = text.match(regex) || [];
    console.log(`[DEBUG] ${matches.length} potansiyel soru objesi bulundu`);

    // Her bir eşleşmeyi JSON nesnesi olarak parse etmeyi dene
    for (let i = 0; i < matches.length; i++) {
      try {
        let objText = matches[i].trim();

        // Sondaki virgül varsa temizle
        if (objText.endsWith(',')) {
          objText = objText.slice(0, -1);
        }

        // Son süslü parantezleri kontrol et
        if (!objText.endsWith('}')) {
          objText = this.fixJsonBraces(objText);
        }

        // Parse etmeyi dene
        const parsedObj = JSON.parse(objText);

        // Geçerli bir soru objesi mi kontrol et
        if (parsedObj.id && parsedObj.questionText && parsedObj.options) {
          questionObjects.push(parsedObj);
          console.log(
            `[DEBUG] Soru #${i + 1} başarıyla çıkarıldı: ${parsedObj.id}`,
          );
        }
      } catch (error) {
        console.log(`[DEBUG] Soru #${i + 1} parse edilemedi: ${error.message}`);
      }
    }

    return questionObjects;
  }

  /**
   * JSON metnindeki parantez dengesini kontrol eder
   * @param text JSON metni
   * @returns Dengeli ise true
   */
  private checkParenthesesBalance(text: string): boolean {
    const stack: string[] = [];

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      if (char === '{' || char === '[') {
        stack.push(char);
      } else if (char === '}') {
        if (stack.pop() !== '{') return false;
      } else if (char === ']') {
        if (stack.pop() !== '[') return false;
      }
    }

    return stack.length === 0;
  }

  /**
   * Eksik kapanan süslü parantezleri düzeltir
   * @param text JSON metni
   * @returns Düzeltilmiş metin
   */
  private fixJsonBraces(text: string): string {
    let openCount = 0;
    let closeCount = 0;

    for (const char of text) {
      if (char === '{') openCount++;
      else if (char === '}') closeCount++;
    }

    // Eksik kapanan parantezleri ekle
    const missingCloseBraces = openCount - closeCount;
    if (missingCloseBraces > 0) {
      return text + '}'.repeat(missingCloseBraces);
    }

    return text;
  }

  /**
   * Parse işlemi başarısız olduğunda fallback veri oluşturur
   * @param text AI yanıt metni
   * @param metadata Metadata
   * @returns Fallback quiz sorularını içeren veri
   */
  private createFallbackData<T>(text: string, metadata: QuizMetadata): T {
    const { traceId, questionCount = 5, difficulty = 'mixed' } = metadata;

    // AI yanıtı işlemede hata oluştu, fallback sorular oluşturulacak
    this.logger.warn(
      `[${traceId}] AI yanıtı düzgün işlenemedi. Fallback sorular oluşturuluyor.`,
      'QuizValidationService.createFallbackData',
    );

    // Sınav oluşturma hatasını detaylı loglama
    this.logger.logExamError(
      metadata.userId || 'anonymous',
      new Error('AI yanıtı işlenirken hata oluştu, fallback sorular kullanılıyor'),
      {
        traceId,
        rawResponseLength: text?.length || 0,
        documentId: metadata.documentId,
        subTopics: Array.isArray(metadata.subTopics)
          ? metadata.subTopics.slice(0, 3)
          : metadata.subTopics
            ? Object.keys(metadata.subTopics).slice(0, 3)
            : [],
        timestamp: new Date().toISOString(),
      },
    );

    // Örnek içeriklerin tespit edilip edilmediğini kontrol et
    const containsExamples = this.detectExampleContent(text);
    
    if (containsExamples) {
      // Örnek içerik tespitini loglama
      this.logger.logExamProcess(
        `[UYARI] ${metadata.userId || 'anonymous'} kullanıcısı için sınav oluşturulurken AI yanıtında örnek içerik tespit edildi. Fallback sorular kullanılacak.`,
        {
          traceId,
          userId: metadata.userId,
          timestamp: new Date().toISOString(),
          containsExamples: true,
        },
        'warn',
      );
    }

    // AI yanıtının ilk 500 karakterini loglayalım (debugging amaçlı)
    if (text) {
      this.logger.debug(
        `[${traceId}] İşlenemeyen AI yanıtının başlangıcı: ${text.substring(0, 500)}...`,
        'QuizValidationService.createFallbackData',
      );

      // sinav-olusturma.log'a da kaydedelim
      this.logger.logExamProcess(
        `AI yanıtı işlenemedi, fallback sorular oluşturuluyor - Trace ID: ${traceId}`,
        {
          responsePreview: text.substring(0, 300) + '...',
          metadata: JSON.stringify(metadata),
        },
        'warn',
      );
    }

    // Fallback sorularını oluştur
    const fallbackQuestions = this.createFallbackQuestions(metadata);
    
    this.logger.info(
      `[${traceId}] ${fallbackQuestions.length} adet fallback soru başarıyla oluşturuldu.`,
      'QuizValidationService.createFallbackData',
    );

    // Uygun formatta döndür - eğer questions dizisi bekleniyor ise onu döndür
    return { questions: fallbackQuestions } as T;
  }

  /**
   * Metinden örnek içerik olup olmadığını tespit eder
   * @param text AI yanıt metni
   * @returns Örnek içerik varsa true, yoksa false
   */
  private detectExampleContent(text: string): boolean {
    if (!text) return false;

    // Örnek içerikleri gösterdiğine dair işaretler
    const examplePatterns = [
      /örnek\s*\d+/i,
      /example\s*\d+/i,
      /-- ÖRNEK BAŞLAN[GI]*/i,
      /ÖRNEK BİTİŞ/i,
      /\*\*Örnek \d+/i,
      /id:\s*["']q\d+["']/i,
      /id:\s*["']soru-id/i,
      /newton.*ikinci hareket/i,
      /kapsülleme.*encapsulation/i,
    ];

    return examplePatterns.some((pattern) => pattern.test(text));
  }

  /**
   * Ham metinden soru nesneleri çıkarır
   * @param text Ham AI yanıt metni
   * @returns Çıkarılan soru nesneleri dizisi
   */
  private extractQuestionsFromText(text: string): QuizQuestion[] {
    if (!text) return [];

    const questions: QuizQuestion[] = [];

    try {
      // Metinde JSON bloklarını bul
      const jsonRegex = /\{[\s\S]*?\}/g;
      const matches = text.match(jsonRegex);

      if (!matches) return [];

      // Her bir JSON bloğunu parse etmeyi dene
      for (const match of matches) {
        try {
          const obj = JSON.parse(match);

          // Bir soru nesnesi olup olmadığını kontrol et
          if (
            obj &&
            typeof obj === 'object' &&
            (obj.questionText || obj.question) &&
            Array.isArray(obj.options)
          ) {
            // Eksik alanları varsayılan değerlerle tamamla
            const question: QuizQuestion = {
              id:
                obj.id || `q_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              questionText:
                obj.questionText || obj.question || 'Soru metni eksik',
              options: obj.options || [
                'A) Seçenek eksik',
                'B) Seçenek eksik',
                'C) Seçenek eksik',
                'D) Seçenek eksik',
              ],
              correctAnswer:
                obj.correctAnswer || obj.correct || obj.answer || 'Cevap eksik',
              explanation: obj.explanation || obj.reason || 'Açıklama eksik',
              subTopicName:
                obj.subTopicName || obj.subTopic || obj.topic || 'Genel Konu',
              normalizedSubTopicName:
                this.normalizationService.normalizeSubTopicName(
                  obj.subTopicName || obj.subTopic || obj.topic || 'Genel Konu',
                ),
              difficulty: obj.difficulty || 'medium',
              questionType: obj.questionType || 'multiple_choice',
              cognitiveDomain: obj.cognitiveDomain || 'understanding',
            };

            questions.push(question);
          }
        } catch (e) {
          // Bu JSON bloğu parse edilemiyor, atla
          continue;
        }
      }

      // Tüm metin içinde bir JSON nesnesi var mı kontrol et
      if (questions.length === 0) {
        try {
          // Tüm metni JSON olarak parse et
          const json = JSON.parse(text);

          // JSON bir dizi mi kontrol et
          if (Array.isArray(json)) {
            // Her bir öğenin soru olup olmadığını kontrol et
            const validQuestions = json
              .filter(
                (item) =>
                  item &&
                  typeof item === 'object' &&
                  (item.questionText || item.question) &&
                  Array.isArray(item.options),
              )
              .map((item) => ({
                id:
                  item.id ||
                  `q_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                questionText:
                  item.questionText || item.question || 'Soru metni eksik',
                options: item.options || [
                  'A) Seçenek eksik',
                  'B) Seçenek eksik',
                  'C) Seçenek eksik',
                  'D) Seçenek eksik',
                ],
                correctAnswer:
                  item.correctAnswer ||
                  item.correct ||
                  item.answer ||
                  'Cevap eksik',
                explanation:
                  item.explanation || item.reason || 'Açıklama eksik',
                subTopicName:
                  item.subTopicName ||
                  item.subTopic ||
                  item.topic ||
                  'Genel Konu',
                normalizedSubTopicName:
                  this.normalizationService.normalizeSubTopicName(
                    item.subTopicName ||
                      item.subTopic ||
                      item.topic ||
                      'Genel Konu',
                  ),
                difficulty: item.difficulty || 'medium',
                questionType: item.questionType || 'multiple_choice',
                cognitiveDomain: item.cognitiveDomain || 'understanding',
              }));

            if (validQuestions.length > 0) {
              questions.push(...validQuestions);
            }
          } else if (json.questions && Array.isArray(json.questions)) {
            // JSON bir nesne ve questions alanı var mı kontrol et
            const validQuestions = json.questions
              .filter(
                (item) =>
                  item &&
                  typeof item === 'object' &&
                  (item.questionText || item.question) &&
                  Array.isArray(item.options),
              )
              .map((item) => ({
                id:
                  item.id ||
                  `q_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                questionText:
                  item.questionText || item.question || 'Soru metni eksik',
                options: item.options || [
                  'A) Seçenek eksik',
                  'B) Seçenek eksik',
                  'C) Seçenek eksik',
                  'D) Seçenek eksik',
                ],
                correctAnswer:
                  item.correctAnswer ||
                  item.correct ||
                  item.answer ||
                  'Cevap eksik',
                explanation:
                  item.explanation || item.reason || 'Açıklama eksik',
                subTopicName:
                  item.subTopicName ||
                  item.subTopic ||
                  item.topic ||
                  'Genel Konu',
                normalizedSubTopicName:
                  this.normalizationService.normalizeSubTopicName(
                    item.subTopicName ||
                      item.subTopic ||
                      item.topic ||
                      'Genel Konu',
                  ),
                difficulty: item.difficulty || 'medium',
                questionType: item.questionType || 'multiple_choice',
                cognitiveDomain: item.cognitiveDomain || 'understanding',
              }));

            questions.push(...validQuestions);
          }
        } catch (e) {
          // Tüm metni JSON olarak parse edemedik, zaten tek tek bloklara ayırarak denemiştik
        }
      }
    } catch (error) {
      // Metinde JSON bloğu bulunamadı veya işleme hatalıydı
      this.logger.warn(
        `Metinden soru nesneleri çıkarılamadı: ${error.message}`,
        'QuizValidationService.extractQuestionsFromText',
      );
    }

    return questions;
  }

  /**
   * AI yanıt alınamadığında veya işlenemediğinde Fallback soru seti oluştur
   * @param metadata QuizMetadata
   * @returns Varsayılan soru seti
   */
  createFallbackQuestions(metadata: QuizMetadata): QuizQuestion[] {
    const {
      subTopicsCount = 0,
      subTopics = [],
      documentId = null,
      difficulty = 'medium',
      keywords = '',
      specialTopic = '',
      traceId = 'fallback',
    } = metadata;

    // Fallback soruların izlenebilmesi için log ekle
    this.logger.warn(
      `⚠️ [${traceId}] Fallback sorular oluşturuluyor (konu: ${
        Array.isArray(subTopics)
          ? typeof subTopics[0] === 'string'
            ? (subTopics as string[]).slice(0, 3).join(', ')
            : (subTopics as { subTopicName: string }[])
                .slice(0, 3)
                .map((t) => t.subTopicName)
                .join(', ')
          : 'bilinmeyen'
      }${
        Array.isArray(subTopics) && subTopics.length > 3 ? '...' : ''
      }, belge ID: ${documentId || 'yok'})`,
      'QuizValidationService.createFallbackQuestions',
    );

    this.flowTracker.trackStep(
      `AI yanıtı işlenemiyor, fallback sorular oluşturuluyor. Alt konular: ${Array.isArray(subTopics) ? subTopics.length : 0} adet`,
      'QuizValidationService',
    );

    // Eğer özel Eksaskala konusu ise, ilgili konuya özel sorular üret
    if (
      specialTopic === 'eksaskala' ||
      (Array.isArray(subTopics) &&
        subTopics.some((topic) => {
          if (typeof topic === 'string')
            return topic.toLowerCase().includes('eksaskala');
          if (typeof topic === 'object' && topic && topic.subTopicName)
            return topic.subTopicName.toLowerCase().includes('eksaskala');
          return false;
        }))
    ) {
      this.flowTracker.trackStep(
        `Eksaskala konusuna özel sorular üretiliyor`,
        'QuizValidationService',
      );
      return this.createEksaskalaSpecificQuestions(subTopics);
    }

    // Anahtar kelimeleri içeren konulara göre dinamik sorular üret
    // Anahtar kelimeler, quiz-generation.service.ts'de belge içeriğinden çıkarılıyor
    if (keywords && keywords.length > 0) {
      const keywordsList = keywords.split(',').map((k) => k.trim());
      if (keywordsList.length >= 3) {
        this.flowTracker.trackStep(
          `Belge içeriğinden çıkarılan ${keywordsList.length} anahtar kelimeye dayalı sorular üretiliyor`,
          'QuizValidationService',
        );
        return this.createKeywordBasedQuestions(keywordsList, subTopics);
      }
    }

    // Zorluk seviyesine göre farklı soru tipleri dağıt - İngilizce değerleri kullan
    // 'hard', 'medium', 'easy' değerlerini doğrudan kullan, Türkçe dönüşüm yapma
    const difficultyLevel = difficulty === 'mixed' ? 'medium' : difficulty;

    this.flowTracker.trackStep(
      `Standart fallback sorular üretiliyor, zorluk: ${difficultyLevel}`,
      'QuizValidationService',
    );

    // Varsayılan alt konu adı
    const defaultSubTopic = 'Genel Konular';

    // Alt konuları normalleştirmeyi kontrol et ve konu başlıklarını daha anlaşılır hale getir
    const normalizedTopics = Array.isArray(subTopics)
      ? subTopics.map((topic) => {
          // Null/undefined kontrolü
          if (!topic) return defaultSubTopic;
          // String mi object mi kontrolü
          if (typeof topic === 'string') {
            // Normalleştirme sırasında - veya _ karakterlerini boşluğa çevir
            return topic.replace(/-/g, ' ').replace(/_/g, ' ');
          } else if (typeof topic === 'object' && topic && topic.subTopicName) {
            return topic.subTopicName.replace(/-/g, ' ').replace(/_/g, ' ');
          }
          return defaultSubTopic;
        })
      : [defaultSubTopic];

    // subTopics'ten string değer çıkarma helper fonksiyonu
    const getTopicString = (index: number): string => {
      if (!Array.isArray(subTopics) || index >= subTopics.length)
        return defaultSubTopic;

      const topic = subTopics[index];
      if (typeof topic === 'string') return topic;
      if (typeof topic === 'object' && topic && topic.subTopicName)
        return topic.subTopicName;

      return defaultSubTopic;
    };

    return [
      {
        id: `fallback_1_${Date.now()}`,
        questionText: `${normalizedTopics[0] || 'Programlama'} alanında, aşağıdakilerden hangisi ${normalizedTopics[0] || 'yazılım geliştirme'} sürecinde en önemli adımdır?`,
        options: [
          'A) Algoritma tasarımı',
          'B) Kodun test edilmesi',
          'C) Gereksinimlerin belirlenmesi',
          'D) Dokümantasyon yazımı',
        ],
        correctAnswer: 'C) Gereksinimlerin belirlenmesi',
        explanation: `${normalizedTopics[0] || 'Yazılım geliştirme'} sürecinde gereksinimlerin doğru belirlenmesi, projenin başarısı için en kritik adımdır. Diğer tüm adımlar da önemlidir ancak doğru gereksinimler olmadan başarılı bir proje geliştirmek mümkün değildir.`,
        subTopicName: subTopicsCount > 0 ? getTopicString(0) : defaultSubTopic,
        normalizedSubTopicName:
          subTopicsCount > 0
            ? this.normalizationService.normalizeSubTopicName(getTopicString(0))
            : this.normalizationService.normalizeSubTopicName(defaultSubTopic),
        difficulty: difficultyLevel,
        questionType: 'multiple_choice',
        cognitiveDomain: 'understanding',
      },
      {
        id: `fallback_2_${Date.now()}`,
        questionText: `${normalizedTopics[1] || normalizedTopics[0] || 'Bilgisayar Bilimleri'} konusunda, hangi yaklaşım daha verimli sonuçlar verir?`,
        options: [
          'A) İteratif geliştirme',
          'B) Waterfall metodolojisi',
          'C) Ad-hoc yaklaşım',
          'D) Tek seferde tamamlama',
        ],
        correctAnswer: 'A) İteratif geliştirme',
        explanation: `${normalizedTopics[1] || normalizedTopics[0] || 'Bilgisayar Bilimleri'} alanında iteratif geliştirme, geri bildirim döngülerini kullanarak sürekli iyileştirme sağladığı için genellikle daha verimli sonuçlar verir. Bu yaklaşım, hataların erken tespit edilmesini ve düzeltilmesini kolaylaştırır.`,
        subTopicName:
          subTopicsCount > 1
            ? getTopicString(1)
            : subTopicsCount > 0
              ? getTopicString(0)
              : 'Yazılım Metodolojileri',
        normalizedSubTopicName:
          subTopicsCount > 1
            ? this.normalizationService.normalizeSubTopicName(getTopicString(1))
            : subTopicsCount > 0
              ? this.normalizationService.normalizeSubTopicName(
                  getTopicString(0),
                )
              : this.normalizationService.normalizeSubTopicName(
                  'Yazılım Metodolojileri',
                ),
        difficulty: difficultyLevel,
        questionType: 'multiple_choice',
        cognitiveDomain: 'analyzing',
      },
      {
        id: `fallback_3_${Date.now()}`,
        questionText: `${normalizedTopics[2] || normalizedTopics[0] || 'Veri Yapıları'} bağlamında en önemli performans faktörü nedir?`,
        options: [
          'A) Bellek kullanımı',
          'B) Zaman karmaşıklığı',
          'C) Kod okunabilirliği',
          'D) Uygulanabilirlik kolaylığı',
        ],
        correctAnswer: 'B) Zaman karmaşıklığı',
        explanation: `${normalizedTopics[2] || normalizedTopics[0] || 'Veri Yapıları'} değerlendirilirken zaman karmaşıklığı, bir algoritmanın veri miktarına göre ölçeklenmesini temsil eder ve genellikle en kritik performans faktörüdür. Özellikle büyük veri setleriyle çalışırken, zaman karmaşıklığı algoritma seçiminde belirleyici rol oynar.`,
        subTopicName:
          subTopicsCount > 2
            ? getTopicString(2)
            : subTopicsCount > 0
              ? getTopicString(0)
              : 'Algoritma Analizi',
        normalizedSubTopicName:
          subTopicsCount > 2
            ? this.normalizationService.normalizeSubTopicName(getTopicString(2))
            : subTopicsCount > 0
              ? this.normalizationService.normalizeSubTopicName(
                  getTopicString(0),
                )
              : this.normalizationService.normalizeSubTopicName(
                  'Algoritma Analizi',
                ),
        difficulty: difficultyLevel,
        questionType: 'multiple_choice',
        cognitiveDomain: 'analyzing',
      },
      {
        id: `fallback_4_${Date.now()}`,
        questionText: `${normalizedTopics[3] || normalizedTopics[0] || 'Modern Yazılım Geliştirme'} yaklaşımında aşağıdakilerden hangisi doğrudur?`,
        options: [
          'A) Ekip çalışması, bireysel çalışmadan her zaman daha verimsizdir',
          'B) Dokümantasyon, modern geliştirme süreçlerinde tamamen gereksizdir',
          'C) Sürekli entegrasyon (CI), kod kalitesini artırmaya yardımcı olur',
          'D) Test yazımı sadece projenin sonunda yapılmalıdır',
        ],
        correctAnswer:
          'C) Sürekli entegrasyon (CI), kod kalitesini artırmaya yardımcı olur',
        explanation: `${normalizedTopics[3] || normalizedTopics[0] || 'Modern Yazılım Geliştirme'} pratiklerinde sürekli entegrasyon (CI), kodun düzenli olarak entegre edilmesini, otomatik testlerden geçirilmesini sağlayarak hataların erken tespit edilmesine ve kod kalitesinin artmasına yardımcı olur.`,
        subTopicName:
          subTopicsCount > 3
            ? getTopicString(3)
            : subTopicsCount > 0
              ? getTopicString(0)
              : 'Yazılım Kalitesi',
        normalizedSubTopicName:
          subTopicsCount > 3
            ? this.normalizationService.normalizeSubTopicName(getTopicString(3))
            : subTopicsCount > 0
              ? this.normalizationService.normalizeSubTopicName(
                  getTopicString(0),
                )
              : this.normalizationService.normalizeSubTopicName(
                  'Yazılım Kalitesi',
                ),
        difficulty: difficultyLevel,
        questionType: 'multiple_choice',
        cognitiveDomain: 'understanding',
      },
      {
        id: `fallback_5_${Date.now()}`,
        questionText: `${normalizedTopics[4] || normalizedTopics[0] || 'Bilgisayar Bilimi'} alanında, aşağıdaki ifadelerden hangisi doğrudur?`,
        options: [
          'A) Her problemin polinom zamanda çözülebildiği matematiksel olarak kanıtlanmıştır',
          'B) Yapay zeka, tüm programlama problemlerini otomatik olarak çözebilir',
          'C) NP-Tam problemlerin verimli çözümleri henüz bulunamamıştır',
          'D) Bilgisayarlar, insan beyni ile aynı şekilde düşünür ve öğrenir',
        ],
        correctAnswer:
          'C) NP-Tam problemlerin verimli çözümleri henüz bulunamamıştır',
        explanation: `${normalizedTopics[4] || normalizedTopics[0] || 'Bilgisayar Bilimi'} alanında, NP-Tam problemlerin polinom zamanda çözülüp çözülemeyeceği (P=NP problemi) hala açık bir sorudur. Bu problemlerin verimli çözümleri henüz bulunamamıştır ve bu, teorik bilgisayar biliminin en önemli açık problemlerinden biridir.`,
        subTopicName:
          subTopicsCount > 4
            ? getTopicString(4)
            : subTopicsCount > 0
              ? getTopicString(0)
              : 'Teorik Bilgisayar Bilimi',
        normalizedSubTopicName:
          subTopicsCount > 4
            ? this.normalizationService.normalizeSubTopicName(getTopicString(4))
            : subTopicsCount > 0
              ? this.normalizationService.normalizeSubTopicName(
                  getTopicString(0),
                )
              : this.normalizationService.normalizeSubTopicName(
                  'Teorik Bilgisayar Bilimi',
                ),
        difficulty: difficultyLevel,
        questionType: 'multiple_choice',
        cognitiveDomain: 'analyzing',
      },
    ];
  }

  /**
   * Eksaskala konularına özel sorular üretir
   */
  private createEksaskalaSpecificQuestions(
    subTopics: SubTopicType,
  ): QuizQuestion[] {
    // Alt konu adlarını dizeye çevirelim
    const subTopicNames = Array.isArray(subTopics)
      ? typeof subTopics[0] === 'string'
        ? (subTopics as string[])
        : (
            subTopics as {
              subTopicName: string;
              count: number;
              status?: string;
            }[]
          ).map((t) => t.subTopicName)
      : ['Eksaskala'];

    this.logger.info(
      `Eksaskala özel soruları oluşturuluyor (${subTopicNames.length} konu)`,
      'QuizValidationService.createEksaskalaSpecificQuestions',
    );

    return [
      {
        id: `eks_fallback_1_${Date.now()}`,
        questionText:
          'Eksaskala bilgi işlem sistemlerinin karşılaştığı temel yazılım zorlukları arasında aşağıdakilerden hangisi yer almaz?',
        options: [
          'A) Ölçeklenebilirlik sorunları',
          'B) Hata toleransı ve dayanıklılık',
          'C) Masaüstü kullanıcı arayüzü tasarımı',
          'D) Milyonlarca çekirdeğin etkin yönetimi',
        ],
        correctAnswer: 'C) Masaüstü kullanıcı arayüzü tasarımı',
        explanation:
          'Eksaskala sistemlerinde masaüstü kullanıcı arayüzü tasarımı temel bir yazılım zorluğu değildir. Eksaskala sistemleri daha çok ölçeklenebilirlik, hata toleransı, yüksek performanslı hesaplama, veri hareketi ve milyonlarca işlemci çekirdeğinin etkin yönetimi gibi zorluklarla karşılaşır.',
        subTopicName: 'Eksaskala Yazılım Zorlukları',
        normalizedSubTopicName: 'eksaskala-yazilim-zorluklari',
        difficulty: 'medium',
        questionType: 'multiple_choice',
        cognitiveDomain: 'understanding',
      },
      {
        id: `eks_fallback_2_${Date.now()}`,
        questionText:
          'Eksaskala sistemlerinin ölçeklenebilirlik özelliği için aşağıdaki ifadelerden hangisi doğrudur?',
        options: [
          'A) Yüzbinlerce çekirdekle çalışan uygulamalar mevcut HPC uygulamalarının doğrudan ölçeklendirilmesiyle elde edilebilir',
          'B) Ölçeklenebilirlikte bellek erişim desenleri önemsizdir',
          'C) Uygulamaların zayıf ölçeklenebilirliği bile eksaskala sistem performansını etkilemez',
          'D) İdeal ölçeklenebilirlikte, işlemci sayısı iki katına çıktığında uygulama hızı da iki katına çıkar',
        ],
        correctAnswer:
          'D) İdeal ölçeklenebilirlikte, işlemci sayısı iki katına çıktığında uygulama hızı da iki katına çıkar',
        explanation:
          'İdeal ölçeklenebilirlikte (lineer ölçeklenebilirlik), işlemci sayısı iki katına çıktığında uygulama hızı da iki katına çıkar. Bu, eksaskala sistemlerinin hedeflediği optimum durumdur. Ancak gerçekte, iletişim gecikmesi, senkronizasyon ve diğer faktörler nedeniyle ideal ölçeklenebilirliğe ulaşmak zordur.',
        subTopicName: 'Ölçeklenebilirlik',
        normalizedSubTopicName: 'olceklenebilirlik',
        difficulty: 'medium',
        questionType: 'multiple_choice',
        cognitiveDomain: 'applying',
      },
      {
        id: `eks_fallback_3_${Date.now()}`,
        questionText: 'Eksaskala sistemlerinde hata toleransı neden önemlidir?',
        options: [
          'A) Sistem maliyetini azaltmak için',
          'B) Kullanıcı arayüzünü geliştirmek için',
          'C) Çok sayıda bileşen olduğundan, bileşen arızaları kaçınılmazdır',
          'D) Sadece askeri uygulamalarda gerekli olduğu için',
        ],
        correctAnswer:
          'C) Çok sayıda bileşen olduğundan, bileşen arızaları kaçınılmazdır',
        explanation:
          'Eksaskala sistemleri milyonlarca hesaplama bileşeni içerir. Bileşen sayısı arttıkça, arıza olasılığı da artar. Bu nedenle, eksaskala sistemlerinde bileşen arızaları kaçınılmazdır ve sistem çalışmaya devam edebilmek için hata toleransı mekanizmalarına ihtiyaç duyar.',
        subTopicName: 'Hata Toleransı',
        normalizedSubTopicName: 'hata-toleransi',
        difficulty: 'medium',
        questionType: 'multiple_choice',
        cognitiveDomain: 'understanding',
      },
      {
        id: `eks_fallback_4_${Date.now()}`,
        questionText:
          'Eksaskala sistemlerinde veri hareketi ile ilgili aşağıdaki ifadelerden hangisi doğrudur?',
        options: [
          'A) Veri hareketi, enerji tüketiminde önemsiz bir faktördür',
          'B) Yerel bellek erişimleri ile uzak bellek erişimleri arasında performans farkı yoktur',
          'C) Veri hareketini minimize etmek, enerji verimliliğini artırır',
          'D) Tüm veriler her zaman tüm işlemcilere eşit mesafededir',
        ],
        correctAnswer:
          'C) Veri hareketini minimize etmek, enerji verimliliğini artırır',
        explanation:
          'Eksaskala sistemlerinde veri hareketi, hem enerji tüketiminde hem de performansta önemli bir faktördür. Veri hareketini minimize etmek, enerji verimliliğini artırır çünkü veri transferi işlemci hesaplamalarından daha fazla enerji tüketir. Bu nedenle, veri yerleşimi ve veri erişim desenleri eksaskala uygulamalarında kritik öneme sahiptir.',
        subTopicName: 'Veri Hareketi',
        normalizedSubTopicName: 'veri-hareketi',
        difficulty: 'hard',
        questionType: 'multiple_choice',
        cognitiveDomain: 'analyzing',
      },
      {
        id: `eks_fallback_5_${Date.now()}`,
        questionText:
          'Eksaskala işletim sistemleri için aşağıdakilerden hangisi doğrudur?',
        options: [
          'A) Geleneksel işletim sistemleri eksaskala sistemler için yeterlidir',
          'B) Hafif çekirdek (lightweight kernel) tasarımı, sistem kaynaklarını daha verimli kullanır',
          'C) İşletim sistemi servisleri tüm çekirdeklerde tam olarak çalışmalıdır',
          'D) Eksaskala sistemlerde işletim sistemi kullanmak gereksizdir',
        ],
        correctAnswer:
          'B) Hafif çekirdek (lightweight kernel) tasarımı, sistem kaynaklarını daha verimli kullanır',
        explanation:
          'Eksaskala sistemlerinde, hafif çekirdek (lightweight kernel) tasarımı tercih edilir çünkü sistem kaynaklarını daha verimli kullanır. Geleneksel işletim sistemleri, her düğümde tam olarak çalıştığında önemli miktarda kaynak tüketir ve ölçeklenebilirlik sorunlarına neden olabilir. Hafif çekirdek tasarımı, işletim sistemi servislerinin minimize edilmesini ve hesaplama düğümlerinde sadece gerekli servislerin çalışmasını sağlar.',
        subTopicName: 'Hafif Çekirdek Tasarımı',
        normalizedSubTopicName: 'hafif-cekirdek-tasarimi',
        difficulty: 'hard',
        questionType: 'multiple_choice',
        cognitiveDomain: 'evaluating',
      },
    ];
  }

  /**
   * Belge içeriğinden çıkarılan anahtar kelimelere dayalı sorular üretir
   */
  private createKeywordBasedQuestions(
    keywords: string[],
    subTopics: SubTopicType,
  ): QuizQuestion[] {
    // Alt konu adlarını dizeye çevirelim
    const subTopicNames = Array.isArray(subTopics)
      ? typeof subTopics[0] === 'string'
        ? (subTopics as string[])
        : (
            subTopics as {
              subTopicName: string;
              count: number;
              status?: string;
            }[]
          ).map((t) => t.subTopicName)
      : [];

    this.logger.info(
      `Anahtar kelime tabanlı sorular oluşturuluyor (${keywords.slice(0, 5).join(', ')}...)`,
      'QuizValidationService.createKeywordBasedQuestions',
    );

    const topKeywords = keywords.slice(0, 15); // En önemli 15 anahtar kelime
    const questions: QuizQuestion[] = [];

    // İlk 5 alt konu veya daha azı varsa hepsini kullan
    const availableTopics = subTopicNames
      .filter((topic) => topic) // undefined/null değerleri filtrele
      .slice(0, Math.min(5, subTopicNames.length));

    // Alt konu yoksa varsayılan konular kullan
    const defaultTopics = [
      'Genel Kavramlar',
      'Temel İlkeler',
      'Uygulama Alanları',
      'Teorik Çerçeve',
      'Temel Tanımlar',
    ];

    // Kullanılacak alt konular
    const topicsToUse =
      availableTopics.length > 0 ? availableTopics : defaultTopics;

    // Farklı soru kalıpları
    const questionTemplates = [
      (topic, kw1, kw2) =>
        `"${topic}" konusunda, ${kw1} ve ${kw2} arasındaki ilişki nedir?`,
      (topic, kw1, kw2) => `${topic} alanında ${kw1} kavramının önemi nedir?`,
      (topic, kw1, kw2) =>
        `${topic} kapsamında ${kw1}, ${kw2} üzerinde nasıl bir etki yaratır?`,
      (topic, kw1, kw2) =>
        `${topic} yaklaşımında ${kw1} ve ${kw2} nasıl kullanılır?`,
      (topic, kw1, kw2) =>
        `${kw1} ve ${kw2} arasındaki fark nedir (${topic} bağlamında)?`,
    ];

    // Farklı seçenek kalıpları
    const optionTemplates = [
      (kw1, kw2, kw3) => [
        `A) ${kw1}, ${kw2}'nin bir alt kümesidir`,
        `B) ${kw2}, ${kw1}'nin özel bir uygulamasıdır`,
        `C) ${kw1} ve ${kw2} tamamen farklı kavramlardır`,
        `D) ${kw1} ve ${kw2} tamamlayıcı kavramlardır`,
      ],
      (kw1, kw2, kw3) => [
        `A) ${kw1}, sadece teorik alanlarda önemlidir`,
        `B) ${kw1}, sistem performansını doğrudan etkiler`,
        `C) ${kw1}, ${kw3} ile ilişkili değildir`,
        `D) ${kw1}, sadece ${kw2} olmadığında kullanılır`,
      ],
      (kw1, kw2, kw3) => [
        `A) ${kw1}, ${kw2}'yi tamamen ortadan kaldırır`,
        `B) ${kw1}, ${kw2}'nin etkinliğini artırır`,
        `C) ${kw1} ve ${kw2} arasında hiçbir etkileşim yoktur`,
        `D) ${kw1}, ${kw2} üzerinde değişken etkilere sahiptir`,
      ],
    ];

    // Doğru cevap-açıklama kalıpları
    const correctAnswerTemplates = [
      (kw1, kw2, kw3, topic) => ({
        answer: `D) ${kw1} ve ${kw2} tamamlayıcı kavramlardır`,
        explanation: `"${topic}" alanında, ${kw1} ve ${kw2} genellikle tamamlayıcı kavramlar olarak düşünülür. ${kw1} daha çok ${kw3} odaklıyken, ${kw2} ise sistemin farklı yönlerine odaklanır. Bu iki kavram birlikte ele alındığında daha kapsamlı bir yaklaşım sağlar.`,
      }),
      (kw1, kw2, kw3, topic) => ({
        answer: `B) ${kw1}, sistem performansını doğrudan etkiler`,
        explanation: `${topic} bağlamında, ${kw1} kavramı sistem performansını doğrudan etkiler çünkü ${kw2} ve ${kw3} ile yakından ilişkilidir. Bu kavram, optimal sistem kaynak kullanımı sağlar ve verimliliği artırır.`,
      }),
      (kw1, kw2, kw3, topic) => ({
        answer: `B) ${kw1}, ${kw2}'nin etkinliğini artırır`,
        explanation: `${topic} alanında, ${kw1} genellikle ${kw2}'nin etkinliğini artırır. Bu etki, ${kw3} süreçlerini optimize ederek gerçekleşir ve sistemin genel performansını iyileştirir.`,
      }),
    ];

    // Her bir alt konu için bir soru oluştur
    topicsToUse.forEach((topic, index) => {
      // Normalleştirilmiş konu adı
      const normalizedTopic = topic.replace(/-/g, ' ').replace(/_/g, ' ');

      // Kullanılacak anahtar kelimeler (her soru için farklı)
      const kw1 = topKeywords[index % topKeywords.length];
      const kw2 = topKeywords[(index + 1) % topKeywords.length];
      const kw3 = topKeywords[(index + 2) % topKeywords.length];

      // Soru şablonu seç
      const questionTemplate =
        questionTemplates[index % questionTemplates.length];

      // Seçenek şablonu seç
      const optionTemplate = optionTemplates[index % optionTemplates.length];

      // Doğru cevap ve açıklama şablonu seç
      const correctTemplate =
        correctAnswerTemplates[index % correctAnswerTemplates.length];

      // Doğru cevap ve açıklama oluştur
      const { answer, explanation } = correctTemplate(
        kw1,
        kw2,
        kw3,
        normalizedTopic,
      );

      // Soru metni oluştur
      const questionText = questionTemplate(normalizedTopic, kw1, kw2);

      // Seçenekleri oluştur
      const options = optionTemplate(kw1, kw2, kw3);

      // Konu null/undefined kontrolü
      const safeTopicName = topic || 'Genel Kavramlar';

      questions.push({
        id: `keyword_fallback_${index + 1}_${Date.now()}`,
        questionText,
        options,
        correctAnswer: answer,
        explanation,
        subTopicName: safeTopicName,
        normalizedSubTopicName:
          this.normalizationService.normalizeSubTopicName(safeTopicName),
        difficulty: 'medium', // Türkçe değer yerine İngilizce değer kullan
        questionType: 'multiple_choice',
        cognitiveDomain: 'understanding',
      });
    });

    // Eğer yeterli soru oluşturulmadıysa, genel sorularla tamamla
    if (questions.length < 5) {
      const generalTopics = [
        'Genel Kavramlar',
        'Temel İlkeler',
        'Uygulama Alanları',
        'Geleceğe Yönelik Yaklaşımlar',
      ];

      // Eksik sorular için genel konular üret
      for (let i = questions.length; i < 5; i++) {
        const topicIndex = i % generalTopics.length;
        const kw1 = topKeywords[i % topKeywords.length];
        const kw2 = topKeywords[(i + 3) % topKeywords.length];
        const kw3 = topKeywords[(i + 5) % topKeywords.length];

        // Farklı bir soru şablonu kullan
        const qIndex = (i + topicsToUse.length) % questionTemplates.length;
        const questionText = questionTemplates[qIndex](
          generalTopics[topicIndex],
          kw1,
          kw2,
        );

        // Farklı bir seçenek şablonu kullan
        const oIndex = (i + topicsToUse.length) % optionTemplates.length;
        const options = optionTemplates[oIndex](kw1, kw2, kw3);

        // Farklı bir doğru cevap şablonu kullan
        const cIndex = (i + topicsToUse.length) % correctAnswerTemplates.length;
        const { answer, explanation } = correctAnswerTemplates[cIndex](
          kw1,
          kw2,
          kw3,
          generalTopics[topicIndex],
        );

        // Konu adı
        const safeTopicName = generalTopics[topicIndex];

        questions.push({
          id: `keyword_fallback_general_${i + 1}_${Date.now()}`,
          questionText,
          options,
          correctAnswer: answer,
          explanation,
          subTopicName: safeTopicName,
          normalizedSubTopicName:
            this.normalizationService.normalizeSubTopicName(safeTopicName),
          difficulty: 'medium', // Türkçe değer yerine İngilizce değer kullan
          questionType: 'multiple_choice',
          cognitiveDomain: 'analyzing',
        });
      }
    }

    return questions;
  }

  /**
   * QuizResponseSchema ile daha sıkı doğrulama yapar
   * @param data Doğrulanacak veri
   * @param traceId Trace ID
   */
  private tryQuizResponseValidation(data: any, traceId: string): any {
    try {
      // Geçerli bir obje mi kontrol et
      if (!data || typeof data !== 'object') {
        return null;
      }
      
      // QuizResponseSchema ile doğrulama (daha sıkı şema)
      const response = data.questions ? data : { questions: data };
      const result = QuizResponseSchema.safeParse(response);
      
      if (result.success) {
        console.log(
          `[QUIZ_DEBUG] [${traceId}] Sıkı şema doğrulaması (QuizResponseSchema) başarılı!`,
        );
        return result.data;
      }
      
      return null;
    } catch (e) {
      console.log(
        `[QUIZ_DEBUG] [${traceId}] Sıkı şema doğrulaması başarısız:`,
        e.message,
      );
      return null;
    }
  }

  /**
   * Zod şeması ile quiz yanıtını doğrular
   * @param parsedJson Parse edilmiş JSON
   * @param metadata Loglama için metadata
   * @param rawResponse Ham yanıt
   */
  validateQuizResponseSchema(
    parsedJson: any,
    metadata: QuizMetadata,
    rawResponse: string,
  ) {
    const { traceId } = metadata;

    // DETAYLI LOGLAMA: Validasyon başlangıcı
    console.log(
      `[QUIZ_DEBUG] [${traceId}] Quiz yanıtı şema doğrulaması başlatılıyor`,
    );
    console.log(
      `[QUIZ_DEBUG] [${traceId}] Doğrulanacak veri türü:`,
      typeof parsedJson,
    );
    console.log(
      `[QUIZ_DEBUG] [${traceId}] Üst düzey anahtarlar:`,
      Object.keys(parsedJson || {}),
    );

    try {
      // Zod şeması ile validasyon
      console.log(
        `[QUIZ_DEBUG] [${traceId}] Zod şeması ile doğrulama yapılıyor...`,
      );
      
      // Önce QuizResponseSchema ile doğrulamayı deneyelim (daha katı şema)
      const fullValidationResult = this.tryQuizResponseValidation(parsedJson, traceId);
      if (fullValidationResult) {
        return fullValidationResult;
      }
      
      // Alternatif olarak, birleşik şema ile deneyelim
      const validationResult = QuizGenerationResponseSchema.safeParse(parsedJson);

      if (validationResult.success) {
        // Validasyon başarılı - veriyi döndür
        console.log(
          `[QUIZ_DEBUG] [${traceId}] Şema doğrulaması başarılı! Veri yapısı geçerli.`,
        );

        // Veri yapısına göre işle
        if (Array.isArray(validationResult.data)) {
          console.log(
            `[QUIZ_DEBUG] [${traceId}] Doğrulanan veri bir dizi, ${validationResult.data.length} soru içeriyor.`,
          );
          return { questions: validationResult.data };
        }
        console.log(
          `[QUIZ_DEBUG] [${traceId}] Doğrulanan veri bir obje, ${validationResult.data.questions?.length || 0} soru içeriyor.`,
        );
        return validationResult.data;
      }

      // Validasyon başarısız - hata detaylarını inceleyip alternatif çözümler dene
      const validationError = validationResult.error;
      console.error(
        `[QUIZ_DEBUG] [${traceId}] Şema doğrulama HATASI:`,
        validationError.message,
      );
      console.error(
        `[QUIZ_DEBUG] [${traceId}] Hata detayları:`,
        JSON.stringify(validationError.errors, null, 2),
      );
      
      this.logger.error(
        `[${traceId}] AI yanıtı Zod doğrulamasından geçemedi: ${validationError.message}`,
        'QuizValidationService.validateQuizResponseSchema',
        undefined,
        validationError,
      );

      // Yanıt içinde questions yoksa (ama doğrudan soru listesi içerik olabilir)
      if (!parsedJson.questions) {
        console.log(
          `[QUIZ_DEBUG] [${traceId}] 'questions' alanı bulunamadı, alternatif yapılar aranıyor.`,
        );
        this.logger.debug(
          `[${traceId}] Yanıtta 'questions' alanı bulunamadı, alternatif yapılar aranıyor`,
          'QuizValidationService.validateQuizResponseSchema',
        );

        // ID, questionText ve options içeren nesneleri bul
        const foundQuestions: Record<string, any>[] = [];

        // Gelen objede soru benzeri alanlar var mı kontrol et
        const keys = Object.keys(parsedJson);
        const containsQuestionProperties = keys.some(
          (key) =>
            typeof parsedJson[key] === 'object' &&
            parsedJson[key] &&
            parsedJson[key].questionText &&
            Array.isArray(parsedJson[key].options),
        );

        if (containsQuestionProperties) {
          console.log(
            `[QUIZ_DEBUG] [${traceId}] JSON içinde soru benzeri nesneler tespit edildi, bunları çıkarmaya çalışılacak.`,
          );
          this.logger.debug(
            `[${traceId}] JSON içinde soru benzeri nesneler tespit edildi, bunları işlemeye çalışılacak`,
            'QuizValidationService.validateQuizResponseSchema',
          );

          for (const key of keys) {
            const obj = parsedJson[key];
            if (
              typeof obj === 'object' &&
              obj &&
              obj.questionText &&
              Array.isArray(obj.options)
            ) {
              foundQuestions.push(obj);
              console.log(
                `[QUIZ_DEBUG] [${traceId}] '${key}' anahtarı altında bir soru bulundu:`,
                obj.questionText.substring(0, 50),
              );
            }
          }
        }

        // Eğer hala soru bulunamadıysa, içiçe yapıları kontrol et
        if (foundQuestions.length === 0) {
          console.log(
            `[QUIZ_DEBUG] [${traceId}] Birinci aşamada soru bulunamadı, iç içe yapılarda soru aranıyor...`,
          );
          for (const key of Object.keys(parsedJson)) {
            const value = parsedJson[key];

            // İç içe yapılarda soru dizisi olabilir
            if (Array.isArray(value) && value.length > 0) {
              console.log(
                `[QUIZ_DEBUG] [${traceId}] '${key}' anahtarı altında bir dizi bulundu, içeriği inceleniyor. Eleman sayısı: ${value.length}`,
              );

              const likelyQuestions = value.filter(
                (item) =>
                  typeof item === 'object' &&
                  item &&
                  item.questionText &&
                  Array.isArray(item.options),
              );

              if (likelyQuestions.length > 0) {
                console.log(
                  `[QUIZ_DEBUG] [${traceId}] '${key}' alanı altında ${likelyQuestions.length} adet soru bulundu!`,
                );
                this.logger.debug(
                  `[${traceId}] '${key}' alanı altında ${likelyQuestions.length} adet soru bulundu`,
                  'QuizValidationService.validateQuizResponseSchema',
                );
                foundQuestions.push(
                  ...(likelyQuestions as Record<string, any>[]),
                );
              }
            }
          }
        }

        // Son bir deneme: metinde JSON bloklarını bul
        if (foundQuestions.length === 0 && rawResponse) {
          console.log(
            `[QUIZ_DEBUG] [${traceId}] Standart yapıda sorular bulunamadı, ham yanıttan sorular çıkarılmaya çalışılacak...`,
          );
          this.logger.debug(
            `[${traceId}] Standart yapıda sorular bulunamadı, ham yanıttan sorular çıkarılmaya çalışılacak`,
            'QuizValidationService.validateQuizResponseSchema',
          );

          const extractedQuestions = this.extractQuestionsFromText(rawResponse);
          if (extractedQuestions && extractedQuestions.length > 0) {
            // QuizQuestion tipindeki soruları foundQuestions dizisine ekle
            extractedQuestions.forEach((question) => {
              foundQuestions.push(question as unknown as Record<string, any>);
            });
            console.log(
              `[QUIZ_DEBUG] [${traceId}] Ham yanıttan ${extractedQuestions.length} adet soru çıkarıldı!`,
            );
            this.logger.info(
              `[${traceId}] Ham yanıttan ${extractedQuestions.length} adet soru çıkarıldı`,
              'QuizValidationService.validateQuizResponseSchema',
            );
          }
        }

        if (foundQuestions.length > 0) {
          console.log(
            `[QUIZ_DEBUG] [${traceId}] Alternatif yöntemlerle ${foundQuestions.length} adet soru bulundu. İşlemeye devam edilecek.`,
          );
          return { questions: foundQuestions };
        }

        console.error(
          `[QUIZ_DEBUG] [${traceId}] KRİTİK HATA: Tüm yöntemlerle arama yapılmasına rağmen hiç soru bulunamadı!`,
        );
        console.error(
          `[QUIZ_DEBUG] [${traceId}] Ham yanıt (ilk 1000 karakter):`,
          rawResponse.substring(0, 1000),
        );

        this.logger.error(
          `[${traceId}] Quiz AI yanıtında 'questions' dizisi bulunamadı`,
          'QuizValidationService.validateQuizResponseSchema',
          __filename,
          undefined,
          undefined,
          { parsedJsonKeys: Object.keys(parsedJson) },
        );

        // Örnek içerik tespit edildi mi kontrol et
        const containsExamples = this.detectExampleContent(rawResponse);
        if (containsExamples) {
          console.error(
            `[QUIZ_DEBUG] [${traceId}] UYARI: AI yanıtı şablondaki örnekleri içeriyor olabilir!`,
          );
        }

        // questions bulunamadıysa hata fırlat
        throw new BadRequestException({
          code: 'MISSING_QUESTIONS_FIELD',
          message: containsExamples
            ? 'AI yanıtı şablondaki örnekleri yanıt olarak döndürdü'
            : 'AI yanıtında "questions" alanı bulunamadı',
          details: {
            traceId,
            availableKeys: Object.keys(parsedJson),
            expectedKey: 'questions',
            rawResponsePreview: rawResponse.substring(0, 100) + '...',
            containsExampleContent: containsExamples,
          },
        });
      }
    } catch (validationError) {
      this.logger.error(
        `[${traceId}] Quiz AI yanıtı şema validasyonundan geçemedi: ${validationError.message}`,
        'QuizValidationService.validateQuizResponseSchema',
        undefined,
        validationError,
      );

      // Örnek içerik tespit edildi mi kontrol et
      const containsExamples = this.detectExampleContent(rawResponse);

      // Log için debug bilgisi (ayrı bir log kaydı olarak)
      this.logger.debug(
        `[${traceId}] Hatalı yanıt detayları: ${rawResponse?.substring(0, 1000)}, Yapı: ${JSON.stringify(Object.keys(parsedJson || {}))}, Örnek içeriği: ${containsExamples}`,
        'QuizValidationService.validateQuizResponseSchema',
      );

      // Hata fırlat
      throw new BadRequestException({
        code: 'SCHEMA_VALIDATION_ERROR',
        message: containsExamples
          ? 'AI yanıtında örnek içerik tespit edildi ve şema doğrulaması başarısız oldu'
          : 'AI yanıtı şema validasyonundan geçemedi',
        details: {
          traceId,
          validationError: validationError.message,
          rawResponsePreview: rawResponse.substring(0, 200) + '...',
          containsExamples,
        },
      });
    }
  }

  /**
   * Türkçe zorluk seviyelerini İngilizce karşılıklarına çevirir
   * @param difficulty Türkçe zorluk seviyesi
   * @returns İngilizce zorluk seviyesi
   */
  private translateDifficultyToEnglish(difficulty: string): string {
    if (!difficulty) return 'medium';

    const lowerDifficulty = difficulty.toLowerCase().trim();

    switch (lowerDifficulty) {
      case 'kolay':
        return 'easy';
      case 'orta':
        return 'medium';
      case 'zor':
        return 'hard';
      case 'karışık':
      case 'karısık':
      case 'karisik':
      case 'karma':
        return 'mixed';
      default:
        // Halihazırda İngilizce değer mi kontrol et
        if (['easy', 'medium', 'hard', 'mixed'].includes(lowerDifficulty)) {
          return lowerDifficulty;
        }
        // Varsayılan değeri döndür
        return 'medium';
    }
  }

  /**
   * Doğrulanmış JSON'dan quiz soruları oluşturur
   * @param validatedData Doğrulanmış veri
   * @param metadata Loglama için metadata
   */
  transformAndValidateQuestions(
    validatedData: any,
    metadata: QuizMetadata,
  ): QuizQuestion[] {
    const { traceId } = metadata;

    // DETAYLI LOGLAMA: Dönüştürme başlangıcı
    console.log(
      `[QUIZ_DEBUG] [${traceId}] Soruları son işleme ve doğrulama aşaması başlatılıyor`,
    );
    console.log(
      `[QUIZ_DEBUG] [${traceId}] Doğrulanacak veri tipi:`,
      typeof validatedData,
    );

    // validatedData tipine göre kontroller
    if (Array.isArray(validatedData)) {
      console.log(
        `[QUIZ_DEBUG] [${traceId}] Doğrulanacak veri bir dizi, eleman sayısı: ${validatedData.length}`,
      );
    } else if (validatedData && typeof validatedData === 'object') {
      console.log(
        `[QUIZ_DEBUG] [${traceId}] Doğrulanacak veri bir nesne, anahtarlar:`,
        Object.keys(validatedData),
      );
      if (validatedData.questions) {
        console.log(
          `[QUIZ_DEBUG] [${traceId}] 'questions' alanı mevcut, eleman sayısı: ${Array.isArray(validatedData.questions) ? validatedData.questions.length : 'array değil'}`,
        );
      }
    }

    // Soru dizisini al
    const questionsArray = Array.isArray(validatedData)
      ? validatedData
      : validatedData?.questions;

    // Soru dizisi kontrolü
    if (!validatedData?.questions || !Array.isArray(validatedData.questions)) {
      this.logger.error('Doğrulanmış veride soru dizisi bulunamadı', 'QuizValidationService');
      throw new BadRequestException('Doğrulanmış veride soru dizisi bulunamadı');
    }
    
    // Boş soru dizisi kontrolü
    if (validatedData.questions.length === 0) {
      this.logger.error('AI yanıtı boş soru dizisi döndürdü - Geçersiz yanıt', 'QuizValidationService');
      throw new BadRequestException(
        'AI modeli belirlenen konular için soru oluşturamadı. Bu durum geçici olabilir. Lütfen farklı alt konularla tekrar deneyin, konu sayısını azaltın veya birkaç dakika sonra tekrar deneyin.'
      );
    }

    if (
      !questionsArray ||
      !Array.isArray(questionsArray) ||
      questionsArray.length === 0
    ) {
      console.error(
        `[QUIZ_DEBUG] [${traceId}] KRİTİK HATA: Geçerli 'questions' dizisi bulunamadı!`,
      );
      console.error(
        `[QUIZ_DEBUG] [${traceId}] Alınan veri:`,
        JSON.stringify(validatedData)?.substring(0, 1000),
      );

      this.logger.error(
        `[${traceId}] Validasyon sonrası 'questions' array bulunamadı. Alınan veri: ${JSON.stringify(validatedData)?.substring(0, 500)}`,
        'QuizValidationService.transformAndValidateQuestions',
      );

      // Hata fırlat
      throw new BadRequestException({
        code: 'INVALID_QUESTIONS_FORMAT',
        message: 'Doğrulanmış veride soru dizisi bulunamadı',
        details: {
          traceId,
          receivedStructure:
            JSON.stringify(validatedData).substring(0, 200) + '...',
        },
      });
    }

    // İstenen soru sayısını kontrol et
    const requestedCount = metadata.questionCount || 5;
    console.log(
      `[QUIZ_DEBUG] [${traceId}] İşlenecek soru sayısı: ${questionsArray.length}, istenen: ${requestedCount}`,
    );

    // İlk soru örneğini logla
    if (questionsArray.length > 0) {
      console.log(
        `[QUIZ_DEBUG] [${traceId}] İlk soru örneği:`,
        JSON.stringify(questionsArray[0], null, 2),
      );
    }

    // DETAYLI LOGLAMA: İşlenecek soru sayısının istenen ile karşılaştırması
    if (questionsArray.length !== requestedCount) {
      const message =
        questionsArray.length < requestedCount
          ? `UYARI: İstenen soru sayısı (${requestedCount}) karşılanamadı! Sadece ${questionsArray.length} soru bulundu.`
          : `BİLGİ: İstenen soru sayısından (${requestedCount}) daha fazla (${questionsArray.length}) soru bulundu.`;

      console.warn(`[QUIZ_DEBUG] [${traceId}] ${message}`);

      this.logger.warn(
        `[${traceId}] ${message}`,
        'QuizValidationService.transformAndValidateQuestions',
      );
    }

    // Soru validasyonu
    const validQuestions: QuizQuestion[] = [];
    const invalidQuestions: Array<{ index: number; error: string }> = [];

    // Her soruyu doğrula ve dönüştür
    for (let i = 0; i < questionsArray.length; i++) {
      const q_input = questionsArray[i];

      try {
        console.log(
          `[QUIZ_DEBUG] [${traceId}] #${i + 1} no'lu soru işleniyor. ID: ${q_input.id || 'tanımsız'}`,
        );

        // Alt konu adını al
        let subTopicNameFromInput: string;

        // Alt konu adını farklı formatlarda kontrol et
        if (typeof q_input.subTopicName === 'string' && q_input.subTopicName) {
          subTopicNameFromInput = q_input.subTopicName;
          console.log(
            `[QUIZ_DEBUG] [${traceId}] #${i + 1} - subTopicName alanı bulundu: ${subTopicNameFromInput}`,
          );
        } else if (typeof q_input.subTopic === 'string' && q_input.subTopic) {
          subTopicNameFromInput = q_input.subTopic;
          console.log(
            `[QUIZ_DEBUG] [${traceId}] #${i + 1} - subTopic alanı bulundu: ${subTopicNameFromInput}`,
          );
        } else if (
          typeof q_input.subTopic === 'object' &&
          q_input.subTopic !== null
        ) {
          subTopicNameFromInput =
            q_input.subTopic.subTopicName ||
            q_input.subTopic.name ||
            'Bilinmeyen Konu';
          console.log(
            `[QUIZ_DEBUG] [${traceId}] #${i + 1} - subTopic nesne olarak bulundu: ${subTopicNameFromInput}`,
          );
        } else if (typeof q_input.topic === 'string' && q_input.topic) {
          subTopicNameFromInput = q_input.topic;
          console.log(
            `[QUIZ_DEBUG] [${traceId}] #${i + 1} - topic alanı bulundu: ${subTopicNameFromInput}`,
          );
        } else {
          // Varsayılan alt konu adı
          subTopicNameFromInput = 'Bilinmeyen Konu';
          console.warn(
            `[QUIZ_DEBUG] [${traceId}] #${i + 1} - UYARI: Alt konu bilgisi bulunamadı! Varsayılan kullanılıyor: ${subTopicNameFromInput}`,
          );
        }

        // Alt konu adını normalize et
        let normalizedSubTopicName: string;
        try {
          normalizedSubTopicName =
            this.normalizationService.normalizeSubTopicName(
              subTopicNameFromInput,
            );
          console.log(
            `[QUIZ_DEBUG] [${traceId}] #${i + 1} - Normalize edilmiş alt konu: ${normalizedSubTopicName}`,
          );
        } catch (normError) {
          console.warn(
            `[QUIZ_DEBUG] [${traceId}] #${i + 1} - UYARI: Alt konu normalizasyonu hatası: ${normError.message}`,
          );
          normalizedSubTopicName = subTopicNameFromInput
            .toLowerCase()
            .replace(/\s+/g, '_');
        }

        // Zorluk seviyesini kontrol et
        const translatedDifficulty = this.translateDifficultyToEnglish(
          q_input.difficulty || 'medium',
        );
        console.log(
          `[QUIZ_DEBUG] [${traceId}] #${i + 1} - Zorluk seviyesi: orijinal="${q_input.difficulty || 'tanımsız'}", çevrilen="${translatedDifficulty}"`,
        );

        // QuizQuestion nesnesi oluştur
        const questionData = {
          id: q_input.id || `q_${Date.now()}_${i}`,
          questionText:
            q_input.questionText || q_input.question || 'Soru metni eksik',
          options:
            q_input.options || ['A', 'B', 'C', 'D'].map((o) => `Seçenek ${o}`),
          correctAnswer:
            q_input.correctAnswer ||
            q_input.correct ||
            q_input.answer ||
            'Cevap eksik',
          explanation: q_input.explanation || q_input.reason || 'Açıklama yok',
          subTopicName: subTopicNameFromInput,
          normalizedSubTopicName: normalizedSubTopicName,
          difficulty: translatedDifficulty,
          questionType: q_input.questionType || 'multiple_choice',
          cognitiveDomain: q_input.cognitiveDomain || 'understanding',
        };

        // Soru bilgilerini logla
        console.log(`[QUIZ_DEBUG] [${traceId}] #${i + 1} - Soru oluşturuldu:`, {
          id: questionData.id,
          questionText: questionData.questionText?.substring(0, 50) + '...',
          optionsCount: questionData.options?.length || 0,
          correctAnswer: questionData.correctAnswer,
          subTopic: questionData.subTopicName,
          normalized: questionData.normalizedSubTopicName,
          difficulty: questionData.difficulty,
        });

        // Zod şeması ile doğrula
        QuizQuestionSchema.parse(questionData);
        validQuestions.push(questionData as QuizQuestion);
        console.log(
          `[QUIZ_DEBUG] [${traceId}] #${i + 1} - Soru validasyonu başarılı, eklendi`,
        );
      } catch (questionValidationError) {
        // Hata kayıtları
        console.error(
          `[QUIZ_DEBUG] [${traceId}] #${i + 1} - HATA: Soru validasyonu başarısız: ${questionValidationError.message}`,
        );
        console.error(
          `[QUIZ_DEBUG] [${traceId}] #${i + 1} - Hatalı soru verisi:`,
          JSON.stringify(q_input, null, 2),
        );

        this.logger.warn(
          `[${traceId}] Soru validasyon hatası (ID: ${q_input.id || `q_${i}`}): ${questionValidationError.message}`,
          'QuizValidationService.transformAndValidateQuestions',
        );

        // Hatalı soruları kaydet
        invalidQuestions.push({
          index: i,
          error:
            questionValidationError instanceof Error
              ? questionValidationError.message
              : String(questionValidationError),
        });
      }
    }

    // DETAYLI LOGLAMA: Sonuç özeti
    console.log(
      `[QUIZ_DEBUG] [${traceId}] Soru doğrulama tamamlandı. Sonuç: ${validQuestions.length} geçerli, ${invalidQuestions.length} geçersiz soru.`,
    );

    if (invalidQuestions.length > 0) {
      console.log(
        `[QUIZ_DEBUG] [${traceId}] Geçersiz soruların indeksleri:`,
        invalidQuestions.map((q) => q.index).join(', '),
      );
    }

    // İstenen soru sayısı karşılanmadı mı uyarısı
    if (validQuestions.length < requestedCount) {
      console.warn(
        `[QUIZ_DEBUG] [${traceId}] UYARI: İstenen soru sayısı (${requestedCount}) karşılanamadı! Sadece ${validQuestions.length} soru üretilebildi.`,
      );

      this.logger.warn(
        `[${traceId}] İstenen soru sayısı (${requestedCount}) karşılanamadı. Sadece ${validQuestions.length} soru üretilebildi.`,
        'QuizValidationService.transformAndValidateQuestions',
      );
    }

    // Hiç geçerli soru yoksa hata fırlat
    if (validQuestions.length === 0) {
      console.error(
        `[QUIZ_DEBUG] [${traceId}] KRİTİK HATA: Hiç geçerli soru oluşturulamadı!`,
      );

      this.logger.error(
        `[${traceId}] Hiç geçerli soru oluşturulamadı.`,
        'QuizValidationService.transformAndValidateQuestions',
      );

      throw new BadRequestException({
        code: 'NO_VALID_QUESTIONS',
        message: 'Hiç geçerli soru oluşturulamadı',
        details: {
          traceId,
          invalidQuestionsCount: invalidQuestions.length,
          errors: invalidQuestions.slice(0, 5), // İlk 5 hatayı göster
          totalQuestionsInResponse: questionsArray.length,
        },
      });
    }

    // Geçerli soruları döndür
    return validQuestions;
  }
}
