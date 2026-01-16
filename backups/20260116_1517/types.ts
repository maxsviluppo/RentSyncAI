
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
  // Enhanced Fields
  accessories?: string[];
  rentalRates?: {
    monthly1?: number;
    monthly3?: number;
    monthly6?: number;
    monthly12?: number;
    monthly24?: number;
    monthly48?: number;
  };
  // Promo / Feed for Agents
  isPromo?: boolean;
  promoDescription?: string;
}

export interface ClientDocument {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'docx' | 'txt' | 'jpg' | 'png' | 'other';
  uploadDate: string;
  url: string;
  status: 'Valido' | 'Scaduto' | 'In Revisione';
}

export interface RentalHistoryItem {
  id: string;
  carModel: string;
  plate: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  status: 'Concluso' | 'Attivo' | 'Annullato';
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: 'Privato' | 'Azienda';
  vatNumber?: string;
  fiscalCode?: string; // Codice Fiscale
  birthDate?: string;
  address?: {
    street: string;
    city: string;
    zip: string;
    province: string;
  };
  riskScore?: number;
  status: 'Attivo' | 'In Revisione' | 'Bloccato';
  documents?: ClientDocument[];
  rentalHistory?: RentalHistoryItem[];
  notes?: string;
  subagentId?: string; // Link to the Agent who manages this client
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
  messages?: AgentMessage[];
  documents?: ClientDocument[]; // Reusing ClientDocument for Mandates etc
}

export interface AgentMessage {
  id: string;
  sender: 'Admin' | 'Agent';
  content: string;
  timestamp: string;
  read: boolean;
  type: 'Info' | 'Promo' | 'Alert' | 'Direct';
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
  nextPaymentDate?: string; // For alerts
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
}

export interface CompanySettings {
  name: string;
  legalName: string; // Ragione Sociale
  address: string;
  vatNumber: string;
  phoneNumber: string;
  email: string;
  website: string;
  logoUrl: string;
  description: string;
  // CRIF Integration
  crifUsername?: string;
  crifPassword?: string;
  crifCircuit?: 'S' | 'P'; // e.g. 'S' for Synthetic, 'P' for Production
  crifCertificate?: string; // PEM/P12 content or path
}
