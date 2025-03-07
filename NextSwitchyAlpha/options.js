document.addEventListener('DOMContentLoaded', async () => {
  // 获取DOM元素
  const proxyForm = document.getElementById('proxy-form');
  const proxyList = document.getElementById('proxy-list');
  const proxyType = document.getElementById('proxy-type');
  const fixedServerOptions = document.getElementById('fixed-server-options');
  const pacScriptOptions = document.getElementById('pac-script-options');
  const pacUrlOption = document.getElementById('pac-url-option');
  const pacDataOption = document.getElementById('pac-data-option');
  const cancelBtn = document.getElementById('cancel-btn');
  const editMode = document.getElementById('edit-mode');

  // 加载代理配置
  loadProxyConfigs();

  // 检查URL是否包含#add，如果是，显示添加表单
  if (window.location.hash === '#add') {
    showAddProxyForm();
  }

  // 代理类型切换事件
  proxyType.addEventListener('change', () => {
    if (proxyType.value === 'fixed_servers') {
      fixedServerOptions.style.display = 'block';
      pacScriptOptions.style.display = 'none';
    } else if (proxyType.value === 'pac_script') {
      fixedServerOptions.style.display = 'none';
      pacScriptOptions.style.display = 'block';
    }
  });

  // PAC脚本来源切换事件
  document.querySelectorAll('input[name="pac-source"]').forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.value === 'url') {
        pacUrlOption.style.display = 'block';
        pacDataOption.style.display = 'none';
      } else if (radio.value === 'data') {
        pacUrlOption.style.display = 'none';
        pacDataOption.style.display = 'block';
      }
    });
  });

  // 取消按钮事件
  cancelBtn.addEventListener('click', () => {
    resetForm();
    document.getElementById('add-proxy-section').style.display = 'none';
    window.location.hash = '';
  });

  // 表单提交事件
  proxyForm.addEventListener('submit', (e) => {
    e.preventDefault();
    saveProxy();
  });

  // 加载请求头设置
  const enableHeaders = document.getElementById('enable-headers');
  const headersOptions = document.getElementById('headers-options');
  const ipValue = document.getElementById('ip-value');
  const saveHeadersBtn = document.getElementById('save-headers');

  // 从存储中加载设置
  chrome.storage.local.get(['headerSettings'], (result) => {
    const settings = result.headerSettings || {
      enabled: false,
      ip: '',
      headers: []
    };

    enableHeaders.checked = settings.enabled;
    headersOptions.style.display = settings.enabled ? 'block' : 'none';
    ipValue.value = settings.ip;

    // 设置选中的请求头
    document.querySelectorAll('input[name="headers"]').forEach(checkbox => {
      checkbox.checked = settings.headers.includes(checkbox.value);
    });
  });

  // 启用/禁用请求头修改
  enableHeaders.addEventListener('change', () => {
    headersOptions.style.display = enableHeaders.checked ? 'block' : 'none';
    if (enableHeaders.checked) {
      saveHeadersSettings();
    } else {
      // 禁用时清除所有规则
      updateHeaderRules([], false);
    }
  });

  // 保存设置按钮
  saveHeadersBtn.addEventListener('click', saveHeadersSettings);
});

// 加载代理配置
function loadProxyConfigs() {
  chrome.runtime.sendMessage({ action: 'getProxyConfigs' }, (response) => {
    const { proxyConfigs, currentProxy } = response;
    renderProxyList(proxyConfigs, currentProxy);
  });
}

