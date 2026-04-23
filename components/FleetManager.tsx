import React, { useState } from 'react';
import { Car, CarStatus } from '../types';
import { generateCarDetails, analyzeMarketRates } from '../services/gemini';
import { useApp } from '../contexts/AppContext';
import { Car as CarIcon, Battery, Fuel, Settings, AlertCircle, Filter, X, Plus, Sparkles, Loader2, Save, Trash2, Edit3, Gauge, Euro, Tag, Calendar, Settings2, Info, UploadCloud, Check, FileImage, ArrowRight, FileText, Users, Zap } from 'lucide-react';
import ClientsManager from './ClientsManager';

const FleetManager: React.FC = () => {
    const { fleet, setFleet, addCar, updateCarStatus, updateCar, deleteCar } = useApp();
    const [activeTab, setActiveTab] = useState<'FLEET' | 'IMPORT'>('FLEET');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('Tutti');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
    const [selectedCar, setSelectedCar] = useState<Car | null>(null);
    const [pendingUploads, setPendingUploads] = useState<{ file: File, preview: string, matchId: string | null }[]>([]);
    
    // Pre-acquisition states (now persistent in a tab)
    const [importedItems, setImportedItems] = useState<Car[]>([]);
    const [selectedImportedIds, setSelectedImportedIds] = useState<Set<string>>(new Set());
    const [globalImportSearch, setGlobalImportSearch] = useState('');
    const [importFilters, setImportFilters] = useState({
        code: '',
        brand: '',
        model: '',
        fuel: '',
        delivery: ''
    });
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 15;

    const filteredImportedItems = importedItems.filter(item => {
        const matchesGlobal = !globalImportSearch || 
            `${item.brand} ${item.model} ${item.vehicleCode} ${item.plate}`.toLowerCase().includes(globalImportSearch.toLowerCase());
        
        return matchesGlobal &&
               item.vehicleCode.toLowerCase().includes(importFilters.code.toLowerCase()) &&
               (item.brand + ' ' + item.model).toLowerCase().includes(importFilters.brand.toLowerCase()) &&
               item.fuelType.toLowerCase().includes(importFilters.fuel.toLowerCase()) &&
               item.expectedDelivery.toLowerCase().includes(importFilters.delivery.toLowerCase());
    });

    const totalPages = Math.ceil(filteredImportedItems.length / pageSize);
    const paginatedItems = filteredImportedItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // Offer Modal State
    const [showOfferModal, setShowOfferModal] = useState<Car | null>(null);
    const [isEditingDetails, setIsEditingDetails] = useState(false);

    const handleImageChange = (carId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            if (result) {
                const updatedCar = fleet.find(c => c.id === carId);
                if (updatedCar) {
                    updateCar(carId, { ...updatedCar, image: result });
                    if (selectedCar?.id === carId) {
                        setSelectedCar({ ...selectedCar, image: result });
                    }
                }
            }
        };
        reader.readAsDataURL(file);
    };

    const [newCar, setNewCar] = useState<Partial<Car>>({
        status: CarStatus.AVAILABLE,
        brand: '',
        model: '',
        plate: '',
        vehicleCode: '',
        modelDescription: '',
        fuelType: 'Diesel',
        transmission: 'Automatico',
        externalColor: '',
        internalColor: '',
        optional: '',
        expectedDelivery: ''
    });

    const filteredFleet = fleet.filter(car => {
        const matchStatus = statusFilter === 'Tutti' || car.status === statusFilter;
        const searchStr = searchTerm.toLowerCase();
        return matchStatus && (
            car.brand.toLowerCase().includes(searchStr) || 
            car.model.toLowerCase().includes(searchStr) ||
            car.plate.toLowerCase().includes(searchStr) ||
            car.vehicleCode.toLowerCase().includes(searchStr)
        );
    });

    const clearFilters = () => {
        setStatusFilter('Tutti');
        setSearchTerm('');
    };

    const handleStatusToggle = (carId: string, currentStatus: CarStatus) => {
        const next = currentStatus === CarStatus.AVAILABLE ? CarStatus.RENTED : 
                     currentStatus === CarStatus.RENTED ? CarStatus.MAINTENANCE : CarStatus.AVAILABLE;
        updateCarStatus(carId, next);
    };

    const handleSaveCar = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCar.brand && newCar.model && newCar.plate && newCar.vehicleCode) {
            const carToAdd: Car = {
                id: newCar.vehicleCode,
                vehicleCode: newCar.vehicleCode,
                brand: newCar.brand.toUpperCase(),
                model: newCar.model.toUpperCase(),
                plate: newCar.plate.toUpperCase(),
                modelDescription: newCar.modelDescription || '',
                fuelType: newCar.fuelType || '',
                transmission: newCar.transmission || '',
                externalColor: newCar.externalColor || '',
                internalColor: newCar.internalColor || '',
                optional: newCar.optional || '',
                expectedDelivery: newCar.expectedDelivery || '',
                status: CarStatus.AVAILABLE,
                image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=800',
                offers: getDefaultOffers()
            };
            addCar(carToAdd);
            setShowAddModal(false);
            setNewCar({ status: CarStatus.AVAILABLE, brand: '', model: '', plate: '', vehicleCode: '' });
        }
    };

    const getDefaultOffers = () => [
        { duration: 36, kms: 30000, monthlyRate: 0, advance: 0, kasko: 500, theft: 0, rca: 250 },
        { duration: 36, kms: 45000, monthlyRate: 0, advance: 0, kasko: 500, theft: 0, rca: 250 },
        { duration: 36, kms: 60000, monthlyRate: 0, advance: 0, kasko: 500, theft: 0, rca: 250 },
        { duration: 48, kms: 40000, monthlyRate: 0, advance: 0, kasko: 500, theft: 0, rca: 250 },
        { duration: 48, kms: 45000, monthlyRate: 0, advance: 0, kasko: 500, theft: 0, rca: 250 },
        { duration: 48, kms: 60000, monthlyRate: 0, advance: 0, kasko: 500, theft: 0, rca: 250 },
    ] as any;

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            if (!text) return;

            // Robust CSV parser to handle newlines in quoted fields
            const parseCSV = (content: string) => {
                const rows: string[][] = [];
                let row: string[] = [];
                let field = '';
                let inQuotes = false;
                
                // Detect separator from the first line
                const firstNewLine = content.indexOf('\n');
                const firstLine = firstNewLine !== -1 ? content.substring(0, firstNewLine) : content;
                const separator = firstLine.includes(';') ? ';' : ',';

                for (let i = 0; i < content.length; i++) {
                    const char = content[i];
                    const nextChar = content[i + 1];
                    
                    if (inQuotes) {
                        if (char === '"' && nextChar === '"') {
                            field += '"';
                            i++;
                        } else if (char === '"') {
                            inQuotes = false;
                        } else {
                            field += char;
                        }
                    } else {
                        if (char === '"') {
                            inQuotes = true;
                        } else if (char === separator) {
                            row.push(field.trim());
                            field = '';
                        } else if (char === '\n' || char === '\r') {
                            if (field || row.length > 0) {
                                row.push(field.trim());
                                rows.push(row);
                                row = [];
                                field = '';
                            }
                            if (char === '\r' && nextChar === '\n') i++;
                        } else {
                            field += char;
                        }
                    }
                }
                if (field || row.length > 0) {
                    row.push(field.trim());
                    rows.push(row);
                }
                return { rows, separator };
            };

            const { rows, separator } = parseCSV(text);
            if (rows.length < 2) return;

            const headers = rows[0].map(h => h.toLowerCase().replace(/"/g, '').trim());
            
            const newItems: Car[] = rows.slice(1).map((row, i) => {
                const data: any = {};
                headers.forEach((h, index) => {
                    data[h] = row[index] || '';
                });

                // Skip rows that don't have a valid brand/make
                if (!data.makename && !data.marca && !data.brand) return null;

                return {
                    id: data.vehicleid || data['codice veicolo'] || `stk-${i}-${Date.now()}`,
                    vehicleCode: data.vehicleid || data['codice veicolo'] || '',
                    plate: data.licenseplate || data.license_plate || data.targa || data.targhe || '',
                    brand: data.makename || data.marca || data.brand || '',
                    model: data.modelname || data.modello || '',
                    fuelType: data.alimentazione_fuel_code || data.alimentazione || data.fuel || data.fueltypename || '',
                    transmission: data.transmissionname || data.cambio || data.trasmissione || data.transmission || '',
                    externalColor: data.external_color || data.extcolorname || data['colore esterno'] || '',
                    internalColor: data.internal_color || data.intcolorname || data['colore interno'] || '',
                    modelDescription: data.description || data['descrizione modello'] || data['descrizione'] || '',
                    optional: data.accessories || data.optional || '',
                    expectedDelivery: data.estimateddeliverydate || data.arrivaldate || data.etadate || data['prevista consegna'] || '',
                    price: parseFloat(data.prezzo_listino || data['prezzo listino'] || data.listprice || '0') || 0,
                    status: CarStatus.AVAILABLE,
                    image: `https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=400`,
                    year: new Date().getFullYear(),
                    offers: getDefaultOffers()
                } as Car;
            }).filter((item): item is Car => 
                item !== null && 
                item.brand && 
                item.brand.toUpperCase() !== 'MARCA' && 
                !item.brand.toUpperCase().includes('STOCK') &&
                item.vehicleCode
            );

            if (newItems.length > 0) {
                setImportedItems(newItems);
                setSelectedImportedIds(new Set());
                setActiveTab('IMPORT');
                alert(`DB caricato correttamente con ${newItems.length} veicoli allineati.`);
            } else {
                alert("Nessun veicolo valido trovato nel file. Verifica il formato delle colonne.");
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const confirmTransferToFleet = () => {
        const toAdd = importedItems.filter(item => selectedImportedIds.has(item.id));
        setFleet([...fleet, ...toAdd]); // Use direct spread instead of functional update
        setSelectedImportedIds(new Set());
        setActiveTab('FLEET');
        alert(`Acquisite con successo ${toAdd.length} auto.`);
    };

    const toggleImportSelection = (id: string) => {
        const next = new Set(selectedImportedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedImportedIds(next);
    };

    const toggleAllImports = () => {
        if (selectedImportedIds.size === importedItems.length) setSelectedImportedIds(new Set());
        else setSelectedImportedIds(new Set(importedItems.map(i => i.id)));
    };

    const deleteAllCars = () => {
        setFleet([]);
        setShowDeleteAllModal(false);
        alert("🗑️ Parco Auto svuotato completamente.");
    };

    const handleDeleteCar = () => {
        if (selectedCar && confirm("Eliminare il veicolo?")) {
            deleteCar(selectedCar.id);
            setSelectedCar(null);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const newItems = files.map(file => ({
                file, preview: URL.createObjectURL(file),
                matchId: fleet.find(c => file.name.toLowerCase().includes(c.vehicleCode.toLowerCase()))?.vehicleCode || null
            }));
            setPendingUploads(prev => [...prev, ...newItems]);
        }
    };

    const applyBatchUpdates = () => {
        pendingUploads.forEach(p => {
            if (p.matchId) {
                const car = fleet.find(c => c.vehicleCode === p.matchId);
                if (car) updateCar(car.id, { image: p.preview });
            }
        });
        setPendingUploads([]);
        setShowBatchModal(false);
        alert("📸 Foto sincronizzate con successo tramite Codice Veicolo.");
    };

    return (
        <div className="p-6 h-full flex flex-col gap-6">
            {/* Header section */}
            <div className="flex justify-between items-center px-2">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Fleet Management AI</h2>
                    <p className="text-slate-500">Gestione flotta, preventivazione e acquisizione stock.</p>
                </div>
                <div className="flex gap-2">
                    <input type="file" id="csvInput" accept=".csv" className="hidden" onChange={handleFileUpload} />
                    <button onClick={() => document.getElementById('csvInput')?.click()} className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-2 font-medium">
                        <FileText className="w-4 h-4" /> Carica CSV Stock
                    </button>
                    <button onClick={() => setShowAddModal(true)} className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors shadow-lg flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Aggiungi Auto
                    </button>
                    {fleet.length > 0 && (
                        <button onClick={() => setShowDeleteAllModal(true)} className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2">
                            <Trash2 className="w-4 h-4" /> Svuota Parco
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit border border-slate-200">
                <button 
                    onClick={() => setActiveTab('FLEET')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'FLEET' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <CarIcon className="w-4 h-4" /> PARCO AUTO ({fleet.length})
                </button>
                <button 
                    onClick={() => setActiveTab('IMPORT')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'IMPORT' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <FileText className="w-4 h-4" /> DATABASE IMPORT ({importedItems.length})
                </button>
            </div>

            {/* TAB: DATABASE IMPORT */}
            {activeTab === 'IMPORT' && (
                <div className="flex-1 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in duration-300">
                    <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-col gap-6">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <h3 className="font-black text-slate-800 flex items-center gap-3 italic uppercase tracking-wider text-xl">
                                    <Sparkles className="w-6 h-6 text-indigo-500 animate-pulse" /> Analisi Stock Potenziale
                                </h3>
                                {importedItems.length > 0 && (
                                    <div className="flex gap-2">
                                        <span className="text-xs bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full font-black uppercase shadow-sm border border-indigo-200">
                                            {selectedImportedIds.size} Selezionati
                                        </span>
                                        <span className="text-xs bg-slate-200 text-slate-600 px-4 py-1.5 rounded-full font-black uppercase shadow-sm border border-slate-300">
                                            {filteredImportedItems.length} Totali
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button onClick={toggleAllImports} className="px-5 py-2.5 hover:bg-white bg-slate-100 rounded-xl text-xs font-black transition-all text-slate-600 border border-slate-200 shadow-sm uppercase tracking-tight">
                                    {selectedImportedIds.size === importedItems.length && importedItems.length > 0 ? 'Deseleziona Tutto' : 'Seleziona Tutto'}
                                </button>
                                <button 
                                    onClick={confirmTransferToFleet} 
                                    disabled={selectedImportedIds.size === 0}
                                    className="px-8 py-2.5 bg-slate-900 hover:bg-black text-white font-black rounded-xl text-sm shadow-xl disabled:opacity-30 transition-all flex items-center gap-3 uppercase tracking-widest border border-slate-800"
                                >
                                    <Check className="w-5 h-5 text-emerald-400" /> Trasferisci nel Parco
                                </button>
                            </div>
                        </div>

                        {/* Global Search Bar */}
                        <div className="relative group">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400 group-focus-within:scale-110 transition-transform" />
                            <input 
                                type="text" 
                                placeholder="RICERCA AUTOMATICA GLOBALE: DIGITA MARCA, MODELLO, TARGA O CODICE..." 
                                className="w-full pl-12 pr-6 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:border-indigo-500 outline-none font-black text-slate-700 placeholder:text-slate-300 shadow-inner transition-all text-lg"
                                value={globalImportSearch}
                                onChange={e => { setGlobalImportSearch(e.target.value); setCurrentPage(1); }}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto bg-white">
                        {importedItems.length > 0 ? (
                            <div className="h-full flex flex-col">
                                <div className="flex-1 overflow-auto">
                                    <table className="w-full text-left text-sm border-separate border-spacing-0">
                                        <thead className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-10">
                                            <tr className="text-slate-400 uppercase text-[10px] font-black tracking-widest">
                                                <th className="p-5 border-b border-slate-100">Sel.</th>
                                                <th className="px-6 py-5 border-b border-slate-100">
                                                    <div className="flex flex-col gap-2">
                                                        <span>Codice Stock</span>
                                                        <input 
                                                            type="text" 
                                                            placeholder="Filtra..." 
                                                            className="font-normal p-2 text-[10px] border border-slate-100 rounded-lg bg-slate-50 w-full focus:bg-white transition-all uppercase"
                                                            value={importFilters.code}
                                                            onChange={e => { setImportFilters({...importFilters, code: e.target.value}); setCurrentPage(1); }}
                                                        />
                                                    </div>
                                                </th>
                                                <th className="px-6 py-5 border-b border-slate-100">
                                                    <div className="flex flex-col gap-2">
                                                        <span>Marca & Modello</span>
                                                        <input 
                                                            type="text" 
                                                            placeholder="Filtra..." 
                                                            className="font-normal p-2 text-[10px] border border-slate-100 rounded-lg bg-slate-50 w-full focus:bg-white transition-all uppercase"
                                                            value={importFilters.brand}
                                                            onChange={e => { setImportFilters({...importFilters, brand: e.target.value}); setCurrentPage(1); }}
                                                        />
                                                    </div>
                                                </th>
                                                <th className="px-6 py-5 border-b border-slate-100">
                                                    <div className="flex flex-col gap-2">
                                                        <span>Dettagli Tecnici</span>
                                                        <input 
                                                            type="text" 
                                                            placeholder="Filtra..." 
                                                            className="font-normal p-2 text-[10px] border border-slate-100 rounded-lg bg-slate-50 w-full focus:bg-white transition-all uppercase"
                                                            value={importFilters.fuel}
                                                            onChange={e => { setImportFilters({...importFilters, fuel: e.target.value}); setCurrentPage(1); }}
                                                        />
                                                    </div>
                                                </th>
                                                <th className="px-6 py-5 border-b border-slate-100 text-indigo-600">
                                                    <div className="flex flex-col gap-2">
                                                        <span>Consegna Prevista</span>
                                                        <input 
                                                            type="text" 
                                                            placeholder="Filtra..." 
                                                            className="font-normal p-2 text-[10px] border border-indigo-100 rounded-lg bg-indigo-50/30 w-full focus:bg-white transition-all uppercase"
                                                            value={importFilters.delivery}
                                                            onChange={e => { setImportFilters({...importFilters, delivery: e.target.value}); setCurrentPage(1); }}
                                                        />
                                                    </div>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {paginatedItems.map((item) => (
                                                <tr key={item.id} className={`hover:bg-slate-50 transition-all cursor-pointer group ${selectedImportedIds.has(item.id) ? 'bg-indigo-50/40' : ''}`} onClick={() => toggleImportSelection(item.id)}>
                                                    <td className="p-5">
                                                        <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${selectedImportedIds.has(item.id) ? 'bg-indigo-600 border-indigo-600 scale-110' : 'border-slate-200 group-hover:border-indigo-300'}`}>
                                                            {selectedImportedIds.has(item.id) && <Check className="w-3 h-3 text-white" />}
                                                        </div>
                                                    </td>
                                                    <td className="p-6 font-mono font-black text-slate-400 group-hover:text-indigo-400 transition-colors uppercase">{item.vehicleCode}</td>
                                                    <td className="p-6">
                                                        <p className="font-black text-slate-900 uppercase text-sm tracking-tight">{item.brand} {item.model}</p>
                                                        <p className="text-slate-400 text-[10px] font-bold uppercase truncate max-w-xs">{item.modelDescription}</p>
                                                    </td>
                                                    <td className="p-6">
                                                        <div className="flex flex-wrap gap-1.5">
                                                            <span className="bg-slate-100 px-2 py-1 rounded text-[10px] text-slate-600 font-black uppercase tracking-tighter">{item.fuelType}</span>
                                                            <span className="bg-slate-100 px-2 py-1 rounded text-[10px] text-slate-600 font-black uppercase tracking-tighter">{item.transmission}</span>
                                                            <span className="bg-indigo-50 border border-indigo-100 px-2 py-1 rounded text-[10px] text-indigo-600 font-black uppercase tracking-tighter">{item.plate}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-6 text-indigo-600 font-black uppercase italic tracking-widest text-xs">{item.expectedDelivery}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Modern Pagination Controls */}
                                <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                                    <div className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                        Visti <span className="text-indigo-600">{paginatedItems.length}</span> / {filteredImportedItems.length} Risultati
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button 
                                            disabled={currentPage === 1}
                                            onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => prev - 1); }}
                                            className="px-6 py-2.5 bg-white border-2 border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-600 hover:border-indigo-500 hover:text-indigo-600 transition-all disabled:opacity-30 disabled:hover:border-slate-200 shadow-sm"
                                        >
                                            Precedente
                                        </button>
                                        <div className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-indigo-100">
                                            PAGINA {currentPage} DI {totalPages || 1}
                                        </div>
                                        <button 
                                            disabled={currentPage === totalPages || totalPages === 0}
                                            onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => prev + 1); }}
                                            className="px-6 py-2.5 bg-white border-2 border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-600 hover:border-indigo-500 hover:text-indigo-600 transition-all disabled:opacity-30 disabled:hover:border-slate-200 shadow-sm"
                                        >
                                            Successiva
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center p-20 text-center">
                                <FileText className="w-20 h-20 text-slate-200 mb-6" />
                                <h4 className="text-xl font-bold text-slate-400">Nessun database caricato</h4>
                                <p className="text-slate-400 mt-2 max-w-xs">Carica un file CSV per iniziare l'analisi e l'acquisizione dei veicoli.</p>
                                <button onClick={() => document.getElementById('csvInput')?.click()} className="mt-6 bg-indigo-50 text-indigo-600 px-6 py-2 rounded-xl font-bold hover:bg-indigo-100 transition-all border border-indigo-100">Carica ora</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB: PARCO AUTO (FLEET) */}
            {activeTab === 'FLEET' && (
                <div className="flex-1 flex flex-col gap-6 animate-in fade-in duration-300">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center">
                        <div className="flex-1 min-w-[300px] relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input type="text" placeholder="Cerca nel parco auto..." className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-500 uppercase tracking-tighter">Stato:</span>
                            <select className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                                <option value="Tutti">Vedi Tutti</option>
                                <option value={CarStatus.AVAILABLE}>Disponibili</option>
                                <option value={CarStatus.RENTED}>Noleggiati</option>
                                <option value={CarStatus.MAINTENANCE}>Manutenzione</option>
                            </select>
                        </div>
                        <button onClick={clearFilters} className="text-slate-400 hover:text-red-500 p-2.5 transition-colors bg-slate-50 rounded-xl border border-slate-100"><X className="w-5 h-5" /></button>
                        <button onClick={() => setShowBatchModal(true)} className="bg-white text-indigo-600 border border-indigo-200 px-4 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors flex items-center gap-2 shadow-sm font-bold">
                            <UploadCloud className="w-5 h-5" /> Batch Foto
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 pb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredFleet.map(car => (
                                <div key={car.id} className="group bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 flex flex-col cursor-pointer relative" onClick={() => setSelectedCar(car)}>
                                    <div className="relative h-56 overflow-hidden">
                                        <img src={car.image} alt={car.brand} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black shadow-lg backdrop-blur-md border border-white/20 uppercase tracking-widest ${car.status === CarStatus.AVAILABLE ? 'bg-emerald-500/90 text-white' : 'bg-blue-500/90 text-white'}`}>{car.status}</span>
                                            <span className="px-4 py-1.5 rounded-full text-[10px] font-black shadow-lg backdrop-blur-md border border-white/20 bg-black/60 text-white tracking-widest uppercase">{car.vehicleCode}</span>
                                        </div>
                                        
                                        {/* Quick Delete Trash Icon */}
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); deleteCar(car.id); }}
                                            className="absolute top-4 right-4 bg-white/10 hover:bg-red-500 text-white p-2.5 rounded-full backdrop-blur-md border border-white/20 transition-all opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>

                                        <div className="absolute bottom-4 left-4">
                                            <span className="bg-white/95 px-3 py-1.5 rounded-xl text-xs font-black text-slate-800 shadow-xl border border-white font-mono">{car.plate}</span>
                                        </div>
                                        <div className="absolute bottom-4 right-4">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setShowOfferModal(car); }}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-[10px] font-black italic shadow-xl flex items-center gap-2 transform active:scale-95 transition-all"
                                            >
                                                <Tag className="w-4 h-4" /> OFFERTA
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col">
                                        <h3 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase leading-tight mb-2">{car.brand} {car.model}</h3>
                                        <p className="text-slate-400 text-xs line-clamp-2 mb-4 italic leading-relaxed">{car.modelDescription}</p>
                                        <div className="mt-auto grid grid-cols-2 gap-x-2 gap-y-3 pt-4 border-t border-slate-50">
                                            <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-2 rounded-lg"><Fuel className="w-4 h-4 text-indigo-400" /> <span className="text-[10px] font-bold uppercase">{car.fuelType}</span></div>
                                            <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-2 rounded-lg"><Settings className="w-4 h-4 text-indigo-400" /> <span className="text-[10px] font-bold uppercase">{car.transmission}</span></div>
                                            <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-2 rounded-lg"><Calendar className="w-4 h-4 text-indigo-400" /> <span className="text-[10px] font-bold uppercase">{car.expectedDelivery}</span></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {filteredFleet.length === 0 && (
                            <div className="py-32 text-center bg-white rounded-3xl border border-dashed border-slate-300">
                                <CarIcon className="w-20 h-20 text-slate-100 mx-auto mb-6" />
                                <h3 className="text-2xl font-bold text-slate-400">Parco auto vuoto</h3>
                                <p className="text-slate-400 mt-2">Acquisisci veicoli dal Database Import per vederli qui.</p>
                                <button onClick={() => setActiveTab('IMPORT')} className="mt-8 bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-indigo-100">Vai al Database</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Custom Modals */}
            
            {/* Svuota Parco Modal */}
            {showDeleteAllModal && (
                <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in duration-300 text-center">
                        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase italic">Attenzione!</h3>
                        <p className="text-slate-500 mb-8 leading-relaxed">Sei sicuro di voler svuotare completamente il parco auto? Questa azione cancellerà tutti i veicoli caricati e non è reversibile.</p>
                        <div className="flex flex-col gap-3">
                            <button onClick={deleteAllCars} className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-red-200 uppercase tracking-tighter">Sì, Svuota Tutto</button>
                            <button onClick={() => setShowDeleteAllModal(false)} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-3 rounded-2xl font-bold transition-colors">Annulla</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Commercial Offer Modal */}
            {showOfferModal && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-md">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl p-0 overflow-hidden flex flex-col md:flex-row max-h-[90vh] animate-in zoom-in">
                        <div className="md:w-1/3 bg-indigo-600 p-8 text-white relative flex flex-col">
                            <div className="relative z-10">
                                <h3 className="text-3xl font-black italic mb-2 tracking-tighter uppercase leading-none">Configurazione<br/>Commerciale</h3>
                                <div className="p-4 bg-white/10 rounded-2xl border border-white/20 my-8">
                                    <p className="text-[10px] opacity-80 uppercase font-bold tracking-widest mb-1">Dettaglio Veicolo</p>
                                    <p className="text-2xl font-black tracking-tight leading-tight">{showOfferModal.brand} {showOfferModal.model}</p>
                                    <p className="text-xs font-mono mt-2 bg-indigo-500/50 px-2 py-1 rounded w-fit">{showOfferModal.plate}</p>
                                </div>
                                
                                <div className="space-y-6">
                                    <div className="relative">
                                        <label className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-2 block">Anticipo</label>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                className="w-full bg-white/10 border border-white/20 p-3 rounded-xl text-white font-black text-lg outline-none focus:bg-white/20 transition-all"
                                                value={showOfferModal.offers?.[0]?.advance || 0}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value) || 0;
                                                    const newOffers = (showOfferModal.offers || []).map(o => ({ ...o, advance: val }));
                                                    setShowOfferModal({ ...showOfferModal, offers: newOffers });
                                                }}
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">€</span>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <label className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-2 block">Kasko (Importo Fisso)</label>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                className="w-full bg-white/10 border border-white/20 p-3 rounded-xl text-white font-black text-lg outline-none focus:bg-white/20 transition-all"
                                                value={showOfferModal.offers?.[0]?.kasko || 0}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value) || 0;
                                                    const newOffers = (showOfferModal.offers || []).map(o => ({ ...o, kasko: val }));
                                                    setShowOfferModal({ ...showOfferModal, offers: newOffers });
                                                }}
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">€</span>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <label className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-2 block">RCA (Default)</label>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                className="w-full bg-white/10 border border-white/20 p-3 rounded-xl text-white font-black text-lg outline-none focus:bg-white/20 transition-all"
                                                value={showOfferModal.offers?.[0]?.rca ?? 250}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value) || 0;
                                                    const newOffers = (showOfferModal.offers || []).map(o => ({ ...o, rca: val }));
                                                    setShowOfferModal({ ...showOfferModal, offers: newOffers });
                                                }}
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">€</span>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <label className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-2 block">Furto & Incendio</label>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                className="w-full bg-white/10 border border-white/20 p-3 rounded-xl text-white font-black text-lg outline-none focus:bg-white/20 transition-all"
                                                value={showOfferModal.offers?.[0]?.theft || 0}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value) || 0;
                                                    const newOffers = (showOfferModal.offers || []).map(o => ({ ...o, theft: val }));
                                                    setShowOfferModal({ ...showOfferModal, offers: newOffers });
                                                }}
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">€</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-auto relative z-10 pt-10">
                                <p className="text-[9px] opacity-40 uppercase tracking-tighter leading-tight italic font-medium">I parametri sopra indicati verranno applicati uniformemente a tutti i piani tariffari di questo veicolo.</p>
                            </div>
                        </div>
                        <div className="md:w-2/3 p-10 overflow-y-auto">
                            <div className="flex justify-between items-center mb-10">
                                <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tighter italic">Piani di Noleggio</h4>
                                <button onClick={() => setShowOfferModal(null)} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
                            </div>

                            <div className="space-y-10">
                                <div>
                                    <p className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-indigo-100 pb-2">
                                        <Calendar className="w-5 h-5" /> Opzioni 36 Mesi
                                    </p>
                                    <div className="grid grid-cols-3 gap-4">
                                        {[30000, 45000, 60000].map(km => {
                                            const offer = showOfferModal.offers?.find(o => o.duration === 36 && o.kms === km);
                                            return (
                                                        <div key={km} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 group hover:border-indigo-300 transition-all space-y-3">
                                                            <div className="flex justify-between items-center bg-indigo-100/50 p-2 rounded-lg">
                                                                <p className="text-[10px] font-black text-indigo-600 uppercase">Tariffa {km/1000}k KM Totali</p>
                                                                <span className="text-[9px] font-bold bg-white text-indigo-500 px-1.5 py-0.5 rounded border border-indigo-100 tracking-tighter">36 MESI</span>
                                                            </div>
                                                            
                                                            <div className="space-y-2">
                                                                <div className="relative">
                                                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1"><Zap className="w-3 h-3" /> Rata Mensile</p>
                                                                    <input 
                                                                        type="number" 
                                                                        className="w-full p-2 border-2 border-slate-200 rounded-lg focus:border-indigo-500 outline-none font-black text-indigo-600 bg-white text-sm"
                                                                        value={offer?.monthlyRate || ''}
                                                                        onChange={(e) => {
                                                                            const newRate = parseFloat(e.target.value) || 0;
                                                                            const newOffers = [...(showOfferModal.offers || [])];
                                                                            const idx = newOffers.findIndex(o => o.duration === 36 && o.kms === km);
                                                                            if (idx !== -1) {
                                                                                newOffers[idx] = { ...newOffers[idx], monthlyRate: newRate };
                                                                                setShowOfferModal(prev => prev ? ({ ...prev, offers: newOffers }) : null);
                                                                            }
                                                                        }}
                                                                    />
                                                                    <span className="absolute right-3 bottom-2 text-slate-300 font-bold text-xs">€</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-emerald-100 pb-2">
                                        <Calendar className="w-5 h-5" /> Opzioni 48 Mesi
                                    </p>
                                    <div className="grid grid-cols-3 gap-4">
                                        {[40000, 45000, 60000].map(km => {
                                            const offer = showOfferModal.offers?.find(o => o.duration === 48 && o.kms === km);
                                            return (
                                                        <div key={km} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 group hover:border-emerald-300 transition-all space-y-3">
                                                            <div className="flex justify-between items-center bg-emerald-100/50 p-2 rounded-lg">
                                                                <p className="text-[10px] font-black text-emerald-600 uppercase">Tariffa {km/1000}k KM Totali</p>
                                                                <span className="text-[9px] font-bold bg-white text-emerald-500 px-1.5 py-0.5 rounded border border-emerald-100 tracking-tighter">48 MESI</span>
                                                            </div>
                                                            
                                                            <div className="space-y-2">
                                                                <div className="relative">
                                                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1"><Zap className="w-3 h-3 text-emerald-500" /> Rata Mensile</p>
                                                                    <input 
                                                                        type="number" 
                                                                        className="w-full p-2 border-2 border-slate-200 rounded-lg focus:border-emerald-500 outline-none font-black text-emerald-600 bg-white text-sm"
                                                                        value={offer?.monthlyRate || ''}
                                                                        onChange={(e) => {
                                                                            const newRate = parseFloat(e.target.value) || 0;
                                                                            const newOffers = [...(showOfferModal.offers || [])];
                                                                            const idx = newOffers.findIndex(o => o.duration === 48 && o.kms === km);
                                                                            if (idx !== -1) {
                                                                                newOffers[idx] = { ...newOffers[idx], monthlyRate: newRate };
                                                                                setShowOfferModal(prev => prev ? ({ ...prev, offers: newOffers }) : null);
                                                                            }
                                                                        }}
                                                                    />
                                                                    <span className="absolute right-3 bottom-2 text-slate-300 font-bold text-xs">€</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    updateCar(showOfferModal.id, showOfferModal);
                                    setShowOfferModal(null);
                                    alert("✅ Listino aggiornato con successo.");
                                }}
                                className="w-full mt-10 bg-slate-900 hover:bg-black text-white py-5 rounded-2xl font-black text-xl transition-all shadow-2xl flex items-center justify-center gap-2 uppercase tracking-tight italic"
                            >
                                <Save className="w-6 h-6" /> Conferma Listino Prezzi
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Existing Side Modals (Add/Batch) maintained for architecture */}
            {showBatchModal && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-8 max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black italic uppercase">Batch Foto Sync</h3>
                            <button onClick={() => setShowBatchModal(false)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-6 h-6 text-slate-400" /></button>
                        </div>
                        <div className="border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center hover:bg-indigo-50/30 hover:border-indigo-200 transition-all cursor-pointer relative mb-6">
                            <input type="file" multiple accept="image/*" onChange={handleFileSelect} className="absolute inset-0 opacity-0 cursor-pointer" />
                            <UploadCloud className="w-16 h-16 text-indigo-300 mx-auto mb-4" />
                            <p className="font-bold text-slate-600">Seleziona o trascina le foto qui</p>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3 mb-6 pr-2">
                            {pendingUploads.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                    <img src={item.preview} className="w-14 h-14 object-cover rounded-xl shadow-sm" alt="preview" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1 truncate">{item.file.name}</p>
                                        <select className={`w-full text-xs font-black border rounded-lg px-2 py-1.5 focus:ring-2 outline-none ${item.matchId ? 'text-indigo-600 border-indigo-200 bg-indigo-50' : 'text-slate-400 border-slate-200'}`} value={item.matchId || ''} onChange={(e) => {
                                            const newPending = [...pendingUploads];
                                            newPending[idx].matchId = e.target.value || null;
                                            setPendingUploads(newPending);
                                        }}>
                                            <option value="">Collega Veicolo (Codice)...</option>
                                            {fleet.map(c => <option key={c.id} value={c.vehicleCode}>{c.brand} {c.model} - {c.vehicleCode} ({c.plate})</option>)}
                                        </select>
                                    </div>
                                    <button onClick={() => setPendingUploads(pendingUploads.filter((_, i) => i !== idx))} className="p-2 text-slate-400 hover:text-red-500"><Trash2 className="w-5 h-5" /></button>
                                </div>
                            ))}
                        </div>
                        <button onClick={applyBatchUpdates} disabled={pendingUploads.length === 0} className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 disabled:opacity-50 uppercase tracking-widest shadow-xl shadow-indigo-100">Sincronizza {pendingUploads.filter(p => p.matchId).length} Foto</button>
                    </div>
                </div>
            )}

            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black italic uppercase">Nuovo Veicolo</h3>
                            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-full cursor-pointer"><X className="w-6 h-6 text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleSaveCar} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Codice Stock</label><input type="text" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" value={newCar.vehicleCode || ''} onChange={e => setNewCar({ ...newCar, vehicleCode: e.target.value })} required /></div>
                                <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Targa</label><input type="text" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-black uppercase" value={newCar.plate || ''} onChange={e => setNewCar({ ...newCar, plate: e.target.value })} required /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Marca</label><input type="text" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" value={newCar.brand || ''} onChange={e => setNewCar({ ...newCar, brand: e.target.value })} required /></div>
                                <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Modello</label><input type="text" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" value={newCar.model || ''} onChange={e => setNewCar({ ...newCar, model: e.target.value })} required /></div>
                            </div>
                            <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-black transition-all flex items-center justify-center gap-3 shadow-xl uppercase"><Save className="w-6 h-6" /> Registra Veicolo</button>
                        </form>
                    </div>
                </div>
            )}

            {selectedCar && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row animate-in zoom-in">
                        <div className="md:w-2/5 bg-slate-100 relative group">
                            <img src={selectedCar.image} alt="car" className="w-full h-full object-cover" />
                            
                            {/* Manual Image Update Button */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                <label className="cursor-pointer bg-white text-slate-900 px-6 py-3 rounded-full font-black text-sm flex items-center gap-2 shadow-2xl hover:scale-105 transition-transform">
                                    <FileImage className="w-4 h-4" />
                                    SOSTITUISCI FOTO
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        accept="image/*" 
                                        onChange={(e) => handleImageChange(selectedCar.id, e)}
                                    />
                                </label>
                            </div>
                        </div>
                        <div className="md:w-3/5 p-8 flex flex-col overflow-y-auto">
                            <div className="flex justify-between items-start mb-6">
                                {isEditingDetails ? (
                                    <div className="flex-1 space-y-3 mr-4">
                                        <div className="flex gap-2">
                                            <input type="text" className="flex-1 p-2 border border-indigo-200 rounded-lg text-xl font-bold uppercase" placeholder="Marca" value={selectedCar.brand} onChange={e => setSelectedCar({...selectedCar, brand: e.target.value})} />
                                            <input type="text" className="flex-1 p-2 border border-indigo-200 rounded-lg text-xl font-bold uppercase" placeholder="Modello" value={selectedCar.model} onChange={e => setSelectedCar({...selectedCar, model: e.target.value})} />
                                        </div>
                                        <textarea 
                                            className="w-full p-2 border border-indigo-200 rounded-lg text-xs font-bold text-slate-600 uppercase h-16" 
                                            placeholder="Descrizione Modello" 
                                            value={selectedCar.modelDescription} 
                                            onChange={e => setSelectedCar({...selectedCar, modelDescription: e.target.value})} 
                                        />
                                        <input type="text" className="w-full p-2 border border-indigo-200 rounded-lg text-xs font-mono uppercase" placeholder="Targa" value={selectedCar.plate} onChange={e => setSelectedCar({...selectedCar, plate: e.target.value})} />
                                    </div>
                                ) : (
                                    <div className="flex-1">
                                        <h2 className="text-3xl font-bold text-slate-900 leading-tight uppercase tracking-tight">{selectedCar.brand} {selectedCar.model}</h2>
                                        <div className="flex flex-col gap-1 mt-1">
                                            <p className="text-slate-500 font-bold hover:text-indigo-600 transition-colors uppercase italic text-xs leading-relaxed">{selectedCar.modelDescription}</p>
                                            <p className="text-slate-400 text-[10px] font-black tracking-widest uppercase">Codice: {selectedCar.vehicleCode} • {selectedCar.plate}</p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center gap-3">
                                    <select 
                                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black shadow-xl border-2 transition-all outline-none ${
                                            selectedCar.status === CarStatus.AVAILABLE ? 'bg-green-500 border-green-400 text-white' : 
                                            selectedCar.status === CarStatus.RENTED ? 'bg-blue-500 border-blue-400 text-white' : 
                                            'bg-amber-500 border-amber-400 text-white'
                                        }`}
                                        value={selectedCar.status}
                                        onChange={(e) => {
                                            const newStatus = e.target.value as CarStatus;
                                            setSelectedCar({...selectedCar, status: newStatus});
                                            updateCarStatus(selectedCar.id, newStatus);
                                        }}
                                    >
                                        <option value={CarStatus.AVAILABLE}>DISPONIBILE</option>
                                        <option value={CarStatus.RENTED}>NOLEGGIATA</option>
                                        <option value={CarStatus.MAINTENANCE}>MANUTENZIONE</option>
                                    </select>
                                    <button 
                                        onClick={() => {
                                            setSelectedCar(null);
                                            setIsEditingDetails(false);
                                        }} 
                                        className="p-2 hover:bg-slate-100 rounded-full"
                                    >
                                        <X className="w-6 h-6 text-slate-400" />
                                    </button>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-6 transition-all">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold text-slate-800">Specifiche Complete</h3>
                                    <button 
                                        onClick={() => setIsEditingDetails(!isEditingDetails)}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-2 ${isEditingDetails ? 'bg-amber-100 text-amber-700 shadow-inner' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}
                                    >
                                        <Edit3 className="w-3.5 h-3.5" /> {isEditingDetails ? 'MODALITÀ EDIT ATTIVA' : 'MODIFICA SCHEDA'}
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-x-8 gap-y-5 text-sm">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alimentazione</p>
                                        {isEditingDetails ? (
                                            <input type="text" className="w-full p-2 border border-indigo-200 rounded-lg bg-white font-bold text-slate-900 uppercase" value={selectedCar.fuelType} onChange={e => setSelectedCar({...selectedCar, fuelType: e.target.value})} />
                                        ) : (
                                            <p className="font-bold text-slate-900 uppercase">{selectedCar.fuelType}</p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Targa Veicolo</p>
                                        {isEditingDetails ? (
                                            <input type="text" className="w-full p-2 border border-indigo-200 rounded-lg bg-white font-bold text-indigo-600 uppercase" value={selectedCar.plate} onChange={e => setSelectedCar({...selectedCar, plate: e.target.value})} />
                                        ) : (
                                            <p className="font-bold text-indigo-600 uppercase italic tracking-widest">{selectedCar.plate}</p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cambio</p>
                                        {isEditingDetails ? (
                                            <input type="text" className="w-full p-2 border border-indigo-200 rounded-lg bg-white font-bold text-slate-900 uppercase" value={selectedCar.transmission} onChange={e => setSelectedCar({...selectedCar, transmission: e.target.value})} />
                                        ) : (
                                            <p className="font-bold text-slate-900 uppercase">{selectedCar.transmission}</p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Colore Esterno</p>
                                        {isEditingDetails ? (
                                            <input type="text" className="w-full p-2 border border-indigo-200 rounded-lg bg-white font-bold text-slate-900" value={selectedCar.externalColor} onChange={e => setSelectedCar({...selectedCar, externalColor: e.target.value})} />
                                        ) : (
                                            <p className="font-bold text-slate-900">{selectedCar.externalColor}</p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Colore Interno</p>
                                        {isEditingDetails ? (
                                            <input type="text" className="w-full p-2 border border-indigo-200 rounded-lg bg-white font-bold text-slate-900" value={selectedCar.internalColor || ''} onChange={e => setSelectedCar({...selectedCar, internalColor: e.target.value})} />
                                        ) : (
                                            <p className="font-bold text-slate-900">{selectedCar.internalColor || 'N/D'}</p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prevista Consegna</p>
                                        {isEditingDetails ? (
                                            <input type="text" className="w-full p-2 border border-indigo-200 rounded-lg bg-white font-bold text-indigo-600 italic uppercase" value={selectedCar.expectedDelivery} onChange={e => setSelectedCar({...selectedCar, expectedDelivery: e.target.value})} />
                                        ) : (
                                            <p className="font-bold text-indigo-600 uppercase italic tracking-widest">{selectedCar.expectedDelivery}</p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Listino Prezzi</p>
                                        {isEditingDetails ? (
                                            <input type="number" className="w-full p-2 border border-indigo-200 rounded-lg bg-white font-bold text-slate-900" value={selectedCar.price || 0} onChange={e => setSelectedCar({...selectedCar, price: parseFloat(e.target.value) || 0})} />
                                        ) : (
                                            <p className="font-bold text-slate-900">€ {selectedCar.price?.toLocaleString()}</p>
                                        )}
                                    </div>
                                    <div className="col-span-1">
                                    </div>


                                    <div className="col-span-2 space-y-1 pt-2 border-t border-slate-200">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Optional & Accessori</p>
                                        {isEditingDetails ? (
                                            <textarea className="w-full p-3 border border-indigo-200 rounded-lg bg-white italic text-slate-700 text-xs h-24" value={selectedCar.optional || ''} onChange={e => setSelectedCar({...selectedCar, optional: e.target.value})} />
                                        ) : (
                                            <p className="text-slate-700 italic leading-relaxed text-xs">{selectedCar.optional || 'Nessuno specificato'}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-auto flex gap-3">
                                {isEditingDetails ? (
                                    <button 
                                        onClick={() => {
                                            updateCar(selectedCar.id, selectedCar);
                                            setIsEditingDetails(false);
                                            alert("✅ Scheda aggiornata con successo.");
                                        }}
                                        className="flex-1 bg-slate-900 text-white py-4 rounded-xl font-black text-sm hover:bg-black flex items-center justify-center gap-2 shadow-xl uppercase tracking-widest"
                                    >
                                        <Save className="w-5 h-5 text-emerald-400" /> Salva Modifiche
                                    </button>
                                ) : (
                                    <button onClick={() => { setSelectedCar(null); setShowOfferModal(selectedCar); }} className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-black text-sm hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-xl uppercase tracking-widest">
                                        <Tag className="w-5 h-5" /> Configura Offerta Commerciale
                                    </button>
                                )}
                                <button onClick={handleDeleteCar} className="p-4 text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100"><Trash2 className="w-5 h-5" /></button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FleetManager;