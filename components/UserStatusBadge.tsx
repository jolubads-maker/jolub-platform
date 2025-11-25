import React from 'react';

interface UserStatusBadgeProps {
    avatar: string;
    name: string;
    isOnline?: boolean;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showName?: boolean;
    className?: string;
    onClick?: () => void;
}

const UserStatusBadge: React.FC<UserStatusBadgeProps> = ({
    avatar,
    name,
    isOnline = false,
    size = 'md',
    showName = false,
    className = '',
    onClick
}) => {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-14 h-14',
        xl: 'w-24 h-24'
    };

    const statusSizeClasses = {
        sm: 'w-2.5 h-2.5 border-2',
        md: 'w-3 h-3 border-2',
        lg: 'w-4 h-4 border-2',
        xl: 'w-5 h-5 border-4'
    };

    return (
        <div
            className={`flex items-center gap-3 ${onClick ? 'cursor-pointer group' : ''} ${className}`}
            onClick={onClick}
        >
            {showName && (
                <span className="hidden lg:block truncate max-w-[100px] font-semibold">
                    {name}
                </span>
            )}
            <div className="relative">
                <img
                    src={avatar}
                    alt={name}
                    className={`${sizeClasses[size]} rounded-full object-cover border-2 border-white/20 ${onClick ? 'group-hover:border-white' : ''} transition-all shadow-sm`}
                />
                <div
                    className={`absolute bottom-0 right-0 rounded-full ${statusSizeClasses[size]} border-white ${isOnline ? 'bg-green-400' : 'bg-gray-400'}`}
                />
            </div>
        </div>
    );
};

export default UserStatusBadge;
