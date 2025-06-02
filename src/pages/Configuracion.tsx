import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Upload } from 'lucide-react';
import { toast } from 'react-toastify';
import { useConfiguracion } from '../hooks/useConfiguracion';

const Configuracion: React.FC = () => {
  const { configuracion, actualizarConfiguracion } = useConfiguracion();
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState({
    nombreEmpresa: '',
    nombreAplicacion: '',
    logotipo: '',
    tiempoActualizacion: 30,
    umbralLatencia: 100,
    intentosReconexion: 3
  });

  // Cargar configuración
  useEffect(() => {
    if (configuracion) {
      setForm({
        nombreEmpresa: configuracion.nombreEmpresa,
        nombreAplicacion: configuracion.nombreAplicacion || 'MonitorIP',
        logotipo: configuracion.logotipo || '',
        tiempoActualizacion: configuracion.tiempoActualizacion,
        umbralLatencia: configuracion.umbralLatencia,
        intentosReconexion: configuracion.intentosReconexion
      });
      setCargando(false);
    }
  }, [configuracion]);

  // Manejar cambios en el formulario
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setForm(prev => ({
        ...prev,
        [name]: parseInt(value) || 0
      }));
    } else {
      setForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Manejar carga de logo
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({
          ...prev,
          logotipo: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Guardar configuración
  const guardarConfiguracion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setGuardando(true);
      
      // Validar campos
      if (!form.nombreEmpresa || !form.nombreAplicacion) {
        toast.error('El nombre de la empresa y de la aplicación son obligatorios');
        return;
      }
      
      if (form.tiempoActualizacion < 5) {
        toast.error('El tiempo mínimo de actualización es de 5 segundos');
        return;
      }
      
      // Guardar en base de datos
      const resultado = await actualizarConfiguracion(form);
      
      if (resultado) {
        toast.success('Configuración guardada correctamente');
      } else {
        toast.error('Error al guardar la configuración');
      }
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setGuardando(false);
    }
  };

  // Reiniciar valores predeterminados
  const reiniciarPredeterminados = () => {
    setForm({
      nombreEmpresa: 'Mi Empresa',
      nombreAplicacion: 'MonitorIP',
      logotipo: '',
      tiempoActualizacion: 30,
      umbralLatencia: 100,
      intentosReconexion: 3
    });
    
    toast.info('Valores restablecidos a los predeterminados');
  };

  if (cargando) {
    return (
      <div className="p-6 text-center">
        <p className="text-neutral-500">Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-neutral-800">Configuración del sistema</h2>
      
      <form onSubmit={guardarConfiguracion} className="bg-white rounded-lg shadow overflow-hidden animate-fade-in">
        <div className="p-6 border-b border-neutral-200">
          <h3 className="text-lg font-medium text-neutral-900">Configuración general</h3>
          <p className="mt-1 text-sm text-neutral-500">
            Ajuste la configuración del sistema de monitoreo según sus necesidades.
          </p>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Información de la empresa */}
          <div>
            <h4 className="text-base font-medium text-neutral-900 mb-4">Información de la empresa</h4>
            <div className="space-y-4">
              <div>
                <label htmlFor="nombreEmpresa" className="block text-sm font-medium text-neutral-700 mb-1">
                  Nombre de la empresa <span className="text-danger-600">*</span>
                </label>
                <input
                  type="text"
                  id="nombreEmpresa"
                  name="nombreEmpresa"
                  value={form.nombreEmpresa}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="nombreAplicacion" className="block text-sm font-medium text-neutral-700 mb-1">
                  Nombre de la aplicación <span className="text-danger-600">*</span>
                </label>
                <input
                  type="text"
                  id="nombreAplicacion"
                  name="nombreAplicacion"
                  value={form.nombreAplicacion}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="logotipo" className="block text-sm font-medium text-neutral-700 mb-1">
                  Logotipo
                </label>
                <div className="flex items-start space-x-4">
                  {form.logotipo && (
                    <img 
                      src={form.logotipo} 
                      alt="Logo preview" 
                      className="w-16 h-16 object-contain border rounded-md"
                    />
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      id="logotipo"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    />
                    <p className="mt-1 text-sm text-neutral-500">
                      Recomendado: imagen cuadrada de 128x128 píxeles
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Configuración de monitoreo */}
          <div>
            <h4 className="text-base font-medium text-neutral-900 mb-4">Configuración de monitoreo</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="tiempoActualizacion" className="block text-sm font-medium text-neutral-700 mb-1">
                  Tiempo de actualización global (segundos)
                </label>
                <input
                  type="number"
                  id="tiempoActualizacion"
                  name="tiempoActualizacion"
                  value={form.tiempoActualizacion}
                  onChange={handleChange}
                  min={5}
                  max={3600}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="mt-1 text-sm text-neutral-500">
                  Tiempo mínimo entre actualizaciones de datos (mínimo recomendado: 30 segundos).
                </p>
              </div>
              
              <div>
                <label htmlFor="umbralLatencia" className="block text-sm font-medium text-neutral-700 mb-1">
                  Umbral de latencia alta (ms)
                </label>
                <input
                  type="number"
                  id="umbralLatencia"
                  name="umbralLatencia"
                  value={form.umbralLatencia}
                  onChange={handleChange}
                  min={10}
                  max={5000}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="mt-1 text-sm text-neutral-500">
                  Valor de latencia a partir del cual se considera alta (se mostrará en amarillo o rojo).
                </p>
              </div>
              
              <div>
                <label htmlFor="intentosReconexion" className="block text-sm font-medium text-neutral-700 mb-1">
                  Intentos de reconexión
                </label>
                <input
                  type="number"
                  id="intentosReconexion"
                  name="intentosReconexion"
                  value={form.intentosReconexion}
                  onChange={handleChange}
                  min={1}
                  max={10}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="mt-1 text-sm text-neutral-500">
                  Número de intentos de reconexión antes de marcar un dispositivo como caído.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex justify-between">
          <button
            type="button"
            onClick={reiniciarPredeterminados}
            className="inline-flex items-center px-4 py-2 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <RefreshCw size={16} className="mr-2" />
            Restablecer predeterminados
          </button>
          
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            disabled={guardando}
          >
            <Save size={16} className="mr-2" />
            {guardando ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Configuracion;