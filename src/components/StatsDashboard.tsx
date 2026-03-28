import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { format, startOfMonth, startOfWeek, startOfYear, startOfDay } from 'date-fns';
import { Trade, Profile } from '../types';
import { TrendingUp, TrendingDown, Activity, Target, PieChart as PieIcon, BarChart3 } from 'lucide-react';
import { motion } from 'motion/react';

interface StatsDashboardProps {
  trades: Trade[];
  profile: Profile | null;
  darkMode: boolean;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ trades, profile, darkMode }) => {
  const [performanceView, setPerformanceView] = React.useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly');
  
  const gridColor = darkMode ? '#334155' : '#f0f0f0';
  const textColor = darkMode ? '#94a3b8' : '#64748b';
  const tooltipBg = darkMode ? '#1e293b' : '#ffffff';
  const tooltipBorder = darkMode ? '#334155' : '#f0f0f0';
  // Equity Curve Data
  const chartData = [...trades]
    .sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis())
    .reduce((acc: any[], trade) => {
      const prevProfit = acc.length > 0 ? acc[acc.length - 1].cumulativeProfit : 0;
      acc.push({
        date: format(trade.timestamp.toDate(), 'MMM dd'),
        cumulativeProfit: prevProfit + trade.profit,
        profit: trade.profit,
      });
      return acc;
    }, []);

  // Asset Distribution Data
  const assetData = trades.reduce((acc: any[], trade) => {
    const existing = acc.find(i => i.name === trade.symbol);
    if (existing) {
      existing.value += 1;
      existing.profit += trade.profit;
    } else {
      acc.push({ name: trade.symbol, value: 1, profit: trade.profit });
    }
    return acc;
  }, []).sort((a, b) => b.value - a.value).slice(0, 7);

  // Daily Performance Data
  const dailyData = trades.reduce((acc: any[], trade) => {
    const day = format(startOfDay(trade.timestamp.toDate()), 'MMM dd, yyyy');
    const existing = acc.find(i => i.date === day);
    if (existing) {
      existing.profit += trade.profit;
      existing.trades += 1;
    } else {
      acc.push({ date: day, profit: trade.profit, trades: 1 });
    }
    return acc;
  }, []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Weekly Performance Data
  const weeklyData = trades.reduce((acc: any[], trade) => {
    const week = format(startOfWeek(trade.timestamp.toDate()), 'MMM dd, yyyy');
    const existing = acc.find(i => i.date === week);
    if (existing) {
      existing.profit += trade.profit;
      existing.trades += 1;
    } else {
      acc.push({ date: week, profit: trade.profit, trades: 1 });
    }
    return acc;
  }, []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Monthly Performance Data
  const monthlyData = trades.reduce((acc: any[], trade) => {
    const month = format(startOfMonth(trade.timestamp.toDate()), 'MMM yyyy');
    const existing = acc.find(i => i.date === month);
    if (existing) {
      existing.profit += trade.profit;
      existing.trades += 1;
    } else {
      acc.push({ date: month, profit: trade.profit, trades: 1 });
    }
    return acc;
  }, []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Yearly Performance Data
  const yearlyData = trades.reduce((acc: any[], trade) => {
    const year = format(startOfYear(trade.timestamp.toDate()), 'yyyy');
    const existing = acc.find(i => i.date === year);
    if (existing) {
      existing.profit += trade.profit;
      existing.trades += 1;
    } else {
      acc.push({ date: year, profit: trade.profit, trades: 1 });
    }
    return acc;
  }, []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const performanceData = {
    daily: dailyData,
    weekly: weeklyData,
    monthly: monthlyData,
    yearly: yearlyData
  }[performanceView];

  // Calculate derived stats from trades directly for real-time updates
  const calculatedStats = React.useMemo(() => {
    const totalProfit = trades.reduce((acc, t) => acc + t.profit, 0);
    const totalTrades = trades.length;
    const wins = trades.filter(t => t.profit > 0).length;
    const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0;
    const avgProfit = totalTrades > 0 ? totalProfit / totalTrades : 0;

    return { totalProfit, totalTrades, winRate, avgProfit };
  }, [trades]);

  const { totalProfit, totalTrades, winRate, avgProfit } = calculatedStats;

  return (
    <div className="space-y-6 mb-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -4 }}
          id="statCard-totalProfit" 
          className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md"
        >
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <span className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-sm font-medium uppercase tracking-wider">Total Profit</span>
            <TrendingUp className={`w-3 h-3 sm:w-4 sm:h-4 ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
          </div>
          <div className={`text-lg sm:text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            ${totalProfit.toLocaleString()}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -4 }}
          id="statCard-winRate" 
          className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md"
        >
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <span className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-sm font-medium uppercase tracking-wider">Win Rate</span>
            <Target className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
          </div>
          <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{winRate}%</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ y: -4 }}
          id="statCard-totalTrades" 
          className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md"
        >
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <span className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-sm font-medium uppercase tracking-wider">Total Trades</span>
            <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
          </div>
          <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{totalTrades}</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ y: -4 }}
          id="statCard-avgProfit" 
          className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md"
        >
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <span className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-sm font-medium uppercase tracking-wider">Avg Profit</span>
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500" />
          </div>
          <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
            ${avgProfit.toFixed(0)}
          </div>
        </motion.div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equity Curve */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          id="chart-equityCurve" 
          className="lg:col-span-2 bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors"
        >
          <h3 className="text-sm sm:text-lg font-bold mb-4 sm:mb-6 text-gray-800 dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-500" /> Equity Curve
          </h3>
          <div className="h-[200px] sm:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={undefined}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="date" stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={textColor} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: tooltipBg, borderRadius: '8px', border: `1px solid ${tooltipBorder}`, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: darkMode ? '#f8fafc' : '#1e293b' }}
                  itemStyle={{ color: darkMode ? '#f8fafc' : '#1e293b' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Cumulative Profit']}
                />
                <Area type="monotone" dataKey="cumulativeProfit" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Asset Distribution */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          id="chart-assetMix" 
          className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors"
        >
          <h3 className="text-sm sm:text-lg font-bold mb-4 sm:mb-6 text-gray-800 dark:text-white flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-blue-500" /> Asset Mix
          </h3>
          <div className="h-[200px] sm:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={undefined}>
              <PieChart>
                <Pie
                  data={assetData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {assetData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: tooltipBg, borderRadius: '8px', border: `1px solid ${tooltipBorder}`, color: darkMode ? '#f8fafc' : '#1e293b' }}
                  itemStyle={{ color: darkMode ? '#f8fafc' : '#1e293b' }}
                  formatter={(value: number, name: string) => [`${value} trades`, name]}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Performance Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        id="chart-performance" 
        className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-sm sm:text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-orange-500" /> Performance Analysis
          </h3>
          
          <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg self-start sm:self-auto">
            {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setPerformanceView(view)}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${
                  performanceView === view 
                    ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {view}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[200px] sm:h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={undefined}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis dataKey="date" stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke={textColor} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
              <Tooltip 
                contentStyle={{ backgroundColor: tooltipBg, borderRadius: '8px', border: `1px solid ${tooltipBorder}`, color: darkMode ? '#f8fafc' : '#1e293b' }}
                itemStyle={{ color: darkMode ? '#f8fafc' : '#1e293b' }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, `${performanceView.charAt(0).toUpperCase() + performanceView.slice(1)} Profit`]}
              />
              <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                {performanceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
};
