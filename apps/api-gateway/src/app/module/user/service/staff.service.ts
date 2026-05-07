import {
  CreateStaffRequest,
  SERVICE_NAME,
  StaffQuery,
  UpdateStaffRequest,
  UserMessage,
} from '@movie-hub/shared-types';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { firstValueFrom } from 'rxjs';
@Injectable()
export class StaffService {
  private readonly logger = new Logger(StaffService.name);

  constructor(
    @Inject(SERVICE_NAME.USER) private readonly client: ClientProxy
  ) {}

  async findAll(query: StaffQuery) {
    try {
      return await firstValueFrom(
        this.client.send(UserMessage.STAFF.GET_LIST, query)
      );
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async findOne(id: string) {
    try {
      return await firstValueFrom(
        this.client.send(UserMessage.STAFF.GET_DETAIL, id)
      );
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async create(dto: CreateStaffRequest) {
    // 1. Create Staff in Database
    const staffResult = await firstValueFrom(
      this.client.send(UserMessage.STAFF.CREATED, dto)
    );

    // 2. Sync with Clerk
    try {
      const email = dto.email;
      let clerkUserId: string | null = null;

      // Check if user exists
      const userList = await clerkClient.users.getUserList({
        emailAddress: [email],
      });
      if (userList.data.length > 0) {
        clerkUserId = userList.data[0].id;
        this.logger.debug(`User exists in Clerk: ${clerkUserId}`);
      } else {
        // Create user
        // Generate a random temp password if needed or allow passwordless
        // Clerk Node SDK 'create' parameters:
        const newUser = await clerkClient.users.createUser({
          emailAddress: [email],
          firstName: dto.fullName.split(' ')[0],
          lastName: dto.fullName.split(' ').slice(1).join(' '),
          skipPasswordChecks: true, // Allow unsafe password or no password
          // password: 'TempPassword123!', // Optional: decide if we want to set one
          publicMetadata: {
            role: dto.position,
            cinemaId: dto.cinemaId,
          },
        });
        clerkUserId = newUser.id;
        this.logger.log(`Created new Clerk user: ${clerkUserId}`);
      }

      // Update metadata (in case user existed or just created)
      if (clerkUserId) {
        await clerkClient.users.updateUser(clerkUserId, {
          publicMetadata: {
            role: dto.position,
            cinemaId: dto.cinemaId,
          },
        });
        this.logger.debug(`Updated metadata for user ${clerkUserId}`);
      }
    } catch (clerkError) {
      this.logger.error(
        `Failed to sync with Clerk for ${dto.email}`,
        clerkError
      );
      // We do not revert DB transaction here as staff record is valid.
      // Admin can manually fix or retry.
    }

    return staffResult;
  }

  async update(id: string, dto: UpdateStaffRequest) {
    const result = await firstValueFrom(
      this.client.send(UserMessage.STAFF.UPDATED, { id, data: dto })
    );

    // If position or status changed, update Clerk
    // We need email to find user in Clerk...
    // We'd need to fetch staff first to get email if not provided?
    // Optimization: Skip strict sync on update for now unless critical.
    // Ideally, we fetch the staff 'result.data' which ideally contains email.
    // Let's assume result.data has the updated staff info.

    if (result && result.data && result.data.email) {
      try {
        const userList = await clerkClient.users.getUserList({
          emailAddress: [result.data.email],
        });
        if (userList.data.length > 0) {
          const clerkUserId = userList.data[0].id;
          const updates: any = {};

          // Update role if position changed
          if (dto.position) {
            updates.publicMetadata = {
              ...userList.data[0].publicMetadata,
              role: dto.position,
              // Keep cinemaId (usually doesn't change)
            };
          }

          // If status is INACTIVE, maybe ban user?
          if (dto.status === 'INACTIVE') {
            // updates.banned = true? or locked
            // clerkClient.users.banUser(clerkUserId);
          } else if (dto.status === 'ACTIVE') {
            // clerkClient.users.unbanUser(clerkUserId);
          }

          if (Object.keys(updates).length > 0) {
            await clerkClient.users.updateUser(clerkUserId, updates);
          }
        }
      } catch (e) {
        this.logger.error(`Failed to update Clerk for ${result.data.email}`, e);
      }
    }

    return result;
  }

  async remove(id: string) {
    // Need to find email before deleting to sync Clerk?
    // Or just delete in DB.
    // Ideally we ban the user in Clerk.
    // Let's first get the staff to know email.
    let staffEmail: string | undefined;
    try {
      const staff = await this.findOne(id);
      staffEmail = staff?.data?.email;
    } catch (e) {
      // ignore
    }

    const result = await firstValueFrom(
      this.client.send(UserMessage.STAFF.DELETED, id)
    );

    if (staffEmail) {
      try {
        const userList = await clerkClient.users.getUserList({
          emailAddress: [staffEmail],
        });
        if (userList.data.length > 0) {
          // Delete or Ban?
          await clerkClient.users.deleteUser(userList.data[0].id);
          this.logger.log(`Deleted Clerk user for ${staffEmail}`);
        }
      } catch (e) {
        this.logger.error(`Failed to delete Clerk user ${staffEmail}`, e);
      }
    }

    return result;
  }
}
