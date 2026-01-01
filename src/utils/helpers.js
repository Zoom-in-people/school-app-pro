// src/utils/helpers.js

export const getFormatDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
};

export const downloadTemplate = (students, isHomeroomView) => {
  const BOM = '\uFEFF'; 
  let header = "";
  
  if (isHomeroomView) {
    // 담임용: 자율활동, 특기사항, 누적메모 추가
    header = "학년,반,번호,성명,연락처,보호자연락처,주소,특성태그(쉼표구분),자율활동,특기사항,누적메모(줄바꿈구분)\n";
  } else {
    // 수업용
    header = "학년,반,번호,성명,특성태그(쉼표구분),자율활동,특이사항,AI세특\n";
  }
  
  const rows = students.map(s => {
    const escapeCsv = (str) => str ? `"${String(str).replace(/"/g, '""')}"` : "";
    
    const tags = s.tags ? escapeCsv(s.tags.join(",")) : "";
    const name = escapeCsv(s.name);
    const autoText = escapeCsv(s.autoActivity);
    const uniqText = escapeCsv(s.uniqueness);
    const aiText = escapeCsv(s.aiGeneratedText);
    const phone = escapeCsv(s.phone);
    const parentPhone = escapeCsv(s.parentPhone);
    const address = escapeCsv(s.address);

    // 메모 배열을 문자열로 변환 ([날짜] 내용)
    const memoStr = s.memos 
      ? s.memos.map(m => `[${m.date}] ${m.content}`).join("\n") 
      : "";
    const memoEscaped = escapeCsv(memoStr);

    if (isHomeroomView) {
      return `${s.grade},${s.class},${s.number},${name},${phone},${parentPhone},${address},${tags},${autoText},${uniqText},${memoEscaped}`;
    } else {
      return `${s.grade},${s.class},${s.number},${name},${tags},${autoText},${uniqText},${aiText}`;
    }
  }).join("\n");

  const blob = new Blob([BOM + header + rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  const fileName = isHomeroomView ? "학생명부_담임용.csv" : "학생명부_수업용.csv";
  link.download = fileName;
  link.click();
};