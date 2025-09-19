import { TemplateDef, TemplateBasicFields, GeneratedCase } from "./templateTypes";

// 🔧 Replace this array by importing your existing templates.
// The uiMeta block is OPTIONAL and ignored by your current system.
export const templates: TemplateDef[] = [
  {
    id: "login-basic",
    name: "Login (Basic)",
    description: "Happy path + invalid + locked account.",
    uiMeta: {
      beginner: true,
      useFor: "Web app sign-in pages",
      bullets: ["Happy/Invalid/Locked flows", "Steps or Gherkin output", "Preconditions supported"]
    },
    generate: (input) => defaultLoginGenerator(input),
  },
  {
    id: "signup-basic",
    name: "Sign-up (Email)",
    description: "Create account, invalid email, duplicate email.",
    uiMeta: {
      beginner: true,
      useFor: "Email/password registration",
      bullets: ["Valid + invalid paths", "Field validations", "Email edge cases"]
    },
    generate: (input) => defaultSignupGenerator(input),
  },
  {
    id: "search-basic",
    name: "Search (Basic)",
    description: "Search functionality with various inputs and filters.",
    uiMeta: {
      beginner: true,
      useFor: "Search boxes and filters",
      bullets: ["Valid/empty/special char searches", "Result validation", "Filter combinations"]
    },
    generate: (input) => defaultSearchGenerator(input),
  },
  {
    id: "form-validation",
    name: "Form Validation",
    description: "Form field validation with required/optional fields.",
    uiMeta: {
      beginner: true,
      useFor: "Contact forms, user profiles",
      bullets: ["Required field validation", "Format validation", "Success scenarios"]
    },
    generate: (input) => defaultFormGenerator(input),
  },
  {
    id: "api-crud",
    name: "API CRUD Operations",
    description: "Create, Read, Update, Delete API endpoint testing.",
    uiMeta: {
      beginner: true,
      useFor: "REST API endpoints",
      bullets: ["CRUD operations", "Status code validation", "Error handling"]
    },
    generate: (input) => defaultApiGenerator(input),
  },
  {
    id: "e-commerce-cart",
    name: "Shopping Cart",
    description: "E-commerce cart functionality with add/remove/update.",
    uiMeta: {
      beginner: true,
      useFor: "E-commerce shopping flows",
      bullets: ["Add/remove items", "Quantity updates", "Cart persistence"]
    },
    generate: (input) => defaultCartGenerator(input),
  },
  // Advanced templates (no uiMeta or beginner=false)
  {
    id: "payment-flow",
    name: "Payment Processing",
    description: "Complex payment flow with multiple payment methods.",
    generate: (input) => defaultPaymentGenerator(input),
  },
  {
    id: "user-permissions",
    name: "User Permissions & Roles",
    description: "Role-based access control and permission testing.",
    generate: (input) => defaultPermissionsGenerator(input),
  },
];

function toCSVSteps(lines: string[]) {
  // Join steps into single cell, one per line
  return lines.join("\n");
}

// --- simple built-in generators (safe defaults) ---
function defaultLoginGenerator(input: TemplateBasicFields): GeneratedCase[] {
  const feat = input.feature || "Login";
  const prec = input.preconditions?.trim();
  if (input.outputStyle === "gherkin") {
    return [
      {
        title: `${feat}: valid user can sign in`,
        preconditions: prec,
        steps: toCSVSteps([
          "Given I am on the login page",
          "When I submit valid email and password",
          "Then I should see the dashboard"
        ]),
        expected: "User lands on dashboard",
        priority: input.priority,
        tags: (input.tags || []).join(","),
        owner: input.owner,
        component: input.component,
      },
      {
        title: `${feat}: invalid password shows error`,
        preconditions: prec,
        steps: toCSVSteps([
          "Given I am on the login page",
          "When I submit a valid email and wrong password",
          "Then I should see an error message"
        ]),
        expected: "Inline error is displayed; user stays on login",
        priority: input.priority,
        tags: (input.tags || []).join(","),
        owner: input.owner,
        component: input.component,
      },
      {
        title: `${feat}: locked account is blocked`,
        preconditions: prec,
        steps: toCSVSteps([
          "Given my account is locked",
          "When I try to sign in",
          "Then I should see 'account locked' guidance"
        ]),
        expected: "Locked account message and help link",
        priority: input.priority,
        tags: (input.tags || []).join(","),
        owner: input.owner,
        component: input.component,
      },
    ];
  }
  // steps style
  return [
    {
      title: `${feat}: valid user can sign in`,
      preconditions: prec,
      steps: toCSVSteps([
        "Open login page",
        "Enter valid email and password",
        "Click Sign in"
      ]),
      expected: "Dashboard page is shown",
      priority: input.priority,
      tags: (input.tags || []).join(","),
      owner: input.owner,
      component: input.component,
    },
    {
      title: `${feat}: invalid password shows error`,
      preconditions: prec,
      steps: toCSVSteps([
        "Open login page",
        "Enter valid email and wrong password",
        "Click Sign in"
      ]),
      expected: "Inline error 'Invalid credentials'",
      priority: input.priority,
      tags: (input.tags || []).join(","),
      owner: input.owner,
      component: input.component,
    },
    {
      title: `${feat}: locked account is blocked`,
      preconditions: prec,
      steps: toCSVSteps([
        "Ensure the account is locked",
        "Attempt login",
      ]),
      expected: "Locked account message with help link",
      priority: input.priority,
      tags: (input.tags || []).join(","),
      owner: input.owner,
      component: input.component,
    },
  ];
}

