// solution for: https://www.codewars.com/kata/58e24788e24ddee28e000053

function simple_assembler(program) {
    const memory = {};
    const { length: steps } = program;

    for (let step = 0; step < steps; step++) {
        const [operation, register, value] = program[step].split(' ');

        switch (operation) {
        case 'mov': {
            const maybeNumber = Number(value);
            memory[register] = maybeNumber === maybeNumber ? maybeNumber : memory[value];
            break;
        }
        case 'inc':
            memory[register]++;
            break;
        case 'dec':
            memory[register]--;
            break;
        case 'jnz':
            if (memory[register] === 0) break;
            step += Number(value) - 1;
            break;
        }
    }

    return memory;
}
