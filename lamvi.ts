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
import {Word2vecState, PairProfile, TrainInstanceSummary} from "./toy_model_w2v";
import handleRequest from "./toy_model_entry";
import * as util from "./util";
import * as icons from "./icons";
import drawBarChart from "./barchart";

let ui_state: UIState;
let ui_state_hidden: UIStateHidden;
let model_state: ModelState;
let train_init_timeout: number;

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
  // $('.column.query').hide();
  ui_state_hidden = new UIStateHidden();  // repopulate with default value.

  ui_state = UIState.deserializeState();
  ui_state.serialize();  // fold missing default values (if any) back to URL.
  validateBackend();

  updateUIStatus("Identifying model...");
  identify_model();

  $('#btn-update-restart').click(reset);
  $('#btn-start-pause').click(function() {
    if (!ui_state_hidden.is_to_pause_training
        && (ui_state_hidden.is_model_busy_training
            || model_state.status == 'AUTO_BREAK')) {
      $(this).html('Start');
      ui_state_hidden.is_to_pause_training = true;
      updateUIStatus('Pausing training...');
      // window.clearTimeout(train_init_timeout);
    }
    else if (!ui_state_hidden.is_model_busy_training
        && model_state
        && (model_state.status == 'WAIT_FOR_TRAIN'
            || model_state.status == 'USER_BREAK')) {
      $(this).html('Pause');
      updateUIStatus('Training...');
      train_init_timeout = setTimeout(() => {batch_train(-1, false);}, 150);
    }
  });
  $('#btn-next').click(function() {
    if (!ui_state_hidden.is_model_busy_training
        && model_state
        && (model_state.status == 'WAIT_FOR_TRAIN'
            || model_state.status == 'USER_BREAK')) {
      updateUIStatus('Training until hitting next watched item...');
      train_init_timeout = setTimeout(()=>{batch_train(1, true);}, 150);
    }
  });
  $('#btn-reset').click(reset);

  $('#btn-add-to-watchlist').click(() => {
    let qo = $('#query-out-search').val();
    searchQueryOut(qo);
  });

  addColorBar();
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
  ui_state_hidden.is_model_busy_training = false;
  if (!model_state) {
    throw new Error('Empty model_state!');
  }
  let model_config = model_state.config;

  if (model_state.status == 'AUTO_BREAK' && ui_state_hidden.is_to_pause_training) {
    model_state.status = 'USER_BREAK';
  }

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
      updateUIStatus('Ready for training.');
      display_training_data_overview();
      display_training_status_overview();

      if (!ui_state_hidden.has_setup_query_column) {
        ui_state_hidden.has_setup_query_column = true;  // has to be called first!
        setupQueryColumn(model_config);  // this will apply default queries if there are none
        updateQueryOutResult();
      }
      updateQueryOutSVG();
      updateHiddenIn();
      updateScatterPlot();
      break

    case 'AUTO_BREAK':
      train_init_timeout = setTimeout(resume_training, 150);
      display_training_status_overview();
      updateQueryOutSVG();
      updateHiddenIn();
      updateScatterPlot();
      break;

    case 'USER_BREAK':
      updateUIStatus('Training paused.');
      display_training_status_overview();
      updateQueryOutSVG();
      updateHiddenIn();
      updateScatterPlot();
      break;

    default:
      throw new Error('Unrecognized model status: "' + model_state.status + '"');
  }
}

function display_training_data_overview() {
  let model_config = model_state.config;
  let data_overview_fields = model_config.data_overview_fields;
  $('#train-data-overview').empty();
  for (let field of data_overview_fields) {
    if (model_state.hasOwnProperty(field)) {
      let val = model_state[field];
      $('#train-data-overview').append(
        '<div><b>' + field + ':</b>&nbsp;' + val + '</div>');
    }
  }
}

function display_training_status_overview() {
  let model_config = model_state.config;
  let train_overview_fields = model_config.train_overview_fields;
  $('#train-status-overview').empty();
  for (let field of train_overview_fields) {
    if (model_state.hasOwnProperty(field)) {
      let val = model_state[field];
      $('#train-status-overview').append(
        '<div><b>' + field + ':</b>&nbsp;' + val + '</div>');
    }
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
        ui_state_hidden.skip_reset_on_hashchange = true;
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
    if (prefix == 'N') continue;
    let query = record.query;
    query_out.push(`${prefix}_${query}`);
  }
  ui_state.query_out = query_out;
  ui_state_hidden.skip_reset_on_hashchange = true;
  ui_state.serialize();
}

