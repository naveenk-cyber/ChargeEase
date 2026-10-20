'use strict';

/** An error carrying an HTTP status and machine-readable code. */
class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message, details) {
    return new ApiError(400, 'VALIDATION_ERROR', message, details);
  }

  static unauthorized(message = 'Authentication required.') {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'You do not have access to this resource.') {
    return new ApiError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'Resource not found.') {
    return new ApiError(404, 'NOT_FOUND', message);
  }

  static conflict(message, details) {
    return new ApiError(409, 'CONFLICT', message, details);
  }

  static tooMany(message = 'Too many requests. Please slow down.') {
    return new ApiError(429, 'RATE_LIMITED', message);
  }
}

/** Wrap an async route handler so rejected promises reach the error middleware. */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { ApiError, asyncHandler };
