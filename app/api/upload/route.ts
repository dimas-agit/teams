import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
// upload api vercel blob
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    console.log("BLOB TOKEN EXISTS:", !!process.env.BLOB_READ_WRITE_TOKEN);
console.log("OIDC EXISTS:", !!process.env.VERCEL_OIDC_TOKEN);
console.log(
  "BLOB TOKEN PREFIX:",
  process.env.BLOB_READ_WRITE_TOKEN?.substring(0, 15)
);
    const files = formData.getAll("files") as File[];
   console.log("FILES:", files.length);
    if (!files.length) {
      return NextResponse.json(
        { error: "No files uploaded" },
        { status: 400 }
      );
    }

    const urls: string[] = [];

    for (const file of files) {
      const extension = file.name.includes(".")
        ? "." + file.name.split(".").pop()
        : "";

      const fileName = `${crypto.randomUUID()}${extension}`;

      const blob = await put(
        `uploads/${fileName}`,
        file,
        {
          access: "private",
          token: process.env.BLOB_READ_WRITE_TOKEN,
        }
      );

       console.log("Blob uploaded:", blob.url);
      urls.push(blob.url);
    }

    return NextResponse.json({
      urls,
    });
  } catch (err) {
    console.error("=== UPLOAD ERROR ===", err);

    return NextResponse.json(
      {
        error: "Failed to upload files"+err,
      },
      {
        status: 500,
      }
    );
  }
}
