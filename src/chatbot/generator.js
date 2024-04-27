import { isArray } from 'min-dash';

import { layoutProcess } from 'bpmn-auto-layout';

export async function fromJson(json, bpmnjs) {
  const moddle = bpmnjs.get('moddle');

  function createElement(type, properties) {
    const moddleElement = moddle.create(type, properties);

    const isReference = (propertyName, moddleElement) => {
      const { $descriptor } = moddleElement;

      const { propertiesByName } = $descriptor;

      const property = propertiesByName[propertyName];

      return property.isReference;
    };

    const setParent = (property) => {
      if (property && property.$type) {
        const childModdleElement = property;

        childModdleElement.$parent = moddleElement;
      }
    };

    if (properties) {
      Object.entries(properties).forEach(([ propertyName, property ]) => {
        if (isReference(propertyName, moddleElement)) {
          return;
        }

        setParent(property);

        if (isArray(property)) {
          property.forEach(setParent);
        }
      });
    }

    return moddleElement;
  }

  const process = createElement('bpmn:Process', {
    id: 'Process_1',
    flowElements: [],
  });

  const definitions = createElement('bpmn:Definitions', {
    id: 'Definitions_1',
    rootElements: [
      process
    ],
  });

  const { elements } = json;

  elements.forEach((elementJson) => {
    const properties = {
      id: elementJson.id,
      name: elementJson.name
    };

    if (elementJson.eventDefinitionType) {
      properties.eventDefinitions = [
        createElement(elementJson.eventDefinitionType, {})
      ];
    }

    const element = createElement(elementJson.type, properties);

    process.flowElements.push(element);

    element.$parent = process;
  });

  console.log('process', process);

  // handle connections
  elements.forEach((elementJson) => {
    if (elementJson.type === 'bpmn:SequenceFlow') {
      const sequenceFlow = process.flowElements.find(({ id }) => id === elementJson.id);

      if (!sequenceFlow) {
        console.error('sequence flow not found', elementJson);

        throw new Error();
      }

      const source = process.flowElements.find(
        (flowElement) => flowElement.id === elementJson.source
      );

      const target = process.flowElements.find(
        (flowElement) => flowElement.id === elementJson.target
      );

      if (!source || !target) {
        console.error('source or target not found for sequence flow', elementJson);

        throw new Error();
      }

      sequenceFlow.sourceRef = source;
      sequenceFlow.targetRef = target;

      source.outgoing = [ ...(source.outgoing || []), sequenceFlow ];
      target.incoming = [ ...(target.incoming || []), sequenceFlow ];
    }
  });

  // handle attachers
  elements.forEach((elementJson) => {
    if (elementJson.type === 'bpmn:BoundaryEvent') {
      const boundaryEvent = process.flowElements.find(({ id }) => id === elementJson.id);

      const host = process.flowElements.find(
        (flowElement) => flowElement.id === elementJson.attachedToRef
      );

      if (!host) {
        throw new Error('attachedToRef not found for boundary event', boundaryEvent.id);
      }

      boundaryEvent.attachedToRef = host;
    }
  });

  const { xml } = await moddle.toXML(definitions);

  console.log('xml before layout', xml);

  return layoutProcess(xml);
}
