import { db } from "~/server/db";
import { listings, users, listingStatusEnum } from "~/server/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Seeding database with test data...");

  // Create or update a test user
  const clerkUserId = 'user_30sEy9MoeX9io3GioXz9GZ7tkjU';
  const internalUserId = 'user_test_id_clerk';

  let testUser = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkUserId),
  });

  if (!testUser) {
    // If user doesn't exist, create it
    [testUser] = await db.insert(users).values({
      id: internalUserId,
      clerkId: clerkUserId,
      email: 'test@example.com',
      name: 'Test User',
      role: 'CUSTOMER',
    }).returning();
    console.log(`Created new test user: ${testUser?.email} (ID: ${testUser?.id}, ClerkID: ${testUser?.clerkId})`);
  } else {
    // If user exists, ensure its ID and ClerkID are consistent (update if necessary)
    if (testUser.id !== internalUserId || testUser.clerkId !== clerkUserId) {
      [testUser] = await db.update(users).set({
        id: internalUserId,
        clerkId: clerkUserId,
      }).where(eq(users.clerkId, clerkUserId)).returning();
      console.log(`Updated existing test user: ${testUser?.email} (ID: ${testUser?.id}, ClerkID: ${testUser?.clerkId})`);
    }
    console.log(`Found existing test user: ${testUser.email} (ID: ${testUser.id}, ClerkID: ${testUser.clerkId})`);
  }

  if (!testUser) {
    throw new Error("Failed to create or retrieve test user.");
  }

  // Create or update a test listing for the user
  const testListingId = 'test_listing_1';
  let testListing = await db.query.listings.findFirst({
    where: eq(listings.id, testListingId),
  });

  if (!testListing) {
    // If listing doesn't exist, create it
    [testListing] = await db.insert(listings).values({
      id: testListingId,
      title: 'Test Gaming PC',
      description: 'A powerful gaming PC for testing.',
      status: listingStatusEnum.enumValues[1], // 'ACTIVE'
      cpu: 'Intel Core i7',
      gpu: 'NVIDIA GeForce RTX 3080',
      ram: '16GB DDR4',
      storage: '1TB NVMe SSD',
      motherboard: 'ASUS ROG Strix Z490-E',
      powerSupply: '750W 80+ Gold',
      caseModel: 'Lian Li O11 Dynamic',
      basePrice: "1200.00", // Ensure this is a string for numeric type
      condition: 'Kuin uusi',
      images: [],
      sellerId: internalUserId, // Link to the created test user's internal ID
    }).returning();
    console.log(`Created new test listing: ${testListing?.title} (ID: ${testListing?.id}, SellerID: ${testListing?.sellerId}, Status: ${testListing?.status})`);
  } else {
    // If listing exists, update its status to ACTIVE if not already
    if (testListing.status !== listingStatusEnum.enumValues[1]) {
      [testListing] = await db.update(listings).set({
        status: listingStatusEnum.enumValues[1], // 'ACTIVE'
        sellerId: internalUserId, // Ensure sellerId is correct
      }).where(eq(listings.id, testListingId)).returning();
      console.log(`Updated existing test listing: ${testListing?.title} (ID: ${testListing?.id}, Status: ${testListing?.status})`);
    }
    console.log(`Found existing test listing: ${testListing.title} (ID: ${testListing.id}, Status: ${testListing.status})`);
  }

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });