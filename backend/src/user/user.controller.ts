import { Controller, Post, Body, Put, Param, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterDto, LoginDto, UpdatePlaybackStateDto, UpdateUserDto } from './user.dto';
import { User } from './user.entity';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<Omit<User, 'password'>> {
    const user = await this.userService.register(registerDto);
    const { password, ...result } = user;
    return result;
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<Omit<User, 'password'>> {
    const user = await this.userService.login(loginDto);
    const { password, ...result } = user;
    return result;
  }

  @Get(':id/playback-state')
  async getPlaybackState(@Param('id') id: string): Promise<{ trackId: string | null; position: number | null }> {
    const user = await this.userService.findById(id);
    return {
      trackId: user.lastPlayedTrackId,
      position: user.lastPlayedPosition,
    };
  }

  @Put(':id/playback-state')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePlaybackState(
    @Param('id') id: string,
    @Body() playbackStateDto: UpdatePlaybackStateDto,
  ): Promise<void> {
    await this.userService.updatePlaybackState(id, playbackStateDto);
  }

  @Put(':id/profile')
  async updateProfile(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.userService.updateProfile(id, updateUserDto);
    const { password, ...result } = user;
    return result;
  }
}
