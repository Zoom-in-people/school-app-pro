import React, { useState, useEffect } from 'react';
import { CloudRain, Sun, Cloud, Snowflake, Loader, ExternalLink } from 'lucide-react';

// 최후의 안전장치 (좌표용으로만 사용됨)
const REGION_COORDS = {
  'B10': { name: "서울", lat: 37.5665, lon: 126.9780 },
  'C10': { name: "부산", lat: 35.1796, lon: 129.0756 },
  'D10': { name: "대구", lat: 35.8714, lon: 128.6014 },
  'E10': { name: "인천", lat: 37.4563, lon: 126.7052 },
  'F10': { name: "광주", lat: 35.1595, lon: 126.8526 },
  'G10': { name: "대전", lat: 36.3504, lon: 127.3845 },
  'H10': { name: "울산", lat: 35.5384, lon: 129.3114 },
  'I10': { name: "세종", lat: 36.4800, lon: 127.2890 },
  'J10': { name: "경기", lat: 37.2636, lon: 127.0286 },
  'K10': { name: "강원", lat: 37.8854, lon: 127.7298 },
  'M10': { name: "충북", lat: 36.6358, lon: 127.4912 },
  'N10': { name: "충남", lat: 36.6588, lon: 126.6728 },
  'P10': { name: "전북", lat: 35.8205, lon: 127.1086 },
  'Q10': { name: "전남", lat: 34.8161, lon: 126.4629 },
  'R10': { name: "경북", lat: 36.5760, lon: 128.5056 },
  'S10': { name: "경남", lat: 35.2383, lon: 128.6922 },
  'T10': { name: "제주", lat: 33.4890, lon: 126.4983 },
};

