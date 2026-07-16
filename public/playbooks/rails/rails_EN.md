# Ruby on Rails: Professional Applications

In 2004, David Heinemeier Hansson ("DHH") was building Basecamp, a project management tool, for his company 37signals. Instead of writing the same code over and over to wire a database up to a web page, he noticed he kept repeating the same steps. So he extracted that repeated code into a separate framework. He called it **Ruby on Rails**.

The core idea was revolutionary for its time: **Convention over Configuration**. Instead of telling the computer *every single detail* of how things connect, Rails picks sensible defaults, and you only configure the exceptions. The result? What takes weeks in other frameworks takes hours in Rails.

This philosophy is also called **"omakase"** — a Japanese word meaning "I'll let the chef decide." When you order omakase at a restaurant, you don't pick every single ingredient: you trust the chef, who has already thought through a coherent, high-quality menu. Rails works the same way: it gives you a database, a server, a way to test, a way to handle background jobs — all already chosen, coherent, and ready to use. You can swap pieces out if you want, but the starting point is already excellent.

If you've already read **[Ruby: The Good Parts](/en/playbook/ruby)**, you know the basics of the language. This playbook teaches you to use it to build real web applications — professional and maintainable over time — with **Rails 8.1**, the most modern and leanest version ever released.

---

## 1. Framework Fundamentals

**In a nutshell**: Rails is an MVC (Model-View-Controller) framework that automatically wires together your database, your application logic, and your HTML pages, following conventions that eliminate almost all manual configuration.

### MVC: the three rooms of the house

Every Rails application is organized into three parts, which communicate in a precise flow:

```
Browser → Router → Controller → Model → Controller → View → Browser
```

- **Model** (`app/models/`) — represents the data and business rules. A `User`, a `Task`, an `Order`. Talks to the database.
- **View** (`app/views/`) — the HTML the user sees. `.html.erb` templates (ERB = Embedded Ruby, i.e. Ruby inside HTML).
- **Controller** (`app/controllers/`) — receives the request, asks the Model for data, chooses which View to render. It's the "traffic cop" between the other two parts.

> 💡 **Analogy**: think of a restaurant. The **Router** is the host who seats you at the right table. The **Controller** is the waiter who takes your order and brings it to the kitchen. The **Model** is the cook, who knows how to prepare the dishes (the data). The **View** is the plated dish that gets served to you.

### Convention over Configuration, in practice

Here's the magic with a concrete example. If you create a database table called `users` with the columns `name` and `email`...

```ruby
# app/models/user.rb
class User < ApplicationRecord
end
```

...that's **all** the code you need. You never have to write `name` or `email` anywhere in the model: Rails reads the table's structure and figures out on its own that a `User` has a `name` and an `email`. You can already write:

```ruby
user = User.new(name: "Ada", email: "ada@example.com")
user.save
user.name  # => "Ada"
```

This works because Rails follows precise, predictable rules:

| Convention | Example |
|---|---|
| The model is singular, the table is plural | Model `User` ↔ table `users` |
| The file name matches the class name | `app/models/user.rb` → `class User` |
| Foreign keys end in `_id` | `task.user_id` links a `Task` to a `User` |
| Controllers are plural | `app/controllers/users_controller.rb` → `class UsersController` |
| Views live in a folder named after the controller | `app/views/users/index.html.erb` |

If you break these conventions (e.g. calling the table `utenti` instead of `users`), Rails stops guessing and you have to configure everything by hand. That's why following conventions isn't laziness — it's what makes Rails fast.

### The structure of a Rails app

```
taskflow/
├── app/
│   ├── models/          # Data and business rules
│   ├── views/            # HTML templates
│   ├── controllers/      # Coordinate model and view
│   ├── jobs/              # Background jobs
│   ├── mailers/          # Sending email
│   └── services/          # Business logic, which we'll cover further ahead
├── config/
│   ├── routes.rb          # Which URL goes to which controller
│   └── database.yml       # Database configuration
├── db/
│   ├── migrate/            # History of database changes
│   └── schema.rb           # Current database structure
├── test/ (or spec/)         # Tests
└── Gemfile                 # Dependencies (the "gems", i.e. Ruby libraries)
```

