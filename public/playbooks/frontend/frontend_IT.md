# React, Angular, Vue per Backenders che Vivono in un Terminale

Hai passato una carriera intera dentro un terminale. Sai a memoria le opzioni di `curl`, scrivi query SQL più velocemente di quanto altri scrivano un'email, e hai un'opinione fortissima su tab vs spazi che difenderesti in tribunale. Poi qualcuno ti chiede di "mettere mano al frontend" e la tua faccia fa la stessa espressione di quando ti chiedono di usare Excel per fare i conti.

Non sei allergico al frontend. Sei allergico a come te l'hanno spiegato finora: tutorial pieni di `<div>` senza senso, "magia" che aggiorna lo schermo senza dirti perché, e community online che danno per scontato che tu sappia già cos'è un DOM. Questo playbook parte dal presupposto opposto: **tu sai benissimo cos'è uno stato, una funzione pura, un event loop, una cache, un grafo di dipendenze**. Devi solo scoprire che React, Vue e Angular sono, sotto sotto, gli stessi concetti che già padroneggi, con un nome diverso e un output visivo invece che testuale.

Alla fine di questo playbook non solo capirai i tre framework più usati al mondo per costruire interfacce: probabilmente ti innamorerai di uno di loro. Iniziamo con le due cose che ti servono per non sentirti perso nei prossimi capitoli: cos'è davvero l'HTML, e cos'è davvero un "componente".

---

## 0. Il crash course per chi odia l'HTML

**In pillole**: l'HTML non è "roba di designer". È semplicemente un formato dati ad albero, esattamente come un JSON o un AST, solo con una sintassi diversa e un significato speciale per il browser: quell'albero, il browser lo *disegna*.

### L'HTML è solo un albero di nodi

