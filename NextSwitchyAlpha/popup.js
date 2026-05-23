'use strict';

// ====== i18n ======
const I18N = {
  zh: {
    tab_proxy: '代理', tab_headers: '请求头', tab_rules: '规则', tab_settings: '设置',
    proxy_form_title: '添加代理', proxy_name: '代理名称', proxy_host: '主机地址',
    proxy_port: '端口', proxy_user: '用户名（可选）', proxy_pass: '密码（可选）',
    proxy_bypass: '不代理的地址，每行一个\n例: *.local', proxy_color: '标签颜色',
    pac_url: 'PAC URL, 例: http://...',
    add_proxy: '+ 添加代理', edit_proxy: '编辑代理', save: '保存', cancel: '取消', add: '添加',
    xff_headers: '选择要注入的头', xff_ip: 'IP 地址', xff_ip_ph: '例: 1.2.3.4（留空=自动随机）',
    url_filter: 'URL 过滤（留空 = 全部）', url_filter_ph: '例: *.example.com',
    ua_value: 'User-Agent 字符串', ua_ph: '输入 User-Agent 或选择预设',
    ua_mobile: '移动端', ua_desktop: '桌面端', ua_crawler: '爬虫', ua_random: '随机',
    random_btn: '随机',
    custom_headers: '自定义请求头 / 响应头',
    add_header_rule: '添加规则', header_name: 'Header 名称', header_value: '值',
    req_header: 'REQ', res_header: 'RES',
    op_set: '设置', op_append: '追加', op_remove: '删除',
    auto_switch: '自动切换代理', add_rule: '+ 添加规则',
    default_proxy: '默认代理:', rule_pattern: 'URL 模式',
    rule_pattern_ph: '例: *.google.com 或 *github*',
    wildcard: '通配符', regex: '正则', use_proxy: '使用代理', test: '测试',
    test_url_ph: '测试 URL... 例: https://google.com',
    appearance: '外观', theme: '主题', language: '语言',
    theme_light: '浅色', theme_auto: '自动', theme_dark: '深色',
    data_management: '数据管理', export_config: '导出配置',
    import_config: '导入配置', reset_config: '恢复默认设置',
    author_label: '作者: 可以遐想 (keyixiaxiang)',
    tagline: '超越 SwitchyOmega · ModHeader · XFF Header',
    direct: '直连', system: '系统代理',
    auto_on: '自动切换已开启', auto_off: '自动切换已关闭',
    saved: '已保存', deleted: '已删除', imported: '导入成功', reset_done: '已重置',
    confirm_delete: '确认删除？', confirm_reset: '确认重置所有设置？',
    err_name_required: '请输入代理名称', err_host_required: '请输入主机地址',
    err_port_invalid: '端口无效（1-65535）', err_name_exists: '名称已存在',
    err_ip_invalid: 'IP 地址格式不正确',
    xff_saved: 'XFF 设置已保存', ua_saved: 'UA 设置已保存',
    no_rules: '暂无规则，点击上方添加',
    no_headers: '暂无规则，在下方添加',
  },
  en: {
    tab_proxy: 'Proxy', tab_headers: 'Headers', tab_rules: 'Rules', tab_settings: 'Settings',
    proxy_form_title: 'Add Proxy', proxy_name: 'Proxy Name', proxy_host: 'Host Address',
    proxy_port: 'Port', proxy_user: 'Username (optional)', proxy_pass: 'Password (optional)',
    proxy_bypass: 'Bypass list, one per line\ne.g. *.local', proxy_color: 'Label Color',
    pac_url: 'PAC URL, e.g. http://...',
    add_proxy: '+ Add Proxy', edit_proxy: 'Edit Proxy', save: 'Save', cancel: 'Cancel', add: 'Add',
    xff_headers: 'Select headers to inject', xff_ip: 'IP Address', xff_ip_ph: 'e.g. 1.2.3.4 (empty = random)',
    url_filter: 'URL Filter (empty = all)', url_filter_ph: 'e.g. *.example.com',
    ua_value: 'User-Agent String', ua_ph: 'Enter User-Agent or choose preset',
    ua_mobile: 'Mobile', ua_desktop: 'Desktop', ua_crawler: 'Crawler', ua_random: 'Random',
    random_btn: 'Random',
    custom_headers: 'Custom Request / Response Headers',
    add_header_rule: 'Add Rule', header_name: 'Header Name', header_value: 'Value',
    req_header: 'REQ', res_header: 'RES',
    op_set: 'Set', op_append: 'Append', op_remove: 'Remove',
    auto_switch: 'Auto-Switch Proxy', add_rule: '+ Add Rule',
    default_proxy: 'Default proxy:', rule_pattern: 'URL Pattern',
    rule_pattern_ph: 'e.g. *.google.com or *github*',
    wildcard: 'Wildcard', regex: 'Regex', use_proxy: 'Use Proxy', test: 'Test',
    test_url_ph: 'Test URL... e.g. https://google.com',
    appearance: 'Appearance', theme: 'Theme', language: 'Language',
    theme_light: 'Light', theme_auto: 'Auto', theme_dark: 'Dark',
    data_management: 'Data Management', export_config: 'Export Config',
    import_config: 'Import Config', reset_config: 'Reset to Defaults',
    author_label: 'Author: keyixiaxiang',
    tagline: 'Surpasses SwitchyOmega · ModHeader · XFF Header',
    direct: 'Direct', system: 'System Proxy',
    auto_on: 'Auto-switch enabled', auto_off: 'Auto-switch disabled',
    saved: 'Saved', deleted: 'Deleted', imported: 'Imported', reset_done: 'Reset done',
    confirm_delete: 'Confirm delete?', confirm_reset: 'Reset all settings?',
    err_name_required: 'Please enter proxy name', err_host_required: 'Please enter host',
    err_port_invalid: 'Invalid port (1-65535)', err_name_exists: 'Name already exists',
    err_ip_invalid: 'Invalid IP address format',
    xff_saved: 'XFF settings saved', ua_saved: 'UA settings saved',
    no_rules: 'No rules yet. Click above to add.',
    no_headers: 'No header rules yet. Add below.',
  }
};

