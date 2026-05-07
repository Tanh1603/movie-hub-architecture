export interface ValidatePromotionItemDto {
  type: 'ticket' | 'concession';
  id: string;
  quantity: number;
}

export interface ValidatePromotionDto {
  bookingAmount: number;
  userId?: string; // For refund voucher owner validation
  items?: ValidatePromotionItemDto[];
}
