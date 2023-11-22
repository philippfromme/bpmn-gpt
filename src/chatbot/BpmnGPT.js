import Mustache from 'mustache';

Mustache.escape = text => text;

import OpenAI from 'openai';

const openAIApiKey = process.env.OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey: openAIApiKey,
  dangerouslyAllowBrowser: true
});

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

const validJson = {
  'id': 'Process_1',
  'description': 'Hiring process',
  'elements': [
    {
      'id': 'StartEvent_1',
      'name': 'Application Received',
      'type': 'bpmn:StartEvent',
      'parent': 'Process_1'
    },
    {
      'id': 'Task_1',
      'name': 'Screen Application',
      'type': 'bpmn:Task',
      'parent': 'Process_1'
    },
    {
      'id': 'ExclusiveGateway_1',
      'name': 'Is applicant qualified?',
      'type': 'bpmn:ExclusiveGateway',
      'parent': 'Process_1'
    },
    {
      'id': 'Task_2',
      'name': 'Invite for Interview',
      'type': 'bpmn:Task',
      'parent': 'Process_1'
    },
    {
      'id': 'IntermediateCatchEvent_1',
      'name': 'Invitation Accepted',
      'type': 'bpmn:IntermediateCatchEvent',
      'eventDefinitionType': 'bpmn:MessageEventDefinition',
      'parent': 'Process_1'
    },
    {
      'id': 'Task_3',
      'name': 'Conduct Interview',
      'type': 'bpmn:Task',
      'parent': 'Process_1'
    },
    {
      'id': 'EndEvent_1',
      'name': 'Interview Conducted',
      'type': 'bpmn:EndEvent',
      'parent': 'Process_1'
    },
    {
      'id': 'Task_4',
      'name': 'Send Rejection Email',
      'type': 'bpmn:Task',
      'parent': 'Process_1'
    },
    {
      'id': 'EndEvent_2',
      'name': 'Applicant Rejected',
      'type': 'bpmn:EndEvent',
      'parent': 'Process_1'
    },
    {
      'id': 'SequenceFlow_1',
      'name': '',
      'type': 'bpmn:SequenceFlow',
      'source': 'StartEvent_1',
      'target': 'Task_1',
      'parent': 'Process_1'
    },
    {
      'id': 'SequenceFlow_2',
      'name': '',
      'type': 'bpmn:SequenceFlow',
      'source': 'Task_1',
      'target': 'ExclusiveGateway_1',
      'parent': 'Process_1'
    },
    {
      'id': 'SequenceFlow_3',
      'name': 'Yes',
      'type': 'bpmn:SequenceFlow',
      'source': 'ExclusiveGateway_1',
      'target': 'Task_2',
      'parent': 'Process_1'
    },
    {
      'id': 'SequenceFlow_4',
      'name': '',
      'type': 'bpmn:SequenceFlow',
      'source': 'Task_2',
      'target': 'IntermediateCatchEvent_1',
      'parent': 'Process_1'
    },
    {
      'id': 'SequenceFlow_5',
      'name': '',
      'type': 'bpmn:SequenceFlow',
      'source': 'IntermediateCatchEvent_1',
      'target': 'Task_3',
      'parent': 'Process_1'
    },
    {
      'id': 'SequenceFlow_6',
      'name': '',
      'type': 'bpmn:SequenceFlow',
      'source': 'Task_3',
      'target': 'EndEvent_1',
      'parent': 'Process_1'
    },
    {
      'id': 'SequenceFlow_7',
      'name': 'No',
      'type': 'bpmn:SequenceFlow',
      'source': 'ExclusiveGateway_1',
      'target': 'Task_4',
      'parent': 'Process_1'
    },
    {
      'id': 'SequenceFlow_8',
      'name': '',
      'type': 'bpmn:SequenceFlow',
      'source': 'Task_4',
      'target': 'EndEvent_2',
      'parent': 'Process_1'
    }
  ]
};

const formatInstructions = Mustache.render(`'The output must be JSON and JSON only! Here is an example of a valid JSON output:
{{validJson}}'`, {
  validJson: JSON.stringify(validJson)
});

const createProcessSystemPrompt = `You are a BPMN expert that creates a BPMN process according to a description.
All BPMN processes you create must be valid, e.g., all elements must be connected.
If the description does not describe a process, reply with an empty JSON object.
{{baseInstructions}}
{{formatInstructions}}`;

const updateProcessSystemPrompt = `You are a BPMN expert that updates a BPMN process according to the requested changes.
All BPMN processes you create must be valid, e.g., all elements must be connected.
If the requested changes are not related to the process, reply with an empty JSON object.
{{baseInstructions}}
{{formatInstructions}}`;

export class BpmnGPT {
  constructor() {}

  async createBpmn(description) {
    const start = Date.now();

    const response = await this._getCompletion({
      systemPrompt: Mustache.render(createProcessSystemPrompt, {
        baseInstructions,
        formatInstructions
      }),
      userPrompt: description
    });

    const end = Date.now();

    console.log('Time elapsed:', (end - start) / 1000, 'seconds');

    console.log(response);

    return response;
  }

  async updateBpmn(requestedChanges, process) {
    const start = Date.now();

    const response = await this._getCompletion({
      systemPrompt: Mustache.render(updateProcessSystemPrompt, {
        baseInstructions,
        formatInstructions
      }),
      userPrompt: Mustache.render(`Process: {{process}}
Requested changes: {{requestedChanges}}`, {
        process,
        requestedChanges
      })
    });

    const end = Date.now();

    console.log('Time elapsed:', (end - start) / 1000, 'seconds');

    console.log(response);

    return response;
  }

  async _getCompletion({ systemPrompt, userPrompt }) {
    console.log('systemPrompt', systemPrompt);
    console.log('userPrompt', userPrompt);

    const chatCompletion = await openai.chat.completions.create({
      messages: [
        {
          'role': 'system',
          'content': systemPrompt
        },
        {
          'role': 'user',
          'content': userPrompt
        }
      ],
      model: 'gpt-4-1106-preview',
      response_format: { type: 'json_object' }
    });

    const { choices = [] } = chatCompletion;

    if (!choices.length) {
      return null;
    }

    const { message } = choices[ 0 ];

    const { content } = message;

    return content === 'NULL' ? null : JSON.parse(content);
  }
}
