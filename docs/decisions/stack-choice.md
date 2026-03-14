# Decision: Tech Stack — Express + Expo + PostgreSQL

## Decision

- **Backend:** Express (Node.js, TypeScript)
- **Frontend:** Expo (React Native, TypeScript)
- **Database:** PostgreSQL

## Reasoning

### Express

- Minimal and unopinionated — no framework magic to fight against
- Large ecosystem, excellent TypeScript support
- Fast to set up a thin REST API over a database
- Easy to add middleware only when needed

### Expo

- React Native with a managed workflow removes most of the native build complexity
- Allows running on iOS and Android from a single codebase
- Expo Go enables fast iteration — no build step needed during development
- Camera/barcode APIs available via Expo SDK when barcode scanning is added (Phase 3)
- TypeScript support is first-class

### PostgreSQL

See [database-choice.md](database-choice.md).

## Alternatives Considered

**FastAPI (Python backend)** — strong typing and automatic OpenAPI docs are appealing, but Node.js keeps the stack in a single language (TypeScript on both ends), which reduces context switching.

**Next.js (backend)** — API routes are convenient but mixing frontend and backend concerns is a tradeoff not worth it here since the frontend is mobile, not web.

**React Native CLI (without Expo)** — more control, but the overhead of managing native builds slows down early development with no benefit at this stage.

## Consequences

- TypeScript must be used on both frontend and backend — types can potentially be shared
- Expo managed workflow limits some native module options — eject only if necessary
- Single VPS deployment is straightforward: run Express as a Node process + PostgreSQL on the same machine
