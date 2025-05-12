import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseService } from './firebase.service';

/**
 * Firebase modülü
 * Global olarak işaretlenmiştir, bir kez import edildiğinde
 * tüm modüller için kullanılabilir hale gelir
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [FirebaseService],
  exports: [FirebaseService],
})
export class FirebaseModule {}
