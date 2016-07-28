/**
 * Dive Plotter
 *
 * Draws dots based on measurements.
 *
 * Designed to support measurements provided using baseline/offset and
 * triangulation methods.
 *
 * Alpha version:
 * - point A top middle, point B straight down not plotted
 * - measurements as a JS array
 * - dumps a URL to load the currently displayed canvas; load said URL
 * - supported GET params:
 * -- testtrigo: do some trigonometry calculations in the console, for sanity check
 * -- testbo: load a series baseline/offset coordinates
 * -- testtri: load a series of triangulation coordinates
 * -- plot: load the objects specified in the URL and display them
 *
 * Beta version:
 * - Basic GUI controls, usable from www:
 * -- add object
 * -- add point
 *
 * TODO Later...
 * ~ shapes: guestimate / draw shape based on measured points
 * ~ add primary points, add secondary points relative to any two primary points
 * ~ scale canvas to include all the required points
 * ~ user-GUI to scale / rotate canvas
 * ~ merge two series of objects? (i.e. two URLs)
 */

const templateBaseLayout = `<canvas class="site" width="1000" height="1000"></canvas><div class="controls"><div class="main"><button class="add-object">+</button><button class="redraw">redraw</button></div><div class="objects"></div></div><div class="log"></div>`;
const templateObject = `<div class="object"><span class="label"></span><div class="controls"><!-- button class="delete-object">-</button --><button class="add-point-bo">BO |-</button><button class="add-point-tri">Tri |&gt;</button><button class="add-point-bearing">Bearing |/</button></div><div class="points"></div></div>`;

class SitePlotter {
    // divArea: DOMElement the whole container
    // divSite: DOMElement canvas for the graphic representation
    // divControls: DOMElement user controls to add objects / points
    // divObjects: DOMElement list of objects / points
    // divLog: DOMElement for the log
    // objects: array of SiteObjects

    //TODO: primaryPoints: array of points, to use for baseline

    constructor(area) {
        this.divArea = area;
        this.objects = [];

        // Set up layout
        $(area).append(templateBaseLayout);
        this.divSite = $(".site", area)[0];
        this.divControls = $(".controls", area)[0];
        this.divObjects = $(".objects", area)[0];
        this.divLog = $(".log", area)[0];

        // Control events
        let that = this;
        $(".add-object", this.divControls).on("click", function(){that.showObjectModal()});
        $(".redraw", this.divControls).on("click", function(){that.redraw();});
    }

    log(message) {
        $(this.divLog).prepend("<p>" + message + "</p>");
    }

    showObjectModal() {
        DomHelper.userInput({label: "string"}, {create: this.handlerCreateObject, cancel: this.handlerCancel}, this);
    }

    handlerCancel() {} // do nothing

    handlerCreateObject(variables, context) {
        let newO = new SiteObject(variables['label']);
        context.addObject(newO);
    }

    addObject(object) {
        object.setSite(this); // callback in case the object needs to request a redraw
        if (object.color == undefined) {
            object.color = Styler.getRandomColor();
        }

        this.objects.push(object);

        this.redraw();
    }

