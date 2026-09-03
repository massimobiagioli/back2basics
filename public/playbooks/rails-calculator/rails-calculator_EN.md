# Rails Calculator Step-by-Step

This isn't a playbook to read: it's a playbook to **build**. Step by step, you'll put together a small Rails application — a web calculator — running in Docker, saving every calculation to PostgreSQL, and updating itself in the browser (no page reload, no spinning "loading" indicator) thanks to **Turbo** and **Stimulus**. If you've already read **[Ruby on Rails: Professional Applications](/en/playbook/rails)**, you'll recognize the concepts; here we put them into practice line by line, from the very first `mkdir` all the way to the tests.

No CSS framework, no JavaScript build step, no 300-line files: just small pieces, each with one job, easy to understand and easy to test. It's the same principle you use when organizing your bedroom: one drawer for socks, one for t-shirts. Mix everything into a single drawer, and sooner or later you can't find anything.

---

## 1. What we're building, and why

By the end you'll have a page that looks like this:

```
┌───────────────────────────────┐
│           Calculator          │
├───────────────────────────────┤
│         6 + 4 = 10            │  ← "display", updates itself
├───────────────────────────────┤
│  [ 6                    ]     │
│  [ + ] [ - ] [ * ] [ / ]      │  ← the chosen button stays "lit"
│  [ 4                    ]     │
│         ( Calculate )         │
├───────────────────────────────┤
│  History                      │
│  6 + 4 = 10                   │  ← appears on its own, no reload
│  10 / 2 = 5                   │
└───────────────────────────────┘
```

Type the two numbers, pick an operator (even just by clicking it), and the result appears **while you type**, without ever pressing "Calculate" by hand unless you want to. Every calculation also lands in the history list below, in real time. All of this with **zero lines of scattered, freehand JavaScript**: just one small Stimulus controller, as tidy and testable as everything else.

The rules we'll follow throughout this playbook:

- **No God Controller.** The controller never does math, never validates anything by itself. It receives a request, delegates, responds. Period.
- **Service Object** for the pure calculation logic (plain Ruby, zero Rails, zero database).
- **Form Object** to validate whatever comes in from the user and orchestrate the model + service.
- **Spartan interface**: semantic HTML, a sliver of hand-written CSS, no Tailwind, no mysterious components.
- **Easy debugging**: every piece can be called and inspected from `rails console`, in isolation, without going through the browser.
- **Fast, focused tests**: unit tests for the pure logic, integration tests for the full flow.

---

## 2. Prerequisites

All you need is **Docker Desktop**, installed and running. You don't need Ruby installed on your machine, you don't need PostgreSQL installed: both will live inside containers. If you can open a terminal and copy a file, you're already ready.

---

## 3. The project, in Docker

### 3.1 Working folder

```bash
mkdir rails_calculator
cd rails_calculator
```

### 3.2 A throwaway Gemfile

To generate a Rails app we first need the `rails` executable inside the Docker image. A minimal Gemfile is enough for now — Rails itself will rewrite it with the real gems in a minute.

```ruby
# Gemfile
source "https://rubygems.org"
gem "rails", "~> 8.0"
```

```bash
touch Gemfile.lock
```

### 3.3 The Dockerfile

```dockerfile
# Dockerfile
FROM ruby:3.3-slim

# System libraries needed to compile native gems and to talk to
# PostgreSQL (libpq-dev). Rails 8 uses Importmap by default, so we
# don't need Node.js at all: zero JS build step.
RUN apt-get update -qq && apt-get install -y build-essential libpq-dev git curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy only Gemfile and Gemfile.lock first: as long as they don't
# change, Docker reuses this layer's cache and doesn't reinstall
# gems on every build. This is why well-written Docker builds
# "feel" fast after the first one.
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

Two services: `db` (PostgreSQL, with data saved in a volume that survives restarts) and `web` (our Rails app). The `.:/app` volume mounts the project folder inside the container, so any change you make to the code on your machine shows up instantly inside Docker, without ever rebuilding the image.

### 3.5 Build the image

```bash
docker compose build
```

### 3.6 Generate the Rails app

```bash
docker compose run --rm web rails new . --force --database=postgresql
```

- `run --rm` spins up a throwaway container just to run this command, then removes it right after: we don't need to keep it running.
- `--force` tells Rails "go ahead and overwrite the minimal Gemfile I put there, don't ask me file by file."
- `--database=postgresql` sets up `config/database.yml` for Postgres instead of SQLite.

No flag needed for Turbo or Stimulus: since Rails 7, they ship **already included** in every new app (they're part of Hotwire, the default standard). Same goes for Minitest, the built-in test framework.

### 3.7 Rebuild the image with the real gems

Now that `rails new` has written a full Gemfile (with `pg`, `turbo-rails`, `stimulus-rails`...), rebuild the image to install them:

```bash
docker compose build
```

### 3.8 Wire up the database

Replace the contents of `config/database.yml` with this, which reads the environment variables defined in `docker-compose.yml`:

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

### 3.9 Create and migrate the database

```bash
docker compose run --rm web rails db:prepare
```

### 3.10 Start everything

```bash
docker compose up
```

Open **http://localhost:3000**: you should see the Rails welcome page. If you see it, the ground is ready — from here on we build the actual calculator.

---

## 4. The domain: the migration and the model

Every calculation the user makes gets saved as one row in the `calculations` table: two numbers, an operator, a result.

```bash
docker compose run --rm web rails generate model Calculation \
  left_operand:decimal right_operand:decimal operator:string result:decimal
```

The generator creates a starting migration. Open it up and make it a bit stricter (no field can be left empty):

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

Now the model. Here lives **only** what's about the data itself: basic validations and a method to present the calculation as readable text.

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

  # Whole numbers don't need a trailing ".0": "10" reads better than
  # "10.0" on a calculator screen.
  def fmt(number)
    number = number.to_f
    number == number.to_i ? number.to_i.to_s : number.to_s
  end
end
```

Notice what's **not** here: no addition, no subtraction, no division-by-zero handling. The model only knows how to *represent* a calculation that's already done, not how to *do* it. That responsibility belongs elsewhere — that's the next step.

---

## 5. The architecture map (no God Controller)

Before writing any more code, let's sketch the path every request will take:

```
HTTP request (form submitted from the browser)
        │
        ▼
CalculationsController      ← thin: 2 actions, a few lines, zero logic
        │
        ▼
CalculationForm               ← Form Object: validates the raw incoming data
        │  (only if valid)
        ▼
Calculations::Compute         ← Service Object: ONLY the math, plain Ruby
        │
        ▼
Calculation                   ← Model: saves the result to the database
        │
        ▼
Turbo Stream / HTML            ← response: updates only the useful bits of the page
```

> 🧠 **Why so many pieces for "doing an addition"?** Because each one has exactly one reason to change. Add square root tomorrow, and you only touch the Service Object. Change an error message, and you only touch the Form Object. Change the HTML, and you only touch the views. The controller **never** changes. This is the opposite of a God Controller: one giant controller doing validation, math, formatting and sending emails all at once, impossible to test without simulating an entire HTTP request.

---

## 6. The Service Object: pure, isolated math

A Service Object does **one thing**. It doesn't know what a form is, doesn't know what HTTP is, never touches the database. It receives plain Ruby numbers, returns a plain Ruby result. That's why it's so fast to test: no setup, no database to prepare.

First, a small **Value Object** for the result — instead of returning `true`/`false`, `nil`, or randomly raising exceptions, we always return the same kind of object, predictably:

```ruby
# app/services/calculations/result.rb
module Calculations
  # Whoever calls the Service Object always gets back a Result: never
  # a bare number, never a surprise exception. success? tells you
  # whether it went well, value holds the number, error holds the
  # message if something went wrong.
  Result = Struct.new(:value, :error, keyword_init: true) do
    def success?
      error.nil?
    end
  end
end
```

