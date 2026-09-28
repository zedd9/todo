/**
 * migrate-add-user-id.mjs
 *
 * Default (no flags): reports Todo documents written before the Todo API
 * required authentication, i.e. documents whose `userId` is missing or null.
 * Read-only, therefore idempotent: running it twice reports the same thing
 * and changes nothing.
 *
 * Pre-auth todos carry no trace of who created them, so this script never
 * GUESSES an owner on its own. But for a single-user app it's reasonable for
 * a human to explicitly say "these are mine" -- that's what --assign-to is
 * for: it requires the operator to name a real, already-registered GitHub
 * username, looks up that exact User, and only then sets userId on the
 * orphaned todos. Without --assign-to, nothing is ever written.
 *
 * Usage (MONGODB_URI must be set in the environment):
 *   node --env-file=.env.local scripts/migrate-add-user-id.mjs
 *   node --env-file=.env.local scripts/migrate-add-user-id.mjs --assign-to <githubUsername>
 *   MONGODB_URI="mongodb://..." node scripts/migrate-add-user-id.mjs --assign-to <githubUsername>
 */

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error(
    "Missing MONGODB_URI. Export it, or run:\n" +
      "  node --env-file=.env.local scripts/migrate-add-user-id.mjs"
  );
  process.exit(1);
}

function parseAssignTo(argv) {
  const eqArg = argv.find((a) => a.startsWith("--assign-to="));
  if (eqArg) return eqArg.slice("--assign-to=".length);
  const idx = argv.indexOf("--assign-to");
  if (idx !== -1 && argv[idx + 1]) return argv[idx + 1];
  return null;
}

const assignToUsername = parseAssignTo(process.argv.slice(2));

// Matched against the raw collection so the Mongoose schema's `required: true`
// on userId cannot hide the very documents we are looking for.
const ORPHAN_FILTER = { $or: [{ userId: { $exists: false } }, { userId: null }] };

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");

  try {
    const todos = mongoose.connection.collection("todos");
    const count = await todos.countDocuments(ORPHAN_FILTER);

    if (count === 0) {
      console.log("0 todos without a userId found, nothing to do.");
      return;
    }

    console.log(`${count} todo(s) without a userId found.`);

    const sample = await todos
      .find(ORPHAN_FILTER, { projection: { title: 1, status: 1, createdAt: 1 } })
      .limit(10)
      .toArray();
    console.log("Sample (up to 10):");
    for (const todo of sample) {
      console.log(
        `  _id=${todo._id} status=${todo.status ?? "-"} title=${JSON.stringify(todo.title ?? "")}`
      );
    }

    if (!assignToUsername) {
      console.warn(
        `WARNING: these ${count} todo(s) predate authentication and have no known owner.\n` +
          "They have NOT been modified or deleted, and NO owner was assigned: there is no\n" +
          "reliable way to tell who created them automatically. They remain in the database\n" +
          "but are invisible to every user through the authenticated API.\n" +
          "Re-run with --assign-to <githubUsername> to explicitly assign them to a real,\n" +
          "already-registered user (log in with GitHub once first to create that account)."
      );
      return;
    }

    const users = mongoose.connection.collection("users");
    const user = await users.findOne({ username: assignToUsername });
    if (!user) {
      console.error(
        `No User found with username "${assignToUsername}". Log in with GitHub once first ` +
          "so the account exists, then re-run this script."
      );
      process.exitCode = 1;
      return;
    }

    const result = await todos.updateMany(ORPHAN_FILTER, { $set: { userId: user._id } });
    console.log(
      `Assigned ${result.modifiedCount} todo(s) to user "${assignToUsername}" (userId=${user._id}).`
    );
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exitCode = 1;
});
