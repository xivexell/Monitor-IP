import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FormularioDispositivo from '../components/dispositivos/FormularioDispositivo';
import db, { Dispositivo } from '../database/db';
import monitorService from '../services/MonitorService';
import { toast } from 'react-toastify';

const EditarDispositivo: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dispositivo, setDispositivo] = useState<Dispositivo | null>(null);
  const [cargando, setCargando] = useState(true);

  // Cargar datos del dispositivo
  useEffect(() => {
    const cargarDispositivo = async () => {
      try {
        if (!id) {
          toast.error('ID de dispositivo no válido');
          navigate('/dispositivos');
          return;
        }
        
        const dispositivoId = parseInt(id);
        const datos = await db.dispositivos.get(dispositivoId);
        
        if (!datos) {
          toast.error('Dispositivo no encontrado');
          navigate('/dispositivos');
          return;
        }
        
        setDispositivo(datos);
        setCargando(false);
      } catch (error) {
        console.error('Error al cargar dispositivo:', error);
        toast.error('Error al cargar los datos del dispositivo');
        navigate('/dispositivos');
      }
    };
    
    cargarDispositivo();
  }, [id, navigate]);

  // Función para actualizar dispositivo
  const actualizarDispositivo = async (dispositivoActualizado: Dispositivo): Promise<boolean> => {
    try {
      if (!dispositivo?.id) return false;
      
      // Actualizar en base de datos
      await db.dispositivos.update(dispositivo.id, dispositivoActualizado);
      
      // Gestionar monitoreo según el nuevo estado
      if (dispositivoActualizado.activo !== dispositivo.activo) {
        if (dispositivoActualizado.activo) {
          monitorService.iniciarMonitoreoDispositivo({
            ...dispositivoActualizado,
            id: dispositivo.id
          });
        } else {
          monitorService.detenerMonitoreoDispositivo(dispositivo.id);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error al actualizar dispositivo:', error);
      return false;
    }
  };

  if (cargando) {
    return (
      <div className="p-6 text-center">
        <p className="text-neutral-500">Cargando datos del dispositivo...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-neutral-800 mb-6">Editar dispositivo</h2>
      {dispositivo && (
        <FormularioDispositivo 
          dispositivo={dispositivo}
          onSubmit={actualizarDispositivo}
          modo="editar"
        />
      )}
    </div>
  );
};

export default EditarDispositivo;