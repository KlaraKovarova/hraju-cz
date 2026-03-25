import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

/**
 * Get or create an unsubscribe token for a user.
 * Returns the token string for use in unsubscribe links.
 */
export async function getUnsubscribeToken(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { unsubscribeToken: true },
  });

  if (user?.unsubscribeToken) {
    return user.unsubscribeToken;
  }

  const token = randomBytes(32).toString("hex");
  await prisma.user.update({
    where: { id: userId },
    data: { unsubscribeToken: token },
  });
  return token;
}

/**
 * Build an unsubscribe URL for a given user and notification type.
 */
export function buildUnsubscribeUrl(
  token: string,
  type: "all" | "digest"
): string {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "https://www.hraju.cz";
  return `${base}/api/unsubscribe?token=${token}&type=${type}`;
}

/**
 * Find users who should be notified about a new review on a facility.
 * Returns users who have checked in, reviewed, or favorited the same facility,
 * excluding the review author and seed users.
 */
export async function findUsersToNotifyAboutReview(
  facilityId: string,
  excludeUserId: string
): Promise<Array<{ id: string; email: string; name: string | null }>> {
  // Get users who checked in to this facility
  const visitUsers = await prisma.visit.findMany({
    where: { facilityId, userId: { not: excludeUserId } },
    select: { userId: true },
  });

  // Get users who reviewed this facility (approved reviews only)
  const reviewUsers = await prisma.review.findMany({
    where: {
      facilityId,
      userId: { not: null },
      isApproved: true,
    },
    select: { userId: true },
    distinct: ["userId"],
  });

  // Get users who favorited this facility
  const favoriteUsers = await prisma.favorite.findMany({
    where: { facilityId, userId: { not: excludeUserId } },
    select: { userId: true },
  });

  // Combine and deduplicate user IDs
  const userIds = [
    ...new Set([
      ...visitUsers.map((v) => v.userId),
      ...reviewUsers.filter((r) => r.userId !== null).map((r) => r.userId!),
      ...favoriteUsers.map((f) => f.userId),
    ]),
  ].filter((id) => id !== excludeUserId);

  if (userIds.length === 0) return [];

  // Fetch users who have notifications enabled and are not seed users
  return prisma.user.findMany({
    where: {
      id: { in: userIds },
      emailNotifications: true,
      isSeed: false,
    },
    select: { id: true, email: true, name: true },
  });
}

/**
 * Create in-app notifications for all users who favorited a facility.
 * Excludes the actor (the user who performed the action) and seed users.
 */
export async function createFavoriteNotifications(
  facilityId: string,
  excludeUserId: string,
  type: "review" | "checkin",
  actorName: string | null
): Promise<number> {
  const favoriteUsers = await prisma.favorite.findMany({
    where: {
      facilityId,
      userId: { not: excludeUserId },
      user: { isSeed: false, emailNotifications: true },
    },
    select: { userId: true },
  });

  if (favoriteUsers.length === 0) return 0;

  const result = await prisma.favoriteNotification.createMany({
    data: favoriteUsers.map((f) => ({
      userId: f.userId,
      facilityId,
      type,
      actorName,
    })),
  });

  return result.count;
}

/**
 * Get unread notification count for a user.
 */
export async function getUnreadNotificationCount(
  userId: string
): Promise<number> {
  return prisma.favoriteNotification.count({
    where: { userId, isRead: false },
  });
}

/**
 * Get recent notifications for a user.
 */
export async function getUserNotifications(
  userId: string,
  limit = 20
): Promise<
  Array<{
    id: string;
    type: string;
    actorName: string | null;
    isRead: boolean;
    createdAt: Date;
    facility: { name: string; slug: string; sports: { sport: { slug: string } }[] };
  }>
> {
  return prisma.favoriteNotification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      type: true,
      actorName: true,
      isRead: true,
      createdAt: true,
      facility: {
        select: {
          name: true,
          slug: true,
          sports: { select: { sport: { select: { slug: true } } }, take: 1 },
        },
      },
    },
  });
}

/**
 * Mark notifications as read for a user.
 */
export async function markNotificationsRead(userId: string): Promise<void> {
  await prisma.favoriteNotification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}
