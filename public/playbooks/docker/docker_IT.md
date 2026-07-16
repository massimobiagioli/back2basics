# Dockerize It

Hai un'app che gira perfettamente sul tuo laptop. La spedisci in produzione (o, peggio, al collega con il Mac M-qualcosa mentre tu hai Linux) e improvvisamente niente funziona più: una versione di Node diversa, una libreria di sistema mancante, una variabile d'ambiente che sul tuo computer avevi impostato tre mesi fa e hai dimenticato. La frase "funziona sul mio computer" è probabilmente la bugia più raccontata nella storia dell'ingegneria del software.

Docker esiste per eliminare quella frase dal tuo vocabolario. Non impacchetta solo il tuo codice: impacchetta **l'intero ambiente** in cui quel codice gira — versione del linguaggio, librerie di sistema, variabili d'ambiente, persino il sistema operativo di base — in un'unica unità che si comporta identicamente ovunque venga eseguita: sul tuo laptop, sul server del collega, in produzione su AWS.

Questo playbook ti porta da zero a un'applicazione reale, containerizzata e orchestrata: un backend **Fastify** su **Node.js 24**, un frontend **Angular**, un database **MariaDB**, tutti e tre avviati con un solo comando.

---

## 0. Il problema che Docker risolve

**In pillole**: Docker impacchetta un'applicazione insieme a tutto ciò di cui ha bisogno per funzionare (runtime, librerie, configurazione) in un'unità isolata e riproducibile, chiamata **container**. Non è una macchina virtuale: è qualcosa di molto più leggero.

### Perché non bastano le macchine virtuali

Una macchina virtuale (VM) virtualizza l'**intero hardware**: ogni VM ha il suo kernel, il suo sistema operativo completo, i suoi driver. È pesante (gigabyte di immagine, minuti di boot) ma dà isolamento totale.

Un container Docker, invece, **condivide il kernel del sistema operativo host** e isola solo ciò che serve a livello di processo: filesystem, rete, processi visibili, limiti di CPU/memoria. Tecnicamente, usa due funzionalità del kernel Linux: i **namespace** (isolano cosa un processo *vede* — il suo filesystem, la sua rete, i suoi PID) e i **cgroups** (limitano quante risorse un processo *può usare* — CPU, RAM). Il risultato: un container pesa megabyte non gigabyte, parte in millisecondi non minuti, ma **non è isolato quanto una VM** (condivide comunque il kernel host).

```
┌─────────────────────────────┐     ┌─────────────────────────────┐
│    Macchina Virtuale         │     │         Container            │
├─────────────────────────────┤     ├─────────────────────────────┤
│  App A  │  App B  │  App C   │     │  App A  │  App B  │  App C   │
├─────────┼─────────┼──────────┤     ├─────────┼─────────┼──────────┤
│ Bin/Lib │ Bin/Lib │ Bin/Lib  │     │ Bin/Lib │ Bin/Lib │ Bin/Lib  │
├─────────┼─────────┼──────────┤     └─────────┴─────────┴──────────┘
│ Guest OS│ Guest OS│ Guest OS │     │      Docker Engine            │
├─────────┴─────────┴──────────┤     ├─────────────────────────────┤
│         Hypervisor            │     │       Kernel host (Linux)     │
├─────────────────────────────┤     ├─────────────────────────────┤
│      Sistema operativo host    │     │      Sistema operativo host    │
└─────────────────────────────┘     └─────────────────────────────┘
```

> 🧠 **Analogia**: una VM è come clonare un intero server fisico per ogni app. Un container è come `chroot` con steroidi: ogni processo pensa di avere il computer tutto per sé (il suo filesystem, la sua rete), ma sotto sotto stanno tutti condividendo lo stesso kernel — un po' come i processi Unix condividono lo stesso kernel ma non vedono la memoria l'uno dell'altro.

### Il problema concreto che risolve ogni giorno

