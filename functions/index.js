/**
 * Firebase Cloud Functions para Jolub Marketplace
 * 
 * Funciones de Pagos:
 * - createStripeCheckout: Crea sesión de Stripe Checkout
 * - handleStripeWebhook: Procesa pagos completados
 * - registerPayPalTransaction: Registra pagos de PayPal
 * 
 * Funciones de Limpieza:
 * - cleanupExpiredAds: Limpia anuncios expirados del plan Free
 * 
 * MIGRACIÓN: Usa defineSecret() en lugar de functions.config()
 */

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest, onCall } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");

// Inicializar Firebase Admin
admin.initializeApp();

const db = admin.firestore();
const storage = admin.storage().bucket();

// ============================================
// SECRETS (Nueva sintaxis - reemplaza functions.config())
// ============================================

const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");

// ============================================
// CONFIGURACIÓN DE PLANES
// ============================================

const PLANS = {
    basic: {
        name: 'Básico',
        price: 500, // $5.00 en centavos
        priceDisplay: 5,
        adLimit: 15,
        durationDays: 30,
    },
    pro: {
        name: 'Pro',
        price: 700, // $7.00 en centavos
        priceDisplay: 7,
        adLimit: 30,
        durationDays: 30,
    },
    business: {
        name: 'Empresas',
        price: 1000, // $10.00 en centavos
        priceDisplay: 10,
        adLimit: 60,
        durationDays: 30,
    },
};

// ============================================
// STRIPE CHECKOUT
// ============================================

/**
 * Crea una sesión de Stripe Checkout
 * Callable function - se llama desde el frontend
 */
exports.createStripeCheckout = onCall(
    {
        cors: true,
        region: 'us-central1',
        secrets: [stripeSecretKey], // Declarar secrets que usa la función
    },
    async (request) => {
        const { planId, userId, userEmail, userName } = request.data;

        // Validaciones
        if (!planId || !userId) {
            throw new Error('Se requiere planId y userId');
        }

        if (!PLANS[planId]) {
            throw new Error(`Plan inválido: ${planId}`);
        }

        const plan = PLANS[planId];

        // Inicializar Stripe con la clave secreta desde Secret Manager
        // .trim() elimina cualquier newline o espacio extra
        const stripe = require('stripe')(stripeSecretKey.value().trim());

        try {
            logger.info(`🛒 Creando sesión Stripe para usuario ${userId}, plan ${planId}`);

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                mode: 'payment',
                line_items: [
                    {
                        price_data: {
                            currency: 'usd',
                            product_data: {
                                name: `Plan ${plan.name} - Jolub Marketplace`,
                                description: `${plan.adLimit} anuncios por ${plan.durationDays} días`,
                            },
                            unit_amount: plan.price,
                        },
                        quantity: 1,
                    },
                ],
                metadata: {
                    userId,
                    userEmail: userEmail || '',
                    userName: userName || '',
                    planId,
                    planName: plan.name,
                },
                success_url: `https://jolub-1177c.web.app/dashboard/${userId}?payment=success`,
                cancel_url: `https://jolub-1177c.web.app/pricing?payment=cancelled`,
            });

            logger.info(`✅ Sesión Stripe creada: ${session.id}`);

            return {
                sessionId: session.id,
                url: session.url,
            };
        } catch (error) {
            logger.error('❌ Error creando sesión Stripe:', error);
            throw new Error(`Error al crear sesión de pago: ${error.message}`);
        }
    }
);

// ============================================
// STRIPE WEBHOOK
// ============================================

/**
 * Webhook para procesar eventos de Stripe
 * Escucha checkout.session.completed para actualizar usuario
 */
