# Dockerize It

You have an app that runs perfectly on your laptop. You ship it to production (or, worse, to the colleague with the M-something Mac while you're on Linux) and suddenly nothing works anymore: a different Node version, a missing system library, an environment variable you set three months ago on your machine and have since forgotten. "Works on my machine" is probably the most repeated lie in the history of software engineering.

Docker exists to erase that phrase from your vocabulary. It doesn't just package your code: it packages **the entire environment** that code runs in — language version, system libraries, environment variables, even the base operating system — into a single unit that behaves identically wherever it runs: on your laptop, on your colleague's server, in production on AWS.

This playbook takes you from zero to a real, containerized, orchestrated application: a **Fastify** backend on **Node.js 24**, an **Angular** frontend, a **MariaDB** database, all three started with a single command.

---

## 0. The problem Docker solves

**In short**: Docker packages an application together with everything it needs to run (runtime, libraries, configuration) into an isolated, reproducible unit called a **container**. It's not a virtual machine: it's something much lighter.

### Why virtual machines aren't enough

A virtual machine (VM) virtualizes the **entire hardware**: every VM has its own kernel, its own full operating system, its own drivers. It's heavy (gigabytes of image, minutes to boot) but gives total isolation.

A Docker container, instead, **shares the host operating system's kernel** and only isolates what's needed at the process level: filesystem, network, visible processes, CPU/memory limits. Technically, it uses two Linux kernel features: **namespaces** (isolate what a process *sees* — its filesystem, its network, its PIDs) and **cgroups** (limit how much resource a process *can use* — CPU, RAM). The result: a container weighs megabytes, not gigabytes, starts in milliseconds, not minutes, but **isn't as isolated as a VM** (it still shares the host kernel).

```
┌─────────────────────────────┐     ┌─────────────────────────────┐
│    Virtual Machine           │     │         Container            │
├─────────────────────────────┤     ├─────────────────────────────┤
│  App A  │  App B  │  App C   │     │  App A  │  App B  │  App C   │
├─────────┼─────────┼──────────┤     ├─────────┼─────────┼──────────┤
│ Bin/Lib │ Bin/Lib │ Bin/Lib  │     │ Bin/Lib │ Bin/Lib │ Bin/Lib  │
├─────────┼─────────┼──────────┤     └─────────┴─────────┴──────────┘
│ Guest OS│ Guest OS│ Guest OS │     │      Docker Engine            │
├─────────┴─────────┴──────────┤     ├─────────────────────────────┤
│         Hypervisor            │     │       Host kernel (Linux)     │
├─────────────────────────────┤     ├─────────────────────────────┤
│      Host operating system     │     │      Host operating system     │
└─────────────────────────────┘     └─────────────────────────────┘
```

> 🧠 **Analogy**: a VM is like cloning an entire physical server for every app. A container is like `chroot` on steroids: every process thinks it has the whole computer to itself (its own filesystem, its own network), but underneath they're all sharing the same kernel — much like Unix processes share the same kernel but don't see each other's memory.

### The concrete problem it solves every day

- **"Works on my machine"** → the Docker image contains exactly the same Node version, the same system dependencies, the same configuration, wherever it runs.
- **Onboarding a new developer** → instead of a wiki page with 40 steps ("install this version of Postgres, export this variable..."), one `docker compose up` and the full development environment (app + database + cache) is up in two minutes.
- **"I need Postgres 14 for this project and Postgres 16 for that other one, on the same machine"** → no conflict: every container has its own isolated dependencies, so you can run different versions of the same database on the same machine without touching anything at the operating system level.

---

## 1. The core concepts: Image, Container, Volume

**In short**: an **image** is a read-only template. A **container** is a running instance of that template. A **volume** is the storage that survives even when the container is destroyed.

### Image vs Container: the same relationship as class and object

If you've ever written object-oriented code, this is the fastest mental shortcut you'll find:

| Docker concept | OOP equivalent | Unix equivalent |
|---|---|---|
| **Image** | a class | a compiled executable on disk |
| **Container** | an instance of that class (`new MyClass()`) | a running process of that executable |
| **Registry (Docker Hub)** | a package registry (npm, PyPI) | a repository of binaries |

You can create **many containers from the same image**, exactly as you can instantiate many objects from the same class. Each container has its own isolated state (writable filesystem, processes, network), but they all share the same immutable "source code": the image.

```bash
docker run -d --name web1 nginx    # "web1" container from the nginx image
docker run -d --name web2 nginx    # "web2" container from the SAME nginx image
```

### Images are made of layers, and layers are cache

An image isn't a monolithic blob: it's a stack of read-only **layers**, one on top of another (union filesystem). Every instruction in a Dockerfile (which we'll see shortly) produces a new layer. Docker **caches** each layer: if nothing changed compared to the previous build, that layer is reused instead of being rebuilt.

> 💡 **Why you should care**: the order of instructions in your Dockerfile determines how fast you rebuild the image after a change. If you put `COPY . .` (all the code) before `npm install`, every single code change invalidates the dependency cache and reinstalls everything from scratch — even if `package.json` hasn't changed. We'll cover this in detail in the Dockerfile section.

### Container: ephemeral by design

A container is meant to be **disposable**: when you stop and remove it, everything it wrote to its writable filesystem disappears with it. This is intentional, not a bug: it makes containers **reproducible** — if something goes wrong, you destroy it and start a new one from the same image, with no dirty state left lying around. In jargon: "treat containers like cattle, not pets" (*cattle, not pets* — you don't name each container and fret over it getting sick, you just spin up a new one).

The obvious problem: what about data that *must* survive (the database, files uploaded by users)? That's where **volumes** come in.

### Volumes: the storage that survives the container

A **volume** is a storage space managed by Docker, external to the container's writable filesystem, that persists even when the container is removed. You mount a volume onto a path inside the container, and anything written there ends up in the volume, not in the container's ephemeral filesystem.

```bash
docker volume create db_data
docker run -d --name mariadb -v db_data:/var/lib/mysql mariadb:11
# even if you destroy and recreate the "mariadb" container, the data in db_data remains
```

| Storage type | Where it lives | Survives container removal? |
|---|---|---|
| Container's writable filesystem | inside the container | ❌ No |
| **Volume** (`-v db_data:/path`) | managed by Docker, outside the container | ✅ Yes |
| **Bind mount** (`-v ./src:/path`) | a folder on your host | ✅ Yes (it's literally your folder) |

---

## 2. Anatomy of a Dockerfile

**In short**: a Dockerfile is a recipe, line by line, for building an image. Almost every line becomes a layer.

### The instructions you'll use 95% of the time

```dockerfile
FROM node:24-alpine          # starting layer: an already-built base image
WORKDIR /app                 # from here on, every command runs in /app
COPY package*.json ./        # copy ONLY the dependency files (for caching!)
RUN npm ci --omit=dev        # install production dependencies
COPY src ./src                # copy the rest of the source code
ENV NODE_ENV=production      # environment variable available at runtime
EXPOSE 3000                  # documents which port the app exposes (doesn't open it by itself)
USER node                     # run as an unprivileged user, not root
CMD ["node", "src/server.js"] # the command executed when the container starts
```

| Instruction | What it does | Analogy |
|---|---|---|
| `FROM` | the starting image | inheritance in OOP: you start from a base class |
| `WORKDIR` | sets the current working directory | a `cd` that stays valid for all subsequent lines |
| `COPY` | copies files from the host into the image | like a `cp` at build time |
| `RUN` | executes a command during the **build** and saves its result into a layer | running a one-off setup script |
| `ENV` | sets an environment variable available at **runtime** | a persistent `export VAR=value` baked into the image |
| `EXPOSE` | documentation: "this app listens on this port" | an executable comment, doesn't actually open the port |
| `USER` | changes the user under which subsequent commands and the final process run | `sudo -u appuser` |
| `CMD` | the default command executed when the **container** starts | the command you'd run by hand after connecting |

> 🧠 **`RUN` vs `CMD`, the most common source of confusion**: `RUN` happens **once, during the image build** (e.g. installing dependencies) and its result is "frozen" into a layer. `CMD` happens **every time a container starts** from that image, and doesn't modify the image itself. It's the difference between "compiling the program" (`RUN`, one-off) and "running the program" (`CMD`, every startup).

### Instruction order matters (for caching)

```dockerfile
# ❌ BAD PRACTICE: invalidates the dependency cache on every code change
FROM node:24-alpine
WORKDIR /app
COPY . .
RUN npm ci
CMD ["node", "src/server.js"]
```

```dockerfile
# ✅ GOOD PRACTICE: dependencies are rebuilt only if package.json changes
FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
CMD ["node", "src/server.js"]
```

In the second version, if you change a file in `src/` but not `package.json`, Docker reuses the layer with `npm ci` already run from cache — the build takes seconds instead of minutes.

### Multi-stage build: build in one stage, ship only what's needed

An image with all the build tools (compiler, dev dependencies, npm cache) can weigh hundreds of megabytes more than necessary. A **multi-stage build** uses multiple `FROM` blocks in the same Dockerfile: one to build, one (much smaller) to run.

```dockerfile
# ---- Stage 1: build ----
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Stage 2: runtime ----
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
```

The first stage has Node, npm, all the devDependencies, and the full source code: all stuff you no longer need once you've generated the compiled static files. The second stage starts from a clean `nginx` image and copies **only** the build's output (`--from=build`) — everything else from stage 1 is discarded. The final image contains no Node, no npm, not a single line of source code: just the static files and the server that serves them.

> 💡 **When you actually need this**: any application that requires a "compilation" step (TypeScript → JavaScript, Angular/React/Vue → static files, Go/Rust → binary) benefits from a multi-stage build. We'll see it in action in the final example with the Angular frontend.

### `.dockerignore`: the `.gitignore` for your builds

```
node_modules
.git
dist
*.log
.env
```

Without a `.dockerignore`, `COPY . .` copies **everything**, including huge folders like `node_modules` (which will be reinstalled anyway inside the container with the right architecture) or sensitive files like `.env`. The result: slower builds, heavier images, and in the case of `.env`, a serious security risk if that image ends up in a registry.

---

## 3. docker-compose.yml — the orchestra conductor

**In short**: `docker compose` takes a single application made up of multiple containers (backend, frontend, database, cache...) and describes it in a declarative YAML file. One command (`docker compose up`) brings everything up, in the right order, on the same network.

### The problem it solves

Without Compose, to start an app with backend + frontend + database you'd have to run three very long `docker run` commands by hand, remember the right arguments, create a shared network manually, and repeat the exact same thing every time. Compose replaces those three commands with a file versioned in git and a single command.

```yaml
services:
  db:
    image: mariadb:11
    environment:
      MARIADB_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MARIADB_DATABASE: ${DB_NAME}
      MARIADB_USER: ${DB_USER}
      MARIADB_PASSWORD: ${DB_PASSWORD}
    volumes:
      - db_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 5s
      retries: 10

  backend:
    build: ./backend
    environment:
      DB_HOST: db
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      DB_NAME: ${DB_NAME}
    depends_on:
      db:
        condition: service_healthy
    ports:
      - "3000:3000"

volumes:
  db_data:
```

| Key | What it does |
|---|---|
| `services` | each service is a container managed by Compose |
| `image` | uses an already-built image from a registry (e.g. `mariadb:11`) |
| `build` | builds the image from a local Dockerfile instead of pulling it |
| `environment` | environment variables passed to the container |
| `volumes` (service level) | mounts a volume or a folder inside the container |
| `volumes` (top level) | declares the Docker-managed volumes the services can use |
| `depends_on` | startup order; with `condition: service_healthy` it waits for the service to be *ready*, not just *started* |
| `ports` | maps `host:container` — only for ports that need to be reachable from outside |
| `healthcheck` | a command Docker runs periodically to determine whether the service is truly ready, not just started |

> 🧠 **The detail that trips everyone up**: `depends_on` without `condition: service_healthy` only waits for the container to **start**, not for the service inside it to be **ready to respond**. MariaDB can take several seconds after the container starts before it accepts connections: without a `healthcheck`, your backend will try to connect too early and fail. It's the same problem as a missing retry loop when waiting for an external dependency to come online.

### The network: services find each other by name

Compose automatically creates a private network shared between all the services defined in the file. Inside that network, each service is reachable **using its name as the hostname** — exactly as you would use a DNS name. In the example above, the backend connects to the database with `DB_HOST: db`, not with an IP address: Docker resolves `db` to the correct internal IP of the `db` service's container.

---

## 4. Getting inside the container

**In short**: a running container isn't a black box. You can get a shell into it, read its logs, inspect its state — exactly as you would SSH into a server, but without SSH.

### The interactive shell: `exec`

```bash
docker exec -it <container-name> sh      # or bash, if the image includes it
```

- `-i` (interactive): keeps stdin open
- `-t` (tty): allocates a terminal, so you get a usable prompt instead of raw output

With Compose, the service name works in place of the container name:

```bash
docker compose exec backend sh
docker compose exec db mariadb -u root -p
```

> 💡 **`exec` vs `attach`**: `docker exec` launches a **new process** inside the container (e.g. a shell) — if you exit, the container's main process keeps running undisturbed. `docker attach`, instead, connects you directly to the stdin/stdout/stderr of the container's main process (PID 1): if that process is waiting for input, or if you press Ctrl+C, you might end up stopping the container itself. 99% of the time, for debugging, you want `exec`, not `attach`.

### Reading the logs

```bash
docker logs -f <container-name>          # -f = follow in real time, like tail -f
docker compose logs -f backend           # same thing, but for a Compose service
docker compose logs -f                    # logs of ALL services, interleaved
```

### Inspecting the state

```bash
docker inspect <container-name>          # all the details: IP, mounts, environment variables, etc. (JSON)
docker stats                              # real-time CPU/memory usage, like `top` but for containers
docker top <container-name>               # the processes running inside the container, like `ps`
```

---

## 5. The commands you'll actually use

| Command | What it does |
|---|---|
| `docker build -t app-name .` | builds an image from the Dockerfile in the current folder |
| `docker run -d -p 3000:3000 app-name` | starts a container in the background, mapping port 3000 |
| `docker ps` | **running** containers |
| `docker ps -a` | **all** containers, including stopped ones |
| `docker images` | all images present locally |
| `docker stop <name>` | stops a container (gracefully, with `SIGTERM`) |
| `docker rm <name>` | removes a stopped container |
| `docker rmi <image>` | removes an image |
| `docker system prune` | cleans up stopped containers, untagged images, unused build cache |
| `docker compose up` | starts all services defined in `docker-compose.yml` |
| `docker compose up -d --build` | same as above, but in the background and rebuilding the images |
| `docker compose down` | stops and removes all of the project's containers/network |
| `docker compose down -v` | same as above, but **also removes the volumes** (careful: this deletes the data!) |
| `docker compose ps` | status of the current Compose project's services |
| `docker volume ls` | all volumes managed by Docker |
| `docker cp file.txt <name>:/app/` | copies a file from the host into a container (or vice versa) |

---

## 6. Good practices vs Bad practices

| | ❌ Bad practice | ✅ Good practice |
|---|---|---|
| **Base image tag** | `FROM node:latest` (what will you pull in 6 months? nobody knows) | `FROM node:24-alpine` (explicit, reproducible version) |
| **User** | the process runs as `root` inside the container (default if unspecified) | `USER node` (or a dedicated unprivileged user) |
| **Secrets** | passwords/API keys written with `ENV` in the Dockerfile (end up in the image history, readable with `docker history`) | passed at runtime via environment variables from an **uncommitted** `.env` file, or a secrets manager |
| **Image size** | a single image with compiler, devDependencies, and source code | multi-stage build: only the final artifact in the runtime image |
| **Base image** | "full" images (`ubuntu`, `node` with no suffix) when system tools aren't needed | `alpine` or `slim` variants, much lighter |
| **`.dockerignore`** | absent: `node_modules`, `.git`, `.env` end up in the build context | present and curated, like a `.gitignore` |
| **Dependency layers** | `COPY . .` before installing dependencies | `COPY package*.json ./` and installing **before** copying the rest of the code |
| **Healthcheck** | `depends_on` without a condition: assumes "started" means "ready" | `depends_on` with `condition: service_healthy` + a real `healthcheck` |
| **Data persistence** | database data written to the container's filesystem | a dedicated volume (`db_data:/var/lib/mysql`) |
| **Logs** | the app writes logs to a file inside the container | the app writes to stdout/stderr, and you let Docker/Compose collect them (`docker logs`) |

---

## 7. Complete example: Fastify + Angular + MariaDB with Docker Compose

**In short**: let's put it all together — Dockerfile, multi-stage build, docker-compose, volumes, healthcheck — building a real three-tier app: **Fastify** backend on **Node.js 24**, **Angular** frontend served by **nginx**, **MariaDB** database, all started with `docker compose up`.

### Project structure

```
dockerize-demo/
├── backend/
│   ├── src/
│   │   └── server.js
│   ├── package.json
│   ├── Dockerfile
│   └── .dockerignore
├── frontend/
│   ├── src/
│   │   └── ... (standard Angular project, generated with `ng new`)
│   ├── nginx.conf
│   ├── package.json
│   ├── Dockerfile
│   └── .dockerignore
├── .env
├── .gitignore
└── docker-compose.yml
```

### The backend: Fastify on Node.js 24

```js
// backend/src/server.js
import Fastify from 'fastify'
import mysql from 'mysql2/promise'

const fastify = Fastify({ logger: true })

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
})

await pool.query(`
  CREATE TABLE IF NOT EXISTS todos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    done BOOLEAN DEFAULT FALSE
  )
`)

fastify.get('/health', async () => ({ status: 'ok' }))

fastify.get('/api/todos', async () => {
  const [rows] = await pool.query('SELECT * FROM todos ORDER BY id DESC')
  return rows
})

fastify.post('/api/todos', async (request, reply) => {
  const { title } = request.body
  const [result] = await pool.query('INSERT INTO todos (title) VALUES (?)', [title])
  reply.code(201)
  return { id: result.insertId, title, done: false }
})

await fastify.listen({ host: '0.0.0.0', port: 3000 })
```

> 🧠 **`host: '0.0.0.0'`, not `localhost`**: inside a container, `localhost` means "only inside this same container." If Fastify listens on `localhost`, no request coming from outside the container (including your browser, or nginx in the other container) will ever be able to reach it. `0.0.0.0` means "listen on all available network interfaces," including the one Docker uses to route traffic into the container.

```dockerfile
# backend/Dockerfile
FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

ENV NODE_ENV=production
EXPOSE 3000

USER node
CMD ["node", "src/server.js"]
```

```
# backend/.dockerignore
node_modules
npm-debug.log
.env
```

No multi-stage here: it's plain JavaScript, there's nothing to "compile." A single stage with only the production dependencies is already a lean image.

### The frontend: Angular served by nginx (a real multi-stage)

```dockerfile
# frontend/Dockerfile

# ---- Stage 1: build the Angular app ----
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

# ---- Stage 2: serve the static files with nginx ----
FROM nginx:1.27-alpine
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

Here the multi-stage isn't optional, it's essential: stage 1 contains Node, the entire Angular CLI, and all the devDependencies (hundreds of megabytes); stage 2 starts from a clean `nginx` image and takes **only** the `dist/` folder generated by the build — a few megabytes of static HTML/CSS/JS.

```nginx
# frontend/nginx.conf
server {
    listen 80;

    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;   # fallback for Angular's client-side routing
    }

    location /api/ {
        proxy_pass http://backend:3000/api/;   # "backend" = the service name in docker-compose.yml
        proxy_set_header Host $host;
    }
}
```

> 💡 **`proxy_pass http://backend:3000`**: nginx runs inside the `frontend` container, but forwards `/api/*` calls to the `backend` container by calling it by **service name**, thanks to the shared network created by Compose. The user's browser only talks to nginx (port 80); it's nginx's job to route the API requests to the backend, without ever exposing port 3000 to the outside.

```
# frontend/.dockerignore
node_modules
dist
.angular
```

### docker-compose.yml: the file that ties it all together

```yaml
services:
  db:
    image: mariadb:11
    environment:
      MARIADB_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MARIADB_DATABASE: ${DB_NAME}
      MARIADB_USER: ${DB_USER}
      MARIADB_PASSWORD: ${DB_PASSWORD}
    volumes:
      - db_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 5s
      timeout: 5s
      retries: 10

  backend:
    build: ./backend
    environment:
      DB_HOST: db
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      DB_NAME: ${DB_NAME}
    depends_on:
      db:
        condition: service_healthy

  frontend:
    build: ./frontend
    ports:
      - "8080:80"
    depends_on:
      - backend

volumes:
  db_data:
```

```bash
# .env (NOT committed: add it to .gitignore)
DB_ROOT_PASSWORD=changeme_root
DB_NAME=todoapp
DB_USER=todoapp_user
DB_PASSWORD=changeme_app
```

Notice what is **not** exposed to the outside: `backend` has no `ports` section. It's reachable only inside the Compose network (from `frontend`, via nginx), not directly from the user's browser — exactly as you'd want in production, where only the frontend should be publicly reachable.

### Starting everything

```bash
docker compose up --build
```

What happens, in order:
1. Docker builds the `backend` and `frontend` images (using the layer cache when possible).
2. The `db` container starts; Compose waits for its `healthcheck` to turn green.
3. Only then does `backend` start (thanks to `depends_on: condition: service_healthy`), connect to MariaDB, and create the `todos` table if it doesn't exist.
4. `frontend` starts, serving the Angular app and forwarding `/api` calls to `backend`.
5. Open `http://localhost:8080`: the Angular app calls `/api/todos`, nginx routes it to the backend, the backend queries MariaDB.

### Quick debugging of each piece

```bash
docker compose logs -f backend              # follow the backend's logs in real time
docker compose exec backend sh              # get into the backend container
docker compose exec db mariadb -u root -p   # open a MariaDB client inside the db container
docker compose exec db mariadb -u root -p -e "SELECT * FROM todoapp.todos;"
```

### Stopping everything

```bash
docker compose down       # stops and removes the containers and network (data in the volume remains)
docker compose down -v    # same as above, but ALSO deletes the db_data volume (the database's data, gone forever)
```

---

## Summary

| Concept | Problem it solves | Analogy |
|---|---|---|
| Image | reproducible template of the environment | a class / a compiled binary |
| Container | isolated, ephemeral running instance | an instantiated object / a process |
| Volume | storage that survives the container's lifetime | external mounted storage, not the process's local disk |
| Dockerfile | reproducible recipe for building an image | a provisioning script, cached line by line |
| Multi-stage build | heavy build, light final image | compile in one environment, ship only the binary |
| docker-compose.yml | orchestrate multiple containers as a single app | a declarative Makefile for the whole stack |
| Healthcheck | "started" ≠ "ready" | an explicit retry loop on an external dependency |

Docker isn't complicated: it's just a different way of packaging what you already know how to do. The day you type `docker compose up` and watch backend, frontend, and database all come up together, without installing anything on your machine except Docker itself, is the day it stops being a buzzword and becomes your everyday tool.
