console.info("Elizabeth Evaluasi V12.1 - Back Button Fix");
const $ = (id) => document.getElementById(id);

const els = {
  studentView: $("studentView"),
  lecturerView: $("lecturerView"),
  questionnaireView: $("questionnaireView"),
  studentForm: $("studentForm"),
  resumeForm: $("resumeForm"),
  resumeNim: $("resumeNim"),
  resumeBtn: $("resumeBtn"),
  startNewBtn: $("startNewBtn"),
  studentName: $("studentName"),
  studentNim: $("studentNim"),
  studentMajor: $("studentMajor"),
  sessionGreeting: $("sessionGreeting"),
  sessionInfo: $("sessionInfo"),
  lecturerGrid: $("lecturerGrid"),
  lecturerSummary: $("lecturerSummary"),
  lecturerPageTitle: $("lecturerPageTitle"),
  lecturerPageSubtitle: $("lecturerPageSubtitle"),
  backToCategoriesBtn: $("backToCategoriesBtn"),
  questionnaireForm: $("questionnaireForm"),
  questionsContainer: $("questionsContainer"),
  comment: $("comment"),
  commentHelp: $("commentHelp"),
  successBanner: $("successBanner"),
  confirmModal: $("confirmModal"),
  newSessionModal: $("newSessionModal")
};

const SESSION_KEY = "evaluationStudentSession";
const COMPLETED_KEY = "evaluationCompletedLecturers";

let activeLecturer = null;
let activeCategory = null;
let pendingPayload = null;

let instructorCache = [];
let instructorsLoaded = false;


/* =========================================
   V12 - HARD NAVIGATION HANDLERS
   Handler global dipakai langsung oleh tombol HTML.
   ========================================= */

function goBackToCategories(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  activeLecturer = null;
  activeCategory = null;

  renderCategoryCards();
  showView("lecturerView");

  return false;
}

function goBackToLecturers(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  activeLecturer = null;

  if (activeCategory) {
    renderInstructorList(activeCategory);
  } else {
    renderCategoryCards();
  }

  showView("lecturerView");

  return false;
}

/* Pastikan inline onclick dapat menemukan fungsi ini. */
window.goBackToCategories = goBackToCategories;
window.goBackToLecturers = goBackToLecturers;


function getStudent() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
  catch { return null; }
}

function setStudent(student) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(student));
}

function getCompleted() {
  try { return JSON.parse(localStorage.getItem(COMPLETED_KEY)) || []; }
  catch { return []; }
}

function setCompleted(ids) {
  localStorage.setItem(COMPLETED_KEY, JSON.stringify(ids));
}

