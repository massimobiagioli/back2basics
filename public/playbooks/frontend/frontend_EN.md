# React, Angular, Vue for Backenders Who Live in a Terminal

You've spent an entire career inside a terminal. You know every `curl` flag by heart, you write SQL queries faster than most people write an email, and you have an extremely strong opinion about tabs vs. spaces that you'd defend in court. Then someone asks you to "touch the frontend a bit" and your face does the same thing it does when someone asks you to do math in Excel.

You're not allergic to frontend. You're allergic to how it's been explained to you so far: tutorials full of meaningless `<div>`s, "magic" that updates the screen without telling you why, and online communities that assume you already know what a DOM is. This playbook starts from the opposite assumption: **you already know exactly what state is, what a pure function is, what an event loop is, what a cache is, what a dependency graph is**. You just need to discover that React, Vue, and Angular are, underneath, the same concepts you already master, with a different name and a visual output instead of a textual one.

By the end of this playbook you won't just understand the three most widely used frameworks for building interfaces in the world: you'll probably fall in love with one of them. Let's start with the two things you need so you don't feel lost in the following chapters: what HTML actually is, and what a "component" actually is.

---

## 0. The crash course for people who hate HTML

**One-liner**: HTML isn't "designer stuff." It's simply a tree-shaped data format, exactly like JSON or an AST, just with different syntax and one special meaning for the browser: that tree gets *drawn*.

### HTML is just a tree of nodes

