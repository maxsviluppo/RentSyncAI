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
  const [customAdvance, setCustomAdvance] = useState(0);
  const [customKasko, setCustomKasko] = useState<number | null>(null);
  const [rateAdjustment, setRateAdjustment] = useState(0);
  const [carSearch, setCarSearch] = useState('');

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

  const baseRate = selectedOffer ? selectedOffer.monthlyRate : (selectedCar ? (selectedCar.price || 0) : 0);
  const amortizedAdvance = (selectedOffer && customAdvance > 0) ? Math.round(customAdvance / selectedOffer.duration) : 0;
  const baseTotal = Math.max(0, baseRate - amortizedAdvance - rateAdjustment);
  
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
    <div className="p-6 max-w-6xl mx-auto flex flex-col h-full overflow-hidden print:p-0 print:m-0 print:max-w-none print:bg-white print:overflow-visible">
      {/* CSS per la stampa */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            background-color: white !important;
            -webkit-print-color-adjust: exact;
          }
          .print-canvas {
            width: 210mm !important;
            height: 297mm !important;
            padding: 1.5cm !important;
            box-shadow: none !important;
            margin: 0 !important;
          }
        }
      `}} />
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
                  <h3 className="font-bold text-lg mb-4 text-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CarIcon className="w-5 h-5 text-indigo-500" /> Veicolo
                    </div>
                    <div className="relative w-40">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3" />
                        <input 
                            type="text" 
                            className="w-full text-xs pl-7 py-1.5 border rounded-full bg-slate-50 focus:bg-white transition-all"
                            placeholder="Cerca marca o cod..."
                            value={carSearch}
                            onChange={e => setCarSearch(e.target.value)}
                        />
                    </div>
                  </h3>
                  <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto pr-2">
                    {fleet
                        .filter(car => 
                            car.brand.toLowerCase().includes(carSearch.toLowerCase()) || 
                            car.model.toLowerCase().includes(carSearch.toLowerCase()) ||
                            car.vehicleCode.toLowerCase().includes(carSearch.toLowerCase())
                        )
                        .map(car => (
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
                <div className="mb-6 pb-6 border-b border-slate-100">
                  <label className="block text-xs font-black text-indigo-600 uppercase mb-2 tracking-widest">Anticipo Personalizzato</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      className="w-full p-3 pl-8 border-2 border-indigo-100 rounded-xl focus:border-indigo-500 outline-none font-bold text-lg bg-indigo-50/30"
                      placeholder="Inserisci importo (es. 1200)"
                      value={customAdvance || ''}
                      onChange={e => setCustomAdvance(parseFloat(e.target.value) || 0)}
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-indigo-400">€</span>
                  </div>
                  {customAdvance > 0 && selectedOffer && (
                    <p className="mt-2 text-[10px] text-slate-500 italic">
                      L'anticipo di €{customAdvance} riduce la rata di €{Math.round(customAdvance / selectedOffer.duration)}/mese ({selectedOffer.duration} mesi).
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6 mb-8 pb-8 border-b border-slate-100">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest">Importo Kasco</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-indigo-400 text-lg">€</span>
                      <input 
                        type="number" 
                        className="w-full p-4 pl-10 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none font-black text-xl bg-slate-50/50 transition-all text-slate-800"
                        placeholder={selectedOffer ? selectedOffer.kasko.toString() : "0"}
                        value={customKasko ?? ''}
                        onChange={e => setCustomKasko(e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                    <div className="h-3"></div> {/* Visual balance */}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest">Diff. Rata</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-indigo-400 text-lg">€</span>
                      <input 
                        type="number" 
                        className="w-full p-4 pl-10 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none font-black text-xl bg-slate-50/50 transition-all text-slate-800"
                        placeholder="0"
                        value={rateAdjustment || ''}
                        onChange={e => setRateAdjustment(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <p className="text-[9px] text-slate-400 font-bold italic uppercase tracking-tighter">Sottrae l'importo dal canone</p>
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


                <div className="bg-slate-900 p-5 rounded-2xl shadow-xl shadow-indigo-100/50 mb-4 mt-4">
                  <div className="flex justify-between text-xs text-indigo-300 font-bold uppercase tracking-wider mb-2">
                    <span>{selectedOffer ? 'Canone Mensile (Scontato):' : 'Costo Unitario:'}</span>
                    <span className="text-white text-sm">€ {baseTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xl font-black text-white border-t border-slate-700 pt-3 mt-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Totale Netto</span>
                      <span>€ {finalTotal.toLocaleString()}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter block">Iva Incl.</span>
                      <span className="text-indigo-400 text-2xl">€ {grandTotal.toLocaleString()}</span>
                    </div>
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
            <div className="bg-white shadow-2xl w-full max-w-[21cm] min-h-[29.7cm] p-[2cm] relative text-slate-800 print:shadow-none print-canvas border print:border-none">
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
                <div className="mb-6">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap italic opacity-80">{aiDescription}</p>
                </div>
              )}

              {/* Financial Plan */}
              {/* Piano Finanziario Table - Only Show if Step > 1 */}
                    {step > 1 && (
                      <div className="mb-4">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b-2 border-slate-900">
                              <th className="py-2 text-left">Dettaglio Soluzione</th>
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
                                  <td className="py-3 text-right font-bold">€ {Math.round(baseTotal).toLocaleString()}</td>
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
                        <div className="bg-slate-900 text-white rounded-2xl overflow-hidden shadow-xl print:shadow-none">
                          {/* Row 1: COMPACT Header */}
                          <div className="p-5 border-b border-white/5 bg-gradient-to-r from-slate-900 to-indigo-950">
                            <div className="flex flex-wrap items-center justify-between gap-y-4">
                                {/* Left: Monthly Rate */}
                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest block mb-1">Canone Mensile (IVA Incl.)</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-black text-white tracking-tighter">€ {Math.round(grandTotal).toLocaleString()}</span>
                                            <span className="text-[10px] text-slate-400 font-bold">/ mese</span>
                                        </div>
                                    </div>

                                    {/* Parameters inline next to it */}
                                    {selectedOffer && (
                                        <div className="flex items-center gap-6 border-l border-white/10 pl-6 ml-2 h-10">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] text-slate-500 font-black uppercase tracking-tighter mb-0.5">Anticipo</span>
                                                <span className="text-sm font-extrabold text-indigo-400">€ {(customAdvance || selectedOffer.advance).toLocaleString()}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[8px] text-slate-500 font-black uppercase tracking-tighter mb-0.5">RCA</span>
                                                <span className="text-sm font-extrabold">€ {(selectedOffer.rca ?? 250).toLocaleString()}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[8px] text-slate-500 font-black uppercase tracking-tighter mb-0.5">Kasco</span>
                                                <span className="text-sm font-extrabold text-white">€ {(customKasko ?? (selectedOffer?.kasko || 0)).toLocaleString()}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[8px] text-slate-500 font-black uppercase tracking-tighter mb-0.5">Furto</span>
                                                <span className="text-sm font-extrabold">€ {(selectedOffer.theft || 0).toLocaleString()}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[8px] text-slate-500 font-black uppercase tracking-tighter mb-0.5">Durata</span>
                                                <span className="text-sm font-extrabold">{selectedOffer.duration} <span className="text-[10px] opacity-50">mesi</span></span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right: Totals detail */}
                                <div className="flex flex-col items-end text-right">
                                    <div className="text-[10px] text-slate-400 font-medium">Imponibile: € {Math.round(finalTotal).toLocaleString()}</div>
                                    <div className="text-[10px] text-slate-400 font-medium">IVA (22%): € {Math.round(vat).toLocaleString()}</div>
                                </div>
                            </div>
                          </div>

                          {/* Row 2: Services & Details */}
                          <div className="p-6 bg-slate-800/20">
                            <div className="flex flex-col md:flex-row gap-8">
                                {/* Services List */}
                                <div className="flex-1">
                                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block mb-4 flex items-center gap-2">
                                        <ShieldCheck className="w-3 h-3 text-indigo-500" /> Servizi Inclusi nel Canone
                                    </span>
                                    <div className="flex flex-wrap gap-x-8 gap-y-3">
                                        {[
                                            'Assicurazione RCA',
                                            'Incendio, Furto e Rapina',
                                            'Kasko totale con franchigia',
                                            'Assistenza Stradale H24',
                                            'Manutenzione Ordinaria e Straordinaria',
                                            'Tassa di Possesso'
                                        ].map((service, i) => (
                                            <div key={i} className="flex items-center gap-2 text-[10px] text-white font-medium">
                                                <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                                                {service}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Stock Info Badge */}
                                <div className="md:w-64 bg-slate-400/5 rounded-xl p-4 border border-white/5">
                                    <span className="text-[8px] text-slate-500 font-bold uppercase block mb-1">Stato Veicolo</span>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                                        <span className="text-xs font-bold text-indigo-400">Pronta Consegna Stock</span>
                                    </div>
                                    <p className="text-[9px] text-slate-400 italic">Offerta valida per 15 giorni salvo esaurimento scorte.</p>
                                </div>
                            </div>
                          </div>

                          <div className="bg-indigo-600/10 py-3 px-6 text-center border-t border-white/5">
                             <p className="text-[8px] text-slate-500 font-bold tracking-[0.2em] uppercase">
                               * Documento creato digitalmente con piattaforma RentSync AI
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