import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import React from "react";
import { eq } from "drizzle-orm";

export default async function EmployeeDashboardLayout({
  children,
}: { 
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Ensure user exists in DB and sync minimal fields/role from Clerk
  const clerk = await currentUser();
  const email = clerk?.emailAddresses?.[0]?.emailAddress ?? null;
  const name = clerk?.firstName || clerk?.username || email || null;

  let user = await db.query.users.findFirst({ where: eq(users.clerkId, userId) });
  if (!user) {
    await db.insert(users).values({
      id: userId, // use Clerk id to avoid mismatch for SSR layout; app code uses nanoid but here stability matters
      clerkId: userId,
      email: email ?? `${userId}@unknown.local`,
      name: name ?? 'Käyttäjä',
      role: (clerk?.publicMetadata as any)?.role === 'ADMIN' || (clerk?.publicMetadata as any)?.role === 'EMPLOYEE' ? (clerk?.publicMetadata as any).role as string : 'CUSTOMER',
    }).onConflictDoNothing();
    user = await db.query.users.findFirst({ where: eq(users.clerkId, userId) });
  } else {
    const newRole = (clerk?.publicMetadata as any)?.role as string | undefined;
    const shouldUpdate = (email && email !== user.email) || (name && name !== user.name) || (newRole && newRole !== user.role);
    if (shouldUpdate) {
      await db.update(users).set({
        email: email ?? user.email,
        name: name ?? user.name,
        role: newRole ?? user.role,
      }).where(eq(users.id, user.id));
      user = await db.query.users.findFirst({ where: eq(users.clerkId, userId) });
    }
  }

  if (!user || (user.role !== "EMPLOYEE" && user.role !== "ADMIN")) {
    redirect("/"); // Redirect non-employees/admins
  }

  return <>{children}</>;
}