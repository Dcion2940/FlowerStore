# Ava

A landing page template.

* [Getting started](#getting-started)

## Getting started
* First, ensure that node.js & npm are both installed. If not, choose your OS and installation method from [this page](https://nodejs.org/en/download/package-manager/) and follow the instructions.
* Next, use your command line to enter your project directory.
* This template comes with a ready-to-use package file called `package-sample.json`. You just need to rename it to `package.json`, then run `npm install` to install all of the dependencies into your project.

You're ready to go! Run any task by typing `npm run task` (where "task" is the name of the task in the `"scripts"` object). The most useful task for rapid development is `watch`. It will start a new server, open up a browser and watch for any SCSS or JS changes in the `src` directory; once it compiles those changes, the browser will automatically inject the changed file(s)!

## Data

The raw Google Maps export is stored at `google-FlowerStore-2025-12-25.csv`. A cleaned version with semantic headers and normalized numeric values is available at `data/flowerstores.cleaned.csv` (generated via `python scripts/clean_flowerstores.py`). The cleaned schema is:

- `url`: Listing URL
- `name`: Business name
- `rating`: Float rating value
- `review_count`: Integer review count (blank if unavailable)
- `address`: Street address
- `phone`: Phone number (may be blank)
- `image_url`: Thumbnail URL
