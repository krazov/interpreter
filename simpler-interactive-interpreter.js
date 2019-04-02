const ASSIGNMENT = '=';
const ADD = '+';
const SUBTRACT = '-';
const MULTIPLY = '*';
const DIVIDE = '/';
const MODULO = '%';
const OPERATIONS = ADD + SUBTRACT + MULTIPLY + DIVIDE + MODULO;
const OPERATIONS_PRIMARY = MULTIPLY + DIVIDE + MODULO;
const OPERATIONS_SECONDARY = ADD + SUBTRACT;
const PARENTHESIS_OPEN = '(';
const PARENTHESIS_CLOSE = ')';
const PARENTHESES = PARENTHESIS_OPEN + PARENTHESIS_CLOSE;

const Interpreter = class $_ {
    static tokenize(expression) {
        return expression === ''
            ? []
            : expression
                .split(/\s*([-+*\/\%=\(\)]|[A-Za-z_][A-Za-z0-9_]*|[0-9]*\.?[0-9]+)\s*/g)
                .filter((s) => !s.match(/^\s*$/));
    }

    static isIdentifier(token) {
        return /[A-Za-z_][A-Za-z0-9_]*/gi.test(token);
    }

    static isNumber(token) {
        const numberized = Number(token);
        return typeof numberized == 'number' && !Number.isNaN(numberized);
    }

    static isAssignment(token) {
        return token == ASSIGNMENT;
    }

    static hasAssignments(tokens) {
        return tokens.some($_.isAssignment);
    }

    static isOperator(token) {
        return OPERATIONS.includes(token);
    }

    static isPrimaryOperator(token) {
        return OPERATIONS_PRIMARY.includes(token);
    }

    static isSecondaryOperator(token) {
        return OPERATIONS_SECONDARY.includes(token);
    }

    static hasPrimaryOperators(tokens) {
        return tokens.find($_.isPrimaryOperator);
    }

    static hasSecondaryOperators(tokens) {
        return tokens.find($_.isSecondaryOperator);
    }

    static fishOutOperators(tokens) {
        return tokens.filter($_.isOperator);
    }

    static hasOnlyPrimaryOperations(tokens) {
        return $_.fishOutOperators(tokens).every($_.isPrimaryOperator);
    }

    static hasOnlySecondaryOperations(tokens) {
        return $_.fishOutOperators(tokens).every($_.isSecondaryOperator);
    }

    static isSimpleOperation(tokens) {
        return tokens.filter($_.isOperator).length == 1;
    }

    static isComplexOperation(tokens) {
        return !$_.isSimpleOperation(tokens);
    }

    static hasOperations(tokens) {
        return tokens.some($_.isOperator);
    }

    static hasEqualOperations(tokens) {
        return $_.hasOnlyPrimaryOperations(tokens) || $_.hasOnlySecondaryOperations(tokens);
    }

    static isEmptyArray({ length }) {
        return length === 0;
    }

    static isEmptyString(string) {
        return string === '';
    }

    static isNotEmptyString(string) {
        return !$_.isEmptyString(string);
    }

    static isParenthesis(token) {
        return PARENTHESES.includes(token);
    }

    static isOpeningParenthesis(token) {
        return token == PARENTHESIS_OPEN;
    }

    static isClosingParenthesis(token) {
        return token == PARENTHESIS_CLOSE;
    }

    static hasParentheses(tokens) {
        return tokens.some($_.isParenthesis);
    }

    static fishOutParentheses(tokens) {
        return tokens.filter($_.isParenthesis);
    }

    static hasNestedParentheses(tokens) {
        return /\({2,}/gi.test($_.fishOutParentheses(tokens).join(''));
    }

    static howManyNestedParentheses(tokens) {
        // TODO: this will most likely fail on (x (y - z)) / (k * j)
        return tokens.reduce(
            (openings, parenthesis, index, array) =>
                $_.isOpeningParenthesis(parenthesis)
                    ? openings + 1
                    : $_.isClosingParenthesis(parenthesis) && array.slice(index + 1).some($_.isOpeningParenthesis)
                        ? openings - 1
                        : openings,
            0
        );
    }

    static findOpeningParenthesisIndex(tokens) {
        return tokens.findIndex($_.isOpeningParenthesis);
    }

    static findClosingParenthesisIndex(tokens) {
        return $_.hasNestedParentheses(tokens)
            ? tokens
                .reduce(
                    ({ counter, closing }, token, index) => ({
                        counter: $_.isClosingParenthesis(token) ? counter - 1 : counter,
                        closing: $_.isClosingParenthesis(token) && counter == 1 ? index : closing,
                    }),
                    { counter: $_.howManyNestedParentheses(tokens), closing: null }
                )
                .closing
            : tokens.findIndex($_.isClosingParenthesis)
    }

    static performOperation(operator, value1, value2) {
        switch (operator) {
            case '+': return value1 + value2;
            case '-': return value1 - value2;
            case '*': return value1 * value2;
            case '/': return value1 / value2;
            case '%': return value1 % value2;
        }
    }

    constructor() {
        this.vars = {};
    }

    input(expression) {
        return this.calculate($_.tokenize(expression));
    }

    calculate(tokens) {
        if ($_.isOperator(tokens.slice(-1)[0])) {
            throw Error('Syntax error! Cannot finish expression with operator.');
        }

        return $_.hasAssignments(tokens)
            ? this.handleAssignment(tokens)
            : $_.isEmptyArray(tokens)
                ? ''
                : this.decide(tokens);
    }

    decide(tokens) {
        return $_.isSimpleOperation(tokens)
            ? this.handleOperation(tokens)
            : $_.hasParentheses(tokens)
                ? this.handleParentheses(tokens)
                : $_.hasEqualOperations(tokens)
                    ? this.handleOperation(tokens)
                    : this.handleMixedOperations(tokens)
    }

    handleAssignment(tokens) {
        if (tokens.indexOf(ASSIGNMENT) != 1) {
            throw Error('Syntax error! There should be only one element on the left side of the assignment.');
        }

        const [variable,, ...rightSide] = tokens;

        return this.writeVariable(variable, this.decide(rightSide));
    }

    handleOperation(tokens) {
        return tokens
            .reduce(
                ({ value, operator }, token) =>
                    ({
                        // TODO: simplify it
                        value: value == null
                            ? $_.isNumber(token)
                                ? Number(token)
                                : $_.isIdentifier(token)
                                    ? this.readVariable(token)
                                    : value
                            : $_.isOperator(operator)
                                ? $_.performOperation(operator, value, Number(token))
                                : value,
                        operator: $_.isOperator(token)
                            ? token
                            : null
                    }),
                { value: null, operator: null }
            )
            .value;
    }

    handleMixedOperations(tokens) {
        const secondaryIndex = tokens.findIndex($_.isSecondaryOperator);
        const leftSide = tokens.slice(0, secondaryIndex);
        const rightSide = tokens.slice(secondaryIndex + 1);

        return this.handleOperation([
            // TODO: check if handling operation here is needed
            this.handleOperation(leftSide),
            tokens[secondaryIndex],
            $_.hasSecondaryOperators(rightSide) ? this.handleMixedOperations(rightSide) : this.handleOperation(rightSide),
        ]);
    }

    handleParentheses(tokens) {
        const openingIndex = $_.findOpeningParenthesisIndex(tokens);
        const closingIndex = $_.findClosingParenthesisIndex(tokens);
        const preParenthesis = tokens.slice(0, openingIndex);
        const parenthesis = tokens.slice(openingIndex + 1, closingIndex);
        const rightSide = tokens.slice(closingIndex + 1);

        return this.handleOperation(
            ($_.isEmptyArray(preParenthesis) ? [''] : preParenthesis)
                .concat([
                    this.decide(parenthesis),
                    $_.isOperator(rightSide[0]) ? rightSide[0] : '',
                    this.decide($_.isOperator(rightSide[0]) ? rightSide.slice(1) : rightSide),
                ])
                .filter($_.isNotEmptyString)
        );
    }

    writeVariable(name, value) {
        this.vars[name] = value;
        return value;
    }

    readVariable(name) {
        const variable = this.vars[name];

        if (name === undefined || variable == undefined) {
            throw Error('Variable undefined!');
        }

        return variable;
    }
}
