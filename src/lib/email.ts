import type { Decimal } from "decimal.js";

interface PurchaseConfirmationEmailProps {
	recipientEmail: string;
	purchaseId: string;
	productName: string;
	totalAmount: Decimal;
}

// HOW: Placeholder for sending a purchase confirmation email.
// WHY: This function will eventually be implemented to send transactional emails to users after a successful purchase.
export async function sendPurchaseConfirmationEmail(props: PurchaseConfirmationEmailProps) {
	console.log(`[Email Service] Sending purchase confirmation to ${props.recipientEmail} for purchase ${props.purchaseId}`);
	// TODO: Implement actual email sending logic using a service like Resend, Nodemailer, etc.
	// For now, it just logs the action.
}
