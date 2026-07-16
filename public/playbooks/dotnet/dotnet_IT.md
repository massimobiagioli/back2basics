# .NET Pragmatic Approach

Nel 2000 Microsoft lanciò **.NET Framework**, un runtime chiuso, solo per Windows. Per anni fu un buon strumento enterprise, ma isolato dal resto del mondo: niente Linux, niente Mac, niente open source. Poi, nel 2016, successe qualcosa di raro nella storia di un'azienda grande come Microsoft: la riscrittura completa e la scelta di rendere tutto **open source, gratuito e cross-platform**. Nacque **.NET Core**. Nel 2020, con la versione 5, il nome tornò semplicemente **.NET** — un solo runtime, per Windows, Linux, macOS, e persino per dispositivi mobile e browser (via Blazor).

Oggi, con **.NET 10** (rilasciato a novembre 2025, versione **LTS** — Long Term Support, 3 anni di manutenzione garantita), .NET è uno dei runtime più pragmatici che esistano: veloce quasi quanto Go o Rust nei benchmark web, produttivo quasi quanto Python o Ruby nella scrittura del codice, e con un compilatore (Roslyn) che ti previene da un numero enorme di errori **prima ancora di eseguire una riga**.

L'uomo dietro il linguaggio C# è **Anders Hejlsberg**, lo stesso architetto di **Turbo Pascal**, **Delphi** e — più recentemente — **TypeScript**. Non è un caso che C# risulti familiare a chi viene da Java (sintassi simile, tipizzazione statica, garbage collector) ma anche piacevole a chi viene da Python o Ruby, grazie a `var`, LINQ, e sempre più zucchero sintattico moderno.

Questo playbook non è un manuale esaustivo — ce ne sono già migliaia. È una guida **pragmatica**: poco fronzolo, disciplina, e la strada dritta verso "come si scrive .NET vero, oggi, nel modo giusto". Alla fine costruirai una piccola applicazione gestionale da zero, mettendo in pratica ogni concetto imparato lungo il percorso.

---

## 1. Introduzione al Framework

**In pillole**: .NET è un runtime cross-platform, open source e ad alte prestazioni. L'SDK ti dà tutto quello che serve — compilatore, package manager, test runner — con un solo comando: `dotnet`.

### I quattro pezzi del puzzle

Quando qualcuno dice ".NET" intende in realtà quattro cose diverse, spesso confuse tra loro:

| Pezzo | Cos'è | Equivalente Java | Equivalente Python |
|---|---|---|---|
| **SDK** | Tutto il necessario per *sviluppare*: compilatore, CLI, template | JDK | l'interprete Python + pip |
| **Runtime (CLR)** | Il *Common Language Runtime* — esegue il codice compilato, gestisce la memoria (GC) | JVM | CPython |
| **BCL** | *Base Class Library* — le classi fondamentali (`String`, `List<T>`, `File`...) | java.lang, java.util | la stdlib |
| **C#** | Il linguaggio che scrivi (non l'unico: anche F# e VB.NET girano su .NET) | Java (linguaggio) | Python (linguaggio) |

Il codice C# non viene compilato direttamente in codice macchina. Viene compilato in **IL** (Intermediate Language, bytecode), e il **CLR** lo esegue tramite un compilatore **JIT** (Just-In-Time) — esattamente come la JVM fa con il bytecode Java. Chi conosce Java si sentirà a casa qui: stesso modello mentale, nomi diversi.

### .NET 10: cosa c'è di nuovo (pragmaticamente)

.NET 10 è una release **LTS**: è quella su cui costruire progetti seri, perché riceve aggiornamenti di sicurezza per 3 anni (contro 18 mesi delle release STS intermedie). Novità pragmatiche che contano davvero nel lavoro quotidiano:

- **C# 14**: nuovi *extension member* (estendi proprietà, non solo metodi, su tipi esistenti), la keyword `field` per accedere al campo generato automaticamente da una proprietà senza scrivere un campo privato a mano, assegnazione null-conditional (`utente?.Nome = "Ada"`).
- **Native AOT** sempre più maturo: puoi compilare la tua app in un eseguibile nativo, senza il runtime JIT, con avvio quasi istantaneo — ottimo per container e serverless.
- **Performance**: ogni versione di .NET dal 6 in poi ha spinto forte su allocazioni ridotte, `Span<T>`, e JIT più intelligente. .NET è oggi uno dei runtime web-facing più veloci al mondo secondo i benchmark TechEmpower.
- **Minimal API** ormai maturo e considerato lo stile di default per costruire servizi HTTP (lo vedremo nella sezione 9).

> 💡 **Tip**: non serve rincorrere ogni novità. Il "pragmatic approach" di questo playbook usa feature stabili e ampiamente adottate — quelle che troverai in un vero progetto enterprise oggi, non le sperimentazioni dell'ultima preview.

### Se vieni da Java o Python: il mindset shift

```java
// Java: classi, punto e virgola, static void main
public class Program {
    public static void main(String[] args) {
        System.out.println("Ciao!");
    }
}
```

```csharp
// C# 10+: top-level statements — niente classe, niente Main esplicito
Console.WriteLine("Ciao!");
```

```python
# Python: nessun tipo dichiarato, nessun punto e virgola
print("Ciao!")
```

