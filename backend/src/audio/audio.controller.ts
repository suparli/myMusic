import { Controller, Get, Param, Req, Res, Headers, HttpStatus, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { TrackService } from '../track/track.service';

@Controller('audio')
export class AudioController {
  constructor(private readonly trackService: TrackService) {}

  @Get('stream/:id')
  async streamAudio(
    @Param('id') id: string,
    @Headers('range') range: string,
    @Req() req: any,
    @Res() res: any,
  ) {
    const tracks = await this.trackService.findAll();
    const track = tracks.find(t => t.id === id);

    if (!track) {
      throw new NotFoundException('Track not found');
    }

    const filePath = track.path;
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Audio file not found on disk');
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/mpeg',
      };
      res.writeHead(HttpStatus.PARTIAL_CONTENT, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'audio/mpeg',
      };
      res.writeHead(HttpStatus.OK, head);
      fs.createReadStream(filePath).pipe(res);
    }
  }
}
