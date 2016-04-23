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
  UIState,
  ModelConfig,
  ModelState,
  getKeyFromValue,
} from "./state";
import handleRequest from "./toy_backend";
import * as util from "./util";

let ui_state: UIState;
let model_state: ModelState;

function validateBackend() {
  if (ui_state.backend == "browser") {
    if (ui_state.model != 'word2vec') {
      showError('Unrecognized model type: "' + ui_state.model + '".');
    }
  } else {
    if (!util.isUrl(ui_state.backend)) {
      showError('backend must be either "browser" or a valid URL. Currently specified to "' +
                ui_state.backend + '".');
    }
  }
}

function sendRequestToBackend(type: string, request: {}, callback: (response: any)=>any) {
  if (ui_state.backend == "browser") {
    let response: any = handleRequest(type, request);
    callback(response);
  } else {
    request['type'] = type;
    $.getJSON(ui_state.backend, request, function(response: any) {
      if (response.hasOwnProperty('error')) {
        showError(response.error);
      } else {
        callback(response);
      }
    });
  }
}

function reset() {
  $(".top-error-banner").empty().hide();
  ui_state = UIState.deserializeState();
  ui_state.serialize();  // fold missing default values (if any) back to URL.
  validateBackend();
  init_ui();
}

function showError(message: string) {
  console.log(message);
  let new_error = '<p>' + message + '</p>';
  $('.top-error-banner').append(new_error);
  $('.top-error-banner').show();
}

// sends identify request and handles response
function init_ui() {
  let request = {};
  if (ui_state.backend == "browser") {
    request['model_type'] = ui_state.model;
  }
  sendRequestToBackend('identify', request, (response: any) => {
    let model_state = <ModelState>response;
    let model_config = model_state.config;
    $('#config-text').html(JSON.stringify(model_config, null, ''));
  });
}

window.addEventListener('hashchange', () => {
  reset();
})

reset();
