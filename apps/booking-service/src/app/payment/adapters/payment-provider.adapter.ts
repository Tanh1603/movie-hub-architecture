import { UserDetailDto } from '@movie-hub/shared-types';

export abstract class PaymentProviderAdapter {
  abstract getUserDetail(userId: string): Promise<UserDetailDto>;
}
