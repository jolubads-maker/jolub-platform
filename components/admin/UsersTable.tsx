import React, { useEffect, useState } from 'react';
import { User } from '../../src/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../src/config/firebase';

const UsersTable: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const usersRef = collection(db, 'users');
            const snapshot = await getDocs(usersRef);
            const usersData: User[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as User[];
            setUsers(usersData);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleBan = async (id: string | number) => {
        try {
            // TODO: Implement ban functionality with Firestore
            alert('Funcionalidad de ban pendiente de implementación con Firebase');
        } catch (error) {
            console.error('Error toggling ban:', error);
            alert('Error al actualizar estado del usuario');
        }
    };

    const getRecommendedAction = (user: User) => {
        if (!user.emailVerified) return { label: 'Verificar Email', color: 'bg-yellow-100 text-yellow-800' };
        if (!user.phoneVerified) return { label: 'Verificar Teléfono', color: 'bg-blue-100 text-blue-800' };
        if (user.role === 'USER') return { label: 'Promover a Admin', color: 'bg-purple-100 text-purple-800' };
        return { label: 'Todo en orden', color: 'bg-green-100 text-green-800' };
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
    );

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-white/20 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                <h2 className="text-xl font-bold text-[#6e0ad6]">Gestión de Usuarios</h2>
                <span className="text-sm text-gray-500">{users.length} usuarios registrados</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">Usuario</th>
                            <th className="px-6 py-4">Contacto</th>
                            <th className="px-6 py-4">Rol / Estado</th>
                            <th className="px-6 py-4">Registro</th>
                            <th className="px-6 py-4">Acción Recomendada</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map((user) => {
                            const action = getRecommendedAction(user);
                            return (
                                <tr key={user.id} className="hover:bg-purple-50/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <img
                                                    src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                                                    alt=""
                                                    className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-100"
                                                />
                                                {user.isOnline && (
                                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900">{user.name}</div>
                                                <div className="text-xs text-gray-500">@{user.username || 'sin_usuario'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm text-gray-600">{user.email}</span>
                                            {user.phone && <span className="text-xs text-gray-400">{user.phone}</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className={`inline-flex w-fit items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'ADMIN'
                                                ? 'bg-[#6e0ad6]/10 text-[#6e0ad6]'
                                                : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {user.role || 'USER'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {user.createdAt ? format(new Date(user.createdAt), 'dd MMM yyyy', { locale: es }) : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${action.color}`}>
                                            {action.label}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleToggleBan(user.id)}
                                            className="text-red-500 hover:text-red-700 font-medium text-sm transition-colors hover:bg-red-50 px-3 py-1 rounded-lg"
                                        >
                                            Banear
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {users.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                    No hay usuarios registrados aún.
                </div>
            )}
        </div>
    );
};

export default UsersTable;
