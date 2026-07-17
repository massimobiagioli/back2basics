# Fastify + TypeScript + Prisma: uno stack gettonato

**In pillole**: Fastify è un framework web per Node.js pensato per essere veloce e poco invadente, TypeScript è JavaScript con un correttore ortografico molto severo, Prisma è il modo più comodo per parlare con un database senza scrivere SQL a mano e senza perdere i tipi. Messi insieme, formano uno degli stack backend più usati oggi per costruire API robuste in tempi ragionevoli. In questo playbook parti da zero — Node.js, il sistema dei tipi di TypeScript, la filosofia di Fastify, cos'è davvero un ORM — e arrivi a costruire un mini progetto completo, testato, senza un solo `any` nel codice.

---

## 0. Node.js in pillole

**In pillole**: Node.js è JavaScript che gira fuori dal browser, sul server. È fatto da due pezzi: il motore V8 (lo stesso di Chrome) che esegue il codice JavaScript, e libuv, una libreria in C che si occupa di file, rete e timer senza bloccare tutto.

Il dettaglio che cambia tutto è questo: **Node è single-threaded, ma non blocca mai su I/O**. Quando fai una query al database o leggi un file, Node non sta lì fermo ad aspettare: manda la richiesta "in delega" a libuv, continua a fare altro, e quando la risposta è pronta la rimette in coda per essere gestita. Questo si chiama **event loop**.

🧠 **Analogia**: immagina un cameriere solo in un ristorante (il thread di Node). Un cameriere scarso prende l'ordine al tavolo 1, va in cucina, e **aspetta lì impalato** finché il piatto non è pronto, prima di andare al tavolo 2. Un cameriere bravo (Node) prende l'ordine al tavolo 1, lo passa in cucina (libuv), e **mentre il piatto cuoce** va subito a prendere l'ordine al tavolo 2, al tavolo 3... Quando un piatto è pronto, il campanello suona (callback) e lui lo porta al tavolo giusto. Un solo cameriere, ma sembra che stia servendo tutti insieme.

Questo è perché Node è fortissimo per applicazioni **I/O-bound** (tante richieste HTTP, tante query, tanti file) e debole per applicazioni **CPU-bound** (calcoli pesanti tipo elaborazione video o crittografia intensiva): un calcolo pesante occupa il cameriere per davvero, e blocca l'intero ristorante finché non finisce.

```js
// Questo blocca l'event loop: MALE per un server che deve rispondere ad altri
function fibonacciLento(n) {
  if (n < 2) return n
  return fibonacciLento(n - 1) + fibonacciLento(n - 2)
}

// Questo NON blocca: la lettura del file è delegata a libuv,
// Node torna subito libero a gestire altre richieste
import { readFile } from 'node:fs/promises'
const dati = await readFile('config.json', 'utf-8')
```

Qualche pillola in più che ti servirà per il resto del playbook:

- **npm / pnpm**: i gestori di pacchetti. `package.json` descrive le dipendenze del progetto; usiamo **pnpm** negli esempi perché è più veloce e più parsimonioso con lo spazio su disco, ma tutto funziona identico con npm.
- **ESM vs CommonJS**: i moduli moderni si importano con `import`/`export` (ESM), quelli storici con `require`/`module.exports` (CommonJS). Negli esempi di questo playbook usiamo sempre ESM.
- **npx / pnpm dlx**: eseguono un pacchetto senza installarlo globalmente (es. `pnpm dlx prisma init`).

Node da solo ti dà solo un motore e un modulo `http` piuttosto scarno. Per costruire API vere — routing, validazione, gestione errori strutturata — serve un framework. Ed è qui che entra Fastify.

---

## 1. TypeScript: dai concetti base a quelli avanzati

**In pillole**: TypeScript è JavaScript più un sistema di tipi statico. Scrivi codice come sempre, ma dichiari (o lasci inferire) che tipo di dato è ogni cosa, e un compilatore (`tsc`) controlla che tutto torni **prima** che il codice giri. A runtime, però, TypeScript sparisce completamente: viene "compilato" (in realtà solo trasformato) in normale JavaScript, e i tipi vengono cancellati. Questo si chiama **type erasure**: nessun tipo esiste più a runtime, quindi TypeScript non può mai proteggerti dai dati che arrivano da fuori (JSON da una richiesta HTTP, righe da un database) — solo dal codice che tu scrivi.

🧠 **Analogia**: TypeScript è un correttore di bozze molto pignolo che rilegge il tuo manoscritto prima di stamparlo. Trova le frasi che non tornano ("qui dici che è un numero ma tre righe dopo lo tratti come una stringa") e te le segnala con la matita rossa. Ma una volta che il libro è stampato (compilato in JS), la matita rossa sparisce: il libro stampato non sa più che è stato corretto, va bene così.

### I tipi di base

```ts
let nome: string = 'Ada'
let eta: number = 36
let attivo: boolean = true
let tag: string[] = ['backend', 'typescript']
let coppia: [string, number] = ['punteggio', 42] // tupla: lunghezza e posizione fisse

// Literal types: non "una stringa qualsiasi", ma esattamente questi valori
type Ruolo = 'admin' | 'editor' | 'viewer'
let ruolo: Ruolo = 'admin' // 'superadmin' darebbe errore di compilazione
```

Nella maggior parte dei casi **non serve annotare i tipi**: TypeScript li inferisce da solo.

```ts
let punteggio = 10 // inferito: number, non serve scriverlo
```

