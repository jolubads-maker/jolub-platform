import React, { useState } from 'react';
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
    icon: "🏠",
    subcategories: ["Casa", "Apartamentos", "Negocios / Bodegas", "Terrenos"]
  },
  {
    title: "Vehículos",
    icon: "🚗",
    subcategories: ["Automóvil", "Camionetas / Sub", "Motos", "Camiones / Buses", "Botes / Lanchas"]
  },
  {
    title: "Articulos Varios",
    icon: "📦",
    subcategories: ["Celulares/Tablet/SmartWatch", "Computadoras", "Articulos del Hogar", "Ropa Adulto", "Ropa Adolecentes", "Ropa Niños", "Articulos personales"]
  },
  {
    title: "Servicios profesionales",
    icon: "💼",
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

  const notifyChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleCategorySelect = (category: string) => {
    if (filters.subcategory) return;
    const newCategory = filters.category === category ? 'Todas' : category;
    notifyChange({
      ...filters,
      category: newCategory,
      subcategory: ''
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
    <div className="mb-6">
      {/* Mobile Toggle */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="lg:hidden w-full bg-[#4b0997] text-white font-bold py-3 px-6 rounded-xl mb-4 flex items-center justify-center shadow-lg"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
        {showFilters ? 'Ocultar Filtros' : 'Filtrar Anuncios'}
      </button>

      {/* Compact Filter Box */}
      <div className={`bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden ${showFilters ? 'block' : 'hidden lg:block'}`}>

        {/* Header Row with Categories Inline */}
        <div className="flex flex-wrap items-center gap-3 p-4 bg-gradient-to-r from-[#4b0997] to-[#6b21a8]">
          <h3 className="text-white font-bold text-base mr-2">Explorar Categorías</h3>

          {/* Category Buttons - Inline */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES_DATA.map((cat) => {
              const isSelected = filters.category === cat.title;
              const isDisabled = !!filters.subcategory && !isSelected;

              return (
                <button
                  key={cat.title}
                  onClick={() => !isDisabled && handleCategorySelect(cat.title)}
                  disabled={isDisabled}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-1.5
                    ${isSelected
                      ? 'bg-[#ea580c] text-white shadow-lg ring-2 ring-white/30'
                      : isDisabled
                        ? 'bg-white/20 text-white/50 cursor-not-allowed'
                        : 'bg-white/20 text-white hover:bg-[#ea580c] hover:shadow-md backdrop-blur-sm'
                    }
                  `}
                >
                  <span>{cat.icon}</span>
                  <span className="hidden sm:inline">{cat.title}</span>
                </button>
              );
            })}
          </div>

          {/* Reset Button */}
          {(filters.category !== 'Todas' || filters.location) && (
            <button
              onClick={handleReset}
              className="ml-auto text-white/80 hover:text-white text-sm font-medium flex items-center gap-1 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Limpiar
            </button>
          )}
        </div>

        {/* Subcategories & Location - Only when category selected */}
        {currentCategoryData && (
          <div className="p-4 bg-gray-50 border-t border-gray-100">
            <div className="flex flex-wrap items-start gap-6">

              {/* Subcategories */}
              <div className="flex-1 min-w-[200px]">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  {currentCategoryData.icon} Subcategorías
                </h4>
                <div className="flex flex-wrap gap-2">
                  {currentCategoryData.subcategories.map((sub) => {
                    const isSubSelected = filters.subcategory === sub;
                    return (
                      <button
                        key={sub}
                        onClick={() => handleSubcategorySelect(sub)}
                        className={`
                          px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200
                          ${isSubSelected
                            ? 'bg-[#ea580c] text-white shadow-md'
                            : 'bg-[#4b0997] text-white hover:bg-[#ea580c]'
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
              <div className="w-full sm:w-auto min-w-[200px]">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  📍 Ubicación
                </h4>
                <div className="relative">
                  <select
                    value={filters.location}
                    onChange={handleLocationChange}
                    className={`
                      w-full appearance-none py-2.5 px-4 pr-10 rounded-lg text-sm font-semibold
                      transition-all duration-200 cursor-pointer
                      ${filters.location
                        ? 'bg-[#ea580c] text-white border-2 border-[#ea580c]'
                        : 'bg-[#4b0997] text-white border-2 border-[#4b0997] hover:border-[#ea580c]'
                      }
                      focus:outline-none focus:ring-2 focus:ring-[#ea580c] focus:ring-offset-2
                    `}
                  >
                    <option value="" className="bg-white text-gray-800">Todas las ubicaciones</option>
                    {DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept} className="bg-white text-gray-800">{dept}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                    <svg className="fill-current h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
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