### Who uses Rails?

**GitHub**, **Shopify** (one of the largest e-commerce platforms in the world, still largely Rails today), **Basecamp/37signals** (where Rails was born), **GitLab** (in part), **Airbnb** (during its early explosive-growth years). Rails has repeatedly proven it can hold up at enormous scale, despite its reputation for being "just for quick prototypes."

---

## 2. Clean Approach vs. Rubyist Approach

**In a nutshell**: there's a long-standing tension between those who want to bring heavy "enterprise" patterns from Java/C# into Rails, and those who want to write "just Rails," trusting the conventions. The truth lies in between, and it depends on the size of your app.

### The two schools of thought

**The "Rails Way" school (the Rubyist approach)**: trust the conventions. Don't introduce layers of abstraction until you actually need them. DHH calls it **"just write Rails"**: most apps don't need a Service Layer, Repository Pattern, or sophisticated Dependency Injection. Those are complexities borrowed from other worlds (often Java enterprise) that, in a small/medium Rails app, become nothing but dead weight to maintain.

**The "Clean Architecture" school**: apply stricter decoupling principles — separate layers, business logic independent of the framework, tests that don't touch the database. Strong argument: as the app grows and the team grows, "everything inside ActiveRecord" collapses under its own weight.

### Who's right?

Both, depending on context.

| Situation | Recommended approach |
|---|---|
| Small app, team of 1-3 people, MVP to validate | Pure Rails Way. Fat model as much as needed, no Service Objects until you feel real pain. |
| Growing app, complex business logic, more teams | Introduce Service Objects, Form Objects, namespaces per domain — **only where the pain is real**, not everywhere preemptively. |
| Huge team, very complex domain (fintech, healthcare) | Worth investing in more rigorous architecture from the start — see section 7 on DDD. |

> 🧠 **The golden rule**: don't introduce a pattern because "it's cleaner" in theory. Introduce it when you feel concrete pain — an 800-line model, a controller full of `if` statements, a test that needs 15 mocks to run. The pain tells you exactly where structure is needed. Adding abstraction before the pain is called **over-engineering**, and it's just as toxic as its opposite.

Avoid both extremes:
- ❌ **Fat Model / Fat Controller**: a `User` with 40 methods that does everything, a controller with 200 lines of business logic. Impossible to test in isolation, impossible to understand at a glance.
- ❌ **Premature over-engineering**: 6 layers of abstraction for a 3-field CRUD. Every change requires touching 5 files instead of one.

---

## 3. Modern MVC

**In a nutshell**: Rails 7/8 has brought server-side rendering back into fashion, thanks to Hotwire — you get the interactivity of a Single Page Application without writing (almost) any JavaScript and without a separate frontend.

### The pendulum's pendulum

For years, the trend was: "the backend is just a JSON API, the frontend is a separate React/Vue SPA." This approach works, but it has a cost: two codebases, two deploys, duplicated validation logic, the complexity of managing state in two places.

Modern Rails proposes an alternative: **HTML over the wire**. The server keeps generating HTML (as it has always done), but does so fast enough and granularly enough to feel like an SPA. The browser receives ready-made pieces of HTML, not JSON to be turned into DOM via JavaScript.

### Organizing views

Rails views are organized into **partials** — reusable pieces of HTML:

```erb
<%# app/views/tasks/_task.html.erb — a partial for a single task row %>
<div id="<%= dom_id(task) %>" class="task">
  <span><%= task.title %></span>
  <%= link_to "Complete", complete_task_path(task), data: { turbo_method: :patch } %>
</div>
```

```erb
<%# app/views/tasks/index.html.erb — using it in a loop %>
<div id="tasks">
  <%= render @tasks %>
  <%# Rails figures out on its own that it should use _task.html.erb for each element %>
</div>
```

This organizing style — small, composable partials — is Rails' way of achieving what other frameworks call "components." For larger apps, the **ViewComponent** gem adds true components with encapsulated Ruby logic, but partials alone will take you far.

---

## 4. Stimulus, Turbo, Hotwire: UI without the fuss

