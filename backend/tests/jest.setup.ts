process.env.NODE_ENV = 'test';
process.env.DB_DATABASE = process.env.TEST_DB_DATABASE || 'society_management_test';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'a'.repeat(64);
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'b'.repeat(64);
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_USERNAME = process.env.DB_USERNAME || 'root';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || '';
process.env.LOG_DIR = process.env.LOG_DIR || 'logs-test';
