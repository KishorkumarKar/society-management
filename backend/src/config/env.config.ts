import * as dotenv from 'dotenv';
import * as Joi from 'joi';

dotenv.config();

/**
 * Every environment variable the application depends on is validated once,
 * at boot time, so misconfiguration fails fast instead of surfacing as a
 * confusing runtime error deep inside a request handler.
 */
const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().default(3000),
  HOST: Joi.string().default('0.0.0.0'),
  API_PREFIX: Joi.string().default('/api/v1'),
  CORS_ORIGIN: Joi.string().default('*'),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(3306),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().allow('').required(),
  DB_DATABASE: Joi.string().required(),
  DB_SYNCHRONIZE: Joi.boolean().default(false),
  DB_LOGGING: Joi.boolean().default(false),
  DB_POOL_SIZE: Joi.number().default(10),

  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),
  JWT_ISSUER: Joi.string().default('society-management-api'),

  BCRYPT_SALT_ROUNDS: Joi.number().default(12),

  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000),
  RATE_LIMIT_MAX: Joi.number().default(300),
  LOGIN_RATE_LIMIT_WINDOW_MS: Joi.number().default(900000),
  LOGIN_RATE_LIMIT_MAX: Joi.number().default(10),

  ACL_CACHE_TTL_SECONDS: Joi.number().default(300),

  LOG_LEVEL: Joi.string().default('info'),
  LOG_DIR: Joi.string().default('logs'),

  SEED_DEFAULT_PASSWORD: Joi.string().default('Password@123'),
}).unknown(true);

const { error, value: env } = envSchema.validate(process.env, {
  abortEarly: false,
});

if (error) {
  // Intentionally thrown synchronously at import time: the app must not
  // start with an invalid/missing configuration.
  throw new Error(`Invalid environment configuration: ${error.message}`);
}

export const config = {
  env: env.NODE_ENV as 'development' | 'test' | 'production',
  isProduction: env.NODE_ENV === 'production',
  port: env.PORT as number,
  host: env.HOST as string,
  apiPrefix: env.API_PREFIX as string,
  corsOrigins: (env.CORS_ORIGIN as string).split(',').map((s: string) => s.trim()),
  supperAdminCode:"Super Admin",

  db: {
    host: env.DB_HOST as string,
    port: env.DB_PORT as number,
    username: env.DB_USERNAME as string,
    password: env.DB_PASSWORD as string,
    database: env.DB_DATABASE as string,
    synchronize: env.DB_SYNCHRONIZE as boolean,
    logging: env.DB_LOGGING as boolean,
    poolSize: env.DB_POOL_SIZE as number,
  },

  jwt: {
    accessSecret: env.JWT_ACCESS_SECRET as string,
    accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN as string,
    refreshSecret: env.JWT_REFRESH_SECRET as string,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN as string,
    issuer: env.JWT_ISSUER as string,
  },

  bcryptSaltRounds: env.BCRYPT_SALT_ROUNDS as number,

  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS as number,
    max: env.RATE_LIMIT_MAX as number,
  },
  loginRateLimit: {
    windowMs: env.LOGIN_RATE_LIMIT_WINDOW_MS as number,
    max: env.LOGIN_RATE_LIMIT_MAX as number,
  },

  aclCacheTtlSeconds: env.ACL_CACHE_TTL_SECONDS as number,

  log: {
    level: env.LOG_LEVEL as string,
    dir: env.LOG_DIR as string,
  },

  seedDefaultPassword: env.SEED_DEFAULT_PASSWORD as string,
};

export type AppConfig = typeof config;
