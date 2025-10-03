/**
 * @comment
 * A simple logger utility for server-side logging.
 * This acts as a wrapper around `console.log` for now but can be easily extended
 * to integrate with a more robust logging service (e.g., Pino, Winston, or cloud-specific logging)
 * in a production environment.
 * @how
 * - Provides `info`, `warn`, and `error` methods.
 * - Prepends log messages with a timestamp and log level.
 * @why
 * - Centralizes logging logic, making it easier to switch logging implementations later.
 * - Ensures consistent log formatting.
 * - Differentiates between various severity levels for better log analysis.
 */

type LogLevel = 'info' | 'warn' | 'error';

const formatMessage = (level: LogLevel, message: string) => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
};

export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(formatMessage('info', message), ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(formatMessage('warn', message), ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(formatMessage('error', message), ...args);
  },
};
