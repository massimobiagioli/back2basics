# Rust from Zero to Hero

**One-liner**: Rust is a programming language that gives you total control over your computer — like C — but without the risk of blowing everything up. It's fast as a rocket, safe as a vault, and has a compiler that treats you like a strict teacher: it scolds you, but it makes you great.

---

## 1. Why Rust?

Imagine you need to build an engine. You have three options:

- **Python Engine**: Easy to assemble, big colorful parts, simple instructions. But if you mess up, the engine breaks *while you're already driving*. And it's slow.
- **C/C++ Engine**: Powerful, blazing fast, you can tweak every bolt. But if you overtighten one screw, the engine explodes and you don't even know why. And there are 300 pages of instructions.
- **Rust Engine**: Powerful like C, but with an onboard computer that checks *every move you make before you turn the key*. If there's a problem, it tells you right away. The engine never breaks while you're driving.

Rust was born in 2015 at Mozilla (the Firefox people) to solve a concrete problem: memory bugs. In C and C++, you can accidentally access memory that no longer exists. In Rust, the compiler prevents you from doing that.

### What Makes Rust Special?

| Feature | What It Means |
|---|---|
| **Zero-cost abstractions** | Writing elegant code doesn't cost you performance. Rust's generics are as fast as hand-written code. |
| **Memory safety without a garbage collector** | No manual `malloc`/`free`, no GC pausing your program. Memory is freed *automatically* when it's no longer needed. |
| **Fearless concurrency** | Writing multi-threaded code in C is terrifying. In Rust, the compiler tells you if two threads are fighting over the same data. |
| **Compiler as mentor** | Rust's error messages are famous for being *helpful*. They tell you exactly what you did wrong and often suggest the fix. |

### Who Uses Rust?

- **Firefox** (Mozilla) — the Servo rendering engine
- **Dropbox** — file synchronization
- **Discord** — critical backend components
- **AWS** — Firecracker (microVMs for Lambda)
- **Android** — system components
- **npm** — registry and tooling

> 💡 **Fun fact**: For 8 years running, Rust has been the most loved language in Stack Overflow's annual survey.

---

## 2. Rust Is Not Python

If you're coming from Python, brace yourself for culture shock. Rust and Python are almost opposites in philosophy.

### The Mindset Shift

| Concept | Python | Rust |
|---|---|---|
| **Execution** | Interpreted (line by line) | Compiled (all at once into a binary) |
| **Errors** | At *runtime* — crash while the program runs | At *compile time* — the compiler blocks you first |
| **Memory** | Automatic garbage collector | Ownership system (no GC, no manual `free`) |
| **Types** | Dynamic (`x = 5; x = "hello"` works) | Static (`let x = 5; x = "hello"` does NOT compile) |
| **Mutability** | Everything is mutable by default | You must declare `mut` if you want to modify something |
| **Null** | `None` is everywhere | No `null` exists. Use `Option<T>` |
| **Exceptions** | `try`/`except` | `Result<T, E>` — errors are *values*, not throws |

### What You Gain, What You Lose

**You gain:**
- C-level performance without its nightmares
- Fearless refactoring: if it compiles, it probably works
- Powerful pattern matching (Python 3.10 copied it with `match`/`case`)
- Integrated tooling: formatter, linter, test runner, package manager — all included

**You lose:**
- Prototyping speed: in Python you write 10 lines, in Rust you might write 30
- Extreme flexibility: Rust forces you to do things "the right way"
- The "I'll fix it later" attitude: in Rust it won't compile until it's correct

```python
# Python: flexible, but if you forget to handle the error...
def divide(a, b):
    return a / b

print(divide(10, 0))  # 💥 ZeroDivisionError at runtime
```

```rust
// Rust: the compiler forces you to think about it
fn divide(a: f64, b: f64) -> Option<f64> {
    if b == 0.0 {
        None       // "hey, something went wrong"
    } else {
        Some(a / b) // "all good, here's the result"
    }
}

let result = divide(10.0, 0.0);
match result {
    Some(value) => println!("Result: {}", value),
    None => println!("You can't divide by zero!"),
}
```

> 🧠 **The mantra**: In Python you write code and hope it works. In Rust, the compiler is your pair programmer telling you "this will never work" *before* you find out for yourself.

---

## 3. Syntax

Let's get our hands dirty. Here are the fundamental building blocks of Rust.

### Variables and Constants

```rust
// Immutable by default — once assigned, it never changes
let name = "Alice";

// Mutable — you explicitly declare it can change
let mut counter = 0;
counter = counter + 1;  // ✅ OK

// Constant — always immutable, must have an explicit type
const MAX_PLAYERS: u32 = 4;

// Shadowing — you can re-declare a variable with the same name
let x = 5;
let x = x + 1;   // x is now 6
let x = "hello"; // x is now a string — new binding, different type
```

> 💡 **Why `let mut`?** In Python everything is mutable and sometimes you modify things by accident. Rust asks you to declare your intent: "yes, I want this variable to be able to change." Fewer surprises.

### Primitive Types

```rust
// Integers — you can choose the bit size
let age: u8 = 13;           // unsigned 8-bit (0..255)
let temperature: i32 = -5;  // signed 32-bit
let big: u64 = 9_000_000_000; // unsigned 64-bit

// Floating point
let pi: f64 = 3.14159;
let half: f32 = 0.5;

// Booleans
let active: bool = true;

// Character — 4 bytes (supports emoji and Unicode!)
let letter: char = '🦀';

// Tuple — group of values of different types
let coordinates: (i32, i32) = (10, 20);
let (x, y) = coordinates;  // destructuring
println!("x: {}, y: {}", x, y);

// Array — fixed size, same type
let numbers: [i32; 5] = [1, 2, 3, 4, 5];
let zeros = [0; 100];  // array of 100 zeros

// Vector — variable size (like Python lists)
let mut list: Vec<i32> = vec![1, 2, 3];
list.push(4);         // adds to the end
list.pop();           // removes from the end
```

