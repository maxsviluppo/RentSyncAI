import React, { useState, useEffect } from 'react';
import { recommendCar } from '../services/gemini';
import { CarStatus, AIRecommendation, Contract, DriverProfile, Agent } from '../types';
import { useApp } from '../contexts/AppContext';
import { Smartphone, LogIn, User, Car as CarIcon, FileText, Search, Sparkles, ArrowRight, Loader2, Home, Plus, PenTool, CheckCircle, Wifi, DollarSign, Settings2, QrCode, Share2, Copy, X, Camera, Trash, FileCheck, Building2, Phone, Mail, UploadCloud, Fuel, Settings, Calendar, Gauge, Info, Tag, Euro, ChevronRight, Check, Zap } from 'lucide-react';

// --- SUB-COMPONENTS ---

// 1. Contract / Rental Generator
const MobileContract: React.FC<{ currentAgent: Agent, preSelectedCarId?: string | null, onCarSelected?: () => void }> = ({ currentAgent, preSelectedCarId, onCarSelected }) => {
  const { fleet, clients, createContract } = useApp();
  const [step, setStep] = useState(1);
  
  // Selection States
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [selectedCarId, setSelectedCarId] = useState(preSelectedCarId || '');
  const [carSearch, setCarSearch] = useState('');
  
  // Offer Details
  const [dates, setDates] = useState({ start: new Date().toISOString().split('T')[0], duration: 36 });
  const [customAdvance, setCustomAdvance] = useState(0);
  const [customKasko, setCustomKasko] = useState<number | null>(null);
  const [rateAdjustment, setRateAdjustment] = useState(0);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [showClientList, setShowClientList] = useState(false);
  const [showCarList, setShowCarList] = useState(false);
  const [showClientError, setShowClientError] = useState(false);

  const myClients = clients.filter(c => c.subagentId === currentAgent.id);
  const filteredClients = myClients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()));
  const filteredCars = fleet.filter(c => 
    (c.brand + ' ' + c.model + ' ' + c.vehicleCode).toLowerCase().includes(carSearch.toLowerCase())
  );

  // Sync pre-selection
  useEffect(() => {
    if (preSelectedCarId) {
        setSelectedCarId(preSelectedCarId);
        const car = fleet.find(c => c.id === preSelectedCarId);
        if (car) {
            setCarSearch(`${car.brand} ${car.model}`);
            if (car.offers && car.offers.length > 0) setSelectedOffer(car.offers[0]);
        }
    } else {
        setSelectedCarId('');
        setCarSearch('');
        setSelectedOffer(null);
    }
  }, [preSelectedCarId, fleet]);

  const getPricingInfo = () => {
    const car = fleet.find(c => c.id === selectedCarId);
    if (!car && !carSearch) return { monthlyRate: 0, total: 0, rca: 0, kasko: 0, theft: 0, commission: 0 };
    
    // Default offer if not found
    const defaultOffer = { monthlyRate: 450, rca: 250, kasko: 500, theft: 300, duration: 36, kms: 10000 };
    const offer = selectedOffer || (car?.offers && car.offers[0]) || defaultOffer;
    
    const baseRate = offer.monthlyRate || 0;
    const duration = offer.duration || 36;
    const amortizedAdvance = customAdvance > 0 ? Math.round(customAdvance / duration) : 0;
    const kaskoAdj = (customKasko !== null) ? (customKasko - (offer.kasko || 0)) / duration : 0;
    
    const finalMonthly = Math.max(0, baseRate - amortizedAdvance + (rateAdjustment || 0) + kaskoAdj);
    
    return { 
        monthlyRate: Math.round(finalMonthly), 
        total: Math.round(finalMonthly * duration),
        commission: Math.round(finalMonthly * duration * (currentAgent.commissionRate / 100)),
        rca: offer.rca || 0,
        kasko: customKasko !== null ? customKasko : (offer.kasko || 0),
        theft: offer.theft || 0
    };
  };

  const pricing = getPricingInfo();

  const handleCreate = () => {
    if (!selectedClientId) {
        setShowClientError(true);
        return;
    }
    if (!selectedCarId && !carSearch) {
        alert("Seleziona un veicolo");
        return;
    }
    setStep(2);
  };

  const handleConfirm = () => {
    try {
        const newContract: Contract = {
          id: `PREV-${Date.now()}`,
          agentId: currentAgent.id,
          clientId: selectedClientId,
          carId: selectedCarId || 'MANUAL',
          startDate: dates.start,
          endDate: '', 
          totalAmount: pricing.total || 0,
          commissionAmount: pricing.commission || 0,
          status: 'In Attesa',
          signedDate: new Date().toISOString()
        };
        createContract(newContract);
        setStep(3);
        if (onCarSelected) onCarSelected();
    } catch (err) {
        console.error("Error confirming contract:", err);
        alert("Si è verificato un errore durante il salvataggio.");
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#F8FAFC]">
        {/* Error Modal */}
        {showClientError && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-white rounded-[40px] p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-300 text-center space-y-6">
                    <div className="w-20 h-20 bg-amber-50 rounded-[30px] flex items-center justify-center mx-auto">
                        <Info className="w-10 h-10 text-amber-500" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 uppercase italic">Cliente non selezionato</h3>
                        <p className="text-slate-400 font-bold text-sm mt-2">Per procedere devi selezionare un cliente esistente dal database. Se il cliente è nuovo, registralo prima nell'apposita sezione.</p>
                    </div>
                    <button 
                        onClick={() => setShowClientError(false)}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs"
                    >
                        Ho capito
                    </button>
                </div>
            </div>
        )}
      {/* Step Header */}
      <div className="bg-white px-6 py-5 flex justify-center items-center border-b relative">
         <div className="flex items-center gap-3">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black transition-all ${step >= 1 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-100 text-slate-400'}`}>1</div>
            <div className={`w-10 h-0.5 ${step >= 2 ? 'bg-indigo-600' : 'bg-slate-100'}`}></div>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black transition-all ${step >= 2 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-100 text-slate-400'}`}>2</div>
            <div className={`w-10 h-0.5 ${step >= 3 ? 'bg-indigo-600' : 'bg-slate-100'}`}></div>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black transition-all ${step >= 3 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-100 text-slate-400'}`}>3</div>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pb-32 space-y-6">
        {step === 1 && (
          <>
            {/* Sezione Cliente */}
            <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                    <User className="w-4 h-4 text-indigo-500" /> Cliente
                </label>
                <div className="relative group">
                    <Search className="absolute left-4 top-4 w-4 h-4 text-slate-300" />
                    <input 
                        type="text" 
                        placeholder="Cerca cliente o scrivi nome..." 
                        className="w-full p-4 pl-12 pr-10 bg-white rounded-2xl shadow-sm border border-slate-100 outline-none font-bold text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        value={clientSearch}
                        onFocus={() => setShowClientList(true)}
                        onChange={e => {
                            setClientSearch(e.target.value);
                            setShowClientList(true);
                            const found = myClients.find(c => c.name.toLowerCase() === e.target.value.toLowerCase());
                            if (found) setSelectedClientId(found.id);
                            else setSelectedClientId('');
                        }}
                    />
                    <ChevronRight 
                        className={`absolute right-4 top-5 w-4 h-4 text-slate-300 transition-transform cursor-pointer ${showClientList ? '-rotate-90' : 'rotate-90'}`} 
                        onClick={() => setShowClientList(!showClientList)}
                    />
                    {showClientList && (clientSearch || showClientList) && (clientSearch ? filteredClients : myClients).length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 max-h-40 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                            {(clientSearch ? filteredClients : myClients).map(c => (
                                <div key={c.id} onClick={() => { setSelectedClientId(c.id); setClientSearch(c.name); setShowClientList(false); }} className="p-4 hover:bg-slate-50 cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-none">
                                    <span className="font-bold text-sm text-slate-700">{c.name}</span>
                                    <span className="text-[9px] font-black text-indigo-500 uppercase">{c.type}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Sezione Veicolo */}
            <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                    <CarIcon className="w-4 h-4 text-indigo-500" /> Veicolo
                </label>
                <div className="relative">
                    <Search className="absolute left-4 top-4 w-4 h-4 text-slate-300" />
                    <input 
                        type="text" 
                        placeholder="Cerca marca, modello o codice..." 
                        className="w-full p-4 pl-12 pr-10 bg-white rounded-2xl shadow-sm border border-slate-100 outline-none font-bold text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        value={carSearch}
                        onFocus={() => setShowCarList(true)}
                        onChange={e => {
                            setCarSearch(e.target.value);
                            setShowCarList(true);
                            const found = fleet.find(c => (c.brand + ' ' + c.model).toLowerCase() === e.target.value.toLowerCase() || c.vehicleCode.toLowerCase() === e.target.value.toLowerCase());
                            if (found) {
                                setSelectedCarId(found.id);
                                if (found.offers && found.offers.length > 0) setSelectedOffer(found.offers[0]);
                            } else {
                                setSelectedCarId('');
                            }
                        }}
                    />
                    <ChevronRight 
                        className={`absolute right-4 top-5 w-4 h-4 text-slate-300 transition-transform cursor-pointer ${showCarList ? '-rotate-90' : 'rotate-90'}`} 
                        onClick={() => setShowCarList(!showCarList)}
                    />
                    {showCarList && (carSearch || showCarList) && (carSearch ? filteredCars : fleet).length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                            {(carSearch ? filteredCars : fleet).map(c => (
                                <div key={c.id} onClick={() => { setSelectedCarId(c.id); setCarSearch(`${c.brand} ${c.model}`); if (c.offers && c.offers.length > 0) setSelectedOffer(c.offers[0]); setShowCarList(false); }} className="p-4 hover:bg-slate-50 cursor-pointer flex gap-4 items-center border-b border-slate-50 last:border-none">
                                    <img src={c.image} className="w-12 h-8 object-cover rounded-lg bg-slate-100" alt="car" />
                                    <div className="flex-1">
                                        <p className="font-bold text-sm text-slate-800">{c.brand} {c.model}</p>
                                        <p className="text-[9px] text-slate-400 font-black uppercase">Cod: {c.vehicleCode}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-300" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Parametri Commerciali */}
            {carSearch && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 space-y-6">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Opzioni Noleggio</h4>
                            <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg">PROPOSTA LIVE</span>
                        </div>

                        {/* Scelta Offerta / Canone */}
                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block ml-1">Seleziona Canone (Mesi/Km)</label>
                            <div className="grid grid-cols-1 gap-2">
                                {(fleet.find(c => c.id === selectedCarId)?.offers || []).slice(0, 4).map((off: any, i: number) => (
                                    <button 
                                        key={i} 
                                        onClick={() => setSelectedOffer(off)}
                                        className={`flex justify-between items-center p-4 rounded-2xl border-2 transition-all ${selectedOffer === off ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-50 bg-slate-50/50'}`}
                                    >
                                        <div className="text-left">
                                            <span className={`text-[10px] font-black uppercase ${selectedOffer === off ? 'text-indigo-600' : 'text-slate-400'}`}>{off.duration} Mesi</span>
                                            <p className="text-xs font-bold text-slate-900">{off.kms.toLocaleString()} Km/Anno</p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-sm font-black ${selectedOffer === off ? 'text-indigo-600' : 'text-slate-700'}`}>€ {off.monthlyRate}</p>
                                            <span className="text-[8px] font-bold text-slate-400 uppercase">+ IVA</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Regolazioni Manuali */}
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                             <div className="space-y-1.5">
                                <span className="text-[9px] font-black text-slate-400 uppercase block ml-1">Anticipo (€)</span>
                                <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl font-black text-sm outline-none shadow-inner" value={customAdvance || ''} onChange={e => setCustomAdvance(Number(e.target.value))} />
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <span className="text-[9px] font-black text-slate-400 uppercase block ml-1">Kasko (€)</span>
                                    <input type="number" className="w-full p-3 bg-slate-50 rounded-xl font-bold text-sm outline-none shadow-inner" placeholder={selectedOffer?.kasko?.toString()} value={customKasko || ''} onChange={e => setCustomKasko(Number(e.target.value))} />
                                </div>
                                <div className="space-y-1.5">
                                    <span className="text-[9px] font-black text-slate-400 uppercase block ml-1">Adj. Canone (+/- €)</span>
                                    <input type="number" className="w-full p-3 bg-slate-50 rounded-xl font-bold text-sm outline-none shadow-inner text-indigo-600" value={rateAdjustment || ''} onChange={e => setRateAdjustment(Number(e.target.value))} />
                                </div>
                             </div>
                        </div>
                    </div>

                    {/* Riepilogo Real-time */}
                    <div className="bg-slate-900 rounded-[32px] p-6 text-white shadow-2xl shadow-indigo-100 flex justify-between items-center">
                        <div>
                            <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">Canone Mensile</span>
                            <h4 className="text-3xl font-black italic">€ {pricing.monthlyRate.toLocaleString()}</h4>
                            <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">IVA Esclusa / {selectedOffer?.duration || 36} Mesi</p>
                        </div>
                        <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10">
                            <Zap className="w-6 h-6 text-indigo-400" />
                        </div>
                    </div>
                    
                    <div className="flex justify-center pt-4">
                        <button 
                            onClick={handleCreate} 
                            className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg active:scale-95 transition-all"
                        >
                            Prossimo
                        </button>
                    </div>
                </div>
            )}
          </>
        )}

        {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
                <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
                    
                    <div className="text-center -mt-6 mb-2">
                        <h2 className="text-2xl font-black text-indigo-600 uppercase italic tracking-tighter">Preventivo Offerta</h2>
                    </div>

                    <div className="space-y-5">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400"><User className="w-5 h-5" /></div>
                            <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase">Cliente</p>
                                <p className="text-sm font-black text-slate-900">{clientSearch}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400"><CarIcon className="w-5 h-5" /></div>
                            <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase">Veicolo</p>
                                <p className="text-sm font-black text-slate-900">{carSearch}</p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 space-y-4">
                            <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Durata Contrattuale</p>
                                <p className="font-black text-slate-900 text-sm">{selectedOffer?.duration || 36} Mesi</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Percorrenza Inclusa</p>
                                <p className="font-black text-slate-900 text-sm">{selectedOffer?.kms?.toLocaleString()} Km/anno</p>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-slate-100">
                             <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Canone Base</p>
                                <p className="text-sm font-bold text-slate-600">€ {selectedOffer?.monthlyRate}</p>
                             </div>
                             <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Anticipo Ammortizzato</p>
                                <p className="text-sm font-bold text-red-500">- € {customAdvance > 0 ? Math.round(customAdvance / (selectedOffer?.duration || 36)) : 0}</p>
                             </div>
                             <div className="pt-4 border-t border-slate-200">
                                <p className="text-[9px] font-black text-indigo-400 uppercase mb-0.5">Canone Finale</p>
                                <p className="text-2xl font-black text-indigo-600 italic">€ {pricing.monthlyRate} <span className="text-[10px] uppercase font-bold text-slate-400 not-italic">+ IVA</span></p>
                             </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => setStep(1)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl text-[11px] font-black uppercase tracking-widest">Modifica</button>
                        <button onClick={handleConfirm} className="flex-[1.5] py-4 bg-slate-900 text-white rounded-2xl text-[13px] font-black uppercase tracking-widest shadow-xl">Conferma e Invia</button>
                    </div>
                </div>
            </div>
        )}

        {step === 3 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-12 animate-in zoom-in duration-500">
                <div className="w-24 h-24 bg-emerald-100 rounded-[40px] flex items-center justify-center shadow-lg shadow-emerald-100">
                    <Check className="w-12 h-12 text-emerald-600" />
                </div>
                <div>
                    <h3 className="text-3xl font-black text-slate-900 italic">Perfetto!</h3>
                    <p className="text-slate-400 font-bold mt-2">Il preventivo è stato registrato correttamente.</p>
                </div>
                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 w-full max-w-xs">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Prossimi Passaggi</p>
                     <div className="space-y-4">
                         <button className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black flex items-center justify-center gap-2">
                            <Share2 className="w-4 h-4" /> Condividi Link
                         </button>
                         <button className="w-full py-3 bg-slate-50 text-slate-600 rounded-xl text-xs font-black flex items-center justify-center gap-2">
                            <Printer className="w-4 h-4" /> Genera PDF
                         </button>
                     </div>
                </div>
                <button onClick={() => { setStep(1); setSelectedCarId(''); setCarSearch(''); setClientSearch(''); setSelectedClientId(''); }} className="text-indigo-600 font-black text-sm hover:underline pt-4">Crea un altro preventivo</button>
            </div>
        )}
      </div>
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

  const ITALIAN_PROVINCES = [
    'AG','AL','AN','AO','AR','AP','AT','AV','BA','BT','BL','BN','BG','BI','BO','BZ','BS','BR','CA','CL','CB','CE','CZ','CH','CO','CS','CR','KR','CN','EN','FM','FE','FI','FG','FC','GE','GO','GR','IM','IS','SP','LT','LE','LC','LI','LO','LU','MC','MN','MS','MT','ME','MI','MO','MB','NA','NO','NU','OR','PD','PA','PR','PV','PG','PU','PE','PC','PI','PT','PN','PZ','PO','RG','RA','RC','RE','RI','RN','RM','RO','SA','SS','SV','SI','SR','SO','TA','TE','TR','TO','TP','TN','TV','TS','UD','VA','VE','VB','VC','VR','VV','VI','VT'
  ].sort();

  const MAJOR_CITIES = [
    'Roma', 'Milano', 'Napoli', 'Torino', 'Palermo', 'Genova', 'Bologna', 'Firenze', 'Bari', 'Catania', 'Venezia', 'Verona', 'Messina', 'Padova', 'Trieste', 'Taranto', 'Brescia', 'Parma', 'Prato', 'Modena', 'Reggio Calabria', 'Reggio Emilia', 'Perugia', 'Ravenna', 'Livorno', 'Cagliari', 'Foggia', 'Rimini', 'Salerno', 'Ferrara', 'Sassari', 'Latina', 'Giugliano in Campania', 'Monza', 'Siracusa', 'Pescara', 'Bergamo', 'Forlì', 'Trento', 'Vicenza', 'Terni', 'Bolzano', 'Novara', 'Piacenza', 'Ancona', 'Andria', 'Arezzo', 'Udine', 'Cesena', 'Lecce'
  ].sort();

  return (
    <div className="absolute inset-0 bg-white z-[70] p-5 overflow-y-auto animate-in slide-in-from-bottom pb-32">
      <div className="flex justify-between items-center mb-6 pt-4">
        <h3 className="text-xl font-bold">Nuovo Cliente</h3>
        <button onClick={onClose} className="p-2 bg-slate-100 rounded-full"><X className="w-4 h-4" /></button>
      </div>

      <div className="space-y-4">
        <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button onClick={() => setFormData({...formData, type: 'Privato'})} className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${formData.type === 'Privato' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Privato</button>
            <button onClick={() => setFormData({...formData, type: 'Azienda'})} className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${formData.type === 'Azienda' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Azienda</button>
        </div>

        <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Anagrafica</label>
            <input type="text" placeholder="Nome Completo / Ragione Sociale" className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-base font-medium" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            
            <div className="grid grid-cols-2 gap-3">
                <input type="email" placeholder="Email" className="p-4 bg-slate-50 rounded-2xl outline-none text-base font-medium" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                <input type="tel" placeholder="Cellulare" className="p-4 bg-slate-50 rounded-2xl outline-none text-base font-medium" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>

            {formData.type === 'Privato' ? (
                <input type="text" placeholder="Codice Fiscale" className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-base uppercase font-mono font-medium" value={formData.fiscalCode} onChange={e => setFormData({...formData, fiscalCode: e.target.value})} />
            ) : (
                <input type="text" placeholder="Partita IVA" className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-base font-mono font-medium" value={formData.vatNumber} onChange={e => setFormData({...formData, vatNumber: e.target.value})} />
            )}
        </div>

        <div className="space-y-3 pt-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Sede / Residenza</label>
            <input type="text" placeholder="Indirizzo e Civico" className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-base font-medium" value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} />
            
            <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                    <select className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-base font-medium appearance-none" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})}>
                        <option value="">Città...</option>
                        {MAJOR_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                    </select>
                </div>
                <input type="text" placeholder="CAP" className="p-4 bg-slate-50 rounded-2xl outline-none text-base font-medium" value={formData.zip} onChange={e => setFormData({...formData, zip: e.target.value})} />
            </div>
            
            <input type="text" placeholder="Provincia" className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-base font-medium uppercase" value={formData.province} onChange={e => setFormData({...formData, province: e.target.value})} />
        </div>

        <div className="space-y-3 pt-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Altre Informazioni</label>
            <textarea placeholder="Note aggiuntive..." rows={3} className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-base resize-none" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
        </div>

        <div className="flex gap-3 pt-4">
          <button onClick={onClose} className="flex-1 py-4 bg-slate-100 rounded-2xl font-bold text-slate-600 text-sm">Annulla</button>
          <button onClick={handleSave} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-100">Salva Cliente</button>
        </div>
      </div>
    </div>
  );
};

// 3. Vehicle Details Mobile
const MobileVehicleDetails = ({ car, onClose, onStartQuote }: { car: any, onClose: () => void, onStartQuote: () => void }) => {
    return (
      <div className="absolute inset-0 bg-white z-50 overflow-y-auto animate-in slide-in-from-bottom pb-20">
        <div className="relative">
          <img src={car.image} className="w-full h-72 object-cover" alt="car" />
          <button onClick={onClose} className="absolute top-10 left-5 p-2 bg-black/40 backdrop-blur-md rounded-full text-white">
            <X className="w-5 h-5" />
          </button>
          <div className="absolute top-10 right-5 px-4 py-2 bg-indigo-600 backdrop-blur-md rounded-full text-white text-[10px] font-black uppercase tracking-widest shadow-lg">
            {car.status}
          </div>
        </div>
        
        <div className="p-6 -mt-10 bg-white rounded-t-[40px] relative shadow-[0_-20px_40px_rgba(0,0,0,0.1)]">
          <div className="flex flex-col mb-8">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">{car.brand} {car.model}</h2>
            <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Cod. {car.vehicleCode}</span>
                <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                <span className="text-xs font-bold text-indigo-500 uppercase tracking-tighter">Targa: {car.plate || 'In arrivo'}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm"><Fuel className="w-5 h-5 text-indigo-500" /></div>
              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Motore</span>
                <span className="text-xs font-black text-slate-900">{car.fuelType}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm"><Settings className="w-5 h-5 text-indigo-500" /></div>
              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Cambio</span>
                <span className="text-xs font-black text-slate-900">{car.transmission}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm"><Calendar className="w-5 h-5 text-indigo-500" /></div>
              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Anno</span>
                <span className="text-xs font-black text-slate-900">{car.year || '2024'}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm"><Gauge className="w-5 h-5 text-indigo-500" /></div>
              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Stato</span>
                <span className="text-xs font-black text-slate-900">Nuovo</span>
              </div>
            </div>
          </div>

          <div className="space-y-8">
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 pl-1">
                    <Info className="w-4 h-4 text-indigo-500" /> Caratteristiche
                </h4>
                <div className="bg-slate-50 rounded-[32px] p-6 space-y-6 border border-slate-100/50">
                    <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1 tracking-widest">Colore Esterno</span>
                        <span className="text-sm font-black text-slate-900 leading-tight">{car.externalColor || 'N.D.'}</span>
                    </div>
                    <div className="pt-4 border-t border-slate-200/40">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1 tracking-widest">Finiture Interni</span>
                        <span className="text-sm font-black text-slate-900 leading-tight">{car.internalColor || 'N.D.'}</span>
                    </div>
                    <div className="pt-4 border-t border-slate-200/40">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1 tracking-widest">Disponibilità Veicolo</span>
                        <span className="text-sm font-black text-emerald-600">{car.expectedDelivery || 'Pronta Consegna'}</span>
                    </div>
                </div>
              </div>

              {car.optional && (
                <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 pl-1">
                        <Tag className="w-4 h-4 text-indigo-500" /> Equipaggiamento
                    </h4>
                    <div className="bg-indigo-50/30 rounded-[32px] p-6 border border-indigo-100/30">
                        <p className="text-xs font-medium text-slate-600 leading-relaxed italic">
                            {car.optional}
                        </p>
                    </div>
                </div>
              )}

              {car.offers && car.offers.length > 0 && (
                <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 pl-1">
                        <Euro className="w-4 h-4 text-indigo-500" /> Canoni Indicativi
                    </h4>
                    <div className="space-y-2">
                        {car.offers.slice(0, 6).map((off: any, i: number) => (
                            <details key={i} className="group bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm transition-all">
                                <summary className="flex justify-between items-center p-4 cursor-pointer list-none outline-none">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                                            <Calendar className="w-4 h-4 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-900">{off.duration} Mesi</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">{off.kms.toLocaleString()} Km / Anno</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="text-sm font-black text-indigo-600">€ {off.monthlyRate}</p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-300 group-open:rotate-90 transition-transform" />
                                    </div>
                                </summary>
                                <div className="px-4 pb-5 pt-2 border-t border-slate-50 grid grid-cols-2 gap-x-6 gap-y-4 bg-slate-50/50">
                                    <div>
                                        <span className="text-[8px] font-bold text-slate-400 uppercase block mb-0.5">Anticipo</span>
                                        <span className="text-xs font-black text-slate-700">€ {off.advance || 0}</span>
                                    </div>
                                    <div>
                                        <span className="text-[8px] font-bold text-slate-400 uppercase block mb-0.5">Assic. Kasko</span>
                                        <span className="text-xs font-black text-slate-700">€ {off.kasko || 0}</span>
                                    </div>
                                    <div className="pt-2 border-t border-slate-200/40">
                                        <span className="text-[8px] font-bold text-slate-400 uppercase block mb-0.5">Furto e Incendio</span>
                                        <span className="text-xs font-black text-slate-700">€ {off.theft || 0}</span>
                                    </div>
                                    <div className="pt-2 border-t border-slate-200/40">
                                        <span className="text-[8px] font-bold text-slate-400 uppercase block mb-0.5">RCA Base</span>
                                        <span className="text-xs font-black text-slate-700">€ {off.rca || 0}</span>
                                    </div>
                                    <div className="col-span-2 bg-indigo-600 p-3 rounded-xl text-center mt-2 shadow-lg shadow-indigo-100">
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Offerta Tutto Incluso</span>
                                    </div>
                                </div>
                            </details>
                        ))}
                    </div>
                </div>
              )}
          </div>
          
          <div className="flex justify-center pt-10 pb-8">
            <button 
                onClick={onStartQuote} 
                className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl active:scale-95 transition-all"
            >
                Preventivatore
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
  const [preSelectedCarId, setPreSelectedCarId] = useState<string | null>(null);

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
      {/* Top Navigation Bar */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md px-6 py-5 flex justify-between items-center z-50 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
            <CarIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tighter leading-none">RentSync<span className="text-indigo-600">Pro</span></h1>
            <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-1">Terminal {currentAgent.nickname}</p>
          </div>
        </div>
        <button 
          onClick={() => setActiveTab('profile')} 
          className="w-10 h-10 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-900 font-black shadow-sm active:scale-95 transition-all"
        >
            {currentAgent.nickname.charAt(0).toUpperCase()}
        </button>
      </div>

      <div className="flex-1 bg-[#F2F4F7] overflow-hidden relative">
        {activeTab === 'home' && (
          <div className="h-full overflow-y-auto pb-24 p-5 space-y-5">
            <div className="flex gap-3">
              <button 
                onClick={() => setShowAddClient(true)} 
                className="flex-1 bg-slate-900 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
              >
                <Plus className="w-5 h-5" />
                <span className="text-[11px] uppercase tracking-wider">Nuovo Cliente</span>
              </button>
              <button 
                onClick={() => setActiveTab('contract')} 
                className="flex-1 bg-white text-slate-800 p-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-sm border border-slate-100 active:scale-95 transition-all"
              >
                <PenTool className="w-5 h-5 text-indigo-600" />
                <span className="text-[11px] uppercase tracking-wider">Nuovo Preventivo</span>
              </button>
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
        {activeTab === 'contract' && <MobileContract currentAgent={currentAgent} preSelectedCarId={preSelectedCarId} onCarSelected={() => setPreSelectedCarId(null)} />}
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
        {viewingCar && <MobileVehicleDetails car={viewingCar} onClose={() => setViewingCar(null)} onStartQuote={() => { setPreSelectedCarId(viewingCar.id); setActiveTab('contract'); setViewingCar(null); }} />}
        {isNormalQuoteActive && viewingCar && <MobileNormalQuote car={viewingCar} currentAgent={currentAgent} onClose={() => { setIsNormalQuoteActive(false); setViewingCar(null); }} />}
      </div>

      {/* Floating Island Bottom Nav */}
      <div className={`${isStandalone ? 'fixed' : 'absolute'} bottom-8 left-6 right-6 bg-slate-900/95 backdrop-blur-xl flex justify-around items-center py-4 rounded-[32px] z-[100] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10`}>
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'home' ? 'text-indigo-400 scale-110' : 'text-slate-400 hover:text-slate-200'}`}>
          <Home className="w-6 h-6" />
          <span className="text-[8px] font-black uppercase tracking-tighter">Home</span>
        </button>
        <button onClick={() => { setActiveTab('contract'); setPreSelectedCarId(null); }} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'contract' ? 'text-indigo-400 scale-110' : 'text-slate-400 hover:text-slate-200'}`}>
          <PenTool className="w-6 h-6" />
          <span className="text-[8px] font-black uppercase tracking-tighter">Preventivo</span>
        </button>
        <button onClick={() => setActiveTab('clients')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'clients' ? 'text-indigo-400 scale-110' : 'text-slate-400 hover:text-slate-200'}`}>
          <Building2 className="w-6 h-6" />
          <span className="text-[8px] font-black uppercase tracking-tighter">Clienti</span>
        </button>
        <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'profile' ? 'text-indigo-400 scale-110' : 'text-slate-400 hover:text-slate-200'}`}>
          <User className="w-6 h-6" />
          <span className="text-[8px] font-black uppercase tracking-tighter">Profilo</span>
        </button>
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