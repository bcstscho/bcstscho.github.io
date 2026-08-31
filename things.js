(() => {
  'use strict';

  // ============================================================
  // MANIA 4K - LIVE SAVE EDITOR
  // Console usage:
  //   Paste this entire script into DevTools console.
  //
  // Default hotkey:
  //   F8 = toggle menu
  //
  // Everything ultimately edits the game's `state` object and
  // calls the game's saveState() function.
  // ============================================================

  const ID = '__M4K_LIVE_SAVE_EDITOR__';

  // Remove previous editor if pasted twice
  if (window[ID] && typeof window[ID].destroy === 'function') {
    window[ID].destroy();
  }

  // ------------------------------------------------------------
  // Access page-global lexical variables/functions.
  // The game declares `let state = ...`, so it may not be
  // available as window.state. eval() lets us reach it from
  // the page's global execution environment.
  // ------------------------------------------------------------

  const getGlobal = (name) => {
    try {
      return eval(name);
    } catch (_) {
      return undefined;
    }
  };

  const getState = () => getGlobal('state');

  const callGame = (name, ...args) => {
    try {
      const fn = getGlobal(name);
      if (typeof fn === 'function') {
        return fn(...args);
      }
    } catch (e) {
      console.warn('[M4K Editor]', name, e);
    }
  };

  // ------------------------------------------------------------
  // CSS
  // ------------------------------------------------------------

  const style = document.createElement('style');
  style.id = ID + '_STYLE';

  style.textContent = `
    #m4k-save-editor {
      position: fixed;
      left: 80px;
      top: 80px;
      width: 620px;
      height: 760px;
      min-width: 420px;
      min-height: 300px;
      z-index: 2147483647;
      background: #090a10;
      color: #eee;
      border: 1px solid #555;
      border-radius: 12px;
      box-shadow:
        0 20px 70px rgba(0,0,0,.75),
        0 0 0 1px rgba(255,255,255,.04);
      font-family: Inter, Segoe UI, system-ui, sans-serif;
      font-size: 13px;
      overflow: hidden;
      resize: both;
      user-select: none;
    }

    #m4k-save-editor * {
      box-sizing: border-box;
    }

    #m4k-save-editor .m4k-titlebar {
      height: 44px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 10px 0 14px;
      background: linear-gradient(135deg,#17182a,#10111c);
      border-bottom: 1px solid #333;
      cursor: move;
    }

    #m4k-save-editor .m4k-title {
      font-weight: 800;
      letter-spacing: .04em;
      flex: 1;
      color: #ff66aa;
    }

    #m4k-save-editor .m4k-status {
      font-size: 11px;
      color: #77dd99;
      opacity: .9;
      white-space: nowrap;
    }

    #m4k-save-editor button {
      border: 1px solid #444;
      background: #181a28;
      color: #eee;
      border-radius: 6px;
      padding: 6px 9px;
      cursor: pointer;
      font: inherit;
    }

    #m4k-save-editor button:hover {
      border-color: #ff66aa;
      background: #242438;
    }

    #m4k-save-editor .m4k-danger:hover {
      border-color: #ff5555;
      color: #ff7777;
    }

    #m4k-save-editor .m4k-toolbar {
      padding: 8px;
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      border-bottom: 1px solid #292a35;
      background: #0d0e16;
    }

    #m4k-save-editor .m4k-search {
      flex: 1;
      min-width: 180px;
      background: #141520;
      border: 1px solid #3b3c48;
      color: white;
      border-radius: 6px;
      padding: 8px 10px;
      outline: none;
    }

    #m4k-save-editor .m4k-search:focus {
      border-color: #ff66aa;
    }

    #m4k-save-editor .m4k-body {
      position: absolute;
      left: 0;
      right: 0;
      top: 92px;
      bottom: 0;
      overflow: auto;
      padding: 8px;
      user-select: text;
    }

    #m4k-save-editor .m4k-section {
      border: 1px solid #2d2e3a;
      border-radius: 8px;
      margin-bottom: 7px;
      overflow: hidden;
      background: #0e0f18;
    }

    #m4k-save-editor .m4k-section-head {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 8px 10px;
      background: #141522;
      cursor: pointer;
      user-select: none;
    }

    #m4k-save-editor .m4k-section-head:hover {
      background: #191a2a;
    }

    #m4k-save-editor .m4k-arrow {
      width: 14px;
      color: #888;
    }

    #m4k-save-editor .m4k-key {
      font-weight: 700;
      color: #ddd;
      word-break: break-all;
    }

    #m4k-save-editor .m4k-type {
      margin-left: auto;
      color: #666;
      font-size: 10px;
      text-transform: uppercase;
    }

    #m4k-save-editor .m4k-object-body {
      padding: 5px 7px 7px 21px;
    }

    #m4k-save-editor .m4k-field {
      display: grid;
      grid-template-columns: minmax(140px, 1fr) minmax(180px, 1.5fr) auto;
      gap: 7px;
      align-items: center;
      padding: 5px 0;
      border-bottom: 1px solid rgba(255,255,255,.035);
    }

    #m4k-save-editor .m4k-field:last-child {
      border-bottom: none;
    }

    #m4k-save-editor .m4k-label {
      color: #aaa;
      word-break: break-word;
    }

    #m4k-save-editor .m4k-path {
      color: #555;
      font-size: 10px;
      margin-top: 2px;
      word-break: break-all;
    }

    #m4k-save-editor input[type="number"],
    #m4k-save-editor input[type="text"],
    #m4k-save-editor textarea,
    #m4k-save-editor select {
      width: 100%;
      background: #141520;
      color: #eee;
      border: 1px solid #383945;
      border-radius: 5px;
      padding: 6px 7px;
      outline: none;
      font: inherit;
      user-select: text;
    }

    #m4k-save-editor textarea {
      min-height: 100px;
      resize: vertical;
      font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
      font-size: 11px;
    }

    #m4k-save-editor input:focus,
    #m4k-save-editor textarea:focus,
    #m4k-save-editor select:focus {
      border-color: #ff66aa;
    }

    #m4k-save-editor input[type="checkbox"] {
      width: 19px;
      height: 19px;
      accent-color: #ff66aa;
    }

    #m4k-save-editor .m4k-checkbox-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    #m4k-save-editor .m4k-number-wrap {
      display: flex;
      gap: 5px;
      align-items: center;
    }

    #m4k-save-editor .m4k-number-wrap input {
      flex: 1;
    }

    #m4k-save-editor .m4k-step {
      width: 29px;
      padding: 5px 0;
      text-align: center;
    }

    #m4k-save-editor .m4k-actions {
      display: flex;
      gap: 5px;
      justify-content: flex-end;
    }

    #m4k-save-editor .m4k-small {
      font-size: 10px;
      padding: 4px 6px;
    }

    #m4k-save-editor .m4k-array-preview {
      color: #888;
      font-size: 11px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    #m4k-save-editor .m4k-hidden {
      display: none !important;
    }

    #m4k-save-editor .m4k-bottom {
      position: sticky;
      bottom: 0;
      display: flex;
      gap: 6px;
      padding: 8px;
      margin: 8px -8px -8px;
      background: rgba(9,10,16,.95);
      border-top: 1px solid #30313c;
    }

    #m4k-save-editor .m4k-bottom button {
      flex: 1;
    }

    #m4k-save-editor .m4k-json-modal {
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      background: rgba(0,0,0,.75);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    #m4k-save-editor .m4k-json-card {
      width: min(850px, 95vw);
      height: min(700px, 90vh);
      background: #0c0d14;
      border: 1px solid #555;
      border-radius: 10px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      box-shadow: 0 20px 80px #000;
    }

    #m4k-save-editor .m4k-json-card textarea {
      flex: 1;
      resize: none;
    }

    #m4k-save-editor .m4k-toast {
      position: absolute;
      right: 12px;
      bottom: 12px;
      background: #161827;
      border: 1px solid #444;
      padding: 8px 11px;
      border-radius: 7px;
      color: #8f9;
      pointer-events: none;
      opacity: 0;
      transition: opacity .15s;
      z-index: 20;
    }

    #m4k-save-editor .m4k-toast.show {
      opacity: 1;
    }

    #m4k-save-editor .m4k-root-info {
      padding: 9px;
      background: #12131f;
      border: 1px solid #292a36;
      border-radius: 7px;
      margin-bottom: 8px;
      color: #888;
      line-height: 1.45;
    }

    #m4k-save-editor .m4k-root-info strong {
      color: #ff66aa;
    }

    @media (max-width: 700px) {
      #m4k-save-editor {
        left: 10px;
        top: 10px;
        width: calc(100vw - 20px);
        height: calc(100vh - 20px);
      }

      #m4k-save-editor .m4k-field {
        grid-template-columns: 1fr;
      }
    }
  `;

  document.head.appendChild(style);

  // ------------------------------------------------------------
  // Main element
  // ------------------------------------------------------------

  const root = document.createElement('div');
  root.id = 'm4k-save-editor';

  root.innerHTML = `
    <div class="m4k-titlebar" id="m4k-drag-handle">
      <div class="m4k-title">MANIA 4K • LIVE SAVE EDITOR</div>
      <div class="m4k-status" id="m4k-status">CONNECTED</div>
      <button id="m4k-min">−</button>
      <button id="m4k-close">×</button>
    </div>

    <div class="m4k-toolbar">
      <input
        id="m4k-search"
        class="m4k-search"
        placeholder="Search every save field…"
        autocomplete="off"
      >
      <button id="m4k-refresh">Refresh</button>
      <button id="m4k-save">Save</button>
      <button id="m4k-raw">Raw JSON</button>
      <button id="m4k-expand">Expand All</button>
      <button id="m4k-collapse">Collapse</button>
    </div>

    <div class="m4k-body" id="m4k-body"></div>

    <div class="m4k-toast" id="m4k-toast"></div>
  `;

  document.body.appendChild(root);

  const body = root.querySelector('#m4k-body');
  const search = root.querySelector('#m4k-search');
  const status = root.querySelector('#m4k-status');
  const toast = root.querySelector('#m4k-toast');

  // ------------------------------------------------------------
  // State / utility
  // ------------------------------------------------------------

  let minimized = false;
  let destroyed = false;
  let saveTimer = null;

  const expanded = new Set([
    'owned',
    'equipped',
    'profile',
    'stats',
    'rank',
    'season',
    'uiLayout',
    'crateInv'
  ]);

  const isObject = v =>
    v !== null &&
    typeof v === 'object' &&
    !Array.isArray(v);

  const isArray = Array.isArray;

  const typeOf = value => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  };

  const pretty = value => {
    if (typeof value === 'string') return value;
    if (value === null) return 'null';
    try {
      return JSON.stringify(value);
    } catch (_) {
      return String(value);
    }
  };

  const clone = value => {
    try {
      return structuredClone(value);
    } catch (_) {
      return JSON.parse(JSON.stringify(value));
    }
  };

  const showToast = (message, good = true) => {
    toast.textContent = message;
    toast.style.color = good ? '#8f9' : '#f88';
    toast.classList.add('show');

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
      toast.classList.remove('show');
    }, 1400);
  };

  // ------------------------------------------------------------
  // Path handling
  // ------------------------------------------------------------

  const pathString = path =>
    path.map(p =>
      typeof p === 'number'
        ? `[${p}]`
        : String(p).includes('.')
          ? `["${String(p)}"]`
          : String(p)
    ).join('.');

  const getAtPath = (obj, path) => {
    let cur = obj;

    for (const part of path) {
      if (cur == null) return undefined;
      cur = cur[part];
    }

    return cur;
  };

  const setAtPath = (obj, path, value) => {
    if (!path.length) return false;

    let cur = obj;

    for (let i = 0; i < path.length - 1; i++) {
      if (cur[path[i]] == null) {
        cur[path[i]] =
          typeof path[i + 1] === 'number'
            ? []
            : {};
      }

      cur = cur[path[i]];
    }

    cur[path[path.length - 1]] = value;
    return true;
  };

  const deleteAtPath = (obj, path) => {
    if (!path.length) return false;

    let cur = obj;

    for (let i = 0; i < path.length - 1; i++) {
      if (cur == null) return false;
      cur = cur[path[i]];
    }

    const key = path[path.length - 1];

    if (Array.isArray(cur)) {
      cur.splice(Number(key), 1);
    } else if (cur && Object.prototype.hasOwnProperty.call(cur, key)) {
      delete cur[key];
    } else {
      return false;
    }

    return true;
  };

  // ------------------------------------------------------------
  // Game synchronization
  //
  // The original game frequently uses saveState(), then specific
  // render/apply functions. We invoke those after editing.
  // ------------------------------------------------------------

  const syncGame = () => {
    const s = getState();

    if (!s) {
      status.textContent = 'STATE NOT FOUND';
      status.style.color = '#f66';
      return;
    }

    try {
      // Normalize common values that the game itself expects.
      if (typeof s.coins !== 'number' || !Number.isFinite(s.coins)) {
        s.coins = Number(s.coins) || 0;
      }

      // Save using the game's own function.
      callGame('saveState');

      // Reapply anything that can visibly change immediately.
      callGame('updateCoinDisplays');
      callGame('applyEquipped');
      callGame('applyFont');
      callGame('applyPlayfieldLayout');
      callGame('applyHudSettings');
      callGame('applyHorrorMode');
      callGame('updateKeyHints');
      callGame('updateRankBadge');

      // Refresh screens if available.
      callGame('renderStats');
      callGame('renderRankScreen');
      callGame('renderProfile');
      callGame('renderShop');
      callGame('renderCratesScreen');

      status.textContent = 'SAVED • LIVE';
      status.style.color = '#77dd99';

    } catch (e) {
      console.warn('[M4K Editor] sync error:', e);
      status.textContent = 'SYNC ERROR';
      status.style.color = '#ff7777';
    }
  };

  const scheduleSync = () => {
    clearTimeout(saveTimer);

    saveTimer = setTimeout(() => {
      syncGame();
    }, 30);
  };

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------

  const matchesSearch = (key, value, path, query) => {
    if (!query) return true;

    const haystack = (
      key + ' ' +
      pathString(path) + ' ' +
      pretty(value)
    ).toLowerCase();

    return haystack.includes(query.toLowerCase());
  };

  const createButton = (text, cls = '') => {
    const b = document.createElement('button');
    b.textContent = text;

    if (cls) b.className = cls;

    return b;
  };

  const renderValueControl = (key, value, path) => {
    const wrap = document.createElement('div');

    const type = typeOf(value);

    // --------------------------------------------------------
    // Number
    // --------------------------------------------------------

    if (type === 'number') {
      const numberWrap = document.createElement('div');
      numberWrap.className = 'm4k-number-wrap';

      const input = document.createElement('input');
      input.type = 'number';
      input.value = Number.isFinite(value) ? value : 0;
      input.step = Number.isInteger(value) ? '1' : '0.01';

      input.addEventListener('change', () => {
        let n = Number(input.value);

        if (!Number.isFinite(n)) n = 0;

        setAtPath(getState(), path, n);
        scheduleSync();
        showToast(`${pathString(path)} = ${n}`);
      });

      const minus = createButton('−', 'm4k-step');
      const plus = createButton('+', 'm4k-step');

      minus.addEventListener('click', () => {
        const cur = Number(getAtPath(getState(), path)) || 0;
        const step = Number.isInteger(cur) ? 1 : 0.01;

        setAtPath(getState(), path, cur - step);
        render();
        scheduleSync();
      });

      plus.addEventListener('click', () => {
        const cur = Number(getAtPath(getState(), path)) || 0;
        const step = Number.isInteger(cur) ? 1 : 0.01;

        setAtPath(getState(), path, cur + step);
        render();
        scheduleSync();
      });

      numberWrap.append(input, minus, plus);
      wrap.appendChild(numberWrap);

      return wrap;
    }

    // --------------------------------------------------------
    // Boolean
    // --------------------------------------------------------

    if (type === 'boolean') {
      const checkboxWrap = document.createElement('div');
      checkboxWrap.className = 'm4k-checkbox-wrap';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = value;

      const label = document.createElement('span');
      label.textContent = value ? 'TRUE' : 'FALSE';
      label.style.color = value ? '#77dd99' : '#888';

      checkbox.addEventListener('change', () => {
        setAtPath(getState(), path, checkbox.checked);

        label.textContent = checkbox.checked ? 'TRUE' : 'FALSE';
        label.style.color = checkbox.checked ? '#77dd99' : '#888';

        scheduleSync();
        showToast(`${pathString(path)} = ${checkbox.checked}`);
      });

      checkboxWrap.append(checkbox, label);

      return checkboxWrap;
    }

    // --------------------------------------------------------
    // String
    // --------------------------------------------------------

    if (type === 'string') {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = value;

      input.addEventListener('change', () => {
        setAtPath(getState(), path, input.value);
        scheduleSync();
        showToast(`${pathString(path)} changed`);
      });

      wrap.appendChild(input);

      return wrap;
    }

    // --------------------------------------------------------
    // Null
    // --------------------------------------------------------

    if (type === 'null') {
      const nullBox = document.createElement('div');
      nullBox.style.display = 'flex';
      nullBox.style.gap = '5px';

      const label = document.createElement('span');
      label.textContent = 'NULL';
      label.style.color = '#777';

      const edit = createButton('Set value', 'm4k-small');

      edit.addEventListener('click', () => {
        openJSONEditor(path, null);
      });

      nullBox.append(label, edit);

      return nullBox;
    }

    // --------------------------------------------------------
    // Array / Object
    // --------------------------------------------------------

    if (type === 'array' || type === 'object') {
      const box = document.createElement('div');
      box.style.display = 'flex';
      box.style.alignItems = 'center';
      box.style.gap = '5px';

      const preview = document.createElement('div');
      preview.className = 'm4k-array-preview';

      if (type === 'array') {
        preview.textContent =
          `Array(${value.length}) ` +
          value.slice(0, 4).map(v => pretty(v)).join(', ') +
          (value.length > 4 ? ' …' : '');
      } else {
        preview.textContent =
          `{ ${Object.keys(value).length} keys }`;
      }

      const edit = createButton('JSON', 'm4k-small');

      edit.addEventListener('click', () => {
        openJSONEditor(path, value);
      });

      box.append(preview, edit);

      return box;
    }

    // --------------------------------------------------------
    // Fallback
    // --------------------------------------------------------

    const fallback = document.createElement('span');
    fallback.textContent = String(value);
    fallback.style.color = '#888';

    wrap.appendChild(fallback);

    return wrap;
  };

  const renderPrimitive = (key, value, path) => {
    const row = document.createElement('div');
    row.className = 'm4k-field';

    const labelWrap = document.createElement('div');

    const label = document.createElement('div');
    label.className = 'm4k-label';
    label.textContent = key;

    const pathEl = document.createElement('div');
    pathEl.className = 'm4k-path';
    pathEl.textContent = pathString(path);

    labelWrap.append(label, pathEl);

    const control = renderValueControl(key, value, path);

    const actions = document.createElement('div');
    actions.className = 'm4k-actions';

    // Delete only if this isn't a root property.
    if (path.length > 1) {
      const del = createButton('×', 'm4k-small m4k-danger');

      del.title = 'Delete this value';

      del.addEventListener('click', () => {
        if (!confirm(`Delete ${pathString(path)}?`)) return;

        deleteAtPath(getState(), path);
        scheduleSync();
        render();
        showToast('Deleted');
      });

      actions.appendChild(del);
    }

    row.append(labelWrap, control, actions);

    return row;
  };

  const renderObject = (key, obj, path, depth = 0) => {
    const section = document.createElement('div');
    section.className = 'm4k-section';

    const pathKey = pathString(path);

    const head = document.createElement('div');
    head.className = 'm4k-section-head';

    const arrow = document.createElement('span');
    arrow.className = 'm4k-arrow';

    const title = document.createElement('span');
    title.className = 'm4k-key';
    title.textContent = key;

    const type = document.createElement('span');
    type.className = 'm4k-type';

    const isArr = Array.isArray(obj);

    type.textContent = isArr
      ? `array • ${obj.length}`
      : `object • ${Object.keys(obj).length}`;

    head.append(arrow, title, type);

    const objectBody = document.createElement('div');
    objectBody.className = 'm4k-object-body';

    const shouldOpen =
      expanded.has(pathKey) ||
      depth === 0;

    let open = shouldOpen;

    const updateArrow = () => {
      arrow.textContent = open ? '▼' : '▶';
      objectBody.style.display = open ? '' : 'none';
    };

    head.addEventListener('click', () => {
      open = !open;

      if (open) expanded.add(pathKey);
      else expanded.delete(pathKey);

      updateArrow();
    });

    updateArrow();

    const entries = isArr
      ? obj.map((v, i) => [i, v])
      : Object.entries(obj);

    const query = search.value.trim().toLowerCase();

    for (const [childKey, childValue] of entries) {
      const childPath = [...path, childKey];

      // For search, include parent if any descendant matches.
      let show = matchesSearch(
        String(childKey),
        childValue,
        childPath,
        query
      );

      if (!show && (isObject(childValue) || Array.isArray(childValue))) {
        const recursiveContains = (v, p) => {
          if (matchesSearch(String(p[p.length - 1]), v, p, query)) {
            return true;
          }

          if (isObject(v) || Array.isArray(v)) {
            const vals = Array.isArray(v)
              ? v.map((x, i) => [i, x])
              : Object.entries(v);

            for (const [k, x] of vals) {
              if (recursiveContains(x, [...p, k])) return true;
            }
          }

          return false;
        };

        show = recursiveContains(childValue, childPath);
      }

      if (query && !show) continue;

      if (isObject(childValue) || Array.isArray(childValue)) {
        objectBody.appendChild(
          renderObject(
            String(childKey),
            childValue,
            childPath,
            depth + 1
          )
        );
      } else {
        objectBody.appendChild(
          renderPrimitive(
            String(childKey),
            childValue,
            childPath
          )
        );
      }
    }

    // Add array element / object key
    if (!query) {
      const addRow = document.createElement('div');
      addRow.style.marginTop = '6px';
      addRow.style.display = 'flex';
      addRow.style.gap = '5px';

      const add = createButton(
        isArr ? '+ Add Array Value' : '+ Add Property',
        'm4k-small'
      );

      add.addEventListener('click', () => {
        if (isArr) {
          obj.push(0);
        } else {
          const keyName = prompt('Property name:');

          if (!keyName) return;

          if (Object.prototype.hasOwnProperty.call(obj, keyName)) {
            alert('That property already exists.');
            return;
          }

          obj[keyName] = 0;
        }

        scheduleSync();
        render();
      });

      addRow.appendChild(add);
      objectBody.appendChild(addRow);
    }

    section.append(head, objectBody);

    return section;
  };

  // ------------------------------------------------------------
  // Main renderer
  // ------------------------------------------------------------

  const render = () => {
    if (destroyed) return;

    const s = getState();

    if (!s) {
      body.innerHTML = `
        <div class="m4k-root-info">
          <strong>Could not access game state.</strong><br>
          Make sure this is pasted into the game's own browser
          console and that the Mania 4K page has fully loaded.
        </div>
      `;

      status.textContent = 'STATE NOT FOUND';
      status.style.color = '#ff6666';

      return;
    }

    body.innerHTML = '';

    const info = document.createElement('div');
    info.className = 'm4k-root-info';

    info.innerHTML = `
      <strong>LIVE MODE</strong><br>
      Every edit changes the game's in-memory <code>state</code>
      and is written to <code>localStorage.mania4k_save</code>.<br>
      Search works through nested objects, arrays, inventory IDs,
      titles, stats, settings, rank, season data, etc.
    `;

    body.appendChild(info);

    const query = search.value.trim();

    const entries = Object.entries(s);

    let visible = 0;

    for (const [key, value] of entries) {
      const path = [key];

      let show = matchesSearch(
        key,
        value,
        path,
        query
      );

      if (!show && (isObject(value) || Array.isArray(value))) {
        const contains = (v, p) => {
          if (matchesSearch(
            String(p[p.length - 1]),
            v,
            p,
            query
          )) {
            return true;
          }

          if (isObject(v) || Array.isArray(v)) {
            const children = Array.isArray(v)
              ? v.map((x, i) => [i, x])
              : Object.entries(v);

            for (const [k, x] of children) {
              if (contains(x, [...p, k])) return true;
            }
          }

          return false;
        };

        show = contains(value, path);
      }

      if (query && !show) continue;

      visible++;

      if (isObject(value) || Array.isArray(value)) {
        body.appendChild(
          renderObject(key, value, path, 0)
        );
      } else {
        body.appendChild(
          renderPrimitive(key, value, path)
        );
      }
    }

    if (!visible) {
      const empty = document.createElement('div');

      empty.style.padding = '30px';
      empty.style.textAlign = 'center';
      empty.style.color = '#666';

      empty.textContent = 'No save fields match your search.';

      body.appendChild(empty);
    }

    // Bottom actions
    const bottom = document.createElement('div');
    bottom.className = 'm4k-bottom';

    const refresh = createButton('Refresh UI');

    refresh.addEventListener('click', () => {
      syncGame();
      render();
      showToast('Game refreshed');
    });

    const save = createButton('Save Now');

    save.addEventListener('click', () => {
      syncGame();
      showToast('Saved');
    });

    const raw = createButton('Edit Raw Save');

    raw.addEventListener('click', () => {
      openJSONEditor([], getState());
    });

    bottom.append(refresh, save, raw);

    body.appendChild(bottom);

    status.textContent = 'CONNECTED • LIVE';
    status.style.color = '#77dd99';
  };

  // ------------------------------------------------------------
  // Raw JSON editor
  // ------------------------------------------------------------

  const openJSONEditor = (path, value) => {
    const modal = document.createElement('div');
    modal.className = 'm4k-json-modal';

    const card = document.createElement('div');
    card.className = 'm4k-json-card';

    const heading = document.createElement('div');

    heading.innerHTML = `
      <strong style="color:#ff66aa;">
        ${path.length ? pathString(path) : 'ENTIRE SAVE'}
      </strong>
      <div style="color:#777;font-size:11px;margin-top:3px;">
        JSON editor • changes are applied to the live save
      </div>
    `;

    const textarea = document.createElement('textarea');

    try {
      textarea.value = JSON.stringify(value, null, 2);
    } catch (_) {
      textarea.value = String(value);
    }

    const buttons = document.createElement('div');

    buttons.style.display = 'flex';
    buttons.style.gap = '6px';
    buttons.style.justifyContent = 'flex-end';

    const cancel = createButton('Cancel');

    cancel.addEventListener('click', () => {
      modal.remove();
    });

    const apply = createButton('Apply');

    apply.style.borderColor = '#ff66aa';

    apply.addEventListener('click', () => {
      try {
        const parsed = JSON.parse(textarea.value);

        if (path.length === 0) {
          // Replace root state in-place so references held by the
          // game remain valid.
          const state = getState();

          for (const key of Object.keys(state)) {
            delete state[key];
          }

          for (const [key, val] of Object.entries(parsed)) {
            state[key] = val;
          }
        } else {
          setAtPath(getState(), path, parsed);
        }

        modal.remove();

        syncGame();
        render();

        showToast('JSON applied');
      } catch (e) {
        alert('Invalid JSON:\n\n' + e.message);
      }
    });

    buttons.append(cancel, apply);
    card.append(heading, textarea, buttons);
    modal.appendChild(card);

    root.appendChild(modal);

    textarea.focus();
  };

  // ------------------------------------------------------------
  // Export entire save
  // ------------------------------------------------------------

  const exportSave = () => {
    const state = getState();

    if (!state) return;

    const text = JSON.stringify(state, null, 2);

    const blob = new Blob(
      [text],
      { type: 'application/json' }
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');

    a.href = url;
    a.download =
      'mania4k_save_' +
      new Date().toISOString().replace(/[:.]/g, '-') +
      '.json';

    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);

    showToast('Save exported');
  };

  // ------------------------------------------------------------
  // Import entire save
  // ------------------------------------------------------------

  const importSave = () => {
    const input = document.createElement('input');

    input.type = 'file';
    input.accept = '.json,application/json';

    input.addEventListener('change', () => {
      const file = input.files && input.files[0];

      if (!file) return;

      const reader = new FileReader();

      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result);

          if (
            !parsed ||
            typeof parsed !== 'object' ||
            Array.isArray(parsed)
          ) {
            throw new Error('Save must contain a JSON object.');
          }

          const state = getState();

          if (!state) {
            throw new Error('Game state unavailable.');
          }

          if (
            !confirm(
              'Replace the entire current save with this file?'
            )
          ) {
            return;
          }

          for (const key of Object.keys(state)) {
            delete state[key];
          }

          for (const [key, value] of Object.entries(parsed)) {
            state[key] = value;
          }

          syncGame();
          render();

          showToast('Save imported');

        } catch (e) {
          alert(
            'Could not import save:\n\n' +
            e.message
          );
        }
      };

      reader.readAsText(file);
    });

    input.click();
  };

  // ------------------------------------------------------------
  // Factory reset
  // ------------------------------------------------------------

  const resetSave = () => {
    if (
      !confirm(
        'This will wipe the current Mania 4K save.\n\n' +
        'This cannot be undone unless you exported a backup.\n\n' +
        'Continue?'
      )
    ) {
      return;
    }

    try {
      const state = getState();

      if (!state) return;

      // The game's actual factory reset normally removes the
      // localStorage entry and reloads. We do the same through
      // its own function if available.
      const resetFn = getGlobal('factoryResetAllData');

      if (typeof resetFn === 'function') {
        resetFn();
        return;
      }

      localStorage.removeItem('mania4k_save');
      location.reload();

    } catch (e) {
      console.error(e);
    }
  };

  // ------------------------------------------------------------
  // Expand / collapse
  // ------------------------------------------------------------

  const expandAll = () => {
    const s = getState();

    const walk = (obj, path = []) => {
      if (!obj || typeof obj !== 'object') return;

      if (path.length) {
        expanded.add(pathString(path));
      }

      const entries = Array.isArray(obj)
        ? obj.map((x, i) => [i, x])
        : Object.entries(obj);

      for (const [k, v] of entries) {
        if (v && typeof v === 'object') {
          walk(v, [...path, k]);
        }
      }
    };

    walk(s);
    render();
  };

  const collapseAll = () => {
    expanded.clear();
    render();
  };

  // ------------------------------------------------------------
  // Dragging
  // ------------------------------------------------------------

  const dragHandle = root.querySelector('#m4k-drag-handle');

  let dragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  const startDrag = e => {
    if (
      e.target.closest('button') ||
      e.target.closest('input')
    ) {
      return;
    }

    dragging = true;

    const rect = root.getBoundingClientRect();

    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;

    dragHandle.setPointerCapture?.(e.pointerId);

    e.preventDefault();
  };

  const moveDrag = e => {
    if (!dragging) return;

    let x = e.clientX - dragOffsetX;
    let y = e.clientY - dragOffsetY;

    const margin = 5;

    x = Math.max(
      margin,
      Math.min(
        window.innerWidth - root.offsetWidth - margin,
        x
      )
    );

    y = Math.max(
      margin,
      Math.min(
        window.innerHeight - 44 - margin,
        y
      )
    );

    root.style.left = x + 'px';
    root.style.top = y + 'px';
  };

  const stopDrag = () => {
    dragging = false;
  };

  dragHandle.addEventListener('pointerdown', startDrag);
  window.addEventListener('pointermove', moveDrag);
  window.addEventListener('pointerup', stopDrag);

  // ------------------------------------------------------------
  // Buttons
  // ------------------------------------------------------------

  root.querySelector('#m4k-close').addEventListener(
    'click',
    () => {
      root.style.display = 'none';
    }
  );

  root.querySelector('#m4k-min').addEventListener(
    'click',
    () => {
      minimized = !minimized;

      root.querySelector('.m4k-toolbar').style.display =
        minimized ? 'none' : '';

      body.style.display =
        minimized ? 'none' : '';

      root.querySelector('#m4k-min').textContent =
        minimized ? '+' : '−';

      root.style.height =
        minimized ? '44px' : '760px';
    }
  );

  root.querySelector('#m4k-refresh').addEventListener(
    'click',
    () => {
      render();
      syncGame();
      showToast('Refreshed');
    }
  );

  root.querySelector('#m4k-save').addEventListener(
    'click',
    () => {
      syncGame();
      showToast('Saved');
    }
  );

  root.querySelector('#m4k-raw').addEventListener(
    'click',
    () => {
      openJSONEditor([], getState());
    }
  );

  root.querySelector('#m4k-expand').addEventListener(
    'click',
    expandAll
  );

  root.querySelector('#m4k-collapse').addEventListener(
    'click',
    collapseAll
  );

  search.addEventListener('input', render);

  // ------------------------------------------------------------
  // Add extra buttons via toolbar
  // ------------------------------------------------------------

  const toolbar = root.querySelector('.m4k-toolbar');

  const exportBtn = createButton('Export');
  exportBtn.addEventListener('click', exportSave);

  const importBtn = createButton('Import');
  importBtn.addEventListener('click', importSave);

  const resetBtn = createButton('WIPE SAVE', 'm4k-danger');
  resetBtn.addEventListener('click', resetSave);

  toolbar.append(exportBtn, importBtn, resetBtn);

  // ------------------------------------------------------------
  // F8 hotkey
  // ------------------------------------------------------------

  const keyHandler = e => {
    if (e.key === 'F8') {
      e.preventDefault();

      if (root.style.display === 'none') {
        root.style.display = '';
        render();
      } else {
        root.style.display = 'none';
      }
    }
  };

  window.addEventListener('keydown', keyHandler, true);

  // ------------------------------------------------------------
  // Public console API
  // ------------------------------------------------------------

  const api = {
    menu: root,

    get state() {
      return getState();
    },

    refresh() {
      render();
      return getState();
    },

    save() {
      syncGame();
      return getState();
    },

    open() {
      root.style.display = '';
      render();
    },

    close() {
      root.style.display = 'none';
    },

    toggle() {
      if (root.style.display === 'none') {
        this.open();
      } else {
        this.close();
      }
    },

    get(path) {
      if (!Array.isArray(path)) {
        path = String(path)
          .split('.')
          .filter(Boolean);
      }

      return getAtPath(getState(), path);
    },

    set(path, value) {
      if (!Array.isArray(path)) {
        path = String(path)
          .split('.')
          .filter(Boolean);
      }

      setAtPath(getState(), path, value);
      syncGame();
      render();

      return getAtPath(getState(), path);
    },

    delete(path) {
      if (!Array.isArray(path)) {
        path = String(path)
          .split('.')
          .filter(Boolean);
      }

      deleteAtPath(getState(), path);
      syncGame();
      render();
    },

    export() {
      exportSave();
    },

    import() {
      importSave();
    },

    expandAll,
    collapseAll,

    raw() {
      return JSON.stringify(getState(), null, 2);
    },

    destroy() {
      destroyed = true;

      clearTimeout(saveTimer);

      window.removeEventListener(
        'keydown',
        keyHandler,
        true
      );

      window.removeEventListener(
        'pointermove',
        moveDrag
      );

      window.removeEventListener(
        'pointerup',
        stopDrag
      );

      root.remove();
      style.remove();

      delete window[ID];

      console.log(
        '%c[M4K Editor] Destroyed',
        'color:#ff66aa;font-weight:bold'
      );
    }
  };

  window[ID] = api;
  window.M4KEditor = api;

  // ------------------------------------------------------------
  // Initial render
  // ------------------------------------------------------------

  render();

  console.log(
    '%cMANIA 4K LIVE SAVE EDITOR',
    'color:#ff66aa;font-size:18px;font-weight:bold'
  );

  console.log(
    '%cF8%c = toggle editor',
    'color:#66ccff;font-weight:bold',
    'color:#ddd'
  );

  console.log(
    '%cM4KEditor%c is also available in the console.',
    'color:#77dd99;font-weight:bold',
    'color:#ddd'
  );

  console.log(
    'Examples:',
    'M4KEditor.get("coins")',
    'M4KEditor.set("coins", 999999)',
    'M4KEditor.set("stats.perfects", 9999)'
  );

})();
