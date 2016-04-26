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
import {ModelState, ModelConfig, QueryOutRecord} from './model_state';
import handleRequest from "./toy_model_entry";
import * as util from "./util";
import * as icons from "./icons.ts";

let ui_state: UIState;
let ui_state_hidden: UIStateHidden;
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
function handleModelState() {
  if (!model_state) {
    throw new Error('Empty model_state!');
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
        ui_state_hidden.has_setup_query_column = true;  // has to be called first!
        setupQueryColumn(model_config);  // this will apply default queries if there are none
        updateQueryOutResult();
      }
      // For debug only
      model_state.num_possible_outputs = 1000;
      model_state.iterations = 10;
      model_state.query_out_records = [
        {query: 'foo', rank: 0, status: 'GOOD',
         rank_history: [{rank:1,iteration:1},{rank:5,iteration:2},{rank:2, iteration:10}]},
        {query: 'bar', rank: 1, status: 'NORMAL',
         rank_history: [{rank:3,iteration:1},{rank:7,iteration:5},{rank:9, iteration:10}]},
        {query: 'baz', rank: 2, status: 'BAD',
         rank_history: [{rank:3,iteration:1},{rank:7,iteration:5},{rank:9, iteration:10}]},
        {query: 'baz1', rank: 100, status: 'WATCHED',
         rank_history: [{rank:3,iteration:1},{rank:7,iteration:5},{rank:9, iteration:10}]},
        {query: 'baz2', rank: 101, status: 'NORMAL',
         rank_history: [{rank:3,iteration:1},{rank:7,iteration:5},{rank:9, iteration:10}]},
      ];

      updateQueryOutSVG();
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
    model_state = <ModelState>response;
    handleModelState();
  });
}

// sends "init_model" request
function init_model() {
  sendRequestToBackend('init_model', {}, (response: any) => {
    model_state = <ModelState>response;
    handleModelState();
  });
}

function updateUIStatus(status: string): void {
  $("#training-status").html(status);
}

// Update and validate query_in
function updateQueryIn(event, ui): void {
  if (ui.duringInitialization) return;
  ui_state.query_in = $('#query-in-tags').tagit('assignedTags');
  sendRequestToBackend('validate_query_in', {query_in: ui_state.query_in},
    (response) => {
      let is_valid = response['is_valid'];
      ui_state_hidden.is_queryin_valid = is_valid;
      if (!is_valid) {
        let message = response['message'];
        $('#query-in-error-message').html(message).show();
      } else {
        $('#query-in-error-message').hide();
        ui_state_hidden.should_not_reset_on_hashchange = true;
        ui_state.serialize();
        updateQueryOutResult();
      }
    }
  );
}

function searchQueryOut(query: string): void {
  $('#query-out-error-message').hide();
  if (query.length == 0) return;
  sendRequestToBackend('validate_query_out', {query_out: query},
    response => {
      let is_valid = response['is_valid'];
      if (!is_valid) {
        let message = response['message'];
        $('#query-out-error-message').html(message).show();
      } else {
        let already_shown = false;
        for (let record of model_state.query_out_records) {
          if (record.query != query) continue;
          if (record.status == 'IGNORED' || record.status == 'NORMAL') {
            record.status = 'WATCHED';
            already_shown = true;
          }
        }

        if (already_shown) {
          updateUIStateQueryOut();  // update the URL
          updateQueryOutSVG();  // update SVG.
        } else {
          model_state.query_out_records.push({
            query: query, status: 'WATCHED',
            rank: -1, rank_history:[]});
          updateUIStateQueryOut();  // update the URL
          updateQueryOutResult();  // goes to model and internally calls SVG update.
        }
      }
    }
  );
}

// The frontend uses model_state.query_out_records to keep track of status for
// convenience. But that information cannot be used to communicate with backend.
// This function converts the query and status information stored in
// model_state.query_out_records into ui_state.query_out, which can be be sent
// to the backend via request.
function updateUIStateQueryOut(): void {
  let query_out: string[] = [];
  for (let record of model_state.query_out_records) {
    let prefix = record.status[0];
    let query = record.query;
    query_out.push(`${prefix}_${query}`);
  }
  ui_state.query_out = query_out;
  ui_state_hidden.should_not_reset_on_hashchange = false;
  ui_state.serialize();
}

// Sends request to backend.
function updateQueryOutResult(): void {
  sendRequestToBackend('update_query_out_result',
    {query_in: ui_state.query_in, query_out: ui_state.query_out},
     (response:{}) => {
       model_state = <ModelState>response;
       handleModelState();
    });
}

const query_out_svg_width = 100;  // view box, not physical
const query_out_svg_height = 100;  // view box, not physical

