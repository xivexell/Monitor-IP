import React, { useState } from 'react';
import { Calendar, Server } from 'lucide-react';
import { es } from 'date-fns/locale';
import { format, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

interface FiltroPeriodoProps {
  onFiltroChange: (dispositivoId: number | null, fechaInicio: Date, fechaFin: Date) => void;
  dispositivos: { id?: number; alias: string }[];
}

const FiltroPeriodo: React.FC<FiltroPeriodoProps> = ({ onFiltroChange, dispositivos }) => {
  const [dispositivoId, setDispositivoId] = useState<number | null>(null);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<string>('hoy');
  const [fechaInicio, setFechaInicio] = useState<Date>(startOfDay(new Date()));
  const [fechaFin, setFechaFin] = useState<Date>(endOfDay(new Date()));
  
  // Manejar cambio de dispositivo
  const handleDispositivoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const valor = e.target.value;
    setDispositivoId(valor === 'todos' ? null : parseInt(valor));
  };

  // Manejar cambio de periodo
  const handlePeriodoChange = (periodo: string) => {
    const hoy = new Date();
    let inicio: Date;
    let fin: Date;
    
    switch (periodo) {
      case 'hoy':
        inicio = startOfDay(hoy);
        fin = endOfDay(hoy);
        break;
      case 'ayer':
        inicio = startOfDay(subDays(hoy, 1));
        fin = endOfDay(subDays(hoy, 1));
        break;
      case 'semana':
        inicio = startOfWeek(hoy, { locale: es });
        fin = endOfWeek(hoy, { locale: es });
        break;
      case 'mes':
        inicio = startOfMonth(hoy);
        fin = endOfMonth(hoy);
        break;
      case 'personalizado':
        // Mantener las fechas actuales para el selector manual
        return setPeriodoSeleccionado(periodo);
      default:
        inicio = startOfDay(hoy);
        fin = endOfDay(hoy);
    }
    
    setPeriodoSeleccionado(periodo);
    setFechaInicio(inicio);
    setFechaFin(fin);
    onFiltroChange(dispositivoId, inicio, fin);
  };

  // Manejar cambio de fecha personalizada
  const handleFechaChange = (e: React.ChangeEvent<HTMLInputElement>, tipo: 'inicio' | 'fin') => {
    const fecha = new Date(e.target.value);
    
    if (tipo === 'inicio') {
      setFechaInicio(fecha);
      onFiltroChange(dispositivoId, fecha, fechaFin);
    } else {
      setFechaFin(fecha);
      onFiltroChange(dispositivoId, fechaInicio, fecha);
    }
  };

  // Aplicar filtro personalizado
  const aplicarFiltroPersonalizado = () => {
    onFiltroChange(dispositivoId, fechaInicio, fechaFin);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 animate-fade-in">
      <h3 className="font-semibold text-lg mb-4">Filtros del reporte</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Selector de dispositivo */}
        <div>
          <label htmlFor="dispositivo" className="block text-sm font-medium text-neutral-700 mb-1">
            Dispositivo
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Server size={16} className="text-neutral-500" />
            </div>
            <select
              id="dispositivo"
              name="dispositivo"
              onChange={handleDispositivoChange}
              className="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="todos">Todos los dispositivos</option>
              {dispositivos.map(dispositivo => (
                <option key={dispositivo.id} value={dispositivo.id}>
                  {dispositivo.alias}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Selector de periodo */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Periodo
          </label>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => handlePeriodoChange('hoy')}
              className={`px-3 py-1 text-sm rounded-md ${
                periodoSeleccionado === 'hoy' 
                  ? 'bg-primary-100 text-primary-800' 
                  : 'bg-neutral-100 hover:bg-neutral-200'
              }`}
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => handlePeriodoChange('ayer')}
              className={`px-3 py-1 text-sm rounded-md ${
                periodoSeleccionado === 'ayer' 
                  ? 'bg-primary-100 text-primary-800' 
                  : 'bg-neutral-100 hover:bg-neutral-200'
              }`}
            >
              Ayer
            </button>
            <button
              type="button"
              onClick={() => handlePeriodoChange('semana')}
              className={`px-3 py-1 text-sm rounded-md ${
                periodoSeleccionado === 'semana' 
                  ? 'bg-primary-100 text-primary-800' 
                  : 'bg-neutral-100 hover:bg-neutral-200'
              }`}
            >
              Semana
            </button>
            <button
              type="button"
              onClick={() => handlePeriodoChange('mes')}
              className={`px-3 py-1 text-sm rounded-md ${
                periodoSeleccionado === 'mes' 
                  ? 'bg-primary-100 text-primary-800' 
                  : 'bg-neutral-100 hover:bg-neutral-200'
              }`}
            >
              Mes
            </button>
            <button
              type="button"
              onClick={() => handlePeriodoChange('personalizado')}
              className={`px-3 py-1 text-sm rounded-md ${
                periodoSeleccionado === 'personalizado' 
                  ? 'bg-primary-100 text-primary-800' 
                  : 'bg-neutral-100 hover:bg-neutral-200'
              }`}
            >
              Personalizado
            </button>
          </div>
        </div>
      </div>
      
      {/* Selector de fechas personalizado */}
      {periodoSeleccionado === 'personalizado' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Fecha inicio */}
          <div>
            <label htmlFor="fechaInicio" className="block text-sm font-medium text-neutral-700 mb-1">
              Fecha de inicio
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar size={16} className="text-neutral-500" />
              </div>
              <input
                type="date"
                id="fechaInicio"
                name="fechaInicio"
                value={format(fechaInicio, 'yyyy-MM-dd')}
                onChange={(e) => handleFechaChange(e, 'inicio')}
                className="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          
          {/* Fecha fin */}
          <div>
            <label htmlFor="fechaFin" className="block text-sm font-medium text-neutral-700 mb-1">
              Fecha de fin
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar size={16} className="text-neutral-500" />
              </div>
              <input
                type="date"
                id="fechaFin"
                name="fechaFin"
                value={format(fechaFin, 'yyyy-MM-dd')}
                onChange={(e) => handleFechaChange(e, 'fin')}
                className="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          
          {/* Botón aplicar */}
          <div className="md:col-span-2">
            <button
              type="button"
              onClick={aplicarFiltroPersonalizado}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Aplicar filtro
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FiltroPeriodo;