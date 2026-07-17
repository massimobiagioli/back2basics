# Non avere paura del Bash

Hai presente quella finestra nera (o bianca) piena di scritte, che i film mostrano sempre quando un hacker sta "entrando nel sistema"? Quella è un **terminale**, e le scritte che ci digiti dentro sono comandi **bash**. Fa paura solo perché non la conosci: in realtà è uno degli strumenti più potenti e più semplici che esistono, e in questo playbook impari a usarla senza terrore, con esempi veri e tante analogie dal mondo reale. Nessun prerequisito: se sai cos'è un file e una cartella, sei già pronto.

---

## 1. Introduzione al Bash

### Cos'è, davvero

Il computer, sotto sotto, capisce solo comandi testuali. Quando fai doppio click su un'icona, in realtà qualcun altro (il sistema operativo) sta traducendo quel click in un comando che assomiglia a "apri questo programma". **Bash** ti permette di dare quegli stessi comandi direttamente, scrivendoli, invece di passare dalle icone.

🧠 **Analogia**: cliccare le icone è come ordinare al ristorante indicando le foto sul menu. Usare Bash è come parlare direttamente con il cuoco, dicendogli esattamente cosa vuoi, con quali ingredienti e in che ordine. All'inizio sembra più complicato, ma appena impari le parole giuste, ottieni esattamente quello che vuoi, molto più in fretta — e puoi anche scrivere la "ricetta" una volta e farla ripetere mille volte.

### Tre parole che si confondono sempre

| Termine | Cos'è |
|---|---|
| **Terminale** | La finestra nera. È solo lo "schermo" dove scrivi e leggi il testo. |
| **Shell** | Il programma che legge quello che scrivi e lo esegue. Bash è una shell fra tante (ce ne sono altre: `zsh`, `fish`...). |
| **Bash** | Il nome di UNA shell specifica — "Bourne Again SHell" — la più diffusa al mondo, presente su quasi ogni server, container Docker e Mac/Linux. |

> 💡 **Tip**: per sapere quale shell stai usando in questo momento, scrivi `echo $SHELL`. Per sapere che versione di Bash hai, scrivi `bash --version`.

### I tuoi primi 4 comandi

```bash
pwd      # "Print Working Directory" — dove mi trovo adesso?
ls       # "LiSt" — cosa c'è in questa cartella?
cd       # "Change Directory" — spostati in un'altra cartella
echo     # stampa qualcosa a schermo
```

```bash
$ pwd
/home/utente/progetti

$ ls
pizzahub  note.txt  foto

$ cd pizzahub
$ pwd
/home/utente/progetti/pizzahub

$ echo "Ciao Bash!"
Ciao Bash!
```

> 🧠 **La regola d'oro**: in Bash, quasi ogni comando ha la stessa forma: `comando [opzioni] [argomenti]`. `ls -la /home` è "il comando `ls`, con le opzioni `-l` (lista dettagliata) e `-a` (mostra anche i file nascosti), sulla cartella `/home`". Una volta capita questa grammatica, imparare un nuovo comando è solo questione di ricordarsi le sue opzioni.

### Perché vale la pena impararlo

Non è nostalgia da smanettoni: ogni server, ogni container Docker, ogni pipeline di CI/CD (i robot che testano e pubblicano automaticamente il codice) parla Bash. Se lavori nel software — anche solo un po' — prima o poi ti troverai davanti a un terminale, e saperlo usare ti fa risparmiare ore di lavoro che altrimenti faresti a mano, click dopo click.

---

## 2. Comandi ed istruzioni principali (es. `awk`)

**In pillole**: Bash ha un piccolo esercito di comandi, ognuno specializzato in un compito preciso. La vera potenza non è conoscerli tutti a memoria, ma sapere **combinarli insieme**.

### I comandi per muoverti fra file e cartelle

```bash
mkdir ricette          # crea una cartella
cp ricetta.txt backup/    # copia un file
mv ricetta.txt ricette/     # sposta (o rinomina) un file
rm vecchio.txt                # cancella un file (ATTENZIONE: non c'è cestino!)
cat ricetta.txt                  # stampa TUTTO il contenuto di un file
head -n 5 log.txt                   # stampa solo le PRIME 5 righe
tail -n 5 log.txt                      # stampa solo le ULTIME 5 righe
```

> 💡 **Tip**: `rm` non manda i file nel cestino, li cancella davvero. Prima di usarlo con `*` (che significa "tutti i file"), fermati un secondo e rileggi il comando. È l'errore da principianti più famoso di sempre.

### I campioni del testo: `grep`, `sed`, `sort`, `wc`