**In a nutshell**: Hotwire (**HTML Over The Wire**) is the umbrella that contains **Turbo** (navigation and automatic updates) and **Stimulus** (small JavaScript controllers for local interactivity). Together, they give you a reactive UI with no build step, no heavy JS framework, and no duplicating logic across two languages.

### Turbo Drive: navigation for free

Turbo Drive is active by default in every Rails 8 app and requires no code. It intercepts clicks on links and form submissions, and instead of making the browser reload the whole page, it downloads only the new HTML and swaps the `<body>`. The result: navigation **feels** like an SPA (no white flash, no CSS/JS reload), but you wrote zero JavaScript.

### Turbo Frames: updating a piece of the page

A **Turbo Frame** is an independent portion of a page. If a link or form is inside a frame, the response updates *only that frame*, not the entire page.

```erb
<%# app/views/tasks/show.html.erb %>
<turbo_frame_tag task>
  <h1><%= task.title %></h1>
  <%= link_to "Edit", edit_task_path(task) %>
</turbo_frame_tag>
```

```erb
<%# app/views/tasks/edit.html.erb %>
<turbo_frame_tag task>
  <%= form_with model: task do |f| %>
    <%= f.text_field :title %>
    <%= f.submit "Save" %>
  <% end %>
</turbo_frame_tag>
```

Click "Edit": Rails renders `edit.html.erb`, but only the content inside `<turbo_frame_tag task>` replaces the matching frame in the previous page. The rest of the page stays intact. No hand-written JavaScript.

### Turbo Streams: live updates, even from other users

A **Turbo Stream** is a message that tells the browser: "append this element," "replace that one," "remove this other one." You can send them as a response to a controller action, or over WebSocket (Action Cable) for real-time updates from other users.

```ruby
# app/controllers/tasks_controller.rb
def create
  @task = @project.tasks.create!(task_params)

  respond_to do |format|
    format.turbo_stream # looks for create.turbo_stream.erb
    format.html { redirect_to @project }
  end
end
```

```erb
<%# app/views/tasks/create.turbo_stream.erb %>
<%= turbo_stream.append "tasks", partial: "tasks/task", locals: { task: @task } %>
```

This appends the new task to the list with id `tasks`, **without reloading the page**, without writing a single line of custom JavaScript. When combined with Action Cable, this same stream can be broadcast to *every* user currently viewing that page in real time — we'll see a concrete example in the final project.

### Stimulus: JavaScript only where it's truly needed

Turbo covers navigation and server-driven updates. But sometimes you need purely client-side interactivity — opening a dropdown menu, showing/hiding an element, validating a field as you type. That's what **Stimulus** is for: small JavaScript "controllers" attached to HTML via `data-*` attributes.

```html
<!-- app/views/tasks/_task.html.erb -->
<div data-controller="toggle">
  <button data-action="click->toggle#switch">Show details</button>
  <p data-toggle-target="details" class="hidden">Task details...</p>
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

Notice the philosophy: the HTML describes *what* the controller does (`data-controller="toggle"`), the JavaScript is tiny and does *only* that one thing. There's no complex application "state" to synchronize like in React — state lives in the DOM and on the server, where it belongs.

> 🧠 **The golden rule**: always start from plain HTML + Turbo. Add Stimulus only when you need interactivity the server can't handle (because it requires an instant response, without a network round-trip). This is "HTML-first, JS only where truly needed" — the opposite of "JS-first, HTML is just output."

---

## 5. Clean Architecture in Rails

**In a nutshell**: as an app grows, some patterns help you keep controllers and models lean, moving complexity into small objects with a single responsibility.

### Service Objects (`app/services/`)

A Service Object encapsulates a complex business action that doesn't naturally belong to a single model. Common convention: a class with a single public method, often called `.call`.

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
# in the controller, it stays a single line:
AssignTask.call(task: @task, assignee: current_user)
```

Benefits: the controller stays readable, and the Service Object can be tested on its own, without going through HTTP.

### Form Object

When a form doesn't map 1:1 to a model (e.g. a signup form that creates both a `User` and a `Company`), a Form Object encapsulates the validation and saving:

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

Complex, reusable Active Record queries, kept out of the model:

```ruby
# app/queries/overdue_tasks_query.rb
class OverdueTasksQuery
  def self.call(project)
    project.tasks.where("due_date < ?", Time.current).where(completed: false)
  end
end
```

### Policy Object (authorization)

For authorization ("can this user perform this action?"), the most popular gem is **Pundit**: one "Policy" class per model, with methods returning `true`/`false`.

```ruby
# app/policies/task_policy.rb
class TaskPolicy < ApplicationPolicy
  def update?
    user == record.project.owner || user == record.assignee
  end
end
```

```ruby
# in the controller
def update
  authorize @task # raises an exception if update? returns false
  @task.update!(task_params)
end
```

### Clean APIs

To expose JSON instead of HTML, Rails convention is to version things with a namespace:

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

For more controlled JSON (avoiding accidentally exposing sensitive columns), use **Jbuilder** (included by default in Rails):

```ruby
# app/views/api/v1/tasks/index.json.jbuilder
json.array! @tasks do |task|
  json.id task.id
  json.title task.title
  json.completed task.completed
  # note: task.internal_notes is NOT here, so it isn't exposed
end
```

### Authentication

Rails 8 includes a **built-in authentication generator**:

```bash
bin/rails generate authentication
```

This creates a `User` model with `has_secure_password` (based on bcrypt), secure sessions, and the essential login views/controller — **with no need to install Devise**. For more complex needs (login with Google/GitHub, two-factor authentication, multi-tenant user management), **Devise** remains the mature go-to gem in the ecosystem.

---

## 6. Good Parts & Bad Parts

An honest assessment of Rails, without the marketing.

### ✅ Good Parts

| Strength | Why |
|---|---|
| **Development speed** | Convention over Configuration gets you to a working prototype in hours, not weeks. |
| **Expressive ActiveRecord** | `Task.where(completed: false).order(:due_date)` reads like English. Querying the database becomes natural. |
| **Hotwire** | Reactive UI with no build step, no duplicating logic across JS and Ruby, no complexity of managing client-side state. |
| **Gem ecosystem** | Almost every common problem (payments, authentication, file uploads, PDFs) has a mature, production-tested gem. |
| **The "Solid" stack in Rails 8** | Solid Queue, Solid Cache, Solid Cable: no Redis required to get started. A Rails 8 app starts with just one database. |
| **Community and documentation** | The Rails Guides are among the best documentation ever written for a framework. |

### ❌ Bad Parts

| Weakness | Detail |
|---|---|
| **The "magic" confuses beginners** | Implicit conventions (where is this method defined?) are powerful but opaque until you learn them. |
| **Risk of an unmanageable monolith** | Without discipline, a Rails app grows into a "big ball of mud" — see section 2. |
| **ActiveRecord tempts you into Fat Models** | It's so easy to add methods to the model that models tend to grow out of control. |
| **Runtime performance** | Ruby is slower than Go or Rust on raw computation. Rails compensates with caching (Solid Cache) and smart queries, but it's not the right choice for CPU-intensive workloads. |
| **Paradigm shift for people coming from other stacks** | Anyone arriving from Java/Spring or an "API-only + SPA" world has to unlearn some habits. |

> 🧠 **The golden rule**: Rails is outstanding for database-driven applications — admin systems, e-commerce, SaaS, marketplaces. It's a more questionable choice for CPU-intensive systems (video processing, scientific computing) or for teams that categorically reject conventions.

---

## 7. Domain Driven Design in Rails

**In a nutshell**: Domain Driven Design (DDD) is a set of practices for modeling complex software by mirroring the real language of the business. In Rails it's applied with moderation: full DDD is overkill for a small app, but some ideas are always worth it.

### Ubiquitous Language

The names of your Ruby classes should use **the same words** the business team uses, not invented technical terms. If the business team talks about a "subscription," the class is called `Subscription`, not `RecurringBillingEntity`.

### Bounded Context via namespaces

When an app grows and contains distinct domains (billing, shipping, catalog), you can organize models into modules/namespaces that mirror those boundaries:

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

To actually enforce these boundaries (preventing `Billing` from directly importing from `Shipping` without going through an explicit interface), large apps use the **Packwerk** gem (created by Shopify precisely to manage their own enormous Rails monolith).