If you've ever written code that walks an AST (Abstract Syntax Tree) — the kind of structure a parser produces from source code — you've already understood HTML. Every tag is a node, every node can have children, and the browser walks that tree and draws every node on screen according to precise rules (the same rules that make CSS "predictable," not magic — if you don't know them yet, check out the **CSS for Backenders** playbook).

```html
<div>                    <!-- node: generic container -->
  <h1>Title</h1>         <!-- child node: heading -->
  <p>A paragraph</p>     <!-- child node: text -->
</div>
```

is conceptually identical to:

```json
{
  "tag": "div",
  "children": [
    { "tag": "h1", "text": "Title" },
    { "tag": "p", "text": "A paragraph" }
  ]
}
```

That structure, once the browser loads it into memory, is called the **DOM** (Document Object Model): it is literally the object — the navigable, runtime-mutable tree — that represents the page. Every time you hear "manipulate the DOM," it means "modify this in-memory tree," exactly like you'd modify a parsed JSON tree in any language.

### What "framework" gives you that plain HTML doesn't

With plain HTML, to change what you see on screen you have to manipulate that tree by hand, node by node (`document.createElement`, `.appendChild`, `.textContent = ...`). It works, but it quickly becomes unsustainable: it's like building an HTTP response by concatenating strings by hand instead of using a template engine.

A frontend framework (React, Vue, Angular) does exactly what a **server-side template engine** would do (think Jinja for Python, ERB for Ruby, ASP.NET Razor), with one crucial difference: instead of generating HTML *once* when an HTTP request comes in and then disappearing, the framework stays alive in the browser and **regenerates** the pieces of the tree that need to change, every time a piece of data changes — without reloading the page. This ongoing "regenerate the right pieces when data changes" is called **reactivity**, and it's the actual superpower you're about to learn to wield in three different flavors.

### What a "component" is

A component is, without any frills, **a function that takes some data as input and returns a piece of HTML tree**. That's it, nothing more complicated than this:

```
Component = f(state, props) → HTML tree
```

Exactly like a pure function in a backend language takes arguments and returns a value, a component takes "state" (its own internal data) and "props" (data passed down from the parent, like a function's parameters) and returns what to draw. Every framework in this playbook implements this idea slightly differently — and that difference, more than anything else, is what truly sets them apart.

> 💡 **The insight that unlocks everything**: if you've already understood "pure function that takes input and produces output," you've already understood 70% of React, Vue, and Angular. The remaining 30% is: *when* and *how* that function gets called again when the data changes. That's exactly where the three frameworks differ, and exactly where we'll focus for each of them.

---
## 1. React 19 — a pure function that redraws the world every time you change your mind

**In a nutshell**: React isn't a template language like Jinja or ERB, but it's also not a fine-grained reactive system like Vue or Angular. It's a library that makes you write your UI as a **pure function**: you feed it state, it hands back a tree of elements (JSX). Change the state, the function gets called again, and React figures out *on its own* the minimal set of changes to apply to the real DOM. No magic, just an algorithmic diff — the same trade `git diff` does, just on a tree instead of text.

### Philosophy: UI as a pure function of state

If you've ever written a function that takes a dict of data and spits out an HTML string — a Flask endpoint with `render_template`, an ERB script, a report generated from a Jinja template — you already understand 90% of React. The one difference: instead of regenerating the whole HTML and overwriting everything each time (expensive, and you'd lose form state, scroll position, focus), React keeps a "previous" copy of the tree, computes the "new" one, diffs them, and touches **only the nodes that actually changed** in the real DOM.

```tsx
// A React component is, literally, a function: state in, tree out
function Counter() {
  const [count, setCount] = useState(0); // the "state" — data that can change

  return (
    <button onClick={() => setCount(count + 1)}>
      You clicked {count} times
    </button>
  );
}
```

There's no hidden event loop to memorize, no magic "watcher". `setCount` tells React "hey, re-render". React calls `Counter()` again, gets a new JSX tree, compares it to the previous one, and updates only the text inside `<button>`. That's it.

### What's new (in two lines)

React 19 (stable since December 2024) adds **Actions** (`useActionState`, `useOptimistic`) for handling forms and mutations without hand-rolling loading/error state, the `use()` hook for reading a Promise or Context conditionally (even inside an `if`, which was impossible with the other hooks), and **ref-as-a-prop**: you can now pass `ref` like any other prop, no more `forwardRef` for most cases. Server Components exist, but they're a framework-level concept (Next.js) — with plain Vite you won't see them, and that's perfectly fine.

### How to structure a project

The pragmatic default for a plain SPA, no frills:

```bash
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install
npm run dev
```

This gives you: a fast bundler (esbuild + Rollup), TypeScript ready to go, hot reload. Nothing else. Typical layout:

```
my-app/
├── src/
│   ├── components/     # reusable UI components
│   ├── hooks/          # custom hooks (reusable logic)
│   ├── api/            # backend calls, TanStack queries
│   ├── App.tsx
│   └── main.tsx         # entry point, mounts the app into the DOM
├── index.html
├── vite.config.ts
└── package.json
```

> 💡 **When NOT to use plain Vite**: if you need SSR, file-based routing, or "free" static generation, then sure, consider Next.js. But that's a real jump in complexity — don't start there "because everyone does". Start with Vite, and migrate only if you actually need it.

### The pragmatic approach: what you DON'T need

| Thing | Why you can skip it (for now) |
|---|---|
| Redux | Heavy boilerplate for most projects. Zustand covers 90% of cases with a tenth of the code. |
| Next.js by default | It's a framework with SSR, file-based routing, and lots of conventions. Only reach for it if you explicitly need SSR/SEO/built-in routing. |
| `forwardRef` everywhere | With React 19, `ref` is just a regular prop in most cases. |
| Class Components | Legacy. Hooks fully replaced them starting in 2019. If you see `class extends React.Component`, it's old code. |
| A state manager "just because" | If your state is local to one or two components, `useState` is enough. Don't install Zustand/Redux out of habit. |

### State: where do I put it?

Think of state like variable scoping in a language with block scope: **start with the narrowest scope possible**, and widen it only when you genuinely need to share it.

```tsx
// Local state — lives and dies with the component, like a local variable in a function
function SearchBox() {
  const [query, setQuery] = useState('');
  return <input value={query} onChange={e => setQuery(e.target.value)} />;
}
```

For more complex state with well-defined transitions, `useReducer` is your miniature state machine (exactly like a `match` over an enum of states):

```tsx
type State = { status: 'idle' | 'loading' | 'done'; data?: string };
type Action = { type: 'FETCH' } | { type: 'SUCCESS'; payload: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'FETCH':   return { status: 'loading' };
    case 'SUCCESS': return { status: 'done', data: action.payload };
  }
}

const [state, dispatch] = useReducer(reducer, { status: 'idle' });
```

**Context**, for sharing something across several levels of depth without manually threading props ("prop drilling"):

```tsx
const ThemeContext = createContext<'light' | 'dark'>('light');

function App() {
  return (
    <ThemeContext value="dark">   {/* React 19: no more .Provider */}
      <Dashboard />
    </ThemeContext>
  );
}

function Dashboard() {
  const theme = use(ThemeContext); // reads the value, anywhere in the tree
  return <div className={theme}>...</div>;
}
```

> ❌ **Context is NOT a state manager.** It's dependency injection for values — like a DI container resolving a dependency along the call chain instead of threading it parameter by parameter. But it has a specific cost: **when the value changes, ALL consumers re-render**, even the ones that only use a tiny slice of that value. Use it for things that change rarely (theme, logged-in user, locale), not for state that changes on every keystroke.

For global/shared state that changes often, **Zustand** is the modern pragmatic default: no Provider nesting, no action/reducer/dispatch boilerplate, just a plain store with a hook:

```tsx
import { create } from 'zustand';

interface CartStore {
  items: string[];
  addItem: (item: string) => void;
}

const useCartStore = create<CartStore>((set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
}));

// In any component, no Provider, no wrapper:
function CartBadge() {
  const items = useCartStore((state) => state.items);
  return <span>{items.length} items</span>;
}
```

| Tool | When to use it |
|---|---|
| `useState` / `useReducer` | State local to one component (or its direct subtree) |
| Context | Values that change rarely, shared deep in the tree (theme, auth, i18n) |
| **Zustand** | Global/shared state that changes often — the pragmatic default |
| Redux Toolkit | Only if your org already uses it everywhere — don't start here on a new project |
| Jotai | An "atomic" alternative to Zustand — worth knowing if you'd rather compose many small independent bits of state than one big store |

### Reactivity explained simply

This is the part you need to fully internalize, because it's **different** from how Vue or Angular work, and that difference explains everything else.

Vue/Angular track dependencies at a fine grain, like a spreadsheet: you change cell A1, and only the cells that depend on A1 recompute. React **does not do this**. React has a much blunter, and much more predictable, model:

> 🧠 **The mantra**: a React component is a pure function. State in, JSX tree out. When state changes, React **calls the entire function again from scratch**, gets the new tree, and compares it (*diffing*) against the previous one (*reconciliation*). Only the differences get applied to the real DOM.

Think of a server-side templating engine like Jinja or ERB: every HTTP request regenerates the entire page's HTML from scratch, starting from the template and the data. The server doesn't "track" which variables changed — it just re-runs the whole template every time. React does the same thing, but instead of throwing away the old HTML and replacing it wholesale (expensive, and you'd lose focus/scroll/form state), it keeps an in-memory representation of the previous tree (the "Virtual DOM") and computes a **minimal patch** to apply to the real DOM.

```tsx
function Profile({ name }: { name: string }) {
  console.log('Profile is running again!'); // this prints on EVERY render, not only when `name` changes
  return <h1>Hello, {name}</h1>;
}
```

Every time the parent component re-renders, `Profile` gets called again — even if `name` hasn't changed. React computes the new JSX, compares it to the previous one, sees the output is identical, and doesn't touch the DOM. **Re-running the function is cheap; touching the real DOM is expensive.** That's why the model works: re-running a pure JS function millions of times a second is a non-issue, the bottleneck is always the real DOM.

```tsx
// The "key" in lists is the piece of information the diff is missing to be efficient:
// it tells React "this specific item is THE SAME as before, even if it moved"
{users.map(user => (
  <UserRow key={user.id} user={user} />   // ✅ stable id: React knows what to reorder
))}
```

Without a stable `key`, React has to guess — and it often guesses wrong, recreating DOM nodes you could have reused (losing focus, input state, in-flight animations).

`memo`, `useMemo`, and `useCallback` exist for exactly one reason: to tell React "don't call this function again / don't recompute this tree if the inputs haven't changed" — it's literally a cache keyed on arguments, the same concept as `@lru_cache` or memoization you already know, applied to renders instead of function calls.

### Unit testing a component

The modern pragmatic stack: **Vitest** (not Jest — it's what Vite uses natively, and it's faster) + **React Testing Library**, which nudges you toward testing "what the user sees," not implementation details.

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

```tsx
// Counter.tsx
export function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(count + 1)}>
      Clicked {count} times
    </button>
  );
}
```

```tsx
// Counter.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Counter } from './Counter';

describe('Counter', () => {
  it('increments the counter on click', () => {
    render(<Counter />);

    const button = screen.getByRole('button', { name: /clicked 0 times/i });
    fireEvent.click(button);

    expect(screen.getByRole('button', { name: /clicked 1 times/i })).toBeInTheDocument();
  });
});
```

`getByRole` finds the element the way a user (or a screen reader) would — not a fragile `document.querySelector('.btn-primary')` that breaks the moment you refactor CSS classes.

### Talking to the backend

`useEffect` + `fetch` is what you reach for on the first try. It's also an **anti-pattern** for anything more serious than a toy prototype, for the same reason you wouldn't hand-roll an HTTP client with no retry, timeout, or cache when a mature library already exists:

```tsx
// ❌ The classic anti-pattern
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(setUser);
    // Problems: (1) race condition if userId changes fast and responses arrive
    // out of order, (2) no cache — re-fetches every time on mount,
    // (3) no retry, (4) loading/error state to hand-roll every single time
  }, [userId]);

  return user ? <div>{user.name}</div> : <div>Loading...</div>;
}
```

**TanStack Query** (`@tanstack/react-query`) is the pragmatic default for "server state": it handles caching, invalidation, retry, deduplicating identical requests, and gives you loading/error as ready-to-use values.

```bash
npm install @tanstack/react-query
```

```tsx
// api/users.ts
async function fetchUser(userId: string) {
  const res = await fetch(`/api/users/${userId}`);
  if (!res.ok) throw new Error('Failed to fetch user');
  return res.json();
}

// UserProfile.tsx
import { useQuery } from '@tanstack/react-query';

function UserProfile({ userId }: { userId: string }) {
  const { data, isPending, isError } = useQuery({
    queryKey: ['user', userId],   // the cache key — userId changes, it auto-invalidates
    queryFn: () => fetchUser(userId),
  });

  if (isPending) return <div>Loading...</div>;
  if (isError) return <div>Something went wrong.</div>;
  return <div>{data.name}</div>;
}
```

> 💡 Think of `queryKey` as the key of a distributed LRU cache: TanStack Query deduplicates identical in-flight requests, keeps data "fresh" for a configurable window, and invalidates/refetches when the key changes. You just write `fetchUser`, and the library handles the rest — race conditions included.

### Design Patterns

**Custom Hooks** — extracting reusable stateful logic, the idiomatic pattern par excellence. It's the equivalent of pulling a library function out of duplicated code:

```tsx
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer); // cleanup: cancel the previous timer
  }, [value, delayMs]);

  return debounced;
}

// Usage: the debounce logic is invisible to the component that uses it
function SearchInput() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);
  // ... use debouncedQuery for the fetch
}
```

**Compound Components** — a parent component that shares implicit state with its children, exactly like a Python context manager shares resources with the `with` block:

```tsx
function Tabs({ children, defaultValue }: { children: React.ReactNode; defaultValue: string }) {
  const [active, setActive] = useState(defaultValue);
  return (
    <TabsContext value={{ active, setActive }}>
      <div className="tabs">{children}</div>
    </TabsContext>
  );
}

Tabs.Item = function TabItem({ value, children }: { value: string; children: React.ReactNode }) {
  const { active, setActive } = use(TabsContext);
  return (
    <button className={active === value ? 'active' : ''} onClick={() => setActive(value)}>
      {children}
    </button>
  );
};

// Usage: reads like markup, but with shared state under the hood
<Tabs defaultValue="overview">
  <Tabs.Item value="overview">Overview</Tabs.Item>
  <Tabs.Item value="settings">Settings</Tabs.Item>
</Tabs>
```

**Composition over inheritance** — "children as props" is React's way of doing what elsewhere you'd do with dependency injection or template engine slots: you pass a piece of UI as data, you don't extend a base class.

```tsx
function Card({ children }: { children: React.ReactNode }) {
  return <div className="card">{children}</div>;
}
// Card doesn't know and doesn't need to know what's inside — just like a
// higher-order function doesn't know what the callback it receives does
```

> 💡 **Legacy patterns**: if you run into old code with `render props` (`<DataProvider render={data => ...}>`) or **HOCs** (`withAuth(MyComponent)`), those are the predecessors of hooks. They still work, but today a custom hook does the same job with half the code and none of the annoying "wrapper hell". You don't need to learn them to write new code, only to read them when you find them.

### ✅ Good Practices / ❌ Bad Practices

| ✅ Good practice | ❌ Bad practice |
|---|---|
| `key={user.id}` — stable, unique id | `key={index}` — breaks on reorder/insert/remove |
| State colocated as low in the tree as possible | State hoisted to the top "in case some day it's needed elsewhere" |
| Deriving data from other data at render time (`const total = items.length`) | Duplicating in state something that's computable (`const [total, setTotal] = useState(...)`) |
| Small, focused components, single responsibility | An 800-line "god component" doing fetching, validation, layout, and business logic |
| `setItems([...items, newItem])` — new array, new reference | `items.push(newItem)` — mutates the existing array, React never notices |
| A custom hook for reusable logic | Copy-pasting the same `useEffect` into five components |

### Errors to avoid "like the plague"

- **Stale closures in `useEffect`**: if you forget a dependency in the array (`[]` instead of `[count]`), the effect "sees" the value of `count` from the first render forever. ESLint's `exhaustive-deps` rule exists specifically to catch this bug before you find it in production.
- **Mutating state directly**: `state.items.push(x)` will never trigger a re-render, because React compares *references*, not deep content. Always `setState([...state.items, x])`.
- **Fetching in `useEffect` without cleanup/abort**: if the user navigates away quickly, an earlier request's response can arrive *later* and overwrite state with stale data (the classic race condition). Either use `AbortController` in the cleanup, or better yet use TanStack Query, which already does this for you.
- **Prop drilling 5 levels deep**: passing a prop through components that don't use it, just to get it to the bottom. If you're past 2-3 levels, that's the signal you need Context (for stable values) or Zustand (for state that changes often).
- **Huge inline anonymous functions passed to memoized components**: `<ExpensiveChild onClick={() => doSomething(x, y)} />` creates a new function on every render, which defeats a `React.memo()` on the child — use `useCallback` if the child is genuinely expensive to re-render.
- **Forgetting the `key` prop in lists**: React warns you in the console, but if you ignore it you end up with bizarre bugs of state "sticking" to the wrong node when the list changes order.

## 2. Vue 3.5 — the framework that only rebuilds the targets that actually changed

You've spent years hating jobs that redo work nobody asked them to redo. Caches invalidated at the wrong time, cron jobs that recompute everything instead of just the delta, a `make` without `.PHONY` that rebuilds the entire universe over a typo in a comment. Vue 3 was written by people with your exact same allergy to waste, applied to the UI: when a piece of data changes, it updates **only the bits of screen that depend on that data**, and nothing else. That's not marketing copy, it's an actual dependency graph, built at runtime. I'll prove it to you in a minute, diagram included.

### Philosophy: a framework that only takes what you give it

Vue calls itself a "progressive framework," and for once the buzzword is accurate. It doesn't force an all-or-nothing architecture on you: you can drop it into a single HTML page with a `<script>` tag and zero build step (exactly like you'd `#include` a single-header C library), or scale it up into a full SPA with routing, state management, and server-side rendering. You decide how much framework you need — it doesn't decide for you.

The base unit is the **Single File Component** (`.vue`): template, logic, and styles live in the same file, in three clean blocks (`<template>`, `<script setup>`, `<style>`). If you come from the backend, think of it as a Rails/Django controller, its view, and its scoped CSS all kept together in one file instead of scattered across three folders you have to keep in sync by hand. Vue's compiler (a genuine AST transformer, not a runtime trick) turns that file into plain JavaScript *at build time* — the browser never sees `.vue` files, only the compiled, lean, optimized output.

Today, the standard way to write logic is the **Composition API** inside `<script setup>`: composable functions, TypeScript typing that actually works (full inference, no hidden `any`), zero boilerplate. There's also the **Options API** (objects with `data()`, `methods`, `computed` as separate keys) — that's the old way, still supported, and you'll run into it in legacy code. You don't need to learn it to write Vue today: think of it as the Perl 5 of the Vue stack — it's there, it works, you just don't write it from scratch anymore.

> 💡 **If you know server-side template engines** (Jinja2, ERB, Handlebars), Vue's template syntax will feel like home: `{{ interpolation }}`, `v-if`, `v-for`. The huge difference is that this template is *reactive*: it doesn't render once per request, it updates itself automatically every time a value it depends on changes.

### What's new (in two lines)

This release line (3.5, codename "Tengen Toppa Gurren Lagann," late 2024/2025) is mostly a tightening of performance and ergonomics, not a revolution: **reactive props destructure** becomes stable (you can finally destructure `defineProps()` without losing reactivity — the compiler handles it for you), `useTemplateRef()` arrives for explicit template refs, `useId()` gives you stable IDs across server and client in SSR, and the reactivity engine uses noticeably less memory on large component trees.

### How to structure a project

You don't invent the structure from scratch — you use the official scaffolding tool.

```bash
npm create vue@latest
```

It walks you through a series of interactive prompts. The recommended answers for a serious project today:

| Prompt | Recommended | Why |
|---|---|---|
| TypeScript? | **Yes** | Type inference on props, emits, stores — you'll never want to go back |
| JSX support? | No | Only needed if you write render functions by hand, rare in idiomatic Vue |
| Vue Router? | Yes, if more than one view | Official, integrated routing, no exotic config |
| Pinia? | **Yes, from day one** | The official state management library — see the dedicated section |
| Vitest? | **Yes** | Native Vite test runner, very fast |
| E2E Testing (Playwright)? | Depends on the project | Useful for critical flows, not for every component |
| ESLint + Prettier? | Yes | Like `clippy`/`rustfmt` — you have no excuse not to |

The resulting structure, typically:

```
my-app/
├── src/
│   ├── main.ts              # entry point, mounts the app
│   ├── App.vue               # root component
│   ├── components/           # reusable, "dumb" components
│   ├── views/                # route-bound components
│   ├── composables/          # reusable logic (the heart of Vue 3, see below)
│   ├── stores/                # Pinia stores
│   ├── router/                 # route definitions
│   └── assets/
├── vite.config.ts
└── package.json
```

> 🧠 **Analogy**: `composables/` is your `lib/` or `utils/` folder — except instead of stateless pure functions, it holds functions that encapsulate *reactive state and lifecycle*. We get to that in the Design Patterns section.

### The pragmatic approach: what you DON'T need

Before you install half of npm, a bit of discipline:

- **You don't need Vuex.** It has been entirely replaced by Pinia. If you see it in a tutorial, that tutorial is old.
- **You don't need the Options API** for new code. It's backward-compatibility support, not the recommended style.
- **You don't need a state management library** for a single component's local state. Local `ref`/`reactive` covers 90% of cases — not everything has to end up in a global store.
- **You don't need TanStack Query** if you have two simple `GET` fetches with no caching/retry/pagination: a composable with `ref` + `onMounted` does the same job with zero extra dependencies.
- **You don't need to touch the DOM by hand** (`document.querySelector`, `innerHTML`): if you find yourself doing that inside a Vue component, you're rowing against the framework, not with it.
- **You don't need a `utils/` folder with 40 generic helpers** before you even know you need them — YAGNI applies here too.

### State: where do I put it?

The right question, answered in layers — exactly like you decide whether a piece of data lives in a local variable, a request-scoped context, or a shared table:

| Scope | Tool | When |
|---|---|---|
| Local state of a component | `ref()` / `reactive()` inside `<script setup>` | 90% of cases. Never leaves that component. |
| Shared between a parent and deeply nested children | `provide` / `inject` | You avoid "prop drilling" (passing a prop through 5 levels that don't use it) without pulling in a global store |
| Truly global/shared app state | **Pinia** | Authenticated user, cart, theme, data cache shared across different routes |

```ts
// src/stores/user.ts — a Pinia store, the official state management tool
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const name = ref('')
  const isAuthenticated = computed(() => name.value !== '')

  function login(newName: string) {
    name.value = newName
  }

  function logout() {
    name.value = ''
  }

  return { name, isAuthenticated, login, logout }
})
```

```vue
<!-- Usage in any component -->
<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'

const store = useUserStore()
const { name, isAuthenticated } = storeToRefs(store) // keeps reactivity!
</script>

<template>
  <p v-if="isAuthenticated">Hi, {{ name }}</p>
  <button v-else @click="store.login('Alice')">Log in</button>
</template>
```

Pinia has fully replaced Vuex: no separate `mutations`/`actions`/`getters` and boilerplate — a store is literally a function with `ref`/`computed`/plain functions inside, the exact same syntax you already use in components, and TypeScript inference works with zero extra config.

> 💡 **`storeToRefs`**: if you destructure a Pinia store directly (`const { name } = store`), you lose reactivity — it's the exact same problem as `reactive()`, and we cover it in detail two sections from now. `storeToRefs()` exists specifically to destructure safely.

### Reactivity explained simply

This is THE concept that needs to click. Everything else in Vue follows from it.

🧠 **The analogy**: think of Vue as a build system with a fine-grained dependency graph — like `make` done right, or Bazel, except tracked *automatically* instead of hand-declared in a Makefile. When you change a source file, a good build system rebuilds *only the targets that depend on that file*, not the whole project. Vue does exactly this with data and UI: when a value changes, only the parts of the template (or the `computed` values) that *actually* read that value get recalculated. Everything else stays exactly as it was, never even touched.

How it does it, technically: it uses JavaScript **Proxies**.

```ts
import { ref, reactive, computed, watchEffect } from 'vue'

// ref(): for single values / primitives. Wraps the value in an object
// with an intercepted getter/setter — that's why you need `.value` outside the template
const count = ref(0)
console.log(count.value) // 0
count.value++             // writes through the intercepted setter → Vue knows

// reactive(): for objects. The returned value is a Proxy —
// reading/writing one of its properties goes through traps Vue intercepts
const state = reactive({ count: 0, name: 'Alice' })
state.count++ // no `.value`: the interception is on the object itself
```

The dependency graph builds itself **automatically**, at runtime, the first time something "reads" a reactive value inside a tracked context (a template, a `computed`, a `watchEffect`):

```ts
const price = ref(100)
const quantity = ref(2)

// computed = derived value, with automatic CACHING.
// Exactly like a spreadsheet cell with a formula:
// it only recalculates when a cell it depends on changes, otherwise
// it hands you the already-computed value, for free.
const total = computed(() => price.value * quantity.value)

console.log(total.value) // 200 — first read, computes and caches
console.log(total.value) // 200 — second read, no recompute: cache hit
quantity.value = 3
console.log(total.value) // 300 — a dependency changed, cache invalidated, recomputes
```

During that first run, Vue records: "`total` depends on `price` and `quantity`." From that moment on, every time you write to `price.value` or `quantity.value`, Vue knows *exactly* who to recalculate — it doesn't need to "check everything just in case," it already knows, like a build engine that already has the dependency graph sitting in memory.

> 🧠 **The comparison that makes it click**: React re-runs the entire component function on every state change and then diffs two Virtual DOMs to figure out what *actually* changed (an after-the-fact diff). Vue builds the dependency graph *ahead of time*, so it already knows, before rendering even happens, which nodes to touch — no diffing needed to figure out "what" changed, because it already knew.

### Unit testing a component

The pragmatic stack today: **Vitest** (because Vue projects are Vite-native, so zero extra config) + **`@vue/test-utils`** to mount and query components.

```vue
<!-- Counter.vue -->
<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
function increment() {
  count.value++
}
</script>

<template>
  <button @click="increment">Count: {{ count }}</button>
</template>
```

```ts
// Counter.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Counter from './Counter.vue'

describe('Counter', () => {
  it('increments the count when clicked', async () => {
    const wrapper = mount(Counter)

    expect(wrapper.text()).toContain('Count: 0')

    await wrapper.find('button').trigger('click')

    expect(wrapper.text()).toContain('Count: 1')
  })
})
```

`mount` renders the component into an in-memory virtual DOM (jsdom), `find` looks up an element with a CSS selector, `trigger` simulates a DOM event (and returns a Promise, because Vue updates the DOM asynchronously — hence the `await`), `text()` reads the rendered content for the assertion.

> 💡 If you prefer a "real user" style over "implementation details," there's also Vue's **Testing Library** adapter (`@testing-library/vue`), with APIs like `getByText`, `getByRole`. Same philosophy as `@vue/test-utils`, queries more oriented toward accessibility.

### Talking to the backend

Two levels — pick based on actual complexity, no need to bring out the heavy artillery for two `GET` requests.

**Level 1 — a homegrown composable**, for simple calls with no need for caching/retry/invalidation:

```ts
// composables/useUser.ts
import { ref, onMounted } from 'vue'

interface User {
  id: number
  name: string
  email: string
}

export function useUser(userId: number) {
  const user = ref<User | null>(null)
  const isLoading = ref(true)
  const error = ref<string | null>(null)

  onMounted(async () => {
    try {
      const res = await fetch(`/api/users/${userId}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      user.value = await res.json()
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      isLoading.value = false
    }
  })

  return { user, isLoading, error }
}
```

```vue
<script setup lang="ts">
import { useUser } from '@/composables/useUser'

