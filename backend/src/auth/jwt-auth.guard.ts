import {
  Injectable,
  UnauthorizedException,
  Logger,
  ExecutionContext,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err) {
      this.logger.error('JWT error:', err.message);
      throw err;
    }
    if (!user) {
      this.logger.warn('JWT info:', info?.message || info);
      throw new UnauthorizedException(info?.message || 'Unauthorized');
    }
    return user;
  }
}
