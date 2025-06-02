import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dispositivo } from '../../database/db';
import { toast } from 'react-toastify';

interface FormularioDispositivoProps {
  dispositivo?: Dispositivo;
  onSubmit: (dispositivo: Dispositivo) => Promise<boolean>;
  modo: 'crear' | 'editar';
}

const FormularioDispositivo: React.FC<FormularioDispositivoProps> = ({
  dispositivo,
  onSubmit,
  modo
}) => {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(false);
  
  // Estado para el formulario
  const [form, setForm] = useState<Dispositivo>({
    ip: '',
    alias: '',
    descripcion: '',
    activo: true,
    intervalo: 30,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // Cargar datos del dispositivo si estamos editando
  useEffect(() => {
    if (modo === 'editar' && dispositivo) {
      setForm(dispositivo);
    }
  }, [dispositivo, modo]);

  // Manejar cambios en los campos del formulario
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setForm(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }));
    } else if (name === 'intervalo') {
      setForm(prev => ({
        ...prev,
        [name]: parseInt(value) || 30
      }));
    } else {
      setForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Validar dirección IP
  const validarIP = (ip: string): boolean => {
    // Regex para validar IPv4
    const regexIPv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    
    // Regex para validar nombre de dominio
    const regexDominio = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
    
    return regexIPv4.test(ip) || regexDominio.test(ip);
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos obligatorios
    if (!form.ip || !form.alias) {
      toast.error('Los campos IP y Alias son obligatorios');
      return;
    }
    
    // Validar formato de IP
    if (!validarIP(form.ip)) {
      toast.error('La dirección IP o dominio no es válida');
      return;
    }
    
    // Validar intervalo de ping
    if (form.intervalo < 5) {
      toast.error('El intervalo mínimo de ping es de 5 segundos');
      return;
    }
    
    try {
      setCargando(true);
      
      // Actualizar fechas
      const dispositivoActualizado: Dispositivo = {
        ...form,
        updatedAt: new Date()
      };
      
      // Si es nuevo, establecer fecha de creación
      if (modo === 'crear') {
        dispositivoActualizado.createdAt = new Date();
      }
      
      // Enviar formulario
      const resultado = await onSubmit(dispositivoActualizado);
      
      if (resultado) {
        toast.success(
          modo === 'crear' 
            ? 'Dispositivo creado correctamente' 
            : 'Dispositivo actualizado correctamente'
        );
        navigate('/dispositivos');
      }
    } catch (error) {
      console.error('Error al guardar dispositivo:', error);
      toast.error('Error al guardar el dispositivo');
    } finally {
      setCargando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 animate-fade-in">
      <div className="space-y-4">
        {/* IP */}
        <div>
          <label htmlFor="ip" className="block text-sm font-medium text-neutral-700 mb-1">
            Dirección IP o dominio <span className="text-danger-600">*</span>
          </label>
          <input
            type="text"
            id="ip"
            name="ip"
            value={form.ip}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Ej: 192.168.1.1 o servidor.ejemplo.com"
            required
          />
        </div>
        
        {/* Alias */}
        <div>
          <label htmlFor="alias" className="block text-sm font-medium text-neutral-700 mb-1">
            Alias <span className="text-danger-600">*</span>
          </label>
          <input
            type="text"
            id="alias"
            name="alias"
            value={form.alias}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Ej: Router Principal"
            required
          />
        </div>
        
        {/* Descripción */}
        <div>
          <label htmlFor="descripcion" className="block text-sm font-medium text-neutral-700 mb-1">
            Descripción
          </label>
          <textarea
            id="descripcion"
            name="descripcion"
            value={form.descripcion || ''}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Descripción opcional del dispositivo"
          />
        </div>
        
        {/* Intervalo de ping */}
        <div>
          <label htmlFor="intervalo" className="block text-sm font-medium text-neutral-700 mb-1">
            Intervalo de ping (segundos)
          </label>
          <input
            type="number"
            id="intervalo"
            name="intervalo"
            value={form.intervalo}
            onChange={handleChange}
            min={5}
            max={3600}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <p className="text-sm text-neutral-500 mt-1">
            Tiempo entre cada ping. Mínimo recomendado: 30 segundos.
          </p>
        </div>
        
        {/* Estado activo */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="activo"
            name="activo"
            checked={form.activo}
            onChange={handleChange}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
          />
          <label htmlFor="activo" className="ml-2 block text-sm text-neutral-700">
            Dispositivo activo (monitorear)
          </label>
        </div>
      </div>
      
      {/* Botones de acción */}
      <div className="mt-6 flex items-center justify-end space-x-3">
        <button
          type="button"
          onClick={() => navigate('/dispositivos')}
          className="px-4 py-2 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          disabled={cargando}
        >
          {cargando ? 'Guardando...' : (modo === 'crear' ? 'Crear dispositivo' : 'Guardar cambios')}
        </button>
      </div>
    </form>
  );
};

export default FormularioDispositivo;