// Sends request to backend.
function updateQueryOutResult(): void {
  sendRequestToBackend('update_query_out_result',
    {
      query_in: ui_state.query_in,
      query_out: ui_state.query_out,
      status: model_state.status  // for consistency
    },
    (response:{}) => {
      model_state = <ModelState>response;
      handleModelState();
    });
}

const query_out_svg_width = 100;  // view box, not physical
const query_out_svg_height = 100;  // view box, not physical

// First-time intializing query column.
function setupQueryColumn(model_config: ModelConfig): void {
  // $('.column.query').show();

  // Default queries
  if (ui_state.query_in.length == 0) {
    ui_state.query_in = model_config.default_query_in;
  }
  if (ui_state.query_out.length == 0) {
    ui_state.query_out = model_config.default_query_out;
  }
  ui_state_hidden.skip_reset_on_hashchange = true;
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

  if (typeof model_state.instances == undefined) {
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
    .domain([0, model_state.instances])
    .range([linechart_width*0.025, linechart_width*0.975]);
  let linechart_yScale = d3.scale.linear()
    .domain([0, linechart_maxY])
    .range([item_height*0.025, item_height*0.975]);

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
      return Math.min(3, 55 / this.getComputedTextLength() * 5) + 'px';
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
      .x(d => linechart_xScale(d.iteration))
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
      updateUIStateQueryOut();
      updateQueryOutSVG();
    });

  let selection: any = $(".qo-control-icon");  // overrides typescript checking.
  selection.tooltip({
    'container': 'body',
    'placement': 'bottom',
    'delay': 300
  });
  $('.tooltip').remove();

  record_objs.on('click', d => {
    sendRequestToBackend('pair_profile', {query: d.query}, display_pair_profile);
  });
}

function batch_train(iterations: number, watched: boolean): void {
  ui_state_hidden.is_model_busy_training = true;
  ui_state_hidden.is_to_pause_training = false;
  sendRequestToBackend('train',
    {iterations: iterations, watched: watched},
    handleModelState
  );
}

function resume_training(): void {
  if (ui_state_hidden.is_to_pause_training) {
    updateUIStatus('Training paused.');
    model_state.status = 'USER_BREAK';
  } else {
    ui_state_hidden.is_model_busy_training = true;
    sendRequestToBackend('train-continue', {}, handleModelState);
  }
}

// word2vec only
function updateHiddenIn(): void {
  let svg = d3.select('#hidden-in-container svg.heatmap');
  let w2v_model_state = <Word2vecState>model_state;
  let tbody = d3.select('#hidden-in-container tbody');
  let default_records = w2v_model_state.query_out_records;
  let per_dim_records = w2v_model_state.per_dim_neighbors;
  d3.select('#hidden-in-container .query')
    .html('&nbsp; - "' + ui_state.query_in.join('" "') + '"');

  updateHeatMap(svg, w2v_model_state.qi_vec, default_records, per_dim_records, tbody, false, null);
  updateInspectorTBody(tbody, default_records, false, null);
}

function updateHeatMap(svg: d3.Selection<any>, vector: number[],
    default_records: QueryOutRecord[], per_dim_records: QueryOutRecord[][],
    tbody: d3.Selection<any>, is_pair: boolean, query_out: string): void {
  const hmap_svg_width = 100;
  const hmap_svg_height = 100;
  let ncol = Math.floor(Math.sqrt(vector.length));
  let nrow = ncol*ncol == vector.length ? ncol : ncol + 1;
  let cellHeight = hmap_svg_height / nrow;
  let cellWidth = hmap_svg_width / ncol;
  let cellFillHeight = 0.95 * cellHeight;
  let cellFillWidth = 0.95 * cellWidth;
  svg.selectAll('*').remove();
  svg.selectAll('g.cell')
    .data(vector)
    .enter()
    .append('g')
    .classed('cell', true)
    .append('rect')
    .attr('x', (d,i) => cellWidth * (i % ncol))
    .attr('y', (d,i) => cellHeight * (Math.floor(i / ncol)))
    .attr('width', cellFillWidth)
    .attr('height', cellFillHeight)
    .style('fill', d => {return util.exciteValueToColor(d)})
    .on('mouseover', (d,i)=>{updateInspectorTBody(tbody, per_dim_records[i], is_pair, query_out)})
    .on('mouseout', ()=>{updateInspectorTBody(tbody, default_records, is_pair, query_out)});
}

