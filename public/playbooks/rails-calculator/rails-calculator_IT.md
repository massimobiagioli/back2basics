# Rails Calculator Step-by-Step

Questo non è un playbook da leggere: è un playbook da **costruire**. Passo dopo passo, tirerai su una piccola applicazione Rails — una calcolatrice web — che gira in Docker, salva ogni calcolo in PostgreSQL, e si aggiorna da sola nel browser (niente pagina che ricarica, niente "spinner" che gira) grazie a **Turbo** e **Stimulus**. Se hai già letto **[Ruby on Rails: Applicazioni Professionali](/it/playbook/rails)**, riconoscerai i concetti; qui li mettiamo in pratica riga per riga, dal primo `mkdir` fino ai test.

Niente framework CSS, niente build step JavaScript, niente file da 300 righe: solo pezzi piccoli, ognuno con un lavoro solo, facili da capire e da testare. È lo stesso principio che usi quando organizzi la cameretta: un cassetto per i calzini, uno per le magliette. Se mescoli tutto in un cassetto solo, prima o poi non trovi più niente.

---

## 1. Cosa costruiamo, e perché

Alla fine avrai una pagina così:

```
┌───────────────────────────────┐
│          Calcolatrice         │
├───────────────────────────────┤
│         6 + 4 = 10            │  ← "display", si aggiorna da solo
├───────────────────────────────┤
│  [ 6                    ]     │
│  [ + ] [ - ] [ * ] [ / ]      │  ← il bottone scelto resta "acceso"
│  [ 4                    ]     │
│         ( Calcola )           │
├───────────────────────────────┤
│  Storico                      │
│  6 + 4 = 10                   │  ← compare da solo, senza reload
│  10 / 2 = 5                   │
└───────────────────────────────┘
```

Scrivi i due numeri, scegli un operatore (anche solo cliccandolo), e il risultato appare **mentre digiti**, senza mai premere davvero "Calcola" a mano se non vuoi. Ogni calcolo finisce anche nello storico qui sotto, in tempo reale. Tutto questo con **zero righe di JavaScript "a mano libera"** sparse ovunque: solo un piccolo controller Stimulus, ordinato e testabile quanto il resto.

Le regole che seguiremo per tutto il playbook:

- **Niente God Controller.** Il controller non farà mai calcoli, non validerà mai nulla da solo. Riceve una richiesta, delega, risponde. Punto.
- **Service Object** per la logica di calcolo pura (Ruby puro, zero Rails, zero database).
- **Form Object** per validare quello che arriva dall'utente e orchestrare model + service.
- **Interfaccia spartana**: HTML semantico, un filo di CSS scritto a mano, niente Tailwind, niente componenti misteriosi.
- **Debug facile**: ogni pezzo si può chiamare ed ispezionare da `rails console`, isolato, senza dover passare dal browser.
- **Test veloci e mirati**: unit test per la logica pura, integration test per il flusso completo.

---

## 2. Prerequisiti

Ti serve **solo Docker Desktop** installato e funzionante. Non ti serve Ruby installato sul computer, non ti serve PostgreSQL installato: vivranno entrambi dentro i container. Se sai aprire un terminale e copiare un file, sei già pronto.

---

## 3. Il progetto in Docker

### 3.1 Cartella di lavoro

```bash
mkdir rails_calculator
cd rails_calculator
```

### 3.2 Un Gemfile "usa e getta"

Per generare un'app Rails dobbiamo prima avere l'eseguibile `rails` dentro l'immagine Docker. Ci basta un Gemfile minimo, che tra un minuto Rails stesso riscriverà con tutte le gemme vere.

```ruby
# Gemfile
source "https://rubygems.org"
gem "rails", "~> 8.0"
```

```bash
touch Gemfile.lock
```

### 3.3 Il Dockerfile

```dockerfile
# Dockerfile
FROM ruby:3.3-slim

# Librerie di sistema necessarie per compilare le gemme native
# e per parlare con PostgreSQL (libpq-dev). Rails 8 usa Importmap
# di default, quindi non ci serve Node.js: zero build step JS.
RUN apt-get update -qq && apt-get install -y build-essential libpq-dev git curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiamo prima solo Gemfile e Gemfile.lock: finché non cambiano,
# Docker riusa la cache di questo layer e non reinstalla le gemme
# ad ogni build. È il motivo per cui i build Docker ben scritti
# "sentono" veloci dopo il primo.
COPY Gemfile Gemfile.lock ./
RUN bundle install

COPY . .

EXPOSE 3000

CMD ["bin/rails", "server", "-b", "0.0.0.0"]
```