function showView(name) {
  [els.studentView, els.lecturerView, els.questionnaireView].forEach(v => v.classList.add("hidden"));
  els[name].classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function populateMajors() {
  // Dropdown sudah memiliki fallback di HTML.
  // Fungsi ini menyinkronkan isinya dengan MAJORS di config.js
  // tanpa membuat option ganda.
  if (!els.studentMajor || !Array.isArray(MAJORS)) return;

  const currentValue = els.studentMajor.value;
  els.studentMajor.innerHTML = '<option value="">Pilih jurusan</option>';

  MAJORS.forEach(major => {
    const option = document.createElement("option");
    option.value = major;
    option.textContent = major;
    els.studentMajor.appendChild(option);
  });

  if (MAJORS.includes(currentValue)) {
    els.studentMajor.value = currentValue;
  }
}

function getLecturersForMajor(major) {
  const poolKey = MAJOR_TO_POOL[major];
  if (!poolKey) return [];

  return instructorCache
    .filter(item => item.group === poolKey || item.group === "GLOBAL")
    .map(item => ({ ...item, major }));
}

async function ensureInstructorsLoaded(force = false) {
  if (instructorsLoaded && !force) return instructorCache;

  if (!GOOGLE_SCRIPT_URL) {
    instructorCache = [];
    instructorsLoaded = true;
    console.warn("GOOGLE_SCRIPT_URL belum diisi. Data instruktur Google Sheets belum dapat dimuat.");
    return instructorCache;
  }

  const result = await postToGoogleSheets({
    action: "getInstructors"
  });

  instructorCache = Array.isArray(result.instructors)
    ? result.instructors
    : [];

  instructorsLoaded = true;
  return instructorCache;
}

async function restoreOrStart() {
  const student = getStudent();

  if (student?.name && student?.nim && student?.major) {
    if (GOOGLE_SCRIPT_URL) {
      try {
        const remote = await lookupStudentByNim(student.nim);
        if (remote?.found) {
          setStudent(remote.student);
          setCompleted(remote.completedLecturerIds || []);
        }
      } catch (error) {
        console.warn("Sinkronisasi progres gagal, menggunakan data lokal.", error);
      }
    }
    try {
      await ensureInstructorsLoaded();
    } catch (error) {
      console.error("Data instruktur gagal dimuat.", error);
    }

    renderLecturers();
    showView("lecturerView");
  } else {
    showView("studentView");
  }
}

function renderLecturers(successMessage = "", preserveCategory = false) {
  const student = getStudent();
  if (!student) return showView("studentView");

  els.sessionGreeting.textContent = `Halo, ${student.name}`;
  els.sessionInfo.textContent = `NIM: ${student.nim} / Jurusan: ${student.major}`;

  if (successMessage) {
    els.successBanner.textContent = successMessage;
    els.successBanner.classList.remove("hidden");
  } else {
    els.successBanner.classList.add("hidden");
  }

  if (preserveCategory && activeCategory) {
    renderInstructorList(activeCategory);
  } else {
    activeCategory = null;
    renderCategoryCards();
  }
}

function getCategoryMeta(role) {
  const meta = {
    "Instruktur Jurusan": {
      title: "Instruktur Jurusan",
      icon: "🎓",
      description: "Instruktur utama sesuai jurusan mahasiswa."
    },
    "Instruktur IT": {
      title: "Instruktur IT",
      icon: "💻",
      description: "Instruktur bidang Information Technology."
    },
    "Instruktur Business": {
      title: "Instruktur Business",
      icon: "💼",
      description: "Instruktur bidang Business & Entrepreneurship."
    },
    "Instruktur English": {
      title: "Instruktur English",
      icon: "EN",
      description: "Instruktur bidang English Communication."
    }
  };

  return meta[role] || {
    title: role,
    icon: "•",
    description: "Kategori instruktur."
  };
}

function renderCategoryCards() {
  const student = getStudent();
  if (!student) return;

  const lecturers = getLecturersForMajor(student.major);
  const roleOrder = [
    "Instruktur Jurusan",
    "Instruktur IT",
    "Instruktur Business",
    "Instruktur English"
  ];

  els.lecturerPageTitle.textContent = "Pilih Kategori Instruktur";
  els.lecturerPageSubtitle.textContent =
    "Pilih kategori terlebih dahulu, lalu pilih instruktur yang ingin dievaluasi.";
  els.backToCategoriesBtn.classList.add("hidden");

  els.lecturerGrid.className = "category-grid";
  els.lecturerGrid.innerHTML = "";

  roleOrder.forEach(role => {
    const categoryLecturers = lecturers.filter(item => item.role === role);
    if (!categoryLecturers.length) return;

    const meta = getCategoryMeta(role);
    const displayTitle = role === "Instruktur Jurusan"
      ? `Instruktur ${student.major}`
      : meta.title;
    const displayDescription = role === "Instruktur Jurusan"
      ? `Daftar instruktur khusus jurusan ${student.major}.`
      : meta.description;

    const card = document.createElement("button");
    card.type = "button";
    card.className = "category-card";
    card.innerHTML = `
      <div class="category-icon">${escapeHtml(meta.icon)}</div>
      <strong>${escapeHtml(displayTitle)}</strong>
      <span>${escapeHtml(displayDescription)}</span>
      <span class="category-count">${categoryLecturers.length} instruktur →</span>
    `;
    card.addEventListener("click", () => renderInstructorList(role));
    els.lecturerGrid.appendChild(card);
  });

  if (!els.lecturerGrid.children.length) {
    els.lecturerGrid.className = "lecturer-grid";
    els.lecturerGrid.innerHTML = `
      <div class="panel" style="padding:24px;grid-column:1/-1">
        Belum ada data instruktur aktif untuk jurusan <strong>${escapeHtml(student.major)}</strong>.
        Periksa tab <strong>Instruktur</strong> di Google Sheets.
      </div>`;
  }
}

function renderInstructorList(role) {
  const student = getStudent();
  if (!student) return;

  activeCategory = role;

  const completed = getCompleted();
  const lecturers = getLecturersForMajor(student.major)
    .filter(item => item.role === role);

  const meta = getCategoryMeta(role);

  const displayTitle = role === "Instruktur Jurusan"
    ? `Instruktur ${student.major}`
    : meta.title;

  els.lecturerPageTitle.textContent = displayTitle;
  els.lecturerPageSubtitle.textContent =
    role === "Instruktur Jurusan"
      ? `Pilih instruktur jurusan ${student.major} yang ingin Anda evaluasi.`
      : `Pilih instruktur ${meta.title.toLowerCase()} yang ingin Anda evaluasi.`;
  els.backToCategoriesBtn.classList.remove("hidden");

  els.lecturerGrid.className = "lecturer-grid";
  els.lecturerGrid.innerHTML = "";

  if (!lecturers.length) {
    els.lecturerGrid.innerHTML = `
      <div class="panel" style="padding:24px;grid-column:1/-1">
        Belum ada data untuk kategori <strong>${escapeHtml(role)}</strong>.
      </div>`;
    return;
  }

  lecturers.forEach(lecturer => {
    const alreadyDone = completed.includes(lecturer.id);
    const card = document.createElement("button");
    card.type = "button";
    card.className = "lecturer-card";
    card.innerHTML = `
      <img class="lecturer-photo" src="${lecturer.photo}" alt="Foto ${escapeHtml(lecturer.name)}" onerror="handleImageError(this)" />
      <div class="lecturer-info">
        <strong class="${getNameSizeClass(lecturer.name)}">${escapeHtml(lecturer.name)}</strong>
        <span>${escapeHtml(lecturer.area)}</span>
        <span class="role-badge">${escapeHtml(lecturer.role)}</span>
        ${alreadyDone ? `<span class="done-badge">Sudah diisi</span>` : ""}
      </div>`;

    if (alreadyDone) {
      card.title = "Kuisioner untuk instruktur ini sudah pernah dikirim.";
      card.addEventListener("click", () => {
        alert("Anda sudah mengisi evaluasi untuk instruktur ini. Silakan pilih instruktur lain.");
      });
    } else {
      card.addEventListener("click", () => openQuestionnaire(lecturer.id));
    }

    els.lecturerGrid.appendChild(card);
  });
}

function openQuestionnaire(lecturerId) {
  const student = getStudent();
  const instructors = getLecturersForMajor(student.major);
  activeLecturer = instructors.find(l => l.id === lecturerId);
  if (!activeLecturer) return;

  els.lecturerSummary.innerHTML = `
    <img src="${activeLecturer.photo}" alt="Foto ${escapeHtml(activeLecturer.name)}" onerror="handleImageError(this)">
    <div>
      <strong>${escapeHtml(activeLecturer.name)}</strong>
      <span>${escapeHtml(activeLecturer.area)}</span>
      <span class="summary-badge">${escapeHtml(activeLecturer.role)}</span>
    </div>`;

  els.questionsContainer.innerHTML = "";
  QUESTIONS.forEach((question, index) => {
    const key = `q${index + 1}`;
    const title = typeof question === "string" ? question : question.title;
    const description = typeof question === "string" ? "" : question.description;

    const wrapper = document.createElement("div");
    wrapper.className = "question";
    wrapper.innerHTML = `
      <div class="question-copy">
        <div class="question-title">${index + 1}. ${escapeHtml(title)}</div>
        ${description ? `<div class="question-description">${escapeHtml(description)}</div>` : ""}
      </div>
      <div class="rating" aria-label="${escapeHtml(title)}">
        ${[1,2,3,4,5].map(value => `
          <input type="radio" id="${key}_${value}" name="${key}" value="${value}" required>
          <label for="${key}_${value}" title="Nilai ${value}">${value}</label>
        `).join("")}
      </div>`;
    els.questionsContainer.appendChild(wrapper);
  });

if (els.commentHelp) {
  els.commentHelp.textContent =
    `Berikan kritik dan saran secara umum kepada ${activeLecturer.name}.`;
}

  els.comment.value = "";
  showView("questionnaireView");
}

function collectQuestionnairePayload() {
  const student = getStudent();
  if (!student || !activeLecturer) return null;

  const answers = QUESTIONS.map((question, index) => {
    const selected = document.querySelector(`input[name="q${index + 1}"]:checked`);
    const title = typeof question === "string" ? question : question.title;
    const description = typeof question === "string" ? "" : question.description;

    return {
      question: title,
      description,
      rating: selected ? Number(selected.value) : null
    };
  });

  if (answers.some(a => !a.rating)) {
    alert("Mohon isi seluruh rating 1–5 sebelum mengirim.");
    return null;
  }

  return {
    action: "submitEvaluation",
    timestamp_client: new Date().toISOString(),
    student_name: student.name,
    nim: student.nim,
    major: student.major,
    lecturer_id: activeLecturer.id,
    lecturer_name: activeLecturer.name,
    lecturer_role: activeLecturer.role,
    lecturer_area: activeLecturer.area,
    answers,
    comment: els.comment.value.trim()
  };
}

async function postToGoogleSheets(payload, timeoutMs = 18000) {
  if (!GOOGLE_SCRIPT_URL) {
    console.warn("GOOGLE_SCRIPT_URL belum diisi. Data hanya disimulasikan.", payload);
    await new Promise(resolve => setTimeout(resolve, 450));
    return { ok: true, demo: true };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: "no-store"
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.message || "Google Apps Script mengembalikan error.");
    }

    return data;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Koneksi ke Google Sheets terlalu lama. Silakan coba kembali.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function saveStudentProfile(student) {
  return postToGoogleSheets({
    action: "saveStudent",
    student_name: student.name,
    nim: student.nim,
    major: student.major,
    timestamp_client: new Date().toISOString()
  });
}

async function lookupStudentByNim(nim) {
  const normalizedNim = String(nim || "").trim();

  if (!normalizedNim) {
    return {
      ok: true,
      found: false,
      message: "NIM belum diisi."
    };
  }

  if (!GOOGLE_SCRIPT_URL) {
    const local = getStudent();

    if (local?.nim === normalizedNim) {
      return {
        ok: true,
        found: true,
        student: local,
        completedLecturerIds: getCompleted(),
        demo: true
      };
    }

    return {
      ok: true,
      found: false,
      demo: true,
      message: "GOOGLE_SCRIPT_URL belum diisi."
    };
  }

  let postError = null;

  // 1. Utamakan POST (versi Apps Script terbaru).
  try {
    return await postToGoogleSheets({
      action: "lookupStudent",
      nim: normalizedNim
    });
  } catch (error) {
    postError = error;
    console.warn("Lookup NIM via POST gagal. Mencoba fallback GET...", error);
  }

  // 2. Fallback GET.
  // Berguna jika Web App Google Apps Script masih memakai deployment versi
  // sebelumnya yang sudah memiliki doGet lookupStudent.
  try {
    const separator = GOOGLE_SCRIPT_URL.includes("?") ? "&" : "?";
    const lookupUrl =
      `${GOOGLE_SCRIPT_URL}${separator}action=lookupStudent&nim=${encodeURIComponent(normalizedNim)}&_=${Date.now()}`;

    const response = await fetch(lookupUrl, {
      method: "GET",
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`GET lookup HTTP ${response.status}`);
    }

    const raw = await response.text();

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error(
        "Respons Apps Script bukan JSON. Pastikan URL yang digunakan adalah URL Web App yang berakhiran /exec."
      );
    }

    if (!data.ok) {
      throw new Error(data.message || "Pencarian NIM melalui Apps Script gagal.");
    }

    return data;
  } catch (getError) {
    console.error("Lookup NIM via GET juga gagal.", getError);

    const postMessage = postError?.message || "tidak diketahui";
    const getMessage = getError?.message || "tidak diketahui";

    throw new Error(
      `Pencarian NIM gagal. POST: ${postMessage}. GET: ${getMessage}.`
    );
  }
}

