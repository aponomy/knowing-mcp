# Browser Automation Examples

## Real-World Use Cases

### 1. Azure Portal Automation

**Scenario:** Create a new resource group in Azure Portal

```
User: "Navigate to Azure Portal"
Copilot: *Opens browser to https://portal.azure.com*

User: *Manually logs in with Microsoft account (first time only)*
Copilot: ✅ You're now logged in - session is saved!

User: "Create a new resource group called 'demo-rg' in West US 2"
Copilot executes:
  1. browser-click { selector: "[aria-label='Create a resource']" }
  2. browser-type { selector: "#search", text: "resource group" }
  3. browser-click { selector: "text=Resource group" }
  4. browser-click { selector: "text=Create" }
  5. browser-fill { selector: "#resourceGroupName", value: "demo-rg" }
  6. browser-select { selector: "#region", value: "West US 2" }
  7. browser-click { selector: "button:has-text('Review + create')" }
  8. browser-screenshot { path: "~/azure-rg-created.png" }
```

### 2. GitHub PR Workflow

**Scenario:** Create a pull request

```
User: "Go to my repo and create a PR from feature-branch to main"

Copilot executes:
  1. browser-navigate { url: "https://github.com/owner/repo" }
  2. browser-wait-for { selector: ".pull-request-button" }
  3. browser-click { selector: ".pull-request-button" }
  4. browser-select { selector: "#base-branch", value: "main" }
  5. browser-select { selector: "#compare-branch", value: "feature-branch" }
  6. browser-fill { selector: "#pr-title", value: "Add new feature" }
  7. browser-fill { selector: "#pr-body", value: "This PR adds..." }
  8. browser-click { selector: "button:has-text('Create pull request')" }
```

### 3. Web Scraping / Data Extraction

**Scenario:** Extract data from a dashboard

```
User: "Go to our monitoring dashboard and get the latest CPU metrics"

Copilot executes:
  1. browser-navigate { url: "https://monitoring.company.com" }
  2. browser-wait-for { selector: ".metrics-loaded" }
  3. browser-get-text { selector: ".cpu-metric .value" }
  4. browser-screenshot { path: "~/dashboard.png" }
```

### 4. Form Filling Automation

**Scenario:** Fill out a complex form

```
User: "Fill out the contact form with my details"

Copilot executes:
  1. browser-fill { selector: "#firstName", value: "John" }
  2. browser-fill { selector: "#lastName", value: "Doe" }
  3. browser-fill { selector: "#email", value: "john@example.com" }
  4. browser-select { selector: "#country", value: "United States" }
  5. browser-type { selector: "#message", text: "I would like to..." }
  6. browser-click { selector: "input[type='checkbox'][name='agree']" }
  7. browser-click { selector: "button[type='submit']" }
  8. browser-wait-for { selector: ".success-message" }
  9. browser-get-text { selector: ".success-message" }
```

### 5. Testing / QA Automation

**Scenario:** Test a login flow

```
User: "Test the login flow on staging"

Copilot executes:
  1. browser-navigate { url: "https://staging.app.com/login" }
  2. browser-fill { selector: "#email", value: "test@example.com" }
  3. browser-fill { selector: "#password", value: "test123" }
  4. browser-click { selector: "button:has-text('Login')" }
  5. browser-wait-for { selector: ".dashboard", timeout: 5000 }
  6. browser-evaluate { script: "localStorage.getItem('authToken')" }
  7. browser-screenshot { path: "~/login-test.png" }
```

### 6. Content Management

**Scenario:** Publish a blog post

```
User: "Navigate to WordPress admin and create a new post"

Copilot executes:
  1. browser-navigate { url: "https://myblog.com/wp-admin" }
  2. browser-wait-for { selector: "#wp-admin-bar-new-content" }
  3. browser-hover { selector: "#wp-admin-bar-new-content" }
  4. browser-click { selector: "a:has-text('Post')" }
  5. browser-fill { selector: "#post-title-0", value: "My New Post" }
  6. browser-click { selector: ".editor-post-title" }
  7. browser-press { key: "Tab" }
  8. browser-type { selector: ".block-editor-default-block-appender", text: "Post content..." }
  9. browser-click { selector: "button:has-text('Publish')" }
```

### 7. DevOps Pipeline Monitoring

**Scenario:** Check build status

```
User: "Check the status of our CI/CD pipeline"

Copilot executes:
  1. browser-navigate { url: "https://dev.azure.com/org/project/_build" }
  2. browser-wait-for { selector: ".build-list-loaded" }
  3. browser-get-text { selector: ".build-row:first-child .build-status" }
  4. browser-click { selector: ".build-row:first-child" }
  5. browser-wait-for { selector: ".build-details" }
  6. browser-get-text { selector: ".build-details .stage-status" }
  7. browser-screenshot { path: "~/pipeline-status.png" }
```

### 8. E-commerce Automation

**Scenario:** Add items to cart and checkout

```
User: "Add the blue widget to my cart and proceed to checkout"

Copilot executes:
  1. browser-navigate { url: "https://shop.com/products/widget" }
  2. browser-select { selector: "#color", value: "blue" }
  3. browser-click { selector: ".add-to-cart" }
  4. browser-wait-for { selector: ".cart-notification" }
  5. browser-click { selector: "a:has-text('Checkout')" }
  6. browser-wait-for { selector: ".checkout-form" }
  7. browser-screenshot { path: "~/checkout.png" }
```

