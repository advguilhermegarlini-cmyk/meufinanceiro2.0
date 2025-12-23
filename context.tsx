
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Transaction, Category, Bank, DashboardStats, Investment, InvoiceStats, HealthThresholds, Subscription } from './types';
import { generateId, GITHUB_COLORS } from './utils';
import { AuthService, DataService } from './services/api';

export const SYSTEM_CATEGORY_ID = 'system_internal';

const DEFAULT_THRESHOLDS: HealthThresholds = {
  critical: -500,
  attention: 0,
  moderate: 1000,
  good: 2000
};

interface AppContextType {
  user: User | null;
  theme: 'light' | 'dark';
  appLogo: string | null;
  toggleTheme: () => void;
  updateAppLogo: (base64: string | null) => void;
  isLoading: boolean;
  
  isTransactionModalOpen: boolean;
  setTransactionModalOpen: (open: boolean) => void;

  login: (email: string, password?: string) => Promise<void>;
  register: (name: string, email: string, password?: string) => Promise<void>;
  updateUserProfile: (name: string, timezone: string) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  changePassword: (oldPass: string, newPass: string) => Promise<void>;
  resetPassword: (email: string, newPass: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  logout: () => void;
  
  transactions: Transaction[];
  categories: Category[];
  banks: Bank[];
  investments: Investment[];
  subscriptions: Subscription[];
  healthThresholds: HealthThresholds;
  updateHealthThresholds: (t: HealthThresholds) => void;
  
  addTransaction: (t: Omit<Transaction, 'id'>, recurrence?: { frequency: string, times: number }) => Promise<void>;
  deleteTransaction: (id: string, deleteFutureSeries?: boolean) => Promise<void>;
  updateTransaction: (t: Transaction) => Promise<void>;
  chargebackTransaction: (id: string | Transaction) => Promise<void>;
  
  payInvoice: (cardId: string, amount: number, paymentDate: Date, sourceBankId: string, referenceMonth: string, isFullPayment: boolean) => Promise<void>;
  reopenInvoice: (cardId: string, referenceMonth: string) => Promise<void>;

  addCategory: (name: string, type: 'income' | 'expense') => Promise<Category>;
  updateCategory: (c: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  addBank: (bank: Omit<Bank, 'id'>) => Promise<Bank>;
  updateBank: (bank: Bank) => Promise<void>;
  deleteBank: (id: string) => Promise<void>;

  addInvestment: (inv: Omit<Investment, 'id'>) => Promise<void>;
  updateInvestment: (inv: Investment) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;
  handleInvestmentTransaction: (investmentId: string, amount: number, type: 'in' | 'out') => Promise<void>;

  addSubscription: (sub: Omit<Subscription, 'id'>) => Promise<void>;
  updateSubscription: (sub: Subscription) => Promise<void>;
  deleteSubscription: (id: string) => Promise<void>;

  getDashboardStats: (date: Date) => DashboardStats;
  getBankBalanceAtDate: (bankId: string, date: Date) => number;
  getOverallBalanceAtDate: (date: Date) => number;
  getInvoiceStats: (cardId: string, date: Date) => InvoiceStats;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children?: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [appLogo, setAppLogo] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [healthThresholds, setHealthThresholds] = useState<HealthThresholds>(DEFAULT_THRESHOLDS);
  const [isTransactionModalOpen, setTransactionModalOpen] = useState(false);

  useEffect(() => {
    const init = async () => {
        try {
            const storedUser = localStorage.getItem('mc_user');
            const storedTheme = localStorage.getItem('mc_theme') as 'light' | 'dark';
            const storedThresholds = localStorage.getItem('mc_thresholds');
            const storedLogo = localStorage.getItem('mc_app_logo');
            
            if (storedTheme) setTheme(storedTheme);
            if (storedThresholds) setHealthThresholds(JSON.parse(storedThresholds));
            if (storedLogo) setAppLogo(storedLogo);
            if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
            }
        } catch (error) { console.error("Failed to load session", error); }
    };
    init();
  }, []);

  useEffect(() => {
      const fetchData = async () => {
          if (!user) return;
          setIsLoading(true);
          try {
              const [txs, cats, bks, invs, subs] = await Promise.all([
                  DataService.getTransactions(user.id),
                  DataService.getCategories(user.id),
                  DataService.getBanks(user.id),
                  DataService.getInvestments(user.id),
                  DataService.getSubscriptions(user.id)
              ]);
              setTransactions(txs || []);
              setCategories(cats || []);
              setBanks(bks || []);
              setInvestments(invs || []);
              setSubscriptions(subs || []);
          } catch (e) { console.error("Error fetching data:", e); } finally { setIsLoading(false); }
      };
      fetchData();
  }, [user]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('mc_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const updateAppLogo = (base64: string | null) => {
    setAppLogo(base64);
    if (base64) localStorage.setItem('mc_app_logo', base64);
    else localStorage.removeItem('mc_app_logo');
  };

  const updateHealthThresholds = (t: HealthThresholds) => {
    setHealthThresholds(t);
    localStorage.setItem('mc_thresholds', JSON.stringify(t));
  };

  const login = async (email: string, password?: string) => {
    const loggedUser = await AuthService.login(email, password);
    setUser(loggedUser);
    localStorage.setItem('mc_user', JSON.stringify(loggedUser));
  };

  const register = async (name: string, email: string, password?: string) => {
     const newUser = await AuthService.register(name, email, password);
     setUser(newUser);
     localStorage.setItem('mc_user', JSON.stringify(newUser));
  }

  const updateUserProfile = async (name: string, timezone: string) => {
      if(!user) return;
      const updated = { ...user, displayName: name };
      const result = await AuthService.updateUser(updated);
      setUser(result);
      localStorage.setItem('mc_user', JSON.stringify(result));
  }

  const uploadAvatar = async (file: File): Promise<void> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = async () => {
              if(!user) return reject("No user");
              const base64 = reader.result as string;
              const updated = { ...user, photoURL: base64 };
              try {
                  const result = await AuthService.updateUser(updated);
                  setUser(result);
                  localStorage.setItem('mc_user', JSON.stringify(result));
                  resolve();
              } catch (e) { reject(e); }
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
      });
  };
  
