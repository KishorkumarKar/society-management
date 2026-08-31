import 'reflect-metadata';
import express, {Express} from 'express';
import helmet from 'helmet';
import cors from 'cors';
import {DataSource} from 'typeorm';
import swaggerUi from 'swagger-ui-express';

import {config} from './config/env.config';
import {swaggerSpec} from './infrastructure/swagger';
import {requestIdMiddleware} from './middleware/request-id.middleware';
import {requestLoggingMiddleware} from './middleware/request-logging.middleware';
import {generalRateLimiter} from './middleware/rate-limit.middleware';
import {errorHandler, notFoundHandler} from './middleware/error-handler.middleware';

import {AclService} from './modules/acl/acl.service';
import {AuthService} from './modules/auth/auth.service';
import {UsersService} from './modules/users/users.service';
import {SocietiesService} from './modules/societies/societies.service';
import {FlatsService} from './modules/flats/flats.service';
import {MaintenanceService} from './modules/maintenance/maintenance.service';
import {RolesService} from './modules/roles/roles.service';
import {PermissionsService} from './modules/permissions/permissions.service';
import {NotificationService} from './modules/notifications/notification.service';
import {HallBookingsService} from './modules/hall-bookings/hall-bookings.service';
import {ExpensesService} from './modules/expenses/expenses.service';
import {AnnouncementsService} from './modules/announcements/announcements.service';
import {EventsService} from './modules/events/events.service';
import {EventCollectionsService} from './modules/event-collections/event-collections.service';
import {EventExpensesService} from './modules/event-expenses/event-expenses.service';

import {buildAuthRouter} from './modules/auth/auth.controller';
import {buildUsersRouter} from './modules/users/users.controller';
import {buildSocietiesRouter} from './modules/societies/societies.controller';
import {buildFlatsRouter} from './modules/flats/flats.controller';
import {buildMaintenanceRouter} from './modules/maintenance/maintenance.controller';
import {buildRolesRouter} from './modules/roles/roles.controller';
import {buildPermissionsRouter} from './modules/permissions/permissions.controller';
import {buildNotificationsRouter} from './modules/notifications/notification.controller';
import {buildHallBookingsRouter} from './modules/hall-bookings/hall-bookings.controller';
import {buildExpensesRouter} from './modules/expenses/expenses.controller';
import {buildAnnouncementsRouter} from './modules/announcements/announcements.controller';
import {buildEventsRouter} from './modules/events/events.controller';
import {buildEventCollectionsRouter} from './modules/event-collections/event-collections.controller';
import {buildEventExpensesRouter} from './modules/event-expenses/event-expenses.controller';

/**
 * Builds a fully-wired Express app from an already-initialized DataSource.
 * Kept as a factory (rather than a module-level singleton) so tests can
 * spin up an app against an isolated test database/connection.
 */
export function createApp(dataSource: DataSource): Express {
  const app = express();

  // --- Core security & parsing middleware ---
  app.use(helmet());
  app.use(
    cors({
      origin: config.corsOrigins,
      credentials: true,
    }),
  );
  app.use(express.json({limit: '1mb'}));
  app.use(express.urlencoded({extended: true, limit: '1mb'}));
  app.use(requestIdMiddleware);
  app.use(requestLoggingMiddleware);
  app.use(generalRateLimiter);

  // --- Service layer (constructed once, shared via app.locals for
  //     middleware like authorize() that need AclService without a full
  //     DI container) ---
  const aclService = new AclService(dataSource);
  const authService = new AuthService(dataSource, aclService);
  const usersService = new UsersService(dataSource, aclService);
  const societiesService = new SocietiesService(dataSource);
  const flatsService = new FlatsService(dataSource);
  const maintenanceService = new MaintenanceService(dataSource);
  const rolesService = new RolesService(dataSource, aclService);
  const permissionsService = new PermissionsService(dataSource);
  const notificationService = new NotificationService(dataSource);
  const hallBookingsService = new HallBookingsService(dataSource, notificationService);
  const expensesService = new ExpensesService(dataSource);
  const announcementsService = new AnnouncementsService(dataSource, notificationService);
  const eventsService = new EventsService(dataSource);
  const eventCollectionsService = new EventCollectionsService(dataSource, eventsService);
  const eventExpensesService = new EventExpensesService(dataSource, eventsService);

  app.locals.aclService = aclService;
  app.locals.dataSource = dataSource;

  // --- Health check (unauthenticated, unrated-limited on purpose for
  //     load balancer / orchestrator probes) ---
  app.get('/health', (_req, res) => {
    res.status(200).json({success: true, data: {status: 'ok', timestamp: new Date().toISOString()}});
  });

  // --- API documentation ---
  app.use(`${config.apiPrefix}/docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get(`${config.apiPrefix}/openapi.json`, (_req, res) => res.json(swaggerSpec));

  // --- Routes ---
  const api = express.Router();
  api.use('/auth', buildAuthRouter(authService));
  api.use('/users', buildUsersRouter(usersService));
  api.use('/societies', buildSocietiesRouter(societiesService));
  api.use('/flats', buildFlatsRouter(flatsService));
  api.use('/maintenance-bills', buildMaintenanceRouter(maintenanceService));
  api.use('/roles', buildRolesRouter(rolesService));
  api.use('/permissions', buildPermissionsRouter(permissionsService));
  api.use('/hall-bookings', buildHallBookingsRouter(hallBookingsService));
  api.use('/expenses', buildExpensesRouter(expensesService));
  api.use('/announcements', buildAnnouncementsRouter(announcementsService));
  api.use('/events', buildEventsRouter(eventsService));
  api.use('/event-collections', buildEventCollectionsRouter(eventCollectionsService));
  api.use('/event-expenses', buildEventExpensesRouter(eventExpensesService));
  api.use('/notifications', buildNotificationsRouter(notificationService));

  app.use(config.apiPrefix, api);

  // --- 404 + centralized error handler (must be registered last) ---
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
