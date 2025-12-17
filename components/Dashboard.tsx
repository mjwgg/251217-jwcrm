
import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import type { Customer, Appointment, Todo, AppView, Goal, QuickMemo, PerformancePrediction, PerformanceRecord, DailyReview, MeetingType, Habit, HabitLog, CustomerType } from '../types';
import { CakeIcon, GiftIcon, CalendarIcon, ClockIcon, MessageIcon, CheckIcon, XIcon, BriefcaseIcon, PhoneIcon, PencilIcon, TrashIcon, ClipboardIcon, PlusIcon, MicIcon, EyeIcon, EyeOffIcon, ListBulletIcon, SparklesIcon, ChartBarIcon, DocumentTextIcon, DragHandleIcon, LightBulbIcon, ChevronDownIcon, ChevronUpIcon, SearchIcon, BookmarkIcon } from './icons';
import Spinner from './ui/Spinner';
import TodoList from './TodoList';
import GoalsTracker from './GoalsTracker';
import BaseModal from './ui/BaseModal';
import { RecontactModal } from './RecontactModal';
import ConfirmationModal from './ui/ConfirmationModal';
import AddPerformancePredictionModal from './AddPerformancePredictionModal';
import PerformanceManagement from './PerformanceManagement';
import { getUserColors, getTextColorForBackground, DEFAULT_MEETING_TYPE_COLORS } from '../services/colorService';
import TodoListModal from './TodoListModal';
import AddInterestedProspectModal from './AddInterestedProspectModal';
import HabitTracker from './HabitTracker';
import Tag from './ui/Tag';
import { useLunarCalendar } from '../hooks/useData';

interface DashboardProps {
  customers: Customer[];
  appointments: Appointment[];
  todos: Todo[];
  goals: Goal[];
  isLoading: boolean;
  onNavigate: (view: AppView) => void;
  onSelectCustomer: (customer: Customer, initialTab?: 'details' | 'consultations' | 'contracts' | 'callHistory') => void;
  onRequestAppointmentAction: (appointment: Appointment, actionType: 'completed' | 'postponed' | 'cancelled') => void;
  onDeleteAppointment: (appointmentId: string) => void;
  onSelectAppointment: (appointment: Appointment) => void;
  onOpenAddAppointmentModal: (date: string, time: string) => void;
  onOpenAddReminderModal: () => void;
  onEditReminder: (customer: Customer) => void;
  onAddTodo: (text: string, priority: Todo['priority'], date?: string) => void;
  onToggleTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
  onUpdateTodo: (id: string, data: { text: string; priority: Todo['priority'] }) => void;
  onAddGoal: (goal: Omit<Goal, 'id'>) => Promise<void>;
  onUpdateGoal: (goal: Goal) => Promise<void>;
  onDeleteGoal: (goalId: string) => Promise<void>;
  quickMemos: QuickMemo[];
  onAddQuickMemo: (text: string, color: string) => Promise<void>;
  onUpdateQuickMemo: (memo: QuickMemo) => Promise<void>;
  onDeleteQuickMemo: (memoId: string) => Promise<void>;
  onDeleteMultipleQuickMemos: (memoIds: string[]) => Promise<void>;
  onUpdateCustomer: (customer: Customer) => Promise<void>;
  onClearMultipleFollowUpDates: (customerIds: string[]) => Promise<void>;
  onDeleteMultipleAppointments: (appointmentIds: string[]) => Promise<void>;
  predictions: PerformancePrediction[];
  onAddPrediction: (prediction: Omit<PerformancePrediction, 'id'>) => Promise<void>;
  onUpdatePrediction: (prediction: PerformancePrediction) => Promise<void>;
  onDeletePrediction: (predictionId: string) => Promise<void>;
  
  performanceRecords: PerformanceRecord[];
  onAddPerformanceRecord: (record: (Omit<PerformanceRecord, 'id'> & { customerType?: CustomerType; }) | (Omit<PerformanceRecord, 'id'> & { customerType?: CustomerType; })[]) => Promise<void>;
  onUpdatePerformanceRecord: (record: PerformanceRecord) => Promise<void>;
  onDeletePerformanceRecord: (recordId: string) => Promise<void>;
  onAddAppointment: (appointment: Omit<Appointment, 'id' | 'status'>, consultationData?: any, recurrence?: any) => Promise<void>;
  onUpdateAppointment: (appointment: Appointment, consultationData?: any, recurrence?: any) => Promise<void>;
  onEditAppointment: (appointment: Appointment) => void;
  onRequestAction: (toastData: any) => void;
  updateCustomerTags: (customerIds: string[], tagsToAdd: string[], tagsToRemove: string[]) => Promise<void>;
  onSetOnAppointmentAddSuccess: (callback: (() => void) | null) => void;
  habits: Habit[];
  habitLogs: HabitLog[];
  onAddHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => void;
  onUpdateHabit: (habit: Habit) => void;
  onDeleteHabit: (habitId: string) => void;
  onLogHabit: (habitId: string, date: string, completed: boolean) => void;
  onOpenRejectionModal: (customer: Customer) => void;
  onOpenConsultationRecordModal: (customerId: string, customerName: string, date: string, meetingType: MeetingType) => void;
  onLogCall: (customer: Customer) => void;
}

type WidgetId = 'todaysBriefing' | 'appointments' | 'todos' | 'quickMemo' | 'goals' | 'predictions' | 'calendarWeek' | 'activitySummary' | 'monthlyPerformance' | 'todaysHabits' | 'adBanner';

interface WidgetLayout {
  id: WidgetId;
  visible: boolean;
}

const WIDGET_CONFIG: { id: WidgetId, colSpan: 1 | 2 }[] = [
  { id: 'todaysHabits', colSpan: 2 },
  { id: 'appointments', colSpan: 1 },
  { id: 'todos', colSpan: 1 },
  { id: 'todaysBriefing', colSpan: 2 },
  { id: 'adBanner', colSpan: 2 },
  { id: 'quickMemo', colSpan: 2 },
  { id: 'goals', colSpan: 2 },
  { id: 'predictions', colSpan: 2 },
  { id: 'calendarWeek', colSpan: 2 },
  { id: 'activitySummary', colSpan: 2 },
  { id: 'monthlyPerformance', colSpan: 2 },
];

const WIDGET_METADATA: Record<WidgetId, { name: string; icon: React.ReactNode }> = {
    todaysBriefing: { name: '오늘의 브리핑', icon: <LightBulbIcon className="w-5 h-5 text-yellow-400" /> },
    appointments: { name: '오늘의 일정', icon: <CalendarIcon className="w-5 h-5 text-blue-400" /> },
    todos: { name: '오늘의 할 일', icon: <CheckIcon className="w-5 h-5 text-green-400" /> },
    quickMemo: { name: '간편 메모', icon: <PencilIcon className="w-5 h-5 text-purple-400" /> },
    goals: { name: '나의 목표', icon: <ListBulletIcon className="w-5 h-5 text-indigo-400" /> },
    predictions: { name: '실적 예측', icon: <SparklesIcon className="w-5 h-5 text-amber-400" /> },
    calendarWeek: { name: '캘린더', icon: <CalendarIcon className="w-5 h-5 text-blue-400" /> },
    activitySummary: { name: '활동 요약', icon: <ChartBarIcon className="w-5 h-5 text-rose-400" /> },
    monthlyPerformance: { name: '월간 실적', icon: <ChartBarIcon className="w-5 h-5 text-rose-400" /> },
    todaysHabits: { name: '오늘의 습관', icon: <CheckIcon className="w-5 h-5 text-green-400" /> },
    adBanner: { name: '광고 배너', icon: <SparklesIcon className="w-5 h-5 text-pink-400" /> },
};


const DEFAULT_LAYOUT: WidgetLayout[] = WIDGET_CONFIG.map(w => ({
  id: w.id,
  visible: !['monthlyPerformance', 'goals', 'predictions', 'calendarWeek'].includes(w.id),
}));

const formatTime = (timeStr: string): string => {
    if (!timeStr) return '';
    const [hourStr] = timeStr.split(':');
    const hour = parseInt(hourStr, 10);
    return `${hour}시`;
};

const formatTimeForCalendar = (timeStr: string): string => {
    if (!timeStr) return '';
    const [hourStr, minuteStr] = timeStr.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    if (minute === 30) {
        return `${hour}시 반`;
    }
    return `${hour}시`;
};

const stringToColor = (str: string) => {
  let hash = 0;
  if (str.length === 0) return { bg: 'bg-gray-400', text: 'text-white' };
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32bit integer
  }
  const colors = [
    { bg: 'bg-red-400', text: 'text-white' },
    { bg: 'bg-orange-400', text: 'text-white' },
    { bg: 'bg-amber-400', text: 'text-black' },
    { bg: 'bg-lime-400', text: 'text-black' },
    { bg: 'bg-green-400', text: 'text-white' },
    { bg: 'bg-emerald-400', text: 'text-white' },
    { bg: 'bg-teal-400', text: 'text-white' },
    { bg: 'bg-cyan-400', text: 'text-white' },
    { bg: 'bg-sky-400', text: 'text-white' },
    { bg: 'bg-blue-400', text: 'text-white' },
    { bg: 'bg-indigo-400', text: 'text-white' },
    { bg: 'bg-violet-400', text: 'text-white' },
    { bg: 'bg-purple-400', text: 'text-white' },
    { bg: 'bg-fuchsia-400', text: 'text-white' },
    { bg: 'bg-pink-400', text: 'text-white' },
  ];
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

type BriefingItem = {
  id: string;
  type: 'birthday' | 'anniversary' | 'expiry' | 'recontact' | 'followUp' | 'rejectionRecontact';
  date: Date;
  customer: Customer;
  title: string;
  subtitle: string;
  dDay: number;
  notes?: string;
};

const memoColors = {
    default: { bg: 'bg-[var(--background-tertiary)]', border: 'border-[var(--border-color)]' },
    red: { bg: 'bg-red-500/10', border: 'border-red-500/30' },
    yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
    green: { bg: 'bg-green-500/10', border: 'border-green-500/30' },
    blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
};
type MemoColor = keyof typeof memoColors;

