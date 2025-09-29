// Define API error interface for better type safety
export interface ApiError {
  data?: {
    message?: string;
    detail?: string;
    error?: string;
  };
  message?: string;
  error?: string;
  status?: number;
  originalStatus?: number;
}

export interface ApiErrorData {
  detail?: string;
  message?: string;
  error?: string;
}
