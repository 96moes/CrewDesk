import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * The member search's query string.
 *
 * A DTO rather than a bare `@Query('q')` on purpose: Express turns a repeated parameter
 * (`?q=a&q=b`) into an array, and a plain `string` annotation would then call `.trim()` on an array
 * and answer 500. Here that shape is a 400 before anything runs, and an over-long pattern never
 * reaches the database. `q` may be missing — the service answers an empty list for a query that is
 * too short to search with.
 */
export class MemberSearchQueryDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(60)
  q?: string;
}