const { user, isLoading, error } = useUser(42)
</script>

<template>
  <p v-if="isLoading">Loading...</p>
  <p v-else-if="error">Error: {{ error }}</p>
  <p v-else>{{ user?.name }}</p>
</template>
```

**Level 2 — TanStack Query (`@tanstack/vue-query`)**, once you actually need automatic retries, smart caching, invalidation, pagination, optimistic mutations. At that point, rolling it yourself is time wasted reinventing an already excellent wheel:

```vue
<script setup lang="ts">
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'

interface User {
  id: number
  name: string
}

const queryClient = useQueryClient()

const { data: user, isLoading, isError } = useQuery({
  queryKey: ['user', 42],
  queryFn: () => fetch('/api/users/42').then((r) => r.json() as Promise<User>),
})

const { mutate: renameUser } = useMutation({
  mutationFn: (name: string) =>
    fetch('/api/users/42', { method: 'PATCH', body: JSON.stringify({ name }) }),
  onSuccess: () => {
    // invalidate the cache: the next read refetches in the background
    queryClient.invalidateQueries({ queryKey: ['user', 42] })
  },
})
</script>

<template>
  <p v-if="isLoading">Loading...</p>
  <p v-else-if="isError">Something went wrong</p>
  <div v-else>
    <p>{{ user?.name }}</p>
    <button @click="renameUser('New Name')">Rename</button>
  </div>
