// -------- START PROGRAM: ABOUT --------
const aboutProgram = {
  name: 'about',
  program: {
    description: 'Prints information about this system.',
    execute: async (term) => {
      term.print("WebDOS [Version 1.0]");
      term.print("(c) 2025. A self-contained terminal environment.");
    }
  }
};
SystemPrograms.push(aboutProgram);
// -------- END PROGRAM: ABOUT --------