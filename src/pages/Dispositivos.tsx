import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Edit2, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import db, { Dispositivo } from '../database/db';
import monitorService from '../services/MonitorService';
import { toast } from 'react-toastify';

const Dispositivos: React.FC = () => {
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  const [estadoDispositivos, setEstadoDispositivos] = useState<{[key: number]: boolean}>({});
  const [cargando, setCargando] = useState(true);

  // Cargar lista de dispositivos
  useEffect(() => {
    const cargarDispositivos = async () => {
      try {
        const lista = await db.dispositivos.toArray();
        setDispositivos(lista);
        
        // Obtener estado actual
        const estado = await monitorService.obtenerEstadoActual();
        
        // Extraer solo si está activo o no
        const estadoActivo: {[key: number]: boolean} = {};
        Object.entries(estado).forEach(([id, info]) => {
          const dispositivoId = parseInt(id);
          estadoActivo[dispositivoId] = info.ultimoPing?.activo || false;
        });
        
        setEstadoDispositivos(estadoActivo);
        setCargando(false);
      } catch (error) {
        console.error('Error al cargar dispositivos:', error);
        toast.error('Error al cargar la lista de dispositivos');
        setCargando(false);
      }
    };
    
    cargarDispositivos();
  }, []);

  // Eliminar dispositivo
  const eliminarDispositivo = async (id: number) => {
    if (!window.confirm('¿Está seguro que desea eliminar este dispositivo?')) {
      return;
    }
    
    try {
      // Detener monitoreo para este dispositivo
      monitorService.detenerMonitoreoDispositivo(id);
      
      // Eliminar dispositivo de la base de datos
      await db.dispositivos.delete(id);
      
      // Eliminar registros relacionados
      await db.registrosPing.where('dispositivoId').equals(id).delete();
      
      // Actualizar lista
      setDispositivos(prev => prev.filter(d => d.id !== id));
      toast.success('Dispositivo eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar dispositivo:', error);
      toast.error('Error al eliminar el dispositivo');
    }
  };

  // Cambiar estado de monitoreo (activo/inactivo)
  const cambiarEstadoMonitoreo = async (dispositivo: Dispositivo) => {
    if (!dispositivo.id) return;
    
    try {
      // Cambiar estado
      const nuevoEstado = !dispositivo.activo;
      
      // Actualizar en base de datos
      await db.dispositivos.update(dispositivo.id, { 
        activo: nuevoEstado,
        updatedAt: new Date()
      });
      
      // Iniciar o detener monitoreo
      if (nuevoEstado) {
        const dispositivoActualizado = { ...dispositivo, activo: true };
        monitorService.iniciarMonitoreoDispositivo(dispositivoActualizado);
      } else {
        monitorService.detenerMonitoreoDispositivo(dispositivo.id);
      }
      
      // Actualizar lista
      setDispositivos(prev => 
        prev.map(d => d.id === dispositivo.id ? { ...d, activo: nuevoEstado } : d)
      );
      
      toast.success(
        nuevoEstado 
          ? `Monitoreo iniciado para ${dispositivo.alias}` 
          : `Monitoreo detenido para ${dispositivo.alias}`
      );
    } catch (error) {
      console.error('Error al cambiar estado de monitoreo:', error);
      toast.error('Error al cambiar el estado de monitoreo');
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera con botón de agregar */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-neutral-800">Dispositivos</h2>
        <Link 
          to="/dispositivos/nuevo"
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          <Plus size={18} />
          <span>Nuevo dispositivo</span>
        </Link>
      </div>

      {/* Lista de dispositivos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {cargando ? (
          <div className="p-6 text-center">
            <p className="text-neutral-500">Cargando dispositivos...</p>
          </div>
        ) : dispositivos.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-neutral-500 mb-4">No hay dispositivos configurados.</p>
            <Link 
              to="/dispositivos/nuevo"
              className="inline-block px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              Agregar dispositivo
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Dispositivo
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    IP / Dominio
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Intervalo
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Monitoreo
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {dispositivos.map((dispositivo) => {
                  const id = dispositivo.id as number;
                  const activo = estadoDispositivos[id] || false;
                  
                  return (
                    <tr key={id} className="hover:bg-neutral-50 transition-colors animate-fade-in">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-neutral-900">{dispositivo.alias}</div>
                        {dispositivo.descripcion && (
                          <div className="text-sm text-neutral-500">{dispositivo.descripcion}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-neutral-600">{dispositivo.ip}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-neutral-600">{dispositivo.intervalo} seg.</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          activo ? 'bg-success-100 text-success-800' : 'bg-danger-100 text-danger-800'
                        }`}>
                          {activo ? (
                            <>
                              <Wifi size={12} className="mr-1" />
                              En línea
                            </>
                          ) : (
                            <>
                              <WifiOff size={12} className="mr-1" />
                              Desconectado
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          dispositivo.activo ? 'bg-primary-100 text-primary-800' : 'bg-neutral-100 text-neutral-800'
                        }`}>
                          {dispositivo.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => cambiarEstadoMonitoreo(dispositivo)}
                            className={`p-1 rounded-md ${
                              dispositivo.activo 
                                ? 'text-primary-600 hover:bg-primary-50' 
                                : 'text-neutral-600 hover:bg-neutral-50'
                            }`}
                            title={dispositivo.activo ? 'Detener monitoreo' : 'Iniciar monitoreo'}
                          >
                            <RefreshCw size={18} />
                          </button>
                          <Link
                            to={`/dispositivos/editar/${id}`}
                            className="p-1 rounded-md text-warning-600 hover:bg-warning-50"
                            title="Editar dispositivo"
                          >
                            <Edit2 size={18} />
                          </Link>
                          <button
                            onClick={() => eliminarDispositivo(id)}
                            className="p-1 rounded-md text-danger-600 hover:bg-danger-50"
                            title="Eliminar dispositivo"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dispositivos;