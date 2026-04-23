import React, { useState, useEffect } from 'react';
import { recommendCar } from '../services/gemini';
import { CarStatus, AIRecommendation, Contract, DriverProfile, Agent } from '../types';
import { useApp } from '../contexts/AppContext';
import { Smartphone, LogIn, User, Car as CarIcon, FileText, Search, Sparkles, ArrowRight, Loader2, Home, Plus, PenTool, CheckCircle, Wifi, DollarSign, Settings2, QrCode, Share2, Copy, X, Camera, Trash, FileCheck, Building2, Phone, Mail, UploadCloud } from 'lucide-react';

// --- SUB-COMPONENTS ---

// 1. Contract / Rental Generator
const MobileContract: React.FC<{ currentAgent: Agent }> = ({ currentAgent }) => {
  const { fleet, clients, createContract } = useApp();
  const [step, setStep] = useState(1);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedCarId, setSelectedCarId] = useState('');
  const [dates, setDates] = useState({ start: '', end: '', duration: 36 });
  const [advance, setAdvance] = useState(0);

  const myClients = clients.filter(c => c.subagentId === currentAgent.id);

  const getPricingInfo = () => {
    const car = fleet.find(c => c.id === selectedCarId);
    if (!car) return { monthlyRate: 0, total: 0 };
    
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
    setStep(3);
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
                  <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50 flex justify-between items-center">
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
            <input type="date" className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold" value={dates.start} onChange={e => setDates({ ...dates, start: e.target.value })} />
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
            <p><span className="font-bold text-slate-900">Durata:</span> {dates.duration} Mesi</p>
            
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
          </div>

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
      subagentId: currentAgent.id
    });
    onClose();
  };

  return (
    <div className="absolute inset-0 bg-white z-[70] p-5 mt-12 overflow-y-auto animate-in slide-in-from-bottom pb-20">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">Nuovo Cliente</h3>
        <button onClick={onClose} className="p-2 bg-slate-100 rounded-full"><X className="w-4 h-4" /></button>
      </div>

      <div className="space-y-4">
        <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button onClick={() => setFormData({...formData, type: 'Privato'})} className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${formData.type === 'Privato' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Privato</button>
            <button onClick={() => setFormData({...formData, type: 'Azienda'})} className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${formData.type === 'Azienda' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Azienda</button>
        </div>

        <input type="text" placeholder="Nome Completo" className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        <div className="grid grid-cols-2 gap-3">
            <input type="email" placeholder="Email" className="p-4 bg-slate-50 rounded-2xl outline-none text-sm" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            <input type="tel" placeholder="Cellulare" className="p-4 bg-slate-50 rounded-2xl outline-none text-sm" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
        </div>

        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-4 bg-slate-100 rounded-2xl font-bold text-slate-600 text-sm">Annulla</button>
          <button onClick={handleSave} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-lg">Salva Cliente</button>
        </div>
      </div>
    </div>
  );
};

// 3. Vehicle Details Mobile
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
          </div>
          
          <div className="flex gap-3 sticky bottom-4">
            <button onClick={onClose} className="flex-[0.5] bg-slate-100 text-slate-600 py-4 rounded-3xl font-bold">Indietro</button>
            <button onClick={onStartQuote} className="flex-1 bg-slate-900 text-white py-4 rounded-3xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
                <Sparkles className="w-4 h-4 text-indigo-400" /> Preventivo
            </button>
          </div>
        </div>
      </div>
    );
};