</template>
```

| | Homegrown composable | TanStack Query |
|---|---|---|
| A couple of simple `GET`s | ✅ perfect | overkill |
| Automatic retry on network error | you write the logic | built in |
| Cache shared across different components | you write the logic | built in, keyed by `queryKey` |
| Invalidation after a mutation | manual | `invalidateQueries` |
| Pagination / infinite scroll | quite a bit of code by hand | `useInfiniteQuery` ready to go |

### Design Patterns

**Composables** are the Vue equivalent of React hooks: functions that encapsulate reusable, stateful reactive logic, shared across different components. `useMouse()`, `useFetch()`, `useUser()` above — those are all composables. It's the number-one idiomatic pattern in Vue 3:

```ts
// composables/useMouse.ts
import { ref, onMounted, onUnmounted } from 'vue'

export function useMouse() {
  const x = ref(0)
  const y = ref(0)

  function update(event: MouseEvent) {
    x.value = event.pageX
    y.value = event.pageY
  }

  onMounted(() => window.addEventListener('mousemove', update))
  onUnmounted(() => window.removeEventListener('mousemove', update))

  return { x, y }
}
```

```vue
<script setup lang="ts">
import { useMouse } from '@/composables/useMouse'

const { x, y } = useMouse() // nothing to configure, all the logic is encapsulated
</script>

