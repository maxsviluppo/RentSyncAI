import { GoogleGenAI, Type, Schema } from "@google/genai";
import { RiskAnalysisResult, Car, DriverProfile, AIRecommendation, MarketingLead } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY || "";
  return new GoogleGenAI({ apiKey });
};
const modelId = "gemini-2.5-flash";

// Helper to clean JSON
const cleanJson = (text: string): string => {
  if (!text) return "{}";
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

export const analyzeRisk = async (
  clientData: any,
  financialData: string
): Promise<RiskAnalysisResult> => {
  const prompt = `
    Agisci come un analista finanziario esperto per un'agenzia di noleggio auto.
    Valuta il profilo di rischio di questo cliente per un noleggio a lungo termine o flotta aziendale.
    
    Dati Cliente: ${JSON.stringify(clientData)}
    Dati Finanziari/Note: ${financialData}

    Analizza stabilità lavorativa, debiti pregressi (se menzionati), e solidità aziendale.
    Restituisci un JSON rigoroso.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      riskScore: {
        type: Type.INTEGER,
        description: "Punteggio da 0 (alto rischio) a 100 (affidabilità perfetta)",
      },
      riskLevel: {
        type: Type.STRING,
        enum: ["Basso", "Medio", "Alto"],
        description: "Livello di rischio testuale",
      },
      maxCreditLimit: {
        type: Type.INTEGER,
        description: "Limite di credito suggerito in Euro",
      },
      reasoning: {
        type: Type.STRING,
        description: "Spiegazione dettagliata dell'analisi",
      },
      recommendation: {
        type: Type.STRING,
        description: "Raccomandazione operativa (es. Chiedere deposito cauzionale, Approvare, Rifiutare)",
      },
    },
    required: ["riskScore", "riskLevel", "maxCreditLimit", "reasoning", "recommendation"],
  };

  try {
    const response = await getAiClient().models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.2,
      },
    });

    const text = response.text;
    if (!text) throw new Error("Nessuna risposta dal modello");

    return JSON.parse(cleanJson(text)) as RiskAnalysisResult;
  } catch (error) {
    console.error("Errore analisi rischio:", error);
    throw error;
  }
};

export const generateMarketingCopy = async (
  leadName: string,
  interest: string,
  tone: string
): Promise<string> => {
  try {
    const response = await getAiClient().models.generateContent({
      model: modelId,
      contents: `Scrivi una breve email commerciale (max 100 parole) per ${leadName}.
      Interessato a: ${interest}.
      Tono: ${tone}.
      L'obiettivo è fissare una chiamata conoscitiva. Includi una call to action chiara.`,
    });
    return response.text || "Errore nella generazione del testo.";
  } catch (error) {
    return "Non è stato possibile generare il contenuto al momento.";
  }
};

export const generateMarketingABTest = async (
  leadName: string,
  interest: string
): Promise<{ variantA: string; variantB: string; analysis: string }> => {
  const prompt = `
    Sei un esperto di Copywriting e A/B Testing.
    Genera due varianti DISTINTE di una email commerciale per il lead: ${leadName}.
    Interesse: ${interest}.

    Variante A: Tono Formale, Diretto, Focus sul Risparmio/Efficienza.
    Variante B: Tono Empatico, Storytelling, Focus su Comfort/Esperienza.

    Dopo le due varianti, fornisci una breve analisi su quale potrebbe convertire meglio e perché.

    Rispondi SOLO con un JSON valido:
    {
      "variantA": "testo email A...",
      "variantB": "testo email B...",
      "analysis": "breve confronto..."
    }
  `;

  try {
    const response = await getAiClient().models.generateContent({
      model: modelId,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    const text = cleanJson(response.text || "{}");
    return JSON.parse(text);
  } catch (e) {
    return { variantA: "Errore", variantB: "Errore", analysis: "Impossibile generare test." };
  }
};

export const generateQuoteDetails = async (carModel: string, duration: number, clientType: string): Promise<string> => {
  try {
    const response = await getAiClient().models.generateContent({
      model: modelId,
      contents: `Genera una descrizione accattivante e professionale per un preventivo di noleggio auto.
            Auto: ${carModel}
            Durata: ${duration} giorni
            Tipo Cliente: ${clientType}
            
            Enfatizza i benefici, l'affidabilità e il servizio premium inclusi.`
    });
    return response.text || "";
  } catch (e) {
    return "Descrizione non disponibile.";
  }
}

export const generateCarDetails = async (brand: string, model: string, year?: number): Promise<Partial<Car>> => {
  const prompt = `Dato il veicolo ${brand} ${model} ${year ? `dell'anno ${year}` : ''}, fornisci una scheda tecnica completa e un piano finanziario per un'agenzia di noleggio:
    1. Categoria (scegli solo tra: Economy, SUV, Luxury, Van).
    2. array 'features': 5 caratteristiche tecniche chiave (es. "Fari Matrix LED", "Cockpit Digitale").
    3. array 'accessories': 5 accessori o optional specifici (es. "Tetto Panoramico", "Cerchi in lega 19", "Sedili riscaldati").
    4. 'description': Una descrizione accattivante (max 30 parole) orientata alla vendita.
    5. 'pricePerDay': Prezzo giornaliero per noleggio breve (Euro).
    6. 'rentalRates': Un oggetto con le quote mensili suggerite per diverse durate. Calcola le quote in modo decrescente (più mesi = rata più bassa). Considera svalutazione e margine.
       - monthly1 (1 mese)
       - monthly3 (3 mesi)
       - monthly6 (6 mesi)
       - monthly12 (12 mesi)
       - monthly24 (24 mesi)
       - monthly48 (48 mesi)
    7. Tipo di Alimentazione (Benzina, Diesel, Ibrido, Elettrico, GPL/Metano).
    8. Tipo di Cambio (Manuale, Automatico).
    `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      category: { type: Type.STRING, enum: ['Economy', 'SUV', 'Luxury', 'Van'] },
      features: { type: Type.ARRAY, items: { type: Type.STRING } },
      accessories: { type: Type.ARRAY, items: { type: Type.STRING } },
      description: { type: Type.STRING },
      pricePerDay: { type: Type.NUMBER },
      rentalRates: {
        type: Type.OBJECT,
        properties: {
          monthly1: { type: Type.NUMBER },
          monthly3: { type: Type.NUMBER },
          monthly6: { type: Type.NUMBER },
          monthly12: { type: Type.NUMBER },
          monthly24: { type: Type.NUMBER },
          monthly48: { type: Type.NUMBER },
        },
        required: ['monthly1', 'monthly12', 'monthly24', 'monthly48']
      },
      fuelType: { type: Type.STRING, enum: ['Benzina', 'Diesel', 'Ibrido', 'Elettrico', 'GPL/Metano'] },
      transmission: { type: Type.STRING, enum: ['Manuale', 'Automatico'] },
    },
    required: ['category', 'features', 'accessories', 'description', 'pricePerDay', 'rentalRates', 'fuelType', 'transmission']
  };

  try {
    const response = await getAiClient().models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.3
      }
    });
    const text = response.text;
    if (!text) return {};

    return JSON.parse(cleanJson(text)) as Partial<Car>;
  } catch (error) {
    console.error("Errore generazione dettagli auto:", error);
    return {};
  }
}

export const recommendCar = async (
  fleet: Car[],
  profile: DriverProfile
): Promise<AIRecommendation[]> => {
  const prompt = `
    Agisci come un consulente esperto di mobilità (Human-like).
    Analizza il profilo dettagliato del guidatore e la flotta disponibile per consigliare le 3 migliori auto.

    PROFILO GUIDATORE DETTAGLIATO:
    - Professione & Reddito: ${profile.job}, €${profile.annualIncome}/anno.
    - Percorrenza: ${profile.annualKm} km/anno.
    - Tipo Percorso Prevalente: ${profile.tripType}.
    - Nucleo Familiare: ${profile.familySize}.
    - Preferenza Cambio: ${profile.transmission}.
    - Stile Guida: ${profile.drivingStyle}.
    - Esigenze Carico: ${profile.loadNeeds}.
    - PRIORITÀ ASSOLUTA: ${profile.priority}.

    Flotta Disponibile (JSON):
    ${JSON.stringify(fleet.map(c => ({
    id: c.id,
    model: c.brand + ' ' + c.model,
    category: c.category,
    price: c.pricePerDay,
    features: c.features,
    transmission: c.transmission,
    fuel: c.fuelType
  })))}

    REGOLE DI MATCHING (Logica avanzata):
    1. Se 'Animali Domestici' o 'Bagagli Voluminosi' -> Favorire SUV o Van o Station Wagon (se presenti).
    2. Se percorso 'Urbano' -> Favorire Elettrico/Ibrido/Economy.
    3. Se 'Autostrada' + km alti -> Favorire Diesel, Berlina o SUV stabili.
    4. Se Priorità 'Immagine/Status' -> Favorire Luxury o brand premium (BMW, Mercedes, Tesla).
    5. Se Priorità 'Risparmio' -> Favorire Economy o prezzo basso.
    6. Se 'Tecnologia' -> Cerca auto con feature come 'Navi', 'ADAS', 'CarPlay' o Tesla.
    7. Considera il reddito per suggerire una rata sostenibile.
    8. RISPETTA la preferenza del cambio se specificata (Manuale/Automatico).

    Restituisci un array JSON con le 3 migliori opzioni, spiegando nel campo 'reasoning' SPECIFICATAMENTE perché l'auto soddisfa le abitudini indicate (es. "Perfetta per il tuo cane grazie al bagagliaio ampio").
  `;

  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        carId: { type: Type.STRING, description: "ID dell'auto dalla flotta fornita" },
        matchScore: { type: Type.INTEGER, description: "Compatibilità da 0 a 100" },
        reasoning: { type: Type.STRING, description: "Spiegazione persuasiva e personalizzata" },
        suggestedMonthlyRate: { type: Type.INTEGER, description: "Rata mensile consigliata in Euro" },
        suggestedDurationMonths: { type: Type.INTEGER, description: "Durata contratto consigliata" }
      },
      required: ["carId", "matchScore", "reasoning", "suggestedMonthlyRate", "suggestedDurationMonths"]
    }
  };

  try {
    const response = await getAiClient().models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.4,
      },
    });

    const text = response.text;
    if (!text) return [];

    return JSON.parse(cleanJson(text)) as AIRecommendation[];
  } catch (error) {
    console.error("Errore raccomandazione auto:", error);
    return [];
  }
};

// Search for Leads using Google Search
export const findLeads = async (target: string, location: string): Promise<Partial<MarketingLead>[]> => {
  const prompt = `
      Cerca su Google aziende o professionisti reali che corrispondono a: "${target} a ${location}".
      Trovane almeno 4-5 reali ed esistenti.
      
      Per ogni risultato, ipotizza perché potrebbero aver bisogno di noleggiare auto o furgoni (es. "consegne", "visite clienti", "trasporto attrezzatura").
      
      Restituisci ESCLUSIVAMENTE un oggetto JSON valido (senza markdown o codice) con questa struttura:
      {
        "leads": [
          { 
             "name": "Nome dell'azienda/professionista", 
             "interest": "Una breve frase sul potenziale bisogno di noleggio", 
             "location": "Indirizzo approssimativo o città" 
          }
        ]
      }
    `;

  try {
    const response = await getAiClient().models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }], // Enable Google Search
        // NOTE: responseMimeType and responseSchema CANNOT be used with tools/googleSearch.
      }
    });

    // Parse response
    let text = response.text;
    if (!text) return [];

    // Clean markdown code blocks if present (common when asking for JSON without schema)
    text = cleanJson(text);

    const data = JSON.parse(text);
    return data.leads || [];

  } catch (e) {
    console.error("Lead Gen Error", e);
    return [];
  }
}

// NEW: Strategic Analysis
export const generateStrategicReport = async (stats: any): Promise<string> => {
  const prompt = `
        Agisci come un Direttore Commerciale e Fleet Manager esperto.
        Analizza le seguenti metriche dell'agenzia di noleggio relative al periodo selezionato:
        
        METRICHE:
        - Periodo Analizzato: ${stats.period}
        - Fatturato Totale: €${stats.revenue}
        - Auto Più Noleggiate: ${JSON.stringify(stats.topCars)}
        - Auto MAI Noleggiate (Ferme): ${JSON.stringify(stats.unusedCars)}
        - Top Agenti: ${JSON.stringify(stats.topAgents)}
        
        Genera un report strategico in formato Markdown (usa elenchi puntati, grassetti) strutturato così:
        1. **Sintesi Performance**: Commento generale sull'andamento.
        2. **Analisi Flotta**: 
           - Consiglia cosa fare con le auto ferme (es. "Vendere", "Spostare in promozione", "Abbassare prezzo").
           - Consiglia su quali modelli investire in base ai Top Performer.
        3. **Strategia Commerciale**:
           - Feedback sugli agenti migliori.
           - Suggerimenti per aumentare il fatturato nel prossimo periodo.
        
        Sii diretto, professionale e orientato al profitto.
    `;

  try {
    const response = await getAiClient().models.generateContent({
      model: modelId,
      contents: prompt,
      config: { temperature: 0.5 }
    });
    return response.text || "Impossibile generare report.";
  } catch (e) {
    return "Errore nell'analisi strategica.";
  }
}

// NEW: Generic Chat for AI Lab
export const askGeminiFlash = async (prompt: string): Promise<string> => {
  try {
    const response = await getAiClient().models.generateContent({
      model: "gemini-2.0-flash-exp", // Fast experimentation model
      contents: prompt,
      config: { temperature: 0.7 }
    });
    return response.text || "Nessuna risposta.";
  } catch (e) {
    return "Errore API o Limite Raggiunto.";
  }
}