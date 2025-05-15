import { z } from 'zod';

// Alt konu detayları şeması (AI'dan dönebilecek format)
const SubTopicDetailSchema = z.object({
  subTopicName: z.string().min(1, 'Alt konu adı boş olamaz'),
  normalizedSubTopicName: z.string().optional(),
  difficulty: z.string().optional(),
  learningObjective: z.string().optional(),
  reference: z.any().optional(),
});

const MainTopicWithSubTopicsSchema = z.object({
  mainTopic: z.string().min(1, 'Ana konu boş olamaz'),
  subTopics: z
    .union([
      z.array(z.string().min(1, 'Alt konu boş olamaz')), // String dizisi olabilir
      z.array(SubTopicDetailSchema), // VEYA detaylı alt konu objeleri dizisi olabilir
    ])
    .optional(),
});

const SubTopicObjectSchema = z.object({
  subTopicName: z.string().min(1, 'Alt konu adı boş olamaz'),
  normalizedSubTopicName: z.string().optional(), // Bu alan normalizasyon sonrası ekleniyor, AI'dan gelmeyebilir
  parentTopic: z.string().optional(),
  isMainTopic: z.boolean().optional(),
});

// AI'nın doğrudan string dizisi döndürme ihtimali için
const TopicStringsArraySchema = z.array(
  z.string().min(1, 'Konu adı boş olamaz'),
);

export const TopicDetectionAiResponseSchema = z.object({
  topics: z.array(
    z.union([
      MainTopicWithSubTopicsSchema,
      SubTopicObjectSchema, // Bu AI'dan geliyorsa, alanları ona göre ayarlanmalı
      // Eğer AI bazen sadece string'lerden oluşan bir `topics` dizisi döndürüyorsa:
      // z.string().min(1, "Konu adı string olmalı ve boş olmamalı")
      // Ancak genellikle objelerden oluşur, bu yüzden yukarıdakiler daha olası.
    ]),
  ),
});

// Normalizasyon SONRASI beklediğimiz iç yapı
export const NormalizedTopicStructureSchema = z.object({
  subTopicName: z.string(),
  normalizedSubTopicName: z.string(),
  parentTopic: z.string().optional(),
  isMainTopic: z.boolean().optional(),
});

export const FinalNormalizedTopicDetectionResultSchema = z.object({
  topics: z.array(NormalizedTopicStructureSchema),
});
