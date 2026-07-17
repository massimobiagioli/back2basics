# Fastify + TypeScript + Prisma: a stack everyone's using

**One-liner**: Fastify is a Node.js web framework built to be fast and unopinionated, TypeScript is JavaScript with a very strict spell-checker, and Prisma is the most convenient way to talk to a database without hand-writing SQL and without losing your types. Put together, they form one of the most popular backend stacks today for building solid APIs in a reasonable amount of time. This playbook starts from zero — Node.js, TypeScript's type system, Fastify's philosophy, what an ORM actually is — and ends with a complete, tested mini project, without a single `any` in the codebase.

---

## 0. Node.js in a nutshell

**One-liner**: Node.js is JavaScript running outside the browser, on the server. It's made of two pieces: the V8 engine (the same one Chrome uses) that executes JavaScript, and libuv, a C library that handles files, networking and timers without blocking everything.

The detail that changes everything: **Node is single-threaded, but it never blocks on I/O**. When you query a database or read a file, Node doesn't just sit there waiting: it hands the request off to libuv, keeps doing other things, and when the response is ready it queues it back up to be handled. This is the **event loop**.

🧠 **Analogy**: picture a single waiter in a restaurant (Node's one thread). A bad waiter takes the order at table 1, walks to the kitchen, and **stands there waiting** for the dish before moving to table 2. A good waiter (Node) takes the order at table 1, hands it to the kitchen (libuv), and **while it's cooking** immediately goes to take the order at table 2, table 3... When a dish is ready, a bell rings (callback) and he delivers it to the right table. One waiter, but it feels like everyone's being served at once.

That's why Node is excellent for **I/O-bound** workloads (lots of HTTP requests, lots of queries, lots of files) and weak for **CPU-bound** ones (heavy computation like video processing or intensive cryptography): a heavy computation actually occupies the waiter, blocking the whole restaurant until it's done.

```js
// This blocks the event loop: BAD for a server that needs to answer others too
function slowFibonacci(n) {
  if (n < 2) return n
  return slowFibonacci(n - 1) + slowFibonacci(n - 2)
}

// This does NOT block: the file read is delegated to libuv,
// Node is immediately free to handle other requests
import { readFile } from 'node:fs/promises'
const data = await readFile('config.json', 'utf-8')
```

A few more nuggets you'll need for the rest of this playbook:

- **npm / pnpm**: the package managers. `package.json` describes the project's dependencies; the examples here use **pnpm** because it's faster and more disk-efficient, but everything works identically with npm.
- **ESM vs CommonJS**: modern modules use `import`/`export` (ESM), older ones use `require`/`module.exports` (CommonJS). This playbook always uses ESM.
- **npx / pnpm dlx**: run a package without installing it globally (e.g. `pnpm dlx prisma init`).

Node alone only gives you an engine and a fairly bare `http` module. To build real APIs — routing, validation, structured error handling — you need a framework. That's where Fastify comes in.

---

## 1. TypeScript: from the basics to the advanced parts

**One-liner**: TypeScript is JavaScript plus a static type system. You write code as usual, but you declare (or let TypeScript infer) what kind of data everything is, and a compiler (`tsc`) checks that it all adds up **before** the code ever runs. At runtime, though, TypeScript disappears completely: it's "compiled" (really, just transformed) into plain JavaScript, and the types are erased. This is called **type erasure**: no types exist at runtime anymore, which means TypeScript can never protect you from data coming from outside (JSON from an HTTP request, rows from a database) — only from the code you write yourself.

🧠 **Analogy**: TypeScript is a very picky proofreader who rereads your manuscript before it goes to print. It catches the sentences that don't add up ("here you say it's a number, but three lines later you treat it like a string") and flags them in red pen. But once the book is printed (compiled to JS), the red pen disappears: the printed book no longer knows it was ever corrected — and that's fine.

### The basic types

```ts
let name: string = 'Ada'
let age: number = 36
let active: boolean = true
let tags: string[] = ['backend', 'typescript']
let pair: [string, number] = ['score', 42] // tuple: fixed length and position

// Literal types: not "any string", but exactly these values
type Role = 'admin' | 'editor' | 'viewer'
let role: Role = 'admin' // 'superadmin' would be a compile error
```

Most of the time **you don't need to annotate types**: TypeScript infers them on its own.

```ts
let score = 10 // inferred: number, no need to write it
```

### `interface` vs `type`

Both describe the "shape" of an object. The practical differences:

| | `interface` | `type` |
|---|---|---|
| Extending | `extends` | intersection with `&` |
| Reopening to add fields later | yes (declaration merging) | no |
| Unions, tuples, primitive types | no | yes |

```ts
interface User {
  id: number
  name: string
}
interface UserWithEmail extends User {
  email: string
}

type Coordinate = { lat: number; lng: number }
type Event = { type: 'click'; coord: Coordinate } | { type: 'keydown'; key: string }
```

Pragmatic rule of thumb: use `interface` for the shape of objects/public APIs, `type` when you need a union, a function alias, or a combination of types.

### Union, intersection, and "narrowing"

A **union** (`A | B`) says "it can be A or B". Until you know for sure which one, the compiler only lets you use operations valid for *both*. To narrow the type down (**narrowing**) you use runtime checks that TypeScript knows how to recognize:

```ts
function print(value: string | number) {
  if (typeof value === 'string') {
    console.log(value.toUpperCase()) // TS knows it's a string here
  } else {
    console.log(value.toFixed(2)) // and a number here
  }
}
```

The most powerful pattern for modeling alternative states is the **discriminated union**: a shared field (the "discriminant") that says which variant you're holding.

```ts
type QueryResult<T> =
  | { status: 'ok'; data: T }
  | { status: 'error'; message: string }

function handle(r: QueryResult<User>) {
  if (r.status === 'ok') {
    console.log(r.data.name) // TS knows `data` exists here
  } else {
    console.log(r.message) // and `message` here, not `data`
  }
}
```

This pattern elegantly replaces untyped exceptions for "expected" errors (see the DDD section further down).

### Generics: functions and types "with a parameter"

A **generic** is a type that takes another type as a parameter, similar to how a function takes a value as a parameter.

```ts
// Without generics you'd need a function per type, or `any` (bad!)
function first<T>(list: T[]): T | undefined {
  return list[0]
}

first([1, 2, 3])   // T inferred as number, returns number | undefined
first(['a', 'b'])  // T inferred as string, returns string | undefined

interface Repository<T> {
  find(id: number): Promise<T | null>
  save(entity: T): Promise<T>
}
// Repository<Book> and Repository<Author> are two different contracts, generated from one
```

### Utility types: transforming types you already have

TypeScript ships "functions for types" ready to use, extremely handy so you don't rewrite the same shape ten times:

```ts
interface Book {
  id: number
  title: string
  authorId: number
  published: boolean
}

type NewBook = Omit<Book, 'id'>            // everything except 'id' (for creation)
type UpdateBook = Partial<Omit<Book, 'id'>> // every field optional (for a PATCH)
type TitleOnly = Pick<Book, 'title'>        // only 'title'
type ImmutableBook = Readonly<Book>         // no field can be reassigned
type BookMap = Record<number, Book>         // { [id: number]: Book }
```

### `satisfies`: type safety's best friend

`satisfies` checks that a value matches a type **without** widening the value's type to the generic one (the way a `: Type` annotation would). The result: the compiler still warns you if the shape is wrong, but autocomplete stays precise on the actual value.

```ts
type Config = Record<string, { host: string; port: number }>

const config = {
  db: { host: 'localhost', port: 5432 },
  cache: { host: 'localhost', port: 6379 },
} satisfies Config

config.db.port // TS knows exactly that 'db' exists; with a ": Config" annotation you'd lose that
```

### Strict mode: turn it on and never look back

In `tsconfig.json`, `"strict": true` flips on a bundle of checks (including `strictNullChecks`, which forces you to explicitly handle `null`/`undefined`, and `noImplicitAny`, covered next). Without `strict`, TypeScript is far more permissive — and far less useful.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist"
  }
}
```

---

## 2. The war on `any` — avoiding it whatever it takes

**One-liner**: `any` is TypeScript's escape hatch: it tells the compiler "stop checking this variable". The problem is that `any` is **contagious**: as soon as it touches another variable, that one becomes implicitly unchecked too, and the infection spreads through the whole codebase. A project full of `any` is TypeScript in name only: at runtime you get the same surprises as plain JavaScript, plus the false confidence of "but it's typed".

```ts
// ❌ BAD: `any` disables every check, the error only explodes at runtime
function computeTotal(cart: any) {
  return cart.products.reduce((sum, p) => sum + p.price, 0)
  // if `cart.products` doesn't exist, or a `price` is a string: no warning,
  // just a crash in production
}
```

### The real alternative: `unknown`

`unknown` is `any`'s safe sibling: it accepts any value, **but won't let you use it until you verify its shape**. It's perfect at the boundaries of your system — data coming from `JSON.parse`, from an HTTP request body, from an untyped library.

```ts
// ✅ GOOD: unknown forces you to validate before using
function computeTotal(cart: unknown) {
  if (!isCart(cart)) {
    throw new Error('Invalid cart payload')
  }
  // from here on, cart is typed as Cart
  return cart.products.reduce((sum, p) => sum + p.price, 0)
}

