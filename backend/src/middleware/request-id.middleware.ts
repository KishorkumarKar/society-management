import {Request, Response, NextFunction} from 'express';
import {v4 as uuidv4} from 'uuid';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header('x-request-id');
  req.requestId = incoming && incoming.length <= 100 ? incoming : uuidv4();
  res.setHeader('x-request-id', req.requestId);
  next();
}
