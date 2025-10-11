# Atlas.AI

Inspired by:  
[Bloomberg](https://www.bloomberg.com/news/features/2025-10-07/openai-s-nvidia-amd-deals-boost-1-trillion-ai-boom-with-circular-deals)  
[Financial Times](https://www.instagram.com/p/DPjeUpVgKTZ/).   

This project is an interactive, data-driven visualization of the complex relationships between major players in the Artificial Intelligence industry, including hyperscalers, foundation model companies, and chip manufacturers.  

The visualization is built using the D3.js library and is rendered in your browser using HTML, CSS, and SVG.

---

#### Features

* **Interactive Physics Simulation:** Nodes arrange themselves naturally and can be dragged and dropped.
* **Data-Driven:** The entire graph is generated from two simple CSV files (`nodes.csv` and `links.csv`).
* **Proportional Sizing:** The size of each company's circle is proportional to its market valuation.
* **Categorical Coloring:** Nodes are colored by category (Hyperscaler, Chip/Semi, etc.) for easy identification.
* **Curved & Parallel Links:** Multiple relationships between the same two companies are visualized as distinct, curved paths.

#### Technology Stack

* HTML5
* CSS3
* JavaScript (ES6)
* D3.js (v7)

#### How to Run Locally

1.  Clone this repository.
2.  Navigate into the project directory.
3.  Because of browser security policies (CORS), you need to serve the files from a local web server. The easiest way is with Python:
    ```bash
    # For Python 3
    python -m http.server

    # For Python 2
    python -m SimpleHTTPServer
    ```
4.  Open your browser and navigate to `http://localhost:8000`.

#### Data

Note - the market valuations are bases on data as of September/October 2025.

The visualization is powered by two files:
* `nodes.csv`: Defines the companies, their market caps, and categories.
* `links.csv`: Defines the relationships between companies. The direction of the arrow follows a "Provider → Consumer" logic.

To add or change the data, simply edit these CSV files.

#### License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.