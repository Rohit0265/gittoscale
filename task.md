# Feature Integration: Social Feed

## Objective
Integrate a fully functional social feed feature into the existing project. The entire feed feature must be developed in a separate, modular `feed` folder and then integrated into the existing application without affecting other features.

**Important:** The feed UI must follow the existing project's theme, design system, colors, typography, spacing, components, and overall visual style. Do not introduce a completely new theme.

## 1. Modular Folder Structure

Create a dedicated `feed` folder to encapsulate the entire feature.

The folder should contain all feed-related components, pages, hooks, API services, utilities, types, and styles.

Suggested structure:

```text
src/
├── feed/
│   ├── components/
│   │   ├── FeedHeader.tsx
│   │   ├── FeedSidebar.tsx
│   │   ├── CreatePost.tsx
│   │   ├── PostCard.tsx
│   │   ├── PostActions.tsx
│   │   ├── CommentPanel.tsx
│   │   ├── SharePost.tsx
│   │   └── PostMenu.tsx
│   ├── pages/
│   │   ├── FeedPage.tsx
│   │   └── ProfilePage.tsx
│   ├── hooks/
│   ├── services/
│   ├── types/
│   ├── utils/
│   ├── styles/
│   └── index.ts
```

Adjust the structure according to the existing project's architecture and framework.

Keep the feature self-contained and reusable.

## 2. Routing

Implement the following routes:

- `/feed` — Main social feed displaying posts from other users.
- `/feed/profile/:id` — Individual user profile and their posts.

Whenever a user shares their profile, the shareable URL must follow this format:

`/feed/profile/:id`

The profile ID must be dynamically generated from the actual authenticated user's ID.

Ensure that routes work correctly with the existing routing system.

## 3. Header

The existing application header must remain in its current position.

Requirements:
- Keep the header sticky or fixed according to the existing implementation.
- Remove the existing header navigation options specifically when the user visits `/feed`.
- Maintain the existing logo and branding.
- Keep the header visually consistent with the rest of the application.
- Do not modify the global header in a way that affects other pages.

## 4. Feed Layout

Create a responsive three-part social feed layout.

### Left Sidebar — User Profile

Display the currently logged-in user's profile information:

1. User avatar.
2. Full name.
3. Username.
4. Followers count.
5. Following count.
6. "Your Posts" option.

The "Your Posts" option should navigate to the authenticated user's profile page.

Use actual user information from the existing authentication and database systems.

### Center Section — Main Feed

The center section should contain:

- Create Post component at the top.
- Feed posts below the post creation component.
- A scrollable post list.
- Loading states, empty states, and error states.

The center section should be the primary focus of the page.

### Right Section — Comments

The right side should display the comments panel when a user clicks the comment button on a post.

Requirements:
- Open comments for the selected post.
- Display existing comments.
- Allow authenticated users to add comments.
- Show the commenter avatar, username, comment text, and timestamp.
- Allow the comments panel to close.
- Ensure comments are associated with the correct post.

On mobile and smaller screens, adapt the comments panel into a drawer, modal, or responsive layout.

## 5. Create Post Feature

At the top of the feed, provide a post creation input.

Users should be able to:

- Write text content.
- Upload images.
- Upload videos.
- Preview media before publishing.
- Remove uploaded media before publishing.
- Publish a post.
- Cancel post creation.

### Video Upload Restrictions

- Maximum video file size: 1 MB.
- Reject files exceeding the size limit on the frontend.
- Enforce the same restriction on the backend.
- Validate actual MIME type and file content.
- Do not trust the file extension alone.
- Display clear validation errors.

Images and videos should be displayed properly after the post is published.

## 6. Feed Post Card

Each post card should follow this layout:

### Post Header

Display:
- User avatar.
- Username.
- Three-dot menu on the opposite side.

The three-dot menu should provide appropriate actions based on ownership:

For the post owner:
- Edit Post.
- Delete Post.

For other users:
- Report Post (if reporting is supported).
- Hide Post (if supported).

Never expose edit or delete actions to unauthorized users.

### Post Body

Display:
- Post description or text content.
- Uploaded image or video.
- Media should maintain its aspect ratio.
- Videos should have standard playback controls.

### Post Footer

Display:
- Like button.
- Comment button.
- Share button.

### Like Feature

- Allow users to like and unlike posts.
- Display the current like count.
- Prevent duplicate likes from the same user.
- Update the UI optimistically where appropriate.
- Synchronize the UI with the backend response.

### Comment Feature

- Open the right-side comments panel when clicked.
- Display the selected post's comments.
- Allow users to submit comments.
- Update the comment count correctly.

### Share Feature

- Allow users to share posts.
- Generate a shareable post URL.
- Use the native share API where supported.
- Provide a copy-link fallback.
- Ensure shared URLs resolve correctly.

## 7. User Profile Page

Route:

`/feed/profile/:id`

Display:

- User avatar.
- Full name.
- Username.
- Bio, if available.
- Followers count.
- Following count.
- User's posts.
- Follow/Unfollow button, if the existing project supports or requires following functionality.

The page must display the profile belonging to the ID in the route.

Users should be able to view other users' profiles without gaining permission to edit their information or posts.

The authenticated user's own profile should provide the appropriate profile management options.

## 8. Security Requirements — Critical

Implement strict backend authorization and validation.

**Frontend-only access restrictions are not sufficient.**

### Post Ownership

- Only the original post owner can edit or delete their post.
- Verify post ownership on every edit and delete request.
- Derive the authenticated user ID from the validated session or token.
- Never trust user IDs sent by the client.
- Prevent IDOR (Insecure Direct Object Reference) vulnerabilities.
- Prevent unauthorized modification of other users' posts.
- Prevent users from changing post ownership.
- Prevent users from editing or deleting posts by manipulating API requests.

### Authentication and Authorization

- Use the existing authentication system.
- Protect all write operations.
- Validate access tokens or sessions on the backend.
- Verify that the authenticated user has permission for each operation.
- Apply authorization checks to likes, comments, post creation, editing, deletion, and media uploads.
- Ensure public profile and feed reads follow the project's existing privacy rules.

### Input Validation

- Validate all post content.
- Validate comments.
- Validate media uploads.
- Sanitize user-generated content where necessary.
- Prevent XSS attacks.
- Prevent malicious file uploads.
- Enforce upload size limits server-side.
- Apply rate limiting to post creation, comments, likes, and uploads where appropriate.

### Database Security

- Ensure proper ownership relationships.
- Prevent duplicate likes.
- Use appropriate database constraints.
- Handle concurrent operations safely.
- Avoid exposing sensitive user information in API responses.

## 9. Backend and Database Integration

Before implementation, inspect the existing project to understand:

- Authentication system.
- User schema.
- Database structure.
- Existing API conventions.
- Media storage system.
- Existing UI components and design system.
- Current routing architecture.

Reuse existing infrastructure whenever possible.

Implement or extend the necessary models, schemas, APIs, and database relationships for:

- Posts.
- Post media.
- Likes.
- Comments.
- User relationships, if following functionality exists.

Do not introduce a new database or authentication system unnecessarily.

Ensure that all feed data is persistent and fetched from the backend.

Do not use hardcoded dummy data in the production feed.

## 10. Error Handling

Handle all potential errors properly, including:

- Failed post creation.
- Failed post deletion.
- Failed post editing.
- Failed media upload.
- Invalid media formats.
- Video size exceeding 1 MB.
- Failed comment submission.
- Failed like/unlike requests.
- Authentication expiration.
- Unauthorized access.
- Missing user profiles.
- Invalid post IDs.
- Database errors.
- Network failures.

Provide meaningful error messages and appropriate loading indicators.

Avoid silent failures.

## 11. UI/UX Requirements

- Match the existing application's theme exactly.
- Use existing UI components wherever possible.
- Maintain consistent typography, colors, border radius, shadows, and spacing.
- Design a clean, modern social feed.
- Ensure responsive behavior across desktop, tablet, and mobile.
- Avoid unnecessary animations.
- Add hover states and interaction feedback.
- Provide skeleton loaders.
- Provide empty feed states.
- Provide confirmation dialogs for destructive actions.
- Ensure accessibility for interactive components.
- Maintain a polished and production-ready experience.

## 12. Integration Requirements

- Implement the entire feature inside the dedicated `feed` folder.
- Integrate it through the existing router and application entry points.
- Do not unnecessarily modify existing project files.
- Do not break existing authentication, navigation, dashboard, or other features.
- Keep imports and exports clean.
- Avoid duplicated logic.
- Ensure the feed feature can be maintained independently.

## 13. Final Verification

After implementation:

1. Verify that `/feed` works correctly.
2. Verify that `/feed/profile/:id` works correctly.
3. Test post creation with text, images, and videos.
4. Verify the 1 MB video restriction on both frontend and backend.
5. Test likes and unlikes.
6. Test comments and the right-side comments panel.
7. Test profile sharing.
8. Test post sharing.
9. Verify that users cannot edit or delete other users' posts.
10. Test API authorization by manually sending unauthorized requests.
11. Check for XSS and IDOR vulnerabilities.
12. Test responsive layouts.
13. Fix all TypeScript errors, build errors, runtime errors, and integration issues.
14. Ensure that existing application functionality remains unaffected.

Do not stop after creating the UI. Implement the complete feature, including backend integration, persistence, security, routing, and functionality.

## Final Goal

Deliver a fully functional, secure, modular, and responsive social feed integrated into the existing project.

The feed should feel like a native part of the existing application rather than a separately designed product.
