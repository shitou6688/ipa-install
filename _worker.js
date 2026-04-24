export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS 预检
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
        },
      });
    }

    // 代理 GitHub Release 下载
    if (url.pathname.startsWith('/download/')) {
      var rawPath = url.pathname.replace('/download/', '');
      // 正确处理中文文件名：先解码再编码，避免双重编码
      var safePath = decodeURIComponent(rawPath)
        .split('/')
        .map(function(s) { return encodeURIComponent(s); })
        .join('/');
      var githubURL = 'https://github.com/shitou6688/ipa-install/releases/download/' + safePath;

      try {
        var resp = await fetch(githubURL, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          redirect: 'follow',
        });

        if (!resp.ok) {
          return new Response('Download failed: ' + resp.status + ' ' + githubURL, { status: 502 });
        }

        var headers = new Headers(resp.headers);
        headers.set('Access-Control-Allow-Origin', '*');

        return new Response(resp.body, {
          status: resp.status,
          statusText: resp.statusText,
          headers: headers,
        });
      } catch (e) {
        return new Response('Download error: ' + e.message, { status: 502 });
      }
    }

    // 静态文件（给 plist 加上正确的 MIME 类型）
    var response = await env.ASSETS.fetch(request);
    if (response && url.pathname.endsWith('.plist')) {
      var newHeaders = new Headers(response.headers);
      newHeaders.set('Content-Type', 'application/xml');
      return new Response(response.body, {
        status: response.status,
        headers: newHeaders,
      });
    }

    return response;
  }
};
