import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-4">
      <div className="bg-danger-50 p-4 rounded-full mb-6">
        <AlertTriangle size={64} className="text-danger-600" />
      </div>
      
      <h1 className="text-4xl font-bold text-neutral-800 mb-2">404</h1>
      <h2 className="text-2xl font-semibold text-neutral-700 mb-4">Página no encontrada</h2>
      
      <p className="text-neutral-600 max-w-md mb-8">
        Lo sentimos, la página que está buscando no existe o ha sido movida.
      </p>
      
      <Link 
        to="/"
        className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors shadow-md"
      >
        <Home size={18} />
        <span>Volver al inicio</span>
      </Link>
    </div>
  );
};

export default NotFound;