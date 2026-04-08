import { NEIS_API_KEY } from '../constants/data';

// 1. NEIS 학사일정 가져오기
export const fetchNeisSchedule = async (officeCode, schoolCode, fromDate, toDate) => {
  if (!officeCode || !schoolCode) return [];
  try {
    const url = `https://open.neis.go.kr/hub/SchoolSchedule?KEY=${NEIS_API_KEY}&Type=json&pIndex=1&pSize=100&ATPT_OFCDC_SC_CODE=${officeCode}&SD_SCHUL_CODE=${schoolCode}&AA_FROM_YMD=${fromDate}&AA_TO_YMD=${toDate}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.SchoolSchedule) {
      return data.SchoolSchedule[1].row.map(item => ({
        date: item.AA_YMD, // YYYYMMDD
        name: item.EVENT_NM,
        holiday: item.SBTR_DD_SC_NM !== '해당없음' // 휴업일 여부
      }));
    }
    return [];
  } catch (error) {
    console.error("학사일정 로드 실패:", error);
    return [];
  }
};

// 2. NEIS 반별 시간표 가져오기 (초/중/고 자동 판별)
export const fetchNeisClassTimetable = async (officeCode, schoolCode, schoolName, grade, classNm, dateStr) => {
  if (!officeCode || !schoolCode || !grade || !classNm) return [];
  
  let endpoint = 'misTimetable'; // 기본 중학교
  if (schoolName.includes('초등')) endpoint = 'elsTimetable';
  else if (schoolName.includes('고등')) endpoint = 'hisTimetable';

  try {
    const url = `https://open.neis.go.kr/hub/${endpoint}?KEY=${NEIS_API_KEY}&Type=json&pIndex=1&pSize=20&ATPT_OFCDC_SC_CODE=${officeCode}&SD_SCHUL_CODE=${schoolCode}&GRADE=${grade}&CLASS_NM=${classNm}&TI_FROM_YMD=${dateStr}&TI_TO_YMD=${dateStr}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data[endpoint]) {
      return data[endpoint][1].row.map(item => ({
        period: item.PERIO,
        subject: item.ITRT_CNTNT
      })).sort((a, b) => a.period - b.period);
    }
    return [];
  } catch (error) {
    console.error("시간표 로드 실패:", error);
    return [];
  }
};