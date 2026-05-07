# Role-Based Access Control (RBAC) System Documentation

## Overview

The RBAC system in Movie Hub is primarily backend-driven, ensuring security by always verifying permissions against the database. However, to provide a seamless User Experience (UX), role information is synced to Clerk's user metadata, allowing the frontend to conditionally render UI elements without additional API calls.

## Architecture

1.  **Source of Truth**: The `Staff` table in the database (`position` column).
2.  **Authentication Provider**: Clerk (handles Identity & Tokens).
3.  **Authorization Enforcement**: `ClerkAuthGuard` (Backend) & Clerk Public Metadata (Frontend).

### Roles Reference

The following roles are defined in the `StaffPosition` enum. When configuring Clerk Metadata or creating Staff, use these exact string keys:

- `SUPER_ADMIN`: Unlimited access across all cinemas.
- `CINEMA_MANAGER`: Manages a specific cinema location.
- `ASSISTANT_MANAGER`
- `TICKET_CLERK`
- `CONCESSION_STAFF`
- `USHER`
- `PROJECTIONIST`
- `CLEANER`
- `SECURITY`

**Critical Security Note**:
If Clerk `publicMetadata` is **null** or the `role` key is missing, the user is treated as a **Customer** (Guest) and will be **denied access** to any admin functionality. You must explicitly set a role in Clerk for staff members to access the dashboard.

### Clerk Dashboard Configuration

To manually assign a role to a user in the Clerk Dashboard:

1.  Go to **Users** in the Clerk Dashboard.
2.  Select the user you want to update.
3.  Scroll down to the **Metadata** section.
4.  In the **Public Metadata** field, enter the JSON object with the `role` key matching one of the strings above.

**Example Configuration:**

```json
{
  "role": "CINEMA_MANAGER",
  "cinemaId": "your-cinema-id-uuid",
  "staffId": "optional-staff-db-id"
}
```

## Data Flow

### 1. Staff Creation & Role Assignment

- **Trigger**: Admin creates a new staff member via the Admin Dashboard.
- **Process**:
  1.  Frontend sends `CreateStaffRequest` to `api-gateway`.
  2.  `StaffService` calls `user-service` to create the Staff record in PostgreSQL.
  3.  `StaffService` then checks if a Clerk user exists for the email.
      - If **No**: Creates a new passwordless Clerk user (allowing sign-in via email code).
      - If **Yes**: Updates the existing user.
  4.  `StaffService` updates the Clerk user's `publicMetadata` with:
      ```json
      {
        "role": "CINEMA_MANAGER", // dto.position
        "cinemaId": "..."
      }
      ```

### 2. Authentication & Guard Logic (`ClerkAuthGuard`)

The `ClerkAuthGuard` ensures that the user is a valid staff member and determines their role **dynamically** for every request. It does **not** blindly trust the Clerk Metadata (which could be stale).

1.  **Verify Token**: Validates the Clerk JWT.
2.  **Enrich Context**:
    - Extracts `email` from the Clerk user details.
    - Queries the `Staff` service using this email.
    - If found, attaches `staffContext` to the request object:
      ```typescript
      request.staffContext = {
        staffId: '...',
        cinemaId: '...',
        role: 'CINEMA_MANAGER',
      };
      ```
3.  **Check Permissions**: If the route requires specific permissions, it checks against this enriched context.

### 3. Frontend Conditional Rendering

The frontend uses Clerk's `useUser()` hook to access `publicMetadata`.

- **Usage**: `user.publicMetadata.role`.
- **Logic**:
  - Hide "Add Movie" / "Delete Movie" if `role === 'CINEMA_MANAGER'`.
  - Hide "Add Cinema" / "Delete Cinema" if `role === 'CINEMA_MANAGER'`.
- **Constraint**: This is purely for UX (hiding buttons). Security is enforced by the API.

## Troubleshooting

### Issue: User has "No Role" or Buttons are missing/visible incorrectly.

- **Cause**: Clerk Identity is not linked to a Staff record, or Metadata is out of sync.
- **Fix**:
  1.  Check if the Staff record exists in the database with the correct email.
  2.  Check Clerk Dashboard: Does the user exist? Does their `publicMetadata` contain `role` and `cinemaId`?
  3.  **Resync**: Trigger an update on the staff member (e.g., change position to something else and back) to force `StaffService` to re-sync metadata.

### Issue: "ForbiddenResource" API Error.

- **Cause**: The user might have the UI button (stale metadata), but the Backend Guard blocked the request.
- **Fix**:
  1.  Verify the `ClerkAuthGuard` logs.
  2.  Ensure the email in Clerk matches the email in the `Staff` table exactly.

### Issue: Role Mismatch (Numeric vs String).

- **Cause**: If the API sends a numeric enum value (`0`) instead of string (`"CINEMA_MANAGER"`).
- **Prevention**: The system assumes string payloads for Enums. Ensure `CreateStaffRequest` payloads always use string keys for the `position` field.