function updateInspectorTBody(
    tbody: d3.Selection<any>,
    ranked_items: {query:string, score?:number, score1?:number, score2?:number}[],
    is_pair: boolean, query_out: string): void {
  tbody.selectAll('*').remove();
  let rows = tbody.selectAll('tr')
    .data(ranked_items.slice(0, 8))
    .enter()
    .append('tr');

  rows.append('td').html(d=>d.query);
  if (is_pair) {
    rows.append('td').html(d=>(''+d.score1).slice(0, 5));
    rows.append('td').html(d=>(''+d.score2).slice(0, 5));
    if (!query_out) {
      throw new Error('when is_pair is true, query_out must be assigned.');
    }
    let query_in = ui_state.query_in[0];
    rows.on('click', d=>{
      sendRequestToBackend('influential_train_instances', {w1: query_in, w2: d.query}, response => {
        $('#concordance-container').show();
        d3.select('#concordance-container .query').html(`&nbsp; - "${query_in}"" vs "${d.query}"`);
        display_concordance(d3.select('#concordance-container tbody'), response);
      });
      sendRequestToBackend('influential_train_instances', {w1: query_out, w2: d.query}, response => {
        $('#concordance-container-2').show();
        d3.select('#concordance-container-2 .query').html(`&nbsp; - "${query_out}"" vs "${d.query}"`);
        display_concordance(d3.select('#concordance-container-2 tbody'), response);
      });
    });
  } else {
    rows.append('td').html(d=>(''+d.score).slice(0, 5));
  }
}

function display_pair_profile(response:{}): void {
  $('#hidden-out-container').show();
  $('#hidden-product-container').show();

  let svg_out = d3.select('#hidden-out-container svg.heatmap');
  let tbody_out = d3.select('#hidden-out-container tbody');
  let svg_prod = d3.select('#hidden-product-container svg.heatmap');
  let tbody_prod = d3.select('#hidden-product-container tbody');

  let w2v_model_state = <Word2vecState>model_state;
  let pair_profile = <PairProfile>response;

  let default_records_out = pair_profile.qo_neighbors;
  let per_dim_records_out = pair_profile.qo_per_dim_neighbors;
  d3.select('#hidden-out-container .query')
    .html('&nbsp; - "' + pair_profile.qo + '"');
  updateHeatMap(svg_out, pair_profile.qo_vec, default_records_out, per_dim_records_out, tbody_out, false, null);
  updateInspectorTBody(tbody_out, default_records_out, false, null);

  let default_records_prod = pair_profile.elemsum_neighbors;
  let per_dim_records_prod = pair_profile.elemsum_per_dim_neighbors;
  updateHeatMap(svg_prod, pair_profile.elemprod, default_records_prod, per_dim_records_prod, tbody_prod, true, pair_profile.qo);
  updateInspectorTBody(tbody_prod, default_records_prod, true, pair_profile.qo);
}

function display_concordance(tbody: d3.Selection<any>, data: TrainInstanceSummary[]): void {
  let summaries = data;
  tbody.selectAll('*').remove();
  let rows = tbody.selectAll('tr')
    .data(summaries.slice(0, 8))
    .enter()
    .append('tr');
  rows.append('td').html(d=>(''+d.total_movement).slice(0, 5));
  // About nested d3 data structure: http://code.hazzens.com/d3tut/lesson_3.html
  rows.append('td')
    .selectAll('span')
    .data(d => {
      let words = d.sentence.split(' ');
      return words.map((w,i)=>{
        let cls: string;
        if (d.pos == i) cls = 'pos1';
        else if (d.pos2 == i) cls = 'pos2';
        else cls = 'normal';
        if (i > 0) w = ' ' + w;
        return {w: w, cls:cls};
      }).filter((w,i) => {
        let window = model_state.config['window'];
        if (i < d.pos - window - 2 || i > d.pos + window + 2) return false;
        return true;
      });
    })
    .enter()
    .append('span')
    .attr('class', d=>d['cls'])
    .text(d=>d['w']);

  rows.on('click', d=>{
    $('#instance-inspector-container').show();
    let svg1 = d3.select('#instance-inspector-container svg.left');
    let svg2 = d3.select('#instance-inspector-container svg.right');
    drawBarChart(svg1, d.learning_rates, 'Epochs');
    drawBarChart(svg2, d.movements, 'Epochs');
  });
}

