import React from 'react';
import { Info, Sparkles, CheckCircle2 } from 'lucide-react';

export default function UpdateHistory() {
  const updates = [
    {
      version: "v1.7.0 (최신)",
      date: "최근 업데이트",
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
    },
    {
      version: "v1.4.1",
      date: "이전 업데이트",
      changes: [
        "크로스 디바이스 동기화 완벽 지원: PC, 태블릿, 스마트폰 간 데이터 충돌 및 미반영 현상 해결",
        "구글 드라이브 메타데이터(modifiedTime) 비교 로직 도입으로 불필요한 다운로드 최소화",
        "데이터 변경 시 백그라운드 이벤트 방송을 통해 새로고침 없이 다른 메뉴/위젯에 즉각 반영"
      ]
    },
    {
      version: "v1.4.0",
      date: "이전 업데이트",
      changes: [
        "신규 기능: 각 기능의 100% 활용을 돕는 상세 [사용 방법] 매뉴얼 페이지 추가",
        "디자인 개선: 나의 시간표 점심시간 높이를 일반 교시와 동일하게 축소하여 가독성 강화",
        "디자인 개선: 학생 명렬표의 엑셀 다운로드 버튼을 알아보기 쉬운 아이콘으로 변경",
        "편의성 개선: 구글 Gemini API 입력 란을 교무수첩 설정 창 안으로 통합하여 관리 편의성 향상"
      ]
    },
    {
      version: "v1.3.1",
      date: "이전 업데이트",
      changes: [
        "나의 시간표: 표 높이 축소 및 폰트 조정을 통한 한눈에 보기 최적화",
        "나의 시간표 설정: 카드형 레이아웃 및 아이콘 추가로 설정 화면 UI/UX 가시성 대폭 개선",
        "대시보드 개선: 오늘의 수업 위젯 형식을 직관적인 [교시 - 과목 - 교실] 배치로 변경"
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