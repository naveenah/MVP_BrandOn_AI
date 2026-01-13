
import React, { useState } from 'react';
import { User } from '../types';
import { DB } from '../services/db';

interface AuthProps {
  onLogin: (user: User) => void;
  onSignup: (user: User, companyName: string) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin, onSignup }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('demo@enterprise.com');
  const [password, setPassword] = useState('password');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate network delay
    setTimeout(() => {
      if (isLoginMode) {
        onLogin({
          id: 'u1',
          name: 'Alexander Pierce',
          email: email,
          avatar: 'https://i.pravatar.cc/150?u=alexander'
        });
      } else {
        onSignup({
          id: `u-${Date.now()}`,
          name: name || email.split('@')[0],
          email: email,
          avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`
        }, companyName || 'New Venture');
      }
      setIsLoading(false);
    }, 800);
  };

  const handleSystemReset = async () => {
    if (!window.confirm("Perform a full system restart? This will purge all tenant data, websites, and settings.")) return;
    setIsResetting(true);
    await DB.clearAll();
    window.location.reload();
  };

  const handleGoogleAuth = () => {
    setIsLoading(true);
    // Simulate Google Login popup logic
    setTimeout(() => {
      onLogin({
        id: 'google-user-123',
        name: 'Google User',
        email: 'user@gmail.com',
        avatar: 'https://lh3.googleusercontent.com/a/ACg8ocL_G5X6mYJ'
      });
      setIsLoading(false);
    }, 1200);
  };

  const GoogleIcon = () => (
    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto h-14 w-14 bg-gradient-to-tr from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-xl shadow-blue-200 ring-4 ring-white">B</div>
        <h2 className="mt-6 text-center text-3xl font-black text-slate-900 tracking-tight">
          {isLoginMode ? 'Welcome back' : 'Start your journey'}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 font-medium">
          {isLoginMode ? (
            <>
              Don't have an enterprise account?{' '}
              <button 
                onClick={() => setIsLoginMode(false)}
                className="text-blue-600 hover:text-blue-500 font-bold underline decoration-2 underline-offset-4"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already using BrandOS?{' '}
              <button 
                onClick={() => setIsLoginMode(true)}
                className="text-blue-600 hover:text-blue-500 font-bold underline decoration-2 underline-offset-4"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-6 shadow-2xl shadow-slate-200/50 sm:rounded-3xl sm:px-12 border border-slate-100 transition-all duration-500 ease-in-out">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLoginMode && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Your Name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="appearance-none block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 sm:text-sm transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="company" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Enterprise Name</label>
                  <input
                    id="company"
                    name="company"
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Global Solutions Ltd"
                    className="appearance-none block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 sm:text-sm transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Corporate Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 sm:text-sm transition-all"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" title="Demo password" className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Secure Password</label>
                {isLoginMode && (
                  <div className="text-xs font-bold">
                    <a href="#" className="text-blue-600 hover:text-blue-500">Reset?</a>
                  </div>
                )}
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 sm:text-sm transition-all"
              />
            </div>

            {isLoginMode && (
              <div className="flex items-center">
                <input id="remember-me" name="remember-me" type="checkbox" className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-slate-200 rounded-lg transition-all" />
                <label htmlFor="remember-me" className="ml-3 block text-sm font-bold text-slate-700">Stay signed in</label>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-xl text-sm font-black text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <>
                    <span className="relative z-10">{isLoginMode ? 'Access Workspace' : 'Initialize Account'}</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-slate-400 uppercase tracking-[0.2em] text-[10px] font-black">Secure Bridge</span>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="w-full flex items-center justify-center py-4 px-4 border border-slate-200 rounded-2xl shadow-sm text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50"
              >
                <GoogleIcon />
                Sign in with Google
              </button>
              
              <button
                type="button"
                onClick={handleSystemReset}
                disabled={isResetting}
                className="w-full flex items-center justify-center py-3 px-4 border-2 border-dashed border-rose-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-rose-400 hover:bg-rose-50 hover:border-rose-200 transition-all disabled:opacity-50"
              >
                {isResetting ? 'Purging Context...' : 'System Restart (Reset All)'}
              </button>
            </div>
          </div>
          
          <p className="mt-10 text-center text-[10px] text-slate-400 font-medium leading-relaxed">
            By accessing BrandOS, you agree to our <a href="#" className="text-slate-600 font-bold hover:underline">User Agreement</a>, <a href="#" className="text-slate-600 font-bold hover:underline">Privacy Policy</a>, and <a href="#" className="text-slate-600 font-bold hover:underline">Enterprise Security Standards</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
