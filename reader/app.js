let currentSource = 'articles';
let fileData = {};

const fileIconSvg = '<svg class="file-icon" width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z"/></svg>';

function processArticles(fileList) {
  const cnSuffix = '-cn.md';
  const cnFiles = new Set(fileList.filter(f => f.endsWith(cnSuffix)));
  const entries = [];
  const processed = new Set();

  for (const file of fileList) {
    if (processed.has(file)) continue;
    if (file.endsWith(cnSuffix)) {
      const base = file.slice(0, -cnSuffix.length);
      const enFile = base + '.md';
      if (fileList.includes(enFile)) {
        entries.push({ cn: file, en: enFile, bilingual: true });
        processed.add(file);
        processed.add(enFile);
      } else {
        entries.push({ cn: file, bilingual: false });
        processed.add(file);
      }
    } else {
      const base = file.slice(0, -'.md'.length);
      const cnFile = base + cnSuffix;
      if (cnFiles.has(cnFile)) {
        entries.push({ cn: cnFile, en: file, bilingual: true });
        processed.add(file);
        processed.add(cnFile);
      } else {
        entries.push({ file: file, bilingual: false });
        processed.add(file);
      }
    }
  }
  return entries;
}

const treeEl = document.getElementById('tree');
const contentBody = document.getElementById('content-body');

let contentCache = {};