Se hai mai scritto codice che manipola un AST (Abstract Syntax Tree) — il tipo di struttura che un parser produce da codice sorgente — hai già capito l'HTML. Ogni tag è un nodo, ogni nodo può avere figli, e il browser cammina quell'albero e disegna ogni nodo a schermo secondo regole precise (le stesse regole che rendono il CSS "prevedibile", non magico — se non le conosci, dai un'occhiata al playbook **CSS for Backenders**).

```html
<div>                    <!-- nodo: contenitore generico -->
  <h1>Titolo</h1>        <!-- nodo figlio: titolo -->
  <p>Un paragrafo</p>    <!-- nodo figlio: testo -->
</div>
```

è concettualmente identico a:

```json
{
  "tag": "div",
  "children": [
    { "tag": "h1", "text": "Titolo" },
    { "tag": "p", "text": "Un paragrafo" }
  ]
}
```

Quella struttura, quando il browser la carica in memoria, si chiama **DOM** (Document Object Model): è letteralmente l'oggetto — l'albero navigabile, mutabile a runtime — che rappresenta la pagina. Ogni volta che senti "manipolare il DOM", significa "modificare questo albero in memoria", esattamente come modificheresti un albero JSON parsato con un qualsiasi linguaggio.

### Cosa fa "framework" che l'HTML puro non fa

Con HTML puro, per cambiare cosa vedi a schermo devi manipolare quell'albero a mano, nodo per nodo (`document.createElement`, `.appendChild`, `.textContent = ...`). Funziona, ma diventa presto insostenibile: è come costruire una risposta HTTP concatenando stringhe a mano invece di usare un template engine.

Un framework frontend (React, Vue, Angular) fa esattamente quello che farebbe un **template engine lato server** (pensa a Jinja per Python, ERB per Ruby, ASP.NET Razor), con una differenza cruciale: invece di generare l'HTML *una volta* quando arriva una richiesta HTTP e poi sparire, il framework resta vivo nel browser e **rigenera** i pezzi di albero che devono cambiare, ogni volta che cambia un dato — senza far ricaricare la pagina. Questo continuo "rigenerare i pezzi giusti quando cambia un dato" si chiama **reattività**, ed è il vero superpotere che stai per imparare a usare in tre salse diverse.

### Cos'è un "componente"

Un componente è, senza fronzoli, **una funzione che prende dei dati in input e restituisce un pezzo di albero HTML**. Punto. Non è più complicato di questo:

```
Componente = f(stato, props) → albero HTML
```

Esattamente come una funzione pura in un linguaggio backend prende argomenti e restituisce un valore, un componente prende "stato" (i suoi dati interni) e "props" (i dati passati dal genitore, come i parametri di una funzione) e restituisce cosa disegnare. Ogni framework in questo playbook implementa questa idea in modo leggermente diverso — e quella differenza, più di ogni altra cosa, è ciò che li distingue davvero.

> 💡 **Il punto che sblocca tutto**: se hai già capito "funzione pura che riceve input e produce output", hai già capito il 70% di React, Vue e Angular. Il restante 30% è: *quando* e *come* quella funzione viene richiamata di nuovo quando i dati cambiano. È esattamente lì che i tre framework differiscono, ed è esattamente lì che ci concentreremo per ognuno di loro.

---
## 1. React 19 — una funzione pura che ridisegna il mondo ogni volta che cambi idea

**In pillole**: React non è un linguaggio di template come Jinja o ERB, ma nemmeno un sistema reattivo a grana fine come Vue o Angular. È una libreria che ti fa scrivere l'interfaccia come una **funzione pura**: gli dai lo stato, lei ti restituisce un albero di elementi (JSX). Cambia lo stato, richiama la funzione, e React calcola *da solo* il minimo indispensabile da aggiornare nel DOM vero. Zero magia, solo un diff algoritmico — lo stesso mestiere che fa `git diff`, applicato a un albero invece che a un testo.

### Filosofia: UI come funzione pura di stato

Se hai mai scritto una funzione che prende un dizionario di dati e sputa fuori una stringa HTML — un endpoint Flask con `render_template`, uno script ERB, un report generato da un template Jinja — hai già capito il 90% di React. La differenza è una sola: invece di rigenerare l'HTML e sovrascrivere tutto ogni volta (costoso, e perdi lo stato del form, dello scroll, del focus), React tiene una copia "precedente" dell'albero, calcola quella "nuova", fa un diff, e tocca nel DOM reale **solo i nodi che sono davvero cambiati**.

```tsx
// Un componente React è, letteralmente, una funzione: stato in, albero fuori
function Counter() {
  const [count, setCount] = useState(0); // lo "stato" — i dati che possono cambiare

  return (
    <button onClick={() => setCount(count + 1)}>
      Hai cliccato {count} volte
    </button>
  );
}
```

Non c'è nessun ciclo di eventi nascosto da imparare a memoria, nessun "watcher" magico. `setCount` dice a React "ehi, ridisegna". React richiama `Counter()`, ottiene un nuovo albero JSX, lo confronta col precedente, e aggiorna solo il testo dentro `<button>`. Punto.

### Cosa c'è di nuovo (in due righe)

React 19 (stabile da dicembre 2024) aggiunge le **Actions** (`useActionState`, `useOptimistic`) per gestire form e mutazioni senza gestire a mano loading/error a manina, il hook `use()` per leggere Promise o Context in modo condizionale (anche dentro un `if`, cosa impossibile con gli altri hook), e il **ref-as-a-prop**: puoi passare `ref` come una prop normale, niente più `forwardRef` per la maggior parte dei casi. I Server Components esistono, ma sono un concetto a livello di framework (Next.js) — con un semplice Vite non li vedrai, e va benissimo così.

### Come strutturare un progetto

Il default pragmatico per una SPA pura, senza fronzoli:

```bash
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install
npm run dev
```

Questo ti dà: bundler veloce (esbuild + Rollup), TypeScript pronto, hot reload. Niente altro. Struttura tipica:

```
my-app/
├── src/
│   ├── components/     # componenti UI riutilizzabili
│   ├── hooks/          # custom hooks (logica riutilizzabile)
│   ├── api/            # chiamate al backend, query TanStack
│   ├── App.tsx
│   └── main.tsx         # entry point, monta l'app nel DOM
├── index.html
├── vite.config.ts
└── package.json
```

> 💡 **Quando NON usare Vite puro**: se ti serve SSR, routing basato su file, o generazione statica "gratis", allora sì, prendi in considerazione Next.js. Ma è un salto di complessità — non partire da lì "perché lo fanno tutti". Parti da Vite, e migra solo se ti serve davvero.

### Approccio pragmatico: cosa NON ti serve

| Cosa | Perché puoi saltarla (per ora) |
|---|---|
| Redux | Boilerplate pesante per la maggior parte dei progetti. Zustand copre il 90% dei casi con un decimo del codice. |
| Next.js di default | È un framework con SSR, routing a file, e tante convenzioni. Serve solo se hai bisogno esplicito di SSR/SEO/routing integrato. |
| `forwardRef` ovunque | Con React 19, `ref` è una prop come le altre nella maggior parte dei casi. |
| Class Components | Legacy. Gli hook li hanno sostituiti completamente dal 2019 in poi. Se vedi `class extends React.Component`, è codice vecchio. |
| Un state manager "perché sì" | Se il tuo stato è locale a un componente o due, `useState` basta. Non installare Zustand/Redux "per abitudine". |

### Lo stato: dove lo metto?

Pensa allo stato come alla visibilità di una variabile in un linguaggio con scope a blocchi: **parti dallo scope più stretto possibile**, e allarghi solo quando ti serve davvero condividerlo.

```tsx
// Stato locale — vive e muore con il componente, come una variabile locale in una funzione
function SearchBox() {
  const [query, setQuery] = useState('');
  return <input value={query} onChange={e => setQuery(e.target.value)} />;
}
```

Per stato più complesso con transizioni ben definite, `useReducer` è la tua state machine in miniatura (esattamente come uno `match` su un enum di stati):

```tsx
type State = { status: 'idle' | 'loading' | 'done'; data?: string };
type Action = { type: 'FETCH' } | { type: 'SUCCESS'; payload: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'FETCH':   return { status: 'loading' };
    case 'SUCCESS': return { status: 'done', data: action.payload };
  }
}

const [state, dispatch] = useReducer(reducer, { status: 'idle' });
```

**Context**, per condividere qualcosa a più livelli di profondità senza passare props manualmente ("prop drilling"):

```tsx
const ThemeContext = createContext<'light' | 'dark'>('light');

function App() {
  return (
    <ThemeContext value="dark">   {/* React 19: niente più .Provider */}
      <Dashboard />
    </ThemeContext>
  );
}

function Dashboard() {
  const theme = use(ThemeContext); // legge il valore, ovunque nell'albero
  return <div className={theme}>...</div>;
}
```

> ❌ **Context NON è uno state manager.** È dependency injection per valori — come un container DI che risolve una dipendenza lungo la catena delle chiamate invece di passarla parametro per parametro. Ma ha un costo preciso: **quando il valore cambia, TUTTI i consumer si ri-renderizzano**, anche quelli che usano solo un pezzettino di quel valore. Usalo per cose che cambiano raramente (tema, utente loggato, lingua), non per stato che cambia ad ogni tasto premuto.

Per stato globale/condiviso che cambia spesso, **Zustand** è il default pragmatico moderno: niente Provider da annidare, niente boilerplate di action/reducer/dispatch, un semplice store con hook:

```tsx
import { create } from 'zustand';

interface CartStore {
  items: string[];
  addItem: (item: string) => void;
}

const useCartStore = create<CartStore>((set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
}));

// In qualsiasi componente, senza Provider, senza wrapper:
function CartBadge() {
  const items = useCartStore((state) => state.items);
  return <span>{items.length} articoli</span>;
}
```

| Strumento | Quando usarlo |
|---|---|
| `useState` / `useReducer` | Stato locale a un componente (o alla sua sotto-albero diretta) |
| Context | Valori che cambiano raramente, condivisi in profondità (tema, auth, i18n) |
| **Zustand** | Stato globale/condiviso che cambia spesso — il default pragmatico |
| Redux Toolkit | Solo se la tua azienda lo usa già ovunque — non partire da qui su un progetto nuovo |
| Jotai | Alternativa "atomica" a Zustand — utile se preferisci comporre tanti piccoli stati indipendenti invece di un unico store |

### Reattività spiegata facile

Questa è la parte che devi capire fino in fondo, perché è **diversa** da come funzionano Vue o Angular, e la differenza spiega tutto il resto.

Vue/Angular tracciano le dipendenze a grana fine, come uno spreadsheet: cambi la cella A1, e solo le celle che dipendono da A1 si ricalcolano. React **non fa questo**. React ha un modello molto più brutale e molto più prevedibile:

> 🧠 **Il mantra**: un componente React è una funzione pura. Stato in ingresso, albero JSX in uscita. Quando lo stato cambia, React **richiama l'intera funzione da capo**, ottiene il nuovo albero, e lo confronta (*diff*) con quello precedente (*reconciliation*). Solo le differenze vengono applicate al DOM reale.

Pensa a un templating engine lato server tipo Jinja o ERB: ogni richiesta HTTP rigenera l'intero HTML della pagina da zero, a partire dal template e dai dati. Il server non "traccia" quali variabili sono cambiate — semplicemente ri-esegue tutto il template ogni volta. React fa la stessa cosa, ma invece di buttare via il vecchio HTML e sostituirlo interamente (costoso, e perderesti focus/scroll/stato dei form), tiene una rappresentazione in memoria dell'albero precedente (il "Virtual DOM") e calcola un **patch minimale** da applicare al DOM vero.

```tsx
function Profile({ name }: { name: string }) {
  console.log('Profile viene rieseguito!'); // questo stampa ad OGNI render, non solo se `name` cambia
  return <h1>Ciao, {name}</h1>;
}
```

Ogni volta che il componente padre si ri-renderizza, `Profile` viene richiamato di nuovo — anche se `name` non è cambiato. React calcola il nuovo JSX, lo confronta col precedente, vede che l'output è identico, e non tocca il DOM. **Il ricalcolo della funzione è cheap; toccare il DOM reale è costoso.** Ecco perché il modello funziona: ri-eseguire una funzione JS pura milioni di volte al secondo non è un problema, il collo di bottiglia è sempre e solo il DOM reale.

```tsx
// La "key" nelle liste è l'informazione che manca al diff per essere efficiente:
// dice a React "questo elemento specifico è LO STESSO di prima, anche se si è spostato"
{users.map(user => (
  <UserRow key={user.id} user={user} />   // ✅ id stabile: React sa cosa riordinare
))}
```

Senza una `key` stabile, React deve indovinare — e spesso indovina male, ricreando nodi DOM che potevi riusare (perdendo focus, stato dell'input, animazioni in corso).

`memo`, `useMemo` e `useCallback` esistono per un solo motivo: dire a React "non richiamare questa funzione/non ricalcolare questo albero se gli input non sono cambiati" — è letteralmente una cache con chiave sugli argomenti, lo stesso concetto di `@lru_cache` o memoization che già conosci, applicato ai render invece che alle chiamate di funzione.

### Test unitari di un componente

Stack pragmatico moderno: **Vitest** (non Jest — è quello che Vite usa nativamente, ed è più veloce) + **React Testing Library**, che ti spinge a testare "cosa vede l'utente", non i dettagli implementativi.

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

```tsx
// Counter.tsx
export function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(count + 1)}>
      Cliccato {count} volte
    </button>
  );
}
```

```tsx
// Counter.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Counter } from './Counter';

describe('Counter', () => {
  it('incrementa il contatore al click', () => {
    render(<Counter />);

    const button = screen.getByRole('button', { name: /cliccato 0 volte/i });
    fireEvent.click(button);

    expect(screen.getByRole('button', { name: /cliccato 1 volte/i })).toBeInTheDocument();
  });
});
```

`getByRole` cerca l'elemento come lo troverebbe un utente (o uno screen reader) — non un `document.querySelector('.btn-primary')` fragile che si rompe al primo refactor di classi CSS.

### Come interagisco con il backend

`useEffect` + `fetch` è quello che scrivi al primo tentativo. È anche un **anti-pattern** per qualsiasi cosa più seria di un prototipo giocattolo, per lo stesso motivo per cui non scriveresti un client HTTP a mano senza retry, timeout e cache quando esiste già una libreria matura:

```tsx
// ❌ L'anti-pattern classico
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(setUser);
    // Problemi: (1) race condition se userId cambia velocemente e le risposte
    // arrivano fuori ordine, (2) nessuna cache — richiedi di nuovo ad ogni mount,
    // (3) nessun retry, (4) loading/error state da gestire a mano ogni volta
  }, [userId]);

  return user ? <div>{user.name}</div> : <div>Caricamento...</div>;
}
```

**TanStack Query** (`@tanstack/react-query`) è il default pragmatico per lo "stato server": gestisce cache, invalidazione, retry, deduplica richieste identiche, e ti dà loading/error come valori pronti all'uso.

```bash
npm install @tanstack/react-query
```

```tsx
// api/users.ts
async function fetchUser(userId: string) {
  const res = await fetch(`/api/users/${userId}`);
  if (!res.ok) throw new Error('Failed to fetch user');
  return res.json();
}

// UserProfile.tsx
import { useQuery } from '@tanstack/react-query';

function UserProfile({ userId }: { userId: string }) {
  const { data, isPending, isError } = useQuery({
    queryKey: ['user', userId],   // la chiave di cache — cambia userId, invalida da solo
    queryFn: () => fetchUser(userId),
  });

  if (isPending) return <div>Caricamento...</div>;
  if (isError) return <div>Qualcosa è andato storto.</div>;
  return <div>{data.name}</div>;
}
```

> 💡 Pensa a `queryKey` come alla chiave di una cache LRU distribuita: TanStack Query deduplica richieste identiche in volo, tiene i dati "freschi" per un tempo configurabile, e li invalida/ri-fetcha quando cambi la chiave. Tu scrivi solo `fetchUser`, il resto — race condition comprese — lo risolve la libreria.

### Design Patterns

**Custom Hooks** — l'estrazione di logica stateful riutilizzabile, il pattern idiomatico per eccellenza. È l'equivalente di estrarre una funzione di libreria da codice duplicato:

```tsx
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer); // cleanup: annulla il timer precedente
  }, [value, delayMs]);

  return debounced;
}

// Uso: la logica di debounce è invisibile al componente che la usa
function SearchInput() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);
  // ... usa debouncedQuery per la fetch
}
```

**Compound Components** — un componente padre che condivide stato implicito con i suoi figli, esattamente come un context manager Python condivide risorse con il blocco `with`:

```tsx
function Tabs({ children, defaultValue }: { children: React.ReactNode; defaultValue: string }) {
  const [active, setActive] = useState(defaultValue);
  return (
    <TabsContext value={{ active, setActive }}>
      <div className="tabs">{children}</div>
    </TabsContext>
  );
}

Tabs.Item = function TabItem({ value, children }: { value: string; children: React.ReactNode }) {
  const { active, setActive } = use(TabsContext);
  return (
    <button className={active === value ? 'active' : ''} onClick={() => setActive(value)}>
      {children}
    </button>
  );
};

// Uso: leggibile come markup, ma con stato condiviso sotto il cofano
<Tabs defaultValue="overview">
  <Tabs.Item value="overview">Overview</Tabs.Item>
  <Tabs.Item value="settings">Impostazioni</Tabs.Item>
</Tabs>
```

**Composizione invece di ereditarietà** — "children as props" è il modo React di fare quello che altrove faresti con l'iniezione di dipendenze o gli slot di un template engine: passi un pezzo di UI come dato, non estendi una classe base.

```tsx
function Card({ children }: { children: React.ReactNode }) {
  return <div className="card">{children}</div>;
}
// Card non sa e non deve sapere cosa c'è dentro — proprio come una funzione
// higher-order non sa cosa fa la callback che riceve
```

> 💡 **Pattern legacy**: se incontri codice vecchio con `render props` (`<DataProvider render={data => ...}>`) o **HOC** (`withAuth(MyComponent)`), sono i predecessori degli hook. Funzionano ancora, ma oggi un custom hook fa lo stesso lavoro con metà del codice e senza il fastidioso "wrapper hell". Non serve impararli per scrivere codice nuovo, solo per leggerli quando li trovi.

### ✅ Buone pratiche / ❌ Cattive pratiche

| ✅ Buona pratica | ❌ Cattiva pratica |
|---|---|
| `key={user.id}` — id stabile e univoco | `key={index}` — si rompe su riordino/inserimento/rimozione |
| Stato colocato il più in basso possibile nell'albero | Stato issato in cima "perché forse un giorno serve altrove" |
| Derivare dati da altri dati al render (`const total = items.length`) | Duplicare in stato ciò che è calcolabile (`const [total, setTotal] = useState(...)`) |
| Componenti piccoli e mirati, una responsabilità | "God component" da 800 righe che fa fetch, validazione, layout e logica di business |
| `setItems([...items, newItem])` — nuovo array, nuova reference | `items.push(newItem)` — muta l'array esistente, React non se ne accorge |
| Custom hook per logica riutilizzabile | Copia-incolla della stessa `useEffect` in cinque componenti |

### Errori da evitare "come la peste"

- **Closure stantie in `useEffect`**: se dimentichi una dipendenza nell'array (`[]` invece di `[count]`), l'effetto "vede" per sempre il valore di `count` al primo render. Il linter di ESLint (`exhaustive-deps`) esiste apposta per prendere in giro questo bug prima che tu lo trovi in produzione.
- **Mutare lo stato direttamente**: `state.items.push(x)` non triggererà mai un re-render, perché React confronta le *reference*, non il contenuto profondo. Sempre `setState([...state.items, x])`.
- **Fetch in `useEffect` senza cleanup/abort**: se l'utente naviga via velocemente, la risposta della richiesta precedente può arrivare *dopo* e sovrascrivere lo stato con dati vecchi (race condition classica). O usi `AbortController` nel cleanup, o meglio ancora usi TanStack Query, che lo fa già per te.
- **Prop drilling a 5 livelli**: passare una prop attraverso componenti che non la usano, solo per farla arrivare in fondo. Se superi 2-3 livelli, è il segnale che ti serve Context (per valori stabili) o Zustand (per stato che cambia spesso).
- **Funzioni anonime inline enormi passate a componenti memoizzati**: `<ExpensiveChild onClick={() => doSomething(x, y)} />` crea una nuova funzione ad ogni render, il che vanifica un `React.memo()` sul figlio — usa `useCallback` se il figlio è davvero costoso da ri-renderizzare.
- **Dimenticare la `key` nelle liste**: React ti avvisa in console, ma se lo ignori ti ritrovi con bug bizzarri di stato "appiccicato" al nodo sbagliato quando la lista cambia ordine.

## 2. Vue 3.5 — il framework che ricompila solo i target cambiati, mai l'intero progetto

Hai passato anni a odiare i job che rifanno da zero un lavoro che nessuno gli ha chiesto di rifare. Cache invalidate al momento sbagliato, cron che ricalcolano tutto invece del delta, `make` senza `.PHONY` che ricostruisce l'universo per un typo in un commento. Vue 3 è stato scritto da gente con la tua stessa allergia allo spreco, applicata all'interfaccia utente: quando cambia un dato, **aggiorna solo i pezzi di schermo che dipendono da quel dato**, e basta. Non è marketing, è un dependency graph vero, costruito a runtime. Te lo dimostro tra poco, con tanto di diagramma mentale.

### Filosofia: un framework che prende solo quello che gli dai

Vue si definisce "progressive framework", e per una volta il buzzword è accurato. Non ti obbliga a un'architettura tutto-o-niente: puoi appiccicarlo a una singola pagina HTML con un `<script>` tag e zero build step (esattamente come includeresti una libreria C con un singolo header), oppure farlo scalare a una SPA completa con router, state management e server-side rendering. Decidi tu quanto framework ti serve, non lo decide lui per te.

L'unità di base è il **Single File Component** (`.vue`): template, logica e stile vivono nello stesso file, in tre blocchi netti (`<template>`, `<script setup>`, `<style>`). Se vieni dal backend, pensalo come un controller Rails/Django, la sua vista e il suo CSS scoped tenuti insieme in un solo file invece che sparsi in tre cartelle diverse che devi tenere sincronizzate a mano. Il compilatore di Vue (un vero AST transformer, non un trucco a runtime) trasforma quel file in JavaScript puro *in fase di build* — il browser non vede mai `.vue`, vede solo l'output compilato, magro e ottimizzato.

Oggi, la sintassi standard per scrivere logica è la **Composition API** dentro `<script setup>`: funzioni composabili, tipizzazione TypeScript che funziona *davvero* (inferenza completa, non `any` mascherato), zero boilerplate. Esiste anche la **Options API** (oggetti con `data()`, `methods`, `computed` come chiavi separate) — è il modo vecchio, è ancora supportato, e la incontrerai in codice legacy. Non serve impararla per scrivere Vue oggi: consideraltala come il Perl 5 dello stack Vue — è lì, funziona, non la scrivi più da zero.

> 💡 **Se conosci i template engine lato server** (Jinja2, ERB, Handlebars) il template di Vue ti sembrerà casa: `{{ interpolazione }}`, `v-if`, `v-for`. La differenza enorme è che qui il template è *reattivo*: non si ri-renderizza una volta per request, si aggiorna da solo ogni volta che cambia un dato da cui dipende.

### Cosa c'è di nuovo (in due righe)

Questa release line (3.5, nome in codice "Tengen Toppa Gurren Lagann", fine 2024/2025) è soprattutto un giro di vite su performance e ergonomia, non una rivoluzione: la **destrutturazione reattiva delle props** diventa stabile (puoi finalmente destrutturare `defineProps()` senza perdere la reattività — il compilatore ci pensa lui), arriva `useTemplateRef()` per i template ref espliciti, `useId()` per ID stabili tra server e client in SSR, e il motore di reattività consuma sensibilmente meno memoria su alberi di componenti grandi.

### Come strutturare un progetto

Non inventi la struttura da zero: usi lo scaffolding ufficiale.

```bash
npm create vue@latest
```

Ti fa una serie di domande interattive. Le risposte consigliate per un progetto serio, oggi:

| Prompt | Consigliato | Perché |
|---|---|---|
| TypeScript? | **Sì** | Inferenza dei tipi su props, emit, store — non te ne priverai mai più |
| JSX support? | No | Serve solo se scrivi render function a mano, raro nel Vue idiomatico |
| Vue Router? | Sì, se più di una vista | Routing ufficiale, integrato, zero configurazione esotica |
| Pinia? | **Sì, da subito** | Lo state management ufficiale — vedi sezione dedicata |
| Vitest? | **Sì** | Test runner nativo Vite, velocissimo |
| E2E Testing (Playwright)? | Dipende dal progetto | Utile per flussi critici, non per ogni componente |
| ESLint + Prettier? | Sì | Come `clippy`/`rustfmt`, non hai scuse per non averli |

Struttura risultante, tipica:

```
my-app/
├── src/
│   ├── main.ts              # entry point, monta l'app
│   ├── App.vue               # componente radice
│   ├── components/           # componenti riusabili e "dumb"
│   ├── views/                # componenti legati a una route
│   ├── composables/          # logica riusabile (il cuore di Vue 3, vedi sotto)
│   ├── stores/                # store Pinia
│   ├── router/                 # definizione delle route
│   └── assets/
├── vite.config.ts
└── package.json
```

> 🧠 **Analogia**: `composables/` è la tua cartella `lib/` o `utils/` — ma invece di funzioni pure stateless, contiene funzioni che incapsulano *stato reattivo e ciclo di vita*. Ci arriviamo nella sezione Design Patterns.

### Approccio pragmatico: cosa NON ti serve

Prima di installare mezzo npm, un po' di disciplina:

- **Non ti serve Vuex.** È stato sostituito interamente da Pinia. Se lo vedi in un tutorial, quel tutorial ha anni.
- **Non ti serve l'Options API** per scrivere codice nuovo. È supporto per la retrocompatibilità, non lo stile consigliato.
- **Non ti serve una libreria di state management** per lo stato di un singolo componente. `ref`/`reactive` locali bastano nel 90% dei casi — non tutto deve finire in uno store globale.
- **Non ti serve TanStack Query** se hai due `fetch` GET semplici senza caching/retry/paginazione: una composable con `ref` + `onMounted` fa lo stesso lavoro con zero dipendenze in più.
- **Non ti serve manipolare il DOM a mano** (`document.querySelector`, `innerHTML`): se ti ritrovi a farlo dentro un componente Vue, stai remando contro il framework, non con lui.
- **Non ti serve una cartella `utils/` con 40 helper generici** prima ancora di sapere se ti servono davvero — YAGNI vale anche qui.

### Lo stato: dove lo metto?

Domanda giusta, risposta a livelli — esattamente come decidi se un dato vive in una variabile locale, in un contesto di richiesta, o in una tabella condivisa:

| Ambito | Strumento | Quando |
|---|---|---|
| Stato locale di un componente | `ref()` / `reactive()` dentro `<script setup>` | Il 90% dei casi. Non esce mai da quel componente. |
| Condiviso tra un genitore e figli annidati profondamente | `provide` / `inject` | Eviti il "prop drilling" (passare una prop attraverso 5 livelli che non la usano) senza tirare in ballo uno store globale |
| Stato globale/condiviso davvero dell'app | **Pinia** | Utente autenticato, carrello, tema, cache dati condivisi tra route diverse |

```ts
// src/stores/user.ts — uno store Pinia, lo state management ufficiale
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const name = ref('')
  const isAuthenticated = computed(() => name.value !== '')

  function login(newName: string) {
    name.value = newName
  }

  function logout() {
    name.value = ''
  }

  return { name, isAuthenticated, login, logout }
})
```

```vue
<!-- Uso in un componente qualsiasi -->
<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'

const store = useUserStore()
const { name, isAuthenticated } = storeToRefs(store) // mantiene la reattività!
</script>

<template>
  <p v-if="isAuthenticated">Ciao, {{ name }}</p>
  <button v-else @click="store.login('Alice')">Accedi</button>
</template>
```

Pinia ha rimpiazzato Vuex del tutto: niente `mutations`/`actions`/`getters` separati e boilerplate, uno store è letteralmente una funzione con `ref`/`computed`/funzioni normali dentro — la stessa sintassi che già usi nei componenti, e l'inferenza TypeScript funziona senza configurazione aggiuntiva.

> 💡 **`storeToRefs`**: se destrutturi uno store Pinia direttamente (`const { name } = store`), perdi la reattività — è lo stesso identico problema di `reactive()`, e lo vediamo nel dettaglio tra due sezioni. `storeToRefs()` esiste apposta per destrutturare in sicurezza.

### Reattività spiegata facile

Questo è IL concetto da far scattare in testa. Tutto il resto di Vue discende da qui.

🧠 **L'analogia**: pensa a Vue come a un build system con dependency graph fine-grained — tipo `make` fatto bene, o Bazel, ma tracciato *automaticamente* invece che dichiarato a mano in un Makefile. Quando cambi un file sorgente, un buon build system ricostruisce *solo i target che dipendono da quel file*, non l'intero progetto. Vue fa esattamente questo con i dati e la UI: quando un valore cambia, solo le parti del template (o i `computed`) che *effettivamente* leggono quel valore vengono ricalcolate. Tutto il resto resta esattamente com'era, senza nemmeno essere toccato.

Come lo fa, tecnicamente: usa i **Proxy** di JavaScript.

```ts
import { ref, reactive, computed, watchEffect } from 'vue'

// ref(): per valori singoli / primitivi. Wrappa il valore in un oggetto
// con un getter/setter intercettato — per questo serve `.value` fuori dal template
const count = ref(0)
console.log(count.value) // 0
count.value++             // scrive tramite il setter intercettato → Vue lo sa

// reactive(): per oggetti. Il valore restituito è un Proxy —
// leggere/scrivere una sua proprietà passa attraverso trap che Vue intercetta
const state = reactive({ count: 0, name: 'Alice' })
state.count++ // niente `.value`: l'intercettazione è sull'oggetto stesso
```

Il dependency graph si costruisce **da solo**, a runtime, la prima volta che qualcosa "legge" un valore reattivo dentro un contesto tracciato (un template, un `computed`, un `watchEffect`):

```ts
const price = ref(100)
const quantity = ref(2)

// computed = valore derivato, con CACHE automatica.
// Esattamente come una cella di uno spreadsheet con una formula:
// si ricalcola SOLO quando cambia una cella da cui dipende, altrimenti
// ti restituisce il valore già calcolato, gratis.
const total = computed(() => price.value * quantity.value)

console.log(total.value) // 200 — prima lettura, calcola e mette in cache
console.log(total.value) // 200 — seconda lettura, nessun ricalcolo: cache hit
quantity.value = 3
console.log(total.value) // 300 — una dipendenza è cambiata, invalida la cache e ricalcola
```

Durante quella prima esecuzione, Vue registra: "`total` dipende da `price` e `quantity`". Da quel momento, ogni volta che scrivi in `price.value` o `quantity.value`, Vue sa *esattamente* chi ricalcolare — non deve "controllare tutto per sicurezza", lo sa già, come un motore di build che ha già il grafo delle dipendenze in memoria.

> 🧠 **Il confronto che sblocca tutto**: React ricalcola l'intera funzione del componente a ogni cambio di stato e poi confronta due Virtual DOM per scoprire cosa è *davvero* cambiato (un diff a posteriori). Vue costruisce il grafo delle dipendenze *in anticipo*, quindi sa già, prima ancora di renderizzare, quali nodi toccare — zero diffing necessario per capire "cosa" è cambiato, perché lo sapeva già.

### Test unitari di un componente

Lo stack pragmatico oggi: **Vitest** (perché i progetti Vue sono Vite-native, quindi zero configurazione extra) + **`@vue/test-utils`** per montare e interrogare componenti.

```vue
<!-- Counter.vue -->
<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
function increment() {
  count.value++
}
</script>

<template>
  <button @click="increment">Count: {{ count }}</button>
</template>
```

```ts
// Counter.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Counter from './Counter.vue'

describe('Counter', () => {
  it('increments the count when clicked', async () => {
    const wrapper = mount(Counter)

    expect(wrapper.text()).toContain('Count: 0')

    await wrapper.find('button').trigger('click')

    expect(wrapper.text()).toContain('Count: 1')
  })
})
```

`mount` renderizza il componente in un DOM virtuale in memoria (jsdom), `find` cerca un elemento con un selettore CSS, `trigger` simula un evento DOM (e ritorna una Promise perché Vue aggiorna il DOM in modo asincrono — per questo l'`await`), `text()` legge il contenuto renderizzato per l'assert.

> 💡 Se preferisci uno stile "utente reale" invece che "dettagli di implementazione", esiste anche l'adapter Vue di **Testing Library** (`@testing-library/vue`), con API tipo `getByText`, `getByRole`. Stessa filosofia di `@vue/test-utils`, query più orientate all'accessibilità.

### Come interagisco con il backend

Due livelli, scegli in base alla complessità reale — non serve tirare fuori l'artiglieria pesante per due `GET`.

**Livello 1 — composable fatta in casa**, per chiamate semplici senza bisogno di caching/retry/invalidazione:

```ts
// composables/useUser.ts
import { ref, onMounted } from 'vue'

interface User {
  id: number
  name: string
  email: string
}

export function useUser(userId: number) {
  const user = ref<User | null>(null)
  const isLoading = ref(true)
  const error = ref<string | null>(null)

  onMounted(async () => {
    try {
      const res = await fetch(`/api/users/${userId}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      user.value = await res.json()
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      isLoading.value = false
    }
  })

  return { user, isLoading, error }
}
```

```vue
<script setup lang="ts">
import { useUser } from '@/composables/useUser'

