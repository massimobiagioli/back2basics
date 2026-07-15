# Ruby: Le Parti Belle

Nel 1995, un programmatore giapponese di nome **Yukihiro Matsumoto** — tutti lo chiamano **Matz** — era insoddisfatto. Amava Perl per la sua potenza pratica e Smalltalk per la sua eleganza, ma nessuno dei due lo rendeva davvero felice mentre scriveva codice. Così ne creò uno nuovo, con un obiettivo dichiarato fin dal primo giorno: **la felicità del programmatore**.

Matz ha detto una frase che vale la pena ricordare: *"Ruby è progettato per rendere i programmatori felici"*. Non "veloce", non "efficiente", non "enterprise-ready". **Felice**. E questa scelta filosofica ha plasmato ogni singola parte del linguaggio: la sintassi si legge quasi come inglese, le cose "giuste" da fare sono spesso anche le più semplici da scrivere, e il linguaggio cerca sempre di sorprenderti il meno possibile.

Ruby è il linguaggio dietro **Ruby on Rails**, il framework che ha reso possibile GitHub, Shopify, Airbnb (nei suoi primi anni di crescita) e Basecamp. Ma Ruby è molto più del framework che lo ha reso famoso: è un linguaggio general-purpose, completamente orientato agli oggetti, dove **davvero tutto** — anche il numero `1`, anche `nil`, anche le classi stesse — è un oggetto che risponde a dei messaggi (cioè, a cui puoi chiamare dei metodi).

Questo playbook ti guida attraverso tutto quello che serve per scrivere Ruby vero, professionale e pulito: la sintassi, i pattern più usati, gli strumenti, il testing, e — soprattutto — cosa evitare come la peste.

---

## 1. Perché Ruby?

**In pillole**: Ruby è stato progettato esplicitamente per la felicità del programmatore, seguendo il "principio della minima sorpresa": il codice dovrebbe comportarsi come te lo aspetti, istintivamente.

### Il principio della minima sorpresa

Immagina di leggere questo codice per la prima volta:

```ruby
5.times { puts "Ciao!" }
```

Anche se non conoscessi Ruby, probabilmente capiresti: "stampa Ciao! cinque volte". Questo non è un caso. Matz ha progettato la sintassi in modo che il codice si legga come una frase, e che il comportamento sia quello che ti aspetteresti d'istinto — da qui il nome **"principle of least surprise"** (principio della minima sorpresa).

### Tutto è un oggetto

A differenza di molti linguaggi, in Ruby non esistono "tipi primitivi" separati dagli oggetti. Anche un numero intero è un oggetto che risponde a metodi:

```ruby
5.class        # => Integer
5.even?        # => false
5.times { }    # => esegue il blocco 5 volte
nil.class      # => NilClass
nil.to_s       # => ""
Integer.class  # => Class — persino le classi sono oggetti!
```

Questa coerenza ("tutto è un oggetto, senza eccezioni") rende Ruby prevedibile: non devi mai ricordare "questo è un tipo primitivo, quello è un oggetto, questo si comporta diversamente". Un'unica regola, sempre valida.

### Una sola via, non tante

Un malinteso comune: Ruby è "flessibile" quindi permette mille modi diversi per fare la stessa cosa, giusto? In realtà è quasi l'opposto. Il linguaggio **Perl** aveva un motto: *"There's more than one way to do it"* (c'è più di un modo per farlo — TIMTOWTDI). Matz **non era d'accordo**. Ruby preferisce offrire *una* via chiara ed elegante, piuttosto che dieci vie equivalenti che confondono chi legge. Certo, Ruby ti dà libertà espressiva (blocchi, metaprogrammazione), ma la community converge fortemente su uno stile idiomatico condiviso — vedrai le convenzioni nella sezione 7.

### Chi usa Ruby?

**GitHub** (scritto in Ruby on Rails fin dal day one), **Shopify** (uno degli e-commerce più grandi al mondo), **Basecamp/37signals** (dove Ruby on Rails è nato), **Airbnb** (nei suoi anni di crescita esplosiva), **Stripe** (usa Ruby in parti significative della sua infrastruttura), **Cookpad**. Ruby ha dimostrato di reggere prodotti usati da centinaia di milioni di persone.

