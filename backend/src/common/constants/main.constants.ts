export const CORS_WHITELIST = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:4000',
  'http://localhost:5000',
  'http://localhost:3002',
  'http://localhost:8000',
  'http://localhost',
  'http://127.0.0.1',
  'capacitor://localhost',
];

export const HELMET_CONFIG = {
  contentSecurityPolicy: process.env.NODE_ENV === 'production',
  dnsPrefetchControl: false,
  frameguard: true,
  hidePoweredBy: true,
  hsts: false,
  ieNoOpen: false,
  noSniff: true,
  permittedCrossDomainPolicies: false,
  referrerPolicy: false,
  xssFilter: true,
};

export const COMPRESSION_CONFIG = {
  level: 1,
  threshold: 1024,
};

export const VALIDATION_PIPE_CONFIG = {
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: {
    enableImplicitConversion: true,
  },
  validationError: {
    target: false,
    value: false,
  },
};

export const GLOBAL_PREFIX = 'api';
export const DEFAULT_PORT = 3001;
