import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Car, Client, Agent, CarStatus, Contract, MarketingLead, CompanySettings } from '../types';

// Initial Mock Data
const INITIAL_FLEET: Car[] = [
  {
    id: '1', brand: 'BMW', model: 'X5', plate: 'GF-992-AZ', category: 'SUV', pricePerDay: 120, status: CarStatus.AVAILABLE, image: 'https://picsum.photos/400/250?random=1', features: ['Diesel', '4x4', 'Navi Pro'], description: 'SUV di lusso perfetto per lunghi viaggi.',
    year: 2023, mileage: 15000, condition: 'Usato', fuelType: 'Diesel', transmission: 'Automatico'
  },
  {
    id: '2', brand: 'Fiat', model: '500e', plate: 'GG-102-BB', category: 'Economy', pricePerDay: 45, status: CarStatus.RENTED, image: 'https://picsum.photos/400/250?random=2', features: ['Elettrica', 'City Mode', 'CarPlay'], description: 'Agile city car elettrica.',
    year: 2024, mileage: 500, condition: 'Nuovo', fuelType: 'Elettrico', transmission: 'Automatico'
  },
  {
    id: '3', brand: 'Mercedes', model: 'Class C', plate: 'FE-221-CX', category: 'Luxury', pricePerDay: 150, status: CarStatus.MAINTENANCE, image: 'https://picsum.photos/400/250?random=3', features: ['Hybrid', 'Pelle', 'ADAS L2'], description: 'Eleganza e comfort superiori.',
    year: 2022, mileage: 45000, condition: 'Usato', fuelType: 'Ibrido', transmission: 'Automatico'
  },
  {
    id: '4', brand: 'Tesla', model: 'Model 3', plate: 'HG-555-TT', category: 'Luxury', pricePerDay: 130, status: CarStatus.AVAILABLE, image: 'https://picsum.photos/400/250?random=4', features: ['Elettrica', 'Autopilot', 'Tetto Panoramico'], description: 'Tecnologia pura e prestazioni.',
    year: 2023, mileage: 12000, condition: 'Usato', fuelType: 'Elettrico', transmission: 'Automatico'
  },
  {
    id: '5', brand: 'Jeep', model: 'Renegade', plate: 'FF-404-ER', category: 'SUV', pricePerDay: 80, status: CarStatus.RENTED, image: 'https://picsum.photos/400/250?random=5', features: ['Diesel', 'Off-road', 'Spaziosa'], description: 'Versatilità per ogni terreno.',
    year: 2021, mileage: 60000, condition: 'Usato', fuelType: 'Diesel', transmission: 'Manuale'
  },
];