const { user, isLoading, error } = useUser(42)
</script>

<template>
  <p v-if="isLoading">Caricamento...</p>
  <p v-else-if="error">Errore: {{ error }}</p>
  <p v-else>{{ user?.name }}</p>
</template>
```

**Livello 2 — TanStack Query (`@tanstack/vue-query`)**, quando ti servono davvero retry automatici, caching intelligente, invalidazione, paginazione, mutazioni ottimistiche. A quel punto scrivertelo a mano è tempo sprecato a reinventare una ruota già ottima:

```vue
<script setup lang="ts">
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'

interface User {
  id: number
  name: string
}

const queryClient = useQueryClient()

const { data: user, isLoading, isError } = useQuery({
  queryKey: ['user', 42],
  queryFn: () => fetch('/api/users/42').then((r) => r.json() as Promise<User>),
})

const { mutate: renameUser } = useMutation({
  mutationFn: (name: string) =>
    fetch('/api/users/42', { method: 'PATCH', body: JSON.stringify({ name }) }),
  onSuccess: () => {
    // invalida la cache: la prossima lettura rifà la fetch in background
    queryClient.invalidateQueries({ queryKey: ['user', 42] })
  },
})
</script>

<template>
  <p v-if="isLoading">Caricamento...</p>
  <p v-else-if="isError">Qualcosa è andato storto</p>
  <div v-else>
    <p>{{ user?.name }}</p>
    <button @click="renameUser('Nuovo Nome')">Rinomina</button>
  </div>
