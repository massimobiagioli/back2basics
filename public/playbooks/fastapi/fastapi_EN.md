# FastAPI, Pythonic Way

Python is the language everyone thinks they already know — it's "the easy one", the one taught in schools, the one you wrote your first "Hello World" script in within ten minutes. And that's true: Python is easy to get started with. What you often discover later is that writing Python **well** — code another developer can read, test, and maintain for years — is as serious a discipline as in any other "enterprise" language. The difference is that Python has its own rules, its own conventions, its own philosophy: it's called being "pythonic", and it's not a cosmetic detail.

**FastAPI** is the framework that brought this philosophy into the world of modern web APIs. Born in 2018, it's today one of the most widely used Python frameworks for building high-performance backends: it leverages the language's native type hints to generate automatic validation, interactive OpenAPI documentation, and full `async`/`await` support — all without the configuration acrobatics that older frameworks required.

This playbook starts from what it means to write "pythonic" Python, moves through the fundamentals of FastAPI, Clean Architecture, Domain-Driven Design and Test-Driven Development, touches on the tools that today define a professional Python project (`uv`, `ruff`), and ends with **PizzaHub** — the same pizzeria order-management app seen in this platform's other playbooks — fully dockerized, and even ready to run as a **Lambdalith** on AWS with Mangum. Clear, clean, pragmatic, no frills: whether you're 12 or you have twenty years of experience, this playbook is written for you.

---

## 1. The "pythonic" approach to code

**One-liner**: "Pythonic" means writing code that uses the language's tools the way they were designed to be used, not literally translating habits picked up from another language. Python has its own idiomatic grammar, and it's almost always lighter and more readable than it first appears.

### PEP 8 and `snake_case`

```python
# ❌ not pythonic: camelCase borrowed from other languages
def creaOrdine(pizzaId, quantita):
    return quantita * 2

# ✅ pythonic: snake_case for functions and variables, PascalCase only for classes
def crea_ordine(pizza_id: int, quantita: int) -> int:
    return quantita * 2
```

**PEP 8** is the language's official style guide: `snake_case` for variables and functions, `PascalCase` for classes, `UPPER_CASE` for constants. It's not an aesthetic preference: it's the convention that the *entire* Python ecosystem — from the standard library to Django to FastAPI — follows, and following it makes your code immediately readable to anyone else who writes Python.

> 💡 **Tip**: type `import this` into a Python interpreter and read what comes out. It's the "Zen of Python", 19 lines written by Tim Peters in 1999 that summarize the language's philosophy: "Explicit is better than implicit", "Simple is better than complex", "Readability counts". It's not a cute easter egg — it's the compass every design decision in this playbook was made against.

### List comprehensions: expressiveness, not style

```python
# ❌ not pythonic: an explicit for loop to build a list
pizze_disponibili = []
for pizza in tutte_le_pizze:
    if pizza.disponibile:
        pizze_disponibili.append(pizza.nome)

# ✅ pythonic: the list comprehension expresses the same idea in one readable line
pizze_disponibili = [pizza.nome for pizza in tutte_le_pizze if pizza.disponibile]
```

🧠 **Analogy**: a list comprehension is like ordering "one margherita, no anchovies" instead of dictating every single step of the preparation to the cook — you say *what* you want, not *how* to get there step by step. The explicit `for` loop is useful when the logic is complex or has side effects; for transforming or filtering a collection, the comprehension is almost always clearer.

### EAFP vs LBYL: ask forgiveness, not permission

```python
# ❌ LBYL ("Look Before You Leap"): defensive checks before every access
if "pizza_id" in dati and dati["pizza_id"] is not None:
    pizza_id = dati["pizza_id"]
else:
    pizza_id = None

# ✅ EAFP ("Easier to Ask Forgiveness than Permission"): try, handle the exception if needed
try:
    pizza_id = dati["pizza_id"]
except KeyError:
    pizza_id = None
```

