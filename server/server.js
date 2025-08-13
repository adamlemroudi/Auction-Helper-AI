console.log("Servidor carregat des de server/server.js");

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const app = express();
app.use(express.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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

async function getMemoryMessages(id_sessio, limit = 12) {
  const { data, error } = await supabase
    .from('missatges_chat')
    .select('origen, contingut')
    .eq('id_sessio', id_sessio)
    .eq('memoria', true)
    .order('id', { ascending: true })
    .limit(limit);
  if (error) return [];
  return (data || []).map(m => ({
    role: m.origen === 'usuari' ? 'user' : 'assistant',
    content: m.contingut
  }));
}

async function getRecentMessages(id_sessio, limit = 6) {
  const { data, error } = await supabase
    .from('missatges_chat')
    .select('origen, contingut')
    .eq('id_sessio', id_sessio)
    .order('id', { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data || []).reverse().map(m => ({
    role: m.origen === 'usuari' ? 'user' : 'assistant',
    content: m.contingut
  }));
}

app.post('/ask', async (req, res) => {
  try {
    const { id_sessio, text, mode, remember } = req.body;
    if (!text) {
      return res.status(400).json({ ok: false, error: 'Falta el text' });
    }

    const tipus = mode === 'raonament' ? 'raonament' : 'normal';

    const { data: userInsert, error: userError } = await supabase
      .from('missatges_chat')
      .insert({
        id_sessio,
        origen: 'usuari',
        contingut: text,
        tipus
      })
      .select('id')
      .single();

    if (userError) throw userError;
    const userMsgId = userInsert?.id;

    const memory = await getMemoryMessages(id_sessio);
    const recent = await getRecentMessages(id_sessio);

    const messages = [
      {
        role: "system",
        content: `Ets un assistent expert en subhastes i teoria de jocs.
Respon sempre en català amb un to clar, estructurat i fàcil d'entendre, però sense perdre el rigor.
Explica sempre el raonament darrere de les recomanacions i adapta't al context de l'usuari.
Si hi ha informació guardada a la memòria, utilitza-la per mantenir coherència i continuïtat.`
      },
      ...memory,
      ...recent,
      { role: "user", content: text }
    ];

    const resposta = await openai.responses.create({
      model: 'gpt-4o-mini',
      input: messages
    });

    const reply = resposta.output_text ?? '(sense resposta)';

    const { error: aiError } = await supabase
      .from('missatges_chat')
      .insert({
        id_sessio,
        origen: 'assistent',
        contingut: reply,
        tipus
      });

    if (aiError) throw aiError;

    if (remember === true && userMsgId) {
      await supabase
        .from('missatges_chat')
        .update({ memoria: true })
        .eq('id', userMsgId);
    }

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