### 3.4 docker-compose.yml

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: rails
      POSTGRES_PASSWORD: rails
      POSTGRES_DB: rails_calculator_development
    volumes:
      - db_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  web:
    build: .
    command: bin/rails server -b 0.0.0.0
    volumes:
      - .:/app
    ports:
      - "3000:3000"
    environment:
      DATABASE_HOST: db
      DATABASE_USER: rails
      DATABASE_PASSWORD: rails
    depends_on:
      - db

volumes:
  db_data:
```

Due servizi: `db` (PostgreSQL, con i dati salvati in un volume che sopravvive ai riavvii) e `web` (la nostra app Rails). Il volume `.:/app` monta la cartella del progetto dentro il container, così ogni modifica che fai al codice sul tuo computer è visibile immediatamente dentro Docker, senza dover ricostruire l'immagine ogni volta.

### 3.5 Costruisci l'immagine

```bash
docker compose build
```

### 3.6 Genera l'app Rails

```bash
docker compose run --rm web rails new . --force --database=postgresql
```

- `run --rm` avvia un container "usa e getta" solo per eseguire questo comando, e lo elimina subito dopo: non ci serve tenerlo acceso.
- `--force` dice a Rails "sovrascrivi pure il Gemfile minimo che avevo messo io, non chiedermi conferma file per file".
- `--database=postgresql` prepara `config/database.yml` per Postgres invece di SQLite.

Non serve nessun flag per Turbo o Stimulus: da Rails 7 in poi arrivano **già dentro** ogni nuova app (fanno parte di Hotwire, lo standard di default). Stessa cosa per Minitest, il framework di test di serie.

### 3.7 Ricostruisci l'immagine con le gemme vere

Ora che `rails new` ha scritto un Gemfile completo (con `pg`, `turbo-rails`, `stimulus-rails`...), rifacciamo la build per installarle dentro l'immagine:

```bash
docker compose build
```

### 3.8 Collega il database

Sostituisci il contenuto di `config/database.yml` con questo, che legge le variabili d'ambiente definite nel `docker-compose.yml`:

```yaml
# config/database.yml
default: &default
  adapter: postgresql
  encoding: unicode
  host: <%= ENV.fetch("DATABASE_HOST", "localhost") %>
  username: <%= ENV.fetch("DATABASE_USER", "rails") %>
  password: <%= ENV.fetch("DATABASE_PASSWORD", "rails") %>
  pool: <%= ENV.fetch("RAILS_MAX_THREADS") { 5 } %>

development:
  <<: *default
  database: rails_calculator_development

test:
  <<: *default
  database: rails_calculator_test
```

### 3.9 Crea e migra il database

```bash
docker compose run --rm web rails db:prepare
```

### 3.10 Accendi tutto

```bash
docker compose up
```

Apri **http://localhost:3000**: dovresti vedere la pagina di benvenuto di Rails. Se la vedi, il terreno è pronto — da qui in poi costruiamo la calcolatrice vera.

---

## 4. Il dominio: la migration e il model

Ogni calcolo che l'utente fa lo salviamo come una riga nella tabella `calculations`: due numeri, un operatore, un risultato.

```bash
docker compose run --rm web rails generate model Calculation \
  left_operand:decimal right_operand:decimal operator:string result:decimal
```

Il generatore crea una migration di partenza. Apriamola e rendiamola un po' più severa (nessun campo può restare vuoto):

```ruby
# db/migrate/XXXXXXXXXXXXXX_create_calculations.rb
class CreateCalculations < ActiveRecord::Migration[8.0]
  def change
    create_table :calculations do |t|
      t.decimal :left_operand,  precision: 20, scale: 6, null: false
      t.decimal :right_operand, precision: 20, scale: 6, null: false
      t.string  :operator,      null: false
      t.decimal :result,        precision: 20, scale: 6, null: false

      t.timestamps
    end
  end
