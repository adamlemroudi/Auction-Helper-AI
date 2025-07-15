create database Subhastes_Assistent;
show databases;
SHOW TABLES;
use Subhastes_Assistent;
CREATE TABLE usuaris (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom_complet VARCHAR(100) NOT NULL,
    correu VARCHAR(100) UNIQUE NOT NULL,
    contrasenya VARCHAR(255),
    google_id VARCHAR(255),
    data_registre TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--------------- prova usuaris:
INSERT INTO usuaris (nom_complet, correu, contrasenya)
VALUES 
('Adam Lemorudi', 'alemroudi@intitutcastelldestela.cat', 'alemroudi'),
('Sònia Busquets', 'sbuque2@intitutcastelldestela.cat', 'sbusque2');
SELECT * FROM usuaris;


CREATE TABLE sessions_chat (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuari INT,
    inici TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuari) REFERENCES usuaris(id)
);

CREATE TABLE missatges_chat (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_sessio INT,
    origen ENUM('usuari', 'assistent') NOT NULL,
    contingut TEXT NOT NULL,
    tipus ENUM('normal', 'raonament') DEFAULT 'normal',
    imatge_url VARCHAR(255),
    moment TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_sessio) REFERENCES sessions_chat(id)
);



------------------------------ prova missatges_chat:
INSERT INTO missatges_chat (id_sessio, origen, contingut)
VALUES 
(1, 'usuari', 'Hola! Sestà subhastant a Ebay una consola, majudes a gunyar la subhasta? '),
(1, 'assistent', 'Hola, perfecte! Donam tots els detalls de la subhasta, et faré un analisi i et donaré consells basats en la teoria de jocs. ');
SELECT * FROM missatges_chat WHERE id_sessio = 1;










