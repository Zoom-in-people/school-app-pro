import React from 'react';
import { Grid, ExternalLink, GraduationCap, Map, Book, FileText, Database } from 'lucide-react';

export default function ExternalApps() {
  const apps = [
    {
      id: 'neis',
      name: '나이스 (NEIS)',
      url: 'https://neis.go.kr/',
      description: '교육행정정보시스템',
      icon: <GraduationCap size={24} />,
      color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800'
    },
    {
      id: 'k-edufine',
      name: 'K-에듀파인',
      url: 'https://klef.go.kr/',
      description: '지방교육행정 재정시스템',
      icon: <Database size={24} />,
      color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
    },
    // 🔥 3번 요청: 우리나라 교육과정 추가
    {
      id: 'ncic',
      name: '우리나라 교육과정',
      url: 'https://ncic.re.kr/inv/org/list.do',
      description: 'NCIC 국가교육과정정보센터',
      icon: <Book size={24} />,
      color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
    },
    // 🔥 3번 요청: 생활기록부 종합 지원포털 추가
    {
      id: 'star',
      name: '생활기록부 지원포털',
      url: 'https://star.moe.go.kr/web/main/index.do',
      description: '학교생활기록부 기재요령 및 통합 지원',
      icon: <FileText size={24} />,
      color: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 border-orange-200 dark:border-orange-800'
    },
    {
      id: 'coolmessenger',
      name: '쿨메신저 클라우드',
      url: 'https://coolcloud.coolmessenger.com/',
      description: '교직원 전용 업무용 메신저',
      icon: <MessageSquare size={24} />,
      color: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
    }
  ];

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
          <Grid className="text-indigo-600"/> 다른 교사용 사이트
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {apps.map(app => (
          <a 
            key={app.id} 
            href={app.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all group flex flex-col items-center text-center gap-4 hover:-translate-y-1"
          >
            <div className={`p-4 rounded-2xl border ${app.color}`}>
              {app.icon}
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-indigo-600 transition flex items-center justify-center gap-1">
                {app.name} <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition"/>
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{app.description}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}