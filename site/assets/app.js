const grid = document.getElementById("cameraGrid");
const searchInput = document.getElementById("searchInput");
const gridSelect = document.getElementById("gridSelect");
const refreshBtn = document.getElementById("refreshBtn");
const onlineCount = document.getElementById("onlineCount");
const totalCount = document.getElementById("totalCount");
const emptyState = document.getElementById("emptyState");

const players = new Map();
let cameras = Array.isArray(window.CAMERAS) ? window.CAMERAS : [];
let online = new Set();

function setStatus(id, status, text) {
  const badge = document.querySelector(`[data-badge="${id}"]`);
  if (!badge) return;
  badge.className = `badge ${status}`;
  badge.textContent = text;

  if (status === "online") online.add(id);
  else online.delete(id);

  onlineCount.textContent = online.size;
}

function destroyPlayer(id) {
  const player = players.get(id);
  if (player) {
    player.destroy();
    players.delete(id);
  }
}

function initVideo(camera) {
  const video = document.getElementById(`video-${camera.id}`);
  const errorBox = document.getElementById(`error-${camera.id}`);
  if (!video) return;

  destroyPlayer(camera.id);
  errorBox.classList.add("hidden");
  setStatus(camera.id, "", "Conectando");

  if (!camera.hls) {
    errorBox.innerHTML = "<strong>Sem stream configurado</strong>Defina a URL HLS em config/cameras.js";
    errorBox.classList.remove("hidden");
    setStatus(camera.id, "error", "Sem stream");
    return;
  }

  const markOnline = () => {
    errorBox.classList.add("hidden");
    setStatus(camera.id, "online", "AO VIVO");
  };

  const markError = () => {
    errorBox.innerHTML = "<strong>Stream indisponível</strong>Verifique o gateway RTSP → HLS e a URL configurada.";
    errorBox.classList.remove("hidden");
    setStatus(camera.id, "error", "Offline");
  };

  video.addEventListener("playing", markOnline, { once: true });
  video.addEventListener("error", markError, { once: true });

  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = camera.hls;
    video.play().catch(() => {});
    return;
  }

  if (window.Hls && Hls.isSupported()) {
    const hls = new Hls({
      lowLatencyMode: true,
      backBufferLength: 30,
      liveSyncDurationCount: 2,
      liveMaxLatencyDurationCount: 5
    });

    players.set(camera.id, hls);
    hls.loadSource(camera.hls);
    hls.attachMedia(video);

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      video.play().catch(() => {});
    });

    hls.on(Hls.Events.ERROR, (_, data) => {
      if (data.fatal) {
        markError();
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          setTimeout(() => {
            try { hls.startLoad(); } catch (_) {}
          }, 3000);
        }
      }
    });
  } else {
    markError();
  }
}

function cameraCard(camera) {
  const article = document.createElement("article");
  article.className = "camera-card";
  article.dataset.search = `${camera.name} ${camera.location || ""}`.toLowerCase();

  article.innerHTML = `
    <div class="video-wrap">
      <video id="video-${camera.id}" autoplay muted playsinline controls></video>
      <div class="video-overlay"></div>
      <div class="badge" data-badge="${camera.id}">Conectando</div>
      <div id="error-${camera.id}" class="error-message hidden"></div>
    </div>
    <div class="camera-info">
      <div>
        <h2>${escapeHtml(camera.name)}</h2>
        <p>${escapeHtml(camera.location || "Sem localização")}</p>
      </div>
      <div class="camera-actions">
        <button class="icon-btn" data-refresh="${camera.id}" title="Reconectar">↻</button>
        <button class="icon-btn" data-fullscreen="${camera.id}" title="Tela cheia">⛶</button>
      </div>
    </div>
  `;

  return article;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function render() {
  grid.innerHTML = "";
  online.clear();
  totalCount.textContent = cameras.length;
  onlineCount.textContent = "0";

  cameras.forEach(camera => grid.appendChild(cameraCard(camera)));
  cameras.forEach(initVideo);

  applySearch();
}

function applySearch() {
  const term = searchInput.value.trim().toLowerCase();
  let visible = 0;

  document.querySelectorAll(".camera-card").forEach(card => {
    const show = !term || card.dataset.search.includes(term);
    card.classList.toggle("hidden", !show);
    if (show) visible++;
  });

  emptyState.classList.toggle("hidden", visible !== 0);
}

searchInput.addEventListener("input", applySearch);

gridSelect.addEventListener("change", () => {
  grid.className = `camera-grid cols-${gridSelect.value}`;
});

refreshBtn.addEventListener("click", () => {
  cameras.forEach(initVideo);
});

grid.addEventListener("click", event => {
  const refreshId = event.target.dataset.refresh;
  if (refreshId) {
    const camera = cameras.find(c => c.id === refreshId);
    if (camera) initVideo(camera);
    return;
  }

  const fullscreenId = event.target.dataset.fullscreen;
  if (fullscreenId) {
    const video = document.getElementById(`video-${fullscreenId}`);
    if (video?.requestFullscreen) video.requestFullscreen();
    else if (video?.webkitEnterFullscreen) video.webkitEnterFullscreen();
  }
});

render();