> 🧠 **Golden rule**: Python favors **EAFP**: attempt the operation and handle the exception if something goes wrong, instead of checking every precondition up front. It's not laziness — it's often more efficient (the common case doesn't pay the cost of the check) and often more readable, because the "happy path" stays front and center instead of being buried in nested `if`s.

### Context managers: resource management isn't optional

```python
# ❌ risk of forgetting to close, or not closing on exception
file = open("ordini.csv")
dati = file.read()
file.close()   # if read() raises an exception, this line never runs!

# ✅ the context manager guarantees closure, even on exception
with open("ordini.csv") as file:
    dati = file.read()
# the file is closed automatically here, always
```

This same pattern (`with`) is what you'll use for database transactions, network connections, locks — anything that needs to be "opened" and "closed" reliably.

### Type hints: gradual typing, not optional in 2026

```python
# ❌ no type hints: it works, but the IDE can't help you and bugs only show up at runtime
def calcola_totale(prezzo, quantita):
    return prezzo * quantita

# ✅ with type hints: the IDE flags the error BEFORE you run the code
def calcola_totale(prezzo: float, quantita: int) -> float:
    return prezzo * quantita
```

> 💡 **Tip**: Python's type hints are **not checked at runtime** by the standard interpreter — they're machine-readable documentation, verified by external tools like `mypy` or `pyright` (section 7). This is different from languages like Kotlin or Java, where the type is enforced by the compiler. In a professional FastAPI project, though, type hints are still essential: they're exactly what lets FastAPI automatically generate validation and documentation (section 2).

### Dataclasses: less boilerplate for code that just carries data

```python
# ❌ a hand-written class for a simple data container
class Pizza:
    def __init__(self, nome: str, prezzo: float):
        self.nome = nome
        self.prezzo = prezzo

    def __repr__(self):
        return f"Pizza(nome={self.nome!r}, prezzo={self.prezzo!r})"

    def __eq__(self, other):
        return isinstance(other, Pizza) and self.nome == other.nome and self.prezzo == other.prezzo

# ✅ a dataclass generates __init__, __repr__, __eq__ automatically
from dataclasses import dataclass

@dataclass(frozen=True)
class Pizza:
    nome: str
    prezzo: float
```

`frozen=True` makes instances immutable — the pythonic equivalent of Kotlin/PHP's `readonly` or Java's `record`, seen in this platform's other playbooks.

---

## 2. The fundamentals of the FastAPI framework

**One-liner**: FastAPI is built on two libraries that do the heavy lifting — **Starlette** for the ASGI side (routing, async requests/responses) and **Pydantic** for data validation based on type hints. FastAPI combines them and adds automatic OpenAPI documentation generation.

### ASGI: the asynchronous successor to WSGI

```python
# main.py
from fastapi import FastAPI

app = FastAPI()

@app.get("/pizze")
async def elenco_pizze():
    return [{"nome": "Margherita", "prezzo": 6.50}]
```

**ASGI** (Asynchronous Server Gateway Interface) is the standard that lets a Python app handle requests asynchronously — unlike the older **WSGI** (used by Flask and classic Django), which handles one request at a time per worker. An ASGI server like **uvicorn** can handle thousands of concurrent connections in a single process, precisely because it uses `async`/`await` instead of blocking a thread per request.

```bash
uvicorn main:app --reload
# Server listening on http://127.0.0.1:8000
# Automatic interactive documentation at http://127.0.0.1:8000/docs
```

### Path operations: decorators that declare the API

```python
@app.get("/pizze/{pizza_id}")
async def dettaglio_pizza(pizza_id: int) -> PizzaDto:
    pizza = pizza_service.trova_per_id(pizza_id)
    if pizza is None:
        raise HTTPException(status_code=404, detail="Pizza non trovata")
    return pizza
```

The `@app.get(...)` decorator declares both the route and the HTTP verb. The `pizza_id: int` type hint isn't just documentation: FastAPI uses it to **automatically validate** the parameter (if someone calls `/pizze/abc`, FastAPI responds with a `422` before your function even runs) and to convert it to the right type.

### Pydantic: validation from type hints

```python
from pydantic import BaseModel, Field

class CreaOrdineDto(BaseModel):
    pizza_id: int
    quantita: int = Field(gt=0, description="Must be positive")

@app.post("/api/ordini", status_code=201)
async def crea_ordine(dto: CreaOrdineDto) -> OrdineDto:
    return ordine_service.crea_ordine(dto)
```

> 🧠 **Golden rule**: when you declare `dto: CreaOrdineDto` as a parameter, FastAPI automatically reads the JSON request body, validates it against the Pydantic schema, and if something doesn't add up (a missing field, a negative quantity) responds with a `422 Unprocessable Entity` complete with details — **without you writing a single line of validation code**. It's the same principle as Spring Boot's `@Valid` or Symfony's `#[MapRequestPayload]`, seen in this platform's other playbooks, but here it comes directly from the language's type hints, not from a separate annotation.

### Dependency Injection with `Depends`

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

`Depends` is FastAPI's dependency injection mechanism: you declare **what** you need (a `PizzaService`), and FastAPI takes care of building it and passing it to your function. It's especially handy for dependencies shared across endpoints — authentication, database connections, configuration — and for testability: in tests, you simply swap the dependency for a fake version (section 5).

### Automatic documentation: not an extra, a byproduct

Every FastAPI endpoint, thanks to type hints and Pydantic schemas, automatically generates a Swagger UI page at `/docs` and an OpenAPI spec at `/openapi.json` — always in sync with the code, because it's **generated from the code**, not hand-written and destined to drift out of date.

> 💡 **Tip**: FastAPI supports both `async def` and synchronous `def` functions in the same project. If your function only does CPU-bound work or calls a synchronous library, it's fine to leave it as `def` — FastAPI automatically runs it in a separate threadpool so it doesn't block the event loop. You don't need to mark every single function `async` "just because".

---

## 3. Clean Code, Clean Architecture, a pragmatic approach

**One-liner**: the same four layers seen in this platform's other playbooks — `domain`, `application`, `infrastructure`, `presentation` — with a very Pythonic caveat: **don't over-engineer**. A small 200-line FastAPI script doesn't need four folders; a service that will live for years and grow does.

### Clean Code, in practice

```python
# ❌ a lying name, a function that does too much
def processa(d: dict) -> list:
    r = []
    for x in d["items"]:
        if x["prezzo"] > 0:
            r.append(x["prezzo"] * 1.1)
    return r

# ✅ honest names, single responsibility
def applica_iva(prezzi_validi: list[float]) -> list[float]:
    return [prezzo * 1.1 for prezzo in prezzi_validi]
```

### The four layers, applied to FastAPI

```
app/
├── domain/            ← core: entities, value objects, repository interfaces. ZERO dependency on FastAPI
├── application/          ← services, use cases, Pydantic DTOs. Depends only on domain
├── infrastructure/         ← SQLAlchemy implementations, external clients. Implements domain's interfaces
└── presentation/             ← FastAPI routers. The entry point, wired together via Depends
```

![Clean Architecture in FastAPI](fastapi-clean-architecture.png)

```python
# app/domain/pizza_repository.py — the interface (the "port") lives in domain
from abc import ABC, abstractmethod
from app.domain.pizza import Pizza

class PizzaRepository(ABC):
    @abstractmethod
    def trova_per_id(self, pizza_id: int) -> Pizza | None: ...

    @abstractmethod
    def tutte(self) -> list[Pizza]: ...
```

```python
# app/infrastructure/sqlalchemy_pizza_repository.py — the implementation lives outside, and DEPENDS on domain
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

The concrete benefit: `OrdineService` (application) depends only on the abstract `PizzaRepository` interface (domain), never directly on SQLAlchemy — you can test it with a fake in-memory repository without ever starting a real database (section 5), and swap ORMs by touching only `infrastructure`.

### The pragmatic approach: not every project deserves four folders

> 🧠 **Golden rule**: Clean Architecture has a cost — more files, more indirection, more concepts to keep in mind. For a FastAPI script with a handful of routes, used for a month and then thrown away, that cost doesn't pay off: a single `main.py` with clear functions is perfectly fine. The pragmatic question to ask isn't "am I following Clean Architecture?" but "will this project live long enough, and grow enough, to justify the separation?". FastAPI is loved as much for 50-line prototypes as for enterprise backends with hundreds of thousands of lines — the right structure depends on context, not dogma.

---

## 4. DDD (Domain-Driven Design)

**One-liner**: DDD is a set of practices for modeling software around the **language of the real domain** — not database tables, not frameworks. In a small project, DDD boils down to a few simple but powerful ideas: entities with identity, value objects without identity, and a shared language between code and business people.

### Entities: they have an identity that persists over time

```python
class Ordine:
    def __init__(self, id: int, pizza: "Pizza"):
        self.id = id   # the identity: two Ordine with the same id are the SAME order
        self._righe: list[RigaOrdine] = []

    def aggiungi_riga(self, pizza: "Pizza", quantita: int) -> None:
        if quantita <= 0:
            raise ValueError("La quantità deve essere positiva")
        self._righe.append(RigaOrdine(pizza, quantita))

    def totale(self) -> float:
        return sum(riga.subtotale() for riga in self._righe)
```

An `Ordine` with `id=1` remains "the same order" even if its lines change: identity (`id`) is what matters, not the current state.

### Value objects: only their value matters

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

🧠 **Analogy**: two 10€ bills are **interchangeable** — you don't care which specific bill is in your pocket, only that they're worth 10€. A `Denaro(10, "EUR")` is a value object for the same reason: two instances with the same amount and currency are, for all practical purposes, the same thing. An `Ordine`, on the other hand, isn't interchangeable with another order even if they had identical lines — they're two distinct orders, with two distinct identities.

### Ubiquitous language: the code speaks like the customer

```python
# ❌ the code uses technical terms that mean nothing to whoever sells the pizzas
def process_status_transition(entity, new_state_code):
    entity.state = new_state_code

# ✅ the code uses the same terms the pizzeria owner would use
def conferma_ordine(ordine: Ordine) -> None:
    ordine.stato = StatoOrdine.CONFERMATO
```

> 💡 **Tip**: the "ubiquitous language" is perhaps DDD's most practical contribution, and it's free: use the same names in code that the customer or domain expert would use in conversation. If the meeting talks about a "confirmed order", the code shouldn't call it `status_code == 2`.

### Bounded contexts: where one model ends and another begins

In a system larger than PizzaHub, "Customer" might mean different things in the "Orders" context (name, delivery address) and the "Billing" context (VAT number, payment history). DDD suggests **not forcing a single universal model** — each bounded context has its own representation of "Customer", linked to the others only through a shared identifier. For a project the size of PizzaHub this remains theoretical, but it's the principle that holds up much larger enterprise systems.

---

## 5. TDD with pytest

**One-liner**: **pytest** is the de facto standard testing framework in Python — minimal syntax (plain functions, native `assert`), fixtures for shared setup, and a huge plugin ecosystem. The TDD cycle (red-green-refactor) works here exactly as it does in the other languages seen in this platform.

### The cycle: red, green, refactor

```python
# 1. RED — write the test before the code, and it fails (the function doesn't exist yet)
def test_crea_ordine_con_pizza_esistente_calcola_il_totale_corretto():
    pizza = Pizza(nome="Margherita", prezzo=6.50)
    pizza_repository = FakePizzaRepository({1: pizza})
    service = OrdineService(pizza_repository)

    risultato = service.crea_ordine(CreaOrdineDto(pizza_id=1, quantita=3))

    assert risultato.totale == 19.50

# 2. GREEN — write the minimum needed to make the test pass
# 3. REFACTOR — clean up the code, the test protects you from regressions
```

### Fixtures: shared setup, without repetition

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

Fixtures are injected by name into the test's parameter list — pytest recognizes `ordine_service` and knows it must first build `pizza_margherita`. No XML configuration, no base class to extend.

### `parametrize`: the same test, many inputs

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

> 🧠 **Golden rule**: `@pytest.mark.parametrize` avoids duplicating the same test three times with only the numbers changed — one definition, N runs, N rows in the report if something fails. It's the pythonic way to write table-driven tests, equivalent to JUnit's `@ParameterizedTest` or PHPUnit's data providers.

### `TestClient`: integration tests on the real FastAPI app

```python
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_post_ordini_con_payload_valido_ritorna_201():
    risposta = client.post("/api/ordini", json={"pizza_id": 1, "quantita": 2})
    assert risposta.status_code == 201
    assert risposta.json()["totale"] == 13.00
```

`TestClient` boots the entire FastAPI app in memory (routing, Pydantic validation, dependency injection included) without opening a real network port — fast enough to run in every CI pipeline, realistic enough to test actual HTTP behavior.

> 💡 **Tip**: notice the same distinction seen in this platform's other playbooks. `test_crea_ordine_...` is a **pure unit test**: no FastAPI app started, runs in milliseconds thanks to Clean Architecture (section 3). `test_post_ordini_...` is an **integration test**: it verifies that routing, validation, and the service actually work together. You need both, in different proportions: many fast unit tests, a handful of targeted integration tests.

---

## 6. Good parts vs Bad parts

**One-liner**: Python has enormous strengths — readability, gradual typing, an unmatched library ecosystem — and a few historical pitfalls worth knowing so you can deliberately avoid them, not stumble into them by accident.

### The "bad parts": known pitfalls

```python
# ❌ mutable default argument: Python's most famous trap
def aggiungi_pizza(nome: str, lista: list = []) -> list:
    lista.append(nome)
    return lista

aggiungi_pizza("Margherita")   # ['Margherita']
aggiungi_pizza("Diavola")      # ['Margherita', 'Diavola']  ← surprise! same list reused!

# ✅ use None as the default, create the list inside the function
def aggiungi_pizza(nome: str, lista: list | None = None) -> list:
    if lista is None:
        lista = []
    lista.append(nome)
    return lista
```

> 🧠 **Golden rule**: default arguments in Python are evaluated **only once**, at function definition time — not on every call. A list or dict as a default is therefore **shared across all calls** that don't explicitly pass that argument, with surprising results. It's arguably the most common bug for people coming to Python from another language: the practical rule is "never a mutable default", full stop.

```python
# ❌ the GIL (Global Interpreter Lock): Python threading doesn't parallelize CPU-bound code
import threading

def calcolo_pesante():
    somma = sum(i * i for i in range(10_000_000))

# two parallel threads here do NOT run faster than one alone, because of the GIL
t1 = threading.Thread(target=calcolo_pesante)
t2 = threading.Thread(target=calcolo_pesante)
```

The **GIL** prevents two Python threads from executing bytecode simultaneously in the same process — for CPU-bound work you need `multiprocessing` (separate processes), or for I/O-bound work (network calls, files, database), `async`/`await`, which the GIL doesn't penalize because the thread yields control while waiting.

### The modern "good parts"

| Feature | What it solves |
|---|---|
| Type hints + `mypy`/`pyright` | An optional type system that brings Python closer to typed languages like TypeScript |
| Native `async`/`await` | Efficient handling of concurrent I/O without the cost of threads |
| Walrus operator (`:=`) | Assignment inside an expression, less repeated code |
| Pattern matching (`match`/`case`, from 3.10) | An expressive `switch`, with destructuring |
| Scientific/AI ecosystem | NumPy, pandas, PyTorch: no other language has a comparable data ecosystem |

```python
# walrus operator: assign and check in the same expression
if (pizza := trova_pizza(pizza_id)) is not None:
    print(f"Trovata: {pizza.nome}")
```

```python
# pattern matching: an expressive match on data structures
match ordine.stato:
    case StatoOrdine.IN_ATTESA:
        messaggio = "In attesa"
    case StatoOrdine.CONFERMATO:
        messaggio = "Confermato"
    case _:
        messaggio = "Stato sconosciuto"
```

> 💡 **Tip**: if you're evaluating Python for a new service in 2026, evaluate "Python 3.12+ with type hints and FastAPI", not "Python" in the abstract. The gap between untyped Python 2 scripts and a modern, typed FastAPI service tested with pytest is as large as the gap between ES5 JavaScript and modern TypeScript — they're effectively different development experiences that just happen to share a base language's name.

---

## 7. The tools (`uv`, `ruff`...)

**One-liner**: the Python tooling ecosystem has gone through a small revolution in recent years: Rust-based tools (`uv`, `ruff`) have replaced a historically slow and fragmented chain (`pip` + `virtualenv` + `black` + `flake8` + `isort`) with alternatives that are orders of magnitude faster.

### `uv`: package and virtual environment management

```bash
# ❌ the "historical" flow: slow, more tools to coordinate
python -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn sqlalchemy

# ✅ uv: one single tool, speed measured in tens of times faster
uv venv
uv pip install fastapi uvicorn sqlalchemy
# or, for a project with pyproject.toml:
uv sync
```

**`uv`**, built by Astral, is written in Rust and replaces `pip`, `pip-tools`, `virtualenv`, and to some extent `poetry` — package installs up to 10-100x faster, deterministic dependency resolution with a lockfile (`uv.lock`), integrated Python version management.

```bash
uv run uvicorn app.main:app --reload   # runs inside the project's venv, without manual activation
```

### `ruff`: linter and formatter, in a single binary

```bash
# ❌ the "historical" flow: black for formatting, flake8 for linting, isort for imports — three tools, three configs
black .
flake8 .
isort .

# ✅ ruff: linting, formatting, and import sorting in one tool, written in Rust
ruff check .        # lint
ruff format .        # formatting (a replacement for black)
```

🧠 **Analogy**: moving from `pip` + `black` + `flake8` to `uv` + `ruff` is like replacing a drawer of scattered tools with a professional multitool — same function, a fraction of the time and friction. The Python community consolidated around these two tools quickly precisely because the speed gain is huge and immediately noticeable on every single command.

### `mypy` / `pyright`: checking type hints

```bash
mypy app/               # the historical type checker
# or, often faster:
pyright app/
```

Type hints (section 1) aren't checked by the Python interpreter at runtime — tools like `mypy` or `pyright` are needed to catch type errors **before** running the code, typically wired into the CI pipeline and the editor.

> 💡 **Tip**: a professional FastAPI project in 2026 almost always has this minimal combination: `uv` for dependencies and environments, `ruff` for lint and format, `mypy` or `pyright` for type checking, `pytest` for tests. Configure them all in `pyproject.toml` — one file, one single source of truth for the whole toolchain.

```toml
# pyproject.toml (excerpt)
[tool.ruff]
line-length = 100

[tool.ruff.lint]
select = ["E", "F", "I", "UP"]   # errors, pyflakes, imports, automatic syntax upgrade

[tool.mypy]
strict = true
```

---

## 8. How do I access data? (Migrations, etc.)

**One-liner**: **SQLAlchemy** is the de facto standard ORM in the Python ecosystem, and since version 2.0 it fully supports both the synchronous and asynchronous style. **Alembic** manages schema migrations in a versioned way — never by hand, never with dangerous "auto-update" in production.

### The SQLAlchemy model

```python
from sqlalchemy import String, Numeric
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    pass

class Pizza(Base):
    __tablename__ = "pizze"

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(100))
    prezzo: Mapped[str] = mapped_column(Numeric(10, 2))   # Numeric as str in Python, to avoid losing precision
