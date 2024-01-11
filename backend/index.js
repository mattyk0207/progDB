const express = require("express");
const app = express();
const cors = require("cors");
const { createConnection } = require("mysql2");
const cred = require("./credentials.js").DBcredentials;

const PORT = 10000;
const SERIETV = "serie_tv";
const FILM = "film";
const TABLES_NAME = [
  "DaVedere",
  "InVisione",
  "Visione",
  "Recensione",
  "Parte",
  "Creazione",
  "Categoria",
  "Ambientazione",
  "Utente",
  "Account",
  "Personale",
  "ProdCinema",
  "SerieTV",
];
const CREATE_QUERIES = [
  `CREATE TABLE IF NOT EXISTS SerieTV(Id MEDIUMINT UNSIGNED not NULL AUTO_INCREMENT,Titolo VARCHAR(30) not NULL,NStagioni SMALLINT not NULL,PRIMARY KEY (Id))`,
  `CREATE TABLE IF NOT EXISTS ProdCinema(Id MEDIUMINT UNSIGNED not NULL AUTO_INCREMENT, Rating SMALLINT DEFAULT 0, Durata MEDIUMINT not NULL, 
        Budget INT not NULL, Anno YEAR(4), Titolo VARCHAR(30) not NULL, Cara ENUM('G','PG','PG-13','R','NC-17'), 
        Scadenza DATE not NULL, Tipo ENUM('serie_tv','film') not NULL, Stagione SMALLINT,  Serietv MEDIUMINT UNSIGNED, NumEpisodio SMALLINT,
        PRIMARY KEY (Id), FOREIGN KEY (Serietv) REFERENCES SerieTV(Id), CHECK(Rating >= 0 AND Rating <= 10))`,
  `CREATE TABLE IF NOT EXISTS Personale(Codice CHAR(16) not NULL, Nome VARCHAR(20) not NULL, DataNasc DATE, Nazionalità VARCHAR(30), Compito VARCHAR(20), PRIMARY KEY(Codice))`,
  `CREATE TABLE IF NOT EXISTS Account(Mail VARCHAR(40) not NULL, Password VARCHAR(100) not NULL, Abbonamento ENUM('mensile', 'semestrale', 'annuale', 'annuale PRO') not NULL,
        DataCreaz DATE not NULL, PRIMARY KEY (Mail), CHECK(Mail RLIKE '^[a-zA-Z0-9][a-zA-Z0-9._-]*[a-zA-Z0-9._-]@[a-zA-Z0-9][a-zA-Z0-9._-]*[a-zA-Z0-9]\\\\.[a-zA-Z]{2,63}$'))`,
  `CREATE TABLE IF NOT EXISTS Utente(Nome VARCHAR(20) not NULL, Account VARCHAR(40) not NULL, Eta SMALLINT, Posizione VARCHAR(100), Ling VARCHAR(30),Dispositivo VARCHAR(20),
        TempoUtilizzo MEDIUMINT UNSIGNED, PRIMARY KEY(Nome, Account), FOREIGN KEY (Account) REFERENCES Account(Mail))`,
  `CREATE TABLE IF NOT EXISTS Ambientazione( ProdCin MEDIUMINT UNSIGNED not NULL, Location VARCHAR(30), FOREIGN KEY (ProdCin) REFERENCES ProdCinema(Id))`,
  `CREATE TABLE IF NOT EXISTS Categoria(ProdCin MEDIUMINT UNSIGNED not NULL, Genere VARCHAR(30), FOREIGN KEY (ProdCin) REFERENCES ProdCinema(Id))`,
  `CREATE TABLE IF NOT EXISTS Creazione(ProdCin MEDIUMINT UNSIGNED not NULL, Personale CHAR(16) not NULL, FOREIGN KEY (ProdCin) REFERENCES ProdCinema(Id), FOREIGN KEY (Personale) REFERENCES Personale(Codice))`,
  `CREATE TABLE IF NOT EXISTS Parte( ProdCinema MEDIUMINT UNSIGNED not NULL, Attore CHAR(16) not NULL, Ruolo VARCHAR(20) not NULL, PRIMARY KEY (ProdCinema , Attore, Ruolo), 
        FOREIGN KEY (ProdCinema) REFERENCES ProdCinema(Id), FOREIGN KEY (Attore) REFERENCES Personale(Codice))`,
  `CREATE TABLE IF NOT EXISTS Recensione(Utente VARCHAR(20) not NULL, Account VARCHAR(40) not NULL, ProdCinema MEDIUMINT UNSIGNED not NULL, Gradimento SMALLINT not NULL,
        PRIMARY KEY (Utente, Account, ProdCinema), FOREIGN KEY (Utente) REFERENCES Utente(Nome), FOREIGN KEY (Account) REFERENCES Account(Mail), FOREIGN KEY (ProdCinema) REFERENCES ProdCinema(Id),
        CHECK(Gradimento <= 10 AND Gradimento >= 0))`,
  `CREATE TABLE IF NOT EXISTS Visione(Utente VARCHAR(20) not NULL, Account VARCHAR(40) not NULL, ProdCinema MEDIUMINT UNSIGNED not NULL, Watchtime INT UNSIGNED not NULL, Data DATE not NULL,
        PRIMARY KEY (Utente, Account, ProdCinema ), FOREIGN KEY (Utente) REFERENCES Utente(Nome), FOREIGN KEY (Account) REFERENCES Account(Mail), FOREIGN KEY (ProdCinema ) REFERENCES ProdCinema(Id))`,
  `CREATE TABLE IF NOT EXISTS InVisione(Utente VARCHAR(20) not NULL, Account VARCHAR(40) not NULL, ProdCinema MEDIUMINT UNSIGNED not NULL, Tempo INT UNSIGNED not NULL, PRIMARY KEY (Utente, Account, ProdCinema ),
        FOREIGN KEY (Utente) REFERENCES Utente(Nome), FOREIGN KEY (account) REFERENCES Account(Mail), FOREIGN KEY (ProdCinema) REFERENCES ProdCinema(Id))`,
  `CREATE TABLE IF NOT EXISTS DaVedere(Utente VARCHAR(20) not NULL, Account VARCHAR(40) not NULL, ProdCinema MEDIUMINT UNSIGNED not NULL, PRIMARY KEY (Utente, Account, ProdCinema ),
        FOREIGN KEY (Utente) REFERENCES Utente(Nome), FOREIGN KEY (Account) REFERENCES Account(Mail),FOREIGN KEY (ProdCinema ) REFERENCES ProdCinema(Id))`,
];

