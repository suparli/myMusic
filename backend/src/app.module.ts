import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TrackModule } from './track/track.module';
import { ScannerModule } from './scanner/scanner.module';
import { AudioModule } from './audio/audio.module';
import { UserModule } from './user/user.module';
import { Track } from './track/track.entity';
import { User } from './user/user.entity';
import * as path from 'path';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: path.resolve(__dirname, '../../database.sqlite'),
      entities: [Track, User],
      synchronize: true, // Use carefully in production, OK for now
      logging: true,
      enableWAL: true,
    }),
    TrackModule,
    ScannerModule,
    AudioModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
