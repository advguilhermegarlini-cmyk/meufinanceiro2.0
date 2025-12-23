
import React, { useState, useRef } from 'react';
import { AppProvider, useApp } from './context';
import { Layout, Button, Card } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Transactions } from './components/Transactions';
import { CreditCardsModule, BanksModule, CategoriesModule, InvestmentsModule } from './components/FinanceModules';
import { AlertTriangle, ShieldCheck, User, Mail, Moon, Sun, LogOut, Save, HeartPulse, ChevronRight, Camera, Trash2, Settings, X, Lock, Key, Eye, EyeOff, Sparkles } from 'lucide-react';
import { SINOP_TIMEZONE } from './utils';
import { TEST_USER_EMAIL } from './services/api';

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex items-center justify-center bg-[#0d1117] text-white p-8 text-center">
            <div>
                <AlertTriangle size={48} className="mx-auto text-github-danger mb-4" />
                <h1 className="text-2xl font-bold mb-2">Algo deu errado.</h1>
                <p className="text-github-muted mb-4">Ocorreu um erro ao carregar o aplicativo.</p>
                <Button onClick={() => { localStorage.clear(); window.location.reload(); }} variant="danger">
                    Limpar Dados e Recarregar
                </Button>
            </div>
        </div>
      );
    }
    return (this as any).props.children;
  }
}

