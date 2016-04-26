import {ModelConfig, ModelState, QueryOutRecord} from "./model_state";
import {ToyModel} from "./toy_model";
import * as util from "./util";
import {get_random, get_random_init_weight} from "./random";

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
  default_query_in: string[] = ['women'];
  default_query_out: string[] = ['W_men'];
  train_corpus_url: string = "/pg1342-tokenized.txt";
};

class Word2vecState extends ModelState {
  config: Word2vecConfig;
  vocab_size: number;
  num_sentences: number;
  corpus_size: number;  // total number of trainable words in the corpus

  full_model_name = 'Word2Vec';
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

  query_in: string[] = [];
  qi_key: string;  // hash key for query_in
  queries_watched: {[q:string]: boolean} = {};
  queries_ignored: {[q:string]: boolean} = {};
  qo_map: {[qi_key: string]: {[qo: string]: QueryOutRecord}} = {};

  syn0: number[][];
  syn1: number[][];

  // Some cached arrays that should be initialized only once to potentially save
  // some time.
  scores: number[];
  qi_vec: number[];

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
        this.init_model();
        this.set_status('WAIT_FOR_TRAIN');
        return this.get_state();

      case 'autocomplete':
        let term = <string>request['term'] || '';
        return this.autocomplete(term);

      case 'validate_query_in':  // this contains all query terms in query_in
        let query_in = <string[]>request['query_in'] || [];
        return this.validate_query_in(query_in);

      case 'validate_query_out':  // this is a single query_out item only
        let query_out = <string>request['query_out'];
        return this.validate_query_out(query_out);

      case 'update_query_out_result':
        this.update_qi_and_qo(request);
        this.compute_query_out_result();
        return this.get_state();

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

