# Ruby: The Good Parts

In 1995, a Japanese programmer named **Yukihiro Matsumoto** — everyone calls him **Matz** — was unsatisfied. He loved Perl for its practical power and Smalltalk for its elegance, but neither one truly made him happy while writing code. So he created a new one, with a stated goal from day one: **programmer happiness**.

Matz once said something worth remembering: *"Ruby is designed to make programmers happy."* Not "fast," not "efficient," not "enterprise-ready." **Happy**. And that philosophical choice shaped every single part of the language: the syntax reads almost like English, the "right" thing to do is often also the simplest thing to write, and the language always tries to surprise you as little as possible.

Ruby is the language behind **Ruby on Rails**, the framework that made GitHub, Shopify, Airbnb (in its early growth years), and Basecamp possible. But Ruby is much more than the framework that made it famous: it's a general-purpose, fully object-oriented language, where **truly everything** — even the number `1`, even `nil`, even classes themselves — is an object that responds to messages (that is, that you can call methods on).

This playbook walks you through everything you need to write real, professional, clean Ruby: the syntax, the most common patterns, the tools, testing, and — above all — what to avoid like the plague.

---

## 1. Why Ruby?

**In short**: Ruby was explicitly designed for programmer happiness, following the "principle of least surprise": code should behave the way you instinctively expect it to.

### The principle of least surprise

Imagine reading this code for the first time:

```ruby
5.times { puts "Hello!" }
```

Even if you didn't know Ruby, you'd probably understand: "print Hello! five times." That's not an accident. Matz designed the syntax so that code reads like a sentence, and so that the behavior is what you'd instinctively expect — hence the name **"principle of least surprise."**

### Everything is an object

Unlike many languages, Ruby has no "primitive types" separate from objects. Even an integer is an object that responds to methods:

```ruby
5.class        # => Integer
5.even?        # => false
5.times { }    # => runs the block 5 times
nil.class      # => NilClass
nil.to_s       # => ""
Integer.class  # => Class — even classes are objects!
```

This consistency ("everything is an object, no exceptions") makes Ruby predictable: you never have to remember "this is a primitive type, that's an object, this one behaves differently." One single rule, always true.

### One way, not many

A common misconception: Ruby is "flexible," so it must allow a thousand different ways to do the same thing, right? Actually, it's almost the opposite. The **Perl** language had a motto: *"There's more than one way to do it"* (TIMTOWTDI). Matz **disagreed**. Ruby prefers to offer *one* clear, elegant way, rather than ten equivalent ways that confuse the reader. Sure, Ruby gives you expressive freedom (blocks, metaprogramming), but the community converges strongly on a shared idiomatic style — you'll see the conventions in section 7.

### Who uses Ruby?

**GitHub** (written in Ruby on Rails since day one), **Shopify** (one of the biggest e-commerce platforms in the world), **Basecamp/37signals** (where Ruby on Rails was born), **Airbnb** (during its explosive growth years), **Stripe** (uses Ruby in significant parts of its infrastructure), **Cookpad**. Ruby has proven it can carry products used by hundreds of millions of people.

---

## 2. Ruby is not Python

**In short**: Ruby and Python are philosophically close cousins (both readable, both dynamic), but the mindset is different: Ruby embraces blocks and full duck typing, where Python prefers explicitness and list comprehensions.

### The mindset shift

If you know Python, a few habits need recalibrating:

```python
# Python: explicit self in every method
class Cane:
    def abbaia(self):
        return f"{self.nome} abbaia!"
```

```ruby
# Ruby: self is implicit, you never write it as a parameter
class Cane
  def abbaia
    "#{nome} abbaia!"
  end
end
```

In Ruby, inside an instance method, `self` always exists implicitly — you don't declare it as the first parameter. This is an important habit shift for anyone coming from Python.

### Blocks instead of list comprehensions

Python uses list comprehensions to transform collections. Ruby uses **blocks** passed to methods like `map`, `select`, `each`:

```python
# Python
quadrati = [x * x for x in numeri if x > 0]
```

```ruby
# Ruby
quadrati = numeri.select { |x| x > 0 }.map { |x| x * x }
```

The Ruby advantage: the same pattern (`.metodo { |x| ... }`) works on *any* collection (Array, Hash, Range, and even your own custom objects), not just inside a special syntax.

### Full duck typing

*"If it walks like a duck and quacks like a duck, then it's a duck"* — Ruby doesn't care about an object's class, only whether it responds to the methods it needs:

```ruby
def stampa_nome(oggetto)
  puts oggetto.nome # works with ANY object that has a `nome` method
end
```

Python supports duck typing too, but the Ruby culture pushes it much further — it's rare to see explicit type checks (`is_a?`) in idiomatic Ruby code.

### What you gain, what you lose

| Aspect | What you gain moving to Ruby | What you lose compared to Python |
|---|---|---|
| Expressiveness | More natural syntax, blocks everywhere | Less familiarity if you come from a scientific/data background (Python dominates there) |
| Web | Rails is among the most productive web frameworks in the world | Much richer ML/data science ecosystem in Python |
| Style | Community strongly converges on a single idiomatic style | Less "one obvious way" than Python (the famous Zen of Python) — Ruby is more permissive in practice |
| Performance | Comparable to Python (both interpreted) | No advantage in either direction |

---

## 3. Syntax

**In short**: this section covers the language from A to Z — variables, collections, methods, blocks, classes, and exceptions. It's the longest section, but also the most important.

### Variables, primitive types (remember: they're all objects)

```ruby
nome = "Ada"          # String
eta = 36               # Integer
altezza = 1.65          # Float
attivo = true            # true / false (there's no separate Boolean type!)
niente = nil               # nil, the equivalent of None/null
simbolo = :admin             # Symbol — we'll see it shortly
```

Ruby is **dynamically typed**: you don't declare the type, and a variable can change type over time (though doing so often is considered bad style).

### Strings

```ruby
nome = "Ada"
saluto = "Ciao, #{nome}!"          # interpolation: ONLY with double quotes
saluto2 = 'Ciao, #{nome}!'         # with single quotes, #{} is NOT interpreted

"ciao".upcase                       # => "CIAO"
"  ciao  ".strip                     # => "ciao"
"ciao mondo".gsub("mondo", "Ruby")    # => "ciao Ruby"

# Heredoc: for multi-line strings
testo = <<~TESTO
  Prima riga
  Seconda riga
TESTO
```

### Arrays and Hashes

```ruby
numeri = [1, 2, 3, 4, 5]

numeri.map { |n| n * 2 }        # => [2, 4, 6, 8, 10]
numeri.select { |n| n.even? }    # => [2, 4]
numeri.reduce(0) { |somma, n| somma + n }  # => 15 (also: numeri.sum)
numeri.each_with_object([]) { |n, arr| arr << n * n }  # => [1, 4, 9, 16, 25]

utente = { nome: "Ada", eta: 36 }  # Hash with symbols as keys (the most common form)
utente[:nome]                        # => "Ada"

nome = "Grace"
eta = 40
utente2 = { nome:, eta: }              # shorthand: when the variable has the same name as the key
```

`map`, `select`, `reduce` are part of the **Enumerable** module, which any collection (and even your own custom classes, if you implement `each`) can include. Learning it well is probably the single most valuable Ruby skill you can pick up.

### Symbol vs String

```ruby
:nome.class    # => Symbol
"nome".class   # => String

:nome.object_id == :nome.object_id     # => true  (same object in memory, always)
"nome".object_id == "nome".object_id   # => false (two different String objects each time)
```

Symbols are **immutable** and **always have the same identity in memory** — that's why they're perfect as Hash keys or method names: Ruby doesn't need to keep allocating new memory just to compare them. Rule of thumb: use Symbols for fixed "labels" known at write time (`:admin`, `:pending`), use Strings for text that comes from the user or changes at runtime.

### Methods

