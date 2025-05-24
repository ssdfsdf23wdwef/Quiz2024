/**
 * Usage Example: TopicDetectionService.detectExclusiveNewTopics
 * 
 * This example demonstrates how to use the newly implemented 
 * detectExclusiveNewTopics method to identify new and unique topics
 * that are not already present in an existing topics list.
 */

import { TopicDetectionService } from '../src/ai/services/topic-detection.service';

// Example usage in a controller or service
export class ExampleUsage {
  constructor(
    private readonly topicDetectionService: TopicDetectionService
  ) {}

  async exampleDetectNewTopics() {
    // Example 1: Basic usage
    const lessonContext = `
      Bu derste kuantum fiziğinin temel prensiplerini öğreneceğiz. 
      Elektron davranışları, dalga-parçacık ikiliği, belirsizlik ilkesi 
      ve kuantum tünelleme gibi konuları detaylıca inceleyeceğiz.
      Ayrıca Schrödinger denklemi ve kuantum halleri üzerinde duracağız.
    `;

    const existingTopics = [
      'Kuantum Fiziği',
      'Elektron Davranışları',
      'Dalga-Parçacık İkiliği'
    ];

    try {
      const newTopics = await this.topicDetectionService.detectExclusiveNewTopics(
        lessonContext,
        existingTopics
      );

      console.log('Newly detected unique topics:', newTopics);
      // Expected output might include: ['Belirsizlik İlkesi', 'Kuantum Tünelleme', 'Schrödinger Denklemi', 'Kuantum Halleri']
      
      return newTopics;
    } catch (error) {
      console.error('Error detecting new topics:', error);
      throw error;
    }
  }

  async exampleWithEmptyExistingTopics() {
    // Example 2: When no existing topics are provided
    const lessonContext = `
      Matematik dersinde logaritma ve üstel fonksiyonları öğreneceğiz.
      Doğal logaritma, logaritma kuralları ve grafik çizimi konularını işleyeceğiz.
    `;

    try {
      const newTopics = await this.topicDetectionService.detectExclusiveNewTopics(
        lessonContext,
        [] // Empty existing topics array
      );

      console.log('All detected topics (no exclusions):', newTopics);
      return newTopics;
    } catch (error) {
      console.error('Error detecting topics:', error);
      throw error;
    }
  }

  async exampleWithManyExistingTopics() {
    // Example 3: When many topics already exist
    const lessonContext = `
      Bu kimya dersinde periyodik tablo, atomik yapı ve kimyasal bağlar konusunu öğreneceğiz.
    `;

    const existingTopics = [
      'Periyodik Tablo',
      'Atomik Yapı', 
      'Kimyasal Bağlar',
      'Elektron Konfigürasyonu',
      'İyonik Bağlar',
      'Kovalent Bağlar',
      'Metalik Bağlar'
    ];

    try {
      const newTopics = await this.topicDetectionService.detectExclusiveNewTopics(
        lessonContext,
        existingTopics
      );

      console.log('Newly detected topics after exclusions:', newTopics);
      // Might return empty array if all major topics are already covered
      return newTopics;
    } catch (error) {
      console.error('Error detecting new topics:', error);
      throw error;
    }
  }
}

/**
 * Example Integration in a Learning Management System Controller
 */
export class LessonController {
  constructor(
    private readonly topicDetectionService: TopicDetectionService
  ) {}

  async addNewLessonContent(lessonId: string, newContent: string) {
    try {
      // Get existing topics for this lesson
      const existingTopics = await this.getExistingTopicsForLesson(lessonId);
      
      // Detect new unique topics from the new content
      const newTopics = await this.topicDetectionService.detectExclusiveNewTopics(
        newContent,
        existingTopics
      );

      if (newTopics.length > 0) {
        console.log(`Found ${newTopics.length} new topics to add to lesson ${lessonId}:`, newTopics);
        
        // Add new topics to the lesson
        await this.addTopicsToLesson(lessonId, newTopics);
        
        return {
          success: true,
          message: `Added ${newTopics.length} new topics to the lesson`,
          newTopics: newTopics
        };
      } else {
        return {
          success: true,
          message: 'No new topics found - all topics already exist in the lesson',
          newTopics: []
        };
      }
    } catch (error) {
      console.error('Error processing new lesson content:', error);
      throw error;
    }
  }

  private async getExistingTopicsForLesson(lessonId: string): Promise<string[]> {
    // Implementation would fetch existing topics from database
    // This is just a placeholder
    return [];
  }

  private async addTopicsToLesson(lessonId: string, topics: string[]): Promise<void> {
    // Implementation would save new topics to database
    // This is just a placeholder
    console.log(`Adding topics to lesson ${lessonId}:`, topics);
  }
}
