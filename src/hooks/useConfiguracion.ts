import { useState, useEffect, useCallback } from 'react';
import db, { ConfiguracionApp } from '../database/db';

export function useConfiguracion() {
  const [configuracion, setConfiguracion] = useState<ConfiguracionApp | null>(null);

  // Cargar configuración
  const cargarConfiguracion = useCallback(async () => {
    try {
      const config = await db.configuracion.toArray();
      if (config.length > 0) {
        setConfiguracion(config[0]);
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error);
    }
  }, []);

  // Actualizar configuración
  const actualizarConfiguracion = useCallback(async (nuevaConfig: Partial<ConfiguracionApp>) => {
    try {
      if (configuracion?.id) {
        await db.configuracion.update(configuracion.id, {
          ...configuracion,
          ...nuevaConfig
        });
        await cargarConfiguracion();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error al actualizar configuración:', error);
      return false;
    }
  }, [configuracion, cargarConfiguracion]);

  // Toggle sidebar
  const toggleSidebar = useCallback(async () => {
    if (configuracion) {
      await actualizarConfiguracion({
        sidebarExpandido: !configuracion.sidebarExpandido
      });
    }
  }, [configuracion, actualizarConfiguracion]);

  // Cargar configuración inicial
  useEffect(() => {
    cargarConfiguracion();
  }, [cargarConfiguracion]);

  return {
    configuracion,
    actualizarConfiguracion,
    toggleSidebar
  };
}