import Swal from 'sweetalert2';

// 1. 가벼운 토스트 알림 (중앙 상단에 작게 뜨고 사라짐)
export const showToast = (title, icon = 'success') => {
  Swal.fire({
    toast: true,
    position: 'top', // 🔥 우측 상단에서 상단 중앙으로 변경
    icon: icon,
    title: title,
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
    customClass: {
      popup: 'dark:bg-gray-800 dark:text-white rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 mt-4',
    }
  });
};

// 2. 일반 알림창
export const showAlert = (title, text, icon = 'info') => {
  return Swal.fire({
    title: title,
    text: text,
    icon: icon,
    confirmButtonColor: '#4f46e5',
    customClass: {
      popup: 'rounded-2xl dark:bg-gray-800 dark:text-white',
      title: 'text-xl font-bold',
      confirmButton: 'px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 outline-none',
    }
  });
};

// 3. 확인/취소 질문창
export const showConfirm = async (title, text, confirmText = '삭제', isDestructive = true) => {
  const result = await Swal.fire({
    title: title,
    text: text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: isDestructive ? '#ef4444' : '#4f46e5',
    cancelButtonColor: '#6b7280',
    confirmButtonText: confirmText,
    cancelButtonText: '취소',
    reverseButtons: true,
    customClass: {
      popup: 'rounded-2xl dark:bg-gray-800 dark:text-white',
      title: 'text-xl font-bold',
      confirmButton: `px-6 py-2.5 rounded-xl font-bold text-white outline-none ${isDestructive ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'}`,
      cancelButton: 'px-6 py-2.5 rounded-xl font-bold text-white bg-gray-500 hover:bg-gray-600 outline-none',
    }
  });
  return result.isConfirmed;
};
