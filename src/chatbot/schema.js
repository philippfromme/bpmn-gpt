import { z } from 'zod';

const Shape = z.object({
  id: z.string().describe('the ID of the shape'),
  name: z.string().describe('the name of the the shape'),
  type: z
    .string()
    .describe(
      "the type of shape (e.g. 'bpmn:StartEvent', 'bpmn:IntermediateCatchEvent', 'bpmn:BoundaryEvent', 'bpmn:EndEvent', 'bpmn:Task', 'bpmn:ServiceTask', 'bpmn:ExclusiveGateway' or 'bpmn:ParallelGateway')"
    ),
  eventDefinitionType: z
    .string()
    .optional()
    .describe(
      "the type of event definition (e.g. 'bpmn:MessageEventDefinition', 'bpmn:SignalEventDefinition' or 'bpmn:TimerEventDefinition')"
    ),
  parent: z.string().optional().describe('the ID of the parent of the shape, always the ID of the process'),
  host: z.string().optional().describe('the ID of the host of the shape, only for boundary events attached to a task'),
});

const Connection = z.object({
  id: z.string().describe('the ID of the shape'),
  name: z.string().optional().describe('the name of the the connection'),
  type: z
    .string()
    .describe(
      "the type of connection (e.g. 'bpmn:MessageFlow' or 'bpmn:SequenceFlow')"
    ),
  source: z.string().describe('the ID of the source of the connection'),
  target: z.string().describe('the ID of the target of the connection'),
  parent: z.string().optional().describe('the ID of the parent of the shape, always the ID of the process'),
});

const Element = z.union([ Shape, Connection ]);

export const Schema = z.object({
  id: z.string().describe('the ID of the process'),
  type: 'bpmn:Process',
  elements: z
    .array(Element)
    .describe('a list of all elements of the BPMN process'),
  description: z.string().describe('a description of the BPMN process'),
});
