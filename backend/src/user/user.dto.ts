// For simplicity, we'll use classes as DTOs.
// In a real NestJS app, you'd use class-validator decorators for validation.

export class RegisterDto {
  username: string;
  password: string;
}

export class LoginDto {
  username: string;
  password: string;
}

export class UpdatePlaybackStateDto {
  trackId: string;
  position: number;
}

export class UpdateUserDto {
  username?: string;
  password?: string;
}
