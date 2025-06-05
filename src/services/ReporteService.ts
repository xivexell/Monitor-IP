import db, { Dispositivo, RegistroPing } from '../database/db';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, format, differenceInMilliseconds } from 'date-fns';
import { es } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Interfaces para los reportes
export interface ResumenCaida {
  inicio: Date;
  fin: Date;
  duracion: number; // en milisegundos
}

export interface ReporteDispositivo {
  dispositivo: Dispositivo;
  totalPings: number;
  pingsFallidos: number;
  disponibilidad: number; // porcentaje
  latenciaPromedio: number | null;
  latenciaMaxima: number | null;
  caidas: ResumenCaida[];
}

export class ReporteService {
  // Generar reporte por dispositivo y rango de fechas
  async generarReporte(
    dispositivoId: number | null,
    fechaInicio: Date,
    fechaFin: Date
  ): Promise<ReporteDispositivo[]> {
    const resultado: ReporteDispositivo[] = [];
    
    try {
      // Obtener dispositivos (uno específico o todos)
      let dispositivos: Dispositivo[];
      if (dispositivoId) {
        const dispositivo = await db.getDispositivo(dispositivoId);
        dispositivos = dispositivo ? [dispositivo] : [];
      } else {
        dispositivos = await db.getDispositivos();
      }
      
      // Para cada dispositivo, generar su reporte
      for (const dispositivo of dispositivos) {
        if (!dispositivo.id) continue;
        
        // Obtener registros de ping para el rango de fechas
        const registros = await db.getRegistrosPing(dispositivo.id, fechaInicio, fechaFin);
        
        // Calcular estadísticas
        const totalPings = registros.length;
        const pingsFallidos = registros.filter(r => !r.activo).length;
        const disponibilidad = totalPings > 0 ? ((totalPings - pingsFallidos) / totalPings) * 100 : 0;
        
        // Calcular latencia promedio y máxima (solo de pings exitosos)
        const pingExitosos = registros.filter(r => r.activo && r.latencia !== null);
        const latencias = pingExitosos.map(r => r.latencia as number);
        const latenciaPromedio = latencias.length > 0 
          ? latencias.reduce((sum, lat) => sum + lat, 0) / latencias.length 
          : null;
        const latenciaMaxima = latencias.length > 0 
          ? Math.max(...latencias) 
          : null;
        
        // Detectar períodos de caída
        const caidas: ResumenCaida[] = [];
        let inicioCaida: Date | null = null;
        
        // Ordenar registros por timestamp
        const registrosOrdenados = [...registros].sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        
        for (let i = 0; i < registrosOrdenados.length; i++) {
          const registro = registrosOrdenados[i];
          
          if (!registro.activo && inicioCaida === null) {
            // Inicio de una caída
            inicioCaida = new Date(registro.timestamp);
          } else if (registro.activo && inicioCaida !== null) {
            // Fin de una caída
            caidas.push({
              inicio: inicioCaida,
              fin: new Date(registro.timestamp),
              duracion: differenceInMilliseconds(
                new Date(registro.timestamp),
                inicioCaida
              )
            });
            inicioCaida = null;
          }
        }
        
        // Si hay una caída en curso al final del período
        if (inicioCaida !== null) {
          caidas.push({
            inicio: inicioCaida,
            fin: fechaFin,
            duracion: differenceInMilliseconds(fechaFin, inicioCaida)
          });
        }
        
        // Agregar al resultado
        resultado.push({
          dispositivo,
          totalPings,
          pingsFallidos,
          disponibilidad,
          latenciaPromedio,
          latenciaMaxima,
          caidas
        });
      }
      
      return resultado;
    } catch (error) {
      console.error('Error al generar reporte:', error);
      throw new Error('Error al generar el reporte');
    }
  }

  // Exportar reporte a PDF
  async exportarPDF(reportes: ReporteDispositivo[], fechaInicio: Date, fechaFin: Date): Promise<Blob> {
    try {
      // Crear nuevo documento PDF
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(18);
      doc.text('Reporte de Monitoreo de Dispositivos', 15, 15);
      
      // Subtítulo con rango de fechas
      doc.setFontSize(12);
      doc.text(`Período: ${format(fechaInicio, 'dd/MM/yyyy')} - ${format(fechaFin, 'dd/MM/yyyy')}`, 15, 25);
      
      let yPos = 35;
      
      // Para cada dispositivo en el reporte
      for (const reporte of reportes) {
        // Información del dispositivo
        doc.setFontSize(14);
        doc.text(`Dispositivo: ${reporte.dispositivo.alias} (${reporte.dispositivo.ip})`, 15, yPos);
        yPos += 10;
        
        // Resumen
        doc.setFontSize(10);
        doc.text(`Disponibilidad: ${reporte.disponibilidad.toFixed(2)}%`, 20, yPos);
        yPos += 5;
        doc.text(`Total de pings: ${reporte.totalPings}`, 20, yPos);
        yPos += 5;
        doc.text(`Pings fallidos: ${reporte.pingsFallidos}`, 20, yPos);
        yPos += 5;
        doc.text(`Latencia promedio: ${reporte.latenciaPromedio ? `${reporte.latenciaPromedio.toFixed(2)} ms` : 'N/A'}`, 20, yPos);
        yPos += 5;
        doc.text(`Latencia máxima: ${reporte.latenciaMaxima ? `${reporte.latenciaMaxima.toFixed(2)} ms` : 'N/A'}`, 20, yPos);
        yPos += 10;
        
        // Tabla de caídas
        if (reporte.caidas.length > 0) {
          doc.text('Períodos de caída:', 15, yPos);
          yPos += 5;
          
          const tableData = reporte.caidas.map(caida => [
            format(caida.inicio, 'dd/MM/yyyy HH:mm:ss'),
            format(caida.fin, 'dd/MM/yyyy HH:mm:ss'),
            `${(caida.duracion / 60000).toFixed(2)} minutos`
          ]);
          
          (doc as any).autoTable({
            startY: yPos,
            head: [['Inicio', 'Fin', 'Duración']],
            body: tableData,
            margin: { left: 15 },
            theme: 'grid'
          });
          
          yPos = (doc as any).lastAutoTable.finalY + 15;
        } else {
          doc.text('No se registraron caídas en este período', 15, yPos);
          yPos += 15;
        }
        
        // Nueva página si es necesario
        if (yPos > 250 && reportes.indexOf(reporte) < reportes.length - 1) {
          doc.addPage();
          yPos = 20;
        }
      }
      
      // Devolver como Blob
      return new Blob([doc.output('blob')], { type: 'application/pdf' });
    } catch (error) {
      console.error('Error al exportar a PDF:', error);
      throw new Error('Error al generar el archivo PDF');
    }
  }

