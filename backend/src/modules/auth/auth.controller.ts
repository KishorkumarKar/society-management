import {Router} from 'express';
import {AuthService} from './auth.service';
import {loginSchema, refreshSchema, logoutSchema} from './auth.validators';
import {validate} from '../../validators/validate.middleware';
import {asyncHandler} from '../../utils/async-handler';
import {ok} from '../../utils/api-response';
import {loginRateLimiter} from '../../middleware/rate-limit.middleware';

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Authenticate with society + email/phone + password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [society, password]
 *             properties:
 *               society: {type: string, example: green-valley}
 *               email: {type: string, example: kishor@example.com}
 *               phone: {type: string, example: '9876543210'}
 *               password: {type: string, format: password}
 *     responses:
 *       200: {description: Login successful}
 *       401: {description: Invalid credentials}
 *       403: {description: Society or user inactive}
 */
export function buildAuthRouter(authService: AuthService): Router {
  const router = Router();

  router.post(
    '/login',
    loginRateLimiter,
    validate(loginSchema),
    asyncHandler(async (req, res) => {
      const result = await authService.login(req.body);
      return ok(res, result);
    }),
  );

  /**
   * @openapi
   * /auth/refresh:
   *   post:
   *     tags: [Auth]
   *     summary: Rotate a refresh token for a new access token
   *     responses:
   *       200: {description: New token pair issued}
   *       401: {description: Invalid or expired refresh token}
   */
  router.post(
    '/refresh',
    validate(refreshSchema),
    asyncHandler(async (req, res) => {
      const result = await authService.refresh(req.body.refreshToken);
      return ok(res, result);
    }),
  );

  /**
   * @openapi
   * /auth/logout:
   *   post:
   *     tags: [Auth]
   *     summary: Revoke a refresh token
   *     responses:
   *       200: {description: Logged out}
   */
  router.post(
    '/logout',
    validate(logoutSchema),
    asyncHandler(async (req, res) => {
      await authService.logout(req.body.refreshToken);
      return ok(res, {loggedOut: true});
    }),
  );

  return router;
}
