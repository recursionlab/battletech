# ΞKernel Usage Examples

Your AI knowledge assistant with persistent memory. Here's exactly how to use it:

## 🚀 Quick Start

**Interactive Mode (Easiest):**
```bash
npx tsx scripts/xi-cli.ts
```

**Programmatic Mode:**
```typescript
import { ΞKernel } from './src/core/xi-kernel';
import { TrulyFreeOpenRouterPort } from './src/core/llm-providers/truly-free-openrouter-port';

const kernel = new ΞKernel(new TrulyFreeOpenRouterPort({
  apiKey: 'your-openrouter-key',
  model: 'openrouter/sonoma-dusk-alpha'
}));
```

## 💬 Basic Usage Patterns

### 1. **Ask Questions** (Just talk naturally)
```
🤔 You: What is quantum computing?
🤖 AI: Quantum computing uses quantum bits (qubits) that can exist in multiple states...
```

### 2. **Store Knowledge**
```
🤔 You: Remember that I work at Tesla as a software engineer
🤖 AI: I've stored that information. You work at Tesla as a software engineer...
```

### 3. **Query Stored Knowledge**
```
🤔 You: What do you know about my work?
🤖 AI: Based on what you've told me, you work at Tesla as a software engineer...
```

### 4. **Analysis & Reasoning**
```
🤔 You: Analyze the pros and cons of remote work
🤖 AI: Here's a detailed analysis of remote work advantages and disadvantages...
```

## 📋 Common Use Cases

### 🏢 **Business Knowledge Base**
```typescript
// Store company information
await kernel.prompt('company_policies', {
  task: 'Store: Our company has a 4-day work week, unlimited PTO, and focuses on sustainability',
  context: { type: 'company_info' }
});

// Query later
await kernel.prompt('policy_question', {
  task: 'What is our vacation policy?',
  context: { relatedTo: 'company_policies' }
});
```

### 📚 **Personal Learning**
```typescript
// Store what you learn
await kernel.prompt('machine_learning_notes', {
  task: 'Store: Machine learning has 3 main types - supervised, unsupervised, and reinforcement learning',
  context: { subject: 'AI', type: 'study_notes' }
});

// Test your knowledge
await kernel.prompt('ml_quiz', {
  task: 'Quiz me on machine learning types',
  context: { relatedTo: 'machine_learning_notes' }
});
```

### 🔬 **Research Assistant**
```typescript
// Store research findings
await kernel.prompt('climate_research', {
  task: 'Store: Latest IPCC report shows global temperature rise of 1.1°C since 1880',
  context: { domain: 'climate_science', source: 'IPCC_2023' }
});

// Analyze implications
await kernel.prompt('climate_analysis', {
  task: 'What are the implications of the temperature data I stored?',
  context: { relatedTo: 'climate_research', type: 'analysis' }
});
```

### 📝 **Project Management**
```typescript
// Store project details
await kernel.prompt('project_alpha', {
  task: 'Store: Project Alpha - Web app for inventory management, due March 2024, team of 4 developers',
  context: { type: 'project', priority: 'high' }
});

// Get project insights
await kernel.prompt('project_status', {
  task: 'What are the risks and next steps for Project Alpha?',
  context: { relatedTo: 'project_alpha', type: 'planning' }
});
```

## ⌨️ CLI Commands

```
/help     - Show help message
/status   - View knowledge base stats
/export   - Export all knowledge to JSON
/quit     - Exit assistant
```

## 🧠 Advanced Features

### **Multi-step Reasoning**
```typescript
// Let AI think through complex problems step-by-step
const result = await kernel.evaluate('complex_problem_id', 3);
console.log(`AI completed ${result.steps} reasoning steps`);
```

### **Knowledge Relationships**
```typescript
// Create connections between concepts
await kernel.link('concept_a', 'concept_b', 'influences');
```

### **Persistent Memory**
```typescript
// Export your knowledge base
const knowledge = kernel.exportState();
console.log(`Stored: ${knowledge.metadata.totalSymbols} items`);
```

## 💡 Pro Tips

### **Effective Prompting**
✅ **Good:** "Store that I'm learning React and prefer functional components"
✅ **Good:** "What are the best practices for the React approach I'm using?"

❌ **Avoid:** Vague questions without context

### **Knowledge Organization**
- Use descriptive IDs: `react_best_practices` not `stuff1`
- Add context: `{ domain: 'programming', language: 'javascript' }`
- Build connections: Link related concepts together

### **Cost Management**
- Sonoma Dusk Alpha is **FREE** during testing
- Export your knowledge regularly as backup
- Use specific questions to get focused answers

## 🔄 Example Session

```
🚀 Starting ΞKernel CLI...

🤔 You: I'm working on a Python web app using FastAPI
🤖 AI: I've noted that you're working on a Python web application using FastAPI...

🤔 You: What are the security best practices for FastAPI?
🤖 AI: For FastAPI security, here are key best practices:
1. Use OAuth2 with JWT tokens...
2. Implement CORS properly...
3. Validate all inputs with Pydantic...

🤔 You: Store that I'm using PostgreSQL as the database
🤖 AI: Stored! You're using PostgreSQL as your database for the FastAPI project...

🤔 You: /status
📊 Knowledge Base Status
🧠 Stored Knowledge: 3 items
💸 Session Cost: $0.000000

🤔 You: What's a good database schema design for my setup?
🤖 AI: Based on your FastAPI + PostgreSQL setup, here's a recommended schema approach...
```

## 🎯 Next Steps

1. **Try the CLI:** `npx tsx scripts/xi-cli.ts`
2. **Feed it knowledge** about your work, projects, interests
3. **Ask questions** about what you stored
4. **Export your knowledge** regularly for backup
5. **Build your personal AI assistant** over time

---

**💸 Cost: $0.00** with Sonoma Dusk Alpha during testing period  
**🧠 Memory: Unlimited** - AI remembers everything across sessions  
**🚀 Ready to use** - Just run the CLI and start chatting!