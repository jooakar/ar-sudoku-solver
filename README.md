# AR Sudoku solver

Renders sudoku solutions on your camera feed in real time inside a browser window.

![demo gif](https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExcnh1ZDEyYWEzOWF6Z2t1ZmFyandmZ3pmYmZxaG9nN2s1dDJkbXpmZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/golF0SDsBUGNQaqL9D/giphy.gif)

Everything regarding image processing, solving the sudoku and rendering the solution are made by hand. The only major library used is [mathjs](https://mathjs.org/) for matrix calculations and trigonometric operations.

## Usage

```
npm run start
```

This runs the app in development mode. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Build

```
npm run build
```

Builds an optimized version in the `build/` directory

## Neural network

Trained to recognize single digits 1-9 using TensorFlow in Python. The final model can be found in `public/tfjs_model/` and works out of the box without any extra steps. See [this repo](https://github.com/jooakar/digit_recognition_ai) for steps on how to reproduce the model.

## Acknowledgements

The general project structure and methodologies were heavily inspired by this [amazing video](https://www.youtube.com/watch?v=cOC-ad0BsY0) by @atomic14, but all methods were researched and re-implemented in this project.
