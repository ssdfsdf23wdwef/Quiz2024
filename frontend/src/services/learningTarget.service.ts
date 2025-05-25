import apiService from "./api.service";
import { 
  LearningTarget, 
  TopicDetectionResult, 
  LearningTargetStatusLiteral 
} from "@/types/learningTarget.type";
import { getLogger, getFlowTracker, trackFlow, mapToTrackerCategory } from "@/lib/logger.utils";
import { LogClass, LogMethod } from "@/decorators/log-method.decorator";
import { FlowCategory } from "@/constants/logging.constants";

// Logger ve flowTracker nesnelerini elde et
const logger = getLogger();
const flowTracker = getFlowTracker();

/**
 * Öğrenme hedefleri servis sınıfı
 * API ile etkileşimleri yönetir
 */
@LogClass('LearningTargetService')
class LearningTargetService {
  // Bir dersin tüm öğrenme hedeflerini getir
  @LogMethod('LearningTargetService', FlowCategory.API)
  async getLearningTargetsByCourse(courseId: string): Promise<LearningTarget[]> {
    flowTracker.markStart(`getLearningTargets_${courseId}`);
    
    try {
      trackFlow(
        `Fetching learning targets by course ID: ${courseId}`,
        "LearningTargetService.getLearningTargetsByCourse",
        FlowCategory.API
      );
      
      flowTracker.trackApiCall(
        `/learning-targets/by-course/${courseId}`,
        'GET',
        'LearningTargetService.getLearningTargetsByCourse',
        { courseId }
      );
      
      const targets = await apiService.get<LearningTarget[]>(
        `/learning-targets/by-course/${courseId}`,
      );
      
      // Başarılı sonuç
      const duration = flowTracker.markEnd(`getLearningTargets_${courseId}`, mapToTrackerCategory(FlowCategory.API), 'LearningTargetService');
      logger.debug(
        `Öğrenme hedefleri getirildi: Kurs=${courseId}, Hedef sayısı=${targets.length}`,
        'LearningTargetService.getLearningTargetsByCourse',
        __filename,
        36,
        { count: targets.length, courseId, duration }
      );
      
      return targets;
    } catch (error) {
      // Hata durumu
      flowTracker.markEnd(`getLearningTargets_${courseId}`, mapToTrackerCategory(FlowCategory.API), 'LearningTargetService');
      trackFlow(
        `Error fetching learning targets for course ${courseId}: ${(error as Error).message}`,
        "LearningTargetService.getLearningTargetsByCourse",
        FlowCategory.API,
        { courseId, error }
      );
      throw error;
    }
  }

  // Bir kurs için öğrenme hedeflerini getirir (eski topicService.getLearningTargets için uyumluluk)
  @LogMethod('LearningTargetService', FlowCategory.API)
  async getLearningTargets(courseId: string): Promise<LearningTarget[]> {
    flowTracker.markStart(`getLearningTargetsCompat_${courseId}`);
    
    try {
      flowTracker.trackStep(
        mapToTrackerCategory(FlowCategory.API), 
        'Uyumluluk metoduyla öğrenme hedefleri getiriliyor', 
        'LearningTargetService.getLearningTargets',
        { courseId }
      );
      
      logger.debug(
        `Eski API uyumluluğu için getLearningTargets çağrılıyor: ${courseId}`,
        'LearningTargetService.getLearningTargets',
        __filename,
        69,
        { courseId }
      );
      
      const targets = await this.getLearningTargetsByCourse(courseId);
      
      // Başarılı sonuç
      const duration = flowTracker.markEnd(`getLearningTargetsCompat_${courseId}`, mapToTrackerCategory(FlowCategory.API), 'LearningTargetService');
      logger.debug(
        `Uyumluluk metodu başarılı: Kurs=${courseId}, Hedef sayısı=${targets.length}`,
        'LearningTargetService.getLearningTargets',
        __filename,
        80,
        { count: targets.length, courseId, duration }
      );
      
      return targets;
    } catch (error) {
      // Hata durumu
      flowTracker.markEnd(`getLearningTargetsCompat_${courseId}`, mapToTrackerCategory(FlowCategory.API), 'LearningTargetService');
      logger.error(
        `Öğrenme hedefleri yüklenirken hata oluştu: ${courseId}`,
        'LearningTargetService.getLearningTargets',
        __filename,
        91,
        { courseId, error }
      );
      throw error;
    }
  }

