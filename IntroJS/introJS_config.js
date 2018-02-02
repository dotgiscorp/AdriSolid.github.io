function getNode(node){
    return document.querySelector(node);
}

function initIntro(){
    introJs().setOptions({
        steps: [{
                intro: "Hello Web App Builder, I'm IntroJS, wanna join me? :)"
            },
            {
                element: getNode('#widgets_Search_Widget_3'),
                intro: "The Search widget enables end users to find locations or search features on the map.",
                position: 'bottom'
            },
            {
                element:  getNode('#dijit__WidgetBase_0'),
                intro: "The Layer List widget provides a list of operational layers and their symbols, and allows you to turn individual layers on and off.",
                position: 'bottom'
            },
            {
                element:  getNode('#dijit__WidgetBase_1'),
                intro: "The Legend widget displays labels and symbols for layers in the map.",
                position: 'bottom'
            },
            {
                element:  getNode('#dijit__WidgetBase_2'),
                intro: "About Web App Builder",
                position: 'bottom'
            },
            {
                element:  getNode('#dijit__WidgetBase_3'),
                intro: 'The Measurement widget allows you to measure the area of a polygon, length of a line, or find the coordinates of a point.',
                position: 'left',
                position: 'bottom'
            },
            {
                element: '#step5',
                intro: 'Get it, use it!'
            }
        ]
    }).start();
}