const UA_PRESETS = {
  mobile: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  desktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  crawler: 'Googlebot/2.1 (+http://www.google.com/bot.html)',
};

const UA_POOL = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
];

const HDR_SUGGESTIONS = {
  request: ['Accept','Accept-Charset','Accept-Encoding','Accept-Language','Authorization',
    'Cache-Control','Connection','Content-Type','Cookie','DNT','Host','If-Modified-Since',
    'If-None-Match','Origin','Pragma','Referer','User-Agent','X-Forwarded-For',
    'X-Forwarded-Proto','X-Forwarded-Host','X-Real-IP','X-Requested-With','X-API-Key',
    'X-Auth-Token','X-Session-ID','X-Client-IP','X-Device-ID','X-App-Version',
    'X-Platform','CF-Connecting-IP','True-Client-IP','Forwarded','Via'],
  response: ['Access-Control-Allow-Origin','Access-Control-Allow-Methods','Access-Control-Allow-Headers',
    'Access-Control-Allow-Credentials','Access-Control-Max-Age','Cache-Control',
    'Content-Security-Policy','Content-Type','Referrer-Policy','Set-Cookie',
    'Strict-Transport-Security','X-Content-Type-Options','X-Frame-Options',
    'X-XSS-Protection','X-Powered-By','Server','ETag','Last-Modified','Vary','Timing-Allow-Origin']
};

// ====== State ======
let appState = null;
let lang = 'zh';
let currentTheme = 'auto';
let pfEditName = null;
let rfEditId = null;

// ====== Utils ======
function t(key) { return (I18N[lang] || I18N.zh)[key] || key; }
function generateId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function randomIp() { const o = () => Math.floor(Math.random() * 254) + 1; return `${o()}.${o()}.${o()}.${o()}`; }
function escapeHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function isValidIp(ip) {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(ip) && ip.split('.').every(n => +n >= 0 && +n <= 255);
}

function proxyDisplayName(name, configs) {
  if (name === 'direct') return t('direct');
  if (name === 'system') return t('system');
  return (configs || appState?.proxyConfigs || {})[name]?.name || name;
}

function proxyDetail(cfg) {
  if (!cfg || cfg.mode === 'direct') return '';
  if (cfg.mode === 'system') return '';
  if (cfg.mode === 'fixed_servers') return `${cfg.scheme || 'http'}://${cfg.host}:${cfg.port}`;
  if (cfg.mode === 'pac_script') return cfg.pacUrl || 'Inline PAC';
  return '';
}

function proxyColor(name, cfg) {
  if (name === 'direct') return '#10b981';
  if (name === 'system') return '#6366f1';
  return cfg?.color || '#6366f1';
}

function showToast(msg, ms = 2200) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), ms);
}

async function sendMsg(action, data = {}) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action, ...data }, res => {
      if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
      if (!res) return reject(new Error('No response'));
      if (!res.ok) return reject(new Error(res.error || 'Error'));
      resolve(res.data);
    });
  });
}

// ====== Theme ======
function applyTheme(theme) {
  currentTheme = theme;
  const dark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  const labels = { auto: 'A', light: 'L', dark: 'D' };
  document.getElementById('theme-btn').textContent = labels[theme] || 'A';
  document.querySelectorAll('[data-theme-opt]').forEach(b => b.classList.toggle('active', b.dataset.themeOpt === theme));
}

