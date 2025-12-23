import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { CompanyProfile } from '../types';
import { generateCompanyBio } from '../services/gemini';
import { Building2, Save, Wand2, Loader2, Key, ShieldCheck } from 'lucide-react';

const SettingsManager: React.FC = () => {
    const { companyProfile, updateCompanyProfile } = useApp();
    const [formData, setFormData] = useState<CompanyProfile>(companyProfile);
    const [activeTab, setActiveTab] = useState<'general' | 'api'>('general');
    const [aiLoading, setAiLoading] = useState(false);

    useEffect(() => {
        setFormData(companyProfile);
    }, [companyProfile]);

    const handleSave = () => {
        updateCompanyProfile(formData);
        alert("Impostazioni salvate!");
    };

    const handleOpenKeySelector = async () => {
        if (window.aistudio?.openSelectKey) {
            await window.aistudio.openSelectKey();
        }
    };

    const handleAiBio = async () => {
        setAiLoading(true);
        try {
            const bio = await generateCompanyBio(formData);
            setFormData(prev => ({ ...prev, bio }));
        } catch(e) {
            alert("Errore AI: Verifica la configurazione della tua chiave nel dialogo AI Studio.");
        } finally {
            setAiLoading(false);
        }
    };

    return (
        <div className="p-6 h-full flex flex-col max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Impostazioni</h2>
                </div>
                <button onClick={handleSave} className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 flex items-center gap-2 shadow-lg">
                    <Save className="w-5 h-5"/> Salva Tutto
                </button>
            </div>

            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row">
                <div className="w-full md:w-64 bg-slate-50 border-r p-4 space-y-2">
                    <button onClick={() => setActiveTab('general')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${activeTab === 'general' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'}`}><Building2 className="w-5 h-5"/> Azienda</button>
                    <button onClick={() => setActiveTab('api')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${activeTab === 'api' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'}`}><Key className="w-5 h-5"/> Chiave API & Paid Features</button>
                </div>

                <div className="flex-1 p-8">
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold">Profilo Aziendale</h3>
                            <input type="text" className="w-full p-3 border rounded-xl bg-slate-50" placeholder="Nome Agenzia" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            <textarea rows={4} className="w-full p-3 border rounded-xl bg-slate-50" placeholder="Descrizione bio..." value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} />
                            <button onClick={handleAiBio} disabled={aiLoading} className="text-indigo-600 font-bold flex items-center gap-2 text-sm">
                                {aiLoading ? <Loader2 className="animate-spin w-4 h-4"/> : <Wand2 className="w-4 h-4"/>} Genera con AI
                            </button>
                        </div>
                    )}

                    {activeTab === 'api' && (
                        <div className="space-y-6">
                            <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                                <h3 className="text-xl font-bold text-indigo-900 mb-2">Configurazione Ricerca Google</h3>
                                <p className="text-indigo-700 text-sm">Per utilizzare il radar lead (Google Search), è obbligatorio collegare la propria chiave API personale da un progetto con fatturazione attiva (Paid Tier).</p>
                                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-indigo-600 text-xs font-bold underline mt-2 block">Leggi come attivare la fatturazione Google</a>
                            </div>
                            
                            <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center">
                                <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <h4 className="font-bold text-slate-800 mb-2">Selettore Chiave Ufficiale</h4>
                                <p className="text-sm text-slate-500 mb-6">Usa il pulsante qui sotto per selezionare la chiave che hai creato.</p>
                                <button 
                                    onClick={handleOpenKeySelector}
                                    className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2 mx-auto"
                                >
                                    <Key className="w-5 h-5" /> Seleziona la tua Chiave API (Paid)
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsManager;