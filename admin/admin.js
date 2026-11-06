/* Elizabeth Evaluasi - Admin Instruktur V15 */
const $ = (id) => document.getElementById(id);

const DEMO = new URLSearchParams(location.search).has("demo");
const ALL = "SEMUA";
const PIN_KEY = "evaluasiAdminPin";
const ROLE_ORDER = ["Instruktur Jurusan", "Instruktur IT", "Instruktur Business", "Instruktur English"];
const MAJOR_SHORT = {
  "Food & Beverage Service": "F&B Service",
  "Bar & Mixology": "Bar",
  "Culinary": "Culinary",
  "Pastry & Bakery": "Pastry",
  "Room Division": "Room Div.",
  "Front Office": "Front Office",
  "Hotel Digital Marketing": "Digital Mkt."
};
const PLACEHOLDER = "https://placehold.co/900x675?text=Elizabeth+International";

const state = {
  pin: "",
  majors: typeof MAJORS !== "undefined" ? MAJORS.slice() : [],
  instructors: [],
  tab: "list",
  draft: {},      // id -> majors[] (perubahan matriks yang belum disimpan)
  editing: null   // instruktur yang sedang diedit; null = tambah baru
};

/* ---------- util ---------- */

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function storageGet(key) {
  try { return sessionStorage.getItem(key) || ""; } catch { return ""; }
}

function storageSet(key, value) {
  try {
    if (value) sessionStorage.setItem(key, value);
    else sessionStorage.removeItem(key);
  } catch { /* abaikan */ }
}

function sameMajors(a, b) {
  return [...a].sort().join("|") === [...b].sort().join("|");
}

function majorsOf(item) {
  return state.draft[item.id] || item.majors || [];
}

function inMajor(majors, major) {
  return majors.includes(ALL) || majors.includes(major);
}

function rolesInUse() {
  const roles = new Set(ROLE_ORDER);
  state.instructors.forEach(i => i.role && roles.add(i.role));
  return [...roles];
}

function roleRank(role) {
  const index = ROLE_ORDER.indexOf(role);
  return index === -1 ? ROLE_ORDER.length : index;
}

function sortInstructors(list) {
  return [...list].sort((a, b) =>
    roleRank(a.role) - roleRank(b.role) ||
    String(a.role).localeCompare(String(b.role)) ||
    String(a.name).localeCompare(String(b.name))
  );
}

function showNotice(message, type = "success") {
  const box = $("adminNotice");
  box.textContent = message;
  box.className = `notice ${type}`;
  clearTimeout(showNotice.timer);
  showNotice.timer = setTimeout(() => box.classList.add("hidden"), 6000);
}

/* ---------- API ---------- */

async function api(action, data = {}) {
  if (DEMO) return demoApi(action, data);

  if (!GOOGLE_SCRIPT_URL) throw new Error("GOOGLE_SCRIPT_URL belum diisi di config.js.");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, pin: state.pin, ...data }),
      signal: controller.signal,
      cache: "no-store"
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    if (!result.ok) throw new Error(result.message || "Apps Script mengembalikan error.");
    return result;
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("Koneksi ke Google Sheets terlalu lama. Coba lagi.");
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/* Mode demo: data contoh di memori, tidak menyentuh Google Sheets. */
const demoData = [
  { id: "fnb_01", name: "Ni Made Ayu Lestari", role: "Instruktur Jurusan", area: "F&B Service Operation", majors: ["Food & Beverage Service", "Bar & Mixology"], evaluationCount: 12, legacyGroup: "fnb_bar" },
  { id: "bar_01", name: "I Gede Arya Wiguna", role: "Instruktur Jurusan", area: "Mixology & Barista", majors: ["Bar & Mixology"], evaluationCount: 4 },
  { id: "cul_01", name: "Chef Komang Darmawan", role: "Instruktur Jurusan", area: "Basic Cooking", majors: ["Culinary", "Pastry & Bakery"], evaluationCount: 20, legacyGroup: "culinary_pastry" },
  { id: "rd_01", name: "Putu Sri Wahyuni", role: "Instruktur Jurusan", area: "Housekeeping", majors: ["Room Division"], evaluationCount: 7 },
  { id: "fo_01", name: "Kadek Dwi Pratama", role: "Instruktur Jurusan", area: "Front Office Operation", majors: ["Front Office", "Hotel Digital Marketing"], evaluationCount: 0 },
  { id: "it_01", name: "Made Surya Antara", role: "Instruktur IT", area: "Microsoft Office", majors: [ALL], evaluationCount: 35, legacyGroup: "GLOBAL" },
  { id: "bs_01", name: "Ketut Ari Santika", role: "Instruktur Business", area: "Entrepreneurship", majors: [ALL], evaluationCount: 18 },
  { id: "en_01", name: "Sarah Williams", role: "Instruktur English", area: "English Communication", majors: ["Food & Beverage Service", "Culinary", "Front Office"], evaluationCount: 9 },
  { id: "en_02", name: "Wayan Budi Kusuma", role: "Instruktur English", area: "Hotel English", majors: [], status: "Nonaktif", evaluationCount: 0 }
].map(item => ({ status: "Aktif", photo: "", photoPreview: PLACEHOLDER, legacyGroup: "", ...item }));

