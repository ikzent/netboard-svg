/*globals console, define */


(function () {
    "use strict";
    var CODERE = /(!,[0-9]{1,3})?((N|E|W|S|NW|NE|SE|SW|CLN|CRS|CRN|CLS|UR|UL),[0-9])+(~(cycle|walk))?/;

    define('netboard', ['jquery', 'svgjs'], function ($, SVG) {
        function jqExtendor(name, fn) {
            var ext = {};
            ext[name] = function (pass) {
                return $(this).map(function () {
                    return fn($(this), pass);
                });
            };
            $.fn.extend(ext);
        }

        function jqDefine(name, Cstr) {
            jqExtendor(name, function ($e, p) {return new Cstr($e, p); });
        }

        function jqBuild(name, fn) {
            jqExtendor(name, fn);
        }

        function jqMerge(defs, vals) {
            return $.extend($.extend({}, defs), vals);
        }

        function NetBoard($elm, config) {
            this.config = jqMerge(NetBoard.config, config);
            this.$elm = $elm;
            this.model = undefined;

            if (!SVG.supported) {
                this.showErr("Board Drawing requires SVG support");
                console.log(SVG);
                return;
            }

            var bmd = $elm.data("netboard"),
                me = this;
            try {
                if (typeof bmd === 'object') {
                    me.setModel(bmd);
                } else if (typeof bmd === 'string') {
                    if (CODERE.test(bmd)) {
                        me.setModel(NetBoard.parseModel(bmd));
                    } else {
                        $.getJSON(bmd, function (remoteModel, status, xhr) {
                            if (status !== 'success') {
                                me.showErr("cannot load json from " + bmd + " ==> status = " + status);
                                return;
                            }
                            // else
                            remoteModel.url = bmd;
                            me.setModel(remoteModel);
                        });
                    }
                }
            } catch (e) {
                this.showErr(e);
            }

            $(window).resize(function () {me.redraw(); });
        }

        NetBoard.prototype.showErr = function (msg) {
            this.$elm.html("<div class='alert alert-danger'>" + msg + "</div>");
        };

        NetBoard.prototype.setModel = function (model) {
            this.model = model;
            this.stylename = model.style || this.config["default-style"];
            this.style = this.config.styles[this.stylename];
            this.redraw();
        };

        NetBoard.prototype.redraw = function (model) {
            if (this.model === undefined) {
                this.showErr("No Board Model Set");
                return;
            }

            var me = this;
            this.height = this.$elm.height();
            this.width = this.$elm.width();
            this.unit = Math.min(this.width, this.config["max-width-px"]) / 100;
            this.$elm.html("");
            this.svg = SVG(this.$elm.get(0));

            this.drawPole();
            this.drawBoard();
            this.model.board.forEach(function (section, ndx) {
                me.drawSection(ndx, section.type, section.nr);
            });
        };

        NetBoard.prototype.drawPole = function () {
            var gradDef = this.style["pole-gradient"],
                w = this.style["pole-width"] * this.unit,
                grad = this.svg.gradient('linear', function (stop) {
                    gradDef.forEach(function (step) {
                        stop.at(step.at, step.color);
                    });
                });
            this.svg
                .rect(w, this.height).move((this.width - w) / 2, 0)
                .fill(grad);
        };

        NetBoard.prototype.drawBoard = function () {
            var bgc = this.style["board-color"],
                w = this.style["board-width"] * this.unit,
                h = this.model.board.length * this.config["section-height-units"] * this.unit;
            this.svg
                .rect(w, h)
                .move((this.width - w) / 2, this.config["top-margin-units"])
                .radius(this.style["board-radius"])
                .fill(this.style["board-color"])
                .stroke({
                    "color" : this.style.color,
                    "width": this.style["stroke-width"]
                });
        };

        NetBoard.prototype.drawSection = function (ndx, type, nr) {
            var h = this.config["section-height-units"] * this.unit,
                w = this.style["board-width"] * this.unit,
                sm = this.style["section-scale-marker"] || 0.65, // sized ratio of marker in section
                st = this.style["section-scale-marker"] || 0.35, // sized ratio for text inside marker
                hoff = (this.width - w) / 2,
                voff = ndx * h + this.config["top-margin-units"],
                arrow = "",
                g = this.svg.group(),
                t;

            if (type === 'node') {
                g.rect(w, h)
                    .fill(this.style.color);
                g.circle(h * sm)
                    .stroke({
                        "color": this.style["board-color"],
                        "width": this.style["stroke-width"] * this.unit
                    })
                    .fill('transparent')
                    .attr({cx: w / 2, cy: h / 2});
                t = g.text(String(nr))
                    .font({"weight": "normal", "size": h * st, "anchor": "middle"})
                    .style("alignment-baseline", "middle")
                    .fill(this.style["board-color"]);
                t.move(w / 2, (h - t.bbox().h) / 2);
            } else {
                g.rect(w, h)
                    .fill('transparent')
                    .stroke({
                        "color": this.style.color,
                        "width": this.style["stroke-width"] / 2
                    });
                arrow = this.config.arrows[type] || '*';
                t = g.text(arrow)
                    .font({"weight": "bold", "size": h * sm, "anchor": "middle"})
                    .style("alignment-baseline", "middle")
                    .fill(this.style.color);
                t.move(w / 4, (h - t.bbox().h) / 2);
                g.circle(h * sm)
                    .stroke({
                        "color": this.style.color,
                        "width": this.style["stroke-width"] * this.unit
                    })
                    .fill('transparent')
                    .attr({cx: 3 * w / 4, cy: h / 2});
                t = g.text(String(nr))
                    .font({"weight": "normal", "size": h * st, "anchor": "middle"})
                    .style("alignment-baseline", "middle")
                    .fill(this.style.color);
                t.move(3 * w / 4, (h - t.bbox().h) / 2);
            }
            g.move(hoff, voff);
        };

        NetBoard.parseModel = function (coded) {
            var parts = coded.split('~'),
                model = parts[0].split('#').reduce(function (res, section) {
                    var subs = section.split(',');
                    res.board.push({"type": subs[0] === '!' ? "node" : subs[0], "nr": subs[1]});
                    return res;
                }, {"board": []});
            if (parts.length > 1) {
                model.style = parts[1];
            }
            model.code = coded;
            return model;
        };

        NetBoard.codeModel = function (model) {
            return [model.board.map(function (section) {
                return [(section.type === 'node' ? '!' : section.type), section.nr].join(',');
            }).join('#'),
                     model.style].join('~');
        };

        NetBoard.config = { // all dim expressed in units == automatically scaled to have 1oo units fill width
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
        };

        jqDefine("netboard", NetBoard);
        return NetBoard;
    });
}());
