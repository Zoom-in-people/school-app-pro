import Swal from 'sweetalert2';

// 1. 가벼운 토스트 알림 (우측 상단에 작게 뜨고 사라짐 - 저장 완료, 간단한 에러 등에 사용)
export const showToast = (title, icon = 'success') => {
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: icon,
    title: title,
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
    customClass: {
      popup: 'dark:bg-gray-800 dark:text-white rounded-xl shadow-lg border border-gray-100 dark:border-gray-700',
    }
  });
};

// 2. 일반 알림창 (가운데 뜨고 [확인] 버튼 하나 있음 - 긴 안내나 경고에 사용)
export const showAlert = (title, text, icon = 'info') => {
  return Swal.fire({
    title: title,
    text: text,
    icon: icon,
    confirmButtonColor: '#4f46e5', // indigo-600
    customClass: {
      popup: 'rounded-2xl dark:bg-gray-800 dark:text-white',
      title: 'text-xl font-bold',
      confirmButton: 'px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 outline-none',
    }
  });
};

// 3. 확인/취소 질문창 (기존 window.confirm 완벽 대체 - 삭제 등 위험한 작업에 사용)
export const showConfirm = async (title, text, confirmText = '삭제', isDestructive = true) => {
  const result = await Swal.fire({
    title: title,
    text: text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: isDestructive ? '#ef4444' : '#4f46e5', // 빨간색 또는 파란색
    cancelButtonColor: '#6b7280', // 회색
    confirmButtonText: confirmText,
    cancelButtonText: '취소',
    reverseButtons: true, // 취소 버튼을 왼쪽으로 배치해서 실수 방지
    customClass: {
      popup: 'rounded-2xl dark:bg-gray-800 dark:text-white',
      title: 'text-xl font-bold',
      confirmButton: `px-6 py-2.5 rounded-xl font-bold text-white outline-none ${isDestructive ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'}`,
      cancelButton: 'px-6 py-2.5 rounded-xl font-bold text-white bg-gray-500 hover:bg-gray-600 outline-none',
    }
  });
  return result.isConfirmed;
};