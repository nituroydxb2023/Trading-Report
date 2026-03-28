import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, login, logout, getTrades, getProfile, updateProfile } from './lib/firebase';
import { Trade, Profile } from './types';
import { StatsDashboard } from './components/StatsDashboard';
import { TradeList } from './components/TradeList';
import { TradeForm } from './components/TradeForm';
import { LogIn, LogOut, Plus, TrendingUp, ShieldCheck, X, Moon, Sun, Bell, BellOff, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { Toaster, toast } from 'sonner';

const ADMIN_EMAIL = "nituroydxb2023@gmail.com";

const notify = (title: string, options?: NotificationOptions) => {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification(title, options);
  }
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | undefined>();
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const isInitialLoad = React.useRef(true);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('darkMode');
      if (stored !== null) return stored === 'true';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      
      // Check notification permission
      if ("Notification" in window) {
        setNotificationsEnabled(Notification.permission === "granted");
      }
    });

    const unsubscribeTrades = getTrades((data, changes) => {
      setTrades(data);
      
      // Handle notifications for users who enabled them
      if (notificationsEnabled && !isInitialLoad.current && changes) {
        changes.forEach(change => {
          const trade = change.doc as Trade;
          if (change.type === 'added') {
            notify(`New Trade: ${trade.symbol}`, {
              body: `${trade.type} ${trade.quantity} @ ${trade.entryPrice}\nStatus: ${trade.status}`,
              icon: '/favicon.ico'
            });
          } else if (change.type === 'modified') {
            notify(`Trade Updated: ${trade.symbol}`, {
              body: `Status: ${trade.status}\nProfit/Loss: $${trade.profit}`,
              icon: '/favicon.ico'
            });
          }
        });
      }
      isInitialLoad.current = false;
    });

    const unsubscribeProfile = getProfile('main', (data) => {
      setProfile(data);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeTrades();
      unsubscribeProfile();
      isInitialLoad.current = true; // Reset for next subscription
    };
  }, [user?.email, notificationsEnabled]);

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === "granted");
  };

  // Recalculate stats efficiently when trades change
  const stats = React.useMemo(() => {
    const totalProfit = trades.reduce((acc, t) => acc + t.profit, 0);
    const totalTrades = trades.length;
    const wins = trades.filter(t => t.profit > 0).length;
    const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0;
    const avgProfit = totalTrades > 0 ? totalProfit / totalTrades : 0;
    
    return { totalProfit, totalTrades, winRate, avgProfit };
  }, [trades]);

  // Update profile stats whenever trades change (Admin only)
  useEffect(() => {
    if (isAdmin && profile) {
      // Only auto-update if stats actually changed to avoid loops
      const hasChanged = 
        stats.totalProfit !== profile.totalProfit || 
        stats.winRate !== profile.winRate || 
        stats.totalTrades !== profile.totalTrades ||
        stats.avgProfit !== profile.avgProfit;

      if (hasChanged) {
        updateProfile('main', {
          ...profile,
          ...stats,
          lastUpdated: new Date()
        });
      }
    }
  }, [stats, isAdmin, profile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Loading Trading Log...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4 transition-colors">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-gray-100 dark:border-gray-800"
        >
          <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200 dark:shadow-blue-900/20">
            <TrendingUp className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Trading Report</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Please login to view the real-time trading profit and loss log.
          </p>
          
          <div className="mb-8 p-4 bg-green-50 dark:bg-green-900/10 rounded-2xl border border-green-100 dark:border-green-900/20">
            <p className="text-sm text-green-700 dark:text-green-400 mb-3 font-medium">Need access or help?</p>
            <a 
              href="https://wa.me/971502616981" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 font-bold hover:underline"
            >
              <MessageCircle className="w-5 h-5" />
              Contact on WhatsApp
            </a>
          </div>
          <button 
            id="loginBtn"
            onClick={login}
            className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
          >
            <LogIn className="w-5 h-5" />
            Login with Google
          </button>
          <p className="mt-6 text-xs text-gray-400 dark:text-gray-500">
            Secure access powered by Firebase Authentication.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white font-sans transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight hidden sm:block">Trading Report</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <a 
              href="https://wa.me/971502616981" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/10 rounded-lg transition-all"
              title="Contact on WhatsApp"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="hidden md:inline text-sm font-bold">WhatsApp Admin</span>
            </a>

            <button
              id="toggleDarkModeBtn"
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
              title="Toggle Dark Mode"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              id="toggleNotificationsBtn"
              onClick={requestNotificationPermission}
              className={`p-2 rounded-lg transition-all ${
                notificationsEnabled 
                  ? 'text-green-600 bg-green-50 dark:bg-green-900/20' 
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              title={notificationsEnabled ? "Notifications Enabled" : "Enable Notifications"}
            >
              {notificationsEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
            </button>

            {notificationsEnabled && (
              <div className="flex flex-col items-center">
                <button
                  onClick={() => notify("Test Notification", { body: "Notifications are working correctly!", icon: "/favicon.ico" })}
                  className="hidden sm:flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Test
                </button>
                <span className="hidden lg:block text-[8px] text-gray-400 dark:text-gray-500">Open in new tab if blocked</span>
              </div>
            )}

            {user && (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-bold">{user.displayName}</span>
                  {isAdmin && (
                    <span className="text-[10px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <ShieldCheck className="w-2 h-2" /> Admin
                    </span>
                  )}
                </div>
                <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700" />
                <button 
                  id="logoutBtn"
                  onClick={logout}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                {profile?.name || "Trader's Dashboard"}
              </h2>
              {isAdmin && (
                <button 
                  id="editProfileBtn"
                  onClick={() => setShowProfileForm(true)}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Edit Profile Name"
                >
                  <Plus className="w-4 h-4 rotate-45" />
                </button>
              )}
            </div>
          </div>
          
          {isAdmin && (
            <button 
              id="addNewTradeBtn"
              onClick={() => {
                setEditingTrade(undefined);
                setShowForm(true);
              }}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 dark:shadow-blue-900/20"
            >
              <Plus className="w-5 h-5" />
              Add New Trade
            </button>
          )}
        </div>

        {/* Dashboard Stats */}
        <StatsDashboard trades={trades} profile={profile} darkMode={darkMode} />

        {/* Trade List */}
        <TradeList 
          trades={trades} 
          isAdmin={isAdmin} 
          onEdit={(trade) => {
            setEditingTrade(trade);
            setShowForm(true);
          }} 
        />
      </main>

      {/* Mobile Floating Action Button */}
      {isAdmin && (
        <div className="fixed bottom-6 right-6 sm:hidden z-50">
          <button 
            id="mobileAddTradeBtn"
            onClick={() => {
              setEditingTrade(undefined);
              setShowForm(true);
            }}
            className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-all"
          >
            <Plus className="w-8 h-8" />
          </button>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <TradeForm 
              onClose={() => setShowForm(false)} 
              editingTrade={editingTrade}
            />
          </motion.div>
        )}

        {showProfileForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-800">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Edit Profile</h2>
                <button 
                  id="closeProfileModalBtn"
                  onClick={() => setShowProfileForm(false)} 
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
              <div className="p-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Name</label>
                <input
                  type="text"
                  defaultValue={profile?.name}
                  id="profileNameInput"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mb-4 dark:text-white"
                />
                <button
                  id="saveProfileBtn"
                  onClick={async () => {
                    const newName = (document.getElementById('profileNameInput') as HTMLInputElement).value;
                    if (newName) {
                      try {
                        await updateProfile('main', { ...profile, name: newName });
                        toast.success('Profile updated successfully');
                        setShowProfileForm(false);
                      } catch (error) {
                        toast.error('Failed to update profile');
                      }
                    }
                  }}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Toaster position="top-right" richColors />
    </div>
  );
}
