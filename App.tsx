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
import SettingsManager from './components/SettingsManager';
import LoginPortal from './components/LoginPortal';
import { AppProvider } from './contexts/AppContext';
import { UserSession } from './types';

const AppContent: React.FC = () => {
  // Session State
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Check for Agent Quick Login via URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const agentRef = params.get('agent_ref');
    
    // If URL has agent_ref, we defer logic to AgentMobileApp but we need to know we are in 'agent mode'
    // Actually, let's keep it clean: if there is an agent_ref, we switch to Agent Mode directly?
    // For now, let the AgentMobileApp handle its own deep linking logic if mounted, 
    // BUT we need to mount it.
    if(agentRef && !currentUser) {
        // Mock session to force Agent Mode mount
        // The AgentMobileApp component will do the actual validation against the context
        setCurrentUser({ role: 'agent', name: 'Agente', userId: 'temp' });
    }
  }, []);

  const handleLogin = (session: UserSession) => {
      setCurrentUser(session);
      // Reset tab based on role
      if(session.role === 'agency') setActiveTab('dashboard');
      else setActiveTab('mobile');
  };

  const handleLogout = () => {
      setCurrentUser(null);
      // Clear URL params if any
      window.history.pushState({}, document.title, window.location.pathname);
  };

  // If not logged in, show Login Portal
  if (!currentUser) {
      return <LoginPortal onLogin={handleLogin} />;
  }

  // If Agent, show strictly Agent App (Mobile View)
  if (currentUser.role === 'agent') {
      return <AgentMobileApp sessionAgentId={currentUser.userId} onLogout={handleLogout} />;
  }

  // If Agency, show Full Desktop Dashboard
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
        return <AgentMobileApp />; // Preview of mobile app for admin
      case 'settings':
        return <SettingsManager />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout}>
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