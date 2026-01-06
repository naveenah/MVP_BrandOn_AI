
import React, { useState } from 'react';
import { Tenant } from '../types';

interface TenantSwitcherProps {
  currentTenant: Tenant | null;
  tenants: Tenant[];
  onSwitch: (id: string) => void;
}

const TenantSwitcher: React.FC<TenantSwitcherProps> = ({ currentTenant, tenants, onSwitch }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!currentTenant) return null;

  return (
    <div className="relative">
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Workspace</label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition-colors"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <img src={currentTenant.logo} alt="" className="w-5 h-5 rounded object-cover flex-shrink-0" />
          <span className="text-sm font-medium truncate">{currentTenant.name}</span>
        </div>
        <svg className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 w-full mb-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
          {tenants.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                onSwitch(t.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-3 text-sm text-left hover:bg-slate-700 transition-colors ${t.id === currentTenant.id ? 'bg-slate-700' : ''}`}
            >
              <img src={t.logo} alt="" className="w-5 h-5 rounded" />
              <div className="flex-1 overflow-hidden">
                <div className="text-white font-medium truncate">{t.name}</div>
                <div className="text-slate-400 text-xs">{t.plan} Plan</div>
              </div>
              {t.id === currentTenant.id && (
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TenantSwitcher;