### `interface` vs `type`

Entrambi descrivono la "forma" di un oggetto. Le differenze pratiche:

| | `interface` | `type` |
|---|---|---|
| Estendere | `extends` | intersezione con `&` |
| Riaprire e aggiungere campi dopo | sì (declaration merging) | no |
| Unioni, tuple, tipi primitivi | no | sì |

```ts
interface Utente {
  id: number
  nome: string
}
interface UtenteConEmail extends Utente {
  email: string
}

type Coordinata = { lat: number; lng: number }
type Evento = { tipo: 'click'; coord: Coordinata } | { tipo: 'keydown'; tasto: string }
```

Regola pratica pragmatica: usa `interface` per la forma di oggetti/API pubbliche, `type` quando ti serve un'unione, un alias di funzione o una combinazione di tipi.

### Union, intersection, e il "narrowing"

Una **union** (`A | B`) dice "può essere A oppure B". Il compilatore, finché non lo sai con certezza, ti permette solo le operazioni valide per *entrambi*. Per restringere il tipo (**narrowing**) usi controlli a runtime che TypeScript sa riconoscere:

```ts
function stampa(valore: string | number) {
  if (typeof valore === 'string') {
    console.log(valore.toUpperCase()) // qui TS sa che è una string
  } else {
    console.log(valore.toFixed(2)) // qui sa che è un number
  }
}
```

Il pattern più potente per modellare stati alternativi è la **discriminated union**: un campo comune ("discriminante") che dice quale variante hai in mano.

```ts
type RisultatoQuery<T> =
  | { stato: 'ok'; dati: T }
  | { stato: 'errore'; messaggio: string }

function gestisci(r: RisultatoQuery<Utente>) {
  if (r.stato === 'ok') {
    console.log(r.dati.nome) // TS sa che qui c'è `dati`
  } else {
    console.log(r.messaggio) // e qui sa che c'è `messaggio`, non `dati`
  }
}
```

Questo pattern sostituisce elegantemente eccezioni non tipizzate per gli errori "previsti" (vedi la sezione DDD più avanti).

### Generics: funzioni e tipi "con un parametro"

Un **generic** è un tipo che prende un altro tipo come parametro, un po' come una funzione prende un valore come parametro.

```ts
// Senza generics dovresti scrivere una funzione per ogni tipo, oppure usare `any` (male!)
function primo<T>(lista: T[]): T | undefined {
  return lista[0]
}

primo([1, 2, 3])        // inferito T = number, ritorna number | undefined
primo(['a', 'b'])       // inferito T = string, ritorna string | undefined

interface Repository<T> {
  trova(id: number): Promise<T | null>
  salva(entita: T): Promise<T>
}
// Repository<Libro> e Repository<Autore> sono due contratti diversi, generati da uno solo
```

### Utility types: trasformare i tipi che hai già

TypeScript include "funzioni per i tipi" pronte all'uso, utilissime per non riscrivere la stessa forma dieci volte:

```ts
interface Libro {
  id: number
  titolo: string
  autoreId: number
  pubblicato: boolean
}

type NuovoLibro = Omit<Libro, 'id'>          // tutto tranne 'id' (per la creazione)
type AggiornaLibro = Partial<Omit<Libro, 'id'>> // tutti i campi opzionali (per un PATCH)
type SoloTitolo = Pick<Libro, 'titolo'>       // solo 'titolo'
type LibroImmutabile = Readonly<Libro>        // nessun campo riassegnabile
type MappaLibri = Record<number, Libro>       // { [id: number]: Libro }
```

### `satisfies`: il migliore amico della sicurezza dei tipi

`satisfies` controlla che un valore rispetti un tipo, **senza** allargare il tipo del valore a quello generico (come farebbe un'annotazione `: Tipo`). Il risultato: il compilatore ti avvisa se sbagli forma, ma l'autocompletamento resta preciso sul valore reale.

```ts
type Config = Record<string, { host: string; port: number }>

const config = {
  db: { host: 'localhost', port: 5432 },
  cache: { host: 'localhost', port: 6379 },
} satisfies Config

config.db.port // TS sa esattamente che 'db' esiste, con annotazione ": Config" lo perderesti
```

### Modalità strict: attivala e non guardarti più indietro

Nel `tsconfig.json`, `"strict": true` accende un fascio di controlli (tra cui `strictNullChecks`, che ti obbliga a gestire esplicitamente `null`/`undefined`, e `noImplicitAny`, di cui parliamo subito). Senza `strict`, TypeScript è molto più permissivo — e molto meno utile.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist"
  }
}
```

---

## 2. La guerra contro `any` — evitarlo whatever it takes

**In pillole**: `any` è la valvola di sfogo di TypeScript: dice al compilatore "smetti di controllare questa variabile". Il problema è che `any` è **contagioso**: appena tocca un'altra variabile, anche quella diventa implicitamente non controllata, e l'infezione si propaga in tutto il codice. Un progetto pieno di `any` è TypeScript solo di nome: a runtime hai le stesse sorprese di JavaScript puro, con in più la falsa sicurezza di "tanto è tipizzato".

```ts
// ❌ MALE: `any` disattiva ogni controllo, l'errore esplode solo a runtime
function calcolaTotale(carrello: any) {
  return carrello.prodotti.reduce((tot, p) => tot + p.prezzo, 0)
  // se `carrello.prodotti` non esiste, o un `prezzo` è una stringa: nessun avviso,
  // solo un crash in produzione
}
```

### La vera alternativa: `unknown`

`unknown` è il fratello sicuro di `any`: accetta qualunque valore, **ma non ti lascia usarlo finché non ne verifichi la forma**. È perfetto per i confini del sistema — dati che arrivano da `JSON.parse`, dal body di una richiesta HTTP, da una libreria non tipizzata.

```ts
// ✅ BENE: unknown ti obbliga a validare prima di usare
function calcolaTotale(carrello: unknown) {
  if (!isCarrello(carrello)) {
    throw new Error('Payload carrello non valido')
  }
  // da qui in poi, carrello è tipizzato come Carrello
  return carrello.prodotti.reduce((tot, p) => tot + p.prezzo, 0)
}

