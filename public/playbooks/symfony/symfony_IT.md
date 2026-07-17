# Symfony is Alive and Kicking

"Ma PHP non era morto?" È la domanda che sente chiunque dica di scrivere PHP nel 2026, di solito posta da chi ha visto l'ultima riga di PHP nel 2010 — array associativi ovunque, `mysql_query()` concatenato a stringhe scritte a mano, zero tipi, zero struttura. Quel PHP è morto davvero, ed è giusto così. Il PHP di oggi è un altro linguaggio: tipizzato, con `enum`, `readonly`, pattern matching via `match`, e un framework — **Symfony** — che regge applicazioni enterprise di livello bancario, gestisce milioni di richieste al giorno, ed è il motore sotto progetti come questo stesso genere di piattaforme di e-commerce, gestionali, e — sorpresa — buona parte dell'ecosistema WordPress/Drupal moderno oltre a essere alla base di framework come Laravel (che ne riusa diversi componenti).

Symfony nasce nel 2005, ben prima che "clean architecture" e "dependency injection" fossero parole comuni nel mondo PHP. Oggi è arrivato alla versione 7, ed è probabilmente il framework PHP più rigoroso sul mercato: Service Container maturo, componenti riusabili anche fuori da Symfony stesso (Symfony Console alimenta Laravel Artisan, Symfony HttpFoundation è ovunque), e un ecosistema — **Doctrine** per l'ORM, **Twig** per i template, **Messenger** per l'async — che copre ogni esigenza reale di un backend moderno.

Questo playbook parte dal PHP moderno (quello vero, non quello del 2006) e arriva a un progetto completo e dockerizzato — **PizzaHub**, la stessa app di gestione ordini per una pizzeria vista nelle playbook Spring Boot di questa piattaforma, questa volta in Symfony — passando per i design pattern più comuni, l'uso corretto di un ORM, e la gestione pragmatica dell'asincronia in un linguaggio storicamente sincrono. Chiaro, pulito, pragmatico, senza fronzoli: se hai 12 anni e sei curioso, o hai una scadenza domani mattina, questo playbook è pensato per te in entrambi i casi.

---

## 1. Modern PHP (ultima versione): il linguaggio non è morto!

**In pillole**: PHP 8.3/8.4 non ha quasi più nulla in comune con il PHP che circolava nei tutorial del 2008. Tipi scalari nativi, `enum`, proprietà `readonly`, `match`, nullsafe operator, attributi al posto dei commenti-annotazione: il linguaggio ha smesso di essere "quello senza tipi" da anni.

### Tipi scalari e `declare(strict_types=1)`

```php
<?php
declare(strict_types=1);

function calcolaTotale(float $prezzo, int $quantita): float
{
    return $prezzo * $quantita;
}

calcolaTotale(6.50, 3);      // ✅ ok
calcolaTotale("6.50", 3);    // ❌ TypeError: PHP non converte più silenziosamente la stringa
```

🧠 **Analogia**: PHP senza `strict_types` è come un magazziniere che accetta qualsiasi scatola arrivi, prova a intuire cosa contiene, e a volte si sbaglia in modi silenziosi. Con `declare(strict_types=1)` in cima al file, il magazziniere controlla l'etichetta prima di accettare la scatola: se dichiari `float`, deve arrivare un `float`, non una stringa che "assomiglia" a un numero.

> 💡 **Tip**: `declare(strict_types=1)` va scritto in **ogni file** che dichiara funzioni tipizzate — non è un'impostazione globale del progetto. In un progetto Symfony nuovo, è buona norma metterlo come prima riga di ogni classe PHP, senza eccezioni.

### `enum`: basta costanti sparse

```php
// ❌ PHP "vecchio stile": costanti scollegate, nessuna garanzia che il valore sia uno di questi
class StatoOrdine
{
    const IN_ATTESA = 'in_attesa';
    const CONFERMATO = 'confermato';
    const CONSEGNATO = 'consegnato';
}

// ✅ PHP 8.1+: un enum vero, con il compilatore che garantisce i valori possibili
enum StatoOrdine: string
{
    case InAttesa = 'in_attesa';
    case Confermato = 'confermato';
    case Consegnato = 'consegnato';

    public function label(): string
    {
        return match($this) {
            self::InAttesa => 'In attesa',
            self::Confermato => 'Confermato',
            self::Consegnato => 'Consegnato',
        };
    }
}

$stato = StatoOrdine::Confermato;
echo $stato->label();   // "Confermato"
echo $stato->value;     // "confermato"
```

