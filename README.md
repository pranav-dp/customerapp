# Customer App

A cross-platform mobile food ordering application built with React Native and Expo. Designed for campus food delivery, it allows customers to browse restaurant menus, place orders, split bills with friends, schedule orders ahead of time, and track deliveries in real time.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the App](#running-the-app)
- [Available Scripts](#available-scripts)
- [Building for Production](#building-for-production)
- [Linting](#linting)
- [Testing](#testing)
- [Architecture Overview](#architecture-overview)
- [License](#license)

## Features

- **Restaurant Browsing** -- View a list of campus restaurants with real-time open/closed status based on operating hours.
- **Menu Search and Filtering** -- Search menu items across all restaurants and toggle a vegetarian-only filter.
- **Cart and Ordering** -- Add items to a cart, adjust quantities, and place orders with a generated order number.
- **Payment Integration** -- Pay through Razorpay with support for a development simulation mode.
- **Order Tracking** -- Follow order status in real time as it moves through pending, confirmed, preparing, ready, and completed stages.
- **Bill Splitting** -- Assign individual cart items to friends and split the total among participants.
- **Treat Mode** -- Create shared ordering rooms, invite friends, and let everyone add items to a single group order that the host checks out.
- **Reviews and Ratings** -- Rate restaurants and individual menu items on a five-star scale and write detailed reviews.
- **Friends Management** -- Add friends by username, view their order history, and track money owed between friends.
- **Budget Tracking** -- Set spending limits and monitor spending against your budget.
- **Order Scheduling** -- Pre-order meals for a specific pickup time.
- **Push Notifications** -- Receive notifications for order updates and treat room invitations.
- **Dark and Light Themes** -- Automatic theme detection with manual override support.
- **Cross-Platform** -- Runs on iOS, Android, and the web from a single codebase.

## Tech Stack

| Layer              | Technology                                        |
| ------------------ | ------------------------------------------------- |
| Framework          | React Native 0.81 with Expo SDK 54                |
| Language           | TypeScript 5.9                                    |
| Navigation         | Expo Router 6 (file-based routing)                |
| State Management   | React Context API                                 |
| Backend / Database | Firebase Firestore (real-time NoSQL)               |
| Authentication     | Firebase Auth with Async Storage persistence       |
| Payments           | Razorpay (react-native-razorpay)                   |
| Notifications      | Expo Notifications                                 |
| Animations         | React Native Reanimated 4                          |
| Build Service      | EAS (Expo Application Services)                    |
| Linting            | ESLint with eslint-config-expo                     |

## Project Structure

```
customerapp/
|-- app/                        # Screens (Expo Router file-based routing)
|   |-- (tabs)/                 # Tab navigation screens (Home, Orders, Profile)
|   |-- restaurant/[id].tsx     # Restaurant detail and menu
|   |-- order/[orderId].tsx     # Order tracking detail
|   |-- treat-room/             # Treat mode screens (create, view)
|   |-- review/[orderId].tsx    # Submit a review
|   |-- cart.tsx                # Shopping cart
|   |-- checkout.tsx            # Checkout and payment
|   |-- friends.tsx             # Friends management
|   |-- insights.tsx            # Spending analytics
|   |-- money-owed.tsx          # Split payment tracking
|   |-- login.tsx               # Login screen
|   |-- signup.tsx              # Sign up screen
|   +-- _layout.tsx             # Root layout with providers
|
|-- components/                 # Reusable UI components
|   |-- ui/                     # Base components (Button, Input, Header, Card, Skeleton)
|   |-- menu/                   # Menu display (MenuItem, MenuSection, VegToggle)
|   |-- cart/                   # Cart components (CartSummary, SplitSelector)
|   |-- restaurant/             # Restaurant components (RestaurantHeader, RestaurantInfo)
|   |-- treat/                  # Treat mode components (TreatInviteCard, TreatRoomCard, TreatCart)
|   |-- budget/                 # Budget tracking (BudgetTracker)
|   |-- scheduling/             # Order scheduling (ScheduleToggle)
|   |-- ReviewCard.tsx          # Review display
|   +-- StarRating.tsx          # Star rating input
|
|-- contexts/                   # React Context providers
|   |-- AuthContext.tsx          # Authentication and user state
|   |-- CartContext.tsx          # Shopping cart state
|   |-- ThemeContext.tsx         # Dark/light theme state
|   +-- VegFilterContext.tsx     # Vegetarian filter state
|
|-- services/                   # Business logic and Firebase operations
|   |-- firebase.js             # Firebase initialization
|   |-- firestore.js            # Firestore CRUD for customers and restaurants
|   |-- orders.ts               # Order creation and status tracking
|   |-- friends.ts              # Friend management
|   |-- reviews.ts              # Review operations
|   |-- treatMode.ts            # Treat room management
|   |-- razorpay.ts             # Payment gateway integration
|   |-- notifications.ts        # Push notification setup
|   |-- budget.ts               # Budget tracking
|   |-- scheduling.ts           # Order scheduling
|   +-- suggestions.ts          # Recommendations
|
|-- hooks/                      # Custom React hooks
|   |-- useColors.ts            # Theme-aware color access
|   +-- use-color-scheme.ts     # System color scheme detection
|
|-- constants/                  # App constants
|   |-- colors.ts               # Color palettes and spacing
|   |-- theme.ts                # Theme configuration
|   +-- typography.ts           # Text style definitions
|
|-- utils/                      # Utility functions
|   +-- restaurant.ts           # Restaurant status and operating hours helpers
|
|-- assets/                     # Images, icons, and splash screens
|-- scripts/                    # Project utility scripts
|-- tests/                      # Firebase seeding and validation scripts
|-- app.json                    # Expo app configuration
|-- eas.json                    # EAS build configuration
|-- tsconfig.json               # TypeScript configuration
|-- eslint.config.js            # ESLint configuration
+-- package.json                # Dependencies and scripts
```

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- npm (included with Node.js)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) -- installed globally or used via `npx`
- For native builds: [EAS CLI](https://docs.expo.dev/build/setup/) (`npm install -g eas-cli`)
- A physical device with [Expo Go](https://expo.dev/go), or an iOS Simulator / Android Emulator for local development

## Installation

```bash
git clone https://github.com/pranav-dp/customerapp.git
cd customerapp
npm install
```

## Environment Variables

Create a `.env.local` file in the project root with the following variables. These are required for Firebase and Razorpay integration:

```
EXPO_PUBLIC_FIREBASE_API_KEY=<your-firebase-api-key>
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=<your-firebase-auth-domain>
EXPO_PUBLIC_FIREBASE_PROJECT_ID=<your-firebase-project-id>
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=<your-firebase-storage-bucket>
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<your-firebase-messaging-sender-id>
EXPO_PUBLIC_FIREBASE_APP_ID=<your-firebase-app-id>
EXPO_PUBLIC_RAZORPAY_KEY_ID=<your-razorpay-key-id>
```

The `.env.local` file is listed in `.gitignore` and will not be committed to version control.

## Running the App

Start the Expo development server:

```bash
npm start
```

Then choose a target from the terminal output:

- Press `i` to open in the iOS Simulator
- Press `a` to open in the Android Emulator
- Press `w` to open in a web browser
- Scan the QR code with Expo Go on a physical device

You can also start directly for a specific platform:

```bash
npm run ios       # Build and run on iOS
npm run android   # Build and run on Android
npm run web       # Start the web version
```

## Available Scripts

| Command                | Description                                      |
| ---------------------- | ------------------------------------------------ |
| `npm start`            | Start the Expo development server                |
| `npm run ios`          | Build and run on iOS                             |
| `npm run android`      | Build and run on Android                         |
| `npm run web`          | Start the web version                            |
| `npm run lint`         | Run ESLint on the codebase                       |
| `npm run reset-project`| Move current code to `app-example/` and create a blank `app/` directory |

## Building for Production

This project uses [EAS Build](https://docs.expo.dev/build/introduction/) for creating native binaries.

```bash
# Install EAS CLI if not already installed
npm install -g eas-cli

# Development build (with dev client, internal distribution)
eas build --platform ios --profile development
eas build --platform android --profile development

# Preview build (internal testing)
eas build --platform ios --profile preview
eas build --platform android --profile preview

# Production build (App Store / Google Play ready)
eas build --platform ios --profile production
eas build --platform android --profile production
```

Build profiles are defined in `eas.json`:

- **development** -- Includes the development client for debugging; distributed internally.
- **preview** -- Internal distribution for testing before release.
- **production** -- Auto-increments the version number; suitable for store submission.

## Linting

```bash
npm run lint
```

This runs ESLint with the `eslint-config-expo` preset configured in `eslint.config.js`.

## Testing

The `tests/` directory contains Node.js scripts for validating and seeding the Firebase backend:

```bash
node tests/seed-database.js             # Populate sample restaurants and menus
node tests/test-auth-system.js          # Validate authentication flow
node tests/test-orders.js               # Test order creation and retrieval
node tests/test-customer-collection.js  # Verify customer data structure
node tests/test-username-search.js      # Test username prefix search
```

These scripts require the environment variables listed above to connect to your Firebase project.

## Architecture Overview

The application follows a layered architecture:

1. **Screens** (`app/`) -- Expo Router maps each file to a route. Tab-based navigation handles the main sections (Home, Orders, Profile), while stack navigation is used for detail screens such as restaurant menus, order tracking, and checkout.

2. **Components** (`components/`) -- Reusable, presentational components organized by feature domain (menu, cart, restaurant, treat, budget, scheduling) and a shared `ui/` folder for base elements.

3. **Contexts** (`contexts/`) -- React Context providers manage global state for authentication, cart contents, theme preference, and the vegetarian filter toggle. The root layout wraps the app in all necessary providers.

4. **Services** (`services/`) -- A dedicated service layer encapsulates all Firebase Firestore operations, Razorpay payment flows, push notification setup, and business logic. Services expose typed functions consumed by screens and contexts.

5. **Hooks** (`hooks/`) -- Custom hooks abstract theme-aware color lookups and system color scheme detection.

6. **Constants** (`constants/`) -- Centralized definitions for color palettes, spacing values, typography styles, and theme tokens.

Firebase Firestore serves as the primary database, with real-time listeners (`onSnapshot`) powering live order status updates and treat room synchronization. Firebase Auth handles user authentication with session persistence through Async Storage.

## License

This project is private and not published under an open-source license.