export default function WeatherWidget({ schoolInfo }) {
  const [weather, setWeather] = useState(null);
  const [dailyForecast, setDailyForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationName, setLocationName] = useState("");
  const [searchQueryForGoogle, setSearchQueryForGoogle] = useState("");

  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      let lat, lon;
      
      // 🔥 선생님 요청 반영: 위젯에 표시되는 이름과 구글 검색어는 무조건 '학교명'으로 고정!
      const displayName = schoolInfo?.name || "우리 동네";
      const googleQuery = `${schoolInfo?.name || '우리 동네'} 날씨`;

      setLocationName(displayName);
      setSearchQueryForGoogle(googleQuery);

      // 1. NEIS API에서 학교 상세 주소 획득 시도 (주소가 DB에 없는 경우 대비)
      let targetAddress = schoolInfo?.address;
      if (!targetAddress && schoolInfo?.officeCode && schoolInfo?.code) {
        try {
          const neisRes = await fetch(`https://open.neis.go.kr/hub/schoolInfo?Type=json&ATPT_OFCDC_SC_CODE=${schoolInfo.officeCode}&SD_SCHUL_CODE=${schoolInfo.code}`);
          const neisData = await neisRes.json();
          if (neisData.schoolInfo) {
            targetAddress = neisData.schoolInfo[1].row[0].ORG_RDNMA;
          }
        } catch (e) { console.error("NEIS Fetch Failed", e); }
      }

      // 2. 위도/경도 찾기
      try {
        // 1순위: 학교 이름으로 핀포인트 검색 시도 (예: "ㅇㅇ초등학교 대한민국")
        if (schoolInfo?.name) {
          const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(schoolInfo.name + " 대한민국")}`);
          const nomData = await nomRes.json();
          if (nomData && nomData.length > 0) {
            lat = nomData[0].lat;
            lon = nomData[0].lon;
          }
        }

        // 2순위: 학교명으로 못 찾았다면, 주소에서 시/군/구 만 추출해서 재검색
        if ((!lat || !lon) && targetAddress) {
          const match = targetAddress.match(/([가-힣]+(?:시|군|구))\b/);
          if (match) {
            const sigungu = match[0];
            const cleanName = sigungu.replace(/[시군구]$/, '');

            const meteoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanName)}&language=ko&count=5`);
            const meteoData = await meteoRes.json();
            
            if (meteoData.results && meteoData.results.length > 0) {
              const krResult = meteoData.results.find(r => r.country_code === 'KR') || meteoData.results[0];
              if (krResult) {
                lat = krResult.latitude;
                lon = krResult.longitude;
              }
            }

            if (!lat || !lon) {
              const nomRes2 = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(sigungu + " 대한민국")}`);
              const nomData2 = await nomRes2.json();
              if (nomData2 && nomData2.length > 0) {
                lat = nomData2[0].lat;
                lon = nomData2[0].lon;
              }
            }
          }
        }
      } catch (e) { console.error("Geocoding failed", e); }

      // 3. 모든 주소/학교명 검색이 실패했을 경우, 최후의 수단으로 좌표만 기본값(교육청 위치) 사용. 
      // ⚠️ 과거 버그 해결: 여기서 화면 표시 이름(displayName)은 절대 덮어쓰지 않습니다!
      if (!lat || !lon) {
        const fallbackRegion = REGION_COORDS[schoolInfo?.officeCode] || REGION_COORDS['B10'];
        lat = fallbackRegion.lat;
        lon = fallbackRegion.lon;
      }

      // 4. 확보된 좌표로 최종 날씨 호출
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`);
        const data = await res.json();
        setWeather(data.current_weather);
        setDailyForecast(data.daily);
      } catch (e) { console.error("날씨 API 호출 실패", e); }
      
      setLoading(false);
    };
    
    fetchWeather();
  }, [schoolInfo]);

  const getWeatherIcon = (code, size = 48, className = "") => {
    if (code <= 3) return <Sun size={size} className={`text-yellow-400 drop-shadow-md ${className}`} />;
    if (code <= 48) return <Cloud size={size} className={`text-gray-200 drop-shadow-md ${className}`} />;
    if (code <= 67 || (code >= 80 && code <= 82)) return <CloudRain size={size} className={`text-blue-200 drop-shadow-md ${className}`} />;
    return <Snowflake size={size} className={`text-cyan-100 drop-shadow-md ${className}`} />;
  };

  const getDesc = (code) => {
    if (code <= 3) return "맑음"; if (code <= 48) return "구름/흐림";
    if (code <= 67 || (code >= 80 && code <= 82)) return "비"; return "눈";
  };

  const getDayName = (dateStr, index) => {
    if (index === 0) return '오늘';
    const d = new Date(dateStr);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return days[d.getDay()];
  };

  return (
    <div className="h-full flex flex-col p-4 bg-gradient-to-br from-sky-400 to-blue-600 text-white relative group overflow-hidden">
      {loading ? <div className="flex-1 flex justify-center items-center"><Loader className="animate-spin text-white/50" size={32}/></div> : weather ? (
        <div className="flex flex-col h-full justify-between">
          <div className="flex flex-col items-center gap-1 mb-2 shrink-0">
            {getWeatherIcon(weather.weathercode, 44)}
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-black drop-shadow-sm">{Math.round(weather.temperature)}°C</div>
              <div className="text-xs sm:text-sm font-medium opacity-90 truncate px-2">{locationName} · {getDesc(weather.weathercode)}</div>
            </div>
          </div>
          {dailyForecast && dailyForecast.time && (
            <div className="w-full flex justify-between items-center mt-auto pb-1 px-1">
              {dailyForecast.time.slice(0, 7).map((date, i) => (
                <div key={date} className="flex flex-col items-center bg-black/10 rounded-lg py-1.5 px-1 sm:px-2 hover:bg-black/20 transition cursor-default">
                  <span className={`text-[9px] sm:text-[10px] font-extrabold mb-1 ${i === 0 ? 'text-yellow-300' : 'text-white/90'}`}>
                    {getDayName(date, i)}
                  </span>
                  {getWeatherIcon(dailyForecast.weathercode[i], 18, "mb-1")}
                  <div className="text-[8px] sm:text-[9px] font-bold flex flex-col sm:flex-row gap-0.5 sm:gap-1 text-center">
                    <span className="text-red-200" title="최고 기온">{Math.round(dailyForecast.temperature_2m_max[i])}°</span>
                    <span className="text-blue-200" title="최저 기온">{Math.round(dailyForecast.temperature_2m_min[i])}°</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <a href={`https://www.google.com/search?q=${searchQueryForGoogle}`} target="_blank" rel="noreferrer" className="absolute top-3 right-3 text-[10px] bg-black/20 hover:bg-black/40 px-2 py-1 rounded-md transition flex items-center gap-1 opacity-0 group-hover:opacity-100 font-bold shadow-sm">
            구글 날씨 <ExternalLink size={10}/>
          </a>
        </div>
      ) : <div className="flex-1 flex justify-center items-center"><span className="text-sm font-bold opacity-80">날씨 정보 오류</span></div>}
    </div>
  );
}