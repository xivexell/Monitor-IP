import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-toastify';

interface NotificationConfig {
  telegramBotToken: string;
  telegramChatId: string;
  emailFrom: string;
  emailTo: string[];
  emailPassword: string;
}

class NotificationService {
  private audioContext: AudioContext | null = null;
  private config: NotificationConfig = {
    telegramBotToken: 'YOUR_BOT_TOKEN',
    telegramChatId: 'YOUR_CHAT_ID',
    emailFrom: 'alerts@yourdomain.com',
    emailTo: ['admin@yourdomain.com'],
    emailPassword: 'YOUR_EMAIL_PASSWORD'
  };

  // Inicializar audio context
  private initAudio() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
  }

  // Generar tono de alerta
  private async generateAlertTone() {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime); // La nota A5

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, this.audioContext.currentTime + 0.1);
    gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 1);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 1);
  }

  // Verificar si estamos en horario laboral
  private isDuringWorkHours(): boolean {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hour + minutes / 60;

    // Lunes a viernes (1-5) de 8:00 a 17:30
    return day >= 1 && day <= 5 && currentTime >= 8 && currentTime <= 17.5;
  }

  // Enviar notificación por Telegram
  private async sendTelegramMessage(message: string) {
    try {
      const url = `https://api.telegram.org/bot${this.config.telegramBotToken}/sendMessage`;
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: this.config.telegramChatId,
          text: message,
          parse_mode: 'HTML'
        })
      });
    } catch (error) {
      console.error('Error al enviar mensaje por Telegram:', error);
    }
  }

  // Enviar correo electrónico
  private async sendEmail(subject: string, message: string) {
    // Implementar lógica de envío de correo usando un servicio de backend
    console.log('Enviando correo:', { subject, message });
  }

  // Notificar caída de dispositivo
  async notifyDeviceDown(alias: string, ip: string, timestamp: Date) {
    const formattedTime = format(timestamp, 'dd/MM/yyyy HH:mm:ss', { locale: es });
    const message = `🔴 ALERTA: Dispositivo caído\n\nDispositivo: ${alias}\nIP: ${ip}\nFecha y hora: ${formattedTime}`;

    // Mostrar alerta visual
    toast.error(
      <div className="flex flex-col">
        <div className="font-bold text-lg mb-1">¡Dispositivo caído!</div>
        <div className="text-sm">
          <div><strong>Dispositivo:</strong> {alias}</div>
          <div><strong>IP:</strong> {ip}</div>
          <div><strong>Fecha y hora:</strong> {formattedTime}</div>
        </div>
      </div>,
      {
        position: "top-right",
        autoClose: false,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        className: "bg-danger-50 border-l-4 border-danger-500",
      }
    );

    // Reproducir alerta sonora en horario laboral
    if (this.isDuringWorkHours()) {
      this.initAudio();
      await this.generateAlertTone();
    } else {
      // Fuera de horario laboral, enviar notificaciones alternativas
      await this.sendTelegramMessage(message);
      await this.sendEmail(
        `🔴 Dispositivo caído: ${alias}`,
        message
      );
    }
  }

  // Notificar recuperación de dispositivo
  async notifyDeviceUp(alias: string, ip: string, timestamp: Date, downtime: number) {
    const formattedTime = format(timestamp, 'dd/MM/yyyy HH:mm:ss', { locale: es });
    const downtimeMinutes = Math.round(downtime / 60000);
    const message = `🟢 RECUPERADO: Dispositivo en línea\n\nDispositivo: ${alias}\nIP: ${ip}\nFecha y hora: ${formattedTime}\nTiempo caído: ${downtimeMinutes} minutos`;

    // Mostrar alerta visual
    toast.success(
      <div className="flex flex-col">
        <div className="font-bold text-lg mb-1">¡Dispositivo recuperado!</div>
        <div className="text-sm">
          <div><strong>Dispositivo:</strong> {alias}</div>
          <div><strong>IP:</strong> {ip}</div>
          <div><strong>Fecha y hora:</strong> {formattedTime}</div>
          <div><strong>Tiempo caído:</strong> {downtimeMinutes} minutos</div>
        </div>
      </div>,
      {
        position: "top-right",
        autoClose: 10000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        className: "bg-success-50 border-l-4 border-success-500",
      }
    );

    // Reproducir alerta sonora en horario laboral
    if (this.isDuringWorkHours()) {
      this.initAudio();
      await this.generateAlertTone();
    } else {
      // Fuera de horario laboral, enviar notificaciones alternativas
      await this.sendTelegramMessage(message);
      await this.sendEmail(
        `🟢 Dispositivo recuperado: ${alias}`,
        message
      );
    }
  }
}

const notificationService = new NotificationService();
export default notificationService;