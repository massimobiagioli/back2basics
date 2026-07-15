# Ruby on Rails: Applicazioni Professionali

Nel 2004, David Heinemeier Hansson ("DHH") stava costruendo Basecamp, uno strumento di gestione progetti, per la sua azienda 37signals. Invece di scrivere ogni volta lo stesso codice per collegare un database a una pagina web, si accorse che stava ripetendo sempre gli stessi passaggi. Allora estrasse quel codice ripetuto in un framework a parte. Lo chiamò **Ruby on Rails**.

L'idea centrale era rivoluzionaria per l'epoca: **Convention over Configuration** — convenzione anziché configurazione. Invece di dire al computer *ogni singolo dettaglio* di come collegare le cose, Rails decide dei default sensati, e tu devi configurare solo le eccezioni. Il risultato? Quello che in altri framework richiedeva settimane, in Rails richiede ore.

Questa filosofia si chiama anche **"omakase"** — una parola giapponese che significa "lascio scegliere a te, chef". Quando ordini omakase in un ristorante, non scegli ogni singolo ingrediente: ti fidi dello chef, che ha già pensato a un menu coerente e di qualità. Rails funziona così: ti fornisce un database, un server, un modo di testare, un modo di gestire i job in background — tutto già scelto, coerente, e pronto all'uso. Puoi cambiare pezzi se vuoi, ma il punto di partenza è già ottimo.

Se hai già letto **[Ruby: Le Parti Belle](/it/playbook/ruby)**, conosci le basi del linguaggio. Questo playbook ti insegna a usarlo per costruire vere applicazioni web, professionali e mantenibili nel tempo — con **Rails 8.1**, la versione più moderna e più snella mai rilasciata.

---

## 1. Fondamenti del Framework

**In pillole**: Rails è un framework MVC (Model-View-Controller) che collega automaticamente il tuo database, la tua logica applicativa e le tue pagine HTML, seguendo convenzioni che eliminano quasi tutta la configurazione manuale.

### MVC: le tre stanze della casa

Ogni applicazione Rails è organizzata in tre parti, che comunicano in un flusso preciso:

```
Browser → Router → Controller → Model → Controller → View → Browser
```

- **Model** (`app/models/`) — rappresenta i dati e le regole di business. Un `User`, un `Task`, un `Order`. Parla con il database.
- **View** (`app/views/`) — l'HTML che l'utente vede. Templates `.html.erb` (ERB = Embedded Ruby, cioè Ruby dentro HTML).
- **Controller** (`app/controllers/`) — riceve la richiesta, chiede i dati al Model, sceglie quale View mostrare. È il "traffico" tra le altre due parti.

> 💡 **Analogia**: pensa a un ristorante. Il **Router** è il cameriere che ti fa accomodare al tavolo giusto. Il **Controller** è il cameriere che prende l'ordine e lo porta in cucina. Il **Model** è il cuoco, che sa come preparare i piatti (i dati). La **View** è il piatto impiattato che ti viene servito.

### Convention over Configuration, in pratica

Ecco la magia con un esempio concreto. Se crei una tabella del database chiamata `users` con le colonne `name` ed `email`...

```ruby
# app/models/user.rb
class User < ApplicationRecord
end
```

...questo è **tutto** il codice che serve. Non devi scrivere `name` o `email` da nessuna parte nel model: Rails legge la struttura della tabella e capisce da solo che un `User` ha un `name` e una `email`. Puoi già scrivere:

```ruby
user = User.new(name: "Ada", email: "ada@example.com")
user.save
user.name  # => "Ada"
```

Questo funziona perché Rails segue delle regole precise e prevedibili:

| Convenzione | Esempio |
|---|---|
| Il model è al singolare, la tabella al plurale | Model `User` ↔ tabella `users` |
| Il nome del file corrisponde al nome della classe | `app/models/user.rb` → `class User` |
| Le chiavi esterne finiscono in `_id` | `task.user_id` collega un `Task` a uno `User` |
| I controller sono al plurale | `app/controllers/users_controller.rb` → `class UsersController` |
| Le view stanno in una cartella con il nome del controller | `app/views/users/index.html.erb` |

Se rompi queste convenzioni (es. chiami la tabella `utenti` invece di `users`), Rails smette di indovinare e devi configurare tutto a mano. Ecco perché seguire le convenzioni non è pigrizia: è quello che rende Rails veloce.

### La struttura di una app Rails

