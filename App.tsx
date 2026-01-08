
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { User, Tenant, AppRoute, Subscription } from './types';
import Auth from './components/Auth';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Onboarding from './components/Onboarding';
import Explore from './components/Explore';
import SiteBuilder from './components/SiteBuilder';
import Pricing from './components/Pricing';
import Settings from './components/Settings';
import { DB } from './services/db';

const withSubscription = (Component: React.ComponentType<any>, requiredTier?: 'Pro' | 'Enterprise') => {
  return (props: any) => {
    const { currentTenant } = props;
    const navigate = useNavigate();

    useEffect(() => {
      if (!currentTenant?.subscription || currentTenant.subscription.status !== 'active') {
        // Feature gating logic can be expanded here
      }
    }, [currentTenant, navigate]);

    return <Component {...props} />;
  };
};

// Define gated components outside to prevent unmounting on parent re-renders
const GatedExplore = withSubscription(Explore);
const GatedDashboard = withSubscription(Dashboard);
const GatedSiteBuilder = withSubscription(SiteBuilder);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);

  useEffect(() => {
    const handleTenantUpdate = async () => {
      const savedTenants = await DB.get<Tenant[]>(DB.keys.TENANTS);
      if (savedTenants) {
        setTenants(savedTenants);
        const activeId = localStorage.getItem('currentTenantId');
        const updatedCurrent = savedTenants.find(t => t.id === activeId);
        if (updatedCurrent) setCurrentTenant(updatedCurrent);
      }
    };

    window.addEventListener('tenantUpdated', handleTenantUpdate);
    return () => window.removeEventListener('tenantUpdated', handleTenantUpdate);
  }, []);

  useEffect(() => {
    const loadState = async () => {
      const savedUser = localStorage.getItem('user');
      const savedTenants = await DB.get<Tenant[]>(DB.keys.TENANTS);
      const savedCurrentTenantId = localStorage.getItem('currentTenantId');

      if (savedUser) {
        setUser(JSON.parse(savedUser));
        
        if (savedTenants && savedTenants.length > 0) {
          setTenants(savedTenants);
          const tenantToSet = savedTenants.find((t: Tenant) => t.id === savedCurrentTenantId) || savedTenants[0];
          setCurrentTenant(tenantToSet);
        } else {
          const mockTenants: Tenant[] = [
            { id: 't1', name: 'Acme Global', logo: 'https://picsum.photos/40/40?random=1', plan: 'Enterprise', status: 'Active', subscription: { id: 'sub_1', tenantId: 't1', stripeCustomerId: 'cus_acme_123', status: 'active', tier: 'Enterprise' } },
            { id: 't2', name: 'StartUp Inc', logo: 'https://picsum.photos/40/40?random=2', plan: 'Basic', status: 'Onboarding' }
          ];
          setTenants(mockTenants);
          setCurrentTenant(mockTenants[0]);
          await DB.set(DB.keys.TENANTS, mockTenants);
        }
      }
    };
    loadState();
  }, []);

  const handleLogin = async (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
    
    const savedTenants = await DB.get<Tenant[]>(DB.keys.TENANTS);
    if (!savedTenants || savedTenants.length === 0) {
      const defaultTenants: Tenant[] = [
        { id: 't1', name: 'Acme Global', logo: 'https://picsum.photos/40/40?random=1', plan: 'Enterprise', status: 'Active', subscription: { id: 'sub_1', tenantId: 't1', stripeCustomerId: 'cus_acme_123', status: 'active', tier: 'Enterprise' } },
        { id: 't2', name: 'StartUp Inc', logo: 'https://picsum.photos/40/40?random=2', plan: 'Basic', status: 'Onboarding' }
      ];
      setTenants(defaultTenants);
      setCurrentTenant(defaultTenants[0]);
      await DB.set(DB.keys.TENANTS, defaultTenants);
      localStorage.setItem('currentTenantId', defaultTenants[0].id);
    } else {
      setTenants(savedTenants);
      setCurrentTenant(savedTenants[0]);
    }
  };

  const handleSignup = async (newUser: User, companyName: string) => {
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));

    const newTenant: Tenant = {
      id: `t-${Date.now()}`,
      name: companyName,
      logo: `https://picsum.photos/40/40?random=${Math.floor(Math.random() * 1000)}`,
      plan: 'Basic',
      status: 'Onboarding'
    };

    const existingTenants = await DB.get<Tenant[]>(DB.keys.TENANTS) || [];
    const updatedTenants = [...existingTenants, newTenant];
    setTenants(updatedTenants);
    setCurrentTenant(newTenant);
    await DB.set(DB.keys.TENANTS, updatedTenants);
    localStorage.setItem('currentTenantId', newTenant.id);
  };

  const handleSubscriptionUpdate = async (sub: Subscription) => {
    const updatedTenants = tenants.map(t => t.id === sub.tenantId ? { ...t, subscription: sub, plan: sub.tier } : t);
    setTenants(updatedTenants);
    await DB.set(DB.keys.TENANTS, updatedTenants);
    if (currentTenant?.id === sub.tenantId) {
      setCurrentTenant(updatedTenants.find(t => t.id === sub.tenantId)!);
    }
  };

  const handleUpdateTenant = async (updatedTenant: Tenant) => {
    const updatedTenants = tenants.map(t => t.id === updatedTenant.id ? updatedTenant : t);
    setTenants(updatedTenants);
    await DB.set(DB.keys.TENANTS, updatedTenants);
    if (currentTenant?.id === updatedTenant.id) {
      setCurrentTenant(updatedTenant);
    }
  };

  const updateTenantStatus = async (tenantId: string, status: 'Active' | 'Onboarding' | 'Inactive') => {
    const savedTenants = await DB.get<Tenant[]>(DB.keys.TENANTS) || [];
    const updatedTenants = savedTenants.map(t => t.id === tenantId ? { ...t, status } : t);
    setTenants(updatedTenants);
    await DB.set(DB.keys.TENANTS, updatedTenants);
    
    if (currentTenant?.id === tenantId) {
      setCurrentTenant(updatedTenants.find(t => t.id === tenantId) || null);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentTenant(null);
    setTenants([]);
    localStorage.clear();
    window.location.reload();
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
                  <Route path="/" element={<GatedDashboard tenant={currentTenant!} />} />
                  <Route path="/onboarding" element={<Onboarding tenant={currentTenant!} onComplete={async (id) => await updateTenantStatus(id, 'Active')} />} />
                  <Route path="/explore" element={<GatedExplore tenant={currentTenant!} />} />
                  <Route path="/builder" element={<GatedSiteBuilder tenant={currentTenant!} />} />
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