async function demoApi(action, data) {
  await new Promise(resolve => setTimeout(resolve, 250));

  if (action === "adminLogin") return { ok: true };
  if (action === "adminList") {
    return { ok: true, majors: state.majors, instructors: JSON.parse(JSON.stringify(demoData)) };
  }
  if (action === "adminSave") {
    const saved = data.instructors.map(input => {
      const id = input.id || `INS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const existing = demoData.find(i => i.id === id);
      if (input.isNew && existing) throw new Error(`ID ${id} sudah dipakai instruktur lain.`);
      const record = {
        ...(existing || { evaluationCount: 0 }),
        ...input,
        id,
        photoPreview: input.photo || PLACEHOLDER,
        legacyGroup: ""
      };
      delete record.isNew;
      if (existing) Object.assign(existing, record);
      else demoData.push(record);
      return id;
    });
    return { ok: true, saved, message: `${saved.length} instruktur tersimpan.` };
  }
  if (action === "adminDelete") {
    const index = demoData.findIndex(i => i.id === data.id);
    if (index === -1) throw new Error("Instruktur tidak ditemukan.");
    if (demoData[index].evaluationCount) throw new Error("Instruktur ini sudah punya evaluasi. Nonaktifkan saja.");
    demoData.splice(index, 1);
    return { ok: true, message: "Instruktur dihapus." };
  }
  throw new Error("Action admin tidak dikenal.");
}

/* ---------- login ---------- */

async function login(pin) {
  state.pin = pin;
  await api("adminLogin");
  storageSet(PIN_KEY, pin);
  $("loginView").classList.add("hidden");
  $("adminView").classList.remove("hidden");
  await loadData();
}

function logout() {
  if (Object.keys(state.draft).length && !confirm("Ada perubahan penempatan yang belum disimpan. Tetap keluar?")) return;
  state.pin = "";
  state.draft = {};
  storageSet(PIN_KEY, "");
  $("pinInput").value = "";
  $("adminView").classList.add("hidden");
  $("saveBar").classList.add("hidden");
  $("loginView").classList.remove("hidden");
}

async function loadData() {
  $("reloadBtn").disabled = true;
  $("reloadBtn").textContent = "Memuat...";
  try {
    const result = await api("adminList");
    if (Array.isArray(result.majors) && result.majors.length) state.majors = result.majors;
    state.instructors = result.instructors || [];
    state.draft = {};
    populateFilters();
    render();
  } catch (error) {
    showNotice(error.message, "error");
  } finally {
    $("reloadBtn").disabled = false;
    $("reloadBtn").textContent = "Muat Ulang";
  }
}

/* ---------- filter & render ---------- */

function populateFilters() {
  const majorSelect = $("filterMajor");
  const keepMajor = majorSelect.value;
  majorSelect.innerHTML = '<option value="">Semua jurusan</option>' +
    state.majors.map(m => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join("");
  majorSelect.value = keepMajor;

  const roleSelect = $("filterRole");
  const keepRole = roleSelect.value;
  const roles = rolesInUse();
  roleSelect.innerHTML = '<option value="">Semua kategori</option>' +
    roles.map(r => `<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`).join("");
  roleSelect.value = keepRole;

  $("roleOptions").innerHTML = roles.map(r => `<option value="${escapeHtml(r)}"></option>`).join("");
}

function filteredInstructors() {
  const query = $("searchInput").value.trim().toLowerCase();
  const major = $("filterMajor").value;
  const role = $("filterRole").value;
  const status = $("filterStatus").value;

  return sortInstructors(state.instructors.filter(item => {
    if (role && item.role !== role) return false;
    if (status && item.status !== status) return false;
    if (major && !inMajor(majorsOf(item), major)) return false;
    if (query) {
      const haystack = `${item.name} ${item.area} ${item.id} ${item.role}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  }));
}