interface Prodotto { prezzo: number }
interface Carrello { prodotti: Prodotto[] }

function isCarrello(v: unknown): v is Carrello {
  return (
    typeof v === 'object' && v !== null &&
    Array.isArray((v as Carrello).prodotti)
  )
}
```

Scrivere a mano un type guard per ogni payload è tedioso e facile da sbagliare. Nella pratica si usa una libreria di validazione **runtime** che, da un solo schema, ti dà sia la validazione sia il tipo TypeScript derivato — [Zod](https://zod.dev) è la più diffusa:

```ts
import { z } from 'zod'

const ProdottoSchema = z.object({ prezzo: z.number().positive() })
const CarrelloSchema = z.object({ prodotti: z.array(ProdottoSchema) })

type Carrello = z.infer<typeof CarrelloSchema> // il tipo TS nasce dallo schema, zero duplicazione

function calcolaTotale(payload: unknown) {
  const carrello = CarrelloSchema.parse(payload) // lancia se non valido, altrimenti tipizzato
  return carrello.prodotti.reduce((tot, p) => tot + p.prezzo, 0)
}
```

Questo pattern — **valida ai bordi, fidati all'interno** — è il modo corretto di far incontrare "il mondo esterno, che mente sempre" con "il mondo interno, tipizzato e affidabile". Lo ritroverai identico più avanti quando Fastify valida i payload delle richieste.

### Dove `any` si infila di nascosto (e come chiuderlo fuori)

| Situazione | Perché arriva `any` | Cosa fare |
|---|---|---|
| `JSON.parse(str)` | il tipo di ritorno è `any` per definizione | validare con Zod subito dopo |
| Libreria senza tipi | `require`/`import` senza `@types/...` | scrivere una dichiarazione minima in `.d.ts`, o isolarla dietro un wrapper tipizzato |
| Catch di un'eccezione | `catch (e)` → `e` è `unknown` in strict mode (buono!), ma spesso lo si annota `any` per pigrizia | usare `e instanceof Error` prima di leggere `e.message` |
| Refactoring veloce | "lo sistemo dopo" | non fatelo: `unknown` + narrowing costa 30 secondi in più, oggi |

Infine, due interruttori che rendono `any` quasi impossibile da introdurre per sbaglio:

```json
{ "compilerOptions": { "noImplicitAny": true } }
```

```jsonc
// .eslintrc — nega `any` esplicito, anche quando qualcuno lo scrive apposta
{ "rules": { "@typescript-eslint/no-explicit-any": "error" } }
```

`noImplicitAny` (incluso in `strict`) blocca i casi in cui TypeScript *non riesce a inferire* un tipo e cadrebbe silenziosamente su `any`. La regola ESLint blocca chi lo scrive `any` di proposito. Insieme, coprono whatever it takes.

---

## 3. Fastify: filosofia e architettura a plugin

**In pillole**: Fastify nasce nel 2016 da Matteo Collina e Tomas Della Vedova con un obiettivo dichiarato: essere il framework Node più veloce possibile **senza** sacrificare developer experience e sicurezza. Le due idee cardine sono: **tutto è validato e serializzato tramite schema** (per velocità e sicurezza), e **tutto è un plugin, incapsulato** (per struttura e manutenibilità). Non sono dettagli implementativi: sono la ragione per cui Fastify "si sente" diverso da Express.

### Perché "schema-first" e non solo "è più veloce di Express"

Express valida (se lo fai) con codice imperativo sparso nei middleware, e serializza le risposte con `JSON.stringify` generico. Fastify ti chiede di dichiarare uno **schema JSON** per richiesta e risposta di ogni rotta. Da quello schema, Fastify:

1. **valida** l'input in ingresso con [Ajv](https://ajv.js.org/) (compilato, non interpretato ogni volta);
2. **compila un serializzatore su misura** per l'output con [`fast-json-stringify`](https://github.com/fastify/fast-json-stringify), che è molto più veloce di `JSON.stringify` proprio perché conosce già la forma esatta dell'oggetto e non deve "scoprirla" a runtime.

```ts
const opts = {
  schema: {
    body: {
      type: 'object',
      required: ['titolo'],
      properties: { titolo: { type: 'string' }, anno: { type: 'number' } },
    },
    response: {
      200: {
        type: 'object',
        properties: { id: { type: 'number' }, titolo: { type: 'string' } },
      },
    },
  },
}

fastify.post('/libri', opts, async (request, reply) => {
  // request.body è già validato secondo lo schema
  return { id: 1, titolo: request.body.titolo }
})
```

🧠 **Analogia**: Express ti dà un modulo, e ci scrivi controlli a mano ogni volta ("è una stringa? è presente?"), un po' come controllare a occhio ogni pacco in magazzino. Fastify ti chiede di descrivere una volta la "scheda tecnica" del pacco (lo schema), e poi usa una macchina che scansiona e impacchetta in automatico, molto più veloce e senza sviste — perché la macchina è stata **calibrata su quella scheda specifica**, non su un pacco generico.

Da qui nasce anche il ponte con la sezione precedente: se descrivi lo schema con Zod invece che con JSON Schema puro, e usi [`fastify-type-provider-zod`](https://github.com/turkerdev/fastify-type-provider-zod), `request.body` è **automaticamente tipizzato in TypeScript** dallo stesso schema che valida a runtime — un solo posto, zero `any`, zero duplicazione tra "il tipo" e "la validazione".

### Tutto è un plugin: l'incapsulamento

L'altra idea cardine: **ogni `register()` crea un contesto isolato**. Decoratori, hook e rotte definiti dentro un plugin non "salgono" verso l'esterno a meno che tu non lo chieda esplicitamente. È l'opposto di Express, dove tutto vive in un unico oggetto app globale.

🧠 **Analogia**: pensa a scatole cinesi (o alle bambole matrioska). Ogni scatola può vedere e usare quello che c'è **dentro di sé o nelle scatole madri**, ma non può vedere dentro le scatole "cugine" allo stesso livello, a meno che qualcuno non lo porti fuori di proposito. Un plugin che decora `fastify.pluginA` non lo rende visibile a un plugin fratello registrato accanto — resta chiuso nella sua scatola.

```ts
import Fastify from 'fastify'

const app = Fastify({ logger: true })

app.register(async function pluginLibri(fastify) {
  fastify.decorate('servizioLibri', creaServizioLibri())
  fastify.get('/libri', async () => fastify.servizioLibri.tuttiILibri())
})

app.register(async function pluginAutori(fastify) {
  // fastify.servizioLibri qui NON esiste: incapsulamento rispettato
  fastify.get('/autori', async () => [])
})
```

Quando vuoi *davvero* che qualcosa attraversi i confini (es. un client Prisma condiviso da tutta l'app), lo dichiari esplicitamente con [`fastify-plugin`](https://github.com/fastify/fastify-plugin), che dice a Fastify "non incapsulare questo, fallo salire":

```ts
import fp from 'fastify-plugin'
import { PrismaClient } from '@prisma/client'

export default fp(async function prismaPlugin(fastify) {
  const prisma = new PrismaClient()
  fastify.decorate('prisma', prisma)
  fastify.addHook('onClose', async (instance) => {
    await instance.prisma.$disconnect()
  })
})
```

### Hook: il ciclo di vita di una richiesta

Fastify espone punti di aggancio precisi lungo il ciclo di vita di ogni richiesta, invece del generico middleware "prima o dopo" di Express:

```
onRequest → preParsing → preValidation → preHandler → [ handler ] → preSerialization → onSend → onResponse
```

```ts
fastify.addHook('onRequest', async (request, reply) => {
  request.log.info({ url: request.url }, 'richiesta in arrivo')
})

fastify.addHook('preHandler', async (request, reply) => {
  if (!request.headers.authorization) {
    reply.code(401).send({ errore: 'Non autenticato' })
  }
})
```

### Autoload: strutturare tanti plugin senza impazzire

Man mano che l'app cresce, registrare a mano decine di `app.register(...)` diventa fragile. [`@fastify/autoload`](https://github.com/fastify/fastify-autoload) carica automaticamente tutti i plugin di una cartella, rispettando la struttura come gerarchia di incapsulamento — la userai nel mini progetto finale.

**Fonti per approfondire la filosofia**, direttamente da chi l'ha progettata: i talk e gli articoli di Matteo Collina su fastify.dev/docs, il suo blog su nodeland.dev, e i talk "Node.js and the Art of Performance" e le varie edizioni dei suoi speech su schema-based validation ai Node.js conf — il filo conduttore è sempre lo stesso: **misura, non indovinare**, e **lascia che sia lo schema a fare il lavoro pesante**.

---

## 4. Un ORM? Ancora? Pro e contro, poi come funziona Prisma

**In pillole**: un **ORM** (Object-Relational Mapper) traduce righe di tabelle SQL in oggetti del tuo linguaggio, e viceversa. È un dibattito vecchio quanto il backend: "è comodo" contro "nasconde troppo". La risposta pragmatica è: dipende dal problema, e Prisma ha cambiato parecchio i termini del dibattito rispetto agli ORM "classici".

### Pro e contro, onestamente

| Pro | Contro |
|---|---|
| Niente SQL ripetuto a mano per i CRUD standard | Query molto complesse (report, analytics) restano più chiare in SQL puro |
| Autocompletamento e tipi: refactoring sicuro | Un'astrazione di troppo può nascondere query N+1 costose |
| Migrazioni versionate e riproducibili | Un ORM "magico" può generare SQL inefficiente se non capisci cosa fa sotto |
| Portabilità tra database (in parte) | Non è mai portabilità totale: feature specifiche di un DB restano specifiche |
| Meno injection SQL "per errore" (query parametrizzate di default) | Ancora un livello da imparare, sopra SQL che comunque devi conoscere |

La sintesi pragmatica: **un ORM non ti esonera dal sapere SQL**, ti evita di scriverlo a mano per l'80% dei casi noiosi e ripetitivi, lasciandoti energie per il 20% che merita davvero attenzione manuale.

### Come funziona Prisma, concretamente

Prisma non è "solo un ORM" nel senso classico (niente Active Record, niente classi Entity con metodi `.save()`): è un set di tre pezzi attorno a un'unica fonte di verità, il file `schema.prisma`.

```prisma
// schema.prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Autore {
  id     Int    @id @default(autoincrement())
  nome   String
  libri  Libro[]           // relazione 1-N: un autore ha molti libri
}

