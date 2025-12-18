import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import type { Customer, Appointment, Todo, AppView, Goal, QuickMemo, PerformancePrediction, PerformanceRecord, MeetingType, Habit, HabitLog, CustomerType } from '../types';
import { CakeIcon, GiftIcon, CalendarIcon, ClockIcon, MessageIcon, CheckIcon, XIcon, BriefcaseIcon, PhoneIcon, PencilIcon, TrashIcon, ClipboardIcon, PlusIcon, EyeIcon, EyeOffIcon, ListBulletIcon, SparklesIcon, ChartBarIcon, DocumentTextIcon, DragHandleIcon, LightBulbIcon, ChevronDownIcon, ChevronUpIcon, SearchIcon, BookmarkIcon, MicIcon } from './icons';
import TodoList from './TodoList';
import GoalsTracker from './GoalsTracker';
import BaseModal from './ui/BaseModal';
import { RecontactModal } from './RecontactModal';
import ConfirmationModal from './ui/ConfirmationModal';
import PerformanceManagement from './PerformanceManagement';
import AddPerformancePredictionModal from './AddPerformancePredictionModal';
import { getUserColors, getTextColorForBackground, DEFAULT_MEETING_TYPE_COLORS } from '../services/colorService';
import TodoListModal from './TodoListModal';
import AddInterestedProspectModal from './AddInterestedProspectModal';
import HabitTracker from './HabitTracker';
import Tag from './ui/Tag';
import { useLunarCalendar } from '../hooks/useData';
import VoiceToText from './VoiceToText';

// --- Constants ---
const memoColors = {
    default: { bg: 'bg-[var(--background-tertiary)]', border: 'border-[var(--border-color)]' },
    red: { bg: 'bg-red-500/10', border: 'border-red-500/30' },
    yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
    green: { bg: 'bg-green-500/10', border: 'border-green-500/30' },
    blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
};
type MemoColor = keyof typeof memoColors;

type WidgetId = 'todaysBriefing' | 'appointments' | 'todos' | 'quickMemo' | 'goals' | 'predictions' | 'calendarWeek' | 'activitySummary' | 'monthlyPerformance' | 'todaysHabits' | 'youtubePreview' | 'voiceToText' | 'adBanner';

interface WidgetLayout {
  id: WidgetId;
  visible: boolean;
}

const WIDGET_CONFIG: { id: WidgetId, colSpan: 1 | 2 | 3 }[] = [
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
  { id: 'voiceToText', colSpan: 2 },
  { id: 'youtubePreview', colSpan: 3 },
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
    youtubePreview: { name: '천만설계사 유튜브', icon: <MessageIcon className="h-5 w-5 text-red-500" /> },
    voiceToText: { name: '음성 to Text', icon: <MicIcon className="w-5 h-5 text-teal-400" /> },
};

const DEFAULT_LAYOUT: WidgetLayout[] = WIDGET_CONFIG.map(w => ({
  id: w.id,
  visible: !['monthlyPerformance', 'goals', 'predictions', 'calendarWeek', 'voiceToText'].includes(w.id),
}));

// --- Helper Types ---
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