```
taskflow/
├── app/
│   ├── models/          # Dati e regole di business
│   ├── views/            # Template HTML
│   ├── controllers/      # Coordinano model e view
│   ├── jobs/              # Lavori in background
│   ├── mailers/          # Invio email
│   └── services/          # Logica di business che vedremo più avanti
├── config/
│   ├── routes.rb          # Quale URL va a quale controller
│   └── database.yml       # Configurazione database
├── db/
│   ├── migrate/            # Storia dei cambiamenti al database
│   └── schema.rb           # Struttura attuale del database
├── test/ (o spec/)         # Test
└── Gemfile                 # Dipendenze (le "gemme", cioè librerie Ruby)
```

### Chi usa Rails?

**GitHub**, **Shopify** (uno degli e-commerce più grandi al mondo, ancora oggi in gran parte Rails), **Basecamp/37signals** (dove Rails è nato), **GitLab** (in parte), **Airbnb** (nei primi anni di crescita esplosiva). Rails ha dimostrato più volte di reggere una scala enorme, nonostante la fama di essere "solo per prototipi veloci".

---

## 2. Clean Approach vs Approccio Rubyista

**In pillole**: c'è una tensione storica tra chi vuole portare in Rails pattern "enterprise" pesanti presi da Java/C#, e chi vuole scrivere "solo Rails", fidandosi delle convenzioni. La verità sta nel mezzo, e dipende dalla dimensione della tua app.

### Le due scuole di pensiero

