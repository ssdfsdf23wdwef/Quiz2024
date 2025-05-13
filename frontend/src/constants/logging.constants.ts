// frontend/src/constants/logging.constants.ts

// flow-tracker.service.ts'den taşınacak FlowCategory enum'u
export enum FlowCategory {
  Navigation = 'Navigation',
  Component = 'Component',
  State = 'State',
  API = 'API',
  Auth = 'Auth',
  Render = 'Render',
  User = 'User',
  Error = 'Error',
  Custom = 'Custom'
}

export const LOG_LEVEL = process.env.NEXT_PUBLIC_LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info'); 