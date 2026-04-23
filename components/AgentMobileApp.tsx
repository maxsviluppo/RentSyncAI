import React, { useState, useEffect } from 'react';
import { recommendCar } from '../services/gemini';
import { CarStatus, AIRecommendation, Contract, DriverProfile, Agent } from '../types';
import { useApp } from '../contexts/AppContext';
import { Smartphone, LogIn, User, Car as CarIcon, FileText, Search, Sparkles, ArrowRight, Loader2, Home, Plus, PenTool, CheckCircle, Wifi, DollarSign, Settings2, QrCode, Share2, Copy, X, Camera, Trash, FileCheck, Building2, Phone, Mail, UploadCloud } from 'lucide-react';

// --- SUB-COMPONENTS EXTRACTED ---

// 1. Contract / Rental Generator
const MobileContract: React.FC<{ currentAgent: Agent }> = ({ currentAgent }) => {
  const { fleet, clients, createContract } = useApp();
  const [step, setStep] = useState(1);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedCarId, setSelectedCarId] = useState('');
  const [dates, setDates] = useState({ start: '', end: '', duration: 36 });
  const [advance, setAdvance] = useState(0);

  const myClients = clients.filter(c => c.subagentId === currentAgent.id);

  // Commercial logic helper (Duration-based discounting)
  const getPricingInfo = () => {
    const car = fleet.find(c => c.id === selectedCarId);
    if (!car) return { monthlyRate: 0, total: 0 };
    
    // Multiplier logic: 12m=1.0x, 24m=0.9x, 36m=0.85x, 48m=0.8x, 60m=0.75x
    let multiplier = 1.0;
    if (dates.duration === 12) multiplier = 1.0;
    if (dates.duration === 24) multiplier = 0.9;
    if (dates.duration === 36) multiplier = 0.85;
    if (dates.duration === 48) multiplier = 0.8;
    if (dates.duration === 60) multiplier = 0.75;

    const baseMonthly = (car?.pricePerDay || 0) * 30;
    const discountedMonthly = baseMonthly * multiplier;
    const total = discountedMonthly * dates.duration;
    
    return { 
        monthlyRate: Math.round(discountedMonthly), 
        total: Math.round(total),
        commission: Math.round(total * (currentAgent.commissionRate / 100))
    };
  };

  const pricing = getPricingInfo();
  const currentPricing = {
    monthlyRate: pricing.monthlyRate || 0,
    total: pricing.total || 0,
    commission: pricing.commission || 0
  };

  const handleCreateContract = () => {
    if (!selectedClientId || !selectedCarId || !dates.start) return;

    const car = fleet.find(c => c.id === selectedCarId);
    const startDate = new Date(dates.start);
    const endDate = new Date(startDate);
    endDate.setMonth(startDate.getMonth() + dates.duration);

    const newContract: Contract = {
      id: `CNT-${Date.now()}`,
      agentId: currentAgent.id,
      clientId: selectedClientId,
      carId: selectedCarId,
      startDate: dates.start,
      endDate: endDate.toISOString().split('T')[0],
      totalAmount: currentPricing.total,
      commissionAmount: currentPricing.commission,
      status: 'Attivo',
      signedDate: new Date().toISOString(),
      nextPaymentDate: new Date(startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate()).toISOString().split('T')[0]
    };

    createContract(newContract);
    setStep(3); // Success
  };

  return (
    <div className="h-full overflow-y-auto pb-24 p-5">
      <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <PenTool className="w-6 h-6 text-indigo-600" /> Contratto
      </h3>

      {step === 1 && (
        <div className="space-y-5">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">1. Seleziona Tuo Cliente</label>
            <select className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none text-sm font-bold text-slate-700" value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)}>
              <option value="">-- Miei Clienti Portfolio --</option>
              {myClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">2. Seleziona Auto</label>
            <select className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none text-sm" value={selectedCarId} onChange={e => setSelectedCarId(e.target.value)}>
              <option value="">-- Veicolo Disponibile --</option>
              {fleet.filter(c => c.status === CarStatus.AVAILABLE).map(c => (
                <option key={c.id} value={c.id}>{c.brand} {c.model} - {c.vehicleCode}</option>
              ))}
            </select>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">3. Configurazione Offerta</label>
            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Seleziona Durata Contrattuale (Mesi)</span>
                <div className="grid grid-cols-5 gap-2">
                    {[12, 24, 36, 48, 60].map(m => (
                        <button 
                            key={m} 
                            onClick={() => setDates({...dates, duration: m})}
                            className={`py-2 rounded-xl text-[10px] font-bold border-2 transition-all ${dates.duration === m ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                        >
                            {m}M
                        </button>
                    ))}
                </div>
              </div>
              
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Anticipo / Deposito (€)</span>
                <input 
                    type="number" 
                    placeholder="Es. 1500" 
                    className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold text-slate-900 outline-none" 
                    value={advance || ''} 
                    onChange={e => setAdvance(Number(e.target.value))} 
                />
              </div>

              {selectedCarId && (
                  <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50 flex justify-between items-center animate-in fade-in duration-500">
                     <div>
                        <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-tight">Canone Listino {dates.duration} Mesi</span>
                        <div className="text-xl font-black text-indigo-700">€ {currentPricing.monthlyRate}</div>
                     </div>
                     <div className="text-right">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Totale Valore</span>
                        <div className="text-sm font-bold text-slate-900">€ {currentPricing.total.toLocaleString()}</div>
                     </div>
                  </div>
              )}
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">3. Data Inizio Contratto</label>
            <div className="grid grid-cols-1 gap-3">
              <input type="date" className="p-3 bg-slate-50 rounded-xl text-xs font-bold" value={dates.start} onChange={e => setDates({ ...dates, start: e.target.value })} />
            </div>
            <p className="text-[9px] text-slate-400 mt-2 italic">* La data di fine verrà calcolata automaticamente in base alla durata selezionata.</p>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!selectedClientId || !selectedCarId || !dates.start}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-lg disabled:opacity-50"
          >
            Genera Anteprima
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-in slide-in-from-right">
          <h4 className="font-bold text-lg mb-4 border-b pb-2">Riepilogo Contratto</h4>
          <div className="space-y-3 text-sm text-slate-600 mb-6">
            <p><span className="font-bold text-slate-900">Cliente:</span> {clients.find(c => c.id === selectedClientId)?.name}</p>
            <p><span className="font-bold text-slate-900">Auto:</span> {fleet.find(f => f.id === selectedCarId)?.brand} {fleet.find(f => f.id === selectedCarId)?.model}</p>
            <p><span className="font-bold text-slate-900">Durata:</span> {dates.duration} Mesi ({dates.start} - Fine prevista)</p>
            
            <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Quota Mensile</span>
                    <span className="font-bold text-slate-900">€ {currentPricing.monthlyRate}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Tua Provvigione</span>
                    <span className="font-bold text-indigo-600">€ {currentPricing.commission}</span>
                </div>
            </div>

            <div className="bg-indigo-600 p-4 rounded-2xl text-white font-bold text-center text-xl mt-2 shadow-lg shadow-indigo-100">
               Totale: € {currentPricing.total.toLocaleString()}
            </div>
          </div>
          <p className="text-xs text-slate-400 mb-4 italic">Cliccando su "Firma e Attiva", confermi di aver visionato i documenti e autorizzi il noleggio. Lo stato dell'auto verrà aggiornato a "Noleggiata".</p>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold">Indietro</button>
            <button onClick={handleCreateContract} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold">Firma e Attiva</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col items-center justify-center pt-10 animate-in zoom-in">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Contratto Attivato!</h3>
          <p className="text-slate-500 text-center mt-2 px-4">L'auto è ora segnata come "Noleggiata" nella Dashboard centrale.</p>
          <button onClick={() => { setStep(1); setSelectedCarId(''); setSelectedClientId(''); }} className="mt-8 bg-slate-900 text-white px-8 py-3 rounded-xl font-bold">Nuovo Contratto</button>
        </div>
      )}
    </div>
  );
};

// 2. Add Client Mobile
const MobileAddClient = ({ currentAgent, onClose }: { currentAgent: Agent, onClose: () => void }) => {
  const { addClient } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    type: 'Privato' as 'Privato' | 'Azienda',
    fiscalCode: '',
    vatNumber: '',
    street: '',
    city: '',
    zip: '',
    province: '',
    notes: ''
  });

  const handleSave = () => {
    if (!formData.name) return;
    addClient({
      id: Date.now().toString(),
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      type: formData.type,
      fiscalCode: formData.type === 'Privato' ? formData.fiscalCode : undefined,
      vatNumber: formData.type === 'Azienda' ? formData.vatNumber : undefined,
      address: {
        street: formData.street,
        city: formData.city,
        zip: formData.zip,
        province: formData.province
      },
      notes: formData.notes,
      status: 'Attivo',
      riskScore: 50,
      documents: [],
      rentalHistory: [],
      subagentId: currentAgent.id // Assigned to the agent who registered them
    });
    alert("Cliente sincronizzato con la Dashboard!");
    onClose();
  };

  return (
    <div className="absolute inset-0 bg-white z-50 p-5 mt-12 overflow-y-auto animate-in slide-in-from-bottom pb-20">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">Nuovo Cliente</h3>
        <button onClick={onClose} className="p-2 bg-slate-100 rounded-full"><X className="w-4 h-4" /></button>
      </div>

      <div className="space-y-4">
        {/* Toggle Tipo Cliente */}
        <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button 
                onClick={() => setFormData({...formData, type: 'Privato'})}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${formData.type === 'Privato' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
            >
                Privato
            </button>
            <button 
                onClick={() => setFormData({...formData, type: 'Azienda'})}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${formData.type === 'Azienda' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
            >
                Azienda
            </button>
        </div>

        <input type="text" placeholder="Nome Completo / Ragione Sociale" className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        
        <div className="grid grid-cols-2 gap-3">
            <input type="email" placeholder="Email" className="p-4 bg-slate-50 rounded-2xl outline-none text-sm" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            <input type="tel" placeholder="Cellulare" className="p-4 bg-slate-50 rounded-2xl outline-none text-sm" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
        </div>

        {formData.type === 'Privato' ? (
            <input type="text" placeholder="Codice Fiscale" className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-sm" value={formData.fiscalCode} onChange={e => setFormData({...formData, fiscalCode: e.target.value})} />
        ) : (
            <input type="text" placeholder="Partita IVA" className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-sm" value={formData.vatNumber} onChange={e => setFormData({...formData, vatNumber: e.target.value})} />
        )}

        <div className="space-y-3 pt-2">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase ml-2 tracking-widest">Sede / Residenza</h4>
            <input type="text" placeholder="Via e Numero Civico" className="w-full p-4 bg-slate-100/50 rounded-2xl outline-none text-sm" value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} />
            <div className="grid grid-cols-2 gap-3">
                <select className="p-4 bg-slate-100/50 rounded-2xl outline-none text-sm font-bold text-slate-700" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})}>
                    <option value="">-- Città --</option>
                    <option value="Milano">Milano</option>
                    <option value="Roma">Roma</option>
                    <option value="Torino">Torino</option>
                    <option value="Napoli">Napoli</option>
                    <option value="Bologna">Bologna</option>
                    <option value="Firenze">Firenze</option>
                    <option value="Genova">Genova</option>
                    <option value="Verona">Verona</option>
                    <option value="Palermo">Palermo</option>
                    <option value="Cagliari">Cagliari</option>
                </select>
                <div className="flex gap-2">
                    <input type="text" placeholder="PR" className="w-12 p-4 bg-slate-100/50 rounded-2xl outline-none text-sm" value={formData.province} onChange={e => setFormData({...formData, province: e.target.value})} />
                    <input type="text" placeholder="CAP" className="flex-1 p-4 bg-slate-100/50 rounded-2xl outline-none text-sm" value={formData.zip} onChange={e => setFormData({...formData, zip: e.target.value})} />
                </div>
            </div>
        </div>

        <textarea placeholder="Note aggiuntive / Fatturazione" className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-sm h-24" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />

        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-4 bg-slate-100 rounded-2xl font-bold text-slate-600 text-sm">Annulla</button>
          <button onClick={handleSave} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-lg">Salva Cliente</button>
        </div>
      </div>
    </div>
  );
};

// 3. Vehicle Details Mobile (New)
const MobileVehicleDetails = ({ car, onClose, onStartQuote }: { car: any, onClose: () => void, onStartQuote: () => void }) => {
    return (
      <div className="absolute inset-0 bg-white z-50 overflow-y-auto animate-in slide-in-from-bottom">
        <div className="relative">
          <img src={car.image} className="w-full h-64 object-cover" alt="car" />
          <button onClick={onClose} className="absolute top-10 left-5 p-2 bg-black/40 backdrop-blur-md rounded-full text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 -mt-8 bg-white rounded-t-[40px] relative">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{car.brand} {car.model}</h2>
              <p className="text-slate-500 font-medium">Cod: {car.vehicleCode}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${car.status === CarStatus.AVAILABLE ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {car.status}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-50 p-4 rounded-3xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Carburante</span>
              <span className="text-sm font-bold text-slate-900">{car.fuelType}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-3xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Cambio</span>
              <span className="text-sm font-bold text-slate-900">{car.transmission}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-3xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Colore Esterno</span>
                <span className="text-sm font-bold text-slate-900">{car.externalColor}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-3xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Categoria</span>
                <span className="text-sm font-bold text-slate-900">{car.category}</span>
            </div>
          </div>
          
          <div className="mb-8">
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Optional Inclusi</h4>
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-2xl">
                    <CheckCircle className="w-4 h-4 text-green-500" /> {car.optional || 'Configurazione Standard'}
                </div>
                {car.features?.map((f: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-2xl">
                        <CheckCircle className="w-4 h-4 text-green-500" /> {f}
                    </div>
                ))}
            </div>
          </div>
          
          <div className="flex gap-3 sticky bottom-4">
            <button 
                onClick={onClose}
                className="flex-[0.5] bg-slate-100 text-slate-600 py-4 rounded-3xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors"
            >
                Indietro
            </button>
            <button 
                onClick={onStartQuote}
                className="flex-1 bg-slate-900 text-white py-4 rounded-3xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 active:scale-95 transition-all"
            >
                <Sparkles className="w-4 h-4 text-indigo-400" /> Preventivo
            </button>
          </div>
        </div>
      </div>
    );
  };

// 4. Smart Quote Mobile (Enhanced)
const MobileQuote = () => {
  const { fleet } = useApp();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [recs, setRecs] = useState<AIRecommendation[]>([]);

  // New Detailed Profile State for Mobile
  const [profile, setProfile] = useState<DriverProfile>({
    job: '',
    annualIncome: '',
    annualKm: '',
    familySize: '',
    tripType: 'Misto',
    transmission: 'Indifferente',
    drivingStyle: 'Rilassato',
    loadNeeds: 'Standard',
    priority: 'Comfort'
  });

  const handleAi = async () => {
    if (!profile.job || !profile.annualIncome) {
      alert("Inserisci almeno professione e reddito.");
      return;
    }
    setLoading(true);
    try {
      const r = await recommendCar(fleet, profile);
      setRecs(r);
      setStep(2);
    } catch (e) { alert("Errore AI"); }
    finally { setLoading(false); }
  };

  return (
    <div className="h-full overflow-y-auto pb-24 p-5">
      <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5 text-indigo-600" /> Smart Quote AI</h3>

      {step === 1 && (
        <div className="space-y-4">
          <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-800 text-xs font-medium mb-2">
            Analisi completa per trovare l'auto perfetta.
          </div>

          {/* Simple grouped inputs for mobile */}
          <div className="space-y-3">
            <input type="text" className="w-full p-4 bg-white rounded-2xl text-sm border-none shadow-sm" placeholder="Professione (es. Agente)" value={profile.job} onChange={e => setProfile({ ...profile, job: e.target.value })} />
            <input type="number" className="w-full p-4 bg-white rounded-2xl text-sm border-none shadow-sm" placeholder="Reddito Annuo (€)" value={profile.annualIncome} onChange={e => setProfile({ ...profile, annualIncome: e.target.value })} />

            <div className="grid grid-cols-2 gap-3">
              <select className="p-4 bg-white rounded-2xl text-sm border-none shadow-sm" value={profile.priority} onChange={e => setProfile({ ...profile, priority: e.target.value as any })}>
                <option>Risparmio</option>
                <option>Comfort</option>
                <option>Tecnologia</option>
                <option>Immagine</option>
              </select>
              <select className="p-4 bg-white rounded-2xl text-sm border-none shadow-sm" value={profile.tripType} onChange={e => setProfile({ ...profile, tripType: e.target.value as any })}>
                <option>Misto</option>
                <option>Urbano</option>
                <option>Autostrada</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input type="text" className="w-full p-4 bg-white rounded-2xl text-sm border-none shadow-sm" placeholder="Km Annui" value={profile.annualKm} onChange={e => setProfile({ ...profile, annualKm: e.target.value })} />
              <input type="text" className="w-full p-4 bg-white rounded-2xl text-sm border-none shadow-sm" placeholder="Famiglia (N.)" value={profile.familySize} onChange={e => setProfile({ ...profile, familySize: e.target.value })} />
            </div>

            <select className="w-full p-4 bg-white rounded-2xl text-sm border-none shadow-sm" value={profile.loadNeeds} onChange={e => setProfile({ ...profile, loadNeeds: e.target.value as any })}>
              <option value="Standard">Carico Standard</option>
              <option value="Bagagli Voluminosi">Bagagli Voluminosi</option>
              <option value="Attrezzatura Sportiva">Attrezzatura Sportiva</option>
              <option value="Animali Domestici">Animali Domestici</option>
            </select>
          </div>

          <button onClick={handleAi} disabled={loading} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold mt-4 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200">
            {loading ? <Loader2 className="animate-spin" /> : <Sparkles className="w-4 h-4" />} Analizza con AI
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 animate-in slide-in-from-right">
          <button onClick={() => setStep(1)} className="text-sm text-slate-500 mb-2">← Torna indietro</button>
          {recs.map((r, i) => {
            const c = fleet.find(car => car.id === r.carId);
            if (!c) return null;
            return (
              <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                <div className="flex gap-4 mb-3">
                  <img src={c.image} className="w-20 h-20 object-cover rounded-xl bg-slate-200" alt="car" />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <div className="font-bold text-slate-900 leading-tight">{c.brand} {c.model}</div>
                        <div className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full">{r.matchScore}% Match</div>
                    </div>
                    
                    <div className="mt-2 flex flex-wrap gap-2">
                        <div className="bg-slate-900 text-white px-2 py-1 rounded-lg">
                            <span className="text-[8px] block opacity-70 leading-none">CANONE</span>
                            <span className="text-xs font-bold">€ {r.suggestedMonthlyRate}</span>
                        </div>
                        <div className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
                            <span className="text-[8px] block opacity-70 leading-none">RCA</span>
                            <span className="text-xs font-bold">€ 250</span>
                        </div>
                        <div className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
                            <span className="text-[8px] block opacity-70 leading-none">MESI</span>
                            <span className="text-xs font-bold">{r.suggestedDurationMonths}</span>
                        </div>
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-600 bg-slate-50 p-3 rounded-xl italic leading-relaxed border border-slate-50">
                  <Sparkles className="w-3 h-3 inline mr-1 text-indigo-500" />
                  "{r.reasoning}"
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
}

// 5. Mobile Clients List & Docs (New)
const MobileClientsTab = ({ currentAgent }: { currentAgent: Agent }) => {
  const { clients, updateClient } = useApp();
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [search, setSearch] = useState('');

  const myClients = clients.filter(c => c.subagentId === currentAgent.id);
  const filteredClients = myClients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  // Document Upload Handler
  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>, client: any) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newDoc = {
        id: `DOC-${Date.now()}`,
        name: file.name,
        type: file.name.split('.').pop()?.toLowerCase() || 'pdf',
        uploadDate: new Date().toISOString().split('T')[0],
        url: URL.createObjectURL(file), // Local preview simulation
        status: 'In Revisione'
      };
      
      const updatedClient = {
        ...client,
        documents: [...(client.documents || []), newDoc]
      };
      
      updateClient(updatedClient);
      alert("Documento caricato e sincronizzato con la Dashboard Centrale.");
    }
  };

  const deleteDoc = (client: any, docId: string) => {
    if (confirm("Eliminare questo documento?")) {
      const updatedClient = {
        ...client,
        documents: client.documents.filter((d: any) => d.id !== docId)
      };
      updateClient(updatedClient);
    }
  };

  if (selectedClient) {
    return (
      <div className="absolute inset-0 bg-white z-50 overflow-y-auto animate-in slide-in-from-right h-full">
         <div className="p-6 sticky top-0 bg-white/90 backdrop-blur-md border-b z-10 flex items-center justify-between">
            <button onClick={() => setSelectedClient(null)} className="p-2 -ml-2 hover:bg-slate-100 rounded-full">
                <ArrowRight className="w-5 h-5 rotate-180" />
            </button>
            <h3 className="font-bold text-slate-900">Dossier Cliente</h3>
            <div className="w-8" />
         </div>

         <div className="p-5 space-y-6 pb-24">
            <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-bold text-2xl mb-4">
                    {selectedClient.name.charAt(0)}
                </div>
                <h4 className="text-xl font-black text-slate-900 leading-tight">{selectedClient.name}</h4>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{selectedClient.type}</p>
                
                <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                        <Mail className="w-4 h-4 text-slate-300" /> {selectedClient.email}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                        <Phone className="w-4 h-4 text-slate-300" /> {selectedClient.phone}
                    </div>
                </div>
            </div>

            {/* DOCUMENT SECTION */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h5 className="font-bold text-slate-800 uppercase text-[10px] tracking-[0.2em]">Documentazione</h5>
                    <label className="cursor-pointer bg-slate-900 text-white p-2 rounded-xl shadow-lg active:scale-95 transition-all">
                        <Camera className="w-4 h-4" />
                        <input type="file" className="hidden" onChange={(e) => handleDocUpload(e, selectedClient)} />
                    </label>
                </div>

                <div className="space-y-3">
                    {selectedClient.documents?.length === 0 && (
                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-8 rounded-3xl text-center">
                            <UploadCloud className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nessun documento caricato</p>
                        </div>
                    )}
                    {selectedClient.documents?.map((doc: any) => (
                        <div key={doc.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex justify-between items-center group">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 flex-shrink-0">
                                    <FileCheck className="w-5 h-5" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-sm font-bold text-slate-900 truncate">{doc.name}</p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase">{doc.uploadDate} • {doc.status}</p>
                                </div>
                            </div>
                            <button onClick={() => deleteDoc(selectedClient, doc.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                                <Trash className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pb-24 p-5">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-slate-900">Miei Clienti</h3>
        <div className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-bold text-slate-500 uppercase">{myClients.length} Totali</div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        <input 
            type="text" 
            className="w-full p-4 pl-12 bg-white rounded-2xl border-none shadow-sm text-sm" 
            placeholder="Cerca cliente..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {filteredClients.map(client => (
          <div 
            key={client.id} 
            onClick={() => setSelectedClient(client)}
            className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between active:scale-95 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-700 rounded-xl flex items-center justify-center font-bold text-sm">
                    {client.name.charAt(0)}
                </div>
                <div>
                    <h4 className="text-sm font-bold text-slate-900">{client.name}</h4>
                    <p className="text-[10px] text-slate-400 font-semibold">{client.type} • {client.address?.city || 'Senza sede'}</p>
                </div>
            </div>
            <div className="text-slate-300">
                <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- MAIN COMPONENT ---
const AgentMobileApp: React.FC = () => {
  const { fleet, agents, contracts } = useApp();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [agentNickname, setAgentNickname] = useState('');
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'quote' | 'contract' | 'clients' | 'profile'>('home');
  const [error, setError] = useState('');
  const [showAddClient, setShowAddClient] = useState(false);
  const [carSearch, setCarSearch] = useState('');
  const [viewingCar, setViewingCar] = useState<any | null>(null);

  // AUTO LOGIN CHECK VIA URL PARAM
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const agentRef = params.get('agent_ref');

    if (agentRef && !isLoggedIn) {
      const agent = agents.find(a => a.nickname.toLowerCase() === agentRef.toLowerCase());
      if (agent) {
        if (agent.status !== 'Attivo') {
          setError('Utenza sospesa o revocata. Contatta l\'amministrazione.');
          return;
        }
        setCurrentAgent(agent);
        setIsLoggedIn(true);
      }
    }
  }, [agents, isLoggedIn]);

  const handleLogin = () => {
    const agent = agents.find(a => a.nickname.toLowerCase() === agentNickname.toLowerCase());
    if (agent) {
      if (agent.status !== 'Attivo') {
        setError('Utenza sospesa o revocata.');
        return;
      }
      setCurrentAgent(agent);
      setIsLoggedIn(true);
      setError('');
    } else {
      setError('Nickname non trovato nel database agenti.');
    }
  };

  // Calculate earnings for the logged in agent
  const myEarnings = currentAgent
    ? contracts
      .filter(c => c.agentId === currentAgent.id)
      .reduce((sum, c) => sum + (c.commissionAmount || 0), 0)
    : 0;

  // Sharing function - UPDATED TO INCLUDE LOGIN LINK
  const handleShare = async () => {
    if (!currentAgent) return;

    const baseUrl = window.location.origin;
    // Appends the login magic link
    const shareUrl = `${baseUrl}?agent_ref=${currentAgent.nickname}`;

    const shareData = {
      title: 'RentSync Access',
      text: `Ecco il link per accedere alla tua Area Agente:`,
      url: shareUrl
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        alert("Magic Link copiato negli appunti!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper for QR Code URL - Generates the Login Magic Link QR
  const getQrCodeUrl = () => {
    if (!currentAgent) return '';
    const baseUrl = window.location.origin;
    // This URL will now automatically log the agent in when scanned
    const magicUrl = `${baseUrl}?agent_ref=${currentAgent.nickname}`;
    return `https://quickchart.io/qr?text=${encodeURIComponent(magicUrl)}&size=300&margin=2`;
  };

  // --- LOGIN SCREEN ---
  if (!isLoggedIn || !currentAgent) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-100 p-4">
        <div className="w-[340px] h-[720px] bg-black rounded-[40px] border-[10px] border-slate-900 shadow-2xl overflow-hidden relative flex flex-col items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-black text-white">
          {/* Dynamic Island */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[120px] h-[35px] bg-black rounded-full z-20"></div>

          {/* Logo Area */}
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-indigo-900/50 ring-1 ring-white/10">
            <CarIcon className="w-12 h-12 text-white" />
          </div>

          <h2 className="text-3xl font-bold mb-2 tracking-tight">RentSync<span className="text-indigo-400">Pro</span></h2>
          <p className="text-indigo-200/60 mb-10 text-center px-8 text-sm">Inserisci il tuo nickname aziendale per accedere al terminale mobile.</p>

          <div className="w-full px-8 space-y-4">
            <div>
              <label className="text-[10px] font-bold text-indigo-300/50 uppercase ml-4 mb-1 block">Nickname Agente</label>
              <input
                type="text"
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-center text-lg"
                placeholder="es. demo"
                value={agentNickname}
                onChange={e => setAgentNickname(e.target.value)}
              />
              {error && <p className="text-red-400 text-xs text-center mt-2">{error}</p>}
            </div>
            <button
              onClick={handleLogin}
              className="w-full bg-indigo-500 text-white font-bold py-4 rounded-2xl hover:bg-indigo-400 transition-all shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 mt-4"
            >
              <LogIn className="w-5 h-5" /> Accedi
            </button>
          </div>

          <p className="absolute bottom-8 text-white/20 text-xs">RentSync AI • v2.0</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full bg-slate-200 p-4 font-sans scale-95 origin-center">
      {/* Realistic Phone Frame */}
      <div className="w-[340px] h-[720px] bg-white rounded-[45px] border-[12px] border-[#1e1e1e] shadow-2xl overflow-hidden relative flex flex-col ring-4 ring-slate-300">

        {/* Side Buttons (Visual Only) */}
        <div className="absolute top-24 -left-[18px] w-[4px] h-[26px] bg-[#1e1e1e] rounded-l-md"></div>
        <div className="absolute top-36 -left-[18px] w-[4px] h-[46px] bg-[#1e1e1e] rounded-l-md"></div>
        <div className="absolute top-52 -left-[18px] w-[4px] h-[46px] bg-[#1e1e1e] rounded-l-md"></div>
        <div className="absolute top-40 -right-[18px] w-[4px] h-[70px] bg-[#1e1e1e] rounded-r-md"></div>

        {/* Dynamic Island Area */}
        <div className="absolute top-0 w-full h-[50px] z-30 flex justify-center pointer-events-none">
          <div className="w-[126px] h-[37px] bg-black mt-3 rounded-[20px] flex items-center justify-center gap-3 px-2">
            {/* Fake Camera/Sensors */}
            <div className="w-12 h-12 rounded-full absolute right-2"></div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="h-[54px] w-full bg-white flex justify-between px-8 pt-4 text-xs font-bold text-black z-20">
          <span>9:41</span>
          <div className="flex gap-1.5 items-center">
            <Wifi className="w-4 h-4" />
            <div className="w-6 h-3 bg-black rounded-[4px] relative border border-black"><div className="bg-white h-full w-[60%]"></div></div>
          </div>
        </div>

        {/* Header */}
        <div className="bg-white px-5 pb-3 flex justify-between items-center z-10 sticky top-0">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">RentSync<span className="text-indigo-600">Pro</span></h1>
            <p className="text-[10px] text-slate-400">Ciao, {currentAgent.name.split(' ')[0]}</p>
          </div>
          <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xs ring-1 ring-indigo-100">
            {currentAgent.nickname.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Screen Content */}
        <div className="flex-1 bg-[#F2F4F7] overflow-hidden relative rounded-t-[30px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">

          {/* --- TAB: HOME / FLEET --- */}
          {activeTab === 'home' && (
            <div className="h-full overflow-y-auto pb-24 p-5 space-y-5">

              {/* Quick Actions */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <button onClick={() => setShowAddClient(true)} className="flex-shrink-0 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-slate-900/10">
                  <Plus className="w-3.5 h-3.5" /> Cliente
                </button>
                <button onClick={() => setActiveTab('contract')} className="flex-shrink-0 bg-white text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm border border-slate-100">
                  <PenTool className="w-3.5 h-3.5 text-indigo-600" /> Contratto
                </button>
              </div>

              {/* Fleet Feed */}
              <div className="flex justify-between items-center px-1">
                <h3 className="font-bold text-slate-800 text-base">Disponibili</h3>
                <div className="relative w-32">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3" />
                    <input 
                        type="text" 
                        className="w-full text-[9px] pl-6 py-1 border rounded-full bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
                        placeholder="Ricerca..."
                        value={carSearch}
                        onChange={e => setCarSearch(e.target.value)}
                    />
                </div>
              </div>
              
              {fleet
                .filter(car => 
                    car.brand.toLowerCase().includes(carSearch.toLowerCase()) || 
                    car.model.toLowerCase().includes(carSearch.toLowerCase())
                )
                .map(car => (
                <div 
                    key={car.id} 
                    onClick={() => setViewingCar(car)}
                    className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex flex-col gap-3 active:scale-95 transition-transform cursor-pointer"
                >
                  <div className="relative">
                    <img src={car.image} className="w-full h-32 object-cover rounded-2xl" alt="car" />
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-[10px] font-bold backdrop-blur-md ${car.status === CarStatus.AVAILABLE ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'}`}>
                      {car.status}
                    </div>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <h4 className="font-bold text-slate-900 text-base leading-tight">{car.brand} {car.model}</h4>
                      <p className="text-[10px] text-slate-500 mt-1">{car.category} • {car.plate}</p>
                    </div>
                    <span className="text-base font-bold text-indigo-600">€{car.pricePerDay}<span className="text-[10px] text-slate-400 font-normal">/gg</span></span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* --- TAB: QUOTE --- */}
          {activeTab === 'quote' && <MobileQuote />}

          {/* --- TAB: CONTRACT --- */}
          {activeTab === 'contract' && <MobileContract currentAgent={currentAgent} />}

          {/* --- TAB: CLIENTS --- */}
          {activeTab === 'clients' && <MobileClientsTab currentAgent={currentAgent} />}

          {/* --- TAB: PROFILE --- */}
          {activeTab === 'profile' && (
            <div className="p-5 overflow-y-auto pb-24 h-full">
              <div className="text-center pt-8">
                <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-3xl mx-auto mb-6 shadow-xl shadow-indigo-200">
                  {currentAgent.nickname.charAt(0).toUpperCase()}
                </div>
                <h3 className="font-bold text-2xl text-slate-900">{currentAgent.name}</h3>
                <p className="text-slate-500 text-sm mb-6">{currentAgent.region} • ID: {currentAgent.id}</p>
              </div>

              {/* QR Code Business Card */}
              <div className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100 mb-6 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                <h4 className="font-bold text-slate-900 mb-1 flex items-center justify-center gap-2"><QrCode className="w-4 h-4" /> Accesso Rapido Agente</h4>
                <p className="text-xs text-slate-500 mb-4 px-4">Scansiona questo QR Code per accedere automaticamente all'App Mobile senza login.</p>

                <div className="bg-white p-2 rounded-xl border-2 border-slate-100 inline-block mb-4 shadow-inner">
                  <img
                    src={getQrCodeUrl()}
                    alt="Agent Login QR"
                    className="w-48 h-48"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleShare}
                    className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
                  >
                    <Share2 className="w-4 h-4" /> Invia Link
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}?agent_ref=${currentAgent.nickname}`);
                      alert("Link copiato!");
                    }}
                    className="bg-slate-100 text-slate-600 px-4 rounded-xl hover:bg-slate-200"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">{currentAgent.activeClients}</div>
                  <div className="text-xs text-slate-500 uppercase font-bold">Clienti</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">{currentAgent.commissionRate}%</div>
                  <div className="text-xs text-slate-500 uppercase font-bold">Comm.</div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-2xl shadow-lg shadow-green-200 mb-6">
                <p className="text-green-100 text-sm font-medium mb-1 flex items-center justify-center gap-1"><DollarSign className="w-4 h-4" />Guadagno Totale</p>
                <p className="text-4xl font-bold">€ {myEarnings.toLocaleString()}</p>
              </div>

              <button onClick={() => setIsLoggedIn(false)} className="w-full py-4 text-red-500 bg-white border border-red-100 rounded-2xl font-bold text-sm hover:bg-red-50 transition-colors">Disconnetti</button>
            </div>
          )}

          {/* Add Client Modal Overlay */}
          {showAddClient && <MobileAddClient currentAgent={currentAgent} onClose={() => setShowAddClient(false)} />}
          
          {/* Vehicle Details Overlay */}
          {viewingCar && (
            <MobileVehicleDetails 
                car={viewingCar} 
                onClose={() => setViewingCar(null)} 
                onStartQuote={() => {
                    setViewingCar(null);
                    setActiveTab('quote');
                }}
            />
          )}
        </div>

        {/* Bottom Floating Nav */}
        <div className="absolute bottom-6 left-5 right-5 h-[70px] bg-black/90 backdrop-blur-xl rounded-[35px] flex justify-around items-center px-2 z-40 shadow-2xl">
          <button onClick={() => setActiveTab('home')} className={`p-3 rounded-full transition-all ${activeTab === 'home' ? 'bg-white/20 text-white' : 'text-white/50'}`}>
            <Home className="w-6 h-6" />
          </button>
          <button onClick={() => setActiveTab('quote')} className={`p-3 rounded-full transition-all ${activeTab === 'quote' ? 'bg-white/20 text-white' : 'text-white/50'}`}>
            <Sparkles className="w-6 h-6" />
          </button>
          <button onClick={() => setActiveTab('contract')} className={`p-3 rounded-full transition-all ${activeTab === 'contract' ? 'bg-white/20 text-white' : 'text-white/50'}`}>
            <PenTool className="w-6 h-6" />
          </button>
          <button onClick={() => setActiveTab('clients')} className={`p-3 rounded-full transition-all ${activeTab === 'clients' ? 'bg-white/20 text-white' : 'text-white/50'}`}>
            <Building2 className="w-6 h-6" />
          </button>
          <button onClick={() => setActiveTab('profile')} className={`p-3 rounded-full transition-all ${activeTab === 'profile' ? 'bg-white/20 text-white' : 'text-white/50'}`}>
            <User className="w-6 h-6" />
          </button>
        </div>

        {/* Home Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[130px] h-[5px] bg-black rounded-full z-50"></div>
      </div>
    </div>
  );
};

export default AgentMobileApp;