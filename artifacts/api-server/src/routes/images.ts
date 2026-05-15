import { Router, type IRouter } from "express";
import multer from "multer";
import { store } from "../lib/store";
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

router.get("/images", (_req, res): void => {
  res.json(ListImagesResponse.parse(store.listImages()));
});

router.get("/images/stats", (_req, res): void => {
  const rows = store.getStats();
  const counts: Record<string, number> = {};
  let total = 0;
  for (const row of rows) {
    counts[row.status.toLowerCase()] = row.count;
    total += row.count;
  }
  res.json(GetImageStatsResponse.parse({
    total,
    processed: counts["processed"] ?? 0,
    queued: counts["queued"] ?? 0,
    failed: counts["failed"] ?? 0,
    new: counts["new"] ?? 0,
    expired: counts["expired"] ?? 0,
  }));
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
    if (!upstream.ok || !body.id) { res.status(upstream.status).json(body); return; }
    store.upsertImage({ id: body.id, sourceUrl: url, status: "QUEUED", multiSize });
    res.status(201).json({ id: body.id });
  } else {
    const id = crypto.randomUUID();
    store.insertImage({ id, sourceUrl: url, status: "NEW", multiSize });
    res.status(201).json({ id });
  }
});

router.post("/images/upload", upload.single("file"), async (req, res): Promise<void> => {
  const file = req.file;
  const multiSizeRaw = req.body?.multiSize;
  const multiSize = multiSizeRaw === "true" || multiSizeRaw === true;

  if (!file) { res.status(400).json({ message: "No file provided" }); return; }

  if (IMAGES_SERVICE_URL) {
    const fd = new FormData();
    // @ts-expect-error — Node Buffer is Blob-compatible at runtime
    fd.append("file", new Blob([file.buffer], { type: file.mimetype }), file.originalname);
    fd.append("multiSize", String(multiSize));
    const upstream = await fetch(serviceUrl("/images/upload"), { method: "POST", body: fd });
    const body = (await upstream.json()) as { id?: string };
    if (!upstream.ok || !body.id) { res.status(upstream.status).json(body); return; }
    store.upsertImage({ id: body.id, contentType: file.mimetype, status: "QUEUED", multiSize });
    res.status(201).json({ id: body.id });
  } else {
    const id = crypto.randomUUID();
    store.insertImage({ id, contentType: file.mimetype, status: "NEW", multiSize });
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
    if (!upstream.ok) { res.status(upstream.status).json({ message: await upstream.text() }); return; }
  }

  store.deleteImage(id);
  res.json({ success: true });
});

router.get("/images/find/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = FindImageParams.safeParse({ id: rawId });
  if (!params.success) { res.status(400).json({ message: "Invalid id" }); return; }

  const queryParams = FindImageQueryParams.safeParse(req.query);
  const width = queryParams.success ? queryParams.data.width : undefined;
  const height = queryParams.success ? queryParams.data.height : undefined;

  if (!IMAGES_SERVICE_URL) {
    const row = store.findImageById(params.data.id);
    if (row?.sourceUrl) { res.redirect(row.sourceUrl); return; }
    res.status(503).json({ message: "IMAGES_SERVICE_URL is not configured" });
    return;
  }

  const qs = new URLSearchParams();
  if (width != null) qs.set("width", String(width));
  if (height != null) qs.set("height", String(height));
  const qsStr = qs.toString();

  const upstream = await fetch(serviceUrl(`/images/find/${params.data.id}${qsStr ? `?${qsStr}` : ""}`));
  if (!upstream.ok) { res.status(upstream.status).end(); return; }

  res.setHeader("Content-Type", upstream.headers.get("content-type") ?? "application/octet-stream");
  res.send(Buffer.from(await upstream.arrayBuffer()));
});

router.post("/images/webhook", (req, res): void => {
  const { type, meta } = req.body as { type?: string; meta?: { imageId?: string } };
  const imageId = meta?.imageId;

  if (imageId) {
    const newStatus =
      type === "IMAGE_READY" ? "PROCESSED" : type === "IMAGE_FAILED" ? "FAILED" : undefined;
    if (newStatus) {
      store.updateImage(imageId, {
        status: newStatus,
        ...(newStatus === "PROCESSED" ? { processed: new Date() } : {}),
      });
    }
  }

  res.json({ ok: true });
});

export default router;