    redraw() {
        let padding = 10;
        let area = {w: this.divSite.width, h: this.divSite.height};

        // Clear
        this.divSite.getContext("2d").clearRect(0, 0, area.w, area.h);
        $(this.divObjects).html("");

        //Boundary check: center the points
        let nbPoints = 0;
        let boundaries = {minX: 0, maxX: 0, minY: 0, maxY: 0};
        for (let i = 0; i < this.objects.length; i++) {
            let object = this.objects[i];
            for (let j = 0; j < object.points.length; j++) {
                nbPoints++;
                let point = object.points[j];
                if (boundaries.minX > point[0]) boundaries.minX = point[0];
                if (boundaries.maxX < point[0]) boundaries.maxX = point[0];
                if (boundaries.minY > point[1]) boundaries.minY = point[1];
                if (boundaries.maxY < point[1]) boundaries.maxY = point[1];
            }
        }
        let scale = 1;
        let translation = [0, area.h / 2];
        if (boundaries.maxX - boundaries.minX > 0 && boundaries.maxY - boundaries.minY > 0) {
            let scaleX = (area.w - padding * 2) / (boundaries.maxX - boundaries.minX);
            let scaleY = (area.h - padding * 2) / (boundaries.maxY - boundaries.minY);
            scale = Math.min(scaleX, scaleY);

            translation[0] = ((area.w - (boundaries.maxX - boundaries.minX) * scale) / 2) - boundaries.minX * scale;
            translation[1] = ((area.h - (boundaries.maxY - boundaries.minY) * scale) / 2) - boundaries.minY * scale;
        }
        //Should do a Styler.setScale(scale); Styler.setTranslation(translation); ?

        // Draw baseline
        let referencePoints = {A: {x: 0, y:0}, B: {x: 500, y: 0}, C: {x: -500, y: 0}};
        Styler.drawBaseline(this.divSite,
            [
                (referencePoints.A.x) * scale + translation[0],
                (referencePoints.A.y) * scale + translation[1]
            ], [
                (referencePoints.B.x) * scale + translation[0],
                (referencePoints.B.y) * scale + translation[1]
            ]
        );

        // Draw objects on the canvas
        for (let i = 0; i < this.objects.length; i++) {
            let object = this.objects[i];
            for (let j = 0; j < object.points.length; j++) {
                let point = object.points[j];
                Styler.drawCross(this.divSite, point[0] * scale + translation[0], point[1] * scale + translation[1], object.color);
                // does a +[0,500] to the coordinates, to match the primary point the measurements were based on. When primary points are programmed, this will need to be dynamic.
            }
        };

        //Maybe: add a function to set the bearing of the site, rotate everything after drawing

        // Display objects on the log
        for (let i = 0; i < this.objects.length; i++) {
            $(this.divObjects).prepend(this.objects[i].getOverview()); // newest first
        };

        // Dump the URL
        let url = location.origin + location.pathname + '?plot=' + JSON.stringify(this.getJson());
        this.log("<a href='" + url + "'>Link (" + this.objects.length + " objects, " + nbPoints + " points)</a>");
    }

    getJson() {
        let json = {};
        for (let i = 0; i < this.objects.length; i++) {
            let obj = this.objects[i];
            json[obj.label] = obj.points;
            // TODO: json[obj.label] = { points: obj.points, shape: etc };
            // TODO maybe: get original measurements rather than extrapolated coordinates
        }
        return json;
    }

    loadJson(objects) {
        objects = JSON.parse(objects);
        for (let objName in objects) {
            let newObj = new SiteObject(objName);
            // TODO: setShape, color, whatever
            let points;
            if (objects[objName] instanceof Array) {
                points = objects[objName];
            } else if (objects[objName]['points'] != undefined) {
                points = objects[objName]['points'];
            }

            // Using a quickfix to differentiate pointBO and pointTri... this needs to be improved at some stage
            for (let i = 0; i < points.length; i++) {
                if (points[i].length == 2) {
                    newObj.addPointBO(points[i][0], points[i][1]);
                } else if (points[i].length == 4) {
                    newObj.addPointTri(points[i][0], points[i][1], points[i][2], points[i][3]);
                }
            }
            this.addObject(newObj);
        }
    }
}

class DomHelper {
    /**
     * returns the DOM element matching whatever parameter: id, jQ object, etc.
     */
    static domElement(blob) {
        if (typeof blob == "string") { // in case the param is the ID
            blob = document.getElementById(blob);
        }
        if (blob.length != undefined) { // in case the param is a jQ object
            blob = blob[0];
        }
        if (blob == null || blob.appendChild == undefined) { // checking the div is usable
            throw ("Error locating DOM element");
        }
        return blob;
    }

    /**
     * return the value of the requested GET parameter
     */
    static getVar(val) {
        let result = undefined, tmp = [];
        location.search.substr(1).split("&").forEach(function (item) {
            tmp = item.split("=");
            if (tmp[0] === val) result = decodeURIComponent(tmp[1]);
        });
        return result;
    }

