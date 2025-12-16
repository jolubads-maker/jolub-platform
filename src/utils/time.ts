/**
 * Utilidades de tiempo para gestión de expiración de anuncios
 */

// Duración de anuncios según plan (en días)
export const PLAN_DURATION_DAYS: Record<string, number> = {
    free: 7,
    basic: 30,
    pro: 30,
    business: 30,
};

export interface TimeRemaining {
    days: number;
    hours: number;
    minutes: number;
    totalHours: number;
    totalMinutes: number;
    isExpired: boolean;
    isUrgent: boolean;      // Menos de 48 horas
    isCritical: boolean;    // Menos de 24 horas
    percentage: number;     // Porcentaje de tiempo transcurrido (0-100)
}

/**
 * Calcula los días y horas restantes antes de que expire un anuncio
 * @param createdAt - Fecha de creación del anuncio
 * @param plan - Plan del usuario (free, basic, pro, business)
 * @returns Objeto con días, horas y flags de urgencia
 */
export function getTimeRemaining(createdAt: Date | string, plan: string = 'free'): TimeRemaining {
    const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
    const durationDays = PLAN_DURATION_DAYS[plan] || PLAN_DURATION_DAYS.free;

    // Fecha de expiración
    const expirationDate = new Date(created.getTime() + durationDays * 24 * 60 * 60 * 1000);
    const now = new Date();

    // Tiempo restante en milisegundos
    const remainingMs = expirationDate.getTime() - now.getTime();

    // Si ya expiró
    if (remainingMs <= 0) {
        return {
            days: 0,
            hours: 0,
            minutes: 0,
            totalHours: 0,
            totalMinutes: 0,
            isExpired: true,
            isUrgent: true,
            isCritical: true,
            percentage: 100,
        };
    }

    // Calcular tiempo restante
    const totalMinutes = Math.floor(remainingMs / (1000 * 60));
    const totalHours = Math.floor(remainingMs / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    const minutes = totalMinutes % 60;

    // Tiempo total del plan en ms
    const totalDurationMs = durationDays * 24 * 60 * 60 * 1000;
    // Tiempo transcurrido
    const elapsedMs = now.getTime() - created.getTime();
    // Porcentaje transcurrido
    const percentage = Math.min(100, Math.max(0, (elapsedMs / totalDurationMs) * 100));

    return {
        days,
        hours,
        minutes,
        totalHours,
        totalMinutes,
        isExpired: false,
        isUrgent: totalHours < 48,     // Menos de 48 horas
        isCritical: totalHours < 24,   // Menos de 24 horas
        percentage,
    };
}

/**
 * Formatea el tiempo restante como texto legible
 * @param timeRemaining - Objeto de tiempo restante
 * @returns Texto formateado (ej: "2d 5h" o "23h 15m")
 */
export function formatTimeRemaining(timeRemaining: TimeRemaining): string {
    if (timeRemaining.isExpired) {
        return 'Expirado';
    }

    if (timeRemaining.days > 0) {
        return `${timeRemaining.days}d ${timeRemaining.hours}h`;
    }

    if (timeRemaining.hours > 0) {
        return `${timeRemaining.hours}h ${timeRemaining.minutes}m`;
    }

    return `${timeRemaining.minutes}m`;
}

/**
 * Obtiene el color de urgencia según el estado
 */
export function getUrgencyColor(timeRemaining: TimeRemaining): {
    bg: string;
    text: string;
    border: string;
} {
    if (timeRemaining.isExpired) {
        return {
            bg: 'bg-red-600',
            text: 'text-red-500',
            border: 'border-red-500',
        };
    }

    if (timeRemaining.isCritical) {
        return {
            bg: 'bg-red-500',
            text: 'text-red-500',
            border: 'border-red-500/50',
        };
    }

    if (timeRemaining.isUrgent) {
        return {
            bg: 'bg-orange-500',
            text: 'text-orange-500',
            border: 'border-orange-500/50',
        };
    }

    return {
        bg: 'bg-green-500',
        text: 'text-green-500',
        border: 'border-transparent',
    };
}
