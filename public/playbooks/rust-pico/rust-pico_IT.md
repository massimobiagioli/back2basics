# Bare Metal Rust per Raspberry Pi Pico

C'è un momento, nella vita di ogni programmatore, in cui ti accorgi che sotto tutti i framework, i browser e i sistemi operativi c'è… un chip. Un pezzo di silicio che accende e spegne dei fili. "Bare metal" (metallo nudo) significa programmare quel chip **direttamente**, senza sistema operativo di mezzo: niente Linux, niente processi, niente `println`. Solo il tuo codice e l'hardware. Sembra terrificante, ma con un **Raspberry Pi Pico** da pochi euro e **Rust** questo mondo diventa sorprendentemente accogliente. In questo playbook costruiamo insieme, pezzo per pezzo, un vero **datalogger di temperatura**: un dispositivo che legge un sensore, salva i dati e li spedisce via Wi-Fi. Nessun prerequisito hardware: se hai già visto un po' di Rust, sei pronto.

---

## 1. Cos'è il "bare metal" e perché Rust

**In pillole**: bare metal vuol dire che il tuo programma è l'**unica** cosa in esecuzione sul chip. Non c'è un sistema operativo che ti presta la memoria, gestisce i file o stampa a schermo: quelle comodità le devi costruire tu, oppure farne a meno.

Quando scrivi un programma per il tuo computer, sotto di te c'è un sistema operativo enorme che fa da intermediario: apre file, alloca memoria, ti dà un terminale. Su un microcontrollore come il Pico, **non c'è niente di tutto questo**. Il tuo codice viene caricato in un chip da 264 KB di RAM e parte da solo, all'accensione.

🧠 **Analogia**: programmare un'app normale è come cucinare in una cucina attrezzata — c'è il forno, il frigo, l'acqua corrente. Programmare bare metal è come cucinare in campeggio: hai un fornello e basta. Se vuoi l'acqua calda te la scaldi tu. È più faticoso, ma capisci *davvero* cosa succede, e non dipendi da nessuno.

Perché usare Rust invece del classico C, che ha dominato questo mondo per 40 anni?

| | C | Rust |
|---|---|---|
| **Errori di memoria** | A tuo rischio: un puntatore sbagliato blocca il chip in silenzio | Il compilatore li blocca *prima* di caricare il codice |
| **Concorrenza** | Facile scrivere race condition difficilissime da trovare | Il sistema dei tipi rende molte race condition impossibili |
| **Dipendenze** | Makefile artigianali, librerie copiate a mano | `cargo` e `crates.io`, come nel Rust "normale" |
| **Astrazioni** | Costose o assenti | "Zero-cost": paghi solo ciò che usi, come in C |

> 💡 **Tip**: su un microcontrollore un bug di memoria non ti dà una comoda schermata d'errore — il dispositivo semplicemente si blocca, o peggio, si comporta in modo casuale. Ecco perché le garanzie che Rust ti dà *a tempo di compilazione* valgono qui ancora più che sul PC.

---

## 2. Il protagonista: Raspberry Pi Pico W

**In pillole**: il Pico è una schedina grande come una gomma da matita, con un microcontrollore, un po' di memoria e due file di piedini (i **GPIO**) a cui colleghi sensori e attuatori. La versione "W" aggiunge il Wi-Fi.

Il cuore è il chip **RP2040**: due core ARM Cortex-M0+, 264 KB di RAM, e nessuna memoria di massa se non una **flash** esterna (di solito 2 MB) dove vive il tuo programma. Non c'è disco, non c'è schermo, non c'è tastiera. C'è solo:

- **GPIO** (General Purpose Input/Output): piedini che puoi mettere a "acceso" (3.3V) o "spento" (0V), o leggere per sapere se qualcuno li ha messi a acceso/spento.
- **Bus di comunicazione**: gruppi di piedini con regole precise per parlare con i sensori. I più comuni sono **I2C**, **SPI** e **UART**.
- **CYW43** (solo sul Pico W): un secondo chip che gestisce il Wi-Fi e il Bluetooth.

🧠 **Analogia**: pensa al Pico come a una centralina con tante prese. I GPIO sono prese generiche "on/off". I bus come l'I2C sono prese "intelligenti" che seguono un protocollo — un po' come la differenza tra un interruttore della luce e una presa USB: entrambe danno corrente, ma la USB sa anche *dialogare* con ciò che colleghi.

Per il nostro datalogger ci serve poco: il Pico W, un sensore di temperatura **AHT20**, e quattro fili. Tutto qui.

> 💡 **Tip**: esiste anche il più recente **Pico 2** (chip RP2350), più potente. Tutto quello che vedi in questo playbook funziona su entrambi cambiando un paio di righe di configurazione — l'ecosistema Rust li supporta entrambi.

---

## 3. `no_std`: Rust senza rete di protezione

**In pillole**: il Rust che conosci si appoggia alla "standard library" (`std`) per file, thread, stampe e allocazione di memoria. Sul bare metal quella libreria non esiste, quindi lavori con `#![no_std]`: una versione ridotta ma sorprendentemente completa.

Ogni programma bare metal in Rust inizia con due righe strane:

```rust
#![no_std]   // niente standard library: non c'è un OS che la implementi
#![no_main]  // niente funzione main() classica: la "partenza" la definiamo noi
```

Cosa perdi con `no_std`? Le cose che richiedono un sistema operativo:

| Perdi (richiede l'OS) | Ti resta (`core`, sempre disponibile) |
|---|---|
| `String`, `Vec`, `HashMap` (allocano memoria) | `&str`, array a dimensione fissa, slice |
| `println!`, file, rete "classica" | Tutta la matematica, i tipi, gli `Option`/`Result` |
| Thread del sistema operativo | Il modello di ownership e i trait |

Niente `Vec`? All'inizio spaventa, ma ci si abitua: usi array di dimensione nota (`[u8; 32]`) o, se ti serve davvero l'allocazione dinamica, aggiungi un allocatore con la crate `heapless` (che offre `Vec` e `String` a capacità fissa, senza heap).

🧠 **La regola d'oro**: `no_std` non è "Rust monco", è "Rust senza le parti che presuppongono un computer completo". Il **borrow checker**, i tipi, i `Result`, i pattern match — cioè tutto ciò che rende Rust *Rust* — sono ancora lì, al lavoro per te. Perdi le comodità, tieni le garanzie.

E la stampa a schermo? Non esistendo un terminale, si usa **`defmt`**: un sistema di log ultraleggero che manda i messaggi al PC attraverso il cavo di debug.

```rust
use defmt::info;

info!("Temperatura letta: {} gradi", temp);
```

---

## 4. Embassy: async anche sul microcontrollore

**In pillole**: **Embassy** è un framework che porta l'`async/await` di Rust sul bare metal. Ti permette di far "sembrare" sequenziale del codice che in realtà aspetta eventi hardware, senza sprecare energia in attese attive.

Il problema classico dell'embedded: devi leggere un sensore ogni 10 secondi, ascoltare il Wi-Fi e far lampeggiare un LED — tutto insieme, con un solo core (o due), senza sistema operativo. La risposta tradizionale in C è un labirinto di interrupt e macchine a stati scritte a mano. Embassy usa invece l'`async` di Rust:

```rust
use embassy_executor::Spawner;
use embassy_time::{Duration, Timer};

#[embassy_executor::main]
async fn main(spawner: Spawner) {
    let p = embassy_rp::init(Default::default());

    // Avvia due "task" che girano in parallelo, cooperando
    spawner.spawn(lampeggia_led(p.PIN_25.into())).unwrap();
    spawner.spawn(leggi_sensore()).unwrap();
}

#[embassy_executor::task]
async fn lampeggia_led(led: /* ... */) {
    loop {
        // "aspetta 500ms" NON blocca il chip: mentre aspetti,
        // gli altri task possono lavorare
        Timer::after(Duration::from_millis(500)).await;
    }
}
```

🧠 **Analogia**: senza Embassy, il chip che "aspetta 10 secondi" è come un cameriere che fissa l'orologio finché non passano i 10 secondi, senza servire nessun altro tavolo. Con l'`async` di Embassy, quel `.await` è come un cameriere che, mentre un piatto cuoce, va a prendere le ordinazioni degli altri tavoli. Un solo cameriere (core), ma nessun secondo sprecato.

Il bello è che quel `.await`, sotto il cofano, mette il chip in modalità a basso consumo finché l'hardware non lo sveglia — fondamentale per un dispositivo a batteria.

> 💡 **Tip**: Embassy non è l'unico modo di fare embedded in Rust (esiste anche l'approccio "bare" con la crate `cortex-m-rt` e i loop infiniti), ma per un progetto con Wi-Fi e più attività concorrenti è di gran lunga il più comodo. È diventato di fatto lo standard dell'ecosistema.

