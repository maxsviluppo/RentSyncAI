import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { UserSession } from '../types';
import { Building2, User, ArrowRight, ShieldCheck, Car, Key, Loader2, Sparkles } from 'lucide-react';

interface LoginPortalProps {
    onLogin: (session: UserSession) => void;
}

const LoginPortal: React.FC<LoginPortalProps> = ({ onLogin }) => {
    const { agents } = useApp();
    const [selectedRole, setSelectedRole] = useState<'agency' | 'agent' | null>(null);
    const [formData, setFormData] = useState({ identifier: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        setTimeout(() => {
            if (selectedRole === 'agency') {
                if (formData.password === 'admin123' || formData.password === '') {
                    onLogin({ role: 'agency', name: 'Amministratore' });
                } else {
                    setError('Password errata. (Prova "admin123" o lascia vuoto)');
                    setLoading(false);
                }
            } else {
                const agent = agents.find(a => a.nickname.toLowerCase() === formData.identifier.toLowerCase());
                if (agent) {
                    onLogin({ role: 'agent', userId: agent.id, name: agent.name });
                } else {
                    setError('Agente non trovato.');
                    setLoading(false);
                }
            }
        }, 800);
    };

    const handleQuickLogin = () => {
        onLogin({ role: 'agency', name: 'Demo User' });
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col md:flex-row relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px]"></div>
            </div>

            <div className="md:w-1/2 p-8 md:p-16 flex flex-col justify-between relative z-10 text-white">
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                            <Car className="w-7 h-7 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">RentSync<span className="text-blue-400">.ai</span></h1>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-extrabold leading-tight mb-6">
                        Il futuro del noleggio <br/> 
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Intelligente</span>
                    </h2>
                    <p className="text-slate-400 text-lg max-w-md">
                        Gestisci flotta, lead e preventivi con la potenza di Gemini AI.
                    </p>
                </div>
            </div>

            <div className="md:w-1/2 bg-white md:rounded-l-[40px] shadow-2xl relative z-20 p-8 md:p-16 flex flex-col justify-center">
                
                {!selectedRole ? (
                    <div className="max-w-md mx-auto w-full animate-in fade-in slide-in-from-right duration-500">
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Piattaforma Gestionale</h3>
                        <p className="text-slate-500 mb-8">Seleziona come vuoi accedere.</p>
                        
                        <div className="grid gap-4">
                            <button 
                                onClick={() => setSelectedRole('agency')}
                                className="group p-6 border-2 border-slate-100 rounded-2xl hover:border-indigo-600 hover:bg-indigo-50 transition-all text-left flex items-center gap-4 relative"
                            >
                                <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                                    <Building2 className="w-7 h-7" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-lg">Agenzia / Sede</h4>
                                    <p className="text-sm text-slate-500">Full Dashboard access.</p>
                                </div>
                                <ArrowRight className="absolute right-6 opacity-0 group-hover:opacity-100 transition-all" />
                            </button>

                            <button 
                                onClick={() => setSelectedRole('agent')}
                                className="group p-6 border-2 border-slate-100 rounded-2xl hover:border-blue-600 hover:bg-blue-50 transition-all text-left flex items-center gap-4 relative"
                            >
                                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                    <User className="w-7 h-7" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-lg">Subagente</h4>
                                    <p className="text-sm text-slate-500">App mobile e preventivi rapidi.</p>
                                </div>
                                <ArrowRight className="absolute right-6 opacity-0 group-hover:opacity-100 transition-all" />
                            </button>
                        </div>

                        <div className="mt-10 pt-10 border-t border-slate-100 text-center">
                            <p className="text-xs text-slate-400 mb-4 uppercase font-bold tracking-widest">Sei un revisore o tester?</p>
                            <button 
                                onClick={handleQuickLogin}
                                className="w-full py-4 bg-emerald-50 text-emerald-700 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-100 transition-all border border-emerald-200"
                            >
                                <Sparkles className="w-5 h-5" /> Accesso Rapido Demo
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-md mx-auto w-full animate-in fade-in slide-in-from-right duration-500">
                        <button onClick={() => setSelectedRole(null)} className="text-sm text-slate-400 hover:text-slate-600 mb-6">
                            ← Indietro
                        </button>
                        
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">
                                    {selectedRole === 'agency' ? 'Password Admin' : 'Nickname Agente'}
                                </label>
                                <input 
                                    type={selectedRole === 'agency' ? 'password' : 'text'} 
                                    className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder={selectedRole === 'agency' ? 'admin123' : 'demo'}
                                    value={selectedRole === 'agency' ? formData.password : formData.identifier}
                                    onChange={e => selectedRole === 'agency' ? setFormData({...formData, password: e.target.value}) : setFormData({...formData, identifier: e.target.value})}
                                />
                            </div>

                            {error && <p className="text-red-500 text-sm">{error}</p>}

                            <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg">
                                {loading ? 'Caricamento...' : 'Accedi'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoginPortal;