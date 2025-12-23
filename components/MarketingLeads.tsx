import React, { useState, useEffect } from 'react';
import { generateMarketingCopy, findLeads } from '../services/gemini';
import { useApp } from '../contexts/AppContext';
import { MarketingLead, Car } from '../types';
import { Mail, MessageSquare, Loader2, UserPlus, Search, Globe, Plus, Sparkles, MapPin, Upload, X, Trash2, Car as CarIcon, CheckCircle2, Phone, Map, ChevronRight, Info, Zap, Building2, Wand2, ExternalLink, Link2, AlertCircle, Key, ShieldAlert } from 'lucide-react';

const MarketingLeads: React.FC = () => {
  const { leads, addLead, deleteLead, fleet, companyProfile } = useApp();
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

  const [toast, setToast] = useState<{message: string, visible: boolean}>({ message: '', visible: false });

  useEffect(() => {
    if (toast.visible) {
        const timer = setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
        return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  const showToast = (message: string) => setToast({ message, visible: true });

  const handleOpenApiKeyDialog = async () => {
    if (window.aistudio?.openSelectKey) {
        await window.aistudio.openSelectKey();
        setQuotaError(false); // Reset error state after key selection attempt
        showToast("Chiave API aggiornata. Riprova la ricerca.");
    }
  };

  const handleGenerateEmail = async () => {
    if (!selectedLead || selectedCars.length === 0) {
        showToast("Seleziona almeno un lead e un'auto.");
        return;
    }
    setLoading(true);
    setGeneratedEmail('');
    try {
      const copy = await generateMarketingCopy(selectedLead.name, selectedLead.interest, tone, selectedCars, companyProfile);
      setGeneratedEmail(copy);
    } catch (e) {
      console.error(e);
      showToast("Errore generazione email.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchLeads = async () => {
      if(!searchTarget || !searchLocation) return;
      setSearchLoading(true);
      setFoundLeads([]);
      setFoundSources([]);
      setQuotaError(false);
      try {
          const result = await findLeads(searchTarget, searchLocation);
          if (result.error === "QUOTA_EXCEEDED") {
              setQuotaError(true);
              showToast("Limite quota API raggiunto.");
          } else {
              setFoundLeads(result.leads);
              setFoundSources(result.sources);
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
          source: 'AI_Search',
          location: lead.location,
          email: lead.email,
          phone: lead.phone
      });
      showToast(`${lead.name} importato!`);
  };

  return (
    <div className="p-6 h-full flex flex-col relative bg-slate-50">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Marketing & Lead Generation</h2>
          <p className="text-slate-500">Gestisci i contatti e trova nuovi clienti con l'AI Search.</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => setActiveTab('list')}
             className={`px-5 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'list' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-600 border'}`}
           >
             Database Leads
           </button>
           <button 
             onClick={() => setActiveTab('search')}
             className={`px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'search' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-indigo-600 border border-indigo-200'}`}
           >
             <Sparkles className="w-4 h-4"/> Radar AI
           </button>
        </div>
      </div>

      {activeTab === 'list' && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
            {/* Sidebar Leads */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
              <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                <span className="font-bold text-slate-700 uppercase text-xs tracking-wider">Leads ({leads.length})</span>
              </div>
              <div className="overflow-y-auto flex-1 custom-scrollbar">
                  {leads.map(lead => (
                  <div 
                      key={lead.id} 
                      onClick={() => { setSelectedLead(lead); setGeneratedEmail(''); setSelectedCars([]); }}
                      className={`p-4 border-b border-slate-50 cursor-pointer transition-all hover:bg-slate-50 ${selectedLead?.id === lead.id ? 'bg-indigo-50 border-l-4 border-l-indigo-500 shadow-sm' : ''}`}
                  >
                      <h4 className="font-bold text-slate-800">{lead.name}</h4>
                      <p className="text-xs text-slate-500">{lead.company}</p>
                      <div className="mt-2 text-[10px] bg-indigo-100 text-indigo-700 inline-block px-2 py-0.5 rounded uppercase font-bold">{lead.source}</div>
                  </div>
                  ))}
                  {leads.length === 0 && (
                      <div className="p-10 text-center text-slate-400 italic text-sm">Nessun lead presente.</div>
                  )}
              </div>
            </div>

            {/* Content Area */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
            {selectedLead ? (
                <div className="p-6 flex flex-col h-full overflow-hidden">
                    <div className="mb-6 flex justify-between items-start border-b pb-4">
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900">{selectedLead.name}</h3>
                            <p className="text-slate-500 text-sm flex items-center gap-2 font-medium"><Building2 className="w-4 h-4"/> {selectedLead.company}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold text-indigo-600">{selectedLead.email || 'Email non disponibile'}</p>
                            <p className="text-sm text-slate-500 font-mono">{selectedLead.phone || '-'}</p>
                        </div>
                    </div>

                    <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><Info className="w-3 h-3"/> Analisi Bisogno AI</p>
                        <p className="text-sm text-slate-700 font-medium leading-relaxed italic">"{selectedLead.interest}"</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Tono Email</label>
                            <select value={tone} onChange={e => setTone(e.target.value)} className="w-full p-2 border rounded-xl text-sm outline-none bg-white">
                                <option>Professionale e Persuasivo</option>
                                <option>Amichevole e Informale</option>
                                <option>Focus Risparmio Fiscale</option>
                                <option>Urgente / Ultima Opportunità</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Auto da Proporre ({selectedCars.length})</label>
                            <button onClick={() => setShowCarPicker(true)} className="w-full p-2 bg-white border rounded-xl text-sm font-bold flex justify-between items-center hover:bg-slate-50 transition-colors">
                                <span className="flex items-center gap-2"><CarIcon className="w-4 h-4 text-indigo-500"/> {selectedCars.length > 0 ? `${selectedCars.length} Veicoli` : 'Seleziona Flotta'}</span>
                                <Plus className="w-4 h-4 text-slate-400"/>
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden mb-4 p-4 relative">
                        {generatedEmail ? (
                            <textarea className="w-full h-full bg-transparent resize-none outline-none text-slate-700 text-sm leading-relaxed" value={generatedEmail} onChange={e => setGeneratedEmail(e.target.value)} />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300">
                                <Wand2 className="w-16 h-16 mb-4 opacity-10"/>
                                <p className="text-sm font-medium">Seleziona le auto e clicca "Genera" per iniziare la bozza.</p>
                            </div>
                        )}
                        {loading && (
                            <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[1px]">
                                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3">
                        <button 
                            onClick={handleGenerateEmail}
                            disabled={loading || selectedCars.length === 0}
                            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-100 transition-all"
                        >
                            {loading ? <Loader2 className="animate-spin w-5 h-5"/> : <Zap className="w-5 h-5" />} Genera Email Personalizzata
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <MessageSquare className="w-20 h-20 mb-4 opacity-5" />
                    <p className="font-medium">Seleziona un lead per creare una campagna marketing.</p>
                </div>
            )}
            </div>
        </div>
      )}

      {activeTab === 'search' && (
          <div className="flex-1 flex flex-col space-y-6 overflow-hidden">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-end animate-in fade-in duration-500">
                  <div className="flex-[2] w-full">
                      <label className="text-[10px] font-bold text-indigo-600 uppercase mb-1 block ml-2 tracking-widest">Settore Specifico (es. Studi Legali, Farmacie)</label>
                      <input type="text" placeholder="Settore da scansionare..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" value={searchTarget} onChange={e => setSearchTarget(e.target.value)} />
                  </div>
                  <div className="flex-1 w-full">
                      <label className="text-[10px] font-bold text-indigo-600 uppercase mb-1 block ml-2 tracking-widest">Area Geografica</label>
                      <input type="text" placeholder="Milano, Roma..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" value={searchLocation} onChange={e => setSearchLocation(e.target.value)} />
                  </div>
                  <button onClick={handleSearchLeads} disabled={searchLoading || !searchTarget} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 h-[46px] disabled:opacity-50 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all">
                     {searchLoading ? <Loader2 className="animate-spin w-5 h-5"/> : <Search className="w-5 h-5"/>} Avvia Radar AI
                  </button>
              </div>

              {quotaError && (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center justify-between animate-in slide-in-from-top duration-300">
                      <div className="flex items-center gap-3">
                          <ShieldAlert className="w-6 h-6 text-amber-600" />
                          <div>
                              <p className="font-bold text-amber-900 text-sm">Quota API Esaurita</p>
                              <p className="text-amber-700 text-xs">Il limite di ricerca per la chiave condivisa è stato raggiunto. Usa una chiave API personale.</p>
                          </div>
                      </div>
                      <button 
                        onClick={handleOpenApiKeyDialog}
                        className="bg-amber-600 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-amber-700 flex items-center gap-2 shadow-sm"
                      >
                          <Key className="w-4 h-4"/> Usa la mia Chiave API
                      </button>
                  </div>
              )}

              <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden min-h-0">
                  <div className="lg:col-span-2 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                      {searchLoading && (
                          <div className="h-64 flex flex-col items-center justify-center bg-white rounded-2xl border-2 border-dashed border-indigo-100 animate-pulse text-indigo-600">
                              <Loader2 className="w-12 h-12 animate-spin mb-4"/>
                              <div className="text-center">
                                <p className="font-bold text-lg">Ricerca su Google in corso...</p>
                                <p className="text-sm text-indigo-400">Sto filtrando le aziende per settore "${searchTarget}"</p>
                              </div>
                          </div>
                      )}

                      {!searchLoading && foundLeads.map((lead, idx) => (
                          <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 animate-in slide-in-from-bottom duration-300 hover:shadow-md transition-all">
                              <div className="flex-1">
                                  <div className="flex justify-between items-start mb-2">
                                      <h4 className="font-bold text-slate-900 text-lg">{lead.name}</h4>
                                      <span className="text-[10px] font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full uppercase flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Target Valido</span>
                                  </div>
                                  <p className="text-xs text-slate-500 mb-4 flex items-center gap-1 font-medium"><MapPin className="w-3 h-3 text-red-400"/> {lead.location}</p>
                                  
                                  <div className="bg-indigo-50/50 p-4 rounded-2xl border-l-4 border-indigo-400 mb-4 shadow-inner">
                                      <p className="text-[10px] font-bold text-indigo-500 uppercase mb-1 flex items-center gap-1">Strategia di Contatto Suggerita</p>
                                      <p className="text-sm text-indigo-900 font-semibold italic">"{lead.interest}"</p>
                                  </div>

                                  <div className="flex gap-4 text-xs font-bold text-slate-400">
                                      {lead.email && <span className="flex items-center gap-1 hover:text-indigo-600 transition-colors cursor-default"><Mail className="w-3.5 h-3.5"/> {lead.email}</span>}
                                      {lead.phone && <span className="flex items-center gap-1 hover:text-indigo-600 transition-colors cursor-default"><Phone className="w-3.5 h-3.5"/> {lead.phone}</span>}
                                  </div>
                              </div>
                              <div className="flex md:flex-col justify-center gap-2">
                                  <button onClick={() => importLead(lead)} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-all flex items-center gap-2">
                                      <Plus className="w-4 h-4"/> Importa Lead
                                  </button>
                                  <button className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 flex items-center gap-2">
                                      <Globe className="w-4 h-4"/> Vedi Sito
                                  </button>
                              </div>
                          </div>
                      ))}
                      {!searchLoading && foundLeads.length === 0 && searchTarget && !quotaError && (
                          <div className="h-64 flex flex-col items-center justify-center bg-white rounded-2xl border-2 border-dashed text-slate-300">
                              <AlertCircle className="w-12 h-12 mb-2 opacity-10"/>
                              <p>Nessun lead trovato per questi parametri.</p>
                          </div>
                      )}
                  </div>

                  {/* Sources & Context Side Column */}
                  <div className="space-y-6 h-full flex flex-col">
                      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex-[1.5] flex flex-col">
                          <div className="p-3 bg-slate-50 border-b flex items-center gap-2">
                              <Map className="w-4 h-4 text-indigo-600"/>
                              <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">Mappa Risultati</span>
                          </div>
                          <div className="flex-1 bg-slate-100 relative">
                              {foundLeads.length > 0 ? (
                                  <iframe width="100%" height="100%" frameBorder="0" src={`https://maps.google.com/maps?q=${encodeURIComponent(searchTarget + ' ' + searchLocation)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}></iframe>
                              ) : (
                                  <div className="h-full flex items-center justify-center text-slate-300 italic text-xs text-center p-8">Cerca per visualizzare i potenziali clienti sulla mappa geolocalizzata.</div>
                              )}
                          </div>
                      </div>

                      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex-1 flex flex-col">
                          <div className="p-3 bg-slate-50 border-b flex items-center gap-2">
                              <Link2 className="w-4 h-4 text-indigo-600"/>
                              <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">Fonti Grounding AI</span>
                          </div>
                          <div className="flex-1 p-4 overflow-y-auto space-y-2 bg-slate-50/30">
                              {foundSources.length > 0 ? foundSources.map((source, i) => (
                                  <div key={i} className="text-[10px] text-slate-500 bg-white border border-slate-200 p-2 rounded-lg flex items-center gap-2 hover:border-indigo-200 transition-colors">
                                      <div className="w-4 h-4 bg-indigo-50 text-indigo-600 rounded flex items-center justify-center font-bold">{i+1}</div>
                                      <span className="truncate flex-1">{source.web?.uri || source.maps?.uri}</span>
                                      <ExternalLink className="w-3 h-3 text-slate-300"/>
                                  </div>
                              )) : (
                                  <div className="h-full flex items-center justify-center text-slate-300 text-[10px] text-center italic">Le fonti della ricerca appariranno qui per verifica dati.</div>
                              )}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {showCarPicker && (
          <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowCarPicker(false)}>
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 max-h-[70vh] flex flex-col animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-slate-900">Seleziona Veicoli</h3>
                        <p className="text-xs text-slate-400">Scegli le auto da inserire nella proposta marketing.</p>
                      </div>
                      <button onClick={() => setShowCarPicker(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6"/></button>
                  </div>
                  <div className="overflow-y-auto space-y-2 pr-2 custom-scrollbar flex-1">
                      {fleet.map(car => (
                          <div 
                            key={car.id} 
                            onClick={() => {
                                if (selectedCars.find(c => c.id === car.id)) setSelectedCars(prev => prev.filter(c => c.id !== car.id));
                                else setSelectedCars(prev => [...prev, car]);
                            }}
                            className={`p-3 rounded-2xl border-2 flex items-center gap-4 cursor-pointer transition-all ${selectedCars.find(c => c.id === car.id) ? 'border-indigo-600 bg-indigo-50 shadow-sm' : 'border-slate-100 hover:border-slate-200 bg-white'}`}
                          >
                              <img src={car.image} className="w-16 h-10 object-cover rounded-lg shadow-sm" alt="car" />
                              <div className="flex-1 text-sm font-bold text-slate-800">{car.brand} {car.model}</div>
                              {selectedCars.find(c => c.id === car.id) ? <CheckCircle2 className="w-5 h-5 text-indigo-600"/> : <div className="w-5 h-5 rounded-full border-2 border-slate-200"/>}
                          </div>
                      ))}
                  </div>
                  <button onClick={() => setShowCarPicker(false)} className="w-full mt-6 bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg">Conferma ({selectedCars.length})</button>
              </div>
          </div>
      )}

      {toast.visible && (
        <div className="fixed bottom-10 right-10 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-5 z-[200] border border-white/10">
            <span className="font-bold text-sm flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-400"/> {toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default MarketingLeads;