```ruby
def saluta(nome, saluto = "Ciao")   # "saluto" has a default value
  "#{saluto}, #{nome}!"                # the last expression is the IMPLICIT return value
end

saluta("Ada")             # => "Ciao, Ada!"
saluta("Ada", "Salve")     # => "Salve, Ada!"

def crea_utente(nome:, eta: 18)        # keyword arguments: explicit and readable at the call site
  { nome:, eta: }
end
crea_utente(nome: "Ada", eta: 36)

def somma(*numeri)          # splat: collects extra arguments into an array
  numeri.sum
end
somma(1, 2, 3, 4)  # => 10

def configura(**opzioni)    # double splat: collects extra keyword arguments into a hash
  opzioni
end
configura(colore: "blu", taglia: "M")  # => { colore: "blu", taglia: "M" }
```

> 💡 **Tip**: you never need to write `return` explicitly in Ruby — the last line executed is automatically the returned value. Many Rubyists avoid it on purpose, except to exit a method early (guard clause, see section 7).

### Blocks, Procs, and Lambdas

Blocks are the beating heart of Ruby — code you pass to a method, which that method can run (with `yield`) zero, one, or many times.

```ruby
def ripeti(volte)
  volte.times { |i| yield(i) }   # yield runs the passed block
end

ripeti(3) { |i| puts "Iterazione #{i}" }
# or with do...end (preferred for multi-line blocks)
ripeti(3) do |i|
  puts "Iterazione #{i}"
end
```

```ruby
def applica(numero, &operazione)   # &block captures the block as a Proc object
  operazione.call(numero)
end
applica(5) { |n| n * n }  # => 25
```

Procs and Lambdas are both "blocks as objects," but with subtle differences:

```ruby
mio_proc = Proc.new { |a, b| a + b }
mia_lambda = lambda { |a, b| a + b }   # or: ->(a, b) { a + b }

mio_proc.call(1, 2, 3)     # => 3 (ignores the extra argument, doesn't check arity)
mia_lambda.call(1, 2, 3)   # => ArgumentError! lambdas check the number of arguments

# inside a method:
# `return` in a Proc exits the ENCLOSING METHOD
# `return` in a Lambda only exits the lambda itself
```

> 🧠 **The golden rule**: if you need method-like behavior (argument checking, local `return`), use a lambda. If you just need a "soft" piece of code to run, a plain block is almost always enough.

### Control flow

```ruby
if eta >= 18
  "maggiorenne"
elsif eta >= 13
  "adolescente"
else
  "bambino"
end

puts "Ciao!" if utente_loggato       # postfix modifier — very idiomatic in Ruby
puts "Attenzione" unless valido        # unless = if not, but only for simple conditions

case stato
when "pending"   then "In attesa"
when "completed" then "Completato"
else "Sconosciuto"
end

while numeri.any?
  numeri.pop
end
```

### Classes and modules

```ruby
class Animale
  attr_accessor :nome        # automatically generates a getter AND a setter
  attr_reader :specie          # getter only

  def initialize(nome, specie)
    @nome = nome
    @specie = specie
  end

  def self.crea_gatto(nome)    # CLASS method (self. = Animale, not an instance)
    new(nome, "gatto")
  end

  def presentati
    "Sono #{nome}, un #{specie}"
  end
end

class Cane < Animale             # inheritance with <
  def initialize(nome)
    super(nome, "cane")           # calls the parent class's initialize
  end
end
```

Modules act as **mixins** — shared behavior across unrelated classes:

```ruby
module Nuotabile
  def nuota
    "#{nome} sta nuotando!"
  end
end

class Pesce < Animale
  include Nuotabile   # adds the module's methods as INSTANCE methods
end

class UtilitaAcquatiche
  extend Nuotabile     # extend adds the methods as CLASS methods
end
```

### Exception handling

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

### A touch of metaprogramming

Ruby lets you write code that writes code — powerful, but to be handled with care:

```ruby
class Configurazione
  def method_missing(nome_metodo, *args)   # intercepts calls to nonexistent methods
    nome_metodo.to_s.start_with?("get_") ? "valore di configurazione" : super
  end
end

class Modello
  %i[nome email].each do |attributo|          # define_method creates methods dynamically
    define_method(attributo) { instance_variable_get("@#{attributo}") }
  end
end
```

> 🧠 **The golden rule**: metaprogramming is fascinating and sometimes necessary (it's how `attr_accessor` and much of Rails work), but it makes code harder to follow with "go to definition." Use it when the payoff is clear, not to look smart.

---

## 4. The Tools

**In short**: Ruby has a minimal but effective toolbox — a REPL, a package manager, a linter, and a built-in debugger.

### `irb` — Interactive Ruby

Ruby's REPL (Read-Eval-Print-Loop), for exploring and experimenting on the fly:

```bash
irb
```

```ruby
irb(main):001> [1, 2, 3].sum
=> 6
irb(main):002> "ciao".reverse
=> "oiac"
```

Great for checking in 5 seconds how a method behaves, before writing it into real code.

### `gem`, `bundle`, Gemfile

Ruby libraries are called **gems**. A project declares its dependencies in a `Gemfile`:

```ruby
# Gemfile
source "https://rubygems.org"

gem "rspec"
gem "rubocop", require: false
```

```bash
bundle install     # installs all gems from the Gemfile, versions locked in Gemfile.lock
bundle exec rspec    # runs a command using EXACTLY the locked versions
```

### `rails console` — an "augmented" REPL

If you're working inside a Rails app (see the **Ruby on Rails: Professional Applications** playbook), you have `bin/rails console` available: it's conceptually an `irb`, but with all your app's models and configuration already loaded automatically.

```bash
bin/rails console
```

```ruby
User.count          # => 42, without writing a single line of SQL by hand
User.last.email      # => "ada@example.com"
```

It's the number-one tool for exploring a real application's data while developing or debugging it.

### RuboCop — linter and formatter

RuboCop checks that your code follows the Ruby community's style conventions, and can automatically fix many issues:

```bash
bundle exec rubocop           # analyzes the code, lists the issues
bundle exec rubocop -a          # automatically fixes what it can
```

### The built-in debugger

The `debug` gem (included by default in modern Ruby installations) lets you drop an interactive breakpoint directly into your code:

```ruby
def calcola_totale(carrello)
  binding.irb   # execution stops here, opens an irb console with access to `carrello`
  carrello.sum(&:prezzo)
end
```

---

## 5. The Most Famous Design Patterns in Ruby

**In short**: Ruby naturally lends itself to some patterns thanks to blocks, modules, and duck typing. The two most widespread in the Ruby/Rails world are Factory and Service Object.

### Factory Pattern

A Factory decides **which class to instantiate** based on an input, hiding that decision from the caller:

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

The advantage: the calling code doesn't need to know anything about the concrete classes (`EmailNotification`, `SmsNotification`) — it just asks "give me a notification of type `:email`," and the Factory handles the rest. Adding a new type (`:push`) means touching only the Factory, not every place in the code that sends notifications.

### Service Object Pattern

The most idiomatic pattern in the Ruby/Rails world: a class with **a single public purpose**, often exposed through a `.call` method. It encapsulates a business action that doesn't naturally belong to a single model.

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

Why it's so popular: it **decouples the business logic** from the controller (which stays a single line: `RegisterUser.call(...)`) and from the model (which stays focused on its data, not on every possible action that involves a user). And it tests itself, without needing an entire web framework — we'll see this in section 8.

### Bonus: Null Object Pattern

Instead of checking for `nil` everywhere in the code, you create an "empty" object that responds to the same methods:

```ruby
class GuestUser
  def nome = "Ospite"
  def loggato? = false
  def admin? = false
end

# instead of writing everywhere:
# nome_da_mostrare = current_user.nil? ? "Ospite" : current_user.nome

# you simply write:
nome_da_mostrare = current_user.nome   # current_user is always an object, never nil
```

This eliminates entire classes of bugs related to `NoMethodError: undefined method for nil:NilClass` — the most common error in Ruby for anyone who forgets to check for `nil`.

---

## 6. Good Parts & Bad Parts

An honest assessment, no marketing.

### ✅ Good Parts

| Strength | Why |
|---|---|
| **Expressiveness and readability** | Ruby code reads almost like English. `3.times { }`, `array.select { }`: the intent is clear at a glance. |
| **Blocks and Enumerable** | `map`, `select`, `reduce` work everywhere, uniformly. Once you learn them, you transform any collection in a few lines. |
| **Everything is an object, no exceptions** | No artificial distinction between "primitive types" and real objects. One mental rule to remember. |
| **Metaprogramming when you really need it** | Enables elegant libraries (this is how much of Rails works) without repeated code. |
| **Community and gems** | RubyGems has mature solutions for almost every common problem. |
| **Pleasant to write** | The "programmer happiness" philosophy is felt concretely, line after line. |

### ❌ Bad Parts

| Weakness | Detail |
|---|---|
| **Runtime performance** | Slower than compiled languages (Go, Rust, C++) on intensive computation. Ruby isn't the right choice for heavy numerical processing. |
| **GIL and limited concurrency** | The Global Interpreter Lock (in the standard MRI implementation) limits true parallelism between threads. Solutions exist (processes, Ractor), but it's not "free" the way it is in other languages. |
| **The same flexibility can turn into dark magic** | `method_missing`, monkey patching, and heavy metaprogramming sometimes make it impossible to figure out "where does this method come from" without documentation. |
| **Dynamic typing** | Type errors surface at runtime, not at compile time. A typo in a method name is only discovered when that code path actually runs. |
| **Less suited to data science/ML** | Python clearly dominates that ecosystem; Ruby has nothing comparable to NumPy/PyTorch. |

> 🧠 **The golden rule**: use Ruby when readability and development speed matter more than raw performance — web applications, automation scripts, prototypes that will become real products. Avoid it for intensive numerical computation or real-time systems with very tight latency constraints.

---

## 7. Clean Code in Ruby

**In short**: Ruby rewards small code, with honest names, and a single level of responsibility per method. "Sandi Metz's rules" are the most cited practical guide in the community.

### Naming: methods speak for themselves

```ruby
def valido?          # the question mark signals: returns true/false
  errors.empty?
end

def salva!            # the exclamation mark signals: dangerous — modifies state,
  save || raise         # or raises an exception instead of silently returning false
end
```

This convention (`?` for predicates, `!` for "dangerous" methods) isn't enforced by the language — it's a community convention, but following it makes your code immediately understandable to any other Rubyist.

### Sandi Metz's rules

Sandi Metz, author of *"Practical Object-Oriented Design in Ruby,"* proposes four guidelines (not absolute laws, but good rules to make you stop and think when you break them):

| Rule | Limit | Why |
|---|---|---|
| Class size | Max ~100 lines | A class that's too big does too much (violates the Single Responsibility Principle) |
| Method size | Max ~5 lines | A long method hides more than one level of abstraction |
| Parameters per method | Max 4 | Too many parameters is a sign you need a separate object |
| Object instantiation | Only one new object per method | Too many objects created in one spot = too much concentrated knowledge |

### Guard clause instead of nested `if`s

```ruby
# ❌ deep nesting, hard to follow
def processa(ordine)
  if ordine
    if ordine.valido?
      if ordine.pagato?
        spedisci(ordine)
      end
    end
  end
end

# ✅ guard clause: exit early, the "happy path" stays readable at the end
def processa(ordine)
  return unless ordine
  return unless ordine.valido?
  return unless ordine.pagato?

  spedisci(ordine)
end
```

### Comments: let the code explain itself

```ruby
# ❌ the comment just repeats what the code already says
# controlla se l'utente è maggiorenne
if utente.eta >= 18
  # ...
end

# ✅ an honest method name eliminates the need for a comment
if utente.maggiorenne?
  # ...
end
```

A useful comment explains the **why**, not the **what**: *"# we use 18 and not 21 because Italian law defines legal adulthood this way"* makes sense. *"# check the age"* doesn't — the code already says that.

### Avoid "God" classes

A class that does everything (`User` handling authentication, sending emails, generating reports, validating payments...) is impossible to test in isolation and hard to change without breaking something else. The Service Object (section 5) is often the antidote: it moves specific behaviors out of the model, keeping the model focused on its data and its direct invariants.

---

## 8. Testing with RSpec

**In short**: RSpec is the most widely used testing framework in the Ruby community. It describes expected behavior in near-natural language, with `describe`, `context`, and `it`.

### Basic structure

```ruby
# spec/models/task_spec.rb
require "rails_helper" # or "spec_helper" outside of Rails

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

Common matchers: `eq`, `be_truthy`/`be_falsey`, `include`, `raise_error`, `change { ... }`.

### `let` vs `before`

```ruby
RSpec.describe RegisterUser do
  let(:email) { "ada@example.com" }   # lazy: evaluated only on the FIRST call, in each "it"

  before do
    Rails.cache.clear   # eager: ALWAYS runs before every "it", even if unused
  end
end
```

`let` is preferred when the value is only needed by some tests (avoids wasted work); `before` is useful for side effects needed by *all* tests in the block.

### Full example: testing a Service Object with a mock

Here's the most practical, realistic scenario: testing `RegisterUser` (section 5) **without actually sending an email**, by mocking the external dependency.

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

Note two key techniques:

- **`instance_double(WelcomeMailer)`**: creates a "double" (mock) that automatically verifies that `WelcomeMailer` really has a `welcome` method with that signature — if you rename the real method, the test breaks immediately, instead of continuing to pass with a mock that's now lying to you.
- **`allow(...).to receive(...)`**: replaces the real call (which would actually send an email) with a controlled behavior, so the test is fast, deterministic, and doesn't depend on an external email service.

> 🧠 **The golden rule**: mock external dependencies (email, payment APIs, network calls) — never mock the object you're actually testing. If you find yourself mocking too much of the "heart" of your code, the design probably has too many responsibilities mixed together.

### FactoryBot, in brief

To generate realistic test data without writing `User.create!(...)` with 10 fields every time:

```ruby
# spec/factories/users.rb
FactoryBot.define do
  factory :user do
    nome { "Ada" }
    email { "ada@example.com" }
  end
end

utente = create(:user, nome: "Grace")  # creates a real user in the database, with the factory's defaults
```

---

## 🎉 You made it!

You've completed **Ruby: The Good Parts**. Now you know:

- Why Ruby exists and how the "principle of least surprise" shapes the entire language
- How it differs from Python and why the mindset shift is worth it
- The fundamental syntax: variables, collections, blocks, classes, modules, exceptions
- The everyday tools: `irb`, Bundler, RuboCop, the built-in debugger
- The most idiomatic design patterns: Factory and Service Object
- What to love about Ruby, and what to avoid like the bubonic plague
- Writing clean code following Sandi Metz's rules
- Testing with RSpec, including mocking an external dependency in a Service Object

**Where to go next?**

- 📖 [Ruby Official Docs](https://www.ruby-lang.org/en/documentation/) — the official documentation
- 🧪 [RSpec Docs](https://rspec.info) — dig deeper into matchers and advanced testing techniques
- 📘 *Practical Object-Oriented Design in Ruby* by Sandi Metz — the reference book for clean code in Ruby
- 🎨 [Ruby Style Guide](https://rubystyle.guide) — the style conventions RuboCop enforces
- 💎 [Ruby on Rails: Professional Applications](/it/playbook/rails) — the next step: building real web applications

> 🧠 **One last piece of advice**: don't try to learn everything at once. Write code, read other people's idiomatic code, and let the syntax become natural through practice. Ruby was designed to make you smile while you write it — if that's not happening, you're probably fighting the language instead of working with it. Happy coding! 💎
