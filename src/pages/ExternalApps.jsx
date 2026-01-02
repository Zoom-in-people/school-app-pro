import React from 'react';
import { ExternalLink, Link, FileText, Share2, Grid } from 'lucide-react';

export default function ExternalApps() {
  const apps = [
    { 
      id: 1, 
      title: '교원전보내신 공유사이트', 
      url: 'https://gw1.kr/교원전보공유', 
      icon: <Share2 className="text-blue-500" size={40}/>, 
      desc: '강원특별자치도교육청 교원 전보 정보를 공유하고 확인하세요.',
      color: 'hover:border-blue-500'
    },
    { 
      id: 2, 
      title: '단축URL 만들기', 
      url: 'https://gw1.kr', 
      icon: <Link className="text-indigo-500" size={40}/>, 
      desc: '긴 인터넷 주소를 짧고 간편하게 줄여보세요.',
      color: 'hover:border-indigo-500'
    },
    { 
      id: 3, 
      title: '설문제작하기(정보원)', 
      url: 'https://www.gwedu.go.kr/portal/user/landing/user_landing?survey=Y', 
      icon: <FileText className="text-green-500" size={40}/>, 
      desc: '강원교육과학정보원에서 제공하는 설문조사 도구입니다.',
      color: 'hover:border-green-500'
    },
  ];

  return (
    <div className="h-full flex flex-col gap-6 p-2">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
          <Grid className="text-indigo-600"/> 다른 교사용 앱
        </h2>
        <p className="text-gray-500 dark:text-gray-400">선생님 업무에 도움이 되는 유용한 웹사이트 모음입니다.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        {apps.map(app => (
          <a 
            key={app.id} 
            href={app.url} 
            target="_blank" 
            rel="noreferrer" 
            className={`block bg-white dark:bg-gray-800 p-8 rounded-2xl border-2 border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 group ${app.color}`}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                {app.icon}
              </div>
              <ExternalLink size={24} className="text-gray-300 group-hover:text-gray-600 dark:group-hover:text-white transition-colors"/>
            </div>
            <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {app.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              {app.desc}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}