---

## 5. Il primo progetto completo: LED blink passo-passo

**In pillole**: il "Hello World" dell'embedded è far lampeggiare un LED. Costruiamo il progetto **completo** da zero — struttura dei file, dipendenze, codice e caricamento — così vedi con i tuoi occhi come sta in piedi un vero progetto bare metal. Ogni progetto successivo (sensore, Wi-Fi, datalogger) è solo questo scheletro con più carne intorno.

Un progetto Pico in Rust è fatto di **quattro file** che lavorano insieme. Vediamoli uno per uno.

### Passo 1 — Creare il progetto

```bash
cargo new pico-blink        # crea la cartella con lo scheletro standard
cd pico-blink
rustup target add thumbv6m-none-eabi   # il "target" del core ARM Cortex-M0+ del Pico
```

Il target `thumbv6m-none-eabi` dice a Rust: "non compilare per il mio PC, ma per un processore ARM Cortex-M0+ **senza sistema operativo**" (`none`). È la traduzione tecnica di "bare metal".

### Passo 2 — Le dipendenze (`Cargo.toml`)

```toml
[dependencies]
embassy-executor = { version = "0.6", features = ["arch-cortex-m", "executor-thread"] }
embassy-time     = "0.3"
embassy-rp       = { version = "0.2", features = ["rp2040"] }   # l'HAL del chip
cortex-m-rt      = "0.7"     # il codice di avvio del core ARM
defmt            = "0.3"     # i log leggeri
defmt-rtt        = "0.4"     # li manda al PC via cavo di debug
panic-probe      = { version = "0.3", features = ["print-defmt"] }
```

**HAL** sta per *Hardware Abstraction Layer*: la crate `embassy-rp` è la libreria che conosce i dettagli del chip RP2040 (dove sono i GPIO, come si accende un pin) e te li espone con funzioni pulite, così non devi scrivere sui registri a mano.

### Passo 3 — Dire a Cargo come compilare (`.cargo/config.toml`)

```toml
[build]
target = "thumbv6m-none-eabi"     # così non devi ripeterlo a ogni comando

[target.thumbv6m-none-eabi]
# cosa esegue `cargo run`: carica il firmware sul chip con probe-rs
runner = "probe-rs run --chip RP2040"
rustflags = [
  "-C", "link-arg=--nmagic",
  "-C", "link-arg=-Tlink.x",     # usa lo script di link di cortex-m-rt
  "-C", "link-arg=-Tdefmt.x",    # e quello di defmt
]
```

### Passo 4 — La mappa della memoria (`memory.x`)

Il chip non sa da solo dove mettere il codice e i dati: glielo diciamo noi, con una "mappa" della sua memoria.

```text
MEMORY {
    BOOT2 : ORIGIN = 0x10000000, LENGTH = 0x100
    FLASH : ORIGIN = 0x10000100, LENGTH = 2048K - 0x100
    RAM   : ORIGIN = 0x20000000, LENGTH = 264K
}
```

🧠 **Analogia**: `memory.x` è la piantina della casa che dai al trasloco. "Il codice va in questa stanza (FLASH), le variabili in quest'altra (RAM), e attenzione: i primi 256 byte sono riservati al portiere (BOOT2, il codice che avvia il chip)." Senza questa piantina, il linker non sa dove sistemare le cose.

### Passo 5 — Il codice (`src/main.rs`)

