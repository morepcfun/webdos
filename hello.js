programs['hello'] = {
    description: 'A simple hello world program.',
    execute: async (term, args) => {
        term.print("Hello from an external file!");
        if (args.length > 0) {
            term.print(`You passed in these arguments: ${args.join(', ')}`);
        }
    }
};