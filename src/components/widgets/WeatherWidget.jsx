import React, { useState, useEffect } from 'react';
import { CloudRain, Sun, Cloud, Snowflake, Loader, ExternalLink } from 'lucide-react';
import { OFFICE_CODES } from '../../constants/data';

// 교육청 코드를 위도/경도로 매핑
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
  const [loading, setLoading] = useState(true);

  const region = REGION_COORDS[schoolInfo?.officeCode] || REGION_COORDS[OFFICE_CODES.SEOUL]; // 기본 서울

  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${region.lat}&longitude=${region.lon}&current_weather=true`);
        const data = await res.json();
        setWeather(data.current_weather);
      } catch (e) { console.error("날씨 로드 실패"); }
      setLoading(false);
    };
    fetchWeather();
  }, [region]);

  const getWeatherIcon = (code) => {
    if (code <= 3) return <Sun size={48} className="text-yellow-400" />;
    if (code <= 48) return <Cloud size={48} className="text-gray-300" />;
    if (code <= 67 || (code >= 80 && code <= 82)) return <CloudRain size={48} className="text-blue-400" />;
    return <Snowflake size={48} className="text-cyan-200" />;
  };

  const getDesc = (code) => {
    if (code <= 3) return "맑음"; if (code <= 48) return "구름/흐림";
    if (code <= 67 || (code >= 80 && code <= 82)) return "비"; return "눈";
  };

  return (
    <div className="h-full flex flex-col p-4 bg-gradient-to-br from-sky-400 to-blue-600 text-white relative justify-center items-center group">
      {loading ? <Loader className="animate-spin text-white/50" size={32}/> : weather ? (
        <>
          <div className="flex flex-col items-center gap-2">
            {getWeatherIcon(weather.weathercode)}
            <div className="text-center">
              <div className="text-3xl font-black">{Math.round(weather.temperature)}°C</div>
              <div className="text-sm font-medium opacity-90">{region.name} · {getDesc(weather.weathercode)}</div>
            </div>
          </div>
          <a href={`https://www.google.com/search?q=${region.name}+날씨`} target="_blank" rel="noreferrer" className="absolute bottom-3 right-3 text-[10px] bg-black/20 hover:bg-black/40 px-2 py-1 rounded-md transition flex items-center gap-1 opacity-0 group-hover:opacity-100">
            구글 날씨 <ExternalLink size={10}/>
          </a>
        </>
      ) : <span className="text-sm">날씨 정보 오류</span>}
    </div>
  );
}