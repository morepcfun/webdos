// -------- START PROGRAM: COLORS --------
const colorsProgram = {
  name: 'colors',
  program: {
    description: 'Displays all 8 colors in the system palette.',
    execute: async (term) => {
      term.print('--- Testing the system 8-color palette ---');
      for (let i = 0; i <= 7; i++) {
        const colorVar = `var(--green-${i})`;
        term.print(`Sample text in --green-${i}`, { color: colorVar });
      }
      term.print('--- End of palette ---', {
        color: 'var(--black)',
        backgroundColor: 'var(--green-7)'
      });
    }
  }
};
SystemPrograms.push(colorsProgram);
// -------- END PROGRAM: COLORS --------