interface Product { price: number }
interface Cart { products: Product[] }

function isCart(v: unknown): v is Cart {
  return (
    typeof v === 'object' && v !== null &&
    Array.isArray((v as Cart).products)
  )
}
```

Hand-writing a type guard for every payload is tedious and easy to get wrong. In practice you use a **runtime** validation library that, from a single schema, gives you both validation and the derived TypeScript type — [Zod](https://zod.dev) is the most widely used:

```ts
import { z } from 'zod'

const ProductSchema = z.object({ price: z.number().positive() })
const CartSchema = z.object({ products: z.array(ProductSchema) })

type Cart = z.infer<typeof CartSchema> // the TS type is born from the schema, zero duplication

function computeTotal(payload: unknown) {
  const cart = CartSchema.parse(payload) // throws if invalid, otherwise typed
  return cart.products.reduce((sum, p) => sum + p.price, 0)
}
```

This pattern — **validate at the boundaries, trust on the inside** — is the correct way to bridge "the outside world, which always lies" with "the inside world, typed and trustworthy". You'll see it again further down when Fastify validates request payloads.

### Where `any` sneaks in (and how to shut it out)

| Situation | Why `any` shows up | What to do |
|---|---|---|
| `JSON.parse(str)` | its return type is `any` by definition | validate with Zod right after |
| Untyped library | `require`/`import` with no `@types/...` | write a minimal `.d.ts` declaration, or wrap it behind a typed wrapper |
| Catching an exception | `catch (e)` → `e` is `unknown` in strict mode (good!), but often gets annotated `any` out of laziness | use `e instanceof Error` before reading `e.message` |
| Quick refactor | "I'll fix it later" | don't: `unknown` + narrowing costs 30 extra seconds, today |

Finally, two switches that make it nearly impossible to introduce `any` by accident:

```json
{ "compilerOptions": { "noImplicitAny": true } }
```

```jsonc
// .eslintrc — forbids explicit `any`, even when someone writes it on purpose
{ "rules": { "@typescript-eslint/no-explicit-any": "error" } }
```

`noImplicitAny` (included in `strict`) blocks the cases where TypeScript *can't infer* a type and would silently fall back to `any`. The ESLint rule blocks whoever writes `any` deliberately. Together, they cover whatever it takes.

---

## 3. Fastify: philosophy and the plugin architecture

**One-liner**: Fastify was created in 2016 by Matteo Collina and Tomas Della Vedova with a stated goal: be the fastest possible Node framework **without** sacrificing developer experience or safety. The two core ideas are: **everything is validated and serialized through a schema** (for speed and safety), and **everything is a plugin, encapsulated** (for structure and maintainability). These aren't implementation details: they're the reason Fastify "feels" different from Express.

### Why "schema-first", not just "it's faster than Express"

Express validates (if you bother) with imperative code scattered across middleware, and serializes responses with generic `JSON.stringify`. Fastify asks you to declare a **JSON schema** for each route's request and response. From that schema, Fastify:

1. **validates** incoming input with [Ajv](https://ajv.js.org/) (compiled, not re-interpreted every time);
2. **compiles a custom serializer** for the output with [`fast-json-stringify`](https://github.com/fastify/fast-json-stringify), which is much faster than `JSON.stringify` precisely because it already knows the exact shape of the object and doesn't have to "discover" it at runtime.

```ts
const opts = {
  schema: {
    body: {
      type: 'object',
      required: ['title'],
      properties: { title: { type: 'string' }, year: { type: 'number' } },
    },
    response: {
      200: {
        type: 'object',
        properties: { id: { type: 'number' }, title: { type: 'string' } },
      },
    },
  },
}

