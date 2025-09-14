// OAuth providers integration for Google and GitHub
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import type { Express } from "express";
import { storage } from "./storage";
import crypto from "crypto";

// Individual provider validation - allows partial OAuth setup
function validateGoogleConfig(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function validateGitHubConfig(): boolean {
  return !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
}

// Enhanced verify function with better session integration
async function verifyOAuthUser(
  accessToken: string,
  refreshToken: string,
  profile: any,
  done: (error: any, user?: any) => void
) {
  try {
    console.log('OAuth profile received:', {
      provider: profile.provider,
      id: profile.id,
      email: profile.emails?.[0]?.value,
      name: profile.displayName
    });

    // Create user data from OAuth profile
    const userData = {
      id: `${profile.provider}_${profile.id}`, // Prefix with provider to avoid ID conflicts
      email: profile.emails?.[0]?.value || null,
      firstName: profile.name?.givenName || profile.displayName?.split(' ')[0] || null,
      lastName: profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' ') || null,
      profileImageUrl: profile.photos?.[0]?.value || null,
    };

    // Upsert user in database
    const user = await storage.upsertUser(userData);
    
    // Create Replit Auth compatible session object
    const sessionUser = {
      claims: {
        sub: user.id,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        profile_image_url: user.profileImageUrl,
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours from now
      },
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
      provider: profile.provider
    };

    done(null, sessionUser);
  } catch (error) {
    console.error('OAuth verification error:', error);
    done(error, null);
  }
}

export function setupOAuthProviders(app: Express, baseUrl: string) {
  console.log('Setting up OAuth providers...');
  
  const configuredProviders: string[] = [];

  // Google OAuth Strategy - independent setup
  if (validateGoogleConfig()) {
    try {
      passport.use('google', new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: `${baseUrl}/api/auth/google/callback`,
        scope: ['profile', 'email'],
        state: true // Enable CSRF protection
      }, verifyOAuthUser));

      // Google OAuth routes with CSRF protection
      app.get('/api/auth/google', (req, res, next) => {
        // Generate and store CSRF state parameter
        const state = crypto.randomBytes(32).toString('hex');
        req.session.oauthState = state;
        
        passport.authenticate('google', { 
          scope: ['profile', 'email'],
          state: state
        })(req, res, next);
      });

      app.get('/api/auth/google/callback', (req, res, next) => {
        // Verify CSRF state parameter
        const state = req.query.state as string;
        if (!state || state !== req.session.oauthState) {
          return res.redirect('/api/login?error=csrf_failed');
        }
        
        // Clear the state from session
        delete req.session.oauthState;
        
        passport.authenticate('google', {
          successRedirect: '/',
          failureRedirect: '/api/login?error=oauth_failed'
        })(req, res, next);
      });

      configuredProviders.push('google');
      console.log('✅ Google OAuth configured successfully');
    } catch (error) {
      console.error('❌ Failed to configure Google OAuth:', error);
    }
  } else {
    console.log('⚠️  Google OAuth not configured - missing environment variables');
  }

  // GitHub OAuth Strategy - independent setup
  if (validateGitHubConfig()) {
    try {
      passport.use('github', new GitHubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        callbackURL: `${baseUrl}/api/auth/github/callback`,
        scope: ['user:email']
      }, verifyOAuthUser));

      // GitHub OAuth routes with CSRF protection
      app.get('/api/auth/github', (req, res, next) => {
        // Generate and store CSRF state parameter
        const state = crypto.randomBytes(32).toString('hex');
        req.session.oauthState = state;
        
        passport.authenticate('github', { 
          scope: ['user:email'],
          state: state
        })(req, res, next);
      });

      app.get('/api/auth/github/callback', (req, res, next) => {
        // Verify CSRF state parameter
        const state = req.query.state as string;
        if (!state || state !== req.session.oauthState) {
          return res.redirect('/api/login?error=csrf_failed');
        }
        
        // Clear the state from session
        delete req.session.oauthState;
        
        passport.authenticate('github', {
          successRedirect: '/',
          failureRedirect: '/api/login?error=oauth_failed'
        })(req, res, next);
      });

      configuredProviders.push('github');
      console.log('✅ GitHub OAuth configured successfully');
    } catch (error) {
      console.error('❌ Failed to configure GitHub OAuth:', error);
    }
  } else {
    console.log('⚠️  GitHub OAuth not configured - missing environment variables');
  }

  // Get available providers endpoint
  app.get('/api/auth/providers', (req, res) => {
    const providers = ['replit']; // Always include Replit
    providers.push(...configuredProviders);
    
    res.json({ 
      providers,
      configured: configuredProviders.length,
      available: ['replit', 'google', 'github']
    });
  });

  if (configuredProviders.length > 0) {
    console.log(`✅ OAuth providers setup completed: ${configuredProviders.join(', ')}`);
  } else {
    console.log('⚠️  No OAuth providers configured');
  }
}

// Export functions to check individual OAuth providers
export function isGoogleOAuthConfigured(): boolean {
  return validateGoogleConfig();
}

export function isGitHubOAuthConfigured(): boolean {
  return validateGitHubConfig();
}

export function getConfiguredOAuthProviders(): string[] {
  const providers: string[] = [];
  if (validateGoogleConfig()) providers.push('google');
  if (validateGitHubConfig()) providers.push('github');
  return providers;
}