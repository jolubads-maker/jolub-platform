import { useState, useCallback, useMemo } from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../src/config/firebase';
import { Ad } from '../src/types';
import { notify } from '../services/notificationService';

// Precios de destacado por duración
const HIGHLIGHT_PRICES: Record<string, string> = {
    '1': '2.00',
    '3': '5.00',
    '7': '8.00',
    '15': '12.00',
    '30': '15.00',
};

interface UsePaymentProps {
    ad: Ad | null;
    duration: string;
    onSuccess?: () => void;
}

interface UsePaymentReturn {
    isProcessing: boolean;
    termsAccepted: boolean;
    setTermsAccepted: (accepted: boolean) => void;
    getPrice: () => string;
    createPayPalOrder: (actions: any) => Promise<string>;
    handlePayPalApprove: (data: any, actions: any) => Promise<void>;
    handlePaymentSuccess: (orderId: string, payerId: string) => Promise<void>;
}

/**
 * Custom hook para manejar la lógica de pagos de destacado de anuncios
 * @param ad - Anuncio a destacar
 * @param duration - Duración en días ('1', '3', '7', '15', '30')
 * @param onSuccess - Callback opcional al completar pago
 */
export const usePayment = ({ ad, duration, onSuccess }: UsePaymentProps): UsePaymentReturn => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);

    // Obtener precio según duración
    const getPrice = useCallback((): string => {
        return HIGHLIGHT_PRICES[duration] || '2.00';
    }, [duration]);

    // Crear orden de PayPal
    const createPayPalOrder = useCallback(async (actions: any): Promise<string> => {
        if (!ad) throw new Error('No hay anuncio seleccionado');

        const price = getPrice();

        return actions.order.create({
            intent: 'CAPTURE',
            purchase_units: [
                {
                    amount: {
                        currency_code: 'USD',
                        value: price,
                    },
                    description: `Destacar anuncio "${ad.title}" por ${duration} días`,
                },
            ],
        });
    }, [ad, duration, getPrice]);

    // Manejar pago exitoso en Firestore
    const handlePaymentSuccess = useCallback(async (orderId: string, payerId: string): Promise<void> => {
        if (!ad) return;

        setIsProcessing(true);

        try {
            const adRef = doc(db, 'ads', String(ad.id));
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + parseInt(duration, 10));

            await updateDoc(adRef, {
                isFeatured: true,
                featuredExpiresAt: Timestamp.fromDate(expiresAt),
                featuredOrderId: orderId,
                featuredPayerId: payerId,
                updatedAt: Timestamp.now(),
            });

            notify.success(`¡Tu anuncio "${ad.title}" ha sido destacado por ${duration} días!`);
            
            if (onSuccess) {
                onSuccess();
            }
        } catch (error: any) {
            console.error('Error al destacar anuncio:', error);
            notify.error('Error al procesar el destacado. Contacta soporte.');
        } finally {
            setIsProcessing(false);
        }
    }, [ad, duration, onSuccess]);

    // Manejar aprobación de PayPal
    const handlePayPalApprove = useCallback(async (data: any, actions: any): Promise<void> => {
        if (!actions.order) return;

        setIsProcessing(true);

        try {
            const details = await actions.order.capture();
            console.log('Pago PayPal completado:', details);

            await handlePaymentSuccess(
                data.orderID || details.id,
                data.payerID || details.payer?.payer_id || ''
            );
        } catch (error: any) {
            console.error('Error capturando pago PayPal:', error);
            notify.error('Error al procesar el pago. Intenta de nuevo.');
        } finally {
            setIsProcessing(false);
        }
    }, [handlePaymentSuccess]);

    return {
        isProcessing,
        termsAccepted,
        setTermsAccepted,
        getPrice,
        createPayPalOrder,
        handlePayPalApprove,
        handlePaymentSuccess,
    };
};

export default usePayment;
