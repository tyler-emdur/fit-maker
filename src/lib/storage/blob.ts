import { put } from "@vercel/blob";

export async function uploadItemImage(file: File) {
  const path = `closet/${Date.now()}-${file.name.replaceAll(" ", "-")}`;
  const blob = await put(path, file, {
    access: "public",
    addRandomSuffix: true,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  return blob.url;
}

