# Booting Spring Boot — Kotlin Edition

Se hai già letto la versione Java di questo playbook, sai già tutto sulle fondamenta di Spring Boot: Inversion of Control, Dependency Injection, auto-configuration. Quello che cambia qui è il linguaggio con cui scrivi quelle fondamenta — e Kotlin non è "Java con una sintassi diversa": è un linguaggio pensato da zero per eliminare intere categorie di bug (il famigerato `NullPointerException` su tutte) e per farti scrivere in dieci righe quello che in Java ne richiede quaranta, senza perdere un grammo di robustezza.

Kotlin nasce nel 2011 in JetBrains (gli stessi di IntelliJ IDEA), diventa linguaggio ufficiale per Android nel 2017, e oggi è una delle scelte più solide per il backend enterprise: **interoperabilità al 100% con Java** (puoi chiamare qualsiasi libreria Java da Kotlin e viceversa, girano sulla stessa JVM), **null safety nel sistema dei tipi** (il compilatore ti impedisce di scrivere codice che può esplodere per un valore nullo, non lo scopri più a runtime), e una sintassi che toglie cerimonia senza toglierti controllo.

Spring Boot supporta Kotlin come cittadino di prima classe da anni: Spring Initializr genera progetti Kotlin nativamente, ci sono estensioni Kotlin-specifiche per Spring Security e Spring Data, e da Spring 5 in poi il supporto alle **coroutine** è integrato per il codice reattivo. Questo playbook copre tutto quello che ti serve — dal cambio di paradigma OOP fino a un progetto completo, **PizzaHub**, scritto in Kotlin idiomatico dall'inizio alla fine — con lo stesso rigore tecnico e la stessa chiarezza della versione Java, per chi ha 12 anni di curiosità o 12 anni di produzione da mandare avanti.

---

## 1. Cambiamo paradigma: OOP in Kotlin

**In pillole**: Kotlin è object-oriented esattamente come Java, ma parte da premesse diverse: l'immutabilità è la scelta di default, il `null` è parte del sistema dei tipi (non un'eccezione a runtime in agguato), e le classi sono `final` finché non dici esplicitamente il contrario.

### `val` vs `var`: l'immutabilità prima di tutto

```kotlin
val nome = "Ada"        // non riassegnabile, per sempre — come "final String" in Java
var eta = 36                // riassegnabile

nome = "Grace"   // ❌ non compila: Val cannot be reassigned
eta = 37             // ✅ ok, var lo permette
```

🧠 **Analogia**: pensa a `val` come a un'etichetta scritta a pennarello indelebile su una scatola — una volta scritta, resta quella per sempre, anche se il contenuto della scatola (un oggetto mutabile) può ancora cambiare al suo interno. `var` invece è un'etichetta scritta a matita, che puoi cancellare e riscrivere quando vuoi.

> 💡 **Tip**: in un progetto Kotlin idiomatico, `val` è la scelta di default. Usi `var` solo quando hai una ragione concreta (un contatore in un loop, un accumulatore). Se ti accorgi di scrivere più `var` che `val`, è un segnale che il design ha troppa mutabilità.

### Null safety: il compilatore ti protegge, non il debugger

In Java, qualsiasi riferimento a un oggetto può essere `null`, e lo scopri solo quando esplode un `NullPointerException` — spesso lontanissimo da dove quel `null` è nato. In Kotlin, la nullabilità è **parte del tipo**: `String` e `String?` sono due tipi diversi, e il compilatore non ti lascia passare dall'uno all'altro senza gestire esplicitamente il caso `null`.

```kotlin
var nome: String = "Ada"       // non può MAI essere null — garantito dal compilatore
var soprannome: String? = null   // può essere null — il tipo lo dichiara apertamente

println(nome.length)        // ✅ sempre sicuro, nome non è mai null
println(soprannome.length)  // ❌ non compila: soprannome potrebbe essere null

// devi gestire esplicitamente il caso null, con uno di questi strumenti:
println(soprannome?.length)              // safe call: null se soprannome è null, altrimenti la lunghezza
println(soprannome?.length ?: 0)         // elvis operator: un valore di default se è null
println(soprannome!!.length)             // "trust me": lancia NPE se è null — usalo solo se sei ASSOLUTAMENTE sicuro
```

> 🧠 **La regola d'oro**: il `!!` (chiamato "not-null assertion") è una via di fuga dal sistema dei tipi, non uno strumento di lavoro quotidiano. Se ti ritrovi a scrivere `!!` spesso, il problema è nel design — probabilmente un valore che dovrebbe essere sempre presente sta viaggiando come nullable, oppure stai ignorando un caso che andrebbe gestito con `?:` o un `if (x != null)`.

### `data class`: niente più boilerplate per i dati

```java
// Java "2006": una classe scritta a mano per rappresentare un dato
public class Pizza {
    private final String nome;
    private final BigDecimal prezzo;
    // costruttore, getter, equals, hashCode, toString scritti a mano...
}
```

```kotlin
// Kotlin: la stessa cosa, in una riga
data class Pizza(val nome: String, val prezzo: BigDecimal)
```

Una `data class` genera automaticamente `equals()`, `hashCode()`, `toString()`, e in più due strumenti che Java non ha nemmeno con i `record`:

```kotlin
val margherita = Pizza("Margherita", BigDecimal("6.50"))

// copy(): crea una nuova istanza modificando solo i campi che vuoi cambiare
val margheritaScontata = margherita.copy(prezzo = BigDecimal("5.50"))

// destructuring: scompone l'oggetto nelle sue componenti in una riga
val (nome, prezzo) = margherita
println("$nome costa $prezzo")
```

> 💡 **Tip**: `copy()` è lo strumento chiave per lavorare con dati immutabili senza diventare matti. Invece di mutare un oggetto esistente, ne crei uno nuovo con i valori aggiornati — lo stesso pattern che useresti con `record` in Java o con lo spread operator `{...obj, campo: nuovoValore}` in TypeScript.

### Classi `final` di default, proprietà al posto di getter/setter

```kotlin
// ❌ questa classe NON può essere estesa — è il default, non un caso speciale
class OrdineService(private val pizzaRepository: PizzaRepository)

// ✅ per permettere l'ereditarietà, devi dichiararlo esplicitamente
open class Animale(val nome: String) {
    open fun verso() = "..."
}

class Cane(nome: String) : Animale(nome) {
    override fun verso() = "Bau!"
}
```

> 🧠 **La regola d'oro**: in Java tutte le classi sono aperte all'ereditarietà finché non le marchi `final`; in Kotlin è l'esatto opposto — tutte le classi sono `final` finché non le marchi `open`. Questo non è un capriccio sintattico: incoraggia **composizione sopra ereditarietà** (lo stesso principio visto nella versione Java di questo playbook), perché estendere una classe richiede una decisione esplicita e consapevole, non è il comportamento di default.

Le proprietà sostituiscono getter e setter scritti a mano:

```kotlin
class Pizza(val nome: String) {
    var prezzo: BigDecimal = BigDecimal.ZERO
        set(value) {
            require(value > BigDecimal.ZERO) { "Il prezzo deve essere positivo" }
            field = value
        }
}

val pizza = Pizza("Margherita")
pizza.prezzo = BigDecimal("6.50")   // chiama il setter, valida internamente
println(pizza.prezzo)                    // legge la proprietà, non serve getPrezzo()
```

### `when`: pattern matching prima che fosse cool

```kotlin
sealed interface RisultatoOrdine
data class OrdineCreato(val id: Long) : RisultatoOrdine
data class OrdineRifiutato(val motivo: String) : RisultatoOrdine

fun gestisci(risultato: RisultatoOrdine): String = when (risultato) {
    is OrdineCreato -> "Ordine #${risultato.id} creato con successo"
    is OrdineRifiutato -> "Ordine rifiutato: ${risultato.motivo}"
    // il compilatore SA che questi sono gli unici due casi possibili (sealed),
    // quindi non serve un "else" — se ne aggiungi un terzo, il compilatore ti obbliga a gestirlo qui
}
```

Una `sealed interface` (o `sealed class`) dichiara un insieme **chiuso** di sotto-tipi possibili: il compilatore conosce tutti i casi in anticipo, e un `when` che li copre tutti non ha bisogno di un `else` — anzi, se in futuro aggiungi un nuovo sotto-tipo, ogni `when` che lo dimentica smette di compilare. È un modo elegantissimo di modellare stati alternativi (un ordine creato o rifiutato, una risposta valida o un errore) senza eccezioni e senza `Optional` annidati.

### Extension function: aggiungere comportamento senza ereditare

```kotlin
// aggiunge un metodo a BigDecimal, una classe che non hai scritto tu e non puoi modificare
fun BigDecimal.formattaEuro(): String = "€ ${this.setScale(2)}"

val prezzo = BigDecimal("6.5")
println(prezzo.formattaEuro())   // € 6.50 — sembra un metodo nativo di BigDecimal, ma è tuo
```

> 🧠 **Analogia**: un'extension function è come attaccare un post-it con istruzioni extra su un oggetto che non ti appartiene, senza modificarlo. `BigDecimal` resta `BigDecimal`, non lo hai toccato — hai solo aggiunto un modo comodo di chiamare una funzione che prende quel `BigDecimal` come primo parametro, ma con una sintassi che sembra un metodo dell'oggetto stesso.

### Funzioni di prim'ordine e lambda

```kotlin
val pizze = listOf(
    Pizza("Margherita", BigDecimal("6.50")),
    Pizza("Diavola", BigDecimal("8.00")),
    Pizza("Quattro Formaggi", BigDecimal("9.50"))
)

val economiche = pizze.filter { it.prezzo < BigDecimal("8.00") }
val nomi = pizze.map { it.nome }
val totale = pizze.sumOf { it.prezzo }
```

Non c'è bisogno degli Stream espliciti come in Java: `List`, `Set` e `Map` in Kotlin hanno già `filter`, `map`, `sumOf`, `groupBy` come funzioni native, con `it` come nome implicito del parametro quando la lambda ne ha uno solo.

---

## 2. I concetti base del framework

**In pillole**: Inversion of Control e Dependency Injection funzionano esattamente come nella versione Java — è Spring, non cambia filosofia — ma il **constructor injection**, già la pratica raccomandata in Java, in Kotlin diventa quasi automatico grazie al costruttore primario.

### Constructor injection, ancora più naturale

```kotlin
@Service
class OrdineService(
    private val pizzaRepository: PizzaRepository,
    private val ordineRepository: OrdineRepository
) {
    // pizzaRepository e ordineRepository sono già proprietà della classe:
    // il costruttore primario di Kotlin le dichiara E le inizializza in un colpo solo
}
```

Confrontalo con l'equivalente Java, che richiede dichiarare i campi, scrivere il costruttore, e assegnare ogni campo a mano: in Kotlin il costruttore primario **è** la dichiarazione dei campi. Spring vede il costruttore, capisce che `OrdineService` ha bisogno di un `PizzaRepository` e di un `OrdineRepository`, e li inietta automaticamente — la stessa identica meccanica di Inversion of Control vista nella versione Java, con meno codice per esprimerla.

### Le stereotype annotation, invariate

```kotlin
@Component   // bean generico
@Service       // bean con logica di business
@Repository      // bean che parla con la persistenza
@Controller        // bean che gestisce richieste web e ritorna viste HTML
@RestController      // bean che ritorna dati (JSON), non viste
```

Stessa tabella, stesso significato della versione Java — sono annotazioni Spring, non hanno nulla di linguaggio-specifico. Cambia solo la sintassi della classe che le porta.

### `@SpringBootApplication`, con una particolarità Kotlin

```kotlin
@SpringBootApplication
class PizzaHubApplication

fun main(args: Array<String>) {
    runApplication<PizzaHubApplication>(*args)
}
```

Nota due dettagli Kotlin-specifici: `main` è una **funzione top-level**, non deve stare dentro una classe come in Java; e `runApplication<PizzaHubApplication>(*args)` è un'extension function offerta da `spring-boot-starter` che sostituisce `SpringApplication.run(PizzaHubApplication.class, args)` — più concisa, con il tipo passato come generic invece che come `.class` literal.

---

## 3. Spring Initializr: il punto di partenza

