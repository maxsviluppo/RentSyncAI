import { GoogleGenAI, Type } from "@google/genai";
import { RiskAnalysisResult, Car, DriverProfile, AIRecommendation, MarketingLead, CompanyProfile } from "../types";

const getApiKey = () => localStorage.getItem('RENT_SYNC_API_KEY') || process.env.API_KEY;

const getAiClient = () => {
  const key = getApiKey();
  if (!key) throw new Error("API Key mancante.");
  return new GoogleGenAI({ apiKey: key });
};

// Utilizzo di gemini-3-flash-preview per task di testo e ricerca secondo le linee guida
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
  const offersText = offers.map(c => `- ${c.brand} ${c.model} (${c.fuelType}, ${c.transmission})`).join('\n');
  
  const prompt = `
    Scrivi un'email commerciale professionale da parte di ${companyProfile?.name || 'RentSync'}.
    Destinatario: ${leadName}
    Motivo del contatto: ${interest}
    Tono: ${tone}
    
    DEVI INCLUDERE E DESCRIVERE QUESTI VEICOLI SPECIFICI:
    ${offersText}
    
    Spiega perché questi modelli sono perfetti per le esigenze indicate nell'interesse del cliente.
  `;

  const response = await ai.models.generateContent({ model: modelId, contents: prompt });
  return response.text || "";
};

export const findLeads = async (target: string, location: string): Promise<Partial<MarketingLead>[]> => {
    const ai = getAiClient();
    const prompt = `
      Cerca su Google aziende REALI del settore "${target}" a "${location}".
      
      REGOLE DI FILTRO TASSATIVE:
      1. Se il target è "${target}", SCARTA ogni azienda che appartiene ad altri settori (es. se cerchi medici, ignora edili).
      2. Per ogni azienda valida, scrivi nel campo "interest" una MOTIVAZIONE specifica del perché dovrebbero noleggiare un'auto (es. "Necessità di berline per visite domiciliari").
      
      Restituisci ESCLUSIVAMENTE un JSON:
      {
        "leads": [
          { "name": "Nome", "interest": "Motivazione noleggio", "location": "Indirizzo", "email": "email", "phone": "tel" }
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
        return data.leads || [];
    } catch (e) {
        console.error("Errore findLeads:", e);
        return [];
    }
}

export const generateQuoteDetails = async (carModel: string, duration: number, clientType: string): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: modelId,
        contents: `Descrizione breve per preventivo noleggio ${carModel} per ${duration} giorni, cliente ${clientType}. Solo testo semplice.`
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
        contents: `Dettagli tecnici JSON per ${brand} ${model} ${year}.`,
        config: { responseMimeType: "application/json" }
    });
    return JSON.parse(cleanJson(response.text || "{}"));
}

export const generateStrategicReport = async (stats: any): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: modelId,
        contents: `Analisi strategica: ${JSON.stringify(stats)}`,
    });
    return response.text || "";
}

export const generateCompanyBio = async (info: Partial<CompanyProfile>): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: modelId,
        contents: `Bio per ${info.name}.`,
    });
    return response.text || "";
}