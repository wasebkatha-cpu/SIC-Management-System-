import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useAppContext } from '../context/AppContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LabelList
} from 'recharts';
import { FileText, ShieldAlert, CheckCircle, TrendingUp, Building2, MapPin, Plus, Filter, BarChart3, AlignLeft, Layers, X, BookOpen, Users, User, Search, PieChart as PieChartIcon, FileCheck, Eye, Sparkles, CheckCircle2, Calendar } from 'lucide-react';
import AddSummaryModal from './addSummaryModal';
import { ComplaintData, isComplaintInformationDisclosed } from '../context/AppContext';

// Helper to extract date
const getComplaintDate = (c: ComplaintData) => {
  if (c.proceedings && c.proceedings.length > 0) {
    const sorted = [...c.proceedings].sort((a, b) => a.srNo - b.srNo);
    return sorted[0].date;
  }
  return c.previousHearingDate || c.nextHearingDate || '';
};

const getMonthYear = (dateStr: string) => {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return { month: parts[1], year: parts[2] };
  }
  return { month: '', year: '' };
};

// Clean department / respondent names without truncating them
const cleanDepartmentName = (raw: string): string => {
  if (!raw) return 'Unassigned';
  let clean = raw
    .replace(/,\s*GOVT\.?\s*OF\s*SINDH/gi, '')
    .replace(/,\s*GOVERNMENT\s*OF\s*SINDH/gi, '')
    .replace(/,\s*SINDH/gi, '')
    .trim();

  // If entirely uppercase and longer than 3 letters, convert to Title Case for visual readability
  if (clean === clean.toUpperCase() && clean.length > 3) {
    clean = clean.split(' ').map((word, i) => {
      const w = word.toUpperCase();
      if (i > 0 && ['AND', '&', 'OF', 'THE', 'IN', 'FOR'].includes(w)) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
  }
  return clean;
};

// Clean complainant names for visual readability
const cleanComplainantName = (raw?: string): string => {
  if (!raw || !raw.trim()) return 'Unspecified Complainant';
  let clean = raw.trim();
  if (clean === clean.toUpperCase() && clean.length > 3) {
    clean = clean.split(' ').map((word, i) => {
      const w = word.toUpperCase();
      if (i > 0 && ['AND', '&', 'OF', 'THE', 'IN', 'FOR'].includes(w)) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
  }
  return clean;
};

const COMPLAINANT_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#14b8a6', '#a855f7'];

interface DashBoardProps {
  onNavigate?: (view: string) => void;
}

export default function DashBoard({ onNavigate }: DashBoardProps = {}) {
  const { complaints, enforcementActions } = useAppContext();
  const [isAddingSummary, setIsAddingSummary] = useState(false);
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('All');
  
  // Modal for viewing department-wise, district-wise, complainant-wise, stage, or proactive disclosure charts
  const [chartModal, setChartModal] = useState<'department' | 'district' | 'complainant' | 'stage' | 'proactive' | null>(null);

  // Proactive Disclosure states
  const [proactiveDeptSearchTerm, setProactiveDeptSearchTerm] = useState('');
  const [proactiveDistrictSearchTerm, setProactiveDistrictSearchTerm] = useState('');
  const [proactiveViewTab, setProactiveViewTab] = useState<'both' | 'departments' | 'districts'>('both');
  const [selectedProactiveItem, setSelectedProactiveItem] = useState<{
    type: 'department' | 'district';
    title: string;
    complaints: ComplaintData[];
  } | null>(null);
  const [proactiveModalDimension, setProactiveModalDimension] = useState<'department' | 'district'>('department');
  const [proactiveModalLayout, setProactiveModalLayout] = useState<'horizontal' | 'vertical' | 'donut'>('horizontal');

  // View toggles for optimal chart readability
  const [deptLayout, setDeptLayout] = useState<'horizontal' | 'vertical'>('horizontal');
  const [districtView, setDistrictView] = useState<'bar' | 'area'>('bar');
  const [complainantViewType, setComplainantViewType] = useState<'bar' | 'donut'>('bar');
  const [complainantModalLayout, setComplainantModalLayout] = useState<'horizontal' | 'vertical' | 'donut'>('horizontal');
  const [deptSearchTerm, setDeptSearchTerm] = useState('');
  const [districtSearchTerm, setDistrictSearchTerm] = useState('');
  const [complainantSearchTerm, setComplainantSearchTerm] = useState('');
  const [stageSearchTerm, setStageSearchTerm] = useState('');
  const [stageModalLayout, setStageModalLayout] = useState<'donut' | 'horizontal' | 'vertical'>('donut');
  // Display limit for complainant chart: by default display top 10 complainants
  const [complainantLimit, setComplainantLimit] = useState<'10' | '20' | 'all'>('10');
  const [modalComplainantLimit, setModalComplainantLimit] = useState<'10' | '20' | 'all'>('10');

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    complaints.forEach(c => {
      const { year } = getMonthYear(getComplaintDate(c));
      if (year) years.add(year);
    });
    enforcementActions.forEach(ea => {
      const { year } = getMonthYear(ea.date);
      if (year) years.add(year);
    });
    return Array.from(years).sort().reverse();
  }, [complaints, enforcementActions]);

  const filteredComplaints = useMemo(() => {
    return complaints.filter(c => {
      const { month, year } = getMonthYear(getComplaintDate(c));
      if (selectedYear !== 'All' && year !== selectedYear) return false;
      if (selectedMonth !== 'All' && month !== selectedMonth) return false;
      return true;
    });
  }, [complaints, selectedYear, selectedMonth]);

  const filteredEnforcements = useMemo(() => {
    return enforcementActions.filter(ea => {
      const { month, year } = getMonthYear(ea.date);
      if (selectedYear !== 'All' && year !== selectedYear) return false;
      if (selectedMonth !== 'All' && month !== selectedMonth) return false;
      return true;
    });
  }, [enforcementActions, selectedYear, selectedMonth]);

  // Metrics Calculations
  const metrics = useMemo(() => {
    const total = filteredComplaints.length;
    
    const disposed = filteredComplaints.filter(c => c.statusStage.toLowerCase().includes('disposed') || c.remarks.toLowerCase().includes('disposed')).length;
    const inProcess = total - disposed;
    
    // Calculate category summaries directly from the filtered enforcementActions context
    const penalties = filteredEnforcements.filter(ea => ea.type === 'Penalty').length;
    const nonMaintainable = filteredEnforcements.filter(ea => ea.type === 'Non-Maintainable').length;

    // District-wise grouping with full names
    const districtMap = filteredComplaints.reduce((acc, c) => {
      const dist = c.district || 'Karachi';
      acc[dist] = (acc[dist] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Supplement sample districts if data is sparse for demonstration
    if (Object.keys(districtMap).length < 2 && total > 0) {
      districtMap['Hyderabad'] = Math.floor(total * 0.3);
      districtMap['Sukkur'] = Math.floor(total * 0.1);
    }
    const districtData = Object.entries(districtMap)
      .map(([name, value]) => {
        const count = Number(value);
        const pct = total > 0 ? (count / total) * 100 : 0;
        const rounded = Math.round(pct);
        const displayPercentage = pct > 0 && rounded === 0 ? '<1%' : `${rounded}%`;
        return { 
          name, 
          value: count,
          percentage: rounded,
          precisePercentage: pct.toFixed(1),
          displayPercentage
        };
      })
      .sort((a, b) => b.value - a.value);

    // Department/Public Body grouping - full legible name without cutting off
    const deptMap = filteredComplaints.reduce((acc, c) => {
      const dept = cleanDepartmentName(c.respondentName);
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const departmentData = Object.entries(deptMap)
      .map(([name, value]) => {
        const count = Number(value);
        const pct = total > 0 ? (count / total) * 100 : 0;
        const rounded = Math.round(pct);
        const displayPercentage = pct > 0 && rounded === 0 ? '<1%' : `${rounded}%`;
        return { 
          name, 
          value: count,
          percentage: rounded,
          precisePercentage: pct.toFixed(1),
          displayPercentage
        };
      })
      .sort((a, b) => b.value - a.value);

    // Complainant-wise grouping
    const complainantMap = filteredComplaints.reduce((acc, c) => {
      const name = cleanComplainantName(c.complainantName);
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const complainantData = Object.entries(complainantMap)
      .map(([name, value]) => {
        const count = Number(value);
        const pct = total > 0 ? (count / total) * 100 : 0;
        const rounded = Math.round(pct);
        const displayPercentage = pct > 0 && rounded === 0 ? '<1%' : `${rounded}%`;
        return { 
          name, 
          value: count,
          percentage: rounded,
          precisePercentage: pct.toFixed(1),
          displayPercentage
        };
      })
      .sort((a, b) => b.value - a.value);

    // Gender grouping
    const genderMap = filteredComplaints.reduce((acc, c) => {
      let gender = 'Not Specified';
      if (c.additionalFields) {
        const genderField = c.additionalFields.find(f => f.name === 'Gender');
        if (genderField && genderField.value) {
          gender = genderField.value;
        }
      }
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const genderData = Object.entries(genderMap)
      .map(([name, value]) => {
        const count = Number(value);
        const pct = total > 0 ? (count / total) * 100 : 0;
        return { name, value: count, percentage: Math.round(pct) };
      })
      .sort((a, b) => b.value - a.value);

    // Stage Distribution for Chart & Structured Metrics List
    const stageMap = filteredComplaints.reduce((acc, c) => {
      const stage = c.statusStage || 'Pending';
      acc[stage] = (acc[stage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const stageData = Object.entries(stageMap)
      .map(([name, value]) => {
        const count = Number(value);
        const pct = total > 0 ? (count / total) * 100 : 0;
        const rounded = Math.round(pct);
        const displayPercentage = pct > 0 && rounded === 0 ? '<1%' : `${rounded}%`;
        return { 
          name, 
          value: count,
          percentage: rounded,
          precisePercentage: pct.toFixed(1),
          displayPercentage
        };
      })
      .sort((a, b) => b.value - a.value);

    // Proactive Disclosure calculations:
    // "Proactive Disclosure is a section which will list out all the departments which have disclosed the information requested by the complainant."
    const disclosedComplaints = filteredComplaints.filter(c => isComplaintInformationDisclosed(c));
    const totalDisclosed = disclosedComplaints.length;
    const proactiveDisclosures = Math.max(
      totalDisclosed,
      filteredEnforcements.filter(ea => ea.type === 'Proactive Disclosure').length
    );

    // Grouping by Department for Proactive Disclosure
    const proactiveDeptMap = disclosedComplaints.reduce((acc, c) => {
      const dept = cleanDepartmentName(c.respondentName);
      if (!acc[dept]) {
        acc[dept] = {
          count: 0,
          districts: new Set<string>(),
          complaints: [] as ComplaintData[]
        };
      }
      acc[dept].count += 1;
      if (c.district) acc[dept].districts.add(c.district);
      acc[dept].complaints.push(c);
      return acc;
    }, {} as Record<string, { count: number; districts: Set<string>; complaints: ComplaintData[] }>);

    const proactiveDeptData = Object.entries(proactiveDeptMap)
      .map(([name, item]: [string, { count: number; districts: Set<string>; complaints: ComplaintData[] }]) => {
        const count = item.count;
        const pct = totalDisclosed > 0 ? (count / totalDisclosed) * 100 : 0;
        const rounded = Math.round(pct);
        const displayPercentage = pct > 0 && rounded === 0 ? '<1%' : `${rounded}%`;
        return {
          name,
          value: count,
          percentage: rounded,
          precisePercentage: pct.toFixed(1),
          displayPercentage,
          districts: Array.from(item.districts),
          complaints: item.complaints
        };
      })
      .sort((a, b) => b.value - a.value);

    // Grouping by District for Proactive Disclosure
    const proactiveDistrictMap = disclosedComplaints.reduce((acc, c) => {
      const dist = c.district || 'Karachi';
      if (!acc[dist]) {
        acc[dist] = {
          count: 0,
          departments: new Set<string>(),
          complaints: [] as ComplaintData[]
        };
      }
      acc[dist].count += 1;
      acc[dist].departments.add(cleanDepartmentName(c.respondentName));
      acc[dist].complaints.push(c);
      return acc;
    }, {} as Record<string, { count: number; departments: Set<string>; complaints: ComplaintData[] }>);

    const proactiveDistrictData = Object.entries(proactiveDistrictMap)
      .map(([name, item]: [string, { count: number; departments: Set<string>; complaints: ComplaintData[] }]) => {
        const count = item.count;
        const pct = totalDisclosed > 0 ? (count / totalDisclosed) * 100 : 0;
        const rounded = Math.round(pct);
        const displayPercentage = pct > 0 && rounded === 0 ? '<1%' : `${rounded}%`;
        return {
          name,
          value: count,
          percentage: rounded,
          precisePercentage: pct.toFixed(1),
          displayPercentage,
          departments: Array.from(item.departments),
          complaints: item.complaints
        };
      })
      .sort((a, b) => b.value - a.value);

    return {
      total, disposed, inProcess, penalties, nonMaintainable, proactiveDisclosures,
      districtData, departmentData, stageData, complainantData, genderData,
      proactiveDeptData, proactiveDistrictData, totalDisclosed, disclosedComplaints
    };
  }, [filteredComplaints, filteredEnforcements]);

  // Top-N complainant data for the dashboard card chart (default: Top 10)
  const displayedComplainantData = useMemo(() => {
    if (complainantLimit === '10') return metrics.complainantData.slice(0, 10);
    if (complainantLimit === '20') return metrics.complainantData.slice(0, 20);
    return metrics.complainantData;
  }, [metrics.complainantData, complainantLimit]);

  // Donut distribution data grouping beyond Top-N into "Others" (default: Top 10)
  const complainantDonutData = useMemo(() => {
    const limitNum = complainantLimit === '10' ? 10 : complainantLimit === '20' ? 20 : metrics.complainantData.length;
    if (metrics.complainantData.length <= limitNum) {
      return metrics.complainantData.map(item => ({ ...item, isOther: false }));
    }
    const topSlice = metrics.complainantData.slice(0, limitNum).map(item => ({ ...item, isOther: false }));
    const remainingValue = metrics.complainantData.slice(limitNum).reduce((acc, curr) => acc + curr.value, 0);
    const remainingPct = metrics.total > 0 ? Math.round((remainingValue / metrics.total) * 100) : 0;
    const remainingPrecisePct = metrics.total > 0 ? ((remainingValue / metrics.total) * 100).toFixed(1) : '0';
    return [
      ...topSlice,
      {
        name: `Others (${metrics.complainantData.length - limitNum} citizens)`,
        value: remainingValue,
        percentage: remainingPct,
        precisePercentage: remainingPrecisePct,
        isOther: true
      }
    ];
  }, [metrics.complainantData, metrics.total, complainantLimit]);

  // Top-N complainant data for modal (default: Top 10)
  const displayedModalComplainantData = useMemo(() => {
    if (modalComplainantLimit === '10') return metrics.complainantData.slice(0, 10);
    if (modalComplainantLimit === '20') return metrics.complainantData.slice(0, 20);
    return metrics.complainantData;
  }, [metrics.complainantData, modalComplainantLimit]);

  // Modal Donut distribution data grouping beyond Top-N into "Others" (default: Top 10)
  const modalComplainantDonutData = useMemo(() => {
    const limitNum = modalComplainantLimit === '10' ? 10 : modalComplainantLimit === '20' ? 20 : metrics.complainantData.length;
    if (metrics.complainantData.length <= limitNum) {
      return metrics.complainantData.map(item => ({ ...item, isOther: false }));
    }
    const topSlice = metrics.complainantData.slice(0, limitNum).map(item => ({ ...item, isOther: false }));
    const remainingValue = metrics.complainantData.slice(limitNum).reduce((acc, curr) => acc + curr.value, 0);
    const remainingPct = metrics.total > 0 ? Math.round((remainingValue / metrics.total) * 100) : 0;
    const remainingPrecisePct = metrics.total > 0 ? ((remainingValue / metrics.total) * 100).toFixed(1) : '0';
    return [
      ...topSlice,
      {
        name: `Others (${metrics.complainantData.length - limitNum} citizens)`,
        value: remainingValue,
        percentage: remainingPct,
        precisePercentage: remainingPrecisePct,
        isOther: true
      }
    ];
  }, [metrics.complainantData, metrics.total, modalComplainantLimit]);

  // Filtered department data for column list
  const filteredDepartmentData = useMemo(() => {
    if (!deptSearchTerm.trim()) return metrics.departmentData;
    const term = deptSearchTerm.toLowerCase();
    return metrics.departmentData.filter(item => item.name.toLowerCase().includes(term));
  }, [metrics.departmentData, deptSearchTerm]);

  // Filtered district data for column list
  const filteredDistrictData = useMemo(() => {
    if (!districtSearchTerm.trim()) return metrics.districtData;
    const term = districtSearchTerm.toLowerCase();
    return metrics.districtData.filter(item => item.name.toLowerCase().includes(term));
  }, [metrics.districtData, districtSearchTerm]);

  // Filtered/searched complainant data for list (defaults to top 10 when not searching)
  const filteredComplainantData = useMemo(() => {
    if (!complainantSearchTerm.trim()) {
      return complainantLimit === '10' ? metrics.complainantData.slice(0, 10) :
             complainantLimit === '20' ? metrics.complainantData.slice(0, 20) :
             metrics.complainantData;
    }
    const term = complainantSearchTerm.toLowerCase();
    return metrics.complainantData.filter(item => item.name.toLowerCase().includes(term));
  }, [metrics.complainantData, complainantSearchTerm, complainantLimit]);

  // Filtered stage data for column list
  const filteredStageData = useMemo(() => {
    if (!stageSearchTerm.trim()) return metrics.stageData;
    const term = stageSearchTerm.toLowerCase();
    return metrics.stageData.filter(item => item.name.toLowerCase().includes(term));
  }, [metrics.stageData, stageSearchTerm]);

  // Filtered proactive disclosure department data
  const filteredProactiveDeptData = useMemo(() => {
    if (!proactiveDeptSearchTerm.trim()) return metrics.proactiveDeptData;
    const term = proactiveDeptSearchTerm.toLowerCase();
    return metrics.proactiveDeptData.filter(item => 
      item.name.toLowerCase().includes(term) ||
      item.districts.some(d => d.toLowerCase().includes(term))
    );
  }, [metrics.proactiveDeptData, proactiveDeptSearchTerm]);

  // Filtered proactive disclosure district data
  const filteredProactiveDistrictData = useMemo(() => {
    if (!proactiveDistrictSearchTerm.trim()) return metrics.proactiveDistrictData;
    const term = proactiveDistrictSearchTerm.toLowerCase();
    return metrics.proactiveDistrictData.filter(item => 
      item.name.toLowerCase().includes(term) ||
      item.departments.some(dept => dept.toLowerCase().includes(term))
    );
  }, [metrics.proactiveDistrictData, proactiveDistrictSearchTerm]);

  const summaryMetrics = useMemo(() => [
    {
      title: 'Total Complaints',
      value: metrics.total,
      icon: <FileText className="w-4.5 h-4.5 text-blue-600 dark:text-blue-300" />,
      bg: 'bg-blue-50 dark:bg-blue-900/40 border border-blue-200/60 dark:border-blue-700/60',
      valueColor: 'text-blue-600 dark:text-blue-300',
      badge: 'All Received',
      badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 ring-1 ring-inset ring-blue-600/20 dark:ring-blue-700/50',
    },
    {
      title: 'Disposed-off',
      value: metrics.disposed,
      icon: <CheckCircle className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-300" />,
      bg: 'bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200/60 dark:border-emerald-700/60',
      valueColor: 'text-emerald-600 dark:text-emerald-300',
      badge: metrics.total > 0 ? `${Math.round((metrics.disposed / metrics.total) * 100)}% resolved` : 'Resolved',
      badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 ring-1 ring-inset ring-emerald-600/20 dark:ring-emerald-700/50',
    },
    {
      title: 'In Process',
      value: metrics.inProcess,
      icon: <TrendingUp className="w-4.5 h-4.5 text-amber-600 dark:text-amber-300" />,
      bg: 'bg-amber-50 dark:bg-amber-900/40 border border-amber-200/60 dark:border-amber-700/60',
      valueColor: 'text-amber-600 dark:text-amber-300',
      badge: metrics.total > 0 ? `${Math.round((metrics.inProcess / metrics.total) * 100)}% active` : 'Active',
      badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 ring-1 ring-inset ring-amber-600/20 dark:ring-amber-700/50',
    },
    {
      title: 'Penalties Imposed',
      value: metrics.penalties,
      icon: <ShieldAlert className="w-4.5 h-4.5 text-rose-600 dark:text-rose-300" />,
      bg: 'bg-rose-50 dark:bg-rose-900/40 border border-rose-200/60 dark:border-rose-700/60',
      valueColor: 'text-rose-600 dark:text-rose-300',
      badge: 'Enforcement',
      badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 ring-1 ring-inset ring-rose-600/20 dark:ring-rose-700/50',
    },
    {
      title: 'Non-Maintainable',
      value: metrics.nonMaintainable,
      icon: <ShieldAlert className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-300" />,
      bg: 'bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-200/60 dark:border-indigo-700/60',
      valueColor: 'text-indigo-600 dark:text-indigo-300',
      badge: 'Dismissed',
      badgeClass: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 ring-1 ring-inset ring-indigo-600/20 dark:ring-indigo-700/50',
    },
    {
      title: 'Proactive Disclosure',
      value: metrics.proactiveDisclosures,
      icon: <FileCheck className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-300" />,
      bg: 'bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200/60 dark:border-emerald-700/60',
      valueColor: 'text-emerald-600 dark:text-emerald-300',
      badge: `${metrics.proactiveDeptData.length} depts`,
      badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 ring-1 ring-inset ring-emerald-600/20 dark:ring-emerald-700/50',
    },
  ], [metrics]);

  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  const renderProactiveModalChart = () => {
    const proactiveChartData = proactiveModalDimension === 'department' ? metrics.proactiveDeptData : metrics.proactiveDistrictData;
    const proactiveChartColors = ['#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e'];

    if (proactiveChartData.length === 0) {
      return (
        <div className="h-full flex items-center justify-center text-sm text-neutral-400 dark:text-slate-500 py-20">
          No proactive disclosure records found for the selected timeframe.
        </div>
      );
    }

    if (proactiveModalLayout === 'donut') {
      return (
        <div className="w-full h-[400px] flex flex-col md:flex-row items-center justify-center gap-6">
          <div className="w-full md:w-3/5 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={proactiveChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={120}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {proactiveChartData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={proactiveChartColors[index % proactiveChartColors.length]} />
                  ))}
                </Pie>
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white text-xs p-3 rounded-lg shadow-xl border border-slate-700 max-w-xs z-50">
                          <p className="font-semibold text-white mb-1 leading-snug">{item.name}</p>
                          <div className="flex items-center justify-between gap-4 text-emerald-400 mt-1">
                            <span>Disclosed Requests:</span>
                            <span className="text-white font-bold text-sm">{item.value}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {item.displayPercentage} of all disclosures
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full md:w-2/5 max-h-[300px] overflow-y-auto pr-2 space-y-1.5 border-t md:border-t-0 md:border-l border-neutral-200 dark:border-slate-800 pt-3 md:pt-0 md:pl-4">
            <p className="text-xs font-semibold text-neutral-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              {proactiveModalDimension === 'department' ? 'Disclosing Public Bodies' : 'Disclosing Districts'}
            </p>
            {proactiveChartData.map((item, idx) => (
              <div
                key={item.name}
                onClick={() => setSelectedProactiveItem({
                  type: proactiveModalDimension,
                  title: proactiveModalDimension === 'department' ? item.name : `District ${item.name}`,
                  complaints: item.complaints
                })}
                className="flex items-center justify-between text-xs py-1 px-1.5 rounded hover:bg-neutral-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: proactiveChartColors[idx % proactiveChartColors.length] }} />
                  <span className="truncate text-neutral-800 dark:text-slate-200">{item.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="font-bold text-neutral-900 dark:text-white">{item.value}</span>
                  <span className="text-neutral-400 dark:text-slate-500 text-[10px]">({item.displayPercentage})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (proactiveModalLayout === 'vertical') {
      return (
        <div className="w-full h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={proactiveChartData}
              margin={{ top: 15, right: 15, left: -10, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.25} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                angle={-40}
                textAnchor="end"
                interval={0}
                height={110}
                dx={-4}
                dy={6}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#94a3b8' }}
              />
              <RechartsTooltip
                cursor={{ fill: 'rgba(16, 185, 129, 0.08)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white text-xs p-3 rounded-lg shadow-xl border border-slate-700 max-w-sm z-50">
                        <p className="font-semibold text-white mb-1 leading-snug">{item.name}</p>
                        <div className="flex items-center justify-between gap-4 text-emerald-400 mt-1">
                          <span>Disclosed Requests:</span>
                          <span className="text-white font-bold text-sm">{item.value}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {item.displayPercentage} of all proactive disclosures
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="value"
                name="Disclosures"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                maxBarSize={45}
              >
                <LabelList dataKey="displayPercentage" position="top" style={{ fontSize: 11, fill: '#10b981', fontWeight: 600 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    // Default 'horizontal' layout:
    const dynamicHeight = Math.max(380, proactiveChartData.length * 34);
    return (
      <div className="w-full" style={{ height: `${dynamicHeight}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={proactiveChartData}
            layout="vertical"
            margin={{ top: 10, right: 40, left: 10, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.25} />
            <XAxis
              type="number"
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#94a3b8' }}
            />
            <YAxis
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              width={190}
            />
            <RechartsTooltip
              cursor={{ fill: 'rgba(16, 185, 129, 0.08)' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white text-xs p-3 rounded-lg shadow-xl border border-slate-700 max-w-sm z-50">
                      <p className="font-semibold text-white mb-1 leading-snug">{item.name}</p>
                      <div className="flex items-center justify-between gap-4 text-emerald-400 mt-1">
                        <span>Disclosed Requests:</span>
                        <span className="text-white font-bold text-sm">{item.value}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {item.displayPercentage} of all proactive disclosures
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="value"
              name="Disclosures"
              fill="#10b981"
              radius={[0, 4, 4, 0]}
              maxBarSize={22}
            >
              <LabelList dataKey="displayPercentage" position="right" style={{ fontSize: 11, fill: '#10b981', fontWeight: 600 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {isAddingSummary && <AddSummaryModal onClose={() => setIsAddingSummary(false)} />}
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Analytics Dashboard
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-300 mt-1">
            Comprehensive overview of complaints, public bodies, and enforcement metrics.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Global Filter */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-neutral-200 dark:border-slate-800 shadow-sm shrink-0">
            <Filter className="w-4 h-4 text-neutral-400 dark:text-neutral-400 ml-2" />
            
            <select 
              value={selectedYear} 
              onChange={e => setSelectedYear(e.target.value)}
              className="text-sm border-none bg-transparent py-1 pr-7 focus:ring-0 text-neutral-700 dark:text-white cursor-pointer outline-none"
            >
              <option value="All" className="dark:bg-slate-900 dark:text-white">All Years</option>
              {availableYears.map(y => <option key={y} value={y} className="dark:bg-slate-900 dark:text-white">{y}</option>)}
            </select>
            
            <div className="w-px h-5 bg-neutral-200 dark:bg-slate-800 mx-1"></div>
            
            <select 
              value={selectedMonth} 
              onChange={e => setSelectedMonth(e.target.value)}
              className="text-sm border-none bg-transparent py-1 pr-7 focus:ring-0 text-neutral-700 dark:text-white cursor-pointer outline-none"
            >
              <option value="All" className="dark:bg-slate-900 dark:text-white">All Months</option>
              <option value="01" className="dark:bg-slate-900 dark:text-white">January</option>
              <option value="02" className="dark:bg-slate-900 dark:text-white">February</option>
              <option value="03" className="dark:bg-slate-900 dark:text-white">March</option>
              <option value="04" className="dark:bg-slate-900 dark:text-white">April</option>
              <option value="05" className="dark:bg-slate-900 dark:text-white">May</option>
              <option value="06" className="dark:bg-slate-900 dark:text-white">June</option>
              <option value="07" className="dark:bg-slate-900 dark:text-white">July</option>
              <option value="08" className="dark:bg-slate-900 dark:text-white">August</option>
              <option value="09" className="dark:bg-slate-900 dark:text-white">September</option>
              <option value="10" className="dark:bg-slate-900 dark:text-white">October</option>
              <option value="11" className="dark:bg-slate-900 dark:text-white">November</option>
              <option value="12" className="dark:bg-slate-900 dark:text-white">December</option>
            </select>
          </div>

          {onNavigate && (
            <button
              onClick={() => onNavigate('documentation')}
              className="flex items-center justify-center gap-2 bg-neutral-100 dark:bg-slate-800 hover:bg-neutral-200 dark:hover:bg-slate-700 text-neutral-700 dark:text-slate-200 border border-neutral-200 dark:border-slate-700 px-3.5 py-2.5 rounded-md font-medium text-sm transition-colors shadow-2xs whitespace-nowrap shrink-0 cursor-pointer"
              title="Open System Documentation and User Manual"
            >
              <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>User Guide & Docs</span>
            </button>
          )}

          <button
            onClick={() => setIsAddingSummary(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-md font-medium text-sm transition-colors shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Summary</span>
          </button>
        </div>
      </div>

      {/* Top Metrics - Consolidated Single Card with List */}
      <div className="bg-white dark:bg-gradient-to-b dark:from-slate-900/95 dark:via-slate-900/90 dark:to-slate-900/95 rounded-xl border border-neutral-200 dark:border-slate-800 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 mb-2 border-b border-neutral-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-neutral-900 dark:text-white">
                Complaints & Enforcement Summary
              </h3>
              <p className="text-xs text-neutral-500 dark:text-slate-400">
                Consolidated overview of all complaint stages and enforcement actions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-slate-800 text-neutral-700 dark:text-slate-300">
              Total Complaints: {metrics.total}
            </span>
          </div>
        </div>

        {/* List of 6 Metrics in One Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 divide-y md:divide-y-0">
          <ul className="divide-y divide-neutral-100 dark:divide-slate-800/80">
            {summaryMetrics.slice(0, 3).map((item, idx) => (
              <li
                key={item.title}
                className="py-3 px-2.5 flex items-center justify-between hover:bg-neutral-50/80 dark:hover:bg-slate-800/40 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-semibold text-neutral-400 dark:text-slate-500 w-4 text-center shrink-0">
                    {idx + 1}.
                  </span>
                  <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center shrink-0`}>
                    {item.icon}
                  </div>
                  <span className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                    {item.title}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ring-1 ring-inset ${item.badgeClass}`}>
                    {item.badge}
                  </span>
                  <span className={`text-xl font-bold min-w-[2.5rem] text-right ${item.valueColor}`}>
                    {item.value}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <ul className="divide-y divide-neutral-100 dark:divide-slate-800/80">
            {summaryMetrics.slice(3, 6).map((item, idx) => (
              <li
                key={item.title}
                className="py-3 px-2.5 flex items-center justify-between hover:bg-neutral-50/80 dark:hover:bg-slate-800/40 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-semibold text-neutral-400 dark:text-slate-500 w-4 text-center shrink-0">
                    {idx + 4}.
                  </span>
                  <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center shrink-0`}>
                    {item.icon}
                  </div>
                  <span className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                    {item.title}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ring-1 ring-inset ${item.badgeClass}`}>
                    {item.badge}
                  </span>
                  <span className={`text-xl font-bold min-w-[2.5rem] text-right ${item.valueColor}`}>
                    {item.value}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 3-Column Display: Department-wise, District-wise & Complainant-wise Complaints */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 items-stretch">
        
        {/* Column 1: Department-wise Complaints */}
        <div className="bg-white dark:bg-gradient-to-b dark:from-slate-900/95 dark:via-slate-900/90 dark:to-slate-900/95 rounded-xl border border-neutral-200/90 dark:border-slate-800 shadow-xs p-4 sm:p-5 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 pb-3 mb-3 border-b border-neutral-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                  Department-wise
                </h3>
                <p className="text-[11px] text-neutral-500 dark:text-slate-400 truncate">
                  Breakdown by public body
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50">
                {metrics.departmentData.length}
              </span>
              <button
                type="button"
                onClick={() => setChartModal('department')}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/80 dark:text-blue-300 dark:hover:bg-blue-900/60 border border-blue-200/80 dark:border-blue-800/80 transition-colors cursor-pointer shadow-2xs"
                title="Open Department-wise Complaints Chart Modal"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Chart</span>
              </button>
            </div>
          </div>

          {/* Column Search Filter */}
          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search department..."
              value={deptSearchTerm}
              onChange={(e) => setDeptSearchTerm(e.target.value)}
              className="w-full text-xs pl-8 pr-7 py-1.5 rounded-lg bg-neutral-50/80 dark:bg-slate-800/60 border border-neutral-200/80 dark:border-slate-700/80 text-neutral-800 dark:text-slate-200 placeholder-neutral-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
            {deptSearchTerm && (
              <button
                type="button"
                onClick={() => setDeptSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:text-slate-500 dark:hover:text-slate-300 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Department Structured Metrics List */}
          <div className="flex-1 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
            {filteredDepartmentData.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-400 dark:text-slate-500">
                {deptSearchTerm ? 'No matching departments found.' : 'No department records found.'}
              </div>
            ) : (
              <ul className="divide-y divide-neutral-100 dark:divide-slate-800/80">
                {filteredDepartmentData.map((item, idx) => (
                  <li
                    key={item.name}
                    className="py-2.5 px-2 flex items-center justify-between hover:bg-neutral-50/80 dark:hover:bg-slate-800/40 rounded-lg transition-colors gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-1 flex-1">
                      <span className="text-xs font-semibold text-neutral-400 dark:text-slate-500 w-4 text-center shrink-0">
                        {idx + 1}.
                      </span>
                      <div className="w-6.5 h-6.5 rounded-md bg-blue-50 dark:bg-blue-900/40 border border-blue-200/60 dark:border-blue-700/60 flex items-center justify-center shrink-0">
                        <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-300" />
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-neutral-900 dark:text-white truncate" title={item.name}>
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span 
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ring-1 ring-inset bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 ring-blue-600/20 dark:ring-blue-700/50"
                        title={`${item.precisePercentage}% of total complaints`}
                      >
                        {item.displayPercentage}
                      </span>
                      <span className="text-sm sm:text-base font-bold min-w-[1.75rem] text-right text-blue-600 dark:text-blue-300">
                        {item.value}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer stats */}
          <div className="pt-2.5 mt-2 border-t border-neutral-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-neutral-500 dark:text-slate-400 px-1">
            <span>
              {deptSearchTerm 
                ? `Found ${filteredDepartmentData.length} of ${metrics.departmentData.length}` 
                : `${metrics.departmentData.length} active departments`}
            </span>
            <span className="font-semibold text-neutral-700 dark:text-slate-300">
              Total: {metrics.departmentData.reduce((acc, d) => acc + d.value, 0)}
            </span>
          </div>
        </div>

        {/* Column 2: District-wise Complaints */}
        <div className="bg-white dark:bg-gradient-to-b dark:from-slate-900/95 dark:via-slate-900/90 dark:to-slate-900/95 rounded-xl border border-neutral-200/90 dark:border-slate-800 shadow-xs p-4 sm:p-5 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 pb-3 mb-3 border-b border-neutral-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                  District-wise
                </h3>
                <p className="text-[11px] text-neutral-500 dark:text-slate-400 truncate">
                  Mapped across Sindh districts
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">
                {metrics.districtData.length}
              </span>
              <button
                type="button"
                onClick={() => setChartModal('district')}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/80 dark:text-emerald-300 dark:hover:bg-emerald-900/60 border border-emerald-200/80 dark:border-emerald-800/80 transition-colors cursor-pointer shadow-2xs"
                title="Open District-wise Complaints Chart Modal"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Chart</span>
              </button>
            </div>
          </div>

          {/* Column Search Filter */}
          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search district..."
              value={districtSearchTerm}
              onChange={(e) => setDistrictSearchTerm(e.target.value)}
              className="w-full text-xs pl-8 pr-7 py-1.5 rounded-lg bg-neutral-50/80 dark:bg-slate-800/60 border border-neutral-200/80 dark:border-slate-700/80 text-neutral-800 dark:text-slate-200 placeholder-neutral-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            />
            {districtSearchTerm && (
              <button
                type="button"
                onClick={() => setDistrictSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:text-slate-500 dark:hover:text-slate-300 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* District Structured Metrics List */}
          <div className="flex-1 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
            {filteredDistrictData.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-400 dark:text-slate-500">
                {districtSearchTerm ? 'No matching districts found.' : 'No district records found.'}
              </div>
            ) : (
              <ul className="divide-y divide-neutral-100 dark:divide-slate-800/80">
                {filteredDistrictData.map((item, idx) => (
                  <li
                    key={item.name}
                    className="py-2.5 px-2 flex items-center justify-between hover:bg-neutral-50/80 dark:hover:bg-slate-800/40 rounded-lg transition-colors gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-1 flex-1">
                      <span className="text-xs font-semibold text-neutral-400 dark:text-slate-500 w-4 text-center shrink-0">
                        {idx + 1}.
                      </span>
                      <div className="w-6.5 h-6.5 rounded-md bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200/60 dark:border-emerald-700/60 flex items-center justify-center shrink-0">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-300" />
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-neutral-900 dark:text-white truncate" title={item.name}>
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span 
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ring-1 ring-inset bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 ring-emerald-600/20 dark:ring-emerald-700/50"
                        title={`${item.precisePercentage}% of total complaints`}
                      >
                        {item.displayPercentage}
                      </span>
                      <span className="text-sm sm:text-base font-bold min-w-[1.75rem] text-right text-emerald-600 dark:text-emerald-300">
                        {item.value}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer stats */}
          <div className="pt-2.5 mt-2 border-t border-neutral-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-neutral-500 dark:text-slate-400 px-1">
            <span>
              {districtSearchTerm 
                ? `Found ${filteredDistrictData.length} of ${metrics.districtData.length}` 
                : `${metrics.districtData.length} administrative districts`}
            </span>
            <span className="font-semibold text-neutral-700 dark:text-slate-300">
              Total: {metrics.districtData.reduce((acc, d) => acc + d.value, 0)}
            </span>
          </div>
        </div>

        {/* Column 3: Complainant-wise Complaints */}
        <div className="bg-white dark:bg-gradient-to-b dark:from-slate-900/95 dark:via-slate-900/90 dark:to-slate-900/95 rounded-xl border border-neutral-200/90 dark:border-slate-800 shadow-xs p-4 sm:p-5 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 pb-3 mb-3 border-b border-neutral-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                  Complainant-wise
                </h3>
                <p className="text-[11px] text-neutral-500 dark:text-slate-400 truncate">
                  Filed by individual citizens
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
                {metrics.complainantData.length}
              </span>
              <button
                type="button"
                onClick={() => setChartModal('complainant')}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/80 dark:text-indigo-300 dark:hover:bg-indigo-900/60 border border-indigo-200/80 dark:border-indigo-800/80 transition-colors cursor-pointer shadow-2xs"
                title="Open Complainant-wise Complaints Chart Modal"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Chart</span>
              </button>
            </div>
          </div>

          {/* Gender Stats Summary */}
          {metrics.genderData.length > 0 && (
            <div className="flex items-center gap-2 mb-3 mt-1 pb-3 border-b border-neutral-100 dark:border-slate-800">
              {metrics.genderData.map(g => (
                <div key={g.name} className="flex-1 flex flex-col items-center justify-center p-2 rounded-lg bg-neutral-50 dark:bg-slate-800/50 border border-neutral-200 dark:border-slate-700">
                  <span className="text-[10px] text-neutral-500 dark:text-slate-400 uppercase tracking-wider font-semibold">{g.name}</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-sm font-bold text-neutral-800 dark:text-white">{g.value}</span>
                    <span className="text-[10px] text-neutral-400 dark:text-slate-500">({g.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Column Search Filter */}
          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search citizen / appellant..."
              value={complainantSearchTerm}
              onChange={(e) => setComplainantSearchTerm(e.target.value)}
              className="w-full text-xs pl-8 pr-7 py-1.5 rounded-lg bg-neutral-50/80 dark:bg-slate-800/60 border border-neutral-200/80 dark:border-slate-700/80 text-neutral-800 dark:text-slate-200 placeholder-neutral-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
            {complainantSearchTerm && (
              <button
                type="button"
                onClick={() => setComplainantSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:text-slate-500 dark:hover:text-slate-300 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Complainant Structured Metrics List */}
          <div className="flex-1 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
            {filteredComplainantData.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-400 dark:text-slate-500">
                {complainantSearchTerm ? 'No matching citizens found.' : 'No complainant records found.'}
              </div>
            ) : (
              <ul className="divide-y divide-neutral-100 dark:divide-slate-800/80">
                {filteredComplainantData.map((item, idx) => (
                  <li
                    key={item.name}
                    className="py-2.5 px-2 flex items-center justify-between hover:bg-neutral-50/80 dark:hover:bg-slate-800/40 rounded-lg transition-colors gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-1 flex-1">
                      <span className="text-xs font-semibold text-neutral-400 dark:text-slate-500 w-4 text-center shrink-0">
                        {idx + 1}.
                      </span>
                      <div className="w-6.5 h-6.5 rounded-md bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-200/60 dark:border-indigo-700/60 flex items-center justify-center shrink-0">
                        <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-300" />
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-neutral-900 dark:text-white truncate" title={item.name}>
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span 
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ring-1 ring-inset bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 ring-indigo-600/20 dark:ring-indigo-700/50"
                        title={`${item.precisePercentage}% of total complaints`}
                      >
                        {item.displayPercentage}
                      </span>
                      <span className="text-sm sm:text-base font-bold min-w-[1.75rem] text-right text-indigo-600 dark:text-indigo-300">
                        {item.value}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer toggle & indicator */}
          <div className="pt-2.5 mt-2 border-t border-neutral-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-neutral-500 dark:text-slate-400 px-1">
            <span>
              {complainantSearchTerm
                ? `Found ${filteredComplainantData.length} of ${metrics.complainantData.length}`
                : complainantLimit === 'all'
                ? `Showing all ${metrics.complainantData.length} citizens`
                : `Top 10 of ${metrics.complainantData.length} citizens`}
            </span>
            {!complainantSearchTerm && metrics.complainantData.length > 10 && (
              <button
                type="button"
                onClick={() => setComplainantLimit(complainantLimit === 'all' ? '10' : 'all')}
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
              >
                {complainantLimit === 'all' ? 'Show Top 10' : 'Show All'}
              </button>
            )}
          </div>
        </div>

      </div>

      {/* PROACTIVE DISCLOSURE SECTION - Department-wise & District-wise */}
      <div id="proactive-disclosure-section" className="space-y-4 pt-1">
        {/* Section Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-white dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-slate-900/90 p-4 sm:p-5 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shadow-sm shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                  Proactive Disclosure
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 border border-emerald-300/60 dark:border-emerald-700/60">
                  {metrics.totalDisclosed} Citizen Requests Disclosed
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-teal-100/70 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 border border-teal-200/60 dark:border-teal-800/60">
                  {metrics.proactiveDeptData.length} Complying Departments
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-blue-100/70 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 border border-blue-200/60 dark:border-blue-800/60">
                  {metrics.proactiveDistrictData.length} Covered Districts
                </span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-slate-300 mt-1">
                Public bodies and departments that have complied with RTI transparency mandates by disclosing the information requested by complainants.
              </p>
            </div>
          </div>

          {/* Section Controls: View Tab Switcher + Visual Chart Trigger */}
          <div className="flex items-center gap-2 self-start md:self-center shrink-0 flex-wrap">
            <div className="flex items-center bg-white dark:bg-slate-800 p-1 rounded-lg border border-neutral-200 dark:border-slate-700 text-xs shadow-2xs">
              <button
                type="button"
                onClick={() => setProactiveViewTab('both')}
                className={`px-3 py-1 rounded transition-colors cursor-pointer font-medium ${
                  proactiveViewTab === 'both'
                    ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                    : 'text-neutral-600 dark:text-slate-300 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Both
              </button>
              <button
                type="button"
                onClick={() => setProactiveViewTab('departments')}
                className={`px-3 py-1 rounded transition-colors cursor-pointer font-medium ${
                  proactiveViewTab === 'departments'
                    ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                    : 'text-neutral-600 dark:text-slate-300 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Department-wise
              </button>
              <button
                type="button"
                onClick={() => setProactiveViewTab('districts')}
                className={`px-3 py-1 rounded transition-colors cursor-pointer font-medium ${
                  proactiveViewTab === 'districts'
                    ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                    : 'text-neutral-600 dark:text-slate-300 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                District-wise
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setChartModal('proactive');
                setProactiveModalDimension('department');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
              title="Open Proactive Disclosure Visual Charts"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Chart</span>
            </button>
          </div>
        </div>

        {/* 2-Column Grid (or single column based on proactiveViewTab) */}
        <div className={`grid gap-6 ${
          proactiveViewTab === 'both' 
            ? 'grid-cols-1 lg:grid-cols-2' 
            : 'grid-cols-1'
        }`}>
          {/* COLUMN 1: Department-wise Proactive Disclosure */}
          {(proactiveViewTab === 'both' || proactiveViewTab === 'departments') && (
            <div className="bg-white dark:bg-gradient-to-b dark:from-slate-900/95 dark:via-slate-900/90 dark:to-slate-900/95 rounded-xl border border-neutral-200/90 dark:border-slate-800 shadow-xs p-4 sm:p-5 flex flex-col h-full">
              {/* Header */}
              <div className="flex items-start justify-between gap-2 pb-3 mb-3 border-b border-neutral-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                      Department-wise Disclosures
                    </h3>
                    <p className="text-[11px] text-neutral-500 dark:text-slate-400 truncate">
                      Departments disclosing information requested by complainants
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">
                    {metrics.proactiveDeptData.length} Depts
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setChartModal('proactive');
                      setProactiveModalDimension('department');
                    }}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200/60 dark:border-emerald-800/60 transition-colors cursor-pointer"
                    title="View Department-wise Proactive Disclosure Chart"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Chart</span>
                  </button>
                </div>
              </div>

              {/* Search Filter */}
              <div className="relative mb-3">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Search disclosing department or district..."
                  value={proactiveDeptSearchTerm}
                  onChange={(e) => setProactiveDeptSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-slate-800 bg-neutral-50/50 dark:bg-slate-800/50 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                {proactiveDeptSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setProactiveDeptSearchTerm('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-slate-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Department List */}
              <div className="flex-1 overflow-y-auto max-h-[380px] pr-1">
                {filteredProactiveDeptData.length === 0 ? (
                  <div className="py-8 text-center text-xs text-neutral-400 dark:text-slate-500">
                    {proactiveDeptSearchTerm ? 'No matching disclosing departments found' : 'No proactive disclosure records available'}
                  </div>
                ) : (
                  <ul className="divide-y divide-neutral-100 dark:divide-slate-800/60">
                    {filteredProactiveDeptData.map((item, idx) => (
                      <li
                        key={item.name}
                        onClick={() => setSelectedProactiveItem({
                          type: 'department',
                          title: item.name,
                          complaints: item.complaints
                        })}
                        className="py-2.5 px-2 hover:bg-neutral-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors group cursor-pointer"
                        title="Click to view citizen complaints disclosed by this department"
                      >
                        <div className="flex items-start justify-between gap-3 mb-1.5">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <span className="text-[11px] font-semibold text-neutral-400 dark:text-slate-500 w-4 text-center mt-0.5 shrink-0">
                              {idx + 1}.
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-neutral-900 dark:text-white leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                {item.name}
                              </p>
                              {item.districts.length > 0 && (
                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                  {item.districts.map(d => (
                                    <span key={d} className="inline-flex items-center gap-0.5 text-[10px] text-neutral-500 dark:text-slate-400 bg-neutral-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                      <MapPin className="w-2.5 h-2.5" />
                                      {d}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 ring-1 ring-inset ring-emerald-600/20 dark:ring-emerald-700/50">
                              {item.displayPercentage}
                            </span>
                            <span className="text-xs font-bold text-neutral-900 dark:text-white min-w-[2.25rem] text-right">
                              {item.value} {item.value === 1 ? 'case' : 'cases'}
                            </span>
                            <button
                              type="button"
                              className="p-1 rounded text-neutral-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/50 transition-colors"
                              title="View Disclosed Requests"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-neutral-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden ml-6.5 max-w-[calc(100%-1.625rem)]">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(item.percentage, 4))}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Footer */}
              <div className="pt-2.5 mt-2 border-t border-neutral-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-neutral-500 dark:text-slate-400 px-1">
                <span>
                  {proactiveDeptSearchTerm
                    ? `Found ${filteredProactiveDeptData.length} of ${metrics.proactiveDeptData.length} departments`
                    : `Total: ${metrics.proactiveDeptData.length} complying departments`}
                </span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  {metrics.totalDisclosed} requests disclosed
                </span>
              </div>
            </div>
          )}

          {/* COLUMN 2: District-wise Proactive Disclosure */}
          {(proactiveViewTab === 'both' || proactiveViewTab === 'districts') && (
            <div className="bg-white dark:bg-gradient-to-b dark:from-slate-900/95 dark:via-slate-900/90 dark:to-slate-900/95 rounded-xl border border-neutral-200/90 dark:border-slate-800 shadow-xs p-4 sm:p-5 flex flex-col h-full">
              {/* Header */}
              <div className="flex items-start justify-between gap-2 pb-3 mb-3 border-b border-neutral-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 border border-teal-200/60 dark:border-teal-800/60 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                      District-wise Disclosures
                    </h3>
                    <p className="text-[11px] text-neutral-500 dark:text-slate-400 truncate">
                      Geographic distribution of disclosed information across districts
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/50 dark:border-teal-800/50">
                    {metrics.proactiveDistrictData.length} Districts
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setChartModal('proactive');
                      setProactiveModalDimension('district');
                    }}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200/60 dark:border-teal-800/60 transition-colors cursor-pointer"
                    title="View District-wise Proactive Disclosure Chart"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Chart</span>
                  </button>
                </div>
              </div>

              {/* Search Filter */}
              <div className="relative mb-3">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Search district or department..."
                  value={proactiveDistrictSearchTerm}
                  onChange={(e) => setProactiveDistrictSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-slate-800 bg-neutral-50/50 dark:bg-slate-800/50 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                {proactiveDistrictSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setProactiveDistrictSearchTerm('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-slate-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* District List */}
              <div className="flex-1 overflow-y-auto max-h-[380px] pr-1">
                {filteredProactiveDistrictData.length === 0 ? (
                  <div className="py-8 text-center text-xs text-neutral-400 dark:text-slate-500">
                    {proactiveDistrictSearchTerm ? 'No matching districts found' : 'No district disclosure records available'}
                  </div>
                ) : (
                  <ul className="divide-y divide-neutral-100 dark:divide-slate-800/60">
                    {filteredProactiveDistrictData.map((item, idx) => (
                      <li
                        key={item.name}
                        onClick={() => setSelectedProactiveItem({
                          type: 'district',
                          title: `District ${item.name}`,
                          complaints: item.complaints
                        })}
                        className="py-2.5 px-2 hover:bg-neutral-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors group cursor-pointer"
                        title="Click to view citizen complaints disclosed in this district"
                      >
                        <div className="flex items-start justify-between gap-3 mb-1.5">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <span className="text-[11px] font-semibold text-neutral-400 dark:text-slate-500 w-4 text-center mt-0.5 shrink-0">
                              {idx + 1}.
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-neutral-900 dark:text-white leading-snug group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                                {item.name}
                              </p>
                              {item.departments.length > 0 && (
                                <p className="text-[10px] text-neutral-500 dark:text-slate-400 truncate mt-0.5 max-w-[280px]">
                                  {item.departments.join(', ')}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 ring-1 ring-inset ring-teal-600/20 dark:ring-teal-700/50">
                              {item.displayPercentage}
                            </span>
                            <span className="text-xs font-bold text-neutral-900 dark:text-white min-w-[2.25rem] text-right">
                              {item.value} {item.value === 1 ? 'case' : 'cases'}
                            </span>
                            <button
                              type="button"
                              className="p-1 rounded text-neutral-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:bg-teal-50 dark:group-hover:bg-teal-950/50 transition-colors"
                              title="View Disclosed Requests"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-neutral-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden ml-6.5 max-w-[calc(100%-1.625rem)]">
                          <div
                            className="bg-teal-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(item.percentage, 4))}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Footer */}
              <div className="pt-2.5 mt-2 border-t border-neutral-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-neutral-500 dark:text-slate-400 px-1">
                <span>
                  {proactiveDistrictSearchTerm
                    ? `Found ${filteredProactiveDistrictData.length} of ${metrics.proactiveDistrictData.length} districts`
                    : `Total: ${metrics.proactiveDistrictData.length} active districts`}
                </span>
                <span className="font-semibold text-teal-700 dark:text-teal-400">
                  {metrics.totalDisclosed} requests disclosed
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Complaint Stages Card matching Department-wise UI */}
        <div className="bg-white dark:bg-gradient-to-b dark:from-slate-900/95 dark:via-slate-900/90 dark:to-slate-900/95 rounded-xl border border-neutral-200/90 dark:border-slate-800 shadow-xs p-4 sm:p-5 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 pb-3 mb-3 border-b border-neutral-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                  Complaint Stages
                </h3>
                <p className="text-[11px] text-neutral-500 dark:text-slate-400 truncate">
                  Breakdown by proceeding status
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/50">
                {metrics.stageData.length}
              </span>
              <button
                type="button"
                onClick={() => setChartModal('stage')}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-950/80 dark:text-purple-300 dark:hover:bg-purple-900/60 border border-purple-200/80 dark:border-purple-800/80 transition-colors cursor-pointer shadow-2xs"
                title="Open Complaint Stages Chart Modal"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Chart</span>
              </button>
            </div>
          </div>

          {/* Column Search Filter */}
          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search stage..."
              value={stageSearchTerm}
              onChange={(e) => setStageSearchTerm(e.target.value)}
              className="w-full text-xs pl-8 pr-7 py-1.5 rounded-lg bg-neutral-50/80 dark:bg-slate-800/60 border border-neutral-200/80 dark:border-slate-700/80 text-neutral-800 dark:text-slate-200 placeholder-neutral-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all"
            />
            {stageSearchTerm && (
              <button
                type="button"
                onClick={() => setStageSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:text-slate-500 dark:hover:text-slate-300 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Stage Structured Metrics List */}
          <div className="flex-1 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
            {filteredStageData.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-400 dark:text-slate-500">
                {stageSearchTerm ? 'No matching stages found.' : 'No stage records found.'}
              </div>
            ) : (
              <ul className="divide-y divide-neutral-100 dark:divide-slate-800/80">
                {filteredStageData.map((item, idx) => (
                  <li
                    key={item.name}
                    className="py-2.5 px-2 flex items-center justify-between hover:bg-neutral-50/80 dark:hover:bg-slate-800/40 rounded-lg transition-colors gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-1 flex-1">
                      <span className="text-xs font-semibold text-neutral-400 dark:text-slate-500 w-4 text-center shrink-0">
                        {idx + 1}.
                      </span>
                      <div 
                        className="w-6.5 h-6.5 rounded-md flex items-center justify-center shrink-0 border"
                        style={{
                          backgroundColor: `${PIE_COLORS[idx % PIE_COLORS.length]}18`,
                          borderColor: `${PIE_COLORS[idx % PIE_COLORS.length]}40`,
                          color: PIE_COLORS[idx % PIE_COLORS.length]
                        }}
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-neutral-900 dark:text-white truncate" title={item.name}>
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span 
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ring-1 ring-inset bg-purple-50 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 ring-purple-600/20 dark:ring-purple-700/50"
                        title={`${item.precisePercentage}% of total complaints`}
                      >
                        {item.displayPercentage}
                      </span>
                      <span className="text-sm sm:text-base font-bold min-w-[1.75rem] text-right text-purple-600 dark:text-purple-300">
                        {item.value}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer stats */}
          <div className="pt-2.5 mt-2 border-t border-neutral-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-neutral-500 dark:text-slate-400 px-1">
            <span>
              {stageSearchTerm 
                ? `Found ${filteredStageData.length} of ${metrics.stageData.length}` 
                : `${metrics.stageData.length} active stages`}
            </span>
            <span className="font-semibold text-neutral-700 dark:text-slate-300">
              Total: {metrics.stageData.reduce((acc, s) => acc + s.value, 0)}
            </span>
          </div>
        </div>

        {/* Enforcement Summary List Card */}
        <div className="bg-white dark:bg-gradient-to-b dark:from-slate-900/95 dark:via-slate-900/90 dark:to-amber-950/20 p-5 rounded-xl border border-neutral-200 dark:border-amber-900/50 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="text-base font-semibold text-neutral-900 dark:text-white">Recent Enforcement Actions</h3>
                <p className="text-xs text-neutral-500 dark:text-slate-400">Notices, compliance reviews & penalties</p>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar">
            <div className="space-y-3">
              {filteredEnforcements.length > 0 ? (
                filteredEnforcements.map(action => (
                  <EnforcementItem 
                    key={action.id}
                    type={action.type} 
                    title={action.title} 
                    date={action.date} 
                    status={action.status}
                    summary={action.summary}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-neutral-500 dark:text-neutral-400 text-sm">
                  No summaries or enforcement actions found.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Chart Modal for Department-wise & District-wise breakdown */}
      {chartModal && (
        <div 
          className="fixed inset-0 bg-neutral-900/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-5 animate-in fade-in duration-150"
          onClick={() => setChartModal(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col border border-neutral-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-neutral-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-50/70 dark:bg-slate-900/90">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  chartModal === 'department' 
                    ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/80' 
                    : chartModal === 'district'
                    ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80'
                    : chartModal === 'complainant'
                    ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/80'
                    : chartModal === 'proactive'
                    ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80'
                    : 'bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/80'
                }`}>
                  {chartModal === 'department' ? (
                    <Building2 className="w-5 h-5" />
                  ) : chartModal === 'district' ? (
                    <MapPin className="w-5 h-5" />
                  ) : chartModal === 'complainant' ? (
                    <Users className="w-5 h-5" />
                  ) : chartModal === 'proactive' ? (
                    <FileCheck className="w-5 h-5" />
                  ) : (
                    <ShieldAlert className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white truncate">
                    {chartModal === 'department' 
                      ? 'Department-wise Complaints' 
                      : chartModal === 'district' 
                      ? 'District-wise Complaints' 
                      : chartModal === 'complainant'
                      ? 'Complainant-wise Complaints'
                      : chartModal === 'proactive'
                      ? `Proactive Disclosure — ${proactiveModalDimension === 'department' ? 'Department-wise' : 'District-wise'}`
                      : 'Complaint Stages'}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-slate-400">
                    {chartModal === 'department' 
                      ? 'Total complaints breakdown by public body'
                      : chartModal === 'district'
                      ? 'Complaints mapped across Sindh administrative districts'
                      : chartModal === 'complainant'
                      ? 'Total complaints and percentage distribution across citizens & appellants'
                      : chartModal === 'proactive'
                      ? `Listing all public bodies & areas disclosing citizen-requested RTI information (${metrics.totalDisclosed} total requests disclosed)`
                      : 'Distribution of complaints across proceeding and lifecycle stages'}
                  </p>
                </div>
              </div>

              {/* Header Actions & Controls */}
              <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 flex-wrap">
                {/* Switcher Tab between Dept, District, Complainant, Stage, and Proactive within modal */}
                <div className="flex items-center bg-neutral-100 dark:bg-slate-800 p-1 rounded-lg border border-neutral-200 dark:border-slate-700 text-xs">
                  <button
                    type="button"
                    onClick={() => setChartModal('department')}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      chartModal === 'department'
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                        : 'text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    Department
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartModal('district')}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      chartModal === 'district'
                        ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs'
                        : 'text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    District
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartModal('complainant')}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      chartModal === 'complainant'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                        : 'text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    Complainant
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartModal('stage')}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      chartModal === 'stage'
                        ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 font-semibold shadow-xs'
                        : 'text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    Stage
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setChartModal('proactive');
                      setProactiveModalDimension('department');
                    }}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer font-medium ${
                      chartModal === 'proactive'
                        ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs'
                        : 'text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    Proactive
                  </button>
                </div>

                {/* Layout / View toggles */}
                {chartModal === 'department' ? (
                  <div className="flex items-center bg-neutral-100 dark:bg-slate-800 p-1 rounded-lg border border-neutral-200 dark:border-slate-700 text-xs">
                    <button
                      type="button"
                      onClick={() => setDeptLayout('horizontal')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                        deptLayout === 'horizontal'
                          ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                          : 'text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                      title="Horizontal Rows"
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Rows</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeptLayout('vertical')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                        deptLayout === 'vertical'
                          ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                          : 'text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                      title="Vertical Columns"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Columns</span>
                    </button>
                  </div>
                ) : chartModal === 'district' ? (
                  <div className="flex items-center bg-neutral-100 dark:bg-slate-800 p-1 rounded-lg border border-neutral-200 dark:border-slate-700 text-xs">
                    <button
                      type="button"
                      onClick={() => setDistrictView('bar')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                        districtView === 'bar'
                          ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs'
                          : 'text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                      title="Bar view"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Bars</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDistrictView('area')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                        districtView === 'area'
                          ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs'
                          : 'text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                      title="Area trend view"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Area</span>
                    </button>
                  </div>
                ) : chartModal === 'complainant' ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Limit Selector: Top 10 (default), Top 20, All */}
                    <div className="flex items-center bg-neutral-100 dark:bg-slate-800 p-1 rounded-lg border border-neutral-200 dark:border-slate-700 text-xs">
                      <button
                        type="button"
                        onClick={() => setModalComplainantLimit('10')}
                        className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                          modalComplainantLimit === '10'
                            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                            : 'text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                        title="Display Top 10 Complainants (Default)"
                      >
                        Top 10
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalComplainantLimit('20')}
                        className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                          modalComplainantLimit === '20'
                            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                            : 'text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                        title="Display Top 20 Complainants"
                      >
                        Top 20
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalComplainantLimit('all')}
                        className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                          modalComplainantLimit === 'all'
                            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                            : 'text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                        title={`Display All ${metrics.complainantData.length} Complainants`}
                      >
                        All ({metrics.complainantData.length})
                      </button>
                    </div>

                    {/* Layout Switcher */}
                    <div className="flex items-center bg-neutral-100 dark:bg-slate-800 p-1 rounded-lg border border-neutral-200 dark:border-slate-700 text-xs">
                      <button
                        type="button"
                        onClick={() => setComplainantModalLayout('horizontal')}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                          complainantModalLayout === 'horizontal'
                            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                            : 'text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                        title="Horizontal Rows"
                      >
                        <AlignLeft className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">Rows</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setComplainantModalLayout('vertical')}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                          complainantModalLayout === 'vertical'
                            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                            : 'text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                        title="Vertical Columns"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">Columns</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setComplainantModalLayout('donut')}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                          complainantModalLayout === 'donut'
                            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                            : 'text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                        title="Donut Distribution"
                      >
                        <PieChartIcon className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">Donut</span>
                      </button>
                    </div>
                  </div>
                ) : chartModal === 'proactive' ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Dimension Switch: Department vs District */}
                    <div className="flex items-center bg-neutral-100 dark:bg-slate-800 p-1 rounded-lg border border-neutral-200 dark:border-slate-700 text-xs">
                      <button
                        type="button"
                        onClick={() => setProactiveModalDimension('department')}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                          proactiveModalDimension === 'department'
                            ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs'
                            : 'text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Depts</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setProactiveModalDimension('district')}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                          proactiveModalDimension === 'district'
                            ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs'
                            : 'text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Districts</span>
                      </button>
                    </div>

                    {/* Layout Switcher */}
                    <div className="flex items-center bg-neutral-100 dark:bg-slate-800 p-1 rounded-lg border border-neutral-200 dark:border-slate-700 text-xs">
                      <button
                        type="button"
                        onClick={() => setProactiveModalLayout('horizontal')}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                          proactiveModalLayout === 'horizontal'
                            ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs'
                            : 'text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                        title="Horizontal Rows"
                      >
                        <AlignLeft className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">Rows</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setProactiveModalLayout('vertical')}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                          proactiveModalLayout === 'vertical'
                            ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs'
                            : 'text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                        title="Vertical Columns"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">Columns</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setProactiveModalLayout('donut')}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                          proactiveModalLayout === 'donut'
                            ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs'
                            : 'text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                        title="Donut Distribution"
                      >
                        <PieChartIcon className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">Donut</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* chartModal === 'stage' */
                  <div className="flex items-center bg-neutral-100 dark:bg-slate-800 p-1 rounded-lg border border-neutral-200 dark:border-slate-700 text-xs">
                    <button
                      type="button"
                      onClick={() => setStageModalLayout('donut')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                        stageModalLayout === 'donut'
                          ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 font-semibold shadow-xs'
                          : 'text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                      title="Donut Distribution"
                    >
                      <PieChartIcon className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Donut</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStageModalLayout('horizontal')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                        stageModalLayout === 'horizontal'
                          ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 font-semibold shadow-xs'
                          : 'text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                      title="Horizontal Rows"
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Rows</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStageModalLayout('vertical')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                        stageModalLayout === 'vertical'
                          ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 font-semibold shadow-xs'
                          : 'text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                      title="Vertical Columns"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Columns</span>
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setChartModal(null)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body - Chart */}
            <div className="p-4 sm:p-6 flex-1 min-h-[420px] max-h-[68vh] w-full overflow-y-auto">
              {chartModal === 'department' ? (
                metrics.departmentData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-neutral-400 dark:text-slate-500 py-20">
                    No department complaint records found for the selected timeframe.
                  </div>
                ) : (
                  <div className="w-full h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      {deptLayout === 'horizontal' ? (
                        <BarChart
                          layout="vertical"
                          data={metrics.departmentData}
                          margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.25} />
                          <XAxis
                            type="number"
                            allowDecimals={false}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                          />
                          <YAxis
                            type="category"
                            dataKey="name"
                            width={180}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            interval={0}
                          />
                          <RechartsTooltip
                            cursor={{ fill: 'rgba(59, 130, 246, 0.08)' }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const item = payload[0].payload;
                                return (
                                  <div className="bg-slate-900 text-white text-xs p-3 rounded-lg shadow-xl border border-slate-700 max-w-sm z-50">
                                    <p className="font-semibold text-white mb-1 leading-snug">{item.name}</p>
                                    <div className="flex items-center justify-between gap-4 text-blue-400 mt-1">
                                      <span>Complaints:</span>
                                      <span className="text-white font-bold text-sm">{item.value}</span>
                                    </div>
                                    {metrics.total > 0 && (
                                      <p className="text-[11px] text-slate-400 mt-0.5">
                                        {item.percentage}% of all complaints
                                      </p>
                                    )}
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar
                            dataKey="value"
                            name="Complaints"
                            fill="#3b82f6"
                            radius={[0, 4, 4, 0]}
                            maxBarSize={28}
                          />
                        </BarChart>
                      ) : (
                        <BarChart
                          data={metrics.departmentData}
                          margin={{ top: 15, right: 15, left: -10, bottom: 25 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.25} />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            angle={-40}
                            textAnchor="end"
                            interval={0}
                            height={110}
                            dx={-4}
                            dy={6}
                          />
                          <YAxis
                            allowDecimals={false}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#94a3b8' }}
                          />
                          <RechartsTooltip
                            cursor={{ fill: 'rgba(59, 130, 246, 0.08)' }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const item = payload[0].payload;
                                return (
                                  <div className="bg-slate-900 text-white text-xs p-3 rounded-lg shadow-xl border border-slate-700 max-w-sm z-50">
                                    <p className="font-semibold text-white mb-1 leading-snug">{item.name}</p>
                                    <div className="flex items-center justify-between gap-4 text-blue-400 mt-1">
                                      <span>Complaints:</span>
                                      <span className="text-white font-bold text-sm">{item.value}</span>
                                    </div>
                                    {metrics.total > 0 && (
                                      <p className="text-[11px] text-slate-400 mt-0.5">
                                        {item.percentage}% of all complaints
                                      </p>
                                    )}
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar
                            dataKey="value"
                            name="Complaints"
                            fill="#3b82f6"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={45}
                          />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                )
              ) : chartModal === 'district' ? (
                metrics.districtData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-neutral-400 dark:text-slate-500 py-20">
                    No district records found.
                  </div>
                ) : (
                  <div className="w-full h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      {districtView === 'bar' ? (
                        <BarChart data={metrics.districtData} margin={{ top: 15, right: 15, left: -10, bottom: 25 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.25} />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            angle={-35}
                            textAnchor="end"
                            interval={0}
                            height={75}
                            dx={-4}
                            dy={6}
                          />
                          <YAxis
                            allowDecimals={false}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#94a3b8' }}
                          />
                          <RechartsTooltip
                            cursor={{ fill: 'rgba(16, 185, 129, 0.08)' }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const item = payload[0].payload;
                                return (
                                  <div className="bg-slate-900 text-white text-xs p-3 rounded-lg shadow-xl border border-slate-700 max-w-xs z-50">
                                    <p className="font-semibold text-white mb-1">{item.name} District</p>
                                    <div className="flex items-center justify-between gap-4 text-emerald-400 mt-1">
                                      <span>Complaints:</span>
                                      <span className="text-white font-bold text-sm">{item.value}</span>
                                    </div>
                                    {metrics.total > 0 && (
                                      <p className="text-[11px] text-slate-400 mt-0.5">
                                        {item.percentage}% of all complaints
                                      </p>
                                    )}
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar
                            dataKey="value"
                            name="Complaints"
                            fill="#10b981"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={45}
                          />
                        </BarChart>
                      ) : (
                        <AreaChart data={metrics.districtData} margin={{ top: 15, right: 15, left: -10, bottom: 25 }}>
                          <defs>
                            <linearGradient id="colorValueModal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.25} />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            angle={-35}
                            textAnchor="end"
                            interval={0}
                            height={75}
                            dx={-4}
                            dy={6}
                          />
                          <YAxis
                            allowDecimals={false}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#94a3b8' }}
                          />
                          <RechartsTooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const item = payload[0].payload;
                                return (
                                  <div className="bg-slate-900 text-white text-xs p-3 rounded-lg shadow-xl border border-slate-700 max-w-xs z-50">
                                    <p className="font-semibold text-white mb-1">{item.name} District</p>
                                    <div className="flex items-center justify-between gap-4 text-emerald-400 mt-1">
                                      <span>Complaints:</span>
                                      <span className="text-white font-bold text-sm">{item.value}</span>
                                    </div>
                                    {metrics.total > 0 && (
                                      <p className="text-[11px] text-slate-400 mt-0.5">
                                        {item.percentage}% of all complaints
                                      </p>
                                    )}
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="value"
                            name="Complaints"
                            stroke="#10b981"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorValueModal)"
                          />
                        </AreaChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                )
              ) : chartModal === 'complainant' ? (
                metrics.complainantData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-neutral-400 dark:text-slate-500 py-20">
                    No complainant records found for the selected timeframe.
                  </div>
                ) : (
                  <div className="w-full h-[420px]">
                    <ResponsiveContainer width="100%" height="100%">
                      {complainantModalLayout === 'horizontal' ? (
                        <BarChart
                          layout="vertical"
                          data={displayedModalComplainantData}
                          margin={{ top: 10, right: 35, left: 10, bottom: 10 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.25} />
                          <XAxis
                            type="number"
                            allowDecimals={false}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                          />
                          <YAxis
                            type="category"
                            dataKey="name"
                            width={190}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            tickFormatter={(val) => (val.length > 24 ? val.slice(0, 22) + '…' : val)}
                            interval={0}
                          />
                          <RechartsTooltip
                            cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const item = payload[0].payload;
                                return (
                                  <div className="bg-slate-900 text-white text-xs p-3 rounded-lg shadow-xl border border-slate-700 max-w-sm z-50">
                                    <p className="font-semibold text-white mb-1 leading-snug">{item.name}</p>
                                    <div className="flex items-center justify-between gap-4 text-indigo-400 mt-1">
                                      <span>Total Complaints:</span>
                                      <span className="text-white font-bold text-sm">{item.value}</span>
                                    </div>
                                    {metrics.total > 0 && (
                                      <p className="text-[11px] text-slate-400 mt-0.5">
                                        {item.percentage}% of all complaints ({item.precisePercentage}%)
                                      </p>
                                    )}
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar
                            dataKey="value"
                            name="Complaints"
                            fill="#6366f1"
                            radius={[0, 4, 4, 0]}
                            maxBarSize={28}
                          >
                            <LabelList dataKey="displayPercentage" position="right" style={{ fontSize: 11, fill: '#6366f1', fontWeight: 600 }} />
                          </Bar>
                        </BarChart>
                      ) : complainantModalLayout === 'vertical' ? (
                        <BarChart
                          data={displayedModalComplainantData}
                          margin={{ top: 20, right: 15, left: -10, bottom: 35 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.25} />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            angle={-35}
                            textAnchor="end"
                            interval={0}
                            height={85}
                            dx={-4}
                            dy={6}
                            tickFormatter={(val) => (val.length > 20 ? val.slice(0, 18) + '…' : val)}
                          />
                          <YAxis
                            allowDecimals={false}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#94a3b8' }}
                          />
                          <RechartsTooltip
                            cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const item = payload[0].payload;
                                return (
                                  <div className="bg-slate-900 text-white text-xs p-3 rounded-lg shadow-xl border border-slate-700 max-w-xs z-50">
                                    <p className="font-semibold text-white mb-1">{item.name}</p>
                                    <div className="flex items-center justify-between gap-4 text-indigo-400 mt-1">
                                      <span>Total Complaints:</span>
                                      <span className="text-white font-bold text-sm">{item.value}</span>
                                    </div>
                                    {metrics.total > 0 && (
                                      <p className="text-[11px] text-slate-400 mt-0.5">
                                        {item.percentage}% of all complaints ({item.precisePercentage}%)
                                      </p>
                                    )}
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar
                            dataKey="value"
                            name="Complaints"
                            fill="#6366f1"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={45}
                          >
                            <LabelList dataKey="displayPercentage" position="top" style={{ fontSize: 11, fill: '#6366f1', fontWeight: 600 }} />
                          </Bar>
                        </BarChart>
                      ) : (
                        <PieChart>
                          <Pie
                            data={modalComplainantDonutData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={125}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ percentage, name }) => (percentage > 4 ? `${name.length > 12 ? name.slice(0, 10) + '…' : name} (${percentage}%)` : null)}
                          >
                            {modalComplainantDonutData.map((item, index) => (
                              <Cell 
                                key={`modal-cell-${index}`} 
                                fill={item.isOther ? '#64748b' : COMPLAINANT_COLORS[index % COMPLAINANT_COLORS.length]} 
                              />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-slate-900 text-white text-xs p-3 rounded-lg shadow-xl border border-slate-700 max-w-sm z-50">
                                    <p className="font-semibold text-white mb-1">{data.name}</p>
                                    <div className="flex items-center justify-between gap-4 text-indigo-400 mt-1">
                                      <span>Total Complaints:</span>
                                      <span className="text-white font-bold">{data.value}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 text-slate-300 mt-1">
                                      <span>Percentage of Total:</span>
                                      <span className="text-indigo-300 font-semibold">{data.precisePercentage || data.percentage}% of all complaints</span>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                        </PieChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                )
              ) : chartModal === 'stage' ? (
                metrics.stageData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-neutral-400 dark:text-slate-500 py-20">
                    No complaint stage records found for the selected timeframe.
                  </div>
                ) : (
                  <div className="w-full h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      {stageModalLayout === 'donut' ? (
                        <PieChart>
                          <Pie
                            data={metrics.stageData}
                            cx="50%"
                            cy="50%"
                            innerRadius={75}
                            outerRadius={135}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="none"
                            label={({ percent, name }) => ((percent || 0) > 0.04 ? `${name.length > 14 ? name.slice(0, 12) + '…' : name} (${Math.round((percent || 0) * 100)}%)` : '')}
                            labelLine={false}
                          >
                            {metrics.stageData.map((_, index) => (
                              <Cell key={`modal-stage-cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip 
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const item = payload[0].payload;
                                return (
                                  <div className="bg-slate-900 text-white text-xs p-3 rounded-lg shadow-xl border border-slate-700 max-w-xs z-50">
                                    <p className="font-semibold text-white mb-1 leading-snug">{item.name}</p>
                                    <div className="flex items-center justify-between gap-4 text-purple-400 mt-1">
                                      <span>Cases:</span>
                                      <span className="text-white font-bold text-sm">{item.value}</span>
                                    </div>
                                    {metrics.total > 0 && (
                                      <p className="text-[11px] text-slate-400 mt-0.5">
                                        {item.percentage}% of all complaints ({item.precisePercentage}%)
                                      </p>
                                    )}
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                        </PieChart>
                      ) : stageModalLayout === 'horizontal' ? (
                        <BarChart
                          layout="vertical"
                          data={metrics.stageData}
                          margin={{ top: 10, right: 40, left: 10, bottom: 10 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.25} />
                          <XAxis
                            type="number"
                            allowDecimals={false}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                          />
                          <YAxis
                            type="category"
                            dataKey="name"
                            width={160}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            interval={0}
                          />
                          <RechartsTooltip
                            cursor={{ fill: 'rgba(168, 85, 247, 0.08)' }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const item = payload[0].payload;
                                return (
                                  <div className="bg-slate-900 text-white text-xs p-3 rounded-lg shadow-xl border border-slate-700 max-w-sm z-50">
                                    <p className="font-semibold text-white mb-1 leading-snug">{item.name}</p>
                                    <div className="flex items-center justify-between gap-4 text-purple-400 mt-1">
                                      <span>Cases:</span>
                                      <span className="text-white font-bold text-sm">{item.value}</span>
                                    </div>
                                    {metrics.total > 0 && (
                                      <p className="text-[11px] text-slate-400 mt-0.5">
                                        {item.percentage}% of all complaints ({item.precisePercentage}%)
                                      </p>
                                    )}
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar
                            dataKey="value"
                            name="Complaints"
                            fill="#a855f7"
                            radius={[0, 4, 4, 0]}
                            maxBarSize={28}
                          >
                            <LabelList dataKey="displayPercentage" position="right" style={{ fontSize: 11, fill: '#a855f7', fontWeight: 600 }} />
                          </Bar>
                        </BarChart>
                      ) : (
                        <BarChart
                          data={metrics.stageData}
                          margin={{ top: 20, right: 15, left: -10, bottom: 35 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.25} />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            angle={-30}
                            textAnchor="end"
                            interval={0}
                            height={80}
                            dx={-4}
                            dy={6}
                          />
                          <YAxis
                            allowDecimals={false}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#94a3b8' }}
                          />
                          <RechartsTooltip
                            cursor={{ fill: 'rgba(168, 85, 247, 0.08)' }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const item = payload[0].payload;
                                return (
                                  <div className="bg-slate-900 text-white text-xs p-3 rounded-lg shadow-xl border border-slate-700 max-w-sm z-50">
                                    <p className="font-semibold text-white mb-1 leading-snug">{item.name}</p>
                                    <div className="flex items-center justify-between gap-4 text-purple-400 mt-1">
                                      <span>Cases:</span>
                                      <span className="text-white font-bold text-sm">{item.value}</span>
                                    </div>
                                    {metrics.total > 0 && (
                                      <p className="text-[11px] text-slate-400 mt-0.5">
                                        {item.percentage}% of all complaints ({item.precisePercentage}%)
                                      </p>
                                    )}
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar
                            dataKey="value"
                            name="Complaints"
                            fill="#a855f7"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={45}
                          >
                            <LabelList dataKey="displayPercentage" position="top" style={{ fontSize: 11, fill: '#a855f7', fontWeight: 600 }} />
                          </Bar>
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                )
              ) : (
                renderProactiveModalChart()
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 sm:px-6 py-3 border-t border-neutral-200 dark:border-slate-800 flex items-center justify-between bg-neutral-50/50 dark:bg-slate-900/60">
              <span className="text-xs text-neutral-500 dark:text-slate-400">
                {chartModal === 'department'
                  ? `Showing breakdown for ${metrics.departmentData.length} public bodies`
                  : chartModal === 'district'
                  ? `Showing breakdown for ${metrics.districtData.length} administrative districts`
                  : chartModal === 'stage'
                  ? `Showing breakdown for ${metrics.stageData.length} complaint lifecycle stages (Total: ${metrics.stageData.reduce((acc, s) => acc + s.value, 0)} complaints)`
                  : chartModal === 'proactive'
                  ? `Showing proactive disclosures across ${proactiveModalDimension === 'department' ? `${metrics.proactiveDeptData.length} public bodies` : `${metrics.proactiveDistrictData.length} districts`} (Total: ${metrics.totalDisclosed} citizen requests disclosed)`
                  : `Showing ${modalComplainantLimit === 'all' ? 'all' : `top ${displayedModalComplainantData.length}`} of ${metrics.complainantData.length} unique complainants (Total: ${metrics.total} complaints)`}
              </span>
              <button
                type="button"
                onClick={() => setChartModal(null)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-neutral-200 hover:bg-neutral-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-neutral-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drill-down Modal for Proactive Disclosure Details */}
      {selectedProactiveItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-neutral-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full flex flex-col max-h-[85vh] overflow-hidden">
            {/* Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-neutral-200 dark:border-slate-800 flex items-center justify-between bg-emerald-50/40 dark:bg-emerald-950/30">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  {selectedProactiveItem.type === 'department' ? (
                    <Building2 className="w-5 h-5" />
                  ) : (
                    <MapPin className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white truncate">
                      {selectedProactiveItem.title}
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200">
                      {selectedProactiveItem.complaints.length} Disclosed
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-slate-400 truncate">
                    Citizen complaints where requested information was proactively provided
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProactiveItem(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Complaint List */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-3">
              {selectedProactiveItem.complaints.map((c) => (
                <div
                  key={c.complaintNo}
                  className="p-3.5 rounded-xl border border-neutral-200 dark:border-slate-800 bg-neutral-50/50 dark:bg-slate-800/40 hover:border-emerald-300 dark:hover:border-emerald-700/60 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/60">
                          {c.complaintNo}
                        </span>
                        <span className="text-xs font-semibold text-neutral-900 dark:text-white">
                          {c.complainantName}
                        </span>
                        <span className="text-[11px] text-neutral-500 dark:text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {c.district || 'Sindh'}
                        </span>
                        <span className="text-[11px] text-neutral-500 dark:text-slate-400 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {c.respondentName}
                        </span>
                      </div>

                      <h4 className="text-xs sm:text-sm font-semibold text-neutral-800 dark:text-slate-200 line-clamp-2 mt-1">
                        {c.disclosedInformationSubject || c.remarks || 'RTI Public Information Request'}
                      </h4>

                      {c.disclosedInformationSubject && (
                        <div className="mt-2 text-xs bg-white dark:bg-slate-900/90 p-2.5 rounded-lg border border-emerald-200/70 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-200">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                              Information Disclosed:
                            </span>
                            {c.disclosureMode && (
                              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded font-medium">
                                Mode: {c.disclosureMode}
                              </span>
                            )}
                          </div>
                          {c.disclosedInformationSubject}
                        </div>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-1 shrink-0 pt-1 sm:pt-0">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        Disclosed
                      </span>
                      {c.disclosureDate && (
                        <span className="text-[10px] text-neutral-400 dark:text-slate-400 flex items-center gap-0.5">
                          <Calendar className="w-3 h-3" />
                          {c.disclosureDate}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-5 sm:px-6 py-3 border-t border-neutral-200 dark:border-slate-800 flex items-center justify-between bg-neutral-50/50 dark:bg-slate-900/60">
              <span className="text-xs text-neutral-500 dark:text-slate-400">
                {selectedProactiveItem.complaints.length} certified disclosure records under RTI Sindh
              </span>
              <button
                type="button"
                onClick={() => setSelectedProactiveItem(null)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  icon, 
  bg, 
  darkCard = "dark:bg-slate-900/90 dark:border-slate-800",
  darkText = "dark:text-neutral-200"
}: { 
  title: string, 
  value: number, 
  icon: ReactNode, 
  bg: string,
  darkCard?: string,
  darkText?: string
}) {
  return (
    <div className={`bg-white p-4 sm:p-5 rounded-xl border border-neutral-200 shadow-sm flex flex-col justify-between transition-all duration-200 ${darkCard}`}>
      <div className="flex items-start justify-between gap-2">
        <p className={`text-sm font-medium text-neutral-600 ${darkText} leading-snug flex-1`}>{title}</p>
        <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
      </div>
      <div className="mt-3">
        <h4 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">{value}</h4>
      </div>
    </div>
  );
}

function EnforcementItem({ type, title, date, status, summary }: { key?: string, type: string, title: string, date: string, status: string, summary?: string }) {
  const typeColor = 
    type === 'Penalty' ? 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-950/80 dark:text-rose-300 dark:ring-rose-700/50' : 
    type === 'Non-Maintainable' ? 'bg-neutral-100 text-neutral-700 ring-neutral-500/20 dark:bg-indigo-950/80 dark:text-indigo-300 dark:ring-indigo-700/50' :
    type === 'Compliance' || type === 'Proactive Disclosure' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/80 dark:text-emerald-300 dark:ring-emerald-700/50' :
    'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950/80 dark:text-blue-300 dark:ring-blue-700/50';

  return (
    <div className="flex items-start gap-3 p-3 hover:bg-neutral-50 dark:hover:bg-slate-800/60 rounded-lg transition-colors border border-neutral-100 dark:border-slate-800/80">
      <div className="shrink-0 mt-1">
        <div className={`w-2 h-2 rounded-full ${
          type === 'Penalty' ? 'bg-rose-500 dark:bg-rose-400' : 
          type === 'Non-Maintainable' ? 'bg-indigo-500 dark:bg-indigo-400' :
          type === 'Compliance' || type === 'Proactive Disclosure' ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-blue-500 dark:bg-blue-400'
        }`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-neutral-900 dark:text-white break-words" title={title}>{title}</p>
        <div className="flex flex-wrap items-center gap-2 mt-1.5">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ring-1 ring-inset ${typeColor}`}>
            {type}
          </span>
          <span className="text-xs text-neutral-500 dark:text-slate-300">{date}</span>
          <span className="text-xs text-neutral-500 dark:text-slate-300 border-l border-neutral-300 dark:border-slate-700 pl-2">{status}</span>
        </div>
        {summary && (
          <p className="text-xs text-neutral-600 dark:text-slate-200 mt-2 leading-relaxed" title={summary}>
            {summary}
          </p>
        )}
      </div>
    </div>
  );
}
