document.addEventListener('DOMContentLoaded', () => {
  // 加载代理列表
  loadProxyList();

  // 初始化请求头修改工具
  initHeaderTools();

  // 初始化代理管理功能
  initProxyManager();
});

// 初始化代理管理功能
function initProxyManager() {
  const addProxyBtn = document.getElementById('add-proxy');
  const proxyName = document.getElementById('proxy-name');
  const proxyScheme = document.getElementById('proxy-scheme');
  const proxyHost = document.getElementById('proxy-host');
  const proxyPort = document.getElementById('proxy-port');
  const bypassList = document.getElementById('bypass-list');

  addProxyBtn.addEventListener('click', () => {
    const container = document.querySelector('.container');
    const lang = container.getAttribute('data-lang') || 'zh';

    // 验证输入
    const name = proxyName.value.trim();
    if (!name) {
      alert(lang === 'zh' ? '请输入代理名称' : 'Please enter proxy name');
      return;
    }

    // 验证代理名称不能是保留名称
    if (name === 'direct' || name === 'system') {
      alert(lang === 'zh' ? 
        '不能使用保留的代理名称（direct 或 system）' : 
        'Cannot use reserved proxy names (direct or system)');
      return;
    }

    if (!proxyHost.value.trim()) {
      alert(lang === 'zh' ? '请输入主机地址' : 'Please enter host address');
      return;
    }
    if (!proxyPort.value.trim()) {
      alert(lang === 'zh' ? '请输入端口' : 'Please enter port');
      return;
    }

    const port = parseInt(proxyPort.value);
    if (isNaN(port) || port < 1 || port > 65535) {
      alert(lang === 'zh' ? 
        '请输入有效的端口号（1-65535）' : 
        'Please enter a valid port number (1-65535)');
      return;
    }

    const bypassListValue = bypassList.value.trim()
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    // 添加代理
    const config = {
      name: proxyName.value.trim(),
      mode: 'fixed_servers',
      scheme: proxyScheme.value,
      host: proxyHost.value.trim(),
      port: port,
      bypassList: bypassListValue
    };

    chrome.runtime.sendMessage(
      { action: 'addProxyConfig', config },
      (response) => {
        if (response.success) {
          // 清空输入
          proxyName.value = '';
          proxyHost.value = '';
          proxyPort.value = '';
          bypassList.value = '';
          // 重新加载代理列表
          loadProxyList();
        } else {
          const errorMessage = lang === 'zh' ?
            '添加代理失败：' + (response.error || '未知错误') :
            'Failed to add proxy: ' + (response.error || 'Unknown error');
          alert(errorMessage);
        }
      }
    );
  });
}

// 加载代理列表
function loadProxyList() {
  chrome.runtime.sendMessage({ action: 'getProxyConfigs' }, (response) => {
    const { proxyConfigs, currentProxy } = response;
    renderProxyList(proxyConfigs, currentProxy);
  });
}

// 渲染代理列表
function renderProxyList(proxyConfigs, currentProxy) {
  const proxyList = document.getElementById('proxy-list');
  const container = document.querySelector('.container');
  const lang = container.getAttribute('data-lang') || 'zh';
  proxyList.innerHTML = '';

  // 确保默认代理配置存在
  if (!proxyConfigs.direct) {
    proxyConfigs.direct = { mode: 'direct' };
  }
  if (!proxyConfigs.system) {
    proxyConfigs.system = { mode: 'system' };
  }

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
    const item = document.createElement('div');
    item.className = 'proxy-item';
    if (proxyName === currentProxy) {
      item.classList.add('active');
    }

    const name = document.createElement('div');
    name.className = 'proxy-name';
    name.textContent = getDisplayName(proxyName, lang);

    // 为当前选中的代理添加状态指示器
    if (proxyName === currentProxy) {
      const statusDot = document.createElement('span');
      statusDot.className = 'system-proxy-status';
      name.appendChild(statusDot);
      // 检查代理状态
      checkProxyStatus();
    }

    const detail = document.createElement('div');
    detail.className = 'proxy-detail';
    detail.textContent = getProxyDetail(proxyName, config, lang);

    item.appendChild(name);
    item.appendChild(detail);

    // 添加编辑和删除按钮（仅对非默认代理）
    if (proxyName !== 'direct' && proxyName !== 'system') {
      const btnGroup = document.createElement('div');
      btnGroup.className = 'btn-group';
      btnGroup.style.marginLeft = '8px';

      // 编辑按钮
      const editBtn = document.createElement('button');
      editBtn.className = 'btn icon edit';
      editBtn.title = lang === 'zh' ? '编辑' : 'Edit';
      editBtn.innerHTML = '<span class="material-icons">edit</span>';
      editBtn.onclick = (e) => {
        e.stopPropagation();
        editProxy(proxyName, config);
      };

      // 删除按钮
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn icon delete';
      deleteBtn.title = lang === 'zh' ? '删除' : 'Delete';
      deleteBtn.innerHTML = '<span class="material-icons">delete</span>';
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        const confirmMessage = lang === 'zh' ? 
          '确定要删除此代理吗？' : 
          'Are you sure you want to delete this proxy?';
        if (confirm(confirmMessage)) {
          chrome.runtime.sendMessage(
            { action: 'removeProxyConfig', proxyName },
            (response) => {
              if (response.success) {
                loadProxyList();
              } else {
                const errorMessage = lang === 'zh' ?
                  '删除代理失败：' + (response.error || '未知错误') :
                  'Failed to delete proxy: ' + (response.error || 'Unknown error');
                alert(errorMessage);
              }
            }
          );
        }
      };

      btnGroup.appendChild(editBtn);
      btnGroup.appendChild(deleteBtn);
      detail.appendChild(btnGroup);
    }

    item.addEventListener('click', () => {
      switchProxy(proxyName);
    });

    proxyList.appendChild(item);
  });
}

// 获取显示名称
function getDisplayName(proxyName, lang = 'zh') {
  switch (proxyName) {
    case 'direct':
      return lang === 'zh' ? '直接连接' : 'Direct Connection';
    case 'system':
      return lang === 'zh' ? '系统代理' : 'System Proxy';
    default:
      return proxyName;
  }
}

// 获取代理详情
function getProxyDetail(proxyName, config, lang = 'zh') {
  switch (proxyName) {
    case 'direct':
      return lang === 'zh' ? '不使用代理' : 'No Proxy';
    case 'system':
      return lang === 'zh' ? '系统设置' : 'System Settings';
    default:
      if (config.mode === 'fixed_servers') {
        let detail = `${config.scheme}://${config.host}:${config.port}`;
        if (config.bypassList && config.bypassList.length > 0) {
          detail += lang === 'zh' ? 
            ` (${config.bypassList.length}个过滤规则)` : 
            ` (${config.bypassList.length} bypass rules)`;
        }
        return detail;
      } else if (config.mode === 'pac_script') {
        return 'PAC Script';
      }
      return '';
  }
}

// 切换代理
function switchProxy(proxyName) {
  chrome.runtime.sendMessage(
    { action: 'setCurrentProxy', proxyName },
    (response) => {
      if (response.success) {
        loadProxyList();
      }
    }
  );
}

// 检查代理状态
function checkProxyStatus() {
  chrome.proxy.settings.get({}, (config) => {
    const statusDot = document.querySelector('.system-proxy-status');
    if (statusDot) {
      const isWorking = config.value.mode === config.value.mode;
      statusDot.className = `system-proxy-status ${isWorking ? 'active' : 'error'}`;
      statusDot.title = isWorking ? 
        '代理工作正常' :
        '代理可能未生效';
    }
  });
}

