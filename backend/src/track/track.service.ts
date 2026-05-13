import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, ILike, Repository, Brackets } from 'typeorm';
import { Track } from './track.entity';

import * as fs from 'fs-extra';
import * as path from 'path';

@Injectable()
export class TrackService {
  constructor(
    @InjectRepository(Track)
    private trackRepository: Repository<Track>,
  ) {}

  async findAll(playlist?: string, search?: string): Promise<Track[]> {
    const query = this.trackRepository.createQueryBuilder('track');

    if (playlist) {
      query.where('track.playlist = :playlist', { playlist });
    }

    if (search) {
      const whereClause = playlist ? 'andWhere' : 'where';
      query[whereClause](new Brackets(qb => {
        qb.where('track.title LIKE :search', { search: `%${search}%` })
          .orWhere('track.artist LIKE :search', { search: `%${search}%` })
          .orWhere('track.album LIKE :search', { search: `%${search}%` });
      }));
    }

    query.orderBy('track.createdAt', 'DESC');

    return query.getMany();
  }

  async remove(id: string): Promise<void> {
    const track = await this.trackRepository.findOneBy({ id });
    if (!track) {
      throw new NotFoundException(`Track with ID ${id} not found`);
    }

    try {
      // First, attempt to delete the file from the filesystem
      await fs.remove(track.path);

      // If file deletion is successful, remove the track from the database
      await this.trackRepository.remove(track);
    } catch (error) {
      // Log the error and rethrow or handle it as needed
      console.error(`Failed to delete track ${id} and file ${track.path}:`, error);
      throw new Error(`Failed to delete track: ${error.message}`);
    }
  }

  async getPlaylists(): Promise<string[]> {
    const result = await this.trackRepository
      .createQueryBuilder('track')
      .select('DISTINCT track.playlist', 'playlist')
      .where('track.playlist IS NOT NULL')
      .getRawMany();
    return result.map((r) => r.playlist);
  }

  async renamePlaylist(oldName: string, newName: string): Promise<void> {
    const libraryDir = path.resolve(__dirname, '../../../library');
    const oldPath = path.join(libraryDir, oldName);
    const newPath = path.join(libraryDir, newName);

    if (await fs.pathExists(oldPath)) {
      await fs.rename(oldPath, newPath);
      
      const tracks = await this.trackRepository.find({ where: { playlist: oldName } });
      for (const track of tracks) {
        track.playlist = newName;
        // safely replace only the folder part by using path properties
        const relativeTrackPath = path.relative(oldPath, track.path);
        track.path = path.join(newPath, relativeTrackPath);
        await this.trackRepository.save(track);
      }
    }
  }

  async moveTrack(id: string, targetPlaylist: string | null): Promise<void> {
    const track = await this.trackRepository.findOneBy({ id });
    if (!track) throw new Error('Track not found');

    const libraryDir = path.resolve(__dirname, '../../../library');
    const targetDir = targetPlaylist ? path.join(libraryDir, targetPlaylist) : libraryDir;
    
    await fs.ensureDir(targetDir);

    const newPath = path.join(targetDir, track.filename);

    if (track.path !== newPath) {
      await fs.move(track.path, newPath, { overwrite: true });
      track.path = newPath;
      track.playlist = targetPlaylist;
      await this.trackRepository.save(track);
    }
  }
}
