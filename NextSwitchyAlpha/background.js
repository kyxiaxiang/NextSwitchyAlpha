// 代理配置存储
let proxyConfigs = {};
let currentProxy = 'system';  // 默认使用系统代理
let systemProxyRetryCount = 0;
const MAX_SYSTEM_PROXY_RETRIES = 5;
const SYSTEM_PROXY_RETRY_INTERVAL = 1000;
const SYSTEM_PROXY_CHECK_INTERVAL = 2000;

// 初始化
chrome.runtime.onInstalled.addListener(() => {
  initializeConfigs();
});

// 在扩展启动时也初始化配置
chrome.runtime.onStartup.addListener(() => {
  initializeConfigs();
});

// 初始化配置函数
function initializeConfigs() {
  chrome.storage.local.get(['proxyConfigs', 'currentProxy', 'headerSettings', 'uaSettings'], (result) => {
    if (!result.proxyConfigs) {
      proxyConfigs = {
        'direct': { mode: 'direct' },
        'system': { mode: 'system' }
      };
      chrome.storage.local.set({ proxyConfigs });
    } else {
      proxyConfigs = result.proxyConfigs;
    }

    // 设置默认代理为系统代理
    if (!result.currentProxy) {
      currentProxy = 'system';
      chrome.storage.local.set({ currentProxy });
    } else {
      currentProxy = result.currentProxy;
    }

    // 应用当前代理设置
    applyProxySettings(currentProxy);

    // 应用已保存的请求头规则
    if (result.headerSettings?.enabled) {
      applyHeaderRules(result.headerSettings);
    }
    if (result.uaSettings?.enabled) {
      applyUserAgentRules(result.uaSettings);
    }
  });
}

// 监听存储变化
chrome.storage.onChanged.addListener((changes) => {
  if (changes.proxyConfigs) {
    proxyConfigs = changes.proxyConfigs.newValue || {};
    console.log('代理配置已更新:', proxyConfigs);
  }
  if (changes.currentProxy) {
    currentProxy = changes.currentProxy.newValue;
    console.log('当前代理已更新:', currentProxy);
    applyProxySettings(currentProxy);
  }
});