// 初始化请求头修改工具
function initHeaderTools() {
  // 请求头相关元素
  const xforwardedSwitch = document.getElementById('xforwarded-switch');
  const xforwardedContent = document.getElementById('xforwarded-content');
  const xforwardedIp = document.getElementById('xforwarded-ip');
  const xforwardedSave = document.getElementById('xforwarded-save');
  const headerSelect = document.getElementById('header-select');

  // 自定义请求头相关元素
  const customHeadersSwitch = document.getElementById('custom-headers-switch');
  const customHeadersContent = document.getElementById('custom-headers-content');
  const customHeadersList = document.getElementById('custom-headers-list');
  const customHeaderName = document.getElementById('custom-header-name');
  const customHeaderValue = document.getElementById('custom-header-value');
  const addCustomHeaderBtn = document.getElementById('add-custom-header');

  // User-Agent 相关元素
  const uaSwitch = document.getElementById('ua-switch');
  const uaContent = document.getElementById('ua-content');
  const uaValue = document.getElementById('ua-value');
  const uaSave = document.getElementById('ua-save');
  const uaMobile = document.getElementById('ua-mobile');
  const uaDesktop = document.getElementById('ua-desktop');

  // 预设的User-Agent值
  const mobileUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1';
  const desktopUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

  // 加载保存的设置
  chrome.storage.local.get(['headerSettings', 'uaSettings', 'customHeaders'], (result) => {
    // 请求头设置
    const headerSettings = result.headerSettings || { enabled: false, ip: '', headers: [] };
    xforwardedSwitch.checked = headerSettings.enabled;
    xforwardedContent.classList.toggle('show', headerSettings.enabled);
    xforwardedIp.value = headerSettings.ip || '';
    
    // 设置已选择的请求头
    if (headerSettings.headers && headerSettings.headers.length > 0) {
      Array.from(headerSelect.options).forEach(option => {
        option.selected = headerSettings.headers.includes(option.value);
      });
    }

    // User-Agent 设置
    const uaSettings = result.uaSettings || { enabled: false, userAgent: '' };
    uaSwitch.checked = uaSettings.enabled;
    uaContent.classList.toggle('show', uaSettings.enabled);
    uaValue.value = uaSettings.userAgent || '';

    // 自定义请求头设置
    const customHeaders = result.customHeaders || { enabled: false, headers: [] };
    customHeadersSwitch.checked = customHeaders.enabled;
    customHeadersContent.classList.toggle('show', customHeaders.enabled);
    renderCustomHeaders(customHeaders.headers);
  });

  // 请求头开关事件
  xforwardedSwitch.addEventListener('change', () => {
    const enabled = xforwardedSwitch.checked;
    xforwardedContent.classList.toggle('show', enabled);
    
    chrome.storage.local.get(['headerSettings'], (result) => {
      const settings = result.headerSettings || { ip: '', headers: [] };
      chrome.storage.local.set({
        headerSettings: {
          ...settings,
          enabled: enabled
        }
      }, () => {
        updateHeaderRules(enabled);
      });
    });
  });

  // 请求头保存按钮事件
  xforwardedSave.addEventListener('click', () => {
    saveXForwardedIP();
  });

  // 请求头选择事件
  headerSelect.addEventListener('change', () => {
    if (xforwardedSwitch.checked) {
      saveXForwardedIP();
    }
  });

  // User-Agent 开关事件
  uaSwitch.addEventListener('change', () => {
    const enabled = uaSwitch.checked;
    uaContent.classList.toggle('show', enabled);
    
    chrome.storage.local.get(['uaSettings'], (result) => {
      const settings = result.uaSettings || { userAgent: '' };
      chrome.storage.local.set({
        uaSettings: {
          ...settings,
          enabled: enabled
        }
      }, () => {
        updateUserAgent(enabled);
      });
    });
  });

  // User-Agent 保存按钮事件
  uaSave.addEventListener('click', () => {
    const userAgent = uaValue.value.trim();
    if (!userAgent) {
      alert('请输入User-Agent');
      return;
    }

    chrome.storage.local.set({
      uaSettings: {
        enabled: uaSwitch.checked,
        userAgent: userAgent
      }
    }, () => {
      updateUserAgent(uaSwitch.checked);
      alert('User-Agent已保存');
    });
  });

  // 移动端UA按钮事件
  uaMobile.addEventListener('click', () => {
    uaValue.value = mobileUA;
  });

  // 桌面端UA按钮事件
  uaDesktop.addEventListener('click', () => {
    uaValue.value = desktopUA;
  });

  // 自定义请求头开关事件
  customHeadersSwitch.addEventListener('change', () => {
    const enabled = customHeadersSwitch.checked;
    customHeadersContent.classList.toggle('show', enabled);
    
    chrome.storage.local.get(['customHeaders'], (result) => {
      const settings = result.customHeaders || { headers: [] };
      chrome.storage.local.set({
        customHeaders: {
          ...settings,
          enabled: enabled
        }
      }, () => {
        updateCustomHeaderRules(enabled);
      });
    });
  });

  // 添加自定义请求头按钮事件
  addCustomHeaderBtn.addEventListener('click', () => {
    const name = customHeaderName.value.trim();
    const value = customHeaderValue.value.trim();

    if (!name) {
      alert('请输入请求头名称');
      return;
    }
    if (!value) {
      alert('请输入请求头内容');
      return;
    }

    chrome.storage.local.get(['customHeaders'], (result) => {
      const settings = result.customHeaders || { enabled: false, headers: [] };
      const headers = settings.headers || [];
      
      // 检查是否已存在相同名称的请求头
      const existingIndex = headers.findIndex(h => h.name.toLowerCase() === name.toLowerCase());
      if (existingIndex !== -1) {
        headers[existingIndex] = { name, value, enabled: true };
      } else {
        headers.push({ name, value, enabled: true });
      }

      chrome.storage.local.set({
        customHeaders: {
          enabled: settings.enabled,
          headers: headers
        }
      }, () => {
        customHeaderName.value = '';
        customHeaderValue.value = '';
        renderCustomHeaders(headers);
        if (settings.enabled) {
          updateCustomHeaderRules(true);
        }
      });
    });
  });
}

