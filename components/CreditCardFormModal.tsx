
import React, { useState, useEffect } from 'react';
import { useApp } from '../context';
import { Card, Button } from './Layout';
import { X, CreditCard, ShieldCheck, Save } from 'lucide-react';
import { Bank } from '../types';

interface CreditCardFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCard?: Bank;
}

export const CreditCardFormModal: React.FC<CreditCardFormModalProps> = ({ isOpen, onClose, editingCard }) => {
  const { addBank, updateBank } = useApp();
  const [formData, setFormData] = useState({ 
    name: '', 
    limit: '', 
    closing: '1', 
    due: '10', 
    color: '#bc8cff' 
  });

  useEffect(() => {
    if (editingCard) {
        setFormData({
            name: editingCard.name,
            limit: (editingCard.limit || 0).toString(),
            closing: (editingCard.creditCardClosingDay || 1).toString(),
            due: (editingCard.creditCardDueDay || 10).toString(),
            color: editingCard.color
        });
    } else {
        setFormData({ name: '', limit: '', closing: '1', due: '10', color: '#bc8cff' });
    }
  }, [editingCard, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.limit) return;

    if (editingCard) {
        updateBank({
            ...editingCard,
            name: formData.name,
            color: formData.color,
            creditCardClosingDay: parseInt(formData.closing),
            creditCardDueDay: parseInt(formData.due),
            limit: parseFloat(formData.limit)
        });
    } else {
        addBank({
            name: formData.name,
            type: 'credit',
            balance: 0,
            color: formData.color,
            creditCardClosingDay: parseInt(formData.closing),
            creditCardDueDay: parseInt(formData.due),
            limit: parseFloat(formData.limit)
        });
    }
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[120] p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-lg p-8 border-github-purple border shadow-2xl animate-in zoom-in-95 duration-200 rounded-[2.5rem]">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-github-purple/10 text-github-purple rounded-2xl border border-github-purple/20">
              <CreditCard size={28} />
            </div>
            <div>
              <h3 className="text-xl font-black text-github-text uppercase tracking-tighter">
                {editingCard ? 'Editar Cartão' : 'Novo Cartão'}
              </h3>
              <p className="text-xs text-github-muted font-medium">Gestão de limites e datas da fatura</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-github-muted hover:text-github-text bg-github-bg rounded-xl transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black uppercase text-github-muted tracking-widest px-1">Nome do Cartão</label>
              <div className="flex gap-3">
                <input 
                  type="color" 
                  value={formData.color} 
                  onChange={e => setFormData({...formData, color: e.target.value})} 
                  className="w-14 h-14 bg-github-bg border border-github-border rounded-2xl cursor-pointer p-1"
                />
                <input 
                  required 
                  autoFocus
                  placeholder="Ex: Nubank, Inter, Black..." 
                  className="flex-1 bg-github-bg border border-github-border rounded-2xl px-5 py-3 text-github-text outline-none focus:border-github-purple transition-all font-bold shadow-inner"
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-github-muted tracking-widest px-1">Limite Total (R$)</label>
              <input 
                required 
                type="number" 
                step="0.01"
                placeholder="0,00" 
                className="w-full bg-github-bg border border-github-border rounded-2xl px-5 py-4 text-github-text outline-none focus:border-github-purple transition-all font-mono font-black shadow-inner"
                value={formData.limit} 
                onChange={e => setFormData({...formData, limit: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-github-muted tracking-widest px-1">Dia Fechamento</label>
                <input 
                  type="number" 
                  min="1" 
                  max="31"
                  className="w-full bg-github-bg border border-github-border rounded-2xl px-5 py-4 text-github-text outline-none focus:border-github-purple transition-all font-bold shadow-inner"
                  value={formData.closing} 
                  onChange={e => setFormData({...formData, closing: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-github-muted tracking-widest px-1">Dia Vencimento</label>
                <input 
                  type="number" 
                  min="1" 
                  max="31"
                  className="w-full bg-github-bg border border-github-border rounded-2xl px-5 py-4 text-github-text outline-none focus:border-github-purple transition-all font-bold shadow-inner"
                  value={formData.due} 
                  onChange={e => setFormData({...formData, due: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="bg-github-bg/50 p-4 rounded-2xl border border-github-border flex items-start gap-3">
             <ShieldCheck size={20} className="text-github-purple flex-shrink-0 mt-0.5" />
             <p className="text-[10px] text-github-muted leading-relaxed font-medium">
               A data de fechamento define quais compras entram na fatura deste mês. A data de vencimento define o limite de pagamento sem juros.
             </p>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-github-border">
            <Button onClick={onClose} variant="secondary" className="px-8 py-4 rounded-2xl">Cancelar</Button>
            <Button type="submit" variant="primary" className="bg-github-purple hover:bg-purple-600 px-10 py-4 rounded-2xl shadow-xl shadow-github-purple/20">
               {editingCard ? 'Salvar Alterações' : 'Cadastrar Cartão'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