end
```

```bash
docker compose run --rm web rails db:migrate
```

Ora il model. Qui vive **solo** ciò che riguarda i dati stessi: validazioni di base e un metodo per presentare il calcolo come testo leggibile.

```ruby
# app/models/calculation.rb
class Calculation < ApplicationRecord
  OPERATORS = %w[+ - * /].freeze

  validates :operator, inclusion: { in: OPERATORS }
  validates :left_operand, :right_operand, :result, presence: true

  scope :recent, -> { order(created_at: :desc).limit(10) }

  def to_equation
    "#{fmt(left_operand)} #{operator} #{fmt(right_operand)} = #{fmt(result)}"
  end

  private

  # I numeri interi non hanno bisogno di ".0" finale: "10" è più
  # leggibile di "10.0" su uno schermo di calcolatrice.
  def fmt(number)
    number = number.to_f
    number == number.to_i ? number.to_i.to_s : number.to_s
  end
end
```

Nota cosa **non** c'è qui: nessuna divisione, nessuna somma, nessuna gestione della divisione per zero. Il model sa solo come *rappresentare* un calcolo già fatto, non come *farlo*. Quella responsabilità va altrove — è il prossimo passo.

---

## 5. La mappa dell'architettura (no God Controller)

Prima di scrivere altro codice, disegniamo il percorso che farà ogni richiesta:

```
Richiesta HTTP (form inviato dal browser)
        │
        ▼
CalculationsController      ← sottile: 2 azioni, poche righe, zero logica
        │
        ▼
CalculationForm              ← Form Object: valida i dati grezzi in arrivo
        │  (solo se validi)
        ▼
Calculations::Compute        ← Service Object: SOLO il calcolo, Ruby puro
        │
        ▼
Calculation                  ← Model: salva il risultato nel database
        │
        ▼
Turbo Stream / HTML           ← risposta: aggiorna solo i pezzi di pagina utili
```

> 🧠 **Perché così tanti pezzi per "fare una somma"?** Perché ognuno ha un solo motivo per cambiare. Se domani vuoi aggiungere la radice quadrata, tocchi solo il Service Object. Se vuoi cambiare un messaggio di errore, tocchi solo il Form Object. Se vuoi cambiare l'HTML, tocchi solo le view. Il controller non cambia **mai**. Questo è l'opposto del "God Controller": un controller enorme che fa validazione, calcolo, formattazione e invio email tutto insieme, impossibile da testare senza simulare un'intera richiesta HTTP.

---

## 6. Il Service Object: il calcolo, puro e isolato

Un Service Object fa **una cosa sola**. Non sa cos'è un form, non sa cos'è HTTP, non tocca il database. Riceve numeri Ruby, restituisce un risultato Ruby. Per questo è velocissimo da testare: nessun setup, nessun database da preparare.

Prima definiamo un piccolo **Value Object** per il risultato — invece di restituire `true`/`false`, `nil`, o lanciare eccezioni a caso, restituiamo sempre lo stesso tipo di oggetto, prevedibile:

```ruby
# app/services/calculations/result.rb
module Calculations
  # Chi chiama il Service Object riceve sempre un Result: mai un numero
  # nudo, mai un'eccezione a sorpresa. success? dice se è andata bene,
  # value contiene il numero, error contiene il messaggio se qualcosa
  # è andato storto.
  Result = Struct.new(:value, :error, keyword_init: true) do
    def success?
      error.nil?
    end
  end
end
```

E ora il Service Object vero e proprio:

```ruby
# app/services/calculations/compute.rb
module Calculations
  class Compute
    DIVISION_BY_ZERO = "non si può dividere per zero"

    # Scorciatoia comune per i Service Object: invece di scrivere
    # sempre `Compute.new(...).call`, basta `Compute.call(...)`.
    def self.call(...) = new(...).call

    def initialize(left:, right:, operator:)
      @left = left
      @right = right
      @operator = operator
    end

    def call
      return Result.new(error: DIVISION_BY_ZERO) if dividing_by_zero?

      Result.new(value: compute)
    end

    private

    attr_reader :left, :right, :operator

    def dividing_by_zero?
      operator == "/" && right.zero?
    end

    def compute
      case operator
      when "+" then left + right
      when "-" then left - right
      when "*" then left * right
      when "/" then left / right
      end
    end
  end
