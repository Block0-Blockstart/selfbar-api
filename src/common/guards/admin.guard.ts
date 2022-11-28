import { CanActivate, ExecutionContext, Inject, Injectable, Logger } from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../config/app/app.config.service';

const extractFromHeader = (req: Request, header: string): string => {
  const ip = req.header(header.toLowerCase());
  return Array.isArray(ip) ? ip[0] : ip;
};

const getIp = (req: Request): string => {
  return (
    extractFromHeader(req, 'x-forwarded-for') ||
    extractFromHeader(req, 'x-forwarded') ||
    extractFromHeader(req, 'forwarded-for') ||
    extractFromHeader(req, 'forwarded') ||
    req.socket.remoteAddress ||
    'unknown IP'
  );
};

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly logger = new Logger('AdminGuard');
  constructor(@Inject(AppConfigService) private cs: AppConfigService) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const req: Request = context.switchToHttp().getRequest();
    const adminKey = this.cs.COMMON_PRIVATE_KEY;
    const can = req?.headers?.sbadm === adminKey;
    this.logger.verbose(
      can
        ? `IP ${getIp(req)} has been granted admin access using the valid admin pk.`
        : `IP ${getIp(req)} has been refused admin access.`
    );
    return can;
  }
}