- **"Funziona sul mio computer"** → l'immagine Docker contiene esattamente la stessa versione di Node, le stesse dipendenze di sistema, la stessa configurazione, ovunque venga eseguita.
- **Onboarding di un nuovo sviluppatore** → invece di una pagina di wiki con 40 step ("installa questa versione di Postgres, esporta questa variabile..."), un `docker compose up` e l'ambiente di sviluppo completo (app + database + cache) è in piedi in due minuti.
- **"Ho bisogno di Postgres 14 per questo progetto e Postgres 16 per quest'altro, sulla stessa macchina"** → nessun conflitto: ogni container ha le sue dipendenze isolate, puoi far girare versioni diverse dello stesso database sulla stessa macchina senza toccare nulla a livello di sistema operativo.

---

## 1. I concetti fondamentali: Immagine, Container, Volume

**In pillole**: un'**immagine** è un template read-only. Un **container** è un'istanza in esecuzione di quel template. Un **volume** è lo storage che sopravvive anche quando il container viene distrutto.

### Immagine vs Container: la stessa relazione tra classe e oggetto

Se hai mai scritto codice orientato agli oggetti, questa è la scorciatoia mentale più veloce che troverai:

| Concetto Docker | Equivalente OOP | Equivalente Unix |
|---|---|---|
| **Immagine** | una classe | un eseguibile compilato su disco |
| **Container** | un'istanza di quella classe (`new MyClass()`) | un processo in esecuzione di quell'eseguibile |
| **Registry (Docker Hub)** | un package registry (npm, PyPI) | un repository di binari |

Puoi creare **molti container dalla stessa immagine**, esattamente come puoi istanziare molti oggetti dalla stessa classe. Ogni container ha il suo stato isolato (filesystem scrivibile, processi, rete), ma tutti condividono lo stesso "codice sorgente" immutabile: l'immagine.

```bash
docker run -d --name web1 nginx    # container "web1" dall'immagine nginx
docker run -d --name web2 nginx    # container "web2" dalla STESSA immagine nginx
```

### Le immagini sono fatte di layer, e i layer sono cache

Un'immagine non è un blob monolitico: è una pila di **layer** in sola lettura, uno sopra l'altro (union filesystem). Ogni istruzione in un Dockerfile (che vedremo tra poco) produce un nuovo layer. Docker mette in **cache** ogni layer: se non cambia nulla rispetto alla build precedente, quel layer viene riutilizzato invece di essere ricostruito.

> 💡 **Perché ti importa**: l'ordine delle istruzioni nel tuo Dockerfile determina quanto velocemente ricostruisci l'immagine dopo una modifica. Se metti `COPY . .` (tutto il codice) prima di `npm install`, ogni singola modifica al codice invalida la cache delle dipendenze e le reinstalla da zero — anche se `package.json` non è cambiato. Lo vedremo in dettaglio nella sezione sul Dockerfile.

### Container: effimero per design

Un container è pensato per essere **usa e getta**: quando lo fermi e lo rimuovi, tutto ciò che ha scritto sul suo filesystem scrivibile sparisce con lui. Questo è voluto, non un bug: rende i container **riproducibili** — se qualcosa va storto, lo distruggi e ne fai partire uno nuovo dalla stessa immagine, senza stato sporco lasciato in giro. In gergo: "tratta i container come bestiame, non come animali domestici" (*cattle, not pets* — non dai un nome a ogni container preoccupandoti se si ammala, ne fai partire uno nuovo).

Il problema ovvio: e i dati che *devono* sopravvivere (il database, i file caricati dagli utenti)? Qui entrano i **volumi**.

### Volumi: lo storage che sopravvive al container

Un **volume** è uno spazio di storage gestito da Docker, esterno al filesystem scrivibile del container, che persiste anche quando il container viene rimosso. Monti un volume su un percorso dentro il container, e tutto ciò che viene scritto lì finisce nel volume, non nel filesystem effimero del container.

```bash
docker volume create db_data
docker run -d --name mariadb -v db_data:/var/lib/mysql mariadb:11
# anche se distruggi e ricrei il container "mariadb", i dati in db_data restano
```

| Tipo di storage | Dove vive | Sopravvive alla rimozione del container? |
|---|---|---|
| Filesystem scrivibile del container | dentro il container | ❌ No |
| **Volume** (`-v db_data:/path`) | gestito da Docker, fuori dal container | ✅ Sì |
| **Bind mount** (`-v ./src:/path`) | una cartella del tuo host | ✅ Sì (è letteralmente la tua cartella) |

---

## 2. Anatomia di un Dockerfile

**In pillole**: un Dockerfile è una ricetta, riga per riga, per costruire un'immagine. Ogni riga (quasi) diventa un layer.

### Le istruzioni che userai il 95% delle volte

```dockerfile
FROM node:24-alpine          # layer di partenza: un'immagine base già pronta
WORKDIR /app                 # da qui in poi, ogni comando gira in /app
COPY package*.json ./        # copia SOLO i file delle dipendenze (per la cache!)
RUN npm ci --omit=dev        # installa le dipendenze di produzione
COPY src ./src                # copia il resto del codice sorgente
ENV NODE_ENV=production      # variabile d'ambiente disponibile a runtime
EXPOSE 3000                  # documenta quale porta espone l'app (non la apre da sola)
USER node                     # esegui come utente non privilegiato, non root
CMD ["node", "src/server.js"] # il comando eseguito all'avvio del container
```

| Istruzione | Cosa fa | Analogia |
|---|---|---|
| `FROM` | l'immagine di partenza | l'eredità in OOP: parti da una classe base |
| `WORKDIR` | imposta la directory di lavoro corrente | un `cd` che resta valido per tutte le righe successive |
| `COPY` | copia file dall'host dentro l'immagine | come un `cp` in fase di build |
| `RUN` | esegue un comando durante la **build** e ne salva il risultato in un layer | eseguire uno script di setup una tantum |
| `ENV` | imposta una variabile d'ambiente disponibile a **runtime** | `export VAR=valore` persistente nell'immagine |
| `EXPOSE` | documentazione: "questa app ascolta su questa porta" | un commento eseguibile, non apre davvero la porta |
| `USER` | cambia l'utente con cui girano i comandi successivi e il processo finale | `sudo -u appuser` |
| `CMD` | il comando di default eseguito quando parte il **container** | il comando che lanceresti tu a mano dopo esserti collegato |

> 🧠 **`RUN` vs `CMD`, la confusione più comune**: `RUN` accade **una volta, durante la build** dell'immagine (es. installare dipendenze) e il suo risultato viene "congelato" in un layer. `CMD` accade **ogni volta che parte un container** da quell'immagine, e non modifica l'immagine stessa. È la differenza tra "compilare il programma" (`RUN`, una tantum) ed "eseguire il programma" (`CMD`, ogni avvio).

### L'ordine delle istruzioni conta (per la cache)

```dockerfile
# ❌ CATTIVA PRATICA: invalida la cache delle dipendenze a ogni modifica al codice
FROM node:24-alpine
WORKDIR /app
COPY . .
RUN npm ci
CMD ["node", "src/server.js"]
```

```dockerfile
# ✅ BUONA PRATICA: le dipendenze vengono ricostruite solo se package.json cambia
FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
CMD ["node", "src/server.js"]
```

Nella seconda versione, se cambi un file in `src/` ma non `package.json`, Docker riutilizza il layer con `npm ci` già eseguito dalla cache — la build richiede secondi invece di minuti.

### Multi-stage build: costruisci in una fase, spedisci solo il necessario

Un'immagine con tutti i tool di build (compilatore, dipendenze di sviluppo, cache npm) può pesare centinaia di megabyte in più del necessario. Un **multi-stage build** usa più blocchi `FROM` nello stesso Dockerfile: uno per costruire, uno (molto più piccolo) per eseguire.

```dockerfile
# ---- Stage 1: build ----
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Stage 2: runtime ----
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
```

Il primo stage ha Node, npm, tutte le devDependencies e il codice sorgente completo: tutta roba che non serve più una volta che hai generato i file statici compilati. Il secondo stage parte da un'immagine `nginx` pulita e copia **solo** il risultato della build (`--from=build`) — tutto il resto dello stage 1 viene scartato. L'immagine finale non contiene Node, npm, né una singola riga del codice sorgente: solo i file statici e il server che li serve.

> 💡 **Quando ti serve davvero**: qualsiasi applicazione che richiede una fase di "compilazione" (TypeScript → JavaScript, Angular/React/Vue → file statici, Go/Rust → binario) beneficia di un multi-stage build. Lo vedremo in azione nell'esempio finale con il frontend Angular.

### `.dockerignore`: il `.gitignore` per le tue build

```
node_modules
.git
dist
*.log
.env
```

Senza un `.dockerignore`, `COPY . .` copia **tutto**, incluse cartelle enormi come `node_modules` (che verranno reinstallate comunque dentro il container con architettura giusta) o file sensibili come `.env`. Il risultato: build più lente, immagini più pesanti, e nel caso di `.env`, un rischio di sicurezza serio se quell'immagine finisce in un registry.

---

## 3. docker-compose.yml — il direttore d'orchestra

**In pillole**: `docker compose` prende una singola applicazione fatta di più container (backend, frontend, database, cache...) e la descrive in un file YAML dichiarativo. Un comando (`docker compose up`) fa partire tutto, nell'ordine giusto, sulla stessa rete.

### Il problema che risolve

Senza Compose, per avviare un'app con backend + frontend + database dovresti lanciare a mano tre comandi `docker run` lunghissimi, ricordarti gli argomenti giusti, creare una rete condivisa a mano, e ripetere tutto identico ogni volta. Compose sostituisce quei tre comandi con un file versionato in git e un solo comando.

```yaml
services:
  db:
    image: mariadb:11
    environment:
      MARIADB_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MARIADB_DATABASE: ${DB_NAME}
      MARIADB_USER: ${DB_USER}
      MARIADB_PASSWORD: ${DB_PASSWORD}
    volumes:
      - db_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 5s
      retries: 10

  backend:
    build: ./backend
    environment:
      DB_HOST: db
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      DB_NAME: ${DB_NAME}
    depends_on:
      db:
        condition: service_healthy
    ports:
      - "3000:3000"

volumes:
  db_data:
```

| Chiave | Cosa fa |
|---|---|
| `services` | ogni servizio è un container gestito da Compose |
| `image` | usa un'immagine già pronta da un registry (es. `mariadb:11`) |
| `build` | costruisce l'immagine da un Dockerfile locale invece di scaricarla |
| `environment` | variabili d'ambiente passate al container |
| `volumes` (a livello di servizio) | monta un volume o una cartella dentro il container |
| `volumes` (a livello top) | dichiara i volumi gestiti da Docker che i servizi possono usare |
| `depends_on` | ordine di avvio; con `condition: service_healthy` aspetta che il servizio sia *pronto*, non solo *partito* |
| `ports` | mappa `host:container` — solo per le porte che devono essere raggiungibili da fuori |
| `healthcheck` | un comando che Docker esegue periodicamente per capire se il servizio è davvero pronto, non solo avviato |

> 🧠 **Il dettaglio che frega tutti**: `depends_on` senza `condition: service_healthy` aspetta solo che il container **parta**, non che il servizio dentro sia **pronto a rispondere**. MariaDB può impiegare diversi secondi dopo l'avvio del container prima di accettare connessioni: senza una `healthcheck`, il tuo backend proverà a connettersi troppo presto e fallirà. È lo stesso problema di un retry-loop mancante quando aspetti che una dipendenza esterna sia online.

### La rete: i servizi si trovano per nome

Compose crea automaticamente una rete privata condivisa tra tutti i servizi definiti nel file. Dentro quella rete, ogni servizio è raggiungibile **usando il suo nome come hostname** — esattamente come useresti un nome DNS. Nell'esempio sopra, il backend si connette al database con `DB_HOST: db`, non con un indirizzo IP: Docker risolve `db` all'IP interno corretto del container del servizio `db`.

---

## 4. Entrare dentro il container

**In pillole**: un container che gira non è una scatola nera. Puoi entrarci con una shell, leggerne i log, ispezionarne lo stato — esattamente come faresti SSH su un server, ma senza SSH.

### La shell interattiva: `exec`

```bash
docker exec -it <nome-container> sh      # oppure bash, se l'immagine lo include
```