interface DashboardProps {
  customers: Customer[];
  appointments: Appointment[];
  todos: Todo[];
  goals: Goal[];
  isLoading: boolean;
  onNavigate: (view: AppView) => void;
  onSelectCustomer: (customer: Customer, initialTab?: 'details' | 'consultations' | 'contracts' | 'callHistory' | 'introductions') => void;
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

const toLocalISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const formatTimeForCalendar = (timeStr: string): string => {
    if (!timeStr) return '';
    const [hourStr, minuteStr] = timeStr.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    if (minute === 30) return `${hour}시 반`;
    return `${hour}시`;
};

const stringToColor = (str: string) => {
  let hash = 0;
  if (str.length === 0) return { bg: 'bg-gray-400', text: 'text-white' };
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
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
  return colors[Math.abs(hash) % colors.length];
};

const generateOccurrences = (
  appointmentRules: Appointment[],
  viewStart: Date,
  viewEnd: Date,
  calendar: any,
  options: { excludeTA: boolean } = { excludeTA: true }
): (Appointment & { occurrenceDate: string; occurrenceId: string })[] => {
  const occurrences: (Appointment & { occurrenceDate: string; occurrenceId: string })[] = [];
  const filteredAppointmentRules = options.excludeTA ? appointmentRules.filter(app => app.meetingType !== 'TA') : appointmentRules;
  
  for (const app of filteredAppointmentRules) {
    if (!app.date || !app.date.includes('-')) continue;

    if (!app.recurrenceType || app.recurrenceType === 'none') {
      const appDate = new Date(app.date + 'T00:00:00'); 
      if (isNaN(appDate.getTime())) continue;
      if (appDate >= viewStart && appDate <= viewEnd) {
         const dateStr = toLocalISO(appDate);
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
          if (seriesStartDate.getFullYear() > currentYear) currentYear = seriesStartDate.getFullYear();
          while (safety < 100) {
              safety++;
              let occurrenceDateForYear: Date | null = null;
              if (app.isLunar) {
                  if (calendar) {
                    const [, sMonth, sDay] = app.date.split('-').map(Number);
                    if (sMonth && sDay) {
                        const solarDate = calendar.lunarToSolar(currentYear, sMonth, sDay, false);
                        if (solarDate) occurrenceDateForYear = new Date(solarDate.year, solarDate.month - 1, solarDate.day);
                    }
                  }
              } else {
                  occurrenceDateForYear = new Date(currentYear, seriesStartDate.getMonth(), seriesStartDate.getDate());
              }
              if (occurrenceDateForYear) {
                  if (occurrenceDateForYear > viewEnd) break;
                  if (seriesEndDate && occurrenceDateForYear > seriesEndDate) break;
                  if (occurrenceDateForYear >= seriesStartDate && occurrenceDateForYear >= viewStart) {
                      const occurrenceDateStr = toLocalISO(occurrenceDateForYear);
                      if (!exceptions.has(occurrenceDateStr)) {
                          occurrences.push({ ...app, occurrenceDate: occurrenceDateStr, occurrenceId: `${app.id}_${occurrenceDateStr}` });
                      }
                  }
              }
              currentYear += interval;
          }
      } else {
          let currentDate = new Date(seriesStartDate.getTime());
          if (currentDate < viewStart) currentDate = new Date(viewStart.getTime());
          while (currentDate <= viewEnd && safety < 1095) {
            safety++;
            if (seriesEndDate && currentDate > seriesEndDate) break;
            if (currentDate < seriesStartDate) { currentDate.setDate(currentDate.getDate() + 1); continue; }
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
                        if (diffWeeks % interval === 0) shouldAdd = true;
                    }
                }
            } else if (app.recurrenceType === 'daily') {
                const diffMillis = currentDate.getTime() - seriesStartDate.getTime();
                const diffDays = Math.round(diffMillis / (1000 * 60 * 60 * 24));
                if (diffDays >= 0 && diffDays % interval === 0) shouldAdd = true;
            } else if (app.recurrenceType === 'monthly') {
                const yearDiff = currentDate.getFullYear() - seriesStartDate.getFullYear();
                const monthDiff = yearDiff * 12 + currentDate.getMonth() - seriesStartDate.getMonth();
                if (monthDiff >= 0 && monthDiff % interval === 0 && currentDate.getDate() === seriesStartDate.getDate()) shouldAdd = true;
            }
            if (shouldAdd) {
                const currentDateStr = toLocalISO(currentDate);
                if (!exceptions.has(currentDateStr)) {
                    occurrences.push({ ...app, occurrenceDate: currentDateStr, occurrenceId: `${app.id}_${currentDateStr}` });
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

export const Dashboard: React.FC<DashboardProps> = (props) => {
  const { 
    customers, appointments, todos, goals, isLoading, onNavigate, onSelectCustomer, 
    onRequestAppointmentAction, onDeleteAppointment, onSelectAppointment, 
    onOpenAddAppointmentModal, onOpenAddReminderModal, onEditReminder, onAddTodo, 
    onToggleTodo, onDeleteTodo, onUpdateTodo, onAddGoal, onUpdateGoal, onDeleteGoal, 
    quickMemos, onAddQuickMemo, onUpdateQuickMemo, onDeleteQuickMemo, 
    onDeleteMultipleQuickMemos, onUpdateCustomer, onClearMultipleFollowUpDates, 
    onDeleteMultipleAppointments, predictions, onAddPrediction, onUpdatePrediction, 
    onDeletePrediction, performanceRecords, onAddPerformanceRecord, onUpdatePerformanceRecord, 
    onDeletePerformanceRecord, onAddAppointment, onUpdateAppointment, onEditAppointment, onRequestAction, 
    updateCustomerTags, onSetOnAppointmentAddSuccess, habits, habitLogs, onAddHabit, 
    onUpdateHabit, onDeleteHabit, onLogHabit, onOpenRejectionModal, 
    onOpenConsultationRecordModal, onLogCall 
  } = props;

  const calendar = useLunarCalendar();
  const [activeTab, setActiveTab] = useState<'summary' | 'activity' | 'habits'>('summary');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isRecontactModalOpen, setIsRecontactModalOpen] = useState(false);
  const [isTodoListModalOpen, setIsTodoListModalOpen] = useState(false);
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

  const [layout, setLayout] = useState<WidgetLayout[]>(() => {
    try {
      const savedLayout = localStorage.getItem('dashboard-layout');
      if (savedLayout) {
        const parsedLayout = JSON.parse(savedLayout);
        if (Array.isArray(parsedLayout)) return parsedLayout;
      }
    } catch (e) {}
    return DEFAULT_LAYOUT;
  });
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [openBriefingSections, setOpenBriefingSections] = useState<Set<string>>(new Set(['today']));
  const [expandedMemoTags, setExpandedMemoTags] = useState<Set<string>>(new Set());

  const handleAddInterested = useCallback((customerIds: string[]) => {
    updateCustomerTags(customerIds, ['관심고객'], []);
  }, [updateCustomerTags]);

  const confirmDeleteReminder = () => {
    if (reminderToDelete) {
        onClearMultipleFollowUpDates([reminderToDelete.id]);
        setReminderToDelete(null);
    }
  };

  const toggleBriefingSection = (sectionId: string) => {
    setOpenBriefingSections(prev => {
        const newSet = new Set(prev);
        if (newSet.has(sectionId)) newSet.delete(sectionId);
        else newSet.add(sectionId);
        return newSet;
    });
  };

  const handleToggleExpandMemoTags = (memoId: string) => {
    setExpandedMemoTags(prev => {
        const newSet = new Set(prev);
        if (newSet.has(memoId)) newSet.delete(memoId);
        else newSet.add(memoId);
        return newSet;
    });
  };

  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  const completedHabitsToday = useMemo(() => {
    const set = new Set<string>();
    habitLogs.forEach(log => { if (log.date === todayStr && log.completed) set.add(log.habitId); });
    return set;
  }, [habitLogs, todayStr]);

  const handleToggleHabit = (habitId: string, isCompleted: boolean) => onLogHabit(habitId, todayStr, !isCompleted);

  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, index: number) => { setDraggedItemIndex(index); e.dataTransfer.effectAllowed = 'move'; };
  const handleDragOver = (e: React.DragEvent<HTMLLIElement>) => e.preventDefault();
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

  const [userColors, setUserColors] = useState<Record<string, string>>({});
  const updateColors = useCallback(() => setUserColors(getUserColors()), []);
  useEffect(() => {
    updateColors();
    window.addEventListener('colors-updated', updateColors);
    return () => window.removeEventListener('colors-updated', updateColors);
  }, [updateColors]);

  const getAppointmentColorClasses = useCallback((app: Appointment): { className?: string, style?: React.CSSProperties } => {
      if (app.status === 'cancelled') return { className: 'bg-[var(--background-tertiary)] text-[var(--text-muted)] line-through' };
      const type = app.meetingType;
      if (type) {
          const userColor = userColors[type];
          if (userColor) return { style: { backgroundColor: userColor, color: getTextColorForBackground(userColor) } };
          if (DEFAULT_MEETING_TYPE_COLORS[type]) {
              const { bg, text } = DEFAULT_MEETING_TYPE_COLORS[type];
              return { className: `${bg} ${text}` };
          }
      }
      const { bg, text } = stringToColor(app.title || app.customerName || '');
      return { className: `${bg} ${text}` };
  }, [userColors]);

  useEffect(() => { localStorage.setItem('dashboard-layout', JSON.stringify(layout)); }, [layout]);
  
  const briefingItems = useMemo(() => {
      const items: BriefingItem[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const getDDayInfo = (dateString: string): { dDay: number; text: string } => {
          const targetDate = new Date(dateString + 'T00:00:00');
          const diffTime = targetDate.getTime() - today.getTime();
          const dDay = Math.round(diffTime / (1000 * 60 * 60 * 24));
          if (dDay === 0) return { dDay, text: 'D-DAY' };
          if (dDay > 0) return { dDay, text: `D-${dDay}` };
          return { dDay, text: `${-dDay}일 지남` };
      };
      customers.forEach(customer => {
        if (customer.birthday) {
          try {
            let thisYearEventDate: Date | null = null;
            const [by, bm, bd] = customer.birthday.split('-').map(Number);
            if (customer.isBirthdayLunar && calendar && bm && bd) {
                const solar = calendar.lunarToSolar(today.getFullYear(), bm, bd, false);
                if (solar) thisYearEventDate = new Date(solar.year, solar.month - 1, solar.day);
            } else if (bm && bd) {
                thisYearEventDate = new Date(today.getFullYear(), bm - 1, bd);
            }
            if (thisYearEventDate) {
              const { dDay, text } = getDDayInfo(toLocalISO(thisYearEventDate));
              if (dDay >= -30 && dDay <= 30) items.push({ id: `event-${customer.id}-birthday`, type: 'birthday', date: thisYearEventDate, customer, title: `${customer.name}님 생일`, subtitle: text, dDay });
            }
          } catch(e) {}
        }
      });
      return { today: items.filter(i => i.dDay === 0), overdue: items.filter(i => i.dDay < 0), tomorrow: items.filter(i => i.dDay === 1), thisWeek: items.filter(i => i.dDay > 1 && i.dDay <= 7), future: items.filter(i => i.dDay > 7) };
    }, [customers, calendar]);

  const todaysAppointments = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today); endOfToday.setHours(23, 59, 59, 999);
    return generateOccurrences(appointments, today, endOfToday, calendar, { excludeTA: false }).sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, calendar]);

  const allMemoTags = useMemo(() => {
      const tags = new Set<string>();
      quickMemos.forEach(memo => memo.tags?.forEach(tag => tags.add(tag)));
      return Array.from(tags).sort();
  }, [quickMemos]);

  const filteredAndSortedMemos = useMemo(() => {
      const lowerQuery = memoSearchQuery.toLowerCase().trim();
      const filtered = quickMemos.filter(memo => {
          const tagMatch = !filterTag || memo.tags?.includes(filterTag);
          const colorMatch = !filterColor || memo.color === filterColor;
          const searchMatch = !lowerQuery || memo.text.toLowerCase().includes(lowerQuery) || (memo.tags && memo.tags.some(tag => tag.toLowerCase().includes(lowerQuery)));
          return tagMatch && colorMatch && searchMatch;
      });
      return filtered.sort((a, b) => (a.isPinned === b.isPinned ? 0 : a.isPinned ? -1 : 1) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [quickMemos, filterTag, filterColor, memoSearchQuery]);

  const paginatedMemos = filteredAndSortedMemos.slice((memoCurrentPage - 1) * memosPerPage, memoCurrentPage * memosPerPage);
  const memoTotalPages = Math.ceil(filteredAndSortedMemos.length / memosPerPage);

  const handleAddMemo = () => {
    if (newMemoText.trim()) {
      onAddQuickMemo(newMemoText.trim(), newMemoColor);
      setNewMemoText('');
      setNewMemoColor('default');
    }
  };

  const handleTogglePinMemo = (memo: QuickMemo) => onUpdateQuickMemo({ ...memo, isPinned: !memo.isPinned });
  const handleCopyMemo = (text: string, id: string) => { navigator.clipboard.writeText(text).then(() => { setCopiedMemoId(id); setTimeout(() => setCopiedMemoId(null), 2000); }); };
  const handleStartEditingMemo = (memo: QuickMemo) => { const textWithTags = memo.text + (memo.tags.length > 0 ? ' ' + memo.tags.map(t => `#${t}`).join(' ') : ''); setEditingMemo({ id: memo.id, text: textWithTags, color: (memo.color as MemoColor) || 'default' }); };
  const handleSaveMemoEdit = () => { if (editingMemo) { const originalMemo = quickMemos.find(m => m.id === editingMemo.id); if (!originalMemo) return; const tagRegex = /#([^\s#]+)/g; const tags = [...editingMemo.text.matchAll(tagRegex)].map(match => match[1]); const cleanText = editingMemo.text.replace(tagRegex, '').replace(/\s+/g, ' ').trim(); onUpdateQuickMemo({ ...originalMemo, text: cleanText, tags, color: editingMemo.color }); setEditingMemo(null); } };

  const handleOpenPredictionModal = (prediction: PerformancePrediction | Partial<PerformancePrediction> | null = null, aiMode = false) => {
    setEditingPrediction(prediction as PerformancePrediction);
    setIsPredictionAiMode(aiMode);
    setIsPredictionModalOpen(true);
  };

  const widgetComponents: Record<WidgetId, React.ReactNode> = {
        todaysBriefing: (() => {
            const renderBriefingSection = (title: string, items: BriefingItem[], sectionId: string) => {
                if (items.length === 0) return null;
                const isOpen = openBriefingSections.has(sectionId);
                return (
                  <div key={sectionId} className="border-b border-[var(--border-color)] last:border-b-0">
                    <button onClick={() => toggleBriefingSection(sectionId)} className="w-full flex justify-between items-center p-2 text-left hover:bg-[var(--background-tertiary)] rounded-t-md">
                      <h3 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider">{title} ({items.length})</h3>
                      {isOpen ? <ChevronUpIcon className="h-5 w-5 text-[var(--text-muted)]" /> : <ChevronDownIcon className="h-5 w-5 text-[var(--text-muted)]" />}
                    </button>
                    {isOpen && (
                        <div className="pl-2 pr-1 pb-2 space-y-2 animate-fade-in">
                        {items.map(item => (
                            <div key={item.id} className="p-2 bg-[var(--background-tertiary)] rounded-md flex justify-between items-center border-l-4 border-red-500">
                                <div onClick={() => onSelectCustomer(item.customer)} className="cursor-pointer">
                                    <p className="font-semibold text-sm text-[var(--text-primary)]">{item.title}</p>
                                    <p className="text-xs text-[var(--text-secondary)]">{item.subtitle}</p>
                                </div>
                            </div>
                        ))}
                        </div>
                    )}
                  </div>
                );
            };
            return (
                <div className="bg-[var(--background-secondary)] p-4 md:p-6 rounded-lg shadow-lg border border-[var(--border-color)] flex flex-col animate-fade-in-up h-full">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-semibold text-[var(--text-primary)] flex items-center"><LightBulbIcon className="h-6 w-6 mr-3 text-yellow-400"/>오늘의 브리핑</h2>
                        <button onClick={() => setIsRecontactModalOpen(true)} className="px-3 py-1 bg-[var(--background-accent-subtle)] text-[var(--text-accent)] rounded-md text-sm font-medium">관리</button>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="border border-[var(--border-color)] rounded-md">
                            {renderBriefingSection('오늘', briefingItems.today, 'today')}
                            {renderBriefingSection('기한 지남', briefingItems.overdue, 'overdue')}
                            {renderBriefingSection('내일', briefingItems.tomorrow, 'tomorrow')}
                            {renderBriefingSection('이번 주', briefingItems.thisWeek, 'thisWeek')}
                            {renderBriefingSection('향후 일정', briefingItems.future, 'future')}
                        </div>
                    </div>
                </div>
            );
        })(),
        todaysHabits: (
            <div className="bg-[var(--background-secondary)] p-4 md:p-6 rounded-lg shadow-lg border border-[var(--border-color)] h-full flex flex-col animate-fade-in-up">
              <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4 flex items-center"><CheckIcon className="h-6 w-6 mr-3 text-green-400"/>오늘의 습관</h2>
              <div className="flex flex-wrap gap-3">
                {habits.map(habit => {
                  const isCompleted = completedHabitsToday.has(habit.id);
                  return (
                    <button key={habit.id} onClick={() => handleToggleHabit(habit.id, isCompleted)} className={`flex items-center gap-2 px-3 py-2 rounded-full border-2 ${isCompleted ? 'bg-[var(--background-accent-subtle)] border-transparent ring-2 ring-[var(--background-accent)]' : 'bg-[var(--background-tertiary)] border-transparent'}`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors flex-shrink-0 ${isCompleted ? 'bg-[var(--background-accent)] border-[var(--background-accent)]' : 'border-[var(--border-color-strong)]'}`}>{isCompleted && <CheckIcon className="w-3 h-3 text-white" />}</div>
                      <span className={`text-sm font-medium ${isCompleted ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>{habit.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
        ),
        appointments: (
            <div className="bg-[var(--background-secondary)] p-4 md:p-6 rounded-lg shadow-lg border border-[var(--border-color)] flex flex-col animate-fade-in-up h-full">
                <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4 flex items-center justify-between">
                    <div className="flex items-center">
                        <CalendarIcon className="h-6 w-6 mr-3 text-blue-400"/>오늘의 일정
                    </div>
                    <button onClick={() => { const today = new Date(); const todayStr = toLocalISO(today); onOpenAddAppointmentModal(todayStr, '09:00'); }} className="p-1 text-[var(--text-accent)] hover:bg-[var(--background-accent-subtle)] rounded-full">
                        <PlusIcon className="h-6 w-6" />
                    </button>
                </h2>
                <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                    {todaysAppointments.map(app => {
                        const colorProps = getAppointmentColorClasses(app);
                        const isCompleted = app.status === 'completed';
                        return (
                            <div key={(app as any).occurrenceId || app.id} style={colorProps.style} className={`p-3 rounded-md flex justify-between items-center ${colorProps.className || ''} ${isCompleted ? 'opacity-60' : ''}`}>
                                <div className="cursor-pointer flex-grow min-w-0 mr-2" onClick={() => onSelectAppointment(app)}>
                                    <p className={`font-semibold text-sm truncate ${isCompleted ? 'line-through' : ''}`}>
                                        {formatTimeForCalendar(app.time)} - {app.customerName || app.title}
                                    </p>
                                    {app.location && <p className="text-xs opacity-80 mt-1 truncate">{app.location}</p>}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
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
                                    ) : (
                                         <span className="text-xs font-semibold px-2">
                                           {app.status === 'completed' ? '완료' : app.status === 'postponed' ? '연기' : '취소'}
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
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {todaysAppointments.length === 0 && <p className="text-[var(--text-muted)] text-center py-4 text-sm">오늘 일정이 없습니다.</p>}
                </div>
            </div>
        ),
        todos: (
            <div className="bg-[var(--background-secondary)] p-4 md:p-6 rounded-lg shadow-lg border border-[var(--border-color)] flex flex-col animate-fade-in-up h-full">
                <TodoList todos={todos} onAddTodo={onAddTodo} onToggleTodo={onToggleTodo} onDeleteTodo={onDeleteTodo} onUpdateTodo={onUpdateTodo} maxVisibleItems={5} />
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
                            <button onClick={() => setFilterTag(null)} className={`px-2 py-0.5 text-[10px] rounded-full transition-colors ${!filterTag ? 'bg-[var(--background-accent)] text-white' : 'bg-[var(--background-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--background-primary)]'}`}>전체</button>
                            {allMemoTags.map(tag => (
                                <button key={tag} onClick={() => setFilterTag(tag)} className={`px-2 py-0.5 text-[10px] rounded-full transition-colors ${filterTag === tag ? 'bg-[var(--background-accent)] text-white' : 'bg-[var(--background-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--background-primary)]'}`}>#{tag}</button>
                            ))}
                        </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-[var(--text-muted)]">색상:</span>
                        <button onClick={() => setFilterColor(null)} className={`px-2 py-0.5 text-[10px] rounded-full transition-colors ${!filterColor ? 'bg-[var(--background-accent)] text-white' : 'bg-[var(--background-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--background-primary)]'}`}>전체</button>
                        {(Object.keys(memoColors) as MemoColor[]).filter(c => c !== 'default').map(color => (
                            <button 
                                key={color} 
                                onClick={() => setFilterColor(color)} 
                                className={`w-4 h-4 rounded-full ${memoColors[color].bg} border ${memoColors[color].border} transition-all ${filterColor === color ? 'ring-2 ring-offset-1 ring-[var(--background-accent)] scale-110' : 'hover:scale-110'}`} 
                            />
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
                                    <button onClick={handleSaveMemoEdit} className="px-3 py-1 text-sm rounded-md bg-[var(--background-accent)] text-white">저장</button>
                                </>
                            ) : (
                                <button onClick={handleAddMemo} disabled={!newMemoText.trim()} className="px-4 py-1.5 bg-[var(--background-accent)] text-white rounded-md font-semibold disabled:opacity-50">추가</button>
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
                                  <div className="text-right mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-1">
                                      <button onClick={() => handleTogglePinMemo(memo)} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-accent)]"><BookmarkIcon className="h-4 w-4" solid={!!memo.isPinned} /></button>
                                      <button onClick={() => handleCopyMemo(memo.text, memo.id)} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-accent)]"><ClipboardIcon className="h-4 w-4"/></button>
                                      <button onClick={() => handleStartEditingMemo(memo)} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-accent)]"><PencilIcon className="h-4 w-4"/></button>
                                      <button onClick={() => onDeleteQuickMemo(memo.id)} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-danger)]"><TrashIcon className="h-4 w-4"/></button>
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
                <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4 flex items-center"><SparklesIcon className="h-6 w-6 mr-3 text-amber-400"/>실적 예측</h2>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                    {predictions.map(p => (
                        <div key={p.id} className="p-3 bg-[var(--background-tertiary)] rounded-md border border-[var(--border-color-strong)] flex justify-between items-center">
                            <div><p className="font-bold text-[var(--text-primary)]">{p.customerName}</p><p className="text-xs text-[var(--text-muted)]">{p.productName} ({p.pcDate})</p></div>
                            <div className="text-right"><p className="font-bold text-[var(--text-accent)]">{p.recognizedPerformance.toLocaleString()}원</p></div>
                        </div>
                    ))}
                </div>
            </div>
        ),
        voiceToText: <VoiceToText />, 
        calendarWeek: <div />, 
        activitySummary: <div />, 
        monthlyPerformance: <div />,
        youtubePreview: (
            <div className="bg-[var(--background-secondary)] p-4 md:p-6 rounded-lg shadow-lg border border-[var(--border-color)] flex flex-col animate-fade-in-up h-full">
                <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4 flex items-center">
                    <span className="text-red-500 mr-3">
                        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                        </svg>
                    </span>
                    천만설계사 유튜브
                </h2>
                <a 
                    href="https://www.youtube.com/@천만설계사" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="relative w-full aspect-[21/9] md:aspect-video rounded-lg overflow-hidden bg-slate-900 group cursor-pointer flex items-center justify-center border border-[var(--border-color)]"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-900 opacity-80 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10 flex flex-col items-center gap-2 text-center p-4">
                        <svg className="w-16 h-16 text-white drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                        </svg>
                        <span className="text-white font-bold text-xl">천만설계사 유튜브 바로가기</span>
                        <span className="text-white/80 text-sm">클릭하여 최신 영업 노하우를 확인하세요</span>
                    </div>
                </a>
            </div>
        ),
        adBanner: (
            <div className="bg-[var(--background-secondary)] p-0 rounded-lg shadow-lg border border-[var(--border-color)] overflow-hidden h-full min-h-[100px] flex items-center justify-center relative group cursor-pointer animate-fade-in-up" onClick={() => window.location.href='tel:01022163426'}>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-10 group-hover:opacity-20 transition-opacity"></div>
                <div className="text-center z-10 p-6"><p className="text-[var(--text-accent)] font-bold text-lg mb-2 break-keep">인카금융서비스 제이어스 사업단과<br className="hidden md:block"/> 미래를 함께하실 분을 모십니다</p><button className="mt-2 px-4 py-1.5 bg-[var(--background-accent)] text-white text-xs font-bold rounded-full hover:bg-[var(--background-accent-hover)] transition-colors shadow-md">연락하기</button></div>
                <span className="absolute top-2 right-2 text-[10px] text-[var(--text-muted)] border border-[var(--border-color)] px-1 rounded">AD</span>
            </div>
        ),
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">🏠 홈</h1>
                <button onClick={() => setIsSettingsModalOpen(true)} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"><DragHandleIcon className="h-5 w-5" /></button>
            </div>
            <div className="flex border-b border-[var(--border-color)] mb-6">
                <button onClick={() => setActiveTab('summary')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'summary' ? 'text-[var(--text-accent)] border-b-2 border-[var(--background-accent)]' : 'text-[var(--text-muted)]'}`}>요약</button>
                 <button onClick={() => setActiveTab('activity')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'activity' ? 'text-[var(--text-accent)] border-b-2 border-[var(--background-accent)]' : 'text-[var(--text-muted)]'}`}>활동 관리</button>
                <button onClick={() => setActiveTab('habits')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'habits' ? 'text-[var(--text-accent)] border-b-2 border-[var(--background-accent)]' : 'text-[var(--text-muted)]'}`}>습관 관리</button>
            </div>
            {activeTab === 'summary' && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{layout.filter(w => w.visible).map(w => <div key={w.id} className={w.id === 'youtubePreview' ? 'lg:col-span-3' : 'h-full'}>{widgetComponents[w.id]}</div>)}</div>}
            
            {activeTab === 'activity' && (
                <div className="animate-fade-in">
                    <PerformanceManagement
                        showOnlyKanban={true}
                        records={performanceRecords}
                        onAdd={onAddPerformanceRecord}
                        onUpdate={onUpdatePerformanceRecord}
                        onDelete={onDeletePerformanceRecord}
                        predictions={predictions}
                        onAddPrediction={onAddPrediction}
                        onUpdatePrediction={onUpdatePrediction}
                        onDeletePrediction={onDeletePrediction}
                        customers={customers}
                        goals={goals}
                        onAddGoal={onAddGoal}
                        onUpdateGoal={onUpdateGoal}
                        onDeleteGoal={onDeleteGoal}
                        appointments={appointments}
                        onAddAppointment={onAddAppointment}
                        onUpdateAppointment={onUpdateAppointment}
                        onUpdateCustomer={onUpdateCustomer}
                        onEditAppointment={onEditAppointment}
                        onRequestAction={onRequestAction}
                        onRequestAppointmentAction={onRequestAppointmentAction}
                        updateCustomerTags={updateCustomerTags}
                        onSelectCustomer={onSelectCustomer}
                        onSetOnAppointmentAddSuccess={onSetOnAppointmentAddSuccess}
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
                    <div className="p-4 border-b border-[var(--border-color)]"><h2 className="text-xl font-bold">대시보드 편집</h2></div>
                    <div className="p-4 max-h-96 overflow-y-auto custom-scrollbar">
                        <ul className="space-y-2">
                            {layout.map((w, idx) => (
                                <li key={w.id} draggable onDragStart={e => handleDragStart(e, idx)} onDragOver={handleDragOver} onDrop={() => handleDrop(idx)} className="flex items-center justify-between p-2 bg-[var(--background-tertiary)] rounded-md">
                                    <div className="flex items-center">
                                        <DragHandleIcon className="h-5 w-5 mr-3 cursor-grab text-[var(--text-muted)]"/>
                                        <span>{WIDGET_METADATA[w.id].name}</span>
                                    </div>
                                    <button onClick={() => setLayout(layout.map((item, i) => i === idx ? { ...item, visible: !item.visible } : item))}>
                                        {w.visible ? <EyeIcon className="w-5 h-5"/> : <EyeOffIcon className="h-5 w-5"/>}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="p-4 bg-[var(--background-primary)] border-t border-[var(--border-color)]"><button onClick={() => setIsSettingsModalOpen(false)} className="w-full px-4 py-2 bg-[var(--background-accent)] text-white rounded-md">완료</button></div>
                </BaseModal>
            )}

            {isRecontactModalOpen && (
                <RecontactModal 
                    isOpen={isRecontactModalOpen}
                    onClose={() => setIsRecontactModalOpen(false)}
                    customers={customers}
                    onUpdateCustomer={onUpdateCustomer}
                    onClearMultipleFollowUpDates={onClearMultipleFollowUpDates}
                    onOpenAddReminder={onOpenAddReminderModal}
                />
            )}

            {isPredictionModalOpen && (
                <AddPerformancePredictionModal
                    isOpen={isPredictionModalOpen}
                    onClose={() => { setIsPredictionModalOpen(false); setEditingPrediction(null); }}
                    onSave={async (data) => {
                        if (editingPrediction && 'id' in editingPrediction) {
                            await onUpdatePrediction({ ...editingPrediction, ...data } as PerformancePrediction);
                        } else {
                            await onAddPrediction(data);
                        }
                    }}
                    prediction={editingPrediction}
                    isAiMode={isPredictionAiMode}
                />
            )}

            {isTodoListModalOpen && (
                <TodoListModal
                    isOpen={isTodoListModalOpen}
                    onClose={() => setIsTodoListModalOpen(false)}
                    todos={todos}
                    onAddTodo={onAddTodo}
                    onToggleTodo={onToggleTodo}
                    onDeleteTodo={onDeleteTodo}
                    onUpdateTodo={onUpdateTodo}
                />
            )}
            
            {isAddInterestedModalOpen && <AddInterestedProspectModal isOpen={isAddInterestedModalOpen} onClose={() => setIsAddInterestedModalOpen(false)} onAdd={handleAddInterested} customers={customers} appointments={appointments} />}
            
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

export default Dashboard;
