import path from "node:path";
import dotenv from "dotenv";
import { Client } from "pg";

dotenv.config({ path: path.join(__dirname, "../.env.local") });
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL is not set.");
  process.exit(1);
}

const sql = `
-- Function to block UPDATE and DELETE on audit_logs
CREATE OR REPLACE FUNCTION block_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are read-only and cannot be updated or deleted.';
END;
$$ LANGUAGE plpgsql;

-- Function to block INSERT unless connection is identified as 'vault_app'
CREATE OR REPLACE FUNCTION block_audit_log_insert()
RETURNS TRIGGER AS $$
BEGIN
    IF current_setting('application_name', true) IS DISTINCT FROM 'vault_app' THEN
        RAISE EXCEPTION 'Audit logs can only be created by the system application.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Bind triggers to audit_logs table
DROP TRIGGER IF EXISTS trg_block_audit_log_modification ON audit_logs;
CREATE TRIGGER trg_block_audit_log_modification
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW
EXECUTE FUNCTION block_audit_log_modification();

DROP TRIGGER IF EXISTS trg_block_audit_log_insert ON audit_logs;
CREATE TRIGGER trg_block_audit_log_insert
BEFORE INSERT ON audit_logs
FOR EACH ROW
EXECUTE FUNCTION block_audit_log_insert();
`;

async function main() {
  console.log("⚙️ Setting up database security triggers for audit logs...");
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query(sql);
    console.log("✅ Security triggers applied successfully.");
  } catch (error) {
    console.error("❌ Failed to apply security triggers:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
