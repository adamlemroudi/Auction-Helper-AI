import 'dotenv/config';
import express from 'express';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.warn('Falta SUPABASE_URL o SUPABASE_ANON_KEY al .env');
}

app.get('/db-ping', async (req, res) => {
  const { error } = await supabase.from('missatges_chat').select('id').limit(1);
  if (error) return res.status(500).json({ ok: false, error: error.message });
  res.json({ ok: true });
});

app.post('/message', async (req, res) => {
  try {
    const { id_sessio, text } = req.body;
    if (!text) return res.status(400).json({ ok: false, error: 'Falta text' });

    const { error } = await supabase
      .from('missatges_chat')
      .insert({
        id_sessio,
        origen: 'usuari',
        contingut: text,
        tipus: 'normal'
      });

    if (error) throw error;
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

if (!process.env.OPENAI_API_KEY) {
  console.warn('No has posat OPENAI_API_KEY al .env');
}

const PORT = 3007;
app.listen(PORT, () => {
  console.log(`Servidor escoltant al port ${PORT}`);
});