</template>
```

| | Composable fatta in casa | TanStack Query |
|---|---|---|
| Un paio di `GET` semplici | ✅ perfetto | overkill |
| Retry automatico su errore di rete | scrivi tu la logica | incluso |
| Cache condivisa tra componenti diversi | scrivi tu la logica | incluso, per `queryKey` |
| Invalidazione dopo una mutation | manuale | `invalidateQueries` |
| Paginazione / infinite scroll | parecchio codice a mano | `useInfiniteQuery` pronto |

### Design Patterns

**Composables** sono l'equivalente Vue degli hook React: funzioni che incapsulano logica reattiva stateful, riusabile tra componenti diversi. `useMouse()`, `useFetch()`, `useUser()` sopra — sono tutte composable. È il pattern idiomatico numero uno in Vue 3:

```ts
// composables/useMouse.ts
import { ref, onMounted, onUnmounted } from 'vue'

export function useMouse() {
  const x = ref(0)
  const y = ref(0)

  function update(event: MouseEvent) {
    x.value = event.pageX
    y.value = event.pageY
  }

  onMounted(() => window.addEventListener('mousemove', update))
  onUnmounted(() => window.removeEventListener('mousemove', update))

  return { x, y }
}
```

```vue
<script setup lang="ts">
import { useMouse } from '@/composables/useMouse'