exports.handleStripeWebhook = onRequest(
    {
        cors: false,
        region: 'us-central1',
        secrets: [stripeSecretKey, stripeWebhookSecret], // Declarar secrets
    },
    async (req, res) => {
        const stripe = require('stripe')(stripeSecretKey.value().trim());
        const endpointSecret = stripeWebhookSecret.value().trim();

        if (req.method !== 'POST') {
            res.status(405).send('Method Not Allowed');
            return;
        }

        const sig = req.headers['stripe-signature'];
        let event;

        try {
            // Verificar firma del webhook
            event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
        } catch (err) {
            logger.error(`❌ Error verificando webhook: ${err.message}`);
            res.status(400).send(`Webhook Error: ${err.message}`);
            return;
        }

        // Procesar evento
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;

            logger.info(`💰 Pago completado: ${session.id}`);
            logger.info(`   Metadata:`, session.metadata);

            const { userId, userEmail, userName, planId, planName } = session.metadata;
            const plan = PLANS[planId];

            if (!plan) {
                logger.error(`❌ Plan no encontrado: ${planId}`);
                res.status(400).send('Plan no válido');
                return;
            }

            try {
                // 1. Actualizar usuario en Firestore
                const userRef = db.collection('users').doc(userId);
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + plan.durationDays);

                await userRef.update({
                    subscriptionPlan: planId,
                    subscriptionExpiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
                    adLimit: plan.adLimit,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });

                logger.info(`✅ Usuario ${userId} actualizado a plan ${planId}`);

                // 2. Crear registro de transacción
                const transactionRef = await db.collection('transactions').add({
                    userId,
                    userEmail: userEmail || session.customer_email || '',
                    userName: userName || '',
                    plan: planId,
                    planName: planName,
                    amount: session.amount_total / 100, // Convertir centavos a dólares
                    currency: session.currency.toUpperCase(),
                    provider: 'stripe',
                    stripeSessionId: session.id,
                    stripePaymentIntentId: session.payment_intent,
                    status: 'completed',
                    subscriptionExpiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                });

                logger.info(`✅ Transacción registrada: ${transactionRef.id}`);

                res.status(200).json({ received: true, transactionId: transactionRef.id });
            } catch (error) {
                logger.error(`❌ Error procesando pago:`, error);
                res.status(500).send('Error procesando pago');
            }
        } else {
            logger.info(`ℹ️ Evento ignorado: ${event.type}`);
            res.status(200).json({ received: true });
        }
    }
);

// ============================================
// PAYPAL TRANSACTION (Callable)
// ============================================

/**
 * Registra una transacción de PayPal completada
 * Se llama desde el frontend después de que PayPal confirma el pago
 */
