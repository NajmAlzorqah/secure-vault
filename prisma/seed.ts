import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, "../.env.local") });
dotenv.config();

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";
import { Pool } from "pg";
import type { AuditAction } from "../src/generated/prisma/client";
import { PrismaClient } from "../src/generated/prisma/client";

const originalUrl = process.env.DATABASE_URL;
let connectionString = originalUrl;
if (originalUrl) {
  const url = new URL(originalUrl);
  url.searchParams.set("application_name", "vault_app");
  connectionString = url.toString();
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

function daysAgo(days: number, offsetHours = 0): Date {
  return new Date(Date.now() - days * DAY - offsetHours * HOUR);
}

function requireId(map: Map<string, string>, key: string): string {
  const id = map.get(key);
  if (!id) throw new Error(`Missing seeded id for: ${key}`);
  return id;
}

interface TeamMember {
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "EDITOR" | "VIEWER";
  title: string;
  password: string;
  joinedDaysAgo: number;
  passwordChangedDaysAgo: number;
}

interface SeedCredential {
  title: string;
  username: string;
  password: string;
  url: string;
  notes: string;
  category: string;
  owner: string;
  daysAgo: number;
  updatedDaysAgo?: number;
}

interface AuditSeed {
  email?: string;
  action: AuditAction;
  details: string;
  targetTitle?: string;
  when: Date;
  ip: string;
  ua: string;
}

const COMPANY = "Waha Technologies (واحة التقنية)";

const team: TeamMember[] = [
  {
    name: "Najm",
    email: "najm@gmail.com",
    role: "SUPER_ADMIN",
    title: "Primary Administrator",
    password: "Powernjm1*23",
    joinedDaysAgo: 42,
    passwordChangedDaysAgo: 40,
  },
  {
    name: "سارة الحربي (Sara Alharbi)",
    email: "sara@waha.sa",
    role: "EDITOR",
    title: "Senior DevOps Engineer",
    password: "Terraform!Ops*Cluster8675",
    joinedDaysAgo: 40,
    passwordChangedDaysAgo: 16,
  },
  {
    name: "محمد القحطاني (Mohammed Al-Qahtani)",
    email: "mohammed@waha.sa",
    role: "EDITOR",
    title: "Senior Backend Engineer",
    password: "Postgres!Pipelines@4802#Gulf",
    joinedDaysAgo: 40,
    passwordChangedDaysAgo: 25,
  },
  {
    name: "نورة الشهري (Noura Al-Shehri)",
    email: "noura@waha.sa",
    role: "EDITOR",
    title: "Frontend Team Lead",
    password: "Tailwind!RTL@NextApp~2026",
    joinedDaysAgo: 38,
    passwordChangedDaysAgo: 30,
  },
  {
    name: "يوسف الزهراني (Yousef Al-Zahrani)",
    email: "yousef@waha.sa",
    role: "VIEWER",
    title: "IT & Onboarding Specialist",
    password: "Tickets!Laptop@Facility*37",
    joinedDaysAgo: 20,
    passwordChangedDaysAgo: 6,
  },
  {
    name: "فاطمة المزرعي (Fatima Al-Mazrouei)",
    email: "fatima@waha.sa",
    role: "VIEWER",
    title: "QA Engineer",
    password: "Playwright!Steps@Suite~909",
    joinedDaysAgo: 25,
    passwordChangedDaysAgo: 22,
  },
  {
    name: "عبدالله الصالح (Abdullah Al-Saleh)",
    email: "abdullah@waha.sa",
    role: "VIEWER",
    title: "DevOps Intern",
    password: "Kubectl!Study@Cluster*26",
    joinedDaysAgo: 12,
    passwordChangedDaysAgo: 12,
  },
];

const credentials: SeedCredential[] = [
  {
    title: "AWS Console (Root)",
    username: "root@waha.sa",
    password: "Aquila!Marble*1937@Gulf",
    url: "https://console.aws.amazon.com",
    notes:
      "Root account for emergency use only. Daily work goes through IAM Identity Center with short-lived sessions. Production region us-east-1, regional workload in me-south-1 (Riyadh).",
    category: "Cloud & Infrastructure",
    owner: "najm@gmail.com",
    daysAgo: 38,
  },
  {
    title: "AWS IAM Identity Center",
    username: "sso-admin@waha.sa",
    password: "Sapphire!Kingfisher=8842#Palm",
    url: "https://waha.awsapps.com/start",
    notes:
      "Permission sets: PowerUser for engineers, ReadOnly for QA, BillingView for finance. Provisioned entirely with Terraform.",
    category: "Cloud & Infrastructure",
    owner: "sara@waha.sa",
    daysAgo: 33,
  },
  {
    title: "Cloudflare Dashboard",
    username: "dns-admin@waha.sa",
    password: "Zephyr*Harbor@5601!Dust",
    url: "https://dash.cloudflare.com",
    notes:
      "Zero Trust access + WAF managed rules. waha.sa zone, origin traffic locked to AWS me-south-1 through a private tunnel.",
    category: "Cloud & Infrastructure",
    owner: "sara@waha.sa",
    daysAgo: 30,
  },
  {
    title: "Vercel",
    username: "deployments@waha.sa",
    password: "Juniper#Comet&9014@Lumen",
    url: "https://vercel.com/waha-tech",
    notes:
      "Preview deployments on every pull request. Production branch 'main' auto-deploys to waha.app.",
    category: "Cloud & Infrastructure",
    owner: "noura@waha.sa",
    daysAgo: 27,
  },
  {
    title: "Google Cloud Console",
    username: "platform@waha.sa",
    password: "Basalt!Ivy^7328$Vertex",
    url: "https://console.cloud.google.com",
    notes:
      "GKE staging cluster, Artifact Registry mirrors, BigQuery for product analytics. Primary region europe-west1.",
    category: "Cloud & Infrastructure",
    owner: "sara@waha.sa",
    daysAgo: 24,
  },
  {
    title: "GitHub Organization",
    username: "gh-admin@waha.sa",
    password: "Onyx!Garnet_5291#Falcon",
    url: "https://github.com/waha-tech",
    notes:
      "Org admin. SAML SSO enforced via Google Workspace, branch protection on main, GitHub Actions for CI. Two-factor required for every member.",
    category: "Code & Version Control",
    owner: "mohammed@waha.sa",
    daysAgo: 36,
    updatedDaysAgo: 10,
  },
  {
    title: "GitLab (Self-Hosted)",
    username: "git@git.waha.sa",
    password: "Bamboo*Relay@3360!Monk",
    url: "https://git.waha.sa",
    notes:
      "Internal-only repositories and on-prem container registry. Nightly backups shipped to S3.",
    category: "Code & Version Control",
    owner: "mohammed@waha.sa",
    daysAgo: 28,
  },
  {
    title: "Docker Hub",
    username: "waha-infra",
    password: "Harbor!Avalon=2077#Keel",
    url: "https://hub.docker.com/u/waha",
    notes:
      "Private images for CI runners and edge workers. Read-only tokens stored in GitHub secrets.",
    category: "Code & Version Control",
    owner: "sara@waha.sa",
    daysAgo: 21,
  },
  {
    title: "npm",
    username: "waha-oss",
    password: "Meridian!Venus@1892#Tide",
    url: "https://www.npmjs.com/~waha-oss",
    notes:
      "@waha scope for shared design-system and API client packages. Publish token only lives in GitHub Actions.",
    category: "Code & Version Control",
    owner: "noura@waha.sa",
    daysAgo: 19,
  },
  {
    title: "PyPI",
    username: "waha-ml",
    password: "Quartz!Nimbus=4402@Storm",
    url: "https://pypi.org",
    notes:
      "Internal ML tooling published as a private index on the self-hosted GitLab registry.",
    category: "Code & Version Control",
    owner: "mohammed@waha.sa",
    daysAgo: 15,
  },
  {
    title: "Terraform Cloud",
    username: "waha-platform",
    password: "Basil!Granite^7109@Cedar",
    url: "https://app.terraform.io/app/waha",
    notes:
      "One workspace per environment (dev/staging/prod) with remote state. Plan validation runs inside pull requests.",
    category: "CI/CD & DevOps",
    owner: "sara@waha.sa",
    daysAgo: 26,
  },
  {
    title: "Kubernetes (Rancher)",
    username: "cluster-admin",
    password: "Heron!Cobalt@5303#Reef",
    url: "https://rancher.waha.sa",
    notes:
      "Manages production EKS and staging GKE clusters. ArgoCD syncs every application. kubeconfig rotated monthly.",
    category: "CI/CD & DevOps",
    owner: "sara@waha.sa",
    daysAgo: 22,
  },
  {
    title: "Azure DevOps",
    username: "waha-azure",
    password: "Titan!Marigold=2851#Azure",
    url: "https://dev.azure.com/waha",
    notes:
      "Legacy Windows release pipelines being migrated to GitHub Actions. Keep access until Q4 migration completes.",
    category: "CI/CD & DevOps",
    owner: "mohammed@waha.sa",
    daysAgo: 12,
  },
  {
    title: "Datadog",
    username: "dd-team@waha.sa",
    password: "Packet!Orion@6604&Spine",
    url: "https://app.datadoghq.eu",
    notes:
      "APM traces, infra monitors and synthetic checks on checkout flow. All alerts route to #alerts in Slack.",
    category: "Monitoring & Observability",
    owner: "sara@waha.sa",
    daysAgo: 25,
  },
  {
    title: "Sentry",
    username: "sentry@waha.sa",
    password: "Varnish!Wren@7742#Paper",
    url: "https://sentry.io/organizations/waha",
    notes:
      "Error tracking for web and mobile. Release tracking wired to GitHub Actions, 90-day retention.",
    category: "Monitoring & Observability",
    owner: "noura@waha.sa",
    daysAgo: 20,
  },
  {
    title: "Grafana",
    username: "grafana-admin",
    password: "Mosaic!Alpine%6108@Plane",
    url: "https://grafana.waha.sa",
    notes:
      "Dashboards for Postgres, Redis and Kubernetes. Alert rules forward to Slack #alerts. OIDC login via Google.",
    category: "Monitoring & Observability",
    owner: "sara@waha.sa",
    daysAgo: 14,
  },
  {
    title: "PagerDuty",
    username: "oncall@waha.sa",
    password: "Siren!Onyx=1882#Beacon",
    url: "https://waha.pagerduty.com",
    notes:
      "Follow-the-sun rotation: Riyadh weekdays, Dubai weekends. CTO escalation after 15 minutes on Sev1 pages.",
    category: "Monitoring & Observability",
    owner: "najm@gmail.com",
    daysAgo: 23,
  },
  {
    title: "Slack (Waha Workspace)",
    username: "admin@waha.sa",
    password: "Ferret!Compass@7741#Ore",
    url: "https://waha.slack.com",
    notes:
      "Workspace owner. Mandatory channels: #incidents, #deploys, #alerts. History retained for 90 days.",
    category: "Communication & Office",
    owner: "najm@gmail.com",
    daysAgo: 18,
  },
  {
    title: "Google Workspace Admin",
    username: "it-admin@waha.sa",
    password: "Atlas!Quartz@3391#Drive",
    url: "https://admin.google.com",
    notes:
      "waha.sa organization. Group-based access, mobile device policy, SAML identity provider for GitHub and Datadog.",
    category: "Communication & Office",
    owner: "yousef@waha.sa",
    daysAgo: 17,
  },
  {
    title: "Notion",
    username: "waha-team",
    password: "Sable!Wicker=6517@Oak",
    url: "https://www.notion.so",
    notes:
      "Engineering wiki, RFC templates and incident postmortems. Professional plan with AI features enabled.",
    category: "Communication & Office",
    owner: "noura@waha.sa",
    daysAgo: 16,
  },
  {
    title: "Linear",
    username: "linear-admin@waha.sa",
    password: "Hawk!Trellis@8300#Graph",
    url: "https://linear.app/waha",
    notes:
      "Product roadmap and sprint cycles. Issues linked bidirectionally with GitHub, automated triage rules.",
    category: "Communication & Office",
    owner: "noura@waha.sa",
    daysAgo: 13,
  },
  {
    title: "Figma",
    username: "design@waha.sa",
    password: "Canvas!Copper@2714&Studio",
    url: "https://www.figma.com",
    notes:
      "Design system library. Dev Mode tokens synced into the Tailwind config used across repos.",
    category: "Communication & Office",
    owner: "noura@waha.sa",
    daysAgo: 11,
  },
  {
    title: "PostgreSQL (Production)",
    username: "waha_app",
    password: "Elephant!Lathe=8032#Acid",
    url: "https://me-south-1.console.aws.amazon.com/rds",
    notes:
      "RDS postgres:16, r6g.xlarge, point-in-time recovery enabled. No public endpoint — SSH bastion tunnel only, app and readonly logins.",
    category: "Databases & Storage",
    owner: "sara@waha.sa",
    daysAgo: 23,
  },
  {
    title: "Redis (Production)",
    username: "waha-cache",
    password: "Swift!Amber@6205#Cache",
    url: "https://console.aws.amazon.com/elasticache",
    notes:
      "ElastiCache 7.1 cluster used for sessions and rate limiting. Snapshots nightly, flushed keyspace after deploys.",
    category: "Databases & Storage",
    owner: "sara@waha.sa",
    daysAgo: 20,
    updatedDaysAgo: 5,
  },
  {
    title: "MongoDB Atlas",
    username: "waha-atlas",
    password: "Penguin!Tundra=4058@Globe",
    url: "https://cloud.mongodb.com",
    notes:
      "Catalog service data. M20 cluster in eu-central-1 with Atlas Search indexes enabled.",
    category: "Databases & Storage",
    owner: "mohammed@waha.sa",
    daysAgo: 15,
  },
  {
    title: "Amazon S3 Bucket (waha-backups)",
    username: "waha-backups",
    password: "Parcel!Savanna@3541#Key",
    url: "https://s3.console.aws.amazon.com/s3/buckets/waha-backups",
    notes:
      "Daily pg_dump and configuration snapshots. Lifecycle: 30d standard, 90d Glacier, 365d delete. Versioning enabled.",
    category: "Databases & Storage",
    owner: "sara@waha.sa",
    daysAgo: 18,
  },
  {
    title: "Stripe Dashboard (Test)",
    username: "billing@waha.sa",
    password: "Ledger!Comet=9872@Dune",
    url: "https://dashboard.stripe.com",
    notes:
      "Test-mode keys only for the sandbox environment. Production keys restricted to finance and 3D Secure on by default.",
    category: "Payments & APIs",
    owner: "mohammed@waha.sa",
    daysAgo: 21,
  },
  {
    title: "OpenAI Platform",
    username: "ai@waha.sa",
    password: "Cortex!Zephyr=8421@Neon",
    url: "https://platform.openai.com",
    notes:
      "GPT-4o and embeddings used for support triage. Monthly spend cap of $200; API keys live in this vault, never in the client.",
    category: "Payments & APIs",
    owner: "mohammed@waha.sa",
    daysAgo: 10,
  },
  {
    title: "Twilio",
    username: "sms-otp",
    password: "Signal!Aurora@7663#Text",
    url: "https://console.twilio.com",
    notes:
      "OTP delivery and WhatsApp notifications. Sender ID 'WahaApp' approved with the Saudi regulator (NTRA).",
    category: "Payments & APIs",
    owner: "mohammed@waha.sa",
    daysAgo: 12,
  },
  {
    title: "Resend",
    username: "email-relay",
    password: "Nimbus!Mail@5731#Courier",
    url: "https://resend.com/domains/waha.sa",
    notes:
      "Transactional email: 2FA codes and password resets. DKIM and SPF verified for waha.sa.",
    category: "Payments & APIs",
    owner: "yousef@waha.sa",
    daysAgo: 9,
  },
];

const IPS = [
  "188.48.120.14",
  "94.98.201.77",
  "5.41.162.90",
  "83.110.45.18",
  "188.49.5.201",
  "217.165.93.12",
  "91.73.144.33",
  "15.185.44.31",
];

const UAS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
];

