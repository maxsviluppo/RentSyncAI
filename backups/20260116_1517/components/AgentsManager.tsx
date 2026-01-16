import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Agent, Contract } from '../types';
import { Briefcase, MapPin, TrendingUp, MoreHorizontal, ShieldCheck, X, DollarSign, FileText, Plus, Save, CreditCard, Building, Printer, Share2, ArrowRight, Smartphone } from 'lucide-react';

const AgentsManager: React.FC = () => {
    const { agents, contracts, fleet, clients, addAgent } = useApp();
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

    // New Mandate Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [newAgent, setNewAgent] = useState<Partial<Agent>>({
        commissionRate: 10,
        region: '',
        status: 'Attivo',
        billing: {
            vatNumber: '',
            billingAddress: '',
            iban: '',
            bankName: '',
            paymentTerms: '30gg d.f.'
        }
    });

    // Access Control Handler
    const toggleAgentAccess = (agent: Agent) => {
        // Logic to toggle status would go here (requires context update)
        // For now, we simulate UI toggle only or assume context has updateAgent
        alert(`Accesso ${agent.status === 'Attivo' ? 'Sospeso' : 'Riattivato'} per ${agent.nickname}`);
        // In real implementation: updateAgent({...agent, status: agent.status === 'Attivo' ? 'Sospeso' : 'Attivo'});
    };

    // Detail View State
    const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'contracts' | 'messages'>('overview');
    const [messageInput, setMessageInput] = useState('');

    // Helper to generate login link
    const getLoginLink = (nickname: string) => {
        return `${window.location.origin}?agent_ref=${nickname}`;
    };

    const getAgentContracts = (agentId: string) => contracts.filter(c => c.agentId === agentId);
    const getAgentClients = (agentId: string) => clients.filter(cl => cl.subagentId === agentId);

    const getAgentTotalCommission = (agentId: string) => {
        return getAgentContracts(agentId).reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
    };

    const handleCreateAgent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAgent.name || !newAgent.nickname || !newAgent.region) return;

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
        setNewAgent({
            commissionRate: 10,
            region: '',
            status: 'Attivo',
            billing: {
                vatNumber: '',
                billingAddress: '',
                iban: '',
                bankName: '',
                paymentTerms: '30gg d.f.'
            }
        });
        alert(`Mandato attivato per ${agent.name}. Ora può accedere all'App con nickname: ${agent.nickname}`);
    };

    const handlePrint = () => {
        window.print();
    };

    const handleShare = async () => {
        if (!selectedAgent) return;
        const text = `Dati Agente: ${selectedAgent.name}\nTotale Provvigioni: €${getAgentTotalCommission(selectedAgent.id)}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Report Agente ${selectedAgent.name}`,
                    text: text
                });
            } catch (e) { console.error(e) }
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
                            <h3 className="text-xl font-bold flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-indigo-600" /> Attivazione Mandato</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
                        </div>

                        <form onSubmit={handleCreateAgent} className="space-y-4">
                            {/* Personal Info */}
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-4">
                                <h4 className="text-xs font-bold uppercase text-slate-500">Dati Anagrafici</h4>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome e Cognome</label>
                                    <input type="text" required className="w-full p-2 border rounded" placeholder="Es. Mario Rossi" value={newAgent.name || ''} onChange={e => setNewAgent({ ...newAgent, name: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Nickname (App)</label>
                                        <input type="text" required className="w-full p-2 border rounded font-mono" placeholder="mario_r" value={newAgent.nickname || ''} onChange={e => setNewAgent({ ...newAgent, nickname: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Zona</label>
                                        <input type="text" required className="w-full p-2 border rounded" placeholder="Lombardia" value={newAgent.region || ''} onChange={e => setNewAgent({ ...newAgent, region: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            {/* Billing Info */}
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-4">
                                <h4 className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1"><CreditCard className="w-3 h-3" /> Dati Fatturazione & Pagamenti</h4>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">P.IVA / Cod. Fiscale</label>
                                    <input type="text" className="w-full p-2 border rounded" placeholder="00000000000" value={newAgent.billing?.vatNumber || ''} onChange={e => setNewAgent(prev => ({ ...prev, billing: { ...prev.billing!, vatNumber: e.target.value } }))} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Indirizzo Fiscale</label>
                                    <input type="text" className="w-full p-2 border rounded" placeholder="Via Roma 1, Milano" value={newAgent.billing?.billingAddress || ''} onChange={e => setNewAgent(prev => ({ ...prev, billing: { ...prev.billing!, billingAddress: e.target.value } }))} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Banca</label>
                                        <input type="text" className="w-full p-2 border rounded" placeholder="Intesa" value={newAgent.billing?.bankName || ''} onChange={e => setNewAgent(prev => ({ ...prev, billing: { ...prev.billing!, bankName: e.target.value } }))} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Provvigione %</label>
                                        <input type="number" className="w-full p-2 border rounded" value={newAgent.commissionRate} onChange={e => setNewAgent({ ...newAgent, commissionRate: Number(e.target.value) })} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">IBAN</label>
                                    <input type="text" className="w-full p-2 border rounded font-mono" placeholder="IT000..." value={newAgent.billing?.iban || ''} onChange={e => setNewAgent(prev => ({ ...prev, billing: { ...prev.billing!, iban: e.target.value } }))} />
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200">
                                <Save className="w-5 h-5" /> Attiva Mandato
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Agent Details Modal (Enhanced) */}
            {selectedAgent && (
                <div className="fixed inset-0 bg-white/50 z-50 overflow-y-auto animate-in slide-in-from-bottom backdrop-blur-sm flex justify-center items-start pt-10 pb-10">
                    <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                        {/* Header */}
                        <div className="p-8 border-b border-slate-100 flex justify-between items-start bg-slate-50">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-indigo-200">
                                    {selectedAgent.name.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-slate-900">{selectedAgent.name}</h2>
                                    <div className="flex items-center gap-2 text-slate-500 mt-1">
                                        <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-bold font-mono">ID: {selectedAgent.id}</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {selectedAgent.region}</span>
                                        <span>•</span>
                                        <span>Dal: {selectedAgent.mandateStart}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => toggleAgentAccess(selectedAgent)}
                                    className={`px-4 py-2 border rounded-lg flex items-center gap-2 font-medium transition-colors ${selectedAgent.status === 'Attivo' ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                                >
                                    {selectedAgent.status === 'Attivo' ? <X className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                                    {selectedAgent.status === 'Attivo' ? 'Blocca Accesso' : 'Attiva Accesso'}
                                </button>
                                <button onClick={handleShare} className="px-4 py-2 border border-slate-300 rounded-lg flex items-center gap-2 hover:bg-slate-50 text-slate-700 font-medium">
                                    <Share2 className="w-4 h-4" /> Condividi
                                </button>
                                <button onClick={handlePrint} className="px-4 py-2 bg-slate-900 text-white rounded-lg flex items-center gap-2 hover:bg-slate-800 font-medium shadow-lg">
                                    <Printer className="w-4 h-4" /> Stampa Report
                                </button>
                                <button onClick={() => setSelectedAgent(null)} className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-full ml-2 shadow-sm"><X className="w-5 h-5" /></button>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-slate-200 px-8">
                            <button onClick={() => setActiveTab('overview')} className={`py-4 px-6 font-bold text-sm border-b-2 transition-colors ${activeTab === 'overview' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                                Panoramica
                            </button>
                            <button onClick={() => setActiveTab('clients')} className={`py-4 px-6 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'clients' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                                Clienti <span className="bg-slate-100 text-slate-600 px-2 rounded-full text-xs">{getAgentClients(selectedAgent.id).length}</span>
                            </button>
                            <button onClick={() => setActiveTab('contracts')} className={`py-4 px-6 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'contracts' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                                Contratti <span className="bg-slate-100 text-slate-600 px-2 rounded-full text-xs">{getAgentContracts(selectedAgent.id).length}</span>
                            </button>
                            <button onClick={() => setActiveTab('messages')} className={`py-4 px-6 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'messages' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                                Messaggi & App
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 overflow-y-auto flex-1 bg-slate-50/50">

                            {/* OVERVIEW TAB */}
                            {activeTab === 'overview' && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Stats */}
                                    <div className="lg:col-span-3 grid grid-cols-3 gap-6 mb-2">
                                        <div className="bg-white border p-6 rounded-xl shadow-sm">
                                            <p className="text-sm text-slate-500 mb-1">Totale Venduto</p>
                                            <p className="text-2xl font-bold text-slate-800">€ {getAgentContracts(selectedAgent.id).reduce((s, c) => s + c.totalAmount, 0).toLocaleString()}</p>
                                        </div>
                                        <div className="bg-indigo-600 text-white p-6 rounded-xl shadow-lg shadow-indigo-200">
                                            <p className="text-sm text-indigo-100 mb-1">Provvigioni Maturate</p>
                                            <p className="text-3xl font-bold">€ {getAgentTotalCommission(selectedAgent.id).toLocaleString()}</p>
                                        </div>
                                        <div className="bg-white border p-6 rounded-xl shadow-sm">
                                            <p className="text-sm text-slate-500 mb-1">Rank Agente</p>
                                            <p className="text-xl font-bold text-slate-800 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-500" /> Top Performer</p>
                                        </div>
                                    </div>

                                    {/* Billing Info */}
                                    <div className="lg:col-span-1">
                                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5 text-slate-400" /> Dati Contabili</h3>
                                        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
                                            <div><label className="text-xs font-bold text-slate-400 uppercase">P.IVA</label><p className="font-mono font-medium">{selectedAgent.billing?.vatNumber || '-'}</p></div>
                                            <div><label className="text-xs font-bold text-slate-400 uppercase">Banca</label><p className="font-medium">{selectedAgent.billing?.bankName}</p></div>
                                            <div><label className="text-xs font-bold text-slate-400 uppercase">IBAN</label><p className="font-mono text-sm break-all bg-slate-50 p-2 rounded border border-slate-100">{selectedAgent.billing?.iban}</p></div>
                                            <div className="pt-4 border-t"><label className="text-xs font-bold text-slate-400 uppercase">Condizioni</label><p className="font-medium text-emerald-600">{selectedAgent.billing?.paymentTerms}</p></div>
                                        </div>
                                    </div>

                                    {/* Mandate & Docs */}
                                    <div className="lg:col-span-2">
                                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-slate-400" /> Mandato & Documenti</h3>
                                        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                                            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                                                <div>
                                                    <p className="font-bold text-slate-800">Contratto di Mandato.pdf</p>
                                                    <p className="text-xs text-slate-500">Firmato il {selectedAgent.mandateStart}</p>
                                                </div>
                                                <button className="text-indigo-600 font-bold text-sm hover:underline">Scarica</button>
                                            </div>
                                            {selectedAgent.documents?.map((doc, idx) => (
                                                <div key={idx} className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="w-4 h-4 text-slate-400" />
                                                        <span className="text-sm text-slate-700">{doc.name}</span>
                                                    </div>
                                                    <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">{doc.status}</span>
                                                </div>
                                            ))}
                                            <button className="mt-4 w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-sm font-bold hover:border-indigo-300 hover:text-indigo-500 transition-colors">
                                                + Carica Documento
                                            </button>
                                        </div>
                                    </div>

                                    {/* Access & Credentials */}
                                    <div className="lg:col-span-3 mt-2">
                                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                                            <div>
                                                <h4 className="font-bold text-indigo-900 text-lg flex items-center gap-2"><Smartphone className="w-5 h-5" /> Credenziali App Mobile</h4>
                                                <p className="text-sm text-indigo-700 mt-1 max-w-xl">
                                                    Il subagente può accedere al portale dedicato utilizzando il seguente <strong>Magic Link</strong> personale.
                                                    Condividi questo link via WhatsApp o Email. Non serve password.
                                                </p>
                                            </div>
                                            <div className="flex gap-2 w-full md:w-auto">
                                                <div className="hidden md:block bg-white px-4 py-3 rounded-lg border border-indigo-200 text-slate-500 font-mono text-xs truncate max-w-[250px] select-all">
                                                    {getLoginLink(selectedAgent.nickname)}
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(getLoginLink(selectedAgent.nickname));
                                                        alert("Link di accesso copiato!");
                                                    }}
                                                    className="flex-1 md:flex-none bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200 active:scale-95 transition-all text-sm whitespace-nowrap"
                                                >
                                                    Copia Link Accesso
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* CLIENTS TAB */}
                            {activeTab === 'clients' && (
                                <div className="space-y-4">
                                    <h3 className="font-bold text-lg">Portafoglio Clienti</h3>
                                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                                <tr>
                                                    <th className="p-4">Cliente</th>
                                                    <th className="p-4">Contatti</th>
                                                    <th className="p-4">Tipo</th>
                                                    <th className="p-4">Stato</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {getAgentClients(selectedAgent.id).map(client => (
                                                    <tr key={client.id} className="hover:bg-slate-50">
                                                        <td className="p-4 font-medium text-slate-900">{client.name}</td>
                                                        <td className="p-4 text-sm text-slate-500">{client.email}<br />{client.phone}</td>
                                                        <td className="p-4"><span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs">{client.type}</span></td>
                                                        <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${client.status === 'Attivo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{client.status}</span></td>
                                                    </tr>
                                                ))}
                                                {getAgentClients(selectedAgent.id).length === 0 && (
                                                    <tr><td colSpan={4} className="p-8 text-center text-slate-400">Nessun cliente assegnato.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* CONTRACTS TAB */}
                            {activeTab === 'contracts' && (
                                <div className="space-y-4">
                                    <h3 className="font-bold text-lg">Storico Contratti</h3>
                                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                                <tr>
                                                    <th className="p-4">Data</th>
                                                    <th className="p-4">Cliente</th>
                                                    <th className="p-4">Veicolo</th>
                                                    <th className="p-4 text-right">Importo</th>
                                                    <th className="p-4 text-right">Provv.</th>
                                                    <th className="p-4">Stato</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {getAgentContracts(selectedAgent.id).map(c => {
                                                    const car = fleet.find(f => f.id === c.carId);
                                                    const client = clients.find(cl => cl.id === c.clientId);
                                                    return (
                                                        <tr key={c.id} className="hover:bg-slate-50">
                                                            <td className="p-4 text-sm text-slate-500">{new Date(c.signedDate).toLocaleDateString()}</td>
                                                            <td className="p-4 font-medium">{client?.name || 'Unknown'}</td>
                                                            <td className="p-4 text-sm">{car?.brand} {car?.model}</td>
                                                            <td className="p-4 text-right font-medium">€ {c.totalAmount.toLocaleString()}</td>
                                                            <td className="p-4 text-right font-bold text-green-600">€ {c.commissionAmount.toLocaleString()}</td>
                                                            <td className="p-4"><span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">{c.status}</span></td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* MESSAGES TAB */}
                            {activeTab === 'messages' && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full min-h-[400px]">
                                    {/* Message History */}
                                    <div className="lg:col-span-2 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                        <div className="p-4 border-b bg-slate-50 font-bold text-slate-700 flex justify-between">
                                            <span>Canale Diretto App ({selectedAgent.nickname})</span>
                                            <span className="text-xs font-normal text-slate-500 flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Online</span>
                                        </div>
                                        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/30">
                                            {/* Mock Messages */}
                                            <div className="flex justify-end">
                                                <div className="bg-indigo-600 text-white p-3 rounded-l-xl rounded-br-xl max-w-[80%] text-sm shadow-sm">
                                                    Ciao {selectedAgent.name}, confermo ricezione mandato firmato. Buon lavoro!
                                                    <div className="text-[10px] text-indigo-200 mt-1 text-right">Admin • 10:30</div>
                                                </div>
                                            </div>
                                            <div className="flex justify-start">
                                                <div className="bg-white border border-slate-200 text-slate-700 p-3 rounded-r-xl rounded-bl-xl max-w-[80%] text-sm shadow-sm">
                                                    Grazie! Ho già un primo cliente per la BMW X5. Carico i documenti a breve.
                                                    <div className="text-[10px] text-slate-400 mt-1">Agente • 10:35</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-white border-t flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Scrivi messaggio..."
                                                className="flex-1 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={messageInput}
                                                onChange={e => setMessageInput(e.target.value)}
                                            />
                                            <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700">Invia</button>
                                        </div>
                                    </div>

                                    {/* Actions / Push */}
                                    <div className="space-y-4">
                                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                            <h4 className="font-bold text-slate-800 mb-4">Push Parco Auto</h4>
                                            <p className="text-sm text-slate-500 mb-4">Invia aggiornamenti sulla flotta direttamente all'App dell'agente.</p>

                                            <div className="space-y-2">
                                                <button className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-lg text-sm font-medium transition-colors flex items-center justify-between group">
                                                    Invia "Nuovi Arrivi"
                                                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500" />
                                                </button>
                                                <button className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-lg text-sm font-medium transition-colors flex items-center justify-between group">
                                                    Segnala "Promo Mese"
                                                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500" />
                                                </button>
                                                <button className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-lg text-sm font-medium transition-colors flex items-center justify-between group">
                                                    Aggiorna Listini
                                                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgentsManager;