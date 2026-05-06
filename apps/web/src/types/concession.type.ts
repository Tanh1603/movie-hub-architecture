export enum ConcessionCategory {
  FOOD = 'FOOD',
  DRINK = 'DRINK',
  COMBO = 'COMBO',
  MERCHANDISE = 'MERCHANDISE',
}

export interface ConcessionDto {
  id: string;
  name: string;
  nameEn?: string;
  description?: string;
  category: ConcessionCategory;
  price: number;
  imageUrl?: string;
  available: boolean;
  inventory: number;
  cinemaId?: string;
  nutritionInfo?: Record<string, any>;
  allergens?: string[];
}

// ============================================================================
// ADMIN/API TYPES
// ============================================================================

export interface Concession {
  id: string;
  name: string;
  nameEn?: string;
  description?: string;
  category: ConcessionCategory;
  price: number;
  imageUrl?: string;
  available: boolean;
  inventory?: number;
  cinemaId?: string;
  nutritionInfo?: Record<string, string | number | boolean>;
  allergens?: string[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface CreateConcessionRequest {
  name: string;
  nameEn?: string;
  description?: string;
  category: ConcessionCategory | string;
  price: number;
  imageUrl?: string;
  available?: boolean;
  inventory?: number;
  cinemaId?: string;
  nutritionInfo?: Record<string, string | number | boolean>;
  allergens?: string[];
}

export interface UpdateConcessionRequest {
  name?: string;
  nameEn?: string;
  description?: string;
  category?: ConcessionCategory | string;
  price?: number;
  imageUrl?: string;
  available?: boolean;
  inventory?: number;
  cinemaId?: string;
  nutritionInfo?: Record<string, string | number | boolean>;
  allergens?: string[];
}

export interface ConcessionFiltersParams {
  cinemaId?: string;
  category?: ConcessionCategory | string;
  available?: boolean;
}
