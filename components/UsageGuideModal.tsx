import React, { useState } from 'react';
import BaseModal from './ui/BaseModal';
import { XIcon } from './icons';

interface UsageGuideModalProps {
  isOpen: boolean;
  onClose: (dontShowAgain: boolean) => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h3 className="text-xl font-bold text-[var(--text-accent)] mb-2">{title}</h3>
        <div className="space-y-2 text-sm text-[var(--text-secondary)] pl-4 border-l-2 border-[var(--background-accent)]">
            {children}
        </div>
    </div>
);

const UsageGuideModal: React.FC<UsageGuideModalProps> = ({ isOpen, onClose }) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = () => {
    onClose(dontShowAgain);
  };

  return (
    <BaseModal isOpen={isOpen} onClose={() => handleClose()} className="max-w-3xl w-full">
      <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">🚀 JW's AI CRM 사용 가이드</h2>
        <button onClick={() => handleClose()} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><XIcon className="h-6 w-6" /></button>
      </div>
      <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar max-h-[70vh]">
        <div className="p-4 bg-[var(--background-accent-subtle)] rounded-lg">
            <h3 className="text-lg font-bold text-center text-[var(--text-accent)] mb-2">혹시 고객 정보가 여기저기 흩어져 있나요?</h3>
            <p className="text-sm text-center text-[var(--text-secondary)]">
                중요한 팔로업을 놓치거나, 수많은 서류 속에서 필요한 정보를 찾느라 시간을 허비하고 있지는 않으신가요? 이러한 비효율은 소중한 고객과의 관계를 약화시키고, 결국 실적에도 영향을 미칩니다.
            </p>
             <p className="text-base text-center text-[var(--text-primary)] font-semibold mt-3">
                JW's AI CRM은 바로 이 문제를 해결하기 위해 탄생했습니다. AI 기술을 통해 모든 고객 관리 업무를 하나의 앱에서 스마트하고 체계적으로 처리하여, 당신이 고객에게만 집중할 수 있도록 돕는 최고의 파트너입니다.
            </p>
        </div>
        
        <Section title="📱 모바일 사용 최적화 및 팁">
            <p>모바일 환경에서는 <strong>크롬(Chrome) 브라우저</strong> 사용을 권장합니다. 가장 안정적이고 빠른 환경을 제공합니다.</p>
            <p><strong>'홈 화면에 추가'</strong>하여 앱처럼 사용하세요:</p>
            <ul className="list-disc list-inside ml-4">
                <li><strong>안드로이드 (크롬):</strong> 우측 상단 메뉴 (점 3개) &gt; '홈 화면에 추가'</li>
                <li><strong>iOS (사파리):</strong> 하단 공유 버튼 &gt; '홈 화면에 추가'</li>
            </ul>
            <p><strong>카카오톡으로 링크를 받은 경우:</strong></p>
            <ul className="list-disc list-inside ml-4">
                <li>카카오톡 내장 브라우저는 기능이 제한될 수 있습니다. 외부 브라우저(크롬, 사파리 등)에서 열어주세요.</li>
                <li><strong>안드로이드:</strong> 우측 하단 메뉴 (점 3개) &gt; '다른 브라우저로 열기'</li>
                <li><strong>iOS (아이폰):</strong> 우측 하단 공유 버튼 (상자 위 화살표 아이콘) &gt; '기본 브라우저로 열기' 또는 'Safari로 열기'</li>
                <li>또는 링크 주소를 복사하여 크롬 또는 사파리 브라우저 주소창에 직접 붙여넣어 접속할 수도 있습니다.</li>
            </ul>
        </Section>

        <Section title="✨ 상단 헤더: 빠른 실행과 통합 검색">
            <p>앱 상단에 항상 보이는 헤더는 가장 자주 사용하는 기능을 빠르게 실행할 수 있는 컨트롤 타워입니다.</p>
            <p><strong>통합 검색:</strong> 고객 이름, 연락처, 상담 내용, 일정 등 앱에 저장된 모든 데이터를 한 번에 검색할 수 있는 강력한 기능입니다. 찾고 싶은 키워드를 입력하고 검색하면 관련된 모든 정보가 즉시 나타납니다.</p>
            <p><strong>빠른 추가 버튼:</strong> 어떤 화면에 있든 상관없이 <strong>'고객 추가'</strong>와 <strong>'AI로 일정 추가'</strong> 버튼을 눌러 바로 새로운 정보를 입력할 수 있습니다. 갑자기 고객 정보를 등록해야 하거나 새로운 약속이 생겼을 때 매우 유용합니다.</p>
        </Section>
        
        <Section title="🏠 홈 화면 (대시보드): 모든 영업 활동의 시작점">
            <p>홈 화면은 당신의 하루를 책임지는 똑똑한 지휘 본부입니다. '요약', '활동 관리', '습관 관리' 세 개의 탭으로 구성되어 있어, 필요한 정보에 빠르게 접근할 수 있습니다.</p>
            <p><strong>요약 탭</strong>에서는 오늘의 브리핑(생일, 기념일, 계약 만기, 재접촉 대상 등), 오늘의 일정 및 할 일, 간편 메모를 한눈에 확인할 수 있습니다. 우측 상단 편집 버튼으로 나만의 대시보드를 꾸며보세요.</p>
            <p><strong>활동 관리 탭 (칸반 보드)</strong>에서는 '관심고객'부터 '계약 완료'까지 영업 과정을 시각적으로 관리합니다. 고객을 '관심고객'으로 설정하면 TA 대상 목록에서 바로 확인하고 연락할 수 있어 효율적입니다.</p>
            <p><strong>습관 관리 탭</strong>에서는 '하루 10명 전화하기' 같은 성공 습관을 등록하고 매일 체크할 수 있습니다. '월별 보기'를 통해 나의 꾸준함을 확인하며 동기부여를 얻으세요.</p>
        </Section>

        <Section title="👥 고객 목록: 소중한 고객 정보, 스마트하게 관리하기">
            <p><strong>핵심 고객 그룹:</strong> 목록 상단에서 <strong>상령일 도래, 이번달 기념일, 계약만기 임박</strong> 고객을 바로 확인하고 관리할 수 있습니다. 특히 자동차/단체보험처럼 갱신이 필요한 계약은 만기 전에 미리 확인하고 연락하는 것이 중요합니다.</p>
            <p><strong>AI로 고객 등록:</strong> 명함 사진, 통화 녹음, 텍스트 메모, 엑셀 파일 등 다양한 방식으로 고객을 손쉽게 등록할 수 있습니다.</p>
            <p><strong>분류 및 관리:</strong> '태그'와 '고객 유형'으로 고객을 체계적으로 분류하고, <strong>'보기 설정'</strong>을 통해 원하는 정보(컬럼)만 골라 나만의 맞춤형 테이블을 만들 수 있습니다.</p>
            <p><strong>스마트 탐색:</strong> "30대이면서 암보험 미가입 고객"처럼 복잡한 조건으로 숨겨진 가망 고객을 찾아낼 수 있는 강력한 필터 기능입니다.</p>
        </Section>
        
        <Section title="📞 TA (Telephone Approach)">
            <p>자주 사용하는 통화 스크립트를 저장하고, 고객 선택 시 <strong>{'{customerName}'}</strong> 부분이 실제 고객 이름으로 자동 변경되어 편리합니다.</p>
            <p>고객 목록에서 TA가 필요한 고객들을 선택해 <strong>'콜링 리스트 시작'</strong> 버튼을 누르면, TA 탭에 해당 고객들만으로 구성된 집중 목록이 생성됩니다. 통화 후 결과를 기록하면 목록에서 자동으로 완료 처리되어 진행 상황을 체계적으로 관리할 수 있습니다.</p>
        </Section>

        <Section title="🗓️ 일정 관리">
            <p>캘린더 상단의 <strong>'AI로 일정 추가'</strong> 기능을 사용해 보세요. "내일 3시 강남역 김민준 고객 미팅"처럼 말하듯이 입력하거나 음성으로 녹음하면, AI가 똑똑하게 분석하여 일정을 자동으로 등록해줍니다.</p>
            <p>캘린더는 월간/주간 보기로 전환할 수 있으며, 날짜를 클릭하면 하단에 해당 날짜의 상세 일정과 할 일(Todo), 그리고 하루를 마무리하는 <strong>'총평'</strong>을 기록하는 공간이 나타납니다.</p>
            <p>캘린더 하단의 <strong>'활동 요약'</strong>은 이번 주 또는 이번 달의 TA, AP, PC 등 핵심 활동 횟수를 자동으로 집계해 보여줍니다. 목표 대비 활동량을 직관적으로 파악하고 스스로를 점검하는 데 활용하세요.</p>
        </Section>

        <Section title="📈 영업 관리">
            <p><strong>활동관리 (칸반 보드):</strong> '관심고객'부터 'AP(미팅)', 'PC(제안)', '계약 완료'에 이르기까지, 전체 영업 활동을 한눈에 파악하고 관리할 수 있습니다. 각 단계별로 고객 현황을 직관적으로 확인하고 다음 활동을 계획하여, 체계적인 파이프라인 관리가 가능해집니다.</p>
            <p><strong>나의 목표 설정 및 달성 현황:</strong> "목표가 없는 사람은 방향을 잃은 배와 같습니다." 월간/주간/일간 목표(월 보험료, 신규 계약, AP 횟수 등)를 직접 설정하고, 앱에 기록된 활동 데이터를 바탕으로 <strong>달성률이 자동으로 계산</strong>되는 것을 확인하며 동기를 부여받으세요. 목표를 시각적으로 추적하며 영업 활동의 방향성을 명확히 하고, 성취감을 통해 꾸준히 성장할 수 있습니다.</p>
            <p><strong>실적 현황:</strong> 월별 계약 실적과 예상 실적을 관리합니다. 계약 정보가 담긴 문자나 메모를 AI로 분석하여 실적을 간편하게 등록할 수 있습니다.</p>
            <p><strong>계약 목록 & 성과 분석:</strong> 모든 고객의 계약을 한곳에서 조회하고, 기간별/유형별 성과를 심층적으로 분석하여 영업 전략 수립에 필요한 인사이트를 얻을 수 있습니다.</p>
        </Section>
        
        <Section title="✨ 유용한 기능">
            <p><strong>AI 맞춤 문구 생성:</strong> 고객에게 보낼 안부, 기념일, 정보성 메시지를 다양한 조건으로 생성합니다. 마음에 드는 문구를 '나의 스타일'로 저장하여 AI를 학습시키면, 점점 더 나만의 스타일에 맞는 문구를 추천받을 수 있습니다.</p>
            <p><strong>AI 약관 분석:</strong> PDF나 이미지 형태의 보험 약관을 올리고 궁금한 점을 질문하면, AI가 해당 내용을 찾아 전문가처럼 답변해줍니다.</p>
            <p><strong>내 주변 고객 찾기:</strong> 기준 주소나 지역을 입력하여 근처에 있는 고객을 찾아보세요. 영업 동선을 최적화하고 방문 계획을 효율적으로 세울 수 있습니다.</p>
            <p><strong>앱 설정:</strong> 라이트/다크 모드 등 다양한 테마와 글씨체, 글자 크기를 조절하여 가장 편안한 환경을 설정할 수 있습니다.</p>
        </Section>

        <Section title="💾 데이터 관리">
            <p><strong>100% 개인정보 보호:</strong> 모든 데이터는 외부 서버가 아닌, 현재 사용 중인 기기(스마트폰, PC 등) 내부에만 안전하게 저장됩니다.</p>
            <p><strong>PC-모바일 완벽 연동:</strong> 한 기기에서 <strong>'데이터 내보내기'</strong>로 데이터를 파일로 저장한 뒤, 다른 기기에서 <strong>'데이터 불러오기'</strong>로 해당 파일을 선택하면 모든 정보가 그대로 복원됩니다. 이를 통해 PC에서 작업하다가 밖에서는 스마트폰으로 업무를 이어갈 수 있습니다.</p>
        </Section>

        <Section title="마지막으로">
            <p>이 사용 가이드는 <strong>[유용한 기능]</strong> 탭 하단의 '데이터 및 기타' 섹션에서 언제든지 다시 볼 수 있습니다.</p>
            <p>앱을 충분히 둘러보신 후에는, <strong>[유용한 기능]</strong> 탭의 '데이터 및 기타' 섹션에서 <strong>'예시 데이터 전체 삭제'</strong> 버튼을 눌러 모든 샘플 데이터를 지우고 깨끗한 상태에서 당신만의 CRM을 시작할 수 있습니다.</p>
        </Section>
      </div>
      <div className="p-6 bg-[var(--background-tertiary)] border-t border-[var(--border-color)] flex justify-between items-center">
        <div className="flex items-center">
            <input
                id="dont-show-again"
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="h-4 w-4 rounded border-[var(--border-color-strong)] bg-[var(--background-tertiary)] text-[var(--background-accent)] focus:ring-[var(--background-accent)]"
            />
            <label htmlFor="dont-show-again" className="ml-2 text-sm text-[var(--text-secondary)]">다시 보지 않음</label>
        </div>
        <button onClick={() => handleClose()} className="px-6 py-2 bg-[var(--background-accent)] text-[var(--text-on-accent)] rounded-md text-sm font-medium hover:bg-[var(--background-accent-hover)]">
          닫기
        </button>
      </div>
    </BaseModal>
  );
};

export default UsageGuideModal;
