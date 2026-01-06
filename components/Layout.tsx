
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, Tenant, AppRoute } from '../types';
import TenantSwitcher from './TenantSwitcher';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  currentTenant: Tenant | null;
  tenants: Tenant[];
  onLogout: () => void;
  onSwitchTenant: (id: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, currentTenant, tenants, onLogout, onSwitchTenant }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: AppRoute.DASHBOARD, icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'Onboarding', href: AppRoute.ONBOARDING, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { name: 'Explore Hub', href: AppRoute.EXPLORE, icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
    { name: 'Billing', href: AppRoute.PRICING, icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { name: 'Settings', href: AppRoute.SETTINGS, icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 bg-slate-900 border-r border-slate-800">
          <div className="flex items-center h-16 flex-shrink-0 px-4 bg-slate-950">
            <span className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">B</div>
              BrandOS
            </span>
          </div>
          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      isActive
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    } group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200`}
                  >
                    <svg className={`${isActive ? 'text-blue-500' : 'text-slate-400 group-hover:text-slate-300'} mr-3 flex-shrink-0 h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                    </svg>
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            
            <div className="p-4 border-t border-slate-800">
              <TenantSwitcher 
                currentTenant={currentTenant} 
                tenants={tenants} 
                onSwitch={onSwitchTenant} 
              />
            </div>

            <div className="p-4 border-t border-slate-800">
              <div className="flex items-center">
                <img className="h-9 w-9 rounded-full ring-2 ring-slate-700" src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`} alt="" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">{user.name}</p>
                  <button onClick={onLogout} className="text-xs font-medium text-slate-400 hover:text-white transition-colors">Sign out</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between h-16 bg-white border-b border-gray-200 px-4">
           <span className="text-lg font-bold text-slate-900">BrandOS</span>
           <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-md text-gray-500">
             <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
             </svg>
           </button>
        </div>

        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {/* Plan Indicator */}
          {currentTenant && (
            <div className="bg-white border-b border-slate-100 px-8 py-3 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Tier</span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    currentTenant.plan === 'Enterprise' ? 'bg-indigo-600 text-white' : 
                    currentTenant.plan === 'Pro' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {currentTenant.plan}
                  </span>
               </div>
               {(!currentTenant.subscription || currentTenant.subscription.status !== 'active') && (
                 <Link to={AppRoute.PRICING} className="text-xs font-black text-indigo-600 hover:underline">Upgrade Workspace →</Link>
               )}
            </div>
          )}
          
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
