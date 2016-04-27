/*
  Backend entry for all in-browser (hence "toy") models.
*/

import {ModelConfig, ModelState} from "./model_state";
import {ToyModel} from "./toy_model";
import {Word2vec} from "./toy_model_w2v";

let model: ToyModel = null;

export default function handleRequest(request_type: string, request: {}): any {
  if (request_type == 'identify') {
    model = null;
    let model_type = request['model_type'];
    let model_config = request['model_config'];
      if (model_type == 'word2vec') {
        model = new Word2vec(model_config);
      } else {
        throw new Error('Unrecognized model type: "' + model_type + '"');
      }
      return model.get_state();
  } else {
    return model.handle_request(request_type, request);
  }
}
