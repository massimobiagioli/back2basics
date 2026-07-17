# Booting Spring Boot — Java Edition

Se l'ultima volta che hai scritto Java è stato a scuola, o se il tuo ricordo di Java è "tante `{ }`, tanti `getter`/`setter`, e un file XML infinito chiamato `web.xml`", questo playbook è per te. Il Java del 2006 — verboso, cerimonioso, con framework che richiedevano più configurazione che codice — non esiste più da anni. Il Java di oggi ha `record`, `var`, pattern matching, stream, e un framework, **Spring Boot**, che ti fa avere un server HTTP funzionante in meno tempo di quanto impieghi a leggere questa frase.

Spring Boot non è "Spring con meno lavoro": è la risposta pragmatica a un problema reale. Spring (il framework, nato nel 2003) era potentissimo ma affogava chiunque in XML e configurazione manuale. Nel 2014 Pivotal lanciò **Spring Boot**: stesso motore sotto il cofano, ma con **auto-configurazione intelligente**, un server embedded, e la filosofia "convention over configuration" — fai andare le cose con sensati default, e lasciaci personalizzare solo quello che conta davvero.

Questo playbook parte dalle basi — Java moderno, i concetti cardine del framework — e arriva a un progetto completo e funzionante: **PizzaHub**, una piccola app di gestione ordini per una pizzeria, con una vista web (Thymeleaf), una API REST, un database vero, configurazioni per ambiente, e sicurezza. Niente `any`, niente scorciatoie pericolose: solo quello che serve, spiegato bene, con la stessa cura sia che tu abbia 12 anni e la tua prima curiosità per la programmazione, sia che tu debba spedire codice vero in produzione domani mattina.

---

## 1. Modern Java, Modern OOP — non siamo più nel 2006

**In pillole**: Java è cambiato più negli ultimi 10 anni che nei 20 precedenti. Da Java 8 (2014) in poi il linguaggio ha adottato programmazione funzionale, inferenza dei tipi, ha smesso di obbligarti a scrivere boilerplate per ogni piccola cosa, e dal 2017 rilascia una nuova versione **ogni sei mesi**, con una LTS (Long Term Support) ogni due anni circa.

### Una breve storia, perché aiuta a capire il "perché"

Java nasce nel 1995 con una promessa precisa: *"write once, run anywhere"* — scrivi una volta, il bytecode gira su qualunque macchina che abbia una JVM (Java Virtual Machine). È stata una rivoluzione, ed è tuttora il motivo per cui Java è ovunque: banche, sistemi enterprise, Android (con una JVM alternativa), sistemi embedded. Ma per anni Java è rimasto **rigidamente object-oriented e verboso**: ogni cosa doveva essere una classe, ogni valore aveva bisogno di `getter`/`setter` scritti a mano, e le collezioni si iteravano con cicli `for` espliciti.

🧠 **Analogia**: immagina di dover scrivere una lettera formale in un ufficio del 1995: intestazione obbligatoria, formule di cortesia fisse, ogni frase costruita secondo un modello rigido. Il Java "vecchio stile" era così: per dire "prendi questa lista di numeri pari e raddoppiali" servivano 8 righe di ciclo e variabili di appoggio. Il Java moderno è come mandare un messaggio chiaro e diretto: dici cosa vuoi, non come ottenerlo passo passo.

```java
// Java "2006": verboso, imperativo, pieno di boilerplate
List<Integer> numeri = Arrays.asList(1, 2, 3, 4, 5, 6);
List<Integer> risultato = new ArrayList<Integer>();
for (int i = 0; i < numeri.size(); i++) {
    Integer n = numeri.get(i);
    if (n % 2 == 0) {
        risultato.add(n * 2);
    }
}

// Java moderno (17+): dichiarativo, con Stream
List<Integer> risultato = numeri.stream()
    .filter(n -> n % 2 == 0)
    .map(n -> n * 2)
    .toList();
```

### `var`: inferenza dei tipi, non tipizzazione dinamica

```java
var nome = "Ada";          // il compilatore INFERISCE String, resta statico per sempre
var eta = 36;                 // int
var lista = new ArrayList<String>();   // ArrayList<String>, non serve ripeterlo due volte

// eta = "trentasei";  ❌ non compila: eta è int, sempre
```

> 🧠 **La regola d'oro**: `var` non rende Java "come Python". Il tipo è deciso una volta per tutte dal compilatore in base a cosa assegni, e non cambia mai — toglie solo la ripetizione inutile (`ArrayList<String> lista = new ArrayList<String>()` diventa `var lista = new ArrayList<String>()`).

### `record`: basta boilerplate per i dati

Prima di Java 16, rappresentare "un semplice dato" (due coordinate, un prezzo con valuta) richiedeva una classe intera: campi privati, costruttore, getter, `equals()`, `hashCode()`, `toString()` — spesso 40 righe per dire "questi due valori insieme".

```java
// Java "2006": una classe-dato scritta a mano
public class Punto {
    private final int x;
    private final int y;

    public Punto(int x, int y) {
        this.x = x;
        this.y = y;
    }

    public int getX() { return x; }
    public int getY() { return y; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Punto)) return false;
        Punto p = (Punto) o;
        return x == p.x && y == p.y;
    }

    @Override
    public int hashCode() { return Objects.hash(x, y); }

    @Override
    public String toString() { return "Punto[x=" + x + ", y=" + y + "]"; }
}

// Java moderno (16+): la stessa cosa, in una riga
public record Punto(int x, int y) {}
```

```java
var p1 = new Punto(1, 2);
var p2 = new Punto(1, 2);
System.out.println(p1.equals(p2));   // true — confronto per VALORE, generato gratis
System.out.println(p1.x());          // 1 — getter generato, senza il prefisso "get"
```

Un `record` è **immutabile per costruzione** (i campi sono `final`, niente `setX()`), ed è la scelta di default per DTO, Value Object, e qualunque dato che rappresenta "un valore" più che "un'entità che cambia nel tempo" — lo stesso concetto che useremo per i DTO nella sezione 9.

### Pattern matching: `switch` che ragiona sui tipi

```java
Object valore = 42;

String descrizione = switch (valore) {
    case Integer n when n < 0 -> "negativo";
    case Integer n when n == 0 -> "zero";
    case Integer n -> "positivo: " + n;
    case String s -> "è una stringa: " + s;
    default -> "boh";
};

// pattern matching su record: "destruttura" i dati in un colpo solo
record Pizza(String nome, double prezzo) {}

Object o = new Pizza("Margherita", 6.50);
if (o instanceof Pizza(String nome, double prezzo) && prezzo < 10) {
    System.out.println(nome + " costa poco: " + prezzo);
}
```

### Interfacce, classi astratte, e "favor composition over inheritance"

Questo principio del Gang of Four vale in Java quanto in ogni altro linguaggio OOP: preferisci **comporre comportamenti** piuttosto che costruire gerarchie di ereditarietà profonde e fragili.

```java
// ❌ ereditarietà che "mente": un pinguino È un uccello, ma non vola
class Uccello { void vola() { System.out.println("Volo!"); } }
class Pinguino extends Uccello {
    @Override
    void vola() { throw new UnsupportedOperationException(); }
}

// ✅ composizione: componi il comportamento, non la genealogia
interface Movimento { void muoviti(); }

class Volo implements Movimento {
    public void muoviti() { System.out.println("Volo!"); }
}
class Nuoto implements Movimento {
    public void muoviti() { System.out.println("Nuoto!"); }
}

class Animale {
    private final String nome;
    private final Movimento movimento;

    Animale(String nome, Movimento movimento) {
        this.nome = nome;
        this.movimento = movimento;
    }

    void muoviti() { movimento.muoviti(); }
}

var pinguino = new Animale("Pingu", new Nuoto());
var aquila = new Animale("Aquila", new Volo());
```

> 🧠 **La regola d'oro**: parti sempre da un'interfaccia piccola e mirata. Aggiungi ereditarietà (`extends`) solo quando due classi condividono davvero la stessa identità concettuale, non solo un pezzo di codice comodo da riusare.

### `Optional`: basta `NullPointerException` a sorpresa

```java
// ❌ può esplodere in produzione, a chilometri da dove il null è nato
Pizza pizza = trovaPizza(id);
System.out.println(pizza.nome());   // NullPointerException se pizza è null

// ✅ Optional obbliga a decidere ESPLICITAMENTE cosa fare se manca
Optional<Pizza> pizza = trovaPizza(id);
String nome = pizza.map(Pizza::nome).orElse("Pizza non trovata");

pizza.ifPresentOrElse(
    p -> System.out.println("Trovata: " + p.nome()),
    () -> System.out.println("Nessuna pizza con questo id")
);
```

> 💡 **Tip**: `Optional` è pensato per i **valori di ritorno**, non per i campi di una classe o i parametri di un metodo — usarlo ovunque è tanto quanto sbagliato quanto non usarlo mai. La userai spessissimo con Spring Data JPA (sezione 7), dove `findById()` restituisce esattamente un `Optional<T>`.

### Virtual Thread (Java 21): concorrenza senza il dolore dei thread pool

Da Java 21, il **Project Loom** ha introdotto i *virtual thread*: migliaia di thread "leggeri" gestiti dalla JVM, che permettono di scrivere codice bloccante e leggibile (niente callback, niente `CompletableFuture` a cascata) mantenendo comunque un'alta scalabilità — utilissimo per applicazioni web I/O-bound come quelle che scriverai con Spring Boot.

```java
// prima di Java 21: un thread pool limitato, ogni thread è "pesante" (costa ~1MB di stack)
ExecutorService pool = Executors.newFixedThreadPool(200);

// Java 21+: virtual thread, leggerissimi — puoi crearne milioni senza esaurire memoria
ExecutorService pool = Executors.newVirtualThreadPerTaskExecutor();
```

Spring Boot 3.2+ supporta i virtual thread con una singola riga di configurazione (`spring.threads.virtual.enabled=true`) — la vedremo nella sezione 8.

---

## 2. Spring Boot: i concetti di base

**In pillole**: Spring Boot poggia su due idee cardine che vengono dal framework Spring originale — **Inversion of Control** (IoC) e **Dependency Injection** (DI) — più una terza idea, tutta sua, che le rende pratiche da usare davvero: l'**auto-configurazione**.

### Inversion of Control: chi comanda, chi obbedisce

Nel codice "normale", sei tu a creare i tuoi oggetti e le loro dipendenze:

```java
// tu controlli tutto, a mano: crei l'oggetto e le sue dipendenze
PizzaRepository repository = new PizzaRepositoryJpa(entityManager);
OrdineService service = new OrdineService(repository);
```

