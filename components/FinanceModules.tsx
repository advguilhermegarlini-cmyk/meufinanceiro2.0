
import React, { useState } from 'react';
import { useApp, SYSTEM_CATEGORY_ID } from '../context';
import { Card, Button } from './Layout';
import { formatCurrency, GITHUB_COLORS, sortByNameIgnoreAccents, roundToTwoDecimals } from '../utils';
import { 
  Wallet, Plus, Trash2, Pencil, Calendar, TrendingUp, 
  ChevronLeft, ChevronRight, CheckCircle, AlertCircle, Clock, 
  CreditCard, Lock, RotateCcw, Monitor, Tag, X, PiggyBank,
  ArrowUpCircle, ArrowDownCircle, Info, Undo2, ArrowRight, Percent, Edit2
} from 'lucide-react';
import { Bank, Category, Investment, Subscription } from '../types';
import { CreditCardFormModal } from './CreditCardFormModal';

const Modal: React.FC<{ isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[110] p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <Card className="w-full max-md:mt-auto max-w-md p-8 border-github-border shadow-2xl animate-in zoom-in-95 duration-200 rounded-3xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-github-text uppercase tracking-tighter">{title}</h3>
                    <button onClick={onClose} className="p-2 text-github-muted hover:text-github-text bg-github-bg rounded-xl">
                        <X size={20} />
                    </button>
                </div>
                {children}
            </Card>
        </div>
    );
};

