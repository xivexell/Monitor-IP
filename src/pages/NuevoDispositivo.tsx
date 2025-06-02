import React from 'react';
import FormularioDispositivo from '../components/dispositivos/FormularioDispositivo';
import db, { Dispositivo } from '../database/db';
import monitorService from '../services/MonitorService';

const NuevoDispositivo: React.FC = () => {
  // Función para crear nuevo dispositivo
  const crearDispositivo = async (dispositivo: Dispositivo): Promise<boolean> => {
    try {
      // Agregar dispositivo a la base de datos
      const id = await db.dispositivos.add(dispositivo);
      
      // Si está activo, iniciar monitoreo
      if (dispositivo.activo && id) {
        const dispositivoConId = { ...dispositivo, id };
        monitorService.iniciarMonitoreoDispositivo(dispositivoConId);
      }
      
      return true;
    } catch (error) {
      console.error('Error al crear dispositivo:', error);
      return false;
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-neutral-800 mb-6">Agregar nuevo dispositivo</h2>
      <FormularioDispositivo 
        onSubmit={crearDispositivo}
        modo="crear"
      />
    </div>
  );
};

export default NuevoDispositivo;