### Functions

```rust
// Simple — typed parameters, return type after the arrow ->
fn add(a: i32, b: i32) -> i32 {
    a + b  // last expression without semicolon = return value
}

// With explicit return
fn max(a: i32, b: i32) -> i32 {
    if a > b {
        return a;
    }
    b
}

// No return (unit type, similar to Python's None)
fn greet(name: &str) {
    println!("Hello, {}!", name);
}
```

> 🧠 **Expression vs Statement**: In Rust almost everything is an expression (returns a value). A `{}` block returns the last expression. The `;` suppresses the value and turns the expression into a statement (returns `()`, Rust's "nothing").

### Control Flow

```rust
// if/else — it's an expression, so you can assign it!
let number = 7;
let message = if number > 5 {
    "big"
} else {
    "small"
};

// loop — infinite loop (you must exit with break)
let mut counter = 0;
let result = loop {
    counter += 1;
    if counter == 10 {
        break counter * 2;  // break can return a value!
    }
};
println!("Result: {}", result); // 20

// while
let mut n = 3;
while n > 0 {
    println!("{}...", n);
    n -= 1;
}
println!("Go!");

// for — the most used
let numbers = vec![10, 20, 30, 40];
for n in &numbers {        // & = borrow, don't consume
    println!("{}", n);
}

// for with ranges
for i in 0..5 {            // 0, 1, 2, 3, 4 (excludes 5)
    println!("{}", i);
}

for i in 0..=5 {           // 0, 1, 2, 3, 4, 5 (includes 5)
    println!("{}", i);
}
```

### Pattern Matching

Rust's `match` is a switch on steroids. It's **exhaustive**: you must cover *all* possible cases, or the compiler gets angry.

```rust
enum TrafficLight {
    Red,
    Yellow,
    Green,
}

let state = TrafficLight::Yellow;

match state {
    TrafficLight::Red => println!("Stop!"),
    TrafficLight::Yellow => println!("Slow down..."),
    TrafficLight::Green => println!("Go!"),
    // If you forget a color, the compiler yells at you
}
```

```rust
// Match on numbers with ranges and guards
let grade = 85;

match grade {
    90..=100 => println!("Excellent!"),
    70..=89 => println!("Good job!"),
    60..=69 => println!("Passing"),
    _ if grade < 0 => println!("Impossible!"),
    _ => println!("Study more..."),
}
```

### Enums — Much More Powerful Than Python Enums

```rust
// Enums with associated data — each variant can hold different data
enum Message {
    Text(String),
    Image { url: String, width: u32 },
    Reaction(char),
    Empty,
}

let msg = Message::Text(String::from("Hello!"));

match msg {
    Message::Text(content) => println!("Text: {}", content),
    Message::Image { url, width } => {
        println!("Image {} ({}px)", url, width)
    }
    Message::Reaction(emoji) => println!("Reaction: {}", emoji),
    Message::Empty => println!("Empty message"),
}
```

---

## 4. The Tools: Cargo and Friends

In Python you have `pip`, `virtualenv`, `black`, `pylint`, `pytest` — all separate tools you need to install. In Rust, it's all included. And it's called **Cargo**.

### rustup — The Launcher

`rustup` is the first tool you install. It manages Rust versions and compilation targets:

```bash
# Install Rust (do this once)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Update Rust to the latest version
rustup update

# Add a target (e.g., compile for Windows from Mac)
rustup target add x86_64-pc-windows-msvc
```

### Cargo — The Swiss Army Knife

```bash
# Create a new project
cargo new my_project
# Creates: my_project/
#          ├── Cargo.toml      (configuration, dependencies)
#          └── src/
#              └── main.rs      (your code)

# Compile (debug mode, fast to compile)
cargo build

# Compile and run
cargo run

# Compile for production (optimized, slower to compile)
cargo build --release

# Run tests
cargo test

# Format code (like black for Python)
cargo fmt

# Official linter (like pylint, but stricter and more useful)
cargo clippy

# Generate documentation from code
cargo doc --open
```

### Cargo.toml — The Heart of the Project

```toml
[package]
name = "my_project"
version = "0.1.0"
edition = "2021"

[dependencies]
# Library for building CLIs (like argparse/click for Python)
clap = { version = "4.5", features = ["derive"] }
# JSON serialization (like Python's json, but compiled)
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
# Simplified error handling
anyhow = "1.0"

[dev-dependencies]
# Only for tests
tempfile = "3.0"
```

Just add a dependency to `Cargo.toml` and Cargo downloads it, compiles it, and links it to your project. No `pip install`, no `requirements.txt`, no virtual environments that break.

### rustc — The Compiler

```bash
# Compile a single file (without Cargo — useful for quick experiments)
rustc main.rs
./main
```

For real projects, always use `cargo`. `rustc` is for quick scripts or understanding how the compiler works.

### Error Messages

Rust's error messages are the best you'll ever see:

```
error[E0382]: borrow of moved value: `name`
 --> src/main.rs:4:20
  |
3 |     let greeting = format!("Hello, {}!", name);
  |                                         ---- value moved here
4 |     println!("{}", name);
  |                    ^^^^ value borrowed here after move
  |
  = note: move occurs because `name` has type `String`,
    which does not implement the `Copy` trait
help: consider cloning the value before moving it
  |
3 |     let greeting = format!("Hello, {}!", name.clone());
  |                                             ++++++++
```

It tells you:
1. **What** you did wrong (`borrow of moved value`)
2. **Where** (file, line, column)
3. **Why** (move occurs because...)
4. **How** to fix it (`consider cloning`)

> 💡 **Pro tip**: Read Rust's error messages. Seriously. They're written by humans for humans. Many Rust developers say they learn the language *by reading the compiler's errors*.

---

**Checkpoint**: At this point you should know:
- Why Rust exists and who uses it
- The fundamental differences from Python
- How to declare variables, functions, and control flow
- How to use Cargo to create, compile, and test a project

> **Next**: The part that makes Rust *truly* different from every other language: Ownership, Borrowing, and Lifetimes.

---

## 5. Ownership, Borrowing, and Lifetimes

**One-liner**: In Rust, every value has exactly one owner. When the owner goes out of scope, the value is destroyed. You can *lend* (`&`) a value to someone else, but with precise rules: either many readers, or one writer. Never both. Lifetimes (`'a`) tell the compiler how long a reference is valid.

This is the part that drives beginners crazy. But if you understand it, you understand Rust.

### The Book Analogy

Imagine a library book:

- **Ownership**: You check out the book. Only you have it. If you hand it to a friend (`move`), you no longer have it. When you leave the library (`scope`), the book automatically returns to the shelf (`drop`).
- **Borrowing (`&T`)**: Your friend asks to read it for a moment. You hand it over, but it's still *yours*. They can only read it, not write in it.
- **Mutable Borrowing (`&mut T`)**: You let a friend write a margin note. But while they're doing that, nobody else can touch the book — not even you.
- **Lifetimes**: The librarian wants to make sure nobody has the book after closing time. Lifetimes are the stamp on the receipt.

### Ownership

```rust
// RULE 1: Every value has exactly ONE owner
let s1 = String::from("hello"); // s1 is the owner
let s2 = s1;                     // ownership TRANSFERRED to s2
// println!("{}", s1);           // ❌ ERROR: s1 no longer owns anything!
println!("{}", s2);              // ✅ OK: s2 is the owner
```

```rust
// RULE 2: When the owner goes out of scope, the value is destroyed
{
    let s = String::from("temporary");
    // s is alive here
} // ← s goes out of scope, memory is freed AUTOMATICALLY
// println!("{}", s); // ❌ ERROR: s no longer exists

// In Python you'd need the garbage collector.
// In C you'd need free(s). If you forget, memory leak.
// In Rust: automatic, deterministic, free.
```

### Move vs Copy

```rust
// Simple types (integers, bool, char) implement the Copy trait:
// they are COPIED automatically instead of being moved
let x = 5;
let y = x;   // x is copied — x is still valid!
println!("x = {}, y = {}", x, y); // ✅ OK for both

// Heap types (String, Vec) do NOT implement Copy:
// they are MOVED, not copied
let a = String::from("hello");
let b = a;   // a is MOVED — a is no longer valid
// println!("{}", a); // ❌ ERROR

// If you want a deep copy, use .clone()
let a = String::from("hello");
let b = a.clone();   // expensive: allocates new memory and copies data
println!("a = {}, b = {}", a, b); // ✅ OK for both
```

### Borrowing

Instead of transferring ownership, you can *lend* a value with `&`:

```rust
fn calculate_length(s: &String) -> usize {  // borrows, does NOT own
    s.len()
    // s is not destroyed here — it's not the owner
}

let name = String::from("Alice");
let length = calculate_length(&name);  // lend name to the function
println!("{} has {} letters", name, length); // ✅ name is still valid!
```

Without borrowing, you'd have to pass `name` and lose it:

```rust
fn devour_string(s: String) {  // takes OWNERSHIP
    println!("Yum yum: {}", s);
} // s is destroyed here

let name = String::from("Poor thing");
devour_string(name);
// println!("{}", name); // ❌ name has been eaten!
```

### Mutable Borrowing (`&mut`)

```rust
fn add_exclamation(s: &mut String) {
    s.push_str("!");     // can modify because it's &mut
}

let mut phrase = String::from("Hello");
add_exclamation(&mut phrase);
println!("{}", phrase);  // "Hello!"
```

### The Golden Rule of the Borrow Checker

> **EITHER many immutable readers (`&T`), OR one mutable writer (`&mut T`). NEVER both at the same time.**

```rust
let mut s = String::from("test");

let r1 = &s;      // ✅ immutable borrow #1
let r2 = &s;      // ✅ immutable borrow #2 (OK, many readers)
// let r3 = &mut s; // ❌ ERROR: can't have &mut while & are active
println!("{} {}", r1, r2);

// r1 and r2 are no longer used after println! — borrows expire here

let r3 = &mut s;  // ✅ OK: no other borrows active now
r3.push_str("!");
```

This rule prevents:
- **Data races**: two threads modifying the same data
- **Dangling pointers**: a reference to data that no longer exists
- **Unexpected mutations**: someone modifying data you're reading

### Lifetimes

Lifetimes answer the question: "Is this reference still valid?"

```rust
// ❌ Does NOT compile: Rust doesn't know which reference to return
fn longest(x: &str, y: &str) -> &str {
    if x.len() > y.len() { x } else { y }
}
```

The compiler sees two references in and one out. What lifetime does the output have? It doesn't know. You need to tell it:

```rust
// ✅ With explicit lifetime annotation
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}
```

`'a` means: "the returned reference lives at least as long as the shorter of `x` and `y`".

The annotation **doesn't change how long values live**. It just tells the compiler: "trust me, the result lives at least as long as both inputs."

### Lifetimes in Structs

```rust
// A struct containing a reference MUST declare the lifetime
struct Excerpt<'a> {
    part: &'a str,  // this reference lives at least 'a
}

let sentence = String::from("The best thing about Rust is the borrow checker.");
let first_part = &sentence[0..23];
let excerpt = Excerpt { part: first_part };
println!("{}", excerpt.part);
```

> 💡 **Don't go crazy with lifetimes.** 80% of the time, Rust infers them for you (lifetime elision). You write them explicitly in only three cases: (1) functions returning references with multiple reference parameters, (2) structs with references, (3) when the compiler asks you to.

---

**Checkpoint — Ownership**

> **Q:** What does this code print?
> ```rust
> let s1 = String::from("a");
> let s2 = s1;
> let s3 = s2.clone();
> println!("{}", s1);
> ```
> <details><summary>Answer</summary>
> ❌ Does NOT compile. `s1` was *moved* to `s2` — it's no longer valid. You can't use it. `.clone()` on `s2` creates an independent copy in `s3`, but `s1` is already lost.
> </details>

> **Q:** Why doesn't Rust have a garbage collector?
>
> <details><summary>Answer</summary>
> Because a garbage collector (1) consumes CPU to scan memory, (2) causes unpredictable pauses (stop-the-world), (3) makes it hard to write real-time systems. Rust frees memory *deterministically* when the owner goes out of scope — zero overhead, zero pauses.
> </details>

---

## 6. Error Handling and Exceptions

**One-liner**: In Rust, errors aren't "thrown." They're *returned*. `Result<T, E>` is an enum with two variants: `Ok(T)` for success and `Err(E)` for failure. `Option<T>` is similar but for "there or not there." The `?` operator is the magic wand: it propagates the error upward in a single line.

### Rust vs Python: The Philosophy

| Concept | Python | Rust |
|---|---|---|
| **Expected error** | `raise ValueError("...")` | `return Err(...)` |
| **Handling** | `try:` / `except ValueError as e:` | `match` on `Result` or `?` operator |
| **Fatal error** | unhandled exception → crash | `panic!("...")` — intentional crash |
| **Missing value** | `None` | `Option::None` |
| **The problem** | You can forget `except` → runtime crash | If you forget to handle `Result`, the compiler warns you |

> 🧠 **The analogy**: `Result` is like a box. You open it and inside you find either a gift (`Ok`) or a note explaining what went wrong (`Err`). You can't pretend the box is empty: you have to open it.

### `panic!` — When Everything Must Explode

`panic!` is for *unrecoverable* errors. If you hit a panic, the program stops. Period.

```rust
// Use panic! only when continuing would be dangerous or impossible
fn read_config() -> String {
    match std::fs::read_to_string("config.toml") {
        Ok(content) => content,
        Err(_) => panic!("Cannot start without config.toml!"),
    }
}

// Justified panics:
// - Index out of bounds on an array (programmer bug)
// - Missing config file in production
// - Division by zero in a context where handling it makes no sense
```

The rule: if the error is *your fault* (a bug), `panic!`. If it's *the outside world's fault* (missing file, network down), use `Result`.

### `Result<T, E>` — Standard Error Handling

```rust
use std::fs::File;
use std::io::Read;

fn read_file(name: &str) -> Result<String, std::io::Error> {
    let mut file = File::open(name)?;  // ? = if error, immediately return Err
    let mut content = String::new();
    file.read_to_string(&mut content)?;
    Ok(content)
}

// Usage: handle both cases
match read_file("data.txt") {
    Ok(text) => println!("Content: {}", text),
    Err(e) => println!("Error: {}", e),
}
```

### The `?` Operator — The Magic Wand

`?` is syntactic sugar for "if it's `Ok`, extract the value; if it's `Err`, immediately return the error to the calling function."

```rust
// WITHOUT ? (verbose)
fn load_config() -> Result<Config, Error> {
    let file = match File::open("config.json") {
        Ok(f) => f,
        Err(e) => return Err(e.into()),
    };
    let config: Config = match serde_json::from_reader(file) {
        Ok(c) => c,
        Err(e) => return Err(e.into()),
    };
    Ok(config)
}

// WITH ? (clean)
fn load_config() -> Result<Config, Error> {
    let file = File::open("config.json")?;
    let config: Config = serde_json::from_reader(file)?;
    Ok(config)
}
```

> 💡 `?` also does automatic error type conversion (if `From` is implemented). That's why we use `.into()` in the example without `?`.

### `Option<T>` — When Something Might Not Be There

`Option` is the replacement for `null`/`None`. Either it's there (`Some(value)`) or it's not (`None`). The compiler forces you to handle both.

```rust
fn find_user(name: &str) -> Option<User> {
    if name.is_empty() {
        None
    } else {
        Some(User { name: name.to_string() })
    }
}

// Exhaustive pattern matching
match find_user("Alice") {
    Some(u) => println!("Found: {}", u.name),
    None => println!("No user"),
}

// Shortcuts
let u = find_user("Alice").unwrap();          // 💥 panics if None
let u = find_user("Alice").expect("Help!");   // 💥 panics with message
let u = find_user("Alice").unwrap_or(User::default()); // default if None

// ? also works with Option!
fn greet(name: &str) -> Option<String> {
    let user = find_user(name)?;  // if None, return None
    Some(format!("Hello, {}!", user.name))
}
```

### `unwrap()` and Friends — The Ladder of Desperation

| Method | What it does | When to use it |
|---|---|---|
| `unwrap()` | Extracts `Ok`/`Some`, panics on `Err`/`None` | Only in tests or quick prototypes |
| `expect(msg)` | Like `unwrap()`, but with a custom error message | When you're *certain* it won't fail |
| `unwrap_or(default)` | Extracts or returns a default | When you have a sensible fallback |
| `unwrap_or_else(\|e\| ...)` | Extracts or computes a default with a closure | When the default needs to be computed |
| `unwrap_or_default()` | Extracts or uses `Default::default()` | For types that implement `Default` |

```rust
// Ladder of preference:
// 1. Handle with match → maximum control
// 2. Use ? to propagate → clean code
// 3. unwrap_or → sensible fallback
// 4. expect → when you're SURE
// 5. unwrap → only tests/prototypes
```

### Libraries: `anyhow` vs `thiserror`

Writing error types by hand is tedious. Two libraries solve this:

| Library | For | Pattern |
|---|---|---|
| **anyhow** | Application code (CLIs, scripts) | `anyhow::Result<T>` — flexible error, opaque type |
| **thiserror** | Libraries (shared code) | `#[derive(Error)]` — typed errors, pattern-matchable |

```rust
// anyhow: perfect for the CLI you'll build in section 10
use anyhow::{Result, Context};

fn process_file(name: &str) -> Result<String> {
    let content = std::fs::read_to_string(name)
        .with_context(|| format!("Cannot read '{}'", name))?;
    Ok(content)
}
// anyhow::Result<T> = Result<T, anyhow::Error>
// anyhow::Error can hold ANY error. Flexible, but not typed.
```

```rust
// thiserror: for when you want consumers of your code to know exactly what can go wrong
use thiserror::Error;

#[derive(Error, Debug)]
enum MyErrors {
    #[error("file '{0}' not found")]
    FileNotFound(String),
    #[error("corrupted data at line {line}")]
    CorruptedData { line: usize },
    #[error("internal error: {0}")]
    Internal(#[from] std::io::Error),  // automatic conversion from io::Error
}
```

> 🧠 **Rule of thumb**: Start with `anyhow` in `main.rs`. If you later create a separate library, use `thiserror` for public error types.

---

**Checkpoint — Error Handling**

> **Q:** When do you use `panic!` instead of `Result`?
>
> <details><summary>Answer</summary>
> `panic!` is for programmer bugs (index out of bounds, violated invariants). `Result` is for predictable external errors (missing file, parse failure, network down). If the error can happen in production without it being your fault, use `Result`.
> </details>

> **Q:** What does `?` do on an `Option`?
>
> <details><summary>Answer</summary>
> If it's `Some(value)`, it extracts `value`. If it's `None`, it immediately returns `None` from the current function. Only works in functions that return `Option<T>`.
> </details>

---

## 7. Design Patterns in Rust

**One-liner**: The patterns you know from other languages exist in Rust too, but the type system and ownership make them more powerful — and sometimes different. Here are the ones you'll use most.

### The Constructor: `new()` and the Builder Pattern

Rust doesn't have constructors like Python (`__init__`). By convention, you use an associated function `new()`:

```rust
struct Configuration {
    host: String,
    port: u16,
    debug: bool,
}

impl Configuration {
    // Standard constructor
    fn new(host: String, port: u16) -> Self {
        Self {
            host,
            port,
            debug: false,  // default
        }
    }
}

let cfg = Configuration::new("localhost".into(), 8080);
```

When you have many optional parameters, use the **Builder Pattern**:

```rust
struct ConfigurationBuilder {
    host: String,
    port: u16,
    debug: bool,
}

impl ConfigurationBuilder {
    fn new(host: &str) -> Self {
        Self { host: host.into(), port: 8080, debug: false }
    }

    fn port(mut self, p: u16) -> Self {
        self.port = p;
        self
    }

    fn debug(mut self, d: bool) -> Self {
        self.debug = d;
        self
    }

    fn build(self) -> Configuration {
        Configuration { host: self.host, port: self.port, debug: self.debug }
    }
}

// Fluent usage (method chaining)
let cfg = ConfigurationBuilder::new("localhost")
    .port(3000)
    .debug(true)
    .build();
```

> 💡 In Python you'd use `**kwargs` or dataclasses. In Rust the builder is more verbose but gives you 100% type safety: you can't pass a port that isn't `u16`.

### RAII — Resource Acquisition Is Initialization

In Rust, when a variable goes out of scope, its `Drop` is called. This pattern is called RAII and you use it *always*, even without noticing:

```rust
{
    let file = File::open("data.txt").unwrap();
    // use file...
} // ← file is closed AUTOMATICALLY here (drop)

// Python equivalent:
// with open("data.txt") as f:
//     # use f...
// # f closed automatically

// But in Rust it works for EVERYTHING: locks, sockets, DB connections, memory...
```

### Newtype Pattern

Wrap a primitive type in a struct to give it meaning and prevent errors:

```rust
// Without newtype: easy to confuse arguments
fn create_user(name: String, email: String, phone: String) { /* ... */ }

// With newtype: the compiler saves you
struct Name(String);
struct Email(String);
struct Phone(String);

fn create_user(name: Name, email: Email, phone: Phone) { /* ... */ }

// You can't pass an Email where a Name is expected:
create_user(Email("alice@example.com".into()), /* ... */); // ❌ type mismatch!
```

### `impl Trait` vs Generics

```rust
// Generics: the caller chooses the type
fn print<T: std::fmt::Display>(value: T) {
    println!("{}", value);
}

// impl Trait: simpler syntax for the same concept
fn print(value: impl std::fmt::Display) {
    println!("{}", value);
}

// Key difference: with impl Trait you CANNOT use the turbofish ::<>
print::<i32>(42);     // ✅ with generics
print(42);            // ✅ with impl Trait (type inferred)
// print::<i32>(42); // ❌ doesn't work with impl Trait
```

### Type-State Pattern

Use the type system to encode the state of an object. Ideal for builders or state machines:

```rust
// A builder that forces you to call methods in the right order
struct Draft;
struct Published;

struct Article<S> {
    title: String,
    _state: std::marker::PhantomData<S>,
}

impl Article<Draft> {
    fn new(title: &str) -> Self {
        Self { title: title.into(), _state: std::marker::PhantomData }
    }

    fn publish(self) -> Article<Published> {
        Article::<Published> { title: self.title, _state: std::marker::PhantomData }
    }
}

impl Article<Published> {
    fn archive(self) {
        println!("'{}' archived!", self.title);
    }
}

let article = Article::new("The Future of Rust");
let article = article.publish();  // now it's Published
article.archive();                // ✅ only Article<Published> can be archived
```

---

## 8. Good Parts & Bad Parts

Every language has its strengths and warts. Here's an honest assessment of Rust.

### ✅ Good Parts (What You'll Love)

| Strength | Why |
|---|---|
| **Memory safety without GC** | Zero use-after-free, double-free, null pointer. And without the cost of a garbage collector. It's Rust's superpower. |
| **Expressive type system** | Enums with data, exhaustive pattern matching, traits, generics. You encode business logic in types. |
| **Compiler as mentor** | The best error messages in the industry. It teaches you the language as you write it. |
| **Tooling ecosystem** | `cargo`, `rustfmt`, `clippy`, `rust-analyzer`, `cargo test`, `cargo doc`. All included, all consistent. |
| **Performance** | On par with C/C++. Zero-cost abstractions: generics and iterators are as fast as hand-written loops. |
| **Fearless concurrency** | `Send` and `Sync` traits prevent data races at compile time. Threads in Rust aren't scary. |
| **Welcoming community** | The Rust community is known for being inclusive, patient with beginners, and producing excellent documentation. |
| **WASM and embedded** | Rust compiles to WebAssembly and is used in embedded systems. The same language from browser to microcontroller. |

### ❌ Bad Parts (What Will Make You Bang Your Head)

| Weakness | Detail |
|---|---|
| **Steep learning curve** | Ownership, borrowing, lifetimes. The first weeks you fight the compiler. It's normal, but it's frustrating. |
| **Compile times** | Large projects compile slowly. `cargo check` helps (skips codegen), but linking remains slow. |
| **Young ecosystem** | Many libraries are version 0.x. Some domains (GUI, machine learning) have fewer options than Python. |
| **Complex async** | `async`/`await` in Rust is powerful but has hidden complexity: `Pin`, executors, choosing between `tokio` and `async-std`. |
| **Strings: a maze** | `&str`, `String`, `OsStr`, `Path`, `Cow<str>`... Strings in Rust are surprisingly complicated. |
| **Verbose** | Patterns like builder, newtype, type-state require more code than Python or TypeScript. |
| **Not suited for rapid prototyping** | If you need to explore an idea in 30 minutes, Python or JavaScript are better. Rust shines when the structure is clear. |

> 🧠 **The golden rule**: Use Rust when correctness and performance matter more than writing speed. Use Python when iteration speed matters more than compile-time correctness.

---

## 9. Testing in Rust

**One-liner**: In Rust, tests are first-class citizens. You write them in the same file as the code (unit tests) or in a `tests/` directory (integration tests). `cargo test` runs everything. No plugins, no external frameworks.

### Unit Tests (Inline)

Tests go in a `#[cfg(test)]` module at the bottom of the file:

```rust
// src/lib.rs (or src/main.rs)
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

pub fn divide(a: f64, b: f64) -> Option<f64> {
    if b == 0.0 { None } else { Some(a / b) }
}

#[cfg(test)]  // compiled only in test mode
mod tests {
    use super::*;  // import everything from the parent module

    #[test]
    fn test_add() {
        assert_eq!(add(2, 2), 4);
        assert_eq!(add(-1, 1), 0);
    }

    #[test]
    fn test_divide_ok() {
        assert_eq!(divide(10.0, 2.0), Some(5.0));
    }

    #[test]
    fn test_divide_by_zero() {
        assert_eq!(divide(10.0, 0.0), None);
    }

    #[test]
    #[should_panic(expected = "attempt to divide")]
    fn test_panic_on_invalid_input() {
        panic!("attempt to divide by zero not allowed");
    }
}
```

### Assertions

```rust
assert!(x > 0);                          // boolean condition
assert_eq!(got, expected);               // equality (uses PartialEq)
assert_ne!(got, not_expected);           // inequality
assert!(result.is_ok());                 // for Result
```

> 💡 `assert_eq!` requires the type to implement `Debug` and `PartialEq`. Most standard types do.

### Integration Tests

Integration tests go in the `tests/` directory (outside `src/`). They test your library as an external consumer would:

```rust
// tests/integration_test.rs
use my_project::add;  // import from your library

#[test]
fn test_integration() {
    assert_eq!(add(100, 200), 300);
}
```

### Running Tests

```bash
# All tests
cargo test

# Only tests with a specific name
cargo test test_add

# Tests in single-thread mode (if tests share state)
cargo test -- --test-threads=1

# Show println! output even in passing tests
cargo test -- --show-output

# Ignore tests marked #[ignore]
cargo test

# Run ONLY tests marked #[ignore]
cargo test -- --ignored
```

### Test Organization Best Practices

```
my_project/
├── src/
│   ├── lib.rs          # public code + #[cfg(test)] mod tests
│   └── main.rs         # entry point (no tests here, test the lib)
├── tests/
│   └── integration_test.rs  # end-to-end tests
```

**Rule**: Unit tests live in `lib.rs` alongside the code. Integration tests live in `tests/`. `main.rs` usually has no tests — it only contains bootstrap logic.

---

**Checkpoint — Design, Truth, and Tests**

> **Q:** When do you use the Builder Pattern instead of a simple `new()`?
>
> <details><summary>Answer</summary>
> When you have more than 3-4 parameters, many of which are optional. The builder makes code readable (`Config::new().port(3000).debug(true).build()`) and prevents argument-swapping errors.
> </details>

> **Q:** Where do you put tests that test the library using only its public API?
>
> <details><summary>Answer</summary>
> In `tests/`. Tests there see only the public API, exactly like an external user. Tests in `src/` with `#[cfg(test)]` can access private functions — use those to test internal details.
> </details>

---

## 10. Project: Let's Build `docrepo` — A CLI Document Repository

**One-liner**: You'll build a command-line tool that manages a collection of documents on the filesystem. You'll learn to structure a real Rust project: argument parsing with `clap`, JSON serialization with `serde`, error handling with `anyhow`, and testing.

![docrepo architecture](docrepo-arch.png)

### What `docrepo` Does

```bash
# Initialize a new repository in the current folder
docrepo init

# Add a document
docrepo add report.pdf --tags "school, project"

# List all documents
docrepo list
docrepo list --tag school

# Search titles and tags
docrepo search report

# Remove a document by ID
docrepo remove abc123
```

The repository is a `.docrepo/` directory containing an `index.json` file with metadata. Original documents stay where they are — `docrepo` only keeps references and metadata.

### Project Structure

```
docrepo/
├── Cargo.toml
├── src/
│   ├── main.rs        # entry point: CLI parsing, command dispatch
│   ├── repo.rs        # repository logic: init, add, list, search, remove
│   └── models.rs      # data structures: Document, Index
└── tests/
    └── integration_test.rs
```

### Step 1: Cargo.toml

```toml
[package]
name = "docrepo"
version = "0.1.0"
edition = "2021"

[dependencies]
clap = { version = "4.5", features = ["derive"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
anyhow = "1.0"
uuid = { version = "1.0", features = ["v4"] }
chrono = { version = "0.4", features = ["serde"] }

[dev-dependencies]
tempfile = "3.0"
```

### Step 2: Data Models (`src/models.rs`)

```rust
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Document {
    pub id: String,
    pub title: String,
    pub path: String,           // relative path to the original file
    pub tags: Vec<String>,
    pub added_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Index {
    pub documents: Vec<Document>,
    pub version: u32,
}

impl Index {
    pub fn new() -> Self {
        Self {
            documents: Vec::new(),
            version: 1,
        }
    }
}
```

### Step 3: Repository Logic (`src/repo.rs`)

```rust
use std::path::{Path, PathBuf};
use anyhow::{Result, Context, bail};
use uuid::Uuid;
use chrono::Utc;
use crate::models::{Document, Index};

const REPO_DIR: &str = ".docrepo";
const INDEX_FILE: &str = "index.json";

fn repo_path() -> PathBuf {
    PathBuf::from(REPO_DIR)
}

fn index_path() -> PathBuf {
    repo_path().join(INDEX_FILE)
}

// --- init ---
pub fn init() -> Result<()> {
    let repo = repo_path();
    if repo.exists() {
        bail!("Repository already initialized in this directory");
    }
    std::fs::create_dir(&repo)
        .context("Cannot create .docrepo directory")?;

    let index = Index::new();
    save_index(&index)?;

    println!("✅ Repository initialized in .docrepo/");
    Ok(())
}

// --- add ---
pub fn add(file_path: &str, tags: Vec<String>) -> Result<()> {
    let path = Path::new(file_path);
    if !path.exists() {
        bail!("File '{}' not found", file_path);
    }

    let title = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or(file_path)
        .to_string();

    let doc = Document {
        id: Uuid::new_v4().to_string(),
        title,
        path: path.canonicalize()?.to_string_lossy().into_owned(),
        tags,
        added_at: Utc::now(),
    };

    let mut index = load_index()?;
    index.documents.push(doc);
    save_index(&index)?;

    println!("✅ Document '{}' added", file_path);
    Ok(())
}

// --- list ---
pub fn list(tag_filter: Option<&str>) -> Result<()> {
    let index = load_index()?;

    let docs: Vec<&Document> = match tag_filter {
        Some(tag) => index.documents.iter()
            .filter(|d| d.tags.iter().any(|t| t == tag))
            .collect(),
        None => index.documents.iter().collect(),
    };

    if docs.is_empty() {
        println!("No documents found.");
        return Ok(());
    }

    for doc in docs {
        println!("📄 {} — {}", &doc.id[..8], doc.title);
        if !doc.tags.is_empty() {
            println!("   Tags: {}", doc.tags.join(", "));
        }
    }

    Ok(())
}

// --- search ---
pub fn search(query: &str) -> Result<()> {
    let index = load_index()?;
    let query_lower = query.to_lowercase();

    let results: Vec<&Document> = index.documents.iter()
        .filter(|d| {
            d.title.to_lowercase().contains(&query_lower)
            || d.tags.iter().any(|t| t.to_lowercase().contains(&query_lower))
        })
        .collect();

    if results.is_empty() {
        println!("No results for '{}'", query);
        return Ok(());
    }

    println!("Results for '{}':", query);
    for doc in results {
        println!("  📄 {} — {}", &doc.id[..8], doc.title);
    }

    Ok(())
}

// --- remove ---
pub fn remove(id: &str) -> Result<()> {
    let mut index = load_index()?;
    let id_prefix = id.to_lowercase();

    let pos = index.documents.iter()
        .position(|d| d.id.to_lowercase().starts_with(&id_prefix));

    match pos {
        Some(idx) => {
            let removed = index.documents.remove(idx);
            save_index(&index)?;
            println!("✅ Removed '{}'", removed.title);
        }
        None => bail!("No document found with ID '{}'", id),
    }

    Ok(())
}

// --- internal helpers ---
fn load_index() -> Result<Index> {
    let path = index_path();
    if !path.exists() {
        bail!("Repository not initialized. Run 'docrepo init' first.");
    }
    let content = std::fs::read_to_string(&path)
        .context("Cannot read index.json")?;
    let index: Index = serde_json::from_str(&content)
        .context("index.json is corrupted")?;
    Ok(index)
}

fn save_index(index: &Index) -> Result<()> {
    let json = serde_json::to_string_pretty(index)?;
    std::fs::write(index_path(), json)?;
    Ok(())
}
```

### Step 4: Entry Point (`src/main.rs`)

```rust
mod models;
mod repo;

use clap::{Parser, Subcommand};

#[derive(Parser)]
#[command(name = "docrepo")]
#[command(about = "Manage a document repository", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand)]
enum Command {
    /// Initialize a new repository
    Init,
    /// Add a document
    Add {
        /// Path to the file to add
        file: String,
        /// Comma-separated tags
        #[arg(short, long, value_delimiter = ',')]
        tags: Vec<String>,
    },
    /// List all documents
    List {
        /// Filter by tag
        #[arg(short, long)]
        tag: Option<String>,
    },
    /// Search documents by title or tag
    Search {
        /// Search query
        query: String,
    },
    /// Remove a document by ID
    Remove {
        /// ID (or prefix) of the document
        id: String,
    },
}

fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Command::Init => repo::init()?,
        Command::Add { file, tags } => repo::add(&file, tags)?,
        Command::List { tag } => repo::list(tag.as_deref())?,
        Command::Search { query } => repo::search(&query)?,
        Command::Remove { id } => repo::remove(&id)?,
    }

    Ok(())
}
```

### Step 5: Integration Tests (`tests/integration_test.rs`)

```rust
use std::process::Command;
use tempfile::TempDir;
use std::fs;

fn run(args: &[&str], dir: &TempDir) -> std::process::Output {
    Command::new(env!("CARGO_BIN_EXE_docrepo"))
        .args(args)
        .current_dir(dir.path())
        .output()
        .expect("Failed to execute docrepo")
}

#[test]
fn test_init() {
    let dir = TempDir::new().unwrap();
    let output = run(&["init"], &dir);
    assert!(output.status.success());
    assert!(dir.path().join(".docrepo").exists());
}

#[test]
fn test_add_and_list() {
    let dir = TempDir::new().unwrap();

    // init
    run(&["init"], &dir);

    // create a fake file
    let file_path = dir.path().join("test.txt");
    fs::write(&file_path, "content").unwrap();

    // add
    let output = run(&["add", file_path.to_str().unwrap(), "--tags", "test,course"], &dir);
    assert!(output.status.success());

    // list
    let output = run(&["list"], &dir);
    let stdout = String::from_utf8_lossy(&output.stdout);
    assert!(stdout.contains("test.txt"));
}

#[test]
fn test_search() {
    let dir = TempDir::new().unwrap();
    run(&["init"], &dir);

    let file_path = dir.path().join("report.pdf");
    fs::write(&file_path, "pdf").unwrap();
    run(&["add", file_path.to_str().unwrap(), "--tags", "school"], &dir);

    let output = run(&["search", "report"], &dir);
    let stdout = String::from_utf8_lossy(&output.stdout);
    assert!(stdout.contains("report.pdf"));
}
```

### Build and Try

```bash
# In the docrepo/ directory
cargo build

# Try it out
./target/debug/docrepo init
./target/debug/docrepo add README.md --tags rust,cli
./target/debug/docrepo list
./target/debug/docrepo search rust
./target/debug/docrepo remove <id-prefix>

# Run tests
cargo test

# Optimized release build
cargo build --release
./target/release/docrepo init
```

### Concepts Applied

This project brings together everything you've learned:

| Section | Where it appears in `docrepo` |
|---|---|
| **3. Syntax** | Structs, enums, `match`, `Vec<String>`, `impl` blocks |
| **4. Cargo** | `Cargo.toml` with dependencies, `cargo build`, `cargo test` |
| **5. Ownership** | `&str` vs `String`, borrowing in parameters, `to_string()` |
| **6. Error Handling** | `anyhow::Result`, `?` operator, `.context()`, `bail!` |
| **7. Design Patterns** | `Index::new()` as constructor, RAII with `TempDir` |
| **9. Testing** | Integration tests in `tests/`, `cargo test` |

---

## 🎉 You Made It!

You've completed **Rust from Zero to Hero**. You now know:

- Why Rust exists and what makes it special
- How it differs from Python (and why it's worth it)
- The fundamental syntax and how to use Cargo
- Ownership, borrowing, and lifetimes — the heart of Rust
- Handling errors with `Result`, `Option`, and the `?` operator
- The most useful design patterns and the uncomfortable truths about Rust
- Writing unit and integration tests
- Building a complete, working CLI

**Where to go from here?**

- 📖 [The Rust Book](https://doc.rust-lang.org/book/) — the official bible, free
- 🦀 [Rust by Example](https://doc.rust-lang.org/rust-by-example/) — learn by doing
- 🏗️ [Rustlings](https://github.com/rust-lang/rustlings) — interactive exercises in the terminal
- 🎮 [Build a game in Rust](https://arewegameyet.rs) — why not?

> 🧠 **Final advice**: Don't try to learn everything at once. Write code. Make mistakes. Fight with the compiler (and learn to love it). That's how you really learn Rust. Happy coding! 🦀
