export const toast = {
  success: (msg: string) => showToast(msg, 'success'),
  warning: (msg: string) => showToast(msg, 'warning'),
  error: (msg: string) => showToast(msg, 'error'),
  info: (msg: string) => showToast(msg, 'info')
};

function showToast(msg: string, type: 'success' | 'warning' | 'error' | 'info') {
  const div = document.createElement('div');
  div.className = `fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-xl text-sm font-medium z-[9999] transition-all duration-300 transform translate-y-0 opacity-100 flex items-center ${
    type === 'success' ? 'bg-white text-gray-800 border border-gray-200 border-l-4 border-l-green-500' :
    type === 'warning' ? 'bg-white text-gray-800 border border-gray-200 border-l-4 border-l-amber-500' :
    type === 'info' ? 'bg-white text-gray-800 border border-gray-200 border-l-4 border-l-blue-500' :
    'bg-white text-gray-800 border border-gray-200 border-l-4 border-l-red-500'
  }`;
  div.innerText = msg;
  document.body.appendChild(div);
  setTimeout(() => {
    div.style.opacity = '0';
    div.style.transform = 'translateY(10px)';
    setTimeout(() => div.remove(), 300);
  }, 3000);
}