And now the actual Service Object:

```ruby
# app/services/calculations/compute.rb
module Calculations
  class Compute
    DIVISION_BY_ZERO = "cannot divide by zero"

    # A common shortcut for Service Objects: instead of always
    # writing `Compute.new(...).call`, you can write `Compute.call(...)`.
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

Try it right away in the console, without even having written the form or the view:

```bash
docker compose exec web rails console
```

```ruby
Calculations::Compute.call(left: 10, right: 4, operator: "+")
# => #<struct Calculations::Result value=14, error=nil>

Calculations::Compute.call(left: 10, right: 0, operator: "/")
# => #<struct Calculations::Result value=nil, error="cannot divide by zero">
```

Notice that dividing by zero **doesn't blow anything up**: it returns a `Result` with a readable error, handled as a normal case of the domain, not as an emergency.

---

## 7. The Form Object: validating and orchestrating

The Form Object is the bridge between "what the user typed" (strings, potentially messy) and "what the domain expects" (numbers, a valid operator). It doesn't inherit from `ActiveRecord::Base`: it uses `ActiveModel::Model`, which gives validations and errors to any plain Ruby class, even without a table behind it.

```ruby
# app/forms/calculation_form.rb
class CalculationForm
  include ActiveModel::Model

  attr_accessor :left_operand, :right_operand, :operator
  attr_reader :calculation

  validates :left_operand, :right_operand, presence: true
  validates :operator, inclusion: { in: Calculation::OPERATORS }
  validate :operands_must_be_numbers

  # The Form Object orchestrates the flow: validate, call the Service
  # Object, and only if everything goes well, save to the Model. The
  # controller doesn't need to know ANY of these details.
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

  def operands_must_be_numbers
    errors.add(:left_operand, "must be a number") if present_but_not_numeric?(left_operand)
    errors.add(:right_operand, "must be a number") if present_but_not_numeric?(right_operand)
  end

  def present_but_not_numeric?(value)
    return false if value.blank?

    Float(value)
    false
  rescue ArgumentError, TypeError
    true
  end
end
```

This can also be tried right away in the console:

```ruby
form = CalculationForm.new(left_operand: "6", right_operand: "abc", operator: "+")
form.valid?
# => false
form.errors.full_messages
# => ["Right operand must be a number"]
```

---

## 8. The Controller: two actions, and done

And here it is, the controller. If you've followed the previous steps, there's barely anything left to write: all the real work already lives elsewhere.

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

No explicit `respond_to`: Rails looks at the request's `Accept` header on its own (Turbo sets it automatically on every form) and picks the right template between `create.html.erb` and `create.turbo_stream.erb`, if both exist. Another convention that saves us repetitive code.

> 💡 **What happens if validation fails during a Turbo request?** Turbo expects a `turbo_stream` response, but we respond with `new.html.erb` (because we wrote `render :new`, and there's no `new.turbo_stream.erb`). Turbo notices this, and in this case behaves as if it were a normal navigation: it replaces the content of the nearest **Turbo Frame** with the HTML it received. This is expected, documented behavior, not a bug — we'll see it in action in a moment.

---

## 9. The routes

```ruby
# config/routes.rb
Rails.application.routes.draw do
  root "calculations#new"

  resources :calculations, only: %i[new create]
end
```

---

## 10. Spartan views + Turbo Frame

### 10.1 A pinch of hand-written CSS

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

No framework, no cryptic classes: every CSS rule has a name that explains itself.

### 10.2 The main page

```erb
<%# app/views/calculations/new.html.erb %>
<h1>Calculator</h1>

<%= turbo_frame_tag "calculator" do %>
  <%= render "form", form: @form %>
<% end %>

<h2>History</h2>

<ul id="calculations">
  <%= render @calculations %>