> 🧠 **La regola d'oro**: un `enum` PHP non è "una classe con delle costanti dentro" — è un tipo chiuso: una variabile dichiarata `StatoOrdine` può contenere **solo** uno dei case dichiarati, mai una stringa arbitraria. Questo elimina un'intera categoria di bug ("ho scritto 'confermto' con un typo e nessuno se n'è accorto fino a produzione") che con le vecchie costanti stringa era normalissima.

### `readonly`: immutabilità dichiarata, non sperata

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

Nota anche il **constructor property promotion**: dichiarare `public readonly string $nome` direttamente nella firma del costruttore dichiara **e** assegna la proprietà in un colpo solo — niente più `private $nome; public function __construct($nome) { $this->nome = $nome; }` scritto a mano.

### `match`: uno `switch` che non ti tradisce

```php
// ❌ switch: fallthrough silenzioso se dimentichi un break, confronto debole (==)
switch ($stato) {
    case 'in_attesa':
        $messaggio = 'In attesa';
        break;
    case 'confermato':
        $messaggio = 'Confermato';
        // manca il break: cade nel caso successivo per errore!
    case 'consegnato':
        $messaggio = 'Consegnato';
        break;
}

// ✅ match: confronto stretto (===), nessun fallthrough, è un'espressione (ritorna un valore)
$messaggio = match($stato) {
    'in_attesa' => 'In attesa',
    'confermato' => 'Confermato',
    'consegnato' => 'Consegnato',
    default => throw new \ValueError("Stato sconosciuto: $stato"),
};
```

### Nullsafe operator: niente più `if ($x !== null && $x->y !== null)`

```php
// ❌ prima di PHP 8.0: controlli annidati per ogni possibile null
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

// ✅ PHP 8.0+: una riga, si ferma al primo null e ritorna null
$citta = $ordine?->getCliente()?->getIndirizzo()?->getCitta();
```

### Attributi: metadata nel linguaggio, non nei commenti

```php
// ❌ PHP "vecchio stile" (con Symfony/Doctrine pre-8.0): annotazioni dentro commenti, parsate a runtime da una libreria
/**
 * @Route("/api/pizze", methods={"GET"})
 */
public function elenco(): JsonResponse { /* ... */ }

// ✅ PHP 8.0+: attributi nativi, parte della sintassi, verificati dal parser
#[Route('/api/pizze', methods: ['GET'])]
public function elenco(): JsonResponse { /* ... */ }
```

> 💡 **Tip**: gli attributi non sono solo "sintassi più carina" — sono parte della grammatica del linguaggio, quindi un IDE li capisce nativamente (autocomplete, refactoring sicuro), mentre le vecchie annotazioni-in-commento erano semplici stringhe che una libreria doveva parsare a runtime con regole tutte sue.

### First-class callable syntax

```php
$pizze = ['Margherita', 'diavola', 'Quattro Formaggi'];

// PHP 8.1+: passa una funzione come valore, senza wrapping goffo
$maiuscole = array_map(strtoupper(...), $pizze);

// invece della vecchia sintassi con stringa o array callable
$maiuscole = array_map('strtoupper', $pizze);
$maiuscole = array_map([$this, 'formatta'], $pizze);   // ancora più goffo con metodi di istanza
```

---

## 2. Fondamenti del framework PHP

**In pillole**: Symfony poggia su due concetti — **Service Container** (chi crea e gestisce gli oggetti) e **Dependency Injection** (come questi oggetti si ricevono le proprie dipendenze) — più **Bundles** e **Routing** come meccanismi di composizione ed esposizione HTTP. Stessa filosofia di Inversion of Control vista in altri framework enterprise, con un vocabolario tutto suo.

### Il Service Container: chi costruisce cosa

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

Non scrivi mai `new OrdineService(...)` sparso nel codice applicativo: Symfony vede il costruttore, capisce che `OrdineService` ha bisogno di un `PizzaRepository` e di un `OrdineRepository`, e li inietta automaticamente quando qualcun altro chiede un `OrdineService` al container. Questo si chiama **autowiring**, ed è attivo di default in ogni progetto Symfony moderno — non serve configurazione XML/YAML per ogni singolo servizio, a differenza delle prime versioni del framework.

🧠 **Analogia**: il Service Container è come un centralino di una grande azienda: non devi sapere il numero diretto di ogni collega (costruire ogni oggetto a mano) — chiedi al centralino "passami il servizio ordini" e lui si occupa di recuperare tutto il necessario, comprese le dipendenze delle dipendenze, senza che tu debba pensarci.

### Routing: dagli URL ai controller

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

Nota `PizzaService $pizzaService` come parametro del metodo, non del costruttore: Symfony inietta i servizi anche direttamente nei metodi delle action, oltre che nel costruttore — utile per servizi usati in una sola action, senza doverli portare in tutto il controller.

