// Define API error interface for better type safety
export interface ApiError {
  data?: {
    message?: string;
    detail?: string;
  };
  message?: string;
  status?: number;
  originalStatus?: number;
}
