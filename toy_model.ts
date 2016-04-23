import {ModelConfig, ModelState} from "./model_state";

export interface ToyModel {
  update_config(config: ModelConfig): void;
  get_state(): ModelState;
}
