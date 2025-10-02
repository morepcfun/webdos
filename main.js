document.addEventListener('DOMContentLoaded', () => {
    const terminalEl = document.getElementById('terminal');
    const inputLine = document.querySelector('.input-line');
    const inputBuffer = document.getElementById('input-buffer');
    const commandHistory = [];
    let historyIndex = -1;
    let commandBuffer = '';

    // Redefine the global terminal functions
    terminal.print = (message, commandText = null) => {
        const newLine = document.createElement('div');
        if (commandText !== null) {
            newLine.classList.add('output-line', 'input-line');
            const promptSpan = document.createElement('span');
            promptSpan.className = 'prompt';
            promptSpan.textContent = message;
            const commandSpan = document.createElement('span');
            commandSpan.className = 'input-text';
            commandSpan.textContent = commandText;
            newLine.appendChild(promptSpan);
            newLine.appendChild(commandSpan);
        } else {
            newLine.classList.add('output-line');
            newLine.textContent = message;
        }
        terminalEl.insertBefore(newLine, inputLine);
    };

    terminal.clear = () => {
        terminalEl.querySelectorAll('.output-line').forEach(line => line.remove());
    };

    async function processCommand(command) {
        const [cmd, ...args] = command.trim().split(' ');
        const cmdLower = cmd.toLowerCase();
        if (!cmdLower) return;
        
        commandHistory.push(command);
        historyIndex = commandHistory.length;

        if (cmdLower in programs) {
            await programs[cmdLower].execute(terminal, args);
            return;
        }

        switch (cmdLower) {
            case 'cls':
                terminal.clear();
                break;
            case 'help':
                terminal.print('Core Commands: cls, help, echo, dir\n');
                terminal.print('Type "dir" to see a list of available programs.');
                break;
            case 'echo':
                terminal.print(args.join(' '));
                break;
            case 'dir':
                terminal.print('Directory of C:\\\n');
                const programNames = Object.keys(programs);
                if (programNames.length > 0) {
                    programNames.forEach(pName => {
                        const description = programs[pName].description || '';
                        terminal.print(`${pName.padEnd(15, ' ')}${description}`);
                    });
                }
                terminal.print(`\n\t${programNames.length} Program(s)`);
                break;
            default:
                terminal.print(`Bad command or file name: '${cmd}'`);
        }
    }

    function updateInput() {
        inputBuffer.textContent = commandBuffer;
        window.scrollTo(0, document.body.scrollHeight);
    }

    document.addEventListener('keydown', async (e) => {
        if (['Enter', 'Backspace', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
            e.preventDefault();
        }

        if (e.key === 'Enter') {
            terminal.print(`C:\\>`, commandBuffer);
            const commandToProcess = commandBuffer;
            commandBuffer = '';
            updateInput();
            await processCommand(commandToProcess);
        } else if (e.key === 'Backspace') {
            commandBuffer = commandBuffer.slice(0, -1);
        } else if (e.key === 'ArrowUp') {
            if (historyIndex > 0) {
                historyIndex--;
                commandBuffer = commandHistory[historyIndex];
            }
        } else if (e.key === 'ArrowDown') {
            if (historyIndex < commandHistory.length - 1) {
                historyIndex++;
                commandBuffer = commandHistory[historyIndex];
            } else {
                historyIndex = commandHistory.length;
                commandBuffer = '';
            }
        } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
            commandBuffer += e.key;
        }
        updateInput();
    });

    terminal.print('WEB-DOS [Version 1.0]');
});