class ProdCinema {
  durata_val;
  budget_val;
  anno_val;
  titolo_val;
  cara_val;
  scadenza_val;
  tipo_val;
  stagione_val;
  serie_val;

  constructor(
    durata,
    budget,
    anno,
    titolo,
    cara,
    scadenza,
    tipo,
    stagione,
    serie
  ) {
    this.durata_val = durata;
    this.budget_val = budget;
    this.anno_val = anno;
    this.titolo_val = titolo;
    this.cara_val = cara;
    this.scadenza_val = scadenza;
    this.tipo_val = tipo;
    this.stagione_val = stagione;
    this.serie_val = serie;
  }

  setSerieTVid(id) {
    this.serie_val = id;
  }

  getProdArr() {
    return [
      this.durata_val,
      this.budget_val,
      this.anno_val,
      this.titolo_val,
      this.cara_val,
      this.scadenza_val,
      this.tipo_val,
      this.stagione_val,
      this.serie_val,
    ];
  }
}

const prodCin_test = [
  new ProdCinema(
    10140,
    165000000,
    2013,
    "Interstellar",
    CARA,
    "NULL",
    FILM,
    "NULL",
    "NULL"
  ),
  new ProdCinema(1320, 2000000, 2005, "Pilot", CARA, "NULL", SERIETV, 1, null),
  new ProdCinema(
    1320,
    2000000,
    2005,
    "Purple Giraffe",
    CARA,
    "NULL",
    SERIETV,
    1,
    null
  ),
  new ProdCinema(
    1320,
    2000000,
    2005,
    "Sweet Taste of Liberty",
    CARA,
    "NULL",
    SERIETV,
    1,
    null
  ),
];

class User {
  nome;
  account;
  età;
  posizione;
  lingua;
  dispositivo;
  tempoUtilizzo;

  constructor(
    nome,
    account,
    età,
    posizione,
    lingua,
    dispositivo,
    tempoUtilizzo
  ) {
    this.nome = nome;
    this.account = account;
    this.età = età;
    this.posizione = posizione;
    this.lingua = lingua;
    this.dispositivo = dispositivo;
    this.tempoUtilizzo = tempoUtilizzo;
  }
}

