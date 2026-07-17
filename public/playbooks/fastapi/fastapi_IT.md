# FastAPI, Pythonic Way

Python è il linguaggio che tutti pensano di conoscere già — è "quello facile", quello che si insegna nelle scuole, quello con cui hai scritto il tuo primo script "Hello World" in dieci minuti. Ed è vero: Python è facile da iniziare. Quello che spesso si scopre più tardi è che scrivere Python **bene** — codice che un altro sviluppatore può leggere, testare e mantenere per anni — è una disciplina tanto seria quanto in qualsiasi altro linguaggio "enterprise". La differenza è che Python ha le sue regole, le sue convenzioni, la sua filosofia: si chiama essere "pythonico", e non è un dettaglio estetico.

**FastAPI** è il framework che ha portato questa filosofia nel mondo delle API web moderne. Nato nel 2018, è oggi uno dei framework Python più usati al mondo per costruire backend performanti: sfrutta i type hint nativi del linguaggio per generare validazione automatica, documentazione OpenAPI interattiva, e supporto completo ad `async`/`await` — tutto senza le acrobazie di configurazione che framework più datati richiedevano.

Questo playbook parte da cosa significa scrivere Python "pythonico", passa per i fondamenti di FastAPI, Clean Architecture, Domain-Driven Design e Test-Driven Development, tocca gli strumenti che oggi definiscono un progetto Python professionale (`uv`, `ruff`), e finisce con **PizzaHub** — la stessa app di gestione ordini per una pizzeria vista negli altri playbook di questa piattaforma — completamente dockerizzata, e persino pronta per girare come **Lambdalith** su AWS con Mangum. Chiaro, pulito, pragmatico, senza fronzoli: che tu abbia 12 anni o vent'anni di esperienza, questo playbook è scritto per te.

---

## 1. L'approccio "pythonico" al codice

**In pillole**: "Pythonico" significa scrivere codice che sfrutta gli strumenti del linguaggio nel modo in cui sono stati pensati, non tradurre alla lettera abitudini prese da un altro linguaggio. Python ha una sua grammatica idiomatica, ed è quasi sempre più leggera e più leggibile di quello che sembra all'inizio.

### PEP 8 e `snake_case`

```python
# ❌ non pythonico: camelCase preso in prestito da altri linguaggi
def creaOrdine(pizzaId, quantita):
    return quantita * 2

# ✅ pythonico: snake_case per funzioni e variabili, PascalCase solo per le classi
def crea_ordine(pizza_id: int, quantita: int) -> int:
    return quantita * 2
```

**PEP 8** è la guida di stile ufficiale del linguaggio: `snake_case` per variabili e funzioni, `PascalCase` per le classi, `UPPER_CASE` per le costanti. Non è una preferenza estetica: è la convenzione che *tutto* l'ecosistema Python — dalla libreria standard a Django a FastAPI — segue, e seguirla rende il tuo codice immediatamente leggibile a chiunque altro scriva Python.

> 💡 **Tip**: digita `import this` in un interprete Python e leggi cosa esce. È lo "Zen of Python", 19 righe scritte da Tim Peters nel 1999 che riassumono la filosofia del linguaggio: "Explicit is better than implicit", "Simple is better than complex", "Readability counts". Non è un easter egg simpatico — è la bussola con cui ogni decisione di design in questo playbook è stata presa.

### List comprehension: espressività, non stile

```python
# ❌ non pythonico: un ciclo for esplicito per costruire una lista
pizze_disponibili = []
for pizza in tutte_le_pizze:
    if pizza.disponibile:
        pizze_disponibili.append(pizza.nome)

# ✅ pythonico: la list comprehension esprime la stessa idea in una riga leggibile
pizze_disponibili = [pizza.nome for pizza in tutte_le_pizze if pizza.disponibile]
```

🧠 **Analogia**: una list comprehension è come ordinare "una pizza margherita, senza acciughe" invece di dettare al cuoco ogni singolo passaggio della preparazione — dici *cosa* vuoi ottenere, non *come* ottenerlo passo per passo. Il ciclo `for` esplicito è utile quando la logica è complessa o ha effetti collaterali; per trasformare o filtrare una collezione, la comprehension è quasi sempre più chiara.

### EAFP vs LBYL: chiedere perdono, non permesso

```python
# ❌ LBYL ("Look Before You Leap"): controlli difensivi prima di ogni accesso
if "pizza_id" in dati and dati["pizza_id"] is not None:
    pizza_id = dati["pizza_id"]
else:
    pizza_id = None

# ✅ EAFP ("Easier to Ask Forgiveness than Permission"): prova, gestisci l'eccezione se serve
try:
    pizza_id = dati["pizza_id"]
except KeyError:
    pizza_id = None
```

> 🧠 **La regola d'oro**: Python preferisce **EAFP**: tentare l'operazione e gestire l'eccezione se qualcosa va storto, invece di controllare ogni precondizione in anticipo. Non è pigrizia — è più efficiente (il caso comune non paga il costo del controllo) e spesso più leggibile, perché il "percorso felice" resta in primo piano invece di essere annegato in `if` annidati.

### Context manager: la gestione delle risorse non è opzionale

```python
# ❌ rischio di dimenticare la chiusura, o di non chiuderla in caso di eccezione
file = open("ordini.csv")
dati = file.read()
file.close()   # se read() lancia un'eccezione, questa riga non viene mai eseguita!

# ✅ il context manager garantisce la chiusura, anche in caso di eccezione
with open("ordini.csv") as file:
    dati = file.read()
# il file è chiuso automaticamente qui, sempre
```

Lo stesso pattern (`with`) è quello che userai per le transazioni database, le connessioni di rete, i lock — qualunque risorsa che vada "aperta" e "chiusa" in modo affidabile.

### Type hint: tipizzazione graduale, non opzionale nel 2026

```python
# ❌ nessun type hint: funziona, ma l'IDE non può aiutarti e i bug arrivano solo a runtime
def calcola_totale(prezzo, quantita):
    return prezzo * quantita

# ✅ con type hint: l'IDE segnala l'errore PRIMA di eseguire il codice
def calcola_totale(prezzo: float, quantita: int) -> float:
    return prezzo * quantita
```

> 💡 **Tip**: i type hint di Python **non vengono controllati a runtime** dall'interprete standard — sono documentazione leggibile dalla macchina, verificata da strumenti esterni come `mypy` o `pyright` (sezione 7). Questo è diverso da linguaggi come Kotlin o Java, dove il tipo è imposto dal compilatore. In un progetto FastAPI professionale, però, i type hint sono comunque essenziali: è proprio grazie a loro che FastAPI genera automaticamente validazione e documentazione (sezione 2).

### Dataclass: meno boilerplate per il codice che trasporta solo dati

```python
# ❌ una classe "a mano" per un semplice contenitore di dati
class Pizza:
    def __init__(self, nome: str, prezzo: float):
        self.nome = nome
        self.prezzo = prezzo

    def __repr__(self):
        return f"Pizza(nome={self.nome!r}, prezzo={self.prezzo!r})"

    def __eq__(self, other):
        return isinstance(other, Pizza) and self.nome == other.nome and self.prezzo == other.prezzo

# ✅ una dataclass genera __init__, __repr__, __eq__ automaticamente
from dataclasses import dataclass

@dataclass(frozen=True)
class Pizza:
    nome: str
    prezzo: float
```

`frozen=True` rende le istanze immutabili — equivalente pythonico del `readonly` di Kotlin/PHP o del `record` di Java, visti negli altri playbook di questa piattaforma.

---

## 2. I fondamenti del framework FastAPI

**In pillole**: FastAPI è costruito su due librerie che fanno il lavoro pesante — **Starlette** per la parte ASGI (routing, richieste/risposte asincrone) e **Pydantic** per la validazione dei dati basata sui type hint. FastAPI le unisce e ci aggiunge la generazione automatica di documentazione OpenAPI.

### ASGI: il successore asincrono di WSGI

```python
# main.py
from fastapi import FastAPI

app = FastAPI()

@app.get("/pizze")
async def elenco_pizze():
    return [{"nome": "Margherita", "prezzo": 6.50}]
```

**ASGI** (Asynchronous Server Gateway Interface) è lo standard che permette a un'app Python di gestire richieste in modo asincrono — a differenza del più vecchio **WSGI** (usato da Flask e Django classico), che gestisce una richiesta alla volta per worker. Un server ASGI come **uvicorn** può gestire migliaia di connessioni concorrenti in un singolo processo, proprio perché sfrutta `async`/`await` invece di bloccare un thread per richiesta.

```bash
uvicorn main:app --reload
# Server in ascolto su http://127.0.0.1:8000
# Documentazione interattiva automatica su http://127.0.0.1:8000/docs
```

### Path operation: decoratori che dichiarano l'API

```python
@app.get("/pizze/{pizza_id}")
async def dettaglio_pizza(pizza_id: int) -> PizzaDto:
    pizza = pizza_service.trova_per_id(pizza_id)
    if pizza is None:
        raise HTTPException(status_code=404, detail="Pizza non trovata")
    return pizza
```

Il decoratore `@app.get(...)` dichiara sia la rotta HTTP sia il verbo. Il type hint `pizza_id: int` non è solo documentazione: FastAPI lo usa per **validare automaticamente** il parametro (se qualcuno chiama `/pizze/abc`, FastAPI risponde con un `422` prima ancora che la tua funzione venga eseguita) e per convertirlo al tipo corretto.

### Pydantic: validazione dai type hint

```python
from pydantic import BaseModel, Field

class CreaOrdineDto(BaseModel):
    pizza_id: int
    quantita: int = Field(gt=0, description="Deve essere positiva")

@app.post("/api/ordini", status_code=201)
async def crea_ordine(dto: CreaOrdineDto) -> OrdineDto:
    return ordine_service.crea_ordine(dto)
```

> 🧠 **La regola d'oro**: quando dichiari `dto: CreaOrdineDto` come parametro, FastAPI legge automaticamente il corpo della richiesta JSON, lo valida contro lo schema Pydantic, e se qualcosa non torna (un campo mancante, una quantità negativa) risponde con un `422 Unprocessable Entity` corredato dei dettagli — **senza che tu scriva una riga di codice di validazione**. È lo stesso principio del `@Valid` di Spring Boot o del `#[MapRequestPayload]` di Symfony visti negli altri playbook, ma qui nasce direttamente dai type hint del linguaggio, non da un'annotazione a parte.

### Dependency Injection con `Depends`

```python
def get_pizza_service() -> PizzaService:
    return PizzaService(PizzaRepository())

@app.get("/pizze/{pizza_id}")
async def dettaglio_pizza(
    pizza_id: int,
    service: PizzaService = Depends(get_pizza_service),
) -> PizzaDto:
    return service.trova_per_id(pizza_id)
```

`Depends` è il meccanismo di dependency injection di FastAPI: dichiari **cosa** ti serve (un `PizzaService`), e FastAPI si occupa di costruirlo e passarlo alla tua funzione. È particolarmente comodo per le dipendenze condivise fra endpoint — autenticazione, connessioni al database, configurazione — e per la testabilità: nei test, basta sostituire la dependency con una versione finta (sezione 5).

### Documentazione automatica: non un extra, un sottoprodotto

Ogni endpoint FastAPI, grazie ai type hint e agli schemi Pydantic, genera automaticamente una pagina Swagger UI su `/docs` e una specifica OpenAPI su `/openapi.json` — sempre sincronizzata col codice, perché **è generata dal codice**, non scritta a mano e destinata a disallinearsi.

> 💡 **Tip**: FastAPI supporta sia funzioni `async def` che funzioni `def` sincrone nello stesso progetto. Se la tua funzione fa solo lavoro CPU-bound o chiama una libreria sincrona, va bene lasciarla `def` — FastAPI la esegue automaticamente in un threadpool separato per non bloccare l'event loop. Non serve marcare `async` ogni singola funzione "perché sì".

---

## 3. Clean Code, Clean Architecture, approccio pragmatico

**In pillole**: le stesse quattro capsule viste negli altri playbook di questa piattaforma — `domain`, `application`, `infrastructure`, `presentation` — con una postilla molto pythonica: **non ingegnerizzare più del necessario**. Un piccolo script FastAPI di 200 righe non ha bisogno di quattro cartelle; un servizio che vivrà anni e crescerà sì.

### Clean Code, in pratica

```python
# ❌ nome bugiardo, funzione che fa troppo
def processa(d: dict) -> list:
    r = []
    for x in d["items"]:
        if x["prezzo"] > 0:
            r.append(x["prezzo"] * 1.1)
    return r

# ✅ nomi onesti, singola responsabilità
def applica_iva(prezzi_validi: list[float]) -> list[float]:
    return [prezzo * 1.1 for prezzo in prezzi_validi]
```

### Le quattro capsule, applicate a FastAPI

```
app/
├── domain/            ← nucleo: entità, value object, interfacce repository. ZERO dipendenze da FastAPI
├── application/          ← service, use case, DTO Pydantic. Dipende solo da domain
├── infrastructure/         ← implementazioni SQLAlchemy, client esterni. Implementa le interfacce di domain
└── presentation/             ← router FastAPI. Il punto d'ingresso, assemblato via Depends
```

