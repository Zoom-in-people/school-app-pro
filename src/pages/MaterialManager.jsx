import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, FileText, Loader, ExternalLink, RefreshCw, AlertTriangle, Folder, ChevronDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getOrCreateFolder, uploadFileToDrive, listFiles } from '../utils/googleDrive';

export default function MaterialManager({ handbook }) {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [storageWarning, setStorageWarning] = useState(null); // 용량 경고 상태

  // 현재 선택된 연도 (기본값: 수첩 연도 or 올해)
  const baseYear = handbook?.startDate ? new Date(handbook.startDate).getFullYear() : new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(baseYear);

  // 연도 선택지 (올해 기준 앞뒤 5년)
  const yearOptions = Array.from({ length: 5 }, (_, i) => baseYear - 2 + i);

  // 🔥 1. 용량 체크 함수
  const checkStorage = async () => {
    const token = sessionStorage.getItem('google_access_token');
    if (!token) return;
    try {
      const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=storageQuota', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.storageQuota) {
        const { usage, limit } = data.storageQuota;
        // limit이 -1이면 무제한 용량
        if (limit && limit !== '-1') {
          const percent = (usage / limit) * 100;
          if (percent >= 80) {
            setStorageWarning(`현재 구글 드라이브 용량이 ${percent.toFixed(1)}% 찼습니다. 오래된 파일을 정리해주세요.`);
          }
        }
      }
    } catch (e) { console.error("Storage check failed", e); }
  };

  const initDrive = async () => {
    setIsLoading(true);
    try {
      // 1. 루트 폴더 찾기
      const rootId = await getOrCreateFolder('교무수첩 자료실');
      
      // 2. 선택된 연도 폴더 찾기 (없으면 생성)
      const yearId = await getOrCreateFolder(`${selectedYear}년 교무수첩`, rootId);
      setCurrentFolderId(yearId);
      
      // 3. 파일 목록
      const driveFiles = await listFiles(yearId);
      setFiles(driveFiles);

      // 4. 용량 체크 실행
      checkStorage();

    } catch (error) {
      console.error(error);
      if(error.message.includes("로그인")) alert("구글 재로그인이 필요합니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) initDrive();
  }, [user, selectedYear]); // 연도가 바뀌면 재로딩

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !currentFolderId) return;
    setIsUploading(true);
    try {
      await uploadFileToDrive(file, currentFolderId);
      const updatedFiles = await listFiles(currentFolderId);
      setFiles(updatedFiles);
      checkStorage(); // 업로드 후 용량 다시 체크
    } catch (error) { alert("업로드 실패: " + error.message); } 
    finally { setIsUploading(false); if(fileInputRef.current) fileInputRef.current.value = ""; }
  };

  // 🔥 파일 삭제 (휴지통으로 이동)
  const handleDelete = async (fileId) => {
    if (!window.confirm("파일을 삭제하시겠습니까? (구글 드라이브 휴지통으로 이동됩니다)")) return;
    
    const token = sessionStorage.getItem('google_access_token');
    try {
      await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'PATCH',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ trashed: true }) // 휴지통으로
      });
      // 목록 갱신
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (e) { alert("삭제 실패"); }
  };

  const handleOpen = (link) => { window.open(link, '_blank'); };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 min-h-[600px]">
      
      {/* 용량 경고 배너 */}
      {storageWarning && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 animate-pulse">
          <AlertTriangle size={20}/>
          <span className="font-bold text-sm">{storageWarning}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
             📁 교무수첩 자료실
          </h3>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-gray-500">내 드라이브 &gt; 교무수첩 자료실 &gt;</span>
            
            {/* 🔥 연도 선택 드롭다운 */}
            <div className="relative">
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="appearance-none bg-gray-100 dark:bg-gray-700 text-sm font-bold px-3 py-1 pr-8 rounded-lg cursor-pointer hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {yearOptions.map(y => <option key={y} value={y}>{y}년</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1.5 text-gray-500 pointer-events-none"/>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button onClick={initDrive} className="p-2 text-gray-500 hover:text-indigo-600 border rounded-lg" title="새로고침">
            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""}/>
          </button>
          <button 
            onClick={() => fileInputRef.current.click()} 
            disabled={isUploading || !currentFolderId}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 disabled:bg-gray-400 transition shadow-md"
          >
            {isUploading ? <Loader size={18} className="animate-spin"/> : <Plus size={18}/>}
            {isUploading ? "업로드..." : "파일 추가"}
          </button>
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-gray-400">드라이브를 연결하고 있습니다...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {files.length > 0 ? files.map(file => (
            <div 
              key={file.id} 
              className="group relative border border-gray-200 dark:border-gray-700 rounded-xl p-5 flex flex-col items-center justify-center gap-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-white dark:hover:bg-gray-600 transition cursor-pointer hover:shadow-md"
              onClick={() => handleOpen(file.webViewLink)}
            >
              {/* 🔥 삭제 버튼 (휴지통 아이콘) */}
              <button 
                onClick={(e) => { e.stopPropagation(); handleDelete(file.id); }} 
                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition p-1 bg-white dark:bg-gray-800 rounded-full shadow-sm z-10"
                title="삭제 (휴지통 이동)"
              >
                <Trash2 size={16}/>
              </button>

              <div className="w-14 h-14 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                <img src={file.iconLink} alt="icon" className="w-8 h-8" onError={(e) => e.target.src = "https://ssl.gstatic.com/docs/doclist/images/icon_10_generic_list.png"}/>
              </div>
              <div className="text-center w-full">
                <p className="font-bold text-sm dark:text-gray-200 truncate px-1" title={file.name}>{file.name}</p>
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 rounded-xl pointer-events-none">
                <ExternalLink className="text-gray-600 dark:text-white" size={24}/>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-20 text-center text-gray-400 flex flex-col items-center">
              <FileText size={48} className="mb-4 opacity-20"/>
              <p>이 폴더는 비어있습니다.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}