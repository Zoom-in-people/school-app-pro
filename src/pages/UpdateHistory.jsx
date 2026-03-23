import React from 'react';
import { Info, Sparkles, CheckCircle2 } from 'lucide-react';

export default function UpdateHistory() {
  const updates = [
    {
      version: "v1.8.0 (최신)",
      date: "최근 업데이트",
      changes: [
        "AI 세특 작성 전용 페이지 신설: Gemini API를 연동하여 생기부 6대 핵심 역량 카테고리와 50+개 키워드 기반의 5가지 세특 버전을 자동 생성하는 기능 추가",
        "시간표 NEIS 엑셀 연동: '나의 시간표' 메뉴에서 나이스(NEIS) 엑셀 양식(.xlsx)을 업로드하면 시간표가 자동 완성되는 파싱 알고리즘 탑재",
        "고교학점제 완벽 지원: 교과 명렬표에 '학점제 과목' 필드를 추가하고, 과목별로 탭을 나누어 필터링할 수 있는 기능 및 전용 엑셀 양식 도입",
        "달력 연동형 업무 체크리스트: 업무 등록 시 시작일과 마감일을 지정하면 미니 달력에 색상 Bar로 기간이 표시되며, 날짜 클릭 시 해당 업무만 조회 가능",
        "디자인 및 UX 전면 개편: 투박한 브라우저 알림창을 고급스러운 토스트(Toast) 팝업으로 교체하고, 전체 페이지의 스크롤 및 인쇄(PDF) 출력 레이아웃 최적화"
      ]
    },
    {
      version: "v1.7.0",
      date: "이전 업데이트",
      changes: [
        "실시간 모드(Firebase) 설정 페이지 대규모 개선: 적용 완료 시 보안을 위해 설정 코드를 가림 처리하고 '적용 중' UI 표시",
        "안전 장치 추가: 실시간 모드 설정 [제거]를 누르면, 제거하기 직전에 구글 드라이브로 현재 데이터를 1회 자동 백업하여 데이터 손실 원천 차단",
        "UI 개선: 설정 코드를 빈 칸으로 두고 새롭게 입력하거나 취소할 수 있는 전용 [수정] 및 [취소] 버튼 도입"
      ]
    },
    {
      version: "v1.6.0",
      date: "이전 업데이트",
      changes: [
        "클라우드 저장소 분리: Firebase 연동 시 실시간 동기화만 전담하고, 구글 드라이브 자동 저장을 중지하여 명확한 우선순위 확립",
        "데이터 안전성 강화: 사이드바 [학급 관리] 메뉴 위에 [드라이브 수동 백업] 버튼을 신설하여, 원할 때 언제든 구글 드라이브에 안전하게 백업 가능"
      ]
    },
    {
      version: "v1.5.0",
      date: "이전 업데이트",
      changes: [
        "크로스 디바이스 연동성 혁신: PC에서 설정한 개인 Firebase 연동 코드가 스마트폰으로 즉시 자동 전달되는 시스템 구축",
        "클라우드 우선순위 재조정: Firebase 연동 시 스마트폰에 남아있는 옛날 로컬 데이터를 무시하고 클라우드의 최신 데이터를 우선하여 강제 덮어쓰도록 조치"
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