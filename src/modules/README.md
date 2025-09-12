# Modules

This directory contains feature modules. Each module should be:

- **Self-contained**: Contains all files related to a specific feature
- **Loosely coupled**: Minimal dependencies on other modules  
- **Highly cohesive**: All files serve the same feature

## Structure Example:
```
modules/
├── auth/
│   ├── index.ts
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   └── auth.types.ts
└── user/
    ├── index.ts
    ├── user.service.ts
    ├── user.controller.ts
    └── user.types.ts
```