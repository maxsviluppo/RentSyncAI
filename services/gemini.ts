import { GoogleGenAI, Type } from "@google/genai";
import { RiskAnalysisResult, Car, DriverProfile, AIRecommendation, MarketingLead, CompanyProfile } from "../types";

// Crea una nuova istanza ad ogni chiamata per usare la chiave API più recente dal dialogo window.aistudio
const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const textModelId = "gemini-3-flash-preview";
// Modello obbligatorio per googleSearch con chiavi personali/paid
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

export const findLeads = async (target: string, location: string): Promise<{leads: Partial<MarketingLead>[], sources: any[], error?: string, status?: number}> => {
    const ai = getAiClient();
    const prompt = `Agisci come un esperto di lead generation. Cerca aziende REALI del settore "${target}" a "${location}". 
    Restituisci ESCLUSIVAMENTE un oggetto JSON valido con questa struttura: 
    {"leads": [{"name": "Nome Azienda", "interest": "Perché potrebbero noleggiare un auto", "location": "Indirizzo", "email": "email se trovata", "phone": "telefono"}]}.`;

    try {
        const response = await ai.models.generateContent({
            model: searchModelId,
            contents: prompt,
            config: { 
                tools: [{googleSearch: {}}],
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

        if (msg.includes("Requested entity was not found")) {
            return { leads: [], sources: [], error: "INVALID_KEY", status: 404 };
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
  const offersText = offers.map(c => 
    `VEICOLO: ${c.brand} ${c.model}\nDETTAGLI: ${c.fuelType}, ${c.transmission}\nDESCRIZIONE: ${c.description}`
  ).join('\n---\n');
  
  const prompt = `Scrivi un'email commerciale persuasiva da parte di ${companyProfile?.name || 'RentSync'}. Destinatario: ${leadName}. Interesse: ${interest}. Tono: ${tone}. Offerte:\n${offersText}`;

  const response = await ai.models.generateContent({ model: textModelId, contents: prompt });
  return response.text || "";
};

export const generateQuoteDetails = async (carModel: string, duration: number, clientType: string): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: textModelId,
        contents: `Nota per preventivo ${carModel}, ${duration} giorni, cliente ${clientType}.`,
    });
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
    const response = await ai.models.generateContent({
        model: textModelId,
        contents: `Report strategico: ${JSON.stringify(stats)}`,
    });
    return response.text || "";
}

export const generateCompanyBio = async (info: Partial<CompanyProfile>): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: textModelId,
        contents: `Bio professionale per ${info.name}.`,
    });
    return response.text || "";
}