  // Belirli bir öğrenme hedefini getir
  @LogMethod('LearningTargetService', FlowCategory.API)
  async getLearningTargetById(id: string): Promise<LearningTarget> {
    flowTracker.markStart(`getLearningTarget_${id}`);
    
    try {
      trackFlow(
        `Fetching learning target by ID: ${id}`,
        "LearningTargetService.getLearningTargetById",
        FlowCategory.API
      );
      
      flowTracker.trackApiCall(
        `/learning-targets/${id}`,
        'GET',
        'LearningTargetService.getLearningTargetById',
        { id }
      );
      
      const target = await apiService.get<LearningTarget>(`/learning-targets/${id}`);
      
      // Başarılı sonuç
      const duration = flowTracker.markEnd(`getLearningTarget_${id}`, mapToTrackerCategory(FlowCategory.API), 'LearningTargetService');
      logger.debug(
        `Öğrenme hedefi getirildi: ID=${id}`,
        'LearningTargetService.getLearningTargetById',
        __filename,
        115,
        { 
          id, 
          topic: target.subTopicName,
          status: target.status,
          duration 
        }
      );
      
      return target;
    } catch (error) {
      // Hata durumu
      flowTracker.markEnd(`getLearningTarget_${id}`, mapToTrackerCategory(FlowCategory.API), 'LearningTargetService');
      trackFlow(
        `Error fetching learning target ${id}: ${(error as Error).message}`,
        "LearningTargetService.getLearningTargetById",
        FlowCategory.API,
        { id, error }
      );
      throw error;
    }
  }

  // Belirli bir dersteki öğrenme hedeflerini durum (status) bazında getir
  @LogMethod('LearningTargetService', FlowCategory.API)
  async getLearningTargetsByStatus(
    courseId: string,
  ): Promise<Record<string, LearningTarget[]>> {
    flowTracker.markStart(`getLearningTargetsByStatus_${courseId}`);
    
    try {
      flowTracker.trackApiCall(
        `/learning-targets/by-status/${courseId}`,
        'GET',
        'LearningTargetService.getLearningTargetsByStatus',
        { courseId }
      );
      
      const targetsByStatus = await apiService.get<Record<string, LearningTarget[]>>(
        `/learning-targets/by-status/${courseId}`,
      );
      
      // Hedef sayılarını hesapla
      const counts: Record<string, number> = {};
      Object.keys(targetsByStatus).forEach(status => {
        counts[status] = targetsByStatus[status].length;
      });
      
      // Başarılı sonuç
      const duration = flowTracker.markEnd(`getLearningTargetsByStatus_${courseId}`, mapToTrackerCategory(FlowCategory.API), 'LearningTargetService');
      logger.debug(
        `Durum bazlı öğrenme hedefleri getirildi: Kurs=${courseId}`,
        'LearningTargetService.getLearningTargetsByStatus',
        __filename,
        166,
        { 
          courseId, 
          statusCounts: counts,
          totalCount: Object.values(counts).reduce((a, b) => a + b, 0),
          duration 
        }
      );
      
      return targetsByStatus;
    } catch (error) {
      // Hata durumu
      flowTracker.markEnd(`getLearningTargetsByStatus_${courseId}`, mapToTrackerCategory(FlowCategory.API), 'LearningTargetService');
      logger.error(
        `Durum bazlı öğrenme hedefleri yüklenirken hata oluştu: ${courseId}`,
        'LearningTargetService.getLearningTargetsByStatus',
        __filename,
        182,
        { courseId, error }
      );
      throw error;
    }
  }

