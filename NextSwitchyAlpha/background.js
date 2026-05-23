'use strict';

// ====== State ======
let state = {
  proxyConfigs: {
    direct: { name: 'direct', mode: 'direct' },
    system: { name: 'system', mode: 'system' }
  },
  currentProxy: 'direct',
  autoSwitch: { enabled: false, defaultProxy: 'direct', rules: [] }
};

let systemProxyMonitorInterval = null;

// ====== Init ======
chrome.runtime.onInstalled.addListener(initialize);
chrome.runtime.onStartup.addListener(initialize);

async function initialize() {
  const data = await chrome.storage.local.get([
    'proxyConfigs', 'currentProxy', 'autoSwitch',
    'xffSettings', 'uaSettings', 'headerRules',
    'headerSettings', 'customHeaders' // old schema keys for migration
  ]);

  // Merge proxy configs (preserve defaults)
  if (data.proxyConfigs) {
    state.proxyConfigs = {
      direct: { name: 'direct', mode: 'direct' },
      system: { name: 'system', mode: 'system' },
      ...data.proxyConfigs
    };
  } else {
    await chrome.storage.local.set({ proxyConfigs: state.proxyConfigs });
  }

  state.currentProxy = data.currentProxy || 'direct';
  state.autoSwitch = data.autoSwitch || { enabled: false, defaultProxy: 'direct', rules: [] };

  // Migrate old schema to new schema
  await migrateOldSchema(data);

  applyCurrentProxy();

  const fresh = await chrome.storage.local.get(['xffSettings', 'uaSettings', 'headerRules']);
  await rebuildDynamicRules(fresh);
}

async function migrateOldSchema(data) {
  const updates = {};

  if (data.headerSettings && !data.xffSettings) {
    updates.xffSettings = {
      enabled: data.headerSettings.enabled || false,
      ip: data.headerSettings.ip || '',
      headers: data.headerSettings.headers || ['x-forwarded-for'],
      urlPattern: ''
    };
  }

  if (data.customHeaders && !data.headerRules) {
    const ch = data.customHeaders;
    const rules = (ch.headers || []).map((h, i) => ({
      id: `migrated_${i}`,
      enabled: ch.enabled && (h.enabled !== false),
      urlPattern: '',
      requestHeaders: [{ header: h.name, value: h.value, operation: 'set' }],
      responseHeaders: []
    }));
    updates.headerRules = rules;
  }

  if (Object.keys(updates).length > 0) {
    await chrome.storage.local.set(updates);
  }
}

// ====== Storage Listeners ======
chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area !== 'local') return;

  let needRebuild = false;

  if (changes.proxyConfigs) {
    state.proxyConfigs = {
      direct: { name: 'direct', mode: 'direct' },
      system: { name: 'system', mode: 'system' },
      ...changes.proxyConfigs.newValue
    };
  }
  if (changes.currentProxy) {
    state.currentProxy = changes.currentProxy.newValue;
    if (!state.autoSwitch.enabled) applyProxyConfig(state.currentProxy);
  }
  if (changes.autoSwitch) {
    state.autoSwitch = changes.autoSwitch.newValue;
    applyCurrentProxy();
  }
  if (changes.xffSettings || changes.uaSettings || changes.headerRules) {
    needRebuild = true;
  }

  if (needRebuild) {
    const data = await chrome.storage.local.get(['xffSettings', 'uaSettings', 'headerRules']);
    await rebuildDynamicRules(data);
  }
});

// ====== Proxy Application ======
function applyCurrentProxy() {
  if (state.autoSwitch.enabled && state.autoSwitch.rules.filter(r => r.enabled).length > 0) {
    applyPacScript();
  } else if (state.autoSwitch.enabled) {
    applyProxyConfig(state.autoSwitch.defaultProxy || 'direct');
  } else {
    applyProxyConfig(state.currentProxy);
  }
}

