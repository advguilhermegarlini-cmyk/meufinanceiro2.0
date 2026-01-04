
import React, { useState, useEffect } from 'react';
import { useApp, SYSTEM_CATEGORY_ID } from '../context';
import { Card, Button } from './Layout';
import { Plus, X, ArrowUpCircle, ArrowDownCircle, RefreshCw, Tag, Wallet, CreditCard, Sparkles } from 'lucide-react';
import { TransactionType } from '../types';
import { sortByNameIgnoreAccents } from '../utils';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTransaction?: any;
}

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({ isOpen, onClose, editingTransaction }) => {
  const { categories, banks, addTransaction, updateTransaction, addCategory, addBank } = useApp();
  
  const [tab, setTab] = useState<'income' | 'expense' | 'transfer'>('expense');
  const [quickAddType, setQuickAddType] = useState<'none' | 'category' | 'bank' | 'credit_card'>('none');
  const [quickName, setQuickName] = useState('');
  const [quickValue, setQuickValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    categoryId: '',
    bankId: '',
    toBankId: '',
    installments: 1
  });

  useEffect(() => {
    if (editingTransaction) {
      const editDate = new Date(editingTransaction.date);
      setFormData({
        description: editingTransaction.description || '',
        amount: editingTransaction.amount?.toString() || '',
        date: editDate.toISOString().split('T')[0],
        time: editDate.toTimeString().slice(0, 5),
        categoryId: editingTransaction.categoryId || '',
        bankId: editingTransaction.bankId || '',
        toBankId: editingTransaction.toBankId || '',
        installments: editingTransaction.installments || 1
      });
      setTab(editingTransaction.type === 'transfer' ? 'transfer' : editingTransaction.type === 'income' ? 'income' : 'expense');
    } else {
      setFormData({
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        categoryId: '',
        bankId: '',
        toBankId: '',
        installments: 1
      });
      setTab('expense');
    }
  }, [editingTransaction]);

  if (!isOpen) return null;

  const handleQuickAdd = async () => {
    if (!quickName) return;
    
    try {
        if (quickAddType === 'category') {
            const newCat = await addCategory(quickName, tab === 'income' ? 'income' : 'expense');
            setFormData({ ...formData, categoryId: newCat.id });
        } else if (quickAddType === 'bank') {
            const newBank = await addBank({
                name: quickName,
                type: 'checking',
                balance: parseFloat(quickValue) || 0,
                color: '#f6ad31',
                isActive: true
            });
            setFormData({ ...formData, bankId: newBank.id });
        } else if (quickAddType === 'credit_card') {
            const newCard = await addBank({
                name: quickName,
                type: 'credit',
                balance: 0,
                color: '#bc8cff',
                creditCardClosingDay: 1,
                creditCardDueDay: 10,
                limit: parseFloat(quickValue) || 1000,
                isActive: true
            });
            setFormData({ ...formData, bankId: newCard.id });
        }
        
        setQuickName('');
        setQuickValue('');
        setQuickAddType('none');
    } catch (e) {
        alert("Erro ao criar item.");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || !formData.amount || !formData.bankId) return;

    setIsSaving(true);
    try {
      const bank = banks.find(b => b.id === formData.bankId);
      const category = categories.find(c => c.id === formData.categoryId);
      
      // Se a descrição estiver vazia, usa o nome da categoria ou o tipo do lançamento
      const finalDescription = formData.description.trim() 
        ? formData.description.trim() 
        : (tab === 'transfer' ? 'Transferência' : (category?.name || (tab === 'income' ? 'Entrada' : 'Saída')));

      const payload = {
        description: finalDescription,
        amount: parseFloat(formData.amount),
        date: new Date(`${formData.date}T${formData.time}`).toISOString(),
        type: tab as TransactionType,
        categoryId: tab === 'transfer' ? SYSTEM_CATEGORY_ID : formData.categoryId,
        bankId: formData.bankId,
        toBankId: tab === 'transfer' ? formData.toBankId : undefined,
        isCreditCard: bank?.type === 'credit',
        isReconciled: bank?.type !== 'credit',
        installments: bank?.type === 'credit' && tab === 'expense' ? formData.installments : 1
      };

      if (editingTransaction) {
        await updateTransaction({ ...editingTransaction, ...payload });
      } else {
        await addTransaction(payload);
      }
      onClose();
      // Reset form
      setFormData({
        description: '', amount: '', date: new Date().toISOString().split('T')[0], time: new Date().toTimeString().slice(0, 5),
        categoryId: '', bankId: '', toBankId: '', installments: 1
      });
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      alert(error instanceof Error ? error.message : 'Erro ao salvar transação. Verifique sua conexão e tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const visibleCategories = sortByNameIgnoreAccents(categories.filter(c => tab === 'income' ? c.type === 'income' : c.type === 'expense'));

  return (
    <div className="fixed inset-0 bg-black/80 flex items-end md:items-center justify-center z-[200] md:p-4 backdrop-blur-md animate-in fade-in duration-300">
      <Card className="w-full max-w-xl p-6 md:p-8 border-github-border shadow-2xl animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto rounded-t-[2.5rem] md:rounded-[2.5rem]">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Sparkles size={24} className="text-github-primary animate-pulse" />
            <h3 className="text-2xl font-black text-github-text tracking-tighter uppercase">{editingTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>
          </div>
          <button onClick={onClose} className="p-2 text-github-muted hover:text-github-text bg-github-bg rounded-2xl">
            <X size={24} />
          </button>
        </div>

        <div className="flex bg-github-bg rounded-2xl p-1 border border-github-border mb-6">
          <button onClick={() => setTab('expense')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase transition-all ${tab === 'expense' ? 'bg-github-danger text-white' : 'text-github-muted'}`}>
            <ArrowDownCircle size={16} /> Saída
          </button>
          <button onClick={() => setTab('income')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase transition-all ${tab === 'income' ? 'bg-github-success text-white' : 'text-github-muted'}`}>
            <ArrowUpCircle size={16} /> Entrada
          </button>
          <button onClick={() => setTab('transfer')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase transition-all ${tab === 'transfer' ? 'bg-github-primary text-white' : 'text-github-muted'}`}>
            <RefreshCw size={16} /> Transf.
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-github-muted px-1">O que você pagou/recebeu? (Opcional)</label>
            <input 
              className="w-full bg-github-bg border border-github-border rounded-2xl px-5 py-4 text-github-text outline-none focus:border-github-primary transition-all font-bold shadow-inner" 
              value={formData.description} 
              onChange={e => setFormData({ ...formData, description: e.target.value })} 
              placeholder={tab === 'transfer' ? "Ex: Transferência Reserva" : "Deixe vazio para usar o nome da categoria"} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-github-muted px-1">Valor (R$)</label>
                <input required type="number" step="0.01" className="w-full bg-github-bg border border-github-border rounded-2xl px-5 py-4 text-github-text outline-none focus:border-github-primary font-mono text-xl font-black shadow-inner" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} placeholder="0,00" />
            </div>
            <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-github-muted px-1">Data</label>
                <input type="date" required className="w-full bg-github-bg border border-github-border rounded-2xl px-5 py-4 text-github-text outline-none focus:border-github-primary font-bold shadow-sm" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
            </div>
            <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-github-muted px-1">Horário</label>
                <input type="time" required className="w-full bg-github-bg border border-github-border rounded-2xl px-5 py-4 text-github-text outline-none focus:border-github-primary font-bold shadow-sm" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} />
            </div>
          </div>

          {tab !== 'transfer' && (
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-github-muted px-1 flex justify-between">
                <span>Categoria</span>
                <button type="button" onClick={() => setQuickAddType(quickAddType === 'category' ? 'none' : 'category')} className="text-github-primary hover:underline flex items-center gap-1 normal-case font-bold">
                   <Plus size={10}/> Criar Nova
                </button>
              </label>
              {quickAddType === 'category' ? (
                <div className="flex gap-2 animate-in slide-in-from-top-1">
                    <input className="flex-1 bg-github-bg border border-github-border rounded-2xl px-4 py-3 text-sm text-github-text outline-none font-bold" placeholder="Nome da Categoria..." value={quickName} onChange={e => setQuickName(e.target.value)} autoFocus />
                    <Button onClick={handleQuickAdd} variant="primary" className="px-4 py-2"><Tag size={16}/></Button>
                </div>
              ) : (
                <select required className="w-full bg-github-bg border border-github-border rounded-2xl px-5 py-4 text-github-text outline-none focus:border-github-primary font-bold appearance-none shadow-sm" value={formData.categoryId} onChange={e => setFormData({ ...formData, categoryId: e.target.value })}>
                  <option value="">Selecione...</option>
                  {visibleCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
            </div>
          )}
          
          <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-github-muted px-1 flex justify-between">
                  <span>{tab === 'transfer' ? 'De (Origem)' : 'Conta ou Cartão'}</span>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setQuickAddType(quickAddType === 'bank' ? 'none' : 'bank')} className="text-github-primary hover:underline flex items-center gap-1 normal-case font-bold">
                       <Plus size={10}/> Conta
                    </button>
                    <button type="button" onClick={() => setQuickAddType(quickAddType === 'credit_card' ? 'none' : 'credit_card')} className="text-github-purple hover:underline flex items-center gap-1 normal-case font-bold">
                       <Plus size={10}/> Cartão
                    </button>
                  </div>
              </label>
              {(quickAddType === 'bank' || quickAddType === 'credit_card') ? (
                <div className="space-y-2 animate-in slide-in-from-top-1 bg-github-bg/50 p-4 rounded-2xl border border-github-border">
                    <input className="w-full bg-github-bg border border-github-border rounded-xl px-4 py-2.5 text-sm text-github-text outline-none font-bold mb-2" placeholder={quickAddType === 'bank' ? "Nome do Banco..." : "Nome do Cartão..."} value={quickName} onChange={e => setQuickName(e.target.value)} autoFocus />
                    <div className="flex gap-2">
                        <input type="number" className="flex-1 bg-github-bg border border-github-border rounded-xl px-4 py-2.5 text-xs text-github-text outline-none font-mono" placeholder={quickAddType === 'bank' ? "Saldo Inicial..." : "Limite..."} value={quickValue} onChange={e => setQuickValue(e.target.value)} />
                        <Button onClick={handleQuickAdd} variant="primary" className="px-5 py-2">
                           {quickAddType === 'bank' ? <Wallet size={16}/> : <CreditCard size={16}/>} Criar
                        </Button>
                    </div>
                </div>
              ) : (
                <select required className="w-full bg-github-bg border border-github-border rounded-2xl px-5 py-4 text-github-text outline-none focus:border-github-primary font-bold appearance-none shadow-sm" value={formData.bankId} onChange={e => setFormData({ ...formData, bankId: e.target.value })}>
                  <option value="">Selecione...</option>
                  {banks.map(b => <option key={b.id} value={b.id}>{b.name} {b.type === 'credit' ? '(Cartão)' : ''}</option>)}
                </select>
              )}
          </div>

          {tab === 'transfer' && (
              <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-github-muted px-1">Para (Destino)</label>
              <select required className="w-full bg-github-bg border border-github-border rounded-2xl px-5 py-4 text-github-text outline-none focus:border-github-primary font-bold appearance-none shadow-sm" value={formData.toBankId} onChange={e => setFormData({ ...formData, toBankId: e.target.value })}>
                <option value="">Selecione...</option>
                {banks.filter(b => b.id !== formData.bankId && b.type !== 'credit').map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}

          {banks.find(b => b.id === formData.bankId)?.type === 'credit' && tab === 'expense' && (
            <div className="space-y-3 animate-in slide-in-from-top-2 bg-github-purple/5 p-4 rounded-2xl border border-github-purple/20">
                <label className="text-[10px] font-black uppercase tracking-widest text-github-purple px-1">Parcelamento</label>
                <div className="flex items-center gap-3">
                    <input type="range" min="1" max="400" className="flex-1 accent-github-purple" value={formData.installments} onChange={e => setFormData({...formData, installments: Math.max(1, Math.min(400, parseInt(e.target.value)))})} />
                    <input 
                        type="number" 
                        min="1" 
                        max="400" 
                        value={formData.installments} 
                        onChange={e => setFormData({...formData, installments: Math.max(1, Math.min(400, parseInt(e.target.value) || 1))})}
                        className="w-16 text-center font-black text-github-purple bg-github-purple/10 rounded-xl py-2 px-2 border border-github-purple/30 text-lg shadow-sm outline-none focus:border-github-purple transition-colors"
                    />
                    <span className="text-xs font-black text-github-purple">x</span>
                </div>
                <div className="flex justify-between items-center mt-2 px-1">
                    <p className="text-[10px] text-github-muted uppercase font-black tracking-widest">Valor da Parcela</p>
                    <p className="text-xs font-black text-github-purple">{formatCurrency(parseFloat(formData.amount || '0') / formData.installments)}</p>
                </div>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <Button onClick={onClose} variant="secondary" className="flex-1 py-4 text-lg rounded-2xl" disabled={isSaving}>Cancelar</Button>
            <Button type="submit" variant="primary" className="flex-1 py-4 text-lg rounded-2xl shadow-xl shadow-github-success/10 border border-github-border" disabled={isSaving}>
               {isSaving ? 'Salvando...' : 'Confirmar Lançamento'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
};
