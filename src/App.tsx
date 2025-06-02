import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Dispositivos from './pages/Dispositivos';
import NuevoDispositivo from './pages/NuevoDispositivo';
import EditarDispositivo from './pages/EditarDispositivo';
import Reportes from './pages/Reportes';
import Historial from './pages/Historial';
import Configuracion from './pages/Configuracion';
import NotFound from './pages/NotFound';
import { initDB } from './database/db';

function App() {
  // Inicializar la base de datos al cargar la aplicación
  React.useEffect(() => {
    initDB();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="dispositivos" element={<Dispositivos />} />
        <Route path="dispositivos/nuevo" element={<NuevoDispositivo />} />
        <Route path="dispositivos/editar/:id" element={<EditarDispositivo />} />
        <Route path="reportes" element={<Reportes />} />
        <Route path="historial" element={<Historial />} />
        <Route path="configuracion" element={<Configuracion />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;