```

> 💡 **Tip**: mapping a price to `Numeric` and reading it back as `Decimal`/string in Python (not `float`) isn't a nitpick — binary floats don't exactly represent decimal values like `0.10`, and on repeated monetary calculations that imprecision accumulates. It's the same principle seen in the Symfony playbook with Doctrine's `decimal` columns.

### Separating the Pydantic schema from the ORM model

```python
# app/application/schemas.py — the API's public contract (Pydantic)
from pydantic import BaseModel

class PizzaDto(BaseModel):
    id: int
    nome: str
    prezzo: float

    model_config = {"from_attributes": True}   # allows building it from an ORM object
```

> 🧠 **Golden rule**: never expose the SQLAlchemy model directly as the API's JSON response. The ORM model represents the **database schema**; the Pydantic schema represents the API's **public contract**. They're two different things even when the fields seem to coincide: the day you add a `hash_password` column to the table, you don't want it to automatically end up in the JSON response just because you didn't explicitly exclude it.

### Queries and the N+1 problem

```python
# ❌ N+1: one query for the orders, then ONE query for every single related pizza
ordini = session.query(Ordine).all()
for ordine in ordini:
    print(ordine.pizza.nome)   # every access triggers a separate query!

# ✅ explicit eager loading: a single query for everything
from sqlalchemy.orm import joinedload

