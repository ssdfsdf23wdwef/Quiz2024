import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * Konu bazlı kullanıcı ilerleme durumu DTO
 */
export class TopicProgressDto {
  @ApiProperty({
    description: 'Konu adı',
    example: 'NestJS Controllers',
  })
  subTopic: string;

  @ApiProperty({
    description: 'Normalize edilmiş konu adı',
    example: 'nestjs_controllers',
  })
  normalizedSubTopic: string;

  @ApiProperty({
    description: 'Doğru cevap oranı (0-1 arası)',
    example: 0.85,
  })
  correctRate: number;

  @ApiProperty({
    description: 'Cevaplanmış toplam soru sayısı',
    example: 20,
  })
  totalQuestions: number;

  @ApiProperty({
    description: 'Doğru cevaplanan soru sayısı',
    example: 17,
  })
  correctAnswers: number;

  @ApiProperty({
    description: 'Bu konudaki yeterlilik düzeyi (weak, medium, strong)',
    example: 'strong',
    enum: ['weak', 'medium', 'strong'],
  })
  proficiencyLevel: string;

  @ApiProperty({
    description: 'Son çalışma tarihi',
    example: '2023-01-01T12:00:00Z',
  })
  lastPracticed: string;

  constructor(partial: Partial<TopicProgressDto>) {
    Object.assign(this, partial);

    // Helper function to safely check if a value is a Date object
    function isDate(value: any): value is Date {
      return value instanceof Date && !isNaN(value.getTime());
    }

    // Tarih ise ISO string formatına dönüştür
    if (partial.lastPracticed && isDate(partial.lastPracticed)) {
      this.lastPracticed = partial.lastPracticed.toISOString();
    }
  }
}

/**
 * Zorluk seviyesi bazlı kullanıcı ilerleme durumu DTO
 */
export class DifficultyProgressDto {
  @ApiProperty({
    description: 'Zorluk seviyesi',
    example: 'medium',
    enum: ['easy', 'medium', 'hard'],
  })
  difficulty: string;

  @ApiProperty({
    description: 'Doğru cevap oranı (0-1 arası)',
    example: 0.75,
  })
  correctRate: number;

  @ApiProperty({
    description: 'Cevaplanmış toplam soru sayısı',
    example: 50,
  })
  totalQuestions: number;

  @ApiProperty({
    description: 'Doğru cevaplanan soru sayısı',
    example: 38,
  })
  correctAnswers: number;

  constructor(partial: Partial<DifficultyProgressDto>) {
    Object.assign(this, partial);
  }
}

/**
 * Kullanıcı sınav ilerleme DTO
 */
export class UserQuizProgressDto {
  @ApiProperty({
    description: 'Son 30 günde tamamlanan sınav sayısı',
    example: 15,
  })
  quizzesLast30Days: number;

  @ApiProperty({
    description: 'Tüm zamanlar tamamlanan sınav sayısı',
    example: 42,
  })
  totalQuizzes: number;

  @ApiProperty({
    description: 'Ortalama sınav skoru (0-100)',
    example: 78.5,
  })
  averageScore: number;

  @ApiProperty({
    description: 'Tüm zamanlardaki en yüksek skor (0-100)',
    example: 95,
  })
  highestScore: number;

  @ApiProperty({
    description: 'Son sınav tarihi',
    example: '2023-01-01T12:00:00Z',
  })
  lastQuizDate: string;

  @ApiProperty({
    description: 'Sınav başına ortalama soru sayısı',
    example: 10,
  })
  averageQuestionsPerQuiz: number;

  constructor(partial: Partial<UserQuizProgressDto>) {
    Object.assign(this, partial);

    // Helper function to safely check if a value is a Date object
    function isDate(value: any): value is Date {
      return value instanceof Date && !isNaN(value.getTime());
    }

    // Tarih ise ISO string formatına dönüştür
    if (partial.lastQuizDate && isDate(partial.lastQuizDate)) {
      this.lastQuizDate = partial.lastQuizDate.toISOString();
    }
  }
}

/**
 * Öğrenme hedefleri özeti DTO
 */
export class LearningGoalsSummaryDto {
  @ApiProperty({
    description: 'Aktif öğrenme hedefi sayısı',
    example: 3,
    required: false,
  })
  activeGoalsCount?: number;

  @ApiProperty({
    description: 'Tamamlanmış öğrenme hedefi sayısı',
    example: 5,
    required: false,
  })
  completedGoalsCount?: number;

  constructor(partial: Partial<LearningGoalsSummaryDto>) {
    Object.assign(this, partial);
  }
}

/**
 * Kullanıcının tek bir öğrenme hedefi için DTO
 */
export class UserLearningObjectiveItemDto {
  @ApiProperty({
    description: 'Öğrenme hedefi ID',
    example: 'uloid_123',
  })
  id: string;

  @ApiProperty({
    description: 'Öğrenme hedefi açıklaması',
    example: 'NestJS Guards konusundaki temel kavramları anlamak',
  })
  description: string;

  @ApiProperty({
    description: 'Hedefin durumu',
    example: 'active',
    enum: ['active', 'achieved', 'on_hold', 'abandoned'],
  })
  status: string;

  @ApiProperty({
    description: 'Hedefe ulaşma ilerlemesi (0-100)',
    example: 75,
  })
  progress: number;

  @ApiProperty({
    description: 'Hedeflenen tamamlanma tarihi (ISO formatında)',
    example: '2023-02-01T00:00:00Z',
    required: false,
  })
  targetDate?: string;

  @ApiProperty({
    description: 'İlişkili ders ID\'si',
    example: 'course_abc',
    required: false,
  })
  courseId?: string;

  @ApiProperty({
    description: 'İlişkili konu ID\'leri',
    example: ['topic_1', 'topic_2'],
    required: false,
    type: [String],
  })
  topicIds?: string[];

  @ApiProperty({
    description: 'Oluşturulma tarihi (ISO formatında)',
    example: '2023-01-01T00:00:00Z',
    required: false,
  })
  createdAt?: string;

  @ApiProperty({
    description: 'Tamamlanma tarihi (ISO formatında)',
    example: '2023-01-15T00:00:00Z',
    required: false,
  })
  achievedAt?: string;

  constructor(partial: Partial<UserLearningObjectiveItemDto>) {
    Object.assign(this, partial);

    function isDate(value: any): value is Date {
      return value instanceof Date && !isNaN(value.getTime());
    }

    if (partial.targetDate && isDate(partial.targetDate)) {
      this.targetDate = partial.targetDate.toISOString();
    }
    if (partial.createdAt && isDate(partial.createdAt)) {
      this.createdAt = partial.createdAt.toISOString();
    }
    if (partial.achievedAt && isDate(partial.achievedAt)) {
      this.achievedAt = partial.achievedAt.toISOString();
    }
  }
}

/**
 * Kullanıcı ilerleme durumu DTO
 */
export class UserProgressResponseDto {
  @ApiProperty({
    description: 'Kullanıcı ID',
    example: '507f1f77bcf86cd799439011',
  })
  userId: string;

  @ApiProperty({
    description: 'Toplam çalışma süresi (saniye)',
    example: 86400,
  })
  totalStudyTime: number;

  @ApiProperty({
    description: 'Son 30 günde toplam çalışma süresi (saniye)',
    example: 36000,
  })
  studyTimeLast30Days: number;

  @ApiProperty({
    description: 'Toplam cevaplanan soru sayısı',
    example: 500,
  })
  totalQuestionsAnswered: number;

  @ApiProperty({
    description: 'Genel doğru cevap oranı (0-1 arası)',
    example: 0.75,
  })
  overallCorrectRate: number;

  @ApiProperty({
    description: 'Konu bazlı ilerleme durumu',
    type: [TopicProgressDto],
  })
  @Type(() => TopicProgressDto)
  topicProgress: TopicProgressDto[];

  @ApiProperty({
    description: 'Zorluk seviyesi bazlı ilerleme durumu',
    type: [DifficultyProgressDto],
  })
  @Type(() => DifficultyProgressDto)
  difficultyProgress: DifficultyProgressDto[];

  @ApiProperty({
    description: 'En güçlü konular (en fazla 5)',
    type: [TopicProgressDto],
  })
  @Type(() => TopicProgressDto)
  strongestTopics: TopicProgressDto[];

