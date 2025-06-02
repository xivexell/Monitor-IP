import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Server, 
  FileBarChart, 
  History, 
  Settings, 
  Menu, 
  X,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import classNames from 'classnames';
import { useConfiguracion } from '../../hooks/useConfiguracion';
import VersionModal from './VersionModal';

const Layout: React.FC = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [pageTitle, setPageTitle] = React.useState('Dashboard');
  const { configuracion, toggleSidebar } = useConfiguracion();
  const [versionModalOpen, setVersionModalOpen] = React.useState(false);

  // Actualizar título de página según la ruta
  React.useEffect(() => {
    const path = location.pathname;
    if (path === '/') setPageTitle('Dashboard');
    else if (path.startsWith('/dispositivos')) {
      if (path === '/dispositivos') setPageTitle('Dispositivos');
      else if (path.includes('/nuevo')) setPageTitle('Nuevo Dispositivo');
      else if (path.includes('/editar')) setPageTitle('Editar Dispositivo');
    }
    else if (path === '/reportes') setPageTitle('Reportes');
    else if (path === '/historial') setPageTitle('Historial');
    else if (path === '/configuracion') setPageTitle('Configuración');
    else setPageTitle(configuracion?.nombreAplicacion || 'MonitorIP');
  }, [location, configuracion?.nombreAplicacion]);

  // Menú de navegación
  const navItems = [
    { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/dispositivos', icon: <Server size={20} />, label: 'Dispositivos' },
    { path: '/reportes', icon: <FileBarChart size={20} />, label: 'Reportes' },
    { path: '/historial', icon: <History size={20} />, label: 'Historial' },
    { path: '/configuracion', icon: <Settings size={20} />, label: 'Configuración' }
  ];

  return (
    <div className="flex h-screen bg-neutral-100">
      {/* Version Modal */}
      <VersionModal 
        isOpen={versionModalOpen} 
        onClose={() => setVersionModalOpen(false)} 
      />

      {/* Sidebar para móvil */}
      <div 
        className={classNames(
          "fixed inset-0 z-40 lg:hidden bg-neutral-900/50 transition-opacity duration-200",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside 
        className={classNames(
          "fixed inset-y-0 left-0 z-50 bg-primary-800 text-white transition-all duration-300 ease-in-out lg:relative lg:z-auto",
          configuracion?.sidebarExpandido ? "w-64" : "w-20",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo y título */}
          <div className="flex items-center justify-between p-4 border-b border-primary-700">
            <Link to="/" className="flex items-center space-x-3 overflow-hidden">
              {configuracion?.logotipo ? (
                <img 
                  src={configuracion.logotipo} 
                  alt="Logo" 
                  className="w-8 h-8 object-contain"
                />
              ) : (
                <Server size={28} className="text-white flex-shrink-0" />
              )}
              {configuracion?.sidebarExpandido && (
                <span className="text-xl font-bold truncate">
                  {configuracion?.nombreAplicacion || 'MonitorIP'}
                </span>
              )}
            </Link>
            <div className="flex items-center">
              <button 
                className="p-1 rounded-md lg:hidden hover:bg-primary-700"
                onClick={() => setSidebarOpen(false)}
              >
                <X size={20} />
              </button>
              <button
                className="p-1 rounded-md hidden lg:block hover:bg-primary-700"
                onClick={toggleSidebar}
                title={configuracion?.sidebarExpandido ? "Contraer menú" : "Expandir menú"}
              >
                {configuracion?.sidebarExpandido ? (
                  <ChevronLeft size={20} />
                ) : (
                  <ChevronRight size={20} />
                )}
              </button>
            </div>
          </div>

          {/* Navegación */}
          <nav className="flex-1 py-4 overflow-y-auto">
            <ul className="space-y-1 px-2">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={classNames(
                      "flex items-center space-x-3 p-3 rounded-md transition-colors",
                      location.pathname === item.path
                        ? "bg-primary-700 text-white"
                        : "text-primary-100 hover:bg-primary-700/50"
                    )}
                    title={!configuracion?.sidebarExpandido ? item.label : undefined}
                  >
                    {item.icon}
                    {configuracion?.sidebarExpandido && <span>{item.label}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer del sidebar */}
          <div className="p-4 border-t border-primary-700">
            <button
              onClick={() => setVersionModalOpen(true)}
              className="flex items-center space-x-3 text-sm text-primary-200 hover:text-white transition-colors w-full"
            >
              <LogOut size={18} />
              {configuracion?.sidebarExpandido && <span>Versión 1.0.0</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between p-4">
            {/* Botón para abrir sidebar en móvil */}
            <div className="flex items-center">
              <button 
                className="p-1 rounded-md lg:hidden hover:bg-neutral-100"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={24} />
              </button>

              {/* Título de la página y branding */}
              <div className="ml-2 lg:ml-0">
                <h1 className="text-xl font-semibold text-neutral-800">
                  {pageTitle}
                </h1>
                {configuracion?.nombreEmpresa && (
                  <p className="text-sm text-neutral-500 hidden md:block">
                    {configuracion.nombreEmpresa}
                  </p>
                )}
              </div>
            </div>

            {/* Logo en el header */}
            {configuracion?.logotipo && (
              <div className="hidden md:block">
                <img 
                  src={configuracion.logotipo} 
                  alt="Logo" 
                  className="h-8 w-auto object-contain"
                />
              </div>
            )}
          </div>
        </header>

        {/* Contenido de la página */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-neutral-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;