### Anemic models vs. rich models

An **anemic** model is just a data container, with all the logic elsewhere:

```ruby
# ❌ anemic: Order doesn't know how to do anything, just exposes columns
class Order < ApplicationRecord
end
# the logic for "can it be cancelled?" is scattered across controllers
```

A **rich** model encapsulates behavior and invariants:

```ruby
# ✅ rich: Order can answer business questions about itself
class Order < ApplicationRecord
  def cancellable?
    status == "pending" && created_at > 24.hours.ago
  end

  def cancel!
    raise "Not cancellable" unless cancellable?
    update!(status: "cancelled")
  end
end
```

### Value Object

A Value Object represents a concept with no identity of its own, defined solely by its values, and it's immutable. Classic example: money.

```ruby
# app/models/money.rb
class Money
  attr_reader :cents, :currency

  def initialize(cents, currency: "EUR")
    @cents = cents
    @currency = currency
    freeze # makes the object immutable
  end

  def +(other)
    raise "Different currencies" unless currency == other.currency
    Money.new(cents + other.cents, currency:)
  end

  def to_s
    format("%.2f %s", cents / 100.0, currency)
  end
end
```

This avoids huge bugs: adding raw integers in cents without a dedicated class eventually leads to confusing euros and cents, or accidentally adding different currencies together.

> 🧠 **The golden rule**: apply DDD to the parts of the app where business complexity is real (the billing engine, not the "About Us" page). For simple CRUD, "anemic" ActiveRecord is perfectly fine.

---

## 8. Workers, Notifiers, Mailer: async when it matters

**In a nutshell**: **Active Job** is Rails' standard abstraction for background jobs. In Rails 8, the default backend is **Solid Queue**, which stores jobs in the database — no Redis to install to get started.

### When to go to the background

Rule of thumb: if an operation takes more than a few hundred milliseconds, or calls an external service (sending email, calling a payment API, generating a PDF), **don't make the user wait for it**. Put it in a job.

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
# enqueue it like this, from anywhere in the app:
GenerateReportJob.perform_later(@project)
```

With Solid Queue, this job is stored in a database table and processed by a separate worker (`bin/jobs` in Rails 8), with no need to install Redis or Sidekiq. For very high volumes (millions of jobs per day), **Sidekiq** remains the historical go-to alternative in the ecosystem, based on Redis.

### ActionMailer

Emails are written as controller + view:

```ruby
# app/mailers/task_mailer.rb
class TaskMailer < ApplicationMailer
  def assigned(task)
    @task = task
    mail(to: task.assignee.email, subject: "You've been assigned a task")
  end
end
```

```erb
<%# app/views/task_mailer/assigned.html.erb %>
<p>Hi <%= @task.assignee.name %>,</p>
<p>You've been assigned the task "<%= @task.title %>".</p>
```

```ruby
TaskMailer.assigned(@task).deliver_later # goes to the queue, doesn't block the request
```

### In-app notifications

For notifications inside the app (not just email), a common pattern is a dedicated "Notifier," or the **Noticed** gem, which handles multi-channel delivery (email, in-app, Slack) from a single definition:

```ruby
# app/notifiers/task_assigned_notifier.rb
class TaskAssignedNotifier < Noticed::Event
  deliver_by :database
  deliver_by :email, mailer: "TaskMailer", method: :assigned
end
```

---

## 9. Useful Tools

**In a nutshell**: Rails gives you a coherent toolbox for exploring, debugging, and testing your app, all accessible through `bin/rails`.

### `bin/rails console`

Your app's interactive console — an `irb` with all your models already loaded:

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

reload! # reloads changed code without leaving the console
```

> 💡 **Tip**: `bin/rails console --sandbox` opens a console where every change to the database is rolled back on exit. Perfect for experimenting without fear.

### `bin/rails routes`

Lists all of the app's routes:

```bash
bin/rails routes
bin/rails routes -g task # filters only routes containing "task"
```

### `bin/rails generate`

Generates code skeletons following the conventions:

```bash
bin/rails generate model Task title:string completed:boolean
bin/rails generate controller Tasks
bin/rails generate migration AddDueDateToTasks due_date:date
```

### The built-in debugger