fastify.post('/books', opts, async (request, reply) => {
  // request.body is already validated against the schema
  return { id: 1, title: request.body.title }
})
```

🧠 **Analogy**: Express hands you a toolbox, and you write checks by hand every time ("is it a string? is it present?") — like eyeballing every package in a warehouse. Fastify asks you to describe the package's "spec sheet" once (the schema), then runs it through a machine that scans and packs automatically, much faster and without mistakes — because the machine was **calibrated to that specific spec**, not to a generic package.

This is also where it connects back to the previous section: if you describe the schema with Zod instead of raw JSON Schema, and use [`fastify-type-provider-zod`](https://github.com/turkerdev/fastify-type-provider-zod), `request.body` is **automatically typed in TypeScript** from the very same schema that validates it at runtime — one single place, zero `any`, zero duplication between "the type" and "the validation".

### Everything is a plugin: encapsulation

The other core idea: **every `register()` creates an isolated context**. Decorators, hooks and routes defined inside a plugin don't "bubble up" to the outside unless you explicitly ask them to. This is the opposite of Express, where everything lives on one single global app object.

🧠 **Analogy**: think of Russian nesting dolls. Each doll can see and use what's **inside itself or in its parent dolls**, but it can't see into sibling dolls at the same level, unless someone deliberately takes something out and hands it around. A plugin that decorates `fastify.bookService` doesn't make it visible to a sibling plugin registered next to it — it stays sealed inside its own doll.

```ts
import Fastify from 'fastify'

