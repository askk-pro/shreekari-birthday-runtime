import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

const DATA_DIR = process.env.DATA_DIR || "/data";
const DATA_FILE = path.join(DATA_DIR, "plan.json");
const SEED_FILE = path.join(process.cwd(), "src", "data", "seed.json");

async function ensureState() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    const seed = await fs.readFile(SEED_FILE, "utf8");
    await fs.writeFile(DATA_FILE, seed, "utf8");
  }
}
export async function GET() {
  await ensureState();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  return NextResponse.json(JSON.parse(raw));
}

export async function PUT(request: Request) {
  await ensureState();
  const body = await request.json();
  body.meta = { ...(body.meta || {}), updatedAt: new Date().toISOString() };
  await fs.writeFile(DATA_FILE, JSON.stringify(body, null, 2), "utf8");
  return NextResponse.json({ ok: true, updatedAt: body.meta.updatedAt });
}