**In pillole**: [start.spring.io](https://start.spring.io) genera progetti Kotlin nativamente — basta selezionare "Kotlin" come linguaggio — ma il generatore aggiunge automaticamente un paio di dipendenze specifiche che in Java non servono, e vale la pena sapere perché sono lì.

### Cosa scegliere, e perché

| Campo | Cosa scegliere per un nuovo progetto | Perché |
|---|---|---|
| **Project** | Gradle - Kotlin | Vedi sezione 4 per la scelta pragmatica |
| **Language** | Kotlin | Ovviamente |
| **Spring Boot** | L'ultima versione **stabile** | Mai una snapshot o una release candidate per un progetto vero |
| **Java** | 21 (LTS) | Kotlin gira sulla JVM: serve comunque scegliere quale JDK target usare |
| **Packaging** | Jar | Jar eseguibile con server embedded, zero installazioni esterne |

### Le dipendenze per PizzaHub

Le stesse della versione Java — **Spring Web**, **Spring Data JPA**, **Thymeleaf**, **H2 Database**, **Spring Security** — più due extra che Spring Initializr aggiunge da solo quando selezioni Kotlin:

- **`jackson-module-kotlin`** — insegna a Jackson (il motore di serializzazione JSON di Spring) a capire le `data class` Kotlin, in particolare i parametri con default value e la nullabilità: senza questo modulo, deserializzare JSON dentro una `data class` può comportarsi in modo sorprendente
- **`kotlin-reflect`** — la libreria di reflection di Kotlin, richiesta da diverse funzionalità Spring (come la validazione) che ispezionano le classi a runtime

> 💡 **Tip**: non devi aggiungerle a mano — Spring Initializr le include automaticamente selezionando "Kotlin" come linguaggio. Ma è utile sapere cosa fanno, perché rimuoverle "per alleggerire" romperebbe la serializzazione JSON delle tue `data class` in modi difficili da diagnosticare.

### Cosa genera lo zip

```
pizzahub/
├── build.gradle.kts                              ← dipendenze e build (sezione 4)
├── gradlew, gradlew.bat                            ← Gradle Wrapper: non serve Gradle installato a mano
├── src/
│   ├── main/
│   │   ├── kotlin/com/pizzahub/
│   │   │   └── PizzaHubApplication.kt              ← entry point, @SpringBootApplication + main()
│   │   └── resources/
│   │       ├── application.yml                       ← configurazione (sezione 8)
│   │       ├── static/                                  ← file serviti direttamente (CSS, immagini)
│   │       └── templates/                                ← viste Thymeleaf (sezione 6)
│   └── test/
│       └── kotlin/com/pizzahub/
│           └── PizzaHubApplicationTests.kt          ← uno "smoke test": verifica che il context parta
└── .gitignore
```

Nota il path `src/main/kotlin` invece di `src/main/java` — Gradle e Maven riconoscono entrambe le directory in un progetto Kotlin-Java misto, ma per un progetto Kotlin puro tutto vive sotto `kotlin/`.

---

## 4. Maven vs Gradle: due approcci differenti

**In pillole**: la stessa scelta vista nella versione Java, ma con un accoppiamento naturale in più — Gradle con Kotlin DSL (`build.gradle.kts`) significa scrivere il file di build **nello stesso linguaggio** del resto del progetto, senza passare da XML o da Groovy.

### `build.gradle.kts`: Kotlin che configura Kotlin

```kotlin
// build.gradle.kts
plugins {
    kotlin("jvm") version "1.9.24"
    kotlin("plugin.spring") version "1.9.24"     // apre automaticamente le classi @Component, @Service...
    kotlin("plugin.jpa") version "1.9.24"           // apre automaticamente le entity @Entity (sezione 7)
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
    implementation("org.springframework.boot:spring-boot-starter-thymeleaf")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("com.ninja-squad:springmockk:4.0.2")   // MockK per Spring, sezione 10
}

kotlin {
    compilerOptions {
        freeCompilerArgs.addAll("-Xjsr305=strict")   // interpreta le annotazioni @NonNull/@Nullable di Java in modo stretto
    }
}
```

Nota i tre plugin Kotlin specifici: `kotlin("jvm")` (il compilatore Kotlin stesso), `kotlin("plugin.spring")` e `kotlin("plugin.jpa")` — questi ultimi due meritano una spiegazione, perché risolvono un attrito reale tra Kotlin e Spring che vedremo in dettaglio nella sezione 7.

### `pom.xml`: la stessa cosa, in XML

```xml
<!-- pom.xml -->
<project>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.3.0</version>
    </parent>

    <properties>
        <kotlin.version>1.9.24</kotlin.version>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.jetbrains.kotlin</groupId>
            <artifactId>kotlin-reflect</artifactId>
        </dependency>
        <dependency>
            <groupId>com.fasterxml.jackson.module</groupId>
            <artifactId>jackson-module-kotlin</artifactId>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.jetbrains.kotlin</groupId>
                <artifactId>kotlin-maven-plugin</artifactId>
                <configuration>
                    <compilerPlugins>
                        <plugin>spring</plugin>
                        <plugin>jpa</plugin>
                    </compilerPlugins>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

### Il confronto pragmatico, versione Kotlin

| | Gradle Kotlin DSL | Maven |
|---|---|---|
| Linguaggio del build file | Kotlin — stesso linguaggio del progetto | XML |
| Autocompletamento IDE sul build file | Eccellente (è codice Kotlin vero) | Limitato (XML con schema) |
| Velocità di build | Build incrementali, cache — spesso più veloce | Più lento su progetti grandi |
| Curva di apprendimento | Devi capire lo script, non solo dichiarare | Più leggibile a colpo d'occhio |
| Ecosistema Android | Lo standard de facto | Raro |

> 🧠 **Regola d'oro pragmatica**: se il progetto è già Kotlin, **Gradle con Kotlin DSL** è la scelta più coerente — scrivi build logic nello stesso linguaggio delle tue classi, con autocompletamento IDE completo sul file di build stesso. Maven resta perfettamente valido, specialmente in team enterprise dove la standardizzazione su Maven è già forte — ma perde quel vantaggio di "stesso linguaggio ovunque" che rende Gradle Kotlin DSL una scelta particolarmente naturale qui.

---

## 5. Clean Code, Clean Architecture

**In pillole**: gli stessi quattro strati della versione Java — `domain`, `application`, `infrastructure`, `web` — con la stessa regola di dipendenza verso l'interno. Quello che cambia è quanto Kotlin renda **naturale** rispettare quella regola: `data class` immutabili per i Value Object, `sealed interface` per modellare stati alternativi senza eccezioni, funzioni di estensione per il mapping tra strati.

### Clean Code, in pratica

```kotlin
// ❌ un nome bugiardo, un metodo che fa troppo
fun processaDati(d: List<Int>): List<Int> {
    val r = mutableListOf<Int>()
    for (x in d) {
        if (x > 0) r.add(x * 2)
    }
    return r
}

// ✅ nome onesto, funzione espressione singola, responsabilità unica
fun raddoppiaValoriPositivi(numeri: List<Int>): List<Int> =
    numeri.filter { it > 0 }.map { it * 2 }
```

> 💡 **Tip**: la sintassi `fun nome(...): Tipo = espressione` (senza `{ return ... }`) si chiama "expression body", ed è idiomatica in Kotlin per funzioni che sono, appunto, una singola espressione. Non è solo estetica: comunica immediatamente "questa funzione calcola un valore", senza dover leggere un corpo con più righe per capirlo.

### I quattro strati, applicati a Spring Boot Kotlin

```
com.pizzahub/
├── domain/            ← nucleo: entity, value object, interfacce repository. ZERO dipendenza da Spring
├── application/         ← service, use case, DTO. Dipende solo da domain
├── infrastructure/        ← implementazioni Spring Data JPA, client esterni. Implementa le interfacce di domain
└── web/                     ← controller MVC e REST. Il punto di ingresso, assemblato via Dependency Injection
```

![Clean Architecture in Spring Boot Kotlin](spring-kotlin-clean-architecture.png)

```kotlin
// domain/PizzaRepository.kt — l'interfaccia (la "porta") vive nel domain
interface PizzaRepository {
    fun trovaPerId(id: Long): Pizza?
    fun tutte(): List<Pizza>
}

// infrastructure/PizzaJpaRepository.kt — l'implementazione vive fuori, e DIPENDE da domain
@Repository
interface PizzaJpaRepository : JpaRepository<Pizza, Long>, PizzaRepository {
    override fun trovaPerId(id: Long): Pizza? = findByIdOrNull(id)
    override fun tutte(): List<Pizza> = findAll()
}
```

Nota `Pizza?` come tipo di ritorno invece di `Optional<Pizza>`: in Kotlin, un tipo nullable **è già** l'equivalente esatto di `Optional` — non serve un wrapper aggiuntivo, il compilatore ti forza comunque a gestire il caso "assente" ovunque venga usato. `findByIdOrNull` è un'extension function di Spring Data JPA pensata apposta per Kotlin, alternativa a `findById(id).orElse(null)`.

### `sealed interface` per gli errori di dominio

```kotlin
sealed interface CreaOrdineErrore {
    data class PizzaNonTrovata(val id: Long) : CreaOrdineErrore
    data class QuantitaNonValida(val quantita: Int) : CreaOrdineErrore
}

fun creaOrdine(dto: CreaOrdineDto): Either<CreaOrdineErrore, Ordine> {
    val pizza = pizzaRepository.trovaPerId(dto.pizzaId)
        ?: return Either.Left(CreaOrdineErrore.PizzaNonTrovata(dto.pizzaId))

    if (dto.quantita <= 0) {
        return Either.Left(CreaOrdineErrore.QuantitaNonValida(dto.quantita))
    }

    return Either.Right(Ordine(pizza, dto.quantita))
}
```

> 🧠 **La regola d'oro**: questo pattern (spesso chiamato "Either" o "Result", con o senza libreria dedicata come Arrow) rende **impossibile ignorare un errore**: il chiamante deve gestire esplicitamente sia `Left` che `Right` per estrarre il valore. È un'alternativa alle eccezioni per errori che fanno parte del normale flusso di business (un ordine può ragionevolmente fallire perché una pizza non esiste), riservando le eccezioni vere e proprie a condizioni davvero eccezionali. Nel progetto PizzaHub (sezione 10) useremo comunque eccezioni per semplicità — ma è importante sapere che questa alternativa esiste ed è idiomatica in Kotlin.

### Modello ricco, con Kotlin che lo rende conciso

```kotlin
class Ordine(
    val pizza: Pizza,
    val quantita: Int
) {
    init {
        require(quantita > 0) { "La quantita deve essere positiva" }
    }

    fun totale(): BigDecimal = pizza.prezzo.multiply(BigDecimal.valueOf(quantita.toLong()))
}
```

Il blocco `init` viene eseguito ogni volta che l'oggetto viene costruito — è il posto naturale per validare gli invarianti, sostituendo il controllo manuale che in Java scriveresti dentro un costruttore esplicito. `require()` è una funzione standard di Kotlin che lancia `IllegalArgumentException` se la condizione è falsa: lo stesso pattern del "fail fast" visto nella versione Java, con meno sintassi.

---

## 6. Modern MVC (con Thymeleaf)

**In pillole**: Thymeleaf resta HTML valido indipendentemente dal linguaggio del backend — i template non cambiano affatto tra Java e Kotlin. Quello che cambia è il controller: più corto, con `data class` per i form e proprietà al posto di getter/setter.

### `@Controller` e `@RestController`, in Kotlin

```kotlin
@Controller
class PizzaMvcController(private val pizzaService: PizzaService) {

    @GetMapping("/pizze")
    fun elenco(model: Model): String {
        model.addAttribute("pizze", pizzaService.tutte())
        return "pizze"   // Spring cerca templates/pizze.html
    }
}

@RestController
@RequestMapping("/api/pizze")
class PizzaRestController(private val pizzaService: PizzaService) {

    @GetMapping
    fun elenco(): List<PizzaDto> = pizzaService.tutte()
}
```

Nota come il constructor injection (sezione 2) elimini completamente il boilerplate: nessun campo dichiarato a parte, nessun costruttore scritto a mano — `private val pizzaService: PizzaService` nel costruttore primario è tutto quello che serve.

### Il template Thymeleaf: identico a Java, perché è solo HTML

```html
<!-- templates/pizze.html -->
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head><title>Le nostre pizze</title></head>
<body>
    <h1>Menu</h1>
    <ul>
        <li th:each="pizza : ${pizze}">
            <span th:text="${pizza.nome}">Nome pizza</span> —
            <span th:text="${pizza.prezzo} + ' €'">Prezzo</span>
        </li>
    </ul>
    <p th:if="${pizze.isEmpty()}">Nessuna pizza disponibile, torna più tardi!</p>
</body>
</html>
```

Thymeleaf legge le proprietà Kotlin (`pizza.nome`, `pizza.prezzo`) esattamente come leggerebbe i getter Java — le proprietà Kotlin compilano in `getNome()`/`getPrezzo()` a bytecode, quindi da fuori la JVM (incluso Thymeleaf) non vede alcuna differenza.

### Form binding con `data class`

```kotlin
data class NuovaPizzaForm(
    @field:NotBlank val nome: String = "",
    @field:Positive val prezzo: BigDecimal = BigDecimal.ZERO
)
```

```kotlin
@GetMapping("/pizze/nuova")
fun form(model: Model): String {
    model.addAttribute("nuovaPizza", NuovaPizzaForm())
    return "pizze/nuova"
}

@PostMapping("/pizze")
fun crea(@ModelAttribute @Valid form: NuovaPizzaForm, errors: BindingResult): String {
    if (errors.hasErrors()) {
        return "pizze/nuova"
    }
    pizzaService.crea(form)
    return "redirect:/pizze"   // Post-Redirect-Get, stessa regola della versione Java
}
```

> 💡 **Tip**: nota `@field:NotBlank` invece di `@NotBlank`. In Kotlin, un parametro del costruttore primario può diventare campo, getter, setter o parametro del costruttore stesso — e senza il prefisso `@field:`, l'annotazione potrebbe finire nel punto sbagliato (ad esempio sul costruttore invece che sul campo), e la validazione Jakarta Bean Validation smetterebbe di funzionare silenziosamente. È un dettaglio piccolo ma che vale la pena conoscere, perché l'errore che ne risulta è difficile da diagnosticare.

---

## 7. Accesso ai dati: facciamo chiarezza

**In pillole**: JDBC, `JdbcTemplate`, JPA/Hibernate, Spring Data JPA — la stessa scala di astrazione della versione Java. Ma Kotlin e JPA hanno un attrito reale che va capito bene prima di scriverci sopra un progetto: le entity JPA hanno bisogno di essere **mutabili e aperte all'ereditarietà**, mentre Kotlin di default rende tutto immutabile e `final`.

### Il problema: Hibernate ha bisogno di quello che Kotlin nasconde di default

Hibernate, per creare i suoi **proxy di lazy loading** (le relazioni caricate "pigramente", viste nella sezione 7 della versione Java), ha bisogno di poter **estendere** le tue classi entity a runtime. Ma in Kotlin le classi sono `final` di default (sezione 1) — quindi senza intervento, Hibernate non potrebbe creare quei proxy.

```kotlin
// ❌ senza il plugin kotlin("plugin.jpa"), questa entity è FINAL: Hibernate non può fare proxy su di essa
@Entity
class Pizza(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    val nome: String,
    val prezzo: BigDecimal
)
```

Serve inoltre un **costruttore senza argomenti**, che JPA usa internamente per istanziare l'oggetto prima di popolarne i campi via reflection — ma una `data class` con parametri obbligatori nel costruttore primario non ne ha uno.

### La soluzione: i compiler plugin `kotlin-spring` e `kotlin-jpa`

Sono gli stessi plugin già visti nel `build.gradle.kts` della sezione 4:

```kotlin
plugins {
    kotlin("plugin.spring") version "1.9.24"   // apre automaticamente le classi annotate @Component, @Service, @Configuration...
    kotlin("plugin.jpa") version "1.9.24"        // apre automaticamente le entity @Entity, e genera un costruttore no-arg
}
```

Con questi plugin attivi, il codice sopra **funziona senza modifiche visibili**: il compilatore, dietro le quinte, tratta ogni classe annotata `@Entity` come se fosse `open` e le aggiunge un costruttore senza argomenti — non devi scrivere `open class` a mano su ogni entity, né rinunciare a `data class` dove vuoi comunque usarla.

> 🧠 **La regola d'oro**: questi due plugin non sono un dettaglio opzionale — sono **quasi obbligatori** in un progetto Spring Boot Kotlin che usa JPA o injection su classi Kotlin standard. Dimenticarli produce errori runtime oscuri (`Unable to instantiate` o proxy che si comportano in modo inatteso), non errori di compilazione — quindi vale la pena verificarli fin dal primo commit del progetto, non scoprirli in produzione.

### L'entity JPA in Kotlin

```kotlin
@Entity
@Table(name = "pizze")
class Pizza(

    @Column(nullable = false)
    val nome: String,

    @Column(nullable = false)
    val prezzo: BigDecimal
) {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null
        protected set
}
```

Nota `id` come `var` nullable con `protected set`: l'id è `null` finché l'entity non viene salvata (il database non lo ha ancora generato), poi diventa non-null — ma non vuoi che il codice applicativo lo riassegni liberamente da fuori, quindi il setter resta `protected`.

### Spring Data JPA: un'interfaccia, zero implementazione

```kotlin
interface PizzaJpaRepository : JpaRepository<Pizza, Long> {

    // il nome del metodo È la query — Spring Data la interpreta e genera l'SQL, come in Java
    fun findByNomeContainingIgnoreCase(frammento: String): List<Pizza>

    @Query("SELECT p FROM Pizza p WHERE p.prezzo BETWEEN :min AND :max ORDER BY p.prezzo")
    fun findInPriceRange(@Param("min") min: BigDecimal, @Param("max") max: BigDecimal): List<Pizza>
}
```

### Il problema N+1, invariato

```kotlin
@Entity
class Ordine(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pizza_id")
    val pizza: Pizza,

    val quantita: Int
) {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null
        protected set
}
```

Stessa regola d'oro della versione Java: `FetchType.LAZY` carica la relazione solo quando viene letta, e leggerla in un loop su molti ordini genera N query separate. La soluzione resta `JOIN FETCH` in una query JPQL esplicita:

```kotlin
@Query("SELECT o FROM Ordine o JOIN FETCH o.pizza WHERE o.id = :id")
fun findWithPizza(@Param("id") id: Long): Ordine?
```

### `@Transactional`, invariato

```kotlin
@Service
class OrdineService(
    private val pizzaRepository: PizzaRepository,
    private val ordineRepository: OrdineRepository
) {
    @Transactional
    fun creaOrdine(dto: CreaOrdineDto): Ordine {
        val pizza = pizzaRepository.trovaPerId(dto.pizzaId)
            ?: throw NoSuchElementException("Pizza non trovata: ${dto.pizzaId}")

        val ordine = Ordine(pizza, dto.quantita)
        return ordineRepository.salva(ordine)
    }
}
```

---

## 8. Configurazioni separate per environment: come fare?

**In pillole**: stessi profili Spring (`application-{profile}.yml`, `@Profile`, `SPRING_PROFILES_ACTIVE`) della versione Java — ma Kotlin aggiunge un modo particolarmente elegante di leggere configurazione tipizzata: `@ConfigurationProperties` legato direttamente a una `data class`.

### `application.yml` e i profili, invariati

```yaml
# application.yml — condiviso da tutti gli ambienti
spring:
  application:
    name: pizzahub

logging:
  level:
    root: INFO
```

```yaml
# application-dev.yml — attivo solo con il profilo "dev"
spring:
  datasource:
    url: jdbc:h2:mem:pizzahub
  h2:
    console:
      enabled: true
  jpa:
    hibernate:
      ddl-auto: update

logging:
  level:
    com.pizzahub: DEBUG
```

```yaml
# application-prod.yml — attivo solo con il profilo "prod"
spring:
  datasource:
    url: ${DATABASE_URL}
    username: ${DATABASE_USER}
    password: ${DATABASE_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: validate
```

> 🧠 **La regola d'oro**: come nella versione Java, `ddl-auto: update` è comodo in sviluppo e pericoloso in produzione — in `prod` usa sempre `validate`, e affida le vere migrazioni di schema a uno strumento versionato come Flyway o Liquibase.

### `@ConfigurationProperties` con `data class`: configurazione tipizzata

```yaml
# application.yml
pizzahub:
  nome-locale: "PizzaHub Centro"
  consegna-gratuita-sopra: 20.00
  numero-forni: 2
```

```kotlin
@ConfigurationProperties(prefix = "pizzahub")
data class PizzaHubProperties(
    val nomeLocale: String,
    val consegnaGratuitaSopra: BigDecimal,
    val numeroForni: Int
)
```

```kotlin
@Configuration
@EnableConfigurationProperties(PizzaHubProperties::class)
class ConfigurazioneApp
```

```kotlin
@Service
class OrdineService(
    private val properties: PizzaHubProperties
    // ...
) {
    fun calcolaSpedizione(totale: BigDecimal): BigDecimal =
        if (totale >= properties.consegnaGratuitaSopra) BigDecimal.ZERO else BigDecimal("3.50")
}
```

> 💡 **Tip**: questo pattern è particolarmente idiomatico in Kotlin perché una `data class` immutabile è **esattamente** ciò che vuoi per rappresentare configurazione: un insieme di valori letti una volta all'avvio, che non cambiano più durante l'esecuzione. Niente `@Value("${...}")` sparsi per il codice, un singolo punto tipizzato e testabile che rappresenta tutta la configurazione dell'applicazione.

### Il principio resta: configurazione esterna, mai hardcoded

```yaml
# ❌ credenziali scritte nel codice
spring:
  datasource:
    password: SuperSegreto123

# ✅ placeholder, valore letto dall'ambiente a runtime
spring:
  datasource:
    password: ${DATABASE_PASSWORD}
```

Stessa regola del [Twelve-Factor App](https://12factor.net/config) vista nella versione Java: configurazione che cambia tra ambienti non finisce mai nel controllo versione.

---

## 9. API first, Security first

**In pillole**: stesso design REST della versione Java — risorse come nomi, verbi HTTP onesti, DTO separati dalle entity — ma Spring Security offre per Kotlin una **DSL dedicata**, più leggibile della configurazione basata su lambda usata in Java.

### DTO come `data class`, non entity sul contratto pubblico

```kotlin
// ❌ espone l'entity di dominio direttamente
@GetMapping("/api/pizze/{id}")
fun dettaglio(@PathVariable id: Long): Pizza = pizzaService.trovaPerId(id)

// ✅ un DTO dedicato: il contratto dell'API è indipendente dallo schema del database
data class PizzaDto(val id: Long, val nome: String, val prezzo: BigDecimal) {
    companion object {
        fun da(pizza: Pizza): PizzaDto = PizzaDto(pizza.id!!, pizza.nome, pizza.prezzo)
    }
}

@GetMapping("/api/pizze/{id}")
fun dettaglio(@PathVariable id: Long): PizzaDto = PizzaDto.da(pizzaService.trovaPerId(id))
```

`companion object` è l'equivalente Kotlin di un metodo `static` Java: un blocco di funzioni "legate alla classe" invece che a un'istanza — qui usato per un factory method idiomatico, `PizzaDto.da(pizza)`.

### Status code onesti

```kotlin
@RestController
@RequestMapping("/api/pizze")
class PizzaRestController(private val pizzaService: PizzaService) {

    @GetMapping("/{id}")
    fun dettaglio(@PathVariable id: Long): ResponseEntity<PizzaDto> {
        val pizza = pizzaService.trovaPerId(id) ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(PizzaDto.da(pizza))
    }

    @PostMapping
    fun crea(@RequestBody @Valid dto: NuovaPizzaDto): ResponseEntity<PizzaDto> {
        val pizza = pizzaService.crea(dto)
        val uri = URI.create("/api/pizze/${pizza.id}")
        return ResponseEntity.created(uri).body(PizzaDto.da(pizza))
    }

    @DeleteMapping("/{id}")
    fun elimina(@PathVariable id: Long): ResponseEntity<Void> {
        pizzaService.elimina(id)
        return ResponseEntity.noContent().build()
    }
}
```

### Validazione con `data class`

```kotlin
data class NuovaPizzaDto(
    @field:NotBlank(message = "Il nome è obbligatorio") val nome: String,
    @field:Positive(message = "Il prezzo deve essere positivo") val prezzo: BigDecimal
)
```

Stesso `@field:` visto nella sezione 6 — sempre necessario quando annoti un parametro del costruttore primario per la validazione Jakarta Bean Validation.

### Spring Security: la DSL Kotlin

```kotlin
@Configuration
@EnableWebSecurity
class SecurityConfig {

    @Bean
    fun filterChain(http: HttpSecurity): SecurityFilterChain {
        http {
            authorizeHttpRequests {
                authorize(HttpMethod.GET, "/api/pizze/**", permitAll)
                authorize("/pizze/**", authenticated)
                authorize(anyRequest, permitAll)
            }
            formLogin { }
            csrf { ignoringRequestMatchers("/api/**") }
        }
        return http.build()
    }

    @Bean
    fun passwordEncoder(): PasswordEncoder = BCryptPasswordEncoder()
}
```

Confronta questa sintassi con l'equivalente Java (una catena di lambda su `HttpSecurity`): la DSL Kotlin di Spring Security (`http { authorizeHttpRequests { ... } }`) usa i **lambda con receiver**, una feature del linguaggio che permette di scrivere configurazione annidata che si legge quasi come un file YAML, restando comunque codice Kotlin type-safe al 100%.

> 🧠 **Golden rule**: `BCryptPasswordEncoder` resta la scelta corretta, invariata rispetto a Java — è un algoritmo di hashing deliberatamente lento, pensato per rendere costosi gli attacchi brute-force. Non cambia per il linguaggio: è una proprietà crittografica, non sintattica.

### Autorizzazione a livello di metodo

```kotlin
@Service
class OrdineService(/* ... */) {

    @PreAuthorize("hasRole('ADMIN')")
    fun elimina(ordineId: Long) {
        ordineRepository.deleteById(ordineId)
    }
}
```

---

## 10. Un progetto completo, vediamolo passo passo

Mettiamo tutto insieme: **PizzaHub**, la stessa app di gestione ordini per una pizzeria vista nella versione Java, questa volta scritta in Kotlin idiomatico dall'inizio alla fine — `data class`, null safety, `sealed interface`, DSL di Spring Security, e test con **MockK** invece di Mockito.

### Cosa fa PizzaHub

```bash
GET  /pizze                  # pannello admin: elenco pizze (Thymeleaf, richiede login)
GET  /api/pizze               # API pubblica: elenco pizze in JSON
POST /api/ordini              { "pizzaId": 1, "quantita": 2 }   # crea un ordine
GET  /api/ordini/{id}         # dettaglio ordine, con il totale calcolato
```

![Flusso delle richieste in PizzaHub](pizzahub-flow.png)

### Struttura del progetto

```
pizzahub/
├── build.gradle.kts
├── src/main/kotlin/com/pizzahub/
│   ├── PizzaHubApplication.kt
│   ├── domain/
│   │   ├── Pizza.kt
│   │   ├── Ordine.kt
│   │   ├── PizzaRepository.kt
│   │   └── OrdineRepository.kt
│   ├── application/
│   │   ├── OrdineService.kt
│   │   ├── PizzaService.kt
│   │   └── dto/
│   │       ├── CreaOrdineDto.kt
│   │       ├── OrdineDto.kt
│   │       └── PizzaDto.kt
│   ├── infrastructure/
│   │   ├── PizzaJpaRepository.kt
│   │   └── OrdineJpaRepository.kt
│   ├── web/
│   │   ├── PizzaMvcController.kt
│   │   └── OrdineRestController.kt
│   └── config/
│       └── SecurityConfig.kt
└── src/main/resources/
    ├── application.yml
    ├── application-dev.yml
    └── templates/
        └── pizze.html
```

### Step 1 — Genera il progetto

Su [start.spring.io](https://start.spring.io): Gradle - Kotlin, Java 21, dipendenze `Spring Web`, `Spring Data JPA`, `Thymeleaf`, `H2 Database`, `Spring Security`, `Validation`. Scarica ed estrai lo zip come `pizzahub/` (sezione 3). Aggiungi manualmente i plugin `kotlin("plugin.spring")` e `kotlin("plugin.jpa")` se Initializr non li include già (sezione 7) — sono essenziali.

### Step 2 — Domain: entity e "porte"

```kotlin
// domain/Pizza.kt
@Entity
class Pizza(

    @Column(nullable = false)
    val nome: String,

    @Column(nullable = false)
    val prezzo: BigDecimal
) {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null
        protected set
}
```

```kotlin
// domain/Ordine.kt
@Entity
class Ordine(

    @ManyToOne(fetch = FetchType.LAZY)
    val pizza: Pizza,

    val quantita: Int
) {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null
        protected set

    init {
        require(quantita > 0) { "La quantita deve essere positiva" }
    }

    fun totale(): BigDecimal = pizza.prezzo.multiply(BigDecimal.valueOf(quantita.toLong()))
}
```

```kotlin
// domain/PizzaRepository.kt
interface PizzaRepository {
    fun trovaPerId(id: Long): Pizza?
    fun tutte(): List<Pizza>
}

// domain/OrdineRepository.kt
interface OrdineRepository {
    fun salva(ordine: Ordine): Ordine
    fun trovaPerId(id: Long): Ordine?
}
```

### Step 3 — Infrastructure: Spring Data JPA

```kotlin
// infrastructure/PizzaJpaRepository.kt
@Repository
interface PizzaJpaRepository : JpaRepository<Pizza, Long>, PizzaRepository {
    override fun trovaPerId(id: Long): Pizza? = findByIdOrNull(id)
    override fun tutte(): List<Pizza> = findAll()
}

// infrastructure/OrdineJpaRepository.kt
@Repository
interface OrdineJpaRepository : JpaRepository<Ordine, Long>, OrdineRepository {
    override fun salva(ordine: Ordine): Ordine = save(ordine)
    override fun trovaPerId(id: Long): Ordine? = findByIdOrNull(id)
}
```

### Step 4 — Application: DTO e service

```kotlin
// application/dto/PizzaDto.kt
data class PizzaDto(val id: Long, val nome: String, val prezzo: BigDecimal) {
    companion object {
        fun da(pizza: Pizza) = PizzaDto(pizza.id!!, pizza.nome, pizza.prezzo)
    }
}

// application/dto/CreaOrdineDto.kt
data class CreaOrdineDto(
    @field:NotNull val pizzaId: Long,
    @field:Positive val quantita: Int
)

// application/dto/OrdineDto.kt
data class OrdineDto(val id: Long, val pizzaNome: String, val quantita: Int, val totale: BigDecimal) {
    companion object {
        fun da(ordine: Ordine) = OrdineDto(ordine.id!!, ordine.pizza.nome, ordine.quantita, ordine.totale())
    }
}
```

```kotlin
// application/PizzaService.kt
@Service
class PizzaService(private val pizzaRepository: PizzaRepository) {
    fun tutte(): List<PizzaDto> = pizzaRepository.tutte().map { PizzaDto.da(it) }
    fun trovaPerId(id: Long): Pizza? = pizzaRepository.trovaPerId(id)
}

// application/OrdineService.kt
@Service
class OrdineService(
    private val pizzaRepository: PizzaRepository,
    private val ordineRepository: OrdineRepository
) {
    @Transactional
    fun creaOrdine(dto: CreaOrdineDto): OrdineDto {
        val pizza = pizzaRepository.trovaPerId(dto.pizzaId)
            ?: throw NoSuchElementException("Pizza non trovata: ${dto.pizzaId}")

        val ordine = Ordine(pizza, dto.quantita)
        return OrdineDto.da(ordineRepository.salva(ordine))
    }
}
```

Nota che `OrdineService` non sa nulla di JPA, Hibernate o HTTP — dipende solo da interfacce definite in `domain`, esattamente come nella versione Java. È quello che rende il service testabile in isolamento (step 7) e il database sostituibile senza toccare una riga di logica di business.

### Step 5 — Web: MVC e REST insieme

```kotlin
// web/PizzaMvcController.kt
@Controller
class PizzaMvcController(private val pizzaService: PizzaService) {

    @GetMapping("/pizze")
    fun elenco(model: Model): String {
        model.addAttribute("pizze", pizzaService.tutte())
        return "pizze"
    }
}

// web/OrdineRestController.kt
@RestController
@RequestMapping("/api")
class OrdineRestController(
    private val pizzaService: PizzaService,
    private val ordineService: OrdineService
) {

    @GetMapping("/pizze")
    fun pizze(): List<PizzaDto> = pizzaService.tutte()

    @PostMapping("/ordini")
    fun creaOrdine(@RequestBody @Valid dto: CreaOrdineDto): ResponseEntity<OrdineDto> {
        val ordine = ordineService.creaOrdine(dto)
        return ResponseEntity.created(URI.create("/api/ordini/${ordine.id}")).body(ordine)
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

```kotlin
// config/DevDataSeeder.kt — dati di esempio, SOLO in sviluppo (sezione 8)
@Configuration
class DevDataSeeder {

    @Bean
    @Profile("dev")
    fun seed(repo: PizzaJpaRepository) = CommandLineRunner {
        repo.save(Pizza("Margherita", BigDecimal("6.50")))
        repo.save(Pizza("Diavola", BigDecimal("8.00")))
    }
}
```

### Step 7 — Sicurezza minima

```kotlin
// config/SecurityConfig.kt
@Configuration
@EnableWebSecurity
class SecurityConfig {

    @Bean
    fun filterChain(http: HttpSecurity): SecurityFilterChain {
        http {
            authorizeHttpRequests {
                authorize("/api/**", permitAll)
                authorize("/pizze/**", authenticated)
                authorize(anyRequest, permitAll)
            }
            formLogin { }
            csrf { ignoringRequestMatchers("/api/**") }
        }
        return http.build()
    }
}
```

### Step 8 — Test, con JUnit 5 e MockK

```kotlin
// src/test/kotlin/com/pizzahub/application/OrdineServiceTest.kt
class OrdineServiceTest {

    @Test
    fun `creaOrdine con pizza esistente calcola il totale corretto`() {
        // Arrange — repository finti, nessun database reale
        val pizzaRepository = mockk<PizzaRepository>()
        val ordineRepository = mockk<OrdineRepository>()

        val margherita = Pizza("Margherita", BigDecimal("6.50"))
        every { pizzaRepository.trovaPerId(1L) } returns margherita
        every { ordineRepository.salva(any()) } answers { firstArg() }

        val service = OrdineService(pizzaRepository, ordineRepository)

        // Act
        val risultato = service.creaOrdine(CreaOrdineDto(pizzaId = 1L, quantita = 3))

        // Assert
        assertEquals(BigDecimal("19.50"), risultato.totale)
        assertEquals("Margherita", risultato.pizzaNome)
    }

    @Test
    fun `creaOrdine con pizza inesistente lancia eccezione`() {
        val pizzaRepository = mockk<PizzaRepository>()
        val ordineRepository = mockk<OrdineRepository>()
        every { pizzaRepository.trovaPerId(99L) } returns null

        val service = OrdineService(pizzaRepository, ordineRepository)

        assertThrows<NoSuchElementException> {
            service.creaOrdine(CreaOrdineDto(pizzaId = 99L, quantita = 1))
        }
    }
}
```

> 🧠 **La regola d'oro**: **MockK** è alla libreria di mocking idiomatica Kotlin quello che Mockito è a Java — con un vantaggio concreto: Mockito storicamente fatica a mockare classi `final` (e, come visto nella sezione 7, in Kotlin le classi sono `final` di default), richiedendo configurazioni extra. MockK è stato progettato da zero pensando alle caratteristiche di Kotlin: mocka `final class` senza configurazione aggiuntiva, ha una sintassi (`every { } returns`, `verify { }`) che sfrutta i lambda con receiver dello stesso linguaggio del codice che stai testando.

```kotlin
// test dell'endpoint REST, con il vero context Spring avviato
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class OrdineRestControllerTest {

    @Autowired lateinit var mockMvc: MockMvc

    @Test
    fun `post ordini con payload valido ritorna 201`() {
        mockMvc.post("/api/ordini") {
            contentType = MediaType.APPLICATION_JSON
            content = """{ "pizzaId": 1, "quantita": 2 }"""
        }.andExpect {
            status { isCreated() }
        }
    }
}
```

`lateinit var` è il modo Kotlin di dichiarare "questa proprietà non ha un valore adesso, ma ne avrà uno prima che venga letta" — usato qui perché `@Autowired` inietta `mockMvc` **dopo** la costruzione dell'oggetto, quindi non può essere un `val` inizializzato nel costruttore. Il compilatore ti fida sulla parola: se leggi `mockMvc` prima che Spring lo inietti, ottieni un'eccezione a runtime, non un errore di compilazione — motivo per cui `lateinit` va usato con parsimonia, solo dove il framework (non tu) controlla il timing dell'inizializzazione.

> 💡 **Tip**: `mockMvc.post("/api/ordini") { ... }` è la DSL Kotlin di Spring MVC Test, alternativa a `mockMvc.perform(post(...))` — stessa logica della DSL di Spring Security vista nella sezione 9: lambda con receiver che rendono la configurazione annidata leggibile come un blocco dichiarativo.

```bash
./gradlew test                                    # tutti i test
./gradlew test --tests OrdineServiceTest             # una singola classe
```

### Step 9 — Avvia e prova

```bash
./gradlew bootRun --args='--spring.profiles.active=dev'
```

```bash
curl http://localhost:8080/api/pizze
# [{"id":1,"nome":"Margherita","prezzo":6.50}, {"id":2,"nome":"Diavola","prezzo":8.00}]

curl -X POST http://localhost:8080/api/ordini \
  -H "Content-Type: application/json" \
  -d '{"pizzaId": 1, "quantita": 3}'
# 201 {"id":1,"pizzaNome":"Margherita","quantita":3,"totale":19.50}
```

Un ultimo tocco professionale: gestisci `NoSuchElementException` con un `404` onesto invece di lasciar trapelare un `500` generico:

```kotlin
// web/GestoreErrori.kt
@RestControllerAdvice
class GestoreErrori {

    @ExceptionHandler(NoSuchElementException::class)
    fun gestisciNonTrovato(e: NoSuchElementException): ResponseEntity<Map<String, String>> =
        ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapOf("errore" to (e.message ?: "Non trovato")))
}
```

### Concetti applicati

- **Sezione 1**: `data class` per DTO ed entity, null safety con `?`/`?:`, `sealed interface` per errori di dominio, `val` come default
- **Sezione 2**: constructor injection nativo nel costruttore primario, stereotype annotation invariate
- **Sezione 5**: separazione in `domain` / `application` / `infrastructure` / `web`, con dipendenze verso l'interno
- **Sezione 6**: `@Controller` + Thymeleaf per il pannello admin, `@RestController` per l'API, `data class` per i form
- **Sezione 7**: i plugin `kotlin-spring`/`kotlin-jpa` per risolvere l'attrito tra classi `final` e Hibernate, `Pizza?` al posto di `Optional<Pizza>`
- **Sezione 8**: `@ConfigurationProperties` legato a una `data class` per configurazione tipizzata
- **Sezione 9**: DTO come `data class`, status code onesti, DSL Kotlin di Spring Security
- **Sezione 10 stessa**: test unitari con MockK, test di integrazione con la DSL di MockMvc

---

## 🎉 Ce l'hai fatta!

Hai completato **Booting Spring Boot — Kotlin Edition**. Ora sai:

- Come Kotlin cambia il paradigma OOP rispetto a Java: `val`/`var`, null safety nel sistema dei tipi, `data class`, classi `final` di default, `sealed interface` per il pattern matching esaustivo
- Come Inversion of Control e Dependency Injection diventino ancora più naturali grazie al costruttore primario
- Come generare un progetto Kotlin da Spring Initializr, e perché servono `jackson-module-kotlin` e `kotlin-reflect`
- Le differenze pragmatiche tra Gradle Kotlin DSL e Maven, e perché il primo è l'accoppiamento più naturale con un progetto Kotlin
- Clean Code e Clean Architecture applicate con `data class` immutabili, `sealed interface` per gli errori di dominio, ed extension function per il mapping tra strati
- Come costruire viste moderne con Thymeleaf, con form binding tramite `data class` (e il dettaglio di `@field:` da non dimenticare)
- Perché JPA e Kotlin hanno bisogno dei plugin `kotlin-spring`/`kotlin-jpa`, e come `Pizza?` sostituisce `Optional<Pizza>`
- Come tipizzare la configurazione per ambiente con `@ConfigurationProperties` e una `data class`
- Come progettare una API REST pulita con DTO come `data class`, e come usare la DSL Kotlin di Spring Security
- Come mettere tutto insieme in **PizzaHub**, con MockK al posto di Mockito per test idiomatici

**Dove andare da qui?**

- 📖 [Spring Framework Kotlin Support](https://docs.spring.io/spring-framework/reference/languages/kotlin.html) — la documentazione ufficiale sul supporto Kotlin in Spring
- 🧪 [Kotlin Documentation](https://kotlinlang.org/docs/home.html) — la reference ufficiale del linguaggio, sempre aggiornata
- 🎯 [MockK Documentation](https://mockk.io) — la guida completa alla libreria di mocking usata nella sezione 10
- 📘 *Kotlin in Action* di Dmitry Jemerov e Svetlana Isakova — il libro di riferimento per capire Kotlin in profondità, scritto da chi lo ha progettato
- ☕ [Booting Spring Boot — Java Edition](/it/playbook/spring) — confronta lo stesso identico progetto, PizzaHub, scritto in Java: utile per capire cosa cambia davvero tra i due linguaggi e cosa invece è puro Spring

> 🧠 **Un ultimo consiglio**: Kotlin non è "Java migliore" in astratto — è un linguaggio con scelte di design diverse, che in certi contesti (null safety, concisione, DSL type-safe) tolgono attrito reale. Ma l'attrito con JPA visto nella sezione 7 è concreto, non immaginario: se il tuo team non ha esperienza Kotlin e il progetto è già Java maturo, la migrazione va valutata con pragmatismo, non per moda. Se invece parti da zero, o il team è già a suo agio con Kotlin, è una scelta solida per un backend enterprise robusto e manutenibile. Buon coding! 🎯