function generatePacScript() {
  const { rules, defaultProxy } = state.autoSwitch;

  const proxyStr = (name) => {
    const cfg = state.proxyConfigs[name];
    if (!cfg || cfg.mode === 'direct') return '"DIRECT"';
    if (cfg.mode === 'system') return '"DIRECT"';
    const { scheme = 'http', host, port } = cfg;
    if (scheme === 'socks5') return `"SOCKS5 ${host}:${port}; DIRECT"`;
    if (scheme === 'socks4') return `"SOCKS ${host}:${port}; DIRECT"`;
    if (scheme === 'https') return `"HTTPS ${host}:${port}; DIRECT"`;
    return `"PROXY ${host}:${port}; DIRECT"`;
  };

  const lines = rules
    .filter(r => r.enabled && r.pattern && r.proxy)
    .map(r => {
      const p = proxyStr(r.proxy);
      if (r.patternType === 'regex') {
        return `  try { if (/${r.pattern}/i.test(url)) return ${p}; } catch(e) {}`;
      }
      return `  if (shExpMatch(url, ${JSON.stringify(r.pattern)})) return ${p};`;
    })
    .join('\n');

  return `function FindProxyForURL(url, host) {\n${lines}\n  return ${proxyStr(defaultProxy || 'direct')};\n}`;
}

function applyPacScript() {
  const data = generatePacScript();
  chrome.proxy.settings.set(
    { value: { mode: 'pac_script', pacScript: { data } }, scope: 'regular' },
    () => {
      if (chrome.runtime.lastError) {
        console.error('PAC apply failed:', chrome.runtime.lastError);
      } else {
        setBadge('⚡', '#f59e0b');
      }
    }
  );
}

function applyProxyConfig(name) {
  const cfg = state.proxyConfigs[name];
  if (!cfg) return;

  let value = {};
  switch (cfg.mode) {
    case 'direct':
      value = { mode: 'direct' };
      break;
    case 'system':
      value = { mode: 'system' };
      break;
    case 'fixed_servers':
      value = {
        mode: 'fixed_servers',
        rules: {
          singleProxy: { scheme: cfg.scheme || 'http', host: cfg.host, port: parseInt(cfg.port) },
          bypassList: cfg.bypassList || []
        }
      };
      break;
    case 'pac_script':
      value = {
        mode: 'pac_script',
        pacScript: cfg.pacUrl ? { url: cfg.pacUrl } : { data: cfg.pacData || '' }
      };
      break;
    default:
      return;
  }

  chrome.proxy.settings.set({ value, scope: 'regular' }, () => {
    if (chrome.runtime.lastError) {
      console.error('Proxy apply failed:', chrome.runtime.lastError);
      return;
    }
    updateBadgeForProxy(name, cfg);
    if (cfg.mode === 'system') {
      startSystemProxyMonitor();
    } else {
      stopSystemProxyMonitor();
    }
  });
}

// ====== Badge ======
function setBadge(text, color) {
  chrome.action.setBadgeText({ text: text || '' });
  if (color) chrome.action.setBadgeBackgroundColor({ color });
}

function updateBadgeForProxy(name, cfg) {
  if (name === 'direct') {
    setBadge('');
  } else if (name === 'system') {
    setBadge('SYS', '#10b981');
  } else {
    const scheme = cfg.scheme || 'http';
    const label = scheme === 'socks5' ? 'S5' : scheme === 'socks4' ? 'S4' : scheme === 'https' ? 'TLS' : scheme.toUpperCase().slice(0, 4);
    setBadge(label, cfg.color || '#6366f1');
  }
}

// ====== System Proxy Monitor ======
function startSystemProxyMonitor() {
  stopSystemProxyMonitor();
  systemProxyMonitorInterval = setInterval(async () => {
    if (state.currentProxy !== 'system' || state.autoSwitch.enabled) return;
    const cfg = await new Promise(r => chrome.proxy.settings.get({ incognito: false }, r));
    const ok = cfg?.value?.mode === 'system' &&
      ['controlled_by_this_extension', 'controlled_by_other_extensions'].includes(cfg.levelOfControl);
    setBadge(ok ? 'SYS' : '!SYS', ok ? '#10b981' : '#ef4444');
  }, 5000);
}

function stopSystemProxyMonitor() {
  if (systemProxyMonitorInterval) {
    clearInterval(systemProxyMonitorInterval);
    systemProxyMonitorInterval = null;
  }
}

// ====== Dynamic Header Rules ======
const RESOURCE_TYPES = [
  'main_frame', 'sub_frame', 'stylesheet', 'script', 'image',
  'font', 'object', 'xmlhttprequest', 'ping', 'media', 'websocket', 'other'
];