// 渲染自定义请求头列表
function renderCustomHeaders(headers) {
  const container = document.getElementById('custom-headers-list');
  container.innerHTML = '';

  headers.forEach((header, index) => {
    const item = document.createElement('div');
    item.className = 'input-group';
    item.style.margin = '0';
    item.style.backgroundColor = '#fff';
    item.style.padding = '8px';
    item.style.borderRadius = '4px';
    item.style.border = '1px solid #eee';

    // 开关
    const switchLabel = document.createElement('label');
    switchLabel.className = 'switch';
    switchLabel.style.marginRight = '8px';
    
    const switchInput = document.createElement('input');
    switchInput.type = 'checkbox';
    switchInput.checked = header.enabled;
    switchInput.addEventListener('change', () => {
      header.enabled = switchInput.checked;
      updateCustomHeader(headers);
    });

    const switchSpan = document.createElement('span');
    switchSpan.className = 'slider';

    switchLabel.appendChild(switchInput);
    switchLabel.appendChild(switchSpan);

    // 请求头信息
    const info = document.createElement('div');
    info.style.flex = '1';
    info.style.overflow = 'hidden';
    info.style.textOverflow = 'ellipsis';
    info.style.whiteSpace = 'nowrap';
    info.textContent = `${header.name}: ${header.value}`;

    // 删除按钮
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn';
    deleteBtn.style.marginLeft = '8px';
    deleteBtn.style.padding = '2px 8px';
    deleteBtn.textContent = '删除';
    deleteBtn.onclick = () => {
      headers.splice(index, 1);
      updateCustomHeader(headers);
    };

    item.appendChild(switchLabel);
    item.appendChild(info);
    item.appendChild(deleteBtn);
    container.appendChild(item);
  });
}

// 更新自定义请求头
function updateCustomHeader(headers) {
  chrome.storage.local.get(['customHeaders'], (result) => {
    const settings = result.customHeaders || { enabled: false };
    chrome.storage.local.set({
      customHeaders: {
        enabled: settings.enabled,
        headers: headers
      }
    }, () => {
      renderCustomHeaders(headers);
      if (settings.enabled) {
        updateCustomHeaderRules(true);
      }
    });
  });
}

