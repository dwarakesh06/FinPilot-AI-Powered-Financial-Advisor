import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  FileUp, 
  Download, 
  X, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Sparkles,
  HelpCircle,
  Loader
} from 'lucide-react';

const Transactions = () => {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1 });
  
  // Filters
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  // CRUD Forms State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  
  const [selectedTx, setSelectedTx] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    type: 'expense',
    category: 'Groceries',
    date: new Date().toISOString().slice(0, 10),
    description: '',
  });

  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState('');

  const categories = [
    'Salary',
    'Food & Dining',
    'Groceries',
    'Housing & Utilities',
    'Transportation',
    'Entertainment & Subscriptions',
    'Shopping',
    'Healthcare',
    'Miscellaneous'
  ];

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page,
        limit: 10,
        search: submittedSearch,
        category,
        type,
        startDate,
        endDate
      });

      const res = await api.get(`/api/transactions?${queryParams.toString()}`);
      if (res.data.success) {
        setTransactions(res.data.transactions);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch transactions list:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, category, type, startDate, endDate, submittedSearch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSubmittedSearch(search);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setSubmittedSearch('');
    setCategory('');
    setType('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

      const res = await api.post('/api/transactions', payload);
      if (res.data.success) {
        setShowAddModal(false);
        resetForm();
        fetchTransactions();
      }
    } catch (err) {
      alert(err.message || 'Failed to create transaction');
    }
  };

  const handleEditClick = (tx) => {
    setSelectedTx(tx);
    setFormData({
      title: tx.title,
      amount: tx.amount,
      type: tx.type,
      category: tx.category,
      date: new Date(tx.date).toISOString().slice(0, 10),
      description: tx.description || '',
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

      const res = await api.put(`/api/transactions/${selectedTx._id}`, payload);
      if (res.data.success) {
        setShowEditModal(false);
        resetForm();
        fetchTransactions();
      }
    } catch (err) {
      alert(err.message || 'Failed to update transaction');
    }
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm('Are you absolute sure you want to delete this record?')) return;
    try {
      const res = await api.delete(`/api/transactions/${id}`);
      if (res.data.success) {
        fetchTransactions();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete transaction');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      amount: '',
      type: 'expense',
      category: 'Groceries',
      date: new Date().toISOString().slice(0, 10),
      description: '',
    });
    setSelectedTx(null);
  };

  // CSV download function removed

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) return;

    setImporting(true);
    setImportMsg('');

    const uploadFormData = new FormData();
    uploadFormData.append('file', importFile);

    try {
      const res = await api.post('/api/transactions/import', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setImportMsg(res.data.message);
        setImportFile(null);
        setTimeout(() => {
          setShowImportModal(false);
          setImportMsg('');
          fetchTransactions();
        }, 2200);
      }
    } catch (err) {
      setImportMsg(`Import Error: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Ledger Transactions</h2>
          <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Auditing and categorizing your monthly income and expenditures</p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900 px-4.5 py-3 text-xs font-bold text-slate-300 hover:text-white transition-colors"
          >
            <FileUp className="h-4 w-4" /> Bank Import
          </button>
          
          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:brightness-110 text-slate-950 font-bold px-4.5 py-3 text-xs shadow-md glow-cyan/10"
          >
            <Plus className="h-4 w-4 text-slate-950" /> Add Entry
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5 items-end">
          
          {/* Text Search */}
          <div className="lg:col-span-2 space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-0.5">Search Title</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Match payee or title..."
                className="w-full pl-9.5 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/80 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-0.5">Flow Type</label>
            <select
              value={type}
              onChange={(e) => { setType(e.target.value); setPage(1); }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950/80 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 appearance-none cursor-pointer"
            >
              <option value="">All Types</option>
              <option value="income">Income Only</option>
              <option value="expense">Expenses Only</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-0.5">Category</label>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950/80 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 appearance-none cursor-pointer"
            >
              <option value="">All Folders</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Date Picker Range */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-0.5">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950/80 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-0.5">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950/80 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </form>
        
        {/* Reset Filter elements */}
        {(search || category || type || startDate || endDate) && (
          <div className="mt-3.5 pt-3.5 border-t border-slate-800/60 flex justify-end">
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors uppercase"
            >
              <X className="h-3 w-3" /> Clear Active Filters
            </button>
          </div>
        )}
      </div>

      {/* Main Ledger Table */}
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 overflow-hidden">
        {loading ? (
          <div className="flex h-60 items-center justify-center">
            <Loader className="h-8 w-8 animate-spin text-cyan-500" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/60 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <th className="pb-3 pl-1">Date</th>
                    <th className="pb-3">Title / Payee</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3 text-right">Amount</th>
                    <th className="pb-3 text-center pr-1">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-xs font-semibold">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-500">
                        No transactions registered matching active filters.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx._id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="py-3.5 pl-1 text-slate-400">{formatDate(tx.date)}</td>
                        <td className="py-3.5 text-slate-200">
                          <div>
                            <span className="text-slate-200">{tx.title}</span>
                            {tx.imported && (
                              <span className="ml-2 inline-flex items-center gap-0.5 rounded-full bg-cyan-950/60 px-1.5 py-0.5 text-[8px] font-bold text-cyan-400 uppercase tracking-widest border border-cyan-800/40">
                                <Sparkles className="h-2 w-2" /> Bank Import
                              </span>
                            )}
                          </div>
                          {tx.description && <span className="text-[10px] text-slate-500 font-medium block mt-0.5">{tx.description}</span>}
                        </td>
                        <td className="py-3.5">
                          <span className="rounded bg-slate-850 px-2 py-1 text-[10px] font-bold text-slate-400">
                            {tx.category}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                            tx.type === 'income' ? 'bg-emerald-950/40 text-emerald-400' : 'bg-rose-950/40 text-rose-400'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className={`py-3.5 text-right font-bold ${
                          tx.type === 'income' ? 'text-emerald-400' : 'text-slate-200'
                        }`}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, user?.currency)}
                        </td>
                        <td className="py-3.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEditClick(tx)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(tx._id)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-950/20 hover:text-rose-400 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Structured Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-between items-center pt-4 border-t border-slate-800/60">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Page {pagination.page} of {pagination.totalPages} ({pagination.totalItems} total items)
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    className="rounded-lg border border-slate-800 bg-slate-950 p-2 text-slate-400 hover:text-white hover:border-slate-700 disabled:opacity-40 transition-all cursor-pointer"
                  >
                    <ChevronLeft className="h-4.5 w-4.5" />
                  </button>
                  <button
                    disabled={page === pagination.totalPages}
                    onClick={() => setPage(prev => Math.min(pagination.totalPages, prev + 1))}
                    className="rounded-lg border border-slate-800 bg-slate-950 p-2 text-slate-400 hover:text-white hover:border-slate-700 disabled:opacity-40 transition-all cursor-pointer"
                  >
                    <ChevronRight className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 1. ADD / EDIT TRANSACTION MODALS */}
      {/* ======================================================== */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-200">
                {showAddModal ? 'Create Entry' : 'Edit Ledger Record'}
              </h3>
              <button 
                onClick={() => { setShowAddModal(false); setShowEditModal(false); resetForm(); }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={showAddModal ? handleAddSubmit : handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Title / Payee</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Grocery purchase, Salary payroll..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="142.50"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Flow Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-200 focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-200 focus:outline-none appearance-none cursor-pointer"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Record Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description (Optional)</label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Extra description details..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-xs font-bold text-white shadow-md glow-cyan/15 hover:brightness-110 transition-all uppercase tracking-wider mt-2"
              >
                {showAddModal ? 'Create Record' : 'Save Modifications'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. BANK STATEMENT IMPORT MODAL */}
      {/* ======================================================== */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-200">
                Bank Statement Import
              </h3>
              <button 
                onClick={() => { setShowImportModal(false); setImportFile(null); setImportMsg(''); }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Upload Form */}
              <form onSubmit={handleImportSubmit} className="space-y-4">
                <div className="border border-dashed border-slate-800 hover:border-slate-700 bg-slate-950 rounded-2xl p-6 text-center transition-colors">
                  <FileUp className="h-8 w-8 text-slate-500 mx-auto mb-3" />
                  
                  <label className="cursor-pointer">
                    <span className="rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold px-3 py-1.5 text-slate-300">
                      Select CSV File
                    </span>
                    <input
                      type="file"
                      accept=".csv"
                      required
                      className="hidden"
                      onChange={(e) => setImportFile(e.target.files[0])}
                    />
                  </label>
                  
                  {importFile ? (
                    <p className="text-xs font-bold text-cyan-400 mt-4 truncate">
                      File Ready: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-500 font-semibold mt-4">
                      Supports standard bank exports with Date, Description/Payee, and Amount headers.
                    </p>
                  )}
                </div>

                {importMsg && (
                  <div className={`rounded-xl p-3 text-center text-xs font-bold ${
                    importMsg.includes('Error') ? 'bg-rose-950/30 border border-rose-900/30 text-rose-400' : 'bg-emerald-950/30 border border-emerald-900/30 text-emerald-400'
                  }`}>
                    {importMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={importing || !importFile}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-xs font-bold text-slate-950 hover:brightness-110 active:scale-95 disabled:opacity-40 shadow-md transition-all uppercase tracking-wider"
                >
                  {importing ? (
                    <>
                      <Loader className="h-4.5 w-4.5 animate-spin mx-auto text-slate-950" />
                    </>
                  ) : (
                    <>Upload & Categorize Statement</>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