function render() {
  const active = state.instructors.filter(i => i.status === "Aktif").length;
  $("adminSummary").textContent =
    `${state.instructors.length} instruktur · ${active} aktif · ${state.instructors.length - active} nonaktif` +
    (DEMO ? " · MODE DEMO" : "");

  $("listTab").classList.toggle("hidden", state.tab !== "list");
  $("matrixTab").classList.toggle("hidden", state.tab !== "matrix");
  document.querySelectorAll(".tab").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.tab === state.tab);
    tab.setAttribute("aria-selected", tab.dataset.tab === state.tab ? "true" : "false");
  });

  if (state.tab === "list") {
    renderCoverage();
    renderList();
  } else {
    renderMatrix();
  }
  renderSaveBar();
}

function majorChips(majors) {
  if (majors.includes(ALL)) return '<span class="chip all">Semua jurusan</span>';
  if (!majors.length) return '<span class="chip empty">Belum ditempatkan</span>';
  return majors.map(m => `<span class="chip" title="${escapeHtml(m)}">${escapeHtml(MAJOR_SHORT[m] || m)}</span>`).join("");
}

function renderCoverage() {
  const activeList = state.instructors.filter(i => i.status === "Aktif");
  const roles = rolesInUse().filter(r => activeList.some(i => i.role === r) || ROLE_ORDER.includes(r));

  $("coverage").innerHTML = state.majors.map(major => {
    const rows = roles.map(role => {
      const count = activeList.filter(i => i.role === role && inMajor(majorsOf(i), major)).length;
      const label = role.replace(/^Instruktur\s+/i, "");
      return `<li class="${count ? "" : "zero"}"><span>${escapeHtml(label)}</span><strong>${count}</strong></li>`;
    }).join("");
    return `
      <button type="button" class="coverage-card" data-major="${escapeHtml(major)}" title="Tampilkan instruktur ${escapeHtml(major)}">
        <span class="coverage-title">${escapeHtml(major)}</span>
        <ul>${rows}</ul>
      </button>`;
  }).join("");
}

function renderList() {
  const list = filteredInstructors();
  const container = $("instructorList");

  if (!list.length) {
    container.innerHTML = '<div class="panel empty-state">Tidak ada instruktur yang cocok dengan filter.</div>';
    return;
  }

  container.innerHTML = list.map(item => `
    <button type="button" class="instructor-row ${item.status === "Aktif" ? "" : "inactive"}" data-id="${escapeHtml(item.id)}">
      <img src="${escapeHtml(item.photoPreview || PLACEHOLDER)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${PLACEHOLDER}'" />
      <span class="row-main">
        <strong>${escapeHtml(item.name)}</strong>
        <span class="row-sub">${escapeHtml(item.area || "-")} · <span class="mono">${escapeHtml(item.id)}</span></span>
        <span class="row-chips">${majorChips(majorsOf(item))}</span>
      </span>
      <span class="row-meta">
        <span class="role-badge">${escapeHtml(item.role)}</span>
        <span class="status ${item.status === "Aktif" ? "on" : "off"}">${escapeHtml(item.status)}</span>
        <span class="eval-count">${item.evaluationCount || 0} evaluasi</span>
        ${item.legacyGroup ? `<span class="legacy" title="Penempatan masih dari kolom Group lama. Simpan sekali untuk memindahkan ke kolom Jurusan.">Group lama: ${escapeHtml(item.legacyGroup)}</span>` : ""}
      </span>
    </button>`).join("");
}