const { x, y } = useMouse() // niente da configurare, la logica è tutta incapsulata
</script>

<template>
  <p>Mouse a {{ x }}, {{ y }}</p>
</template>
```

**Scoped slot / componenti "renderless"**: un componente che non renderizza nessun markup proprio, ma espone solo *stato e comportamento* attraverso lo slot — headless UI logic, il DOM decidi tu:

```vue
<!-- Toggle.vue: nessuno stile, solo logica -->
<script setup lang="ts">
import { ref } from 'vue'

const isOpen = ref(false)
function toggle() {
  isOpen.value = !isOpen.value
}
</script>

<template>
  <slot :isOpen="isOpen" :toggle="toggle" />
</template>
```

```vue
<!-- Uso: decidi tu il markup, Toggle ti dà solo lo stato -->
<Toggle v-slot="{ isOpen, toggle }">
  <button @click="toggle">{{ isOpen ? 'Nascondi' : 'Mostra' }}</button>
  <p v-if="isOpen">Sorpresa!</p>
</Toggle>
```

**`provide`/`inject`**: un contenitore di Dependency Injection leggero, integrato nel framework. Utile per evitare "prop drilling" su alberi profondi (tema, i18n, configurazione) senza tirare in ballo Pinia per qualcosa che non è davvero stato applicativo condiviso:

```ts
// App.vue — il "provider" in cima all'albero
import { provide, ref } from 'vue'
import type { InjectionKey, Ref } from 'vue'

export const ThemeKey: InjectionKey<Ref<'light' | 'dark'>> = Symbol('theme')

const theme = ref<'light' | 'dark'>('dark')
provide(ThemeKey, theme)
```

```ts
// DeepChild.vue — a qualsiasi profondità nell'albero, nessun prop da passare
import { inject } from 'vue'
import { ThemeKey } from './App.vue'

