import { Controller, Get, Put, Query, Param, Body, Delete, HttpCode, Logger } from '@nestjs/common';
import { TrackService } from './track.service';
import { Track } from './track.entity';

@Controller()
export class TrackController {
  private readonly logger = new Logger(TrackController.name);

  constructor(private readonly trackService: TrackService) {}

  @Get('tracks')
  async findAll(
    @Query('playlist') playlist?: string,
    @Query('search') search?: string
  ): Promise<Track[]> {
    return this.trackService.findAll(playlist, search);
  }

  @Delete('tracks/:id')
  @HttpCode(204)
  async deleteTrack(@Param('id') id: string): Promise<void> {
    this.logger.log(`Received request to delete track with ID: ${id}`);
    await this.trackService.remove(id);
  }

  @Get('playlists')
  async getPlaylists(): Promise<string[]> {
    return this.trackService.getPlaylists();
  }

  @Put('playlists/:oldName')
  async renamePlaylist(
    @Param('oldName') oldName: string,
    @Body('newName') newName: string,
  ): Promise<{ success: boolean }> {
    await this.trackService.renamePlaylist(oldName, newName);
    return { success: true };
  }
  @Put('tracks/:id/move')
  async moveTrack(
    @Param('id') id: string,
    @Body('targetPlaylist') targetPlaylist: string | null,
  ): Promise<{ success: boolean }> {
    await this.trackService.moveTrack(id, targetPlaylist);
    return { success: true };
  }
}