function extractTitle(md) {
  const match = md.match(/^#\s+(.+)$/m);
  if (match) return match[1].trim();
  const firstLine = md.trim().split('\n')[0];
  return firstLine ? firstLine.replace(/^#+\s*/, '').trim() : 'Untitled';
}

async function fetchMd(path) {
  if (contentCache[path]) return contentCache[path];
  const res = await fetch(path);
  if (!res.ok) throw new Error('Failed to load');
  const md = await res.text();
  contentCache[path] = md;
  return md;
}

function buildGroupedTree(data) {
  const folders = Object.keys(data).sort((a, b) => b.localeCompare(a));
  folders.forEach((folder, idx) => {
    const folderEl = document.createElement('div');
    folderEl.className = 'folder';

    const headerEl = document.createElement('div');
    headerEl.className = 'folder-header';
    headerEl.innerHTML = `
      <span class="arrow${idx === 0 ? ' open' : ''}">&#9654;</span>
      <svg class="folder-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75Z"/>
      </svg>
      <span>${folder}</span>
    `;

    const listEl = document.createElement('div');
    listEl.className = 'file-list' + (idx === 0 ? ' open' : '');

    const entries = processArticles(data[folder]);
    entries.forEach(entry => {
      const itemEl = document.createElement('div');
      itemEl.className = 'file-item';

      if (entry.bilingual) {
        itemEl.dataset.cn = `articles/${folder}/${entry.cn}`;
        itemEl.dataset.en = `articles/${folder}/${entry.en}`;
        itemEl.dataset.bilingual = 'true';
        itemEl.innerHTML = `${fileIconSvg}<span class="file-name">${entry.cn}</span><span class="bilingual-badge">CN / EN</span>`;
        preloadTitle(`articles/${folder}`, entry.cn, itemEl);
        preloadContent(`articles/${folder}`, entry.en);
      } else {
        const file = entry.cn || entry.file;
        itemEl.dataset.file = `articles/${folder}/${file}`;
        itemEl.innerHTML = `${fileIconSvg}<span class="file-name">${file}</span>`;
        preloadTitle(`articles/${folder}`, file, itemEl);
      }

      itemEl.addEventListener('click', () => handleClick(itemEl));
      listEl.appendChild(itemEl);
    });

    headerEl.addEventListener('click', () => {
      headerEl.querySelector('.arrow').classList.toggle('open');
      listEl.classList.toggle('open');
    });

    folderEl.appendChild(headerEl);
    folderEl.appendChild(listEl);
    treeEl.appendChild(folderEl);
  });
}

function buildFlatTree(files) {
  files.forEach(file => {
    const itemEl = document.createElement('div');
    itemEl.className = 'file-item flat';
    itemEl.dataset.file = `scratch/${file}`;
    itemEl.innerHTML = `${fileIconSvg}<span class="file-name">${file}</span>`;
    itemEl.addEventListener('click', () => handleClick(itemEl));
    treeEl.appendChild(itemEl);
  });
}

async function preloadContent(folder, file) {
  try { await fetchMd(`${folder}/${file}`); } catch (e) { /* ignore */ }
}

async function preloadTitle(folder, file, itemEl) {
  try {
    const md = await fetchMd(`${folder}/${file}`);
    const title = extractTitle(md);
    const el = itemEl.querySelector('.file-name');
    if (el) el.textContent = title;
  } catch (e) { /* ignore */ }
}

async function handleClick(itemEl) {
  document.querySelectorAll('.file-item.active').forEach(el => el.classList.remove('active'));
  itemEl.classList.add('active');

  const filePath = itemEl.dataset.bilingual === 'true' ? itemEl.dataset.cn : itemEl.dataset.file;
  const url = new URL(window.location);
  url.searchParams.set('source', currentSource);
  url.searchParams.set('file', filePath);
  history.pushState({ source: currentSource, file: filePath }, '', url);

  if (itemEl.dataset.bilingual === 'true') {
    await loadContent([itemEl.dataset.cn, itemEl.dataset.en]);
  } else {
    await loadContent([itemEl.dataset.file]);
  }
}

function renderPane(path, html) {
  return `
    <div class="pane" data-path="${path}">
      <div class="pane-header">
        <span>${path}</span>
        <button class="notes-btn" data-notes-path="${path}">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H8.06l-2.573 2.573A1.458 1.458 0 0 1 3 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25Zm1.75-.25a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h6.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25Zm11 3a.75.75 0 0 1-.75.75h-8.5a.75.75 0 0 1 0-1.5h8.5a.75.75 0 0 1 .75.75Zm-.75 3.25a.75.75 0 0 1 0 1.5h-8.5a.75.75 0 0 1 0-1.5Z"/></svg>
        </button>
      </div>
      <div class="pane-body">
        <article class="markdown-body">${html}</article>
      </div>
    </div>
  `;
}

async function loadContent(paths) {
  closeNotesModal();
  let markdowns;
  try {
    markdowns = await Promise.all(paths.map(p => fetchMd(p)));
  } catch (e) {
    contentBody.innerHTML = '<div class="placeholder">Failed to load file</div>';
    return;
  }

  const dual = paths.length > 1;
  contentBody.className = `content-body${dual ? ' dual' : ''}`;
  contentBody.innerHTML = paths.map((p, i) => renderPane(p, marked.parse(markdowns[i]))).join('');

  const panes = contentBody.querySelectorAll('.pane');
  for (let i = 0; i < panes.length; i++) {
    await applyNotes(paths[i], panes[i].querySelector('.markdown-body'));
  }

  if (dual) {
    const paneBodies = contentBody.querySelectorAll('.pane-body');
    let syncing = false;
    paneBodies.forEach((pane, i) => {
      pane.addEventListener('scroll', () => {
        if (syncing) return;
        syncing = true;
        const other = paneBodies[1 - i];
        const ratio = pane.scrollTop / (pane.scrollHeight - pane.clientHeight || 1);
        other.scrollTop = ratio * (other.scrollHeight - other.clientHeight);
        syncing = false;
      });
    });
  }
}

async function loadSource(source) {
  currentSource = source;
  contentCache = {};
  treeEl.innerHTML = '';

  try {
    const res = await fetch(`/api/files?source=${source}`);
    const result = await res.json();
    fileData = result.data;
    if (result.type === 'grouped') {
      buildGroupedTree(fileData);
    } else {
      buildFlatTree(fileData);
    }
  } catch (e) {
    treeEl.innerHTML = '<div style="padding:16px;color:#656d76;font-size:13px">Failed to load</div>';
  }
}

async function switchSource(source) {
  document.querySelectorAll('.source-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.source-tab[data-source="${source}"]`).classList.add('active');

  await loadSource(source);

  const url = new URL(window.location);
  url.searchParams.set('source', source);
  url.searchParams.delete('file');
  history.pushState({}, '', url);

  contentBody.className = 'content-body';
  contentBody.innerHTML = '<div class="placeholder">Select a file from the sidebar</div>';
}

document.getElementById('source-switcher').addEventListener('click', (e) => {
  const tab = e.target.closest('.source-tab');
  if (!tab || tab.dataset.source === currentSource) return;
  switchSource(tab.dataset.source);
});

async function init() {
  const params = new URLSearchParams(window.location.search);
  const source = params.get('source') || 'articles';
  const file = params.get('file');

  if (source !== 'articles') {
    document.querySelectorAll('.source-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.source-tab[data-source="${source}"]`)?.classList.add('active');
  }

  await loadSource(source);
  if (file) openFileFromParam(file);
}
init();

function openFileFromParam(filePath) {
  if (!filePath) return;
  if (!filePath.startsWith('articles/') && !filePath.startsWith('scratch/')) {
    filePath = 'articles/' + filePath;
  }
  const target = document.querySelector(`.file-item[data-cn="${CSS.escape(filePath)}"]`)
    || document.querySelector(`.file-item[data-file="${CSS.escape(filePath)}"]`);
  if (!target) return;
  const fileList = target.closest('.file-list');
  if (fileList && !fileList.classList.contains('open')) {
    fileList.classList.add('open');
    const arrow = fileList.previousElementSibling?.querySelector('.arrow');
    if (arrow) arrow.classList.add('open');
  }
  document.querySelectorAll('.file-item.active').forEach(el => el.classList.remove('active'));
  target.classList.add('active');
  if (target.dataset.bilingual === 'true') {
    loadContent([target.dataset.cn, target.dataset.en]);
  } else {
    loadContent([target.dataset.file]);
  }
}

window.addEventListener('popstate', () => {
  const params = new URLSearchParams(window.location.search);
  const source = params.get('source') || 'articles';
  const filePath = params.get('file');

  if (source !== currentSource) {
    switchSource(source).then(() => {
      if (filePath) openFileFromParam(filePath);
    });
  } else if (filePath) {
    openFileFromParam(filePath);
  } else {
    document.querySelectorAll('.file-item.active').forEach(el => el.classList.remove('active'));
    contentBody.className = 'content-body';
    contentBody.innerHTML = '<div class="placeholder">Select a file from the sidebar</div>';
  }
});

// ==================== Notes system ====================

const notesCache = {};

async function fetchNotes(filePath) {
  const notesPath = filePath.replace('.md', '.notes.json');
  try {
    const res = await fetch(notesPath + '?t=' + Date.now());
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    return [];
  }
}

async function saveNotes(filePath, notes) {
  notesCache[filePath] = notes;
  await fetch('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file: filePath, notes })
  });
}

function getTextNodes(el) {
  const nodes = [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) nodes.push(node);
  return nodes;
}

function findPositionAtOffset(textNodes, globalOffset) {
  let cumulative = 0;
  for (const node of textNodes) {
    const len = node.textContent.length;
    if (cumulative + len > globalOffset) {
      return { node, offset: globalOffset - cumulative };
    }
    cumulative += len;
  }
  const lastNode = textNodes[textNodes.length - 1];
  return { node: lastNode, offset: lastNode.textContent.length };
}

function getGlobalOffset(container, targetNode, targetOffset) {
  const textNodes = getTextNodes(container);
  let cumulative = 0;
  for (const node of textNodes) {
    if (node === targetNode) return cumulative + targetOffset;
    cumulative += node.textContent.length;
  }
  return cumulative;
}

function highlightRange(container, startOffset, endOffset, noteId, hasNote) {
  const textNodes = getTextNodes(container);
  let cumulative = 0;
  const marks = [];

  for (const node of textNodes) {
    const nodeStart = cumulative;
    const nodeEnd = cumulative + node.textContent.length;
    cumulative = nodeEnd;

    const overlapStart = Math.max(startOffset, nodeStart);
    const overlapEnd = Math.min(endOffset, nodeEnd);
    if (overlapStart >= overlapEnd) continue;

    const localStart = overlapStart - nodeStart;
    const localEnd = overlapEnd - nodeStart;

    const textSlice = node.textContent.slice(localStart, localEnd);
    if (!textSlice.trim()) continue;

    const range = document.createRange();
    range.setStart(node, localStart);
    range.setEnd(node, localEnd);

    const mark = document.createElement('mark');
    mark.className = 'note-highlight' + (hasNote ? ' has-note' : '');
    mark.dataset.noteId = noteId;
    range.surroundContents(mark);
    marks.push(mark);
  }

  return marks;
}

async function applyNotes(filePath, container) {
  if (!container) return;
  const notes = await fetchNotes(filePath);
  notesCache[filePath] = notes;
  container.dataset.filePath = filePath;

  const sorted = [...notes].sort((a, b) => a.startOffset - b.startOffset);

  for (let i = sorted.length - 1; i >= 0; i--) {
    const note = sorted[i];
    highlightRange(container, note.startOffset, note.endOffset, note.id, !!note.note);
  }
}

// ---- Note input popover ----
let activePopover = null;

function removePendingHighlights() {
  document.querySelectorAll('.note-highlight-pending').forEach(m => {
    const parent = m.parentNode;
    while (m.firstChild) parent.insertBefore(m.firstChild, m);
    m.remove();
  });
}

function removePopover() {
  if (activePopover) {
    activePopover.remove();
    activePopover = null;
  }
  removePendingHighlights();
}

function showNoteInput(x, y, callback) {
  if (activePopover) {
    activePopover.remove();
    activePopover = null;
  }

  const popover = document.createElement('div');
  popover.className = 'note-input-popover';
  popover.innerHTML = `
    <input type="text" placeholder="Write a note... (Enter to save, empty to just highlight)">
    <button class="btn-save">Save</button>
    <button class="btn-highlight">Highlight only</button>
  `;

  document.body.appendChild(popover);
  activePopover = popover;

  const rect = popover.getBoundingClientRect();
  let left = x - rect.width / 2;
  let top = y + 8;
  if (left < 8) left = 8;
  if (left + rect.width > window.innerWidth - 8) left = window.innerWidth - 8 - rect.width;
  if (top + rect.height > window.innerHeight - 8) top = y - rect.height - 8;
  popover.style.left = left + 'px';
  popover.style.top = top + 'px';

  const input = popover.querySelector('input');
  input.focus();

  const save = (note) => {
    removePopover();
    callback(note);
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      save(input.value);
    } else if (e.key === 'Escape') {
      removePopover();
    }
  });

  popover.querySelector('.btn-save').addEventListener('click', () => save(input.value));
  popover.querySelector('.btn-highlight').addEventListener('click', () => save(''));
}

// ---- Click on existing highlight to edit/delete ----
document.addEventListener('click', (e) => {
  if (activePopover) return;

  const mark = e.target.closest('mark.note-highlight');
  if (!mark) return;

  const noteId = Number(mark.dataset.noteId);
  const container = mark.closest('.markdown-body');
  if (!container) return;

  const filePath = container.dataset.filePath;
  const notes = notesCache[filePath] || [];
  const note = notes.find(n => n.id === noteId);
  if (!note) return;

  window.getSelection().removeAllRanges();

  removeTooltip();

  const rect = mark.getBoundingClientRect();
  const px = rect.left + rect.width / 2;
  const py = rect.bottom;

  removePopover();

  const popover = document.createElement('div');
  popover.className = 'note-input-popover';
  popover.innerHTML = `
    <input type="text" placeholder="Write a note... (Enter to save, empty to just highlight)">
    <button class="btn-save">Save</button>
    <button class="btn-delete">Delete</button>
  `;

  document.body.appendChild(popover);
  activePopover = popover;

  const popRect = popover.getBoundingClientRect();
  let left = px - popRect.width / 2;
  let top = py + 8;
  if (left < 8) left = 8;
  if (left + popRect.width > window.innerWidth - 8) left = window.innerWidth - 8 - popRect.width;
  if (top + popRect.height > window.innerHeight - 8) top = rect.top - popRect.height - 8;
  popover.style.left = left + 'px';
  popover.style.top = top + 'px';

  const input = popover.querySelector('input');
  input.value = note.note || '';
  input.focus();

  const saveEdit = async (newNote) => {
    removePopover();
    note.note = newNote;
    await saveNotes(filePath, notes);
    reloadCurrentFile();
  };

  const deleteNote = async () => {
    removePopover();
    const idx = notes.findIndex(n => n.id === noteId);
    if (idx !== -1) notes.splice(idx, 1);
    await saveNotes(filePath, notes);
    reloadCurrentFile();
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit(input.value);
    } else if (e.key === 'Escape') {
      removePopover();
    }
  });

  popover.querySelector('.btn-save').addEventListener('click', () => saveEdit(input.value));
  popover.querySelector('.btn-delete').addEventListener('click', () => deleteNote());
});

