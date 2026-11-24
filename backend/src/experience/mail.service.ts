import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
@Injectable()
export class MailService {
  constructor(private readonly config: ConfigService) {}
  frontend(path: string) {
    const base = this.config.get<string>('FRONTEND_URL');
    if (!base) throw new ServiceUnavailableException('Falta configurar FRONTEND_URL.');
    return new URL(path, base).toString();
  }
  async send(to: string, subject: string, text: string) {
    const host = this.config.get<string>('SMTP_HOST');
    const from = this.config.get<string>('SMTP_FROM');
    if (!host || !from) throw new ServiceUnavailableException('El correo todavía no está configurado.');
    const user = this.config.get<string>('SMTP_USER');
    const transport = createTransport({ host,
      port: Number(this.config.get<string>('SMTP_PORT') || 587),
      secure: this.config.get<string>('SMTP_SECURE') === 'true',
      requireTLS: this.config.get<string>('SMTP_SECURE') !== 'true',
      auth: user ? { user, pass: this.config.get<string>('SMTP_PASSWORD') } : undefined,
      connectionTimeout: 10000, socketTimeout: 20000,
    });
    try {
      const result = await transport.sendMail({ from, to, subject, text });
      if (!result.accepted.length) throw new Error('Rejected');
    } catch {
      throw new ServiceUnavailableException('No se pudo enviar el correo. Intenta más tarde.');
    } finally { transport.close(); }
  }
}