// --- Helper Functions and Components for Dashboard ---

const generateOccurrences = (
  appointmentRules: Appointment[],
  viewStart: Date,
  viewEnd: Date,
  calendar: any,
  options: { excludeTA: boolean } = { excludeTA: true }
): (Appointment & { occurrenceDate: string; occurrenceId: string })[] => {
  const occurrences: (Appointment & { occurrenceDate: string; occurrenceId: string })[] = [];
  const toYYYYMMDD = (d: Date) => new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

  const filteredAppointmentRules = options.excludeTA ? appointmentRules.filter(app => app.meetingType !== 'TA') : appointmentRules;
  
  for (const app of filteredAppointmentRules) {
    if (!app.date || !app.date.includes('-')) continue;

    if (!app.recurrenceType || app.recurrenceType === 'none') {
      const appDate = new Date(app.date + 'T00:00:00'); 
      if (isNaN(appDate.getTime())) continue;
      if (appDate >= viewStart && appDate <= viewEnd) {
         const dateStr = toYYYYMMDD(appDate);
         if (!(app.exceptions || []).includes(dateStr)) {
            occurrences.push({ ...app, occurrenceDate: dateStr, occurrenceId: app.id });
         }
      }
    } else {
      const seriesStartDate = new Date(app.date + 'T00:00:00');
      if (isNaN(seriesStartDate.getTime())) continue;

      const seriesEndDate = app.recurrenceEndDate ? new Date(app.recurrenceEndDate + 'T23:59:59') : null;
      const exceptions = new Set(app.exceptions || []);
      const interval = app.recurrenceInterval || 1;
      
      let safety = 0;
      if (app.recurrenceType === 'yearly') {
          let currentYear = viewStart.getFullYear();
          if (seriesStartDate.getFullYear() > currentYear) {
              currentYear = seriesStartDate.getFullYear();
          }

          while (safety < 100) {
              safety++;
              
              let occurrenceDateForYear: Date | null = null;

              if (app.isLunar) {
                  if (calendar) {
                    const [, sMonth, sDay] = app.date.split('-').map(Number);
                    if (sMonth && sDay) {
                        const solarDate = calendar.lunarToSolar(currentYear, sMonth, sDay, false);
                        if (solarDate) {
                            occurrenceDateForYear = new Date(solarDate.year, solarDate.month - 1, solarDate.day);
                        }
                    }
                  }
              } else {
                  occurrenceDateForYear = new Date(currentYear, seriesStartDate.getMonth(), seriesStartDate.getDate());
              }

              if (occurrenceDateForYear) {
                  if (occurrenceDateForYear > viewEnd) break;
                  if (seriesEndDate && occurrenceDateForYear > seriesEndDate) break;
                  
                  if (occurrenceDateForYear >= seriesStartDate && occurrenceDateForYear >= viewStart) {
                      const occurrenceDateStr = toYYYYMMDD(occurrenceDateForYear);
                      if (!exceptions.has(occurrenceDateStr)) {
                          occurrences.push({
                              ...app,
                              occurrenceDate: occurrenceDateStr,
                              occurrenceId: `${app.id}_${occurrenceDateStr}`,
                          });
                      }
                  }
              }
              currentYear += interval;
          }
      } else {
          let currentDate = new Date(seriesStartDate.getTime());
          if (currentDate < viewStart) {
              currentDate = new Date(viewStart.getTime());
          }

          while (currentDate <= viewEnd && safety < 1095) {
            safety++;
            if (seriesEndDate && currentDate > seriesEndDate) break;
            if (currentDate < seriesStartDate) {
                currentDate.setDate(currentDate.getDate() + 1);
                continue;
            }

            let shouldAdd = false;
            if (app.recurrenceType === 'weekly') {
                if (app.recurrenceDays?.includes(currentDate.getDay())) {
                    const firstDayOfSeriesWeek = new Date(seriesStartDate);
                    firstDayOfSeriesWeek.setDate(seriesStartDate.getDate() - (seriesStartDate.getDay() === 0 ? 6 : seriesStartDate.getDay() - 1));
                    firstDayOfSeriesWeek.setHours(0, 0, 0, 0);

                    const firstDayOfCurrentWeek = new Date(currentDate);
                    firstDayOfCurrentWeek.setDate(currentDate.getDate() - (currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1));
                    firstDayOfCurrentWeek.setHours(0, 0, 0, 0);
                    
                    if (firstDayOfCurrentWeek.getTime() >= firstDayOfSeriesWeek.getTime()) {
                        const diffMillis = firstDayOfCurrentWeek.getTime() - firstDayOfSeriesWeek.getTime();
                        const diffWeeks = Math.floor(diffMillis / (1000 * 60 * 60 * 24 * 7));
                        if (diffWeeks % interval === 0) {
                            shouldAdd = true;
                        }
                    }
                }
            } else if (app.recurrenceType === 'daily') {
                const diffMillis = currentDate.getTime() - seriesStartDate.getTime();
                const diffDays = Math.round(diffMillis / (1000 * 60 * 60 * 24));
                if (diffDays >= 0 && diffDays % interval === 0) {
                    shouldAdd = true;
                }
            } else if (app.recurrenceType === 'monthly') {
                const yearDiff = currentDate.getFullYear() - seriesStartDate.getFullYear();
                const monthDiff = yearDiff * 12 + currentDate.getMonth() - seriesStartDate.getMonth();
                if (monthDiff >= 0 && monthDiff % interval === 0 && currentDate.getDate() === seriesStartDate.getDate()) {
                    shouldAdd = true;
                }
            }
            
            if (shouldAdd) {
                const currentDateStr = toYYYYMMDD(currentDate);
                if (!exceptions.has(currentDateStr)) {
                    occurrences.push({
                        ...app,
                        occurrenceDate: currentDateStr,
                        occurrenceId: `${app.id}_${currentDateStr}`,
                    });
                }
            }
            currentDate.setDate(currentDate.getDate() + 1);
          }
      }
    }
  }
  return occurrences;
};

const summaryActivityTypes: MeetingType[] = ['TA', 'AP', 'PC', 'N', '기타', '증권전달'];

interface ActivitySummaryWidgetProps {
    appointments: Appointment[];
    customers: Customer[];
    predictions: PerformancePrediction[];
    performanceRecords: PerformanceRecord[];
    currentDate: Date;
    onOpenDetails: (title: string, appointments: Appointment[]) => void;
}

