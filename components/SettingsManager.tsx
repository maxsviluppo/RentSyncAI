import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { CompanyProfile } from '../types';
import { generateCompanyBio } from '../services/gemini';
import { Building2, Save, Globe, Mail, Phone, MapPin, CreditCard, Share2, Wand2, Loader2, Link, Key, Trash2, ExternalLink } from 'lucide-react';

const SettingsManager: React.FC = () => {
    const { companyProfile, updateCompanyProfile } = useApp();
    const [formData, setFormData] = useState<CompanyProfile>(companyProfile);
    const [activeTab, setActiveTab] = useState<'general' | 'fiscal' | 'social' | 'api'>('general');
    const [aiLoading, setAiLoading] = useState(false);
    
    // API Key State
    const [apiKey, setApiKey] = useState('');
    const [isKeySaved, setIsKeySaved] = useState(false);

    // Sync state if context changes
    useEffect(() => {
        setFormData(companyProfile);
        
        // Check for saved API Key
        const savedKey = localStorage.getItem('RENT_SYNC_API_KEY');
        if (savedKey) {
            setApiKey(savedKey);
            setIsKeySaved(true);
        }
    }, [companyProfile]);

    const handleSave = () => {
        updateCompanyProfile(formData);
        alert("Impostazioni salvate con successo!");
    };
    
    const handleSaveApiKey = () => {
        if(!apiKey) return;
        localStorage.setItem('RENT_SYNC_API_KEY', apiKey);
        setIsKeySaved(true);
        alert("API Key salvata! L'AI ora userà la tua chiave personale.");
    };

    const handleDeleteApiKey = () => {
        localStorage.removeItem('RENT_SYNC_API_KEY');
        setApiKey('');
        setIsKeySaved(false);
        alert("API Key rimossa. Il sistema userà la chiave di default (se presente).");
    };

    const handleAiBio = async () => {
        if(!formData.name) {
            alert("Inserisci il nome dell'azienda prima.");
            return;
        }
        setAiLoading(true);
        try {
            const bio = await generateCompanyBio(formData);
            setFormData(prev => ({ ...prev, bio }));
        } catch(e) {
            alert("Errore AI: Verifica la tua API Key nelle impostazioni Integrazioni.");
        } finally {
            setAiLoading(false);
        }
    };

    return (
        <div className="p-6 h-full flex flex-col max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Impostazioni Azienda</h2>
                    <p className="text-slate-500">Gestisci il profilo pubblico, i dati fiscali e i contatti.</p>
                </div>
                <button 
                    onClick={handleSave}
                    className="bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-lg shadow-slate-900/20"
                >
                    <Save className="w-5 h-5"/> Salva Modifiche
                </button>
            </div>

            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row">
                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 bg-slate-50 border-r border-slate-100 p-4">
                    <nav className="space-y-1">
                        <button 
                            onClick={() => setActiveTab('general')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'general' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                            <Building2 className="w-5 h-5"/> Anagrafica & Bio
                        </button>
                        <button 
                            onClick={() => setActiveTab('fiscal')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'fiscal' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                            <CreditCard className="w-5 h-5"/> Dati Fiscali
                        </button>
                        <button 
                            onClick={() => setActiveTab('social')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'social' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                            <Share2 className="w-5 h-5"/> Contatti & Social
                        </button>
                        <button 
                            onClick={() => setActiveTab('api')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'api' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                            <Key className="w-5 h-5"/> API & Integrazioni
                        </button>
                    </nav>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-8 overflow-y-auto">
                    
                    {activeTab === 'general' && (
                        <div className="space-y-6 animate-in fade-in">
                            <h3 className="text-xl font-bold text-slate-800 mb-6">Profilo Generale</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Nome Azienda</label>
                                    <input type="text" className="w-full p-3 border rounded-xl bg-slate-50 focus:bg-white transition-colors" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Slogan / Payoff</label>
                                    <input type="text" className="w-full p-3 border rounded-xl bg-slate-50 focus:bg-white transition-colors" value={formData.slogan} onChange={e => setFormData({...formData, slogan: e.target.value})} />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-bold text-slate-700">Bio Aziendale (per Email & Preventivi)</label>
                                    <button onClick={handleAiBio} disabled={aiLoading} className="text-xs flex items-center gap-1 text-indigo-600 font-bold hover:bg-indigo-50 px-2 py-1 rounded transition-colors">
                                        {aiLoading ? <Loader2 className="animate-spin w-3 h-3"/> : <Wand2 className="w-3 h-3"/>}
                                        Migliora con AI
                                    </button>
                                </div>
                                <textarea rows={4} className="w-full p-3 border rounded-xl bg-slate-50 focus:bg-white transition-colors" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} />
                                <p className="text-xs text-slate-400 mt-1">Questa descrizione verrà usata dall'IA per presentare la tua azienda nelle email commerciali.</p>
                            </div>

                            <div className="pt-6 border-t border-slate-100">
                                <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Globe className="w-5 h-5"/> Presenza Online</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Sito Web</label>
                                        <input type="text" className="w-full p-3 border rounded-xl" placeholder="www.example.com" value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Città Sede</label>
                                        <input type="text" className="w-full p-3 border rounded-xl" placeholder="Milano" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'fiscal' && (
                        <div className="space-y-6 animate-in fade-in">
                             <h3 className="text-xl font-bold text-slate-800 mb-6">Dati Fiscali & Bancari</h3>
                             
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Ragione Sociale / Intestazione</label>
                                    <input type="text" className="bg-slate-100 w-full p-3 border rounded-xl text-slate-500 cursor-not-allowed" value={formData.name} readOnly />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Partita IVA / C.F.</label>
                                    <input type="text" className="w-full p-3 border rounded-xl" value={formData.vatNumber} onChange={e => setFormData({...formData, vatNumber: e.target.value})} />
                                </div>
                             </div>

                             <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Indirizzo Fiscale Completo</label>
                                <input type="text" className="w-full p-3 border rounded-xl" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                             </div>

                             <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mt-4">
                                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5 text-indigo-600"/> Coordinate Bancarie</h4>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Banca</label>
                                        <input type="text" className="w-full p-3 border rounded-xl bg-white" value={formData.bankInfo.bankName} onChange={e => setFormData({...formData, bankInfo: {...formData.bankInfo, bankName: e.target.value}})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">IBAN</label>
                                        <input type="text" className="w-full p-3 border rounded-xl bg-white font-mono" value={formData.bankInfo.iban} onChange={e => setFormData({...formData, bankInfo: {...formData.bankInfo, iban: e.target.value}})} />
                                    </div>
                                </div>
                             </div>
                        </div>
                    )}

                    {activeTab === 'social' && (
                        <div className="space-y-6 animate-in fade-in">
                            <h3 className="text-xl font-bold text-slate-800 mb-6">Contatti & Link Social</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Email Pubblica</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3.5 text-slate-400 w-5 h-5"/>
                                        <input type="email" className="w-full pl-10 p-3 border rounded-xl" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Telefono</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3.5 text-slate-400 w-5 h-5"/>
                                        <input type="text" className="w-full pl-10 p-3 border rounded-xl" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100">
                                <h4 className="font-bold text-slate-700 mb-4">Social Network</h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">LinkedIn</label>
                                        <div className="relative">
                                            <Link className="absolute left-3 top-3.5 text-slate-400 w-5 h-5"/>
                                            <input type="text" className="w-full pl-10 p-3 border rounded-xl" placeholder="linkedin.com/in/..." value={formData.social.linkedin} onChange={e => setFormData({...formData, social: {...formData.social, linkedin: e.target.value}})} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Instagram</label>
                                        <div className="relative">
                                            <Link className="absolute left-3 top-3.5 text-slate-400 w-5 h-5"/>
                                            <input type="text" className="w-full pl-10 p-3 border rounded-xl" placeholder="instagram.com/..." value={formData.social.instagram} onChange={e => setFormData({...formData, social: {...formData.social, instagram: e.target.value}})} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Facebook</label>
                                        <div className="relative">
                                            <Link className="absolute left-3 top-3.5 text-slate-400 w-5 h-5"/>
                                            <input type="text" className="w-full pl-10 p-3 border rounded-xl" placeholder="facebook.com/..." value={formData.social.facebook} onChange={e => setFormData({...formData, social: {...formData.social, facebook: e.target.value}})} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'api' && (
                        <div className="space-y-6 animate-in fade-in">
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Configurazione Gemini AI</h3>
                            <p className="text-slate-500 mb-6">Per utilizzare le funzioni di intelligenza artificiale (Analisi Rischi, Marketing, Chat) è necessaria una chiave API di Google Gemini.</p>

                            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 mb-6">
                                <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2"><Globe className="w-5 h-5"/> Come ottenere la chiave</h4>
                                <ol className="list-decimal list-inside text-sm text-indigo-800 space-y-2 mb-4">
                                    <li>Accedi a <strong>Google AI Studio</strong> con il tuo account Google.</li>
                                    <li>Clicca su "Get API key" nel menu laterale.</li>
                                    <li>Crea una nuova chiave API in un progetto esistente o nuovo.</li>
                                    <li>Copia la stringa che inizia con <code>AIza...</code> e incollala qui sotto.</li>
                                </ol>
                                <a 
                                    href="https://aistudio.google.com/app/apikey" 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-700 transition-colors"
                                >
                                    Ottieni API Key <ExternalLink className="w-4 h-4"/>
                                </a>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Gemini API Key</label>
                                    <div className="relative">
                                        <Key className="absolute left-3 top-3.5 text-slate-400 w-5 h-5"/>
                                        <input 
                                            type="password" 
                                            className="w-full pl-10 p-3 border rounded-xl font-mono text-sm" 
                                            placeholder="AIzaSy..." 
                                            value={apiKey} 
                                            onChange={e => setApiKey(e.target.value)} 
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2">La chiave verrà salvata in modo sicuro nel Local Storage del tuo browser.</p>
                                </div>
                                
                                <div className="flex gap-3">
                                    <button 
                                        onClick={handleSaveApiKey}
                                        className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2 font-bold"
                                    >
                                        <Save className="w-4 h-4"/> Salva Chiave
                                    </button>
                                    {isKeySaved && (
                                        <button 
                                            onClick={handleDeleteApiKey}
                                            className="bg-red-50 text-red-600 border border-red-200 px-6 py-3 rounded-xl hover:bg-red-100 transition-colors flex items-center gap-2 font-bold"
                                        >
                                            <Trash2 className="w-4 h-4"/> Elimina
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default SettingsManager;