### HttpKernel: il ciclo Request → Response

Ogni framework HTTP ha, sotto il cofano, lo stesso schema: una `Request` entra, qualcosa la elabora, esce una `Response`. In Symfony questo "qualcosa" è **HttpKernel**, e il ciclo passa attraverso eventi (`kernel.request`, `kernel.controller`, `kernel.response`) a cui puoi agganciarti — è il punto dove vivono cose come l'autenticazione, il CORS, la gestione centralizzata degli errori.

```php
// concettualmente, ogni richiesta segue questo schema:
// Request → Router (trova il controller giusto) → Controller (esegue la logica)
//         → Response → (eventuali listener su kernel.response) → al client
```

### Symfony Flex: i "pacchetti che si configurano da soli"

```bash
composer require symfony/orm-pack
# Flex non installa solo Doctrine: crea anche i file di configurazione,
# le variabili .env necessarie, e le directory di default — senza editing manuale
```

**Symfony Flex** è un plugin Composer che osserva cosa installi e applica automaticamente le "receipes" (ricette) — configurazione, bundle registration, scaffold di file — associate a quel pacchetto. È il motivo per cui in un progetto Symfony moderno raramente tocchi `config/bundles.php` a mano: Flex lo fa per te quando installi qualcosa.

---

## 3. Good Parts vs Bad Parts

**In pillole**: PHP ha una storia lunga e imperfetta — array che sono contemporaneamente liste, mappe, e strutture dati generiche, una libreria standard con naming inconsistente (`str_replace` ma `strpos`, senza uno schema chiaro), e anni di codice `$_GET`/`$_POST` senza validazione. Il PHP moderno non ha cancellato quella storia, ma l'ha resa **opzionale**: puoi scrivere codice type-safe, testabile, e prevedibile, se scegli di farlo.

### Le "bad parts" storiche, e perché sopravvivono

```php
// ❌ confronto debole: "0" == false è true, "abc" == 0 era true prima di PHP 8 (oggi è false, ma la storia insegna)
if ($input == 0) { /* ... */ }

// ✅ confronto stretto: nessuna conversione implicita
if ($input === 0) { /* ... */ }
```

```php
// ❌ superglobali usati direttamente nel controller: nessuna validazione, nessun tipo, difficile da testare
$nome = $_POST['nome'];

// ✅ Symfony: la Request è un oggetto, tipizzato, con metodi che validano l'accesso
public function crea(Request $request): JsonResponse
{
    $nome = $request->request->get('nome');   // ancora una stringa qualsiasi...
    // ...ma con un DTO validato (sezione 7), il dato arriva già verificato prima del controller
}
```

> 🧠 **La regola d'oro**: PHP non ha "risolto" i suoi difetti storici rimuovendoli — l'ha fatto rendendo **inutile** usarli in un progetto ben strutturato. `$_POST` esiste ancora ed è ancora pericoloso da usare direttamente, ma in un'app Symfony seria non lo tocchi mai: passi attraverso `Request`, DTO validati, e il Form component (sezione 7). Il linguaggio "cattivo" resta lì per compatibilità storica — il framework ti dà gli strumenti per non doverlo mai incontrare.

### Le "good parts" moderne

| Feature | Cosa risolve |
|---|---|
| `declare(strict_types=1)` | Elimina le conversioni di tipo implicite e sorprendenti |
| Composer + PSR-4 autoloading | Niente più `require_once` sparsi, namespace prevedibili |
| PSR (PHP Standard Recommendations) | Interoperabilità tra librerie di vendor diversi (PSR-7 per HTTP, PSR-3 per il logging...) |
| `enum`, `readonly`, tipi union/intersection | Un sistema dei tipi che si avvicina a linguaggi come TypeScript o Kotlin |
| Attributi nativi | Metadata verificato dal parser, non stringhe interpretate a runtime |

> 💡 **Tip**: se stai valutando PHP per un nuovo progetto nel 2026, valuta **PHP 8.3+ con Symfony**, non "PHP" in astratto. La differenza tra i due mondi (PHP 5 procedurale vs PHP 8 con Symfony) è enorme quanto quella tra JavaScript ES5 e TypeScript moderno — sono, di fatto, esperienze di sviluppo diverse che condividono solo il nome del linguaggio di base.

---

## 4. Clean Code, Clean Architecture

**In pillole**: gli stessi quattro strati visti nelle altre playbook di questa piattaforma — `Domain`, `Application`, `Infrastructure`, `Presentation` — applicati a Symfony. La regola di dipendenza non cambia: le dipendenze puntano sempre verso l'interno, verso il dominio.