async function main() {
  const resolvedTeam = [...team];

  const overrideEmail = process.env.SEED_ADMIN_EMAIL;
  const overrideName = process.env.SEED_ADMIN_NAME;
  const overridePassword = process.env.SEED_ADMIN_PASSWORD;

  if (overrideEmail && resolvedTeam[0]) {
    resolvedTeam[0].email = overrideEmail;
    resolvedTeam[0].name = overrideName ?? resolvedTeam[0].name;
    if (overridePassword) resolvedTeam[0].password = overridePassword;
  }

  console.log(`Seeding database for ${COMPANY}...`);
  console.log("Resetting tables for a deterministic seed...");

  await pool.query(
    "TRUNCATE TABLE password_reset_tokens, failed_login_attempts, password_history, audit_logs, credentials, users",
  );

  await prisma.securitySettings.deleteMany({});

  await prisma.securitySettings.create({
    data: {
      minimumPasswordLength: 12,
      passwordHistory: 5,
      lockDuration: 15,
      expirationDays: 90,
      mfaRequired: true,
      maxFailedAttempts: 5,
      requireSpecialChar: true,
      requireUppercase: true,
      requireNumber: true,
      requireLowercase: true,
    },
  });
  console.log("Security settings configured (MFA required, 90-day expiry).");

  const userIds = new Map<string, string>();
  const userPasswords = new Map<string, string>();

  for (const member of resolvedTeam) {
    const hash = await bcrypt.hash(member.password, 12);
    const created = await prisma.user.create({
      data: {
        email: member.email,
        name: member.name,
        role: member.role,
        passwordHash: hash,
        sessionVersion: 1,
        forcePasswordChange: false,
        passwordChangedAt: daysAgo(member.passwordChangedDaysAgo),
        createdAt: daysAgo(member.joinedDaysAgo),
        updatedAt: daysAgo(member.joinedDaysAgo - 1),
      },
    });
    userIds.set(member.email, created.id);
    userPasswords.set(member.email, member.password);
  }

  console.log(`Created ${resolvedTeam.length} team members.`);

  for (const member of resolvedTeam) {
    const previousHash = await bcrypt.hash(`Seed-Prev-${member.email}`, 12);
    const memberId = requireId(userIds, member.email);
    await prisma.passwordHistory.createMany({
      data: [
        {
          userId: memberId,
          passwordHash: previousHash,
          createdAt: daysAgo(member.joinedDaysAgo - 14),
        },
        {
          userId: memberId,
          passwordHash: await bcrypt.hash(member.password, 12),
          createdAt: daysAgo(member.passwordChangedDaysAgo),
        },
      ],
    });
  }
  console.log("Password history seeded (current + previous hash per member).");

  const { encrypt } = await import("../src/lib/crypto");

  const credIds = new Map<string, string>();
  for (const cred of credentials) {
    const creatorId = requireId(userIds, cred.owner);
    const encrypted = encrypt(cred.password);

    const created = await prisma.credential.create({
      data: {
        title: cred.title,
        username: cred.username,
        encryptedPassword: encrypted.encryptedData,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        url: cred.url,
        notes: cred.notes,
        category: cred.category,
        createdBy: creatorId,
        createdAt: daysAgo(cred.daysAgo),
        updatedAt: cred.updatedDaysAgo
          ? daysAgo(cred.updatedDaysAgo)
          : daysAgo(cred.daysAgo),
      },
    });
    credIds.set(cred.title, created.id);
  }

  console.log(`Created ${credentials.length} credentials across ${COMPANY}.`);

  const auditSeeds: AuditSeed[] = [];

  const superAdminEmail = resolvedTeam[0].email;

  for (const member of resolvedTeam.slice(1)) {
    auditSeeds.push({
      email: superAdminEmail,
      action: "CREATE_USER",
      details: `Created user ${member.email} (${member.role})`,
      when: daysAgo(member.joinedDaysAgo),
      ip: IPS[1],
      ua: UAS[0],
    });
  }

  credentials.forEach((cred, index) => {
    auditSeeds.push({
      email: cred.owner,
      action: "CREATE_CREDENTIAL",
      details: `Created credential '${cred.title}'`,
      targetTitle: cred.title,
      when: daysAgo(cred.daysAgo),
      ip: IPS[index % IPS.length],
      ua: UAS[(index + 1) % UAS.length],
    });
  });

  auditSeeds.push(
    {
      email: superAdminEmail,
      action: "LOGIN",
      details: `User ${superAdminEmail} logged in`,
      when: daysAgo(20, 3),
      ip: IPS[0],
      ua: UAS[0],
    },
    {
      email: superAdminEmail,
      action: "LOGOUT",
      details: "User logged out",
      when: daysAgo(20, 4),
      ip: IPS[0],
      ua: UAS[0],
    },
    {
      email: "sara@waha.sa",
      action: "LOGIN",
      details: "User sara@waha.sa logged in",
      when: daysAgo(19, 1),
      ip: IPS[2],
      ua: UAS[1],
    },
    {
      email: "sara@waha.sa",
      action: "LOGOUT",
      details: "User logged out",
      when: daysAgo(19, 2),
      ip: IPS[2],
      ua: UAS[1],
    },
    {
      email: superAdminEmail,
      action: "DELETE_CREDENTIAL",
      details:
        "Deleted 'Heroku (Legacy)' — infrastructure migrated off platform",
      when: daysAgo(18, 5),
      ip: IPS[1],
      ua: UAS[0],
    },
    {
      email: "sara@waha.sa",
      action: "CHANGE_PASSWORD",
      details: "User changed their password",
      when: daysAgo(16, 2),
      ip: IPS[4],
      ua: UAS[1],
    },
    {
      email: "noura@waha.sa",
      action: "LOGIN",
      details: "User noura@waha.sa logged in",
      when: daysAgo(15, 2),
      ip: IPS[3],
      ua: UAS[2],
    },
    {
      email: "mohammed@waha.sa",
      action: "LOGIN",
      details: "User mohammed@waha.sa logged in",
      when: daysAgo(15, 3),
      ip: IPS[5],
      ua: UAS[0],
    },
    {
      email: "fatima@waha.sa",
      action: "LOGIN",
      details: "User fatima@waha.sa logged in",
      when: daysAgo(13, 1),
      ip: IPS[3],
      ua: UAS[3],
    },
    {
      email: superAdminEmail,
      action: "EXPORT_CREDENTIALS",
      details: "Exported credentials CSV for the annual compliance audit",
      when: daysAgo(12, 4),
      ip: IPS[0],
      ua: UAS[0],
    },
    {
      email: "mohammed@waha.sa",
      action: "UPDATE_CREDENTIAL",
      details: "Rotated GitHub org PAT — scope narrowed to repo + workflow",
      targetTitle: "GitHub Organization",
      when: daysAgo(10, 2),
      ip: IPS[5],
      ua: UAS[2],
    },
    {
      email: "yousef@waha.sa",
      action: "VIEW_PASSWORD",
      details: "Viewed 'Google Workspace Admin'",
      targetTitle: "Google Workspace Admin",
      when: daysAgo(9, 3),
      ip: IPS[6],
      ua: UAS[0],
    },
    {
      email: undefined,
      action: "LOGIN_FAILED",
      details: "Failed login attempt for email: spam@external.io",
      when: daysAgo(8, 1),
      ip: "185.34.66.99",
      ua: "python-requests/2.31.0",
    },
    {
      email: "sara@waha.sa",
      action: "LOGIN_FAILED",
      details: "Invalid password (attempt #1)",
      when: daysAgo(11, 4),
      ip: IPS[2],
      ua: UAS[1],
    },
    {
      email: "sara@waha.sa",
      action: "LOGIN",
      details: "User sara@waha.sa logged in",
      when: daysAgo(11, 5),
      ip: IPS[2],
      ua: UAS[1],
    },
    {
      email: "sara@waha.sa",
      action: "VIEW_PASSWORD",
      details: "Viewed 'Datadog'",
      targetTitle: "Datadog",
      when: daysAgo(6, 2),
      ip: IPS[4],
      ua: UAS[1],
    },
    {
      email: "yousef@waha.sa",
      action: "PASSWORD_RESET_REQUEST",
      details: "Password reset requested for yousef@waha.sa",
      when: daysAgo(6, 5),
      ip: IPS[6],
      ua: UAS[0],
    },
    {
      email: "yousef@waha.sa",
      action: "PASSWORD_RESET_COMPLETE",
      details: "Password reset completed",
      when: daysAgo(6, 6),
      ip: IPS[6],
      ua: UAS[0],
    },
    {
      email: "yousef@waha.sa",
      action: "CHANGE_PASSWORD",
      details: "User changed their password after reset",
      when: daysAgo(6, 7),
      ip: IPS[6],
      ua: UAS[0],
    },
    {
      email: "sara@waha.sa",
      action: "UPDATE_CREDENTIAL",
      details: "Rotated Redis password after cache incident",
      targetTitle: "Redis (Production)",
      when: daysAgo(5, 1),
      ip: IPS[4],
      ua: UAS[1],
    },
    {
      email: "abdullah@waha.sa",
      action: "LOGIN",
      details: "First successful login for abdullah@waha.sa",
      when: daysAgo(5, 2),
      ip: IPS[1],
      ua: UAS[2],
    },
    {
      email: "yousef@waha.sa",
      action: "LOGIN_FAILED",
      details: "Suspected brute force — blocked by rate limiting (3 attempts)",
      when: daysAgo(2, 8),
      ip: "91.73.144.33",
      ua: "python-requests/2.31.0",
    },
    {
      email: superAdminEmail,
      action: "VIEW_PASSWORD",
      details: "Viewed 'AWS Console (Root)' during quarterly review",
      targetTitle: "AWS Console (Root)",
      when: daysAgo(3, 2),
      ip: IPS[0],
      ua: UAS[0],
    },
  );

  auditSeeds.sort((a, b) => a.when.getTime() - b.when.getTime());

  const auditRows = auditSeeds.map((entry) => ({
    userId: entry.email ? (userIds.get(entry.email) ?? null) : null,
    action: entry.action,
    targetId: entry.targetTitle
      ? (credIds.get(entry.targetTitle) ?? null)
      : null,
    details: entry.details,
    ipAddress: entry.ip,
    userAgent: entry.ua,
    timestamp: entry.when,
  }));

  await prisma.auditLog.createMany({ data: auditRows });
  console.log(`Seeded ${auditRows.length} audit log entries.`);

  const yousefId = requireId(userIds, "yousef@waha.sa");
  await prisma.failedLoginAttempt.createMany({
    data: [
      {
        email: "yousef@waha.sa",
        userId: yousefId,
        ipAddress: "91.73.144.33",
        userAgent: "python-requests/2.31.0",
        attemptedAt: daysAgo(2, 8),
      },
      {
        email: "yousef@waha.sa",
        userId: yousefId,
        ipAddress: "91.73.144.33",
        userAgent: "python-requests/2.31.0",
        attemptedAt: daysAgo(2, 9),
      },
      {
        email: "yousef@waha.sa",
        userId: yousefId,
        ipAddress: "91.73.144.33",
        userAgent: "python-requests/2.31.0",
        attemptedAt: daysAgo(2, 10),
      },
      {
        email: "spam@external.io",
        userId: null,
        ipAddress: "185.34.66.99",
        userAgent: "python-requests/2.31.0",
        attemptedAt: daysAgo(8, 1),
      },
    ],
  });
  console.log("Seeded failed login attempts (account takeover simulation).");

  console.log("\nSeeded team (login with these accounts):");
  for (const member of resolvedTeam) {
    console.log(
      `  ${member.title.padEnd(28)} ${member.email.padEnd(24)} ${userPasswords.get(member.email)}  [${member.role}]`,
    );
  }

  console.log(
    `\nSeed complete. ${resolvedTeam.length} users, ${credentials.length} credentials, ${auditRows.length} audit events.`,
  );
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
