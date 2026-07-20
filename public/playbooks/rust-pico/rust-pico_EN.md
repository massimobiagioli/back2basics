# Bare Metal Rust for the Raspberry Pi Pico

There comes a moment in every programmer's life when you realize that underneath all the frameworks, browsers and operating systems there is… a chip. A piece of silicon switching wires on and off. "Bare metal" means programming that chip **directly**, with no operating system in the way: no Linux, no processes, no `println`. Just your code and the hardware. It sounds terrifying, but with a **Raspberry Pi Pico** costing a few euros and **Rust**, this world turns out to be surprisingly welcoming. In this playbook we'll build, piece by piece, a real **temperature datalogger**: a device that reads a sensor, stores the data and ships it over Wi-Fi. No hardware prerequisites: if you've seen a little Rust, you're ready.

---

## 1. What "bare metal" is, and why Rust

**In a nutshell**: bare metal means your program is the **only** thing running on the chip. There's no operating system lending you memory, managing files or printing to a screen: you either build those comforts yourself, or do without them.

When you write a program for your computer, there's a huge operating system underneath acting as a middleman: it opens files, allocates memory, gives you a terminal. On a microcontroller like the Pico, **none of that exists**. Your code is loaded into a chip with 264 KB of RAM and starts on its own, the instant you power it up.

🧠 **Analogy**: writing a normal app is like cooking in a fully-equipped kitchen — there's an oven, a fridge, running water. Bare metal programming is like cooking while camping: you've got a single burner and that's it. Want hot water? You heat it yourself. It's more work, but you understand *exactly* what's going on, and you depend on no one.

Why use Rust instead of good old C, which ruled this world for 40 years?

| | C | Rust |
|---|---|---|
| **Memory errors** | At your own risk: one bad pointer locks up the chip silently | The compiler catches them *before* the code is even flashed |
| **Concurrency** | Easy to write race conditions that are hell to track down | The type system makes many race conditions impossible |
| **Dependencies** | Hand-crafted Makefiles, libraries copied by hand | `cargo` and `crates.io`, just like "normal" Rust |
| **Abstractions** | Costly or absent | "Zero-cost": you pay only for what you use, like in C |

> 💡 **Tip**: on a microcontroller a memory bug doesn't hand you a friendly error screen — the device simply freezes, or worse, behaves at random. That's why the guarantees Rust gives you *at compile time* are worth even more here than on a PC.

---

## 2. The star: Raspberry Pi Pico W

**In a nutshell**: the Pico is a board the size of a pencil eraser, with a microcontroller, a bit of memory and two rows of pins (the **GPIOs**) you connect sensors and actuators to. The "W" version adds Wi-Fi.

At its heart is the **RP2040** chip: two ARM Cortex-M0+ cores, 264 KB of RAM, and no mass storage except an external **flash** (usually 2 MB) where your program lives. No disk, no screen, no keyboard. There's only:

- **GPIO** (General Purpose Input/Output): pins you can set to "on" (3.3V) or "off" (0V), or read to know whether something set them on/off.
- **Communication buses**: groups of pins with precise rules for talking to sensors. The most common are **I2C**, **SPI** and **UART**.
- **CYW43** (Pico W only): a second chip that handles Wi-Fi and Bluetooth.

🧠 **Analogy**: think of the Pico as a control box with lots of sockets. The GPIOs are generic "on/off" sockets. Buses like I2C are "smart" sockets that follow a protocol — a bit like the difference between a light switch and a USB port: both carry power, but USB can also *talk* to whatever you plug in.

For our datalogger we need very little: the Pico W, an **AHT20** temperature sensor, and four wires. That's it.

> 💡 **Tip**: there's also the newer **Pico 2** (RP2350 chip), more powerful. Everything you see in this playbook works on both by changing a couple of configuration lines — the Rust ecosystem supports them both.

---

## 3. `no_std`: Rust without the safety net

**In a nutshell**: the Rust you know leans on the standard library (`std`) for files, threads, printing and memory allocation. On bare metal that library doesn't exist, so you work with `#![no_std]`: a stripped-down but surprisingly complete version.

Every bare-metal Rust program starts with two odd lines:

```rust
#![no_std]   // no standard library: there's no OS to implement it
#![no_main]  // no classic main() function: we define the "start" ourselves
```

