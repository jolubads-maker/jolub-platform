import React from 'react';
import { Ad } from '../src/types';
import AdCard from './AdCard';

interface AdListProps {
  ads: Ad[];
  onSelectAd: (adId: string | number) => void;
}

const AdList: React.FC<AdListProps> = ({ ads, onSelectAd }) => {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-brand-light">Anuncios Recientes</h2>
      {ads.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg">
          <p className="text-gray-400 text-lg">No hay anuncios disponibles en este momento.</p>
          <p className="text-gray-500 mt-2">¡Sé el primero en publicar!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {ads.map(ad => (
            <AdCard key={ad.id} ad={ad} onSelect={() => onSelectAd(ad.id)} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdList;