---

## 2. Ruby non è Python

**In pillole**: Ruby e Python sono cugini filosoficamente vicini (entrambi leggibili, entrambi dinamici), ma il mindset è diverso: Ruby abbraccia i blocchi e il duck typing pieno, dove Python preferisce esplicitezza e list comprehension.

### Il mindset shift

Se conosci Python, alcune abitudini vanno ricalibrate:

```python
# Python: self esplicito in ogni metodo
class Cane:
    def abbaia(self):
        return f"{self.nome} abbaia!"
```

```ruby
# Ruby: self è implicito, non lo scrivi mai nei parametri
class Cane
  def abbaia
    "#{nome} abbaia!"
  end
end
```

In Ruby, dentro un metodo di istanza, `self` esiste sempre implicitamente — non lo dichiari come primo parametro. Questo è un cambio di abitudine importante per chi arriva da Python.

### Blocchi invece di list comprehension

Python usa le list comprehension per trasformare collezioni. Ruby usa i **blocchi** passati a metodi come `map`, `select`, `each`:

```python
# Python
quadrati = [x * x for x in numeri if x > 0]
```

```ruby
# Ruby
quadrati = numeri.select { |x| x > 0 }.map { |x| x * x }
```

Il vantaggio Ruby: lo stesso pattern (`.metodo { |x| ... }`) funziona su *qualsiasi* collezione (Array, Hash, Range, e persino sui tuoi oggetti custom), non solo dentro una sintassi speciale.

### Duck typing pieno

*"Se cammina come un'anatra e starnazza come un'anatra, allora è un'anatra"* — a Ruby non interessa la classe di un oggetto, solo se risponde ai metodi che gli servono:

```ruby
def stampa_nome(oggetto)
  puts oggetto.nome # funziona con QUALSIASI oggetto che abbia un metodo `nome`
end
```

Python supporta il duck typing anche lui, ma la cultura Ruby lo spinge molto più a fondo — è raro vedere controlli espliciti di tipo (`is_a?`) in codice Ruby idiomatico.

### Cosa guadagni, cosa perdi

| Aspetto | Guadagni passando a Ruby | Perdi rispetto a Python |
|---|---|---|
| Espressività | Sintassi più naturale, blocchi ovunque | Meno familiarità se vieni da un mondo scientifico/data (Python domina lì) |
| Web | Rails è tra i framework web più produttivi al mondo | Ecosistema ML/data science molto più ricco in Python |
| Stile | Community fortemente convergente su un unico stile idiomatico | Meno "un solo modo ovvio" di Python (il famoso Zen of Python) — Ruby è più permissivo nella pratica |
| Performance | Comparabile a Python (entrambi interpretati) | Nessun vantaggio in nessuna delle due direzioni |

---

## 3. Sintassi

**In pillole**: questa sezione copre il linguaggio dalla A alla Z — variabili, collezioni, metodi, blocchi, classi ed eccezioni. È la sezione più lunga, ma anche la più importante.

### Variabili, tipi primitivi (ricorda: sono tutti oggetti)

```ruby
nome = "Ada"          # String
eta = 36               # Integer
altezza = 1.65          # Float
attivo = true            # true / false (non esiste un tipo Boolean separato!)
niente = nil               # nil, l'equivalente di None/null
simbolo = :admin             # Symbol — lo vedremo tra poco
```

Ruby è a **tipizzazione dinamica**: non dichiari il tipo, e una variabile può cambiare tipo nel tempo (anche se farlo spesso è considerato cattivo stile).

### Stringhe

```ruby
nome = "Ada"
saluto = "Ciao, #{nome}!"          # interpolazione: SOLO con doppi apici
saluto2 = 'Ciao, #{nome}!'         # con apici singoli, #{} NON viene interpretato

"ciao".upcase                       # => "CIAO"
"  ciao  ".strip                     # => "ciao"
"ciao mondo".gsub("mondo", "Ruby")    # => "ciao Ruby"

# Heredoc: per stringhe multi-riga
testo = <<~TESTO
  Prima riga
  Seconda riga
TESTO
```