    /**
     * Magic modal
     *
     * Given an array of variables and callbacks, this function displays a modal box
     * with input fields for each variable and buttons for each callback. Upon
     * clicking a button, the modal box disappears and the selected callback is
     * called with as parameter an array containing the values entered by the user
     * for each variable.
     *
     * TODO: add a slugify function somewhere so labels can be more flexible
     * TODO: add a way to set value for variables, so that a "settings" box would have current settings filled in
     * TODO: converting types might be good, returning numbers as strings doesn't always work.
     *
     * @params variables Array {name: type}
     * @params buttons   Array {label: function(variables) { handle(); }}
     */
    static userInput(variables, buttons, context) {
        // Generate input fields
        let variablesHTML = "";
        for (let varname in variables) {
            let extraAttr = variables[varname] == 'int' ? 'type="number" ' : '';
            variablesHTML += "<div class='field'><label>" + varname + "</label><input name='" + varname + "' " + extraAttr + "/>";
            // TODO: Do something about the types? Validations? Dropdowns?
        }

        // Generate action buttons
        let buttonsHTML = "";
        for (let label in buttons) {
            buttonsHTML += "<button class='" + label + "'>" + label + "</button>";
        }

        // set events on buttons
        let modal = $("<div class='modal'><div class='bg'></div><div class='body'><div class='fields'>" + variablesHTML + "</div><div class='buttons'>" + buttonsHTML + "</div></div></div>");
        for (let label in buttons) {
            let handler = buttons[label];
            $("." + label, modal).click(function(ev) {
                // gather variables
                let userVars = [];
                for (let varname in variables) {
                    userVars[varname] = $("input[name=" + varname + "]", modal).val();
                }

                // call action handler
                handler(userVars, context);

                // close modal
                $('body > .modal').remove();
            } );
        }

        // show a modal with the two snippets
        $(document.body).append(modal);
        modal.find("input").first().focus();
    }
}

/**
 * Uses vanilla JS, because why not
 */
class Styler {
    static decorateDiv(div) {
        div = DomHelper.domElement(div);
        // etc
    }

    static drawCross(canvas, x, y, color) {
        if (color == undefined) color = "#999";

        let ctx = canvas.getContext("2d");
        ctx.lineWidth = 2;
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(x-5, y-5);
        ctx.lineTo(x+5, y+5);
        ctx.moveTo(x-5, y+5);
        ctx.lineTo(x+5, y-5);
        ctx.stroke();
    }

    static drawCircle(canvas, points) {
        //TODO
// if 2 points, assume they're diameter
// if 3 points, get center and cross all points
// if more... only keep 3? get centers for random groups of 3 and get median?
    }

    static drawOval(canvas, points) {
        // TODO
// if 2 points A and B, get M the middle: ctx.ellipse(Mx, My, len(AB), len(AB)*3/4);
// if 3 points A B C, A and B being the furthest, get M the middle of AB: ctx.ellipse(Mx, My, len(AB), len (MC));
// Also, make sure to draw away from the baseline, if in doubt
    }

    static drawPolygon(canvas, points) {
        // TODO
// if 2 points, draw a trapeze away from the baseline, far edge 25% shorter, depth 50% of width
// if more, link them all
// Rounded corners?
    }

    static drawBaseline(canvas, pointA, pointB) {
        this.drawCross(canvas, pointA[0], pointA[1]);
        this.drawCross(canvas, pointB[0], pointB[1]);

        let ctx = canvas.getContext("2d");
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#999";
        ctx.beginPath();
        ctx.moveTo(pointA[0], pointA[1]);
        ctx.lineTo(pointB[0], pointB[1]);
        ctx.stroke();
    }

    // TODO: style = "rainbow", style = "pencil", etc
    static getRandomColor() {
        let color;

        // completely random
        //color = '#'+Math.random().toString(16).substr(-6);

        // banning light colors (0-9 but no A-F)
        //color = '#'+Math.random().toString(10).substr(-6);

        // ensuring diversity by hardcoding colors (there must be a better way!)
        const randomColors = ["red", "blue", "green", "orange", "purple", "gray", "brown", "yellow", "IndianRed", "Indigo", "LimeGreen", "Navy"];
        let index = 0;
        if (this.lastColor != undefined && randomColors.indexOf(this.lastColor) != randomColors.length-1) {
            index = randomColors.indexOf(this.lastColor) + 1;
        }
        color = randomColors[index];
        this.lastColor = color;

        return color;
    }
}

class SiteObject {
    // label:  meaningless string
    // points: array of points, coordX = down from A ; coordY = right from (A,B) baseline if positive, left if negative
    // shape:  "oval", "polygon", maybe some more later
    // color:  HTML color, optional
    // site:   SitePlotter object, in case callback is required

    constructor(label = "") {
        this.label = label;
        this.points = [];
        this.shape = "polygon";
    }