<template>
  <p>Mouse at {{ x }}, {{ y }}</p>
</template>
```

**Scoped slots / "renderless" components**: a component that renders no markup of its own, but only exposes *state and behavior* through the slot — headless UI logic, you decide the DOM:

```vue
<!-- Toggle.vue: no styling, just logic -->
<script setup lang="ts">
import { ref } from 'vue'

const isOpen = ref(false)
function toggle() {
  isOpen.value = !isOpen.value
}
</script>

<template>
  <slot :isOpen="isOpen" :toggle="toggle" />
</template>
```

```vue
<!-- Usage: you decide the markup, Toggle only gives you the state -->
<Toggle v-slot="{ isOpen, toggle }">
  <button @click="toggle">{{ isOpen ? 'Hide' : 'Show' }}</button>
  <p v-if="isOpen">Surprise!</p>
</Toggle>
```

**`provide`/`inject`**: a lightweight Dependency Injection container, built right into the framework. Useful to avoid "prop drilling" across deep trees (theme, i18n, configuration) without pulling in Pinia for something that isn't really shared application state:

```ts
// App.vue — the "provider" at the top of the tree
import { provide, ref } from 'vue'
import type { InjectionKey, Ref } from 'vue'

export const ThemeKey: InjectionKey<Ref<'light' | 'dark'>> = Symbol('theme')

const theme = ref<'light' | 'dark'>('dark')
provide(ThemeKey, theme)
```

```ts
// DeepChild.vue — at any depth in the tree, no prop to pass down
import { inject } from 'vue'
import { ThemeKey } from './App.vue'

