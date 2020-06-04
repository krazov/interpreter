// solution for: https://www.codewars.com/kata/58e61f3d8ff24f774400002c/solutions/javascript

function parsedProgram(programInput) {
    return programInput
        .split(/\n/)
        .reduce(
            (memory, line) => {
                const lineWithoutComment = line.replace(/;.*$/, '').trim();

                if (lineWithoutComment) {
                    memory.program.push(lineWithoutComment);

                    if (/^\w+:$/.test(lineWithoutComment)) {
                        memory.functions[lineWithoutComment.slice(0, -1)] = memory.program.length - 1;
                    }

                    if (!memory.hasMissingEnd && lineWithoutComment == 'end') {
                        memory.hasMissingEnd = true;
                    }
                }

                return memory;
            },
            { program: [], functions: {}, hasMissingEnd: false },
        );
}

function safeKey(key) {
    return key.replace(/,$/, '');
}

function parsedValue(registry, value) {
    if (/'.+'/.test(value)) {
        return value.slice(1, -1);
    }

    const number = Number(value);
    if (number == number) {
        return number;
    }

    const fromRegistry = registry[safeKey(value)];
    if (fromRegistry !== undefined) {
        return fromRegistry;
    }

    return value;
}

function byWhiteSpace(line) {
    return line.split(/\s+/);
}

function byMsgFormat(line) {
    const outcome = [];
    const regex = /\w+|'[\w\s:()+-=\/!^]+'/g;
    const next = () => regex.exec(line);

    for (let match = next(); match !== null; match = next()) {
        outcome.push(match[0]);
    }

    return outcome;
}

function assemblerInterpreter(programInput) {
    const { program, functions, hasMissingEnd } = parsedProgram(programInput);

    if (hasMissingEnd) return -1;

    const programSize = program.length;

    const registry = {};
    let output = [];

    const parsed = parsedValue.bind(null, registry);

    for (const head = [0]; head[0] < programSize; head[0]++) {
        const line = program[head[0]];
        const lineBySpace = byWhiteSpace(line);
        const [operation] = lineBySpace;

        switch (operation) {
            case 'mov': {
                const [, keyRaw, value] = lineBySpace;
                const key = safeKey(keyRaw);

                registry[key] = parsed(value);
                break;
            }
            case 'inc': {
                const [, keyRaw] = lineBySpace;
                const key = safeKey(keyRaw);

                registry[key]++;
                break;
            }
            case 'dec': {
                const [, keyRaw] = lineBySpace;
                const key = safeKey(keyRaw);

                registry[key]--;
                break;
            }
            case 'add': {
                const [, keyRaw, value] = lineBySpace;
                const key = safeKey(keyRaw);

                registry[key] += parsed(value);
                break;
            }
            case 'sub': {
                const [, keyRaw, value] = lineBySpace;
                const key = safeKey(keyRaw);

                registry[key] -= parsed(value);
                break;
            }
            case 'mul': {
                const [, keyRaw, value] = lineBySpace;
                const key = safeKey(keyRaw);

                registry[key] *= parsed(value);
                break;
            }
            case 'div': {
                const [, keyRaw, value] = lineBySpace;
                const key = safeKey(keyRaw);

                registry[key] = Math.floor(registry[key] / parsed(value));
                break;
            }
            case 'jmp': {
                const [, fn] = lineBySpace;
                head[0] = functions[fn];
                break;
            }
            case 'cmp': {
                const [, a, b] = lineBySpace;
                const nextLine = program[head[0] + 1];
                const [jumpIf, fn] = byWhiteSpace(nextLine);

                head[0]++;

                switch (jumpIf) {
                    case 'je': {
                        if (parsed(a) == parsed(b)) head[0] = functions[fn];
                        break;
                    }
                    case 'jne': {
                        if (parsed(a) != parsed(b)) head[0] = functions[fn];
                        break;
                    }
                    case 'jle': {
                        if (parsed(a) <= parsed(b)) head[0] = functions[fn];
                        break;
                    }
                    case 'jl': {
                        if (parsed(a) < parsed(b)) head[0] = functions[fn];
                        break;
                    }
                    case 'jge': {
                        if (parsed(a) >= parsed(b)) head[0] = functions[fn];
                        break;
                    }
                    case 'jg': {
                        if (parsed(a) > parsed(b)) head[0] = functions[fn];
                        break;
                    }
                }
                break;
            }
            case 'call': {
                const [, fn] = lineBySpace;
                head.unshift(functions[fn]);
                break;
            }
            case 'ret': {
                head.shift();
                break;
            }
            case 'msg': {
                output = byMsgFormat(line).slice(1).reduce(
                    (output, item) => {
                        const value = parsedValue(registry, item);

                        if (item != value) {
                            output.push(value)
                        }

                        return output;
                    },
                    [],
                );
                break;
            }
            case 'end': {
                return output.join('');
            }
        }
    }

    return -1;
}