const app = Fastify({ logger: true })

app.register(async function booksPlugin(fastify) {
  fastify.decorate('bookService', createBookService())
  fastify.get('/books', async () => fastify.bookService.allBooks())
})

app.register(async function authorsPlugin(fastify) {
  // fastify.bookService does NOT exist here: encapsulation respected
  fastify.get('/authors', async () => [])
})
```

When you *really* want something to cross those boundaries (e.g. a Prisma client shared across the whole app), you declare it explicitly with [`fastify-plugin`](https://github.com/fastify/fastify-plugin), which tells Fastify "don't encapsulate this, let it bubble up":

```ts
import fp from 'fastify-plugin'
import { PrismaClient } from '@prisma/client'

export default fp(async function prismaPlugin(fastify) {
  const prisma = new PrismaClient()
  fastify.decorate('prisma', prisma)
  fastify.addHook('onClose', async (instance) => {
    await instance.prisma.$disconnect()
  })
})
```

### Hooks: the request lifecycle

Fastify exposes precise hook points along every request's lifecycle, instead of Express's generic "before or after" middleware:

```
onRequest → preParsing → preValidation → preHandler → [ handler ] → preSerialization → onSend → onResponse
```

```ts
fastify.addHook('onRequest', async (request, reply) => {
  request.log.info({ url: request.url }, 'incoming request')
})

fastify.addHook('preHandler', async (request, reply) => {
  if (!request.headers.authorization) {
    reply.code(401).send({ error: 'Not authenticated' })
  }
})
```

### Autoload: structuring many plugins without going crazy

As the app grows, manually registering dozens of `app.register(...)` calls gets fragile. [`@fastify/autoload`](https://github.com/fastify/fastify-autoload) automatically loads all plugins in a folder, respecting the folder structure as an encapsulation hierarchy — you'll use it in the mini project.

**Sources to go deeper on the philosophy**, straight from the people who designed it: Matteo Collina's talks and articles on fastify.dev/docs, his blog on nodeland.dev, and his various "Node.js and the Art of Performance" talks and Node.js conf editions on schema-based validation — the common thread is always the same: **measure, don't guess**, and **let the schema do the heavy lifting**.

---

## 4. Yet another ORM? Pros and cons, then how Prisma actually works

**One-liner**: an **ORM** (Object-Relational Mapper) translates rows from SQL tables into objects in your language, and back. It's a debate as old as backend development itself: "it's convenient" versus "it hides too much". The pragmatic answer is: it depends on the problem, and Prisma has changed the terms of that debate quite a bit compared to "classic" ORMs.

### Pros and cons, honestly

| Pros | Cons |
|---|---|
| No repetitive hand-written SQL for standard CRUD | Very complex queries (reports, analytics) stay clearer in raw SQL |
| Autocomplete and types: safe refactoring | One abstraction too many can hide costly N+1 queries |
| Versioned, reproducible migrations | A "magic" ORM can generate inefficient SQL if you don't understand what's underneath |
| Portability across databases (partially) | Never full portability: database-specific features stay database-specific |
| Fewer accidental SQL injections (parameterized queries by default) | Still one more layer to learn, on top of SQL you still need to know |

The pragmatic takeaway: **an ORM doesn't exempt you from knowing SQL**, it just saves you from hand-writing it for 80% of the boring, repetitive cases, leaving you energy for the 20% that truly deserves manual attention.

### How Prisma actually works

Prisma isn't "just an ORM" in the classic sense (no Active Record, no Entity classes with `.save()` methods): it's a set of three pieces built around a single source of truth, the `schema.prisma` file.

```prisma
// schema.prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Author {
  id     Int    @id @default(autoincrement())
  name   String
  books  Book[]            // 1-N relation: one author has many books
}

model Book {
  id        Int      @id @default(autoincrement())
  title     String
  year      Int?
  author    Author   @relation(fields: [authorId], references: [id])
  authorId  Int
  tags      Tag[]    @relation("BookTag")   // N-N relation via an implicit join table
}

