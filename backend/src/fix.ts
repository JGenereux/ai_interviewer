import axios, { AxiosError } from 'axios';
import questions from './questions.json'

const language = 'cpp'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface TestJob {
    questionNum: number;
    testCaseNum: number;
    title: string;
    fileContent: string;
}

const main = async () => {
    let latestLang = {language: '', version: ''}
    const runtimeRes = await axios.get('https://emkc.org/api/v2/piston/runtimes');
    const wantedLang = language === 'cpp' ? 'c++' : language
    const matchingLangs = runtimeRes.data.filter((l: any) => l.language === wantedLang);
    if (matchingLangs.length > 0) {
        latestLang = matchingLangs.sort((a: any, b: any) => {
            const aParts = a.version.split('.').map(Number);
            const bParts = b.version.split('.').map(Number);
            for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
                const aVal = aParts[i] || 0;
                const bVal = bParts[i] || 0;
                if (bVal !== aVal) return bVal - aVal;
            }
            return 0;
        })[0]
    }

    console.log(latestLang)

    const currLang = latestLang.language === 'c++' ? 'cpp' : latestLang.language
    const jobs: TestJob[] = [];

    console.log('size: ', Object.entries(questions).length)
    const arr = Object.entries(questions).slice(40, 50)
    let i = 0;
    for (const [key, value] of arr) {
        i++;
        if (i > 10) break;

        const def = (value as Record<string, any>)[currLang]
        if (!def) continue;
        console.log('continuing')

        let code = '';
        let setupCode = '';

        if (def?.typeDefs && def.typeDefs.length > 0) {
            code = def.typeDefs + "\n" + def.functionDeclaration;
        } else {
            code = def.functionDeclaration;
        }

        if (def?.builders && def.builders.length > 0) {
            setupCode += def.builders;
        }
        if (def?.compareHelper && def.compareHelper.length > 0) {
            setupCode += (setupCode ? "\n" : "") + def.compareHelper;
        }

        let j = 0;
        for (const testCase of def.testCalls) {
            j++;
            jobs.push({
                questionNum: i,
                testCaseNum: j,
                title: (value as any).title,
                fileContent: setupCode + "\n" + code + "\n" + testCase
            });
        }
    }

    console.log(`Collected ${jobs.length} test jobs. Processing sequentially...`);

    for (let idx = 0; idx < jobs.length; idx++) {
        const job = jobs[idx];
        
        console.log(`\n[${idx + 1}/${jobs.length}] Question ${job.questionNum}, Test Case ${job.testCaseNum} ------------------------------`)
        console.log('Title:', job.title)
        console.log('file contents:')
        console.log(job.fileContent)

        try {
            const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
                language: latestLang.language,
                version: latestLang.version,
                files: [{ content: job.fileContent }]
            });

            const { stdout, stderr } = response.data.run;
            let filteredStderr = stderr;
            if (stderr) {
                const match = stderr.match(/Error:\s*(Test Case \d+ Failed)/i);
                if (match) {
                    filteredStderr = match[1];
                } else if (stderr.includes('Test Case') && stderr.includes('Failed')) {
                    const testMatch = stderr.match(/Test Case #?\d+\s*Failed/i);
                    filteredStderr = testMatch ? testMatch[0] : 'Test Failed';
                }
            }
            console.log('Result:', stdout || filteredStderr || 'OK')
        } catch (error) {
            if (error instanceof AxiosError) {
                console.log('ERROR: ------------------------------------------------------')
                console.log(error.message)
                console.log('Status:', error.response?.status)
                console.log('Data:', error.response?.data)
                console.log('-------------------------------------------------------------')
            } else {
                console.log('Unknown error:', error)
            }
        }

        if (idx < jobs.length - 1) {
            console.log('Waiting 250ms before next request...')
            await delay(250);
        }
    }

    console.log('\nDone!')
}

main()