end
```

Prova subito in console, senza nemmeno aver scritto il form o la view:

```bash
docker compose exec web rails console
```

```ruby
Calculations::Compute.call(left: 10, right: 4, operator: "+")
# => #<struct Calculations::Result value=14, error=nil>

Calculations::Compute.call(left: 10, right: 0, operator: "/")
# => #<struct Calculations::Result value=nil, error="non si può dividere per zero">
```

Nota che dividere per zero **non fa esplodere niente**: torna un `Result` con un errore leggibile, gestito come un caso normale del dominio, non come un'emergenza.

---

## 7. Il Form Object: validare e orchestrare

Il Form Object è il ponte tra "quello che l'utente ha scritto" (stringhe, potenzialmente sporche) e "quello che il dominio si aspetta" (numeri, un operatore valido). Non eredita da `ActiveRecord::Base`: usa `ActiveModel::Model`, che regala validazioni ed errori a qualsiasi classe Ruby, anche senza una tabella dietro.

```ruby
# app/forms/calculation_form.rb
class CalculationForm
  include ActiveModel::Model

  attr_accessor :left_operand, :right_operand, :operator
  attr_reader :calculation

  validates :left_operand, :right_operand, presence: true
  validates :operator, inclusion: { in: Calculation::OPERATORS }
  validate :operandi_devono_essere_numeri

  # Il Form Object orchestra il flusso: valida, chiama il Service Object,
  # e solo se tutto va bene salva nel Model. Il controller non deve
  # sapere NIENTE di questi dettagli.
  def save
    return false unless valid?

    result = Calculations::Compute.call(
      left: left_operand.to_f,
      right: right_operand.to_f,
      operator: operator
    )

    if result.success?
      @calculation = Calculation.create!(
        left_operand: left_operand,
        right_operand: right_operand,
        operator: operator,
        result: result.value
      )
      true
    else
      errors.add(:base, result.error)
      false
    end
  end

  private

  def operandi_devono_essere_numeri
    errors.add(:left_operand, "deve essere un numero") if presente_non_numerico?(left_operand)
    errors.add(:right_operand, "deve essere un numero") if presente_non_numerico?(right_operand)
  end

  def presente_non_numerico?(value)
    return false if value.blank?

    Float(value)
    false
  rescue ArgumentError, TypeError
    true
  end
end
```

Anche questo si prova subito in console:

```ruby
form = CalculationForm.new(left_operand: "6", right_operand: "abc", operator: "+")
form.valid?
# => false
form.errors.full_messages
# => ["Right operand deve essere un numero"]
```

---

## 8. Il Controller: due azioni e via

Ed eccolo, il controller. Se hai seguito i passaggi precedenti, non c'è quasi nulla da scrivere: tutto il lavoro vero è già altrove.

```ruby
# app/controllers/calculations_controller.rb
class CalculationsController < ApplicationController
  def new
    @form = CalculationForm.new
    @calculations = Calculation.recent
  end

  def create
    @form = CalculationForm.new(calculation_params)
    @calculations = Calculation.recent

    if @form.save
      render :create
    else
      render :new, status: :unprocessable_entity
    end
  end

  private

  def calculation_params
    params.require(:calculation_form).permit(:left_operand, :right_operand, :operator)
  end
end
```

Niente `respond_to` esplicito: Rails guarda da solo l'header `Accept` della richiesta (Turbo lo imposta automaticamente su ogni form) e sceglie il template giusto tra `create.html.erb` e `create.turbo_stream.erb`, se entrambi esistono. Un'altra convenzione che ci evita codice ripetitivo.

> 💡 **Cosa succede se la validazione fallisce durante una richiesta Turbo?** Turbo si aspetta una risposta `turbo_stream`, ma noi rispondiamo con `new.html.erb` (perché abbiamo scritto `render :new`, e non esiste un `new.turbo_stream.erb`). Turbo se ne accorge, e in questo caso si comporta come se fosse una navigazione normale: sostituisce il contenuto del **Turbo Frame** più vicino con l'HTML ricevuto. È un comportamento previsto e documentato, non un bug — lo vedremo in azione tra un momento.

---

## 9. Le routes

```ruby
# config/routes.rb
Rails.application.routes.draw do
  root "calculations#new"

  resources :calculations, only: %i[new create]
