# CSS for Backenders

Sei bravissimo con `awk`, sai a memoria le flag di `git rebase`, hai ottimizzato query SQL che facevano piangere il DBA. Poi apri un file `.css`, cambi un `margin`, e improvvisamente un bottone si sposta dall'altra parte del mondo. Chiudi il file. Torni al terminale, dove le cose hanno senso.

Questo playbook esiste per una ragione sola: **il CSS non è magia, è un linguaggio con regole precise quanto quelle di un parser**. Il problema è che nessuno te le ha mai spiegate come si spiegherebbero a un backender: con un modello mentale, non con "prova e vedi cosa succede".

Tre cose che odi del CSS, spiegate come bug, non come misteri:

1. **"Cambio una riga e si rompe tutto altrove"** → è la *cascata* (cascade): le regole CSS hanno una precedenza, esattamente come l'ordine di risoluzione delle variabili d'ambiente in una shell (`.zshrc` locale sovrascrive quello globale). Non è casuale, è una specifica di risoluzione dei conflitti. La vedremo tra poco.
2. **"Non capisco perché questo elemento è a quella dimensione"** → è il *box model*: ogni elemento è una scatola con regole di calcolo precise su padding, bordo e margine. È aritmetica, non intuizione.
3. **"Allineare due cose in mezzo alla pagina mi costa 20 minuti"** → probabilmente stai usando gli strumenti sbagliati. Flexbox e Grid esistono apposta e li vedremo con analogie che già conosci.

Alla fine di questo playbook costruirai una dashboard vera — menu laterale, toolbar, footer, area centrale dinamica — con CSS puro, capendo ogni riga che scrivi.

---

## 0. Le fondamenta: Box Model e Cascata

**In pillole**: ogni elemento HTML è un rettangolo (una "scatola"). Il CSS decide la dimensione di quella scatola e chi vince quando due regole vogliono la stessa proprietà. Tutto il resto del CSS è costruito sopra questi due concetti.

### Il Box Model: la scatola dentro la scatola

Ogni elemento è composto da quattro livelli concentrici, dall'interno verso l'esterno:

```
┌─────────────────────────────────────┐
│              margin                  │  ← spazio fuori dalla scatola (invisibile, spinge gli altri elementi)
│  ┌─────────────────────────────────┐ │
│  │            border               │ │  ← il bordo della scatola (visibile)
│  │  ┌───────────────────────────┐  │ │
│  │  │          padding           │  │ │  ← spazio interno (invisibile, dentro il bordo)
│  │  │  ┌─────────────────────┐  │  │ │
│  │  │  │       content        │  │  │ │  ← il contenuto vero (testo, immagine...)
│  │  │  └─────────────────────┘  │  │ │
│  │  └───────────────────────────┘  │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

Il punto dove il 90% dei backender si incarta: quando scrivi `width: 200px`, di *quale* livello stai parlando? Per default, del `content`. Quindi se aggiungi `padding: 20px` e `border: 2px`, la scatola finale sul monitor sarà larga `200 + 20*2 + 2*2 = 244px`. Sorpresa non gradita.

La soluzione è una singola riga che dovresti considerare come default sempre attivo (quasi tutti i framework moderni la applicano automaticamente):

```css
* {
  box-sizing: border-box;
}
```

`border-box` dice: "quel `width: 200px` è la dimensione **finale**, comprensiva di padding e bordo — arrangiati tu a far stare il contenuto dentro". È l'equivalente concettuale di dire "questo buffer è di 200 byte totali, non 200 byte di payload più header a parte": una volta impostato, smetti di fare aritmetica a mano ogni volta.

### La Cascata e la Specificità: chi vince?

"Cascading" in "Cascading Style Sheets" non è decorativo: è l'algoritmo di risoluzione dei conflitti. Quando due regole CSS puntano allo stesso elemento con la stessa proprietà, vince quella con **specificità più alta**. Se la specificità è uguale, vince quella scritta **dopo** nel file (esattamente come l'ultima riassegnazione di una variabile vince, in qualsiasi linguaggio imperativo).

La specificità si calcola come un punteggio a tre cifre, dal più al meno specifico:

| Tipo di selettore | Peso | Esempio |
|---|---|---|
| Inline style (`style="..."` nell'HTML) | 1000 | quasi sempre da evitare |
| ID (`#header`) | 100 | `#main-nav` |
| Classe, attributo, pseudo-classe (`.card`, `[type="text"]`, `:hover`) | 10 | `.button` |
| Elemento, pseudo-elemento (`div`, `::before`) | 1 | `p` |

