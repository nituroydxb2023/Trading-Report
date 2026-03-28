import React, { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { Trade, TradeType, TradeStatus } from '../types';
import { addTrade, updateTrade, deleteTrade } from '../lib/firebase';
import { X, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface TradeFormProps {
  onClose: () => void;
  editingTrade?: Trade;
}

export const TradeForm: React.FC<TradeFormProps> = ({ onClose, editingTrade }) => {
  const [symbol, setSymbol] = useState(editingTrade?.symbol || '');
  const [type, setType] = useState<TradeType>(editingTrade?.type || 'Long');
  const [quantity, setQuantity] = useState(editingTrade?.quantity?.toString() || '');
  const [entryPrice, setEntryPrice] = useState(editingTrade?.entryPrice?.toString() || '');
  const [exitPrice, setExitPrice] = useState(editingTrade?.exitPrice?.toString() || '');
  const [profit, setProfit] = useState(editingTrade?.profit?.toString() || '');
  const [status, setStatus] = useState<TradeStatus>(editingTrade?.status || 'Closed');
  const [notes, setNotes] = useState(editingTrade?.notes || '');
  const [tradeDate, setTradeDate] = useState(
    editingTrade?.timestamp 
      ? new Date(editingTrade.timestamp.toMillis()).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const tradeData = {
      symbol,
      type,
      quantity: quantity ? parseFloat(quantity) : undefined,
      entryPrice: entryPrice ? parseFloat(entryPrice) : undefined,
      exitPrice: exitPrice ? parseFloat(exitPrice) : undefined,
      profit: parseFloat(profit),
      status,
      notes,
      timestamp: Timestamp.fromDate(new Date(tradeDate + 'T12:00:00')), // Use midday to avoid timezone shifts
    };

    try {
      if (editingTrade?.id) {
        await updateTrade(editingTrade.id, tradeData);
        toast.success('Trade updated successfully');
      } else {
        await addTrade(tradeData);
        toast.success('Trade added successfully');
      }
      onClose();
    } catch (error) {
      console.error('Error saving trade:', error);
      toast.error('Failed to save trade');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editingTrade?.id) return;
    
    setLoading(true);
    try {
      await deleteTrade(editingTrade.id);
      toast.success('Trade deleted successfully');
      onClose();
    } catch (error) {
      console.error('Error deleting trade:', error);
      toast.error('Failed to delete trade');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-800 transition-colors">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white" id="tradeFormTitle">
            {editingTrade ? 'Edit Trade' : 'New Trade'}
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            id="closeTradeFormBtn"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4" id="tradeEntryForm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
              <input
                type="date"
                required
                id="tradeDateInput"
                value={tradeDate}
                onChange={(e) => setTradeDate(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Symbol</label>
              <input
                type="text"
                required
                id="tradeSymbolInput"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="e.g. BTC/USDT"
                className="w-full px-4 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
              <select
                id="tradeTypeSelect"
                value={type}
                onChange={(e) => setType(e.target.value as TradeType)}
                className="w-full px-4 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
              >
                <option value="Long">Long</option>
                <option value="Short">Short</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                id="tradeStatusSelect"
                value={status}
                onChange={(e) => setStatus(e.target.value as TradeStatus)}
                className="w-full px-4 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
              >
                <option value="Open">Open</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
              <input
                type="number"
                step="0.000001"
                id="tradeQuantityInput"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Entry Price</label>
              <input
                type="number"
                step="0.000001"
                id="tradeEntryPriceInput"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Exit Price</label>
              <input
                type="number"
                step="0.000001"
                id="tradeExitPriceInput"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Profit/Loss ($)</label>
            <input
              type="number"
              step="0.01"
              required
              id="tradeProfitInput"
              value={profit}
              onChange={(e) => setProfit(e.target.value)}
              placeholder="e.g. 150.50 or -50.00"
              className="w-full px-4 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <textarea
              id="tradeNotesInput"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Trade details..."
              className="w-full px-4 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none dark:text-white"
            />
          </div>

          <div className="pt-4 flex gap-3">
            {editingTrade && (
              <button
                type="button"
                id="deleteTradeBtn"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
            <button
              type="submit"
              id="saveTradeBtn"
              disabled={loading}
              className="flex-[2] bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-bold transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : editingTrade ? 'Update Trade' : 'Add Trade'}
            </button>
          </div>
        </form>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[60] p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-2xl max-w-sm w-full border border-gray-100 dark:border-gray-800"
              >
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Delete Trade?</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">This action cannot be undone. Are you sure you want to delete this trade?</p>
                <div className="flex gap-3">
                  <button 
                    id="cancelDeleteBtn"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    id="confirmDeleteBtn"
                    onClick={handleDelete}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
