import { Router, type IRouter } from "express";
import multer from "multer";
import { db, imagesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import {
  AddExternalImageBody,
  DeleteImageBody,
  FindImageParams,
  FindImageQueryParams,
  ListImagesResponse,
  GetImageStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

const IMAGES_SERVICE_URL = process.env["IMAGES_SERVICE_URL"]?.replace(/\/$/, "");

function serviceUrl(path: string): string {
  return `${IMAGES_SERVICE_URL}${path}`;
}

router.get("/images", async (_req, res): Promise<void> => {
  const rows = await db.select().from(imagesTable).orderBy(imagesTable.added);
  res.json(ListImagesResponse.parse(rows));
});

router.get("/images/stats", async (_req, res): Promise<void> => {
  const rows = await db
    .select({ status: imagesTable.status, count: sql<number>`count(*)::int` })
    .from(imagesTable)
    .groupBy(imagesTable.status);

  const counts: Record<string, number> = {};
  let total = 0;
  for (const row of rows) {
    counts[row.status.toLowerCase()] = row.count;
    total += row.count;
  }

  const stats = GetImageStatsResponse.parse({
    total,
    processed: counts["processed"] ?? 0,
    queued: counts["queued"] ?? 0,
    failed: counts["failed"] ?? 0,
    new: counts["new"] ?? 0,
    expired: counts["expired"] ?? 0,
  });

  res.json(stats);
});

router.post("/images/add", async (req, res): Promise<void> => {
  const parsed = AddExternalImageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Validation error", errors: [parsed.error.message] });
    return;
  }

  const { url, multiSize } = parsed.data;

  if (IMAGES_SERVICE_URL) {
    const upstream = await fetch(serviceUrl("/images/add"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, multiSize }),
    });

    const body = (await upstream.json()) as { id?: string };
    if (!upstream.ok || !body.id) {
      res.status(upstream.status).json(body);
      return;
    }

    await db.insert(imagesTable).values({
      id: body.id,
      sourceUrl: url,
      status: "QUEUED",
      multiSize,
    }).onConflictDoNothing();

    res.status(201).json({ id: body.id });
  } else {
    const id = crypto.randomUUID();
    await db.insert(imagesTable).values({
      id,
      sourceUrl: url,
      status: "NEW",
      multiSize,
    });
    res.status(201).json({ id });
  }
});

router.post("/images/upload", upload.single("file"), async (req, res): Promise<void> => {
  const file = req.file;
  const multiSizeRaw = req.body?.multiSize;
  const multiSize = multiSizeRaw === "true" || multiSizeRaw === true;

  if (!file) {
    res.status(400).json({ message: "No file provided" });
    return;
  }

  if (IMAGES_SERVICE_URL) {
    const fd = new FormData();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error — Node Buffer is Blob-compatible at runtime; TS strict ArrayBuffer/SharedArrayBuffer typing doesn't reflect this
    const blob = new Blob([file.buffer], { type: file.mimetype });
    fd.append("file", blob, file.originalname);
    fd.append("multiSize", String(multiSize));

    const upstream = await fetch(serviceUrl("/images/upload"), {
      method: "POST",
      body: fd,
    });

    const body = (await upstream.json()) as { id?: string };
    if (!upstream.ok || !body.id) {
      res.status(upstream.status).json(body);
      return;
    }

    await db.insert(imagesTable).values({
      id: body.id,
      contentType: file.mimetype,
      status: "QUEUED",
      multiSize,
    }).onConflictDoNothing();

    res.status(201).json({ id: body.id });
  } else {
    const id = crypto.randomUUID();
    await db.insert(imagesTable).values({
      id,
      contentType: file.mimetype,
      status: "NEW",
      multiSize,
    });
    res.status(201).json({ id });
  }
});

router.post("/images/delete", async (req, res): Promise<void> => {
  const parsed = DeleteImageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Validation error", errors: [parsed.error.message] });
    return;
  }

  const { id } = parsed.data;

  if (IMAGES_SERVICE_URL) {
    const upstream = await fetch(serviceUrl("/images/delete"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!upstream.ok) {
      const body = await upstream.text();
      res.status(upstream.status).json({ message: body });
      return;
    }
  }

  await db.delete(imagesTable).where(eq(imagesTable.id, id));
  res.json({ success: true });
});

router.get("/images/find/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = FindImageParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ message: "Invalid id" });
    return;
  }

  const queryParams = FindImageQueryParams.safeParse(req.query);
  const width = queryParams.success ? queryParams.data.width : undefined;
  const height = queryParams.success ? queryParams.data.height : undefined;

  if (!IMAGES_SERVICE_URL) {
    const [row] = await db.select({ sourceUrl: imagesTable.sourceUrl }).from(imagesTable).where(eq(imagesTable.id, params.data.id));
    if (row?.sourceUrl) {
      res.redirect(row.sourceUrl);
      return;
    }
    res.status(503).json({ message: "IMAGES_SERVICE_URL is not configured" });
    return;
  }

  const qs = new URLSearchParams();
  if (width != null) qs.set("width", String(width));
  if (height != null) qs.set("height", String(height));
  const qsStr = qs.toString();

  const upstreamUrl = serviceUrl(`/images/find/${params.data.id}${qsStr ? `?${qsStr}` : ""}`);
  const upstream = await fetch(upstreamUrl);

  if (!upstream.ok) {
    res.status(upstream.status).end();
    return;
  }

  const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
  res.setHeader("Content-Type", contentType);

  const buffer = await upstream.arrayBuffer();
  res.send(Buffer.from(buffer));
});

router.post("/images/webhook", async (req, res): Promise<void> => {
  const { type, meta } = req.body as { type?: string; meta?: { imageId?: string } };
  const imageId = meta?.imageId;

  if (imageId) {
    const newStatus = type === "IMAGE_READY" ? "PROCESSED" : type === "IMAGE_FAILED" ? "FAILED" : undefined;
    if (newStatus) {
      await db
        .update(imagesTable)
        .set({ status: newStatus, ...(newStatus === "PROCESSED" ? { processed: new Date() } : {}) })
        .where(eq(imagesTable.id, imageId));
    }
  }

  res.json({ ok: true });
});

export default router;