const theme = inject(ThemeKey) // tipizzato, nessun "any" nascosto
```

### ✅ Buone pratiche / ❌ Cattive pratiche

| ✅ Buona pratica | ❌ Cattiva pratica |
|---|---|
| Destrutturare stato reattivo con `toRefs()`/`storeToRefs()` | Destrutturare un `reactive()` (o uno store) direttamente — spezza la reattività |
| Usare `computed()` per stato derivato | Usare `watch` per sincronizzare manualmente un `ref` che potrebbe essere un `computed` |
| Componenti piccoli, logica estratta in composable | Un unico SFC gigante che mescola 10 responsabilità diverse |
| "Props down, events up": modificare lo stato del genitore con `emit` | Mutare direttamente una prop dentro il componente figlio |
| Pinia per stato davvero globale/condiviso | Un `reactive()` globale per stato che in realtà è locale a un componente |
| `:key` univoca e stabile su ogni `v-for` | Usare l'indice dell'array come `:key` quando la lista può riordinarsi |

### Errori da evitare "come la peste"

1. **Destrutturare un `reactive()` e perdere la reattività.** È il footgun numero uno per chi inizia con Vue.

   ```ts
   const state = reactive({ count: 0 })
   const { count } = state // ❌ count è ora un numero PLAIN, scollegato dal Proxy

   count++ // non succede NIENTE nel template — hai una copia morta
   ```

   Perché succede: la reattività di `reactive()` vive **sul Proxy dell'oggetto**, non sui valori al suo interno. Destrutturare con la sintassi normale di JS copia il *valore* fuori dall'oggetto in quel preciso istante — il link con il Proxy si rompe lì, per sempre. La correzione è `toRefs()` (per oggetti `reactive()` generici) o `storeToRefs()` (per store Pinia): entrambe restituiscono dei `ref` che restano collegati alla fonte.

2. **Dimenticare `:key` in un `v-for`.** Senza una chiave stabile, Vue non sa quale nodo del DOM corrisponde a quale elemento della lista quando la lista cambia — puoi ritrovarti con input che "si scambiano" il valore digitato, animazioni sbagliate, bug di stato fantasma.

3. **Mutare una prop direttamente invece di emettere un evento.** Le props scorrono in una sola direzione: dal genitore al figlio. Se il figlio la modifica direttamente, Vue ti avvisa in console (giustamente) — la regola è "props down, events up": il figlio chiede al genitore di cambiare, non lo fa da solo.

4. **Usare uno store globale `reactive`/Pinia per stato che è locale a un componente.** Se nessun altro componente ha bisogno di quel dato, tienilo locale con un `ref`. Uno store globale gonfio di stato "di comodo" è l'equivalente frontend di variabili globali mutabili condivise tra moduli che non dovrebbero nemmeno conoscersi.

5. **Catene di `watch` annidati che potrebbero essere un singolo `computed`.** Se ti ritrovi a scrivere un `watch` che aggiorna un `ref` che triggera un altro `watch` che aggiorna un altro `ref`... fermati. Quasi sempre quella catena è in realtà un solo valore derivato, esprimibile con un `computed()` — dichiarativo, cachato, senza effetti collaterali a cascata da debuggare.

## 3. Angular 19 — il framework enterprise che ha smesso di odiarti

Se hai sentito parlare di Angular dieci anni fa e sei scappato urlando — NgModule ovunque, dependency injection con la sintassi di uno YAML di Kubernetes, RxJS che ti serviva anche per sommare due numeri — buone notizie: quell'Angular è morto. Quello che stai per leggere è Angular 19, e assomiglia più a un runtime reattivo ben progettato che al framework enterprise-in-scatola che ricordi. La ceremonia è quasi sparita. Il nucleo che rimane — dependency injection seria, un compilatore che ti controlla i tipi ovunque, un modello di reattività a due livelli — è probabilmente il design più "da backend" dei tre framework di questo playbook.

### Filosofia: un runtime con un container DI incorporato, non solo una libreria di componenti

Vue e React ti danno componenti e ti lasciano organizzare il resto. Angular parte dal presupposto opposto: **è un framework**, nel senso pieno della parola — ha opinioni su routing, HTTP, dependency injection, testing, form, tutto incluso e cablato insieme dal day one. Se hai mai usato Spring Boot o .NET con il suo DI container integrato, il mental model è identico: componenti e servizi non si "importano e basta", vengono **iniettati** da un container gerarchico che sa risolvere le dipendenze da solo, con uno scope preciso (root, per-route, per-componente). Angular non è "React con più regole": è concettualmente più vicino a un backend framework tipo NestJS (che infatti ne ha copiato spudoratamente il sistema DI) travestito da libreria per il DOM.

> 🧠 **Il reframe che ti serve**: Angular non ti chiede "come renderizzo l'HTML", ti chiede "come organizzo un'applicazione grande con dipendenze condivise, testabili, e sostituibili". Se il tuo cervello backend apprezza l'inversion of control, sei a casa.

### Cosa c'è di nuovo (in due righe)

Angular 17-19 ha buttato via quasi tutta la ceremonia storica: **standalone components** sono il default (niente più NgModule obbligatori), i template hanno una nuova sintassi di controllo di flusso nativa (`@if`, `@for`, `@switch` al posto di `*ngIf`/`*ngFor`), e i **Signals** sono arrivati come primitiva di reattività di prima classe, in affiancamento (non ancora sostituzione totale) a RxJS. Il change detection senza `zone.js` ("zoneless") è disponibile in developer preview: è la direzione in cui Angular sta andando, ma per ora è opt-in.

### Come strutturare un progetto

Il CLI ufficiale resta la scelta pragmatica di default — genera già tutto senza NgModule:

```bash
npm install -g @angular/cli
ng new my-app          # scaffolding standalone by default, niente boilerplate di moduli
cd my-app
ng serve                # dev server con hot reload
```

Struttura tipica di un progetto Angular 19 standalone:

```
my-app/
├── src/app/
│   ├── app.component.ts     # componente radice, standalone
│   ├── app.config.ts        # providers globali (router, http, ecc.)
│   ├── core/services/       # servizi iniettabili, stato condiviso
│   └── features/dashboard/  # feature isolate, ognuna coi propri componenti
└── angular.json              # config del CLI (build, test, serve)
```

Un componente standalone minimo — nota `standalone: true` implicito (è il default dalla v19) e l'assenza totale di NgModule:

```typescript
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-counter',
  template: `
    <button (click)="increment()">Click: {{ count() }}</button>
  `,
})
export class CounterComponent {
  count = signal(0);

  increment() {
    this.count.update(n => n + 1);
  }
}
```

Il bootstrap in `main.ts` è una singola chiamata, senza il vecchio `platformBrowserDynamic().bootstrapModule(AppModule)`: `bootstrapApplication(AppComponent, appConfig)`.

> 💡 **`inject()` invece del costruttore**: il modo classico di ottenere una dipendenza era un parametro nel costruttore (`constructor(private http: HttpClient) {}`). Funziona ancora, ma `inject()` è più flessibile: la puoi chiamare in qualsiasi funzione di contesto DI, non solo nei costruttori. Entrambi gli stili sono legittimi, ma nel codice moderno vedrai sempre più `inject()`:

```typescript
export class UserService {
  private http = inject(HttpClient);  // niente costruttore da scrivere
}
```

### Approccio pragmatico: cosa NON ti serve

| Cosa | Perché non ti serve (più) |
|---|---|
| **NgModule** | Erano la ceremonia obbligatoria per dichiarare componenti, direttive e provider in "moduli". Gli standalone components li rendono superflui. Li trovi ancora in codice legacy — trattali come un fossile da non riprodurre in codice nuovo. |
| **NgRx per ogni progetto** | Serviva perché non c'era un modo pulito di condividere stato reattivo tra componenti. Oggi un servizio con `providedIn: 'root'` che espone dei signal copre il 90% dei casi. Vedi la sezione sullo stato. |
| **RxJS per stato locale sincrono** | Se il tuo "stato" è un booleano che apri/chiudi o un contatore, non ti serve un `BehaviorSubject`. È un `signal()`. RxJS è per gli *stream asincroni*, non per ogni variabile che cambia. |
| **Zone.js in ogni caso** | È ancora il default e funziona benissimo, ma se stai scrivendo codice nuovo con signal ovunque, lo zoneless change detection (preview) è dove Angular ti sta portando — non serve inseguirlo subito, ma sappi che esiste. |
| **`*ngIf` / `*ngFor` nel codice nuovo** | Le direttive strutturali storiche funzionano ancora, ma `@if`/`@for`/`@switch` sono più leggibili, tipizzati meglio dal compilatore, e sono la sintassi consigliata da Angular stesso. |

### Lo stato: dove lo metto?

**Stato locale del componente** → `signal()` e `computed()`. Punto. Niente `BehaviorSubject`, niente store esterno per un form che apre/chiude un pannello.

```typescript
import { Component, signal, computed } from '@angular/core';

@Component({ selector: 'app-cart', template: `...` })
export class CartComponent {
  items = signal<{ price: number }[]>([]);
  total = computed(() => this.items().reduce((sum, i) => sum + i.price, 0));