model Libro {
  id        Int      @id @default(autoincrement())
  titolo    String
  anno      Int?
  autore    Autore   @relation(fields: [autoreId], references: [id])
  autoreId  Int
  tag       Tag[]    @relation("LibroTag")   // relazione N-N tramite tabella implicita
}

model Tag {
  id     Int     @id @default(autoincrement())
  nome   String  @unique
  libri  Libro[] @relation("LibroTag")
}
```

Da questo unico file nascono tre cose:

1. **Il Prisma Client**, generato con `prisma generate`: una libreria TypeScript su misura per *il tuo* schema, completamente tipizzata — `prisma.libro.findMany()` sa già che ogni riga ha `titolo: string` e `anno: number | null`, senza che tu scriva un'interfaccia a mano.
2. **Le migrazioni**, gestite con `prisma migrate dev`: ogni volta che cambi lo schema, Prisma calcola il diff, genera un file SQL versionato in `prisma/migrations/`, e lo applica al database di sviluppo. In produzione si usa `prisma migrate deploy`, che applica solo le migrazioni già scritte, senza generarne di nuove — mai magia in produzione.
3. **Il motore di query**, un binario scritto in Rust che riceve richieste strutturate dal Client Node e le traduce in SQL ottimizzato per il database specifico che stai usando.

```ts
// Relazioni: leggere un autore con tutti i suoi libri, in una query
const autore = await prisma.autore.findUnique({
  where: { id: 1 },
  include: { libri: true },
})

// Creare un libro collegato a un autore esistente
await prisma.libro.create({
  data: { titolo: 'Il Nome della Rosa', autoreId: 1 },
})

// Transazione: o vanno bene entrambe le operazioni, o nessuna
await prisma.$transaction([
  prisma.autore.update({ where: { id: 1 }, data: { nome: 'U. Eco' } }),
  prisma.libro.updateMany({ where: { autoreId: 1 }, data: { anno: 1980 } }),
])
```

### Prisma contro le alternative, in breve

| Strumento | Livello di astrazione | Quando ha senso |
|---|---|---|
| SQL puro (`pg`, driver nativo) | zero astrazione | query molto specifiche, massime prestazioni, team già esperti di SQL |
| Query builder (Kysely, Knex) | costruisci SQL con un'API tipizzata, resti vicino al motore | vuoi i tipi ma non vuoi "un ORM" sopra la testa |
| Prisma | schema dichiarativo, client generato, migrazioni incluse | la maggioranza delle API CRUD-centriche, team che vogliono velocità di sviluppo |
| ORM "attivi" (TypeORM, Sequelize) | oggetti con metodi propri (Active Record) | preferenza di stile, spesso più magia implicita |

---

## 5. DDD in Fastify, restando semplici — Clean Code, Clean Architecture

**In pillole**: Domain-Driven Design "da manuale" (aggregate root, value object, bounded context, event storming...) nasce per domini enormi e complessi, con team di decine di persone. La maggior parte delle API che scriviamo non è quel caso. Quello che vale la pena tenere del DDD, anche in un progetto piccolo, è **una cosa sola**: separare "di cosa parla il business" da "come arriva su HTTP" e da "come è salvato su disco". Tre strati, non trenta.

```
src/
  modules/
    libri/
      libri.routes.ts       # strato HTTP: riceve la request, chiama il service, risponde
      libri.service.ts      # strato di dominio: le regole di business, in TS puro
      libri.repository.ts   # strato dati: parla con Prisma, e SOLO lui parla con Prisma
      libri.schema.ts       # schema di validazione + tipi (Zod), condiviso dai tre sopra
```

🧠 **Analogia**: pensa a un ristorante. Il cameriere (routes) prende l'ordine e lo porta al cliente — non decide lui cosa può essere cucinato. Lo chef (service) decide le ricette e le regole ("niente glutine se il cliente è allergico") — non sa se l'ordine è arrivato per telefono o di persona. Il magazziniere (repository) sa dove sono gli ingredienti in dispensa — ma non decide i piatti. Ognuno fa un solo mestiere, e puoi cambiarne uno senza toccare gli altri due (es. cambiare database senza toccare le regole di business).

```ts
// libri.repository.ts — SOLO qui si parla con Prisma
export function creaLibriRepository(prisma: PrismaClient) {
  return {
    trova: (id: number) => prisma.libro.findUnique({ where: { id } }),
    creaLibro: (dati: NuovoLibro) => prisma.libro.create({ data: dati }),
  }
}

// libri.service.ts — le regole di dominio, in TS puro, senza sapere che esiste HTTP
export function creaLibriService(repo: ReturnType<typeof creaLibriRepository>) {
  return {
    async pubblica(dati: NuovoLibro) {
      if (dati.anno && dati.anno > new Date().getFullYear()) {
        throw new DomainError('Un libro non può essere pubblicato nel futuro')
      }
      return repo.creaLibro(dati)
    },
  }
}