function renderMatrix() {
  const list = filteredInstructors();

  $("matrixHead").innerHTML = `
    <tr>
      <th class="sticky-col">Instruktur</th>
      <th title="Tampil di semua jurusan">Semua</th>
      ${state.majors.map(m => `<th title="${escapeHtml(m)}">${escapeHtml(MAJOR_SHORT[m] || m)}</th>`).join("")}
    </tr>`;

  if (!list.length) {
    $("matrixBody").innerHTML = `<tr><td colspan="${state.majors.length + 2}" class="empty-state">Tidak ada instruktur yang cocok dengan filter.</td></tr>`;
    return;
  }

  const body = list.map(item => {
    const majors = majorsOf(item);
    const all = majors.includes(ALL);
    const dirty = Boolean(state.draft[item.id]);
    return `
      <tr class="${dirty ? "dirty" : ""} ${item.status === "Aktif" ? "" : "inactive"}">
        <th class="sticky-col" scope="row">
          <span class="m-name">${escapeHtml(item.name)}</span>
          <span class="m-role">${escapeHtml(item.role)}${item.status === "Aktif" ? "" : " · Nonaktif"}</span>
        </th>
        <td><input type="checkbox" data-id="${escapeHtml(item.id)}" data-major="${ALL}" ${all ? "checked" : ""} aria-label="${escapeHtml(item.name)} di semua jurusan"></td>
        ${state.majors.map(m => `
          <td><input type="checkbox" data-id="${escapeHtml(item.id)}" data-major="${escapeHtml(m)}" ${all || majors.includes(m) ? "checked" : ""} ${all ? "disabled" : ""} aria-label="${escapeHtml(item.name)} di ${escapeHtml(m)}"></td>`).join("")}
      </tr>`;
  }).join("");

  const totals = state.majors.map(m =>
    state.instructors.filter(i => i.status === "Aktif" && inMajor(majorsOf(i), m)).length
  );

  $("matrixBody").innerHTML = body + `
    <tr class="totals">
      <th class="sticky-col" scope="row">Total aktif per jurusan</th>
      <td></td>
      ${totals.map(t => `<td class="${t ? "" : "zero"}">${t}</td>`).join("")}
    </tr>`;
}

function renderSaveBar() {
  const count = Object.keys(state.draft).length;
  $("saveBar").classList.toggle("hidden", !count);
  $("saveBarText").textContent = `${count} instruktur dengan perubahan penempatan belum disimpan`;
}

function toggleMatrixCell(id, major, checked) {
  const item = state.instructors.find(i => i.id === id);
  if (!item) return;

  let majors = majorsOf(item).slice();
  if (major === ALL) {
    majors = checked ? [ALL] : [];
  } else {
    majors = majors.filter(m => m !== major);
    if (checked) majors.push(major);
    majors = state.majors.filter(m => majors.includes(m));
  }

  if (sameMajors(majors, item.majors || [])) delete state.draft[id];
  else state.draft[id] = majors;

  render();
}

async function saveMatrix() {
  const ids = Object.keys(state.draft);
  if (!ids.length) return;

  const payload = ids.map(id => {
    const item = state.instructors.find(i => i.id === id);
    return { ...toPayload(item), majors: state.draft[id] };
  });

  const empty = payload.filter(p => p.status === "Aktif" && !p.majors.length);
  if (empty.length) {
    alert(`Instruktur aktif harus punya minimal satu jurusan:\n- ${empty.map(p => p.name).join("\n- ")}\n\nCentang jurusannya atau nonaktifkan instruktur tersebut.`);
    return;
  }

  const button = $("saveMatrixBtn");
  button.disabled = true;
  button.textContent = "Menyimpan...";
  try {
    const result = await api("adminSave", { instructors: payload });
    showNotice(result.message || "Perubahan tersimpan.");
    await loadData();
  } catch (error) {
    showNotice(error.message, "error");
  } finally {
    button.disabled = false;
    button.textContent = "Simpan Perubahan";
  }
}