function defaultSignupGenerator(input: TemplateBasicFields): GeneratedCase[] {
  const feat = input.feature || "Sign-up";
  const prec = input.preconditions?.trim();
  return [
    {
      title: `${feat}: create account successfully`,
      preconditions: prec,
      steps: toCSVSteps([
        "Open sign-up page",
        "Enter valid email and strong password",
        "Accept terms and submit"
      ]),
      expected: "Account created & welcome screen shown",
      priority: input.priority,
      tags: (input.tags || []).join(","),
      owner: input.owner,
      component: input.component,
    },
    {
      title: `${feat}: invalid email blocked`,
      preconditions: prec,
      steps: toCSVSteps([
        "Open sign-up page",
        "Enter invalid email and valid password",
        "Submit"
      ]),
      expected: "Email validation error displayed",
      priority: input.priority,
      tags: (input.tags || []).join(","),
      owner: input.owner,
      component: input.component,
    },
    {
      title: `${feat}: duplicate email handled`,
      preconditions: prec,
      steps: toCSVSteps([
        "Open sign-up page",
        "Enter an email that already exists",
        "Submit"
      ]),
      expected: "Duplicate email error; account not created",
      priority: input.priority,
      tags: (input.tags || []).join(","),
      owner: input.owner,
      component: input.component,
    },
  ];
}

function defaultSearchGenerator(input: TemplateBasicFields): GeneratedCase[] {
  const feat = input.feature || "Search";
  const prec = input.preconditions?.trim();
  return [
    {
      title: `${feat}: valid search returns results`,
      preconditions: prec,
      steps: toCSVSteps([
        "Open search page",
        "Enter valid search term",
        "Click search or press Enter"
      ]),
      expected: "Relevant results displayed with count",
      priority: input.priority,
      tags: (input.tags || []).join(","),
      owner: input.owner,
      component: input.component,
    },
    {
      title: `${feat}: empty search handled gracefully`,
      preconditions: prec,
      steps: toCSVSteps([
        "Open search page",
        "Submit empty search",
      ]),
      expected: "No results message or prompt to enter search term",
      priority: input.priority,
      tags: (input.tags || []).join(","),
      owner: input.owner,
      component: input.component,
    },
    {
      title: `${feat}: special characters in search`,
      preconditions: prec,
      steps: toCSVSteps([
        "Open search page",
        "Enter search with special characters (!@#$%)",
        "Submit search"
      ]),
      expected: "Search handled without errors",
      priority: input.priority,
      tags: (input.tags || []).join(","),
      owner: input.owner,
      component: input.component,
    },
  ];
}

function defaultFormGenerator(input: TemplateBasicFields): GeneratedCase[] {
  const feat = input.feature || "Form";
  const prec = input.preconditions?.trim();
  return [
    {
      title: `${feat}: valid form submission`,
      preconditions: prec,
      steps: toCSVSteps([
        "Open form page",
        "Fill all required fields with valid data",
        "Submit form"
      ]),
      expected: "Form submitted successfully with confirmation",
      priority: input.priority,
      tags: (input.tags || []).join(","),
      owner: input.owner,
      component: input.component,
    },
    {
      title: `${feat}: required field validation`,
      preconditions: prec,
      steps: toCSVSteps([
        "Open form page",
        "Leave required fields empty",
        "Submit form"
      ]),
      expected: "Validation errors shown for required fields",
      priority: input.priority,
      tags: (input.tags || []).join(","),
      owner: input.owner,
      component: input.component,
    },
    {
      title: `${feat}: email format validation`,
      preconditions: prec,
      steps: toCSVSteps([
        "Open form page",
        "Enter invalid email format",
        "Submit form"
      ]),
      expected: "Email format validation error displayed",
      priority: input.priority,
      tags: (input.tags || []).join(","),
      owner: input.owner,
      component: input.component,
    },
  ];
}