ordini = session.query(Ordine).options(joinedload(Ordine.pizza)).all()
```

> 🧠 **Golden rule**: the N+1 problem isn't a SQLAlchemy flaw — it's an inevitable consequence of *lazy loading*, present in every ORM (Hibernate in Java, Entity Framework in .NET, Doctrine in PHP, all seen in this platform's other playbooks). The difference between an app that scales and one that grinds to a halt with 1,000 orders is often exactly this: knowing when an explicit `joinedload` is needed, instead of discovering it from slow-query logs in production.

### Alembic: versioned schema, never by hand

```bash
alembic revision --autogenerate -m "aggiunge tabella ordini"   # generates a migration by diffing models against the current schema
alembic upgrade head                                              # applies pending migrations
```

```python
# migrations/versions/xxxx_aggiunge_tabella_ordini.py (auto-generated, then reviewed)
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

> 💡 **Tip**: never use `Base.metadata.create_all()` in production — it's SQLAlchemy's equivalent of Hibernate's `ddl-auto: update` or `doctrine:schema:update --force`, very convenient in development and dangerous on a real database because it can alter the schema in unreviewed ways. Alembic's versioned migrations are the only safe way to evolve the schema in production: every change is a file, reviewable in code review, applicable in order.

### Async sessions, for fully asynchronous apps