  const changePassword = async (oldPass: string, newPass: string) => {
      if(!user) throw new Error("Not logged in");
      await AuthService.changePassword(user.id, oldPass, newPass);
  };

  const resetPassword = async (email: string, newPass: string) => {
      await AuthService.resetPassword(email, newPass);
  };

  const deleteAccount = async () => {
    if (!user) return;
    await AuthService.deleteUser(user.id);
    logout();
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mc_user');
    setTransactions([]);
    setBanks([]);
    setInvestments([]);
    setCategories([]);
    setSubscriptions([]);
  };

  const addTransaction = async (t: Omit<Transaction, 'id'>, recurrence?: { frequency: string, times: number }) => {
    if (!user) return;
    const newTxList: Transaction[] = [];
    const bankUpdates: {id: string, balance: number}[] = [];
    
    if (t.type === 'transfer' && t.toBankId) {
       const transferTx: Transaction = { ...t, id: generateId(), categoryId: SYSTEM_CATEGORY_ID };
       newTxList.push(transferTx);
       const source = banks.find(b => b.id === t.bankId);
       const dest = banks.find(b => b.id === t.toBankId);
       if(source) bankUpdates.push({ id: source.id, balance: (source.balance || 0) - t.amount });
       if(dest) bankUpdates.push({ id: dest.id, balance: (dest.balance || 0) + t.amount });
    } 
    else if (recurrence && recurrence.times > 1) {
        const groupId = generateId();
        const originalDate = new Date(t.date);
        for (let i = 0; i < recurrence.times; i++) {
            const newDate = new Date(originalDate);
            if (recurrence.frequency === 'daily') newDate.setDate(newDate.getDate() + i);
            if (recurrence.frequency === 'weekly') newDate.setDate(newDate.getDate() + (i * 7));
            if (recurrence.frequency === 'monthly') newDate.setMonth(newDate.getMonth() + i);
            if (recurrence.frequency === 'yearly') newDate.setFullYear(newDate.getFullYear() + i);
            newTxList.push({ ...t, id: generateId(), date: newDate.toISOString(), recurrenceGroupId: groupId, recurrenceFrequency: recurrence.frequency as any });
        }
        if (!t.isCreditCard) {
            const totalAmount = newTxList.reduce((acc, curr) => acc + curr.amount, 0);
            const b = banks.find(b => b.id === t.bankId);
            if(b) bankUpdates.push({ id: b.id, balance: (b.balance || 0) + (totalAmount * (t.type === 'income' ? 1 : -1)) });
        }
    }
    else if (t.isCreditCard && t.type === 'expense') {
        const bank = banks.find(b => b.id === t.bankId);
        const closingDay = bank?.creditCardClosingDay || 1;
        const purchaseDate = new Date(t.date);
        const purchaseDay = purchaseDate.getUTCDate();
        let targetMonth = purchaseDate.getUTCMonth();
        let targetYear = purchaseDate.getUTCFullYear();
        if (purchaseDay > closingDay) { targetMonth++; if (targetMonth > 11) { targetMonth = 0; targetYear++; } }
        const numInstallments = t.installments && t.installments > 0 ? t.installments : 1;
        const installmentAmount = t.amount / numInstallments;
        const parentId = generateId();
        for (let i = 0; i < numInstallments; i++) {
            let instMonth = targetMonth + i;
            let instYear = targetYear;
            while (instMonth > 11) { instMonth -= 12; instYear++; }
            const referenceMonth = `${instYear}-${String(instMonth + 1).padStart(2, '0')}`;
            newTxList.push({ 
                ...t, 
                id: i === 0 ? parentId : generateId(), 
                originalTransactionId: parentId, 
                amount: installmentAmount, 
                date: new Date(instYear, instMonth, bank?.creditCardDueDay || 10).toISOString(), 
                installmentNumber: i + 1, 
                installments: numInstallments,
                invoiceReference: referenceMonth,
                notes: `Compra em ${purchaseDate.toLocaleDateString('pt-BR')} (Parcela ${i+1}/${numInstallments})` 
            });
        }
    } 
    else {
      newTxList.push({ ...t, id: generateId() });
      if (!t.isCreditCard) {
          const b = banks.find(b => b.id === t.bankId);
          if (b) bankUpdates.push({ id: b.id, balance: (b.balance || 0) + (t.amount * (t.type === 'income' ? 1 : -1)) });
      }
    }

    await DataService.createTransactionsBatch(user.id, newTxList);
    if (bankUpdates.length > 0) await DataService.updateBankBalances(user.id, bankUpdates);

    setTransactions(prev => [...newTxList, ...prev]);
    if (bankUpdates.length > 0) {
        setBanks(prev => prev.map(b => {
            const update = bankUpdates.find(u => u.id === b.id);
            return update ? { ...b, balance: update.balance } : b;
        }));
    }
  };

