import { LoggerService } from '../../common/services/logger.service';

/**
 * Konu tespiti sonuç arayüzü
 */
export interface TopicDetectionResult {
  topics: {
    subTopicName: string;
    normalizedSubTopicName: string;
  }[];
}

// Log kaydı
try {
  const logger = LoggerService.getInstance();
  logger.debug(
    'Topic Detection interface yüklendi',
    'topic-detection.interface',
    __filename,
    15,
  );
} catch (error) {
  console.error('Interface yüklenirken hata:', error);
}