```python
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

engine = create_async_engine("postgresql+asyncpg://user:pass@localhost/pizzahub")

async def trova_per_id(session: AsyncSession, pizza_id: int) -> Pizza | None:
    return await session.get(Pizza, pizza_id)
```

If the whole app is `async` (FastAPI routing included), using `AsyncSession` instead of the synchronous session avoids blocking the event loop during queries — end-to-end consistency between the framework's concurrency model and the data access layer's.

---

## 9. How do I handle async? Lambdalith with Mangum

**One-liner**: a **Lambdalith** is a single AWS Lambda function hosting the entire FastAPI application, instead of the "one Lambda per endpoint" pattern often (wrongly) associated with serverless. **Mangum** is the adapter that translates between the Lambda/API Gateway event protocol and the ASGI interface FastAPI expects.

### Why not "one Lambda per endpoint"

```python
# ❌ "microservice per function" pattern: N separate Lambdas, N deployments, N configs to keep in sync
# lambda_pizze.py, lambda_ordini.py, lambda_clienti.py — each with its own duplicated dependency, its own cold start

# ✅ Lambdalith: ONE single FastAPI app, ONE Lambda, ONE deployment
from fastapi import FastAPI
from mangum import Mangum

app = FastAPI()

@app.get("/api/pizze")
async def elenco_pizze():
    return pizza_service.tutte()

@app.post("/api/ordini", status_code=201)
async def crea_ordine(dto: CreaOrdineDto):
    return ordine_service.crea_ordine(dto)

handler = Mangum(app)   # the entry point AWS Lambda invokes
```

