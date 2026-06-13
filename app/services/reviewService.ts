import { eq, and, sql, inArray } from "drizzle-orm";
import { db } from "~/db";
import { courseReviews } from "~/db/schema";

// ─── Review Service ───
// Handles star rating upserts, stats, and retrieval.
// One rating per user per course (unique constraint). Ratings are 1-5.

export function upsertCourseRating(
  userId: number,
  courseId: number,
  rating: number
) {
  // Delete existing rating if any, then insert — effectively an upsert
  const existing = db
    .select()
    .from(courseReviews)
    .where(
      and(
        eq(courseReviews.userId, userId),
        eq(courseReviews.courseId, courseId)
      )
    )
    .get();

  if (existing) {
    return db
      .update(courseReviews)
      .set({ rating, createdAt: new Date().toISOString() })
      .where(eq(courseReviews.id, existing.id))
      .returning()
      .get();
  }

  return db
    .insert(courseReviews)
    .values({ userId, courseId, rating })
    .returning()
    .get();
}

export function getCourseRatingStats(courseId: number) {
  const result = db
    .select({
      averageRating: sql<number>`ROUND(AVG(${courseReviews.rating}), 1)`,
      reviewCount: sql<number>`COUNT(*)`,
    })
    .from(courseReviews)
    .where(eq(courseReviews.courseId, courseId))
    .get();

  return {
    averageRating: result?.averageRating ?? null,
    reviewCount: result?.reviewCount ?? 0,
  };
}

export function getCourseRatingStatsBatch(courseIds: number[]) {
  if (courseIds.length === 0) return new Map<number, { averageRating: number | null; reviewCount: number }>();

  const results = db
    .select({
      courseId: courseReviews.courseId,
      averageRating: sql<number>`ROUND(AVG(${courseReviews.rating}), 1)`,
      reviewCount: sql<number>`COUNT(*)`,
    })
    .from(courseReviews)
    .where(inArray(courseReviews.courseId, courseIds))
    .groupBy(courseReviews.courseId)
    .all();

  const map = new Map<number, { averageRating: number | null; reviewCount: number }>();

  // Initialize all requested course IDs with null/0 defaults
  for (const id of courseIds) {
    map.set(id, { averageRating: null, reviewCount: 0 });
  }

  // Override with actual data where available
  for (const row of results) {
    map.set(row.courseId, {
      averageRating: row.averageRating,
      reviewCount: row.reviewCount,
    });
  }

  return map;
}

export function getUserRating(userId: number, courseId: number) {
  return db
    .select({ rating: courseReviews.rating })
    .from(courseReviews)
    .where(
      and(
        eq(courseReviews.userId, userId),
        eq(courseReviews.courseId, courseId)
      )
    )
    .get()
    ?.rating ?? null;
}
