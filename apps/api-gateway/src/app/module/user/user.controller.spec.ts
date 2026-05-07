import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { SERVICE_NAME } from '@movie-hub/shared-types';
import { ClerkAuthGuard } from '../../common/guard/clerk-auth.guard';

describe('UserController', () => {
  let controller: UserController;
  let userService: jest.Mocked<UserService>;

  const mockUserService = {
    getUsers: jest.fn(),
  };

  const mockClientProxy = {
    send: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: SERVICE_NAME.USER,
          useValue: mockClientProxy,
        },
      ],
    })
      .overrideGuard(ClerkAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UserController>(UserController);
    userService = module.get(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUser', () => {
    it('should return all users', async () => {
      const mockResult = {
        data: [
          { id: '1', name: 'User 1', email: 'user1@example.com' },
          { id: '2', name: 'User 2', email: 'user2@example.com' },
        ],
      };

      userService.getUsers.mockResolvedValue(mockResult);

      const result = await controller.getUser();

      expect(userService.getUsers).toHaveBeenCalledWith();
      expect(result).toEqual(mockResult);
    });

    it('should handle service errors', async () => {
      const error = new Error('Service unavailable');
      userService.getUsers.mockRejectedValue(error);

      await expect(controller.getUser()).rejects.toThrow(error);
      expect(userService.getUsers).toHaveBeenCalledWith();
    });
  });
});