  addItem(price: number) {
    this.items.update(list => [...list, { price }]);  // nuovo array, mai mutazione diretta
  }
}
```

**Stato condiviso tra componenti** → un servizio iniettabile con `providedIn: 'root'` che tiene i signal al suo interno. Questo è il pattern che ha reso NgRx opzionale invece che obbligatorio:

```typescript
import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })   // singleton, condiviso da tutta l'app
export class AuthService {
  private _currentUser = signal<{ name: string } | null>(null);
  readonly currentUser = this._currentUser.asReadonly();  // esponi solo lettura all'esterno

  login(name: string) {
    this._currentUser.set({ name });
  }

  logout() {
    this._currentUser.set(null);
  }
}
```

Qualsiasi componente, ovunque nell'albero, fa `currentUser = inject(AuthService).currentUser` e legge `currentUser()` in modo reattivo. Nessun prop-drilling, nessun `@Input` a cascata.

> 💡 **E NgRx allora?** Esiste ancora, è maturo e continua a essere la scelta giusta per applicazioni molto grandi con transizioni di stato complesse, auditabili, che vuoi poter "riavvolgere" (time-travel debugging, log di ogni azione, undo/redo strutturato). Ma per il 90% delle app reali, signal + servizio sono meno codice, meno concetti da spiegare al nuovo assunto, e fanno lo stesso lavoro. Scegli NgRx solo quando senti concretamente il dolore che risolve, non per "best practice" preventiva.

### Reattività spiegata facile

Qui Angular è genuinamente diverso dagli altri due framework di questo playbook, perché ha **due primitive di reattività separate**, non una. Vale la pena capirle bene perché è la parte concettualmente più ricca:

**Signal = una scatola con un valore attuale, che notifica chi la osserva quando cambia.**

```typescript
import { signal, computed, effect } from '@angular/core';

const count = signal(0);          // scatola con dentro 0
const doubled = computed(() => count() * 2);  // deriva automaticamente, si ricalcola da solo

effect(() => {
  console.log(`count è ora ${count()}`);  // gira ogni volta che count cambia
});

count.set(5);      // sostituisci il valore
count.update(n => n + 1);  // deriva il nuovo valore dal vecchio
```

🧠 **Analogia da backend**: un signal è come un `inotify`/filesystem-watch su un singolo file specifico — non su un'intera directory. Solo chi ha effettivamente "letto" quel file (chi ha chiamato `count()` dentro un `computed`/`effect`/template) viene ri-notificato quando cambia. Non ricalcola l'intero componente alla cieca: è tracking a grana fine, come un dependency graph di build system (pensa a `make` che ricompila solo i target il cui input è cambiato, non l'intero progetto).

**Observable (RxJS) = un tubo che porta molti valori nel tempo, che trasformi con operatori.**

```typescript
import { fromEvent } from 'rxjs';
import { map, filter, debounceTime, switchMap } from 'rxjs/operators';

fromEvent<InputEvent>(inputEl, 'input').pipe(
  map(e => (e.target as HTMLInputElement).value),
  filter(text => text.length > 2),
  debounceTime(300),                 // aspetta 300ms di silenzio prima di procedere
  switchMap(query => this.http.get(`/api/search?q=${query}`)),  // cancella la richiesta precedente!
).subscribe(results => this.results.set(results));
```

🧠 **Analogia da backend**: se hai mai scritto una pipe Unix con `awk`/`sed`/`grep` incatenati, hai già capito RxJS: `input | debounce | filtra | trasforma` è esattamente `cat log | grep ERROR | awk '{print $2}' | sort | uniq`. Ogni operatore prende uno stream e ne produce un altro. La differenza con un signal è fondamentale: **un signal ha SEMPRE un valore corrente e basta**; **un Observable è un flusso di eventi nel tempo che potrebbe non emettere mai, emettere una volta, o infinite volte** — pensa a un socket o a una coda di messaggi, non a una variabile.

| | Signal | Observable (RxJS) |
|---|---|---|
| Cosa rappresenta | un valore attuale | uno stream di valori nel tempo |
| Analogia | filesystem watch su un file | pipe Unix (`grep \| awk \| sort`) |
| Ha sempre un "valore adesso"? | sì, sempre | no — potrebbe non aver emesso nulla ancora |
| Caso d'uso tipico | stato locale di un componente | HTTP, eventi utente, websocket, orchestrazione asincrona complessa |
| Cancellazione automatica | non serve (nessuna subscription) | serve gestirla (unsubscribe, `takeUntilDestroyed`) |

Il caso in cui *serve* RxJS e un signal da solo non basta: "cancella la richiesta HTTP precedente se l'utente digita un nuovo carattere prima che risponda" — è letteralmente cosa fa `switchMap` sopra. Un signal non ha un concetto nativo di "annulla l'operazione asincrona precedente in corso": per quello ti serve un vero stream con operatori.

Nella pratica moderna: signal per lo stato locale dei componenti, RxJS resta dominante per l'orchestrazione asincrona complessa (HTTP, websocket, form reattivi con validazione debounced). Le due cose **coesistono** normalmente nella stessa app, e Angular fornisce un ponte ufficiale tra i due mondi (lo vedi nella sezione backend).

### Test unitari di un componente

Lo stack tradizionale è **Jasmine + Karma** (ancora il default del CLI, esegue i test in un vero browser). **Vitest** è disponibile come builder sperimentale/opt-in nelle versioni recenti del CLI — più veloce, non serve un browser reale per la maggior parte dei test unitari, ed è la direzione verso cui l'ecosistema si sta muovendo.

Il perno di ogni test Angular è **`TestBed`**: crea un modulo di test isolato e risolve le dipendenze come farebbe l'app reale.

```typescript
import { TestBed } from '@angular/core/testing';
import { CounterComponent } from './counter.component';

describe('CounterComponent', () => {
  let component: CounterComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CounterComponent],  // standalone: si importa come componente, non si dichiara
    }).compileComponents();

    const fixture = TestBed.createComponent(CounterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();  // forza un ciclo di change detection
  });

  it('parte da zero', () => {
    expect(component.count()).toBe(0);
  });

  it('incrementa il signal quando si clicca', () => {
    component.increment();
    expect(component.count()).toBe(1);
  });
});
```

Per testare un servizio, il pattern è identico ma senza fixture DOM: `TestBed.configureTestingModule({})`, poi `service = TestBed.inject(MyService)`, e chiami i metodi direttamente sull'istanza risolta dal container di test.

> 💡 `TestBed` è concettualmente identico a un container DI di test in Spring (`@SpringBootTest`) o a un service provider mockato in .NET: costruisci un contesto applicativo minimo, ci inietti dentro dei doppi/mock dove serve, e verifichi il comportamento reale dentro quel contesto.

### Come interagisco con il backend

`HttpClient` è il client HTTP integrato. Si registra con la funzione provider `provideHttpClient()` (niente più `HttpClientModule` da importare in un NgModule), e ogni chiamata restituisce un **Observable**, non una Promise:

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [provideHttpClient()],
};
```

Un servizio minimo tipizzato:

```typescript
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface Product {
  id: number;
  name: string;
  price: number;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>('/api/products');
  }
}
```

Il ponte più utile tra i due mondi di reattività è **`toSignal()`**: prende un Observable e te lo espone come un signal in sola lettura, gestendo subscribe/unsubscribe al posto tuo:

```typescript
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ProductService } from './product.service';

@Component({
  selector: 'app-product-list',
  template: `
    @for (product of products(); track product.id) {
      <li>{{ product.name }} — €{{ product.price }}</li>
    } @empty {
      <li>Caricamento in corso...</li>
    }
  `,
})
export class ProductListComponent {
  private productService = inject(ProductService);
  products = toSignal(this.productService.getProducts(), { initialValue: [] });
  // niente .subscribe(), niente ngOnDestroy per fare unsubscribe: se ne occupa toSignal()
}
```

> 💡 Nota anche `@for ... track ... @empty` nel template: è la nuova sintassi di controllo di flusso (v17+), tipizzata e più performante del vecchio `*ngFor` con `trackBy`.

C'è anche un'API sperimentale, **`httpResource()`**, pensata per esprimere direttamente una fetch come signal senza passare da RxJS: è il futuro, ma è ancora in fase di stabilizzazione — per progetti in produzione oggi, `HttpClient` + `toSignal()` resta la scelta solida.

### Design Patterns

