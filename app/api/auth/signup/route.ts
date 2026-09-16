import { NextResponse } from "next/server";
import { createUser, findUserByEmail } from "@/lib/users";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, targetRole } = body;

    // Validation
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Full name is required." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    // Check duplicate
    const existing = findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email address already exists. Please log in instead." },
        { status: 409 }
      );
    }

    // Create user
    const newUser = createUser({
      name,
      email,
      password,
      targetRole: targetRole || "Software Development Engineer (SDE)",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully.",
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          targetRole: newUser.targetRole,
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "An unexpected registration error occurred.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
