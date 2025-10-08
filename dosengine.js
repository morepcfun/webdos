const terminalEl = document.getElementById('terminal');
const inputLine = document.querySelector('.input-line');
const inputBuffer = document.getElementById('input-buffer');
const commandHistory = [];
let historyIndex = -1;
let commandBuffer = '';
let isAppRunning = false;
const programs = {};
SystemPrograms.forEach(p => { if (p && p.name && p.program) { programs[p.name] = p.program; } });
const terminal = {
  print: (message, options = {}) => {
    const newLine = document.createElement('div');
    if (options.commandText !== undefined) {
      newLine.classList.add('output-line', 'input-line');
      const promptSpan = document.createElement('span'); promptSpan.className = 'prompt'; promptSpan.textContent = message;
      const commandSpan = document.createElement('span'); commandSpan.className = 'input-text'; commandSpan.textContent = options.commandText;
      newLine.appendChild(promptSpan); newLine.appendChild(commandSpan);
    } else {
      newLine.classList.add('output-line');
      newLine.innerHTML = message;
      if (options.color && !message.includes('<span')) newLine.style.color = options.color;
      if (options.backgroundColor) { newLine.style.backgroundColor = options.backgroundColor; newLine.style.padding = '0 0.5ch'; }
    }
    terminalEl.insertBefore(newLine, inputLine);
    window.scrollTo(0, document.body.scrollHeight);
  },
  clear: () => {
    terminalEl.querySelectorAll('.output-line').forEach(line => line.remove());
  }
};
async function processCommand(command) {
  const [cmd, ...args] = command.trim().split(' ');
  const cmdLower = cmd.toLowerCase();
  if (!cmdLower) return;
  commandHistory.push(command);
  historyIndex = commandHistory.length;
  const aliases = { 'clear': 'clear', 'cls': 'clear', 'help': 'help', '?': 'help', 'echo': 'echo', 'dir': 'dir', 'ls': 'dir' };
  const resolvedCmd = aliases[cmdLower] || cmdLower;
  if (resolvedCmd in programs) {
    isAppRunning = true;
    try { await programs[resolvedCmd].execute(terminal, args); }
    catch (error) { terminal.print(`Error in '${cmdLower}': ${error.message}`); }
    finally { isAppRunning = false; }
    return;
  }
  switch (resolvedCmd) {
    case 'clear': terminal.clear(); break;
    case 'help':
      terminal.print('Core commands: clear, help, echo, dir');
      terminal.print('Aliases: cls, ?, ls\n');
      terminal.print('Type "dir" to see a list of available programs.');
      break;
    case 'echo': terminal.print(args.join(' ')); break;
    case 'dir':
      terminal.print('Contents of C:\\\n');
      const programNames = Object.keys(programs).sort();
      programNames.forEach(pName => {
        const description = programs[pName].description || '';
        terminal.print(`${pName.padEnd(15, ' ')}${description}`);
      });
      terminal.print(`\n\t${programNames.length} Program(s)`);
      break;
    default: terminal.print(`Invalid command or file name: '${cmd}'`);
  }
}
function updateInput() {
  inputBuffer.textContent = commandBuffer;
  window.scrollTo(0, document.body.scrollHeight);
}
document.addEventListener('keydown', async (e) => {
  if (isAppRunning) return;
  if (['Enter', 'Backspace', 'ArrowUp', 'ArrowDown'].includes(e.key)) e.preventDefault();
  if (e.key === 'Enter') {
    terminal.print(`C:\\>`, { commandText: commandBuffer });
    const commandToProcess = commandBuffer;
    commandBuffer = '';
    updateInput();
    await processCommand(commandToProcess);
  } else if (e.key === 'Backspace') {
    commandBuffer = commandBuffer.slice(0, -1);
  } else if (e.key === 'ArrowUp') {
    if (historyIndex > 0) { historyIndex--; commandBuffer = commandHistory[historyIndex]; }
  } else if (e.key === 'ArrowDown') {
    if (historyIndex < commandHistory.length - 1) { historyIndex++; commandBuffer = commandHistory[historyIndex]; }
    else { historyIndex = commandHistory.length; commandBuffer = ''; }
  } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
    commandBuffer += e.key;
  }
  updateInput();
});
terminal.print('WebDOS [Version 1.0]');
terminal.print("Type 'help' for a list of commands.");