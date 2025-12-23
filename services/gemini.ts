import { GoogleGenAI, Type } from "@google/genai";
import { RiskAnalysisResult, Car, DriverProfile, AIRecommendation, MarketingLead, CompanyProfile } from "../types";

// Always create a new instance right before the call to ensure the latest API key is used
const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const modelId = "gemini-3-flash-preview";

const cleanJson = (text: string): string => {
  if (!text) return "{}";
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

export const analyzeRisk = async (clientData: any, financialData: string): Promise<RiskAnalysisResult> => {
  const ai = getAiClient();
  const prompt = `Analizza rischio per: ${JSON.stringify(clientData)}. Dati: ${financialData}`;
  const response = await ai.models.generateContent({
    model: modelId,
    contents: prompt,
    config: { responseMimeType: "application/json" },
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
    `VEICOLO: ${c.brand} ${c.model}\nCATEGORIA: ${c.category}\nDETTAGLI: ${c.fuelType}, ${c.transmission}, ${c.features?.join(', ')}\nDESCRIZIONE: ${c.description}`
  ).join('\n---\n');
  
  const prompt = `
    Scrivi un'email commerciale persuasiva da parte di ${companyProfile?.name || 'RentSync'}.
    DESTINATARIO: ${leadName}
    MOTIVO CONTATTO: "${interest}"
    TONO RICHIESTO: ${tone}
    PROPOSTA VEICOLI:
    ${offersText}
  `;

  const response = await ai.models.generateContent({ model: modelId, contents: prompt });
  return response.text || "";
};

export const findLeads = async (target: string, location: string): Promise<{leads: Partial<MarketingLead>[], sources: any[], error?: string}> => {
    const ai = getAiClient();
    const prompt = `
      Cerca su Google aziende REALI del settore specifico "${target}" a "${location}".
      Regole: Filtra rigorosamente per settore. Scrivi una motivazione strategica per il noleggio.
      Restituisci ESCLUSIVAMENTE un JSON:
      {
        "leads": [
          { "name": "Nome", "interest": "Motivazione", "location": "Indirizzo", "email": "email", "phone": "tel" }
        ]
      }
    `;

    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: { 
                tools: [{googleSearch: {}}],
                responseMimeType: "application/json"
            }
        });
        const data = JSON.parse(cleanJson(response.text || '{"leads":[]}'));
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        return { leads: data.leads || [], sources };
    } catch (e: any) {
        console.error("Errore findLeads:", e);
        if (e.message?.includes("429") || e.message?.includes("RESOURCE_EXHAUSTED")) {
            return { leads: [], sources: [], error: "QUOTA_EXCEEDED" };
        }
        return { leads: [], sources: [], error: e.message };
    }
}

export const generateQuoteDetails = async (carModel: string, duration: number, clientType: string): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: modelId,
        contents: `Scrivi una breve nota di accompagnamento professionale per un preventivo di noleggio ${carModel} della durata di ${duration} giorni per un cliente di tipo ${clientType}. Elenca 3 vantaggi del nostro servizio.`,
    });
    return response.text || "";
}

export const recommendCar = async (fleet: Car[], profile: DriverProfile): Promise<AIRecommendation[]> => {
  const ai = getAiClient();
  const prompt = `Consiglia auto dalla flotta: ${JSON.stringify(fleet)} per il profilo: ${JSON.stringify(profile)}`;
  const response = await ai.models.generateContent({
    model: modelId,
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(cleanJson(response.text || "[]"));
};

export const generateCarDetails = async (brand: string, model: string, year?: number): Promise<Partial<Car>> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: modelId,
        contents: `Genera i dettagli tecnici (features, descrizione commerciale) in JSON per un'auto ${brand} ${model} dell'anno ${year}.`,
        config: { responseMimeType: "application/json" }
    });
    return JSON.parse(cleanJson(response.text || "{}"));
}

export const generateStrategicReport = async (stats: any): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: modelId,
        contents: `Analisi strategica basata su questi dati: ${JSON.stringify(stats)}. Suggerisci azioni concrete per aumentare il fatturato.`,
    });
    return response.text || "";
}

export const generateCompanyBio = async (info: Partial<CompanyProfile>): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: modelId,
        contents: `Scrivi una bio aziendale professionale per ${info.name}, con sede a ${info.city}.`,
    });
    return response.text || "";
}