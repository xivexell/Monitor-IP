import React from 'react';
import { Download, FileDown, File as FilePdf, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';
import { ReporteDispositivo } from '../../services/ReporteService';

interface TablaReportesProps {
  reportes: ReporteDispositivo[];
  fechaInicio: Date;
  fechaFin: Date;
  onExportarPDF: () => void;
  onExportarExcel: () => void;
}

const TablaReportes: React.FC<TablaReportesProps> = ({
  reportes,
  fechaInicio,
  fechaFin,
  onExportarPDF,
  onExportarExcel
}) => {
  // Función para formatear la duración en formato legible
  const formatearDuracion = (duracionMs: number): string => {
    const segundos = Math.floor(duracionMs / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);
    
    if (horas > 0) {
      return `${horas}h ${minutos % 60}m`;
    } else if (minutos > 0) {
      return `${minutos}m ${segundos % 60}s`;
    } else {
      return `${segundos}s`;
    }
  };

  // Verificar si hay datos
  if (reportes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center animate-fade-in">
        <p className="text-neutral-500">No hay datos para el período seleccionado.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden animate-fade-in">
      <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
        <h3 className="font-semibold text-lg">
          Reporte: {format(fechaInicio, 'dd/MM/yyyy')} - {format(fechaFin, 'dd/MM/yyyy')}
        </h3>
        
        <div className="flex space-x-2">
          <button
            onClick={onExportarPDF}
            className="flex items-center space-x-1 px-3 py-1 bg-danger-600 text-white rounded-md hover:bg-danger-700 transition-colors"
          >
            <FilePdf size={16} />
            <span className="hidden sm:inline">PDF</span>
          </button>
          <button
            onClick={onExportarExcel}
            className="flex items-center space-x-1 px-3 py-1 bg-success-600 text-white rounded-md hover:bg-success-700 transition-colors"
          >
            <FileSpreadsheet size={16} />
            <span className="hidden sm:inline">Excel</span>
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Dispositivo
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Disponibilidad
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Latencia Prom.
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Latencia Máx.
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Caídas
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Tiempo Total Caído
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {reportes.map((reporte, index) => {
              // Calcular tiempo total caído
              const tiempoCaido = reporte.caidas.reduce((total, caida) => total + caida.duracion, 0);
              
              // Determinar color según disponibilidad
              let disponibilidadColor = 'text-success-600';
              if (reporte.disponibilidad < 95) disponibilidadColor = 'text-warning-600';
              if (reporte.disponibilidad < 90) disponibilidadColor = 'text-danger-600';
              
              return (
                <tr key={index} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-neutral-900">{reporte.dispositivo.alias}</div>
                    <div className="text-sm text-neutral-500">{reporte.dispositivo.ip}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`font-medium ${disponibilidadColor}`}>
                      {reporte.disponibilidad.toFixed(2)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {reporte.latenciaPromedio !== null 
                      ? `${Math.round(reporte.latenciaPromedio)} ms` 
                      : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {reporte.latenciaMaxima !== null 
                      ? `${Math.round(reporte.latenciaMaxima)} ms` 
                      : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {reporte.caidas.length}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatearDuracion(tiempoCaido)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Detalles de caídas por dispositivo */}
      <div className="p-4 border-t border-neutral-200">
        <h4 className="font-medium text-lg mb-4">Detalle de caídas</h4>
        
        {reportes.map((reporte, index) => (
          <div key={index} className="mb-6 last:mb-0">
            <h5 className="font-medium text-neutral-800 mb-2">
              {reporte.dispositivo.alias} ({reporte.dispositivo.ip})
            </h5>
            
            {reporte.caidas.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200 border border-neutral-200 rounded-md">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Inicio
                      </th>
                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Fin
                      </th>
                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Duración
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {reporte.caidas.map((caida, idx) => (
                      <tr key={idx} className="hover:bg-neutral-50">
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                          {format(caida.inicio, 'dd/MM/yyyy HH:mm:ss')}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                          {format(caida.fin, 'dd/MM/yyyy HH:mm:ss')}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                          {formatearDuracion(caida.duracion)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-neutral-500">No se registraron caídas en este período.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TablaReportes;