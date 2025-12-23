import React, { useState, useEffect } from 'react';
import { generateQuoteDetails, recommendCar } from '../services/gemini';
import { Car, Client, DriverProfile, AIRecommendation, CarStatus } from '../types';
import { useApp } from '../contexts/AppContext';
import { FileText, Wand2, Loader2, User, Calendar, Check, Search, Car as CarIcon, Printer, Plus, Sparkles, BrainCircuit, ArrowRight, ShieldCheck, Zap, Briefcase, Settings2, SlidersHorizontal, Map, Share2, Tag, Percent } from 'lucide-react';

const QuoteGenerator: React.FC = () => {
  const { fleet, clients } = useApp();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'manual' | 'ai'>('manual');
  
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [newClientName, setNewClientName] = useState('');
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [discount, setDiscount] = useState(0);
  const [useDynamicDiscount, setUseDynamicDiscount] = useState(false);
  const [aiDescription, setAiDescription] = useState('');
  const [customClientMode, setCustomClientMode] = useState(false);

  const [driverProfile, setDriverProfile] = useState<DriverProfile>({
    job: '', annualIncome: '', annualKm: '', familySize: '', tripType: 'Misto', transmission: 'Indifferente', drivingStyle: 'Rilassato', loadNeeds: 'Standard', priority: 'Comfort'
  });
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);

  const days = startDate && endDate 
    ? Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 1;
  
  const baseTotal = selectedCar ? selectedCar.pricePerDay * days : 0;

  useEffect(() => {
    if (useDynamicDiscount) {
        let percentage = 0;
        if (days >= 30) percentage = 0.25;
        else if (days >= 14) percentage = 0.15;
        else if (days >= 7) percentage = 0.10;
        setDiscount(Math.round(baseTotal * percentage));
    }
  }, [days, baseTotal, useDynamicDiscount]);

  const finalTotal = Math.max(0, baseTotal - discount);
  const vat = finalTotal * 0.22;
  const grandTotal = finalTotal + vat;

  const availableFleet = fleet.filter(c => c.status === CarStatus.AVAILABLE);

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
    if (!driverProfile.job) return;
    setLoading(true);
    try {
      const recs = await recommendCar(availableFleet, driverProfile);
      setRecommendations(recs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const selectRecommendation = (rec: AIRecommendation) => {
    const car = fleet.find(c => c.id === rec.carId);
    if (car) {
      setSelectedCar(car);
      setAiDescription(rec.reasoning); 
      setStep(2);
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
              className={`flex items-center gap-2 cursor-pointer ${step === s ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === s ? 'border-indigo-600 bg-indigo-50' : 'border-slate-300'}`}>
                {s}
              </div>
              <span>{s === 1 ? 'Configurazione' : s === 2 ? 'Dettagli' : 'Riepilogo'}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-0 overflow-y-auto print:block print:overflow-visible">
        <div className="lg:col-span-1 space-y-6 print:hidden">
          {step === 1 && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-lg mb-4">Cliente</h3>
                {!customClientMode ? (
                  <select className="w-full p-2.5 border rounded-lg" onChange={(e) => setSelectedClient(clients.find(c => c.id === e.target.value) || null)} value={selectedClient?.id || ''}>
                    <option value="">-- Seleziona --</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                ) : (
                  <input type="text" className="w-full p-2 border rounded-lg" value={newClientName} onChange={e => setNewClientName(e.target.value)} placeholder="Nome" />
                )}
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-lg mb-4">Auto</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {availableFleet.map(car => (
                      <div key={car.id} onClick={() => setSelectedCar(car)} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${selectedCar?.id === car.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100'}`}>
                        <img src={car.image} className="w-16 h-10 object-cover rounded" />
                        <div className="flex-1 text-sm font-bold">{car.brand} {car.model}</div>
                      </div>
                    ))}
                </div>
                <button disabled={(!selectedClient && !newClientName) || !selectedCar} onClick={() => setStep(2)} className="w-full mt-6 bg-slate-900 text-white py-3 rounded-lg font-bold">Prosegui</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-lg mb-4 text-slate-700">Date & Sconti</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input type="date" className="w-full p-2 border rounded-lg" value={startDate} onChange={e => setStartDate(e.target.value)} />
                  <input type="date" className="w-full p-2 border rounded-lg" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
                <div className="mt-4">
                    <label className="text-xs font-bold text-slate-400 uppercase">Sconto (€)</label>
                    <input type="number" className="w-full p-2 border rounded-lg" value={discount} onChange={e => setDiscount(Number(e.target.value))} />
                </div>
              </div>
              <button onClick={() => setStep(3)} className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold">Vedi Anteprima</button>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 flex justify-center print:block">
           <div className="bg-white shadow-2xl w-full max-w-[21cm] min-h-[29.7cm] p-[2cm] relative text-slate-800 print:shadow-none print:w-full">
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">RentSync.ai</h1>
                  <p className="text-sm text-slate-500">Business Intelligence & Noleggi</p>
                </div>
                <div className="text-right text-sm text-slate-600">
                  <p>Via Roma 123, Milano</p>
                  <p>P.IVA 12345678901</p>
                </div>
              </div>

              <div className="flex justify-between mb-8">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Cliente</p>
                  <h2 className="text-xl font-bold">{selectedClient?.name || newClientName || "---"}</h2>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase">Riferimento</p>
                  <p className="text-lg font-bold">#PREV-{Date.now().toString().slice(-6)}</p>
                </div>
              </div>

              {/* Dettagli Auto in Anteprima */}
              <div className="mb-8 border rounded-xl overflow-hidden bg-slate-50 p-6 flex gap-6">
                  {selectedCar ? (
                      <>
                        <div className="w-48 h-32 flex-shrink-0">
                            <img src={selectedCar.image} className="w-full h-full object-cover rounded-lg border" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-2xl font-bold text-slate-900">{selectedCar.brand} {selectedCar.model}</h3>
                            <p className="text-slate-500 font-mono text-sm mt-1">{selectedCar.plate} • {selectedCar.category}</p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {selectedCar.features?.map((f, i) => (
                                    <span key={i} className="bg-white px-2 py-1 rounded border text-[10px] font-bold text-slate-600">{f}</span>
                                ))}
                            </div>
                        </div>
                      </>
                  ) : (
                      <div className="w-full text-center py-10 text-slate-400 italic">Seleziona un'auto per vedere i dettagli nel preventivo.</div>
                  )}
              </div>

              <div className="mb-8">
                <h4 className="font-bold border-b mb-3 pb-1 text-sm uppercase text-slate-400">Piano Finanziario</h4>
                <table className="w-full text-sm">
                  <thead className="text-left border-b border-slate-200">
                    <tr><th className="py-2">Servizio</th><th className="py-2 text-right">Durata</th><th className="py-2 text-right">Totale</th></tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-3">Noleggio {selectedCar?.brand} {selectedCar?.model}</td>
                      <td className="py-3 text-right">{days} gg</td>
                      <td className="py-3 text-right">€ {baseTotal.toLocaleString()}</td>
                    </tr>
                    {discount > 0 && (
                      <tr className="text-green-600"><td className="py-2">Sconto</td><td></td><td className="py-2 text-right">-€ {discount.toLocaleString()}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end mt-12">
                 <div className="w-full md:w-1/2 bg-slate-900 text-white p-6 rounded-xl">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Totale Noleggio (IVA Incl.)</span>
                      <span>€ {grandTotal.toLocaleString()}</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteGenerator;