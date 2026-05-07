import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { SERVICE_NAME, UserMessage } from '@movie-hub/shared-types';
import { of, throwError } from 'rxjs';

describe('UserService', () => {
  let service: UserService;
  let clientProxy: jest.Mocked<ClientProxy>;

  const mockClientProxy = {
    send: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: SERVICE_NAME.USER,
          useValue: mockClientProxy,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    clientProxy = module.get(SERVICE_NAME.USER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUsers', () => {
    it('should proxy the request to user microservice', async () => {
      const mockResponse = {
        data: [
          { id: '1', name: 'User 1', email: 'user1@example.com' },
          { id: '2', name: 'User 2', email: 'user2@example.com' },
        ],
      };

      clientProxy.send.mockReturnValue(of(mockResponse));

      const result = await service.getUsers();

      expect(clientProxy.send).toHaveBeenCalledWith(UserMessage.GET_USERS, {});
      expect(result).toEqual(mockResponse);
    });

    it('should throw RpcException when microservice fails', async () => {
      const error = new Error('User service unavailable');
      clientProxy.send.mockReturnValue(throwError(() => error));

      await expect(service.getUsers()).rejects.toThrow(error);
      expect(clientProxy.send).toHaveBeenCalledWith(UserMessage.GET_USERS, {});
    });
  });
});