  // Doküman metninden konu tespiti yap
  @LogMethod('LearningTargetService', FlowCategory.API)
  async detectTopics(
    documentText: string,
    existingTopics: string[] = [],
  ): Promise<TopicDetectionResult> {
    flowTracker.markStart('detectTopics');
    
    try {
      flowTracker.trackApiCall(
        "/learning-targets/detect-topics",
        'POST',
        'LearningTargetService.detectTopics'
      );
      
      logger.debug(
        `Konu tespiti yapılıyor: ${documentText.length} karakter metin, ${existingTopics.length} mevcut konu`,
        'LearningTargetService.detectTopics',
        __filename,
        205,
        { 
          textLength: documentText.length,
          existingTopicsCount: existingTopics.length,
          existingTopics
        }
      );
      
      const result = await apiService.post<TopicDetectionResult>(
        "/learning-targets/detect-topics",
        {
          documentText,
          existingTopics,
        },
      );
      
      // Başarılı sonuç
      const duration = flowTracker.markEnd('detectTopics', mapToTrackerCategory(FlowCategory.API), 'LearningTargetService');
      logger.info(
        `Konu tespiti tamamlandı: ${result.topics.length} konu tespit edildi`,
        'LearningTargetService.detectTopics',
        __filename,
        225,
        { 
          detectedTopics: result.topics,
          duration 
        }
      );
      
      return result;
    } catch (error) {
      // Hata durumu
      flowTracker.markEnd('detectTopics', mapToTrackerCategory(FlowCategory.API), 'LearningTargetService');
      logger.error(
        'Konu tespiti yapılırken hata oluştu',
        'LearningTargetService.detectTopics',
        __filename,
        239,
        { 
          textLength: documentText.length,
          existingTopicsCount: existingTopics.length,
          error 
        }
      );
      throw error;
    }
  }

  // Çoklu öğrenme hedefi oluştur
  @LogMethod('LearningTargetService', FlowCategory.API)
  async createBatchLearningTargets(
    courseId: string,
    targets: Omit<LearningTarget, "id" | "courseId" | "userId">[],
  ): Promise<LearningTarget[]> {
    flowTracker.markStart(`createBatchTargets_${courseId}`);
    
    try {
      flowTracker.trackApiCall(
        "/learning-targets/batch",
        'POST',
        'LearningTargetService.createBatchLearningTargets',
        { courseId, targetCount: targets.length }
      );
      
      logger.debug(
        `Toplu öğrenme hedefi oluşturuluyor: Kurs=${courseId}, Hedef sayısı=${targets.length}`,
        'LearningTargetService.createBatchLearningTargets',
        __filename,
        267,
        { 
          courseId, 
          count: targets.length,
          topics: targets.map(t => t.subTopicName)
        }
      );
      
      const createdTargets = await apiService.post<LearningTarget[]>("/learning-targets/batch", {
        courseId,
        targets,
      });
      
      // Başarılı sonuç
      const duration = flowTracker.markEnd(`createBatchTargets_${courseId}`, mapToTrackerCategory(FlowCategory.API), 'LearningTargetService');
      logger.info(
        `Toplu öğrenme hedefi oluşturuldu: Kurs=${courseId}, Hedef sayısı=${createdTargets.length}`,
        'LearningTargetService.createBatchLearningTargets',
        __filename,
        284,
        { 
          courseId, 
          count: createdTargets.length,
          duration 
        }
      );
      
      return createdTargets;
    } catch (error) {
      // Hata durumu
      flowTracker.markEnd(`createBatchTargets_${courseId}`, mapToTrackerCategory(FlowCategory.API), 'LearningTargetService');
      logger.error(
        `Toplu öğrenme hedefi oluşturulurken hata oluştu: ${courseId}`,
        'LearningTargetService.createBatchLearningTargets',
        __filename,
        299,
        { 
          courseId, 
          targetCount: targets.length,
          error 
        }
      );
      throw error;
    }
  }

