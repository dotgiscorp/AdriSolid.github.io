///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 - 2017 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define([
    'dojo/_base/declare',
    'dijit/_WidgetBase',
    'dojo/_base/lang',
    'dojo/dom-style',
    'dojo/dom-geometry',
    'dojo/Evented',
    'libs/echarts/echarts',
    'jimu/utils',
    './_chartUtils',
    './_Gauge',
    'libs/echarts/light',
    'libs/echarts/dark'
  ],
  function(declare, _WidgetBase, lang, domStyle, domGeom, Evented, echarts, jimuUtils, chartUtils, Gauge) {

    return declare([_WidgetBase, Evented], {
      'baseClass': 'jimu-dijit-chart',
      templateString: '<div></div>',
      declaredClass: 'jimu.dijit.chart',
      // constructor -> this.config, this.chartDom

      //public methods:
      //setConfig -> update the option of this.chart.
      //updateConfig -> update this.config's value
      //clear -> Removes all components and charts in this.chart.
      //resize -> Resizes chart, which should be called manually when container size changes.

      //config params:
      // "type": "bar", //"column", "line", "pie", "radar", "funnel", "gauge"
      // "title": "string",
      // "legend": "boolean",
      // "hidexAxis":"boolean",
      // "hideyAxis":"boolean",
      // "confine":boolean,//Whether the tooltip is limited to canvas tag
      // "theme":"",//A registered theme name, light or dark
      // "toolbox": ["saveAsImage", "restore", "dataView", "magicType"],
      // "color":[],//[#fff]
      // "backgroundColor": "#fff",
      // "scale": true, //if stack = true,  force scale = false, if dataZoom is setted, force scale = true
      // "dataZoom": ["slider"], //inside
      // "events": [{
      //   "name": "", //"click"、"dblclick"、"mousedown"、"mousemove"、"mouseup"、"mouseover"、"mouseout"
      //   "callback": "function (params) {}"
      // }],
      // "labels": [],
      // "series": [{}], //series:[{name,data:[number or serie obj}]
      // /**pie*/
      // "innerRadius": "*%",
      // "labelLine": "boolean",
      // /**bar line colmun*/
      // "stack": true,
      // "axisPointer": true,
      // /**funnel*/
      // "funnelSort": "descending",
      // /**funnel gauge*/
      // "min": 0,
      // //funnel gauge
      // "max": 100,
      // /**radar*/
      // "radarShape": "circle", //["circle", "polygon"],
      // "indicator": [{}], //{name,max} only for radar
      // /**gauge*/
      // shape:"curved" //horizontal,vertical,curved
      // "gaugeOption": {
      //   "columnColor":"#000",
      //   "bgColor":"",
      //   "valueStyle":{
      //     textStyle:{
      //       color:"#fff",
      //       fontSize:20,
      //       fontWeight:'bold',
      //       fontStyle:'italic',
      //       fontFamily:'Avenir Next'
      //     },
      //     formatter:'function'
      //   },
      //   "labelColor":"#000",
      //   "targetValue:[]",
      //   "showDataRangeLabel":boolean,
      //   "showTargetValueLabel":boolean,
      // },
      // /**advance option*/
      // "advanceOption": {}
      config: null,
      validConfig: {
        type: ['column', 'bar', 'line', 'pie', 'radar', 'funnel', 'gauge'],
        common: ['type', 'title', 'labels', 'legend', 'confine', 'toolbox', 'color', 'theme',
          'backgroundColor', 'scale', 'dataZoom',
          'events', 'series', 'advanceOption'
        ],
        axisChart: ['stack', 'axisPointer', 'hidexAxis', 'hideyAxis'],
        pie: ['innerRadius', 'labelLine'],
        funnel: ['min', 'max', 'funnelSort'],
        gauge: ['shape', 'min', 'max', 'gaugeOption'],
        radar: ['radarShape', 'indicator']
      },
      defaultConfiguration: {
        series: {
          pieSeries: [{
            type: 'pie',
            radius: [0, '70%'],
            labelLine: {
              normal: {
                show: true,
                length: 5,
                length2: 5
              }
            },
            data: []
          }],
          funnelSeries: [{
            type: 'funnel',
            minSize: '0%',
            maxSize: '100%',
            sort: 'descending', //ascending
            data: []
          }]
        },
        toolboxs: {
          dataView: {
            title: 'Data view',
            readOnly: false
          },
          magicType: {
            title: {
              line: 'switch to line',
              bar: 'switch to bar',
              stack: 'switch to stack',
              tiled: 'switch to tiled'
            },
            type: ['line', 'bar', 'stack', 'tiled']
          },
          restore: {
            title: 'restore'
          },
          saveAsImage: {
            title: 'save as image'
          }
        }
      },
      postCreate: function() {
        this.inherited(arguments);
        if (this.chartDom) {
          var box = domGeom.getMarginBox(this.chartDom);
          if (box.w === 0) {
            box.w = 10;
          }
          if (box.h === 0) {
            box.h = 10;
          }
          domStyle.set(this.domNode, {
            width: box.w + 'px',
            height: box.h + 'px'
          });
        } else {
          console.warn('No valid chart dom!');
          domStyle.set(this.domNode, {
            width: '10px',
            height: '10px'
          });
        }
        //init chart and gauge
        this.gauge = new Gauge();
        this.chart = echarts.init(this.domNode, this.config.theme || 'light');
        this.gauge.setChart(this.chart);
        this.setConfig();
      },

      updateConfig: function(config) {
        if (jimuUtils.isNotEmptyObject(config)) {
          lang.mixin(this.config, config);
          var option = this._chartFactory(this.config);
          this.chart.setOption(option);
          if (this.config.shape && this.config.shape !== 'curved') {
            this.gauge._resetGraphic(this.config);
          }
          return true;
        } else {
          return false;
        }
      },

      setConfig: function(config) {
        if (jimuUtils.isNotEmptyObject(config)) {
          this.config = config;
        } else {
          this.config = this.config || {};
        }
        if (!this._checkConfig(this.config)) {
          return false;
        }
        this._customTheme();
        this.clear();
        this.chart.setOption(this._chartFactory(this.config));
        this._resize();
        return true;
      },
      _showInitChart: function(config) {
        var chartType;
        if (config.type === 'column' || config.shape === 'horizontal' ||
          config.shape === 'vertical') {
          chartType = 'bar';
        } else {
          chartType = config.type;
        }
        var option = {
          series: [{
            data: [{
              name: '0',
              value: 0
            }]
          }]
        };
        if (chartUtils.isAxisChart(config)) {
          option.xAxis = {
            data: ["0"]
          };
          option.yAxis = {};
        }
        option.series[0].type = chartType;
        this.chart.setOption(option, false);
      },
      _mockChartDataWhenNoData: function(config) {
        if(config && Array.isArray(config.labels) && config.labels.length === 0){
          config.labels.push(0);
          if (config && Array.isArray(config.series) && config.series.length > 0) {
            config.series.forEach(function(serie) {
              if (serie && Array.isArray(serie.data) && serie.data.length === 0) {
                serie.data.push(0);
              }
            });
          }
        }
        return config;
      },
      _chartFactory: function(config) {
        config = this._mockChartDataWhenNoData(config);
        var width = this.chart.getWidth();
        config = lang.clone(config);
        var defaultConfiguration = lang.clone(this.defaultConfiguration);
        this.option = {};
        var option = this.option;
        //axis chart grid
        option = this._settingDefaultGrid(option, config);
        //render option
        option = this._settingRenderOption(option, config);
        //title
        option = this._settingTitle(option, config);
        //background color
        option = this._settingBackgroundColor(option, config);
        //display color
        option = this._settingColor(option, config);
        //tooltip
        option = this._settingToolTip(option, config);

        //for axis chart
        if (chartUtils.isAxisChart(config)) {
          //setting axis
          option = this._settingAxisChartAxis(option, config);
          //toolbox for axis chart
          option = this._settingToolBox(option, config, defaultConfiguration);
          //series
          option = this._settingSeries(option, config);
          //stack
          option = this._settingStack(option, config);
          //axis display
          option = this._settingAxisDisplay(option, config);
        } else if (!chartUtils.isAxisChart(config)) {
          //toolbox for no-axis chart
          option = this._settingToolBox(option, config, defaultConfiguration, 'magicType');
          //no-axis chart and its series
          option = this._settingNoAxisCharts(option, config, defaultConfiguration);
        }
        //legend
        option = this._settingLegend(option, config);
        //scale
        option = this._settingScale(option, config);
        //rtl
        option = this._handleChartRtl(option, config);
        //avoid toolbox overlap
        option = this._avoidTitleToolBoxOverlap(option, config);
        //avoid pie overlap legend and label
        option = this._pieChartAvoidLegendLabelOverLap(option, config);
        //update dateZoom and grid
        option = this._settingFixedPosition(option, config, width);
        //advance
        option = this._settingAdvanceOption(option, config);
        //avoid adjoining pie part the same color
        option = this._avoidAdjoiningColorSameForPie(option, config);
        //bind event
        this._bindEvents(config);

        return option;
      },

      _avoidAdjoiningColorSameForPie: function(option, config) {
        if (config.type !== 'pie' || !option.color || option.color.length <= 2) {
          return option;
        }
        if (jimuUtils.isNotEmptyObject(option.series, true)) {
          option.series.forEach(lang.hitch(this, function(item) {
            var pieCount = item.data.length;
            if ((pieCount - 1) % (option.color.length) === 0) {
              var lastPart = item.data[pieCount - 1];
              if (!lastPart.itemStyle) {
                lastPart.itemStyle = {};
              }
              if (!lastPart.itemStyle.normal) {
                lastPart.itemStyle.normal = {};
              }
              if (!lastPart.itemStyle.normal.color) {
                lastPart.itemStyle.normal.color = option.color[1];
              }
            }
          }));
        }
        return option;
      },

      _pieChartAvoidLegendLabelOverLap: function(option, config) {
        if (config.type !== 'pie') {
          return option;
        }
        var radius = config.labelLine ? 0.75 : 0.85;
        if (config.legend) {
          radius -= 0.12;
        }
        option.series[0].radius[1] = radius * 100 + '%';
        return option;
      },

      _settingDefaultGrid: function(option, config) {
        if (chartUtils.isAxisChart(config)) {
          option.grid = {
            top: 20,
            bottom: 10,
            left: 10,
            right: 10,
            containLabel: true
          };
        }
        return option;
      },

      _settingRenderOption: function(option, config) {
        if (config.shape === 'curved') {
          option.animationThreshold = 99999999;
          option.hoverLayerThreshold = 99999;
          option.progressiveThreshold = 99999;
          return option;
        }
        //Chart render option
        option.hoverLayerThreshold = 500;
        option.progressiveThreshold = 500;
        option.progressive = 100;
        option.animationThreshold = 500;
        return option;
      },

      clear: function() {
        this.chart.clear();
      },

      resize: function(width, height) {
        domStyle.set(this.domNode, {
          width: width || '100%',
          height: height || '100%'
        });
        this.chart.resize();
        this._resize();
      },

      _resize: function() {
        if (this.config.shape && this.config.shape !== 'curved') {
          this.gauge._resetGrid(this.config);
          this.gauge._resetGraphic(this.config);
        }
      },

      _settingFixedPosition: function(option, config, width) {
        // var config = this.config;
        // var option = lang.clone(this.option);
        if (!config.shape) {
          this._showInitChart(config);
        }
        if (chartUtils.isAxisChart(config)) {
          option = this._settingDataZoom(option, config, width);
          option = this._settingGrid(option, config);
        }
        return option;
      },

      destroy: function() {
        this.chart.clear();
        if (jimuUtils.isNotEmptyObject(this.config.events)) {
          this.config.events.forEach(lang.hitch(this, function(event) {
            this.chart.off(event.name);
          }));
        }
        this.inherited(arguments);
      },

      _settingAxisDisplay: function(option, config) {
        if (!chartUtils.isAxisChart(config)) {
          return option;
        }
        option.xAxis.show = !config.hidexAxis;
        option.yAxis.show = !config.hideyAxis;
        option.grid.containLabel = !config.hideyAxis;

        return option;
      },

      _handleChartRtl: function(option, config) {
        if (!window.isRTL) {
          return option;
        }
        if (chartUtils.isAxisChart(config) || config.shape === 'vertical' || config.shape === 'horizontal') {
          option.xAxis.inverse = true;
          option.yAxis.position = 'right';
        }
        return option;
      },

      _settingTitle: function(option, config) {
        if (config.title) {
          option.title = {
            textStyle: {
              fontSize: 16
            }
          };
          option.title.text = config.title;
        }
        return option;
      },

      _settingColor: function(option, config) {
        if (jimuUtils.isNotEmptyObject(config.color)) {
          option.color = config.color;
        }
        return option;
      },

      _settingBackgroundColor: function(option, config) {
        if (config.backgroundColor) {
          option.backgroundColor = config.backgroundColor;
        }
        return option;
      },

      _settingToolTip: function(option, config) {
        option.tooltip = {};
        if (config.axisPointer) {
          option.tooltip.trigger = 'axis';
          if (config.type === 'column' || config.type === 'bar') {
            option.tooltip.axisPointer = {
              type: 'shadow'
            };
          }
        } else {
          option.tooltip.axisPointer = {
            type: ''
          };
        }
        return option;
      },

      _settingAxisChartAxis: function(option, config) {
        option.xAxis = {};
        option.yAxis = {};
        //setting value labels and category labels
        if (config.type === 'column' || config.type === 'line' && config.labels) {
          option.xAxis.data = config.labels;
          option.xAxis.type = 'category';
        } else if (config.type === 'bar' && config.labels) {
          option.yAxis.data = config.labels;
          option.yAxis.type = 'category';
        }
        return option;
      },

      _settingToolBox: function(option, config, defaultConfiguration, filter) {
        option.toolbox = {};
        if (!filter) {
          filter = '';
        }
        if (jimuUtils.isNotEmptyObject(config.toolbox)) {
          option.toolbox.feature = {};
          config.toolbox.forEach(function(tool) {
            if (tool !== filter) {
              if (config.stack) {
                defaultConfiguration.toolboxs.magicType.type = ['line', 'bar', 'stack', 'tiled'];
              }
              option.toolbox.feature[tool] = defaultConfiguration.toolboxs[tool];
            }
          });
        }
        option = this._handleToolBoxRTL(option, config);
        return option;
      },

      _settingSeries: function(option, config) {
        if (jimuUtils.isNotEmptyObject(config.series)) {
          if (!jimuUtils.isNotEmptyObject(option.series)) {
            option.series = config.series;
          }
        } else {
          console.log('No series!');
          return option;
        }
        config.series.forEach(lang.hitch(this, function(serie, index) {
          // if series.type is not defined, set as config.type
          var type = '';
          if (serie.type) {
            type = serie.type;
          } else {
            type = config.type;
          }
          serie.data = serie.data.map(lang.hitch(this, function(item, i) {
            //border width
            this._handleChartBorderWidth(item);
            if (!chartUtils.isAxisChart(config)) {
              var dataObj = {};
              if (!item && typeof item !== 'number') {
                dataObj.value = item;
              } else {
                if (item.value) {
                  dataObj.value = item.value;
                } else {
                  dataObj.value = item;
                }
                //unique color
                if (item.itemStyle) {
                  dataObj.itemStyle = item.itemStyle;
                }
              }
              dataObj.name = config.labels[i] || '';
              return dataObj;
            } else {
              return item;
            }
          }));
          option.series[index].name = serie.name || '';
          option.series[index].type = type === 'column' ? 'bar' : type;
          option.series[index].data = serie.data;

        }));
        return option;
      },

      _settingNoAxisCharts: function(option, config, defaultConfiguration) {
        if (config.type === 'pie') {
          option = this._settingPie(option, config, defaultConfiguration);
        } else if (config.type === 'funnel') {
          option = this._settingFunnel(option, config, defaultConfiguration);
        } else if (config.type === 'radar') {
          option = this._settingRadar(option, config);
        } else if (config.type === 'gauge') {
          return this.gauge._settingGaugeSeries(option, config);
        }
        return this._settingSeries(option, config);
      },

      _settingScale: function(option, config) {
        if (!config.scale) {
          return option;
        }
        if (config.type === 'bar') {
          option.xAxis.scale = true;
        } else if (config.type === 'line' || config.type === 'column') {
          option.yAxis.scale = true;
        } else if (config.type === 'radar') {
          option.radar.scale = true;
        }
        return option;
      },

      _settingAdvanceOption: function(option, config) {
        if (config.advanceOption) {
          if (typeof config.advanceOption === 'object') {
            lang.mixin(option, config.advanceOption);
          } else if (typeof config.advanceOption === 'function') {
            config.advanceOption(option);
          }
        }
        return option;
      },

      _bindEvents: function(config) {
        if (jimuUtils.isNotEmptyObject(config.events)) {
          config.events.forEach(lang.hitch(this, function(event) {
            this.chart.on(event.name, event.callback);
          }));
        }
      },

      _settingLegend: function(option, config) {
        if (!config.legend) {
          return option;
        }
        option.legend = {
          type: 'scroll',
          orient: 'horizontal',
          x: 'left',
          pageButtonPosition: 'end',
          pageTextStyle: {
            color: '#939393'
          },
          bottom: 20,
          y: 'bottom',
          data: []
        };

        if (chartUtils.isAxisChart(config) || config.type === 'gauge') {
          option.series.forEach(function(serie) {
            option.legend.data.push(serie.name);
          });
        } else if (config.type === 'pie' || config.type === 'funnel' ||
          config.type === 'radar') {
          option.series[0].data.forEach(function(item) {
            option.legend.data.push(item.name);
          });
        }
        option = this._handleLegendRTL(option, config);
        return option;
      },

      _handleDataZoomStyle: function(config, zoomOption) {
        zoomOption.showDataShadow = false;
        zoomOption.realtime = false;
        if (config.legend) {
          zoomOption.bottom = 30;
        } else {
          zoomOption.bottom = 'auto';
        }
        if (config.type === 'bar' && config.legend) {
          zoomOption.bottom = 50;
        }
        return zoomOption;
      },

      _showDataZoom: function(option, config, width) {
        width = width || this.chart.getWidth();
        var number = config.series[0].data.length * config.series.length;
        var position = chartUtils.getAxisZeroPosition.call(this, config);
        if (config.type !== 'bar') {
          if (!window.isRTL) {
            var left = position.left;
            width = width - left - option.grid.right;
          } else {
            width = position.left;
          }
        } else {
          width = position.top;
        }

        this.showDataZoom = width / number < 8;
        var ratio = width / (number * 8);
        ratio = parseFloat(ratio * 100, 10).toFixed(3);
        ratio = ratio > 100 ? 100 : ratio;
        ratio = ratio === 0 ? 0.1 : ratio;
        var dataZoom = [];

        var axis = config.type === 'bar' ? 'xAxis' : 'yAxis';
        var axisIndex = config.type === 'bar' ? 'yAxisIndex' : 'xAxisIndex';
        var dzwh = config.type === 'bar' ? 'width' : 'height';

        option = this._initAxisOfDataZoom(option, axis);

        dataZoom = config.dataZoom.map(lang.hitch(this, function(item) {
          var zoomOption = {
            type: item,
            start: 0,
            show: this.showDataZoom
          };
          zoomOption[axisIndex] = [0];
          zoomOption[dzwh] = 15;
          zoomOption.end = ratio;
          if (axis === 'xAxis' && window.isRTL) {
            zoomOption.left = '10';
          }
          zoomOption = this._handleDataZoomStyle(config, zoomOption);
          return zoomOption;
        }));

        option.dataZoom = dataZoom;
        return option;
      },

      _settingDataZoom: function(option, config, width) {
        if (!jimuUtils.isNotEmptyObject(config.dataZoom)) {
          return {
            dataZoom: []
          };
        }
        if (config.dataZoom) {
          option = this._showDataZoom(option, config, width);
        } else {
          this.showDataZoom = false;
          option.dataZoom = [];
        }
        return option;
      },

      _avoidTitleToolBoxOverlap: function(option, config) {
        if (config.type === 'gauge') {
          return option;
        }
        var top = 10;
        //top
        if (config.title) {
          top += 20;
        }
        if (jimuUtils.isNotEmptyObject(config.toolbox, true)) {
          top += 20;
        }
        if (jimuUtils.isNotEmptyObject(config.toolbox, true) && config.title) {
          option.toolbox.top = 20;
        }
        if (chartUtils.isAxisChart(config) && option.grid) {
          option.grid.top = top;
        }
        return option;
      },

      _settingGrid: function(option, config) {
        if (!chartUtils.isAxisChart(config)) {
          return option;
        }
        //1.top
        var top = 10;
        if (config.title) {
          top += 20;
        }
        if (jimuUtils.isNotEmptyObject(config.toolbox, true)) {
          top += 20;
        }
        if (jimuUtils.isNotEmptyObject(config.toolbox, true) && config.title) {
          option.toolbox.top = 20;
        }
        if (option.grid) {
          option.grid.top = top;
        }
        //2.left right
        var lr_short = 10,
          lr_lang = 30,
          tb_short = 10,
          tb_lang = 43;
        if (config.hideyAxis) {
          tb_short = 20;
          tb_lang = 63;
        }
        //3.bottom
        var bottomAdd = 0;
        var barBottom = 10;
        if (config.legend) {
          bottomAdd = this.showDataZoom ? 10 : 20;
          barBottom += 20;
        }
        //4.special handle line chart
        if (config.type === 'line' && config.legend && !this.showDataZoom) {
          tb_short += 7;
        }
        //5.special handle bar chart
        if (config.type === 'bar') {
          if (window.isRTL) {
            option.grid.left = this.showDataZoom ? lr_lang : lr_short;
          } else {
            option.grid.right = this.showDataZoom ? lr_lang : lr_short;
          }
          //special handle
          if (config.hideyAxis && config.legend) {
            barBottom += 20;
          }
          option.grid.bottom = barBottom;
        } else {
          option.grid.bottom = this.showDataZoom ? tb_lang + bottomAdd : tb_short + bottomAdd;
        }
        return option;
      },

      _handleLegendRTL: function(option, config) {
        if (!config.legend) {
          return option;
        }
        var legend = {};
        if (window.isRTL) {
          legend.x = 'right';
          legend.pageButtonPosition = 'start';
        } else {
          legend.x = 'left';
          legend.pageButtonPosition = 'end';
        }
        option.legend = lang.mixin(option.legend, legend);
        return option;
      },

      _handleToolBoxRTL: function(option, config) {
        if (!config.toolbox) {
          return option;
        }
        var toolbox = {
          top: 0
        };

        if (window.isRTL) {
          toolbox.right = 0;
        } else {
          toolbox.left = 0;
        }
        option.toolbox = lang.mixin(option.toolbox, toolbox);
        return option;
      },

      _initAxisOfDataZoom: function(option, axis) {
        option[axis].type = 'value';
        // option[axis].min = 'dataMin';
        // option[axis].max = 'dataMax';
        option.xAxis.splitLine = {
          show: true,
          lineStyle: {
            type: 'dashed'
          }
        };
        option.yAxis.splitLine = {
          show: true,
          lineStyle: {
            type: 'dashed'
          }
        };
        return option;
      },

      _settingStack: function(option, config) {
        if (!chartUtils.isAxisChart(config)) {
          return option;
        }
        option.series = option.series.map(function(serie) {
          if (config.stack) {
            serie.stack = 'stack';
            if (config.type === 'line') {
              serie.areaStyle = {
                normal: {}
              };
              serie.smooth = true;
            }
          }
          return serie;
        });
        return option;
      },

      _settingPie: function(option, config, defaultConfiguration) {
        if (config.type !== 'pie') {
          return option;
        }
        option.series = defaultConfiguration.series.pieSeries;
        if (config.innerRadius) {
          option.series[0].radius[0] = config.innerRadius;
        }
        option.series[0].labelLine.normal.show = typeof config.labelLine ===
          'undefined' ? true : config.labelLine;
        return option;
      },

      _settingFunnel: function(option, config, defaultConfiguration) {
        if (config.type !== 'funnel') {
          return option;
        }
        option.series = defaultConfiguration.series.funnelSeries;
        if (jimuUtils.isNotEmptyObject(config.funnel)) {
          option.series[0].min = config.min || 0;
          option.series[0].max = config.max || 100;
          option.series[0].sort = config.funnelSort || 'descending';
        }
        return option;
      },

      _settingRadar: function(option, config) {

        if (config.type !== 'radar') {
          return option;
        }
        option.radar = {
          nameGap: 6,
          radius: '70%'
        };
        if (config.radarShape) {
          option.radar.shape = config.radarShape;
        }
        if (config.indicator) {
          option.radar.indicator = config.indicator;
        } else {
          console.error('No radar indicator');
        }
        option.series = [{}];
        option.series[0].label = {
          normal: {
            show: true,
            formatter: function(params) {
              return chartUtils.tryLocaleNumber(params.value);
            }
          }
        };
        var tooltips = [];

        config.series[0].data.forEach(function(item, index) {
          tooltips[index] = {
            tooltip: '<span>' + config.labels[index] + '</span>'
          };
          item.forEach(function(val, i) {
            tooltips[index].tooltip += '<br/>' + '<span>' +
              config.indicator[i].name + '</span>' + ' : ' + '<span>' + val + '</span>';
          });
        });
        option.tooltip = {
          trigger: 'item',
          formatter: function(params) {
            var colorEl = '<span class="colorEl marginRight5" style="background-color:' +
              jimuUtils.encodeHTML(params.color) + '"></span>';
            return colorEl + tooltips[params.dataIndex].tooltip;
          }
        };
        if (this.config.confine) {
          option.tooltipconfine = true;
        }
        return option;
      },
      _handleChartBorderWidth: function(item) {
        //whether use chart border
        var chartBorder = false;
        if (item && item.itemStyle && item.itemStyle.normal &&
          typeof item.itemStyle.normal.borderColor !== 'undefined') {
          chartBorder = true;
        }
        //theme
        if (!jimuUtils.isNotEmptyObject(this.chart._theme)) {
          this.chart._theme = {};
        }
        var theme = this.chart._theme;
        //border width
        var borderWidth = 0;
        if (chartBorder) {
          borderWidth = 0.3;
        }
        //bar
        if (theme.bar && theme.bar.itemStyle) {
          if (theme.bar.itemStyle.normal) {
            theme.bar.itemStyle.normal.barBorderWidth = borderWidth;
          }
          if (theme.bar.itemStyle.emphasis) {
            theme.bar.itemStyle.emphasis.barBorderWidth = borderWidth;
          }
        }
        //pie
        if (theme.pie && theme.pie.itemStyle) {
          if (theme.pie.itemStyle.normal) {
            theme.pie.itemStyle.normal.borderWidth = borderWidth;
          }
          if (theme.pie.itemStyle.emphasis) {
            theme.pie.itemStyle.emphasis.borderWidth = borderWidth;
          }
        }
      },
      _customTheme: function() {
        if (!jimuUtils.isNotEmptyObject(this.chart._theme)) {
          this.chart._theme = {};
        }
        //color
        if (jimuUtils.isNotEmptyObject(this.config.color)) {
          this.chart._theme.color = this.config.color;
        }
        //tooltip
        if (!jimuUtils.isNotEmptyObject(this.chart._theme.tooltip)) {
          this.chart._theme.tooltip = {};
        }
        //tooltip
        if (this.config.confine) {
          this.chart._theme.tooltip.confine = true;
        }
        //tooltip 1.axisPointer
        this.chart._theme.tooltip.axisPointer = {
          type: 'cross',
          label: {
            show: true,
            precision: 2,
            formatter: function(params) {
              if (typeof params.value === 'number') {
                var value = parseFloat(params.value).toFixed(2);
                return chartUtils.tryLocaleNumber(value);
              } else {
                return params.value;
              }
            }
          },
          lineStyle: {
            color: '#27727B',
            type: 'dashed'
          },
          crossStyle: {
            color: '#27727B'
          },
          shadowStyle: {
            color: 'rgba(200,200,200,0.3)'
          }
        };
        //tooltip 2.formatter
        this.chart._theme.tooltip.formatter = function(params) {
          return chartUtils.handleToolTip(params, null, true);
        }.bind(this);
        //value axis
        if (!jimuUtils.isNotEmptyObject(this.chart._theme.valueAxis)) {
          this.chart._theme.valueAxis = {};
        }
        if (!jimuUtils.isNotEmptyObject(this.chart._theme.valueAxis.axisLabel)) {
          this.chart._theme.valueAxis.axisLabel = {};
        }
        this.chart._theme.valueAxis.axisLabel.formatter = function(value) {
          return jimuUtils.localizeNumber(value);
        };
        //border
      },

      _checkConfig: function(config) {
        var isValidConfig = true;
        if (!jimuUtils.isNotEmptyObject(config)) {
          console.error('Empty config');
          isValidConfig = false;
        }
        if (!config.type || this.validConfig.type.indexOf(config.type) < 0) {
          console.error('Invaild chart type!');
          isValidConfig = false;
        }
        var validConfig = lang.clone(this.validConfig);
        var commonConfig = validConfig.common;
        var validOption = [];
        if (config.type === 'column' || config.type === 'bar' || config.type === 'line') {
          validOption = commonConfig.concat(validConfig.axisChart);
        } else {
          validOption = commonConfig.concat(validConfig[config.type]);
        }
        var keys = Object.keys(config);
        keys.forEach(function(key) {
          if (validOption.indexOf(key) < 0) {
            isValidConfig = false;
            console.error('Invalid configuration parameter: ' + key);
          }
        });
        return isValidConfig;
      }

    });
  });