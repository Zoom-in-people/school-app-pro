// src/constants/data.js

export const NEIS_API_KEY = "3461dc5d8b8143c288bffe77e79560e6";

export const OFFICE_CODES = {
  "서울특별시교육청": "B10", "부산광역시교육청": "C10", "대구광역시교육청": "D10", "인천광역시교육청": "E10", "광주광역시교육청": "F10",
  "대전광역시교육청": "G10", "울산광역시교육청": "H10", "세종특별자치시교육청": "I10", "경기도교육청": "J10", "강원도교육청": "K10",
  "충청북도교육청": "M10", "충청남도교육청": "N10", "전라북도교육청": "P10", "전라남도교육청": "Q10", "경상북도교육청": "R10",
  "경상남도교육청": "S10", "제주특별자치도교육청": "T10"
};
export const OFFICES_OF_EDUCATION = Object.keys(OFFICE_CODES);

// 초기 위젯 배치 (수정됨: 1열 배치)
export const INITIAL_WIDGETS = [
  // 1. 급식 (3칸)
  { id: 'lunch', type: 'lunch', x: 0, y: 0, w: 3, h: 3 },
  // 2. 업무 (2칸 - 줄임)
  { id: 'deadline', type: 'deadline', x: 3, y: 0, w: 2, h: 3 },
  // 3. 시간표 (2칸)
  { id: 'lesson', type: 'lesson', x: 5, y: 0, w: 2, h: 3 },
  // 4. 출결 (3칸 - 줄임 & 1열로 이동)
  { id: 'student', type: 'student', x: 7, y: 0, w: 3, h: 3 },
  
  // 2열: 진도 (12칸 - 전체)
  { id: 'progress', type: 'progress', x: 0, y: 3, w: 12, h: 4 }
];

// ... (아래 Mock Data는 기존 내용 그대로 유지하세요) ...
export const INITIAL_STUDENTS = [
  { id: 1, grade: "3", class: "1", number: 1, name: "김철수", gender: "M", phone: "010-1234-5678", parentPhone: "010-9999-8888", address: "서울시 강남구", tags: ["과학탐구", "리더십"], aiGeneratedText: "", autoActivity: "학급 회장으로서...", uniqueness: "감기 기운 있음" },
  // ... 기존 데이터 유지
];

export const INITIAL_TODOS = [
  { id: 1, title: "수학여행 가정통신문 취합", dueDate: "2026-03-15", priority: "high", done: false, category: "행정" },
  { id: 2, title: "과학의 달 행사 계획안 상신", dueDate: "2026-03-20", priority: "medium", done: false, category: "행사" },
];

export const INITIAL_MATERIALS = [];
export const INITIAL_LESSONS = [];
export const INITIAL_CONSULTATIONS = [];