// 更新自定义请求头规则
function updateCustomHeaderRules(enabled) {
  chrome.storage.local.get(['customHeaders'], (result) => {
    const settings = result.customHeaders;
    if (!settings || !settings.headers || settings.headers.length === 0) return;

    const rules = settings.headers
      .filter(header => header.enabled)
      .map((header, index) => ({
        id: 100 + index, // 使用100以上的ID，避免与其他规则冲突
        priority: 1,
        action: {
          type: 'modifyHeaders',
          requestHeaders: [{
            header: header.name,
            operation: 'set',
            value: header.value
          }]
        },
        condition: {
          urlFilter: '*',
          resourceTypes: ['main_frame', 'sub_frame', 'stylesheet', 'script', 'image', 'font', 'object', 'xmlhttprequest', 'ping', 'csp_report', 'media', 'websocket', 'other']
        }
      }));

    chrome.runtime.sendMessage({
      action: 'updateHeaderRules',
      rules: rules,
      enabled: enabled
    });
  });
}

// 保存请求头IP
function saveXForwardedIP() {
  const xforwardedIp = document.getElementById('xforwarded-ip');
  const headerSelect = document.getElementById('header-select');
  
  const ip = xforwardedIp.value.trim();
  if (!ip) {
    alert('请输入IP地址');
    return;
  }

  const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipPattern.test(ip)) {
    alert('请输入有效的IP地址');
    return;
  }

  // 获取所有选中的请求头
  const selectedHeaders = Array.from(headerSelect.selectedOptions).map(option => option.value);
  if (selectedHeaders.length === 0) {
    alert('请至少选择一个请求头');
    return;
  }

  chrome.storage.local.set({
    headerSettings: {
      enabled: true,
      ip: ip,
      headers: selectedHeaders
    }
  }, () => {
    document.getElementById('xforwarded-switch').checked = true;
    document.getElementById('xforwarded-content').classList.add('show');
    updateHeaderRules(true);
  });
}

// 更新请求头规则
function updateHeaderRules(enabled) {
  chrome.storage.local.get(['headerSettings'], (result) => {
    const settings = result.headerSettings;
    if (!settings || !settings.ip || !settings.headers || settings.headers.length === 0) return;

    const rules = settings.headers.map((header, index) => ({
      id: index + 1,
      priority: 1,
      action: {
        type: 'modifyHeaders',
        requestHeaders: [{
          header: header,
          operation: 'set',
          value: settings.ip
        }]
      },
      condition: {
        urlFilter: '*',
        resourceTypes: ['main_frame', 'sub_frame', 'stylesheet', 'script', 'image', 'font', 'object', 'xmlhttprequest', 'ping', 'csp_report', 'media', 'websocket', 'other']
      }
    }));

    chrome.runtime.sendMessage({
      action: 'updateHeaderRules',
      rules: rules,
      enabled: enabled
    });
  });
}

// 更新User-Agent
function updateUserAgent(enabled) {
  chrome.storage.local.get(['uaSettings'], (result) => {
    const settings = result.uaSettings;
    if (!settings || !settings.userAgent) return;

    const rules = enabled ? [{
      id: 51, // 使用51以避免与header规则冲突
      priority: 1,
      action: {
        type: 'modifyHeaders',
        requestHeaders: [{
          header: 'User-Agent',
          operation: 'set',
          value: settings.userAgent
        }]
      },
      condition: {
        urlFilter: '*',
        resourceTypes: ['main_frame', 'sub_frame', 'stylesheet', 'script', 'image', 'font', 'object', 'xmlhttprequest', 'ping', 'csp_report', 'media', 'websocket', 'other']
      }
    }] : [];

    chrome.runtime.sendMessage({
      action: 'updateHeaderRules',
      rules: rules,
      enabled: enabled
    });
  });
}

