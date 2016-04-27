/*
Essential elements that are needed for common frontend rendering are
included here. Different models should extend this class for storing details.
*/
export class ModelConfig {
  hidden_size: number;  // word2vec only
  hidden_sizes: number[];  // deep RNN
  train_corpus_url: string;

  data_overview_fields: string[];  // fields of ModelState to be displayed.
  train_overview_fields: string[];

  default_query_in: string[];
  default_query_out: string[];

  report_interval_microseconds: number;  // ms
}

/*
Contains the model's current training status, and the relevant info for the
watched terms. This needs to be light-weight, as it is passed frequently from
backend to frontend.
*/
export class ModelState {
  status: string;
  config: ModelConfig;
  query_out_records: QueryOutRecord[];
  full_model_name: string;

  // used to make query-out visualizations.
  instances: number;
  num_possible_outputs: number;
}

export interface QueryOutRecord {
  query: string;
  rank?: number;  // 0-indexed
  rank_history?: {rank: number, iteration: number}[];
  status: string;
}
