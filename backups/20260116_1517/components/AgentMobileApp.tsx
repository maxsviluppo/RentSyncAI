import React, { useState, useEffect } from 'react';
import { recommendCar } from '../services/gemini';
import { CarStatus, AIRecommendation, Contract, DriverProfile, Agent } from '../types';
import { useApp } from '../contexts/AppContext';
import { Smartphone, LogIn, User, Car as CarIcon, FileText, Search, Sparkles, ArrowRight, Loader2, Home, Plus, PenTool, CheckCircle, Wifi, DollarSign, Settings2, QrCode, Share2, Copy } from 'lucide-react';

// --- SUB-COMPONENTS EXTRACTED ---

// 1. Contract / Rental Generator
const MobileContract: React.FC<{ currentAgent: Agent }> = ({ currentAgent }) => {
  const { fleet, clients, createContract } = useApp();
  const [step, setStep] = useState(1);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedCarId, setSelectedCarId] = useState('');
  const [dates, setDates] = useState({ start: '', end: '' });

  const handleCreateContract = () => {
    if (!selectedClientId || !selectedCarId || !dates.start || !dates.end) return;

    const car = fleet.find(c => c.id === selectedCarId);
    const days = Math.ceil((new Date(dates.end).getTime() - new Date(dates.start).getTime()) / (1000 * 3600 * 24));
    const total = (car?.pricePerDay || 0) * days;

    const newContract: Contract = {
      id: `CNT-${Date.now()}`,
      agentId: currentAgent.id,
      clientId: selectedClientId,
      carId: selectedCarId,
      startDate: dates.start,
      endDate: dates.end,
      totalAmount: total,
      commissionAmount: 0, // Calculated in AppContext
      status: 'Attivo',
      signedDate: new Date().toISOString()
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
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">1. Seleziona Cliente</label>
            <select className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none text-sm" value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)}>
              <option value="">-- Cliente --</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">2. Seleziona Auto</label>
            <select className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none text-sm" value={selectedCarId} onChange={e => setSelectedCarId(e.target.value)}>
              <option value="">-- Veicolo Disponibile --</option>
              {fleet.filter(c => c.status === CarStatus.AVAILABLE).map(c => (
                <option key={c.id} value={c.id}>{c.brand} {c.model} - €{c.pricePerDay}/gg</option>
              ))}
            </select>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">3. Date Noleggio</label>
            <div className="grid grid-cols-2 gap-3">
              <input type="date" className="p-3 bg-slate-50 rounded-xl text-xs" value={dates.start} onChange={e => setDates({ ...dates, start: e.target.value })} />
              <input type="date" className="p-3 bg-slate-50 rounded-xl text-xs" value={dates.end} onChange={e => setDates({ ...dates, end: e.target.value })} />
            </div>
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
            <p><span className="font-bold text-slate-900">Auto:</span> {fleet.find(c => c.id === selectedCarId)?.brand} {fleet.find(c => c.id === selectedCarId)?.model}</p>
            <p><span className="font-bold text-slate-900">Periodo:</span> {dates.start} / {dates.end}</p>
            <div className="bg-indigo-50 p-3 rounded-lg text-indigo-900 font-bold text-center text-lg mt-4">
              Totale: € {
                (fleet.find(c => c.id === selectedCarId)?.pricePerDay || 0) *
                Math.ceil((new Date(dates.end).getTime() - new Date(dates.start).getTime()) / (1000 * 3600 * 24))
              }
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
const MobileAddClient = ({ onClose }: { onClose: () => void }) => {
  const { addClient } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleSave = () => {
    if (!name) return;
    addClient({
      id: Date.now().toString(),
      name, email, phone, type: 'Privato', status: 'Attivo', riskScore: 50
    });
    alert("Cliente sincronizzato con la Dashboard!");
    onClose();
  };

  return (
    <div className="absolute inset-0 bg-white z-50 p-5 pt-12 animate-in slide-in-from-bottom">
      <h3 className="text-xl font-bold mb-6">Nuovo Cliente</h3>
      <div className="space-y-4">
        <input type="text" placeholder="Nome Cognome" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={name} onChange={e => setName(e.target.value)} />
        <input type="email" placeholder="Email" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={email} onChange={e => setEmail(e.target.value)} />
        <input type="tel" placeholder="Telefono" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={phone} onChange={e => setPhone(e.target.value)} />

        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-4 bg-slate-100 rounded-2xl font-bold text-slate-600">Annulla</button>
          <button onClick={handleSave} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold">Salva</button>
        </div>
      </div>
    </div>
  );
};

// 3. Smart Quote Mobile (Enhanced)
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
                <div className="flex gap-4">
                  <img src={c.image} className="w-24 h-16 object-cover rounded-xl bg-slate-200" alt="car" />
                  <div>
                    <div className="font-bold text-slate-900 leading-tight">{c.brand} {c.model}</div>
                    <div className="text-xs text-green-600 font-bold mt-1 bg-green-50 inline-block px-2 py-0.5 rounded-full">{r.matchScore}% Match</div>
                    <div className="text-sm text-slate-500 mt-1 font-medium">€{r.suggestedMonthlyRate}/mese</div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl italic leading-relaxed border border-slate-100">
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

// --- MAIN COMPONENT ---
const AgentMobileApp: React.FC = () => {
  const { fleet, agents, contracts } = useApp();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [agentNickname, setAgentNickname] = useState('');
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'quote' | 'contract' | 'profile'>('home');
  const [error, setError] = useState('');
  const [showAddClient, setShowAddClient] = useState(false);

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
      <div className="flex items-center justify-center h-full bg-slate-100 p-8">
        <div className="w-[390px] h-[844px] bg-black rounded-[50px] border-[12px] border-slate-900 shadow-2xl overflow-hidden relative flex flex-col items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-black text-white">
          {/* Dynamic Island */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[120px] h-[35px] bg-black rounded-full z-20"></div>

          <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md mb-8 shadow-inner ring-1 ring-white/20">
            <Smartphone className="w-10 h-10 text-white" />
          </div>

          <h2 className="text-3xl font-bold mb-2 tracking-tight">Agent<span className="text-indigo-400">Pro</span></h2>
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
    <div className="flex items-center justify-center h-full bg-slate-200 p-8 font-sans">
      {/* Realistic Phone Frame */}
      <div className="w-[393px] h-[852px] bg-white rounded-[55px] border-[14px] border-[#1e1e1e] shadow-2xl overflow-hidden relative flex flex-col ring-4 ring-slate-300">

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
        <div className="bg-white px-5 pb-4 flex justify-between items-center z-10 sticky top-0">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Agent<span className="text-indigo-600">Pro</span></h1>
            <p className="text-xs text-slate-400">Ciao, {currentAgent.name.split(' ')[0]}</p>
          </div>
          <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-700 font-bold">
            {currentAgent.nickname.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Screen Content */}
        <div className="flex-1 bg-[#F2F4F7] overflow-hidden relative rounded-t-[30px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">

          {/* --- TAB: HOME / FLEET --- */}
          {activeTab === 'home' && (
            <div className="h-full overflow-y-auto pb-24 p-5 space-y-5">

              {/* Quick Actions */}
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                <button onClick={() => setShowAddClient(true)} className="flex-shrink-0 bg-slate-900 text-white px-5 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-slate-900/20">
                  <Plus className="w-4 h-4" /> Nuovo Cliente
                </button>
                <button onClick={() => setActiveTab('contract')} className="flex-shrink-0 bg-white text-slate-700 px-5 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-sm border border-slate-100">
                  <PenTool className="w-4 h-4 text-indigo-600" /> Contratto
                </button>
              </div>

              {/* Fleet Feed */}
              <h3 className="font-bold text-slate-800 text-lg px-1">Disponibili Ora</h3>
              {fleet.map(car => (
                <div key={car.id} className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex flex-col gap-3">
                  <div className="relative">
                    <img src={car.image} className="w-full h-32 object-cover rounded-2xl" alt="car" />
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-[10px] font-bold backdrop-blur-md ${car.status === CarStatus.AVAILABLE ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'}`}>
                      {car.status}
                    </div>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg leading-tight">{car.brand} {car.model}</h4>
                      <p className="text-xs text-slate-500 mt-1">{car.category} • {car.plate}</p>
                    </div>
                    <span className="text-lg font-bold text-indigo-600">€{car.pricePerDay}<span className="text-xs text-slate-400 font-normal">/gg</span></span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* --- TAB: QUOTE --- */}
          {activeTab === 'quote' && <MobileQuote />}

          {/* --- TAB: CONTRACT --- */}
          {activeTab === 'contract' && <MobileContract currentAgent={currentAgent} />}

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
          {showAddClient && <MobileAddClient onClose={() => setShowAddClient(false)} />}
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