![Clean Architecture in FastAPI](fastapi-clean-architecture.png)

```python
# app/domain/pizza_repository.py — l'interfaccia (la "porta") vive in domain
from abc import ABC, abstractmethod
from app.domain.pizza import Pizza

class PizzaRepository(ABC):
    @abstractmethod
    def trova_per_id(self, pizza_id: int) -> Pizza | None: ...

    @abstractmethod
    def tutte(self) -> list[Pizza]: ...
```

```python
# app/infrastructure/sqlalchemy_pizza_repository.py — l'implementazione vive fuori, e DIPENDE da domain
from sqlalchemy.orm import Session
from app.domain.pizza_repository import PizzaRepository
from app.domain.pizza import Pizza

class SqlAlchemyPizzaRepository(PizzaRepository):
    def __init__(self, session: Session):
        self._session = session

    def trova_per_id(self, pizza_id: int) -> Pizza | None:
        return self._session.get(Pizza, pizza_id)

    def tutte(self) -> list[Pizza]:
        return list(self._session.query(Pizza).all())
```

Il beneficio concreto: `OrdineService` (application) dipende solo dall'interfaccia astratta `PizzaRepository` (domain), mai direttamente da SQLAlchemy — puoi testarlo con un repository finto in memoria senza avviare mai un database reale (sezione 5), e cambiare ORM toccando solo `infrastructure`.

### L'approccio pragmatico: non ogni progetto merita quattro cartelle

> 🧠 **La regola d'oro**: Clean Architecture ha un costo — più file, più indirezione, più concetti da tenere a mente. Per uno script FastAPI di poche rotte, usato per un mese e poi buttato, quel costo non si ripaga: un singolo `main.py` con funzioni chiare va benissimo. La domanda pragmatica da farsi non è "sto seguendo Clean Architecture?" ma "questo progetto vivrà abbastanza a lungo, e crescerà abbastanza, da giustificare la separazione?". FastAPI è amato tanto per prototipi da 50 righe quanto per backend enterprise da centinaia di migliaia di righe — la struttura giusta dipende dal contesto, non da un dogma.

---

## 4. DDD (Domain-Driven Design)

**In pillole**: DDD è un insieme di pratiche per modellare software attorno al **linguaggio del dominio reale** — non alle tabelle del database, non ai framework. In un progetto piccolo, DDD si riduce a poche idee semplici ma potenti: entità con identità, value object senza identità, e un linguaggio condiviso fra codice e persone del business.

### Entità: hanno un'identità che persiste nel tempo

```python
class Ordine:
    def __init__(self, id: int, pizza: "Pizza"):
        self.id = id   # l'identità: due Ordine con lo stesso id sono LO STESSO ordine
        self._righe: list[RigaOrdine] = []

    def aggiungi_riga(self, pizza: "Pizza", quantita: int) -> None:
        if quantita <= 0:
            raise ValueError("La quantità deve essere positiva")
        self._righe.append(RigaOrdine(pizza, quantita))

    def totale(self) -> float:
        return sum(riga.subtotale() for riga in self._righe)
```

Un `Ordine` con `id=1` resta "lo stesso ordine" anche se cambiano le sue righe: l'identità (`id`) è ciò che conta, non lo stato attuale.

### Value object: contano solo per il loro valore

```python
from dataclasses import dataclass

@dataclass(frozen=True)
class Denaro:
    importo: float
    valuta: str = "EUR"

    def __add__(self, altro: "Denaro") -> "Denaro":
        if self.valuta != altro.valuta:
            raise ValueError("Valute diverse")
        return Denaro(self.importo + altro.importo, self.valuta)
```

🧠 **Analogia**: due banconote da 10€ sono **intercambiabili** — non ti importa quale specifica banconota hai in tasca, solo che valgano 10€. Un `Denaro(10, "EUR")` è un value object per lo stesso motivo: due istanze con lo stesso importo e valuta sono, a tutti gli effetti, la stessa cosa. Un `Ordine`, invece, non è intercambiabile con un altro ordine anche se avessero identiche righe — sono due ordini distinti, con due identità distinte.

### Linguaggio ubiquo: il codice parla come il cliente

```python
# ❌ il codice usa termini tecnici che non significano niente per chi vende le pizze
def process_status_transition(entity, new_state_code):
    entity.state = new_state_code

# ✅ il codice usa gli stessi termini che userebbe il proprietario della pizzeria
def conferma_ordine(ordine: Ordine) -> None:
    ordine.stato = StatoOrdine.CONFERMATO
```

> 💡 **Tip**: il "linguaggio ubiquo" (ubiquitous language) è forse il contributo più pratico di DDD, ed è gratuito: usa nel codice gli stessi nomi che il cliente o l'esperto di dominio userebbero in una conversazione. Se in riunione si parla di "ordine confermato", il codice non dovrebbe chiamarlo `status_code == 2`.

### Bounded context: dove finisce un modello e ne inizia un altro

In un sistema più grande di PizzaHub, "Cliente" potrebbe significare cose diverse nel contesto "Ordini" (nome, indirizzo di consegna) e nel contesto "Fatturazione" (partita IVA, storico pagamenti). DDD suggerisce di **non forzare un unico modello universale** — ogni bounded context ha la sua rappresentazione di "Cliente", collegata alle altre solo tramite un identificatore condiviso. Per un progetto delle dimensioni di PizzaHub questo resta teorico, ma è il principio che regge sistemi enterprise molto più grandi.

---

## 5. TDD con pytest

**In pillole**: **pytest** è il framework di test standard de facto in Python — sintassi minimale (funzioni semplici, `assert` nativo), fixture per la configurazione condivisa, e un ecosistema di plugin enorme. Il ciclo TDD (red-green-refactor) funziona qui esattamente come negli altri linguaggi visti in questa piattaforma.

### Il ciclo: rosso, verde, refactor

```python
# 1. RED — scrivi il test prima del codice, e fallisce (la funzione non esiste ancora)
def test_crea_ordine_con_pizza_esistente_calcola_il_totale_corretto():
    pizza = Pizza(nome="Margherita", prezzo=6.50)
    pizza_repository = FakePizzaRepository({1: pizza})
    service = OrdineService(pizza_repository)

    risultato = service.crea_ordine(CreaOrdineDto(pizza_id=1, quantita=3))

    assert risultato.totale == 19.50

# 2. GREEN — scrivi il minimo indispensabile per far passare il test
# 3. REFACTOR — pulisci il codice, il test ti protegge da regressioni
```

### Fixture: setup condiviso, senza ripetizioni

