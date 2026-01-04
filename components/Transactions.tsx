
import React, { useState } from 'react';
import { useApp } from '../context';
import { Card, Button } from './Layout';
import { formatCurrency, formatDate, formatDateTime } from '../utils';
import { Plus, Trash2, Search, ArrowRightLeft, CreditCard, ChevronLeft, ChevronRight, AlertTriangle, Wallet, Tag, Undo2, Edit2 } from 'lucide-react';
import { TransactionType, Transaction } from '../types';

export const Transactions = () => {
  const { transactions, categories, banks, deleteTransaction, chargebackTransaction, setTransactionModalOpen, setEditingTransaction } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');

  const [deleteModal, setDeleteModal] = useState<{show: boolean, txId: string, isSeries: boolean}>({show: false, txId: '', isSeries: false});
  const [isChargingBack, setIsChargingBack] = useState<string | null>(null);

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
    if (isChargingBack === t.id) return;
    if (window.confirm(`Deseja estornar "${t.description}"?`)) {
        setIsChargingBack(t.id);
        try {
            await chargebackTransaction(t);
        } catch (error) {
            console.error('Erro ao estornar transação:', error);
            alert(error instanceof Error ? error.message : 'Erro ao estornar transação. Tente novamente.');
        } finally {
            setIsChargingBack(null);
        }
    }
  }

  const filtered = transactions.filter(t => {
    const tDate = new Date(t.date);
    const matchMonth = tDate.getUTCMonth() === currentDate.getMonth() && tDate.getUTCFullYear() === currentDate.getFullYear();
    const matchSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'all' || t.type === filterType;
    return matchSearch && matchType && matchMonth;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredNormal = filtered.filter(t => !t.isCreditCard);
  const filteredCreditCard = filtered.filter(t => t.isCreditCard);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      <div className="flex flex-col gap-4">
        <div>
            <h2 className="text-2xl md:text-3xl font-black text-github-text tracking-tight uppercase">Extrato</h2>
            <p className="text-xs md:text-sm text-github-muted">Controle detalhado de entradas e saídas</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
          <div className="flex items-center bg-github-surface border border-github-border rounded-2xl p-1 shadow-sm flex-1 sm:flex-none">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-github-border rounded-lg text-github-muted transition-all"><ChevronLeft size={16} className="md:hidden" /><ChevronLeft size={18} className="hidden md:block" /></button>
            <div className="relative px-2 md:px-4 text-center group cursor-pointer flex-1">
               <span className="text-[9px] md:text-sm font-black uppercase tracking-tighter block text-github-text whitespace-nowrap">{currentDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}</span>
               <input type="month" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleDateChange} value={`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`} />
            </div>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-github-border rounded-lg text-github-muted transition-all"><ChevronRight size={16} className="md:hidden" /><ChevronRight size={18} className="hidden md:block" /></button>
          </div>
          
          <Button onClick={() => { setEditingTransaction(null); setTransactionModalOpen(true); }} variant="primary" className="w-full sm:w-auto px-3 md:px-8 py-3 rounded-2xl shadow-xl shadow-github-success/10 text-xs md:text-sm whitespace-nowrap"><Plus size={14} className="md:hidden" /><Plus size={18} className="hidden md:block" /> <span className="hidden sm:inline">Nova</span><span className="sm:hidden">+</span><span className="hidden sm:inline"> Tx</span></Button>
        </div>
      </div>

      <div className="flex gap-2 md:gap-3 flex-col sm:flex-row">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-2.5 md:top-3.5 md:hidden text-github-muted flex-shrink-0" size={14} />
          <Search className="absolute left-4 top-3.5 hidden md:block text-github-muted" size={18} />
          <input placeholder="Buscar..." className="w-full pl-9 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3.5 text-xs md:text-sm bg-github-surface border border-github-border rounded-2xl text-github-text outline-none focus:border-github-primary shadow-inner font-bold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <select className="bg-github-surface border border-github-border rounded-2xl px-3 md:px-4 py-2.5 md:py-3.5 text-xs md:text-sm font-black uppercase outline-none text-github-text shadow-sm appearance-none cursor-pointer flex-shrink-0" value={filterType} onChange={(e) => setFilterType(e.target.value as any)}>
          <option value="all">Todos</option>
          <option value="income">↑ Entrada</option>
          <option value="expense">↓ Saída</option>
          <option value="transfer">↔ Transfer</option>
        </select>
      </div>

      {/* Lançamentos Normais */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Wallet size={18} className="md:block hidden text-github-primary" />
          <Wallet size={16} className="md:hidden text-github-primary" />
          <h3 className="text-base md:text-lg font-black text-github-text uppercase tracking-tighter">Lançamentos em Contas</h3>
          <div className="flex-1 h-px bg-github-border"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {filteredNormal.map(t => {
            const cat = categories.find(c => c.id === t.categoryId);
            const bank = banks.find(b => b.id === t.bankId);
            const toBank = banks.find(b => b.id === t.toBankId);
            const isExp = t.type === 'expense';
            const isInc = t.type === 'income';
            const isTrans = t.type === 'transfer';
            
            return (
              <Card key={t.id} className={`p-3 md:p-5 hover:border-github-primary transition-all group border-l-4 md:border-l-8 ${
                  isTrans ? 'border-l-github-primary' : (isInc ? 'border-l-github-success' : 'border-l-github-danger')
              }`}>
                <div className="flex justify-between items-start gap-2 md:gap-4 mb-3 md:mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className="text-[7px] md:text-[10px] font-black uppercase text-github-muted bg-github-bg px-1.5 md:px-2 py-0.5 rounded-lg border border-github-border whitespace-nowrap">{formatDateTime(t.date)}</span>
                      {t.isChargeback && (
                        <>
                          <Undo2 size={10} className="hidden md:block text-github-success" />
                          <Undo2 size={8} className="md:hidden text-github-success" />
                        </>
                      )}
                    </div>
                    <h3 className="font-bold text-xs md:text-sm text-github-text truncate pr-2">
                      {t.description}
                    </h3>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-mono text-sm md:text-lg font-black ${isInc ? 'text-github-success' : (isExp ? 'text-github-danger' : 'text-github-text')}`}>
                      {isInc ? '+' : (isExp ? '-' : '')}{formatCurrency(t.amount)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 md:gap-3">
                  <div className="flex gap-1 md:gap-2 flex-wrap">
                      <div className="flex items-center gap-1 px-1.5 md:px-2 py-0.5 bg-github-bg border border-github-border rounded-lg md:rounded-xl">
                          <Tag size={8} className="hidden md:block" style={{ color: cat?.color || 'gray' }} /><Tag size={7} className="md:hidden" style={{ color: cat?.color || 'gray' }} />
                          <span className="text-[7px] md:text-[10px] font-bold uppercase tracking-tighter text-github-text truncate">{cat?.name || 'Sistema'}</span>
                      </div>
                      <div className="flex items-center gap-1 px-1.5 md:px-2 py-0.5 bg-github-bg border border-github-border rounded-lg md:rounded-xl">
                          <Wallet size={8} className="hidden md:block text-github-muted" /><Wallet size={7} className="md:hidden text-github-muted" />
                          <span className="text-[7px] md:text-[10px] font-bold uppercase tracking-tighter text-github-muted truncate">
                              {bank?.name?.slice(0, 8)} {isTrans && toBank && <><ArrowRightLeft size={6} className="mx-0.5"/> {toBank.name?.slice(0, 8)}</>}
                          </span>
                      </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                      <button onClick={() => { setEditingTransaction(t); setTransactionModalOpen(true); }} className="p-1.5 md:p-2 text-github-muted hover:text-github-primary bg-github-bg rounded-lg transition-colors"><Edit2 size={12} className="md:hidden" /><Edit2 size={14} className="hidden md:block" /></button>
                      <button onClick={() => handleDeleteRequest(t)} className="p-2 text-github-muted hover:text-github-danger bg-github-bg rounded-lg transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {filteredNormal.length === 0 && (
          <Card className="p-20 text-center border-dashed border-2 border-github-border bg-transparent">
            <Wallet size={48} className="mx-auto mb-4 text-github-muted opacity-20" />
            <p className="font-black uppercase tracking-widest text-github-muted">Nenhum lançamento em contas neste mês</p>
          </Card>
        )}
      </div>

      {/* Lançamentos do Cartão de Crédito */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <CreditCard size={20} className="text-github-purple" />
          <h3 className="text-lg font-black text-github-text uppercase tracking-tighter">Lançamentos no Cartão de Crédito</h3>
          <div className="flex-1 h-px bg-github-border"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCreditCard.map(t => {
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
                      <span className="text-[10px] font-black uppercase text-github-muted bg-github-bg px-2 py-0.5 rounded-lg border border-github-border">{formatDateTime(t.date)}</span>
                      <CreditCard size={12} className="text-github-purple" />
                      {t.isChargeback && <Undo2 size={12} className="text-github-success" />}
                      {t.installments && t.installments > 1 && (
                        <span className="text-[9px] font-black bg-github-surface px-1.5 py-0.5 rounded-lg border border-github-border text-github-purple">
                          {t.installmentNumber}/{t.installments}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-github-text truncate pr-6">
                      {t.description}
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
                      <button onClick={() => { setEditingTransaction(t); setTransactionModalOpen(true); }} className="p-2 text-github-muted hover:text-github-primary bg-github-bg rounded-lg transition-colors"><Edit2 size={14} /></button>
                      {!t.isChargeback && (
                          <button 
                            onClick={() => handleChargeback(t)} 
                            disabled={isChargingBack === t.id}
                            className="p-1.5 md:p-2 text-github-muted hover:text-github-success bg-github-bg rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Undo2 size={12} className="md:hidden" /><Undo2 size={14} className="hidden md:block" />
                          </button>
                      )}
                      <button onClick={() => handleDeleteRequest(t)} className="p-1.5 md:p-2 text-github-muted hover:text-github-danger bg-github-bg rounded-lg transition-colors"><Trash2 size={12} className="md:hidden" /><Trash2 size={14} className="hidden md:block" /></button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {filteredCreditCard.length === 0 && (
          <Card className="p-20 text-center border-dashed border-2 border-github-border bg-transparent">
            <CreditCard size={48} className="mx-auto mb-4 text-github-muted opacity-20" />
            <p className="font-black uppercase tracking-widest text-github-muted">Nenhum lançamento no cartão neste mês</p>
          </Card>
        )}
      </div>

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