  // Çoklu öğrenme hedefi durumlarını güncelle
  @LogMethod('LearningTargetService', FlowCategory.API)
  async updateMultipleStatuses(
    targetUpdates: Array<{
      id: string;
      status: string;
      lastAttemptScorePercent: number;
    }>,
  ): Promise<LearningTarget[]> {
    flowTracker.markStart('updateMultipleStatuses');
    
    try {
      flowTracker.trackApiCall(
        "/learning-targets/update-multiple-statuses",
        'PUT',
        'LearningTargetService.updateMultipleStatuses',
        { updateCount: targetUpdates.length }
      );
      
      logger.debug(
        `Çoklu hedef durumu güncelleniyor: ${targetUpdates.length} hedef`,
        'LearningTargetService.updateMultipleStatuses',
        __filename,
        329,
        { 
          updateCount: targetUpdates.length,
          targetIds: targetUpdates.map(t => t.id)
        }
      );
      
      const updatedTargets = await apiService.put<LearningTarget[]>(
        "/learning-targets/update-multiple-statuses",
        {
          targetUpdates,
        },
      );
      
      // Başarılı sonuç
      const duration = flowTracker.markEnd('updateMultipleStatuses', mapToTrackerCategory(FlowCategory.API), 'LearningTargetService');
      logger.info(
        `Çoklu hedef durumu güncellendi: ${updatedTargets.length} hedef`,
        'LearningTargetService.updateMultipleStatuses',
        __filename,
        347,
        { 
          count: updatedTargets.length,
          duration 
        }
      );
      
      return updatedTargets;
    } catch (error) {
      // Hata durumu
      flowTracker.markEnd('updateMultipleStatuses', mapToTrackerCategory(FlowCategory.API), 'LearningTargetService');
      logger.error(
        'Çoklu hedef durumu güncellenirken hata oluştu',
        'LearningTargetService.updateMultipleStatuses',
        __filename,
        361,
        { 
          targetCount: targetUpdates.length,
          error 
        }
      );
      throw error;
    }
  }

  // Tek bir öğrenme hedefini güncelle
  @LogMethod('LearningTargetService', FlowCategory.API)
  async updateLearningTarget(
    id: string,
    data: Partial<LearningTarget>,
  ): Promise<LearningTarget> {
    flowTracker.markStart(`updateTarget_${id}`);
    
    try {
      trackFlow(
        `Updating learning target ${id}: ${JSON.stringify(data)}`,
        "LearningTargetService.updateLearningTarget",
        FlowCategory.API
      );
      
      flowTracker.trackApiCall(
        `/learning-targets/${id}`,
        'PUT',
        'LearningTargetService.updateLearningTarget',
        { id, fields: Object.keys(data).length }
      );
      
      logger.debug(
        `Öğrenme hedefi güncelleniyor: ID=${id}`,
        'LearningTargetService.updateLearningTarget',
        __filename,
        387,
        { 
          id, 
          updatedFields: Object.keys(data)
        }
      );
      
      const updatedTarget = await apiService.put<LearningTarget>(`/learning-targets/${id}`, data);
      
      // Başarılı sonuç
      const duration = flowTracker.markEnd(`updateTarget_${id}`, mapToTrackerCategory(FlowCategory.API), 'LearningTargetService');
      logger.info(
        `Öğrenme hedefi güncellendi: ID=${id}`,
        'LearningTargetService.updateLearningTarget',
        __filename,
        401,
        { 
          id,
          topic: updatedTarget.subTopicName,
          status: updatedTarget.status,
          duration 
        }
      );
      
      return updatedTarget;
    } catch (error) {
      // Hata durumu
      flowTracker.markEnd(`updateTarget_${id}`, mapToTrackerCategory(FlowCategory.API), 'LearningTargetService');
      trackFlow(
        `Error updating learning target ${id}: ${(error as Error).message}`,
        "LearningTargetService.updateLearningTarget",
        FlowCategory.API,
        { id, error }
      );
      throw error;
    }
  }