// ====== Language ======
function applyLanguage(newLang) {
  lang = newLang;
  document.getElementById('lang-btn').textContent = lang === 'zh' ? 'EN' : '中';
  document.querySelectorAll('[data-lang]').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const v = t(el.getAttribute('data-i18n'));
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.placeholder = v;
    else el.textContent = v;
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    el.placeholder = t(el.getAttribute('data-i18n-ph'));
  });
  if (appState) { renderProxyList(); renderHeaderRules(); renderRuleList(); populateProxySelects(); }
}

// ====== Status Bar ======
function updateStatusBar() {
  if (!appState) return;
  const label = document.getElementById('status-label');
  const dot = document.getElementById('status-dot');
  dot.className = 'status-dot';

  if (appState.autoSwitch?.enabled) {
    label.textContent = 'Auto';
    dot.classList.add('auto');
    return;
  }

  const name = appState.currentProxy || 'direct';
  label.textContent = proxyDisplayName(name, appState.proxyConfigs);
  dot.classList.add(name === 'direct' ? 'active' : 'proxy');
}

// ====== Tabs ======
function initTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
    });
  });
}

// ====== Proxy Panel ======
function renderProxyList() {
  const list = document.getElementById('proxy-list');
  const { proxyConfigs = {}, currentProxy, autoSwitch } = appState;
  const activeProxy = autoSwitch?.enabled ? null : currentProxy;

  const defaults = ['direct', 'system'].filter(n => proxyConfigs[n]).map(n => ({ name: n, cfg: proxyConfigs[n], isDefault: true }));
  const customs = Object.entries(proxyConfigs)
    .filter(([n]) => n !== 'direct' && n !== 'system')
    .map(([name, cfg]) => ({ name, cfg, isDefault: false }));

  const all = [...defaults, ...customs];
  if (!all.length) { list.innerHTML = ''; return; }

  list.innerHTML = '';
  all.forEach(({ name, cfg, isDefault }, idx) => {
    if (idx === 2 && customs.length > 0) {
      const sep = document.createElement('div'); sep.className = 'proxy-divider'; list.appendChild(sep);
    }

    const item = document.createElement('div');
    item.className = 'proxy-item' + (name === activeProxy ? ' active' : '');

    const color = proxyColor(name, cfg);
    const detail = proxyDetail(cfg);
    const badge = (!isDefault && cfg.scheme) ? escapeHtml(cfg.scheme.toUpperCase()) : '';
    const sysDot = name === 'system' ? `<span class="proxy-sys-dot" id="sys-dot"></span>` : '';

    item.innerHTML = `
      <span class="proxy-color-dot" style="background:${escapeHtml(color)}"></span>
      <div class="proxy-info">
        <div class="proxy-name">${escapeHtml(proxyDisplayName(name, proxyConfigs))}</div>
        ${detail ? `<div class="proxy-detail">${escapeHtml(detail)}</div>` : ''}
      </div>
      ${badge ? `<span class="proxy-badge">${badge}</span>` : ''}
      ${sysDot}
      <div class="proxy-item-actions">
        ${!isDefault ? `<button class="btn btn-icon" data-edit="${escapeHtml(name)}">&#9998;</button>` : ''}
        ${!isDefault ? `<button class="btn btn-icon danger" data-del="${escapeHtml(name)}">&#10005;</button>` : ''}
      </div>
    `;

    item.addEventListener('click', e => {
      const editBtn = e.target.closest('[data-edit]');
      const delBtn = e.target.closest('[data-del]');
      if (editBtn) { startEditProxy(editBtn.dataset.edit); return; }
      if (delBtn) { deleteProxy(delBtn.dataset.del); return; }
      switchProxy(name);
    });

    list.appendChild(item);
  });
}

async function switchProxy(name) {
  try {
    await sendMsg('setCurrentProxy', { name });
    appState.currentProxy = name;
    renderProxyList();
    updateStatusBar();
  } catch (e) { showToast('Error: ' + e.message); }
}

function initProxyPanel() {
  document.getElementById('pf-type').addEventListener('change', updateProxyFormFields);

  document.getElementById('btn-add-proxy').addEventListener('click', () => {
    pfEditName = null;
    resetProxyForm();
    document.getElementById('proxy-form-title').textContent = t('proxy_form_title');
    document.getElementById('pf-name').disabled = false;
    document.getElementById('proxy-form-wrap').style.display = 'block';
    document.getElementById('btn-add-proxy').style.display = 'none';
    updateProxyFormFields();
  });

  document.getElementById('pf-cancel').addEventListener('click', hideProxyForm);
  document.getElementById('pf-save').addEventListener('click', saveProxy);

  document.querySelectorAll('.color-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.color-opt').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
    });
  });
}

function updateProxyFormFields() {
  const type = document.getElementById('pf-type').value;
  const serverTypes = ['http','https','socks4','socks5'];
  document.querySelectorAll('.pf-server-fields').forEach(el => {
    el.style.display = serverTypes.includes(type) ? 'block' : 'none';
  });
  document.querySelectorAll('.pf-pac-url-field').forEach(el => {
    el.style.display = type === 'pac_url' ? 'block' : 'none';
  });
  document.querySelectorAll('.pf-pac-script-field').forEach(el => {
    el.style.display = type === 'pac_script' ? 'block' : 'none';
  });
}

function resetProxyForm() {
  ['pf-name','pf-host','pf-port','pf-user','pf-pass','pf-bypass','pf-pac-url','pf-pac-script'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('pf-type').value = 'http';
  document.querySelectorAll('.color-opt').forEach((o, i) => o.classList.toggle('selected', i === 0));
}

function startEditProxy(name) {
  const cfg = appState.proxyConfigs[name];
  if (!cfg) return;
  pfEditName = name;
  resetProxyForm();
  document.getElementById('proxy-form-title').textContent = t('edit_proxy');
  document.getElementById('pf-name').value = name;
  document.getElementById('pf-name').disabled = true;

  const schemeToType = { http:'http', https:'https', socks4:'socks4', socks5:'socks5' };
  if (cfg.mode === 'fixed_servers') document.getElementById('pf-type').value = schemeToType[cfg.scheme] || 'http';
  else if (cfg.mode === 'pac_script') document.getElementById('pf-type').value = cfg.pacUrl ? 'pac_url' : 'pac_script';

  document.getElementById('pf-host').value = cfg.host || '';
  document.getElementById('pf-port').value = cfg.port || '';
  document.getElementById('pf-user').value = cfg.username || '';
  document.getElementById('pf-pass').value = cfg.password || '';
  document.getElementById('pf-bypass').value = (cfg.bypassList || []).join('\n');
  document.getElementById('pf-pac-url').value = cfg.pacUrl || '';
  document.getElementById('pf-pac-script').value = cfg.pacData || '';

  const color = cfg.color || '#6366f1';
  document.querySelectorAll('.color-opt').forEach(o => o.classList.toggle('selected', o.dataset.color === color));

  document.getElementById('proxy-form-wrap').style.display = 'block';
  document.getElementById('btn-add-proxy').style.display = 'none';
  updateProxyFormFields();
}

function hideProxyForm() {
  document.getElementById('proxy-form-wrap').style.display = 'none';
  document.getElementById('btn-add-proxy').style.display = '';
  document.getElementById('pf-name').disabled = false;
  pfEditName = null;
}

async function saveProxy() {
  const name = pfEditName || document.getElementById('pf-name').value.trim();
  const type = document.getElementById('pf-type').value;

  if (!name) { showToast(t('err_name_required')); return; }
  if (!pfEditName && appState.proxyConfigs[name]) { showToast(t('err_name_exists')); return; }

  const color = document.querySelector('.color-opt.selected')?.dataset.color || '#6366f1';
  let config;

  if (['http','https','socks4','socks5'].includes(type)) {
    const host = document.getElementById('pf-host').value.trim();
    const port = parseInt(document.getElementById('pf-port').value.trim());
    if (!host) { showToast(t('err_host_required')); return; }
    if (!port || port < 1 || port > 65535) { showToast(t('err_port_invalid')); return; }

    config = {
      name, mode: 'fixed_servers', scheme: type, host, port, color,
      username: document.getElementById('pf-user').value.trim(),
      password: document.getElementById('pf-pass').value.trim(),
      bypassList: document.getElementById('pf-bypass').value.trim().split('\n').map(s => s.trim()).filter(Boolean)
    };
  } else if (type === 'pac_url') {
    config = { name, mode: 'pac_script', pacUrl: document.getElementById('pf-pac-url').value.trim(), color };
  } else {
    config = { name, mode: 'pac_script', pacData: document.getElementById('pf-pac-script').value.trim(), color };
  }

  try {
    await sendMsg('saveProxyConfig', { config });
    appState.proxyConfigs[name] = config;
    hideProxyForm();
    renderProxyList();
    populateProxySelects();
    showToast(t('saved'));
  } catch (e) { showToast('Error: ' + e.message); }
}

async function deleteProxy(name) {
  if (!confirm(t('confirm_delete') + ' ' + name)) return;
  try {
    await sendMsg('removeProxyConfig', { name });
    delete appState.proxyConfigs[name];
    if (appState.currentProxy === name) appState.currentProxy = 'direct';
    renderProxyList();
    populateProxySelects();
    showToast(t('deleted'));
  } catch (e) { showToast('Error: ' + e.message); }
}

// ====== Headers Panel ======
function initHeadersPanel() {
  ['xff','ua','custom'].forEach(id => {
    const head = document.getElementById(id + '-head');
    const body = document.getElementById(id + '-body');
    head.addEventListener('click', () => {
      body.classList.toggle('open');
      const arrow = head.querySelector('.section-arrow');
      if (arrow) arrow.style.transform = body.classList.contains('open') ? 'rotate(180deg)' : '';
    });
  });

  document.getElementById('xff-random').addEventListener('click', () => {
    document.getElementById('xff-ip').value = randomIp();
  });
  document.getElementById('xff-save').addEventListener('click', saveXffSettings);
  document.getElementById('xff-enabled').addEventListener('change', saveXffSettings);

  document.querySelectorAll('[data-ua]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.ua;
      if (key === 'random') {
        document.getElementById('ua-value').value = UA_POOL[Math.floor(Math.random() * UA_POOL.length)];
      } else {
        document.getElementById('ua-value').value = UA_PRESETS[key] || '';
      }
    });
  });
  document.getElementById('ua-save').addEventListener('click', saveUaSettings);
  document.getElementById('ua-enabled').addEventListener('change', saveUaSettings);

  document.getElementById('new-hdr-scope').addEventListener('change', updateHdrSuggestions);
  document.getElementById('new-hdr-op').addEventListener('change', () => {
    document.getElementById('new-hdr-value').disabled = document.getElementById('new-hdr-op').value === 'remove';
  });
  document.getElementById('add-hdr-btn').addEventListener('click', addHeaderRule);
  updateHdrSuggestions();
}

function updateHdrSuggestions() {
  const scope = document.getElementById('new-hdr-scope').value;
  document.getElementById('hdr-suggestions').innerHTML =
    (HDR_SUGGESTIONS[scope] || []).map(h => `<option value="${h}">`).join('');
}

function loadXffSettings() {
  const xff = appState.xffSettings || {};
  document.getElementById('xff-enabled').checked = !!xff.enabled;
  document.getElementById('xff-ip').value = xff.ip || '';
  document.getElementById('xff-url').value = xff.urlPattern || '';
  const selected = new Set(xff.headers || ['x-forwarded-for']);
  document.querySelectorAll('.xff-hdr-chip').forEach(cb => { cb.checked = selected.has(cb.value); });
}

async function saveXffSettings() {
  const ipVal = document.getElementById('xff-ip').value.trim();
  if (ipVal && !isValidIp(ipVal)) { showToast(t('err_ip_invalid')); return; }

  const settings = {
    enabled: document.getElementById('xff-enabled').checked,
    ip: ipVal || randomIp(),
    headers: [...document.querySelectorAll('.xff-hdr-chip:checked')].map(cb => cb.value) || ['x-forwarded-for'],
    urlPattern: document.getElementById('xff-url').value.trim()
  };
  if (!settings.headers.length) settings.headers = ['x-forwarded-for'];

  try {
    await sendMsg('saveXffSettings', { settings });
    appState.xffSettings = settings;
    showToast(t('xff_saved'));
  } catch (e) { showToast('Error: ' + e.message); }
}

function loadUaSettings() {
  const ua = appState.uaSettings || {};
  document.getElementById('ua-enabled').checked = !!ua.enabled;
  document.getElementById('ua-value').value = ua.value || '';
  document.getElementById('ua-url').value = ua.urlPattern || '';
}

async function saveUaSettings() {
  const settings = {
    enabled: document.getElementById('ua-enabled').checked,
    value: document.getElementById('ua-value').value.trim(),
    urlPattern: document.getElementById('ua-url').value.trim()
  };
  try {
    await sendMsg('saveUaSettings', { settings });
    appState.uaSettings = settings;
    showToast(t('ua_saved'));
  } catch (e) { showToast('Error: ' + e.message); }
}

function renderHeaderRules() {
  const list = document.getElementById('header-rules-list');
  const rules = appState.headerRules || [];

  if (!rules.length) {
    list.innerHTML = `<div class="empty-state text-xs">${t('no_headers')}</div>`;
    return;
  }

  list.innerHTML = rules.map(rule => {
    const reqH = (rule.requestHeaders || []).map((h, i) => ({ ...h, scope: 'req', scopeKey: 'requestHeaders', idx: i }));
    const resH = (rule.responseHeaders || []).map((h, i) => ({ ...h, scope: 'res', scopeKey: 'responseHeaders', idx: i }));
    return [...reqH, ...resH].map(h => `
      <div class="header-rule-item">
        <span class="hdr-badge ${h.scope}">${h.scope === 'req' ? t('req_header') : t('res_header')}</span>
        <span class="hdr-name monospace">${escapeHtml(h.header)}</span>
        <span class="hdr-value monospace">${h.operation === 'remove' ? '[ remove ]' : escapeHtml(h.value)}</span>
        ${rule.urlPattern ? `<span class="hdr-url" title="${escapeHtml(rule.urlPattern)}">${escapeHtml(rule.urlPattern)}</span>` : ''}
        <label class="toggle" style="margin-left:auto" onclick="event.stopPropagation()">
          <input type="checkbox" class="hdr-rule-toggle" data-id="${rule.id}" ${rule.enabled ? 'checked' : ''}>
          <span class="toggle-track"></span>
        </label>
        <button class="btn btn-icon danger" data-del-rule="${rule.id}" data-del-scope="${h.scopeKey}" data-del-idx="${h.idx}">&#10005;</button>
      </div>
    `).join('');
  }).join('');

  list.querySelectorAll('.hdr-rule-toggle').forEach(cb => {
    cb.addEventListener('change', () => toggleHeaderRule(cb.dataset.id, cb.checked));
  });
  list.querySelectorAll('[data-del-rule]').forEach(btn => {
    btn.addEventListener('click', () => deleteHeaderRule(btn.dataset.delRule, btn.dataset.delScope, parseInt(btn.dataset.delIdx)));
  });
}

async function addHeaderRule() {
  const scope = document.getElementById('new-hdr-scope').value;
  const hdrName = document.getElementById('new-hdr-name').value.trim();
  const op = document.getElementById('new-hdr-op').value;
  const value = op === 'remove' ? '' : document.getElementById('new-hdr-value').value.trim();
  const urlPattern = document.getElementById('new-hdr-url').value.trim();

  if (!hdrName) { showToast(t('header_name')); return; }

  const headerObj = { header: hdrName, operation: op, value };
  const rules = appState.headerRules || [];

  const existing = rules.find(r => r.urlPattern === urlPattern);
  let updatedRules;

  if (existing) {
    updatedRules = rules.map(r => {
      if (r.id !== existing.id) return r;
      const updated = { ...r };
      if (scope === 'request') updated.requestHeaders = [...(r.requestHeaders || []), headerObj];
      else updated.responseHeaders = [...(r.responseHeaders || []), headerObj];
      return updated;
    });
  } else {
    const newRule = {
      id: generateId(), enabled: true, urlPattern,
      requestHeaders: scope === 'request' ? [headerObj] : [],
      responseHeaders: scope === 'response' ? [headerObj] : []
    };
    updatedRules = [...rules, newRule];
  }

  try {
    await sendMsg('saveHeaderRules', { rules: updatedRules });
    appState.headerRules = updatedRules;
    renderHeaderRules();
    document.getElementById('new-hdr-name').value = '';
    document.getElementById('new-hdr-value').value = '';
    document.getElementById('new-hdr-url').value = '';
    showToast(t('saved'));
  } catch (e) { showToast('Error: ' + e.message); }
}

async function toggleHeaderRule(id, enabled) {
  const rules = (appState.headerRules || []).map(r => r.id === id ? { ...r, enabled } : r);
  try {
    await sendMsg('saveHeaderRules', { rules });
    appState.headerRules = rules;
  } catch (e) { showToast('Error: ' + e.message); }
}

async function deleteHeaderRule(id, scopeKey, idx) {
  const rules = (appState.headerRules || []).map(r => {
    if (r.id !== id) return r;
    const updated = { ...r, [scopeKey]: [...(r[scopeKey] || [])] };
    updated[scopeKey].splice(idx, 1);
    return updated;
  }).filter(r => (r.requestHeaders || []).length + (r.responseHeaders || []).length > 0);
  try {
    await sendMsg('saveHeaderRules', { rules });
    appState.headerRules = rules;
    renderHeaderRules();
    showToast(t('deleted'));
  } catch (e) { showToast('Error: ' + e.message); }
}

// ====== Rules Panel ======
function populateProxySelects() {
  const configs = appState?.proxyConfigs || {};
  ['default-proxy-sel','rf-proxy'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const prev = sel.value;
    sel.innerHTML = Object.keys(configs)
      .map(n => `<option value="${n}">${proxyDisplayName(n, configs)}</option>`).join('');
    if (prev && configs[prev]) sel.value = prev;
  });
  const defSel = document.getElementById('default-proxy-sel');
  if (defSel && appState?.autoSwitch?.defaultProxy) defSel.value = appState.autoSwitch.defaultProxy;
}

function initRulesPanel() {
  document.getElementById('auto-switch-toggle').addEventListener('change', async e => {
    const autoSwitch = { ...appState.autoSwitch, enabled: e.target.checked };
    try {
      await sendMsg('setAutoSwitch', { autoSwitch });
      appState.autoSwitch = autoSwitch;
      updateStatusBar();
      showToast(e.target.checked ? t('auto_on') : t('auto_off'));
    } catch (err) { showToast('Error: ' + err.message); }
  });

  document.getElementById('default-proxy-sel').addEventListener('change', async e => {
    const autoSwitch = { ...appState.autoSwitch, defaultProxy: e.target.value };
    try {
      await sendMsg('setAutoSwitch', { autoSwitch });
      appState.autoSwitch = autoSwitch;
    } catch (err) { showToast('Error: ' + err.message); }
  });

  document.getElementById('test-url-btn').addEventListener('click', testUrl);
  document.getElementById('test-url-input').addEventListener('keydown', e => { if (e.key === 'Enter') testUrl(); });

  document.getElementById('add-rule-btn').addEventListener('click', () => {
    rfEditId = null;
    document.getElementById('rf-pattern').value = '';
    document.getElementById('rf-type').value = 'wildcard';
    document.getElementById('rule-add-form').style.display = 'block';
  });
  document.getElementById('rf-cancel').addEventListener('click', () => {
    document.getElementById('rule-add-form').style.display = 'none';
  });
  document.getElementById('rf-save').addEventListener('click', saveAutoSwitchRule);
}

function renderRuleList() {
  const list = document.getElementById('rule-list');
  const rules = appState.autoSwitch?.rules || [];
  document.getElementById('auto-switch-toggle').checked = !!appState.autoSwitch?.enabled;

  if (!rules.length) {
    list.innerHTML = `<div class="empty-state text-xs">${t('no_rules')}</div>`;
    return;
  }

  list.innerHTML = rules.map(r => `
    <div class="rule-item ${r.enabled ? '' : 'disabled'}">
      <span class="rule-pattern">${escapeHtml(r.pattern || '—')}</span>
      <span class="rule-arrow">&#8594;</span>
      <span class="rule-proxy-name">${escapeHtml(proxyDisplayName(r.proxy, appState.proxyConfigs))}</span>
      <label class="toggle" style="margin-left:auto" onclick="event.stopPropagation()">
        <input type="checkbox" class="rule-toggle" data-id="${r.id}" ${r.enabled ? 'checked' : ''}>
        <span class="toggle-track"></span>
      </label>
      <button class="btn btn-icon danger" data-del-rule="${r.id}">&#10005;</button>
    </div>
  `).join('');

  list.querySelectorAll('.rule-toggle').forEach(cb => {
    cb.addEventListener('change', () => toggleAutoSwitchRule(cb.dataset.id, cb.checked));
  });
  list.querySelectorAll('[data-del-rule]').forEach(btn => {
    btn.addEventListener('click', () => deleteAutoSwitchRule(btn.dataset.delRule));
  });
}

async function saveAutoSwitchRule() {
  const pattern = document.getElementById('rf-pattern').value.trim();
  const patternType = document.getElementById('rf-type').value;
  const proxy = document.getElementById('rf-proxy').value;
  if (!pattern) { showToast(t('rule_pattern')); return; }

  const rules = appState.autoSwitch?.rules || [];
  const updatedRules = rfEditId
    ? rules.map(r => r.id === rfEditId ? { ...r, pattern, patternType, proxy } : r)
    : [...rules, { id: generateId(), enabled: true, pattern, patternType, proxy }];

  const autoSwitch = { ...appState.autoSwitch, rules: updatedRules };
  try {
    await sendMsg('setAutoSwitch', { autoSwitch });
    appState.autoSwitch = autoSwitch;
    renderRuleList();
    document.getElementById('rule-add-form').style.display = 'none';
    if (autoSwitch.enabled) updateStatusBar();
    showToast(t('saved'));
  } catch (e) { showToast('Error: ' + e.message); }
}

async function toggleAutoSwitchRule(id, enabled) {
  const rules = (appState.autoSwitch?.rules || []).map(r => r.id === id ? { ...r, enabled } : r);
  const autoSwitch = { ...appState.autoSwitch, rules };
  try {
    await sendMsg('setAutoSwitch', { autoSwitch });
    appState.autoSwitch = autoSwitch;
    renderRuleList();
  } catch (e) { showToast('Error: ' + e.message); }
}

async function deleteAutoSwitchRule(id) {
  const rules = (appState.autoSwitch?.rules || []).filter(r => r.id !== id);
  const autoSwitch = { ...appState.autoSwitch, rules };
  try {
    await sendMsg('setAutoSwitch', { autoSwitch });
    appState.autoSwitch = autoSwitch;
    renderRuleList();
    showToast(t('deleted'));
  } catch (e) { showToast('Error: ' + e.message); }
}

async function testUrl() {
  const url = document.getElementById('test-url-input').value.trim();
  const resultEl = document.getElementById('test-url-result');
  if (!url) return;
  try {
    const res = await sendMsg('testUrl', { url });
    resultEl.textContent = `${res.reason} → ${proxyDisplayName(res.proxy, appState.proxyConfigs)}`;
    resultEl.className = 'test-url-result show';
  } catch (e) {
    resultEl.textContent = 'Error: ' + e.message;
    resultEl.className = 'test-url-result show';
  }
}

// ====== Settings Panel ======
function initSettingsPanel() {
  document.querySelectorAll('[data-theme-opt]').forEach(btn => {
    btn.addEventListener('click', async () => {
      applyTheme(btn.dataset.themeOpt);
      const settings = { ...appState.appSettings, theme: btn.dataset.themeOpt };
      await sendMsg('saveAppSettings', { settings }).catch(() => {});
      appState.appSettings = settings;
    });
  });

  document.querySelectorAll('[data-lang]').forEach(btn => {
    btn.addEventListener('click', async () => {
      applyLanguage(btn.dataset.lang);
      const settings = { ...appState.appSettings, language: btn.dataset.lang };
      await sendMsg('saveAppSettings', { settings }).catch(() => {});
      appState.appSettings = settings;
    });
  });

  document.getElementById('lang-btn').addEventListener('click', async () => {
    const nl = lang === 'zh' ? 'en' : 'zh';
    applyLanguage(nl);
    const settings = { ...appState.appSettings, language: nl };
    await sendMsg('saveAppSettings', { settings }).catch(() => {});
    appState.appSettings = settings;
  });

  document.getElementById('theme-btn').addEventListener('click', async () => {
    const order = ['auto','light','dark'];
    const next = order[(order.indexOf(currentTheme) + 1) % order.length];
    applyTheme(next);
    const settings = { ...appState.appSettings, theme: next };
    await sendMsg('saveAppSettings', { settings }).catch(() => {});
    appState.appSettings = settings;
  });

  document.getElementById('export-btn').addEventListener('click', exportConfig);

  document.getElementById('import-btn').addEventListener('click', () => {
    document.getElementById('import-file').click();
  });

  document.getElementById('import-file').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const config = JSON.parse(await file.text());
      await sendMsg('importConfig', { config });
      appState = await sendMsg('getState');
      renderAll();
      showToast(t('imported'));
    } catch (err) { showToast('Import error: ' + err.message); }
    e.target.value = '';
  });

  document.getElementById('reset-btn').addEventListener('click', async () => {
    if (!confirm(t('confirm_reset'))) return;
    try {
      await sendMsg('resetConfig');
      appState = await sendMsg('getState');
      renderAll();
      showToast(t('reset_done'));
    } catch (e) { showToast('Error: ' + e.message); }
  });
}

function exportConfig() {
  const data = {
    version: '0.3.0', exportedAt: new Date().toISOString(),
    proxyConfigs: appState.proxyConfigs, currentProxy: appState.currentProxy,
    autoSwitch: appState.autoSwitch, xffSettings: appState.xffSettings,
    uaSettings: appState.uaSettings, headerRules: appState.headerRules,
    appSettings: appState.appSettings
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `nextswitchy-${Date.now()}.json`; a.click();
  URL.revokeObjectURL(url);
  showToast(t('export_config'));
}

// ====== Render All ======
function renderAll() {
  const s = appState.appSettings || {};
  applyTheme(s.theme || 'auto');
  applyLanguage(s.language || 'zh');
  updateStatusBar();
  renderProxyList();
  loadXffSettings();
  loadUaSettings();
  renderHeaderRules();
  populateProxySelects();
  renderRuleList();
}

// ====== Init ======
document.addEventListener('DOMContentLoaded', async () => {
  initTabs();
  initProxyPanel();
  initHeadersPanel();
  initRulesPanel();
  initSettingsPanel();

  try {
    appState = await sendMsg('getState');
  } catch (e) {
    appState = {
      proxyConfigs: { direct: { name:'direct', mode:'direct' }, system: { name:'system', mode:'system' } },
      currentProxy: 'direct',
      autoSwitch: { enabled: false, defaultProxy: 'direct', rules: [] },
      xffSettings: { enabled: false, ip: '', headers: ['x-forwarded-for'], urlPattern: '' },
      uaSettings: { enabled: false, value: '', urlPattern: '' },
      headerRules: [], appSettings: { theme: 'auto', language: 'zh' }
    };
  }

  renderAll();
});
