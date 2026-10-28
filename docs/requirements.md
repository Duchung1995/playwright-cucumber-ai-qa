# Requirements under test

Requirement IDs are referenced by `@REQ-*` tags in `features/`. The `coverage-reviewer` agent maps the two.
Status reflects the current suite. Some requirements are intentionally left uncovered as backlog for `/qa-generate`.

## API

### REQ-API-01 Authentication
- AC1 Valid credentials return 200 with a bearer JWT (`access_token`, `token_type`, `expires_in`).
- AC2 The issued token grants access to `GET /users/me`, which returns the logged-in user's profile.
- AC3 A wrong password, an unknown user or an empty body returns 401 with an error body and no token.
- AC4 Protected endpoints reject missing or forged tokens with 401.

### REQ-API-02 Brand creation and retrieval
- AC1 `POST /brands` with a name and a unique slug returns 201 and echoes the entity with an id.
- AC2 `GET /brands/{id}` returns 200 and the same entity, as JSON with cache and CORS headers.
- AC3 A duplicate slug returns 409, and missing required fields return 422 with field messages.

### REQ-API-03 Brand update and delete lifecycle
- AC1 `PUT /brands/{id}` by an admin returns 200 `{success:true}`, and the change is visible on GET.
- AC2 `DELETE /brands/{id}` by an admin returns 204. Later GET, PUT and DELETE return 404 "Requested item not found".
- AC3 Delete without a token returns 401, and as a customer returns 403. The brand is still present afterwards.

### REQ-API-04 Product search *(not covered yet)*
- AC1 `GET /products/search?q=<term>` returns only products whose name matches the term.
- AC2 An empty result returns 200 with an empty `data` array.

## UI

### REQ-UI-01 Purchase flow
- AC1 A signed-in customer can search, open a product, choose a quantity and add it to the cart. The cart badge updates.
- AC2 The cart shows the right line items and a total of unit price × quantity.
- AC3 Checkout prefills the billing address from the customer's profile.
- AC4 Paying (Cash on Delivery) shows "Payment was successful", and confirming shows an invoice number.

### REQ-UI-02 Form validation
- AC1 Submitting an empty registration form shows a required-field message on every field and marks the fields invalid.
- AC2 An invalid email format, a short password or a non-numeric phone show field-specific messages.
- AC3 Login with a wrong password shows "Invalid email or password" and stays on the login page.

### REQ-UI-03 Catalog consistency with the backend
- AC1 Category filter + sort shows exactly the API's products, in the same order and at the same prices.
- AC2 Pagination shows the same items as the API page with the same sort.
- AC3 Price sort is monotonic.

### REQ-UI-04 Favorites *(not covered yet)*
- AC1 A signed-in customer can add a product to favorites from the product page.
- AC2 The favorite appears under My account → Favorites and can be removed.

### REQ-UI-05 Contact form *(not covered yet)*
- AC1 Submitting the contact form with valid data shows a success confirmation.
- AC2 The message field enforces a minimum length.