// ---- Selection handler ----
let noteFab = null;

function removeNoteFab() {
  if (noteFab) {
    noteFab.remove();
    noteFab = null;
  }
}

document.addEventListener('mouseup', (e) => {
  if (activePopover && activePopover.contains(e.target)) return;
  if (noteFab && noteFab.contains(e.target)) return;
  if (e.target.closest('mark.note-highlight')) return;

  removeNoteFab();

  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;

  const range = sel.getRangeAt(0);
  const container = range.commonAncestorContainer.nodeType === 1
    ? range.commonAncestorContainer.closest('.markdown-body')
    : range.commonAncestorContainer.parentElement?.closest('.markdown-body');
  if (!container || !container.dataset.filePath) return;

  const selectedText = sel.toString().trim();
  if (!selectedText) return;

  const rects = range.getClientRects();
  const lastRect = rects[rects.length - 1];

  const fab = document.createElement('div');
  fab.className = 'note-fab';
  fab.innerHTML = '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z"/></svg>';

  let left = lastRect.right + 4;
  let top = lastRect.top + (lastRect.height - 28) / 2;
  if (left + 36 > window.innerWidth) left = lastRect.left - 32;
  if (top < 4) top = 4;
  fab.style.left = left + 'px';
  fab.style.top = top + 'px';

  fab.addEventListener('mousedown', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
  });

  fab.addEventListener('click', (ev) => {
    ev.stopPropagation();
    removeNoteFab();

    const currentSel = window.getSelection();
    if (!currentSel || currentSel.isCollapsed) return;

    const currentRange = currentSel.getRangeAt(0);
    const filePath = container.dataset.filePath;
    const startOffset = getGlobalOffset(container, currentRange.startContainer, currentRange.startOffset);
    const endOffset = getGlobalOffset(container, currentRange.endContainer, currentRange.endOffset);
    const text = currentSel.toString().trim();

    const px = lastRect.right;
    const py = lastRect.bottom;

    const pendingMarks = highlightRange(container, startOffset, endOffset, 'pending', false);
    pendingMarks.forEach(m => { m.className = 'note-highlight-pending'; });
    currentSel.removeAllRanges();

    const removePendingMarks = () => {
      pendingMarks.forEach(m => {
        const parent = m.parentNode;
        while (m.firstChild) parent.insertBefore(m.firstChild, m);
        m.remove();
      });
    };

    showNoteInput(px, py, async (noteText) => {
      removePendingMarks();

      const notes = notesCache[filePath] || [];
      const newNote = {
        id: Date.now(),
        startOffset,
        endOffset,
        text,
        note: noteText
      };
      notes.push(newNote);
      await saveNotes(filePath, notes);
      reloadCurrentFile();
    });
  });

  document.body.appendChild(fab);
  noteFab = fab;
});