### Clean Code, in pratica

```php
// ❌ nome bugiardo, funzione che fa troppo
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

// ✅ nome onesto, responsabilità unica
function raddoppiaValoriPositivi(array $numeri): array
{
    return array_map(
        fn(int $n) => $n * 2,
        array_filter($numeri, fn(int $n) => $n > 0)
    );
}
```

### I quattro strati, applicati a Symfony

```
src/
├── Domain/            ← nucleo: entity, value object, interfacce repository. ZERO dipendenza da Symfony
├── Application/          ← service, use case, DTO. Dipende solo da Domain
├── Infrastructure/         ← implementazioni Doctrine, client esterni. Implementa le interfacce di Domain
└── Presentation/             ← Controller (HTML e API). Il punto di ingresso, assemblato via Dependency Injection
```

![Clean Architecture in Symfony](symfony-clean-architecture.png)

```php
// src/Domain/PizzaRepositoryInterface.php — l'interfaccia (la "porta") vive nel Domain
interface PizzaRepositoryInterface
{
    public function trovaPerId(int $id): ?Pizza;
    public function tutte(): array;
}
```

```php
// src/Infrastructure/Doctrine/PizzaRepository.php — l'implementazione vive fuori, e DIPENDE da Domain
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
# config/services.yaml — collega l'interfaccia all'implementazione concreta
services:
    App\Domain\PizzaRepositoryInterface:
        alias: App\Infrastructure\Doctrine\PizzaRepository
```

Il beneficio concreto: `OrdineService` (Application) dipende solo da `PizzaRepositoryInterface` (Domain), mai direttamente dall'implementazione Doctrine — puoi testarlo con un repository finto in memoria senza mai avviare un database vero (sezione 9), e cambiare ORM toccando solo `Infrastructure`.

### Modello ricco vs modello anemico

```php
// ❌ modello anemico: solo getter/setter, tutta la logica sparsa nei service
final class Ordine
{
    private array $righe = [];
    public function getRighe(): array { return $this->righe; }
    public function setRighe(array $righe): void { $this->righe = $righe; }
}

// ✅ modello ricco: l'entity protegge le proprie regole
final class Ordine
{
    /** @var RigaOrdine[] */
    private array $righe = [];

    public function aggiungiRiga(Pizza $pizza, int $quantita): void
    {
        if ($quantita <= 0) {
            throw new \InvalidArgumentException('La quantita deve essere positiva');
        }
        $this->righe[] = new RigaOrdine($pizza, $quantita);
    }

    public function totale(): float
    {
        return array_sum(array_map(fn(RigaOrdine $r) => $r->subtotale(), $this->righe));
    }
}
```

> 🧠 **La regola d'oro**: il modello anemico è l'anti-pattern più comune nel codice PHP enterprise, tanto quanto lo è in Java o C#. Un modello ricco come `Ordine` sopra sa rispondere da solo a domande sul proprio stato (`totale()`) e protegge i propri invarianti (`aggiungiRiga` rifiuta quantità negative) — la logica di business vive dove vivono i dati che coinvolge, non sparsa nei controller.

---

## 5. Design Pattern più comuni

**In pillole**: Symfony non inventa nuovi pattern — applica i classici della Gang of Four in modo estremamente pragmatico, spesso rendendoli parte del framework stesso invece di lasciarli come esercizio per lo sviluppatore.

### Repository: astrarre la persistenza

Già visto in sezione 4 — un'interfaccia nel Domain, un'implementazione Doctrine nell'Infrastructure. È il pattern più usato in assoluto in un progetto Symfony maturo.

### Strategy: comportamenti intercambiabili

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

// il codice chiamante non sa (né gli interessa) QUALE strategia sta usando
final class OrdineService
{
    public function __construct(private readonly CalcolatoreSconto $calcolatoreSconto) {}

    public function totaleScontato(Ordine $ordine): float
    {
        return $this->calcolatoreSconto->calcola($ordine->totale());
    }
}
```

### Decorator: Symfony lo offre come feature del container

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

> 🧠 **Analogia**: la **service decoration** è come mettere una custodia protettiva attorno a un telefono — il telefono (il servizio originale) continua a funzionare esattamente come prima, ma la custodia (il decorator) aggiunge comportamento extra (qui, una cache) senza che il telefono stesso debba saperlo. Chi usa `PizzaRepositoryInterface` nel resto del codice non si accorge della differenza.

### Observer: `EventDispatcher`

```php
final class OrdineCreatoEvent
{
    public function __construct(public readonly Ordine $ordine) {}
}

