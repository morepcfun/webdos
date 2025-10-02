programs['about'] = {
    description: 'Prints information about this system.',
    execute: async (term, args) => {
        term.print("WEB-DOS [Version 1.0]");
        term.print("(c) 2025. A self-contained terminal environment.");
    }
};