### Array e Hash

```ruby
numeri = [1, 2, 3, 4, 5]

numeri.map { |n| n * 2 }        # => [2, 4, 6, 8, 10]
numeri.select { |n| n.even? }    # => [2, 4]
numeri.reduce(0) { |somma, n| somma + n }  # => 15 (anche: numeri.sum)
numeri.each_with_object([]) { |n, arr| arr << n * n }  # => [1, 4, 9, 16, 25]

utente = { nome: "Ada", eta: 36 }  # Hash con symbol come chiavi (la forma più comune)
utente[:nome]                        # => "Ada"

nome = "Grace"
eta = 40
utente2 = { nome:, eta: }              # shorthand: se la variabile ha lo stesso nome della chiave
```

`map`, `select`, `reduce` fanno parte del modulo **Enumerable**, che qualsiasi collezione (e persino le tue classi custom, se implementi `each`) può includere. Impararlo bene è probabilmente la competenza Ruby più redditizia che puoi acquisire.

### Symbol vs String

```ruby
:nome.class    # => Symbol
"nome".class   # => String

:nome.object_id == :nome.object_id     # => true  (stesso oggetto in memoria, sempre)
"nome".object_id == "nome".object_id   # => false (due oggetti String diversi ogni volta)
```

I Symbol sono **immutabili** e **hanno sempre la stessa identità in memoria** — per questo sono perfetti come chiavi di Hash o nomi di metodi: Ruby non deve continuamente allocare nuova memoria per confrontarli. Regola pratica: usa Symbol per "etichette" fisse conosciute a tempo di scrittura (`:admin`, `:pending`), usa String per testo che arriva dall'utente o cambia a runtime.

### Metodi

```ruby
def saluta(nome, saluto = "Ciao")   # "saluto" ha un valore di default
  "#{saluto}, #{nome}!"                # l'ultima espressione è il valore di ritorno IMPLICITO
end

saluta("Ada")             # => "Ciao, Ada!"
saluta("Ada", "Salve")     # => "Salve, Ada!"

def crea_utente(nome:, eta: 18)        # keyword arguments: espliciti e leggibili alla chiamata
  { nome:, eta: }
end
crea_utente(nome: "Ada", eta: 36)

def somma(*numeri)          # splat: raccoglie argomenti extra in un array
  numeri.sum
end
somma(1, 2, 3, 4)  # => 10

def configura(**opzioni)    # double splat: raccoglie keyword arguments extra in un hash
  opzioni
end
configura(colore: "blu", taglia: "M")  # => { colore: "blu", taglia: "M" }
```

> 💡 **Tip**: non serve mai scrivere `return` esplicitamente in Ruby — l'ultima riga eseguita è automaticamente il valore restituito. Molti Rubyisti lo evitano di proposito, tranne per uscire in anticipo da un metodo (guard clause, vedi sezione 7).

### Blocchi, Proc e Lambda

I blocchi sono il cuore pulsante di Ruby — codice che passi a un metodo, che quel metodo può eseguire (con `yield`) zero, una o più volte.

```ruby
def ripeti(volte)
  volte.times { |i| yield(i) }   # yield esegue il blocco passato
end

ripeti(3) { |i| puts "Iterazione #{i}" }
# oppure con do...end (preferito per blocchi multi-riga)
ripeti(3) do |i|
  puts "Iterazione #{i}"
end
```

```ruby
def applica(numero, &operazione)   # &block cattura il blocco come oggetto Proc
  operazione.call(numero)
end
applica(5) { |n| n * n }  # => 25
```

Proc e Lambda sono entrambi "blocchi come oggetti", ma con differenze sottili:

```ruby
mio_proc = Proc.new { |a, b| a + b }
mia_lambda = lambda { |a, b| a + b }   # oppure: ->(a, b) { a + b }

mio_proc.call(1, 2, 3)     # => 3 (ignora l'argomento in più, non controlla l'arità)
mia_lambda.call(1, 2, 3)   # => ArgumentError! le lambda controllano il numero di argomenti

# dentro un metodo:
# `return` in un Proc esce dal METODO che lo contiene
# `return` in una Lambda esce solo dalla lambda stessa
```