end
```

---

## 10. Le viste spartane + Turbo Frame

### 10.1 Un pizzico di CSS, scritto a mano

```css
/* app/assets/stylesheets/application.css */
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  max-width: 420px;
  margin: 40px auto;
  padding: 0 16px;
  color: #222;
}

.display {
  font-size: 2rem;
  text-align: right;
  padding: 12px;
  border: 1px solid #ccc;
  margin-bottom: 12px;
  background: #fafafa;
}

.keypad input {
  width: 100%;
  font-size: 1.2rem;
  padding: 8px;
  margin-bottom: 8px;
  box-sizing: border-box;
}

.operators {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.operators button {
  flex: 1;
  padding: 8px;
  font-size: 1.2rem;
  cursor: pointer;
}

.operators button.active {
  background: #222;
  color: #fff;
}

.error {
  color: #b00020;
}

#calculations {
  list-style: none;
  padding: 0;
  font-family: monospace;
}

#calculations li {
  padding: 4px 0;
  border-bottom: 1px solid #eee;
}
```

Niente framework, niente classi criptiche: ogni regola CSS ha un nome che spiega da solo cosa fa.

### 10.2 La pagina principale

```erb
<%# app/views/calculations/new.html.erb %>
<h1>Calcolatrice</h1>

<%= turbo_frame_tag "calculator" do %>
  <%= render "form", form: @form %>
<% end %>

<h2>Storico</h2>

<ul id="calculations">
  <%= render @calculations %>
</ul>
```

`render @calculations` è un'altra convenzione Rails: passandogli una lista di `Calculation`, cerca da solo la partial `_calculation.html.erb` e la ripete per ogni elemento.

```erb
<%# app/views/calculations/_calculation.html.erb %>
<li id="<%= dom_id(calculation) %>"><%= calculation.to_equation %></li>
```

### 10.3 Il form, dentro il suo Turbo Frame

Un **Turbo Frame** è una porzione di pagina indipendente: se un form al suo interno viene inviato, la risposta aggiorna *solo quel frame*, non l'intera pagina. Ecco perché il form vive dentro `turbo_frame_tag "calculator"` qui sopra.

```erb
<%# app/views/calculations/_form.html.erb %>
<%= form_with model: form, scope: :calculation_form, url: calculations_path,
      data: { controller: "keypad" } do |f| %>

  <% if form.errors.any? %>
    <p class="error"><%= form.errors.full_messages.to_sentence %></p>
  <% end %>

  <div class="display">
    <%= form.calculation&.to_equation || "0" %>
  </div>

  <%= f.hidden_field :operator, value: form.operator || "+",
        data: { keypad_target: "operator" } %>

  <div class="keypad">
    <%= f.number_field :left_operand, step: "any", placeholder: "primo numero",
          data: { keypad_target: "left", action: "input->keypad#autoSubmit" } %>

    <div class="operators">
      <% Calculation::OPERATORS.each do |op| %>
        <button type="button" data-operator="<%= op %>"
                data-action="click->keypad#pickOperator"><%= op %></button>
      <% end %>
    </div>

    <%= f.number_field :right_operand, step: "any", placeholder: "secondo numero",
          data: { keypad_target: "right", action: "input->keypad#autoSubmit" } %>
  </div>

  <%= f.submit "Calcola", data: { keypad_target: "submit" } %>