const userTest = [
  new User(
    "Marco",
    "famiglia@fam.com",
    28,
    "Roma",
    "italiano",
    "Laptop Dell XPS 13"
  ),
  new User(
    "Federica",
    "famiglia@fam.com",
    25,
    "Roma",
    "italiano",
    "Laptop Dell XPS 13"
  ),
  new User(
    "Giuseppe",
    "giuse@gg.com",
    44,
    "Bologna",
    "italiano",
    "Lenovo ThinkPad X1 Carbon"
  ),
  new User(
    "Steve",
    "stevesting@random.com",
    23,
    "NewYork",
    "americano",
    "MacBook Air"
  ),
];

//middleware
app.use(express.json());


// app.post("/createDB/:dbname", async (req, res) => {
//   const { dbname } = req.params;
//   try {
//     res.json();
//   } catch (e) {
//     res.status(500).json(e);
//   }
// });

class connection {
  #_conn;

  constructor() {
    this.#_conn = null;
  }
  async getConnection() {
    if (this.#_conn === null || this.#_conn === undefined) {
      this.#_conn = await createConnection(cred);
      await this.#_conn.connect();
    }
    return this.#_conn;
  }
}

const connect = new connection();

app.get("/table/:tablename", async (req, res) => {
  const { tablename } = req.params;
  try {
    let conn = await connect.getConnection();
    let query = `SELECT * FROM ${tablename} WHERE 1`;

    const [results] = await conn.query(query);

    return results;
  } catch (e) {
    console.log(e);
    res.status(400).json(e);
  }
});

app.post("/createTables", async (req, res) => {
  try {
    let conn = await connect.getConnection();

    //Clear DB
    /*
        console.log("pulizia db ...")
        for (let table_name of TABLES_NAME){
            await conn.promise().query(`DROP TABLE ${table_name}`);
        }

         */

    console.log("inserimento schemi ...");
    for (let query of CREATE_QUERIES) {
      let result = await conn.promise().query(query);
      console.log(
        result[0].serverStatus === 2 ? "inserito con successo" : "errore"
      );
    }

    res.json({out:"Schemi inseriti"});
  } catch (err) {
    console.log(err);
    res.status(400).json(err);
  }
});

app.get("/table/:tablename", async (req, res) => {
  const { tablename } = req.params;
  try {
    res.json();
  } catch (e) {
    res.status(500).json(e);
  }
});

