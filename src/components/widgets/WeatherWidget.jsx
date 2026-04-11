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
  const [loading, setLoading] = useState(true);
  const [locationName, setLocationName] = useState("");
  const [searchQueryForGoogle, setSearchQueryForGoogle] = useState("");

  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      let lat, lon;
      let name = "우리 동네";
      let googleQuery = "현재 날씨";

      const fallbackRegion = REGION_COORDS[schoolInfo?.officeCode] || REGION_COORDS[OFFICE_CODES.SEOUL];

      if (schoolInfo?.address) {
        try {
          // 🔥 오픈스트리트맵 대신 더 빠르고 정확한 Open-Meteo 지오코딩 사용
          const addressParts = schoolInfo.address.split(' ');
          const searchKeyword = addressParts.slice(0, 2).join(' '); // "서울특별시 강남구"
          name = addressParts[1] || addressParts[0]; 
          googleQuery = `${schoolInfo.address} 날씨`;

          const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchKeyword)}&language=ko&count=1`);
          const data = await res.json();
          
          if (data.results && data.results.length > 0) {
            lat = data.results[0].latitude;
            lon = data.results[0].longitude;
          } else {
            // 실패 시 시/군/구 이름만으로 재검색
            const fallbackRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&language=ko&count=1`);
            const fallbackData = await fallbackRes.json();
            if (fallbackData.results && fallbackData.results.length > 0) {
              lat = fallbackData.results[0].latitude;
              lon = fallbackData.results[0].longitude;
            }
          }
        } catch (e) { console.error("Geocoding failed", e); }
      }

      if (!lat || !lon) {
        lat = fallbackRegion.lat;
        lon = fallbackRegion.lon;
        name = fallbackRegion.name;
        googleQuery = `${fallbackRegion.name} 날씨`;
      }

      setLocationName(name);
      setSearchQueryForGoogle(googleQuery);

      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const data = await res.json();
        setWeather(data.current_weather);
      } catch (e) { console.error("날씨 로드 실패"); }
      
      setLoading(false);
    };
    fetchWeather();
  }, [schoolInfo]);

  const getWeatherIcon = (code) => {
    if (code <= 3) return <Sun size={48} className="text-yellow-400 drop-shadow-md" />;
    if (code <= 48) return <Cloud size={48} className="text-gray-200 drop-shadow-md" />;
    if (code <= 67 || (code >= 80 && code <= 82)) return <CloudRain size={48} className="text-blue-200 drop-shadow-md" />;
    return <Snowflake size={48} className="text-cyan-100 drop-shadow-md" />;
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
            <div className="text-center mt-1">
              <div className="text-3xl font-black drop-shadow-sm">{Math.round(weather.temperature)}°C</div>
              <div className="text-sm font-medium opacity-90 truncate max-w-[120px]">{locationName} · {getDesc(weather.weathercode)}</div>
            </div>
          </div>
          <a href={`https://www.google.com/search?q=${searchQueryForGoogle}`} target="_blank" rel="noreferrer" className="absolute bottom-3 right-3 text-[10px] bg-black/20 hover:bg-black/40 px-2 py-1 rounded-md transition flex items-center gap-1 opacity-0 group-hover:opacity-100 font-bold">
            구글 날씨 <ExternalLink size={10}/>
          </a>
        </>
      ) : <span className="text-sm font-bold opacity-80">날씨 정보 오류</span>}
    </div>
  );
}