import {ModelConfig, ModelState, QueryOutRecord} from "./model_state";
import {ToyModel} from "./toy_model";
import * as util from "./util";
import {get_random_float, get_random_init_weight} from "./random";

// for negative sampling
const POWER = 0.75;
const CUM_TABLE_DOMAIN = 2147483647;  // 2^31 - 1
const MAX_EXP = 6;
const EXP_TABLE_SIZE = 1000;

const RANK_TO_SHOW = 10;
const RANK_TO_CONSIDER_FOR_PERDIM = 100;

class Word2vecConfig extends ModelConfig {
  hidden_size: number = 16;
  alpha: number = 0.1;
  window: number = 3;
  min_count: number = 2;
  seed: number = 1;
  min_alpha: number = 0.01;
  sg: boolean = true;
  negative: number = 5;
  cbow_mean: boolean = true;
  iter: number = 20;
  data_overview_fields: string[] = ['vocab_size', 'num_sentences', 'corpus_size'];
  train_overview_fields: string[] = ['instances', 'epochs', 'learning_rate'];
  default_query_in: string[] = ['darcy'];
  default_query_out: string[] = ['G_bennet','B_circumstances'];
  train_corpus_url: string = "/pg1342-tokenized.txt";
  report_interval_microseconds: number = 250;
};

export class Word2vecState extends ModelState {
  config: Word2vecConfig;
  vocab_size: number;
  num_sentences: number;
  corpus_size: number;  // total number of trainable words in the corpus

  sentences: number;
  epochs: number;
  learning_rate: number;

  full_model_name = 'Word2Vec';

  qi_vec: number[];
  per_dim_neighbors: QueryOutRecord[][];  // [dim][rank] = {query, score}
}

export interface PairProfile {
  qo: string;
  qo_vec: number[];
  qo_neighbors: QueryOutRecord[];  // {query, score}
  qo_per_dim_neighbors: QueryOutRecord[][];  // [dim][rank] = {query, score}
  elemprod: number[];
  elemsum_neighbors: {query: string, score1: number, score2: number}[];
  elemsum_per_dim_neighbors: {query: string, score1: number, score2: number}[][];
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
  q_idx_set: {[q_idx:number]:boolean};
  queries_watched: {[q:string]: boolean} = {};
  queries_ignored: {[q:string]: boolean} = {};
  qo_map: {[qi_key: string]: {[qo: string]: QueryOutRecord}} = {};
  scores: number[];
  qi_scores_unsorted: ScoredItem[];
  qi_scores: ScoredItem[];
  qi_vec: number[];
  l2_sqrts: number[];

  syn0: number[][];
  syn1: number[][];
  cum_table: number[];  // cumultative distribution table for negative sampling.
  exp_table: number[];

  // Training status tracker
  count_instances_watched = 0;  // number of seen instances of watched queries
  breakpoint_instances_watched = -1;  // when this number (is positive) is met, break.
  breakpoint_iterations = -1;
  breakpoint_time = -1;

  train_instance_log_map: {[query:string]: TrainInstanceLog[]} = {};

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
        this.compute_query_result();
        return this.get_state();

      case 'train':
        let requested_iterations = <number>request['iterations'] || -1;
        let watched = <boolean>request['watched'];
        this.breakpoint_iterations = -1;
        this.breakpoint_instances_watched = -1;
        this.breakpoint_time = Date.now() + this.state.config.report_interval_microseconds;
        if (requested_iterations > 0) {
          if (watched) this.breakpoint_instances_watched = this.count_instances_watched + requested_iterations;
          else this.breakpoint_iterations = this.state.instances + requested_iterations;
        }
        this.train_until_breakpoint();
        return this.get_state();

      case 'train-continue':
        this.breakpoint_time = Date.now() + this.state.config.report_interval_microseconds;
        this.train_until_breakpoint();
        return this.get_state();

      case 'pair_profile':
        let query = <string>request['query'];
        return this.get_pair_profile(query);

      case 'influential_train_instances':
        let w1 = <string>request['w1'];
        let w2 = <string>request['w2'];
        return this.get_influential_train_instances(w1, w2);

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

