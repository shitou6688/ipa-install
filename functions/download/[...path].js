export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname.replace('/download/', '');
  const githubURL = 'https://github.com/shitou6688/ipa-install/releases/download/' + path;
  const resp = await fetch(githubURL, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    redirect: 'follow'
  });
  const headers = new Headers(resp.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers: headers
  });
}