  const deleteTransaction = async (id: string, deleteFutureSeries: boolean = false) => {
    if(!user) return;
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;
    let idsToDelete = [id];
    if (tx.isCreditCard && (tx.installments || 0) > 1) {
        const rootId = tx.originalTransactionId || tx.id;
        idsToDelete = transactions.filter(t => t.id === rootId || t.originalTransactionId === rootId).map(t => t.id);
    }
    else if (deleteFutureSeries && tx.recurrenceGroupId) {
        const txDate = new Date(tx.date);
        idsToDelete = transactions.filter(t => t.recurrenceGroupId === tx.recurrenceGroupId && new Date(t.date) >= txDate).map(t => t.id);
    }

    const txsToDelete = transactions.filter(t => idsToDelete.includes(t.id));
    let tempBanks = [...banks];
    let txsToUpdate: Transaction[] = [];

    txsToDelete.forEach(curr => {
         if (curr.type === 'transfer' && curr.toBankId) {
             const sIdx = tempBanks.findIndex(b => b.id === curr.bankId);
             const dIdx = tempBanks.findIndex(b => b.id === curr.toBankId);
             if(sIdx > -1) tempBanks[sIdx].balance = (tempBanks[sIdx].balance || 0) + curr.amount;
             if(dIdx > -1) tempBanks[dIdx].balance = (tempBanks[dIdx].balance || 0) - curr.amount;
         } else if (!curr.isCreditCard) {
             const idx = tempBanks.findIndex(b => b.id === curr.bankId);
             if(idx > -1) tempBanks[idx].balance = (tempBanks[idx].balance || 0) + (curr.amount * (curr.type === 'income' ? -1 : 1));
         }

         if (curr.isInvoicePayment && curr.invoiceReference && curr.toBankId) {
             transactions.forEach(t => {
                 if (t.bankId === curr.toBankId && t.isCreditCard && t.invoiceReference === curr.invoiceReference && t.type === 'expense') {
                     txsToUpdate.push({ ...t, isReconciled: false });
                 }
             });
         }
    });

    await DataService.deleteTransactions(user.id, idsToDelete);
    const changedBanks = tempBanks.filter(tb => {
        const original = banks.find(b => b.id === tb.id);
        return original && original.balance !== tb.balance;
    });
    if(changedBanks.length > 0) await DataService.updateBankBalances(user.id, changedBanks.map(b => ({id: b.id, balance: b.balance})));
    for (const t of txsToUpdate) await DataService.updateTransaction(user.id, t);

    setTransactions(prev => {
        const remaining = prev.filter(t => !idsToDelete.includes(t.id));
        return remaining.map(t => {
            const updated = txsToUpdate.find(u => u.id === t.id);
            return updated ? updated : t;
        });
    });
    setBanks(tempBanks);
  };

