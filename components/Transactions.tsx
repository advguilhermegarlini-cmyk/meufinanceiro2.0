
import React, { useState } from 'react';
import { useApp } from '../context';
import { Card, Button } from './Layout';
import { formatCurrency, formatDate } from '../utils';
import { Plus, Trash2, Search, ArrowRightLeft, CreditCard, ChevronLeft, ChevronRight, AlertTriangle, Wallet, Calendar, Tag, Undo2 } from 'lucide-react';
import { TransactionType, Transaction } from '../types';

export const Transactions = () => {
  const { transactions, categories, banks, deleteTransaction, chargebackTransaction, selectedDate, setTransactionModalOpen } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');

  const [deleteModal, setDeleteModal] = useState<{show: boolean, txId: string, isSeries: boolean}>({show: false, txId: '', isSeries: false});

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const [year, month] = e.target.value.split('-');
      const newDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      setCurrentDate(newDate);
    }
  };

  const handleDeleteRequest = (t: Transaction) => {
      if (t.recurrenceGroupId) {
          setDeleteModal({ show: true, txId: t.id, isSeries: true });
      } else {
          if (window.confirm('Excluir esta transação?')) deleteTransaction(t.id);
      }
  }

  const confirmDeleteSeries = (deleteFuture: boolean) => {
      deleteTransaction(deleteModal.txId, deleteFuture);
      setDeleteModal({ show: false, txId: '', isSeries: false });
  }

  const handleChargeback = async (t: Transaction) => {
    if (window.confirm(`Deseja estornar "${t.description}"?`)) {
        await chargebackTransaction(t);
    }
  }

  const filtered = transactions.filter(t => {
    const tDate = new Date(t.date);
    const matchMonth = tDate.getUTCMonth() === currentDate.getMonth() && tDate.getUTCFullYear() === currentDate.getFullYear();
    const matchSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'all' || t.type === filterType;
    return matchSearch && matchType && matchMonth;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h2 className="text-3xl font-black text-github-text tracking-tight uppercase">Extrato</h2>
            <p className="text-sm text-github-muted">Controle detalhado de entradas e saídas</p>
        </div>
        
        <div className="flex items-center bg-github-surface border border-github-border rounded-2xl p-1 shadow-sm">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-github-border rounded-lg text-github-muted transition-all"><ChevronLeft size={20} /></button>
          <div className="relative px-4 text-center group cursor-pointer">
             <span className="text-sm font-black uppercase tracking-tighter block w-32 text-github-text">{currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
             <input type="month" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleDateChange} value={`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`} />
          </div>
          <button onClick={() => changeMonth(1)} className="p-2 hover:bg-github-border rounded-lg text-github-muted transition-all"><ChevronRight size={20} /></button>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
            <Button onClick={() => setTransactionModalOpen(true)} variant="primary" className="flex-1 md:flex-none px-8 py-3 rounded-2xl shadow-xl shadow-github-success/10"><Plus size={20} /> Nova Transação</Button>
        </div>
      </div>

      <div className="flex gap-3 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 text-github-muted" size={20} />
          <input placeholder="Buscar por descrição..." className="w-full pl-12 pr-4 py-3.5 bg-github-surface border border-github-border rounded-2xl text-github-text outline-none focus:border-github-primary shadow-inner font-bold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <select className="bg-github-surface border border-github-border rounded-2xl px-6 py-3.5 text-sm font-black uppercase outline-none text-github-text shadow-sm appearance-none cursor-pointer" value={filterType} onChange={(e) => setFilterType(e.target.value as any)}>
          <option value="all">Todos os tipos</option>
          <option value="income">Apenas Entradas</option>
          <option value="expense">Apenas Saídas</option>
          <option value="transfer">Transferências</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(t => {
          const cat = categories.find(c => c.id === t.categoryId);
          const bank = banks.find(b => b.id === t.bankId);
          const toBank = banks.find(b => b.id === t.toBankId);
          const isExp = t.type === 'expense';
          const isInc = t.type === 'income';
          const isTrans = t.type === 'transfer';
          
          return (
            <Card key={t.id} className={`p-5 hover:border-github-primary transition-all group border-l-8 ${
                isTrans ? 'border-l-github-primary' : (isInc ? 'border-l-github-success' : 'border-l-github-danger')
            }`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-black uppercase text-github-muted bg-github-bg px-2 py-0.5 rounded-lg border border-github-border">{formatDate(t.date)}</span>
                    {t.isCreditCard && <CreditCard size={12} className="text-github-purple" />}
                    {t.isChargeback && <Undo2 size={12} className="text-github-success" />}
                  </div>
                  <h3 className="font-bold text-github-text truncate pr-6">
                    {t.description}
                    {t.installments && t.installments > 1 && (
                      <span className="ml-2 text-[9px] font-black bg-github-surface px-1.5 py-0.5 rounded-lg border border-github-border text-github-purple">
                        {t.installmentNumber}/{t.installments}
                      </span>
                    )}
                  </h3>
                </div>
                <div className="text-right">
                  <p className={`font-mono text-lg font-black ${isInc ? 'text-github-success' : (isExp ? 'text-github-danger' : 'text-github-text')}`}>
                    {isInc ? '+' : (isExp ? '-' : '')}{formatCurrency(t.amount)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-github-bg border border-github-border rounded-xl">
                        <Tag size={10} style={{ color: cat?.color || 'gray' }} />
                        <span className="text-[10px] font-bold uppercase tracking-tighter text-github-text">{cat?.name || 'Sistema'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-github-bg border border-github-border rounded-xl">
                        <Wallet size={10} className="text-github-muted" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter text-github-muted">
                            {bank?.name} {isTrans && toBank && <><ArrowRightLeft size={8} className="mx-1"/> {toBank.name}</>}
                        </span>
                    </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {t.isCreditCard && !t.isChargeback && (
                        <button onClick={() => handleChargeback(t)} className="p-2 text-github-muted hover:text-github-success bg-github-bg rounded-lg transition-colors"><Undo2 size={14} /></button>
                    )}
                    <button onClick={() => handleDeleteRequest(t)} className="p-2 text-github-muted hover:text-github-danger bg-github-bg rounded-lg transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <Card className="p-20 text-center border-dashed border-2 border-github-border bg-transparent">
          <Calendar size={48} className="mx-auto mb-4 text-github-muted opacity-20" />
          <p className="font-black uppercase tracking-widest text-github-muted">Nenhum lançamento neste mês</p>
        </Card>
      )}

      {deleteModal.show && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-4 backdrop-blur-md">
              <Card className="w-full max-w-sm p-8 border-github-danger border shadow-2xl animate-in zoom-in-95">
                  <div className="flex items-center gap-3 mb-4 text-github-danger">
                      <AlertTriangle size={32} />
                      <h3 className="text-xl font-black uppercase tracking-tighter">Excluir Série?</h3>
                  </div>
                  <p className="text-sm text-github-text mb-8">Esta transação é recorrente. Deseja excluir apenas este lançamento ou toda a série futura?</p>
                  <div className="grid grid-cols-1 gap-3">
                      <Button onClick={() => confirmDeleteSeries(false)} variant="secondary" className="w-full py-4 text-xs font-black uppercase">Excluir Apenas Este</Button>
                      <Button onClick={() => confirmDeleteSeries(true)} variant="danger" className="w-full py-4 text-xs font-black uppercase">Excluir Toda a Série</Button>
                      <button onClick={() => setDeleteModal({show:false, txId:'', isSeries:false})} className="mt-2 text-xs font-black uppercase text-github-muted hover:text-github-text">Cancelar</button>
                  </div>
              </Card>
          </div>
      )}
    </div>
  );
};