```python
import pytest

@pytest.fixture
def pizza_margherita() -> Pizza:
    return Pizza(nome="Margherita", prezzo=6.50)

@pytest.fixture
def ordine_service(pizza_margherita) -> OrdineService:
    repository = FakePizzaRepository({1: pizza_margherita})
    return OrdineService(repository)

def test_crea_ordine_con_pizza_esistente(ordine_service):
    risultato = ordine_service.crea_ordine(CreaOrdineDto(pizza_id=1, quantita=2))
    assert risultato.quantita == 2

def test_crea_ordine_con_pizza_inesistente_solleva_eccezione(ordine_service):
    with pytest.raises(PizzaNonTrovataError):
        ordine_service.crea_ordine(CreaOrdineDto(pizza_id=99, quantita=1))
```

Le fixture sono iniettate per nome nel parametro del test — pytest riconosce `ordine_service` e sa che deve prima costruire `pizza_margherita`. Nessuna configurazione XML, nessuna classe base da estendere.

### `parametrize`: lo stesso test, tanti input

```python
@pytest.mark.parametrize("quantita,atteso", [
    (1, 6.50),
    (2, 13.00),
    (3, 19.50),
])
def test_totale_ordine_per_diverse_quantita(ordine_service, quantita, atteso):
    risultato = ordine_service.crea_ordine(CreaOrdineDto(pizza_id=1, quantita=quantita))
    assert risultato.totale == atteso
```

> 🧠 **La regola d'oro**: `@pytest.mark.parametrize` evita di duplicare lo stesso test tre volte con solo i numeri diversi — una sola definizione, N esecuzioni, N righe nel report se qualcosa fallisce. È il modo pythonico di scrivere test basati su tabelle di casi, equivalente al `@ParameterizedTest` di JUnit o ai `data provider` di PHPUnit.

### `TestClient`: test di integrazione sull'app FastAPI reale

```python
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_post_ordini_con_payload_valido_ritorna_201():
    risposta = client.post("/api/ordini", json={"pizza_id": 1, "quantita": 2})
    assert risposta.status_code == 201
    assert risposta.json()["totale"] == 13.00
```

`TestClient` avvia l'intera app FastAPI in memoria (routing, validazione Pydantic, dependency injection inclusi) senza aprire una vera porta di rete — abbastanza veloce da girare in ogni pipeline CI, abbastanza realistico da testare il comportamento HTTP effettivo.

> 💡 **Tip**: nota la stessa distinzione vista negli altri playbook di questa piattaforma. `test_crea_ordine_...` è un **unit test puro**: nessuna app FastAPI avviata, gira in millisecondi grazie alla Clean Architecture (sezione 3). `test_post_ordini_...` è un **test di integrazione**: verifica che routing, validazione e service lavorino davvero insieme. Servono entrambi, in proporzioni diverse: molti unit test veloci, una manciata di test di integrazione mirati.

---

## 6. Good parts vs Bad parts

**In pillole**: Python ha punti di forza enormi — leggibilità, tipizzazione graduale, un ecosistema di librerie senza eguali — e alcune insidie storiche che vale la pena conoscere per evitarle deliberatamente, non per accident.

### Le "bad parts": insidie note

```python
# ❌ argomento di default mutabile: la trappola più famosa di Python
def aggiungi_pizza(nome: str, lista: list = []) -> list:
    lista.append(nome)
    return lista

aggiungi_pizza("Margherita")   # ['Margherita']
aggiungi_pizza("Diavola")      # ['Margherita', 'Diavola']  ← sorpresa! stessa lista riusata!

# ✅ usa None come default, crea la lista dentro la funzione
def aggiungi_pizza(nome: str, lista: list | None = None) -> list:
    if lista is None:
        lista = []
    lista.append(nome)
    return lista
```

> 🧠 **La regola d'oro**: gli argomenti di default in Python vengono valutati **una sola volta**, alla definizione della funzione — non a ogni chiamata. Una lista o un dizionario come default viene quindi **condiviso fra tutte le chiamate** che non passano esplicitamente quell'argomento, con risultati sorprendenti. È forse il bug più comune fra chi arriva a Python da un altro linguaggio: la regola pratica è "mai un default mutabile", punto.

```python
# ❌ il GIL (Global Interpreter Lock): il threading Python non parallelizza codice CPU-bound
import threading

def calcolo_pesante():
    somma = sum(i * i for i in range(10_000_000))

# due thread paralleli qui NON vanno più veloci di uno solo, per via del GIL
t1 = threading.Thread(target=calcolo_pesante)
t2 = threading.Thread(target=calcolo_pesante)
```

Il **GIL** impedisce a due thread Python di eseguire bytecode contemporaneamente nello stesso processo — per lavoro CPU-bound serve `multiprocessing` (processi separati) o, per I/O-bound (chiamate di rete, file, database), `async`/`await`, che il GIL non penalizza perché il thread cede il controllo durante l'attesa.

### Le "good parts" moderne

| Caratteristica | Cosa risolve |
|---|---|
| Type hint + `mypy`/`pyright` | Un sistema di tipi opzionale che avvicina Python a linguaggi tipizzati come TypeScript |
| `async`/`await` nativo | Gestione efficiente di I/O concorrente senza il costo dei thread |
| Walrus operator (`:=`) | Assegnazione dentro un'espressione, meno codice ripetuto |
| Pattern matching (`match`/`case`, dal 3.10) | Un `switch` espressivo, con destructuring |
| Ecosistema scientifico/AI | NumPy, pandas, PyTorch: nessun altro linguaggio ha un ecosistema dati comparabile |

```python
# walrus operator: assegna e verifica nella stessa espressione
if (pizza := trova_pizza(pizza_id)) is not None:
    print(f"Trovata: {pizza.nome}")
```

```python
# pattern matching: un match espressivo su strutture di dati
match ordine.stato:
    case StatoOrdine.IN_ATTESA:
        messaggio = "In attesa"
    case StatoOrdine.CONFERMATO:
        messaggio = "Confermato"
    case _:
        messaggio = "Stato sconosciuto"
```

> 💡 **Tip**: se stai valutando Python per un nuovo servizio nel 2026, valuta "Python 3.12+ con type hint e FastAPI", non "Python" in astratto. La differenza fra script Python 2 senza tipi e un servizio FastAPI moderno, tipizzato e testato con pytest, è grande quanto quella fra JavaScript ES5 e TypeScript moderno — sono, di fatto, esperienze di sviluppo diverse che condividono solo il nome del linguaggio di base.

---

## 7. Gli strumenti (`uv`, `ruff`...)

