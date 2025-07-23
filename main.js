const supabaseUrl = 'https://hnjgigrgviqbtltomvrr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuamdpZ3JndmlxYnRsdG9tdnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyODI0NDAsImV4cCI6MjA2ODg1ODQ0MH0.PgDyV9KcrTd7GbXbZh5XkZX2eonytBsHCTt42KgiOM4';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

async function carregarMissatges() {
  try {
    const { data: missatges, error } = await supabase
      .from('missatges')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;

    const chatDiv = document.getElementById('chat');
    chatDiv.innerHTML = '';  // Neteja el contenidor

    missatges.forEach(msg => {
      const p = document.createElement('p');
      const origenForm = msg.origen === 'usuari' ? 'Usuari' : 'Assistent';
      p.textContent = `${origenForm}: ${msg.contingut}`;
      chatDiv.appendChild(p);
    });
    chatDiv.scrollTop = chatDiv.scrollHeight;

  } catch (err) {
    console.error('Error llegint missatges:', err.message);
  }
}
async function enviar() {
  const textInput = document.getElementById('text');
  const text = textInput.value.trim();
  if (!text) return; 

  try {
    const { error } = await supabase
      .from('missatges')
      .insert([
        {
          id_sessio: 1,
          origen: 'usuari',
          contingut: text,
          tipus: 'normal'
        }
      ]);

    if (error) throw error;

    textInput.value = '';     

  } catch (err) {
    console.error('Error enviant missatge:', err.message);
    alert('Error: ' + err.message);
  }
}
window.addEventListener('DOMContentLoaded', carregarMissatges);
