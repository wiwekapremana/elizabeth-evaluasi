/**
 * Elizabeth Evaluasi - Google Apps Script backend (V15)
 *
 * Perubahan V15:
 * - Sheet "Instruktur" punya kolom baru "Jurusan" (dibuat otomatis).
 *   Isi: daftar jurusan dipisah koma, atau "SEMUA" untuk semua jurusan.
 *   Jika "Jurusan" kosong, kolom lama "Group" tetap dipakai (fnb_bar, GLOBAL, dst).
 * - Aksi admin (butuh PIN): adminLogin, adminList, adminSave, adminDelete.
 *   PIN disimpan di Project Settings > Script Properties dengan nama ADMIN_PIN.
 */

const STUDENT_SHEET = "Mahasiswa";
const INSTRUCTOR_SHEET = "Instruktur";
const EVALUATION_SHEET = "Evaluasi Instruktur 2026";

const INSTRUCTOR_CACHE_KEY = "elizabeth_instructors_v15";
const ALL_MAJORS = "SEMUA";
const PLACEHOLDER_PHOTO = "https://placehold.co/900x675?text=Elizabeth+International";

const MAJORS = [
  "Food & Beverage Service",
  "Bar & Mixology",
  "Culinary",
  "Pastry & Bakery",
  "Room Division",
  "Front Office",
  "Hotel Digital Marketing"
];

// Kompatibilitas kolom lama "Group".
const GROUP_TO_MAJORS = {
  fnb_bar: ["Food & Beverage Service", "Bar & Mixology"],
  culinary_pastry: ["Culinary", "Pastry & Bakery"],
  room_division: ["Room Division"],
  fo_digmar: ["Front Office", "Hotel Digital Marketing"]
};

const INSTRUCTOR_HEADERS = {
  id: "ID Instruktur",
  name: "Nama Instruktur",
  role: "Role",
  group: "Group",
  area: "Area",
  photo: "Foto",
  status: "Status",
  majors: "Jurusan"
};

const ADMIN_MAX_FAILS = 5;
const ADMIN_LOCK_SECONDS = 15 * 60;

/* =========================================
   ROUTING
   ========================================= */

function doPost(e) {
  try {
    const payload = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const action = payload.action || "submitEvaluation";

    if (action.indexOf("admin") === 0) return jsonResponse(handleAdmin(action, payload));

    if (action === "saveStudent") return jsonResponse(saveStudent(payload));
    if (action === "startSession") return jsonResponse(startSession(payload));
    if (action === "resumeSession") return jsonResponse(resumeSession(payload));
    if (action === "submitEvaluation") return jsonResponse(saveEvaluation(payload));
    if (action === "lookupStudent") return jsonResponse(lookupStudent(String(payload.nim || "").trim()));
    if (action === "getInstructors") return jsonResponse(getInstructors());

    return jsonResponse({ ok: false, message: "Action tidak dikenal." });
  } catch (error) {
    return jsonResponse({ ok: false, message: String(error && error.message || error) });
  }
}

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || "health";

    if (action === "lookupStudent") return jsonResponse(lookupStudent(String(e.parameter.nim || "").trim()));
    if (action === "getInstructors") return jsonResponse(getInstructors());

    return jsonResponse({ ok: true, message: "Endpoint evaluasi instruktur aktif" });
  } catch (error) {
    return jsonResponse({ ok: false, message: String(error && error.message || error) });
  }
}

/* =========================================
   INSTRUKTUR
   ========================================= */

function getInstructorSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const headers = Object.keys(INSTRUCTOR_HEADERS).map(k => INSTRUCTOR_HEADERS[k]);
  const sheet = getOrCreateSheet(ss, INSTRUCTOR_SHEET, headers);

  // Tambahkan kolom yang belum ada (mis. "Jurusan") di ujung kanan.
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const current = sheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0].map(h => String(h).trim());

  headers.forEach(header => {
    if (current.indexOf(header) === -1) {
      current.push(header);
      sheet.getRange(1, current.length).setValue(header).setFontWeight("bold");
    }
  });

  const col = {};
  Object.keys(INSTRUCTOR_HEADERS).forEach(key => {
    col[key] = current.indexOf(INSTRUCTOR_HEADERS[key]);
  });

  return { sheet: sheet, col: col, width: current.length };
}

function splitList(value) {
  return String(value || "")
    .split(/[,;\n]/)
    .map(s => s.trim())
    .filter(Boolean);
}

function resolveMajors(majorsRaw, groupRaw) {
  const listed = splitList(majorsRaw);

  if (listed.length) {
    if (listed.some(m => m.toUpperCase() === ALL_MAJORS)) return [ALL_MAJORS];
    return listed.filter(m => MAJORS.indexOf(m) !== -1);
  }

  const result = [];
  splitList(groupRaw).forEach(group => {
    if (group.toUpperCase() === "GLOBAL") result.push(ALL_MAJORS);
    (GROUP_TO_MAJORS[group] || []).forEach(m => result.push(m));
  });

  if (result.indexOf(ALL_MAJORS) !== -1) return [ALL_MAJORS];
  return Array.from(new Set(result));
}

function readInstructorRows() {
  const info = getInstructorSheet();
  const sheet = info.sheet;
  const col = info.col;

  if (sheet.getLastRow() < 2) return { info: info, rows: [] };

  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, info.width).getDisplayValues();
  const rows = [];

  values.forEach((row, index) => {
    const get = key => (col[key] >= 0 ? String(row[col[key]] || "").trim() : "");
    const item = {
      row: index + 2,
      id: get("id"),
      name: get("name"),
      role: get("role"),
      group: get("group"),
      area: get("area"),
      photoRaw: get("photo"),
      status: get("status") || "Aktif",
      majorsRaw: get("majors")
    };

    if (!item.id && !item.name) return;

    item.majors = resolveMajors(item.majorsRaw, item.group);
    item.active = item.status.toLowerCase() === "aktif";
    rows.push(item);
  });

  return { info: info, rows: rows };
}

function getInstructors(forceRefresh) {
  const cache = CacheService.getScriptCache();

  if (!forceRefresh) {
    const cached = cache.get(INSTRUCTOR_CACHE_KEY);
    if (cached) {
      try { return JSON.parse(cached); } catch (error) { /* baca ulang sheet */ }
    }
  }

  const instructors = readInstructorRows().rows
    .filter(item => item.active && item.id && item.name && item.role && item.majors.length)
    .map(item => ({
      id: item.id,
      name: item.name,
      role: item.role,
      group: item.group,
      majors: item.majors,
      area: item.area || item.role,
      photo: normalizeImageUrl(item.photoRaw)
    }));

  const result = { ok: true, instructors: instructors };
  cache.put(INSTRUCTOR_CACHE_KEY, JSON.stringify(result), 300);
  return result;
}

function clearInstructorCache() {
  CacheService.getScriptCache().remove(INSTRUCTOR_CACHE_KEY);
}

function normalizeImageUrl(url) {
  const value = String(url || "").trim();
  if (!value) return PLACEHOLDER_PHOTO;
  if (value.indexOf("drive.google.com") === -1) return value;

  const fileId = extractGoogleDriveFileId(value);
  if (!fileId) return value;

  return "https://drive.google.com/thumbnail?id=" + encodeURIComponent(fileId) + "&sz=w1200";
}

function extractGoogleDriveFileId(url) {
  const value = String(url || "").trim();
  if (!value) return "";

  let match = value.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) return match[1];

  match = value.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) return match[1];

  match = value.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match && match[1]) return match[1];

  return "";
}

/* =========================================
   ADMIN
   ========================================= */

function handleAdmin(action, payload) {
  requireAdmin(payload.pin);

  if (action === "adminLogin") return { ok: true };
  if (action === "adminList") return adminList();
  if (action === "adminSave") return adminSave(payload.instructors || []);
  if (action === "adminDelete") return adminDelete(String(payload.id || "").trim());

  return { ok: false, message: "Action admin tidak dikenal." };
}

function requireAdmin(pin) {
  const expected = PropertiesService.getScriptProperties().getProperty("ADMIN_PIN");
  if (!expected) {
    throw new Error("ADMIN_PIN belum diatur di Script Properties Apps Script.");
  }

  const cache = CacheService.getScriptCache();
  const fails = Number(cache.get("admin_fail_count") || 0);

  if (fails >= ADMIN_MAX_FAILS) {
    throw new Error("Terlalu banyak percobaan PIN salah. Coba lagi 15 menit lagi.");
  }

  if (String(pin || "") !== String(expected)) {
    cache.put("admin_fail_count", String(fails + 1), ADMIN_LOCK_SECONDS);
    throw new Error("PIN admin salah.");
  }

  cache.remove("admin_fail_count");
}

function countEvaluationsByInstructor() {
  const counts = {};
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(EVALUATION_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return counts;

  sheet.getRange(2, 6, sheet.getLastRow() - 1, 1).getDisplayValues().forEach(row => {
    const id = String(row[0] || "").trim();
    if (id) counts[id] = (counts[id] || 0) + 1;
  });

  return counts;
}

function adminList() {
  const counts = countEvaluationsByInstructor();
  const instructors = readInstructorRows().rows.map(item => ({
    id: item.id,
    name: item.name,
    role: item.role,
    area: item.area,
    photo: item.photoRaw,
    photoPreview: normalizeImageUrl(item.photoRaw),
    status: item.active ? "Aktif" : "Nonaktif",
    majors: item.majors,
    legacyGroup: item.majorsRaw ? "" : item.group,
    evaluationCount: counts[item.id] || 0
  }));

  return { ok: true, majors: MAJORS, instructors: instructors };
}

function sanitizeMajors(list) {
  const values = (Array.isArray(list) ? list : splitList(list)).map(m => String(m).trim());
  if (values.some(m => m.toUpperCase() === ALL_MAJORS)) return [ALL_MAJORS];
  return MAJORS.filter(m => values.indexOf(m) !== -1);
}

function generateInstructorId(existingIds) {
  let id;
  do {
    id = "INS-" + Utilities.getUuid().replace(/-/g, "").slice(0, 6).toUpperCase();
  } while (existingIds[id]);
  return id;
}

function adminSave(list) {
  if (!Array.isArray(list) || !list.length) throw new Error("Tidak ada data instruktur untuk disimpan.");

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    const data = readInstructorRows();
    const sheet = data.info.sheet;
    const col = data.info.col;
    const width = data.info.width;

    const byId = {};
    data.rows.forEach(item => { if (item.id) byId[item.id] = item; });

    const saved = [];

    list.forEach(input => {
      const name = String(input.name || "").trim();
      const role = String(input.role || "").trim();
      const majors = sanitizeMajors(input.majors);
      const status = String(input.status || "Aktif").toLowerCase() === "nonaktif" ? "Nonaktif" : "Aktif";

      if (!name) throw new Error("Nama instruktur wajib diisi.");
      if (!role) throw new Error("Kategori instruktur " + name + " wajib diisi.");
      if (status === "Aktif" && !majors.length) {
        throw new Error("Instruktur " + name + " belum ditempatkan di jurusan mana pun.");
      }

      let id = String(input.id || "").trim();
      const existing = id ? byId[id] : null;

      if (input.isNew && existing) throw new Error("ID " + id + " sudah dipakai instruktur lain.");
      if (!input.isNew && id && !existing) throw new Error("Instruktur dengan ID " + id + " tidak ditemukan.");
      if (!id) id = generateInstructorId(byId);

      const rowValues = existing
        ? sheet.getRange(existing.row, 1, 1, width).getValues()[0]
        : new Array(width).fill("");

      const set = (key, value) => { if (col[key] >= 0) rowValues[col[key]] = value; };
      set("id", id);
      set("name", name);
      set("role", role);
      set("area", String(input.area || "").trim());
      set("photo", String(input.photo || "").trim());
      set("status", status);
      set("majors", majors.join(", "));

      if (existing) {
        sheet.getRange(existing.row, 1, 1, width).setValues([rowValues]);
      } else {
        sheet.appendRow(rowValues);
        byId[id] = { id: id, row: sheet.getLastRow() };
      }

      saved.push(id);
    });

    clearInstructorCache();
    return { ok: true, saved: saved, message: saved.length + " instruktur tersimpan." };
  } finally {
    lock.releaseLock();
  }
}

function adminDelete(id) {
  if (!id) throw new Error("ID instruktur wajib diisi.");

  const counts = countEvaluationsByInstructor();
  if (counts[id]) {
    throw new Error("Instruktur ini sudah punya " + counts[id] + " evaluasi. Nonaktifkan saja, jangan dihapus.");
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    const data = readInstructorRows();
    const target = data.rows.filter(item => item.id === id)[0];
    if (!target) throw new Error("Instruktur dengan ID " + id + " tidak ditemukan.");

    data.info.sheet.deleteRow(target.row);
    clearInstructorCache();
    return { ok: true, message: "Instruktur dihapus." };
  } finally {
    lock.releaseLock();
  }
}

/* =========================================
   MAHASISWA & EVALUASI (tidak berubah dari V11)
   ========================================= */

function startSession(payload) {
  const saveResult = saveStudent(payload);
  const instructorsResult = getInstructors(false);

  return {
    ok: true,
    message: saveResult.message,
    student: {
      name: String(payload.student_name || "").trim(),
      nim: String(payload.nim || "").trim(),
      major: String(payload.major || "").trim()
    },
    instructors: instructorsResult.instructors || []
  };
}

function resumeSession(payload) {
  const nim = String(payload.nim || "").trim();
  const lookupResult = lookupStudent(nim);

  if (!lookupResult.found) return lookupResult;

  const instructorsResult = getInstructors(false);

  return {
    ok: true,
    found: true,
    student: lookupResult.student,
    completedLecturerIds: lookupResult.completedLecturerIds || [],
    instructors: instructorsResult.instructors || []
  };
}

function saveStudent(payload) {
  const nim = String(payload.nim || "").trim();
  const name = String(payload.student_name || "").trim();
  const major = String(payload.major || "").trim();

  if (!nim || !name || !major) throw new Error("Nama, NIM, dan jurusan wajib diisi.");

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getOrCreateSheet(ss, STUDENT_SHEET, [
    "NIM", "Nama Mahasiswa", "Jurusan", "Dibuat", "Terakhir Aktif"
  ]);

  const rows = sheet.getDataRange().getValues();
  const now = new Date();
  let foundRow = 0;

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === nim) {
      foundRow = i + 1;
      break;
    }
  }

  if (foundRow) {
    sheet.getRange(foundRow, 2, 1, 2).setValues([[name, major]]);
    sheet.getRange(foundRow, 5).setValue(now);
  } else {
    sheet.appendRow([nim, name, major, now, now]);
  }

  return { ok: true, message: "Profil mahasiswa berhasil disimpan" };
}

function saveEvaluation(payload) {
  const nim = String(payload.nim || "").trim();
  const lecturerId = String(payload.lecturer_id || "").trim();

  if (!nim || !lecturerId) throw new Error("NIM dan instruktur wajib tersedia.");

  saveStudent(payload);

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getOrCreateSheet(ss, EVALUATION_SHEET, buildEvaluationHeaders(payload));

  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    const rowNim = String(rows[i][2]).trim();
    const rowLecturerId = String(rows[i][5]).trim();
    if (rowNim === nim && rowLecturerId === lecturerId) {
      return { ok: false, message: "Evaluasi untuk instruktur ini sudah pernah dikirim." };
    }
  }

  const row = [
    new Date(),
    payload.student_name || "",
    nim,
    payload.major || "",
    payload.timestamp_client || "",
    lecturerId,
    payload.lecturer_name || "",
    payload.lecturer_role || "",
    payload.lecturer_area || "",
    ...(payload.answers || []).map(item => item.rating),
    payload.comment || ""
  ];

  sheet.appendRow(row);

  return { ok: true, message: "Data evaluasi berhasil disimpan" };
}

function lookupStudent(nim) {
  const normalizedNim = String(nim || "").trim();

  if (!normalizedNim) return { ok: true, found: false, message: "NIM kosong." };

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const studentSheet = ss.getSheetByName(STUDENT_SHEET);

  if (!studentSheet || studentSheet.getLastRow() < 2) {
    return { ok: true, found: false, message: "Sheet Mahasiswa belum memiliki data." };
  }

  const studentMatches = studentSheet
    .getRange(2, 1, studentSheet.getLastRow() - 1, 1)
    .createTextFinder(normalizedNim)
    .matchEntireCell(true)
    .findAll();

  if (!studentMatches.length) {
    return { ok: true, found: false, message: "NIM tidak ditemukan di sheet Mahasiswa." };
  }

  const studentValues = studentSheet
    .getRange(studentMatches[0].getRow(), 1, 1, 3)
    .getDisplayValues()[0];

  const student = {
    nim: String(studentValues[0] || "").trim(),
    name: String(studentValues[1] || "").trim(),
    major: String(studentValues[2] || "").trim()
  };

  const completedLecturerIds = [];
  const evaluationSheet = ss.getSheetByName(EVALUATION_SHEET);

  if (evaluationSheet && evaluationSheet.getLastRow() >= 2) {
    evaluationSheet
      .getRange(2, 3, evaluationSheet.getLastRow() - 1, 1)
      .createTextFinder(normalizedNim)
      .matchEntireCell(true)
      .findAll()
      .forEach(cell => {
        const lecturerId = String(evaluationSheet.getRange(cell.getRow(), 6).getDisplayValue() || "").trim();
        if (lecturerId) completedLecturerIds.push(lecturerId);
      });
  }

  return {
    ok: true,
    found: true,
    student: student,
    completedLecturerIds: Array.from(new Set(completedLecturerIds))
  };
}

function buildEvaluationHeaders(payload) {
  return [
    "Timestamp Server",
    "Nama Mahasiswa",
    "NIM",
    "Jurusan",
    "Timestamp Client",
    "ID Instruktur",
    "Nama Instruktur",
    "Role Instruktur",
    "Area Instruktur",
    ...(payload.answers || []).map(item => item.question),
    "Komentar"
  ];
}

function getOrCreateSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