  @ApiProperty({
    description: 'En zayıf konular (en fazla 5)',
    type: [TopicProgressDto],
  })
  @Type(() => TopicProgressDto)
  weakestTopics: TopicProgressDto[];

  @ApiProperty({
    description: 'Sınav ilerleme durumu',
    type: UserQuizProgressDto,
  })
  @Type(() => UserQuizProgressDto)
  quizProgress: UserQuizProgressDto;

  @ApiProperty({
    description: 'Öğrenme hedefleri özeti',
    type: LearningGoalsSummaryDto,
    required: false,
  })
  @Type(() => LearningGoalsSummaryDto)
  learningGoalsSummary?: LearningGoalsSummaryDto;

  @ApiProperty({
    description: 'Çalışma önerileri',
    example: [
      'NestJS Middleware konusunu daha fazla çalışmanız önerilir.',
      'TypeORM Relations konusuna odaklanın.',
    ],
    type: [String],
  })
  recommendations: string[];

  @ApiProperty({
    description: 'Öğrenme hedefleri',
    type: [UserLearningObjectiveItemDto],
    example: [
      {
        id: 'uloid_123',
        description: 'NestJS Guards konusundaki temel kavramları anlamak',
        status: 'active',
        progress: 75,
        targetDate: '2023-02-01T00:00:00Z',
        courseId: 'course_abc',
        topicIds: ['topic_1', 'topic_2'],
        createdAt: '2023-01-01T00:00:00Z',
        achievedAt: null,
      },
      {
        id: 'uloid_124',
        description: 'JWT Authentication mekanizmasını tam olarak kavramak',
        status: 'achieved',
        progress: 100,
        targetDate: '2023-01-15T00:00:00Z',
        courseId: 'course_def',
        topicIds: ['topic_3'],
        createdAt: '2022-12-01T00:00:00Z',
        achievedAt: '2023-01-14T00:00:00Z',
      },
    ],
    required: false,
    nullable: true,
  })
  @Type(() => UserLearningObjectiveItemDto)
  learningGoals?:
    | UserLearningObjectiveItemDto[]
    | null;

  @ApiProperty({
    description: 'İlerleme durumu güncelleme zamanı',
    example: '2023-01-01T12:00:00Z',
  })
  lastUpdated: string;

  constructor(partial: Partial<UserProgressResponseDto>) {
    Object.assign(this, partial);

    // Helper function to safely check if a value is a Date object
    function isDate(value: any): value is Date {
      return value instanceof Date && !isNaN(value.getTime());
    }

    // Tarihleri ISO string formatına dönüştür
    if (partial.lastUpdated && isDate(partial.lastUpdated)) {
      this.lastUpdated = partial.lastUpdated.toISOString();
    }

    // Alt nesneler için tip dönüşümlerini gerçekleştir
    if (partial.topicProgress && Array.isArray(partial.topicProgress)) {
      this.topicProgress = partial.topicProgress.map(
        (topic) => new TopicProgressDto(topic),
      );
    }

    if (
      partial.difficultyProgress &&
      Array.isArray(partial.difficultyProgress)
    ) {
      this.difficultyProgress = partial.difficultyProgress.map(
        (difficulty) => new DifficultyProgressDto(difficulty),
      );
    }

    if (partial.strongestTopics && Array.isArray(partial.strongestTopics)) {
      this.strongestTopics = partial.strongestTopics.map(
        (topic) => new TopicProgressDto(topic),
      );
    }

    if (partial.weakestTopics && Array.isArray(partial.weakestTopics)) {
      this.weakestTopics = partial.weakestTopics.map(
        (topic) => new TopicProgressDto(topic),
      );
    }

    if (partial.quizProgress) {
      this.quizProgress = new UserQuizProgressDto(partial.quizProgress);
    }

    if (partial.learningGoalsSummary) {
      this.learningGoalsSummary = new LearningGoalsSummaryDto(partial.learningGoalsSummary);
    }

    // Öğrenme hedefleri için de tarihleri formatla ve UserLearningObjectiveItemDto örneği oluştur
    if (partial.learningGoals && Array.isArray(partial.learningGoals)) {
      this.learningGoals = partial.learningGoals.map((goal) => new UserLearningObjectiveItemDto(goal));
    }
  }
}
