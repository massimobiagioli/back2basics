# Symfony is Alive and Kicking

"Wait, isn't PHP dead?" It's the question anyone who says they write PHP in 2026 hears, usually from someone whose last look at PHP was in 2010 — associative arrays everywhere, `mysql_query()` concatenated with hand-built strings, zero types, zero structure. That PHP really is dead, and rightly so. Today's PHP is a different language: typed, with `enum`, `readonly`, pattern matching via `match`, and a framework — **Symfony** — robust enough to run bank-grade enterprise applications, handle millions of requests a day, and power everything from e-commerce platforms and back-office systems to — surprise — a good chunk of the modern WordPress/Drupal ecosystem, on top of being the foundation several components of Laravel itself are built on.

Symfony was born in 2005, well before "clean architecture" and "dependency injection" were common words in the PHP world. Today it's on version 7, and it's arguably the most rigorous PHP framework on the market: a mature Service Container, components reusable even outside Symfony itself (Symfony Console powers Laravel Artisan, Symfony HttpFoundation is everywhere), and an ecosystem — **Doctrine** for the ORM, **Twig** for templating, **Messenger** for async — that covers every real need of a modern backend.

This playbook starts from modern PHP (the real one, not the 2006 version) and ends with a complete, dockerized project — **PizzaHub**, the same pizzeria order-management app seen in this platform's Spring Boot playbooks, this time in Symfony — passing through the most common design patterns, correct ORM usage, and pragmatic async handling in a historically synchronous language. Clear, clean, pragmatic, no frills: whether you're 12 and curious, or you have a deadline tomorrow morning, this playbook is written for both of you.

---

## 1. Modern PHP (latest version): the language isn't dead!

**One-liner**: PHP 8.3/8.4 has almost nothing in common with the PHP you'd find in 2008-era tutorials. Native scalar types, `enum`, `readonly` properties, `match`, the nullsafe operator, attributes instead of annotation-comments: the language stopped being "the one without types" years ago.

### Scalar types and `declare(strict_types=1)`

```php
<?php
declare(strict_types=1);

function calcolaTotale(float $prezzo, int $quantita): float
{
    return $prezzo * $quantita;
}

calcolaTotale(6.50, 3);      // ✅ fine
calcolaTotale("6.50", 3);    // ❌ TypeError: PHP no longer silently converts the string
```

🧠 **Analogy**: PHP without `strict_types` is like a warehouse worker who accepts any box that arrives, tries to guess what's inside, and sometimes gets it silently wrong. With `declare(strict_types=1)` at the top of the file, that worker checks the label before accepting the box: if you declare `float`, a `float` must arrive — not a string that merely "looks like" a number.

> 💡 **Tip**: `declare(strict_types=1)` must be written in **every file** that declares typed functions — it's not a project-wide setting. In a new Symfony project, it's good practice to put it as the first line of every PHP class, no exceptions.

### `enum`: no more scattered constants

```php
// ❌ "old-style" PHP: disconnected constants, no guarantee the value is one of these
class StatoOrdine
{
    const IN_ATTESA = 'in_attesa';
    const CONFERMATO = 'confermato';
    const CONSEGNATO = 'consegnato';
}

// ✅ PHP 8.1+: a real enum, with the compiler guaranteeing the possible values
enum StatoOrdine: string
{
    case InAttesa = 'in_attesa';
    case Confermato = 'confermato';
    case Consegnato = 'consegnato';

    public function label(): string
    {
        return match($this) {
            self::InAttesa => 'Pending',
            self::Confermato => 'Confirmed',
            self::Consegnato => 'Delivered',
        };
    }
}

$stato = StatoOrdine::Confermato;
echo $stato->label();   // "Confirmed"
echo $stato->value;     // "confermato"
```

> 🧠 **Golden rule**: a PHP `enum` isn't "a class with some constants inside" — it's a closed type: a variable declared as `StatoOrdine` can hold **only** one of the declared cases, never an arbitrary string. This eliminates an entire category of bugs ("I typo'd 'confermto' and nobody noticed until production") that used to be perfectly normal with old-style string constants.

### `readonly`: declared immutability, not hoped-for immutability

```php
final class Pizza
{
    public function __construct(
        public readonly string $nome,
        public readonly float $prezzo,
    ) {}
}

$pizza = new Pizza('Margherita', 6.50);
$pizza->prezzo = 5.50;   // ❌ Error: Cannot modify readonly property Pizza::$prezzo
```

Notice also the **constructor property promotion**: declaring `public readonly string $nome` directly in the constructor signature declares **and** assigns the property in one shot — no more hand-written `private $nome; public function __construct($nome) { $this->nome = $nome; }`.

### `match`: a `switch` that won't betray you

```php
// ❌ switch: silent fallthrough if you forget a break, weak comparison (==)
switch ($stato) {
    case 'in_attesa':
        $messaggio = 'Pending';
        break;
    case 'confermato':
        $messaggio = 'Confirmed';
        // missing break: falls through to the next case by mistake!
    case 'consegnato':
        $messaggio = 'Delivered';
        break;
}

// ✅ match: strict comparison (===), no fallthrough, it's an expression (returns a value)
$messaggio = match($stato) {
    'in_attesa' => 'Pending',
    'confermato' => 'Confirmed',
    'consegnato' => 'Delivered',
    default => throw new \ValueError("Unknown status: $stato"),
};
```

### Nullsafe operator: no more `if ($x !== null && $x->y !== null)`

```php
// ❌ before PHP 8.0: nested checks for every possible null
$citta = null;
if ($ordine !== null) {
    $cliente = $ordine->getCliente();
    if ($cliente !== null) {
        $indirizzo = $cliente->getIndirizzo();
        if ($indirizzo !== null) {
            $citta = $indirizzo->getCitta();
        }
    }
}

// ✅ PHP 8.0+: one line, stops at the first null and returns null
$citta = $ordine?->getCliente()?->getIndirizzo()?->getCitta();
```