**In pillole**: l'ecosistema di tooling Python ha vissuto una piccola rivoluzione negli ultimi anni: strumenti scritti in Rust (`uv`, `ruff`) hanno sostituito una catena storicamente lenta e frammentata (`pip` + `virtualenv` + `black` + `flake8` + `isort`) con alternative ordini di grandezza più veloci.

### `uv`: gestione di pacchetti e ambienti virtuali

```bash
# ❌ il flusso "storico": lento, più strumenti da coordinare
python -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn sqlalchemy

# ✅ uv: un solo strumento, velocità misurata in decine di volte superiore
uv venv
uv pip install fastapi uvicorn sqlalchemy
# oppure, per un progetto con pyproject.toml:
uv sync
```

**`uv`**, sviluppato da Astral, è scritto in Rust e sostituisce `pip`, `pip-tools`, `virtualenv` e in parte anche `poetry` — installazioni dei pacchetti fino a 10-100 volte più veloci, risoluzione delle dipendenze deterministica con un lockfile (`uv.lock`), gestione delle versioni di Python integrata.

```bash
uv run uvicorn app.main:app --reload   # esegue nel venv del progetto, senza attivarlo manualmente
```

### `ruff`: linter e formatter, in un unico binario

```bash
# ❌ il flusso "storico": black per il formato, flake8 per il lint, isort per gli import — tre strumenti, tre configurazioni
black .
flake8 .
isort .

# ✅ ruff: linting, formatting e ordinamento import in un solo strumento, scritto in Rust
ruff check .        # lint
ruff format .        # formatting (sostituto di black)
```

🧠 **Analogia**: passare da `pip` + `black` + `flake8` a `uv` + `ruff` è come sostituire un cassetto di attrezzi sparsi con un multiutensile professionale — stessa funzione, frazione del tempo e della frizione. La community Python si è consolidata rapidamente attorno a questi due strumenti proprio perché il guadagno di velocità è enorme e immediatamente percepibile su ogni comando.

### `mypy` / `pyright`: verificare i type hint

```bash
mypy app/               # il verificatore di tipi storico
# oppure, spesso più veloce:
pyright app/
```

I type hint (sezione 1) non vengono controllati dall'interprete Python a runtime — servono strumenti come `mypy` o `pyright` per catturare errori di tipo **prima** di eseguire il codice, integrati tipicamente nella pipeline CI e nell'editor.

> 💡 **Tip**: un progetto FastAPI professionale nel 2026 ha quasi sempre questa combinazione minima: `uv` per dipendenze e ambienti, `ruff` per lint e formato, `mypy` o `pyright` per il controllo dei tipi, `pytest` per i test. Configurali tutti in `pyproject.toml` — un solo file, una sola fonte di verità per l'intero toolchain.

```toml
# pyproject.toml (estratto)
[tool.ruff]
line-length = 100

[tool.ruff.lint]
select = ["E", "F", "I", "UP"]   # errori, pyflakes, import, upgrade automatico sintassi

[tool.mypy]
strict = true
```

---

## 8. Come accedo ai dati? (Migration, ecc.)

**In pillole**: **SQLAlchemy** è l'ORM standard di fatto nell'ecosistema Python, e dalla versione 2.0 supporta pienamente sia lo stile sincrono che quello asincrono. **Alembic** gestisce le migrazioni di schema in modo versionato — mai a mano, mai con "auto-update" pericolosi in produzione.

### Il modello SQLAlchemy

```python
from sqlalchemy import String, Numeric
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    pass

class Pizza(Base):
    __tablename__ = "pizze"

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(100))
    prezzo: Mapped[str] = mapped_column(Numeric(10, 2))   # Numeric come str in Python, per non perdere precisione
```

> 💡 **Tip**: mappare il prezzo su `Numeric` e leggerlo come `Decimal`/stringa in Python (non `float`) non è un dettaglio pedante — i float binari non rappresentano esattamente valori decimali come `0.10`, e su calcoli monetari ripetuti quell'imprecisione si accumula. È lo stesso principio visto nel playbook Symfony con le colonne `decimal` di Doctrine.

### Separare lo schema Pydantic dal modello ORM

```python
# app/application/schemas.py — il contratto pubblico dell'API (Pydantic)
from pydantic import BaseModel

class PizzaDto(BaseModel):
    id: int
    nome: str
    prezzo: float

    model_config = {"from_attributes": True}   # permette di costruirlo da un oggetto ORM
```

> 🧠 **La regola d'oro**: non esporre mai direttamente il modello SQLAlchemy come risposta JSON dell'API. Il modello ORM rappresenta lo **schema del database**; lo schema Pydantic rappresenta il **contratto pubblico** dell'API. Sono due cose diverse anche quando i campi sembrano coincidere: il giorno in cui aggiungi una colonna `hash_password` alla tabella, non vuoi che finisca automaticamente nella risposta JSON solo perché non l'hai esclusa esplicitamente.

### Query e il problema N+1

```python
# ❌ N+1: una query per gli ordini, poi UNA query per ogni singola pizza collegata
ordini = session.query(Ordine).all()
for ordine in ordini:
    print(ordine.pizza.nome)   # ogni accesso scatena una query separata!

# ✅ eager loading esplicito: una sola query per tutto
from sqlalchemy.orm import joinedload

ordini = session.query(Ordine).options(joinedload(Ordine.pizza)).all()
```

> 🧠 **La regola d'oro**: il problema N+1 non è un difetto di SQLAlchemy — è una conseguenza inevitabile del *lazy loading*, presente in ogni ORM (Hibernate in Java, Entity Framework in .NET, Doctrine in PHP, tutti visti negli altri playbook di questa piattaforma). La differenza fra un'app che scala e una che si ingolfa con 1.000 ordini è spesso proprio questa: sapere quando serve un `joinedload` esplicito, invece di scoprirlo dai log di query lente in produzione.

### Alembic: schema versionato, mai a mano

```bash
alembic revision --autogenerate -m "aggiunge tabella ordini"   # genera una migrazione confrontando i modelli con lo schema attuale
alembic upgrade head                                              # applica le migrazioni in sospeso
```

```python
# migrations/versions/xxxx_aggiunge_tabella_ordini.py (generato automaticamente, poi revisionato)
def upgrade() -> None:
    op.create_table(
        "ordini",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("pizza_id", sa.Integer(), sa.ForeignKey("pizze.id"), nullable=False),
        sa.Column("quantita", sa.Integer(), nullable=False),
    )

def downgrade() -> None:
    op.drop_table("ordini")
```

> 💡 **Tip**: non usare mai `Base.metadata.create_all()` in produzione — è l'equivalente SQLAlchemy dell'`ddl-auto: update` di Hibernate o di `doctrine:schema:update --force`, comodissimo in sviluppo e pericoloso su un database reale perché può alterare lo schema in modi non revisionati. Le migrazioni versionate di Alembic sono l'unico modo sicuro di far evolvere lo schema in produzione: ogni cambiamento è un file, revisionabile in code review, applicabile in ordine.

