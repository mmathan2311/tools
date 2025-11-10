(function(){
    // Elements
    const inputEditor = document.getElementById('input-editor');
    const outputView = document.getElementById('output-view');
    const outputEditor = document.getElementById('output-editor');

    const btnFormat = document.getElementById('btn-format');
    const btnMinify = document.getElementById('btn-minify');
    const btnValidate = document.getElementById('btn-validate');
    const btnCopy = document.getElementById('btn-copy');
    const btnClear = document.getElementById('btn-clear');
    const btnUpload = document.getElementById('btn-upload');
    const fileInput = document.getElementById('file-input');
    const btnTheme = document.getElementById('btn-theme');
    const btnSample = document.getElementById('btn-sample');
    const btnDownload = document.getElementById('btn-download');

    const btnToggleEdit = document.getElementById('btn-toggle-edit');
    const btnExpandAll = document.getElementById('btn-expand-all');
    const btnCollapseAll = document.getElementById('btn-collapse-all');

    const statusArea = document.getElementById('status-area');
    const toastEl = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');

    // LocalStorage keys
    const LS_INPUT_KEY = 'json_formatter_input_v1';
    const LS_THEME_KEY = 'json_formatter_theme_v1';

    // Theme handling
    function applyTheme(theme){
      if(theme === 'dark') document.documentElement.setAttribute('data-theme','dark');
      else document.documentElement.removeAttribute('data-theme');
      localStorage.setItem(LS_THEME_KEY, theme);
      btnTheme.title = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
    }
    (function initTheme(){
      const stored = localStorage.getItem(LS_THEME_KEY);
      if(stored) return applyTheme(stored);
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark ? 'dark' : 'light');
    })();
    btnTheme.addEventListener('click', ()=>{
      const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      applyTheme(current === 'dark' ? 'light' : 'dark');
      showToast('Theme updated', 'info');
    });

    // Toast helper
    let toastTimeout = null;
    function showToast(message, type='info', duration=2200){
      toastMessage.textContent = message;
      toastEl.classList.add('show');
      if(type === 'success') toastIcon.textContent = '✔';
      else if(type === 'error') toastIcon.textContent = '✖';
      else toastIcon.textContent = 'ℹ';
      clearTimeout(toastTimeout);
      toastTimeout = setTimeout(()=> toastEl.classList.remove('show'), duration);
    }

    // Parse helper with position extraction
    function parseJSONWithErrorPos(text){
      try {
        const value = JSON.parse(text);
        return { value, error: null };
      } catch (err){
        const msg = err && err.message ? err.message : String(err);
        // try to extract position (varies by engine)
        const m = msg.match(/position\\s*(\\d+)/i) || msg.match(/at\\sposition\\s(\\d+)/i) || msg.match(/char\\s*(\\d+)/i) || msg.match(/column:\\s*(\\d+)/i);
        let pos = null;
        if(m && m[1]) pos = parseInt(m[1],10);
        if(pos !== null && !isNaN(pos)){
          // position is likely 0-based index into string
          const before = text.slice(0,pos);
          const lines = before.split('\\n');
          const line = lines.length;
          const column = lines[lines.length -1].length + 1;
          return { value: null, error: { message: msg, position: pos, line, column } };
        }
        return { value: null, error: { message: msg, position: null, line: null, column: null } };
      }
    }

    // Render tree view (collapsible)
    function createToggle(symbol){
      const t = document.createElement('span');
      t.className = 'toggle';
      t.textContent = symbol;
      return t;
    }
    function renderKey(name){
      const k = document.createElement('span');
      k.className = 'key';
      k.textContent = JSON.stringify(String(name));
      return k;
    }
    function renderPrimitive(value){
      const span = document.createElement('span');
      if(value === null){ span.className = 'json-null'; span.textContent = 'null'; }
      else if(typeof value === 'string'){ span.className = 'json-string'; span.textContent = JSON.stringify(value); }
      else if(typeof value === 'number'){ span.className = 'json-number'; span.textContent = String(value); }
      else if(typeof value === 'boolean'){ span.className = 'json-boolean'; span.textContent = String(value); }
      else span.textContent = String(value);
      return span;
    }

    function renderObject(obj){
      const container = document.createElement('div');
      container.className = 'json-item';
      const isArray = Array.isArray(obj);

      const openBrace = document.createElement('span');
      openBrace.className = 'bracket';
      openBrace.textContent = isArray ? '[' : '{';
      const closeBrace = document.createElement('span');
      closeBrace.className = 'bracket';
      closeBrace.textContent = isArray ? ']' : '}';

      if((isArray && obj.length === 0) || (!isArray && Object.keys(obj).length === 0)){
        const line = document.createElement('div');
        line.className = 'child-row';
        line.appendChild(openBrace);
        line.appendChild(closeBrace);
        container.appendChild(line);
        return container;
      }

      const header = document.createElement('div');
      header.className = 'child-row';
      const toggle = createToggle('▾');
      header.appendChild(toggle);
      header.appendChild(openBrace);
      container.appendChild(header);

      const children = document.createElement('div');
      children.className = 'children node';

      if(isArray){
        obj.forEach((val, idx) => {
          const row = document.createElement('div');
          row.className = 'child-row';
          const indexLabel = document.createElement('span');
          indexLabel.style.opacity = '0.6';
          indexLabel.textContent = idx + ':';
          indexLabel.style.marginRight = '6px';
          row.appendChild(indexLabel);
          if(val && typeof val === 'object'){ row.appendChild(renderObject(val)); }
          else row.appendChild(renderPrimitive(val));
          children.appendChild(row);
        });
      } else {
        for(const [k,v] of Object.entries(obj)){
          const row = document.createElement('div');
          row.className = 'child-row';
          row.appendChild(renderKey(k));
          const colon = document.createElement('span');
          colon.textContent = ': ';
          row.appendChild(colon);
          if(v && typeof v === 'object'){ row.appendChild(renderObject(v)); }
          else row.appendChild(renderPrimitive(v));
          children.appendChild(row);
        }
      }
      container.appendChild(children);

      const footer = document.createElement('div');
      footer.className = 'child-row';
      footer.appendChild(closeBrace);
      container.appendChild(footer);

      toggle.addEventListener('click', ()=>{
        const isCollapsed = container.classList.toggle('collapsed');
        toggle.textContent = isCollapsed ? '▸' : '▾';
      });
      openBrace.addEventListener('click', ()=>{
        const isCollapsed = container.classList.toggle('collapsed');
        toggle.textContent = isCollapsed ? '▸' : '▾';
      });

      return container;
    }

    function renderJSON(value){
      outputView.innerHTML = '';
      const wrapper = document.createElement('div');
      wrapper.style.padding = '6px';
      if(value && typeof value === 'object'){
        const tree = renderObject(value);
        wrapper.appendChild(tree);
      } else {
        const line = document.createElement('div');
        line.className = 'json-item';
        line.appendChild(renderPrimitive(value));
        wrapper.appendChild(line);
      }
      outputView.appendChild(wrapper);
    }

    function setAllCollapsed(collapsed){
      const all = outputView.querySelectorAll('.json-item');
      all.forEach(item => {
        if(collapsed) { item.classList.add('collapsed'); const t = item.querySelector('.toggle'); if(t) t.textContent='▸'; }
        else { item.classList.remove('collapsed'); const t = item.querySelector('.toggle'); if(t) t.textContent='▾'; }
      });
    }

    // Status / stats
    function updateStatsFromText(text){
      if(!text || !text.trim()){
        statusArea.textContent = '';
        return;
      }
      const bytes = (new TextEncoder().encode(text)).length;
      const res = parseJSONWithErrorPos(text);
      if(res.error){
        // show error summary
        const e = res.error;
        if(e.line != null){
          statusArea.textContent = `Invalid JSON — line ${e.line}, col ${e.column}`;
          statusArea.style.color = getComputedStyle(document.documentElement).getPropertyValue('--danger') || 'red';
        } else {
          statusArea.textContent = `Invalid JSON`;
          statusArea.style.color = getComputedStyle(document.documentElement).getPropertyValue('--danger') || 'red';
        }
      } else {
        const v = res.value;
        const rootType = v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v;
        let countInfo = '';
        if(Array.isArray(v)) countInfo = `length: ${v.length}`;
        else if(v && typeof v === 'object') countInfo = `keys: ${Object.keys(v).length}`;
        statusArea.textContent = `${rootType} • ${countInfo} • ${bytes} bytes`;
        statusArea.style.color = getComputedStyle(document.documentElement).getPropertyValue('--muted') || '';
      }
    }

    // Error display + highlight offending line in textarea
    function displayParseError(err, sourceText){
      let msg = 'Invalid JSON';
      if(err && err.message) msg += ': ' + err.message;
      if(err && err.line != null) msg += ` (line ${err.line}, column ${err.column})`;
      statusArea.textContent = msg;
      statusArea.style.color = getComputedStyle(document.documentElement).getPropertyValue('--danger') || 'red';
      showToast(msg, 'error', 4000);

      // If position available, select the whole offending line in input editor
      if(err && typeof err.position === 'number' && typeof sourceText === 'string'){
        const pos = Math.max(0, Math.min(sourceText.length, err.position));
        // find start of line
        let lineStart = sourceText.lastIndexOf('\\n', pos-1);
        lineStart = lineStart === -1 ? 0 : lineStart + 1;
        let lineEnd = sourceText.indexOf('\\n', pos);
        lineEnd = lineEnd === -1 ? sourceText.length : lineEnd;
        try {
          inputEditor.focus();
          inputEditor.setSelectionRange(lineStart, lineEnd);
          // small scroll adjustment to ensure selection visible
          const linesBefore = sourceText.slice(0, lineStart).split('\\n').length;
          const approxScroll = Math.max(0, (linesBefore - 3) * 18);
          inputEditor.scrollTop = approxScroll;
        } catch(e){
          // ignore if browser disallows
        }
      }
    }

    // Primary actions
    let outputEditMode = false;
    function switchToEditMode(show){
      outputEditMode = show;
      if(show){
        outputEditor.style.display = '';
        outputView.style.display = 'none';
        btnToggleEdit.textContent = 'View';
      } else {
        outputEditor.style.display = 'none';
        outputView.style.display = '';
        btnToggleEdit.textContent = 'Edit';
      }
    }

    function formatJSON(){
      const text = inputEditor.value;
      if(!text || !text.trim()){ showToast('Input is empty', 'error'); return; }
      const res = parseJSONWithErrorPos(text);
      if(res.error){ displayParseError(res.error, text); return; }
      const formatted = JSON.stringify(res.value, null, 2);
      outputEditor.value = formatted;
      renderJSON(res.value);
      switchToEditMode(false);
      showToast('Formatted JSON', 'success');
      updateStatsFromText(text);
    }

    function minifyJSON(){
      const text = inputEditor.value;
      if(!text || !text.trim()){ showToast('Input is empty', 'error'); return; }
      const res = parseJSONWithErrorPos(text);
      if(res.error){ displayParseError(res.error, text); return; }
      const minified = JSON.stringify(res.value);
      outputEditor.value = minified;

      // Auto-show the minified one-liner in Edit mode so user sees result immediately
      switchToEditMode(true);

      // Keep parsed object available for viewer when toggling back
      renderJSON(res.value);

      showToast('Minified JSON (shown in Edit mode)', 'success');
      updateStatsFromText(text);
    }

    function validateJSON(){
      const text = inputEditor.value;
      if(!text || !text.trim()){ showToast('Input is empty', 'error'); return; }
      const res = parseJSONWithErrorPos(text);
      if(res.error){ displayParseError(res.error, text); return; }
      showToast('Valid JSON', 'success');
      statusArea.textContent = 'Valid JSON ✓';
      statusArea.style.color = getComputedStyle(document.documentElement).getPropertyValue('--success') || 'green';
      setTimeout(()=> updateStatsFromText(text), 1200);
    }

    function clearAll(){
      inputEditor.value = '';
      outputEditor.value = '';
      outputView.innerHTML = '';
      statusArea.textContent = '';
      localStorage.removeItem(LS_INPUT_KEY);
      showToast('Cleared', 'info', 1000);
    }

    async function copyOutput(){
      let text = '';
      if(outputEditMode) text = outputEditor.value;
      else {
        const parsed = tryParse(inputEditor.value);
        if(parsed !== null) text = JSON.stringify(parsed, null, 2);
        if(!text) text = outputView.innerText || '';
      }
      if(!text){ showToast('Nothing to copy', 'error'); return; }
      try {
        await navigator.clipboard.writeText(text);
        showToast('Copied to clipboard', 'success');
      } catch (err){
        try {
          const ta = document.createElement('textarea');
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          ta.remove();
          showToast('Copied to clipboard', 'success');
        } catch(e){ showToast('Could not copy', 'error'); }
      }
    }

    // Download output button
    function downloadOutput(){
      let text = '';
      let suggestedName = 'output.json';
      if(outputEditMode) text = outputEditor.value;
      else {
        const parsed = tryParse(inputEditor.value);
        if(parsed !== null){ text = JSON.stringify(parsed, null, 2); }
        else text = outputView.innerText || '';
      }
      if(!text){ showToast('Nothing to download', 'error'); return; }
      try {
        const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = suggestedName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showToast('Download started', 'success');
      } catch(e){
        showToast('Download failed', 'error');
      }
    }

    // Utility parse-safe
    function tryParse(text){
      const res = parseJSONWithErrorPos(text);
      return res.error ? null : res.value;
    }

    // File reading + drag/drop
    function readFile(file){
      const name = file.name || '';
      const reader = new FileReader();
      reader.onload = function(ev){
        inputEditor.value = String(ev.target.result || '');
        saveInputToLocalStorage();
        showToast('File loaded: ' + name, 'info');
        updateStatsFromText(inputEditor.value);
        const parsed = tryParse(inputEditor.value);
        if(parsed !== null) renderJSON(parsed);
      };
      reader.onerror = function(){ showToast('Could not read file', 'error'); };
      reader.readAsText(file, 'utf-8');
    }

    // Drag & drop for left pane
    function setupDragDrop(){
      const leftPane = document.getElementById('left-pane');
      ['dragenter','dragover'].forEach(ev => {
        leftPane.addEventListener(ev, e => {
          e.preventDefault(); e.stopPropagation();
          leftPane.style.boxShadow = '0 12px 40px rgba(37,99,235,0.08)';
          leftPane.style.borderColor = 'rgba(37,99,235,0.18)';
        });
      });
      ['dragleave','drop'].forEach(ev => {
        leftPane.addEventListener(ev, e => {
          e.preventDefault(); e.stopPropagation();
          leftPane.style.boxShadow = ''; leftPane.style.borderColor = '';
        });
      });
      leftPane.addEventListener('drop', e => {
        const dt = e.dataTransfer;
        if(!dt) return;
        const file = dt.files && dt.files[0];
        if(file) readFile(file);
        else {
          const text = dt.getData('text');
          if(text) inputEditor.value = text;
        }
      });
      leftPane.addEventListener('paste', e => {
        const items = e.clipboardData && e.clipboardData.files;
        if(items && items[0]) readFile(items[0]);
      });
    }

    // Toggle output edit mode handling
    btnToggleEdit.addEventListener('click', ()=>{
      if(outputEditMode){
        // switching to view: attempt to parse outputEditor content and render
        if(outputEditor.value && outputEditor.value.trim()){
          const res = parseJSONWithErrorPos(outputEditor.value);
          if(res.error){ displayParseError(res.error, outputEditor.value); showToast('Edited output is not valid JSON', 'error'); return; }
          renderJSON(res.value);
          // sync input for convenience
          inputEditor.value = inputEditor.value || outputEditor.value;
          saveInputToLocalStorage();
        }
        switchToEditMode(false);
      } else {
        // show editor: populate with formatted input if empty
        if(!outputEditor.value || !outputEditor.value.trim()){
          outputEditor.value = inputEditor.value ? formatOrRaw(inputEditor.value) : '';
        }
        switchToEditMode(true);
      }
    });

    btnCollapseAll.addEventListener('click', ()=> setAllCollapsed(true));
    btnExpandAll.addEventListener('click', ()=> setAllCollapsed(false));

    // Sample JSON
    btnSample.addEventListener('click', ()=>{
      const sample = {
        "name": "JSON Formatter",
        "version": "1.0.0",
        "features": {
          "format": true,
          "minify": true,
          "validate": true,
          "collapsible": [
            {"type":"object", "supported": true},
            {"type":"array", "supported": true}
          ]
        },
        "notes": null,
        "authors": ["Alice", "Bob"],
        "nested": {
          "level1": {
            "level2": [1,2,3, {"deep":"value"}]
          }
        }
      };
      inputEditor.value = JSON.stringify(sample, null, 2);
      saveInputToLocalStorage();
      updateStatsFromText(inputEditor.value);
      renderJSON(sample);
      showToast('Sample loaded', 'info');
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e)=>{
      const mac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmd = mac ? e.metaKey : e.ctrlKey;
      if(cmd && e.key === 'Enter'){ e.preventDefault(); formatJSON(); }
      if((cmd && (e.key === 'm' || e.key === 'M'))){ e.preventDefault(); minifyJSON(); }
      if(e.key === 'Escape'){ e.preventDefault(); clearAll(); }
    });

    // Button bindings
    btnFormat.addEventListener('click', formatJSON);
    btnMinify.addEventListener('click', minifyJSON);
    btnValidate.addEventListener('click', validateJSON);
    btnCopy.addEventListener('click', copyOutput);
    btnClear.addEventListener('click', clearAll);
    btnUpload.addEventListener('click', ()=> fileInput.click());
    fileInput.addEventListener('change', (e)=> { const f = e.target.files && e.target.files[0]; if(f) readFile(f); fileInput.value=''; });
    btnDownload.addEventListener('click', downloadOutput);

    // formatting helper
    function formatOrRaw(text){
      const res = parseJSONWithErrorPos(text);
      if(!res.error) return JSON.stringify(res.value, null, 2);
      return text;
    }

    // Autosave input to localStorage (debounced)
    let saveTimeout = null;
    function saveInputToLocalStorage(){
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(()=> {
        try {
          localStorage.setItem(LS_INPUT_KEY, inputEditor.value || '');
        } catch(e){}
      }, 300);
    }

    inputEditor.addEventListener('input', ()=>{
      saveInputToLocalStorage();
      // optimistic preview update
      clearTimeout(inputPreviewTimeout);
      inputPreviewTimeout = setTimeout(()=>{
        const parsed = tryParse(inputEditor.value);
        if(parsed !== null && !outputEditMode) renderJSON(parsed);
        updateStatsFromText(inputEditor.value);
      }, 350);
      statusArea.textContent = ''; // clear transient messages
    });

    // On load: restore input from localStorage (if present)
    (function restoreInput(){
      try {
        const saved = localStorage.getItem(LS_INPUT_KEY);
        if(saved) {
          inputEditor.value = saved;
          updateStatsFromText(saved);
          const parsed = tryParse(saved);
          if(parsed !== null) renderJSON(parsed);
        }
      } catch(e){}
    })();

    // small preview debounce var
    let inputPreviewTimeout = null;

    // Setup drag/drop
    setupDragDrop();

    // Focus first editor
    inputEditor.focus();

    // Expose helpers for debugging (optional)
    window._jsonFormatter = {
      formatJSON, minifyJSON, validateJSON, renderJSON, parseJSONWithErrorPos
    };
  })();
