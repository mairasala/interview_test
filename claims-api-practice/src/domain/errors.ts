export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const unauthorized = (message = 'Authentication required') =>
  new AppError(401, 'unauthorized', message);

export const forbidden = (message = 'Forbidden') => new AppError(403, 'forbidden', message);

export const notFound = (what: string) => new AppError(404, 'not_found', `${what} not found`);

export const conflict = (message: string) => new AppError(409, 'conflict', message);

export const invalid = (details: unknown, message = 'Invalid request') =>
  new AppError(400, 'validation_error', message, details);
