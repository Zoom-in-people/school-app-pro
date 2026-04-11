import React, { useState, useEffect } from 'react';
import { CloudRain, Sun, Cloud, Snowflake, Loader, ExternalLink } from 'lucide-react';
import { OFFICE_CODES } from '../../constants/data';

const REGION_COORDS = {
  [OFFICE_CODES.SEOUL]: { name: "서울", lat: 37.5665, lon: 126.9780 },
  [OFFICE_CODES.BUSAN]: { name: "부산", lat: 35.1796, lon: 129.0756 },
  [OFFICE_CODES.DAEGU]: { name: "대구", lat: 35.8714, lon: 128.6014 },
  [OFFICE_CODES.INCHEON]: { name: "인천", lat: 37.4563, lon: 126.7052 },
  [OFFICE_CODES.GWANGJU]: { name: "광주", lat: 35.1595, lon: 126.8526 },
  [OFFICE_CODES.DAEJEON]: { name: "대전", lat: 36.3504, lon: 127.3845 },
  [OFFICE_CODES.ULSAN]: { name: "울산", lat: 35.5384, lon: 129.3114 },
  [OFFICE_CODES.SEJONG]: { name: "세종", lat: 36.4800, lon: 127.2890 },
  [OFFICE_CODES.GYEONGGI]: { name: "경기", lat: 37.2636, lon: 127.0286 },
  [OFFICE_CODES.GANGWON]: { name: "강원", lat: 37.8854, lon: 127.7298 },
  [OFFICE_CODES.CHUNGBUK]: { name: "충북", lat: 36.6358, lon: 127.4912 },
  [OFFICE_CODES.CHUNGNAM]: { name: "충남", lat: 36.6588, lon: 126.6728 },
  [OFFICE_CODES.JEONBUK]: { name: "전북", lat: 35.8205, lon: 127.1086 },
  [OFFICE_CODES.JEONNAM]: { name: "전남", lat: 34.8161, lon: 126.4629 },
  [OFFICE_CODES.GYEONGBUK]: { name: "경북", lat: 36.5760, lon: 128.5056 },
  [OFFICE_CODES.GYEONGNAM]: { name: "경남", lat: 35.2383, lon: 128.6922 },
  [OFFICE_CODES.JEJU]: { name: "제주", lat: 33.4890, lon: 126.4983 },
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
      let name = "우리 동네";
      let googleQuery = "현재 날씨";

      if (schoolInfo?.address) {
        try {
          const addressParts = schoolInfo.address.split(' ');
          const sido = addressParts[0] || '';
          const sigungu = addressParts[1] || ''; // 보통 두 번째 단어가 시/군/구에 해당함
          
          name = sigungu || sido;
          googleQuery = `${sido} ${sigungu} 날씨`.trim();

          // 1순위: 가장 대중적이고 정확한 OpenStreetMap (Nominatim) API로 "도 + 시" 검색
          const query = `${sido} ${sigungu}`.trim();
          const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
          const nomData = await nomRes.json();
          
          if (nomData && nomData.length > 0) {
            lat = nomData[0].lat;
            lon = nomData[0].lon;
          } else {
            // 2순위: 1순위 실패 시 시/군/구 만으로 2차 검색 시도
            const nomRes2 = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(sigungu)}`);
            const nomData2 = await nomRes2.json();
            if (nomData2 && nomData2.length > 0) {
              lat = nomData2[0].lat;
              lon = nomData2[0].lon;
            }
          }
        } catch (e) { console.error("Geocoding failed", e); }
      }

      // 검색 실패 시 교육청 기준 지역으로 최후의 Fallback (제주 등 오류 방지 위해 명시적으로 서울 대체 적용)
      if (!lat || !lon) {
        const fallbackRegion = REGION_COORDS[schoolInfo?.officeCode] || REGION_COORDS[OFFICE_CODES.SEOUL];
        lat = fallbackRegion.lat;
        lon = fallbackRegion.lon;
        name = fallbackRegion.name;
        googleQuery = `${fallbackRegion.name} 날씨`;
      }

      setLocationName(name);
      setSearchQueryForGoogle(googleQuery);

      try {
        // 🔥 오늘 날씨 + 7일간의 날씨(daily) 파라미터 함께 요청
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`);
        const data = await res.json();
        setWeather(data.current_weather);
        setDailyForecast(data.daily);
      } catch (e) { console.error("날씨 로드 실패"); }
      
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
        <>
          {/* 상단 현재 날씨 (기존 레이아웃) */}
          <div className="flex flex-col items-center gap-2 mb-3 shrink-0">
            {getWeatherIcon(weather.weathercode, 48)}
            <div className="text-center mt-1">
              <div className="text-3xl font-black drop-shadow-sm">{Math.round(weather.temperature)}°C</div>
              <div className="text-sm font-medium opacity-90 truncate max-w-[150px]">{locationName} · {getDesc(weather.weathercode)}</div>
            </div>
          </div>

          {/* 하단 7일 주간 예보 (가로 스크롤 카드) */}
          {dailyForecast && dailyForecast.time && (
            <div className="flex-1 overflow-x-auto custom-scrollbar flex gap-2 pb-1 items-center">
              {dailyForecast.time.map((date, i) => (
                <div key={date} className="flex flex-col items-center bg-black/10 rounded-lg p-2 min-w-[50px] shrink-0 hover:bg-black/20 transition cursor-default">
                  <span className={`text-[10px] font-bold mb-1 ${i === 0 ? 'text-yellow-300' : 'text-white/90'}`}>
                    {getDayName(date, i)}
                  </span>
                  {getWeatherIcon(dailyForecast.weathercode[i], 20, "mb-1")}
                  <div className="text-[9px] font-bold flex gap-1">
                    <span className="text-red-200" title="최고 기온">{Math.round(dailyForecast.temperature_2m_max[i])}°</span>
                    <span className="text-blue-200" title="최저 기온">{Math.round(dailyForecast.temperature_2m_min[i])}°</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 구글 검색 버튼 */}
          <a href={`https://www.google.com/search?q=${searchQueryForGoogle}`} target="_blank" rel="noreferrer" className="absolute top-3 right-3 text-[10px] bg-black/20 hover:bg-black/40 px-2 py-1 rounded-md transition flex items-center gap-1 opacity-0 group-hover:opacity-100 font-bold">
            구글 날씨 <ExternalLink size={10}/>
          </a>
        </>
      ) : <div className="flex-1 flex justify-center items-center"><span className="text-sm font-bold opacity-80">날씨 정보 오류</span></div>}
    </div>
  );
}