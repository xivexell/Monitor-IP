// Interfaces
export interface Dispositivo {
  id?: number;
  ip: string;
  alias: string;
  descripcion?: string;
  activo: boolean;
  intervalo: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegistroPing {
  id?: number;
  dispositivoId: number;
  timestamp: Date;
  latencia: number | null;
  activo: boolean;
  respuesta: string;
}

export interface ConfiguracionApp {
  id?: number;
  nombreEmpresa: string;
  nombreAplicacion: string;
  logotipo?: string;
  tiempoActualizacion: number;
  umbralLatencia: number;
  intentosReconexion: number;
  sidebarExpandido: boolean;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class Database {
  // Dispositivos
  async getDispositivos(): Promise<Dispositivo[]> {
    const response = await fetch(`${API_URL}/dispositivos`);
    const data = await response.json();
    return data.map(this.mapearDispositivo);
  }

  async getDispositivo(id: number): Promise<Dispositivo | undefined> {
    const response = await fetch(`${API_URL}/dispositivos/${id}`);
    if (!response.ok) return undefined;
    const data = await response.json();
    return this.mapearDispositivo(data);
  }

  async addDispositivo(dispositivo: Dispositivo): Promise<number> {
    const response = await fetch(`${API_URL}/dispositivos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dispositivo)
    });
    const data = await response.json();
    return data.insertId;
  }

  async updateDispositivo(id: number, dispositivo: Partial<Dispositivo>): Promise<boolean> {
    const response = await fetch(`${API_URL}/dispositivos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dispositivo)
    });
    return response.ok;
  }

  async deleteDispositivo(id: number): Promise<boolean> {
    const response = await fetch(`${API_URL}/dispositivos/${id}`, {
      method: 'DELETE'
    });
    return response.ok;
  }

  // Registros Ping
  async getRegistrosPing(dispositivoId: number, fechaInicio?: Date, fechaFin?: Date): Promise<RegistroPing[]> {
    let url = `${API_URL}/registros/${dispositivoId}`;
    if (fechaInicio && fechaFin) {
      url += `?inicio=${fechaInicio.toISOString()}&fin=${fechaFin.toISOString()}`;
    }
    const response = await fetch(url);
    const data = await response.json();
    return data.map(this.mapearRegistroPing);
  }

  async getUltimoPing(dispositivoId: number): Promise<RegistroPing | undefined> {
    const registros = await this.getRegistrosPing(dispositivoId);
    return registros[0];
  }

  async getUltimaCaida(dispositivoId: number): Promise<RegistroPing | undefined> {
    const response = await fetch(`${API_URL}/registros/${dispositivoId}/ultima-caida`);
    if (!response.ok) return undefined;
    const data = await response.json();
    return this.mapearRegistroPing(data);
  }

  async addRegistroPing(registro: RegistroPing): Promise<number> {
    const response = await fetch(`${API_URL}/registros`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registro)
    });
    const data = await response.json();
    return data.insertId;
  }

  // Configuración
  async getConfiguracion(): Promise<ConfiguracionApp | undefined> {
    const response = await fetch(`${API_URL}/configuracion`);
    if (!response.ok) return undefined;
    const data = await response.json();
    return this.mapearConfiguracion(data);
  }

  async updateConfiguracion(config: Partial<ConfiguracionApp>): Promise<boolean> {
    const response = await fetch(`${API_URL}/configuracion`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return response.ok;
  }

  // Funciones auxiliares de mapeo
  private mapearDispositivo(data: any): Dispositivo {
    return {
      id: data.id,
      ip: data.ip,
      alias: data.alias,
      descripcion: data.descripcion,
      activo: Boolean(data.activo),
      intervalo: data.intervalo,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  private mapearRegistroPing(data: any): RegistroPing {
    return {
      id: data.id,
      dispositivoId: data.dispositivo_id,
      timestamp: new Date(data.timestamp),
      latencia: data.latencia,
      activo: Boolean(data.activo),
      respuesta: data.respuesta
    };
  }

  private mapearConfiguracion(data: any): ConfiguracionApp {
    return {
      id: data.id,
      nombreEmpresa: data.nombre_empresa,
      nombreAplicacion: data.nombre_aplicacion,
      logotipo: data.logotipo,
      tiempoActualizacion: data.tiempo_actualizacion,
      umbralLatencia: data.umbral_latencia,
      intentosReconexion: data.intentos_reconexion,
      sidebarExpandido: Boolean(data.sidebar_expandido)
    };
  }
}

export const pingDispositivo = async (ip: string): Promise<{latencia: number | null, activo: boolean, respuesta: string}> => {
  try {
    const response = await fetch(`${API_URL}/ping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip })
    });
    return await response.json();
  } catch (error) {
    return {
      latencia: null,
      activo: false,
      respuesta: 'Error al realizar ping'
    };
  }
};

const db = new Database();
export default db;