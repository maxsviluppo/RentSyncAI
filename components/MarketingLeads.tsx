import React, { useState, useEffect } from 'react';
import { generateMarketingCopy, findLeads } from '../services/gemini';
import { useApp } from '../contexts/AppContext';
import { MarketingLead, Car } from '../types';
import { Mail, MessageSquare, Loader2, Search, Globe, Plus, Sparkles, MapPin, X, Car as CarIcon, CheckCircle2, Phone, Map, Info, Zap, Building2, Link2, ExternalLink, Key, ShieldAlert, AlertCircle, Save, ShieldX, ExternalLink as LinkIcon, FlaskConical, Briefcase, MailQuestion, InfoIcon, ShieldCheck } from 'lucide-react';

const MarketingLeads: React.FC = () => {
  const { leads, addLead, fleet, companyProfile } = useApp();
  const [activeTab, setActiveTab] = useState<'list' | 'search'>('list');
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [tone, setTone] = useState('Professionale e Persuasivo');
  const [showCarPicker, setShowCarPicker] = useState(false);
  const [selectedCars, setSelectedCars] = useState<Car[]>([]);
  const [searchTarget, setSearchTarget] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [foundLeads, setFoundLeads] = useState<Partial<MarketingLead>[]>([]);
  const [foundSources, setFoundSources] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [quotaError, setQuotaError] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  const [isSimulated, setIsSimulated] = useState(false);
  const [toast, setToast] = useState({ message: '', visible: false });

  useEffect(() => {
    if (toast.visible) {
        const timer = setTimeout(() => setToast({ message: '', visible: false }), 3000);
        return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  const showToast = (message: string) => setToast({ message, visible: true });

  const handleOpenKeySelector = async () => {
    if (window.aistudio?.openSelectKey) {
        await window.aistudio.openSelectKey();
        setQuotaError(false);
        setPermissionError(false);
        showToast("Configurazione aggiornata. Riprova la ricerca.");
    }
  };

  const handleSearchLeads = async (simulate: boolean = false) => {
      if(!searchTarget || !searchLocation) return;
      
      setSearchLoading(true);
      setFoundLeads([]);
      setFoundSources([]);
      setQuotaError(false);
      setPermissionError(false);
      setIsSimulated(simulate);
      
      try {
          const result = await findLeads(searchTarget, searchLocation, simulate);
          if (result.error === "QUOTA_EXCEEDED") {
              setQuotaError(true);
          } else if (result.error === "PERMISSION_DENIED") {
              setPermissionError(true);
          } else if (result.error) {
              showToast(`Errore: ${result.error}`);
          } else {
              setFoundLeads(result.leads);
              setFoundSources(result.sources);
              if (simulate) showToast("Simulazione attivata per il test.");
          }
      } catch (e) {
          showToast("Errore durante la ricerca.");
      } finally {
          setSearchLoading(false);
      }
  };

  const importLead = (lead: Partial<MarketingLead>) => {
      addLead({
          id: Date.now().toString(),
          name: lead.name || 'Sconosciuto',
          company: lead.company || lead.name || 'Sconosciuto',
          interest: lead.interest || 'Generico',
          status: 'New',
          source: isSimulated ? 'Manual' : 'AI_Search',
          location: lead.location,
          email: lead.email,
          phone: lead.phone
      });
      showToast(`${lead.name} importato!`);
  };

  return (
    <div className="p-6 h-full flex flex-col relative bg-slate-50 overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Marketing & AI Radar</h2>
          <p className="text-slate-500">Trova nuovi clienti B2B e analizza i loro bisogni con il grounding di Google.</p>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setActiveTab('list')} className={`px-5 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'list' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-600 border'}`}>Database Leads</button>
           <button onClick={() => setActiveTab('search')} className={`px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'search' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-indigo-600 border border-indigo-200'}`}><Sparkles className="w-4 h-4"/> Radar AI</button>
        </div>
      </div>

      {activeTab === 'search' && (
          <div className="flex-1 flex flex-col space-y-6 overflow-hidden">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-end animate-in fade-in duration-500">
                  <div className="flex-[2] w-full">
                      <label className="text-[10px] font-bold text-indigo-600 uppercase mb-1 block ml-2">Settore Target</label>
                      <input type="text" placeholder="es. Ristoranti, Studi Medici, Hotel..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={searchTarget} onChange={e => setSearchTarget(e.target.value)} />
                  </div>
                  <div className="flex-1 w-full">
                      <label className="text-[10px] font-bold text-indigo-600 uppercase mb-1 block ml-2">Città / Area</label>
                      <input type="text" placeholder="Milano, Roma..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={searchLocation} onChange={e => setSearchLocation(e.target.value)} />
                  </div>
                  <button onClick={() => handleSearchLeads(false)} disabled={searchLoading || !searchTarget} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 h-[46px] disabled:opacity-50 hover:bg-indigo-700 shadow-lg transition-all">
                     {searchLoading ? <Loader2 className="animate-spin w-5 h-5"/> : <Search className="w-5 h-5"/>} Ricerca Reale
                  </button>
              </div>

              {permissionError && (
                  <div className="bg-white border-2 border-indigo-100 p-8 rounded-2xl animate-in slide-in-from-top duration-300 shadow-xl flex flex-col items-center text-center">
                      <div className="p-4 bg-indigo-50 rounded-full text-indigo-600 mb-4 ring-8 ring-indigo-50/50"><ShieldX className="w-10 h-10" /></div>
                      <h3 className="font-extrabold text-slate-900 text-xl">Radar Google Disabilitato (403)</h3>
                      <p className="text-slate-500 text-sm mt-2 max-w-lg mb-8 leading-relaxed">
                        Il grounding di Google Search richiede una chiave API "Paid" (anche se entro i limiti gratuiti). 
                        Puoi testare l'app istantaneamente usando la simulazione gratuita o collegando la tua chiave personale.
                      </p>
                      <div className="flex gap-4">
                        <button onClick={() => handleSearchLeads(true)} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg transition-all">
                            <FlaskConical className="w-5 h-5"/> Attiva Simulazione Gratis
                        </button>
                        <button onClick={handleOpenKeySelector} className="bg-white text-slate-600 border border-slate-200 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all">
                            <Key className="w-4 h-4"/> Configura Chiave Personale
                        </button>
                      </div>
                  </div>
              )}

              {isSimulated && !searchLoading && foundLeads.length > 0 && (
                  <div className="bg-amber-100 text-amber-800 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 border border-amber-200 shadow-sm animate-in fade-in">
                      <FlaskConical className="w-4 h-4" /> MODALITÀ SANDBOX: Risultati simulati generati per testare le funzionalità di marketing.
                  </div>
              )}

              <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden min-h-0">
                  <div className="lg:col-span-2 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                      {searchLoading && (
                          <div className="h-64 flex flex-col items-center justify-center bg-white rounded-2xl border-2 border-dashed border-indigo-100 animate-pulse text-indigo-600">
                              <Loader2 className="w-12 h-12 animate-spin mb-4"/>
                              <p className="font-bold text-lg">Analisi Radar in corso...</p>
                              <p className="text-xs text-slate-400 mt-2">Consultazione fonti Google Search Grounding</p>
                          </div>
                      )}
                      
                      {!searchLoading && foundLeads.map((lead, idx) => (
                          <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-6 hover:shadow-md transition-all animate-in slide-in-from-bottom duration-300">
                              <div className="flex flex-col md:flex-row gap-6">
                                  <div className="flex-1">
                                      <div className="flex justify-between items-start mb-2">
                                          <div>
                                            <h4 className="font-bold text-slate-900 text-xl">{lead.name}</h4>
                                            <p className="text-xs text-indigo-600 font-bold flex items-center gap-1 mt-1"><MapPin className="w-3 h-3"/> {lead.location}</p>
                                          </div>
                                          <span className="text-[10px] font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full uppercase flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Reale</span>
                                      </div>
                                      
                                      {/* Info Box: Business Insight */}
                                      <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 mt-4">
                                          <div className="flex items-center gap-2 mb-2">
                                              <Briefcase className="w-4 h-4 text-indigo-600"/>
                                              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Analisi Bisogno Mobilità</span>
                                          </div>
                                          <p className="text-sm text-indigo-950 font-medium leading-relaxed italic">"{lead.interest}"</p>
                                      </div>

                                      {/* Info Box: Contact Info */}
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center gap-3">
                                              <div className="p-2 bg-white rounded-md shadow-sm"><MailQuestion className="w-4 h-4 text-slate-400"/></div>
                                              <div className="overflow-hidden">
                                                  <p className="text-[9px] font-bold text-slate-400 uppercase">Email</p>
                                                  <p className="text-xs font-semibold text-slate-700 truncate">{lead.email || 'Non trovata'}</p>
                                              </div>
                                          </div>
                                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center gap-3">
                                              <div className="p-2 bg-white rounded-md shadow-sm"><Phone className="w-4 h-4 text-slate-400"/></div>
                                              <div>
                                                  <p className="text-[9px] font-bold text-slate-400 uppercase">Telefono</p>
                                                  <p className="text-xs font-semibold text-slate-700">{lead.phone || 'Non trovato'}</p>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                                  
                                  <div className="flex md:flex-col justify-center gap-2 border-l md:pl-6 border-slate-100">
                                      <button onClick={() => importLead(lead)} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-all flex items-center gap-2">
                                          <Plus className="w-4 h-4"/> Importa Lead
                                      </button>
                                  </div>
                              </div>
                          </div>
                      ))}

                      {!searchLoading && foundLeads.length === 0 && !quotaError && !permissionError && (
                          <div className="h-64 flex flex-col items-center justify-center text-slate-400 italic bg-white rounded-2xl border-2 border-dashed">
                             <Search className="w-12 h-12 mb-4 opacity-10" />
                             <p className="text-lg font-medium">Radar Lead Pronto</p>
                             <p className="text-sm mt-1">Cerca aziende locali per iniziare l'analisi AI.</p>
                          </div>
                      )}
                  </div>
                  
                  <div className="space-y-6 h-full flex flex-col">
                      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex-1 flex flex-col">
                          <div className="p-3 bg-slate-50 border-b flex items-center gap-2"><Map className="w-4 h-4 text-indigo-600"/><span className="text-xs font-bold text-slate-700 uppercase tracking-widest">Geolocalizzazione Lead</span></div>
                          <div className="flex-1 bg-slate-100 relative">
                              {foundLeads.length > 0 ? <iframe width="100%" height="100%" frameBorder="0" src={`https://maps.google.com/maps?q=${encodeURIComponent(searchTarget + ' ' + searchLocation)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}></iframe> : <div className="h-full flex items-center justify-center text-slate-300 italic text-xs text-center p-8">Mappa interattiva disponibile dopo la ricerca.</div>}
                          </div>
                      </div>
                      
                      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-48 flex flex-col">
                          <div className="p-3 bg-slate-50 border-b flex items-center gap-2"><Link2 className="w-4 h-4 text-indigo-600"/><span className="text-xs font-bold text-slate-700 uppercase tracking-widest">Fonti di Grounding</span></div>
                          <div className="flex-1 p-4 overflow-y-auto space-y-2 bg-slate-50/30 custom-scrollbar">
                              {foundSources.length > 0 ? foundSources.map((source, i) => (
                                  <a key={i} href={source.web?.uri || source.maps?.uri} target="_blank" className="text-[10px] text-slate-500 bg-white border border-slate-200 p-2 rounded-lg flex items-center gap-2 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
                                      <Globe className="w-3 h-3 flex-shrink-0"/>
                                      <span className="truncate flex-1">{source.web?.title || source.maps?.title || (source.web?.uri || source.maps?.uri)}</span>
                                      <ExternalLink className="w-3 h-3 text-slate-300"/>
                                  </a>
                              )) : <div className="h-full flex items-center justify-center text-slate-300 text-[10px] italic">Le fonti Google appariranno qui.</div>}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'list' && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
              <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                  <span className="font-bold text-slate-700 uppercase text-xs tracking-wider">Database Lead ({leads.length})</span>
                  <div className="p-1.5 bg-indigo-100 rounded-full text-indigo-600"><ShieldCheck className="w-4 h-4"/></div>
              </div>
              <div className="overflow-y-auto flex-1 custom-scrollbar">
                  {leads.map(lead => (
                  <div key={lead.id} onClick={() => { setSelectedLead(lead); setGeneratedEmail(''); setSelectedCars([]); }} className={`p-4 border-b border-slate-50 cursor-pointer transition-all hover:bg-slate-50 ${selectedLead?.id === lead.id ? 'bg-indigo-50 border-l-4 border-l-indigo-500 shadow-sm' : ''}`}>
                      <h4 className="font-bold text-slate-800">{lead.name}</h4>
                      <p className="text-xs text-slate-500">{lead.company}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="text-[10px] bg-indigo-100 text-indigo-700 inline-block px-2 py-0.5 rounded uppercase font-bold">{lead.source}</div>
                        {lead.status === 'Converted' && <div className="text-[10px] bg-green-100 text-green-700 inline-block px-2 py-0.5 rounded uppercase font-bold">Convertito</div>}
                      </div>
                  </div>
                  ))}
              </div>
            </div>
            
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden relative">
            {selectedLead ? (
                <div className="p-6 flex flex-col h-full overflow-hidden">
                    <div className="mb-6 flex justify-between items-start border-b pb-4">
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900">{selectedLead.name}</h3>
                            <p className="text-slate-500 text-sm flex items-center gap-2 font-medium mt-1"><Building2 className="w-4 h-4"/> {selectedLead.company}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold text-indigo-600">{selectedLead.email || 'Nessuna Email'}</p>
                            <p className="text-xs text-slate-400 mt-1">{selectedLead.phone || 'Nessun Telefono'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                            <p className="text-[10px] font-bold text-indigo-600 uppercase mb-2 flex items-center gap-1"><InfoIcon className="w-3 h-3"/> Profilo del Bisogno AI</p>
                            <p className="text-sm text-indigo-900 font-medium leading-relaxed italic">"{selectedLead.interest}"</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                             <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Dati Logistici</p>
                             <p className="text-xs text-slate-600 flex items-center gap-2 mb-1"><MapPin className="w-3.5 h-3.5 text-indigo-400"/> {selectedLead.location || 'Area Locale'}</p>
                             <p className="text-xs text-slate-600 flex items-center gap-2"><Globe className="w-3.5 h-3.5 text-indigo-400"/> Lead Qualificato AI</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Tono Campagna</label>
                            <select value={tone} onChange={e => setTone(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm outline-none bg-white focus:ring-2 focus:ring-indigo-500"><option>Professionale e Persuasivo</option><option>Amichevole e Informale</option></select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Flotta Suggerita</label>
                            <button onClick={() => setShowCarPicker(true)} className="w-full p-2.5 bg-white border rounded-xl text-sm font-bold flex justify-between items-center hover:bg-slate-50 transition-colors shadow-sm"><span className="flex items-center gap-2"><CarIcon className="w-4 h-4 text-indigo-500"/> {selectedCars.length > 0 ? `${selectedCars.length} Veicoli Selezionati` : 'Aggiungi Veicoli'}</span><Plus className="w-4 h-4 text-slate-400"/></button>
                        </div>
                    </div>
                    
                    <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden mb-4 p-4 relative group shadow-inner">
                        {generatedEmail ? (
                            <textarea className="w-full h-full bg-transparent resize-none outline-none text-slate-700 text-sm leading-relaxed custom-scrollbar" value={generatedEmail} onChange={e => setGeneratedEmail(e.target.value)} />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-20">
                                <Zap className="w-16 h-16 mb-4"/>
                                <p className="text-sm font-medium">Bozza email non generata.</p>
                            </div>
                        )}
                        {loading && <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[1px]"><Loader2 className="w-10 h-10 text-indigo-600 animate-spin" /></div>}
                        
                        {!generatedEmail && !loading && (
                            <button 
                                onClick={async () => {
                                    setLoading(true);
                                    try {
                                        const copy = await generateMarketingCopy(selectedLead.name, selectedLead.interest, tone, selectedCars, companyProfile);
                                        setGeneratedEmail(copy);
                                    } finally { setLoading(false); }
                                }}
                                className="absolute bottom-6 right-6 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-xl hover:bg-indigo-700 transition-all scale-100 hover:scale-105"
                            >
                                <Sparkles className="w-5 h-5"/> Genera Email AI
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <div className="p-8 bg-slate-50 rounded-full mb-6 ring-8 ring-slate-50/50"><MessageSquare className="w-12 h-12 opacity-10"/></div>
                    <p className="font-bold text-slate-500">Database Marketing</p>
                    <p className="text-sm max-w-xs text-center mt-1">Seleziona un lead per creare una campagna marketing personalizzata con l'IA.</p>
                </div>
            )}
            </div>
        </div>
      )}

      {showCarPicker && (
          <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowCarPicker(false)}>
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 max-h-[70vh] flex flex-col animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-4"><div><h3 className="font-bold text-lg text-slate-900">Catalogo Flotta</h3></div><button onClick={() => setShowCarPicker(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6"/></button></div>
                  <div className="overflow-y-auto space-y-2 pr-2 custom-scrollbar flex-1">
                      {fleet.map(car => (
                          <div key={car.id} onClick={() => { if (selectedCars.find(c => c.id === car.id)) setSelectedCars(prev => prev.filter(c => c.id !== car.id)); else setSelectedCars(prev => [...prev, car]); }} className={`p-4 rounded-2xl border-2 flex items-center gap-4 cursor-pointer transition-all ${selectedCars.find(c => c.id === car.id) ? 'border-indigo-600 bg-indigo-50 shadow-sm' : 'border-slate-100 hover:border-slate-200 bg-white'}`}>
                              <img src={car.image} className="w-16 h-10 object-cover rounded-lg shadow-sm" alt="car" />
                              <div className="flex-1">
                                <div className="text-sm font-bold text-slate-800">{car.brand} {car.model}</div>
                                <div className="text-[10px] text-slate-400 uppercase font-bold">{car.category}</div>
                              </div>
                              {selectedCars.find(c => c.id === car.id) && <CheckCircle2 className="w-5 h-5 text-indigo-600"/>}
                          </div>
                      ))}
                  </div>
                  <button onClick={() => setShowCarPicker(false)} className="w-full mt-6 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-colors shadow-lg">Conferma Selezione ({selectedCars.length})</button>
              </div>
          </div>
      )}

      {toast.visible && <div className="fixed bottom-10 right-10 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-5 z-[200] border border-white/10"><span className="font-bold text-sm flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-400"/> {toast.message}</span></div>}
    </div>
  );
};

export default MarketingLeads;