
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User, Tenant, AppRoute } from './types';
import Auth from './components/Auth';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Onboarding from './components/Onboarding';
import Explore from './components/Explore';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);

  // Simulation: Check if user is logged in
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedTenants = localStorage.getItem('tenants');
    const savedCurrentTenantId = localStorage.getItem('currentTenantId');

    if (savedUser && savedTenants) {
      const parsedUser = JSON.parse(savedUser);
      const parsedTenants = JSON.parse(savedTenants);
      setUser(parsedUser);
      setTenants(parsedTenants);
      
      const tenantToSet = parsedTenants.find((t: Tenant) => t.id === savedCurrentTenantId) || parsedTenants[0];
      setCurrentTenant(tenantToSet);
    } else if (savedUser) {
      // Fallback for first time or legacy data
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      const mockTenants: Tenant[] = [
        { id: 't1', name: 'Acme Global', logo: 'https://picsum.photos/40/40?random=1', plan: 'Enterprise', status: 'Active' },
        { id: 't2', name: 'StartUp Inc', logo: 'https://picsum.photos/40/40?random=2', plan: 'Basic', status: 'Onboarding' }
      ];
      setTenants(mockTenants);
      setCurrentTenant(mockTenants[0]);
    }
  }, []);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
    
    // Default tenants if none exist
    const defaultTenants: Tenant[] = [
      { id: 't1', name: 'Acme Global', logo: 'https://picsum.photos/40/40?random=1', plan: 'Enterprise', status: 'Active' },
      { id: 't2', name: 'StartUp Inc', logo: 'https://picsum.photos/40/40?random=2', plan: 'Basic', status: 'Onboarding' }
    ];
    setTenants(defaultTenants);
    setCurrentTenant(defaultTenants[0]);
    localStorage.setItem('tenants', JSON.stringify(defaultTenants));
    localStorage.setItem('currentTenantId', defaultTenants[0].id);
  };

  const handleSignup = (newUser: User, companyName: string) => {
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));

    const newTenant: Tenant = {
      id: `t-${Date.now()}`,
      name: companyName,
      logo: `https://picsum.photos/40/40?random=${Math.floor(Math.random() * 1000)}`,
      plan: 'Basic',
      status: 'Onboarding'
    };

    const updatedTenants = [newTenant];
    setTenants(updatedTenants);
    setCurrentTenant(newTenant);
    localStorage.setItem('tenants', JSON.stringify(updatedTenants));
    localStorage.setItem('currentTenantId', newTenant.id);
  };

  const updateTenantStatus = (tenantId: string, status: 'Active' | 'Onboarding' | 'Inactive') => {
    const updatedTenants = tenants.map(t => t.id === tenantId ? { ...t, status } : t);
    setTenants(updatedTenants);
    localStorage.setItem('tenants', JSON.stringify(updatedTenants));
    
    const updatedCurrent = updatedTenants.find(t => t.id === currentTenant?.id);
    if (updatedCurrent) {
      setCurrentTenant(updatedCurrent);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentTenant(null);
    setTenants([]);
    localStorage.removeItem('user');
    localStorage.removeItem('tenants');
    localStorage.removeItem('currentTenantId');
  };

  const switchTenant = (tenantId: string) => {
    const t = tenants.find(x => x.id === tenantId);
    if (t) {
      setCurrentTenant(t);
      localStorage.setItem('currentTenantId', t.id);
    }
  };

  return (
    <HashRouter>
      <Routes>
        <Route 
          path={AppRoute.LOGIN} 
          element={user ? <Navigate to={AppRoute.DASHBOARD} replace /> : <Auth onLogin={handleLogin} onSignup={handleSignup} />} 
        />
        
        <Route 
          path="*" 
          element={
            user ? (
              <Layout 
                user={user} 
                currentTenant={currentTenant} 
                tenants={tenants}
                onLogout={handleLogout}
                onSwitchTenant={switchTenant}
              >
                <Routes>
                  <Route path="/" element={<Dashboard tenant={currentTenant!} />} />
                  <Route path="/onboarding" element={<Onboarding tenant={currentTenant!} onComplete={(id) => updateTenantStatus(id, 'Active')} />} />
                  <Route path="/explore" element={<Explore tenant={currentTenant!} />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to={AppRoute.LOGIN} replace />
            )
          } 
        />
      </Routes>
    </HashRouter>
  );
};

export default App;
