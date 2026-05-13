import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Track } from '../track/track.entity';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as mm from 'music-metadata';

@Injectable()
export class ScannerService {
  private readonly logger = new Logger(ScannerService.name);
  // Resolve the library directory relative to the backend root (dist/scanner)
  private readonly libraryDir = path.resolve(__dirname, '../../../library');

  constructor(
    @InjectRepository(Track)
    private trackRepository: Repository<Track>,
  ) {}

  async deletePlaylist(playlistName: string): Promise<void> {
    this.logger.log(`Received request to delete playlist: ${playlistName}`);

    // Security: prevent path traversal
    if (playlistName.includes('..') || path.isAbsolute(playlistName)) {
      throw new Error('Invalid playlist name');
    }

    const playlistPath = path.join(this.libraryDir, playlistName);

    if (!(await fs.pathExists(playlistPath))) {
      this.logger.warn(`Playlist folder not found, but proceeding to delete from DB: ${playlistPath}`);
    } else {
      try {
        await fs.remove(playlistPath);
        this.logger.log(`Successfully deleted playlist folder: ${playlistPath}`);
      } catch (error) {
        this.logger.error(`Failed to delete playlist folder ${playlistPath}:`, error);
        throw new Error(`Failed to delete playlist folder: ${error.message}`);
      }
    }

    try {
      // Efficiently delete all tracks belonging to the playlist from the database
      const deleteResult = await this.trackRepository.delete({ playlist: playlistName });
      this.logger.log(`Deleted ${deleteResult.affected} tracks from the database for playlist: ${playlistName}`);
    } catch (error) {
      this.logger.error(`Failed to delete tracks for playlist ${playlistName} from DB:`, error);
      throw new Error(`Failed to delete tracks from database: ${error.message}`);
    }
  }

  async scan() {
    this.logger.log(`Starting scan in ${this.libraryDir}...`);
    
    if (!(await fs.pathExists(this.libraryDir))) {
      await fs.ensureDir(this.libraryDir);
    }

    const files = await this.getAudioFiles(this.libraryDir);
    this.logger.log(`Found ${files.length} audio files.`);

    // Remove tracks from DB that no longer exist on disk
    const existingTracks = await this.trackRepository.find();
    let removedCount = 0;
    for (const track of existingTracks) {
      const pathToCheck = track.path;
      
      let fileReallyExists = false;
      try {
        await fs.access(pathToCheck, fs.constants.F_OK);
        fileReallyExists = true;
      } catch {
        fileReallyExists = false;
      }
      
      if (!fileReallyExists) {
        await this.trackRepository.remove(track);
        this.logger.log(`Removed missing file from DB: ${pathToCheck}`);
        removedCount++;
      }
    }

    let processedCount = 0;
    for (const file of files) {
      const processed = await this.processFile(file);
      if (processed) processedCount++;
    }

    this.logger.log(`Scan completed. Processed: ${processedCount}, Removed: ${removedCount}`);
    return { scanned: files.length, processed: processedCount, removed: removedCount };
  }

  private async getAudioFiles(dir: string): Promise<string[]> {
    const dirents = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(dirents.map((dirent) => {
      const res = path.resolve(dir, dirent.name);
      return dirent.isDirectory() ? this.getAudioFiles(res) : [res];
    }));
    return Array.prototype.concat(...files).filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.mp3', '.flac', '.wav', '.m4a'].includes(ext);
    });
  }

  public async processFile(filePath: string): Promise<boolean> {
    const filename = path.basename(filePath);
    try {
      const metadata = await mm.parseFile(filePath);
      
      const title = metadata.common.title || path.basename(filename, path.extname(filename));
      const artist = metadata.common.artist || 'Unknown Artist';
      const album = metadata.common.album ?? null;
      const year = metadata.common.year ?? null;
      const duration = metadata.format.duration ?? null;

      // Extract playlist from folder name
      const relativePath = path.relative(this.libraryDir, filePath);
      const parts = relativePath.split(path.sep);
      const playlist = parts.length > 1 ? parts[0] : null;

      // Check if track exists based on path
      let track = await this.trackRepository.findOneBy({ path: filePath });
      if (!track) {
        track = this.trackRepository.create({
          title,
          artist,
          album,
          year,
          duration,
          path: filePath,
          filename,
          playlist,
        });
        await this.trackRepository.save(track);
        this.logger.log(`Added track: ${title}`);
        return true;
      } else {
        let updated = false;
        if (track.playlist !== playlist) { track.playlist = playlist; updated = true; }
        if (track.title !== title) { track.title = title; updated = true; }
        if (track.artist !== artist) { track.artist = artist; updated = true; }
        if (track.album !== album) { track.album = album; updated = true; }
        if (track.year !== year) { track.year = year; updated = true; }
        if (track.duration !== duration) {
          if (track.duration === null || duration === null) {
            track.duration = duration;
            updated = true;
          } else {
            // Both are numbers, compare with Math.abs, allowing for slight floating point differences
            if (Math.abs(track.duration - duration) > 1) {
              track.duration = duration;
              updated = true;
            }
          }
        }

        if (updated) {
          await this.trackRepository.save(track);
          this.logger.log(`Updated track data for: ${title}`);
          return true;
        }
      }
    } catch (error: any) {
      this.logger.error(`Error parsing ${filename}:`, error.message);
    }
    return false;
  }
}
