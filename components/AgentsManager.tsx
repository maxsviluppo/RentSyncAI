import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Agent, Contract } from '../types';
import { 
  User, Mail, Phone, MapPin, Shield, ShieldOff, Trash2, Search, Plus, X, 
  ArrowLeft, MessageSquare, Briefcase, FileText, CheckCircle2, TrendingUp, 
  DollarSign, Calendar, Calculator, ChevronLeft, ChevronRight, Wallet, 
  History, AlertCircle, Smartphone, Save, CreditCard, Printer, Share2, ArrowRight, Paperclip 
} from 'lucide-react';

const AgentsManager: React.FC = () => {
    const { agents, contracts, fleet, clients, addAgent, updateAgent, setActiveTab: setGlobalTab, setSelectedId } = useApp();
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [activeTab, setActiveTab] = useState<'profile' | 'clients' | 'messages' | 'accounting'>('profile');
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [globalAccounting, setGlobalAccounting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Agent>>({});
    const [newMessage, setNewMessage] = useState('');
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const [agentMessages, setAgentMessages] = useState<any[]>([
        { id: '1', sender: 'Admin', content: "Ciao, ricordati di caricare la visura per l'ultimo cliente.", timestamp: new Date(Date.now() - 3600000).toISOString(), type: 'Direct' },
        { id: '2', sender: 'Agent', content: "Certamente, lo faccio subito tramite l'app.", timestamp: new Date(Date.now() - 1800000).toISOString(), type: 'Direct' }
    ]);

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

    const toggleAgentAccess = (agent: Agent) => {
        const newStatus = agent.status === 'Attivo' ? 'Sospeso' : 'Attivo';
        updateAgent(agent.id, { status: newStatus });
        if (selectedAgent && selectedAgent.id === agent.id) {
            setSelectedAgent({ ...selectedAgent, status: newStatus });
        }
    };

    const getAgentContracts = (agentId: string) => contracts.filter(c => c.agentId === agentId || c.subagentId === agentId);
    const getAgentClients = (agentId: string) => clients.filter(cl => cl.subagentId === agentId);
    const getAgentTotalCommission = (agentId: string) => {
        return getAgentContracts(agentId).reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
    };

    const handleStartEditing = () => {
        if (!selectedAgent) return;
        setEditForm({ ...selectedAgent });
        setIsEditing(true);
    };

    const handleSaveEdits = () => {
        if (!selectedAgent || !editForm.name) return;
        updateAgent(selectedAgent.id, editForm as Agent);
        setSelectedAgent({ ...selectedAgent, ...editForm } as Agent);
        setIsEditing(false);
        alert("Modifiche salvate correttamente per " + editForm.name);
    };

    const handleSendMessage = () => {
        if (!newMessage.trim() && !attachedFile) return;

        const msg = {
            id: Date.now().toString(),
            sender: 'Admin',
            content: newMessage,
            timestamp: new Date().toISOString(),
            type: 'Direct',
            attachment: attachedFile ? { name: attachedFile.name, size: attachedFile.size } : null
        };

        setAgentMessages([...agentMessages, msg]);
        setNewMessage('');
        setAttachedFile(null);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAttachedFile(e.target.files[0]);
        }
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
            commissionRate: 10, region: '', status: 'Attivo',
            billing: { vatNumber: '', billingAddress: '', iban: '', bankName: '', paymentTerms: '30gg d.f.' }
        });
    };

    const getLoginLink = (nickname: string) => `${window.location.origin}?agent_ref=${nickname}`;

    return (
        <div className="p-6 relative h-full bg-slate-50/50">
            {/* Global Accounting Modal */}
            {globalAccounting && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-8 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] w-full max-w-6xl h-full shadow-2xl flex flex-col overflow-hidden">
                        <div className="p-8 border-b flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center">
                                    <History className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">Contabilità Globale Rete</h2>
                                    <p className="text-sm text-slate-500">Audit provvigioni e payout mensili</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-xl">
                                    <button onClick={() => currentMonth === 0 ? (setCurrentMonth(11), setCurrentYear(currentYear-1)) : setCurrentMonth(currentMonth-1)}><ChevronLeft className="w-5 h-5"/></button>
                                    <span className="font-bold text-xs uppercase min-w-[120px] text-center">
                                        {new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' }).format(new Date(currentYear, currentMonth))}
                                    </span>
                                    <button onClick={() => currentMonth === 11 ? (setCurrentMonth(0), setCurrentYear(currentYear+1)) : setCurrentMonth(currentMonth+1)}><ChevronRight className="w-5 h-5"/></button>
                                </div>
                                <button onClick={() => setGlobalAccounting(false)} className="p-2 hover:bg-slate-100 rounded-full"><X/></button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase">
                                    <tr>
                                        <th className="px-6 py-4">Agente</th>
                                        <th className="px-6 py-4 text-right">Volume</th>
                                        <th className="px-6 py-4 text-right">Provv.</th>
                                        <th className="px-6 py-4 text-right">Scadenza Payout</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {agents.map(a => {
                                        const mContracts = getAgentContracts(a.id).filter(c => new Date(c.startDate).getMonth() === currentMonth && new Date(c.startDate).getFullYear() === currentYear);
                                        const vol = mContracts.reduce((s, c) => s + c.totalAmount, 0);
                                        const comm = vol * (a.commissionRate/100);
                                        if (vol === 0) return null;
                                        const payDate = new Date(currentYear, currentMonth + 1, 0); payDate.setDate(payDate.getDate() + 45);
                                        return (
                                            <tr key={a.id}>
                                                <td className="px-6 py-4 font-bold">{a.name}</td>
                                                <td className="px-6 py-4 text-right text-slate-600">€ {vol.toLocaleString()}</td>
                                                <td className="px-6 py-4 text-right font-bold text-indigo-600">€ {comm.toLocaleString()}</td>
                                                <td className="px-6 py-4 text-right text-sm text-amber-600 font-medium">{payDate.toLocaleDateString()}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-6 border-t bg-slate-50 flex justify-end"><button onClick={() => setGlobalAccounting(false)} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold">Chiudi</button></div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Rete Subagenti</h2>
                    <p className="text-slate-500 font-medium">Gestione profili, accessi e piani provvigionali.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setGlobalAccounting(true)} className="px-4 py-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 flex items-center gap-2"><History className="w-4 h-4"/> Contabilità Totale</button>
                    <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-indigo-200"><Plus className="w-4 h-4"/> Nuovo Mandato</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agents.map(agent => (
                    <div key={agent.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-all cursor-pointer group" onClick={() => setSelectedAgent(agent)}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-xl group-hover:scale-110 transition-transform">
                                    {agent.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800">{agent.name}</h3>
                                    <div className="flex items-center text-xs text-slate-500 gap-1"><MapPin className="w-3 h-3" /> {agent.region}</div>
                                </div>
                            </div>
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${agent.status === 'Attivo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{agent.status}</span>
                        </div>
                        <div className="space-y-2 pt-2">
                             <div className="flex justify-between text-xs"><span className="text-slate-400">Provvigione</span><span className="font-bold text-slate-800">{agent.commissionRate}%</span></div>
                             <div className="flex justify-between text-xs"><span className="text-slate-400">Maturato Totale</span><span className="font-bold text-emerald-600">€ {getAgentTotalCommission(agent.id).toLocaleString()}</span></div>
                        </div>
                        <button className="w-full mt-4 py-2.5 bg-slate-50 text-slate-700 rounded-xl text-sm font-bold group-hover:bg-slate-900 group-hover:text-white transition-all">Gestisci Partner</button>
                    </div>
                ))}
            </div>

            {selectedAgent && (
                <div className="fixed inset-0 bg-slate-900/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white w-full max-w-6xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col h-[90vh]">
                        <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold">{selectedAgent.name.charAt(0)}</div>
                                <div>
                                    <h2 className="text-3xl font-bold text-slate-900">{selectedAgent.name}</h2>
                                    <div className="flex items-center gap-3 text-slate-500 text-sm">
                                        <span className="font-mono bg-white px-2 py-0.5 rounded border">ID: {selectedAgent.id}</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4"/> {selectedAgent.region}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                {activeTab === 'profile' && (
                                    <button 
                                        onClick={isEditing ? handleSaveEdits : handleStartEditing} 
                                        className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${isEditing ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50'}`}
                                    >
                                        {isEditing ? <Save className="w-4 h-4"/> : <Calculator className="w-4 h-4"/>} 
                                        {isEditing ? 'Salva Modifiche' : 'Modifica Profilo'}
                                    </button>
                                )}
                                {isEditing && (
                                    <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-500 font-bold hover:bg-slate-50">Annulla</button>
                                )}
                                <button onClick={() => setSelectedAgent(null)} className="p-2 hover:bg-slate-200 rounded-full"><X/></button>
                            </div>
                        </div>

                        <div className="flex border-b px-8 bg-white sticky top-0 z-10">
                            {['profile', 'clients', 'messages', 'accounting'].map(tab => (
                                <button key={tab} onClick={() => setActiveTab(tab as any)} className={`py-5 px-8 font-bold text-sm border-b-2 transition-all uppercase tracking-widest ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                                    {tab === 'profile' ? 'Profilo' : tab === 'clients' ? 'Clienti' : tab === 'messages' ? 'App & Messaggi' : 'Contabilità'}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
                            {activeTab === 'accounting' && (
                                <div className="space-y-6">
                                     <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600"><Calendar className="w-6 h-6"/></div>
                                            <h3 className="text-xl font-bold uppercase tracking-tight">{new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' }).format(new Date(currentYear, currentMonth))}</h3>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => currentMonth === 0 ? (setCurrentMonth(11), setCurrentYear(currentYear-1)) : setCurrentMonth(currentMonth-1)} className="p-2 border rounded-lg hover:bg-slate-50"><ChevronLeft/></button>
                                            <button onClick={() => currentMonth === 11 ? (setCurrentMonth(0), setCurrentYear(currentYear+1)) : setCurrentMonth(currentMonth+1)} className="p-2 border rounded-lg hover:bg-slate-50"><ChevronRight/></button>
                                        </div>
                                     </div>

                                     {(() => {
                                         const mContracts = getAgentContracts(selectedAgent.id).filter(c => new Date(c.startDate).getMonth() === currentMonth && new Date(c.startDate).getFullYear() === currentYear);
                                         const vol = mContracts.reduce((s, c) => s + c.totalAmount, 0);
                                         const comm = vol * (selectedAgent.commissionRate/100);
                                         const payDate = new Date(currentYear, currentMonth + 1, 0); payDate.setDate(payDate.getDate() + 45);

                                         return (
                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                                <div className="bg-indigo-600 p-8 rounded-[32px] text-white shadow-xl shadow-indigo-100 flex flex-col justify-between min-h-[180px]">
                                                    <span className="text-indigo-100 text-xs font-bold uppercase tracking-widest">Provvigione Periodo</span>
                                                    <h4 className="text-4xl font-extrabold">€ {comm.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h4>
                                                    <div className="flex items-center gap-2 text-indigo-200 text-[10px] bg-white/10 px-3 py-1 rounded-full w-fit"><Calculator className="w-3 h-3"/> Tasso: {selectedAgent.commissionRate}%</div>
                                                </div>
                                                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col justify-between">
                                                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Volume Contratti</span>
                                                    <h4 className="text-3xl font-bold text-slate-800">€ {vol.toLocaleString()}</h4>
                                                    <span className="text-xs text-slate-500">{mContracts.length} contratti approvati</span>
                                                </div>
                                                <div className="bg-slate-900 p-8 rounded-[32px] text-white flex flex-col justify-between">
                                                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Data Payout Stimata</span>
                                                    <h4 className="text-2xl font-bold text-emerald-400">{payDate.toLocaleDateString('it-IT')}</h4>
                                                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">45gg d.f.m.</span>
                                                </div>

                                                <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mt-2">
                                                    <div className="p-4 bg-slate-50 border-b flex justify-between items-center"><h5 className="text-xs font-bold uppercase text-slate-400">Riepilogo Dettagliato Contratti</h5></div>
                                                    <table className="w-full text-left">
                                                        <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase">
                                                            <tr><th className="px-8 py-4">Data</th><th className="px-8 py-4">Nr.</th><th className="px-8 py-4 text-right">Lordo</th><th className="px-8 py-4 text-right">Comm.</th></tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-50">
                                                            {mContracts.map(c => (
                                                                <tr key={c.id} className="text-sm">
                                                                    <td className="px-8 py-4 text-slate-500">{new Date(c.startDate).toLocaleDateString()}</td>
                                                                    <td className="px-8 py-4 font-bold">{c.id.slice(-8).toUpperCase()}</td>
                                                                    <td className="px-8 py-4 text-right">€ {c.totalAmount.toLocaleString()}</td>
                                                                    <td className="px-8 py-4 text-right font-bold text-indigo-600">€ {(c.totalAmount * (selectedAgent.commissionRate/100)).toLocaleString()}</td>
                                                                </tr>
                                                            ))}
                                                            {mContracts.length === 0 && <tr><td colSpan={4} className="p-12 text-center text-slate-400 italic">Nessun dato per questo mese.</td></tr>}
                                                        </tbody>
                                                        {mContracts.length > 0 && (
                                                            <tfoot className="bg-slate-50 border-t"><tr className="font-bold"><td colSpan={3} className="px-8 py-4 text-right">TOTALE PROGRESSIVO</td><td className="px-8 py-4 text-right text-indigo-700">€ {comm.toLocaleString()}</td></tr></tfoot>
                                                        )}
                                                    </table>
                                                </div>
                                            </div>
                                         )
                                     })()}
                                </div>
                            )}

                            {activeTab === 'clients' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                     <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                        <h3 className="text-xl font-bold uppercase tracking-tight">Portafoglio Clienti Assegnati</h3>
                                        <div className="bg-slate-100 px-3 py-1 rounded-full text-slate-600 font-bold text-xs">
                                            {getAgentClients(selectedAgent.id).length} Clienti
                                        </div>
                                     </div>

                                     <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                <tr>
                                                    <th className="px-8 py-4">Cliente</th>
                                                    <th className="px-8 py-4">Status</th>
                                                    <th className="px-8 py-4">Tipo</th>
                                                    <th className="px-8 py-4 text-right">Ultima Attività</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {getAgentClients(selectedAgent.id).map(client => (
                                                    <tr key={client.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-8 py-4">
                                                            <div className="font-bold text-slate-800">{client.name}</div>
                                                            <div className="text-[10px] text-slate-400 uppercase tracking-widest">{client.email}</div>
                                                        </td>
                                                        <td className="px-8 py-4">
                                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${client.status === 'Attivo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                {client.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-4 text-xs text-slate-600 font-medium">{client.type}</td>
                                                        <td className="px-8 py-4 text-right">
                                                            <button 
                                                                onClick={() => {
                                                                    setSelectedId(client.id);
                                                                    setGlobalTab('clients');
                                                                }}
                                                                className="flex items-center gap-1.5 ml-auto bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border border-transparent hover:border-indigo-100"
                                                            >
                                                                Vedi Scheda <ArrowRight className="w-3 h-3"/>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {getAgentClients(selectedAgent.id).length === 0 && (
                                                    <tr>
                                                        <td colSpan={4} className="p-12 text-center text-slate-400 italic">Nessun cliente nel portafoglio di questo subagente.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                     </div>
                                </div>
                            )}

                            {activeTab === 'profile' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {/* Financial Quick Summaries */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="bg-white border border-slate-100 p-6 rounded-[28px] shadow-sm">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><TrendingUp className="w-4 h-4"/></div>
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Commissioni Totali</span>
                                            </div>
                                            <p className="text-3xl font-extrabold text-slate-800">€ {getAgentTotalCommission(selectedAgent.id).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                        </div>
                                        <div className="bg-white border border-slate-100 p-6 rounded-[28px] shadow-sm">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Briefcase className="w-4 h-4"/></div>
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Portafoglio Clienti</span>
                                            </div>
                                            <p className="text-3xl font-extrabold text-slate-800">{getAgentClients(selectedAgent.id).length} Lead Attivi</p>
                                        </div>
                                        <div className="bg-slate-900 p-6 rounded-[28px] shadow-xl shadow-slate-200">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-2 bg-slate-800 rounded-lg text-emerald-400"><DollarSign className="w-4 h-4"/></div>
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tasso Provvigionale</span>
                                            </div>
                                            {isEditing ? (
                                                <div className="flex items-center gap-2 text-white">
                                                    <input 
                                                        type="number" 
                                                        className="bg-slate-800 border-none rounded-lg p-2 w-20 text-2xl font-black focus:ring-2 focus:ring-emerald-500" 
                                                        value={editForm.commissionRate} 
                                                        onChange={e => setEditForm({ ...editForm, commissionRate: Number(e.target.value) })}
                                                    />
                                                    <span className="text-2xl font-black">%</span>
                                                </div>
                                            ) : (
                                                <p className="text-3xl font-extrabold text-white">{selectedAgent.commissionRate}% <span className="text-sm font-medium text-slate-500 ml-1">Flat Rate</span></p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* PERSONAL & OPERATIONAL DATA */}
                                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
                                            <div className="flex items-center gap-3 pb-4 border-b">
                                                <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600"><User className="w-5 h-5" /></div>
                                                <h3 className="font-bold text-lg text-slate-800 tracking-tight">Dati Anagrafici & Canale</h3>
                                            </div>
                                            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nome Completo</label>
                                                    {isEditing ? <input className="w-full p-2 border rounded-xl text-sm font-bold" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} /> : <p className="font-bold text-slate-700">{selectedAgent.name}</p>}
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nickname App</label>
                                                    {isEditing ? <input className="w-full p-2 border rounded-xl text-sm font-mono" value={editForm.nickname} onChange={e => setEditForm({...editForm, nickname: e.target.value})} /> : <p className="font-mono text-sm bg-slate-50 px-2 py-0.5 rounded text-indigo-600 font-bold">{selectedAgent.nickname}</p>}
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Zona di Competenza</label>
                                                    {isEditing ? (
                                                        <select className="w-full p-2 border rounded-xl text-sm" value={editForm.region} onChange={e => setEditForm({...editForm, region: e.target.value})}>
                                                            <option value="Lombardia (Milano)">Lombardia (Milano)</option>
                                                            <option value="Lazio (Roma)">Lazio (Roma)</option>
                                                            <option value="Campania (Napoli)">Campania (Napoli)</option>
                                                            <option value="Altro">Altro</option>
                                                        </select>
                                                    ) : (
                                                        <p className="font-bold text-slate-700 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-indigo-500" /> {selectedAgent.region}</p>
                                                    )}
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inizio Mandato</label>
                                                    {isEditing ? <input type="date" className="w-full p-2 border rounded-xl text-sm" value={editForm.mandateStart} onChange={e => setEditForm({...editForm, mandateStart: e.target.value})} /> : <p className="font-bold text-slate-700">{selectedAgent.mandateStart}</p>}
                                                </div>
                                            </div>

                                            <div className="pt-4 space-y-3">
                                                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stato Collaborazione</label>
                                                 <div className={`p-4 rounded-2xl flex justify-between items-center ${selectedAgent.status === 'Attivo' ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'}`}>
                                                     <div className="flex items-center gap-3">
                                                         {selectedAgent.status === 'Attivo' ? <Shield className="text-emerald-500" /> : <ShieldOff className="text-red-500" />}
                                                         <div>
                                                             <p className={`font-bold text-sm ${selectedAgent.status === 'Attivo' ? 'text-emerald-700' : 'text-red-700'}`}>Partner {selectedAgent.status}</p>
                                                             <p className="text-[10px] text-slate-500 font-medium">Accesso al portale mobile abilitato</p>
                                                         </div>
                                                     </div>
                                                     <button onClick={() => toggleAgentAccess(selectedAgent)} className="text-xs font-bold text-indigo-600 hover:underline">Cambia</button>
                                                 </div>
                                            </div>
                                        </div>

                                        {/* FISCAL & BILLING DATA */}
                                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
                                            <div className="flex items-center gap-3 pb-4 border-b">
                                                <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600"><CreditCard className="w-5 h-5" /></div>
                                                <h3 className="font-bold text-lg text-slate-800 tracking-tight">Dati Fiscali & Pagamenti</h3>
                                            </div>
                                            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">P.IVA / Cod. Fiscale</label>
                                                    {isEditing ? <input className="w-full p-2 border rounded-xl text-sm" value={editForm.billing?.vatNumber} onChange={e => setEditForm({...editForm, billing: {...editForm.billing!, vatNumber: e.target.value}})} /> : <p className="font-mono font-bold text-slate-700">{selectedAgent.billing?.vatNumber || '-'}</p>}
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Istituto Bancario</label>
                                                    {isEditing ? <input className="w-full p-2 border rounded-xl text-sm" value={editForm.billing?.bankName} onChange={e => setEditForm({...editForm, billing: {...editForm.billing!, bankName: e.target.value}})} /> : <p className="font-bold text-slate-700">{selectedAgent.billing?.bankName || '-'}</p>}
                                                </div>
                                                <div className="col-span-2 space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">IBAN Accreditamento</label>
                                                    {isEditing ? (
                                                        <input className="w-full p-4 border rounded-2xl text-sm font-mono bg-white" value={editForm.billing?.iban} onChange={e => setEditForm({...editForm, billing: {...editForm.billing!, iban: e.target.value}})} />
                                                    ) : (
                                                        <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100 group">
                                                            <p className="font-mono text-sm text-slate-600 select-all tracking-wider">{selectedAgent.billing?.iban || '-'}</p>
                                                            <History className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Condizioni Pagamento</label>
                                                    {isEditing ? <input className="w-full p-2 border rounded-xl text-xs" value={editForm.billing?.paymentTerms} onChange={e => setEditForm({...editForm, billing: {...editForm.billing!, paymentTerms: e.target.value}})} /> : <p className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg w-fit text-xs border border-emerald-100">{selectedAgent.billing?.paymentTerms || '30gg d.f.'}</p>}
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Indirizzo Fatturazione</label>
                                                    {isEditing ? <textarea rows={2} className="w-full p-2 border rounded-xl text-xs" value={editForm.billing?.billingAddress} onChange={e => setEditForm({...editForm, billing: {...editForm.billing!, billingAddress: e.target.value}})} /> : <p className="text-xs font-medium text-slate-600 leading-relaxed">{selectedAgent.billing?.billingAddress || '-'}</p>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* MOBILE APP CREDENTIALS - FULL WIDTH */}
                                        <div className="lg:col-span-2 bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-[40px] shadow-xl shadow-indigo-100 text-white flex flex-col md:flex-row justify-between items-center gap-8">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-white/20 rounded-xl"><Smartphone className="w-5 h-5"/></div>
                                                    <h4 className="text-2xl font-extrabold tracking-tight italic">Rentsync Pro Mobile</h4>
                                                </div>
                                                <p className="text-indigo-100 text-sm max-w-xl font-medium leading-relaxed">
                                                    Questo agente accede in modalità 'Senza Password' tramite il suo Smart Link unico. Invia questo link al suo dispositivo per l'accesso immediato.
                                                </p>
                                            </div>
                                            <div className="flex flex-col gap-3 w-full md:w-auto">
                                                 <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 text-indigo-50 font-mono text-xs truncate max-w-[300px]">
                                                     {getLoginLink(selectedAgent.nickname)}
                                                 </div>
                                                 <button 
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(getLoginLink(selectedAgent.nickname));
                                                        alert("Link di accesso copiato per: " + selectedAgent.name);
                                                    }}
                                                    className="w-full bg-white text-indigo-700 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/90 active:scale-95 transition-all shadow-lg"
                                                 >
                                                     Copia Link Intelligente
                                                 </button>
                                            </div>
                                        </div>

                                        {/* DOCUMENTS MINI SECTION */}
                                        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="font-bold text-lg text-slate-800">Documentazione & Mandati</h3>
                                                <button className="text-xs font-bold text-indigo-600 flex items-center gap-1.5 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
                                                    <Plus className="w-3 h-3" /> Aggiungi Documento
                                                </button>
                                            </div>
                                            <div className="space-y-4">
                                                 <div className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-slate-200 group hover:border-indigo-300 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-2 bg-white rounded-xl shadow-sm"><FileText className="text-indigo-600 w-5 h-5"/></div>
                                                        <div>
                                                            <span className="text-sm font-bold text-slate-800">Contratto di Mandato Standard.pdf</span>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Sottoscritto il {selectedAgent.mandateStart}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-4">
                                                        <button className="text-xs font-bold text-indigo-600 hover:underline">Vedi</button>
                                                        <button className="text-xs font-bold text-slate-400 hover:text-slate-600">Archivia</button>
                                                    </div>
                                                 </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'messages' && (
                                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden h-full flex flex-col min-h-[500px] animate-in fade-in slide-in-from-bottom-4">
                                    <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-bold uppercase text-slate-400 tracking-widest">Canale Diretto Agente</span>
                                            <span className="text-[10px] text-green-500 font-bold uppercase bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/> Online</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-400"><Search className="w-4 h-4"/></button>
                                            <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-400"><AlertCircle className="w-4 h-4"/></button>
                                        </div>
                                    </div>
                                    <div className="flex-1 p-6 space-y-6 bg-slate-50/20 overflow-y-auto">
                                        {agentMessages.map(msg => (
                                            <div key={msg.id} className={`flex ${msg.sender === 'Admin' ? 'justify-end' : 'justify-start'} w-full`}>
                                                <div className={`max-w-[75%] space-y-1 ${msg.sender === 'Admin' ? 'items-end' : 'items-start'} flex flex-col`}>
                                                    <div className={`p-4 rounded-2xl shadow-sm text-sm ${msg.sender === 'Admin' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'}`}>
                                                        {msg.content}
                                                        {msg.attachment && (
                                                            <div className={`mt-3 flex items-center gap-3 p-3 rounded-xl border ${msg.sender === 'Admin' ? 'bg-white/10 border-white/20' : 'bg-slate-50 border-slate-100'}`}>
                                                                <FileText className="w-5 h-5 opacity-70" />
                                                                <div className="flex-1 truncate">
                                                                    <p className="text-xs font-bold truncate">{msg.attachment.name}</p>
                                                                    <p className="text-[8px] opacity-60 font-bold uppercase">{(msg.attachment.size / 1024).toFixed(1)} KB</p>
                                                                </div>
                                                                <ArrowRight className="w-4 h-4 opacity-40" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="text-[9px] uppercase font-bold text-slate-400 px-1">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-4 border-t bg-white">
                                        {attachedFile && (
                                            <div className="mb-3 p-2 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between animate-in slide-in-from-bottom-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 bg-white rounded-lg shadow-sm"><FileText className="w-4 h-4 text-indigo-600"/></div>
                                                    <span className="text-xs font-bold text-indigo-700 truncate max-w-[200px]">{attachedFile.name}</span>
                                                </div>
                                                <button onClick={() => setAttachedFile(null)} className="p-1 hover:bg-indigo-100 rounded-full text-indigo-400"><X className="w-3 h-3"/></button>
                                            </div>
                                        )}
                                        <div className="flex gap-3 items-center">
                                            <label className="cursor-pointer p-3 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-2xl transition-colors">
                                                <Paperclip className="w-6 h-6"/>
                                                <input type="file" className="hidden" onChange={handleFileSelect} />
                                            </label>
                                            <input 
                                                type="text" 
                                                placeholder="Scrivi un messaggio al collaboratore..." 
                                                className="flex-1 bg-slate-50 border-none rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                                                value={newMessage}
                                                onChange={e => setNewMessage(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                            />
                                            <button 
                                                onClick={handleSendMessage}
                                                className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg hover:bg-indigo-700 active:scale-95 transition-all"
                                            >
                                                <MessageSquare/>
                                            </button>
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