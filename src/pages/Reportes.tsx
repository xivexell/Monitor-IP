import React, { useState, useEffect } from 'react';
import { startOfDay, endOfDay } from 'date-fns';
import FiltroPeriodo from '../components/reportes/FiltroPeriodo';
import TablaReportes from '../components/reportes/TablaReportes';
import db from '../database/db';
import reporteService, { ReporteDispositivo } from '../services/ReporteService';
import { toast } from 'react-toastify';

const Reportes: React.FC = () => {
  const [dispositivos, setDispositivos] = useState<{ id?: number; alias: string }[]>([]);
  const [fechaInicio, setFechaInicio] = useState<Date>(startOfDay(new Date()));
  const [fechaFin, setFechaFin] = useState<Date>(endOfDay(new Date()));
  const [dispositivoId, setDispositivoId] = useState<number | null>(null);
  const [reportes, setReportes] = useState<ReporteDispositivo[]>([]);
  const [cargando, setCargando] = useState(false);

  // Cargar dispositivos
  useEffect(() => {
    const cargarDispositivos = async () => {
      try {
        const listaDispositivos = await db.dispositivos.toArray();
        setDispositivos(listaDispositivos.map(d => ({ id: d.id, alias: d.alias })));
      } catch (error) {
        console.error('Error al cargar dispositivos:', error);
        toast.error('Error al cargar la lista de dispositivos');
      }
    };
    
    cargarDispositivos();
  }, []);

  // Generar reporte cuando cambian los filtros
  useEffect(() => {
    generarReporte();
  }, []);

  // Función para actualizar filtros
  const actualizarFiltros = (id: number | null, inicio: Date, fin: Date) => {
    setDispositivoId(id);
    setFechaInicio(inicio);
    setFechaFin(fin);
    generarReporte(id, inicio, fin);
  };

  // Generar reporte
  const generarReporte = async (
    id: number | null = dispositivoId,
    inicio: Date = fechaInicio,
    fin: Date = fechaFin
  ) => {
    try {
      setCargando(true);
      const resultados = await reporteService.generarReporte(id, inicio, fin);
      setReportes(resultados);
    } catch (error) {
      console.error('Error al generar reporte:', error);
      toast.error('Error al generar el reporte');
    } finally {
      setCargando(false);
    }
  };

  // Exportar a PDF
  const exportarPDF = async () => {
    try {
      const blob = await reporteService.exportarPDF(reportes, fechaInicio, fechaFin);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_${fechaInicio.toISOString().split('T')[0]}_${fechaFin.toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error('Error al exportar a PDF:', error);
      toast.error('Error al exportar el reporte a PDF');
    }
  };

  // Exportar a Excel
  const exportarExcel = async () => {
    try {
      const blob = await reporteService.exportarExcel(reportes, fechaInicio, fechaFin);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_${fechaInicio.toISOString().split('T')[0]}_${fechaFin.toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      toast.error('Error al exportar el reporte a Excel');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-neutral-800">Reportes</h2>
      
      {/* Filtros */}
      <FiltroPeriodo 
        onFiltroChange={actualizarFiltros}
        dispositivos={dispositivos}
      />
      
      {/* Resultados del reporte */}
      {cargando ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-neutral-500">Generando reporte...</p>
        </div>
      ) : (
        <TablaReportes 
          reportes={reportes}
          fechaInicio={fechaInicio}
          fechaFin={fechaFin}
          onExportarPDF={exportarPDF}
          onExportarExcel={exportarExcel}
        />
      )}
    </div>
  );
};

export default Reportes;