- `-i` (interactive): mantiene aperto lo stdin
- `-t` (tty): alloca un terminale, così ottieni un prompt utilizzabile invece di output grezzo

Con Compose, il nome del servizio funziona al posto del nome del container:

```bash
docker compose exec backend sh
docker compose exec db mariadb -u root -p
```

> 💡 **`exec` vs `attach`**: `docker exec` lancia un **nuovo processo** dentro il container (es. una shell) — se esci, il processo principale del container continua a girare indisturbato. `docker attach` invece ti collega direttamente allo stdin/stdout/stderr del processo principale (PID 1) del container: se quel processo si aspetta input o se premi Ctrl+C, puoi finire per fermare il container stesso. Nel 99% dei casi, per debugging, vuoi `exec`, non `attach`.

### Leggere i log

```bash
docker logs -f <nome-container>          # -f = segui in tempo reale, come tail -f
docker compose logs -f backend           # stessa cosa, ma per un servizio Compose
docker compose logs -f                    # log di TUTTI i servizi, interlacciati
```

### Ispezionare lo stato

```bash
docker inspect <nome-container>          # tutti i dettagli: IP, mount, variabili d'ambiente, ecc. (JSON)
docker stats                              # uso di CPU/memoria in tempo reale, come `top` ma per container
docker top <nome-container>               # i processi in esecuzione dentro il container, come `ps`
```

---

## 5. I comandi che userai davvero

| Comando | Cosa fa |
|---|---|
| `docker build -t nome-app .` | costruisce un'immagine dal Dockerfile nella cartella corrente |
| `docker run -d -p 3000:3000 nome-app` | avvia un container in background, mappando la porta 3000 |
| `docker ps` | container **in esecuzione** |
| `docker ps -a` | **tutti** i container, anche quelli fermi |
| `docker images` | tutte le immagini presenti in locale |
| `docker stop <nome>` | ferma un container (gracefully, con `SIGTERM`) |
| `docker rm <nome>` | rimuove un container fermo |
| `docker rmi <immagine>` | rimuove un'immagine |
| `docker system prune` | ripulisce container fermi, immagini non taggate, cache di build inutilizzata |
| `docker compose up` | avvia tutti i servizi definiti in `docker-compose.yml` |
| `docker compose up -d --build` | come sopra, ma in background e ricostruendo le immagini |
| `docker compose down` | ferma e rimuove tutti i container/rete del progetto |
| `docker compose down -v` | come sopra, ma rimuove **anche i volumi** (attenzione: cancella i dati!) |
| `docker compose ps` | stato dei servizi del progetto Compose corrente |
| `docker volume ls` | tutti i volumi gestiti da Docker |
| `docker cp file.txt <nome>:/app/` | copia un file dall'host dentro un container (o viceversa) |

---

## 6. Buone pratiche vs Cattive pratiche

