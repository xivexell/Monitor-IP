import React, { useState, useEffect } from 'react';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';
import { Calendar, Search, Server } from 'lucide-react';
import db, { RegistroPing } from '../database/db';

const Historial: React.FC = () => {
  const [dispositivos, setDispositivos] = useState<{ id?: number; alias: string; ip: string }[]>([]);
  const [registros, setRegistros] = useState<(RegistroPing & { alias: string, ip: string })[]>([]);
  const [dispositivoId, setDispositivoId] = useState<number | null>(null);
  const [fechaInicio, setFechaInicio] = useState<Date>(startOfDay(subDays(new Date(), 1)));
  const [fechaFin, setFechaFin] = useState<Date>(endOfDay(new Date()));
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [cargando, setCargando] = useState(false);
  const registrosPorPagina = 50;

  // Cargar dispositivos
  useEffect(() => {
    const cargarDispositivos = async () => {
      try {
        const lista = await db.dispositivos.toArray();
        setDispositivos(lista.map(d => ({ id: d.id, alias: d.alias, ip: d.ip })));
      } catch (error) {
        console.error('Error al cargar dispositivos:', error);
      }
    };
    
    cargarDispositivos();
  }, []);

  // Cargar registros
  useEffect(() => {
    cargarRegistros();
  }, [dispositivoId, fechaInicio, fechaFin, filtroEstado, pagina]);

  const cargarRegistros = async () => {
    setCargando(true);
    try {
      // Construir consulta base
      let consulta = db.registrosPing
        .where('timestamp')
        .between(fechaInicio, fechaFin, true, true);
      
      // Filtrar por dispositivo si se seleccionó uno
      if (dispositivoId !== null) {
        consulta = consulta.and(r => r.dispositivoId === dispositivoId);
      }
      
      // Filtrar por estado si no es "todos"
      if (filtroEstado !== 'todos') {
        const esActivo = filtroEstado === 'activo';
        consulta = consulta.and(r => r.activo === esActivo);
      }
      
      // Contar total para paginación
      const total = await consulta.count();
      setTotalPaginas(Math.ceil(total / registrosPorPagina));
      
      // Obtener registros paginados y ordenados por fecha (más recientes primero)
      const offset = (pagina - 1) * registrosPorPagina;
      const registrosPaginados = await consulta
        .reverse() // Ordenar por timestamp descendente
        .offset(offset)
        .limit(registrosPorPagina)
        .toArray();
      
      // Enriquecer con información de dispositivos
      const registrosConDispositivo = await Promise.all(
        registrosPaginados.map(async registro => {
          const dispositivo = dispositivos.find(d => d.id === registro.dispositivoId);
          return {
            ...registro,
            alias: dispositivo?.alias || 'Desconocido',
            ip: dispositivo?.ip || 'Desconocido'
          };
        })
      );
      
      setRegistros(registrosConDispositivo);
    } catch (error) {
      console.error('Error al cargar registros:', error);
    } finally {
      setCargando(false);
    }
  };

  // Aplicar filtros
  const aplicarFiltros = () => {
    setPagina(1); // Reiniciar a primera página
    cargarRegistros();
  };

  // Cambiar página
  const cambiarPagina = (nuevaPagina: number) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPagina(nuevaPagina);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-neutral-800">Historial de Eventos</h2>
      
      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Dispositivo */}
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
                value={dispositivoId === null ? 'todos' : dispositivoId}
                onChange={(e) => setDispositivoId(e.target.value === 'todos' ? null : parseInt(e.target.value))}
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
          
          {/* Fecha inicio */}
          <div>
            <label htmlFor="fechaInicio" className="block text-sm font-medium text-neutral-700 mb-1">
              Desde
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar size={16} className="text-neutral-500" />
              </div>
              <input
                type="datetime-local"
                id="fechaInicio"
                value={format(fechaInicio, "yyyy-MM-dd'T'HH:mm")}
                onChange={(e) => setFechaInicio(new Date(e.target.value))}
                className="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          
          {/* Fecha fin */}
          <div>
            <label htmlFor="fechaFin" className="block text-sm font-medium text-neutral-700 mb-1">
              Hasta
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar size={16} className="text-neutral-500" />
              </div>
              <input
                type="datetime-local"
                id="fechaFin"
                value={format(fechaFin, "yyyy-MM-dd'T'HH:mm")}
                onChange={(e) => setFechaFin(new Date(e.target.value))}
                className="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          
          {/* Estado */}
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Estado
            </label>
            <div className="flex space-x-2 h-full items-start">
              <button
                type="button"
                onClick={() => setFiltroEstado('todos')}
                className={`px-3 py-2 rounded-md ${
                  filtroEstado === 'todos' 
                    ? 'bg-primary-100 text-primary-800' 
                    : 'bg-neutral-100 hover:bg-neutral-200'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setFiltroEstado('activo')}
                className={`px-3 py-2 rounded-md ${
                  filtroEstado === 'activo' 
                    ? 'bg-success-100 text-success-800' 
                    : 'bg-neutral-100 hover:bg-neutral-200'
                }`}
              >
                Activos
              </button>
              <button
                type="button"
                onClick={() => setFiltroEstado('inactivo')}
                className={`px-3 py-2 rounded-md ${
                  filtroEstado === 'inactivo' 
                    ? 'bg-danger-100 text-danger-800' 
                    : 'bg-neutral-100 hover:bg-neutral-200'
                }`}
              >
                Caídos
              </button>
            </div>
          </div>
        </div>
        
        {/* Botón aplicar */}
        <div className="mt-4">
          <button
            type="button"
            onClick={aplicarFiltros}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Search size={16} className="mr-2" />
            Buscar
          </button>
        </div>
      </div>
      
      {/* Tabla de registros */}
      <div className="bg-white rounded-lg shadow overflow-hidden animate-fade-in">
        <div className="p-4 border-b border-neutral-200">
          <h3 className="font-semibold text-lg">Historial de pings</h3>
        </div>
        
        {cargando ? (
          <div className="p-6 text-center">
            <p className="text-neutral-500">Cargando registros...</p>
          </div>
        ) : registros.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-neutral-500">No hay registros para los filtros seleccionados.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Fecha y Hora
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Dispositivo
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      IP
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Latencia
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Respuesta
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {registros.map((registro, index) => (
                    <tr key={registro.id || index} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                        {format(new Date(registro.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-neutral-900">{registro.alias}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-neutral-600">{registro.ip}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          registro.activo ? 'bg-success-100 text-success-800' : 'bg-danger-100 text-danger-800'
                        }`}>
                          {registro.activo ? 'En línea' : 'Desconectado'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`font-medium ${
                          !registro.latencia ? 'text-neutral-400' :
                          registro.latencia > 150 ? 'text-danger-600' :
                          registro.latencia > 100 ? 'text-warning-600' :
                          'text-success-600'
                        }`}>
                          {registro.latencia !== null ? `${Math.round(registro.latencia)} ms` : 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        {registro.respuesta}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="px-6 py-3 flex items-center justify-between border-t border-neutral-200">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => cambiarPagina(pagina - 1)}
                    disabled={pagina === 1}
                    className={`relative inline-flex items-center px-4 py-2 border border-neutral-300 text-sm font-medium rounded-md ${
                      pagina === 1 
                        ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed' 
                        : 'bg-white text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => cambiarPagina(pagina + 1)}
                    disabled={pagina === totalPaginas}
                    className={`relative inline-flex items-center px-4 py-2 border border-neutral-300 text-sm font-medium rounded-md ${
                      pagina === totalPaginas 
                        ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed' 
                        : 'bg-white text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    Siguiente
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-neutral-700">
                      Mostrando <span className="font-medium">{(pagina - 1) * registrosPorPagina + 1}</span> a <span className="font-medium">
                        {Math.min(pagina * registrosPorPagina, (pagina - 1) * registrosPorPagina + registros.length)}
                      </span> de <span className="font-medium">{totalPaginas * registrosPorPagina}</span> resultados
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => cambiarPagina(pagina - 1)}
                        disabled={pagina === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-neutral-300 bg-white text-sm font-medium ${
                          pagina === 1 
                            ? 'text-neutral-400 cursor-not-allowed' 
                            : 'text-neutral-500 hover:bg-neutral-50'
                        }`}
                      >
                        <span className="sr-only">Anterior</span>
                        <ChevronLeft size={18} />
                      </button>
                      
                      {/* Botones de páginas */}
                      {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                        let pageNum;
                        if (totalPaginas <= 5) {
                          pageNum = i + 1;
                        } else if (pagina <= 3) {
                          pageNum = i + 1;
                        } else if (pagina >= totalPaginas - 2) {
                          pageNum = totalPaginas - 4 + i;
                        } else {
                          pageNum = pagina - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => cambiarPagina(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              pageNum === pagina
                                ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                                : 'bg-white border-neutral-300 text-neutral-500 hover:bg-neutral-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => cambiarPagina(pagina + 1)}
                        disabled={pagina === totalPaginas}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-neutral-300 bg-white text-sm font-medium ${
                          pagina === totalPaginas 
                            ? 'text-neutral-400 cursor-not-allowed' 
                            : 'text-neutral-500 hover:bg-neutral-50'
                        }`}
                      >
                        <span className="sr-only">Siguiente</span>
                        <ChevronRight size={18} />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Iconos para paginación
const ChevronLeft = ({ size }: { size: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"></polyline>
  </svg>
);

const ChevronRight = ({ size }: { size: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);

export default Historial;