    // init cumultative distribution table for negative sampling
    let train_words_pow = 0;
    let vocab_size = this.index2word.length;
    this.cum_table = [];
    for (let i = 0; i < vocab_size; i++) this.cum_table.push(0);
    for (let i = 0; i < vocab_size; i++) {
      train_words_pow += Math.pow(this.vocab[this.index2word[i]].count, POWER);
    }
    let cumultative: number = 0.0;
    for (let i = 0; i < vocab_size; i++) {
      cumultative += Math.pow(this.vocab[this.index2word[i]].count, POWER) / train_words_pow;
      this.cum_table[i] = Math.round(cumultative * CUM_TABLE_DOMAIN);
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
        // let a = get_random_init_weight(hidden_size);
        v1.push(get_random_init_weight(hidden_size));
        // v1.push(0);
      }
      syn0.push(v0);
      syn1.push(v1);
    }
    this.syn0 = syn0;
    this.syn1 = syn1;

    this.scores = [];
    this.l2_sqrts = [];
    this.qi_vec = [];
    for (let i = 0; i < vocab_size; i++)  this.scores.push(0);
    for (let i = 0; i < vocab_size; i++)  this.l2_sqrts.push(0);
    for (let j = 0; j < hidden_size; j++)  this.qi_vec.push(0);

    this.state.instances = 0;
    this.state.num_possible_outputs = vocab_size;
    this.state.epochs = 0;
    this.state.sentences = 0;

    this.exp_table = [];
    for (let i = 0; i < EXP_TABLE_SIZE; i++) {
      let v = Math.exp((i / EXP_TABLE_SIZE * 2 - 1) * MAX_EXP);
      this.exp_table.push(v / (v + 1));
    }
    this.exp_table.push(0);
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
    // sync model status with frontend
    this.state.status = request['status'];

    // Update query_in.
    this.query_in = <string[]>request['query_in'];
    if (this.query_in.length == 0) this.query_in = ['\0'];
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
  // Also updates the hidden layer status for the middle column.
  private compute_query_result() {
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
    let iterations = this.state.instances;
    let qo_lookup = this.qo_map[this.qi_key];
    let queries_watched = this.queries_watched;
    this.q_idx_set = {};
    let q_idx_set = this.q_idx_set;
    let l2_sqrts = this.l2_sqrts;

    // Update qi_vec
    for (let j = 0; j < hidden_size; j++)  qi_vec[j] = 0;
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
      l2_sqrts[i] = l2_sqrt;
      if (l2 == 0) scores[i] = 0;
      else scores[i] = prod / l2_sqrt;
    }

    // Get ranking
    let qi_scores_unsorted: ScoredItem[] = $.map(scores, (score, i) => {return {idx: i, score: score}});
    let qi_scores = qi_scores_unsorted.slice().sort((a,b) => b.score - a.score);
    $.map(qi_scores, (item_score, i) => {item_score.rank = i});
    let rank_lookup: {[watched_item:string]: number} = {};
    for (let item_score of qi_scores) {
      let word = this.index2word[item_score.idx];
      if (word in queries_watched) {
        rank_lookup[word] = item_score.rank;
      }
    }

    this.qi_scores_unsorted = qi_scores_unsorted;
    this.qi_scores = qi_scores;

    // Update ranking history for the following three types of items
    // 1. top N ranked items
    // 2. watched items
    // 3. items ranked near (+/-2) watched items (UPDATE: NOT USED)
    // [4]. excluding ignored items
    // Create records if not exist in qo_map (which means the status is NORMAL,
    // as other watched items have already been created in qo_map).
    let query_out_records: QueryOutRecord[] = [];
    let ranks_to_show: number[] = [];
    for (let i = 0; i < RANK_TO_SHOW; i++) ranks_to_show.push(i);
    for (let word of Object.keys(queries_watched)) {
      if (! (word in rank_lookup)) continue;
      if (vocab[word].idx in q_idx_set) continue;
      let rank = rank_lookup[word];
      ranks_to_show.push(rank);
      // for (let i = rank - 2; i <= rank + 2; i++) {
      //   if (i < 0) continue;
      //   if (i >= vocab_size) continue;
      //   ranks_to_show.push(i);
      // }
    }
    ranks_to_show = uniq_fast(ranks_to_show)
      .filter(rank => !(this.index2word[qi_scores[rank].idx] in this.queries_ignored))
      .filter(rank => !(qi_scores[rank].idx in q_idx_set))
      .sort();
    for (let rank of ranks_to_show) {
      let item_score = qi_scores[rank];
      let word = this.index2word[item_score.idx];
      let score = item_score.score;
      if (!(word in qo_lookup)) {
        qo_lookup[word] = {query: word, status: 'NORMAL'};
      }
      let record = qo_lookup[word];
      record.rank = rank;
      record.score = score;
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
    this.state.qi_vec = qi_vec;

    // Among the top-N ranked result, for each dimension of the vector, re-rank
    // by how excited they are.
    let qi_scores_topN = qi_scores.slice(0, RANK_TO_CONSIDER_FOR_PERDIM);
    this.state.per_dim_neighbors = [];
    for (let j = 0; j < hidden_size; j++) {
      let reranked_items: QueryOutRecord[] = $
          .map(qi_scores_topN,
               x => {
                 let score = 0;
                 if (l2_sqrts[x.idx] > 0) {
                   score = qi_vec[j] * syn0[x.idx][j] / l2_sqrts[x.idx];
                 }
                 return {
                  query: this.index2word[x.idx],
                  score: score};
               })
          .sort((a,b)=>b.score-a.score)
          .slice(0, RANK_TO_SHOW);
       this.state.per_dim_neighbors.push(reranked_items);
    }
  }

  // Given an arbitrary query, do the following:
  // 1. find its vector (syn0 normalized)
  // 2. find its nearest neighbors
  // 3. find its per-dim nearest neighbors (for hover effects)
  // 4. find element-wise product of X and Y
  // 5. find nearest neighbors shared by X and Y (like pair-profiling...)
  // 6. find per-dim nearest neighbors of element-wise product of X and Y
  private get_pair_profile(query: string): PairProfile {
    let state = this.state;
    let config = state.config;
    let hidden_size = config.hidden_size;
    let syn0 = this.syn0;
    let l2_sqrts = this.l2_sqrts;

    let qi_vec = this.qi_vec;
    let qo_idx = this.vocab[query].idx;
    let qo_vec_raw = syn0[qo_idx];  // unnormalized
    let qo_vec = $.map(qo_vec_raw, x=>x / l2_sqrts[qo_idx]);  // normalized

    let cosine_with_qo = (w: string, i: number): ScoredItem => {
      let score = 0;
      if (i != qo_idx) {
        let prod = 0;
        for (let j = 0; j < hidden_size; j++) {
          prod += qo_vec[j] * syn0[i][j];
        }
        if (l2_sqrts[i] > 0) {
          score = prod / l2_sqrts[i];
        }
      }
      return {idx: i, score: score};
    };
    let qo_scores_unsorted = $.map(this.index2word, cosine_with_qo);
    let qo_scores = qo_scores_unsorted.slice().sort((a,b) => b.score - a.score);
    let qo_neighbors = $.map(
          qo_scores.slice(0, RANK_TO_SHOW),
          item => {return {query: this.index2word[item.idx], score: item.score}});

    let qo_scores_topN = qo_scores.slice(0, RANK_TO_CONSIDER_FOR_PERDIM);
    let qo_per_dim_neighbors = [];
    for (let j = 0; j < hidden_size; j++) {
      let reranked_items: QueryOutRecord[] = $
        .map(
          qo_scores_topN,
          x => {
            let score = 0;
            if (l2_sqrts[x.idx] > 0) {
              score = qo_vec[j] * syn0[x.idx][j] / l2_sqrts[x.idx];
            }
            return {
              query: this.index2word[x.idx],
              score: score
            };
          }
        )
        .sort((a,b) => b.score - a.score)
        .slice(0, RANK_TO_SHOW);
      qo_per_dim_neighbors.push(reranked_items);
    }

    let elemprod_vec = qi_vec.map((v,i) => v * qo_vec[i]);  // X .* Y
    let elemsum_vec = qi_vec.map((v,i) => v + qo_vec[i]);  // X + Y
    elemsum_vec = getNormalizedVec(elemsum_vec);

    let cosine_with_elemsum = (w: string, i: number): ScoredItem => {
      let score = 0;
      if (i != qo_idx && ! (i in this.q_idx_set)) {
        let prod = 0;
        for (let j = 0; j < hidden_size; j++) {
          prod += elemsum_vec[j] * syn0[i][j];
        }
        if (l2_sqrts[i] > 0) {
          score = prod / l2_sqrts[i];
        }
      }
      return {idx: i, score: score};
    };
    let elemsum_scores = $.map(this.index2word, cosine_with_elemsum);


    // Rank and filter words by co-co-occurrence (only applicable to the situation
    // where the query is a watched word).
    if (query in this.train_instance_log_map) {
      // For each word in vocab, count how many times it co-occurs with query_in
      // (i.e., words in q_idx_set) := C1, and how many times it co-occurs with
      // query_out := C2. Score them by C1 * C2, and retain the top N for
      // subsequent analysis.
      let C1 = [];  // [word_idx] = count
      let C2 = [];  // [word_idx] = count
      for (let i = 0; i < this.state.vocab_size; i++) {
        C1.push(1);
        C2.push(1);
      }
      for (let qidx in this.q_idx_set) {
        let q = this.index2word[qidx];
        if (! (q in this.train_instance_log_map)) continue;
        for (let log of this.train_instance_log_map[q]) {
          C1[this.vocab[log.word2].idx]++;
        }
      }
      for (let log of this.train_instance_log_map[query]) {
        C2[this.vocab[log.word2].idx]++;
      }
      let C12 = C1.map((x,i)=>{return {score:(x * C2[i]), idx:i}});
      C12.sort((a,b)=>(b.score-a.score));
      let C12_filtered = C12
          .filter(x => x.score > 1)
          .slice(0, RANK_TO_CONSIDER_FOR_PERDIM);
      elemsum_scores = C12_filtered.map(x => elemsum_scores[x.idx]);
    }

    elemsum_scores.sort((a,b) => b.score - a.score);
    let elemsum_neighbors = $.map(
          elemsum_scores.slice(0, RANK_TO_SHOW),
          item => {return {query: this.index2word[item.idx],
                           score1: this.qi_scores_unsorted[item.idx].score,
                           score2: qo_scores_unsorted[item.idx].score}});

    let elemsum_scores_topN = elemsum_scores.slice(0, RANK_TO_CONSIDER_FOR_PERDIM);
    let elemsum_per_dim_neighbors = [];
    for (let j = 0; j < hidden_size; j++) {
      let reranked_items: QueryOutRecord[] = $
        .map(
          elemsum_scores_topN,
          x => {
            let score1 = 0;
            let score2 = 0;
            if (l2_sqrts[x.idx] > 0) {
              score1 = qi_vec[j] * syn0[x.idx][j] / l2_sqrts[x.idx];
              score2 = qo_vec[j] * syn0[x.idx][j] / l2_sqrts[x.idx];
            }
            return {
              query: this.index2word[x.idx],
              score1: score1,
              score2: score2
            };
          }
        )
        .sort((a,b) => b.score1 + b.score2 - a.score1 - a.score2)
        .slice(0, RANK_TO_SHOW);
      elemsum_per_dim_neighbors.push(reranked_items);
    }

    let out: PairProfile = {
      qo: query,
      qo_vec: qo_vec,
      qo_neighbors: qo_neighbors,
      qo_per_dim_neighbors: qo_per_dim_neighbors,
      elemprod: elemprod_vec,
      elemsum_neighbors: elemsum_neighbors,
      elemsum_per_dim_neighbors: elemsum_per_dim_neighbors
    };
    return out;
  }

  private train_until_breakpoint() {
    while (true) {
      this.train_sentence();
      if (this.breakpoint_time > 0 &&
          Date.now() >= this.breakpoint_time) {
        this.set_status('AUTO_BREAK');
        break;
      }
      if (this.breakpoint_iterations > 0 &&
          this.state.instances >= this.breakpoint_iterations) {
        this.set_status('USER_BREAK');
        break;
      }
      if (this.breakpoint_instances_watched > 0 &&
          this.count_instances_watched >= this.breakpoint_instances_watched) {
        this.set_status('USER_BREAK');
        break;
      }
    }
    this.compute_query_result();
  }

  private train_sentence() {
    let sentence = this.sentences[this.state.sentences];
    let words = sentence.split(' ');
    let config = this.state.config;

    // Update learning rate
    let progress = Math.min(1, this.state.instances / (this.state.corpus_size * this.state.config.iter));
    this.state.learning_rate = config.alpha - (config.alpha - config.min_alpha) * progress;

    // NOTE: downsampling omitted here for simplicity
    words = words.filter(w=>(w in this.vocab));
    words.forEach((word, pos) => {
      let idx1 = this.vocab[word].idx;
      let reduced_window = Math.round(get_random_float() * config.window);
      let start = Math.max(0, pos - config.window + reduced_window);
      let words_reduced_window = words.slice(start, pos + config.window + 1 - reduced_window);

      if (config.sg) {
        words_reduced_window.forEach((word2, i) => {
          let pos2 = i + start;
          if (pos2 != pos) {
            let idx2 = this.vocab[word2].idx;
            if (idx1 != idx2) {
              // Actually train it.
              let movement = this.train_sg_pair(idx1, idx2);

              // Log this training instance.
              if (word2 in this.queries_watched || idx2 in this.q_idx_set) {
                let train_instance_log: TrainInstanceLog = {
                  word: word2,
                  word2: word,
                  sentence_id: this.state.sentences,
                  epoch_id: this.state.epochs,
                  pos: pos2,
                  pos2: pos,
                  learning_rate: this.state.learning_rate,
                  movement: movement
                }
                if (! (word2 in this.train_instance_log_map)) {
                  this.train_instance_log_map[word2] = [];
                }
                this.train_instance_log_map[word2].push(train_instance_log);
              }
            }
          }
        });
      } else {
        // CBOW
        let word2_indices = [];
        words_reduced_window.forEach((word2, i) => {
          let pos2 = i + start;
          if (pos2 != pos) {
            let idx2 = this.vocab[word2].idx;
            if (idx1 != idx2) {
              word2_indices.push(pos2);
            }
          }
        });
        let l1 = [];
        for (let j = 0; j < config.hidden_size; j++) l1.push(0);
        for (let i of word2_indices) for (let j = 0; j < config.hidden_size; j++) l1[j] += this.syn0[i][j];
        if (config.cbow_mean && word2_indices.length > 0) for (let j = 0; j < config.hidden_size; j++) l1[j] /= word2_indices.length;
        this.train_cbow_pair(this.vocab[word].idx, word2_indices, l1);
      }

      this.state.instances ++;
      if (word in this.queries_watched) this.count_instances_watched ++;
    });

    this.state.sentences ++;
    if (this.state.sentences >= this.state.num_sentences) {
      this.state.sentences = 0;
      this.state.epochs ++;
    }
  }

  private train_sg_pair(w_idx: number, context_idx: number) {
    if (w_idx == context_idx) return;
    let config = this.state.config;
    let vocab_size = this.state.vocab_size;
    let syn0 = this.syn0;
    let syn1 = this.syn1;
    let l1 = syn0[context_idx];
    let neu1e = [];
    let learning_rate = this.state.learning_rate;
    for (let j = 0; j < config.hidden_size; j++) neu1e.push(0);
    for (let d = 0; d < config.negative + 1; d++) {
      let target: number;
      let label: number;
      if (d == 0) {
        target = w_idx;
        label = 1;
      } else {
        let random = get_random_float() * CUM_TABLE_DOMAIN;
        target = bSearch(this.cum_table, random);
        if (target == 0) target = Math.floor(get_random_float() * CUM_TABLE_DOMAIN) % (vocab_size - 1) + 1;
        if (target == w_idx) continue;
        label = 0;
      }
      let l2 = syn1[target];
      let f = 0;
      let g: number;
      for (let j = 0; j < config.hidden_size; j++) f += l1[j] * l2[j];
      if (f > MAX_EXP) g = (label - 1) * learning_rate;
      else if (f < -MAX_EXP) g = (label - 0) * learning_rate;
      else g = (label - this.exp_table[Math.floor((f + MAX_EXP) * (EXP_TABLE_SIZE / MAX_EXP / 2))]) * learning_rate;
      if (isNaN(g) || !isFinite(g)) {
        console.log(g, l1, l2);
        throw new Error('ValueError!');  // debug only ...
      }

      for (let j = 0; j < config.hidden_size; j++) neu1e[j] += g * l2[j];
      for (let j = 0; j < config.hidden_size; j++) l2[j] += g * l1[j];
    }
    for (let j = 0; j < config.hidden_size; j++) l1[j] += neu1e[j];
    return getL2Norm(neu1e);  // how much the context_idx's vector moves.
  }

  private train_cbow_pair(w_idx: number, context_idxs: number[], l1: number[]) {
    let config = this.state.config;
    let vocab_size = this.state.vocab_size;
    let syn0 = this.syn0;
    let syn1 = this.syn1;
    let neu1e = [];
    let learning_rate = this.state.learning_rate;
    for (let j = 0; j < config.hidden_size; j++) neu1e.push(0);
    for (let d = 0; d < config.negative + 1; d++) {
      let target: number;
      let label: number;
      if (d == 0) {
        target = w_idx;
        label = 1;
      } else {
        let random = get_random_float() * CUM_TABLE_DOMAIN;
        target = bSearch(this.cum_table, random);
        if (target == 0) target = Math.floor(get_random_float() * CUM_TABLE_DOMAIN) % (vocab_size - 1) + 1;
        if (target == w_idx) continue;
        label = 0;
      }
      let l2 = syn1[target];
      let f = 0;
      let g: number;
      for (let j = 0; j < config.hidden_size; j++) f += l1[j] * l2[j];
      if (f > MAX_EXP) g = (label - 1) * learning_rate;
      else if (f < -MAX_EXP) g = (label - 0) * learning_rate;
      else g = (label - this.exp_table[Math.floor((f + MAX_EXP) * (EXP_TABLE_SIZE / MAX_EXP / 2))]) * learning_rate;
      for (let j = 0; j < config.hidden_size; j++) neu1e[j] += g * l2[j];
      for (let j = 0; j < config.hidden_size; j++) l2[j] += g * l1[j];
    }
    for (let a of context_idxs) for (let j = 0; j < config.hidden_size; j++) syn0[a][j] += neu1e[j];
  }

  private get_influential_train_instances(w1:string, w2:string): TrainInstanceSummary[] {
    if (! (w1 in this.train_instance_log_map)) return [];
    let train_instances = this
        .train_instance_log_map[w1]
        .filter(d=>(d.word2 == w2));

    // group by sentence_id
    let by_sentence: {[sentence_id: number]: {[epoch_id: number]: TrainInstanceLog}} = {};
    for (let instance of train_instances) {
      if (!(instance.sentence_id in by_sentence)) {
        by_sentence[instance.sentence_id] = [];
      }
      by_sentence[instance.sentence_id][instance.epoch_id] = instance;
    }

    // Create TrainInstanceSummary per sentence_id
    let summaries: TrainInstanceSummary[] = [];
    for (let sentence_id_ in by_sentence) {
      let sentence_id = parseInt(sentence_id_);
      let sentence = this.sentences[sentence_id];
      let learning_rates = [];
      let movements = [];
      let total_movement = 0;
      let pos = -1;
      let pos2 = -1;
      for (let i = 0; i < this.state.epochs; i++) {
        let learning_rate = 0;
        let movement = 0;
        if (i in by_sentence[sentence_id_]) {
          let instance = by_sentence[sentence_id_][i];
          learning_rate = instance.learning_rate;
          movement = instance.movement;
          pos = instance.pos;
          pos2 = instance.pos2;
        }
        learning_rates.push(learning_rate);
        movements.push(movement);
        total_movement += movement;
      }
      summaries.push({
        total_movement: total_movement,
        sentence: sentence,
        sentence_id: sentence_id,
        pos: pos,
        pos2: pos2,
        learning_rates: learning_rates,
        movements: movements
      });
    }
    summaries.sort((a, b) => b.total_movement - a.total_movement);
    return summaries.slice(0, RANK_TO_SHOW);
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

// equivalent to python's bisect_left.
// http://codereview.stackexchange.com/questions/39573/
function bSearch(xs: number[], x: number): number {
    var bot = 0;
    var top = xs.length;
    if (xs.length == 0) return 0;
    else if (x > xs[xs.length - 1]) return xs.length;
    else if (x < xs[0]) return 0;
    while (bot < top) {
        var mid = Math.floor((bot + top) / 2);
        var c = xs[mid] - x;
        if (c === 0) return mid;
        if (c < 0) bot = mid + 1;
        if (0 < c) top = mid;
    }
    return bot;
}

interface ScoredItem {
      idx: number;
      score: number;
      rank?: number;
}

function getL2Norm(vec: number[]) {
  let sum = 0;
  for (let v of vec) {
    sum += v * v;
  }
  return Math.sqrt(sum);
}

function getNormalizedVec(vec: number[]): number[] {
  let l2norm = getL2Norm(vec);
  if (l2norm == 0) return vec;
  return vec.map(v=>v/l2norm);
}

// Used for internal logging
interface TrainInstanceLog {
  word: string;
  word2: string;
  sentence_id: number;
  epoch_id: number;
  pos: number;
  pos2: number;
  learning_rate: number;
  movement: number;
}

// Used to communicate with frontend
export interface TrainInstanceSummary {
  total_movement: number;
  sentence: string;
  sentence_id: number;
  pos: number;
  pos2: number;
  learning_rates: number[];
  movements: number[];
}