model Tag {
  id     Int     @id @default(autoincrement())
  name   String  @unique
  books  Book[]  @relation("BookTag")
}
```

From this single file, three things are born:

1. **The Prisma Client**, generated with `prisma generate`: a TypeScript library tailored to *your* schema, fully typed — `prisma.book.findMany()` already knows every row has `title: string` and `year: number | null`, without you writing an interface by hand.
2. **Migrations**, managed with `prisma migrate dev`: every time you change the schema, Prisma computes the diff, generates a versioned SQL file under `prisma/migrations/`, and applies it to the dev database. In production you use `prisma migrate deploy`, which only applies migrations that already exist, never generating new ones — no magic in production, ever.
3. **The query engine**, a binary written in Rust that receives structured requests from the Node client and translates them into SQL optimized for whichever database you're actually using.

```ts
// Relations: read an author together with all their books, in one query
const author = await prisma.author.findUnique({
  where: { id: 1 },
  include: { books: true },
})

// Create a book linked to an existing author
await prisma.book.create({
  data: { title: 'Neuromancer', authorId: 1 },
})

// Transaction: either both operations succeed, or neither does
await prisma.$transaction([
  prisma.author.update({ where: { id: 1 }, data: { name: 'W. Gibson' } }),
  prisma.book.updateMany({ where: { authorId: 1 }, data: { year: 1984 } }),
])
```

### Prisma versus the alternatives, briefly

| Tool | Abstraction level | When it makes sense |
|---|---|---|
| Raw SQL (`pg`, native driver) | zero abstraction | very specific queries, maximum performance, teams already fluent in SQL |
| Query builder (Kysely, Knex) | build SQL with a typed API, stay close to the engine | you want types but not "an ORM" sitting on top of your head |
| Prisma | declarative schema, generated client, migrations included | the majority of CRUD-centric APIs, teams that want development speed |
| "Active" ORMs (TypeORM, Sequelize) | objects with their own methods (Active Record) | style preference, often more implicit magic |

---

## 5. DDD in Fastify, staying simple — Clean Code, Clean Architecture

**One-liner**: textbook Domain-Driven Design (aggregate roots, value objects, bounded contexts, event storming...) exists for huge, complex domains, with teams of dozens of people. Most APIs we write aren't that. What's worth keeping from DDD, even in a small project, is **one single thing**: separating "what the business is about" from "how it arrives over HTTP" and from "how it's stored on disk". Three layers, not thirty.

```
src/
  modules/
    books/
      books.routes.ts       # HTTP layer: receives the request, calls the service, responds
      books.service.ts      # domain layer: business rules, in plain TS
      books.repository.ts   # data layer: talks to Prisma, and ONLY this file talks to Prisma
      books.schema.ts       # validation schema + types (Zod), shared by the three above
```

🧠 **Analogy**: think of a restaurant. The waiter (routes) takes the order and brings it to the customer — they don't decide what can be cooked. The chef (service) decides the recipes and the rules ("no gluten if the customer is allergic") — they don't know whether the order came by phone or in person. The stockroom keeper (repository) knows where the ingredients are in the pantry — but doesn't decide the dishes. Each does exactly one job, and you can change any one of them without touching the other two (e.g. swap databases without touching the business rules).

```ts
// books.repository.ts — ONLY this file talks to Prisma
export function createBooksRepository(prisma: PrismaClient) {
  return {
    find: (id: number) => prisma.book.findUnique({ where: { id } }),
    createBook: (data: NewBook) => prisma.book.create({ data }),
  }
}

// books.service.ts — domain rules, in plain TS, with no knowledge that HTTP exists
export function createBooksService(repo: ReturnType<typeof createBooksRepository>) {
  return {
    async publish(data: NewBook) {
      if (data.year && data.year > new Date().getFullYear()) {
        throw new DomainError('A book cannot be published in the future')
      }
      return repo.createBook(data)
    },
  }
}