<% end %>
```

A questo punto, anche **senza** Stimulus, l'app funziona già: riempi i campi, premi "Calcola", il Turbo Frame si aggiorna con il risultato senza mai ricaricare la pagina. Nella prossima sezione la rendiamo ancora più fluida.

---

## 11. Turbo Stream: aggiornare lo storico senza ricaricare nulla

Quando il calcolo va a buon fine, vogliamo **due cose contemporaneamente**: aggiungere una riga allo storico, e resettare il form per il prossimo calcolo. Un Turbo Stream può contenere più istruzioni, ognuna diretta a un pezzo diverso della pagina:

```erb
<%# app/views/calculations/create.turbo_stream.erb %>
<%= turbo_stream.prepend "calculations", @form.calculation %>
<%= turbo_stream.update "calculator", partial: "form", locals: { form: CalculationForm.new } %>
```

- `turbo_stream.prepend "calculations", @form.calculation` — aggiunge in cima alla lista con `id="calculations"` una nuova riga. Passando direttamente un record (`@form.calculation` invece di scrivere `partial:` e `locals:`), Rails trova da solo la partial giusta (`_calculation.html.erb`) e il suo `dom_id`: la stessa convenzione vista con `render @calculations`.
- `turbo_stream.update "calculator"` — sostituisce il contenuto del frame `calculator` con un form nuovo, vuoto, pronto per il prossimo calcolo.

Il browser riceve questa piccola risposta, e applica ogni istruzione al punto giusto, chirurgicamente — nessun reload, nessun flash bianco, nessuna riga di JavaScript scritta da noi per farlo succedere.

---

## 12. Stimulus: il keypad che si autoinvia

Generiamo lo scheletro del controller con il generatore ufficiale (registra automaticamente il controller in `app/javascript/controllers/index.js`):

```bash
docker compose run --rm web rails generate stimulus keypad
```

E lo riempiamo:

```javascript
// app/javascript/controllers/keypad_controller.js
import { Controller } from "@hotwired/stimulus"

// Rende la calcolatrice "viva":
// - evidenzia il bottone dell'operatore scelto
// - invia il form da solo, un attimo dopo che smetti di scrivere
//   (niente bottone da cliccare a mano, se non vuoi)
export default class extends Controller {
  static targets = ["left", "right", "operator", "submit"]

  connect() {
    this.highlightOperator()
  }

  // Collegato al click sui bottoni + - * /
  pickOperator(event) {
    this.operatorTarget.value = event.currentTarget.dataset.operator
    this.highlightOperator()
    this.autoSubmit()
  }

  // Collegato all'evento "input" sui due campi numerici
  autoSubmit() {
    if (this.leftTarget.value === "" || this.rightTarget.value === "") return

    // "Debounce": ogni tasto premuto annulla l'invio precedente e ne
    // programma uno nuovo tra 300 millisecondi. Se continui a scrivere,
    // la richiesta parte solo quando ti fermi — niente raffiche di
    // richieste ad ogni singolo carattere digitato.
    clearTimeout(this.timeout)
    this.timeout = setTimeout(() => this.submitTarget.click(), 300)
  }

  highlightOperator() {
    this.element.querySelectorAll("[data-operator]").forEach((button) => {
      button.classList.toggle("active", button.dataset.operator === this.operatorTarget.value)
    })
  }
}
```

Ricarica la pagina, scrivi `6` nel primo campo, `4` nel secondo: dopo un attimo di silenzio il risultato appare da solo. Clicca `-` invece di `+`: il bottone si "accende" e il risultato si aggiorna di nuovo, subito. Tutto questo con **meno di 30 righe** di JavaScript, testabili e leggibili quanto il resto dell'app.

> 🧠 **Regola d'oro di Hotwire**: parti sempre da HTML puro + Turbo. Aggiungi Stimulus solo per l'interattività che il server non può gestire da solo (evidenziare un bottone, inviare un form senza click manuale). Qui Stimulus non duplica nessuna logica di business — quella resta tutta nel Service Object, in Ruby, testabile senza browser.

---

## 13. Debug con `rails console`

Uno dei vantaggi più sottovalutati di questa architettura: **ogni pezzo si ispeziona da solo**, senza passare dal browser.

```bash
docker compose exec web rails console
```

(Usa `exec` se `docker compose up` è già acceso in un altro terminale; usa `run --rm` se invece i container sono spenti.)

Immagina che un utente scriva: *"ho provato a dividere per zero e la calcolatrice sembra bloccata"*. Riproduci il problema in isolamento, senza nemmeno aprire il browser:

```ruby
Calculations::Compute.call(left: 10, right: 0, operator: "/")
# => #<struct Calculations::Result value=nil, error="non si può dividere per zero">
```

Il Service Object gestisce già il caso correttamente: nessuna eccezione, solo un `Result` con un errore leggibile. Il problema, se esiste, è altrove — magari nella view che non mostra l'errore. Controlliamo il Form Object:

```ruby
form = CalculationForm.new(left_operand: "10", right_operand: "0", operator: "/")
form.save
# => false
form.errors.full_messages
# => ["non si può dividere per zero"]
Calculation.count
# => 0 (nessuna riga salvata: giusto, il calcolo non è andato a buon fine)
```

Anche questo funziona. A questo punto sai che il bug, se c'è, è nella view — e lo cerchi lì, senza aver toccato una singola richiesta HTTP. Altri comandi utili da tenere a mente:

```ruby
Calculation.recent               # gli ultimi 10 calcoli
Calculation.last.to_equation     # "6 + 4 = 10"
reload!                          # ricarica il codice Ruby modificato, senza riavviare la console
```

---

## 14. Unit testing: Service Object e Form Object

Perché il Service Object è Ruby puro, il suo test è velocissimo: non tocca il database, non avvia nessuna richiesta.

```ruby
# test/services/calculations/compute_test.rb
require "test_helper"

