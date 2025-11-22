## Site Plotter

[demo](http://chyro.github.io/dive-planner/rdp.calculator.html)

Designed for underwater archaeology. Takes a list of measurements, and plots the
matching points on a canvas.

Points can be entered based on:
- Baseline / offset measurements (e.g. 3m along the baseline, 2m to the left)
- Trigonometric measurements (e.g. 3m from point A, 5m from point B)
- Bearing measurements (e.g. 270 degrees from point A, 5m)

Next versions might:
* draw shapes, for better-looking maps
* add more primary points, add measurements based on any two primary points as a baseline
* handle levation?
* look better? Colors? Optional grids? Isometric 3D view? Zoom / scroll / rotate view area?
* support redundant measurements, calculate coordinates that minify measurements errors?

## Sample use

### Baseline/offset points
- [73,292], [111,260], [141,252]
- [594,342], [878,343]
- [788,292], [820,258], [854,292]
- [857,293], [820,260], [785,291]
- [144,293], [109, 260], [77,292]

[graph](http://chyro.github.io/site-plotter/site-plotter.html?plot=%7B%22Object%201%22:[[73,292],[111,260],[141,252]],%22Object%202%22:[[594,342],[878,343]],%22Object%203%22:[[788,292],[870,258],[854,292]],%22Object%204%22:[[857,293],[820,260],[785,291]],%22Object%205%22:[[144,293],[109,260],[77,292]]%7D)

### Trigonometric points points
- [0,302,130,297], [0,283,250,296], [80,299,300,333]
- [300,453,800,399], [300,636,1100,434]
- [600,348,800,293], [700,286,1000,314], [900,294,1100,381]
- [1000,330,850,294], [1000,317,700,287], [800,292,600,347]
- [300,332,100,295], [300,323,0,282], [100,293,0,301]

[graph](http://chyro.github.io/site-plotter/site-plotter.html?plot=%7B%22Object%201%22:[[76.5192307692308,292.14518192584524],[109.94599999999997,260.7697779344838],[141.16363636363636,292.67731307154105]],%22Object%202%22:[[596.008,342.91145203390334],[835.0875,343.7693519552754]],%22Object%203%22:[[788.1374999999999,292.75976686312276],[822,258.67353942759587],[853.1875,290.2491857762051]],%22Object%204%22:[[870.2285714285714,293.8220147070852],[580.2,260.80061349621093],[412.13750000000005,291.7476325418083]],%22Object%205%22:[[57.99749999999997,291.9945033622208],[-108.6583333333333,260.225607112794],[-73.76000000000002,291.82265573460876]]%7D)