```css
p { color: black; }           /* specificità: 1 */
.warning { color: orange; }   /* specificità: 10  → vince su p */
#alert-box { color: red; }    /* specificità: 100 → vince su tutto */
```

Pensala come priorità di risoluzione DNS o come `PATH` in bash: non è che "l'ultima entry vince sempre", è che esistono regole di precedenza esplicite, e una volta che le conosci il risultato è **completamente deterministico**. Il motivo per cui il CSS "sembra" imprevedibile è che nessuno ti ha mai mostrato questa tabella. Ora ce l'hai.

> 🧠 **Regola pratica**: se ti ritrovi a scrivere `!important` per "vincere" un conflitto, non hai risolto il problema, hai disattivato il sistema di risoluzione conflitti (un po' come mettere `try { } catch { /* ignora tutto */ }`). Il vero fix quasi sempre è: usa selettori con specificità bassa e coerente ovunque. È esattamente il problema che BEM risolve strutturalmente, tra un minuto.

---

## 1. BEM — una convenzione di naming, non una libreria

**In pillole**: BEM (Block Element Modifier) è una convenzione per nominare le classi CSS in modo che non collidano mai e che la specificità resti sempre bassa e piatta. Non richiede installare nulla: è disciplina, come una naming convention per variabili o endpoint REST.

### Il problema che BEM risolve

Immagina di scrivere, senza convenzione:

```css
.card .title { font-size: 20px; }
.sidebar .card .title { font-size: 16px; }
```

Hai appena creato una "guerra di specificità": ogni volta che vuoi cambiare `.title` da qualche parte, devi capire in quale contesto annidato ti trovi, e magari scrivere un selettore ancora più specifico per vincere. È lo stesso problema delle variabili globali mutabili condivise tra moduli: funziona finché il progetto è piccolo, poi diventa un incubo di side-effect.

### La sintassi BEM

BEM struttura ogni classe in tre parti, che corrispondono 1:1 a un modello concettuale:

```
.block                → un componente autonomo               (es. .card)
.block__element       → una parte interna di quel componente  (es. .card__title)
.block--modifier      → una variante del blocco                (es. .card--featured)
.block__element--modifier → variante di un elemento           (es. .card__title--large)
```

Esempio concreto, una card prodotto:

```html
<div class="card card--featured">
  <img class="card__image" src="shoe.jpg" alt="Sneaker">
  <h3 class="card__title">Sneaker Modello X</h3>
  <p class="card__price card__price--discounted">€79</p>
  <button class="card__button">Aggiungi al carrello</button>
</div>
```

```css
.card { border: 1px solid #ddd; padding: 16px; border-radius: 8px; }
.card--featured { border-color: gold; box-shadow: 0 0 8px rgba(255, 215, 0, 0.4); }

.card__image { width: 100%; border-radius: 4px; }
.card__title { font-size: 18px; font-weight: 600; }
.card__price { color: #333; }
.card__price--discounted { color: #d32f2f; text-decoration: line-through; }
.card__button { background: #111; color: white; padding: 8px 16px; }
```

Nota una cosa fondamentale: **ogni selettore CSS qui ha specificità 10, sempre, senza eccezioni** (una singola classe, mai annidamento tipo `.card .title`). Non ci sono guerre di specificità perché non c'è niente da vincere: ogni classe è un nome univoco e piatto. È letteralmente l'equivalente CSS di usare nomi di funzione con prefisso di modulo (`user_create` invece di una funzione `create` globale che collide) — namespacing per convenzione invece che per sistema.

### Perché "sembra verboso" è in realtà un pregio

`card__title` sembra ridondante rispetto a un semplice `.title`. Ma leggendo *solo* il nome della classe, dal DOM o dal CSS isolato, sai immediatamente:
- a quale componente appartiene (`card`)
- che è una sotto-parte, non un componente a sé (`__`)
- se è una variante (`--featured`)

Zero bisogno di guardare l'HTML circostante per capire il contesto. È lo stesso motivo per cui preferisci `user_repository.find_by_email` a un generico `find`: il nome ti dice tutto senza dover risalire lo stack.

---

## 2. SASS e SCSS — CSS con superpoteri da programmatore

**In pillole**: Sass è un *preprocessore*: scrivi in un linguaggio più espressivo (con variabili, funzioni, loop, import), e viene **compilato** in CSS normale prima di arrivare al browser. Esattamente come TypeScript viene compilato in JavaScript. SCSS è la sintassi moderna di Sass (parentesi graffe); Sass (senza la C) è la sintassi storica, basata sull'indentazione.

### Sass vs SCSS: stessa lingua, due grammatiche

```sass
// Sintassi Sass (.sass) — indentazione, niente graffe, niente punto e virgola
.card
  padding: 16px
  &__title
    font-size: 18px
```

```scss
// Sintassi SCSS (.scss) — graffe e punto e virgola, come il CSS che già conosci
.card {
  padding: 16px;

  &__title {
    font-size: 18px;
  }
}
```

**Usa sempre SCSS.** È quello che il 95% dei progetti reali usa oggi, perché è un **superset di CSS**: qualsiasi file `.css` valido è automaticamente anche `.scss` valido. Puoi rinominare un file e iniziare a usare le feature quando vuoi, senza riscrivere nulla. La sintassi Sass indentata la trovi ormai solo in codice legacy.

### Le feature che contano davvero

**Variabili** — niente più "quel blu era `#1a73e8` o `#1a72e7`?" copiato-incollato in 40 punti diversi:

```scss
$color-primary: #1a73e8;
$spacing-unit: 8px;

.button {
  background: $color-primary;
  padding: $spacing-unit * 2;
}
```

**Nesting** — annidi le regole seguendo la struttura del DOM, invece di ripetere il selettore padre. Il `&` rappresenta "il selettore genitore" e serve per costruire BEM in modo naturale:

```scss
.card {
  padding: 16px;

  &__title {          // compila in: .card__title
    font-size: 18px;
  }

  &--featured {        // compila in: .card--featured
    border-color: gold;
  }

  &:hover {             // compila in: .card:hover
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
}
```

**Mixin** — un blocco di CSS riutilizzabile e parametrizzato. È letteralmente una funzione che ritorna CSS:

```scss
@mixin flex-center($direction: row) {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: $direction;
}

.toolbar {
  @include flex-center;
}

.sidebar__logo {
  @include flex-center(column);
}
```

**Partial e `@use`** — dividi il CSS in più file (`_variables.scss`, `_buttons.scss`...) e li importi in un entry point, esattamente come organizzeresti moduli in qualsiasi linguaggio. Il prefisso `_` dice "questo file non va compilato da solo, è un pezzo da importare":

```scss
// _variables.scss
$color-primary: #1a73e8;
$spacing-unit: 8px;
```

```scss
// main.scss
@use 'variables' as v;

.button {
  background: v.$color-primary;
  padding: v.$spacing-unit;
}
```

**Funzioni built-in**, per non ricalcolare i colori a mano:

```scss
.button:hover {
  background: darken($color-primary, 10%);
}
```

> 💡 **Il modello mentale corretto**: Sass/SCSS non aggiunge nulla al browser. Il browser non sa cosa sia una variabile Sass. C'è uno step di **build** (`sass main.scss main.css`, di solito gestito da Vite/Webpack) che genera CSS puro, statico, banale, che poi viene servito. Stai scrivendo il "sorgente", il browser vede solo l'"eseguibile compilato".

---

## 3. Flexbox — distribuire spazio su UN asse

**In pillole**: Flexbox risolve un problema specifico: *allineare e distribuire elementi lungo una singola direzione* (una riga, o una colonna). Se ti sei mai chiesto "come faccio a centrare 'sta roba verticalmente", la risposta dal 2015 in poi è quasi sempre Flexbox.

### Il modello mentale: un allocatore di spazio libero

Immagina Flexbox come uno scheduler che deve distribuire dello spazio libero tra dei processi (gli elementi), lungo un solo asse per volta. Attivi Flexbox su un **contenitore**, e le regole si applicano ai suoi **figli diretti**:

```css
.toolbar {
  display: flex;             /* attiva flexbox sui figli diretti di .toolbar */
  flex-direction: row;       /* asse principale = orizzontale (default) */
  justify-content: space-between;  /* distribuzione sull'asse principale */
  align-items: center;              /* allineamento sull'asse trasverso */
  gap: 12px;                          /* spazio fisso tra gli elementi */
}
```

I due assi sono il concetto chiave:

```
flex-direction: row  →   asse principale: →  (orizzontale)
                          asse trasverso:  ↕  (verticale)

┌──────────────────────────────────────────────┐
│  [Logo]      [Search]           [Profile] [⚙] │   ← justify-content distribuisce QUI
└──────────────────────────────────────────────┘
     ↕ align-items allinea gli elementi QUI (centrati verticalmente nella riga)
```

Le due proprietà che risolvono il 90% dei casi d'uso:

| Proprietà | Cosa fa | Valori utili |
|---|---|---|
| `justify-content` | distribuisce spazio lungo l'**asse principale** | `flex-start`, `center`, `space-between`, `space-around` |
| `align-items` | allinea gli elementi lungo l'**asse trasverso** | `flex-start`, `center`, `stretch` (default) |

### Far crescere/restringere elementi: `flex-grow`

```css
.sidebar__item { flex-grow: 0; }   /* non crescere: resta della sua dimensione naturale */
.main-content   { flex-grow: 1; }   /* prendi TUTTO lo spazio libero rimasto */
```

`flex: 1` (scorciatoia per `flex-grow: 1; flex-shrink: 1; flex-basis: 0`) è probabilmente la singola riga di CSS più utile che esista: significa "riempi lo spazio rimanente", il caso d'uso più comune in assoluto (un'area di contenuto che deve espandersi per riempire ciò che rimane accanto a un menu a larghezza fissa).

