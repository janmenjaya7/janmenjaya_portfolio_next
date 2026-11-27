import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_RESUME_BYTES, formatBytes, looksLikePdf, safeResumeName, validateResume } from "./resume-validation.ts";

const PDF_HEAD = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]); // "%PDF-1.7"
const PNG_HEAD = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d]);

test("looksLikePdf checks the real file signature", () => {
  assert.equal(looksLikePdf(PDF_HEAD), true);
  assert.equal(looksLikePdf(PNG_HEAD), false);
  assert.equal(looksLikePdf(new Uint8Array([0x25, 0x50])), false, "too short");
  assert.equal(looksLikePdf(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x58])), false, '"%PDFX" — every signature byte matters');
  assert.equal(looksLikePdf(null), false);
  assert.equal(looksLikePdf(undefined), false);
});

test("validateResume accepts a normal PDF", () => {
  assert.deepEqual(validateResume({ name: "Resume.pdf", type: "application/pdf", size: 100_037, head: PDF_HEAD }), { ok: true });
  assert.deepEqual(validateResume({ name: "CV.PDF", type: "", size: 2048 }), { ok: true }, "some browsers send an empty type");
});

test("validateResume boundary: exactly the limit passes, one byte over fails", () => {
  assert.equal(validateResume({ name: "a.pdf", type: "application/pdf", size: MAX_RESUME_BYTES }).ok, true);
  const over = validateResume({ name: "a.pdf", type: "application/pdf", size: MAX_RESUME_BYTES + 1 });
  assert.equal(over.ok, false);
  assert.match((over as { error: string }).error, /under 600 KB/);
});

test("validateResume rejects wrong, empty or disguised files with friendly messages", () => {
  const cases: Array<[Parameters<typeof validateResume>[0], RegExp]> = [
    [{ name: "", type: "application/pdf", size: 10 }, /choose a PDF/],
    [{ name: "a.pdf", type: "application/pdf", size: 0 }, /empty/],
    [{ name: "a.pdf", type: "application/pdf", size: Number.NaN }, /empty/],
    [{ name: "photo.png", type: "image/png", size: 10 }, /Only PDF/],
    [{ name: "resume.docx", type: "application/pdf", size: 10 }, /Only PDF/],
    [{ name: "resume.pdf", type: "image/png", size: 10 }, /Only PDF/],
    [{ name: "renamed.pdf", type: "application/pdf", size: 10, head: PNG_HEAD }, /valid PDF/],
  ];
  for (const [input, msg] of cases) {
    const r = validateResume(input);
    assert.equal(r.ok, false, JSON.stringify(input));
    assert.match((r as { error: string }).error, msg);
  }
});

test("safeResumeName strips unsafe characters and keeps .pdf", () => {
  assert.equal(safeResumeName("ATS_Friendly_Resume_Janmenjaya_Biswal (1).pdf"), "ATS_Friendly_Resume_Janmenjaya_Biswal_1.pdf");
  assert.equal(safeResumeName('../../etc/"passwd"'), "etc_passwd.pdf");
  assert.equal(safeResumeName("   "), "Resume.pdf");
  assert.equal(safeResumeName(undefined), "Resume.pdf");
  assert.ok(safeResumeName("x".repeat(300) + ".pdf").length <= 84);
});

test("formatBytes", () => {
  assert.equal(formatBytes(512), "512 B");
  assert.equal(formatBytes(100_037), "98 KB");
  assert.equal(formatBytes(2 * 1024 * 1024), "2.0 MB");
  assert.equal(formatBytes(-1), "—");
});
