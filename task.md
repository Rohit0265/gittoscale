# GitToScale - Collaborative Meeting Workspace Implementation

I want to implement a complete real-time collaboration and meeting feature in my existing GitToScale application.

I have provided a hand-drawn UI reference. Follow that layout closely while adapting it to the existing GitToScale design system.

IMPORTANT: First inspect the existing codebase, React Flow architecture editor, AI chat implementation, authentication, backend APIs, database schema and existing UI components. Reuse existing functionality instead of creating duplicate systems.

Do not rebuild the application or break existing features.

# 1. Core Objective

Implement a collaborative meeting system where:

- A user can create and host a meeting.
- Other authenticated users can join using a meeting invitation link or meeting ID.
- All participants work on the same architecture diagram.
- Architecture changes are synchronized in real time.
- Participants can communicate using meeting chat.
- Participants can see who is currently in the meeting.
- The host can control participant editing permissions.
- The existing AI assistant remains accessible inside the meeting workspace.

The experience should feel like a collaborative system design environment similar to Figma, specifically designed for system architecture discussions.

# 2. UI Layout - Follow My Reference Image

The main focus is the left sidebar.

Create a single collapsible side panel with a tab navigation at its top.

The navigation should contain three tabs:

1. AI
2. Chats
3. Participants

Add a separate Tools button next to these three tabs.

The panel should occupy the left side of the React Flow architecture editor.

## Tab Navigation

Create a segmented tab navigation with:

- AI
- Chats
- Participants

Only one tab should be active at a time.

When a user clicks a tab, replace the content below with the selected tab's content.

Do not open three separate panels.

Keep the navigation fixed at the top while the panel content changes.

The Tools button should be visually separated from the three tabs, as shown in the reference image.

## AI Tab

Integrate the existing GitToScale AI architecture assistant.

Requirements:

- Reuse the existing AI chat functionality.
- Preserve existing AI prompts and architecture assistance.
- Allow users to ask questions about the current architecture.
- Allow users to request architecture improvements.
- Show AI responses in a chat-style interface.
- Display loading and error states.
- Preserve existing AI usage restrictions and subscription limits.

AI-generated architecture modifications must be synchronized with other participants when applied to the shared diagram.

Do not automatically modify the shared architecture just because the AI generates a suggestion. Require the appropriate user action to apply changes.

## Chats Tab

Implement a real-time meeting chat.

Requirements:

- Participants can send messages.
- All connected participants receive messages instantly.
- Display sender name and avatar.
- Display message timestamps.
- Show messages in chronological order.
- Automatically scroll to the latest message.
- Support Enter to send and Shift + Enter for a new line.
- Display appropriate empty and loading states.
- Show a clear message when the user is disconnected.

Display messages in a clean conversation interface.

The chat should remain available while participants edit the architecture.

Store meeting messages persistently in the database so participants can access previous messages after reconnecting.

Only authenticated meeting participants should be able to read and send messages.

## Participants Tab

Display everyone currently participating in the meeting.

For every participant show:

- Avatar.
- Full name.
- Online/offline status.
- Participant role.

Implement three roles:

**Host**
- Can manage the meeting.
- Can manage participant permissions.
- Can remove participants.
- Can end the meeting.
- Has full editing permissions.

**Editor**
- Can modify the architecture.
- Can add, delete and move nodes.
- Can create and delete edges.
- Can modify node properties.

**Viewer**
- Can view the architecture.
- Can see live changes.
- Cannot modify nodes or edges.

The host should be able to change participant roles directly from the Participants tab.

Role changes should take effect immediately.

Only the host can manage other participants.

# 3. Tools Button

Implement a separate Tools button beside the three tabs.

When clicked, display the existing architecture editor tools or a dedicated tools panel.

First inspect which tools already exist in GitToScale.

Reuse existing tools instead of duplicating them.

Keep this button visually independent from the AI, Chats and Participants tabs.

# 4. Meeting Creation and Joining

Add a meeting creation workflow.

The user should be able to:

- Start a new meeting.
- Enter a meeting title.
- Generate a unique meeting ID.
- Share an invitation link.
- Copy the meeting link.
- Join an existing meeting using an invitation link or meeting ID.
- Leave an ongoing meeting.

Suggested routes:

- /meeting/:meetingId
- /meeting/join

When the host creates a meeting:

1. Create the meeting record in Supabase.
2. Associate it with the current architecture/project.
3. Initialize the shared architecture state.
4. Register the host as the meeting owner.
5. Initialize the real-time collaboration room.
6. Generate an invitation link.

When another user joins:

1. Verify authentication.
2. Verify meeting status.
3. Verify access permissions.
4. Register the participant.
5. Load the latest architecture state.
6. Connect to the collaboration room.
7. Display the meeting workspace.

# 5. Real-Time Architecture Collaboration

Use the existing React Flow editor.

Implement Yjs-based real-time synchronization.

Recommended technologies:

- Yjs
- y-websocket or an authenticated custom WebSocket provider
- Existing React Flow implementation
- Existing Node.js backend
- Supabase PostgreSQL

Synchronize:

- Node creation.
- Node deletion.
- Node positions.
- Node data changes.
- Edge creation.
- Edge deletion.
- Architecture property changes.

All participants should see changes without refreshing.

Handle simultaneous edits and network disconnections.

Use Yjs Awareness for participant presence and live cursors.

Keep local viewport, selection and temporary UI state separate from the shared document.

Avoid unnecessary full-document synchronization.

# 6. Meeting Permissions and Security

Permission enforcement must happen on the backend.

Do not rely only on disabling React Flow interactions in the frontend.

Validate authenticated users, meeting membership and roles before accepting diagram updates.

Viewers must not be able to bypass permissions by sending direct WebSocket updates.

Only the host can:

- Change participant roles.
- Remove participants.
- Lock or unlock the architecture.
- End the meeting.

When the host locks the architecture, other participants should become viewers until it is unlocked.

# 7. Meeting Database

Inspect the existing Supabase schema before creating new tables.

Reuse the existing tables:

- public.meetings
- public.meeting_participants

Add a meeting messages table if one does not already exist.

Suggested structure:

meeting_messages:
- id: UUID primary key
- meeting_id: UUID foreign key
- user_id: UUID foreign key
- content: TEXT
- created_at: TIMESTAMPTZ

Add appropriate indexes, constraints and RLS policies.

Use consistent UUID user IDs referencing the existing profiles/authentication system.

Persist architecture snapshots reliably.

Do not use Supabase Realtime as a replacement for Yjs document synchronization.

# 8. UI and UX Requirements

Follow the supplied hand-drawn reference.

Important visual requirements:

- Three tabs at the top of the left panel.
- Separate Tools button.
- One shared content area below the tabs.
- Switching tabs should replace content without changing the main canvas.
- Smooth but subtle tab transitions.
- Consistent panel dimensions.
- Clean message bubbles.
- Participant avatars and role indicators.
- Responsive layout.
- Proper empty states and loading indicators.

Maintain GitToScale's existing branding and visual language.

Avoid:
- Excessive gradients.
- Unnecessary animations.
- Multiple overlapping sidebars.
- Unnecessary modals.
- Duplicated AI functionality.
- Cluttered navigation.

The architecture canvas should remain the main focus of the application.

# 9. Meeting Lifecycle

Handle the following cases:

- Host creates a meeting.
- Participants join.
- Participants leave.
- Participants reconnect.
- Host changes roles.
- Host removes participants.
- Host locks the canvas.
- Host unlocks the canvas.
- Host ends the meeting.
- A user attempts to join an ended meeting.
- A participant loses internet connectivity.

Clean up WebSocket connections and presence records appropriately.

Persist important data so the architecture and chat history are not lost when users disconnect.

# 10. Development Instructions

Implement this feature in the following order:

Phase 1: Inspect the existing architecture and UI.

Phase 2: Implement meeting creation and joining.

Phase 3: Build the sidebar with AI, Chats and Participants tabs.

Phase 4: Integrate the existing AI assistant.

Phase 5: Implement persistent real-time meeting chat.

Phase 6: Implement participant presence and role management.

Phase 7: Integrate Yjs with React Flow for live architecture synchronization.

Phase 8: Implement backend permission enforcement.

Phase 9: Implement meeting lifecycle and persistence.

Phase 10: Test using multiple authenticated browser sessions.

Do not implement everything using mock data.

Do not hardcode users, roles or meeting IDs.

Do not expose service-role credentials in the frontend.

Do not break the existing AI assistant, architecture editor, repository import, architecture history or payment restrictions.

# Expected Final Result

A user opens GitToScale and starts a collaborative architecture meeting.

Other developers join through an invitation link.

The React Flow architecture is synchronized across all participants.

On the left side, there is one sidebar with three tabs:

- AI: Existing AI architecture assistant.
- Chats: Real-time meeting conversation.
- Participants: Online users and host permission management.

A separate Tools button provides access to architecture editing tools.

The user can switch between these tabs while the architecture canvas remains visible and synchronized.

The final result should feel like a polished, production-ready collaborative system design workspace.