Rails includes the `debug` gem by default. Just drop a breakpoint into the code:

```ruby
def create
  @task = @project.tasks.new(task_params)
  binding.irb # <- the server stops here, opens an interactive console in the terminal
  @task.save
end
```

When the request reaches that line, the server pauses and you get an `irb` console in the terminal with access to all the local variables (`@task`, `params`, etc.) — you can inspect them, modify them, and resume execution with `continue`.

### Testing

Rails includes **Minitest** by default (`bin/rails test`). Many professional teams install **RSpec** instead — the **[Ruby: The Good Parts](/en/playbook/ruby)** playbook covers RSpec in detail, including how to test a Service Object with a mock. The same techniques apply identically inside a Rails app.

```bash
bin/rails test                    # all tests, Minitest
bin/rails test test/models/task_test.rb   # a single file
bundle exec rspec                 # if you've installed RSpec instead of Minitest
```

### `bin/dev`

Starts everything at once with a single command: the web server, the job processor (Solid Queue), and the CSS watcher, according to what's defined in `Procfile.dev`:

```bash
bin/dev
```

---

## 10. Project: Let's Build TaskFlow, a Robust Rails 8.1 App, Step by Step

### What TaskFlow Does

A small collaborative task manager:

- A user creates **Projects**
- Inside a project, they create **Tasks**
- They can **assign** a task to a colleague
- When a task is assigned, the assignee receives **an email** and the task list **updates in real time** for everyone watching the page (Turbo Streams)

### Quick commands to get started

```bash
# Rails 8 uses SQLite even in production by default, thanks to Solid Queue/Cache/Cable
rails new taskflow -d sqlite3
cd taskflow

bin/rails generate authentication  # User + login, built into Rails 8
```

### Project Structure

```
taskflow/
├── app/
│   ├── models/
│   │   ├── project.rb
│   │   ├── task.rb
│   │   └── user.rb            # generated by `generate authentication`
│   ├── controllers/
│   │   └── tasks_controller.rb
│   ├── services/
│   │   └── assign_task.rb
│   ├── mailers/
│   │   └── task_mailer.rb
│   ├── jobs/
│   │   └── (Active Job uses Solid Queue automatically)
│   ├── javascript/controllers/
│   │   └── checklist_controller.js
│   └── views/
│       ├── tasks/
│       └── task_mailer/
└── test/
    └── services/
        └── assign_task_test.rb
```

### Step 1: Models and migrations

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

### Step 2: Routes and controller

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

### Step 3: Service Object for assignment

This is the heart of the business logic: it assigns the task, sends the email, and (in Step 4) broadcasts the update in real time.

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

### Step 4: View with Turbo Frame/Stream and a Stimulus controller

```erb
<%# app/views/tasks/_task.html.erb %>
<div id="task_<%= task.id %>" class="task" data-controller="checklist">
  <span class="<%= "completed" if task.completed %>"><%= task.title %></span>

  <% if task.assigned? %>
    <small>Assigned to <%= task.assignee.name %></small>
  <% else %>
    <%= button_to "Assign to me", assign_project_task_path(task.project, task, assignee_id: current_user.id), method: :patch %>
  <% end %>

  <button data-action="click->checklist#toggle">✓</button>
</div>
```

```erb
<%# app/views/projects/show.html.erb %>
<h1><%= @project.name %></h1>

<%# automatically subscribes to updates broadcast by AssignTask %>
<%= turbo_stream_from @project %>

<div id="tasks">
  <%= render @project.tasks %>
</div>

<%= form_with model: [@project, Task.new] do |f| %>
  <%= f.text_field :title, placeholder: "New task..." %>
  <%= f.submit "Add" %>
<% end %>
```

```js
// app/javascript/controllers/checklist_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  toggle() {
    this.element.classList.toggle("checked") // just instant visual feedback, client-side only
  }
}
```

When `AssignTask` calls `broadcast_replace_to`, **every browser** that has that page open (thanks to `turbo_stream_from @project`, which uses Action Cable via Solid Cable) receives the update and replaces that task in the list — no reload, no polling, no custom JavaScript for realtime.

### Step 5: Active Job + ActionMailer

