import { CreateGroupDto } from './create-group.dto';

/**
 * Renaming a group takes the same body as creating one — just the new name, with the same rules —
 * which is why this adds nothing but the name the API reads at that route.
 */
export class UpdateGroupDto extends CreateGroupDto {}
