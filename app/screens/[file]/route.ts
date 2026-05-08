import { readFile } from "node:fs/promises";
import path from "node:path";

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

type RouteContext = {
  params: Promise<{
    file: string;
  }>;
};

export async function GET(_: Request, context: RouteContext) {
  const { file } = await context.params;
  const normalizedFile = path.basename(file);
  const extension = path.extname(normalizedFile).toLowerCase();
  const contentType = MIME_TYPES[extension];

  if (!contentType || normalizedFile !== file) {
    return new Response("Not found", { status: 404 });
  }

  const imagePath = path.join(process.cwd(), "static", "screens", normalizedFile);

  try {
    const imageBuffer = await readFile(imagePath);

    return new Response(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store, max-age=0, must-revalidate",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
