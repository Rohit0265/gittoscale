# GitToScale — Complete Authentication, PostgreSQL Persistence, History, and Navigation Fix

Implement the complete, production-ready authentication and user-data flow in my existing GitToScale application.

**Do not just explain the implementation or generate a plan. Inspect the existing codebase and implement the actual changes.** Preserve all existing features, styling, architecture generation, repository scanning, and diagram editing functionality.

## 1. Inspect the Existing Project First

Before changing anything:

- Identify the frontend framework, router, backend framework, and existing UI component library.
- Find the playground, landing page, prompt submission handler, GitHub repository import handler, and architecture-generation pipeline.
- Identify the current deployment structure and environment-variable conventions.
- Check whether Supabase or PostgreSQL integration already exists.
- Reuse existing components and services. Avoid duplicate authentication logic and unnecessary rewrites.

## 2. Complete Authentication With Supabase

Use Supabase Auth for identity and authentication and Supabase-managed PostgreSQL for application data.

Implement these pages:

- `/signup` — name, email, password, and password confirmation.
- `/signin` — email, password, and forgot-password link.
- `/forgot-password` — password reset flow.
- `/auth/callback` — handle the appropriate Supabase authentication callback, including email verification where configured.

Include form validation, loading states, useful errors, successful-login feedback, session persistence, logout, and password recovery.

Use the existing GitToScale design system for a professional, responsive interface.

## 3. Protect the Application

The application is hosted at `app.gittoscale.tech`.

When an unauthenticated user visits a protected application route:

1. Preserve their intended destination.
2. Redirect them to `/signup`.
3. Allow them to switch to `/signin`.
4. After authentication and any required email verification, return them to the intended destination.

Protect direct navigation, refreshes, internal routes, and backend API endpoints.

Keep public marketing pages accessible. Avoid redirect loops and ensure that expired sessions are handled correctly.

Validate sessions on the server for protected operations. Do not rely only on client-side route guards.

## 4. Resume Prompt Generation After Signup

Implement this exact workflow:

1. The visitor opens the playground.
2. They enter their architecture-generation prompt.
3. They press Enter or click Generate.
4. If unauthenticated, preserve the prompt and its configuration.
5. Redirect to the sign-up page.
6. After successful authentication, automatically resume the original request.
7. Generate and display the architecture using the existing pipeline.
8. Persist the prompt and generated result in PostgreSQL.
9. Let the user reopen the saved architecture later.

The user must not have to re-enter the prompt or press Generate a second time.

Preserve the original input, settings, intended destination, and any other data required to continue the workflow.

## 5. Resume GitHub Repository Import After Signup

Implement the same behavior for repository import.

1. The visitor enters a GitHub repository URL.
2. They press Enter or click Import.
3. If unauthenticated, preserve the repository URL and import settings.
4. Redirect to sign-up.
5. After authentication, automatically resume the import.
6. Run the existing repository-scanning and architecture-generation pipeline.
7. Save the repository metadata, scan results, and generated architecture.
8. Display the result in the existing application interface.

Support public repositories and appropriately authorized private repositories. Never bypass GitHub access controls.

Preserve pending actions across refreshes and authentication callbacks. Validate restored data, prevent duplicate execution, and provide retry handling for failures.

Use an appropriate temporary pending-action mechanism for unauthenticated users, and persist accepted long-running operations on the server so closing the browser does not destroy their progress.

## 6. PostgreSQL Database Schema

Use Supabase's managed PostgreSQL database. Create version-controlled SQL migrations for the following tables.

### `profiles`

- `id`: UUID primary key referencing `auth.users.id`
- `full_name`: text
- `email`: text
- `avatar_url`: nullable text
- `created_at`: timestamp
- `updated_at`: timestamp

Initialize profiles securely when users register. Handle duplicate events and retries safely. Keep profile email consistent with Supabase Auth.

### `architecture_history`

- `id`: UUID primary key
- `user_id`: UUID referencing `auth.users.id`
- `title`: text
- `prompt`: text
- `generation_config`: JSONB
- `architecture_data`: JSONB
- `status`: pending, processing, completed, or failed
- `error_message`: nullable text
- `created_at`: timestamp
- `updated_at`: timestamp

### `repository_history`

- `id`: UUID primary key
- `user_id`: UUID referencing `auth.users.id`
- `repository_url`: text
- `repository_owner`: nullable text
- `repository_name`: nullable text
- `repository_metadata`: JSONB
- `scan_result`: JSONB
- `architecture_data`: JSONB
- `status`: pending, processing, completed, or failed
- `error_message`: nullable text
- `created_at`: timestamp
- `updated_at`: timestamp

Add appropriate foreign keys, indexes, constraints, and deletion behavior.

Persist both successful and failed operations. Save completed results so opening history never requires regenerating an architecture unnecessarily.

## 7. Implement a Complete History Dashboard

Create a protected `/history` page that matches the existing GitToScale UI.

Include:

- Prompt-generated architecture history.
- GitHub repository import and scan history.
- Search, filtering, sorting, and pagination.
- Creation dates and operation statuses.
- Loading, empty, error, and retry states.

When the user clicks a prompt-history entry, reopen the original prompt and its saved architecture in the existing viewer or editor.

When the user clicks a GitHub-history entry, display the repository information, scan results, and saved architecture.

Allow users to continue editing an existing architecture where supported by the current application.

History must persist across browser sessions and devices for the same authenticated user.

## 8. Secure All User Data

Enable Row-Level Security on all user-owned tables.

Ensure users can access only their own profiles and history. Use `auth.uid()` and validated server-side sessions for ownership checks.

Prevent users from changing a request's `user_id` to access another person's data.

Never expose Supabase service-role keys, database passwords, GitHub tokens, or AI provider secrets in browser code.

Do not store user passwords in PostgreSQL application tables. Supabase Auth manages authentication credentials.

Validate all user input on the server.

## 9. Fix the Playground Logo and URL Navigation Bug

**Current bug:** When a user is in the playground and clicks the GitToScale logo, the interface navigates to the front page, but the browser URL remains unchanged.

Investigate the actual cause and fix it properly.

Requirements:

- Clicking the GitToScale logo from the playground must navigate to the correct landing-page route.
- The browser URL must update to match the displayed page.
- Use the existing router's navigation or link component instead of changing only the visible UI.
- Ensure the browser Back and Forward buttons work correctly.
- Support direct URL loading and page refresh.
- Avoid stale playground state or route mismatches.
- Ensure the logo behaves consistently across the landing page, playground, history, and authentication pages.
- If the application uses separate frontend origins for the marketing site and playground, navigate to the correct origin rather than changing only the rendered component.
- Do not break authentication redirects or the pending prompt/repository workflow while fixing navigation.

Verify the behavior by opening the playground, clicking the logo, checking the resulting URL, and refreshing the landing page.

## 10. Configure Environment Variables

My final setup work should be limited to supplying real credentials and configuring deployment.

Create `.env.example` with the exact variables required by the implementation.

Use environment variables for:

- Supabase project URL.
- Supabase publishable/anonymous key.
- Supabase secret/service-role key only if required by trusted server-side operations.
- PostgreSQL connection string only if direct PostgreSQL connections are necessary.
- Existing AI provider API keys.
- GitHub OAuth or API credentials only if required by the existing import workflow.

Use the current project's framework conventions and avoid duplicate configuration variables.

**Important:** Supabase already includes managed PostgreSQL. Do not create a separate database unnecessarily. Prefer the Supabase client and RLS for normal application data operations.

Never commit actual credentials to Git. Add sensitive environment files to `.gitignore`. Validate required configuration at startup and provide clear setup errors.

## 11. Migrations and Setup Documentation

Create SQL migrations for all tables, indexes, constraints, RLS policies, and profile initialization logic.

Document the exact steps to:

1. Create a Supabase project.
2. Configure email/password authentication and email verification.
3. Apply the SQL migrations.
4. Configure local and production authentication redirect URLs.
5. Set environment variables.
6. Run the application locally.
7. Configure deployment at `app.gittoscale.tech`.
8. Configure any required GitHub integration.
9. Test authentication and resumed workflows.

Do not assume the database or authentication provider has already been configured.

## 12. End-to-End Acceptance Criteria

Before considering the task complete, verify all of the following:

- [ ] Unauthenticated visitors to protected app routes are redirected to sign-up.
- [ ] Existing users can sign in.
- [ ] Signup and login sessions persist correctly.
- [ ] A prompt submitted with Enter is preserved and automatically processed after signup.
- [ ] A repository URL submitted with Enter is preserved and automatically imported after signup.
- [ ] The same workflows work when their buttons are clicked.
- [ ] Pending actions survive authentication redirects and page refreshes.
- [ ] Repeated callbacks do not trigger duplicate operations.
- [ ] User profiles are stored in PostgreSQL.
- [ ] Prompt and architecture history are persisted.
- [ ] GitHub repository history and scan results are persisted.
- [ ] Clicking history entries opens their saved results.
- [ ] RLS prevents cross-user data access.
- [ ] Password reset, logout, and session expiry work correctly.
- [ ] Clicking the GitToScale logo navigates to the correct landing page and updates the browser URL.
- [ ] Browser Back, Forward, and refresh work correctly.
- [ ] Existing playground and architecture-generation features remain functional.
- [ ] No credentials are exposed in frontend bundles or committed files.

## 13. Final Deliverables

Implement the complete solution in the existing repository.

When finished, provide:

1. A concise summary of the implementation.
2. Every file created or modified.
3. The SQL migrations and exact commands to apply them.
4. The `.env.example` file.
5. The required Supabase dashboard configuration.
6. The exact environment variables I must supply.
7. The manual end-to-end verification steps.
8. Any remaining external configuration that cannot be completed without my credentials.

Do not stop after creating the UI. Wire up the real authentication, PostgreSQL persistence, route protection, history loading, automatic workflow resumption, and navigation fix.

If a credential is unavailable, implement the integration around it and clearly identify the missing configuration rather than inventing credentials or claiming the feature has been tested.

**Definition of done:** GitToScale operates as a cohesive authenticated SaaS application. Users can sign up once, generate architectures from prompts, import GitHub repositories, automatically resume interrupted pre-authentication actions, revisit saved work, and navigate correctly throughout the application.