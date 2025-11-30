import React, { useState, useEffect } from 'react';
import { AdCategory } from '../src/types';

interface AdFiltersProps {
  onFilterChange: (filters: FilterValues) => void;
  onReset: () => void;
}

export interface FilterValues {
  category: string;
  subcategory: string;
  minPrice: number;
  maxPrice: number;
  location: string;
}

const CATEGORIES_DATA = [
  {
    title: "Bienes raíces",
    subcategories: ["Casa", "Apartamentos", "Negocios / Bodegas", "Terrenos"]
  },
  {
    title: "Vehículos",
    subcategories: ["Automóvil", "Camionetas / Sub", "Motos", "Camiones / Buses", "Botes / Lanchas"]
  },
  {
    title: "Articulos Varios",
    subcategories: ["Celulares/Tablet/SmartWatch", "Computadoras", "Articulos del Hogar", "Ropa Adulto", "Ropa Adolecentes", "Ropa Niños", "Articulos personales"]
  },
  {
    title: "Servicios profesionales",
    subcategories: ["Abogados", "Ingenieros", "Contabilidad / Auditoría", "Médicos", "Veterinaria", "Publicidad", "Otros servicios"]
  }
];

const DEPARTMENTS = [
  "Managua", "León", "Chinandega", "Masaya", "Granada", "Carazo", "Rivas",
  "Estelí", "Madriz", "Nueva Segovia", "Jinotega", "Matagalpa", "Boaco",
  "Chontales", "Río San Juan", "RAAN", "RAAS"
];

const AdFilters: React.FC<AdFiltersProps> = ({ onFilterChange, onReset }) => {
  const [filters, setFilters] = useState<FilterValues>({
    category: 'Todas',
    subcategory: '',
    minPrice: 0,
    maxPrice: 100000,
    location: ''
  });

  const [showFilters, setShowFilters] = useState(false);

  // Helper to notify parent
  const notifyChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleCategorySelect = (category: string) => {
    // If subcategory is active, prevent changing main category (unless deselecting current one, but logic says disable main tags)
    if (filters.subcategory) return;

    const newCategory = filters.category === category ? 'Todas' : category;
    notifyChange({
      ...filters,
      category: newCategory,
      subcategory: '', // Reset subcategory when changing category
      location: '' // Optional: Reset location or keep it? User didn't specify, but usually safer to keep unless context changes drastically. Let's keep it for now, or reset if desired. User said "muestre la lista de departamento de ese tags seleccionado", implying location is tied to category context? No, departments are usually global. Let's keep location unless user explicitly wants reset.
      // Actually, user said: "muestre la lista de departameto de ese tags seleccionado". This implies the dropdown appears ONLY when a tag is selected.
    });
  };

  const handleSubcategorySelect = (sub: string) => {
    const newSub = filters.subcategory === sub ? '' : sub;
    notifyChange({
      ...filters,
      subcategory: newSub
    });
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    notifyChange({
      ...filters,
      location: e.target.value
    });
  };

  const handleReset = () => {
    const resetFilters = {
      category: 'Todas',
      subcategory: '',
      minPrice: 0,
      maxPrice: 100000,
      location: ''
    };
    notifyChange(resetFilters);
  };

  const currentCategoryData = CATEGORIES_DATA.find(c => c.title === filters.category);

  return (
    <div className="mb-8">
      {/* Mobile Toggle */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="lg:hidden w-full bg-white border border-gray-200 text-[#4b0997] font-bold py-3 px-6 rounded-xl mb-4 flex items-center justify-center shadow-sm"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
        {showFilters ? 'Ocultar Filtros' : 'Filtrar Anuncios'}
      </button>

      <div className={`bg-white rounded-3xl shadow-lg p-6 border border-gray-100 ${showFilters ? 'block' : 'hidden lg:block'}`}>

        {/* Header with Reset */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-800">Explorar Categorías</h3>
          {(filters.category !== 'Todas' || filters.location) && (
            <button onClick={handleReset} className="text-sm text-red-500 hover:text-red-700 font-medium underline">
              Limpiar todo
            </button>
          )}
        </div>

        {/* Level 1: Main Categories (Tags) */}
        <div className="flex flex-wrap gap-3 mb-6">
          {CATEGORIES_DATA.map((cat) => {
            const isSelected = filters.category === cat.title;
            const isDisabled = !!filters.subcategory && !isSelected; // Disable others if subcategory is active

            return (
              <button
                key={cat.title}
                onClick={() => !isDisabled && handleCategorySelect(cat.title)}
                disabled={isDisabled}
                className={`
                  px-5 py-2.5 rounded-full text-sm font-bold transition-all transform duration-200
                  ${isSelected
                    ? 'bg-[#4b0997] text-white shadow-md scale-105 ring-2 ring-offset-2 ring-[#4b0997]'
                    : isDisabled
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105'
                  }
                `}
              >
                {cat.title}
              </button>
            );
          })}
        </div>

        {/* Level 2 & 3: Subcategories & Location (Only if Category Selected) */}
        {currentCategoryData && (
          <div className="animate-fadeIn space-y-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">

            {/* Subcategories */}
            <div>
              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                Subcategorías de {currentCategoryData.title}
              </h4>
              <div className="flex flex-wrap gap-2">
                {currentCategoryData.subcategories.map((sub) => {
                  const isSubSelected = filters.subcategory === sub;
                  return (
                    <button
                      key={sub}
                      onClick={() => handleSubcategorySelect(sub)}
                      className={`
                        px-4 py-2 rounded-lg text-sm font-medium transition-all border
                        ${isSubSelected
                          ? 'bg-olx-orange text-white border-olx-orange shadow-sm'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-olx-orange hover:text-olx-orange'
                        }
                      `}
                    >
                      {sub}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Location Dropdown */}
            <div>
              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                Ubicación
              </h4>
              <div className="relative">
                <select
                  value={filters.location}
                  onChange={handleLocationChange}
                  className="w-full md:w-1/2 appearance-none bg-white border border-gray-300 text-gray-700 py-3 px-4 pr-8 rounded-xl leading-tight focus:outline-none focus:bg-white focus:border-[#4b0997] focus:ring-1 focus:ring-[#4b0997]"
                >
                  <option value="">Todas las ubicaciones</option>
                  {DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 md:w-1/2 justify-end pr-6">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default AdFilters;

