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
          const addressParts = schoolInfo.address.split(' ');
          let sido = addressParts[0];
          // 보통 두 번째 단어가 시/군/구에 해당함 (예: 강원특별자치도 '속초시')
          let sigungu = addressParts.length > 1 ? addressParts[1] : '';
          name = sigungu || sido;
          googleQuery = `${schoolInfo.address} 날씨`;
          
          // API 검색 성공률을 높이기 위해 끝의 '시/군/구' 제거 (예: 속초시 -> 속초)
          let cleanName = name.replace(/[시군구]$/, ''); 

          // 🔥 1순위: Open-Meteo 지오코딩 API (한국 데이터 우선 필터링)
          const meteoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanName)}&language=ko&count=5`);
          const meteoData = await meteoRes.json();
          
          if (meteoData.results && meteoData.results.length > 0) {
            // 다른 나라의 동명이인 지명이 잡힐 수 있으므로 KR 국가 코드 우선 선별
            const krResult = meteoData.results.find(r => r.country_code === 'KR') || meteoData.results[0];
            lat = krResult.latitude;
            lon = krResult.longitude;
          } else {
            // 🔥 2순위: 1순위 실패 시 오픈스트리트맵(Nominatim)으로 2차 이중 검색
            const query = `${sido} ${sigungu}`.trim();
            const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
            const nomData = await nomRes.json();
            if (nomData && nomData.length > 0) {
              lat = nomData[0].lat;
              lon = nomData[0].lon;
            }
          }
        } catch (e) { console.error("Geocoding failed", e); }
      }

      // 주소를 아예 못 찾았거나 입력된 주소가 없을 때 기본 교육청 지역으로 설정
      if (!lat || !lon) {
        lat = fallbackRegion.lat;
        lon = fallbackRegion.lon;
        name = fallbackRegion.name;
        googleQuery = `${fallbackRegion.name} 날씨`;
      }

      setLocationName(name);
      setSearchQueryForGoogle(googleQuery);

      // 확정된 위도(lat), 경도(lon)로 최종 날씨 호출
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