import { NextResponse } from "next/server";
import mongoose from "mongoose";

/**
 * Shared error handler for API route catch blocks. Returns a 400 for
 * malformed JSON bodies (SyntaxError from request.json()) and for Mongoose
 * validation errors (e.g. an invalid enum value), and falls back to a 500
 * with the given message for anything else.
 */
export function handleApiError(error: unknown, fallbackMessage: string) {
  if (error instanceof SyntaxError) {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  console.error(error);
  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}
