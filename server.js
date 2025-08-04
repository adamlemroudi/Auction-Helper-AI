import 'dotenv/config';
import express from 'express';

const app = express();
app.use(express.json());

app.get('/ping', (req, res) => {
  res.send('pong');
});

if (!process.env.OPENAI_API_KEY) {
  console.warn('No has posat OPENAI_API_KEY al .env');
}

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor escoltant al port ${PORT}`);
});

