import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Agent, Contract } from '../types';
import { Briefcase, MapPin, TrendingUp, MoreHorizontal, ShieldCheck, X, DollarSign, FileText, Plus, Save, CreditCard, Building, Printer, Share2 } from 'lucide-react';

const AgentsManager: React.FC = () => {
  const { agents, contracts, fleet, clients, addAgent } = useApp();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  
  // New Mandate Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAgent, setNewAgent] = useState<Partial<Agent> & { billing: Partial<Agent['billing']> }>({
      commissionRate: 10,
      region: '',
      billing: { paymentTerms: '30gg d.f.' }
  });

  const getAgentContracts = (agentId: string) => contracts.filter(c => c.agentId === agentId);
  
  const getAgentTotalCommission = (agentId: string) => {
      return getAgentContracts(agentId).reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
  };

  const handleCreateAgent = (e: React.FormEvent) => {
      e.preventDefault();
      if(!newAgent.name || !newAgent.nickname || !newAgent.region) return;

      const agent: Agent = {
          id: Date.now().toString(),
          name: newAgent.name,
          nickname: newAgent.nickname.toLowerCase().trim(),
          region: newAgent.region,
          commissionRate: Number(newAgent.commissionRate) || 10,
          activeClients: 0,
          status: 'Attivo',
          mandateStart: new Date().toISOString().split('T')[0],
          billing: {
              iban: newAgent.billing?.iban || '',
              bankName: newAgent.billing?.bankName || '',
              vatNumber: newAgent.billing?.vatNumber || '',
              billingAddress: newAgent.billing?.billingAddress || '',
              paymentTerms: newAgent.billing?.paymentTerms || '30gg d.f.'
          }
      };

      addAgent(agent);
      setShowAddModal(false);
      setNewAgent({ commissionRate: 10, region: '', billing: { paymentTerms: '30gg d.f.' } });
      alert(`Mandato attivato per ${agent.name}. Ora può accedere all'App con nickname: ${agent.nickname}`);
  };

  const handlePrint = () => {
      window.print();
  };

  const handleShare = async () => {
      if(!selectedAgent) return;
      const text = `Dati Agente: ${selectedAgent.name}\nTotale Provvigioni: €${getAgentTotalCommission(selectedAgent.id)}`;
      if(navigator.share) {
          try {
              await navigator.share({
                  title: `Report Agente ${selectedAgent.name}`,
                  text: text
              });
          } catch(e) { console.error(e) }
      } else {
          alert("Condivisione non supportata dal browser. Dati copiati.");
      }
  };

  return (
    <div className="p-6 relative h-full">
      <div className="flex justify-between items-center mb-8 print:hidden">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Gestione Subagenti</h2>
          <p className="text-slate-500">Monitoraggio rete vendita e mandati.</p>
        </div>
        <button 
            onClick={() => setShowAddModal(true)}
            className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-lg shadow-slate-900/20"
        >
          <Plus className="w-4 h-4" /> Nuovo Mandato
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:hidden">
        {agents.map(agent => (
          <div key={agent.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl">
                  {agent.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{agent.name}</h3>
                  <div className="flex items-center text-xs text-slate-500 gap-1">
                    <MapPin className="w-3 h-3" /> {agent.region}
                  </div>
                </div>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-bold ${agent.status === 'Attivo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {agent.status}
              </span>
            </div>
            
            <div className="space-y-3">
               <div className="flex justify-between items-center text-sm">
                 <span className="text-slate-500">Nickname Login</span>
                 <span className="font-mono bg-slate-100 px-2 rounded text-slate-700">{agent.nickname}</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                 <span className="text-slate-500">Clienti Attivi</span>
                 <span className="font-medium text-slate-800">{agent.activeClients}</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                 <span className="text-slate-500">Provvigione</span>
                 <span className="font-bold text-indigo-600">{agent.commissionRate}%</span>
               </div>
               
               {/* Financial Summary Preview */}
               <div className="mt-3 bg-green-50 p-2 rounded-lg flex justify-between items-center border border-green-100">
                   <span className="text-xs font-bold text-green-800 uppercase">Tot. Provvigioni</span>
                   <span className="font-bold text-green-700">€ {getAgentTotalCommission(agent.id).toLocaleString()}</span>
               </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
              <button 
                onClick={() => setSelectedAgent(agent)}
                className="flex-1 bg-slate-900 text-white py-2 rounded-lg text-sm font-bold hover:bg-slate-700"
              >
                Dettagli & Fatture
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Agent Modal */}
      {showAddModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-indigo-600"/> Attivazione Mandato</h3>
                      <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6"/></button>
                  </div>
                  
                  <form onSubmit={handleCreateAgent} className="space-y-4">
                      {/* Personal Info */}
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-4">
                        <h4 className="text-xs font-bold uppercase text-slate-500">Dati Anagrafici</h4>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nome e Cognome</label>
                            <input type="text" required className="w-full p-2 border rounded" placeholder="Es. Mario Rossi" value={newAgent.name || ''} onChange={e => setNewAgent({...newAgent, name: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nickname (App)</label>
                                <input type="text" required className="w-full p-2 border rounded font-mono" placeholder="mario_r" value={newAgent.nickname || ''} onChange={e => setNewAgent({...newAgent, nickname: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Zona</label>
                                <input type="text" required className="w-full p-2 border rounded" placeholder="Lombardia" value={newAgent.region || ''} onChange={e => setNewAgent({...newAgent, region: e.target.value})} />
                            </div>
                        </div>
                      </div>

                      {/* Billing Info */}
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-4">
                        <h4 className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1"><CreditCard className="w-3 h-3"/> Dati Fatturazione & Pagamenti</h4>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">P.IVA / Cod. Fiscale</label>
                            <input type="text" className="w-full p-2 border rounded" placeholder="00000000000" value={newAgent.billing?.vatNumber || ''} onChange={e => setNewAgent({...newAgent, billing: {...newAgent.billing, vatNumber: e.target.value}})} />
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">Indirizzo Fiscale</label>
                             <input type="text" className="w-full p-2 border rounded" placeholder="Via Roma 1, Milano" value={newAgent.billing?.billingAddress || ''} onChange={e => setNewAgent({...newAgent, billing: {...newAgent.billing, billingAddress: e.target.value}})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Banca</label>
                                <input type="text" className="w-full p-2 border rounded" placeholder="Intesa" value={newAgent.billing?.bankName || ''} onChange={e => setNewAgent({...newAgent, billing: {...newAgent.billing, bankName: e.target.value}})} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Provvigione %</label>
                                <input type="number" className="w-full p-2 border rounded" value={newAgent.commissionRate} onChange={e => setNewAgent({...newAgent, commissionRate: Number(e.target.value)})} />
                            </div>
                        </div>
                         <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">IBAN</label>
                             <input type="text" className="w-full p-2 border rounded font-mono" placeholder="IT000..." value={newAgent.billing?.iban || ''} onChange={e => setNewAgent({...newAgent, billing: {...newAgent.billing, iban: e.target.value}})} />
                        </div>
                      </div>

                      <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200">
                          <Save className="w-5 h-5"/> Attiva Mandato
                      </button>
                  </form>
              </div>
          </div>
      )}

      {/* Agent Details Modal (Existing) */}
      {selectedAgent && (
          <div className="fixed inset-0 bg-white z-50 overflow-y-auto animate-in slide-in-from-bottom">
              <div className="max-w-5xl mx-auto p-8">
                  <div className="flex justify-between items-center mb-8 print:hidden">
                      <div>
                        <h2 className="text-3xl font-bold text-slate-900">Scheda Agente: {selectedAgent.name}</h2>
                        <p className="text-slate-500">ID: {selectedAgent.id} • Mandato dal: {selectedAgent.mandateStart}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleShare} className="px-4 py-2 border border-slate-300 rounded-lg flex items-center gap-2 hover:bg-slate-50 text-slate-700 font-medium">
                            <Share2 className="w-4 h-4"/> Condividi
                        </button>
                        <button onClick={handlePrint} className="px-4 py-2 bg-slate-900 text-white rounded-lg flex items-center gap-2 hover:bg-slate-800 font-medium shadow-lg">
                            <Printer className="w-4 h-4"/> Stampa Report
                        </button>
                        <button onClick={() => setSelectedAgent(null)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full ml-2"><X className="w-6 h-6"/></button>
                      </div>
                  </div>

                  {/* Print Header */}
                  <div className="hidden print:block mb-8 border-b-2 border-slate-900 pb-4">
                      <h1 className="text-2xl font-bold">Report Attività Agente</h1>
                      <p>RentSync AI - Documento generato il {new Date().toLocaleDateString()}</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                      {/* KPIs */}
                      <div className="lg:col-span-3 grid grid-cols-3 gap-6">
                        <div className="bg-white border p-6 rounded-xl shadow-sm">
                            <p className="text-sm text-slate-500 mb-1">Totale Venduto</p>
                            <p className="text-2xl font-bold text-slate-800">€ {getAgentContracts(selectedAgent.id).reduce((s, c) => s + c.totalAmount, 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-indigo-600 text-white p-6 rounded-xl shadow-lg shadow-indigo-200 print:bg-white print:text-black print:border">
                            <p className="text-sm text-indigo-100 print:text-slate-500 mb-1">Provvigioni Maturate</p>
                            <p className="text-3xl font-bold">€ {getAgentTotalCommission(selectedAgent.id).toLocaleString()}</p>
                        </div>
                        <div className="bg-white border p-6 rounded-xl shadow-sm">
                            <p className="text-sm text-slate-500 mb-1">Contratti Chiusi</p>
                            <p className="text-2xl font-bold text-slate-800">{getAgentContracts(selectedAgent.id).length}</p>
                        </div>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Left: Contracts */}
                      <div className="lg:col-span-2">
                          <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><FileText className="w-5 h-5"/> Lista Contratti</h3>
                          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                              <table className="w-full text-left">
                                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                      <tr>
                                          <th className="p-4">Data</th>
                                          <th className="p-4">Cliente</th>
                                          <th className="p-4">Auto</th>
                                          <th className="p-4 text-right">Totale</th>
                                          <th className="p-4 text-right">Provvigione</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                      {getAgentContracts(selectedAgent.id).map(contract => {
                                          const car = fleet.find(c => c.id === contract.carId);
                                          const client = clients.find(c => c.id === contract.clientId);
                                          return (
                                              <tr key={contract.id}>
                                                  <td className="p-4 text-sm text-slate-500">{new Date(contract.signedDate).toLocaleDateString()}</td>
                                                  <td className="p-4 font-medium">{client?.name || 'N/A'}</td>
                                                  <td className="p-4 text-sm text-slate-600">{car?.brand} {car?.model}</td>
                                                  <td className="p-4 text-right">€ {contract.totalAmount.toLocaleString()}</td>
                                                  <td className="p-4 text-right font-bold text-green-600">€ {contract.commissionAmount.toLocaleString()}</td>
                                              </tr>
                                          )
                                      })}
                                      {getAgentContracts(selectedAgent.id).length === 0 && (
                                          <tr>
                                              <td colSpan={5} className="p-8 text-center text-slate-400 italic">Nessun contratto registrato per questo agente.</td>
                                          </tr>
                                      )}
                                  </tbody>
                              </table>
                          </div>
                      </div>

                      {/* Right: Billing Info */}
                      <div>
                          <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5"/> Dati Fatturazione</h3>
                          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 space-y-4">
                              <div>
                                  <label className="text-xs font-bold text-slate-500 uppercase">Ragione Sociale / Nome</label>
                                  <p className="font-medium text-slate-900">{selectedAgent.name}</p>
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-slate-500 uppercase">P.IVA / C.F.</label>
                                  <p className="font-mono text-slate-900">{selectedAgent.billing?.vatNumber || '-'}</p>
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-slate-500 uppercase">Indirizzo</label>
                                  <p className="text-slate-900">{selectedAgent.billing?.billingAddress || '-'}</p>
                              </div>
                              <div className="pt-4 border-t border-slate-200">
                                  <label className="text-xs font-bold text-slate-500 uppercase">Banca</label>
                                  <p className="text-slate-900">{selectedAgent.billing?.bankName || '-'}</p>
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-slate-500 uppercase">IBAN</label>
                                  <p className="font-mono text-sm text-slate-900 break-all">{selectedAgent.billing?.iban || '-'}</p>
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-slate-500 uppercase">Condizioni Pagamento</label>
                                  <p className="text-slate-900">{selectedAgent.billing?.paymentTerms || '-'}</p>
                              </div>
                          </div>
                          
                          <div className="mt-6 bg-yellow-50 p-4 rounded-xl border border-yellow-100 print:hidden">
                              <p className="text-sm text-yellow-800 font-medium">Nota Amministrativa</p>
                              <p className="text-xs text-yellow-700 mt-1">Le fatture proforma vengono generate automaticamente il 30 del mese.</p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AgentsManager;