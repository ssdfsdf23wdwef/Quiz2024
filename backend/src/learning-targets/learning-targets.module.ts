import { Module, forwardRef } from '@nestjs/common';
import { LearningTargetsController } from './learning-targets.controller';
import { LearningTargetsService } from './learning-targets.service';
import { AiModule } from '../ai/ai.module';
import { SharedModule } from '../shared/shared.module';
import { FirebaseModule } from '../firebase/firebase.module';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [
    AiModule,
    SharedModule,
    FirebaseModule,
    forwardRef(() => DocumentsModule),
  ],
  controllers: [LearningTargetsController],
  providers: [LearningTargetsService],
  exports: [LearningTargetsService],
})
export class LearningTargetsModule {}