// Explicit domain error, not a generic `throw new Error(...)`
export class DomainError extends Error {}
```

```ts
// books.routes.ts — HTTP layer ONLY: translates request/response, knows no rules
export default async function booksRoutes(fastify: FastifyInstance) {
  const service = createBooksService(createBooksRepository(fastify.prisma))

  fastify.post('/books', { schema: { body: NewBookSchema } }, async (request, reply) => {
    try {
      const book = await service.publish(request.body)
      reply.code(201).send(book)
    } catch (e) {
      if (e instanceof DomainError) return reply.code(422).send({ error: e.message })
      throw e
    }
  })
}
```

This is **Clean Architecture stripped to the bone**: dependencies point inward (routes depend on the service, the service does NOT depend on Fastify), the "core" of the domain (`books.service.ts`) is testable without spinning up an HTTP server or a real database, and every file has exactly one reason to change (single responsibility, the first of Clean Code's principles).

**When you actually need "heavy" DDD**: a domain with intricate rules shared across multiple modules, several teams working on the same domain with different languages (a real bounded context), business logic that outlives multiple interfaces (HTTP today, a worker tomorrow, gRPC the day after). If your case is "CRUD with a handful of rules", the three layers above are more than enough.

---

## 6. Pragmatism, pragmatism!

**One-liner**: the most common trap for anyone who just learned patterns and principles (including everything you've read so far in this playbook) is applying them **everywhere, always, from day one**. Don't. The golden rules:

- **YAGNI** ("You Aren't Gonna Need It"): don't build the abstraction for tomorrow's hypothetical case. Build it the day tomorrow's case becomes today's case.
- **The rule of three**: duplicate a small thing twice, guilt-free. Only on the third repetition, extract the abstraction — by then you actually know *which* abstraction is needed, instead of guessing.
- **Boring code is good code**: a clear `if` beats a clever pattern that the next person (or you, in six months) has to decode.
- **Not every route deserves three layers**: a one-line health-check endpoint (`fastify.get('/health', ...)`) doesn't need a repository and a service. The three layers are for **domain logic worth protecting**, not for aesthetic consistency everywhere.
- **Refactor when it hurts, not before**: the signal to extract an abstraction is real pain (a repeated bug, a change that touches five files), not the abstract feeling that "this should be done properly".

In one line: the tools in this playbook (types, schemas, plugins, domain layers) exist to **reduce** complexity you already have, not to add a new one for decoration.

---

## 7. Testing: `node:test`, mocking dependencies, batteries included

**One-liner**: since Node 18+, the `node:test` module ships **built into the runtime**, together with `node:assert/strict` for assertions and `node:test`'s `mock` for mocking functions and methods. No Jest, no Mocha, no Sinon to install: zero extra dependencies to test this entire stack.

### The basics

```ts
// books.service.test.ts
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createBooksService, DomainError } from './books.service.ts'

describe('books.service', () => {
  it('rejects a book with a year in the future', async () => {
    const fakeRepo = { createBook: async () => { throw new Error('should not get here') } }
    const service = createBooksService(fakeRepo as any) // `as any` is fine here: it's a minimal test double

    await assert.rejects(
      () => service.publish({ title: 'X', authorId: 1, year: 3000 }),
      DomainError,
    )
  })
})
```

```bash
node --test src/**/*.test.ts   # with a TS loader like tsx, or after compiling
```

### Mocking dependencies without external libraries

`node:test` exposes `mock.fn()` to create fake functions with call assertions, and `mock.method()` to temporarily replace a method on a real object, automatically restored at the end of the test.

```ts
import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'

describe('books.service with a mocked repository', () => {
  it('saves the book passing the correct data to the repository', async () => {
    const createBookMock = mock.fn(async (data) => ({ id: 1, ...data }))
    const fakeRepo = { createBook: createBookMock }

    const service = createBooksService(fakeRepo as any)
    const result = await service.publish({ title: 'Dune', authorId: 2 })

    assert.equal(createBookMock.mock.calls.length, 1)
    assert.deepEqual(createBookMock.mock.calls[0].arguments[0], { title: 'Dune', authorId: 2 })
    assert.equal(result.id, 1)
  })
})
```

This is the whole point of the DDD section above: because `books.service.ts` knows nothing about Prisma or Fastify, testing it just means passing a **fake object** in place of the repository — no real database, no server listening, tests that run in milliseconds.

### Testing Fastify routes without a running server

Fastify offers `app.inject()`: it simulates an HTTP request **without actually opening a network port**. No need for `supertest`, no need to start/stop a server in your tests.

```ts
import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { buildApp } from '../app.ts'