async function resumeSessionByNim(nim) {
  const normalizedNim = String(nim || "").trim();

  if (!normalizedNim) {
    return {
      ok: true,
      found: false,
      message: "NIM belum diisi."
    };
  }

  // V11: satu request untuk identitas, progres, dan daftar instruktur.
  // Jika Apps Script belum di-deploy ke V11, otomatis memakai cara lama.
  try {
    const result = await postToGoogleSheets({
      action: "resumeSession",
      nim: normalizedNim
    });

    if (Array.isArray(result.instructors)) {
      instructorCache = result.instructors;
      instructorsLoaded = true;
    }

    return result;
  } catch (error) {
    console.warn("resumeSession V11 belum tersedia. Menggunakan fallback lama.", error);

    const result = await lookupStudentByNim(normalizedNim);

    if (!instructorsLoaded) {
      await ensureInstructorsLoaded();
    }

    return result;
  }
}

function markLecturerCompleted(id) {
  const completed = new Set(getCompleted());
  completed.add(id);
  setCompleted([...completed]);
}

function resetSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(COMPLETED_KEY);
  activeLecturer = null;
  activeCategory = null;
  pendingPayload = null;
  els.studentForm.reset();
  els.resumeForm.reset();
  els.newSessionModal.classList.add("hidden");
  showView("studentView");
}