### Attributes: metadata in the language, not in comments

```php
// ❌ "old-style" PHP (with pre-8.0 Symfony/Doctrine): annotations inside comments, parsed at runtime by a library
/**
 * @Route("/api/pizze", methods={"GET"})
 */
public function elenco(): JsonResponse { /* ... */ }

// ✅ PHP 8.0+: native attributes, part of the syntax, checked by the parser
#[Route('/api/pizze', methods: ['GET'])]
public function elenco(): JsonResponse { /* ... */ }
```

> 💡 **Tip**: attributes aren't just "nicer syntax" — they're part of the language grammar, so an IDE understands them natively (autocomplete, safe refactoring), whereas the old comment-based annotations were plain strings that a library had to parse at runtime with its own rules.

### First-class callable syntax

```php
$pizze = ['Margherita', 'diavola', 'Quattro Formaggi'];

// PHP 8.1+: pass a function as a value, without clumsy wrapping
$maiuscole = array_map(strtoupper(...), $pizze);

// instead of the old string or array-callable syntax
$maiuscole = array_map('strtoupper', $pizze);
$maiuscole = array_map([$this, 'formatta'], $pizze);   // even clumsier with instance methods
```

---

## 2. The core concepts of the PHP framework

**One-liner**: Symfony rests on two concepts — the **Service Container** (who creates and manages objects) and **Dependency Injection** (how those objects receive their own dependencies) — plus **Bundles** and **Routing** as the composition and HTTP-exposure mechanisms. Same Inversion of Control philosophy seen in other enterprise frameworks, with its own vocabulary.

### The Service Container: who builds what

```php
// src/Service/OrdineService.php
final class OrdineService
{
    public function __construct(
        private readonly PizzaRepository $pizzaRepository,
        private readonly OrdineRepository $ordineRepository,
    ) {}
}
```

You never write `new OrdineService(...)` scattered around application code: Symfony sees the constructor, understands that `OrdineService` needs a `PizzaRepository` and an `OrdineRepository`, and injects them automatically when someone else asks the container for an `OrdineService`. This is called **autowiring**, and it's on by default in every modern Symfony project — no need for XML/YAML configuration per individual service, unlike the framework's earlier versions.

🧠 **Analogy**: the Service Container is like a large company's switchboard: you don't need to know every colleague's direct extension (build every object by hand) — you ask the switchboard "put me through to the order service", and it takes care of fetching everything needed, including dependencies of dependencies, without you having to think about it.

### Routing: from URLs to controllers

```php
// src/Controller/PizzaController.php
#[Route('/api/pizze')]
final class PizzaController extends AbstractController
{
    #[Route('', name: 'pizze_elenco', methods: ['GET'])]
    public function elenco(PizzaService $pizzaService): JsonResponse
    {
        return $this->json($pizzaService->tutte());
    }

    #[Route('/{id}', name: 'pizze_dettaglio', methods: ['GET'])]
    public function dettaglio(int $id, PizzaService $pizzaService): JsonResponse
    {
        return $this->json($pizzaService->trovaPerId($id));
    }
}
```

Notice `PizzaService $pizzaService` as a method parameter, not a constructor one: Symfony injects services directly into action methods too, not just the constructor — useful for services used in only one action, without carrying them across the whole controller.

### HttpKernel: the Request → Response cycle

Every HTTP framework has, under the hood, the same shape: a `Request` comes in, something processes it, a `Response` comes out. In Symfony, that "something" is **HttpKernel**, and the cycle fires through events (`kernel.request`, `kernel.controller`, `kernel.response`) you can hook into — it's where things like authentication, CORS, and centralized error handling live.

```php
// conceptually, every request follows this shape:
// Request → Router (finds the right controller) → Controller (runs the logic)
//         → Response → (any kernel.response listeners) → back to the client
```

### Symfony Flex: "packages that configure themselves"

```bash
composer require symfony/orm-pack
# Flex doesn't just install Doctrine: it also creates the configuration files,
# the required .env variables, and the default directories — no manual editing
```

**Symfony Flex** is a Composer plugin that watches what you install and automatically applies the "recipes" — configuration, bundle registration, file scaffolding — associated with that package. It's why in a modern Symfony project you rarely touch `config/bundles.php` by hand: Flex does it for you when you install something.

---

## 3. Good Parts vs Bad Parts

**One-liner**: PHP has a long, imperfect history — arrays that are simultaneously lists, maps, and generic data structures, a standard library with inconsistent naming (`str_replace` but `strpos`, with no clear scheme), and years of `$_GET`/`$_POST` code with no validation. Modern PHP didn't erase that history, but made it **optional**: you can write type-safe, testable, predictable code, if you choose to.

### The historical "bad parts", and why they survive

```php
// ❌ weak comparison: "0" == false is true, "abc" == 0 used to be true before PHP 8 (it's false today, but history is instructive)
if ($input == 0) { /* ... */ }

// ✅ strict comparison: no implicit conversion
if ($input === 0) { /* ... */ }
```

```php
// ❌ superglobals used directly in the controller: no validation, no type, hard to test
$nome = $_POST['nome'];

// ✅ Symfony: the Request is an object, typed, with methods that validate access
public function crea(Request $request): JsonResponse
{
    $nome = $request->request->get('nome');   // still an arbitrary string...
    // ...but with a validated DTO (section 7), the data arrives already checked before the controller
}
```

> 🧠 **Golden rule**: PHP didn't "fix" its historical flaws by removing them — it fixed them by making them **unnecessary** to use in a well-structured project. `$_POST` still exists and is still dangerous to use directly, but in a serious Symfony app you never touch it: you go through `Request`, validated DTOs, and the Form component (section 7). The "bad" language sticks around for historical compatibility — the framework gives you the tools to never have to encounter it.