//!da controllare 1, 3, 8, 11, 14
app.post("/op/:opNum", async (req, res) => {
  let connection = await connect.getConnection();
  const { opNum } = req.params;

  try {
    switch (opNum) {
      case "1":
        //inserimento prodotto
        const req_num = req.body.product_number;

        const query1_1 = await connection.query(
          `INSERT INTO ProdCinema(Id, Rating, Durata, Budget, Anno, Titolo, CARA, Scadenza, Tipo, Stagione, SerieTV) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) `,
          prodCin_test[req_num].getProdArr()
        );
        res.send(query1_1);

        //come ottengo l'id del prodotto che è generato automaticamente?
        const query1_2 = await connection.query(
          `INSERT INTO Creazione(Id, CodicePersona) 
            VALUES (?, ?) `,
          //missing id prodotto
          [, req.body.codicePersona]
        );
        res.send(query1_2);

        const query1_3 = await connection.query(
          `INSERT INTO Parte(Id) 
            VALUES (?, ?) `,
          //missing id prodotto
          []
        );
        res.send(query1_3);

        const query1_4 = await connection.query(
          `INSERT INTO Categoria(Id, Categoria) 
            VALUES (?, ?) `,
          //missing id prodotto
          []
        );
        res.send(query1_4);

        const query1_5 = await connection.query(
          `INSERT INTO Ambientazione(Id, Location) 
            VALUES (?, ?) `,
          //missing id prodotto
          []
        );
        res.send(query1_5);
        break;

      case "2":
        //rimozione prodotto
        const query2 = await connection.query(
          `DELETE FROM ProdCinema 
            WHERE Scadenza < CAST(GETDATE() AS Date) `
        );
        res.send(query2);
        break;

      case "3":
        //aggiornamento prodotto, inserimento episodio
        //Id, Rating, Durata, Budget, Anno, Titolo , Cara , Scadenza , Tipo ENUM('serie_tv','film') , Stagione,  Serietv, NumEpisodio

        const query3 = await connection.query(
          `UPDATE ProdCinema() 
            SET Rating = ?, Durata = ?, Budget = ?, Anno = ?, Titolo = ? , Cara = ?, Scadenza = ?, Tipo = 'serie_tv', Stagione = ?, Serietv = ?, NumEpisodio = ? 
            WHERE Id = ? `,
          Object.values()
        );
        res.send(query3);
        break;

      case "4":
        //aggiornamento rating
        const query4 = await connection.query(
          `UPDATE ProdCinema 
            SET Rating = t.meanR 
            FROM 
              (SELECT ProdCinema, AVG(ProdCinema) as meanR 
              FROM Recensione 
              GROUP BY ProdCinema
            ) t 
            WHERE Id = t.ProdCinema `
        );
        res.send(query4);
        break;

      case "5":
        //inserimento account
        const query5 = await connection.query(
          `INSERT INTO Account(Mail, Psw, Abbonamento, DataCreaz) 
            VALUES (?, ?, ?) `,
          [
            req.body.mail,
            req.body.psw,
            req.body.abbonamento,
            req.body.dataCreaz,
          ]
        );
        res.send(query5);
        break;

      case "6":
        //cambio abbonamento
        const query6 = await connection.query(
          `UPDATE Account 
            SET Abbonamento = ? 
            WHERE Mail = ? `,
          [req.body.abbonamento, req.body.mail]
        );
        res.send(query6);
        break;

      case "7":
        //rimozione account
        const query7 = await connection.query(
          `DELETE FROM Account 
            WHERE Mail = ? `,
          [req.body.mail]
        );
        res.send(query7);
        break;

      case "8":
        //inserimento utente
        //to check
        const query8 = await connection.query(
          `INSERT INTO Utente(Nome, Account, Età, Posizione, Ling, Disp, TempoUtilizzo) 
            VALUES (?, ?, ?, ?, ?, ?, ?) `,
          [
            req.body.nome,
            req.body.account,
            req.body.età,
            req.body.posizione,
            req.body.ling,
            req.body.disp,
            req.body.tempoUtilizzo,
          ]
        );
        res.send(query8);
        break;

      case "9":
        //top 10
        const query9 = await connection.query(
          `SELECT P.Id, P.Titolo, P.Tipo 
            FROM ProdCinema as P JOIN Visione as V on P.Id = V.ProdCinema 
            WHERE V.Data > DATE_ADD((CAST(GETDATE() AS Date) INTERVAL -1 MONTH) 
            GROUP BY V.ProdCinema 
            ORDER BY COUNT(V.ProdCinema) DESC 
            LIMIT 10  `
        );
        res.send(query9);

        break;

      case "10":
        //consigliati
        const query10 = await connection.query(
          `SELECT P.Id, P.Titolo, P.Tipo 
            FROM Visioni as V JOIN ProdCinema as P 
            ON V.ProdCin = P.Id JOIN (
                SELECT P.Genere as FavGen 
                FROM Visione as V JOIN ProdCinema as P ON V.ProdCin = P.Id 
                WHERE	V.Utente = ... AND V.Account = ... 
                GROUP BY P.Genere 
                ORDER BY COUNT(*) DESC 
                LIMIT 1
            ) t ON P.Genere = t.FavGen
            LIMIT 5 `
        );
        res.send(query10);
        break;

      case "11":
        //ricerca prodotto
        const attributeName2 = req.body.attributeName;
        const query11 = await connection.query(
          `SELECT Id, Titolo, Tipo 
           FROM ProdCinema
           WHERE Titolo = 'Interstellar'`,
          [req.body.userInput]
        );
        res.send(query11);
        break;

      case "12":
        //inserimento visione
        const query12 = await connection.query(
          `INSERT INTO Visionato(Utente, Account, ProdCinema, Watchtime) 
            VALUES (?, ?, ?, ?) `,
          [
            req.body.utente,
            req.body.account,
            req.body.prodCinema,
            req.body.watchtime,
          ]
        );
        res.send(query12);
        break;

      case "13":
        //inserimento recensione
        const query13 = await connection.query(
          `INSERT INTO Recensione(Utente, Account, ProdCinema, Gradimento) 
            VALUES (?, ?, ?, ?) `,
          [
            req.body.utente,
            req.body.account,
            req.body.prodCinema,
            req.body.gradimento,
          ]
        );
        res.send(query13);
        break;

      case "14":
        //ricerca info
        //uso l'id
        const query14 = await connection.query(
          `SELECT Rating, Durata, Budget, Anno, CARA, Stagione, SerieTV 
           FROM ProdCinema 
           WHERE Titolo = 'Interstellar'`,
          [req.body.id]
        );
        res.send(query14);
        break;

      default:
        res.status(400).json({ error: "Operazione non supportata" });
        return;
    }

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Errore durante l'esecuzione della query" });
  }
});

app.get("/", (req, res) => {
  console.log(__dirname);

  res.sendFile(__dirname + "/../index.html");
});

app.listen(PORT, () => {
  console.log(`app sulla porta ${PORT}`);
});
