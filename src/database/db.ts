import Dexie, { Table } from 'dexie';

// Definición de interfaces para los tipos de datos
export interface Dispositivo {
  id?: number;
  ip: string;
  alias: string;
  descripcion?: string;
  activo: boolean;
  intervalo: number; // intervalo de ping en segundos
  createdAt: Date;
  updatedAt: Date;
}

export interface RegistroPing {
  id?: number;
  dispositivoId: number;
  timestamp: Date;
  latencia: number | null; // en ms
  activo: boolean;
  respuesta: string;
}

export interface ConfiguracionApp {
  id?: number;
  nombreEmpresa: string;
  nombreAplicacion: string;
  logotipo?: string;
  tiempoActualizacion: number; // en segundos
  umbralLatencia: number; // umbral para considerar latencia alta (ms)
  intentosReconexion: number;
  sidebarExpandido: boolean;
}

// Clase para la base de datos
class IPMonitorDB extends Dexie {
  dispositivos!: Table<Dispositivo>;
  registrosPing!: Table<RegistroPing>;
  configuracion!: Table<ConfiguracionApp>;

  constructor() {
    super('IPMonitorDB');
    this.version(1).stores({
      dispositivos: '++id, ip, alias, activo',
      registrosPing: '++id, dispositivoId, timestamp, activo',
      configuracion: '++id'
    });
  }
}

const db = new IPMonitorDB();

// Función para inicializar la base de datos con datos por defecto
export async function initDB() {
  // Comprobar si ya existe la configuración
  const configCount = await db.configuracion.count();
  
  if (configCount === 0) {
    // Insertar configuración predeterminada
    await db.configuracion.add({
      nombreEmpresa: 'Mi Empresa',
      nombreAplicacion: 'MonitorIP',
      tiempoActualizacion: 30,
      umbralLatencia: 100,
      intentosReconexion: 3,
      sidebarExpandido: true
    });
  }
  
  return db;
}

// Función para realizar ping a un dispositivo (simulado)
export async function pingDispositivo(ip: string): Promise<{latencia: number | null, activo: boolean, respuesta: string}> {
  try {
    const startTime = Date.now();
    
    // Simulación de ping mediante una petición HTTP
    // En un entorno real, esto debería usar una API backend que realice pings reales
    const response = await fetch(`https://jsonplaceholder.typicode.com/todos/1?ip=${ip}`, {
      method: 'HEAD',
      // Timeout para simular dispositivos no disponibles
      signal: AbortSignal.timeout(2000)
    });
    
    const endTime = Date.now();
    const latencia = endTime - startTime;
    
    return {
      latencia,
      activo: true,
      respuesta: 'Dispositivo respondiendo correctamente'
    };
  } catch (error) {
    // Simular dispositivo caído
    return {
      latencia: null,
      activo: false,
      respuesta: 'Tiempo de espera agotado'
    };
  }
}

export default db;