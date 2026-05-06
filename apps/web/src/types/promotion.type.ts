export enum PromotionType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  FREE_ITEM = 'FREE_ITEM',
  POINTS = 'POINTS',
}

export interface PromotionDto {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: PromotionType;
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  validFrom: Date;
  validTo: Date;
  usageLimit?: number;
  usagePerUser?: number;
  currentUsage: number;
  applicableFor: string[];
  conditions?: Record<string, any>;
  active: boolean;
}

export interface ValidatePromotionResponseDto {
  valid: boolean;
  promotion?: PromotionDto;
  discountAmount?: number;
  finalAmount?: number;
  message?: string;
}


export interface ValidatePromotionItemDto {
  type: 'ticket' | 'concession';
  id: string;
  quantity: number;
}

export interface ValidatePromotionDto {
  bookingAmount: number;
  items?: ValidatePromotionItemDto[];
}

// ============================================================================
// ADMIN/API TYPES
// ============================================================================

export interface Promotion {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: PromotionType;
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  validFrom: string | Date;
  validTo: string | Date;
  usageLimit?: number;
  usagePerUser?: number;
  currentUsage: number;
  applicableFor?: string[];
  conditions?: Record<string, unknown>;
  active: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface CreatePromotionRequest {
  code: string;
  name: string;
  description?: string;
  type: PromotionType;
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  validFrom: string | Date;
  validTo: string | Date;
  usageLimit?: number;
  usagePerUser?: number;
  applicableFor?: string[];
  conditions?: Record<string, unknown>;
  active?: boolean;
}

export type UpdatePromotionRequest = Partial<CreatePromotionRequest>;

export interface PromotionFiltersParams {
  active?: boolean | string;
  type?: PromotionType;
}
