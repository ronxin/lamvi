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

/// <reference path="typings/browser.d.ts" />
// The above reference is essential for d3 to be loaded via typings.

import {
  State,
  getKeyFromValue,
} from "./state";

let state = State.deserializeState();

function reset() {
  state.serialize();
}

reset();

// TODO: the next step is to set up a standard API: the frontend queries the
// "backend" for config, and set up communication protocol.

