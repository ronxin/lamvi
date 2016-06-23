(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
function drawBarChart(svg, data, xlabel) {
    svg.selectAll('*').remove();
    if (data.length == 0)
        return;
    var margin = { top: 20, right: 20, bottom: 40, left: 40 }, width = 300 - margin.left - margin.right, height = 300 - margin.top - margin.bottom;
    var x = d3.scale.ordinal()
        .rangeRoundBands([0, width], .1)
        .domain(data.map(function (d, i) { return '' + i; }));
    var y = d3.scale.linear()
        .range([height, 0])
        .domain([0, d3.max(data)]);
    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");
    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");
    yAxis.ticks(10);
    svg = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .append('text')
        .text(xlabel)
        .attr('dx', width / 2)
        .attr('dy', "35")
        .attr('text-anchor', 'middle');
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);
    svg.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function (d, i) { return x('' + i); })
        .attr("width", width * 0.95 / data.length)
        .attr("y", function (d) { return y(d); })
        .attr("height", function (d) { return height - y(d); });
}
exports.__esModule = true;
exports["default"] = drawBarChart;

},{}],2:[function(require,module,exports){
"use strict";
exports.thumb_up = '<path d="M91,68.3c2-1.3,3.3-3.7,3.3-6.4c0-2.1-0.8-4-2-5.3c-0.4-0.5-0.3-1.3,0.1-1.6c1.6-1.2,2.6-3.2,2.6-5.6  c-0.1-3.6-2.7-6.4-5.8-6.4h0c-0.1,0-0.3,0-0.5,0h-31c-1.3-0.2-2.7-0.8-2.7-2.5c3.9-10.6,6.5-14,6.9-22.5c0.3-5.9-1.5-10.6-5.6-11.7  c-5.7-1.2-7.3,4.9-7.6,5.9C46,22.8,41.1,44.6,12.9,46.9c-2.9,0.2-5.3,2.3-5.5,5.2c-0.5,8-1.8,23.2-2.4,31.6  c-0.2,3.3,2.4,6.1,5.8,6.3c5.6,0.2,11.5,0.6,14.6,0.6c5.1,0,9.9,3.6,14.6,3.6c2.1,0,43.4,0,43.4,0c3.2,0,5.8-3,5.8-6.6  c0-1.6-0.5-3.1-1.4-4.2c-0.4-0.5-0.2-1.4,0.4-1.7c2.4-1,4.2-3.7,4.2-6.9c0-1.9-0.6-3.7-1.7-5C90.3,69.4,90.4,68.6,91,68.3z"></path>';
exports.waste_bascket = '<path d="M73.685,10.526H52.631V2.631c0-1.458-1.173-2.631-2.63-2.631H28.947c-1.458,0-2.631,1.173-2.631,2.631v7.895H5.263	C2.347,10.526,0,12.874,0,15.789c0,2.917,2.347,5.263,5.263,5.263h68.422c2.915,0,5.263-2.347,5.263-5.263 C78.947,12.874,76.6,10.526,73.685,10.526z M47.368,10.526H31.579V5.263h15.789V10.526z"></path><path d="M5.263,26.316c-2.916,0-5.66,2.387-5.181,5.263l10.444,63.158C11.002,97.613,12.874,100,15.79,100h47.369 c2.916,0,4.783-2.387,5.262-5.264l10.446-63.158c0.475-2.876-2.267-5.263-5.182-5.263H5.263z"></path>';

},{}],3:[function(require,module,exports){
"use strict";
var ui_state_1 = require("./ui_state");
var toy_model_entry_1 = require("./toy_model_entry");
var util = require("./util");
var icons = require("./icons");
var barchart_1 = require("./barchart");
var ui_state;
var ui_state_hidden;
var model_state;
var train_init_timeout;
function validateBackend() {
    if (ui_state.backend == "browser") {
        if (ui_state.model != 'word2vec') {
            showError('Unrecognized model type: "' + ui_state.model + '".');
        }
    }
    else {
        if (!util.isUrl(ui_state.backend)) {
            showError('backend must be either "browser" or a valid URL. Currently specified to "' +
                ui_state.backend + '".');
        }
    }
}
function sendRequestToBackend(type, request, callback) {
    if (ui_state.backend == "browser") {
        var response = toy_model_entry_1["default"](type, request);
        callback(response);
    }
    else {
        request['type'] = type;
        $.getJSON(ui_state.backend, request, function (response) {
            if (response.hasOwnProperty('error')) {
                showError(response.error);
            }
            else {
                callback(response);
            }
        });
    }
}
function reset() {
    $(".top-error-banner").empty().hide();
    ui_state_hidden = new ui_state_1.UIStateHidden();
    ui_state = ui_state_1.UIState.deserializeState();
    ui_state.serialize();
    validateBackend();
    updateUIStatus("Identifying model...");
    identify_model();
    $('#btn-update-restart').click(reset);
    $('#btn-start-pause').click(function () {
        if (!ui_state_hidden.is_to_pause_training
            && (ui_state_hidden.is_model_busy_training
                || model_state.status == 'AUTO_BREAK')) {
            $(this).html('Start');
            ui_state_hidden.is_to_pause_training = true;
            updateUIStatus('Pausing training...');
        }
        else if (!ui_state_hidden.is_model_busy_training
            && model_state
            && (model_state.status == 'WAIT_FOR_TRAIN'
                || model_state.status == 'USER_BREAK')) {
            $(this).html('Pause');
            updateUIStatus('Training...');
            train_init_timeout = setTimeout(function () { batch_train(-1, false); }, 150);
        }
    });
    $('#btn-next').click(function () {
        if (!ui_state_hidden.is_model_busy_training
            && model_state
            && (model_state.status == 'WAIT_FOR_TRAIN'
                || model_state.status == 'USER_BREAK')) {
            updateUIStatus('Training until hitting next watched item...');
            train_init_timeout = setTimeout(function () { batch_train(1, true); }, 150);
        }
    });
    $('#btn-reset').click(reset);
    $('#btn-add-to-watchlist').click(function () {
        var qo = $('#query-out-search').val();
        searchQueryOut(qo);
    });
    addColorBar();
}
function showError(message) {
    console.log(message);
    var new_error = '<p>' + message + '</p>';
    $('.top-error-banner').append(new_error);
    $('.top-error-banner').show();
}
function handleModelState() {
    ui_state_hidden.is_model_busy_training = false;
    if (!model_state) {
        throw new Error('Empty model_state!');
    }
    var model_config = model_state.config;
    if (model_state.status == 'AUTO_BREAK' && ui_state_hidden.is_to_pause_training) {
        model_state.status = 'USER_BREAK';
    }
    switch (model_state.status) {
        case 'WAIT_FOR_CORPUS':
            updateUIStatus('Loading corpus...');
            $.get(model_config.train_corpus_url, function (corpus) {
                if (corpus) {
                    var corpus_preview = corpus.substr(0, 1000);
                    $('#train-text').text(corpus_preview);
                    $("#train-corpus-link").attr('href', model_config.train_corpus_url).show();
                    sendRequestToBackend('set_corpus', { 'corpus': corpus }, handleModelState);
                }
                else {
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
                ui_state_hidden.has_setup_query_column = true;
                setupQueryColumn(model_config);
                updateQueryOutResult();
            }
            updateQueryOutSVG();
            updateHiddenIn();
            updateScatterPlot();
            break;
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
    var model_config = model_state.config;
    var data_overview_fields = model_config.data_overview_fields;
    $('#train-data-overview').empty();
    for (var _i = 0, data_overview_fields_1 = data_overview_fields; _i < data_overview_fields_1.length; _i++) {
        var field = data_overview_fields_1[_i];
        if (model_state.hasOwnProperty(field)) {
            var val = model_state[field];
            $('#train-data-overview').append('<div><b>' + field + ':</b>&nbsp;' + val + '</div>');
        }
    }
}
function display_training_status_overview() {
    var model_config = model_state.config;
    var train_overview_fields = model_config.train_overview_fields;
    $('#train-status-overview').empty();
    for (var _i = 0, train_overview_fields_1 = train_overview_fields; _i < train_overview_fields_1.length; _i++) {
        var field = train_overview_fields_1[_i];
        if (model_state.hasOwnProperty(field)) {
            var val = model_state[field];
            $('#train-status-overview').append('<div><b>' + field + ':</b>&nbsp;' + val + '</div>');
        }
    }
}
function identify_model() {
    var config_json = $('#config-text').val();
    var config_obj = null;
    try {
        config_obj = JSON.parse(config_json);
    }
    catch (e) {
        showError("The model configuration JSON is not valid.");
        return;
    }
    var request = { model_type: ui_state.model, model_config: config_obj };
    sendRequestToBackend('identify', request, function (response) {
        model_state = response;
        handleModelState();
    });
}
function init_model() {
    sendRequestToBackend('init_model', {}, function (response) {
        model_state = response;
        handleModelState();
    });
}
function updateUIStatus(status) {
    $("#training-status").html(status);
}
function updateQueryIn(event, ui) {
    if (ui.duringInitialization)
        return;
    ui_state.query_in = $('#query-in-tags').tagit('assignedTags');
    sendRequestToBackend('validate_query_in', { query_in: ui_state.query_in }, function (response) {
        var is_valid = response['is_valid'];
        ui_state_hidden.is_queryin_valid = is_valid;
        if (!is_valid) {
            var message = response['message'];
            $('#query-in-error-message').html(message).show();
        }
        else {
            $('#query-in-error-message').hide();
            ui_state_hidden.skip_reset_on_hashchange = true;
            ui_state.serialize();
            updateQueryOutResult();
        }
    });
}
function searchQueryOut(query) {
    $('#query-out-error-message').hide();
    if (query.length == 0)
        return;
    sendRequestToBackend('validate_query_out', { query_out: query }, function (response) {
        var is_valid = response['is_valid'];
        if (!is_valid) {
            var message = response['message'];
            $('#query-out-error-message').html(message).show();
        }
        else {
            var already_shown = false;
            for (var _i = 0, _a = model_state.query_out_records; _i < _a.length; _i++) {
                var record = _a[_i];
                if (record.query != query)
                    continue;
                if (record.status == 'IGNORED' || record.status == 'NORMAL') {
                    record.status = 'WATCHED';
                    already_shown = true;
                }
            }
            if (already_shown) {
                updateUIStateQueryOut();
                updateQueryOutSVG();
            }
            else {
                model_state.query_out_records.push({
                    query: query, status: 'WATCHED',
                    rank: -1, rank_history: [] });
                updateUIStateQueryOut();
                updateQueryOutResult();
            }
        }
    });
}
function updateUIStateQueryOut() {
    var query_out = [];
    for (var _i = 0, _a = model_state.query_out_records; _i < _a.length; _i++) {
        var record = _a[_i];
        var prefix = record.status[0];
        if (prefix == 'N')
            continue;
        var query = record.query;
        query_out.push(prefix + "_" + query);
    }
    ui_state.query_out = query_out;
    ui_state_hidden.skip_reset_on_hashchange = true;
    ui_state.serialize();
}
function updateQueryOutResult() {
    sendRequestToBackend('update_query_out_result', {
        query_in: ui_state.query_in,
        query_out: ui_state.query_out,
        status: model_state.status
    }, function (response) {
        model_state = response;
        handleModelState();
    });
}
var query_out_svg_width = 100;
var query_out_svg_height = 100;
function setupQueryColumn(model_config) {
    if (ui_state.query_in.length == 0) {
        ui_state.query_in = model_config.default_query_in;
    }
    if (ui_state.query_out.length == 0) {
        ui_state.query_out = model_config.default_query_out;
    }
    ui_state_hidden.skip_reset_on_hashchange = true;
    ui_state.serialize();
    $('#query-in-container')
        .empty()
        .append('<ul id="query-in-tags"></ul>');
    for (var _i = 0, _a = ui_state.query_in; _i < _a.length; _i++) {
        var query = _a[_i];
        $("#query-in-tags").append('<li>' + query + '</li>');
    }
    $('#query-in-tags').tagit({
        autocomplete: {
            source: function (request, response) {
                sendRequestToBackend('autocomplete', request, function (data) {
                    if (data && data.hasOwnProperty('items')) {
                        response(data['items']);
                    }
                    else {
                        response([]);
                    }
                });
            },
            delay: 0,
            minLength: 1
        },
        removeConfirmation: true,
        allowDuplicates: true,
        placeholderText: 'Type here',
        afterTagAdded: updateQueryIn,
        afterTagRemoved: updateQueryIn
    });
    d3.select('#query-out-container > *').remove();
    var svg = d3.select('#query-out-container')
        .append('div')
        .classed('query-out', true)
        .append('svg')
        .attr('width', '100%')
        .attr('viewBox', '0 0 ' + query_out_svg_width + ' ' + query_out_svg_height)
        .attr('preserveAspectRatio', "xMinYMin");
    ui_state_hidden.qo_svg = svg;
    svg.append('rect')
        .attr('x', 1)
        .attr('y', 0)
        .attr('width', 3)
        .attr('height', query_out_svg_height)
        .attr('fill', 'lightgrey');
}
function updateQueryOutSVG() {
    var default_item_height = 6;
    var default_item_pad = 0.8;
    var default_gap = 5;
    var word_box_width = 35;
    var linechart_width = 30;
    if (!model_state.query_out_records) {
        throw new Error("model_state.query_out_records is not populated.");
    }
    var query_out_records = model_state.query_out_records;
    query_out_records = query_out_records.filter(function (d) { return d.status != 'IGNORED'; });
    if (model_state.num_possible_outputs <= 0) {
        throw new Error("model_state.num_possible_outputs must be positive");
    }
    if (typeof model_state.instances == undefined) {
        throw new Error('model_state.iterations must be set.');
    }
    query_out_records.sort(function (a, b) {
        return a.rank - b.rank;
    });
    var y = 0;
    var last_rank = -1;
    for (var _i = 0, query_out_records_1 = query_out_records; _i < query_out_records_1.length; _i++) {
        var q = query_out_records_1[_i];
        q['y'] = (q.rank == last_rank + 1) ? y : y + default_gap;
        y = q['y'] + default_item_height + default_item_pad;
        last_rank = q.rank;
        q['y_idxbar'] = query_out_svg_height * q.rank / model_state.num_possible_outputs;
    }
    var item_height = default_item_height;
    if (y > query_out_svg_height) {
        var shrink_factor = query_out_svg_height / y;
        item_height *= shrink_factor;
        for (var _a = 0, query_out_records_2 = query_out_records; _a < query_out_records_2.length; _a++) {
            var q = query_out_records_2[_a];
            q['y'] *= shrink_factor;
        }
    }
    var linechart_maxY = 0;
    for (var _b = 0, query_out_records_3 = query_out_records; _b < query_out_records_3.length; _b++) {
        var q = query_out_records_3[_b];
        var max = Math.max.apply(null, $.map(q.rank_history, function (x) { return x.rank; }));
        linechart_maxY = Math.max(linechart_maxY, max);
    }
    var linechart_xScale = d3.scale.linear()
        .domain([0, model_state.instances])
        .range([linechart_width * 0.025, linechart_width * 0.975]);
    var linechart_yScale = d3.scale.linear()
        .domain([0, linechart_maxY])
        .range([item_height * 0.025, item_height * 0.975]);
    var svg = ui_state_hidden.qo_svg;
    svg.selectAll('g').remove();
    var record_objs = svg.selectAll('g')
        .data(query_out_records, function (d) { return d.query; })
        .enter()
        .append('g')
        .attr('class', function (d) { return ("qo-item " + d.status); });
    record_objs.append('rect')
        .attr('x', 0)
        .attr('y', function (d) { return d['y_idxbar']; })
        .attr('width', 5)
        .attr('height', 1)
        .classed('qo-idxbar-marker', true);
    record_objs.append('path')
        .attr('d', function (d) {
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
    var rank_boxes = record_objs.append('g')
        .attr('transform', function (d) {
        return 'translate(10,' + d['y'] + ')';
    });
    rank_boxes.append('rect')
        .attr('width', '10')
        .attr('height', item_height)
        .classed('qo-box', true)
        .classed('qo-rank-box', true);
    rank_boxes.append('text')
        .text(function (d) { return '#' + (d.rank + 1); })
        .style('font-size', function (d) {
        return Math.min(4, 10 / this.getComputedTextLength() * 10) + 'px';
    })
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'central')
        .attr('dx', '5px')
        .attr('dy', (item_height / 2) + 'px');
    var word_boxes = record_objs.append('g')
        .attr('transform', function (d) {
        return 'translate(20,' + d['y'] + ')';
    });
    word_boxes.append('rect')
        .attr('width', word_box_width)
        .attr('height', item_height)
        .classed('qo-box', true)
        .classed('qo-word-box', true);
    word_boxes.append('text')
        .text(function (d) { return d.query; })
        .style('font-size', function (d) {
        return Math.min(3, 55 / this.getComputedTextLength() * 5) + 'px';
    })
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'central')
        .attr('dx', word_box_width / 2)
        .attr('dy', (item_height / 2) + 'px');
    var linecharts = record_objs.append('g')
        .attr('transform', function (d) { return ("translate(55, " + d['y'] + ")"); });
    linecharts.append('rect')
        .attr('width', linechart_width)
        .attr('height', item_height)
        .classed('qo-box', true)
        .classed('qo-linechart-box', true);
    linecharts.append('path')
        .classed('qo-linechart', true)
        .datum(function (d) { return d.rank_history; })
        .attr('d', d3.svg.line()
        .x(function (d) { return linechart_xScale(d.iteration); })
        .y(function (d) { return linechart_yScale(d.rank); }));
    var control_icon_data = [
        { 'name': 'thumb_up', 'svg': icons.thumb_up,
            'rotate': 0, 'translate': '1,1',
            'title': 'label/unlabel as good output' },
        { 'name': 'thumb_down', 'svg': icons.thumb_up,
            'rotate': 180, 'translate': '-8.75,-5',
            'title': 'label/unlabel as bad output' },
        { 'name': 'waste_bascket', 'svg': icons.waste_bascket,
            'rotate': 0, 'translate': '10,1',
            'title': 'ignore this output' },
    ];
    var control_icons = record_objs.append('g')
        .attr('transform', function (d) { return ("translate(85, " + d['y'] + ")"); })
        .selectAll('g')
        .data(control_icon_data)
        .enter()
        .append('g')
        .html(function (d) { return d.svg; })
        .attr('class', function (d) { return ("qo-control-icon " + d.name); })
        .attr('transform', function (d) { return ("rotate(" + d.rotate + ") translate(" + d.translate + ") scale(0.035)"); })
        .attr('title', function (d) { return d.title; })
        .on('click', function (d) {
        var record = d3.select(this.parentNode.parentNode).datum();
        if ((record.status == 'GOOD' && d.name == 'thumb_up')
            || (record.status == 'BAD' && d.name == 'thumb_down')) {
            record.status = 'NORMAL';
        }
        else if (d.name == 'thumb_up') {
            record.status = 'GOOD';
        }
        else if (d.name == 'thumb_down') {
            record.status = 'BAD';
        }
        else if (d.name == 'waste_bascket') {
            record.status = 'IGNORED';
        }
        updateUIStateQueryOut();
        updateQueryOutSVG();
    });
    var selection = $(".qo-control-icon");
    selection.tooltip({
        'container': 'body',
        'placement': 'bottom',
        'delay': 300
    });
    $('.tooltip').remove();
    record_objs.on('click', function (d) {
        sendRequestToBackend('pair_profile', { query: d.query }, display_pair_profile);
    });
}
function batch_train(iterations, watched) {
    ui_state_hidden.is_model_busy_training = true;
    ui_state_hidden.is_to_pause_training = false;
    sendRequestToBackend('train', { iterations: iterations, watched: watched }, handleModelState);
}
function resume_training() {
    if (ui_state_hidden.is_to_pause_training) {
        updateUIStatus('Training paused.');
        model_state.status = 'USER_BREAK';
    }
    else {
        ui_state_hidden.is_model_busy_training = true;
        sendRequestToBackend('train-continue', {}, handleModelState);
    }
}
function updateHiddenIn() {
    var svg = d3.select('#hidden-in-container svg.heatmap');
    var w2v_model_state = model_state;
    var tbody = d3.select('#hidden-in-container tbody');
    var default_records = w2v_model_state.query_out_records;
    var per_dim_records = w2v_model_state.per_dim_neighbors;
    d3.select('#hidden-in-container .query')
        .html('&nbsp; - "' + ui_state.query_in.join('" "') + '"');
    updateHeatMap(svg, w2v_model_state.qi_vec, default_records, per_dim_records, tbody, false, null);
    updateInspectorTBody(tbody, default_records, false, null);
}
function updateHeatMap(svg, vector, default_records, per_dim_records, tbody, is_pair, query_out) {
    var hmap_svg_width = 100;
    var hmap_svg_height = 100;
    var ncol = Math.floor(Math.sqrt(vector.length));
    var nrow = ncol * ncol == vector.length ? ncol : ncol + 1;
    var cellHeight = hmap_svg_height / nrow;
    var cellWidth = hmap_svg_width / ncol;
    var cellFillHeight = 0.95 * cellHeight;
    var cellFillWidth = 0.95 * cellWidth;
    svg.selectAll('*').remove();
    svg.selectAll('g.cell')
        .data(vector)
        .enter()
        .append('g')
        .classed('cell', true)
        .append('rect')
        .attr('x', function (d, i) { return cellWidth * (i % ncol); })
        .attr('y', function (d, i) { return cellHeight * (Math.floor(i / ncol)); })
        .attr('width', cellFillWidth)
        .attr('height', cellFillHeight)
        .style('fill', function (d) { return util.exciteValueToColor(d); })
        .on('mouseover', function (d, i) { updateInspectorTBody(tbody, per_dim_records[i], is_pair, query_out); })
        .on('mouseout', function () { updateInspectorTBody(tbody, default_records, is_pair, query_out); });
}
function updateInspectorTBody(tbody, ranked_items, is_pair, query_out) {
    tbody.selectAll('*').remove();
    var rows = tbody.selectAll('tr')
        .data(ranked_items.slice(0, 8))
        .enter()
        .append('tr');
    rows.append('td').html(function (d) { return d.query; });
    if (is_pair) {
        rows.append('td').html(function (d) { return ('' + d.score1).slice(0, 5); });
        rows.append('td').html(function (d) { return ('' + d.score2).slice(0, 5); });
        if (!query_out) {
            throw new Error('when is_pair is true, query_out must be assigned.');
        }
        var query_in_1 = ui_state.query_in[0];
        rows.on('click', function (d) {
            sendRequestToBackend('influential_train_instances', { w1: query_in_1, w2: d.query }, function (response) {
                $('#concordance-container').show();
                d3.select('#concordance-container .query').html("&nbsp; - \"" + query_in_1 + "\"\" vs \"" + d.query + "\"");
                display_concordance(d3.select('#concordance-container tbody'), response);
            });
            sendRequestToBackend('influential_train_instances', { w1: query_out, w2: d.query }, function (response) {
                $('#concordance-container-2').show();
                d3.select('#concordance-container-2 .query').html("&nbsp; - \"" + query_out + "\"\" vs \"" + d.query + "\"");
                display_concordance(d3.select('#concordance-container-2 tbody'), response);
            });
        });
    }
    else {
        rows.append('td').html(function (d) { return ('' + d.score).slice(0, 5); });
    }
}
function display_pair_profile(response) {
    $('#hidden-out-container').show();
    $('#hidden-product-container').show();
    var svg_out = d3.select('#hidden-out-container svg.heatmap');
    var tbody_out = d3.select('#hidden-out-container tbody');
    var svg_prod = d3.select('#hidden-product-container svg.heatmap');
    var tbody_prod = d3.select('#hidden-product-container tbody');
    var w2v_model_state = model_state;
    var pair_profile = response;
    var default_records_out = pair_profile.qo_neighbors;
    var per_dim_records_out = pair_profile.qo_per_dim_neighbors;
    d3.select('#hidden-out-container .query')
        .html('&nbsp; - "' + pair_profile.qo + '"');
    updateHeatMap(svg_out, pair_profile.qo_vec, default_records_out, per_dim_records_out, tbody_out, false, null);
    updateInspectorTBody(tbody_out, default_records_out, false, null);
    var default_records_prod = pair_profile.elemsum_neighbors;
    var per_dim_records_prod = pair_profile.elemsum_per_dim_neighbors;
    updateHeatMap(svg_prod, pair_profile.elemprod, default_records_prod, per_dim_records_prod, tbody_prod, true, pair_profile.qo);
    updateInspectorTBody(tbody_prod, default_records_prod, true, pair_profile.qo);
}
function display_concordance(tbody, data) {
    var summaries = data;
    tbody.selectAll('*').remove();
    var rows = tbody.selectAll('tr')
        .data(summaries.slice(0, 8))
        .enter()
        .append('tr');
    rows.append('td').html(function (d) { return ('' + d.total_movement).slice(0, 5); });
    rows.append('td')
        .selectAll('span')
        .data(function (d) {
        var words = d.sentence.split(' ');
        return words.map(function (w, i) {
            var cls;
            if (d.pos == i)
                cls = 'pos1';
            else if (d.pos2 == i)
                cls = 'pos2';
            else
                cls = 'normal';
            if (i > 0)
                w = ' ' + w;
            return { w: w, cls: cls };
        }).filter(function (w, i) {
            var window = model_state.config['window'];
            if (i < d.pos - window - 2 || i > d.pos + window + 2)
                return false;
            return true;
        });
    })
        .enter()
        .append('span')
        .attr('class', function (d) { return d['cls']; })
        .text(function (d) { return d['w']; });
    rows.on('click', function (d) {
        $('#instance-inspector-container').show();
        var svg1 = d3.select('#instance-inspector-container svg.left');
        var svg2 = d3.select('#instance-inspector-container svg.right');
        barchart_1["default"](svg1, d.learning_rates, 'Epochs');
        barchart_1["default"](svg2, d.movements, 'Epochs');
    });
}
function updateScatterPlot() {
    sendRequestToBackend('scatterplot', {}, updateScatterPlotSvg);
}
var vecRenderScale;
function updateScatterPlotSvg(vectorProjections) {
    var scatter_svg = d3.select('#pca-container svg');
    var scatter_svg_width = 1000;
    var scatter_svg_height = 700;
    scatter_svg.selectAll("*").remove();
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
        .attr('class', function (d) { return d['type']; })
        .classed("scatterplot-vector", true);
    scatter_groups
        .append("circle")
        .attr("r", 10)
        .attr("stroke-width", "2")
        .attr("stroke", "grey");
    scatter_groups
        .append("text")
        .attr("dx", "6")
        .attr("dy", "-0.25em")
        .attr("alignment-baseline", "ideographic")
        .style("font-size", 28)
        .text(function (d) { return d['word']; });
    vecRenderScale = 9999999999;
    vectorProjections.forEach(function (v) {
        vecRenderScale = Math.min(vecRenderScale, 0.4 * scatter_svg_width / Math.abs(v['proj0']));
        vecRenderScale = Math.min(vecRenderScale, 0.45 * scatter_svg_height / Math.abs(v['proj1']));
    });
    scatter_groups
        .attr("transform", function (d) {
        var x = d['proj0'] * vecRenderScale + vecRenderBaseX;
        var y = d['proj1'] * vecRenderScale + vecRenderBaseY;
        return "translate(" + x + ',' + y + ")";
    });
}
function addColorBar() {
    var hmap_svg_width = 25;
    var hmap_svg_height = 200;
    var hmap_svg = d3.selectAll('svg.colorbar');
    var tmpArray = [];
    for (var i = -1; i < 1; i += 0.03) {
        tmpArray.push(i);
    }
    var yScale = d3.scale.linear()
        .domain([0, tmpArray.length - 1])
        .range([hmap_svg_height - 15, 15]);
    hmap_svg.selectAll("rect")
        .data(tmpArray)
        .enter()
        .append("rect")
        .attr("y", function (d, i) { return yScale(i); })
        .attr("x", hmap_svg_width / 5)
        .attr("height", hmap_svg_height / tmpArray.length * 1.2)
        .attr("width", hmap_svg_width / 3)
        .style("fill", function (d) { return util.exciteValueToColor(d); });
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
window.addEventListener('hashchange', function () {
    if (ui_state_hidden.skip_reset_on_hashchange) {
        ui_state_hidden.skip_reset_on_hashchange = false;
    }
    else {
        reset();
    }
});
$('#query-out-search').autocomplete({
    source: function (request, response) {
        sendRequestToBackend('autocomplete', request, function (data) {
            if (data && data.hasOwnProperty('items')) {
                response(data['items']);
            }
            else {
                response([]);
            }
        });
    },
    delay: 0,
    minLength: 1
});
reset();

},{"./barchart":1,"./icons":2,"./toy_model_entry":6,"./ui_state":8,"./util":9}],4:[function(require,module,exports){
"use strict";
var ModelConfig = (function () {
    function ModelConfig() {
    }
    return ModelConfig;
}());
exports.ModelConfig = ModelConfig;
var ModelState = (function () {
    function ModelState() {
    }
    return ModelState;
}());
exports.ModelState = ModelState;

},{}],5:[function(require,module,exports){
"use strict";
function get_random_float() {
    return Math.random();
}
exports.get_random_float = get_random_float;
function seed_random(seed) {
    Math.seedrandom('' + seed);
}
exports.seed_random = seed_random;
function get_random_init_weight(hidden_size) {
    return (get_random_float() - 0.5) / hidden_size;
}
exports.get_random_init_weight = get_random_init_weight;

},{}],6:[function(require,module,exports){
"use strict";
var toy_model_w2v_1 = require("./toy_model_w2v");
var model = null;
function handleRequest(request_type, request) {
    if (request_type == 'identify') {
        model = null;
        var model_type = request['model_type'];
        var model_config = request['model_config'];
        if (model_type == 'word2vec') {
            model = new toy_model_w2v_1.Word2vec(model_config);
        }
        else {
            throw new Error('Unrecognized model type: "' + model_type + '"');
        }
        return model.get_state();
    }
    else {
        return model.handle_request(request_type, request);
    }
}
exports.__esModule = true;
exports["default"] = handleRequest;

},{"./toy_model_w2v":7}],7:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var model_state_1 = require("./model_state");
var util = require("./util");
var random_1 = require("./random");
var POWER = 0.75;
var CUM_TABLE_DOMAIN = 2147483647;
var MAX_EXP = 6;
var EXP_TABLE_SIZE = 1000;
var RANK_TO_SHOW = 10;
var RANK_TO_CONSIDER_FOR_PERDIM = 100;
var Word2vecConfig = (function (_super) {
    __extends(Word2vecConfig, _super);
    function Word2vecConfig() {
        _super.apply(this, arguments);
        this.hidden_size = 16;
        this.alpha = 0.1;
        this.window = 3;
        this.min_count = 2;
        this.seed = 1;
        this.min_alpha = 0.01;
        this.sg = true;
        this.negative = 5;
        this.cbow_mean = true;
        this.iter = 20;
        this.data_overview_fields = ['vocab_size', 'num_sentences', 'corpus_size'];
        this.train_overview_fields = ['instances', 'epochs', 'learning_rate'];
        this.default_query_in = ['darcy'];
        this.default_query_out = ['G_bennet', 'B_circumstances'];
        this.train_corpus_url = "/pg1342-tokenized.txt";
        this.report_interval_microseconds = 250;
    }
    return Word2vecConfig;
}(model_state_1.ModelConfig));
;
var Word2vecState = (function (_super) {
    __extends(Word2vecState, _super);
    function Word2vecState() {
        _super.apply(this, arguments);
        this.full_model_name = 'Word2Vec';
    }
    return Word2vecState;
}(model_state_1.ModelState));
exports.Word2vecState = Word2vecState;
var VocabItem = (function () {
    function VocabItem(idx, count) {
        if (count === void 0) { count = 0; }
        this.idx = idx;
        this.count = count;
    }
    return VocabItem;
}());
var Word2vec = (function () {
    function Word2vec(model_config) {
        this.query_in = [];
        this.queries_watched = {};
        this.queries_ignored = {};
        this.qo_map = {};
        this.count_instances_watched = 0;
        this.breakpoint_instances_watched = -1;
        this.breakpoint_iterations = -1;
        this.breakpoint_time = -1;
        this.train_instance_log_map = {};
        this.state = new Word2vecState();
        this.state.config = new Word2vecConfig();
        this.update_config(model_config);
        this.set_status('WAIT_FOR_CORPUS');
    }
    Word2vec.prototype.update_config = function (config) {
        var model_config = this.state.config;
        for (var key in config) {
            if (model_config.hasOwnProperty(key)) {
                model_config[key] = config[key];
            }
        }
    };
    Word2vec.prototype.get_state = function () {
        return this.state;
    };
    Word2vec.prototype.handle_request = function (request_type, request) {
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
                var term = request['term'] || '';
                return this.autocomplete(term);
            case 'validate_query_in':
                var query_in = request['query_in'] || [];
                return this.validate_query_in(query_in);
            case 'validate_query_out':
                var query_out = request['query_out'];
                return this.validate_query_out(query_out);
            case 'update_query_out_result':
                this.update_qi_and_qo(request);
                this.compute_query_result();
                this.update_PCA();
                return this.get_state();
            case 'train':
                var requested_iterations = request['iterations'] || -1;
                var watched = request['watched'];
                this.breakpoint_iterations = -1;
                this.breakpoint_instances_watched = -1;
                this.breakpoint_time = Date.now() + this.state.config.report_interval_microseconds;
                if (requested_iterations > 0) {
                    if (watched)
                        this.breakpoint_instances_watched = this.count_instances_watched + requested_iterations;
                    else
                        this.breakpoint_iterations = this.state.instances + requested_iterations;
                }
                this.train_until_breakpoint();
                return this.get_state();
            case 'train-continue':
                this.breakpoint_time = Date.now() + this.state.config.report_interval_microseconds;
                this.train_until_breakpoint();
                return this.get_state();
            case 'pair_profile':
                var query = request['query'];
                return this.get_pair_profile(query);
            case 'influential_train_instances':
                var w1 = request['w1'];
                var w2 = request['w2'];
                return this.get_influential_train_instances(w1, w2);
            case 'reset_pca':
                this.update_PCA();
                return {};
            case 'scatterplot':
                return this.get_2D_vecs();
            default:
                throw new Error('Unrecognized request type: "' + request_type + '"');
        }
    };
    Word2vec.prototype.set_status = function (status) {
        this.state.status = status;
    };
    Word2vec.prototype.build_vocab = function () {
        var _this = this;
        this.sentences = this.corpus.split('\n');
        this.vocab = {};
        this.index2word = [];
        for (var _i = 0, _a = this.sentences; _i < _a.length; _i++) {
            var sentence = _a[_i];
            var words = sentence.split(' ');
            for (var _b = 0, words_1 = words; _b < words_1.length; _b++) {
                var word = words_1[_b];
                if (!(word in this.vocab)) {
                    this.vocab[word] = new VocabItem(this.index2word.length);
                    this.index2word.push(word);
                }
                this.vocab[word].count += 1;
            }
        }
        if (this.state.config.min_count > 1) {
            var min_count = this.state.config.min_count;
            var vocab_tmp = {};
            var index2word_tmp = [];
            for (var word in this.vocab) {
                if (this.vocab[word].count >= min_count) {
                    vocab_tmp[word] = this.vocab[word];
                    vocab_tmp[word].idx = index2word_tmp.length;
                    index2word_tmp.push(word);
                }
            }
            this.vocab = vocab_tmp;
            this.index2word = index2word_tmp;
        }
        this.index2word.sort(function (a, b) {
            return _this.vocab[b].count - _this.vocab[a].count;
        });
        this.index2word.splice(0, 0, '\0');
        this.vocab[this.index2word[0]] = new VocabItem(0, 1);
        for (var i = 1; i < this.index2word.length; i++) {
            this.vocab[this.index2word[i]].idx = i;
        }
        var total_words = 0;
        for (var word in this.vocab) {
            total_words += this.vocab[word].count;
        }
        var train_words_pow = 0;
        var vocab_size = this.index2word.length;
        this.cum_table = [];
        for (var i = 0; i < vocab_size; i++)
            this.cum_table.push(0);
        for (var i = 0; i < vocab_size; i++) {
            train_words_pow += Math.pow(this.vocab[this.index2word[i]].count, POWER);
        }
        var cumultative = 0.0;
        for (var i = 0; i < vocab_size; i++) {
            cumultative += Math.pow(this.vocab[this.index2word[i]].count, POWER) / train_words_pow;
            this.cum_table[i] = Math.round(cumultative * CUM_TABLE_DOMAIN);
        }
        this.state.num_sentences = this.sentences.length;
        this.state.vocab_size = this.index2word.length;
        this.state.corpus_size = total_words;
    };
    Word2vec.prototype.init_model = function () {
        var vocab_size = this.state.vocab_size;
        var hidden_size = this.state.config.hidden_size;
        var syn0 = [];
        var syn1 = [];
        for (var i = 0; i < vocab_size; i++) {
            var v0 = [];
            var v1 = [];
            for (var j = 0; j < hidden_size; j++) {
                v0.push(random_1.get_random_init_weight(hidden_size));
                v1.push(random_1.get_random_init_weight(hidden_size));
            }
            syn0.push(v0);
            syn1.push(v1);
        }
        this.syn0 = syn0;
        this.syn1 = syn1;
        this.scores = [];
        this.l2_sqrts = [];
        this.qi_vec = [];
        for (var i = 0; i < vocab_size; i++)
            this.scores.push(0);
        for (var i = 0; i < vocab_size; i++)
            this.l2_sqrts.push(0);
        for (var j = 0; j < hidden_size; j++)
            this.qi_vec.push(0);
        this.state.instances = 0;
        this.state.num_possible_outputs = vocab_size;
        this.state.epochs = 0;
        this.state.sentences = 0;
        this.exp_table = [];
        for (var i = 0; i < EXP_TABLE_SIZE; i++) {
            var v = Math.exp((i / EXP_TABLE_SIZE * 2 - 1) * MAX_EXP);
            this.exp_table.push(v / (v + 1));
        }
        this.exp_table.push(0);
    };
    Word2vec.prototype.autocomplete = function (term) {
        var out = [];
        if (this.index2word && term) {
            var prefix_1 = null;
            var search_term = term;
            if (util.startsWith(term, '-')) {
                prefix_1 = '-';
                search_term = term.slice(1);
            }
            out = $.ui.autocomplete.filter(this.index2word, search_term);
            var out_s = [];
            var out_ns = [];
            for (var _i = 0, out_1 = out; _i < out_1.length; _i++) {
                var w = out_1[_i];
                if (util.startsWith(w, search_term)) {
                    out_s.push(w);
                }
                else {
                    out_ns.push(w);
                }
            }
            out = out_s.concat(out_ns);
            if (prefix_1) {
                out = $.map(out, function (s) { return prefix_1 + s; });
            }
            out = out.slice(0, 20);
        }
        return { 'items': out };
    };
    Word2vec.prototype.validate_query_in = function (query_in) {
        if (!this.vocab) {
            throw new Error('Must first build vocab before validating queries.');
        }
        var is_valid = true;
        var message = '';
        for (var _i = 0, query_in_1 = query_in; _i < query_in_1.length; _i++) {
            var query = query_in_1[_i];
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
        return { is_valid: is_valid, message: message };
    };
    Word2vec.prototype.validate_query_out = function (query) {
        if (!this.vocab) {
            throw new Error('Must first build vocab before validating queries.');
        }
        var is_valid = true;
        var message = '';
        if (!(query in this.vocab)) {
            is_valid = false;
            message = "\"" + query + "\" is not in vocabulary.";
        }
        return { is_valid: is_valid, message: message };
    };
    Word2vec.prototype.update_qi_and_qo = function (request) {
        this.state.status = request['status'];
        this.query_in = request['query_in'];
        if (this.query_in.length == 0)
            this.query_in = ['\0'];
        this.qi_key = this.query_in.join('&');
        if (this.qi_key.length > 0 && !(this.qi_key in this.qo_map)) {
            this.qo_map[this.qi_key] = {};
        }
        var qo_lookup = this.qo_map[this.qi_key];
        var query_out = request['query_out'] || [];
        for (var _i = 0, query_out_1 = query_out; _i < query_out_1.length; _i++) {
            var q = query_out_1[_i];
            var prefix = q[0];
            var q_str = q.slice(2);
            if ($.inArray(prefix, ['G', 'B', 'W']) > -1) {
                this.queries_watched[q_str] = true;
                if (!(q_str in qo_lookup)) {
                    qo_lookup[q_str] = { query: q_str, status: '' };
                }
                qo_lookup[q_str].status = { 'G': 'GOOD', 'B': 'BAD', 'W': 'WATCHED' }[prefix];
                if (q_str in this.queries_ignored) {
                    delete this.queries_ignored[q_str];
                }
            }
            else if (prefix == 'I' && (q_str in this.queries_watched)) {
                delete this.queries_watched[q_str];
                this.queries_ignored[q_str] = true;
            }
        }
    };
    Word2vec.prototype.compute_query_result = function () {
        var _this = this;
        if (this.query_in.length == 0) {
            this.state.query_out_records = [];
            return;
        }
        var hidden_size = this.state.config.hidden_size;
        var vocab = this.vocab;
        var vocab_size = this.state.vocab_size;
        var syn0 = this.syn0;
        var query_in = this.query_in;
        var qi_vec = this.qi_vec;
        var scores = this.scores;
        var iterations = this.state.instances;
        var qo_lookup = this.qo_map[this.qi_key];
        var queries_watched = this.queries_watched;
        this.q_idx_set = {};
        var q_idx_set = this.q_idx_set;
        var l2_sqrts = this.l2_sqrts;
        for (var j = 0; j < hidden_size; j++)
            qi_vec[j] = 0;
        for (var _i = 0, query_in_2 = query_in; _i < query_in_2.length; _i++) {
            var q = query_in_2[_i];
            var word = q;
            var minus = false;
            if (util.startsWith(q, '-')) {
                minus = true;
                word = q.slice(1);
            }
            var qidx = vocab[word].idx;
            q_idx_set[qidx] = true;
            for (var j = 0; j < hidden_size; j++) {
                if (minus)
                    qi_vec[j] -= syn0[qidx][j];
                else
                    qi_vec[j] += syn0[qidx][j];
            }
        }
        {
            var l2 = 0;
            for (var j = 0; j < hidden_size; j++)
                l2 += qi_vec[j] * qi_vec[j];
            var l2_sqrt = Math.sqrt(l2);
            for (var j = 0; j < hidden_size; j++)
                qi_vec[j] /= l2_sqrt;
        }
        for (var i = 0; i < vocab_size; i++) {
            if (i in q_idx_set) {
                scores[i] = 0;
                continue;
            }
            var prod = 0;
            var l2 = 0;
            for (var j = 0; j < hidden_size; j++) {
                prod += qi_vec[j] * syn0[i][j];
                l2 += syn0[i][j] * syn0[i][j];
            }
            var l2_sqrt = Math.sqrt(l2);
            l2_sqrts[i] = l2_sqrt;
            if (l2 == 0)
                scores[i] = 0;
            else
                scores[i] = prod / l2_sqrt;
        }
        var qi_scores_unsorted = $.map(scores, function (score, i) { return { idx: i, score: score }; });
        var qi_scores = qi_scores_unsorted.slice().sort(function (a, b) { return b.score - a.score; });
        $.map(qi_scores, function (item_score, i) { item_score.rank = i; });
        var rank_lookup = {};
        for (var _a = 0, qi_scores_1 = qi_scores; _a < qi_scores_1.length; _a++) {
            var item_score = qi_scores_1[_a];
            var word = this.index2word[item_score.idx];
            if (word in queries_watched) {
                rank_lookup[word] = item_score.rank;
            }
        }
        this.qi_scores_unsorted = qi_scores_unsorted;
        this.qi_scores = qi_scores;
        var query_out_records = [];
        var ranks_to_show = [];
        for (var i = 0; i < RANK_TO_SHOW; i++)
            ranks_to_show.push(i);
        for (var _b = 0, _c = Object.keys(queries_watched); _b < _c.length; _b++) {
            var word = _c[_b];
            if (!(word in rank_lookup))
                continue;
            if (vocab[word].idx in q_idx_set)
                continue;
            var rank = rank_lookup[word];
            ranks_to_show.push(rank);
        }
        ranks_to_show = uniq_fast(ranks_to_show)
            .filter(function (rank) { return !(_this.index2word[qi_scores[rank].idx] in _this.queries_ignored); })
            .filter(function (rank) { return !(qi_scores[rank].idx in q_idx_set); })
            .sort();
        for (var _d = 0, ranks_to_show_1 = ranks_to_show; _d < ranks_to_show_1.length; _d++) {
            var rank = ranks_to_show_1[_d];
            var item_score = qi_scores[rank];
            var word = this.index2word[item_score.idx];
            var score = item_score.score;
            if (!(word in qo_lookup)) {
                qo_lookup[word] = { query: word, status: 'NORMAL' };
            }
            var record = qo_lookup[word];
            record.rank = rank;
            record.score = score;
            if (!record.rank_history) {
                record.rank_history = [];
            }
            if (record.rank_history.length >= 1 && record.rank_history.slice(-1)[0].iteration == iterations) {
                record.rank_history.slice(-1)[0].rank = rank;
            }
            else {
                record.rank_history.push({ rank: rank, iteration: iterations });
            }
            query_out_records.push(record);
        }
        query_out_records.sort(function (a, b) { return a.rank - b.rank; });
        this.state.query_out_records = query_out_records;
        this.state.qi_vec = qi_vec;
        var qi_scores_topN = qi_scores.slice(0, RANK_TO_CONSIDER_FOR_PERDIM);
        this.state.per_dim_neighbors = [];
        var _loop_1 = function(j) {
            var reranked_items = $
                .map(qi_scores_topN, function (x) {
                var score = 0;
                if (l2_sqrts[x.idx] > 0) {
                    score = qi_vec[j] * syn0[x.idx][j] / l2_sqrts[x.idx];
                }
                return {
                    query: _this.index2word[x.idx],
                    score: score };
            })
                .sort(function (a, b) { return b.score - a.score; })
                .slice(0, RANK_TO_SHOW);
            this_1.state.per_dim_neighbors.push(reranked_items);
        };
        var this_1 = this;
        for (var j = 0; j < hidden_size; j++) {
            _loop_1(j);
        }
    };
    Word2vec.prototype.get_pair_profile = function (query) {
        var _this = this;
        var state = this.state;
        var config = state.config;
        var hidden_size = config.hidden_size;
        var syn0 = this.syn0;
        var l2_sqrts = this.l2_sqrts;
        var qi_vec = this.qi_vec;
        var qo_idx = this.vocab[query].idx;
        var qo_vec_raw = syn0[qo_idx];
        var qo_vec = $.map(qo_vec_raw, function (x) { return x / l2_sqrts[qo_idx]; });
        var cosine_with_qo = function (w, i) {
            var score = 0;
            if (i != qo_idx) {
                var prod = 0;
                for (var j = 0; j < hidden_size; j++) {
                    prod += qo_vec[j] * syn0[i][j];
                }
                if (l2_sqrts[i] > 0) {
                    score = prod / l2_sqrts[i];
                }
            }
            return { idx: i, score: score };
        };
        var qo_scores_unsorted = $.map(this.index2word, cosine_with_qo);
        var qo_scores = qo_scores_unsorted.slice().sort(function (a, b) { return b.score - a.score; });
        var qo_neighbors = $.map(qo_scores.slice(0, RANK_TO_SHOW), function (item) { return { query: _this.index2word[item.idx], score: item.score }; });
        var qo_scores_topN = qo_scores.slice(0, RANK_TO_CONSIDER_FOR_PERDIM);
        var qo_per_dim_neighbors = [];
        var _loop_2 = function(j) {
            var reranked_items = $
                .map(qo_scores_topN, function (x) {
                var score = 0;
                if (l2_sqrts[x.idx] > 0) {
                    score = qo_vec[j] * syn0[x.idx][j] / l2_sqrts[x.idx];
                }
                return {
                    query: _this.index2word[x.idx],
                    score: score
                };
            })
                .sort(function (a, b) { return b.score - a.score; })
                .slice(0, RANK_TO_SHOW);
            qo_per_dim_neighbors.push(reranked_items);
        };
        for (var j = 0; j < hidden_size; j++) {
            _loop_2(j);
        }
        var elemprod_vec = qi_vec.map(function (v, i) { return v * qo_vec[i]; });
        var elemsum_vec = qi_vec.map(function (v, i) { return v + qo_vec[i]; });
        elemsum_vec = getNormalizedVec(elemsum_vec);
        var cosine_with_elemsum = function (w, i) {
            var score = 0;
            if (i != qo_idx && !(i in _this.q_idx_set)) {
                var prod = 0;
                for (var j = 0; j < hidden_size; j++) {
                    prod += elemsum_vec[j] * syn0[i][j];
                }
                if (l2_sqrts[i] > 0) {
                    score = prod / l2_sqrts[i];
                }
            }
            return { idx: i, score: score };
        };
        var elemsum_scores = $.map(this.index2word, cosine_with_elemsum);
        if (query in this.train_instance_log_map) {
            var C1 = [];
            var C2_1 = [];
            for (var i = 0; i < this.state.vocab_size; i++) {
                C1.push(1);
                C2_1.push(1);
            }
            for (var qidx in this.q_idx_set) {
                var q = this.index2word[qidx];
                if (!(q in this.train_instance_log_map))
                    continue;
                for (var _i = 0, _a = this.train_instance_log_map[q]; _i < _a.length; _i++) {
                    var log = _a[_i];
                    C1[this.vocab[log.word2].idx]++;
                }
            }
            for (var _b = 0, _c = this.train_instance_log_map[query]; _b < _c.length; _b++) {
                var log = _c[_b];
                C2_1[this.vocab[log.word2].idx]++;
            }
            var C12 = C1.map(function (x, i) { return { score: (x * C2_1[i]), idx: i }; });
            C12.sort(function (a, b) { return (b.score - a.score); });
            var C12_filtered = C12
                .filter(function (x) { return x.score > 1; })
                .slice(0, RANK_TO_CONSIDER_FOR_PERDIM);
            elemsum_scores = C12_filtered.map(function (x) { return elemsum_scores[x.idx]; });
        }
        elemsum_scores.sort(function (a, b) { return b.score - a.score; });
        var elemsum_neighbors = $.map(elemsum_scores.slice(0, RANK_TO_SHOW), function (item) {
            return { query: _this.index2word[item.idx],
                score1: _this.qi_scores_unsorted[item.idx].score,
                score2: qo_scores_unsorted[item.idx].score };
        });
        var elemsum_scores_topN = elemsum_scores.slice(0, RANK_TO_CONSIDER_FOR_PERDIM);
        var elemsum_per_dim_neighbors = [];
        var _loop_3 = function(j) {
            var reranked_items = $
                .map(elemsum_scores_topN, function (x) {
                var score1 = 0;
                var score2 = 0;
                if (l2_sqrts[x.idx] > 0) {
                    score1 = qi_vec[j] * syn0[x.idx][j] / l2_sqrts[x.idx];
                    score2 = qo_vec[j] * syn0[x.idx][j] / l2_sqrts[x.idx];
                }
                return {
                    query: _this.index2word[x.idx],
                    score1: score1,
                    score2: score2
                };
            })
                .sort(function (a, b) { return b.score1 + b.score2 - a.score1 - a.score2; })
                .slice(0, RANK_TO_SHOW);
            elemsum_per_dim_neighbors.push(reranked_items);
        };
        for (var j = 0; j < hidden_size; j++) {
            _loop_3(j);
        }
        var out = {
            qo: query,
            qo_vec: qo_vec,
            qo_neighbors: qo_neighbors,
            qo_per_dim_neighbors: qo_per_dim_neighbors,
            elemprod: elemprod_vec,
            elemsum_neighbors: elemsum_neighbors,
            elemsum_per_dim_neighbors: elemsum_per_dim_neighbors
        };
        return out;
    };
    Word2vec.prototype.train_until_breakpoint = function () {
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
    };
    Word2vec.prototype.train_sentence = function () {
        var _this = this;
        var sentence = this.sentences[this.state.sentences];
        var words = sentence.split(' ');
        var config = this.state.config;
        var progress = Math.min(1, this.state.instances / (this.state.corpus_size * this.state.config.iter));
        this.state.learning_rate = config.alpha - (config.alpha - config.min_alpha) * progress;
        words = words.filter(function (w) { return (w in _this.vocab); });
        words.forEach(function (word, pos) {
            var idx1 = _this.vocab[word].idx;
            var reduced_window = Math.round(random_1.get_random_float() * config.window);
            var start = Math.max(0, pos - config.window + reduced_window);
            var words_reduced_window = words.slice(start, pos + config.window + 1 - reduced_window);
            if (config.sg) {
                words_reduced_window.forEach(function (word2, i) {
                    var pos2 = i + start;
                    if (pos2 != pos) {
                        var idx2 = _this.vocab[word2].idx;
                        if (idx1 != idx2) {
                            var movement = _this.train_sg_pair(idx1, idx2);
                            if (word2 in _this.queries_watched || idx2 in _this.q_idx_set) {
                                var train_instance_log = {
                                    word: word2,
                                    word2: word,
                                    sentence_id: _this.state.sentences,
                                    epoch_id: _this.state.epochs,
                                    pos: pos2,
                                    pos2: pos,
                                    learning_rate: _this.state.learning_rate,
                                    movement: movement
                                };
                                if (!(word2 in _this.train_instance_log_map)) {
                                    _this.train_instance_log_map[word2] = [];
                                }
                                _this.train_instance_log_map[word2].push(train_instance_log);
                            }
                        }
                    }
                });
            }
            else {
                var word2_indices_1 = [];
                words_reduced_window.forEach(function (word2, i) {
                    var pos2 = i + start;
                    if (pos2 != pos) {
                        var idx2 = _this.vocab[word2].idx;
                        if (idx1 != idx2) {
                            word2_indices_1.push(pos2);
                        }
                    }
                });
                var l1 = [];
                for (var j = 0; j < config.hidden_size; j++)
                    l1.push(0);
                for (var _i = 0, word2_indices_2 = word2_indices_1; _i < word2_indices_2.length; _i++) {
                    var i = word2_indices_2[_i];
                    for (var j = 0; j < config.hidden_size; j++)
                        l1[j] += _this.syn0[i][j];
                }
                if (config.cbow_mean && word2_indices_1.length > 0)
                    for (var j = 0; j < config.hidden_size; j++)
                        l1[j] /= word2_indices_1.length;
                _this.train_cbow_pair(_this.vocab[word].idx, word2_indices_1, l1);
            }
            _this.state.instances++;
            if (word in _this.queries_watched)
                _this.count_instances_watched++;
        });
        this.state.sentences++;
        if (this.state.sentences >= this.state.num_sentences) {
            this.state.sentences = 0;
            this.state.epochs++;
        }
    };
    Word2vec.prototype.train_sg_pair = function (w_idx, context_idx) {
        if (w_idx == context_idx)
            return;
        var config = this.state.config;
        var vocab_size = this.state.vocab_size;
        var syn0 = this.syn0;
        var syn1 = this.syn1;
        var l1 = syn0[context_idx];
        var neu1e = [];
        var learning_rate = this.state.learning_rate;
        for (var j = 0; j < config.hidden_size; j++)
            neu1e.push(0);
        for (var d = 0; d < config.negative + 1; d++) {
            var target = void 0;
            var label = void 0;
            if (d == 0) {
                target = w_idx;
                label = 1;
            }
            else {
                var random = random_1.get_random_float() * CUM_TABLE_DOMAIN;
                target = bSearch(this.cum_table, random);
                if (target == 0)
                    target = Math.floor(random_1.get_random_float() * CUM_TABLE_DOMAIN) % (vocab_size - 1) + 1;
                if (target == w_idx)
                    continue;
                label = 0;
            }
            var l2 = syn1[target];
            var f = 0;
            var g = void 0;
            for (var j = 0; j < config.hidden_size; j++)
                f += l1[j] * l2[j];
            if (f > MAX_EXP)
                g = (label - 1) * learning_rate;
            else if (f < -MAX_EXP)
                g = (label - 0) * learning_rate;
            else
                g = (label - this.exp_table[Math.floor((f + MAX_EXP) * (EXP_TABLE_SIZE / MAX_EXP / 2))]) * learning_rate;
            if (isNaN(g) || !isFinite(g)) {
                console.log(g, l1, l2);
                throw new Error('ValueError!');
            }
            for (var j = 0; j < config.hidden_size; j++)
                neu1e[j] += g * l2[j];
            for (var j = 0; j < config.hidden_size; j++)
                l2[j] += g * l1[j];
        }
        for (var j = 0; j < config.hidden_size; j++)
            l1[j] += neu1e[j];
        return getL2Norm(neu1e);
    };
    Word2vec.prototype.train_cbow_pair = function (w_idx, context_idxs, l1) {
        var config = this.state.config;
        var vocab_size = this.state.vocab_size;
        var syn0 = this.syn0;
        var syn1 = this.syn1;
        var neu1e = [];
        var learning_rate = this.state.learning_rate;
        for (var j = 0; j < config.hidden_size; j++)
            neu1e.push(0);
        for (var d = 0; d < config.negative + 1; d++) {
            var target = void 0;
            var label = void 0;
            if (d == 0) {
                target = w_idx;
                label = 1;
            }
            else {
                var random = random_1.get_random_float() * CUM_TABLE_DOMAIN;
                target = bSearch(this.cum_table, random);
                if (target == 0)
                    target = Math.floor(random_1.get_random_float() * CUM_TABLE_DOMAIN) % (vocab_size - 1) + 1;
                if (target == w_idx)
                    continue;
                label = 0;
            }
            var l2 = syn1[target];
            var f = 0;
            var g = void 0;
            for (var j = 0; j < config.hidden_size; j++)
                f += l1[j] * l2[j];
            if (f > MAX_EXP)
                g = (label - 1) * learning_rate;
            else if (f < -MAX_EXP)
                g = (label - 0) * learning_rate;
            else
                g = (label - this.exp_table[Math.floor((f + MAX_EXP) * (EXP_TABLE_SIZE / MAX_EXP / 2))]) * learning_rate;
            for (var j = 0; j < config.hidden_size; j++)
                neu1e[j] += g * l2[j];
            for (var j = 0; j < config.hidden_size; j++)
                l2[j] += g * l1[j];
        }
        for (var _i = 0, context_idxs_1 = context_idxs; _i < context_idxs_1.length; _i++) {
            var a = context_idxs_1[_i];
            for (var j = 0; j < config.hidden_size; j++)
                syn0[a][j] += neu1e[j];
        }
    };
    Word2vec.prototype.get_influential_train_instances = function (w1, w2) {
        if (!(w1 in this.train_instance_log_map))
            return [];
        var train_instances = this
            .train_instance_log_map[w1]
            .filter(function (d) { return (d.word2 == w2); });
        var by_sentence = {};
        for (var _i = 0, train_instances_1 = train_instances; _i < train_instances_1.length; _i++) {
            var instance = train_instances_1[_i];
            if (!(instance.sentence_id in by_sentence)) {
                by_sentence[instance.sentence_id] = [];
            }
            by_sentence[instance.sentence_id][instance.epoch_id] = instance;
        }
        var summaries = [];
        for (var sentence_id_ in by_sentence) {
            var sentence_id = parseInt(sentence_id_);
            var sentence = this.sentences[sentence_id];
            var learning_rates = [];
            var movements = [];
            var total_movement = 0;
            var pos = -1;
            var pos2 = -1;
            for (var i = 0; i < this.state.epochs; i++) {
                var learning_rate = 0;
                var movement = 0;
                if (i in by_sentence[sentence_id_]) {
                    var instance = by_sentence[sentence_id_][i];
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
        summaries.sort(function (a, b) { return b.total_movement - a.total_movement; });
        return summaries.slice(0, RANK_TO_SHOW);
    };
    Word2vec.prototype.update_PCA = function () {
        var matrix = this.get_PCA_matrix();
        if (matrix.length == 0)
            return;
        var pca = new PCA();
        var matrixNormalized = pca.scale(matrix, true, true);
        this.principal_components = pca.pca(matrixNormalized);
    };
    Word2vec.prototype.get_2D_vecs = function () {
        var pc0 = this.principal_components[0];
        var pc1 = this.principal_components[1];
        var vectorProjections = [];
        for (var q_idx in this.q_idx_set) {
            var row = this.syn0[q_idx];
            var proj0 = dotProduct(pc0, row);
            var proj1 = dotProduct(pc1, row);
            vectorProjections.push({
                proj0: proj0,
                proj1: proj1,
                word: this.index2word[q_idx],
                type: 'QUERY_IN'
            });
        }
        for (var _i = 0, _a = this.state.query_out_records; _i < _a.length; _i++) {
            var record = _a[_i];
            var word = record.query;
            var idx = this.vocab[word].idx;
            if (idx in this.q_idx_set)
                continue;
            var row = this.syn0[idx];
            var proj0 = dotProduct(pc0, row);
            var proj1 = dotProduct(pc1, row);
            vectorProjections.push({
                proj0: proj0,
                proj1: proj1,
                word: word,
                type: this.qo_map[this.qi_key][word].status
            });
        }
        return vectorProjections;
    };
    Word2vec.prototype.get_PCA_matrix = function () {
        return this.syn0.slice(0, this.state.config.hidden_size + 1);
    };
    return Word2vec;
}());
exports.Word2vec = Word2vec;
function uniq_fast(a) {
    var seen = {};
    var out = [];
    var len = a.length;
    var j = 0;
    for (var i = 0; i < len; i++) {
        var item = a[i];
        if (seen[item] !== 1) {
            seen[item] = 1;
            out[j++] = item;
        }
    }
    return out;
}
function bSearch(xs, x) {
    var bot = 0;
    var top = xs.length;
    if (xs.length == 0)
        return 0;
    else if (x > xs[xs.length - 1])
        return xs.length;
    else if (x < xs[0])
        return 0;
    while (bot < top) {
        var mid = Math.floor((bot + top) / 2);
        var c = xs[mid] - x;
        if (c === 0)
            return mid;
        if (c < 0)
            bot = mid + 1;
        if (0 < c)
            top = mid;
    }
    return bot;
}
function getL2Norm(vec) {
    var sum = 0;
    for (var _i = 0, vec_1 = vec; _i < vec_1.length; _i++) {
        var v = vec_1[_i];
        sum += v * v;
    }
    return Math.sqrt(sum);
}
function getNormalizedVec(vec) {
    var l2norm = getL2Norm(vec);
    if (l2norm == 0)
        return vec;
    return vec.map(function (v) { return v / l2norm; });
}
function dotProduct(vec1, vec2) {
    if (vec1.length != vec2.length) {
        throw new Error('dimension mismatch.');
    }
    var out = 0;
    for (var i = 0; i < vec1.length; i++) {
        out += vec1[i] * vec2[i];
    }
    return out;
}

},{"./model_state":4,"./random":5,"./util":9}],8:[function(require,module,exports){
"use strict";
function getKeyFromValue(obj, value) {
    for (var key in obj) {
        if (obj[key] === value) {
            return key;
        }
    }
    return undefined;
}
exports.getKeyFromValue = getKeyFromValue;
(function (Type) {
    Type[Type["STRING"] = 0] = "STRING";
    Type[Type["NUMBER"] = 1] = "NUMBER";
    Type[Type["ARRAY_NUMBER"] = 2] = "ARRAY_NUMBER";
    Type[Type["ARRAY_STRING"] = 3] = "ARRAY_STRING";
    Type[Type["BOOLEAN"] = 4] = "BOOLEAN";
    Type[Type["OBJECT"] = 5] = "OBJECT";
})(exports.Type || (exports.Type = {}));
var Type = exports.Type;
;
var UIState = (function () {
    function UIState() {
        this.model = "word2vec";
        this.backend = "browser";
        this.query_in = [];
        this.query_out = [];
    }
    UIState.deserializeState = function () {
        var map = {};
        for (var _i = 0, _a = window.location.hash.slice(1).split("&"); _i < _a.length; _i++) {
            var keyvalue = _a[_i];
            var _b = keyvalue.split("="), name_1 = _b[0], value = _b[1];
            map[name_1] = value;
        }
        var state = new UIState();
        function hasKey(name) {
            return name in map && map[name] != null && map[name].trim() !== "";
        }
        function parseArray(value) {
            return value.trim() === "" ? [] : value.split(",");
        }
        UIState.PROPS.forEach(function (_a) {
            var name = _a.name, type = _a.type, keyMap = _a.keyMap;
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
    };
    UIState.prototype.serialize = function () {
        var _this = this;
        var props = [];
        UIState.PROPS.forEach(function (_a) {
            var name = _a.name, type = _a.type, keyMap = _a.keyMap;
            var value = _this[name];
            if (value == null) {
                return;
            }
            if (type === Type.OBJECT) {
                value = getKeyFromValue(keyMap, value);
            }
            else if (type === Type.ARRAY_NUMBER ||
                type === Type.ARRAY_STRING) {
                value = value.join(",");
            }
            props.push(name + "=" + value);
        });
        window.location.hash = props.join("&");
    };
    UIState.PROPS = [
        { name: "model", type: Type.STRING },
        { name: "backend", type: Type.STRING },
        { name: 'query_in', type: Type.ARRAY_STRING },
        { name: 'query_out', type: Type.ARRAY_STRING }
    ];
    return UIState;
}());
exports.UIState = UIState;
var UIStateHidden = (function () {
    function UIStateHidden() {
        this.has_setup_query_column = false;
        this.is_queryin_valid = false;
        this.skip_reset_on_hashchange = false;
        this.is_to_pause_training = false;
        this.is_model_busy_training = false;
    }
    return UIStateHidden;
}());
exports.UIStateHidden = UIStateHidden;

},{}],9:[function(require,module,exports){
"use strict";
function startsWith(s, prefix) {
    return s.substr(0, prefix.length) == prefix;
}
exports.startsWith = startsWith;
function endsWith(s, suffix) {
    return s.substr(-suffix.length) === suffix;
}
exports.endsWith = endsWith;
function isUrl(s) {
    var regexp = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
    return regexp.test(s);
}
exports.isUrl = isUrl;
function exciteValueToNum(x) {
    x = x * 5;
    return 1 / (1 + Math.exp(-x));
}
exports.exciteValueToNum = exciteValueToNum;
function exciteValueToColor(x) {
    return numToColor(exciteValueToNum(x));
}
exports.exciteValueToColor = exciteValueToColor;
var colors;
colors = ["#427DA8", "#6998BB", "#91B3CD", "#BAD0E0",
    "#E1ECF3", "#FADEE0", "#F2B5BA", "#EA8B92",
    "#E2636C", "#DB3B47"];
var numToColor = d3.scale.linear()
    .domain(d3.range(0, 1, 1 / (colors.length - 1)))
    .range(colors);

},{}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJiYXJjaGFydC50cyIsImljb25zLnRzIiwibGFtdmkudHMiLCJtb2RlbF9zdGF0ZS50cyIsInJhbmRvbS50cyIsInRveV9tb2RlbF9lbnRyeS50cyIsInRveV9tb2RlbF93MnYudHMiLCJ1aV9zdGF0ZS50cyIsInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FDRUEsc0JBQXFDLEdBQXNCLEVBQUUsSUFBYyxFQUNyRSxNQUFjO0lBQ2xCLEdBQUcsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDNUIsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUM7UUFBQyxNQUFNLENBQUM7SUFFN0IsSUFBSSxNQUFNLEdBQUcsRUFBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFDLEVBQ25ELEtBQUssR0FBRyxHQUFHLEdBQUcsTUFBTSxDQUFDLElBQUksR0FBRyxNQUFNLENBQUMsS0FBSyxFQUN4QyxNQUFNLEdBQUcsR0FBRyxHQUFHLE1BQU0sQ0FBQyxHQUFHLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUU5QyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRTtTQUNyQixlQUFlLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLEVBQUUsRUFBRSxDQUFDO1NBQy9CLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQUMsQ0FBQyxFQUFDLENBQUMsSUFBSyxPQUFBLEVBQUUsR0FBQyxDQUFDLEVBQUosQ0FBSSxDQUFDLENBQUMsQ0FBQztJQUVyQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRTtTQUNwQixLQUFLLENBQUMsQ0FB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QUcsRUFBRSxDQUFDO1FBQ3BCLElBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7UUFDL0IsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztRQUc3QixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFdBQVcsRUFBRSxDQUFDLEVBQUU7WUFBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3JELEdBQUcsQ0FBQyxDQUFVLFVBQVEsRUFBUixxQkFBUSxFQUFSLHNCQUFRLEVBQVIsSUFBUSxDQUFDO1lBQWxCLElBQUksQ0FBQyxpQkFBQTtZQUNSLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQztZQUNiLElBQUksS0FBSyxHQUFHLEtBQUssQ0FBQztZQUNsQixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzVCLEtBQUssR0FBRyxJQUFJLENBQUM7Z0JBQ2IsSUFBSSxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEIsQ0FBQztZQUNELElBQUksSUFBSSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUM7WUFDM0IsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQztZQUN2QixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFdBQVcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNyQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUM7b0JBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDdEMsSUFBSTtvQkFBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2xDLENBQUM7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LENBQUMsQ0FBQyxDQUFDO0FBQ3pCLENBQUM7QUFIZSxhQUFLLFFBR3BCLENBQUE7QUFJRCwwQkFBaUMsQ0FBUztJQUN4QyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNWLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDOUIsQ0FBQztBQUhlLHdCQUFnQixtQkFHL0IsQ0FBQTtBQUVELDRCQUFtQyxDQUFTO0lBQzFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN6QyxDQUFDO0FBRmUsMEJBQWtCLHFCQUVqQyxDQUFBO0FBRUQsSUFBSSxNQUFXLENBQUM7QUFDaEIsTUFBTSxHQUFHLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsU0FBUztJQUNwQyxTQUFTLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTO0lBQzFDLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQztBQUN0QyxJQUFJLFVBQVUsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRTtLQUM3QixNQUFNLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUMvQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gUmVmZXJlbmNlOiBodHRwczovL2JsLm9ja3Mub3JnL21ib3N0b2NrLzM4ODUzMDRcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZHJhd0JhckNoYXJ0KHN2ZzogZDMuU2VsZWN0aW9uPGFueT4sIGRhdGE6IG51bWJlcltdLFxuICAgICAgeGxhYmVsOiBzdHJpbmcpIHtcbiAgc3ZnLnNlbGVjdEFsbCgnKicpLnJlbW92ZSgpO1xuICBpZiAoZGF0YS5sZW5ndGggPT0gMCkgcmV0dXJuO1xuXG4gIHZhciBtYXJnaW4gPSB7dG9wOiAyMCwgcmlnaHQ6IDIwLCBib3R0b206IDQwLCBsZWZ0OiA0MH0sXG4gICAgICB3aWR0aCA9IDMwMCAtIG1hcmdpbi5sZWZ0IC0gbWFyZ2luLnJpZ2h0LFxuICAgICAgaGVpZ2h0ID0gMzAwIC0gbWFyZ2luLnRvcCAtIG1hcmdpbi5ib3R0b207XG5cbiAgdmFyIHggPSBkMy5zY2FsZS5vcmRpbmFsKClcbiAgICAgIC5yYW5nZVJvdW5kQmFuZHMoWzAsIHdpZHRoXSwgLjEpXG4gICAgICAuZG9tYWluKGRhdGEubWFwKChkLGkpID0+ICcnK2kpKTtcblxuICB2YXIgeSA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgICAucmFuZ2UoW2hlaWdodCwgMF0pXG4gICAgICAuZG9tYWluKFswLCBkMy5tYXgoZGF0YSldKTtcblxuICB2YXIgeEF4aXMgPSBkMy5zdmcuYXhpcygpXG4gICAgICAuc2NhbGUoeClcbiAgICAgIC5vcmllbnQoXCJib3R0b21cIik7XG5cbiAgdmFyIHlBeGlzID0gZDMuc3ZnLmF4aXMoKVxuICAgICAgLnNjYWxlKHkpXG4gICAgICAub3JpZW50KFwibGVmdFwiKVxuXG4gIHlBeGlzLnRpY2tzKDEwKTtcblxuICBzdmcgPSBzdmcuYXBwZW5kKFwiZ1wiKVxuICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIG1hcmdpbi5sZWZ0ICsgXCIsXCIgKyBtYXJnaW4udG9wICsgXCIpXCIpO1xuXG4gIHN2Zy5hcHBlbmQoXCJnXCIpXG4gICAgICAuYXR0cihcImNsYXNzXCIsIFwieCBheGlzXCIpXG4gICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgwLFwiICsgaGVpZ2h0ICsgXCIpXCIpXG4gICAgICAuY2FsbCh4QXhpcylcbiAgICAuYXBwZW5kKCd0ZXh0JylcbiAgICAgIC50ZXh0KHhsYWJlbClcbiAgICAgIC5hdHRyKCdkeCcsIHdpZHRoIC8gMilcbiAgICAgIC5hdHRyKCdkeScsIFwiMzVcIilcbiAgICAgIC5hdHRyKCd0ZXh0LWFuY2hvcicsICdtaWRkbGUnKTtcblxuICBzdmcuYXBwZW5kKFwiZ1wiKVxuICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInkgYXhpc1wiKVxuICAgICAgLmNhbGwoeUF4aXMpO1xuXG4gIHN2Zy5zZWxlY3RBbGwoXCIuYmFyXCIpXG4gICAgICAuZGF0YShkYXRhKVxuICAgIC5lbnRlcigpLmFwcGVuZChcInJlY3RcIilcbiAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJiYXJcIilcbiAgICAgIC5hdHRyKFwieFwiLCBmdW5jdGlvbihkLGkpIHsgcmV0dXJuIHgoJycraSk7IH0pXG4gICAgICAuYXR0cihcIndpZHRoXCIsIHdpZHRoICogMC45NSAvIGRhdGEubGVuZ3RoKVxuICAgICAgLmF0dHIoXCJ5XCIsIGQgPT4geShkKSlcbiAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGQgPT4gaGVpZ2h0IC0geShkKSk7XG59XG4iLCJleHBvcnQgY29uc3QgdGh1bWJfdXAgPSAnPHBhdGggZD1cIk05MSw2OC4zYzItMS4zLDMuMy0zLjcsMy4zLTYuNGMwLTIuMS0wLjgtNC0yLTUuM2MtMC40LTAuNS0wLjMtMS4zLDAuMS0xLjZjMS42LTEuMiwyLjYtMy4yLDIuNi01LjYgIGMtMC4xLTMuNi0yLjctNi40LTUuOC02LjRoMGMtMC4xLDAtMC4zLDAtMC41LDBoLTMxYy0xLjMtMC4yLTIuNy0wLjgtMi43LTIuNWMzLjktMTAuNiw2LjUtMTQsNi45LTIyLjVjMC4zLTUuOS0xLjUtMTAuNi01LjYtMTEuNyAgYy01LjctMS4yLTcuMyw0LjktNy42LDUuOUM0NiwyMi44LDQxLjEsNDQuNiwxMi45LDQ2LjljLTIuOSwwLjItNS4zLDIuMy01LjUsNS4yYy0wLjUsOC0xLjgsMjMuMi0yLjQsMzEuNiAgYy0wLjIsMy4zLDIuNCw2LjEsNS44LDYuM2M1LjYsMC4yLDExLjUsMC42LDE0LjYsMC42YzUuMSwwLDkuOSwzLjYsMTQuNiwzLjZjMi4xLDAsNDMuNCwwLDQzLjQsMGMzLjIsMCw1LjgtMyw1LjgtNi42ICBjMC0xLjYtMC41LTMuMS0xLjQtNC4yYy0wLjQtMC41LTAuMi0xLjQsMC40LTEuN2MyLjQtMSw0LjItMy43LDQuMi02LjljMC0xLjktMC42LTMuNy0xLjctNUM5MC4zLDY5LjQsOTAuNCw2OC42LDkxLDY4LjN6XCI+PC9wYXRoPic7XG5cbmV4cG9ydCBjb25zdCB3YXN0ZV9iYXNja2V0ID0gJzxwYXRoIGQ9XCJNNzMuNjg1LDEwLjUyNkg1Mi42MzFWMi42MzFjMC0xLjQ1OC0xLjE3My0yLjYzMS0yLjYzLTIuNjMxSDI4Ljk0N2MtMS40NTgsMC0yLjYzMSwxLjE3My0yLjYzMSwyLjYzMXY3Ljg5NUg1LjI2M1x0QzIuMzQ3LDEwLjUyNiwwLDEyLjg3NCwwLDE1Ljc4OWMwLDIuOTE3LDIuMzQ3LDUuMjYzLDUuMjYzLDUuMjYzaDY4LjQyMmMyLjkxNSwwLDUuMjYzLTIuMzQ3LDUuMjYzLTUuMjYzIEM3OC45NDcsMTIuODc0LDc2LjYsMTAuNTI2LDczLjY4NSwxMC41MjZ6IE00Ny4zNjgsMTAuNTI2SDMxLjU3OVY1LjI2M2gxNS43ODlWMTAuNTI2elwiPjwvcGF0aD48cGF0aCBkPVwiTTUuMjYzLDI2LjMxNmMtMi45MTYsMC01LjY2LDIuMzg3LTUuMTgxLDUuMjYzbDEwLjQ0NCw2My4xNThDMTEuMDAyLDk3LjYxMywxMi44NzQsMTAwLDE1Ljc5LDEwMGg0Ny4zNjkgYzIuOTE2LDAsNC43ODMtMi4zODcsNS4yNjItNS4yNjRsMTAuNDQ2LTYzLjE1OGMwLjQ3NS0yLjg3Ni0yLjI2Ny01LjI2My01LjE4Mi01LjI2M0g1LjI2M3pcIj48L3BhdGg+JztcbiIsIi8qXG5JbXBsZW1lbnRhdGlvbiBwYXJ0aWFsbHkgYm9ycm93ZWQgZnJvbSBodHRwczovL2dpdGh1Yi5jb20vdGVuc29yZmxvdy9wbGF5Z3JvdW5kL1xuTW9kaWZpY2F0aW9uIENvcHlyaWdodDogKDIwMTYpIFhpbiBSb25nLiBMaWNlbnNlOiBNSVQuXG5cbk9yaWdpbmFsIGZpbGUgY29weXJpZ2h0OlxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5Db3B5cmlnaHQgMjAxNiBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJ0eXBpbmdzL2Jyb3dzZXIuZC50c1wiIC8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwidGFnLWl0LmQudHNcIiAvPlxuXG5pbXBvcnQge1VJU3RhdGUsIFVJU3RhdGVIaWRkZW59IGZyb20gXCIuL3VpX3N0YXRlXCI7XG5pbXBvcnQge01vZGVsU3RhdGUsIE1vZGVsQ29uZmlnLCBRdWVyeU91dFJlY29yZH0gZnJvbSAnLi9tb2RlbF9zdGF0ZSc7XG5pbXBvcnQge1dvcmQydmVjU3RhdGUsIFBhaXJQcm9maWxlLCBUcmFpbkluc3RhbmNlU3VtbWFyeX0gZnJvbSBcIi4vdG95X21vZGVsX3cydlwiO1xuaW1wb3J0IGhhbmRsZVJlcXVlc3QgZnJvbSBcIi4vdG95X21vZGVsX2VudHJ5XCI7XG5pbXBvcnQgKiBhcyB1dGlsIGZyb20gXCIuL3V0aWxcIjtcbmltcG9ydCAqIGFzIGljb25zIGZyb20gXCIuL2ljb25zXCI7XG5pbXBvcnQgZHJhd0JhckNoYXJ0IGZyb20gXCIuL2JhcmNoYXJ0XCI7XG5cbmxldCB1aV9zdGF0ZTogVUlTdGF0ZTtcbmxldCB1aV9zdGF0ZV9oaWRkZW46IFVJU3RhdGVIaWRkZW47XG5sZXQgbW9kZWxfc3RhdGU6IE1vZGVsU3RhdGU7XG5sZXQgdHJhaW5faW5pdF90aW1lb3V0OiBudW1iZXI7XG5cbmZ1bmN0aW9uIHZhbGlkYXRlQmFja2VuZCgpIHtcbiAgaWYgKHVpX3N0YXRlLmJhY2tlbmQgPT0gXCJicm93c2VyXCIpIHtcbiAgICBpZiAodWlfc3RhdGUubW9kZWwgIT0gJ3dvcmQydmVjJykge1xuICAgICAgc2hvd0Vycm9yKCdVbnJlY29nbml6ZWQgbW9kZWwgdHlwZTogXCInICsgdWlfc3RhdGUubW9kZWwgKyAnXCIuJyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmICghdXRpbC5pc1VybCh1aV9zdGF0ZS5iYWNrZW5kKSkge1xuICAgICAgc2hvd0Vycm9yKCdiYWNrZW5kIG11c3QgYmUgZWl0aGVyIFwiYnJvd3NlclwiIG9yIGEgdmFsaWQgVVJMLiBDdXJyZW50bHkgc3BlY2lmaWVkIHRvIFwiJyArXG4gICAgICAgIHVpX3N0YXRlLmJhY2tlbmQgKyAnXCIuJyk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHNlbmRSZXF1ZXN0VG9CYWNrZW5kKHR5cGU6IHN0cmluZywgcmVxdWVzdDoge30sIGNhbGxiYWNrOiAocmVzcG9uc2U6IGFueSkgPT4gYW55KSB7XG4gIGlmICh1aV9zdGF0ZS5iYWNrZW5kID09IFwiYnJvd3NlclwiKSB7XG4gICAgbGV0IHJlc3BvbnNlOiBhbnkgPSBoYW5kbGVSZXF1ZXN0KHR5cGUsIHJlcXVlc3QpO1xuICAgIGNhbGxiYWNrKHJlc3BvbnNlKTtcbiAgfSBlbHNlIHtcbiAgICByZXF1ZXN0Wyd0eXBlJ10gPSB0eXBlO1xuICAgICQuZ2V0SlNPTih1aV9zdGF0ZS5iYWNrZW5kLCByZXF1ZXN0LCBmdW5jdGlvbiAocmVzcG9uc2U6IGFueSkge1xuICAgICAgaWYgKHJlc3BvbnNlLmhhc093blByb3BlcnR5KCdlcnJvcicpKSB7XG4gICAgICAgIHNob3dFcnJvcihyZXNwb25zZS5lcnJvcik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjYWxsYmFjayhyZXNwb25zZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVzZXQoKSB7XG4gICQoXCIudG9wLWVycm9yLWJhbm5lclwiKS5lbXB0eSgpLmhpZGUoKTtcbiAgLy8gJCgnLmNvbHVtbi5xdWVyeScpLmhpZGUoKTtcbiAgdWlfc3RhdGVfaGlkZGVuID0gbmV3IFVJU3RhdGVIaWRkZW4oKTsgIC8vIHJlcG9wdWxhdGUgd2l0aCBkZWZhdWx0IHZhbHVlLlxuXG4gIHVpX3N0YXRlID0gVUlTdGF0ZS5kZXNlcmlhbGl6ZVN0YXRlKCk7XG4gIHVpX3N0YXRlLnNlcmlhbGl6ZSgpOyAgLy8gZm9sZCBtaXNzaW5nIGRlZmF1bHQgdmFsdWVzIChpZiBhbnkpIGJhY2sgdG8gVVJMLlxuICB2YWxpZGF0ZUJhY2tlbmQoKTtcblxuICB1cGRhdGVVSVN0YXR1cyhcIklkZW50aWZ5aW5nIG1vZGVsLi4uXCIpO1xuICBpZGVudGlmeV9tb2RlbCgpO1xuXG4gICQoJyNidG4tdXBkYXRlLXJlc3RhcnQnKS5jbGljayhyZXNldCk7XG4gICQoJyNidG4tc3RhcnQtcGF1c2UnKS5jbGljayhmdW5jdGlvbigpIHtcbiAgICBpZiAoIXVpX3N0YXRlX2hpZGRlbi5pc190b19wYXVzZV90cmFpbmluZ1xuICAgICAgICAmJiAodWlfc3RhdGVfaGlkZGVuLmlzX21vZGVsX2J1c3lfdHJhaW5pbmdcbiAgICAgICAgICAgIHx8IG1vZGVsX3N0YXRlLnN0YXR1cyA9PSAnQVVUT19CUkVBSycpKSB7XG4gICAgICAkKHRoaXMpLmh0bWwoJ1N0YXJ0Jyk7XG4gICAgICB1aV9zdGF0ZV9oaWRkZW4uaXNfdG9fcGF1c2VfdHJhaW5pbmcgPSB0cnVlO1xuICAgICAgdXBkYXRlVUlTdGF0dXMoJ1BhdXNpbmcgdHJhaW5pbmcuLi4nKTtcbiAgICAgIC8vIHdpbmRvdy5jbGVhclRpbWVvdXQodHJhaW5faW5pdF90aW1lb3V0KTtcbiAgICB9XG4gICAgZWxzZSBpZiAoIXVpX3N0YXRlX2hpZGRlbi5pc19tb2RlbF9idXN5X3RyYWluaW5nXG4gICAgICAgICYmIG1vZGVsX3N0YXRlXG4gICAgICAgICYmIChtb2RlbF9zdGF0ZS5zdGF0dXMgPT0gJ1dBSVRfRk9SX1RSQUlOJ1xuICAgICAgICAgICAgfHwgbW9kZWxfc3RhdGUuc3RhdHVzID09ICdVU0VSX0JSRUFLJykpIHtcbiAgICAgICQodGhpcykuaHRtbCgnUGF1c2UnKTtcbiAgICAgIHVwZGF0ZVVJU3RhdHVzKCdUcmFpbmluZy4uLicpO1xuICAgICAgdHJhaW5faW5pdF90aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7YmF0Y2hfdHJhaW4oLTEsIGZhbHNlKTt9LCAxNTApO1xuICAgIH1cbiAgfSk7XG4gICQoJyNidG4tbmV4dCcpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgIGlmICghdWlfc3RhdGVfaGlkZGVuLmlzX21vZGVsX2J1c3lfdHJhaW5pbmdcbiAgICAgICAgJiYgbW9kZWxfc3RhdGVcbiAgICAgICAgJiYgKG1vZGVsX3N0YXRlLnN0YXR1cyA9PSAnV0FJVF9GT1JfVFJBSU4nXG4gICAgICAgICAgICB8fCBtb2RlbF9zdGF0ZS5zdGF0dXMgPT0gJ1VTRVJfQlJFQUsnKSkge1xuICAgICAgdXBkYXRlVUlTdGF0dXMoJ1RyYWluaW5nIHVudGlsIGhpdHRpbmcgbmV4dCB3YXRjaGVkIGl0ZW0uLi4nKTtcbiAgICAgIHRyYWluX2luaXRfdGltZW91dCA9IHNldFRpbWVvdXQoKCk9PntiYXRjaF90cmFpbigxLCB0cnVlKTt9LCAxNTApO1xuICAgIH1cbiAgfSk7XG4gICQoJyNidG4tcmVzZXQnKS5jbGljayhyZXNldCk7XG5cbiAgJCgnI2J0bi1hZGQtdG8td2F0Y2hsaXN0JykuY2xpY2soKCkgPT4ge1xuICAgIGxldCBxbyA9ICQoJyNxdWVyeS1vdXQtc2VhcmNoJykudmFsKCk7XG4gICAgc2VhcmNoUXVlcnlPdXQocW8pO1xuICB9KTtcblxuICBhZGRDb2xvckJhcigpO1xufVxuXG5mdW5jdGlvbiBzaG93RXJyb3IobWVzc2FnZTogc3RyaW5nKSB7XG4gIGNvbnNvbGUubG9nKG1lc3NhZ2UpO1xuICBsZXQgbmV3X2Vycm9yID0gJzxwPicgKyBtZXNzYWdlICsgJzwvcD4nO1xuICAkKCcudG9wLWVycm9yLWJhbm5lcicpLmFwcGVuZChuZXdfZXJyb3IpO1xuICAkKCcudG9wLWVycm9yLWJhbm5lcicpLnNob3coKTtcbn1cblxuLy8gZGVwZW5kaW5nIG9uIHRoZSBtb2RlbCdzIHJldHVybmVkIG1vZGVsIHN0YXRlLCBwZXJmb3JtcyBkaWZmZXJlbnQgZnJvbnRlbmRcbi8vIHRhc2tzIGFuZCBzZW5kcyBkaWZmZXJlbnQgZm9sbG93LXVwIHJlcXVlc3RzIHRvIG1vZGVsLlxuZnVuY3Rpb24gaGFuZGxlTW9kZWxTdGF0ZSgpIHtcbiAgdWlfc3RhdGVfaGlkZGVuLmlzX21vZGVsX2J1c3lfdHJhaW5pbmcgPSBmYWxzZTtcbiAgaWYgKCFtb2RlbF9zdGF0ZSkge1xuICAgIHRocm93IG5ldyBFcnJvcignRW1wdHkgbW9kZWxfc3RhdGUhJyk7XG4gIH1cbiAgbGV0IG1vZGVsX2NvbmZpZyA9IG1vZGVsX3N0YXRlLmNvbmZpZztcblxuICBpZiAobW9kZWxfc3RhdGUuc3RhdHVzID09ICdBVVRPX0JSRUFLJyAmJiB1aV9zdGF0ZV9oaWRkZW4uaXNfdG9fcGF1c2VfdHJhaW5pbmcpIHtcbiAgICBtb2RlbF9zdGF0ZS5zdGF0dXMgPSAnVVNFUl9CUkVBSyc7XG4gIH1cblxuICBzd2l0Y2ggKG1vZGVsX3N0YXRlLnN0YXR1cykge1xuICAgIGNhc2UgJ1dBSVRfRk9SX0NPUlBVUyc6ICAvLyBmb3IgaW4tYnJvd3NlciBtb2RlbHMgb25seVxuICAgICAgdXBkYXRlVUlTdGF0dXMoJ0xvYWRpbmcgY29ycHVzLi4uJyk7XG4gICAgICAkLmdldChtb2RlbF9jb25maWcudHJhaW5fY29ycHVzX3VybCwgKGNvcnB1cykgPT4ge1xuICAgICAgICBpZiAoY29ycHVzKSB7XG4gICAgICAgICAgbGV0IGNvcnB1c19wcmV2aWV3OiBzdHJpbmcgPSBjb3JwdXMuc3Vic3RyKDAsIDEwMDApO1xuICAgICAgICAgICQoJyN0cmFpbi10ZXh0JykudGV4dChjb3JwdXNfcHJldmlldyk7XG4gICAgICAgICAgJChcIiN0cmFpbi1jb3JwdXMtbGlua1wiKS5hdHRyKCdocmVmJywgbW9kZWxfY29uZmlnLnRyYWluX2NvcnB1c191cmwpLnNob3coKTtcbiAgICAgICAgICBzZW5kUmVxdWVzdFRvQmFja2VuZCgnc2V0X2NvcnB1cycsIHsgJ2NvcnB1cyc6IGNvcnB1cyB9LCBoYW5kbGVNb2RlbFN0YXRlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZhaWxlZCB0byBsb2FkIGNvcnB1cy4nKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgJ1dBSVRfRk9SX0lOSVQnOlxuICAgICAgJCgnI21vZGVsLXR5cGUnKS5odG1sKCcgLSBUeXBlOiAnICsgbW9kZWxfc3RhdGUuZnVsbF9tb2RlbF9uYW1lKTtcbiAgICAgICQoJyNjb25maWctdGV4dCcpLmh0bWwoSlNPTi5zdHJpbmdpZnkobW9kZWxfY29uZmlnLCBudWxsLCAnJykpO1xuICAgICAgdXBkYXRlVUlTdGF0dXMoJ0J1aWxkaW5nIHZvY2FidWxhcnkgYW5kIGluaXRpYWxpemluZyBtb2RlbC4uLicpO1xuICAgICAgaW5pdF9tb2RlbCgpO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlICdXQUlUX0ZPUl9UUkFJTic6XG4gICAgICB1cGRhdGVVSVN0YXR1cygnUmVhZHkgZm9yIHRyYWluaW5nLicpO1xuICAgICAgZGlzcGxheV90cmFpbmluZ19kYXRhX292ZXJ2aWV3KCk7XG4gICAgICBkaXNwbGF5X3RyYWluaW5nX3N0YXR1c19vdmVydmlldygpO1xuXG4gICAgICBpZiAoIXVpX3N0YXRlX2hpZGRlbi5oYXNfc2V0dXBfcXVlcnlfY29sdW1uKSB7XG4gICAgICAgIHVpX3N0YXRlX2hpZGRlbi5oYXNfc2V0dXBfcXVlcnlfY29sdW1uID0gdHJ1ZTsgIC8vIGhhcyB0byBiZSBjYWxsZWQgZmlyc3QhXG4gICAgICAgIHNldHVwUXVlcnlDb2x1bW4obW9kZWxfY29uZmlnKTsgIC8vIHRoaXMgd2lsbCBhcHBseSBkZWZhdWx0IHF1ZXJpZXMgaWYgdGhlcmUgYXJlIG5vbmVcbiAgICAgICAgdXBkYXRlUXVlcnlPdXRSZXN1bHQoKTtcbiAgICAgIH1cbiAgICAgIHVwZGF0ZVF1ZXJ5T3V0U1ZHKCk7XG4gICAgICB1cGRhdGVIaWRkZW5JbigpO1xuICAgICAgdXBkYXRlU2NhdHRlclBsb3QoKTtcbiAgICAgIGJyZWFrXG5cbiAgICBjYXNlICdBVVRPX0JSRUFLJzpcbiAgICAgIHRyYWluX2luaXRfdGltZW91dCA9IHNldFRpbWVvdXQocmVzdW1lX3RyYWluaW5nLCAxNTApO1xuICAgICAgZGlzcGxheV90cmFpbmluZ19zdGF0dXNfb3ZlcnZpZXcoKTtcbiAgICAgIHVwZGF0ZVF1ZXJ5T3V0U1ZHKCk7XG4gICAgICB1cGRhdGVIaWRkZW5JbigpO1xuICAgICAgdXBkYXRlU2NhdHRlclBsb3QoKTtcbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSAnVVNFUl9CUkVBSyc6XG4gICAgICB1cGRhdGVVSVN0YXR1cygnVHJhaW5pbmcgcGF1c2VkLicpO1xuICAgICAgZGlzcGxheV90cmFpbmluZ19zdGF0dXNfb3ZlcnZpZXcoKTtcbiAgICAgIHVwZGF0ZVF1ZXJ5T3V0U1ZHKCk7XG4gICAgICB1cGRhdGVIaWRkZW5JbigpO1xuICAgICAgdXBkYXRlU2NhdHRlclBsb3QoKTtcbiAgICAgIGJyZWFrO1xuXG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5yZWNvZ25pemVkIG1vZGVsIHN0YXR1czogXCInICsgbW9kZWxfc3RhdGUuc3RhdHVzICsgJ1wiJyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZGlzcGxheV90cmFpbmluZ19kYXRhX292ZXJ2aWV3KCkge1xuICBsZXQgbW9kZWxfY29uZmlnID0gbW9kZWxfc3RhdGUuY29uZmlnO1xuICBsZXQgZGF0YV9vdmVydmlld19maWVsZHMgPSBtb2RlbF9jb25maWcuZGF0YV9vdmVydmlld19maWVsZHM7XG4gICQoJyN0cmFpbi1kYXRhLW92ZXJ2aWV3JykuZW1wdHkoKTtcbiAgZm9yIChsZXQgZmllbGQgb2YgZGF0YV9vdmVydmlld19maWVsZHMpIHtcbiAgICBpZiAobW9kZWxfc3RhdGUuaGFzT3duUHJvcGVydHkoZmllbGQpKSB7XG4gICAgICBsZXQgdmFsID0gbW9kZWxfc3RhdGVbZmllbGRdO1xuICAgICAgJCgnI3RyYWluLWRhdGEtb3ZlcnZpZXcnKS5hcHBlbmQoXG4gICAgICAgICc8ZGl2PjxiPicgKyBmaWVsZCArICc6PC9iPiZuYnNwOycgKyB2YWwgKyAnPC9kaXY+Jyk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGRpc3BsYXlfdHJhaW5pbmdfc3RhdHVzX292ZXJ2aWV3KCkge1xuICBsZXQgbW9kZWxfY29uZmlnID0gbW9kZWxfc3RhdGUuY29uZmlnO1xuICBsZXQgdHJhaW5fb3ZlcnZpZXdfZmllbGRzID0gbW9kZWxfY29uZmlnLnRyYWluX292ZXJ2aWV3X2ZpZWxkcztcbiAgJCgnI3RyYWluLXN0YXR1cy1vdmVydmlldycpLmVtcHR5KCk7XG4gIGZvciAobGV0IGZpZWxkIG9mIHRyYWluX292ZXJ2aWV3X2ZpZWxkcykge1xuICAgIGlmIChtb2RlbF9zdGF0ZS5oYXNPd25Qcm9wZXJ0eShmaWVsZCkpIHtcbiAgICAgIGxldCB2YWwgPSBtb2RlbF9zdGF0ZVtmaWVsZF07XG4gICAgICAkKCcjdHJhaW4tc3RhdHVzLW92ZXJ2aWV3JykuYXBwZW5kKFxuICAgICAgICAnPGRpdj48Yj4nICsgZmllbGQgKyAnOjwvYj4mbmJzcDsnICsgdmFsICsgJzwvZGl2PicpO1xuICAgIH1cbiAgfVxufVxuXG4vLyBzZW5kcyBcImlkZW50aWZ5XCIgcmVxdWVzdFxuZnVuY3Rpb24gaWRlbnRpZnlfbW9kZWwoKSB7XG4gIGxldCBjb25maWdfanNvbiA9ICQoJyNjb25maWctdGV4dCcpLnZhbCgpO1xuICBsZXQgY29uZmlnX29iaiA9IG51bGw7XG4gIHRyeSB7XG4gICAgY29uZmlnX29iaiA9IEpTT04ucGFyc2UoY29uZmlnX2pzb24pO1xuICB9IGNhdGNoIChlKSB7XG4gICAgc2hvd0Vycm9yKFwiVGhlIG1vZGVsIGNvbmZpZ3VyYXRpb24gSlNPTiBpcyBub3QgdmFsaWQuXCIpO1xuICAgIHJldHVybjtcbiAgfVxuICBsZXQgcmVxdWVzdCA9IHsgbW9kZWxfdHlwZTogdWlfc3RhdGUubW9kZWwsIG1vZGVsX2NvbmZpZzogY29uZmlnX29iaiB9O1xuICBzZW5kUmVxdWVzdFRvQmFja2VuZCgnaWRlbnRpZnknLCByZXF1ZXN0LCAocmVzcG9uc2U6IGFueSkgPT4ge1xuICAgIG1vZGVsX3N0YXRlID0gPE1vZGVsU3RhdGU+cmVzcG9uc2U7XG4gICAgaGFuZGxlTW9kZWxTdGF0ZSgpO1xuICB9KTtcbn1cblxuLy8gc2VuZHMgXCJpbml0X21vZGVsXCIgcmVxdWVzdFxuZnVuY3Rpb24gaW5pdF9tb2RlbCgpIHtcbiAgc2VuZFJlcXVlc3RUb0JhY2tlbmQoJ2luaXRfbW9kZWwnLCB7fSwgKHJlc3BvbnNlOiBhbnkpID0+IHtcbiAgICBtb2RlbF9zdGF0ZSA9IDxNb2RlbFN0YXRlPnJlc3BvbnNlO1xuICAgIGhhbmRsZU1vZGVsU3RhdGUoKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVVJU3RhdHVzKHN0YXR1czogc3RyaW5nKTogdm9pZCB7XG4gICQoXCIjdHJhaW5pbmctc3RhdHVzXCIpLmh0bWwoc3RhdHVzKTtcbn1cblxuLy8gVXBkYXRlIGFuZCB2YWxpZGF0ZSBxdWVyeV9pblxuZnVuY3Rpb24gdXBkYXRlUXVlcnlJbihldmVudCwgdWkpOiB2b2lkIHtcbiAgaWYgKHVpLmR1cmluZ0luaXRpYWxpemF0aW9uKSByZXR1cm47XG4gIHVpX3N0YXRlLnF1ZXJ5X2luID0gJCgnI3F1ZXJ5LWluLXRhZ3MnKS50YWdpdCgnYXNzaWduZWRUYWdzJyk7XG4gIHNlbmRSZXF1ZXN0VG9CYWNrZW5kKCd2YWxpZGF0ZV9xdWVyeV9pbicsIHtxdWVyeV9pbjogdWlfc3RhdGUucXVlcnlfaW59LFxuICAgIChyZXNwb25zZSkgPT4ge1xuICAgICAgbGV0IGlzX3ZhbGlkID0gcmVzcG9uc2VbJ2lzX3ZhbGlkJ107XG4gICAgICB1aV9zdGF0ZV9oaWRkZW4uaXNfcXVlcnlpbl92YWxpZCA9IGlzX3ZhbGlkO1xuICAgICAgaWYgKCFpc192YWxpZCkge1xuICAgICAgICBsZXQgbWVzc2FnZSA9IHJlc3BvbnNlWydtZXNzYWdlJ107XG4gICAgICAgICQoJyNxdWVyeS1pbi1lcnJvci1tZXNzYWdlJykuaHRtbChtZXNzYWdlKS5zaG93KCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAkKCcjcXVlcnktaW4tZXJyb3ItbWVzc2FnZScpLmhpZGUoKTtcbiAgICAgICAgdWlfc3RhdGVfaGlkZGVuLnNraXBfcmVzZXRfb25faGFzaGNoYW5nZSA9IHRydWU7XG4gICAgICAgIHVpX3N0YXRlLnNlcmlhbGl6ZSgpO1xuICAgICAgICB1cGRhdGVRdWVyeU91dFJlc3VsdCgpO1xuICAgICAgfVxuICAgIH1cbiAgKTtcbn1cblxuZnVuY3Rpb24gc2VhcmNoUXVlcnlPdXQocXVlcnk6IHN0cmluZyk6IHZvaWQge1xuICAkKCcjcXVlcnktb3V0LWVycm9yLW1lc3NhZ2UnKS5oaWRlKCk7XG4gIGlmIChxdWVyeS5sZW5ndGggPT0gMCkgcmV0dXJuO1xuICBzZW5kUmVxdWVzdFRvQmFja2VuZCgndmFsaWRhdGVfcXVlcnlfb3V0Jywge3F1ZXJ5X291dDogcXVlcnl9LFxuICAgIHJlc3BvbnNlID0+IHtcbiAgICAgIGxldCBpc192YWxpZCA9IHJlc3BvbnNlWydpc192YWxpZCddO1xuICAgICAgaWYgKCFpc192YWxpZCkge1xuICAgICAgICBsZXQgbWVzc2FnZSA9IHJlc3BvbnNlWydtZXNzYWdlJ107XG4gICAgICAgICQoJyNxdWVyeS1vdXQtZXJyb3ItbWVzc2FnZScpLmh0bWwobWVzc2FnZSkuc2hvdygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGV0IGFscmVhZHlfc2hvd24gPSBmYWxzZTtcbiAgICAgICAgZm9yIChsZXQgcmVjb3JkIG9mIG1vZGVsX3N0YXRlLnF1ZXJ5X291dF9yZWNvcmRzKSB7XG4gICAgICAgICAgaWYgKHJlY29yZC5xdWVyeSAhPSBxdWVyeSkgY29udGludWU7XG4gICAgICAgICAgaWYgKHJlY29yZC5zdGF0dXMgPT0gJ0lHTk9SRUQnIHx8IHJlY29yZC5zdGF0dXMgPT0gJ05PUk1BTCcpIHtcbiAgICAgICAgICAgIHJlY29yZC5zdGF0dXMgPSAnV0FUQ0hFRCc7XG4gICAgICAgICAgICBhbHJlYWR5X3Nob3duID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYWxyZWFkeV9zaG93bikge1xuICAgICAgICAgIHVwZGF0ZVVJU3RhdGVRdWVyeU91dCgpOyAgLy8gdXBkYXRlIHRoZSBVUkxcbiAgICAgICAgICB1cGRhdGVRdWVyeU91dFNWRygpOyAgLy8gdXBkYXRlIFNWRy5cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBtb2RlbF9zdGF0ZS5xdWVyeV9vdXRfcmVjb3Jkcy5wdXNoKHtcbiAgICAgICAgICAgIHF1ZXJ5OiBxdWVyeSwgc3RhdHVzOiAnV0FUQ0hFRCcsXG4gICAgICAgICAgICByYW5rOiAtMSwgcmFua19oaXN0b3J5OltdfSk7XG4gICAgICAgICAgdXBkYXRlVUlTdGF0ZVF1ZXJ5T3V0KCk7ICAvLyB1cGRhdGUgdGhlIFVSTFxuICAgICAgICAgIHVwZGF0ZVF1ZXJ5T3V0UmVzdWx0KCk7ICAvLyBnb2VzIHRvIG1vZGVsIGFuZCBpbnRlcm5hbGx5IGNhbGxzIFNWRyB1cGRhdGUuXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICk7XG59XG5cbi8vIFRoZSBmcm9udGVuZCB1c2VzIG1vZGVsX3N0YXRlLnF1ZXJ5X291dF9yZWNvcmRzIHRvIGtlZXAgdHJhY2sgb2Ygc3RhdHVzIGZvclxuLy8gY29udmVuaWVuY2UuIEJ1dCB0aGF0IGluZm9ybWF0aW9uIGNhbm5vdCBiZSB1c2VkIHRvIGNvbW11bmljYXRlIHdpdGggYmFja2VuZC5cbi8vIFRoaXMgZnVuY3Rpb24gY29udmVydHMgdGhlIHF1ZXJ5IGFuZCBzdGF0dXMgaW5mb3JtYXRpb24gc3RvcmVkIGluXG4vLyBtb2RlbF9zdGF0ZS5xdWVyeV9vdXRfcmVjb3JkcyBpbnRvIHVpX3N0YXRlLnF1ZXJ5X291dCwgd2hpY2ggY2FuIGJlIGJlIHNlbnRcbi8vIHRvIHRoZSBiYWNrZW5kIHZpYSByZXF1ZXN0LlxuZnVuY3Rpb24gdXBkYXRlVUlTdGF0ZVF1ZXJ5T3V0KCk6IHZvaWQge1xuICBsZXQgcXVlcnlfb3V0OiBzdHJpbmdbXSA9IFtdO1xuICBmb3IgKGxldCByZWNvcmQgb2YgbW9kZWxfc3RhdGUucXVlcnlfb3V0X3JlY29yZHMpIHtcbiAgICBsZXQgcHJlZml4ID0gcmVjb3JkLnN0YXR1c1swXTtcbiAgICBpZiAocHJlZml4ID09ICdOJykgY29udGludWU7XG4gICAgbGV0IHF1ZXJ5ID0gcmVjb3JkLnF1ZXJ5O1xuICAgIHF1ZXJ5X291dC5wdXNoKGAke3ByZWZpeH1fJHtxdWVyeX1gKTtcbiAgfVxuICB1aV9zdGF0ZS5xdWVyeV9vdXQgPSBxdWVyeV9vdXQ7XG4gIHVpX3N0YXRlX2hpZGRlbi5za2lwX3Jlc2V0X29uX2hhc2hjaGFuZ2UgPSB0cnVlO1xuICB1aV9zdGF0ZS5zZXJpYWxpemUoKTtcbn1cblxuLy8gU2VuZHMgcmVxdWVzdCB0byBiYWNrZW5kLlxuZnVuY3Rpb24gdXBkYXRlUXVlcnlPdXRSZXN1bHQoKTogdm9pZCB7XG4gIHNlbmRSZXF1ZXN0VG9CYWNrZW5kKCd1cGRhdGVfcXVlcnlfb3V0X3Jlc3VsdCcsXG4gICAge1xuICAgICAgcXVlcnlfaW46IHVpX3N0YXRlLnF1ZXJ5X2luLFxuICAgICAgcXVlcnlfb3V0OiB1aV9zdGF0ZS5xdWVyeV9vdXQsXG4gICAgICBzdGF0dXM6IG1vZGVsX3N0YXRlLnN0YXR1cyAgLy8gZm9yIGNvbnNpc3RlbmN5XG4gICAgfSxcbiAgICAocmVzcG9uc2U6e30pID0+IHtcbiAgICAgIG1vZGVsX3N0YXRlID0gPE1vZGVsU3RhdGU+cmVzcG9uc2U7XG4gICAgICBoYW5kbGVNb2RlbFN0YXRlKCk7XG4gICAgfSk7XG59XG5cbmNvbnN0IHF1ZXJ5X291dF9zdmdfd2lkdGggPSAxMDA7ICAvLyB2aWV3IGJveCwgbm90IHBoeXNpY2FsXG5jb25zdCBxdWVyeV9vdXRfc3ZnX2hlaWdodCA9IDEwMDsgIC8vIHZpZXcgYm94LCBub3QgcGh5c2ljYWxcblxuLy8gRmlyc3QtdGltZSBpbnRpYWxpemluZyBxdWVyeSBjb2x1bW4uXG5mdW5jdGlvbiBzZXR1cFF1ZXJ5Q29sdW1uKG1vZGVsX2NvbmZpZzogTW9kZWxDb25maWcpOiB2b2lkIHtcbiAgLy8gJCgnLmNvbHVtbi5xdWVyeScpLnNob3coKTtcblxuICAvLyBEZWZhdWx0IHF1ZXJpZXNcbiAgaWYgKHVpX3N0YXRlLnF1ZXJ5X2luLmxlbmd0aCA9PSAwKSB7XG4gICAgdWlfc3RhdGUucXVlcnlfaW4gPSBtb2RlbF9jb25maWcuZGVmYXVsdF9xdWVyeV9pbjtcbiAgfVxuICBpZiAodWlfc3RhdGUucXVlcnlfb3V0Lmxlbmd0aCA9PSAwKSB7XG4gICAgdWlfc3RhdGUucXVlcnlfb3V0ID0gbW9kZWxfY29uZmlnLmRlZmF1bHRfcXVlcnlfb3V0O1xuICB9XG4gIHVpX3N0YXRlX2hpZGRlbi5za2lwX3Jlc2V0X29uX2hhc2hjaGFuZ2UgPSB0cnVlO1xuICB1aV9zdGF0ZS5zZXJpYWxpemUoKTtcblxuICAvLyBTZXQgdXAgcXVlcnktaW4gdmlld2VyXG4gICQoJyNxdWVyeS1pbi1jb250YWluZXInKVxuICAgIC5lbXB0eSgpXG4gICAgLmFwcGVuZCgnPHVsIGlkPVwicXVlcnktaW4tdGFnc1wiPjwvdWw+Jyk7XG5cbiAgZm9yIChsZXQgcXVlcnkgb2YgdWlfc3RhdGUucXVlcnlfaW4pIHtcbiAgICAkKFwiI3F1ZXJ5LWluLXRhZ3NcIikuYXBwZW5kKCc8bGk+JyArIHF1ZXJ5ICsgJzwvbGk+Jyk7XG4gIH1cblxuICAkKCcjcXVlcnktaW4tdGFncycpLnRhZ2l0KHtcbiAgICBhdXRvY29tcGxldGU6IHtcbiAgICAgIHNvdXJjZTogKHJlcXVlc3Q6IHt9LCByZXNwb25zZTogYW55KSA9PiB7XG4gICAgICAgIHNlbmRSZXF1ZXN0VG9CYWNrZW5kKCdhdXRvY29tcGxldGUnLCByZXF1ZXN0LCBmdW5jdGlvbiAoZGF0YToge30pIHtcbiAgICAgICAgICBpZiAoZGF0YSAmJiBkYXRhLmhhc093blByb3BlcnR5KCdpdGVtcycpKSB7XG4gICAgICAgICAgICByZXNwb25zZShkYXRhWydpdGVtcyddKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzcG9uc2UoW10pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgICAgZGVsYXk6IDAsXG4gICAgICBtaW5MZW5ndGg6IDEsXG4gICAgfSxcbiAgICByZW1vdmVDb25maXJtYXRpb246IHRydWUsXG4gICAgYWxsb3dEdXBsaWNhdGVzOiB0cnVlLFxuICAgIHBsYWNlaG9sZGVyVGV4dDogJ1R5cGUgaGVyZScsXG4gICAgYWZ0ZXJUYWdBZGRlZDogdXBkYXRlUXVlcnlJbixcbiAgICBhZnRlclRhZ1JlbW92ZWQ6IHVwZGF0ZVF1ZXJ5SW5cbiAgfSk7XG5cbiAgLy8gU2V0IHVwIHF1ZXJ5LW91dCB2aWV3ZXJcbiAgZDMuc2VsZWN0KCcjcXVlcnktb3V0LWNvbnRhaW5lciA+IConKS5yZW1vdmUoKTtcbiAgbGV0IHN2ZyA9IGQzLnNlbGVjdCgnI3F1ZXJ5LW91dC1jb250YWluZXInKVxuICAgIC5hcHBlbmQoJ2RpdicpXG4gICAgLmNsYXNzZWQoJ3F1ZXJ5LW91dCcsIHRydWUpXG4gICAgLmFwcGVuZCgnc3ZnJylcbiAgICAuYXR0cignd2lkdGgnLCAnMTAwJScpXG4gICAgLmF0dHIoJ3ZpZXdCb3gnLCAnMCAwICcgKyBxdWVyeV9vdXRfc3ZnX3dpZHRoICsgJyAnICsgcXVlcnlfb3V0X3N2Z19oZWlnaHQpXG4gICAgLmF0dHIoJ3ByZXNlcnZlQXNwZWN0UmF0aW8nLCBcInhNaW5ZTWluXCIpO1xuXG4gIHVpX3N0YXRlX2hpZGRlbi5xb19zdmcgPSBzdmc7XG5cbiAgLy8gQWRkaW5nIGEgY29sb3JlZCBiYWNrZ3JvdW5kIGZvciBkZWJ1Z2dpbmdcbiAgLy8gc3ZnLmFwcGVuZCgncmVjdCcpXG4gIC8vICAgLmF0dHIoJ3dpZHRoJywgJzEwMCUnKVxuICAvLyAgIC5hdHRyKCdoZWlnaHQnLCAnMTAwJScpXG4gIC8vICAgLmF0dHIoJ2ZpbGwnLCAnI0U4RThFRScpO1xuXG4gIC8vIERyYXcgbGVmdCBpbmRleCBiYXJcbiAgc3ZnLmFwcGVuZCgncmVjdCcpXG4gICAgLmF0dHIoJ3gnLCAxKVxuICAgIC5hdHRyKCd5JywgMClcbiAgICAuYXR0cignd2lkdGgnLCAzKVxuICAgIC5hdHRyKCdoZWlnaHQnLCBxdWVyeV9vdXRfc3ZnX2hlaWdodClcbiAgICAuYXR0cignZmlsbCcsICdsaWdodGdyZXknKTtcbn1cblxuXG5mdW5jdGlvbiB1cGRhdGVRdWVyeU91dFNWRygpIHtcbiAgLy8gQ29tcHV0ZSBsYXlvdXRcbiAgY29uc3QgZGVmYXVsdF9pdGVtX2hlaWdodCA9IDY7XG4gIGNvbnN0IGRlZmF1bHRfaXRlbV9wYWQgPSAwLjg7XG4gIGNvbnN0IGRlZmF1bHRfZ2FwID0gNTtcbiAgY29uc3Qgd29yZF9ib3hfd2lkdGggPSAzNTtcbiAgY29uc3QgbGluZWNoYXJ0X3dpZHRoID0gMzA7XG5cbiAgaWYgKCEgbW9kZWxfc3RhdGUucXVlcnlfb3V0X3JlY29yZHMpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJtb2RlbF9zdGF0ZS5xdWVyeV9vdXRfcmVjb3JkcyBpcyBub3QgcG9wdWxhdGVkLlwiKTtcbiAgfVxuICBsZXQgcXVlcnlfb3V0X3JlY29yZHMgPSBtb2RlbF9zdGF0ZS5xdWVyeV9vdXRfcmVjb3JkcztcbiAgcXVlcnlfb3V0X3JlY29yZHMgPSBxdWVyeV9vdXRfcmVjb3Jkcy5maWx0ZXIoZCA9PiBkLnN0YXR1cyAhPSAnSUdOT1JFRCcpO1xuXG4gIGlmIChtb2RlbF9zdGF0ZS5udW1fcG9zc2libGVfb3V0cHV0cyA8PSAwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwibW9kZWxfc3RhdGUubnVtX3Bvc3NpYmxlX291dHB1dHMgbXVzdCBiZSBwb3NpdGl2ZVwiKTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgbW9kZWxfc3RhdGUuaW5zdGFuY2VzID09IHVuZGVmaW5lZCkge1xuICAgIHRocm93IG5ldyBFcnJvcignbW9kZWxfc3RhdGUuaXRlcmF0aW9ucyBtdXN0IGJlIHNldC4nKTtcbiAgfVxuXG4gIHF1ZXJ5X291dF9yZWNvcmRzLnNvcnQoKGEsIGIpID0+IHtcbiAgICByZXR1cm4gYS5yYW5rIC0gYi5yYW5rO1xuICB9KTtcbiAgbGV0IHkgPSAwO1xuICBsZXQgbGFzdF9yYW5rID0gLTE7XG4gIGZvciAobGV0IHEgb2YgcXVlcnlfb3V0X3JlY29yZHMpIHtcbiAgICBxWyd5J10gPSAocS5yYW5rID09IGxhc3RfcmFuayArIDEpID8geSA6IHkgKyBkZWZhdWx0X2dhcDtcbiAgICB5ID0gcVsneSddICsgZGVmYXVsdF9pdGVtX2hlaWdodCArIGRlZmF1bHRfaXRlbV9wYWQ7XG4gICAgbGFzdF9yYW5rID0gcS5yYW5rO1xuXG4gICAgcVsneV9pZHhiYXInXSA9IHF1ZXJ5X291dF9zdmdfaGVpZ2h0ICogcS5yYW5rIC8gbW9kZWxfc3RhdGUubnVtX3Bvc3NpYmxlX291dHB1dHM7XG5cbiAgfVxuXG4gIGxldCBpdGVtX2hlaWdodCA9IGRlZmF1bHRfaXRlbV9oZWlnaHQ7XG4gIGlmICh5ID4gcXVlcnlfb3V0X3N2Z19oZWlnaHQpIHtcbiAgICBsZXQgc2hyaW5rX2ZhY3RvciA9IHF1ZXJ5X291dF9zdmdfaGVpZ2h0IC8geTtcbiAgICBpdGVtX2hlaWdodCAqPSBzaHJpbmtfZmFjdG9yO1xuICAgIGZvciAobGV0IHEgb2YgcXVlcnlfb3V0X3JlY29yZHMpIHtcbiAgICAgIHFbJ3knXSAqPSBzaHJpbmtfZmFjdG9yO1xuICAgIH1cbiAgfVxuXG4gIC8vIFByZXByb2Nlc3MgbGluZWNoYXJ0IGRhdGFcbiAgbGV0IGxpbmVjaGFydF9tYXhZID0gMDtcbiAgZm9yIChsZXQgcSBvZiBxdWVyeV9vdXRfcmVjb3Jkcykge1xuICAgIGxldCBtYXggPSBNYXRoLm1heC5hcHBseShudWxsLCAkLm1hcChxLnJhbmtfaGlzdG9yeSwgeD0+eC5yYW5rKSk7XG4gICAgbGluZWNoYXJ0X21heFkgPSBNYXRoLm1heChsaW5lY2hhcnRfbWF4WSwgbWF4KTtcbiAgfVxuICBsZXQgbGluZWNoYXJ0X3hTY2FsZSA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgLmRvbWFpbihbMCwgbW9kZWxfc3RhdGUuaW5zdGFuY2VzXSlcbiAgICAucmFuZ2UoW2xpbmVjaGFydF93aWR0aCowLjAyNSwgbGluZWNoYXJ0X3dpZHRoKjAuOTc1XSk7XG4gIGxldCBsaW5lY2hhcnRfeVNjYWxlID0gZDMuc2NhbGUubGluZWFyKClcbiAgICAuZG9tYWluKFswLCBsaW5lY2hhcnRfbWF4WV0pXG4gICAgLnJhbmdlKFtpdGVtX2hlaWdodCowLjAyNSwgaXRlbV9oZWlnaHQqMC45NzVdKTtcblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIERyYXcgcXVlcnktb3V0IGl0ZW1zLlxuICAvLyBTZWUgZW50ZXItdXBkYXRlLWV4aXQgcGF0dGVybjogaHR0cHM6Ly9ibC5vY2tzLm9yZy9tYm9zdG9jay8zODA4MjE4XG4gIC8vIFVQREFURTogTm90IHVzaW5nIHRoZSBlbnRlci11cGRhdGUtZXhpdCBwYXR0ZXJuLiBKdXN0IHJlZHJhd2luZyBldmVyeXRoaW5nXG4gIC8vIHBlciBlYWNoIHVwZGF0ZS5cbiAgbGV0IHN2ZyA9IHVpX3N0YXRlX2hpZGRlbi5xb19zdmc7XG4gIHN2Zy5zZWxlY3RBbGwoJ2cnKS5yZW1vdmUoKTtcbiAgbGV0IHJlY29yZF9vYmpzID0gc3ZnLnNlbGVjdEFsbCgnZycpXG4gICAgLmRhdGEocXVlcnlfb3V0X3JlY29yZHMsIGQ9PmQucXVlcnkpXG4gICAgLmVudGVyKClcbiAgICAuYXBwZW5kKCdnJylcbiAgICAuYXR0cignY2xhc3MnLCBkID0+IGBxby1pdGVtICR7ZC5zdGF0dXN9YCk7XG5cbiAgLy8gRHJhdyBtYXJrZXIgb24gaW5kZXggYmFyXG4gIHJlY29yZF9vYmpzLmFwcGVuZCgncmVjdCcpXG4gICAgLmF0dHIoJ3gnLCAwKVxuICAgIC5hdHRyKCd5JywgKGQpPT57cmV0dXJuIGRbJ3lfaWR4YmFyJ119KVxuICAgIC5hdHRyKCd3aWR0aCcsIDUpXG4gICAgLmF0dHIoJ2hlaWdodCcsIDEpXG4gICAgLmNsYXNzZWQoJ3FvLWlkeGJhci1tYXJrZXInLCB0cnVlKTtcblxuICAvLyBEcmF3IGxpbmVzIGJldHdlZW4gaW5kZXggYmFyIGFuZCBpdGVtc1xuICByZWNvcmRfb2Jqcy5hcHBlbmQoJ3BhdGgnKVxuICAgIC5hdHRyKCdkJywgKGQpID0+IHtcbiAgICAgIHJldHVybiAnTSA1ICcgKyBkWyd5X2lkeGJhciddXG4gICAgICAgICsgJyBDIDcuNSAnICsgZFsneV9pZHhiYXInXVxuICAgICAgICArICcgICA3LjUgJyArIGRbJ3knXVxuICAgICAgICArICcgICAxMCAgJyArIGRbJ3knXVxuICAgICAgICArICcgTCAxMCAgJyArIChkWyd5J10gKyBpdGVtX2hlaWdodClcbiAgICAgICAgKyAnIEMgNy41ICcgKyAoZFsneSddICsgaXRlbV9oZWlnaHQpXG4gICAgICAgICsgJyAgIDcuNSAnICsgKGRbJ3lfaWR4YmFyJ10gKyAxKVxuICAgICAgICArICcgICA1ICAgJyArIChkWyd5X2lkeGJhciddICsgMSk7XG4gICAgfSlcbiAgICAuY2xhc3NlZCgncW8taWR4YmFyLWNvbm5lY3RvcicsIHRydWUpO1xuXG4gIC8vIERyYXcgcmFuayBib3hlcy5cbiAgbGV0IHJhbmtfYm94ZXMgPSByZWNvcmRfb2Jqcy5hcHBlbmQoJ2cnKVxuICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCAoZCkgPT4ge1xuICAgICAgcmV0dXJuICd0cmFuc2xhdGUoMTAsJytkWyd5J10rJyknO1xuICAgIH0pO1xuICByYW5rX2JveGVzLmFwcGVuZCgncmVjdCcpXG4gICAgLmF0dHIoJ3dpZHRoJywgJzEwJylcbiAgICAuYXR0cignaGVpZ2h0JywgaXRlbV9oZWlnaHQpXG4gICAgLmNsYXNzZWQoJ3FvLWJveCcsIHRydWUpXG4gICAgLmNsYXNzZWQoJ3FvLXJhbmstYm94JywgdHJ1ZSk7XG5cbiAgcmFua19ib3hlcy5hcHBlbmQoJ3RleHQnKVxuICAgIC50ZXh0KChkKSA9PiB7cmV0dXJuICcjJyArIChkLnJhbmsgKyAxKX0pXG4gICAgLnN0eWxlKCdmb250LXNpemUnLCBmdW5jdGlvbiAoZCkge1xuICAgICAgLy8gTXVzdCBub3QgdXNlIGZhdC1hcnJvdyBmdW5jdGlvbnMgaGVyZSwgb3RoZXJ3aXNlIHRoZSBcInRoaXNcIiBiZWxvd1xuICAgICAgLy8gd2lsbCBub3QgYmUgY29ycmVjdGx5IGNhcHR1cmVkLlxuICAgICAgcmV0dXJuIE1hdGgubWluKDQsIDEwIC8gdGhpcy5nZXRDb21wdXRlZFRleHRMZW5ndGgoKSAqIDEwKSArICdweCc7XG4gICAgfSlcbiAgICAuYXR0cigndGV4dC1hbmNob3InLCAnbWlkZGxlJylcbiAgICAuYXR0cignYWxpZ25tZW50LWJhc2VsaW5lJywgJ2NlbnRyYWwnKVxuICAgIC5hdHRyKCdkeCcsICc1cHgnKVxuICAgIC5hdHRyKCdkeScsIChpdGVtX2hlaWdodC8yKSArICdweCcpO1xuXG4gIC8vIERyYXcgd29yZCBib3hlcy5cbiAgbGV0IHdvcmRfYm94ZXMgPSByZWNvcmRfb2Jqcy5hcHBlbmQoJ2cnKVxuICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCAoZCkgPT4ge1xuICAgICAgcmV0dXJuICd0cmFuc2xhdGUoMjAsJytkWyd5J10rJyknO1xuICAgIH0pO1xuICB3b3JkX2JveGVzLmFwcGVuZCgncmVjdCcpXG4gICAgLmF0dHIoJ3dpZHRoJywgd29yZF9ib3hfd2lkdGgpXG4gICAgLmF0dHIoJ2hlaWdodCcsIGl0ZW1faGVpZ2h0KVxuICAgIC5jbGFzc2VkKCdxby1ib3gnLCB0cnVlKVxuICAgIC5jbGFzc2VkKCdxby13b3JkLWJveCcsIHRydWUpO1xuXG4gIHdvcmRfYm94ZXMuYXBwZW5kKCd0ZXh0JylcbiAgICAudGV4dCgoZCkgPT4ge3JldHVybiBkLnF1ZXJ5fSlcbiAgICAuc3R5bGUoJ2ZvbnQtc2l6ZScsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAvLyBNdXN0IG5vdCB1c2UgZmF0LWFycm93IGZ1bmN0aW9ucyBoZXJlLCBvdGhlcndpc2UgdGhlIFwidGhpc1wiIGJlbG93XG4gICAgICAvLyB3aWxsIG5vdCBiZSBjb3JyZWN0bHkgY2FwdHVyZWQuXG4gICAgICByZXR1cm4gTWF0aC5taW4oMywgNTUgLyB0aGlzLmdldENvbXB1dGVkVGV4dExlbmd0aCgpICogNSkgKyAncHgnO1xuICAgIH0pXG4gICAgLmF0dHIoJ3RleHQtYW5jaG9yJywgJ21pZGRsZScpXG4gICAgLmF0dHIoJ2FsaWdubWVudC1iYXNlbGluZScsICdjZW50cmFsJylcbiAgICAuYXR0cignZHgnLCB3b3JkX2JveF93aWR0aCAvIDIpXG4gICAgLmF0dHIoJ2R5JywgKGl0ZW1faGVpZ2h0LzIpICsgJ3B4Jyk7XG5cbiAgLy8gRHJhdyByYW5rIGhpc3RvcmllcyBsaW5lLWNoYXJ0cy5cbiAgbGV0IGxpbmVjaGFydHMgPSByZWNvcmRfb2Jqcy5hcHBlbmQoJ2cnKVxuICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCAoZCkgPT4gYHRyYW5zbGF0ZSg1NSwgJHtkWyd5J119KWApO1xuXG4gIGxpbmVjaGFydHMuYXBwZW5kKCdyZWN0JylcbiAgICAuYXR0cignd2lkdGgnLCBsaW5lY2hhcnRfd2lkdGgpXG4gICAgLmF0dHIoJ2hlaWdodCcsIGl0ZW1faGVpZ2h0KVxuICAgIC5jbGFzc2VkKCdxby1ib3gnLCB0cnVlKVxuICAgIC5jbGFzc2VkKCdxby1saW5lY2hhcnQtYm94JywgdHJ1ZSk7XG5cbiAgbGluZWNoYXJ0cy5hcHBlbmQoJ3BhdGgnKVxuICAgIC5jbGFzc2VkKCdxby1saW5lY2hhcnQnLCB0cnVlKVxuICAgIC5kYXR1bShkID0+IGQucmFua19oaXN0b3J5KVxuICAgIC5hdHRyKCdkJywgZDMuc3ZnLmxpbmU8e3Jhbms6bnVtYmVyLGl0ZXJhdGlvbjpudW1iZXJ9PigpXG4gICAgICAueChkID0+IGxpbmVjaGFydF94U2NhbGUoZC5pdGVyYXRpb24pKVxuICAgICAgLnkoZCA9PiBsaW5lY2hhcnRfeVNjYWxlKGQucmFuaykpKTtcblxuICAvLyBEcmF3IGNvbnRyb2wgaWNvbnNcbiAgY29uc3QgY29udHJvbF9pY29uX2RhdGEgPSBbXG4gICAgeyduYW1lJzogJ3RodW1iX3VwJywgJ3N2Zyc6IGljb25zLnRodW1iX3VwLFxuICAgICAncm90YXRlJzogMCwgJ3RyYW5zbGF0ZSc6ICcxLDEnLFxuICAgICAndGl0bGUnOiAnbGFiZWwvdW5sYWJlbCBhcyBnb29kIG91dHB1dCd9LFxuICAgIHsnbmFtZSc6ICd0aHVtYl9kb3duJywgJ3N2Zyc6IGljb25zLnRodW1iX3VwLFxuICAgICAncm90YXRlJzogMTgwLCAndHJhbnNsYXRlJzogJy04Ljc1LC01JyxcbiAgICAgJ3RpdGxlJzogJ2xhYmVsL3VubGFiZWwgYXMgYmFkIG91dHB1dCd9LFxuICAgIHsnbmFtZSc6ICd3YXN0ZV9iYXNja2V0JywgJ3N2Zyc6IGljb25zLndhc3RlX2Jhc2NrZXQsXG4gICAgICdyb3RhdGUnOiAwLCAndHJhbnNsYXRlJzogJzEwLDEnLFxuICAgICAndGl0bGUnOiAnaWdub3JlIHRoaXMgb3V0cHV0J30sXG4gIF1cbiAgbGV0IGNvbnRyb2xfaWNvbnMgPSByZWNvcmRfb2Jqcy5hcHBlbmQoJ2cnKVxuICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCBkPT5gdHJhbnNsYXRlKDg1LCAke2RbJ3knXX0pYClcbiAgICAuc2VsZWN0QWxsKCdnJylcbiAgICAuZGF0YShjb250cm9sX2ljb25fZGF0YSlcbiAgICAuZW50ZXIoKVxuICAgIC5hcHBlbmQoJ2cnKVxuICAgIC5odG1sKGQ9PmQuc3ZnKVxuICAgIC5hdHRyKCdjbGFzcycsIGQ9PmBxby1jb250cm9sLWljb24gJHtkLm5hbWV9YClcbiAgICAuYXR0cigndHJhbnNmb3JtJywgZD0+YHJvdGF0ZSgke2Qucm90YXRlfSkgdHJhbnNsYXRlKCR7ZC50cmFuc2xhdGV9KSBzY2FsZSgwLjAzNSlgKVxuICAgIC5hdHRyKCd0aXRsZScsIGQ9PmQudGl0bGUpXG4gICAgLm9uKCdjbGljaycsIGZ1bmN0aW9uKGQpIHtcbiAgICAgIGxldCByZWNvcmQgPSA8UXVlcnlPdXRSZWNvcmQ+ZDMuc2VsZWN0KHRoaXMucGFyZW50Tm9kZS5wYXJlbnROb2RlKS5kYXR1bSgpO1xuICAgICAgaWYgKChyZWNvcmQuc3RhdHVzID09ICdHT09EJyAmJiBkLm5hbWUgPT0gJ3RodW1iX3VwJyApXG4gICAgICAgICAgfHwgKHJlY29yZC5zdGF0dXMgPT0gJ0JBRCcgJiYgZC5uYW1lID09ICd0aHVtYl9kb3duJykpIHtcbiAgICAgICAgcmVjb3JkLnN0YXR1cyA9ICdOT1JNQUwnO1xuICAgICAgfSBlbHNlIGlmIChkLm5hbWUgPT0gJ3RodW1iX3VwJykge1xuICAgICAgICByZWNvcmQuc3RhdHVzID0gJ0dPT0QnO1xuICAgICAgfSBlbHNlIGlmIChkLm5hbWUgPT0gJ3RodW1iX2Rvd24nKSB7XG4gICAgICAgIHJlY29yZC5zdGF0dXMgPSAnQkFEJztcbiAgICAgIH0gZWxzZSBpZiAoZC5uYW1lID09ICd3YXN0ZV9iYXNja2V0Jykge1xuICAgICAgICByZWNvcmQuc3RhdHVzID0gJ0lHTk9SRUQnO1xuICAgICAgfVxuICAgICAgdXBkYXRlVUlTdGF0ZVF1ZXJ5T3V0KCk7XG4gICAgICB1cGRhdGVRdWVyeU91dFNWRygpO1xuICAgIH0pO1xuXG4gIGxldCBzZWxlY3Rpb246IGFueSA9ICQoXCIucW8tY29udHJvbC1pY29uXCIpOyAgLy8gb3ZlcnJpZGVzIHR5cGVzY3JpcHQgY2hlY2tpbmcuXG4gIHNlbGVjdGlvbi50b29sdGlwKHtcbiAgICAnY29udGFpbmVyJzogJ2JvZHknLFxuICAgICdwbGFjZW1lbnQnOiAnYm90dG9tJyxcbiAgICAnZGVsYXknOiAzMDBcbiAgfSk7XG4gICQoJy50b29sdGlwJykucmVtb3ZlKCk7XG5cbiAgcmVjb3JkX29ianMub24oJ2NsaWNrJywgZCA9PiB7XG4gICAgc2VuZFJlcXVlc3RUb0JhY2tlbmQoJ3BhaXJfcHJvZmlsZScsIHtxdWVyeTogZC5xdWVyeX0sIGRpc3BsYXlfcGFpcl9wcm9maWxlKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGJhdGNoX3RyYWluKGl0ZXJhdGlvbnM6IG51bWJlciwgd2F0Y2hlZDogYm9vbGVhbik6IHZvaWQge1xuICB1aV9zdGF0ZV9oaWRkZW4uaXNfbW9kZWxfYnVzeV90cmFpbmluZyA9IHRydWU7XG4gIHVpX3N0YXRlX2hpZGRlbi5pc190b19wYXVzZV90cmFpbmluZyA9IGZhbHNlO1xuICBzZW5kUmVxdWVzdFRvQmFja2VuZCgndHJhaW4nLFxuICAgIHtpdGVyYXRpb25zOiBpdGVyYXRpb25zLCB3YXRjaGVkOiB3YXRjaGVkfSxcbiAgICBoYW5kbGVNb2RlbFN0YXRlXG4gICk7XG59XG5cbmZ1bmN0aW9uIHJlc3VtZV90cmFpbmluZygpOiB2b2lkIHtcbiAgaWYgKHVpX3N0YXRlX2hpZGRlbi5pc190b19wYXVzZV90cmFpbmluZykge1xuICAgIHVwZGF0ZVVJU3RhdHVzKCdUcmFpbmluZyBwYXVzZWQuJyk7XG4gICAgbW9kZWxfc3RhdGUuc3RhdHVzID0gJ1VTRVJfQlJFQUsnO1xuICB9IGVsc2Uge1xuICAgIHVpX3N0YXRlX2hpZGRlbi5pc19tb2RlbF9idXN5X3RyYWluaW5nID0gdHJ1ZTtcbiAgICBzZW5kUmVxdWVzdFRvQmFja2VuZCgndHJhaW4tY29udGludWUnLCB7fSwgaGFuZGxlTW9kZWxTdGF0ZSk7XG4gIH1cbn1cblxuLy8gd29yZDJ2ZWMgb25seVxuZnVuY3Rpb24gdXBkYXRlSGlkZGVuSW4oKTogdm9pZCB7XG4gIGxldCBzdmcgPSBkMy5zZWxlY3QoJyNoaWRkZW4taW4tY29udGFpbmVyIHN2Zy5oZWF0bWFwJyk7XG4gIGxldCB3MnZfbW9kZWxfc3RhdGUgPSA8V29yZDJ2ZWNTdGF0ZT5tb2RlbF9zdGF0ZTtcbiAgbGV0IHRib2R5ID0gZDMuc2VsZWN0KCcjaGlkZGVuLWluLWNvbnRhaW5lciB0Ym9keScpO1xuICBsZXQgZGVmYXVsdF9yZWNvcmRzID0gdzJ2X21vZGVsX3N0YXRlLnF1ZXJ5X291dF9yZWNvcmRzO1xuICBsZXQgcGVyX2RpbV9yZWNvcmRzID0gdzJ2X21vZGVsX3N0YXRlLnBlcl9kaW1fbmVpZ2hib3JzO1xuICBkMy5zZWxlY3QoJyNoaWRkZW4taW4tY29udGFpbmVyIC5xdWVyeScpXG4gICAgLmh0bWwoJyZuYnNwOyAtIFwiJyArIHVpX3N0YXRlLnF1ZXJ5X2luLmpvaW4oJ1wiIFwiJykgKyAnXCInKTtcblxuICB1cGRhdGVIZWF0TWFwKHN2ZywgdzJ2X21vZGVsX3N0YXRlLnFpX3ZlYywgZGVmYXVsdF9yZWNvcmRzLCBwZXJfZGltX3JlY29yZHMsIHRib2R5LCBmYWxzZSwgbnVsbCk7XG4gIHVwZGF0ZUluc3BlY3RvclRCb2R5KHRib2R5LCBkZWZhdWx0X3JlY29yZHMsIGZhbHNlLCBudWxsKTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlSGVhdE1hcChzdmc6IGQzLlNlbGVjdGlvbjxhbnk+LCB2ZWN0b3I6IG51bWJlcltdLFxuICAgIGRlZmF1bHRfcmVjb3JkczogUXVlcnlPdXRSZWNvcmRbXSwgcGVyX2RpbV9yZWNvcmRzOiBRdWVyeU91dFJlY29yZFtdW10sXG4gICAgdGJvZHk6IGQzLlNlbGVjdGlvbjxhbnk+LCBpc19wYWlyOiBib29sZWFuLCBxdWVyeV9vdXQ6IHN0cmluZyk6IHZvaWQge1xuICBjb25zdCBobWFwX3N2Z193aWR0aCA9IDEwMDtcbiAgY29uc3QgaG1hcF9zdmdfaGVpZ2h0ID0gMTAwO1xuICBsZXQgbmNvbCA9IE1hdGguZmxvb3IoTWF0aC5zcXJ0KHZlY3Rvci5sZW5ndGgpKTtcbiAgbGV0IG5yb3cgPSBuY29sKm5jb2wgPT0gdmVjdG9yLmxlbmd0aCA/IG5jb2wgOiBuY29sICsgMTtcbiAgbGV0IGNlbGxIZWlnaHQgPSBobWFwX3N2Z19oZWlnaHQgLyBucm93O1xuICBsZXQgY2VsbFdpZHRoID0gaG1hcF9zdmdfd2lkdGggLyBuY29sO1xuICBsZXQgY2VsbEZpbGxIZWlnaHQgPSAwLjk1ICogY2VsbEhlaWdodDtcbiAgbGV0IGNlbGxGaWxsV2lkdGggPSAwLjk1ICogY2VsbFdpZHRoO1xuICBzdmcuc2VsZWN0QWxsKCcqJykucmVtb3ZlKCk7XG4gIHN2Zy5zZWxlY3RBbGwoJ2cuY2VsbCcpXG4gICAgLmRhdGEodmVjdG9yKVxuICAgIC5lbnRlcigpXG4gICAgLmFwcGVuZCgnZycpXG4gICAgLmNsYXNzZWQoJ2NlbGwnLCB0cnVlKVxuICAgIC5hcHBlbmQoJ3JlY3QnKVxuICAgIC5hdHRyKCd4JywgKGQsaSkgPT4gY2VsbFdpZHRoICogKGkgJSBuY29sKSlcbiAgICAuYXR0cigneScsIChkLGkpID0+IGNlbGxIZWlnaHQgKiAoTWF0aC5mbG9vcihpIC8gbmNvbCkpKVxuICAgIC5hdHRyKCd3aWR0aCcsIGNlbGxGaWxsV2lkdGgpXG4gICAgLmF0dHIoJ2hlaWdodCcsIGNlbGxGaWxsSGVpZ2h0KVxuICAgIC5zdHlsZSgnZmlsbCcsIGQgPT4ge3JldHVybiB1dGlsLmV4Y2l0ZVZhbHVlVG9Db2xvcihkKX0pXG4gICAgLm9uKCdtb3VzZW92ZXInLCAoZCxpKT0+e3VwZGF0ZUluc3BlY3RvclRCb2R5KHRib2R5LCBwZXJfZGltX3JlY29yZHNbaV0sIGlzX3BhaXIsIHF1ZXJ5X291dCl9KVxuICAgIC5vbignbW91c2VvdXQnLCAoKT0+e3VwZGF0ZUluc3BlY3RvclRCb2R5KHRib2R5LCBkZWZhdWx0X3JlY29yZHMsIGlzX3BhaXIsIHF1ZXJ5X291dCl9KTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlSW5zcGVjdG9yVEJvZHkoXG4gICAgdGJvZHk6IGQzLlNlbGVjdGlvbjxhbnk+LFxuICAgIHJhbmtlZF9pdGVtczoge3F1ZXJ5OnN0cmluZywgc2NvcmU/Om51bWJlciwgc2NvcmUxPzpudW1iZXIsIHNjb3JlMj86bnVtYmVyfVtdLFxuICAgIGlzX3BhaXI6IGJvb2xlYW4sIHF1ZXJ5X291dDogc3RyaW5nKTogdm9pZCB7XG4gIHRib2R5LnNlbGVjdEFsbCgnKicpLnJlbW92ZSgpO1xuICBsZXQgcm93cyA9IHRib2R5LnNlbGVjdEFsbCgndHInKVxuICAgIC5kYXRhKHJhbmtlZF9pdGVtcy5zbGljZSgwLCA4KSlcbiAgICAuZW50ZXIoKVxuICAgIC5hcHBlbmQoJ3RyJyk7XG5cbiAgcm93cy5hcHBlbmQoJ3RkJykuaHRtbChkPT5kLnF1ZXJ5KTtcbiAgaWYgKGlzX3BhaXIpIHtcbiAgICByb3dzLmFwcGVuZCgndGQnKS5odG1sKGQ9PignJytkLnNjb3JlMSkuc2xpY2UoMCwgNSkpO1xuICAgIHJvd3MuYXBwZW5kKCd0ZCcpLmh0bWwoZD0+KCcnK2Quc2NvcmUyKS5zbGljZSgwLCA1KSk7XG4gICAgaWYgKCFxdWVyeV9vdXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignd2hlbiBpc19wYWlyIGlzIHRydWUsIHF1ZXJ5X291dCBtdXN0IGJlIGFzc2lnbmVkLicpO1xuICAgIH1cbiAgICBsZXQgcXVlcnlfaW4gPSB1aV9zdGF0ZS5xdWVyeV9pblswXTtcbiAgICByb3dzLm9uKCdjbGljaycsIGQ9PntcbiAgICAgIHNlbmRSZXF1ZXN0VG9CYWNrZW5kKCdpbmZsdWVudGlhbF90cmFpbl9pbnN0YW5jZXMnLCB7dzE6IHF1ZXJ5X2luLCB3MjogZC5xdWVyeX0sIHJlc3BvbnNlID0+IHtcbiAgICAgICAgJCgnI2NvbmNvcmRhbmNlLWNvbnRhaW5lcicpLnNob3coKTtcbiAgICAgICAgZDMuc2VsZWN0KCcjY29uY29yZGFuY2UtY29udGFpbmVyIC5xdWVyeScpLmh0bWwoYCZuYnNwOyAtIFwiJHtxdWVyeV9pbn1cIlwiIHZzIFwiJHtkLnF1ZXJ5fVwiYCk7XG4gICAgICAgIGRpc3BsYXlfY29uY29yZGFuY2UoZDMuc2VsZWN0KCcjY29uY29yZGFuY2UtY29udGFpbmVyIHRib2R5JyksIHJlc3BvbnNlKTtcbiAgICAgIH0pO1xuICAgICAgc2VuZFJlcXVlc3RUb0JhY2tlbmQoJ2luZmx1ZW50aWFsX3RyYWluX2luc3RhbmNlcycsIHt3MTogcXVlcnlfb3V0LCB3MjogZC5xdWVyeX0sIHJlc3BvbnNlID0+IHtcbiAgICAgICAgJCgnI2NvbmNvcmRhbmNlLWNvbnRhaW5lci0yJykuc2hvdygpO1xuICAgICAgICBkMy5zZWxlY3QoJyNjb25jb3JkYW5jZS1jb250YWluZXItMiAucXVlcnknKS5odG1sKGAmbmJzcDsgLSBcIiR7cXVlcnlfb3V0fVwiXCIgdnMgXCIke2QucXVlcnl9XCJgKTtcbiAgICAgICAgZGlzcGxheV9jb25jb3JkYW5jZShkMy5zZWxlY3QoJyNjb25jb3JkYW5jZS1jb250YWluZXItMiB0Ym9keScpLCByZXNwb25zZSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICByb3dzLmFwcGVuZCgndGQnKS5odG1sKGQ9PignJytkLnNjb3JlKS5zbGljZSgwLCA1KSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZGlzcGxheV9wYWlyX3Byb2ZpbGUocmVzcG9uc2U6e30pOiB2b2lkIHtcbiAgJCgnI2hpZGRlbi1vdXQtY29udGFpbmVyJykuc2hvdygpO1xuICAkKCcjaGlkZGVuLXByb2R1Y3QtY29udGFpbmVyJykuc2hvdygpO1xuXG4gIGxldCBzdmdfb3V0ID0gZDMuc2VsZWN0KCcjaGlkZGVuLW91dC1jb250YWluZXIgc3ZnLmhlYXRtYXAnKTtcbiAgbGV0IHRib2R5X291dCA9IGQzLnNlbGVjdCgnI2hpZGRlbi1vdXQtY29udGFpbmVyIHRib2R5Jyk7XG4gIGxldCBzdmdfcHJvZCA9IGQzLnNlbGVjdCgnI2hpZGRlbi1wcm9kdWN0LWNvbnRhaW5lciBzdmcuaGVhdG1hcCcpO1xuICBsZXQgdGJvZHlfcHJvZCA9IGQzLnNlbGVjdCgnI2hpZGRlbi1wcm9kdWN0LWNvbnRhaW5lciB0Ym9keScpO1xuXG4gIGxldCB3MnZfbW9kZWxfc3RhdGUgPSA8V29yZDJ2ZWNTdGF0ZT5tb2RlbF9zdGF0ZTtcbiAgbGV0IHBhaXJfcHJvZmlsZSA9IDxQYWlyUHJvZmlsZT5yZXNwb25zZTtcblxuICBsZXQgZGVmYXVsdF9yZWNvcmRzX291dCA9IHBhaXJfcHJvZmlsZS5xb19uZWlnaGJvcnM7XG4gIGxldCBwZXJfZGltX3JlY29yZHNfb3V0ID0gcGFpcl9wcm9maWxlLnFvX3Blcl9kaW1fbmVpZ2hib3JzO1xuICBkMy5zZWxlY3QoJyNoaWRkZW4tb3V0LWNvbnRhaW5lciAucXVlcnknKVxuICAgIC5odG1sKCcmbmJzcDsgLSBcIicgKyBwYWlyX3Byb2ZpbGUucW8gKyAnXCInKTtcbiAgdXBkYXRlSGVhdE1hcChzdmdfb3V0LCBwYWlyX3Byb2ZpbGUucW9fdmVjLCBkZWZhdWx0X3JlY29yZHNfb3V0LCBwZXJfZGltX3JlY29yZHNfb3V0LCB0Ym9keV9vdXQsIGZhbHNlLCBudWxsKTtcbiAgdXBkYXRlSW5zcGVjdG9yVEJvZHkodGJvZHlfb3V0LCBkZWZhdWx0X3JlY29yZHNfb3V0LCBmYWxzZSwgbnVsbCk7XG5cbiAgbGV0IGRlZmF1bHRfcmVjb3Jkc19wcm9kID0gcGFpcl9wcm9maWxlLmVsZW1zdW1fbmVpZ2hib3JzO1xuICBsZXQgcGVyX2RpbV9yZWNvcmRzX3Byb2QgPSBwYWlyX3Byb2ZpbGUuZWxlbXN1bV9wZXJfZGltX25laWdoYm9ycztcbiAgdXBkYXRlSGVhdE1hcChzdmdfcHJvZCwgcGFpcl9wcm9maWxlLmVsZW1wcm9kLCBkZWZhdWx0X3JlY29yZHNfcHJvZCwgcGVyX2RpbV9yZWNvcmRzX3Byb2QsIHRib2R5X3Byb2QsIHRydWUsIHBhaXJfcHJvZmlsZS5xbyk7XG4gIHVwZGF0ZUluc3BlY3RvclRCb2R5KHRib2R5X3Byb2QsIGRlZmF1bHRfcmVjb3Jkc19wcm9kLCB0cnVlLCBwYWlyX3Byb2ZpbGUucW8pO1xufVxuXG5mdW5jdGlvbiBkaXNwbGF5X2NvbmNvcmRhbmNlKHRib2R5OiBkMy5TZWxlY3Rpb248YW55PiwgZGF0YTogVHJhaW5JbnN0YW5jZVN1bW1hcnlbXSk6IHZvaWQge1xuICBsZXQgc3VtbWFyaWVzID0gZGF0YTtcbiAgdGJvZHkuc2VsZWN0QWxsKCcqJykucmVtb3ZlKCk7XG4gIGxldCByb3dzID0gdGJvZHkuc2VsZWN0QWxsKCd0cicpXG4gICAgLmRhdGEoc3VtbWFyaWVzLnNsaWNlKDAsIDgpKVxuICAgIC5lbnRlcigpXG4gICAgLmFwcGVuZCgndHInKTtcbiAgcm93cy5hcHBlbmQoJ3RkJykuaHRtbChkPT4oJycrZC50b3RhbF9tb3ZlbWVudCkuc2xpY2UoMCwgNSkpO1xuICAvLyBBYm91dCBuZXN0ZWQgZDMgZGF0YSBzdHJ1Y3R1cmU6IGh0dHA6Ly9jb2RlLmhhenplbnMuY29tL2QzdHV0L2xlc3Nvbl8zLmh0bWxcbiAgcm93cy5hcHBlbmQoJ3RkJylcbiAgICAuc2VsZWN0QWxsKCdzcGFuJylcbiAgICAuZGF0YShkID0+IHtcbiAgICAgIGxldCB3b3JkcyA9IGQuc2VudGVuY2Uuc3BsaXQoJyAnKTtcbiAgICAgIHJldHVybiB3b3Jkcy5tYXAoKHcsaSk9PntcbiAgICAgICAgbGV0IGNsczogc3RyaW5nO1xuICAgICAgICBpZiAoZC5wb3MgPT0gaSkgY2xzID0gJ3BvczEnO1xuICAgICAgICBlbHNlIGlmIChkLnBvczIgPT0gaSkgY2xzID0gJ3BvczInO1xuICAgICAgICBlbHNlIGNscyA9ICdub3JtYWwnO1xuICAgICAgICBpZiAoaSA+IDApIHcgPSAnICcgKyB3O1xuICAgICAgICByZXR1cm4ge3c6IHcsIGNsczpjbHN9O1xuICAgICAgfSkuZmlsdGVyKCh3LGkpID0+IHtcbiAgICAgICAgbGV0IHdpbmRvdyA9IG1vZGVsX3N0YXRlLmNvbmZpZ1snd2luZG93J107XG4gICAgICAgIGlmIChpIDwgZC5wb3MgLSB3aW5kb3cgLSAyIHx8IGkgPiBkLnBvcyArIHdpbmRvdyArIDIpIHJldHVybiBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9KTtcbiAgICB9KVxuICAgIC5lbnRlcigpXG4gICAgLmFwcGVuZCgnc3BhbicpXG4gICAgLmF0dHIoJ2NsYXNzJywgZD0+ZFsnY2xzJ10pXG4gICAgLnRleHQoZD0+ZFsndyddKTtcblxuICByb3dzLm9uKCdjbGljaycsIGQ9PntcbiAgICAkKCcjaW5zdGFuY2UtaW5zcGVjdG9yLWNvbnRhaW5lcicpLnNob3coKTtcbiAgICBsZXQgc3ZnMSA9IGQzLnNlbGVjdCgnI2luc3RhbmNlLWluc3BlY3Rvci1jb250YWluZXIgc3ZnLmxlZnQnKTtcbiAgICBsZXQgc3ZnMiA9IGQzLnNlbGVjdCgnI2luc3RhbmNlLWluc3BlY3Rvci1jb250YWluZXIgc3ZnLnJpZ2h0Jyk7XG4gICAgZHJhd0JhckNoYXJ0KHN2ZzEsIGQubGVhcm5pbmdfcmF0ZXMsICdFcG9jaHMnKTtcbiAgICBkcmF3QmFyQ2hhcnQoc3ZnMiwgZC5tb3ZlbWVudHMsICdFcG9jaHMnKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVNjYXR0ZXJQbG90KCkge1xuICBzZW5kUmVxdWVzdFRvQmFja2VuZCgnc2NhdHRlcnBsb3QnLCB7fSwgdXBkYXRlU2NhdHRlclBsb3RTdmcpO1xufVxuXG5sZXQgdmVjUmVuZGVyU2NhbGU6IG51bWJlcjtcbmZ1bmN0aW9uIHVwZGF0ZVNjYXR0ZXJQbG90U3ZnKHZlY3RvclByb2plY3Rpb25zKSB7XG4gIGxldCBzY2F0dGVyX3N2ZyA9IGQzLnNlbGVjdCgnI3BjYS1jb250YWluZXIgc3ZnJylcbiAgY29uc3Qgc2NhdHRlcl9zdmdfd2lkdGggPSAxMDAwO1xuICBjb25zdCBzY2F0dGVyX3N2Z19oZWlnaHQgPSA3MDA7XG4gIC8vIENsZWFyIHVwIFNWR1xuICBzY2F0dGVyX3N2Zy5zZWxlY3RBbGwoXCIqXCIpLnJlbW92ZSgpO1xuXG4gIC8vIEFkZCBncmlkIGxpbmVcbiAgdmFyIHZlY1JlbmRlckJhc2VYID0gc2NhdHRlcl9zdmdfd2lkdGggLyAyO1xuICB2YXIgdmVjUmVuZGVyQmFzZVkgPSBzY2F0dGVyX3N2Z19oZWlnaHQgLyAyO1xuICBzY2F0dGVyX3N2Zy5hcHBlbmQoXCJsaW5lXCIpXG4gICAgLmNsYXNzZWQoXCJncmlkLWxpbmVcIiwgdHJ1ZSlcbiAgICAuYXR0cihcIngxXCIsIDApXG4gICAgLmF0dHIoXCJ4MlwiLCBzY2F0dGVyX3N2Z193aWR0aClcbiAgICAuYXR0cihcInkxXCIsIHZlY1JlbmRlckJhc2VZKVxuICAgIC5hdHRyKFwieTJcIiwgdmVjUmVuZGVyQmFzZVkpO1xuICBzY2F0dGVyX3N2Zy5hcHBlbmQoXCJsaW5lXCIpXG4gICAgLmNsYXNzZWQoXCJncmlkLWxpbmVcIiwgdHJ1ZSlcbiAgICAuYXR0cihcIngxXCIsIHZlY1JlbmRlckJhc2VYKVxuICAgIC5hdHRyKFwieDJcIiwgdmVjUmVuZGVyQmFzZVgpXG4gICAgLmF0dHIoXCJ5MVwiLCAwKVxuICAgIC5hdHRyKFwieTJcIiwgc2NhdHRlcl9zdmdfaGVpZ2h0KTtcbiAgc2NhdHRlcl9zdmcuc2VsZWN0QWxsKFwiLmdyaWQtbGluZVwiKVxuICAgIC5zdHlsZShcInN0cm9rZVwiLCBcImdyZXlcIilcbiAgICAuc3R5bGUoXCJzdHJva2UtZGFzaGFycmF5XCIsIChcIjMwLDNcIikpXG4gICAgLnN0eWxlKFwic3Ryb2tlLXdpZHRoXCIsIDIpXG4gICAgLnN0eWxlKFwic3Ryb2tlLW9wYWNpdHlcIiwgMC43NSk7XG5cbiAgdmFyIHNjYXR0ZXJfZ3JvdXBzID0gc2NhdHRlcl9zdmdcbiAgICAuc2VsZWN0QWxsKFwiZy5zY2F0dGVycGxvdC12ZWN0b3JcIilcbiAgICAuZGF0YSh2ZWN0b3JQcm9qZWN0aW9ucylcbiAgICAuZW50ZXIoKVxuICAgIC5hcHBlbmQoXCJnXCIpXG4gICAgLmF0dHIoJ2NsYXNzJywgZD0+ZFsndHlwZSddKVxuICAgIC5jbGFzc2VkKFwic2NhdHRlcnBsb3QtdmVjdG9yXCIsIHRydWUpO1xuXG4gIHNjYXR0ZXJfZ3JvdXBzXG4gICAgLmFwcGVuZChcImNpcmNsZVwiKVxuICAgIC8vLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uIChkKSB7cmV0dXJuIGRbJ3Byb2owJ10qMTAwMCs1MDB9KVxuICAgIC8vLmF0dHIoXCJ5XCIsIGZ1bmN0aW9uIChkKSB7cmV0dXJuIGRbJ3Byb2oxJ10qMTAwMCs1MDB9KVxuICAgIC5hdHRyKFwiclwiLCAxMClcbiAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCBcIjJcIilcbiAgICAuYXR0cihcInN0cm9rZVwiLCBcImdyZXlcIik7XG5cbiAgc2NhdHRlcl9ncm91cHNcbiAgICAuYXBwZW5kKFwidGV4dFwiKVxuICAgIC5hdHRyKFwiZHhcIiwgXCI2XCIpXG4gICAgLmF0dHIoXCJkeVwiLCBcIi0wLjI1ZW1cIilcbiAgICAuYXR0cihcImFsaWdubWVudC1iYXNlbGluZVwiLCBcImlkZW9ncmFwaGljXCIpXG4gICAgLnN0eWxlKFwiZm9udC1zaXplXCIsIDI4KVxuICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHtyZXR1cm4gZFsnd29yZCddfSk7XG5cbiAgLy8gQ2FsY3VsYXRlIGEgcHJvcGVyIHNjYWxlXG4gIHZlY1JlbmRlclNjYWxlID0gOTk5OTk5OTk5OTsgIC8vIGdsb2JhbFxuICB2ZWN0b3JQcm9qZWN0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uKHYpIHtcbiAgICB2ZWNSZW5kZXJTY2FsZSA9IE1hdGgubWluKHZlY1JlbmRlclNjYWxlLCAwLjQgKiBzY2F0dGVyX3N2Z193aWR0aCAvIE1hdGguYWJzKHZbJ3Byb2owJ10pKTtcbiAgICB2ZWNSZW5kZXJTY2FsZSA9IE1hdGgubWluKHZlY1JlbmRlclNjYWxlLCAwLjQ1ICogc2NhdHRlcl9zdmdfaGVpZ2h0IC8gTWF0aC5hYnModlsncHJvajEnXSkpO1xuICB9KTtcblxuICBzY2F0dGVyX2dyb3Vwc1xuICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgIHZhciB4ID0gZFsncHJvajAnXSAqIHZlY1JlbmRlclNjYWxlICsgdmVjUmVuZGVyQmFzZVg7XG4gICAgICB2YXIgeSA9IGRbJ3Byb2oxJ10gKiB2ZWNSZW5kZXJTY2FsZSArIHZlY1JlbmRlckJhc2VZO1xuICAgICAgcmV0dXJuIFwidHJhbnNsYXRlKFwiICsgeCArICcsJyArIHkgK1wiKVwiO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBhZGRDb2xvckJhcigpIHtcbiAgY29uc3QgaG1hcF9zdmdfd2lkdGggPSAyNTsgIC8vIHZpZXcgYm94LCBub3QgcGh5c2ljYWxcbiAgY29uc3QgaG1hcF9zdmdfaGVpZ2h0ID0gMjAwO1xuICBsZXQgaG1hcF9zdmcgPSBkMy5zZWxlY3RBbGwoJ3N2Zy5jb2xvcmJhcicpO1xuXG4gIHZhciB0bXBBcnJheSA9IFtdO1xuICBmb3IgKHZhciBpID0gLTE7IGkgPCAxOyBpICs9IDAuMDMpIHtcbiAgICB0bXBBcnJheS5wdXNoKGkpO1xuICB9XG5cbiAgdmFyIHlTY2FsZSA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgLmRvbWFpbihbMCwgdG1wQXJyYXkubGVuZ3RoIC0gMV0pXG4gICAgLnJhbmdlKFtobWFwX3N2Z19oZWlnaHQtMTUsIDE1XSk7XG5cbiAgaG1hcF9zdmcuc2VsZWN0QWxsKFwicmVjdFwiKVxuICAgIC5kYXRhKHRtcEFycmF5KVxuICAgIC5lbnRlcigpXG4gICAgLmFwcGVuZChcInJlY3RcIilcbiAgICAuYXR0cihcInlcIiwgKGQsaSkgPT4geVNjYWxlKGkpKVxuICAgIC5hdHRyKFwieFwiLCBobWFwX3N2Z193aWR0aCAvIDUpXG4gICAgLmF0dHIoXCJoZWlnaHRcIiwgaG1hcF9zdmdfaGVpZ2h0IC8gdG1wQXJyYXkubGVuZ3RoICogMS4yKVxuICAgIC5hdHRyKFwid2lkdGhcIiwgaG1hcF9zdmdfd2lkdGggLyAzKVxuICAgIC5zdHlsZShcImZpbGxcIiwgZnVuY3Rpb24oZCkge3JldHVybiB1dGlsLmV4Y2l0ZVZhbHVlVG9Db2xvcihkKX0pO1xuXG4gIGhtYXBfc3ZnLmFwcGVuZCgndGV4dCcpXG4gICAgLnRleHQoJysxJylcbiAgICAuYXR0cigneCcsIDApXG4gICAgLmF0dHIoJ3knLCAwKVxuICAgIC5hdHRyKCdhbGlnbm1lbnQtYmFzZWxpbmUnLCAnaGFuZ2luZycpO1xuXG4gIGhtYXBfc3ZnLmFwcGVuZCgndGV4dCcpXG4gICAgLnRleHQoJy0xJylcbiAgICAuYXR0cigneCcsIDApXG4gICAgLmF0dHIoJ3knLCBobWFwX3N2Z19oZWlnaHQpXG4gICAgLmF0dHIoJ2FsaWdubWVudC1iYXNlbGluZScsICdhbHBoYWJldGljJyk7XG59XG5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdoYXNoY2hhbmdlJywgKCkgPT4ge1xuICBpZiAodWlfc3RhdGVfaGlkZGVuLnNraXBfcmVzZXRfb25faGFzaGNoYW5nZSkge1xuICAgIHVpX3N0YXRlX2hpZGRlbi5za2lwX3Jlc2V0X29uX2hhc2hjaGFuZ2UgPSBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICByZXNldCgpO1xuICB9XG59KTtcblxuJCgnI3F1ZXJ5LW91dC1zZWFyY2gnKS5hdXRvY29tcGxldGUoe1xuICBzb3VyY2U6IChyZXF1ZXN0OiB7fSwgcmVzcG9uc2U6IGFueSkgPT4ge1xuICAgIHNlbmRSZXF1ZXN0VG9CYWNrZW5kKCdhdXRvY29tcGxldGUnLCByZXF1ZXN0LCBmdW5jdGlvbiAoZGF0YToge30pIHtcbiAgICAgIGlmIChkYXRhICYmIGRhdGEuaGFzT3duUHJvcGVydHkoJ2l0ZW1zJykpIHtcbiAgICAgICAgcmVzcG9uc2UoZGF0YVsnaXRlbXMnXSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXNwb25zZShbXSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0sXG4gIGRlbGF5OiAwLFxuICBtaW5MZW5ndGg6IDEsXG59KTtcblxucmVzZXQoKTtcbiIsIi8qXG5Fc3NlbnRpYWwgZWxlbWVudHMgdGhhdCBhcmUgbmVlZGVkIGZvciBjb21tb24gZnJvbnRlbmQgcmVuZGVyaW5nIGFyZVxuaW5jbHVkZWQgaGVyZS4gRGlmZmVyZW50IG1vZGVscyBzaG91bGQgZXh0ZW5kIHRoaXMgY2xhc3MgZm9yIHN0b3JpbmcgZGV0YWlscy5cbiovXG5leHBvcnQgY2xhc3MgTW9kZWxDb25maWcge1xuICBoaWRkZW5fc2l6ZTogbnVtYmVyOyAgLy8gd29yZDJ2ZWMgb25seVxuICBoaWRkZW5fc2l6ZXM6IG51bWJlcltdOyAgLy8gZGVlcCBSTk5cbiAgdHJhaW5fY29ycHVzX3VybDogc3RyaW5nO1xuXG4gIGRhdGFfb3ZlcnZpZXdfZmllbGRzOiBzdHJpbmdbXTsgIC8vIGZpZWxkcyBvZiBNb2RlbFN0YXRlIHRvIGJlIGRpc3BsYXllZC5cbiAgdHJhaW5fb3ZlcnZpZXdfZmllbGRzOiBzdHJpbmdbXTtcblxuICBkZWZhdWx0X3F1ZXJ5X2luOiBzdHJpbmdbXTtcbiAgZGVmYXVsdF9xdWVyeV9vdXQ6IHN0cmluZ1tdO1xuXG4gIHJlcG9ydF9pbnRlcnZhbF9taWNyb3NlY29uZHM6IG51bWJlcjsgIC8vIG1zXG59XG5cbi8qXG5Db250YWlucyB0aGUgbW9kZWwncyBjdXJyZW50IHRyYWluaW5nIHN0YXR1cywgYW5kIHRoZSByZWxldmFudCBpbmZvIGZvciB0aGVcbndhdGNoZWQgdGVybXMuIFRoaXMgbmVlZHMgdG8gYmUgbGlnaHQtd2VpZ2h0LCBhcyBpdCBpcyBwYXNzZWQgZnJlcXVlbnRseSBmcm9tXG5iYWNrZW5kIHRvIGZyb250ZW5kLlxuKi9cbmV4cG9ydCBjbGFzcyBNb2RlbFN0YXRlIHtcbiAgc3RhdHVzOiBzdHJpbmc7XG4gIGNvbmZpZzogTW9kZWxDb25maWc7XG4gIHF1ZXJ5X291dF9yZWNvcmRzOiBRdWVyeU91dFJlY29yZFtdO1xuICBmdWxsX21vZGVsX25hbWU6IHN0cmluZztcblxuICAvLyB1c2VkIHRvIG1ha2UgcXVlcnktb3V0IHZpc3VhbGl6YXRpb25zLlxuICBpbnN0YW5jZXM6IG51bWJlcjtcbiAgbnVtX3Bvc3NpYmxlX291dHB1dHM6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBRdWVyeU91dFJlY29yZCB7XG4gIHF1ZXJ5OiBzdHJpbmc7XG4gIHJhbms/OiBudW1iZXI7ICAvLyAwLWluZGV4ZWRcbiAgcmFua19oaXN0b3J5Pzoge3Jhbms6IG51bWJlciwgaXRlcmF0aW9uOiBudW1iZXJ9W107XG4gIHN0YXR1cz86IHN0cmluZztcbiAgc2NvcmU/OiBudW1iZXI7XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwic2VlZHJhbmRvbS5kLnRzXCIgLz5cblxuZXhwb3J0IGZ1bmN0aW9uIGdldF9yYW5kb21fZmxvYXQoKTogbnVtYmVyIHtcbiAgcmV0dXJuIE1hdGgucmFuZG9tKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZWVkX3JhbmRvbShzZWVkOiBudW1iZXIpOiB2b2lkIHtcbiAgTWF0aC5zZWVkcmFuZG9tKCcnK3NlZWQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0X3JhbmRvbV9pbml0X3dlaWdodChoaWRkZW5fc2l6ZTogbnVtYmVyKSB7XG4gIHJldHVybiAoZ2V0X3JhbmRvbV9mbG9hdCgpIC0gMC41KSAvIGhpZGRlbl9zaXplO1xufVxuIiwiLypcbiAgQmFja2VuZCBlbnRyeSBmb3IgYWxsIGluLWJyb3dzZXIgKGhlbmNlIFwidG95XCIpIG1vZGVscy5cbiovXG5cbmltcG9ydCB7TW9kZWxDb25maWcsIE1vZGVsU3RhdGV9IGZyb20gXCIuL21vZGVsX3N0YXRlXCI7XG5pbXBvcnQge1RveU1vZGVsfSBmcm9tIFwiLi90b3lfbW9kZWxcIjtcbmltcG9ydCB7V29yZDJ2ZWN9IGZyb20gXCIuL3RveV9tb2RlbF93MnZcIjtcblxubGV0IG1vZGVsOiBUb3lNb2RlbCA9IG51bGw7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGhhbmRsZVJlcXVlc3QocmVxdWVzdF90eXBlOiBzdHJpbmcsIHJlcXVlc3Q6IHt9KTogYW55IHtcbiAgaWYgKHJlcXVlc3RfdHlwZSA9PSAnaWRlbnRpZnknKSB7XG4gICAgbW9kZWwgPSBudWxsO1xuICAgIGxldCBtb2RlbF90eXBlID0gcmVxdWVzdFsnbW9kZWxfdHlwZSddO1xuICAgIGxldCBtb2RlbF9jb25maWcgPSByZXF1ZXN0Wydtb2RlbF9jb25maWcnXTtcbiAgICAgIGlmIChtb2RlbF90eXBlID09ICd3b3JkMnZlYycpIHtcbiAgICAgICAgbW9kZWwgPSBuZXcgV29yZDJ2ZWMobW9kZWxfY29uZmlnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVW5yZWNvZ25pemVkIG1vZGVsIHR5cGU6IFwiJyArIG1vZGVsX3R5cGUgKyAnXCInKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBtb2RlbC5nZXRfc3RhdGUoKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbW9kZWwuaGFuZGxlX3JlcXVlc3QocmVxdWVzdF90eXBlLCByZXF1ZXN0KTtcbiAgfVxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cInBjYS5kLnRzXCIgLz5cblxuaW1wb3J0IHtNb2RlbENvbmZpZywgTW9kZWxTdGF0ZSwgUXVlcnlPdXRSZWNvcmR9IGZyb20gXCIuL21vZGVsX3N0YXRlXCI7XG5pbXBvcnQge1RveU1vZGVsfSBmcm9tIFwiLi90b3lfbW9kZWxcIjtcbmltcG9ydCAqIGFzIHV0aWwgZnJvbSBcIi4vdXRpbFwiO1xuaW1wb3J0IHtnZXRfcmFuZG9tX2Zsb2F0LCBnZXRfcmFuZG9tX2luaXRfd2VpZ2h0fSBmcm9tIFwiLi9yYW5kb21cIjtcblxuLy8gZm9yIG5lZ2F0aXZlIHNhbXBsaW5nXG5jb25zdCBQT1dFUiA9IDAuNzU7XG5jb25zdCBDVU1fVEFCTEVfRE9NQUlOID0gMjE0NzQ4MzY0NzsgIC8vIDJeMzEgLSAxXG5jb25zdCBNQVhfRVhQID0gNjtcbmNvbnN0IEVYUF9UQUJMRV9TSVpFID0gMTAwMDtcblxuY29uc3QgUkFOS19UT19TSE9XID0gMTA7XG5jb25zdCBSQU5LX1RPX0NPTlNJREVSX0ZPUl9QRVJESU0gPSAxMDA7XG5cbmNsYXNzIFdvcmQydmVjQ29uZmlnIGV4dGVuZHMgTW9kZWxDb25maWcge1xuICBoaWRkZW5fc2l6ZTogbnVtYmVyID0gMTY7XG4gIGFscGhhOiBudW1iZXIgPSAwLjE7XG4gIHdpbmRvdzogbnVtYmVyID0gMztcbiAgbWluX2NvdW50OiBudW1iZXIgPSAyO1xuICBzZWVkOiBudW1iZXIgPSAxO1xuICBtaW5fYWxwaGE6IG51bWJlciA9IDAuMDE7XG4gIHNnOiBib29sZWFuID0gdHJ1ZTtcbiAgbmVnYXRpdmU6IG51bWJlciA9IDU7XG4gIGNib3dfbWVhbjogYm9vbGVhbiA9IHRydWU7XG4gIGl0ZXI6IG51bWJlciA9IDIwO1xuICBkYXRhX292ZXJ2aWV3X2ZpZWxkczogc3RyaW5nW10gPSBbJ3ZvY2FiX3NpemUnLCAnbnVtX3NlbnRlbmNlcycsICdjb3JwdXNfc2l6ZSddO1xuICB0cmFpbl9vdmVydmlld19maWVsZHM6IHN0cmluZ1tdID0gWydpbnN0YW5jZXMnLCAnZXBvY2hzJywgJ2xlYXJuaW5nX3JhdGUnXTtcbiAgZGVmYXVsdF9xdWVyeV9pbjogc3RyaW5nW10gPSBbJ2RhcmN5J107XG4gIGRlZmF1bHRfcXVlcnlfb3V0OiBzdHJpbmdbXSA9IFsnR19iZW5uZXQnLCdCX2NpcmN1bXN0YW5jZXMnXTtcbiAgdHJhaW5fY29ycHVzX3VybDogc3RyaW5nID0gXCIvcGcxMzQyLXRva2VuaXplZC50eHRcIjtcbiAgcmVwb3J0X2ludGVydmFsX21pY3Jvc2Vjb25kczogbnVtYmVyID0gMjUwO1xufTtcblxuZXhwb3J0IGNsYXNzIFdvcmQydmVjU3RhdGUgZXh0ZW5kcyBNb2RlbFN0YXRlIHtcbiAgY29uZmlnOiBXb3JkMnZlY0NvbmZpZztcbiAgdm9jYWJfc2l6ZTogbnVtYmVyO1xuICBudW1fc2VudGVuY2VzOiBudW1iZXI7XG4gIGNvcnB1c19zaXplOiBudW1iZXI7ICAvLyB0b3RhbCBudW1iZXIgb2YgdHJhaW5hYmxlIHdvcmRzIGluIHRoZSBjb3JwdXNcblxuICBzZW50ZW5jZXM6IG51bWJlcjtcbiAgZXBvY2hzOiBudW1iZXI7XG4gIGxlYXJuaW5nX3JhdGU6IG51bWJlcjtcblxuICBmdWxsX21vZGVsX25hbWUgPSAnV29yZDJWZWMnO1xuXG4gIHFpX3ZlYzogbnVtYmVyW107XG4gIHBlcl9kaW1fbmVpZ2hib3JzOiBRdWVyeU91dFJlY29yZFtdW107ICAvLyBbZGltXVtyYW5rXSA9IHtxdWVyeSwgc2NvcmV9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGFpclByb2ZpbGUge1xuICBxbzogc3RyaW5nO1xuICBxb192ZWM6IG51bWJlcltdO1xuICBxb19uZWlnaGJvcnM6IFF1ZXJ5T3V0UmVjb3JkW107ICAvLyB7cXVlcnksIHNjb3JlfVxuICBxb19wZXJfZGltX25laWdoYm9yczogUXVlcnlPdXRSZWNvcmRbXVtdOyAgLy8gW2RpbV1bcmFua10gPSB7cXVlcnksIHNjb3JlfVxuICBlbGVtcHJvZDogbnVtYmVyW107XG4gIGVsZW1zdW1fbmVpZ2hib3JzOiB7cXVlcnk6IHN0cmluZywgc2NvcmUxOiBudW1iZXIsIHNjb3JlMjogbnVtYmVyfVtdO1xuICBlbGVtc3VtX3Blcl9kaW1fbmVpZ2hib3JzOiB7cXVlcnk6IHN0cmluZywgc2NvcmUxOiBudW1iZXIsIHNjb3JlMjogbnVtYmVyfVtdW107XG59XG5cbmNsYXNzIFZvY2FiSXRlbSB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBpZHg6IG51bWJlciwgcHVibGljIGNvdW50OiBudW1iZXIgPSAwKSB7XG4gIH1cbn1cblxuLy8gTW9zdGx5IHJlcGxpY2F0aW5nIHRoZSBpbXBsZW1lbnRhdGlvbiBvZiB0aGUgb3JpZ2luYWwgd29yZDJ2ZWMgcGFja2FnZSBhcyB3ZWxsIGFzXG4vLyBnZW5zaW0ncyB3b3JkMnZlYyBoZXJlLiBEb3duc2NhbGluZyBkZWZhdWx0cyB0byBmaXQgYnJvd3Nlci5cbi8vXG4vLyBTZXZlcmFsIHNpbXBsaWZpY2F0aW9ucyBjb21wYXJlZCB0byB0aGUgb3JpZ2luYWwgaW1wbGVtZW50YXRpb246XG4vLyAxLiBhbHdheXMgbmVnYXRpdmUgc2FtcGxpbmcgKGhpZXJhcmNoaWNhbCBzb2Z0bWF4IG5vdCBzdXBwb3J0ZWQpXG4vLyAyLiBzdWJzYW1wbGluZyBmb3IgZnJlcXVlbnQgdGVybXMgbm90IHN1cHBvcnRlZFxuLy8gMy4gdHJhaW5pbmcgd2lsbCBub3Qgc3RvcCAtLSB3aWxsIGdvIG9uIGlmIG1heF9pdGVyIGlzIG1ldCwgYW5kIHdpbGwga2VlcFxuLy8gICAgdXNpbmcgbWluX2FscGhhIGZyb20gdGhlbiBvbi5cbi8vIDQuIG51bGxfd29yZCBpcyBhbHdheXMgMC5cbi8vIDUuIG1heF92b2NhYl9zaXplIGlzIGluZmluaXRlLlxuZXhwb3J0IGNsYXNzIFdvcmQydmVjIGltcGxlbWVudHMgVG95TW9kZWwge1xuICBzdGF0ZTogV29yZDJ2ZWNTdGF0ZTtcbiAgY29ycHVzOiBzdHJpbmc7XG4gIHNlbnRlbmNlczogc3RyaW5nW107XG4gIHZvY2FiOiB7W2tleTogc3RyaW5nXTogVm9jYWJJdGVtfTtcbiAgaW5kZXgyd29yZDogc3RyaW5nW107XG5cbiAgcXVlcnlfaW46IHN0cmluZ1tdID0gW107XG4gIHFpX2tleTogc3RyaW5nOyAgLy8gaGFzaCBrZXkgZm9yIHF1ZXJ5X2luXG4gIHFfaWR4X3NldDoge1txX2lkeDpudW1iZXJdOmJvb2xlYW59O1xuICBxdWVyaWVzX3dhdGNoZWQ6IHtbcTpzdHJpbmddOiBib29sZWFufSA9IHt9O1xuICBxdWVyaWVzX2lnbm9yZWQ6IHtbcTpzdHJpbmddOiBib29sZWFufSA9IHt9O1xuICBxb19tYXA6IHtbcWlfa2V5OiBzdHJpbmddOiB7W3FvOiBzdHJpbmddOiBRdWVyeU91dFJlY29yZH19ID0ge307XG4gIHNjb3JlczogbnVtYmVyW107XG4gIHFpX3Njb3Jlc191bnNvcnRlZDogU2NvcmVkSXRlbVtdO1xuICBxaV9zY29yZXM6IFNjb3JlZEl0ZW1bXTtcbiAgcWlfdmVjOiBudW1iZXJbXTtcbiAgbDJfc3FydHM6IG51bWJlcltdO1xuXG4gIHN5bjA6IG51bWJlcltdW107XG4gIHN5bjE6IG51bWJlcltdW107XG4gIGN1bV90YWJsZTogbnVtYmVyW107ICAvLyBjdW11bHRhdGl2ZSBkaXN0cmlidXRpb24gdGFibGUgZm9yIG5lZ2F0aXZlIHNhbXBsaW5nLlxuICBleHBfdGFibGU6IG51bWJlcltdO1xuXG4gIC8vIFRyYWluaW5nIHN0YXR1cyB0cmFja2VyXG4gIGNvdW50X2luc3RhbmNlc193YXRjaGVkID0gMDsgIC8vIG51bWJlciBvZiBzZWVuIGluc3RhbmNlcyBvZiB3YXRjaGVkIHF1ZXJpZXNcbiAgYnJlYWtwb2ludF9pbnN0YW5jZXNfd2F0Y2hlZCA9IC0xOyAgLy8gd2hlbiB0aGlzIG51bWJlciAoaXMgcG9zaXRpdmUpIGlzIG1ldCwgYnJlYWsuXG4gIGJyZWFrcG9pbnRfaXRlcmF0aW9ucyA9IC0xO1xuICBicmVha3BvaW50X3RpbWUgPSAtMTtcblxuICB0cmFpbl9pbnN0YW5jZV9sb2dfbWFwOiB7W3F1ZXJ5OnN0cmluZ106IFRyYWluSW5zdGFuY2VMb2dbXX0gPSB7fTtcblxuICBwcmluY2lwYWxfY29tcG9uZW50czogYW55O1xuXG4gIGNvbnN0cnVjdG9yKG1vZGVsX2NvbmZpZzoge30pIHtcbiAgICB0aGlzLnN0YXRlID0gbmV3IFdvcmQydmVjU3RhdGUoKTtcbiAgICB0aGlzLnN0YXRlLmNvbmZpZyA9IG5ldyBXb3JkMnZlY0NvbmZpZygpOyAgLy8gd2l0aCBkZWZhdWx0IHBhcmFtZXRlcnNcbiAgICB0aGlzLnVwZGF0ZV9jb25maWcobW9kZWxfY29uZmlnKTsgIC8vIGZvbGRpbmcgaW4gdGhlIHVzZXIncyBjdXN0b20gcGFyYW1ldGVyc1xuICAgIHRoaXMuc2V0X3N0YXR1cygnV0FJVF9GT1JfQ09SUFVTJyk7XG4gIH1cblxuICBwcml2YXRlIHVwZGF0ZV9jb25maWcoY29uZmlnOiB7fSk6IHZvaWQge1xuICAgIGxldCBtb2RlbF9jb25maWcgPSB0aGlzLnN0YXRlLmNvbmZpZztcbiAgICBmb3IgKGxldCBrZXkgaW4gY29uZmlnKSB7XG4gICAgICBpZiAobW9kZWxfY29uZmlnLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgbW9kZWxfY29uZmlnW2tleV0gPSBjb25maWdba2V5XTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBnZXRfc3RhdGUoKTogTW9kZWxTdGF0ZSB7XG4gICAgcmV0dXJuIHRoaXMuc3RhdGU7XG4gIH1cblxuICBoYW5kbGVfcmVxdWVzdChyZXF1ZXN0X3R5cGU6IHN0cmluZywgcmVxdWVzdDoge30pOiBhbnkge1xuICAgIHN3aXRjaCAocmVxdWVzdF90eXBlKSB7XG4gICAgICBjYXNlICdpZGVudGlmeSc6XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignXCJpZGVudGlmeVwiIHNob3VsZCBiZSBoYW5kbGVkIGJ5IHRveV9tb2RlbF9lbnRyeS50cycpO1xuXG4gICAgICBjYXNlICdzZXRfY29ycHVzJzpcbiAgICAgICAgdGhpcy5jb3JwdXMgPSByZXF1ZXN0Wydjb3JwdXMnXTtcbiAgICAgICAgdGhpcy5zZXRfc3RhdHVzKCdXQUlUX0ZPUl9JTklUJyk7XG4gICAgICAgIHJldHVybiB0aGlzLmdldF9zdGF0ZSgpO1xuXG4gICAgICBjYXNlICdpbml0X21vZGVsJzpcbiAgICAgICAgdGhpcy5idWlsZF92b2NhYigpO1xuICAgICAgICB0aGlzLmluaXRfbW9kZWwoKTtcbiAgICAgICAgdGhpcy5zZXRfc3RhdHVzKCdXQUlUX0ZPUl9UUkFJTicpO1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRfc3RhdGUoKTtcblxuICAgICAgY2FzZSAnYXV0b2NvbXBsZXRlJzpcbiAgICAgICAgbGV0IHRlcm0gPSA8c3RyaW5nPnJlcXVlc3RbJ3Rlcm0nXSB8fCAnJztcbiAgICAgICAgcmV0dXJuIHRoaXMuYXV0b2NvbXBsZXRlKHRlcm0pO1xuXG4gICAgICBjYXNlICd2YWxpZGF0ZV9xdWVyeV9pbic6ICAvLyB0aGlzIGNvbnRhaW5zIGFsbCBxdWVyeSB0ZXJtcyBpbiBxdWVyeV9pblxuICAgICAgICBsZXQgcXVlcnlfaW4gPSA8c3RyaW5nW10+cmVxdWVzdFsncXVlcnlfaW4nXSB8fCBbXTtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsaWRhdGVfcXVlcnlfaW4ocXVlcnlfaW4pO1xuXG4gICAgICBjYXNlICd2YWxpZGF0ZV9xdWVyeV9vdXQnOiAgLy8gdGhpcyBpcyBhIHNpbmdsZSBxdWVyeV9vdXQgaXRlbSBvbmx5XG4gICAgICAgIGxldCBxdWVyeV9vdXQgPSA8c3RyaW5nPnJlcXVlc3RbJ3F1ZXJ5X291dCddO1xuICAgICAgICByZXR1cm4gdGhpcy52YWxpZGF0ZV9xdWVyeV9vdXQocXVlcnlfb3V0KTtcblxuICAgICAgY2FzZSAndXBkYXRlX3F1ZXJ5X291dF9yZXN1bHQnOlxuICAgICAgICB0aGlzLnVwZGF0ZV9xaV9hbmRfcW8ocmVxdWVzdCk7XG4gICAgICAgIHRoaXMuY29tcHV0ZV9xdWVyeV9yZXN1bHQoKTtcbiAgICAgICAgdGhpcy51cGRhdGVfUENBKCk7XG4gICAgICAgIHJldHVybiB0aGlzLmdldF9zdGF0ZSgpO1xuXG4gICAgICBjYXNlICd0cmFpbic6XG4gICAgICAgIGxldCByZXF1ZXN0ZWRfaXRlcmF0aW9ucyA9IDxudW1iZXI+cmVxdWVzdFsnaXRlcmF0aW9ucyddIHx8IC0xO1xuICAgICAgICBsZXQgd2F0Y2hlZCA9IDxib29sZWFuPnJlcXVlc3RbJ3dhdGNoZWQnXTtcbiAgICAgICAgdGhpcy5icmVha3BvaW50X2l0ZXJhdGlvbnMgPSAtMTtcbiAgICAgICAgdGhpcy5icmVha3BvaW50X2luc3RhbmNlc193YXRjaGVkID0gLTE7XG4gICAgICAgIHRoaXMuYnJlYWtwb2ludF90aW1lID0gRGF0ZS5ub3coKSArIHRoaXMuc3RhdGUuY29uZmlnLnJlcG9ydF9pbnRlcnZhbF9taWNyb3NlY29uZHM7XG4gICAgICAgIGlmIChyZXF1ZXN0ZWRfaXRlcmF0aW9ucyA+IDApIHtcbiAgICAgICAgICBpZiAod2F0Y2hlZCkgdGhpcy5icmVha3BvaW50X2luc3RhbmNlc193YXRjaGVkID0gdGhpcy5jb3VudF9pbnN0YW5jZXNfd2F0Y2hlZCArIHJlcXVlc3RlZF9pdGVyYXRpb25zO1xuICAgICAgICAgIGVsc2UgdGhpcy5icmVha3BvaW50X2l0ZXJhdGlvbnMgPSB0aGlzLnN0YXRlLmluc3RhbmNlcyArIHJlcXVlc3RlZF9pdGVyYXRpb25zO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudHJhaW5fdW50aWxfYnJlYWtwb2ludCgpO1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRfc3RhdGUoKTtcblxuICAgICAgY2FzZSAndHJhaW4tY29udGludWUnOlxuICAgICAgICB0aGlzLmJyZWFrcG9pbnRfdGltZSA9IERhdGUubm93KCkgKyB0aGlzLnN0YXRlLmNvbmZpZy5yZXBvcnRfaW50ZXJ2YWxfbWljcm9zZWNvbmRzO1xuICAgICAgICB0aGlzLnRyYWluX3VudGlsX2JyZWFrcG9pbnQoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0X3N0YXRlKCk7XG5cbiAgICAgIGNhc2UgJ3BhaXJfcHJvZmlsZSc6XG4gICAgICAgIGxldCBxdWVyeSA9IDxzdHJpbmc+cmVxdWVzdFsncXVlcnknXTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0X3BhaXJfcHJvZmlsZShxdWVyeSk7XG5cbiAgICAgIGNhc2UgJ2luZmx1ZW50aWFsX3RyYWluX2luc3RhbmNlcyc6XG4gICAgICAgIGxldCB3MSA9IDxzdHJpbmc+cmVxdWVzdFsndzEnXTtcbiAgICAgICAgbGV0IHcyID0gPHN0cmluZz5yZXF1ZXN0Wyd3MiddO1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRfaW5mbHVlbnRpYWxfdHJhaW5faW5zdGFuY2VzKHcxLCB3Mik7XG5cbiAgICAgIGNhc2UgJ3Jlc2V0X3BjYSc6XG4gICAgICAgIHRoaXMudXBkYXRlX1BDQSgpO1xuICAgICAgICByZXR1cm4ge307XG5cbiAgICAgIGNhc2UgJ3NjYXR0ZXJwbG90JzpcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0XzJEX3ZlY3MoKTtcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbnJlY29nbml6ZWQgcmVxdWVzdCB0eXBlOiBcIicgKyByZXF1ZXN0X3R5cGUgKyAnXCInKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHNldF9zdGF0dXMoc3RhdHVzOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLnN0YXRlLnN0YXR1cyA9IHN0YXR1cztcbiAgfVxuXG4gIHByaXZhdGUgYnVpbGRfdm9jYWIoKTogdm9pZCB7XG4gICAgLy8gQ291bnQgd29yZHMuXG4gICAgdGhpcy5zZW50ZW5jZXMgPSB0aGlzLmNvcnB1cy5zcGxpdCgnXFxuJyk7XG4gICAgdGhpcy52b2NhYiA9IHt9O1xuICAgIHRoaXMuaW5kZXgyd29yZCA9IFtdO1xuICAgIGZvciAobGV0IHNlbnRlbmNlIG9mIHRoaXMuc2VudGVuY2VzKSB7XG4gICAgICBsZXQgd29yZHMgPSBzZW50ZW5jZS5zcGxpdCgnICcpO1xuICAgICAgZm9yIChsZXQgd29yZCBvZiB3b3Jkcykge1xuICAgICAgICBpZiAoISAod29yZCBpbiB0aGlzLnZvY2FiKSkge1xuICAgICAgICAgIHRoaXMudm9jYWJbd29yZF0gPSBuZXcgVm9jYWJJdGVtKHRoaXMuaW5kZXgyd29yZC5sZW5ndGgpO1xuICAgICAgICAgIHRoaXMuaW5kZXgyd29yZC5wdXNoKHdvcmQpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudm9jYWJbd29yZF0uY291bnQgKz0gMTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBEaXNjYXJkIHJhcmUgd29yZHMuXG4gICAgaWYgKHRoaXMuc3RhdGUuY29uZmlnLm1pbl9jb3VudCA+IDEpIHtcbiAgICAgIGxldCBtaW5fY291bnQgPSB0aGlzLnN0YXRlLmNvbmZpZy5taW5fY291bnQ7XG4gICAgICBsZXQgdm9jYWJfdG1wOiB7W2tleTogc3RyaW5nXTogVm9jYWJJdGVtfSA9IHt9O1xuICAgICAgbGV0IGluZGV4MndvcmRfdG1wOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgZm9yIChsZXQgd29yZCBpbiB0aGlzLnZvY2FiKSB7XG4gICAgICAgIGlmICh0aGlzLnZvY2FiW3dvcmRdLmNvdW50ID49IG1pbl9jb3VudCkge1xuICAgICAgICAgIHZvY2FiX3RtcFt3b3JkXSA9IHRoaXMudm9jYWJbd29yZF07XG4gICAgICAgICAgdm9jYWJfdG1wW3dvcmRdLmlkeCA9IGluZGV4MndvcmRfdG1wLmxlbmd0aDtcbiAgICAgICAgICBpbmRleDJ3b3JkX3RtcC5wdXNoKHdvcmQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLnZvY2FiID0gdm9jYWJfdG1wO1xuICAgICAgdGhpcy5pbmRleDJ3b3JkID0gaW5kZXgyd29yZF90bXA7XG4gICAgfVxuXG4gICAgLy8gU29ydCB3b3JkcyBieSBjb3VudFxuICAgIHRoaXMuaW5kZXgyd29yZC5zb3J0KChhOnN0cmluZywgYjpzdHJpbmcpID0+IHtcbiAgICAgIHJldHVybiB0aGlzLnZvY2FiW2JdLmNvdW50IC0gdGhpcy52b2NhYlthXS5jb3VudDtcbiAgICB9KTtcbiAgICB0aGlzLmluZGV4MndvcmQuc3BsaWNlKDAsIDAsICdcXDAnKTsgIC8vIGFkZCBudWxsIHdvcmQgdG8gdGhlIGZyb250XG4gICAgdGhpcy52b2NhYlt0aGlzLmluZGV4MndvcmRbMF1dID0gbmV3IFZvY2FiSXRlbSgwLCAxKTtcbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IHRoaXMuaW5kZXgyd29yZC5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy52b2NhYlt0aGlzLmluZGV4MndvcmRbaV1dLmlkeCA9IGk7XG4gICAgfVxuXG4gICAgLy8gdG90YWwgXCJ0cmFpbmFibGVcIiB3b3JkcyBpbiBjb3JwdXNcbiAgICBsZXQgdG90YWxfd29yZHM6IG51bWJlciA9IDA7XG4gICAgZm9yIChsZXQgd29yZCBpbiB0aGlzLnZvY2FiKSB7XG4gICAgICB0b3RhbF93b3JkcyArPSB0aGlzLnZvY2FiW3dvcmRdLmNvdW50O1xuICAgIH1cblxuICAgIC8vIGluaXQgY3VtdWx0YXRpdmUgZGlzdHJpYnV0aW9uIHRhYmxlIGZvciBuZWdhdGl2ZSBzYW1wbGluZ1xuICAgIGxldCB0cmFpbl93b3Jkc19wb3cgPSAwO1xuICAgIGxldCB2b2NhYl9zaXplID0gdGhpcy5pbmRleDJ3b3JkLmxlbmd0aDtcbiAgICB0aGlzLmN1bV90YWJsZSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdm9jYWJfc2l6ZTsgaSsrKSB0aGlzLmN1bV90YWJsZS5wdXNoKDApO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdm9jYWJfc2l6ZTsgaSsrKSB7XG4gICAgICB0cmFpbl93b3Jkc19wb3cgKz0gTWF0aC5wb3codGhpcy52b2NhYlt0aGlzLmluZGV4MndvcmRbaV1dLmNvdW50LCBQT1dFUik7XG4gICAgfVxuICAgIGxldCBjdW11bHRhdGl2ZTogbnVtYmVyID0gMC4wO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdm9jYWJfc2l6ZTsgaSsrKSB7XG4gICAgICBjdW11bHRhdGl2ZSArPSBNYXRoLnBvdyh0aGlzLnZvY2FiW3RoaXMuaW5kZXgyd29yZFtpXV0uY291bnQsIFBPV0VSKSAvIHRyYWluX3dvcmRzX3BvdztcbiAgICAgIHRoaXMuY3VtX3RhYmxlW2ldID0gTWF0aC5yb3VuZChjdW11bHRhdGl2ZSAqIENVTV9UQUJMRV9ET01BSU4pO1xuICAgIH1cblxuICAgIC8vIFVwZGF0ZSBzdGF0ZXMuXG4gICAgdGhpcy5zdGF0ZS5udW1fc2VudGVuY2VzID0gdGhpcy5zZW50ZW5jZXMubGVuZ3RoO1xuICAgIHRoaXMuc3RhdGUudm9jYWJfc2l6ZSA9IHRoaXMuaW5kZXgyd29yZC5sZW5ndGg7XG4gICAgdGhpcy5zdGF0ZS5jb3JwdXNfc2l6ZSA9IHRvdGFsX3dvcmRzO1xuICB9XG5cbiAgcHJpdmF0ZSBpbml0X21vZGVsKCk6IHZvaWQge1xuICAgIGxldCB2b2NhYl9zaXplID0gdGhpcy5zdGF0ZS52b2NhYl9zaXplO1xuICAgIGxldCBoaWRkZW5fc2l6ZSA9IHRoaXMuc3RhdGUuY29uZmlnLmhpZGRlbl9zaXplO1xuICAgIGxldCBzeW4wID0gW107XG4gICAgbGV0IHN5bjEgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZvY2FiX3NpemU7IGkrKykge1xuICAgICAgbGV0IHYwID0gW107XG4gICAgICBsZXQgdjEgPSBbXTtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgaGlkZGVuX3NpemU7IGorKykge1xuICAgICAgICB2MC5wdXNoKGdldF9yYW5kb21faW5pdF93ZWlnaHQoaGlkZGVuX3NpemUpKTtcbiAgICAgICAgLy8gbGV0IGEgPSBnZXRfcmFuZG9tX2luaXRfd2VpZ2h0KGhpZGRlbl9zaXplKTtcbiAgICAgICAgdjEucHVzaChnZXRfcmFuZG9tX2luaXRfd2VpZ2h0KGhpZGRlbl9zaXplKSk7XG4gICAgICAgIC8vIHYxLnB1c2goMCk7XG4gICAgICB9XG4gICAgICBzeW4wLnB1c2godjApO1xuICAgICAgc3luMS5wdXNoKHYxKTtcbiAgICB9XG4gICAgdGhpcy5zeW4wID0gc3luMDtcbiAgICB0aGlzLnN5bjEgPSBzeW4xO1xuXG4gICAgdGhpcy5zY29yZXMgPSBbXTtcbiAgICB0aGlzLmwyX3NxcnRzID0gW107XG4gICAgdGhpcy5xaV92ZWMgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZvY2FiX3NpemU7IGkrKykgIHRoaXMuc2NvcmVzLnB1c2goMCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2b2NhYl9zaXplOyBpKyspICB0aGlzLmwyX3NxcnRzLnB1c2goMCk7XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBoaWRkZW5fc2l6ZTsgaisrKSAgdGhpcy5xaV92ZWMucHVzaCgwKTtcblxuICAgIHRoaXMuc3RhdGUuaW5zdGFuY2VzID0gMDtcbiAgICB0aGlzLnN0YXRlLm51bV9wb3NzaWJsZV9vdXRwdXRzID0gdm9jYWJfc2l6ZTtcbiAgICB0aGlzLnN0YXRlLmVwb2NocyA9IDA7XG4gICAgdGhpcy5zdGF0ZS5zZW50ZW5jZXMgPSAwO1xuXG4gICAgdGhpcy5leHBfdGFibGUgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IEVYUF9UQUJMRV9TSVpFOyBpKyspIHtcbiAgICAgIGxldCB2ID0gTWF0aC5leHAoKGkgLyBFWFBfVEFCTEVfU0laRSAqIDIgLSAxKSAqIE1BWF9FWFApO1xuICAgICAgdGhpcy5leHBfdGFibGUucHVzaCh2IC8gKHYgKyAxKSk7XG4gICAgfVxuICAgIHRoaXMuZXhwX3RhYmxlLnB1c2goMCk7XG4gIH1cblxuICBwcml2YXRlIGF1dG9jb21wbGV0ZSh0ZXJtOiBzdHJpbmcpOiB7fSB7XG4gICAgbGV0IG91dCA9IFtdO1xuICAgIGlmICh0aGlzLmluZGV4MndvcmQgJiYgdGVybSkge1xuICAgICAgbGV0IHByZWZpeCA9IG51bGw7XG4gICAgICBsZXQgc2VhcmNoX3Rlcm0gPSB0ZXJtO1xuICAgICAgaWYgKHV0aWwuc3RhcnRzV2l0aCh0ZXJtLCAnLScpKSB7XG4gICAgICAgIHByZWZpeCA9ICctJztcbiAgICAgICAgc2VhcmNoX3Rlcm0gPSB0ZXJtLnNsaWNlKDEpO1xuICAgICAgfVxuICAgICAgb3V0ID0gJC51aS5hdXRvY29tcGxldGUuZmlsdGVyKHRoaXMuaW5kZXgyd29yZCwgc2VhcmNoX3Rlcm0pO1xuICAgICAgLy8gcHV0IHRob3NlIHRoYXQgc3RhcnQgd2l0aCB0aGUgc2VhcmNoIHRlcm0gZm9yd2FyZFxuICAgICAgbGV0IG91dF9zOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgbGV0IG91dF9uczogc3RyaW5nW10gPSBbXTtcbiAgICAgIGZvciAobGV0IHcgb2Ygb3V0KSB7XG4gICAgICAgIGlmICh1dGlsLnN0YXJ0c1dpdGgodywgc2VhcmNoX3Rlcm0pKSB7XG4gICAgICAgICAgb3V0X3MucHVzaCh3KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBvdXRfbnMucHVzaCh3KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgb3V0ID0gb3V0X3MuY29uY2F0KG91dF9ucyk7XG5cbiAgICAgIGlmIChwcmVmaXgpIHtcbiAgICAgICAgb3V0ID0gJC5tYXAob3V0LCAoczpzdHJpbmcpID0+IHtyZXR1cm4gcHJlZml4ICsgc30pO1xuICAgICAgfVxuICAgICAgb3V0ID0gb3V0LnNsaWNlKDAsIDIwKTtcbiAgICB9XG4gICAgcmV0dXJuIHsnaXRlbXMnOiBvdXR9O1xuICB9XG5cbiAgcHJpdmF0ZSB2YWxpZGF0ZV9xdWVyeV9pbihxdWVyeV9pbjogc3RyaW5nW10pOiB7fSB7XG4gICAgaWYgKCEgdGhpcy52b2NhYikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdNdXN0IGZpcnN0IGJ1aWxkIHZvY2FiIGJlZm9yZSB2YWxpZGF0aW5nIHF1ZXJpZXMuJyk7XG4gICAgfVxuICAgIGxldCBpc192YWxpZCA9IHRydWU7XG4gICAgbGV0IG1lc3NhZ2UgPSAnJztcbiAgICBmb3IgKGxldCBxdWVyeSBvZiBxdWVyeV9pbikge1xuICAgICAgaWYgKHV0aWwuc3RhcnRzV2l0aChxdWVyeSwgJy0nKSkge1xuICAgICAgICBxdWVyeSA9IHF1ZXJ5LnNsaWNlKDEpO1xuICAgICAgfVxuICAgICAgaWYgKCEocXVlcnkgaW4gdGhpcy52b2NhYikpIHtcbiAgICAgICAgaXNfdmFsaWQgPSBmYWxzZTtcbiAgICAgICAgaWYgKG1lc3NhZ2UubGVuZ3RoID4gMCkge1xuICAgICAgICAgIG1lc3NhZ2UgKz0gXCI8YnI+XFxuXCI7XG4gICAgICAgIH1cbiAgICAgICAgbWVzc2FnZSArPSAnXCInICsgcXVlcnkgKyAnXCIgaXMgbm90IGluIHZvY2FidWxhcnkuJztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHtpc192YWxpZDogaXNfdmFsaWQsIG1lc3NhZ2U6IG1lc3NhZ2V9O1xuICB9XG5cbiAgcHJpdmF0ZSB2YWxpZGF0ZV9xdWVyeV9vdXQocXVlcnk6IHN0cmluZyk6IHt9IHtcbiAgICBpZiAoISB0aGlzLnZvY2FiKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ011c3QgZmlyc3QgYnVpbGQgdm9jYWIgYmVmb3JlIHZhbGlkYXRpbmcgcXVlcmllcy4nKTtcbiAgICB9XG4gICAgbGV0IGlzX3ZhbGlkID0gdHJ1ZTtcbiAgICBsZXQgbWVzc2FnZSA9ICcnO1xuICAgIGlmICghIChxdWVyeSBpbiB0aGlzLnZvY2FiKSkge1xuICAgICAgaXNfdmFsaWQgPSBmYWxzZTtcbiAgICAgIG1lc3NhZ2UgPSBgXCIke3F1ZXJ5fVwiIGlzIG5vdCBpbiB2b2NhYnVsYXJ5LmA7XG4gICAgfVxuICAgIHJldHVybiB7aXNfdmFsaWQ6IGlzX3ZhbGlkLCBtZXNzYWdlOiBtZXNzYWdlfTtcbiAgfVxuXG4gIHByaXZhdGUgdXBkYXRlX3FpX2FuZF9xbyhyZXF1ZXN0OiB7fSkge1xuICAgIC8vIHN5bmMgbW9kZWwgc3RhdHVzIHdpdGggZnJvbnRlbmRcbiAgICB0aGlzLnN0YXRlLnN0YXR1cyA9IHJlcXVlc3RbJ3N0YXR1cyddO1xuXG4gICAgLy8gVXBkYXRlIHF1ZXJ5X2luLlxuICAgIHRoaXMucXVlcnlfaW4gPSA8c3RyaW5nW10+cmVxdWVzdFsncXVlcnlfaW4nXTtcbiAgICBpZiAodGhpcy5xdWVyeV9pbi5sZW5ndGggPT0gMCkgdGhpcy5xdWVyeV9pbiA9IFsnXFwwJ107XG4gICAgdGhpcy5xaV9rZXkgPSB0aGlzLnF1ZXJ5X2luLmpvaW4oJyYnKTtcbiAgICBpZiAodGhpcy5xaV9rZXkubGVuZ3RoID4gMCAmJiAhICh0aGlzLnFpX2tleSBpbiB0aGlzLnFvX21hcCkpIHtcbiAgICAgIHRoaXMucW9fbWFwW3RoaXMucWlfa2V5XSA9IHt9O1xuICAgIH1cblxuICAgIGxldCBxb19sb29rdXAgPSB0aGlzLnFvX21hcFt0aGlzLnFpX2tleV07XG5cbiAgICAvLyBVcGRhdGUgcXVlcnlfd2F0Y2hlZC5cbiAgICBsZXQgcXVlcnlfb3V0ID0gPHN0cmluZ1tdPnJlcXVlc3RbJ3F1ZXJ5X291dCddIHx8IFtdO1xuICAgIGZvciAobGV0IHEgb2YgcXVlcnlfb3V0KSB7XG4gICAgICBsZXQgcHJlZml4ID0gcVswXTtcbiAgICAgIGxldCBxX3N0ciA9IHEuc2xpY2UoMik7XG4gICAgICBpZiAoJC5pbkFycmF5KHByZWZpeCwgWydHJywgJ0InLCAnVyddKSA+IC0xKSB7XG4gICAgICAgIHRoaXMucXVlcmllc193YXRjaGVkW3Ffc3RyXSA9IHRydWU7XG4gICAgICAgIGlmICghIChxX3N0ciBpbiBxb19sb29rdXApKSB7XG4gICAgICAgICAgcW9fbG9va3VwW3Ffc3RyXSA9IHtxdWVyeTogcV9zdHIsIHN0YXR1czogJyd9O1xuICAgICAgICB9XG4gICAgICAgIHFvX2xvb2t1cFtxX3N0cl0uc3RhdHVzID0geydHJzonR09PRCcsICdCJzonQkFEJywgJ1cnOiAnV0FUQ0hFRCd9W3ByZWZpeF07XG4gICAgICAgIGlmIChxX3N0ciBpbiB0aGlzLnF1ZXJpZXNfaWdub3JlZCkge1xuICAgICAgICAgIGRlbGV0ZSB0aGlzLnF1ZXJpZXNfaWdub3JlZFtxX3N0cl07XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAocHJlZml4ID09ICdJJyAmJiAocV9zdHIgaW4gdGhpcy5xdWVyaWVzX3dhdGNoZWQpKSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLnF1ZXJpZXNfd2F0Y2hlZFtxX3N0cl07XG4gICAgICAgIHRoaXMucXVlcmllc19pZ25vcmVkW3Ffc3RyXSA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gcW9fbWFwIGhhcyBiZWVuIHRha2VuIGNhcmUgb2YgaW4gdXBkYXRlX3FpX2FuZF9xby5cbiAgLy8gVGhpcyBmdW5jdGlvbiBqdXN0IGZvY3VzZXMgb24gY29tcHV0aW5nIHRoZSByYW5raW5nIGFuZCBtYWludGFpbmluZyBoaXN0b3J5LlxuICAvLyBVcGRhdGVzIHRoaXMuc3RhdGUucXVlcnlfb3V0X3JlY29yZHMgdXBvbiBjb21wbGV0aW9uLlxuICAvLyBBbHNvIHVwZGF0ZXMgdGhlIGhpZGRlbiBsYXllciBzdGF0dXMgZm9yIHRoZSBtaWRkbGUgY29sdW1uLlxuICBwcml2YXRlIGNvbXB1dGVfcXVlcnlfcmVzdWx0KCkge1xuICAgIGlmICh0aGlzLnF1ZXJ5X2luLmxlbmd0aCA9PSAwKSB7XG4gICAgICB0aGlzLnN0YXRlLnF1ZXJ5X291dF9yZWNvcmRzID0gW107XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gRm9yIGNvbnZlbmllbmNlLlxuICAgIGxldCBoaWRkZW5fc2l6ZSA9IHRoaXMuc3RhdGUuY29uZmlnLmhpZGRlbl9zaXplO1xuICAgIGxldCB2b2NhYiA9IHRoaXMudm9jYWI7XG4gICAgbGV0IHZvY2FiX3NpemUgPSB0aGlzLnN0YXRlLnZvY2FiX3NpemU7XG4gICAgbGV0IHN5bjAgPSB0aGlzLnN5bjA7XG4gICAgbGV0IHF1ZXJ5X2luID0gdGhpcy5xdWVyeV9pbjtcbiAgICBsZXQgcWlfdmVjID0gdGhpcy5xaV92ZWM7XG4gICAgbGV0IHNjb3JlcyA9IHRoaXMuc2NvcmVzO1xuICAgIGxldCBpdGVyYXRpb25zID0gdGhpcy5zdGF0ZS5pbnN0YW5jZXM7XG4gICAgbGV0IHFvX2xvb2t1cCA9IHRoaXMucW9fbWFwW3RoaXMucWlfa2V5XTtcbiAgICBsZXQgcXVlcmllc193YXRjaGVkID0gdGhpcy5xdWVyaWVzX3dhdGNoZWQ7XG4gICAgdGhpcy5xX2lkeF9zZXQgPSB7fTtcbiAgICBsZXQgcV9pZHhfc2V0ID0gdGhpcy5xX2lkeF9zZXQ7XG4gICAgbGV0IGwyX3NxcnRzID0gdGhpcy5sMl9zcXJ0cztcblxuICAgIC8vIFVwZGF0ZSBxaV92ZWNcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IGhpZGRlbl9zaXplOyBqKyspICBxaV92ZWNbal0gPSAwO1xuICAgIGZvciAobGV0IHEgb2YgcXVlcnlfaW4pIHtcbiAgICAgIGxldCB3b3JkID0gcTtcbiAgICAgIGxldCBtaW51cyA9IGZhbHNlO1xuICAgICAgaWYgKHV0aWwuc3RhcnRzV2l0aChxLCAnLScpKSB7XG4gICAgICAgIG1pbnVzID0gdHJ1ZTtcbiAgICAgICAgd29yZCA9IHEuc2xpY2UoMSk7XG4gICAgICB9XG4gICAgICBsZXQgcWlkeCA9IHZvY2FiW3dvcmRdLmlkeDtcbiAgICAgIHFfaWR4X3NldFtxaWR4XSA9IHRydWU7XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGhpZGRlbl9zaXplOyBqKyspIHtcbiAgICAgICAgaWYgKG1pbnVzKSBxaV92ZWNbal0gLT0gc3luMFtxaWR4XVtqXTtcbiAgICAgICAgZWxzZSBxaV92ZWNbal0gKz0gc3luMFtxaWR4XVtqXTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gTm9ybWFsaXplIHFpX3ZlY1xuICAgIHtcbiAgICAgIGxldCBsMiA9IDA7XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGhpZGRlbl9zaXplOyBqKyspIGwyICs9IHFpX3ZlY1tqXSAqIHFpX3ZlY1tqXTtcbiAgICAgIGxldCBsMl9zcXJ0ID0gTWF0aC5zcXJ0KGwyKTtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgaGlkZGVuX3NpemU7IGorKykgcWlfdmVjW2pdIC89IGwyX3NxcnQ7XG4gICAgfVxuXG4gICAgLy8gQ29tcHV0ZSBzY29yZXNcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZvY2FiX3NpemU7IGkrKykge1xuICAgICAgaWYgKGkgaW4gcV9pZHhfc2V0KSB7XG4gICAgICAgIHNjb3Jlc1tpXSA9IDA7ICAvLyAocXVlcnkgd29yZHMgaGF2ZSBhIHNjb3JlIG9mIDApXG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgbGV0IHByb2QgPSAwO1xuICAgICAgbGV0IGwyID0gMDtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgaGlkZGVuX3NpemU7IGorKykge1xuICAgICAgICAgcHJvZCArPSBxaV92ZWNbal0gKiBzeW4wW2ldW2pdO1xuICAgICAgICAgbDIgKz0gc3luMFtpXVtqXSAqIHN5bjBbaV1bal07XG4gICAgICB9XG4gICAgICBsZXQgbDJfc3FydCA9IE1hdGguc3FydChsMik7XG4gICAgICBsMl9zcXJ0c1tpXSA9IGwyX3NxcnQ7XG4gICAgICBpZiAobDIgPT0gMCkgc2NvcmVzW2ldID0gMDtcbiAgICAgIGVsc2Ugc2NvcmVzW2ldID0gcHJvZCAvIGwyX3NxcnQ7XG4gICAgfVxuXG4gICAgLy8gR2V0IHJhbmtpbmdcbiAgICBsZXQgcWlfc2NvcmVzX3Vuc29ydGVkOiBTY29yZWRJdGVtW10gPSAkLm1hcChzY29yZXMsIChzY29yZSwgaSkgPT4ge3JldHVybiB7aWR4OiBpLCBzY29yZTogc2NvcmV9fSk7XG4gICAgbGV0IHFpX3Njb3JlcyA9IHFpX3Njb3Jlc191bnNvcnRlZC5zbGljZSgpLnNvcnQoKGEsYikgPT4gYi5zY29yZSAtIGEuc2NvcmUpO1xuICAgICQubWFwKHFpX3Njb3JlcywgKGl0ZW1fc2NvcmUsIGkpID0+IHtpdGVtX3Njb3JlLnJhbmsgPSBpfSk7XG4gICAgbGV0IHJhbmtfbG9va3VwOiB7W3dhdGNoZWRfaXRlbTpzdHJpbmddOiBudW1iZXJ9ID0ge307XG4gICAgZm9yIChsZXQgaXRlbV9zY29yZSBvZiBxaV9zY29yZXMpIHtcbiAgICAgIGxldCB3b3JkID0gdGhpcy5pbmRleDJ3b3JkW2l0ZW1fc2NvcmUuaWR4XTtcbiAgICAgIGlmICh3b3JkIGluIHF1ZXJpZXNfd2F0Y2hlZCkge1xuICAgICAgICByYW5rX2xvb2t1cFt3b3JkXSA9IGl0ZW1fc2NvcmUucmFuaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnFpX3Njb3Jlc191bnNvcnRlZCA9IHFpX3Njb3Jlc191bnNvcnRlZDtcbiAgICB0aGlzLnFpX3Njb3JlcyA9IHFpX3Njb3JlcztcblxuICAgIC8vIFVwZGF0ZSByYW5raW5nIGhpc3RvcnkgZm9yIHRoZSBmb2xsb3dpbmcgdGhyZWUgdHlwZXMgb2YgaXRlbXNcbiAgICAvLyAxLiB0b3AgTiByYW5rZWQgaXRlbXNcbiAgICAvLyAyLiB3YXRjaGVkIGl0ZW1zXG4gICAgLy8gMy4gaXRlbXMgcmFua2VkIG5lYXIgKCsvLTIpIHdhdGNoZWQgaXRlbXMgKFVQREFURTogTk9UIFVTRUQpXG4gICAgLy8gWzRdLiBleGNsdWRpbmcgaWdub3JlZCBpdGVtc1xuICAgIC8vIENyZWF0ZSByZWNvcmRzIGlmIG5vdCBleGlzdCBpbiBxb19tYXAgKHdoaWNoIG1lYW5zIHRoZSBzdGF0dXMgaXMgTk9STUFMLFxuICAgIC8vIGFzIG90aGVyIHdhdGNoZWQgaXRlbXMgaGF2ZSBhbHJlYWR5IGJlZW4gY3JlYXRlZCBpbiBxb19tYXApLlxuICAgIGxldCBxdWVyeV9vdXRfcmVjb3JkczogUXVlcnlPdXRSZWNvcmRbXSA9IFtdO1xuICAgIGxldCByYW5rc190b19zaG93OiBudW1iZXJbXSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgUkFOS19UT19TSE9XOyBpKyspIHJhbmtzX3RvX3Nob3cucHVzaChpKTtcbiAgICBmb3IgKGxldCB3b3JkIG9mIE9iamVjdC5rZXlzKHF1ZXJpZXNfd2F0Y2hlZCkpIHtcbiAgICAgIGlmICghICh3b3JkIGluIHJhbmtfbG9va3VwKSkgY29udGludWU7XG4gICAgICBpZiAodm9jYWJbd29yZF0uaWR4IGluIHFfaWR4X3NldCkgY29udGludWU7XG4gICAgICBsZXQgcmFuayA9IHJhbmtfbG9va3VwW3dvcmRdO1xuICAgICAgcmFua3NfdG9fc2hvdy5wdXNoKHJhbmspO1xuICAgICAgLy8gZm9yIChsZXQgaSA9IHJhbmsgLSAyOyBpIDw9IHJhbmsgKyAyOyBpKyspIHtcbiAgICAgIC8vICAgaWYgKGkgPCAwKSBjb250aW51ZTtcbiAgICAgIC8vICAgaWYgKGkgPj0gdm9jYWJfc2l6ZSkgY29udGludWU7XG4gICAgICAvLyAgIHJhbmtzX3RvX3Nob3cucHVzaChpKTtcbiAgICAgIC8vIH1cbiAgICB9XG4gICAgcmFua3NfdG9fc2hvdyA9IHVuaXFfZmFzdChyYW5rc190b19zaG93KVxuICAgICAgLmZpbHRlcihyYW5rID0+ICEodGhpcy5pbmRleDJ3b3JkW3FpX3Njb3Jlc1tyYW5rXS5pZHhdIGluIHRoaXMucXVlcmllc19pZ25vcmVkKSlcbiAgICAgIC5maWx0ZXIocmFuayA9PiAhKHFpX3Njb3Jlc1tyYW5rXS5pZHggaW4gcV9pZHhfc2V0KSlcbiAgICAgIC5zb3J0KCk7XG4gICAgZm9yIChsZXQgcmFuayBvZiByYW5rc190b19zaG93KSB7XG4gICAgICBsZXQgaXRlbV9zY29yZSA9IHFpX3Njb3Jlc1tyYW5rXTtcbiAgICAgIGxldCB3b3JkID0gdGhpcy5pbmRleDJ3b3JkW2l0ZW1fc2NvcmUuaWR4XTtcbiAgICAgIGxldCBzY29yZSA9IGl0ZW1fc2NvcmUuc2NvcmU7XG4gICAgICBpZiAoISh3b3JkIGluIHFvX2xvb2t1cCkpIHtcbiAgICAgICAgcW9fbG9va3VwW3dvcmRdID0ge3F1ZXJ5OiB3b3JkLCBzdGF0dXM6ICdOT1JNQUwnfTtcbiAgICAgIH1cbiAgICAgIGxldCByZWNvcmQgPSBxb19sb29rdXBbd29yZF07XG4gICAgICByZWNvcmQucmFuayA9IHJhbms7XG4gICAgICByZWNvcmQuc2NvcmUgPSBzY29yZTtcbiAgICAgIGlmICghIHJlY29yZC5yYW5rX2hpc3RvcnkpIHtcbiAgICAgICAgcmVjb3JkLnJhbmtfaGlzdG9yeSA9IFtdO1xuICAgICAgfVxuICAgICAgaWYgKHJlY29yZC5yYW5rX2hpc3RvcnkubGVuZ3RoID49IDEgJiYgcmVjb3JkLnJhbmtfaGlzdG9yeS5zbGljZSgtMSlbMF0uaXRlcmF0aW9uID09IGl0ZXJhdGlvbnMpIHtcbiAgICAgICAgcmVjb3JkLnJhbmtfaGlzdG9yeS5zbGljZSgtMSlbMF0ucmFuayA9IHJhbms7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZWNvcmQucmFua19oaXN0b3J5LnB1c2goe3Jhbms6IHJhbmssIGl0ZXJhdGlvbjogaXRlcmF0aW9uc30pO1xuICAgICAgfVxuICAgICAgcXVlcnlfb3V0X3JlY29yZHMucHVzaChyZWNvcmQpO1xuICAgIH1cbiAgICBxdWVyeV9vdXRfcmVjb3Jkcy5zb3J0KChhLGIpID0+IGEucmFuayAtIGIucmFuayk7XG5cbiAgICAvLyBTZXQgc3RhdGVcbiAgICB0aGlzLnN0YXRlLnF1ZXJ5X291dF9yZWNvcmRzID0gcXVlcnlfb3V0X3JlY29yZHM7XG4gICAgdGhpcy5zdGF0ZS5xaV92ZWMgPSBxaV92ZWM7XG5cbiAgICAvLyBBbW9uZyB0aGUgdG9wLU4gcmFua2VkIHJlc3VsdCwgZm9yIGVhY2ggZGltZW5zaW9uIG9mIHRoZSB2ZWN0b3IsIHJlLXJhbmtcbiAgICAvLyBieSBob3cgZXhjaXRlZCB0aGV5IGFyZS5cbiAgICBsZXQgcWlfc2NvcmVzX3RvcE4gPSBxaV9zY29yZXMuc2xpY2UoMCwgUkFOS19UT19DT05TSURFUl9GT1JfUEVSRElNKTtcbiAgICB0aGlzLnN0YXRlLnBlcl9kaW1fbmVpZ2hib3JzID0gW107XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBoaWRkZW5fc2l6ZTsgaisrKSB7XG4gICAgICBsZXQgcmVyYW5rZWRfaXRlbXM6IFF1ZXJ5T3V0UmVjb3JkW10gPSAkXG4gICAgICAgICAgLm1hcChxaV9zY29yZXNfdG9wTixcbiAgICAgICAgICAgICAgIHggPT4ge1xuICAgICAgICAgICAgICAgICBsZXQgc2NvcmUgPSAwO1xuICAgICAgICAgICAgICAgICBpZiAobDJfc3FydHNbeC5pZHhdID4gMCkge1xuICAgICAgICAgICAgICAgICAgIHNjb3JlID0gcWlfdmVjW2pdICogc3luMFt4LmlkeF1bal0gLyBsMl9zcXJ0c1t4LmlkeF07XG4gICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgIHF1ZXJ5OiB0aGlzLmluZGV4MndvcmRbeC5pZHhdLFxuICAgICAgICAgICAgICAgICAgc2NvcmU6IHNjb3JlfTtcbiAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgLnNvcnQoKGEsYik9PmIuc2NvcmUtYS5zY29yZSlcbiAgICAgICAgICAuc2xpY2UoMCwgUkFOS19UT19TSE9XKTtcbiAgICAgICB0aGlzLnN0YXRlLnBlcl9kaW1fbmVpZ2hib3JzLnB1c2gocmVyYW5rZWRfaXRlbXMpO1xuICAgIH1cbiAgfVxuXG4gIC8vIEdpdmVuIGFuIGFyYml0cmFyeSBxdWVyeSwgZG8gdGhlIGZvbGxvd2luZzpcbiAgLy8gMS4gZmluZCBpdHMgdmVjdG9yIChzeW4wIG5vcm1hbGl6ZWQpXG4gIC8vIDIuIGZpbmQgaXRzIG5lYXJlc3QgbmVpZ2hib3JzXG4gIC8vIDMuIGZpbmQgaXRzIHBlci1kaW0gbmVhcmVzdCBuZWlnaGJvcnMgKGZvciBob3ZlciBlZmZlY3RzKVxuICAvLyA0LiBmaW5kIGVsZW1lbnQtd2lzZSBwcm9kdWN0IG9mIFggYW5kIFlcbiAgLy8gNS4gZmluZCBuZWFyZXN0IG5laWdoYm9ycyBzaGFyZWQgYnkgWCBhbmQgWSAobGlrZSBwYWlyLXByb2ZpbGluZy4uLilcbiAgLy8gNi4gZmluZCBwZXItZGltIG5lYXJlc3QgbmVpZ2hib3JzIG9mIGVsZW1lbnQtd2lzZSBwcm9kdWN0IG9mIFggYW5kIFlcbiAgcHJpdmF0ZSBnZXRfcGFpcl9wcm9maWxlKHF1ZXJ5OiBzdHJpbmcpOiBQYWlyUHJvZmlsZSB7XG4gICAgbGV0IHN0YXRlID0gdGhpcy5zdGF0ZTtcbiAgICBsZXQgY29uZmlnID0gc3RhdGUuY29uZmlnO1xuICAgIGxldCBoaWRkZW5fc2l6ZSA9IGNvbmZpZy5oaWRkZW5fc2l6ZTtcbiAgICBsZXQgc3luMCA9IHRoaXMuc3luMDtcbiAgICBsZXQgbDJfc3FydHMgPSB0aGlzLmwyX3NxcnRzO1xuXG4gICAgbGV0IHFpX3ZlYyA9IHRoaXMucWlfdmVjO1xuICAgIGxldCBxb19pZHggPSB0aGlzLnZvY2FiW3F1ZXJ5XS5pZHg7XG4gICAgbGV0IHFvX3ZlY19yYXcgPSBzeW4wW3FvX2lkeF07ICAvLyB1bm5vcm1hbGl6ZWRcbiAgICBsZXQgcW9fdmVjID0gJC5tYXAocW9fdmVjX3JhdywgeD0+eCAvIGwyX3NxcnRzW3FvX2lkeF0pOyAgLy8gbm9ybWFsaXplZFxuXG4gICAgbGV0IGNvc2luZV93aXRoX3FvID0gKHc6IHN0cmluZywgaTogbnVtYmVyKTogU2NvcmVkSXRlbSA9PiB7XG4gICAgICBsZXQgc2NvcmUgPSAwO1xuICAgICAgaWYgKGkgIT0gcW9faWR4KSB7XG4gICAgICAgIGxldCBwcm9kID0gMDtcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBoaWRkZW5fc2l6ZTsgaisrKSB7XG4gICAgICAgICAgcHJvZCArPSBxb192ZWNbal0gKiBzeW4wW2ldW2pdO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsMl9zcXJ0c1tpXSA+IDApIHtcbiAgICAgICAgICBzY29yZSA9IHByb2QgLyBsMl9zcXJ0c1tpXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHtpZHg6IGksIHNjb3JlOiBzY29yZX07XG4gICAgfTtcbiAgICBsZXQgcW9fc2NvcmVzX3Vuc29ydGVkID0gJC5tYXAodGhpcy5pbmRleDJ3b3JkLCBjb3NpbmVfd2l0aF9xbyk7XG4gICAgbGV0IHFvX3Njb3JlcyA9IHFvX3Njb3Jlc191bnNvcnRlZC5zbGljZSgpLnNvcnQoKGEsYikgPT4gYi5zY29yZSAtIGEuc2NvcmUpO1xuICAgIGxldCBxb19uZWlnaGJvcnMgPSAkLm1hcChcbiAgICAgICAgICBxb19zY29yZXMuc2xpY2UoMCwgUkFOS19UT19TSE9XKSxcbiAgICAgICAgICBpdGVtID0+IHtyZXR1cm4ge3F1ZXJ5OiB0aGlzLmluZGV4MndvcmRbaXRlbS5pZHhdLCBzY29yZTogaXRlbS5zY29yZX19KTtcblxuICAgIGxldCBxb19zY29yZXNfdG9wTiA9IHFvX3Njb3Jlcy5zbGljZSgwLCBSQU5LX1RPX0NPTlNJREVSX0ZPUl9QRVJESU0pO1xuICAgIGxldCBxb19wZXJfZGltX25laWdoYm9ycyA9IFtdO1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgaGlkZGVuX3NpemU7IGorKykge1xuICAgICAgbGV0IHJlcmFua2VkX2l0ZW1zOiBRdWVyeU91dFJlY29yZFtdID0gJFxuICAgICAgICAubWFwKFxuICAgICAgICAgIHFvX3Njb3Jlc190b3BOLFxuICAgICAgICAgIHggPT4ge1xuICAgICAgICAgICAgbGV0IHNjb3JlID0gMDtcbiAgICAgICAgICAgIGlmIChsMl9zcXJ0c1t4LmlkeF0gPiAwKSB7XG4gICAgICAgICAgICAgIHNjb3JlID0gcW9fdmVjW2pdICogc3luMFt4LmlkeF1bal0gLyBsMl9zcXJ0c1t4LmlkeF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICBxdWVyeTogdGhpcy5pbmRleDJ3b3JkW3guaWR4XSxcbiAgICAgICAgICAgICAgc2NvcmU6IHNjb3JlXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgKVxuICAgICAgICAuc29ydCgoYSxiKSA9PiBiLnNjb3JlIC0gYS5zY29yZSlcbiAgICAgICAgLnNsaWNlKDAsIFJBTktfVE9fU0hPVyk7XG4gICAgICBxb19wZXJfZGltX25laWdoYm9ycy5wdXNoKHJlcmFua2VkX2l0ZW1zKTtcbiAgICB9XG5cbiAgICBsZXQgZWxlbXByb2RfdmVjID0gcWlfdmVjLm1hcCgodixpKSA9PiB2ICogcW9fdmVjW2ldKTsgIC8vIFggLiogWVxuICAgIGxldCBlbGVtc3VtX3ZlYyA9IHFpX3ZlYy5tYXAoKHYsaSkgPT4gdiArIHFvX3ZlY1tpXSk7ICAvLyBYICsgWVxuICAgIGVsZW1zdW1fdmVjID0gZ2V0Tm9ybWFsaXplZFZlYyhlbGVtc3VtX3ZlYyk7XG5cbiAgICBsZXQgY29zaW5lX3dpdGhfZWxlbXN1bSA9ICh3OiBzdHJpbmcsIGk6IG51bWJlcik6IFNjb3JlZEl0ZW0gPT4ge1xuICAgICAgbGV0IHNjb3JlID0gMDtcbiAgICAgIGlmIChpICE9IHFvX2lkeCAmJiAhIChpIGluIHRoaXMucV9pZHhfc2V0KSkge1xuICAgICAgICBsZXQgcHJvZCA9IDA7XG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgaGlkZGVuX3NpemU7IGorKykge1xuICAgICAgICAgIHByb2QgKz0gZWxlbXN1bV92ZWNbal0gKiBzeW4wW2ldW2pdO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsMl9zcXJ0c1tpXSA+IDApIHtcbiAgICAgICAgICBzY29yZSA9IHByb2QgLyBsMl9zcXJ0c1tpXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHtpZHg6IGksIHNjb3JlOiBzY29yZX07XG4gICAgfTtcbiAgICBsZXQgZWxlbXN1bV9zY29yZXMgPSAkLm1hcCh0aGlzLmluZGV4MndvcmQsIGNvc2luZV93aXRoX2VsZW1zdW0pO1xuXG5cbiAgICAvLyBSYW5rIGFuZCBmaWx0ZXIgd29yZHMgYnkgY28tY28tb2NjdXJyZW5jZSAob25seSBhcHBsaWNhYmxlIHRvIHRoZSBzaXR1YXRpb25cbiAgICAvLyB3aGVyZSB0aGUgcXVlcnkgaXMgYSB3YXRjaGVkIHdvcmQpLlxuICAgIGlmIChxdWVyeSBpbiB0aGlzLnRyYWluX2luc3RhbmNlX2xvZ19tYXApIHtcbiAgICAgIC8vIEZvciBlYWNoIHdvcmQgaW4gdm9jYWIsIGNvdW50IGhvdyBtYW55IHRpbWVzIGl0IGNvLW9jY3VycyB3aXRoIHF1ZXJ5X2luXG4gICAgICAvLyAoaS5lLiwgd29yZHMgaW4gcV9pZHhfc2V0KSA6PSBDMSwgYW5kIGhvdyBtYW55IHRpbWVzIGl0IGNvLW9jY3VycyB3aXRoXG4gICAgICAvLyBxdWVyeV9vdXQgOj0gQzIuIFNjb3JlIHRoZW0gYnkgQzEgKiBDMiwgYW5kIHJldGFpbiB0aGUgdG9wIE4gZm9yXG4gICAgICAvLyBzdWJzZXF1ZW50IGFuYWx5c2lzLlxuICAgICAgbGV0IEMxID0gW107ICAvLyBbd29yZF9pZHhdID0gY291bnRcbiAgICAgIGxldCBDMiA9IFtdOyAgLy8gW3dvcmRfaWR4XSA9IGNvdW50XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuc3RhdGUudm9jYWJfc2l6ZTsgaSsrKSB7XG4gICAgICAgIEMxLnB1c2goMSk7XG4gICAgICAgIEMyLnB1c2goMSk7XG4gICAgICB9XG4gICAgICBmb3IgKGxldCBxaWR4IGluIHRoaXMucV9pZHhfc2V0KSB7XG4gICAgICAgIGxldCBxID0gdGhpcy5pbmRleDJ3b3JkW3FpZHhdO1xuICAgICAgICBpZiAoISAocSBpbiB0aGlzLnRyYWluX2luc3RhbmNlX2xvZ19tYXApKSBjb250aW51ZTtcbiAgICAgICAgZm9yIChsZXQgbG9nIG9mIHRoaXMudHJhaW5faW5zdGFuY2VfbG9nX21hcFtxXSkge1xuICAgICAgICAgIEMxW3RoaXMudm9jYWJbbG9nLndvcmQyXS5pZHhdKys7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGZvciAobGV0IGxvZyBvZiB0aGlzLnRyYWluX2luc3RhbmNlX2xvZ19tYXBbcXVlcnldKSB7XG4gICAgICAgIEMyW3RoaXMudm9jYWJbbG9nLndvcmQyXS5pZHhdKys7XG4gICAgICB9XG4gICAgICBsZXQgQzEyID0gQzEubWFwKCh4LGkpPT57cmV0dXJuIHtzY29yZTooeCAqIEMyW2ldKSwgaWR4Oml9fSk7XG4gICAgICBDMTIuc29ydCgoYSxiKT0+KGIuc2NvcmUtYS5zY29yZSkpO1xuICAgICAgbGV0IEMxMl9maWx0ZXJlZCA9IEMxMlxuICAgICAgICAgIC5maWx0ZXIoeCA9PiB4LnNjb3JlID4gMSlcbiAgICAgICAgICAuc2xpY2UoMCwgUkFOS19UT19DT05TSURFUl9GT1JfUEVSRElNKTtcbiAgICAgIGVsZW1zdW1fc2NvcmVzID0gQzEyX2ZpbHRlcmVkLm1hcCh4ID0+IGVsZW1zdW1fc2NvcmVzW3guaWR4XSk7XG4gICAgfVxuXG4gICAgZWxlbXN1bV9zY29yZXMuc29ydCgoYSxiKSA9PiBiLnNjb3JlIC0gYS5zY29yZSk7XG4gICAgbGV0IGVsZW1zdW1fbmVpZ2hib3JzID0gJC5tYXAoXG4gICAgICAgICAgZWxlbXN1bV9zY29yZXMuc2xpY2UoMCwgUkFOS19UT19TSE9XKSxcbiAgICAgICAgICBpdGVtID0+IHtyZXR1cm4ge3F1ZXJ5OiB0aGlzLmluZGV4MndvcmRbaXRlbS5pZHhdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NvcmUxOiB0aGlzLnFpX3Njb3Jlc191bnNvcnRlZFtpdGVtLmlkeF0uc2NvcmUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBzY29yZTI6IHFvX3Njb3Jlc191bnNvcnRlZFtpdGVtLmlkeF0uc2NvcmV9fSk7XG5cbiAgICBsZXQgZWxlbXN1bV9zY29yZXNfdG9wTiA9IGVsZW1zdW1fc2NvcmVzLnNsaWNlKDAsIFJBTktfVE9fQ09OU0lERVJfRk9SX1BFUkRJTSk7XG4gICAgbGV0IGVsZW1zdW1fcGVyX2RpbV9uZWlnaGJvcnMgPSBbXTtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IGhpZGRlbl9zaXplOyBqKyspIHtcbiAgICAgIGxldCByZXJhbmtlZF9pdGVtczogUXVlcnlPdXRSZWNvcmRbXSA9ICRcbiAgICAgICAgLm1hcChcbiAgICAgICAgICBlbGVtc3VtX3Njb3Jlc190b3BOLFxuICAgICAgICAgIHggPT4ge1xuICAgICAgICAgICAgbGV0IHNjb3JlMSA9IDA7XG4gICAgICAgICAgICBsZXQgc2NvcmUyID0gMDtcbiAgICAgICAgICAgIGlmIChsMl9zcXJ0c1t4LmlkeF0gPiAwKSB7XG4gICAgICAgICAgICAgIHNjb3JlMSA9IHFpX3ZlY1tqXSAqIHN5bjBbeC5pZHhdW2pdIC8gbDJfc3FydHNbeC5pZHhdO1xuICAgICAgICAgICAgICBzY29yZTIgPSBxb192ZWNbal0gKiBzeW4wW3guaWR4XVtqXSAvIGwyX3NxcnRzW3guaWR4XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIHF1ZXJ5OiB0aGlzLmluZGV4MndvcmRbeC5pZHhdLFxuICAgICAgICAgICAgICBzY29yZTE6IHNjb3JlMSxcbiAgICAgICAgICAgICAgc2NvcmUyOiBzY29yZTJcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfVxuICAgICAgICApXG4gICAgICAgIC5zb3J0KChhLGIpID0+IGIuc2NvcmUxICsgYi5zY29yZTIgLSBhLnNjb3JlMSAtIGEuc2NvcmUyKVxuICAgICAgICAuc2xpY2UoMCwgUkFOS19UT19TSE9XKTtcbiAgICAgIGVsZW1zdW1fcGVyX2RpbV9uZWlnaGJvcnMucHVzaChyZXJhbmtlZF9pdGVtcyk7XG4gICAgfVxuXG4gICAgbGV0IG91dDogUGFpclByb2ZpbGUgPSB7XG4gICAgICBxbzogcXVlcnksXG4gICAgICBxb192ZWM6IHFvX3ZlYyxcbiAgICAgIHFvX25laWdoYm9yczogcW9fbmVpZ2hib3JzLFxuICAgICAgcW9fcGVyX2RpbV9uZWlnaGJvcnM6IHFvX3Blcl9kaW1fbmVpZ2hib3JzLFxuICAgICAgZWxlbXByb2Q6IGVsZW1wcm9kX3ZlYyxcbiAgICAgIGVsZW1zdW1fbmVpZ2hib3JzOiBlbGVtc3VtX25laWdoYm9ycyxcbiAgICAgIGVsZW1zdW1fcGVyX2RpbV9uZWlnaGJvcnM6IGVsZW1zdW1fcGVyX2RpbV9uZWlnaGJvcnNcbiAgICB9O1xuICAgIHJldHVybiBvdXQ7XG4gIH1cblxuICBwcml2YXRlIHRyYWluX3VudGlsX2JyZWFrcG9pbnQoKSB7XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIHRoaXMudHJhaW5fc2VudGVuY2UoKTtcbiAgICAgIGlmICh0aGlzLmJyZWFrcG9pbnRfdGltZSA+IDAgJiZcbiAgICAgICAgICBEYXRlLm5vdygpID49IHRoaXMuYnJlYWtwb2ludF90aW1lKSB7XG4gICAgICAgIHRoaXMuc2V0X3N0YXR1cygnQVVUT19CUkVBSycpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLmJyZWFrcG9pbnRfaXRlcmF0aW9ucyA+IDAgJiZcbiAgICAgICAgICB0aGlzLnN0YXRlLmluc3RhbmNlcyA+PSB0aGlzLmJyZWFrcG9pbnRfaXRlcmF0aW9ucykge1xuICAgICAgICB0aGlzLnNldF9zdGF0dXMoJ1VTRVJfQlJFQUsnKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5icmVha3BvaW50X2luc3RhbmNlc193YXRjaGVkID4gMCAmJlxuICAgICAgICAgIHRoaXMuY291bnRfaW5zdGFuY2VzX3dhdGNoZWQgPj0gdGhpcy5icmVha3BvaW50X2luc3RhbmNlc193YXRjaGVkKSB7XG4gICAgICAgIHRoaXMuc2V0X3N0YXR1cygnVVNFUl9CUkVBSycpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5jb21wdXRlX3F1ZXJ5X3Jlc3VsdCgpO1xuICB9XG5cbiAgcHJpdmF0ZSB0cmFpbl9zZW50ZW5jZSgpIHtcbiAgICBsZXQgc2VudGVuY2UgPSB0aGlzLnNlbnRlbmNlc1t0aGlzLnN0YXRlLnNlbnRlbmNlc107XG4gICAgbGV0IHdvcmRzID0gc2VudGVuY2Uuc3BsaXQoJyAnKTtcbiAgICBsZXQgY29uZmlnID0gdGhpcy5zdGF0ZS5jb25maWc7XG5cbiAgICAvLyBVcGRhdGUgbGVhcm5pbmcgcmF0ZVxuICAgIGxldCBwcm9ncmVzcyA9IE1hdGgubWluKDEsIHRoaXMuc3RhdGUuaW5zdGFuY2VzIC8gKHRoaXMuc3RhdGUuY29ycHVzX3NpemUgKiB0aGlzLnN0YXRlLmNvbmZpZy5pdGVyKSk7XG4gICAgdGhpcy5zdGF0ZS5sZWFybmluZ19yYXRlID0gY29uZmlnLmFscGhhIC0gKGNvbmZpZy5hbHBoYSAtIGNvbmZpZy5taW5fYWxwaGEpICogcHJvZ3Jlc3M7XG5cbiAgICAvLyBOT1RFOiBkb3duc2FtcGxpbmcgb21pdHRlZCBoZXJlIGZvciBzaW1wbGljaXR5XG4gICAgd29yZHMgPSB3b3Jkcy5maWx0ZXIodz0+KHcgaW4gdGhpcy52b2NhYikpO1xuICAgIHdvcmRzLmZvckVhY2goKHdvcmQsIHBvcykgPT4ge1xuICAgICAgbGV0IGlkeDEgPSB0aGlzLnZvY2FiW3dvcmRdLmlkeDtcbiAgICAgIGxldCByZWR1Y2VkX3dpbmRvdyA9IE1hdGgucm91bmQoZ2V0X3JhbmRvbV9mbG9hdCgpICogY29uZmlnLndpbmRvdyk7XG4gICAgICBsZXQgc3RhcnQgPSBNYXRoLm1heCgwLCBwb3MgLSBjb25maWcud2luZG93ICsgcmVkdWNlZF93aW5kb3cpO1xuICAgICAgbGV0IHdvcmRzX3JlZHVjZWRfd2luZG93ID0gd29yZHMuc2xpY2Uoc3RhcnQsIHBvcyArIGNvbmZpZy53aW5kb3cgKyAxIC0gcmVkdWNlZF93aW5kb3cpO1xuXG4gICAgICBpZiAoY29uZmlnLnNnKSB7XG4gICAgICAgIHdvcmRzX3JlZHVjZWRfd2luZG93LmZvckVhY2goKHdvcmQyLCBpKSA9PiB7XG4gICAgICAgICAgbGV0IHBvczIgPSBpICsgc3RhcnQ7XG4gICAgICAgICAgaWYgKHBvczIgIT0gcG9zKSB7XG4gICAgICAgICAgICBsZXQgaWR4MiA9IHRoaXMudm9jYWJbd29yZDJdLmlkeDtcbiAgICAgICAgICAgIGlmIChpZHgxICE9IGlkeDIpIHtcbiAgICAgICAgICAgICAgLy8gQWN0dWFsbHkgdHJhaW4gaXQuXG4gICAgICAgICAgICAgIGxldCBtb3ZlbWVudCA9IHRoaXMudHJhaW5fc2dfcGFpcihpZHgxLCBpZHgyKTtcblxuICAgICAgICAgICAgICAvLyBMb2cgdGhpcyB0cmFpbmluZyBpbnN0YW5jZS5cbiAgICAgICAgICAgICAgaWYgKHdvcmQyIGluIHRoaXMucXVlcmllc193YXRjaGVkIHx8IGlkeDIgaW4gdGhpcy5xX2lkeF9zZXQpIHtcbiAgICAgICAgICAgICAgICBsZXQgdHJhaW5faW5zdGFuY2VfbG9nOiBUcmFpbkluc3RhbmNlTG9nID0ge1xuICAgICAgICAgICAgICAgICAgd29yZDogd29yZDIsXG4gICAgICAgICAgICAgICAgICB3b3JkMjogd29yZCxcbiAgICAgICAgICAgICAgICAgIHNlbnRlbmNlX2lkOiB0aGlzLnN0YXRlLnNlbnRlbmNlcyxcbiAgICAgICAgICAgICAgICAgIGVwb2NoX2lkOiB0aGlzLnN0YXRlLmVwb2NocyxcbiAgICAgICAgICAgICAgICAgIHBvczogcG9zMixcbiAgICAgICAgICAgICAgICAgIHBvczI6IHBvcyxcbiAgICAgICAgICAgICAgICAgIGxlYXJuaW5nX3JhdGU6IHRoaXMuc3RhdGUubGVhcm5pbmdfcmF0ZSxcbiAgICAgICAgICAgICAgICAgIG1vdmVtZW50OiBtb3ZlbWVudFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoISAod29yZDIgaW4gdGhpcy50cmFpbl9pbnN0YW5jZV9sb2dfbWFwKSkge1xuICAgICAgICAgICAgICAgICAgdGhpcy50cmFpbl9pbnN0YW5jZV9sb2dfbWFwW3dvcmQyXSA9IFtdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnRyYWluX2luc3RhbmNlX2xvZ19tYXBbd29yZDJdLnB1c2godHJhaW5faW5zdGFuY2VfbG9nKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBDQk9XXG4gICAgICAgIGxldCB3b3JkMl9pbmRpY2VzID0gW107XG4gICAgICAgIHdvcmRzX3JlZHVjZWRfd2luZG93LmZvckVhY2goKHdvcmQyLCBpKSA9PiB7XG4gICAgICAgICAgbGV0IHBvczIgPSBpICsgc3RhcnQ7XG4gICAgICAgICAgaWYgKHBvczIgIT0gcG9zKSB7XG4gICAgICAgICAgICBsZXQgaWR4MiA9IHRoaXMudm9jYWJbd29yZDJdLmlkeDtcbiAgICAgICAgICAgIGlmIChpZHgxICE9IGlkeDIpIHtcbiAgICAgICAgICAgICAgd29yZDJfaW5kaWNlcy5wdXNoKHBvczIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGxldCBsMSA9IFtdO1xuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGNvbmZpZy5oaWRkZW5fc2l6ZTsgaisrKSBsMS5wdXNoKDApO1xuICAgICAgICBmb3IgKGxldCBpIG9mIHdvcmQyX2luZGljZXMpIGZvciAobGV0IGogPSAwOyBqIDwgY29uZmlnLmhpZGRlbl9zaXplOyBqKyspIGwxW2pdICs9IHRoaXMuc3luMFtpXVtqXTtcbiAgICAgICAgaWYgKGNvbmZpZy5jYm93X21lYW4gJiYgd29yZDJfaW5kaWNlcy5sZW5ndGggPiAwKSBmb3IgKGxldCBqID0gMDsgaiA8IGNvbmZpZy5oaWRkZW5fc2l6ZTsgaisrKSBsMVtqXSAvPSB3b3JkMl9pbmRpY2VzLmxlbmd0aDtcbiAgICAgICAgdGhpcy50cmFpbl9jYm93X3BhaXIodGhpcy52b2NhYlt3b3JkXS5pZHgsIHdvcmQyX2luZGljZXMsIGwxKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5zdGF0ZS5pbnN0YW5jZXMgKys7XG4gICAgICBpZiAod29yZCBpbiB0aGlzLnF1ZXJpZXNfd2F0Y2hlZCkgdGhpcy5jb3VudF9pbnN0YW5jZXNfd2F0Y2hlZCArKztcbiAgICB9KTtcblxuICAgIHRoaXMuc3RhdGUuc2VudGVuY2VzICsrO1xuICAgIGlmICh0aGlzLnN0YXRlLnNlbnRlbmNlcyA+PSB0aGlzLnN0YXRlLm51bV9zZW50ZW5jZXMpIHtcbiAgICAgIHRoaXMuc3RhdGUuc2VudGVuY2VzID0gMDtcbiAgICAgIHRoaXMuc3RhdGUuZXBvY2hzICsrO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgdHJhaW5fc2dfcGFpcih3X2lkeDogbnVtYmVyLCBjb250ZXh0X2lkeDogbnVtYmVyKSB7XG4gICAgaWYgKHdfaWR4ID09IGNvbnRleHRfaWR4KSByZXR1cm47XG4gICAgbGV0IGNvbmZpZyA9IHRoaXMuc3RhdGUuY29uZmlnO1xuICAgIGxldCB2b2NhYl9zaXplID0gdGhpcy5zdGF0ZS52b2NhYl9zaXplO1xuICAgIGxldCBzeW4wID0gdGhpcy5zeW4wO1xuICAgIGxldCBzeW4xID0gdGhpcy5zeW4xO1xuICAgIGxldCBsMSA9IHN5bjBbY29udGV4dF9pZHhdO1xuICAgIGxldCBuZXUxZSA9IFtdO1xuICAgIGxldCBsZWFybmluZ19yYXRlID0gdGhpcy5zdGF0ZS5sZWFybmluZ19yYXRlO1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgY29uZmlnLmhpZGRlbl9zaXplOyBqKyspIG5ldTFlLnB1c2goMCk7XG4gICAgZm9yIChsZXQgZCA9IDA7IGQgPCBjb25maWcubmVnYXRpdmUgKyAxOyBkKyspIHtcbiAgICAgIGxldCB0YXJnZXQ6IG51bWJlcjtcbiAgICAgIGxldCBsYWJlbDogbnVtYmVyO1xuICAgICAgaWYgKGQgPT0gMCkge1xuICAgICAgICB0YXJnZXQgPSB3X2lkeDtcbiAgICAgICAgbGFiZWwgPSAxO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGV0IHJhbmRvbSA9IGdldF9yYW5kb21fZmxvYXQoKSAqIENVTV9UQUJMRV9ET01BSU47XG4gICAgICAgIHRhcmdldCA9IGJTZWFyY2godGhpcy5jdW1fdGFibGUsIHJhbmRvbSk7XG4gICAgICAgIGlmICh0YXJnZXQgPT0gMCkgdGFyZ2V0ID0gTWF0aC5mbG9vcihnZXRfcmFuZG9tX2Zsb2F0KCkgKiBDVU1fVEFCTEVfRE9NQUlOKSAlICh2b2NhYl9zaXplIC0gMSkgKyAxO1xuICAgICAgICBpZiAodGFyZ2V0ID09IHdfaWR4KSBjb250aW51ZTtcbiAgICAgICAgbGFiZWwgPSAwO1xuICAgICAgfVxuICAgICAgbGV0IGwyID0gc3luMVt0YXJnZXRdO1xuICAgICAgbGV0IGYgPSAwO1xuICAgICAgbGV0IGc6IG51bWJlcjtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgY29uZmlnLmhpZGRlbl9zaXplOyBqKyspIGYgKz0gbDFbal0gKiBsMltqXTtcbiAgICAgIGlmIChmID4gTUFYX0VYUCkgZyA9IChsYWJlbCAtIDEpICogbGVhcm5pbmdfcmF0ZTtcbiAgICAgIGVsc2UgaWYgKGYgPCAtTUFYX0VYUCkgZyA9IChsYWJlbCAtIDApICogbGVhcm5pbmdfcmF0ZTtcbiAgICAgIGVsc2UgZyA9IChsYWJlbCAtIHRoaXMuZXhwX3RhYmxlW01hdGguZmxvb3IoKGYgKyBNQVhfRVhQKSAqIChFWFBfVEFCTEVfU0laRSAvIE1BWF9FWFAgLyAyKSldKSAqIGxlYXJuaW5nX3JhdGU7XG4gICAgICBpZiAoaXNOYU4oZykgfHwgIWlzRmluaXRlKGcpKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGcsIGwxLCBsMik7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVmFsdWVFcnJvciEnKTsgIC8vIGRlYnVnIG9ubHkgLi4uXG4gICAgICB9XG5cbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgY29uZmlnLmhpZGRlbl9zaXplOyBqKyspIG5ldTFlW2pdICs9IGcgKiBsMltqXTtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgY29uZmlnLmhpZGRlbl9zaXplOyBqKyspIGwyW2pdICs9IGcgKiBsMVtqXTtcbiAgICB9XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBjb25maWcuaGlkZGVuX3NpemU7IGorKykgbDFbal0gKz0gbmV1MWVbal07XG4gICAgcmV0dXJuIGdldEwyTm9ybShuZXUxZSk7ICAvLyBob3cgbXVjaCB0aGUgY29udGV4dF9pZHgncyB2ZWN0b3IgbW92ZXMuXG4gIH1cblxuICBwcml2YXRlIHRyYWluX2Nib3dfcGFpcih3X2lkeDogbnVtYmVyLCBjb250ZXh0X2lkeHM6IG51bWJlcltdLCBsMTogbnVtYmVyW10pIHtcbiAgICBsZXQgY29uZmlnID0gdGhpcy5zdGF0ZS5jb25maWc7XG4gICAgbGV0IHZvY2FiX3NpemUgPSB0aGlzLnN0YXRlLnZvY2FiX3NpemU7XG4gICAgbGV0IHN5bjAgPSB0aGlzLnN5bjA7XG4gICAgbGV0IHN5bjEgPSB0aGlzLnN5bjE7XG4gICAgbGV0IG5ldTFlID0gW107XG4gICAgbGV0IGxlYXJuaW5nX3JhdGUgPSB0aGlzLnN0YXRlLmxlYXJuaW5nX3JhdGU7XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBjb25maWcuaGlkZGVuX3NpemU7IGorKykgbmV1MWUucHVzaCgwKTtcbiAgICBmb3IgKGxldCBkID0gMDsgZCA8IGNvbmZpZy5uZWdhdGl2ZSArIDE7IGQrKykge1xuICAgICAgbGV0IHRhcmdldDogbnVtYmVyO1xuICAgICAgbGV0IGxhYmVsOiBudW1iZXI7XG4gICAgICBpZiAoZCA9PSAwKSB7XG4gICAgICAgIHRhcmdldCA9IHdfaWR4O1xuICAgICAgICBsYWJlbCA9IDE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsZXQgcmFuZG9tID0gZ2V0X3JhbmRvbV9mbG9hdCgpICogQ1VNX1RBQkxFX0RPTUFJTjtcbiAgICAgICAgdGFyZ2V0ID0gYlNlYXJjaCh0aGlzLmN1bV90YWJsZSwgcmFuZG9tKTtcbiAgICAgICAgaWYgKHRhcmdldCA9PSAwKSB0YXJnZXQgPSBNYXRoLmZsb29yKGdldF9yYW5kb21fZmxvYXQoKSAqIENVTV9UQUJMRV9ET01BSU4pICUgKHZvY2FiX3NpemUgLSAxKSArIDE7XG4gICAgICAgIGlmICh0YXJnZXQgPT0gd19pZHgpIGNvbnRpbnVlO1xuICAgICAgICBsYWJlbCA9IDA7XG4gICAgICB9XG4gICAgICBsZXQgbDIgPSBzeW4xW3RhcmdldF07XG4gICAgICBsZXQgZiA9IDA7XG4gICAgICBsZXQgZzogbnVtYmVyO1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBjb25maWcuaGlkZGVuX3NpemU7IGorKykgZiArPSBsMVtqXSAqIGwyW2pdO1xuICAgICAgaWYgKGYgPiBNQVhfRVhQKSBnID0gKGxhYmVsIC0gMSkgKiBsZWFybmluZ19yYXRlO1xuICAgICAgZWxzZSBpZiAoZiA8IC1NQVhfRVhQKSBnID0gKGxhYmVsIC0gMCkgKiBsZWFybmluZ19yYXRlO1xuICAgICAgZWxzZSBnID0gKGxhYmVsIC0gdGhpcy5leHBfdGFibGVbTWF0aC5mbG9vcigoZiArIE1BWF9FWFApICogKEVYUF9UQUJMRV9TSVpFIC8gTUFYX0VYUCAvIDIpKV0pICogbGVhcm5pbmdfcmF0ZTtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgY29uZmlnLmhpZGRlbl9zaXplOyBqKyspIG5ldTFlW2pdICs9IGcgKiBsMltqXTtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgY29uZmlnLmhpZGRlbl9zaXplOyBqKyspIGwyW2pdICs9IGcgKiBsMVtqXTtcbiAgICB9XG4gICAgZm9yIChsZXQgYSBvZiBjb250ZXh0X2lkeHMpIGZvciAobGV0IGogPSAwOyBqIDwgY29uZmlnLmhpZGRlbl9zaXplOyBqKyspIHN5bjBbYV1bal0gKz0gbmV1MWVbal07XG4gIH1cblxuICBwcml2YXRlIGdldF9pbmZsdWVudGlhbF90cmFpbl9pbnN0YW5jZXModzE6c3RyaW5nLCB3MjpzdHJpbmcpOiBUcmFpbkluc3RhbmNlU3VtbWFyeVtdIHtcbiAgICBpZiAoISAodzEgaW4gdGhpcy50cmFpbl9pbnN0YW5jZV9sb2dfbWFwKSkgcmV0dXJuIFtdO1xuICAgIGxldCB0cmFpbl9pbnN0YW5jZXMgPSB0aGlzXG4gICAgICAgIC50cmFpbl9pbnN0YW5jZV9sb2dfbWFwW3cxXVxuICAgICAgICAuZmlsdGVyKGQ9PihkLndvcmQyID09IHcyKSk7XG5cbiAgICAvLyBncm91cCBieSBzZW50ZW5jZV9pZFxuICAgIGxldCBieV9zZW50ZW5jZToge1tzZW50ZW5jZV9pZDogbnVtYmVyXToge1tlcG9jaF9pZDogbnVtYmVyXTogVHJhaW5JbnN0YW5jZUxvZ319ID0ge307XG4gICAgZm9yIChsZXQgaW5zdGFuY2Ugb2YgdHJhaW5faW5zdGFuY2VzKSB7XG4gICAgICBpZiAoIShpbnN0YW5jZS5zZW50ZW5jZV9pZCBpbiBieV9zZW50ZW5jZSkpIHtcbiAgICAgICAgYnlfc2VudGVuY2VbaW5zdGFuY2Uuc2VudGVuY2VfaWRdID0gW107XG4gICAgICB9XG4gICAgICBieV9zZW50ZW5jZVtpbnN0YW5jZS5zZW50ZW5jZV9pZF1baW5zdGFuY2UuZXBvY2hfaWRdID0gaW5zdGFuY2U7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIFRyYWluSW5zdGFuY2VTdW1tYXJ5IHBlciBzZW50ZW5jZV9pZFxuICAgIGxldCBzdW1tYXJpZXM6IFRyYWluSW5zdGFuY2VTdW1tYXJ5W10gPSBbXTtcbiAgICBmb3IgKGxldCBzZW50ZW5jZV9pZF8gaW4gYnlfc2VudGVuY2UpIHtcbiAgICAgIGxldCBzZW50ZW5jZV9pZCA9IHBhcnNlSW50KHNlbnRlbmNlX2lkXyk7XG4gICAgICBsZXQgc2VudGVuY2UgPSB0aGlzLnNlbnRlbmNlc1tzZW50ZW5jZV9pZF07XG4gICAgICBsZXQgbGVhcm5pbmdfcmF0ZXMgPSBbXTtcbiAgICAgIGxldCBtb3ZlbWVudHMgPSBbXTtcbiAgICAgIGxldCB0b3RhbF9tb3ZlbWVudCA9IDA7XG4gICAgICBsZXQgcG9zID0gLTE7XG4gICAgICBsZXQgcG9zMiA9IC0xO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnN0YXRlLmVwb2NoczsgaSsrKSB7XG4gICAgICAgIGxldCBsZWFybmluZ19yYXRlID0gMDtcbiAgICAgICAgbGV0IG1vdmVtZW50ID0gMDtcbiAgICAgICAgaWYgKGkgaW4gYnlfc2VudGVuY2Vbc2VudGVuY2VfaWRfXSkge1xuICAgICAgICAgIGxldCBpbnN0YW5jZSA9IGJ5X3NlbnRlbmNlW3NlbnRlbmNlX2lkX11baV07XG4gICAgICAgICAgbGVhcm5pbmdfcmF0ZSA9IGluc3RhbmNlLmxlYXJuaW5nX3JhdGU7XG4gICAgICAgICAgbW92ZW1lbnQgPSBpbnN0YW5jZS5tb3ZlbWVudDtcbiAgICAgICAgICBwb3MgPSBpbnN0YW5jZS5wb3M7XG4gICAgICAgICAgcG9zMiA9IGluc3RhbmNlLnBvczI7XG4gICAgICAgIH1cbiAgICAgICAgbGVhcm5pbmdfcmF0ZXMucHVzaChsZWFybmluZ19yYXRlKTtcbiAgICAgICAgbW92ZW1lbnRzLnB1c2gobW92ZW1lbnQpO1xuICAgICAgICB0b3RhbF9tb3ZlbWVudCArPSBtb3ZlbWVudDtcbiAgICAgIH1cbiAgICAgIHN1bW1hcmllcy5wdXNoKHtcbiAgICAgICAgdG90YWxfbW92ZW1lbnQ6IHRvdGFsX21vdmVtZW50LFxuICAgICAgICBzZW50ZW5jZTogc2VudGVuY2UsXG4gICAgICAgIHNlbnRlbmNlX2lkOiBzZW50ZW5jZV9pZCxcbiAgICAgICAgcG9zOiBwb3MsXG4gICAgICAgIHBvczI6IHBvczIsXG4gICAgICAgIGxlYXJuaW5nX3JhdGVzOiBsZWFybmluZ19yYXRlcyxcbiAgICAgICAgbW92ZW1lbnRzOiBtb3ZlbWVudHNcbiAgICAgIH0pO1xuICAgIH1cbiAgICBzdW1tYXJpZXMuc29ydCgoYSwgYikgPT4gYi50b3RhbF9tb3ZlbWVudCAtIGEudG90YWxfbW92ZW1lbnQpO1xuICAgIHJldHVybiBzdW1tYXJpZXMuc2xpY2UoMCwgUkFOS19UT19TSE9XKTtcbiAgfVxuXG4gIC8qXG4gIFVwZGF0ZXMgUENBIG1vZGVsIHVzaW5nIGN1cnJlbnQgd2F0Y2hlZCB0ZXJtcy5cbiAgUENBIGltcGxlbWVudGVkIGluIHBjYS5qc1xuICAqL1xuICBwcml2YXRlIHVwZGF0ZV9QQ0EoKSB7XG4gICAgbGV0IG1hdHJpeCA9IHRoaXMuZ2V0X1BDQV9tYXRyaXgoKTtcbiAgICBpZiAobWF0cml4Lmxlbmd0aCA9PSAwKSByZXR1cm47XG4gICAgbGV0IHBjYSA9IG5ldyBQQ0EoKTtcbiAgICBsZXQgbWF0cml4Tm9ybWFsaXplZCA9IHBjYS5zY2FsZShtYXRyaXgsIHRydWUsIHRydWUpO1xuICAgIHRoaXMucHJpbmNpcGFsX2NvbXBvbmVudHMgPSBwY2EucGNhKG1hdHJpeE5vcm1hbGl6ZWQpO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRfMkRfdmVjcygpIHtcbiAgICBsZXQgcGMwID0gdGhpcy5wcmluY2lwYWxfY29tcG9uZW50c1swXTtcbiAgICBsZXQgcGMxID0gdGhpcy5wcmluY2lwYWxfY29tcG9uZW50c1sxXTtcbiAgICBsZXQgdmVjdG9yUHJvamVjdGlvbnMgPSBbXTtcbiAgICBmb3IgKGxldCBxX2lkeCBpbiB0aGlzLnFfaWR4X3NldCkge1xuICAgICAgbGV0IHJvdyA9IHRoaXMuc3luMFtxX2lkeF07XG4gICAgICBsZXQgcHJvajAgPSBkb3RQcm9kdWN0KHBjMCwgcm93KTtcbiAgICAgIGxldCBwcm9qMSA9IGRvdFByb2R1Y3QocGMxLCByb3cpO1xuICAgICAgdmVjdG9yUHJvamVjdGlvbnMucHVzaCh7XG4gICAgICAgIHByb2owOiBwcm9qMCxcbiAgICAgICAgcHJvajE6IHByb2oxLFxuICAgICAgICB3b3JkOiB0aGlzLmluZGV4MndvcmRbcV9pZHhdLFxuICAgICAgICB0eXBlOiAnUVVFUllfSU4nXG4gICAgICB9KTtcbiAgICB9XG4gICAgZm9yIChsZXQgcmVjb3JkIG9mIHRoaXMuc3RhdGUucXVlcnlfb3V0X3JlY29yZHMpIHtcbiAgICAgIGxldCB3b3JkID0gcmVjb3JkLnF1ZXJ5O1xuICAgICAgbGV0IGlkeCA9IHRoaXMudm9jYWJbd29yZF0uaWR4O1xuICAgICAgaWYgKGlkeCBpbiB0aGlzLnFfaWR4X3NldCkgY29udGludWU7XG4gICAgICBsZXQgcm93ID0gdGhpcy5zeW4wW2lkeF07XG4gICAgICBsZXQgcHJvajAgPSBkb3RQcm9kdWN0KHBjMCwgcm93KTtcbiAgICAgIGxldCBwcm9qMSA9IGRvdFByb2R1Y3QocGMxLCByb3cpO1xuICAgICAgdmVjdG9yUHJvamVjdGlvbnMucHVzaCh7XG4gICAgICAgIHByb2owOiBwcm9qMCxcbiAgICAgICAgcHJvajE6IHByb2oxLFxuICAgICAgICB3b3JkOiB3b3JkLFxuICAgICAgICB0eXBlOiB0aGlzLnFvX21hcFt0aGlzLnFpX2tleV1bd29yZF0uc3RhdHVzXG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHZlY3RvclByb2plY3Rpb25zO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRfUENBX21hdHJpeCgpIHtcbiAgICByZXR1cm4gdGhpcy5zeW4wLnNsaWNlKDAsdGhpcy5zdGF0ZS5jb25maWcuaGlkZGVuX3NpemUrMSk7XG4gIH1cbn1cblxuLy8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy85MjI5NjQ1L1xuZnVuY3Rpb24gdW5pcV9mYXN0KGEpIHtcbiAgdmFyIHNlZW4gPSB7fTtcbiAgdmFyIG91dCA9IFtdO1xuICB2YXIgbGVuID0gYS5sZW5ndGg7XG4gIHZhciBqID0gMDtcbiAgZm9yKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgdmFyIGl0ZW0gPSBhW2ldO1xuICAgIGlmKHNlZW5baXRlbV0gIT09IDEpIHtcbiAgICAgIHNlZW5baXRlbV0gPSAxO1xuICAgICAgb3V0W2orK10gPSBpdGVtO1xuICAgIH1cbiAgfVxuICByZXR1cm4gb3V0O1xufVxuXG4vLyBlcXVpdmFsZW50IHRvIHB5dGhvbidzIGJpc2VjdF9sZWZ0LlxuLy8gaHR0cDovL2NvZGVyZXZpZXcuc3RhY2tleGNoYW5nZS5jb20vcXVlc3Rpb25zLzM5NTczL1xuZnVuY3Rpb24gYlNlYXJjaCh4czogbnVtYmVyW10sIHg6IG51bWJlcik6IG51bWJlciB7XG4gICAgdmFyIGJvdCA9IDA7XG4gICAgdmFyIHRvcCA9IHhzLmxlbmd0aDtcbiAgICBpZiAoeHMubGVuZ3RoID09IDApIHJldHVybiAwO1xuICAgIGVsc2UgaWYgKHggPiB4c1t4cy5sZW5ndGggLSAxXSkgcmV0dXJuIHhzLmxlbmd0aDtcbiAgICBlbHNlIGlmICh4IDwgeHNbMF0pIHJldHVybiAwO1xuICAgIHdoaWxlIChib3QgPCB0b3ApIHtcbiAgICAgICAgdmFyIG1pZCA9IE1hdGguZmxvb3IoKGJvdCArIHRvcCkgLyAyKTtcbiAgICAgICAgdmFyIGMgPSB4c1ttaWRdIC0geDtcbiAgICAgICAgaWYgKGMgPT09IDApIHJldHVybiBtaWQ7XG4gICAgICAgIGlmIChjIDwgMCkgYm90ID0gbWlkICsgMTtcbiAgICAgICAgaWYgKDAgPCBjKSB0b3AgPSBtaWQ7XG4gICAgfVxuICAgIHJldHVybiBib3Q7XG59XG5cbmludGVyZmFjZSBTY29yZWRJdGVtIHtcbiAgICAgIGlkeDogbnVtYmVyO1xuICAgICAgc2NvcmU6IG51bWJlcjtcbiAgICAgIHJhbms/OiBudW1iZXI7XG59XG5cbmZ1bmN0aW9uIGdldEwyTm9ybSh2ZWM6IG51bWJlcltdKSB7XG4gIGxldCBzdW0gPSAwO1xuICBmb3IgKGxldCB2IG9mIHZlYykge1xuICAgIHN1bSArPSB2ICogdjtcbiAgfVxuICByZXR1cm4gTWF0aC5zcXJ0KHN1bSk7XG59XG5cbmZ1bmN0aW9uIGdldE5vcm1hbGl6ZWRWZWModmVjOiBudW1iZXJbXSk6IG51bWJlcltdIHtcbiAgbGV0IGwybm9ybSA9IGdldEwyTm9ybSh2ZWMpO1xuICBpZiAobDJub3JtID09IDApIHJldHVybiB2ZWM7XG4gIHJldHVybiB2ZWMubWFwKHY9PnYvbDJub3JtKTtcbn1cblxuZnVuY3Rpb24gZG90UHJvZHVjdCh2ZWMxLCB2ZWMyKSB7XG4gIGlmICh2ZWMxLmxlbmd0aCAhPSB2ZWMyLmxlbmd0aCkge1xuICAgIHRocm93IG5ldyBFcnJvcignZGltZW5zaW9uIG1pc21hdGNoLicpO1xuICB9XG4gIGxldCBvdXQgPSAwO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHZlYzEubGVuZ3RoOyBpKyspIHtcbiAgICBvdXQgKz0gdmVjMVtpXSAqIHZlYzJbaV07XG4gIH1cbiAgcmV0dXJuIG91dDtcbn1cblxuLy8gVXNlZCBmb3IgaW50ZXJuYWwgbG9nZ2luZ1xuaW50ZXJmYWNlIFRyYWluSW5zdGFuY2VMb2cge1xuICB3b3JkOiBzdHJpbmc7XG4gIHdvcmQyOiBzdHJpbmc7XG4gIHNlbnRlbmNlX2lkOiBudW1iZXI7XG4gIGVwb2NoX2lkOiBudW1iZXI7XG4gIHBvczogbnVtYmVyO1xuICBwb3MyOiBudW1iZXI7XG4gIGxlYXJuaW5nX3JhdGU6IG51bWJlcjtcbiAgbW92ZW1lbnQ6IG51bWJlcjtcbn1cblxuLy8gVXNlZCB0byBjb21tdW5pY2F0ZSB3aXRoIGZyb250ZW5kXG5leHBvcnQgaW50ZXJmYWNlIFRyYWluSW5zdGFuY2VTdW1tYXJ5IHtcbiAgdG90YWxfbW92ZW1lbnQ6IG51bWJlcjtcbiAgc2VudGVuY2U6IHN0cmluZztcbiAgc2VudGVuY2VfaWQ6IG51bWJlcjtcbiAgcG9zOiBudW1iZXI7XG4gIHBvczI6IG51bWJlcjtcbiAgbGVhcm5pbmdfcmF0ZXM6IG51bWJlcltdO1xuICBtb3ZlbWVudHM6IG51bWJlcltdO1xufVxuIiwiLypcbkltcGxlbWVudGF0aW9uIHBhcnRpYWxseSBib3Jyb3dlZCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS90ZW5zb3JmbG93L3BsYXlncm91bmQvXG5Nb2RpZmljYXRpb24gQ29weXJpZ2h0OiAoMjAxNikgWGluIFJvbmcuIExpY2Vuc2U6IE1JVC5cblxuT3JpZ2luYWwgZmlsZSBjb3B5cmlnaHQ6XG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbkNvcHlyaWdodCAyMDE2IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEtleUZyb21WYWx1ZShvYmo6IGFueSwgdmFsdWU6IGFueSk6IHN0cmluZyB7XG4gIGZvciAobGV0IGtleSBpbiBvYmopIHtcbiAgICBpZiAob2JqW2tleV0gPT09IHZhbHVlKSB7XG4gICAgICByZXR1cm4ga2V5O1xuICAgIH1cbiAgfVxuICByZXR1cm4gdW5kZWZpbmVkO1xufVxuXG4vKipcbiAqIFRoZSBkYXRhIHR5cGUgb2YgYSBzdGF0ZSB2YXJpYWJsZS4gVXNlZCBmb3IgZGV0ZXJtaW5pbmcgdGhlXG4gKiAoZGUpc2VyaWFsaXphdGlvbiBtZXRob2QuXG4gKi9cbmV4cG9ydCBlbnVtIFR5cGUge1xuICBTVFJJTkcsXG4gIE5VTUJFUixcbiAgQVJSQVlfTlVNQkVSLFxuICBBUlJBWV9TVFJJTkcsXG4gIEJPT0xFQU4sXG4gIE9CSkVDVFxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFByb3BlcnR5IHtcbiAgbmFtZTogc3RyaW5nO1xuICB0eXBlOiBUeXBlO1xuICBrZXlNYXA/OiB7W2tleTogc3RyaW5nXTogYW55fTtcbn07XG5cbmV4cG9ydCBjbGFzcyBVSVN0YXRlIHtcbiAgcHJpdmF0ZSBzdGF0aWMgUFJPUFM6IFByb3BlcnR5W10gPSBbXG4gICAge25hbWU6IFwibW9kZWxcIiwgdHlwZTogVHlwZS5TVFJJTkd9LFxuICAgIHtuYW1lOiBcImJhY2tlbmRcIiwgdHlwZTogVHlwZS5TVFJJTkd9LFxuICAgIHtuYW1lOiAncXVlcnlfaW4nLCB0eXBlOiBUeXBlLkFSUkFZX1NUUklOR30sXG4gICAge25hbWU6ICdxdWVyeV9vdXQnLCB0eXBlOiBUeXBlLkFSUkFZX1NUUklOR31cbiAgXTtcblxuICBba2V5OiBzdHJpbmddOiBhbnk7XG4gIG1vZGVsID0gXCJ3b3JkMnZlY1wiOyAgLy8gdXNlZnVsIG9ubHkgd2hlbiBiYWNrZW5kID09ICdicm93c2VyJ1xuICBiYWNrZW5kID0gXCJicm93c2VyXCI7XG4gIHF1ZXJ5X2luOiBzdHJpbmdbXSA9IFtdO1xuICBxdWVyeV9vdXQ6IHN0cmluZ1tdID0gW107XG4gIC8qKlxuICAgKiBEZXNlcmlhbGl6ZXMgdGhlIHN0YXRlIGZyb20gdGhlIHVybCBoYXNoLlxuICAgKi9cbiAgc3RhdGljIGRlc2VyaWFsaXplU3RhdGUoKTogVUlTdGF0ZSB7XG4gICAgbGV0IG1hcDoge1trZXk6IHN0cmluZ106IHN0cmluZ30gPSB7fTtcbiAgICBmb3IgKGxldCBrZXl2YWx1ZSBvZiB3aW5kb3cubG9jYXRpb24uaGFzaC5zbGljZSgxKS5zcGxpdChcIiZcIikpIHtcbiAgICAgIGxldCBbbmFtZSwgdmFsdWVdID0ga2V5dmFsdWUuc3BsaXQoXCI9XCIpO1xuICAgICAgbWFwW25hbWVdID0gdmFsdWU7XG4gICAgfVxuICAgIGxldCBzdGF0ZSA9IG5ldyBVSVN0YXRlKCk7XG5cbiAgICBmdW5jdGlvbiBoYXNLZXkobmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgICByZXR1cm4gbmFtZSBpbiBtYXAgJiYgbWFwW25hbWVdICE9IG51bGwgJiYgbWFwW25hbWVdLnRyaW0oKSAhPT0gXCJcIjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZUFycmF5KHZhbHVlOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gICAgICByZXR1cm4gdmFsdWUudHJpbSgpID09PSBcIlwiID8gW10gOiB2YWx1ZS5zcGxpdChcIixcIik7XG4gICAgfVxuXG4gICAgLy8gRGVzZXJpYWxpemUgcmVndWxhciBwcm9wZXJ0aWVzLlxuICAgIFVJU3RhdGUuUFJPUFMuZm9yRWFjaCgoe25hbWUsIHR5cGUsIGtleU1hcH0pID0+IHtcbiAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICBjYXNlIFR5cGUuT0JKRUNUOlxuICAgICAgICAgIGlmIChrZXlNYXAgPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJBIGtleS12YWx1ZSBtYXAgbXVzdCBiZSBwcm92aWRlZCBmb3Igc3RhdGUgXCIgK1xuICAgICAgICAgICAgICAgIFwidmFyaWFibGVzIG9mIHR5cGUgT2JqZWN0XCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoaGFzS2V5KG5hbWUpICYmIG1hcFtuYW1lXSBpbiBrZXlNYXApIHtcbiAgICAgICAgICAgIHN0YXRlW25hbWVdID0ga2V5TWFwW21hcFtuYW1lXV07XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFR5cGUuTlVNQkVSOlxuICAgICAgICAgIGlmIChoYXNLZXkobmFtZSkpIHtcbiAgICAgICAgICAgIC8vIFRoZSArIG9wZXJhdG9yIGlzIGZvciBjb252ZXJ0aW5nIGEgc3RyaW5nIHRvIGEgbnVtYmVyLlxuICAgICAgICAgICAgc3RhdGVbbmFtZV0gPSArbWFwW25hbWVdO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBUeXBlLlNUUklORzpcbiAgICAgICAgICBpZiAoaGFzS2V5KG5hbWUpKSB7XG4gICAgICAgICAgICBzdGF0ZVtuYW1lXSA9IG1hcFtuYW1lXTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgVHlwZS5CT09MRUFOOlxuICAgICAgICAgIGlmIChoYXNLZXkobmFtZSkpIHtcbiAgICAgICAgICAgIHN0YXRlW25hbWVdID0gKG1hcFtuYW1lXSA9PT0gXCJmYWxzZVwiID8gZmFsc2UgOiB0cnVlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgVHlwZS5BUlJBWV9OVU1CRVI6XG4gICAgICAgICAgaWYgKG5hbWUgaW4gbWFwKSB7XG4gICAgICAgICAgICBzdGF0ZVtuYW1lXSA9IHBhcnNlQXJyYXkobWFwW25hbWVdKS5tYXAoTnVtYmVyKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgVHlwZS5BUlJBWV9TVFJJTkc6XG4gICAgICAgICAgaWYgKG5hbWUgaW4gbWFwKSB7XG4gICAgICAgICAgICBzdGF0ZVtuYW1lXSA9IHBhcnNlQXJyYXkobWFwW25hbWVdKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhyb3cgRXJyb3IoXCJFbmNvdW50ZXJlZCBhbiB1bmtub3duIHR5cGUgZm9yIGEgc3RhdGUgdmFyaWFibGVcIik7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gc3RhdGU7XG4gIH1cblxuICAvKipcbiAgICogU2VyaWFsaXplcyB0aGUgc3RhdGUgaW50byB0aGUgdXJsIGhhc2guXG4gICAqL1xuICBzZXJpYWxpemUoKSB7XG4gICAgLy8gU2VyaWFsaXplIHJlZ3VsYXIgcHJvcGVydGllcy5cbiAgICBsZXQgcHJvcHM6IHN0cmluZ1tdID0gW107XG4gICAgVUlTdGF0ZS5QUk9QUy5mb3JFYWNoKCh7bmFtZSwgdHlwZSwga2V5TWFwfSkgPT4ge1xuICAgICAgbGV0IHZhbHVlID0gdGhpc1tuYW1lXTtcbiAgICAgIC8vIERvbid0IHNlcmlhbGl6ZSBtaXNzaW5nIHZhbHVlcy5cbiAgICAgIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmICh0eXBlID09PSBUeXBlLk9CSkVDVCkge1xuICAgICAgICB2YWx1ZSA9IGdldEtleUZyb21WYWx1ZShrZXlNYXAsIHZhbHVlKTtcbiAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gVHlwZS5BUlJBWV9OVU1CRVIgfHxcbiAgICAgICAgICB0eXBlID09PSBUeXBlLkFSUkFZX1NUUklORykge1xuICAgICAgICB2YWx1ZSA9IHZhbHVlLmpvaW4oXCIsXCIpO1xuICAgICAgfVxuICAgICAgcHJvcHMucHVzaChgJHtuYW1lfT0ke3ZhbHVlfWApO1xuICAgIH0pO1xuICAgIHdpbmRvdy5sb2NhdGlvbi5oYXNoID0gcHJvcHMuam9pbihcIiZcIik7XG4gIH1cbn1cblxuLy8gVGhlIHByb3BlcnRpZXMgaGVyZSBuZWVkIG5vdCBiZSBzeW5jZWQgdmlhIFVSTC5cbi8vIGkuZS4sIG9uY2UgdGhlIHVzZXIgcmVmcmVzaHNlcyB0aGUgcGFnZSwgaXQncyBnb25lLlxuZXhwb3J0IGNsYXNzIFVJU3RhdGVIaWRkZW4ge1xuICBoYXNfc2V0dXBfcXVlcnlfY29sdW1uOiBib29sZWFuID0gZmFsc2U7XG4gIGlzX3F1ZXJ5aW5fdmFsaWQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgc2tpcF9yZXNldF9vbl9oYXNoY2hhbmdlOiBib29sZWFuID0gZmFsc2U7ICAvLyBlZmZlY3RpdmUgb25jZSBvbmx5XG4gIHFvX3N2ZzogZDMuU2VsZWN0aW9uPGFueT47ICAvLyBxdWVyeS1vdXQgc3ZnXG4gIGlzX3RvX3BhdXNlX3RyYWluaW5nOiBib29sZWFuID0gZmFsc2U7XG4gIGlzX21vZGVsX2J1c3lfdHJhaW5pbmc6IGJvb2xlYW4gPSBmYWxzZTtcbn1cbiIsImV4cG9ydCBmdW5jdGlvbiBzdGFydHNXaXRoKHM6IHN0cmluZywgcHJlZml4OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIHMuc3Vic3RyKDAsIHByZWZpeC5sZW5ndGgpID09IHByZWZpeDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVuZHNXaXRoKHM6IHN0cmluZywgc3VmZml4OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIHMuc3Vic3RyKC1zdWZmaXgubGVuZ3RoKSA9PT0gc3VmZml4O1xufVxuXG4vLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzE3MDE4OTgvXG5leHBvcnQgZnVuY3Rpb24gaXNVcmwoczogc3RyaW5nKSB7XG4gICB2YXIgcmVnZXhwID0gLyhodHRwfGh0dHBzKTpcXC9cXC8oXFx3Kzp7MCwxfVxcdypAKT8oXFxTKykoOlswLTldKyk/KFxcL3xcXC8oW1xcdyMhOi4/Kz0mJUAhXFwtXFwvXSkpPy9cbiAgIHJldHVybiByZWdleHAudGVzdChzKTtcbn1cblxuLy8gSW5wdXQ6IG5ldXJhbCBleGNpdGVtZW50IGxldmVsLCBjYW4gYmUgcG9zaXRpdmUsIG5lZ2F0aXZlXG4vLyBPdXRwdXQ6IGEgdmFsdWUgYmV0d2VlbiAwIGFuZCAxLCBmb3IgZGlzcGxheVxuZXhwb3J0IGZ1bmN0aW9uIGV4Y2l0ZVZhbHVlVG9OdW0oeDogbnVtYmVyKTogbnVtYmVyIHtcbiAgeCA9IHggKiA1OyAgLy8gZXhhZ2dlcmF0ZSBpdCBhIGJpdFxuICByZXR1cm4gMSAvICgxK01hdGguZXhwKC14KSk7ICAvLyBzaWdtb2lkXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBleGNpdGVWYWx1ZVRvQ29sb3IoeDogbnVtYmVyKTogYW55IHtcbiAgcmV0dXJuIG51bVRvQ29sb3IoZXhjaXRlVmFsdWVUb051bSh4KSk7XG59XG5cbmxldCBjb2xvcnM6IGFueTtcbmNvbG9ycyA9IFtcIiM0MjdEQThcIiwgXCIjNjk5OEJCXCIsIFwiIzkxQjNDRFwiLCBcIiNCQUQwRTBcIixcbiAgICAgICAgICAgICAgICBcIiNFMUVDRjNcIiwgXCIjRkFERUUwXCIsIFwiI0YyQjVCQVwiLCBcIiNFQThCOTJcIixcbiAgICAgICAgICAgICAgICBcIiNFMjYzNkNcIiwgXCIjREIzQjQ3XCJdO1xubGV0IG51bVRvQ29sb3IgPSBkMy5zY2FsZS5saW5lYXIoKVxuICAgIC5kb21haW4oZDMucmFuZ2UoMCwgMSwgMSAvIChjb2xvcnMubGVuZ3RoIC0gMSkpKVxuICAgIC5yYW5nZShjb2xvcnMpO1xuIl19