// Close popover and fab when clicking outside
document.addEventListener('mousedown', (e) => {
  if (noteFab && !noteFab.contains(e.target)) {
    removeNoteFab();
  }
  if (activePopover && !activePopover.contains(e.target)) {
    removePopover();
  }
});

// ---- Tooltip on hover ----
let tooltip = null;

function removeTooltip() {
  if (tooltip) {
    tooltip.remove();
    tooltip = null;
  }
}

document.addEventListener('mouseover', (e) => {
  const mark = e.target.closest('mark.note-highlight.has-note');
  if (!mark) return;

  const noteId = Number(mark.dataset.noteId);
  const container = mark.closest('.markdown-body');
  if (!container) return;

  const filePath = container.dataset.filePath;
  const notes = notesCache[filePath] || [];
  const note = notes.find(n => n.id === noteId);
  if (!note || !note.note) return;

  removeTooltip();
  tooltip = document.createElement('div');
  tooltip.className = 'note-tooltip';
  tooltip.textContent = note.note;
  document.body.appendChild(tooltip);

  const rect = mark.getBoundingClientRect();
  const ttRect = tooltip.getBoundingClientRect();
  let left = rect.left + rect.width / 2 - ttRect.width / 2;
  let top = rect.top - ttRect.height - 6;
  if (left < 8) left = 8;
  if (top < 8) top = rect.bottom + 6;
  tooltip.style.left = left + 'px';
  tooltip.style.top = top + 'px';
});

