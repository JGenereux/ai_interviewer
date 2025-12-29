import { tool } from "@openai/agents";
import axios from "axios";
import { z } from 'zod';

const availableLanguages = ['javascript','typescript','c++', 'python', 'c', 'java', 'go', 'ruby']

export const getLanguagesTool = tool({
    name: 'get_languages',
    description: `Returns available programming languages for the interview.
    - Call this FIRST before get_language to verify spelling
    - Available: javascript, typescript, c++, python, c, java, go, ruby`,
    parameters: z.object({}),
    async execute() {
        return ['javascript','typescript','c++', 'python', 'c', 'java', 'go', 'ruby'];
    }
})

export const getLanguageTool = tool({
    name: 'get_language',
    description: `Sets the candidate's programming language for the interview.
    - MUST call get_languages first to verify the language name spelling
    - Call this AFTER user confirms their preferred language
    - Returns the language name and runtime version`,
    parameters: z.object({name: z.string()}),
    async execute({name}) {
        const runtimeLangs = await axios.get('https://emkc.org/api/v2/piston/runtimes')
        const langs = runtimeLangs.data.map((lang: any) => { return { language: lang.language, version: lang.version } })
        
        const lang = langs.find((l: any) => l.language == name)

        if (lang === undefined) throw (`${name}: Name not found, please try again with a alias.`)
        
        if (!availableLanguages.find((a) => a == lang.language)) throw (`${name}: Does not exist in 
            available languages. Use get_languages tool to see available languages`)
        return lang
    }
})