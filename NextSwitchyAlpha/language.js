function toggleLanguage() {
  const container = document.querySelector('.container');
  const langSwitch = document.getElementById('langSwitch');
  const currentLang = container.getAttribute('data-lang');
  const newLang = currentLang === 'zh' ? 'en' : 'zh';
  
  // 更新语言标记
  container.setAttribute('data-lang', newLang);
  langSwitch.textContent = newLang === 'zh' ? 'EN' : '中';

  // 更新所有placeholder
  document.querySelectorAll('input[data-placeholder-' + newLang + ']').forEach(input => {
    input.placeholder = input.getAttribute('data-placeholder-' + newLang);
  });

  // 保存语言设置
  chrome.storage.local.set({ language: newLang });
}

// 页面加载完成后初始化语言设置
document.addEventListener('DOMContentLoaded', () => {
  // 添加语言切换按钮事件监听
  const langSwitch = document.getElementById('langSwitch');
  langSwitch.addEventListener('click', toggleLanguage);

  // 加载保存的语言设置
  chrome.storage.local.get(['language'], (result) => {
    if (result.language) {
      const container = document.querySelector('.container');
      container.setAttribute('data-lang', result.language);
      langSwitch.textContent = result.language === 'zh' ? 'EN' : '中';
      
      // 更新所有placeholder
      document.querySelectorAll('input[data-placeholder-' + result.language + ']').forEach(input => {
        input.placeholder = input.getAttribute('data-placeholder-' + result.language);
      });
    }
  });
}); 