const ActivitySummaryWidget: React.FC<ActivitySummaryWidgetProps> = ({ appointments, customers, predictions, performanceRecords, currentDate, onOpenDetails }) => {
    const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
    
    const typeColors: Record<string, string> = {
        'TA': 'bg-yellow-500/20', 'AP': 'bg-yellow-500/20',
        'PC': 'bg-blue-500/20', 'N': 'bg-blue-500/20', '기타': 'bg-blue-500/20',
        'JOINT': 'bg-gray-500/20', 'RP': 'bg-gray-500/20', 'Follow Up': 'bg-gray-500/20',
        'S.P': 'bg-orange-500/20',
        '증권전달': 'bg-purple-500/20',
        '카톡개별연락': 'bg-teal-500/20',
    };
    
    const summaryTypeLabels: { [key in MeetingType]?: string } = {
        'JOINT': '동반',
        'Follow Up': 'F.U',
        'S.P': '교육',
        '증권전달': '증권',
        '카톡개별연락': '카톡',
    };

    const { planned, results, periodText, filteredAppointments, filteredPredictions, filteredRecords } = useMemo(() => {
        let startDate: Date;
        let endDate: Date;
        let periodText: string;

        if (viewMode === 'month') {
            startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
            periodText = `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월`;
        } else { // week
            const dayOfWeek = currentDate.getDay(); // 0 = Sunday
            const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            startDate = new Date(currentDate);
            startDate.setDate(currentDate.getDate() - offset);
            startDate.setHours(0,0,0,0);

            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            endDate.setHours(23,59,59,999);
            periodText = `${startDate.getMonth() + 1}월 ${startDate.getDate()}일 - ${endDate.getMonth() + 1}월 ${endDate.getDate()}`;
        }

        const filterByDate = (dateStr?: string) => {
            if (!dateStr) return false;
            try {
                const itemDate = new Date(dateStr);
                return itemDate >= startDate && itemDate <= endDate;
            } catch { return false; }
        };

        const filteredAppointments = appointments.filter(app => app.customerId && filterByDate(app.date));
        const filteredPredictions = predictions.filter(p => filterByDate(p.pcDate));
        const filteredRecords = performanceRecords.filter(r => filterByDate(r.applicationDate));


        const planned: Record<string, number> = {};
        const results: Record<string, number> = {};
        summaryActivityTypes.forEach(type => {
            planned[type] = 0;
            results[type] = 0;
        });

        filteredAppointments.forEach(app => {
            if (summaryActivityTypes.includes(app.meetingType as MeetingType) && app.meetingType !== 'N') {
                if (app.status !== 'cancelled') {
                    planned[app.meetingType]++;
                }
                if (app.status === 'completed') {
                    results[app.meetingType]++;
                }
            }
        });
        
        planned['N'] = filteredPredictions.length;
        results['N'] = filteredRecords.length;
        
        return { planned, results, periodText, filteredAppointments, filteredPredictions, filteredRecords };

    }, [appointments, predictions, performanceRecords, currentDate, viewMode]);

    const handleStatClick = (type: MeetingType | 'all', scope: 'planned' | 'results') => {
        const title = `${periodText} ${type === 'all' ? '' : type} ${scope === 'planned' ? '예정' : '결과'} 활동`;
        
        let appsToShow: Appointment[] = [];

        const appointmentBasedTypes = type === 'all' 
            ? summaryActivityTypes.filter(t => t !== 'N') 
            : (type !== 'N' ? [type] : []);

        if (appointmentBasedTypes.length > 0) {
            appsToShow = appsToShow.concat(filteredAppointments.filter(app => {
                const typeMatch = appointmentBasedTypes.includes(app.meetingType as MeetingType);
                const scopeMatch = scope === 'planned' ? app.status !== 'cancelled' : app.status === 'completed';
                return typeMatch && scopeMatch;
            }));
        }

        if (type === 'N' || type === 'all') {
            if (scope === 'planned') {
                const predictionApps: Appointment[] = filteredPredictions.map(p => ({
                    id: p.id,
                    customerId: customers.find(c => c.name === p.customerName)?.id,
                    customerName: p.customerName,
                    date: p.pcDate,
                    time: '',
                    meetingType: 'N',
                    notes: `[계약임박] 상품: ${p.productName}, 예상 실적: ${p.recognizedPerformance.toLocaleString()}원`,
                    status: 'scheduled',
                }));
                appsToShow = appsToShow.concat(predictionApps);
            }
            if (scope === 'results') {
                const recordApps: Appointment[] = filteredRecords.map(r => ({
                    id: r.id,
                    customerId: customers.find(c => c.name === r.contractorName)?.id,
                    customerName: r.contractorName,
                    date: r.applicationDate,
                    time: '',
                    meetingType: 'N',
                    notes: `[계약완료] 상품: ${r.productName}, 인정 실적: ${r.recognizedPerformance.toLocaleString()}원`,
                    status: 'completed',
                }));
                appsToShow = appsToShow.concat(recordApps);
            }
        }

        onOpenDetails(title, appsToShow);
    };


    return (
        <div className="bg-[var(--background-secondary)] p-4 rounded-lg shadow-lg border border-[var(--border-color)] text-[var(--text-primary)]">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                 <h2 className="text-xl font-semibold text-[var(--text-primary)]">활동 요약</h2>
                 <div className="flex items-center gap-2">
                    <button onClick={() => handleStatClick('all', 'planned')} className="text-sm font-medium text-[var(--text-accent)] hover:underline">
                        전체보기
                    </button>
                    <button onClick={() => setViewMode('week')} className={`px-3 py-1 text-sm rounded-md ${viewMode === 'week' ? 'bg-[var(--background-accent)] text-[var(--text-on-accent)]' : 'bg-[var(--background-tertiary)]'}`}>주간</button>
                    <button onClick={() => setViewMode('month')} className={`px-3 py-1 text-sm rounded-md ${viewMode === 'month' ? 'bg-[var(--background-accent)] text-[var(--text-on-accent)]' : 'bg-[var(--background-tertiary)]'}`}>월간</button>
                 </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-[var(--border-color)] text-center text-[var(--text-secondary)]">
                    <thead>
                        <tr>
                            <th className="border border-[var(--border-color)] p-2 bg-[var(--background-tertiary)] w-16 whitespace-nowrap">구분</th>
                            {summaryActivityTypes.map(type => (
                                <th key={type} className={`border border-[var(--border-color)] p-2 text-xs md:text-sm whitespace-nowrap ${typeColors[type] || 'bg-[var(--background-tertiary)]'}`}>{summaryTypeLabels[type] || type}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="border border-[var(--border-color)] p-2 font-medium bg-[var(--background-tertiary)]/50 text-xs md:text-sm">예정</td>
                            {summaryActivityTypes.map(type => (
                                <td key={type} className="border border-[var(--border-color)] p-2 text-xs md:text-sm cursor-pointer hover:bg-[var(--background-primary)]" onClick={() => handleStatClick(type, 'planned')}>{planned[type]}</td>
                            ))}
                        </tr>
                        <tr>
                            <td className="border border-[var(--border-color)] p-2 font-medium bg-[var(--background-tertiary)]/50 text-xs md:text-sm">결과</td>
                            {summaryActivityTypes.map(type => (
                                <td key={type} className="border border-[var(--border-color)] p-2 text-xs md:text-sm cursor-pointer hover:bg-[var(--background-primary)]" onClick={() => handleStatClick(type, 'results')}>{results[type]}</td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

interface ActivityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  appointments: Appointment[];
}

const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({ isOpen, onClose, title, appointments }) => {
  if (!isOpen) return null;

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} className="max-w-xl w-full h-[70vh] flex flex-col">
      <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">{title}</h2>
        <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><XIcon className="h-6 w-6" /></button>
      </div>
      <div className="p-4 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        {appointments.length > 0 ? (
          <div className="space-y-3">
            {appointments.map(app => {
              const isCompleted = app.status === 'completed';
              return (
              <div key={app.id} className={`bg-[var(--background-tertiary)] p-3 rounded-lg border border-[var(--border-color)] ${isCompleted ? 'opacity-60' : ''}`}>
                  <div className="flex justify-between items-start">
                      <div className={isCompleted ? 'line-through' : ''}>
                          <p className="font-bold text-[var(--text-primary)]">{app.customerName}</p>
                          <p className="text-sm text-[var(--text-secondary)]">{app.date} {app.time}</p>
                      </div>
                      <div className="flex items-center gap-2">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-[var(--background-accent-subtle)] text-[var(--text-accent)]">{app.meetingType}</span>
                           {isCompleted ? (
                               <span className="flex items-center px-2 py-1 text-xs font-semibold rounded-full text-green-300">
                                   <CheckIcon className="h-4 w-4 mr-1" /> 완료
                               </span>
                           ) : (
                               <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                    app.status === 'postponed' ? 'bg-yellow-500/30 text-yellow-300' :
                                    app.status === 'cancelled' ? 'bg-gray-500/20 text-gray-300' :
                                    'bg-blue-500/20 text-blue-300'
                                }`}>
                                  { {scheduled: '예정', postponed: '연기', cancelled: '취소'}[app.status] }
                                </span>
                           )}
                      </div>
                  </div>
                  {app.location && <p className={`text-sm text-[var(--text-muted)] mt-1 ${isCompleted ? 'line-through' : ''}`}>장소: {app.location}</p>}
                  {app.notes && <p className={`text-sm text-[var(--text-secondary)] mt-1 truncate ${isCompleted ? 'line-through' : ''}`}>메모: {app.notes}</p>}
              </div>
            )})}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-center text-[var(--text-muted)]">
              <p>해당하는 활동이 없습니다.</p>
          </div>
        )}
      </div>
       <div className="p-4 bg-[var(--background-primary)] border-t border-[var(--border-color)] flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-[var(--background-tertiary)] border border-[var(--border-color-strong)] rounded-md text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--background-tertiary)]/80">
              닫기
          </button>
      </div>
    </BaseModal>
  );
};


export const Dashboard: React.FC<DashboardProps> = (props) => {
  const { customers, appointments, todos, goals, isLoading, onNavigate, onSelectCustomer, onRequestAppointmentAction, onDeleteAppointment, onSelectAppointment, onOpenAddAppointmentModal, onOpenAddReminderModal, onEditReminder, onAddTodo, onToggleTodo, onDeleteTodo, onUpdateTodo, onAddGoal, onUpdateGoal, onDeleteGoal, quickMemos, onAddQuickMemo, onUpdateQuickMemo, onDeleteQuickMemo, onDeleteMultipleQuickMemos, onUpdateCustomer, onClearMultipleFollowUpDates, onDeleteMultipleAppointments, predictions, onAddPrediction, onUpdatePrediction, onDeletePrediction, performanceRecords, updateCustomerTags, habits, habitLogs, onAddHabit, onUpdateHabit, onDeleteHabit, onLogHabit, onEditAppointment, onOpenRejectionModal, onOpenConsultationRecordModal } = props;

  const calendar = useLunarCalendar();
  const [activeTab, setActiveTab] = useState<'summary' | 'activity' | 'habits'>('summary');
  const [isTodoListModalOpen, setIsTodoListModalOpen] = useState(false);
  const [isRecontactModalOpen, setIsRecontactModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isAddInterestedModalOpen, setIsAddInterestedModalOpen] = useState(false);
  const [activityDetailModalData, setActivityDetailModalData] = useState<{ isOpen: boolean; title: string; appointments: Appointment[] }>({ isOpen: false, title: '', appointments: [] });
  const [reminderToDelete, setReminderToDelete] = useState<Customer | null>(null);

  const [closingRate, setClosingRate] = useState(70);

  const [newMemoText, setNewMemoText] = useState('');
  const [newMemoColor, setNewMemoColor] = useState<MemoColor>('default');
  const [editingMemo, setEditingMemo] = useState<{ id: string; text: string; color: MemoColor } | null>(null);
  const [copiedMemoId, setCopiedMemoId] = useState<string | null>(null);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [filterColor, setFilterColor] = useState<MemoColor | null>(null);
  const [memoSearchQuery, setMemoSearchQuery] = useState('');
  const [isMemoSearchVisible, setIsMemoSearchVisible] = useState(false);
  const [memoCurrentPage, setMemoCurrentPage] = useState(1);
  const memosPerPage = 5;

  const [isPredictionModalOpen, setIsPredictionModalOpen] = useState(false);
  const [editingPrediction, setEditingPrediction] = useState<PerformancePrediction | Partial<PerformancePrediction> | null>(null);
  const [isPredictionAiMode, setIsPredictionAiMode] = useState(false);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [layout, setLayout] = useState<WidgetLayout[]>(() => {
    try {
      const savedLayout = localStorage.getItem('dashboard-layout');
      if (savedLayout) {
        const parsedLayout = JSON.parse(savedLayout);
        if (Array.isArray(parsedLayout)) {
          const savedIds = new Set((parsedLayout as WidgetLayout[]).map((w: WidgetLayout) => w.id));
          const newWidgets = DEFAULT_LAYOUT.filter(w => !savedIds.has(w.id));
          // Ensure adBanner is in the layout if it's missing (though DEFAULT_LAYOUT has it)
          if (!savedIds.has('adBanner')) {
             newWidgets.push({ id: 'adBanner', visible: true });
          }
          return [...parsedLayout, ...newWidgets];
        }
      }
    } catch (e) {
      console.error("Failed to parse dashboard layout from localStorage", e);
    }
    return DEFAULT_LAYOUT;
  });
  
  // Ensure adBanner is always visible regardless of saved state
  useEffect(() => {
    setLayout(prev => {
        const adBannerIndex = prev.findIndex(w => w.id === 'adBanner');
        if (adBannerIndex !== -1 && !prev[adBannerIndex].visible) {
            const newLayout = [...prev];
            newLayout[adBannerIndex] = { ...newLayout[adBannerIndex], visible: true };
            return newLayout;
        }
        return prev;
    });
  }, []);

  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [expandedMemoTags, setExpandedMemoTags] = useState<Set<string>>(new Set());

  const [openBriefingSections, setOpenBriefingSections] = useState<Set<string>>(new Set(['today']));

  const handleToggleExpandMemoTags = (memoId: string) => {
    setExpandedMemoTags(prev => {
        const newSet = new Set(prev);
        if (newSet.has(memoId)) {
            newSet.delete(memoId);
        } else {
            newSet.add(memoId);
        }
        return newSet;
    });
  };

  const toggleBriefingSection = (sectionId: string) => {
    setOpenBriefingSections(prev => {
        const newSet = new Set(prev);
        if (newSet.has(sectionId)) {
            newSet.delete(sectionId);
        } else {
            newSet.add(sectionId);
        }
        return newSet;
    });
  };

  const handleDeleteReminder = (customer: Customer) => {
    setReminderToDelete(customer);
  };

  const confirmDeleteReminder = () => {
      if (reminderToDelete) {
          onClearMultipleFollowUpDates([reminderToDelete.id]);
          setReminderToDelete(null);
      }
  };

  const todayStr = useMemo(() => {
    const today = new Date();
    return new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  }, []);

  const completedHabitsToday = useMemo(() => {
    const set = new Set<string>();
    habitLogs.forEach(log => {
      if (log.date === todayStr && log.completed) {
        set.add(log.habitId);
      }
    });
    return set;
  }, [habitLogs, todayStr]);

  const handleToggleHabit = (habitId: string, isCompleted: boolean) => {
    onLogHabit(habitId, todayStr, !isCompleted);
  };

  const handleHabitKeyDown = (e: React.KeyboardEvent, habitId: string, isCompleted: boolean) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleToggleHabit(habitId, isCompleted);
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, index: number) => {
      setDraggedItemIndex(index);
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLLIElement>) => {
      e.preventDefault();
  };

  const handleDrop = (targetIndex: number) => {
      if (draggedItemIndex === null) return;
      
      setLayout(prevLayout => {
          const newLayout = [...prevLayout];
          const [draggedItem] = newLayout.splice(draggedItemIndex, 1);
          newLayout.splice(targetIndex, 0, draggedItem);
          return newLayout;
      });

      setDraggedItemIndex(null);
  };

  const handleAddInterested = useCallback((customerIds: string[]) => {
    updateCustomerTags(customerIds, ['관심고객'], []);
  }, [updateCustomerTags]);

  const [userColors, setUserColors] = useState<Record<string, string>>({});
  const updateColors = useCallback(() => {
    setUserColors(getUserColors());
  }, []);

  useEffect(() => {
    updateColors();
    window.addEventListener('colors-updated', updateColors);
    return () => {
        window.removeEventListener('colors-updated', updateColors);
    };
  }, [updateColors]);

  const getAppointmentColorClasses = useCallback((app: Appointment): { className?: string, style?: React.CSSProperties } => {
      if (app.status === 'cancelled') return { className: 'bg-[var(--background-tertiary)] text-[var(--text-muted)] line-through' };
      
      const type = app.meetingType;
      if (type) {
          const userColor = userColors[type];
          if (userColor) {
              return {
                  style: {
                      backgroundColor: userColor,
                      color: getTextColorForBackground(userColor)
                  }
              };
          }

          if (DEFAULT_MEETING_TYPE_COLORS[type]) {
              const { bg, text } = DEFAULT_MEETING_TYPE_COLORS[type];
              return { className: `${bg} ${text}` };
          }
      }
      
      const title = app.title || app.customerName || '';
      const { bg, text } = stringToColor(title);
      return { className: `${bg} ${text}` };
  }, [userColors]);

  useEffect(() => {
    try {
      localStorage.setItem('dashboard-layout', JSON.stringify(layout));
    } catch (e) {
      console.error("Failed to save dashboard layout to localStorage", e);
    }
  }, [layout]);
  
   useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const handleAddMemo = () => {
    if (newMemoText.trim()) {
      onAddQuickMemo(newMemoText.trim(), newMemoColor);
      setNewMemoText('');
      setNewMemoColor('default');
    }
  };

  const handleSelectMemo = (id: string) => {
    // This function is not used anymore as there is no bulk selection for memos
  };

  const handleDeleteSelectedMemos = () => {
    // This function is not used anymore as there is no bulk selection for memos
  };

  const handleCopyMemo = (text: string, id: string) => {
      navigator.clipboard.writeText(text).then(() => {
          setCopiedMemoId(id);
          setTimeout(() => setCopiedMemoId(null), 2000);
      });
  };

  const handleStartEditing = (memo: QuickMemo) => {
    const textWithTags = memo.text + (memo.tags.length > 0 ? ' ' + memo.tags.map(t => `#${t}`).join(' ') : '');
    setEditingMemo({ id: memo.id, text: textWithTags, color: (memo.color as MemoColor) || 'default' });
  };

  const handleSaveEdit = () => {
      if (editingMemo) {
          const originalMemo = quickMemos.find(m => m.id === editingMemo.id);
          if (!originalMemo) return;
  
          const tagRegex = /#([^\s#]+)/g;
          const tags = [...editingMemo.text.matchAll(tagRegex)].map(match => match[1]);
          const cleanText = editingMemo.text.replace(tagRegex, '').replace(/\s+/g, ' ').trim();
  
          const memoToUpdate: QuickMemo = {
              ...originalMemo,
              text: cleanText,
              tags: tags,
              color: editingMemo.color
          };
          onUpdateQuickMemo(memoToUpdate);
          setEditingMemo(null);
      }
  };
  
  const handleOpenPredictionModal = (prediction: PerformancePrediction | Partial<PerformancePrediction> | null = null, aiMode = false) => {
    setEditingPrediction(prediction);
    setIsPredictionAiMode(aiMode);
    setIsPredictionModalOpen(true);
  };

  const predictionTotals = useMemo(() => {
    const totalPerformance = predictions.reduce((sum, p) => sum + p.recognizedPerformance, 0);
    const finalPrediction = totalPerformance * (closingRate / 100);
    return {
        totalPerformance,
        finalPrediction,
        count: predictions.length
    }
  }, [predictions, closingRate]);

  const briefingItems = useMemo(() => {
      const items: BriefingItem[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
  
      const getDDayInfo = (dateString: string): { dDay: number; text: string } => {
          const targetDate = new Date(dateString);
          targetDate.setHours(0, 0, 0, 0);
          const diffTime = targetDate.getTime() - today.getTime();
          const dDay = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (dDay === 0) return { dDay, text: 'D-DAY' };
          if (dDay > 0) return { dDay, text: `D-${dDay}` };
          return { dDay, text: `${-dDay}일 지남` };
      };
  
      // Events (up to 30 days)
      const thirtyDaysFromNow = new Date(today);
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
      customers.forEach(customer => {
        // ... (existing briefing logic)
        // --- Birthday ---
        if (customer.birthday) {
          try {
            let thisYearEventDate: Date | null = null;
            
            if (customer.isBirthdayLunar) {
                if(calendar) {
                    const [, birthMonth, birthDay] = customer.birthday.split('-').map(Number);
                    if (birthMonth && birthDay) {
                        const thisYearSolar = calendar.lunarToSolar(today.getFullYear(), birthMonth, birthDay, false);
                        if (thisYearSolar) {
                            thisYearEventDate = new Date(thisYearSolar.year, thisYearSolar.month - 1, thisYearSolar.day);
                            
                            if (thisYearEventDate < today) {
                                const nextYearSolar = calendar.lunarToSolar(today.getFullYear() + 1, birthMonth, birthDay, false);
                                if (nextYearSolar) {
                                    thisYearEventDate = new Date(nextYearSolar.year, nextYearSolar.month - 1, nextYearSolar.day);
                                } else {
                                    thisYearEventDate = null;
                                }
                            }
                        }
                    }
                }
            } else {
              const birthDate = new Date(customer.birthday);
              if (!isNaN(birthDate.getTime())) {
                thisYearEventDate = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
                if (thisYearEventDate < today) {
                  thisYearEventDate.setFullYear(today.getFullYear() + 1);
                }
              }
            }
            
            if (thisYearEventDate && thisYearEventDate <= thirtyDaysFromNow) {
              const { dDay, text } = getDDayInfo(thisYearEventDate.toISOString().split('T')[0]);
              items.push({ id: `event-${customer.id}-birthday`, type: 'birthday', date: thisYearEventDate, customer, title: `${customer.name}님 생일`, subtitle: text, dDay });
            }
          } catch(e) { console.error("Error processing birthday for briefing:", e); }
        }

        // ... (rest of briefing logic)
        // --- Named Anniversaries ---
        (customer.namedAnniversaries || []).forEach(ann => {
          if (ann.date) {
            try {
              let eventDate: Date | null = null;
              const [year, month, day] = ann.date.split('-').map(Number);
        
              if (ann.isLunar) {
                if (calendar && month && day) {
                    if (!year || year < today.getFullYear()) {
                        const thisYearSolar = calendar.lunarToSolar(today.getFullYear(), month, day, false);
                        if (thisYearSolar) {
                            eventDate = new Date(thisYearSolar.year, thisYearSolar.month - 1, thisYearSolar.day);
                            if (eventDate < today) {
                                const nextYearSolar = calendar.lunarToSolar(today.getFullYear() + 1, month, day, false);
                                if (nextYearSolar) {
                                    eventDate = new Date(nextYearSolar.year, nextYearSolar.month - 1, nextYearSolar.day);
                                }
                            }
                        }
                    } else { 
                        const solarDate = calendar.lunarToSolar(year, month, day, false);
                        if (solarDate) {
                            eventDate = new Date(solarDate.year, solarDate.month - 1, solarDate.day);
                        }
                    }
                }
              } else { 
                const annDate = new Date(ann.date);
                if (!isNaN(annDate.getTime())) {
                  if (annDate.getFullYear() < today.getFullYear()) {
                    eventDate = new Date(today.getFullYear(), annDate.getMonth(), annDate.getDate());
                    if (eventDate < today) {
                      eventDate.setFullYear(today.getFullYear() + 1);
                    }
                  } else { 
                    eventDate = annDate;
                  }
                }
              }
              
              if (eventDate && eventDate >= today && eventDate <= thirtyDaysFromNow) {
                const { dDay, text } = getDDayInfo(eventDate.toISOString().split('T')[0]);
                items.push({ id: `event-${customer.id}-ann-${ann.id}`, type: 'anniversary', date: eventDate, customer, title: `${customer.name}님 ${ann.name}`, subtitle: text, dDay });
              }
            } catch(e) { console.error("Error processing anniversary for briefing:", e); }
          }
        });
      });
  
      // Contract Expiries (up to 60 days)
      const sixtyDaysFromNow = new Date(today);
      sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);
      customers.forEach(customer => {
          (customer.contracts || []).forEach(contract => {
              if (contract.expiryDate && contract.status === 'active') {
                  const expiry = new Date(contract.expiryDate);
                  if (expiry >= today && expiry <= sixtyDaysFromNow) {
                      const { dDay, text } = getDDayInfo(contract.expiryDate);
                      items.push({ id: `expiry-${contract.id}`, type: 'expiry', date: expiry, customer, title: `${customer.name}님 계약 만기`, subtitle: `${contract.productName} (${text})`, dDay });
                  }
              }
          });
      });
  
      // Recontact reminders (from past to next 7 days)
      const sevenDaysFromNow = new Date(today);
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      customers.forEach(c => {
        if (c.nextFollowUpDate && !c.rejectionDate) {
          const followUpDate = new Date(c.nextFollowUpDate);
          if (followUpDate <= sevenDaysFromNow) { 
            const { dDay, text } = getDDayInfo(c.nextFollowUpDate);

            let latestNote: string | undefined = undefined;
            if (Array.isArray(c.callHistory) && c.callHistory.length > 0) {
                const sortedHistory = [...c.callHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                if (sortedHistory[0].notes) {
                    latestNote = sortedHistory[0].notes;
                }
            }
            
            items.push({ 
                id: `recontact-${c.id}`, 
                type: 'recontact', 
                date: followUpDate, 
                customer: c, 
                title: `${c.name}님 재접촉`, 
                subtitle: text, 
                dDay,
                notes: latestNote
            });
          }
        }
        
        if (c.rejectionDate && c.nextFollowUpDate) {
          const followUpDate = new Date(c.nextFollowUpDate);
          if (followUpDate <= thirtyDaysFromNow) { 
            const { dDay, text } = getDDayInfo(c.nextFollowUpDate);
            items.push({
              id: `rejection-recontact-${c.id}`,
              type: 'rejectionRecontact',
              date: followUpDate,
              customer: c,
              title: `${c.name}님 거절 후 재접촉`,
              subtitle: `거절사유: ${c.rejectionReason || '기록 없음'} (${text})`,
              dDay,
              notes: c.rejectionNotes,
            });
          }
        }
      });
  
      // AP -> PC follow up reminders
      const fourteenDaysAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
      const customerAppointments = new Map<string, Appointment[]>();
      appointments.forEach(app => {
          if (app.customerId) {
              if (!customerAppointments.has(app.customerId)) customerAppointments.set(app.customerId, []);
              customerAppointments.get(app.customerId)!.push(app);
          }
      });
  
      customers.forEach(customer => {
          const apps = customerAppointments.get(customer.id);
          if (!apps) return;
          const apAppointments = apps.filter(a => a.meetingType === 'AP').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          if (apAppointments.length === 0) return;
          const lastAp = apAppointments[0];
          const lastApDate = new Date(lastAp.date);
          if (lastApDate <= fourteenDaysAgo) {
              const hasPcAfterAp = apps.some(a => a.meetingType === 'PC' && new Date(a.date) > lastApDate);
              if (!hasPcAfterAp) {
                  const daysSince = Math.floor((today.getTime() - lastApDate.getTime()) / (1000 * 3600 * 24));
                  items.push({ id: `followup-${customer.id}`, type: 'followUp', date: today, customer, title: `${customer.name}님 후속 조치 필요`, subtitle: `AP 후 ${daysSince}일 경과`, dDay: 0 });
              }
          }
      });
      
      items.sort((a, b) => a.dDay - b.dDay || a.date.getTime() - b.date.getTime());
  
      const groups: { [key: string]: BriefingItem[] } = { overdue: [], today: [], tomorrow: [], thisWeek: [], future: [] };
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      const dayOfWeek = today.getDay(); 
      const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1; 
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() - offset + 6);
      endOfWeek.setHours(23,59,59,999);
  
      items.forEach(item => {
        if (item.dDay < 0) groups.overdue.push(item);
        else if (item.dDay === 0) groups.today.push(item);
        else if (item.dDay === 1) groups.tomorrow.push(item);
        else if (item.date > tomorrow && item.date <= endOfWeek) groups.thisWeek.push(item);
        else groups.future.push(item);
      });
      
      groups.overdue.sort((a, b) => a.dDay - b.dDay);
  
      return groups;
    }, [customers, appointments, calendar]);

  const todaysAppointments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);
    
    const occurrencesForToday = generateOccurrences(appointments, today, endOfToday, calendar, { excludeTA: false });
    
    return occurrencesForToday
      .filter(app => {
        const isCompletedTA = app.meetingType === 'TA' && app.status === 'completed';
        return !isCompletedTA;
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, calendar]);
  
  const getDDay = (dateString: string): { text: string; color: string } | null => {
      if (!dateString) return null;
      try {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const targetDate = new Date(dateString);
          if (isNaN(targetDate.getTime())) return null;
          targetDate.setHours(0, 0, 0, 0);
          
          const diffTime = targetDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 0) return { text: 'D-DAY', color: 'bg-red-500/20 text-red-400' };
          if (diffDays > 0 && diffDays <= 7) return { text: `D-${diffDays}`, color: 'bg-orange-500/20 text-orange-400' };
          if (diffDays > 0) return { text: `D-${diffDays}`, color: 'bg-green-500/20 text-green-400' };
          return { text: `${-diffDays}일 지남`, color: 'bg-yellow-500/20 text-yellow-400' };
      } catch (e) {
          return null;
      }
  };
  
    const PredictionCard: React.FC<{ prediction: PerformancePrediction; onEdit: () => void; onDelete: () => void; }> = ({ prediction, onEdit, onDelete }) => {
        return (
            <div className="bg-[var(--background-secondary)] p-4 rounded-lg shadow border border-[var(--border-color)]">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <p className="font-bold text-lg text-[var(--text-primary)]">{prediction.customerName}</p>
                        <p className="text-sm text-[var(--text-muted)]">{prediction.pcDate}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={onEdit} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-accent)]" title="수정"><PencilIcon className="h-5 w-5"/></button>
                        <button onClick={onDelete} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-danger)]" title="삭제"><TrashIcon className="h-5 w-5"/></button>
                    </div>
                </div>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">상품명:</span>
                        <span className="font-medium text-[var(--text-secondary)]">{prediction.productName}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">예상 보험료:</span>
                        <span className="font-medium text-[var(--text-secondary)]">{prediction.premium.toLocaleString()}원</span>
                    </div>
                    <div className="flex justify-between bg-[var(--background-tertiary)] p-2 rounded-md">
                        <span className="font-semibold text-[var(--text-muted)]">예상 인정실적:</span>
                        <span className="font-bold text-[var(--text-primary)]">{prediction.recognizedPerformance.toLocaleString()}원</span>
                    </div>
                </div>
            </div>
        );
    };

    const [widgetCurrentDate, setWidgetCurrentDate] = useState(new Date());

    const allMemoTags = useMemo(() => {
        const tags = new Set<string>();
        quickMemos.forEach(memo => {
            memo.tags?.forEach(tag => tags.add(tag));
        });
        return Array.from(tags).sort();
    }, [quickMemos]);

    const filteredAndSortedMemos = useMemo(() => {
        const lowerQuery = memoSearchQuery.toLowerCase().trim();
        const filtered = quickMemos.filter(memo => {
            const tagMatch = !filterTag || memo.tags?.includes(filterTag);
            const colorMatch = !filterColor || memo.color === filterColor;
            
            const searchMatch = !lowerQuery ||
                memo.text.toLowerCase().includes(lowerQuery) ||
                (memo.tags && memo.tags.some(tag => tag.toLowerCase().includes(lowerQuery)));

            return tagMatch && colorMatch && searchMatch;
        });

        // Now sort: pinned first, then by creation date
        return filtered.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

    }, [quickMemos, filterTag, filterColor, memoSearchQuery]);

    useEffect(() => {
        setMemoCurrentPage(1);
    }, [filterTag, filterColor, memoSearchQuery]);

    const memoTotalPages = Math.ceil(filteredAndSortedMemos.length / memosPerPage);
    const paginatedMemos = useMemo(() => {
        const startIndex = (memoCurrentPage - 1) * memosPerPage;
        const endIndex = startIndex + memosPerPage;
        return filteredAndSortedMemos.slice(startIndex, endIndex);
    }, [filteredAndSortedMemos, memoCurrentPage]);

    const handleTogglePinMemo = (memo: QuickMemo) => {
        onUpdateQuickMemo({ ...memo, isPinned: !memo.isPinned });
    };

    const widgetComponents: Record<WidgetId, React.ReactNode> = {
        todaysBriefing: (() => {
            const renderBriefingSection = (title: string, items: BriefingItem[], sectionId: string) => {
                if (items.length === 0) return null;
                const isOpen = openBriefingSections.has(sectionId);

                return (
                  <div key={sectionId} className="border-b border-[var(--border-color)] last:border-b-0">
                    <button
                      onClick={() => toggleBriefingSection(sectionId)}
                      className="w-full flex justify-between items-center p-2 text-left hover:bg-[var(--background-tertiary)] rounded-t-md"
                      aria-expanded={isOpen}
                    >
                      <h3 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider">{title} ({items.length})</h3>
                      {isOpen ? <ChevronUpIcon className="h-5 w-5 text-[var(--text-muted)]" /> : <ChevronDownIcon className="h-5 w-5 text-[var(--text-muted)]" />}
                    </button>
                    {isOpen && (
                        <div className="pl-2 pr-1 pb-2 space-y-2 animate-fade-in">
                        {items.map(item => {
                            const { dDay } = item;
                            let highlightClass = 'border-transparent';
                            let dDayColorClass = 'text-[var(--text-secondary)]';

                            if (dDay < 0) {
                                highlightClass = 'border-yellow-500';
                                dDayColorClass = 'text-yellow-400 font-semibold';
                            } else if (dDay === 0) {
                                highlightClass = 'border-red-500';
                                dDayColorClass = 'text-red-400 font-semibold';
                            } else if (dDay > 0 && dDay <= 3) {
                                highlightClass = 'border-orange-500';
                                dDayColorClass = 'text-orange-400 font-semibold';
                            }

                            let icon;
                            switch(item.type) {
                              case 'birthday': icon = <CakeIcon className="h-5 w-5 text-pink-400" />; break;
                              case 'anniversary': icon = <GiftIcon className="h-5 w-5 text-red-400" />; break;
                              case 'expiry': icon = <BriefcaseIcon className="h-5 w-5 text-cyan-400" />; break;
                              case 'rejectionRecontact': icon = <PhoneIcon className="h-5 w-5 text-orange-400" />; break;
                              case 'recontact':
                              case 'followUp':
                              default: icon = <PhoneIcon className="h-5 w-5 text-yellow-400" />; break;
                            }
                            return (
                              <div key={item.id} className={`p-2 bg-[var(--background-tertiary)] rounded-md flex justify-between items-center group hover:bg-[var(--background-primary)] border-l-4 ${highlightClass}`}>
                                <div onClick={() => onSelectCustomer(item.customer)} className="flex items-center gap-3 cursor-pointer flex-grow min-w-0">
                                    {icon}
                                    <div className="min-w-0">
                                        <p className="font-semibold text-sm text-[var(--text-primary)] truncate">{item.title}</p>
                                        <p className={`text-xs truncate ${dDayColorClass}`}>{item.subtitle}</p>
                                        {item.notes && (
                                            <p className="text-xs text-[var(--text-muted)] mt-1 truncate" title={item.notes}>
                                                📝 {item.notes}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {['recontact', 'rejectionRecontact'].includes(item.type) && (
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
                                        <button onClick={(e) => { e.stopPropagation(); onEditReminder(item.customer); }} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-accent)] rounded-full" title="수정"><PencilIcon className="h-4 w-4" /></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteReminder(item.customer); }} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-danger)] rounded-full" title="삭제"><TrashIcon className="h-4 w-4" /></button>
                                    </div>
                                )}
                              </div>
                            );
                        })}
                        </div>
                    )}
                  </div>
                );
              };

            const totalItems = Object.values(briefingItems).reduce((sum: number, arr: BriefingItem[]) => sum + arr.length, 0);

            return (
                <div className="bg-[var(--background-secondary)] p-4 md:p-6 rounded-lg shadow-lg border border-[var(--border-color)] flex flex-col animate-fade-in-up h-full">
                    <div className="flex justify-between items-center shrink-0 mb-2 md:mb-4">
                        <h2 className="text-2xl font-semibold text-[var(--text-primary)] flex items-center">
                            <LightBulbIcon className="h-5 w-5 md:h-6 md:w-6 mr-2 md:mr-3 text-yellow-400"/>
                            <span className="truncate">오늘의 브리핑 ({totalItems})</span>
                        </h2>
                        <button onClick={() => setIsRecontactModalOpen(true)} className="flex items-center px-3 py-1 bg-[var(--background-tertiary)] text-[var(--text-primary)] rounded-md text-sm font-medium hover:bg-opacity-80 shrink-0 border border-[var(--border-color-strong)]">
                            <PlusIcon className="h-4 w-4 mr-1" />
                            관리
                        </button>
                    </div>
                    {totalItems === 0 ? (
                         <div className="flex items-center justify-center h-full text-center">
                            <p className="text-[var(--text-muted)] text-sm">오늘의 브리핑이 없습니다.</p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 -mr-1">
                           <div className="border border-[var(--border-color)] rounded-md">
                                {renderBriefingSection('오늘', briefingItems.today, 'today')}
                                {renderBriefingSection('기한 지남', briefingItems.overdue, 'overdue')}
                                {renderBriefingSection('내일', briefingItems.tomorrow, 'tomorrow')}
                                {renderBriefingSection('이번 주', briefingItems.thisWeek, 'thisWeek')}
                                {renderBriefingSection('향후 일정', briefingItems.future, 'future')}
                           </div>
                        </div>
                    )}
                </div>
            );
        })(),
        adBanner: (
            <div className="bg-[var(--background-secondary)] p-0 rounded-lg shadow-lg border border-[var(--border-color)] overflow-hidden h-full min-h-[100px] flex items-center justify-center relative group cursor-pointer animate-fade-in-up" onClick={() => window.location.href='tel:01022163426'}>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-10 group-hover:opacity-20 transition-opacity"></div>
                <div className="text-center z-10 p-6">
                     <p className="text-[var(--text-accent)] font-bold text-lg mb-2 break-keep">인카금융서비스 제이어스 사업단과<br className="hidden md:block"/> 미래를 함께하실 분을 모십니다</p>
                     <button className="mt-2 px-4 py-1.5 bg-[var(--background-accent)] text-white text-xs font-bold rounded-full hover:bg-[var(--background-accent-hover)] transition-colors shadow-md">
                        연락하기
                     </button>
                </div>
                <span className="absolute top-2 right-2 text-[10px] text-[var(--text-muted)] border border-[var(--border-color)] px-1 rounded">AD</span>
            </div>
        ),
        todaysHabits: (
            <div className="bg-[var(--background-secondary)] p-4 md:p-6 rounded-lg shadow-lg border border-[var(--border-color)] h-full flex flex-col animate-fade-in-up">
              <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4 flex items-center">
                <CheckIcon className="h-6 w-6 mr-3 text-green-400"/>
                오늘의 습관
              </h2>
              {habits.length === 0 ? (
                <div className="flex items-center justify-center flex-grow text-center">
                    <p className="text-[var(--text-muted)] text-sm">등록된 습관이 없습니다.</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {habits.map(habit => {
                    const isCompleted = completedHabitsToday.has(habit.id);
                    return (
                      <div
                        key={habit.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleToggleHabit(habit.id, isCompleted)}
                        onKeyDown={(e) => handleHabitKeyDown(e, habit.id, isCompleted) }
                        className={`flex items-center gap-2 px-3 py-2 rounded-full cursor-pointer transition-all duration-200 border-2 ${
                          isCompleted
                            ? 'bg-[var(--background-accent-subtle)] border-transparent ring-2 ring-[var(--background-accent)]'
                            : 'bg-[var(--background-tertiary)] border-transparent hover:border-[var(--background-accent)]'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors flex-shrink-0 ${
                          isCompleted 
                            ? 'bg-[var(--background-accent)] border-[var(--background-accent)]' 
                            : 'border-[var(--border-color-strong)]'
                        }`}>
                          {isCompleted && <CheckIcon className="w-3 h-3 text-white" />}
                        </div>
                        <span className={`text-sm font-medium ${isCompleted ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>
                          {habit.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
        ),
        appointments: (
            <div className="bg-[var(--background-secondary)] p-4 md:p-6 rounded-lg shadow-lg border border-[var(--border-color)] flex flex-col animate-fade-in-up h-full">
                <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-2 md:mb-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center truncate">
                        <CalendarIcon className="h-5 w-5 md:h-6 md:w-6 mr-2 md:mr-3 text-blue-400"/>
                        <span className="truncate">오늘의 일정 ({todaysAppointments.length})</span>
                    </div>
                    <button onClick={() => { const today = new Date(); const todayStr = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0]; onOpenAddAppointmentModal(todayStr, '09:00'); }} className="flex items-center px-3 py-1 bg-[var(--background-accent-subtle)] text-[var(--text-accent)] rounded-md text-sm font-medium hover:bg-opacity-80 shrink-0">
                        <PlusIcon className="h-4 w-4 mr-1" />
                        추가
                    </button>
                </h2>
                <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1 -mr-1">
                    {todaysAppointments.length > 0 ? (
                    todaysAppointments.map(app => {
                        const colorProps = getAppointmentColorClasses(app);
                        const isCompleted = app.status === 'completed';
                        return (
                            <div 
                                key={(app as any).occurrenceId || app.id} 
                                style={colorProps.style}
                                className={`p-3 rounded-md flex items-start justify-between group ${colorProps.className || ''} ${isCompleted ? 'opacity-60' : ''}`}
                            >
                                <div className="flex-grow truncate cursor-pointer mr-2 flex items-start" onClick={() => onSelectAppointment(app)}>
                                    {isCompleted && <CheckIcon className="h-5 w-5 mr-1.5 flex-shrink-0 mt-0.5" />}
                                    <div className={`flex-grow truncate ${isCompleted ? 'line-through' : ''}`}>
                                        <p className="font-semibold">{formatTimeForCalendar(app.time)} - {app.title || app.customerName}</p>
                                        <div className={`mt-1 space-y-0.5 text-sm ${colorProps.style ? '' : 'opacity-80'}`}>
                                            {app.location && <p className="truncate" title={app.location}><strong>장소:</strong> {app.location}</p>}
                                            {app.customerId && <p><strong>유형:</strong> {app.meetingType}</p>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                    {app.status === 'scheduled' ? (
                                        <>
                                            <button onClick={(e) => { e.stopPropagation(); onRequestAppointmentAction(app, 'completed'); }} className="px-2 py-1 text-xs font-medium text-green-800 bg-green-200 rounded-md hover:bg-green-300">완료</button>
                                            {app.meetingType === 'PC' && app.customerId ? (
                                                <button onClick={(e) => { 
                                                    e.stopPropagation();
                                                    const seed: Partial<PerformancePrediction> = {
                                                        customerName: app.customerName || '',
                                                        pcDate: (app as any).occurrenceDate || app.date,
                                                    };
                                                    handleOpenPredictionModal(seed, false);
                                                }} className="px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-200 rounded-md hover:bg-yellow-300">예측</button>
                                            ) : app.meetingType !== 'AP' && (
                                                <button onClick={(e) => { e.stopPropagation(); onRequestAppointmentAction(app, 'postponed'); }} className="px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-200 rounded-md hover:bg-yellow-300">연기</button>
                                            )}
                                            <button onClick={(e) => { e.stopPropagation(); onRequestAppointmentAction(app, 'cancelled'); }} className="px-2 py-1 text-xs font-medium text-gray-800 bg-gray-200 rounded-md hover:bg-gray-300">취소</button>
                                        </>
                                    ) : isCompleted ? (
                                        <span className={`flex items-center px-2 py-1 text-xs font-semibold rounded-full shrink-0 cursor-default`}>
                                            <CheckIcon className="h-4 w-4 mr-1" /> 완료
                                        </span>
                                    ) : (
                                         <span className="text-xs font-semibold px-2">
                                           {{postponed: '연기', cancelled: '취소'}[app.status]}
                                         </span>
                                    )}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (window.confirm('해당 일정을 삭제하시겠습니까?')) {
                                                onDeleteAppointment(app.id);
                                            }
                                        }}
                                        className={`p-1 rounded-full ${colorProps.style ? 'text-white/70 hover:bg-black/20' : 'text-[var(--text-muted)] hover:bg-[var(--background-tertiary)]'}`}
                                        aria-label="일정 삭제"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                    ) : (
                    <div className="flex items-center justify-center h-full text-center">
                        <p className="text-[var(--text-muted)] text-xs md:text-sm">오늘 예정된 일정이 없습니다.</p>
                    </div>
                    )}
                </div>
            </div>
        ),
        todos: (
            <div className="bg-[var(--background-secondary)] p-4 md:p-6 rounded-lg shadow-lg border border-[var(--border-color)] flex flex-col animate-fade-in-up h-full">
                <TodoList
                    todos={todos}
                    onAddTodo={onAddTodo}
                    onToggleTodo={onToggleTodo}
                    onDeleteTodo={onDeleteTodo}
                    onUpdateTodo={onUpdateTodo}
                    maxVisibleItems={5}
                    onShowMoreClick={() => setIsTodoListModalOpen(true)}
                />
            </div>
        ),
        quickMemo: (
            <div className="bg-[var(--background-secondary)] p-4 md:p-6 rounded-lg shadow-lg border border-[var(--border-color)] flex flex-col animate-fade-in-up h-full">
                <div className="flex justify-between items-center mb-4 shrink-0 gap-2">
                    <h2 className="text-2xl font-semibold text-[var(--text-primary)] flex items-center shrink-0">
                        <PencilIcon className="h-6 w-6 mr-3 text-purple-400"/>
                        간편 메모 ({filteredAndSortedMemos.length})
                    </h2>
                     <div className="flex items-center gap-1">
                        {isMemoSearchVisible && (
                            <input
                                type="text"
                                value={memoSearchQuery}
                                onChange={e => setMemoSearchQuery(e.target.value)}
                                placeholder="내용, 태그 검색..."
                                className="w-36 sm:w-48 p-1.5 text-sm border-b-2 bg-transparent focus:outline-none focus:border-[var(--background-accent)] transition-all duration-300 animate-fade-in"
                                autoFocus
                            />
                        )}
                        <button
                            onClick={() => {
                                if (isMemoSearchVisible) {
                                    setMemoSearchQuery('');
                                }
                                setIsMemoSearchVisible(prev => !prev);
                            }}
                            className="p-2 rounded-full hover:bg-[var(--background-tertiary)] text-[var(--text-muted)]"
                            title={isMemoSearchVisible ? "검색 닫기" : "메모 검색"}
                        >
                            {isMemoSearchVisible ? <XIcon className="h-5 w-5"/> : <SearchIcon className="h-5 w-5"/>}
                        </button>
                    </div>
                </div>
                <div className="mb-4 shrink-0 space-y-2">
                    {allMemoTags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold text-[var(--text-muted)]">태그:</span>
                            <button onClick={() => setFilterTag(null)} className={`px-2 py-0.5 text-xs rounded-full ${!filterTag ? 'bg-[var(--background-accent)] text-white' : 'bg-[var(--background-tertiary)]'}`}>전체</button>
                            {allMemoTags.map(tag => (
                                <button key={tag} onClick={() => setFilterTag(tag)} className={`px-2 py-0.5 text-xs rounded-full ${filterTag === tag ? 'bg-[var(--background-accent)] text-white' : 'bg-[var(--background-tertiary)]'}`}>#{tag}</button>
                            ))}
                        </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-[var(--text-muted)]">색상:</span>
                        <button onClick={() => setFilterColor(null)} className={`px-2 py-0.5 text-xs rounded-full ${!filterColor ? 'bg-[var(--background-accent)] text-white' : 'bg-[var(--background-tertiary)]'}`}>전체</button>
                        {Object.keys(memoColors).filter(c => c !== 'default').map(color => (
                            <button key={color} onClick={() => setFilterColor(color as MemoColor)} className={`w-5 h-5 rounded-full ${memoColors[color as MemoColor].bg} border ${memoColors[color as MemoColor].border} ${filterColor === color ? 'ring-2 ring-offset-1 ring-[var(--background-accent)]' : ''}`}></button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 min-h-0 flex flex-col">
                    <div className="relative shrink-0">
                        <textarea
                            value={editingMemo ? editingMemo.text : newMemoText}
                            onChange={(e) => editingMemo ? setEditingMemo({...editingMemo, text: e.target.value}) : setNewMemoText(e.target.value)}
                            rows={3}
                            placeholder="빠르게 메모하고 싶을 때 사용하세요... (#태그 사용 가능)"
                            className="w-full p-2 border rounded-md shadow-sm focus:ring-[var(--background-accent)] focus:border-[var(--background-accent)] bg-[var(--background-tertiary)] border-[var(--border-color-strong)] text-[var(--text-primary)]"
                        />
                    </div>
                    <div className="flex justify-between items-center mt-2 shrink-0">
                         <div className="flex items-center gap-2">
                            {(Object.keys(memoColors) as MemoColor[]).map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => editingMemo ? setEditingMemo({...editingMemo, color}) : setNewMemoColor(color)}
                                    className={`w-6 h-6 rounded-full ${memoColors[color].bg} border ${memoColors[color].border} transition-transform transform hover:scale-110 ${(editingMemo ? editingMemo.color : newMemoColor) === color ? 'ring-2 ring-offset-2 ring-[var(--background-accent)]' : ''}`}
                                    aria-label={`Color ${color}`}
                                />
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            {editingMemo ? (
                                <>
                                    <button onClick={() => setEditingMemo(null)} className="px-3 py-1 text-sm rounded-md border border-[var(--border-color-strong)]">취소</button>
                                    <button onClick={handleSaveEdit} className="px-3 py-1 text-sm rounded-md bg-[var(--background-accent)] text-[var(--text-on-accent)]">저장</button>
                                </>
                            ) : (
                                <button onClick={handleAddMemo} disabled={!newMemoText.trim()} className="px-3 py-1 text-sm rounded-md bg-[var(--background-accent)] text-[var(--text-on-accent)] disabled:opacity-50">메모 추가</button>
                            )}
                        </div>
                    </div>
                    <div className="mt-4 flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2">
                        <div className="space-y-2">
                          {paginatedMemos.map(memo => (
                              <div key={memo.id} className={`p-3 rounded-md group border ${memoColors[memo.color as MemoColor]?.bg || memoColors.default.bg} ${memoColors[memo.color as MemoColor]?.border || memoColors.default.border}`}>
                                  <pre className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap font-sans">{memo.text}</pre>
                                  {memo.tags && memo.tags.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-1 mt-2">
                                        {(expandedMemoTags.has(memo.id) ? memo.tags : memo.tags.slice(0, 3)).map(tag => (
                                            <Tag key={tag} label={tag} />
                                        ))}
                                        {memo.tags.length > 3 && (
                                            <button
                                                onClick={() => handleToggleExpandMemoTags(memo.id)}
                                                className="text-xs font-medium text-[var(--text-accent)] hover:underline px-2 py-1"
                                            >
                                                {expandedMemoTags.has(memo.id) ? '접기' : `... ${memo.tags.length - 3}개 더보기`}
                                            </button>
                                        )}
                                    </div>
                                  )}
                                  <div className="text-right mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => handleTogglePinMemo(memo)} className={`p-1 text-[var(--text-muted)] hover:text-[var(--text-accent)] ${memo.isPinned ? 'text-[var(--text-accent)]' : ''}`} title={memo.isPinned ? '고정 해제' : '고정'}>
                                        <BookmarkIcon className="h-4 w-4" solid={!!memo.isPinned} />
                                      </button>
                                      <button onClick={() => handleCopyMemo(memo.text, memo.id)} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-accent)]" title="복사">{copiedMemoId === memo.id ? <CheckIcon className="h-4 w-4 text-green-500"/> : <ClipboardIcon className="h-4 w-4"/>}</button>
                                      <button onClick={() => handleStartEditing(memo)} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-accent)]" title="수정"><PencilIcon className="h-4 w-4"/></button>
                                      <button onClick={() => onDeleteQuickMemo(memo.id)} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-danger)]" title="삭제"><TrashIcon className="h-4 w-4"/></button>
                                  </div>
                              </div>
                          ))}
                        </div>
                    </div>
                    {memoTotalPages > 1 && (
                        <div className="mt-4 flex justify-center items-center gap-2 shrink-0">
                            <button
                                onClick={() => setMemoCurrentPage(p => Math.max(1, p - 1))}
                                disabled={memoCurrentPage === 1}
                                className="px-3 py-1 border border-[var(--border-color-strong)] rounded-md disabled:opacity-50 text-sm"
                            >
                                이전
                            </button>
                            <span className="text-sm text-[var(--text-secondary)]">
                                {memoCurrentPage} / {memoTotalPages}
                            </span>
                            <button
                                onClick={() => setMemoCurrentPage(p => Math.min(memoTotalPages, p + 1))}
                                disabled={memoCurrentPage === memoTotalPages}
                                className="px-3 py-1 border border-[var(--border-color-strong)] rounded-md disabled:opacity-50 text-sm"
                            >
                                다음
                            </button>
                        </div>
                    )}
                </div>
            </div>
        ),
        goals: <GoalsTracker goals={goals} onAddGoal={onAddGoal} onUpdateGoal={onUpdateGoal} onDeleteGoal={onDeleteGoal} />,
        predictions: (
            <div className="bg-[var(--background-secondary)] p-4 md:p-6 rounded-lg shadow-lg border border-[var(--border-color)] flex flex-col animate-fade-in-up h-full">
                <div className="flex justify-between items-center mb-4 shrink-0">
                    <h2 className="text-2xl font-semibold text-[var(--text-primary)] flex items-center">
                        <SparklesIcon className="h-6 w-6 mr-3 text-amber-400"/>
                        실적 예측
                    </h2>
                    <button onClick={() => handleOpenPredictionModal(null, false)} className="flex items-center px-3 py-1 bg-[var(--background-accent-subtle)] text-[var(--text-accent)] rounded-md text-sm font-medium hover:bg-opacity-80">
                        <PlusIcon className="h-4 w-4 mr-1" /> 예측 추가
                    </button>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar -mr-2 pr-2">
                    <div className="space-y-3">
                        {predictions.map(p => (
                            <PredictionCard 
                                key={p.id}
                                prediction={p}
                                onEdit={() => handleOpenPredictionModal(p, false)}
                                onDelete={() => onDeletePrediction(p.id)}
                            />
                        ))}
                    </div>
                </div>
                 <div className="mt-4 pt-4 border-t border-[var(--border-color)] shrink-0">
                    <div className="flex items-center gap-2">
                        <label htmlFor="closingRate" className="text-sm text-[var(--text-muted)]">예상 청약율:</label>
                        <span className="text-lg font-bold text-[var(--text-accent)]">{closingRate}%</span>
                    </div>
                    <input type="range" min="0" max="100" step="5" value={closingRate} onChange={e => setClosingRate(Number(e.target.value))} className="w-full h-2 bg-[var(--background-tertiary)] rounded-lg appearance-none cursor-pointer my-2" id="closingRate" />
                    <div className="bg-[var(--background-accent-subtle)] p-3 rounded-md text-center">
                        <p className="text-sm text-[var(--text-accent)] font-semibold">최종 예측 실적 (청약율 적용)</p>
                        <p className="text-xl font-bold text-[var(--text-accent)] mt-1">{Math.round(predictionTotals.finalPrediction).toLocaleString()}원</p>
                    </div>
                 </div>
            </div>
        ),
        calendarWeek: <div />, 
        activitySummary: <ActivitySummaryWidget appointments={appointments} customers={customers} predictions={predictions} performanceRecords={performanceRecords} currentDate={widgetCurrentDate} onOpenDetails={(title, apps) => setActivityDetailModalData({ isOpen: true, title, appointments: apps })} />,
        monthlyPerformance: <div />,
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">🏠 홈</h1>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsSettingsModalOpen(true)} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                        <DragHandleIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>

            <div className="flex border-b border-[var(--border-color)] mb-6">
                <button
                    onClick={() => setActiveTab('summary')}
                    className={`px-4 py-2 text-sm font-medium ${activeTab === 'summary' ? 'text-[var(--text-accent)] border-b-2 border-[var(--background-accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                >
                    요약
                </button>
                 <button
                    onClick={() => setActiveTab('activity')}
                    className={`px-4 py-2 text-sm font-medium ${activeTab === 'activity' ? 'text-[var(--text-accent)] border-b-2 border-[var(--background-accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                >
                    활동 관리
                </button>
                <button
                    onClick={() => setActiveTab('habits')}
                    className={`px-4 py-2 text-sm font-medium ${activeTab === 'habits' ? 'text-[var(--text-accent)] border-b-2 border-[var(--background-accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                >
                    습관 관리
                </button>
            </div>
            
            {activeTab === 'summary' && (
                <div className="animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {layout.filter(w => w.visible).map(widgetConf => {
                            const widgetContent = widgetComponents[widgetConf.id];
                            
                            return (
                                <div key={widgetConf.id} className="h-full">
                                    {widgetContent}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            {activeTab === 'activity' && (
                <div className="animate-fade-in">
                    <PerformanceManagement
                        showOnlyKanban={true}
                        records={props.performanceRecords}
                        onAdd={props.onAddPerformanceRecord}
                        onUpdate={props.onUpdatePerformanceRecord}
                        onDelete={props.onDeletePerformanceRecord}
                        predictions={props.predictions}
                        onAddPrediction={props.onAddPrediction}
                        onUpdatePrediction={props.onUpdatePrediction}
                        onDeletePrediction={props.onDeletePrediction}
                        customers={props.customers}
                        goals={props.goals}
                        onAddGoal={props.onAddGoal}
                        onUpdateGoal={props.onUpdateGoal}
                        onDeleteGoal={props.onDeleteGoal}
                        appointments={props.appointments}
                        onAddAppointment={props.onAddAppointment}
                        onUpdateAppointment={props.onUpdateAppointment}
                        onUpdateCustomer={props.onUpdateCustomer}
                        onEditAppointment={props.onEditAppointment}
                        onRequestAction={props.onRequestAction}
                        onRequestAppointmentAction={props.onRequestAppointmentAction}
                        updateCustomerTags={props.updateCustomerTags}
                        onSelectCustomer={props.onSelectCustomer}
                        onSetOnAppointmentAddSuccess={props.onSetOnAppointmentAddSuccess}
                        onOpenRejectionModal={onOpenRejectionModal}
                        onOpenConsultationRecordModal={onOpenConsultationRecordModal}
                    />
                </div>
            )}
            {activeTab === 'habits' && (
                <HabitTracker 
                    habits={habits}
                    habitLogs={habitLogs}
                    onAddHabit={onAddHabit}
                    onUpdateHabit={onUpdateHabit}
                    onDeleteHabit={onDeleteHabit}
                    onLogHabit={onLogHabit}
                />
            )}

            {isSettingsModalOpen && (
                <BaseModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} className="max-w-md w-full">
                    <div className="p-4 border-b border-[var(--border-color)]">
                        <h2 className="text-xl font-bold">대시보드 편집</h2>
                    </div>
                    <div className="p-4 space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                        <p className="text-sm text-[var(--text-muted)] mb-2">항목을 드래그하여 순서를 바꾸고, 눈 아이콘으로 표시 여부를 선택하세요.</p>
                        <ul className="space-y-2">
                            {layout
                                .filter(widget => widget.id !== 'adBanner')
                                .map((widget, index) => (
                                <li
                                    key={widget.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragOver={handleDragOver}
                                    onDrop={() => handleDrop(index)}
                                    className={`flex items-center justify-between p-2 bg-[var(--background-tertiary)] rounded-md transition-opacity ${draggedItemIndex === index ? 'opacity-50' : ''}`}
                                >
                                    <div className="flex items-center">
                                        <span className="cursor-grab text-[var(--text-muted)]"><DragHandleIcon className="h-5 w-5 mr-3"/></span>
                                        <span className="font-medium">{WIDGET_METADATA[widget.id].name}</span>
                                    </div>
                                    <button onClick={() => setLayout(prev => {
                                        const newLayout = [...prev];
                                        newLayout[index] = { ...widget, visible: !widget.visible };
                                        return newLayout;
                                    })}>{widget.visible ? <EyeIcon className="w-5 h-5"/> : <EyeOffIcon className="w-5 h-5"/>}</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="p-4 bg-[var(--background-primary)] border-t border-[var(--border-color)]">
                        <button onClick={() => setIsSettingsModalOpen(false)} className="w-full px-4 py-2 bg-[var(--background-accent)] text-white rounded-md">완료</button>
                    </div>
                </BaseModal>
            )}
            <TodoListModal isOpen={isTodoListModalOpen} onClose={() => setIsTodoListModalOpen(false)} todos={todos} onAddTodo={onAddTodo} onToggleTodo={onToggleTodo} onDeleteTodo={onDeleteTodo} onUpdateTodo={onUpdateTodo} />
            <RecontactModal isOpen={isRecontactModalOpen} onClose={() => setIsRecontactModalOpen(false)} customers={customers} onUpdateCustomer={onUpdateCustomer} onClearMultipleFollowUpDates={onClearMultipleFollowUpDates} onOpenAddReminder={onOpenAddReminderModal} />
            {isAddInterestedModalOpen && <AddInterestedProspectModal isOpen={isAddInterestedModalOpen} onClose={() => setIsAddInterestedModalOpen(false)} onAdd={handleAddInterested} customers={customers} appointments={appointments} />}
            {isPredictionModalOpen && <AddPerformancePredictionModal isOpen={isPredictionModalOpen} onClose={() => { setIsPredictionModalOpen(false); setEditingPrediction(null); }} onSave={async (data) => { if (editingPrediction && 'id' in editingPrediction) { await onUpdatePrediction({ ...editingPrediction, ...data } as PerformancePrediction); } else { await onAddPrediction(data); } }} prediction={editingPrediction} isAiMode={isPredictionAiMode} />}
            {activityDetailModalData.isOpen && <ActivityDetailModal isOpen={activityDetailModalData.isOpen} onClose={() => setActivityDetailModalData({ isOpen: false, title: '', appointments: [] })} title={activityDetailModalData.title} appointments={activityDetailModalData.appointments} />}
            <ConfirmationModal
                isOpen={!!reminderToDelete}
                onClose={() => setReminderToDelete(null)}
                onConfirm={confirmDeleteReminder}
                title="리마인더 삭제 확인"
                message={<p><strong>{reminderToDelete?.name}</strong>님의 재접촉 리마인더를 삭제하시겠습니까?</p>}
            />
        </div>
    );
};