| | ❌ Cattiva pratica | ✅ Buona pratica |
|---|---|---|
| **Tag dell'immagine base** | `FROM node:latest` (cosa scarichi tra 6 mesi? nessuno lo sa) | `FROM node:24-alpine` (versione esplicita, riproducibile) |
| **Utente** | il processo gira come `root` dentro il container (default se non specificato) | `USER node` (o un utente dedicato non privilegiato) |
| **Segreti** | password/API key scritte con `ENV` nel Dockerfile (finiscono nella cronologia dell'immagine, leggibili con `docker history`) | passate a runtime via variabili d'ambiente da un file `.env` **non committato**, o un secrets manager |
| **Dimensione immagine** | una singola immagine con compilatore, devDependencies e codice sorgente | multi-stage build: solo l'artefatto finale nell'immagine di runtime |
| **Immagine base** | immagini "full" (`ubuntu`, `node` senza suffisso) quando non servono tool di sistema | varianti `alpine` o `slim`, molto più leggere |
| **`.dockerignore`** | assente: `node_modules`, `.git`, `.env` finiscono nel contesto di build | presente e curato, come un `.gitignore` |
| **Layer delle dipendenze** | `COPY . .` prima di installare le dipendenze | `COPY package*.json ./` e installazione **prima** di copiare il resto del codice |
| **Healthcheck** | `depends_on` senza condizione: si assume che "partito" significhi "pronto" | `depends_on` con `condition: service_healthy` + una `healthcheck` reale |
| **Persistenza dei dati** | dati del database scritti nel filesystem del container | volume dedicato (`db_data:/var/lib/mysql`) |
| **Log** | l'app scrive log su file dentro il container | l'app scrive su stdout/stderr, e lasci che sia Docker/Compose a raccoglierli (`docker logs`) |

---

## 7. Esempio completo: Fastify + Angular + MariaDB con Docker Compose

**In pillole**: mettiamo insieme tutto — Dockerfile, multi-stage build, docker-compose, volumi, healthcheck — costruendo un'app reale a tre livelli: backend **Fastify** su **Node.js 24**, frontend **Angular** servito da **nginx**, database **MariaDB**, tutti avviati con `docker compose up`.

### Struttura del progetto

```
dockerize-demo/
├── backend/
│   ├── src/
│   │   └── server.js
│   ├── package.json
│   ├── Dockerfile
│   └── .dockerignore
├── frontend/
│   ├── src/
│   │   └── ... (progetto Angular standard, generato con `ng new`)
│   ├── nginx.conf
│   ├── package.json
│   ├── Dockerfile
│   └── .dockerignore
├── .env
├── .gitignore
└── docker-compose.yml
```

### Il backend: Fastify su Node.js 24

```js
// backend/src/server.js
import Fastify from 'fastify'
import mysql from 'mysql2/promise'

const fastify = Fastify({ logger: true })

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
})

await pool.query(`
  CREATE TABLE IF NOT EXISTS todos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    done BOOLEAN DEFAULT FALSE
  )
`)

fastify.get('/health', async () => ({ status: 'ok' }))

fastify.get('/api/todos', async () => {
  const [rows] = await pool.query('SELECT * FROM todos ORDER BY id DESC')
  return rows
})

fastify.post('/api/todos', async (request, reply) => {
  const { title } = request.body
  const [result] = await pool.query('INSERT INTO todos (title) VALUES (?)', [title])
  reply.code(201)
  return { id: result.insertId, title, done: false }
})

await fastify.listen({ host: '0.0.0.0', port: 3000 })
```

> 🧠 **`host: '0.0.0.0'`, non `localhost`**: dentro un container, `localhost` significa "solo dentro questo stesso container". Se Fastify ascolta su `localhost`, nessuna richiesta proveniente da fuori il container (incluso il tuo browser, o nginx nell'altro container) riuscirà mai a raggiungerlo. `0.0.0.0` dice "ascolta su tutte le interfacce di rete disponibili", inclusa quella che Docker usa per instradare il traffico dentro il container.

```dockerfile
# backend/Dockerfile
FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

ENV NODE_ENV=production
EXPOSE 3000

USER node
CMD ["node", "src/server.js"]
```

```
# backend/.dockerignore
node_modules
npm-debug.log
.env
```

Niente multi-stage qui: è JavaScript puro, non c'è nulla da "compilare". Un singolo stage con solo le dipendenze di produzione è già un'immagine snella.

### Il frontend: Angular servito da nginx (multi-stage vero)

```dockerfile
# frontend/Dockerfile

# ---- Stage 1: build dell'app Angular ----
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

# ---- Stage 2: servi i file statici con nginx ----
FROM nginx:1.27-alpine
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

Qui il multi-stage non è opzionale, è essenziale: lo stage 1 contiene Node, l'intera CLI di Angular e tutte le devDependencies (centinaia di megabyte); lo stage 2 parte da un'immagine `nginx` pulita e prende **solo** la cartella `dist/` generata dalla build — qualche megabyte di HTML/CSS/JS statico.

```nginx
# frontend/nginx.conf
server {
    listen 80;

    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;   # fallback per il routing lato client di Angular
    }

    location /api/ {
        proxy_pass http://backend:3000/api/;   # "backend" = nome del servizio in docker-compose.yml
        proxy_set_header Host $host;
    }
}
```

> 💡 **`proxy_pass http://backend:3000`**: nginx gira dentro il container `frontend`, ma inoltra le chiamate `/api/*` al container `backend` chiamandolo per **nome del servizio**, grazie alla rete condivisa creata da Compose. Il browser dell'utente parla solo con nginx (porta 80); è nginx a occuparsi di instradare le richieste API al backend, senza mai esporre la porta 3000 all'esterno.

