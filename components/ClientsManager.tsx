import React, { useState } from 'react';
import { Client, Contract, CarStatus, Car } from '../types';
import { useApp } from '../contexts/AppContext';
import { Users, Search, Plus, Building2, User, ArrowLeft, History, Calendar, Car as CarIcon, Eye, Printer, Share2, Camera, UploadCloud, X, AlertTriangle, ArrowRight, CheckCircle2, Save, Key, Filter, Trash2, ChevronRight, BadgeCheck } from 'lucide-react';

const ClientsManager: React.FC = () => {
  const { clients, contracts, fleet, addClient, deleteClient, updateContractPhotos, createContract } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyActive, setOnlyActive] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // State for New Rental Modal
  const [showRentModal, setShowRentModal] = useState(false);
  const [rentForm, setRentForm] = useState({
      carId: '',
      startDate: '',
      endDate: ''
  });

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

  const handleDeleteClient = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if(window.confirm("Sei sicuro di voler eliminare questo cliente e tutti i suoi contratti? L'operazione è irreversibile.")) {
        deleteClient(id);
        if(selectedClient?.id === id) setSelectedClient(null);
    }
  };

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name) return;
    
    if (newClient.type === 'Azienda' && !newClient.vatNumber) {
      alert("La Partita IVA è obbligatoria per le aziende.");
      return;
    }

    const client: Client = {
      id: Date.now().toString(),
      name: newClient.name || '',
      email: newClient.email || '',
      phone: newClient.phone || '',
      type: newClient.type as 'Privato' | 'Azienda',
      vatNumber: newClient.vatNumber,
      status: 'Attivo',
      riskScore: 50,
      ...newClient
    };
    addClient(client);
    setShowAddForm(false);
    setNewClient({ type: 'Privato', status: 'Attivo' });
  };

  const handleCreateContract = (e: React.FormEvent) => {
      e.preventDefault();
      if(!selectedClient || !rentForm.carId || !rentForm.startDate || !rentForm.endDate) {
          alert("Seleziona un veicolo e le date.");
          return;
      }

      const car = fleet.find(c => c.id === rentForm.carId);
      const days = Math.ceil((new Date(rentForm.endDate).getTime() - new Date(rentForm.startDate).getTime()) / (1000 * 3600 * 24));
      const total = (car?.pricePerDay || 0) * (days > 0 ? days : 1);

      const newContract: Contract = {
          id: `CNT-${Date.now()}`,
          agentId: 'DIRECT_OFFICE',
          clientId: selectedClient.id,
          carId: rentForm.carId,
          startDate: rentForm.startDate,
          endDate: rentForm.endDate,
          totalAmount: total,
          commissionAmount: 0,
          status: 'Attivo',
          signedDate: new Date().toISOString()
      };

      createContract(newContract);
      setShowRentModal(false);
      setRentForm({ carId: '', startDate: '', endDate: '' });
      alert("Noleggio attivato con successo!");
  };

  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.email.toLowerCase().includes(searchTerm.toLowerCase());
    const hasActiveContract = contracts.some(cnt => cnt.clientId === c.id && cnt.status === 'Attivo');
    
    if (onlyActive) {
      return matchesSearch && hasActiveContract;
    }
    return matchesSearch;
  });

  const availableCars = fleet.filter(c => c.status === CarStatus.AVAILABLE);

  // Detail View
  if (selectedClient) {
    const clientContracts = contracts.filter(c => c.clientId === selectedClient.id).sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

    return (
      <div className="p-6 h-full flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex justify-between items-center mb-6 print:hidden">
            <div className="flex items-center gap-4">
            <button 
                onClick={() => setSelectedClient(null)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
            >
                <ArrowLeft className="w-6 h-6 text-slate-700" />
            </button>
            <div>
                <h2 className="text-3xl font-bold text-slate-800">{selectedClient.name}</h2>
                <p className="text-slate-500 flex items-center gap-2">
                <span className={`inline-block w-2 h-2 rounded-full ${selectedClient.status === 'Attivo' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                Scheda Cliente & Storico
                </p>
            </div>
            </div>
            <div className="flex gap-2">
                <button onClick={() => setShowRentModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700 font-medium shadow-lg shadow-indigo-200">
                    <Plus className="w-4 h-4"/> Nuovo Noleggio
                </button>
                <button 
                  onClick={(e) => handleDeleteClient(e, selectedClient.id)} 
                  className="px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg flex items-center gap-2 hover:bg-red-50 font-medium transition-colors"
                >
                    <Trash2 className="w-4 h-4"/> Elimina Cliente
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-fit">
            <h3 className="font-bold text-lg mb-4 text-slate-700 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-500" /> Dati Anagrafici
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Tipo</label>
                <div className="flex items-center gap-2 mt-1">
                  {selectedClient.type === 'Azienda' ? <Building2 className="w-4 h-4 text-slate-600" /> : <User className="w-4 h-4 text-slate-600" />}
                  <span className="text-slate-800">{selectedClient.type}</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Contatti</label>
                <div className="mt-1 text-sm">
                  <p className="text-slate-800">{selectedClient.email}</p>
                  <p className="text-slate-600">{selectedClient.phone}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-400 uppercase">Affidabilità (AI Score)</label>
                <div className="flex items-center gap-3 mt-2">
                  <div className="text-2xl font-bold text-slate-800">{selectedClient.riskScore}/100</div>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${selectedClient.riskScore && selectedClient.riskScore > 80 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{width: `${selectedClient.riskScore}%`}} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
              <h3 className="font-bold text-lg text-slate-700 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-500" /> Storico Noleggi
              </h3>
              
              <div className="space-y-6">
                  {clientContracts.length > 0 ? clientContracts.map(contract => {
                      const car = fleet.find(f => f.id === contract.carId);
                      if(!car) return null;
                      const isActive = contract.status === 'Attivo';
                      return (
                          <div key={contract.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden ${isActive ? 'border-indigo-200 ring-2 ring-indigo-50' : 'border-slate-200'}`}>
                              <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                  <div className="flex items-center gap-3">
                                      <img src={car.image} className="w-12 h-8 object-cover rounded border" alt="car" />
                                      <div>
                                          <div className="font-bold text-slate-800">{car.brand} {car.model}</div>
                                          <div className="text-xs text-slate-500 font-mono">{car.plate}</div>
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <div className={`text-xs font-bold px-2 py-1 rounded-full inline-block ${isActive ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                                          {isActive ? 'IN CORSO' : 'CONCLUSO'}
                                      </div>
                                  </div>
                              </div>
                              <div className="p-4 text-sm text-slate-600">
                                  <div className="flex justify-between mb-1">
                                      <span>Inizio: {new Date(contract.startDate).toLocaleDateString()}</span>
                                      <span className="font-bold text-indigo-700">Riconsegna: {new Date(contract.endDate).toLocaleDateString()}</span>
                                  </div>
                                  <div className="font-bold text-indigo-600">Totale: € {contract.totalAmount.toLocaleString()}</div>
                              </div>
                          </div>
                      );
                  }) : (
                      <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                          <History className="w-12 h-12 text-slate-300 mx-auto mb-3"/>
                          <p className="text-slate-500 font-medium">Nessun noleggio precedente.</p>
                      </div>
                  )}
              </div>
          </div>
        </div>

        {/* New Rental Modal with Visual Car Picker */}
        {showRentModal && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-hidden flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold flex items-center gap-2"><CarIcon className="w-6 h-6 text-indigo-600"/> Nuova Assegnazione Veicolo</h3>
                        <button onClick={() => setShowRentModal(false)} className="text-slate-400 hover:text-slate-600 p-2"><X className="w-6 h-6"/></button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto pr-2">
                        <div className="mb-6">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-3">1. Scegli un'auto disponibile ({availableCars.length})</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {availableCars.length > 0 ? availableCars.map(car => (
                                    <div 
                                        key={car.id}
                                        onClick={() => setRentForm({...rentForm, carId: car.id})}
                                        className={`group relative p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4 ${rentForm.carId === car.id ? 'border-indigo-600 bg-indigo-50 shadow-md shadow-indigo-100' : 'border-slate-100 hover:border-indigo-200 bg-white'}`}
                                    >
                                        <div className="w-20 h-14 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                                            <img src={car.image} className="w-full h-full object-cover" alt="car" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-slate-900 truncate">{car.brand} {car.model}</div>
                                            <div className="text-[10px] text-slate-500 font-mono">{car.plate}</div>
                                            <div className="text-xs font-bold text-indigo-600 mt-1">€{car.pricePerDay}/gg</div>
                                        </div>
                                        {rentForm.carId === car.id && (
                                            <div className="absolute top-2 right-2 bg-indigo-600 text-white rounded-full p-0.5 animate-in zoom-in">
                                                <BadgeCheck className="w-4 h-4" />
                                            </div>
                                        )}
                                    </div>
                                )) : (
                                    <div className="col-span-2 py-8 text-center bg-slate-50 rounded-xl border border-dashed text-slate-400">
                                        Nessuna auto disponibile al momento. Controlla il parco auto.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Inizio Noleggio</label>
                                <input type="date" className="w-full p-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={rentForm.startDate} onChange={e => setRentForm({...rentForm, startDate: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Fine Prevista</label>
                                <input type="date" className="w-full p-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={rentForm.endDate} onChange={e => setRentForm({...rentForm, endDate: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex gap-3">
                        <button onClick={() => setShowRentModal(false)} className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl">Annulla</button>
                        <button 
                            onClick={handleCreateContract} 
                            disabled={!rentForm.carId || !rentForm.startDate || !rentForm.endDate}
                            className="flex-[2] bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                        >
                            <Save className="w-5 h-5"/> Conferma e Attiva
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Anagrafica Clienti</h2>
          <p className="text-slate-500">Gestione contratti, ispezioni e solvibilità.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-200"
        >
          <Plus className="w-5 h-5" /> Nuovo Cliente
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-4 items-center bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Cerca cliente per nome o email..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setOnlyActive(!onlyActive)}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-all border ${
              onlyActive ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Solo con Noleggio Attivo
          </button>
        </div>

        <div className="overflow-auto flex-1">
          <table className="w-full text-left">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contatti</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Punteggio AI</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Stato Noleggio</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map(client => {
                const activeContract = contracts.find(c => c.clientId === client.id && c.status === 'Attivo');
                const activeCar = activeContract ? fleet.find(f => f.id === activeContract.carId) : null;
                return (
                  <tr 
                    key={client.id} 
                    className={`hover:bg-slate-50 transition-colors cursor-pointer group relative ${activeContract ? 'bg-indigo-50/30' : ''}`} 
                    onClick={() => setSelectedClient(client)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                          {client.name}
                          {activeContract && <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse shadow-[0_0_8px_indigo]" />}
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">{client.type}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600">{client.email}</div>
                      <div className="text-xs text-slate-400">{client.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                         <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${client.riskScore! > 80 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {client.riskScore}/100
                         </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {activeContract && activeCar ? (
                        <div className="flex flex-col gap-1">
                             <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-white border border-indigo-100 px-3 py-1.5 rounded-lg shadow-sm w-fit">
                                <CarIcon className="w-3.5 h-3.5"/> {activeCar.brand} {activeCar.model}
                             </div>
                             <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 ml-1">
                                <Calendar className="w-3 h-3"/> Fine: {new Date(activeContract.endDate).toLocaleDateString()}
                             </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Nessun noleggio</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button 
                            onClick={(e) => handleDeleteClient(e, client.id)}
                            className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all z-20 relative"
                            title="Elimina Cliente"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                        <button 
                            className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="Apri Scheda"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredClients.length === 0 && (
              <div className="p-20 text-center text-slate-400 flex flex-col items-center">
                  <Users className="w-16 h-16 mb-4 opacity-10" />
                  <p className="font-medium text-lg">Nessun cliente trovato</p>
                  <p className="text-sm">Prova a cambiare i filtri di ricerca.</p>
              </div>
          )}
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in zoom-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2"><Plus className="w-6 h-6 text-indigo-600"/> Nuovo Cliente</h3>
                <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6"/></button>
            </div>
            <form onSubmit={handleAddClient} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome / Ragione Sociale</label>
                <input type="text" required className="w-full p-3 bg-slate-50 border rounded-xl" value={newClient.name || ''} onChange={e => setNewClient({...newClient, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo</label>
                    <select className="w-full p-3 bg-slate-50 border rounded-xl" value={newClient.type} onChange={e => setNewClient({...newClient, type: e.target.value as any})}>
                      <option>Privato</option>
                      <option>Azienda</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telefono</label>
                    <input type="text" className="w-full p-3 bg-slate-50 border rounded-xl" value={newClient.phone || ''} onChange={e => setNewClient({...newClient, phone: e.target.value})} />
                 </div>
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 mt-4">Salva Anagrafica</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsManager;