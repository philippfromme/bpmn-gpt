import Modeler from 'bpmn-js/lib/Modeler';

import CliModule from 'bpmn-js-cli';
import { CreateAppendAnythingModule } from 'bpmn-js-create-append-anything';

import ChatbotModule from './chatbot';

import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';

import './styles.scss';

import diagram from './diagram.bpmn';

const container = document.getElementById('container');

const modeler = new Modeler({
  container,
  additionalModules: [ ChatbotModule, CliModule, CreateAppendAnythingModule ],
  keyboard: {
    bindTo: document,
  },
});

modeler
  .importXML(diagram)
  .then(({ warnings }) => {
    if (warnings.length) {
      console.log(warnings);
    }

    const canvas = modeler.get('canvas');

    canvas.zoom('fit-viewport');
  })
  .catch((err) => {
    console.log(err);
  });