function defaultApiGenerator(input: TemplateBasicFields): GeneratedCase[] {
  const feat = input.feature || "API";
  const endpoint = input.scopeOrUrl || "/api/resource";
  const prec = input.preconditions?.trim();
  return [
    {
      title: `${feat}: CREATE - valid data`,
      preconditions: prec,
      steps: toCSVSteps([
        `POST ${endpoint}`,
        "Send valid JSON payload",
        "Verify response"
      ]),
      expected: "201 Created with resource ID",
      priority: input.priority,
      tags: (input.tags || []).join(","),
      owner: input.owner,
      component: input.component,
    },
    {
      title: `${feat}: READ - existing resource`,
      preconditions: prec,
      steps: toCSVSteps([
        `GET ${endpoint}/{id}`,
        "Use valid resource ID",
        "Verify response"
      ]),
      expected: "200 OK with resource data",
      priority: input.priority,
      tags: (input.tags || []).join(","),
      owner: input.owner,
      component: input.component,
    },
    {
      title: `${feat}: UPDATE - valid changes`,
      preconditions: prec,
      steps: toCSVSteps([
        `PUT ${endpoint}/{id}`,
        "Send updated JSON payload",
        "Verify response"
      ]),
      expected: "200 OK with updated resource",
      priority: input.priority,
      tags: (input.tags || []).join(","),
      owner: input.owner,
      component: input.component,
    },
    {
      title: `${feat}: DELETE - existing resource`,
      preconditions: prec,
      steps: toCSVSteps([
        `DELETE ${endpoint}/{id}`,
        "Use valid resource ID",
        "Verify response"
      ]),
      expected: "204 No Content or 200 OK",
      priority: input.priority,
      tags: (input.tags || []).join(","),
      owner: input.owner,
      component: input.component,
    },
  ];
}

function defaultCartGenerator(input: TemplateBasicFields): GeneratedCase[] {
  const feat = input.feature || "Shopping Cart";
  const prec = input.preconditions?.trim();
  return [
    {
      title: `${feat}: add item to empty cart`,
      preconditions: prec,
      steps: toCSVSteps([
        "Navigate to product page",
        "Click 'Add to Cart'",
        "Verify cart updates"
      ]),
      expected: "Item added, cart count shows 1",
      priority: input.priority,
      tags: (input.tags || []).join(","),
      owner: input.owner,
      component: input.component,
    },
    {
      title: `${feat}: update item quantity`,
      preconditions: prec,
      steps: toCSVSteps([
        "Add item to cart",
        "Open cart page",
        "Change quantity and update"
      ]),
      expected: "Quantity updated, total price recalculated",
      priority: input.priority,
      tags: (input.tags || []).join(","),
      owner: input.owner,
      component: input.component,
    },
    {
      title: `${feat}: remove item from cart`,
      preconditions: prec,
      steps: toCSVSteps([
        "Add item to cart",
        "Open cart page",
        "Click remove item"
      ]),
      expected: "Item removed, cart count decreases",
      priority: input.priority,
      tags: (input.tags || []).join(","),
      owner: input.owner,
      component: input.component,
    },
  ];
}

function defaultPaymentGenerator(input: TemplateBasicFields): GeneratedCase[] {
  const feat = input.feature || "Payment";
  const prec = input.preconditions?.trim();
  return [
    {
      title: `${feat}: credit card payment success`,
      preconditions: prec,
      steps: toCSVSteps([
        "Proceed to checkout",
        "Enter valid credit card details",
        "Submit payment"
      ]),
      expected: "Payment processed, confirmation shown",
      priority: input.priority,
      tags: (input.tags || []).join(","),
      owner: input.owner,
      component: input.component,
    },
    {
      title: `${feat}: declined card handling`,
      preconditions: prec,
      steps: toCSVSteps([
        "Proceed to checkout",
        "Enter declined card details",
        "Submit payment"
      ]),
      expected: "Decline message shown, order not processed",
      priority: input.priority,
      tags: (input.tags || []).join(","),
      owner: input.owner,
      component: input.component,
    },
  ];
}

function defaultPermissionsGenerator(input: TemplateBasicFields): GeneratedCase[] {
  const feat = input.feature || "Permissions";
  const prec = input.preconditions?.trim();
  return [
    {
      title: `${feat}: admin can access all features`,
      preconditions: prec,
      steps: toCSVSteps([
        "Log in as admin user",
        "Navigate to admin panel",
        "Verify all features accessible"
      ]),
      expected: "Full access to all administrative features",
      priority: input.priority,
      tags: (input.tags || []).join(","),
      owner: input.owner,
      component: input.component,
    },
    {
      title: `${feat}: regular user blocked from admin`,
      preconditions: prec,
      steps: toCSVSteps([
        "Log in as regular user",
        "Attempt to access admin panel",
        "Verify access denied"
      ]),
      expected: "Access denied message or redirect",
      priority: input.priority,
      tags: (input.tags || []).join(","),
      owner: input.owner,
      component: input.component,
    },
  ];
}

export function getTemplateById(id: string) {
  return templates.find((t) => t.id === id);
}