import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import { Ad } from '../../types';

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

    if (loading) return <div className="p-8 text-center">Cargando anuncios...</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800">Gestión de Anuncios</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4">Título</th>
                            <th className="px-6 py-4">Vendedor</th>
                            <th className="px-6 py-4">Precio</th>
                            <th className="px-6 py-4">Estado</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {ads.map((ad) => (
                            <tr key={ad.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 text-sm text-gray-500">#{ad.id}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        {ad.media?.[0] && (
                                            <img src={ad.media[0].url} alt="" className="w-10 h-10 rounded object-cover" />
                                        )}
                                        <span className="font-medium text-gray-900">{ad.title}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    {(ad as any).seller?.name || 'Desconocido'}
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-gray-900">
                                    ${ad.price.toLocaleString()}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${new Date(ad.expiresAt!) > new Date()
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                        }`}>
                                        {new Date(ad.expiresAt!) > new Date() ? 'Activo' : 'Vencido'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleDelete(ad.id)}
                                        className="text-red-500 hover:text-red-700 font-medium text-sm transition-colors"
                                    >
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdsTable;
