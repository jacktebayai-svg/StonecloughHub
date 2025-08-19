import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { graphqlHTTP } from 'express-graphql';
import { schema } from './api/graphql-civic-api';
import advancedCivicApi from './api/advanced-civic-api';
import { setupWebSocket } from './api/advanced-civic-api';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS headers for API access
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Add advanced civic data API routes
  app.use('/api/civic', advancedCivicApi);
  
  // Add GraphQL endpoint
  app.use('/api/graphql', graphqlHTTP({
    schema: schema,
    graphiql: process.env.NODE_ENV === 'development', // Enable GraphiQL in development
  }));
  
  const server = await registerRoutes(app);
  
  // Setup WebSocket for real-time updates
  const { broadcast } = setupWebSocket(server);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, async () => {
    log(`serving on port ${port}`);
    
    // Seed database on startup if no data exists
    try {
      const { storage } = await import("./storage");
      const stats = await storage.getCouncilDataStats();
      if (stats.planningApplications === 0) {
        log('No data found, seeding database...');
        const { seedDatabase } = await import("./services/seed-data");
        await seedDatabase();
      }
    } catch (error) {
      log('Note: Could not check database or seed data:', error);
    }
  });
})();