// 编辑代理配置
function editProxy(proxyName, config) {
  const container = document.querySelector('.container');
  const lang = container.getAttribute('data-lang') || 'zh';
  
  // 填充表单
  document.getElementById('proxy-name').value = proxyName;
  document.getElementById('proxy-scheme').value = config.scheme || 'http';
  document.getElementById('proxy-host').value = config.host || '';
  document.getElementById('proxy-port').value = config.port || '';
  document.getElementById('bypass-list').value = (config.bypassList || []).join('\n');

  // 修改添加按钮文本为保存
  const addProxyBtn = document.getElementById('add-proxy');
  addProxyBtn.innerHTML = `<span data-text="zh">保存</span><span data-text="en">Save</span>`;
  
  // 添加取消按钮
  let cancelBtn = document.getElementById('cancel-edit');
  if (!cancelBtn) {
    cancelBtn = document.createElement('button');
    cancelBtn.id = 'cancel-edit';
    cancelBtn.className = 'btn';
    cancelBtn.innerHTML = `<span data-text="zh">取消</span><span data-text="en">Cancel</span>`;
    addProxyBtn.parentElement.insertBefore(cancelBtn, addProxyBtn);
  }

  // 标记为编辑模式
  addProxyBtn.dataset.editMode = 'true';
  addProxyBtn.dataset.originalName = proxyName;

  // 取消编辑
  cancelBtn.onclick = () => {
    document.getElementById('proxy-name').value = '';
    document.getElementById('proxy-host').value = '';
    document.getElementById('proxy-port').value = '';
    document.getElementById('bypass-list').value = '';
    addProxyBtn.innerHTML = `<span data-text="zh">添加</span><span data-text="en">Add</span>`;
    addProxyBtn.dataset.editMode = 'false';
    delete addProxyBtn.dataset.originalName;
    cancelBtn.remove();
  };

  // 修改添加代理的处理逻辑
  addProxyBtn.onclick = () => {
    const name = document.getElementById('proxy-name').value.trim();
    const scheme = document.getElementById('proxy-scheme').value;
    const host = document.getElementById('proxy-host').value.trim();
    const port = document.getElementById('proxy-port').value.trim();
    const bypassList = document.getElementById('bypass-list').value.trim()
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (!name || !host || !port) {
      alert(lang === 'zh' ? '请填写完整信息' : 'Please fill in all fields');
      return;
    }

    const portNum = parseInt(port);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      alert(lang === 'zh' ? '端口号必须在1-65535之间' : 'Port must be between 1-65535');
      return;
    }

    // 如果修改了名称，检查新名称是否可用
    if (name !== proxyName && (name === 'direct' || name === 'system')) {
      alert(lang === 'zh' ? 
        '不能使用保留的代理名称（direct 或 system）' : 
        'Cannot use reserved proxy names (direct or system)');
      return;
    }

    const config = {
      mode: 'fixed_servers',
      scheme,
      host,
      port: portNum,
      bypassList
    };

    // 如果是编辑模式且修改了名称，需要先删除原配置
    if (name !== proxyName) {
      chrome.runtime.sendMessage(
        { action: 'removeProxyConfig', proxyName: proxyName },
        (response) => {
          if (response.success) {
            addNewConfig();
          }
        }
      );
    } else {
      addNewConfig();
    }

    function addNewConfig() {
      chrome.runtime.sendMessage(
        { action: 'addProxyConfig', proxyName: name, config },
        (response) => {
          if (response.success) {
            // 清空表单
            document.getElementById('proxy-name').value = '';
            document.getElementById('proxy-host').value = '';
            document.getElementById('proxy-port').value = '';
            document.getElementById('bypass-list').value = '';
            
            // 恢复添加按钮
            addProxyBtn.innerHTML = `<span data-text="zh">添加</span><span data-text="en">Add</span>`;
            addProxyBtn.dataset.editMode = 'false';
            delete addProxyBtn.dataset.originalName;
            cancelBtn.remove();
            
            // 重新加载代理列表
            loadProxyList();
          } else {
            const errorMessage = lang === 'zh' ?
              '保存代理失败：' + (response.error || '未知错误') :
              'Failed to save proxy: ' + (response.error || 'Unknown error');
            alert(errorMessage);
          }
        }
      );
    }
  };
}