import { Injectable, ConflictException, NotFoundException, UnauthorizedException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { RegisterDto, LoginDto, UpdatePlaybackStateDto, UpdateUserDto } from './user.dto';

@Injectable()
export class UserService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    // Seed default admin user if no users exist
    const count = await this.userRepository.count();
    if (count === 0) {
      const admin = this.userRepository.create({
        username: 'admin',
        password: 'admin',
      });
      await this.userRepository.save(admin);
      console.log('Default admin user created (admin/admin)');
    }
  }

  async register(registerDto: RegisterDto): Promise<User> {
    const { username, password } = registerDto;
    const existingUser = await this.userRepository.findOneBy({ username });

    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    // In a real app, hash the password here before saving
    const user = this.userRepository.create({ username, password });
    await this.userRepository.save(user);
    return user;
  }

  async login(loginDto: LoginDto): Promise<User> {
    const { username, password } = loginDto;
    const user = await this.userRepository.findOneBy({ username });

    // In a real app, compare hashed password
    if (!user || user.password !== password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async updatePlaybackState(id: string, playbackStateDto: UpdatePlaybackStateDto): Promise<User> {
    const user = await this.findById(id);
    user.lastPlayedTrackId = playbackStateDto.trackId;
    user.lastPlayedPosition = playbackStateDto.position;
    return this.userRepository.save(user);
  }

  async updateProfile(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    
    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUser = await this.userRepository.findOneBy({ username: updateUserDto.username });
      if (existingUser) {
        throw new ConflictException('Username already exists');
      }
      user.username = updateUserDto.username;
    }

    if (updateUserDto.password) {
      user.password = updateUserDto.password;
    }

    return this.userRepository.save(user);
  }
}
