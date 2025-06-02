import React from 'react';
import { Activity, Server, Clock, AlertCircle } from 'lucide-react';

interface EstadisticasGeneralesProps {
  totalDispositivos: number;
  dispositivosActivos: number;
  dispositivosInactivos: number;
  latenciaPromedio: number | null;
}

const EstadisticasGenerales: React.FC<EstadisticasGeneralesProps> = ({
  totalDispositivos,
  dispositivosActivos,
  dispositivosInactivos,
  latenciaPromedio
}) => {
  // Calcular porcentaje de disponibilidad
  const porcentajeDisponibilidad = totalDispositivos > 0 
    ? Math.round((dispositivosActivos / totalDispositivos) * 100) 
    : 0;

  // Estadísticas para mostrar
  const estadisticas = [
    {
      titulo: 'Dispositivos',
      valor: totalDispositivos,
      descripcion: 'Total monitoreados',
      icono: <Server className="w-8 h-8 text-primary-600" />,
      color: 'bg-primary-50 text-primary-700'
    },
    {
      titulo: 'En línea',
      valor: dispositivosActivos,
      descripcion: `${porcentajeDisponibilidad}% disponibilidad`,
      icono: <Activity className="w-8 h-8 text-success-600" />,
      color: 'bg-success-50 text-success-700'
    },
    {
      titulo: 'Desconectados',
      valor: dispositivosInactivos,
      descripcion: `${100 - porcentajeDisponibilidad}% no disponible`,
      icono: <AlertCircle className="w-8 h-8 text-danger-600" />,
      color: 'bg-danger-50 text-danger-700'
    },
    {
      titulo: 'Latencia Promedio',
      valor: latenciaPromedio !== null ? `${Math.round(latenciaPromedio)} ms` : 'N/A',
      descripcion: 'Última hora',
      icono: <Clock className="w-8 h-8 text-warning-600" />,
      color: 'bg-warning-50 text-warning-700'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {estadisticas.map((stat, index) => (
        <div 
          key={index}
          className="bg-white rounded-lg shadow p-5 transition-all duration-300 hover:shadow-md animate-fade-in"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-neutral-500 font-medium text-sm">{stat.titulo}</p>
              <h3 className="text-2xl font-bold mt-1">{stat.valor}</h3>
              <p className="text-sm text-neutral-400 mt-1">{stat.descripcion}</p>
            </div>
            <div className={`rounded-full p-3 ${stat.color}`}>
              {stat.icono}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EstadisticasGenerales;