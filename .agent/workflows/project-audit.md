---
description: Analyzes the codebase to identify critical paths (Business Logic, Auth) and generates a comprehensive TEST_STRATEGY.md file containing production-grade Vitest suites, mocking strategies, and coverage plans for both Node.js and React.
---

/project-audit - Comprehensive Test Suite Generation

$GOAL
Analyze the provided project structure/codebase to identify ALL critical paths (Business Logic, Auth, Data Mutation) and generate a comprehensive `TEST_STRATEGY.md` file containing both the plan and the actual Vitest code.

$OUTPUT_CONSTRAINT
DO NOT output the tests as chat text.
GENERATE A SINGLE MARKDOWN BLOCK starting with `# TEST_STRATEGY.md`.
The user will copy this content into a real file.

$EXECUTION_STEPS

1. 🔍 CRITICALITY SCAN (Scoring System)
   Analyze the code and assign priority scores (1-5):
   - Priority 5 (CRITICAL): Auth, Payments, Data Saving (POST/PUT/DELETE), Recursive Algorithms.
   - Priority 4 (HIGH): Complex State (Context/Redux), Custom Hooks, Form Validations.
   - Priority 3 (MID): Data Fetching (GET), Routing.
   - Priority 1-2 (LOW): UI Components (Buttons, Layouts), CSS.

2. 🛡️ COVERAGE STRATEGY
   For every Priority 4 & 5 item detected:
   - Create a corresponding Vitest suite.
   - Mock all external dependencies (DB, API, 3rd Party SDKs).
   - Include: Happy Path + Error Handling + Boundary Checks (Null/Undefined).

3. 📝 REPORT GENERATION (The .md File)
   Structure the Markdown file exactly like this:

   # TEST_STRATEGY.md
   
   ## 1. Executive Summary
   - Brief overview of critical paths detected.
   - List of High-Risk areas that MUST be tested.

   ## 2. Mocking Strategy
   - Define global mocks (e.g., `vi.mock('axios')`, `vi.mock('prisma')`).

   ## 3. Test Suites (The Code)
   *Group by module. For each critical module, provide the full test code.*

   ### 3.1 Backend: Product Service (`services/product.service.ts`)
   ```typescript
   // Full Vitest code for Product Service...