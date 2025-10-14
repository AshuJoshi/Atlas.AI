# Atlas.AI

Inspired by:  
[Bloomberg](https://www.bloomberg.com/news/features/2025-10-07/openai-s-nvidia-amd-deals-boost-1-trillion-ai-boom-with-circular-deals)  
[Financial Times](https://www.instagram.com/p/DPjeUpVgKTZ/).   

This project is an interactive, data-driven visualization of the complex relationships between major players in the Artificial Intelligence industry, including hyperscalers, foundation model companies, and chip manufacturers.  

The visualization is built using the D3.js library and is rendered in your browser using HTML, CSS, and SVG.

---

### Key Features

*   **Interactive Physics Simulation:** Nodes arrange themselves naturally based on a force-directed simulation.
*   **Data-Driven:** The entire graph is generated from simple data files (`nodes.csv`, `links.csv`, `references.json`).
*   **Rich Interaction Model:**
    *   **Node Isolation:** Click any node to fade out the rest of the graph and focus on its immediate connections.
    *   **Legend Filtering:** Click any category in the legend to highlight all associated nodes and their neighbors.
    *   **Detailed Sourcing:** Click any connection to view details and links to source articles.
    *   **Manual Layout:** Drag nodes to pin them in place; double-click to release them back into the simulation.
*   **Proportional & Shaped Nodes:**
    *   Company nodes are circular, with a size proportional to their market valuation.
    *   Valuations are displayed directly on the node (e.g., $500B or $4.58T).
    *   Abstract 'Project' nodes are represented as squares.
*   **Categorical Coloring:** Nodes are colored by category (e.g., Hyperscaler, Foundation Model) for easy identification.

### Technology Stack

*   HTML5
*   CSS3
*   JavaScript (ES6)
*   D3.js (v7)

### How to Run Locally

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

### Data Structure

The visualization is powered by three files in the root directory:

*   `nodes.csv`: Defines the entities (companies and projects).
    *   `id`: Unique identifier for the node.
    *   `name`: Display name.
    *   `market_cap`: Market capitalization in billions. Blank for projects.
    *   `category`: Functional grouping (e.g., 'Chips', 'Hyperscaler').
    *   `logo`: (Optional) Path to a logo file.
    *   `type`: The entity type, either 'Company' or 'Project'.
*   `links.csv`: Defines the relationships between entities.
    *   `source`: The `id` of the source node.
    *   `target`: The `id` of the target node.
    *   `type`: The category of the link (e.g., 'Investment', 'Hardware').
    *   `reference_id`: An ID that maps to an entry in `references.json`.
*   `references.json`: Stores the source articles and details for relationships.
    *   Contains a dictionary where keys match the `reference_id` from `links.csv`.
    *   Each entry contains a list of sources with a `url`, `title`, and `publication_date`.

To add or change the data, simply edit these files.

### License

This project is licensed under the MIT License.
