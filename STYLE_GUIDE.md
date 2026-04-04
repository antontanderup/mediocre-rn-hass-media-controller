# Component Style Guide

> **Read this before creating or editing any component, hook, or utility.**

---

## 1. Exports — named only, always barrel-exported

```ts
// GOOD
export const formatDuration = (seconds: number): string => { ... };

// BAD — never use default exports
export default function formatDuration() { ... }
```

Every folder under `src/` has an `index.ts` that re-exports everything:

```ts
// src/utils/index.ts
export { formatDuration } from './formatDuration';
export { buildTheme } from './buildTheme';
```

Consumers always import from the barrel, never from deep paths:

```ts
// GOOD
import { formatDuration } from '@/utils';

// BAD
import { formatDuration } from '@/utils/formatDuration';
```

---

## 2. Path aliases

`@/` maps to `src/` (configured in `tsconfig.json`). Use it everywhere:

```ts
import { HassEntity } from '@/types';
import { formatDuration } from '@/utils';
import { useMediaPlayers } from '@/hooks';
import { MediaCard } from '@/components';
```

---

## 3. TypeScript — no `any`, ever

- Prefer `unknown` over `any` when the type is genuinely unknown, then narrow.
- Use `satisfies` to validate literal objects against a type without widening.
- Explicit return types on all hooks and non-trivial functions.
- Shared data-shape types go in `src/types/`, not co-located with components.

```ts
// GOOD
const parseEntity = (raw: unknown): HassEntity => { ... };

// BAD
const parseEntity = (raw: any) => { ... };
```

---

## 4. Component structure

Each component gets its own folder:

```
src/components/
└── MediaCard/
    ├── MediaCard.tsx        # implementation
    ├── MediaCard.types.ts   # props type
    └── index.ts             # export { MediaCard } from './MediaCard';
```

Props interfaces are always named `<ComponentName>Props`:

```ts
// MediaCard.types.ts
export interface MediaCardProps {
  player: MediaPlayerEntity;
  onPress: () => void;
}
```

Screens live in `app/` and use default exports (Expo Router requirement). Everything reusable lives under `src/` and uses named exports.

---

## 5. Hooks

One hook per file, named `use<Thing>.ts`, lives in `src/hooks/`.

```ts
// src/hooks/useHassConnection.ts
export const useHassConnection = (): HassConnectionState => { ... };
```

Export the hook and its return type from `src/hooks/index.ts`.

---

## 6. Theming — `useTheme` and `AppTheme` tokens

All colors come from the theme. No hardcoded color strings anywhere in component code.

```tsx
import { useTheme } from '@/hooks';

const MyComponent = () => {
  const theme = useTheme();
  return (
    <View style={{ backgroundColor: theme.surface }}>
      <Text style={{ color: theme.onSurface }}>…</Text>
    </View>
  );
};
```

Key token groups from `AppTheme`:

| Group | Tokens |
|---|---|
| Primary | `primary`, `onPrimary`, `primaryContainer`, `onPrimaryContainer` |
| Secondary | `secondary`, `onSecondary`, `secondaryContainer`, `onSecondaryContainer` |
| Surface | `surface`, `onSurface`, `surfaceVariant`, `onSurfaceVariant`, `surfaceContainer`, `surfaceContainerLow`, `surfaceContainerHigh` |
| Background | `background`, `onBackground` |
| Error | `error`, `onError`, `errorContainer`, `onErrorContainer` |
| Outline | `outline`, `outlineVariant` |
| Misc | `scrim`, `shadow`, `inverseSurface`, `inverseOnSurface`, `inversePrimary` |

Common usage guidelines:
- Card backgrounds → `theme.surfaceContainer`
- Screen backgrounds → `theme.background`
- State badges → `theme.secondaryContainer` / `theme.onSecondaryContainer`
- Primary actions (buttons, play icon) → `theme.primary` / `theme.onPrimary`
- Error states → `theme.error` / `theme.errorContainer`
- Subtle labels / placeholder text → `theme.onSurfaceVariant`
- Dividers / input borders → `theme.outline`
- Overlay scrim → `theme.scrim` at reduced opacity

---

## 7. Styles — `createUseStyles`

Use `createUseStyles` from `@/utils` for all component stylesheets. It accepts a factory `(theme: AppTheme) => styleObject`, wraps it in `StyleSheet.create` internally, and returns a hook that memoizes the result against theme changes.

```ts
import { createUseStyles } from '@/utils';

const useStyles = createUseStyles(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  title: {
    color: theme.onSurface,
    fontSize: 18,
    fontWeight: '600',
  },
}));
```

Inside the component:

```tsx
const MyComponent = () => {
  const styles = useStyles();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello</Text>
    </View>
  );
};
```

- Declare `useStyles` at module scope (below the component), never inside it.
- Do not import `StyleSheet` directly in component files — `createUseStyles` handles it.
- For one-off dynamic values that depend on runtime state (not theme), use an inline style object alongside the stylesheet styles.

---

## 8. Forms — TanStack Form + ArkType

Use `@tanstack/react-form` for form state and `arktype` for schema validation.

### Schema

Define an ArkType schema at module scope (above the component):

```ts
import { type } from 'arktype';

const myFormSchema = type({
  name: 'string >= 1',       // non-empty string
  port: 'string',
  enabled: 'boolean',
});
```

### Form setup

```ts
import { useForm } from '@tanstack/react-form';

const form = useForm({
  defaultValues: { name: '', port: '8123', enabled: false },
  onSubmit: async ({ value }) => {
    const result = myFormSchema(value);
    if (result instanceof type.errors) return; // field validators already surfaced errors
    // use result.name, result.port, result.enabled …
  },
});
```

### Field with inline validation

```tsx
<form.Field
  name="name"
  validators={{
    onChange: ({ value }) =>
      myFormSchema.get('name')(value) instanceof type.errors
        ? 'Name is required'
        : undefined,
  }}
>
  {field => (
    <View>
      <TextInput
        value={field.state.value}
        onChangeText={field.handleChange}
        onBlur={field.handleBlur}
        style={[styles.input, field.state.meta.errors.length > 0 && styles.inputError]}
      />
      {field.state.meta.errors.length > 0 && (
        <Text style={styles.fieldError}>{field.state.meta.errors[0]}</Text>
      )}
    </View>
  )}
</form.Field>
```

### Submit button driven by form state

```tsx
<form.Subscribe selector={state => state.isSubmitting}>
  {isSubmitting => (
    <Pressable onPress={form.handleSubmit} disabled={isSubmitting}>
      <Text>{isSubmitting ? 'Saving…' : 'Save'}</Text>
    </Pressable>
  )}
</form.Subscribe>
```

---

## 9. File-level organisation

Within a file, keep sections in this order, separated by `// ─── Section ───` dividers:

1. Imports
2. Validation schema (ArkType, if any)
3. Constants / module-level values
4. Component function
5. Styles (`const useStyles = createUseStyles(...)`)