Con **Inversion of Control**, questo controllo si "inverte": non sei più tu a costruire gli oggetti e collegarli — è un **container** (l'*ApplicationContext* di Spring) a farlo per te, in base a delle regole che tu dichiari.

🧠 **Analogia**: pensa a una cucina di un ristorante. Senza IoC, sei **tu** lo chef che va in dispensa, prende ogni singolo ingrediente, e li assembla a mano ogni volta che serve un piatto. Con IoC, esiste un **magazziniere automatico** (il container Spring): tu gli dici "questo piatto ha bisogno di farina, pomodoro e mozzarella" (le dipendenze dichiarate), e lui te li porta già pronti al bancone, senza che tu debba mai andare a cercarli in dispensa.

### Dependency Injection: come le dipendenze arrivano

```java
@Service
public class OrdineService {

    private final PizzaRepository pizzaRepository;

    // constructor injection: Spring vede che OrdineService ha bisogno
    // di un PizzaRepository, e glielo passa da solo, al momento della creazione
    public OrdineService(PizzaRepository pizzaRepository) {
        this.pizzaRepository = pizzaRepository;
    }
}
```

Non scrivi mai `new OrdineService(...)` in giro per il codice: Spring crea l'istanza, capisce di cosa ha bisogno guardando il costruttore, e gliela inietta automaticamente. Questo si chiama **constructor injection**, ed è il modo raccomandato — preferibile a `@Autowired` su un campo, perché rende le dipendenze esplicite, obbligatorie, e testabili senza dover avviare Spring nei test (lo vedremo nella sezione 10).

```java
// ❌ field injection: funziona, ma nasconde le dipendenze e complica i test
@Service
public class OrdineService {
    @Autowired
    private PizzaRepository pizzaRepository;
}

// ✅ constructor injection: dipendenze esplicite, oggetto sempre in uno stato valido
@Service
public class OrdineService {
    private final PizzaRepository pizzaRepository;

    public OrdineService(PizzaRepository pizzaRepository) {
        this.pizzaRepository = pizzaRepository;
    }
}
```

### I "bean" e le annotazioni stereotipo

Un **bean** è semplicemente "un oggetto gestito dal container Spring". Per dire a Spring "questa classe deve diventare un bean", la marchi con un'annotazione **stereotipo**:

| Annotazione | Significato | Dove la userai |
|---|---|---|
| `@Component` | Un bean generico, nessun ruolo specifico | Utility, servizi trasversali |
| `@Service` | Un bean che contiene logica di business | `OrdineService` (sezione 10) |
| `@Repository` | Un bean che parla con la persistenza | Interfacce Spring Data JPA (sezione 7) |
| `@Controller` | Un bean che gestisce richieste web e restituisce **viste HTML** | Controller Thymeleaf (sezione 6) |
| `@RestController` | Come `@Controller`, ma restituisce **dati** (JSON), non viste | API REST (sezione 9) |

Sono tutte specializzazioni di `@Component` — usarle con il nome giusto non cambia il comportamento tecnico, ma comunica chiaramente **il ruolo** della classe a chi legge il codice: è documentazione che il compilatore controlla per te.

### Auto-configurazione: la vera differenza rispetto a Spring "classico"

Spring (senza "Boot") richiedeva di configurare a mano ogni pezzo: il server, il datasource, il motore di template. Spring Boot osserva **cosa hai nel classpath** (quali librerie hai aggiunto come dipendenza) e configura automaticamente i bean sensati di default.

```java
// Aggiungi questa dipendenza al progetto (sezione 3/4):
// spring-boot-starter-data-jpa

// Spring Boot vede: "c'è Hibernate nel classpath, c'è un DataSource configurato"
// → configura automaticamente EntityManager, TransactionManager, e altro,
//   SENZA che tu debba scrivere una riga di configurazione XML o Java
```

🧠 **Analogia**: è come comprare un mobile componibile con le istruzioni già "intelligenti" — se nella scatola trovi le viti per il ripiano in vetro, il mobile si monta automaticamente pensato per il vetro; se trovi quelle per il legno, si adatta da solo. Non devi dire tu ogni singolo dettaglio: il sistema **osserva cosa hai** e si comporta di conseguenza.

### `@SpringBootApplication`: tre annotazioni in una

```java
@SpringBootApplication
public class PizzaHubApplication {
    public static void main(String[] args) {
        SpringApplication.run(PizzaHubApplication.class, args);
    }
}
```

`@SpringBootApplication` è in realtà una scorciatoia per tre annotazioni insieme:

| Annotazione | Cosa fa |
|---|---|
| `@Configuration` | Questa classe può dichiarare bean |
| `@EnableAutoConfiguration` | Attiva l'auto-configurazione descritta sopra |
| `@ComponentScan` | Cerca automaticamente `@Component`, `@Service`, `@Repository`, `@Controller` in questo package e nei sotto-package |

> 🧠 **La regola d'oro**: la classe con `@SpringBootApplication` deve stare nel package **radice** del progetto (es. `com.pizzahub`), non in un sotto-package — altrimenti il `@ComponentScan` non troverà i bean che hai scritto altrove.

---

## 3. Spring Initializr: il punto di partenza

**In pillole**: [start.spring.io](https://start.spring.io) è il generatore ufficiale di progetti Spring Boot. Scegli linguaggio, versione, build tool e dipendenze, scarichi uno zip già pronto — nessun progetto Spring dovrebbe mai iniziare da un file vuoto scritto a mano.

### Cosa scegliere, e perché

| Campo | Cosa scegliere per un progetto nuovo | Perché |
|---|---|---|
| **Project** | Maven o Gradle | Vedi sezione 4 per la scelta pragmatica |
| **Language** | Java | Kotlin è un'alternativa valida, ma restiamo su Java in questo playbook |
| **Spring Boot** | L'ultima versione **stabile**, non la prima della lista se è marcata *SNAPSHOT* o *M1/RC* | Le snapshot sono build di sviluppo, non per progetti veri |
| **Java** | 21 (LTS) | Ultima Long Term Support: supporto più lungo, virtual thread inclusi (sezione 1) |
| **Packaging** | Jar | Un jar eseguibile con server embedded — niente Tomcat esterno da installare (vedi sotto) |

### Le dipendenze per PizzaHub

Nella sezione "Add Dependencies" del sito, cerchiamo e aggiungiamo:

- **Spring Web** — per costruire API REST e ricevere richieste HTTP (`spring-boot-starter-web`, include un server Tomcat **embedded**: nessuna installazione separata)
- **Spring Data JPA** — per parlare con il database senza scrivere SQL a mano (sezione 7)
- **Thymeleaf** — il motore di template per le viste HTML (sezione 6)
- **H2 Database** — un database in-memory, perfetto per sviluppo e test, zero installazione
- **Spring Security** — autenticazione e autorizzazione (sezione 9)
- **Spring Boot DevTools** — riavvio automatico dell'app a ogni modifica salvata, come `nodemon` per Node.js

> 💡 **Tip**: non aggiungere "tutto quello che potrebbe servire". Ogni starter aggiunge dipendenze transitive, tempo di avvio, e superficie da mantenere. Aggiungi solo ciò che il progetto usa **oggi** — è lo stesso principio YAGNI che ritroveremo nella sezione 5.

### Cosa genera lo zip

```
pizzahub/
├── pom.xml                                    ← le dipendenze e la configurazione di build (sezione 4)
├── mvnw, mvnw.cmd                              ← Maven Wrapper: non serve avere Maven installato sulla macchina
├── src/
│   ├── main/
│   │   ├── java/com/pizzahub/
│   │   │   └── PizzaHubApplication.java        ← il punto di ingresso, con @SpringBootApplication
│   │   └── resources/
│   │       ├── application.properties           ← configurazione dell'app (sezione 8)
│   │       ├── static/                            ← file serviti direttamente (CSS, immagini)
│   │       └── templates/                          ← le viste Thymeleaf (sezione 6)
│   └── test/
│       └── java/com/pizzahub/
│           └── PizzaHubApplicationTests.java     ← un test "smoke": verifica che il contesto si avvii
└── .gitignore                                       ← già configurato per un progetto Java/Maven
```

Il **Maven Wrapper** (`mvnw`/`mvnw.cmd`) merita una nota: è uno script che scarica ed esegue la versione esatta di Maven dichiarata dal progetto, senza che tu debba installarla globalmente sulla macchina — lo stesso ruolo che `./gradlew` gioca per Gradle. Usa sempre `./mvnw` invece di `mvn` per essere sicuro che tutti nel team (e la CI) usino la stessa identica versione.

```bash
./mvnw spring-boot:run     # avvia l'app, usando la versione di Maven del progetto
```

### CLI vs interfaccia web

Se preferisci restare da terminale, IntelliJ IDEA e VS Code (con l'estensione "Spring Boot Extension Pack") integrano Spring Initializr direttamente nella creazione di un nuovo progetto — stessa identica generazione, senza aprire il browser.

---

## 4. Maven vs Gradle: due approcci differenti

**In pillole**: entrambi fanno la stessa cosa — gestire dipendenze e orchestrare la build — ma con filosofie opposte. Maven è **dichiarativo e rigido** (un file XML che descrive *cosa* vuoi); Gradle è **programmabile e flessibile** (uno script Groovy o Kotlin che descrive anche *come*).

### `pom.xml`: dichiarativo, prevedibile

```xml
<!-- pom.xml -->
<project>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.3.0</version>
    </parent>

    <groupId>com.pizzahub</groupId>
    <artifactId>pizzahub</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
</project>
```

Nota il `<parent>spring-boot-starter-parent</parent>`: è quello che fissa **automaticamente** le versioni compatibili di tutte le dipendenze Spring, così non devi mai chiederti "quale versione di Jackson va bene con questa versione di Spring Web?" — Maven lo sa già.

### `build.gradle.kts`: programmabile, conciso

```kotlin
// build.gradle.kts
plugins {
    java
    id("org.springframework.boot") version "3.3.0"
    id("io.spring.dependency-management") version "1.1.5"
}

group = "com.pizzahub"
version = "0.0.1-SNAPSHOT"

java {
    sourceCompatibility = JavaVersion.VERSION_21
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
}
```

### Il confronto pragmatico

| | Maven | Gradle |
|---|---|---|
| Formato | XML, dichiarativo | Groovy o Kotlin DSL, programmabile |
| Velocità di build | Più lenta su progetti grandi | Build incrementali e cache — spesso più veloce |
| Curva di apprendimento | Più semplice da leggere per chi inizia | Più potente, ma serve capire lo script |
| Convenzione | Fortissima, poca flessibilità | Flessibile, puoi scrivere logica di build arbitraria |
| Diffusione enterprise | Ancora leggermente maggioritario | In crescita, standard per Android |
| Comando | `./mvnw clean install` | `./gradlew build` |

> 🧠 **La regola d'oro pragmatica**: se sei nuovo a Spring, o lavori in un team enterprise "tradizionale", **Maven**: XML verboso, ma leggibile da chiunque a colpo d'occhio, zero sorprese. Se il progetto ha bisogno di build personalizzate, moduli multipli complessi, o il team viene già da Android/Kotlin, **Gradle**: più investimento iniziale, ma build più veloci e più espressive. Non esiste una risposta sbagliata: sono due strade diverse verso lo stesso risultato — questo playbook usa Maven negli esempi perché è la scelta di default di Spring Initializr.

### I comandi che userai ogni giorno

```bash
./mvnw spring-boot:run       # avvia l'applicazione
./mvnw test                     # esegue i test
./mvnw clean package              # compila e crea il jar eseguibile in target/
./mvnw dependency:tree               # mostra l'albero delle dipendenze (utile per debug di conflitti)

# equivalenti Gradle
./gradlew bootRun
./gradlew test
./gradlew build
./gradlew dependencies
```

---

## 5. Clean Code, Clean Architecture

**In pillole**: codice pulito in Java significa nomi onesti, metodi piccoli, e classi con una sola ragione per cambiare. Clean Architecture organizza il progetto in livelli con una regola sola: **le dipendenze puntano sempre verso l'interno**, verso il dominio.

### Clean Code, in pratica

```java
// ❌ nome bugiardo, metodo che fa troppo
public List<Integer> processaDati(List<Integer> d) {
    List<Integer> r = new ArrayList<>();
    for (Integer x : d) {
        if (x > 0) r.add(x * 2);
    }
    return r;
    // ...altre 40 righe...
}

// ✅ nome onesto, una sola responsabilità
public List<Integer> raddoppiaValoriPositivi(List<Integer> numeri) {
    return numeri.stream()
        .filter(n -> n > 0)
        .map(n -> n * 2)
        .toList();
}
```

```java
// ❌ il commento ripete quello che il codice dice già
// controlla se l'ordine è valido
if (ordine.getTotale() > 0 && !ordine.getRighe().isEmpty()) { }

// ✅ un metodo con nome onesto elimina il bisogno del commento
if (ordine.eValido()) { }
```

> 💡 **Tip**: se devi scrivere un commento per spiegare COSA fa una riga, il problema è nel naming, non nella documentazione mancante. Riserva i commenti al PERCHÉ ("// usiamo UTC qui perché il fornitore esterno lo richiede"), mai al COSA.

### I quattro livelli, applicati a Spring Boot

A differenza di stack dove Clean Architecture si traduce in progetti/moduli separati, in un tipico progetto Spring Boot i livelli sono **package**, dentro lo stesso modulo Maven/Gradle — più semplice da gestire per progetti di dimensione piccola-media, con la stessa disciplina di dipendenza.

```
com.pizzahub/
├── domain/            ← nucleo: entità, value object, interfacce repository. ZERO dipendenze da Spring
├── application/        ← service, use case, DTO. Dipende solo da domain
├── infrastructure/       ← implementazioni Spring Data JPA, client esterni. Implementa le interfacce di domain
└── web/                    ← controller MVC e REST. Il punto di ingresso, assemblato via Dependency Injection
```

![Clean Architecture in Spring Boot](spring-clean-architecture.png)

La **regola di dipendenza** non ha eccezioni: `domain` non conosce Spring, non conosce Hibernate, non conosce HTTP — è puro Java. `infrastructure` conosce `domain` (per implementarne le interfacce), ma `domain` non conosce mai `infrastructure`.

```java
// domain/PizzaRepository.java — l'interfaccia (il "port") vive nel dominio
public interface PizzaRepository {
    Optional<Pizza> trovaPerId(Long id);
    List<Pizza> tutte();
    Pizza salva(Pizza pizza);
}

// infrastructure/PizzaJpaRepository.java — l'implementazione vive fuori, e DIPENDE da domain
@Repository
public interface PizzaJpaRepository extends JpaRepository<Pizza, Long>, PizzaRepository {
    // Spring Data JPA genera l'implementazione a runtime — vedi sezione 7
}
```

Il vantaggio concreto: puoi testare tutta la logica in `application` **senza un database vero**, sostituendo `PizzaRepository` con un finto in-memory nei test (sezione 10). Puoi cambiare database — da H2 a PostgreSQL — toccando solo `infrastructure`.

### SOLID, con pragmatismo

| Principio | Versione da manuale | Versione pragmatica |
|---|---|---|
| **S**ingle Responsibility | Una classe ha una sola ragione per cambiare | Se il nome della classe contiene una "e" ("GestoreEValidatore"), spezzala |
| **O**pen/Closed | Aperta all'estensione, chiusa alla modifica | Interfacce solo dove sai che serviranno più implementazioni, non ovunque "per sicurezza" |
| **L**iskov Substitution | Una sottoclasse deve sostituire la base senza rompere nulla | Se `Pinguino extends Uccello` deve lanciare un'eccezione su `vola()`, l'ereditarietà è sbagliata (vedi sezione 1) |
| **I**nterface Segregation | Tante interfacce piccole, non una gigante | `PizzaRepository` con 20 metodi è un anti-pattern: dividi per responsabilità |
| **D**ependency Inversion | Dipendi da astrazioni, non da implementazioni concrete | `OrdineService` dipende da `PizzaRepository` (interfaccia), mai da `PizzaJpaRepository` direttamente |

> 🧠 **La regola d'oro**: SOLID non sono leggi fisiche, sono euristiche. Applicale quando risolvono un problema reale (codice difficile da testare, da estendere, da capire). Non applicarle "a priori" su un endpoint di health-check di tre righe — è overengineering, l'esatto opposto del pragmatismo.

### Modello anemico vs modello ricco

```java
// ❌ modello anemico: solo getter/setter, tutta la logica sparsa nei controller/service
public class Ordine {
    private Long id;
    private List<RigaOrdine> righe;
    // solo getter e setter, zero comportamento
}

// ✅ modello ricco: l'entità protegge le proprie regole
public class Ordine {
    private final List<RigaOrdine> righe = new ArrayList<>();

    public void aggiungiRiga(Pizza pizza, int quantita) {
        if (quantita <= 0) {
            throw new IllegalArgumentException("La quantità deve essere positiva");
        }
        righe.add(new RigaOrdine(pizza, quantita));
    }

    public BigDecimal totale() {
        return righe.stream()
            .map(RigaOrdine::subtotale)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
```

> 🧠 **La regola d'oro**: il "modello anemico" è l'anti-pattern più comune nel codice enterprise Java. Un modello ricco, come `Ordine` sopra, sa rispondere da solo a domande sul proprio stato (`totale()`) e protegge le proprie invarianti (`aggiungiRiga` rifiuta quantità negative). La logica di business vive dove vivono i dati che coinvolge, non sparsa nei controller.

---

## 6. Modern MVC (con Thymeleaf)

**In pillole**: **MVC** (Model-View-Controller) separa "i dati" (Model), "cosa l'utente vede" (View), e "chi decide cosa mostrare" (Controller). **Thymeleaf** è il motore di template moderno di Spring Boot: HTML **valido** anche prima di essere processato, con attributi speciali (`th:*`) che il server sostituisce con dati reali.

### `@Controller` vs `@RestController`

```java
// @Controller: restituisce il NOME di una vista HTML da renderizzare
@Controller
public class PizzaMvcController {

    private final PizzaService pizzaService;

    public PizzaMvcController(PizzaService pizzaService) {
        this.pizzaService = pizzaService;
    }

    @GetMapping("/pizze")
    public String elenco(Model model) {
        model.addAttribute("pizze", pizzaService.tutte());
        return "pizze";   // Spring cerca templates/pizze.html
    }
}

// @RestController: restituisce DATI (serializzati in JSON), non una vista
@RestController
@RequestMapping("/api/pizze")
public class PizzaRestController {

    private final PizzaService pizzaService;

    public PizzaRestController(PizzaService pizzaService) {
        this.pizzaService = pizzaService;
    }

    @GetMapping
    public List<PizzaDto> elenco() {
        return pizzaService.tutte();   // Spring serializza automaticamente in JSON
    }
}
```

> 🧠 **La regola d'oro**: `@RestController` è semplicemente `@Controller` + `@ResponseBody` su ogni metodo — dice a Spring "non cercare una vista, il valore di ritorno **è già** la risposta". Nella sezione 10 userai entrambi nello stesso progetto: `@Controller` per il pannello admin con Thymeleaf, `@RestController` per l'API pubblica.

### Thymeleaf: HTML che resta HTML

```html
<!-- templates/pizze.html -->
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <title>Le nostre pizze</title>
</head>
<body>
    <h1>Menu</h1>

    <ul>
        <li th:each="pizza : ${pizze}">
            <span th:text="${pizza.nome}">Nome pizza</span> —
            <span th:text="${pizza.prezzo} + ' €'">Prezzo</span>
        </li>
    </ul>

    <p th:if="${pizze.isEmpty()}">Nessuna pizza disponibile, torna più tardi!</p>

    <a th:href="@{/pizze/nuova}">Aggiungi una pizza</a>
</body>
</html>
```

Il punto chiave, ed è il motivo per cui Thymeleaf è considerato "moderno" rispetto a motori più vecchi (come JSP): questo file **è HTML valido**, apribile in un browser anche senza un server dietro — `th:text="${pizza.nome}"` viene semplicemente ignorato dal browser, mentre "Nome pizza" resta visibile come placeholder statico. Un designer può lavorare sul file senza dover far girare l'intera applicazione.

### I selettori Thymeleaf più usati

| Attributo | Cosa fa |
|---|---|
| `th:text="${valore}"` | Sostituisce il contenuto del tag con `valore` |
| `th:each="x : ${lista}"` | Ripete il tag per ogni elemento di `lista` |
| `th:if` / `th:unless` | Mostra il tag solo se la condizione è vera/falsa |
| `th:href="@{/percorso}"` | Genera un URL, gestendo automaticamente il context path |
| `th:object` + `th:field` | Collega un form a un oggetto Java (vedi sotto) |
| `th:fragment` | Definisce un pezzo di template riusabile (header, footer) |

### Form binding: dal browser a un oggetto Java

```html
<!-- templates/pizze/nuova.html -->
<form th:action="@{/pizze}" th:object="${nuovaPizza}" method="post">
    <input type="text" th:field="*{nome}" placeholder="Nome pizza" />
    <input type="number" th:field="*{prezzo}" step="0.01" />
    <button type="submit">Salva</button>
</form>
```

```java
@GetMapping("/pizze/nuova")
public String form(Model model) {
    model.addAttribute("nuovaPizza", new NuovaPizzaForm());
    return "pizze/nuova";
}

@PostMapping("/pizze")
public String crea(@ModelAttribute @Valid NuovaPizzaForm form, BindingResult errori) {
    if (errori.hasErrors()) {
        return "pizze/nuova";   // torna al form, mostrando gli errori di validazione
    }
    pizzaService.crea(form);
    return "redirect:/pizze";   // redirect dopo un POST riuscito: evita il doppio submit su refresh
}
```

> 💡 **Tip**: il `redirect:` dopo un `POST` non è un dettaglio stilistico — è il pattern **Post-Redirect-Get**: se l'utente preme F5 dopo aver salvato, il browser ripete l'ultima richiesta GET (innocua), non l'ultima POST (che altrimenti creerebbe due pizze identiche).

### Fragment: non ripetere header e footer ovunque

```html
<!-- templates/fragments/layout.html -->
<header th:fragment="header">
    <nav>PizzaHub</nav>
</header>
```

```html
<!-- templates/pizze.html -->
<div th:replace="~{fragments/layout :: header}"></div>
```

---

## 7. Accesso ai dati: facciamo chiarezza

**In pillole**: in Java esistono almeno tre livelli per parlare con un database, e la confusione su quale usare è comunissima. Dal più basso al più alto livello di astrazione: **JDBC** (il driver puro), **JPA/Hibernate** (l'ORM, lo standard + la sua implementazione più diffusa), **Spring Data JPA** (un livello sopra JPA che genera i repository per te).

### I tre livelli, in una tabella

| Strumento | Cos'è | Quanto codice scrivi | Quando ha senso |
|---|---|---|---|
| **JDBC** | L'API standard Java per parlare con un DB relazionale, a bassissimo livello | Tanto: apri connessioni, scrivi SQL, mappi `ResultSet` a mano | Query molto specifiche, massime prestazioni, controllo totale |
| **`JdbcTemplate`** | Un wrapper Spring su JDBC: gestisce connessioni e risorse per te | Meno: scrivi ancora SQL, ma niente boilerplate di apertura/chiusura | Query native performanti, senza tutta la cerimonia di JDBC puro |
| **JPA + Hibernate** | Lo **standard** Java per l'ORM (JPA è la specifica, Hibernate l'implementazione più usata) | Poco: scrivi entità annotate, Hibernate genera l'SQL | La maggioranza delle applicazioni CRUD-centriche |
| **Spring Data JPA** | Un livello sopra JPA: **genera l'implementazione dei repository da un'interfaccia** | Pochissimo: dichiari un'interfaccia, l'implementazione nasce da sola | Lo standard de facto in un progetto Spring Boot moderno |

🧠 **Analogia**: JDBC è come cucinare partendo dagli ingredienti grezzi, pesati a mano, seguendo una ricetta scritta in un linguaggio straniero (SQL). JPA/Hibernate è un robot da cucina programmabile: gli dici "questa è la forma della torta" (l'entità) e lui si occupa degli ingredienti e dei tempi di cottura (le query SQL). Spring Data JPA è lo stesso robot, ma con ricette pre-impostate per i piatti più comuni: gli basta il nome del piatto (`findByNome`) per sapere già cosa fare, senza che tu debba nemmeno programmarlo.

### L'entità JPA

```java
// domain/Pizza.java
@Entity
@Table(name = "pizze")
public class Pizza {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false)
    private BigDecimal prezzo;

    protected Pizza() {}   // richiesto da JPA, non usarlo direttamente nel tuo codice

    public Pizza(String nome, BigDecimal prezzo) {
        this.nome = nome;
        this.prezzo = prezzo;
    }

    public Long getId() { return id; }
    public String getNome() { return nome; }
    public BigDecimal getPrezzo() { return prezzo; }
}
```

### Spring Data JPA: un'interfaccia, zero implementazione

```java
// infrastructure/PizzaJpaRepository.java
public interface PizzaJpaRepository extends JpaRepository<Pizza, Long> {

    // il NOME del metodo è la query: Spring Data lo interpreta e genera l'SQL
    List<Pizza> findByNomeContainingIgnoreCase(String frammento);

    List<Pizza> findByPrezzoLessThan(BigDecimal prezzoMassimo);

    // per query più complesse, JPQL esplicito (simile a SQL, ma lavora su entità, non su tabelle)
    @Query("SELECT p FROM Pizza p WHERE p.prezzo BETWEEN :min AND :max ORDER BY p.prezzo")
    List<Pizza> trovaNellaFasciaDiPrezzo(@Param("min") BigDecimal min, @Param("max") BigDecimal max);
}
```

Estendendo `JpaRepository<Pizza, Long>` ottieni **gratis**, senza scrivere una riga: `save()`, `findById()`, `findAll()`, `deleteById()`, paginazione, ordinamento. Il resto — i metodi con nomi come `findByNomeContainingIgnoreCase` — viene generato da Spring Data **interpretando il nome del metodo** a runtime: non c'è magia nascosta, solo una convenzione di naming molto precisa che il framework sa leggere.

### Relazioni

```java
@Entity
public class Ordine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pizza_id")
    private Pizza pizza;

    private int quantita;
}
```

> 🧠 **La regola d'oro — il problema N+1**: `FetchType.LAZY` significa "carica questa relazione solo quando viene effettivamente letta". Comodo, ma pericoloso: se scorri 1.000 ordini e leggi `ordine.getPizza()` per ciascuno **fuori** da una query ottimizzata, Hibernate esegue 1.000 query separate — una per ordine. È il famoso **problema N+1**, la trappola di performance più comune con ogni ORM (lo stesso concetto vale per Entity Framework in .NET, Prisma in Node, ActiveRecord in Rails). La soluzione: usa `JOIN FETCH` in una query JPQL esplicita quando sai già che ti servirà la relazione.

```java
@Query("SELECT o FROM Ordine o JOIN FETCH o.pizza WHERE o.id = :id")
Optional<Ordine> trovaConPizza(@Param("id") Long id);
```

### Transazioni

```java
@Service
public class OrdineService {

    @Transactional   // o tutte le operazioni vanno a buon fine, o vengono annullate tutte
    public Ordine creaOrdine(CreaOrdineDto dto) {
        Pizza pizza = pizzaRepository.findById(dto.pizzaId())
            .orElseThrow(() -> new PizzaNonTrovataException(dto.pizzaId()));

        Ordine ordine = new Ordine(pizza, dto.quantita());
        return ordineRepository.save(ordine);
    }
}
```

`@Transactional` è quello che rende `creaOrdine()` **atomica**: se una qualunque operazione dentro il metodo fallisce (un'eccezione non gestita), Spring annulla (rollback) tutte le modifiche fatte fino a quel momento — mai un ordine "a metà" salvato nel database.

---

## 8. Configurazioni separate per environment: come fare?

**In pillole**: un'applicazione seria gira in almeno tre ambienti diversi — sviluppo (`dev`), test, produzione (`prod`) — ognuno con configurazioni proprie (database diverso, livelli di log diversi, credenziali diverse). Spring Boot gestisce questo con i **profili**.

### `application.yml` e i profili

```yaml
# src/main/resources/application.yml — configurazione condivisa da TUTTI gli ambienti
spring:
  application:
    name: pizzahub
  threads:
    virtual:
      enabled: true   # virtual thread (Java 21+, sezione 1) attivi di default

logging:
  level:
    root: INFO
```

```yaml
# src/main/resources/application-dev.yml — attiva solo quando il profilo "dev" è attivo
spring:
  datasource:
    url: jdbc:h2:mem:pizzahub
  h2:
    console:
      enabled: true   # dashboard web del database, su /h2-console — solo in sviluppo!
  jpa:
    hibernate:
      ddl-auto: update   # Hibernate aggiorna lo schema automaticamente, comodo in dev

logging:
  level:
    com.pizzahub: DEBUG
```

```yaml
# src/main/resources/application-prod.yml — attiva solo quando il profilo "prod" è attivo
spring:
  datasource:
    url: ${DATABASE_URL}          # letto da variabile d'ambiente, MAI hardcoded
    username: ${DATABASE_USER}
    password: ${DATABASE_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: validate   # in produzione NON si modifica lo schema automaticamente, solo si verifica

logging:
  level:
    com.pizzahub: WARN
```

> 🧠 **La regola d'oro**: `ddl-auto: update` è comodissimo in sviluppo e **pericolosissimo** in produzione — può alterare silenziosamente lo schema di un database vero. In produzione usa sempre `validate` (Hibernate controlla che lo schema combaci con le entità, senza toccarlo) e affida le modifiche reali a uno strumento di migrazione versionato come **Flyway** o **Liquibase**.

### Attivare un profilo

```bash
# da riga di comando
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# come variabile d'ambiente (il modo standard in produzione, es. dentro un container)
export SPRING_PROFILES_ACTIVE=prod
java -jar pizzahub.jar
```

```java
// oppure, condizionare un bean intero in base al profilo attivo
@Configuration
public class DevOnlyConfig {

    @Bean
    @Profile("dev")
    public CommandLineRunner datiDiProva(PizzaRepository repo) {
        return args -> {
            repo.save(new Pizza("Margherita", new BigDecimal("6.50")));
            repo.save(new Pizza("Diavola", new BigDecimal("8.00")));
        };
    }
}
```

### Il principio: configurazione esterna, mai hardcoded

```yaml
# ❌ credenziali scritte nel codice, finiscono in Git per sempre
spring:
  datasource:
    password: SuperSegreto123

# ✅ placeholder, valore letto dall'ambiente a runtime
spring:
  datasource:
    password: ${DATABASE_PASSWORD}
```

Questa è la **dodicesima regola** delle famose [Twelve-Factor App](https://12factor.net/it/config): la configurazione che cambia tra ambienti (credenziali, URL, feature flag) va **esternalizzata** — mai committata nel codice sorgente. In locale, uno strumento come [direnv](https://direnv.net/) o un file `.env` (mai committato, sempre in `.gitignore`) copre il caso di sviluppo; in produzione, variabili d'ambiente fornite dalla piattaforma di hosting o un vault dedicato (AWS Secrets Manager, HashiCorp Vault).

> 💡 **Tip**: `application.yml` è preferibile a `application.properties` quando la configurazione ha una struttura annidata (come qui sopra) — meno ripetizione, più leggibilità. Per configurazioni molto semplici, `.properties` resta comunque una scelta valida e ugualmente supportata.

---

## 9. API first, Security first

**In pillole**: "API first" significa progettare il contratto della tua API (risorse, verbi HTTP, formati) **prima** di scrivere l'implementazione, come fonte di verità condivisa col resto del team. "Security first" significa che la sicurezza non è un livello aggiunto alla fine, ma parte del disegno fin dal primo endpoint.

### Progettare risorse, non azioni

```
❌ GET  /getPizze
❌ POST /creaNuovaPizza
❌ POST /eliminaPizza?id=3

✅ GET    /api/pizze              lista tutte le pizze
✅ GET    /api/pizze/{id}         una pizza specifica
✅ POST   /api/pizze              crea una nuova pizza
✅ PUT    /api/pizze/{id}         sostituisce una pizza esistente
✅ DELETE /api/pizze/{id}         elimina una pizza
```

Il verbo HTTP (`GET`, `POST`, `PUT`, `DELETE`) dice già **l'azione** — il nome della risorsa (`/pizze`) deve restare un **sostantivo**, mai un verbo. Questo è il cuore di uno stile REST pulito.

### DTO, non entità, sul contratto pubblico

```java
// ❌ espone l'entità di dominio direttamente: cambiare una colonna rompe l'API pubblica
@GetMapping("/api/pizze/{id}")
public Pizza dettaglio(@PathVariable Long id) { ... }

// ✅ un DTO dedicato: il contratto dell'API è indipendente dallo schema del database
public record PizzaDto(Long id, String nome, BigDecimal prezzo) {
    public static PizzaDto da(Pizza pizza) {
        return new PizzaDto(pizza.getId(), pizza.getNome(), pizza.getPrezzo());
    }
}

@GetMapping("/api/pizze/{id}")
public PizzaDto dettaglio(@PathVariable Long id) {
    return PizzaDto.da(pizzaService.trovaPerId(id));
}
```

> 🧠 **La regola d'oro**: l'entità (`Pizza`) conosce le regole di dominio. Il DTO conosce solo la forma dei dati sulla rete. Confonderli crea un accoppiamento pericoloso: aggiungere un campo interno all'entità finirebbe per esporlo automaticamente all'esterno, senza che tu l'abbia deciso.

### Status code onesti

```java
@RestController
@RequestMapping("/api/pizze")
public class PizzaRestController {

    @GetMapping("/{id}")
    public ResponseEntity<PizzaDto> dettaglio(@PathVariable Long id) {
        return pizzaService.trovaPerId(id)
            .map(PizzaDto::da)
            .map(ResponseEntity::ok)              // 200
            .orElse(ResponseEntity.notFound().build());   // 404
    }

    @PostMapping
    public ResponseEntity<PizzaDto> crea(@RequestBody @Valid NuovaPizzaDto dto) {
        var pizza = pizzaService.crea(dto);
        var uri = URI.create("/api/pizze/" + pizza.getId());
        return ResponseEntity.created(uri).body(PizzaDto.da(pizza));   // 201
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> elimina(@PathVariable Long id) {
        pizzaService.elimina(id);
        return ResponseEntity.noContent().build();   // 204
    }
}
```

### Validazione dei DTO in ingresso

```java
public record NuovaPizzaDto(
    @NotBlank(message = "Il nome è obbligatorio") String nome,
    @Positive(message = "Il prezzo deve essere positivo") BigDecimal prezzo
) {}
```

`@Valid` sul parametro del controller, combinato con le annotazioni `jakarta.validation` sul DTO, fa rifiutare automaticamente a Spring i payload malformati con un `400 Bad Request` — **prima** ancora che il tuo codice venga eseguito, esattamente come lo schema-first validation vista in altri stack.

### OpenAPI: documentare l'API senza scriverla a mano due volte

```xml
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.5.0</version>
</dependency>
```

Con questa sola dipendenza, Spring Boot espone automaticamente `/v3/api-docs` (lo schema OpenAPI in JSON) e `/swagger-ui.html` (una UI interattiva per esplorare e provare l'API) — generati **dal codice stesso** (controller, DTO, annotazioni di validazione), senza un file separato da mantenere manualmente allineato.

### Spring Security: le basi

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.GET, "/api/pizze/**").permitAll()   // lettura pubblica
                .requestMatchers("/pizze/**").authenticated()                    // pannello admin: solo autenticati
                .anyRequest().permitAll()
            )
            .formLogin(Customizer.withDefaults())
            .csrf(csrf -> csrf.ignoringRequestMatchers("/api/**"));   // CSRF protegge i form, non le API stateless

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();   // MAI salvare password in chiaro, mai con MD5/SHA1
    }
}
```

> 🧠 **La regola d'oro**: `BCryptPasswordEncoder` non è una scelta arbitraria — è un algoritmo di hashing **lento apposta** (con un "cost factor" configurabile), pensato per rendere costosissimo un attacco a forza bruta anche se il database viene compromesso. Non implementare mai il tuo hashing "fatto in casa": usa sempre uno standard testato dalla comunità.

### Autorizzazione a livello di metodo

```java
@Service
public class OrdineService {

    @PreAuthorize("hasRole('ADMIN')")
    public void elimina(Long ordineId) {
        ordineRepository.deleteById(ordineId);
    }
}
```

`@PreAuthorize` sposta il controllo di autorizzazione **dentro** il service, non solo nel controller — così la regola vale ovunque il metodo venga chiamato, anche da un altro service interno, e non solo quando arriva da un endpoint HTTP.

---

## 10. Un progetto completo, vediamolo passo passo

Mettiamo insieme tutto: **PizzaHub**, una piccola app di gestione ordini per una pizzeria. Un pannello admin con Thymeleaf per gestire il menu, una API REST pubblica per consultare le pizze e creare ordini, Spring Data JPA con H2, profili per ambiente, e Spring Security.

### Cosa fa PizzaHub

```bash
GET  /pizze                  # pannello admin: elenco pizze (Thymeleaf, richiede login)
GET  /api/pizze              # API pubblica: elenco pizze in JSON
POST /api/ordini             { "pizzaId": 1, "quantita": 2 }   # crea un ordine
GET  /api/ordini/{id}        # dettaglio di un ordine, con il totale calcolato
```

![Flusso di una richiesta in PizzaHub](pizzahub-flow.png)

### Struttura del progetto

```
pizzahub/
├── pom.xml
├── src/main/java/com/pizzahub/
│   ├── PizzaHubApplication.java
│   ├── domain/
│   │   ├── Pizza.java
│   │   ├── Ordine.java
│   │   ├── PizzaRepository.java
│   │   └── OrdineRepository.java
│   ├── application/
│   │   ├── OrdineService.java
│   │   ├── PizzaService.java
│   │   └── dto/
│   │       ├── CreaOrdineDto.java
│   │       ├── OrdineDto.java
│   │       └── PizzaDto.java
│   ├── infrastructure/
│   │   ├── PizzaJpaRepository.java
│   │   └── OrdineJpaRepository.java
│   ├── web/
│   │   ├── PizzaMvcController.java
│   │   └── OrdineRestController.java
│   └── config/
│       └── SecurityConfig.java
└── src/main/resources/
    ├── application.yml
    ├── application-dev.yml
    └── templates/
        └── pizze.html
```

### Step 1 — Generare il progetto

Su [start.spring.io](https://start.spring.io): Maven, Java 21, dipendenze `Spring Web`, `Spring Data JPA`, `Thymeleaf`, `H2 Database`, `Spring Security`, `Validation`. Scarica ed estrai lo zip come `pizzahub/` (sezione 3).

### Step 2 — Domain: entità e "port"

```java
// domain/Pizza.java
@Entity
public class Pizza {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false)
    private BigDecimal prezzo;

    protected Pizza() {}

    public Pizza(String nome, BigDecimal prezzo) {
        this.nome = nome;
        this.prezzo = prezzo;
    }

    public Long getId() { return id; }
    public String getNome() { return nome; }
    public BigDecimal getPrezzo() { return prezzo; }
}
```

```java
// domain/Ordine.java
@Entity
public class Ordine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    private Pizza pizza;

    private int quantita;

    protected Ordine() {}

    public Ordine(Pizza pizza, int quantita) {
        if (quantita <= 0) {
            throw new IllegalArgumentException("La quantità deve essere positiva");
        }
        this.pizza = pizza;
        this.quantita = quantita;
    }

    public Long getId() { return id; }
    public Pizza getPizza() { return pizza; }
    public int getQuantita() { return quantita; }

    public BigDecimal totale() {
        return pizza.getPrezzo().multiply(BigDecimal.valueOf(quantita));
    }
}
```

```java
// domain/PizzaRepository.java
public interface PizzaRepository {
    Optional<Pizza> trovaPerId(Long id);
    List<Pizza> tutte();
}

// domain/OrdineRepository.java
public interface OrdineRepository {
    Ordine salva(Ordine ordine);
    Optional<Ordine> trovaPerId(Long id);
}
```

### Step 3 — Infrastructure: Spring Data JPA

```java
// infrastructure/PizzaJpaRepository.java
public interface PizzaJpaRepository extends JpaRepository<Pizza, Long>, PizzaRepository {

    default Optional<Pizza> trovaPerId(Long id) { return findById(id); }
    default List<Pizza> tutte() { return findAll(); }
}

// infrastructure/OrdineJpaRepository.java
public interface OrdineJpaRepository extends JpaRepository<Ordine, Long>, OrdineRepository {

    default Ordine salva(Ordine ordine) { return save(ordine); }
    default Optional<Ordine> trovaPerId(Long id) { return findById(id); }
}
```

### Step 4 — Application: DTO e service

```java
// application/dto/PizzaDto.java
public record PizzaDto(Long id, String nome, BigDecimal prezzo) {
    public static PizzaDto da(Pizza pizza) {
        return new PizzaDto(pizza.getId(), pizza.getNome(), pizza.getPrezzo());
    }
}

// application/dto/CreaOrdineDto.java
public record CreaOrdineDto(
    @NotNull Long pizzaId,
    @Positive int quantita
) {}

// application/dto/OrdineDto.java
public record OrdineDto(Long id, String pizzaNome, int quantita, BigDecimal totale) {
    public static OrdineDto da(Ordine ordine) {
        return new OrdineDto(ordine.getId(), ordine.getPizza().getNome(), ordine.getQuantita(), ordine.totale());
    }
}
```

```java
// application/PizzaService.java
@Service
public class PizzaService {

    private final PizzaRepository pizzaRepository;

    public PizzaService(PizzaRepository pizzaRepository) {
        this.pizzaRepository = pizzaRepository;
    }

    public List<PizzaDto> tutte() {
        return pizzaRepository.tutte().stream().map(PizzaDto::da).toList();
    }
}

// application/OrdineService.java
@Service
public class OrdineService {

    private final PizzaRepository pizzaRepository;
    private final OrdineRepository ordineRepository;

    public OrdineService(PizzaRepository pizzaRepository, OrdineRepository ordineRepository) {
        this.pizzaRepository = pizzaRepository;
        this.ordineRepository = ordineRepository;
    }

    @Transactional
    public OrdineDto creaOrdine(CreaOrdineDto dto) {
        Pizza pizza = pizzaRepository.trovaPerId(dto.pizzaId())
            .orElseThrow(() -> new NoSuchElementException("Pizza non trovata: " + dto.pizzaId()));

        Ordine ordine = new Ordine(pizza, dto.quantita());
        return OrdineDto.da(ordineRepository.salva(ordine));
    }
}
```

Nota come `OrdineService` non sa nulla di JPA, di Hibernate o di HTTP — dipende solo da interfacce definite nel `domain`. È esattamente ciò che rende il service testabile in isolamento (Step 7) e il database sostituibile senza toccare una riga di logica di business.

### Step 5 — Web: MVC e REST insieme

```java
// web/PizzaMvcController.java
@Controller
public class PizzaMvcController {

    private final PizzaService pizzaService;

    public PizzaMvcController(PizzaService pizzaService) {
        this.pizzaService = pizzaService;
    }

    @GetMapping("/pizze")
    public String elenco(Model model) {
        model.addAttribute("pizze", pizzaService.tutte());
        return "pizze";
    }
}

// web/OrdineRestController.java
@RestController
@RequestMapping("/api")
public class OrdineRestController {

    private final PizzaService pizzaService;
    private final OrdineService ordineService;

    public OrdineRestController(PizzaService pizzaService, OrdineService ordineService) {
        this.pizzaService = pizzaService;
        this.ordineService = ordineService;
    }

    @GetMapping("/pizze")
    public List<PizzaDto> pizze() {
        return pizzaService.tutte();
    }

    @PostMapping("/ordini")
    public ResponseEntity<OrdineDto> creaOrdine(@RequestBody @Valid CreaOrdineDto dto) {
        OrdineDto ordine = ordineService.creaOrdine(dto);
        return ResponseEntity.created(URI.create("/api/ordini/" + ordine.id())).body(ordine);
    }
}
```

```html
<!-- templates/pizze.html -->
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head><title>PizzaHub — Menu</title></head>
<body>
    <h1>Le nostre pizze</h1>
    <ul>
        <li th:each="pizza : ${pizze}">
            <span th:text="${pizza.nome}"></span> — <span th:text="${pizza.prezzo} + ' €'"></span>
        </li>
    </ul>
</body>
</html>
```

### Step 6 — Configurazione per ambiente

```yaml
# application.yml
spring:
  application:
    name: pizzahub

# application-dev.yml
spring:
  datasource:
    url: jdbc:h2:mem:pizzahub
  h2:
    console:
      enabled: true
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
```

```java
// config/DevDataSeeder.java — dati di prova, SOLO in sviluppo (sezione 8)
@Configuration
public class DevDataSeeder {

    @Bean
    @Profile("dev")
    public CommandLineRunner seed(PizzaJpaRepository repo) {
        return args -> {
            repo.save(new Pizza("Margherita", new BigDecimal("6.50")));
            repo.save(new Pizza("Diavola", new BigDecimal("8.00")));
        };
    }
}
```

### Step 7 — Sicurezza minima

```java
// config/SecurityConfig.java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/**").permitAll()
                .requestMatchers("/pizze/**").authenticated()
                .anyRequest().permitAll()
            )
            .formLogin(Customizer.withDefaults())
            .csrf(csrf -> csrf.ignoringRequestMatchers("/api/**"));
        return http.build();
    }
}
```

### Step 8 — I test, con JUnit 5 e Mockito

```java
// src/test/java/com/pizzahub/application/OrdineServiceTest.java
class OrdineServiceTest {