// Errore di dominio esplicito, non un generico `throw new Error(...)`
export class DomainError extends Error {}
```

```ts
// libri.routes.ts — SOLO strato HTTP: traduce request/response, non conosce le regole
export default async function libriRoutes(fastify: FastifyInstance) {
  const service = creaLibriService(creaLibriRepository(fastify.prisma))

  fastify.post('/libri', { schema: { body: NuovoLibroSchema } }, async (request, reply) => {
    try {
      const libro = await service.pubblica(request.body)
      reply.code(201).send(libro)
    } catch (e) {
      if (e instanceof DomainError) return reply.code(422).send({ errore: e.message })
      throw e
    }
  })
}
```

Questo è **Clean Architecture ridotta all'osso**: le dipendenze puntano verso l'interno (le routes dipendono dal service, il service NON dipende da Fastify), il "cuore" del dominio (`libri.service.ts`) è testabile senza avviare un server HTTP o un database vero, e ogni file ha una sola ragione per cambiare (single responsibility, il primo dei principi di Clean Code).

**Quando serve davvero il DDD "pesante"**: dominio con regole intricate condivise da più moduli, più team che lavorano sullo stesso dominio con linguaggi diversi (bounded context reale), logica di business che sopravvive a più interfacce (HTTP oggi, un worker domani, un gRPC dopodomani). Se il tuo caso è "CRUD con qualche regola", i tre strati sopra bastano e avanzano.

---

## 6. Pragmatismo, pragmatismo!

**In pillole**: la trappola più comune per chi ha appena imparato pattern e principi (compreso tutto quello che hai letto finora in questo playbook) è applicarli **ovunque, sempre, fin dal primo giorno**. Non farlo. Le regole d'oro:

- **YAGNI** ("You Aren't Gonna Need It"): non costruire l'astrazione per il caso ipotetico di domani. Costruiscila il giorno in cui il caso di domani diventa il caso di oggi.
- **La regola delle tre volte**: duplica una piccola cosa due volte senza rimorsi. Solo alla terza ripetizione, estrai l'astrazione — a quel punto sai davvero *quale* astrazione serve, non stai indovinando.
- **Codice noioso è codice buono**: un `if` chiaro batte un pattern elegante che il prossimo (o tu, tra sei mesi) deve decifrare.
- **Non tutte le rotte meritano tre strati**: un endpoint di health-check da una riga (`fastify.get('/health', ...)`) non ha bisogno di repository e service. I tre strati servono dove c'è **logica di dominio da proteggere**, non ovunque per coerenza estetica.
- **Rifattorizza quando fa male, non prima**: il segnale per estrarre un'astrazione è il dolore reale (un bug ripetuto, una modifica che tocca cinque file), non la sensazione astratta che "si dovrebbe fare bene".

In una riga: gli strumenti di questo playbook (tipi, schema, plugin, strati di dominio) esistono per **ridurre** la complessità che già hai, non per aggiungertene una nuova a scopo decorativo.

---

## 7. Testing: `node:test`, mock delle dipendenze, batterie incluse

**In pillole**: da Node 18+ il modulo `node:test` è **integrato nel runtime**, insieme a `node:assert/strict` per le asserzioni e a `node:test`'s `mock` per mockare funzioni e metodi. Niente Jest, niente Mocha, niente Sinon da installare: zero dipendenze extra per testare tutto lo stack di questo playbook.

### Le basi

```ts
// libri.service.test.ts
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { creaLibriService, DomainError } from './libri.service.ts'

describe('libri.service', () => {
  it('rifiuta un libro con anno nel futuro', async () => {
    const repoFinto = { creaLibro: async () => { throw new Error('non dovrebbe arrivare qui') } }
    const service = creaLibriService(repoFinto as any) // qui `as any` è accettabile: è un test double minimale

    await assert.rejects(
      () => service.pubblica({ titolo: 'X', autoreId: 1, anno: 3000 }),
      DomainError,
    )
  })
})
```

```bash
node --test src/**/*.test.ts   # con un loader TS come tsx, o compilando prima
```

### Mock delle dipendenze senza librerie esterne

`node:test` espone `mock.fn()` per creare funzioni finte con asserzioni su chiamate, e `mock.method()` per sostituire temporaneamente un metodo su un oggetto reale, ripristinato in automatico a fine test.

```ts
import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'

describe('libri.service con repository mockato', () => {
  it('salva il libro passando i dati corretti al repository', async () => {
    const creaLibroMock = mock.fn(async (dati) => ({ id: 1, ...dati }))
    const repoFinto = { creaLibro: creaLibroMock }

    const service = creaLibriService(repoFinto as any)
    const risultato = await service.pubblica({ titolo: 'Dune', autoreId: 2 })

    assert.equal(creaLibroMock.mock.calls.length, 1)
    assert.deepEqual(creaLibroMock.mock.calls[0].arguments[0], { titolo: 'Dune', autoreId: 2 })
    assert.equal(risultato.id, 1)
  })
})
```

Questo è il senso della sezione DDD di prima: perché `libri.service.ts` non conosce Prisma né Fastify, testarlo è passare un **oggetto finto** al posto del repository — nessun database vero, nessun server in ascolto, test che gira in millisecondi.

### Testare le rotte Fastify senza un server acceso

Fastify offre `app.inject()`: simula una richiesta HTTP **senza aprire davvero una porta di rete**. Niente bisogno di `supertest` o di avviare/spegnere un server nei test.

```ts
import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { buildApp } from '../app.ts'