![Lambdalith vs one Lambda per endpoint](lambdalith-architecture.png)

🧠 **Analogy**: "one Lambda per endpoint" sounds like "microservices", but in practice it often means duplicating the same dependencies (the same `requests` package, the same database client) across ten separate deployment packages, with ten independent cold starts and ten configurations to keep in sync. A Lambdalith is like having one restaurant with multiple tables instead of ten separate kiosks selling the same menu: one place to update, one "warm-up" to worry about, the same routing logic you already know from FastAPI.

### How `Mangum` works

```python
def handler(event, context):
    # Mangum receives the raw API Gateway event (a JSON dict)
    # translates it into an ASGI request FastAPI understands
    # runs normal FastAPI routing, including Pydantic validation and Depends
    # translates the ASGI response back into the format API Gateway expects
    ...
```

> 🧠 **Golden rule**: Mangum doesn't change a single line of your FastAPI application — it's a protocol translator, sitting **outside** the application code. This means the same FastAPI app runs identically locally with `uvicorn`, in a Docker container, or as a Lambda with Mangum: no scattered `if`s in the code for "am I on Lambda or not?". This is exactly the Infrastructure-layer principle from Clean Architecture (section 3) applied to deployment itself.

### Practical considerations: cold starts and connections

```python
# ❌ opens a new database connection on EVERY invocation — slow, and risks exhausting available connections
def handler(event, context):
    engine = create_engine(DATABASE_URL)
    ...

# ✅ initialize outside the handler function: reused across "warm" invocations of the same Lambda container
engine = create_engine(DATABASE_URL)   # at module level, run ONCE per container
handler = Mangum(app)
```

