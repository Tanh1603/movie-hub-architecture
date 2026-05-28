export interface SystemConfig {
  key: string;
  value: unknown;
  description?: string;
  updatedAt?: string;
}

export interface UpdateSystemConfigRequest {
  key: string;
  value: unknown;
  description?: string;
}