// dove l'ordine viene creato
$this->eventDispatcher->dispatch(new OrdineCreatoEvent($ordine));

// altrove nel codice, completamente disaccoppiato
#[AsEventListener(event: OrdineCreatoEvent::class)]
final class InviaEmailConfermaListener
{
    public function __invoke(OrdineCreatoEvent $event): void
    {
        // invia l'email, senza che OrdineService sappia che questo listener esiste
    }
}
```

Questo è il pattern **Observer** applicato in modo idiomatico: chi crea l'ordine non sa (né deve sapere) chi altro reagirà a quell'evento — inviare un'email, aggiornare una dashboard, notificare un servizio esterno sono tutte responsabilità disaccoppiate, aggiungibili senza toccare `OrdineService`.

### Command: Console e Messenger

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

Ogni comando della console Symfony è un'implementazione del pattern **Command**: incapsula un'azione ("pulisci gli ordini scaduti") come oggetto, eseguibile, schedulabile, testabile in isolamento — lo stesso pattern che ritroveremo nella sezione 8 con Symfony Messenger.

---

## 6. ORM: come usarlo al top?

**In pillole**: **Doctrine** è l'ORM standard di Symfony — maturo, potente, e con le stesse trappole di ogni ORM (il problema N+1 su tutte). Usarlo bene significa capire cosa fa "sotto il cofano", non solo come si annotano le entity.

### L'entity Doctrine

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
    private string $prezzo;   // Doctrine mappa DECIMAL su string per non perdere precisione sui float

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

> 💡 **Tip**: mappare un prezzo su `type: 'decimal'` e leggerlo come `string` in PHP (non `float`) non è un dettaglio pignolo — i `float` binari non rappresentano esattamente valori decimali come `0.10`, e su calcoli monetari ripetuti quell'imprecisione si accumula. Usa `string` (o una libreria come `brick/money`) per qualsiasi valore che rappresenta denaro.

### Le relazioni, e il problema N+1

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
// ❌ N+1: una query per gli ordini, poi UNA query per ogni singola pizza collegata
$ordini = $ordineRepository->findAll();
foreach ($ordini as $ordine) {
    echo $ordine->getPizza()->getNome();   // ogni chiamata scatena una query separata!
}
```

```php
// ✅ fetch join esplicito: una sola query per tutto
public function tuttiConPizza(): array
{
    return $this->createQueryBuilder('o')
        ->addSelect('p')
        ->join('o.pizza', 'p')
        ->getQuery()
        ->getResult();
}
```

> 🧠 **La regola d'oro**: il problema N+1 non è un difetto di Doctrine — è una conseguenza inevitabile del *lazy loading*, presente in ogni ORM (Hibernate in Java, Entity Framework in .NET, ActiveRecord in Rails). La differenza tra un'app che scala e una che va in ginocchio con 1.000 ordini è spesso proprio questa: sapere quando un fetch join esplicito è necessario, invece di scoprirlo con i log delle query lente in produzione.

### DQL: query type-safe sulle entity, non sulle tabelle

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

DQL (Doctrine Query Language) assomiglia a SQL ma opera su **entity e proprietà**, non su tabelle e colonne — cambia il nome di una colonna nel database e, finché la proprietà PHP resta la stessa, le tue query DQL continuano a funzionare senza modifiche.

### Migrations: schema versionato, mai a mano

```bash
php bin/console make:migration        # genera una migration confrontando le entity con lo schema attuale
php bin/console doctrine:migrations:migrate   # applica le migration pendenti
```

> 💡 **Tip**: non usare mai `doctrine:schema:update --force` in produzione — è l'equivalente Doctrine di `ddl-auto: update` in Hibernate, comodissimo in sviluppo e pericoloso su un database reale perché può alterare lo schema in modi non revisionati. Le migration versionate (`make:migration`) sono l'unico modo sicuro di far evolvere lo schema in produzione: ogni cambiamento è un file, revisionabile in code review, applicabile in ordine.

---

## 7. Modern MVC

**In pillole**: i Controller Symfony sono service come tutti gli altri (constructor injection incluso), **Twig** è il motore di template — sicuro di default contro XSS — e il **Form component** gestisce validazione e binding in modo dichiarativo, senza toccare mai `$_POST` a mano.

### Controller come service

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

### Twig: template sicuri di default

```twig
{# templates/pizze/elenco.html.twig #}
<h1>Le nostre pizze</h1>
<ul>
    {% for pizza in pizze %}
        <li>{{ pizza.nome }} — {{ pizza.prezzo }} €</li>
    {% else %}
        <li>Nessuna pizza disponibile, torna più tardi!</li>
    {% endfor %}
</ul>
```

