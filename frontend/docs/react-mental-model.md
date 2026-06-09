# React Mental Model — for a Flutter / Clean Architecture dev

A reference for mapping your **Flutter Clean Architecture** habits onto idiomatic **React**.
Keep the *spirit* (separation of concerns, UI never touches HTTP), drop the *ceremony*.

---

## The big shift

**React is a view library, not a framework.** Unlike Flutter, it ships **no** opinion
about data layers, repositories, or use cases. The community fills that gap with
conventions, not enforced structure.

Two truths to hold at once:

1. Your Clean Architecture instincts are valid and transferable.
2. The idiomatic React pattern is **lighter**. Porting Flutter's 3-layer / 7-folder
   structure 1:1 is considered over-engineered for a SPA. Keep the boundaries, lose the boilerplate.

---

## Layer mapping (Flutter → React)

| Flutter (Clean Arch)        | React equivalent                                  | Notes |
|-----------------------------|---------------------------------------------------|-------|
| **Data source** (API calls) | Plain `*.api.ts` module of async functions        | No class needed. |
| **Model** (response parsing)| **Zod schema** + inferred type                    | Same idea as backend Zod. |
| **Repository impl**          | Merged into the api/query module                  | Usually not separate in React. |
| **Repository contract**      | TypeScript `interface` (optional, rarely needed)  | Module boundaries + types already do this. |
| **Entities**                 | TS `type` / `interface` (often Zod-inferred)      | Plain types. |
| **Use cases**                | **Custom hooks** (`useStudents`, `useLogin`)      | ⭐ The key insight. |
| **Presentation** (screens/widgets) | **Components** (`pages/` + `components/`)   | Direct equivalent. |

### The single most important translation

> **Flutter Use Case ≈ React Custom Hook**

In Flutter, the presentation layer calls a *use case*.
In React, a component calls a *custom hook*. The hook is the boundary: the component
never sees `fetch`, never touches HTTP, never parses JSON — it calls `useStudents()`
and gets back `{ data, isLoading, error }`.

Difference: a hook *also* manages state + lifecycle (loading, caching, re-fetching).
In Flutter you'd do that with Bloc/Riverpod/Provider. In React, data fetching + that
state collapse into one thing — and you rarely hand-write it. Use **TanStack Query**.

---

## Folder structure — feature-first, layer-second

> 🔑 **Flutter habit to unlearn:** In Flutter you slice top-level by *layer*
> (`lib/data/`, `lib/domain/`, `lib/presentation/`). In React, **flip it**:
> slice by **feature first**, then by layer *inside* each feature.
> You can delete/move a whole feature as one folder.

```
src/
├─ api/
│  └─ client.ts             # axios/fetch instance, base URL, auth interceptor
├─ features/
│  └─ students/
│     ├─ students.api.ts        # data source: raw API calls
│     ├─ students.schema.ts     # Zod schemas + inferred types (model + entity)
│     ├─ students.queries.ts    # custom hooks via TanStack Query (use cases)
│     ├─ components/            # presentation: widgets for this feature
│     └─ pages/                 # presentation: screens
├─ components/              # shared/reusable UI (Button, Card...)
├─ hooks/                   # shared custom hooks
├─ lib/                     # utils
└─ routes/                  # React Router config
```

This is **feature-based / "feature-sliced"** architecture — the modern default.

---

## A concrete trace ("list students")

### 1. Model / Entity — `students.schema.ts`
```ts
import { z } from 'zod';

// Parses & validates the API response (your "Model")
export const studentSchema = z.object({
  id: z.string(),
  studentNumber: z.string(),
  firstName: z.string(),
  lastName: z.string(),
});

// The type used across the UI (your "Entity")
export type Student = z.infer<typeof studentSchema>;
export const studentsSchema = z.array(studentSchema);
```

### 2. Data source — `students.api.ts`
```ts
import { apiClient } from '@/api/client';
import { studentsSchema } from './students.schema';

export async function fetchStudents() {
  const res = await apiClient.get('/admin/students');
  // backend returns { success, message, data }
  return studentsSchema.parse(res.data.data); // parse = your Model layer
}
```

### 3. Use case — `students.queries.ts`  ← the hook = your use case
```ts
import { useQuery } from '@tanstack/react-query';
import { fetchStudents } from './students.api';

export function useStudents() {
  return useQuery({
    queryKey: ['students'],
    queryFn: fetchStudents,
  });
}
```

### 4. Presentation — `pages/StudentsPage.tsx`
```tsx
import { useStudents } from '../students.queries';

export function StudentsPage() {
  const { data: students, isLoading, error } = useStudents();

  if (isLoading) return <Spinner />;
  if (error) return <ErrorState message={error.message} />;

  return (
    <ul>
      {students?.map((s) => (
        <li key={s.id}>{s.firstName} {s.lastName}</li>
      ))}
    </ul>
  );
}
```

The component is **blissfully ignorant** of HTTP, parsing, and caching.
That is your Clean Architecture boundary, intact.

---

## What NOT to port from Flutter

- **Explicit repository interface contracts** — TS module boundaries + types cover this.
  Add `interface IStudentRepository` only if you genuinely swap data sources.
- **A separate state-management layer (Bloc/Riverpod) for server data** —
  TanStack Query *is* your server-state manager.
- **One-method-per-use-case classes** — a custom hook per operation is enough.

---

## The one new concept with no Flutter equivalent

**Server state vs. client state.** In Flutter you often treat all state uniformly.
In React, separate them:

- **Server state** (data from your API) → **TanStack Query**
- **Client / UI state** (modal open? form input? theme?) → `useState`, `useReducer`,
  or a small store like **Zustand**

Keeping these apart removes a huge amount of expected boilerplate. This is the biggest
"aha" coming from Flutter.

---

## Quick glossary (Flutter → React)

| You say (Flutter)        | React calls it            |
|--------------------------|---------------------------|
| Widget                   | Component                 |
| StatelessWidget          | Function component (no state) |
| StatefulWidget + setState| Component + `useState`    |
| Screen / Route           | Page + route (React Router) |
| Use case                 | Custom hook               |
| Bloc/Riverpod (server)   | TanStack Query            |
| Bloc/Riverpod (UI)       | `useState` / `useReducer` / Zustand |
| `BuildContext`           | (no equivalent — hooks instead) |
| `build()` method         | the component's returned JSX |
| InheritedWidget          | React Context             |
