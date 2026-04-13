import React, { useState, useEffect } from 'react';
import { CloudRain, Sun, Cloud, Snowflake, Loader } from 'lucide-react';

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
  const [aq, setAq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationName, setLocationName] = useState("");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      let lat, lon;
      let displayName = "우리 동네";
      
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
      }

      setLocationName(displayName);

      try {
        // 날씨 및 습도 가져오기
        const resW = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto`);
        const dataW = await resW.json();
        setWeather(dataW.current);

        // 대기질 (미세먼지, 초미세먼지) 가져오기
        const resA = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5&timezone=auto`);
        const dataA = await resA.json();
        setAq(dataA.current);
      } catch (e) { console.error("API 호출 실패", e); }
      
      setLoading(false);
    };
    
    fetchAllData();
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

  const timeStr = now.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });

  return (
    <div className="h-full flex flex-col p-4 bg-gradient-to-br from-sky-400 to-blue-600 text-white relative group overflow-hidden">
      
      {/* ⏰ 상단: 시계 및 날짜 영역 */}
      <div className="text-center mb-2 shrink-0 border-b border-white/20 pb-2">
        <div className="text-[10px] sm:text-xs font-medium opacity-90">{dateStr}</div>
        <div className="text-2xl sm:text-3xl font-black tracking-widest drop-shadow-sm font-mono mt-0.5">{timeStr}</div>
      </div>

      {loading ? (
        <div className="flex-1 flex justify-center items-center"><Loader className="animate-spin text-white/50" size={32}/></div>
      ) : weather && aq ? (
        <div className="flex flex-col flex-1 justify-between gap-2">
          
          {/* ☀️ 중단: 실시간 날씨 및 기온 */}
          <div className="flex flex-1 items-center justify-center gap-3 sm:gap-5">
            {getWeatherIcon(weather.weather_code, 48, "shrink-0")}
            <div className="flex flex-col justify-center text-left">
              <div className="text-3xl sm:text-4xl font-black drop-shadow-sm leading-none tracking-tighter">
                {Math.round(weather.temperature_2m)}°C
              </div>
              <div className="text-[11px] sm:text-xs font-bold opacity-90 truncate max-w-[120px] sm:max-w-[150px] mt-1.5">
                {locationName} · {getDesc(weather.weather_code)}
              </div>
            </div>
          </div>

          {/* 🌬️ 하단: 습도, 미세먼지, 초미세먼지 정보 */}
          <div className="flex justify-between items-center bg-black/15 rounded-xl p-2 sm:p-3 shrink-0">
            <div className="flex flex-col items-center flex-1">
              <span className="text-[9px] sm:text-[10px] text-white/70 font-bold mb-0.5">습도</span>
              <span className="text-xs sm:text-sm font-black">{weather.relative_humidity_2m}%</span>
            </div>
            <div className="w-px h-6 bg-white/20 mx-1"></div>
            <div className="flex flex-col items-center flex-1">
              <span className="text-[9px] sm:text-[10px] text-white/70 font-bold mb-0.5">미세먼지</span>
              <span className={`text-xs sm:text-sm font-black ${getAQString(aq.pm10, 'pm10').color}`}>
                {getAQString(aq.pm10, 'pm10').text}
              </span>
            </div>
            <div className="w-px h-6 bg-white/20 mx-1"></div>
            <div className="flex flex-col items-center flex-1">
              <span className="text-[9px] sm:text-[10px] text-white/70 font-bold mb-0.5">초미세먼지</span>
              <span className={`text-xs sm:text-sm font-black ${getAQString(aq.pm2_5, 'pm25').color}`}>
                {getAQString(aq.pm2_5, 'pm25').text}
              </span>
            </div>
          </div>

        </div>
      ) : (
        <div className="flex-1 flex justify-center items-center"><span className="text-sm font-bold opacity-80">데이터 오류</span></div>
      )}
    </div>
  );
}