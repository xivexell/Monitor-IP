import React from 'react';
import { X, Code2, Cpu } from 'lucide-react';

interface VersionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VersionModal: React.FC<VersionModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur effect */}
      <div 
        className="absolute inset-0 bg-neutral-900/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal content with tech-inspired design */}
      <div className="relative bg-neutral-900 text-white rounded-lg shadow-xl w-full max-w-md transform transition-all duration-300 scale-100 opacity-100">
        {/* Decorative header */}
        <div className="absolute -top-2 -left-2 -right-2 h-1 bg-gradient-to-r from-primary-500 via-success-500 to-warning-500 rounded-full" />
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
        
        {/* Content */}
        <div className="p-6">
          {/* Version badge */}
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary-900 text-primary-300 text-sm mb-4">
            <Code2 size={14} className="mr-2" />
            Versión 1.0.0
          </div>
          
          {/* Title with tech decoration */}
          <div className="relative">
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-8 bg-success-500 rounded-full" />
            <h2 className="text-2xl font-bold mb-4 pl-2">Acerca del Software</h2>
          </div>
          
          {/* Author info with tech-inspired layout */}
          <div className="space-y-4 mt-6">
            <div className="flex items-start space-x-3 bg-neutral-800 rounded-lg p-4">
              <Cpu className="text-success-500 mt-1" size={20} />
              <div>
                <h3 className="font-semibold text-success-400">Desarrollado por</h3>
                <p className="text-lg font-bold">Ing. Jaime Ballesteros S.</p>
                <p className="text-neutral-400">Jefe Div. Infraestructura Tecnológica</p>
              </div>
            </div>
          </div>
          
          {/* Decorative footer */}
          <div className="mt-6 pt-4 border-t border-neutral-800">
            <div className="flex justify-center space-x-2">
              <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
              <span className="w-2 h-2 bg-success-500 rounded-full animate-pulse delay-100" />
              <span className="w-2 h-2 bg-warning-500 rounded-full animate-pulse delay-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VersionModal;