const ID_XFF = 1;
const ID_UA = 2;
const ID_CUSTOM_BASE = 10;
const ID_CUSTOM_MAX = 149;

async function rebuildDynamicRules(data) {
  const rules = [];

  // XFF rule
  const xff = data.xffSettings;
  if (xff?.enabled && xff?.ip && xff?.headers?.length) {
    const condition = buildCondition(xff.urlPattern);
    rules.push({
      id: ID_XFF,
      priority: 2,
      action: {
        type: 'modifyHeaders',
        requestHeaders: xff.headers.map(h => ({ header: h, operation: 'set', value: xff.ip }))
      },
      condition
    });
  }

  // UA rule
  const ua = data.uaSettings;
  if (ua?.enabled && ua?.value) {
    const condition = buildCondition(ua.urlPattern, ['main_frame', 'sub_frame', 'xmlhttprequest']);
    rules.push({
      id: ID_UA,
      priority: 2,
      action: {
        type: 'modifyHeaders',
        requestHeaders: [{ header: 'user-agent', operation: 'set', value: ua.value }]
      },
      condition
    });
  }

  // Custom header rules
  const headerRules = data.headerRules || [];
  let ruleIdx = 0;
  for (const rule of headerRules) {
    if (!rule.enabled) continue;
    const id = ID_CUSTOM_BASE + ruleIdx;
    if (id > ID_CUSTOM_MAX) break;

    const reqHeaders = (rule.requestHeaders || []).filter(h => h.header && (h.value || h.operation === 'remove'));
    const resHeaders = (rule.responseHeaders || []).filter(h => h.header && (h.value || h.operation === 'remove'));
    if (!reqHeaders.length && !resHeaders.length) continue;

    const action = { type: 'modifyHeaders' };
    if (reqHeaders.length) action.requestHeaders = reqHeaders;
    if (resHeaders.length) action.responseHeaders = resHeaders;

    rules.push({ id, priority: 1, action, condition: buildCondition(rule.urlPattern) });
    ruleIdx++;
  }

  // Remove all managed IDs and re-add
  const removeIds = [ID_XFF, ID_UA, ...Array.from({ length: ID_CUSTOM_MAX - ID_CUSTOM_BASE + 1 }, (_, i) => ID_CUSTOM_BASE + i)];
  try {
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: removeIds, addRules: rules });
  } catch (e) {
    console.error('Rule update failed:', e);
  }
}

function buildCondition(urlPattern, resourceTypes) {
  const condition = { resourceTypes: resourceTypes || RESOURCE_TYPES };
  if (urlPattern && urlPattern.trim()) {
    try {
      // Validate regex by constructing it
      const regex = wildcardToRegex(urlPattern);
      new RegExp(regex);
      condition.regexFilter = regex;
    } catch (e) {
      condition.urlFilter = '*';
    }
  } else {
    condition.urlFilter = '*';
  }
  return condition;
}

function wildcardToRegex(pattern) {
  return pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.');
}

// ====== Message Handler ======
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  handleMessage(msg).then(
    data => sendResponse({ ok: true, data }),
    err => sendResponse({ ok: false, error: err.message })
  );
  return true;
});

async function handleMessage(msg) {
  switch (msg.action) {

    case 'getState': {
      const data = await chrome.storage.local.get([
        'proxyConfigs', 'currentProxy', 'autoSwitch',
        'xffSettings', 'uaSettings', 'headerRules', 'appSettings'
      ]);
      return {
        proxyConfigs: data.proxyConfigs || state.proxyConfigs,
        currentProxy: data.currentProxy || state.currentProxy,
        autoSwitch: data.autoSwitch || state.autoSwitch,
        xffSettings: data.xffSettings || { enabled: false, ip: '', headers: ['x-forwarded-for'], urlPattern: '' },
        uaSettings: data.uaSettings || { enabled: false, value: '', urlPattern: '' },
        headerRules: data.headerRules || [],
        appSettings: data.appSettings || { theme: 'auto', language: 'zh' }
      };
    }

    case 'setCurrentProxy': {
      state.currentProxy = msg.name;
      await chrome.storage.local.set({ currentProxy: msg.name });
      if (!state.autoSwitch.enabled) applyProxyConfig(msg.name);
      return null;
    }

    case 'saveProxyConfig': {
      state.proxyConfigs[msg.config.name] = msg.config;
      await chrome.storage.local.set({ proxyConfigs: state.proxyConfigs });
      return null;
    }

    case 'removeProxyConfig': {
      if (msg.name === 'direct' || msg.name === 'system') throw new Error('Cannot remove default proxies');
      delete state.proxyConfigs[msg.name];
      await chrome.storage.local.set({ proxyConfigs: state.proxyConfigs });
      if (state.currentProxy === msg.name) {
        state.currentProxy = 'direct';
        await chrome.storage.local.set({ currentProxy: 'direct' });
        if (!state.autoSwitch.enabled) applyProxyConfig('direct');
      }
      return null;
    }

    case 'setAutoSwitch': {
      state.autoSwitch = msg.autoSwitch;
      await chrome.storage.local.set({ autoSwitch: state.autoSwitch });
      applyCurrentProxy();
      return null;
    }

    case 'saveXffSettings': {
      await chrome.storage.local.set({ xffSettings: msg.settings });
      return null;
    }

    case 'saveUaSettings': {
      await chrome.storage.local.set({ uaSettings: msg.settings });
      return null;
    }

    case 'saveHeaderRules': {
      await chrome.storage.local.set({ headerRules: msg.rules });
      return null;
    }

    case 'saveAppSettings': {
      await chrome.storage.local.set({ appSettings: msg.settings });
      return null;
    }

    case 'testUrl': {
      if (!state.autoSwitch.enabled) {
        return { proxy: state.currentProxy, reason: 'auto-switch disabled' };
      }
      for (const rule of state.autoSwitch.rules) {
        if (!rule.enabled || !rule.pattern) continue;
        let matched = false;
        try {
          if (rule.patternType === 'regex') {
            matched = new RegExp(rule.pattern, 'i').test(msg.url);
          } else {
            const regex = new RegExp(wildcardToRegex(rule.pattern), 'i');
            matched = regex.test(msg.url);
          }
        } catch (e) { continue; }
        if (matched) return { proxy: rule.proxy, reason: `Rule: ${rule.pattern}` };
      }
      return { proxy: state.autoSwitch.defaultProxy || 'direct', reason: 'Default (no match)' };
    }

    case 'importConfig': {
      const cfg = msg.config;
      const updates = {};
      if (cfg.proxyConfigs) {
        state.proxyConfigs = {
          direct: { name: 'direct', mode: 'direct' },
          system: { name: 'system', mode: 'system' },
          ...cfg.proxyConfigs
        };
        updates.proxyConfigs = state.proxyConfigs;
      }
      if (cfg.currentProxy != null) updates.currentProxy = cfg.currentProxy;
      if (cfg.autoSwitch != null) { state.autoSwitch = cfg.autoSwitch; updates.autoSwitch = cfg.autoSwitch; }
      if (cfg.xffSettings != null) updates.xffSettings = cfg.xffSettings;
      if (cfg.uaSettings != null) updates.uaSettings = cfg.uaSettings;
      if (cfg.headerRules != null) updates.headerRules = cfg.headerRules;
      if (cfg.appSettings != null) updates.appSettings = cfg.appSettings;
      await chrome.storage.local.set(updates);
      applyCurrentProxy();
      const fresh = await chrome.storage.local.get(['xffSettings', 'uaSettings', 'headerRules']);
      await rebuildDynamicRules(fresh);
      return null;
    }

    case 'resetConfig': {
      state.proxyConfigs = { direct: { name: 'direct', mode: 'direct' }, system: { name: 'system', mode: 'system' } };
      state.currentProxy = 'direct';
      state.autoSwitch = { enabled: false, defaultProxy: 'direct', rules: [] };
      await chrome.storage.local.set({
        proxyConfigs: state.proxyConfigs,
        currentProxy: 'direct',
        autoSwitch: state.autoSwitch,
        xffSettings: { enabled: false, ip: '', headers: ['x-forwarded-for'], urlPattern: '' },
        uaSettings: { enabled: false, value: '', urlPattern: '' },
        headerRules: []
      });
      applyProxyConfig('direct');
      await rebuildDynamicRules({ xffSettings: null, uaSettings: null, headerRules: [] });
      return null;
    }

    default:
      throw new Error('Unknown action: ' + msg.action);
  }
}
