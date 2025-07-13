import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';

export interface LoggerOptions {
  fileName?: string;
  directory?: string;
}

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logDir: string;
  private readonly logFile: string;
  private readonly logger = new Logger();

  constructor(options: LoggerOptions = {}) {
    this.logDir = options.directory || 'dist/apps/logs';
    this.logFile = options.fileName || 'access.log';

    // Create logs directory if it doesn't exist
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir);
    }
  }

  use(req: Request, res: Response, next: NextFunction) {
    const timestamp = new Date().toISOString();
    const logEntry = JSON.stringify({
      request: {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        token: req.headers['authorization'],
        host: req.headers.host,
        userAgent: req.headers['user-agent'],
        referer: req.headers.referer,
        connection: req.headers['connection'],
      },
      response: {
        statusCode: res.statusCode,
      },
      timestamp,
    });

    // Write to log file
    fs.appendFileSync(path.join(this.logDir, this.logFile), logEntry + '\n');

    // Also log to console
    this.logger.log(logEntry);

    next();
  }
}