describe('POST /books', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  before(async () => { app = await buildApp({ logger: false }) })
  after(async () => { await app.close() })

  it('creates a book and responds 201', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/books',
      payload: { title: 'Foundation', authorId: 1 },
    })

    assert.equal(response.statusCode, 201)
    assert.equal(response.json().title, 'Foundation')
  })

  it('rejects a payload without a title with 400', async () => {
    const response = await app.inject({ method: 'POST', url: '/books', payload: {} })
    assert.equal(response.statusCode, 400) // schema validation, for free
  })
})
```

Notice the last test: you didn't write that 400 validation yourself — it comes **for free** from the schema you already declared in Fastify, another point in favor of the schema-first approach from section 3.

---

## 8. A complete mini project, step by step

Let's build a small **bookshelf API**: `Author` and `Book` in a 1-N relation, Fastify + TypeScript + Prisma + SQLite, three layers as in the DDD section, tests with `node:test`. Zero `any`.

### Step 1 — Setup

```bash
mkdir bookshelf-api && cd bookshelf-api
pnpm init
pnpm add fastify @fastify/autoload fastify-plugin zod fastify-type-provider-zod pino-pretty
pnpm add -D typescript tsx @types/node prisma
pnpm dlx tsc --init
```

### Step 2 — `tsconfig.json` in strict mode

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["src"]
}
```

### Step 3 — Prisma schema and first migration

```bash
pnpm dlx prisma init --datasource-provider sqlite
```

```prisma
// prisma/schema.prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Author {
  id    Int    @id @default(autoincrement())
  name  String
  books Book[]
}

model Book {
  id       Int    @id @default(autoincrement())
  title    String
  year     Int?
  author   Author @relation(fields: [authorId], references: [id])
  authorId Int
}
```

```bash
pnpm dlx prisma migrate dev --name init   # creates prisma/migrations/..., updates the DB, regenerates the Client
```

### Step 4 — Folder structure

```
src/
  app.ts
  server.ts
  plugins/
    prisma.ts
  modules/
    books/
      books.schema.ts
      books.repository.ts
      books.service.ts
      books.routes.ts
      books.service.test.ts
      books.routes.test.ts
```

### Step 5 — The Prisma plugin, shared across the whole app

```ts
// src/plugins/prisma.ts
import fp from 'fastify-plugin'
import { PrismaClient } from '@prisma/client'
import type { FastifyInstance } from 'fastify'

declare module 'fastify' {
  interface FastifyInstance { prisma: PrismaClient }
}

export default fp(async function prismaPlugin(fastify: FastifyInstance) {
  const prisma = new PrismaClient()
  fastify.decorate('prisma', prisma)
  fastify.addHook('onClose', async (instance) => {
    await instance.prisma.$disconnect()
  })
})
```

Notice the `declare module 'fastify'` block: that's how you tell TypeScript that `fastify.prisma` exists — without it, `fastify.prisma` would be a type error (or, worse, an implicit `any`).

### Step 6 — Validation schema with Zod (no `any`, ever)

```ts
// src/modules/books/books.schema.ts
import { z } from 'zod'

export const NewBookSchema = z.object({
  title: z.string().min(1),
  year: z.number().int().optional(),
  authorId: z.number().int(),
})
export type NewBook = z.infer<typeof NewBookSchema>

export const BookSchema = NewBookSchema.extend({ id: z.number().int() })
```

### Step 7 — Repository, service, routes

```ts
// src/modules/books/books.repository.ts
import type { PrismaClient } from '@prisma/client'
import type { NewBook } from './books.schema.ts'

export function createBooksRepository(prisma: PrismaClient) {
  return {
    all: () => prisma.book.findMany(),
    find: (id: number) => prisma.book.findUnique({ where: { id } }),
    create: (data: NewBook) => prisma.book.create({ data }),
  }
}
export type BooksRepository = ReturnType<typeof createBooksRepository>
```

```ts
// src/modules/books/books.service.ts
import type { BooksRepository } from './books.repository.ts'
import type { NewBook } from './books.schema.ts'

export class DomainError extends Error {}

export function createBooksService(repo: BooksRepository) {
  return {
    list: () => repo.all(),
    async publish(data: NewBook) {
      if (data.year && data.year > new Date().getFullYear()) {
        throw new DomainError('A book cannot be published in the future')
      }
      return repo.create(data)
    },
  }
}
```

```ts
// src/modules/books/books.routes.ts
import type { FastifyInstance } from 'fastify'
import { NewBookSchema } from './books.schema.ts'
import { createBooksRepository } from './books.repository.ts'
import { createBooksService, DomainError } from './books.service.ts'

export default async function booksRoutes(fastify: FastifyInstance) {
  const service = createBooksService(createBooksRepository(fastify.prisma))

  fastify.get('/books', async () => service.list())

  fastify.post('/books', {
    schema: { body: NewBookSchema },
  }, async (request, reply) => {
    try {
      const book = await service.publish(request.body)
      reply.code(201).send(book)
    } catch (e) {
      if (e instanceof DomainError) return reply.code(422).send({ error: e.message })
      throw e
    }
  })
}
```

### Step 8 — `app.ts`: wiring everything together with autoload