const theme = inject(ThemeKey) // typed, no hidden "any"
```

### ✅ Good Practices / ❌ Bad Practices

| ✅ Good Practice | ❌ Bad Practice |
|---|---|
| Destructure reactive state with `toRefs()`/`storeToRefs()` | Destructuring a `reactive()` (or a store) directly — breaks reactivity |
| Use `computed()` for derived state | Using `watch` to manually sync a `ref` that could just be a `computed` |
| Small components, logic pulled out into composables | One giant SFC mixing 10 unrelated concerns |
| "Props down, events up": change parent state via `emit` | Mutating a prop directly inside the child component |
| Pinia for genuinely global/shared state | A global `reactive()` for state that's actually local to one component |
| A unique, stable `:key` on every `v-for` | Using the array index as `:key` when the list can be reordered |

### Errors to avoid "like the plague"

1. **Destructuring a `reactive()` and losing reactivity.** This is footgun number one for anyone starting out with Vue.

   ```ts
   const state = reactive({ count: 0 })
   const { count } = state // ❌ count is now a PLAIN number, disconnected from the Proxy

   count++ // NOTHING happens in the template — you have a dead copy
   ```

   Why it happens: `reactive()`'s reactivity lives **on the object's Proxy**, not on the values inside it. Destructuring with normal JS syntax copies the *value* out of the object at that exact moment — the link with the Proxy breaks right there, permanently. The fix is `toRefs()` (for generic `reactive()` objects) or `storeToRefs()` (for Pinia stores): both return `ref`s that stay linked to the source.

2. **Forgetting `:key` in a `v-for`.** Without a stable key, Vue doesn't know which DOM node corresponds to which list item when the list changes — you can end up with inputs that "swap" the value you typed, wrong animations, phantom state bugs.

3. **Mutating a prop directly instead of emitting an event.** Props flow in one direction only: from parent to child. If the child modifies it directly, Vue warns you in the console (rightly so) — the rule is "props down, events up": the child asks the parent to change, it doesn't do it itself.

4. **Using a global `reactive`/Pinia store for state that's local to one component.** If no other component needs that data, keep it local with a `ref`. A global store bloated with "convenient" state is the frontend equivalent of mutable global variables shared between modules that shouldn't even know about each other.

5. **Nested `watch` chains that could be a single `computed`.** If you find yourself writing a `watch` that updates a `ref` that triggers another `watch` that updates another `ref`... stop. Almost always that whole chain is really just one derived value, expressible with a single `computed()` — declarative, cached, with no cascading side effects to debug.

## 3. Angular 19 — the enterprise framework that stopped hating you

If you heard about Angular a decade ago and ran away screaming — NgModule everywhere, dependency injection with the ceremony of a Kubernetes YAML, RxJS required even to add two numbers together — good news: that Angular is dead. What you're about to read is Angular 19, and it looks a lot more like a well-designed reactive runtime than the enterprise-framework-in-a-box you remember. The ceremony is mostly gone. What's left — serious dependency injection, a compiler that type-checks everything, a two-layer reactivity model — is arguably the most "backend-shaped" design of the three frameworks in this playbook.

### Philosophy: a runtime with a built-in DI container, not just a component library

Vue and React give you components and let you organize the rest yourself. Angular starts from the opposite assumption: **it's a framework**, in the full sense of the word — it has opinions on routing, HTTP, dependency injection, testing, forms, all included and wired together from day one. If you've ever used Spring Boot or .NET with its built-in DI container, the mental model is identical: components and services aren't "just imported," they're **injected** by a hierarchical container that resolves dependencies on its own, with a precise scope (root, per-route, per-component). Angular isn't "React with more rules": it's conceptually closer to a backend framework like NestJS (which, tellingly, shamelessly copied its DI system) wearing a DOM-library disguise.

> 🧠 **The reframe you need**: Angular doesn't ask you "how do I render this HTML," it asks you "how do I organize a large application with shared, testable, swappable dependencies." If your backend brain likes inversion of control, you're home.

### What's new (in two lines)

Angular 17-19 threw away almost all the historical ceremony: **standalone components** are the default (no more mandatory NgModules), templates have a new native control-flow syntax (`@if`, `@for`, `@switch` instead of `*ngIf`/`*ngFor`), and **Signals** arrived as a first-class reactivity primitive, running alongside (not yet fully replacing) RxJS. Change detection without `zone.js` ("zoneless") is available in developer preview: it's the direction Angular is heading, but for now it's opt-in.

### How to structure a project

The official CLI remains the pragmatic default — it already scaffolds everything without NgModules:

```bash
npm install -g @angular/cli
ng new my-app          # standalone scaffolding by default, no module boilerplate
cd my-app
ng serve                # dev server with hot reload
```

Typical structure of an Angular 19 standalone project:

```
my-app/
├── src/app/
│   ├── app.component.ts     # root component, standalone
│   ├── app.config.ts        # global providers (router, http, etc.)
│   ├── core/services/       # injectable services, shared state
│   └── features/dashboard/  # isolated features, each with its own components
└── angular.json              # CLI config (build, test, serve)
```

A minimal standalone component — note that `standalone: true` is implicit (it's the default since v19) and there's no NgModule anywhere in sight:

```typescript
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-counter',
  template: `
    <button (click)="increment()">Click: {{ count() }}</button>
  `,
})
export class CounterComponent {
  count = signal(0);

  increment() {
    this.count.update(n => n + 1);
  }
}
```

Bootstrap in `main.ts` is a single call, no more of the old `platformBrowserDynamic().bootstrapModule(AppModule)` incantation: `bootstrapApplication(AppComponent, appConfig)`.

> 💡 **`inject()` instead of the constructor**: the classic way to get a dependency was a constructor parameter (`constructor(private http: HttpClient) {}`). That still works, but `inject()` is more flexible: you can call it in any function running inside a DI context, not just constructors. Both styles are legitimate, but modern code increasingly leans on `inject()`:

```typescript
export class UserService {
  private http = inject(HttpClient);  // no constructor to write
}
```

### The pragmatic approach: what you DON'T need

| What | Why you don't need it (anymore) |
|---|---|
| **NgModules** | The mandatory ceremony for declaring components, directives, and providers in "modules." Standalone components make them redundant. You'll still find them in legacy code — treat them as a fossil, not something to reproduce in new code. |
| **NgRx for every project** | It used to exist because there was no clean way to share reactive state across components. Today a service with `providedIn: 'root'` exposing a few signals covers 90% of cases. See the state section below. |
| **RxJS for synchronous local state** | If your "state" is a boolean you toggle or a counter, you don't need a `BehaviorSubject`. That's a `signal()`. RxJS is for *asynchronous streams*, not for every variable that happens to change. |
| **Zone.js in every case** | It's still the default and works fine, but if you're writing new code with signals everywhere, zoneless change detection (preview) is where Angular is taking you — no need to chase it today, just know it exists. |
| **`*ngIf` / `*ngFor` in new code** | The old structural directives still work, but `@if`/`@for`/`@switch` are more readable, better typed by the compiler, and the syntax Angular itself now recommends. |

### State: where do I put it?

**Component-local state** → `signal()` and `computed()`. Full stop. No `BehaviorSubject`, no external store for a form panel that opens and closes.

```typescript
import { Component, signal, computed } from '@angular/core';

