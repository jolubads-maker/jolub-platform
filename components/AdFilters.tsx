import React, { useState } from 'react';
import { AdCategory } from '../src/types';

interface AdFiltersProps {
  onFilterChange: (filters: FilterValues) => void;
  onReset: () => void;
}

export interface FilterValues {
  category: AdCategory | 'Todas';
  minPrice: number;
  maxPrice: number;
  location: string;
}

const CATEGORIES: (AdCategory | 'Todas')[] = [
  'Todas',
  'Electrónica',
  'Vehículos',
  'Hogar',
  'Moda',
  'Deportes',
  'Juguetes',
  'Libros',
  'Otros'
];

const AdFilters: React.FC<AdFiltersProps> = ({ onFilterChange, onReset }) => {
  const [filters, setFilters] = useState<FilterValues>({
    category: 'Todas',
    minPrice: 0,
    maxPrice: 100000,
    location: ''
  });

  const [showFilters, setShowFilters] = useState(false);

  const handleChange = (key: keyof FilterValues, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      category: 'Todas' as AdCategory | 'Todas',
      minPrice: 0,
      maxPrice: 100000,
      location: ''
    };
    setFilters(resetFilters);
    onReset();
  };

  return (
    <div className="mb-6">
      {/* Botón para mostrar/ocultar filtros en móvil */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="lg:hidden w-full bg-white border-2 border-blue-200 text-jolub-blue font-bold py-3 px-6 rounded-full mb-4 flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
      </button>

      <div className={`bg-white rounded-3xl shadow-xl p-6 border-2 border-blue-100 ${showFilters ? 'block' : 'hidden lg:block'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center">
            <svg className="w-6 h-6 mr-2 text-jolub-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filtros
          </h3>
          <button
            onClick={handleReset}
            className="text-sm text-gray-600 hover:text-jolub-blue font-medium underline transition-colors"
          >
            Limpiar filtros
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Categoría */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              📂 Categoría
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-jolub-blue focus:border-jolub-blue transition-all"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Precio Mínimo */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              💵 Precio Mínimo
            </label>
            <input
              type="number"
              value={filters.minPrice}
              onChange={(e) => handleChange('minPrice', parseInt(e.target.value) || 0)}
              min="0"
              placeholder="0"
              className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-jolub-blue focus:border-jolub-blue transition-all"
            />
          </div>

          {/* Precio Máximo */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              💰 Precio Máximo
            </label>
            <input
              type="number"
              value={filters.maxPrice}
              onChange={(e) => handleChange('maxPrice', parseInt(e.target.value) || 100000)}
              min="0"
              placeholder="100000"
              className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-jolub-blue focus:border-jolub-blue transition-all"
            />
          </div>

          {/* Ubicación */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              📍 Ubicación
            </label>
            <input
              type="text"
              value={filters.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="Ciudad o estado"
              className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-jolub-blue focus:border-jolub-blue transition-all"
            />
          </div>
        </div>

        {/* Resumen de filtros activos */}
        {(filters.category !== 'Todas' || filters.minPrice > 0 || filters.maxPrice < 100000 || filters.location) && (
          <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-sm font-medium text-gray-700 mb-2">🔍 Filtros activos:</p>
            <div className="flex flex-wrap gap-2">
              {filters.category !== 'Todas' && (
                <span className="px-3 py-1 bg-jolub-blue text-white text-xs font-medium rounded-full">
                  {filters.category}
                </span>
              )}
              {filters.minPrice > 0 && (
                <span className="px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
                  Desde ${filters.minPrice}
                </span>
              )}
              {filters.maxPrice < 100000 && (
                <span className="px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
                  Hasta ${filters.maxPrice}
                </span>
              )}
              {filters.location && (
                <span className="px-3 py-1 bg-purple-500 text-white text-xs font-medium rounded-full">
                  📍 {filters.location}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdFilters;

