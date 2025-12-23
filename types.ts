
export enum CarStatus {
  AVAILABLE = 'Disponibile',
  RENTED = 'Noleggiata',
  MAINTENANCE = 'Manutenzione',
}

export interface Car {
  id: string;
  brand: string;
  model: string;
  plate: string;
  category: 'Economy' | 'SUV' | 'Luxury' | 'Van';
  pricePerDay: number;
  status: CarStatus;
  image: string;
  features?: string[];
  description?: string;
  // New Fields
  year: number;
  mileage: number;
  condition: 'Nuovo' | 'Usato';
  fuelType: 'Benzina' | 'Diesel' | 'Ibrido' | 'Elettrico' | 'GPL/Metano';
  transmission: 'Manuale' | 'Automatico';
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: 'Privato' | 'Azienda';
  vatNumber?: string;
  address?: string;
  riskScore?: number;
  status: 'Attivo' | 'In Revisione' | 'Bloccato';
}

export interface AgentBillingDetails {
  vatNumber: string; // P.IVA o Codice Fiscale
  billingAddress: string;
  iban: string;
  bankName: string;
  paymentTerms: string; // es. 30gg d.f.
}

export interface Agent {
  id: string;
  name: string;
  nickname: string;
  region: string;
  mandateStart: string;
  commissionRate: number; // Percentage
  activeClients: number;
  status: 'Attivo' | 'Sospeso';
  billing?: AgentBillingDetails; // New Field
}

export interface Contract {
  id: string;
  agentId: string;
  clientId: string;
  carId: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  commissionAmount: number; // New: Calculated commission
  status: 'Attivo' | 'Concluso';
  signedDate: string;
  // Inspection Photos
  checkInPhotos?: string[];
  checkOutPhotos?: string[];
  notes?: string;
}

export interface Quote {
  id: string;
  client: Client;
  car: Car;
  startDate: string;
  endDate: string;
  days: number;
  totalAmount: number;
  status: 'Bozza' | 'Inviato' | 'Accettato';
}

export interface RiskAnalysisResult {
  riskScore: number;
  riskLevel: 'Basso' | 'Medio' | 'Alto';
  maxCreditLimit: number;
  reasoning: string;
  recommendation: string;
}

export interface DriverProfile {
  job: string;
  annualIncome: string;
  annualKm: string;
  familySize: string;
  // Enhanced Fields
  tripType: 'Urbano' | 'Extraurbano' | 'Autostrada' | 'Misto';
  transmission: 'Manuale' | 'Automatico' | 'Indifferente';
  drivingStyle: 'Rilassato' | 'Sportivo' | 'Ecologico';
  loadNeeds: 'Standard' | 'Bagagli Voluminosi' | 'Attrezzatura Sportiva' | 'Animali Domestici';
  priority: 'Risparmio' | 'Comfort' | 'Tecnologia' | 'Immagine/Status';
}

export interface AIRecommendation {
  carId: string;
  matchScore: number;
  reasoning: string;
  suggestedMonthlyRate: number;
  suggestedDurationMonths: number;
}

// New Interface for AI Leads
export interface MarketingLead {
    id: string;
    name: string;
    company: string;
    interest: string;
    status: 'New' | 'Contacted' | 'Converted';
    source: 'Manual' | 'AI_Search' | 'External';
    location?: string;
    // New Contact Fields
    email?: string;
    phone?: string;
}

// Company Settings Interface
export interface CompanyProfile {
    name: string;
    slogan: string;
    vatNumber: string;
    address: string;
    city: string;
    email: string;
    phone: string;
    website: string;
    bio: string;
    logoUrl?: string;
    social: {
        linkedin?: string;
        facebook?: string;
        instagram?: string;
    };
    bankInfo: {
        iban: string;
        bankName: string;
    }
}

// Session Management
export interface UserSession {
    role: 'agency' | 'agent';
    userId?: string; // ID of the agent if role is agent
    name: string;
}