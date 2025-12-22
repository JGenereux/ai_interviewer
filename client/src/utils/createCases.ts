type Question = {
    content: string,
    difficulty: string,
    hints: string[],
    title: string,
    topicTags: string[],
    "in-place": boolean,
    testCases: any[]
}

const convertParam = (value: string) => {
    if (value == "null") {
        return {type: 'null', value}
    }

    if (value == "true" || value == "false") {
        return {type: 'boolean', value}
    }

    const f = value[0];
    switch (f) {
        case '[':
            return {type: 'array', value};
        default:
         if (!Number.isNaN(Number(f))) {
            return {type: 'number', value};
         } else {
           return {type: 'string', value};
         }
    }
}

const createFunctionDef = (funcName: string, params: {key: string, param: {type: string, value: string}}[]) => {
    let funcDefinition = funcName + '(';
    for(const param of params) {
        if (param.param.value == params[params.length-1].param.value) {
            funcDefinition += param.param.value
            break;
        }
        funcDefinition += param.param.value + ','
    }

    funcDefinition += ')';

    return funcDefinition
}



const compareArrays = `function compareArrays(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (Array.isArray(a[i]) && Array.isArray(b[i])) {
            if (!compareArrays(a[i], b[i])) return false;
        } else if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}`;

const createTest = (funcDef: string, expectedResult: {
    key: string;
    param: {
        type: string;
        value: string;
    };
} | null, testNum: number) => {
    if (expectedResult === null) return
    switch (expectedResult.param.type) {
        case 'array':
            return `if (!compareArrays(${funcDef}, ${expectedResult.param.value})) { throw ("Test Case #${testNum} Failed!") }`
        default:
            return `if (${funcDef} != ${expectedResult.param.value}) { throw ("Test Case #${testNum} Failed!") }`
    }
}

const createFunctionDecl = (funcName: string, params: {key: string, param: {type: string, value: string}}[]) => {
    let funcDecl = 'function ' + funcName;
    funcDecl += '(';
    for (const param of params) {
        if (param.key == params[params.length-1].key) {
            funcDecl += param.key
            continue
        }
        funcDecl += param.key + ","
    }

    funcDecl += ')';

    funcDecl += '{\n\n}'
    return funcDecl;
}

export default function createCases(question: Question) {
    const funcName = question.title.trim().split(" ").map((q) => q[0].toUpperCase() + q.substring(1)).join('')
    
    let totalParams: any[] = [];
    const testCalls = []
    let numOfTests = 1;
    for (const testCase of question.testCases) {
        const params = []
        let expectedResult = null;
        for (const [key, value] of Object.entries(testCase)) {
            if (key == 'expectedResult') {
                expectedResult = {key, param: convertParam(value as string)};
                continue
            };
            params.push({key, param: convertParam(value as string)});
        }
        const funcDef = createFunctionDef(funcName, params) 
        totalParams = params
        testCalls.push(createTest(funcDef, expectedResult, numOfTests));
        numOfTests++;
    }

    const funcDeclaration = createFunctionDecl(funcName, totalParams)

    return {testCalls, funcDeclaration, compareArrays};
}