// 渲染代理列表
function renderProxyList(proxyConfigs, currentProxy) {
  const proxyList = document.getElementById('proxy-list');
  proxyList.innerHTML = '';

  // 排序：直连和系统代理放在前面，其他按字母顺序排序
  const sortedProxyNames = Object.keys(proxyConfigs).sort((a, b) => {
    if (a === 'direct') return -1;
    if (b === 'direct') return 1;
    if (a === 'system') return -1;
    if (b === 'system') return 1;
    return a.localeCompare(b);
  });

  sortedProxyNames.forEach(proxyName => {
    const config = proxyConfigs[proxyName];
    const card = document.createElement('div');
    card.className = 'proxy-card';
    if (proxyName === currentProxy) {
      card.classList.add('active');
    }

    // 代理名称
    const title = document.createElement('h3');
    title.textContent = getDisplayName(proxyName, config);
    card.appendChild(title);

    // 代理详情
    const details = document.createElement('div');
    details.className = 'proxy-details';
    details.textContent = getProxyDetails(proxyName, config);
    card.appendChild(details);

    // 操作按钮
    const actions = document.createElement('div');
    actions.className = 'proxy-actions';

    // 使用按钮
    const useBtn = document.createElement('button');
    useBtn.className = 'btn';
    useBtn.textContent = '使用';
    useBtn.addEventListener('click', () => {
      switchProxy(proxyName);
    });
    actions.appendChild(useBtn);

    // 编辑按钮（不为默认配置显示）
    if (proxyName !== 'direct' && proxyName !== 'system') {
      const editBtn = document.createElement('button');
      editBtn.className = 'btn';
      editBtn.textContent = '编辑';
      editBtn.addEventListener('click', () => {
        editProxy(proxyName, config);
      });
      actions.appendChild(editBtn);

      // 删除按钮
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn danger-btn';
      deleteBtn.textContent = '删除';
      deleteBtn.addEventListener('click', () => {
        deleteProxy(proxyName);
      });
      actions.appendChild(deleteBtn);
    }

    card.appendChild(actions);
    proxyList.appendChild(card);
  });

  // 添加代理按钮
  const addCard = document.createElement('div');
  addCard.className = 'proxy-card';
  addCard.style.display = 'flex';
  addCard.style.justifyContent = 'center';
  addCard.style.alignItems = 'center';
  addCard.style.cursor = 'pointer';

  const addBtn = document.createElement('button');
  addBtn.className = 'btn primary-btn';
  addBtn.textContent = '+ 添加代理';
  addBtn.addEventListener('click', showAddProxyForm);
  
  addCard.appendChild(addBtn);
  proxyList.appendChild(addCard);
}

// 获取显示名称
function getDisplayName(proxyName, config) {
  switch (proxyName) {
    case 'direct':
      return '直接连接';
    case 'system':
      return '系统代理';
    default:
      return proxyName;
  }
}

// 获取代理详情
function getProxyDetails(proxyName, config) {
  switch (proxyName) {
    case 'direct':
      return '不使用代理，直接连接';
    case 'system':
      return '使用系统代理设置';
    default:
      if (config.mode === 'fixed_servers') {
        return `${config.scheme || 'http'}://${config.host}:${config.port}`;
      } else if (config.mode === 'pac_script') {
        if (config.pacUrl) {
          return `PAC脚本: ${config.pacUrl}`;
        } else {
          return 'PAC脚本: 自定义';
        }
      }
      return '';
  }
}

// 显示添加代理表单
function showAddProxyForm() {
  document.getElementById('add-proxy-section').style.display = 'block';
  document.getElementById('edit-mode').value = 'add';
  document.querySelector('#add-proxy-section h2').textContent = '添加代理';
  resetForm();
  window.location.hash = 'add';
}

// 编辑代理
function editProxy(proxyName, config) {
  document.getElementById('add-proxy-section').style.display = 'block';
  document.getElementById('edit-mode').value = 'edit';
  document.querySelector('#add-proxy-section h2').textContent = '编辑代理';
  
  // 填充表单
  document.getElementById('proxy-name').value = proxyName;
  document.getElementById('proxy-type').value = config.mode;
  
  if (config.mode === 'fixed_servers') {
    document.getElementById('fixed-server-options').style.display = 'block';
    document.getElementById('pac-script-options').style.display = 'none';
    
    document.getElementById('proxy-scheme').value = config.scheme || 'http';
    document.getElementById('proxy-host').value = config.host || '';
    document.getElementById('proxy-port').value = config.port || '';
    document.getElementById('bypass-list').value = (config.bypassList || []).join('\n');
  } else if (config.mode === 'pac_script') {
    document.getElementById('fixed-server-options').style.display = 'none';
    document.getElementById('pac-script-options').style.display = 'block';
    
    if (config.pacUrl) {
      document.querySelector('input[name="pac-source"][value="url"]').checked = true;
      document.getElementById('pac-url-option').style.display = 'block';
      document.getElementById('pac-data-option').style.display = 'none';
      document.getElementById('pac-url').value = config.pacUrl;
    } else if (config.pacData) {
      document.querySelector('input[name="pac-source"][value="data"]').checked = true;
      document.getElementById('pac-url-option').style.display = 'none';
      document.getElementById('pac-data-option').style.display = 'block';
      document.getElementById('pac-data').value = config.pacData;
    }
  }
  
  window.location.hash = 'edit';
}

