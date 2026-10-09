import { UserRole } from '../../users/entities/user.entity';

export type JwtUser = {
  userId: string;
  username: string;
  role: UserRole;
};
