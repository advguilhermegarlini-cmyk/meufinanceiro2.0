
import React, { useState, useEffect } from 'react';
import { useApp } from '../context';
import { 
  LayoutDashboard, 
  Receipt, 
  CreditCard, 
  Wallet, 
  User as UserIcon, 
  LogOut, 
  TrendingUp,
  Tags,
  Plus,
  Sun,
  Moon,
  ArrowUpCircle,
  ArrowDownCircle
} from 'lucide-react';
import { SINOP_TIMEZONE } from '../utils';
import { TransactionFormModal } from './TransactionFormModal';
import logoImg from '../logo/logo.png';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={`bg-github-surface border border-github-border rounded-2xl shadow-sm transition-all ${className}`} {...props}>
    {children}
  </div>
);

export const Button = ({ 
  children, 
  variant = 'primary', 
  onClick, 
  className = '',
  type = 'button',
  disabled = false
}: { 
  children?: React.ReactNode, 
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost', 
  onClick?: () => void,
  className?: string,
  type?: 'button' | 'submit',
  disabled?: boolean
}) => {
  const base = "px-5 py-2.5 rounded-xl font-bold text-sm transition-all focus:outline-none active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-github-success text-white hover:brightness-110 shadow-md shadow-github-success/10",
    secondary: "bg-github-surface text-github-text border border-github-border hover:bg-github-bg",
    danger: "bg-github-danger/10 text-github-danger border border-github-danger/20 hover:bg-github-danger hover:text-white",
    ghost: "bg-transparent text-github-primary hover:underline px-0 py-0"
  };

  return (
    <button type={type} onClick={onClick} className={`${base} ${variants[variant]} ${className}`} disabled={disabled}>
      {children}
    </button>
  );
};

export const Layout = ({ children, activeTab, setActiveTab }: { 
  children?: React.ReactNode, 
  activeTab: string, 
  setActiveTab: (t: string) => void 
}) => {
  const { user, logout, theme, toggleTheme, isTransactionModalOpen, setTransactionModalOpen, editingTransaction, setEditingTransaction } = useApp();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const tabs = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { id: 'transactions', label: 'Extrato', icon: Receipt },
    { id: 'fixed-incomes', label: 'Entradas Fixas', icon: ArrowUpCircle },
    { id: 'fixed-expenses', label: 'Saídas Fixas', icon: ArrowDownCircle },
    { id: 'credit', label: 'Cartões', icon: CreditCard },
    { id: 'banks', label: 'Contas', icon: Wallet },
    { id: 'categories', label: 'Categorias', icon: Tags },
    { id: 'investments', label: 'Investir', icon: TrendingUp },
    { id: 'profile', label: 'Perfil', icon: UserIcon },
  ];

  const timeString = currentTime.toLocaleTimeString('pt-BR', { timeZone: SINOP_TIMEZONE, hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex flex-col md:flex-row h-screen bg-github-bg text-github-text overflow-hidden">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-72 border-r border-github-border bg-github-surface/50 backdrop-blur-xl">
        <div className="p-8 flex items-center gap-4">
          <div className="h-12 w-12 flex-shrink-0">
            <img src={logoImg} alt="Logo" className="h-full w-full object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-github-primary mb-1">Meu Financeiro</h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-github-muted">{SINOP_TIMEZONE} • {timeString}</p>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all group ${
                activeTab === tab.id 
                  ? 'bg-github-primary text-github-bg font-black shadow-lg shadow-github-primary/20' 
                  : 'text-github-muted hover:text-github-text hover:bg-github-surface'
              }`}
            >
              <tab.icon size={20} />
              <span className="text-sm">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-github-border space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-xl bg-github-primary/10 border border-github-primary/20 flex items-center justify-center overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-github-primary font-black">{user?.displayName?.[0]}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{user?.displayName}</p>
              <button onClick={toggleTheme} className="text-[10px] font-black uppercase text-github-primary flex items-center gap-1">
                {theme === 'dark' ? <Sun size={10} /> : <Moon size={10} />} Tema
              </button>
            </div>
          </div>
          <Button onClick={logout} variant="danger" className="w-full text-xs py-2">
            <LogOut size={14} /> Sair
          </Button>
        </div>
      </aside>

      {/* Header Mobile */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 border-b border-github-border bg-github-surface/80 backdrop-blur-md z-40">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8">
            <img src={logoImg} alt="Logo" className="h-full w-full object-contain" />
          </div>
          <h1 className="text-xl font-black tracking-tighter text-github-primary">Financeiro</h1>
        </div>
        <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="p-2 text-github-muted">
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="w-8 h-8 rounded-lg bg-github-primary/10 flex items-center justify-center border border-github-primary/20 overflow-hidden">
                {user?.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : <span className="text-xs font-black">{user?.displayName?.[0]}</span>}
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-32 md:pb-0 px-4 py-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom Nav - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-github-surface/90 backdrop-blur-xl border-t border-github-border flex items-center justify-around px-1 pb-safe z-50 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-0.5 px-2.5 py-2.5 rounded-xl transition-all min-w-[60px] ${
              activeTab === tab.id ? 'text-github-primary' : 'text-github-muted'
            }`}
          >
            <tab.icon size={18} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
            <span className="text-[8px] font-black uppercase tracking-tighter text-center leading-tight">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Floating Add Button Mobile */}
      <button
        onClick={() => setTransactionModalOpen(true)}
        className="md:hidden fixed bottom-24 right-4 w-14 h-14 bg-github-success text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 border-4 border-github-bg"
      >
        <Plus size={28} />
      </button>

      {/* Floating Add Button Desktop */}
      <button
        onClick={() => setTransactionModalOpen(true)}
        className="hidden md:flex fixed bottom-8 right-8 w-16 h-16 bg-github-success text-white rounded-2xl shadow-2xl items-center justify-center hover:scale-110 active:scale-95 transition-all z-[150] border-4 border-github-bg"
      >
        <Plus size={32} />
      </button>

      <TransactionFormModal isOpen={isTransactionModalOpen} onClose={() => { setTransactionModalOpen(false); setEditingTransaction(null); }} editingTransaction={editingTransaction} />
    </div>
  );
};