describe('POST /libri', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  before(async () => { app = await buildApp({ logger: false }) })
  after(async () => { await app.close() })

  it('crea un libro e risponde 201', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/libri',
      payload: { titolo: 'Fondazione', autoreId: 1 },
    })

    assert.equal(response.statusCode, 201)
    assert.equal(response.json().titolo, 'Fondazione')
  })

  it('rifiuta un payload senza titolo con 400', async () => {
    const response = await app.inject({ method: 'POST', url: '/libri', payload: {} })
    assert.equal(response.statusCode, 400) // validazione dello schema, gratis
  })
})
```

Nota l'ultimo test: la validazione a 400 non l'hai scritta tu, arriva **gratis** dallo schema che hai già dichiarato in Fastify — un altro punto a favore dell'approccio schema-first della sezione 3.

---

## 8. Mini progetto completo, step-by-step

Costruiamo una piccola **API di una libreria** ("Bookshelf API"): `Autore` e `Libro` in relazione 1-N, Fastify + TypeScript + Prisma + SQLite, tre strati come nella sezione DDD, test con `node:test`. Zero `any`.

### Step 1 — Setup

```bash
mkdir bookshelf-api && cd bookshelf-api
pnpm init
pnpm add fastify @fastify/autoload fastify-plugin zod fastify-type-provider-zod pino-pretty
pnpm add -D typescript tsx @types/node prisma
pnpm dlx tsc --init
```

### Step 2 — `tsconfig.json` in modalità strict

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["src"]
}
```

### Step 3 — Schema Prisma e prima migrazione

```bash
pnpm dlx prisma init --datasource-provider sqlite
```

```prisma
// prisma/schema.prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Autore {
  id    Int     @id @default(autoincrement())
  nome  String
  libri Libro[]
}

model Libro {
  id       Int     @id @default(autoincrement())
  titolo   String
  anno     Int?
  autore   Autore  @relation(fields: [autoreId], references: [id])
  autoreId Int
}
```

```bash
pnpm dlx prisma migrate dev --name init   # crea prisma/migrations/..., aggiorna il DB, rigenera il Client
```

### Step 4 — Struttura delle cartelle

```
src/
  app.ts
  server.ts
  plugins/
    prisma.ts
  modules/
    libri/
      libri.schema.ts
      libri.repository.ts
      libri.service.ts
      libri.routes.ts
      libri.service.test.ts
      libri.routes.test.ts
```

### Step 5 — Il plugin Prisma, condiviso da tutta l'app

```ts
// src/plugins/prisma.ts
import fp from 'fastify-plugin'
import { PrismaClient } from '@prisma/client'
import type { FastifyInstance } from 'fastify'

declare module 'fastify' {
  interface FastifyInstance { prisma: PrismaClient }
}

export default fp(async function prismaPlugin(fastify: FastifyInstance) {
  const prisma = new PrismaClient()
  fastify.decorate('prisma', prisma)
  fastify.addHook('onClose', async (instance) => {
    await instance.prisma.$disconnect()
  })
})
```

Nota il blocco `declare module 'fastify'`: è così che informi TypeScript che `fastify.prisma` esiste — senza, `fastify.prisma` sarebbe un errore di tipo (o, peggio, un `any` implicito).

### Step 6 — Schema di validazione con Zod (niente `any`, mai)

```ts
// src/modules/libri/libri.schema.ts
import { z } from 'zod'

export const NuovoLibroSchema = z.object({
  titolo: z.string().min(1),
  anno: z.number().int().optional(),
  autoreId: z.number().int(),
})
export type NuovoLibro = z.infer<typeof NuovoLibroSchema>

export const LibroSchema = NuovoLibroSchema.extend({ id: z.number().int() })
```

### Step 7 — Repository, service, routes

```ts
// src/modules/libri/libri.repository.ts
import type { PrismaClient } from '@prisma/client'
import type { NuovoLibro } from './libri.schema.ts'

export function creaLibriRepository(prisma: PrismaClient) {
  return {
    tutti: () => prisma.libro.findMany(),
    trova: (id: number) => prisma.libro.findUnique({ where: { id } }),
    crea: (dati: NuovoLibro) => prisma.libro.create({ data: dati }),
  }
}
export type LibriRepository = ReturnType<typeof creaLibriRepository>
```

```ts
// src/modules/libri/libri.service.ts
import type { LibriRepository } from './libri.repository.ts'
import type { NuovoLibro } from './libri.schema.ts'

export class DomainError extends Error {}

export function creaLibriService(repo: LibriRepository) {
  return {
    elenco: () => repo.tutti(),
    async pubblica(dati: NuovoLibro) {
      if (dati.anno && dati.anno > new Date().getFullYear()) {
        throw new DomainError('Un libro non può essere pubblicato nel futuro')
      }
      return repo.crea(dati)
    },
  }
}
```

```ts
// src/modules/libri/libri.routes.ts
import type { FastifyInstance } from 'fastify'
import { NuovoLibroSchema } from './libri.schema.ts'
import { creaLibriRepository } from './libri.repository.ts'
import { creaLibriService, DomainError } from './libri.service.ts'

export default async function libriRoutes(fastify: FastifyInstance) {
  const service = creaLibriService(creaLibriRepository(fastify.prisma))

  fastify.get('/libri', async () => service.elenco())

  fastify.post('/libri', {
    schema: { body: NuovoLibroSchema },
  }, async (request, reply) => {
    try {
      const libro = await service.pubblica(request.body)
      reply.code(201).send(libro)
    } catch (e) {
      if (e instanceof DomainError) return reply.code(422).send({ errore: e.message })
      throw e
    }
  })
}
```

