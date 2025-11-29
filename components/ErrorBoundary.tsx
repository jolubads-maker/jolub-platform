import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#0b141a] flex items-center justify-center p-4">
                    <div className="bg-[#1a2632] p-8 rounded-2xl border border-white/10 max-w-md w-full text-center shadow-2xl">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-red-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Algo salió mal</h1>
                        <p className="text-gray-400 mb-6">
                            Ha ocurrido un error inesperado. Hemos notificado al equipo técnico.
                        </p>
                        <div className="bg-black/30 p-4 rounded-lg mb-6 text-left overflow-auto max-h-32">
                            <code className="text-red-400 text-xs font-mono">
                                {this.state.error?.message}
                            </code>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-3 bg-[#6e0ad6] hover:bg-[#5b08b0] text-white font-bold rounded-xl transition-colors shadow-lg shadow-purple-900/20"
                        >
                            Recargar Aplicación
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
