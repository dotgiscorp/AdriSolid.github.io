define([
  'dojo/_base/declare',
  "dijit/form/Select",
  "dojo/dom-construct",
  "dojo/dom",
  "dojo/on",
  "dojo/domReady!"
], function(declare, Select, domConstruct, dom, on){
  var clazz = declare(null, {
   
    constructor: function(options){
      this.createLayerSelect(options.idForChangeEvent, options.layerNode, options.map)
    },

    createLayerSelect: function(id, layerNode, map){

      new Select({
        name: layerNode,
        id: id
      }).placeAt(layerNode).startup()

      var layers = [];

      for(var i = 0; i < map.graphicsLayerIds.length; i++) {
        var layerObject = map.getLayer(map.graphicsLayerIds[i]);
        if(layerObject.url){
          layers.push(layerObject)
        } 
      }

      var recording = layers.map(function(record){
        return dojo.create("option", {
          label: record.name,
          value: record.id,
          selected: false
        })
      })

      const selectLayer = dijit.byId(id)

      if(selectLayer.getOptions()){
        selectLayer.removeOption(selectLayer.getOptions())
        selectLayer.addOption({label: "", value: "", selected: true})
        selectLayer.addOption(recording)
      }
    },

  });
  return clazz;
});