  // Exportar reporte a Excel
  async exportarExcel(reportes: ReporteDispositivo[], fechaInicio: Date, fechaFin: Date): Promise<Blob> {
    try {
      // Crear libro y hoja de trabajo
      const wb = XLSX.utils.book_new();
      
      // Hoja de resumen
      const resumenData = reportes.map(r => ({
        'Dispositivo': r.dispositivo.alias,
        'IP': r.dispositivo.ip,
        'Disponibilidad (%)': r.disponibilidad.toFixed(2),
        'Total Pings': r.totalPings,
        'Pings Fallidos': r.pingsFallidos,
        'Latencia Promedio (ms)': r.latenciaPromedio ? r.latenciaPromedio.toFixed(2) : 'N/A',
        'Latencia Máxima (ms)': r.latenciaMaxima ? r.latenciaMaxima.toFixed(2) : 'N/A',
        'Total Caídas': r.caidas.length
      }));
      
      const resumenWs = XLSX.utils.json_to_sheet(resumenData);
      XLSX.utils.book_append_sheet(wb, resumenWs, 'Resumen');
      
      // Hoja para cada dispositivo con sus caídas
      for (const reporte of reportes) {
        if (reporte.caidas.length > 0) {
          const caidasData = reporte.caidas.map(c => ({
            'Inicio': format(c.inicio, 'dd/MM/yyyy HH:mm:ss'),
            'Fin': format(c.fin, 'dd/MM/yyyy HH:mm:ss'),
            'Duración (min)': (c.duracion / 60000).toFixed(2)
          }));
          
          const caidasWs = XLSX.utils.json_to_sheet(caidasData);
          XLSX.utils.book_append_sheet(wb, caidasWs, `Caídas ${reporte.dispositivo.alias.substring(0, 20)}`);
        }
      }
      
      // Convertir a binario
      const excelBinary = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
      
      // Convertir binario a Blob
      const buf = new ArrayBuffer(excelBinary.length);
      const view = new Uint8Array(buf);
      for (let i = 0; i < excelBinary.length; i++) {
        view[i] = excelBinary.charCodeAt(i) & 0xFF;
      }
      
      return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      throw new Error('Error al generar el archivo Excel');
    }
  }

  // Obtener resumen para el dashboard (últimas 24 horas)
  async obtenerResumenDashboard(): Promise<{
    totalDispositivos: number;
    dispositivosActivos: number;
    dispositivosInactivos: number;
    latenciaPromedio: number | null;
  }> {
    try {
      // Fecha de hace 24 horas
      const fechaInicio = new Date();
      fechaInicio.setHours(fechaInicio.getHours() - 24);
      
      const dispositivos = await db.getDispositivos();
      const totalDispositivos = dispositivos.length;
      
      // Obtener estado actual
      let dispositivosActivos = 0;
      let dispositivosInactivos = 0;
      let latenciasActivas: number[] = [];
      
      for (const dispositivo of dispositivos) {
        if (!dispositivo.id) continue;
        
        // Último registro de ping
        const ultimoPing = await db.getUltimoPing(dispositivo.id);
        
        if (ultimoPing) {
          if (ultimoPing.activo) {
            dispositivosActivos++;
            if (ultimoPing.latencia !== null) {
              latenciasActivas.push(ultimoPing.latencia);
            }
          } else {
            dispositivosInactivos++;
          }
        } else {
          // Sin registros, se considera inactivo
          dispositivosInactivos++;
        }
      }
      
      // Calcular latencia promedio
      const latenciaPromedio = latenciasActivas.length > 0 
        ? latenciasActivas.reduce((sum, lat) => sum + lat, 0) / latenciasActivas.length 
        : null;
      
      return {
        totalDispositivos,
        dispositivosActivos,
        dispositivosInactivos,
        latenciaPromedio
      };
    } catch (error) {
      console.error('Error al obtener resumen para dashboard:', error);
      throw new Error('Error al obtener resumen para el dashboard');
    }
  }
}

// Instancia única del servicio
const reporteService = new ReporteService();
export default reporteService;