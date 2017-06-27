# netboard-svg

Project implementing an svg visualisation of modelled network-navigation boards


## Using this

This package interpretes an embeded attached datamodel to your html-element into an svg image representing the model.

``` html
    <div class="col-xs-3" 
         role="netboard" 
         data-netboard='{"style": "walk", "board": [{"type": "node", "nr": 45}, {"type": "N", "nr": 33}, {"type": "CLS", "nr": 17}]}'>
         No board support.
    </div>
```

This requires loading the javascript to see the magic work (typically at the bottom of your page)

``` html
  <script src="../bower_components/requirejs/require.js"></script>
  <script type="text/javascript">
    "use strict";
    requirejs.config({
        baseUrl: '../bower_components',
        paths: {
            jquery: 'jquery/dist/jquery.min', 
            svgjs: 'svg.js/dist/svg.min',
            netboard: 'netboard/dist/netboard-svg'
        }
    });
    require(['jquery', 'svg', 'netboard'], function ($) {
        $( function () {
            if (!$.isFunction($.fn.netboard)) {
                throw "test cannot run if netboard function is not loaded.";
            } // else
            var config = {};
            $('[role="netboard"]').netboard(config);
        });
    });
  </script>
```


## The Model

The data-structure in the data-netboard attribute to be interpreted can take one of the follwing formats:

### embedded json

``` json
{
  "style": <<style>>, 
  "board": [
    { "type": <<type>>, 
      "nr": <<nr>>     },
    ...
  ]
}
```

Where:
* style == 'cycle' | 'walk', one of the defined styles
* type == 'node' | 'N' | 'S' | 'E' | 'W' | 'NW' | 'NE' | 'SW' | 'SE' | 'CLN' | 'CRS' | 'CRN' | 'CLS' | 'UR' | 'UL'
* nr == number to display

### string shorthand

```
<<type>>,<<nr>>[#<<type>>,nr]*~<<style>>
```

Where like above, except
* type 'node' is marked in shorthand as '!'

### remote url to json

```
<<url>>
```

Where url points to a downloadable json file containing the full json model


## Style and background settings

The passed down config object can alter and add to these built in defaults:

```js
{
    "default-style": "cycle", // if no style specified assume this
    "max-width-px": 160,      // scales units to fill at max this width in px
    "top-margin-units": 5,    // how many units to keep from top
    "section-height-units": 36,   // how many units height of each section
    "section-scale-marker": 0.65, // ratio of height to use for the marker
    "section-scale-text": 0.35,   // ratio of height to use for text inside the marker
    "styles": {               // named style settings
        "cycle": {
            "color" : "rgba(53, 132, 34, 1.0)",    // foreground
            "board-color" : "rgb(237, 255, 253)",  // background
            "board-radius" : 5,                    // rounded corner radius in units
            "board-width" : 100,                   // width in units
            "stroke-width": 3,                     // width in units
            "pole-width" : 20,                     // width in units
            "pole-gradient" : [                    // gradient definition
                {"at": 0, "color": "rgb(103, 103, 103)"},
                {"at": 1, "color": "rgba(230, 230, 230, 0.88)"}
            ]
        },
        "walk": {
            "color" : "rgba(190, 14, 14, 1.0)",
            "board-color" : "rgb(255, 254, 237)",
            "board-radius" : 5,
            "board-width": 80,
            "stroke-width": 3,
            "pole-width": 84,
            "pole-gradient" : [
                {"at": 0, "color": "rgb(188, 181, 1)"},
                {"at": 1, "color": "rgba(157, 109, 0, 0.81)"}
            ]
        }
    },
    "arrows": {
        "N"  : '\u2191',
        "E"  : '\u2192',
        "W"  : '\u2190',
        "S"  : '\u2193',
        "NW" : '\u2196',
        "NE" : '\u2197',
        "SE" : '\u2198',
        "SW" : '\u2199',
        "CLN": '\u2b11',
        "CRS": '\u2b0e',
        "CRN": '\u2b0f',
        "CLS": '\u2b10',
        "UR" : '\u21b7',
        "UL" : '\u21b6'
    }
}
```

