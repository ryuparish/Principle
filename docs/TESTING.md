# Principle Testing Guide

## Overview

Principle uses a comprehensive testing strategy with three types of tests:
- **Unit Tests**: Component and utility function tests using Vitest
- **Integration Tests**: Store and API interaction tests
- **E2E Tests**: End-to-end user flow tests using Playwright

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# View test report
npm run test:e2e:report
```

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { useToastStore } from './toastStore';

describe('ToastStore', () => {
  it('adds a toast', () => {
    const { addToast, toasts } = useToastStore.getState();

    addToast({
      type: 'success',
      message: 'Test toast'
    });

    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe('Test toast');
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test('searches for nodes', async ({ page }) => {
  await page.goto('/');

  // Open search with Ctrl+K
  await page.keyboard.press('Control+k');

  // Type search query
  const searchInput = page.locator('[placeholder="Search nodes..."]');
  await searchInput.fill('test');

  // Verify results appear
  await expect(page.locator('.search-results')).toBeVisible();
});
```

## Test Coverage Goals

- **Overall Coverage**: 80%+
- **Critical Paths**: 95%+
  - Undo/Redo system
  - Node creation/deletion
  - Edge management
  - Vim mode operations

## CI/CD Integration

Tests run automatically on:
- Pull request creation
- Commits to main branch
- Pre-deployment

## Troubleshooting

### Tests Failing Locally

1. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Update test snapshots:
   ```bash
   npm test -- -u
   ```

### E2E Tests Timing Out

1. Increase timeout in playwright.config.ts
2. Add explicit waits for async operations
3. Check if services are running on correct ports