// First-time intializing query column.
function setupQueryColumn(model_config: ModelConfig): void {
  $('.column.query').show();

  // Default queries
  if (ui_state.query_in.length == 0) {
    ui_state.query_in = model_config.default_query_in;
  }
  if (ui_state.query_out.length == 0) {
    ui_state.query_out = model_config.default_query_out;
  }
  ui_state_hidden.should_not_reset_on_hashchange = true;
  ui_state.serialize();

  // Set up query-in viewer
  $('#query-in-container')
    .empty()
    .append('<ul id="query-in-tags"></ul>');

  for (let query of ui_state.query_in) {
    $("#query-in-tags").append('<li>' + query + '</li>');
  }

  $('#query-in-tags').tagit({
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

  // Set up query-out viewer
  d3.select('#query-out-container > *').remove();
  let svg = d3.select('#query-out-container')
    .append('div')
    .classed('query-out', true)
    .append('svg')
    .attr('width', '100%')
    .attr('viewBox', '0 0 ' + query_out_svg_width + ' ' + query_out_svg_height)
    .attr('preserveAspectRatio', "xMinYMin");

  ui_state_hidden.qo_svg = svg;

  // Adding a colored background for debugging
  // svg.append('rect')
  //   .attr('width', '100%')
  //   .attr('height', '100%')
  //   .attr('fill', '#E8E8EE');

  // Draw left index bar
  svg.append('rect')
    .attr('x', 1)
    .attr('y', 0)
    .attr('width', 3)
    .attr('height', query_out_svg_height)
    .attr('fill', 'lightgrey');
}


function updateQueryOutSVG() {
  // Compute layout
  const default_item_height = 6;
  const default_item_pad = 0.8;
  const default_gap = 5;
  const word_box_width = 35;
  const linechart_width = 30;

  if (! model_state.query_out_records) {
    throw new Error("model_state.query_out_records is not populated.");
  }
  let query_out_records = model_state.query_out_records;
  query_out_records = query_out_records.filter(d => d.status != 'IGNORED');

  if (model_state.num_possible_outputs <= 0) {
    throw new Error("model_state.num_possible_outputs must be positive");
  }

  if (typeof model_state.iterations == undefined) {
    throw new Error('model_state.iterations must be set.');
  }

  query_out_records.sort((a, b) => {
    return a.rank - b.rank;
  });
  let y = 0;
  let last_rank = -1;
  for (let q of query_out_records) {
    q['y'] = (q.rank == last_rank + 1) ? y : y + default_gap;
    y = q['y'] + default_item_height + default_item_pad;
    last_rank = q.rank;

    q['y_idxbar'] = query_out_svg_height * q.rank / model_state.num_possible_outputs;

  }

  let item_height = default_item_height;
  if (y > query_out_svg_height) {
    let shrink_factor = query_out_svg_height / y;
    item_height *= shrink_factor;
    for (let q of query_out_records) {
      q['y'] *= shrink_factor;
    }
  }

  // Preprocess linechart data
  let linechart_maxY = 0;
  for (let q of query_out_records) {
    let max = Math.max.apply(null, $.map(q.rank_history, x=>x.rank));
    linechart_maxY = Math.max(linechart_maxY, max);
  }
  let linechart_xScale = d3.scale.linear()
    .domain([0, model_state.iterations - 1])
    .range([0, linechart_width]);
  let linechart_yScale = d3.scale.linear()
    .domain([0, linechart_maxY])
    .range([0, item_height]);

  // ----------------------
  // Draw query-out items.
  // See enter-update-exit pattern: https://bl.ocks.org/mbostock/3808218
  // UPDATE: Not using the enter-update-exit pattern. Just redrawing everything
  // per each update.
  let svg = ui_state_hidden.qo_svg;
  svg.selectAll('g').remove();
  let record_objs = svg.selectAll('g')
    .data(query_out_records, d=>d.query)
    .enter()
    .append('g')
    .attr('class', d => `qo-item ${d.status}`);


  // Draw marker on index bar
  record_objs.append('rect')
    .attr('x', 0)
    .attr('y', (d)=>{return d['y_idxbar']})
    .attr('width', 5)
    .attr('height', 1)
    .classed('qo-idxbar-marker', true);

  // Draw lines between index bar and items
  record_objs.append('path')
    .attr('d', (d) => {
      return 'M 5 ' + d['y_idxbar']
        + ' C 7.5 ' + d['y_idxbar']
        + '   7.5 ' + d['y']
        + '   10  ' + d['y']
        + ' L 10  ' + (d['y'] + item_height)
        + ' C 7.5 ' + (d['y'] + item_height)
        + '   7.5 ' + (d['y_idxbar'] + 1)
        + '   5   ' + (d['y_idxbar'] + 1);
    })
    .classed('qo-idxbar-connector', true);

  // Draw rank boxes.
  let rank_boxes = record_objs.append('g')
    .attr('transform', (d) => {
      return 'translate(10,'+d['y']+')';
    });
  rank_boxes.append('rect')
    .attr('width', '10')
    .attr('height', item_height)
    .classed('qo-box', true)
    .classed('qo-rank-box', true);

  rank_boxes.append('text')
    .text((d) => {return '#' + (d.rank + 1)})
    .style('font-size', function (d) {
      // Must not use fat-arrow functions here, otherwise the "this" below
      // will not be correctly captured.
      return Math.min(4, 10 / this.getComputedTextLength() * 10) + 'px';
    })
    .attr('text-anchor', 'middle')
    .attr('alignment-baseline', 'central')
    .attr('dx', '5px')
    .attr('dy', (item_height/2) + 'px');

  // Draw word boxes.
  let word_boxes = record_objs.append('g')
    .attr('transform', (d) => {
      return 'translate(20,'+d['y']+')';
    });
  word_boxes.append('rect')
    .attr('width', word_box_width)
    .attr('height', item_height)
    .classed('qo-box', true)
    .classed('qo-word-box', true);

  word_boxes.append('text')
    .text((d) => {return d.query})
    .style('font-size', function (d) {
      // Must not use fat-arrow functions here, otherwise the "this" below
      // will not be correctly captured.
      return Math.min(3.5, 10 / this.getComputedTextLength() * 12) + 'px';
    })
    .attr('text-anchor', 'middle')
    .attr('alignment-baseline', 'central')
    .attr('dx', word_box_width / 2)
    .attr('dy', (item_height/2) + 'px');

  // Draw rank histories line-charts.
  let linecharts = record_objs.append('g')
    .attr('transform', (d) => `translate(55, ${d['y']})`);

  linecharts.append('rect')
    .attr('width', linechart_width)
    .attr('height', item_height)
    .classed('qo-box', true)
    .classed('qo-linechart-box', true);

  linecharts.append('path')
    .classed('qo-linechart', true)
    .datum(d => d.rank_history)
    .attr('d', d3.svg.line<{rank:number,iteration:number}>()
      .x(d => linechart_xScale(d.iteration - 1))
      .y(d => linechart_yScale(d.rank)));

  // Draw control icons
  const control_icon_data = [
    {'name': 'thumb_up', 'svg': icons.thumb_up,
     'rotate': 0, 'translate': '1,1',
     'title': 'label/unlabel as good output'},
    {'name': 'thumb_down', 'svg': icons.thumb_up,
     'rotate': 180, 'translate': '-8.75,-5',
     'title': 'label/unlabel as bad output'},
    {'name': 'waste_bascket', 'svg': icons.waste_bascket,
     'rotate': 0, 'translate': '10,1',
     'title': 'ignore this output'},
  ]
  let control_icons = record_objs.append('g')
    .attr('transform', d=>`translate(85, ${d['y']})`)
    .selectAll('g')
    .data(control_icon_data)
    .enter()
    .append('g')
    .html(d=>d.svg)
    .attr('class', d=>`qo-control-icon ${d.name}`)
    .attr('transform', d=>`rotate(${d.rotate}) translate(${d.translate}) scale(0.035)`)
    .attr('title', d=>d.title)
    .on('click', function(d) {
      let record = <QueryOutRecord>d3.select(this.parentNode.parentNode).datum();
      if ((record.status == 'GOOD' && d.name == 'thumb_up' )
          || (record.status == 'BAD' && d.name == 'thumb_down')) {
        record.status = 'NORMAL';
      } else if (d.name == 'thumb_up') {
        record.status = 'GOOD';
      } else if (d.name == 'thumb_down') {
        record.status = 'BAD';
      } else if (d.name == 'waste_bascket') {
        record.status = 'IGNORED';
      }
      updateQueryOutSVG();
    });

  let selection: any = $(".qo-control-icon");  // overrides typescript checking.
  selection.tooltip({
    'container': 'body',
    'placement': 'bottom',
    'delay': 300
  });
  $('.tooltip').remove();
}

window.addEventListener('hashchange', () => {
  if (ui_state_hidden.should_not_reset_on_hashchange) {
    ui_state_hidden.should_not_reset_on_hashchange = false;
  } else {
    reset();
  }
});

$('#query-out-search').autocomplete({
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
});

$('#btn-update-restart').click(() => {
  reset();
});

$('#btn-add-to-watchlist').click(() => {
  let qo = $('#query-out-search').val();
  searchQueryOut(qo);
});

reset();
