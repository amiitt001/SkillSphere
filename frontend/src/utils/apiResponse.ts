import { NextResponse } from 'next/server';

/**
 * Standardized API success response helper.
 * @param data The payload to return.
 * @param status HTTP status code (default 200).
 */
export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(data, {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Standardized API error response helper.
 * @param message The developer-friendly or user-friendly error message.
 * @param status HTTP status code (default 500).
 * @param details Optional internal error details (only exposed in non-production).
 */
export function errorResponse(message: string, status: number = 500, details?: any) {
  const isDev = process.env.NODE_ENV === 'development';
  
  const payload = {
    error: message,
    ...(isDev && details ? { details: details instanceof Error ? details.message : details } : {}),
  };

  return NextResponse.json(payload, {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