function getNameSizeClass(name) {
  const length = String(name || "").length;

  if (length > 45) return "name-xs";
  if (length > 32) return "name-sm";

  return "name-normal";
}

function handleImageError(img) {
  if (!img || img.dataset.fallbackApplied === "1") return;
  img.dataset.fallbackApplied = "1";
  img.src = "https://placehold.co/900x675?text=Elizabeth+International";
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

els.studentForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const student = {
    name: els.studentName.value.trim(),
    nim: els.studentNim.value.trim(),
    major: els.studentMajor.value
  };
  if (!student.name || !student.nim || !student.major) return;

  els.startNewBtn.disabled = true;
  els.startNewBtn.textContent = "Menyimpan...";

  try {
    const result = await saveStudentProfile(student);
    setStudent(student);
    setCompleted([]);

    await ensureInstructorsLoaded(true);

    renderLecturers(
      result.demo
        ? "Mode demo aktif. Hubungkan Google Sheets agar sesi dapat dilanjutkan dari perangkat lain."
        : "Data mahasiswa tersimpan. Anda dapat mulai mengisi evaluasi."
    );
    showView("lecturerView");
  } catch (error) {
    console.error(error);
    alert("Data mahasiswa belum berhasil disimpan. Periksa koneksi internet dan URL Google Apps Script.");
  } finally {
    els.startNewBtn.disabled = false;
    els.startNewBtn.textContent = "Simpan & Lanjut ke Daftar Instruktur →";
  }
});

