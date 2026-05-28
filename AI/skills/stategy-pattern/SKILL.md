---
name: strategy
description: This skill should be used when the user asks about "strategy pattern", "when to use strategy", "implement strategy", "algorithm selection", "interchangeable algorithms", "runtime algorithm", or mentions needing to switch algorithms at runtime.
version: 1.0.0
---

# Strategy Pattern

## What Is It
The Strategy pattern defines a family of algorithms, encapsulates each one, and makes them interchangeable. It lets the algorithm vary independently from clients that use it, enabling runtime selection of behavior.

## When to Use
- **Multiple algorithm variants** - Different ways to accomplish the same task
- **Sorting algorithms** - QuickSort, MergeSort, HeapSort based on data
- **Compression** - Different compression algorithms based on file type
- **Payment methods** - Credit card, PayPal, crypto at checkout
- **Route planning** - Fastest, shortest, most scenic routes
- **Validation rules** - Different validation strategies per context

## When NOT to Use
- **Single algorithm** - No need if there's only one way to do something
- **Simple conditionals** - If-else works for simple cases
- **Algorithm rarely changes** - Hardcoding is simpler
- **Performance critical** - Strategy adds method call overhead

## How to Implement

### Implementation Steps
1. Define a strategy interface common to all algorithms
2. Create concrete strategy classes implementing the interface
3. Create a context class that holds a strategy reference
4. Context delegates work to the strategy object
5. Client can swap strategies at runtime

### TypeScript Implementation

```typescript
// Strategy interface
interface SortStrategy {
  sort<T>(data: T[]): T[];
}

// Concrete strategies
class QuickSortStrategy implements SortStrategy {
  sort<T>(data: T[]): T[] {
    // QuickSort implementation
    return [...data].sort();
  }
}

class MergeSortStrategy implements SortStrategy {
  sort<T>(data: T[]): T[] {
    // MergeSort implementation
    return [...data].sort();
  }
}

// Context
class SortedList<T> {
  private strategy: SortStrategy;

  constructor(strategy: SortStrategy) {
    this.strategy = strategy;
  }

  setStrategy(strategy: SortStrategy): void {
    this.strategy = strategy;
  }

  sort(data: T[]): T[] {
    return this.strategy.sort(data);
  }
}
```

## Code Examples
See `examples/` directory for runnable TypeScript implementations:
- `examples/strategy.ts` - Basic implementation with sorting algorithms
- `examples/strategy-advanced.ts` - Real-world example with payment processing

## Related Patterns
- **State** - State changes behavior based on state; Strategy changes algorithm
- **Command** - Command encapsulates request; Strategy encapsulates algorithm
- **Template Method** - Template uses inheritance; Strategy uses composition
- **Decorator** - Decorator adds behavior; Strategy replaces behavior