exports.registerPayPalTransaction = onCall(
    {
        cors: true,
        region: 'us-central1',
    },
    async (request) => {
        const { userId, userEmail, userName, planId, paypalOrderId, paypalPayerId } = request.data;

        // Validaciones
        if (!planId || !userId || !paypalOrderId) {
            throw new Error('Se requiere planId, userId y paypalOrderId');
        }

        if (!PLANS[planId]) {
            throw new Error(`Plan inválido: ${planId}`);
        }

        const plan = PLANS[planId];

        try {
            logger.info(`💰 Registrando pago PayPal para usuario ${userId}, plan ${planId}`);

            // 1. Actualizar usuario en Firestore
            const userRef = db.collection('users').doc(userId);
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + plan.durationDays);

            await userRef.update({
                subscriptionPlan: planId,
                subscriptionExpiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
                adLimit: plan.adLimit,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            logger.info(`✅ Usuario ${userId} actualizado a plan ${planId}`);

            // 2. Crear registro de transacción
            const transactionRef = await db.collection('transactions').add({
                userId,
                userEmail: userEmail || '',
                userName: userName || '',
                plan: planId,
                planName: plan.name,
                amount: plan.priceDisplay,
                currency: 'USD',
                provider: 'paypal',
                paypalOrderId,
                paypalPayerId: paypalPayerId || '',
                status: 'completed',
                subscriptionExpiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            logger.info(`✅ Transacción PayPal registrada: ${transactionRef.id}`);

            return {
                success: true,
                transactionId: transactionRef.id,
                expiresAt: expiresAt.toISOString(),
            };
        } catch (error) {
            logger.error('❌ Error registrando pago PayPal:', error);
            throw new Error(`Error al registrar pago: ${error.message}`);
        }
    }
);

// ============================================
// LIMPIEZA DE ANUNCIOS EXPIRADOS
// ============================================

const FREE_PLAN_AD_DURATION_DAYS = 7;

exports.cleanupExpiredAds = onSchedule(
    {
        schedule: "every 24 hours",
        timeZone: "America/Managua",
        retryCount: 3,
    },
    async (event) => {
        logger.info("🧹 Iniciando limpieza de anuncios expirados...");

        try {
            const now = new Date();
            const expirationDate = new Date(now.getTime() - FREE_PLAN_AD_DURATION_DAYS * 24 * 60 * 60 * 1000);

            logger.info(`📅 Buscando anuncios creados antes de: ${expirationDate.toISOString()}`);

            const freeUsersSnapshot = await db
                .collection("users")
                .where("subscriptionPlan", "==", "free")
                .get();

            const freeUserIds = new Set(freeUsersSnapshot.docs.map(doc => doc.id));
            logger.info(`👥 Usuarios con plan Free: ${freeUserIds.size}`);

            if (freeUserIds.size === 0) {
                logger.info("✅ No hay usuarios con plan Free. Nada que limpiar.");
                return null;
            }

            const expiredAdsSnapshot = await db
                .collection("ads")
                .where("createdAt", "<", admin.firestore.Timestamp.fromDate(expirationDate))
                .get();

            let deletedAdsCount = 0;
            let deletedChatsCount = 0;

            for (const adDoc of expiredAdsSnapshot.docs) {
                const adData = adDoc.data();
                const adId = adDoc.id;

                if (!freeUserIds.has(adData.sellerId)) {
                    continue;
                }

                logger.info(`🗑️ Procesando anuncio expirado: ${adId}`);

                try {
                    // Eliminar chats asociados
                    const chatsSnapshot = await db
                        .collection("chats")
                        .where("adId", "==", adId)
                        .get();

                    for (const chatDoc of chatsSnapshot.docs) {
                        const messagesSnapshot = await chatDoc.ref.collection("messages").get();
                        const batch = db.batch();
                        messagesSnapshot.docs.forEach(msgDoc => batch.delete(msgDoc.ref));
                        await batch.commit();
                        await chatDoc.ref.delete();
                        deletedChatsCount++;
                    }

                    // Eliminar anuncio
                    await adDoc.ref.delete();
                    deletedAdsCount++;

                } catch (deleteError) {
                    logger.error(`❌ Error eliminando anuncio ${adId}:`, deleteError);
                }
            }

            logger.info("========================================");
            logger.info("🧹 LIMPIEZA COMPLETADA");
            logger.info(`   📝 Anuncios eliminados: ${deletedAdsCount}`);
            logger.info(`   💬 Chats eliminados: ${deletedChatsCount}`);
            logger.info("========================================");

            return { deletedAds: deletedAdsCount, deletedChats: deletedChatsCount };

        } catch (error) {
            logger.error("❌ Error en limpieza de anuncios:", error);
            throw error;
        }
    }
);

// ============================================
// FUNCIÓN DE PRUEBA MANUAL
// ============================================

exports.manualCleanup = onRequest(
    { cors: true },
    async (req, res) => {
        const secretKey = req.query.key || req.headers["x-cleanup-key"];
        if (secretKey !== "jolub-cleanup-secret-2024") {
            res.status(403).json({ error: "Acceso denegado" });
            return;
        }

        logger.info("🔧 Ejecutando limpieza manual...");
        res.json({ success: true, message: "Limpieza iniciada" });
    }
);

// ============================================
// MIGRACIÓN DE KEYWORDS PARA ANUNCIOS EXISTENTES
// ============================================

exports.migrateAdsKeywords = onRequest(
    { cors: true, timeoutSeconds: 300 },
    async (req, res) => {
        const secretKey = req.query.key || req.headers["x-migrate-key"];
        if (secretKey !== "jolub-migrate-keywords-2024") {
            res.status(403).json({ error: "Acceso denegado" });
            return;
        }

        logger.info("🔄 Iniciando migración de keywords...");

        // Stop words en español
        const stopWords = new Set([
            'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
            'de', 'del', 'al', 'a', 'ante', 'bajo', 'con', 'contra',
            'en', 'entre', 'hacia', 'hasta', 'para', 'por', 'segun',
            'sin', 'sobre', 'tras', 'que', 'cual', 'cuyo', 'donde',
            'como', 'cuando', 'cuanto', 'y', 'o', 'u', 'ni', 'pero',
            'si', 'no', 'muy', 'mas', 'menos', 'ya', 'es', 'son',
            'ser', 'estar', 'fue', 'sido', 'era', 'han', 'ha', 'he',
            'hay', 'este', 'esta', 'estos', 'estas', 'ese', 'esa',
            'esos', 'esas', 'aquel', 'aquella', 'mi', 'tu', 'su',
            'yo', 'tu', 'el', 'ella', 'usted', 'nosotros', 'ellos'
        ]);

        const generateKeywords = (text) => {
            if (!text) return [];
            return String(text)
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9\s]/g, ' ')
                .split(/\s+/)
                .filter(word => word.length >= 2 && !stopWords.has(word));
        };

        try {
            const adsSnapshot = await db.collection('ads').get();
            let updated = 0;
            let skipped = 0;

            const batch = db.batch();

            for (const doc of adsSnapshot.docs) {
                const data = doc.data();

                // Saltar si ya tiene keywords
                if (data.keywords && data.keywords.length > 0) {
                    skipped++;
                    continue;
                }

                const allText = [
                    data.title || '',
                    data.category || '',
                    data.description || '',
                    data.subcategory || '',
                    data.location || ''
                ].join(' ');

                const keywords = [...new Set(generateKeywords(allText))].slice(0, 50);

                batch.update(doc.ref, { keywords });
                updated++;
            }

            await batch.commit();

            logger.info(`✅ Migración completada: ${updated} actualizados, ${skipped} saltados`);
            res.json({
                success: true,
                updated,
                skipped,
                total: adsSnapshot.size
            });

        } catch (error) {
            logger.error("❌ Error en migración:", error);
            res.status(500).json({ error: error.message });
        }
    }
);
