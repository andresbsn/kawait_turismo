const nodemailer = require('nodemailer');
const { ValidationError } = require('../middlewares/errorHandler');

class EmailService {
  constructor() {
    this.transporter = null;
  }

  getConfig() {
    return {
      enabled: process.env.EMAIL_ENABLED !== 'false',
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.EMAIL_PORT || 587),
      secure: process.env.EMAIL_SECURE === 'true',
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER
    };
  }

  validateConfig(config) {
    if (!config.user || !config.pass) {
      throw new ValidationError('Configuración de email incompleta: faltan EMAIL_USER o EMAIL_PASS');
    }
  }

  getTransporter() {
    if (this.transporter) {
      return this.transporter;
    }

    const config = this.getConfig();
    this.validateConfig(config);

    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass
      }
    });

    return this.transporter;
  }

  async verifyConnection() {
    const config = this.getConfig();

    if (!config.enabled) {
      return { enabled: false, verified: false, message: 'Servicio de email deshabilitado' };
    }

    const transporter = this.getTransporter();
    await transporter.verify();

    return { enabled: true, verified: true };
  }

  async sendEmail({ to, subject, text, html, cc, bcc, attachments, replyTo }) {
    const config = this.getConfig();

    if (!config.enabled) {
      return {
        accepted: [],
        rejected: [],
        pending: [to],
        response: 'Servicio de email deshabilitado por configuración (EMAIL_ENABLED=false)'
      };
    }

    if (!to) {
      throw new ValidationError('El destinatario (to) es obligatorio para enviar email');
    }

    if (!subject) {
      throw new ValidationError('El asunto (subject) es obligatorio para enviar email');
    }

    if (!text && !html) {
      throw new ValidationError('Debes enviar al menos text o html en el email');
    }

    const transporter = this.getTransporter();

    return await transporter.sendMail({
      from: config.from,
      to,
      subject,
      text,
      html,
      cc,
      bcc,
      attachments,
      replyTo
    });
  }
}

module.exports = new EmailService();
