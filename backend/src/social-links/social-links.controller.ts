import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SocialLinksService } from './social-links.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { UpdateSocialLinksDto } from './dto/update-social-links.dto';
import { SocialLinksResponseDto } from './dto/social-links-response.dto';

@ApiTags('social-links')
@Controller('social-links')
export class SocialLinksController {
  constructor(private readonly socialLinksService: SocialLinksService) {}

  @Get()
  @ApiOkResponse({
    description: 'Returns all social links',
    type: SocialLinksResponseDto,
  })
  async getLinks(): Promise<SocialLinksResponseDto> {
    const data = await this.socialLinksService.getLinks();
    return { success: true, data };
  }

  @ApiBearerAuth()
  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOkResponse({
    description: 'Social links updated successfully – returns the updated list',
    type: SocialLinksResponseDto,
  })
  async updateLinks(
    @Body() updateDto: UpdateSocialLinksDto,
  ): Promise<SocialLinksResponseDto> {
    const data = await this.socialLinksService.updateLinks(updateDto);
    return { success: true, data };
  }
}
