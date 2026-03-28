import React, { useState, useMemo } from 'react';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { Trade } from '../types';
import { TrendingUp, TrendingDown, Edit2, Search, Filter, ArrowUpDown, Calendar, Download, Activity, Inbox } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TradeListProps {
  trades: Trade[];
  isAdmin: boolean;
  onEdit: (trade: Trade) => void;
}

type SortField = 'timestamp' | 'profit' | 'symbol';

export const TradeList: React.FC<TradeListProps> = ({ trades, isAdmin, onEdit }) => {
  // Active filters (used for the actual filtering logic)
  const [activeAssetFilter, setActiveAssetFilter] = useState('');
  const [activeTypeFilter, setActiveTypeFilter] = useState<'All' | 'Long' | 'Short'>('All');
  const [activeStatusFilter, setActiveStatusFilter] = useState<'All' | 'Open' | 'Closed'>('All');
  const [activeStartDate, setActiveStartDate] = useState('');
  const [activeEndDate, setActiveEndDate] = useState('');

  // Temporary filters (used for the input fields)
  const [tempAssetFilter, setTempAssetFilter] = useState('');
  const [tempTypeFilter, setTempTypeFilter] = useState<'All' | 'Long' | 'Short'>('All');
  const [tempStatusFilter, setTempStatusFilter] = useState<'All' | 'Open' | 'Closed'>('All');
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');

  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredAndSortedTrades = useMemo(() => {
    let result = [...trades];

    // Filter by asset
    if (activeAssetFilter) {
      result = result.filter(t => t.symbol.toLowerCase().includes(activeAssetFilter.toLowerCase()));
    }

    // Filter by type
    if (activeTypeFilter !== 'All') {
      result = result.filter(t => t.type === activeTypeFilter);
    }

    // Filter by status
    if (activeStatusFilter !== 'All') {
      result = result.filter(t => t.status === activeStatusFilter);
    }

    // Filter by date range
    if (activeStartDate || activeEndDate) {
      result = result.filter(t => {
        const tradeDate = t.timestamp.toDate();
        const start = activeStartDate ? startOfDay(new Date(activeStartDate)) : new Date(0);
        const end = activeEndDate ? endOfDay(new Date(activeEndDate)) : new Date(8640000000000000);
        return isWithinInterval(tradeDate, { start, end });
      });
    }

    // Sort
    result.sort((a, b) => {
      let valA: any, valB: any;
      
      if (sortField === 'timestamp') {
        valA = a.timestamp.toMillis();
        valB = b.timestamp.toMillis();
      } else if (sortField === 'profit') {
        valA = a.profit;
        valB = b.profit;
      } else {
        valA = a.symbol.toLowerCase();
        valB = b.symbol.toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [trades, activeAssetFilter, activeTypeFilter, activeStatusFilter, activeStartDate, activeEndDate, sortField, sortOrder]);

  const applyFilters = () => {
    setActiveAssetFilter(tempAssetFilter);
    setActiveTypeFilter(tempTypeFilter);
    setActiveStatusFilter(tempStatusFilter);
    setActiveStartDate(tempStartDate);
    setActiveEndDate(tempEndDate);
  };

  const resetFilters = () => {
    setTempAssetFilter('');
    setTempTypeFilter('All');
    setTempStatusFilter('All');
    setTempStartDate('');
    setTempEndDate('');
    setActiveAssetFilter('');
    setActiveTypeFilter('All');
    setActiveStatusFilter('All');
    setActiveStartDate('');
    setActiveEndDate('');
  };

  const setQuickDateRange = (range: 'today' | 'week' | 'month' | 'all') => {
    const today = new Date();
    let start = '';
    let end = format(today, 'yyyy-MM-dd');

    switch (range) {
      case 'today':
        start = format(today, 'yyyy-MM-dd');
        break;
      case 'week':
        const lastWeek = new Date();
        lastWeek.setDate(today.getDate() - 7);
        start = format(lastWeek, 'yyyy-MM-dd');
        break;
      case 'month':
        const lastMonth = new Date();
        lastMonth.setMonth(today.getMonth() - 1);
        start = format(lastMonth, 'yyyy-MM-dd');
        break;
      case 'all':
        start = '';
        end = '';
        break;
    }

    setTempStartDate(start);
    setTempEndDate(end);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Symbol', 'Type', 'Status', 'Quantity', 'Entry Price', 'Exit Price', 'Profit/Loss', 'Notes'];
    const rows = filteredAndSortedTrades.map(t => [
      format(t.timestamp.toDate(), 'yyyy-MM-dd HH:mm'),
      t.symbol,
      t.type,
      t.status,
      t.quantity || '',
      t.entryPrice || '',
      t.exitPrice || '',
      t.profit,
      t.notes || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `trades_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-gray-800 dark:text-white">Filter Trades</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 flex items-center gap-1">
              <Search className="w-3 h-3" /> Asset Symbol
            </label>
            <input
              type="text"
              id="assetSearchInput"
              value={tempAssetFilter}
              onChange={(e) => setTempAssetFilter(e.target.value)}
              placeholder="e.g. BTCUSDT, AAPL"
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3" /> Trade Type
            </label>
            <select
              id="typeFilterSelect"
              value={tempTypeFilter}
              onChange={(e) => setTempTypeFilter(e.target.value as any)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white transition-all appearance-none"
            >
              <option value="All">All Types</option>
              <option value="Long">Long Only</option>
              <option value="Short">Short Only</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 flex items-center gap-1">
              <Activity className="w-3 h-3" /> Status
            </label>
            <select
              id="statusFilterSelect"
              value={tempStatusFilter}
              onChange={(e) => setTempStatusFilter(e.target.value as any)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white transition-all appearance-none"
            >
              <option value="All">All Status</option>
              <option value="Open">Open Only</option>
              <option value="Closed">Closed Only</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Date Range
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                id="startDateInput"
                value={tempStartDate}
                onChange={(e) => setTempStartDate(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white transition-all"
              />
              <span className="text-gray-400 font-medium">to</span>
              <input
                type="date"
                id="endDateInput"
                value={tempEndDate}
                onChange={(e) => setTempEndDate(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white transition-all"
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {['today', 'week', 'month', 'all'].map((range) => (
                <button
                  key={range}
                  onClick={() => setQuickDateRange(range as any)}
                  className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-all"
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <button 
              id="applyFiltersBtn"
              onClick={applyFilters}
              className="flex-1 sm:flex-none px-8 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 dark:shadow-blue-900/20 active:scale-95"
            >
              Apply Filters
            </button>
            <button 
              id="resetFiltersBtn"
              onClick={resetFilters}
              className="px-4 py-2 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-red-600 transition-colors"
            >
              Clear All
            </button>
          </div>

          <button 
            id="exportCsvBtn"
            onClick={exportToCSV}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all active:scale-95"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">Trade History</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">{filteredAndSortedTrades.length} trades found</span>
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
              <tr>
                <th id="sortAssetHeader" className="px-6 py-3 font-semibold cursor-pointer hover:text-blue-600" onClick={() => toggleSort('symbol')}>
                  <div className="flex items-center gap-1">
                    Asset <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-6 py-3 font-semibold">Type</th>
                <th className="px-6 py-3 font-semibold">Qty</th>
                <th className="px-6 py-3 font-semibold">Entry/Exit</th>
                <th id="sortProfitHeader" className="px-6 py-3 font-semibold text-right cursor-pointer hover:text-blue-600" onClick={() => toggleSort('profit')}>
                  <div className="flex items-center justify-end gap-1">
                    Profit/Loss <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th id="sortDateHeader" className="px-6 py-3 font-semibold cursor-pointer hover:text-blue-600" onClick={() => toggleSort('timestamp')}>
                  <div className="flex items-center gap-1">
                    Date <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                {isAdmin && <th className="px-6 py-3 font-semibold text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              <AnimatePresence mode="popLayout">
                {filteredAndSortedTrades.map((trade) => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={trade.id} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 dark:text-white">{trade.symbol}</span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full w-fit ${
                          trade.status === 'Open' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}>
                          {trade.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                        trade.type === 'Long' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                      }`}>
                        {trade.type === 'Long' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {trade.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {trade.quantity || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-xs">
                        <span className="text-gray-500 dark:text-gray-400">In: <span className="text-gray-900 dark:text-white font-medium">${trade.entryPrice?.toLocaleString() || '-'}</span></span>
                        <span className="text-gray-500 dark:text-gray-400">Out: <span className="text-gray-900 dark:text-white font-medium">${trade.exitPrice?.toLocaleString() || '-'}</span></span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-right font-bold ${
                      trade.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {trade.profit >= 0 ? '+' : ''}${Math.abs(trade.profit).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {format(trade.timestamp.toDate(), 'MMM dd, HH:mm')}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-center">
                        <button 
                          id={`editTradeBtn-${trade.id}`}
                          onClick={() => onEdit(trade)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
          <AnimatePresence mode="popLayout">
            {filteredAndSortedTrades.map((trade) => (
              <motion.div 
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                key={trade.id} 
                className="p-4 active:bg-gray-50 dark:active:bg-gray-900/30 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 dark:text-white text-lg">{trade.symbol}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        trade.type === 'Long' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>
                        {trade.type}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {format(trade.timestamp.toDate(), 'MMM dd, yyyy • HH:mm')}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`font-bold text-lg ${
                      trade.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {trade.profit >= 0 ? '+' : ''}${Math.abs(trade.profit).toLocaleString()}
                    </span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                      trade.status === 'Open' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {trade.status}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mt-3 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg text-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">Qty</span>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{trade.quantity || '-'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">Entry</span>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">${trade.entryPrice?.toLocaleString() || '-'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">Exit</span>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">${trade.exitPrice?.toLocaleString() || '-'}</span>
                  </div>
                </div>

                {isAdmin && (
                  <div className="mt-3 flex justify-end">
                    <button 
                      id={`mobileEditTradeBtn-${trade.id}`}
                      onClick={() => onEdit(trade)}
                      className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg active:scale-95 transition-all"
                    >
                      <Edit2 className="w-3 h-3" /> Edit Trade
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredAndSortedTrades.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-6 py-20 text-center"
          >
            <div className="bg-gray-50 dark:bg-gray-900/50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Inbox className="w-8 h-8 text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">No trades found</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
              We couldn't find any trades matching your current filter criteria.
            </p>
            <button 
              onClick={resetFilters}
              className="mt-6 text-blue-600 dark:text-blue-400 font-bold hover:underline"
            >
              Clear all filters
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};
