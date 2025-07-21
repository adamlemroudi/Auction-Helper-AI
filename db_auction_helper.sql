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
