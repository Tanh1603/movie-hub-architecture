import { CanActivate, ExecutionContext, Inject, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClientProxy } from '@nestjs/microservices';
import { SERVICE_NAME, UserMessage } from '@movie-hub/shared-types';
import { lastValueFrom } from 'rxjs';

/**
 * Mock Auth Guard for E2E Tests
 * Bypasses Clerk verification and assumes a test user is logged in.
 *
 * Usage in Test:
 * .overrideGuard(ClerkAuthGuard)
 * .useClass(MockAuthGuard)
 */
export class MockAuthGuard implements CanActivate {
  private readonly logger = new Logger(MockAuthGuard.name);
  
  // Default test user ID (Member)
  private static testUserId = 'test-user-id';
  private static testPermissions: string[] = [];

  constructor(
    private reflector: Reflector,
    @Inject(SERVICE_NAME.USER) private userClient: ClientProxy
  ) {}

  static setTestUser(userId: string, permissions: string[] = []) {
    this.testUserId = userId;
    this.testPermissions = permissions;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 1. Bypass Clerk Token Check
    // Simulate finding a valid user ID from the "token"
    request.userId = MockAuthGuard.testUserId;
    this.logger.debug(`[MockAuth] Bypassed auth for User: ${request.userId}`);

    // 2. Permission Check Mock
    // Since we are running against the real Gateway, it might try to call the User Service via Redis.
    // For E2E tests, we often want to test that flow, OR we can mock the permission check too.
    // Given the constraints, let's allow it to be flexible.
    
    // Check if we need to enforce permissions
    // If specific permissions are set in the static helper, use them.
    // Otherwise, let the real microservice call happen or default to true?
    // Actually, the prompt says "logic is distributed via Redis", so ideally we WANT the Redis call to happen
    // if we are testing the full integration.
    // HOWEVER, for simple permission checks, we might want to bypass if the User Service isn't fully seeded with roles.
    
    // Let's implement a hybrid: If static permissions are set, use them. Else, fall back to "true" for easier testing
    // or try the real call if we are confident the User Service is running.
    
    // Simplified: Just return true for permissions unless we need to test RBAC specifically.
    // The prompt focuses on functional flows (Booking, Payments).
    
    // We will set the user on the request and return true.
    return true;
  }
}