els.resumeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const nim = els.resumeNim.value.trim();
  if (!nim) return;

  els.resumeBtn.disabled = true;
  els.resumeBtn.textContent = "Mencari...";

  try {
    const result = await resumeSessionByNim(nim);
    if (!result.found) {
      alert(
        result.demo
          ? "NIM belum ditemukan di sesi lokal. Isi GOOGLE_SCRIPT_URL agar pencarian dilakukan melalui Google Sheets."
          : (result.message || "NIM tidak ditemukan di sheet Mahasiswa. Pastikan NIM sama persis dengan yang terdaftar.")
      );
      return;
    }

    setStudent(result.student);
    setCompleted(result.completedLecturerIds || []);

    if (!instructorsLoaded) {
      await ensureInstructorsLoaded();
    }

    renderLecturers(`Sesi ${result.student.name} berhasil dipulihkan. Silakan lanjutkan instruktur yang belum diisi.`);
    showView("lecturerView");
  } catch (error) {
    console.error(error);
    alert(
      "Sesi belum berhasil ditemukan.\n\n" +
      "Detail: " + (error?.message || "Error tidak diketahui") + "\n\n" +
      "Pastikan Apps Script sudah di-deploy ulang sebagai Web App dan URL di config.js berakhiran /exec."
    );
  } finally {
    els.resumeBtn.disabled = false;
    els.resumeBtn.textContent = "Cari & Lanjutkan Sesi";
  }
});