> 🧠 **Quando usare Flexbox**: hai una fila di bottoni da distribuire, una navbar, un gruppo di card che devono andare a capo, un elemento da centrare in un altro. Un solo asse alla volta. Se ti serve controllare *righe e colonne contemporaneamente* (una griglia vera), è il momento di passare a Grid.

---

## 4. Grid — righe E colonne, insieme

**In pillole**: CSS Grid risolve il problema che Flexbox non risolve bene: layout **bidimensionali**, dove devi controllare righe e colonne nello stesso momento. È l'unico strumento CSS nativo per costruire un vero layout di pagina.

### Il modello mentale: definisci la mappa, poi posiziona i pezzi sopra

Pensa a `grid-template-areas` come a un heredoc ASCII-art che disegna letteralmente il layout — molto simile a come definiresti gli split di un layout `tmux`, o le region di un file `.ini`: prima disegni la mappa, poi assegni ogni elemento a una regione con nome.

```css
.dashboard {
  display: grid;
  grid-template-columns: 240px 1fr;   /* colonna 1: 240px fissi. colonna 2: il resto (1 frazione) */
  grid-template-rows: 60px 1fr 48px;  /* riga 1: 60px. riga 2: il resto. riga 3: 48px */
  grid-template-areas:
    "sidebar toolbar"
    "sidebar main"
    "sidebar footer";
  min-height: 100vh;
  gap: 0;
}

.sidebar  { grid-area: sidebar; }
.toolbar  { grid-area: toolbar; }
.main     { grid-area: main; }
.footer   { grid-area: footer; }
```

