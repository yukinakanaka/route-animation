# Route animation
## Demo 

![](docs/demo.gif)
## About animation
![](docs/key-frames.svg)
### Phases

Animation consists of three phases.
1. Fly Phase: Zoom into ZoomInView from GlobalView.
2. Rotation Phase: Route animation while the camera rotates.
3. Final Phase: Move to FinalView which show the whole route.

### Key frames
#### GlobalView
<img src="docs/globa-view.png" width="300">

#### ZoomInView
<img src="docs/zoom-in-view.png" width="300">

#### FinalView
<img src="docs/final-view.png" width="300">

## How To Use
1. Please set your Mapbox access token in `config.js`.
```
accessToken: "xxx",  // Please set your Mapbox access token.
record: true,        // If true, mp4 file will be created.
data: {...},         // (Optionl) Please set your geojson files.
videoSpeed: {...},   // (Optionl) Vide speed settings.
zoomInView: {...},   // (Optionl) ZoomInView's settings.
rotation: {...},     // (Optionl) Rotation settings.
finalView: {...},    // (Optionl) Final view's settings.
style: {...},        // (Optionl) Style settings.
videoEncorder: {...} // (Optionl) Video Encoder settings.
```

2. Run http server and Load index.html
  - Reference: HTTP Server with VSCode Extention, [local live server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer).


## References
- [impact-tools](https://github.com/mapbox/impact-tools/tree/master/journey-animation-sequence)
- [Query terrain elevation](https://docs.mapbox.com/mapbox-gl-js/example/query-terrain-elevation/)
- [BUILDING CINEMATIC ROUTE ANIMATIONS WITH MAPBOXGL](https://www.mapbox.com/blog/building-cinematic-route-animations-with-mapboxgl)