  // Tek bir öğrenme hedefini sil
  @LogMethod('LearningTargetService', FlowCategory.API)
  async deleteLearningTarget(id: string): Promise<{ id: string }> {
    flowTracker.markStart(`deleteTarget_${id}`);
    
    try {
      trackFlow(
        `Deleting learning target ${id}`,
        "LearningTargetService.deleteLearningTarget",
        FlowCategory.API
      );
      
      logger.debug(
        `Öğrenme hedefi siliniyor: ID=${id}`,
        'LearningTargetService.deleteLearningTarget',
        __filename,
        438,
        { id }
      );
      
      const result = await apiService.delete<{ id: string }>(`/learning-targets/${id}`);
      
      // Başarılı sonuç
      const duration = flowTracker.markEnd(`deleteTarget_${id}`, mapToTrackerCategory(FlowCategory.API), 'LearningTargetService');
      logger.info(
        `Öğrenme hedefi silindi: ID=${id}`,
        'LearningTargetService.deleteLearningTarget',
        __filename,
        450,
        { id, duration }
      );
      
      return result;
    } catch (error) {
      // Hata durumu
      flowTracker.markEnd(`deleteTarget_${id}`, mapToTrackerCategory(FlowCategory.API), 'LearningTargetService');
      trackFlow(
        `Error deleting learning target ${id}: ${(error as Error).message}`,
        "LearningTargetService.deleteLearningTarget",
        FlowCategory.API,
        { id, error }
      );
      throw error;
    }
  }

  // ----- topicService'den taşınan fonksiyonlar -----

  /**
   * Öğrenme hedefi bilgileri ve istatistikleri hesaplar
   * @param {LearningTarget[]} targets - Öğrenme hedefleri
   * @returns {Object} Hesaplanan istatistikler
   */
  calculateTargetStats(
    targets: LearningTarget[],
  ): {
    statuses: Record<LearningTargetStatusLiteral, number>;
    statusPercentages: Record<LearningTargetStatusLiteral, number>;
    completionRate: number;
    totalTargets: number;
    uncompletedCount: number;
  } {
    flowTracker.markStart('calculateTargetStats');
    
    logger.debug(
      `Hedef istatistikleri hesaplanıyor: ${targets.length} hedef`,
      'LearningTargetService.calculateTargetStats',
      __filename,
      487,
      { count: targets.length }
    );
    
    const totalTargets = targets.length;

    // Durum sayıları
    const statuses: Record<LearningTargetStatusLiteral, number> = {
      pending: 0,
      failed: 0,
      medium: 0,
      mastered: 0,
    };

    // Her hedefin durumunu say
    targets.forEach((target) => {
      statuses[target.status]++;
    });

    // Durum yüzdeleri
    const statusPercentages: Record<LearningTargetStatusLiteral, number> = {
      pending: 0,
      failed: 0,
      medium: 0,
      mastered: 0,
    };

    // Yüzdeleri hesapla
    if (totalTargets > 0) {
      Object.keys(statuses).forEach((status) => {
        statusPercentages[status as LearningTargetStatusLiteral] =
          (statuses[status as LearningTargetStatusLiteral] / totalTargets) * 100;
      });
    }

    // Tamamlanma oranı (mastered + medium hedeflerin yüzdesi)
    const completedCount = statuses.mastered + statuses.medium;
    const completionRate =
      totalTargets > 0 ? (completedCount / totalTargets) * 100 : 0;

    // Tamamlanmamış hedef sayısı (pending + failed)
    const uncompletedCount = statuses.pending + statuses.failed;
    
    const result = {
      statuses,
      statusPercentages,
      completionRate,
      totalTargets,
      uncompletedCount,
    };

    // Başarılı sonuç
    const duration = flowTracker.markEnd('calculateTargetStats', mapToTrackerCategory(FlowCategory.Business), 'LearningTargetService');
    logger.debug(
      `Hedef istatistikleri hesaplandı: Toplam=${totalTargets}, Tamamlanma=%${Math.round(completionRate)}`,
      'LearningTargetService.calculateTargetStats',
      __filename,
      536,
      { 
        result,
        duration 
      }
    );
    
    return result;
  }