**Dependency Injection ovunque** è il tratto distintivo di Angular, punto. Servizi iniettati via costruttore o `inject()`, injector gerarchici con scope preciso: root (un'istanza per tutta l'app), per-route, o per-componente — basta aggiungere il servizio all'array `providers: [...]` di un `@Component` per ottenere un'istanza nuova per ogni istanza di quel componente e dei suoi figli. È lo stesso concetto di scope dei container DI backend (singleton vs scoped vs transient in .NET, o i bean scope di Spring) applicato all'albero dei componenti.

**Smart (container) vs Dumb (presentational) components** — terminologia ereditata da React, ma idiomatica anche qui: un componente "smart" parla con i servizi, fa fetch, decide la logica; un componente "dumb" riceve dati via `@Input()` ed emette eventi via `@Output()`, senza sapere nulla del mondo esterno.

```typescript
// Dumb: non conosce il servizio, riceve tutto dall'esterno
@Component({
  selector: 'app-product-card',
  template: `
    <div>{{ product().name }}</div>
    <button (click)="addToCart.emit(product())">Aggiungi</button>
  `,
})
export class ProductCardComponent {
  product = input.required<Product>();       // input signal (v17+)
  addToCart = output<Product>();             // output signal-based (v17+)
}
```

**Direttive standalone** per comportamento DOM riutilizzabile senza un componente intero — utile quando ti serve solo *modificare* un elemento esistente, non renderizzarne uno nuovo (`@Directive({ selector: '[appHighlight]' })` con un `inject(ElementRef)` interno, applicata con `<div appHighlight>`).

### ✅ Buone pratiche / ❌ Cattive pratiche

| ✅ Buona pratica | ❌ Cattiva pratica |
|---|---|
| Usare `async` pipe o `toSignal()` nei template invece di `.subscribe()` manuale | Fare `.subscribe()` a mano in un componente e dimenticarsi di fare l'unsubscribe |
| Servizi piccoli e focalizzati (single responsibility) | Un "GodService" da 2000 righe che fa tutto per tutta l'app |
| `OnPush` change detection, o meglio ancora, essere completamente signal-based (automatico) | Change detection di default ovunque, senza pensarci — funziona ma spreca cicli |
| `@if` / `@for` / `@switch` nel codice nuovo | `*ngIf` / `*ngFor` in codice nuovo (funzionano, ma sono la sintassi legacy) |
| `signal.set()` / `signal.update()` per ogni modifica | Mutare direttamente l'oggetto dentro un signal e aspettarsi che il template si aggiorni |
| Standalone components + `inject()` | NgModule annidati per organizzare feature semplici |
| Servizi con `providedIn: 'root'` per stato condiviso semplice | Installare NgRx "perché lo fanno tutti" per un'app con tre schermate |

### Errori da evitare "come la peste"

- **Il classico memory leak da `.subscribe()`**: sottoscrivi un Observable dentro un componente e non lo disiscrivi mai. Il componente viene distrutto, ma la subscription resta viva, tenendo in memoria tutto quello che referenzia — e continuando a eseguire codice su un componente "morto". Soluzioni: `async` pipe nel template, `toSignal()`, oppure `takeUntilDestroyed()` se devi proprio sottoscrivere a mano.
- **Confondere quando serve un Signal e quando serve un Observable**: se usi RxJS con un `BehaviorSubject` per modellare un semplice stato locale sincrono (un booleano, un contatore), stai usando un tubo per trasportare un singolo mattone. Un `signal()` fa la stessa cosa in una riga, senza subscription da gestire.
- **Dipendenze DI circolari tra servizi**: `ServiceA` inietta `ServiceB` che inietta `ServiceA`. Angular te lo segnala a runtime con un errore criptico — il fix quasi sempre è estrarre la logica condivisa in un terzo servizio più piccolo, o rompere la dipendenza con un evento/signal invece di una chiamata diretta.
- **Mutare il valore di un signal direttamente invece di chiamare `.set()`/`.update()`**: `mySignal().push(item)` su un array dentro un signal non notifica nessuno, perché il riferimento non è cambiato. Devi produrre un nuovo riferimento: `mySignal.update(list => [...list, item])`.
- **Aspettarsi un re-render "magico" con `OnPush` o con i signal dopo una mutazione in-place**: è la stessa famiglia di footgun che trovi in Vue e React — muta un oggetto sul posto, e il framework (giustamente) non se ne accorge perché sta confrontando riferimenti, non contenuti profondi. Produci sempre un nuovo oggetto/array, o usa `.update()`.

## 4. Tre modelli mentali, un solo problema

**In pillole**: React, Vue e Angular risolvono lo stesso identico problema — "rigenera solo i pezzi di schermo che devono cambiare" — con tre strategie diverse. Non esiste un "vincitore assoluto": esiste quale strategia si avvicina di più al modo in cui già pensi.

### La tabella che riassume tutto

| | React 19 | Vue 3.5 | Angular 19 |
|---|---|---|---|
| **Modello di reattività** | ri-esegui l'intera funzione componente e fai il diff dell'albero (Virtual DOM) | proxy reattivi con dependency graph a grana fine (`ref`/`reactive`) | Signal a grana fine + RxJS per gli stream asincroni |
| **Analogia backend** | rigenerare l'HTML da un template a ogni richiesta e fare il diff dell'output | build system che ricompila solo i target il cui input è cambiato | filesystem watch mirato (signal) + pipe stile `awk`/`sed` (RxJS) |
| **Scaffolding ufficiale** | `npm create vite@latest -- --template react-ts` | `npm create vue@latest` | `ng new` |
| **Stato locale** | `useState` / `useReducer` | `ref` / `reactive` | `signal()` / `computed()` |
| **Stato globale pragmatico** | Zustand | Pinia | servizio iniettabile con signal |
| **Logica riutilizzabile** | custom Hooks | Composables | servizi + Dependency Injection |
| **Test runner moderno** | Vitest + React Testing Library | Vitest + Vue Test Utils | Jasmine/Karma (Vitest in arrivo) |
| **Fetch dal backend** | TanStack Query | composable + TanStack Query (Vue adapter) | `HttpClient` (RxJS) + `toSignal()` |
| **Filosofia in una frase** | "è solo JavaScript, la UI è funzione dello stato" | "template familiari, reattività automatica sotto il cofano" | "batterie incluse, DI ovunque, scala su team enormi" |

### Come scegliere in pratica

Non stai scegliendo un partner per la vita, stai scegliendo lo strumento giusto per il contesto:

- **Scegli React** se vuoi il minimo strato di "magia" tra te e JavaScript puro, ti piace ragionare in termini di funzioni pure e immutabilità, e probabilmente lavorerai in un ecosistema enorme (più offerte di lavoro, più librerie di terze parti, più esempi online per qualunque problema tu abbia).
- **Scegli Vue** se vuoi la curva di apprendimento più dolce delle tre, template che sembrano HTML vero (non JSX), e una reattività che "semplicemente funziona" senza dover ragionare troppo su quando le cose si ri-renderizzano.
- **Scegli Angular** se lavori (o lavorerai) in un team grande e strutturato, apprezzi che il framework imponga convenzioni precise invece di lasciarti libero (meno "guerre di stile" tra sviluppatori), e ti trovi a tuo agio con la Dependency Injection perché vieni da Spring, .NET o simili — Angular ti sembrerà casa.

> 🧠 **La verità scomoda**: una volta che hai capito bene UNO di questi tre modelli mentali fino in fondo, impari gli altri due in una settimana ciascuno. La parte difficile non è la sintassi, è il primo salto concettuale da "io comando il DOM riga per riga" a "io descrivo cosa deve apparire dato lo stato, e il framework si occupa del resto". Quel salto, ora che sei arrivato fin qui, l'hai già fatto.

### Il prossimo passo

Non leggere e basta: apri un terminale (lo adori, lo sai fare) e lancia uno dei tre comandi di scaffolding qui sopra. Costruisci una cosa stupida — una todo-list, un contatore, una chiamata a una API pubblica che già conosci — e guarda cosa succede quando cambi lo stato. Il momento in cui vedi lo schermo aggiornarsi da solo, senza che tu abbia scritto una riga di codice per "aggiornare il DOM", è il momento in cui questi framework smettono di essere magia e iniziano a essere solo un altro strumento nella tua cassetta degli attrezzi.

Benvenuto dall'altra parte del terminale.
