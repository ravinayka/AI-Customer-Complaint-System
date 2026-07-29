import React from 'react';
import { useSelector } from 'react-redux';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

// Theme helper to retrieve typography colors
const useChartTheme = () => {
  const themeMode = useSelector((state) => state.settings.data.theme_mode);
  const isDark = themeMode === 'dark';
  return {
    gridColor: isDark ? '#1f2937' : '#e2e8f0',
    textColor: isDark ? '#9ca3af' : '#475569',
    tooltipBg: isDark ? '#111827' : '#ffffff',
    tooltipBorder: isDark ? '#1f2937' : '#e2e8f0',
    tooltipTextColor: isDark ? '#ffffff' : '#0f172a'
  };
};

// 1. Complaint Trends Chart (Area)
export function TrendChart({ data }) {
  const theme = useChartTheme();
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
        <XAxis 
          dataKey="date" 
          stroke={theme.textColor} 
          tick={{ fill: theme.textColor, fontSize: 11 }} 
        />
        <YAxis 
          allowDecimals={false} 
          stroke={theme.textColor} 
          tick={{ fill: theme.textColor, fontSize: 11 }} 
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: theme.tooltipBg, 
            borderColor: theme.tooltipBorder, 
            borderRadius: 8,
            color: theme.tooltipTextColor 
          }}
        />
        <Area 
          type="monotone" 
          dataKey="count" 
          stroke="#6366f1" 
          strokeWidth={3} 
          fillOpacity={1} 
          fill="url(#trendGrad)" 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// 2. Severity/Risk Distribution Chart (Pie)
export function SeverityChart({ data }) {
  const theme = useChartTheme();
  
  // Custom colors matching severity categories
  const COLORS = {
    Critical: '#ef4444',
    High: '#f59e0b',
    Medium: '#3b82f6',
    Low: '#10b981'
  };

  const formattedData = data.map(item => ({
    name: item.name,
    value: item.value
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={formattedData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={4}
          dataKey="value"
        >
          {formattedData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#6366f1'} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: theme.tooltipBg,
            borderColor: theme.tooltipBorder,
            borderRadius: 8,
            color: theme.tooltipTextColor
          }}
        />
        <Legend 
          wrapperStyle={{ fontSize: 12, color: theme.textColor }} 
          formatter={(value) => <span style={{ color: theme.textColor }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// 3. Complaint Types Chart (Bar)
export function CategoryChart({ data }) {
  const theme = useChartTheme();
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
        <XAxis 
          dataKey="name" 
          stroke={theme.textColor} 
          tick={{ fill: theme.textColor, fontSize: 11 }}
        />
        <YAxis 
          allowDecimals={false} 
          stroke={theme.textColor} 
          tick={{ fill: theme.textColor, fontSize: 11 }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: theme.tooltipBg,
            borderColor: theme.tooltipBorder,
            borderRadius: 8,
            color: theme.tooltipTextColor
          }}
        />
        <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
          {data.map((entry, idx) => (
            <Cell 
              key={`cell-${idx}`} 
              fill={idx % 2 === 0 ? '#6366f1' : '#06b6d4'} 
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// 4. Product-wise Complaints Chart (Horizontal Bar)
export function ProductChart({ data }) {
  const theme = useChartTheme();
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart 
        data={data} 
        layout="vertical" 
        margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
        <XAxis 
          type="number" 
          allowDecimals={false} 
          stroke={theme.textColor} 
          tick={{ fill: theme.textColor, fontSize: 11 }}
        />
        <YAxis 
          type="category" 
          dataKey="name" 
          stroke={theme.textColor} 
          tick={{ fill: theme.textColor, fontSize: 10 }}
          width={110}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: theme.tooltipBg,
            borderColor: theme.tooltipBorder,
            borderRadius: 8,
            color: theme.tooltipTextColor
          }}
        />
        <Bar dataKey="value" fill="#a855f7" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// 5. Monthly Complaints Chart (Bar)
export function MonthlyChart({ data }) {
  const theme = useChartTheme();
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
        <XAxis 
          dataKey="month" 
          stroke={theme.textColor} 
          tick={{ fill: theme.textColor, fontSize: 11 }}
        />
        <YAxis 
          allowDecimals={false} 
          stroke={theme.textColor} 
          tick={{ fill: theme.textColor, fontSize: 11 }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: theme.tooltipBg,
            borderColor: theme.tooltipBorder,
            borderRadius: 8,
            color: theme.tooltipTextColor
          }}
        />
        <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
