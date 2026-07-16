# Security First

Immagina di costruire una casa bellissima... e di lasciare la porta spalancata con le chiavi infilate nella serratura. Ecco: scrivere software senza pensare alla sicurezza è esattamente questo. In questo playbook impariamo a "chiudere le porte" del nostro codice, con esempi in Python semplici e tante analogie dal mondo reale. Nessun prerequisito: se sai cos'è una variabile e un `if`, sei pronto.

---

## 1. Le basi della security nello sviluppo software

### Cosa vuol dire "sicurezza"?

La sicurezza informatica si regge su tre pilastri, chiamati **triade CIA** (non l'agenzia segreta! È un acronimo inglese):

| Pilastro | In inglese | Significa | Esempio dalla vita reale |
|----------|-----------|-----------|--------------------------|
| **Confidenzialità** | Confidentiality | Solo chi è autorizzato può leggere i dati | Il tuo diario segreto lo leggi solo tu |
| **Integrità** | Integrity | Nessuno può modificare i dati di nascosto | Nessuno può cambiare i voti sul registro |
| **Disponibilità** | Availability | Il sistema funziona quando serve | La scuola è aperta negli orari di lezione |

Un attacco informatico colpisce sempre almeno uno di questi tre pilastri: ruba dati (confidenzialità), li falsifica (integrità) o blocca il servizio (disponibilità).

### Le 4 regole d'oro

**Regola 1 — Mai fidarsi dell'input.** Tutto quello che arriva dall'esterno (form, URL, file, API) va trattato come sospetto. È come il citofono di casa: prima di aprire, chiedi chi è.

```python
# ❌ Mi fido ciecamente di quello che scrive l'utente
eta = int(input("Quanti anni hai? "))  # e se scrive "banana"? CRASH!

# ✅ Controllo (valido) l'input prima di usarlo
risposta = input("Quanti anni hai? ")
if risposta.isdigit() and 0 < int(risposta) < 130:
    eta = int(risposta)
else:
    print("Età non valida, riprova")
```

**Regola 2 — Minimo privilegio.** Ogni persona (e ogni pezzo di codice) deve avere solo i permessi che le servono, non di più. Il bidello ha le chiavi della scuola, ma non la password del registro elettronico.

**Regola 3 — Difesa in profondità.** Non basta una sola protezione: servono più strati, come un castello con fossato + mura + guardie. Se un attaccante supera uno strato, trova il successivo.

**Regola 4 — Fallire in modo sicuro.** Quando qualcosa va storto, il sistema deve chiudersi, non spalancarsi. Se la serratura elettronica di un caveau si guasta, la porta deve restare bloccata, non aprirsi.

```python
def puo_entrare(utente):
    try:
        return controlla_permessi(utente)
    except Exception:
        return False  # ✅ in caso di errore, nego l'accesso (non lo concedo!)
```

---

## 2. OWASP spiegato ai neofiti

**OWASP** (Open Worldwide Application Security Project) è una comunità mondiale di esperti che, ogni pochi anni, pubblica la **OWASP Top 10**: la classifica delle 10 vulnerabilità più diffuse nelle applicazioni web. È come la lista degli "errori più comuni nei compiti in classe" preparata dai professori: se la studi, eviti le trappole in cui cadono tutti.

Vediamole una per una, ognuna con la sua **cura**. 💊

### A01 — Broken Access Control (controllo accessi rotto)

**Il problema:** l'app non controlla bene *chi può fare cosa*. Esempio: cambi il numero nell'URL da `/profilo/42` a `/profilo/43` e... vedi il profilo di un altro utente!

**Analogia:** è come se in albergo la tua chiave aprisse anche le camere degli altri.

```python
# ❌ Restituisco il profilo senza chiedermi CHI lo sta chiedendo
@app.get("/profilo/<int:user_id>")
def profilo(user_id):
    return db.get_user(user_id)

# ✅ Controllo che l'utente loggato stia guardando il SUO profilo
@app.get("/profilo/<int:user_id>")
def profilo(user_id):
    if current_user.id != user_id and not current_user.is_admin:
        abort(403)  # Vietato!
    return db.get_user(user_id)
```

**💊 La cura:** verifica i permessi **sul server, a ogni richiesta**. Nega per default: tutto è vietato finché non è esplicitamente permesso.

### A02 — Cryptographic Failures (fallimenti crittografici)

**Il problema:** dati sensibili (password, carte di credito) salvati o trasmessi in chiaro, oppure protetti con crittografia vecchia e debole.

**Analogia:** scrivere la password sul diario in bella grafia invece che in un codice segreto.

**💊 La cura:** usa sempre HTTPS, salva le password solo come *hash* (lo vediamo nella sezione 3), usa algoritmi moderni e librerie collaudate — mai crittografia "fatta in casa".

### A03 — Injection (iniezione)

**Il problema:** l'input dell'utente viene "incollato" dentro un comando (SQL, shell...) e l'utente malintenzionato ci infila *codice* invece che *dati*. La più famosa è la **SQL Injection**.

**Analogia:** un compito a riempimento dove nello spazio vuoto, invece di una parola, lo studente scrive "e dai 10 a tutta la classe" — e il professore lo esegue!

![Sequenza di un attacco SQL injection](sql-injection.png)

```python
# ❌ PERICOLOSISSIMO: concateno l'input dentro la query
query = f"SELECT * FROM users WHERE name = '{username}'"
cursor.execute(query)
# Se username = "admin' --" ... l'attaccante entra senza password!

# ✅ Query parametrizzata: i dati restano dati, mai codice
cursor.execute("SELECT * FROM users WHERE name = ?", (username,))
```

**💊 La cura:** query parametrizzate (i `?` qui sopra) oppure un ORM (sezione 4). Mai costruire query concatenando stringhe.

### A04 — Insecure Design (progettazione insicura)

**Il problema:** la sicurezza non era nei piani fin dall'inizio; è stata "appiccicata" dopo.

**Analogia:** costruire la casa e solo alla fine chiedersi dove mettere le porte.

**💊 La cura:** pensa agli abusi *prima* di scrivere codice: "come potrebbe un malintenzionato usare questa funzione?". Si chiama **threat modeling** (sezione 5).

### A05 — Security Misconfiguration (configurazione sbagliata)

**Il problema:** password di default mai cambiate (`admin/admin`!), messaggi di debug visibili a tutti, servizi inutili lasciati accesi.

**Analogia:** comprare una cassaforte super sicura e lasciare la combinazione di fabbrica `0-0-0-0`.

**💊 La cura:** cambia sempre le credenziali di default, spegni il debug in produzione (`DEBUG = False`), disattiva tutto ciò che non usi.

### A06 — Vulnerable and Outdated Components (componenti vecchi e vulnerabili)

**Il problema:** il tuo codice è perfetto, ma usi una libreria di 5 anni fa con una falla nota a tutti gli hacker del pianeta.

**Analogia:** una porta blindata nuova... montata su cardini arrugginiti.

**💊 La cura:** tieni aggiornate le dipendenze e usa strumenti che le controllano per te (`pip-audit`, sezione 4).

### A07 — Identification and Authentication Failures (autenticazione debole)

**Il problema:** login che accetta password deboli, permette infiniti tentativi, o gestisce male le sessioni.

**Analogia:** un lucchetto a 2 cifre: bastano 100 tentativi per aprirlo.

**💊 La cura:** password lunghe, blocco dopo troppi tentativi falliti, autenticazione a due fattori (2FA — la password + un codice sul telefono).

### A08 — Software and Data Integrity Failures (integrità non verificata)

**Il problema:** l'app scarica aggiornamenti o dati senza verificare che arrivino davvero dalla fonte giusta e che nessuno li abbia manomessi.

**Analogia:** mangiare una merendina trovata sul banco senza sapere chi ce l'ha messa.

**💊 La cura:** scarica solo da fonti fidate, verifica le firme digitali (sezione 3), blocca le versioni delle dipendenze in un file di lock.

### A09 — Security Logging and Monitoring Failures (niente registro degli eventi)

**Il problema:** qualcuno attacca la tua app e tu... non te ne accorgi nemmeno, perché non registri niente.

**Analogia:** una scuola senza registro delle presenze: se qualcuno si intrufola, nessuno lo saprà mai.

```python
import logging

logging.warning("Login fallito per %s da IP %s", username, ip)
# Dopo 5 fallimenti dallo stesso IP → avviso all'amministratore!
```

**💊 La cura:** registra (log) gli eventi importanti — login falliti, accessi negati — e configura degli allarmi. Ma **mai** scrivere password o dati personali nei log!

### A10 — SSRF (Server-Side Request Forgery)

**Il problema:** l'app accetta un URL dall'utente e lo va a visitare "per conto suo". Un attaccante le fa visitare indirizzi *interni* alla rete aziendale, che da fuori sarebbero irraggiungibili.

**Analogia:** convincere il bidello (che può girare ovunque) a fare una commissione nella sala professori per te.

**💊 La cura:** se proprio devi accettare URL dagli utenti, usa una **lista di domini permessi** (allow-list) e rifiuta tutto il resto, specialmente gli indirizzi interni.

---

## 3. Crittografia spiegata semplice

La crittografia è l'arte di trasformare un messaggio leggibile in un codice incomprensibile per chiunque non abbia la "chiave". Esistono tre strumenti fondamentali: l'**hash**, la crittografia **simmetrica** e quella **asimmetrica**.

### Hash: il frullatore

Una funzione di hash prende qualsiasi dato e produce un'"impronta digitale" di lunghezza fissa. È un **frullatore**: dalla frutta ottieni il frullato, ma dal frullato **non puoi tornare** alla frutta intera. E se cambi anche solo un chicco d'uva, il frullato viene completamente diverso.

```python
import hashlib

print(hashlib.sha256(b"ciao").hexdigest())
# b133a0c0e9bee3be20163d2ad31d6248db292aa6dcb1ee087a2aa50e0fc75ae2

print(hashlib.sha256(b"Ciao").hexdigest())  # solo una C maiuscola in più...
# 32e1a6a21b9a8f14a15c8484ea90b1948ba02e12de00b0bc7cbe83a768b1f43c
# ...e l'hash è TOTALMENTE diverso!
```

A cosa serve? **A salvare le password!** Il sito non memorizza mai la tua password, ma solo il suo hash. Al login, calcola l'hash di ciò che digiti e lo confronta. Se rubano il database, trovano solo "frullati" impossibili da invertire.

Attenzione però: per le password serve un hash *lento e con "sale"* (un valore casuale aggiunto a ogni password, così due password uguali danno hash diversi):

```python
import hashlib, os

def hash_password(password: str) -> tuple[bytes, bytes]:
    sale = os.urandom(16)  # 16 byte casuali, diversi per ogni utente
    h = hashlib.pbkdf2_hmac("sha256", password.encode(), sale, 600_000)
    return sale, h  # salvo nel database sale + hash, MAI la password

def verifica_password(password: str, sale: bytes, h_salvato: bytes) -> bool:
    h = hashlib.pbkdf2_hmac("sha256", password.encode(), sale, 600_000)
    return h == h_salvato
```

> In un progetto vero si usano librerie dedicate come `bcrypt` o `argon2`: stesso principio, ancora più robuste.

### Crittografia simmetrica: una sola chiave

**Una stessa chiave** serve sia per chiudere (cifrare) sia per aprire (decifrare). Come una scatola con un lucchetto: chi ha la copia della chiave può aprire.

```python
from cryptography.fernet import Fernet  # pip install cryptography

chiave = Fernet.generate_key()   # la chiave segreta condivisa
f = Fernet(chiave)

segreto = f.encrypt(b"Il tesoro e' sotto il melo")
print(segreto)                    # roba illeggibile: gAAAAABm...

print(f.decrypt(segreto))         # b"Il tesoro e' sotto il melo"
```

✅ **Pro:** velocissima, perfetta per grandi quantità di dati.
❌ **Contro:** come consegno la chiave al mio amico senza che qualcuno la intercetti? Questo è il *problema dello scambio della chiave*.

### Crittografia asimmetrica: chiave pubblica + chiave privata

Qui le chiavi sono **due**, generate in coppia:

- la **chiave pubblica** puoi darla a tutti: serve solo a *chiudere*;
- la **chiave privata** resta solo tua: è l'unica che *apre*.

**Analogia:** distribuisci a tutti dei **lucchetti aperti** (chiave pubblica). Chiunque può chiudere una scatola con il tuo lucchetto, ma solo tu hai la chiave (privata) che lo apre. Il problema dello scambio della chiave... sparisce!

![Confronto tra crittografia simmetrica e asimmetrica](crypto-keys.png)

```python
# Concetto con la libreria cryptography (semplificato)
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes

privata = rsa.generate_private_key(public_exponent=65537, key_size=2048)
pubblica = privata.public_key()   # questa la puoi pubblicare ovunque

msg_cifrato = pubblica.encrypt(   # chiunque può cifrare per te...
    b"Messaggio segreto",
    padding.OAEP(mgf=padding.MGF1(hashes.SHA256()),
                 algorithm=hashes.SHA256(), label=None),
)

msg = privata.decrypt(            # ...ma solo tu puoi decifrare
    msg_cifrato,
    padding.OAEP(mgf=padding.MGF1(hashes.SHA256()),
                 algorithm=hashes.SHA256(), label=None),
)
```

### Firma digitale: il contrario!

Usando le chiavi al contrario ottieni la **firma digitale**: cifri un hash del messaggio con la tua chiave *privata*, e chiunque può verificarlo con la tua chiave *pubblica*. Dimostra che il messaggio è tuo e che nessuno l'ha modificato — come una ceralacca impossibile da falsificare.

### E HTTPS? Usa tutto insieme!

Quando vedi il lucchetto 🔒 nel browser, sta succedendo questo: il browser usa la crittografia **asimmetrica** per scambiarsi in sicurezza una chiave **simmetrica**, poi tutta la navigazione viaggia cifrata con quella (perché è più veloce). Il meglio di entrambi i mondi!

| Strumento | Chiavi | Reversibile? | Uso tipico |
|-----------|--------|--------------|-----------|
| Hash | nessuna | No, mai | Salvare password, verificare integrità |
| Simmetrica | 1 condivisa | Sì, con la chiave | Cifrare tanti dati velocemente |
| Asimmetrica | 2 (pubblica + privata) | Sì, con la privata | Scambio chiavi, firme digitali |

---

## 4. Frameworks & vulnerabilità: l'approccio giusto

### Non reinventare la ruota (soprattutto se è blindata)

I framework (Django, Flask, FastAPI...) contengono protezioni costruite da esperti e testate da milioni di utenti. La prima regola è: **usale, non aggirarle**.

```python
# ❌ Costruisco la query a mano (rischio injection)
User.objects.raw(f"SELECT * FROM users WHERE name = '{nome}'")

# ✅ Uso l'ORM del framework: pensa lui a rendere sicura la query
User.objects.filter(name=nome)
```

Altri esempi di protezioni "gratis" che i framework ti regalano:

- **Escaping automatico nei template**: Django e Jinja2 trasformano `<script>` in testo innocuo, bloccando gli attacchi XSS (codice JavaScript iniettato nelle pagine).
- **Protezione CSRF**: un token segreto nei form impedisce che un altro sito invii richieste a nome tuo.
- **Gestione sessioni e password** già fatta bene (Django salva gli hash con sale, di serie).

### Ma i framework invecchiano: le CVE

Ogni vulnerabilità scoperta pubblicamente riceve un codice **CVE** (es. `CVE-2024-12345`) e finisce in database consultati da tutti — hacker compresi! Da quel momento, usare la versione vulnerabile è come lasciare la mappa del passaggio segreto appesa al portone.

L'approccio giusto in 4 mosse:

```bash
# 1. Dichiara le dipendenze con versioni precise
#    requirements.txt:  flask==3.0.3

# 2. Controlla se hanno vulnerabilità note
pip install pip-audit
pip-audit                    # segnala le CVE nelle tue dipendenze!

# 3. Aggiorna con regolarità (non solo "quando si rompe")
pip list --outdated

# 4. Analizza anche il TUO codice
pip install bandit
bandit -r .                  # trova pattern pericolosi nel codice Python
```

> 💡 Su GitHub puoi attivare **Dependabot**: ti apre da solo le pull request quando una tua dipendenza ha una falla. Sicurezza in automatico!

### La mentalità corretta

1. **Il framework ti protegge solo se lo segui**: leggi la sezione "Security" della sua documentazione (tutti i framework seri ne hanno una).
2. **Meno dipendenze = meno rischi**: prima di aggiungere una libreria per due righe di codice, chiediti se ti serve davvero.
3. **Una dipendenza abbandonata è un rischio**: se non riceve aggiornamenti da anni, nessuno correggerà le sue falle.

---

## 5. Mantenere un software sicuro durante il suo ciclo di vita

La sicurezza non è un esame che superi una volta sola: è più simile a **lavarsi i denti** — va fatto sempre, a ogni fase della vita del software.

![Ciclo di vita dello sviluppo sicuro](secure-sdlc.png)

### Fase 1 — Design: pensa come un ladro

Prima di scrivere codice, fai un mini **threat modeling** chiedendoti:

- Quali dati preziosi gestisco? (password, email, foto...)
- Da dove entrano i dati esterni? (form, API, file caricati...)
- Cosa potrebbe fare un malintenzionato in ognuno di quei punti?

Non serve essere esperti: anche solo scrivere queste risposte su un foglio ti fa evitare la vulnerabilità "Insecure Design" (A04).

### Fase 2 — Sviluppo: quattro occhi vedono meglio di due

- **Code review**: ogni modifica viene letta da un'altra persona prima di entrare nel progetto. Tantissime falle si fermano qui.
- **Linter di sicurezza** (`bandit` per Python) integrati nell'editor: ti sottolineano il codice pericoloso mentre lo scrivi, come il correttore ortografico.

### Fase 3 — Test: prova a fare il cattivo

Oltre ai test normali, scrivi test che *provano ad attaccare* la tua app:

```python
def test_login_rifiuta_sql_injection():
    risposta = client.post("/login", data={
        "username": "admin' --",
        "password": "qualsiasi",
    })
    assert risposta.status_code == 401  # NON deve entrare!

def test_profilo_altrui_negato():
    login_come("mario")
    risposta = client.get("/profilo/9999")  # profilo di un altro
    assert risposta.status_code == 403
```

### Fase 4 — Rilascio: i segreti non vanno nel codice

Password del database, chiavi API e simili **non si scrivono mai nel codice** (finirebbero su Git per sempre!). Si passano dall'esterno, tramite variabili d'ambiente:

```python
import os

DB_PASSWORD = os.environ["DB_PASSWORD"]  # ✅ letta dall'ambiente
# DB_PASSWORD = "supersegreta123"        # ❌ MAI hardcoded!
```

E in produzione: `DEBUG = False`, HTTPS obbligatorio, permessi minimi per l'utente del database.

### Fase 5 — Monitoraggio: tieni gli occhi aperti

Log degli eventi sospetti + allarmi automatici (sezione A09). Se qualcosa va storto, vuoi saperlo da un avviso alle 3 di notte, non da un articolo di giornale.

### Fase 6 — Aggiornamento: il ciclo ricomincia

`pip-audit` a cadenza regolare, patch di sicurezza applicate subito, e un piano per quando (non "se") qualcosa andrà storto: chi avvisare, come bloccare l'attacco, come ripristinare i dati dal backup.

> **La checklist del software sano:** ✅ threat modeling fatto · ✅ code review sempre · ✅ test di sicurezza · ✅ segreti fuori dal codice · ✅ log e allarmi attivi · ✅ dipendenze aggiornate

---

## 6. Bad Patterns vs Good Patterns

La palestra finale: stessi problemi, due soluzioni a confronto. Allena l'occhio a riconoscere il pattern cattivo al primo sguardo!

### Password

```python
# ❌ BAD: password salvata in chiaro
db.save(username, password)

# ✅ GOOD: salvo solo hash + sale (o uso bcrypt/argon2)
sale, h = hash_password(password)
db.save(username, sale, h)
```

### Query al database

```python
# ❌ BAD: input concatenato nella query → SQL injection
cursor.execute(f"SELECT * FROM users WHERE name = '{nome}'")

# ✅ GOOD: query parametrizzata
cursor.execute("SELECT * FROM users WHERE name = ?", (nome,))
```

### Segreti

```python
# ❌ BAD: chiave API scritta nel codice (e pushata su Git!)
API_KEY = "sk-abc123-super-segreta"

# ✅ GOOD: letta dall'ambiente, fuori dal repository
API_KEY = os.environ["API_KEY"]
```

### Eseguire input dell'utente

```python
# ❌ BAD: eval esegue QUALSIASI cosa scriva l'utente
risultato = eval(input("Scrivi un'espressione: "))
# se scrive: __import__('os').system('rm -rf /') ... disastro!

# ✅ GOOD: interpreto solo ciò che mi aspetto
import ast
risultato = ast.literal_eval(input("Scrivi un numero o una lista: "))
# accetta solo valori "letterali": numeri, stringhe, liste...
```

### Caricare dati

```python
# ❌ BAD: pickle può eseguire codice durante il caricamento!
import pickle
dati = pickle.loads(file_ricevuto_da_internet)

# ✅ GOOD: json contiene solo dati, mai codice
import json
dati = json.loads(file_ricevuto_da_internet)
```

### Gestione errori

```python
# ❌ BAD: mostro all'utente i dettagli interni dell'errore
except Exception as e:
    return f"Errore: {e}"  # rivela tabelle, percorsi, versioni...

# ✅ GOOD: dettagli nei log (per me), messaggio generico (per l'utente)
except Exception:
    logging.exception("Errore durante il pagamento")
    return "Ops, qualcosa è andato storto. Riprova più tardi."
```

### Confronto di segreti

```python
# ❌ BAD: == impiega più tempo se i primi caratteri coincidono,
# e un attaccante può misurarlo (timing attack)!
if token_ricevuto == token_vero: ...

# ✅ GOOD: confronto a tempo costante
import hmac
if hmac.compare_digest(token_ricevuto, token_vero): ...
```

### Tabella riassuntiva

| ❌ Bad pattern | ✅ Good pattern | Vulnerabilità evitata |
|---------------|----------------|----------------------|
| Password in chiaro | Hash + sale (bcrypt/argon2) | A02 Cryptographic Failures |
| Query concatenate | Query parametrizzate / ORM | A03 Injection |
| Segreti nel codice | Variabili d'ambiente | A05 Misconfiguration |
| `eval()` sull'input | `ast.literal_eval` / parsing | A03 Injection |
| `pickle` da fonti esterne | `json` | A08 Integrity Failures |
| Errori dettagliati all'utente | Log interni + messaggio generico | A05 Misconfiguration |
| Fidarsi dell'input | Validare sempre | ...quasi tutte! |

---

## In sintesi

1. **La sicurezza si regge su tre pilastri**: confidenzialità, integrità, disponibilità.
2. **Mai fidarsi dell'input**: è la radice di quasi tutte le vulnerabilità.
3. **La OWASP Top 10** è la tua mappa delle trappole più comuni — e ogni trappola ha una cura.
4. **Hash per le password, simmetrica per i dati, asimmetrica per lo scambio di chiavi e le firme.**
5. **Usa le protezioni del framework** e tieni aggiornate le dipendenze (`pip-audit`).
6. **La sicurezza è un'abitudine**, non un traguardo: accompagna il software per tutta la vita, dal design al monitoraggio.

Ora vai e chiudi quelle porte. 🔒