// 检查代理设置是否匹配预期
async function checkProxySettings() {
  try {
    const config = await new Promise((resolve) => {
      chrome.proxy.settings.get({ incognito: false }, (config) => {
        if (chrome.runtime.lastError) {
          console.error('获取代理设置失败:', chrome.runtime.lastError);
          resolve(null);
        } else {
          resolve(config);
        }
      });
    });

    if (!config) return false;

    const currentConfig = proxyConfigs[currentProxy];
    if (!currentConfig) return false;

    // 检查模式是否匹配
    const isMatching = config.value.mode === currentConfig.mode;
    if (!isMatching) {
      console.log('代理模式不匹配，当前:', config.value.mode, '预期:', currentConfig.mode);
      return false;
    }

    // 系统代理特殊处理
    if (currentConfig.mode === 'system') {
      // 添加额外的系统代理检查
      const systemProxyWorking = await checkSystemProxyEffective();
      if (!systemProxyWorking) {
        console.log('系统代理未生效');
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('检查代理设置时发生错误:', error);
    return false;
  }
}

// 应用代理设置
function applyProxySettings(proxyName) {
  const config = proxyConfigs[proxyName];
  if (!config) {
    console.error('找不到代理配置:', proxyName);
    return;
  }

  let proxySettings = {};

  switch (config.mode) {
    case 'direct':
      proxySettings = { mode: 'direct' };
      break;
    case 'system':
      proxySettings = { mode: 'system' };
      break;
    case 'fixed_servers':
      proxySettings = {
        mode: 'fixed_servers',
        rules: {
          singleProxy: {
            scheme: config.scheme || 'http',
            host: config.host,
            port: parseInt(config.port)
          },
          bypassList: config.bypassList || []
        }
      };
      break;
    case 'pac_script':
      proxySettings = {
        mode: 'pac_script',
        pacScript: {
          url: config.pacUrl || '',
          data: config.pacData || ''
        }
      };
      break;
  }

  try {
    // 在应用新设置之前，先确保配置已经保存到存储中
    chrome.storage.local.set({ proxyConfigs, currentProxy: proxyName }, () => {
      if (chrome.runtime.lastError) {
        console.error('保存配置失败:', chrome.runtime.lastError);
        return;
      }

      // 直接应用新的代理设置，不再先清除
      chrome.proxy.settings.set(
        { value: proxySettings, scope: 'regular' },
        () => {
          if (chrome.runtime.lastError) {
            console.error('代理设置应用失败:', chrome.runtime.lastError);
            if (config.mode === 'system' && systemProxyRetryCount < MAX_SYSTEM_PROXY_RETRIES) {
              systemProxyRetryCount++;
              setTimeout(() => applyProxySettings(proxyName), SYSTEM_PROXY_RETRY_INTERVAL);
            }
          } else {
            console.log('代理设置已应用:', proxyName, proxySettings);
            systemProxyRetryCount = 0;
            updateIcon(proxyName);
            
            // 验证设置是否成功应用
            setTimeout(() => {
              checkProxySettings().then(isValid => {
                if (!isValid) {
                  console.warn('代理设置可能未正确应用，尝试重新应用');
                  if (systemProxyRetryCount < MAX_SYSTEM_PROXY_RETRIES) {
                    systemProxyRetryCount++;
                    applyProxySettings(proxyName);
                  }
                }
              });
            }, 500);

            if (config.mode === 'system') {
              startSystemProxyMonitor();
            } else {
              stopSystemProxyMonitor();
            }
          }
        }
      );
    });
  } catch (error) {
    console.error('应用代理设置时发生错误:', error);
    if (config.mode === 'system' && systemProxyRetryCount < MAX_SYSTEM_PROXY_RETRIES) {
      systemProxyRetryCount++;
      setTimeout(() => applyProxySettings(proxyName), SYSTEM_PROXY_RETRY_INTERVAL);
    }
  }
}

// 新增：检查系统代理是否真正生效
async function checkSystemProxyEffective() {
  try {
    const config = await new Promise((resolve) => {
      chrome.proxy.settings.get({ incognito: false }, (config) => resolve(config));
    });

    // 检查是否为系统代理模式
    if (!config || config.value.mode !== 'system') {
      return false;
    }

    // 检查控制级别
    if (!config.levelOfControl || 
        !['controlled_by_this_extension', 'controlled_by_other_extensions'].includes(config.levelOfControl)) {
      console.log('代理控制级别不正确:', config.levelOfControl);
      return false;
    }

    return true;
  } catch (error) {
    console.error('检查系统代理状态时发生错误:', error);
    return false;
  }
}

// 验证系统代理是否生效
async function verifySystemProxy() {
  try {
    const config = await new Promise((resolve) => {
      chrome.proxy.settings.get({ incognito: false }, (config) => {
        resolve(config);
      });
    });

    if (!config || config.value.mode !== 'system') {
      console.log('系统代理未生效，重试...');
      if (systemProxyRetryCount < MAX_SYSTEM_PROXY_RETRIES) {
        systemProxyRetryCount++;
        setTimeout(() => applyProxySettings('system'), SYSTEM_PROXY_RETRY_INTERVAL);
      }
    } else {
      console.log('系统代理已生效');
      systemProxyRetryCount = 0;
    }
  } catch (error) {
    console.error('验证系统代理时发生错误:', error);
  }
}

// 系统代理监控
let systemProxyMonitorInterval = null;

function startSystemProxyMonitor() {
  stopSystemProxyMonitor();

  systemProxyMonitorInterval = setInterval(async () => {
    if (currentProxy === 'system') {
      const isValid = await checkSystemProxyEffective();
      if (!isValid) {
        console.log('检测到系统代理设置异常，尝试恢复...');
        applyProxySettings('system');
      }
      updateSystemProxyStatus(isValid);
    }
  }, SYSTEM_PROXY_CHECK_INTERVAL);
}

function stopSystemProxyMonitor() {
  if (systemProxyMonitorInterval) {
    clearInterval(systemProxyMonitorInterval);
    systemProxyMonitorInterval = null;
  }
}

// 更新系统代理状态
function updateSystemProxyStatus(isWorking) {
  chrome.action.setBadgeText({ 
    text: currentProxy === 'system' ? (isWorking ? 'S' : '!S') : (currentProxy === 'direct' ? '' : 'P')
  });
  chrome.action.setBadgeBackgroundColor({ 
    color: isWorking ? '#4285f4' : '#f44336'
  });
}

// 更新图标状态
function updateIcon(proxyName) {
  if (proxyName === 'direct') {
    chrome.action.setBadgeText({ text: '' });
  } else if (proxyName === 'system') {
    checkProxySettings().then(isValid => {
      updateSystemProxyStatus(isValid);
    });
  } else {
    chrome.action.setBadgeText({ text: 'P' });
    chrome.action.setBadgeBackgroundColor({ color: '#4285f4' });
  }
}

// 应用请求头规则
function applyHeaderRules(settings) {
  if (!settings.enabled || !settings.ip || !settings.headers) return;

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

  updateDynamicRules(rules);
}

// 应用User-Agent规则
function applyUserAgentRules(settings) {
  if (!settings.enabled || !settings.userAgent) return;

  const rules = [{
    id: 51,
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
  }];

  updateDynamicRules(rules);
}

// 更新动态规则
function updateDynamicRules(rules) {
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: Array.from({ length: 100 }, (_, i) => i + 1), // 移除所有现有规则
    addRules: rules
  }, () => {
    if (chrome.runtime.lastError) {
      console.error('更新规则失败:', chrome.runtime.lastError);
    } else {
      console.log('规则已更新:', rules);
    }
  });
}

