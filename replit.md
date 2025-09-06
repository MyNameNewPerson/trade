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