// 4. Normal Quote Mobile
const MobileNormalQuote = ({ car, currentAgent, onClose }: { car: any, currentAgent: Agent, onClose: () => void }) => {
  const { createContract } = useApp();
  const [selectedOffer, setSelectedOffer] = useState(car.offers?.[0] || null);
  const [customAdvance, setCustomAdvance] = useState(0);
  const [customKasko, setCustomKasko] = useState<number | null>(null);
  const [rateAdjustment, setRateAdjustment] = useState(0);
  const [step, setStep] = useState(1);

  const baseRate = selectedOffer ? selectedOffer.monthlyRate : (car.pricePerDay * 30);
  const amortizedAdvance = (selectedOffer && customAdvance > 0) ? Math.round(customAdvance / selectedOffer.duration) : 0;
  const netMonthly = Math.max(0, baseRate - amortizedAdvance + rateAdjustment);
  const vat = Math.round(netMonthly * 0.22);
  const totalMonthly = Math.round(netMonthly + vat);

  const handleCreate = () => {
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (selectedOffer?.duration || 36));

    const newContract: Contract = {
      id: `CNT-${Date.now()}`,
      agentId: currentAgent.id,
      clientId: 'TEMPORARY',
      carId: car.id,
      startDate,
      endDate: endDate.toISOString().split('T')[0],
      totalAmount: netMonthly * (selectedOffer?.duration || 36),
      commissionAmount: (netMonthly * (selectedOffer?.duration || 36) * currentAgent.commissionRate) / 100,
      status: 'In Attesa',
      signedDate: new Date().toISOString()
    };
    createContract(newContract);
    setStep(2);
  };

  return (
    <div className="absolute inset-0 bg-white z-[60] overflow-y-auto flex flex-col">
      <div className="p-6 border-b flex justify-between items-center bg-slate-50 sticky top-0 z-10">
        <div>
          <h3 className="font-black text-slate-900 uppercase tracking-tight">Configura Preventivo</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase">{car.brand} {car.model}</p>
        </div>
        <button onClick={onClose} className="p-2 bg-white shadow-sm rounded-full"><X className="w-4 h-4" /></button>
      </div>

      <div className="flex-1 p-5 space-y-6 pb-32">
        {step === 1 ? (
          <>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Piano Commerciale</label>
              <div className="grid grid-cols-1 gap-2">
                {car.offers?.map((off: any, i: number) => (
                  <div key={i} onClick={() => setSelectedOffer(off)} className={`p-4 rounded-2xl border-2 transition-all ${selectedOffer === off ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-100 bg-white'}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900">{off.duration} Mesi / {off.kms.toLocaleString()} Km</span>
                      <span className="text-indigo-600 font-black">€ {off.monthlyRate}/m</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 space-y-6">
              <div>
                <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block mb-2">Anticipo (€)</label>
                <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl font-black text-lg outline-none" value={customAdvance || ''} onChange={e => setCustomAdvance(Number(e.target.value))} placeholder="0" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Kasko (€)</label>
                  <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none" value={customKasko ?? ''} placeholder={selectedOffer?.kasko || '0'} onChange={e => setCustomKasko(e.target.value ? Number(e.target.value) : null)} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Diff. Rata (+/-)</label>
                  <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none" value={rateAdjustment || ''} placeholder="0" onChange={e => setRateAdjustment(Number(e.target.value))} />
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-[32px] p-6 text-white shadow-xl">
              <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-4">
                <span className="text-xs font-bold text-slate-400 uppercase">Canone Netto</span>
                <span className="text-xl font-black">€ {netMonthly.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">Totale IVA Incl.</span>
                <span className="text-4xl font-black">€ {totalMonthly.toLocaleString()}</span>
              </div>
            </div>

            <button onClick={handleCreate} className="w-full bg-indigo-600 text-white py-5 rounded-[24px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">Genera Preventivo</button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center pt-20 animate-in zoom-in">
             <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6"><CheckCircle className="w-12 h-12 text-emerald-600" /></div>
             <h3 className="text-2xl font-black text-slate-900">Preventivo Inviato</h3>
             <button onClick={onClose} className="mt-10 bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold">Torna al Parco Auto</button>
          </div>
        )}
      </div>
    </div>
  );
};

// 5. Smart Quote AI
const MobileQuote = () => {
  const { fleet } = useApp();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [recs, setRecs] = useState<AIRecommendation[]>([]);
  const [profile, setProfile] = useState<DriverProfile>({ job: '', annualIncome: '', annualKm: '', familySize: '', tripType: 'Misto', transmission: 'Indifferente', drivingStyle: 'Rilassato', loadNeeds: 'Standard', priority: 'Comfort' });

  const handleAi = async () => {
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
      <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5 text-indigo-600" /> Smart Advisor AI</h3>
      {step === 1 && (
        <div className="space-y-4">
          <input type="text" className="w-full p-4 bg-white rounded-2xl text-sm" placeholder="Professione" value={profile.job} onChange={e => setProfile({...profile, job: e.target.value})} />
          <input type="number" className="w-full p-4 bg-white rounded-2xl text-sm" placeholder="Reddito Annuo (€)" value={profile.annualIncome} onChange={e => setProfile({...profile, annualIncome: e.target.value})} />
          <button onClick={handleAi} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" /> : <Sparkles className="w-4 h-4" />} Analizza con AI
          </button>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <button onClick={() => setStep(1)} className="text-sm text-slate-500">← Torna indietro</button>
          {recs.map((r, i) => (
             <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="font-bold text-slate-900">{fleet.find(c => c.id === r.carId)?.brand} {fleet.find(c => c.id === r.carId)?.model}</div>
                <div className="text-xs text-slate-500 mt-1 italic">"{r.reasoning}"</div>
             </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 6. Mobile Clients Tab
const MobileClientsTab = ({ currentAgent }: { currentAgent: Agent }) => {
  const { clients } = useApp();
  const [search, setSearch] = useState('');
  const myClients = clients.filter(c => c.subagentId === currentAgent.id);
  const filteredClients = myClients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="h-full overflow-y-auto pb-24 p-5">
      <h3 className="text-xl font-bold text-slate-900 mb-6">Miei Clienti</h3>
      <input type="text" className="w-full p-4 bg-white rounded-2xl shadow-sm mb-6" placeholder="Cerca cliente..." value={search} onChange={e => setSearch(e.target.value)} />
      <div className="space-y-3">
        {filteredClients.map(client => (
          <div key={client.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-700 rounded-xl flex items-center justify-center font-bold">{client.name.charAt(0)}</div>
                <div>
                    <h4 className="text-sm font-bold text-slate-900">{client.name}</h4>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">{client.type}</p>
                </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300" />
          </div>
        ))}
      </div>
    </div>
  );
};

// --- MAIN WRAPPER ---
const AgentMobileApp: React.FC = () => {
  const { fleet, agents, contracts } = useApp();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [agentNickname, setAgentNickname] = useState('');
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'quote' | 'contract' | 'clients' | 'profile'>('home');
  const [carSearch, setCarSearch] = useState('');
  const [viewingCar, setViewingCar] = useState<any | null>(null);
  const [isNormalQuoteActive, setIsNormalQuoteActive] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const agentRef = params.get('agent_ref');
    if (agentRef && !isLoggedIn) {
      const agent = agents.find(a => a.nickname.toLowerCase() === agentRef.toLowerCase());
      if (agent && agent.status === 'Attivo') {
        setCurrentAgent(agent);
        setIsLoggedIn(true);
      }
    }
  }, [agents, isLoggedIn]);

  const handleLogin = () => {
    const agent = agents.find(a => a.nickname.toLowerCase() === agentNickname.toLowerCase());
    if (agent && agent.status === 'Attivo') {
      setCurrentAgent(agent);
      setIsLoggedIn(true);
    } else {
      alert("Agente non trovato o sospeso.");
    }
  };

  const myEarnings = currentAgent ? contracts.filter(c => c.agentId === currentAgent.id).reduce((sum, c) => sum + (c.commissionAmount || 0), 0) : 0;

  if (!isLoggedIn || !currentAgent) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-100 p-4">
        <div className="w-[340px] h-[720px] bg-black rounded-[40px] border-[10px] border-slate-900 shadow-2xl relative flex flex-col items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-black text-white">
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[120px] h-[35px] bg-black rounded-full z-20"></div>
          <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mb-8 shadow-xl"><CarIcon className="w-10 h-10 text-white" /></div>
          <h2 className="text-3xl font-bold mb-10 tracking-tight">RentSync<span className="text-indigo-400">Pro</span></h2>
          <div className="w-full px-8 space-y-4">
            <input type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-center" placeholder="Nickname Agente" value={agentNickname} onChange={e => setAgentNickname(e.target.value)} />
            <button onClick={handleLogin} className="w-full bg-indigo-500 text-white font-bold py-4 rounded-2xl shadow-lg">Accedi</button>
          </div>
        </div>
      </div>
    );
  }

  const isStandalone = new URLSearchParams(window.location.search).get('agent_ref') !== null;

  const content = (
    <>
      {/* Header */}
      <div className="bg-white px-5 py-4 flex justify-between items-center z-10 border-b">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">RentSync<span className="text-indigo-600">Pro</span></h1>
          <p className="text-[10px] text-slate-400 uppercase font-black">Terminale Agente</p>
        </div>
        <div className="w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold">{currentAgent.nickname.charAt(0).toUpperCase()}</div>
      </div>

      <div className="flex-1 bg-[#F2F4F7] overflow-hidden relative">
        {activeTab === 'home' && (
          <div className="h-full overflow-y-auto pb-24 p-5 space-y-5">
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button onClick={() => setShowAddClient(true)} className="flex-shrink-0 bg-slate-900 text-white px-5 py-3 rounded-2xl text-xs font-bold flex items-center gap-1.5"><Plus className="w-4 h-4" /> Cliente</button>
              <button onClick={() => setActiveTab('contract')} className="flex-shrink-0 bg-white text-slate-700 px-5 py-3 rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-sm"><PenTool className="w-4 h-4 text-indigo-600" /> Contratto</button>
            </div>
            
            <div className="flex justify-between items-center px-1">
                <h3 className="font-bold text-slate-800">Disponibili</h3>
                <input type="text" className="text-[10px] px-3 py-1.5 border-none rounded-xl bg-white shadow-sm outline-none w-32" placeholder="Cerca..." value={carSearch} onChange={e => setCarSearch(e.target.value)} />
            </div>

            <div className="space-y-4">
              {fleet.filter(car => car.brand.toLowerCase().includes(carSearch.toLowerCase()) || car.model.toLowerCase().includes(carSearch.toLowerCase())).map(car => (
                <div key={car.id} onClick={() => setViewingCar(car)} className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex flex-col gap-3 cursor-pointer">
                  <div className="relative">
                    <img src={car.image} className="w-full h-32 object-cover rounded-2xl" alt="car" />
                    <div className="absolute top-2 right-2 px-2 py-1 rounded-full text-[10px] font-bold bg-green-500 text-white">{car.status}</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-slate-900 text-sm">{car.brand} {car.model}</h4>
                    <span className="text-sm font-bold text-indigo-600">€{car.pricePerDay}/gg</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'quote' && <MobileQuote />}
        {activeTab === 'contract' && <MobileContract currentAgent={currentAgent} />}
        {activeTab === 'clients' && <MobileClientsTab currentAgent={currentAgent} />}
        {activeTab === 'profile' && (
          <div className="p-6 overflow-y-auto pb-24 h-full space-y-6">
            <div className="bg-white p-8 rounded-[40px] text-center shadow-sm">
                <div className="w-20 h-20 bg-slate-900 text-white rounded-[30px] flex items-center justify-center text-3xl font-black mx-auto mb-4">{currentAgent.nickname.charAt(0).toUpperCase()}</div>
                <h3 className="font-bold text-xl">{currentAgent.name}</h3>
                <p className="text-slate-400 text-xs mt-1">{currentAgent.region}</p>
            </div>
            <div className="bg-indigo-600 p-6 rounded-[30px] text-white text-center">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Earnings</span>
                <h4 className="text-4xl font-black">€ {myEarnings.toLocaleString()}</h4>
            </div>
            <button onClick={() => setIsLoggedIn(false)} className="w-full py-4 text-red-500 bg-white border border-red-50 rounded-2xl font-bold">Disconnetti</button>
          </div>
        )}

        {showAddClient && <MobileAddClient currentAgent={currentAgent} onClose={() => setShowAddClient(false)} />}
        {viewingCar && <MobileVehicleDetails car={viewingCar} onClose={() => setViewingCar(null)} onStartQuote={() => setIsNormalQuoteActive(true)} />}
        {isNormalQuoteActive && viewingCar && <MobileNormalQuote car={viewingCar} currentAgent={currentAgent} onClose={() => { setIsNormalQuoteActive(false); setViewingCar(null); }} />}
      </div>

      {/* Bottom Nav */}
      <div className={`bg-white border-t flex justify-around items-center py-4 pb-8 z-40 ${isStandalone ? '' : 'px-4'}`}>
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-indigo-600' : 'text-slate-400'}`}><Home className="w-6 h-6" /><span className="text-[9px] font-bold">Home</span></button>
        <button onClick={() => setActiveTab('quote')} className={`flex flex-col items-center gap-1 ${activeTab === 'quote' ? 'text-indigo-600' : 'text-slate-400'}`}><Sparkles className="w-6 h-6" /><span className="text-[9px] font-bold">AI</span></button>
        <button onClick={() => setActiveTab('contract')} className={`flex flex-col items-center gap-1 ${activeTab === 'contract' ? 'text-indigo-600' : 'text-slate-400'}`}><PenTool className="w-6 h-6" /><span className="text-[9px] font-bold">Patto</span></button>
        <button onClick={() => setActiveTab('clients')} className={`flex flex-col items-center gap-1 ${activeTab === 'clients' ? 'text-indigo-600' : 'text-slate-400'}`}><Building2 className="w-6 h-6" /><span className="text-[9px] font-bold">Clienti</span></button>
        <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-indigo-600' : 'text-slate-400'}`}><User className="w-6 h-6" /><span className="text-[9px] font-bold">Profilo</span></button>
      </div>
    </>
  );

  if (isStandalone) {
    return <div className="h-screen w-full bg-white flex flex-col font-sans overflow-hidden">{content}</div>;
  }

  return (
    <div className="flex items-center justify-center h-full bg-slate-200 p-4 font-sans scale-95 origin-center">
      <div className="w-[340px] h-[720px] bg-white rounded-[45px] border-[12px] border-[#1e1e1e] shadow-2xl overflow-hidden relative flex flex-col ring-4 ring-slate-300">
        {content}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[130px] h-[5px] bg-black rounded-full z-50"></div>
      </div>
    </div>
  );
};

export default AgentMobileApp;