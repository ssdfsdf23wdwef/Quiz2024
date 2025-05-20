import { z } from 'zod';

export const QuizQuestionSchema = z.object({
  id: z
    .string()
    .optional()
    .default(
      () => `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ),
  questionText: z.string().min(1, 'Soru metni boş olamaz'),
  options: z
    .array(z.string().min(1, 'Seçenek boş olamaz'))
    .length(4, 'Tam olarak 4 seçenek olmalı'),
  correctAnswer: z.string().min(1, 'Doğru cevap boş olamaz'),
  explanation: z.string().optional().default('Açıklama yok'),
  subTopicName: z.string().min(1, 'Alt konu adı boş olamaz'),
  normalizedSubTopicName: z
    .string()
    .min(1, 'Normalize edilmiş alt konu adı boş olamaz'),
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
});

export const QuizGenerationResponseSchema = z.union([
  z.array(QuizQuestionSchema), // For direct array response
  z.object({ questions: z.array(QuizQuestionSchema) }), // For { questions: [] } format
]);