  /**
   * Durum açıklamasını kişiselleştirir
   * @param {LearningTargetStatusLiteral} status - Öğrenme hedefi durumu
   * @param {number} scorePercent - Opsiyonel skor yüzdesi
   * @returns {string} Kişiselleştirilmiş açıklama
   */
  getPersonalizedStatusDescription(
    status: LearningTargetStatusLiteral,
    scorePercent?: number,
  ): string {
    flowTracker.trackStep(
      mapToTrackerCategory(FlowCategory.Business), 
      'Durum açıklaması üretiliyor', 
      'LearningTargetService.getPersonalizedStatusDescription',
      { status, scorePercent }
    );
    
    const personalizedDescriptions = {
      pending:
        "Henüz bu konuyu hiç çalışmadınız. Sınav çözerek bilgi seviyenizi ölçebilirsiniz.",
      failed: scorePercent
        ? `Son sınavınızda %${Math.round(scorePercent)} başarı gösterdiniz. Bu konu üzerinde daha fazla çalışmanız gerekiyor.`
        : "Bu konuda zorlanıyorsunuz. Daha fazla çalışmaya ihtiyacınız var.",
      medium: scorePercent
        ? `Son sınavınızda %${Math.round(scorePercent)} başarı gösterdiniz. İyi gidiyorsunuz, ancak gelişime açık alanlarınız var.`
        : "Bu konuda temel bilginiz var, ancak daha fazla pratik yapmanız önerilir.",
      mastered: scorePercent
        ? `Son sınavınızda %${Math.round(scorePercent)} başarı gösterdiniz. Harika gidiyorsunuz!`
        : "Bu konuda başarılısınız. Düzenli tekrar ile bilginizi koruyabilirsiniz.",
    };

    logger.debug(
      `Durum açıklaması üretildi: ${status}`,
      'LearningTargetService.getPersonalizedStatusDescription',
      __filename,
      580,
      { 
        status, 
        scorePercent,
        description: personalizedDescriptions[status]
      }
    );

    return personalizedDescriptions[status];
  }

