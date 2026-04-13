import React, { useState, useEffect } from 'react';
import { CloudRain, Sun, Cloud, Snowflake, Loader, ExternalLink, Search, X, Wind, Droplets, MapPin } from 'lucide-react';
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

// 공통 날씨 유틸리티 함수들
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
  if (val === undefined || val === null) return { text: "-", color: "text-gray-400", bg: "bg-gray-100" };
  if (type === 'pm10') {
    if (val <= 30) return { text: "좋음", color: "text-blue-500", bg: "bg-blue-100" };
    if (val <= 80) return { text: "보통", color: "text-green-500", bg: "bg-green-100" };
    if (val <= 150) return { text: "나쁨", color: "text-yellow-600", bg: "bg-yellow-100" };
    return { text: "매우나쁨", color: "text-red-500", bg: "bg-red-100" };
  } else {
    if (val <= 15) return { text: "좋음", color: "text-blue-500", bg: "bg-blue-100" };
    if (val <= 35) return { text: "보통", color: "text-green-500", bg: "bg-green-100" };
    if (val <= 75) return { text: "나쁨", color: "text-yellow-600", bg: "bg-yellow-100" };
    return { text: "매우나쁨", color: "text-red-500", bg: "bg-red-100" };
  }
};

const getDayName = (dateStr, index) => {
  if (index === 0) return '오늘';
  const d = new Date(dateStr);
  return ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
};