> 🧠 **La regola d'oro**: se hai bisogno di un comportamento simile a un metodo (controllo argomenti, `return` locale), usa una lambda. Se ti serve solo un pezzo di codice "morbido" da eseguire, un blocco semplice basta quasi sempre.

### Controllo di flusso

```ruby
if eta >= 18
  "maggiorenne"
elsif eta >= 13
  "adolescente"
else
  "bambino"
end

puts "Ciao!" if utente_loggato       # modificatore postfisso — molto idiomatico in Ruby
puts "Attenzione" unless valido        # unless = if not, ma solo per condizioni semplici

case stato
when "pending"   then "In attesa"
when "completed" then "Completato"
else "Sconosciuto"
end

while numeri.any?
  numeri.pop
end
```

### Classi e moduli

```ruby
class Animale
  attr_accessor :nome        # genera automaticamente getter E setter
  attr_reader :specie          # solo getter

  def initialize(nome, specie)
    @nome = nome
    @specie = specie
  end

  def self.crea_gatto(nome)    # metodo di CLASSE (self. = Animale, non un'istanza)
    new(nome, "gatto")
  end

  def presentati
    "Sono #{nome}, un #{specie}"
  end
end

class Cane < Animale             # ereditarietà con <
  def initialize(nome)
    super(nome, "cane")           # chiama initialize della classe padre
  end
end
```

I moduli servono come **mixin** — comportamento condiviso tra classi non imparentate:

```ruby
module Nuotabile
  def nuota
    "#{nome} sta nuotando!"
  end
end

class Pesce < Animale
  include Nuotabile   # aggiunge i metodi del modulo come metodi di ISTANZA
end

class UtilitaAcquatiche
  extend Nuotabile     # extend aggiunge i metodi come metodi di CLASSE
end
```

### Gestione delle eccezioni

```ruby
class SaldoInsufficienteError < StandardError; end

def preleva(conto, importo)
  raise SaldoInsufficienteError, "Saldo insufficiente" if importo > conto.saldo
  conto.saldo -= importo
end

begin
  preleva(conto, 1000)
rescue SaldoInsufficienteError => e
  puts "Errore: #{e.message}"
ensure
  puts "Operazione conclusa (con o senza errore)"
end
```

### Un accenno di metaprogrammazione

Ruby permette di scrivere codice che scrive codice — potente, ma da maneggiare con cautela:

```ruby
class Configurazione
  def method_missing(nome_metodo, *args)   # intercetta chiamate a metodi inesistenti
    nome_metodo.to_s.start_with?("get_") ? "valore di configurazione" : super
  end
end

class Modello
  %i[nome email].each do |attributo|          # define_method crea metodi dinamicamente
    define_method(attributo) { instance_variable_get("@#{attributo}") }
  end
end
```

> 🧠 **La regola d'oro**: la metaprogrammazione è affascinante e a volte necessaria (è così che funzionano `attr_accessor` e gran parte di Rails), ma rende il codice più difficile da seguire con "vai alla definizione". Usala quando il guadagno è chiaro, non per sembrare intelligente.

---

## 4. Gli Strumenti

**In pillole**: Ruby ha una cassetta degli attrezzi minimale ma efficace — un REPL, un gestore di pacchetti, un linter, e un debugger integrato.

### `irb` — Interactive Ruby

Il REPL (Read-Eval-Print-Loop) di Ruby, per esplorare e sperimentare al volo:

```bash
irb
```

```ruby
irb(main):001> [1, 2, 3].sum
=> 6
irb(main):002> "ciao".reverse
=> "oiac"
```

Ottimo per verificare in 5 secondi come si comporta un metodo, prima di scriverlo nel codice vero.

### `gem`, `bundle`, Gemfile

Le librerie Ruby si chiamano **gemme** (gems). Un progetto dichiara le sue dipendenze in un `Gemfile`:

```ruby
# Gemfile
source "https://rubygems.org"

gem "rspec"
gem "rubocop", require: false
```

```bash
bundle install     # installa tutte le gemme del Gemfile, versioni bloccate in Gemfile.lock
bundle exec rspec    # esegue un comando usando ESATTAMENTE le versioni bloccate
```

