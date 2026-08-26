import 'reflect-metadata';
import * as fs from 'fs';
import {config} from './config/env.config';
import {getDataSource, AppDataSource} from './infrastructure/database/data-source';
import {createApp} from './app';
import {logger} from './infrastructure/logging/logger';

async function bootstrap(): Promise<void> {
  if (!fs.existsSync(config.log.dir)) {
    fs.mkdirSync(config.log.dir, {recursive: true});
  }

  const dataSource = await getDataSource();
  logger.info('Database connection established', {database: config.db.database, host: config.db.host});

  const app = createApp(dataSource);

  const server = app.listen(config.port, config.host, () => {
    console.log(`Society Management API listening on http://${config.host}:${config.port}${config.apiPrefix}`)
    logger.info(`Society Management API listening on http://${config.host}:${config.port}${config.apiPrefix}`, {
      env: config.env,
    });
    logger.info(`API docs available at http://${config.host}:${config.port}${config.apiPrefix}/docs`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully`);
    server.close(async () => {
      try {
        if (AppDataSource.isInitialized) {
          await AppDataSource.destroy();
        }
        logger.info('Shutdown complete');
        process.exit(0);
      } catch (err) {
        logger.error('Error during shutdown', {error: err instanceof Error ? err.message : String(err)});
        process.exit(1);
      }
    });

    // Force-exit if graceful shutdown hangs.
    setTimeout(() => {
      logger.error('Graceful shutdown timed out, forcing exit');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', {reason: reason instanceof Error ? reason.message : String(reason)});
  });
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', {error: err.message, stack: err.stack});
    // Uncaught exceptions leave the process in an unknown state — exit and
    // let the orchestrator (Docker/PM2/k8s) restart it cleanly.
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  // Logger may not be safely usable if bootstrap failed very early
  // (e.g. bad DB credentials) — fall back to console as a last resort.
  // eslint-disable-next-line no-console
  console.error('Fatal error during bootstrap:', err);
  process.exit(1);
});
