import rateLimit from 'express-rate-limit';
import { config } from '../config.js';

export const uploadRateLimit = rateLimit({
  windowMs: config.rateLimit.upload.windowMs,
  max: config.rateLimit.upload.max,
  message: { error: config.rateLimit.upload.message },
  standardHeaders: true,
  legacyHeaders: false,
});

export const convertRateLimit = rateLimit({
  windowMs: config.rateLimit.convert.windowMs,
  max: config.rateLimit.convert.max,
  message: { error: config.rateLimit.convert.message },
  standardHeaders: true,
  legacyHeaders: false,
});

export const downloadRateLimit = rateLimit({
  windowMs: config.rateLimit.download.windowMs,
  max: config.rateLimit.download.max,
  message: { error: config.rateLimit.download.message },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiRateLimit = rateLimit({
  windowMs: config.rateLimit.api.windowMs,
  max: config.rateLimit.api.max,
  message: { error: config.rateLimit.api.message },
  standardHeaders: true,
  legacyHeaders: false,
});
