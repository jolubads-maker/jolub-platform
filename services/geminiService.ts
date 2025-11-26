/*
 * ARCHIVO DESHABILITADO
 * Este archivo contenía la integración con Gemini AI para chat.
 * Ahora el sistema usa chat directo entre usuarios sin IA.
 * 
 * Se mantiene el archivo para referencia pero ya no se utiliza.
 */

// import { GoogleGenAI, Chat } from '@google/genai';
// import { User } from '../src/types';

// // Lazily initialize the AI client to prevent app crash on load
// let ai: GoogleGenAI | null = null;

// const getAiClient = () => {
//   if (!ai) {
//     const API_KEY = process.env.API_KEY;

//     if (!API_KEY) {
//       // This error will now be thrown only when a chat is initiated, not on app load.
//       throw new Error("API_KEY environment variable not set");
//     }

//     ai = new GoogleGenAI({ apiKey: API_KEY });
//   }
//   return ai;
// };

// export const createChatSession = (seller: User, buyer: User): Chat => {
//   const aiClient = getAiClient();
//   const model = aiClient.chats.create({
//     model: 'gemini-2.5-flash',
//     config: {
//       systemInstruction: `
//         Eres un asistente que facilita una conversación entre un vendedor y un comprador en un marketplace online.
//         El vendedor se llama ${seller.name}.
//         El comprador se llama ${buyer.name}.
//         Tu rol es generar respuestas para el vendedor, ${seller.name}.
//         Mantén las respuestas cortas, amigables y enfocadas en el producto y la venta.
//         Inicia la conversación saludando al comprador de parte del vendedor.
//       `,
//     }
//   });
//   return model;
// };
