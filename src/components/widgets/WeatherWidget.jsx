import React, { useState, useEffect } from 'react';
import { CloudRain, Sun, Cloud, Snowflake, Loader, ExternalLink } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

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
  const { weatherCache, setWeatherCache } = useAppStore();
  const [weather, setWeather] = useState(null);
  const [aq, setAq] = useState(null);
  const [dailyForecast, setDailyForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationName, setLocationName] = useState("");
  const [searchQueryForGoogle, setSearchQueryForGoogle] = useState("");
  const [now, setNow] = useState(new Date());

  // 1초마다 시계 렌더링
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchAllData = async () => {
      // 🔥 캐시 확인: 30분 이내에 로딩한 데이터면 API 호출을 생략하고 즉시 화면에 뿌립니다.
      const nowTime = Date.now();
      if (weatherCache && weatherCache.schoolCode === schoolInfo?.code && (nowTime - weatherCache.timestamp < 1800000)) {
        setWeather(weatherCache.weather);
        setAq(weatherCache.aq);
        setDailyForecast(weatherCache.daily);
        setLocationName(weatherCache.locationName);
        setSearchQueryForGoogle(weatherCache.searchQuery);
        setLoading(false);
        return;
      }

      setLoading(true);
      let lat, lon;
      let displayName = "우리 동네";
      let googleQuery = "현재 날씨";
      
      let targetAddress = schoolInfo?.address;
      if (!targetAddress && schoolInfo?.officeCode && schoolInfo?.code) {
        try {
          const neisRes = await fetch(`https://open.neis.go.kr/hub/schoolInfo?Type=json&ATPT_OFCDC_SC_CODE=${schoolInfo.officeCode}&SD_SCHUL_CODE=${schoolInfo.code}`);
          const neisData = await neisRes.json();
          if (neisData.schoolInfo) targetAddress = neisData.schoolInfo[1].row[0].ORG_RDNMA; 
        } catch (e) { console.error(e); }
      }

      if (targetAddress) {
        try {
          let targetArea = "";
          if (targetAddress.includes('세종')) targetArea = '세종특별자치시';
          else {
            const match = targetAddress.match(/([가-힣]+(?:시|군|구))\b/);
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
              if (krResult) { lat = krResult.latitude; lon = krResult.longitude; }
            }

            if (!lat || !lon) {
              const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(targetArea + " 대한민국")}`);
              const nomData = await nomRes.json();
              if (nomData && nomData.length > 0) { lat = nomData[0].lat; lon = nomData[0].lon; }
            }
          }
        } catch (e) { console.error("Geocoding failed", e); }
      }

      if (!lat || !lon) {
        const fallbackRegion = REGION_COORDS[schoolInfo?.officeCode] || REGION_COORDS['B10'];
        lat = fallbackRegion.lat; lon = fallbackRegion.lon; displayName = fallbackRegion.name;
        googleQuery = `${fallbackRegion.name} 날씨`;
      }

      try {
        // 🔥 날씨, 주간예보, 습도를 한 방에 가져옵니다.
        const resW = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`);
        const dataW = await resW.json();
        
        // 대기질(미세먼지, 초미세먼지) 가져오기
        const resA = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5&timezone=auto`);
        const dataA = await resA.json();

        // 상태 업데이트 및 캐시에 저장
        setWeather(dataW.current);
        setDailyForecast(dataW.daily);
        setAq(dataA.current);
        setLocationName(displayName);
        setSearchQueryForGoogle(googleQuery);

        setWeatherCache({
          schoolCode: schoolInfo?.code,
          timestamp: Date.now(),
          weather: dataW.current,
          daily: dataW.daily,
          aq: dataA.current,
          locationName: displayName,
          searchQuery: googleQuery
        });

      } catch (e) { console.error("API 호출 실패", e); }
      
      setLoading(false);
    };
    
    fetchAllData();
  }, [schoolInfo, weatherCache, setWeatherCache]);

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

  const getAQString = (val, type) => {
    if (val === undefined || val === null) return { text: "-", color: "text-gray-400" };
    if (type === 'pm10') {
      if (val <= 30) return { text: "좋음", color: "text-blue-300" };
      if (val <= 80) return { text: "보통", color: "text-green-300" };
      if (val <= 150) return { text: "나쁨", color: "text-yellow-300" };
      return { text: "매우나쁨", color: "text-red-300" };
    } else {
      if (val <= 15) return { text: "좋음", color: "text-blue-300" };
      if (val <= 35) return { text: "보통", color: "text-green-300" };
      if (val <= 75) return { text: "나쁨", color: "text-yellow-300" };
      return { text: "매우나쁨", color: "text-red-300" };
    }
  };

  const getDayName = (dateStr, index) => {
    if (index === 0) return '오늘';
    const d = new Date(dateStr);
    return ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
  };

  const timeStr = now.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });

  return (
    <div className="h-full flex flex-col p-2 bg-gradient-to-br from-sky-400 to-blue-600 text-white relative group overflow-hidden select-none">
      {loading && !weather ? (
        <div className="flex-1 flex justify-center items-center"><Loader className="animate-spin text-white/50" size={32}/></div>
      ) : weather && aq ? (
        <div className="flex flex-col h-full justify-between">
          
          {/* 1. 상단: 날짜/시간 & 구글링크 */}
          <div className="flex justify-between items-center shrink-0 mb-0.5 px-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold opacity-90">{dateStr}</span>
              <span className="text-sm font-black tracking-widest font-mono">{timeStr}</span>
            </div>
            <div className="flex items-center gap-1 z-10">
              <span className="text-[10px] font-bold text-white/90">{locationName}</span>
              <a href={`https://www.google.com/search?q=${searchQueryForGoogle}`} target="_blank" rel="noreferrer" className="opacity-0 group-hover:opacity-100 hover:text-yellow-200 transition" title="구글 날씨 검색">
                <ExternalLink size={12}/>
              </a>
            </div>
          </div>

          {/* 2. 중단: 실시간 온도/날씨 + 미세먼지/습도 팩 (오밀조밀하게!) */}
          <div className="flex flex-1 items-center justify-between gap-1 px-1">
            {/* 좌측: 메인 날씨 */}
            <div className="flex items-center gap-1.5">
              {getWeatherIcon(weather.weather_code, 36, "shrink-0")}
              <div className="flex flex-col text-left">
                <div className="text-2xl font-black leading-none tracking-tighter">
                  {Math.round(weather.temperature_2m)}°C
                </div>
                <div className="text-[9px] font-bold opacity-90 mt-0.5">
                  {getDesc(weather.weather_code)}
                </div>
              </div>
            </div>
            
            {/* 우측: 습도 및 대기질 인포박스 */}
            <div className="flex flex-col gap-0.5 text-[9px] font-bold bg-black/15 p-1.5 rounded-lg shrink-0 w-24">
              <div className="flex justify-between">
                <span className="text-white/70">습도</span>
                <span>{weather.relative_humidity_2m}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">미세</span>
                <span className={getAQString(aq.pm10, 'pm10').color}>{getAQString(aq.pm10, 'pm10').text}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">초미세</span>
                <span className={getAQString(aq.pm2_5, 'pm25').color}>{getAQString(aq.pm2_5, 'pm25').text}</span>
              </div>
            </div>
          </div>

          {/* 3. 하단: 7일 주간 예보 가로 팩 */}
          {dailyForecast && dailyForecast.time && (
            <div className="flex justify-between items-center border-t border-white/20 pt-1 shrink-0 mt-0.5">
              {dailyForecast.time.slice(0, 7).map((date, i) => (
                <div key={date} className="flex flex-col items-center bg-black/10 rounded py-0.5 px-0.5 sm:px-1 hover:bg-black/20 transition flex-1 mx-[1px] min-w-0">
                  <span className={`text-[8px] sm:text-[9px] font-extrabold mb-0.5 ${i === 0 ? 'text-yellow-300' : 'text-white/90'}`}>
                    {getDayName(date, i)}
                  </span>
                  {getWeatherIcon(dailyForecast.weathercode[i], 14, "mb-0.5")}
                  <div className="text-[7px] sm:text-[8px] font-bold flex flex-col items-center leading-none">
                    <span className="text-red-200">{Math.round(dailyForecast.temperature_2m_max[i])}°</span>
                    <span className="text-blue-200">{Math.round(dailyForecast.temperature_2m_min[i])}°</span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      ) : (
        <div className="flex-1 flex justify-center items-center"><span className="text-sm font-bold opacity-80">오류 발생</span></div>
      )}
    </div>
  );
}