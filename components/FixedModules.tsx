import React, { useState } from 'react';
import { useApp } from '../context';
import { Card, Button } from './Layout';
import { formatCurrency } from '../utils';
import { Plus, Trash2, Pencil, CheckCircle, Clock } from 'lucide-react';
import { FixedIncome, FixedExpense } from '../types';

const Modal: React.FC<{ isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[110] p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <Card className="w-full max-w-md p-8 border-github-border shadow-2xl animate-in zoom-in-95 duration-200 rounded-3xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-github-text uppercase tracking-tighter">{title}</h3>
                    <button onClick={onClose} className="p-2 text-github-muted hover:text-github-text bg-github-bg rounded-xl">
                        <div className="w-6 h-6 flex items-center justify-center">×</div>
                    </button>
                </div>
                {children}
            </Card>
        </div>
    );
};

export const FixedIncomesModule = () => {
    const { fixedIncomes, categories, addFixedIncome, updateFixedIncome, deleteFixedIncome, launchFixedIncome, banks } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<FixedIncome | null>(null);
    const [formData, setFormData] = useState({ description: '', categoryId: '', predictedValue: '' });
    
    // Modal de lançamento
    const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
    const [launchingItem, setLaunchingItem] = useState<FixedIncome | null>(null);
    const [launchData, setLaunchData] = useState({ bankId: '', date: new Date().toISOString().split('T')[0] });
    const [isLaunching, setIsLaunching] = useState(false);

    const currentMonth = new Date().toISOString().slice(0, 7);

    const openLaunchModal = (item: FixedIncome) => {
        setLaunchingItem(item);
        setLaunchData({ 
            bankId: banks.find(b => b.type !== 'credit')?.id || '', 
            date: new Date().toISOString().split('T')[0] 
        });
        setIsLaunchModalOpen(true);
    };

    const handleLaunch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLaunching || !launchingItem || !launchData.bankId) return;

        setIsLaunching(true);
        try {
            await launchFixedIncome(launchingItem.id, launchingItem.predictedValue, launchData.date, launchData.bankId);
            setIsLaunchModalOpen(false);
            setLaunchingItem(null);
        } catch (error) {
            console.error('Erro ao lançar entrada fixa:', error);
            alert(error instanceof Error ? error.message : 'Erro ao lançar entrada fixa. Tente novamente.');
        } finally {
            setIsLaunching(false);
        }
    };

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingItem) {
            updateFixedIncome({ ...editingItem, ...formData, predictedValue: parseFloat(formData.predictedValue) });
        } else {
            addFixedIncome({
                description: formData.description,
                categoryId: formData.categoryId,
                predictedValue: parseFloat(formData.predictedValue),
                launchedMonths: [],
                isActive: true
            });
        }
        setIsModalOpen(false);
        setEditingItem(null);
        setFormData({ description: '', categoryId: '', predictedValue: '' });
    };

    const openEdit = (item: FixedIncome) => {
        setEditingItem(item);
        setFormData({
            description: item.description,
            categoryId: item.categoryId,
            predictedValue: item.predictedValue.toString()
        });
        setIsModalOpen(true);
    };

    const incomeCategories = categories.filter(c => c.type === 'income');

    return (
        <div className="space-y-6 md:space-y-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-github-text tracking-tighter uppercase">Entradas Fixas</h2>
                    <p className="text-xs md:text-sm text-github-muted">Previsão de receitas recorrentes mensais</p>
                </div>
                <Button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="px-4 md:px-6 py-3 rounded-2xl text-xs md:text-sm whitespace-nowrap">
                    <Plus size={14} className="md:hidden" /><Plus size={18} className="hidden md:block" /> <span className="hidden sm:inline">Nova</span><span className="sm:hidden">+</span>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fixedIncomes.filter(f => f.isActive).map(item => {
                    const cat = categories.find(c => c.id === item.categoryId);
                    const isLaunched = item.launchedMonths.includes(currentMonth);
                    return (
                        <Card key={item.id} className="p-4 md:p-6 border-l-4 md:border-l-8 hover:shadow-lg transition-all" style={{ borderLeftColor: cat?.color || '#58a6ff' }}>
                            <div className="flex justify-between items-start gap-2 md:gap-4 mb-3 md:mb-4">
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-sm md:text-lg font-bold text-github-text truncate">{item.description}</h3>
                                    <p className="text-xs md:text-sm text-github-muted truncate">{cat?.name || 'Categoria'}</p>
                                </div>
                                <div className="flex gap-1 flex-shrink-0">
                                    <button onClick={() => openEdit(item)} className="p-1.5 md:p-2 text-github-muted hover:text-github-primary transition-colors">
                                        <Pencil size={14} className="md:hidden" /><Pencil size={16} className="hidden md:block" />
                                    </button>
                                    <button onClick={() => { if(window.confirm('Excluir entrada fixa?')) deleteFixedIncome(item.id); }} className="p-1.5 md:p-2 text-github-muted hover:text-github-danger transition-colors">
                                        <Trash2 size={14} className="md:hidden" /><Trash2 size={16} className="hidden md:block" />
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-github-muted">Valor Previsto</p>
                                <p className="text-2xl font-mono font-black text-github-success">{formatCurrency(item.predictedValue)}</p>
                                {isLaunched ? (
                                    <div className="flex items-center gap-2 text-github-success">
                                        <CheckCircle size={16} />
                                        <span className="text-sm font-bold">Lançado este mês</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-github-muted">
                                            <Clock size={16} />
                                            <span className="text-sm">Pendente</span>
                                        </div>
                                        <button
                                            onClick={() => openLaunchModal(item)}
                                            className="px-3 py-1.5 bg-github-success/10 text-github-success border border-github-success/20 rounded-lg text-xs font-bold hover:bg-github-success/20 transition-colors"
                                        >
                                            Lançar
                                        </button>
                                    </div>
                                )}
                            </div>
                        </Card>
                    );
                })}
                {fixedIncomes.filter(f => f.isActive).length === 0 && (
                    <Card className="col-span-full p-12 text-center border-dashed border-2 border-github-border">
                        <Plus size={48} className="mx-auto mb-4 text-github-muted opacity-30" />
                        <h3 className="text-xl font-bold text-github-text mb-2">Nenhuma entrada fixa cadastrada</h3>
                        <p className="text-sm text-github-muted mb-6">Cadastre suas receitas recorrentes para melhor planejamento.</p>
                        <Button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="mx-auto">Cadastrar Primeira Entrada</Button>
                    </Card>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Editar Entrada Fixa" : "Nova Entrada Fixa"}>
                <form onSubmit={handleAdd} className="space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-github-muted px-1">Descrição</label>
                        <input required className="w-full bg-github-bg border border-github-border rounded-2xl px-5 py-4 text-github-text outline-none focus:border-github-primary font-bold shadow-inner" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Ex: Salário, Freelance..." />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-github-muted px-1">Categoria</label>
                        <select required className="w-full bg-github-bg border border-github-border rounded-2xl px-5 py-4 text-github-text outline-none focus:border-github-primary appearance-none font-bold" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})}>
                            <option value="">Selecione...</option>
                            {incomeCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-github-muted px-1">Valor Previsto (R$)</label>
                        <input required type="number" step="0.01" className="w-full bg-github-bg border border-github-border rounded-2xl px-5 py-4 text-github-text outline-none focus:border-github-primary font-mono text-xl font-black shadow-inner" value={formData.predictedValue} onChange={e => setFormData({...formData, predictedValue: e.target.value})} placeholder="0,00" />
                    </div>
                    <Button type="submit" variant="primary" className="w-full py-5 text-lg shadow-xl shadow-github-success/10">
                        {editingItem ? "Salvar Alterações" : "Cadastrar Entrada"}
                    </Button>
                </form>
            </Modal>

            {/* Modal de Lançamento */}
            <Modal isOpen={isLaunchModalOpen} onClose={() => setIsLaunchModalOpen(false)} title="Lançar Entrada Fixa">
                <form onSubmit={handleLaunch} className="space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-github-muted px-1">Conta Bancária</label>
                        <select 
                            required 
                            className="w-full bg-github-bg border border-github-border rounded-2xl px-5 py-4 text-github-text outline-none focus:border-github-primary appearance-none font-bold" 
                            value={launchData.bankId} 
                            onChange={e => setLaunchData({...launchData, bankId: e.target.value})}
                        >
                            <option value="">Selecione uma conta...</option>
                            {banks.filter(b => b.type !== 'credit').map(bank => (
                                <option key={bank.id} value={bank.id}>{bank.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-github-muted px-1">Data do Lançamento</label>
                        <input 
                            required 
                            type="date" 
                            className="w-full bg-github-bg border border-github-border rounded-2xl px-5 py-4 text-github-text outline-none focus:border-github-primary font-bold shadow-inner" 
                            value={launchData.date} 
                            onChange={e => setLaunchData({...launchData, date: e.target.value})} 
                        />
                    </div>
                    {launchingItem && (
                        <div className="p-4 bg-github-success/10 border border-github-success/20 rounded-2xl">
                            <p className="text-sm font-bold text-github-success mb-2">Resumo do Lançamento</p>
                            <p className="text-xs text-github-muted">{launchingItem.description}</p>
                            <p className="text-lg font-mono font-bold text-github-success mt-1">
                                +{formatCurrency(launchingItem.predictedValue)}
                            </p>
                        </div>
                    )}
                    <Button type="submit" variant="primary" className="w-full py-5 text-lg shadow-xl shadow-github-success/10" disabled={isLaunching}>
                        {isLaunching ? 'Lançando...' : 'Confirmar Lançamento'}
                    </Button>
                </form>
            </Modal>
        </div>
    );
};

export const FixedExpensesModule = () => {
    const { fixedExpenses, categories, addFixedExpense, updateFixedExpense, deleteFixedExpense, launchFixedExpense, banks } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<FixedExpense | null>(null);
    const [formData, setFormData] = useState({ description: '', categoryId: '', predictedValue: '' });
    
    // Modal de lançamento
    const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
    const [launchingItem, setLaunchingItem] = useState<FixedExpense | null>(null);
    const [launchData, setLaunchData] = useState({ bankId: '', date: new Date().toISOString().split('T')[0] });
    const [isLaunching, setIsLaunching] = useState(false);

    const currentMonth = new Date().toISOString().slice(0, 7);

    const openLaunchModal = (item: FixedExpense) => {
        setLaunchingItem(item);
        setLaunchData({ 
            bankId: banks.find(b => b.type !== 'credit')?.id || '', 
            date: new Date().toISOString().split('T')[0] 
        });
        setIsLaunchModalOpen(true);
    };

    const handleLaunch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLaunching || !launchingItem || !launchData.bankId) return;

        setIsLaunching(true);
        try {
            await launchFixedExpense(launchingItem.id, launchingItem.predictedValue, launchData.date, launchData.bankId);
            setIsLaunchModalOpen(false);
            setLaunchingItem(null);
        } catch (error) {
            console.error('Erro ao lançar despesa fixa:', error);
            alert(error instanceof Error ? error.message : 'Erro ao lançar despesa fixa. Tente novamente.');
        } finally {
            setIsLaunching(false);
        }
    };

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingItem) {
            updateFixedExpense({ ...editingItem, ...formData, predictedValue: parseFloat(formData.predictedValue) });
        } else {
            addFixedExpense({
                description: formData.description,
                categoryId: formData.categoryId,
                predictedValue: parseFloat(formData.predictedValue),
                launchedMonths: [],
                isActive: true
            });
        }
        setIsModalOpen(false);
        setEditingItem(null);
        setFormData({ description: '', categoryId: '', predictedValue: '' });
    };

    const openEdit = (item: FixedExpense) => {
        setEditingItem(item);
        setFormData({
            description: item.description,
            categoryId: item.categoryId,
            predictedValue: item.predictedValue.toString()
        });
        setIsModalOpen(true);
    };

    const expenseCategories = categories.filter(c => c.type === 'expense');

    return (
        <div className="space-y-6 md:space-y-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-github-text tracking-tighter uppercase">Saídas Fixas</h2>
                    <p className="text-xs md:text-sm text-github-muted">Previsão de despesas recorrentes mensais</p>
                </div>
                <Button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="px-4 md:px-6 py-3 rounded-2xl text-xs md:text-sm whitespace-nowrap">
                    <Plus size={14} className="md:hidden" /><Plus size={18} className="hidden md:block" /> <span className="hidden sm:inline">Nova</span><span className="sm:hidden">+</span>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fixedExpenses.filter(f => f.isActive).map(item => {
                    const cat = categories.find(c => c.id === item.categoryId);
                    const isLaunched = item.launchedMonths.includes(currentMonth);
                    return (
                        <Card key={item.id} className="p-4 md:p-6 border-l-4 md:border-l-8 hover:shadow-lg transition-all" style={{ borderLeftColor: cat?.color || '#f85149' }}>
                            <div className="flex justify-between items-start gap-2 md:gap-4 mb-3 md:mb-4">
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-sm md:text-lg font-bold text-github-text truncate">{item.description}</h3>
                                    <p className="text-xs md:text-sm text-github-muted truncate">{cat?.name || 'Categoria'}</p>
                                </div>
                                <div className="flex gap-1 flex-shrink-0">
                                    <button onClick={() => openEdit(item)} className="p-1.5 md:p-2 text-github-muted hover:text-github-primary transition-colors">
                                        <Pencil size={14} className="md:hidden" /><Pencil size={16} className="hidden md:block" />
                                    </button>
                                    <button onClick={() => { if(window.confirm('Excluir saída fixa?')) deleteFixedExpense(item.id); }} className="p-1.5 md:p-2 text-github-muted hover:text-github-danger transition-colors">
                                        <Trash2 size={14} className="md:hidden" /><Trash2 size={16} className="hidden md:block" />
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-github-muted">Valor Previsto</p>
                                <p className="text-2xl font-mono font-black text-github-danger">{formatCurrency(item.predictedValue)}</p>
                                {isLaunched ? (
                                    <div className="flex items-center gap-2 text-github-success">
                                        <CheckCircle size={16} />
                                        <span className="text-sm font-bold">Lançado este mês</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-github-muted">
                                            <Clock size={16} />
                                            <span className="text-sm">Pendente</span>
                                        </div>
                                        <button
                                            onClick={() => openLaunchModal(item)}
                                            className="px-3 py-1.5 bg-github-danger/10 text-github-danger border border-github-danger/20 rounded-lg text-xs font-bold hover:bg-github-danger/20 transition-colors"
                                        >
                                            Lançar
                                        </button>
                                    </div>
                                )}
                            </div>
                        </Card>
                    );
                })}
                {fixedExpenses.filter(f => f.isActive).length === 0 && (
                    <Card className="col-span-full p-12 text-center border-dashed border-2 border-github-border">
                        <Plus size={48} className="mx-auto mb-4 text-github-muted opacity-30" />
                        <h3 className="text-xl font-bold text-github-text mb-2">Nenhuma saída fixa cadastrada</h3>
                        <p className="text-sm text-github-muted mb-6">Cadastre suas despesas recorrentes para melhor planejamento.</p>
                        <Button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="mx-auto">Cadastrar Primeira Saída</Button>
                    </Card>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Editar Saída Fixa" : "Nova Saída Fixa"}>
                <form onSubmit={handleAdd} className="space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-github-muted px-1">Descrição</label>
                        <input required className="w-full bg-github-bg border border-github-border rounded-2xl px-5 py-4 text-github-text outline-none focus:border-github-primary font-bold shadow-inner" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Ex: Aluguel, Luz, Internet..." />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-github-muted px-1">Categoria</label>
                        <select required className="w-full bg-github-bg border border-github-border rounded-2xl px-5 py-4 text-github-text outline-none focus:border-github-primary appearance-none font-bold" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})}>
                            <option value="">Selecione...</option>
                            {expenseCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-github-muted px-1">Valor Previsto (R$)</label>
                        <input required type="number" step="0.01" className="w-full bg-github-bg border border-github-border rounded-2xl px-5 py-4 text-github-text outline-none focus:border-github-primary font-mono text-xl font-black shadow-inner" value={formData.predictedValue} onChange={e => setFormData({...formData, predictedValue: e.target.value})} placeholder="0,00" />
                    </div>
                    <Button type="submit" variant="primary" className="w-full py-5 text-lg shadow-xl shadow-github-success/10">
                        {editingItem ? "Salvar Alterações" : "Cadastrar Saída"}
                    </Button>
                </form>
            </Modal>

            {/* Modal de Lançamento */}
            <Modal isOpen={isLaunchModalOpen} onClose={() => setIsLaunchModalOpen(false)} title="Lançar Saída Fixa">
                <form onSubmit={handleLaunch} className="space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-github-muted px-1">Conta Bancária</label>
                        <select 
                            required 
                            className="w-full bg-github-bg border border-github-border rounded-2xl px-5 py-4 text-github-text outline-none focus:border-github-primary appearance-none font-bold" 
                            value={launchData.bankId} 
                            onChange={e => setLaunchData({...launchData, bankId: e.target.value})}
                        >
                            <option value="">Selecione uma conta...</option>
                            {banks.filter(b => b.type !== 'credit').map(bank => (
                                <option key={bank.id} value={bank.id}>{bank.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-github-muted px-1">Data do Lançamento</label>
                        <input 
                            required 
                            type="date" 
                            className="w-full bg-github-bg border border-github-border rounded-2xl px-5 py-4 text-github-text outline-none focus:border-github-primary font-bold shadow-inner" 
                            value={launchData.date} 
                            onChange={e => setLaunchData({...launchData, date: e.target.value})} 
                        />
                    </div>
                    {launchingItem && (
                        <div className="p-4 bg-github-danger/10 border border-github-danger/20 rounded-2xl">
                            <p className="text-sm font-bold text-github-danger mb-2">Resumo do Lançamento</p>
                            <p className="text-xs text-github-muted">{launchingItem.description}</p>
                            <p className="text-lg font-mono font-bold text-github-danger mt-1">
                                -{formatCurrency(launchingItem.predictedValue)}
                            </p>
                        </div>
                    )}
                    <Button type="submit" variant="primary" className="w-full py-5 text-lg shadow-xl shadow-github-success/10" disabled={isLaunching}>
                        {isLaunching ? 'Lançando...' : 'Confirmar Lançamento'}
                    </Button>
                </form>
            </Modal>
        </div>
    );
};