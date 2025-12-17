
import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { DailyReview } from '../types';
import { PencilIcon, TrashIcon, CheckIcon, XIcon } from './icons';
import ConfirmationModal from './ui/ConfirmationModal';

interface DailyReviewListProps {
    reviews: DailyReview[];
    onSaveDailyReview: (review: DailyReview) => void;
    onDeleteDailyReview: (date: string) => void;
    onDeleteMultipleDailyReviews: (dates: string[]) => void;
}

const DailyReviewList: React.FC<DailyReviewListProps> = ({ reviews, onSaveDailyReview, onDeleteDailyReview, onDeleteMultipleDailyReviews }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
    const [editingReviewDate, setEditingReviewDate] = useState<string | null>(null);
    const [editedContent, setEditedContent] = useState('');
    const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const headerCheckboxRef = useRef<HTMLInputElement>(null);
    
    const sortedReviews = useMemo(() => {
        return [...reviews].sort((a, b) => b.date.localeCompare(a.date));
    }, [reviews]);

    const filteredReviews = useMemo(() => {
        const lowercasedSearch = searchTerm.toLowerCase();
        return sortedReviews.filter(review => {
            if (dateFilter.start && review.date < dateFilter.start) return false;
            if (dateFilter.end && review.date > dateFilter.end) return false;

            if (lowercasedSearch && !review.content.toLowerCase().includes(lowercasedSearch)) {
                return false;
            }
            return true;
        });
    }, [sortedReviews, searchTerm, dateFilter]);
    
    useEffect(() => {
        if (headerCheckboxRef.current) {
            const numSelected = selectedDates.size;
            const numTotal = filteredReviews.length;
            if (numTotal === 0) {
                headerCheckboxRef.current.checked = false;
                headerCheckboxRef.current.indeterminate = false;
                return;
            }
            headerCheckboxRef.current.checked = numSelected === numTotal;
            headerCheckboxRef.current.indeterminate = numSelected > 0 && numSelected < numTotal;
        }
    }, [selectedDates, filteredReviews]);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDateFilter(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    
    const handleClearFilters = () => {
        setSearchTerm('');
        setDateFilter({ start: '', end: '' });
    };

    const handleEditStart = (review: DailyReview) => {
        setEditingReviewDate(review.date);
        setEditedContent(review.content);
    };

    const handleEditCancel = () => {
        setEditingReviewDate(null);
        setEditedContent('');
    };

    const handleEditSave = () => {
        if (editingReviewDate && editedContent.trim()) {
            onSaveDailyReview({ date: editingReviewDate, content: editedContent.trim() });
            handleEditCancel();
        }
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedDates(new Set(filteredReviews.map(r => r.date)));
        } else {
            setSelectedDates(new Set());
        }
    };

    const handleSelectOne = (date: string) => {
        setSelectedDates(prev => {
            const newSet = new Set(prev);
            if (newSet.has(date)) newSet.delete(date); else newSet.add(date);
            return newSet;
        });
    };

    const handleOpenConfirmModal = () => {
        if (selectedDates.size > 0) setIsConfirmModalOpen(true);
    };
    
    const handleConfirmDeletion = () => {
        onDeleteMultipleDailyReviews(Array.from(selectedDates));
        setSelectedDates(new Set());
        setIsConfirmModalOpen(false);
    };

    return (
        <div className="animate-fade-in">
             {selectedDates.size > 0 && (
                <div className="flex items-center justify-end gap-2 mb-4">
                    <span className="text-sm font-medium text-[var(--text-secondary)]">{selectedDates.size}개 선택됨</span>
                    <button onClick={handleOpenConfirmModal} className="flex items-center justify-center bg-[var(--background-danger)] hover:bg-[var(--background-danger-hover)] text-white font-bold py-2 px-3 rounded-lg transition-colors text-sm">
                        <TrashIcon className="h-5 w-5 mr-2" /> 선택 삭제
                    </button>
                </div>
            )}
            {/* Filter section */}
            <div className="bg-[var(--background-secondary)] p-4 rounded-lg shadow-md border border-[var(--border-color)] mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="md:col-span-1">
                        <label htmlFor="search-review" className="block text-sm font-medium text-[var(--text-secondary)]">내용 검색</label>
                        <input
                            id="search-review"
                            type="text"
                            placeholder="총평 내용 검색..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="mt-1 w-full p-2 border border-[var(--border-color-strong)] rounded-md shadow-sm focus:ring-[var(--background-accent)] focus:border-[var(--background-accent)] bg-[var(--background-tertiary)] text-[var(--text-primary)]"
                        />
                    </div>
                    <div className="md:col-span-2 grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="start-date-review" className="block text-sm font-medium text-[var(--text-secondary)]">시작일</label>
                            <input
                                id="start-date-review"
                                type="date"
                                name="start"
                                value={dateFilter.start}
                                onChange={handleDateChange}
                                className="mt-1 w-full p-2 border border-[var(--border-color-strong)] rounded-md shadow-sm focus:ring-[var(--background-accent)] focus:border-[var(--background-accent)] bg-[var(--background-tertiary)] text-[var(--text-primary)]"
                            />
                        </div>
                        <div>
                            <label htmlFor="end-date-review" className="block text-sm font-medium text-[var(--text-secondary)]">종료일</label>
                            <input
                                id="end-date-review"
                                type="date"
                                name="end"
                                value={dateFilter.end}
                                onChange={handleDateChange}
                                className="mt-1 w-full p-2 border border-[var(--border-color-strong)] rounded-md shadow-sm focus:ring-[var(--background-accent)] focus:border-[var(--background-accent)] bg-[var(--background-tertiary)] text-[var(--text-primary)]"
                            />
                        </div>
                    </div>
                </div>
                 <div className="mt-4 pt-4 border-t border-[var(--border-color)] flex items-center justify-between">
                    <div className="flex items-center">
                        <input
                            ref={headerCheckboxRef}
                            type="checkbox"
                            onChange={handleSelectAll}
                            className="h-5 w-5 rounded border-[var(--border-color-strong)] text-[var(--background-accent)] focus:ring-[var(--background-accent)] bg-[var(--background-tertiary)]"
                            aria-label="모든 총평 선택"
                        />
                        <label className="ml-2 text-sm font-medium text-[var(--text-secondary)]">현재 목록 전체 선택 ({filteredReviews.length}개)</label>
                    </div>
                    <button onClick={handleClearFilters} className="text-sm text-[var(--text-accent)] hover:underline">
                        필터 초기화
                    </button>
                 </div>
            </div>

            {/* Review list section */}
            <div className="space-y-4">
                {filteredReviews.length > 0 ? (
                    filteredReviews.map(review => (
                        <div key={review.date} className={`p-4 rounded-lg shadow-md border animate-fade-in-up transition-colors ${selectedDates.has(review.date) ? 'bg-[var(--background-accent-subtle)] border-[var(--background-accent)]/50' : 'bg-[var(--background-secondary)] border-[var(--border-color)]'}`}>
                            <div className="flex items-start gap-3">
                                <input type="checkbox" className="h-5 w-5 rounded border-[var(--border-color-strong)] text-[var(--background-accent)] focus:ring-[var(--background-accent)] bg-[var(--background-tertiary)] mt-1" checked={selectedDates.has(review.date)} onChange={() => handleSelectOne(review.date)} aria-label={`${review.date} 총평 선택`} />
                                <div className="flex-grow">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-bold text-[var(--text-primary)]">
                                            {new Date(review.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                                        </h3>
                                        {editingReviewDate === review.date ? (
                                            <div className="flex items-center gap-2">
                                                <button onClick={handleEditSave} className="p-2 text-green-500 hover:bg-green-500/10 rounded-full" aria-label="저장"><CheckIcon className="h-5 w-5" /></button>
                                                <button onClick={handleEditCancel} className="p-2 text-[var(--text-muted)] hover:bg-gray-500/10 rounded-full" aria-label="취소"><XIcon className="h-5 w-5" /></button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => handleEditStart(review)} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-accent)] hover:bg-[var(--background-accent-subtle)] rounded-full" aria-label="수정"><PencilIcon className="h-5 w-5" /></button>
                                                <button onClick={() => onDeleteDailyReview(review.date)} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-danger)] hover:bg-red-500/10 rounded-full" aria-label="삭제"><TrashIcon className="h-5 w-5" /></button>
                                            </div>
                                        )}
                                    </div>
                                    {editingReviewDate === review.date ? (
                                        <textarea
                                            value={editedContent}
                                            onChange={(e) => setEditedContent(e.target.value)}
                                            className="w-full h-28 p-3 border border-[var(--background-accent)]/50 rounded-md shadow-sm focus:ring-2 focus:ring-[var(--background-accent)] bg-[var(--background-primary)] text-[var(--text-primary)]"
                                            rows={4}
                                            autoFocus
                                        />
                                    ) : (
                                        <pre className="whitespace-pre-wrap font-sans text-[var(--text-secondary)] leading-relaxed">
                                            {review.content}
                                        </pre>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 text-[var(--text-muted)] bg-[var(--background-secondary)] rounded-lg shadow-md border border-[var(--border-color)]">
                        <p className="text-lg">해당 조건에 맞는 총평이 없습니다.</p>
                        <p className="text-sm mt-2">검색어나 필터를 변경해보세요.</p>
                    </div>
                )}
            </div>
             <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDeletion}
                title="총평 삭제 확인"
                message={<p>선택한 {selectedDates.size}개의 총평을 정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>}
            />
        </div>
    );
};

export default DailyReviewList;