@Component({ selector: 'app-cart', template: `...` })
export class CartComponent {
  items = signal<{ price: number }[]>([]);
  total = computed(() => this.items().reduce((sum, i) => sum + i.price, 0));

  addItem(price: number) {
    this.items.update(list => [...list, { price }]);  // new array, never mutate directly
  }
}
```

**State shared across components** → an injectable service with `providedIn: 'root'` holding signals internally. This is the pattern that made NgRx optional instead of mandatory:

```typescript
import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })   // singleton, shared across the whole app
export class AuthService {
  private _currentUser = signal<{ name: string } | null>(null);
  readonly currentUser = this._currentUser.asReadonly();  // expose read-only to the outside

  login(name: string) {
    this._currentUser.set({ name });
  }

  logout() {
    this._currentUser.set(null);
  }
}
```

Any component, anywhere in the tree, does `currentUser = inject(AuthService).currentUser` and reads `currentUser()` reactively. No prop-drilling, no cascading `@Input`.

> 💡 **What about NgRx, then?** It's still around, still mature, and remains the right call for very large applications with complex, auditable state transitions you want to be able to "rewind" (time-travel debugging, action logs, structured undo/redo). But for 90% of real apps, signals + a service is less code, fewer concepts to explain to a new hire, and does the same job. Reach for NgRx only when you actually feel the pain it solves, not as a preventive "best practice."

### Reactivity explained simply

This is where Angular is genuinely different from the other two frameworks in this playbook, because it has **two separate reactivity primitives**, not one. Worth understanding well — it's the conceptually richest part:

**A Signal = a box holding one current value, that notifies whoever's watching when it changes.**

```typescript
import { signal, computed, effect } from '@angular/core';

const count = signal(0);          // a box containing 0
const doubled = computed(() => count() * 2);  // derives automatically, recomputes itself

effect(() => {
  console.log(`count is now ${count()}`);  // runs every time count changes
});

count.set(5);      // replace the value
count.update(n => n + 1);  // derive the new value from the old one
```

🧠 **Backend analogy**: a signal is like an `inotify`/filesystem watch on a *single, specific file* — not an entire directory. Only whoever actually "read" that file (whoever called `count()` inside a `computed`/`effect`/template) gets re-notified when it changes. It doesn't blindly recompute the whole component: it's fine-grained dependency tracking, like a build system's dependency graph (think of `make` recompiling only the targets whose input changed, not the entire project).

**An Observable (RxJS) = a pipe carrying many values over time, that you transform with operators.**

```typescript
import { fromEvent } from 'rxjs';
import { map, filter, debounceTime, switchMap } from 'rxjs/operators';

fromEvent<InputEvent>(inputEl, 'input').pipe(
  map(e => (e.target as HTMLInputElement).value),
  filter(text => text.length > 2),
  debounceTime(300),                 // wait for 300ms of silence before proceeding
  switchMap(query => this.http.get(`/api/search?q=${query}`)),  // cancels the previous request!
).subscribe(results => this.results.set(results));
```

🧠 **Backend analogy**: if you've ever chained `awk`/`sed`/`grep` into a Unix pipeline, you already understand RxJS: `input | debounce | filter | transform` is exactly `cat log | grep ERROR | awk '{print $2}' | sort | uniq`. Each operator takes a stream and produces another stream. The key difference from a signal is fundamental: **a signal ALWAYS has one current value, period**; **an Observable is a stream of events over time that might never emit, emit once, or emit infinitely** — think of a socket or a message queue, not a variable.

| | Signal | Observable (RxJS) |
|---|---|---|
| What it represents | one current value | a stream of values over time |
| Analogy | filesystem watch on one file | Unix pipe (`grep \| awk \| sort`) |
| Always has a "value right now"? | yes, always | no — might not have emitted anything yet |
| Typical use case | component-local state | HTTP, user input events, websockets, complex async orchestration |
| Automatic cleanup | not needed (no subscription) | needs handling (unsubscribe, `takeUntilDestroyed`) |

The case where you genuinely *need* RxJS and a signal alone won't cut it: "cancel the previous HTTP request if the user types a new character before it responds" — that's literally what `switchMap` does above. A signal has no native concept of "cancel the previous in-flight async operation": for that you need a real stream with operators.

In modern practice: signals for component-local state, RxJS remains dominant for complex async orchestration (HTTP, websockets, reactive forms with debounced validation). The two normally **coexist** in the same app, and Angular ships an official bridge between the two worlds (see the backend section below).

### Unit testing a component

The traditional stack is **Jasmine + Karma** (still the CLI default, runs tests in a real browser). **Vitest** support is available as an experimental/opt-in builder in recent CLI versions — faster, no real browser needed for most unit tests, and where the ecosystem is heading.

The pivot of every Angular test is **`TestBed`**: it creates an isolated testing module and resolves dependencies the same way the real app would.

```typescript
import { TestBed } from '@angular/core/testing';
import { CounterComponent } from './counter.component';

describe('CounterComponent', () => {
  let component: CounterComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CounterComponent],  // standalone: imported like a component, not declared
    }).compileComponents();

    const fixture = TestBed.createComponent(CounterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();  // force a change detection cycle
  });

  it('starts at zero', () => {
    expect(component.count()).toBe(0);
  });

  it('increments the signal on click', () => {
    component.increment();
    expect(component.count()).toBe(1);
  });
});
```

Testing a service follows the identical pattern, just without a DOM fixture: `TestBed.configureTestingModule({})`, then `service = TestBed.inject(MyService)`, and you call methods directly on the instance the test container resolved for you.

> 💡 `TestBed` is conceptually identical to a test DI container in Spring (`@SpringBootTest`) or a mocked service provider in .NET: you build a minimal application context, inject test doubles/mocks where needed, and verify real behavior inside that context.

### Talking to the backend

`HttpClient` is the built-in HTTP client. It's registered with the `provideHttpClient()` provider function (no more importing `HttpClientModule` into an NgModule), and every call returns an **Observable**, not a Promise:

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [provideHttpClient()],
};
```

A minimal typed service:

```typescript
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface Product {
  id: number;
  name: string;
  price: number;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>('/api/products');
  }
}
```

The most useful bridge between the two reactivity worlds is **`toSignal()`**: it takes an Observable and exposes it to you as a read-only signal, handling subscribe/unsubscribe on your behalf:

```typescript
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ProductService } from './product.service';

@Component({
  selector: 'app-product-list',
  template: `
    @for (product of products(); track product.id) {
      <li>{{ product.name }} — €{{ product.price }}</li>
    } @empty {
      <li>Loading...</li>
    }
  `,
})
export class ProductListComponent {
  private productService = inject(ProductService);
  products = toSignal(this.productService.getProducts(), { initialValue: [] });
  // no .subscribe(), no ngOnDestroy to unsubscribe: toSignal() handles it
}
```

> 💡 Also notice `@for ... track ... @empty` in the template: it's the new control-flow syntax (v17+), type-checked and more performant than the old `*ngFor` with `trackBy`.

