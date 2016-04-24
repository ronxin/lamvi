import {ModelConfig, ModelState} from "./model_state";
import {ToyModel} from "./toy_model";


class Word2vecConfig extends ModelConfig {
  model_type = 'word2vec';
  hidden_size: number = 10;
  alpha: number = 0.2;
  window: number = 3;
  min_count: number = 2;
  max_vocab_size: number = 1000;
  seed: number = 1;
  min_alpha: number = 0.001;
  sg: boolean = false;
  negative: number = 5;
  cbow_mean: boolean = true;
  iter: number = 20;
  data_overview_fields: string[] = ['vocab_size'];
  train_overview_fields: string[] = ['train_words', 'iterations'];
  default_query_in: string[] = ['apple'];
  default_query_out: string[] = ['orange'];
  train_corpus_url: string = "/pg1342-tokenized.txt";
};

class Word2vecState extends ModelState {
}

export class Word2vec implements ToyModel {
  // Mostly replicating the original word2vec's implementation here.
  // Downscaling defaults to fit browser.
  // Several assumptions:
  // 1. always negative sampling (hierarchical softmax not supported)
  // 2. subsampling for frequent terms not supported
  // 3. training will not stop -- will go on if max_iter is met, and will keep
  //    using min_alpha from then on.
  // 4. null_word is always 0.
  state: Word2vecState;
  corpus: string;

  constructor() {
    this.state = new Word2vecState();
    this.state.config = new Word2vecConfig();
    this.set_status('WAIT_FOR_CORPUS');
  }

  update_config(config: ModelConfig): void {
    for (let key in config) {
      if (this.state.config.hasOwnProperty(key)) {
        this[key] = config[key];
      }
    }
  }

  get_state(): ModelState {
    return this.state;
  }

  static getDefaultModel(): Word2vec {
    return new Word2vec();
  }

  handle_request(request_type: string, request: {}): any {
    switch (request_type) {
      case 'identify':
        throw new Error('"identify" should be handled by toy_model_entry.ts');

      case 'set_corpus':
        this.corpus = request['corpus'];
        console.log("corpus length: " + this.corpus.length);
        this.set_status('WAIT_FOR_INIT');
        return this.get_state();

      case 'init_model':
        break;

      default:
        throw new Error('Unrecognized request type: "' + request_type + '"');
    }
  }

  private set_status(status: string): void {
    this.state.status = status;
  }
}