class Calculations::ComputeTest < ActiveSupport::TestCase
  test "somma due numeri" do
    result = Calculations::Compute.call(left: 2, right: 3, operator: "+")

    assert result.success?
    assert_equal 5, result.value
  end

  test "divide due numeri" do
    result = Calculations::Compute.call(left: 10, right: 2, operator: "/")

    assert result.success?
    assert_equal 5, result.value
  end

  test "dividere per zero restituisce un errore, non un'eccezione" do
    result = Calculations::Compute.call(left: 10, right: 0, operator: "/")

    assert_not result.success?
    assert_equal "non si può dividere per zero", result.error
  end
end
```

E per il Form Object, che orchestra validazione e salvataggio:

```ruby
# test/forms/calculation_form_test.rb
require "test_helper"

class CalculationFormTest < ActiveSupport::TestCase
  test "non è valido senza un operatore" do
    form = CalculationForm.new(left_operand: 1, right_operand: 2, operator: "")

    assert_not form.valid?
  end

  test "non accetta operatori sconosciuti" do
    form = CalculationForm.new(left_operand: 1, right_operand: 2, operator: "%")

    assert_not form.valid?
  end

  test "salva una Calculation quando i dati sono validi" do
    form = CalculationForm.new(left_operand: 4, right_operand: 2, operator: "/")

    assert_difference "Calculation.count", 1 do
      assert form.save
    end

    assert_equal 2, form.calculation.result.to_f
  end

  test "non salva nulla se il calcolo fallisce" do
    form = CalculationForm.new(left_operand: 4, right_operand: 0, operator: "/")

    assert_no_difference "Calculation.count" do
      assert_not form.save
    end

    assert_includes form.errors[:base], "non si può dividere per zero"
  end
end
```

```bash
docker compose run --rm web rails test test/services test/forms
```

> 💡 Nota cosa **non** serve fare per questi test: nessun mock del browser, nessuna richiesta HTTP simulata, nessuna view renderizzata. Solo oggetti Ruby che parlano tra loro. Ecco il vero guadagno di aver separato la logica dal controller.

---

## 15. Integration testing: il flusso completo

I test di integrazione, invece, verificano che i pezzi **funzionino insieme** attraverso una vera richiesta HTTP, dall'inizio alla fine.

```ruby
# test/integration/calculations_flow_test.rb
require "test_helper"

class CalculationsFlowTest < ActionDispatch::IntegrationTest
  test "un utente calcola 6 + 4 e vede il risultato salvato" do
    get new_calculation_path
    assert_response :success

    assert_difference "Calculation.count", 1 do
      post calculations_path, params: {
        calculation_form: { left_operand: 6, right_operand: 4, operator: "+" }
      }
    end

    assert_response :success
    assert_equal 10, Calculation.last.result.to_f
  end

  test "un calcolo non valido non crea nulla e torna un errore" do
    assert_no_difference "Calculation.count" do
      post calculations_path, params: {
        calculation_form: { left_operand: 6, right_operand: 0, operator: "/" }
      }
    end

    assert_response :unprocessable_entity
  end

  test "la richiesta Turbo Stream aggiorna lo storico" do
    post calculations_path,
      params: { calculation_form: { left_operand: 1, right_operand: 1, operator: "+" } },
      as: :turbo_stream

    assert_response :success
    assert_match "turbo-stream", response.content_type
    assert_match dom_id(Calculation.last), response.body
  end