Questo letteralmente disegna:

```
┌──────────┬────────────────────────────┐
│          │          toolbar           │
│ sidebar  ├────────────────────────────┤
│          │                             │
│          │            main             │
│          │                             │
│          ├────────────────────────────┤
│          │          footer             │
└──────────┴────────────────────────────┘
```

### L'unità `fr`: la vera novità di Grid

`fr` sta per "frazione dello spazio disponibile" — è la cosa che rende Grid capace di layout responsive senza calcoli a mano:

```css
grid-template-columns: 240px 1fr;        /* fissa 240px, il resto tutto alla colonna 2 */
grid-template-columns: 1fr 2fr 1fr;      /* 3 colonne, la centrale prende il doppio spazio */
```

### Flexbox vs Grid: come scegliere in 3 secondi

| Domanda | Risposta |
|---|---|
| Ti serve controllare **righe e colonne insieme** (un vero layout di pagina)? | **Grid** |
| Ti serve solo distribuire elementi **su una riga o una colonna**? | **Flexbox** |
| Stai allineando il **contenuto interno** di un componente (icone+testo in un bottone, item di un menu)? | **Flexbox** |
| Stai disegnando lo **scheletro della pagina** (header/sidebar/main/footer)? | **Grid** |

In pratica quasi ogni progetto reale li usa **entrambi insieme**: Grid per lo scheletro della pagina, Flexbox dentro ogni singolo blocco di quello scheletro. Lo vedrai tra poco nel workshop.

---