function updateScatterPlot() {
  sendRequestToBackend('scatterplot', {}, updateScatterPlotSvg);
}

let vecRenderScale: number;
function updateScatterPlotSvg(vectorProjections) {
  let scatter_svg = d3.select('#pca-container svg')
  const scatter_svg_width = 1000;
  const scatter_svg_height = 700;
  // Clear up SVG
  scatter_svg.selectAll("*").remove();

  // Add grid line
  var vecRenderBaseX = scatter_svg_width / 2;
  var vecRenderBaseY = scatter_svg_height / 2;
  scatter_svg.append("line")
    .classed("grid-line", true)
    .attr("x1", 0)
    .attr("x2", scatter_svg_width)
    .attr("y1", vecRenderBaseY)
    .attr("y2", vecRenderBaseY);
  scatter_svg.append("line")
    .classed("grid-line", true)
    .attr("x1", vecRenderBaseX)
    .attr("x2", vecRenderBaseX)
    .attr("y1", 0)
    .attr("y2", scatter_svg_height);
  scatter_svg.selectAll(".grid-line")
    .style("stroke", "grey")
    .style("stroke-dasharray", ("30,3"))
    .style("stroke-width", 2)
    .style("stroke-opacity", 0.75);

  var scatter_groups = scatter_svg
    .selectAll("g.scatterplot-vector")
    .data(vectorProjections)
    .enter()
    .append("g")
    .attr('class', d=>d['type'])
    .classed("scatterplot-vector", true);

  scatter_groups
    .append("circle")
    //.attr("x", function (d) {return d['proj0']*1000+500})
    //.attr("y", function (d) {return d['proj1']*1000+500})
    .attr("r", 10)
    .attr("stroke-width", "2")
    .attr("stroke", "grey");

  scatter_groups
    .append("text")
    .attr("dx", "6")
    .attr("dy", "-0.25em")
    .attr("alignment-baseline", "ideographic")
    .style("font-size", 28)
    .text(function(d) {return d['word']});

  // Calculate a proper scale
  vecRenderScale = 9999999999;  // global
  vectorProjections.forEach(function(v) {
    vecRenderScale = Math.min(vecRenderScale, 0.4 * scatter_svg_width / Math.abs(v['proj0']));
    vecRenderScale = Math.min(vecRenderScale, 0.45 * scatter_svg_height / Math.abs(v['proj1']));
  });

  scatter_groups
    .attr("transform", function(d) {
      var x = d['proj0'] * vecRenderScale + vecRenderBaseX;
      var y = d['proj1'] * vecRenderScale + vecRenderBaseY;
      return "translate(" + x + ',' + y +")";
    });
}

function addColorBar() {
  const hmap_svg_width = 25;  // view box, not physical
  const hmap_svg_height = 200;
  let hmap_svg = d3.selectAll('svg.colorbar');

  var tmpArray = [];
  for (var i = -1; i < 1; i += 0.03) {
    tmpArray.push(i);
  }

  var yScale = d3.scale.linear()
    .domain([0, tmpArray.length - 1])
    .range([hmap_svg_height-15, 15]);

  hmap_svg.selectAll("rect")
    .data(tmpArray)
    .enter()
    .append("rect")
    .attr("y", (d,i) => yScale(i))
    .attr("x", hmap_svg_width / 5)
    .attr("height", hmap_svg_height / tmpArray.length * 1.2)
    .attr("width", hmap_svg_width / 3)
    .style("fill", function(d) {return util.exciteValueToColor(d)});

  hmap_svg.append('text')
    .text('+1')
    .attr('x', 0)
    .attr('y', 0)
    .attr('alignment-baseline', 'hanging');

  hmap_svg.append('text')
    .text('-1')
    .attr('x', 0)
    .attr('y', hmap_svg_height)
    .attr('alignment-baseline', 'alphabetic');
}

window.addEventListener('hashchange', () => {
  if (ui_state_hidden.skip_reset_on_hashchange) {
    ui_state_hidden.skip_reset_on_hashchange = false;
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

reset();
