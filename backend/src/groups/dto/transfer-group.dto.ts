import { IsUUID } from 'class-validator';

/** Who a group is handed to. The service checks that it is one of the group's members. */
export class TransferGroupDto {
  @IsUUID()
  userId!: string;
}
