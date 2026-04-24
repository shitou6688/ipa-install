export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET' }
      });
    }

    // 代理 GitHub Release 下载
    if (url.pathname.startsWith('/download/')) {
      // 取出文件名（最后一个 / 后面的部分）
      var path = url.pathname.replace('/download/', '');
      var filename = path.split('/').pop();

      // 英文名 → GitHub 上的真实文件名
      var fileMap = {
        'ipa-14.ipa': '14.0-15.1.1.ipa',
        'ipa-universal.ipa': 'default.ipa'
      };
      var realName = fileMap[filename] || filename;

      // 用版本号 + 真实文件名拼接 GitHub URL
      var version = path.replace('/' + filename, '');
      var githubURL = 'https://github.com/shitou6688/ipa-install/releases/download/' + version + '/' + realName;

      try {
        var resp = await fetch(githubURL, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          redirect: 'follow'
        });

        if (!resp.ok) {
          return new Response('Download failed: ' + resp.status, { status: 502 });
        }

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

    // 静态文件（给 plist 加正确的 MIME 类型）
    var response = await env.ASSETS.fetch(request);
    if (response && url.pathname.endsWith('.plist')) {
      var h = new Headers(response.headers);
      h.set('Content-Type', 'application/xml');
      return new Response(response.body, { status: response.status, headers: h });
    }

    return response;
  }
};
