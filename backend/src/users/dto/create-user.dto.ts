// src/users/dto/create-user.dto.ts
import {
  IsString,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'new_operator' })
  @IsString()
  username!: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'رمز عبور باید حداقل ۶ کاراکتر باشد' })
  password!: string;

  @ApiProperty({ enum: UserRole, default: UserRole.REGISTRAR })
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiPropertyOptional({ example: 'علی رضایی' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ example: '09123456789' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Manager user id' })
  @IsOptional()
  @IsString()
  managerId?: string;
}