```ts
// src/app.ts
import Fastify, { type FastifyBaseLogger } from 'fastify'
import AutoLoad from '@fastify/autoload'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export async function buildApp(opts: { logger: boolean }) {
  const app = Fastify({ logger: opts.logger })

  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  await app.register(AutoLoad, { dir: path.join(__dirname, 'plugins') })
  await app.register(booksRoutesLoader)

  return app
}

async function booksRoutesLoader(fastify: Awaited<ReturnType<typeof Fastify>>) {
  const { default: booksRoutes } = await import('./modules/books/books.routes.ts')
  fastify.register(booksRoutes)
}
```

```ts
// src/server.ts
import { buildApp } from './app.ts'

const app = await buildApp({ logger: true })

app.listen({ port: 3000 }, (err) => {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
})
```

### Step 9 — The tests

```ts
// src/modules/books/books.service.test.ts
import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'
import { createBooksService, DomainError } from './books.service.ts'
import type { BooksRepository } from './books.repository.ts'

describe('books.service', () => {
  it('rejects future years', async () => {
    const repo = { create: mock.fn(), all: mock.fn(), find: mock.fn() } as unknown as BooksRepository
    const service = createBooksService(repo)

    await assert.rejects(
      () => service.publish({ title: 'X', authorId: 1, year: 3000 }),
      DomainError,
    )
    assert.equal((repo.create as ReturnType<typeof mock.fn>).mock.calls.length, 0)
  })

  it('publishes a valid book', async () => {
    const createMock = mock.fn(async (data) => ({ id: 1, ...data }))
    const repo = { create: createMock, all: mock.fn(), find: mock.fn() } as unknown as BooksRepository
    const service = createBooksService(repo)

    const result = await service.publish({ title: 'Dune', authorId: 2 })
    assert.equal(result.id, 1)
  })
})
```

```ts
// src/modules/books/books.routes.test.ts
import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { buildApp } from '../../app.ts'

describe('POST /books', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  before(async () => { app = await buildApp({ logger: false }) })
  after(async () => { await app.close() })

  it('responds 400 if the title is missing', async () => {
    const res = await app.inject({ method: 'POST', url: '/books', payload: { authorId: 1 } })
    assert.equal(res.statusCode, 400)
  })
})
```

```bash
node --import tsx --test src/**/*.test.ts
```

### Step 10 — Run it and try it

```bash
pnpm tsx src/server.ts
```

```bash
curl -X POST http://localhost:3000/books \
  -H 'content-type: application/json' \
  -d '{"title": "Neuromancer", "authorId": 1}'
# 201 { "id": 1, "title": "Neuromancer", "authorId": 1 }

curl -X POST http://localhost:3000/books \
  -H 'content-type: application/json' \
  -d '{"authorId": 1}'
# 400: "title" is missing from the body, schema validation blocks it before it even reaches the service
```

From here, the natural next steps are: add an `authors` module with the same three-layer structure, add authentication with a `preHandler` hook, and move `DATABASE_URL` from SQLite to Postgres by changing only the `provider` in `schema.prisma` — the rest of the application code doesn't notice the difference.

---

## Summary

| Concept | Problem it solves | Analogy |
|---|---|---|
| Node's event loop | doing lots of I/O without blocking everything with a single thread | a waiter who never stands frozen in the kitchen |
| TypeScript's types | catching errors at compile time instead of in production | a picky proofreader, who disappears at print time |
| `unknown` + narrowing / Zod | validating what comes from outside without switching off checks with `any` | inspecting the package before opening it, never trusting it sight unseen |
| Fastify: schema-first | fast validation and serialization, custom-compiled | a machine calibrated to the package's spec sheet, not an eyeball check |
| Fastify: encapsulated plugins | clear structure, no global state leaking everywhere | Russian nesting dolls: you see inward and upward, never sideways |
| Prisma: schema.prisma | one single source of truth for a typed client plus migrations | a house's blueprint, from which both custom furniture and renovation work are derived |
| Three layers (routes/service/repository) | separating HTTP, business rules and data access | a waiter, a chef and a stockroom keeper: one job each |
| `node:test` + mock | fast tests, no extra dependencies, no real server or database | rehearsing the chef's recipe without opening the restaurant |

This stack isn't popular by accident: Node handles the I/O-heavy load typical of APIs well, TypeScript removes an entire class of bugs before a single line even runs, Fastify turns validation into speed instead of overhead, and Prisma makes migrations a boring detail instead of a nightmare. Put together with pragmatism — three layers when they're needed, not always; tests that mock only what's necessary — it's a stack you can build fast with, without building badly.
