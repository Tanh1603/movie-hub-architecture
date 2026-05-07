# User Service - Integration Test Documentation

> **Purpose:** Source of truth for Integration Tests for the User Service.
>
> **Service:** `user-service` > **Protocol:** TCP Microservice (NestJS `@MessagePattern`)
> **Database:** PostgreSQL (Roles, Permissions, Staff, Settings)
> **Identity Provider:** Clerk (via `clerk-sdk-node`)
> **Caching:** Redis (`cache-manager`)

---

## Table of Contents

1. [User Module](#1-user-module)
   - [getPermissions](#11-getpermissions)
   - [getUser (List)](#12-getuser-list)
   - [getUserDetail](#13-getuserdetail)
   - [findSettingVariables](#14-findsettingvariables)
   - [updateSettingVariable](#15-updatesettingvariable)
2. [Staff Module](#2-staff-module)
   - [createStaff](#21-createstaff)
   - [findAllStaff](#22-findallstaff)
   - [findOneStaff](#23-findonestaff)
   - [updateStaff](#24-updatestaff)
   - [removeStaff](#25-removestaff)

---

## 1. User Module

### 1.1 getPermissions

**Summary:** Retrieves a list of permission names for a specific user based on their roles. Caches results in Redis.

#### The Contract (Inputs/Outputs)

**Message Pattern:** `USER.GET_PERMISSIONS`

| **Inputs** | **Type** | **Required** | **Constraints**      |
| ---------- | -------- | ------------ | -------------------- |
| `userId`   | `string` | ✅           | User ID (from Clerk) |

**Output:** `string[]` (Array of permission names)

#### Dependencies & Mocks

| **Dependency**  | **Type** | **Note for Tester**                                        |
| --------------- | -------- | ---------------------------------------------------------- |
| `PrismaService` | Database | Tables: `Permission`, `Role`, `UserRole`, `RolePermission` |
| `CACHE_MANAGER` | Redis    | Mock `get` (cache hit) and `set` (cache miss)              |

#### Test Scenarios

| **Scenario**      | **Type**   | **Expected Result**                            |
| ----------------- | ---------- | ---------------------------------------------- |
| Cache Hit         | ✅ Success | Returns permissions from Cache (DB not called) |
| Cache Miss        | ✅ Success | Queries DB, Returns permissions, Sets Cache    |
| User has no roles | ✅ Success | Returns empty array                            |

---

### 1.2 getUser (List)

**Summary:** Retrieves a list of users from the external Identity Provider (Clerk).

#### The Contract (Inputs/Outputs)

**Message Pattern:** `USER.GET_USERS`

**Output:** Object containing user list (Structure depends on Clerk SDK)

#### Dependencies & Mocks

| **Dependency** | **Type**     | **Note for Tester**                             |
| -------------- | ------------ | ----------------------------------------------- |
| `clerkClient`  | External SDK | **MUST MOCK** `clerkClient.users.getUserList()` |

---

### 1.3 getUserDetail

**Summary:** Retrieves detailed profile of a single user from Clerk.

#### The Contract (Inputs/Outputs)

**Message Pattern:** `USER.GET_USER_DETAIL`

| **Inputs** | **Type** | **Required** | **Constraints**     |
| ---------- | -------- | ------------ | ------------------- |
| `userId`   | `string` | ✅           | Valid Clerk User ID |

**Output (Success):**

```typescript
{
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  imageUrl: string;
}
```

#### Test Scenarios

| **Scenario**              | **Type**   | **Expected Result**          |
| ------------------------- | ---------- | ---------------------------- |
| Valid User ID             | ✅ Success | Returns mapped user profile  |
| Clerk returns error (404) | ❌ Failure | Should handle upstream error |

---

### 1.4 findSettingVariables

**Summary:** Retrieves system settings (key-value pairs) from the database.

**Message Pattern:** `CONFIG.GET_LIST`

**Output:** `{ data: Setting[] }`

---

### 1.5 updateSettingVariable

**Summary:** Updates a system setting value or description.

**Message Pattern:** `CONFIG.UPDATED`

| **Inputs**    | **Type**     | **Required** | **Constraints**      |
| ------------- | ------------ | ------------ | -------------------- |
| `key`         | `string`     | ✅           | Existing setting key |
| `value`       | `JsonObject` | ❌           | JSON structure       |
| `description` | `string`     | ❌           | -                    |

---

## 2. Staff Module

### 2.1 createStaff

**Summary:** Creates a new staff member record.

#### The Contract (Inputs/Outputs)

**Message Pattern:** `STAFF.CREATED`

| **Inputs**  | **Type**        | **Required** | **Constraints**                       |
| ----------- | --------------- | ------------ | ------------------------------------- |
| `cinemaId`  | `string`        | ✅           | Valid UUID                            |
| `fullName`  | `string`        | ✅           | -                                     |
| `email`     | `string`        | ✅           | Unique                                |
| `phone`     | `string`        | ✅           | -                                     |
| `gender`    | `Gender`        | ✅           | `MALE` \| `FEMALE` \| `OTHER`         |
| `dob`       | `string`        | ✅           | ISO Date                              |
| `position`  | `StaffPosition` | ✅           | e.g. `TICKET_CLERK`, `CINEMA_MANAGER` |
| `status`    | `StaffStatus`   | ✅           | `ACTIVE` \| `INACTIVE`                |
| `workType`  | `WorkType`      | ✅           | `FULL_TIME` \| `PART_TIME`            |
| `shiftType` | `ShiftType`     | ✅           | `MORNING` \| `AFTERNOON`              |
| `salary`    | `number`        | ✅           | Decimal                               |
| `hireDate`  | `string`        | ✅           | ISO Date                              |

**Output:**

```typescript
{
  data: StaffResponse,
  message: 'Create staff successfully!'
}
```

---

### 2.2 findAllStaff

**Summary:** Lists staff with extensive filtering options.

**Message Pattern:** `STAFF.GET_LIST`

| **Inputs (Filters)**                                                                             |
| ------------------------------------------------------------------------------------------------ |
| `cinemaId`, `gender`, `position`, `status`, `workType`, `shiftType`, `fullName` (partial), `dob` |

---

### 2.3 findOneStaff

**Summary:** Retrieves a single staff member.

**Message Pattern:** `STAFF.GET_DETAIL`

---

### 2.4 updateStaff

**Summary:** Updates staff details.

**Message Pattern:** `STAFF.UPDATED`

---

### 2.5 removeStaff

**Summary:** Deletes a staff member.

**Message Pattern:** `STAFF.DELETED`