```bash
grep "errore" log.txt        # trova le righe che contengono "errore"
grep -i "errore" log.txt        # come sopra, ma ignora maiuscole/minuscole
grep -c "errore" log.txt           # conta QUANTE righe contengono "errore"

sort nomi.txt                # ordina le righe in ordine alfabetico
sort -n numeri.txt              # ordina le righe come NUMERI, non testo

wc -l log.txt                # conta quante righe ha il file
uniq -c                   # conta i duplicati consecutivi
```

### `awk`: il coltellino svizzero delle colonne

`awk` legge un file **riga per riga**, e per ogni riga la divide in "colonne" separate da spazi (o da un altro carattere, se glielo dici). Poi tu decidi cosa fare con quelle colonne.

```
# ordini.txt
Margherita  6.50  3
Diavola     8.00  1
Quattro     9.00  2
```

```bash
awk '{print $1}' ordini.txt
# Margherita
# Diavola
# Quattro
# $1 = prima colonna, $2 = seconda colonna, $0 = riga intera

awk '{print $1, $2 * $3}' ordini.txt
# Margherita 19.5
# Diavola 8
# Quattro 18
# calcola prezzo * quantita per ogni riga!

awk '$3 > 1 {print $1}' ordini.txt
# Margherita
# Quattro
# stampa solo le pizze ordinate più di una volta
```

🧠 **Analogia**: `awk` è come un foglio di calcolo che vive nel terminale — ogni riga è una "riga" del foglio, ogni parola separata da uno spazio è una "colonna". Invece di cliccare su una cella, scrivi `$2` per dire "la colonna numero 2".

### Le pipe: incatenare i comandi

Il simbolo `|` (si chiama **pipe**, "tubo") prende l'output di un comando e lo passa come input al comando successivo.

```bash
cat access.log | grep "ERROR" | awk '{print $2}' | sort | uniq -c
```

![Una pipeline Bash passo per passo](bash-pipeline.png)

> 🧠 **La regola d'oro**: leggi ogni pipeline come una catena di montaggio: ogni comando fa **una sola cosa semplice**, e passa il risultato al comando successivo. `cat` legge il file, `grep` filtra solo le righe con errore, `awk` estrae l'indirizzo IP, `sort` li mette in ordine, `uniq -c` conta quante volte si ripete ognuno. Nessun comando, da solo, è complicato — è la catena che fa il lavoro difficile.

### Redirection: salvare invece di stampare

```bash
echo "Ciao" > saluto.txt      # scrive in saluto.txt (CANCELLA quello che c'era prima!)
echo "Ancora" >> saluto.txt      # AGGIUNGE alla fine, senza cancellare
comando 2> errori.log               # salva solo gli errori in un file
comando < input.txt                    # legge input.txt come input del comando
```

> 💡 **Tip**: `>` sovrascrive, `>>` aggiunge in fondo. Confonderli è il secondo errore da principianti più famoso — un `>` di troppo e il file che volevi tenere sparisce, sostituito dal nuovo contenuto.

---

## 3. I costrutti

**In pillole**: Bash non è "solo comandi" — è anche un vero linguaggio di programmazione, con variabili, `if`, cicli e funzioni. Meno elegante di Python o JavaScript, ma sufficiente per automatizzare quasi tutto.

### Variabili

```bash
nome="Margherita"          # ⚠️ NESSUNO spazio prima o dopo il simbolo =
echo "Pizza: $nome"           # uso la variabile con $
echo "Pizza: ${nome}!"           # con le graffe, più sicuro quando c'è testo subito dopo

prezzo=6.50
quantita=3
totale=$((prezzo * quantita))    # aritmetica: $(( ... ))
echo "Totale: $totale"
```

```bash
# ❌ questo NON funziona: gli spazi intorno a = confondono bash
nome = "Margherita"

# ✅ niente spazi
nome="Margherita"
```

### `if`: decidere cosa fare

```bash
quantita=3

if [ "$quantita" -gt 0 ]; then
    echo "Ordine valido"
elif [ "$quantita" -eq 0 ]; then
    echo "Ordine vuoto"
else
    echo "Quantità non valida"
fi
```

| Confronto numeri | Significato | Confronto testo | Significato |
|---|---|---|---|
| `-eq` | uguale | `==` | uguale |
| `-ne` | diverso | `!=` | diverso |
| `-gt` | maggiore | `-z "$s"` | stringa vuota |
| `-lt` | minore | `-n "$s"` | stringa non vuota |

> 💡 **Tip**: usa `[[ ... ]]` invece di `[ ... ]` quando puoi — è una versione più moderna e più sicura (per esempio non ti tradisce se una variabile è vuota), disponibile in Bash (ma non nella `sh` più minimale).

