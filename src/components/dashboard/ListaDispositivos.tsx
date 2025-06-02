import React from 'react';
import { Link } from 'react-router-dom';
import { Wifi, WifiOff, ExternalLink, AlertTriangle } from 'lucide-react';
import { Dispositivo, RegistroPing } from '../../database/db';

interface ListaDispositivosProps {
  dispositivos: {
    [key: number]: {
      dispositivo: Dispositivo;
      ultimoPing?: RegistroPing;
    };
  };
}

const ListaDispositivos: React.FC<ListaDispositivosProps> = ({ dispositivos }) => {
  // Ordenar dispositivos: primero los inactivos, luego por alias
  const dispositivosOrdenados = Object.values(dispositivos).sort((a, b) => {
    // Primero por estado (inactivos primero)
    const estadoA = a.ultimoPing?.activo || false;
    const estadoB = b.ultimoPing?.activo || false;
    if (estadoA !== estadoB) {
      return estadoA ? 1 : -1;
    }
    
    // Luego por alias (alfabéticamente)
    return a.dispositivo.alias.localeCompare(b.dispositivo.alias);
  });

  if (dispositivosOrdenados.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-neutral-500">No hay dispositivos configurados.</p>
        <Link to="/dispositivos/nuevo" className="inline-block mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
          Agregar dispositivo
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-neutral-200">
        <h3 className="font-semibold text-lg">Estado de Dispositivos</h3>
      </div>
      <div className="divide-y divide-neutral-200 max-h-[400px] overflow-y-auto">
        {dispositivosOrdenados.map(({ dispositivo, ultimoPing }) => {
          const activo = ultimoPing?.activo || false;
          const latencia = ultimoPing?.latencia || null;
          const ultimaActualizacion = ultimoPing ? new Date(ultimoPing.timestamp) : null;
          
          // Determinar clases CSS según el estado
          const estadoClasses = activo
            ? 'bg-success-50 text-success-700'
            : 'bg-danger-50 text-danger-700';
          
          // Determinar color de la latencia
          let latenciaColor = 'text-neutral-600';
          if (latencia !== null) {
            if (latencia > 150) latenciaColor = 'text-danger-600 font-medium';
            else if (latencia > 100) latenciaColor = 'text-warning-600';
          }
          
          return (
            <div 
              key={dispositivo.id} 
              className="p-4 hover:bg-neutral-50 transition-colors animate-fade-in"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`rounded-full p-2 ${estadoClasses}`}>
                    {activo ? <Wifi size={18} /> : <WifiOff size={18} />}
                  </div>
                  <div>
                    <h4 className="font-medium">{dispositivo.alias}</h4>
                    <p className="text-sm text-neutral-500">{dispositivo.ip}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {/* Información de latencia */}
                  <div className="text-right hidden sm:block">
                    <p className={`font-medium ${latenciaColor}`}>
                      {latencia !== null ? `${Math.round(latencia)} ms` : 'N/A'}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {ultimaActualizacion
                        ? `Actualizado: ${ultimaActualizacion.toLocaleTimeString()}`
                        : 'Sin datos'}
                    </p>
                  </div>
                  
                  {/* Estado */}
                  <div className="min-w-[90px] text-right">
                    <span 
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        activo ? 'bg-success-100 text-success-800' : 'bg-danger-100 text-danger-800'
                      }`}
                    >
                      {activo ? 'En línea' : 'Desconectado'}
                    </span>
                  </div>
                  
                  {/* Enlace a detalles */}
                  <Link 
                    to={`/dispositivos/editar/${dispositivo.id}`}
                    className="p-1 rounded hover:bg-neutral-100"
                  >
                    <ExternalLink size={18} className="text-neutral-400" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ListaDispositivos;