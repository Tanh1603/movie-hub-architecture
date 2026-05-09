import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { ClerkAuthGuard } from '../../common/guard/clerk-auth.guard';
import { Permission } from '../../common/decorator/permission.decorator';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(ClerkAuthGuard)
  @Permission({ resource: 'user', action: 'read', scope: 'global' })
  getUser() {
    return this.userService.getUsers();
  }

  @Get('me')
  @UseGuards(ClerkAuthGuard)
  @Permission({ resource: 'user', action: 'read', scope: 'global' })
  getMe(@Req() req: any) {
    return {
      userId: req.userId,
      ...req.staffContext,
    };
  }
}

