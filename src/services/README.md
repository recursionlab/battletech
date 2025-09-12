# Services

Cross-cutting services that modules can use:

- **Database Service**: Data persistence abstraction
- **Logger Service**: Centralized logging
- **Config Service**: Configuration management
- **HTTP Client**: External API communication
- **Event Bus**: Inter-module communication

These services implement dependency inversion - modules depend on interfaces, not implementations.