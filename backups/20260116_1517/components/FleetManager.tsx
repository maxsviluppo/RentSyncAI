import React, { useState } from 'react';
import { Car, CarStatus } from '../types';
import { generateCarDetails } from '../services/gemini';
import { useApp } from '../contexts/AppContext';
import { Car as CarIcon, Battery, Fuel, Settings, AlertCircle, Filter, X, Plus, Sparkles, Loader2, Save, Trash2, Edit3, Gauge, Euro, Tag, Calendar, Settings2, Info, UploadCloud, Check, FileImage, ArrowRight } from 'lucide-react';

const FleetManager: React.FC = () => {
    const { fleet, addCar, updateCarStatus, updateCar, deleteCar } = useApp();
    const [categoryFilter, setCategoryFilter] = useState<string>('Tutte');
    const [statusFilter, setStatusFilter] = useState<string>('Tutti');

    // New Car Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [newCar, setNewCar] = useState<Partial<Car>>({
        status: CarStatus.AVAILABLE,
        category: 'Economy',
        year: new Date().getFullYear(),
        condition: 'Nuovo',
        fuelType: 'Benzina',

        transmission: 'Manuale',
        mileage: 0,
        rentalRates: {
            monthly1: 0, monthly3: 0, monthly6: 0, monthly12: 0, monthly24: 0, monthly48: 0
        }
    });
    const [aiLoading, setAiLoading] = useState(false);

    // Detail/Edit Modal State
    const [selectedCar, setSelectedCar] = useState<Car | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);

    // Batch Upload State
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [pendingUploads, setPendingUploads] = useState<{ file: File, preview: string, matchId: string | null }[]>([]);

    const filteredFleet = fleet.filter(car => {
        const matchCategory = categoryFilter === 'Tutte' || car.category === categoryFilter;
        const matchStatus = statusFilter === 'Tutti' || car.status === statusFilter;
        return matchCategory && matchStatus;
    });

    const clearFilters = () => {
        setCategoryFilter('Tutte');
        setStatusFilter('Tutti');
    };

    const handleStatusToggle = (carId: string, currentStatus: CarStatus) => {
        const statusCycle = [CarStatus.AVAILABLE, CarStatus.RENTED, CarStatus.MAINTENANCE];
        const currentIndex = statusCycle.indexOf(currentStatus);
        const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];

        updateCarStatus(carId, nextStatus);
    };

    const handleAiFill = async () => {
        if (!newCar.brand || !newCar.model) {
            alert("Inserisci Marca e Modello prima di usare l'AI.");
            return;
        }
        setAiLoading(true);
        try {
            const details = await generateCarDetails(newCar.brand, newCar.model, newCar.year);
            setNewCar(prev => ({
                ...prev,
                ...details,
                image: `https://picsum.photos/400/250?random=${Date.now()}` // Mock image
            }));
        } catch (e) {
            alert("Errore generazione AI");
        } finally {
            setAiLoading(false);
        }
    };

    const handleSaveCar = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCar.brand && newCar.model && newCar.plate && newCar.pricePerDay) {
            const carToAdd: Car = {
                id: Date.now().toString(),
                brand: newCar.brand,
                model: newCar.model,
                plate: newCar.plate,
                category: newCar.category as any,
                pricePerDay: Number(newCar.pricePerDay),
                status: CarStatus.AVAILABLE,
                image: newCar.image || 'https://picsum.photos/400/250?random=99',
                features: newCar.features || [],
                description: newCar.description || '',
                year: newCar.year || new Date().getFullYear(),
                mileage: Number(newCar.mileage) || 0,
                condition: newCar.condition || 'Nuovo',

                fuelType: newCar.fuelType || 'Benzina',
                transmission: newCar.transmission || 'Manuale',
                accessories: newCar.accessories || [],
                rentalRates: newCar.rentalRates || {}
            };
            addCar(carToAdd);
            setShowAddModal(false);
            setNewCar({ status: CarStatus.AVAILABLE, category: 'Economy', year: new Date().getFullYear(), condition: 'Nuovo', fuelType: 'Benzina', transmission: 'Manuale', mileage: 0 });
        } else {
            alert("Compila i campi obbligatori.");
        }
    };

    const handleUpdateCar = () => {
        if (selectedCar) {
            updateCar(selectedCar);
            setIsEditMode(false);
        }
    };

    const handleDeleteCar = () => {
        if (selectedCar && confirm("Sei sicuro di voler eliminare questo veicolo?")) {
            deleteCar(selectedCar.id);
            setSelectedCar(null);
        }
    }

    // Batch Upload Logic
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files: File[] = Array.from(e.target.files);
            const newPending = files.map(file => {
                // Simple AI matching logic based on filename
                const filename = file.name.toLowerCase().replace(/[-_]/g, ' ');
                const match = fleet.find(c => {
                    const brand = c.brand.toLowerCase();
                    const model = c.model.toLowerCase();
                    return filename.includes(model) || (filename.includes(brand) && filename.includes(model.split(' ')[0]));
                });

                return {
                    file,
                    preview: URL.createObjectURL(file),
                    matchId: match ? match.id : null
                };
            });
            setPendingUploads(prev => [...prev, ...newPending]);
        }
    };

    const applyBatchUpdates = () => {
        let count = 0;
        pendingUploads.forEach(p => {
            if (p.matchId) {
                const car = fleet.find(c => c.id === p.matchId);
                if (car) {
                    updateCar({ ...car, image: p.preview });
                    count++;
                }
            }
        });
        alert(`${count} immagini aggiornate con successo!`);
        setPendingUploads([]);
        setShowBatchModal(false);
    };

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Parco Auto</h2>
                    <p className="text-slate-500">Gestione flotta, stato manutenzione e disponibilità.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowBatchModal(true)}
                        className="bg-white text-indigo-600 border border-indigo-200 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-2"
                    >
                        <UploadCloud className="w-4 h-4" /> Upload Foto Massivo
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Nuova Auto
                    </button>
                </div>
            </div>

            {/* Batch Upload Modal */}
            {showBatchModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2"><Sparkles className="w-5 h-5 text-indigo-500" /> Caricamento Smart AI</h3>
                            <button onClick={() => setShowBatchModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
                        </div>

                        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-4 text-sm text-indigo-800">
                            Carica più foto contemporaneamente. Il sistema analizzerà i nomi dei file (es. "bmw_x5.jpg") per associarli automaticamente ai veicoli in flotta.
                        </div>

                        <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer relative mb-4">
                            <input type="file" multiple accept="image/*" onChange={handleFileSelect} className="absolute inset-0 opacity-0 cursor-pointer" />
                            <UploadCloud className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                            <p className="font-medium text-slate-600">Trascina qui le foto o clicca per selezionare</p>
                            <p className="text-xs text-slate-400 mt-1">JPG, PNG supportati</p>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 min-h-[200px] mb-4 pr-2">
                            {pendingUploads.map((item, idx) => {
                                const matchedCar = fleet.find(c => c.id === item.matchId);
                                return (
                                    <div key={idx} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                                        <img src={item.preview} className="w-12 h-12 object-cover rounded bg-slate-100" alt="preview" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-slate-500 truncate">{item.file.name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <ArrowRight className="w-3 h-3 text-slate-400" />
                                                <select
                                                    className={`text-sm font-bold border rounded px-1 py-0.5 ${item.matchId ? 'text-green-600 border-green-200 bg-green-50' : 'text-slate-400'}`}
                                                    value={item.matchId || ''}
                                                    onChange={(e) => {
                                                        const newPending = [...pendingUploads];
                                                        newPending[idx].matchId = e.target.value || null;
                                                        setPendingUploads(newPending);
                                                    }}
                                                >
                                                    <option value="">Nessuna Associazione</option>
                                                    {fleet.map(c => <option key={c.id} value={c.id}>{c.brand} {c.model} ({c.plate})</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <button onClick={() => setPendingUploads(pendingUploads.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                                    </div>
                                )
                            })}
                            {pendingUploads.length === 0 && (
                                <div className="text-center text-slate-400 py-10 italic">Nessun file selezionato</div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                            <button onClick={() => setPendingUploads([])} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Pulisci</button>
                            <button
                                onClick={applyBatchUpdates}
                                disabled={pendingUploads.length === 0}
                                className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" /> Applica {pendingUploads.filter(p => p.matchId).length} Modifiche
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Car Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">Aggiungi Veicolo</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
                        </div>

                        <form onSubmit={handleSaveCar} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Marca</label>
                                    <input type="text" className="w-full p-2 border rounded-lg" value={newCar.brand || ''} onChange={e => setNewCar({ ...newCar, brand: e.target.value })} required placeholder="Es. Audi" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Modello</label>
                                    <input type="text" className="w-full p-2 border rounded-lg" value={newCar.model || ''} onChange={e => setNewCar({ ...newCar, model: e.target.value })} required placeholder="Es. A4" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Anno</label>
                                    <input type="number" className="w-full p-2 border rounded-lg" value={newCar.year || ''} onChange={e => setNewCar({ ...newCar, year: Number(e.target.value) })} required placeholder="Es. 2024" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Stato</label>
                                    <select className="w-full p-2 border rounded-lg" value={newCar.condition} onChange={e => setNewCar({ ...newCar, condition: e.target.value as any })}>
                                        <option>Nuovo</option>
                                        <option>Usato</option>
                                    </select>
                                </div>
                            </div>

                            {/* AI Auto-Complete Button */}
                            <button
                                type="button"
                                onClick={handleAiFill}
                                disabled={aiLoading}
                                className="w-full bg-indigo-50 text-indigo-700 border border-indigo-200 py-2 rounded-lg font-bold hover:bg-indigo-100 flex items-center justify-center gap-2"
                            >
                                {aiLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                                Autocompleta Scheda con AI
                            </button>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Targa</label>
                                    <input type="text" className="w-full p-2 border rounded-lg uppercase font-mono" value={newCar.plate || ''} onChange={e => setNewCar({ ...newCar, plate: e.target.value })} required placeholder="AA 000 AA" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Km Attuali</label>
                                    <input type="number" className="w-full p-2 border rounded-lg" value={newCar.mileage || ''} onChange={e => setNewCar({ ...newCar, mileage: Number(e.target.value) })} required />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Categoria</label>
                                    <select className="w-full p-2 border rounded-lg" value={newCar.category} onChange={e => setNewCar({ ...newCar, category: e.target.value as any })}>
                                        <option>Economy</option>
                                        <option>SUV</option>
                                        <option>Luxury</option>
                                        <option>Van</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Prezzo / Giorno (€)</label>
                                    <input type="number" className="w-full p-2 border rounded-lg" value={newCar.pricePerDay || ''} onChange={e => setNewCar({ ...newCar, pricePerDay: Number(e.target.value) })} required />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Alimentazione</label>
                                    <select className="w-full p-2 border rounded-lg" value={newCar.fuelType} onChange={e => setNewCar({ ...newCar, fuelType: e.target.value as any })}>
                                        <option>Benzina</option>
                                        <option>Diesel</option>
                                        <option>Ibrido</option>
                                        <option>Elettrico</option>
                                        <option>GPL/Metano</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Cambio</label>
                                    <select className="w-full p-2 border rounded-lg" value={newCar.transmission} onChange={e => setNewCar({ ...newCar, transmission: e.target.value as any })}>
                                        <option>Manuale</option>
                                        <option>Automatico</option>
                                    </select>
                                </div>
                            </div>

                            {/* ACCESSORIES & RATES INPUTS */}
                            <div className="border-t border-slate-100 pt-4 mt-4">
                                <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                    <Euro className="w-4 h-4 text-indigo-600" /> Piano Finanziario & Accessori
                                </h4>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Accessori (separati da virgola)</label>
                                        <textarea
                                            className="w-full p-2 border rounded-lg text-sm"
                                            rows={3}
                                            placeholder="Tetto panoramico, Cerchi 19, ..."
                                            value={newCar.accessories?.join(', ') || ''}
                                            onChange={e => setNewCar({ ...newCar, accessories: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
                                        />
                                    </div>
                                    <div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase">1 Mese (€)</label>
                                                <input type="number" className="w-full p-1.5 border rounded" value={newCar.rentalRates?.monthly1 || ''} onChange={e => setNewCar({ ...newCar, rentalRates: { ...newCar.rentalRates, monthly1: Number(e.target.value) } })} />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase">12 Mesi (€)</label>
                                                <input type="number" className="w-full p-1.5 border rounded" value={newCar.rentalRates?.monthly12 || ''} onChange={e => setNewCar({ ...newCar, rentalRates: { ...newCar.rentalRates, monthly12: Number(e.target.value) } })} />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase">24 Mesi (€)</label>
                                                <input type="number" className="w-full p-1.5 border rounded" value={newCar.rentalRates?.monthly24 || ''} onChange={e => setNewCar({ ...newCar, rentalRates: { ...newCar.rentalRates, monthly24: Number(e.target.value) } })} />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase">48 Mesi (€)</label>
                                                <input type="number" className="w-full p-1.5 border rounded" value={newCar.rentalRates?.monthly48 || ''} onChange={e => setNewCar({ ...newCar, rentalRates: { ...newCar.rentalRates, monthly48: Number(e.target.value) } })} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {newCar.description && (
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <label className="block text-xs font-bold text-slate-400 uppercase">Descrizione AI</label>
                                    <p className="text-sm text-slate-700 italic">{newCar.description}</p>

                                    {(newCar.features || newCar.accessories) && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {newCar.features?.map((f, i) => (
                                                <span key={`f-${i}`} className="text-xs bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full text-indigo-700 font-medium">{f}</span>
                                            ))}
                                            {newCar.accessories?.map((a, i) => (
                                                <span key={`a-${i}`} className="text-xs bg-white border border-slate-200 px-2 py-0.5 rounded-full text-slate-600">{a}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 flex items-center justify-center gap-2 mt-4">
                                <Save className="w-5 h-5" /> Salva Veicolo
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Car Detail / Edit Modal */}
            {selectedCar && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row animate-in zoom-in">
                        {/* Left Image Section */}
                        <div className="md:w-2/5 bg-slate-100 relative">
                            <img src={selectedCar.image} alt="car" className="w-full h-full object-cover" />
                            <div className="absolute top-4 left-4 flex gap-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm backdrop-blur-md border border-white/20 ${selectedCar.status === CarStatus.AVAILABLE ? 'bg-green-500/90 text-white' :
                                    selectedCar.status === CarStatus.RENTED ? 'bg-blue-500/90 text-white' : 'bg-red-500/90 text-white'
                                    }`}>
                                    {selectedCar.status}
                                </span>
                                <span className="px-3 py-1 rounded-full text-xs font-bold shadow-sm backdrop-blur-md border border-white/20 bg-black/50 text-white">
                                    {selectedCar.year}
                                </span>
                            </div>
                        </div>

                        {/* Right Content Section */}
                        <div className="md:w-3/5 p-8 flex flex-col overflow-y-auto">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    {isEditMode ? (
                                        <div className="flex gap-2 mb-2">
                                            <input className="font-bold text-2xl border-b border-slate-300 w-32" value={selectedCar.brand} onChange={e => setSelectedCar({ ...selectedCar, brand: e.target.value })} />
                                            <input className="font-bold text-2xl border-b border-slate-300 w-32" value={selectedCar.model} onChange={e => setSelectedCar({ ...selectedCar, model: e.target.value })} />
                                        </div>
                                    ) : (
                                        <h2 className="text-3xl font-bold text-slate-900">{selectedCar.brand} {selectedCar.model}</h2>
                                    )}
                                    <div className="flex items-center gap-2 text-slate-500 mt-1">
                                        <Tag className="w-4 h-4" />
                                        {isEditMode ? (
                                            <select className="border rounded p-1 text-sm" value={selectedCar.category} onChange={e => setSelectedCar({ ...selectedCar, category: e.target.value as any })}>
                                                <option>Economy</option><option>SUV</option><option>Luxury</option><option>Van</option>
                                            </select>
                                        ) : (
                                            <span>{selectedCar.category}</span>
                                        )}
                                        <span className="mx-2">•</span>
                                        <span className="font-mono bg-slate-100 px-2 rounded text-slate-600 border border-slate-200">{selectedCar.plate}</span>
                                        <span className="mx-2">•</span>
                                        <span className="text-slate-500">{selectedCar.condition}</span>
                                    </div>
                                </div>
                                <button onClick={() => { setSelectedCar(null); setIsEditMode(false); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400 hover:text-slate-600" /></button>
                            </div>

                            {/* Tabs */}
                            <div className="flex border-b border-slate-200 mb-6">
                                <button onClick={() => setIsEditMode(false)} className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors ${!isEditMode ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Scheda Tecnica</button>
                                <button onClick={() => setIsEditMode(true)} className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors ${isEditMode ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Impostazioni</button>
                            </div>

                            <div className="flex-1 space-y-6">
                                {isEditMode ? (
                                    <div className="space-y-4 animate-in fade-in">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Prezzo (€/gg)</label>
                                                <input type="number" className="w-full p-3 border rounded-lg" value={selectedCar.pricePerDay} onChange={e => setSelectedCar({ ...selectedCar, pricePerDay: Number(e.target.value) })} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Anno Immatr.</label>
                                                <input type="number" className="w-full p-3 border rounded-lg" value={selectedCar.year} onChange={e => setSelectedCar({ ...selectedCar, year: Number(e.target.value) })} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Km Totali</label>
                                                <input type="number" className="w-full p-3 border rounded-lg" value={selectedCar.mileage} onChange={e => setSelectedCar({ ...selectedCar, mileage: Number(e.target.value) })} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Stato Veicolo</label>
                                                <select className="w-full p-3 border rounded-lg" value={selectedCar.status} onChange={e => setSelectedCar({ ...selectedCar, status: e.target.value as any })}>
                                                    <option>{CarStatus.AVAILABLE}</option>
                                                    <option>{CarStatus.RENTED}</option>
                                                    <option>{CarStatus.MAINTENANCE}</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Alimentazione</label>
                                                <select className="w-full p-3 border rounded-lg" value={selectedCar.fuelType} onChange={e => setSelectedCar({ ...selectedCar, fuelType: e.target.value as any })}>
                                                    <option>Benzina</option><option>Diesel</option><option>Ibrido</option><option>Elettrico</option><option>GPL/Metano</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cambio</label>
                                                <select className="w-full p-3 border rounded-lg" value={selectedCar.transmission} onChange={e => setSelectedCar({ ...selectedCar, transmission: e.target.value as any })}>
                                                    <option>Manuale</option><option>Automatico</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Edit Rental Rates */}
                                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mt-4">
                                            <h4 className="font-bold text-slate-700 mb-3 text-sm">Quote Noleggio Mensili (€)</h4>
                                            <div className="grid grid-cols-3 gap-3">
                                                {['monthly1', 'monthly3', 'monthly6', 'monthly12', 'monthly24', 'monthly48'].map((period) => (
                                                    <div key={period}>
                                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{period.replace('monthly', '')} Mesi</label>
                                                        <input
                                                            type="number"
                                                            className="w-full p-2 border rounded bg-white text-sm"
                                                            value={selectedCar.rentalRates?.[period as keyof typeof selectedCar.rentalRates] || 0}
                                                            onChange={e => setSelectedCar({
                                                                ...selectedCar,
                                                                rentalRates: {
                                                                    ...selectedCar.rentalRates,
                                                                    [period]: Number(e.target.value)
                                                                }
                                                            })}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descrizione</label>
                                            <textarea rows={3} className="w-full p-3 border rounded-lg" value={selectedCar.description} onChange={e => setSelectedCar({ ...selectedCar, description: e.target.value })} />
                                        </div>
                                        <div className="pt-4 mt-8 border-t border-slate-100 flex justify-between items-center">
                                            <button onClick={handleDeleteCar} className="text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2"><Trash2 className="w-4 h-4" /> Elimina Auto</button>
                                            <button onClick={handleUpdateCar} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg hover:bg-indigo-700 flex items-center gap-2"><Save className="w-4 h-4" /> Salva Modifiche</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6 animate-in fade-in">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                <div className="text-xs text-slate-500 uppercase font-bold mb-1">Tariffa</div>
                                                <div className="text-2xl font-bold text-indigo-600">€ {selectedCar.pricePerDay}<span className="text-sm text-slate-400 font-normal">/gg</span></div>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                <div className="text-xs text-slate-500 uppercase font-bold mb-1">Specifiche</div>
                                                <div className="text-sm font-medium text-slate-800 flex flex-col gap-1">
                                                    <span className="flex items-center gap-2">
                                                        {selectedCar.fuelType === 'Elettrico' ? <Battery className="w-4 h-4 text-green-500" /> : <Fuel className="w-4 h-4 text-orange-500" />}
                                                        {selectedCar.fuelType}
                                                    </span>
                                                    <span className="flex items-center gap-2">
                                                        <Settings2 className="w-4 h-4 text-slate-500" />
                                                        {selectedCar.transmission}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                                            <div className="flex items-center gap-2 border p-2 rounded-lg">
                                                <Gauge className="w-4 h-4 text-slate-400" />
                                                <span>{selectedCar.mileage.toLocaleString()} Km</span>
                                            </div>
                                            <div className="flex items-center gap-2 border p-2 rounded-lg">
                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                <span>Anno {selectedCar.year}</span>
                                            </div>
                                        </div>

                                        {/* RENTAL RATES DISPLAY */}
                                        {selectedCar.rentalRates && (selectedCar.rentalRates.monthly1 || selectedCar.rentalRates.monthly12) && (
                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-4 mb-4">
                                                <div className="text-xs text-slate-500 uppercase font-bold mb-3 flex items-center gap-2"><Euro className="w-3 h-3" /> Piano Noleggio Lungo Termine</div>
                                                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                                                    {[1, 3, 6, 12, 24, 48].map(m => {
                                                        const key = `monthly${m}` as keyof typeof selectedCar.rentalRates;
                                                        const val = selectedCar.rentalRates?.[key];
                                                        if (!val) return null;
                                                        return (
                                                            <div key={m} className="bg-white p-2 rounded border border-slate-200 text-center shadow-sm">
                                                                <div className="text-[10px] text-slate-400 font-bold">{m} Mesi</div>
                                                                <div className="text-sm font-bold text-indigo-700">€{val}</div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <h4 className="font-bold text-slate-800 mb-2">Caratteristiche</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedCar.features?.map((f, i) => (
                                                    <span key={i} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-sm text-slate-600 flex items-center gap-1">
                                                        <Sparkles className="w-3 h-3 text-indigo-400" /> {f}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {selectedCar.accessories && selectedCar.accessories.length > 0 && (
                                            <div>
                                                <h4 className="font-bold text-slate-800 mb-2">Accessori & Optional</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedCar.accessories.map((a, i) => (
                                                        <span key={i} className="px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-lg text-sm text-indigo-700 shadow-sm">
                                                            {a}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <h4 className="font-bold text-slate-800 mb-2">Descrizione</h4>
                                            <p className="text-slate-600 text-sm leading-relaxed">{selectedCar.description}</p>
                                        </div>

                                        <button onClick={() => setIsEditMode(true)} className="w-full py-3 border border-slate-200 rounded-lg text-slate-600 font-bold hover:bg-slate-50 flex items-center justify-center gap-2">
                                            <Edit3 className="w-4 h-4" /> Modifica Scheda
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-slate-500 mr-2">
                    <Filter className="w-4 h-4" />
                    <span className="text-sm font-medium">Filtra per:</span>
                </div>

                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                    <option value="Tutte">Tutte le Categorie</option>
                    <option value="Economy">Economy</option>
                    <option value="SUV">SUV</option>
                    <option value="Luxury">Luxury</option>
                    <option value="Van">Van</option>
                </select>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                    <option value="Tutti">Tutti gli Stati</option>
                    <option value={CarStatus.AVAILABLE}>{CarStatus.AVAILABLE}</option>
                    <option value={CarStatus.RENTED}>{CarStatus.RENTED}</option>
                    <option value={CarStatus.MAINTENANCE}>{CarStatus.MAINTENANCE}</option>
                </select>

                {(categoryFilter !== 'Tutte' || statusFilter !== 'Tutti') && (
                    <button
                        onClick={clearFilters}
                        className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors ml-auto"
                    >
                        <X className="w-4 h-4" /> Rimuovi filtri
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
                {filteredFleet.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-6">
                        {filteredFleet.map((car) => (
                            <div
                                key={car.id}
                                onClick={() => { setSelectedCar(car); setIsEditMode(false); }}
                                className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow group flex flex-col h-full cursor-pointer"
                            >
                                <div className="relative h-48 overflow-hidden flex-shrink-0">
                                    <img src={car.image} alt={`${car.brand} ${car.model}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    <div className="absolute top-3 right-3">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleStatusToggle(car.id, car.status);
                                            }}
                                            title="Clicca per cambiare stato"
                                            className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm backdrop-blur-sm transition-all hover:scale-105 active:scale-95 cursor-pointer ${car.status === CarStatus.AVAILABLE ? 'bg-green-100/90 text-green-700 hover:bg-green-100' :
                                                car.status === CarStatus.RENTED ? 'bg-blue-100/90 text-blue-700 hover:bg-blue-100' :
                                                    'bg-red-100/90 text-red-700 hover:bg-red-100'
                                                }`}>
                                            {car.status}
                                        </button>
                                    </div>
                                    <div className="absolute bottom-2 left-2 flex gap-1">
                                        <span className="bg-black/50 backdrop-blur-md text-white px-2 py-0.5 rounded text-[10px] font-bold">{car.year}</span>
                                        <span className="bg-black/50 backdrop-blur-md text-white px-2 py-0.5 rounded text-[10px] font-bold">{car.transmission.substring(0, 4)}.</span>
                                    </div>
                                </div>

                                <div className="p-5 flex flex-col flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-800">{car.brand} {car.model}</h3>
                                            <p className="text-slate-500 text-sm flex items-center gap-1">
                                                {car.category} • {car.fuelType}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="block font-bold text-indigo-600">€{car.pricePerDay}</span>
                                            <span className="text-xs text-slate-400">/giorno</span>
                                        </div>
                                    </div>

                                    {car.features && (
                                        <div className="flex flex-wrap gap-1 mb-3">
                                            {car.features.slice(0, 2).map((f, i) => (
                                                <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{f}</span>
                                            ))}
                                        </div>
                                    )}

                                    <div className="mt-auto pt-4 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
                                        <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                                            <span className="font-mono font-medium">{car.plate}</span>
                                        </span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setSelectedCar(car); setIsEditMode(true); }}
                                                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"
                                                title="Impostazioni"
                                            >
                                                <Settings className="w-4 h-4" />
                                            </button>
                                            <button className="p-1.5 hover:bg-slate-100 rounded-full text-slate-600 transition-colors" title="Segnala Problema">
                                                <AlertCircle className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <CarIcon className="w-12 h-12 mb-4 opacity-20" />
                        <p className="text-lg font-medium">Nessun veicolo trovato</p>
                        <p className="text-sm">Prova a modificare i filtri di ricerca.</p>
                        <button onClick={clearFilters} className="mt-4 text-indigo-600 hover:underline">Resetta filtri</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FleetManager;