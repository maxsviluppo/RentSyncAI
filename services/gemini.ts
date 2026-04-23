import { GoogleGenAI, Type, Schema } from "@google/genai";
import { RiskAnalysisResult, Car, DriverProfile, AIRecommendation, MarketingLead } from "../types";

const getAiClient = () => {
  // Use import.meta.env for Vite and safe check for process.env
  const apiKey = (import.meta.env?.VITE_API_KEY) || 
                 (typeof process !== 'undefined' ? process.env?.API_KEY : '') || 
                 "";
  
  if (!apiKey) {
    console.warn("RentSync AI: API Key missing. Using simulated AI mode.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};
const modelId = "gemini-1.5-flash";

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

  const client = getAiClient();
  if (!client) {
    // Simulated Response
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      riskScore: 85,
      riskLevel: "Basso",
      maxCreditLimit: 50000,
      reasoning: "Il cliente presenta un profilo solido con flussi di cassa regolari e anzianità lavorativa adeguata. Non risultano pendenze significative nelle banche dati simulate.",
      recommendation: "Approvare con deposito cauzionale standard."
    };
  }

  try {
    const response = await client.models.generateContent({
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
  const client = getAiClient();
  if (!client) {
    return `Gentile ${leadName},\n\nabbiamo notato il tuo interesse per ${interest}. In RentSync offriamo soluzioni su misura che potrebbero fare al caso tuo.\n\nTi andrebbe una breve chiamata per parlarne?\n\nCordiali saluti,\nTeam Marketing (Simulated AI)`;
  }

  try {
    const response = await client.models.generateContent({
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
  const client = getAiClient();
  if (!client) {
    await new Promise(resolve => setTimeout(resolve, 1200));
    return {
      variantA: `Gentile ${leadName}, abbiamo una promo speciale su ${interest}. Risparmia il 20% oggi!`,
      variantB: `Ciao ${leadName}, vuoi viaggiare nel comfort totale con ${interest}? Scopri la nostra offerta esclusiva.`,
      analysis: "La variante A punta sul risparmio, mentre la B sull'esperienza. Consigliamo la B per i lead più alto-spendenti."
    };
  }

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
    const response = await client.models.generateContent({
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
  const client = getAiClient();
  if (!client) {
    await new Promise(resolve => setTimeout(resolve, 800));
    return `Questa offerta per la ${carModel} è stata pensata per le tue esigenze di ${clientType}. Il servizio include manutenzione full-service e assistenza H24 per tutti i ${duration} giorni del noleggio.`;
  }
  try {
    const response = await client.models.generateContent({
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
    6. array 'offers': Un array di oggetti RentalOffer con suggerimenti per:
       - 36 mesi (monthlyRate suggerita, km: 30000, anticipo suggerito, kasko: 500, theft: 0)
       - 48 mesi (monthlyRate suggerita, km: 40000, anticipo suggerito, kasko: 500, theft: 0)
    7. Tipo di Alimentazione (Benzina, Diesel, Ibrido, Elettrico, GPL/Metano).
    8. Tipo di Cambio (Manuale, Automatico).
    `;

  const client = getAiClient();
  if (!client) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      category: 'SUV',
      features: ["Fari Full LED", "Cruise Control Adattivo", "Clima Bizona", "Apple CarPlay", "Sensori 360"],
      accessories: ["Cerchi in lega 18\"", "Vetri oscurati", "Telecamera post.", "Navigatore", "Sedili Sportivi"],
      description: `Un veicolo versatile e moderno, perfetto per il ${brand} ${model}. Sicurezza e comfort garantiti.`,
      pricePerDay: 85,
      offers: [
        { duration: 36, kms: 30000, monthlyRate: 450, advance: 2000, kasko: 500, theft: 0, rca: 250 },
        { duration: 48, kms: 40000, monthlyRate: 390, advance: 2500, kasko: 500, theft: 0, rca: 250 }
      ],
      fuelType: 'Ibrido',
      transmission: 'Automatico'
    };
  }
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      category: { type: Type.STRING, enum: ['Economy', 'SUV', 'Luxury', 'Van'] },
      features: { type: Type.ARRAY, items: { type: Type.STRING } },
      accessories: { type: Type.ARRAY, items: { type: Type.STRING } },
      description: { type: Type.STRING },
      pricePerDay: { type: Type.NUMBER },
      offers: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            duration: { type: Type.INTEGER },
            kms: { type: Type.INTEGER },
            monthlyRate: { type: Type.NUMBER },
            advance: { type: Type.NUMBER },
            kasko: { type: Type.NUMBER },
            theft: { type: Type.NUMBER }
          },
          required: ['duration', 'kms', 'monthlyRate', 'advance', 'kasko', 'theft']
        }
      },
      fuelType: { type: Type.STRING, enum: ['Benzina', 'Diesel', 'Ibrido', 'Elettrico', 'GPL/Metano'] },
      transmission: { type: Type.STRING, enum: ['Manuale', 'Automatico'] },
    },
    required: ['category', 'features', 'accessories', 'description', 'pricePerDay', 'offers', 'fuelType', 'transmission']
  };

  try {
    const response = await client.models.generateContent({
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

  const client = getAiClient();
  if (!client) {
    if (fleet.length === 0) return [];
    
    // HEURISTIC MATCHING FOR SIMULATION
    const scoredFleet = fleet.map(car => {
        let score = 50; // Starting baseline
        let reasons: string[] = [];

        // 1. Budget vs Income (rough check)
        const income = parseInt(profile.annualIncome) || 30000;
        const dailyPrice = car.pricePerDay || 50;
        const potentialRate = dailyPrice * 15; // Rough estimate of monthly rate
        if (potentialRate < (income / 50)) { score += 15; reasons.push("Sostenibilità economica eccellente"); }
        
        // 2. KM vs Fuel
        const km = parseInt(profile.annualKm) || 15000;
        if (km > 25000 && car.fuelType === 'Diesel') { score += 20; reasons.push("Efficienza Diesel per alte percorrenze"); }
        if (km < 10000 && (car.fuelType === 'Elettrico' || car.fuelType === 'Ibrido')) { score += 20; reasons.push("Perfetta per percorsi brevi ed ecologici"); }
        
        // 3. Family vs Category
        const family = parseInt(profile.familySize) || 1;
        if (family >= 4 && (car.category === 'SUV' || car.category === 'Van')) { score += 20; reasons.push("Spazio ideale per il tuo nucleo familiare"); }
        if (family < 3 && car.category === 'Economy') { score += 15; reasons.push("Agile e compatta per le tue necessità"); }

        // 4. Trip Type
        if (profile.tripType === 'Urbano' && car.transmission === 'Automatico') { score += 10; reasons.push("Cambio automatico ideale per il traffico cittadino"); }
        
        // 5. Priority
        if (profile.priority === 'Comfort' && car.category === 'Luxury') { score += 15; reasons.push("Massimo comfort per i tuoi viaggi"); }
        if (profile.priority === 'Risparmio' && car.category === 'Economy') { score += 15; reasons.push("Focus massimo sull'ottimizzazione dei costi"); }

        return {
            carId: car.id,
            matchScore: Math.min(99, score),
            reasoning: reasons.length > 0 ? reasons.join(". ") + "." : "Un'ottima opzione equilibrata per il tuo profilo.",
            suggestedMonthlyRate: (car.pricePerDay || 50) * 12,
            suggestedDurationMonths: km > 20000 ? 36 : 48
        };
    });

    return scoredFleet.sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);
  }
  try {
    const response = await client.models.generateContent({
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

  const client = getAiClient();
  if (!client) {
    await new Promise(resolve => setTimeout(resolve, 1200));
    return [
      { name: "Costruzioni Rossi SpA", interest: "Potenziale flotta per nuovo cantiere a " + location, location: location },
      { name: "Logistica Verde Srl", interest: "Necessità di furgoni elettrici per consegne ultimo miglio", location: location },
      { name: "Studio Architettura Bianchi", interest: "Auto di rappresentanza per visite clienti", location: location }
    ];
  }
  try {
    const response = await client.models.generateContent({
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

  const client = getAiClient();
  if (!client) {
    return `**Sintesi Performance**: Il fatturato di €${stats.revenue} nel periodo è in linea con gli obiettivi.\n\n**Analisi Flotta**: Le auto ferme (${stats.unusedCars.length}) suggeriscono di attivare promozioni mirate. Investire di più su ${stats.topCars[0]}.\n\n**Strategia Commerciale**: Ottimo lavoro di ${stats.topAgents[0]}.`;
  }
  try {
    const response = await client.models.generateContent({
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
  const client = getAiClient();
  if (!client) {
    return "Senza API KEY, posso solo simulare risposte. Ecco un esempio: La flotta aziendale dovrebbe essere rinnovata ogni 3 anni per ottimizzare i costi di manutenzione.";
  }
  try {
    const response = await client.models.generateContent({
      model: "gemini-1.5-flash", 
      contents: prompt,
      config: { temperature: 0.7 }
    });
    return response.text || "Nessuna risposta.";
  } catch (e) {
    return "Errore API o Limite Raggiunto.";
  }
}

// NEW: Strategic Lead Finder
export const findStrategicLeads = async (
  sector: string,
  location: string,
  size: string,
  goal: string
): Promise<{ leads: Partial<MarketingLead>[], strategy: string }> => {

  const prompt = `
    Agisci come un esperto di Lead Generation B2B strategica.
    Usa Google Search per trovare aziende REALI che corrispondano a questi criteri:
    - Settore: ${sector}
    - Zona: ${location}
    - Dimensione/Tipologia: ${size}
    
    Obiettivo della nostra offerta: ${goal} (es. Noleggio Lungo Termine, Flotta Furgoni).

    1. Trova 4-5 aziende reali esistenti che potrebbero aver bisogno di questo servizio.
    2. Per ogni azienda, scrivi una "Ragione Strategica" specifica (es. "Hanno cantieri aperti", "Fanno consegne rapide").
    3. Scrivi anche un breve "Consiglio di Approccio" generale per questo target group.

    Restituisci ESCLUSIVAMENTE un JSON valido con questa struttura (nessun markdown):
    {
      "strategyCallback": "Consiglio strategico generale di approccio per questo settore...",
      "leads": [
        {
          "name": "Nome Azienda",
          "location": "Indirizzo/Città",
          "interest": "Ragione Strategica specifica (max 10 parole)",
          "matchScore": 85
        }
      ]
    }
  `;

  const client = getAiClient();
  if (!client) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      strategy: `Per il settore ${sector} a ${location}, consigliamo un approccio basato sulla flessibilità operativa. Molte aziende simili stanno passando al noleggio per evitare i costi di proprietà e manutenzione.`,
      leads: [
        { name: `${sector} Moderni ${location}`, location: location, interest: "Rinnovo flotta aziendale" },
        { name: "Global Services " + location, location: location, interest: "Noleggio a lungo termine furgoni" }
      ]
    };
  }
  try {
    const response = await client.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.3
      }
    });

    let text = response.text;
    if (!text) return { leads: [], strategy: "Nessuna strategia generata." };

    // Clean potential markdown
    text = cleanJson(text);

    const data = JSON.parse(text);
    return {
      leads: data.leads || [],
      strategy: data.strategyCallback || "Nessun consiglio strategico."
    };

  } catch (e) {
    console.error("Strategic Search Error", e);
    return { leads: [], strategy: "Errore durante la ricerca strategica." };
  }
}

// NEW: Market Price Analysis
export const analyzeMarketRates = async (
  carModel: string,
  location: string,
  duration: number
): Promise<{ averagePrice: number; competitors: any[]; analysis: string }> => {
  const prompt = `
    Agisci come un analista di pricing per noleggio auto.
    Cerca su Google i prezzi attuali per noleggiare una: ${carModel}
    Location: ${location}
    Durata: ${duration} giorni.
    
    1. Trova almeno 3 offerte reali da competitor (es. Hertz, Avis, Sixt, o locali).
    2. Estrai il prezzo totale approssimativo per il periodo.
    3. Calcola una media giornaliera stimata.
    
    Restituisci ESCLUSIVAMENTE un JSON valido (no markdown):
    {
      "averagePrice": 45, // Prezzo medio giornaliero stimato (numero)
      "competitors": [
        { "name": "Hertz", "price": "140€", "notes": "Offerta prepagata" },
        { "name": "Avis", "price": "160€", "notes": "Include assicurazione base" }
      ],
      "analysis": "Breve commento su come posizionare il nostro prezzo (siamo alti/bassi?)"
    }
  `;

  const client = getAiClient();
  if (!client) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      averagePrice: 75,
      competitors: [
        { name: "Hertz", price: "85€/gg", notes: "Prezzo premium" },
        { name: "LocalRent", price: "65€/gg", notes: "Prezzo competitivo" }
      ],
      analysis: `Il prezzo di mercato per ${carModel} a ${location} oscilla tra i 60 e i 90 euro al giorno. Il nostro posizionamento attuale è ottimale.`
    };
  }
  try {
    const response = await client.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1
      }
    });

    let text = response.text;
    if (!text) return { averagePrice: 0, competitors: [], analysis: "Dati non trovati." };

    // Clean markdown
    text = cleanJson(text);

    const data = JSON.parse(text);
    return {
      averagePrice: data.averagePrice || 0,
      competitors: data.competitors || [],
      analysis: data.analysis || "Nessuna analisi disponibile."
    };

  } catch (e) {
    console.error("Market Price Analysis Error", e);
    return { averagePrice: 0, competitors: [], analysis: "Errore durante l'analisi." };
  }
}

// NEW: PDF Price List Parsing
export const parsePriceListPdf = async (base64Data: string): Promise<any> => {
  // NOTE: Gemini 1.5 Flash supports PDF input via inlineData (max 20MB usually)
  const prompt = `
    Analizza questo documento PDF (Listino Prezzi Auto).
    Estrai strutturatamente tutti i veicoli, i prezzi per le varie durate e le condizioni.
    
    Restituisci un JSON con questa struttura:
    {
      "validityDate": "Data validità listino",
      "cars": [
        {
          "brand": "Brand",
          "model": "Modello",
          "rates": {
             "daily": 0,
             "monthly": 0
          }
        }
      ]
    }
    
    Se il documento è illeggibile o non è un listino, restituisci un errore nel JSON.
  `;

  const client = getAiClient();
  if (!client) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      validityDate: "Marzo 2024",
      cars: [
        { brand: "Fiat", model: "500X", rates: { daily: 45, monthly: 550 } },
        { brand: "Audi", model: "A3", rates: { daily: 85, monthly: 950 } }
      ]
    };
  }
  try {
    // Use models.generateContent with proper Part structure for Gemini 1.5
    const response = await client.models.generateContent({
      model: modelId,
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: base64Data
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = cleanJson(response.text || "{}");
    return JSON.parse(text);

  } catch (error: any) {
    if (error.message?.includes('413') || error.status === 413) {
      throw new Error("Il file è troppo grande (Max 20MB per Gemini 1.5 Flash).");
    }
    console.error("PDF Parse Error:", error);
    throw new Error("Errore durante l'analisi API del PDF. Verifica il formato.");
  }
}