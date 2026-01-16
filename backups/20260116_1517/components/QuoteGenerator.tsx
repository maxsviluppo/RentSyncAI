import React, { useState } from 'react';
import { generateQuoteDetails, recommendCar } from '../services/gemini';
import { Car, Client, DriverProfile, AIRecommendation } from '../types';
import { useApp } from '../contexts/AppContext';
import { FileText, Wand2, Loader2, User, Calendar, Check, Search, Car as CarIcon, Printer, Plus, Sparkles, BrainCircuit, ArrowRight, ShieldCheck, Zap, Briefcase, Settings2, SlidersHorizontal, Map, Share2 } from 'lucide-react';

const QuoteGenerator: React.FC = () => {
  const { fleet, clients, companySettings } = useApp(); // Use Context Data
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'manual' | 'ai'>('manual');

  // Form State
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [newClientName, setNewClientName] = useState('');
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [discount, setDiscount] = useState(0);
  const [aiDescription, setAiDescription] = useState('');
  const [customClientMode, setCustomClientMode] = useState(false);

  // Smart Advisor State (Enhanced)
  const [driverProfile, setDriverProfile] = useState<DriverProfile>({
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
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);

  // Computed
  const days = startDate && endDate
    ? Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 1;

  const baseTotal = selectedCar ? selectedCar.pricePerDay * days : 0;
  const finalTotal = Math.max(0, baseTotal - discount);
  const vat = finalTotal * 0.22;
  const grandTotal = finalTotal + vat;

  const handleGenerateAI = async () => {
    if (!selectedCar) return;
    setLoading(true);
    try {
      const clientType = selectedClient?.type || "Nuovo Cliente";
      const desc = await generateQuoteDetails(`${selectedCar.brand} ${selectedCar.model}`, days, clientType);
      setAiDescription(desc);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRecommendation = async () => {
    if (!driverProfile.job || !driverProfile.annualIncome) return;
    setLoading(true);
    try {
      const recs = await recommendCar(fleet, driverProfile);
      setRecommendations(recs);
    } catch (e) {
      console.error(e);
      alert("Errore nell'analisi AI");
    } finally {
      setLoading(false);
    }
  };

  const selectRecommendation = (rec: AIRecommendation) => {
    const car = fleet.find(c => c.id === rec.carId);
    if (car) {
      setSelectedCar(car);
      setAiDescription(rec.reasoning);
      const today = new Date();
      const future = new Date();
      future.setMonth(today.getMonth() + rec.suggestedDurationMonths);
      setStartDate(today.toISOString().split('T')[0]);
      setEndDate(future.toISOString().split('T')[0]);
      setStep(2);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const text = `Preventivo Noleggio: ${selectedCar?.brand} ${selectedCar?.model}\nTotale: €${grandTotal.toLocaleString()}\nGiorni: ${days}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Preventivo RentSync',
          text: text
        });
      } catch (e) { console.error(e) }
    } else {
      alert("Testo copiato: " + text);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
          <FileText className="w-8 h-8 text-indigo-600" />
          Preventivatore
        </h2>
      </div>

      <div className="print:hidden">
        <div className="flex justify-between items-center mb-8 px-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              onClick={() => s < step ? setStep(s) : null}
              className={`flex items-center gap-2 cursor-pointer ${step === s ? 'text-indigo-600 font-bold' : step > s ? 'text-green-600 font-medium' : 'text-slate-400'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === s ? 'border-indigo-600 bg-indigo-50' :
                  step > s ? 'border-green-600 bg-green-50' : 'border-slate-300'
                }`}>
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              <span>{s === 1 ? 'Configurazione' : s === 2 ? 'Dettagli' : 'Riepilogo'}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-0 overflow-y-auto print:block print:overflow-visible">
        {/* Left Config Panel (Hidden in Print) */}
        <div className="lg:col-span-1 space-y-6 print:hidden">
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-left duration-300">

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-lg mb-4 text-slate-700 flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-500" /> Seleziona Cliente
                </h3>
                {!customClientMode ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                      <select
                        className="w-full pl-10 p-2.5 border rounded-lg appearance-none bg-white"
                        onChange={(e) => {
                          const client = clients.find(c => c.id === e.target.value);
                          setSelectedClient(client || null);
                        }}
                        value={selectedClient?.id || ''}
                      >
                        <option value="">-- Seleziona un cliente --</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
                      </select>
                    </div>
                    <button
                      onClick={() => { setCustomClientMode(true); setSelectedClient(null); }}
                      className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Crea nuovo cliente temporaneo
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="text" placeholder="Nome Completo / Ragione Sociale"
                      className="w-full p-2 border rounded-lg"
                      value={newClientName}
                      onChange={e => setNewClientName(e.target.value)}
                    />
                    <button
                      onClick={() => setCustomClientMode(false)}
                      className="text-sm text-slate-500 hover:text-slate-800"
                    >
                      Annulla e seleziona esistente
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-slate-100 p-1 rounded-lg flex text-sm font-medium">
                <button
                  onClick={() => setMode('manual')}
                  className={`flex-1 py-2 rounded-md flex items-center justify-center gap-2 transition-all ${mode === 'manual' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <CarIcon className="w-4 h-4" /> Selezione Manuale
                </button>
                <button
                  onClick={() => setMode('ai')}
                  className={`flex-1 py-2 rounded-md flex items-center justify-center gap-2 transition-all ${mode === 'ai' ? 'bg-indigo-600 shadow text-white' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Sparkles className="w-4 h-4" /> Smart Advisor
                </button>
              </div>

              {mode === 'manual' && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 animate-in fade-in">
                  <h3 className="font-bold text-lg mb-4 text-slate-700 flex items-center gap-2">
                    <CarIcon className="w-5 h-5 text-indigo-500" /> Seleziona Veicolo
                  </h3>
                  <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
                    {fleet.map(car => (
                      <div
                        key={car.id}
                        onClick={() => setSelectedCar(car)}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedCar?.id === car.id
                            ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                            : 'border-slate-200 hover:bg-slate-50'
                          }`}
                      >
                        <img src={car.image} className="w-16 h-10 object-cover rounded bg-slate-200" alt="car" />
                        <div className="flex-1">
                          <div className="font-bold text-sm text-slate-800">{car.brand} {car.model}</div>
                          <div className="text-xs text-slate-500">{car.category}</div>
                        </div>
                        <div className="text-indigo-600 font-bold">€{car.pricePerDay}</div>
                      </div>
                    ))}
                  </div>
                  <button
                    disabled={(!selectedClient && !newClientName) || !selectedCar}
                    onClick={() => setStep(2)}
                    className="w-full mt-6 bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Prosegui ai Dettagli
                  </button>
                </div>
              )}

              {mode === 'ai' && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 animate-in fade-in border-t-4 border-t-indigo-500">
                  <h3 className="font-bold text-lg mb-4 text-slate-700 flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-indigo-500" /> Smart Profiler
                  </h3>
                  <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-2">

                    {/* Section 1: Who */}
                    <div className="pb-4 border-b border-slate-100">
                      <h4 className="text-xs font-bold text-indigo-600 uppercase mb-3 flex items-center gap-1"><Briefcase className="w-3 h-3" /> Profilo Guidatore</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Professione</label>
                          <input
                            type="text" className="w-full p-2 border rounded-lg text-sm" placeholder="Es. Agente"
                            value={driverProfile.job} onChange={e => setDriverProfile({ ...driverProfile, job: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Reddito (€/anno)</label>
                            <input
                              type="text" className="w-full p-2 border rounded-lg text-sm" placeholder="45000"
                              value={driverProfile.annualIncome} onChange={e => setDriverProfile({ ...driverProfile, annualIncome: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Nucleo Familiare</label>
                            <input
                              type="text" className="w-full p-2 border rounded-lg text-sm" placeholder="Es. 4"
                              value={driverProfile.familySize} onChange={e => setDriverProfile({ ...driverProfile, familySize: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: How */}
                    <div className="pb-4 border-b border-slate-100">
                      <h4 className="text-xs font-bold text-indigo-600 uppercase mb-3 flex items-center gap-1"><Map className="w-3 h-3" /> Abitudini di Guida</h4>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Km Annui</label>
                            <input
                              type="text" className="w-full p-2 border rounded-lg text-sm" placeholder="20000"
                              value={driverProfile.annualKm} onChange={e => setDriverProfile({ ...driverProfile, annualKm: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Percorso</label>
                            <select
                              className="w-full p-2 border rounded-lg text-sm"
                              value={driverProfile.tripType} onChange={e => setDriverProfile({ ...driverProfile, tripType: e.target.value as any })}
                            >
                              <option>Urbano</option>
                              <option>Extraurbano</option>
                              <option>Autostrada</option>
                              <option>Misto</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Stile Guida</label>
                          <div className="flex gap-2">
                            {['Rilassato', 'Sportivo', 'Ecologico'].map(style => (
                              <button
                                key={style}
                                onClick={() => setDriverProfile({ ...driverProfile, drivingStyle: style as any })}
                                className={`flex-1 py-1.5 text-xs rounded border ${driverProfile.drivingStyle === style ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}
                              >
                                {style}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Preferences */}
                    <div>
                      <h4 className="text-xs font-bold text-indigo-600 uppercase mb-3 flex items-center gap-1"><SlidersHorizontal className="w-3 h-3" /> Preferenze & Priorità</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Priorità Assoluta</label>
                          <select
                            className="w-full p-2 border rounded-lg text-sm"
                            value={driverProfile.priority} onChange={e => setDriverProfile({ ...driverProfile, priority: e.target.value as any })}
                          >
                            <option>Risparmio</option>
                            <option>Comfort</option>
                            <option>Tecnologia</option>
                            <option>Immagine/Status</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Cambio</label>
                            <select
                              className="w-full p-2 border rounded-lg text-sm"
                              value={driverProfile.transmission} onChange={e => setDriverProfile({ ...driverProfile, transmission: e.target.value as any })}
                            >
                              <option>Indifferente</option>
                              <option>Automatico</option>
                              <option>Manuale</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Esigenze Carico</label>
                            <select
                              className="w-full p-2 border rounded-lg text-sm"
                              value={driverProfile.loadNeeds} onChange={e => setDriverProfile({ ...driverProfile, loadNeeds: e.target.value as any })}
                            >
                              <option>Standard</option>
                              <option>Bagagli Voluminosi</option>
                              <option>Attrezzatura Sportiva</option>
                              <option>Animali Domestici</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleRecommendation}
                      disabled={loading || !driverProfile.job}
                      className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                    >
                      {loading ? <Loader2 className="animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      Trova Soluzione Migliore
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-lg mb-4 text-slate-700 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-500" /> Periodo & Costi
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Inizio</label>
                    <input type="date" className="w-full p-2 border rounded-lg" value={startDate} onChange={e => setStartDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fine</label>
                    <input type="date" className="w-full p-2 border rounded-lg" value={endDate} onChange={e => setEndDate(e.target.value)} />
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600">Giorni totali:</span>
                    <span className="font-bold">{days}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-slate-800 border-t border-slate-200 pt-2 mt-2">
                    <span>Subtotale:</span>
                    <span>€ {baseTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <button
                  onClick={handleGenerateAI}
                  disabled={loading}
                  className="w-full bg-indigo-50 text-indigo-700 border border-indigo-200 py-2 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2 mb-3">
                  {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Wand2 className="w-4 h-4" />}
                  Rigenera Testo Offerta
                </button>
                <textarea
                  className="w-full p-3 border rounded-lg text-sm h-32 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={aiDescription}
                  onChange={e => setAiDescription(e.target.value)}
                  placeholder="Il testo generato apparirà qui..."
                />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 bg-white border border-slate-300 text-slate-700 py-3 rounded-lg font-bold hover:bg-slate-50">Indietro</button>
                <button onClick={() => setStep(3)} className="flex-1 bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800">Vedi Anteprima</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in slide-in-from-right duration-300">
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="flex-1 bg-indigo-600 text-white py-4 rounded-lg font-bold hover:bg-indigo-700 shadow-lg flex items-center justify-center gap-2"
                >
                  <Printer className="w-5 h-5" /> Stampa PDF
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 bg-white border border-slate-300 text-slate-700 py-4 rounded-lg font-bold hover:bg-slate-50 flex items-center justify-center gap-2"
                >
                  <Share2 className="w-5 h-5" /> Condividi
                </button>
              </div>
              <button onClick={() => setStep(2)} className="w-full bg-white border border-slate-300 text-slate-700 py-2 rounded-lg font-medium hover:bg-slate-50">Modifica Dati</button>
            </div>
          )}
        </div>

        {/* Right Preview Panel (A4 Format) or AI Results */}
        <div className="lg:col-span-2 overflow-y-auto flex justify-center print:bg-white print:p-0 print:col-span-3">
          {/* ... (Same AI Recommendation view) ... */}
          {step === 1 && mode === 'ai' && recommendations.length > 0 ? (
            <div className="w-full max-w-2xl space-y-4 animate-in fade-in">
              <h3 className="font-bold text-xl text-slate-800 mb-4">Risultati Smart Advisor</h3>
              {recommendations.map((rec, idx) => {
                const car = fleet.find(c => c.id === rec.carId);
                if (!car) return null;
                return (
                  <div key={idx} className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden hover:shadow-lg transition-all">
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-1/3 relative">
                        <img src={car.image} className="w-full h-full object-cover" alt={car.model} />
                        <div className="absolute top-2 left-2 bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded">
                          {rec.matchScore}% Match
                        </div>
                      </div>
                      <div className="p-4 md:w-2/3 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-lg text-slate-800">{car.brand} {car.model}</h4>
                            <span className="text-slate-500 text-xs bg-slate-100 px-2 py-1 rounded">{car.category}</span>
                          </div>
                          <p className="text-sm text-slate-600 mt-2 line-clamp-2">{rec.reasoning}</p>
                        </div>
                        <div className="flex items-end justify-between mt-4 pt-4 border-t border-slate-50">
                          <div>
                            <div className="text-xs text-slate-400 uppercase">Suggerimento</div>
                            <div className="font-medium text-slate-800 text-sm">Rata ~€{rec.suggestedMonthlyRate}/mese</div>
                          </div>
                          <button
                            onClick={() => selectRecommendation(rec)}
                            className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 flex items-center gap-1"
                          >
                            Scegli questa <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className={`bg-white shadow-2xl w-full max-w-[21cm] min-h-[29.7cm] p-[2cm] relative text-slate-800 print:shadow-none print:w-full print:h-auto print:max-w-none transition-opacity ${step === 1 && mode === 'ai' ? 'opacity-50 blur-sm' : 'opacity-100'}`}>
              {/* PDF Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
                <div className="flex items-center gap-4">
                  {companySettings.logoUrl && (
                    <img src={companySettings.logoUrl} alt="Company Logo" className="h-16 w-auto object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  )}
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{companySettings.name}</h1>
                    <p className="text-sm text-slate-500 mt-1 max-w-xs">{companySettings.description}</p>
                  </div>
                </div>
                <div className="text-right text-sm text-slate-600">
                  <p>{companySettings.legalName}</p>
                  <p>{companySettings.address}</p>
                  <p>P.IVA {companySettings.vatNumber}</p>
                  <p>{companySettings.email}</p>
                  <p>{companySettings.phoneNumber}</p>
                </div>
              </div>

              {/* Quote Info */}
              <div className="flex justify-between mb-8">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Cliente</p>
                  <h2 className="text-xl font-bold">{selectedClient ? selectedClient.name : newClientName || "Cliente"}</h2>
                  {selectedClient?.vatNumber && <p className="text-sm text-slate-600">P.IVA: {selectedClient.vatNumber}</p>}
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Riferimento</p>
                  <p className="text-lg font-bold"># PREV-{Date.now().toString().slice(-6)}</p>
                  <p className="text-sm text-slate-600">Data: {new Date().toLocaleDateString()}</p>
                </div>
              </div>

              {/* Vehicle Card */}
              <div className="mb-8 border rounded-lg overflow-hidden bg-slate-50 print:bg-white print:border-slate-200">
                <div className="flex gap-6 p-4">
                  {selectedCar?.image && (
                    <div className="w-48 h-32 flex-shrink-0">
                      <img src={selectedCar.image} className="w-full h-full object-cover rounded-md bg-white border" alt="car" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-slate-900">{selectedCar ? `${selectedCar.brand} ${selectedCar.model}` : "Veicolo non selezionato"}</h3>
                    <p className="text-slate-600 text-sm mt-1">{selectedCar?.category} - Targa: {selectedCar?.plate}</p>

                    {/* Features */}
                    {selectedCar?.features && selectedCar.features.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {selectedCar.features.map((feature, i) => (
                          <span key={i} className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-medium text-slate-600 flex items-center gap-1">
                            <Check className="w-3 h-3 text-green-500" /> {feature}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {selectedCar?.description && (
                  <div className="bg-indigo-50/50 px-4 py-3 border-t border-indigo-100 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <p className="text-sm text-indigo-900 italic">{selectedCar.description}</p>
                  </div>
                )}
              </div>

              {aiDescription && (
                <div className="mb-8">
                  <h4 className="text-sm font-bold text-slate-900 uppercase border-b mb-3 pb-1 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-500" /> Vantaggi & Valutazione AI
                  </h4>
                  <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap p-4 bg-slate-50 rounded-lg border border-slate-100 print:bg-white print:border-none print:p-0">
                    {aiDescription}
                  </div>
                </div>
              )}

              {/* Financial Plan */}
              <div className="mb-8">
                <h4 className="text-sm font-bold text-slate-900 uppercase border-b mb-3 pb-1 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-indigo-500" /> Piano Finanziario
                </h4>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-800 text-left">
                      <th className="py-2">Voce di Costo</th>
                      <th className="py-2 text-right">Durata / Qta</th>
                      <th className="py-2 text-right">Tariffa Unit.</th>
                      <th className="py-2 text-right">Totale Netto</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="py-3 font-medium">Canone Noleggio {selectedCar?.brand} {selectedCar?.model}</td>
                      <td className="py-3 text-right">{days} giorni</td>
                      <td className="py-3 text-right">€ {selectedCar?.pricePerDay}</td>
                      <td className="py-3 text-right">€ {baseTotal.toLocaleString()}</td>
                    </tr>
                    {discount > 0 && (
                      <tr className="text-green-600 border-b border-slate-100">
                        <td className="py-3 font-medium">Sconto Promozionale</td>
                        <td className="py-3 text-right">1</td>
                        <td className="py-3 text-right">- € {discount}</td>
                        <td className="py-3 text-right">- € {discount.toLocaleString()}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Grand Total */}
              <div className="flex justify-end mb-12">
                <div className="w-full md:w-1/2 bg-slate-900 text-white p-5 rounded-xl print:bg-slate-50 print:text-black print:border print:border-slate-200">
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="opacity-80">Imponibile Totale</span>
                    <span className="font-mono">€ {finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mb-4">
                    <span className="opacity-80">IVA (22%)</span>
                    <span className="font-mono">€ {vat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center text-xl font-bold border-t border-white/20 pt-4 mt-2 print:border-slate-200">
                    <span>Totale Documento</span>
                    <span className="font-mono">€ {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuoteGenerator;