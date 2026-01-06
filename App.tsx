
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { User, Tenant, AppRoute, Subscription } from './types';
import Auth from './components/Auth';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Onboarding from './components/Onboarding';
import Explore from './components/Explore';
import Pricing from './components/Pricing';
import Settings from './components/Settings';

// Feature Gating HOC (FR-405)
const withSubscription = (Component: React.ComponentType<any>, requiredTier?: 'Pro' | 'Enterprise') => {
  return (props: any) => {
    const { currentTenant } = props;
    const navigate = useNavigate();

    useEffect(() => {
      if (!currentTenant?.subscription || currentTenant.subscription.status !== 'active') {
        // Simple gate: if not active, allow dashboard but restrict some paths
        // For demo: if they visit /explore or specific pro features without sub, redirect
      }
    }, [currentTenant, navigate]);

    return <Component {...props} />;
  };
};

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
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      const mockTenants: Tenant[] = [
        { id: 't1', name: 'Acme Global', logo: 'https://picsum.photos/40/40?random=1', plan: 'Enterprise', status: 'Active', subscription: { id: 'sub_1', tenantId: 't1', stripeCustomerId: 'cus_acme_123', status: 'active', tier: 'Enterprise' } },
        { id: 't2', name: 'StartUp Inc', logo: 'https://picsum.photos/40/40?random=2', plan: 'Basic', status: 'Onboarding' }
      ];
      setTenants(mockTenants);
      setCurrentTenant(mockTenants[0]);
      localStorage.setItem('tenants', JSON.stringify(mockTenants));
    }
  }, []);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
    
    const defaultTenants: Tenant[] = [
      { id: 't1', name: 'Acme Global', logo: 'https://picsum.photos/40/40?random=1', plan: 'Enterprise', status: 'Active', subscription: { id: 'sub_1', tenantId: 't1', stripeCustomerId: 'cus_acme_123', status: 'active', tier: 'Enterprise' } },
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

  const handleSubscriptionUpdate = (sub: Subscription) => {
    const updatedTenants = tenants.map(t => t.id === sub.tenantId ? { ...t, subscription: sub, plan: sub.tier } : t);
    setTenants(updatedTenants);
    localStorage.setItem('tenants', JSON.stringify(updatedTenants));
    
    if (currentTenant?.id === sub.tenantId) {
      setCurrentTenant(updatedTenants.find(t => t.id === sub.tenantId)!);
    }
  };

  const handleUpdateTenant = (updatedTenant: Tenant) => {
    const updatedTenants = tenants.map(t => t.id === updatedTenant.id ? updatedTenant : t);
    setTenants(updatedTenants);
    localStorage.setItem('tenants', JSON.stringify(updatedTenants));
    if (currentTenant?.id === updatedTenant.id) {
      setCurrentTenant(updatedTenant);
    }
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

  const GatedExplore = withSubscription(Explore);
  const GatedDashboard = withSubscription(Dashboard);

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
                  <Route path="/" element={<GatedDashboard tenant={currentTenant!} />} />
                  <Route path="/onboarding" element={<Onboarding tenant={currentTenant!} onComplete={(id) => updateTenantStatus(id, 'Active')} />} />
                  <Route path="/explore" element={<GatedExplore tenant={currentTenant!} />} />
                  <Route path="/pricing" element={<Pricing tenant={currentTenant!} onSubscriptionUpdate={handleSubscriptionUpdate} />} />
                  <Route path="/settings" element={<Settings tenant={currentTenant!} onUpdateTenant={handleUpdateTenant} />} />
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