</ul>
```

`render @calculations` is another Rails convention: give it a list of `Calculation` records, and it finds the `_calculation.html.erb` partial on its own and repeats it for each item.

```erb
<%# app/views/calculations/_calculation.html.erb %>
<li id="<%= dom_id(calculation) %>"><%= calculation.to_equation %></li>
```

### 10.3 The form, inside its Turbo Frame

A **Turbo Frame** is an independent slice of the page: if a form inside it gets submitted, the response updates *only that frame*, not the whole page. That's why the form lives inside `turbo_frame_tag "calculator"` above.

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
    <%= f.number_field :left_operand, step: "any", placeholder: "first number",
          data: { keypad_target: "left", action: "input->keypad#autoSubmit" } %>

    <div class="operators">
      <% Calculation::OPERATORS.each do |op| %>
        <button type="button" data-operator="<%= op %>"
                data-action="click->keypad#pickOperator"><%= op %></button>
      <% end %>
    </div>

    <%= f.number_field :right_operand, step: "any", placeholder: "second number",
          data: { keypad_target: "right", action: "input->keypad#autoSubmit" } %>
  </div>

  <%= f.submit "Calculate", data: { keypad_target: "submit" } %>
<% end %>
```

At this point, even **without** Stimulus, the app already works: fill in the fields, hit "Calculate", the Turbo Frame updates with the result without ever reloading the page. In the next section we make it even smoother.

---

## 11. Turbo Stream: updating the history without reloading anything

When the calculation succeeds, we want **two things at once**: add a row to the history, and reset the form for the next calculation. A Turbo Stream response can carry several instructions at once, each targeting a different piece of the page:

```erb
<%# app/views/calculations/create.turbo_stream.erb %>
<%= turbo_stream.prepend "calculations", @form.calculation %>
<%= turbo_stream.update "calculator", partial: "form", locals: { form: CalculationForm.new } %>
```

- `turbo_stream.prepend "calculations", @form.calculation` — adds a new row to the top of the list with `id="calculations"`. By passing a record directly (`@form.calculation` instead of writing `partial:` and `locals:`), Rails finds the right partial (`_calculation.html.erb`) and its `dom_id` on its own: the same convention we saw with `render @calculations`.
- `turbo_stream.update "calculator"` — replaces the content of the `calculator` frame with a fresh, empty form, ready for the next calculation.

The browser receives this small response and applies each instruction to the right spot, surgically — no reload, no white flash, no JavaScript we had to write to make it happen.

---

## 12. Stimulus: the self-submitting keypad

Generate the controller scaffold with the official generator (it automatically registers the controller in `app/javascript/controllers/index.js`):

```bash
docker compose run --rm web rails generate stimulus keypad
```

And fill it in:

```javascript
// app/javascript/controllers/keypad_controller.js
import { Controller } from "@hotwired/stimulus"

// Brings the calculator to life:
// - highlights the chosen operator button
// - submits the form on its own, a moment after you stop typing
//   (no button to click by hand, unless you want to)
export default class extends Controller {
  static targets = ["left", "right", "operator", "submit"]

  connect() {
    this.highlightOperator()
  }

  // Wired to clicks on the + - * / buttons
  pickOperator(event) {
    this.operatorTarget.value = event.currentTarget.dataset.operator
    this.highlightOperator()
    this.autoSubmit()
  }

  // Wired to the "input" event on both number fields
  autoSubmit() {
    if (this.leftTarget.value === "" || this.rightTarget.value === "") return

    // "Debounce": every keystroke cancels the previous submit and
    // schedules a new one 300 milliseconds later. If you keep typing,
    // the request only fires once you pause — no burst of requests
    // on every single character typed.
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

Reload the page, type `6` into the first field, `4` into the second: after a brief pause, the result appears on its own. Click `-` instead of `+`: the button "lights up" and the result updates again, instantly. All of this in **under 30 lines** of JavaScript, as testable and readable as the rest of the app.

> 🧠 **Hotwire's golden rule**: always start with plain HTML + Turbo. Add Stimulus only for the interactivity the server can't handle on its own (highlighting a button, submitting a form without a manual click). Here, Stimulus duplicates none of the business logic — that all stays in the Service Object, in Ruby, testable without a browser.

---

## 13. Debugging with `rails console`

One of the most underrated benefits of this architecture: **every piece can be inspected on its own**, without going through the browser.

```bash
docker compose exec web rails console
```

(Use `exec` if `docker compose up` is already running in another terminal; use `run --rm` if the containers are stopped.)

Imagine a user reports: *"I tried dividing by zero and the calculator seems stuck."* Reproduce the problem in isolation, without even opening the browser:

```ruby
Calculations::Compute.call(left: 10, right: 0, operator: "/")
# => #<struct Calculations::Result value=nil, error="cannot divide by zero">
```

The Service Object already handles the case correctly: no exception, just a `Result` with a readable error. If there's a problem, it must be elsewhere — maybe the view isn't showing the error. Let's check the Form Object:

```ruby
form = CalculationForm.new(left_operand: "10", right_operand: "0", operator: "/")
form.save
# => false
form.errors.full_messages
# => ["cannot divide by zero"]
Calculation.count
# => 0 (no row saved: correct, the calculation didn't succeed)
```

This works too. At this point you know the bug, if there is one, lives in the view — and you go look there, without ever having touched a single HTTP request. Other commands worth keeping in mind:

```ruby
Calculation.recent               # the last 10 calculations
Calculation.last.to_equation     # "6 + 4 = 10"
reload!                          # reloads changed Ruby code, without restarting the console
```

---

## 14. Unit testing: Service Object and Form Object

Because the Service Object is plain Ruby, its test is extremely fast: it never touches the database, never starts a request.

```ruby
# test/services/calculations/compute_test.rb
require "test_helper"

class Calculations::ComputeTest < ActiveSupport::TestCase
  test "adds two numbers" do
    result = Calculations::Compute.call(left: 2, right: 3, operator: "+")

    assert result.success?
    assert_equal 5, result.value
  end

  test "divides two numbers" do
    result = Calculations::Compute.call(left: 10, right: 2, operator: "/")

    assert result.success?
    assert_equal 5, result.value
  end

  test "dividing by zero returns an error, not an exception" do
    result = Calculations::Compute.call(left: 10, right: 0, operator: "/")

    assert_not result.success?
    assert_equal "cannot divide by zero", result.error
  end
end
```

And for the Form Object, which orchestrates validation and saving:

```ruby
# test/forms/calculation_form_test.rb
require "test_helper"

class CalculationFormTest < ActiveSupport::TestCase
  test "is invalid without an operator" do
    form = CalculationForm.new(left_operand: 1, right_operand: 2, operator: "")

    assert_not form.valid?
  end

  test "rejects unknown operators" do
    form = CalculationForm.new(left_operand: 1, right_operand: 2, operator: "%")

    assert_not form.valid?
  end

  test "saves a Calculation when the data is valid" do
    form = CalculationForm.new(left_operand: 4, right_operand: 2, operator: "/")

    assert_difference "Calculation.count", 1 do
      assert form.save
    end

    assert_equal 2, form.calculation.result.to_f
  end

  test "saves nothing if the calculation fails" do
    form = CalculationForm.new(left_operand: 4, right_operand: 0, operator: "/")

    assert_no_difference "Calculation.count" do
      assert_not form.save
    end

    assert_includes form.errors[:base], "cannot divide by zero"
  end
end
```

```bash
docker compose run --rm web rails test test/services test/forms
```

> 💡 Notice what these tests **don't** need: no mocking the browser, no simulated HTTP request, no rendered view. Just Ruby objects talking to each other. That's the real payoff of having separated the logic from the controller.

---

## 15. Integration testing: the full flow

Integration tests, instead, verify that the pieces **work together** through a real HTTP request, start to finish.

```ruby
# test/integration/calculations_flow_test.rb
require "test_helper"