// 🔥 상세 날씨 팝업 (모달) 컴포넌트
function DetailedWeatherModal({ isOpen, onClose, initialLocation, initialLat, initialLon }) {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentLocation, setCurrentLocation] = useState(initialLocation);
  
  const [weather, setWeather] = useState(null);
  const [aq, setAq] = useState(null);
  const [hourly, setHourly] = useState(null);
  const [daily, setDaily] = useState(null);

  const fetchWeatherByCoords = async (lat, lon, locName) => {
    setLoading(true);
    try {
      const resW = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`);
      const dataW = await resW.json();
      
      const resA = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5&timezone=auto`);
      const dataA = await resA.json();

      setWeather(dataW.current);
      setDaily(dataW.daily);
      setAq(dataA.current);
      setCurrentLocation(locName);

      // 시간별 날씨는 현재 시간부터 24시간만 필터링
      const currentMs = Date.now();
      let startIndex = 0;
      for (let i = 0; i < dataW.hourly.time.length; i++) {
        if (new Date(dataW.hourly.time[i]).getTime() > currentMs) {
          startIndex = Math.max(0, i - 1);
          break;
        }
      }
      setHourly({
        time: dataW.hourly.time.slice(startIndex, startIndex + 24),
        temp: dataW.hourly.temperature_2m.slice(startIndex, startIndex + 24),
        code: dataW.hourly.weather_code.slice(startIndex, startIndex + 24)
      });
      
    } catch (e) { console.error("상세 날씨 로드 실패", e); }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen && initialLat && initialLon) {
      fetchWeatherByCoords(initialLat, initialLon, initialLocation);
    }
  }, [isOpen, initialLat, initialLon, initialLocation]);

  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) return;
    setLoading(true);
    try {
      const meteoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&language=ko&count=5`);
      const meteoData = await meteoRes.json();
      
      let lat, lon, locName = searchQuery;
      if (meteoData.results && meteoData.results.length > 0) {
        const krResult = meteoData.results.find(r => r.country_code === 'KR') || meteoData.results[0];
        if (krResult) { lat = krResult.latitude; lon = krResult.longitude; locName = krResult.name; }
      }

      if (!lat) {
        const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + " 대한민국")}`);
        const nomData = await nomRes.json();
        if (nomData && nomData.length > 0) { lat = nomData[0].lat; lon = nomData[0].lon; }
      }

      if (lat && lon) {
        await fetchWeatherByCoords(lat, lon, locName);
        setSearchQuery("");
      } else {
        alert("지역을 찾을 수 없습니다.");
        setLoading(false);
      }
    } catch (e) { 
      console.error(e); 
      setLoading(false); 
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
        
        <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shrink-0">
          <h2 className="text-xl font-bold dark:text-white flex items-center gap-2"><MapPin className="text-indigo-500"/> 지역별 상세 날씨</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition"><X className="text-gray-500"/></button>
        </div>

        <div className="p-4 sm:p-6 flex flex-col flex-1 overflow-hidden bg-gray-50/50 dark:bg-gray-900/30">
          
          {/* 검색 바 */}
          <div className="flex gap-2 mb-6 shrink-0">
            <input 
              type="text" 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="다른 지역 검색 (예: 강남구, 속초, 부산)" 
              className="flex-1 p-3 border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
            />
            <button onClick={handleSearch} className="bg-indigo-600 text-white px-5 rounded-xl hover:bg-indigo-700 transition font-bold flex items-center gap-2">
              <Search size={18}/> 검색
            </button>
          </div>

          {loading ? (
            <div className="flex-1 flex justify-center items-center"><Loader className="animate-spin text-indigo-500" size={48}/></div>
          ) : weather && aq && hourly && daily ? (
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6 pb-6">
              
              {/* 현재 날씨 요약 카드 */}
              <div className="bg-gradient-to-br from-sky-400 to-blue-600 text-white rounded-2xl p-6 shadow-md flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
                <div className="flex items-center gap-4">
                  {getWeatherIcon(weather.weather_code, 80, "drop-shadow-lg")}
                  <div>
                    <h3 className="text-5xl font-black drop-shadow-md tracking-tighter">{Math.round(weather.temperature_2m)}°</h3>
                    <p className="text-lg font-bold opacity-90">{currentLocation} · {getDesc(weather.weather_code)}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm font-bold bg-black/15 p-4 rounded-xl backdrop-blur-sm w-full sm:w-auto">
                  <div className="flex flex-col"><span className="text-white/70 text-xs">습도</span><span><Droplets size={14} className="inline mr-1"/>{weather.relative_humidity_2m}%</span></div>
                  <div className="flex flex-col"><span className="text-white/70 text-xs">바람</span><span><Wind size={14} className="inline mr-1"/>{weather.wind_speed_10m}km/h</span></div>
                  <div className="flex flex-col"><span className="text-white/70 text-xs">미세먼지</span><span className={getAQString(aq.pm10, 'pm10').color}>{getAQString(aq.pm10, 'pm10').text} ({Math.round(aq.pm10)}㎍/㎥)</span></div>
                  <div className="flex flex-col"><span className="text-white/70 text-xs">초미세먼지</span><span className={getAQString(aq.pm2_5, 'pm25').color}>{getAQString(aq.pm2_5, 'pm25').text} ({Math.round(aq.pm2_5)}㎍/㎥)</span></div>
                </div>
              </div>

              {/* 시간대별 예보 (가로 스크롤) */}
              <div>
                <h4 className="font-bold text-gray-800 dark:text-white mb-3 text-lg">오늘의 시간별 날씨</h4>
                <div className="flex overflow-x-auto custom-scrollbar pb-3 gap-3">
                  {hourly.time.map((timeStr, idx) => {
                    const date = new Date(timeStr);
                    const isNow = idx === 0;
                    return (
                      <div key={idx} className={`flex flex-col items-center p-3 rounded-xl min-w-[70px] shrink-0 border ${isNow ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800' : 'bg-white border-gray-100 dark:bg-gray-800 dark:border-gray-700'} shadow-sm`}>
                        <span className={`text-xs font-bold mb-2 ${isNow ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}>{isNow ? '지금' : `${date.getHours()}시`}</span>
                        {getWeatherIcon(hourly.code[idx], 28, "mb-2 text-gray-700 dark:text-gray-300")}
                        <span className="font-black text-gray-800 dark:text-white text-base">{Math.round(hourly.temp[idx])}°</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 7일 주간 예보 (세로 리스트) */}
              <div>
                <h4 className="font-bold text-gray-800 dark:text-white mb-3 text-lg">7일 주간 예보</h4>
                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-2 shadow-sm">
                  {daily.time.map((dateStr, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border-b border-gray-50 dark:border-gray-700/50 last:border-none hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition">
                      <span className="w-16 font-bold text-gray-700 dark:text-gray-300 text-sm">{getDayName(dateStr, idx)}</span>
                      <div className="flex items-center gap-4 flex-1">
                        {getWeatherIcon(daily.weathercode[idx], 24, "text-gray-600 dark:text-gray-400")}
                        <span className="text-sm font-bold text-gray-600 dark:text-gray-400">{getDesc(daily.weathercode[idx])}</span>
                      </div>
                      <div className="flex items-center gap-4 font-black w-24 justify-end">
                        <span className="text-blue-500">{Math.round(daily.temperature_2m_min[idx])}°</span>
                        <span className="text-gray-300 dark:text-gray-600">/</span>
                        <span className="text-red-500">{Math.round(daily.temperature_2m_max[idx])}°</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : <div className="flex-1 flex justify-center items-center text-gray-500 font-bold">데이터를 불러올 수 없습니다.</div>}
        </div>
      </div>
    </div>
  );
}


// 🔥 대시보드에 렌더링될 메인 날씨 위젯 컴포넌트
export default function WeatherWidget({ schoolInfo }) {
  const { weatherCache, setWeatherCache } = useAppStore();
  const [weather, setWeather] = useState(null);
  const [aq, setAq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationName, setLocationName] = useState("");
  const [coords, setCoords] = useState({ lat: null, lon: null });
  const [now, setNow] = useState(new Date());
  
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchAllData = async () => {
      const nowTime = Date.now();
      if (weatherCache && weatherCache.schoolCode === schoolInfo?.code && (nowTime - weatherCache.timestamp < 1800000)) {
        setWeather(weatherCache.weather);
        setAq(weatherCache.aq);
        setLocationName(weatherCache.locationName);
        setCoords({ lat: weatherCache.lat, lon: weatherCache.lon });
        setLoading(false);
        return;
      }

      setLoading(true);
      let lat, lon;
      let displayName = "우리 동네";
      
      let targetAddress = schoolInfo?.address;
      if (!targetAddress && schoolInfo?.officeCode && schoolInfo?.code) {
        try {
          const neisRes = await fetch(`https://open.neis.go.kr/hub/schoolInfo?Type=json&ATPT_OFCDC_SC_CODE=${schoolInfo.officeCode}&SD_SCHUL_CODE=${schoolInfo.code}`);
          const neisData = await neisRes.json();
          if (neisData.schoolInfo) targetAddress = neisData.schoolInfo[1].row[0].ORG_RDNMA; 
        } catch (e) {}
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
        } catch (e) {}
      }

      if (!lat || !lon) {
        const fallbackRegion = REGION_COORDS[schoolInfo?.officeCode] || REGION_COORDS['B10'];
        lat = fallbackRegion.lat; lon = fallbackRegion.lon; displayName = fallbackRegion.name;
      }

      setLocationName(displayName);
      setCoords({ lat, lon });

      try {
        const resW = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto`);
        const dataW = await resW.json();
        
        const resA = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5&timezone=auto`);
        const dataA = await resA.json();

        setWeather(dataW.current);
        setAq(dataA.current);

        setWeatherCache({
          schoolCode: schoolInfo?.code,
          timestamp: Date.now(),
          weather: dataW.current,
          aq: dataA.current,
          locationName: displayName,
          lat, lon
        });

      } catch (e) { console.error("API 호출 실패", e); }
      
      setLoading(false);
    };
    
    fetchAllData();
  }, [schoolInfo, weatherCache, setWeatherCache]);

  const timeStr = now.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });

  return (
    <>
      <div 
        onClick={() => { if(!loading && weather) setIsModalOpen(true); }}
        className="h-full flex flex-col p-4 bg-gradient-to-br from-sky-400 to-blue-600 text-white relative group overflow-hidden cursor-pointer hover:shadow-lg transition-all"
        title="클릭하여 상세 날씨 보기"
      >
        {loading && !weather ? (
          <div className="flex-1 flex justify-center items-center"><Loader className="animate-spin text-white/50" size={32}/></div>
        ) : weather && aq ? (
          <div className="flex flex-col h-full justify-between">
            
            {/* ⏰ 시원시원한 상단 시간/날짜 */}
            <div className="flex justify-between items-end border-b border-white/20 pb-2">
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm font-bold opacity-90">{locationName}</span>
                <span className="text-[10px] sm:text-xs opacity-75">{dateStr}</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black tracking-wider font-mono drop-shadow-md">
                {timeStr}
              </div>
            </div>

            {/* ☀️ 큼직한 현재 날씨 */}
            <div className="flex flex-1 items-center justify-center gap-6">
              {getWeatherIcon(weather.weather_code, 56, "shrink-0 drop-shadow-xl hover:scale-110 transition-transform")}
              <div className="flex flex-col text-left">
                <div className="text-4xl sm:text-5xl font-black drop-shadow-lg tracking-tighter leading-none mb-1">
                  {Math.round(weather.temperature_2m)}°
                </div>
                <div className="text-sm sm:text-base font-extrabold opacity-90">
                  {getDesc(weather.weather_code)}
                </div>
              </div>
            </div>

            {/* 🌬️ 세련된 하단 정보바 */}
            <div className="grid grid-cols-3 gap-2 bg-black/20 rounded-xl p-3 shrink-0 backdrop-blur-sm">
              <div className="flex flex-col items-center border-r border-white/10">
                <span className="text-[9px] sm:text-[10px] text-white/70 font-bold mb-1">습도</span>
                <span className="text-xs sm:text-sm font-black">{weather.relative_humidity_2m}%</span>
              </div>
              <div className="flex flex-col items-center border-r border-white/10">
                <span className="text-[9px] sm:text-[10px] text-white/70 font-bold mb-1">미세먼지</span>
                <span className={`text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-md ${getAQString(aq.pm10, 'pm10').bg} ${getAQString(aq.pm10, 'pm10').color}`}>
                  {getAQString(aq.pm10, 'pm10').text}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] sm:text-[10px] text-white/70 font-bold mb-1">초미세먼지</span>
                <span className={`text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-md ${getAQString(aq.pm2_5, 'pm25').bg} ${getAQString(aq.pm2_5, 'pm25').color}`}>
                  {getAQString(aq.pm2_5, 'pm25').text}
                </span>
              </div>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex justify-center items-center"><span className="text-sm font-bold opacity-80">데이터 오류</span></div>
        )}
      </div>

      {/* 모달 렌더링 */}
      <DetailedWeatherModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        initialLocation={locationName} 
        initialLat={coords.lat} 
        initialLon={coords.lon} 
      />
    </>
  );
}