function toPayload(item) {
  return {
    id: item.id,
    name: item.name,
    role: item.role,
    area: item.area || "",
    photo: item.photo || "",
    status: item.status,
    majors: item.majors || []
  };
}

/* ---------- modal edit ---------- */

function renderMajorChecks(majors) {
  const all = majors.includes(ALL);
  $("fAll").checked = all;
  $("majorChecks").innerHTML = state.majors.map(m => `
    <label class="check"><input type="checkbox" value="${escapeHtml(m)}" ${all || majors.includes(m) ? "checked" : ""} ${all ? "disabled" : ""}> ${escapeHtml(m)}</label>`).join("");
}

function updatePhotoPreview() {
  const url = $("fPhoto").value.trim();
  const img = $("photoPreview");
  img.onerror = () => { img.onerror = null; img.src = PLACEHOLDER; };
  img.src = driveThumb(url) || state.editing?.photoPreview || PLACEHOLDER;
}

function driveThumb(url) {
  if (!url) return "";
  if (!url.includes("drive.google.com")) return url;
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return match ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(match[1])}&sz=w600` : url;
}

function openEdit(item = null) {
  state.editing = item;
  const filterMajor = $("filterMajor").value;
  const filterRole = $("filterRole").value;

  $("editTitle").textContent = item ? "Edit Instruktur" : "Tambah Instruktur";
  $("fName").value = item?.name || "";
  $("fRole").value = item?.role || filterRole || "";
  $("fArea").value = item?.area || "";
  $("fPhoto").value = item?.photo || "";
  $("fActive").checked = item ? item.status === "Aktif" : true;
  $("fId").value = item?.id || "";
  $("fId").readOnly = Boolean(item);
  $("fId").title = item ? "ID tidak bisa diubah karena dipakai di data evaluasi." : "Kosongkan untuk dibuat otomatis.";
  renderMajorChecks(item ? majorsOf(item) : (filterMajor ? [filterMajor] : []));
  updatePhotoPreview();

  const deleteBtn = $("deleteBtn");
  deleteBtn.classList.toggle("hidden", !item);
  deleteBtn.disabled = Boolean(item?.evaluationCount);
  deleteBtn.title = item?.evaluationCount ? "Sudah ada evaluasi. Nonaktifkan saja." : "";

  $("editInfo").textContent = item
    ? `${item.evaluationCount || 0} evaluasi tercatat.` +
      (item.evaluationCount ? " Instruktur ini tidak bisa dihapus; nonaktifkan jika sudah tidak mengajar." : "") +
      (item.legacyGroup ? ` Penempatan saat ini berasal dari kolom Group lama (${item.legacyGroup}).` : "")
    : "";

  $("editModal").classList.remove("hidden");
  $("fName").focus();
}

function closeEdit() {
  $("editModal").classList.add("hidden");
  state.editing = null;
}

function readEditForm() {
  const all = $("fAll").checked;
  const majors = all
    ? [ALL]
    : [...$("majorChecks").querySelectorAll("input:checked")].map(input => input.value);

  return {
    id: $("fId").value.trim(),
    isNew: !state.editing,
    name: $("fName").value.trim(),
    role: $("fRole").value.trim(),
    area: $("fArea").value.trim(),
    photo: $("fPhoto").value.trim(),
    status: $("fActive").checked ? "Aktif" : "Nonaktif",
    majors
  };
}

async function saveEdit(event) {
  event.preventDefault();
  const data = readEditForm();

  if (data.status === "Aktif" && !data.majors.length) {
    alert("Pilih minimal satu jurusan, atau nonaktifkan instruktur ini.");
    return;
  }

  const button = $("editSaveBtn");
  button.disabled = true;
  button.textContent = "Menyimpan...";
  try {
    const result = await api("adminSave", { instructors: [data] });
    if (state.editing) delete state.draft[state.editing.id];
    const keepDraft = { ...state.draft };
    closeEdit();
    showNotice(`${data.name} tersimpan.` + (result.saved?.[0] && data.isNew ? ` ID: ${result.saved[0]}` : ""));
    await loadData();
    state.draft = keepDraft;
    render();
  } catch (error) {
    alert(error.message);
  } finally {
    button.disabled = false;
    button.textContent = "Simpan";
  }
}

async function deleteEditing() {
  const item = state.editing;
  if (!item) return;
  if (!confirm(`Hapus ${item.name} secara permanen dari sheet Instruktur?`)) return;

  try {
    await api("adminDelete", { id: item.id });
    delete state.draft[item.id];
    closeEdit();
    showNotice(`${item.name} dihapus.`);
    await loadData();
  } catch (error) {
    alert(error.message);
  }
}

/* ---------- events ---------- */

$("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = $("loginBtn");
  button.disabled = true;
  button.textContent = "Memeriksa...";
  try {
    await login($("pinInput").value.trim());
  } catch (error) {
    state.pin = "";
    alert(error.message);
  } finally {
    button.disabled = false;
    button.textContent = "Masuk";
  }
});

$("logoutBtn").addEventListener("click", logout);
$("reloadBtn").addEventListener("click", () => {
  if (Object.keys(state.draft).length && !confirm("Perubahan penempatan yang belum disimpan akan hilang. Lanjutkan?")) return;
  loadData();
});
$("addBtn").addEventListener("click", () => openEdit(null));

["searchInput", "filterMajor", "filterRole", "filterStatus"].forEach(id => {
  $(id).addEventListener(id === "searchInput" ? "input" : "change", render);
});

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    state.tab = tab.dataset.tab;
    render();
  });
});

$("coverage").addEventListener("click", (event) => {
  const card = event.target.closest(".coverage-card");
  if (!card) return;
  const select = $("filterMajor");
  select.value = select.value === card.dataset.major ? "" : card.dataset.major;
  render();
});

$("instructorList").addEventListener("click", (event) => {
  const row = event.target.closest(".instructor-row");
  if (!row) return;
  openEdit(state.instructors.find(i => i.id === row.dataset.id));
});

$("matrixBody").addEventListener("change", (event) => {
  const input = event.target;
  if (input.type !== "checkbox" || !input.dataset.id) return;
  toggleMatrixCell(input.dataset.id, input.dataset.major, input.checked);
});

$("saveMatrixBtn").addEventListener("click", saveMatrix);
$("discardBtn").addEventListener("click", () => {
  state.draft = {};
  render();
});

$("fAll").addEventListener("change", () => {
  const current = [...$("majorChecks").querySelectorAll("input:checked")].map(i => i.value);
  renderMajorChecks($("fAll").checked ? [ALL] : current);
});
$("fPhoto").addEventListener("input", updatePhotoPreview);
$("editForm").addEventListener("submit", saveEdit);
$("editCancelBtn").addEventListener("click", closeEdit);
$("deleteBtn").addEventListener("click", deleteEditing);
$("editModal").addEventListener("click", (event) => {
  if (event.target === $("editModal")) closeEdit();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !$("editModal").classList.contains("hidden")) closeEdit();
});

window.addEventListener("beforeunload", (event) => {
  if (Object.keys(state.draft).length) {
    event.preventDefault();
    event.returnValue = "";
  }
});

/* ---------- start ---------- */

if (DEMO) $("demoHint").classList.remove("hidden");

(async () => {
  const savedPin = storageGet(PIN_KEY);
  if (savedPin || DEMO) {
    try {
      await login(savedPin || "demo");
      return;
    } catch {
      storageSet(PIN_KEY, "");
    }
  }
  $("pinInput").focus();
})();