## 5. Tailwind in pillole: l'altro approccio

**In pillole**: Tailwind CSS non è un'alternativa a CSS/Flexbox/Grid — è un **framework utility-first** che ti dà classi già pronte (`flex`, `p-4`, `gap-2`) da comporre direttamente nell'HTML, invece di scrivere tu i selettori in un file `.css`/`.scss` a parte. I concetti sotto (box model, flex, grid) restano identici: Tailwind è solo un altro modo di *scrivere* le stesse proprietà.

### Stesso risultato, due filosofie

Un bottone, approccio **BEM + SCSS** (quello visto finora — "semantic CSS"):

```html
<button class="button button--primary">Salva</button>
```
```scss
.button {
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;

  &--primary {
    background: $color-primary;
    color: white;
  }
}
```

Lo stesso bottone, approccio **Tailwind** ("utility-first" — classi già pronte, composte inline):

```html
<button class="px-4 py-2 rounded-md font-semibold bg-blue-600 text-white">
  Salva
</button>
```

Non c'è nessun file `.css` da scrivere per questo bottone: `px-4` è `padding-left/right: 1rem`, `py-2` è `padding-top/bottom: 0.5rem`, `rounded-md` è `border-radius`, e così via. Tailwind fornisce centinaia di queste classi atomiche, ognuna che fa **una cosa sola**.

### Tabella comparativa onesta

| | CSS puro / BEM + SCSS | Tailwind |
|---|---|---|
| **Dove vivono gli stili** | file `.scss` separati dall'HTML | inline, dentro la classe dell'HTML |
| **Naming** | devi inventare nomi (`.card__title`) | zero naming, usi le utility già pronte |
| **Context switching** | apri file `.scss` per ogni modifica di stile | modifichi tutto restando nel file HTML/component |
| **Consistenza design** | dipende dalla disciplina del team | garantita da una scala predefinita (spacing, colori) nel config |
| **Leggibilità HTML** | pulito (`class="card card--featured"`) | classi lunghe (`class="flex items-center gap-2 p-4 rounded-lg shadow-md bg-white"`) |
| **Setup richiesto** | nessuno (CSS puro) o compilazione Sass | build tool (PostCSS/Vite) + file di configurazione |
| **Riuso di pattern complessi** | mixin, classi BEM riutilizzabili | si estraggono componenti (React/Vue), o `@apply` in CSS |
| **Curva di apprendimento** | conoscere CSS "vero" | conoscere i nomi delle utility Tailwind |

### Quando scegliere cosa

Non è una guerra religiosa, è un trade-off concreto:

- **CSS puro/BEM/SCSS**: progetti dove HTML e CSS sono mantenuti da persone/team diversi, design system molto custom, o semplicemente vuoi zero dipendenze da build tool.
- **Tailwind**: prototipazione veloce, componenti (React/Vue/Svelte) dove HTML e stile vivono comunque nello stesso file per natura, team che vuole una scala di design imposta da configurazione invece che da disciplina.

Il resto di questo playbook — e il workshop finale — usa **CSS puro con BEM e SCSS**, perché l'obiettivo qui è capire *cosa succede sotto*, non nascondersi dietro classi già pronte. Una volta che il modello mentale del box model, della cascata, di Flex e di Grid è saldo, imparare la sintassi delle utility Tailwind è questione di un pomeriggio.

---

## 6. Workshop: costruire una Dashboard

**In pillole**: mettiamo insieme tutto — Grid per lo scheletro, Flexbox per i componenti interni, BEM per il naming, SCSS per l'organizzazione — costruendo una dashboard con **menu laterale**, **toolbar**, **footer** e un'**area centrale dinamica**.

### Obiettivo finale

```
┌─────────────┬──────────────────────────────────────┐
│             │  ☰  Dashboard          🔔  👤 Admin   │  ← toolbar
│   ▣ Logo    ├──────────────────────────────────────┤
│             │                                        │
│  Overview   │                                        │
│  Progetti   │           area centrale dinamica       │
│  Report     │        (qui cambia il contenuto)       │
│  Impostaz.  │                                        │
│             │                                        │
├─────────────┤──────────────────────────────────────┤
│             │  © 2026 · v1.0.0                       │  ← footer
└─────────────┴──────────────────────────────────────┘
```

### Passo 1 — La struttura HTML (con naming BEM)

Nota come ogni blocco è già identificabile a colpo d'occhio dal nome della classe:

```html
<div class="dashboard">

  <aside class="dashboard__sidebar sidebar">
    <div class="sidebar__logo">▣ Dashboard</div>
    <nav class="sidebar__nav">
      <a class="sidebar__link sidebar__link--active" href="#">Overview</a>
      <a class="sidebar__link" href="#">Progetti</a>
      <a class="sidebar__link" href="#">Report</a>
      <a class="sidebar__link" href="#">Impostazioni</a>
    </nav>
  </aside>

  <header class="dashboard__toolbar toolbar">
    <button class="toolbar__menu-btn">☰</button>
    <h1 class="toolbar__title">Dashboard</h1>
    <div class="toolbar__actions">
      <button class="toolbar__icon-btn">🔔</button>
      <span class="toolbar__user">👤 Admin</span>
    </div>
  </header>

  <main class="dashboard__main main">
    <!-- ⚡ area dinamica: qui il JS/framework inserisce il contenuto della pagina attiva -->
    <h2>Benvenuto</h2>
    <p>Questo contenuto cambia in base alla voce di menu selezionata.</p>
  </main>

  <footer class="dashboard__footer footer">
    <span>© 2026 · v1.0.0</span>
  </footer>

</div>
```

Nota: `dashboard__sidebar` (l'elemento nel contesto del layout generale) *e* `sidebar` (il blocco a sé stante, con le sue regole interne) coesistono sullo stesso tag. È un pattern BEM comune: il layout padre decide **dove** va il blocco, il blocco decide **come è fatto dentro**. Separazione di responsabilità, non ridondanza.

### Passo 2 — Le variabili SCSS

```scss
// _variables.scss
$color-bg: #f4f5f7;
$color-surface: #ffffff;
$color-border: #e2e4e9;
$color-text: #1f2430;
$color-text-muted: #6b7280;
$color-primary: #1a73e8;

$sidebar-width: 240px;
$toolbar-height: 60px;
$footer-height: 48px;
$spacing-unit: 8px;
```

### Passo 3 — Lo scheletro con Grid

Questa è la parte che risolve il layout generale — **due dimensioni**, righe e colonne insieme, quindi Grid è la scelta corretta:

```scss
// _dashboard.scss
@use 'variables' as v;

.dashboard {
  display: grid;
  grid-template-columns: v.$sidebar-width 1fr;
  grid-template-rows: v.$toolbar-height 1fr v.$footer-height;
  grid-template-areas:
    "sidebar toolbar"
    "sidebar main"
    "sidebar footer";
  min-height: 100vh;
  background: v.$color-bg;

  &__sidebar { grid-area: sidebar; }
  &__toolbar { grid-area: toolbar; }
  &__main    { grid-area: main; }
  &__footer  { grid-area: footer; }
}
```

Tre righe (`grid-template-columns`, `-rows`, `-areas`) e lo scheletro dell'intera dashboard è definito. Nessun `float`, nessun trucco, nessun `position: absolute` con calcoli a mano.

### Passo 4 — Il Sidebar (Flexbox verticale)

Dentro il blocco `.sidebar`, il problema è **monodimensionale**: impilare logo e link uno sopra l'altro. Flexbox in colonna:

```scss
// _sidebar.scss
@use 'variables' as v;

.sidebar {
  display: flex;
  flex-direction: column;
  background: v.$color-surface;
  border-right: 1px solid v.$color-border;
  padding: v.$spacing-unit * 2;

  &__logo {
    font-weight: 700;
    font-size: 18px;
    padding-bottom: v.$spacing-unit * 3;
  }

  &__nav {
    display: flex;
    flex-direction: column;
    gap: v.$spacing-unit;
  }

  &__link {
    padding: v.$spacing-unit * 1.5;
    border-radius: 6px;
    color: v.$color-text-muted;
    text-decoration: none;

    &:hover {
      background: v.$color-bg;
    }

    &--active {
      background: v.$color-primary;
      color: white;
    }
  }
}
```

### Passo 5 — La Toolbar (Flexbox orizzontale)

Anche qui, un solo asse: distribuire elementi da sinistra a destra su una riga. Flexbox di nuovo, ma stavolta in riga (il default):

```scss
// _toolbar.scss
@use 'variables' as v;

.toolbar {
  display: flex;
  align-items: center;
  gap: v.$spacing-unit * 2;
  padding: 0 v.$spacing-unit * 2;
  background: v.$color-surface;
  border-bottom: 1px solid v.$color-border;

  &__title {
    font-size: 16px;
    font-weight: 600;
    flex-grow: 1;    // spinge &__actions tutto a destra
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: v.$spacing-unit * 2;
  }

  &__menu-btn,
  &__icon-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 18px;
  }
}
```

Nota `flex-grow: 1` su `&__title`: è la riga che fa tutto il lavoro di "spingi le azioni a destra", senza nessun `margin-left: auto` improvvisato o `position: absolute` fragile.

### Passo 6 — Main e Footer

```scss
// _main.scss
@use 'variables' as v;

.main {
  padding: v.$spacing-unit * 3;
  overflow-y: auto;   // se il contenuto dinamico è più alto dello schermo, scrolla solo qui
}

.footer {
  display: flex;
  align-items: center;
  padding: 0 v.$spacing-unit * 2;
  background: v.$color-surface;
  border-top: 1px solid v.$color-border;
  color: v.$color-text-muted;
  font-size: 13px;
}
```

`overflow-y: auto` su `.main` è il dettaglio che distingue una dashboard vera da un esercizio giocattolo: senza, quando il contenuto dinamico cresce, **tutta la pagina** scrolla — sidebar e toolbar compresi, che invece devono restare fissi. Con quella riga, solo l'area centrale scrolla.

### Passo 7 — Il file entry point

```scss
// main.scss
@use 'variables';
@use 'dashboard';
@use 'sidebar';
@use 'toolbar';
@use 'main';
```

Compila con `sass main.scss main.css` (o, più realisticamente, lascia che lo faccia il tuo bundler — Vite lo fa in automatico se importi un `.scss`).

### Passo 8 — Bonus: contenuto "dinamico" senza framework

Per rendere l'area centrale davvero dinamica anche senza React/Vue, basta un filo di JS che sostituisce l'`innerHTML` in base al link cliccato — la dashboard resta identica, cambia solo cosa c'è dentro `.main`:

```html
<script>
  const pages = {
    overview: '<h2>Overview</h2><p>Metriche generali.</p>',
    progetti: '<h2>Progetti</h2><p>Lista progetti attivi.</p>',
    report: '<h2>Report</h2><p>Grafici e statistiche.</p>',
  };

  document.querySelectorAll('.sidebar__link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelector('.sidebar__link--active')
        ?.classList.remove('sidebar__link--active');
      link.classList.add('sidebar__link--active');
      document.querySelector('.main').innerHTML =
        pages[link.dataset.page] ?? pages.overview;
    });
  });
</script>
```

(In un'app React/Vue reale questo lo farebbe il router — ma il layout CSS attorno resta esattamente questo, invariato.)

### Cosa hai appena dimostrato a te stesso

- Il layout generale (2 dimensioni: righe + colonne) → **Grid**, tre righe di CSS.
- Ogni componente interno (1 dimensione: una fila o una colonna di elementi) → **Flexbox**.
- Ogni classe ha **specificità 10, piatta, senza collisioni** → **BEM**.
- Zero duplicazione di colori/spaziature, tutto centralizzato → **variabili SCSS**.
- Zero `!important`, zero `position: absolute` improvvisati, zero magic numbers.

Non è "CSS che funziona per caso". È un layout costruito con lo stesso rigore con cui costruiresti uno schema di database o un contratto di API: ogni scelta ha una ragione precisa, ed è ripetibile.

---

## Riepilogo

| Concetto | Problema che risolve | Analogia |
|---|---|---|
| Box Model | quanto spazio occupa un elemento, esattamente | dimensione di un buffer con/senza header |
| Cascata / Specificità | chi vince tra due regole in conflitto | precedenza di risoluzione (`PATH`, DNS) |
| BEM | evitare collisioni di nomi e specificità imprevedibile | naming convention / namespacing per moduli |
| SASS/SCSS | riuso, variabili, organizzazione in file | un linguaggio compilato in CSS (come TS → JS) |
| Flexbox | distribuire elementi su **un** asse | scheduler che alloca spazio libero |
| Grid | layout a **due** dimensioni (righe + colonne) | heredoc ASCII-art / layout tmux |
| Tailwind | stesso CSS, ma come utility componibili inline | comporre flag invece di scrivere un file di config |

Il CSS non ti odia. Semplicemente nessuno ti aveva mai mostrato le regole del gioco in un linguaggio che già parli.