const ProfileModule = () => {
    const { user, updateUserProfile, uploadAvatar, theme, toggleTheme, logout, healthThresholds, updateHealthThresholds, changePassword, deleteAccount } = useApp();
    const [name, setName] = useState(user?.displayName || '');
    const [isSaving, setIsSaving] = useState(false);
    const [thresholds, setThresholds] = useState(healthThresholds);
    
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [isChangingPass, setIsChangingPass] = useState(false);
    const [showPassRaw, setShowPassRaw] = useState(false);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

    const avatarInputRef = useRef<HTMLInputElement>(null);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateUserProfile(name, SINOP_TIMEZONE);
            updateHealthThresholds(thresholds);
            alert("Perfil e configurações atualizados com sucesso!");
        } catch (e) {
            alert("Erro ao salvar configurações.");
        } finally {
            setIsSaving(false);
        }
    }

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                await uploadAvatar(file);
            } catch (err) {
                alert("Erro ao carregar imagem.");
            }
        }
    };

    const handlePasswordChangeSubmit = async () => {
        if (!passwords.current || !passwords.new || !passwords.confirm) {
            alert("Por favor, preencha todos os campos de senha.");
            return;
        }
        if (passwords.new !== passwords.confirm) {
            alert("A nova senha e a confirmação não coincidem.");
            return;
        }
        if (passwords.new.length < 4) {
            alert("A nova senha deve ter pelo menos 4 caracteres.");
            return;
        }
        
        setIsChangingPass(true);
        try {
            await changePassword(passwords.current, passwords.new);
            alert("Senha alterada com sucesso!");
            setShowPasswordChange(false);
            setPasswords({ current: '', new: '', confirm: '' });
        } catch (err: any) {
            alert(err.message || "Erro ao alterar senha. Verifique a senha atual.");
        } finally {
            setIsChangingPass(false);
        }
    };

    const handleDeleteAccount = async () => {
        const confirmationWord = "EXCLUIR MINHA CONTA";
        if (deleteConfirmationText.trim().toUpperCase() !== confirmationWord) {
            alert(`Para excluir, digite exatamente "${confirmationWord}"`);
            return;
        }
        
        if (window.confirm("ATENÇÃO: Esta ação é permanente. Todos os seus dados, transações, bancos e investimentos serão apagados sem possibilidade de recuperação. Deseja continuar?")) {
            try {
                await deleteAccount();
            } catch (err) {
                alert("Erro ao excluir conta.");
            }
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center justify-between px-2">
                <h2 className="text-3xl font-black text-github-text tracking-tighter">Perfil e Configurações</h2>
                <span className="px-3 py-1 bg-github-primary/10 text-github-primary border border-github-primary/20 rounded-full text-[10px] font-black uppercase tracking-wider">
                    ID: {user?.id.slice(0, 8)}
                </span>
            </div>
            
            <form onSubmit={handleSave} className="space-y-6">
                <Card className="p-8 border-github-border">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                            <div className="w-24 h-24 rounded-2xl bg-github-surface border-2 border-github-primary flex items-center justify-center overflow-hidden shadow-xl transition-transform group-hover:scale-105">
                                {user?.photoURL ? (
                                    <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-4xl font-black text-github-primary uppercase">{user?.displayName?.[0]}</span>
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                    <Camera size={24} />
                                </div>
                            </div>
                            <input 
                                type="file" 
                                ref={avatarInputRef} 
                                className="hidden" 
                                accept="image/*" 
                                onChange={handleAvatarUpload} 
                            />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h3 className="text-xl font-bold text-github-text mb-1">{user?.displayName}</h3>
                            <p className="text-sm text-github-muted">{user?.email}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 mt-8 border-t border-github-border/50">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-github-muted uppercase tracking-widest flex items-center gap-2">
                                <User size={12} /> Nome de Exibição
                            </label>
                            <input 
                                className="w-full bg-github-bg border border-github-border rounded-xl px-4 py-3 text-github-text outline-none focus:border-github-primary transition-all font-bold shadow-inner"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-github-muted uppercase tracking-widest flex items-center gap-2">
                                <Mail size={12} /> Email (Não alterável)
                            </label>
                            <input 
                                className="w-full bg-github-surface border border-github-border rounded-xl px-4 py-3 text-github-muted outline-none cursor-not-allowed font-medium opacity-60"
                                value={user?.email || ''}
                                disabled
                            />
                        </div>
                    </div>
                </Card>

                <Card className="p-8 border-github-border relative overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-github-warning/10 text-github-warning rounded-xl border border-github-warning/20">
                                <Lock size={22} />
                            </div>
                            <div>
                                <h4 className="font-bold text-github-text">Segurança e Senha</h4>
                                <p className="text-xs text-github-muted">Mantenha sua conta protegida</p>
                            </div>
                        </div>
                        <Button onClick={() => setShowPasswordChange(!showPasswordChange)} variant="secondary" className="text-xs px-4">
                           {showPasswordChange ? 'Cancelar' : 'Alterar Senha'}
                        </Button>
                    </div>

                    {showPasswordChange && (
                        <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2 relative">
                                    <label className="text-[10px] font-black text-github-muted uppercase tracking-widest">Senha Atual</label>
                                    <input 
                                        type={showPassRaw ? "text" : "password"}
                                        className="w-full bg-github-bg border border-github-border rounded-xl px-4 py-3 text-github-text focus:border-github-primary outline-none"
                                        value={passwords.current}
                                        onChange={e => setPasswords({...passwords, current: e.target.value})}
                                    />
                                    <button type="button" onClick={() => setShowPassRaw(!showPassRaw)} className="absolute right-3 bottom-3.5 text-github-muted">
                                        {showPassRaw ? <EyeOff size={16}/> : <Eye size={16}/>}
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-github-muted uppercase tracking-widest">Nova Senha</label>
                                    <input 
                                        type={showPassRaw ? "text" : "password"}
                                        className="w-full bg-github-bg border border-github-border rounded-xl px-4 py-3 text-github-text focus:border-github-primary outline-none"
                                        value={passwords.new}
                                        onChange={e => setPasswords({...passwords, new: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-github-muted uppercase tracking-widest">Confirmar Nova Senha</label>
                                    <input 
                                        type={showPassRaw ? "text" : "password"}
                                        className="w-full bg-github-bg border border-github-border rounded-xl px-4 py-3 text-github-text focus:border-github-primary outline-none"
                                        value={passwords.confirm}
                                        onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={() => handlePasswordChangeSubmit()} variant="primary" className="px-6 py-3 rounded-xl flex items-center gap-2" disabled={isChangingPass}>
                                    <Key size={16} /> {isChangingPass ? 'Atualizando...' : 'Confirmar Alteração'}
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>

                <Card className="p-8 border-github-border">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 bg-github-primary/10 text-github-primary rounded-xl border border-github-primary/20">
                            <HeartPulse size={22} />
                        </div>
                        <div>
                            <h4 className="font-bold text-github-text">Limites de Saúde Financeira</h4>
                            <p className="text-xs text-github-muted">Configure as cores do seu dashboard</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { key: 'critical', label: 'Crítico', color: 'text-github-danger' },
                            { key: 'attention', label: 'Atenção', color: 'text-github-warning' },
                            { key: 'moderate', label: 'Moderado', color: 'text-github-primary' },
                            { key: 'good', label: 'Bom', color: 'text-github-success' },
                        ].map(item => (
                            <div key={item.key} className="space-y-1">
                                <label className={`text-[10px] font-black uppercase tracking-widest ${item.color}`}>{item.label}</label>
                                <input 
                                    type="number"
                                    className="w-full bg-github-bg border border-github-border rounded-lg px-3 py-2 text-github-text text-sm font-mono font-bold outline-none"
                                    value={thresholds[item.key as keyof typeof thresholds]}
                                    onChange={e => setThresholds({...thresholds, [item.key]: parseFloat(e.target.value)})}
                                />
                            </div>
                        ))}
                    </div>
                </Card>

                <div className="flex justify-end gap-3 px-2">
                    <Button type="submit" variant="primary" className="py-3 px-10 rounded-xl shadow-lg shadow-github-success/10" disabled={isSaving}>
                        <Save size={18} className="mr-2 inline" /> {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                </div>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-5 cursor-pointer hover:border-github-primary transition-all group border-github-border" onClick={toggleTheme}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-github-surface rounded-xl text-github-primary border border-github-border group-hover:bg-github-primary/10 transition-colors">
                                {theme === 'dark' ? <Moon size={22} /> : <Sun size={22} />}
                            </div>
                            <div>
                                <h4 className="font-bold text-github-text">Aparência</h4>
                                <p className="text-xs text-github-muted">Ativar modo {theme === 'dark' ? 'Claro' : 'Escuro'}</p>
                            </div>
                        </div>
                        <ChevronRight className="text-github-muted group-hover:text-github-primary transition-colors" size={20} />
                    </div>
                </Card>

                <Card className="p-5 cursor-pointer hover:border-github-danger transition-all group border-github-border" onClick={logout}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-github-danger/5 rounded-xl text-github-danger border border-github-danger/10 group-hover:bg-github-danger/10 transition-colors">
                                <LogOut size={22} />
                            </div>
                            <div>
                                <h4 className="font-bold text-github-text">Logout</h4>
                                <p className="text-xs text-github-muted">Sair do aplicativo</p>
                            </div>
                        </div>
                        <ChevronRight className="text-github-muted group-hover:text-github-danger transition-colors" size={20} />
                    </div>
                </Card>
            </div>

            <Card className="p-8 border-github-danger/30 border-dashed bg-github-danger/5">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-github-danger/10 text-github-danger rounded-xl">
                            <Trash2 size={22} />
                        </div>
                        <div>
                            <h4 className="font-bold text-github-danger uppercase tracking-tighter">Zona de Perigo</h4>
                            <p className="text-xs text-github-muted">Gerencie a exclusão da sua conta</p>
                        </div>
                    </div>
                    {!showDeleteConfirm && (
                        <Button onClick={() => setShowDeleteConfirm(true)} variant="danger" className="text-xs px-4">
                            Excluir Minha Conta
                        </Button>
                    )}
                </div>

                {showDeleteConfirm && (
                    <div className="space-y-5 animate-in slide-in-from-top-2 duration-300">
                        <div className="p-4 bg-github-danger/10 border border-github-danger/20 rounded-xl">
                            <p className="text-xs text-github-text font-medium flex items-center gap-2">
                                <AlertTriangle size={14} className="text-github-danger"/>
                                Todos os seus dados serão apagados permanentemente. Esta ação não pode ser desfeita.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-xs text-github-muted font-bold uppercase tracking-wider">
                                Digite <span className="text-github-danger">EXCLUIR MINHA CONTA</span> para confirmar:
                            </p>
                            <div className="flex flex-col md:flex-row gap-3">
                                <input 
                                    className="flex-1 bg-github-bg border border-github-danger rounded-xl px-4 py-3 text-github-text focus:ring-1 focus:ring-github-danger outline-none font-bold"
                                    value={deleteConfirmationText}
                                    onChange={e => setDeleteConfirmationText(e.target.value)}
                                    placeholder="Confirmação de segurança"
                                />
                                <div className="flex gap-2">
                                    <Button onClick={() => setShowDeleteConfirm(false)} variant="secondary" className="px-4">Cancelar</Button>
                                    <Button 
                                        onClick={handleDeleteAccount} 
                                        variant="danger" 
                                        className="px-6 py-3 shadow-xl shadow-github-danger/10"
                                        disabled={deleteConfirmationText.trim().toUpperCase() !== 'EXCLUIR MINHA CONTA'}
                                    >
                                        Excluir Permanentemente
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}

const AuthScreen = () => {
  const { login, register } = useApp();
  const [view, setView] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    try {
        if (view === 'login') await login(email, password);
        else await register(name, email, password);
    } catch (err) {
        alert(err instanceof Error ? err.message : "Ocorreu um erro inesperado.");
    } finally {
        setLoading(false);
    }
  };

  const handleDemoMode = async () => {
      setEmail(TEST_USER_EMAIL);
      setPassword('123');
      setLoading(true);
      try {
          await login(TEST_USER_EMAIL, '123');
      } catch (err) {
          alert("Erro ao entrar no modo demo.");
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#161b22] border border-[#30363d] rounded-[2.5rem] p-10 shadow-2xl animate-in fade-in zoom-in-95 duration-700">
        <div className="flex justify-center mb-8 text-github-primary">
          <ShieldCheck size={64} strokeWidth={1.5} className="animate-pulse" />
        </div>
        <h1 className="text-3xl font-black text-center text-white mb-8 tracking-tighter">Meu Financeiro</h1>
        
        <div className="flex bg-github-bg border border-github-border rounded-2xl p-1 mb-8">
          <button className={`flex-1 py-3 text-sm font-black uppercase rounded-xl transition-all ${view === 'login' ? 'bg-github-primary text-github-bg shadow-lg' : 'text-github-muted'}`} onClick={() => setView('login')}>Entrar</button>
          <button className={`flex-1 py-3 text-sm font-black uppercase rounded-xl transition-all ${view === 'register' ? 'bg-github-primary text-github-bg shadow-lg' : 'text-github-muted'}`} onClick={() => setView('register')}>Cadastrar</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {view === 'register' && (
            <input type="text" required className="w-full bg-[#0d1117] border border-[#30363d] rounded-2xl px-5 py-4 text-white outline-none focus:border-github-primary font-bold shadow-inner" placeholder="Seu Nome Completo" value={name} onChange={(e) => setName(e.target.value)} />
          )}
          <input type="email" required className="w-full bg-[#0d1117] border border-[#30363d] rounded-2xl px-5 py-4 text-white outline-none focus:border-github-primary font-bold shadow-inner" placeholder="Endereço de Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" required className="w-full bg-[#0d1117] border border-[#30363d] rounded-2xl px-5 py-4 text-white outline-none focus:border-github-primary font-bold shadow-inner" placeholder="Sua Senha" value={password} onChange={(e) => setPassword(e.target.value)} />
          
          <button type="submit" disabled={loading} className="w-full bg-github-primary text-github-bg font-black py-4 px-4 rounded-2xl transition-all hover:brightness-110 active:scale-95 text-lg shadow-xl shadow-github-primary/20 mt-4">
            {loading ? 'Validando...' : (view === 'login' ? 'Acessar Conta' : 'Finalizar Cadastro')}
          </button>
        </form>

        {view === 'login' && (
            <div className="mt-8 pt-8 border-t border-github-border/50">
                <button 
                    onClick={handleDemoMode}
                    className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-github-bg border border-github-primary/30 text-github-primary rounded-2xl font-black uppercase text-xs hover:bg-github-primary/10 transition-all active:scale-95"
                >
                    <Sparkles size={16} /> Acessar Modo de Demonstração
                </button>
                <p className="text-[10px] text-github-muted text-center mt-4 font-bold uppercase tracking-widest leading-relaxed">
                    Explore o aplicativo com dados pré-lançados <br/> de contas, cartões e investimentos.
                </p>
            </div>
        )}
      </div>
    </div>
  );
};

const MainApp = () => {
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!user) return <AuthScreen />;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'transactions': return <Transactions />;
      case 'credit': return <CreditCardsModule />;
      case 'investments': return <InvestmentsModule />;
      case 'banks': return <BanksModule />;
      case 'categories': return <CategoriesModule />;
      case 'profile': return <ProfileModule />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
        <AppProvider>
            <MainApp />
        </AppProvider>
    </ErrorBoundary>
  );
}
