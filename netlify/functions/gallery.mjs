import { getStore } from "@netlify/blobs";
import { timingSafeEqual } from "node:crypto";

const galleryStore = getStore("mi25r1-class-gallery");
const responseHeaders = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8"
};

function jsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: responseHeaders });
}

function passwordsMatch(provided, expected) {
  const providedBytes = Buffer.from(provided);
  const expectedBytes = Buffer.from(expected);
  return providedBytes.length === expectedBytes.length && timingSafeEqual(providedBytes, expectedBytes);
}

function isValidPhoto(photo) {
  if (!photo || typeof photo !== "object") return false;
  const isAsset = typeof photo.src === "string" && /^assets\/[a-z0-9 _().-]+\.(?:jpe?g|png|webp)$/i.test(photo.src);
  const isImageData = typeof photo.src === "string" && /^data:image\/(?:jpeg|png|webp);base64,/i.test(photo.src);
  return isAsset || isImageData;
}

export default async function gallery(request) {
  try {
    if (request.method === "GET") {
      const photos = await galleryStore.get("photos", { type: "json", consistency: "strong" });
      return jsonResponse({ photos });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed." }, 405);
    }

    const expectedPassword = process.env.GALLERY_ADMIN_PASSWORD;
    if (!expectedPassword) {
      return jsonResponse({ error: "Admin galeri belum dikonfigurasi di Netlify." }, 503);
    }

    const authorization = request.headers.get("authorization") || "";
    const providedPassword = authorization.replace(/^Bearer\s+/i, "");
    if (!passwordsMatch(providedPassword, expectedPassword)) {
      return jsonResponse({ error: "Password admin salah." }, 401);
    }

    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 5 * 1024 * 1024) {
      return jsonResponse({ error: "Ukuran galeri terlalu besar. Kurangi jumlah foto." }, 413);
    }

    let payload;
    try {
      payload = await request.json();
    } catch (error) {
      return jsonResponse({ error: "Data galeri tidak valid." }, 400);
    }

    if (payload.action === "verify") return jsonResponse({ ok: true });

    if (!Array.isArray(payload.photos) || payload.photos.length > 60) {
      return jsonResponse({ error: "Daftar foto tidak valid." }, 400);
    }

    const validPhotos = payload.photos.every((photo) => (
      isValidPhoto(photo) &&
      [photo.alt, photo.title, photo.caption].every((text) => typeof text === "string") &&
      photo.alt.length <= 240 && photo.title.length <= 240 && photo.caption.length <= 1200
    ));

    if (!validPhotos) return jsonResponse({ error: "Data foto tidak valid." }, 400);

    await galleryStore.setJSON("photos", payload.photos);
    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse({ error: "Penyimpanan galeri sedang bermasalah." }, 500);
  }
}