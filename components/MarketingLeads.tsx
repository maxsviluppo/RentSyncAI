import React, { useState } from 'react';
import { generateMarketingCopy, findLeads, generateMarketingABTest, askGeminiFlash, findStrategicLeads } from '../services/gemini';
import { useApp } from '../contexts/AppContext';
import { MarketingLead } from '../types';
import { Mail, MessageSquare, Loader2, UserPlus, Search, Globe, Plus, Sparkles, MapPin, Upload, X, FileText, Database, FlaskConical, MousePointerClick } from 'lucide-react';

const MarketingLeads: React.FC = () => {
  const { leads, addLead } = useApp();
  const [activeTab, setActiveTab] = useState<'list' | 'search' | 'strategy'>('list');

  // AI Lab State
  const [labPrompt, setLabPrompt] = useState('');
  const [labResult, setLabResult] = useState('');
  const [labLoading, setLabLoading] = useState(false);

  const handleLabRun = async () => {
    if (!labPrompt) return;
    setLabLoading(true);
    setLabResult('');
    try {
      const res = await askGeminiFlash(labPrompt);
      setLabResult(res);
    } catch (e) { 
      console.error(e);
      setLabResult("Errore nella comunicazione con l'IA. Riprova più tardi.");
    } finally {
      setLabLoading(false);
    }
  };

  // Email Gen State
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [abTestResult, setAbTestResult] = useState<{ variantA: string, variantB: string, analysis: string } | null>(null);
  const [mode, setMode] = useState<'standard' | 'ab_test'>('standard');
  const [loading, setLoading] = useState(false);
  const [tone, setTone] = useState('Professionale e Persuasivo');

  // Lead Finder State
  const [searchTarget, setSearchTarget] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [foundLeads, setFoundLeads] = useState<Partial<MarketingLead>[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Modals State
  const [showManualModal, setShowManualModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // New Manual Lead State
  const [newLead, setNewLead] = useState<Partial<MarketingLead>>({
    name: '',
    company: '',
    interest: '',
    location: ''
  });

  // Import State
  const [importText, setImportText] = useState('');

  const handleGenerateEmail = async () => {
    if (!selectedLead) return;
    setLoading(true);
    setGeneratedEmail('');
    setAbTestResult(null);

    try {
      if (mode === 'standard') {
        const copy = await generateMarketingCopy(selectedLead.name, selectedLead.interest, tone);
        setGeneratedEmail(copy);
      } else {
        const result = await generateMarketingABTest(selectedLead.name, selectedLead.interest);
        setAbTestResult(result);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchLeads = async () => {
    if (!searchTarget || !searchLocation) return;
    setSearchLoading(true);
    setFoundLeads([]);
    try {
      const results = await findLeads(searchTarget, searchLocation);
      setFoundLeads(results);
    } catch (e) {
      alert("Errore ricerca lead");
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
      location: lead.location
    });
    alert(`Lead ${lead.name} importato con successo!`);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.name) return;
    addLead({
      id: Date.now().toString(),
      name: newLead.name,
      company: newLead.company || newLead.name,
      interest: newLead.interest || 'Noleggio Generale',
      status: 'New',
      source: 'Manual',
      location: newLead.location
    });
    setNewLead({ name: '', company: '', interest: '', location: '' });
    setShowManualModal(false);
  };

  const handleImportSubmit = () => {
    if (!importText) return;
    // Simple CSV parser: Name, Company, Interest
    const lines = importText.split('\n');
    let count = 0;
    lines.forEach((line, idx) => {
      if (!line.trim()) return;
      const parts = line.split(',');
      if (parts.length >= 1) {
        addLead({
          id: `IMP-${Date.now()}-${idx}`,
          name: parts[0].trim(),
          company: parts[1]?.trim() || parts[0].trim(),
          interest: parts[2]?.trim() || 'Importato',
          status: 'New',
          source: 'External',
          location: parts[3]?.trim() || ''
        });
        count++;
      }
    });
    setImportText('');
    setShowImportModal(false);
    alert(`${count} contatti importati correttamente!`);
  };

  return (
    <div className="p-6 h-full flex flex-col relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Marketing & Lead Generation</h2>
          <p className="text-slate-500">Gestisci i contatti e trova nuovi clienti con l'AI.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'list' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border'}`}
          >
            Lista Contatti
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'search' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 border border-indigo-200'}`}
          >
            <Globe className="w-4 h-4" /> Ricerca Google AI
          </button>
          <button
            onClick={() => setActiveTab('strategy')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'strategy' ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-600 border border-emerald-200'}`}
          >
            <Sparkles className="w-4 h-4" /> Lead Sniper (AI Strategy)
          </button>
        </div>
      </div>

      {activeTab === 'list' && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
          {/* Lead List */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <span className="font-bold text-slate-700">Contatti Attivi</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setShowManualModal(true)}
                  className="p-1.5 hover:bg-white rounded text-slate-600 hover:text-indigo-600 transition-colors"
                  title="Aggiungi Manualmente"
                >
                  <UserPlus className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="p-1.5 hover:bg-white rounded text-slate-600 hover:text-green-600 transition-colors"
                  title="Importa da CSV/Excel"
                >
                  <Upload className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1">
              {leads.map(lead => (
                <div
                  key={lead.id}
                  onClick={() => { setSelectedLead(lead); setGeneratedEmail(''); }}
                  className={`p-4 border-b border-slate-50 cursor-pointer transition-colors hover:bg-slate-50 ${selectedLead?.id === lead.id ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-800">{lead.name}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${lead.source === 'AI_Search' ? 'bg-purple-100 text-purple-700' :
                      lead.source === 'External' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                      {lead.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">{lead.company}</p>
                  <p className="text-xs text-slate-400 mt-2 truncate">Interesse: {lead.interest}</p>
                  <div className="mt-1 flex items-center gap-2">
                    {lead.source === 'AI_Search' && <span className="text-[10px] text-purple-600 flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI</span>}
                    {lead.source === 'External' && <span className="text-[10px] text-orange-600 flex items-center gap-1"><Database className="w-3 h-3" /> Import</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Action Panel */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col">
            {selectedLead ? (
              <div className="p-6 flex flex-col h-full">
                <div className="mb-6 pb-6 border-b border-slate-100">
                  <h3 className="text-xl font-bold text-slate-800 mb-1">Azione Marketing per: {selectedLead.name}</h3>
                  <p className="text-slate-500 text-sm">Genera un'email personalizzata basata sull'interesse: <span className="font-semibold">{selectedLead.interest}</span></p>
                </div>

                <div className="flex gap-4 mb-4">
                  <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <button
                      onClick={() => setMode('standard')}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${mode === 'standard' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Standard
                    </button>
                    <button
                      onClick={() => setMode('ab_test')}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${mode === 'ab_test' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      <FlaskConical className="w-3 h-3" /> A/B Test AI
                    </button>
                  </div>

                  {mode === 'standard' && (
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="p-2 border border-slate-300 rounded-lg text-sm flex-1"
                    >
                      <option>Professionale e Persuasivo</option>
                      <option>Amichevole e Informale</option>
                      <option>Urgente (Offerta limitata)</option>
                    </select>
                  )}

                  <button
                    onClick={handleGenerateEmail}
                    disabled={loading}
                    className="bg-slate-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-800 flex items-center gap-2 ml-auto"
                  >
                    {loading ? <Loader2 className="animate-spin w-4 h-4" /> : (mode === 'standard' ? <MessageSquare className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />)}
                    {mode === 'standard' ? 'Genera Email' : 'Avvia Test A/B'}
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {mode === 'standard' ? (
                    <div className="h-full bg-slate-50 rounded-lg border border-slate-200 p-4 relative min-h-[300px]">
                      {generatedEmail ? (
                        <textarea
                          className="w-full h-full bg-transparent resize-none outline-none text-slate-700 leading-relaxed p-2"
                          value={generatedEmail}
                          onChange={(e) => setGeneratedEmail(e.target.value)}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-400 text-sm italic">
                          Il contenuto generato dall'IA apparirà qui...
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {!abTestResult && !loading && (
                        <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                          <FlaskConical className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                          <p className="text-slate-500">Avvia il test per generare due varianti a confronto.</p>
                        </div>
                      )}

                      {abTestResult && (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-xl border-2 border-slate-100 hover:border-indigo-200 transition-colors relative group">
                              <div className="absolute -top-3 left-4 bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-bold border border-slate-200">Variante A (Razionale)</div>
                              <textarea
                                className="w-full h-48 bg-transparent resize-none outline-none text-sm text-slate-700 mt-2"
                                value={abTestResult.variantA}
                                readOnly
                              />
                              <button className="w-full mt-2 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 py-2 rounded-lg text-xs font-bold border border-slate-200 transition-colors">Seleziona A</button>
                            </div>
                            <div className="bg-white p-4 rounded-xl border-2 border-slate-100 hover:border-pink-200 transition-colors relative group">
                              <div className="absolute -top-3 left-4 bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-bold border border-slate-200">Variante B (Emozionale)</div>
                              <textarea
                                className="w-full h-48 bg-transparent resize-none outline-none text-sm text-slate-700 mt-2"
                                value={abTestResult.variantB}
                                readOnly
                              />
                              <button className="w-full mt-2 bg-slate-50 hover:bg-pink-50 text-slate-600 hover:text-pink-600 py-2 rounded-lg text-xs font-bold border border-slate-200 transition-colors">Seleziona B</button>
                            </div>
                          </div>
                          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex gap-3">
                            <Sparkles className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-bold text-indigo-900 text-sm mb-1">Analisi IA</h4>
                              <p className="text-sm text-indigo-800/80 leading-relaxed">{abTestResult.analysis}</p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {mode === 'standard' && (
                  <div className="mt-4 flex justify-end">
                    <button
                      disabled={!generatedEmail}
                      className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4" /> Invia Email
                    </button>
                  </div>
                )}

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
                <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
                <p>Seleziona un lead dalla lista per iniziare le azioni di marketing.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'strategy' && <StrategicLeadsTab />}

      {activeTab === 'search' && (
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white">
            <h3 className="text-xl font-bold text-indigo-900 mb-2 flex items-center gap-2">
              <Globe className="w-6 h-6" /> Ricerca Lead Google AI
            </h3>
            <p className="text-slate-600 mb-6 max-w-2xl">
              Usa la potenza di <strong>Google Search (Grounding)</strong> per trovare aziende reali nella tua zona.
              Gemini analizzerà i risultati web in tempo reale e suggerirà potenziali motivi di noleggio.
            </p>

            <div className="flex gap-4 max-w-3xl">
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Target (Chi cerchi?)</label>
                <input
                  type="text"
                  placeholder="es. Architetti, Imprese Edili, Ristoranti"
                  className="w-full p-3 border rounded-xl mt-1 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={searchTarget}
                  onChange={e => setSearchTarget(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Zona (Dove?)</label>
                <input
                  type="text"
                  placeholder="es. Milano Centro, Torino Nord"
                  className="w-full p-3 border rounded-xl mt-1 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={searchLocation}
                  onChange={e => setSearchLocation(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleSearchLeads}
                  disabled={searchLoading || !searchTarget || !searchLocation}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center gap-2 h-[50px]"
                >
                  {searchLoading ? <Loader2 className="animate-spin" /> : <Search className="w-5 h-5" />}
                  Cerca Ora
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
            {searchLoading ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <Loader2 className="w-12 h-12 mb-4 text-indigo-600 animate-spin" />
                <p className="animate-pulse">Analisi del web in corso...</p>
              </div>
            ) : foundLeads.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {foundLeads.map((lead, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold text-lg text-slate-800">{lead.name}</h4>
                      <div className="bg-green-100 text-green-700 p-1 rounded-full"><Sparkles className="w-3 h-3" /></div>
                    </div>
                    <div className="flex items-center text-sm text-slate-500 mb-3">
                      <MapPin className="w-4 h-4 mr-1" /> {lead.location}
                    </div>
                    <div className="bg-indigo-50 p-3 rounded-lg mb-4">
                      <p className="text-xs font-bold text-indigo-400 uppercase mb-1">Potenziale Bisogno</p>
                      <p className="text-sm text-indigo-900 italic">"{lead.interest}"</p>
                    </div>
                    <button
                      onClick={() => importLead(lead)}
                      className="w-full py-2 border-2 border-slate-900 text-slate-900 font-bold rounded-lg hover:bg-slate-900 hover:text-white transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Importa nel CRM
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-400 mt-20">
                <Globe className="w-16 h-16 mx-auto mb-4 opacity-10" />
                <p>Nessun risultato. Avvia una ricerca per trovare lead reali.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Entry Modal */}
      {showManualModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2"><UserPlus className="w-6 h-6 text-indigo-600" /> Nuovo Lead Manuale</h3>
              <button onClick={() => setShowManualModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome / Riferimento</label>
                <input type="text" required className="w-full p-3 border rounded-lg" placeholder="Mario Rossi / Ditta ABC" value={newLead.name} onChange={e => setNewLead({ ...newLead, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Azienda (Opzionale)</label>
                <input type="text" className="w-full p-3 border rounded-lg" placeholder="ABC Srl" value={newLead.company} onChange={e => setNewLead({ ...newLead, company: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Luogo</label>
                <input type="text" className="w-full p-3 border rounded-lg" placeholder="Milano" value={newLead.location} onChange={e => setNewLead({ ...newLead, location: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Interesse / Note</label>
                <input type="text" className="w-full p-3 border rounded-lg" placeholder="Interessato a flotta furgoni" value={newLead.interest} onChange={e => setNewLead({ ...newLead, interest: e.target.value })} />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 mt-2">Salva Contatto</button>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-in zoom-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2"><Upload className="w-6 h-6 text-green-600" /> Importa Dati Esterni</h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
            </div>
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600 border border-slate-200">
                <p className="font-bold mb-2">Formato supportato (CSV Semplice):</p>
                <code className="block bg-white p-2 rounded border border-slate-200 font-mono text-xs">
                  Nome, Azienda, Interesse, Luogo<br />
                  Mario Rossi, Rossi Srl, Furgone, Roma<br />
                  Luigi Verdi, , Auto Sportiva, Milano
                </code>
              </div>
              <textarea
                className="w-full h-40 p-3 border rounded-lg font-mono text-sm"
                placeholder="Incolla qui i tuoi dati..."
                value={importText}
                onChange={e => setImportText(e.target.value)}
              ></textarea>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowImportModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Annulla</button>
                <button onClick={handleImportSubmit} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold">Importa Dati</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// --- STRATEGIC LEADS COMPONENT ---
const StrategicLeadsTab = () => {
  const { addLead } = useApp();
  const [sector, setSector] = useState('');
  const [location, setLocation] = useState('');
  const [size, setSize] = useState('');
  const [goal, setGoal] = useState('Noleggio Lungo Termine');
  const [results, setResults] = useState<{ leads: Partial<MarketingLead>[], strategy: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleStrategicSearch = async () => {
    if (!sector || !location) return;
    setLoading(true);
    setResults(null);
    try {
      const res = await findStrategicLeads(sector, location, size, goal);
      setResults(res);
    } catch (e) {
      console.error(e);
      alert("Errore nella ricerca strategica.");
    } finally {
      setLoading(false);
    }
  };

  const importLead = (lead: Partial<MarketingLead>) => {
    addLead({
      id: Date.now().toString() + Math.random(),
      name: lead.name || 'Azienda Target',
      company: lead.company || lead.name || 'Azienda',
      interest: lead.interest || 'Lead Strategico',
      status: 'New',
      source: 'AI_Search',
      location: lead.location || location
    });
    alert(`Lead ${lead.name} importato nel CRM!`);
  };

  return (
    <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col lg:flex-row overflow-hidden">
      {/* Configuration Panel */}
      <div className="w-full lg:w-1/3 bg-slate-50 p-6 border-r border-slate-100 flex flex-col gap-6">
        <div>
          <h3 className="text-xl font-bold text-emerald-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-emerald-600" /> Lead Sniper
          </h3>
          <p className="text-sm text-slate-500 mt-2">
            L'AI analizza il territorio e trova aziende reali con alta probabilità di conversione per la tua offerta.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Settore Target</label>
            <input
              type="text"
              placeholder="es. Logistica, Edilizia, Installatori"
              className="w-full p-3 border rounded-xl mt-1 focus:ring-2 focus:ring-emerald-500 outline-none"
              value={sector}
              onChange={e => setSector(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Zona Operativa</label>
            <input
              type="text"
              placeholder="es. Provincia di Milano"
              className="w-full p-3 border rounded-xl mt-1 focus:ring-2 focus:ring-emerald-500 outline-none"
              value={location}
              onChange={e => setLocation(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Dimensione Azienda</label>
            <select
              className="w-full p-3 border rounded-xl mt-1 bg-white"
              value={size}
              onChange={e => setSize(e.target.value)}
            >
              <option value="">Qualsiasi Dimensione</option>
              <option value="Piccola (1-10 dipendenti)">Piccola (1-10 dipendenti)</option>
              <option value="Media (10-50 dipendenti)">Media (10-50 dipendenti)</option>
              <option value="Grande (>50 dipendenti)">Grande (&gt;50 dipendenti)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Obiettivo Offerta</label>
            <select
              className="w-full p-3 border rounded-xl mt-1 bg-white"
              value={goal}
              onChange={e => setGoal(e.target.value)}
            >
              <option value="Noleggio Lungo Termine">Noleggio Lungo Termine</option>
              <option value="Noleggio Furgoni/Veicoli Commerciali">Flotta Furgoni / Commerciali</option>
              <option value="Noleggio Breve Termine">Noleggio Breve Termine</option>
              <option value="Auto di Lusso / Rappresentanza">Auto di Lusso / Rappresentanza</option>
            </select>
          </div>

          <button
            onClick={handleStrategicSearch}
            disabled={loading || !sector || !location}
            className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Search className="w-5 h-5" />}
            Analizza e Trova Target
          </button>
        </div>
      </div>

      {/* Results Panel */}
      <div className="flex-1 p-6 overflow-y-auto bg-white relative">
        {!results && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-slate-300">
            <Globe className="w-24 h-24 mb-4 opacity-10" />
            <p className="font-medium text-slate-400">Configura la strategia a sinistra per iniziare.</p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-emerald-600 animate-pulse" />
              </div>
            </div>
            <p className="mt-4 text-emerald-800 font-medium animate-pulse">Analisi del territorio in corso...</p>
            <p className="text-xs text-emerald-600/60 mt-2">Sto identificando le aziende migliori su Google Maps</p>
          </div>
        )}

        {results && !loading && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">

            {/* Strategy Insight Card */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles className="w-32 h-32 text-emerald-600" />
              </div>
              <h4 className="font-bold text-emerald-900 text-lg mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5" /> Analisi Strategica AI
              </h4>
              <p className="text-emerald-800 leading-relaxed relative z-10">
                {results.strategy}
              </p>
            </div>

            {/* Leads Grid */}
            <div>
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-slate-500" />
                Top 5 Aziende Target Identificate
              </h4>
              <div className="grid grid-cols-1 gap-4">
                {results.leads.map((lead, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-all flex justify-between items-center group">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <div className="bg-slate-100 text-slate-600 font-bold w-8 h-8 rounded-lg flex items-center justify-center text-sm">
                          {idx + 1}
                        </div>
                        <h5 className="font-bold text-lg text-slate-800 group-hover:text-emerald-700 transition-colors">
                          {lead.name}
                        </h5>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500 mb-2 pl-11">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {lead.location}</span>
                      </div>
                      <p className="text-sm text-emerald-600 italic pl-11 border-l-2 border-emerald-100 bg-emerald-50/50 p-2 rounded-r-lg">
                        "{lead.interest}"
                      </p>
                    </div>
                    <button
                      onClick={() => importLead(lead)}
                      className="ml-4 bg-white text-slate-600 border border-slate-200 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> CRM
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default MarketingLeads;