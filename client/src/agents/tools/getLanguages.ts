import { tool } from "@openai/agents";
import axios from "axios";
import { z } from 'zod';

const availableLanguages = ['javascript','typescript','c++', 'python', 'c', 'java', 'go', 'ruby']

export const getLanguagesTool = tool({
    name: 'get_languages',
    description: "Return's a list of available languages for the interview. Used to view available languages",
    parameters: z.object({}),
    async execute() {
        return ['javascript','typescript','c++', 'python', 'c', 'java', 'go', 'ruby'];
    }
})

export const getLanguageTool = tool({
    name: 'get_language',
    description: "Return's a language name and the version to use for runtime. Used to get the candidate's wanted language",
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