// 监听来自弹出窗口的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getProxyConfigs') {
    // 从存储中重新获取最新配置
    chrome.storage.local.get(['proxyConfigs', 'currentProxy'], (result) => {
      proxyConfigs = result.proxyConfigs || {
        'direct': { mode: 'direct' },
        'system': { mode: 'system' }
      };
      currentProxy = result.currentProxy || 'system';
      sendResponse({ proxyConfigs, currentProxy });
    });
    return true; // 保持消息通道开放
  } else if (message.action === 'setCurrentProxy') {
    currentProxy = message.proxyName;
    chrome.storage.local.set({ currentProxy }, () => {
      if (chrome.runtime.lastError) {
        console.error('保存当前代理失败:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log('当前代理已保存:', currentProxy);
        sendResponse({ success: true });
      }
    });
    return true; // 保持消息通道开放
  } else if (message.action === 'addProxyConfig') {
    const config = message.config;
    proxyConfigs[config.name] = config;
    
    chrome.storage.local.set({ proxyConfigs }, () => {
      if (chrome.runtime.lastError) {
        console.error('保存代理配置失败:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log('代理配置已保存:', config);
        sendResponse({ success: true });
      }
    });
    return true; // 保持消息通道开放
  } else if (message.action === 'removeProxyConfig') {
    if (message.proxyName !== 'direct' && message.proxyName !== 'system') {
      delete proxyConfigs[message.proxyName];
      
      chrome.storage.local.set({ proxyConfigs }, () => {
        if (chrome.runtime.lastError) {
          console.error('删除代理配置失败:', chrome.runtime.lastError);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          console.log('代理配置已删除:', message.proxyName);
          if (currentProxy === message.proxyName) {
            currentProxy = 'direct';
            chrome.storage.local.set({ currentProxy });
          }
          sendResponse({ success: true });
        }
      });
    } else {
      sendResponse({ success: false, error: '无法删除默认配置' });
    }
    return true; // 保持消息通道开放
  } else if (message.action === 'testProxyConfig') {
    // 保存当前配置
    const previousProxy = currentProxy;
    const previousSettings = proxyConfigs[currentProxy];

    // 临时应用测试配置
    const testConfig = message.config;
    let proxySettings = {};

    switch (testConfig.mode) {
      case 'direct':
        proxySettings = { mode: 'direct' };
        break;
      case 'system':
        proxySettings = { mode: 'system' };
        break;
      case 'fixed_servers':
        proxySettings = {
          mode: 'fixed_servers',
          rules: {
            singleProxy: {
              scheme: testConfig.scheme || 'http',
              host: testConfig.host,
              port: parseInt(testConfig.port)
            },
            bypassList: testConfig.bypassList || []
          }
        };
        break;
      case 'pac_script':
        proxySettings = {
          mode: 'pac_script',
          pacScript: {
            url: testConfig.pacUrl || '',
            data: testConfig.pacData || ''
          }
        };
        break;
    }

    // 应用测试设置
    chrome.proxy.settings.set(
      { value: proxySettings, scope: 'regular' },
      () => {
        sendResponse({ success: true });

        // 3秒后恢复原始设置
        setTimeout(() => {
          applyProxySettings(previousProxy);
        }, 3000);
      }
    );

    return true; // 保持消息通道开放
  } else if (message.action === 'updateHeaderRules') {
    if (message.enabled) {
      updateDynamicRules(message.rules);
    } else {
      updateDynamicRules([]);
    }
    sendResponse({ success: true });
  }
  return true;
});