import React, { useState, useEffect } from 'react';
import { CloudRain, Sun, Cloud, Snowflake, Loader, ExternalLink } from 'lucide-react';

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
      let displayName = "우리 동네";
      let googleQuery = "현재 날씨";

      if (schoolInfo?.address) {
        try {
          let targetArea = "";
          if (schoolInfo.address.includes('세종')) {
            targetArea = '세종특별자치시';
          } else {
            const match = schoolInfo.address.match(/\S+(시|군)\b/) || schoolInfo.address.match(/\S+구\b/);
            if (match) targetArea = match[0];
          }

          if (targetArea) {
            displayName = targetArea;
            googleQuery = `${targetArea} 날씨`;
            const cleanName = targetArea.replace(/[시군구]$/, '');

            const meteoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanName)}&language=ko&count=5`);
            const meteoData = await meteoRes.json();
            
            if (meteoData.results && meteoData.results.length > 0) {
              const krResult = meteoData.results.find(r => r.country_code === 'KR') || meteoData.results[0];
              if (krResult) {
                lat = krResult.latitude; lon = krResult.longitude;
              }
            }

            if (!lat || !lon) {
              const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(targetArea + " 대한민국")}`);
              const nomData = await nomRes.json();
              if (nomData && nomData.length > 0) {
                lat = nomData[0].lat; lon = nomData[0].lon;
              }
            }
          }
        } catch (e) { console.error("Geocoding fetch failed", e); }
      }

      if (!lat || !lon) {
        const fallbackRegion = REGION_COORDS[schoolInfo?.officeCode] || REGION_COORDS['B10'];
        lat = fallbackRegion.lat;
        lon = fallbackRegion.lon;
        displayName = fallbackRegion.name;
        googleQuery = `${fallbackRegion.name} 날씨`;
      }

      setLocationName(displayName);
      setSearchQueryForGoogle(googleQuery);

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
    <div className="h-full flex flex-col p-3 bg-gradient-to-br from-sky-400 to-blue-600 text-white relative group overflow-hidden">
      {loading ? (
        <div className="flex-1 flex justify-center items-center"><Loader className="animate-spin text-white/50" size={32}/></div>
      ) : weather ? (
        <div className="flex flex-col h-full justify-between">
          
          {/* 🔥 실시간 날씨 공간 최적화: 세로 배치 -> 가로 배치로 변경, 크기 축소 */}
          <div className="flex flex-1 items-center justify-center gap-3 sm:gap-4 shrink-0">
            {getWeatherIcon(weather.weathercode, 40, "shrink-0")}
            <div className="flex flex-col justify-center text-left">
              <div className="text-2xl sm:text-3xl font-black drop-shadow-sm leading-none tracking-tighter">
                {Math.round(weather.temperature)}°C
              </div>
              <div className="text-[11px] sm:text-xs font-bold opacity-90 truncate max-w-[120px] sm:max-w-[160px] mt-1">
                {locationName} · {getDesc(weather.weathercode)}
              </div>
            </div>
          </div>
          
          {/* 🔥 주간 예보 UI 개선: 좁은 영역에서도 안 깨지게 상단 구분선 추가 및 여백 최소화 */}
          {dailyForecast && dailyForecast.time && (
            <div className="w-full flex justify-between items-center shrink-0 border-t border-white/20 pt-2 mt-1">
              {dailyForecast.time.slice(0, 7).map((date, i) => (
                <div key={date} className="flex flex-col items-center bg-black/10 rounded-lg py-1 px-0.5 sm:px-1 hover:bg-black/20 transition cursor-default flex-1 mx-[1px] min-w-0">
                  <span className={`text-[8px] sm:text-[9px] font-extrabold mb-0.5 sm:mb-1 ${i === 0 ? 'text-yellow-300' : 'text-white/95'}`}>
                    {getDayName(date, i)}
                  </span>
                  {getWeatherIcon(dailyForecast.weathercode[i], 16, "mb-0.5 sm:mb-1")}
                  <div className="text-[7px] sm:text-[8px] font-bold flex flex-col items-center leading-tight">
                    <span className="text-red-200" title="최고 기온">{Math.round(dailyForecast.temperature_2m_max[i])}°</span>
                    <span className="text-blue-200" title="최저 기온">{Math.round(dailyForecast.temperature_2m_min[i])}°</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 구글 검색 버튼 위치 및 크기 최적화 */}
          <a href={`https://www.google.com/search?q=${searchQueryForGoogle}`} target="_blank" rel="noreferrer" className="absolute top-2 right-2 text-[9px] sm:text-[10px] bg-black/20 hover:bg-black/40 px-1.5 py-1 rounded transition flex items-center gap-1 opacity-0 group-hover:opacity-100 font-bold shadow-sm z-10">
            구글 날씨 <ExternalLink size={10}/>
          </a>
        </div>
      ) : (
        <div className="flex-1 flex justify-center items-center"><span className="text-sm font-bold opacity-80">날씨 정보 오류</span></div>
      )}
    </div>
  );
}