### 9. API Documentation Testing

**Scenario:** Test API endpoints via Swagger UI

```
User: "Test the /users endpoint in Swagger"

Copilot executes:
  1. browser-navigate { url: "https://api.company.com/docs" }
  2. browser-click { selector: ".opblock-tag-section:has-text('Users')" }
  3. browser-click { selector: "#operations-Users-get_users" }
  4. browser-click { selector: "button:has-text('Try it out')" }
  5. browser-click { selector: "button:has-text('Execute')" }
  6. browser-wait-for { selector: ".response-content" }
  7. browser-get-text { selector: ".response-content" }
```

### 10. Social Media Automation

**Scenario:** Schedule a LinkedIn post

```
User: "Post an update on LinkedIn"

Copilot executes:
  1. browser-navigate { url: "https://linkedin.com" }
  2. browser-click { selector: "button:has-text('Start a post')" }
  3. browser-type { selector: ".ql-editor", text: "Excited to announce..." }
  4. browser-click { selector: "button:has-text('Post')" }
  5. browser-wait-for { selector: ".feed-shared-update-v2" }
```

## CSS Selector Tips

### Common Patterns

```javascript
// By ID
"#element-id"

// By class
".class-name"

// By attribute
"[data-testid='submit']"
"[aria-label='Search']"
"[name='username']"

// By text content
"text=Login"
"button:has-text('Submit')"
"a:has-text('Learn More')"

// Combinations
"button.primary[type='submit']"
"input[type='text'][name='email']"

// Hierarchical
".form-container input[name='username']"
"nav .menu-item:first-child"

// Nth elements
".list-item:nth-child(2)"
".table-row:last-child"
```

### Using Browser DevTools

1. Open browser (it's visible in headed mode!)
2. Right-click element → Inspect
3. In DevTools, right-click element → Copy → Copy selector
4. Use that selector in your browser tools

### Testing Selectors

Use browser-evaluate to test:

```javascript
browser-evaluate { 
  script: "document.querySelector('.my-selector')?.textContent" 
}
```

## Best Practices

### 1. Always Wait for Elements

```javascript
// ❌ Don't do this
browser-click { selector: ".dynamic-button" }

// ✅ Do this
browser-wait-for { selector: ".dynamic-button" }
browser-click { selector: ".dynamic-button" }
```

### 2. Use Specific Selectors

```javascript
// ❌ Too generic
browser-click { selector: "button" }

// ✅ Specific
browser-click { selector: "#submit-form" }
browser-click { selector: "[data-testid='submit-button']" }
```

### 3. Handle Dynamic Content

```javascript
// Wait for page to fully load
browser-wait-for { selector: ".content-loaded" }

// Wait for network to be idle
browser-navigate { url: "...", waitUntil: "networkidle" }
```

### 4. Take Screenshots for Debugging

```javascript
// Before action
browser-screenshot { path: "~/before-action.png" }

// Perform action
browser-click { selector: ".button" }

// After action
browser-screenshot { path: "~/after-action.png" }
```

### 5. Manual Intervention Points

For complex multi-step processes:

```
User: "Start the Azure VM creation process"
Copilot: *navigates and fills initial form*

User: *reviews and makes adjustments manually*

User: "Continue with the deployment"
Copilot: *completes the process*
```

## Troubleshooting Common Issues

### Element Not Found

```
Error: Element not found: .my-button
```

**Solutions:**
1. Check if element exists: Use browser DevTools
2. Wait for element: Use `browser-wait-for`
3. Check selector: Use `browser-evaluate` to test
4. Dynamic content: Wait for parent container first

### Timeout Errors

```
Error: Timeout waiting for selector
```

**Solutions:**
1. Increase timeout: `{ timeout: 60000 }` (60 seconds)
2. Wait for different state: Try `state: "attached"` instead of `state: "visible"`
3. Check if page loaded: Use `browser-wait-for` with page load indicator

### Session Expired

```
Browser opens but you're logged out
```

**Solutions:**
1. Manually log in again (visible browser makes this easy)
2. Check if site cleared cookies
3. Some sites expire sessions after X days

### Wrong Element Clicked

```
Clicked wrong button
```

**Solutions:**
1. Make selector more specific
2. Use aria-label or data-testid attributes
3. Take screenshot first to verify element location
4. Use browser-hover to highlight element

## Performance Tips

### 1. Reuse Browser Instance

The browser stays open between tool calls - no need to close and reopen.

### 2. Minimize Screenshots

Screenshots are large - only take them when needed.

### 3. Use Efficient Selectors

ID selectors are fastest: `#element-id` > `.class-name` > complex queries

### 4. Batch Operations

Plan your automation to minimize page navigations:

```
// ❌ Multiple navigations
navigate to page1 → extract data → navigate to page2 → extract data

// ✅ Single session
navigate to page1 → extract data → click link to page2 → extract data
```

## Security Reminders

- Browser profile contains your login sessions
- Profile stored at `~/.mcp-chrome` by default
- Don't share your profile directory
- Visible browser = you can see everything = security feature
- Can always stop automation with Cmd+C

---

**Happy Automating! 🎉**
