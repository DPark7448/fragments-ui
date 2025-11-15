// src/api.js

const apiUrl = process.env.API_URL || 'http://localhost:8080';
console.log('API_URL from env:', apiUrl);

export async function getUserFragments(user) {
  console.log('Requesting user fragments data...');
  const url = new URL('/v1/fragments', apiUrl);
  const res = await fetch(url, { headers: user.authorizationHeaders() });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json(); // { status:'ok', fragments:[id,...] }
}

export async function createTextFragment(user, text) {
  const url = new URL('/v1/fragments', apiUrl);
  const res = await fetch(url, {
    method: 'POST',
    headers: user.authorizationHeaders('text/plain'),
    body: text,
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    console.error('POST /v1/fragments failed', res.status, msg);
    throw new Error(`POST failed: ${res.status}`);
  }
  return res.json(); // { status:'ok', fragment:{ id, ... } }
}

// Generic POST /v1/fragments for any supported type
export async function createFragment(user, type, body) {
  const url = new URL('/v1/fragments', apiUrl);
  const res = await fetch(url, {
    method: 'POST',
    headers: user.authorizationHeaders(type),
    body,
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    console.error('POST /v1/fragments failed', res.status, msg);
    throw new Error(`POST failed: ${res.status} ${msg}`);
  }

  const json = await res.json();
  const fragment = json.fragment || json;
  const location = res.headers.get('Location');

  return { fragment, location };
}
// GET /v1/fragments/:id (returns text/plain for this assignment)
export async function getFragmentById(user, id) {
  const url = new URL(`/v1/fragments/${id}`, apiUrl);
  const res = await fetch(url, {
    headers: user.authorizationHeaders('text/plain'),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.text(); // "hello from UI"
}

// GET /v1/fragments/:id.html (Markdown -> HTML conversion)
export async function getFragmentAsHtml(user, id) {
  const url = new URL(`/v1/fragments/${id}.html`, apiUrl);
  const res = await fetch(url, {
    headers: user.authorizationHeaders('text/html'),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    console.error('GET fragment HTML failed', res.status, msg);
    throw new Error(`GET HTML failed: ${res.status}`);
  }
  return res.text(); // HTML string
}