```
# frontend/.dockerignore
node_modules
dist
.angular
```

### docker-compose.yml: il file che tiene insieme tutto

```yaml
services:
  db:
    image: mariadb:11
    environment:
      MARIADB_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MARIADB_DATABASE: ${DB_NAME}
      MARIADB_USER: ${DB_USER}
      MARIADB_PASSWORD: ${DB_PASSWORD}
    volumes:
      - db_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 5s
      timeout: 5s
      retries: 10

  backend:
    build: ./backend
    environment:
      DB_HOST: db
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      DB_NAME: ${DB_NAME}
    depends_on:
      db:
        condition: service_healthy

  frontend:
    build: ./frontend
    ports:
      - "8080:80"
    depends_on:
      - backend

volumes:
  db_data:
```

```bash
# .env (NON committato: aggiungilo a .gitignore)
DB_ROOT_PASSWORD=changeme_root
DB_NAME=todoapp
DB_USER=todoapp_user
DB_PASSWORD=changeme_app
```

Nota cosa **non** è esposto all'esterno: `backend` non ha una sezione `ports`. È raggiungibile solo dentro la rete Compose (da `frontend`, tramite nginx), non dal browser dell'utente direttamente — esattamente come vorresti in produzione, dove solo il frontend dovrebbe essere pubblicamente raggiungibile.

### Avviare tutto

```bash
docker compose up --build
```

Cosa succede, nell'ordine:
1. Docker costruisce le immagini `backend` e `frontend` (usando la cache dei layer se possibile).
2. Parte il container `db`; Compose aspetta che la sua `healthcheck` diventi verde.
3. Solo a quel punto parte `backend` (grazie a `depends_on: condition: service_healthy`), si connette a MariaDB e crea la tabella `todos` se non esiste.
4. Parte `frontend`, che serve l'app Angular e inoltra le chiamate `/api` al `backend`.
5. Apri `http://localhost:8080`: l'app Angular chiama `/api/todos`, nginx la instrada al backend, il backend interroga MariaDB.

### Debug rapido di ogni pezzo

```bash
docker compose logs -f backend              # segui i log del backend in tempo reale
docker compose exec backend sh              # entra nel container del backend
docker compose exec db mariadb -u root -p   # apri un client MariaDB dentro il container del db
docker compose exec db mariadb -u root -p -e "SELECT * FROM todoapp.todos;"
```

### Fermare tutto

```bash
docker compose down       # ferma e rimuove i container e la rete (i dati nel volume restano)
docker compose down -v    # come sopra, ma cancella ANCHE il volume db_data (i dati del database, persi per sempre)
```

---

## Riepilogo

| Concetto | Problema che risolve | Analogia |
|---|---|---|
| Immagine | template riproducibile dell'ambiente | una classe / un binario compilato |
| Container | istanza isolata ed effimera in esecuzione | un oggetto istanziato / un processo |
| Volume | storage che sopravvive alla vita del container | uno storage esterno montato, non il disco locale del processo |
| Dockerfile | ricetta riproducibile per costruire un'immagine | uno script di provisioning, con cache a ogni riga |
| Multi-stage build | build pesante, immagine finale leggera | compilare in un ambiente, spedire solo il binario |
| docker-compose.yml | orchestrare più container come una singola app | un Makefile dichiarativo per l'intero stack |
| Healthcheck | "partito" ≠ "pronto" | un retry-loop esplicito su una dipendenza esterna |

Docker non è complicato: è solo un modo diverso di impacchettare ciò che già sai fare. Il giorno in cui digiti `docker compose up` e vedi partire backend, frontend e database insieme, senza installare nulla sulla tua macchina eccetto Docker stesso, è il giorno in cui smette di essere un buzzword e diventa il tuo strumento di tutti i giorni.
