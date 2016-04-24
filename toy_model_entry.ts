/*
  Backend entry for all in-browser (hence "toy") models.
*/

import {ModelConfig, ModelState} from "./model_state";
import {ToyModel} from "./toy_model";
import {Word2vec} from "./toy_model_w2v";

let model: ToyModel = null;

export default function handleRequest(request_type: string, request: {}): any {
  if (request_type == 'identify') {
    let model_type = request['model_type'];
      if (model_type == 'word2vec') {
        model = Word2vec.getDefaultModel();
      } else {
        throw new Error('Unrecognized model type: "' + model_type + '"');
      }
      return model.get_state();
  } else {
    return model.handle_request(request_type, request);
  }
}