There's also an experimental API, **`httpResource()`**, meant to express a fetch directly as a signal without going through RxJS at all: it's the future, still stabilizing — for production projects today, `HttpClient` + `toSignal()` remains the solid choice.

### Design Patterns

**Dependency Injection everywhere** is Angular's single defining trait, full stop. Services injected via constructor or `inject()`, hierarchical injectors with a precise scope: root (one instance for the whole app), per-route, or per-component — just add the service to a `@Component`'s `providers: [...]` array to get a fresh instance for every instance of that component and its children. It's the exact same scoping concept as backend DI containers (singleton vs. scoped vs. transient in .NET, or Spring bean scopes) applied to the component tree.

**Smart (container) vs. Dumb (presentational) components** — terminology inherited from React, but idiomatic here too: a "smart" component talks to services, fetches data, decides logic; a "dumb" component receives data via `@Input()` and emits events via `@Output()`, knowing nothing about the outside world.

```typescript
// Dumb: doesn't know about the service, gets everything from the outside
@Component({
  selector: 'app-product-card',
  template: `
    <div>{{ product().name }}</div>
    <button (click)="addToCart.emit(product())">Add</button>
  `,
})
export class ProductCardComponent {
  product = input.required<Product>();       // input signal (v17+)
  addToCart = output<Product>();             // signal-based output (v17+)
}
```

**Standalone directives** for reusable DOM behavior without a whole component — useful when you just need to *modify* an existing element, not render a new one (`@Directive({ selector: '[appHighlight]' })` with an `inject(ElementRef)` inside, applied as `<div appHighlight>`).

### ✅ Good Practices / ❌ Bad Practices

| ✅ Good practice | ❌ Bad practice |
|---|---|
| Using the `async` pipe or `toSignal()` in templates instead of manual `.subscribe()` | Manually calling `.subscribe()` in a component and forgetting to unsubscribe |
| Small, focused services (single responsibility) | A 2000-line "GodService" that does everything for the whole app |
| `OnPush` change detection, or better yet, going fully signal-based (automatic) | Default change detection everywhere without a second thought — it works, but wastes cycles |
| `@if` / `@for` / `@switch` in new code | `*ngIf` / `*ngFor` in new code (still works, but it's legacy syntax) |
| `signal.set()` / `signal.update()` for every change | Mutating the object inside a signal directly and expecting the template to update |
| Standalone components + `inject()` | Nested NgModules to organize simple features |
| Services with `providedIn: 'root'` for simple shared state | Installing NgRx "because everyone does" for a three-screen app |

### Errors to avoid "like the plague"

- **The classic `.subscribe()` memory leak**: you subscribe to an Observable inside a component and never unsubscribe. The component gets destroyed, but the subscription stays alive, keeping everything it references in memory — and keeps running code against a "dead" component. Fixes: the `async` pipe in templates, `toSignal()`, or `takeUntilDestroyed()` if you really must subscribe manually.
- **Confusing when you need a Signal vs. when you need an Observable**: if you're using RxJS with a `BehaviorSubject` to model simple synchronous local state (a boolean, a counter), you're using a pipe to carry a single brick. A `signal()` does the same job in one line, with no subscription to manage.
- **Circular DI dependencies between services**: `ServiceA` injects `ServiceB`, which injects `ServiceA`. Angular flags this at runtime with a cryptic error — the fix is almost always extracting the shared logic into a smaller third service, or breaking the dependency with an event/signal instead of a direct call.
- **Mutating a signal's value directly instead of calling `.set()`/`.update()`**: calling `mySignal().push(item)` on an array inside a signal notifies nobody, because the reference hasn't changed. You have to produce a new reference: `mySignal.update(list => [...list, item])`.
- **Expecting a "magic" re-render from `OnPush` or signals after an in-place mutation**: this is the same footgun family you find in Vue and React — mutate an object in place, and the framework (rightly) doesn't notice, because it's comparing references, not deep contents. Always produce a new object/array, or use `.update()`.

## 4. Three mental models, one single problem

**One-liner**: React, Vue, and Angular solve the exact same problem — "only regenerate the pieces of the screen that need to change" — with three different strategies. There's no "absolute winner": there's whichever strategy is closest to how you already think.

### The table that summarizes everything

| | React 19 | Vue 3.5 | Angular 19 |
|---|---|---|---|
| **Reactivity model** | re-run the whole component function and diff the tree (Virtual DOM) | reactive proxies with a fine-grained dependency graph (`ref`/`reactive`) | fine-grained Signals + RxJS for async streams |
| **Backend analogy** | regenerating HTML from a template on every request and diffing the output | a build system that only rebuilds targets whose input changed | targeted filesystem watch (signal) + `awk`/`sed`-style pipe (RxJS) |
| **Official scaffolding** | `npm create vite@latest -- --template react-ts` | `npm create vue@latest` | `ng new` |
| **Local state** | `useState` / `useReducer` | `ref` / `reactive` | `signal()` / `computed()` |
| **Pragmatic global state** | Zustand | Pinia | injectable service with signals |
| **Reusable logic** | custom Hooks | Composables | services + Dependency Injection |
| **Modern test runner** | Vitest + React Testing Library | Vitest + Vue Test Utils | Jasmine/Karma (Vitest support arriving) |
| **Fetching from the backend** | TanStack Query | composable + TanStack Query (Vue adapter) | `HttpClient` (RxJS) + `toSignal()` |
| **Philosophy in one sentence** | "it's just JavaScript, the UI is a function of state" | "familiar templates, automatic reactivity under the hood" | "batteries included, DI everywhere, scales to huge teams" |

### How to choose in practice

You're not picking a life partner, you're picking the right tool for the context:

- **Pick React** if you want the thinnest layer of "magic" between you and plain JavaScript, you like thinking in terms of pure functions and immutability, and you'll likely be working in a massive ecosystem (more job postings, more third-party libraries, more examples online for whatever problem you run into).
- **Pick Vue** if you want the gentlest learning curve of the three, templates that look like actual HTML (not JSX), and reactivity that "just works" without having to reason too hard about when things re-render.
- **Pick Angular** if you work (or will work) on a large, structured team, you appreciate a framework that enforces precise conventions instead of leaving you free-for-all (fewer style wars between developers), and you're comfortable with Dependency Injection because you come from Spring, .NET, or similar — Angular will feel like home.

> 🧠 **The uncomfortable truth**: once you've genuinely understood ONE of these three mental models all the way through, you'll pick up the other two in about a week each. The hard part isn't the syntax, it's the first conceptual jump from "I command the DOM line by line" to "I describe what should appear given the state, and the framework handles the rest." That jump — now that you've made it this far — you've already made it.

### What's next

Don't just read this: open a terminal (you love it, you know how to use it) and run one of the three scaffolding commands above. Build something dumb — a todo list, a counter, a call to some public API you already know — and watch what happens when you change the state. The moment you see the screen update itself, without you writing a single line to "update the DOM," is the moment these frameworks stop being magic and start being just another tool in your toolbox.

Welcome to the other side of the terminal.