### Step 8 — `app.ts`: assemblare tutto con autoload

```ts
// src/app.ts
import Fastify, { type FastifyBaseLogger } from 'fastify'
import AutoLoad from '@fastify/autoload'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export async function buildApp(opts: { logger: boolean }) {
  const app = Fastify({ logger: opts.logger })

  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  await app.register(AutoLoad, { dir: path.join(__dirname, 'plugins') })
  await app.register(libriRoutesLoader)

  return app
}

async function libriRoutesLoader(fastify: Awaited<ReturnType<typeof Fastify>>) {
  const { default: libriRoutes } = await import('./modules/libri/libri.routes.ts')
  fastify.register(libriRoutes)
}
```

```ts
// src/server.ts
import { buildApp } from './app.ts'

const app = await buildApp({ logger: true })

app.listen({ port: 3000 }, (err) => {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
})
```

### Step 9 — I test

```ts
// src/modules/libri/libri.service.test.ts
import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'
import { creaLibriService, DomainError } from './libri.service.ts'
import type { LibriRepository } from './libri.repository.ts'

describe('libri.service', () => {
  it('rifiuta anni futuri', async () => {
    const repo = { crea: mock.fn(), tutti: mock.fn(), trova: mock.fn() } as unknown as LibriRepository
    const service = creaLibriService(repo)

    await assert.rejects(
      () => service.pubblica({ titolo: 'X', autoreId: 1, anno: 3000 }),
      DomainError,
    )
    assert.equal((repo.crea as ReturnType<typeof mock.fn>).mock.calls.length, 0)
  })

  it('pubblica un libro valido', async () => {
    const creaMock = mock.fn(async (dati) => ({ id: 1, ...dati }))
    const repo = { crea: creaMock, tutti: mock.fn(), trova: mock.fn() } as unknown as LibriRepository
    const service = creaLibriService(repo)

    const risultato = await service.pubblica({ titolo: 'Dune', autoreId: 2 })
    assert.equal(risultato.id, 1)
  })
})
```

```ts
// src/modules/libri/libri.routes.test.ts
import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { buildApp } from '../../app.ts'

describe('POST /libri', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  before(async () => { app = await buildApp({ logger: false }) })
  after(async () => { await app.close() })

  it('risponde 400 se manca il titolo', async () => {
    const res = await app.inject({ method: 'POST', url: '/libri', payload: { autoreId: 1 } })
    assert.equal(res.statusCode, 400)
  })
})
```

```bash
node --import tsx --test src/**/*.test.ts
```

### Step 10 — Avviare e provare

```bash
pnpm tsx src/server.ts
```

```bash
curl -X POST http://localhost:3000/libri \
  -H 'content-type: application/json' \
  -d '{"titolo": "Neuromante", "autoreId": 1}'
# 201 { "id": 1, "titolo": "Neuromante", "autoreId": 1 }

curl -X POST http://localhost:3000/libri \
  -H 'content-type: application/json' \
  -d '{"autoreId": 1}'
# 400: manca "titolo" nel body, la validazione dello schema lo blocca prima ancora del service
```

Da qui, i prossimi passi naturali sono: aggiungere il modulo `autori` con la stessa struttura a tre strati, aggiungere autenticazione con un hook `preHandler`, e spostare `DATABASE_URL` da SQLite a Postgres cambiando solo il `provider` in `schema.prisma` — il resto del codice applicativo non si accorge della differenza.

---

## Riepilogo

| Concetto | Problema che risolve | Analogia |
|---|---|---|
| Event loop di Node | fare tante operazioni I/O senza bloccare tutto con un solo thread | un cameriere che non aspetta mai impalato in cucina |
| Tipi di TypeScript | catturare errori a compile time invece che in produzione | un correttore di bozze pignolo, che sparisce alla stampa |
| `unknown` + narrowing / Zod | validare ciò che arriva da fuori senza spegnere i controlli con `any` | controllare il pacco prima di aprirlo, non fidarsi a scatola chiusa |
| Fastify: schema-first | validazione e serializzazione veloci, compilate su misura | una macchina calibrata sulla scheda tecnica del pacco, non un controllo a occhio |
| Fastify: plugin incapsulati | struttura chiara, niente stato globale che trapela ovunque | scatole cinesi: si vede dentro e verso l'alto, non lateralmente |
| Prisma: schema.prisma | un'unica fonte di verità per client tipizzato + migrazioni | la pianta di una casa, da cui derivano sia i mobili su misura sia i lavori di ristrutturazione |
| Tre strati (routes/service/repository) | separare HTTP, regole di business e accesso ai dati | cameriere, chef e magazziniere: un mestiere ciascuno |
| `node:test` + mock | test veloci, senza dipendenze extra, senza server o DB veri | provare la ricetta dello chef senza aprire il ristorante |

Questo stack non è gettonato per moda: Node gestisce bene il carico I/O tipico delle API, TypeScript toglie una classe intera di bug prima ancora di eseguire una riga, Fastify converte la validazione in velocità invece che in overhead, e Prisma rende le migrazioni un dettaglio noioso invece di un incubo. Messi insieme con pragmatismo — tre strati quando servono, non sempre; test che mockano solo il necessario — è uno stack con cui puoi costruire in fretta senza costruire male.