### Sessione async, per app completamente asincrone

```python
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

engine = create_async_engine("postgresql+asyncpg://user:pass@localhost/pizzahub")

async def trova_per_id(session: AsyncSession, pizza_id: int) -> Pizza | None:
    return await session.get(Pizza, pizza_id)
```

Se l'intera app è `async` (routing FastAPI incluso), usare `AsyncSession` invece della sessione sincrona evita di bloccare l'event loop durante le query — coerenza end-to-end fra il modello di concorrenza del framework e quello dell'accesso ai dati.

---

## 9. Lambdalith con Mangum

**In pillole**: un **Lambdalith** è un'unica funzione AWS Lambda che ospita l'intera applicazione FastAPI, invece del pattern "una Lambda per endpoint" spesso associato (a torto) al serverless. **Mangum** è l'adapter che traduce fra il protocollo eventi di Lambda/API Gateway e l'interfaccia ASGI che FastAPI si aspetta.

### Perché non "una Lambda per endpoint"

```python
# ❌ pattern "microservizio per funzione": N Lambda separate, N deployment, N configurazioni da tenere sincronizzate
# lambda_pizze.py, lambda_ordini.py, lambda_clienti.py — ognuna con la sua dipendenza duplicata, il suo cold start

# ✅ Lambdalith: UN'unica app FastAPI, UN'unica Lambda, UN deployment
from fastapi import FastAPI
from mangum import Mangum

app = FastAPI()

@app.get("/api/pizze")
async def elenco_pizze():
    return pizza_service.tutte()

@app.post("/api/ordini", status_code=201)
async def crea_ordine(dto: CreaOrdineDto):
    return ordine_service.crea_ordine(dto)

handler = Mangum(app)   # il punto di ingresso che AWS Lambda invoca
```

![Lambdalith vs una Lambda per endpoint](lambdalith-architecture.png)

🧠 **Analogia**: "una Lambda per endpoint" sembra "microservizi", ma nella pratica significa spesso duplicare le stesse dipendenze (lo stesso pacchetto `requests`, lo stesso client database) in dieci pacchetti di deployment separati, con dieci cold start indipendenti e dieci configurazioni da tenere sincronizzate. Un Lambdalith è come avere un solo ristorante con più tavoli invece di dieci chioschi separati che vendono lo stesso menu: un solo posto da aggiornare, un solo "avvio" da scaldare, la stessa logica di routing che già conosci da FastAPI.

### Come funziona `Mangum`

```python
def handler(event, context):
    # Mangum riceve l'evento grezzo di API Gateway (un dizionario JSON)
    # lo traduce in una richiesta ASGI che FastAPI capisce
    # esegue il routing FastAPI normale, incluse validazione Pydantic e Depends
    # traduce la risposta ASGI di nuovo nel formato che API Gateway si aspetta
    ...
```

> 🧠 **La regola d'oro**: Mangum non cambia una riga della tua applicazione FastAPI — è un traduttore di protocollo, posizionato **fuori** dal codice applicativo. Questo significa che la stessa app FastAPI gira identica in locale con `uvicorn`, in un container Docker, o come Lambda con Mangum: nessun `if` sparso nel codice per "sono su Lambda o no?". È esattamente il principio dell'Infrastructure layer di Clean Architecture (sezione 3) applicato al deployment stesso.

### Considerazioni pratiche: cold start e connessioni

```python
# ❌ apre una nuova connessione al database a OGNI invocazione — lento, e rischia di esaurire le connessioni disponibili
def handler(event, context):
    engine = create_engine(DATABASE_URL)
    ...

# ✅ inizializza fuori dalla funzione handler: riusata fra invocazioni "calde" dello stesso container Lambda
engine = create_engine(DATABASE_URL)   # a livello di modulo, eseguito UNA volta per container
handler = Mangum(app)
```

> 💡 **Tip**: AWS riusa lo stesso container Lambda per invocazioni successive quando possibile ("warm start") — qualunque cosa inizializzata a livello di modulo (motore database, client HTTP) sopravvive fra un'invocazione e la successiva sullo stesso container, ed è per questo che va inizializzata fuori dalla funzione handler, non dentro. Per il cold start vero e proprio (il primo avvio di un nuovo container), la scelta pragmatica è tenere le dipendenze della Lambda minime e il pacchetto di deployment leggero — è uno dei motivi per cui un Lambdalith ben fatto batte spesso, in pratica, un pulviscolo di micro-lambda con dipendenze duplicate.

---

## 10. Un esempio completo, passo per passo (dockerizzato)

Mettiamo tutto insieme: **PizzaHub**, la stessa app di gestione ordini per una pizzeria vista negli altri playbook di questa piattaforma — questa volta in FastAPI, completamente dockerizzata: uvicorn, PostgreSQL, il tutto orchestrato con `docker-compose`.

### Cosa fa PizzaHub

```bash
GET  /api/pizze                                  # elenco pizze disponibili, come JSON
POST /api/ordini            { "pizza_id": 1, "quantita": 2 }   # crea un ordine
GET  /api/ordini/{ordine_id}                       # dettaglio ordine, con il totale calcolato
```

![Flusso di una richiesta in PizzaHub](pizzahub-flow.png)

### Struttura del progetto

```
pizzahub/
├── docker-compose.yml
├── Dockerfile
├── pyproject.toml
├── app/
│   ├── main.py
│   ├── domain/
│   │   ├── pizza.py
│   │   ├── ordine.py
│   │   ├── pizza_repository.py
│   │   └── ordine_repository.py
│   ├── application/
│   │   ├── ordine_service.py
│   │   ├── pizza_service.py
│   │   └── schemas.py
│   ├── infrastructure/
│   │   └── sqlalchemy/
│   │       ├── models.py
│   │       ├── pizza_repository.py
│   │       └── ordine_repository.py
│   └── presentation/
│       ├── pizze_router.py
│       └── ordini_router.py
└── tests/
    ├── test_ordine_service.py
    └── test_ordini_router.py
```

### Passo 1 — Dockerizzare l'ambiente

```dockerfile
# Dockerfile
FROM python:3.12-slim

RUN pip install uv

WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

COPY app/ ./app/

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```yaml
# docker-compose.yml
services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://pizzahub:pizzahub@database:5432/pizzahub
    depends_on:
      - database

  database:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: pizzahub
      POSTGRES_USER: pizzahub
      POSTGRES_PASSWORD: pizzahub
    volumes:
      - db-data:/var/lib/postgresql/data