// 重置表单
function resetForm() {
  document.getElementById('proxy-form').reset();
  document.getElementById('fixed-server-options').style.display = 'block';
  document.getElementById('pac-script-options').style.display = 'none';
  document.getElementById('pac-url-option').style.display = 'block';
  document.getElementById('pac-data-option').style.display = 'none';
}

// 在saveProxy函数之前添加代理测试功能
async function testProxy(config) {
  const testUrl = 'https://www.google.com/generate_204';
  const startTime = Date.now();
  let status = '失败';
  let delay = 0;

  try {
    // 临时应用代理设置
    await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { action: 'testProxyConfig', config },
        async (response) => {
          if (response.success) {
            try {
              // 测试连接
              const response = await fetch(testUrl, {
                mode: 'no-cors',
                cache: 'no-cache'
              });
              delay = Date.now() - startTime;
              status = response.status === 204 ? '成功' : '失败';
            } catch (error) {
              status = '失败';
            }
            resolve();
          } else {
            reject(new Error('应用代理设置失败'));
          }
        }
      );
    });
  } catch (error) {
    console.error('代理测试失败:', error);
  }

  return {
    status,
    delay: status === '成功' ? `${delay}ms` : '-'
  };
}

// 修改saveProxy函数
function saveProxy() {
  const proxyName = document.getElementById('proxy-name').value.trim();
  const proxyType = document.getElementById('proxy-type').value;
  
  if (!proxyName) {
    alert('请输入代理名称');
    return;
  }
  
  if (proxyName === 'direct' || proxyName === 'system') {
    alert('不能使用保留名称 "direct" 或 "system"');
    return;
  }
  
  let config = {
    name: proxyName,
    mode: proxyType
  };
  
  if (proxyType === 'fixed_servers') {
    const scheme = document.getElementById('proxy-scheme').value;
    const host = document.getElementById('proxy-host').value.trim();
    const port = document.getElementById('proxy-port').value.trim();
    const bypassList = document.getElementById('bypass-list').value.trim()
      .split('\n')
      .filter(line => line.trim() !== '')
      .map(line => line.trim());
    
    if (!host) {
      alert('请输入代理主机');
      return;
    }
    
    if (!port || isNaN(parseInt(port))) {
      alert('请输入有效的端口号');
      return;
    }
    
    config = {
      ...config,
      scheme,
      host,
      port,
      bypassList
    };
  } else if (proxyType === 'pac_script') {
    const pacSource = document.querySelector('input[name="pac-source"]:checked').value;
    
    if (pacSource === 'url') {
      const pacUrl = document.getElementById('pac-url').value.trim();
      
      if (!pacUrl) {
        alert('请输入PAC脚本URL');
        return;
      }
      
      config = {
        ...config,
        pacUrl
      };
    } else if (pacSource === 'data') {
      const pacData = document.getElementById('pac-data').value.trim();
      
      if (!pacData) {
        alert('请输入PAC脚本内容');
        return;
      }
      
      config = {
        ...config,
        pacData
      };
    }
  }

  // 显示测试按钮和结果
  const testResult = document.getElementById('test-result');
  if (!testResult) {
    const resultDiv = document.createElement('div');
    resultDiv.id = 'test-result';
    resultDiv.className = 'test-result';
    
    const btnGroup = document.createElement('div');
    btnGroup.className = 'btn-group';
    
    const testBtn = document.createElement('button');
    testBtn.type = 'button';
    testBtn.className = 'btn';
    testBtn.textContent = '测试代理';
    
    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'btn primary-btn';
    saveBtn.textContent = '保存代理';
    
    const testStatus = document.createElement('div');
    testStatus.className = 'test-status-container';
    testStatus.style.display = 'none';
    
    testBtn.onclick = async () => {
      testBtn.disabled = true;
      testBtn.textContent = '测试中...';
      testStatus.style.display = 'block';
      testStatus.textContent = '正在测试代理连接...';
      
      const result = await testProxy(config);
      
      testBtn.disabled = false;
      testBtn.textContent = '重新测试';
      testStatus.innerHTML = `
        测试结果：
        <span class="test-status ${result.status === '成功' ? 'success' : 'error'}">
          ${result.status}
        </span>
        ${result.status === '成功' ? `<span class="test-delay">(延迟: ${result.delay})</span>` : ''}
      `;
    };
    
    saveBtn.onclick = () => {
      // 保存配置
      chrome.runtime.sendMessage(
        { action: 'addProxyConfig', config },
        (response) => {
          if (response.success) {
            // 重新加载代理列表
            loadProxyConfigs();
            // 隐藏表单
            document.getElementById('add-proxy-section').style.display = 'none';
            window.location.hash = '';
          }
        }
      );
    };
    
    btnGroup.appendChild(testBtn);
    btnGroup.appendChild(saveBtn);
    resultDiv.appendChild(testStatus);
    resultDiv.appendChild(btnGroup);
    document.getElementById('proxy-form').appendChild(resultDiv);
  }
}

