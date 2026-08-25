const grid = document.querySelector('#grid');
const template = document.querySelector('#camera-card');
const players = new Map();

function destroyPlayers() {
  for (const player of players.values()) player?.destroy();
  players.clear();
}

function connect(video, camera, card) {
  const label = card.querySelector('.state span');
  const setState = (text, online = false) => {
    label.textContent = text;
    card.classList.toggle('online', online);
  };
  if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = camera.hls;
  } else if (window.Hls?.isSupported()) {
    const hls = new Hls({ liveSyncDurationCount: 2, maxLiveSyncPlaybackRate: 1.5 });
    hls.loadSource(camera.hls);
    hls.attachMedia(video);
    hls.on(Hls.Events.ERROR, (_, data) => {
      if (!data.fatal) return;
      setState('Reconectando');
      if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
      else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
      else { hls.destroy(); setTimeout(() => connect(video, camera, card), 5000); }
    });
    players.set(camera.id, hls);
  } else setState('Navegador incompatível');
  video.addEventListener('playing', () => setState('Ao vivo', true));
  video.addEventListener('waiting', () => setState('Carregando'));
  video.addEventListener('error', () => setState('Sem sinal'));
  video.play().catch(() => {});
}

function render(filter = '') {
  destroyPlayers();
  grid.replaceChildren();
  const query = filter.trim().toLocaleLowerCase('pt-BR');
  window.CAMERAS.filter(c => `${c.name} ${c.location}`.toLocaleLowerCase('pt-BR').includes(query)).forEach(camera => {
    const card = template.content.firstElementChild.cloneNode(true);
    card.querySelector('h2').textContent = camera.name;
    card.querySelector('p').textContent = camera.location;
    const video = card.querySelector('video');
    card.querySelector('button').addEventListener('click', () => card.requestFullscreen?.());
    grid.append(card);
    connect(video, camera, card);
  });
}

document.querySelector('#search').addEventListener('input', event => render(event.target.value));
document.querySelector('#columns').addEventListener('change', event => grid.className = `grid cols-${event.target.value}`);
render();
