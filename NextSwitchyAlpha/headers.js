document.addEventListener('DOMContentLoaded', () => {
  // 初始化加载
  refreshInfo();
});

// 刷新信息
async function refreshInfo() {
  try {
    // 获取当前标签页
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // 获取基本信息
    const basicInfo = {
      'URL': tab.url,
      'User Agent': navigator.userAgent,
      'Platform': navigator.platform,
      'Language': navigator.language,
      'Cookies Enabled': navigator.cookieEnabled ? '是' : '否'
    };

    // 显示基本信息
    displayInfo('basic-info', basicInfo);

    // 获取请求头信息
    const headers = await getRequestHeaders(tab.url);
    displayInfo('request-headers', headers);

    showStatus('信息已更新', 'success');
  } catch (error) {
    console.error('获取信息失败:', error);
    showStatus('获取信息失败: ' + error.message, 'error');
  }
}

// 获取请求头信息
async function getRequestHeaders(url) {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      credentials: 'include'
    });

    const headers = {};
    for (const [name, value] of response.headers) {
      headers[name] = value;
    }
    return headers;
  } catch (error) {
    console.error('获取请求头失败:', error);
    return {
      'Error': '无法获取请求头信息'
    };
  }
}

// 显示信息
function displayInfo(containerId, info) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  Object.entries(info).forEach(([name, value]) => {
    const item = document.createElement('li');
    item.className = 'header-item';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'header-name';
    nameSpan.textContent = name;

    const valueSpan = document.createElement('span');
    valueSpan.className = 'header-value';
    valueSpan.textContent = value;

    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.textContent = '复制';
    copyBtn.onclick = () => {
      copyToClipboard(`${name}: ${value}`);
      showStatus('已复制到剪贴板', 'success');
    };

    item.appendChild(nameSpan);
    item.appendChild(valueSpan);
    item.appendChild(copyBtn);
    container.appendChild(item);
  });
}

// 复制到剪贴板
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    console.error('复制失败:', error);
    showStatus('复制失败: ' + error.message, 'error');
  }
}

// 显示状态信息
function showStatus(message, type) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = type;
  status.style.display = 'block';

  setTimeout(() => {
    status.style.display = 'none';
  }, 3000);
} 