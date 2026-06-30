import dotenv from "dotenv";
import path from "node:path";
dotenv.config({ path: path.join(__dirname, "../.env.local") });
dotenv.config();

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcrypt";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
	const email = process.env.SEED_ADMIN_EMAIL ?? "admin@vault.local";
	const password = process.env.SEED_ADMIN_PASSWORD ?? "Admin@2024!Secure";
	const name = process.env.SEED_ADMIN_NAME ?? "System Administrator";

	console.log("🌱 Seeding database...");

	const passwordHash = await bcrypt.hash(password, 12);

	const user = await prisma.user.upsert({
		where: { email },
		update: {
			passwordHash,
			name,
			role: "SUPER_ADMIN",
		},
		create: {
			email,
			passwordHash,
			name,
			role: "SUPER_ADMIN",
		},
	});

	console.log(`✅ Super admin created/updated:`);
	console.log(`   Email: ${user.email}`);
	console.log(`   Name:  ${user.name}`);
	console.log(`   Role:  ${user.role}`);
	console.log(`   ID:    ${user.id}`);

	// Create some sample credentials for demonstration
	const { encrypt } = await import("../src/lib/crypto");

	const sampleCredentials = [
		{
			title: "Production Database",
			username: "db_admin",
			password: "Pr0d!Db#2024$Secure",
			url: "https://db.example.com:5432",
			notes: "Main PostgreSQL production database. Contact DevOps for access.",
			category: "Databases",
		},
		{
			title: "AWS Console",
			username: "admin@company.com",
			password: "Aws!C0ns0le#Key2024",
			url: "https://console.aws.amazon.com",
			notes: "Root account — use only for emergency access.",
			category: "Cloud",
		},
		{
			title: "GitHub Organization",
			username: "org-admin",
			password: "G1tHub$0rg#Adm1n!",
			url: "https://github.com/orgs/company",
			notes: "Organization admin account for managing repos and teams.",
			category: "Development",
		},
		{
			title: "Slack Workspace",
			username: "workspace-admin@company.com",
			password: "Sl@ck!W0rk$pace2024",
			url: "https://company.slack.com",
			notes: "Workspace admin for managing channels and integrations.",
			category: "Communication",
		},
		{
			title: "VPN Gateway",
			username: "vpn_admin",
			password: "Vpn#G@tew4y!2024Sec",
			url: "https://vpn.company.com",
			notes: "OpenVPN admin panel. Config files stored in /etc/openvpn/.",
			category: "Infrastructure",
		},
	];

	// Clear existing credentials for a clean state
	await prisma.credential.deleteMany({});

	for (const cred of sampleCredentials) {
		const encrypted = encrypt(cred.password);

		await prisma.credential.create({
			data: {
				title: cred.title,
				username: cred.username,
				encryptedPassword: encrypted.encryptedData,
				iv: encrypted.iv,
				authTag: encrypted.authTag,
				url: cred.url,
				notes: cred.notes,
				category: cred.category,
				createdBy: user.id,
			},
		});
	}

	console.log(`✅ ${sampleCredentials.length} sample credentials created.`);

	// Log the seed action
	await prisma.auditLog.create({
		data: {
			userId: user.id,
			action: "LOGIN",
			details: "Database seeded — initial setup",
		},
	});

	console.log("✅ Seed complete!");
}

main()
	.catch((e) => {
		console.error("❌ Seed failed:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