    /**
     * Add a point using base/offset measurements
     *
     *     A
     *  ^  |
     *  |  |
     *  |b |  o
     *  v  |<--->
     *     +-----P
     *     |
     *     B
     * b = 4, o = 5
     */
    addPointBO(baseline, offset) {
        // ALPHA: all points are based on point A (0,0), left middle, baseline straight right, north straight up.
        let coordX = baseline;
        let coordY = offset;
        this.points.push([coordX, coordY]);

        // redraw if applicable
        if (this.site != undefined) this.site.redraw();
    }

    /**
     * Add a point using triangulation measurements
     *
     *  A
     *  |
     *  x
     *  |\
     *  | \
     *  |  P
     *  | /
     *  |/
     *  x
     *  B
     * Measurements: 2 - 3 - 8 - 3
     */
    addPointTri(baseline1, tri1, baseline2, tri2) {
        let side = tri1 > 0 ? 1 : -1;
        tri1 = Math.abs(tri1);
        tri2 = Math.abs(tri2);
        // let's calculate the triangle XYZ, with X and Y being along the baseline and Z being the mystery point

        // ALPHA: all points are based on point A (0,0), left middle, baseline straight right, north straight up.
        let X = [baseline1, 0];
        let Y = [baseline2, 0];
        let lengthXY = Math.abs(baseline2-baseline1);
        let lengthXZ = tri1;
        let lengthYZ = tri2;
        let angleXYZ = Math.acos((Math.pow(lengthXY, 2) + Math.pow(lengthYZ, 2) - Math.pow(lengthXZ, 2)) / (2 * lengthXY * lengthYZ));
        let Zx = Y[0] - side * lengthYZ * Math.cos(angleXYZ);
        let Zy = Y[1] + lengthYZ * Math.sin(angleXYZ);

        if (isNaN(Zx) || isNaN(Zy)) {
            this.site.log("Could not calculate coordinates");
            return;
        }

        this.points.push([Zx, side * Zy]);

        // redraw if applicable
        if (this.site != undefined) this.site.redraw();
    }

    /**
     * Add a point using distance/bearing measurements
     *
     *  N
     *  |
     *  |
     *  |  P
     *  | /
     *  |/
     *  A---E
     * Measurements: 2 - 60
     */
    addPointBearing(distance, bearing) {
        // ALPHA: all points are based on point A (0,0), left middle, baseline straight right, north straight up.
        bearing = bearing - 90; // setting north up, not right
        let coordX = distance * Math.cos(bearing * Math.PI / 180);
        let coordY = distance * Math.sin(bearing * Math.PI / 180);

        if (isNaN(coordX) || isNaN(coordY)) {
            this.site.log("Could not calculate coordinates");
            return;
        }

        this.points.push([coordX, coordY]);

        // redraw if applicable
        if (this.site != undefined) this.site.redraw();
    }

    /**
     * Force side
     *
     * Ignore coordinates, force object to be on the specified side, mirror image
     * if required.
     *
     * Is this really useful? To clear mistakes in the measurements? To offer simpler measuring method?
     *
     * What if an object is overlapping the baseline?
    setSide(side) {
        //check all the points, make sure most are on the right side, if not then reverse everything
    }
    */

    setSite(site) {
        this.site = site;
    }

    setShape(shape) {
        this.shape = shape;
    }

    setColor(color) {
        this.color = color;
    }

    getOverview() {
        let overview = $(templateObject);
        $(".label", overview).text(this.label);

        // Displaying the points
        for (let i = 0; i < this.points.length; i++)
            $(".points", overview).append("<p>[" + this.points[i].join() + "]</p>");

        // Control buttons
        let that = this;
        $(".add-point-bo", overview).on("click", function(){that.showPointBOModal()});
        $(".add-point-tri", overview).on("click", function(){that.showPointTriModal()});
        $(".add-point-bearing", overview).on("click", function(){that.showPointBearingModal()});

        return overview;
    }

    showPointBOModal() {
        DomHelper.userInput({baseline: "int", offset: "int"}, {create: this.handlerCreatePointBO, cancel: this.handlerCancel}, this);
    }

    showPointTriModal() {
        DomHelper.userInput({baseline1: "int", triangulation1: "int", baseline2: "int", triangulation2: "int"}, {create: this.handlerCreatePointTri, cancel: this.handlerCancel}, this);
    }

    showPointBearingModal() {
        DomHelper.userInput({distance: "int", bearing: "int"}, {create: this.handlerCreatePointBearing, cancel: this.handlerCancel}, this);
    }

    handlerCreatePointBO(variables, context) {
        context.addPointBO(parseInt(variables.baseline), parseInt(variables.offset));
    }

    handlerCreatePointTri(variables, context) {
        context.addPointTri(variables.baseline1, variables.triangulation1, variables.baseline2, variables.triangulation2);
    }

    handlerCreatePointBearing(variables, context) {
        context.addPointBearing(variables.distance, variables.bearing);
    }

    handlerCancel() {} // do nothing
}

// Making available to upper scopes
let mySitePlotter = new SitePlotter($('.site-plotter')[0]);

// Tests
if (DomHelper.getVar('testtrigo') == 1) {
    let box2;

    box2 = new SiteObject("box2");
    box2.addPointTri(0, 300, 400, 500);
    box2.addPointTri(0, 500, 300, 400);
    console.log("0, 300, 400, 500 => 0, 300");
    console.log("0, 500, 300, 400 => 300, 400");
    console.log(box2.points);

    box2 = new SiteObject("box2");
    box2.addPointBO(0, 300);
    box2.addPointBO(300, 400);
    console.log("0, 300");
    console.log("300, 400");
    console.log(box2.points);

    box2 = new SiteObject("box2");
    box2.addPointTri(300, 453, 800, 399);
    box2.addPointTri(300, 636, 1100, 434);
    console.log(box2.points);
}

// ALPHA
// - baseline / offset measurements
if (DomHelper.getVar('testbo') == 1) {
    let col1 = new SiteObject("column 1");
    col1.setShape("oval");
    col1.addPointBO(73, 292);
    col1.addPointBO(111, 260);
    col1.addPointBO(141, 292);
    mySitePlotter.addObject(col1);

    let box2 = new SiteObject("box2");
    box2.addPointBO(594, 342);
    box2.addPointBO(836, 343);
    mySitePlotter.addObject(box2);

    let col3 = new SiteObject("column 3");
    col3.setShape("oval");
    col3.addPointBO(788, 292);
    col3.addPointBO(820, 258);
    col3.addPointBO(854, 292);
    mySitePlotter.addObject(col3);

    let col4 = new SiteObject("column 4");
    col4.setShape("oval");
    col4.addPointBO(857, -293);
    col4.addPointBO(820, -260);
    col4.addPointBO(785, -291);
    mySitePlotter.addObject(col4);

    let col5 =  new SiteObject("column 5");
    col5.addPointBO(144, -293);
    col5.addPointBO(109, -260);
    col5.addPointBO(77, -292);
    mySitePlotter.addObject(col5);
}

// - tri measurements
if (DomHelper.getVar('testtri') == 1) {
    let col1 = new SiteObject("column 1");
    col1.setShape("oval");
    col1.addPointTri(0, 302, 130, 297);
    col1.addPointTri(0, 283, 250, 296);
    col1.addPointTri(80, 299, 300, 333);
    mySitePlotter.addObject(col1);

    let box2 = new SiteObject("box2");
    box2.addPointTri(300, 453, 800, 399);
    box2.addPointTri(300, 636, 1100, 434);
    mySitePlotter.addObject(box2);

    let col3 = new SiteObject("column 3");
    col3.setShape("oval");
    col3.addPointTri(600, 348, 800, 293);
    col3.addPointTri(700, 286, 1000, 314);
    col3.addPointTri(900, 294, 1100, 381);
    mySitePlotter.addObject(col3);

    let col4 = new SiteObject("column 4");
    col4.setShape("oval");
    col4.addPointTri(1000, -330, 850, -294);
    col4.addPointTri(1000, -317, 700, -287);
    col4.addPointTri(800, -292, 600, -347);
    mySitePlotter.addObject(col4);

    let col5 =  new SiteObject("column 5");
    col5.addPointTri(300, -332, 100, -295);
    col5.addPointTri(300, -323, 0, -282);
    col5.addPointTri(100, -293, 0, -301);
    mySitePlotter.addObject(col5);
}

// Loading requested points if any
if (DomHelper.getVar('plot') != undefined) {
    mySitePlotter.loadJson(DomHelper.getVar('plot'));
}
