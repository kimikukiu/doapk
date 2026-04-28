import { dbService, LogRecord } from './dbService';

export const errorService = {
  logError: (error: Error, context: { file: string, function: string, metadata?: any }) => {
    const errorMessage = JSON.stringify({
      message: error.message,
      stack: error.stack,
      context
    });
    dbService.log(errorMessage, 'error');
    console.error('Error captured:', errorMessage);
  },

  getRecentErrors: (limit: number = 10) => {
    // Assuming dbService.getLogs() returns all logs, we filter for 'error'
    const allLogs = dbService.getLogs(limit * 2);
    return allLogs.filter((log: LogRecord) => log.level === 'error').slice(0, limit);
  }
};