end
```

`as: :turbo_stream` dice al test "fingi di essere una richiesta Turbo", cioè imposta l'header `Accept` giusto — così verifichiamo esattamente il ramo di codice che userà il browser vero.

```bash
docker compose run --rm web rails test test/integration
```

E per lanciare **tutta** la suite insieme:

```bash
docker compose run --rm web rails test
```

---

## 16. Avvio e prova finale

```bash
docker compose up
```

Apri **http://localhost:3000**, scrivi due numeri, gioca con gli operatori. Prova a fermarti a metà digitazione: vedrai il risultato aggiornarsi da solo dopo una breve pausa. Prova a dividere per zero: vedrai il messaggio d'errore apparire dentro il frame, senza reload — proprio grazie al comportamento di Turbo descritto nella sezione 8.

---

## 17. Riepilogo & prossimi passi

| Requisito | Dove lo trovi |
|---|---|
| Rails + Docker + PostgreSQL | `Dockerfile`, `docker-compose.yml`, `config/database.yml` |
| Turbo Frame | `turbo_frame_tag "calculator"` in `new.html.erb` |
| Turbo Stream | `create.turbo_stream.erb` |
| Stimulus | `app/javascript/controllers/keypad_controller.js` |
| Interfaccia spartana | `app/assets/stylesheets/application.css`, HTML semantico |
| Service Object | `app/services/calculations/compute.rb` |
| Form Object | `app/forms/calculation_form.rb` |
| Niente God Controller | `app/controllers/calculations_controller.rb` (due azioni, zero logica) |
| Debug con console | Sezione 13 |
| Unit test | `test/services/`, `test/forms/` |
| Integration test | `test/integration/` |

**Idee per andare oltre**, da provare da solo:

- Aggiungi un nuovo operatore (percentuale, potenza) toccando **solo** `Calculation::OPERATORS` e il `case` dentro `Calculations::Compute`. Se il controller e le view non cambiano di una virgola, l'architettura sta funzionando.
- Sostituisci il `case` del Service Object con una classe per ogni operatore (uno **Strategy Pattern**): utile quando gli operatori diventano tanti e ognuno ha regole proprie.
- Aggiungi un **system test** con Capybara, che apre un vero browser controllato e verifica che il debounce di Stimulus funzioni davvero, non solo che il server risponda bene.
- Fai il deploy con **Kamal**, lo strumento di deploy di default di Rails 8 — se non lo conosci ancora, se ne parla nel playbook **[Ruby on Rails: Applicazioni Professionali](/it/playbook/rails)**.

---

## 🎉 Ce l'hai fatta!

Hai costruito un'app Rails completa, dal `mkdir` iniziale ai test, con:

- Un ambiente Docker riproducibile, senza nulla installato "a mano" sul tuo computer
- Un'interfaccia che si aggiorna da sola grazie a Turbo Frame e Turbo Stream, senza scrivere quasi JavaScript
- Un controller sottile, che delega tutto a Form Object e Service Object
- Una logica di business isolata, testabile in pochi millisecondi senza toccare il database
- Test unitari e di integrazione che coprono sia i singoli pezzi sia il flusso intero

**Dove andare ora?**

- 📖 [Rails Guides](https://guides.rubyonrails.org) — la documentazione ufficiale
- 🔥 [Hotwire](https://hotwired.dev) — il sito ufficiale di Turbo e Stimulus, con demo interattive
- 🧵 [Turbo Handbook](https://turbo.hotwired.dev/handbook/introduction) — ogni comportamento di Turbo Frame e Turbo Stream, spiegato in dettaglio
- 🐳 [Docker Docs: Rails Quickstart](https://docs.docker.com/guides/frameworks/rails/) — la guida ufficiale Docker per app Rails
- 🐘 [Ruby on Rails: Applicazioni Professionali](/it/playbook/rails) — per approfondire Service Object, Form Object e Domain Driven Design applicati a un'app più grande
