import React from 'react';
import { HelpCircle, LayoutDashboard, Calendar, Users, MessageSquare, BookOpen, CheckSquare, Clock, Save, Smartphone, Sparkles, Printer } from 'lucide-react'; 

export default function HowToUse() {
  const manuals = [
    {
      title: "스마트폰 어플(앱)처럼 사용하기",
      icon: <Smartphone className="text-indigo-500" />,
      desc: "매번 인터넷을 켜서 들어올 필요 없이 진짜 앱처럼 사용해보세요!",
      points: [
        "안드로이드 (크롬 브라우저): 우측 상단의 [점 3개(⋮)] 메뉴를 누른 후, [홈 화면에 추가] 또는 [앱 설치]를 선택하세요.",
        "아이폰 (사파리 브라우저): 화면 하단 중앙의 [공유하기(네모에 화살표)] 버튼을 누른 후, 화면을 살짝 내려서 [홈 화면에 추가]를 선택하세요.",
        "이제 핸드폰 배경화면에 생긴 교무수첩 아이콘을 누르면, 주소창이 사라진 진짜 앱 화면으로 1초 만에 바로 접속됩니다!"
      ]
    },
    {
      title: "AI 세특 작성 도우미 (Pro)",
      icon: <Sparkles className="text-yellow-500" />,
      desc: "생기부 기재 요령이 반영된 5가지 버전의 세특을 단 몇 초 만에 생성합니다.",
      points: [
        "사이드바의 [AI세특 작성] 메뉴는 '교무수첩 설정'에서 Gemini API 키를 등록해야만 나타납니다.",
        "수업 중 관찰한 학생의 활동 내용을 핵심 위주로 입력하고, 하단의 생기부 전용 핵심 역량 키워드를 클릭하세요.",
        "생성 버튼을 누르면 초/중/고 학교급에 맞춰 완벽하게 다듬어진 5가지 버전의 세특이 우측에 나타나며, 한 번에 복사할 수 있습니다."
      ]
    },
    {
      title: "나의 시간표 및 NEIS 엑셀 연동",
      icon: <Clock className="text-indigo-500" />,
      desc: "수동으로 시간표를 짜거나, 나이스 시간표를 1초 만에 불러옵니다.",
      points: [
        "수동 설정: [시간표 설정] 버튼을 눌러 하루 교시 수와 종소리 시간을 맞춘 뒤 표의 빈칸을 눌러 직접 입력합니다.",
        "나이스 연동: 우측 상단 [XLSX 연동] 버튼을 누른 뒤, 나이스에서 다운받은 시간표 엑셀 파일을 그대로 업로드하면 시간표가 자동 완성됩니다.",
        "완성된 시간표는 대시보드의 '오늘의 수업' 위젯에 매일 자동으로 띄워집니다."
      ]
    },
    {
      title: "학생 명렬표 (학점제 과목 지원)",
      icon: <Users className="text-indigo-500" />,
      desc: "수십 명의 학생 정보를 손쉽게 등록하고 다방면으로 관리할 수 있습니다.",
      points: [
        "엑셀 다운로드/업로드 아이콘을 눌러 양식을 받은 뒤 한 번에 수십 명의 학생을 등록하세요.",
        "학생을 추가할 때 성격, 특이사항 태그를 입력해두면 검색과 기억이 쉬워집니다.",
        "교과 담임용 수첩에서는 '학점제 과목'을 입력하여 고교학점제로 흩어진 반 학생들을 과목별 필터 탭으로 모아서 볼 수 있습니다."
      ]
    },
    {
      title: "달력 연동형 업무 체크리스트",
      icon: <CheckSquare className="text-indigo-500" />,
      desc: "마감일과 시작일을 지정하여 업무를 효율적으로 시각화합니다.",
      points: [
        "업무 등록 시 시작일과 마감일을 지정하면, 상단의 미니 달력에 해당 기간 동안 색상이 칠해진 업무 Bar가 표시됩니다.",
        "달력의 특정 날짜를 클릭하면 그 날 진행 중인 업무만 따로 모아서 볼 수 있습니다.",
        "완료 버튼을 누르면 달력에 체크(✅) 마크가 남고, 완료 탭으로 이동합니다."
      ]
    },
    {
      title: "결재 및 인쇄를 위한 문서 출력",
      icon: <Printer className="text-indigo-500" />,
      desc: "모든 기록 문서는 언제든 A4용지에 딱 맞게 인쇄할 수 있습니다.",
      points: [
        "상담 일지와 회의록 페이지 우측 상단의 [인쇄] 버튼을 누르면 사이드바가 숨겨지고 내용만 화면에 꽉 찹니다.",
        "스크롤에 가려져 있던 긴 내용의 회의록이나 상담 기록도, 인쇄 모드에서는 모두 자동으로 펼쳐져 잘림 없이 출력됩니다."
      ]
    },
    {
      title: "월별 행사 및 출결 관리",
      icon: <Calendar className="text-indigo-500" />,
      desc: "학사 일정 달력과 우리 반 전체 출결 통계를 확인하세요.",
      points: [
        "달력의 날짜를 클릭해 학교의 행사(시험, 체험학습 등)를 색상별로 관리하세요.",
        "달력 하단에는 우리 반 학생 전체의 한 달 치 출결 현황 표가 나타납니다.",
        "빈칸을 클릭하면 즉시 해당 날짜에 질병, 미인정 등 출결을 입력하거나 사유(메모)를 기록할 수 있습니다. (토/일/공휴일은 파란색, 빨간색으로 자동 구분됩니다.)"
      ]
    },
    {
      title: "데이터 연동 및 백업 안내",
      icon: <Save className="text-indigo-500" />,
      desc: "선생님의 소중한 기록은 오직 선생님의 구글 계정에만 저장됩니다.",
      points: [
        "수첩에 입력하는 모든 내용은 인터넷 서버가 아닌 브라우저 내부에 즉시 반영되어 로딩 없이 번개처럼 빠릅니다.",
        "기본적으로 구글 드라이브(학교 전용 폴더)로 자동 동기화(백업)가 진행됩니다.",
        "사이드바 메뉴 상단의 [드라이브 수동 백업] 버튼을 누르면 원할 때 언제든 구글 드라이브에 강제 저장본을 생성할 수 있습니다."
      ]
    }
  ];

  return (
    <div className="h-full flex flex-col gap-6 p-2">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
          <HelpCircle className="text-indigo-600"/> 사용 방법 (매뉴얼)
        </h2>
        <p className="text-gray-500 dark:text-gray-400">교무수첩 Pro의 각 메뉴를 100% 활용하는 꿀팁을 안내합니다.</p>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
        {manuals.map((manual, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition hover:shadow-md">
            <div className="flex items-center gap-3 mb-4 border-b border-gray-100 dark:border-gray-700 pb-4">
              <div className="bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-xl">
                {manual.icon}
              </div>
              <h3 className="text-xl font-extrabold text-gray-800 dark:text-gray-200">
                {manual.title}
              </h3>
            </div>
            
            <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-4 px-1">{manual.desc}</p>
            
            <ul className="space-y-3 px-1">
              {manual.points.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="shrink-0 mt-1 w-1.5 h-1.5 bg-gray-400 rounded-full block"></span>
                  <span className="leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}