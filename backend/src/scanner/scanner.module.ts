import { Module } from '@nestjs/common';
import { ScannerService } from './scanner.service';
import { ScannerController } from './scanner.controller';
import { TrackModule } from '../track/track.module';

@Module({
  imports: [TrackModule],
  providers: [ScannerService],
  controllers: [ScannerController],
})
export class ScannerModule {}