```ruby
# app/mailers/task_mailer.rb
class TaskMailer < ApplicationMailer
  def assigned(task)
    @task = task
    mail(to: task.assignee.email, subject: "You've been assigned: #{task.title}")
  end
end
```

```erb
<%# app/views/task_mailer/assigned.html.erb %>
<p>Hi <%= @task.assignee.name %>,</p>
<p>You've been assigned the task <strong><%= @task.title %></strong> in the project <%= @task.project.name %>.</p>
```

`.deliver_later` automatically enqueues the mail on Solid Queue — the background worker (`bin/jobs`, started by `bin/dev`) processes it without blocking the HTTP request.

### Step 6: Testing the Service Object

```ruby
# test/services/assign_task_test.rb
require "test_helper"

class AssignTaskTest < ActiveSupport::TestCase
  test "assigns the task and enqueues the email" do
    project = Project.create!(name: "Website", owner: users(:ada))
    task = project.tasks.create!(title: "Write the homepage")
    assignee = users(:grace)

    assert_enqueued_email_with TaskMailer, :assigned, args: [task] do
      AssignTask.call(task: task, assignee: assignee)
    end

    assert_equal assignee, task.reload.assignee
  end
end
```

> 💡 Note: the Service Object is tested **without going through an HTTP request**. No controller involved, no view rendered — just the business logic, isolated and fast to test.

### Run it and Try it

```bash
bin/rails db:prepare       # creates and migrates the database
bin/dev                    # starts server + Solid Queue worker + asset watcher

# in another terminal, or via bin/rails console:
bin/rails console
Project.create!(name: "Website", owner: User.first)
```

Open your browser at `localhost:3000`, create a task, assign it — and if you open the same page in two different tabs, you'll see the assignment appear **in both**, in real time, thanks to Turbo Streams + Solid Cable.

### Concepts Applied

| Section | Where it shows up in TaskFlow |
|---|---|
| **1. Fundamentals** | Convention over Configuration in every model (`Project`, `Task`), standard folder structure |
| **3. Modern MVC** | Partial `_task.html.erb` reused in `index` and in Turbo updates |
| **4. Hotwire** | Implicit Turbo Frame in `render @project.tasks`, Turbo Stream in `broadcast_replace_to`, Stimulus in `checklist_controller.js` |
| **5. Clean Architecture** | `AssignTask` as a Service Object, controller reduced to a few lines |
| **8. Async** | `TaskMailer.assigned(@task).deliver_later` via Solid Queue |
| **9. Tools** | `bin/rails generate`, `bin/rails console`, `bin/dev`, `bin/rails test` |

---

## 🎉 You made it!

You've completed **Ruby on Rails: Professional Applications**. Now you know:

- Why Rails exists and how "Convention over Configuration" saves you weeks of work
- When to trust conventions and when to introduce extra structure, without falling into over-engineering
- How to build reactive UIs with Hotwire (Turbo + Stimulus) without heavy JavaScript frameworks
- How to apply Service Objects, Form Objects, Query Objects, and Policy Objects to keep code clean
- The fundamentals of Domain Driven Design applied to Rails
- How to handle background jobs with Active Job and Solid Queue
- How to use `rails console`, the built-in debugger, and the other everyday tools
- How to build a complete Rails 8.1 app, with realtime, email, and tests, step by step

**Where to go from here?**

- 📖 [Rails Guides](https://guides.rubyonrails.org) — the official documentation, among the best of any framework
- 🔥 [Hotwire](https://hotwired.dev) — the official site for Turbo and Stimulus, with interactive demos
- 🚢 [Kamal](https://kamal-deploy.org) — how Rails 8 deploys to production with Docker, without complex dedicated servers
- 📜 [The Rails Doctrine](https://rubyonrails.org/doctrine) — the philosophical principles behind every Rails design decision
- 🐚 [Ruby: The Good Parts](/en/playbook/ruby) — if you haven't read it yet, go back to the basics of the language

> 🧠 **The final piece of advice**: don't copy patterns from other frameworks just because "that's how it's done elsewhere." Write Rails in the spirit of Rails: start simple, trust the conventions, and add structure only when the pain genuinely calls for it. Happy coding! 💎
