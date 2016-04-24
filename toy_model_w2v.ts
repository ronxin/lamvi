import {ModelConfig, ModelState} from "./model_state";
import {ToyModel} from "./toy_model";
import * as util from "./util";

class Word2vecConfig extends ModelConfig {
  hidden_size: number = 10;
  alpha: number = 0.2;
  window: number = 3;
  min_count: number = 2;
  seed: number = 1;
  min_alpha: number = 0.001;
  sg: boolean = false;
  negative: number = 5;
  cbow_mean: boolean = true;
  iter: number = 20;
  data_overview_fields: string[] = ['vocab_size', 'num_sentences', 'corpus_size'];
  train_overview_fields: string[] = ['trained_words', 'iterations', 'learning_rate', 'epochs'];
  default_query_in: string[] = ['apple'];
  default_query_out: string[] = ['orange'];
  train_corpus_url: string = "/pg1342-tokenized.txt";
};

class Word2vecState extends ModelState {
  config: Word2vecConfig;
  vocab_size: number;
  num_sentences: number;
  corpus_size: number;  // total number of trainable words in the corpus
}

class VocabItem {
  constructor(public idx: number, public count: number = 0) {
  }
}

// Mostly replicating the implementation of the original word2vec package as well as
// gensim's word2vec here. Downscaling defaults to fit browser.
//
// Several simplifications compared to the original implementation:
// 1. always negative sampling (hierarchical softmax not supported)
// 2. subsampling for frequent terms not supported
// 3. training will not stop -- will go on if max_iter is met, and will keep
//    using min_alpha from then on.
// 4. null_word is always 0.
// 5. max_vocab_size is infinite.
export class Word2vec implements ToyModel {
  state: Word2vecState;
  corpus: string;
  sentences: string[];
  vocab: {[key: string]: VocabItem};
  index2word: string[];

  constructor(model_config: {}) {
    this.state = new Word2vecState();
    this.state.config = new Word2vecConfig();  // with default parameters
    this.update_config(model_config);  // folding in the user's custom parameters
    this.set_status('WAIT_FOR_CORPUS');
  }

  private update_config(config: {}): void {
    let model_config = this.state.config;
    for (let key in config) {
      if (model_config.hasOwnProperty(key)) {
        model_config[key] = config[key];
      }
    }
  }

  get_state(): ModelState {
    return this.state;
  }

  handle_request(request_type: string, request: {}): any {
    switch (request_type) {
      case 'identify':
        throw new Error('"identify" should be handled by toy_model_entry.ts');

      case 'set_corpus':
        this.corpus = request['corpus'];
        this.set_status('WAIT_FOR_INIT');
        return this.get_state();

      case 'init_model':
        this.build_vocab();
        this.set_status('WAIT_FOR_TRAIN');
        return this.get_state();

      case 'autocomplete':
        let term = <string>request['term'] || '';
        return this.autocomplete(term);

      default:
        throw new Error('Unrecognized request type: "' + request_type + '"');
    }
  }

  private set_status(status: string): void {
    this.state.status = status;
  }

  private build_vocab(): void {
    // Count words.
    this.sentences = this.corpus.split('\n');
    this.vocab = {};
    this.index2word = [];
    for (let sentence of this.sentences) {
      let words = sentence.split(' ');
      for (let word of words) {
        if (! (word in this.vocab)) {
          this.vocab[word] = new VocabItem(this.index2word.length);
          this.index2word.push(word);
        }
        this.vocab[word].count += 1;
      }
    }

    // Discard rare words.
    if (this.state.config.min_count > 1) {
      let min_count = this.state.config.min_count;
      let vocab_tmp: {[key: string]: VocabItem} = {};
      let index2word_tmp: string[] = [];
      for (let word in this.vocab) {
        if (this.vocab[word].count >= min_count) {
          vocab_tmp[word] = this.vocab[word];
          vocab_tmp[word].idx = index2word_tmp.length;
          index2word_tmp.push(word);
        }
      }
      this.vocab = vocab_tmp;
      this.index2word = index2word_tmp;
    }

    // Sort words by count
    this.index2word.sort((a:string, b:string) => {
      return this.vocab[b].count - this.vocab[a].count;
    });
    this.index2word.splice(0, 0, '\0');  // add null word to the front
    this.vocab[this.index2word[0]] = new VocabItem(0, 1);
    for (let i = 1; i < this.index2word.length; i++) {
      this.vocab[this.index2word[i]].idx = i;
    }

    // total "trainable" words in corpus
    let total_words: number = 0;
    for (let word in this.vocab) {
      total_words += this.vocab[word].count;
    }

    // Update states.
    this.state.num_sentences = this.sentences.length;
    this.state.vocab_size = this.index2word.length;
    this.state.corpus_size = total_words;
  }

  private autocomplete(term: string): {} {
    let out = [];
    if (this.index2word && term) {
      let prefix = null;
      let search_term = term;
      if (util.startsWith(term, '-')) {
        prefix = '-';
        search_term = term.slice(1);
      }
      out = $.ui.autocomplete.filter(this.index2word, search_term);
      // put those that start with the search term forward
      let out_s: string[] = [];
      let out_ns: string[] = [];
      for (let w of out) {
        if (util.startsWith(w, search_term)) {
          out_s.push(w);
        } else {
          out_ns.push(w);
        }
      }
      out = out_s.concat(out_ns);

      if (prefix) {
        out = $.map(out, (s:string) => {return prefix + s});
      }
      out = out.slice(0, 20);
    }
    return {'items': out};
  }
}
