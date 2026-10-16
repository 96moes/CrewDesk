import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/**
 * Which account to add to a group.
 *
 * `userId` is what the group manager's picker sends after searching by name or phone;
 * `phone` is the direct way, kept because it is already published and a phone number is
 * sometimes all the manager has. At least one of them is required — `GroupsService.addMember`
 * rejects a body with neither — and when both arrive the id wins, because it cannot be
 * ambiguous.
 */
export class AddGroupMemberDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  phone?: string;
}