### Cicli: `for` e `while`

```bash
# for: ripeti per ogni elemento di una lista
for pizza in Margherita Diavola Quattro; do
    echo "Preparo la $pizza"
done

# for su file
for file in *.txt; do
    echo "Trovato: $file"
done

# while: ripeti finché una condizione è vera
contatore=1
while [ "$contatore" -le 5 ]; do
    echo "Tentativo numero $contatore"
    contatore=$((contatore + 1))
done
```

### `case`: uno `switch` più leggibile di tanti `if`

```bash
case "$1" in
    start)
        echo "Avvio il servizio"
        ;;
    stop)
        echo "Fermo il servizio"
        ;;
    *)
        echo "Uso: $0 {start|stop}"
        ;;
esac
```

### Funzioni: non ripetere due volte lo stesso codice

```bash
saluta() {
    local nome="$1"          # $1 = primo argomento passato alla funzione
    echo "Ciao, $nome!"
}

saluta "Mondo"        # Ciao, Mondo!
```

```bash
somma() {
    local a="$1"
    local b="$2"
    echo $((a + b))         # per "restituire" un valore, lo stampo con echo...
}

risultato=$(somma 3 5)      # ...e lo catturo con $( )
echo "Il risultato è $risultato"
```

> 🧠 **La regola d'oro**: le funzioni Bash non hanno un vero "return con un valore" come in altri linguaggi — `return` in Bash serve solo per l'exit code (0 = successo, diverso da 0 = errore). Per far "restituire" un dato a una funzione, la convenzione è stampare il valore con `echo` e catturarlo da fuori con `$(...)`, come nell'esempio sopra.

### Array: liste di valori

```bash
pizze=("Margherita" "Diavola" "Quattro Formaggi")

echo "${pizze[0]}"             # Margherita (il primo elemento, indice 0)
echo "${pizze[@]}"                # tutti gli elementi
echo "${#pizze[@]}"                  # quanti elementi ci sono: 3

for pizza in "${pizze[@]}"; do
    echo "- $pizza"
done
```

---

## 4. Come si programma in Bash, da dove comincio?

**In pillole**: uno script Bash è solo un file di testo con dentro comandi Bash, uno per riga, che il computer esegue in sequenza dall'alto verso il basso — proprio come li scriveresti a mano nel terminale.

### Anatomia di uno script

![Anatomia di uno script Bash](bash-script-anatomy.png)

```bash
#!/usr/bin/env bash
# ↑ questa riga si chiama "shebang": dice al sistema "esegui questo file con bash"

set -euo pipefail
# ↑ modalità sicura: fermati al primo errore (-e), fermati se uso
#   una variabile che non esiste (-u), fai fallire una pipeline
#   se UNO qualsiasi dei comandi al suo interno fallisce (-o pipefail)

CARTELLA_BACKUP="/home/utente/backup"    # una costante, in MAIUSCOLO per convenzione

crea_cartella_se_serve() {
    if [ ! -d "$CARTELLA_BACKUP" ]; then
        mkdir -p "$CARTELLA_BACKUP"
        echo "Cartella creata: $CARTELLA_BACKUP"
    fi
}

main() {
    crea_cartella_se_serve
    echo "Pronto per il backup!"
}

main
```

### Da script a comando: `chmod +x`

```bash
chmod +x backup.sh    # rende il file "eseguibile"
./backup.sh               # lo esegue (il "./" dice "cerca qui, in questa cartella")
```

> 💡 **Tip**: se ti dimentichi `chmod +x`, il sistema ti risponde con "Permission denied" — non è un errore misterioso, significa semplicemente "questo file non ha il permesso di essere eseguito". Puoi anche eseguirlo senza renderlo eseguibile, scrivendo `bash backup.sh`.

### Argomenti: parlare con il tuo script

```bash
#!/usr/bin/env bash
# uso: ./saluta.sh Mario Rossi

echo "Nome: $1"          # $1 = primo argomento
echo "Cognome: $2"          # $2 = secondo argomento
echo "Tutti: $@"               # $@ = tutti gli argomenti
echo "Quanti: $#"                 # $# = quanti argomenti sono stati passati
echo "Chi mi ha eseguito: $0"        # $0 = il nome dello script stesso
```

```bash
$ ./saluta.sh Mario Rossi
Nome: Mario
Cognome: Rossi
Tutti: Mario Rossi
Quanti: 2
Chi mi ha eseguito: ./saluta.sh
```

### Exit code: come uno script dice "ho funzionato" o "ho fallito"