volumes:
  db-data:
```

### Passo 2 — Domain: entità e "porte"

```python
# app/domain/pizza.py
from dataclasses import dataclass

@dataclass
class Pizza:
    id: int | None
    nome: str
    prezzo: float
```

```python
# app/domain/ordine.py
from dataclasses import dataclass, field

@dataclass
class RigaOrdine:
    pizza: Pizza
    quantita: int

    def subtotale(self) -> float:
        return self.pizza.prezzo * self.quantita

@dataclass
class Ordine:
    id: int | None
    righe: list[RigaOrdine] = field(default_factory=list)

    def aggiungi_riga(self, pizza: Pizza, quantita: int) -> None:
        if quantita <= 0:
            raise ValueError("La quantità deve essere positiva")
        self.righe.append(RigaOrdine(pizza, quantita))

    def totale(self) -> float:
        return sum(riga.subtotale() for riga in self.righe)
```

```python
# app/domain/pizza_repository.py
from abc import ABC, abstractmethod
from app.domain.pizza import Pizza

class PizzaRepository(ABC):
    @abstractmethod
    def trova_per_id(self, pizza_id: int) -> Pizza | None: ...

    @abstractmethod
    def tutte(self) -> list[Pizza]: ...

# app/domain/ordine_repository.py
from abc import ABC, abstractmethod
from app.domain.ordine import Ordine

class OrdineRepository(ABC):
    @abstractmethod
    def salva(self, ordine: Ordine) -> Ordine: ...

    @abstractmethod
    def trova_per_id(self, ordine_id: int) -> Ordine | None: ...
```

### Passo 3 — Infrastructure: SQLAlchemy

```python
# app/infrastructure/sqlalchemy/models.py
from sqlalchemy import Numeric, ForeignKey, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

class Base(DeclarativeBase):
    pass

class PizzaModel(Base):
    __tablename__ = "pizze"

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(100))
    prezzo: Mapped[float] = mapped_column(Numeric(10, 2))

class OrdineModel(Base):
    __tablename__ = "ordini"

    id: Mapped[int] = mapped_column(primary_key=True)
    pizza_id: Mapped[int] = mapped_column(ForeignKey("pizze.id"))
    quantita: Mapped[int]
    pizza: Mapped["PizzaModel"] = relationship()
```

```python
# app/infrastructure/sqlalchemy/pizza_repository.py
from sqlalchemy.orm import Session
from app.domain.pizza import Pizza
from app.domain.pizza_repository import PizzaRepository
from app.infrastructure.sqlalchemy.models import PizzaModel

class SqlAlchemyPizzaRepository(PizzaRepository):
    def __init__(self, session: Session):
        self._session = session

    def trova_per_id(self, pizza_id: int) -> Pizza | None:
        modello = self._session.get(PizzaModel, pizza_id)
        return Pizza(modello.id, modello.nome, float(modello.prezzo)) if modello else None

    def tutte(self) -> list[Pizza]:
        modelli = self._session.query(PizzaModel).all()
        return [Pizza(m.id, m.nome, float(m.prezzo)) for m in modelli]
```

### Passo 4 — Application: schemi e service

```python
# app/application/schemas.py
from pydantic import BaseModel, Field

class CreaOrdineDto(BaseModel):
    pizza_id: int
    quantita: int = Field(gt=0)

class OrdineDto(BaseModel):
    id: int
    pizza_nome: str
    quantita: int
    totale: float
```

```python
# app/application/ordine_service.py
from app.domain.pizza_repository import PizzaRepository
from app.domain.ordine_repository import OrdineRepository
from app.domain.ordine import Ordine
from app.application.schemas import CreaOrdineDto, OrdineDto

class PizzaNonTrovataError(Exception):
    pass

class OrdineService:
    def __init__(self, pizza_repository: PizzaRepository, ordine_repository: OrdineRepository):
        self._pizza_repository = pizza_repository
        self._ordine_repository = ordine_repository

    def crea_ordine(self, dto: CreaOrdineDto) -> OrdineDto:
        pizza = self._pizza_repository.trova_per_id(dto.pizza_id)
        if pizza is None:
            raise PizzaNonTrovataError(f"Pizza non trovata: {dto.pizza_id}")

        ordine = Ordine(id=None)
        ordine.aggiungi_riga(pizza, dto.quantita)
        ordine_salvato = self._ordine_repository.salva(ordine)

        return OrdineDto(
            id=ordine_salvato.id,
            pizza_nome=pizza.nome,
            quantita=dto.quantita,
            totale=ordine_salvato.totale(),
        )
```

Nota che `OrdineService` non conosce SQLAlchemy, HTTP, o FastAPI oltre alle interfacce di domain — è ciò che lo rende testabile in isolamento (visto in sezione 5) e il database sostituibile senza toccare una riga di logica di business.

### Passo 5 — Presentation: router e dependency injection

```python
# app/presentation/ordini_router.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.application.ordine_service import OrdineService, PizzaNonTrovataError
from app.application.schemas import CreaOrdineDto, OrdineDto
from app.infrastructure.sqlalchemy.pizza_repository import SqlAlchemyPizzaRepository
from app.infrastructure.sqlalchemy.ordine_repository import SqlAlchemyOrdineRepository
from app.infrastructure.database import get_session

router = APIRouter(prefix="/api/ordini")

def get_ordine_service(session: Session = Depends(get_session)) -> OrdineService:
    return OrdineService(
        SqlAlchemyPizzaRepository(session),
        SqlAlchemyOrdineRepository(session),
    )

@router.post("", status_code=201)
async def crea_ordine(
    dto: CreaOrdineDto,
    service: OrdineService = Depends(get_ordine_service),
) -> OrdineDto:
    try:
        return service.crea_ordine(dto)
    except PizzaNonTrovataError as errore:
        raise HTTPException(status_code=404, detail=str(errore))
```

```python
# app/main.py
from fastapi import FastAPI
from app.presentation.pizze_router import router as pizze_router
from app.presentation.ordini_router import router as ordini_router

app = FastAPI(title="PizzaHub")
app.include_router(pizze_router)
app.include_router(ordini_router)
```

### Passo 6 — Test, con pytest

```python
# tests/test_ordine_service.py
import pytest
from app.application.ordine_service import OrdineService, PizzaNonTrovataError
from app.application.schemas import CreaOrdineDto
from app.domain.pizza import Pizza

class FakePizzaRepository:
    def __init__(self, pizze: dict[int, Pizza]):
        self._pizze = pizze

    def trova_per_id(self, pizza_id: int) -> Pizza | None:
        return self._pizze.get(pizza_id)

    def tutte(self) -> list[Pizza]:
        return list(self._pizze.values())

