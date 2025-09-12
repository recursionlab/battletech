# Architecture Documentation

## System Overview

This project implements a **Layered + Modular Architecture** that prevents monolithic design through:

1. **Clear boundaries** between layers
2. **Dependency inversion** at layer boundaries  
3. **Module independence** within feature domains
4. **Interface segregation** for loose coupling

## Architecture Layers

### 1. Core Layer (`src/core/`)
- **Purpose**: Domain entities, business rules, and fundamental types
- **Dependencies**: None (pure business logic)
- **Examples**: User entity, validation rules, domain events

### 2. Service Layer (`src/services/`)  
- **Purpose**: Technical services that support business operations
- **Dependencies**: Core interfaces only
- **Examples**: Database access, external APIs, logging

### 3. Module Layer (`src/modules/`)
- **Purpose**: Feature-specific implementations
- **Dependencies**: Core + Services (through interfaces)
- **Examples**: Authentication module, user management

### 4. Infrastructure Layer
- **Purpose**: External concerns (databases, web frameworks, etc.)
- **Dependencies**: All layers through dependency injection
- **Examples**: Express controllers, database repositories

## Module Design Patterns

### Feature Module Template
```typescript
// Module structure
modules/feature/
├── index.ts              # Public API
├── feature.service.ts    # Business logic
├── feature.repository.ts # Data access
├── feature.controller.ts # External interface  
├── feature.types.ts      # Type definitions
└── __tests__/           # Module tests
```

### Interface-Based Design
```typescript
// Define interfaces in core
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
}

// Implement in modules
export class PostgresUserRepository implements UserRepository {
  // Implementation details
}
```

## Dependency Flow Rules

1. **Core** depends on nothing
2. **Services** depend only on Core interfaces
3. **Modules** depend on Core + Service interfaces
4. **Infrastructure** depends on everything through DI

```
┌─────────────┐
│    Web      │ ← HTTP, CLI, etc.
├─────────────┤
│   Modules   │ ← Features (auth, user, etc.)  
├─────────────┤
│  Services   │ ← Cross-cutting concerns
├─────────────┤
│    Core     │ ← Business rules, entities
└─────────────┘
```

## Anti-Patterns to Avoid

### ❌ Circular Dependencies
```typescript
// BAD: auth depends on user, user depends on auth
import { UserService } from '../user/user.service';
import { AuthService } from '../auth/auth.service';
```

### ❌ God Classes
```typescript
// BAD: Single class doing too much
class ApplicationManager {
  authenticateUser() { ... }
  processPayment() { ... }
  sendEmail() { ... }
  generateReport() { ... }
}
```

### ❌ Direct Database Access
```typescript
// BAD: Business logic mixed with data access
class UserService {
  async createUser(data: any) {
    const result = await db.query('INSERT INTO users...'); // Direct DB access
  }
}
```

## Design Patterns Used

### 1. Repository Pattern
Abstracts data access behind interfaces:
```typescript
interface UserRepository {
  save(user: User): Promise<void>;
}
```

### 2. Dependency Injection
Services receive dependencies through constructor:
```typescript
class UserService {
  constructor(private userRepo: UserRepository) {}
}
```

### 3. Factory Pattern
Creates complex objects:
```typescript
class ServiceFactory {
  createUserService(): UserService {
    return new UserService(this.createUserRepository());
  }
}
```

## Testing Strategy

### Unit Tests
- Test individual classes in isolation
- Mock all dependencies
- Focus on business logic

### Integration Tests  
- Test module interactions
- Use test database
- Verify complete workflows

### Architecture Tests
- Verify dependency rules
- Check for circular dependencies
- Validate layer boundaries

---

*Remember: Good architecture is not about following rules blindly, but about making code easier to understand, test, and change.*