> 🧠 **La regola d'oro**: Twig applica **auto-escaping HTML di default** su ogni variabile stampata con `{{ }}` — se `pizza.nome` contenesse `<script>alert(1)</script>`, Twig lo mostrerebbe come testo innocuo, non lo eseguirebbe come HTML. Devi esplicitamente scrivere `{{ valore|raw }}` per disattivare questa protezione, ed è un segnale che dovresti fermarti a pensare "sono sicuro che questo contenuto sia fidato?" prima di farlo.

### Il Form component: validazione dichiarativa

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

> 💡 **Tip**: il `redirectToRoute` dopo un submit riuscito non è uno stile a caso — è il pattern **Post-Redirect-Get**, visto anche nelle altre playbook di questa piattaforma: se l'utente ricarica la pagina dopo il salvataggio, il browser ripete l'ultima `GET` (innocua), non l'ultima `POST` (che altrimenti creerebbe una pizza duplicata).

### API Controller: JSON, DTO, status code onesti

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

`#[MapRequestPayload]` deserializza e **valida** automaticamente il corpo della richiesta JSON dentro il DTO tipizzato, rifiutando con un `422` payload malformati prima ancora che il tuo codice controller venga eseguito — lo stesso principio del `@Valid` visto in altri framework di questa piattaforma.

---

## 8. Come faccio con l'async?

**In pillole**: PHP nasce sincrono e process-per-request (ogni richiesta HTTP gira in un processo PHP-FPM separato, che finisce quando la risposta è inviata) — non è Node.js con il suo event loop. Ma "PHP è sincrono" non significa "PHP non può gestire lavoro asincrono": significa solo che l'asincronia si ottiene con strumenti diversi, e capire quando usarli è la parte pragmatica.

### Il modello di base: PHP-FPM, un processo per richiesta

```
Richiesta HTTP → Nginx → PHP-FPM assegna un processo worker
                              → il processo esegue TUTTO in modo sincrono
                              → risposta inviata → il processo torna disponibile
```

🧠 **Analogia**: PHP-FPM è come un ristorante con tanti camerieri, ognuno dei quali segue un cliente dall'inizio alla fine del suo ordine, senza mai lasciarlo a metà per servire qualcun altro. Node.js, al contrario, è come un unico cameriere iper-efficiente che prende dieci ordini in sequenza e li serve non appena la cucina (l'I/O) ha finito ciascuno, senza mai stare fermo ad aspettare. Nessuno dei due modelli è "sbagliato" — gestiscono il carico in modo diverso, e PHP-FPM scala aggiungendo più camerieri (worker), non rendendo un singolo cameriere più multitasking.

Questo significa che una richiesta HTTP lenta (che chiama tre API esterne in sequenza) blocca quel worker per tutta la sua durata — ma **non** blocca le altre richieste, che vengono gestite da altri worker in parallelo. Per la maggior parte delle applicazioni web, questo modello è più che sufficiente.

### Symfony Messenger: async "vero" per lavoro in background

Quando un'operazione è troppo lenta per stare dentro il ciclo request-response (inviare 10.000 email, generare un report pesante), la risposta pragmatica non è "rendere PHP asincrono" — è **spostare il lavoro fuori dal ciclo HTTP**, in una coda.

```php
// il messaggio: un semplice DTO
final class InviaEmailOrdine
{
    public function __construct(public readonly int $ordineId) {}
}

// il controller pubblica il messaggio e risponde SUBITO, senza aspettare l'invio
#[Route('/api/ordini', methods: ['POST'])]
public function creaOrdine(
    #[MapRequestPayload] CreaOrdineDto $dto,
    OrdineService $ordineService,
    MessageBusInterface $bus,
): JsonResponse {
    $ordine = $ordineService->creaOrdine($dto);
    $bus->dispatch(new InviaEmailOrdine($ordine->getId()));   // torna subito, l'invio avviene altrove
    return $this->json($ordine, Response::HTTP_CREATED);
}

// un handler separato, eseguito da un worker in background
#[AsMessageHandler]
final class InviaEmailOrdineHandler
{
    public function __invoke(InviaEmailOrdine $message): void
    {
        // invia l'email — anche se ci mette 3 secondi, il client HTTP non ha aspettato
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
php bin/console messenger:consume async   # il worker che processa i messaggi in coda
```

> 🧠 **La regola d'oro**: **Symfony Messenger** risolve il problema reale che la maggior parte dei team ha con "async" — non serve un event loop, serve **non far aspettare l'utente** per lavoro che non deve bloccare la risposta. Il transport (RabbitMQ, Redis, o anche solo la tabella `messenger_messages` di Doctrine per iniziare senza infrastruttura extra) disaccoppia completamente "quando arriva la richiesta" da "quando viene eseguito il lavoro".