const INITIAL_CLIENTS: Client[] = [
  {
    id: '1',
    name: 'Mario Rossi',
    email: 'mario.rossi@example.com',
    phone: '+39 333 1234567',
    type: 'Privato',
    fiscalCode: 'RSSMAR80A01H501U',
    birthDate: '1980-01-01',
    address: { street: 'Via Garibaldi 10', city: 'Milano', zip: '20100', province: 'MI' },
    status: 'Attivo',
    riskScore: 85,
    documents: [
      { id: '101', name: 'Patente Fronte', type: 'jpg', uploadDate: '2023-01-10', url: 'https://via.placeholder.com/150', status: 'Valido' },
      { id: '102', name: 'Carta Identità', type: 'pdf', uploadDate: '2023-01-10', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', status: 'Valido' }
    ],
    rentalHistory: [
      { id: 'r1', carModel: 'Fiat 500', plate: 'AB-123-CD', startDate: '2023-05-01', endDate: '2023-05-10', totalAmount: 450, status: 'Concluso' }
    ],
    notes: 'Cliente abituale, puntuale nei pagamenti.',
    subagentId: '1' // Managed by Alessandro Verdi
  },
  {
    id: '2',
    name: 'Logistics Solutions Srl',
    email: 'info@logistics.it',
    phone: '+39 02 1234567',
    type: 'Azienda',
    vatNumber: 'IT12345678901',
    address: { street: 'Via Industria 5', city: 'Bologna', zip: '40100', province: 'BO' },
    status: 'Attivo',
    riskScore: 92,
    documents: [],
    rentalHistory: [],
    notes: 'Richiede fatturazione elettronica.',
    subagentId: '2' // Managed by Marco Neri
  },
];

const INITIAL_AGENTS: Agent[] = [
  {
    id: '1', name: 'Alessandro Verdi', nickname: 'ale_verdi', region: 'Lombardia', mandateStart: '2023-01-15', commissionRate: 15, activeClients: 24, status: 'Attivo',
    billing: { iban: 'IT60X0542811101000000123456', bankName: 'Intesa Sanpaolo', vatNumber: 'RSSVLD80A01H501U', billingAddress: 'Via Roma 1, Milano', paymentTerms: '30gg d.f.' }
  },
  {
    id: '2', name: 'Marco Neri', nickname: 'marco_n', region: 'Lazio', mandateStart: '2023-03-10', commissionRate: 12, activeClients: 15, status: 'Attivo',
    billing: { iban: 'IT12Y0200800000111112222233', bankName: 'Unicredit', vatNumber: 'IT12345678901', billingAddress: 'Viale Europa 22, Roma', paymentTerms: '60gg d.f.' }
  },
  {
    id: '999', name: 'Agente Demo', nickname: 'demo', region: 'Italia', mandateStart: '2024-01-01', commissionRate: 20, activeClients: 5, status: 'Attivo',
    billing: { iban: 'IT00DEMO000000000000000000', bankName: 'Demo Bank', vatNumber: '00000000000', billingAddress: 'Via Demo 99, Tech City', paymentTerms: '30gg' }
  },
];

const INITIAL_LEADS: MarketingLead[] = [
  { id: '1', name: 'Studio Legale Bianchi', company: 'Studio Bianchi', interest: 'Auto di rappresentanza', status: 'New', source: 'Manual' },
  { id: '2', name: 'Ristorante Da Luigi', company: 'Ristorante Da Luigi', interest: 'Furgone Frigo', status: 'Contacted', source: 'Manual' }
];

const INITIAL_COMPANY_SETTINGS: CompanySettings = {
  name: 'RentSync AI',
  legalName: 'RentSync AI Solutions S.r.l.',
  address: "Via dell'Innovazione 1, Milano",
  vatNumber: 'IT00000000000',
  phoneNumber: '+39 02 0000000',
  email: 'info@rentsync.ai',
  website: 'https://rentsync.ai',
  logoUrl: 'https://via.placeholder.com/150',
  description: 'Soluzioni avanzate per il noleggio auto.',
  crifCircuit: 'S' // Default to Synthetic (Test)
};

interface AppContextType {
  fleet: Car[];
  clients: Client[];
  agents: Agent[];
  contracts: Contract[];
  leads: MarketingLead[];
  addClient: (client: Client) => void;
  addCar: (car: Car) => void;
  updateCar: (car: Car) => void;
  deleteCar: (id: string) => void;
  addAgent: (agent: Agent) => void;
  updateCarStatus: (id: string, status: CarStatus) => void;
  createContract: (contract: Contract) => void;
  addLead: (lead: MarketingLead) => void;
  updateContractPhotos: (contractId: string, type: 'checkIn' | 'checkOut', photos: string[]) => void;
  companySettings: CompanySettings;
  updateCompanySettings: (settings: CompanySettings) => void;
  updateClient: (client: Client) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [fleet, setFleet] = useState<Car[]>(INITIAL_FLEET);
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [contracts, setContracts] = useState<Contract[]>([
    {
      id: 'c1',
      agentId: '1',
      clientId: '1',
      carId: '1',
      startDate: '2024-01-01',
      endDate: '2025-01-01',
      totalAmount: 14400,
      commissionAmount: 2160,
      status: 'Attivo',
      signedDate: '2023-12-28',
      nextPaymentDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0] // Due in 3 days
    }
  ]);
  const [leads, setLeads] = useState<MarketingLead[]>(INITIAL_LEADS);
  const [companySettings, setCompanySettings] = useState<CompanySettings>(INITIAL_COMPANY_SETTINGS);

  const addClient = (client: Client) => {
    setClients(prev => [...prev, client]);
  };

  const updateClient = (updatedClient: Client) => {
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
  };

  const addCar = (car: Car) => {
    setFleet(prev => [...prev, car]);
  };

  const updateCar = (updatedCar: Car) => {
    setFleet(prev => prev.map(c => c.id === updatedCar.id ? updatedCar : c));
  };

  const deleteCar = (id: string) => {
    setFleet(prev => prev.filter(c => c.id !== id));
  };

  const addAgent = (agent: Agent) => {
    setAgents(prev => [...prev, agent]);
  };

  const updateCarStatus = (id: string, status: CarStatus) => {
    setFleet(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  };

  const createContract = (contract: Contract) => {
    // Calculate Commission
    const agent = agents.find(a => a.id === contract.agentId);
    if (agent) {
      contract.commissionAmount = (contract.totalAmount * agent.commissionRate) / 100;
    } else {
      contract.commissionAmount = 0;
    }

    // Initialize empty arrays
    contract.checkInPhotos = [];
    contract.checkOutPhotos = [];

    setContracts(prev => [...prev, contract]);
    // Automatically update car status to RENTED
    updateCarStatus(contract.carId, CarStatus.RENTED);
  };

  const addLead = (lead: MarketingLead) => {
    setLeads(prev => [...prev, lead]);
  }

  const updateContractPhotos = (contractId: string, type: 'checkIn' | 'checkOut', photos: string[]) => {
    setContracts(prev => prev.map(c => {
      if (c.id === contractId) {
        return {
          ...c,
          [type === 'checkIn' ? 'checkInPhotos' : 'checkOutPhotos']: photos
        };
      }
      return c;
    }));
  };

  const updateCompanySettings = (settings: CompanySettings) => {
    setCompanySettings(settings);
  };

  return (
    <AppContext.Provider value={{ fleet, clients, agents, contracts, leads, addClient, updateClient, addCar, updateCar, deleteCar, addAgent, updateCarStatus, createContract, addLead, updateContractPhotos, companySettings, updateCompanySettings }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};