  /**
   * Öğrenme önerilerini oluşturur
   * @param {LearningTarget[]} targets - Öğrenme hedefleri
   * @returns {Array} Öğrenme önerileri
   */
  generateLearningRecommendations(
    targets: LearningTarget[],
  ): Array<{
    id: string;
    targetId: string;
    topicName: string;
    status: LearningTargetStatusLiteral;
    priority: "low" | "medium" | "high";
    recommendationType: "review" | "practice" | "learn";
    description: string;
  }> {
    flowTracker.markStart('generateRecommendations');
    
    logger.debug(
      `Öğrenme önerileri oluşturuluyor: ${targets.length} hedef`,
      'LearningTargetService.generateLearningRecommendations',
      __filename,
      607,
      { count: targets.length }
    );
    
    const recommendations: Array<{
      id: string;
      targetId: string;
      topicName: string;
      status: LearningTargetStatusLiteral;
      priority: "low" | "medium" | "high";
      recommendationType: "review" | "practice" | "learn";
      description: string;
    }> = [];

    // Öncelik sıralaması: failed, medium, pending (sırayla)
    const failedTargets = targets.filter((t) => t.status === "failed");
    const mediumTargets = targets.filter((t) => t.status === "medium");
    const pendingTargets = targets.filter((t) => t.status === "pending");
    
    logger.debug(
      'Hedef durumlarına göre gruplandırma yapıldı',
      'LearningTargetService.generateLearningRecommendations',
      __filename,
      627,
      { 
        failedCount: failedTargets.length,
        mediumCount: mediumTargets.length,
        pendingCount: pendingTargets.length
      }
    );

    // En fazla 2 adet başarısız hedef için öneri ekle
    failedTargets.slice(0, 2).forEach((target) => {
      recommendations.push({
        id: `rec_failed_${target.id}`,
        targetId: target.id,
        topicName: target.subTopicName,
        status: target.status,
        priority: "high",
        recommendationType: "practice",
        description: `${target.subTopicName} konusunda zorlanıyorsunuz. Daha fazla pratik yapmanız önerilir.`,
      });
    });

    // En fazla 2 adet orta hedef için öneri ekle
    mediumTargets.slice(0, 2).forEach((target) => {
      recommendations.push({
        id: `rec_medium_${target.id}`,
        targetId: target.id,
        topicName: target.subTopicName,
        status: target.status,
        priority: "medium",
        recommendationType: "review",
        description: `${target.subTopicName} konusunda iyisiniz, ancak daha da geliştirebilirsiniz.`,
      });
    });

    // En fazla 1 adet bekleyen hedef için öneri ekle
    pendingTargets.slice(0, 1).forEach((target) => {
      recommendations.push({
        id: `rec_pending_${target.id}`,
        targetId: target.id,
        topicName: target.subTopicName,
        status: target.status,
        priority: "low",
        recommendationType: "learn",
        description: `${target.subTopicName} konusunu henüz öğrenmeye başlamadınız.`,
      });
    });
    
    // Başarılı sonuç
    const duration = flowTracker.markEnd('generateRecommendations', mapToTrackerCategory(FlowCategory.Business), 'LearningTargetService');
    logger.debug(
      `Öğrenme önerileri oluşturuldu: ${recommendations.length} öneri`,
      'LearningTargetService.generateLearningRecommendations',
      __filename,
      674,
      { 
        recommendationCount: recommendations.length,
        priorityDistribution: {
          high: recommendations.filter(r => r.priority === 'high').length,
          medium: recommendations.filter(r => r.priority === 'medium').length,
          low: recommendations.filter(r => r.priority === 'low').length
        },
        duration 
      }
    );

    return recommendations;
  }

  // Yeni konuları tespit et
  @LogMethod('LearningTargetService', FlowCategory.API)
  async detectNewTopics(
    courseId: string, 
    lessonContext: string, 
    existingTopicNames: string[]
  ): Promise<string[]> {
    flowTracker.markStart(`detectNewTopics_${courseId}`);
    
    try {
      trackFlow(
        `Detecting new topics for course ${courseId} with ${existingTopicNames.length} existing topics`,
        "LearningTargetService.detectNewTopics",
        FlowCategory.API
      );
      
      flowTracker.trackApiCall(
        `/learning-targets/${courseId}/detect-new-topics`,
        'POST',
        'LearningTargetService.detectNewTopics',
        { courseId, contextLength: lessonContext.length, existingTopicsCount: existingTopicNames.length }
      );
      
      logger.debug(
        `Yeni konu tespiti başlatılıyor: Kurs=${courseId}, Metin uzunluğu=${lessonContext.length}, Mevcut konu sayısı=${existingTopicNames.length}`,
        'LearningTargetService.detectNewTopics',
        __filename,
        785,
        { 
          courseId, 
          contextLength: lessonContext.length,
          existingTopicsCount: existingTopicNames.length,
          existingTopics: existingTopicNames.slice(0, 5) // İlk 5 konu için loglama
        }
      );
      
      const newTopics = await apiService.post<string[]>(
        `/learning-targets/${courseId}/detect-new-topics`,
        {
          lessonContext,
          existingTopicNames
        }
      );
      
      // Başarılı sonuç
      const duration = flowTracker.markEnd(`detectNewTopics_${courseId}`, mapToTrackerCategory(FlowCategory.API), 'LearningTargetService');
      logger.info(
        `Yeni konu tespiti tamamlandı: Kurs=${courseId}, Tespit edilen yeni konu sayısı=${newTopics.length}`,
        'LearningTargetService.detectNewTopics',
        __filename,
        810,
        { 
          courseId, 
          newTopicsCount: newTopics.length,
          newTopics: newTopics.slice(0, 10), // İlk 10 yeni konu için loglama
          duration 
        }
      );
      
      return newTopics;
    } catch (error) {
      // Hata durumu
      flowTracker.markEnd(`detectNewTopics_${courseId}`, mapToTrackerCategory(FlowCategory.API), 'LearningTargetService');
      logger.error(
        `Yeni konu tespiti sırasında hata oluştu: ${courseId}`,
        'LearningTargetService.detectNewTopics',
        __filename,
        825,
        { courseId, contextLength: lessonContext.length, existingTopicsCount: existingTopicNames.length, error }
      );
      throw error;
    }
  }

