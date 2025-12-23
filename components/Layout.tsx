
import React from 'react';
import { LayoutDashboard, Car, Users, Calculator, PieChart, Megaphone, Settings, LogOut, Briefcase, Smartphone, ChevronRight } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

const SidebarItem: React.FC<{ icon: React.ReactNode; label: string; active: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`group relative w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 ease-in-out ${
      active 
        ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/25 translate-x-1' 
        : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
    }`}
  >
    <div className="flex items-center gap-3.5">
      <span className={`transition-colors duration-300 ${active ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'}`}>
        {icon}
      </span>
      <span className="font-medium text-sm tracking-wide">{label}</span>
    </div>
    {active && <ChevronRight className="w-4 h-4 text-white/50 animate-in fade-in slide-in-from-left-1" />}
  </button>
);

const SectionHeader: React.FC<{ label: string }> = ({ label }) => (
  <div className="px-4 mt-8 mb-3">
    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{label}</span>
  </div>
);

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, onLogout }) => {
  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      {/* Sidebar */}
      <div className="w-72 bg-[#020617] flex flex-col h-full flex-shrink-0 border-r border-slate-900 shadow-2xl relative z-20">
        
        {/* LOGO SECTION (UNCHANGED) */}
        <div className="p-6 border-b border-slate-800/60 bg-[#020617]">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                <Car className="w-6 h-6 text-white" strokeWidth={2.5} />
             </div>
             <div className="flex items-center gap-1.5">
               <span className="text-white">Rent</span>
               <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">Sync</span>
               <span className="text-blue-500">AI</span>
             </div>
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1 scrollbar-hide">
          <SectionHeader label="Piattaforma" />
          
          <SidebarItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <SidebarItem 
            icon={<Car size={20} />} 
            label="Parco Auto" 
            active={activeTab === 'fleet'} 
            onClick={() => setActiveTab('fleet')} 
          />
          <SidebarItem 
            icon={<Calculator size={20} />} 
            label="Preventivatore" 
            active={activeTab === 'quotes'} 
            onClick={() => setActiveTab('quotes')} 
          />
          <SidebarItem 
            icon={<PieChart size={20} />} 
            label="Analisi Rischi AI" 
            active={activeTab === 'risk'} 
            onClick={() => setActiveTab('risk')} 
          />
          
          <SectionHeader label="Commerciale & Rete" />
          
          <SidebarItem 
            icon={<Users size={20} />} 
            label="Clienti" 
            active={activeTab === 'clients'} 
            onClick={() => setActiveTab('clients')} 
          />
           <SidebarItem 
            icon={<Briefcase size={20} />} 
            label="Subagenti" 
            active={activeTab === 'agents'} 
            onClick={() => setActiveTab('agents')} 
          />
          <SidebarItem 
            icon={<Megaphone size={20} />} 
            label="Marketing & Lead" 
            active={activeTab === 'marketing'} 
            onClick={() => setActiveTab('marketing')} 
          />
          <SidebarItem 
            icon={<Smartphone size={20} />} 
            label="App Agente" 
            active={activeTab === 'mobile'} 
            onClick={() => setActiveTab('mobile')} 
          />
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-800/60 bg-[#020617]">
          <SidebarItem 
            icon={<Settings size={20} />} 
            label="Impostazioni" 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
          />
          <button 
            onClick={onLogout}
            className="w-full mt-2 flex items-center gap-3 px-4 py-3.5 text-red-400/80 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all duration-200 group"
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium text-sm">Esci</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 relative">
        {/* Subtle decorative background blur for main content area */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-50/50 to-transparent pointer-events-none z-0"></div>
        <main className="flex-1 overflow-y-auto p-2 relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