```rust
#![no_std]   // niente standard library (vedi sezione 3)
#![no_main]  // la "partenza" la definisce Embassy, non un main() classico

use embassy_executor::Spawner;
use embassy_rp::gpio::{Level, Output};
use embassy_time::{Duration, Timer};
// Queste due righe "attivano" il logger e il gestore dei panic.
// La `as _` significa "importa solo per gli effetti collaterali".
use {defmt_rtt as _, panic_probe as _};

#[embassy_executor::main]
async fn main(_spawner: Spawner) {
    // 1. Inizializza i "peripherals": tutto l'hardware del chip diventa
    //    disponibile in `p`. Da qui in poi prendiamo da `p` i pin che ci servono.
    let p = embassy_rp::init(Default::default());

    // 2. Sul Pico (non-W) il LED integrato è cablato al GPIO 25.
    //    Lo configuriamo come USCITA, partendo da spento (Level::Low).
    let mut led = Output::new(p.PIN_25, Level::Low);

    // 3. Il ciclo infinito: un dispositivo embedded non "finisce" mai.
    //    Non c'è un OS a cui restituire il controllo: il loop È il programma.
    loop {
        led.set_high();                                   // accendi il LED (3.3V)
        Timer::after(Duration::from_millis(500)).await;   // aspetta mezzo secondo
        led.set_low();                                    // spegni il LED (0V)
        Timer::after(Duration::from_millis(500)).await;   // aspetta mezzo secondo
    }
}
```

Leggiamolo riga per riga:

- **`#![no_std]` / `#![no_main]`** — dichiariamo un programma bare metal, senza standard library e senza il `main()` classico.
- **`use {defmt_rtt as _, panic_probe as _};`** — non usiamo direttamente questi due nomi, ma includerli "accende" il logger e definisce cosa succede in caso di panic. Senza `panic-probe`, il compilatore si lamenterebbe che manca un gestore dei panic (in `no_std` non ce n'è uno di default).
- **`embassy_rp::init(...)`** — accende e prepara tutto l'hardware del chip, e ce lo consegna nella variabile `p`.
- **`Output::new(p.PIN_25, Level::Low)`** — prende il pin 25 e lo trasforma in un'uscita digitale. Il tipo di Rust ci impedisce, per esempio, di leggere da un pin che abbiamo dichiarato come uscita: un errore che in C passa liscio, qui non compila proprio.
- **Il `loop`** — accende, aspetta, spegne, aspetta, per sempre. Quel `.await` sul `Timer` è la magia di Embassy: mentre "aspetta", il chip non gira a vuoto ma va in risparmio energetico.

> ⚠️ **Attenzione Pico W**: sul Pico **W** il LED integrato **non** è sul GPIO 25 — è collegato al chip Wi-Fi CYW43 (te lo ricordi dalla sezione 2?). Per farlo lampeggiare devi prima inizializzare il driver `cyw43` e poi usare `control.gpio_set(0, true).await`. Per imparare, parti con un Pico normale o con un LED esterno collegato a un GPIO qualsiasi: eviti questa complicazione al primo giro.

### Passo 6 — Caricarlo sul chip

```bash
cargo run --release
```

Questo comando compila, e poi il `runner` che abbiamo messo in `.cargo/config.toml` (`probe-rs`) carica il firmware sul Pico e ti mostra i log in tempo reale. Se non hai una sonda di debug, l'alternativa è tenere premuto il tasto **BOOTSEL** mentre colleghi l'USB: il Pico appare come una chiavetta, e ci trascini dentro il file `.uf2` generato.

🧠 **La regola d'oro**: questi **quattro file** — `Cargo.toml`, `.cargo/config.toml`, `memory.x`, `src/main.rs` — sono lo scheletro di *ogni* progetto Pico in Rust, dal blink al datalogger più complesso. Cambia solo il contenuto di `main.rs` e la lista delle dipendenze. Una volta che il primo LED lampeggia, la parte più ostica è già alle tue spalle.

---

## 6. Leggere il sensore AHT20 via I2C

**In pillole**: **I2C** è un protocollo che fa dialogare più dispositivi su appena due fili. Ogni dispositivo ha un "indirizzo", e il Pico fa da direttore d'orchestra che chiede i dati a turno.

Il nostro sensore **AHT20** misura temperatura e umidità e parla I2C. I due fili sono:

- **SDA** (Serial Data): i dati veri e propri.
- **SCL** (Serial Clock): il "metronomo" che scandisce quando leggere ogni bit.

🧠 **Analogia**: l'I2C è come una linea telefonica condivisa da un intero condominio. Ogni inquilino (sensore) ha un numero (indirizzo); il Pico "chiama" il numero del sensore, gli chiede "quanto fa?", e il sensore risponde. Con due soli fili puoi avere una decina di sensori diversi, ognuno con il suo indirizzo.

In Rust non parliamo all'AHT20 byte per byte: usiamo una **crate driver** già pronta, che nasconde i dettagli del protocollo dietro funzioni leggibili.

```rust
use embassy_rp::i2c::{self, I2c};
use embassy_rp::peripherals::I2C0;

#[embassy_executor::task]
async fn leggi_sensore(i2c: I2c<'static, I2C0, i2c::Async>) {
    // La crate driver espone il sensore come un oggetto
    let mut sensore = aht20::Aht20::new(i2c).await.unwrap();

    loop {
        let misura = sensore.measure().await.unwrap();
        info!(
            "Temperatura: {} C, Umidita: {} %",
            misura.temperature,
            misura.humidity
        );
        Timer::after(Duration::from_secs(10)).await;
    }
}
```

> 💡 **Tip**: il grande valore dell'ecosistema Rust embedded è il trait **`embedded-hal`**: uno "standard" comune a cui aderiscono sia i driver dei sensori sia le implementazioni di ogni scheda. Risultato: lo stesso driver dell'AHT20 funziona su Pico, su un STM32 o su un ESP32 senza cambiare una riga. È l'equivalente di una presa universale.

---

## 7. Salvare i dati nella flash con `sequential-storage`

**In pillole**: il Pico non ha un disco, ma ha la **memoria flash** (quella dove vive il programma). Possiamo usarne una porzione per salvare le ultime letture e la configurazione, così sopravvivono anche a un riavvio o a un'interruzione di corrente.

C'è un tranello: la flash non si comporta come un file. Ha regole scomode:

- Si scrive solo cancellando **interi blocchi** alla volta (non un byte singolo).
- Ogni cella sopporta un numero limitato di cancellazioni prima di usurarsi (decine di migliaia).

Se scrivessimo sempre nella stessa cella, la bruceremmo in fretta. La soluzione si chiama **wear leveling** (distribuzione dell'usura): spargere le scritture su tutta l'area disponibile.

🧠 **Analogia**: scrivere sempre nello stesso punto della flash è come camminare mille volte sullo stesso punto di un prato: fai un solco e rovini l'erba. Il wear leveling è come cambiare percorso ogni volta: il prato resta verde molto più a lungo.

Fortunatamente non dobbiamo implementarlo a mano: la crate **`sequential-storage`** offre due astrazioni pronte, entrambe con wear leveling incluso:

| Astrazione | A cosa serve nel nostro datalogger |
|---|---|
| **map** (chiave→valore) | Salvare la **configurazione**: nome della rete Wi-Fi, indirizzo del broker MQTT... |
| **queue** (coda) | Salvare le **ultime N letture** di temperatura, in ordine cronologico |

```rust
// Salva una lettura nella coda in flash
queue::push(
    &mut flash,
    FLASH_RANGE,          // la porzione di flash che gli abbiamo riservato
    &mut cache,
    &lettura.to_bytes(),  // i dati serializzati
    false,
).await.unwrap();
```

> 💡 **Tip**: riservare la porzione giusta di flash è cruciale — deve stare *dopo* il tuo programma, altrimenti sovrascrivi il codice. La configurazione della memoria (il file `memory.x`) definisce questi confini. Sbagliarli è uno degli errori più classici del principiante embedded.

---

## 8. Wi-Fi: prima ti configuro, poi ti connetto

**In pillole**: il Pico W ha un problema d'uovo e gallina — per connettersi al Wi-Fi di casa ha bisogno della password, ma senza schermo né tastiera come gliela diamo? La soluzione elegante: al primo avvio il Pico *diventa lui stesso* una rete Wi-Fi.

Il chip **CYW43** del Pico W sa fare due mestieri opposti:

1. **Access Point (AP)**: crea una sua rete Wi-Fi, a cui ti colleghi col telefono. Il Pico serve una piccola pagina web dove scrivi il nome della tua rete e la password. È la modalità del **primo avvio**.
2. **Client (Station)**: si connette a una rete Wi-Fi esistente — quella che gli hai appena configurato. È la modalità **normale**, di tutti i giorni.

🧠 **Analogia**: è come un nuovo dipendente al primo giorno. All'inizio è *lui* a farti delle domande ("dove firmo? qual è la password del Wi-Fi?") — è in modalità Access Point. Una volta configurato, si mette al lavoro in silenzio e non ti disturba più — è in modalità Client.

Una volta connesso alla rete, il Pico ha bisogno di uno "stack di rete" per parlare TCP/IP. Qui entra **`embassy-net`**, che gestisce indirizzi IP, DHCP e connessioni, sempre in stile `async`.

L'ultimo passo: spedire le letture. Usiamo **MQTT**, un protocollo leggerissimo pensato apposta per i dispositivi IoT. Il Pico "pubblica" le temperature su un **topic** (una specie di canale tematico), e chiunque sia interessato — una dashboard, un'app — si "sottoscrive" a quel topic e le riceve.

```rust
// Pubblica la temperatura su un topic MQTT
client.send_message(
    "casa/soggiorno/temperatura",   // il topic
    b"21.5",                          // il valore
    QoS::AtLeastOnce,
    false,
).await.unwrap();
```

🧠 **La regola d'oro**: MQTT funziona per **pubblicazione e sottoscrizione**, non per domande e risposte. Il Pico non sa (e non gli importa) chi legga le sue temperature: le pubblica e basta. Zero, una o cento dashboard possono ascoltare lo stesso topic contemporaneamente. Questo disaccoppiamento è ciò che rende MQTT lo standard dell'IoT.

---

## 9. Il quadro completo: il datalogger

**In pillole**: mettiamo insieme tutti i pezzi. Ognuno dei mattoncini che abbiamo visto — sensore, Embassy, flash, Wi-Fi, MQTT — occupa il suo posto in un'unica architettura coerente.

![Architettura del datalogger su Raspberry Pi Pico W](datalogger-arch.png)

Ecco il flusso, seguendo la figura:

1. Il **sensore AHT20** misura temperatura e umidità e le manda al Pico via **I2C** (i due fili SDA/SCL).
2. Il **Pico W**, con Rust bare metal ed Embassy, orchestra tutto: un task legge il sensore ogni N secondi, un altro gestisce la rete.
3. Le letture (e la configurazione) finiscono nella **flash interna** tramite `sequential-storage`, così sopravvivono ai riavvii.
4. Al **primo avvio**, il Pico si fa **Access Point**: ti connetti col telefono e gli dai la password del Wi-Fi tramite una pagina di configurazione.
5. Dopo la configurazione, il Pico diventa **client Wi-Fi** e si connette al **broker MQTT**.
6. Il broker inoltra le temperature a qualunque **dashboard o app** si sia sottoscritta al topic.

> 💡 **Tip**: nota come ogni componente fa **una cosa sola**. Questo non è solo eleganza: su un chip con 264 KB di RAM, task piccoli e ben separati sono più facili da far stare in memoria, da testare e da debuggare. La stessa filosofia "Unix" delle pipe di Bash, applicata al silicio.

### Il codice, tutto insieme

Come faranno due task (uno che legge il sensore, uno che gestisce la rete) a scambiarsi le letture senza pestarsi i piedi? La risposta di Embassy è un **canale** (`Channel`): una struttura sicura per far viaggiare dati da un task all'altro.

```rust
#![no_std]
#![no_main]

use embassy_executor::Spawner;
use embassy_rp::i2c::{self, I2c};
use embassy_rp::peripherals::I2C0;
use embassy_sync::blocking_mutex::raw::ThreadModeRawMutex;
use embassy_sync::channel::Channel;
use embassy_time::{Duration, Timer};
use defmt::info;
use {defmt_rtt as _, panic_probe as _};

// Una lettura del sensore: il "pacchetto" che viaggia fra i task.
#[derive(Clone, Copy)]
struct Lettura {
    temperatura: f32,
    umidita: f32,
}

// Il canale che collega chi PRODUCE letture a chi le CONSUMA.
// Capienza 8: se il consumatore è lento, fino a 8 letture restano in coda.
static CANALE: Channel<ThreadModeRawMutex, Lettura, 8> = Channel::new();

#[embassy_executor::main]
async fn main(spawner: Spawner) {
    // 1. Accendi l'hardware (come nel blink della sezione 5)
    let p = embassy_rp::init(Default::default());

    // 2. Prepara l'I2C per il sensore (SDA = GPIO4, SCL = GPIO5)
    let i2c = I2c::new_async(p.I2C0, p.PIN_5, p.PIN_4, Irqs, i2c::Config::default());

    // 3. Avvia i due task. main() finisce QUI, ma i task continuano
    //    a girare da soli: è l'executor di Embassy a farli avanzare.
    spawner.spawn(task_sensore(i2c)).unwrap();
    spawner.spawn(task_persisti_e_pubblica()).unwrap();
}

// PRODUTTORE — legge il sensore ogni 10 secondi e mette la lettura sul canale
#[embassy_executor::task]
async fn task_sensore(i2c: I2c<'static, I2C0, i2c::Async>) {
    let mut sensore = aht20::Aht20::new(i2c).await.unwrap();
    loop {
        let m = sensore.measure().await.unwrap();
        // `send` deposita la lettura sul "nastro trasportatore".
        // Se il canale è pieno, aspetta (in risparmio energetico) che si liberi.
        CANALE.send(Lettura {
            temperatura: m.temperature,
            umidita: m.humidity,
        }).await;
        Timer::after(Duration::from_secs(10)).await;
    }
}

// CONSUMATORE — aspetta le letture, le salva in flash e le pubblica via MQTT
#[embassy_executor::task]
async fn task_persisti_e_pubblica() {
    // ...qui va la connessione Wi-Fi (AP → client) e il client MQTT,
    //    come descritto nella sezione 8...
    loop {
        // `receive` si blocca (a costo zero) finché non arriva una lettura.
        let lettura = CANALE.receive().await;

        // 1. Salva in flash con sequential-storage: sopravvive ai riavvii
        // queue::push(&mut flash, FLASH_RANGE, &mut cache,
        //             &lettura.to_bytes(), false).await.unwrap();

        // 2. Pubblica su MQTT verso il broker
        // client.send_message("casa/soggiorno/temperatura",
        //                     b"21.5", QoS::AtLeastOnce, false).await.unwrap();

        info!("Lettura gestita: {} C", lettura.temperatura);
    }
}
```

Seguiamo il percorso di un singolo dato, passo per passo:

1. **`main` fa solo il cablaggio.** Inizializza l'hardware, prepara l'I2C, avvia i due task e… finisce. Non c'è un `loop` in `main`: la vita del programma sta tutta dentro i task. Questo è il cuore del modello Embassy.
2. **Il `task_sensore` produce.** Ogni 10 secondi legge l'AHT20 e mette una `Lettura` sul canale con `CANALE.send(...)`. Non sa (e non gli importa) chi la userà.
3. **Il canale disaccoppia i due mondi.** È il "nastro trasportatore": il produttore ci appoggia sopra le letture, il consumatore le raccoglie quando è pronto. Se il consumatore è impegnato (per esempio sta riconnettendo il Wi-Fi), le letture si accumulano in coda invece di perdersi.
4. **Il `task_persisti_e_pubblica` consuma.** Con `CANALE.receive().await` aspetta — dormendo, senza sprecare corrente — finché non arriva una lettura. Quando arriva, la **salva in flash** (così è al sicuro anche se il Wi-Fi cade) e la **pubblica via MQTT**.
5. **Il broker fa il resto.** Da lì in poi, come abbiamo visto nella sezione 8, chiunque sia sottoscritto al topic riceve il dato.

🧠 **La regola d'oro**: il pattern **produttore → canale → consumatore** è la spina dorsale di quasi ogni progetto Embassy. Separare "chi genera i dati" da "chi li elabora" con un canale in mezzo rende ogni pezzo semplice da leggere, da testare e da modificare — e fa sì che un pezzo lento (la rete) non blocchi mai un pezzo che deve essere puntuale (il sensore).

> 💡 **Tip**: per caricare tutto sul chip vale esattamente la procedura vista nel blink (sezione 5): `cargo run --release` con `probe-rs`, oppure il file `.uf2` tenendo premuto BOOTSEL. Lo scheletro del progetto (`Cargo.toml`, `.cargo/config.toml`, `memory.x`) è lo stesso: cambiano solo le dipendenze in più (il driver del sensore, `cyw43`, `embassy-net`, il client MQTT, `sequential-storage`) e il contenuto di `main.rs`.

---

## 10. Good parts, Bad parts

**In pillole**: il Rust bare metal è meraviglioso per certe cose e scomodo per altre. Sapere dove sta il confine ti risparmia settimane di frustrazione.

### Le "good parts"

| Punto di forza | Perché conta |
|---|---|
| **Nessun crash silenzioso** | Il borrow checker elimina in partenza gli errori di memoria che sui chip C sono un incubo da debuggare |
| **`async` con Embassy** | Concorrenza leggibile e a basso consumo, senza il labirinto di interrupt del C |
| **`cargo` e `crates.io`** | Aggiungere un driver o una libreria è una riga in `Cargo.toml`, come nel Rust normale |
| **`embedded-hal`** | Lo stesso codice gira su schede diverse cambiando pochissimo |
| **Astrazioni a costo zero** | Codice ad alto livello e leggibile che compila in istruzioni efficienti quanto il C |

### Le "bad parts"

| Dove fa male | La realtà |
|---|---|
| **Curva d'apprendimento doppia** | Devi imparare *insieme* Rust e i concetti embedded (interrupt, registri, memory map) |
| **Ecosistema più giovane del C** | Per hardware esotico può mancare il driver pronto: tocca scriverlo |
| **Messaggi d'errore ostici** | Gli errori del linker o dei tipi async, sul bare metal, sanno essere criptici |
| **Niente `Vec` per default** | Devi ragionare in anticipo su quanta memoria usi (che però è anche una virtù) |

🧠 **La regola d'oro**: la fatica del Rust embedded è quasi tutta *all'inizio* — la prima configurazione del progetto, il primo LED che lampeggia, il primo `memory.x`. Superato quello scoglio, ogni funzionalità successiva (aggiungere un sensore, il Wi-Fi, la flash) è sorprendentemente lineare, perché il compilatore ti prende per mano. In C è il contrario: parti in fretta, ma paghi il conto dei bug più avanti.

> 💡 **Tip**: la regola pratica dei professionisti è "prototipa con MicroPython o l'SDK C se devi solo *vedere se l'idea funziona*, ma passa a Rust bare metal appena il progetto deve diventare affidabile e durare nel tempo". Rust brilla quando il dispositivo deve restare acceso mesi senza bloccarsi.

---

## In sintesi

1. **Bare metal significa nessun sistema operativo**: il tuo codice è l'unica cosa che gira sul chip, e le comodità (memoria, stampe, file) le costruisci o ne fai a meno.
2. **`no_std` è Rust senza le parti che presuppongono un computer completo** — perdi `Vec` e `println`, ma tieni il borrow checker e tutte le garanzie che rendono Rust sicuro.
3. **Embassy porta l'`async/await` sul microcontrollore**: concorrenza leggibile e a basso consumo, senza il labirinto di interrupt del C.
4. **Ogni progetto Pico in Rust è fatto di quattro file** — `Cargo.toml`, `.cargo/config.toml`, `memory.x`, `main.rs` — e il blink del LED è il modo migliore per vederli in azione la prima volta.
5. **I sensori si leggono via bus come l'I2C**, e le crate driver + `embedded-hal` nascondono i dettagli del protocollo dietro funzioni pulite.
6. **La flash si usa con `sequential-storage`**, che gestisce da sé il wear leveling per non bruciare la memoria.
7. **Il Wi-Fi del Pico W fa due mestieri**: Access Point per configurarsi al primo avvio, poi client per pubblicare i dati via MQTT.
8. **Il pattern produttore → canale → consumatore** tiene insieme il datalogger: il sensore produce, un canale disaccoppia, il task di rete consuma, salva e pubblica.

Ora prendi quel Pico da pochi euro, saldaci quattro fili, e fai parlare il silicio. 🦀
