// Clears all interview activity so analytics reflect only real usage.
// Keeps the problem bank and user accounts; removes sessions (and their
// messages / code / evaluations via cascade) and any AI-generated problems.
//
// Run with:  npm run db:reset

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const sessions = await prisma.session.deleteMany({}); // cascades to messages, snapshots, evaluations
  const generated = await prisma.problem.deleteMany({ where: { generated: true } });
  console.log(`Cleared ${sessions.count} session(s) and ${generated.count} AI-generated problem(s).`);
  console.log("Analytics now reflect only interviews you create from here on.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