### `rails console` — un REPL "aumentato"

Se lavori dentro un'app Rails (vedi il playbook **Ruby on Rails: Applicazioni Professionali**), hai a disposizione `bin/rails console`: è concettualmente un `irb`, ma con tutti i model e la configurazione della tua app già caricati automaticamente.

```bash
bin/rails console
```

```ruby
User.count          # => 42, senza scrivere query SQL a mano
User.last.email      # => "ada@example.com"
```

È lo strumento numero uno per esplorare i dati di un'applicazione reale mentre la sviluppi o la debugghi.

### RuboCop — linter e formatter

RuboCop controlla che il tuo codice segua le convenzioni di stile della community Ruby, e può correggere automaticamente molti problemi:

```bash
bundle exec rubocop           # analizza il codice, elenca i problemi
bundle exec rubocop -a          # corregge automaticamente ciò che può
```

### Il debugger integrato

La gemma `debug` (inclusa di default nelle installazioni Ruby moderne) permette di mettere un breakpoint interattivo direttamente nel codice:

```ruby
def calcola_totale(carrello)
  binding.irb   # l'esecuzione si ferma qui, apre una console irb con accesso a `carrello`
  carrello.sum(&:prezzo)
end
```

---

## 5. Design Pattern più famosi in Ruby

**In pillole**: Ruby si presta naturalmente ad alcuni pattern grazie ai blocchi, ai moduli e al duck typing. I due più diffusi nel mondo Ruby/Rails sono Factory e Service Object.

### Factory Pattern

Un Factory decide **quale classe istanziare** in base a un input, nascondendo quella decisione al chiamante:

```ruby
class NotificationFactory
  def self.build(type, destinatario:, messaggio:)
    case type
    when :email then EmailNotification.new(destinatario, messaggio)
    when :sms   then SmsNotification.new(destinatario, messaggio)
    else
      raise ArgumentError, "Tipo di notifica sconosciuto: #{type}"
    end
  end
end

class EmailNotification
  def initialize(destinatario, messaggio)
    @destinatario = destinatario
    @messaggio = messaggio
  end

  def invia = puts "Email a #{@destinatario}: #{@messaggio}"
end

class SmsNotification
  def initialize(destinatario, messaggio)
    @destinatario = destinatario
    @messaggio = messaggio
  end

  def invia = puts "SMS a #{@destinatario}: #{@messaggio}"
end

notifica = NotificationFactory.build(:email, destinatario: "ada@example.com", messaggio: "Ciao!")
notifica.invia
```

Il vantaggio: il codice chiamante non deve sapere nulla delle classi concrete (`EmailNotification`, `SmsNotification`) — chiede solo "dammi una notifica di tipo `:email`", e la Factory si occupa del resto. Aggiungere un nuovo tipo (`:push`) significa toccare solo la Factory, non ogni punto del codice che invia notifiche.

### Service Object Pattern

Il pattern più idiomatico del mondo Ruby/Rails: una classe con **un solo scopo pubblico**, spesso esposto tramite un metodo `.call`. Incapsula un'azione di business che non appartiene naturalmente a un solo model.

```ruby
class RegisterUser
  def self.call(...) = new(...).call

  def initialize(nome:, email:)
    @nome = nome
    @email = email
  end

  def call
    return Result.new(success: false, errors: ["Email non valida"]) unless email_valida?

    utente = User.create(nome: @nome, email: @email)
    EventPublisher.publish(:utente_registrato, utente)

    Result.new(success: true, utente: utente)
  end

  private

  def email_valida? = @email.include?("@")

  Result = Struct.new(:success, :utente, :errors, keyword_init: true)
end

risultato = RegisterUser.call(nome: "Ada", email: "ada@example.com")
risultato.success  # => true
```

Perché è così popolare: **disaccoppia la business logic** dal controller (che resta una riga: `RegisterUser.call(...)`) e dal model (che resta focalizzato sui dati, non su ogni possibile azione che coinvolge un utente). E si testa da solo, senza bisogno di un intero framework web — lo vedremo nella sezione 8.

### Bonus: Null Object Pattern