What do you lose with `no_std`? The things that require an operating system:

| You lose (needs the OS) | You keep (`core`, always available) |
|---|---|
| `String`, `Vec`, `HashMap` (they allocate memory) | `&str`, fixed-size arrays, slices |
| `println!`, files, "classic" networking | All the math, the types, `Option`/`Result` |
| Operating-system threads | The ownership model and traits |

No `Vec`? It's scary at first, but you get used to it: you use fixed-size arrays (`[u8; 32]`) or, if you truly need dynamic allocation, you add one with the `heapless` crate (which offers fixed-capacity `Vec` and `String`, no heap required).

🧠 **The golden rule**: `no_std` isn't "crippled Rust", it's "Rust without the parts that assume a full computer". The **borrow checker**, the types, `Result`, pattern matching — everything that makes Rust *Rust* — is still there, working for you. You lose the conveniences, you keep the guarantees.

And printing to a screen? Since there's no terminal, you use **`defmt`**: an ultra-lightweight logging system that sends messages to the PC through the debug cable.

```rust
use defmt::info;

info!("Temperature read: {} degrees", temp);
```

---

## 4. Embassy: async, even on a microcontroller

**In a nutshell**: **Embassy** is a framework that brings Rust's `async/await` to bare metal. It lets you *make* code that's really waiting on hardware events *look* sequential, without wasting energy on busy-waiting.

The classic embedded problem: you must read a sensor every 10 seconds, listen to Wi-Fi and blink an LED — all at once, on a single core (or two), with no operating system. The traditional C answer is a maze of interrupts and hand-written state machines. Embassy uses Rust's `async` instead:

```rust
use embassy_executor::Spawner;
use embassy_time::{Duration, Timer};

#[embassy_executor::main]
async fn main(spawner: Spawner) {
    let p = embassy_rp::init(Default::default());

    // Start two "tasks" that run in parallel, cooperating
    spawner.spawn(blink_led(p.PIN_25.into())).unwrap();
    spawner.spawn(read_sensor()).unwrap();
}

#[embassy_executor::task]
async fn blink_led(led: /* ... */) {
    loop {
        // "wait 500ms" does NOT block the chip: while you wait,
        // the other tasks can work
        Timer::after(Duration::from_millis(500)).await;
    }
}
```

🧠 **Analogy**: without Embassy, a chip "waiting 10 seconds" is like a waiter staring at the clock until the 10 seconds pass, serving no other table. With Embassy's `async`, that `.await` is like a waiter who, while a dish cooks, goes off to take orders from other tables. One waiter (core), but not a second wasted.

The beauty is that under the hood that `.await` puts the chip into a low-power mode until the hardware wakes it up — essential for a battery-powered device.

> 💡 **Tip**: Embassy isn't the only way to do embedded in Rust (there's also the "bare" approach with the `cortex-m-rt` crate and infinite loops), but for a project with Wi-Fi and several concurrent activities it's by far the most comfortable. It's become the de-facto standard of the ecosystem.

---

## 5. Reading the AHT20 sensor over I2C

**In a nutshell**: **I2C** is a protocol that lets several devices talk over just two wires. Each device has an "address", and the Pico acts as the conductor who asks each one for its data in turn.

Our **AHT20** sensor measures temperature and humidity and speaks I2C. The two wires are:

- **SDA** (Serial Data): the actual data.
- **SCL** (Serial Clock): the "metronome" that dictates when to read each bit.

🧠 **Analogy**: I2C is like a phone line shared by a whole apartment building. Each tenant (sensor) has a number (address); the Pico "calls" the sensor's number, asks "what have you got?", and the sensor answers. With just two wires you can have a dozen different sensors, each with its own address.

In Rust we don't talk to the AHT20 byte by byte: we use a ready-made **driver crate** that hides the protocol details behind readable functions.

```rust
use embassy_rp::i2c::{self, I2c};
use embassy_rp::peripherals::I2C0;

#[embassy_executor::task]
async fn read_sensor(i2c: I2c<'static, I2C0, i2c::Async>) {
    // The driver crate exposes the sensor as an object
    let mut sensor = aht20::Aht20::new(i2c).await.unwrap();

    loop {
        let reading = sensor.measure().await.unwrap();
        info!(
            "Temperature: {} C, Humidity: {} %",
            reading.temperature,
            reading.humidity
        );
        Timer::after(Duration::from_secs(10)).await;
    }
}
```

