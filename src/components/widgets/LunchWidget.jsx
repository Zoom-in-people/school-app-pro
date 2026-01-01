import React, { useState, useEffect } from 'react';
import { Utensils } from 'lucide-react';
import { NEIS_API_KEY } from '../../constants/data'; // 경로 주의

export default function LunchWidget({ schoolInfo }) {
  const [lunchData, setLunchData] = useState({ today: null, tomorrow: null });
  const [loading, setLoading] = useState(false);
  
  const getFormatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
  };

  useEffect(() => {
    if (!schoolInfo.code || !schoolInfo.officeCode) return;

    const fetchLunch = async () => {
      setLoading(true);
      try {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const fromDate = getFormatDate(today);
        const toDate = getFormatDate(tomorrow);

        const url = `https://open.neis.go.kr/hub/mealServiceDietInfo?KEY=${NEIS_API_KEY}&Type=json&ATPT_OFCDC_SC_CODE=${schoolInfo.officeCode}&SD_SCHUL_CODE=${schoolInfo.code}&MLSV_FROM_YMD=${fromDate}&MLSV_TO_YMD=${toDate}`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (data.mealServiceDietInfo) {
          const rows = data.mealServiceDietInfo[1].row;
          const todayMeal = rows.find(r => r.MLSV_YMD === fromDate);
          const tomorrowMeal = rows.find(r => r.MLSV_YMD === toDate);
          
          setLunchData({
            today: todayMeal ? todayMeal.DDISH_NM.replace(/<br\/>/g, "\n") : null,
            tomorrow: tomorrowMeal ? tomorrowMeal.DDISH_NM.replace(/<br\/>/g, "\n") : null
          });
        } else {
          setLunchData({ today: null, tomorrow: null });
        }
      } catch (err) {
        console.error(err);
        setLunchData({ today: null, tomorrow: null });
      } finally {
        setLoading(false);
      }
    };

    fetchLunch();
  }, [schoolInfo]);

  return (
    <div className="bg-orange-50 dark:bg-gray-800 rounded-xl shadow-sm border border-orange-200 dark:border-gray-700 p-5 h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-3 text-orange-700 dark:text-orange-400 font-bold">
        <div className="flex items-center gap-2"><Utensils size={18}/> 오늘의 급식</div>
        {loading && <span className="text-xs animate-spin">⌛</span>}
      </div>
      
      {!schoolInfo.code ? (
        <div className="flex-1 flex items-center justify-center text-xs text-gray-400">설정에서 학교를 선택해주세요</div>
      ) : (
        <div className="flex-1 flex gap-4 overflow-hidden h-full">
          <div className="flex-1 bg-white dark:bg-gray-700 p-3 rounded-lg shadow-sm border border-orange-100 dark:border-gray-600 flex flex-col overflow-hidden">
            <div className="text-xs font-bold text-orange-600 dark:text-orange-300 mb-2 flex items-center gap-1 shrink-0">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              오늘 ({new Date().getMonth()+1}/{new Date().getDate()})
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-orange-200">
              {lunchData.today ? (
                <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 leading-relaxed text-xs">{lunchData.today}</div>
              ) : <span className="text-gray-400 text-xs">급식 정보가 없습니다.</span>}
            </div>
          </div>
          <div className="flex-1 bg-white/50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-600 flex flex-col overflow-hidden">
            <div className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1 shrink-0">
              <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
              내일
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
              {lunchData.tomorrow ? (
                <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed text-xs">{lunchData.tomorrow}</div>
              ) : <span className="text-gray-400 text-xs">급식 정보가 없습니다.</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}