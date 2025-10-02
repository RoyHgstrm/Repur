"use client";

import Link from "next/link";
import { Home, Package, LifeBuoy } from "lucide-react";
import { cn } from "~/lib/utils";

interface SidebarLinkProps {
	href: string;
	icon: React.ReactNode;
	children: React.ReactNode;
	isActive?: boolean;
}

const SidebarLink = ({ href, icon, children, isActive }: SidebarLinkProps) => (
	<Link
		href={href}
		className={cn(
			"flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-all duration-200",
			"hover:bg-[var(--color-surface-3)] hover:text-[var(--color-primary)]",
			isActive
				? "bg-[var(--color-surface-3)] text-[var(--color-primary)]"
				: "text-[var(--color-neutral)]/80",
		)}
	>
		{icon}
		{children}
	</Link>
);

export default function Sidebar() {
	return (
		<aside className="sticky top-24 h-[calc(100vh-theme(spacing.24))] overflow-y-auto bg-gradient-to-br from-surface-2 to-surface-3 border-[var(--color-border-light)] shadow-xl rounded-xl p-6">
			<nav className="space-y-4">
				<SidebarLink href="/osta" icon={<Home className="h-5 w-5" />}>
					Osta Tietokone
				</SidebarLink>
				<SidebarLink href="/myy" icon={<Package className="h-5 w-5" />}>
					Myy Koneesi
				</SidebarLink>
				<SidebarLink href="/tuki" icon={<LifeBuoy className="h-5 w-5" />}>
					Asiakastuki
				</SidebarLink>
			</nav>
		</aside>
	);
}