| Aspetto | Java | Python | C# / .NET |
|---|---|---|---|
| Tipizzazione | Statica, esplicita | Dinamica | Statica, ma con `var` (inferenza) |
| Compilazione | Bytecode → JVM | Interpretato | IL → CLR (JIT) o nativo (AOT) |
| Package manager | Maven / Gradle | pip / poetry | **NuGet** (`dotnet add package`) |
| Null safety | Assente (fino a `Optional`) | Assente (`None` ovunque) | **Nullable Reference Types** (il compilatore ti avvisa) |
| Immutabilità | `record` (Java 16+) | `dataclass(frozen=True)` | `record` (dal 2020, C# 9) |
| Async | Thread / `CompletableFuture` | `asyncio` | `async`/`await` nativo, integrato ovunque |

Il punto più importante per chi arriva da Java: **C# ha adottato molte idee moderne prima di Java** (LINQ nel 2007, `async`/`await` nel 2012, i record nel 2020) — quindi molte cose ti sembreranno "quello che Java ha aggiunto dopo, ma fatto meglio integrato nel linguaggio".

### Chi usa .NET?

**Stack Overflow** (l'intero sito gira su .NET, con un traffico enorme e pochissimi server), **Microsoft stessa** (Azure, Bing, Xbox Live), grandi banche e assicurazioni (dove l'affidabilità enterprise conta più della moda), **Unity** (il motore di gioco più diffuso al mondo usa C# come linguaggio di scripting), e migliaia di aziende che scelgono .NET per il rapporto tra produttività, performance e costo di gestione a lungo termine.

---

## 2. I Concetti di Base

**In pillole**: C# è un linguaggio a tipizzazione statica con inferenza (`var`), una distinzione netta tra tipi valore e tipi riferimento, e un sistema di null-safety che il compilatore applica per te.

### Un programma minimale

```csharp
// Program.cs — questo è un intero programma .NET 10, per intero.
var nome = "Ada";
Console.WriteLine($"Ciao, {nome}!");
```

Niente `class Program`, niente `static void Main`. Questi "top-level statements" (dal C# 9) tolgono il boilerplate che spaventava i principianti — e chi viene da Python si sentirà subito a casa.

### Variabili e `var`

```csharp
var eta = 36;              // il compilatore INFERISCE int — non è dinamico, è statico e inferito
var nome = "Ada";           // string, deciso a compile-time, non cambia mai
int altezza = 165;             // esplicito, funziona identico

// const: valore fisso, noto a compile-time
const double Pi = 3.14159;

// nessuna delle due righe seguenti compila:
// eta = "trentasei";  ❌ errore di compilazione — eta è int, per sempre
```

> 🧠 **La regola d'oro**: `var` **non è** `dynamic`. Il tipo viene deciso una volta per tutte dal compilatore in base al valore assegnato. Usa `var` quando il tipo è ovvio dal contesto (`var lista = new List<string>()`), scrivi il tipo esplicito quando aiuta la leggibilità (`int risultato = CalcolaComplesso()`).

### Value type vs Reference type — il concetto più importante

Questa è la distinzione che chi viene da Python o Ruby (dove "tutto è un oggetto riferimento") deve ricalibrare per prima:

```csharp
// struct = value type: viene COPIATO quando lo assegni o lo passi
struct Punto
{
    public int X, Y;
}

var p1 = new Punto { X = 1, Y = 2 };
var p2 = p1;          // p2 è una COPIA indipendente di p1
p2.X = 99;
Console.WriteLine(p1.X);   // => 1, invariato!

// class = reference type: viene condiviso un RIFERIMENTO allo stesso oggetto
class Persona
{
    public string Nome = "";
}

var pers1 = new Persona { Nome = "Ada" };
var pers2 = pers1;          // pers2 punta allo STESSO oggetto di pers1
pers2.Nome = "Grace";
Console.WriteLine(pers1.Nome);   // => "Grace", perché è lo stesso oggetto!
```

| | `struct` (value type) | `class` (reference type) |
|---|---|---|
| Dove vive | Tipicamente sullo stack (più veloce) | Sull'heap, gestito dal Garbage Collector |
| Assegnazione | Copia il valore | Copia il riferimento |
| Uso tipico | Piccoli dati immutabili: `int`, `DateTime`, coordinate | Entità con identità, oggetti complessi, la maggior parte del tuo codice |

> 🧠 **La regola d'oro**: nel 95% dei casi userai `class`. Usa `struct` solo per piccoli valori immutabili senza identità propria (es. `Point`, `Money` come value object — sezione 5). Se hai un dubbio, `class` è quasi sempre la scelta giusta.

### Nullable Reference Types: niente più `NullPointerException`

```csharp
#nullable enable   // attivo di default nei progetti moderni

string nome = null;   // ⚠️ il compilatore AVVISA: stai assegnando null a un tipo non-nullable

string? soprannome = null;   // ✅ il `?` dichiara esplicitamente: "questo può essere null"

// il compilatore ti OBBLIGA a controllare prima di usarlo:
if (soprannome != null)
{
    Console.WriteLine(soprannome.Length);   // ok, qui il compilatore sa che non è null
}

Console.WriteLine(soprannome?.Length ?? 0);   // null-conditional + null-coalescing, in una riga
```

Chi viene da Java conosce il dolore di `NullPointerException` a runtime, spesso a chilometri di distanza da dove il `null` è stato assegnato. In C#, il compilatore traccia la "nullabilità" di ogni variabile e ti avvisa **prima che il codice giri**, non dopo che è andato in produzione.

### Record: immutabilità pragmatica

```csharp
// Un record è un tipo pensato per rappresentare DATI, con uguaglianza per VALORE
public record Prodotto(string Nome, decimal Prezzo);

var p1 = new Prodotto("Tastiera", 49.90m);
var p2 = new Prodotto("Tastiera", 49.90m);

Console.WriteLine(p1 == p2);   // => true! Confronta i VALORI, non il riferimento
                                 // (con una class normale, sarebbe stato false)

// "with expression": crea una copia modificata, l'originale resta intatto
var p3 = p1 with { Prezzo = 39.90m };
Console.WriteLine(p1.Prezzo);   // => 49.90, invariato
```

I record sono la scelta di default per DTO, Value Object (sezione 5), e qualunque dato che rappresenta "un valore", non "un'entità con identità che cambia nel tempo".

### Pattern Matching

```csharp
object valore = 42;

string descrizione = valore switch
{
    int n when n < 0  => "negativo",
    int n when n == 0 => "zero",
    int n              => $"positivo: {n}",
    string s           => $"è una stringa: {s}",
    null                => "è null",
    _                    => "boh"
};

// pattern matching sui record, per "destrutturare" i dati
if (p1 is Prodotto { Prezzo: > 100 } costoso)
{
    Console.WriteLine($"{costoso.Nome} è caro!");
}
```

### Collezioni e LINQ

**LINQ** (*Language Integrated Query*) è probabilmente la feature che rende C# più piacevole da scrivere per chi ama `map`/`filter`/`reduce` in Ruby o le list comprehension in Python:

```csharp
var numeri = new List<int> { 1, 2, 3, 4, 5, 6 };

var pari = numeri.Where(n => n % 2 == 0);          // filter
var quadrati = numeri.Select(n => n * n);           // map
var somma = numeri.Sum();                             // reduce, già pronto
var totale = numeri.Aggregate(0, (acc, n) => acc + n);  // reduce generico

// query "fluida", leggibile, componibile
var risultato = numeri
    .Where(n => n > 2)
    .Select(n => n * 10)
    .OrderByDescending(n => n)
    .ToList();   // => [60, 50, 40, 30]

// sintassi "query" alternativa, ispirata a SQL — meno usata ma valida
var altraQuery = from n in numeri
                  where n % 2 == 0
                  select n * n;
```

> 💡 **Tip**: LINQ è **lazy** (valutazione differita) finché non chiami `.ToList()`, `.ToArray()`, `.Count()` o iteri con `foreach`. Questo significa che puoi comporre query complesse senza sprecare memoria — la vedremo tornare utile con Entity Framework nella prossima sezione, dove LINQ si traduce direttamente in SQL.

---

## 3. Entity Framework (Core)

**In pillole**: Entity Framework Core (EF Core) è l'ORM ufficiale di .NET. Scrivi classi C#, EF Core genera lo schema del database e traduce le tue query LINQ in SQL.

### Cos'è un ORM, in una frase

Un **ORM** (*Object-Relational Mapper*) traduce tra due mondi che parlano lingue diverse: gli oggetti C# nella tua app, e le tabelle relazionali nel database. Senza ORM scriveresti SQL a mano ovunque; con EF Core scrivi C#, ed EF Core genera l'SQL per te — restando comunque capace di scrivere SQL grezzo quando serve davvero.

### `DbContext` e `DbSet`

```csharp
public class Prodotto
{
    public int Id { get; set; }
    public string Nome { get; set; } = "";
    public decimal Prezzo { get; set; }
}

public class MagazzinoContext : DbContext
{
    public DbSet<Prodotto> Prodotti => Set<Prodotto>();

    protected override void OnConfiguring(DbContextOptionsBuilder options)
        => options.UseSqlite("Data Source=magazzino.db");
}
```

Il `DbContext` è la tua "connessione consapevole" al database: tiene traccia degli oggetti caricati, delle modifiche fatte, e sa come tradurle in `INSERT`/`UPDATE`/`DELETE` quando chiami `SaveChanges()`.

### Code-First: la classe è la fonte di verità

```csharp
using var db = new MagazzinoContext();

var tastiera = new Prodotto { Nome = "Tastiera meccanica", Prezzo = 89.90m };
db.Prodotti.Add(tastiera);   // ancora NON scritto sul database, solo "tracciato"

db.SaveChanges();             // ORA viene generato ed eseguito l'INSERT
```

Non scrivi tu lo schema SQL: lo **generi** dalle classi, tramite le **migrazioni**:

```bash
dotnet tool install --global dotnet-ef        # una volta sola, per avere il comando ef

dotnet ef migrations add InitialCreate         # genera il codice della migrazione
dotnet ef database update                       # applica la migrazione al database reale
dotnet ef migrations add AggiungiCategoria      # ogni modifica alle classi = nuova migrazione
```

Ogni migrazione è codice C# versionabile in Git: puoi vedere esattamente cosa è cambiato tra uno stato del database e l'altro, e chiunque nel team può ricreare lo schema da zero eseguendo tutte le migrazioni in ordine.

### Query con LINQ

```csharp
// EF Core traduce QUESTO LINQ in SQL, non lo esegue in memoria!
var prodottiCari = db.Prodotti
    .Where(p => p.Prezzo > 50)
    .OrderBy(p => p.Nome)
    .ToList();

// genera qualcosa come:
// SELECT * FROM Prodotti WHERE Prezzo > 50 ORDER BY Nome
```

### Relazioni

```csharp
public class Categoria
{
    public int Id { get; set; }
    public string Nome { get; set; } = "";
    public List<Prodotto> Prodotti { get; set; } = [];   // uno-a-molti
}

public class Prodotto
{
    public int Id { get; set; }
    public string Nome { get; set; } = "";
    public decimal Prezzo { get; set; }

    public int CategoriaId { get; set; }             // chiave esterna
    public Categoria? Categoria { get; set; }          // proprietà di navigazione
}

// Include(): carica ESPLICITAMENTE la relazione (eager loading)
var prodotti = db.Prodotti
    .Include(p => p.Categoria)
    .ToList();
```

> 🧠 **La regola d'oro — il problema N+1**: se accedi a `prodotto.Categoria` **senza** aver fatto `Include()`, EF Core può eseguire una query separata per ogni singolo prodotto (con *lazy loading* attivo) — un disastro di performance con 1.000 prodotti. Usa sempre `Include()` esplicito per le relazioni che sai già di dover leggere. È la stessa trappola nota in Java come "N+1 problem" di Hibernate.

### Tracking vs `AsNoTracking`

```csharp
// di default, EF Core "traccia" ogni entità caricata (per rilevare modifiche da salvare dopo)
var prodotto = db.Prodotti.First();   // TRACCIATO — più lento, usa memoria per il confronto

// per query di sola lettura (es. una API che restituisce dati senza mai modificarli):
var prodottiSoloLettura = db.Prodotti
    .AsNoTracking()
    .ToList();   // più veloce, niente overhead di tracking
```

> 💡 **Tip**: usa `AsNoTracking()` per **ogni** query di sola lettura — è una delle ottimizzazioni più semplici e ad alto impatto in EF Core, e la userai spessissimo negli endpoint `GET` delle tue API (sezione 9).

---

## 4. OOP, the Right Way, the Pragmatic Way

**In pillole**: C# è un linguaggio object-oriented completo, ma "pragmatico" significa preferire la composizione all'ereditarietà, usare interfacce piccole e mirate, e non applicare pattern per il gusto di applicarli.

### Interfacce vs classi astratte

```csharp
// interfaccia: un CONTRATTO, nessuna implementazione condivisa
public interface INotificatore
{
    Task InviaAsync(string destinatario, string messaggio);
}

public class EmailNotificatore : INotificatore
{
    public Task InviaAsync(string destinatario, string messaggio)
    {
        Console.WriteLine($"Email a {destinatario}: {messaggio}");
        return Task.CompletedTask;
    }
}

public class SmsNotificatore : INotificatore
{
    public Task InviaAsync(string destinatario, string messaggio)
    {
        Console.WriteLine($"SMS a {destinatario}: {messaggio}");
        return Task.CompletedTask;
    }
}
```

Il codice che usa `INotificatore` non sa mai — e non gli interessa — se sta parlando con un'email o un SMS. Questo è **polimorfismo tramite interfaccia**, ed è il fondamento della Dependency Injection che vedremo nella sezione 9.

| | Interfaccia | Classe astratta |
|---|---|---|
| Implementazione condivisa | No (solo contratto, salvo i default member) | Sì, può contenere codice comune |
| Ereditarietà multipla | Una classe può implementarne **molte** | Una classe può ereditarne **solo una** |
| Quando usarla | Quasi sempre: contratti, dipendenze da iniettare | Raramente: quando serve DAVVERO condividere implementazione tra tipi strettamente imparentati |

> 🧠 **La regola d'oro**: parti sempre da un'interfaccia. Aggiungi una classe astratta solo se ti accorgi di duplicare lo stesso codice concreto in più implementazioni — e anche allora, valuta prima la composizione.

### Composition over Inheritance

```csharp
// ❌ Ereditarietà profonda: fragile, difficile da modificare
public class Uccello { public virtual void Vola() => Console.WriteLine("Volo!"); }
public class Pinguino : Uccello { public override void Vola() => throw new NotSupportedException(); }
// ⚠️ i pinguini sono uccelli, ma non volano — l'ereditarietà mente

// ✅ Composizione: componi comportamenti, non genealogie
public interface IMovimento { void Muoviti(); }

public class VoloComportamento : IMovimento { public void Muoviti() => Console.WriteLine("Volo!"); }
public class NuotoComportamento : IMovimento { public void Muoviti() => Console.WriteLine("Nuoto!"); }

public class Animale(string nome, IMovimento movimento)   // primary constructor, C# 12+
{
    public void Muoviti() => movimento.Muoviti();
}

var pinguino = new Animale("Pingu", new NuotoComportamento());
var aquila = new Animale("Aquila", new VoloComportamento());
```

Ogni `Animale` **ha** un modo di muoversi, invece di **essere** forzato dentro una gerarchia rigida che non rispecchia davvero la realtà. Questo è il principio *"favor composition over inheritance"* del Gang of Four — vale in C# tanto quanto in Java.

### SOLID, applicato con pragmatismo

| Principio | La versione da manuale | La versione pragmatica |
|---|---|---|
| **S**ingle Responsibility | Una classe ha una sola ragione per cambiare | Se il nome della classe contiene una "e" ("Gestore**E**Validatore"), spezzala |
| **O**pen/Closed | Aperta all'estensione, chiusa alla modifica | Usa interfacce per i punti che sai che cambieranno; non blindare tutto "per sicurezza" |
| **L**iskov Substitution | Una sottoclasse deve poter sostituire la base senza rompere nulla | Se `Pinguino : Uccello` deve lanciare `NotSupportedException`, l'ereditarietà è sbagliata (vedi sopra) |
| **I**nterface Segregation | Tante interfacce piccole, non una gigante | `IRepository<T>` con 15 metodi è un anti-pattern: dividi per responsabilità |
| **D**ependency Inversion | Dipendi da astrazioni, non da implementazioni concrete | I tuoi servizi dipendono da `INotificatore`, mai da `EmailNotificatore` direttamente |

> 🧠 **La regola d'oro**: SOLID non sono leggi fisiche, sono euristiche. Applicale quando risolvono un problema reale (codice difficile da testare, da estendere, da capire). Non applicarle "a priori" su un progetto piccolo — è overengineering, ed è l'opposto del pragmatismo che questo playbook predica.

### Record per i dati, classi per i comportamenti

Una distinzione pragmatica molto pratica: se un tipo rappresenta **un valore** (un DTO, una coordinata, un range di date), usa `record`. Se rappresenta **un'entità con identità e comportamento** (un `Ordine` che sa calcolare il proprio totale, un `Utente` che sa validarsi), usa `class`. Non serve altro dogma di quello.

---

## 5. Clean Code, Clean Architecture, DDD

**In pillole**: codice pulito in C# significa nomi onesti, metodi piccoli, e zero commenti che ripetono quello che il codice già dice. Clean Architecture organizza il progetto in livelli con una sola regola: le dipendenze puntano sempre verso l'interno.

### Clean Code, in pratica

```csharp
// ❌ nome bugiardo, metodo che fa troppo
public void ProcessaDati(List<int> d)
{
    var r = new List<int>();
    foreach (var x in d)
    {
        if (x > 0) r.Add(x * 2);
    }
    // ...altre 40 righe...
}

// ✅ nomi onesti, una sola responsabilità per metodo
public List<int> RaddoppiaValoriPositivi(List<int> numeri)
    => numeri.Where(n => n > 0).Select(n => n * 2).ToList();
```

```csharp
// ❌ il commento ripete quello che il codice dice già
// controlla se l'ordine è valido
if (ordine.Totale > 0 && ordine.Righe.Count > 0) { }

// ✅ un metodo con nome onesto elimina il bisogno del commento
if (ordine.EValido()) { }
```

> 💡 **Tip**: se devi scrivere un commento per spiegare COSA fa una riga di codice, il codice ha un problema di naming, non un problema di documentazione. Riserva i commenti al PERCHÉ ("// usiamo UTC qui perché il fornitore esterno lo richiede"), mai al COSA.

### Clean Architecture: i livelli

```
GestionaleApp/
├── Domain/            ← nucleo: entità, value object, interfacce. ZERO dipendenze esterne
├── Application/        ← servizi, use case, DTO. Dipende solo da Domain
├── Infrastructure/       ← EF Core, repository concreti, servizi esterni. Implementa le interfacce di Domain
└── Api/                    ← Minimal API, Program.cs. Il punto di ingresso, assembla tutto con DI
```

![Clean Architecture in .NET](dotnet-clean-architecture.png)

La **regola di dipendenza** è una sola, e non ha eccezioni: le frecce puntano sempre verso l'interno. `Domain` non sa nulla di Entity Framework, di HTTP, o di nessun'altra libreria — è puro C#. `Infrastructure` conosce `Domain` (per implementarne le interfacce), ma `Domain` non conosce mai `Infrastructure`.

```csharp
// Domain/IProdottoRepository.cs — l'interfaccia vive nel Domain
public interface IProdottoRepository
{
    Task<Prodotto?> GetByIdAsync(int id);
    Task AddAsync(Prodotto prodotto);
}

// Infrastructure/ProdottoRepository.cs — l'implementazione vive fuori, e DIPENDE da Domain
public class ProdottoRepository(MagazzinoContext db) : IProdottoRepository
{
    public Task<Prodotto?> GetByIdAsync(int id) => db.Prodotti.FindAsync(id).AsTask();
    public Task AddAsync(Prodotto prodotto) { db.Prodotti.Add(prodotto); return db.SaveChangesAsync(); }
}
```

Il vantaggio concreto: puoi testare tutta la logica di `Application` e `Domain` **senza un database vero**, sostituendo `IProdottoRepository` con un finto in-memory nei test (sezione 6). E puoi cambiare database — da SQLite a PostgreSQL — toccando solo `Infrastructure`.

### DDD, in pillole pragmatiche

*Domain-Driven Design* non è un framework, è un modo di pensare al codice come modello del dominio di business:

| Concetto DDD | Cos'è | Esempio |
|---|---|---|
| **Entity** | Ha un'identità che persiste nel tempo, anche se i suoi dati cambiano | `Ordine` (lo stesso ordine, anche se cambia stato) |
| **Value Object** | Definito interamente dai suoi valori, senza identità propria | `Indirizzo`, `Denaro` — due `Denaro(10, "EUR")` sono sempre uguali |
| **Aggregate** | Un gruppo di entità/value object trattato come un'unità consistente | `Ordine` + le sue `RigaOrdine` — non modifichi mai una riga senza passare dall'ordine |
| **Repository** | Astrazione per caricare/salvare un Aggregate, nasconde il database | `IOrdineRepository` |

```csharp
// Value Object: immutabile, uguaglianza per valore — un record è perfetto per questo
public record Denaro(decimal Importo, string Valuta)
{
    public static Denaro operator +(Denaro a, Denaro b)
    {
        if (a.Valuta != b.Valuta)
            throw new InvalidOperationException("Non puoi sommare valute diverse");
        return a with { Importo = a.Importo + b.Importo };
    }
}

// Entity con comportamento reale, non solo dati (il contrario del "modello anemico")
public class Ordine
{
    public int Id { get; private set; }
    private readonly List<RigaOrdine> _righe = [];
    public IReadOnlyList<RigaOrdine> Righe => _righe;

    public void AggiungiRiga(Prodotto prodotto, int quantita)
    {
        if (quantita <= 0) throw new ArgumentException("La quantità deve essere positiva");
        _righe.Add(new RigaOrdine(prodotto, quantita));
    }

    public Denaro Totale() =>
        _righe.Aggregate(new Denaro(0, "EUR"), (tot, riga) => tot + riga.Subtotale());
}
```

> 🧠 **La regola d'oro — modello anemico vs modello ricco**: un "modello anemico" (`Ordine` con solo `get`/`set`, e tutta la logica sparsa nei controller) è l'anti-pattern più comune nel codice enterprise. Un modello ricco, come `Ordine` sopra, sa rispondere da solo a domande sul proprio stato (`Totale()`) e protegge le proprie invarianti (`AggiungiRiga` rifiuta quantità negative). La logica di business vive dove vivono i dati che coinvolge.

---

## 6. TDD

**In pillole**: TDD (Test-Driven Development) in .NET si scrive tipicamente con **xUnit**, seguendo il ciclo Red-Green-Refactor e la struttura Arrange-Act-Assert.

### Il ciclo Red-Green-Refactor

1. **Red**: scrivi un test che descrive il comportamento che vuoi, e fallo fallire (perché il codice non esiste ancora).
2. **Green**: scrivi il codice minimo indispensabile per far passare il test — niente di più.
3. **Refactor**: ripulisci il codice (e il test, se serve), con la sicurezza che il test ti avvisa se rompi qualcosa.

### Struttura Arrange-Act-Assert con xUnit

```csharp
// GestionaleApp.Tests/OrdineTests.cs
using Xunit;

public class OrdineTests
{
    [Fact]
    public void AggiungiRiga_ConQuantitaPositiva_AggiungeLaRiga()
    {
        // Arrange — prepara i dati e le dipendenze
        var ordine = new Ordine();
        var prodotto = new Prodotto { Nome = "Tastiera", Prezzo = 50m };

        // Act — esegui l'azione che vuoi testare
        ordine.AggiungiRiga(prodotto, 2);

        // Assert — verifica il risultato atteso
        Assert.Single(ordine.Righe);
        Assert.Equal(100m, ordine.Totale().Importo);
    }

    [Fact]
    public void AggiungiRiga_ConQuantitaNegativa_LanciaEccezione()
    {
        var ordine = new Ordine();
        var prodotto = new Prodotto { Nome = "Tastiera", Prezzo = 50m };

        Assert.Throws<ArgumentException>(() => ordine.AggiungiRiga(prodotto, -1));
    }

    [Theory]
    [InlineData(1, 50)]
    [InlineData(3, 150)]
    [InlineData(10, 500)]
    public void Totale_ConQuantitaVariabile_CalcolaCorrettamente(int quantita, decimal atteso)
    {
        var ordine = new Ordine();
        ordine.AggiungiRiga(new Prodotto { Nome = "Tastiera", Prezzo = 50m }, quantita);

        Assert.Equal(atteso, ordine.Totale().Importo);
    }
}
```

`[Fact]` è un test singolo. `[Theory]` + `[InlineData]` esegue lo stesso test con più input diversi — utilissimo per non ripetere lo stesso Arrange-Act-Assert dieci volte.

### Mocking delle dipendenze

Grazie a Clean Architecture (sezione 5), testare la logica applicativa non richiede un database vero — basta un finto `IProdottoRepository`:

```csharp
using NSubstitute;   // libreria di mocking moderna, alternativa a Moq

public class OrdineServiceTests
{
    [Fact]
    public async Task CreaOrdineAsync_ConProdottoEsistente_CreaEValida()
    {
        // Arrange — un repository FINTO, che restituisce un prodotto già pronto
        var repo = Substitute.For<IProdottoRepository>();
        repo.GetByIdAsync(1).Returns(new Prodotto { Id = 1, Nome = "Tastiera", Prezzo = 50m });

        var service = new OrdineService(repo);

        // Act
        var ordine = await service.CreaOrdineAsync(prodottoId: 1, quantita: 2);

        // Assert
        Assert.Equal(100m, ordine.Totale().Importo);
        await repo.Received(1).GetByIdAsync(1);   // verifica che sia stato CHIAMATO, non solo il risultato
    }
}
```

> 🧠 **La regola d'oro**: mocka i confini del sistema (repository, chiamate HTTP esterne, orologio di sistema) — mai l'oggetto che stai effettivamente testando. Se il tuo test ha bisogno di 6 mock per testare una singola classe, è un segnale che quella classe fa troppe cose: torna alla sezione 4 (Single Responsibility).

### Comandi

```bash
dotnet new xunit -o GestionaleApp.Tests    # crea un progetto di test
dotnet test                                    # esegue tutti i test
dotnet test --filter "Ordine"                   # esegue solo i test che matchano "Ordine"
dotnet watch test                                 # ri-esegue i test a ogni salvataggio — perfetto per il TDD
```

---

## 7. I Tool (CLI, NuGet)

**In pillole**: tutto quello che serve per lavorare con .NET passa da un solo comando: `dotnet`. I pacchetti si chiamano NuGet package, l'equivalente diretto di una gemma Ruby o di un pacchetto pip.

### Il comando `dotnet`

```bash
dotnet new webapi -o GestionaleApi     # crea un nuovo progetto da un template
dotnet new sln                            # crea una solution (raggruppa più progetti)

dotnet build                                 # compila
dotnet run                                     # compila ed esegue
dotnet watch run                                # esegue e RICOMPILA automaticamente a ogni modifica salvata

dotnet test                                       # esegue i test
dotnet publish -c Release -o ./out                  # build ottimizzata, pronta per il deploy

dotnet --list-sdks                                    # SDK installati
dotnet --version                                        # versione SDK attiva
```

`dotnet watch run` è l'equivalente esatto di `nodemon` in Node.js o dell'auto-reload di Rails: modifichi un file, l'app si ricompila e riparte da sola.

### NuGet: il package manager

```bash
dotnet add package Microsoft.EntityFrameworkCore.Sqlite    # aggiunge una dipendenza
dotnet add package NSubstitute --version 5.*                  # con un vincolo di versione

dotnet restore     # scarica tutte le dipendenze dichiarate nel .csproj (di solito automatico)
dotnet list package               # elenca le dipendenze del progetto
dotnet list package --outdated       # segnala quali hanno una versione più recente disponibile
```

Le dipendenze finiscono nel file `.csproj` del progetto — l'equivalente di `package.json` o `Gemfile`:

```xml
<!-- GestionaleApi.csproj -->
<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.EntityFrameworkCore.Sqlite" Version="10.0.0" />
  </ItemGroup>
</Project>
```

### Qualità del codice

```bash
dotnet format                # formatta il codice secondo le convenzioni .editorconfig — come `rubocop -a` o `black`
dotnet tool install --global dotnet-outdated-tool
dotnet outdated               # verifica dipendenze obsolete in modo più dettagliato di `list package --outdated`
```

### Editor e IDE

| Editor | Quando usarlo |
|---|---|
| **Visual Studio** (Windows) | Il più completo: debugger potentissimo, designer visuali, ottimo per progetti grandi |
| **VS Code** + estensione C# Dev Kit | Leggero, cross-platform, ottimo per chi già lo usa con altri linguaggi |
| **JetBrains Rider** | La scelta di chi viene da IntelliJ/PyCharm — stessa filosofia, stesse scorciatoie familiari |

> 💡 **Tip**: se conosci già IntelliJ IDEA o PyCharm da Java/Python, Rider ti farà sentire immediatamente a casa — stesso motore di refactoring intelligente, stessa UX.

---

## 8. Async Programming

**In pillole**: `async`/`await` in C# non blocca il thread mentre aspetta un'operazione I/O (rete, disco, database) — libera il thread per fare altro, e riprende quando il risultato è pronto.

### `Task` e `Task<T>`

```csharp
// un metodo che NON ritorna un valore, ma è asincrono
public async Task SalvaLogAsync(string messaggio)
{
    await File.AppendAllTextAsync("log.txt", messaggio);
}

// un metodo che ritorna un valore, in modo asincrono
public async Task<Prodotto?> TrovaProdottoAsync(int id)
{
    return await db.Prodotti.FindAsync(id);
}

// il chiamante usa `await` per "aspettare" il risultato, senza bloccare il thread
var prodotto = await TrovaProdottoAsync(1);
```

Il paragone più utile con Python: `Task<T>` è concettualmente una `Coroutine`/`Future` di `asyncio`, e `await` funziona in modo molto simile — con una differenza cruciale: **in C# non serve un event loop esplicito** come `asyncio.run()`. `async`/`await` è integrato nativamente in ASP.NET Core, EF Core, e in praticamente ogni libreria I/O.

### Perché non `async void`

```csharp
// ❌ async void: le eccezioni QUI dentro possono crashare l'intera applicazione,
// e non puoi fare `await` su di lui per aspettarne il completamento
public async void ElaboraOrdine(int id) { ... }

// ✅ async Task: le eccezioni vengono propagate normalmente, è awaitable
public async Task ElaboraOrdineAsync(int id) { ... }
```

L'unica eccezione legittima a questa regola: gli **event handler** delle UI (es. `button_Click`), che per firma devono essere `void` e non possono essere `Task`.

> 🧠 **La regola d'oro**: se un metodo fa I/O (database, HTTP, file system), rendilo `async Task`/`async Task<T>` e usa `await` fino in cima alla catena di chiamate. Non mischiare mai `.Result` o `.Wait()` su un `Task` dentro codice sincrono — è la causa numero uno di deadlock in applicazioni ASP.NET.

### `CancellationToken`: annullare operazioni in corso

```csharp
public async Task<List<Prodotto>> CercaProdottiAsync(string query, CancellationToken ct)
{
    return await db.Prodotti
        .Where(p => p.Nome.Contains(query))
        .ToListAsync(ct);   // se il client annulla la richiesta HTTP, la query si ferma
}
```

In una API, ASP.NET Core passa automaticamente un `CancellationToken` collegato alla richiesta HTTP: se l'utente chiude il browser mentre la query gira ancora, il database interrompe il lavoro invece di continuare inutilmente.

### Eseguire più operazioni in parallelo

```csharp
// ❌ sequenziale: 3 chiamate da 200ms = 600ms totali
var prodotto = await TrovaProdottoAsync(1);
var categoria = await TrovaCategoriaAsync(2);
var recensioni = await TrovaRecensioniAsync(1);

// ✅ parallelo: 3 chiamate indipendenti partono insieme = ~200ms totali
var prodottoTask = TrovaProdottoAsync(1);
var categoriaTask = TrovaCategoriaAsync(2);
var recensioniTask = TrovaRecensioniAsync(1);

await Task.WhenAll(prodottoTask, categoriaTask, recensioniTask);

var prodotto = await prodottoTask;   // il risultato è già pronto, questo await è istantaneo
```

### `IAsyncEnumerable<T>`: stream asincroni

```csharp
public async IAsyncEnumerable<Prodotto> LeggiTuttiAsync()
{
    await foreach (var prodotto in db.Prodotti.AsAsyncEnumerable())
    {
        yield return prodotto;   // produce elementi uno alla volta, senza caricarli tutti in memoria
    }
}
```

---

## 9. Scrivere API

**In pillole**: le **Minimal API** sono lo stile moderno raccomandato per costruire servizi HTTP in .NET — meno boilerplate dei Controller classici, stessa potenza, ideali per API REST pragmatiche.

### Minimal API: la sintassi

```csharp
// Program.cs
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<MagazzinoContext>();
builder.Services.AddScoped<IProdottoRepository, ProdottoRepository>();

var app = builder.Build();

app.MapGet("/api/prodotti", async (IProdottoRepository repo) =>
{
    var prodotti = await repo.GetAllAsync();
    return Results.Ok(prodotti);
});

app.MapGet("/api/prodotti/{id:int}", async (int id, IProdottoRepository repo) =>
{
    var prodotto = await repo.GetByIdAsync(id);
    return prodotto is not null ? Results.Ok(prodotto) : Results.NotFound();
});

app.MapPost("/api/prodotti", async (CreaProdottoDto dto, IProdottoRepository repo) =>
{
    if (dto.Prezzo <= 0)
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["Prezzo"] = ["Il prezzo deve essere positivo"]
        });

    var prodotto = new Prodotto { Nome = dto.Nome, Prezzo = dto.Prezzo };
    await repo.AddAsync(prodotto);
    return Results.Created($"/api/prodotti/{prodotto.Id}", prodotto);
});

app.Run();

public record CreaProdottoDto(string Nome, decimal Prezzo);
```

### Dependency Injection: nativa, non un plugin

.NET ha un container di Dependency Injection **integrato nel framework** — non serve nessuna libreria esterna (a differenza di Java, dove Spring è un framework separato):

```csharp
// registrazione — di solito in Program.cs
builder.Services.AddScoped<IProdottoRepository, ProdottoRepository>();   // una istanza per richiesta HTTP
builder.Services.AddSingleton<ICache, MemoryCache>();                     // una istanza per l'intera app
builder.Services.AddTransient<IEmailSender, SmtpEmailSender>();            // una nuova istanza ogni volta

// uso — il framework "inietta" automaticamente le dipendenze nei parametri dell'endpoint
app.MapGet("/api/prodotti", async (IProdottoRepository repo) => await repo.GetAllAsync());
```

| Lifetime | Quando usarlo |
|---|---|
| `Scoped` | Default per repository, servizi legati a una richiesta HTTP (es. il `DbContext`) |
| `Singleton` | Servizi senza stato mutabile per-richiesta: cache, configurazione, client HTTP condivisi |
| `Transient` | Servizi leggeri, stateless, dove non importa creare una nuova istanza ogni volta |

### DTO e validazione

Non esporre mai le tue entità di dominio direttamente nell'API — usa DTO dedicati (spesso `record`, per l'immutabilità):

```csharp
public record CreaProdottoDto(string Nome, decimal Prezzo);
public record ProdottoDto(int Id, string Nome, decimal Prezzo)
{
    public static ProdottoDto Da(Prodotto p) => new(p.Id, p.Nome, p.Prezzo);
}
```

> 🧠 **La regola d'oro**: l'entità di dominio (`Prodotto`) conosce le regole di business. Il DTO conosce solo la forma dei dati sulla rete. Confonderli porta a un accoppiamento pericoloso: cambiare una colonna del database finisce per rompere il contratto pubblico dell'API.

### OpenAPI / Swagger

```csharp
builder.Services.AddOpenApi();   // integrato in .NET 9+, nessun pacchetto esterno necessario

var app = builder.Build();
app.MapOpenApi();                  // espone lo schema JSON su /openapi/v1.json

if (app.Environment.IsDevelopment())
{
    app.MapScalarApiReference();      // UI interattiva per esplorare e provare l'API
}
```

### Status code onesti

```csharp
Results.Ok(dato)              // 200
Results.Created(url, dato)   // 201
Results.NoContent()             // 204 — es. dopo una DELETE riuscita
Results.NotFound()               // 404
Results.ValidationProblem(errori)   // 400, con formato standard ProblemDetails (RFC 7807)
Results.Conflict()                    // 409
```

---

## 10. Progetto: Costruiamo MagazzinoLite, un mini-gestionale da zero

Mettiamo insieme tutto quello che abbiamo imparato: Domain, EF Core, Clean Architecture, TDD, async e Minimal API, in un piccolo ma vero gestionale.

### Cosa fa MagazzinoLite

```bash
# Elenca i prodotti disponibili
GET /api/prodotti

# Aggiunge un nuovo prodotto al catalogo
POST /api/prodotti     { "nome": "Tastiera meccanica", "prezzo": 89.90 }

# Crea un ordine per un prodotto e una quantità
POST /api/ordini     { "prodottoId": 1, "quantita": 3 }

# Recupera il dettaglio di un ordine, con il totale calcolato
GET /api/ordini/{id}
```

### Comandi rapidi per iniziare

```bash
dotnet new sln -o MagazzinoLite && cd MagazzinoLite

dotnet new classlib -o Domain
dotnet new classlib -o Application
dotnet new classlib -o Infrastructure
dotnet new webapi -o Api
dotnet new xunit -o Tests

dotnet sln add Domain Application Infrastructure Api Tests
dotnet add Application reference Domain
dotnet add Infrastructure reference Domain Application
dotnet add Api reference Application Infrastructure
dotnet add Tests reference Application Domain

dotnet add Infrastructure package Microsoft.EntityFrameworkCore.Sqlite
dotnet add Api package Microsoft.EntityFrameworkCore.Design
dotnet add Tests package NSubstitute
```

### Struttura del progetto

![Flusso di una richiesta in MagazzinoLite](magazzinolite-flow.png)

```
MagazzinoLite/
├── Domain/
│   ├── Prodotto.cs
│   ├── Ordine.cs
│   ├── Denaro.cs
│   └── IProdottoRepository.cs
├── Application/
│   ├── OrdineService.cs
│   └── Dto/
├── Infrastructure/
│   ├── MagazzinoContext.cs
│   └── ProdottoRepository.cs
├── Api/
│   └── Program.cs
└── Tests/
    └── OrdineServiceTests.cs
```

### Step 1: Domain — entità e value object

```csharp
// Domain/Prodotto.cs
public class Prodotto
{
    public int Id { get; set; }
    public string Nome { get; set; } = "";
    public decimal Prezzo { get; set; }
}

// Domain/Denaro.cs
public record Denaro(decimal Importo, string Valuta = "EUR")
{
    public static Denaro operator +(Denaro a, Denaro b) => a with { Importo = a.Importo + b.Importo };
}

// Domain/Ordine.cs
public class Ordine
{
    public int Id { get; set; }
    public int ProdottoId { get; set; }
    public int Quantita { get; set; }
    public decimal PrezzoUnitario { get; set; }

    public Denaro Totale() => new(PrezzoUnitario * Quantita);
}

// Domain/IProdottoRepository.cs
public interface IProdottoRepository
{
    Task<List<Prodotto>> GetAllAsync();
    Task<Prodotto?> GetByIdAsync(int id);
    Task AddAsync(Prodotto prodotto);
}

// Domain/IOrdineRepository.cs
public interface IOrdineRepository
{
    Task<Ordine?> GetByIdAsync(int id);
    Task AddAsync(Ordine ordine);
}
```

### Step 2: Infrastructure — EF Core

```csharp
// Infrastructure/MagazzinoContext.cs
public class MagazzinoContext(DbContextOptions<MagazzinoContext> options) : DbContext(options)
{
    public DbSet<Prodotto> Prodotti => Set<Prodotto>();
    public DbSet<Ordine> Ordini => Set<Ordine>();
}

// Infrastructure/ProdottoRepository.cs
public class ProdottoRepository(MagazzinoContext db) : IProdottoRepository
{
    public Task<List<Prodotto>> GetAllAsync() => db.Prodotti.AsNoTracking().ToListAsync();
    public Task<Prodotto?> GetByIdAsync(int id) => db.Prodotti.FindAsync(id).AsTask();

    public async Task AddAsync(Prodotto prodotto)
    {
        db.Prodotti.Add(prodotto);
        await db.SaveChangesAsync();
    }
}

// Infrastructure/OrdineRepository.cs
public class OrdineRepository(MagazzinoContext db) : IOrdineRepository
{
    public Task<Ordine?> GetByIdAsync(int id) => db.Ordini.FindAsync(id).AsTask();

    public async Task AddAsync(Ordine ordine)
    {
        db.Ordini.Add(ordine);
        await db.SaveChangesAsync();
    }
}
```

### Step 3: Application — il servizio con la logica di business

```csharp
// Application/Dto/OrdineDto.cs
public record CreaOrdineDto(int ProdottoId, int Quantita);
public record OrdineDto(int Id, string ProdottoNome, int Quantita, decimal Totale);

// Application/OrdineService.cs
public class OrdineService(IProdottoRepository prodotti, IOrdineRepository ordini)
{
    public async Task<OrdineDto> CreaOrdineAsync(CreaOrdineDto dto)
    {
        if (dto.Quantita <= 0)
            throw new ArgumentException("La quantità deve essere positiva");

        var prodotto = await prodotti.GetByIdAsync(dto.ProdottoId)
            ?? throw new InvalidOperationException("Prodotto non trovato");

        var ordine = new Ordine
        {
            ProdottoId = prodotto.Id,
            Quantita = dto.Quantita,
            PrezzoUnitario = prodotto.Prezzo
        };

        await ordini.AddAsync(ordine);

        return new OrdineDto(ordine.Id, prodotto.Nome, ordine.Quantita, ordine.Totale().Importo);
    }
}
```

Nota come `OrdineService` non sa nulla di SQLite, di HTTP, o di EF Core — dipende solo da interfacce definite nel `Domain`. Questo è esattamente ciò che rende il servizio testabile in isolamento (Step 6) e il database sostituibile senza toccare una riga di logica di business.

### Step 4: Api — Minimal API

```csharp
// Api/Program.cs
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<MagazzinoContext>(opt => opt.UseSqlite("Data Source=magazzino.db"));
builder.Services.AddScoped<IProdottoRepository, ProdottoRepository>();
builder.Services.AddScoped<IOrdineRepository, OrdineRepository>();
builder.Services.AddScoped<OrdineService>();
builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapGet("/api/prodotti", async (IProdottoRepository repo) => Results.Ok(await repo.GetAllAsync()));

app.MapPost("/api/prodotti", async (Prodotto prodotto, IProdottoRepository repo) =>
{
    await repo.AddAsync(prodotto);
    return Results.Created($"/api/prodotti/{prodotto.Id}", prodotto);
});

app.MapPost("/api/ordini", async (CreaOrdineDto dto, OrdineService service) =>
{
    try
    {
        var ordine = await service.CreaOrdineAsync(dto);
        return Results.Created($"/api/ordini/{ordine.Id}", ordine);
    }
    catch (InvalidOperationException ex)
    {
        return Results.NotFound(new { errore = ex.Message });
    }
    catch (ArgumentException ex)
    {
        return Results.BadRequest(new { errore = ex.Message });
    }
});

app.Run();
```

### Step 5: la migrazione del database

```bash
dotnet ef migrations add InitialCreate --project Infrastructure --startup-project Api
dotnet ef database update --project Infrastructure --startup-project Api
```

### Step 6: test del servizio con xUnit

```csharp
// Tests/OrdineServiceTests.cs
using NSubstitute;
using Xunit;

public class OrdineServiceTests
{
    [Fact]
    public async Task CreaOrdineAsync_ConProdottoValido_RestituisceIlTotaleCorretto()
    {
        // Arrange
        var prodottiRepo = Substitute.For<IProdottoRepository>();
        var ordiniRepo = Substitute.For<IOrdineRepository>();

        prodottiRepo.GetByIdAsync(1).Returns(new Prodotto { Id = 1, Nome = "Tastiera", Prezzo = 50m });

        var service = new OrdineService(prodottiRepo, ordiniRepo);

        // Act
        var risultato = await service.CreaOrdineAsync(new CreaOrdineDto(ProdottoId: 1, Quantita: 3));

        // Assert
        Assert.Equal(150m, risultato.Totale);
        Assert.Equal("Tastiera", risultato.ProdottoNome);
        await ordiniRepo.Received(1).AddAsync(Arg.Any<Ordine>());
    }

    [Fact]
    public async Task CreaOrdineAsync_ConProdottoInesistente_LanciaEccezione()
    {
        var prodottiRepo = Substitute.For<IProdottoRepository>();
        var ordiniRepo = Substitute.For<IOrdineRepository>();

        prodottiRepo.GetByIdAsync(99).Returns((Prodotto?)null);

        var service = new OrdineService(prodottiRepo, ordiniRepo);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.CreaOrdineAsync(new CreaOrdineDto(ProdottoId: 99, Quantita: 1)));
    }
}
```

### Avvia e prova

```bash
cd Api
dotnet watch run

# in un altro terminale
curl -X POST http://localhost:5000/api/prodotti \
  -H "Content-Type: application/json" \
  -d '{"nome": "Tastiera meccanica", "prezzo": 89.90}'

curl -X POST http://localhost:5000/api/ordini \
  -H "Content-Type: application/json" \
  -d '{"prodottoId": 1, "quantita": 3}'

curl http://localhost:5000/api/prodotti
```

### Concetti applicati

- **Sezione 2**: `record` per i DTO (`CreaOrdineDto`, `OrdineDto`), primary constructor per l'injection nei repository
- **Sezione 3**: `DbContext`, `DbSet`, migrazioni, `AsNoTracking()` per le query di sola lettura
- **Sezione 4**: interfacce (`IProdottoRepository`, `IOrdineRepository`) invece di dipendenze concrete
- **Sezione 5**: separazione Domain / Application / Infrastructure / Api, con le dipendenze che puntano verso l'interno
- **Sezione 6**: `OrdineService` testato in isolamento con repository finti (NSubstitute)
- **Sezione 8**: ogni operazione I/O è `async`/`await` dalla cima alla base
- **Sezione 9**: Minimal API, Dependency Injection nativa, status code onesti (`201`, `404`, `400`)

---

## 🎉 Ce l'hai fatta!

Hai completato **.NET Pragmatic Approach**. Ora sai:

- Cos'è .NET oggi, com'è arrivato fin qui, e cosa porta di nuovo .NET 10 (LTS, C# 14)
- I concetti fondamentali di C#: `var`, value type vs reference type, nullable reference types, record, pattern matching, LINQ
- Come usare Entity Framework Core per parlare con un database senza scrivere SQL a mano, evitando la trappola N+1
- OOP pragmatico: interfacce, composizione invece di ereditarietà profonda, SOLID come euristica non come dogma
- Clean Code, Clean Architecture (Domain → Application → Infrastructure → Api) e le basi del DDD
- TDD con xUnit: Red-Green-Refactor, Arrange-Act-Assert, mocking dei confini del sistema
- Gli strumenti quotidiani: `dotnet` CLI, NuGet, `dotnet format`, gli editor più usati
- Programmazione asincrona: `async`/`await`, `Task`, `CancellationToken`, esecuzione in parallelo
- Come costruire API moderne con le Minimal API e la Dependency Injection nativa
- Come mettere tutto insieme in **MagazzinoLite**, un mini-gestionale reale, dal `dotnet new` al primo `curl`

**Dove andare ora?**

- 📖 [.NET Docs ufficiali](https://learn.microsoft.com/it-it/dotnet/) — la documentazione ufficiale Microsoft, in italiano
- 🧪 [xUnit Docs](https://xunit.net) — approfondisci matcher, fixture condivise, e test di integrazione
- 📘 *Clean Architecture* di Robert C. Martin — il libro di riferimento per la separazione in livelli
- 🗃️ [EF Core Docs](https://learn.microsoft.com/it-it/ef/core/) — query avanzate, performance, provider diversi da SQLite
- 💎 [Ruby on Rails: Applicazioni Professionali](/it/playbook/rails) — confronta lo stesso problema (costruire un'app web robusta) risolto con un framework "convention over configuration"

> 🧠 **L'ultimo consiglio**: .NET non ti chiede di essere dogmatico. Usa le interfacce dove servono, non ovunque. Usa i pattern quando risolvono un problema reale, non per esercizio di stile. La disciplina pragmatica — pochi livelli chiari, test che contano, codice che si legge da solo — batte sempre l'architettura "perfetta" che nessuno riesce più a modificare. Buon coding! 🟣
