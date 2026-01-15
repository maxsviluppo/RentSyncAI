import { GoogleGenAI, Type } from "@google/genai";
import { RiskAnalysisResult, Car, DriverProfile, AIRecommendation, MarketingLead, CompanyProfile } from "../types";

// Crea una nuova istanza ad ogni chiamata per usare la chiave API aggiornata dal selettore
const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const textModelId = "gemini-3-flash-preview";
// Modello obbligatorio per utilizzare lo strumento googleSearch con grounding
const searchModelId = "gemini-3-pro-image-preview"; 

const cleanJson = (text: string): string => {
  if (!text) return "{}";
  let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd !== -1) {
      cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
  }
  return cleaned;
};

export const findLeads = async (target: string, location: string, simulate: boolean = false): Promise<{leads: Partial<MarketingLead>[], sources: any[], error?: string, status?: number, isSimulated?: boolean}> => {
    const ai = getAiClient();

    // MODALITÀ SIMULAZIONE (Usa Gemini Flash - Free & Fast)
    if (simulate) {
        const simPrompt = `Sei un simulatore di dati per test software. 
        Genera 3 profili di aziende FITTIZIE ma realistiche per il settore "${target}" a "${location}".
        Per ogni azienda inventa:
        1. Nome credibile.
        2. Indirizzo locale verosimile.
        3. Interest: un bisogno specifico di noleggio auto (es. "Flotta per agenti", "Furgone per consegne", "Auto di lusso per dirigenti").
        4. Email e Telefono finti.
        
        Restituisci SOLO un JSON valido: {"leads": [{"name": "...", "interest": "...", "location": "...", "email": "...", "phone": "..."}]}`;
        
        try {
            const response = await ai.models.generateContent({
                model: textModelId, // Usa Flash per la simulazione gratuita
                contents: simPrompt,
                config: { responseMimeType: "application/json" }
            });
            const data = JSON.parse(cleanJson(response.text || "{}"));
            return { leads: data.leads || [], sources: [], isSimulated: true };
        } catch (e) {
            console.error("Errore simulazione:", e);
            // Fallback statico estremo se anche Flash fallisce
            return { 
                leads: [{ name: `Simulazione ${target}`, interest: "Test Bisogno Mobilità", location: location, email: "test@demo.com", phone: "000000000" }], 
                sources: [], 
                isSimulated: true 
            };
        }
    }

    // MODALITÀ REALE (Usa Google Search Grounding - Richiede Tier Paid)
    const prompt = `Agisci come un esperto di lead generation commerciale. 
    Cerca aziende REALI e ATTIVE del settore "${target}" a "${location}" utilizzando Google Search.
    Per ogni azienda trovata, identifica il nome, l'indirizzo, e ipotizza il loro interesse per il noleggio auto basandoti sulla loro attività.
    Restituisci i dati ESCLUSIVAMENTE come un oggetto JSON con questa struttura: 
    {"leads": [{"name": "Nome", "interest": "Dettaglio bisogno", "location": "Indirizzo", "email": "...", "phone": "..."}]}.
    Non aggiungere chiacchiere o altro testo fuori dal JSON.`;

    try {
        const response = await ai.models.generateContent({
            model: searchModelId,
            contents: prompt,
            config: { 
                tools: [{googleSearch: {}}],
                // responseMimeType rimosso per compatibilità Grounding
            }
        });
        
        const rawText = response.text || "";
        const data = JSON.parse(cleanJson(rawText));
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        return { leads: data.leads || [], sources };
    } catch (e: any) {
        console.error("Errore findLeads:", e);
        const msg = e.message || "";
        if (msg.includes("403") || msg.includes("PERMISSION_DENIED")) {
            return { leads: [], sources: [], error: "PERMISSION_DENIED", status: 403 };
        }
        if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
            return { leads: [], sources: [], error: "QUOTA_EXCEEDED", status: 429 };
        }
        return { leads: [], sources: [], error: msg };
    }
}

export const analyzeRisk = async (clientData: any, financialData: string): Promise<RiskAnalysisResult> => {
  const ai = getAiClient();
  const prompt = `Analizza rischio per: ${JSON.stringify(clientData)}. Dati: ${financialData}`;
  const response = await ai.models.generateContent({
    model: textModelId,
    contents: prompt,
    config: { 
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                riskScore: { type: Type.INTEGER },
                riskLevel: { type: Type.STRING },
                maxCreditLimit: { type: Type.NUMBER },
                reasoning: { type: Type.STRING },
                recommendation: { type: Type.STRING }
            },
            required: ["riskScore", "riskLevel", "maxCreditLimit", "reasoning", "recommendation"]
        }
    },
  });
  return JSON.parse(cleanJson(response.text || "{}"));
};

export const generateMarketingCopy = async (
  leadName: string,
  interest: string,
  tone: string,
  offers: Car[] = [],
  companyProfile?: CompanyProfile
): Promise<string> => {
  const ai = getAiClient();
  const offersText = offers.map(c => `VEICOLO: ${c.brand} ${c.model}\nDETTAGLI: ${c.fuelType}, ${c.transmission}`).join('\n---\n');
  const prompt = `Scrivi un'email commerciale persuasiva da ${companyProfile?.name || 'RentSync'}. Destinatario: ${leadName}. Interesse: ${interest}. Tono: ${tone}. Offerte:\n${offersText}`;
  const response = await ai.models.generateContent({ model: textModelId, contents: prompt });
  return response.text || "";
};

export const generateQuoteDetails = async (carModel: string, duration: number, clientType: string): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({ model: textModelId, contents: `Nota per preventivo ${carModel}, ${duration} giorni, cliente ${clientType}.` });
    return response.text || "";
}

export const recommendCar = async (fleet: Car[], profile: DriverProfile): Promise<AIRecommendation[]> => {
  const ai = getAiClient();
  const prompt = `Consiglia auto: ${JSON.stringify(fleet)} per profilo: ${JSON.stringify(profile)}`;
  const response = await ai.models.generateContent({
    model: textModelId,
    contents: prompt,
    config: { 
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    carId: { type: Type.STRING },
                    matchScore: { type: Type.INTEGER },
                    reasoning: { type: Type.STRING },
                    suggestedMonthlyRate: { type: Type.NUMBER },
                    suggestedDurationMonths: { type: Type.INTEGER }
                }
            }
        }
    }
  });
  return JSON.parse(cleanJson(response.text || "[]"));
};

export const generateCarDetails = async (brand: string, model: string, year?: number): Promise<Partial<Car>> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: textModelId,
        contents: `Dettagli tecnici JSON per ${brand} ${model} ${year}.`,
        config: { responseMimeType: "application/json" }
    });
    return JSON.parse(cleanJson(response.text || "{}"));
}

export const generateStrategicReport = async (stats: any): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({ model: textModelId, contents: `Report strategico: ${JSON.stringify(stats)}` });
    return response.text || "";
}

export const generateCompanyBio = async (info: Partial<CompanyProfile>): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({ model: textModelId, contents: `Bio professionale per ${info.name}.` });
    return response.text || "";
}