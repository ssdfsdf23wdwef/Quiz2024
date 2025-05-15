import { Module, Global, OnModuleInit } from '@nestjs/common';
import { AiService } from './ai.service';
import { SharedModule } from '../shared/shared.module';
import { ConfigModule } from '@nestjs/config';
import { LoggerService } from '../common/services/logger.service';
import { FlowTrackerService } from '../common/services/flow-tracker.service';
import { NormalizationService } from '../shared/normalization/normalization.service';
import { AIProviderService } from './providers/ai-provider.service';
import { GeminiProviderService } from './providers/gemini-provider.service';
import { TopicDetectionService } from './services/topic-detection.service';
import { QuizGenerationService } from './services/quiz-generation.service';
import { PromptManagerService } from './services/prompt-manager.service';
import { QuizValidationService } from './services/quiz-validation.service';
// import { NormalizationService } from '../shared/normalization/normalization.service'; // Removed unused import

@Global()
@Module({
  imports: [SharedModule, ConfigModule],
  providers: [
    AiService,
    NormalizationService,
    GeminiProviderService,
    AIProviderService,
    TopicDetectionService,
    QuizGenerationService,
    PromptManagerService,
    QuizValidationService,
  ],
  exports: [AiService, QuizGenerationService],
})
export class AiModule implements OnModuleInit {
  constructor(
    private readonly logger: LoggerService,
    private readonly flowTracker: FlowTrackerService,
  ) {}

  onModuleInit() {
    this.logger.info(
      'AI modülü başlatıldı',
      'AiModule.onModuleInit',
      __filename,
      20,
    );
    this.flowTracker.trackStep('AI modülü başlatıldı', 'AiModule');
  }
}