const InvoiceCard: React.FC<{ card: Bank }> = ({ card }) => {
    const { deleteBank, getInvoiceStats, reopenInvoice, categories, chargebackTransaction, subscriptions, addSubscription, deleteSubscription, payInvoice, banks } = useApp();
    const [viewDate, setViewDate] = useState(new Date());
    const [showSubs, setShowSubs] = useState(false);
    const [isAddingSub, setIsAddingSub] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isPayingInvoice, setIsPayingInvoice] = useState(false);
    const [isReopeningInvoice, setIsReopeningInvoice] = useState(false);
    const [paymentData, setPaymentData] = useState({
        amount: 0,
        sourceBankId: '',
        paymentDate: new Date().toISOString().split('T')[0]
    });
    
    const [subForm, setSubForm] = useState({
        name: '',
        amount: '',
        billingDay: 1,
        categoryId: ''
    });

    const stats = getInvoiceStats(card.id, viewDate);
    const cardSubs = subscriptions.filter(s => s.bankId === card.id);
    
    const statusConfig = {
        open: { label: 'Aberta', color: 'text-github-primary', bg: 'bg-github-primary/10', icon: Clock },
        closed: { label: 'Fechada', color: 'text-github-warning', bg: 'bg-github-warning/10', icon: Lock },
        paid: { label: 'Paga', color: 'text-github-success', bg: 'bg-github-success/10', icon: CheckCircle },
        partial: { label: 'Parcial', color: 'text-github-warning', bg: 'bg-github-warning/10', icon: RotateCcw },
        overdue: { label: 'Vencida', color: 'text-github-danger', bg: 'bg-github-danger/10', icon: AlertCircle },
        future: { label: 'Futura', color: 'text-github-muted', bg: 'bg-github-surface', icon: Calendar }
    };

    const currentStatus = statusConfig[stats.status as keyof typeof statusConfig] || statusConfig.open;

    const handleAddSub = (e: React.FormEvent) => {
        e.preventDefault();
        addSubscription({
            bankId: card.id,
            name: subForm.name,
            amount: parseFloat(subForm.amount),
            billingDay: subForm.billingDay,
            categoryId: subForm.categoryId,
            isActive: true
        });
        setIsAddingSub(false);
        setSubForm({ name: '', amount: '', billingDay: 1, categoryId: '' });
    };

    const handlePayInvoice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentData.sourceBankId) {
            alert('Selecione a conta de origem');
            return;
        }
        const amountToPay = roundToTwoDecimals(paymentData.amount || roundToTwoDecimals(stats.total - stats.paidAmount));
        const isFullPayment = Math.abs(amountToPay - roundToTwoDecimals(stats.total - stats.paidAmount)) < 0.01; // Comparação com tolerância para ponto flutuante
        try {
            await payInvoice(card.id, amountToPay, new Date(paymentData.paymentDate), paymentData.sourceBankId, stats.referenceMonth, isFullPayment);
            setIsPayingInvoice(false);
            setPaymentData({ amount: 0, sourceBankId: '', paymentDate: new Date().toISOString().split('T')[0] });
        } catch (error) {
            console.error('Erro ao pagar fatura:', error);
            alert(error instanceof Error ? error.message : 'Erro ao pagar fatura. Tente novamente.');
        }
    };

    const handleReopenInvoice = async () => {
        if (isReopeningInvoice) return;
        if (!window.confirm('Deseja reabrir esta fatura? Os pagamentos serão removidos.')) return;
        
        setIsReopeningInvoice(true);
        try {
            await reopenInvoice(card.id, stats.referenceMonth);
        } catch (error) {
            console.error('Erro ao reabrir fatura:', error);
            alert(error instanceof Error ? error.message : 'Erro ao reabrir fatura. Tente novamente.');
        } finally {
            setIsReopeningInvoice(false);
        }
    };

    const handleChargeback = async (t: any) => {
        if (window.confirm(`Deseja estornar "${t.description}"? Um crédito no valor de ${formatCurrency(t.amount)} será adicionado a esta fatura.`)) {
            await chargebackTransaction(t);
        }
    };

    return (
        <Card className="flex flex-col h-full overflow-hidden border-github-border bg-gradient-to-br from-github-surface to-github-bg shadow-lg hover:shadow-xl transition-shadow" style={{ borderTop: `6px solid ${card.color}` }}>
            <div className="p-6 border-b border-github-border flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: card.color }}>
                        <CreditCard size={24} />
                    </div>
                    <div>
                        <h3 className="font-black text-github-text leading-tight">{card.name}</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-github-muted">Limite: {formatCurrency(card.limit || 0)}</p>
                    </div>
                </div>
                <div className="flex gap-1">
                    <button onClick={() => setIsEditing(true)} className="p-2 text-github-muted hover:text-github-primary transition-colors">
                        <Pencil size={18} />
                    </button>
                    <button onClick={() => setShowSubs(!showSubs)} className={`p-2 rounded-xl transition-all ${showSubs ? 'bg-github-primary text-github-bg' : 'text-github-muted hover:bg-github-bg'}`}>
                        <Monitor size={18}/>
                    </button>
                    <button onClick={() => { if(window.confirm('Excluir este cartão? Todos os lançamentos devem ser apagados primeiro.')) deleteBank(card.id); }} className="p-2 text-github-muted hover:text-github-danger transition-colors">
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            {showSubs ? (
                <div className="flex-1 flex flex-col animate-in fade-in duration-300">
                    <div className="p-4 border-b border-github-border flex justify-between items-center bg-github-surface/30">
                        <span className="text-[10px] font-black uppercase text-github-muted tracking-widest">Assinaturas no Cartão</span>
                        <button onClick={() => setIsAddingSub(true)} className="p-1.5 text-github-primary hover:bg-github-primary/10 rounded-lg transition-colors">
                            <Plus size={16}/>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {isAddingSub && (
                            <form onSubmit={handleAddSub} className="p-4 bg-github-bg border border-github-primary rounded-2xl space-y-3 shadow-inner">
                                <input required className="w-full bg-github-surface border border-github-border rounded-xl px-3 py-2 text-xs text-github-text outline-none focus:border-github-primary font-bold" placeholder="Nome (Ex: Netflix)" value={subForm.name} onChange={e => setSubForm({...subForm, name: e.target.value})} />
                                <div className="flex gap-2">
                                    <input required type="number" step="0.01" className="flex-1 bg-github-surface border border-github-border rounded-xl px-3 py-2 text-xs text-github-text font-mono font-bold" placeholder="R$ 0,00" value={subForm.amount} onChange={e => setSubForm({...subForm, amount: e.target.value})} />
                                    <input required type="number" min="1" max="31" className="w-16 bg-github-surface border border-github-border rounded-xl px-3 py-2 text-xs text-github-text text-center font-bold" placeholder="Dia" value={subForm.billingDay} onChange={e => setSubForm({...subForm, billingDay: parseInt(e.target.value)})} />
                                </div>
                                <select required className="w-full bg-github-surface border border-github-border rounded-xl px-3 py-2 text-xs text-github-text outline-none font-bold" value={subForm.categoryId} onChange={e => setSubForm({...subForm, categoryId: e.target.value})}>
                                    <option value="">Categoria...</option>
                                    {sortByNameIgnoreAccents(categories.filter(c => c.type === 'expense')).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <div className="flex justify-end gap-2">
                                    <button type="button" onClick={() => setIsAddingSub(false)} className="text-[10px] font-black uppercase text-github-muted">Cancelar</button>
                                    <button type="submit" className="text-[10px] font-black uppercase text-github-primary">Adicionar</button>
                                </div>
                            </form>
                        )}
                        
                        {cardSubs.length === 0 && !isAddingSub && (
                            <div className="py-12 text-center opacity-30">
                                <Monitor size={32} className="mx-auto mb-2" />
                                <p className="text-[10px] font-black uppercase">Nenhuma assinatura</p>
                            </div>
                        )}

                        {cardSubs.map(s => (
                            <div key={s.id} className="flex justify-between items-center p-4 bg-github-surface/50 border border-github-border rounded-2xl group hover:border-github-primary transition-all">
                                <div>
                                    <p className="text-sm font-bold text-github-text mb-1">{s.name}</p>
                                    <p className="text-[10px] font-black uppercase text-github-muted tracking-widest">Cobra todo dia {s.billingDay}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-mono font-black text-github-text mb-2">{formatCurrency(s.amount)}</p>
                                    <button onClick={() => deleteSubscription(s.id)} className="p-1.5 text-github-muted hover:text-github-danger transition-colors">
                                        <Trash2 size={14}/>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => setShowSubs(false)} className="p-4 text-xs font-black uppercase text-github-primary border-t border-github-border hover:bg-github-surface transition-colors">Voltar para Fatura</button>
                </div>
            ) : (
                <>
                <div className="flex items-center justify-between px-6 py-4 bg-github-bg/50 border-b border-github-border">
                    <button onClick={() => { const d = new Date(viewDate); d.setMonth(d.getMonth()-1); setViewDate(d); }} className="p-2 hover:bg-github-surface rounded-xl"><ChevronLeft size={20}/></button>
                    <div className="text-center">
                        <span className="text-sm font-black text-github-text block capitalize">
                            {viewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        </span>
                        <span className={`text-[10px] font-black uppercase flex items-center justify-center gap-1.5 px-2 py-0.5 rounded-full mt-1 ${currentStatus.bg} ${currentStatus.color}`}>
                            <currentStatus.icon size={10} /> {currentStatus.label}
                        </span>
                    </div>
                    <button onClick={() => { const d = new Date(viewDate); d.setMonth(d.getMonth()+1); setViewDate(d); }} className="p-2 hover:bg-github-surface rounded-xl"><ChevronRight size={20}/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[300px]">
                    {stats.items.length === 0 ? (
                        <div className="py-8 text-center opacity-30">
                            <Calendar size={32} className="mx-auto mb-2" />
                            <p className="text-xs font-bold uppercase">Nenhum gasto</p>
                        </div>
                    ) : (
                        stats.items.map(t => (
                            <div key={t.id} className="flex justify-between items-center p-3 hover:bg-github-surface rounded-2xl border border-github-border/30 transition-all group">
                                <div className="min-w-0 pr-2">
                                    <p className={`text-xs font-bold truncate ${t.isReconciled ? 'text-github-muted line-through' : 'text-github-text'}`}>
                                        {t.isChargeback && <span className="mr-1 text-github-success">[Estorno]</span>}
                                        {t.description}
                                    </p>
                                    <p className="text-[10px] text-github-muted uppercase font-black">
                                        {new Date(t.date).toLocaleDateString('pt-BR')}
                                        {t.isSubscriptionCharge && " • Assinatura"}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs font-mono font-black ${t.type === 'income' ? 'text-github-success' : 'text-github-text'}`}>
                                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                                    </span>
                                    {!t.isChargeback && !t.isInvoicePayment && (
                                        <button 
                                            onClick={() => handleChargeback(t)} 
                                            title="Solicitar Estorno"
                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-github-muted hover:text-github-warning transition-all"
                                        >
                                            <Undo2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-6 border-t border-github-border bg-github-surface mt-auto">
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <p className="text-[10px] font-black uppercase text-github-muted tracking-widest mb-1">Total da Fatura</p>
                            <p className="text-2xl font-mono font-black text-github-text">{formatCurrency(stats.total)}</p>
                            <p className="text-[10px] font-black uppercase text-github-warning tracking-widest mt-2">Valor Restante</p>
                            <p className="text-lg font-mono font-black text-github-warning">{formatCurrency(roundToTwoDecimals(stats.total - stats.paidAmount))}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase text-github-success tracking-widest mb-1">Valor Pago</p>
                            <p className="text-sm font-mono font-black text-github-success">{formatCurrency(stats.paidAmount)}</p>
                        </div>
                    </div>
                    
                    {stats.total > stats.paidAmount && (
                        <Button onClick={() => {
                            setPaymentData({ ...paymentData, amount: roundToTwoDecimals(stats.total - stats.paidAmount) });
                            setIsPayingInvoice(true);
                        }} className="w-full py-4 rounded-2xl">
                            <CheckCircle size={18} /> Pagar Fatura
                        </Button>
                    )}
                    {stats.status === 'paid' && (
                        <button onClick={handleReopenInvoice} disabled={isReopeningInvoice} className="w-full py-3 text-xs font-black uppercase text-github-warning hover:underline flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                            <RotateCcw size={14} /> {isReopeningInvoice ? 'Reabrindo...' : 'Reabrir Fatura'}
                        </button>
                    )}
                </div>
                </>
            )}

            <CreditCardFormModal 
              isOpen={isEditing} 
              onClose={() => setIsEditing(false)} 
              editingCard={card}
            />

            <Modal isOpen={isPayingInvoice} onClose={() => setIsPayingInvoice(false)} title="Pagar Fatura">
                <form onSubmit={handlePayInvoice} className="space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-github-muted px-1">Valor a Pagar</label>
                        <input required type="number" step="0.01" min="0" max={roundToTwoDecimals(stats.total - stats.paidAmount)} className="w-full bg-github-bg border border-github-border rounded-2xl px-5 py-4 text-github-text outline-none focus:border-github-primary transition-all font-bold shadow-inner" value={paymentData.amount} onChange={e => setPaymentData({...paymentData, amount: roundToTwoDecimals(parseFloat(e.target.value) || 0)})} placeholder="0,00" />
                        <p className="text-[10px] text-github-muted">Valor total: {formatCurrency(roundToTwoDecimals(stats.total - stats.paidAmount))}</p>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-github-muted px-1">Data do Pagamento</label>
                        <input required type="date" className="w-full bg-github-bg border border-github-border rounded-2xl px-5 py-4 text-github-text outline-none focus:border-github-primary transition-all font-bold shadow-inner" value={paymentData.paymentDate} onChange={e => setPaymentData({...paymentData, paymentDate: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-github-muted px-1">Conta de Origem</label>
                        <select required className="w-full bg-github-bg border border-github-border rounded-2xl px-5 py-4 text-github-text outline-none focus:border-github-primary transition-all font-bold shadow-inner" value={paymentData.sourceBankId} onChange={e => setPaymentData({...paymentData, sourceBankId: e.target.value})}>
                            <option value="">Selecione uma conta...</option>
                            {banks && banks.filter(b => b.id !== card.id).map(b => (
                                <option key={b.id} value={b.id}>{b.name} ({formatCurrency(b.balance)})</option>
                            ))}
                        </select>
                    </div>
                    <Button type="submit" variant="primary" className="w-full py-5 text-lg shadow-xl shadow-github-success/10">Confirmar Pagamento</Button>
                </form>
            </Modal>
        </Card>
    );
};

export const CreditCardsModule = () => {
    const { banks } = useApp();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const creditCards = banks.filter(b => b.type === 'credit');

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-github-text tracking-tighter uppercase">Meus Cartões</h2>
                    <p className="text-sm text-github-muted">Gestão inteligente de limites e faturas</p>
                </div>
                <Button onClick={() => setIsFormOpen(true)} className="px-6 py-3 rounded-2xl">
                    <Plus size={20} /> Novo Cartão
                </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {creditCards.map(card => <InvoiceCard key={card.id} card={card} />)}
                {creditCards.length === 0 && (
                    <Card className="col-span-full p-12 text-center border-dashed border-2 border-github-border">
                        <CreditCard size={48} className="mx-auto mb-4 text-github-muted opacity-30" />
                        <h3 className="text-xl font-bold text-github-text mb-2">Nenhum cartão cadastrado</h3>
                        <p className="text-sm text-github-muted mb-6">Controle seus gastos parcelados e datas de vencimento.</p>
                        <Button onClick={() => setIsFormOpen(true)} className="mx-auto">Cadastrar Primeiro Cartão</Button>
                    </Card>
                )}
            </div>

            <CreditCardFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
        </div>
    );
};

export const BanksModule = () => {
    const { banks, deleteBank, addBank, updateBank, addTransaction } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
    const [editingBank, setEditingBank] = useState<Bank | null>(null);
    const [feeBank, setFeeBank] = useState<Bank | null>(null);
    const [formData, setFormData] = useState({ name: '', balance: '', type: 'checking' as any, color: '#f6ad31' });
    const [feeData, setFeeData] = useState({ amount: '', date: new Date().toISOString().split('T')[0], description: 'Taxa Bancária' });

    const nonCredit = banks.filter(b => b.type !== 'credit');

    const handleAddOrUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingBank) {
            updateBank({
                ...editingBank,
                name: formData.name,
                balance: parseFloat(formData.balance) || 0,
                type: formData.type,
                color: formData.color
            });
        } else {
            addBank({
                name: formData.name,
                balance: parseFloat(formData.balance) || 0,
                type: formData.type,
                color: formData.color,
                isActive: true
            });
        }
        setIsModalOpen(false);
        setEditingBank(null);
        setFormData({ name: '', balance: '', type: 'checking', color: '#f6ad31' });
    };

    const handleEdit = (bank: Bank) => {
        setEditingBank(bank);
        setFormData({
            name: bank.name,
            balance: bank.balance.toString(),
            type: bank.type,
            color: bank.color
        });
        setIsModalOpen(true);
    };

    const handleAddFee = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!feeBank || !feeData.amount) return;

        await addTransaction({
            description: feeData.description,
            amount: parseFloat(feeData.amount),
            date: new Date(feeData.date).toISOString(),
            type: 'expense',
            categoryId: SYSTEM_CATEGORY_ID,
            bankId: feeBank.id,
            isCreditCard: false,
            isReconciled: true,
            notes: 'Lançamento avulso de taxa bancária'
        });

        setIsFeeModalOpen(false);
        setFeeBank(null);
        setFeeData({ amount: '', date: new Date().toISOString().split('T')[0], description: 'Taxa Bancária' });
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-github-text tracking-tighter uppercase">Minhas Contas</h2>
                    <p className="text-sm text-github-muted">Saldos e disponibilidades financeiras</p>
                </div>
                <Button onClick={() => { setEditingBank(null); setIsModalOpen(true); }} className="px-6 py-3 rounded-2xl">
                    <Plus size={20} /> Adicionar Conta
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {nonCredit.map(bank => (
                    <Card key={bank.id} className="p-6 border-l-8 hover:shadow-lg transition-all" style={{ borderLeftColor: bank.color }}>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-github-text">{bank.name}</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-github-muted">{bank.type === 'checking' ? 'Conta Corrente' : 'Poupança'}</p>
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => { setFeeBank(bank); setIsFeeModalOpen(true); }} className="p-2 text-github-muted hover:text-github-primary transition-colors" title="Lançar Taxa">
                                    <Percent size={18} />
                                </button>
                                <button onClick={() => handleEdit(bank)} className="p-2 text-github-muted hover:text-github-primary transition-colors">
                                    <Pencil size={18} />
                                </button>
                                <button onClick={() => { if(window.confirm('Excluir esta conta? Todos os lançamentos devem ser apagados primeiro.')) deleteBank(bank.id); }} className="p-2 text-github-muted hover:text-github-danger transition-colors">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase text-github-muted tracking-widest">Saldo Atual</p>
                            <p className="text-3xl font-mono font-black text-github-text">{formatCurrency(bank.balance)}</p>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Modal de Conta (Novo/Editar) */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingBank ? "Editar Conta" : "Nova Conta Bancária"}>
                <form onSubmit={handleAddOrUpdate} className="space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-github-muted px-1">Instituição</label>
                        <input required className="w-full bg-github-bg border border-github-border rounded-2xl px-5 py-4 text-github-text outline-none focus:border-github-primary transition-all font-bold shadow-inner" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Nubank, Inter..." />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-github-muted px-1">Saldo Atual (R$)</label>
                        <input required type="number" step="0.01" className="w-full bg-github-bg border border-github-border rounded-2xl px-5 py-4 text-github-text outline-none focus:border-github-primary transition-all font-mono text-xl font-black shadow-inner" value={formData.balance} onChange={e => setFormData({...formData, balance: e.target.value})} placeholder="0,00" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-github-muted px-1">Tipo</label>
                            <select className="w-full bg-github-bg border border-github-border rounded-2xl px-5 py-4 text-github-text outline-none focus:border-github-primary appearance-none font-bold" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                                <option value="checking">Corrente</option>
                                <option value="savings">Poupança</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-github-muted px-1">Cor</label>
                            <input type="color" className="w-full h-[58px] bg-github-bg border border-github-border rounded-2xl cursor-pointer p-1" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} />
                        </div>
                    </div>
                    <Button type="submit" variant="primary" className="w-full py-5 text-lg shadow-xl shadow-github-success/10">
                        {editingBank ? "Salvar Alterações" : "Criar Conta"}
                    </Button>
                </form>
            </Modal>

            {/* Modal de Taxa Bancária */}
            <Modal isOpen={isFeeModalOpen} onClose={() => setIsFeeModalOpen(false)} title={`Lançar Taxa - ${feeBank?.name}`}>
                <form onSubmit={handleAddFee} className="space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-github-muted px-1">Descrição</label>
                        <input required className="w-full bg-github-bg border border-github-border rounded-2xl px-5 py-4 text-github-text outline-none focus:border-github-primary font-bold shadow-inner" value={feeData.description} onChange={e => setFeeData({...feeData, description: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-github-muted px-1">Valor (R$)</label>
                            <input required type="number" step="0.01" className="w-full bg-github-bg border border-github-border rounded-2xl px-5 py-4 text-github-text outline-none focus:border-github-primary font-mono font-black shadow-inner" value={feeData.amount} onChange={e => setFeeData({...feeData, amount: e.target.value})} placeholder="0,00" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-github-muted px-1">Data do Débito</label>
                            <input required type="date" className="w-full bg-github-bg border border-github-border rounded-2xl px-5 py-4 text-github-text outline-none focus:border-github-primary font-bold" value={feeData.date} onChange={e => setFeeData({...feeData, date: e.target.value})} />
                        </div>
                    </div>
                    <div className="p-4 bg-github-surface rounded-2xl border border-github-border">
                        <p className="text-[10px] text-github-muted font-bold uppercase tracking-wider text-center">O valor será descontado do saldo da conta no dia selecionado.</p>
                    </div>
                    <Button type="submit" variant="danger" className="w-full py-5 text-lg">Confirmar Débito</Button>
                </form>
            </Modal>
        </div>
    );
};

export const CategoriesModule = () => {
    const { categories, deleteCategory, addCategory, updateCategory } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [formData, setFormData] = useState({ name: '', type: 'expense' as 'income' | 'expense' });

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        await addCategory(formData.name, formData.type);
        setIsModalOpen(false);
        setFormData({ name: '', type: 'expense' });
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        await updateCategory({
            ...editingCategory,
            name: formData.name,
            type: formData.type
        });
        setIsEditModalOpen(false);
        setEditingCategory(null);
        setFormData({ name: '', type: 'expense' });
    };

    const openEditModal = (cat: any) => {
        setEditingCategory(cat);
        setFormData({ name: cat.name, type: cat.type });
        setIsEditModalOpen(true);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-github-text tracking-tighter uppercase">Categorias</h2>
                    <p className="text-sm text-github-muted">Organize seus gastos por tipo</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="px-6 py-3 rounded-2xl">
                    <Plus size={20} /> Nova Categoria
                </Button>
            </div>

            {/* Despesas */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="h-1 w-8 bg-github-danger rounded-full"></div>
                    <h3 className="text-xl font-black text-github-text uppercase">Despesas</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {sortByNameIgnoreAccents(categories.filter(c => c.type === 'expense')).map(cat => (
                        <Card key={cat.id} className="p-6 flex flex-col items-center gap-4 group relative hover:scale-105 transition-transform border-github-border shadow-sm">
                            <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: cat.color }}>
                                <Tag size={32} />
                            </div>
                            <div className="text-center">
                                <h4 className="font-bold text-github-text text-sm">{cat.name}</h4>
                                <p className="text-[10px] font-black uppercase tracking-widest text-github-danger">Despesa</p>
                            </div>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1 transition-all">
                                <button onClick={() => openEditModal(cat)} className="p-2 text-github-primary bg-github-bg/80 rounded-xl hover:bg-github-primary hover:text-white transition-all">
                                    <Edit2 size={14} />
                                </button>
                                <button onClick={() => { if(window.confirm('Excluir esta categoria?')) deleteCategory(cat.id); }} className="p-2 text-github-danger bg-github-bg/80 rounded-xl hover:bg-github-danger hover:text-white transition-all">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Receitas */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="h-1 w-8 bg-github-success rounded-full"></div>
                    <h3 className="text-xl font-black text-github-text uppercase">Receitas</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {sortByNameIgnoreAccents(categories.filter(c => c.type === 'income')).map(cat => (
                        <Card key={cat.id} className="p-6 flex flex-col items-center gap-4 group relative hover:scale-105 transition-transform border-github-border shadow-sm">
                            <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: cat.color }}>
                                <Tag size={32} />
                            </div>
                            <div className="text-center">
                                <h4 className="font-bold text-github-text text-sm">{cat.name}</h4>
                                <p className="text-[10px] font-black uppercase tracking-widest text-github-success">Receita</p>
                            </div>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1 transition-all">
                                <button onClick={() => openEditModal(cat)} className="p-2 text-github-primary bg-github-bg/80 rounded-xl hover:bg-github-primary hover:text-white transition-all">
                                    <Edit2 size={14} />
                                </button>
                                <button onClick={() => { if(window.confirm('Excluir esta categoria?')) deleteCategory(cat.id); }} className="p-2 text-github-danger bg-github-bg/80 rounded-xl hover:bg-github-danger hover:text-white transition-all">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Categoria">
                <form onSubmit={handleAdd} className="space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-github-muted px-1">Nome</label>
                        <input required className="w-full bg-github-bg border border-github-border rounded-2xl px-5 py-4 text-github-text outline-none focus:border-github-primary transition-all font-bold shadow-inner" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Lazer, Saúde..." />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-github-muted px-1">Tipo</label>
                        <div className="flex bg-github-bg rounded-2xl p-1.5 border border-github-border">
                            <button type="button" onClick={() => setFormData({...formData, type: 'expense'})} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase transition-all ${formData.type === 'expense' ? 'bg-github-danger text-white' : 'text-github-muted'}`}>
                                <ArrowDownCircle size={16}/> Saída
                            </button>
                            <button type="button" onClick={() => setFormData({...formData, type: 'income'})} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase transition-all ${formData.type === 'income' ? 'bg-github-success text-white' : 'text-github-muted'}`}>
                                <ArrowUpCircle size={16}/> Entrada
                            </button>
                        </div>
                    </div>
                    <Button type="submit" variant="primary" className="w-full py-5 text-lg shadow-xl shadow-github-success/10">Salvar Categoria</Button>
                </form>
            </Modal>

            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Categoria">
                <form onSubmit={handleEdit} className="space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-github-muted px-1">Nome</label>
                        <input required className="w-full bg-github-bg border border-github-border rounded-2xl px-5 py-4 text-github-text outline-none focus:border-github-primary transition-all font-bold shadow-inner" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Lazer, Saúde..." />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-github-muted px-1">Tipo</label>
                        <div className="flex bg-github-bg rounded-2xl p-1.5 border border-github-border">
                            <button type="button" onClick={() => setFormData({...formData, type: 'expense'})} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase transition-all ${formData.type === 'expense' ? 'bg-github-danger text-white' : 'text-github-muted'}`}>
                                <ArrowDownCircle size={16}/> Saída
                            </button>
                            <button type="button" onClick={() => setFormData({...formData, type: 'income'})} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase transition-all ${formData.type === 'income' ? 'bg-github-success text-white' : 'text-github-muted'}`}>
                                <ArrowUpCircle size={16}/> Entrada
                            </button>
                        </div>
                    </div>
                    <Button type="submit" variant="primary" className="w-full py-5 text-lg shadow-xl shadow-github-success/10">Atualizar Categoria</Button>
                </form>
            </Modal>
        </div>
    );
};

export const InvestmentsModule = () => {
    const { investments, handleInvestmentTransaction, deleteInvestment, addInvestment, banks } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isTxModalOpen, setIsTxModalOpen] = useState(false);
    const [selectedInv, setSelectedInv] = useState<{id: string, name: string, type: 'in' | 'out'} | null>(null);
    const [txAmount, setTxAmount] = useState('');
    const [isProcessingTx, setIsProcessingTx] = useState(false);

    const [formData, setFormData] = useState({ 
        name: '', principal: '', rate: '', frequency: 'monthly' as any, bankId: '' 
    });

    const nonCreditBanks = banks.filter(b => b.type !== 'credit');

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        addInvestment({
            name: formData.name,
            principal: parseFloat(formData.principal) || 0,
            rate: parseFloat(formData.rate) || 0,
            frequency: formData.frequency,
            bankId: formData.bankId,
            startDate: new Date().toISOString()
        });
        setIsModalOpen(false);
        setFormData({ name: '', principal: '', rate: '', frequency: 'monthly', bankId: '' });
    };

    const handleConfirmTx = async () => {
        if (isProcessingTx || !selectedInv || !txAmount) return;
        
        setIsProcessingTx(true);
        try {
            await handleInvestmentTransaction(selectedInv.id, parseFloat(txAmount), selectedInv.type);
            setIsTxModalOpen(false);
            setSelectedInv(null);
            setTxAmount('');
        } catch (error) {
            console.error('Erro ao processar transação de investimento:', error);
            alert(error instanceof Error ? error.message : 'Erro ao processar transação. Tente novamente.');
        } finally {
            setIsProcessingTx(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-github-text tracking-tighter uppercase">Investimentos</h2>
                    <p className="text-sm text-github-muted">Construa seu patrimônio e monitore rendimentos</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="px-6 py-3 rounded-2xl">
                    <Plus size={20} /> Novo Ativo
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {investments.map(inv => (
                    <Card key={inv.id} className="p-8 group relative overflow-hidden bg-gradient-to-tr from-github-surface to-github-bg border-github-border shadow-md">
                        <div className="absolute top-0 right-0 p-1 opacity-5 group-hover:opacity-10 transition-opacity">
                            <TrendingUp size={100} />
                        </div>
                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div>
                                <h3 className="text-xl font-black text-github-text">{inv.name}</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-github-muted">Rendimento: {inv.rate}% {inv.frequency === 'monthly' ? 'p/mês' : 'p/ano'}</p>
                            </div>
                            <button onClick={() => { if(window.confirm('Excluir este investimento?')) deleteInvestment(inv.id); }} className="p-2 text-github-muted hover:text-github-danger transition-colors">
                                <Trash2 size={18} />
                            </button>
                        </div>
                        <div className="bg-github-bg/50 p-6 rounded-3xl border border-github-border mb-8 shadow-inner relative z-10">
                            <p className="text-[10px] font-black uppercase text-github-muted tracking-widest mb-2">Montante Investido</p>
                            <p className="text-4xl font-mono font-black text-github-success tracking-tighter">{formatCurrency(inv.principal)}</p>
                        </div>
                        <div className="flex gap-4 relative z-10">
                            <Button onClick={() => { setSelectedInv({id: inv.id, name: inv.name, type: 'in'}); setIsTxModalOpen(true); }} variant="secondary" className="flex-1 text-xs py-3 rounded-xl border-github-success/30 hover:bg-github-success/10 font-black">APORTE</Button>
                            <Button onClick={() => { setSelectedInv({id: inv.id, name: inv.name, type: 'out'}); setIsTxModalOpen(true); }} variant="secondary" className="flex-1 text-xs py-3 rounded-xl border-github-danger/30 hover:bg-github-danger/10 font-black">RESGATE</Button>
                        </div>
                    </Card>
                ))}
                {investments.length === 0 && (
                     <Card className="col-span-full p-12 text-center border-dashed border-2 border-github-border">
                        <PiggyBank size={48} className="mx-auto mb-4 text-github-muted opacity-30" />
                        <h3 className="text-xl font-bold text-github-text mb-2">Seus investimentos aparecem aqui</h3>
                        <p className="text-sm text-github-muted mb-6">Comece a poupar hoje e veja seu dinheiro crescer.</p>
                        <Button onClick={() => setIsModalOpen(true)} className="mx-auto">Criar Primeiro Investimento</Button>
                    </Card>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Investimento">
                <form onSubmit={handleAdd} className="space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-github-muted px-1">Nome do Ativo</label>
                        <input required className="w-full bg-github-bg border border-github-border rounded-2xl px-5 py-4 text-github-text outline-none focus:border-github-primary transition-all font-bold shadow-inner" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: CDB Liquidez Diária..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-github-muted px-1">Valor Inicial (R$)</label>
                            <input required type="number" step="0.01" className="w-full bg-github-bg border border-github-border rounded-2xl px-5 py-4 text-github-text outline-none focus:border-github-primary transition-all font-mono font-black text-xl shadow-inner" value={formData.principal} onChange={e => setFormData({...formData, principal: e.target.value})} placeholder="0,00" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-github-muted px-1">Taxa (%)</label>
                            <input required type="number" step="0.01" className="w-full bg-github-bg border border-github-border rounded-2xl px-5 py-4 text-github-text outline-none focus:border-github-primary transition-all font-mono font-black text-xl shadow-inner" value={formData.rate} onChange={e => setFormData({...formData, rate: e.target.value})} placeholder="1,00" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-github-muted px-1">Origem do Dinheiro</label>
                        <select required className="w-full bg-github-bg border border-github-border rounded-2xl px-5 py-4 text-github-text outline-none focus:border-github-primary appearance-none font-bold" value={formData.bankId} onChange={e => setFormData({...formData, bankId: e.target.value})}>
                            <option value="">Selecione a conta...</option>
                            {nonCreditBanks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>
                    <Button type="submit" variant="primary" className="w-full py-5 text-lg shadow-xl shadow-github-success/10">Confirmar Investimento</Button>
                </form>
            </Modal>

            <Modal isOpen={isTxModalOpen} onClose={() => setIsTxModalOpen(false)} title={`${selectedInv?.type === 'in' ? 'Aporte em' : 'Resgate de'} ${selectedInv?.name}`}>
                <div className="space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-github-muted px-1">Qual o valor?</label>
                        <input required type="number" step="0.01" className="w-full bg-github-bg border border-github-border rounded-2xl px-5 py-4 text-github-text outline-none focus:border-github-primary transition-all font-mono font-black text-2xl shadow-inner" value={txAmount} onChange={e => setTxAmount(e.target.value)} placeholder="0,00" autoFocus />
                    </div>
                    <div className="p-4 bg-github-surface rounded-2xl border border-github-border flex items-center gap-3">
                        <Info size={16} className="text-github-primary"/>
                        <p className="text-[10px] text-github-muted font-medium leading-relaxed uppercase tracking-wider">
                            O saldo será movimentado automaticamente da conta vinculada a este investimento.
                        </p>
                    </div>
                    <div className="flex gap-4">
                         <Button onClick={() => setIsTxModalOpen(false)} variant="secondary" className="flex-1 py-4 rounded-xl">Cancelar</Button>
                         <Button onClick={handleConfirmTx} variant="primary" className="flex-1 py-4 rounded-xl shadow-lg shadow-github-success/10" disabled={isProcessingTx}>
                            {isProcessingTx ? 'Processando...' : `Confirmar ${selectedInv?.type === 'in' ? 'Aporte' : 'Resgate'}`}
                         </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