  const updateTransaction = async (t: Transaction) => {
    if(!user) return;
    await DataService.updateTransaction(user.id, t);
    setTransactions(prev => prev.map(curr => curr.id === t.id ? t : curr));
  };

  const chargebackTransaction = async (item: string | Transaction) => {
    if(!user) return;
    let original: Transaction | undefined;
    if (typeof item === 'string') {
        original = transactions.find(t => t.id === item);
    } else {
        original = item;
    }

    if (!original) return;

    const chargebackTx: Transaction = {
        id: generateId(),
        description: `Estorno: ${original.description}`,
        amount: original.amount,
        date: new Date().toISOString(),
        type: 'income',
        categoryId: original.categoryId,
        bankId: original.bankId,
        isCreditCard: original.isCreditCard,
        isReconciled: original.isCreditCard ? false : true,
        invoiceReference: original.invoiceReference,
        isChargeback: true,
        notes: `Estorno referente à transação realizada em ${new Date(original.date).toLocaleDateString('pt-BR')}`
    };

    await DataService.createTransaction(user.id, chargebackTx);
    
    if (!original.isCreditCard) {
        const bank = banks.find(b => b.id === original?.bankId);
        if (bank) {
            const newBalance = (bank.balance || 0) + original.amount;
            await DataService.updateBankBalance(user.id, bank.id, newBalance);
            setBanks(prev => prev.map(b => b.id === bank.id ? { ...b, balance: newBalance } : b));
        }
    }

    setTransactions(prev => [chargebackTx, ...prev]);
  };

  const payInvoice = async (cardId: string, amount: number, paymentDate: Date, sourceBankId: string, referenceMonth: string, isFullPayment: boolean) => {
    if(!user) return;
    const sourceBank = banks.find(b => b.id === sourceBankId);
    if (!sourceBank) return;
    
    const newSourceBalance = (sourceBank.balance || 0) - amount;
    const dateStr = paymentDate.toISOString();

    const paymentTx: Transaction = { 
        id: generateId(), 
        description: `Pagamento Fatura ${referenceMonth}`, 
        amount, 
        date: dateStr, 
        type: 'expense', 
        categoryId: SYSTEM_CATEGORY_ID, 
        bankId: sourceBankId, 
        toBankId: cardId, 
        isCreditCard: false, 
        isReconciled: true,
        invoiceReference: referenceMonth,
        isInvoicePayment: true
    };

    let txsToUpdate: Transaction[] = [];
    if (isFullPayment) {
        transactions.forEach(t => {
             if (t.bankId === cardId && t.isCreditCard && !t.isReconciled && t.type === 'expense' && t.invoiceReference === referenceMonth) {
                txsToUpdate.push({ ...t, isReconciled: true });
            }
        });
    }

    await DataService.updateBankBalance(user.id, sourceBankId, newSourceBalance);
    await DataService.createTransaction(user.id, paymentTx);
    for (const t of txsToUpdate) await DataService.updateTransaction(user.id, t);
    
    setBanks(prev => prev.map(b => b.id === sourceBankId ? { ...b, balance: newSourceBalance } : b));
    setTransactions(prev => {
        const updatedIds = txsToUpdate.map(t => t.id);
        const merged = prev.map(p => updatedIds.includes(p.id) ? { ...p, isReconciled: true } : p);
        return [paymentTx, ...merged];
    });
  };

