import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Express } from "express";
import session, { Store } from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, insertUserSchema } from "@shared/schema";
import { z } from "zod";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string | null) {
  if (!stored) return false;
  
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Use environment variable for session secret, with fallback
  const sessionSecret = process.env.SESSION_SECRET || "fintrack_session_secret";

  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore as Store,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure the local strategy for username/password login
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          // Update last login time (and handle older schema without lastLogin)
          try {
            const updatedUser = await storage.updateUser(user.id, {
              lastLogin: new Date(),
            });
            return done(null, updatedUser);
          } catch (err) {
            console.warn(
              "Failed to update lastLogin, continuing with original user",
              err,
            );
            return done(null, user);
          }
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  // Configure Google OAuth strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        callbackURL: "/api/auth/google/callback",
        scope: ["profile", "email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user exists with this Google ID
          const existingUserByGoogleId = await storage.getUserByGoogleId(profile.id);
          
          if (existingUserByGoogleId) {
            // User already exists, update last login
            try {
              const updatedUser = await storage.updateUser(existingUserByGoogleId.id, {
                lastLogin: new Date(),
              });
              return done(null, updatedUser);
            } catch (err) {
              console.warn(
                "Failed to update lastLogin, continuing with original user",
                err,
              );
              return done(null, existingUserByGoogleId);
            }
          }

          // No user found with Google ID, check if email exists
          if (!profile.emails || !profile.emails[0] || !profile.emails[0].value) {
            return done(new Error("Google did not provide an email address"));
          }

          const userEmail = profile.emails[0].value;
          const existingUserByEmail = await storage.getUserByEmail(userEmail);

          if (existingUserByEmail) {
            // User exists with this email but not linked to Google yet
            // Link this Google ID to the existing account
            try {
              const updatedUser = await storage.updateUser(existingUserByEmail.id, {
                googleId: profile.id,
                lastLogin: new Date(),
              });
              return done(null, updatedUser);
            } catch (err) {
              console.warn(
                "Failed to link Google account to existing user",
                err,
              );
              return done(err);
            }
          }

          // Create a new user with Google credentials
          try {
            // Generate a username from the email (removing the domain)
            let username = userEmail.split('@')[0];
            
            // Check if username already exists and append numbers if needed
            let usernameExists = true;
            let counter = 1;
            const baseUsername = username;
            
            while (usernameExists) {
              const existingUser = await storage.getUserByUsername(username);
              if (!existingUser) {
                usernameExists = false;
              } else {
                username = `${baseUsername}${counter}`;
                counter++;
              }
            }

            // Get user's name from profile
            const fullName = profile.displayName || 
              ((profile.name?.givenName || '') + ' ' + (profile.name?.familyName || '')).trim() || 
              username;
              
            // Create new user
            const avatar = profile.photos && profile.photos.length > 0 
              ? profile.photos[0].value 
              : undefined;
              
            const newUser = await storage.createUser({
              username,
              email: userEmail,
              fullName,
              avatar,
              googleId: profile.id,
              role: "user",
              lastLogin: new Date(),
            });
            
            return done(null, newUser);
          } catch (error) {
            console.error("Error creating user from Google profile:", error);
            return done(error);
          }
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Extended user schema with validation
  const registerSchema = insertUserSchema.extend({
    password: z.string().min(8, "Password must be at least 8 characters"),
    email: z.string().email("Invalid email format"),
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Validate input
      const validatedData = registerSchema.parse(req.body);

      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(
        validatedData.username,
      );
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Create new user with hashed password
      try {
        const user = await storage.createUser({
          ...validatedData,
          password: await hashPassword(validatedData.password),
          role: "user", // Default role for new users
          lastLogin: new Date(),
        });

        // Auto-login after registration
        req.login(user, (err) => {
          if (err) return next(err);
          // Don't send password in response
          const { password, ...userWithoutPassword } = user;
          res.status(201).json(userWithoutPassword);
        });
      } catch (error) {
        console.error("Error creating user:", error);
        try {
          // Try without lastLogin if that's causing the issue
          const user = await storage.createUser({
            ...validatedData,
            password: await hashPassword(validatedData.password),
            role: "user", // Default role for new users
          });

          // Auto-login after registration
          req.login(user, (err) => {
            if (err) return next(err);
            // Don't send password in response
            const { password, ...userWithoutPassword } = user;
            res.status(201).json(userWithoutPassword);
          });
        } catch (error) {
          if (error instanceof z.ZodError) {
            return res.status(400).json({
              message: "Validation error",
              errors: error.errors.map((e) => ({
                path: e.path.join("."),
                message: e.message,
              })),
            });
          }
          res.status(500).json({ message: "Registration failed" });
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user)
        return res
          .status(401)
          .json({ message: "Invalid username or password" });

      req.login(user, (err) => {
        if (err) return next(err);
        // Don't send password in response
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // Don't send password in response
    const { password, ...userWithoutPassword } = req.user!;
    res.json(userWithoutPassword);
  });

  // Update user profile endpoint
  app.patch("/api/user/profile", async (req, res) => {
    if (!req.isAuthenticated())
      return res.status(401).json({ message: "Unauthorized" });

    try {
      // Validate the update fields
      const updateSchema = z.object({
        fullName: z.string().min(2).optional(),
        avatar: z.string().optional(),
        address: z.string().optional(),
        darkMode: z.boolean().optional(),
      });

      const validatedData = updateSchema.parse(req.body);

      // Update user
      const updatedUser = await storage.updateUser(req.user!.id, validatedData);

      // Return updated user without password
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        });
      }
      res.status(500).json({ message: "Profile update failed" });
    }
  });

  // Change password endpoint
  app.patch("/api/user/password", async (req, res) => {
    if (!req.isAuthenticated())
      return res.status(401).json({ message: "Unauthorized" });

    try {
      // Validate the password change fields
      const passwordChangeSchema = z.object({
        currentPassword: z.string(),
        newPassword: z
          .string()
          .min(8, "Password must be at least 8 characters"),
      });

      const validatedData = passwordChangeSchema.parse(req.body);

      // Verify current password
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isCurrentPasswordValid = await comparePasswords(
        validatedData.currentPassword,
        user.password,
      );

      if (!isCurrentPasswordValid) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect" });
      }

      // Update password
      const updatedUser = await storage.updateUser(user.id, {
        password: await hashPassword(validatedData.newPassword),
      });

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        });
      }
      res.status(500).json({ message: "Password change failed" });
    }
  });

  // Admin endpoints - only accessible by users with admin role
  app.get("/api/admin/users", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const usersWithoutPasswords = users.map((user) => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve users" });
    }
  });

  // Update user role - admin only
  app.patch("/api/admin/users/:userId/role", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    try {
      const userId = parseInt(req.params.userId);
      const roleSchema = z.object({
        role: z.enum(["user", "admin"]),
      });

      const validatedData = roleSchema.parse(req.body);

      // Prevent admin from demoting themselves
      if (req.user!.id === userId && validatedData.role !== "admin") {
        return res
          .status(400)
          .json({ message: "Cannot change your own admin role" });
      }

      const updatedUser = await storage.updateUserRole(
        userId,
        validatedData.role,
      );

      // Return updated user without password
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        });
      }
      res.status(500).json({ message: "Role update failed" });
    }
  });

  // Delete user - admin only
  app.delete("/api/admin/users/:userId", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    try {
      const userId = parseInt(req.params.userId);

      // Prevent admin from deleting themselves
      if (req.user!.id === userId) {
        return res
          .status(400)
          .json({ message: "Cannot delete your own account" });
      }

      await storage.deleteUser(userId);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "User deletion failed" });
    }
  });

  // Google OAuth routes
  app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect: "/login?error=google-auth-failed",
    }),
    (req, res) => {
      // Successful authentication, redirect to home or dashboard
      res.redirect("/");
    }
  );
}
