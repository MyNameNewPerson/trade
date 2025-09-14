# Overview

CryptoFlow is a non-custodial cryptocurrency exchange platform that enables secure crypto-to-crypto and crypto-to-fiat exchanges. The platform supports fixed and floating exchange rates, manual operator-managed payouts, and optional KYC/AML compliance. It provides a React-based frontend widget for exchanges, real-time order tracking, and an admin panel for operators to manage transactions and compliance requirements.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The frontend is built with **React** using modern development tools and libraries:

- **Component Library**: ShadCN UI components with Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with CSS variables for theming (dark/light mode support)
- **State Management**: React Query for server state and React Context for theme management
- **Routing**: Wouter for client-side routing
- **Internationalization**: React i18next with support for English, Russian, and Romanian
- **Form Handling**: React Hook Form with Zod validation
- **Real-time Updates**: WebSocket connection for live exchange rates and order status updates

## Backend Architecture

The backend follows a **Node.js/Express** architecture with TypeScript:

- **API Framework**: Express.js with RESTful endpoints
- **Database Layer**: Drizzle ORM for PostgreSQL database operations
- **Real-time Communication**: WebSocket server for broadcasting rate updates and order status changes
- **In-Memory Storage**: Temporary memory storage implementation with interface for easy database migration
- **Validation**: Zod schemas shared between frontend and backend

## Core Features Implementation

### Exchange System
- **Rate Types**: Fixed rate (locked for TTL) and floating rate (market-based) exchanges
- **Order Flow**: Create order → generate deposit address → monitor deposits → process payouts
- **Currency Support**: Multiple cryptocurrencies with network selection (BTC, ETH, USDT-TRC20/ERC20, USDC)
- **Fiat Payouts**: Card-based payouts with masked card storage (PCI-compliant approach)

### Order Management
- **Status Tracking**: Comprehensive order lifecycle from awaiting_deposit to completed
- **Operator Interface**: Manual payout controls and KYC request capabilities
- **Audit Trail**: Complete logging of operator actions and status changes

### Security Features
- **Input Validation**: Comprehensive validation on both client and server sides
- **Rate Limiting**: Protection against abuse through request throttling
- **Data Protection**: Sensitive card data is masked, not stored in full
- **Session Management**: Secure session handling with proper authentication

## Database Schema

The system uses PostgreSQL with the following main entities:

- **Currencies**: Supported cryptocurrencies and fiat currencies with network specifications
- **Exchange Rates**: Historical and current exchange rates between currency pairs
- **Orders**: Complete order information including amounts, addresses, status, and metadata
- **KYC Requests**: Compliance-related verification requests and documentation

## External Dependencies

- **Neon Database**: PostgreSQL database hosting via @neondatabase/serverless
- **Drizzle ORM**: Database operations and migrations
- **React Query**: Server state management and caching
- **ShadCN UI**: Pre-built accessible UI components
- **Radix UI**: Headless UI primitives for complex components
- **WebSocket**: Real-time communication for rate updates
- **Zod**: Runtime type validation and schema definitions
- **React i18next**: Internationalization framework
- **Tailwind CSS**: Utility-first CSS framework
- **Vite**: Build tool and development server

The architecture is designed to be modular and scalable, with clear separation between the exchange widget, order management, and administrative functions. The system supports both automated and manual processing workflows, making it suitable for regulated cryptocurrency exchange operations.

# Google OAuth Setup Instructions

## ✅ Current Status
**EXCELLENT NEWS:** Google OAuth is already **FULLY IMPLEMENTED** in the codebase! The only missing piece is the environment variables.

**What's already working:**
- ✅ Google OAuth Strategy configured in `server/oauthProviders.ts`
- ✅ Endpoints `/api/auth/google` and `/api/auth/google/callback` created
- ✅ CSRF protection enabled
- ✅ User session integration working
- ✅ Error handling implemented
- ✅ Integration with Express server complete

**What needs to be added:** Only `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` environment variables.

## 🔧 Setup Instructions

### Step 1: Get Google OAuth Credentials

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/
   - Create a new project or select existing one

2. **Enable Google+ API:**
   - Navigate to: APIs & Services → Library
   - Search for "Google+ API" and enable it

3. **Configure OAuth Consent Screen:**
   - Go to: APIs & Services → OAuth consent screen
   - Choose "External" user type
   - Fill required fields:
     - App name: "CryptoFlow Exchange"
     - User support email: your email
     - Developer contact information: your email

4. **Create OAuth Client ID:**
   - Go to: APIs & Services → Credentials
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "CryptoFlow Exchange App"
   - Authorized JavaScript origins: `https://your-replit-domain.replit.dev`
   - Authorized redirect URIs: `https://your-replit-domain.replit.dev/api/auth/google/callback`

5. **Get your credentials:**
   - Copy the "Client ID" 
   - Copy the "Client Secret"

### Step 2: Add Credentials to Replit

1. **Open Replit Secrets:**
   - In your Replit project, click on "Tools" → "Secrets"

2. **Add Google OAuth credentials:**
   ```
   Key: GOOGLE_CLIENT_ID
   Value: [Your Google Client ID from step 1]

   Key: GOOGLE_CLIENT_SECRET  
   Value: [Your Google Client Secret from step 1]
   ```

### Step 3: Restart Application

1. **Restart the workflow:**
   - The application will automatically restart
   - Check logs for: "✅ Google OAuth configured successfully"

2. **Verify it's working:**
   - Visit: `https://your-replit-domain.replit.dev/api/auth/providers`
   - Should show: `{"providers":["replit","google"],"configured":1,...}`

### Step 4: Test Google OAuth

1. **Test the login flow:**
   - Go to your application
   - Click "Sign in with Google" button
   - Should redirect to Google OAuth
   - After authorization, should redirect back to your app

## 🔍 Troubleshooting

### Issue: "Google OAuth not configured" in logs
**Solution:** Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are properly set in Replit Secrets.

### Issue: "redirect_uri_mismatch" error
**Solution:** Ensure the redirect URI in Google Cloud Console exactly matches: `https://your-replit-domain.replit.dev/api/auth/google/callback`

### Issue: "csrf_failed" error  
**Solution:** This is normal CSRF protection. Ensure you're accessing `/api/auth/google` directly, not `/api/auth/google/callback`.

## 📝 Code Implementation Details

The Google OAuth implementation includes:

**Security Features:**
- CSRF state parameter protection
- Secure session handling
- Access token and refresh token management
- User profile integration with existing user system

**User Flow:**
1. User clicks "Sign in with Google"
2. Redirects to Google OAuth with CSRF state
3. User authorizes application
4. Google redirects to `/api/auth/google/callback`
5. Backend validates CSRF state and processes tokens
6. User session created with Replit Auth compatibility
7. User redirected to application homepage

**Database Integration:**
- Automatically creates/updates user in database
- Uses format: `google_{google_user_id}` for unique user identification
- Stores profile information (name, email, profile image)