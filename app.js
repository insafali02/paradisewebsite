(() => {
  const API = String(window.PARADISE_API_BASE || '').replace(/\/$/, '');
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const fmt = new Intl.NumberFormat('en-US');

  function endpoint(path) { return `${API}${path}`; }
  async function getJson(path) {
    const r = await fetch(endpoint(path), { headers: { Accept: 'application/json' }, cache: 'no-store' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  }
  function ago(value) {
    const t = new Date(value).getTime();
    if (!Number.isFinite(t)) return 'just now';
    const sec = Math.max(0, Math.floor((Date.now() - t) / 1000));
    if (sec < 60) return `${sec}s ago`;
    if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
    if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
    return `${Math.floor(sec / 86400)}d ago`;
  }
  function initials(name) { return String(name || '?').slice(0, 2).toUpperCase(); }
  function setText(selector, value) { const n = $(selector); if (n) n.textContent = value; }
  function showToast(text) { const t = $('[data-toast]'); if (!t) return; t.textContent = text; t.classList.add('show'); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => t.classList.remove('show'), 1700); }

  $$('[data-copy-ip]').forEach(btn => btn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText('paradisesmp.fun'); showToast('Server IP copied: paradisesmp.fun'); }
    catch { showToast('Server IP: paradisesmp.fun'); }
  }));

  function renderStatus(data) {
    const s = data?.status || data || {};
    const online = Boolean(data?.connected ?? s.connected);
    const count = Number(s.online || 0);
    const max = Number(s.maxPlayers || 0);
    setText('[data-status-text]', online ? 'Online' : 'Offline');
    setText('[data-player-count]', `${count} / ${max || '—'}`);
    setText('[data-online]', count);
    setText('[data-max]', max || '—');
    setText('[data-tps]', s.tps == null ? '—' : Number(s.tps).toFixed(2));
    setText('[data-version]', String(s.version || '—').replace(/^This server is running /i, '').slice(0, 26));
    setText('[data-maintenance]', s.maintenance ? 'Enabled' : 'Disabled');
    setText('[data-last-sync]', data?.updatedAt ? ago(data.updatedAt) : 'live');
    setText('[data-hero-status]', online ? 'Server online' : 'Server offline');
    setText('[data-online-count-label]', `${count} online`);
    const cap = $('[data-capacity]'); if (cap) cap.style.width = max > 0 ? `${Math.min(100, (count / max) * 100)}%` : '0%';
    const pill = $('[data-status-pill]'); if (pill) { pill.textContent = online ? 'Online' : 'Offline'; pill.classList.toggle('online', online); pill.classList.toggle('offline', !online); }
    $('[data-header-dot]')?.classList.toggle('online', online);
    $('[data-hero-status-dot]')?.classList.toggle('online', online);

    const list = $('[data-online-list]');
    if (list) {
      list.replaceChildren();
      const players = Array.isArray(s.players) ? s.players : [];
      if (!players.length) list.append(el('div', 'empty-state', online ? 'Nobody is online right now.' : 'Server is currently offline.'));
      else players.forEach(name => {
        const chip = el('div', 'player-chip');
        chip.append(el('span', 'player-face', initials(name)), el('span', '', name));
        list.append(chip);
      });
    }
  }

  const boardMeta = {
    money: { heading: 'Balance', format: v => `$${fmt.format(Number(v || 0))}` },
    kills: { heading: 'Kills', format: v => fmt.format(Number(v || 0)) },
    deaths: { heading: 'Deaths', format: v => fmt.format(Number(v || 0)) },
    playtime: { heading: 'Playtime', format: v => { const ticks = Number(v || 0); const hours = Math.floor(ticks / 20 / 3600); const mins = Math.floor((ticks / 20 % 3600) / 60); return `${hours}h ${mins}m`; } },
  };

  async function loadBoard(type = 'money') {
    const meta = boardMeta[type] || boardMeta.money;
    setText('[data-value-heading]', meta.heading);
    const list = $('[data-board-list]');
    if (!list) return;
    list.replaceChildren(el('div', 'board-loading', 'Loading leaderboard…'));
    try {
      const data = await getJson(`/api/public/leaderboards?type=${encodeURIComponent(type)}&limit=10`);
      list.replaceChildren();
      const rows = Array.isArray(data?.players) ? data.players : [];
      if (!rows.length) { list.append(el('div', 'board-loading', type === 'money' && data?.moneyAvailable === false ? 'Money leaderboard needs Vault + an economy plugin on the Minecraft server.' : 'No leaderboard data yet. Player stats will appear after the updated bridge syncs.')); return; }
      rows.forEach((p, i) => {
        const row = el('div', 'board-row');
        const rank = el('span', `rank ${i < 3 ? 'top' : ''}`, `#${i + 1}`);
        const player = el('div', 'board-player');
        player.append(el('span', 'player-face', initials(p.name)), el('span', '', p.name || 'Unknown'));
        const value = el('span', 'board-value', meta.format(p.value));
        row.append(rank, player, value); list.append(row);
      });
    } catch {
      list.replaceChildren(el('div', 'board-loading', 'Leaderboard API is not connected yet. Set the bot URL in config.js.'));
    }
  }

  $$('.tab').forEach(tab => tab.addEventListener('click', () => {
    $$('.tab').forEach(t => t.classList.remove('active')); tab.classList.add('active'); loadBoard(tab.dataset.board);
  }));

  function renderActivity(items) {
    const list = $('[data-activity-list]'); if (!list) return;
    list.replaceChildren();
    if (!items?.length) { list.append(el('div', 'empty-state', 'No recent activity yet.')); return; }
    items.slice(0, 8).forEach(item => {
      const row = el('div', 'activity-item');
      const icons = { join: '↗', quit: '↙', death: '☠' };
      const icon = el('span', 'activity-icon', icons[item.type] || '•');
      const text = el('div', 'activity-text');
      const who = el('b', '', item.player || 'Player');
      text.append(who, document.createTextNode(item.type === 'join' ? ' joined the server' : item.type === 'quit' ? ' left the server' : item.type === 'death' ? ` — ${item.message || 'died'}` : ` ${item.type || 'activity'}`));
      row.append(icon, text, el('span', 'activity-time', ago(item.createdAt)));
      list.append(row);
    });
  }

  async function loadPlayers() {
    const grid = $('[data-players-grid]'); if (!grid) return;
    try {
      const data = await getJson('/api/public/players?limit=24');
      grid.replaceChildren();
      const players = Array.isArray(data?.players) ? data.players : [];
      if (!players.length) { grid.append(el('div', 'empty-state', 'No synced players yet.')); return; }
      players.forEach(p => {
        const card = el('article', 'player-card');
        const top = el('div', 'player-card-top');
        const id = el('div', 'player-id');
        id.append(el('span', 'player-face', initials(p.name)), el('b', '', p.name || 'Unknown'));
        const dot = el('span', `online-badge ${p.online ? 'on' : ''}`);
        dot.title = p.online ? 'Online' : 'Offline';
        top.append(id, dot);
        const stats = el('div', 'player-mini-stats');
        [['Kills', fmt.format(Number(p.kills || 0))], ['Deaths', fmt.format(Number(p.deaths || 0))], ['Hours', Math.floor(Number(p.play_ticks || 0) / 20 / 3600)]].forEach(([k,v]) => {
          const box = el('div'); box.append(el('span','',k), el('strong','',v)); stats.append(box);
        });
        const last = el('div', 'player-last', p.online ? 'Online now' : (p.last_seen ? `Last seen ${ago(Number(p.last_seen))}` : 'Recently synced'));
        card.append(top, stats, last); grid.append(card);
      });
    } catch {
      grid.replaceChildren(el('div', 'empty-state', 'Player directory is waiting for the bot API connection.'));
    }
  }

  async function refreshOverview() {
    try {
      const data = await getJson('/api/public/overview');
      renderStatus(data);
      renderActivity(data.activity || []);
    } catch {
      renderStatus({ connected: false, status: { online: 0, maxPlayers: 0, players: [] } });
    }
  }

  refreshOverview(); loadBoard('money'); loadPlayers();
  setInterval(() => { refreshOverview(); loadPlayers(); }, 20000);
})();
