import React from 'react';
import { Wrench, Sparkles } from 'lucide-react';

export default function AiRecord() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-6">
      <div className="bg-indigo-50 dark:bg-indigo-900/30 p-8 rounded-full mb-8 shadow-inner border border-indigo-100 dark:border-indigo-800">
        <Wrench size={80} className="text-indigo-500 animate-bounce" />
      </div>
      <h2 className="text-3xl md:text-4xl font-bold dark:text-white mb-4 flex items-center gap-3">
        <Sparkles className="text-yellow-500" size={32}/> AI 세특 작성 전용관
      </h2>
      <p className="text-gray-500 dark:text-gray-400 text-lg max-w-lg leading-relaxed font-medium">
        현재 공사 중입니다! 🚧<br/><br/>
        선생님께서 원하시는 완벽한 프롬프트가 준비되면,<br/>이곳에 AI 세특 작성 전용 페이지가 새롭게 열릴 예정입니다.
      </p>
    </div>
  );
}