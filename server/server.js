console.log("Servidor carregat des de server/server.js");

import 'dotenv/config';
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import cors from 'cors';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const app = express();
app.use(express.json());
app.use(cors({
  origin: '*'
}));

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

app.get('/ai-ping', async (req, res) => {
  try {
    const resposta = await openai.responses.create({
      model: 'gpt-4o-mini',
      input: 'Escriu la paraula "poong"'
    });

    res.json({
      ok: true,
      reply: resposta.output_text
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/ask', async (req, res) => {
  try {
    const { id_sessio, text, mode } = req.body;

    if (!text) {
      return res.status(400).json({ ok: false, error: 'Falta el text' });
    }

    const { error: userError } = await supabase
      .from('missatges_chat')
      .insert({
        id_sessio,
        origen: 'usuari',
        contingut: text,
        tipus: mode === 'math' ? 'raonament' : 'normal'
      });
    console.log(userError);

    const resposta = await openai.responses.create({
      model: 'gpt-4o-mini',
      input: text
    });

    const reply = resposta.output_text;

    const { error: aiError } = await supabase
      .from('missatges_chat')
      .insert({
        id_sessio,
        origen: 'assistent',
        contingut: reply,
        tipus: mode === 'math' ? 'raonament' : 'normal'
      });
    console.log(aiError);

    res.json({ ok: true, reply });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

const PORT = 3007;
app.listen(PORT, () => {
  console.log(`Servidor escoltant al port ${PORT}`);
});
