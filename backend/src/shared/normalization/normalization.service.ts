/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable } from '@nestjs/common';
import { CreateLearningTargetDto } from '../../learning-targets/dto/create-learning-target.dto';
import { UpdateLearningTargetDto } from '../../learning-targets/dto/update-learning-target.dto';
import { LoggerService } from '../../common/services/logger.service';
import { FlowTrackerService } from '../../common/services/flow-tracker.service';
import { LogMethod } from '../../common/decorators/log-method.decorator';

/**
 * Veri normalleştirme servisi
 * Bu servis, uygulamada kullanılan verilerin standardizasyonunu sağlar.
 */
@Injectable()
export class NormalizationService {
  constructor(
    private readonly logger: LoggerService,
    private readonly flowTracker: FlowTrackerService,
  ) {
    this.logger.info(
      'NormalizationService başlatıldı',
      'NormalizationService.constructor',
      __filename,
      17,
    );
  }

  /**
   * Normalizes a subtopic name for consistent comparison and storage
   * PRD 6.7'ye göre: küçük harf, trim, ardışık boşlukları teke indirme, temel noktalama işaretlerini kaldırma
   * @param name Alt konu adı
   * @param convertTurkishChars Türkçe karakterleri Latin karşılıklarına çevirmek için (opsiyonel)
   */
  normalizeSubTopicName(name: unknown, convertTurkishChars = false): string {
    // Tip kontrolü ekle
    if (typeof name !== 'string') {
      this.logger.warn(
        `Geçersiz alt konu adı türü: ${typeof name}. String bekleniyor.`,
        'NormalizationService.normalizeSubTopicName',
        __filename,
      );
      
      // String olmayan değeri güvenli şekilde stringe dönüştür
      if (name === null || name === undefined) {
        return 'bilinmeyen_konu';
      }
      
      try {
        return String(name)
          .toLowerCase()
          .trim()
          .replace(/[\s-]+/g, '_')
          .replace(/[.,;:!?()"']/g, '')
          .replace(/[^a-z0-9_öçşığü]/g, '')
          .replace(/_+/g, '_');
      } catch (error) {
        return 'bilinmeyen_konu';
      }
    }

    if (!name) return '';

    let normalized = name
      .toLowerCase() // Küçük harfe çevir
      .trim() // Başta ve sonda boşlukları temizle
      .replace(/[\s-]+/g, '_') // Boşlukları ve tireyi alt çizgi ile değiştir
      .replace(/[.,;:!?()"']/g, '') // Temel noktalama işaretlerini kaldır
      .replace(/[^a-z0-9_öçşığü]/g, '') // Latin alfabesi ve Türkçe karakterler dışındakileri kaldır
      .replace(/_+/g, '_'); // Ardışık alt çizgileri teke indir

    // Türkçe karakterleri çevirme (opsiyonel)
    if (convertTurkishChars) {
      normalized = normalized
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u');
    }

    return normalized;
  }

  /**
   * Calculates similarity between two normalized topic names
   * Used to identify duplicates or near-duplicates
   */
  calculateSimilarity(name1: string, name2: string): number {
    const longer = name1.length > name2.length ? name1 : name2;
    const shorter = name1.length > name2.length ? name2 : name1;

    if (longer.length === 0) {
      return 1.0;
    }

    return (
      (longer.length - this.levenshteinDistance(longer, shorter)) /
      longer.length
    );
  }

  /**
   * Removes duplicates from a list of topics based on normalized names
   */
  removeDuplicateTopics(
    topics: { subTopicName: string; normalizedSubTopicName: string }[],
  ): {
    subTopicName: string;
    normalizedSubTopicName: string;
  }[] {
    const uniqueTopics = new Map<
      string,
      { subTopicName: string; normalizedSubTopicName: string }
    >();

    // First pass: exact matches
    for (const topic of topics) {
      if (!uniqueTopics.has(topic.normalizedSubTopicName)) {
        uniqueTopics.set(topic.normalizedSubTopicName, topic);
      }
    }

    // Second pass: similar topics (more than 80% similar)
    const uniqueTopicsList = Array.from(uniqueTopics.values());
    for (let i = 0; i < uniqueTopicsList.length; i++) {
      for (let j = i + 1; j < uniqueTopicsList.length; j++) {
        const similarity = this.calculateSimilarity(
          uniqueTopicsList[i].normalizedSubTopicName,
          uniqueTopicsList[j].normalizedSubTopicName,
        );

        if (similarity > 0.8) {
          // Keep the longer name and remove the shorter one
          if (
            uniqueTopicsList[i].subTopicName.length <
            uniqueTopicsList[j].subTopicName.length
          ) {
            uniqueTopics.delete(uniqueTopicsList[i].normalizedSubTopicName);
            uniqueTopicsList.splice(i, 1);
            i--;
            break;
          } else {
            uniqueTopics.delete(uniqueTopicsList[j].normalizedSubTopicName);
            uniqueTopicsList.splice(j, 1);
            j--;
          }
        }
      }
    }

    return Array.from(uniqueTopics.values());
  }

  /**
   * Levenshtein distance calculation
   * Used by the similarity function
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const track = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) {
      track[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      track[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1, // deletion
          track[j - 1][i] + 1, // insertion
          track[j - 1][i - 1] + indicator, // substitution
        );
      }
    }

    return track[str2.length][str1.length];
  }

  /**
   * Normalize data object for learning targets
   */
  normalize<T extends CreateLearningTargetDto | UpdateLearningTargetDto>(
    data: T,
  ): T {
    if (!data) return data;

    return {
      ...data,
      failCount: data.failCount || 0,
      mediumCount: data.mediumCount || 0,
      successCount: data.successCount || 0,
      lastAttemptScorePercent: data.lastAttemptScorePercent || 0,
    };
  }

  /**
   * Metin içeriğini normalleştirir
   * @param text Normalleştirilecek metin
   * @returns Normalleştirilmiş metin
   */
  @LogMethod({ trackParams: true, trackResult: true })
  normalizeText(text: string): string {
    this.flowTracker.trackStep(
      'Metin normalleştiriliyor',
      'NormalizationService',
    );

    if (!text) {
      this.logger.warn(
        'Boş metin normalleştirme isteği',
        'NormalizationService.normalizeText',
        __filename,
        35,
      );
      return '';
    }

    try {
      // Boşlukları temizle
      let normalized = text.trim();

      // Ardışık boşlukları tek boşluğa indir
      normalized = normalized.replace(/\s+/g, ' ');

      // Unicode karakterleri standartlaştır
      normalized = normalized.normalize('NFC');

      this.logger.debug(
        'Metin başarıyla normalleştirildi',
        'NormalizationService.normalizeText',
        __filename,
        50,
        { originalLength: text.length, normalizedLength: normalized.length },
      );

      return normalized;
    } catch (error) {
      this.logger.logError(error, 'NormalizationService.normalizeText', {
        additionalInfo: 'Metin normalleştirilirken hata oluştu',
        text,
      });
      // Hata durumunda orijinal metni dön
      return text;
    }
  }

  /**
   * Kullanıcı girdisi email adresini normalleştirir
   * @param email Normalleştirilecek email adresi
   * @returns Normalleştirilmiş email adresi
   */
  @LogMethod({ trackParams: true, trackResult: true })
  normalizeEmail(email: string): string {
    this.flowTracker.trackStep(
      'Email normalleştiriliyor',
      'NormalizationService',
    );

    if (!email) {
      this.logger.warn(
        'Boş email normalleştirme isteği',
        'NormalizationService.normalizeEmail',
        __filename,
        80,
      );
      return '';
    }

    try {
      // Tüm harfleri küçült
      let normalized = email.toLowerCase().trim();

      // Gmail için nokta (.) karakterlerini temizle (gmail özelinde)
      if (normalized.endsWith('@gmail.com')) {
        const [localPart, domain] = normalized.split('@');
        // Noktaları kaldır
        const cleanLocalPart = localPart.replace(/\./g, '');
        // "+" işaretinden sonrasını kaldır
        const basePart = cleanLocalPart.split('+')[0];
        normalized = `${basePart}@${domain}`;
      }

      this.logger.debug(
        'Email başarıyla normalleştirildi',
        'NormalizationService.normalizeEmail',
        __filename,
        99,
        { original: email, normalized },
      );

      return normalized;
    } catch (error) {
      this.logger.logError(error, 'NormalizationService.normalizeEmail', {
        additionalInfo: 'Email normalleştirilirken hata oluştu',
        email,
      });
      // Hata durumunda orijinal emaili dön
      return email;
    }
  }

  /**
   * Telefon numarasını standart formata getirir
   * @param phoneNumber Normalleştirilecek telefon numarası
   * @returns Normalleştirilmiş telefon numarası (E.164 formatı)
   */
  @LogMethod({ trackParams: true, trackResult: true })
  normalizePhoneNumber(phoneNumber: string): string {
    this.flowTracker.trackStep(
      'Telefon numarası normalleştiriliyor',
      'NormalizationService',
    );

    if (!phoneNumber) {
      this.logger.warn(
        'Boş telefon numarası normalleştirme isteği',
        'NormalizationService.normalizePhoneNumber',
        __filename,
        129,
      );
      return '';
    }

    try {
      // Sadece rakamları al
      let normalized = phoneNumber.replace(/\D/g, '');

      // Türkiye numarası formatına çevir
      if (normalized.length === 10 && normalized.startsWith('5')) {
        // 5XX... formatında ise Türkiye numarası, +90 ekle
        normalized = `+90${normalized}`;
      } else if (normalized.length === 11 && normalized.startsWith('05')) {
        // 05XX... formatında ise, 0'ı çıkar ve +90 ekle
        normalized = `+90${normalized.substring(1)}`;
      } else if (normalized.length === 10 && !normalized.startsWith('5')) {
        // Diğer 10 haneli numaralar için sadece + ekle
        normalized = `+${normalized}`;
      } else if (normalized.length > 10) {
        // Uzun numaralar için + ekle
        normalized = `+${normalized}`;
      }

      this.logger.debug(
        'Telefon numarası başarıyla normalleştirildi',
        'NormalizationService.normalizePhoneNumber',
        __filename,
        154,
        { original: phoneNumber, normalized },
      );

      return normalized;
    } catch (error) {
      this.logger.logError(error, 'NormalizationService.normalizePhoneNumber', {
        additionalInfo: 'Telefon numarası normalleştirilirken hata oluştu',
        phoneNumber,
      });
      // Hata durumunda orijinal numarayı dön
      return phoneNumber;
    }
  }
}