    @Test
    void creaOrdine_conPizzaEsistente_calcolaIlTotaleCorretto() {
        // Arrange — repository finti, nessun database vero
        PizzaRepository pizzaRepository = mock(PizzaRepository.class);
        OrdineRepository ordineRepository = mock(OrdineRepository.class);

        Pizza margherita = new Pizza("Margherita", new BigDecimal("6.50"));
        when(pizzaRepository.trovaPerId(1L)).thenReturn(Optional.of(margherita));
        when(ordineRepository.salva(any())).thenAnswer(inv -> inv.getArgument(0));

        var service = new OrdineService(pizzaRepository, ordineRepository);

        // Act
        var risultato = service.creaOrdine(new CreaOrdineDto(1L, 3));

        // Assert
        assertEquals(new BigDecimal("19.50"), risultato.totale());
        assertEquals("Margherita", risultato.pizzaNome());
    }

    @Test
    void creaOrdine_conPizzaInesistente_lanciaEccezione() {
        PizzaRepository pizzaRepository = mock(PizzaRepository.class);
        OrdineRepository ordineRepository = mock(OrdineRepository.class);
        when(pizzaRepository.trovaPerId(99L)).thenReturn(Optional.empty());

        var service = new OrdineService(pizzaRepository, ordineRepository);

        assertThrows(NoSuchElementException.class,
            () -> service.creaOrdine(new CreaOrdineDto(99L, 1)));
    }
}
```

```java
// test dell'endpoint REST, con il contesto Spring avviato
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class OrdineRestControllerTest {

    @Autowired MockMvc mockMvc;

    @Test
    void postOrdini_conPayloadValido_risponde201() throws Exception {
        mockMvc.perform(post("/api/ordini")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    { "pizzaId": 1, "quantita": 2 }
                    """))
            .andExpect(status().isCreated());
    }
}
```

> 🧠 **La regola d'oro**: nota la differenza tra i due test. Il primo (`OrdineServiceTest`) è un **test unitario puro**: nessuna annotazione Spring, nessun contesto da avviare, gira in millisecondi grazie a Clean Architecture (sezione 5). Il secondo (`OrdineRestControllerTest`) è un **test di integrazione**: avvia l'intero contesto Spring per verificare che HTTP, JSON, validazione e service lavorino davvero insieme. Servono entrambi, con proporzioni diverse: molti test unitari veloci, pochi test di integrazione mirati.

```bash
./mvnw test                        # tutti i test
./mvnw test -Dtest=OrdineServiceTest   # solo una classe
```

### Step 9 — Avvia e prova

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

```bash
curl http://localhost:8080/api/pizze
# [{"id":1,"nome":"Margherita","prezzo":6.50}, {"id":2,"nome":"Diavola","prezzo":8.00}]

curl -X POST http://localhost:8080/api/ordini \
  -H "Content-Type: application/json" \
  -d '{"pizzaId": 1, "quantita": 3}'
# 201 {"id":1,"pizzaNome":"Margherita","quantita":3,"totale":19.50}

curl -X POST http://localhost:8080/api/ordini \
  -H "Content-Type: application/json" \
  -d '{"pizzaId": 999, "quantita": 1}'
# 500 (da migliorare con un @ExceptionHandler dedicato — vedi sotto)
```

Un ultimo tocco professionale: gestire l'eccezione `NoSuchElementException` con un `404` onesto invece di lasciar trapelare un generico `500`:

```java
// web/GestoreErrori.java
@RestControllerAdvice
public class GestoreErrori {

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<Map<String, String>> gestisciNonTrovato(NoSuchElementException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("errore", e.getMessage()));
    }
}
```

`@RestControllerAdvice` intercetta le eccezioni lanciate da **qualunque** `@RestController` dell'applicazione, in un unico posto — niente `try/catch` ripetuto in ogni endpoint.

### Concetti applicati

- **Sezione 1**: `record` per i DTO, `Optional` per i valori che possono mancare, `var` ovunque il tipo è ovvio
- **Sezione 2**: constructor injection per ogni service, annotazioni stereotipo (`@Service`, `@Repository`, `@Controller`, `@RestController`)
- **Sezione 5**: separazione `domain` / `application` / `infrastructure` / `web`, con le dipendenze che puntano verso l'interno
- **Sezione 6**: `@Controller` + Thymeleaf per il pannello admin, `@RestController` per l'API
- **Sezione 7**: Spring Data JPA, entità annotate, `@Transactional`, relazioni con `FetchType.LAZY`
- **Sezione 8**: profilo `dev` con H2 e dati di prova, configurazione pronta per un profilo `prod` esterno
- **Sezione 9**: DTO invece di entità sul contratto pubblico, status code onesti, validazione con `@Valid`, Spring Security di base
- **Sezione 10 stessa**: test unitari puri (Mockito) e test di integrazione (`MockMvc`) nelle giuste proporzioni

---

## 🎉 Ce l'hai fatta!

Hai completato **Booting Spring Boot — Java Edition**. Ora sai:

- Come il Java moderno (17/21, LTS) abbia lasciato indietro il boilerplate del 2006: `record`, `var`, pattern matching, `Optional`, virtual thread
- I concetti cardine di Spring: Inversion of Control, Dependency Injection via costruttore, auto-configurazione, le annotazioni stereotipo
- Come partire da un progetto pulito con Spring Initializr, senza scrivere configurazione a mano
- Le differenze pragmatiche tra Maven e Gradle, e quando preferire l'uno o l'altro
- Clean Code e Clean Architecture applicati a un progetto Spring Boot reale: domain, application, infrastructure, web
- Come costruire viste moderne con Thymeleaf, restando HTML valido anche prima del rendering
- I tre livelli di accesso ai dati in Java (JDBC, JPA/Hibernate, Spring Data JPA), e come evitare la trappola N+1
- Come separare configurazioni per ambiente con i profili Spring, senza mai committare un segreto
- Come progettare un'API REST pulita, con DTO, status code onesti, e Spring Security di base
- Come mettere tutto insieme in **PizzaHub**, un progetto reale, dal `start.spring.io` al primo `curl`

**Dove andare ora?**

- 📖 [Spring Boot Reference Documentation](https://docs.spring.io/spring-boot/docs/current/reference/html/) — la documentazione ufficiale, sempre aggiornata
- 🧪 [Baeldung](https://www.baeldung.com) — probabilmente la risorsa più completa online per approfondimenti pratici su Spring
- 📘 *Clean Architecture* di Robert C. Martin — il libro di riferimento per la separazione in livelli, linguaggio-agnostico
- 🗃️ [Spring Data JPA Reference](https://docs.spring.io/spring-data/jpa/reference/) — query derivation avanzata, specifiche, proiezioni
- 💎 [.NET Pragmatic Approach](/it/playbook/dotnet) — confronta lo stesso problema (un'app enterprise robusta) risolto su un altro runtime moderno

> 🧠 **L'ultimo consiglio**: Spring Boot ti dà moltissimi strumenti — non li usi tutti insieme, sempre, su ogni progetto. Usa Thymeleaf quando ti serve davvero un pannello server-rendered, non "perché c'è". Usa Spring Security con la configurazione minima che risolve il tuo problema reale, non con ogni opzione disponibile. La disciplina pragmatica — pochi livelli chiari, test che contano, codice che si legge da solo — batte sempre l'architettura "enterprise" che nessuno riesce più a modificare. Buon coding! ☕
