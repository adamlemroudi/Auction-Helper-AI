console.log("Servidor carregat des de server/server.js");

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import fs from 'fs';


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

let tdrContext = '';
try {
  tdrContext = fs.readFileSync('./apartat5.txt', 'utf-8');
  console.log("Contingut carregat de l'apartat 5:", tdrContext.substring(0, 200));
} catch (err) {
  console.error("Error carregant apartat5.txt:", err.message);
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
    const resposta = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: "user", content: 'Escriu la paraula "poong"' }],
      temperature: 0.3,
      max_tokens: 300
    });

    res.json({
      ok: true,
      reply: resposta.choices[0].message.content
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
        content: `
Ets un assistent expert en subhastes i en teoria de jocs.
Has d’ajudar compradors a guanyar subhastes amb estratègies matemàtiques.
Les respostes han de ser:
- Clares, simples i directes.
- Sempre amb la raó matemàtica darrere del consell, pas a pas.
- Si és útil, utilitza fórmules senzilles o exemples numèrics.
- Si falta informació, demana-la abans de respondre.
Primer explica la lògica matemàtica, després dona el consell final.
FORMAT:
- Usa **negretes** per destacar dades importants.
- Ordena el raonament en **llistes** (numerades o amb punts).
- Escriu les fórmules només amb LaTeX entre \( ... \) per inline i \[ ... \] per display (no facis servir $...$).
- Primer mostra el càlcul pas a pas; al final escriu una línia: **Conclusió:** ...
- Quan expliquis els símbols, fes-ho així:
  Exemple: 
  Fórmula: \( u_i = v_i - b_i \)
  On:
  - \( u_i \) = utilitat del jugador i
  - \( v_i \) = valor privat del jugador i
  - \( b_i \) = oferta del jugador i
- **No repeteixis els números sols.** Escriu sempre la variable completa amb subíndex (p. ex. \( b_1 \), no “1”).

A més a més, tens accés a les següents notes de referència que provenen del meu treball de recerca (apartat 5 de teoria de subhastes). Utilitza-les sempre que sigui rellevant per donar la resposta:

${tdrContext}
        `
      },

      {
    role: "system",
    content: `Aquest és el context del treball de recerca de l'usuari (apartat 5, Teoria de Subhastes). Has d'utilitzar-lo sempre com a base per a les teves respostes:\n\n${tdrContext}`
      },
      ...memory,
      ...recent,
      { role: "user", content: text }
    ];

    const resposta = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
      temperature: 0.1,
    });

    const reply = resposta.choices[0].message.content ?? '(sense resposta)';

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
