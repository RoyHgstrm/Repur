import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import type React from "react";
import { eq } from "drizzle-orm";

interface PublicMetadata { // Define interface for publicMetadata
  role?: string; // Specify the expected role property
}

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

	let user = await db.query.users.findFirst({
		where: eq(users.clerkId, userId),
	});
	if (!user) {
		await db
			.insert(users)
			.values({
				id: userId, // use Clerk id to avoid mismatch for SSR layout; app code uses nanoid but here stability matters
				clerkId: userId,
				email: email ?? `${userId}@unknown.local`,
				name: name ?? "Käyttäjä",
				role:
					(clerk?.publicMetadata as PublicMetadata)?.role === "ADMIN" || // Use PublicMetadata interface
					(clerk?.publicMetadata as PublicMetadata)?.role === "EMPLOYEE"
						? ((clerk?.publicMetadata as PublicMetadata).role as string) // Use PublicMetadata interface
						: "CUSTOMER",
			})
			.onConflictDoNothing();
		user = await db.query.users.findFirst({ where: eq(users.clerkId, userId) });
	} else {
		const newRole = (clerk?.publicMetadata as PublicMetadata)?.role as string | undefined; // Use PublicMetadata interface
		const shouldUpdate =
			(email && email !== user.email) ||
			(name && name !== user.name) ||
			(newRole && newRole !== user.role);
		if (shouldUpdate) {
			await db
				.update(users)
				.set({
					email: email ?? user.email,
					name: name ?? user.name,
					role: newRole ?? user.role,
				})
				.where(eq(users.id, user.id));
			user = await db.query.users.findFirst({
				where: eq(users.clerkId, userId),
			});
		}
	}

	if (!user || (user.role !== "EMPLOYEE" && user.role !== "ADMIN")) {
		redirect("/"); // Redirect non-employees/admins
	}

	return (
		<div className="container mx-auto px-container py-section">{children}</div>
	);
}