### The modern "good parts"

| Feature | What it solves |
|---|---|
| `declare(strict_types=1)` | Eliminates implicit, surprising type conversions |
| Composer + PSR-4 autoloading | No more scattered `require_once`, predictable namespaces |
| PSR (PHP Standard Recommendations) | Interoperability between libraries from different vendors (PSR-7 for HTTP, PSR-3 for logging...) |
| `enum`, `readonly`, union/intersection types | A type system approaching languages like TypeScript or Kotlin |
| Native attributes | Metadata checked by the parser, not strings interpreted at runtime |

> 💡 **Tip**: if you're evaluating PHP for a new project in 2026, evaluate **PHP 8.3+ with Symfony**, not "PHP" in the abstract. The gap between the two worlds (procedural PHP 5 vs PHP 8 with Symfony) is as large as the gap between ES5 JavaScript and modern TypeScript — they're effectively different development experiences that just happen to share a base language's name.

---

## 4. Clean Code, Clean Architecture

**One-liner**: the same four layers seen in this platform's other playbooks — `Domain`, `Application`, `Infrastructure`, `Presentation` — applied to Symfony. The dependency rule doesn't change: dependencies always point inward, toward the domain.

### Clean Code, in practice

```php
// ❌ a lying name, a function that does too much
function elabora(array $d): array
{
    $r = [];
    foreach ($d as $x) {
        if ($x > 0) {
            $r[] = $x * 2;
        }
    }
    return $r;
}

// ✅ honest name, single responsibility
function raddoppiaValoriPositivi(array $numeri): array
{
    return array_map(
        fn(int $n) => $n * 2,
        array_filter($numeri, fn(int $n) => $n > 0)
    );
}
```

### The four layers, applied to Symfony

```
src/
├── Domain/            ← core: entities, value objects, repository interfaces. ZERO dependency on Symfony
├── Application/          ← services, use cases, DTOs. Depends only on Domain
├── Infrastructure/         ← Doctrine implementations, external clients. Implements Domain's interfaces
└── Presentation/             ← Controllers (HTML and API). The entry point, wired together via Dependency Injection
```

![Clean Architecture in Symfony](symfony-clean-architecture.png)

```php
// src/Domain/PizzaRepositoryInterface.php — the interface (the "port") lives in Domain
interface PizzaRepositoryInterface
{
    public function trovaPerId(int $id): ?Pizza;
    public function tutte(): array;
}
```

```php
// src/Infrastructure/Doctrine/PizzaRepository.php — the implementation lives outside, and DEPENDS on Domain
final class PizzaRepository extends ServiceEntityRepository implements PizzaRepositoryInterface
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Pizza::class);
    }

    public function trovaPerId(int $id): ?Pizza
    {
        return $this->find($id);
    }

    public function tutte(): array
    {
        return $this->findAll();
    }
}
```

```yaml
# config/services.yaml — binds the interface to the concrete implementation
services:
    App\Domain\PizzaRepositoryInterface:
        alias: App\Infrastructure\Doctrine\PizzaRepository
```

The concrete benefit: `OrdineService` (Application) depends only on `PizzaRepositoryInterface` (Domain), never directly on the Doctrine implementation — you can test it with a fake in-memory repository without ever starting a real database (section 9), and swap ORMs by touching only `Infrastructure`.

### Rich model vs anemic model

```php
// ❌ anemic model: just getters/setters, all the logic scattered across services
final class Ordine
{
    private array $righe = [];
    public function getRighe(): array { return $this->righe; }
    public function setRighe(array $righe): void { $this->righe = $righe; }
}

// ✅ rich model: the entity protects its own rules
final class Ordine
{
    /** @var RigaOrdine[] */
    private array $righe = [];

    public function aggiungiRiga(Pizza $pizza, int $quantita): void
    {
        if ($quantita <= 0) {
            throw new \InvalidArgumentException('Quantity must be positive');
        }
        $this->righe[] = new RigaOrdine($pizza, $quantita);
    }

    public function totale(): float
    {
        return array_sum(array_map(fn(RigaOrdine $r) => $r->subtotale(), $this->righe));
    }
}
```

> 🧠 **Golden rule**: the anemic model is the most common anti-pattern in enterprise PHP code, just as much as it is in Java or C#. A rich model like `Ordine` above can answer questions about its own state on its own (`totale()`) and protects its own invariants (`aggiungiRiga` rejects negative quantities) — business logic lives where the data it involves lives, not scattered across controllers.

---

## 5. The most common design patterns

**One-liner**: Symfony doesn't invent new patterns — it applies the Gang of Four classics extremely pragmatically, often making them part of the framework itself instead of leaving them as an exercise for the developer.

### Repository: abstracting persistence

Already seen in section 4 — an interface in Domain, a Doctrine implementation in Infrastructure. It's by far the most-used pattern in any mature Symfony project.

### Strategy: interchangeable behaviors

```php
interface CalcolatoreSconto
{
    public function calcola(float $totale): float;
}

final class ScontoPercentuale implements CalcolatoreSconto
{
    public function __construct(private readonly float $percentuale) {}
    public function calcola(float $totale): float { return $totale * (1 - $this->percentuale); }
}

final class ScontoFisso implements CalcolatoreSconto
{
    public function __construct(private readonly float $importo) {}
    public function calcola(float $totale): float { return max(0, $totale - $this->importo); }
}

// the calling code doesn't know (and doesn't care) WHICH strategy it's using
final class OrdineService
{
    public function __construct(private readonly CalcolatoreSconto $calcolatoreSconto) {}

    public function totaleScontato(Ordine $ordine): float
    {
        return $this->calcolatoreSconto->calcola($ordine->totale());
    }
}
```

### Decorator: Symfony offers it as a container feature

