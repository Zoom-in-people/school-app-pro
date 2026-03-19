import React from 'react';
import { Info, Sparkles, CheckCircle2 } from 'lucide-react';

export default function UpdateHistory() {
  // 🔥 새로운 업데이트가 있을 때마다 배열의 맨 앞에 추가됩니다.
  const updates = [
    {
      version: "v1.3.0 (최신)",
      date: "최근 업데이트",
      changes: [
        "나의 시간표 전면 개편: 직접 요일/시간을 설정하고 수업을 추가하는 수동 시간표 생성기 도입",
        "상담 일지 개선: 학생 버튼 번호순 정렬 및 개별 학생 클릭 시 기록 필터링 기능 추가",
        "업무 체크리스트 UI: 표 헤더 가로 고정으로 글자 깨짐 방지 및 '상태' 텍스트 가로 정렬",
        "업무 분류 커스텀: 업무 등록 시 분류 입력 디자인(Chips) 개선 및 기존 분류 삭제 기능 추가",
        "회의록 UI 최적화: 개별 회의록 카드의 높이를 반으로 줄이고 내부 스크롤 적용",
        "사이드바 정리: 불필요한 메뉴 제거 및 업데이트 내역 전용 페이지 신설"
      ]
    },
    {
      version: "v1.2.1",
      date: "이전 업데이트",
      changes: [
        "상담일지 학생 선택 버튼 자동 줄바꿈(가로 스크롤 제거) 적용",
        "상담일지 및 회의록 2단(두 줄) 그리드 뷰 적용",
        "월별행사 공휴일(음력) 계산 오류 완벽 수정 (2024~2035년 데이터 고정)"
      ]
    },
    {
      version: "v1.2.0",
      date: "이전 업데이트",
      changes: [
        "나의 시간표 구글 드라이브 연동 및 즉각 삭제 기능 추가",
        "업무 체크리스트 UI 최적화 (가로 고정 및 글자 잘림 방지)",
        "업무 분류(태그) 커스텀 편집 및 저장 기능 추가"
      ]
    },
    {
      version: "v1.1.0",
      date: "초기 업데이트",
      changes: [
        "비용 절감을 위한 Firebase → 구글 드라이브 백그라운드 동기화 전환",
        "로컬 스토리지 기반 0.1초 딜레이 초고속 UI 적용"
      ]
    }
  ];

  return (
    <div className="h-full flex flex-col gap-6 p-2">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
          <Info className="text-indigo-600"/> 업데이트 내역
        </h2>
        <p className="text-gray-500 dark:text-gray-400">교무수첩 Pro의 새로운 기능과 개선 사항을 확인하세요.</p>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
        {updates.map((update, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden transition hover:shadow-md">
            {index === 0 && (
              <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1 shadow-sm">
                <Sparkles size={12}/> NEW
              </div>
            )}
            <div className="flex items-end justify-between mb-4 border-b border-gray-100 dark:border-gray-700 pb-4">
              <div>
                <h3 className={`text-xl font-extrabold ${index === 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-800 dark:text-gray-200'}`}>
                  {update.version}
                </h3>
              </div>
              <span className="text-sm font-medium text-gray-400">{update.date}</span>
            </div>
            
            <ul className="space-y-3">
              {update.changes.map((change, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 size={18} className={`shrink-0 mt-0.5 ${index === 0 ? 'text-indigo-500' : 'text-gray-400'}`} />
                  <span className="leading-relaxed">{change}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}