import React, { useState, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { Car, Users, TrendingUp, DollarSign, Activity, Calendar, Printer, Share2, Sparkles, AlertTriangle, ArrowDownRight, BrainCircuit, Loader2, X, FileText } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { generateStrategicReport } from '../services/gemini';

const StatCard: React.FC<{ title: string; value: string; subValue?: string; icon: React.ReactNode; color: string; trend?: 'up' | 'down' | 'neutral' }> = ({ title, value, subValue, icon, color, trend }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between h-full">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">{title}</p>
                <h3 className="text-3xl font-bold text-slate-800 mt-2">{value}</h3>
                {subValue && <p className="text-xs text-slate-400 mt-1">{subValue}</p>}
            </div>
            <div className={`p-3 rounded-xl ${color} text-white shadow-lg shadow-indigo-100`}>
                {icon}
            </div>
        </div>
        <div className="mt-4 flex items-center text-sm">
            {trend === 'up' && <span className="text-green-500 bg-green-50 px-2 py-1 rounded flex items-center gap-1 font-bold text-xs"><TrendingUp className="w-3 h-3" /> +Performance</span>}
            {trend === 'down' && <span className="text-red-500 bg-red-50 px-2 py-1 rounded flex items-center gap-1 font-bold text-xs"><ArrowDownRight className="w-3 h-3" /> Attenzione</span>}
            {trend === 'neutral' && <span className="text-slate-400 bg-slate-50 px-2 py-1 rounded flex items-center gap-1 font-bold text-xs"><Activity className="w-3 h-3" /> Stabile</span>}
        </div>
    </div>
);

// Helper function to format markdown-like text from AI
const formatReportText = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, index) => {
        const trimmed = line.trim();

        // Handle Headers (Lines starting with ** or # or numbered lists 1.)
        if (trimmed.startsWith('**') || trimmed.startsWith('#') || /^\d+\.\s\*\*/.test(trimmed)) {
            const cleanText = trimmed.replace(/#|\*|^\d+\.\s/g, '').trim();
            return <h3 key={index} className="text-lg font-bold text-slate-900 mt-6 mb-3 border-b border-slate-200 pb-1 uppercase tracking-tight">{cleanText}</h3>;
        }

        // Handle Bullet Points
        if (trimmed.startsWith('-') || trimmed.startsWith('* ')) {
            const cleanText = trimmed.replace(/^-|^\*\s/, '').trim();
            // Bold handling inside list items
            const parts = cleanText.split('**');
            return (
                <li key={index} className="ml-4 mb-2 text-slate-700 list-disc text-sm leading-relaxed pl-2">
                    {parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-semibold text-slate-900">{part}</strong> : part)}
                </li>
            );
        }

        // Standard Paragraphs with bold support
        if (trimmed.length > 0) {
            const parts = trimmed.split('**');
            return (
                <p key={index} className="mb-3 text-slate-700 text-sm leading-relaxed text-justify">
                    {parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-semibold text-slate-900">{part}</strong> : part)}
                </p>
            );
        }

        return null;
    });
};

const Dashboard: React.FC = () => {
    const { contracts, fleet, agents, clients } = useApp();
    const [timeRange, setTimeRange] = useState<'30d' | '90d' | 'year'>('30d');
    const [aiReport, setAiReport] = useState<string>('');
    const [loadingAi, setLoadingAi] = useState(false);

    // Print Preview State
    const [showPrintPreview, setShowPrintPreview] = useState(false);

    // --- CALCULATION LOGIC ---

    // 1. Filter Contracts by Time Range
    const filteredContracts = useMemo(() => {
        const now = new Date();
        const past = new Date();
        if (timeRange === '30d') past.setDate(now.getDate() - 30);
        if (timeRange === '90d') past.setDate(now.getDate() - 90);
        if (timeRange === 'year') past.setFullYear(now.getFullYear() - 1);

        return contracts.filter(c => new Date(c.signedDate) >= past && new Date(c.signedDate) <= now);
    }, [contracts, timeRange]);

    // 2. Metrics
    const totalRevenue = filteredContracts.reduce((sum, c) => sum + c.totalAmount, 0);
    const activeRentals = fleet.filter(c => c.status === 'Noleggiata').length;
    const occupancyRate = fleet.length > 0 ? ((activeRentals / fleet.length) * 100).toFixed(0) : '0';

    // 3. Car Performance (Most Rented & Unused)
    const carPerformance = useMemo(() => {
        const counts: Record<string, number> = {};
        filteredContracts.forEach(c => {
            counts[c.carId] = (counts[c.carId] || 0) + 1;
        });

        // Top Cars
        const ranked = Object.entries(counts)
            .map(([id, count]) => ({ car: fleet.find(f => f.id === id), count }))
            .sort((a, b) => b.count - a.count)
            .filter(item => item.car !== undefined);

        // Unused Cars (In fleet but 0 contracts in period)
        const unused = fleet.filter(car => !counts[car.id]);

        return { ranked, unused };
    }, [filteredContracts, fleet]);

    // 4. Agent Performance
    const agentPerformance = useMemo(() => {
        const counts: Record<string, { count: number, revenue: number }> = {};
        filteredContracts.forEach(c => {
            if (!counts[c.agentId]) counts[c.agentId] = { count: 0, revenue: 0 };
            counts[c.agentId].count += 1;
            counts[c.agentId].revenue += c.totalAmount;
        });

        return Object.entries(counts)
            .map(([id, data]) => ({ agent: agents.find(a => a.id === id), ...data }))
            .sort((a, b) => b.revenue - a.revenue) // Sort by revenue
            .filter(item => item.agent !== undefined);
    }, [filteredContracts, agents]);

    // --- ACTIONS ---

    const handleAiAnalysis = async () => {
        setLoadingAi(true);
        const stats = {
            period: timeRange === '30d' ? 'Ultimi 30 Giorni' : timeRange === '90d' ? 'Ultimo Trimestre' : 'Ultimo Anno',
            revenue: totalRevenue,
            topCars: carPerformance.ranked.slice(0, 3).map(i => `${i.car?.brand} ${i.car?.model} (${i.count} noleggi)`),
            unusedCars: carPerformance.unused.map(c => `${c.brand} ${c.model}`),
            topAgents: agentPerformance.slice(0, 3).map(i => `${i.agent?.name} (€${i.revenue})`)
        };

        try {
            const report = await generateStrategicReport(stats);
            setAiReport(report);
        } catch (e) {
            alert("Errore AI");
        } finally {
            setLoadingAi(false);
        }
    };

    // 5. Payments Due (Upcoming 30 Days)
    const paymentsDue = useMemo(() => {
        const now = new Date();
        const future = new Date();
        future.setDate(now.getDate() + 30);

        return contracts
            .filter(c => c.status === 'Attivo' && c.nextPaymentDate && new Date(c.nextPaymentDate) >= now && new Date(c.nextPaymentDate) <= future)
            .sort((a, b) => new Date(a.nextPaymentDate!).getTime() - new Date(b.nextPaymentDate!).getTime())
            .map(c => ({
                ...c,
                clientName: clients.find(cl => cl.id === c.clientId)?.name || 'Cliente Sconosciuto',
                daysLeft: Math.ceil((new Date(c.nextPaymentDate!).getTime() - now.getTime()) / (1000 * 3600 * 24))
            }));
    }, [contracts, clients]);

    const handlePrint = () => window.print();

    const handleShare = async () => {
        const text = `Report RentSync - ${timeRange}\nFatturato: €${totalRevenue}\nOccupazione: ${occupancyRate}%`;
        if (navigator.share) {
            await navigator.share({ title: 'Report RentSync', text });
        } else {
            alert("Report copiato!");
        }
    };

    // Mock data for charts (to visualize trends) based on context won't be perfect without real time-series DB, 
    // so we keep simplified visualizers for the UI impact.
    const CHART_DATA = [
        { name: 'Sett 1', val: totalRevenue * 0.2 },
        { name: 'Sett 2', val: totalRevenue * 0.25 },
        { name: 'Sett 3', val: totalRevenue * 0.15 },
        { name: 'Sett 4', val: totalRevenue * 0.4 },
    ];

    return (
        <div className="p-6 space-y-8 max-w-[1600px] mx-auto">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                        Dashboard Direzionale
                    </h2>
                    <p className="text-slate-500">Monitoraggio performance e Business Intelligence.</p>
                </div>

                <div className="flex flex-wrap gap-3 items-center bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 px-3 border-r border-slate-200">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value as any)}
                            className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
                        >
                            <option value="30d">Ultimi 30 Giorni</option>
                            <option value="90d">Ultimo Trimestre</option>
                            <option value="year">Anno Corrente</option>
                        </select>
                    </div>

                    <button onClick={handleShare} className="p-2 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors" title="Condividi"><Share2 className="w-5 h-5" /></button>
                    <button onClick={handlePrint} className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-lg" title="Stampa Dashboard"><Printer className="w-5 h-5" /></button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 print:hidden">
                <StatCard
                    title="Fatturato Periodo"
                    value={`€ ${totalRevenue.toLocaleString()}`}
                    subValue={`${filteredContracts.length} contratti firmati`}
                    trend={totalRevenue > 0 ? 'up' : 'neutral'}
                    icon={<DollarSign className="w-6 h-6" />}
                    color="bg-indigo-600"
                />
                <StatCard
                    title="Tasso Occupazione"
                    value={`${occupancyRate}%`}
                    subValue={`${fleet.length - activeRentals} veicoli disponibili oggi`}
                    trend={Number(occupancyRate) > 70 ? 'up' : Number(occupancyRate) < 30 ? 'down' : 'neutral'}
                    icon={<Activity className="w-6 h-6" />}
                    color="bg-orange-500"
                />
                <StatCard
                    title="Top Agente"
                    value={agentPerformance[0]?.agent?.nickname || "N/A"}
                    subValue={`€ ${agentPerformance[0]?.revenue.toLocaleString() || 0} vendite`}
                    trend="up"
                    icon={<Users className="w-6 h-6" />}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Auto + Richiesta"
                    value={carPerformance.ranked[0]?.car?.model || "N/A"}
                    subValue={`${carPerformance.ranked[0]?.count || 0} noleggi`}
                    trend="up"
                    icon={<Car className="w-6 h-6" />}
                    color="bg-emerald-500"
                />
            </div>

            {/* Payment Alerts Section - NEW */}
            {
                paymentsDue.length > 0 && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100 flex flex-col print:hidden">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-500 fill-red-100" /> Scadenze Rate (Prossimi 30gg)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {paymentsDue.map(p => (
                                <div key={p.id} className="flex items-center justify-between p-3 bg-red-50/50 rounded-lg border border-red-100 hover:bg-red-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white p-2 rounded-full border border-red-100 font-bold text-xs text-red-600 w-10 h-10 flex items-center justify-center shadow-sm">
                                            {p.daysLeft}gg
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800 text-sm">{p.clientName}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" /> {new Date(p.nextPaymentDate!).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-slate-900">€ {((p.totalAmount / (Math.round((new Date(p.endDate).getTime() - new Date(p.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30)) || 1))).toFixed(0)}</div>
                                        <div className="text-xs text-slate-400">Rata Mensile</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }

            {/* Main Analysis Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:hidden">

                {/* Left Column: Charts & Lists */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Revenue Chart */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-80 flex flex-col">
                        <h3 className="font-bold text-lg text-slate-800 mb-4">Andamento Ricavi</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={CHART_DATA}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="val" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Fleet Health Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Underperforming Cars */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-500" /> Flotta Sottoutilizzata</h3>
                                <span className="bg-red-50 text-red-600 px-2 py-1 rounded text-xs font-bold">{carPerformance.unused.length} Auto</span>
                            </div>
                            <p className="text-xs text-slate-400 mb-4">Veicoli senza contratti nel periodo selezionato.</p>

                            <div className="flex-1 overflow-y-auto max-h-60 pr-2 space-y-3">
                                {carPerformance.unused.length > 0 ? carPerformance.unused.map(car => (
                                    <div key={car.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg border border-slate-100">
                                        <img src={car.image} className="w-10 h-10 rounded object-cover bg-slate-200" alt="car" />
                                        <div>
                                            <div className="text-sm font-bold text-slate-700">{car.brand} {car.model}</div>
                                            <div className="text-xs text-slate-500">Ferma da {timeRange}</div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center text-slate-400 py-4 italic text-sm">Ottimo! Tutta la flotta sta lavorando.</div>
                                )}
                            </div>
                        </div>

                        {/* Top Agents */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-indigo-500" /> Top Performers</h3>
                            <div className="space-y-4">
                                {agentPerformance.slice(0, 4).map((item, idx) => (
                                    <div key={item.agent?.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-800">{item.agent?.nickname}</div>
                                                <div className="text-xs text-slate-500">{item.count} contratti</div>
                                            </div>
                                        </div>
                                        <div className="font-mono text-sm font-bold text-indigo-600">€ {item.revenue.toLocaleString()}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: AI Strategy */}
                <div className="lg:col-span-1">
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-xl h-full flex flex-col relative overflow-hidden print:border print:border-slate-200 print:bg-white print:text-black">
                        {/* Decorator */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-10 -mt-10 print:hidden"></div>

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="mb-6">
                                <h3 className="text-xl font-bold flex items-center gap-2 text-white print:text-slate-900">
                                    <BrainCircuit className="w-6 h-6 text-indigo-400" /> AI Business Intel
                                </h3>
                                <p className="text-slate-400 text-sm mt-1 print:text-slate-500">Analisi strategica basata sui dati attuali.</p>
                            </div>

                            <div className="bg-white/10 rounded-xl p-4 overflow-y-auto max-h-[500px] min-h-[300px] text-sm leading-relaxed text-slate-200 print:bg-slate-50 print:text-slate-800 print:border mb-4 custom-scrollbar pr-2">
                                {loadingAi ? (
                                    <div className="h-full flex flex-col items-center justify-center text-indigo-300">
                                        <Loader2 className="w-8 h-8 animate-spin mb-2" />
                                        <p>Elaborazione Strategia...</p>
                                    </div>
                                ) : aiReport ? (
                                    <div className="whitespace-pre-wrap markdown-content">
                                        {formatReportText(aiReport)}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50 italic text-center px-4">
                                        <Sparkles className="w-8 h-8 mb-2" />
                                        <p>Clicca "Analizza Dati" per ricevere consigli strategici su flotta, prezzi e agenti.</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-2 mt-auto">
                                <button
                                    onClick={handleAiAnalysis}
                                    disabled={loadingAi}
                                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-900/50 flex items-center justify-center gap-2 print:hidden"
                                >
                                    {loadingAi ? 'Analisi in corso...' : 'Genera Report Strategico'}
                                </button>

                                {aiReport && (
                                    <button
                                        onClick={() => setShowPrintPreview(true)}
                                        className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all border border-white/20 flex items-center justify-center gap-2 print:hidden"
                                    >
                                        <Printer className="w-4 h-4" /> Stampa Report Strategico
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Footer (for generic dashboard print) */}
            <div className="hidden print:block text-center text-sm text-slate-400 mt-10 pt-4 border-t border-slate-200">
                Dashboard generata da RentSync AI il {new Date().toLocaleDateString()}
            </div>

            {/* --- A4 REPORT PRINT PREVIEW MODAL --- */}
            {
                showPrintPreview && (
                    <div className="fixed inset-0 bg-black/80 z-[9999] flex justify-center items-start overflow-y-auto p-4 md:p-10 backdrop-blur-sm print:p-0 print:bg-white print:fixed print:inset-0">
                        <div className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-2xl relative print:shadow-none print:w-full print:h-full">

                            {/* Controls (Hidden in Print) */}
                            <div className="absolute -top-12 left-0 right-0 flex justify-between items-center text-white print:hidden w-full">
                                <div className="text-lg font-bold">Anteprima di Stampa (A4)</div>
                                <div className="flex gap-2">
                                    <button onClick={() => window.print()} className="bg-white text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-200 transition-colors">
                                        <Printer className="w-4 h-4" /> Stampa
                                    </button>
                                    <button onClick={() => setShowPrintPreview(false)} className="bg-white/20 text-white px-4 py-2 rounded-lg font-bold hover:bg-white/30 transition-colors">
                                        <X className="w-4 h-4" /> Chiudi
                                    </button>
                                </div>
                            </div>

                            {/* A4 Content */}
                            <div className="p-[20mm] h-full flex flex-col">
                                {/* Header */}
                                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center">
                                                <Car className="w-5 h-5 text-white" />
                                            </div>
                                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">RentSync.ai</h1>
                                        </div>
                                        <p className="text-sm text-slate-500">Business Intelligence & Fleet Strategy</p>
                                    </div>
                                    <div className="text-right">
                                        <h2 className="text-xl font-bold text-slate-900 uppercase tracking-wide">Report Strategico</h2>
                                        <p className="text-sm text-slate-600 font-mono mt-1">{new Date().toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                        <p className="text-xs text-slate-400 mt-1">Ref: {timeRange.toUpperCase()}</p>
                                    </div>
                                </div>

                                {/* Summary Box */}
                                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8 flex justify-between items-center">
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase">Fatturato Periodo</p>
                                        <p className="text-2xl font-bold text-slate-900">€ {totalRevenue.toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-slate-400 uppercase">Occupazione Flotta</p>
                                        <p className="text-2xl font-bold text-indigo-600">{occupancyRate}%</p>
                                    </div>
                                </div>

                                {/* AI Content */}
                                <div className="flex-1">
                                    {formatReportText(aiReport)}
                                </div>

                                {/* Footer */}
                                <div className="mt-auto pt-8 border-t border-slate-200 flex justify-between items-end text-xs text-slate-400">
                                    <div>
                                        <p>RentSync AI Manager</p>
                                        <p>Documento ad uso interno - Riservato</p>
                                    </div>
                                    <div className="text-right">
                                        <p>Generato da Gemini AI</p>
                                        <p>Pagina 1 di 1</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* CSS to hide main content when printing modal */}
            {
                showPrintPreview && (
                    <style>{`
              @media print {
                  body > *:not(.print:block) {
                      display: none;
                  }
                  /* Force background colors */
                  * {
                      -webkit-print-color-adjust: exact !important;
                      print-color-adjust: exact !important;
                  }
              }
          `}</style>
                )
            }
        </div >
    );
};

export default Dashboard;