import React, { useState } from 'react';
import { analyzeRisk } from '../services/gemini';
import { RiskAnalysisResult } from '../types';
import { AlertTriangle, CheckCircle, XCircle, Loader2, BarChart3 } from 'lucide-react';

const RiskAnalyzer: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Azienda', // Azienda or Privato
    revenue: '',
    yearsActive: '',
    debts: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RiskAnalysisResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const analysis = await analyzeRisk(
        { name: formData.name, type: formData.type },
        `Fatturato annuo/Reddito: ${formData.revenue}. Anni di attività/Anzianità lavoro: ${formData.yearsActive}. Debiti/Pendenze: ${formData.debts}. Note extra: ${formData.notes}`
      );
      setResult(analysis);
    } catch (error) {
      alert("Errore durante l'analisi AI");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
          <BarChart3 className="w-8 h-8 text-indigo-600" />
          Analisi Solvibilità & Rischio AI
        </h2>
        <p className="text-slate-500 mt-2">
          Utilizza l'intelligenza artificiale per valutare la situazione socio-economica del cliente e determinare l'affidabilità per l'assegnazione del parco auto.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
          <h3 className="text-xl font-semibold mb-4 text-slate-700">Dati Finanziari Candidato</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome / Ragione Sociale</label>
              <input
                type="text"
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo Soggetto</label>
                <select
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="Azienda">Azienda</option>
                  <option value="Privato">Privato</option>
                  <option value="Freelance">Libero Professionista</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Anzianità (Anni)</label>
                <input
                  type="number"
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.yearsActive}
                  onChange={e => setFormData({ ...formData, yearsActive: e.target.value })}
                  placeholder="es. 5"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fatturato / Reddito Annuo (€)</label>
              <input
                type="text"
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.revenue}
                onChange={e => setFormData({ ...formData, revenue: e.target.value })}
                placeholder="es. 150.000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Situazione Debitoria / Crif</label>
              <textarea
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                rows={2}
                value={formData.debts}
                onChange={e => setFormData({ ...formData, debts: e.target.value })}
                placeholder="Descrivi eventuali segnalazioni o assenza di debiti..."
              />
            </div>

             <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Note Aggiuntive</label>
              <textarea
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                rows={3}
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Dettagli sul contratto richiesto, settore merceologico, ecc."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors flex justify-center items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : <BarChart3 className="w-5 h-5" />}
              {loading ? 'Analisi in corso...' : 'Esegui Analisi Rischi'}
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {!result && !loading && (
            <div className="h-full flex items-center justify-center bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 p-8 text-center">
              Compila il modulo a sinistra per avviare l'analisi predittiva del cliente.
            </div>
          )}

          {loading && (
            <div className="h-full flex flex-col items-center justify-center bg-white rounded-xl shadow p-8 space-y-4">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
              <p className="text-slate-600">L'IA sta elaborando i dati finanziari e storici...</p>
            </div>
          )}

          {result && (
            <div className="bg-white rounded-xl shadow-lg border-t-4 border-indigo-600 overflow-hidden">
              <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">Risultato Valutazione</h3>
                <span className={`px-4 py-1 rounded-full text-sm font-bold ${
                  result.riskLevel === 'Basso' ? 'bg-green-100 text-green-700' :
                  result.riskLevel === 'Medio' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  Rischio {result.riskLevel}
                </span>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="text-slate-600">Punteggio Affidabilità</div>
                  <div className="text-4xl font-extrabold text-slate-800">{result.riskScore}/100</div>
                </div>
                
                <div className="w-full bg-slate-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${
                      result.riskScore > 75 ? 'bg-green-500' : 
                      result.riskScore > 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} 
                    style={{ width: `${result.riskScore}%` }}
                  ></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="bg-slate-50 p-4 rounded-lg">
                      <div className="text-xs text-slate-500 uppercase font-semibold">Fido Consigliato</div>
                      <div className="text-xl font-bold text-slate-800">€ {result.maxCreditLimit.toLocaleString()}</div>
                   </div>
                   <div className="bg-slate-50 p-4 rounded-lg">
                      <div className="text-xs text-slate-500 uppercase font-semibold">Esito Sintetico</div>
                      <div className="text-sm font-medium text-slate-800 mt-1">{result.recommendation}</div>
                   </div>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-700 mb-2">Analisi Dettagliata</h4>
                  <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
                    {result.reasoning}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RiskAnalyzer;
