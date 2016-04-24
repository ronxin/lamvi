export class ModelConfig {
  // For network rendering
  model_type: string;
  hidden_size: number;  // word2vec only
  hidden_sizes: number[];  // deep RNN
  train_corpus_url: string;

  data_overview_fields: string[];
  train_overview_fields: string[];

  default_query_in: string[];
  default_query_out: string[];
}

export class ModelState {
  status: string;
  config: ModelConfig;
  query_in: string[];
  query_out: string[];
}
