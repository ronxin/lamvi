/*
  Backend entry for all toy in-browser models.
*/

import {ModelConfig, ModelState} from "./state";

export default function handleRequest(request_type: string, request: {}): any {
  switch (request_type) {
    case 'identify':
      let model_config = new ModelConfig();
      let model_type = request['model_type'];
      if (model_type == 'word2vec') {
        model_config.model_type = model_type;
        model_config.hidden_size = 5;

        model_config.data_overview_fields = ['vocab_size'];
        model_config.train_overview_fields = ['iterations'];

        model_config.default_query_in = ['apple'];
        model_config.default_query_out = ['orange'];

        // TODO: Make this principledly separated into word2vec + others.
        // e.g., have a separate word2vec file that supports all operations.

      } else {
        throw new Error('Unrecognized model type: "' + model_type + '"');
      }


      let model_state = new ModelState();
      model_state.config = model_config;
      return model_state;
    default:
      throw new Error('Unrecognized request type: "' + request_type + '"');
  }
}