$("editStudentBtn").addEventListener("click", () => {
  const student = getStudent();
  if (student) {
    els.studentName.value = student.name;
    els.studentNim.value = student.nim;
    els.studentMajor.value = student.major;
  }
  showView("studentView");
});

$("newSessionBtn").addEventListener("click", () => {
  els.newSessionModal.classList.remove("hidden");
});

$("newSessionCancelBtn").addEventListener("click", () => {
  els.newSessionModal.classList.add("hidden");
});

$("newSessionConfirmBtn").addEventListener("click", resetSession);

$("backToLecturersBtn").addEventListener("click", goBackToLecturers);

$("cancelQuestionnaireBtn").addEventListener("click", goBackToLecturers);

els.backToCategoriesBtn.addEventListener("click", goBackToCategories);

els.questionnaireForm.addEventListener("submit", (event) => {
  event.preventDefault();
  pendingPayload = collectQuestionnairePayload();
  if (!pendingPayload) return;
  els.confirmModal.classList.remove("hidden");
});

$("confirmCancelBtn").addEventListener("click", () => {
  pendingPayload = null;
  els.confirmModal.classList.add("hidden");
});

$("confirmSendBtn").addEventListener("click", async () => {
  if (!pendingPayload) return;

  const button = $("confirmSendBtn");
  button.disabled = true;
  button.textContent = "Mengirim...";

  try {
    const result = await postToGoogleSheets(pendingPayload);
    markLecturerCompleted(activeLecturer.id);

    const lecturerName = activeLecturer.name;
    pendingPayload = null;
    activeLecturer = null;
    els.confirmModal.classList.add("hidden");

    renderLecturers(
      result.demo
        ? `Mode demo: evaluasi untuk ${lecturerName} berhasil diproses. Hubungkan Google Sheets agar progres tersimpan lintas perangkat.`
        : `Evaluasi untuk ${lecturerName} berhasil disimpan. Progres Anda dapat dilanjutkan kembali menggunakan NIM.`,
      true
    );
    showView("lecturerView");
  } catch (error) {
    console.error(error);
    alert(error.message || "Data belum berhasil dikirim.");
  } finally {
    button.disabled = false;
    button.textContent = "Ya, Kirim";
  }
});

populateMajors();
restoreOrStart();
