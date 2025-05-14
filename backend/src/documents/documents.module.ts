import { Module, forwardRef } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentProcessingService } from './document-processing.service';
import { FirebaseModule } from '../firebase/firebase.module';
import { AiModule } from '../ai/ai.module';
import { QuizzesModule } from '../quizzes/quizzes.module';

@Module({
  imports: [FirebaseModule, AiModule, forwardRef(() => QuizzesModule)],
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentProcessingService],
  exports: [DocumentsService, DocumentProcessingService],
})
export class DocumentsModule {}
