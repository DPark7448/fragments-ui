// src/app.js
import { signIn, getUser } from './auth';
import {
  getUserFragments,
  createTextFragment,
  getFragmentById,
  createFragment,
  getFragmentAsHtml,
} from './api';

async function init() {
  const userSection = document.querySelector('#user');
  const loginBtn     = document.querySelector('#login');
  const createBtn    = document.querySelector('#create');
  const openBtn      = document.querySelector('#open');
  const out          = document.querySelector('#out');
  const dataOut      = document.querySelector('#data');

  // Extra controls for “real” fragment creation UI
  const createFragmentBtn = document.querySelector('#create-fragment');
  const fragmentType      = document.querySelector('#fragment-type');
  const fragmentBody      = document.querySelector('#fragment-body');
  const createStatus      = document.querySelector('#create-status');

  // Markdown conversion UI
  const openMdHtmlBtn = document.querySelector('#open-md-html');
  const mdHtmlOut     = document.querySelector('#md-html');

  loginBtn.onclick = () => signIn();

  const user = await getUser();
  if (!user) return;

  console.log('User authenticated', user);

  userSection.hidden = false;
  userSection.querySelector('.username').innerText = user.username;
  loginBtn.disabled = true;

  let lastId = null;
  let lastMarkdownId = null;

  async function refreshList() {
    console.log('Requesting user fragments data...');
    const list = await getUserFragments(user);
    out.textContent = JSON.stringify(list, null, 2);

    // capture newest id if present
    if (list?.fragments?.length) {
      lastId = list.fragments[list.fragments.length - 1];
    }
  }

  await refreshList();

  // Existing demo button: creates a text/plain "hello from UI"
  createBtn.onclick = async () => {
    const { fragment } = await createTextFragment(user, 'hello from UI');
    lastId = fragment.id;
    await refreshList(); // show the id in the list
    alert(`Created: ${fragment.id}`);
  };

  // Existing demo button: open the most recent fragment as text/plain
  openBtn.onclick = async () => {
    if (!lastId) {
      alert('No fragment id yet — create one first.');
      return;
    }
    const text = await getFragmentById(user, lastId);
    dataOut.textContent = text;
  };

  // Generic “Create fragment” button (text/plain, text/markdown, application/json)
  if (createFragmentBtn) {
    createFragmentBtn.onclick = async () => {
      createStatus.textContent = '';

      const type = fragmentType.value;
      const body = fragmentBody.value.trim();

      if (!body) {
        createStatus.textContent = 'Enter some content.';
        return;
      }

      // Basic JSON validation so we don’t send broken JSON
      if (type === 'application/json') {
        try {
          JSON.parse(body);
        } catch (err) {
          console.error('Invalid JSON', err);
          createStatus.textContent = 'Invalid JSON (cannot parse).';
          return;
        }
      }

      try {
        // Uses API helper, which calls user.authorizationHeaders(type)
        const { fragment, location } = await createFragment(user, type, body);

        lastId = fragment.id;
        if (type === 'text/markdown') {
          lastMarkdownId = fragment.id;
        }

        createStatus.textContent =
          `Created fragment ${fragment.id}` +
          (location ? ` (Location: ${location})` : '');

        await refreshList();
      } catch (err) {
        console.error('Error creating fragment', err);
        createStatus.textContent = 'Error creating fragment (see console).';
      }
    };
  }

  // Open the last markdown fragment as HTML using /v1/fragments/:id.html
  if (openMdHtmlBtn) {
    openMdHtmlBtn.onclick = async () => {
      if (!lastMarkdownId) {
        alert('No markdown fragment yet — create one with type text/markdown.');
        return;
      }

      try {
        const html = await getFragmentAsHtml(user, lastMarkdownId);
        // Render the HTML (not escaped)
        mdHtmlOut.innerHTML = html;
      } catch (err) {
        console.error('Error fetching markdown HTML', err);
        mdHtmlOut.textContent = 'Error fetching HTML (see console).';
      }
    };
  }
}

addEventListener('DOMContentLoaded', init);
