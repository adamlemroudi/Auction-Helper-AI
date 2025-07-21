const express = require('express');
const mysql = require('mysql');

const app = express();
app.use(express.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'YES',
  database: 'Subhastes_IA'
});

db.connect((err) => {
  if (err) {
    console.error('Error connectant a la base de dades:', err);
    process.exit(1);
  } else {
    console.log('Connectat a la base de dades MySQL.');
  }
});

app.post('/missatge', (req, res) => {
  const { id_sessio, origen, contingut, tipus } = req.body;

  if (!id_sessio || !origen || !contingut) {
    return res.status(400).send('Falten camps obligatoris.');
  }

  db.query(
    'INSERT INTO missatges_chat (id_sessio, origen, contingut, tipus) VALUES (?, ?, ?, ?)',
    [id_sessio, origen, contingut, tipus || 'normal'],
    (error, results) => {
      if (error) {
        console.error('Error a la base de dades:', error);
        return res.status(500).send('Error al guardar el missatge.');
      }
      res.send('Missatge guardat!');
    }
  );
});

const PORT = 3004;
app.listen(PORT, () => {
  console.log(`Servidor escoltant al port ${PORT}`);
});
