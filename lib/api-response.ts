export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  status: number;
}

export function successResponse<T>(data: T, message = 'Success', status = 200): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    status,
  };
}

export function errorResponse(error: string, status = 400): ApiResponse {
  return {
    success: false,
    error,
    status,
  };
}

export function validateRequest<T>(schema: any, data: unknown): { valid: boolean; data?: T; error?: string } {
  try {
    const validated = schema.parse(data);
    return { valid: true, data: validated };
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}

export function validateAuthHeader(authHeader?: string): { valid: boolean; token?: string } {
  if (!authHeader) {
    return { valid: false };
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return { valid: false };
  }

  return { valid: true, token: parts[1] };
}

export function paginate(total: number, limit: number, page: number) {
  const totalPages = Math.ceil(total / limit);
  const skip = (page - 1) * limit;

  return {
    skip,
    limit,
    page,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}
