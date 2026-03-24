import React, { useState } from 'react';
import { generateQuoteDetails, recommendCar } from '../services/gemini';
import { Car, Client, DriverProfile, AIRecommendation, RentalOffer } from '../types';
import { useApp } from '../contexts/AppContext';
import { FileText, Wand2, Loader2, User, Calendar, Check, Search, Car as CarIcon, Printer, Plus, Sparkles, BrainCircuit, ArrowRight, ShieldCheck, Zap, Briefcase, SlidersHorizontal, Map, Share2 } from 'lucide-react';

const QuoteGenerator: React.FC = () => {
  const { fleet, clients, companySettings } = useApp();
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
  const [selectedOffer, setSelectedOffer] = useState<RentalOffer | null>(null);
  const [rentalType, setRentalType] = useState('Noleggio Lungo Termine (Manuale)');

  // Smart Advisor State
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
  const today = new Date();
  const start = startDate ? new Date(startDate) : today;
  const end = endDate ? new Date(endDate) : today;
  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

  const baseTotal = selectedOffer 
    ? selectedOffer.monthlyRate
    : (selectedCar ? (selectedCar.price || 0) * days : 0);
  
  const finalTotal = Math.round(Math.max(0, baseTotal - discount));
  const vat = Math.round(finalTotal * 0.22);
  const grandTotal = Math.round(finalTotal + vat);

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
      const startD = new Date();
      const endD = new Date();
      endD.setMonth(startD.getMonth() + rec.suggestedDurationMonths);
      setStartDate(startD.toISOString().split('T')[0]);
      setEndDate(endD.toISOString().split('T')[0]);
      if (car.offers && car.offers.length > 0) {
        // Try to match the suggested duration
        const match = car.offers.find(o => o.duration === rec.suggestedDurationMonths) || car.offers[0];
        setSelectedOffer(match);
      }
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
        {/* Left Config Panel */}
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
                          <div className="flex justify-between items-start">
                             <div>
                                <div className="font-bold text-sm text-slate-800">{car.brand} {car.model}</div>
                                <div className="text-[10px] text-slate-500 font-mono">Codice: {car.vehicleCode}</div>
                             </div>
                             <div className="text-right">
                                <span className="text-[10px] font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 uppercase">{car.category || 'VEICOLO'}</span>
                             </div>
                          </div>
                          {car.description && (
                            <p className="text-[10px] text-slate-600 mt-1 line-clamp-1 italic">"{car.description}"</p>
                          )}
                          <div className="flex flex-wrap gap-1 mt-1.5">
                                {car.features?.slice(0, 2).map((f, i) => (
                                    <span key={i} className="text-[9px] bg-indigo-50 text-indigo-600 px-1 py-0.2 rounded border border-indigo-100">{f}</span>
                                ))}
                                {car.transmission && (
                                    <span className="text-[9px] bg-slate-50 text-slate-500 px-1 py-0.2 rounded border border-slate-100">{car.transmission}</span>
                                )}
                          </div>
                        </div>
                        <div className="text-indigo-600 font-bold text-sm ml-2">
                           {car.offers && car.offers.length > 0 ? `€${car.offers[0].monthlyRate}/m` : `€${car.price || 0}`}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    disabled={(!selectedClient && !newClientName) || !selectedCar}
                    onClick={() => {
                        setStep(2);
                        if (selectedCar?.offers && selectedCar.offers.length > 0) {
                            setSelectedOffer(selectedCar.offers[0]);
                        } else {
                            setSelectedOffer(null);
                        }
                    }}
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
                    {/* Profiler Inputs ... */}
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

                    <div>
                      <h4 className="text-xs font-bold text-indigo-600 uppercase mb-3 flex items-center gap-1"><SlidersHorizontal className="w-3 h-3" /> Preferenze</h4>
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

                 {selectedCar?.offers && selectedCar.offers.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Offerta Commerciale</label>
                    <div className="grid grid-cols-1 gap-2">
                       {selectedCar.offers.map((offer, i) => (
                         <div 
                           key={i}
                           onClick={() => setSelectedOffer(offer)}
                           className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedOffer === offer ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}
                         >
                           <div className="flex justify-between items-center text-sm">
                             <span className="font-bold">{offer.duration} mesi / {offer.kms.toLocaleString()} km</span>
                             <span className="text-indigo-600 font-bold">€{offer.monthlyRate}/mese</span>
                           </div>
                           <div className="mt-1 flex gap-2 text-[10px] text-slate-500">
                             <span>Anticipo: €{offer.advance}</span>
                             <span>Kasko: €{offer.kasko}</span>
                             <span>Furto: €{offer.theft}</span>
                           </div>
                         </div>
                       ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tipologia di Noleggio</label>
                  <select 
                    className="w-full p-2.5 border rounded-lg bg-white text-sm"
                    value={rentalType}
                    onChange={(e) => setRentalType(e.target.value)}
                  >
                    <option value="Noleggio Breve Termine">Noleggio Breve Termine</option>
                    <option value="Noleggio Medio Termine">Noleggio Medio Termine</option>
                    <option value="Noleggio Lungo Termine">Noleggio Lungo Termine (Manuale)</option>
                    <option value="Leasing Operativo">Leasing Operativo</option>
                    <option value="Noleggio Corporate">Noleggio Corporate</option>
                    <option value="Promo Flash 48h">Promo Flash 48h</option>
                  </select>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4 mt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600">{selectedOffer ? 'Canone mensile:' : `${rentalType}:`}</span>
                    <span className="font-bold">{selectedOffer ? `€ ${selectedOffer.monthlyRate}` : days + ' giorni'}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-slate-800 border-t border-slate-200 pt-2 mt-2">
                    <span>{selectedOffer ? 'Totale Mese (Netto):' : 'Subtotale:'}</span>
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
                  className="w-full p-3 border rounded-lg text-sm h-32"
                  value={aiDescription}
                  onChange={e => setAiDescription(e.target.value)}
                  placeholder="Il testo generato apparirà qui..."
                />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 bg-white border border-slate-300 text-slate-700 py-3 rounded-lg font-bold">Indietro</button>
                <button onClick={() => setStep(3)} className="flex-1 bg-slate-900 text-white py-3 rounded-lg font-bold">Vedi Anteprima</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in slide-in-from-right duration-300">
              <div className="flex gap-2">
                <button onClick={handlePrint} className="flex-1 bg-indigo-600 text-white py-4 rounded-lg font-bold flex items-center justify-center gap-2">
                  <Printer className="w-5 h-5" /> Stampa PDF
                </button>
                <button onClick={handleShare} className="flex-1 bg-white border border-slate-300 text-slate-700 py-4 rounded-lg font-bold flex items-center justify-center gap-2">
                  <Share2 className="w-5 h-5" /> Condividi
                </button>
              </div>
              <button onClick={() => setStep(2)} className="w-full bg-white border border-slate-300 text-slate-700 py-2 rounded-lg font-medium">Modifica Dati</button>
            </div>
          )}
        </div>

        {/* Right Preview Panel */}
        <div className="lg:col-span-2 overflow-y-auto flex justify-center print:bg-white print:p-0 print:col-span-3">
          {step === 1 && mode === 'ai' && recommendations.length > 0 ? (
            <div className="w-full max-w-2xl space-y-4">
              <h3 className="font-bold text-xl text-slate-800 mb-4">Risultati Smart Advisor</h3>
              {recommendations.map((rec, idx) => {
                const car = fleet.find(c => c.id === rec.carId);
                if (!car) return null;
                return (
                  <div key={idx} className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-1/3">
                        <img src={car.image} className="w-full h-full object-cover" alt={car.model} />
                      </div>
                      <div className="p-4 md:w-2/3">
                        <h4 className="font-bold text-lg">{car.brand} {car.model}</h4>
                        <p className="text-sm text-slate-600 mt-2">{rec.reasoning}</p>
                        <div className="flex items-center justify-between mt-4">
                          <span className="font-bold text-indigo-600">Rata ~€{Math.round(rec.suggestedMonthlyRate)}/mese</span>
                          <button onClick={() => selectRecommendation(rec)} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm">Scegli</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-white shadow-2xl w-full max-w-[21cm] min-h-[29.7cm] p-[2cm] relative text-slate-800 print:shadow-none print:w-full print:h-auto print:max-w-none">
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
                <div className="flex items-center gap-4">
                  {companySettings.logoUrl && <img src={companySettings.logoUrl} className="h-16 w-auto" />}
                  <div>
                    <h1 className="text-3xl font-bold">{companySettings.name}</h1>
                  </div>
                </div>
                <div className="text-right text-sm text-slate-600">
                  <p>{companySettings.legalName}</p>
                  <p>{companySettings.address}</p>
                  <p>{companySettings.email}</p>
                </div>
              </div>

              {/* Client Info */}
              <div className="flex justify-between mb-8">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Cliente</p>
                  <h2 className="text-xl font-bold">{selectedClient ? selectedClient.name : newClientName || "Cliente"}</h2>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase">Riferimento</p>
                  <p className="text-lg font-bold"># PREV-{Date.now().toString().slice(-6)}</p>
                </div>
              </div>

              {/* Vehicle Card */}
              <div className="mb-8 border rounded-lg overflow-hidden bg-slate-50">
                <div className="flex gap-6 p-4">
                  {selectedCar?.image && <img src={selectedCar.image} className="w-48 h-32 object-cover rounded-md border" />}
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold">{selectedCar ? `${selectedCar.brand} ${selectedCar.model}` : "Veicolo"}</h3>
                    <p className="text-slate-600 text-sm">
                      {selectedCar?.vehicleCode ? `[Cod: ${selectedCar.vehicleCode}] ` : ''}
                      {selectedCar?.plate ? `Targa: ${selectedCar.plate}` : ''}
                    </p>
                    {selectedCar?.modelDescription && <p className="text-slate-500 text-xs mt-2 italic">{selectedCar.modelDescription}</p>}
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                      {selectedCar?.fuelType && <div>Alimentazione: {selectedCar.fuelType}</div>}
                      {selectedCar?.transmission && <div>Cambio: {selectedCar.transmission}</div>}
                      {selectedCar?.year && <div>Anno: {selectedCar.year}</div>}
                    </div>
                  </div>
                </div>
              </div>

              {aiDescription && (
                <div className="mb-8">
                  <h4 className="text-sm font-bold uppercase border-b mb-3 pb-1">Valutazione AI</h4>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{aiDescription}</p>
                </div>
              )}

              {/* Financial Plan */}
              {/* Piano Finanziario Table - Only Show if Step > 1 */}
                    {step > 1 && (
                      <div className="mb-6">
                        <h4 className="text-xs font-extrabold uppercase text-slate-800 mb-3 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
                          Piano Finanziario
                        </h4>
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b-2 border-slate-900">
                              <th className="py-2 text-left">Piano Finanziario</th>
                              <th className="py-2 text-right">Periodo Noleggio</th>
                              <th className="py-2 text-right">Rata Mensile</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedOffer ? (
                              <>
                                <tr className="border-b border-slate-100">
                                  <td className="py-3 font-medium">
                                    <div className="print:hidden">
                                      <select 
                                        className="w-full bg-slate-50 border-none text-sm font-bold p-1 rounded"
                                        value={selectedCar?.offers?.indexOf(selectedOffer) ?? -1}
                                        onChange={(e) => {
                                          if (selectedCar?.offers) {
                                            setSelectedOffer(selectedCar.offers[parseInt(e.target.value)]);
                                          }
                                        }}
                                      >
                                        {selectedCar?.offers?.map((off, idx) => (
                                          <option key={idx} value={idx}>{off.duration} mesi / {off.kms.toLocaleString()} km</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="hidden print:block">
                                      Noleggio Lungo Termine ({selectedOffer.kms.toLocaleString()} km)
                                    </div>
                                  </td>
                                  <td className="py-3 text-right font-bold">{selectedOffer.duration} mesi</td>
                                  <td className="py-3 text-right font-bold">€ {Math.round(selectedOffer.monthlyRate).toLocaleString()}</td>
                                </tr>
                                <tr>
                                  <td colSpan={3} className="py-2 text-[10px] text-slate-500 italic">
                                    * Canone comprensivo di: RCA, Kasko, Furto, Manutenzione Ordinaria/Straordinaria, Assistenza Stradale.
                                  </td>
                                </tr>
                              </>
                            ) : (
                              <tr className="border-b border-slate-100">
                                <td className="py-3 font-medium">{rentalType}</td>
                                <td className="py-3 text-right font-bold">{days} gg</td>
                                 <td className="py-3 text-right font-bold">€ {Math.round(baseTotal).toLocaleString()}</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Totals Section - Enhanced for Printing */}
                    {step > 1 && (
                      <div className="mt-6 pt-4 border-t-2 border-slate-900 border-dashed">
                        <div className="bg-slate-900 text-white rounded-xl p-4 md:p-6 shadow-xl print:shadow-none print:bg-slate-900 print:text-white">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-700">
                            {/* Column 1: Monthly Detail */}
                            <div className="space-y-3 pb-4 md:pb-0 md:pr-6">
                              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block mb-2">Canone Mensile</span>
                              <div className="flex justify-between items-center text-xs opacity-80">
                                <span>Rata Netta:</span>
                                <span>€ {Math.round(finalTotal).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs opacity-80 border-b border-slate-700 pb-2">
                                <span>IVA (22%):</span>
                                <span>€ {Math.round(vat).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-center text-lg font-black text-white pt-2">
                                <span>Rata Totale:</span>
                                <span>€ {Math.round(grandTotal).toLocaleString()}</span>
                              </div>
                            </div>

                            {/* Column 2: Service Franchises */}
                            {selectedOffer ? (
                              <div className="space-y-3 pt-4 md:pt-0 md:px-6">
                                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block mb-2">Opzioni & Franchigie</span>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                  <div>
                                    <span className="block opacity-50 text-[8px] uppercase font-bold">Anticipo</span>
                                    <span className="font-bold text-sm text-white">€ {selectedOffer.advance.toLocaleString()}</span>
                                  </div>
                                  <div>
                                    <span className="block opacity-50 text-[8px] uppercase font-bold">Kasko (Ric.)</span>
                                    <span className="font-bold text-sm text-white">€ {selectedOffer.kasko.toLocaleString()}</span>
                                  </div>
                                  <div>
                                    <span className="block opacity-50 text-[8px] uppercase font-bold">Furto (Ric.)</span>
                                    <span className="font-bold text-sm text-white">€ {selectedOffer.theft.toLocaleString()}</span>
                                  </div>
                                  <div>
                                    <span className="block opacity-50 text-[8px] uppercase font-bold">Durata</span>
                                    <span className="font-bold text-sm text-white">{selectedOffer.duration} mesi</span>
                                  </div>
                                </div>
                                <div className="pt-2">
                                  <span className="block opacity-50 text-[8px] uppercase font-bold mb-1">Km Totali inclusi</span>
                                  <span className="text-sm font-bold">{selectedOffer.kms.toLocaleString()} km</span>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2 pt-4 md:pt-0 md:px-6">
                                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block mb-2">Opzioni Base</span>
                                <div className="p-3 bg-slate-800/40 rounded border border-slate-700">
                                   <div className="flex justify-between text-xs">
                                      <span>Inizio:</span>
                                      <span className="font-bold">{startDate || '-'}</span>
                                   </div>
                                   <div className="flex justify-between text-xs mt-1">
                                      <span>Fine:</span>
                                      <span className="font-bold">{endDate || '-'}</span>
                                   </div>
                                </div>
                              </div>
                            )}

                            {/* Column 3: Grand Engagement */}
                            <div className="pt-4 md:pt-0 md:pl-6 flex flex-col justify-between">
                              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block mb-2">Impegno Contrattuale</span>
                              {selectedOffer ? (
                                <div className="space-y-4">
                                  <div className="text-xs space-y-1">
                                    <div className="flex justify-between opacity-80">
                                      <span>Somma Rate (Netto):</span>
                                      <span>€ {Math.round(selectedOffer.monthlyRate * selectedOffer.duration).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between opacity-80">
                                      <span>Anticipo:</span>
                                      <span>€ {selectedOffer.advance.toLocaleString()}</span>
                                    </div>
                                  </div>
                                  <div className="bg-indigo-600 rounded-lg p-4 shadow-inner border border-indigo-400/30">
                                    <span className="block text-[8px] uppercase font-bold text-indigo-200 mb-1">Valore Totale Contratto (Inc. IVA)</span>
                                    <span className="text-2xl font-black block tracking-tight">
                                      € {Math.round(((selectedOffer.monthlyRate * selectedOffer.duration) + (selectedOffer.advance || 0)) * 1.22).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-indigo-600 rounded-lg p-4 shadow-inner border border-indigo-400/30">
                                  <span className="block text-[8px] uppercase font-bold text-indigo-200 mb-1">Subtotale Lordo (IVA incl.)</span>
                                  <span className="text-2xl font-black block tracking-tight">
                                    € {Math.round(grandTotal).toLocaleString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="mt-4 pt-4 border-t border-slate-800 text-center">
                            <p className="text-[8px] opacity-40 italic">
                             * I calcoli qui riportati sono puramente indicativi e potrebbero variare in fase di sottoscrizione definitiva. IVA calcolata al 22%.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="mt-8 pt-6 text-[10px] text-slate-400 border-t border-slate-100 italic">
                      <p>Il presente documento non costituisce proposta contrattuale ed è soggetto ad approvazione peritale da parte di RentSyncAI o dei propri partner finanziari. I prezzi indicati sono validi per 15 giorni dalla data di emissione per i veicoli disponibili in stock.</p>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      );
};

export default QuoteGenerator;