Invece di controllare `nil` ovunque nel codice, crei un oggetto "vuoto" che risponde agli stessi metodi:

```ruby
class GuestUser
  def nome = "Ospite"
  def loggato? = false
  def admin? = false
end

# invece di scrivere ovunque:
# nome_da_mostrare = current_user.nil? ? "Ospite" : current_user.nome

# scrivi semplicemente:
nome_da_mostrare = current_user.nome   # current_user è sempre un oggetto, mai nil
```

Questo elimina intere classi di bug legati a `NoMethodError: undefined method for nil:NilClass` — l'errore più comune in Ruby per chi dimentica di controllare `nil`.

---

## 6. Good Parts & Bad Parts

Una valutazione onesta, senza marketing.

### ✅ Good Parts

| Forza | Perché |
|---|---|
| **Espressività e leggibilità** | Il codice Ruby si legge quasi come inglese. `3.times { }`, `array.select { }`: l'intento è chiaro a colpo d'occhio. |
| **Blocchi ed Enumerable** | `map`, `select`, `reduce` funzionano ovunque, uniformemente. Una volta imparati, trasformi qualsiasi collezione con poche righe. |
| **Tutto è un oggetto, senza eccezioni** | Nessuna distinzione artificiale tra "tipi primitivi" e oggetti veri. Una sola regola mentale da ricordare. |
| **Metaprogrammazione quando serve davvero** | Permette librerie eleganti (è così che funziona gran parte di Rails) senza codice ripetuto. |
| **Community e gemme** | RubyGems ha soluzioni mature per quasi ogni problema comune. |
| **Piacevole da scrivere** | La filosofia della "felicità del programmatore" si sente concretamente, riga dopo riga. |

### ❌ Bad Parts

