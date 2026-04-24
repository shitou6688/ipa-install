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
      const path = url.pathname.replace('/download/', '');
      const githubURL = 'https://github.com/shitou6688/ipa-install/releases/download/' + path;

      try {
        const resp = await fetch(githubURL, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          redirect: 'follow',
        });

        const headers = new Headers(resp.headers);
        headers.set('Access-Control-Allow-Origin', '*');

        return new Response(resp.body, {
          status: resp.status,
          statusText: resp.statusText,
          headers: headers,
        });
      } catch (e) {
        return new Response('下载失败，请稍后重试', { status: 502 });
      }
    }

    // 其他请求交给静态文件处理
    return env.ASSETS.fetch(request);
  }
};