document.addEventListener('mouseout', (e) => {
  const mark = e.target.closest('mark.note-highlight.has-note');
  if (mark) removeTooltip();
});

// ---- Notes list modal ----
let notesModal = null;

function closeNotesModal() {
  if (notesModal) {
    notesModal.remove();
    notesModal = null;
  }
}

function openNotesModal(filePath) {
  closeNotesModal();
  const notes = notesCache[filePath] || [];

  const overlay = document.createElement('div');
  overlay.className = 'notes-overlay';

  let bodyHtml;
  if (notes.length === 0) {
    bodyHtml = '<div class="notes-modal-empty">No notes yet</div>';
  } else {
    bodyHtml = notes.map(n => `
    <div class="notes-modal-item">
      <div class="notes-modal-quote">${escapeHtml(n.text)}</div>
      ${n.note ? `<div class="notes-modal-note">${escapeHtml(n.note)}</div>` : ''}
    </div>
  `).join('');
  }

  overlay.innerHTML = `
    <div class="notes-modal">
      <div class="notes-modal-body">${bodyHtml}</div>
    </div>
  `;

  overlay.addEventListener('mousedown', (e) => {
    if (e.target === overlay) closeNotesModal();
  });

  const onKeydown = (e) => {
    if (e.key === 'Escape') {
      closeNotesModal();
      document.removeEventListener('keydown', onKeydown);
    }
  };
  document.addEventListener('keydown', onKeydown);

  document.body.appendChild(overlay);
  notesModal = overlay;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

document.addEventListener('click', (e) => {
  const btn = e.target.closest('.notes-btn');
  if (!btn) return;
  e.stopPropagation();
  openNotesModal(btn.dataset.notesPath);
});

// ---- Reload current article to re-apply highlights ----
function reloadCurrentFile() {
  const filePath = new URLSearchParams(window.location.search).get('file');
  if (filePath) openFileFromParam(filePath);
}

// Sidebar resize handle
const sidebar = document.getElementById('sidebar');
const resizeHandle = document.getElementById('resize-handle');
let isResizing = false;

resizeHandle.addEventListener('mousedown', (e) => {
  isResizing = true;
  resizeHandle.classList.add('active');
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
  e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
  if (!isResizing) return;
  const newWidth = e.clientX;
  const min = parseInt(getComputedStyle(sidebar).minWidth);
  const max = window.innerWidth * 0.5;
  if (newWidth >= min && newWidth <= max) {
    sidebar.style.width = newWidth + 'px';
  }
});

document.addEventListener('mouseup', () => {
  if (!isResizing) return;
  isResizing = false;
  resizeHandle.classList.remove('active');
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
});
