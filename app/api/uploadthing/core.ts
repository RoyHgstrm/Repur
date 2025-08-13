import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

// Replace with real auth if needed. We already have Clerk; keep lightweight here.
const auth = async (_req: Request) => ({ id: "public" });

export const ourFileRouter = {
  imageUploader: f({
    image: { maxFileSize: "8MB", maxFileCount: 10 },
  })
    .middleware(async ({ req }) => {
      const user = await auth(req);
      if (!user) throw new UploadThingError("Unauthorized");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Return the public URL; component will store this in listing.images
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;


