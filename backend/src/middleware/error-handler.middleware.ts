import {Request, Response, NextFunction} from 'express';
import {QueryFailedError} from 'typeorm';
import {ApiError} from '../utils/api-response';
import {config} from '../config/env.config';
import {logger} from '../infrastructure/logging/logger';

function mapDatabaseError(err: QueryFailedError): ApiError {
  const driverError = (err as unknown as {driverError?: {code?: string; errno?: number}}).driverError;
  const code = driverError?.code;

  if (code === 'ER_DUP_ENTRY') {
    return ApiError.conflict('A record with these unique values already exists', 'DUPLICATE_ENTRY');
  }
  if (code === 'ER_NO_REFERENCED_ROW' || code === 'ER_NO_REFERENCED_ROW_2') {
    return ApiError.badRequest('Referenced record does not exist', 'INVALID_REFERENCE');
  }
  if (code === 'ER_ROW_IS_REFERENCED' || code === 'ER_ROW_IS_REFERENCED_2') {
    return ApiError.conflict('This record is referenced by other records and cannot be deleted', 'REFERENCED_ENTITY');
  }
  return ApiError.internal();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  let apiError: ApiError;

  if (err instanceof ApiError) {
    apiError = err;
  } else if (err instanceof QueryFailedError) {
    apiError = mapDatabaseError(err);
  } else if (err instanceof Error && err.name === 'ForbiddenRoleAssignmentError') {
    apiError = ApiError.forbidden(err.message);
  } else {
    apiError = ApiError.internal();
  }

  const isServerError = apiError.statusCode >= 500;
  logger.log(isServerError ? 'error' : 'warn', 'Request error', {
    requestId: req.requestId,
    userId: req.currentUser?.userId ?? null,
    societyId: req.currentUser?.societyId ?? null,
    statusCode: apiError.statusCode,
    code: apiError.code,
    message: apiError.message,
    // Never leak stack traces to the client; only ever to the log file.
    stack: err instanceof Error ? err.stack : undefined,
  });

  res.status(apiError.statusCode).json({
    success: false,
    error: {
      code: apiError.code,
      message: apiError.message,
      ...(apiError.details ? {details: apiError.details} : {}),
      // Stack traces are never included in the response body, in any environment.
    },
  });

  // Defensive belt-and-braces: config is referenced so an accidental future
  // edit that tries to conditionally include a stack trace in production
  // still has the flag available and reviewers see intent is explicit here.
  void config.isProduction;
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {code: 'NOT_FOUND', message: `Route ${req.method} ${req.originalUrl} not found`},
  });
}
