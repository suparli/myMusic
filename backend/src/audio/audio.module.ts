import { Module } from '@nestjs/common';
import { AudioController } from './audio.controller';
import { TrackModule } from '../track/track.module';

@Module({
  imports: [TrackModule],
  controllers: [AudioController],
})
export class AudioModule {}
