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
/// <reference path="tag-it.d.ts" />

import {UIState, UIStateHidden} from "./ui_state";
import {ModelState, ModelConfig} from './model_state';
import handleRequest from "./toy_model_entry";
import * as util from "./util";

let ui_state: UIState;
let ui_state_hidden: UIStateHidden = new UIStateHidden();;

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

function sendRequestToBackend(type: string, request: {}, callback: (response: any) => any) {
  if (ui_state.backend == "browser") {
    let response: any = handleRequest(type, request);
    callback(response);
  } else {
    request['type'] = type;
    $.getJSON(ui_state.backend, request, function (response: any) {
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
  $('.column.query').hide();
  ui_state_hidden = new UIStateHidden();  // repopulate with default value.

  ui_state = UIState.deserializeState();
  ui_state.serialize();  // fold missing default values (if any) back to URL.
  validateBackend();


  updateUIStatus("Identifying model...");
  identify_model();
}

function showError(message: string) {
  console.log(message);
  let new_error = '<p>' + message + '</p>';
  $('.top-error-banner').append(new_error);
  $('.top-error-banner').show();
}

// depending on the model's returned model state, performs different frontend
// tasks and sends different follow-up requests to model.
function handleModelState(model_state: ModelState) {
  if (!model_state) {
    throw new Error('Empty model_state returned!');
  }
  let model_config = model_state.config;
  switch (model_state.status) {
    case 'WAIT_FOR_CORPUS':  // for in-browser models only
      updateUIStatus('Loading corpus...');
      $.get(model_config.train_corpus_url, (corpus) => {
        if (corpus) {
          let corpus_preview: string = corpus.substr(0, 1000);
          $('#train-text').text(corpus_preview);
          $("#train-corpus-link").attr('href', model_config.train_corpus_url).show();
          sendRequestToBackend('set_corpus', { 'corpus': corpus }, handleModelState);
        } else {
          throw new Error('Failed to load corpus.');
        }
      });
      break;

    case 'WAIT_FOR_INIT':
      $('#model-type').html(' - Type: ' + model_state.full_model_name);
      $('#config-text').html(JSON.stringify(model_config, null, ''));
      updateUIStatus('Building vocabulary and initializing model...');
      init_model();
      break;

    case 'WAIT_FOR_TRAIN':
      // Display overview of training data
      let data_overview_fields = model_config.data_overview_fields;
      $('#train-data-overview').empty();
      for (let field of data_overview_fields) {
        if (model_state.hasOwnProperty(field)) {
          let val = model_state[field];
          $('#train-data-overview').append(
            '<div><b>' + field + ':</b>&nbsp;' + val + '</div>');
        }
      }

      // Display overview of training status
      let train_overview_fields = model_config.train_overview_fields;
      $('#train-status-overview').empty();
      for (let field of train_overview_fields) {
        if (model_state.hasOwnProperty(field)) {
          let val = model_state[field];
          $('#train-status-overview').append(
            '<div><b>' + field + ':</b>&nbsp;' + val + '</div>');
        }
      }

      // Display queries
      if (!ui_state_hidden.has_setup_query_column) {
        setupQueryColumn(model_config);
        ui_state_hidden.has_setup_query_column = true;
      }

      break;

    default:
      throw new Error('Unrecognized model status: "' + model_state.status + '"');
  }
}

// sends "identify" request
function identify_model() {
  let config_json = $('#config-text').val();
  let config_obj = null;
  try {
    config_obj = JSON.parse(config_json);
  } catch (e) {
    showError("The model configuration JSON is not valid.");
    return;
  }
  let request = { model_type: ui_state.model, model_config: config_obj };
  sendRequestToBackend('identify', request, (response: any) => {
    let model_state = <ModelState>response;
    handleModelState(model_state);
  });
}

// sends "init_model" request
function init_model() {
  sendRequestToBackend('init_model', {}, (response: any) => {
    let model_state = <ModelState>response;
    handleModelState(model_state);
  });
}

function updateUIStatus(status: string): void {
  $("#training-status").html(status);
}

// Update and validate query_in
function updateQueryIn(): void {
  ui_state.query_in = $('#query-tags').tagit('assignedTags');
  sendRequestToBackend('validate_query_in', {query_in: ui_state.query_in},
    (response) => {
      let is_valid = response['is_valid'];
      ui_state_hidden.is_queryin_valid = is_valid;
      if (!is_valid) {
        let message = response['message'];
        $('#query-in-error-message').html(message).show();
      } else {
        $('#query-in-error-message').hide();
      }
    }
  );
}

// First-time intializing query column.
function setupQueryColumn(model_config: ModelConfig): void {
  $('.column.query').show();

  $('#query-tags').tagit({
    autocomplete: {
      source: (request: {}, response: any) => {
        sendRequestToBackend('autocomplete', request, function (data: {}) {
          if (data && data.hasOwnProperty('items')) {
            response(data['items']);
          } else {
            response([]);
          }
        });
      },
      delay: 0,
      minLength: 1,
    },
    removeConfirmation: true,
    allowDuplicates: true,
    placeholderText: 'Type here',
    afterTagAdded: updateQueryIn,
    afterTagRemoved: updateQueryIn
  });

  if (ui_state.query_in.length == 0) {
    ui_state.query_in = model_config.default_query_in;
  }
  for (let query of ui_state.query_in) {
    $("#query-tags").tagit('createTag', query);
  }
}

window.addEventListener('hashchange', () => {
  reset();
});

$('#btn-update-restart').click(() => {
  reset();
});

reset();
