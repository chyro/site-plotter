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
TODO now
 * - make GUI controls work, to be usable from www:
 * -- clear all
 * -- add object
 * -- add point
 *
 * TODO Later...
 * ~ shapes: guestimate / draw shape based on measured points
 * ~ add primary points, add secondary points relative to any two primary points
 * ~ scale canvas to include all the required points
 * ~ user-GUI to scale / rotate canvas
 */

const baseLayout = `<canvas class="site" width="1000" height="1000"></canvas><div class="controls"><button class="add-primary">+primary point</button><button class="add-item">+item</button><span class="log"></span></div>`;

class SitePlotter {
    // properties:
    // area: HTML object
    // siteMap: HTML object
    // controls: HTML object
    // primaryPoints: array of points, to use for baseline // TODO
    // objects: array of SiteObjects
    constructor(area) {
        this.area = area;
        this.objects = [];

        // Set up layout
        $(area).append($(baseLayout));
        this.siteMap = $(".site", area)[0];
        this.controls = $(".controls", area)[0];

        Styler.drawCross(this.siteMap, 0, 500);

        // Control events
        //var that = this;
        //$(".add-etcetc", this.controls).on("click", function(e) { that.addEtcetc(); } );
    }

    log(message) {
        $(".log", this.controls).text(message);
    }

    addObject(object) {
        this.objects.push(object);
        this.drawObject(object);
        //TODO: might need a boundary check, and potential scale / redraw
        //TODO: Actually, this needs a better mechanism overall, e.g. manual draw on request, or auto-redraw on every change
    }

    drawObject(object) {
        if (object.color == undefined) {
            object.color = Styler.getRandomColor();
        }

        //draw the object on the canvas
        for (let i = 0; i < object.points.length; i++) {
            Styler.drawCross(this.siteMap, object.points[i][0], 500+object.points[i][1], object.color);
        }

        console.log(location.origin + location.pathname + '?plot=' + JSON.stringify(this.getJson()));
    }

    getJson() {
        let json = {};
        for (let i = 0; i < this.objects.length; i++) {
            let obj = this.objects[i];
            json[obj.label] = obj.points;
            // TODO: json[obj.label] = { points: obj.points, shape: etc };
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

    // TODO: style = "rainbow", style = "pencil", etc
    static getRandomColor() {
        let color;

        // completely random
        //color = '#'+Math.random().toString(16).substr(-6);

        // banning light colors (0-9 but no A-F)
        //color = '#'+Math.random().toString(10).substr(-6);

        // ensuring diversity by hardcoding colors (there must be a better way!)
        const randomColors = ["red", "blue", "green", "orange", "purple", "gray", "brown", "yellow"];
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

    constructor(label) {
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
        // ALPHA: all points are based on point A (0,0), left middle, baseline straight right.
        let coordX = baseline;
        let coordY = offset;
        this.points.push([coordX, coordY]);
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

        // ALPHA: all points are based on point A (0,0), left middle, baseline straight right.
        let X = [baseline1, 0];
        let Y = [baseline2, 0];
        let lengthXY = Math.abs(baseline2-baseline1);
        let lengthXZ = tri1;
        let lengthYZ = tri2;
        let angleXYZ = Math.acos((Math.pow(lengthXY, 2) + Math.pow(lengthYZ, 2) - Math.pow(lengthXZ, 2)) / (2 * lengthXY * lengthYZ));
        let Zx = Y[0] - side * lengthYZ * Math.cos(angleXYZ);
        let Zy = Y[1] + lengthYZ * Math.sin(angleXYZ);

        this.points.push([Zx, side * Zy]);
    }

    /**
     * Force side
     *
     * Ignore coordinates, force object to be on the specified side, mirror image
     * if required.
     * What if an object is overlapping the baseline?
     */
    setSide(side) {
        // TODO: check all the points, make sure most are on the right side, if not then reverse everything
    }

    setShape(shape) {
        this.shape = shape;
    }

    setColor(color) {
        this.color = color;
    }
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

if (DomHelper.getVar('plot') != undefined) {
    mySitePlotter.loadJson(DomHelper.getVar('plot'));
}