> 💡 **Tip**: the great value of the Rust embedded ecosystem is the **`embedded-hal`** trait: a common "standard" that both sensor drivers and every board's implementation adhere to. The result: the same AHT20 driver runs on a Pico, an STM32 or an ESP32 without changing a line. It's the equivalent of a universal socket.

---

## 6. Storing data in flash with `sequential-storage`

**In a nutshell**: the Pico has no disk, but it does have **flash memory** (the same place the program lives). We can use a slice of it to save the latest readings and the configuration, so they survive a reboot or a power loss.

There's a catch: flash doesn't behave like a file. It has awkward rules:

- You can only write by erasing **whole blocks** at a time (not a single byte).
- Each cell survives a limited number of erasures before wearing out (tens of thousands).

If we always wrote to the same cell, we'd burn it out fast. The solution is called **wear leveling**: spreading the writes across the whole available area.

🧠 **Analogy**: always writing to the same spot in flash is like walking over the same patch of a lawn a thousand times: you carve a rut and ruin the grass. Wear leveling is like taking a different path each time: the lawn stays green far longer.

Luckily we don't have to implement it by hand: the **`sequential-storage`** crate offers two ready-made abstractions, both with wear leveling built in:

| Abstraction | What it does in our datalogger |
|---|---|
| **map** (key→value) | Store the **configuration**: Wi-Fi network name, MQTT broker address… |
| **queue** | Store the **last N** temperature readings, in chronological order |

```rust
// Push a reading into the flash-backed queue
queue::push(
    &mut flash,
    FLASH_RANGE,          // the slice of flash we reserved for it
    &mut cache,
    &reading.to_bytes(),  // the serialized data
    false,
).await.unwrap();
```

> 💡 **Tip**: reserving the right slice of flash is crucial — it must sit *after* your program, otherwise you overwrite the code. The memory configuration (the `memory.x` file) defines these boundaries. Getting them wrong is one of the most classic embedded beginner mistakes.

---

## 7. Wi-Fi: first I configure you, then I connect you

**In a nutshell**: the Pico W has a chicken-and-egg problem — to join your home Wi-Fi it needs the password, but with no screen and no keyboard, how do we hand it over? The elegant solution: on its first boot, the Pico *becomes a Wi-Fi network itself*.

The Pico W's **CYW43** chip can do two opposite jobs:

1. **Access Point (AP)**: it creates its own Wi-Fi network, which you join with your phone. The Pico serves a little web page where you type your network's name and password. This is the **first-boot** mode.
2. **Client (Station)**: it connects to an existing Wi-Fi network — the one you just configured. This is the **normal**, everyday mode.

🧠 **Analogy**: it's like a new employee on day one. At first *they* ask *you* questions ("where do I sign? what's the Wi-Fi password?") — that's Access Point mode. Once set up, they get to work quietly and stop bothering you — that's Client mode.

Once on the network, the Pico needs a "network stack" to speak TCP/IP. Enter **`embassy-net`**, which handles IP addresses, DHCP and connections, all in `async` style.

The final step: shipping the readings. We use **MQTT**, an ultra-lightweight protocol designed specifically for IoT devices. The Pico "publishes" temperatures to a **topic** (a kind of themed channel), and anyone interested — a dashboard, an app — "subscribes" to that topic and receives them.

```rust
// Publish the temperature to an MQTT topic
client.send_message(
    "home/livingroom/temperature",   // the topic
    b"21.5",                          // the value
    QoS::AtLeastOnce,
    false,
).await.unwrap();
```

🧠 **The golden rule**: MQTT works by **publish and subscribe**, not by request and response. The Pico doesn't know (and doesn't care) who reads its temperatures: it just publishes them. Zero, one, or a hundred dashboards can listen to the same topic at once. This decoupling is what makes MQTT the IoT standard.

---

## 8. The full picture: the datalogger

**In a nutshell**: let's put all the pieces together. Every building block we've seen — sensor, Embassy, flash, Wi-Fi, MQTT — takes its place in a single coherent architecture.

![Datalogger architecture on the Raspberry Pi Pico W](datalogger-arch.png)

Here's the flow, following the figure:

1. The **AHT20 sensor** measures temperature and humidity and sends them to the Pico over **I2C** (the two SDA/SCL wires).
2. The **Pico W**, running bare-metal Rust with Embassy, orchestrates everything: one task reads the sensor every N seconds, another handles the network.
3. Readings (and the configuration) land in the **internal flash** via `sequential-storage`, so they survive reboots.
4. On **first boot**, the Pico becomes an **Access Point**: you connect with your phone and give it the Wi-Fi password through a configuration page.
5. After configuration, the Pico becomes a **Wi-Fi client** and connects to the **MQTT broker**.
6. The broker forwards the temperatures to any **dashboard or app** that has subscribed to the topic.

> 💡 **Tip**: notice how each component does **one thing only**. This isn't just elegance: on a chip with 264 KB of RAM, small, well-separated tasks are easier to fit in memory, to test and to debug. The same "Unix" philosophy as Bash pipes, applied to silicon.

### From code to chip: how to flash it

```bash
# 1. Add the compile target for the Pico's ARM core
rustup target add thumbv6m-none-eabi

# 2. Build and flash in one go with probe-rs
#    (you need a second Pico as a debug "probe", or a debug probe)
cargo run --release

# Alternatively, with no probe: hold BOOTSEL, plug in USB,
# and the Pico shows up as a flash drive. Copy the .uf2 file onto it and it reboots.
```

> 💡 **Tip**: **`probe-rs`** is the tool that changes your life in embedded Rust: it flashes the firmware, shows you `defmt` logs in real time and lets you set breakpoints, like a normal debugger. It's worth the investment of a second Pico used as a probe.

---

## 9. Good parts, Bad parts

**In a nutshell**: bare-metal Rust is wonderful for some things and awkward for others. Knowing where the line sits saves you weeks of frustration.

### The "good parts"

| Strength | Why it matters |
|---|---|
| **No silent crashes** | The borrow checker eliminates, up front, the memory errors that are a debugging nightmare on C chips |
| **`async` with Embassy** | Readable, low-power concurrency, without C's interrupt maze |
| **`cargo` and `crates.io`** | Adding a driver or a library is one line in `Cargo.toml`, just like normal Rust |
| **`embedded-hal`** | The same code runs on different boards with barely any changes |
| **Zero-cost abstractions** | High-level, readable code that compiles down to instructions as efficient as C |

### The "bad parts"

| Where it hurts | The reality |
|---|---|
| **A double learning curve** | You have to learn Rust *and* embedded concepts (interrupts, registers, memory maps) at the same time |
| **A younger ecosystem than C** | For exotic hardware the ready-made driver may be missing: you have to write it |
| **Cryptic error messages** | Linker errors, or async type errors on bare metal, can be baffling |
| **No `Vec` by default** | You have to reason ahead about how much memory you use (which is also a virtue) |

🧠 **The golden rule**: the pain of embedded Rust is almost all *up front* — the first project setup, the first blinking LED, the first `memory.x`. Get past that hurdle and every subsequent feature (adding a sensor, Wi-Fi, flash) is surprisingly linear, because the compiler holds your hand. In C it's the opposite: you start fast, but you pay the bug bill later.

> 💡 **Tip**: the professionals' rule of thumb is "prototype with MicroPython or the C SDK if you just need to *see whether the idea works*, but switch to bare-metal Rust the moment the project has to become reliable and last over time". Rust shines when a device must stay on for months without locking up.

---

## In summary

1. **Bare metal means no operating system**: your code is the only thing running on the chip, and the comforts (memory, prints, files) you either build or do without.
2. **`no_std` is Rust without the parts that assume a full computer** — you lose `Vec` and `println`, but you keep the borrow checker and all the guarantees that make Rust safe.
3. **Embassy brings `async/await` to the microcontroller**: readable, low-power concurrency, without C's interrupt maze.
4. **Sensors are read over buses like I2C**, and driver crates + `embedded-hal` hide the protocol details behind clean functions.
5. **Flash is used with `sequential-storage`**, which handles wear leveling itself so you don't burn out the memory.
6. **The Pico W's Wi-Fi does two jobs**: Access Point to configure itself on first boot, then client to publish data over MQTT.
7. **The pain of embedded Rust is all up front**: once the first setup is done, each new piece slots in with surprising ease.

Now grab that few-euro Pico, solder on four wires, and make the silicon talk. 🦀
