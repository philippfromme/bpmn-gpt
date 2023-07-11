import { OpenAI } from 'langchain/llms/openai';

import { PromptTemplate } from 'langchain/prompts';

// import { ConsoleCallbackHandler } from 'langchain/callbacks';

import { StructuredOutputParser } from 'langchain/output_parsers';

import { Schema } from './schema';

const parser = StructuredOutputParser.fromZodSchema(Schema);

const formatInstructions = parser.getFormatInstructions();

console.log('formatInstructions', formatInstructions);

const baseInstructions = `Events should be labeled using object + past participle.
Start events should always be labeled with an indication of the trigger of the process.
End events should be labeled with the end state of the process.
Tasks should be labeled using object + verb.
X-OR Gateways should be labeled with a question.
The outgoing sequence flows should be labeled with the possible answers to these questions (conditions).
All other sequence flows should not be labeled.
Start events must have one outgoing sequence flow.
End events must have one incoming sequence flow.
All other activities must have at least one of each.`;

const createProcessPrompt = new PromptTemplate({
  template: `You are a BPMN expert that creates a BPMN process according to a description.
All BPMN processes you create must be valid, e.g., all elements must be connected.
If the description does not describe a process, reply with the word ERROR.
{base_instructions}
{format_instructions}
Description: {description}
Output:`,
  inputVariables: [ 'description' ],
  partialVariables: {
    base_instructions: baseInstructions,
    format_instructions: formatInstructions,
  },
});

const updateProcessPrompt = new PromptTemplate({
  template: `You are a BPMN expert that updates a BPMN process according to the requested changes.
All BPMN processes you create must be valid, e.g., all elements must be connected.
If the requested changes are not related to the process, reply with the word ERROR.
{base_instructions}
{format_instructions}
Current BPMN process:
{process}
Requested changes: {requestedChanges}
Output:`,
  inputVariables: [ 'requestedChanges', 'process' ],
  partialVariables: {
    base_instructions: baseInstructions,
    format_instructions: formatInstructions,
  },
});

export class BpmnGPT {
  constructor() {
    this.model = new OpenAI({
      // callbacks: [new ConsoleCallbackHandler()],
      // modelName: 'text-curie-001',
      maxTokens: 2000,
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0.9,
      verbose: true,
    });
  }

  async createBpmn(description) {
    const prompt = await createProcessPrompt.format({ description });

    console.log('createProcessPrompt', prompt);

    const start = Date.now();

    const response = await this.model.call(prompt);

    const end = Date.now();

    console.log('Time elapsed:', (end - start) / 1000, 'seconds');

    console.log(response);

    if (response.trim() === 'ERROR') {
      throw new Error('Could not create BPMN process');
    }

    return removeBackticks(response);
  }

  async updateBpmn(requestedChanges, process) {
    const prompt = await updateProcessPrompt.format({
      requestedChanges,
      process,
    });

    console.log('updateProcessPrompt', prompt);

    const response = await this.model.call(prompt);

    console.log(response);

    if (response.trim() === 'ERROR') {
      throw new Error('Could not update BPMN process');
    }

    return removeBackticks(response);
  }
}

function removeBackticks(string) {
  return string.replace(/```json|```/g, '');
}