class FakeOrdineRepository:
    def salva(self, ordine):
        ordine.id = 1
        return ordine

def test_crea_ordine_con_pizza_esistente_calcola_il_totale_corretto():
    # Arrange — repository finti, nessun database reale
    pizza = Pizza(id=1, nome="Margherita", prezzo=6.50)
    service = OrdineService(FakePizzaRepository({1: pizza}), FakeOrdineRepository())

    # Act
    risultato = service.crea_ordine(CreaOrdineDto(pizza_id=1, quantita=3))

    # Assert
    assert risultato.totale == 19.50
    assert risultato.pizza_nome == "Margherita"

def test_crea_ordine_con_pizza_inesistente_solleva_eccezione():
    service = OrdineService(FakePizzaRepository({}), FakeOrdineRepository())

    with pytest.raises(PizzaNonTrovataError):
        service.crea_ordine(CreaOrdineDto(pizza_id=99, quantita=1))
```

```python
# tests/test_ordini_router.py — test di integrazione, con l'app FastAPI reale
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_post_ordini_con_payload_valido_ritorna_201():
    risposta = client.post("/api/ordini", json={"pizza_id": 1, "quantita": 2})
    assert risposta.status_code == 201
```

```bash
docker compose exec api uv run pytest                          # tutti i test
docker compose exec api uv run pytest tests/test_ordine_service.py   # una singola classe
```

### Passo 7 — Avviare e provare

```bash
docker compose up -d --build
docker compose exec api uv run alembic upgrade head
```

```bash
curl http://localhost:8000/api/pizze
# [{"id":1,"nome":"Margherita","prezzo":6.50}, {"id":2,"nome":"Diavola","prezzo":8.00}]

curl -X POST http://localhost:8000/api/ordini \
  -H "Content-Type: application/json" \
  -d '{"pizza_id": 1, "quantita": 3}'
# 201 {"id":1,"pizza_nome":"Margherita","quantita":3,"totale":19.50}
```

### E come Lambdalith?

Lo stesso `app/main.py` diventa deployabile su AWS Lambda aggiungendo solo un file:

```python
# app/lambda_handler.py
from mangum import Mangum
from app.main import app

handler = Mangum(app)   # nessuna riga della logica applicativa cambia
```

```bash
# in locale, con Docker: l'entrypoint è uvicorn
# su AWS Lambda: l'entrypoint diventa app.lambda_handler.handler
# la stessa app FastAPI, lo stesso codice, due modi diversi di riceverla in ingresso
```

### Concetti applicati

- **Sezione 1**: `dataclass`, list comprehension, type hint, `snake_case`, EAFP con `try`/`except`
- **Sezione 2**: routing dichiarativo con decoratori, validazione automatica via Pydantic, dependency injection con `Depends`
- **Sezione 3**: separazione in `domain` / `application` / `infrastructure` / `presentation`, con le dipendenze che puntano verso l'interno
- **Sezione 4**: `Ordine` come entità con identità, `RigaOrdine`/prezzi come possibili value object
- **Sezione 5**: test unitari con repository finti, test di integrazione con `TestClient`
- **Sezione 8**: SQLAlchemy ORM, separazione modello ORM / schema Pydantic, prevenzione N+1
- **Sezione 9**: lo stesso codice, deployabile sia come container Docker che come Lambdalith via Mangum
- **Sezione 10 stessa**: Docker Compose con uvicorn + PostgreSQL, test unitari con fake e test di integrazione con `TestClient`

---

## 🎉 Ce l'hai fatta!

Hai completato **FastAPI, Pythonic Way**. Ora sai:

- Cosa significa scrivere codice "pythonico": `snake_case`, list comprehension, EAFP, context manager, type hint, dataclass
- I fondamenti di FastAPI: ASGI e uvicorn, path operation dichiarative, validazione automatica con Pydantic, dependency injection con `Depends`, documentazione OpenAPI generata dal codice
- Clean Architecture applicata a un progetto FastAPI reale, con l'accortezza pragmatica di non ingegnerizzare più del necessario per progetti piccoli
- Le basi di Domain-Driven Design: entità con identità, value object immutabili, linguaggio ubiquo
- Come fare TDD con pytest: fixture, `parametrize`, `TestClient` per i test di integrazione
- Quali parti storiche di Python restano insidiose (argomenti di default mutabili, il GIL) e quali strumenti/pattern del linguaggio le rendono evitabili
- Il nuovo standard di tooling: `uv` per dipendenze e ambienti, `ruff` per lint e formato, `mypy`/`pyright` per il controllo dei tipi
- Come accedere ai dati correttamente con SQLAlchemy: modelli ORM separati dagli schemi Pydantic, migrazioni versionate con Alembic, come evitare il problema N+1
- Cos'è un Lambdalith e come Mangum permette alla stessa identica app FastAPI di girare su AWS Lambda senza cambiare una riga di logica applicativa
- Come mettere tutto insieme in **PizzaHub**, completamente dockerizzato con uvicorn e PostgreSQL

**Dove andare da qui?**

- 📖 [Documentazione ufficiale di FastAPI](https://fastapi.tiangolo.com/) — fra le documentazioni tecniche meglio scritte dell'intero ecosistema open source
- 🧪 [Documentazione di pytest](https://docs.pytest.org/) — riferimento completo su fixture, plugin e pattern di test avanzati
- 🗄️ [Documentazione di SQLAlchemy 2.0](https://docs.sqlalchemy.org/en/20/) — la guida definitiva allo stile "2.0" con `Mapped`/`mapped_column`
- ⚡ [Documentazione di uv](https://docs.astral.sh/uv/) — per capire fino in fondo perché ha conquistato la community così in fretta
- ☁️ [Documentazione di Mangum](https://mangum.io/) — approfondimento sul deployment serverless di app ASGI
- ☕ [Booting Spring Boot — Java Edition](/it/playbook/spring) — confronta lo stesso identico progetto, PizzaHub, scritto in Java/Spring Boot: utile per capire cosa cambia davvero fra ecosistemi e cosa invece è un pattern universale

> 🧠 **Un ultimo consiglio**: Python "pythonico" con FastAPI non è un compromesso fra velocità di sviluppo e rigore — puoi avere entrambi. La reputazione di Python come "linguaggio da script veloce e sporco" appartiene a un'epoca precedente ai type hint, a Pydantic, a `uv` e `ruff`. Oggi puoi scrivere un backend tipizzato, testato, architetturalmente pulito, e deployabile ovunque — da un container Docker a una Lambda serverless — con la stessa produttività che ha reso Python popolare fin dall'inizio. Buon codice! 🐍
