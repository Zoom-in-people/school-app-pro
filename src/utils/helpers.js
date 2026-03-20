import * as XLSX from 'xlsx'; // 🔥 1번 요청 해결: csv 텍스트가 아닌 실제 엑셀 라이브러리 사용

export const getFormatDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
};

export const downloadTemplate = (students, isHomeroomView) => {
  let aoa = []; // 엑셀에 들어갈 2차원 배열 데이터
  
  if (isHomeroomView) {
    aoa.push(["학년", "반", "번호", "성명", "연락처", "보호자연락처", "주소", "특성태그(쉼표구분)", "자율활동", "특기사항", "누적메모(줄바꿈구분)"]);
  } else {
    aoa.push(["학년", "반", "번호", "성명", "특성태그(쉼표구분)", "자율활동", "특이사항", "AI세특"]);
  }
  
  students.forEach(s => {
    const tags = s.tags ? s.tags.join(", ") : "";
    const memos = s.memos ? s.memos.map(m => `[${m.date}] ${m.content}`).join("\n") : "";
    
    if (isHomeroomView) {
      aoa.push([s.grade, s.class, s.number, s.name, s.phone, s.parentPhone, s.address, tags, s.autoActivity, s.uniqueness, memos]);
    } else {
      aoa.push([s.grade, s.class, s.number, s.name, tags, s.autoActivity, s.uniqueness, s.aiGeneratedText]);
    }
  });

  // 엑셀 워크북 생성 및 파일 쓰기
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "학생명부");
  
  const fileName = isHomeroomView ? "학생명부_담임용.xlsx" : "학생명부_수업용.xlsx";
  XLSX.writeFile(wb, fileName);
};
