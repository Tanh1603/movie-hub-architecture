import {
  Gender,
  StaffStatus,
  WorkType,
  StaffPosition,
  ShiftType,
} from '@movie-hub/shared-types/user/enum';
import type { PaginatedResponse, PaginationParams } from './api.type';

export { Gender, StaffStatus, WorkType, StaffPosition, ShiftType };

export interface Staff {
  id: string;
  cinemaId: string;
  fullName: string;
  email: string;
  phone: string;
  gender: Gender | string;
  dob: string | Date;
  position: StaffPosition | string;
  status: StaffStatus | string;
  workType: WorkType | string;
  shiftType: ShiftType | string;
  salary: number;
  hireDate: string | Date;
}

export interface CreateStaffRequest {
  cinemaId: string;
  fullName: string;
  email: string;
  phone: string;
  gender: Gender | string;
  dob: string | Date;
  position: StaffPosition | string;
  status: StaffStatus | string;
  workType: WorkType | string;
  shiftType: ShiftType | string;
  salary: number;
  hireDate: string | Date;
}

export interface CreateStaffResponse {
  id: string;
  cinemaId: string;
  fullName: string;
  email: string;
  phone: string;
  gender: Gender;
  dob: string | Date;
  position: StaffPosition;
  status: StaffStatus;
  workType: WorkType;
  shiftType: ShiftType;
  salary: number;
  hireDate: string | Date;
  createdAt: string | Date;
}

export interface UpdateStaffRequest {
  fullName?: string;
  phone?: string;
  gender?: Gender | string;
  dob?: string | Date;
  position?: StaffPosition | string;
  status?: StaffStatus | string;
  workType?: WorkType | string;
  shiftType?: ShiftType | string;
  salary?: number;
  hireDate?: string | Date;
}

export interface UpdateStaffResponse {
  id: string;
  cinemaId: string;
  fullName: string;
  email: string;
  phone: string;
  gender: Gender;
  dob: string | Date;
  position: StaffPosition;
  status: StaffStatus;
  workType: WorkType;
  shiftType: ShiftType;
  salary: number;
  hireDate: string | Date;
  updatedAt: string | Date;
}

export type GetStaffResponse = PaginatedResponse<Staff>;

export interface DeleteStaffResponse {
  success: boolean;
  message?: string;
}

export interface StaffFiltersParams extends PaginationParams {
  cinemaId?: string;
  fullName?: string;
  gender?: Gender;
  position?: StaffPosition;
  status?: StaffStatus;
  workType?: WorkType;
  shiftType?: ShiftType;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