// 切换代理
function switchProxy(proxyName) {
  chrome.runtime.sendMessage(
    { action: 'setCurrentProxy', proxyName },
    (response) => {
      if (response.success) {
        // 重新加载代理列表
        loadProxyConfigs();
      }
    }
  );
}

// 删除代理
function deleteProxy(proxyName) {
  if (confirm(`确定要删除代理 "${proxyName}" 吗？`)) {
    chrome.runtime.sendMessage(
      { action: 'removeProxyConfig', proxyName },
      (response) => {
        if (response.success) {
          // 重新加载代理列表
          loadProxyConfigs();
        } else {
          alert(response.error || '删除失败');
        }
      }
    );
  }
}

// 保存请求头设置
async function saveHeadersSettings() {
  const enabled = document.getElementById('enable-headers').checked;
  const ip = document.getElementById('ip-value').value.trim();
  const selectedHeaders = Array.from(document.querySelectorAll('input[name="headers"]:checked'))
    .map(checkbox => checkbox.value);

  // 验证IP地址
  if (enabled && ip) {
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipPattern.test(ip)) {
      alert('请输入有效的IP地址');
      return;
    }
  }

  // 保存设置
  const settings = {
    enabled,
    ip,
    headers: selectedHeaders
  };

  await chrome.storage.local.set({ headerSettings: settings });

  // 更新规则
  if (enabled && ip && selectedHeaders.length > 0) {
    const rules = selectedHeaders.map((header, index) => ({
      id: index + 1,
      priority: 1,
      action: {
        type: 'modifyHeaders',
        requestHeaders: [{
          header: header,
          operation: 'set',
          value: ip
        }]
      },
      condition: {
        urlFilter: '*',
        resourceTypes: ['main_frame', 'sub_frame', 'stylesheet', 'script', 'image', 'font', 'object', 'xmlhttprequest', 'ping', 'csp_report', 'media', 'websocket', 'other']
      }
    }));

    updateHeaderRules(rules, true);
  } else {
    updateHeaderRules([], false);
  }
}

// 更新请求头规则
async function updateHeaderRules(rules, enabled) {
  // 使用chrome.runtime.sendMessage通知background.js更新规则
  chrome.runtime.sendMessage({
    action: 'updateHeaderRules',
    rules: rules,
    enabled: enabled
  }, (response) => {
    if (response.success) {
      if (enabled) {
        alert('请求头设置已保存并启用');
      } else {
        alert('请求头修改已禁用');
      }
    } else {
      alert('保存设置失败: ' + response.error);
    }
  });
} 