```bash
#!/usr/bin/env bash

if [ ! -f "ordini.csv" ]; then
    echo "Errore: file non trovato" >&2   # >&2 manda il messaggio agli errori, non all'output normale
    exit 1                                     # diverso da zero = "qualcosa è andato storto"
fi

echo "File trovato, procedo"
exit 0        # zero = "tutto ok" (è anche il valore di default se non scrivi exit)
```

```bash
./controlla.sh
echo "Il comando precedente ha restituito: $?"    # $? = exit code dell'ULTIMO comando eseguito
```

> 🧠 **La regola d'oro**: ogni comando Bash, quando finisce, restituisce un numero: `0` significa "tutto bene", qualunque altro numero significa "è successo un problema". È così che gli script si parlano fra loro e con l'esterno (per esempio, una pipeline di CI/CD guarda l'exit code per decidere se il tuo test è passato o no).

### Da dove comincio davvero?

1. Apri il terminale e prova i comandi della sezione 2, uno alla volta.
2. Scrivi un alias per un comando che usi spesso (`alias ll="ls -la"` nel tuo `~/.bashrc`).
3. Trasforma una sequenza di comandi che ripeti a mano in un piccolo script di 5 righe.
4. Installa **ShellCheck** (`shellcheck backup.sh`): è un correttore automatico che ti segnala errori ed errori comuni prima che diventino problemi reali. Quasi tutti gli script Bash professionali lo usano.
5. Solo dopo, esplora costrutti più avanzati (array associativi, `trap`, `getopts` per opzioni tipo `-h`/`--help`).

> 💡 **Tip**: non c'è bisogno di imparare tutto Bash prima di iniziare. Il modo migliore di imparare è automatizzare qualcosa di noioso che fai davvero — anche solo rinominare 10 file — e crescere da lì.

---

## 5. Good parts, Bad parts

**In pillole**: Bash è fenomenale per certe cose e pessimo per altre. Sapere dove sta il confine ti evita ore di frustrazione.

### Le "good parts"

| Punto di forza | Perché conta |
|---|---|
| **È ovunque** | Ogni server Linux, ogni container Docker, macOS: Bash (o una shell compatibile) c'è sempre, senza installare nulla |
| **Le pipe** | Combinare piccoli comandi con `\|` è incredibilmente potente per manipolare testo e file |
| **Velocissimo per compiti semplici** | Rinominare 100 file, cercare in migliaia di righe di log: Bash lo fa in una riga, un altro linguaggio richiederebbe un intero programma |
| **Il "collante" perfetto** | Bash è il linguaggio ideale per orchestrare *altri* programmi (Docker, git, curl, i tuoi stessi script) |
| **CI/CD parla Bash** | Quasi ogni pipeline GitHub Actions, GitLab CI, Jenkins esegue comandi Bash sotto il cofano |

### Le "bad parts"

```bash
# ❌ senza virgolette, gli spazi nei nomi dei file rompono tutto
rm $file_da_cancellare
# se $file_da_cancellare vale "documento importante.txt",
# bash lo legge come DUE argomenti: "documento" e "importante.txt"!

# ✅ metti sempre le variabili fra virgolette
rm "$file_da_cancellare"
```

```bash
# ❌ senza `set -e`, uno script continua anche dopo un errore grave
cd /cartella/che/non/esiste
rm -rf *          # ops... questo viene eseguito nella cartella SBAGLIATA!

# ✅ con set -e, lo script si ferma al primo errore
set -e
cd /cartella/che/non/esiste     # lo script si ferma qui, rm non viene mai eseguito
rm -rf *
```

> 🧠 **La regola d'oro**: la fama di Bash come linguaggio "pericoloso" nasce quasi sempre da questi due problemi — variabili senza virgolette e mancanza di `set -euo pipefail`. Risolvili sempre in ogni script che scrivi, e la maggior parte dei disastri raccontati nelle leggende metropolitane di internet semplicemente non ti capiterà.

| ❌ Dove Bash è debole | Cosa usare invece |
|---|---|
| Logica complessa, con tanti calcoli o strutture dati | Python, o qualunque linguaggio "vero" |
| Gestione robusta degli errori (try/catch strutturato) | Python, Go, o un linguaggio con eccezioni reali |
| Manipolare JSON/XML in modo affidabile | Python con librerie dedicate (o `jq` per JSON semplice) |
| Programmi grandi, mantenuti da tante persone | Un linguaggio con test, tipi, un vero package manager |
| Portabilità perfetta fra sistemi diversi | Attenzione: `bash` su Mac è spesso più vecchio di quello su Linux, e non tutti i sistemi hanno Bash (alcuni hanno solo `sh`) |

> 💡 **Tip**: la regola pratica più usata dai professionisti è "se il tuo script Bash supera le 100 righe, o ha bisogno di una vera gestione degli errori, è ora di riscriverlo in Python". Bash è perfetto per il collante fra i pezzi, non per essere l'intera applicazione.

---

## 6. 5 semplici "ricette"

Cinque piccoli script pratici, pronti da copiare e adattare. Ognuno usa solo quello che hai già imparato in questo playbook.

### Ricetta 1 — Il backup con data automatica

```bash
#!/usr/bin/env bash
set -euo pipefail

CARTELLA="$1"
DATA=$(date +%Y%m%d)
DESTINAZIONE="backup-${DATA}.tar.gz"

tar czf "$DESTINAZIONE" "$CARTELLA"
echo "Backup creato: $DESTINAZIONE"
```

```bash
./backup.sh pizzahub/
# Backup creato: backup-20260717.tar.gz
```

### Ricetta 2 — Il detective dei log

```bash
#!/usr/bin/env bash
set -euo pipefail

FILE_LOG="$1"

echo "Errori trovati per tipo:"
grep "ERROR" "$FILE_LOG" | awk '{print $3}' | sort | uniq -c | sort -rn
```

```bash
./detective.sh access.log
# Errori trovati per tipo:
#      12 timeout
#       5 not_found
#       2 unauthorized
```

### Ricetta 3 — Il controllore instancabile

```bash
#!/usr/bin/env bash
set -euo pipefail

URL="$1"

while true; do
    if curl -s -o /dev/null -w "%{http_code}" "$URL" | grep -q "200"; then
        echo "$(date): $URL è online ✅"
    else
        echo "$(date): $URL NON risponde! ❌"
    fi
    sleep 60
done
```

```bash
./controllore.sh https://pizzahub.example.com
# lun 17 lug 2026 10:00:01: https://pizzahub.example.com è online ✅
# lun 17 lug 2026 10:01:01: https://pizzahub.example.com è online ✅
```

### Ricetta 4 — Il tuttofare che rinomina in serie

```bash
#!/usr/bin/env bash
set -euo pipefail

for file in *.jpeg; do
    [ -e "$file" ] || continue           # se non ci sono file .jpeg, esci senza errori
    nuovo_nome="${file%.jpeg}.jpg"       # toglie ".jpeg" e aggiunge ".jpg"
    mv "$file" "$nuovo_nome"
    echo "Rinominato: $file → $nuovo_nome"
done
```

```bash
./rinomina.sh
# Rinominato: pizza1.jpeg → pizza1.jpg
# Rinominato: pizza2.jpeg → pizza2.jpg
```

### Ricetta 5 — Il pulitore automatico

```bash
#!/usr/bin/env bash
set -euo pipefail

CARTELLA_TEMP="/tmp/pizzahub-cache"
GIORNI=30

echo "Cerco file più vecchi di $GIORNI giorni in $CARTELLA_TEMP..."
find "$CARTELLA_TEMP" -type f -mtime "+${GIORNI}" -print -delete
echo "Pulizia completata"
```

```bash
./pulisci.sh
# Cerco file più vecchi di 30 giorni in /tmp/pizzahub-cache...
# /tmp/pizzahub-cache/vecchio-report.csv
# Pulizia completata
```

> 💡 **Tip**: nota che tutte e cinque le ricette iniziano allo stesso modo: shebang + `set -euo pipefail`. Non è un caso — è l'abitudine numero uno che separa uno script scritto da un principiante da uno scritto da chi ha già bruciato le dita qualche volta.

---

## In sintesi

1. **Bash è solo un modo di parlare al computer con il testo invece che con i click** — terminale (la finestra), shell (il programma), Bash (una shell specifica) sono tre cose diverse.
2. **I comandi si combinano con le pipe** (`|`): ogni comando fa una cosa sola e semplice, la potenza sta nel concatenarli.
3. **`awk` è il coltellino svizzero delle colonne di testo** — impara `$1`, `$2`, `$0` e sblocchi metà dei problemi di manipolazione dati.
4. **Variabili, `if`, cicli, funzioni**: Bash è un vero linguaggio di programmazione, solo con una sintassi tutta sua.
5. **Ogni script inizia con uno shebang e `set -euo pipefail`**: è l'abitudine che ti salva da metà dei disastri.
6. **Bash è perfetto per il collante fra sistemi e per automatizzare compiti ripetitivi** — non per costruire un'applicazione intera: lì, passa a un linguaggio "vero".

Ora apri quel terminale nero e non aver più paura. 🐚
