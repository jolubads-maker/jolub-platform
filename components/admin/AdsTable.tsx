import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/apiService';
import { Ad } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const AdsTable: React.FC = () => {
    const [ads, setAds] = useState<Ad[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAds();
    }, []);

    const fetchAds = async () => {
        try {
            const data = await apiService.get('/admin/ads');
            setAds(data);
        } catch (error) {
            console.error('Error fetching ads:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('¿Estás seguro de eliminar este anuncio?')) return;
        try {
            await apiService.delete(`/admin/ads/${id}`);
            setAds(ads.filter(ad => ad.id !== id));
        } catch (error) {
            console.error('Error deleting ad:', error);
            alert('Error al eliminar el anuncio');
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
    );

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-white/20 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                <h2 className="text-xl font-bold text-[#6e0ad6]">Gestión de Anuncios</h2>
                <span className="text-sm text-gray-500">{ads.length} anuncios publicados</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">Anuncio</th>
                            <th className="px-6 py-4">Vendedor</th>
                            <th className="px-6 py-4">Precio</th>
                            <th className="px-6 py-4">Métricas</th>
                            <th className="px-6 py-4">Estado</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {ads.map((ad) => (
                            <tr key={ad.id} className="hover:bg-purple-50/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                            {ad.media?.[0] ? (
                                                <img src={ad.media[0].url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900 line-clamp-1">{ad.title}</div>
                                            <div className="text-xs text-gray-500">ID: {ad.uniqueCode || ad.id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-900">{(ad as any).seller?.name || 'Desconocido'}</span>
                                        <span className="text-xs text-gray-500">{(ad as any).seller?.email}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="font-bold text-[#6e0ad6]">${ad.price.toLocaleString()}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <div className="flex items-center gap-1" title="Visitas">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            {ad.views || 0}
                                        </div>
                                        <div className="flex items-center gap-1" title="Favoritos">
                                            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                            </svg>
                                            {(ad as any).favorites?.length || 0}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${new Date(ad.expiresAt!) > new Date()
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                        }`}>
                                        {new Date(ad.expiresAt!) > new Date() ? 'Activo' : 'Vencido'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleDelete(ad.id)}
                                        className="text-red-500 hover:text-red-700 font-medium text-sm transition-colors hover:bg-red-50 px-3 py-1 rounded-lg"
                                    >
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {ads.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                    No hay anuncios publicados aún.
                </div>
            )}
        </div>
    );
};

export default AdsTable;
