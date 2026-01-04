
import { User, Transaction, Category, Bank, Investment, Subscription } from '../types';
import { generateId } from '../utils';
import { db, auth } from '../src/services/firebase';
import { doc, setDoc, getDoc, collection, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';

const DELAY = 50;
export const TEST_USER_EMAIL = 'teste@exemplo.com';
export const SYSTEM_CATEGORY_ID = 'system_internal';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- FIREBASE UTILS ---
const saveUserToFirestore = async (user: User) => {
    try {
        const userRef = doc(db, 'users', user.id);
        await setDoc(userRef, {
            displayName: user.displayName,
            email: user.email,
            currency: user.currency || 'BRL',
            theme: user.theme || 'dark',
            photoURL: user.photoURL || null,
            timezone: user.timezone || 'America/Cuiaba',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }, { merge: true });
    } catch (e) {
        console.error('Erro ao salvar usuário no Firestore:', e);
    }
};

// Salvar dados do usuário no Firestore (com sincronização de deletados)
const saveUserDataToFirestore = async (userId: string, dataType: string, data: any[]) => {
    try {
        const collectionRef = collection(db, 'users', userId, dataType);
        
        // Obter documentos existentes
        const snapshot = await getDocs(collectionRef);
        const existingIds = snapshot.docs.map(doc => doc.id);
        const newIds = data.map(item => item.id);
        
        // Deletar documentos que não estão mais na lista
        const toDelete = existingIds.filter(id => !newIds.includes(id));
        for (const id of toDelete) {
            await deleteDoc(doc(collectionRef, id));
        }
        
        // Salvar/atualizar documentos
        for (const item of data) {
            const docRef = doc(collectionRef, item.id);
            await setDoc(docRef, item, { merge: true });
        }
    } catch (e) {
        console.error(`Erro ao salvar ${dataType}:`, e);
    }
};

// Carregar dados do usuário do Firestore
const loadUserDataFromFirestore = async (userId: string, dataType: string): Promise<any[]> => {
    try {
        const collectionRef = collection(db, 'users', userId, dataType);
        const snapshot = await getDocs(collectionRef);
        return snapshot.docs.map(doc => doc.data());
    } catch (e) {
        console.error(`Erro ao carregar ${dataType}:`, e);
        return [];
    }
};

// Deletar dados do usuário do Firestore
const deleteUserDataFromFirestore = async (userId: string) => {
    try {
        const dataTypes = ['transactions', 'categories', 'banks', 'investments', 'subscriptions'];
        for (const dataType of dataTypes) {
            const collectionRef = collection(db, 'users', userId, dataType);
            const snapshot = await getDocs(collectionRef);
            for (const doc of snapshot.docs) {
                await deleteDoc(doc.ref);
            }
        }
        // Deletar documento do usuário
        await deleteDoc(doc(db, 'users', userId));
    } catch (e) {
        console.error('Erro ao deletar dados do usuário:', e);
    }
};

const getTable = <T>(key: string): T[] => {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
};

const setTable = <T>(key: string, data: T[]) => {
    localStorage.setItem(key, JSON.stringify(data));
};

const removeTable = (key: string) => {
    localStorage.removeItem(key);
};

// --- SEED DATA LOGIC ---
const seedTestData = (userId: string) => {
    // Limpeza prévia para garantir consistência
    removeTable(`mc_transactions_${userId}`);
    removeTable(`mc_categories_${userId}`);
    removeTable(`mc_banks_${userId}`);
    removeTable(`mc_investments_${userId}`);
    removeTable(`mc_subscriptions_${userId}`);

    // 1. Categories
    const categories: Category[] = [
        { id: 'cat-1', name: 'Salário', color: '#3fb950', type: 'income' },
        { id: 'cat-2', name: 'Alimentação', color: '#f6ad31', type: 'expense' },
        { id: 'cat-3', name: 'Lazer', color: '#bc8cff', type: 'expense' },
        { id: 'cat-4', name: 'Transporte', color: '#58a6ff', type: 'expense' },
        { id: 'cat-5', name: 'Saúde', color: '#f85149', type: 'expense' },
    ];
    setTable(`mc_categories_${userId}`, categories);

    // 2. Banks & Cards
    const bank1Id = 'bank-nubank';
    const bank2Id = 'bank-itau';
    const cardId = 'card-inter';
    
    const banks: Bank[] = [
        { id: bank1Id, name: 'Nubank', type: 'checking', balance: 2500.50, color: '#8a05be', isActive: true },
        { id: bank2Id, name: 'Itaú Poupança', type: 'savings', balance: 10000.00, color: '#ff7b00', isActive: true },
        { id: cardId, name: 'Inter Black', type: 'credit', balance: 0, color: '#ff7b22', isActive: true, limit: 15000, creditCardClosingDay: 5, creditCardDueDay: 15 }
    ];
    setTable(`mc_banks_${userId}`, banks);

    // 3. Investments
    const investments: Investment[] = [
        { id: 'inv-1', name: 'CDB Liquidez Diária', principal: 5000, rate: 1.05, frequency: 'monthly', bankId: bank2Id, startDate: new Date().toISOString() }
    ];
    setTable(`mc_investments_${userId}`, investments);

    // 4. Subscriptions
    const subscriptions: Subscription[] = [
        { id: 'sub-1', name: 'Netflix', amount: 55.90, billingDay: 10, bankId: cardId, categoryId: 'cat-3', isActive: true },
        { id: 'sub-2', name: 'Spotify', amount: 21.90, billingDay: 20, bankId: cardId, categoryId: 'cat-3', isActive: true }
    ];
    setTable(`mc_subscriptions_${userId}`, subscriptions);

    // 5. Transactions
    const now = new Date();
    const referenceMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const transactions: Transaction[] = [
        { id: 'tx-1', description: 'Salário Mensal', amount: 5000, date: new Date(now.getFullYear(), now.getMonth(), 5).toISOString(), type: 'income', categoryId: 'cat-1', bankId: bank1Id, isCreditCard: false, isReconciled: true },
        { id: 'tx-2', description: 'Supermercado Mensal', amount: 450.30, date: new Date(now.getFullYear(), now.getMonth(), 7).toISOString(), type: 'expense', categoryId: 'cat-2', bankId: bank1Id, isCreditCard: false, isReconciled: true },
        { id: 'tx-3', description: 'Jantar Restaurante', amount: 120, date: new Date(now.getFullYear(), now.getMonth(), 2).toISOString(), type: 'expense', categoryId: 'cat-2', bankId: cardId, isCreditCard: true, isReconciled: false, invoiceReference: referenceMonth },
        { id: 'tx-4', description: 'Compra Loja (Parcela 1/3)', amount: 100, date: new Date(now.getFullYear(), now.getMonth(), 10).toISOString(), type: 'expense', categoryId: 'cat-3', bankId: cardId, isCreditCard: true, isReconciled: false, invoiceReference: referenceMonth, installments: 3, installmentNumber: 1, originalTransactionId: 'tx-4-root' },
        { id: 'tx-5', description: 'Compra Loja (Parcela 2/3)', amount: 100, date: new Date(now.getFullYear(), now.getMonth() + 1, 10).toISOString(), type: 'expense', categoryId: 'cat-3', bankId: cardId, isCreditCard: true, isReconciled: false, invoiceReference: `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, '0')}`, installments: 3, installmentNumber: 2, originalTransactionId: 'tx-4-root' },
        { id: 'tx-6', description: 'Reserva para Viagem', amount: 500, date: new Date(now.getFullYear(), now.getMonth(), 10).toISOString(), type: 'transfer', categoryId: SYSTEM_CATEGORY_ID, bankId: bank1Id, toBankId: bank2Id, isCreditCard: false, isReconciled: true }
    ];
    setTable(`mc_transactions_${userId}`, transactions);
};

// --- AUTH SERVICE ---
export const AuthService = {
    async login(email: string, password?: string): Promise<User> {
        try {
            // Usar Firebase Auth
            const userCredential = await signInWithEmailAndPassword(auth, email, password || '');
            const firebaseUser = userCredential.user;
            
            // Carregar dados do usuário do Firestore
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userDocSnapshot = await getDoc(userDocRef);
            
            if (userDocSnapshot.exists()) {
                const userData = userDocSnapshot.data() as User;
                return { ...userData, id: firebaseUser.uid };
            } else {
                // Se não existir, criar com dados do Firebase
                const newUser: User = {
                    id: firebaseUser.uid,
                    displayName: firebaseUser.displayName || '',
                    email: firebaseUser.email || email,
                    currency: 'BRL',
                    theme: 'dark'
                };
                await saveUserToFirestore(newUser);
                return newUser;
            }
        } catch (error: any) {
            throw new Error(error.message || 'Erro ao fazer login');
        }
    },

    async register(name: string, email: string, password?: string): Promise<User> {
        try {
            // Criar usuário no Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password || '');
            const firebaseUser = userCredential.user;
            
            // Criar documento do usuário no Firestore
            const newUser: User = {
                id: firebaseUser.uid,
                displayName: name,
                email: firebaseUser.email || email,
                currency: 'BRL',
                theme: 'dark'
            };
            
            await saveUserToFirestore(newUser);
            
            return newUser;
        } catch (error: any) {
            throw new Error(error.message || 'Erro ao fazer cadastro');
        }
    },

    async updateUser(user: User): Promise<User> {
        try {
            // Atualizar user no localStorage
            localStorage.setItem('mc_user', JSON.stringify(user));
            // Salvar no Firestore com photoURL e outros dados
            await saveUserToFirestore(user);
            return user;
        } catch (error: any) {
            throw new Error(error.message || 'Erro ao atualizar usuário');
        }
    },

    async logout(): Promise<void> {
        try {
            await signOut(auth);
        } catch (error: any) {
            throw new Error(error.message || 'Erro ao fazer logout');
        }
    },

    async changePassword(userId: string, oldPass: string, newPass: string): Promise<void> {
        try {
            throw new Error('Para alterar senha, use a funcionalidade do Firebase Auth');
        } catch (error: any) {
            throw error;
        }
    },
    
    async resetPassword(email: string, newPass: string): Promise<void> {
        try {
            throw new Error('Para resetar senha, use a funcionalidade do Firebase Auth');
        } catch (error: any) {
            throw error;
        }
    },

    async deleteUser(userId: string): Promise<void> {
        try {
            // Deletar dados do Firestore
            await deleteUserDataFromFirestore(userId);
            // Deletar dados locais
            removeTable(`mc_transactions_${userId}`);
            removeTable(`mc_categories_${userId}`);
            removeTable(`mc_banks_${userId}`);
            removeTable(`mc_investments_${userId}`);
            removeTable(`mc_subscriptions_${userId}`);
        } catch (error: any) {
            throw new Error(error.message || 'Erro ao deletar conta');
        }
    }
};

export const DataService = {
    async getTransactions(userId: string): Promise<Transaction[]> {
        await delay(DELAY);
        // Tentar carregar do Firestore primeiro
        const firebaseData = await loadUserDataFromFirestore(userId, 'transactions');
        if (firebaseData.length > 0) {
            setTable(`mc_transactions_${userId}`, firebaseData);
            return firebaseData;
        }
        // Fallback para localStorage
        return getTable<Transaction>(`mc_transactions_${userId}`);
    },

    async createTransaction(userId: string, transaction: Transaction): Promise<Transaction> {
        await delay(50);
        const list = getTable<Transaction>(`mc_transactions_${userId}`);
        list.push(transaction);
        setTable(`mc_transactions_${userId}`, list);
        // Salvar no Firestore
        await saveUserDataToFirestore(userId, 'transactions', list);
        return transaction;
    },

    async createTransactionsBatch(userId: string, transactions: Transaction[]): Promise<Transaction[]> {
        await delay(50);
        const list = getTable<Transaction>(`mc_transactions_${userId}`);
        const newList = [...list, ...transactions];
        setTable(`mc_transactions_${userId}`, newList);
        // Salvar no Firestore
        await saveUserDataToFirestore(userId, 'transactions', newList);
        return transactions;
    },

    async updateTransaction(userId: string, transaction: Transaction): Promise<Transaction> {
        await delay(50);
        const list = getTable<Transaction>(`mc_transactions_${userId}`);
        const index = list.findIndex(t => t.id === transaction.id);
        if (index !== -1) {
            list[index] = transaction;
            setTable(`mc_transactions_${userId}`, list);
            // Salvar no Firestore
            await saveUserDataToFirestore(userId, 'transactions', list);
        }
        return transaction;
    },

    async deleteTransactions(userId: string, ids: string[]): Promise<void> {
        await delay(50);
        let list = getTable<Transaction>(`mc_transactions_${userId}`);
        list = list.filter(t => !ids.includes(t.id));
        setTable(`mc_transactions_${userId}`, list);
        // Salvar no Firestore
        await saveUserDataToFirestore(userId, 'transactions', list);
    },

    async getCategories(userId: string): Promise<Category[]> {
        await delay(DELAY);
        // Tentar carregar do Firestore primeiro
        const firebaseData = await loadUserDataFromFirestore(userId, 'categories');
        if (firebaseData.length > 0) {
            setTable(`mc_categories_${userId}`, firebaseData);
            return firebaseData;
        }
        // Fallback para localStorage
        return getTable<Category>(`mc_categories_${userId}`);
    },

    async createCategory(userId: string, category: Category): Promise<Category> {
        const list = getTable<Category>(`mc_categories_${userId}`);
        list.push(category);
        setTable(`mc_categories_${userId}`, list);
        // Salvar no Firestore
        await saveUserDataToFirestore(userId, 'categories', list);
        return category;
    },

    async updateCategory(userId: string, category: Category): Promise<Category> {
        const list = getTable<Category>(`mc_categories_${userId}`);
        const index = list.findIndex(c => c.id === category.id);
        if (index !== -1) {
            list[index] = category;
            setTable(`mc_categories_${userId}`, list);
            // Salvar no Firestore
            await saveUserDataToFirestore(userId, 'categories', list);
        }
        return category;
    },

    async deleteCategory(userId: string, id: string): Promise<void> {
        let list = getTable<Category>(`mc_categories_${userId}`);
        list = list.filter(c => c.id !== id);
        setTable(`mc_categories_${userId}`, list);
        // Salvar no Firestore
        await saveUserDataToFirestore(userId, 'categories', list);
    },

    async getBanks(userId: string): Promise<Bank[]> {
        await delay(DELAY);
        // Tentar carregar do Firestore primeiro
        const firebaseData = await loadUserDataFromFirestore(userId, 'banks');
        if (firebaseData.length > 0) {
            setTable(`mc_banks_${userId}`, firebaseData);
            return firebaseData;
        }
        // Fallback para localStorage
        return getTable<Bank>(`mc_banks_${userId}`);
    },

    async saveBank(userId: string, bank: Bank): Promise<Bank> {
        const list = getTable<Bank>(`mc_banks_${userId}`);
        const index = list.findIndex(b => b.id === bank.id);
        if (index !== -1) {
            list[index] = bank;
        } else {
            list.push(bank);
        }
        setTable(`mc_banks_${userId}`, list);
        // Salvar no Firestore
        await saveUserDataToFirestore(userId, 'banks', list);
        return bank;
    },

    async updateBankBalance(userId: string, bankId: string, newBalance: number): Promise<void> {
        const list = getTable<Bank>(`mc_banks_${userId}`);
        const index = list.findIndex(b => b.id === bankId);
        if (index !== -1) {
            list[index].balance = newBalance;
            setTable(`mc_banks_${userId}`, list);
            // Salvar no Firestore
            await saveUserDataToFirestore(userId, 'banks', list);
        }
    },
    
    async updateBankBalances(userId: string, updates: {id: string, balance: number}[]): Promise<void> {
        const list = getTable<Bank>(`mc_banks_${userId}`);
        updates.forEach(u => {
             const index = list.findIndex(b => b.id === u.id);
             if (index !== -1) list[index].balance = u.balance;
        });
        setTable(`mc_banks_${userId}`, list);
        // Salvar no Firestore
        await saveUserDataToFirestore(userId, 'banks', list);
    },

    async deleteBank(userId: string, id: string): Promise<void> {
        let list = getTable<Bank>(`mc_banks_${userId}`);
        list = list.filter(b => b.id !== id);
        setTable(`mc_banks_${userId}`, list);
        // Salvar no Firestore
        await saveUserDataToFirestore(userId, 'banks', list);
    },

    async getInvestments(userId: string): Promise<Investment[]> {
        await delay(DELAY);
        // Tentar carregar do Firestore primeiro
        const firebaseData = await loadUserDataFromFirestore(userId, 'investments');
        if (firebaseData.length > 0) {
            setTable(`mc_investments_${userId}`, firebaseData);
            return firebaseData;
        }
        // Fallback para localStorage
        return getTable<Investment>(`mc_investments_${userId}`);
    },

    async saveInvestment(userId: string, investment: Investment): Promise<Investment> {
        const list = getTable<Investment>(`mc_investments_${userId}`);
        const index = list.findIndex(i => i.id === investment.id);
        if (index !== -1) {
            list[index] = investment;
        } else {
            list.push(investment);
        }
        setTable(`mc_investments_${userId}`, list);
        // Salvar no Firestore
        await saveUserDataToFirestore(userId, 'investments', list);
        return investment;
    },

    async deleteInvestment(userId: string, id: string): Promise<void> {
        let list = getTable<Investment>(`mc_investments_${userId}`);
        list = list.filter(i => i.id !== id);
        setTable(`mc_investments_${userId}`, list);
        // Salvar no Firestore
        await saveUserDataToFirestore(userId, 'investments', list);
    },

    async getSubscriptions(userId: string): Promise<Subscription[]> {
        await delay(DELAY);
        // Tentar carregar do Firestore primeiro
        const firebaseData = await loadUserDataFromFirestore(userId, 'subscriptions');
        if (firebaseData.length > 0) {
            setTable(`mc_subscriptions_${userId}`, firebaseData);
            return firebaseData;
        }
        // Fallback para localStorage
        return getTable<Subscription>(`mc_subscriptions_${userId}`);
    },

    async saveSubscription(userId: string, subscription: Subscription): Promise<Subscription> {
        const list = getTable<Subscription>(`mc_subscriptions_${userId}`);
        const index = list.findIndex(s => s.id === subscription.id);
        if (index !== -1) {
            list[index] = subscription;
        } else {
            list.push(subscription);
        }
        setTable(`mc_subscriptions_${userId}`, list);
        // Salvar no Firestore
        await saveUserDataToFirestore(userId, 'subscriptions', list);
        return subscription;
    },

    async deleteSubscription(userId: string, id: string): Promise<void> {
        let list = getTable<Subscription>(`mc_subscriptions_${userId}`);
        list = list.filter(s => s.id !== id);
        setTable(`mc_subscriptions_${userId}`, list);
        // Salvar no Firestore
        await saveUserDataToFirestore(userId, 'subscriptions', list);
    }
};
