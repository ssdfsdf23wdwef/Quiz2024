import { Module, forwardRef } from '@nestjs/common';
import { QuizzesController } from './quizzes.controller';
import { QuizzesService } from './quizzes.service';
import { QuizAnalysisService } from './quiz-analysis.service';
import { FirebaseModule } from '../firebase/firebase.module';
import { AiModule } from '../ai/ai.module';
import { SharedModule } from '../shared/shared.module';
import { LearningTargetsModule } from '../learning-targets/learning-targets.module';
import { DocumentsModule } from '../documents/documents.module';
import { CoursesModule } from '../courses/courses.module';

@Module({
  imports: [
    FirebaseModule,
    AiModule,
    SharedModule,
    forwardRef(() => LearningTargetsModule),
    forwardRef(() => DocumentsModule),
    CoursesModule,
  ],
  controllers: [QuizzesController],
  providers: [QuizzesService, QuizAnalysisService],
  exports: [QuizzesService],
})
export class QuizzesModule {}