**La scuola "Rails Way" (l'approccio Rubyista)**: fidati delle convenzioni. Non introdurre livelli di astrazione finché non ti servono davvero. DHH lo chiama **"just write Rails"**: molte app non hanno bisogno di Service Layer, Repository Pattern, Dependency Injection sofisticata. Sono complessità prese in prestito da altri mondi (spesso Java enterprise) che in un'app Rails piccola/media diventano solo peso morto da mantenere.

**La scuola "Clean Architecture"**: applica principi di disaccoppiamento più rigorosi — livelli separati, business logic indipendente dal framework, test che non toccano il database. Argomento forte: quando l'app cresce e il team cresce, il "tutto dentro ActiveRecord" collassa sotto il proprio peso.

### Chi ha ragione?

Entrambi, a seconda del contesto.

| Situazione | Approccio consigliato |
|---|---|
| App piccola, team di 1-3 persone, MVP da validare | Rails Way puro. Fat model quanto basta, niente Service Object finché non senti dolore reale. |
| App che cresce, logica di business complessa, più team | Introduci Service Object, Form Object, namespace per dominio — **solo dove il dolore è reale**, non ovunque preventivamente. |
| Team enorme, dominio molto complesso (fintech, sanità) | Vale la pena investire in architettura più rigorosa fin da subito — vedi la sezione 7 su DDD. |

> 🧠 **La regola d'oro**: non introdurre un pattern perché "è più pulito" in teoria. Introducilo quando senti dolore concreto — un model da 800 righe, un controller pieno di `if`, un test che richiede 15 mock per funzionare. Il dolore ti dice esattamente dove serve struttura. Aggiungere astrazione prima del dolore si chiama **over-engineering**, ed è tossico quanto il suo opposto.

Evita entrambi gli estremi:
- ❌ **Fat Model / Fat Controller**: un `User` con 40 metodi che fanno di tutto, un controller con 200 righe di logica business. Impossibile da testare in isolamento, impossibile da capire a colpo d'occhio.
- ❌ **Over-engineering prematuro**: 6 livelli di astrazione per un CRUD di 3 campi. Ogni cambiamento richiede toccare 5 file invece di uno.

---

## 3. Modern MVC

**In pillole**: Rails 7/8 ha riportato in auge il rendering server-side, grazie a Hotwire — ottieni l'interattività di una Single Page Application senza scrivere (quasi) JavaScript e senza un frontend separato.

### La pendolarità del pendolo

Per anni, il trend è stato: "il backend fa solo API JSON, il frontend è una SPA React/Vue separata". Questo approccio funziona, ma ha un costo: due codebase, due deploy, la duplicazione della logica di validazione, la complessità di gestire lo stato in due posti.

Rails moderno propone un'alternativa: **HTML over the wire**. Il server continua a generare HTML (come ha sempre fatto), ma lo fa in modo talmente rapido e granulare da sembrare una SPA. Il browser riceve pezzi di HTML già pronti, non JSON da trasformare in DOM via JavaScript.

### Organizzare le view

Le view Rails si organizzano in **partial** — pezzi di HTML riusabili:

```erb
<%# app/views/tasks/_task.html.erb — un partial per una singola riga task %>
<div id="<%= dom_id(task) %>" class="task">
  <span><%= task.title %></span>
  <%= link_to "Completa", complete_task_path(task), data: { turbo_method: :patch } %>
</div>
```

```erb
<%# app/views/tasks/index.html.erb — la usa in un loop %>
<div id="tasks">
  <%= render @tasks %>
  <%# Rails capisce da solo che deve usare _task.html.erb per ogni elemento %>
</div>
```

Questo stile di organizzazione — piccoli partial componibili — è il modo Rails di ottenere quello che altri framework chiamano "componenti". Per app più grandi, la gemma **ViewComponent** aggiunge componenti veri e propri con logica Ruby incapsulata, ma i partial da soli portano lontano.

---

## 4. Stimulus, Turbo, Hotwire: UI senza fronzoli

**In pillole**: Hotwire (**HTML Over The Wire**) è l'ombrello che contiene **Turbo** (navigazione e aggiornamenti automatici) e **Stimulus** (piccoli controller JavaScript per interattività locale). Insieme, ti danno una UI reattiva senza build step, senza framework JS pesante, senza duplicare la logica in due linguaggi.

### Turbo Drive: la navigazione gratuita

Turbo Drive è attivo di default in ogni app Rails 8 e non richiede nessun codice. Intercetta i click sui link e gli invii dei form, e invece di far ricaricare l'intera pagina al browser, scarica solo l'HTML nuovo e sostituisce il `<body>`. Il risultato: la navigazione **sembra** una SPA (niente flash bianco, niente ricaricamento di CSS/JS), ma tu hai scritto zero JavaScript.

### Turbo Frames: aggiornare un pezzo di pagina

Un **Turbo Frame** è una porzione di pagina indipendente. Se un link o un form è dentro un frame, la risposta aggiorna *solo quel frame*, non l'intera pagina.

```erb
<%# app/views/tasks/show.html.erb %>
<turbo_frame_tag task>
  <h1><%= task.title %></h1>
  <%= link_to "Modifica", edit_task_path(task) %>
</turbo_frame_tag>
```

```erb
<%# app/views/tasks/edit.html.erb %>
<turbo_frame_tag task>
  <%= form_with model: task do |f| %>
    <%= f.text_field :title %>
    <%= f.submit "Salva" %>
  <% end %>
</turbo_frame_tag>
```

Clicca "Modifica": Rails renderizza `edit.html.erb`, ma solo il contenuto dentro `<turbo_frame_tag task>` sostituisce il frame corrispondente nella pagina precedente. Il resto della pagina resta intatto. Nessun JavaScript scritto a mano.

### Turbo Streams: aggiornamenti live, anche da altri utenti

Un **Turbo Stream** è un messaggio che dice al browser: "aggiungi questo elemento", "sostituisci quello", "rimuovi quest'altro". Puoi inviarli come risposta a un'azione del controller, oppure via WebSocket (Action Cable) per aggiornamenti in tempo reale da altri utenti.

```ruby
# app/controllers/tasks_controller.rb
def create
  @task = @project.tasks.create!(task_params)

  respond_to do |format|
    format.turbo_stream # cerca create.turbo_stream.erb
    format.html { redirect_to @project }
  end
end
```

```erb
<%# app/views/tasks/create.turbo_stream.erb %>
<%= turbo_stream.append "tasks", partial: "tasks/task", locals: { task: @task } %>
```

Questo aggiunge il nuovo task alla lista con id `tasks`, **senza ricaricare la pagina**, senza scrivere una riga di JavaScript custom. Se combinato con Action Cable, questo stesso stream può essere trasmesso a *tutti* gli utenti che stanno guardando quella pagina in tempo reale — vedremo un esempio concreto nel progetto finale.

### Stimulus: JavaScript solo dove serve davvero

Turbo copre navigazione e aggiornamenti server-driven. Ma a volte ti serve interattività puramente client-side — aprire un menu a tendina, mostrare/nascondere un elemento, validare un campo mentre scrivi. Per questo esiste **Stimulus**: piccoli "controller" JavaScript agganciati all'HTML tramite attributi `data-*`.

```html
<!-- app/views/tasks/_task.html.erb -->
<div data-controller="toggle">
  <button data-action="click->toggle#switch">Mostra dettagli</button>
  <p data-toggle-target="details" class="hidden">Dettagli del task...</p>
</div>
```

```js
// app/javascript/controllers/toggle_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["details"]

  switch() {
    this.detailsTarget.classList.toggle("hidden")
  }
}
```

Nota la filosofia: l'HTML descrive *cosa* fa il controller (`data-controller="toggle"`), il JavaScript è minuscolo e fa *solo* quella cosa. Non c'è uno "stato" applicativo complesso da sincronizzare come in React — lo stato vive nel DOM e nel server, dove appartiene.

> 🧠 **La regola d'oro**: parti sempre da HTML puro + Turbo. Aggiungi Stimulus solo quando ti serve interattività che il server non può gestire (perché richiede una risposta istantanea, senza andare in rete). Questo è "HTML-first, JS solo dove serve davvero" — l'opposto di "JS-first, HTML è solo output".

---

## 5. Clean Architecture in Rails

**In pillole**: quando un'app cresce, alcuni pattern ti aiutano a tenere controller e model snelli, spostando la complessità in oggetti piccoli e con una sola responsabilità.

### Service Objects (`app/services/`)

Un Service Object incapsula un'azione di business complessa che non appartiene naturalmente a un solo model. Convenzione comune: una classe con un solo metodo pubblico, spesso chiamato `.call`.

```ruby
# app/services/assign_task.rb
class AssignTask
  def self.call(...) = new(...).call

  def initialize(task:, assignee:)
    @task = task
    @assignee = assignee
  end

  def call
    @task.update!(assignee: @assignee, assigned_at: Time.current)
    TaskMailer.assigned(@task).deliver_later
    @task
  end
end
```

```ruby
# nel controller, resta una riga:
AssignTask.call(task: @task, assignee: current_user)
```

Vantaggi: il controller resta leggibile, e il Service Object si testa da solo, senza dover passare per HTTP.

### Form Object

Quando un form non mappa 1:1 a un model (es. un form di registrazione che crea sia uno `User` sia una `Company`), un Form Object incapsula la validazione e il salvataggio:

```ruby
# app/forms/signup_form.rb
class SignupForm
  include ActiveModel::Model

  attr_accessor :name, :email, :company_name

  validates :name, :email, :company_name, presence: true

  def save
    return false unless valid?

    ActiveRecord::Base.transaction do
      company = Company.create!(name: company_name)
      User.create!(name:, email:, company:)
    end
    true
  end
end
```

### Query Object

Query Active Record complesse e riusabili, fuori dal model:

```ruby
# app/queries/overdue_tasks_query.rb
class OverdueTasksQuery
  def self.call(project)
    project.tasks.where("due_date < ?", Time.current).where(completed: false)
  end
end
```

### Policy Object (autorizzazione)

Per l'autorizzazione ("può questo utente fare questa azione?"), la gemma più diffusa è **Pundit**: una classe "Policy" per model, con metodi che ritornano `true`/`false`.

```ruby
# app/policies/task_policy.rb
class TaskPolicy < ApplicationPolicy
  def update?
    user == record.project.owner || user == record.assignee
  end
end
```

```ruby
# nel controller
def update
  authorize @task # solleva un'eccezione se update? ritorna false
  @task.update!(task_params)
end
```

### API pulite

Per esporre JSON invece di HTML, la convenzione Rails è versionare con namespace:

```ruby
# app/controllers/api/v1/tasks_controller.rb
module Api
  module V1
    class TasksController < ApplicationController
      def index
        render json: @project.tasks
      end
    end
  end
end
```

Per JSON più controllato (evitare di esporre colonne sensibili per errore), usa **Jbuilder** (incluso di default in Rails):

```ruby
# app/views/api/v1/tasks/index.json.jbuilder
json.array! @tasks do |task|
  json.id task.id
  json.title task.title
  json.completed task.completed
  # nota: task.internal_notes NON è qui, quindi non viene esposto
end
```

### Autenticazione

Rails 8 include un **generatore di autenticazione built-in**:

```bash
bin/rails generate authentication
```

Questo crea un model `User` con `has_secure_password` (basato su bcrypt), sessioni sicure, e le view/controller di login essenziali — **senza bisogno di installare Devise**. Per esigenze più complesse (login con Google/GitHub, autenticazione a due fattori, gestione multi-tenant di utenti), **Devise** resta la gemma matura di riferimento nell'ecosistema.

---

## 6. Good Parts & Bad Parts

Una valutazione onesta di Rails, senza marketing.

### ✅ Good Parts

| Forza | Perché |
|---|---|
| **Velocità di sviluppo** | Convention over Configuration ti fa arrivare a un prototipo funzionante in ore, non settimane. |
| **ActiveRecord espressivo** | `Task.where(completed: false).order(:due_date)` si legge come inglese. Il database diventa naturale da interrogare. |
| **Hotwire** | UI reattiva senza build step, senza duplicare logica in JS e Ruby, senza la complessità di gestire stato client-side. |
| **Ecosistema di gemme** | Quasi ogni problema comune (pagamenti, autenticazione, upload file, PDF) ha una gemma matura e testata in produzione. |
| **"Solid" stack in Rails 8** | Solid Queue, Solid Cache, Solid Cable: niente Redis obbligatorio per iniziare. Un'app Rails 8 parte con un solo database. |
| **Community e documentazione** | Le Rails Guides sono tra le migliori documentazioni di un framework mai scritte. |

### ❌ Bad Parts

| Debolezza | Dettaglio |
|---|---|
| **La "magia" confonde i principianti** | Convenzioni implicite (dov'è definito questo metodo?) sono potenti ma opache finché non le impari. |
| **Rischio di monolite ingestibile** | Senza disciplina, un'app Rails cresce fino a diventare un "big ball of mud" — vedi sezione 2. |
| **ActiveRecord tenta a diventare Fat Model** | È talmente comodo aggiungere metodi al model, che i model tendono a crescere senza controllo. |
| **Performance runtime** | Ruby è più lento di Go o Rust su calcoli puri. Rails compensa con caching (Solid Cache) e query intelligenti, ma non è la scelta giusta per carichi CPU-intensive. |
| **Cambio di paradigma per chi viene da altri stack** | Chi arriva da Java/Spring o da un mondo "solo API + SPA" deve disimparare alcune abitudini. |

> 🧠 **La regola d'oro**: Rails è straordinario per applicazioni guidate dal database — gestionali, e-commerce, SaaS, marketplace. È una scelta più discutibile per sistemi CPU-intensive (elaborazione video, calcolo scientifico) o per team che rifiutano categoricamente le convenzioni.

---

## 7. Domain Driven Design in Rails

**In pillole**: il Domain Driven Design (DDD) è un insieme di pratiche per modellare software complesso rispecchiando il linguaggio reale del business. In Rails si applica con moderazione: pieno DDD è overkill per un'app piccola, ma alcune idee valgono sempre.

### Ubiquitous Language

Il nome delle tue classi Ruby dovrebbe usare **le stesse parole** che usa il team di business, non termini tecnici inventati. Se il team commerciale parla di "abbonamento", la classe si chiama `Subscription`, non `RecurringBillingEntity`.

### Bounded Context tramite namespace

Quando un'app cresce e contiene domini distinti (fatturazione, spedizioni, catalogo), puoi organizzare i model in moduli/namespace che rispecchiano quei confini:

```ruby
# app/models/billing/invoice.rb
module Billing
  class Invoice < ApplicationRecord
  end
end

# app/models/shipping/package.rb
module Shipping
  class Package < ApplicationRecord
  end
end
```

Per far rispettare questi confini davvero (impedire che `Billing` importi direttamente da `Shipping` senza passare da un'interfaccia esplicita), in app grandi si usa la gemma **Packwerk** (creata da Shopify proprio per gestire il loro monolite Rails enorme).

### Model anemici vs model ricchi

Un model **anemico** è solo un contenitore di dati, con tutta la logica altrove:

```ruby
# ❌ anemico: Order non sa fare nulla, solo esporre colonne
class Order < ApplicationRecord
end
# la logica di "può essere cancellato?" è sparsa nei controller
```

Un model **ricco** incapsula comportamento e invarianti:

```ruby
# ✅ ricco: Order sa rispondere a domande di business su se stesso
class Order < ApplicationRecord
  def cancellable?
    status == "pending" && created_at > 24.hours.ago
  end

  def cancel!
    raise "Non cancellabile" unless cancellable?
    update!(status: "cancelled")
  end
end
```

### Value Object

Un Value Object rappresenta un concetto senza identità propria, definito solo dai suoi valori, ed è immutabile. Esempio classico: il denaro.

```ruby
# app/models/money.rb
class Money
  attr_reader :cents, :currency

  def initialize(cents, currency: "EUR")
    @cents = cents
    @currency = currency
    freeze # rende l'oggetto immutabile
  end

  def +(other)
    raise "Valute diverse" unless currency == other.currency
    Money.new(cents + other.cents, currency:)
  end

  def to_s
    format("%.2f %s", cents / 100.0, currency)
  end
end
```

Questo evita bug enormi: sommare interi in centesimi senza una classe dedicata porta prima o poi a confondere euro e centesimi, o a sommare valute diverse per errore.

> 🧠 **La regola d'oro**: applica DDD alle parti dell'app dove la complessità di business è reale (il motore di fatturazione, non la pagina "Chi siamo"). Per un CRUD semplice, ActiveRecord "anemico" va benissimo.

---

## 8. Workers, Notifiers, Mailer: async quando serve

**In pillole**: **Active Job** è l'astrazione standard di Rails per lavori in background. In Rails 8, il backend di default è **Solid Queue**, che salva i job nel database — niente Redis da installare per iniziare.

### Quando andare in background

Regola pratica: se un'operazione richiede più di qualche centinaio di millisecondi, o chiama un servizio esterno (invio email, chiamata a un'API di pagamento, generazione di un PDF), **non farla aspettare all'utente**. Mettila in un job.

```ruby
# app/jobs/generate_report_job.rb
class GenerateReportJob < ApplicationJob
  queue_as :default

  def perform(project)
    pdf = ReportGenerator.new(project).generate
    project.update!(report: pdf)
    ReportMailer.ready(project).deliver_later
  end
end
```

```ruby
# accodalo così, da qualsiasi punto dell'app:
GenerateReportJob.perform_later(@project)
```

Con Solid Queue, questo job viene salvato in una tabella del database e processato da un worker separato (`bin/jobs` in Rails 8), senza bisogno di installare Redis o Sidekiq. Per volumi altissimi (milioni di job al giorno), **Sidekiq** resta l'alternativa storica di riferimento nell'ecosistema, basata su Redis.

### ActionMailer

Le email si scrivono come controller + view:

```ruby
# app/mailers/task_mailer.rb
class TaskMailer < ApplicationMailer
  def assigned(task)
    @task = task
    mail(to: task.assignee.email, subject: "Ti è stato assegnato un task")
  end
end
```

```erb
<%# app/views/task_mailer/assigned.html.erb %>
<p>Ciao <%= @task.assignee.name %>,</p>
<p>Ti è stato assegnato il task "<%= @task.title %>".</p>
```

```ruby
TaskMailer.assigned(@task).deliver_later # va in coda, non blocca la richiesta
```

### Notifiche in-app

Per notifiche dentro l'app (non solo email), un pattern comune è un "Notifier" dedicato, oppure la gemma **Noticed**, che gestisce la consegna multi-canale (email, in-app, Slack) da un'unica definizione:

```ruby
# app/notifiers/task_assigned_notifier.rb
class TaskAssignedNotifier < Noticed::Event
  deliver_by :database
  deliver_by :email, mailer: "TaskMailer", method: :assigned
end
```

---

## 9. Strumenti Utili

**In pillole**: Rails ti dà una cassetta degli attrezzi coerente per esplorare, debuggare e testare la tua app, tutta accessibile con `bin/rails`.

### `bin/rails console`

La console interattiva della tua app — un `irb` con tutti i tuoi model già caricati:

```bash
bin/rails console
```

```ruby
User.last
# => #<User id: 12, name: "Ada", ...>

Rails.env
# => "development"

Task.where(completed: false).count
# => 7

reload! # ricarica il codice modificato senza uscire dalla console
```

> 💡 **Tip**: `bin/rails console --sandbox` apre una console in cui ogni modifica al database viene annullata all'uscita. Perfetto per sperimentare senza paura.

### `bin/rails routes`

Elenca tutte le rotte dell'app:

```bash
bin/rails routes
bin/rails routes -g task # filtra solo le rotte che contengono "task"
```

### `bin/rails generate`

Genera scheletri di codice seguendo le convenzioni:

```bash
bin/rails generate model Task title:string completed:boolean
bin/rails generate controller Tasks
bin/rails generate migration AddDueDateToTasks due_date:date
```

### Il debugger integrato

Rails include la gemma `debug` di default. Basta inserire un breakpoint nel codice:

```ruby
def create
  @task = @project.tasks.new(task_params)
  binding.irb # <- il server si ferma qui, apre una console interattiva nel terminale
  @task.save
end
```

Quando la richiesta arriva a quella riga, il server si blocca e nel terminale ottieni una console `irb` con accesso a tutte le variabili locali (`@task`, `params`, ecc.) — puoi ispezionarle, modificarle, e continuare l'esecuzione con `continue`.

### Testing

Rails include **Minitest** di default (`bin/rails test`). Molti team professionali installano **RSpec** al suo posto — il playbook **[Ruby: Le Parti Belle](/it/playbook/ruby)** copre RSpec in dettaglio, incluso come testare un Service Object con un mock. Le stesse tecniche si applicano identiche dentro un'app Rails.

```bash
bin/rails test                    # tutti i test, Minitest
bin/rails test test/models/task_test.rb   # un solo file
bundle exec rspec                 # se hai installato RSpec al posto di Minitest
```

### `bin/dev`

Avvia tutto insieme con un solo comando: il server web, il processore di job (Solid Queue), e il watcher CSS, secondo quanto definito in `Procfile.dev`:

```bash
bin/dev
```

---

## 10. Progetto: Costruiamo TaskFlow, un'app Rails 8.1 robusta, passo passo

### Cosa Fa TaskFlow

Un piccolo gestionale di task collaborativo:

- Un utente crea **Progetti**
- Dentro un progetto, crea **Task**
- Può **assegnare** un task a un collega
- Quando un task viene assegnato, l'assegnatario riceve **un'email** e la lista dei task **si aggiorna in tempo reale** per tutti quelli che stanno guardando la pagina (Turbo Streams)

### Comandi rapidi per iniziare

```bash
# Rails 8 usa SQLite anche in produzione di default, grazie a Solid Queue/Cache/Cable
rails new taskflow -d sqlite3
cd taskflow

bin/rails generate authentication  # User + login, built-in in Rails 8
```

### Struttura del Progetto

```
taskflow/
├── app/
│   ├── models/
│   │   ├── project.rb
│   │   ├── task.rb
│   │   └── user.rb            # generato da `generate authentication`
│   ├── controllers/
│   │   └── tasks_controller.rb
│   ├── services/
│   │   └── assign_task.rb
│   ├── mailers/
│   │   └── task_mailer.rb
│   ├── jobs/
│   │   └── (Active Job usa Solid Queue automaticamente)
│   ├── javascript/controllers/
│   │   └── checklist_controller.js
│   └── views/
│       ├── tasks/
│       └── task_mailer/
└── test/
    └── services/
        └── assign_task_test.rb
```

### Step 1: Modelli e migrazioni

```bash
bin/rails generate model Project name:string owner:references
bin/rails generate model Task title:string completed:boolean project:references assignee:references{polymorphic:false, to_table: users}
bin/rails db:migrate
```

```ruby
# app/models/project.rb
class Project < ApplicationRecord
  belongs_to :owner, class_name: "User"
  has_many :tasks, dependent: :destroy

  validates :name, presence: true
end
```

```ruby
# app/models/task.rb
class Task < ApplicationRecord
  belongs_to :project
  belongs_to :assignee, class_name: "User", optional: true

  validates :title, presence: true

  def assigned?
    assignee.present?
  end
end
```

### Step 2: Routes e controller

```ruby
# config/routes.rb
Rails.application.routes.draw do
  resources :projects do
    resources :tasks, only: [:index, :create] do
      member do
        patch :assign
      end
    end
  end

  root "projects#index"
end
```

```ruby
# app/controllers/tasks_controller.rb
class TasksController < ApplicationController
  before_action :set_project
  before_action :set_task, only: [:assign]

  def create
    @task = @project.tasks.create!(task_params)

    respond_to do |format|
      format.turbo_stream
      format.html { redirect_to @project }
    end
  end

  def assign
    AssignTask.call(task: @task, assignee: User.find(params[:assignee_id]))

    respond_to do |format|
      format.turbo_stream
      format.html { redirect_to @project }
    end
  end

  private

  def set_project = @project = Project.find(params[:project_id])
  def set_task = @task = @project.tasks.find(params[:id])

  def task_params = params.require(:task).permit(:title)
end
```

### Step 3: Service Object per l'assegnazione

Questo è il cuore della business logic: assegna il task, manda l'email, e (nello Step 4) trasmette l'aggiornamento in tempo reale.

```ruby
# app/services/assign_task.rb
class AssignTask
  def self.call(...) = new(...).call

  def initialize(task:, assignee:)
    @task = task
    @assignee = assignee
  end

  def call
    @task.update!(assignee: @assignee, assigned_at: Time.current)
    TaskMailer.assigned(@task).deliver_later
    broadcast_update
    @task
  end

  private

  def broadcast_update
    @task.project.broadcast_replace_to(
      @task.project,
      target: "task_#{@task.id}",
      partial: "tasks/task",
      locals: { task: @task }
    )
  end
end
```

### Step 4: Vista con Turbo Frame/Stream e un controller Stimulus

```erb
<%# app/views/tasks/_task.html.erb %>
<div id="task_<%= task.id %>" class="task" data-controller="checklist">
  <span class="<%= "completed" if task.completed %>"><%= task.title %></span>

  <% if task.assigned? %>
    <small>Assegnato a <%= task.assignee.name %></small>
  <% else %>
    <%= button_to "Assegna a me", assign_project_task_path(task.project, task, assignee_id: current_user.id), method: :patch %>
  <% end %>

  <button data-action="click->checklist#toggle">✓</button>
</div>
```

```erb
<%# app/views/projects/show.html.erb %>
<h1><%= @project.name %></h1>

<%# si iscrive automaticamente agli aggiornamenti broadcast da AssignTask %>
<%= turbo_stream_from @project %>

<div id="tasks">
  <%= render @project.tasks %>
</div>

<%= form_with model: [@project, Task.new] do |f| %>
  <%= f.text_field :title, placeholder: "Nuovo task..." %>
  <%= f.submit "Aggiungi" %>
<% end %>
```

```js
// app/javascript/controllers/checklist_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  toggle() {
    this.element.classList.toggle("checked") // solo feedback visivo istantaneo, lato client
  }
}
```

Quando `AssignTask` chiama `broadcast_replace_to`, **ogni browser** che ha quella pagina aperta (grazie a `turbo_stream_from @project`, che usa Action Cable via Solid Cable) riceve l'aggiornamento e sostituisce quel task nella lista — senza reload, senza polling, senza codice JavaScript custom per il realtime.

### Step 5: Active Job + ActionMailer

```ruby
# app/mailers/task_mailer.rb
class TaskMailer < ApplicationMailer
  def assigned(task)
    @task = task
    mail(to: task.assignee.email, subject: "Ti è stato assegnato: #{task.title}")
  end
end
```

```erb
<%# app/views/task_mailer/assigned.html.erb %>
<p>Ciao <%= @task.assignee.name %>,</p>
<p>Ti è stato assegnato il task <strong><%= @task.title %></strong> nel progetto <%= @task.project.name %>.</p>
```

`.deliver_later` accoda automaticamente la mail su Solid Queue — il worker in background (`bin/jobs`, avviato da `bin/dev`) la processa senza bloccare la richiesta HTTP.

### Step 6: Test del Service Object

```ruby
# test/services/assign_task_test.rb
require "test_helper"

class AssignTaskTest < ActiveSupport::TestCase
  test "assegna il task e accoda l'email" do
    project = Project.create!(name: "Sito Web", owner: users(:ada))
    task = project.tasks.create!(title: "Scrivi la homepage")
    assignee = users(:grace)

    assert_enqueued_email_with TaskMailer, :assigned, args: [task] do
      AssignTask.call(task: task, assignee: assignee)
    end

    assert_equal assignee, task.reload.assignee
  end
end
```

> 💡 Nota: il Service Object si testa **senza passare da una richiesta HTTP**. Nessun controller coinvolto, nessuna view renderizzata — solo la logica di business, isolata e veloce da testare.

### Avvia e Prova

```bash
bin/rails db:prepare       # crea e migra il database
bin/dev                    # avvia server + Solid Queue worker + asset watcher

# in un altro terminale, o via bin/rails console:
bin/rails console
Project.create!(name: "Sito Web", owner: User.first)
```

Apri il browser su `localhost:3000`, crea un task, assegnalo — e se apri la stessa pagina in due tab diverse, vedrai l'assegnazione comparire **in entrambe**, in tempo reale, grazie a Turbo Streams + Solid Cable.

### Concetti Applicati

| Sezione | Dove appare in TaskFlow |
|---|---|
| **1. Fondamenti** | Convention over Configuration in ogni model (`Project`, `Task`), struttura standard delle cartelle |
| **3. Modern MVC** | Partial `_task.html.erb` riusato in `index` e negli aggiornamenti Turbo |
| **4. Hotwire** | Turbo Frame implicito nel `render @project.tasks`, Turbo Stream in `broadcast_replace_to`, Stimulus in `checklist_controller.js` |
| **5. Clean Architecture** | `AssignTask` come Service Object, controller ridotto a poche righe |
| **8. Async** | `TaskMailer.assigned(@task).deliver_later` via Solid Queue |
| **9. Strumenti** | `bin/rails generate`, `bin/rails console`, `bin/dev`, `bin/rails test` |

---

## 🎉 Ce l'hai fatta!

Hai completato **Ruby on Rails: Applicazioni Professionali**. Ora sai:

- Perché Rails esiste e come "Convention over Configuration" ti fa risparmiare settimane di lavoro
- Quando fidarti delle convenzioni e quando introdurre struttura extra, senza cadere nell'over-engineering
- Costruire UI reattive con Hotwire (Turbo + Stimulus) senza framework JavaScript pesanti
- Applicare Service Object, Form Object, Query Object e Policy Object per tenere il codice pulito
- I fondamenti di Domain Driven Design applicati a Rails
- Gestire lavori in background con Active Job e Solid Queue
- Usare `rails console`, il debugger integrato e gli altri strumenti quotidiani
- Costruire un'app Rails 8.1 completa, con realtime, email e test, passo passo

**Dove andare ora?**

- 📖 [Rails Guides](https://guides.rubyonrails.org) — la documentazione ufficiale, tra le migliori di qualsiasi framework
- 🔥 [Hotwire](https://hotwired.dev) — il sito ufficiale di Turbo e Stimulus, con demo interattive
- 🚢 [Kamal](https://kamal-deploy.org) — come Rails 8 fa il deploy in produzione con Docker, senza server dedicati complessi
- 📜 [The Rails Doctrine](https://rubyonrails.org/doctrine) — i principi filosofici dietro ogni decisione di design di Rails
- 🐚 [Ruby: Le Parti Belle](/it/playbook/ruby) — se non l'hai ancora letto, torna alle basi del linguaggio

> 🧠 **L'ultimo consiglio**: non copiare pattern da altri framework solo perché "si fa così altrove". Scrivi Rails con lo spirito di Rails: parti semplice, fidati delle convenzioni, e aggiungi struttura solo quando il dolore te lo chiede davvero. Buon coding! 💎
