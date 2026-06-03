import { NextResponse } from 'next/server';

export async function GET() {
  const configured = !!(process.env.IMAP_USER && process.env.IMAP_PASS);
  return NextResponse.json({
    configured,
    user: process.env.IMAP_USER ? process.env.IMAP_USER.replace(/(.{2}).*(@.*)/, '$1***$2') : null,
    pinSet: !!process.env.APP_PIN,
  });
}
