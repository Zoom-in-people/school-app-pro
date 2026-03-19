import React from 'react';
import { HelpCircle, LayoutDashboard, Calendar, Users, MessageSquare, BookOpen, CheckSquare, Clock, Save } from 'lucide-react';

export default function HowToUse() {
  const manuals = [
    {
      title: "대시보드 한눈에 보기",
      icon: <LayoutDashboard className="text-indigo-500" />,
      desc: "오늘 필요한 모든 정보를 하나의 화면에서 확인하고 관리하세요.",
      points: [
        "오늘 출결: 우리 반 학생들의 결석, 지각 등을 체크하고 메모를 남기면, 월별행사 달력에 즉시 연동됩니다.",
        "업무 체크: 처리해야 할 긴급한 업무들의 마감일과 내용을 한눈에 확인할 수 있습니다.",
        "오늘의 수업: 나의 시간표 메뉴에서 설정해둔 오늘 요일의 시간표가 자동으로 띄워집니다.",
        "급식 정보: NEIS와 연동되어 오늘과 내일의 학교 급식 식단을 보여줍니다."
      ]
    },
    {
      title: "학생 명렬표 (우리반 / 교과)",
      icon: <Users className="text-indigo-500" />,
      desc: "수십 명의 학생 정보를 손쉽게 등록하고 다방면으로 관리할 수 있습니다.",
      points: [
        "엑셀 다운로드/업로드 아이콘을 눌러 양식을 받은 뒤 한 번에 수십 명의 학생을 등록하세요.",
        "학생을 추가할 때 성격, 특이사항 태그를 입력해두면 검색과 기억이 쉬워집니다.",
        "학생 카드 우측 하단의 [AI 세특] 또는 상단의 [일괄 생성]을 누르면, Gemini AI가 학생의 특성을 반영해 생활기록부 문구를 초안으로 작성해줍니다."
      ]
    },
    {
      title: "월별 행사 및 출결 관리",
      icon: <Calendar className="text-indigo-500" />,
      desc: "학사 일정 달력과 우리 반 전체 출결 통계를 확인하세요.",
      points: [
        "달력의 날짜를 클릭해 학교의 행사(시험, 체험학습 등)를 색상별로 관리하세요.",
        "달력 하단에는 우리 반 학생 전체의 한 달 치 출결 현황 표가 나타납니다.",
        "빈칸을 클릭하면 즉시 해당 날짜에 질병, 미인정 등 출결을 입력하거나 사유(메모)를 기록할 수 있습니다."
      ]
    },
    {
      title: "나의 시간표 설정",
      icon: <Clock className="text-indigo-500" />,
      desc: "간편한 설정만으로 이번 학기 내내 활용할 시간표를 만듭니다.",
      points: [
        "[시간표 설정] 버튼을 누른 후, 수업이 있는 요일과 하루의 총 교시 수, 점심시간 배치 등을 내 학교에 맞게 조정하세요.",
        "완료를 누르고 빈칸(+)을 클릭하여 과목명과 장소를 입력합니다.",
        "입력된 과목명은 최근 기록에 남아 다음번 클릭 시 손쉽게 다시 입력할 수 있습니다."
      ]
    },
    {
      title: "상담 일지 및 회의록 기록",
      icon: <MessageSquare className="text-indigo-500" />,
      desc: "쏟아지는 기록들을 체계적이고 안전하게 보관하세요.",
      points: [
        "상담 일지 상단의 학생 이름 버튼을 누르면 해당 학생의 기록만 따로 모아서 볼 수 있습니다.",
        "회의록은 길게 작성해도 공간을 적게 차지하도록 카드의 높이가 고정되며, 내용이 많을 때는 내부 스크롤로 읽을 수 있습니다."
      ]
    },
    {
      title: "진도 관리 (수업 체크)",
      icon: <BookOpen className="text-indigo-500" />,
      desc: "여러 반을 들어가는 교과 전담이나 진도율을 파악하기 좋습니다.",
      points: [
        "[진도 관리] 메뉴로 들어가 수업 그룹을 생성하고, 세로에는 진도명(ex: 1단원), 가로에는 수업할 교실(반)을 추가합니다.",
        "수업을 마친 뒤 빈 동그라미를 클릭하면 초록색 체크 모양으로 바뀌며 오늘 날짜가 기록됩니다."
      ]
    },
    {
      title: "데이터 연동 및 백업 안내",
      icon: <Save className="text-indigo-500" />,
      desc: "선생님의 소중한 기록은 오직 선생님의 구글 계정에만 저장됩니다.",
      points: [
        "수첩에 입력하는 모든 내용은 인터넷 서버가 아닌 브라우저 내부에 즉시 반영되어 로딩 없이 번개처럼 빠릅니다.",
        "기본적으로 구글 드라이브(학교 전용 폴더)로 자동 동기화(백업)가 진행됩니다.",
        "사이드바 좌측 상단의 [드라이브 수동 백업] 버튼을 누르면 원할 때 언제든 구글 드라이브에 강제 저장본을 생성할 수 있습니다.",
        "[실시간 버전 만들기(Pro)] 기능을 통해 Firebase를 연동하신 경우, 평소에는 실시간으로 빠르게 동기화되며 필요 시 수동 백업 버튼으로 드라이브에 안전한 복사본을 남기실 수 있습니다."
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