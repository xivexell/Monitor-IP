import db, { Dispositivo, RegistroPing, pingDispositivo } from '../database/db';
import { toast } from 'react-toastify';
import notificationService from './NotificationService';

// Clase principal del servicio de monitoreo
export class MonitorService {
  private intervaloGlobal: number | null = null;
  private dispositivosMonitoreados: Map<number, NodeJS.Timeout> = new Map();
  private callbackActualizacion: (() => void) | null = null;
  private ultimoEstadoDispositivos: Map<number, boolean> = new Map();

  // Iniciar el monitoreo de todos los dispositivos activos
  async iniciarMonitoreoGlobal(callback: () => void) {
    this.callbackActualizacion = callback;
    
    try {
      // Obtener todos los dispositivos y filtrar los activos en memoria
      const allDispositivos = await db.dispositivos.toArray();
      const dispositivos = allDispositivos.filter(d => d.activo === true);
      
      // Iniciar monitoreo para cada dispositivo
      dispositivos.forEach(dispositivo => {
        this.iniciarMonitoreoDispositivo(dispositivo);
      });
      
      return true;
    } catch (error) {
      console.error('Error al iniciar monitoreo global:', error);
      toast.error('Error al iniciar el monitoreo de dispositivos');
      return false;
    }
  }

  // Detener el monitoreo de todos los dispositivos
  detenerMonitoreoGlobal() {
    // Limpiar todos los intervalos de monitoreo
    this.dispositivosMonitoreados.forEach((intervalo, id) => {
      clearTimeout(intervalo);
    });
    
    this.dispositivosMonitoreados.clear();
    this.callbackActualizacion = null;
    this.ultimoEstadoDispositivos.clear();
  }

  // Iniciar monitoreo para un dispositivo específico
  iniciarMonitoreoDispositivo(dispositivo: Dispositivo) {
    if (!dispositivo.id || !dispositivo.activo) return;
    
    // Si ya está siendo monitoreado, detener el monitoreo actual
    if (this.dispositivosMonitoreados.has(dispositivo.id)) {
      clearTimeout(this.dispositivosMonitoreados.get(dispositivo.id));
    }
    
    // Función recursiva para monitorear en intervalos
    const monitorear = async () => {
      if (!dispositivo.id) return;
      
      try {
        // Realizar ping al dispositivo
        const resultado = await pingDispositivo(dispositivo.ip);
        const timestamp = new Date();
        
        // Guardar resultado en la base de datos
        await db.registrosPing.add({
          dispositivoId: dispositivo.id,
          timestamp,
          latencia: resultado.latencia,
          activo: resultado.activo,
          respuesta: resultado.respuesta
        });
        
        // Verificar cambio de estado
        const estadoAnterior = this.ultimoEstadoDispositivos.get(dispositivo.id);
        if (estadoAnterior !== undefined && estadoAnterior !== resultado.activo) {
          if (!resultado.activo) {
            // Dispositivo caído
            await notificationService.notifyDeviceDown(
              dispositivo.alias,
              dispositivo.ip,
              timestamp
            );
          } else {
            // Dispositivo recuperado
            const ultimaCaida = await db.registrosPing
              .where('dispositivoId')
              .equals(dispositivo.id)
              .and(r => !r.activo)
              .reverse()
              .first();

            if (ultimaCaida) {
              const tiempoCaido = timestamp.getTime() - new Date(ultimaCaida.timestamp).getTime();
              await notificationService.notifyDeviceUp(
                dispositivo.alias,
                dispositivo.ip,
                timestamp,
                tiempoCaido
              );
            }
          }
        }
        
        // Actualizar estado
        this.ultimoEstadoDispositivos.set(dispositivo.id, resultado.activo);
        
        // Programar próximo monitoreo
        if (dispositivo.id && this.callbackActualizacion) {
          this.callbackActualizacion();
          const timeout = setTimeout(monitorear, dispositivo.intervalo * 1000);
          this.dispositivosMonitoreados.set(dispositivo.id, timeout);
        }
      } catch (error) {
        console.error(`Error al monitorear ${dispositivo.ip}:`, error);
        
        // Programar siguiente intento incluso si hay error
        if (dispositivo.id && this.callbackActualizacion) {
          const timeout = setTimeout(monitorear, dispositivo.intervalo * 1000);
          this.dispositivosMonitoreados.set(dispositivo.id, timeout);
        }
      }
    };
    
    // Iniciar el ciclo de monitoreo
    monitorear();
  }

  // Detener monitoreo para un dispositivo específico
  detenerMonitoreoDispositivo(dispositivoId: number) {
    if (this.dispositivosMonitoreados.has(dispositivoId)) {
      clearTimeout(this.dispositivosMonitoreados.get(dispositivoId));
      this.dispositivosMonitoreados.delete(dispositivoId);
      this.ultimoEstadoDispositivos.delete(dispositivoId);
    }
  }

  // Obtener el último estado de todos los dispositivos
  async obtenerEstadoActual() {
    const dispositivos = await db.dispositivos.toArray();
    const resultado: {[key: number]: {dispositivo: Dispositivo, ultimoPing?: RegistroPing}} = {};
    
    for (const dispositivo of dispositivos) {
      if (!dispositivo.id) continue;
      
      // Obtener el último registro de ping para este dispositivo
      const ultimoPing = await db.registrosPing
        .where('dispositivoId')
        .equals(dispositivo.id)
        .reverse()
        .first();
      
      resultado[dispositivo.id] = {
        dispositivo,
        ultimoPing
      };
    }
    
    return resultado;
  }
}

// Instancia única del servicio
const monitorService = new MonitorService();
export default monitorService;