import type { PaginatedResponse, PaginationParams } from './api.type';

export interface Review {
  id: string;
  movieId: string;
  userId: string;
  rating: number;
  content: string;
  createdAt: string | Date;
  title?: string;
  helpfulCount?: number;
  updatedAt?: string | Date;
  movieTitle?: string;
  userName?: string;
  userEmail?: string;
}

export type GetReviewsResponse = PaginatedResponse<Review>;

export interface DeleteReviewResponse {
  success: boolean;
  message?: string;
}

export interface ReviewFiltersParams extends PaginationParams {
  rating?: number;
  userId?: string;
  movieId?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateReviewRequest {
  movieId: string;
  userId: string;
  rating: number;
  content: string;
}

export interface UpdateReviewRequest {
  rating?: number;
  content?: string;
}
