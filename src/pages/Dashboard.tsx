import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Server, FileBarChart, History, Settings } from 'lucide-react';
import EstadisticasGenerales from '../components/dashboard/EstadisticasGenerales';
import ListaDispositivos from '../components/dashboard/ListaDispositivos';
import GraficoLatencia from '../components/dashboard/GraficoLatencia';
import monitorService from '../services/MonitorService';
import reporteService from '../services/ReporteService';

const Dashboard: React.FC = () => {
  const [estadoDispositivos, setEstadoDispositivos] = useState<any>({});
  const [estadisticas, setEstadisticas] = useState({
    totalDispositivos: 0,
    dispositivosActivos: 0,
    dispositivosInactivos: 0,
    latenciaPromedio: null as number | null
  });
  const [cargando, setCargando] = useState(true);

  // Iniciar monitoreo y cargar datos iniciales
  useEffect(() => {
    const iniciarMonitoreo = async () => {
      try {
        // Iniciar el monitoreo de dispositivos
        await monitorService.iniciarMonitoreoGlobal(actualizarEstado);
        
        // Cargar estado inicial
        await actualizarEstado();
        
        // Cargar estadísticas del dashboard
        const resumen = await reporteService.obtenerResumenDashboard();
        setEstadisticas(resumen);
      } catch (error) {
        console.error('Error al iniciar dashboard:', error);
      } finally {
        setCargando(false);
      }
    };

    iniciarMonitoreo();

    // Limpiar al desmontar
    return () => {
      monitorService.detenerMonitoreoGlobal();
    };
  }, []);

  // Función para actualizar el estado
  const actualizarEstado = async () => {
    try {
      const estado = await monitorService.obtenerEstadoActual();
      setEstadoDispositivos(estado);
      
      // Actualizar estadísticas
      const resumen = await reporteService.obtenerResumenDashboard();
      setEstadisticas(resumen);
    } catch (error) {
      console.error('Error al actualizar estado:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera con botón de agregar */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-neutral-800">Panel de Control</h2>
        <Link 
          to="/dispositivos/nuevo"
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          <Plus size={18} />
          <span>Nuevo dispositivo</span>
        </Link>
      </div>

      {/* Estadísticas generales */}
      <EstadisticasGenerales 
        totalDispositivos={estadisticas.totalDispositivos}
        dispositivosActivos={estadisticas.dispositivosActivos}
        dispositivosInactivos={estadisticas.dispositivosInactivos}
        latenciaPromedio={estadisticas.latenciaPromedio}
      />

      {/* Contenido principal en dos columnas en pantallas grandes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de dispositivos (2/3 del espacio) */}
        <div className="lg:col-span-2">
          {cargando ? (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-neutral-500">Cargando dispositivos...</p>
            </div>
          ) : Object.keys(estadoDispositivos).length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-neutral-500 mb-4">No hay dispositivos configurados para monitorear.</p>
              <Link 
                to="/dispositivos/nuevo"
                className="inline-block px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                Agregar dispositivo
              </Link>
            </div>
          ) : (
            <ListaDispositivos dispositivos={estadoDispositivos} />
          )}
        </div>

        {/* Contenido lateral (1/3 del espacio) */}
        <div className="space-y-6">
          {/* Enlaces rápidos */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-lg mb-3">Acciones rápidas</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link 
                to="/dispositivos"
                className="flex flex-col items-center p-3 bg-primary-50 rounded-md hover:bg-primary-100 transition-colors"
              >
                <Server size={24} className="text-primary-600 mb-2" />
                <span className="text-sm text-center">Dispositivos</span>
              </Link>
              <Link 
                to="/reportes"
                className="flex flex-col items-center p-3 bg-warning-50 rounded-md hover:bg-warning-100 transition-colors"
              >
                <FileBarChart size={24} className="text-warning-600 mb-2" />
                <span className="text-sm text-center">Reportes</span>
              </Link>
              <Link 
                to="/historial"
                className="flex flex-col items-center p-3 bg-success-50 rounded-md hover:bg-success-100 transition-colors"
              >
                <History size={24} className="text-success-600 mb-2" />
                <span className="text-sm text-center">Historial</span>
              </Link>
              <Link 
                to="/configuracion"
                className="flex flex-col items-center p-3 bg-neutral-50 rounded-md hover:bg-neutral-100 transition-colors"
              >
                <Settings size={24} className="text-neutral-600 mb-2" />
                <span className="text-sm text-center">Configuración</span>
              </Link>
            </div>
          </div>

          {/* Gráfico de latencia */}
          <GraficoLatencia />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;