> 💡 **Tip**: AWS reuses the same Lambda container across subsequent invocations when possible ("warm start") — anything initialized at module level (database engine, HTTP client) survives from one invocation to the next on the same container, which is why it should be initialized outside the handler function, not inside. For actual cold starts (the first boot of a new container), the pragmatic choice is to keep the Lambda's dependencies minimal and the deployment package lean — one of the reasons a well-built Lambdalith often beats, in practice, a scattering of micro-lambdas with duplicated dependencies.

---

## 10. A complete example, step by step (dockerized)

Let's put it all together: **PizzaHub**, the same pizzeria order-management app seen in this platform's other playbooks — this time in FastAPI, fully dockerized: uvicorn, PostgreSQL, all orchestrated with `docker-compose`.

### What PizzaHub does

```bash
GET  /api/pizze                                  # list of available pizzas, as JSON
POST /api/ordini            { "pizza_id": 1, "quantita": 2 }   # creates an order
GET  /api/ordini/{ordine_id}                       # order detail, with the computed total
```

![Request flow in PizzaHub](pizzahub-flow.png)

### Project structure

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

### Step 1 — Dockerize the environment

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

### Step 2 — Domain: entities and "ports"

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

### Step 3 — Infrastructure: SQLAlchemy

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

### Step 4 — Application: schemas and service

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

Notice that `OrdineService` knows nothing about SQLAlchemy, HTTP, or FastAPI beyond the domain interfaces — that's what makes it testable in isolation (seen in section 5) and the database swappable without touching a single line of business logic.

### Step 5 — Presentation: router and dependency injection

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

