import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabase = createClient(
  'https://hnjgigrgviqbtltomvrr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuamdpZ3JndmlxYnRsdG9tdnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyODI0NDAsImV4cCI6MjA2ODg1ODQ0MH0.PgDyV9KcrTd7GbXbZh5XkZX2eonytBsHCTt42KgiOM4'
);

const TABLE_MISSATGES = 'missatges_chat';
let sessioActivaId = null;

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('nouCasBtn').addEventListener('click', async () => {
    await crearNovaSessio();
    await mostraSessions();
    refrescaXat();
  });

  document.getElementById('sendBtn').addEventListener('click', enviar);
  mostraSessions();
});

function mdToSafeHtml(rawText) {
  const html = marked.parse(rawText || '');
  return DOMPurify.sanitize(html);
}

function afegeixMissatge(role, rawText) {
  const chat = document.getElementById('chat');
  const div = document.createElement('div');
  div.className = role === 'usuari' ? 'usuari' : 'assistent';
  div.innerHTML = mdToSafeHtml(rawText);
  chat.appendChild(div);

  renderMathInElement(div, {
    delimiters: [
      { left: "\\[", right: "\\]", display: true },
      { left: "\\(", right: "\\)", display: false },
      { left: "$$", right: "$$", display: true },
      { left: "$", right: "$", display: false }
    ],
    throwOnError: false
  });

  chat.scrollTop = chat.scrollHeight;
}

async function crearNovaSessio() {
  const id_usuari = 2;
  const { data, error } = await supabase
    .from('sessions_chat')
    .insert({ id_usuari })
    .select();

  if (error) {
    alert("No s’ha pogut crear una nova sessió");
    console.error(error);
    return;
  }

  sessioActivaId = data && data[0] ? data[0].id : null;
}

async function mostraSessions() {
  const { data, error } = await supabase
    .from('sessions_chat')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    alert('Error carregant sessions');
    console.error(error);
    return;
  }

  const sessionsList = document.getElementById('sessionsList');
  if (!sessionsList) return;

  sessionsList.innerHTML = data
    .map((sessio, index) => `
      <div class="sessio-link" 
         data-id="${sessio.id}"
         style="cursor:pointer; ${sessioActivaId === sessio.id ? 'font-weight:bold;text-decoration:underline;' : ''}">
        Sessió ${index + 1}
      </div>
    `)
    .join('');

  if (!sessioActivaId && data.length > 0) {
    sessioActivaId = data[data.length - 1].id;
    refrescaXat();
  }

  document.querySelectorAll('.sessio-link').forEach(div => {
    div.addEventListener('click', () => {
      sessioActivaId = Number(div.dataset.id);
      refrescaXat();
      mostraSessions();
    });
  });
}

async function refrescaXat() {
  const chatDiv = document.getElementById('chat');
  if (!sessioActivaId) {
    chatDiv.innerHTML = '';
    return;
  }
  try {
    const { data, error } = await supabase
      .from(TABLE_MISSATGES)
      .select('origen, contingut')
      .eq('id_sessio', sessioActivaId)
      .order('id', { ascending: true });

    if (error) throw error;

    const welcome = '<p class="assistent">Hola! Sóc el teu assistent expert en subhastes. Explica’m el teu cas i t’ajudaré!</p>';
    chatDiv.innerHTML = welcome;

    if (data.length) {
      data.forEach(m => afegeixMissatge(m.origen, m.contingut));
    }

    chatDiv.scrollTop = chatDiv.scrollHeight;
  } catch (err) {
    console.error('Error refrescant xat:', err);
    alert('No s’han pogut carregar els missatges.');
  }
}

async function enviar() {
  const textInput = document.getElementById('text');
  const text = textInput.value.trim();
  if (!text || !sessioActivaId) return;

  try {
    const resposta = await fetch('http://localhost:3007/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_sessio: sessioActivaId,
        text: text,
        mode: 'normal'
      })
    });

    const data = await resposta.json();

    if (!data.ok) {
      console.error("Error del servidor:", data.error);
      return;
    }

    textInput.value = '';
    await refrescaXat();
  } catch (err) {
    console.error('Error enviant missatge al servidor:', err);
    alert('No s’ha pogut enviar el missatge.');
  }
}

window.addEventListener('load', () => {
  const splash = document.getElementById('splash');
  setTimeout(() => splash.classList.add('hide'), 1200);
});
