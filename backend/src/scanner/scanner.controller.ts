import { Controller, Post, UseInterceptors, UploadedFile, Body, BadRequestException, Delete, HttpCode } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as path from 'path';
import * as fs from 'fs-extra';
import { ScannerService } from './scanner.service';

@Controller('scanner')
export class ScannerController {
  constructor(private readonly scannerService: ScannerService) {}

  @Post('sync')
  async sync() {
    return this.scannerService.scan();
  }

  @Delete('playlists')
  @HttpCode(204)
  async deletePlaylist(@Body('playlistName') playlistName: string) {
    if (!playlistName) {
      throw new BadRequestException('playlistName is required');
    }
    await this.scannerService.deletePlaylist(playlistName);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadTrack(
    @UploadedFile() file: Express.Multer.File,
    @Body('playlist') playlist?: string
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Resolve base library directory
    const libraryDir = path.resolve(__dirname, '../../../library');
    const targetDir = playlist ? path.join(libraryDir, playlist) : libraryDir;
    
    // Ensure the target directory exists
    await fs.ensureDir(targetDir);

    const targetPath = path.join(targetDir, file.originalname);

    // Save the file to the target path
    await fs.writeFile(targetPath, file.buffer);

    // Process the file to extract metadata and save to DB
    await this.scannerService.processFile(targetPath);

    return { success: true, message: 'File uploaded and processed', file: file.originalname };
  }
}
