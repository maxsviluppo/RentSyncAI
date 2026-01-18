import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Save, Building2, MapPin, Phone, Mail, Globe, FileText, BadgeInfo, ShieldCheck } from 'lucide-react';

const Settings: React.FC = () => {
    const { companySettings, updateCompanySettings } = useApp();
    const [formData, setFormData] = useState(companySettings);
    const [isSaving, setIsSaving] = useState(false);
    const [savedMessage, setSavedMessage] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        // Simulate API call and storage update
        setTimeout(() => {
            updateCompanySettings(formData);
            setIsSaving(false);
            setSavedMessage(true);
            setTimeout(() => setSavedMessage(false), 3000);
        }, 800);
    };

    return (
        <div className="h-full overflow-y-auto p-8 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Impostazioni Azienda</h1>
                        <p className="text-slate-500 dark:text-slate-400">Gestisci le informazioni della tua compagnia di noleggio.</p>
                    </div>
                </div>

                {savedMessage && (
                    <div className="mb-6 p-4 bg-green-100 border border-green-200 text-green-700 rounded-lg flex items-center">
                        <span className="font-medium">Modifiche salvate con successo!</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info Card */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-indigo-500" />
                            Informazioni Generali
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Nome Brand
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Es. RentSync Autos"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Ragione Sociale
                                </label>
                                <input
                                    type="text"
                                    name="legalName"
                                    value={formData.legalName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Es. Rossi Noleggi S.r.l."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Partita IVA
                                </label>
                                <div className="relative">
                                    <BadgeInfo className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        name="vatNumber"
                                        value={formData.vatNumber}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                        placeholder="IT..."
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Indirizzo Sede
                                </label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                        placeholder="Via Roma 1, Milano"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Info Card */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Phone className="w-5 h-5 text-emerald-500" />
                            Contatti
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                        placeholder="info@azienda.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Telefono
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                        placeholder="+39 ..."
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Sito Web
                                </label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        name="website"
                                        value={formData.website}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Branding Info Card */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-amber-500" />
                            Branding & Info
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    URL Logo Aziendale
                                </label>
                                <input
                                    type="text"
                                    name="logoUrl"
                                    value={formData.logoUrl}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                    placeholder="https://..."
                                />
                                {formData.logoUrl && (
                                    <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-4">
                                        <div className="w-20 h-20 relative bg-white rounded-md flex items-center justify-center overflow-hidden border border-slate-200">
                                            <img src={formData.logoUrl} alt="Logo Preview" className="w-full h-full object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                        </div>
                                        <div className="text-sm text-slate-500">
                                            <p>Anteprima Logo</p>
                                            <p className="text-xs">Assicurati che l'URL sia pubblico e accessibile.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Descrizione / Chi Siamo
                                </label>
                                <textarea
                                    name="description"
                                    rows={4}
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Descrivi la tua azienda..."
                                />
                            </div>
                        </div>
                    </div>



                    {/* Price List Management */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-rose-600">
                            <FileText className="w-5 h-5" />
                            Gestione Listini & AI
                        </h2>
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                            <p className="text-sm text-slate-600 mb-4">Carica il listino ufficiale in PDF (Max 20MB) per l'estrazione automatica dei prezzi via Gemini AI.</p>

                            <div className="flex items-center gap-4">
                                <label className="flex-1">
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                if (file.size > 20 * 1024 * 1024) {
                                                    alert("File troppo grande (Max 20MB)");
                                                    return;
                                                }
                                                // Convert to Base64 and call API
                                                const reader = new FileReader();
                                                reader.onload = async () => {
                                                    const base64 = (reader.result as string).split(',')[1];
                                                    try {
                                                        const { parsePriceListPdf } = await import('../services/gemini');
                                                        alert("Analisi PDF avviata... (Simulazione)");
                                                        // const result = await parsePriceListPdf(base64);
                                                        // console.log(result);
                                                        // alert("Listino acquisito con successo!");
                                                    } catch (err) {
                                                        alert("Errore acquisizione listino API");
                                                        console.error(err);
                                                    }
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                </label>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">Nota: L'acquisizione di file &gt; 5MB richiede tempo. Non chiudere la pagina.</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-indigo-700">
                            <ShieldCheck className="w-5 h-5" />
                            Integrazione CRIF / Affidabilità
                        </h2>
                        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg mb-6 text-sm text-indigo-800">
                            Inserisci le credenziali API rilasciate da CRIF per abilitare le interrogazioni reali sulla solvibilità.
                            In assenza di credenziali, il sistema continuerà ad usare l'analisi AI simulata.
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Username API
                                </label>
                                <input
                                    type="text"
                                    name="crifUsername"
                                    value={formData.crifUsername || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Es. USP001..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Password API
                                </label>
                                <input
                                    type="password"
                                    name="crifPassword"
                                    value={formData.crifPassword || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                    placeholder="••••••••••••"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Certificato P12/PEM (Contenuto o Path)
                                </label>
                                <textarea
                                    name="crifCertificate"
                                    rows={3}
                                    value={formData.crifCertificate || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-mono text-xs"
                                    placeholder="-----BEGIN CERTIFICATE----- ..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Circuito
                                </label>
                                <select
                                    name="crifCircuit"
                                    value={formData.crifCircuit || 'S'}
                                    onChange={(e) => setFormData({ ...formData, crifCircuit: e.target.value as 'S' | 'P' })} // Cast to correct type
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                >
                                    <option value="S">Sintetico (Test)</option>
                                    <option value="P">Produzione (Reale)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-50 hover:scale-105 active:scale-95"
                        >
                            <Save className="w-5 h-5" />
                            {isSaving ? 'Salvataggio...' : 'Salva Impostazioni'}
                        </button>
                    </div>

                </form>
            </div >
        </div >
    );
};

export default Settings;
