import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import FleetManager from './components/FleetManager';
import RiskAnalyzer from './components/RiskAnalyzer';
import QuoteGenerator from './components/QuoteGenerator';
import MarketingLeads from './components/MarketingLeads';
import ClientsManager from './components/ClientsManager';
import AgentsManager from './components/AgentsManager';
import AgentMobileApp from './components/AgentMobileApp';
import Settings from './components/Settings';
import { AppProvider } from './contexts/AppContext';

const AppContent: React.FC = () => {
  // Initialize activeTab based on URL params for QR Code login
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('agent_ref') ? 'mobile' : 'dashboard';
  });

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'fleet':
        return <FleetManager />;
      case 'risk':
        return <RiskAnalyzer />;
      case 'quotes':
        return <QuoteGenerator />;
      case 'marketing':
        return <MarketingLeads />;
      case 'clients':
        return <ClientsManager />;
      case 'agents':
        return <AgentsManager />;
      case 'mobile':
        return <AgentMobileApp />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  // If we are in mobile mode via QR code, we might want to hide the desktop sidebar
  // But for now, we keep the layout consistent or hide sidebar if on small screen
  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;