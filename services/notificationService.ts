import { toast } from 'sonner';

export const notify = {
    success: (message: string) => {
        toast.success(message, {
            style: {
                background: '#10B981', // Green-500
                color: 'white',
                border: 'none',
            },
            className: 'font-sans',
        });
    },
    error: (message: string) => {
        toast.error(message, {
            style: {
                background: '#EF4444', // Red-500
                color: 'white',
                border: 'none',
            },
            className: 'font-sans',
        });
    },
    info: (message: string) => {
        toast.message(message, {
            style: {
                background: '#3B82F6', // Blue-500
                color: 'white',
                border: 'none',
            },
            className: 'font-sans',
        });
    },
    warning: (message: string) => {
        toast.warning(message, {
            style: {
                background: '#F59E0B', // Amber-500
                color: 'white',
                border: 'none',
            },
            className: 'font-sans',
        });
    },
    loading: (message: string) => {
        return toast.loading(message, {
            style: {
                background: '#1F2937', // Gray-800
                color: 'white',
                border: '1px solid #374151',
            },
            className: 'font-sans',
        });
    },
    dismiss: (toastId: string | number) => {
        toast.dismiss(toastId);
    }
};
