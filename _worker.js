// ============================================================
// ipa.jumo8.top — Worker + 管理后台
// /           → index.html（不动）
// /admin      → 管理后台 SPA（内置 HTML）
// /api/*      → 管理接口（KV 存储）
// /manifest/* → 动态 plist 生成
// /download/* → GitHub Release 代理（保留不动）
// ============================================================

// ========== 内置管理后台 HTML ==========
const ADMIN_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>IPA 管理后台</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Microsoft YaHei',sans-serif;background:#0f172a;color:#e2e8f0;min-height:100vh}
header{background:#1e293b;border-bottom:1px solid #334155;padding:16px 24px;display:flex;align-items:center;justify-content:space-between}
header h1{font-size:18px;font-weight:600;color:#f1f5f9}
header .back{color:#94a3b8;text-decoration:none;font-size:14px}
header .back:hover{color:#f1f5f9}
.container{max-width:800px;margin:24px auto;padding:0 16px}
.card{background:#1e293b;border:1px solid #334155;border-radius:12px;padding:20px;margin-bottom:20px}
.card h2{font-size:15px;color:#94a3b8;margin-bottom:16px;font-weight:500}
.form-group{margin-bottom:14px}
.form-group label{display:block;font-size:13px;color:#94a3b8;margin-bottom:6px}
.form-group input,.form-group select,.form-group textarea{width:100%;padding:10px 12px;background:#0f172a;border:1px solid #334155;border-radius:8px;color:#e2e8f0;font-size:14px;font-family:inherit;outline:none;transition:border-color .2s}
.form-group input:focus,.form-group select:focus,.form-group textarea:focus{border-color:#3b82f6}
.form-group textarea{min-height:60px;resize:vertical}
.form-group select{cursor:pointer;appearance:auto}
.btn-row{display:flex;gap:10px;margin-top:16px}
.btn{padding:10px 20px;border-radius:8px;border:none;font-size:14px;font-weight:500;cursor:pointer;transition:all .2s}
.btn-primary{background:#3b82f6;color:#fff}
.btn-primary:hover{background:#2563eb}
.btn-danger{background:#ef4444;color:#fff}
.btn-danger:hover{background:#dc2626}
.btn-secondary{background:#334155;color:#e2e8f0}
.btn-secondary:hover{background:#475569}
.btn-sm{padding:6px 14px;font-size:13px}
table{width:100%;border-collapse:collapse}
th,td{text-align:left;padding:12px 10px;font-size:14px;border-bottom:1px solid #334155}
th{color:#94a3b8;font-weight:500;font-size:13px}
td .actions{display:flex;gap:6px}
.badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:12px;font-weight:500}
.badge-active{background:#065f46;color:#34d399}
.badge-inactive{background:#7f1d1d;color:#fca5a5}
.toast{position:fixed;top:20px;right:20px;padding:12px 20px;border-radius:8px;font-size:14px;z-index:9999;transform:translateX(120%);transition:transform .3s ease}
.toast.show{transform:translateX(0)}
.toast-ok{background:#065f46;color:#34d399;border:1px solid #34d399}
.toast-err{background:#7f1d1d;color:#fca5a5;border:1px solid #fca5a5}
.empty{text-align:center;padding:30px;color:#64748b;font-size:14px}
.section-title{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
.section-title h2{margin:0}
.hint{font-size:12px;color:#64748b;margin-top:4px}
@media(max-width:600px){.container{padding:0 10px}header{padding:12px 16px}.card{padding:16px}th,td{padding:8px 6px;font-size:13px}.btn-row{flex-wrap:wrap}}
</style>
</head>
<body>
<header>
  <h1>IPA 管理后台</h1>
  <a class="back" href="/">← 返回首页</a>
</header>
<div class="container">
  <!-- 添加/编辑应用 -->
  <div class="card">
    <div class="section-title">
      <h2 id="formTitle">添加应用</h2>
    </div>
    <div class="form-group">
      <label>应用 Key（URL 标识，如 universal）</label>
      <input type="text" id="appKey" placeholder="universal" />
      <div class="hint">用于生成 manifest/{key}.plist 的地址，只允许英文、数字、横线</div>
    </div>
    <div class="form-group">
      <label>应用名称</label>
      <input type="text" id="appName" placeholder="巨魔安装器" />
    </div>
    <div class="form-group">
      <label>Bundle ID</label>
      <input type="text" id="appBundleId" placeholder="com.example.app" />
    </div>
    <div class="form-group">
      <label>版本号</label>
      <input type="text" id="appVersion" placeholder="1.0.6" />
    </div>
    <div class="form-group">
      <label>IPA 下载链接</label>
      <input type="text" id="appIpaUrl" placeholder="https://ipa.jumo8.top/download/v1.0.6/通用.ipa" />
      <div class="hint">可以是 /download/ 代理链接，也可以是外部直链</div>
    </div>
    <div class="form-group">
      <label>适用范围（可选）</label>
      <input type="text" id="appScope" placeholder="iOS 14.0 — 16.6.1" />
    </div>
    <div class="btn-row">
      <button class="btn btn-primary" id="btnSave">保存</button>
      <button class="btn btn-secondary" id="btnCancel" style="display:none">取消编辑</button>
    </div>
  </div>

  <!-- 应用列表 -->
  <div class="card">
    <div class="section-title">
      <h2>应用列表</h2>
    </div>
    <div id="appList"></div>
  </div>
</div>
<div class="toast" id="toast"></div>
<script>
(function(){
  var API = '/api/apps';
  var editingId = null;

  function toast(msg, ok) {
    var el = document.getElementById('toast');
    el.textContent = msg;
    el.className = 'toast ' + (ok ? 'toast-ok' : 'toast-err') + ' show';
    setTimeout(function(){ el.className = 'toast'; }, 2500);
  }

  function $(id){ return document.getElementById(id); }

  async function loadApps() {
    try {
      var res = await fetch(API);
      var apps = await res.json();
      renderList(apps);
    } catch(e) {
      $('appList').innerHTML = '<div class="empty">加载失败: ' + e.message + '</div>';
    }
  }

  function renderList(apps) {
    if (!apps || apps.length === 0) {
      $('appList').innerHTML = '<div class="empty">暂无应用，请在上方添加</div>';
      return;
    }
    var html = '<table><thead><tr><th>Key</th><th>名称</th><th>版本</th><th>状态</th><th>操作</th></tr></thead><tbody>';
    apps.sort(function(a,b){ return (a.created||'').localeCompare(b.created||''); });
    apps.forEach(function(app) {
      var active = app.active !== false;
      html += '<tr>'
        + '<td><code>' + esc(app.key) + '</code></td>'
        + '<td>' + esc(app.name) + '</td>'
        + '<td>' + esc(app.version) + '</td>'
        + '<td><span class="badge ' + (active ? 'badge-active' : 'badge-inactive') + '">' + (active ? '启用' : '禁用') + '</span></td>'
        + '<td class="actions">'
        + '<button class="btn btn-sm btn-secondary" onclick="window._edit(\\'' + app.key + '\\')">编辑</button>'
        + '<button class="btn btn-sm ' + (active ? 'btn-secondary' : 'btn-primary') + '" onclick="window._toggle(\\'' + app.key + '\\')">' + (active ? '禁用' : '启用') + '</button>'
        + '<button class="btn btn-sm btn-danger" onclick="window._del(\\'' + app.key + '\\')">删除</button>'
        + '</td></tr>';
    });
    html += '</tbody></table>';
    $('appList').innerHTML = html;
  }

  function esc(s) { var d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

  async function saveApp() {
    var key = $('appKey').value.trim().replace(/[^a-zA-Z0-9_-]/g, '');
    var name = $('appName').value.trim();
    var bundleId = $('appBundleId').value.trim();
    var version = $('appVersion').value.trim();
    var ipaUrl = $('appIpaUrl').value.trim();
    var scope = $('appScope').value.trim();

    if (!key || !name || !ipaUrl) {
      toast('Key、名称、IPA链接不能为空', false);
      return;
    }

    var body = { key:key, name:name, bundleId:bundleId, version:version, ipaUrl:ipaUrl, scope:scope };
    var method = editingId ? 'PUT' : 'POST';

    try {
      var res = await fetch(API, { method:method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
      var data = await res.json();
      if (data.error) { toast(data.error, false); return; }
      toast(editingId ? '已更新' : '已添加', true);
      resetForm();
      loadApps();
    } catch(e) {
      toast('保存失败: ' + e.message, false);
    }
  }

  function resetForm() {
    editingId = null;
    $('appKey').value = '';
    $('appKey').disabled = false;
    $('appName').value = '';
    $('appBundleId').value = '';
    $('appVersion').value = '';
    $('appIpaUrl').value = '';
    $('appScope').value = '';
    $('formTitle').textContent = '添加应用';
    $('btnCancel').style.display = 'none';
  }

  window._edit = async function(key) {
    try {
      var res = await fetch(API + '?key=' + encodeURIComponent(key));
      var app = await res.json();
      if (!app || app.error) { toast('应用不存在', false); return; }
      editingId = key;
      $('appKey').value = app.key;
      $('appKey').disabled = true;
      $('appName').value = app.name || '';
      $('appBundleId').value = app.bundleId || '';
      $('appVersion').value = app.version || '';
      $('appIpaUrl').value = app.ipaUrl || '';
      $('appScope').value = app.scope || '';
      $('formTitle').textContent = '编辑应用';
      $('btnCancel').style.display = '';
      window.scrollTo(0, 0);
    } catch(e) {
      toast('加载失败', false);
    }
  };

  window._toggle = async function(key) {
    try {
      var res = await fetch(API + '?key=' + encodeURIComponent(key));
      var app = await res.json();
      if (!app || app.error) return;
      var newActive = app.active === false ? true : false;
      await fetch(API, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(Object.assign(app, { active:newActive })) });
      toast(newActive ? '已启用' : '已禁用', true);
      if (editingId === key) resetForm();
      loadApps();
    } catch(e) {
      toast('操作失败', false);
    }
  };

  window._del = async function(key) {
    if (!confirm('确定删除 ' + key + '？')) return;
    try {
      await fetch(API, { method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ key:key }) });
      toast('已删除', true);
      if (editingId === key) resetForm();
      loadApps();
    } catch(e) {
      toast('删除失败', false);
    }
  };

  $('btnSave').onclick = saveApp;
  $('btnCancel').onclick = resetForm;
  loadApps();
})();
</script>
</body>
</html>`;

// ========== Admin 密码（请修改为你自己的密码） ==========
const ADMIN_PASSWORD = 'jumo2025';

// ========== Worker 主逻辑 ==========
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS 预检
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    // ===== /admin — 管理后台 =====
    if (path === '/admin' || path === '/admin/') {
      // 带密码查询参数时设置 cookie
      if (url.searchParams.get('login')) {
        const pwd = url.searchParams.get('login');
        if (pwd === ADMIN_PASSWORD) {
          return new Response(null, {
            status: 302,
            headers: {
              'Location': '/admin',
              'Set-Cookie': 'admin_auth=1; Path=/admin; HttpOnly; SameSite=Strict; Max-Age=86400'
            }
          });
        }
      }

      // 检查 cookie 认证
      const cookie = request.headers.get('Cookie') || '';
      if (!cookie.includes('admin_auth=1')) {
        // 未登录 → 显示登录页
        return new Response(LOGIN_PAGE, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }

      return new Response(ADMIN_HTML, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // ===== /api/* — 管理 API =====
    if (path.startsWith('/api/')) {
      return handleAPI(request, env, path);
    }

    // ===== /manifest/* — 动态 plist =====
    if (path.startsWith('/manifest/')) {
      return handleManifest(request, env, path);
    }

    // ===== /download/* — 代理下载（保留原有逻辑） =====
    if (path.startsWith('/download/')) {
      return handleDownload(request, path);
    }

    // ===== 静态文件（保留原有逻辑） =====
    var response = await env.ASSETS.fetch(request);
    if (response && path.endsWith('.plist')) {
      var h = new Headers(response.headers);
      h.set('Content-Type', 'application/xml');
      return new Response(response.body, { status: response.status, headers: h });
    }
    return response;
  }
};

// ========== API 处理 ==========
async function handleAPI(request, env, path) {
  const kv = env.KV;
  if (!kv) {
    return json({ error: 'KV 未绑定' }, 500);
  }

  // 简单认证检查（管理 API）
  const cookie = request.headers.get('Cookie') || '';
  if (!cookie.includes('admin_auth=1')) {
    return json({ error: '未登录' }, 401);
  }

  if (path === '/api/apps' && request.method === 'GET') {
    // 支持查询单个应用
    const url = new URL(request.url);
    const key = url.searchParams.get('key');
    if (key) {
      const data = await kv.get('app:' + key, 'json');
      if (!data) return json({ error: '应用不存在' }, 404);
      return json(data);
    }
    // 列出所有应用
    const list = await kv.list({ prefix: 'app:' });
    const apps = await Promise.all(list.keys.map(k => kv.get(k.name, 'json')));
    return json(apps.filter(Boolean));
  }

  if (path === '/api/apps' && request.method === 'POST') {
    const body = await request.json();
    if (!body.key) return json({ error: '缺少 key' }, 400);
    body.created = body.created || new Date().toISOString();
    await kv.put('app:' + body.key, JSON.stringify(body));
    return json({ ok: true });
  }

  if (path === '/api/apps' && request.method === 'PUT') {
    const body = await request.json();
    if (!body.key) return json({ error: '缺少 key' }, 400);
    const existing = await kv.get('app:' + body.key, 'json');
    if (!existing) return json({ error: '应用不存在' }, 404);
    const merged = Object.assign(existing, body);
    await kv.put('app:' + body.key, JSON.stringify(merged));
    return json({ ok: true });
  }

  if (path === '/api/apps' && request.method === 'DELETE') {
    const body = await request.json();
    if (!body.key) return json({ error: '缺少 key' }, 400);
    await kv.delete('app:' + body.key);
    return json({ ok: true });
  }

  return json({ error: '未知 API' }, 404);
}

// ========== 动态 plist 生成 ==========
async function handleManifest(request, env, path) {
  const kv = env.KV;
  if (!kv) {
    return new Response('KV 未绑定', { status: 500 });
  }

  // /manifest/{key}.plist
  const key = path.replace('/manifest/', '').replace('.plist', '');
  const app = await kv.get('app:' + key, 'json');

  if (!app) {
    return new Response('App not found: ' + key, { status: 404 });
  }

  // 如果应用被禁用
  if (app.active === false) {
    return new Response('App disabled', { status: 404 });
  }

  const plist = generatePlist(app);
  return new Response(plist, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

function generatePlist(app) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>items</key>
    <array>
        <dict>
            <key>assets</key>
            <array>
                <dict>
                    <key>kind</key>
                    <string>software-package</string>
                    <key>url</key>
                    <string>${escapeXml(app.ipaUrl)}</string>
                </dict>
            </array>
            <key>metadata</key>
            <dict>
                <key>bundle-identifier</key>
                <string>${escapeXml(app.bundleId || 'com.example.app')}</string>
                <key>bundle-version</key>
                <string>${escapeXml(app.version || '1.0.0')}</string>
                <key>kind</key>
                <string>software</string>
                <key>title</key>
                <string>${escapeXml(app.name || 'App')}</string>
            </dict>
        </dict>
    </array>
</dict>
</plist>`;
}

function escapeXml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

// ========== 下载代理（保留原逻辑） ==========
async function handleDownload(request, path) {
  var filepath = path.replace('/download/', '');
  var filename = filepath.split('/').pop();

  // TrollStore.tar → 魔搭
  if (filename === 'TrollStore.tar') {
    var targetURL = 'https://www.modelscope.cn/datasets/qwer1234561476/jumo/resolve/master/TrollStore.tar';
    try {
      var resp = await fetch(targetURL, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        redirect: 'follow'
      });
      if (!resp.ok) return new Response('Download failed: ' + resp.status, { status: 502 });
      var headers = new Headers(resp.headers);
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Content-Type', 'application/octet-stream');
      return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers: headers });
    } catch (e) {
      return new Response('Error: ' + e.message, { status: 502 });
    }
  }

  // 文件名映射
  var fileMap = {
    'ipa-14.ipa': '14.0-15.1.1.ipa',
    'ipa-universal.ipa': 'default.ipa'
  };
  var realName = fileMap[filename] || filename;
  var version = filepath.replace('/' + filename, '');
  var githubURL = 'https://github.com/shitou6688/ipa-install/releases/download/' + version + '/' + realName;

  try {
    var resp = await fetch(githubURL, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      redirect: 'follow'
    });
    if (!resp.ok) return new Response('Download failed: ' + resp.status, { status: 502 });
    var headers = new Headers(resp.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Content-Type', 'application/octet-stream');
    return new Response(resp.body, {
      status: resp.status,
      statusText: resp.statusText,
      headers: headers
    });
  } catch (e) {
    return new Response('Error: ' + e.message, { status: 502 });
  }
}

// ========== 工具函数 ==========
function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

// ========== 登录页 HTML ==========
const LOGIN_PAGE = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>管理后台 - 登录</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Microsoft YaHei',sans-serif;background:#0f172a;color:#e2e8f0;min-height:100vh;display:flex;align-items:center;justify-content:center}
.login-box{background:#1e293b;border:1px solid #334155;border-radius:16px;padding:32px;width:360px;text-align:center}
.login-box h1{font-size:20px;margin-bottom:8px;color:#f1f5f9}
.login-box p{font-size:14px;color:#94a3b8;margin-bottom:24px}
.login-box input{width:100%;padding:12px 14px;background:#0f172a;border:1px solid #334155;border-radius:8px;color:#e2e8f0;font-size:15px;outline:none;text-align:center;letter-spacing:2px;margin-bottom:16px}
.login-box input:focus{border-color:#3b82f6}
.login-box button{width:100%;padding:12px;background:#3b82f6;color:#fff;border:none;border-radius:8px;font-size:15px;cursor:pointer}
.login-box button:hover{background:#2563eb}
.error{color:#fca5a5;font-size:13px;margin-top:8px;min-height:20px}
.back-link{display:block;margin-top:16px;color:#64748b;font-size:13px;text-decoration:none}
.back-link:hover{color:#94a3b8}
</style>
</head>
<body>
<div class="login-box">
  <h1>管理后台</h1>
  <p>请输入管理密码</p>
  <form id="loginForm">
    <input type="password" id="pwd" placeholder="输入密码" autofocus />
    <button type="submit">登 录</button>
    <div class="error" id="errMsg"></div>
  </form>
  <a class="back-link" href="/">← 返回首页</a>
</div>
<script>
document.getElementById('loginForm').onsubmit = function(e) {
  e.preventDefault();
  var pwd = document.getElementById('pwd').value;
  if (!pwd) { document.getElementById('errMsg').textContent = '请输入密码'; return; }
  location.href = '/admin?login=' + encodeURIComponent(pwd);
};
</script>
</body>
</html>`;
