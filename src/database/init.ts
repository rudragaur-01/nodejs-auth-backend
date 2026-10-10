import pool from "../config/db";

async function createUserRoleEnum() {
  await pool.query(`
    DO $$
    BEGIN
      CREATE TYPE user_role AS ENUM ('user', 'admin', 'manager');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `);
}

async function createOrganizationTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS organizations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function createUsersTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

      organization_id UUID NOT NULL
        REFERENCES organizations(id) ON DELETE RESTRICT,

      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone_number VARCHAR(20) NOT NULL UNIQUE,
      password_hash TEXT,
      role user_role NOT NULL DEFAULT 'user',
      is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,

      refresh_token TEXT,
      refresh_token_expires_at TIMESTAMPTZ,

      email_verification_token TEXT,
      email_verification_token_expires_at TIMESTAMPTZ,

      password_reset_token TEXT,
      password_reset_token_expires_at TIMESTAMPTZ,

      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

export async function createTables() {
  await createUserRoleEnum();
  await createOrganizationTable();
  await createUsersTable();

  console.log("DATABASE TABLES ARE READY!");
}