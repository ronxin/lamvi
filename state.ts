/*
Implementation partially borrowed from https://github.com/tensorflow/playground/
Modification Copyright: (2016) Xin Rong. License: MIT.

Original file copyright:
------------------------
Copyright 2016 Google Inc. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

export class ModelConfig {
  [key: string]: any;

  // For network rendering
  model_type: string;
  hidden_size: number;  // word2vec only
  hidden_sizes: number[];  // deep RNN
  vocab_size: number;

  data_overview_fields: string[];
  train_overview_fields: string[];

  default_query_in: string[];
  default_query_out: string[];
}

export class ModelState {
  [key: string]: any;

  config: ModelConfig;
  query_in: string[];
  query_out: string[];
}

export function getKeyFromValue(obj: any, value: any): string {
  for (let key in obj) {
    if (obj[key] === value) {
      return key;
    }
  }
  return undefined;
}

/**
 * The data type of a state variable. Used for determining the
 * (de)serialization method.
 */
export enum Type {
  STRING,
  NUMBER,
  ARRAY_NUMBER,
  ARRAY_STRING,
  BOOLEAN,
  OBJECT
}

export interface Property {
  name: string;
  type: Type;
  keyMap?: {[key: string]: any};
};

export class UIState {
  private static PROPS: Property[] = [
    {name: "model", type: Type.STRING},
    {name: "backend", type: Type.STRING}
  ];

  [key: string]: any;
  model = "word2vec";  // useful only when backend == 'browser'
  backend = "browser";

  /**
   * Deserializes the state from the url hash.
   */
  static deserializeState(): UIState {
    let map: {[key: string]: string} = {};
    for (let keyvalue of window.location.hash.slice(1).split("&")) {
      let [name, value] = keyvalue.split("=");
      map[name] = value;
    }
    let state = new UIState();

    function hasKey(name: string): boolean {
      return name in map && map[name] != null && map[name].trim() !== "";
    }

    function parseArray(value: string): string[] {
      return value.trim() === "" ? [] : value.split(",");
    }

    // Deserialize regular properties.
    UIState.PROPS.forEach(({name, type, keyMap}) => {
      switch (type) {
        case Type.OBJECT:
          if (keyMap == null) {
            throw Error("A key-value map must be provided for state " +
                "variables of type Object");
          }
          if (hasKey(name) && map[name] in keyMap) {
            state[name] = keyMap[map[name]];
          }
          break;
        case Type.NUMBER:
          if (hasKey(name)) {
            // The + operator is for converting a string to a number.
            state[name] = +map[name];
          }
          break;
        case Type.STRING:
          if (hasKey(name)) {
            state[name] = map[name];
          }
          break;
        case Type.BOOLEAN:
          if (hasKey(name)) {
            state[name] = (map[name] === "false" ? false : true);
          }
          break;
        case Type.ARRAY_NUMBER:
          if (name in map) {
            state[name] = parseArray(map[name]).map(Number);
          }
          break;
        case Type.ARRAY_STRING:
          if (name in map) {
            state[name] = parseArray(map[name]);
          }
          break;
        default:
          throw Error("Encountered an unknown type for a state variable");
      }
    });

    return state;
  }

  /**
   * Serializes the state into the url hash.
   */
  serialize() {
    // Serialize regular properties.
    let props: string[] = [];
    UIState.PROPS.forEach(({name, type, keyMap}) => {
      let value = this[name];
      // Don't serialize missing values.
      if (value == null) {
        return;
      }
      if (type === Type.OBJECT) {
        value = getKeyFromValue(keyMap, value);
      } else if (type === Type.ARRAY_NUMBER ||
          type === Type.ARRAY_STRING) {
        value = value.join(",");
      }
      props.push(`${name}=${value}`);
    });
    window.location.hash = props.join("&");
  }
}

