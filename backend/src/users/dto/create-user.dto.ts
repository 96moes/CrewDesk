// src/users/dto/create-user.dto.ts
import {
  IsString,
  IsEnum,
  IsOptional,
  MaxLength,
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

  @ApiProperty({ enum: UserRole, default: UserRole.USER })
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiPropertyOptional({ example: 'علی رضایی' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string | null;

  /**
   * The account's phone number, and the only one that may hold it: the column is unique, so this
   * is how an account is found when it is added to a group and how a group message reaches it.
   * `null` clears it — the update path sends that when the box is emptied, because the unique
   * index tolerates any number of NULLs but would reject a second empty string.
   */
  @ApiPropertyOptional({ example: '09123456789' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string | null;
}
