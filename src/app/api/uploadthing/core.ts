import { createUploadthing, type FileRouter } from "uploadthing/next";
import { adminAuth } from "@/lib/firebase/firebase-admin";

const f = createUploadthing();

/**
 * Authentication function for UploadThing
 * Verifies Firebase ID token from Authorization header
 */
const auth = async (req: Request) => {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
        ? authHeader.substring(7)
        : null;

    if (!token || !adminAuth) {
        throw new Error("Unauthorized");
    }

    try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        return {
            uid: decodedToken.uid,
            email: decodedToken.email,
            role: decodedToken.role,
        };
    } catch (error) {
        throw new Error("Invalid token");
    }
};

/**
 * UploadThing File Router
 * Define file upload endpoints with authentication and validation
 */
export const ourFileRouter = {
    // Image uploader for profile pictures, case images, etc.
    imageUploader: f({
        image: {
            maxFileSize: "4MB",
            maxFileCount: 1,
        },
    })
        .middleware(async ({ req }) => {
            const user = await auth(req);
            return { userId: user.uid, uploadedBy: user.email };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Image upload complete for user:", metadata.userId);
            console.log("File URL:", file.url);

            // Return data to client
            return {
                uploadedBy: metadata.uploadedBy,
                fileUrl: file.url,
            };
        }),

    // Document uploader for case documents (PDFs, images, etc.)
    documentUploader: f({
        pdf: { maxFileSize: "16MB", maxFileCount: 5 },
        image: { maxFileSize: "8MB", maxFileCount: 10 },
        "application/msword": { maxFileSize: "16MB", maxFileCount: 5 },
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            { maxFileSize: "16MB", maxFileCount: 5 },
    })
        .middleware(async ({ req }) => {
            const user = await auth(req);
            return { userId: user.uid, uploadedBy: user.email };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Document upload complete for user:", metadata.userId);
            console.log("File URL:", file.url);

            // You can save document metadata to database here
            // await prisma.document.create({
            //     data: {
            //         userId: metadata.userId,
            //         fileUrl: file.url,
            //         fileName: file.name,
            //         fileSize: file.size,
            //     },
            // });

            return {
                uploadedBy: metadata.uploadedBy,
                fileUrl: file.url,
                fileName: file.name,
            };
        }),

    // Message attachment uploader (for chat)
    messageAttachment: f({
        image: { maxFileSize: "4MB", maxFileCount: 3 },
        pdf: { maxFileSize: "8MB", maxFileCount: 3 },
    })
        .middleware(async ({ req }) => {
            const user = await auth(req);
            return { userId: user.uid, uploadedBy: user.email };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Message attachment uploaded by:", metadata.userId);

            return {
                uploadedBy: metadata.uploadedBy,
                fileUrl: file.url,
                fileName: file.name,
                fileSize: file.size,
            };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

