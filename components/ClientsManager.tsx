import React, { useState, useEffect } from 'react';
import { Client, Contract } from '../types';
import { useApp } from '../contexts/AppContext';
import { Users, Search, Plus, Building2, User, ArrowLeft, History, Calendar, Car as CarIcon, Eye, Printer, Share2, Camera, UploadCloud, X, AlertTriangle, ArrowRight, CheckCircle2, FileText, Trash2, Bell, FileCheck, Briefcase, Pencil, Save, Download } from 'lucide-react';
import { supabase } from '../services/supabase';

const ClientsManager: React.FC = () => {
  const { clients, contracts, fleet, agents, addClient, updateContractPhotos, updateClient, deleteClient, selectedId, setSelectedId } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [newClient, setNewClient] = useState<Partial<Client>>({ type: 'Privato', status: 'Attivo' });

  // Inspection Photo Upload Handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, contractId: string, type: 'checkIn' | 'checkOut', currentPhotos: string[] = []) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const newUrls = newFiles.map(file => URL.createObjectURL(file as Blob));
      updateContractPhotos(contractId, type, [...currentPhotos, ...newUrls]);
    }
  };

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name) return;

    // Validation for VAT number if company
    if (newClient.type === 'Azienda' && !newClient.vatNumber) {
      alert("La Partita IVA è obbligatoria per le aziende.");
      return;
    }

    const client: Client = {
      id: crypto.randomUUID(),
      name: newClient.name || '',
      email: newClient.email || '',
      phone: newClient.phone || '',
      type: newClient.type as 'Privato' | 'Azienda',
      vatNumber: newClient.vatNumber,
      status: 'Attivo',
      riskScore: 50, // Default start
      ...newClient
    };
    addClient(client);

    // Sync to Supabase
    const syncToSupabase = async () => {
      if (!supabase) return; // Skip if no Supabase instance is available
      try {
        const { error } = await supabase.from('clients').insert([{
          id: client.id,
          name: client.name,
          email: client.email,
          phone: client.phone,
          type: client.type,
          vat_number: client.vatNumber,
          fiscal_code: client.fiscalCode,
          address_street: client.address?.street,
          address_city: client.address?.city,
          address_zip: client.address?.zip,
          address_province: client.address?.province,
          status: client.status,
          risk_score: client.riskScore,
          notes: client.notes
        }]);
        if (error) console.error('Error syncing to Supabase:', error);
      } catch (err) {
        console.error('Supabase sync exception:', err);
      }
    };
    syncToSupabase();

    setShowAddForm(false);
    setNewClient({ type: 'Privato', status: 'Attivo' });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (!selectedClient) return;
    const text = `Cliente: ${selectedClient.name}\nEmail: ${selectedClient.email}\nTel: ${selectedClient.phone}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Scheda ${selectedClient.name}`,
          text: text
        });
      } catch (e) { console.error(e) }
    } else {
      alert("Dati copiati: " + text);
    }
  };

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Detail View State
  const [activeTab, setActiveTab] = useState<'profile' | 'documents' | 'history'>('profile');
  const [editMode, setEditMode] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<string | null>(null); // URL of doc to preview
  const [showContractModal, setShowContractModal] = useState(false); // Contract Generator Modal

  // Handle cross-context selection from AgentsManager
  useEffect(() => {
    if (selectedId) {
      const client = clients.find(c => c.id === selectedId);
      if (client) {
        setSelectedClient(client);
        setActiveTab('profile');
      }
      setSelectedId(null); // Clear after handling
    }
  }, [selectedId, clients, setSelectedId]);

  // Handlers for Detail View
  const handleUpdate = () => {
    if (selectedClient) {
      updateClient(selectedClient);
      setEditMode(false);
      alert("Dati cliente aggiornati con successo.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && selectedClient) {
      const file = e.target.files[0];
      const type = file.name.split('.').pop()?.toLowerCase() as any || 'other';
      const newDoc: any = {
        id: Date.now().toString(),
        name: file.name,
        type: type,
        uploadDate: new Date().toISOString().split('T')[0],
        url: URL.createObjectURL(file),
        status: 'In Revisione'
      };
      const updatedClient = { ...selectedClient, documents: [...(selectedClient.documents || []), newDoc] };
      setSelectedClient(updatedClient);
      // In a real app we would call updateClient(updatedClient) here
    }
  };

  const handleDownloadDoc = (doc: any) => {
    const link = document.createElement('a');
    link.href = doc.url;
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintDoc = (docUrl: string) => {
    const printWindow = window.open(docUrl, '_blank');
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        printWindow.print();
      });
    }
  };

  const handleConfirmDelete = () => {
    if (selectedClient) {
      deleteClient(selectedClient.id);
      setSelectedClient(null);
      setShowDeleteModal(false);
    }
  };

  const handleDeleteDoc = (docId: string) => {
    if (selectedClient) {
      const updatedDocs = selectedClient.documents?.filter(d => d.id !== docId) || [];
      setSelectedClient({ ...selectedClient, documents: updatedDocs });
    }
  };

  if (selectedClient) {
    const clientContracts = contracts.filter(c => c.clientId === selectedClient.id).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    const upcomingPayment = clientContracts.find(c => c.status === 'Attivo' && c.nextPaymentDate && new Date(c.nextPaymentDate) > new Date());
    const daysToPayment = upcomingPayment?.nextPaymentDate ? Math.ceil((new Date(upcomingPayment.nextPaymentDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : null;
    const linkedAgent = selectedClient.subagentId ? agents.find(a => a.id === selectedClient.subagentId) : null;

    return (
      <div className="p-6 h-full flex flex-col animate-in slide-in-from-right duration-300 relative">
        {/* PRINTABLE AREA (Hidden on Screen) */}
        <div className="hidden print:block absolute inset-0 bg-white z-[1000] p-10 font-sans text-slate-900 border">
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
            <div>
               <h1 className="text-3xl font-black uppercase tracking-tighter text-indigo-700">RentSync AI</h1>
               <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">Client Dossier Report • Confidential</p>
            </div>
            <div className="text-right text-xs">
               <p className="font-bold">RentSync AI Solutions S.r.l.</p>
               <p>Regulated Mobility Services</p>
               <p className="text-slate-400 mt-1">Data Stampa: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
            </div>
          </div>

          <div className="space-y-10">
             {/* ANAGRAFICA SECTION */}
             <section>
                <h2 className="text-lg font-black uppercase mb-4 flex items-center gap-2 border-b-2 border-slate-100 pb-2">
                   <div className="w-2 h-6 bg-indigo-600 rounded-sm" /> Dati Anagrafici & Fiscali
                </h2>
                <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                   <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nome / Ragione Sociale</label>
                      <p className="text-base font-bold text-slate-900">{selectedClient.name}</p>
                   </div>
                   <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tipologia Cliente</label>
                      <p className="text-sm font-semibold">{selectedClient.type}</p>
                   </div>
                   <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email di Contatto</label>
                      <p className="text-sm font-semibold">{selectedClient.email}</p>
                   </div>
                   <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Recapito Telefonico</label>
                      <p className="text-sm font-semibold">{selectedClient.phone}</p>
                   </div>
                   <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{selectedClient.type === 'Azienda' ? 'Partita IVA' : 'Codice Fiscale'}</label>
                      <p className="text-sm font-bold font-mono uppercase bg-slate-50 px-2 py-1 rounded-md border border-slate-100 inline-block">
                         {selectedClient.vatNumber || selectedClient.fiscalCode || 'NESSUN DATO'}
                      </p>
                   </div>
                   <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Indirizzo di Residenza / Sede</label>
                      <p className="text-sm font-semibold">
                         {selectedClient.address?.street}, {selectedClient.address?.city} ({selectedClient.address?.province})
                      </p>
                   </div>
                   {linkedAgent && (
                      <div className="col-span-2 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                         <label className="block text-[10px] font-bold text-indigo-400 uppercase mb-1">Subagente di Riferimento</label>
                         <p className="text-sm font-bold text-indigo-700">{linkedAgent.name} • {linkedAgent.region}</p>
                      </div>
                   )}
                </div>
             </section>

             {/* HISTORY SECTION */}
             <section>
                <h2 className="text-lg font-black uppercase mb-4 flex items-center gap-2 border-b-2 border-slate-100 pb-2">
                   <div className="w-2 h-6 bg-slate-900 rounded-sm" /> Archivio Storico Auto & Contratti
                </h2>
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="bg-slate-900 text-white">
                         <th className="px-4 py-2 text-[10px] font-bold uppercase">Veicolo / Targa</th>
                         <th className="px-4 py-2 text-[10px] font-bold uppercase">Periodo</th>
                         <th className="px-4 py-2 text-[10px] font-bold uppercase">Stato</th>
                         <th className="px-4 py-2 text-[10px] font-bold uppercase text-right">Importo Lordo</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y border-b">
                      {[...(selectedClient.rentalHistory || []).map(r => ({ ...r, type: 'ARCHIVED' })), ...clientContracts.map(c => ({ ...c, type: 'CONTRACT', carModel: `${fleet.find(f => f.id === c.carId)?.brand} ${fleet.find(f => f.id === c.carId)?.model}`, plate: fleet.find(f => f.id === c.carId)?.plate }))].map((item: any, i) => (
                         <tr key={i} className="text-sm">
                            <td className="px-4 py-4">
                               <p className="font-bold">{item.carModel}</p>
                               <p className="text-[10px] font-mono text-slate-400 uppercase">{item.plate}</p>
                            </td>
                            <td className="px-4 py-4 text-xs font-semibold tabular-nums text-slate-500">
                               {item.startDate} / {item.endDate}
                            </td>
                            <td className="px-4 py-4">
                               <span className="text-[10px] font-bold uppercase bg-slate-100 px-2 py-1 rounded text-slate-600 border border-slate-200">{item.status}</span>
                            </td>
                            <td className="px-4 py-4 text-right font-black text-indigo-700">
                               € {item.totalAmount.toLocaleString()}
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </section>
          </div>

          <div className="fixed bottom-10 left-10 right-10 flex justify-between pt-10 border-t-2 border-slate-100">
             <div className="text-center w-64">
                <p className="text-[10px] font-bold text-slate-400 mb-8 uppercase italic tracking-widest">Direzione RentSync AI</p>
                <div className="h-px bg-slate-900 w-full" />
             </div>
             <div className="text-center w-64">
                <p className="text-[10px] font-bold text-slate-400 mb-8 uppercase italic tracking-widest">Firma Titolare Scheda</p>
                <div className="h-px bg-slate-900 w-full" />
             </div>
          </div>
        </div>

        {/* Header Dettaglio */}
        <div className="flex justify-between items-center mb-6 print:hidden">
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedClient(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6 text-slate-700" />
            </button>
            <div>
              <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                {selectedClient.name}
                {daysToPayment && daysToPayment <= 7 && (
                  <div className="bg-red-100 text-red-700 text-xs px-3 py-1 rounded-full flex items-center gap-1 animate-pulse">
                    <Bell className="w-3 h-3" /> Pagamento in scadenza: {daysToPayment}gg
                  </div>
                )}
              </h2>
              <div className="flex items-center gap-2 text-slate-500">
                <span className={`w-2.5 h-2.5 rounded-full ${selectedClient.status === 'Attivo' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span>{selectedClient.status}</span>
                <span className="mx-1">•</span>
                <span>{selectedClient.type}</span>
                {linkedAgent && (
                  <>
                    <span className="mx-1">•</span>
                    <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 rounded-md font-medium text-xs border border-indigo-100">
                      <Briefcase className="w-3 h-3" /> Subagente: {linkedAgent.name}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleShare} className="px-4 py-2 border border-slate-300 rounded-lg flex items-center gap-2 hover:bg-slate-50 text-slate-700 font-medium">
              <Share2 className="w-4 h-4" /> Condividi
            </button>
            <button onClick={handlePrint} className="px-4 py-2 bg-slate-900 text-white rounded-lg flex items-center gap-2 hover:bg-slate-800 font-medium shadow-lg">
              <Printer className="w-4 h-4" /> Stampa Scheda
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 mb-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'profile' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <User className="w-4 h-4" /> Anagrafica
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'documents' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <FileText className="w-4 h-4" /> Documenti
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'history' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <History className="w-4 h-4" /> Noleggi & Storico
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pr-2">

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Info */}
              <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg text-slate-700">Dettagli Cliente</h3>
                  <button 
                    onClick={() => editMode ? handleUpdate() : setEditMode(true)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      editMode 
                        ? 'bg-green-600 text-white shadow-lg shadow-green-100 hover:bg-green-700' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {editMode ? <><Save className="w-3.5 h-3.5" /> Salva Modifiche</> : <><Pencil className="w-3.5 h-3.5" /> Modifica Dati</>}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">Nome / Ragione Sociale</label>
                    {editMode ? (
                      <input 
                        className="w-full mt-1 p-2 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={selectedClient.name}
                        onChange={e => setSelectedClient({...selectedClient, name: e.target.value})}
                      />
                    ) : (
                      <p className="font-medium text-slate-800 text-lg">{selectedClient.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">Tipologia</label>
                    {editMode ? (
                      <select 
                        className="w-full mt-1 p-2 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={selectedClient.type}
                        onChange={e => setSelectedClient({...selectedClient, type: e.target.value as any})}
                      >
                        <option>Privato</option>
                        <option>Azienda</option>
                      </select>
                    ) : (
                      <p className="font-medium text-slate-800">{selectedClient.type}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">Email</label>
                    {editMode ? (
                      <input 
                        type="email"
                        className="w-full mt-1 p-2 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={selectedClient.email}
                        onChange={e => setSelectedClient({...selectedClient, email: e.target.value})}
                      />
                    ) : (
                      <p className="font-medium text-slate-800">{selectedClient.email}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">Telefono</label>
                    {editMode ? (
                      <input 
                        className="w-full mt-1 p-2 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={selectedClient.phone}
                        onChange={e => setSelectedClient({...selectedClient, phone: e.target.value})}
                      />
                    ) : (
                      <p className="font-medium text-slate-800">{selectedClient.phone}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">{selectedClient.type === 'Azienda' ? 'Partita IVA' : 'Codice Fiscale'}</label>
                    {editMode ? (
                      <input 
                        className="w-full mt-1 p-2 border rounded-lg text-sm font-medium font-mono focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
                        value={selectedClient.vatNumber || selectedClient.fiscalCode || ''}
                        onChange={e => {
                          const val = e.target.value;
                          if (selectedClient.type === 'Azienda') {
                            setSelectedClient({...selectedClient, vatNumber: val});
                          } else {
                            setSelectedClient({...selectedClient, fiscalCode: val});
                          }
                        }}
                      />
                    ) : (
                      <p className="font-medium text-slate-800 font-mono tracking-wider">{selectedClient.vatNumber || selectedClient.fiscalCode || '-'}</p>
                    )}
                  </div>
                  { (selectedClient.birthDate || editMode) && (
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase">Data di Nascita</label>
                      {editMode ? (
                        <input 
                          type="date"
                          className="w-full mt-1 p-2 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                          value={selectedClient.birthDate || ''}
                          onChange={e => setSelectedClient({...selectedClient, birthDate: e.target.value})}
                        />
                      ) : (
                        <p className="font-medium text-slate-800">{selectedClient.birthDate}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><Building2 className="w-4 h-4 text-slate-400" /> Indirizzo & Domicilio</h4>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-xs font-bold text-slate-400 uppercase">Indirizzo</label>
                      {editMode ? (
                        <input 
                          className="w-full mt-1 p-2 border rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                          value={selectedClient.address?.street || ''}
                          onChange={e => setSelectedClient({...selectedClient, address: {...(selectedClient.address || {city: '', zip: '', province: ''}), street: e.target.value}})}
                        />
                      ) : (
                        <p className="font-medium text-slate-800">{selectedClient.address?.street || '-'}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase">Città</label>
                      {editMode ? (
                        <input 
                          className="w-full mt-1 p-2 border rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                          value={selectedClient.address?.city || ''}
                          onChange={e => setSelectedClient({...selectedClient, address: {...(selectedClient.address || {street: '', zip: '', province: ''}), city: e.target.value}})}
                        />
                      ) : (
                        <p className="font-medium text-slate-800">{selectedClient.address?.city || '-'}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase">Provincia / CAP</label>
                      {editMode ? (
                        <div className="flex gap-2">
                          <input 
                            className="w-full mt-1 p-2 border rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-mono uppercase"
                            maxLength={2}
                            value={selectedClient.address?.province || ''}
                            onChange={e => setSelectedClient({...selectedClient, address: {...(selectedClient.address || {street: '', city: '', zip: ''}), province: e.target.value.toUpperCase()}})}
                          />
                          <input 
                            className="w-full mt-1 p-2 border rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-mono"
                            maxLength={5}
                            value={selectedClient.address?.zip || ''}
                            onChange={e => setSelectedClient({...selectedClient, address: {...(selectedClient.address || {street: '', city: '', province: ''}), zip: e.target.value}})}
                          />
                        </div>
                      ) : (
                        <p className="font-medium text-slate-800">{selectedClient.address?.province || '-'} ({selectedClient.address?.zip || '-'})</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Side Cards */}
              <div className="space-y-6">
                {/* Risk Score */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-slate-700 mb-4">Affidabilità</h3>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-4xl font-extrabold text-slate-800">{selectedClient.riskScore}/100</div>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                    <div
                      className={`h-full ${selectedClient.riskScore && selectedClient.riskScore > 80 ? 'bg-green-500' : selectedClient.riskScore && selectedClient.riskScore > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${selectedClient.riskScore}%` }}
                    />
                  </div>
                  <p className="text-sm text-slate-500">
                    {selectedClient.riskScore && selectedClient.riskScore > 80 ? 'Cliente affidabile. Nessuna restrizione.' : 'Richiede approvazione per veicoli Luxury.'}
                  </p>
                </div>

                {/* Notes */}
                <div className="bg-amber-50 p-6 rounded-xl border border-amber-100">
                  <h3 className="font-bold text-amber-800 mb-2">Note Interne</h3>
                  <p className="text-sm text-amber-900/80 italic">
                    {selectedClient.notes || "Nessuna nota presente."}
                  </p>
                  <button className="text-xs font-bold text-amber-700 mt-3 hover:underline">Modifica Note</button>
                </div>
              </div>
            </div>
          )}

          {/* DOCUMENTS TAB */}
          {activeTab === 'documents' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Documents List */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-lg text-slate-700">Archivio Documentale</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowContractModal(true)}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-700 flex items-center gap-2 shadow-sm"
                    >
                      <FileCheck className="w-4 h-4" /> Genera Contratto
                    </button>
                    <label className="cursor-pointer bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-200 flex items-center gap-2 border border-slate-200">
                      <UploadCloud className="w-4 h-4" /> Carica Documento
                      <input type="file" className="hidden" onChange={handleFileUpload} />
                    </label>
                  </div>
                </div>

                {selectedClient.documents && selectedClient.documents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedClient.documents.map(doc => (
                      <div key={doc.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${doc.type === 'pdf' ? 'bg-red-50 text-red-600' :
                          ['jpg', 'png'].includes(doc.type) ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'
                          }`}>
                          {['jpg', 'png'].includes(doc.type) ? <Camera className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-800 truncate">{doc.name}</h4>
                          <p className="text-xs text-slate-500">{doc.uploadDate} • {doc.type.toUpperCase()}</p>
                          <div className="flex flex-wrap gap-2 mt-3">
                            <button
                              onClick={() => setPreviewDoc(doc.url)}
                              className="text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded transition-colors border border-indigo-100"
                            >
                              Anteprima
                            </button>
                            <button
                              onClick={() => handleDownloadDoc(doc)}
                              className="text-[10px] font-bold text-slate-600 hover:bg-slate-50 px-2 py-1 rounded transition-colors border border-slate-200 flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" /> Scarica
                            </button>
                            <button
                              onClick={() => handlePrintDoc(doc.url)}
                              className="text-[10px] font-bold text-slate-600 hover:bg-slate-50 px-2 py-1 rounded transition-colors border border-slate-200 flex items-center gap-1"
                            >
                              <Printer className="w-3 h-3" /> Stampa
                            </button>
                            <button
                              onClick={() => handleDeleteDoc(doc.id)}
                              className="text-[10px] font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                            >
                              Elimina
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <UploadCloud className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">Nessun documento caricato.</p>
                  </div>
                )}
              </div>

              {/* Checklist */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-fit">
                <h3 className="font-bold text-slate-700 mb-4">Documenti Richiesti</h3>
                <ul className="space-y-3">
                  {[
                    { name: 'Patente di Guida (Fronte/Retro)', req: true },
                    { name: 'Carta d\'Identità', req: true },
                    { name: 'Codice Fiscale', req: true },
                    { name: 'Visura Camerale (Aziende)', req: selectedClient.type === 'Azienda' },
                    { name: 'Carta di Credito', req: false }
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${(selectedClient.documents?.some(d => d.name.toLowerCase().includes(item.name.toLowerCase().split(' ')[0])))
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-slate-300 text-transparent'
                        }`}>
                        <CheckCircle2 className="w-3 h-3" />
                      </div>
                      <span className={`text-sm ${item.req ? 'font-medium text-slate-800' : 'text-slate-500'}`}>
                        {item.name} {item.req && <span className="text-red-400">*</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <h3 className="font-bold text-lg text-slate-700">Cronologia Noleggi</h3>
              <div className="relative">
                <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-indigo-100"></div>
                <div className="space-y-8">
                  {/* Combine RentalHistory from profile + actual contracts */}
                  {[...(selectedClient.rentalHistory || []).map(r => ({ ...r, type: 'ARCHIVED' })), ...clientContracts.map(c => ({ ...c, type: 'CONTRACT' }))].map((item: any, i) => (
                    <div key={i} className="relative pl-16">
                      <div className="absolute left-4 top-1 w-5 h-5 rounded-full bg-indigo-500 border-4 border-white shadow-sm z-10"></div>
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-bold text-slate-800">
                              {item.type === 'CONTRACT' ?
                                `${fleet.find(f => f.id === item.carId)?.brand} ${fleet.find(f => f.id === item.carId)?.model}`
                                : item.carModel}
                            </div>
                            <div className="text-sm text-slate-500 font-mono">
                              {item.type === 'CONTRACT' ? fleet.find(f => f.id === item.carId)?.plate : item.plate}
                            </div>
                          </div>
                          <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">
                            {item.status}
                          </span>
                        </div>
                        <div className="flex justify-between items-end mt-4">
                          <div className="text-xs text-slate-400">
                            {item.startDate} → {item.endDate}
                          </div>
                          <div className="font-bold text-indigo-600">
                            € {item.totalAmount}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Document Preview Modal */}
        {previewDoc && (
          <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
              <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800">Anteprima Documento</h3>
                <div className="flex gap-2">
                    <button onClick={() => handlePrintDoc(previewDoc)} className="p-2 hover:bg-indigo-100 text-indigo-600 rounded-full flex items-center gap-2 px-3">
                        <Printer className="w-4 h-4" /> <span className="text-xs font-bold">Stampa</span>
                    </button>
                    <button onClick={() => setPreviewDoc(null)} className="p-2 hover:bg-slate-200 rounded-full"><X className="w-5 h-5" /></button>
                </div>
              </div>
              <div className="flex-1 bg-slate-100 overflow-auto flex items-center justify-center p-4">
                {previewDoc.endsWith('.pdf') ? (
                  <iframe src={previewDoc} className="w-full h-full rounded border border-slate-300" />
                ) : (
                  <img src={previewDoc} className="max-w-full max-h-full rounded shadow-lg" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Contract Generator Modal */}
        {showContractModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl h-[85vh] flex flex-col animate-in zoom-in">
              <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-xl">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <FileCheck className="w-6 h-6 text-indigo-600" /> Generazione Rapida Contratto
                </h3>
                <button onClick={() => setShowContractModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-6 h-6 text-slate-500" />
                </button>
              </div>
              <div className="flex-1 p-8 overflow-y-auto bg-slate-100/50">
                <div className="bg-white p-12 shadow-sm border border-slate-200 min-h-full font-serif text-slate-900 leading-relaxed max-w-2xl mx-auto">
                  <h1 className="text-2xl font-bold text-center mb-8 uppercase tracking-widest border-b-2 border-slate-900 pb-4">Contratto di Noleggio</h1>

                  <p className="mb-6">
                    Il presente contratto è stipulato in data <strong>{new Date().toLocaleDateString()}</strong> tra:
                  </p>

                  <div className="mb-6">
                    <h4 className="font-bold underline mb-2">LOCATORE:</h4>
                    <p>RentSync AI Solutions S.r.l.<br />Via dell'Innovazione 1, Milano (MI)</p>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-bold underline mb-2">CLIENTE:</h4>
                    <p><strong>{selectedClient.name}</strong></p>
                    <p>{selectedClient.address?.street}, {selectedClient.address?.city} ({selectedClient.address?.province})</p>
                    <p>P.IVA/CF: {selectedClient.vatNumber || selectedClient.fiscalCode}</p>
                  </div>
                  <div className="mb-6 bg-slate-50 p-6 border border-slate-200 rounded-lg">
                    <h4 className="font-bold underline mb-4">DETTAGLI NOLEGGIO & PIANO FINANZIARIO:</h4>
                    {clientContracts.length > 0 ? (
                      (() => {
                        const c = clientContracts[0];
                        const car = fleet.find(f => f.id === c.carId);

                        // Calculations
                        const start = new Date(c.startDate);
                        const end = new Date(c.endDate);
                        const durationMs = end.getTime() - start.getTime();
                        const months = Math.round(durationMs / (1000 * 60 * 60 * 24 * 30));
                        const monthlyRate = c.totalAmount / (months || 1);

                        // Identify Rate Tier
                        let rateName = 'Personalizzata';
                        if (months === 12) rateName = 'Listino 12 Mesi';
                        if (months === 24) rateName = 'Listino 24 Mesi';
                        if (months === 36) rateName = 'Listino 36 Mesi';
                        if (months === 48) rateName = 'Listino 48 Mesi';

                        return (
                          <div className="space-y-3 text-sm">
                            <div className="grid grid-cols-2 gap-4 border-b pb-3 border-slate-200">
                              <div>
                                <span className="block text-xs uppercase text-slate-500 font-bold">Veicolo</span>
                                <span className="font-bold text-slate-900 text-lg">{car?.brand} {car?.model}</span>
                                <span className="block text-slate-600 font-mono">Targa: {car?.plate}</span>
                              </div>
                              <div className="text-right">
                                <span className="block text-xs uppercase text-slate-500 font-bold">Durata Contrattuale</span>
                                <span className="font-bold text-slate-900">{months} Mesi</span>
                                <span className="block text-slate-500 text-xs">({c.startDate} - {c.endDate})</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                              <div>
                                <span className="block text-xs uppercase text-slate-500 font-bold">Tariffa Applicata</span>
                                <span className="font-medium text-slate-800">{rateName}</span>
                              </div>
                              <div className="text-right">
                                <span className="block text-xs uppercase text-slate-500 font-bold">Canone Mensile (i.e.)</span>
                                <span className="font-bold text-indigo-700 text-xl">€ {monthlyRate.toFixed(2)}</span>
                              </div>
                            </div>

                            <div className="bg-white p-3 border border-slate-200 rounded mt-3 flex justify-between items-center">
                              <div>
                                <span className="block text-xs uppercase text-slate-500 font-bold">Prossima Scadenza Rata</span>
                                <span className="text-red-600 font-bold">{c.nextPaymentDate ? new Date(c.nextPaymentDate).toLocaleDateString() : 'Non definita'}</span>
                              </div>
                              <div className="text-right">
                                <span className="block text-xs uppercase text-slate-500 font-bold">Totale Contratto</span>
                                <span className="font-medium text-slate-900">€ {c.totalAmount.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <p className="italic text-slate-400">[Nessun contratto attivo selezionato]</p>
                    )}
                  </div>

                  {linkedAgent && (
                    <div className="mb-8 text-sm text-slate-500 border-t pt-4">
                      <p>Intermediario / Subagente: {linkedAgent.name} (ID: {linkedAgent.id})</p>
                    </div>
                  )}

                  <div className="mt-12 flex justify-between pt-12">
                    <div className="text-center w-40">
                      <p className="border-t border-slate-900 pt-2">Firma Locatore</p>
                    </div>
                    <div className="text-center w-40">
                      <p className="border-t border-slate-900 pt-2">Firma Cliente</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t bg-white rounded-b-xl flex justify-end gap-3">
                <button onClick={() => setShowContractModal(false)} className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-bold">Annulla</button>
                <button className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-bold shadow-lg flex items-center gap-2">
                  <Printer className="w-4 h-4" /> Stampa / PDF
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-300">
                <div className="bg-red-50 p-8 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6 ring-8 ring-red-50">
                        <Trash2 className="w-10 h-10 text-red-600" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">Elimina Cliente?</h3>
                    <p className="text-sm text-slate-500 leading-relaxed px-4">
                        Stai per eliminare definitivamente <strong>{selectedClient?.name}</strong>. Questa azione cancellerà anche tutto lo storico noleggi e i documenti allegati.
                    </p>
                </div>
                <div className="p-6 bg-white border-t border-slate-100 flex gap-3">
                    <button 
                        onClick={() => setShowDeleteModal(false)}
                        className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                    >
                        Annulla
                    </button>
                    <button 
                        onClick={handleConfirmDelete}
                        className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 shadow-lg shadow-red-200 active:scale-95 transition-all"
                    >
                        Elimina Ora
                    </button>
                </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  // Main List View
  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Gestione Clienti</h2>
          <p className="text-slate-500">Archivio anagrafiche e stato solvibilità.</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Nuovo Cliente
        </button>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">Aggiungi Nuovo Cliente</h3>
            <form onSubmit={handleAddClient} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Nome Cognome/Ragione Sociale</label>
                <input
                  type="text" required
                  className="w-full p-2 border rounded-lg"
                  value={newClient.name || ''}
                  onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Tipo</label>
                  <select
                    className="w-full p-2 border rounded-lg"
                    value={newClient.type}
                    onChange={e => setNewClient({ ...newClient, type: e.target.value as any })}
                  >
                    <option>Privato</option>
                    <option>Azienda</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Telefono</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-lg"
                    value={newClient.phone || ''}
                    onChange={e => setNewClient({ ...newClient, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Email</label>
                  <input
                    type="email"
                    className="w-full p-2 border rounded-lg"
                    value={newClient.email || ''}
                    onChange={e => setNewClient({ ...newClient, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    P.IVA {newClient.type === 'Azienda' && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    required={newClient.type === 'Azienda'}
                    placeholder={newClient.type === 'Azienda' ? 'Obbligatoria' : 'Opzionale'}
                    className={`w-full p-2 border rounded-lg ${newClient.type === 'Azienda' && !newClient.vatNumber ? 'border-red-300 focus:ring-red-200' : ''}`}
                    value={newClient.vatNumber || ''}
                    onChange={e => setNewClient({ ...newClient, vatNumber: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700">Residenza/Sede Legale (Via/Piazza)</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-lg"
                    placeholder="Es. Via Roma 10"
                    value={newClient.address?.street || ''}
                    onChange={e => setNewClient({ ...newClient, address: { ...(newClient.address || { city: '', zip: '', province: '' }), street: e.target.value } })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Città</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-lg"
                    value={newClient.address?.city || ''}
                    onChange={e => setNewClient({ ...newClient, address: { ...(newClient.address || { street: '', zip: '', province: '' }), city: e.target.value } })}
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700">CAP</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-lg"
                      value={newClient.address?.zip || ''}
                      onChange={e => setNewClient({ ...newClient, address: { ...(newClient.address || { street: '', city: '', province: '' }), zip: e.target.value } })}
                    />
                  </div>
                  <div className="w-20">
                    <label className="block text-sm font-medium text-slate-700">PR</label>
                    <input
                      type="text"
                      maxLength={2}
                      className="w-full p-2 border rounded-lg uppercase"
                      value={newClient.address?.province || ''}
                      onChange={e => setNewClient({ ...newClient, address: { ...(newClient.address || { street: '', city: '', zip: '' }), province: e.target.value.toUpperCase() } })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Annulla</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Salva Cliente</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="p-4 border-b border-slate-100 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cerca per nome o email..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-auto flex-1">
          <table className="w-full text-left">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Cliente</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Contatti</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Subagente</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Score Rischio</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Stato</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map(client => {
                // Calculate alerts for list view
                const clientContracts = contracts.filter(c => c.clientId === client.id && c.status === 'Attivo');
                const upcomingPayment = clientContracts.find(c => c.nextPaymentDate && new Date(c.nextPaymentDate) > new Date());
                const daysToPayment = upcomingPayment?.nextPaymentDate ? Math.ceil((new Date(upcomingPayment.nextPaymentDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : null;
                const linkedAgent = client.subagentId ? agents.find(a => a.id === client.subagentId) : null;

                return (
                  <tr key={client.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setSelectedClient(client)}>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 flex items-center gap-2">
                        {client.name}
                        {daysToPayment && daysToPayment <= 7 && (
                          <div className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-bold animate-pulse" title={`Prossima rata tra ${daysToPayment} giorni`}>
                            <Bell className="w-3 h-3" /> {daysToPayment}gg
                          </div>
                        )}
                      </div>
                      {client.vatNumber && <div className="text-xs text-slate-500">P.IVA: {client.vatNumber}</div>}
                      {client.address?.city && <div className="text-xs text-indigo-600 font-medium">{client.address.city} {client.address.province ? `(${client.address.province})` : ''}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600">{client.email}</div>
                      <div className="text-sm text-slate-500">{client.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      {linkedAgent ? (
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 w-fit">
                          <Briefcase className="w-3.5 h-3.5" />
                          {linkedAgent.name}
                        </div>
                      ) : (
                        <span className="text-slate-300 font-bold px-2">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {client.type === 'Azienda' ? <Building2 className="w-3 h-3" /> : <User className="w-3 h-3" />}
                        {client.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${client.riskScore && client.riskScore > 80 ? 'bg-green-500' : client.riskScore && client.riskScore > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${client.riskScore}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium">{client.riskScore}/100</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${client.status === 'Attivo' ? 'bg-green-100 text-green-700' :
                        client.status === 'Bloccato' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedClient(client); }}
                          className="text-slate-400 hover:text-indigo-600 transition-colors p-2"
                          title="Vedi Dettagli"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedClient(client); setShowDeleteModal(true); }}
                          className="text-slate-400 hover:text-red-600 transition-colors p-2"
                          title="Elimina Cliente"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClientsManager;