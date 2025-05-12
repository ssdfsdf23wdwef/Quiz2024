import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { FirebaseModule } from '../firebase/firebase.module';
import { CommonServicesModule } from '../common/services/common-services.module';

@Module({
  imports: [FirebaseModule, CommonServicesModule],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