  const reopenInvoice = async (cardId: string, referenceMonth: string) => {
      if(!user) return;
      const paymentTxs = transactions.filter(t => 
          t.invoiceReference === referenceMonth && 
          t.isInvoicePayment === true &&
          t.toBankId === cardId
      );
      if (paymentTxs.length === 0) return;
      for (const pt of paymentTxs) {
          await deleteTransaction(pt.id);
      }
  };

  const addCategory = async (name: string, type: 'income' | 'expense'): Promise<Category> => {
    if(!user) throw new Error("No user");
    const color = GITHUB_COLORS[categories.length % GITHUB_COLORS.length];
    const newCat = { id: generateId(), name, color, type };
    await DataService.createCategory(user.id, newCat);
    setCategories(prev => [...prev, newCat]);
    return newCat;
  };

  const updateCategory = async (c: Category) => {
    if(!user) return;
    await DataService.updateCategory(user.id, c);
    setCategories(prev => prev.map(cat => cat.id === c.id ? c : cat));
  };

  const deleteCategory = async (id: string) => {
    if(!user) return;
    if (transactions.some(t => t.categoryId === id)) { alert("Não é possível excluir categoria em uso."); return; }
    await DataService.deleteCategory(user.id, id);
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const addBank = async (bank: Omit<Bank, 'id'>): Promise<Bank> => {
    if(!user) throw new Error("No user");
    const newBank = { ...bank, id: generateId() };
    await DataService.saveBank(user.id, newBank);
    setBanks(prev => [...prev, newBank]);
    return newBank;
  };

  const updateBank = async (bank: Bank) => {
    if(!user) return;
    await DataService.saveBank(user.id, bank);
    setBanks(prev => prev.map(b => b.id === bank.id ? bank : b));
  };

  const deleteBank = async (id: string) => {
    if(!user) return;
    if (transactions.some(t => t.bankId === id || t.toBankId === id)) {
        alert("Não é possível excluir conta/cartão que possua lançamentos. Apague os lançamentos primeiro.");
        return;
    }
    await DataService.deleteBank(user.id, id);
    setBanks(prev => prev.filter(b => b.id !== id));
  };

  const addInvestment = async (inv: Omit<Investment, 'id'>) => {
    if(!user) return;
    const newInv = { ...inv, id: generateId() };
    await DataService.saveInvestment(user.id, newInv);
    setInvestments(prev => [...prev, newInv]);
  };

  const updateInvestment = async (inv: Investment) => {
    if(!user) return;
    await DataService.saveInvestment(user.id, inv);
    setInvestments(prev => prev.map(i => i.id === inv.id ? inv : i));
  };

  const deleteInvestment = async (id: string) => {
    if(!user) return;
    await DataService.deleteInvestment(user.id, id);
    setInvestments(prev => prev.filter(i => i.id !== id));
  };

  const handleInvestmentTransaction = async (investmentId: string, amount: number, type: 'in' | 'out') => {
    if(!user) return;
    const investment = investments.find(i => i.id === investmentId);
    if (!investment) return;
    const newPrincipal = type === 'in' ? (investment.principal || 0) + amount : Math.max(0, (investment.principal || 0) - amount);
    const updatedInv = { ...investment, principal: newPrincipal };
    const bank = banks.find(b => b.id === investment.bankId);
    if(!bank) return;
    const newBankBalance = type === 'in' ? (bank.balance || 0) - amount : (bank.balance || 0) + amount;
    const tx: Transaction = { id: generateId(), description: type === 'in' ? `Aporte: ${investment.name}` : `Resgate: ${investment.name}`, amount, date: new Date().toISOString(), type: 'transfer', categoryId: SYSTEM_CATEGORY_ID, bankId: investment.bankId, isCreditCard: false, isReconciled: true };
    await DataService.saveInvestment(user.id, updatedInv);
    await DataService.updateBankBalance(user.id, bank.id, newBankBalance);
    await DataService.createTransaction(user.id, tx);
    setInvestments(prev => prev.map(i => i.id === investmentId ? updatedInv : i));
    setBanks(prev => prev.map(b => b.id === investment.bankId ? { ...b, balance: newBankBalance } : b));
    setTransactions(prev => [tx, ...prev]);
  };

  const addSubscription = async (sub: Omit<Subscription, 'id'>) => {
    if(!user) return;
    const newSub = { ...sub, id: generateId() };
    await DataService.saveSubscription(user.id, newSub);
    setSubscriptions(prev => [...prev, newSub]);
  };

  const updateSubscription = async (sub: Subscription) => {
    if(!user) return;
    await DataService.saveSubscription(user.id, sub);
    setSubscriptions(prev => prev.map(s => s.id === sub.id ? sub : s));
  };

  const deleteSubscription = async (id: string) => {
    if(!user) return;
    await DataService.deleteSubscription(user.id, id);
    setSubscriptions(prev => prev.filter(s => s.id !== id));
  };

  const getBankBalanceAtDate = (bankId: string, date: Date) => {
      const bank = banks.find(b => b.id === bankId);
      if (!bank || bank.type === 'credit') return 0;
      const futureTransactions = transactions.filter(t => {
          if (!t.date || t.isCreditCard) return false;
          const tDate = new Date(t.date);
          if (isNaN(tDate.getTime())) return false;
          return (t.bankId === bankId || t.toBankId === bankId) && tDate > date;
      });
      let calculatedBalance = bank.balance || 0;
      futureTransactions.forEach(t => {
          if (t.type === 'transfer') {
              if (t.bankId === bankId) calculatedBalance += (t.amount || 0);
              else if (t.toBankId === bankId) calculatedBalance -= (t.amount || 0);
          } else {
              calculatedBalance -= ((t.amount || 0) * (t.type === 'income' ? 1 : -1));
          }
      });
      return isNaN(calculatedBalance) ? 0 : calculatedBalance;
  };

  const getOverallBalanceAtDate = (date: Date) => {
      if (!banks || banks.length === 0) return 0;
      const total = banks.filter(b => b.type !== 'credit').reduce((acc, b) => acc + getBankBalanceAtDate(b.id, date), 0);
      return isNaN(total) ? 0 : total;
  };

  const getInvoiceStats = (cardId: string, date: Date): InvoiceStats => {
      const bank = banks.find(b => b.id === cardId);
      if (!bank || bank.type !== 'credit') return { status: 'open', total: 0, paidAmount: 0, items: [], closingDate: new Date(), dueDate: new Date(), referenceMonth: '' };
      
      const viewMonth = date.getUTCMonth();
      const viewYear = date.getUTCFullYear();
      const referenceMonth = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
      
      const closingDate = new Date(viewYear, viewMonth, bank.creditCardClosingDay || 1);
      const dueDate = new Date(viewYear, viewMonth, bank.creditCardDueDay || 10);
      
      const realItems = transactions.filter(t => 
          t.bankId === cardId && 
          t.isCreditCard && 
          t.invoiceReference === referenceMonth && 
          t.isInvoicePayment !== true
      );

      const now = new Date();
      const currentMonthIdx = now.getUTCFullYear() * 12 + now.getUTCMonth();
      const viewMonthIdx = viewYear * 12 + viewMonth;
      const currentDay = now.getUTCDate();

      const subItems: Transaction[] = (subscriptions || [])
        .filter(s => {
            if (s.bankId !== cardId || !s.isActive) return false;
            // HISTÓRICO: Se o mês visualizado for passado, mostra.
            if (viewMonthIdx < currentMonthIdx) return true;
            // ATUAL: Se for o mês atual, SÓ MOSTRA SE o dia de cobrança já chegou.
            if (viewMonthIdx === currentMonthIdx) return currentDay >= s.billingDay;
            // FUTURO: Se for mês futuro, não mostra nada (fatura ainda não gerada).
            return false;
        })
        .map(s => {
            const chargeDate = new Date(viewYear, viewMonth, s.billingDay);
            return {
                id: `sub-${s.id}-${referenceMonth}`,
                description: s.name,
                amount: s.amount || 0,
                date: isNaN(chargeDate.getTime()) ? new Date().toISOString() : chargeDate.toISOString(),
                type: 'expense',
                categoryId: s.categoryId,
                bankId: cardId,
                isCreditCard: true,
                isReconciled: false,
                invoiceReference: referenceMonth,
                isSubscriptionCharge: true
            };
        });
      
      const items = [...realItems, ...subItems];
      const total = items.filter(t => t.type === 'expense').reduce((acc, t) => acc + (t.amount || 0), 0) - 
                    items.filter(t => t.type === 'income').reduce((acc, t) => acc + (t.amount || 0), 0);
      
      const paidAmount = transactions.filter(t => 
          t.toBankId === cardId && 
          t.isInvoicePayment === true && 
          t.invoiceReference === referenceMonth
      ).reduce((acc, t) => acc + (t.amount || 0), 0);

      const today = new Date();
      let status: 'open' | 'closed' | 'paid' | 'partial' | 'future' | 'overdue' = 'open';
      
      if (paidAmount >= total && total > 0) status = 'paid';
      else if (paidAmount > 0 && paidAmount < total) status = 'partial';
      else if (viewMonthIdx > currentMonthIdx) status = 'future';
      else if (viewMonthIdx < currentMonthIdx) status = 'overdue';
      else { 
          if (today > dueDate && paidAmount < total) status = 'overdue'; 
          else if (today > closingDate) status = 'closed'; 
          else status = 'open'; 
      }
      
      return { status, total: isNaN(total) ? 0 : total, paidAmount: isNaN(paidAmount) ? 0 : paidAmount, items, closingDate, dueDate, referenceMonth };
  };

  const getDashboardStats = (date: Date): DashboardStats => {
    if (!transactions || transactions.length === 0) return { income: 0, expenses: 0, balance: 0, investments: 0, creditCardBill: 0 };
    
    const targetMonth = date.getUTCMonth();
    const targetYear = date.getUTCFullYear();
    const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);
    
    const monthTx = transactions.filter(t => { 
        if (!t.date) return false;
        const d = new Date(t.date); 
        if (isNaN(d.getTime())) return false;
        return d.getUTCMonth() === targetMonth && d.getUTCFullYear() === targetYear; 
    });
    
    const income = monthTx.filter(t => t.type === 'income').reduce((acc, t) => acc + (t.amount || 0), 0);
    const expenses = monthTx.filter(t => t.type === 'expense' && !t.isCreditCard).reduce((acc, t) => acc + (t.amount || 0), 0);
    const totalInvested = investments ? investments.reduce((acc, inv) => acc + (inv.principal || 0), 0) : 0;
    
    const creditCardBill = (banks && banks.length > 0) ? banks.filter(b => b.type === 'credit').reduce((acc, card) => {
        const stats = getInvoiceStats(card.id, date);
        return acc + (stats.total || 0);
    }, 0) : 0;
    
    return { 
        income: isNaN(income) ? 0 : income, 
        expenses: isNaN(expenses) ? 0 : expenses, 
        balance: getOverallBalanceAtDate(endOfMonth) || 0, 
        investments: isNaN(totalInvested) ? 0 : totalInvested, 
        creditCardBill: isNaN(creditCardBill) ? 0 : creditCardBill 
    };
  };

  return (
    <AppContext.Provider value={{
      user, theme, appLogo, isLoading, toggleTheme, updateAppLogo, login, register, updateUserProfile, uploadAvatar, changePassword, resetPassword, deleteAccount, logout, transactions, categories, banks, investments, subscriptions,
      addTransaction, deleteTransaction, updateTransaction, chargebackTransaction, payInvoice, reopenInvoice,
      addCategory, updateCategory, deleteCategory,
      addBank, updateBank, deleteBank,
      addInvestment, updateInvestment, deleteInvestment, handleInvestmentTransaction,
      addSubscription, updateSubscription, deleteSubscription,
      getDashboardStats, getBankBalanceAtDate, getOverallBalanceAtDate, getInvoiceStats,
      healthThresholds, updateHealthThresholds,
      isTransactionModalOpen, setTransactionModalOpen
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