### Step 6 — Tests, with pytest

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
    # Arrange — fake repositories, no real database
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
# tests/test_ordini_router.py — integration test, with the real FastAPI app
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_post_ordini_con_payload_valido_ritorna_201():
    risposta = client.post("/api/ordini", json={"pizza_id": 1, "quantita": 2})
    assert risposta.status_code == 201
```

```bash
docker compose exec api uv run pytest                          # all tests
docker compose exec api uv run pytest tests/test_ordine_service.py   # a single class
```

### Step 7 — Run and try it out

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

### And as a Lambdalith?

The same `app/main.py` becomes deployable to AWS Lambda by adding just one file:

```python
# app/lambda_handler.py
from mangum import Mangum
from app.main import app

handler = Mangum(app)   # not a single line of application logic changes
```

```bash
# locally, with Docker: the entrypoint is uvicorn
# on AWS Lambda: the entrypoint becomes app.lambda_handler.handler
# the same FastAPI app, the same code, two different ways of receiving traffic
```

### Concepts applied

- **Section 1**: `dataclass`, list comprehensions, type hints, `snake_case`, EAFP with `try`/`except`
- **Section 2**: declarative routing with decorators, automatic validation via Pydantic, dependency injection with `Depends`
- **Section 3**: separation into `domain` / `application` / `infrastructure` / `presentation`, with dependencies pointing inward
- **Section 4**: `Ordine` as an entity with identity, `RigaOrdine`/prices as candidate value objects
- **Section 5**: unit tests with fake repositories, integration tests with `TestClient`
- **Section 8**: SQLAlchemy ORM, separation of ORM model / Pydantic schema, N+1 prevention
- **Section 9**: the same code, deployable both as a Docker container and as a Lambdalith via Mangum
- **Section 10 itself**: Docker Compose with uvicorn + PostgreSQL, unit tests with fakes and integration tests with `TestClient`

---

## 🎉 You made it!

You've completed **FastAPI, Pythonic Way**. Now you know:

- What it means to write "pythonic" code: `snake_case`, list comprehensions, EAFP, context managers, type hints, dataclasses
- The fundamentals of FastAPI: ASGI and uvicorn, declarative path operations, automatic validation with Pydantic, dependency injection with `Depends`, OpenAPI documentation generated from the code
- Clean Architecture applied to a real FastAPI project, with the pragmatic caveat of not over-engineering small projects
- The basics of Domain-Driven Design: entities with identity, immutable value objects, ubiquitous language
- How to do TDD with pytest: fixtures, `parametrize`, `TestClient` for integration tests
- Which historical parts of Python remain dangerous (mutable default arguments, the GIL) and which language tools/patterns make them avoidable
- The new tooling standard: `uv` for dependencies and environments, `ruff` for lint and format, `mypy`/`pyright` for type checking
- How to access data correctly with SQLAlchemy: ORM models separated from Pydantic schemas, versioned migrations with Alembic, how to avoid the N+1 trap
- What a Lambdalith is and how Mangum lets the exact same FastAPI app run on AWS Lambda without changing a single line of application logic
- How to put it all together in **PizzaHub**, fully dockerized with uvicorn and PostgreSQL

**Where to go from here?**

- 📖 [Official FastAPI documentation](https://fastapi.tiangolo.com/) — among the best-written technical documentation in the whole open-source ecosystem
- 🧪 [pytest documentation](https://docs.pytest.org/) — a complete reference on fixtures, plugins, and advanced testing patterns
- 🗄️ [SQLAlchemy 2.0 documentation](https://docs.sqlalchemy.org/en/20/) — the definitive guide to the "2.0" style with `Mapped`/`mapped_column`
- ⚡ [uv documentation](https://docs.astral.sh/uv/) — to fully understand why it won over the community so fast
- ☁️ [Mangum documentation](https://mangum.io/) — a deeper look at deploying ASGI apps serverlessly
- ☕ [Booting Spring Boot — Java Edition](/en/playbook/spring) — compare the exact same project, PizzaHub, written in Java/Spring Boot: useful for understanding what really changes between ecosystems and what's a universal pattern

> 🧠 **One last piece of advice**: pythonic Python with FastAPI isn't a trade-off between development speed and rigor — you can have both. Python's reputation as a "quick and dirty scripting language" belongs to an era before type hints, Pydantic, `uv`, and `ruff`. Today you can write a typed, tested, architecturally clean backend, deployable anywhere — from a Docker container to a serverless Lambda — with the same productivity that made Python popular in the first place. Happy coding! 🐍