```php
#[AsDecorator(decorates: PizzaRepositoryInterface::class)]
final class PizzaRepositoryConCache implements PizzaRepositoryInterface
{
    public function __construct(
        #[AutowireDecorated] private readonly PizzaRepositoryInterface $repository,
        private readonly CacheInterface $cache,
    ) {}

    public function trovaPerId(int $id): ?Pizza
    {
        return $this->cache->get("pizza_$id", fn() => $this->repository->trovaPerId($id));
    }
}
```

🧠 **Analogy**: **service decoration** is like putting a protective case around a phone — the phone (the original service) keeps working exactly as before, but the case (the decorator) adds extra behavior (here, caching) without the phone itself needing to know about it. Anything using `PizzaRepositoryInterface` elsewhere in the code doesn't notice the difference.

### Observer: `EventDispatcher`

```php
final class OrdineCreatoEvent
{
    public function __construct(public readonly Ordine $ordine) {}
}

// wherever the order gets created
$this->eventDispatcher->dispatch(new OrdineCreatoEvent($ordine));

// elsewhere in the codebase, completely decoupled
#[AsEventListener(event: OrdineCreatoEvent::class)]
final class InviaEmailConfermaListener
{
    public function __invoke(OrdineCreatoEvent $event): void
    {
        // send the email, without OrdineService ever knowing this listener exists
    }
}
```

This is the **Observer** pattern applied idiomatically: whoever creates the order doesn't know (and doesn't need to know) who else will react to that event — sending an email, updating a dashboard, notifying an external service are all decoupled responsibilities, addable without touching `OrdineService`.

### Command: Console and Messenger

```php
#[AsCommand(name: 'app:pulisci-ordini-scaduti')]
final class PulisciOrdiniScadutiCommand extends Command
{
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        // ...
        return Command::SUCCESS;
    }
}
```

Every Symfony console command is an implementation of the **Command** pattern: it encapsulates an action ("clean up expired orders") as an object — executable, schedulable, testable in isolation — the same pattern we'll meet again in section 8 with Symfony Messenger.

---

## 6. ORM: how do you use it well?

**One-liner**: **Doctrine** is Symfony's standard ORM — mature, powerful, and with the same pitfalls as any ORM (the N+1 problem above all). Using it well means understanding what it does "under the hood", not just how to annotate entities.

### The Doctrine entity

```php
#[ORM\Entity(repositoryClass: PizzaRepository::class)]
#[ORM\Table(name: 'pizze')]
class Pizza
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 100)]
    private string $nome;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 2)]
    private string $prezzo;   // Doctrine maps DECIMAL to string to avoid losing precision on floats

    public function __construct(string $nome, string $prezzo)
    {
        $this->nome = $nome;
        $this->prezzo = $prezzo;
    }

    public function getId(): ?int { return $this->id; }
    public function getNome(): string { return $this->nome; }
    public function getPrezzo(): string { return $this->prezzo; }
}
```

> 💡 **Tip**: mapping a price to `type: 'decimal'` and reading it back as `string` in PHP (not `float`) isn't a nitpick — binary floats don't exactly represent decimal values like `0.10`, and on repeated monetary calculations that imprecision accumulates. Use `string` (or a library like `brick/money`) for any value representing money.

### Relationships, and the N+1 problem

```php
#[ORM\Entity]
class Ordine
{
    #[ORM\ManyToOne(targetEntity: Pizza::class)]
    #[ORM\JoinColumn(nullable: false)]
    private Pizza $pizza;

    #[ORM\Column]
    private int $quantita;
}
```

```php
// ❌ N+1: one query for the orders, then ONE query for every single related pizza
$ordini = $ordineRepository->findAll();
foreach ($ordini as $ordine) {
    echo $ordine->getPizza()->getNome();   // every call triggers a separate query!
}
```

```php
// ✅ explicit fetch join: a single query for everything
public function tuttiConPizza(): array
{
    return $this->createQueryBuilder('o')
        ->addSelect('p')
        ->join('o.pizza', 'p')
        ->getQuery()
        ->getResult();
}
```

> 🧠 **Golden rule**: the N+1 problem isn't a Doctrine flaw — it's an inevitable consequence of *lazy loading*, present in every ORM (Hibernate in Java, Entity Framework in .NET, ActiveRecord in Rails). The difference between an app that scales and one that grinds to a halt with 1,000 orders is often exactly this: knowing when an explicit fetch join is needed, instead of discovering it from slow-query logs in production.

### DQL: type-safe queries on entities, not tables

```php
public function findInFasciaPrezzo(float $min, float $max): array
{
    return $this->getEntityManager()
        ->createQuery('
            SELECT p FROM App\Domain\Pizza p
            WHERE p.prezzo BETWEEN :min AND :max
            ORDER BY p.prezzo
        ')
        ->setParameter('min', $min)
        ->setParameter('max', $max)
        ->getResult();
}
```

DQL (Doctrine Query Language) looks like SQL but operates on **entities and properties**, not tables and columns — rename a column in the database, and as long as the PHP property stays the same, your DQL queries keep working with no changes.

### Migrations: versioned schema, never by hand

```bash
php bin/console make:migration        # generates a migration by diffing entities against the current schema
php bin/console doctrine:migrations:migrate   # applies pending migrations
```

> 💡 **Tip**: never use `doctrine:schema:update --force` in production — it's Doctrine's equivalent of Hibernate's `ddl-auto: update`, very convenient in development and dangerous on a real database because it can alter the schema in unreviewed ways. Versioned migrations (`make:migration`) are the only safe way to evolve the schema in production: every change is a file, reviewable in code review, applicable in order.

---

## 7. Modern MVC

**One-liner**: Symfony Controllers are services just like any other (constructor injection included), **Twig** is the template engine — secure against XSS by default — and the **Form component** handles validation and binding declaratively, without ever touching `$_POST` by hand.

### Controller as a service

```php
#[Route('/pizze')]
final class PizzaController extends AbstractController
{
    public function __construct(private readonly PizzaService $pizzaService) {}

    #[Route('', name: 'pizze_elenco', methods: ['GET'])]
    public function elenco(): Response
    {
        return $this->render('pizze/elenco.html.twig', [
            'pizze' => $this->pizzaService->tutte(),
        ]);
    }
}
```

### Twig: secure by default templates

```twig
{# templates/pizze/elenco.html.twig #}
<h1>Our pizzas</h1>
<ul>
    {% for pizza in pizze %}
        <li>{{ pizza.nome }} — {{ pizza.prezzo }} €</li>
    {% else %}
        <li>No pizzas available, check back later!</li>
    {% endfor %}
</ul>
```

> 🧠 **Golden rule**: Twig applies **HTML auto-escaping by default** to every variable printed with `{{ }}` — if `pizza.nome` contained `<script>alert(1)</script>`, Twig would display it as harmless text, not execute it as HTML. You have to explicitly write `{{ value|raw }}` to disable this protection, and doing so is a signal to stop and ask "am I sure this content is trusted?" first.

### The Form component: declarative validation

```php
// src/Form/NuovaPizzaType.php
final class NuovaPizzaType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('nome', TextType::class, [
                'constraints' => [new NotBlank(), new Length(max: 100)],
            ])
            ->add('prezzo', NumberType::class, [
                'constraints' => [new Positive()],
            ]);
    }
}
```

```php
#[Route('/pizze/nuova', methods: ['GET', 'POST'])]
public function nuova(Request $request, PizzaService $pizzaService): Response
{
    $form = $this->createForm(NuovaPizzaType::class);
    $form->handleRequest($request);

    if ($form->isSubmitted() && $form->isValid()) {
        $pizzaService->crea($form->getData());
        return $this->redirectToRoute('pizze_elenco');   // Post-Redirect-Get
    }

    return $this->render('pizze/nuova.html.twig', ['form' => $form]);
}
```

> 💡 **Tip**: `redirectToRoute` after a successful submit isn't an arbitrary style choice — it's the **Post-Redirect-Get** pattern, also seen in this platform's other playbooks: if the user reloads the page after saving, the browser repeats the last `GET` (harmless), not the last `POST` (which would otherwise create a duplicate pizza).

### API Controller: JSON, DTOs, honest status codes

```php
#[Route('/api/ordini', methods: ['POST'])]
public function creaOrdine(
    #[MapRequestPayload] CreaOrdineDto $dto,
    OrdineService $ordineService,
): JsonResponse {
    $ordine = $ordineService->creaOrdine($dto);
    return $this->json($ordine, Response::HTTP_CREATED);
}
```

`#[MapRequestPayload]` automatically deserializes and **validates** the JSON request body into the typed DTO, rejecting malformed payloads with a `422` before your controller code even runs — the same principle as the `@Valid` seen in this platform's other frameworks.

---

## 8. How do I handle async?

**One-liner**: PHP was born synchronous and process-per-request (every HTTP request runs in a separate PHP-FPM process, which ends when the response is sent) — it isn't Node.js with its event loop. But "PHP is synchronous" doesn't mean "PHP can't handle async work": it just means async is achieved with different tools, and knowing when to reach for them is the pragmatic part.

### The basic model: PHP-FPM, one process per request

```
HTTP request → Nginx → PHP-FPM assigns a worker process
                              → the process runs EVERYTHING synchronously
                              → response sent → the process becomes available again
```

🧠 **Analogy**: PHP-FPM is like a restaurant with many waiters, each following a single customer's order from start to finish, never leaving it halfway to serve someone else. Node.js, by contrast, is like one hyper-efficient waiter who takes ten orders in sequence and serves each one the moment the kitchen (the I/O) finishes it, never standing idle waiting. Neither model is "wrong" — they handle load differently, and PHP-FPM scales by adding more waiters (workers), not by making a single waiter more multitasking.

This means a slow HTTP request (one that calls three external APIs in sequence) blocks that worker for its entire duration — but it does **not** block other requests, which get handled by other workers in parallel. For most web applications, this model is more than sufficient.

### Symfony Messenger: "real" async for background work

When an operation is too slow to fit inside the request-response cycle (sending 10,000 emails, generating a heavy report), the pragmatic answer isn't "make PHP asynchronous" — it's **moving the work out of the HTTP cycle**, into a queue.

```php
// the message: a simple DTO
final class InviaEmailOrdine
{
    public function __construct(public readonly int $ordineId) {}
}

// the controller publishes the message and responds IMMEDIATELY, without waiting for the send
#[Route('/api/ordini', methods: ['POST'])]
public function creaOrdine(
    #[MapRequestPayload] CreaOrdineDto $dto,
    OrdineService $ordineService,
    MessageBusInterface $bus,
): JsonResponse {
    $ordine = $ordineService->creaOrdine($dto);
    $bus->dispatch(new InviaEmailOrdine($ordine->getId()));   // returns right away, the send happens elsewhere
    return $this->json($ordine, Response::HTTP_CREATED);
}

// a separate handler, run by a background worker
#[AsMessageHandler]
final class InviaEmailOrdineHandler
{
    public function __invoke(InviaEmailOrdine $message): void
    {
        // send the email — even if it takes 3 seconds, the HTTP client never waited
    }
}
```

```yaml
# config/packages/messenger.yaml
framework:
    messenger:
        transports:
            async: '%env(MESSENGER_TRANSPORT_DSN)%'   # RabbitMQ, Redis, Doctrine, SQS...
        routing:
            App\Message\InviaEmailOrdine: async
```

```bash
php bin/console messenger:consume async   # the worker that processes queued messages
```

> 🧠 **Golden rule**: **Symfony Messenger** solves the real problem most teams actually have with "async" — you don't need an event loop, you need to **stop making the user wait** for work that shouldn't block the response. The transport (RabbitMQ, Redis, or even just Doctrine's `messenger_messages` table to start without extra infrastructure) fully decouples "when the request arrives" from "when the work runs".

### Fibers (PHP 8.1+) and event-driven frameworks

For the opposite scenario — a single process handling **thousands of concurrent connections** without a worker for each one, typical of WebSockets or extremely high-throughput microservices — PHP 8.1 introduced **Fibers**, low-level primitives for cooperative concurrency, which frameworks like **ReactPHP** and **Swoole** are built on.

```php
// conceptually: a Fiber suspends execution during an I/O operation,
// leaving the process free to handle other work in the meantime
$fiber = new Fiber(function (): void {
    $valore = Fiber::suspend('suspended here');
    echo "Resumed with: $valore\n";
});
```

> 💡 **Tip**: Fibers are an implementation detail that **frameworks** like ReactPHP and Swoole are built on — in the vast majority of Symfony projects you never touch them directly, just as you rarely write raw `Promise` code by hand in a Node.js app that uses `async`/`await`. For a "normal" Symfony app (even a very large one), PHP-FPM + Messenger covers practically every real need. Reach for Swoole/ReactPHP only when you have a concrete requirement for extreme single-process concurrency — not out of principle.

---

## 9. A complete example (dockerized), step by step

Let's put it all together: **PizzaHub**, the same pizzeria order-management app seen in this platform's Spring Boot playbooks — this time in Symfony, fully dockerized: PHP-FPM, Nginx, PostgreSQL, all orchestrated with `docker-compose`.

### What PizzaHub does

```bash
GET  /pizze                  # admin panel: list of pizzas (Twig, requires login)
GET  /api/pizze               # public API: list of pizzas as JSON
POST /api/ordini              { "pizzaId": 1, "quantita": 2 }   # creates an order
GET  /api/ordini/{id}         # order detail, with the computed total
```

![Request flow in PizzaHub](pizzahub-flow.png)

### Project structure

```
pizzahub/
├── docker-compose.yml
├── docker/
│   ├── php/Dockerfile
│   └── nginx/default.conf
├── composer.json
├── src/
│   ├── Domain/
│   │   ├── Pizza.php
│   │   ├── Ordine.php
│   │   ├── PizzaRepositoryInterface.php
│   │   └── OrdineRepositoryInterface.php
│   ├── Application/
│   │   ├── OrdineService.php
│   │   ├── PizzaService.php
│   │   └── Dto/
│   │       ├── CreaOrdineDto.php
│   │       └── OrdineDto.php
│   ├── Infrastructure/
│   │   └── Doctrine/
│   │       ├── PizzaRepository.php
│   │       └── OrdineRepository.php
│   └── Presentation/
│       └── Controller/
│           ├── PizzaController.php
│           └── OrdineController.php
├── config/
│   ├── services.yaml
│   └── packages/doctrine.yaml
└── templates/
    └── pizze/elenco.html.twig
```

### Step 1 — Dockerize the environment

```dockerfile
# docker/php/Dockerfile
FROM php:8.3-fpm

RUN apt-get update && apt-get install -y libpq-dev unzip \
    && docker-php-ext-install pdo pdo_pgsql

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www
COPY composer.json composer.lock ./
RUN composer install --no-scripts --no-autoloader

COPY . .
RUN composer dump-autoload --optimize
```

```nginx
# docker/nginx/default.conf
server {
    listen 80;
    root /var/www/public;

    location / {
        try_files $uri /index.php$is_args$args;
    }

    location ~ ^/index\.php(/|$) {
        fastcgi_pass php:9000;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

```yaml
# docker-compose.yml
services:
  php:
    build: ./docker/php
    volumes:
      - .:/var/www
    environment:
      DATABASE_URL: postgresql://pizzahub:pizzahub@database:5432/pizzahub

  nginx:
    image: nginx:alpine
    ports:
      - "8080:80"
    volumes:
      - ./public:/var/www/public
      - ./docker/nginx/default.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - php

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

> 💡 **Tip**: notice that `nginx` mounts `./public` directly, while `php` mounts the whole project — Nginx serves only static assets and forwards everything else to PHP-FPM via FastCGI. This is the same shape you'd find in any production Symfony deployment, containerized or not: Nginx in front, PHP-FPM behind, PHP-FPM never exposed directly to the internet.

### Step 2 — Domain: entities and "ports"

```php
// src/Domain/Pizza.php
#[ORM\Entity(repositoryClass: PizzaRepository::class)]
class Pizza
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    public function __construct(
        #[ORM\Column(length: 100)]
        private string $nome,
        #[ORM\Column(type: 'decimal', precision: 10, scale: 2)]
        private string $prezzo,
    ) {}

    public function getId(): ?int { return $this->id; }
    public function getNome(): string { return $this->nome; }
    public function getPrezzo(): string { return $this->prezzo; }
}
```

```php
// src/Domain/Ordine.php
#[ORM\Entity(repositoryClass: OrdineRepository::class)]
class Ordine
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Pizza::class)]
    #[ORM\JoinColumn(nullable: false)]
    private Pizza $pizza;

    #[ORM\Column]
    private int $quantita;

    public function __construct(Pizza $pizza, int $quantita)
    {
        if ($quantita <= 0) {
            throw new \InvalidArgumentException('Quantity must be positive');
        }
        $this->pizza = $pizza;
        $this->quantita = $quantita;
    }

    public function getId(): ?int { return $this->id; }
    public function getPizza(): Pizza { return $this->pizza; }
    public function getQuantita(): int { return $this->quantita; }

    public function totale(): float
    {
        return (float) $this->pizza->getPrezzo() * $this->quantita;
    }
}
```

```php
// src/Domain/PizzaRepositoryInterface.php
interface PizzaRepositoryInterface
{
    public function trovaPerId(int $id): ?Pizza;
    public function tutte(): array;
}

// src/Domain/OrdineRepositoryInterface.php
interface OrdineRepositoryInterface
{
    public function salva(Ordine $ordine): void;
    public function trovaPerId(int $id): ?Ordine;
}
```

### Step 3 — Infrastructure: Doctrine

```php
// src/Infrastructure/Doctrine/PizzaRepository.php
final class PizzaRepository extends ServiceEntityRepository implements PizzaRepositoryInterface
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Pizza::class);
    }

    public function trovaPerId(int $id): ?Pizza { return $this->find($id); }
    public function tutte(): array { return $this->findAll(); }
}

// src/Infrastructure/Doctrine/OrdineRepository.php
final class OrdineRepository extends ServiceEntityRepository implements OrdineRepositoryInterface
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Ordine::class);
    }

    public function salva(Ordine $ordine): void
    {
        $em = $this->getEntityManager();
        $em->persist($ordine);
        $em->flush();
    }

    public function trovaPerId(int $id): ?Ordine { return $this->find($id); }
}
```

```yaml
# config/services.yaml
services:
    App\Domain\PizzaRepositoryInterface:
        alias: App\Infrastructure\Doctrine\PizzaRepository
    App\Domain\OrdineRepositoryInterface:
        alias: App\Infrastructure\Doctrine\OrdineRepository
```

### Step 4 — Application: DTOs and services

```php
// src/Application/Dto/CreaOrdineDto.php
final class CreaOrdineDto
{
    public function __construct(
        #[Assert\NotNull]
        public readonly int $pizzaId,
        #[Assert\Positive]
        public readonly int $quantita,
    ) {}
}

// src/Application/Dto/OrdineDto.php
final class OrdineDto
{
    public function __construct(
        public readonly int $id,
        public readonly string $pizzaNome,
        public readonly int $quantita,
        public readonly float $totale,
    ) {}

    public static function da(Ordine $ordine): self
    {
        return new self(
            $ordine->getId(),
            $ordine->getPizza()->getNome(),
            $ordine->getQuantita(),
            $ordine->totale(),
        );
    }
}
```

```php
// src/Application/OrdineService.php
final class OrdineService
{
    public function __construct(
        private readonly PizzaRepositoryInterface $pizzaRepository,
        private readonly OrdineRepositoryInterface $ordineRepository,
    ) {}

    public function creaOrdine(CreaOrdineDto $dto): OrdineDto
    {
        $pizza = $this->pizzaRepository->trovaPerId($dto->pizzaId)
            ?? throw new \DomainException("Pizza not found: {$dto->pizzaId}");

        $ordine = new Ordine($pizza, $dto->quantita);
        $this->ordineRepository->salva($ordine);

        return OrdineDto::da($ordine);
    }
}
```

Notice that `OrdineService` knows nothing about Doctrine, HTTP, or Symfony itself beyond the Domain interfaces — that's what makes it testable in isolation (step 6) and the database swappable without touching a single line of business logic.

### Step 5 — Presentation: MVC and API controllers together

```php
// src/Presentation/Controller/PizzaController.php
#[Route('/pizze')]
final class PizzaController extends AbstractController
{
    public function __construct(private readonly PizzaService $pizzaService) {}

    #[Route('', name: 'pizze_elenco', methods: ['GET'])]
    public function elenco(): Response
    {
        return $this->render('pizze/elenco.html.twig', [
            'pizze' => $this->pizzaService->tutte(),
        ]);
    }
}

// src/Presentation/Controller/OrdineController.php
#[Route('/api')]
final class OrdineController extends AbstractController
{
    public function __construct(private readonly OrdineService $ordineService) {}

    #[Route('/ordini', methods: ['POST'])]
    public function crea(#[MapRequestPayload] CreaOrdineDto $dto): JsonResponse
    {
        $ordine = $this->ordineService->creaOrdine($dto);
        return $this->json($ordine, Response::HTTP_CREATED);
    }
}
```

```twig
{# templates/pizze/elenco.html.twig #}
<h1>Our pizzas</h1>
<ul>
    {% for pizza in pizze %}
        <li>{{ pizza.nome }} — {{ pizza.prezzo }} €</li>
    {% endfor %}
</ul>
```

### Step 6 — Tests, with PHPUnit

```php
// tests/Application/OrdineServiceTest.php
final class OrdineServiceTest extends TestCase
{
    public function testCreaOrdineConPizzaEsistenteCalcolaIlTotaleCorretto(): void
    {
        // Arrange — fake repositories, no real database
        $pizza = new Pizza('Margherita', '6.50');

        $pizzaRepository = $this->createMock(PizzaRepositoryInterface::class);
        $pizzaRepository->method('trovaPerId')->with(1)->willReturn($pizza);

        $ordineRepository = $this->createMock(OrdineRepositoryInterface::class);
        $ordineRepository->expects($this->once())->method('salva');

        $service = new OrdineService($pizzaRepository, $ordineRepository);

        // Act
        $risultato = $service->creaOrdine(new CreaOrdineDto(pizzaId: 1, quantita: 3));

        // Assert
        $this->assertEquals(19.50, $risultato->totale);
        $this->assertEquals('Margherita', $risultato->pizzaNome);
    }

    public function testCreaOrdineConPizzaInesistenteLanciaEccezione(): void
    {
        $pizzaRepository = $this->createMock(PizzaRepositoryInterface::class);
        $pizzaRepository->method('trovaPerId')->with(99)->willReturn(null);

        $ordineRepository = $this->createMock(OrdineRepositoryInterface::class);

        $service = new OrdineService($pizzaRepository, $ordineRepository);

        $this->expectException(\DomainException::class);
        $service->creaOrdine(new CreaOrdineDto(pizzaId: 99, quantita: 1));
    }
}
```

```php
// tests/Presentation/OrdineControllerTest.php — integration test, with the real Symfony kernel started
final class OrdineControllerTest extends WebTestCase
{
    public function testPostOrdiniConPayloadValidoRitorna201(): void
    {
        $client = static::createClient();
        $client->request('POST', '/api/ordini', server: ['CONTENT_TYPE' => 'application/json'],
            content: json_encode(['pizzaId' => 1, 'quantita' => 2]));

        $this->assertResponseStatusCodeSame(Response::HTTP_CREATED);
    }
}
```

> 🧠 **Golden rule**: notice the same distinction seen in this platform's other playbooks. `OrdineServiceTest` is a **pure unit test**: no Symfony kernel started, runs in milliseconds thanks to Clean Architecture (section 4). `OrdineControllerTest` is an **integration test**: it boots the full kernel to verify that routing, JSON, validation, and the service actually work together. You need both, in different proportions: many fast unit tests, a handful of targeted integration tests.

```bash
docker compose exec php bin/phpunit                                   # all tests
docker compose exec php bin/phpunit tests/Application/OrdineServiceTest.php   # a single class
```

### Step 7 — Run and try it out

```bash
docker compose up -d --build
docker compose exec php php bin/console doctrine:migrations:migrate --no-interaction
```

```bash
curl http://localhost:8080/api/pizze
# [{"id":1,"nome":"Margherita","prezzo":"6.50"}, {"id":2,"nome":"Diavola","prezzo":"8.00"}]

curl -X POST http://localhost:8080/api/ordini \
  -H "Content-Type: application/json" \
  -d '{"pizzaId": 1, "quantita": 3}'
# 201 {"id":1,"pizzaNome":"Margherita","quantita":3,"totale":19.50}
```

One last professional touch: handle `\DomainException` with an honest `404` instead of letting a generic `500` leak through:

```php
// src/Presentation/EventListener/ExceptionListener.php
#[AsEventListener(event: KernelEvents::EXCEPTION)]
final class ExceptionListener
{
    public function __invoke(ExceptionEvent $event): void
    {
        $exception = $event->getThrowable();

        if ($exception instanceof \DomainException) {
            $event->setResponse(new JsonResponse(
                ['errore' => $exception->getMessage()],
                Response::HTTP_NOT_FOUND
            ));
        }
    }
}
```

This listener intercepts exceptions thrown by **any** controller in the application, in a single place — no `try/catch` repeated in every endpoint, the same centralized error-handling principle seen in this platform's other playbooks.

### Concepts applied

- **Section 1**: `readonly`, constructor property promotion, `match`, the nullsafe operator, native attributes instead of annotations
- **Section 2**: Service Container autowiring, attribute-based routing, injection in both the constructor and action methods
- **Section 4**: separation into `Domain` / `Application` / `Infrastructure` / `Presentation`, with dependencies pointing inward
- **Section 5**: the Repository pattern for persistence, immutable DTOs for the public contract
- **Section 6**: Doctrine ORM, entities with prices as `decimal`/`string`, versioned migrations
- **Section 7**: Controllers as services, `#[MapRequestPayload]` for automatic DTO validation
- **Section 9 itself**: Docker Compose with PHP-FPM + Nginx + PostgreSQL, unit tests with mocks and integration tests with `WebTestCase`

---

## 🎉 You made it!

You've completed **Symfony is Alive and Kicking**. Now you know:

- How modern PHP (8.3+) left the 2006-era language behind: `enum`, `readonly`, `match`, the nullsafe operator, native attributes
- Symfony's core concepts: the Service Container, autowiring, routing, HttpKernel, and how Symfony Flex automatically configures packages
- Which historical parts of PHP remain dangerous (weak comparisons, unvalidated superglobals) and which language/framework tools make them avoidable in a well-structured project
- Clean Code and Clean Architecture applied to a real Symfony project: `Domain`, `Application`, `Infrastructure`, `Presentation`
- The most common design patterns — Repository, Strategy, Decorator (via service decoration), Observer (via EventDispatcher), Command (via Console and Messenger) — applied idiomatically
- How to use Doctrine ORM correctly: entities, versioned migrations, and how to avoid the N+1 trap with fetch joins
- How to build modern views with Twig (secure by default) and validate forms/APIs with the Form component and `#[MapRequestPayload]`
- How to handle async pragmatically: PHP-FPM for the basic synchronous model, Symfony Messenger for background work, Fibers only for extreme-concurrency scenarios
- How to put it all together in **PizzaHub**, fully dockerized with PHP-FPM, Nginx, and PostgreSQL

**Where to go from here?**

- 📖 [Symfony Documentation](https://symfony.com/doc/current/index.html) — the official documentation, among the most complete in the PHP ecosystem
- 🧪 [Doctrine ORM Documentation](https://www.doctrine-project.org/projects/doctrine-orm/en/current/index.html) — a complete reference for advanced queries, mapping, and performance
- 📘 *PHP: The Right Way* — a community-driven guide to modern language practices, great for anyone coming from "old-style" PHP
- 🐘 [PHP 8.3 Release Notes](https://www.php.net/releases/8.3/en.php) — the official release notes, useful for seeing exactly what changed version by version
- ☕ [Booting Spring Boot — Java Edition](/en/playbook/spring) — compare the exact same project, PizzaHub, written in Java/Spring Boot: useful for understanding what really changes between ecosystems and what's a universal pattern

> 🧠 **One last piece of advice**: modern PHP with Symfony doesn't need to prove anything to anyone — it has run production at enormous scale for twenty years, and it has grown up exactly like other enterprise languages have (stronger types, DI, mature ORMs). The "PHP is dead" bias almost always comes from someone who hasn't looked at it since 2010. Pragmatism wins here too: if your team already knows PHP, or the project needs a fast time-to-market with a cheap, extremely widespread hosting ecosystem, Symfony is a serious choice, not a fallback. Happy coding! 🐘