### Fiber (PHP 8.1+) e i framework event-driven

Per lo scenario opposto — un singolo processo che gestisce **migliaia di connessioni concorrenti** senza un worker per ognuna, tipico di WebSocket o microservizi ad altissimo throughput — PHP 8.1 ha introdotto le **Fiber**, primitive a basso livello per la concorrenza cooperativa, su cui si basano framework come **ReactPHP** e **Swoole**.

```php
// concettualmente: una Fiber sospende l'esecuzione durante un'operazione I/O,
// lasciando il processo libero di gestire altro lavoro nel frattempo
$fiber = new Fiber(function (): void {
    $valore = Fiber::suspend('sospesa qui');
    echo "Ripresa con: $valore\n";
});
```

> 💡 **Tip**: le Fiber sono un dettaglio implementativo su cui **framework** come ReactPHP e Swoole sono costruiti — nella stragrande maggioranza dei progetti Symfony non le tocchi mai direttamente, così come raramente scrivi codice `Promise` a mano in un'app Node.js che usa `async`/`await`. Per un'app Symfony "normale" (anche molto grande), PHP-FPM + Messenger copre praticamente ogni esigenza reale. Valuta Swoole/ReactPHP solo quando hai un requisito concreto di concorrenza altissima su singolo processo — non per partito preso.

---

## 9. Un esempio completo (dockerizzato), passo passo

Mettiamo tutto insieme: **PizzaHub**, la stessa app di gestione ordini per una pizzeria vista nelle playbook Spring Boot di questa piattaforma — questa volta in Symfony, completamente dockerizzata: PHP-FPM, Nginx, PostgreSQL, tutto orchestrato con `docker-compose`.

### Cosa fa PizzaHub

```bash
GET  /pizze                  # pannello admin: elenco pizze (Twig, richiede login)
GET  /api/pizze               # API pubblica: elenco pizze in JSON
POST /api/ordini              { "pizzaId": 1, "quantita": 2 }   # crea un ordine
GET  /api/ordini/{id}         # dettaglio ordine, con il totale calcolato
```

![Flusso delle richieste in PizzaHub](pizzahub-flow.png)

### Struttura del progetto

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

### Step 1 — Dockerizza l'ambiente

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

> 💡 **Tip**: nota che `nginx` monta `./public` direttamente, mentre `php` monta l'intero progetto — Nginx serve solo gli asset statici e inoltra tutto il resto a PHP-FPM via FastCGI. È lo stesso schema che troveresti in qualsiasi deploy Symfony in produzione, container o meno: Nginx davanti, PHP-FPM dietro, mai PHP-FPM esposto direttamente a Internet.

### Step 2 — Domain: entity e "porte"

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
            throw new \InvalidArgumentException('La quantita deve essere positiva');
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

### Step 4 — Application: DTO e service

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
            ?? throw new \DomainException("Pizza non trovata: {$dto->pizzaId}");

        $ordine = new Ordine($pizza, $dto->quantita);
        $this->ordineRepository->salva($ordine);

        return OrdineDto::da($ordine);
    }
}
```

Nota che `OrdineService` non sa nulla di Doctrine, HTTP, o Symfony stesso al di fuori delle interfacce del Domain — è quello che lo rende testabile in isolamento (step 6) e il database sostituibile senza toccare una riga di logica di business.

### Step 5 — Presentation: controller MVC e API insieme

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
<h1>Le nostre pizze</h1>
<ul>
    {% for pizza in pizze %}
        <li>{{ pizza.nome }} — {{ pizza.prezzo }} €</li>
    {% endfor %}
</ul>
```

### Step 6 — Test, con PHPUnit

```php
// tests/Application/OrdineServiceTest.php
final class OrdineServiceTest extends TestCase
{
    public function testCreaOrdineConPizzaEsistenteCalcolaIlTotaleCorretto(): void
    {
        // Arrange — repository finti, nessun database reale
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
// tests/Presentation/OrdineControllerTest.php — test di integrazione, con il vero kernel Symfony avviato
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

> 🧠 **La regola d'oro**: nota la stessa distinzione vista nelle altre playbook di questa piattaforma. `OrdineServiceTest` è un **test unitario puro**: nessun kernel Symfony avviato, gira in millisecondi grazie alla Clean Architecture (sezione 4). `OrdineControllerTest` è un **test di integrazione**: avvia l'intero kernel per verificare che routing, JSON, validazione e service funzionino davvero insieme. Servono entrambi, in proporzioni diverse: molti test unitari veloci, una manciata di test di integrazione mirati.

```bash
docker compose exec php bin/phpunit                                   # tutti i test
docker compose exec php bin/phpunit tests/Application/OrdineServiceTest.php   # una singola classe
```

### Step 7 — Avvia e prova

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

Un ultimo tocco professionale: gestisci `\DomainException` con un `404` onesto invece di lasciar trapelare un `500` generico:

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

Questo listener intercetta le eccezioni lanciate da **qualsiasi** controller dell'applicazione, in un unico punto — nessun `try/catch` ripetuto in ogni endpoint, lo stesso principio del gestore centralizzato di errori visto nelle altre playbook di questa piattaforma.

### Concetti applicati

- **Sezione 1**: `readonly`, constructor property promotion, `match`, nullsafe operator, attributi nativi al posto delle annotazioni
- **Sezione 2**: autowiring del Service Container, routing con attributi, injection sia nel costruttore che nei metodi delle action
- **Sezione 4**: separazione in `Domain` / `Application` / `Infrastructure` / `Presentation`, con dipendenze verso l'interno
- **Sezione 5**: Repository pattern per la persistenza, DTO immutabili per il contratto pubblico
- **Sezione 6**: Doctrine ORM, entity con prezzi come `decimal`/`string`, migration versionate
- **Sezione 7**: Controller come service, `#[MapRequestPayload]` per la validazione automatica dei DTO
- **Sezione 9 stessa**: Docker Compose con PHP-FPM + Nginx + PostgreSQL, test unitari con mock e test di integrazione con `WebTestCase`

---

## 🎉 Ce l'hai fatta!

Hai completato **Symfony is Alive and Kicking**. Ora sai:

- Come il PHP moderno (8.3+) abbia lasciato indietro il linguaggio del 2006: `enum`, `readonly`, `match`, nullsafe operator, attributi nativi
- I concetti base di Symfony: Service Container, autowiring, routing, HttpKernel, e come Symfony Flex configura automaticamente i pacchetti
- Quali parti storiche di PHP restano pericolose (confronti deboli, superglobali non validati) e quali strumenti del linguaggio e del framework le rendono evitabili in un progetto ben strutturato
- Clean Code e Clean Architecture applicate a un progetto Symfony reale: `Domain`, `Application`, `Infrastructure`, `Presentation`
- I design pattern più comuni — Repository, Strategy, Decorator (via service decoration), Observer (via EventDispatcher), Command (via Console e Messenger) — applicati in modo idiomatico
- Come usare Doctrine ORM correttamente: entity, migration versionate, e come evitare la trappola N+1 con i fetch join
- Come costruire viste moderne con Twig (sicuro di default) e validare form/API con il Form component e `#[MapRequestPayload]`
- Come gestire l'asincronia in modo pragmatico: PHP-FPM per il modello sincrono di base, Symfony Messenger per il lavoro in background, Fiber solo per scenari di concorrenza estrema
- Come mettere tutto insieme in **PizzaHub**, completamente dockerizzato con PHP-FPM, Nginx e PostgreSQL

**Dove andare da qui?**

- 📖 [Symfony Documentation](https://symfony.com/doc/current/index.html) — la documentazione ufficiale, tra le più complete dell'ecosistema PHP
- 🧪 [Doctrine ORM Documentation](https://www.doctrine-project.org/projects/doctrine-orm/en/current/index.html) — reference completa su query avanzate, mapping, e performance
- 📘 *PHP: The Right Way* — una guida community-driven alle pratiche moderne del linguaggio, ottima per chiunque arrivi da PHP "vecchio stile"
- 🐘 [PHP 8.3 Release Notes](https://www.php.net/releases/8.3/en.php) — le note ufficiali di release, utili per vedere esattamente cosa è cambiato versione per versione
- ☕ [Booting Spring Boot — Java Edition](/it/playbook/spring) — confronta lo stesso identico progetto, PizzaHub, scritto in Java/Spring Boot: utile per capire cosa cambia davvero tra ecosistemi e cosa invece è pattern universale

> 🧠 **Un ultimo consiglio**: PHP moderno con Symfony non ha bisogno di dimostrare nulla a nessuno — regge produzione su scala enorme da vent'anni, ed è cresciuto esattamente come gli altri linguaggi enterprise (tipi più forti, DI, ORM maturi). Il pregiudizio "PHP è morto" nasce quasi sempre da chi non l'ha più guardato dal 2010. Il pragmatismo vince anche qui: se il tuo team conosce già PHP, o il progetto richiede un time-to-market rapido con un ecosistema di hosting economico e diffusissimo, Symfony è una scelta seria, non un ripiego. Buon coding! 🐘