  // Yeni konuları onayla ve kaydet
  @LogMethod('LearningTargetService', FlowCategory.API)
  async confirmNewTopics(courseId: string, newTopicNames: string[]): Promise<LearningTarget[]> {
    flowTracker.markStart(`confirmNewTopics_${courseId}`);
    
    try {
      trackFlow(
        `Confirming ${newTopicNames.length} new topics for course ${courseId}`,
        "LearningTargetService.confirmNewTopics",
        FlowCategory.API
      );
      
      flowTracker.trackApiCall(
        `/learning-targets/${courseId}/confirm-new-topics`,
        'POST',
        'LearningTargetService.confirmNewTopics',
        { courseId, topicsCount: newTopicNames.length }
      );
      
      logger.debug(
        `Yeni konular onaylanıyor: Kurs=${courseId}, Onaylanacak konu sayısı=${newTopicNames.length}`,
        'LearningTargetService.confirmNewTopics',
        __filename,
        850,
        { 
          courseId, 
          topicsCount: newTopicNames.length,
          topicNames: newTopicNames.slice(0, 10) // İlk 10 konu adı için loglama
        }
      );
      
      const confirmedTargets = await apiService.post<LearningTarget[]>(
        `/learning-targets/${courseId}/confirm-new-topics`,
        {
          newTopicNames
        }
      );
      
      // Başarılı sonuç
      const duration = flowTracker.markEnd(`confirmNewTopics_${courseId}`, mapToTrackerCategory(FlowCategory.API), 'LearningTargetService');
      logger.info(
        `Yeni konular başarıyla onaylandı ve kaydedildi: Kurs=${courseId}, Oluşturulan hedef sayısı=${confirmedTargets.length}`,
        'LearningTargetService.confirmNewTopics',
        __filename,
        875,
        { 
          courseId, 
          confirmedTargetsCount: confirmedTargets.length,
          targetIds: confirmedTargets.map(t => t.id).slice(0, 10), // İlk 10 hedef ID'si için loglama
          duration 
        }
      );
      
      return confirmedTargets;
    } catch (error) {
      // Hata durumu
      flowTracker.markEnd(`confirmNewTopics_${courseId}`, mapToTrackerCategory(FlowCategory.API), 'LearningTargetService');
      logger.error(
        `Yeni konuları onaylama ve kaydetme sırasında hata oluştu: ${courseId}`,
        'LearningTargetService.confirmNewTopics',
        __filename,
        890,
        { courseId, topicsCount: newTopicNames.length, topicNames: newTopicNames, error }
      );
      throw error;
    }
  }
}

// Singleton instance oluştur ve export et
const learningTargetService = new LearningTargetService();
export default learningTargetService;
  