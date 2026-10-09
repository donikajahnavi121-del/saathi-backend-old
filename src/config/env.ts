import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/saathi_db?schema=public',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'saathi_access_secret_super_secure_key_2026_adherence_care',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'saathi_refresh_secret_super_secure_key_2026_adherence_care',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  PHOTO_UPLOAD_DIR: process.env.PHOTO_UPLOAD_DIR || './uploads/photos',
  MAX_PHOTO_SIZE_BYTES: parseInt(process.env.MAX_PHOTO_SIZE_BYTES || '5242880', 10),

  // Demo API Keys (raw values used in headers)
  FRONTEND_API_KEY: process.env.FRONTEND_API_KEY || 'saathi_fe_key_2026_prod_demo_live',
  IVR_API_KEY: process.env.IVR_API_KEY || 'saathi_ivr_key_2026_webhook_secure',
  ADMIN_API_KEY: process.env.ADMIN_API_KEY || 'saathi_adm_key_2026_supervisor_tool',
};
