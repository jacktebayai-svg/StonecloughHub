-- Create sessions table for express-session with connect-pg-simple
-- This table is required for storing user sessions in PostgreSQL

CREATE TABLE IF NOT EXISTS "sessions" (
  "sid" VARCHAR NOT NULL COLLATE "default",
  "sess" JSON NOT NULL,
  "expire" TIMESTAMP(6) NOT NULL
)
WITH (OIDS=FALSE);

-- Add primary key constraint
ALTER TABLE "sessions" 
ADD CONSTRAINT "sessions_pkey" 
PRIMARY KEY ("sid") 
NOT DEFERRABLE INITIALLY IMMEDIATE;

-- Create index for session expiration cleanup
CREATE INDEX IF NOT EXISTS "IDX_sessions_expire" 
ON "sessions" ("expire");
