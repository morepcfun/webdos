// -------- START PROGRAM: EDIT --------
const editProgram = {
  name: 'edit',
  program: {
    description: 'A full-featured text and code editor with templates.',
    execute: async (term) => {
      return new Promise(resolve => {
        const CONTAINER_ID = 'editor-container-dynamic', STYLE_ID = 'editor-style-dynamic', EDITOR_ID = 'editor-textarea-dynamic', SEARCH_MODAL_ID = 'search-modal-dynamic';
        const shortcuts = [{ key: 'Ctrl + O', desc: 'Open file' }, { key: 'Ctrl + S', desc: 'Save file' }, { key: 'Alt + N', desc: 'New file (with WebDOS template)' }, { key: 'Alt + S', desc: 'Search & replace' }, { key: 'Alt + P', desc: 'Preview HTML' }, { key: 'Tab', desc: 'Indent' }, { key: 'Shift+Tab', desc: 'Outdent' }, { key: 'Alt + Q', desc: 'Quit editor' }];
        term.print("--- Code Editor Shortcuts ---");
        shortcuts.forEach(s => term.print(`${s.key.padEnd(15, ' ')}: ${s.desc}`));
        term.print("\nPress any key to start the editor...");
        let hasUnsavedChanges = false;
        const exitEditor = () => {
          document.removeEventListener('keydown', masterKeyHandler, true);
          window.removeEventListener('beforeunload', beforeUnloadHandler);
          document.getElementById(CONTAINER_ID)?.remove();
          document.getElementById(STYLE_ID)?.remove();
          document.querySelector('.input-line').style.display = 'flex';
          resolve();
        };
        const beforeUnloadHandler = (e) => { if (hasUnsavedChanges) { e.preventDefault(); e.returnValue = ''; } };
        const masterKeyHandler = (e) => {
          // Prioritize the quit command above all else
          if (e.altKey && e.key.toLowerCase() === 'q') {
            e.preventDefault();
            e.stopImmediatePropagation();
            if (hasUnsavedChanges && !confirm("You have unsaved changes. Quit anyway?")) {
              return;
            }
            exitEditor();
            return;
          }
          // Dispatch other keys to the editor's internal handler
          document.dispatchEvent(new CustomEvent('editor-global-keydown', { detail: e }));
        };
        const setupAndRun = () => {
          document.querySelector('.input-line').style.display = 'none';
          const style = document.createElement('style'); style.id = STYLE_ID;
          style.textContent = `#${CONTAINER_ID}{position:fixed;top:0;left:0;width:100%;height:100%;z-index:100}#${EDITOR_ID}{width:100%;height:100%;box-sizing:border-box;border:none;outline:none;resize:none;white-space:pre;overflow-wrap:normal;overflow:auto;background-color:var(--black);color:var(--green-6);font-family:'Menlo','Monaco','Courier New',monospace;font-size:16px;padding:10px;caret-color:var(--green-7)}.${SEARCH_MODAL_ID}-class{display:none;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:400px;background-color:var(--black);border:2px solid var(--green-5);color:var(--green-6);z-index:110;padding:20px;box-shadow:0 0 20px rgba(88,222,17,.3)}.editor-modal-close-btn{position:absolute;top:10px;right:15px;font-size:24px;color:var(--green-6);cursor:pointer;background:0 0;border:none}#${SEARCH_MODAL_ID} h2{margin-top:0;text-align:left}#${SEARCH_MODAL_ID} .input-group{margin-bottom:15px}#${SEARCH_MODAL_ID} label{display:block;margin-bottom:5px}#${SEARCH_MODAL_ID} #match-count{float:right;font-size:.8em;color:var(--green-4)}#${SEARCH_MODAL_ID} input{width:100%;background-color:var(--green-0);border:1px solid var(--green-5);color:var(--green-6);padding:5px;box-sizing:border-box}#${SEARCH_MODAL_ID} .button-group{display:flex;justify-content:space-between;gap:10px}#${SEARCH_MODAL_ID} button{flex-grow:1;background:0 0;border:1px solid var(--green-5);color:var(--green-5);padding:8px;cursor:pointer}#${SEARCH_MODAL_ID} button:hover{background-color:var(--green-5);color:var(--black)}`;
          document.head.appendChild(style);
          const container = document.createElement('div'); container.id = CONTAINER_ID;
          container.innerHTML = `<textarea id="${EDITOR_ID}" spellcheck="false" autofocus></textarea><div id="${SEARCH_MODAL_ID}" class="${SEARCH_MODAL_ID}-class"><button id="search-close" class="editor-modal-close-btn">&times;</button><h2>Search & Replace</h2><div class="input-group"><label for="find-input">Find: <span id="match-count"></span></label><input type="text" id="find-input"></div><div class="input-group"><label for="replace-input">Replace with:</label><input type="text" id="replace-input"></div><div class="button-group"><button id="find-next-btn">Find Next</button><button id="replace-btn">Replace</button><button id="replace-all-btn">Replace All</button></div></div>`;
          document.body.appendChild(container);
          initEditorLogic();
          document.addEventListener('keydown', masterKeyHandler, true);
          window.addEventListener('beforeunload', beforeUnloadHandler);
        };
        const initEditorLogic = () => {
          const editor = document.getElementById(EDITOR_ID);
          const searchModal = document.getElementById(SEARCH_MODAL_ID);
          const findInput = document.getElementById('find-input');
          let currentFileHandle = null;
          const newFile = () => {
            if (hasUnsavedChanges && !confirm("Unsaved changes will be lost. Continue?")) return;
            const template = `
const myNewProgram = {
name: 'myname',
program: {
description: 'A short description of the program.',
execute: async (term) => {
return new Promise(resolve => {
term.print("My new program is running!");
const exitProgram = () => {
// Cleanup logic, if any, goes here.
resolve();
};
exitProgram();
});
}
}
};
SystemPrograms.push(myNewProgram);`;
            editor.value = template.trim(); currentFileHandle = null; hasUnsavedChanges = false; editor.focus();
            const cursorPos = template.indexOf('myname');
            editor.setSelectionRange(cursorPos, cursorPos + 'myname'.length);
          };
          const saveFile = async () => { if (!currentFileHandle) { try { currentFileHandle = await window.showSaveFilePicker({ suggestedName: 'program.js' }); } catch (err) { return; } } try { const writable = await currentFileHandle.createWritable(); await writable.write(editor.value); await writable.close(); hasUnsavedChanges = false; } catch (err) { console.error(err); } };
          const openFile = async () => { if (hasUnsavedChanges && !confirm("Unsaved changes will be lost. Continue?")) return; try { const [fileHandle] = await window.showOpenFilePicker(); const file = await fileHandle.getFile(); editor.value = await file.text(); currentFileHandle = fileHandle; hasUnsavedChanges = false; } catch (err) { } };
          const previewCode = () => { const win = window.open(); win.document.write(editor.value); win.document.close(); };
          const toggleSearch = () => { searchModal.style.display = searchModal.style.display === 'block' ? 'none' : 'block'; if (searchModal.style.display === 'block') findInput.focus(); else editor.focus(); };
          editor.addEventListener('input', () => { hasUnsavedChanges = true; });
          editor.addEventListener('keydown', e => { if (e.key === 'Tab') { e.preventDefault(); document.execCommand('insertText', false, '  '); } });
          document.getElementById('search-close').addEventListener('click', toggleSearch);
          document.addEventListener('editor-global-keydown', e => {
            const originalEvent = e.detail;
            if (searchModal.style.display === 'block') { if (originalEvent.key === 'Escape') toggleSearch(); return; }
            const isCtrl = originalEvent.ctrlKey || originalEvent.metaKey;
            const key = originalEvent.key.toLowerCase();
            if (isCtrl && key === 's') { originalEvent.preventDefault(); saveFile(); }
            if (isCtrl && key === 'o') { originalEvent.preventDefault(); openFile(); }
            if (originalEvent.altKey && key === 'n') { originalEvent.preventDefault(); newFile(); }
            if (originalEvent.altKey && key === 'p') { originalEvent.preventDefault(); previewCode(); }
            if (originalEvent.altKey && key === 's') { originalEvent.preventDefault(); toggleSearch(); }
          });
          editor.focus();
        };
        document.addEventListener('keydown', function startHandler(e) { e.preventDefault(); e.stopImmediatePropagation(); this.removeEventListener('keydown', startHandler); setupAndRun(); }, { once: true });
      });
    }
  }
};
SystemPrograms.push(editProgram);
// -------- END PROGRAM: EDIT --------