  private init_model(): void {
    let vocab_size = this.state.vocab_size;
    let hidden_size = this.state.config.hidden_size;
    let syn0 = [];
    let syn1 = [];
    for (let i = 0; i < vocab_size; i++) {
      let v0 = [];
      let v1 = [];
      for (let j = 0; j < hidden_size; j++) {
        v0.push(get_random_init_weight(hidden_size));
        v1.push(0);
      }
      syn0.push(v0);
      syn1.push(v1);
    }
    this.syn0 = syn0;
    this.syn1 = syn1;

    this.scores = [];
    this.qi_vec = [];
    for (let i = 0; i < vocab_size; i++)  this.scores.push(0);
    for (let j = 0; j < hidden_size; j++)  this.qi_vec.push(0);

    this.state.iterations = 0;
    this.state.num_possible_outputs = vocab_size;
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

  private validate_query_in(query_in: string[]): {} {
    if (! this.vocab) {
      throw new Error('Must first build vocab before validating queries.');
    }
    let is_valid = true;
    let message = '';
    for (let query of query_in) {
      if (util.startsWith(query, '-')) {
        query = query.slice(1);
      }
      if (!(query in this.vocab)) {
        is_valid = false;
        if (message.length > 0) {
          message += "<br>\n";
        }
        message += '"' + query + '" is not in vocabulary.';
      }
    }
    return {is_valid: is_valid, message: message};
  }

  private validate_query_out(query: string): {} {
    if (! this.vocab) {
      throw new Error('Must first build vocab before validating queries.');
    }
    let is_valid = true;
    let message = '';
    if (! (query in this.vocab)) {
      is_valid = false;
      message = `"${query}" is not in vocabulary.`;
    }
    return {is_valid: is_valid, message: message};
  }

  private update_qi_and_qo(request: {}) {
    // Update query_in.
    this.query_in = <string[]>request['query_in'] || [];
    this.qi_key = this.query_in.join('&');
    if (this.qi_key.length > 0 && ! (this.qi_key in this.qo_map)) {
      this.qo_map[this.qi_key] = {};
    }

    let qo_lookup = this.qo_map[this.qi_key];

    // Update query_watched.
    let query_out = <string[]>request['query_out'] || [];
    for (let q of query_out) {
      let prefix = q[0];
      let q_str = q.slice(2);
      if ($.inArray(prefix, ['G', 'B', 'W']) > -1) {
        this.queries_watched[q_str] = true;
        if (! (q_str in qo_lookup)) {
          qo_lookup[q_str] = {query: q_str, status: ''};
        }
        qo_lookup[q_str].status = {'G':'GOOD', 'B':'BAD', 'W': 'WATCHED'}[prefix];
        if (q_str in this.queries_ignored) {
          delete this.queries_ignored[q_str];
        }
      } else if (prefix == 'I' && (q_str in this.queries_watched)) {
        delete this.queries_watched[q_str];
        this.queries_ignored[q_str] = true;
      }
    }
  }

  // qo_map has been taken care of in update_qi_and_qo.
  // This function just focuses on computing the ranking and maintaining history.
  // Updates this.state.query_out_records upon completion.
  private compute_query_out_result() {
    if (this.query_in.length == 0) {
      this.state.query_out_records = [];
      return;
    }

    // For convenience.
    let hidden_size = this.state.config.hidden_size;
    let vocab = this.vocab;
    let vocab_size = this.state.vocab_size;
    let syn0 = this.syn0;
    let query_in = this.query_in;
    let qi_vec = this.qi_vec;
    let scores = this.scores;
    let iterations = this.state.iterations;
    let qo_lookup = this.qo_map[this.qi_key];
    let queries_watched = this.queries_watched;

    // Update qi_vec
    for (let j = 0; j < hidden_size; j++)  qi_vec[j] = 0;
    let q_idx_set: {[q_idx: number]: boolean} = {};
    for (let q of query_in) {
      let word = q;
      let minus = false;
      if (util.startsWith(q, '-')) {
        minus = true;
        word = q.slice(1);
      }
      let qidx = vocab[word].idx;
      q_idx_set[qidx] = true;
      for (let j = 0; j < hidden_size; j++) {
        if (minus) qi_vec[j] -= syn0[qidx][j];
        else qi_vec[j] += syn0[qidx][j];
      }
    }
    // Normalize qi_vec
    {
      let l2 = 0;
      for (let j = 0; j < hidden_size; j++) l2 += qi_vec[j] * qi_vec[j];
      let l2_sqrt = Math.sqrt(l2);
      for (let j = 0; j < hidden_size; j++) qi_vec[j] /= l2_sqrt;
    }

    // Compute scores
    for (let i = 0; i < vocab_size; i++) {
      if (i in q_idx_set) {
        scores[i] = 0;  // (query words have a score of 0)
        continue;
      }
      let prod = 0;
      let l2 = 0;
      for (let j = 0; j < hidden_size; j++) {
         prod += qi_vec[j] * syn0[i][j];
         l2 += syn0[i][j] * syn0[i][j];
      }
      let l2_sqrt = Math.sqrt(l2);
      if (l2 == 0) scores[i] = 0;
      else scores[i] = prod / l2_sqrt;
    }

    // Get ranking
    interface ScoredItem {
      idx: number;
      score: number;
      rank?: number;
    }
    let item_scores: ScoredItem[] = $.map(scores, (score, i) => {return {idx: i, score: score}});
    item_scores.sort((a,b) => b.score - a.score);
    $.map(item_scores, (item_score, i) => {item_score.rank = i});
    let rank_lookup: {[watched_item:string]: number} = {};
    for (let item_score of item_scores) {
      let word = this.index2word[item_score.idx];
      if (word in queries_watched) {
        rank_lookup[word] = item_score.rank;
      }
    }

    // Update ranking history for the following three types of items
    // 1. top 5 ranked items
    // 2. watched items
    // 3. items ranked near (+/-2) watched items
    // [4]. excluding ignored items
    // Create records if not exist in qo_map (which means the status is NORMAL,
    // as other watched items have already been created in qo_map).
    let query_out_records: QueryOutRecord[] = [];
    let ranks_to_show: number[] = [];
    for (let i = 0; i < 5; i++) ranks_to_show.push(i);
    for (let word of Object.keys(queries_watched)) {
      if (! (word in rank_lookup)) continue;
      if (vocab[word].idx in q_idx_set) continue;
      let rank = rank_lookup[word];
      for (let i = rank - 2; i <= rank + 2; i++) {
        if (i < 0) continue;
        if (i >= vocab_size) continue;
        ranks_to_show.push(i);
      }
    }
    ranks_to_show = uniq_fast(ranks_to_show)
      .filter(rank => !(this.index2word[item_scores[rank].idx] in this.queries_ignored))
      .filter(rank => !(item_scores[rank].idx in q_idx_set))
      .sort();
    for (let rank of ranks_to_show) {
      let item_score = item_scores[rank];
      let word = this.index2word[item_score.idx];
      let score = item_score.score;  // unused for now. -- this is the cosine similarity
      if (!(word in qo_lookup)) {
        qo_lookup[word] = {query: word, status: 'NORMAL'};
      }
      let record = qo_lookup[word];
      record.rank = rank;
      if (! record.rank_history) {
        record.rank_history = [];
      }
      if (record.rank_history.length >= 1 && record.rank_history.slice(-1)[0].iteration == iterations) {
        record.rank_history.slice(-1)[0].rank = rank;
      } else {
        record.rank_history.push({rank: rank, iteration: iterations});
      }
      query_out_records.push(record);
    }
    query_out_records.sort((a,b) => a.rank - b.rank);

    // Set state
    this.state.query_out_records = query_out_records;
  }
}

// http://stackoverflow.com/questions/9229645/
function uniq_fast(a) {
  var seen = {};
  var out = [];
  var len = a.length;
  var j = 0;
  for(var i = 0; i < len; i++) {
    var item = a[i];
    if(seen[item] !== 1) {
      seen[item] = 1;
      out[j++] = item;
    }
  }
  return out;
}
