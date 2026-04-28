# Faceme Architecture

## Overview

Faceme is a monorepo that contains:

- a mobile client in `mobile/`
- an API and realtime backend in `server/`

The system is designed as a client-server social platform where one user identity is shared across content, relationships, messaging, notifications, moderation, and commerce features.

## High-level architecture

```txt
Mobile App (Expo / React Native)
  -> REST API (Express)
  -> Realtime events (Socket.IO)
  -> Auth session storage

Express API
  -> Controllers
  -> Services
  -> Prisma ORM
  -> PostgreSQL

Socket.IO
  -> Chat rooms
  -> Message delivery events
  -> Typing and seen state
```

## Monorepo layout

```txt
mobile/
server/
scripts/
tools/
```

## Mobile architecture

The mobile app is built with Expo Router, React Native, TypeScript, React Query, and Zustand.

### Main responsibilities

- screen routing
- auth boot and session hydration
- API integration
- server-state caching
- realtime chat bridge
- UI components and reusable presentation logic

### Important mobile layers

- `mobile/app/`: route screens
- `mobile/components/`: shared UI and feature components
- `mobile/services/`: API and runtime integration
- `mobile/store/`: Zustand state stores
- `mobile/types/`: shared client-side types
- `mobile/utils/`: helpers, storage, logging, and error normalization

### Key entry points

- `mobile/app/_layout.tsx`: app shell, QueryClient, error boundaries, auth hydration, realtime bridge
- `mobile/app/(tabs)/index.tsx`: feed screen
- `mobile/services/api.ts`: Axios client, auth header injection, refresh retry flow
- `mobile/services/runtime-config.ts`: runtime API and socket URL resolution
- `mobile/store/auth-store.ts`: auth session state
- `mobile/store/chat-store.ts`: chat-related client state

### Current surfaced mobile screens

The app currently includes routes for:

- auth
- onboarding
- feed
- chats
- create
- notifications
- profile
- explore
- friends
- pages
- groups
- marketplace
- moderation
- reels
- status
- saved posts
- settings

## Backend architecture

The backend is an Express application written in TypeScript. It exposes REST endpoints under `/api` and runs a Socket.IO server on the same HTTP server.

### Backend layers

- `server/src/routes/`: route registration and endpoint grouping
- `server/src/controllers/`: HTTP request/response handling
- `server/src/services/`: business logic and permission checks
- `server/src/middleware/`: auth, rate limit, request logging, upload, error handling
- `server/src/lib/`: Prisma client, environment loading, logger, realtime server registry
- `server/src/utils/`: API error helpers, validation helpers, JWT logic
- `server/src/sockets/`: realtime socket handlers

### Runtime flow

1. Request enters Express app.
2. Middleware applies CORS, helmet, request IDs, logging, body parsing, cookies, and rate limiting.
3. Route dispatches to a controller.
4. Controller calls a service.
5. Service reads or writes through Prisma.
6. Service may emit notifications or realtime events.
7. Error middleware normalizes failures into API responses.

### API modules currently mounted

These route groups are active today:

- `/auth`
- `/users`
- `/posts`
- `/chat`
- `/notifications`
- `/media`
- `/marketplace`
- `/monetization`
- `/stories`
- `/moderation`
- `/social`
- `/status`
- `/reels`

Health check:

- `GET /api/health`

## Authentication architecture

Authentication is JWT-based.

### Components

- login, register, refresh, logout endpoints
- access token and refresh token flow
- refresh token persistence in the database
- auth middleware for protected routes

### Behavior

- access tokens authorize API requests
- refresh tokens are stored server-side and can be revoked
- the mobile client retries expired requests through the refresh flow
- protected routes read user identity from bearer tokens

## Realtime architecture

Realtime behavior is currently centered on chat.

### Current capabilities

- joining conversation rooms
- sending messages
- typing indicators
- seen updates

### Relevant files

- `server/src/index.ts`
- `server/src/sockets/chat.socket.ts`
- `server/src/lib/realtime.ts`
- `mobile/components/realtime-bridge.tsx`

The persistence layer remains REST and database-backed, while Socket.IO handles live interaction.

## Domain architecture

The product is organized around a few major domains.

### Identity and relationships

- users
- profiles
- follow graph
- friend requests
- friendships
- blocks

### Content

- posts
- post likes
- post comments
- comment reactions
- saved posts
- shared posts

### Ephemeral and media-driven content

- stories
- status updates
- reels

### Messaging

- conversations
- participants
- messages
- message delivery state

### Social structures

- pages
- groups
- communities
- invites
- onboarding and discovery data

### Trust and safety

- reports
- moderation logs
- role-based moderation actions

### Commerce and monetization

- wallets
- wallet transactions
- payment intents
- premium plans and subscriptions
- marketplace listings

## Data architecture

The database uses PostgreSQL through Prisma.

### Important characteristics

- the schema is broader than the currently visible screens
- some models are fully active in API and mobile flows
- some models are present for expansion and future surface area

### Core active model groups

- `User`, `Profile`, `RefreshToken`
- `FriendRequest`, `Friendship`, `Follow`, `Block`
- `Conversation`, `ConversationParticipant`, `Message`, `MessageStatus`
- `Post`, `PostLike`, `PostComment`, `CommentReaction`, `SavedPost`
- `Story`, `StoryView`
- `Status`, `StatusView`, `StatusReaction`
- `Reel`, `ReelLike`, `ReelComment`
- `Notification`
- `Page`, `PageFollower`
- `Group`, `GroupMember`
- `Report`, `ModerationLog`
- `Wallet`, `WalletTransaction`, `PaymentIntent`
- `PremiumPlan`, `PremiumSubscription`
- `MarketplaceListing`, `MarketplaceListingImage`, `MarketplaceSavedListing`

### Future-ready or partially surfaced model areas

The schema also contains models such as:

- `VoiceRoom`
- `VoiceParticipant`
- `GiftCatalogItem`
- `RoomGiftEvent`
- `CreatorLedgerEntry`
- `AdPlacement`

These indicate planned or partially integrated expansion, but they should not be read as proof that full route and UI support already exists today.

## Feed and social graph behavior

The current architecture supports a blended social product rather than separate apps for separate modes.

### Feed-related inputs

- user-authored posts
- relationship graph
- page and group context
- comments and reactions
- saved and shared content

### Discovery-related inputs

- social graph suggestions
- explore endpoints
- pages
- groups
- invites and onboarding recommendations

## Moderation architecture

Moderation is part of the main backend rather than a separate service.

### Current moderation scope

- report intake
- report listing
- moderation overview and logs
- content actions for posts, comments, reels, statuses, users, groups, pages, and listings
- role checks for privileged actions

## Environment and configuration

### Server

Environment parsing and validation happen in `server/src/lib/env.ts`.

Important configuration includes:

- app environment
- port
- client origins
- database URL
- JWT secrets and expirations
- Cloudinary settings
- media upload size limits

### Mobile

Mobile runtime configuration is resolved in `mobile/services/runtime-config.ts`.

Important values include:

- `EXPO_PUBLIC_APP_ENV`
- `EXPO_PUBLIC_API_URL`
- `EXPO_PUBLIC_SOCKET_URL`

## Local development architecture

### Local services

- PostgreSQL runs through `docker-compose.yml`
- Prisma migrations live in `server/prisma/migrations/`
- seed data lives in `server/prisma/seed.ts`

### Main workflows

- `npm run db:up`
- `npm run db:setup`
- `npm run dev`
- `npm run test:integration`

## Deployment architecture

### Backend deployment

- Docker build: `Dockerfile`
- Render config: `render.yaml`
- Railway config: `railway.json`

### Operational notes

- backend health check is `/api/health`
- mobile runtime configuration is environment-driven
- the API and realtime server share the same backend runtime

## Design principles visible in the repo

- monorepo ownership across client and server
- thin controllers and service-oriented business logic
- explicit domain modules instead of one large generic API
- Prisma-managed relational data model
- JWT auth with revocable refresh tokens
- REST for persistence and Socket.IO for live chat behavior

## Scope clarification

This document describes the architecture reflected by the current repository state.

It intentionally separates:

- what is active in current routes and screens
- what exists in the schema for future expansion

That distinction matters because the codebase includes forward-looking models that do not always map to complete user-facing flows yet.
