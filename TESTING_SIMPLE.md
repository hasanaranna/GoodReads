# Testing - Simple Explanation

## When Are Tests Run?

**Automatically on GitHub** when you:
- Push code to any branch
- Create a Pull Request
- Update a Pull Request

**Locally** when you type:
```bash
cd backend && npm test
cd frontend && npm test -- --run
```

---

## Who Runs Them?

**GitHub's computers** - not you, not your computer.

When you push code:
1. GitHub sees the change
2. GitHub starts its own computer (server)
3. That server downloads your code
4. That server installs dependencies
5. That server runs the tests
6. That server shows you results

---

## How To See Results

### On GitHub PR Page:
1. Go to https://github.com/hasanaranna/GoodReads/pull/21
2. Scroll down
3. Look for "Checks" section
4. You'll see:
   - ✅ Tests passed (green checkmark)
   - ❌ Tests failed (red X)

### On Your Computer:
```bash
cd backend
npm test

# You'll see:
# PASS __tests__/unit/books.service.test.js
# PASS __tests__/integration/auth.integration.test.js
# Tests: 40 passed, 40 total
```

---

## What Do Tests Check?

**Backend tests** (40 tests):
- Login works correctly
- Searching works
- Updating reviews works
- Errors are handled properly

**Frontend tests** (11 tests):
- Login form displays
- Form validation works
- Buttons work
- Error messages show

---

## What Happens If Tests Fail?

1. GitHub shows red X on your PR
2. You see error message explaining what broke
3. You fix the code
4. You push again
5. Tests run again automatically
6. Hopefully green checkmarks this time ✅

---

## That's It

Tests = automated quality control. No human clicking buttons. Computers doing it all.

When tests pass = safe to merge
When tests fail = fix code first

Simple.
