import React, { useState, useEffect } from 'react';
import { Sparkles, Copy, Loader, Settings, BookOpen, UserCheck, Edit3, Send, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { showToast, showAlert } from '../utils/alerts';

// 🔥 요청 반영: 생기부 맞춤형 6대 역량 카테고리 및 50+ 키워드 대폭 확장
const CHARACTERISTIC_CATEGORIES = {
  "학업 및 탐구 역량": [
    "자기주도적 학습", "학업 열정", "지적 호기심", "깊이 있는 탐구", "정보 활용 능력",
    "분석력", "논리적 추론", "원리 이해력", "학습 내용 적용", "집중력"
  ],
  "진로 및 전공 적합성": [
    "전공에 대한 관심", "진로 탐색 의지", "관련 분야 독서", "전문 지식 습득", 
    "실생활 적용 능력", "시사 이슈 관심", "융합적 사고", "목표 지향성"
  ],
  "인성 및 기본 태도": [
    "성실함", "책임감", "규칙 준수", "끈기와 인내", "긍정적 마인드",
    "자기 성찰", "바른 언어 사용", "솔선수범", "겸손함", "도전 정신"
  ],
  "소통 및 협력 (리더십)": [
    "포용적 리더십", "경청하는 자세", "협동심", "갈등 중재 능력", "뛰어난 발표력",
    "설득력 있는 말하기", "의견 조율", "팀워크 주도", "공감 능력", "타인 배려"
  ],
  "창의성 및 문제해결력": [
    "창의적 아이디어", "다각적 접근", "유연한 사고", "새로운 시도", "문제 인식 능력",
    "대안 제시", "혁신적 태도", "실험 정신", "비판적 사고"
  ],
  "수업 참여 및 실천력": [
    "적극적인 수업 참여", "질문하는 태도", "과제 수행력", "발전적인 피드백 수용", 
    "실천력", "동료 학습 지원", "학습 멘토 역할"
  ]
};

export default function AiRecord() {
  const store = useAppStore();
  const apiKey = store.apiKey;

  const [schoolLevel, setSchoolLevel] = useState('중학교');
  
  useEffect(() => {
    const schoolName = store.currentHandbook?.schoolInfo?.name || "";
    if (schoolName.includes("초등")) setSchoolLevel("초등학교");
    else if (schoolName.includes("중학")) setSchoolLevel("중학교");
    else if (schoolName.includes("고등")) setSchoolLevel("고등학교");
    else setSchoolLevel("중학교"); 
  }, [store.currentHandbook]);

  const [achievementStandard, setAchievementStandard] = useState('');
  const [observation, setObservation] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [minLength, setMinLength] = useState(500);
  const [additionalRequest, setAdditionalRequest] = useState('없음.');

  const [isLoading, setIsLoading] = useState(false);
  const [resultText, setResultText] = useState('');

  const handleTagToggle = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleGenerate = async () => {
    if (!apiKey) {
      showAlert("API 키 누락", "설정 메뉴에서 Gemini API 키를 먼저 등록해주세요.", "error");
      return;
    }
    // 🔥 이 부분만 필수 검사! 특성 태그(selectedTags)는 선택 사항입니다.
    if (!observation.trim()) {
      showToast("학생 관찰 사실 및 활동 내용을 필수로 입력해주세요.", "warning");
      return;
    }

    setIsLoading(true);
    setResultText('');

    const prompt = `당신은 한국의 교육과정과 학교생활기록부 기재 요령에 매우 능통한 베테랑 교사입니다. 아래 제공된 '입력 정보'와 '작성 규칙'을 엄격하게 준수하여 학생의 과목별 세부능력 및 특기사항(세특)을 작성해 주세요.

# [입력 정보]
1. 학교급: ${schoolLevel}
2. 교과목 및 교육과정 내용(성취기준 등): ${achievementStandard || '입력되지 않음'}
3. 학생 관찰 사실 및 활동 내용: ${observation}
4. 학생 행동 양식 및 특성: ${selectedTags.length > 0 ? selectedTags.join(', ') : '입력되지 않음'}
5. 최소 글자 수: ${minLength}자 이상 (공백 포함)
6. 추가 요청 사항: ${additionalRequest}

# [작성 규칙]
1. 학교급 맞춤 작성: 입력된 '학교급'에 따라 문체와 강조점을 다르게 작성하세요.
   - 초등학교: 학생의 흥미, 참여도, 기초적인 이해도와 바른 인성을 강조하는 발달 중심의 서술.
   - 중학교: 학생의 진로 탐색, 자기주도적 학습 능력, 개념에 대한 이해와 적용, 협력적 태도를 강조.
   - 고등학교: 전공 적합성, 심화 탐구 역량, 학업적 우수성, 문제 해결 능력을 보여주는 학술적이고 깊이 있는 서술.
2. 팩트 기반 서술: 제공된 '학생 관찰 사실 및 활동 내용'에 대해서만 작성하며, 입력되지 않은 사실을 AI가 임의로 지어내거나 과장·축소하지 마십시오.
3. 다양한 베리에이션: 입력된 '학생 행동 양식 및 특성'을 다각도로 녹여내어, 각기 다른 뉘앙스와 초점을 가진 세특 내용을 최소 5가지 버전으로 작성하세요. (단, 학생 특성이 '입력되지 않음'일 경우 관찰 사실만을 다각도로 분석하여 5가지 버전을 만드세요)
4. 글자 수 엄수: 작성되는 5개의 버전은 각각 반드시 입력된 '최소 글자 수' 이상이어야 합니다.
5. 추가 요청 반영: '추가 요청 사항'이 있을 경우 모든 버전에 해당 내용을 자연스럽게 반영하세요.
6. 문체: 학교생활기록부 표준 기재 방식인 객관적이고 명료한 문어체(예: ~함. ~하는 모습이 인상적임. ~하는 역량을 보여줌.)를 사용하세요.

# [출력 형식]
제시한 5가지 버전을 명확히 구분하여 아래와 같은 형식으로 출력해 주세요. (추가적인 인사말 없이 바로 버전 1부터 출력하세요)

[버전 1: (이 버전의 핵심 강조 포인트 짧게 요약)]
(세특 내용 작성 - 최소 글자 수 이상)
- 공백 포함 글자 수: 000자

[버전 2: (이 버전의 핵심 강조 포인트 짧게 요약)]
(세특 내용 작성 - 최소 글자 수 이상)
- 공백 포함 글자 수: 000자

... (버전 5까지 반복)`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (generatedText) {
        setResultText(generatedText);
        showToast("세특 작성이 완료되었습니다!", "success");
      } else {
        throw new Error("결과를 받아오지 못했습니다.");
      }
    } catch (error) {
      console.error(error);
      showAlert("생성 오류", "AI 생성 중 문제가 발생했습니다. API 키나 네트워크 상태를 확인해주세요.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!resultText) return;
    navigator.clipboard.writeText(resultText);
    showToast("결과가 클립보드에 복사되었습니다.", "success");
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 shrink-0">
        <div>
          <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
            <Sparkles className="text-yellow-500" size={28}/> AI 세특 작성 도우미
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">교육과정과 생기부 기재 요령이 반영된 5가지 버전의 세특을 생성합니다.</p>
        </div>
      </div>

      {!apiKey && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold">
            <AlertTriangle size={20} />
            <span>설정에서 API키를 입력해주세요.</span>
          </div>
          <button onClick={() => store.setIsSettingsOpen(true)} className="text-xs bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700 text-red-700 dark:text-red-300 px-3 py-1.5 rounded-lg font-bold transition">설정 열기</button>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden min-h-[600px]">
        
        {/* 좌측: 입력 폼 영역 */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 shrink-0">
            <h3 className="font-bold flex items-center gap-2 text-indigo-700 dark:text-indigo-300"><Edit3 size={18}/> 입력 정보</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5"><Settings size={14}/> 1. 학교급 설정</label>
              <div className="flex gap-2 bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
                {['초등학교', '중학교', '고등학교'].map(level => (
                  <button key={level} onClick={() => setSchoolLevel(level)} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all shadow-sm ${schoolLevel === level ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800'}`}>
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5"><BookOpen size={14}/> 2. 교과목 및 교육과정 내용 (선택)</label>
              <textarea 
                value={achievementStandard} onChange={(e) => setAchievementStandard(e.target.value)} 
                placeholder="예: 역사 - 조선 후기의 정치 변동과 사회 변화를 이해하고..." 
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-20 custom-scrollbar"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <UserCheck size={14}/> 3. 학생 관찰 사실 및 활동 내용 <span className="text-red-500 text-xs">(필수)</span>
              </label>
              <textarea 
                value={observation} onChange={(e) => setObservation(e.target.value)} 
                placeholder="학생이 수업 중 보여준 구체적인 활동, 참여도, 결과물 등을 자유롭게 작성해주세요. (예: 모둠 활동에서 자료 조사를 주도적으로 수행함. 보고서의 완성도가 높음.)" 
                className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-32 custom-scrollbar"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Sparkles size={14}/> 4. 학생 행동 양식 및 특성 <span className="text-gray-400 text-xs font-normal">(선택적 다중 클릭)</span>
              </label>
              {/* 🔥 그리드 레이아웃 적용하여 깔끔하게 정리 */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {Object.entries(CHARACTERISTIC_CATEGORIES).map(([category, tags]) => (
                  <div key={category} className="bg-gray-50 dark:bg-gray-900/50 p-3.5 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div className="text-[11px] font-extrabold text-gray-400 dark:text-gray-500 mb-2.5 px-1 tracking-wider">{category}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map(tag => (
                        <button 
                          key={tag} onClick={() => handleTagToggle(tag)}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition shadow-sm border ${selectedTags.includes(tag) ? 'bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-900/50 dark:text-indigo-300 dark:border-indigo-700' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-700'}`}
                        >
                          {selectedTags.includes(tag) && <CheckCircle2 size={12} className="inline mr-1"/>}{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">5. 최소 글자 수</label>
                <div className="relative">
                  <input type="number" value={minLength} onChange={(e) => setMinLength(Number(e.target.value))} className="w-full p-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"/>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">자</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">6. 추가 요청 사항</label>
                <input type="text" value={additionalRequest} onChange={(e) => setAdditionalRequest(e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"/>
              </div>
            </div>

          </div>

          <div className="p-4 border-t border-gray-100 dark:border-gray-700 shrink-0">
            <button onClick={handleGenerate} disabled={isLoading || !apiKey} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-70">
              {isLoading ? <><Loader className="animate-spin" size={20}/> AI가 5가지 버전을 생성 중입니다...</> : <><Send size={20}/> 세특 생성하기</>}
            </button>
          </div>
        </div>

        {/* 우측: 결과 출력 영역 */}
        <div className="flex-1 bg-gray-900 rounded-2xl shadow-xl border border-gray-700 flex flex-col overflow-hidden relative">
          <div className="p-4 border-b border-gray-700 bg-gray-800 flex justify-between items-center shrink-0">
            <h3 className="font-bold flex items-center gap-2 text-indigo-400"><Sparkles size={18}/> AI 생성 결과</h3>
            {resultText && (
              <button onClick={handleCopy} className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition font-bold">
                <Copy size={14}/> 전체 복사
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-gray-900 text-gray-300">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center text-indigo-400 space-y-4">
                <Loader className="animate-spin" size={40}/>
                <p className="font-bold animate-pulse">학생의 특성을 분석하여 문장을 다듬고 있습니다...</p>
              </div>
            ) : resultText ? (
              <div className="whitespace-pre-wrap leading-relaxed text-sm lg:text-base selection:bg-indigo-500 selection:text-white">
                {resultText}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4 text-center">
                <Edit3 size={48} className="opacity-20"/>
                <p>좌측에 학생의 활동 내용을 입력하고<br/>생성 버튼을 누르면 이곳에 결과가 나타납니다.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}