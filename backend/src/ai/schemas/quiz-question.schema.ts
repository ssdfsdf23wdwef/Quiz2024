import { z } from 'zod';

// Schema for quiz options with ID validation
export const QuizOptionSchema = z.object({
  id: z.string().min(1, 'Seçenek ID boş olamaz'),
  text: z.string().min(1, 'Seçenek metni boş olamaz'),
});

// Schema for quiz questions with refined validation
export const QuizQuestionSchema = z.object({
  id: z
    .string()
    .optional()
    .default(
      () => `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ),
  questionText: z.string().min(10, 'Soru metni en az 10 karakter olmalıdır'),
  options: z
    .array(QuizOptionSchema)
    .min(2, 'En az 2 seçenek olmalıdır')
    .max(5, 'En fazla 5 seçenek olabilir'),
  correctAnswerId: z.string().min(1, 'Doğru cevap ID boş olamaz'),
  explanation: z.string().optional().default('Açıklama yok'),
  subTopicName: z.string().min(1, 'Alt konu adı boş olamaz'),
  normalizedSubTopicName: z
    .string()
    .optional()
    .default(''),
  difficulty: z
    .enum(['easy', 'medium', 'hard', 'mixed'])
    .optional()
    .default('medium'),
  questionType: z
    .enum(['multiple_choice', 'true_false', 'fill_in_blank', 'short_answer'])
    .optional()
    .default('multiple_choice'),
  cognitiveDomain: z
    .enum([
      'remembering',
      'understanding',
      'applying',
      'analyzing',
      'evaluating',
      'creating',
    ])
    .optional()
    .default('understanding'),
  topic: z.string().optional(),
}).refine(
  (data) => {
    // Validate that correctAnswerId exists in the options array
    return data.options.some((option) => option.id === data.correctAnswerId);
  },
  {
    message: 'Doğru cevap ID seçeneklerden birinin ID değeriyle eşleşmelidir',
    path: ['correctAnswerId'], // Hata çıktısında gösterilecek alan
  },
);

// Schema for the complete AI response
export const QuizResponseSchema = z.object({
  questions: z.array(QuizQuestionSchema).min(1, 'En az 1 soru olmalıdır'),
  quizTitle: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// Union type to handle different AI response formats
export const QuizGenerationResponseSchema = z.union([
  z.array(QuizQuestionSchema), // For direct array response
  QuizResponseSchema, // For { questions: [] } format
]);