| Debolezza | Dettaglio |
|---|---|
| **Performance runtime** | Più lento di linguaggi compilati (Go, Rust, C++) su calcoli intensivi. Ruby non è la scelta giusta per elaborazione numerica pesante. |
| **GIL e concorrenza limitata** | Il Global Interpreter Lock (nell'implementazione MRI standard) limita il vero parallelismo tra thread. Esistono soluzioni (processi, Ractor), ma non è "gratis" come in altri linguaggi. |
| **La stessa flessibilità può diventare magia oscura** | `method_missing`, monkey patching e metaprogrammazione spinta rendono a volte impossibile capire "da dove viene questo metodo" senza documentazione. |
| **Tipizzazione dinamica** | Errori di tipo emergono a runtime, non a compile time. Un typo in un nome di metodo lo scopri solo eseguendo quel percorso di codice. |
| **Meno adatto a data science/ML** | Python domina nettamente quell'ecosistema; Ruby non ha nulla di comparabile a NumPy/PyTorch. |

> 🧠 **La regola d'oro**: usa Ruby quando la leggibilità e la velocità di sviluppo contano più della performance bruta — applicazioni web, script di automazione, prototipi che diventeranno prodotti reali. Evitalo per calcolo numerico intensivo o sistemi realtime con vincoli di latenza durissimi.

---

## 7. Clean Code in Ruby

**In pillole**: Ruby premia il codice piccolo, con nomi onesti, e con un solo livello di responsabilità per metodo. Le "regole di Sandi Metz" sono la guida pratica più citata nella community.

### Naming: i metodi parlano da soli

```ruby
def valido?          # il punto interrogativo segnala: ritorna true/false
  errors.empty?
end

def salva!            # il punto esclamativo segnala: pericoloso — modifica lo stato,
  save || raise         # o solleva un'eccezione invece di ritornare false silenziosamente
end
```

Questa convenzione (`?` per predicati, `!` per metodi "pericolosi") non è imposta dal linguaggio — è una convenzione della community, ma seguirla rende il tuo codice immediatamente comprensibile a qualsiasi altro Rubyista.

### Le regole di Sandi Metz

Sandi Metz, autrice di *"Practical Object-Oriented Design in Ruby"*, propone quattro linee guida (non leggi assolute, ma buone regole per farti fermare a pensare quando le sfori):

| Regola | Limite | Perché |
|---|---|---|
| Dimensione classe | Massimo ~100 righe | Una classe troppo grande fa troppe cose (viola il Single Responsibility Principle) |
| Dimensione metodo | Massimo ~5 righe | Un metodo lungo nasconde più di un livello di astrazione |
| Parametri per metodo | Massimo 4 | Troppi parametri sono un segnale che serve un oggetto a parte |
| Istanziazione oggetti | Un solo oggetto nuovo per metodo | Troppi oggetti creati in un punto solo = troppa conoscenza concentrata |

### Guard clause invece di `if` annidati

```ruby
# ❌ annidamento profondo, difficile da seguire
def processa(ordine)
  if ordine
    if ordine.valido?
      if ordine.pagato?
        spedisci(ordine)
      end
    end
  end
end

# ✅ guard clause: esci presto, il "caso felice" resta leggibile alla fine
def processa(ordine)
  return unless ordine
  return unless ordine.valido?
  return unless ordine.pagato?

  spedisci(ordine)
end
```

### Commenti: lascia che il codice si spieghi da solo

```ruby
# ❌ il commento ripete quello che il codice già dice
# controlla se l'utente è maggiorenne
if utente.eta >= 18
  # ...
end

# ✅ un nome di metodo onesto elimina il bisogno del commento
if utente.maggiorenne?
  # ...
end
```

Un commento utile spiega il **perché**, non il **cosa**: *"# usiamo 18 e non 21 perché la legge italiana definisce la maggiore età così"* ha senso. *"# controlla l'età"* no — il codice lo dice già.

### Evita le classi "Dio"

Una classe che fa di tutto (`User` che gestisce autenticazione, invio email, generazione report, validazione pagamenti...) è impossibile da testare in isolamento e difficile da modificare senza rompere qualcos'altro. Il Service Object (sezione 5) è spesso l'antidoto: sposta i comportamenti specifici fuori dal model, mantenendo il model focalizzato sui suoi dati e le sue invarianti dirette.

---

## 8. Testing con RSpec

**In pillole**: RSpec è il framework di test più diffuso nella community Ruby. Descrive il comportamento atteso in linguaggio quasi naturale, con `describe`, `context` e `it`.

### Struttura base

```ruby
# spec/models/task_spec.rb
require "rails_helper" # o "spec_helper" fuori da Rails

RSpec.describe Task do
  describe "#completato?" do
    context "quando lo stato è 'done'" do
      it "ritorna true" do
        task = Task.new(stato: "done")
        expect(task.completato?).to eq(true)
      end
    end

    context "quando lo stato non è 'done'" do
      it "ritorna false" do
        task = Task.new(stato: "pending")
        expect(task.completato?).to be_falsey
      end
    end
  end
end
```

Matcher comuni: `eq`, `be_truthy`/`be_falsey`, `include`, `raise_error`, `change { ... }`.

### `let` vs `before`

```ruby
RSpec.describe RegisterUser do
  let(:email) { "ada@example.com" }   # lazy: viene valutato solo alla PRIMA chiamata, in ogni "it"

  before do
    Rails.cache.clear   # eager: viene eseguito SEMPRE prima di ogni "it", anche se non usato
  end
end
```

`let` è preferito quando il valore serve solo ad alcuni test (evita lavoro sprecato); `before` è utile per side-effect necessari a *tutti* i test del blocco.

### Esempio completo: testare un Service Object con un mock

Ecco lo scenario più pratico e realistico: testare `RegisterUser` (sezione 5) **senza inviare davvero un'email**, mockando la dipendenza esterna.

```ruby
# app/services/register_user.rb
class RegisterUser
  def self.call(...) = new(...).call

  def initialize(nome:, email:, mailer: WelcomeMailer)
    @nome = nome
    @email = email
    @mailer = mailer
  end

  def call
    return Result.new(success: false, errors: ["Email non valida"]) unless email_valida?

    utente = User.create!(nome: @nome, email: @email)
    @mailer.welcome(utente).deliver_later

    Result.new(success: true, utente: utente)
  end

  private

  def email_valida? = @email.include?("@")

  Result = Struct.new(:success, :utente, :errors, keyword_init: true)
end
```

```ruby
# spec/services/register_user_spec.rb
require "rails_helper"

RSpec.describe RegisterUser do
  describe ".call" do
    context "con un'email valida" do
      it "crea l'utente e invia l'email di benvenuto" do
        mailer_double = instance_double(WelcomeMailer)
        mail_double = instance_double(ActionMailer::MessageDelivery)

        allow(WelcomeMailer).to receive(:welcome).and_return(mail_double)
        allow(mail_double).to receive(:deliver_later)

        risultato = RegisterUser.call(nome: "Ada", email: "ada@example.com", mailer: WelcomeMailer)

        expect(risultato.success).to eq(true)
        expect(WelcomeMailer).to have_received(:welcome).with(risultato.utente)
        expect(mail_double).to have_received(:deliver_later)
      end
    end

    context "con un'email non valida" do
      it "non crea l'utente e ritorna un errore" do
        risultato = RegisterUser.call(nome: "Ada", email: "non-valida", mailer: WelcomeMailer)

        expect(risultato.success).to eq(false)
        expect(risultato.errors).to include("Email non valida")
      end
    end
  end
end
```

Nota due tecniche chiave:

- **`instance_double(WelcomeMailer)`**: crea un "doppio" (mock) che verifica automaticamente che `WelcomeMailer` abbia davvero un metodo `welcome` con quella firma — se rinomini il metodo reale, il test si rompe subito, invece di continuare a passare con un mock ormai bugiardo.
- **`allow(...).to receive(...)`**: sostituisce la chiamata reale (che manderebbe davvero un'email) con un comportamento controllato, così il test è veloce, deterministico, e non dipende da un servizio email esterno.

> 🧠 **La regola d'oro**: mocka le dipendenze esterne (email, API di pagamento, chiamate di rete) — non mockare mai l'oggetto che stai effettivamente testando. Se ti ritrovi a mockare troppo il "cuore" del tuo codice, probabilmente il design ha troppe responsabilità mescolate insieme.

### FactoryBot, in breve

Per generare dati di test realistici senza scrivere `User.create!(...)` con 10 campi ogni volta:

```ruby
# spec/factories/users.rb
FactoryBot.define do
  factory :user do
    nome { "Ada" }
    email { "ada@example.com" }
  end
end

utente = create(:user, nome: "Grace")  # crea un utente reale nel database, con i default della factory
```

---

## 🎉 Ce l'hai fatta!

Hai completato **Ruby: Le Parti Belle**. Ora sai:

- Perché Ruby esiste e come il "principio della minima sorpresa" plasma tutto il linguaggio
- Come differisce da Python e perché il mindset shift ne vale la pena
- La sintassi fondamentale: variabili, collezioni, blocchi, classi, moduli, eccezioni
- Gli strumenti quotidiani: `irb`, Bundler, RuboCop, il debugger integrato
- I design pattern più idiomatici: Factory e Service Object
- Cosa amare di Ruby, e cosa evitare come la peste bubbonica
- Scrivere codice pulito seguendo le regole di Sandi Metz
- Testare con RSpec, incluso mockare una dipendenza esterna in un Service Object

**Dove andare ora?**

- 📖 [Ruby Official Docs](https://www.ruby-lang.org/it/documentation/) — la documentazione ufficiale
- 🧪 [RSpec Docs](https://rspec.info) — approfondisci matcher e tecniche di test avanzate
- 📘 *Practical Object-Oriented Design in Ruby* di Sandi Metz — il libro di riferimento per il clean code in Ruby
- 🎨 [Ruby Style Guide](https://rubystyle.guide) — le convenzioni di stile che RuboCop applica
- 💎 [Ruby on Rails: Applicazioni Professionali](/it/playbook/rails) — il prossimo passo: costruire vere applicazioni web

> 🧠 **L'ultimo consiglio**: non cercare di imparare tutto in una volta. Scrivi codice, leggi codice altrui idiomatico, e lascia che la sintassi diventi naturale con la pratica. Ruby è stato progettato per farti sorridere mentre lo scrivi — se non ti sta succedendo, probabilmente stai combattendo contro il linguaggio invece di lavorare con lui. Buon coding! 💎
