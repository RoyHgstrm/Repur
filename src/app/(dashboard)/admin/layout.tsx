import { auth } from "@clerk/nextjs/server";
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

  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
  });

  if (!user || (user.role !== "EMPLOYEE" && user.role !== "ADMIN")) {
    redirect("/"); // Redirect non-employees/admins
  }

  return <>{children}</>;
}