class CalculationsFlowTest < ActionDispatch::IntegrationTest
  test "a user calculates 6 + 4 and sees the saved result" do
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

  test "an invalid calculation creates nothing and returns an error" do
    assert_no_difference "Calculation.count" do
      post calculations_path, params: {
        calculation_form: { left_operand: 6, right_operand: 0, operator: "/" }
      }
    end

    assert_response :unprocessable_entity
  end

  test "the Turbo Stream request updates the history" do
    post calculations_path,
      params: { calculation_form: { left_operand: 1, right_operand: 1, operator: "+" } },
      as: :turbo_stream

    assert_response :success
    assert_match "turbo-stream", response.content_type
    assert_match dom_id(Calculation.last), response.body
  end
end
```

`as: :turbo_stream` tells the test "pretend to be a Turbo request," i.e. it sets the right `Accept` header — so we're testing exactly the code path the real browser will take.

```bash
docker compose run --rm web rails test test/integration
```

And to run the **whole** suite at once:

```bash
docker compose run --rm web rails test
```

---

## 16. Final startup and manual test

```bash
docker compose up
```

Open **http://localhost:3000**, type two numbers, play with the operators. Try pausing mid-typing: you'll see the result update itself after a brief pause. Try dividing by zero: you'll see the error message appear inside the frame, with no reload — exactly thanks to the Turbo behavior described in section 8.

---

## 17. Summary & next steps

| Requirement | Where to find it |
|---|---|
| Rails + Docker + PostgreSQL | `Dockerfile`, `docker-compose.yml`, `config/database.yml` |
| Turbo Frame | `turbo_frame_tag "calculator"` in `new.html.erb` |
| Turbo Stream | `create.turbo_stream.erb` |
| Stimulus | `app/javascript/controllers/keypad_controller.js` |
| Spartan interface | `app/assets/stylesheets/application.css`, semantic HTML |
| Service Object | `app/services/calculations/compute.rb` |
| Form Object | `app/forms/calculation_form.rb` |
| No God Controller | `app/controllers/calculations_controller.rb` (two actions, zero logic) |
| Debugging with the console | Section 13 |
| Unit tests | `test/services/`, `test/forms/` |
| Integration tests | `test/integration/` |

**Ideas to go further**, to try on your own:

- Add a new operator (percentage, power) by touching **only** `Calculation::OPERATORS` and the `case` inside `Calculations::Compute`. If the controller and views don't change by a single character, the architecture is working.
- Replace the Service Object's `case` with one class per operator (a **Strategy Pattern**): useful once operators multiply and each carries its own rules.
- Add a **system test** with Capybara, driving a real, controlled browser, to verify that Stimulus's debounce actually works — not just that the server responds correctly.
- Deploy it with **Kamal**, Rails 8's default deploy tool — if you haven't met it yet, it's covered in the **[Ruby on Rails: Professional Applications](/en/playbook/rails)** playbook.

---

## 🎉 You made it!

You've built a complete Rails app, from the initial `mkdir` to the tests, with:

- A reproducible Docker environment, with nothing installed "by hand" on your machine
- An interface that updates itself thanks to Turbo Frame and Turbo Stream, with almost no JavaScript written
- A thin controller, delegating everything to a Form Object and a Service Object
- Business logic isolated and testable in milliseconds, without ever touching the database
- Unit and integration tests covering both the individual pieces and the full flow

**Where to go from here?**

- 📖 [Rails Guides](https://guides.rubyonrails.org) — the official documentation
- 🔥 [Hotwire](https://hotwired.dev) — the official Turbo and Stimulus site, with interactive demos
- 🧵 [Turbo Handbook](https://turbo.hotwired.dev/handbook/introduction) — every Turbo Frame and Turbo Stream behavior, explained in detail
- 🐳 [Docker Docs: Rails Quickstart](https://docs.docker.com/guides/frameworks/rails/) — Docker's official guide for Rails apps
- 🐘 [Ruby on Rails: Professional Applications](/en/playbook/rails) — to go deeper into Service Objects, Form Objects, and Domain Driven Design applied to a larger app
