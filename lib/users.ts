export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  targetRole?: string;
  createdAt: string;
}

// Persist users in globalThis during dev HMR cycles
const globalForUsers = globalThis as unknown as {
  placementAiUsers?: Map<string, User>;
};

const usersStore: Map<string, User> =
  globalForUsers.placementAiUsers || new Map<string, User>();

if (!globalForUsers.placementAiUsers) {
  globalForUsers.placementAiUsers = usersStore;

  // Pre-seed default demo student user
  usersStore.set("student@placement.ai", {
    id: "usr_student_01",
    name: "Alex Rivera",
    email: "student@placement.ai",
    password: "password123",
    targetRole: "SDE-1 (Tier-1 Tech)",
    createdAt: new Date().toISOString(),
  });
}

export function findUserByEmail(email: string): User | undefined {
  if (!email) return undefined;
  return usersStore.get(email.toLowerCase().trim());
}

export function createUser(data: {
  name: string;
  email: string;
  password: string;
  targetRole?: string;
}): User {
  const normalizedEmail = data.email.toLowerCase().trim();

  if (usersStore.has(normalizedEmail)) {
    throw new Error("An account with this email address already exists.");
  }

  const newUser: User = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: data.name.trim(),
    email: normalizedEmail,
    password: data.password,
    targetRole: data.targetRole || "Software Development Engineer (SDE)",
    createdAt: new Date().toISOString(),
  };

  usersStore.set(normalizedEmail, newUser);
  return newUser;
}

export function verifyCredentials(email: string, password: string): User | null {
  const user = findUserByEmail(email);
  if (!user) return null;
  if (user.password !== password) return null;
  return user;
}
