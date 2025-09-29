// Local authentication system for external deployment
import bcrypt from "bcryptjs";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import MemoryStore from "memorystore";
import { storage } from "../storage";

const memoryStoreConstructor = MemoryStore(session);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  let sessionStore;
  
  if (process.env.DATABASE_URL) {
    // Use PostgreSQL session store when database is available
    const pgStore = connectPg(session);
    sessionStore = new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: false,
      ttl: sessionTtl,
      tableName: "sessions",
    });
  } else {
    // Fallback to memory store for external deployment without database
    sessionStore = new memoryStoreConstructor({
      checkPeriod: sessionTtl,
    });
  }

  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
      sameSite: 'lax',
    },
  });
}

export async function setupLocalAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Local strategy for username/password authentication
  passport.use('local', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, async (email: string, password: string, done) => {
    try {
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return done(null, false, { message: 'Неверный email или пароль' });
      }

      // Check if account is activated
      if (!user.isActive) {
        return done(null, false, { message: 'Аккаунт не активирован. Проверьте email' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password || '');
      if (!isValidPassword) {
        return done(null, false, { message: 'Неверный email или пароль' });
      }

      // Create session user object compatible with existing middleware
      const sessionUser = {
        claims: {
          sub: user.id,
          email: user.email,
          first_name: user.firstName,
          last_name: user.lastName,
          profile_image_url: user.profileImageUrl,
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours from now
        },
        expires_at: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
        provider: 'local'
      };

      return done(null, sessionUser);
    } catch (error) {
      return done(error);
    }
  }));

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // Local login route
  app.post("/api/auth/local/login", (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
      }
      if (!user) {
        return res.status(401).json({ error: info.message || 'Ошибка аутентификации' });
      }
      
      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ error: 'Ошибка создания сессии' });
        }
        return res.json({ 
          success: true, 
          user: { 
            id: user.claims.sub, 
            email: user.claims.email,
            firstName: user.claims.first_name,
            lastName: user.claims.last_name
          } 
        });
      });
    })(req, res, next);
  });

  // Register route
  app.post("/api/auth/local/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password || !firstName) {
        return res.status(400).json({ error: 'Все поля обязательны' });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user (inactive by default)
      const newUser = await storage.createUser({
        email,
        firstName,
        lastName,
        password: passwordHash,
        isActive: false,
        profileImageUrl: null,
        role: 'user',
      });

      // TODO: Send activation email
      console.log(`User registered: ${email} (ID: ${newUser.id})`);

      res.json({ 
        success: true, 
        message: 'Регистрация успешна. Проверьте email для активации аккаунта.' 
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Ошибка регистрации' });
    }
  });

  // Activate account route
  app.get("/api/auth/local/activate/:token", async (req, res) => {
    try {
      const { token } = req.params;
      
      // TODO: Implement token validation and user activation
      // For now, simple placeholder
      res.json({ success: true, message: 'Аккаунт активирован' });
    } catch (error) {
      console.error('Activation error:', error);
      res.status(500).json({ error: 'Ошибка активации аккаунта' });
    }
  });

  // Logout route
  app.post("/api/auth/local/logout", (req, res) => {
    req.logout(() => {
      res.json({ success: true, message: 'Выход выполнен успешно' });
    });
  });

  // Fallback login route for compatibility
  app.get("/api/login", (req, res) => {
    res.redirect("/?login=true");
  });
}

// Authentication middleware compatible with existing code
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.claims) {
    return res.status(401).json({ error: "Требуется аутентификация" });
  }

  // Check expiration for OAuth users (local users don't have refresh tokens)
  if (user.expires_at && user.expires_at < Math.floor(Date.now() / 1000)) {
    if (user.provider === 'local') {
      // For local users, just log them out
      req.logout(() => {
        return res.status(401).json({ error: "Сессия истекла" });
      });
      return;
    }
    
    // For OAuth users, try to refresh token (existing logic would go here)
    return res.status(401).json({ error: "Токен истек" });
  }

  return next();
};

// Admin role check middleware compatible with existing code
export const requireAdmin: RequestHandler = async (req, res, next) => {
  const user = req.user as any;
  if (!user?.claims?.sub) {
    return res.status(401).json({ error: "Требуется аутентификация" });
  }

  try {
    const dbUser = await storage.getUser(user.claims.sub.toString());
    if (!dbUser || dbUser.role !== 'admin') {
      return res.status(403).json({ error: "Требуются права администратора" });
    }
    next();
  } catch (error) {
    return res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
};