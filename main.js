// Importem Supabase 
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

//  Inicialització del meu compte
const supabase = createClient(
  'https://hnjgigrgviqbtltomvrr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuamdpZ3JndmlxYnRsdG9tdnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyODI0NDAsImV4cCI6MjA2ODg1ODQ0MH0.PgDyV9KcrTd7GbXbZh5XkZX2eonytBsHCTt42KgiOM4'
);
const TABLE = 'missatges_chat';

// DOM
const chatDiv   = document.getElementById('chat');
const textInput = document.getElementById('text');
const sendBtn   = document.getElementById('sendBtn');

//recarrega i mostra els missatges
async function refrescaXat() {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('origen, contingut')
      .order('id', { ascending: true });
    if (error) throw error;

    chatDiv.innerHTML = data
      .map(m => `<p>${m.origen==='usuari'?'Usuari':'Assistent'}: ${m.contingut}</p>`)
      .join('');
    chatDiv.scrollTop = chatDiv.scrollHeight;
  } catch (err) {
    console.error('Error refrescant xat:', err);
    alert('No s’han pogut carregar els missatges.');
  }
}

// envia un nou missatge
async function enviar() {
  const text = textInput.value.trim();
  if (!text) return;

  try {
    const { error } = await supabase
      .from(TABLE)
      .insert({ id_sessio: 1, origen: 'usuari', contingut: text, tipus: 'normal' });
    if (error) throw error;

    textInput.value = '';
    await refrescaXat();
  } catch (err) {
    console.error('Error enviant missatge:', err);
    alert('No s’ha pogut enviar el missatge.');
  }
}

//carreguem missatges
window.addEventListener('DOMContentLoaded', () => {
  refrescaXat();
  sendBtn.addEventListener('click', enviar);
});
