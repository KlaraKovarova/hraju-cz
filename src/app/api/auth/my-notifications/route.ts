import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/user-auth";
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationsRead,
} from "@/lib/notifications";

// GET /api/auth/my-notifications — list notifications with unread count
export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const [notifications, unreadCount] = await Promise.all([
    getUserNotifications(session.userId),
    getUnreadNotificationCount(session.userId),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

// POST /api/auth/my-notifications — mark all notifications as read
export async function POST() {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await markNotificationsRead(session.userId);
  return NextResponse.json({ ok: true });
}
