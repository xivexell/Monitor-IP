import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import db from '../../database/db';
import { format, subHours, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

// Registrar componentes de ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface DatosGrafico {
  labels: string[];
  datasets: {
    label: string;
    data: (number | null)[];
    borderColor: string;
    backgroundColor: string;
    tension: number;
    pointRadius: number;
    borderWidth: number;
  }[];
}

const GraficoLatencia: React.FC = () => {
  const [datosGrafico, setDatosGrafico] = useState<DatosGrafico | null>(null);
  const [periodo, setPeriodo] = useState<number>(6); // Horas

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Obtener todos los dispositivos y filtrar los activos en memoria
        const allDispositivos = await db.dispositivos.toArray();
        const dispositivos = allDispositivos.filter(d => d.activo === true);
        
        if (dispositivos.length === 0) {
          setDatosGrafico(null);
          return;
        }
        
        // Fecha inicial según el periodo seleccionado
        const fechaInicio = subHours(new Date(), periodo);
        
        // Crear etiquetas de tiempo para el eje X (cada 30 minutos)
        const labels: string[] = [];
        const ahora = new Date();
        for (let i = periodo; i >= 0; i -= 0.5) {
          const fecha = subHours(ahora, i);
          labels.push(format(fecha, 'HH:mm'));
        }
        
        // Colores para las líneas de cada dispositivo
        const colores = [
          { border: 'rgb(59, 130, 246)', background: 'rgba(59, 130, 246, 0.1)' },
          { border: 'rgb(16, 185, 129)', background: 'rgba(16, 185, 129, 0.1)' },
          { border: 'rgb(245, 158, 11)', background: 'rgba(245, 158, 11, 0.1)' },
          { border: 'rgb(239, 68, 68)', background: 'rgba(239, 68, 68, 0.1)' },
          { border: 'rgb(139, 92, 246)', background: 'rgba(139, 92, 246, 0.1)' },
        ];
        
        // Crear datasets para cada dispositivo (limitando a 5 para claridad)
        const datasets = await Promise.all(
          dispositivos.slice(0, 5).map(async (dispositivo, index) => {
            if (!dispositivo.id) return null;
            
            // Obtener todos los registros para este dispositivo
            const todosRegistros = await db.registrosPing
              .where('dispositivoId')
              .equals(dispositivo.id)
              .toArray();
            
            // Filtrar registros por fecha en memoria
            const registros = todosRegistros.filter(registro => {
              const fecha = new Date(registro.timestamp);
              return isValid(fecha) && fecha >= fechaInicio;
            });
            
            // Ordenar por timestamp
            registros.sort((a, b) => {
              const fechaA = new Date(a.timestamp);
              const fechaB = new Date(b.timestamp);
              return fechaA.getTime() - fechaB.getTime();
            });
            
            // Mapear datos a los intervalos de tiempo del eje X
            const datos: (number | null)[] = new Array(labels.length).fill(null);
            
            registros.forEach(registro => {
              const fechaRegistro = new Date(registro.timestamp);
              if (isValid(fechaRegistro)) {
                const horaFormateada = format(fechaRegistro, 'HH:mm');
                const indice = labels.indexOf(horaFormateada);
                if (indice !== -1 && registro.latencia !== null) {
                  datos[indice] = registro.latencia;
                }
              }
            });
            
            return {
              label: dispositivo.alias,
              data: datos,
              borderColor: colores[index % colores.length].border,
              backgroundColor: colores[index % colores.length].background,
              tension: 0.3,
              pointRadius: 2,
              borderWidth: 2
            };
          })
        );
        
        // Filtrar datasets nulos
        const datasetsValidos = datasets.filter(Boolean) as DatosGrafico['datasets'];
        
        setDatosGrafico({
          labels,
          datasets: datasetsValidos
        });
      } catch (error) {
        console.error('Error al cargar datos para el gráfico:', error);
        setDatosGrafico(null);
      }
    };
    
    cargarDatos();
  }, [periodo]);

  const opciones: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          boxWidth: 6
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y !== null ? `${context.parsed.y} ms` : 'Sin datos';
            return `${label}: ${value}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Latencia (ms)'
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg">Latencia en el Tiempo</h3>
        <div className="flex space-x-2">
          <button
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              periodo === 3 ? 'bg-primary-100 text-primary-800' : 'bg-neutral-100 hover:bg-neutral-200'
            }`}
            onClick={() => setPeriodo(3)}
          >
            3h
          </button>
          <button
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              periodo === 6 ? 'bg-primary-100 text-primary-800' : 'bg-neutral-100 hover:bg-neutral-200'
            }`}
            onClick={() => setPeriodo(6)}
          >
            6h
          </button>
          <button
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              periodo === 12 ? 'bg-primary-100 text-primary-800' : 'bg-neutral-100 hover:bg-neutral-200'
            }`}
            onClick={() => setPeriodo(12)}
          >
            12h
          </button>
          <button
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              periodo === 24 ? 'bg-primary-100 text-primary-800' : 'bg-neutral-100 hover:bg-neutral-200'
            }`}
            onClick={() => setPeriodo(24)}
          >
            24h
          </button>
        </div>
      </div>
      
      <div className="h-[300px]">
        {datosGrafico ? (
          <Line data={datosGrafico} options={opciones} />
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-neutral-500">No hay datos suficientes para mostrar el gráfico</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GraficoLatencia;