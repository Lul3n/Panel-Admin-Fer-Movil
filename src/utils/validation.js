export function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

// Checks the image URL and the documents list.
// Returns { error, documents }: documents comes back trimmed, without empty rows.
export function validateAttachments(linkImg, documents) {
  if (linkImg && !isHttpsUrl(linkImg)) {
    return { error: "La URL de la imagen debe empezar con https://", documents: [] };
  }

  const cleaned = documents
    .map((d) => ({ name: d.name.trim(), url: d.url.trim() }))
    .filter((d) => d.name || d.url);

  for (const d of cleaned) {
    if (!d.name) {
      return { error: "Cada documento necesita un nombre", documents: [] };
    }
    if (!isHttpsUrl(d.url)) {
      return { error: `La URL de "${d.name}" debe empezar con https://`, documents: [] };
    }
  }

  return { error: "", documents: cleaned };
}

// Google Drive share links open a Drive page, not the image itself, so they
// cannot be used in <img>. This turns them into a direct image link.
// Other URLs are returned unchanged.
// "https://drive.google.com/file/d/ID/view?usp=sharing"
//   -> "https://drive.google.com/thumbnail?id=ID&sz=w1000"
export function driveImageUrl(value) {
  if (!value.includes("drive.google.com")) return value;
  const match = value.match(/\/d\/([\w-]+)/) || value.match(/[?&]id=([\w-]+)/);
  if (!match) return value;
  return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
}
