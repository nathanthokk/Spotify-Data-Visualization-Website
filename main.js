// Common embed options for all charts
const embedOpts = {
  actions: { export: true, source: false, editor: true }
};

// Global references to views for cross-chart coordination
let embeddingView = null;
let genreBarView = null;

/**
 * MAIN VIEW: PCA embedding scatterplot with brush selection
 */
const embeddingScatterSpec = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  description: "PCA embedding of Spotify tracks.",
  data: { url: "embeddings_2d.csv" },
  width: "container",
  height: 300,
  background: "transparent",
  selection: {
    brush: {
      type: "interval",
      encodings: ["x", "y"]
    },
    genreHighlight: {
      type: "multi",
      fields: ["track_genre"],
      bind: "legend"
    }
  },
  encoding: {
    x: {
      field: "pca1",
      type: "quantitative",
      title: "PCA 1 (Energy/Loudness vs Acousticness)",
      scale: { zero: false }
    },
    y: {
      field: "pca2",
      type: "quantitative",
      title: "PCA 2 (Danceability vs Valence)",
      scale: { zero: false }
    },
    color: {
      field: "track_genre",
      type: "nominal",
      title: "Genre"
    },
    opacity: {
      condition: [
        { selection: "brush", value: 0.9 },
        { selection: "genreHighlight", value: 1.0 }
      ],
      value: 0.3
    },
    tooltip: [
      { field: "track_name", type: "nominal", title: "Track" },
      { field: "track_genre", type: "nominal", title: "Genre" },
      { field: "energy", type: "quantitative", format: ".2f" },
      { field: "valence", type: "quantitative", format: ".2f" },
      { field: "danceability", type: "quantitative", format: ".2f" },
      { field: "tempo", type: "quantitative", format: ".1f" }
    ]
  },
  mark: { type: "point", filled: true, size: 50 }
};

/**
 * Genre distribution for brushed points (shown below embedding)
 */
const brushedGenreSpec = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  description: "Genre distribution within brushed region.",
  data: { url: "embeddings_2d.csv" },
  width: 1000,
  height: 160,
  background: "transparent",
  transform: [
    { filter: { selection: "brush" } }
  ],
  mark: { type: "bar", size: 14 },
  encoding: {
    x: {
      field: "track_genre",
      type: "nominal",
      sort: "-y",
      title: "Genre (within brushed region)"
    },
    y: {
      aggregate: "count",
      type: "quantitative",
      title: "Number of Tracks"
    },
    color: {
      field: "track_genre",
      type: "nominal"
    },
    tooltip: [
      { field: "track_genre", type: "nominal", title: "Genre" },
      { aggregate: "count", type: "quantitative", title: "Tracks in brush" }
    ]
  }
};

/**
 * Energy-Valence view that shares brush selection with embedding
 */
const energyValenceLinkedSpec = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  description: "Energy vs Valence for brushed tracks.",
  data: { url: "embeddings_2d.csv" },
  width: "container",
  height: 300,
  background: "transparent",
  mark: { type: "point", filled: true, size: 60 },
  encoding: {
    x: {
      field: "energy",
      type: "quantitative",
      title: "Energy",
      scale: { domain: [0, 1] }
    },
    y: {
      field: "valence",
      type: "quantitative",
      title: "Valence",
      scale: { domain: [0, 1] }
    },
    color: {
      field: "track_genre",
      type: "nominal",
      title: "Genre",
      legend: {
        // Share the same legend configuration
        title: "Genre"
      }
    },
    opacity: {
      condition: { selection: "genreHighlight", value: 1.0 },
      value: 0.3
    },
    tooltip: [
      { field: "track_name", type: "nominal", title: "Track" },
      { field: "track_genre", type: "nominal", title: "Genre" },
      { field: "energy", type: "quantitative", format: ".2f" },
      { field: "valence", type: "quantitative", format: ".2f" },
      { field: "danceability", type: "quantitative", format: ".2f" },
      { field: "tempo", type: "quantitative", format: ".1f" }
    ]
  }
};

/**
 * Combined embedding view with brushed genre chart and energy-valence view
 * This is a multiple-view visualization with linked brushing
 * All views share the same brush selection
 */
// Properly share genreHighlight selection across both charts
// Define selection in both views and use resolve to share them
// Legend bound to right chart only
// Brush selection defined in left chart and shared via resolve
const embeddingWithGenreSpec = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  description: "PCA embedding with linked genre distribution and energy-valence view.",
  data: { url: "embeddings_2d.csv" },
  vconcat: [
    {
      // Top: embedding scatterplot and energy-valence side by side
      hconcat: [
        {
          $schema: "https://vega.github.io/schema/vega-lite/v5.json",
          description: "PCA embedding of Spotify tracks.",
          data: { url: "embeddings_2d.csv" },
          width: 500,
          height: 320,
          background: "transparent",
          selection: {
            brush: {
              type: "interval",
              encodings: ["x", "y"]
            },
            genreHighlight: {
              type: "multi",
              fields: ["track_genre"]
              // No bind here - legend will be on right chart
            }
          },
          encoding: {
            x: {
              field: "pca1",
              type: "quantitative",
              title: "PCA 1 (Energy/Loudness vs Acousticness)",
              scale: { zero: false }
            },
            y: {
              field: "pca2",
              type: "quantitative",
              title: "PCA 2 (Danceability vs Valence)",
              scale: { zero: false }
            },
            color: {
              field: "track_genre",
              type: "nominal",
              title: "Genre",
              legend: null  // Hide legend on left chart
            },
            opacity: {
              condition: [
                { selection: "brush", value: 0.9 },
                { selection: "genreHighlight", value: 1.0 }
              ],
              value: 0.3
            },
            tooltip: [
              { field: "track_name", type: "nominal", title: "Track" },
              { field: "track_genre", type: "nominal", title: "Genre" },
              { field: "energy", type: "quantitative", format: ".2f" },
              { field: "valence", type: "quantitative", format: ".2f" },
              { field: "danceability", type: "quantitative", format: ".2f" },
              { field: "tempo", type: "quantitative", format: ".1f" }
            ]
          },
          mark: { type: "point", filled: true, size: 50 }
        },
        {
          ...energyValenceLinkedSpec,
          width: 500,
          height: 320,
          // Filter to show only tracks selected by brush in left chart
          transform: [
            { filter: { selection: "brush" } }
          ],
          selection: {
            brush: {
              type: "interval",
              encodings: ["x", "y"]
            },
            genreHighlight: {
              type: "multi",
              fields: ["track_genre"],
              bind: "legend"  // Legend bound here to control both charts
            }
          }
        }
      ],
      resolve: {
        selection: {
          brush: "union",  // Share brush selection between both charts
          genreHighlight: "union"  // Share the genre selection between both charts
        }
      }
    },
    {
      // Bottom: genre distribution for brushed points
      // Need to define brush selection here too so it can filter
      ...brushedGenreSpec,
      selection: {
        brush: {
          type: "interval",
          encodings: ["x", "y"]
        }
      }
    }
  ],
  resolve: {
    selection: {
      brush: "union"  // Share brush across all views in vconcat
    }
  }
};

/**
 * SINGLE-VIEW REUSED VISUALIZATION:
 * Overall genre distribution from filtered.csv with click selection.
 * This is a single-view visualization that can filter the embedding.
 */
const genreBarSpec = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  description: "Single-view: overall count of tracks per genre with selection.",
  data: { url: "filtered.csv" },
  width: 350,
  height: 380,
  background: "transparent",
  config: {
    axis: {
      labelColor: "#ffffff",
      titleColor: "#ffffff",
      gridColor: "rgba(255, 255, 255, 0.1)",
      domainColor: "rgba(255, 255, 255, 0.3)"
    },
    text: {
      color: "#ffffff"
    }
  },
  selection: {
    genreSelect: {
      type: "multi",
      fields: ["track_genre"],
      bind: "legend"
    }
  },
  mark: { type: "bar", size: 16 },
  encoding: {
    x: {
      field: "track_genre",
      type: "nominal",
      sort: "-y",
      title: "Genre",
      axis: { labelColor: "#ffffff", titleColor: "#ffffff" }
    },
    y: {
      aggregate: "count",
      type: "quantitative",
      title: "Number of Tracks",
      axis: { labelColor: "#ffffff", titleColor: "#ffffff" }
    },
    color: {
      field: "track_genre",
      type: "nominal",
      legend: { 
        title: "Click to highlight in embedding",
        titleColor: "#ffffff",
        labelColor: "#ffffff",
        orient: "bottom"
      }
    },
    opacity: {
      condition: { selection: "genreSelect", value: 1.0 },
      value: 0.5
    },
    tooltip: [
      { field: "track_genre", type: "nominal", title: "Genre" },
      { aggregate: "count", type: "quantitative", title: "Tracks" }
    ]
  }
};

/**
 * DETAIL VIEW (Multiple-view with linked interaction):
 * Energy vs Valence scatterplot that responds to brush selection.
 * This shows the relationship between audio features for selected points.
 * Note: This will be updated via JavaScript to respond to brush changes.
 */
const energyValenceSpec = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  description: "Detail: Energy vs Valence for selected tracks.",
  data: { url: "embeddings_2d.csv" },
  width: "container",
  height: "container",
  mark: { type: "point", filled: true, size: 60 },
  encoding: {
    x: {
      field: "energy",
      type: "quantitative",
      title: "Energy",
      scale: { domain: [0, 1] }
    },
    y: {
      field: "valence",
      type: "quantitative",
      title: "Valence",
      scale: { domain: [0, 1] }
    },
    color: {
      field: "track_genre",
      type: "nominal",
      title: "Genre"
    },
    opacity: {
      value: 0.6
    },
    tooltip: [
      { field: "track_name", type: "nominal", title: "Track" },
      { field: "track_genre", type: "nominal", title: "Genre" },
      { field: "energy", type: "quantitative", format: ".2f" },
      { field: "valence", type: "quantitative", format: ".2f" },
      { field: "danceability", type: "quantitative", format: ".2f" },
      { field: "tempo", type: "quantitative", format: ".1f" }
    ]
  }
};

// Note: Energy-valence view is now part of the combined embedding view,
// so it automatically shares the brush selection. No separate update function needed.

/**
 * SECOND EMBEDDING: Multi-view exploration with genre/popularity scatterplots,
 * pie charts, and album/track exploration
 */

// Genre color mapping
const genreColorMap = {
  "metal": "#4e79a7",
  "electronic": "#f28e2b",
  "soul": "#e15759",
  "funk": "#76b7b2",
  "house": "#59a14f",
  "r-n-b": "#edc948",
  "pop": "#b07aa1",
  "country": "#ff9da7",
  "jazz": "#9c755f",
  "hip-hop": "#8da0cb",
  "classical": "#a3a5b3",
  "samba": "#d1a78c"
};

// Second embedding spec with all the linked views
// Define selections at top level to share across all views
const secondEmbeddingSpec = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  description: "Multi-view exploration: genre/popularity scatterplots, pie charts, and album/track views",
  background: "transparent",
  config: {
    axis: {
      labelColor: "#ffffff",
      titleColor: "#ffffff",
      labelFont: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      titleFont: "Poppins, sans-serif",
      gridColor: "rgba(255, 255, 255, 0.1)",
      domainColor: "rgba(255, 255, 255, 0.3)"
    },
    text: { 
      color: "#ffffff",
      font: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      fontSize: 12
    },
    title: {
      color: "#ffffff",
      font: "Poppins, sans-serif",
      fontSize: 14,
      fontWeight: 600
    },
    legend: {
      labelColor: "#ffffff",
      titleColor: "#ffffff",
      labelFont: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      titleFont: "Poppins, sans-serif"
    },
    arc: {
      stroke: "rgba(255, 255, 255, 0.1)"
    }
  },
  hconcat: [
    {
      // Left column: Genre scatter + Genre pie
      vconcat: [
        {
          // Genre scatterplot
          $schema: "https://vega.github.io/schema/vega-lite/v5.json",
          description: "PCA Colored by Genre",
          data: { url: "embeddings_2d.csv" },
          width: 500,
          height: 350,
          title: {
            text: "PCA Colored by Genre",
            color: "#ffffff",
            font: "Poppins, sans-serif",
            fontSize: 14,
            fontWeight: 600
          },
          background: "transparent",
          selection: {
            brush2: {
              type: "interval",
              encodings: ["x", "y"]
            },
            genreSelect2: {
              type: "multi",
              fields: ["track_genre"],
              bind: "legend"
            },
            genrePieSelect: {
              type: "multi",
              fields: ["track_genre"]
            },
            popularityPieSelect: {
              type: "multi",
              fields: ["pop_bin"]
            },
            albumSelect2: {
              type: "multi",
              fields: ["album_name"],
              empty: "none"
            },
            albumBrush: {
              type: "interval",
              encodings: ["x"]
            },
            trackSelect2: {
              type: "multi",
              fields: ["track_name"],
              empty: "none"
            }
          },
          transform: [
            {
              calculate: "datum.popularity < 20 ? '(0,20]' : datum.popularity < 40 ? '(20,40]' : datum.popularity < 60 ? '(40,60]' : datum.popularity < 80 ? '(60,80]' : '(80,100]'",
              as: "pop_bin"
            }
          ],
          mark: { type: "circle", size: 60 },
          encoding: {
            x: {
              field: "pca1",
              type: "quantitative",
              title: "PCA 1",
              scale: { zero: false }
            },
            y: {
              field: "pca2",
              type: "quantitative",
              title: "PCA 2",
              scale: { zero: false }
            },
            color: {
              condition: {
                selection: "brush2",
                field: "track_genre",
                type: "nominal",
                scale: {
                  domain: Object.keys(genreColorMap),
                  range: Object.values(genreColorMap)
                }
              },
              value: "lightgrey"
            },
            opacity: {
              condition: [
                { selection: "genreSelect2", value: 1 },
                { selection: "genrePieSelect", value: 1 },
                { selection: "popularityPieSelect", value: 1 },
                { selection: "albumSelect2", value: 1 },
                { selection: "trackSelect2", value: 1 }
              ],
              value: 0
            },
            tooltip: [
              { field: "track_name", type: "nominal", title: "Track" },
              { field: "album_name", type: "nominal", title: "Album" },
              { field: "track_genre", type: "nominal", title: "Genre" },
              { field: "popularity", type: "quantitative", title: "Popularity" }
            ]
          }
        },
        {
          // Genre pie chart
          $schema: "https://vega.github.io/schema/vega-lite/v5.json",
          description: "Genre Distribution",
          data: { url: "embeddings_2d.csv" },
          width: 500,
          height: 300,
          title: {
            text: "Genre Distribution",
            color: "#ffffff",
            font: "Poppins, sans-serif",
            fontSize: 14,
            fontWeight: 600
          },
          background: "transparent",
          transform: [
            {
              calculate: "datum.popularity < 20 ? '(0,20]' : datum.popularity < 40 ? '(20,40]' : datum.popularity < 60 ? '(40,60]' : datum.popularity < 80 ? '(60,80]' : '(80,100]'",
              as: "pop_bin"
            },
            { filter: { selection: "brush2" } },
            { filter: { field: "track_genre", oneOf: Object.keys(genreColorMap) } }
          ],
          mark: { type: "arc" },
          encoding: {
            theta: { aggregate: "count", type: "quantitative", stack: true },
            color: {
              field: "track_genre",
              type: "nominal",
              scale: {
                domain: Object.keys(genreColorMap),
                range: Object.values(genreColorMap)
              },
              legend: { title: "Genre" }
            },
            opacity: {
              condition: { selection: "genrePieSelect", value: 1 },
              value: 0.7
            },
            tooltip: [
              { field: "track_genre", type: "nominal", title: "Genre" },
              { aggregate: "count", type: "quantitative", title: "Count" }
            ]
          },
          selection: {
            brush2: {
              type: "interval",
              encodings: ["x", "y"]
            },
            genreSelect2: {
              type: "multi",
              fields: ["track_genre"]
            },
            genrePieSelect: {
              type: "multi",
              fields: ["track_genre"]
            },
            popularityPieSelect: {
              type: "multi",
              fields: ["pop_bin"]
            },
            albumSelect2: {
              type: "multi",
              fields: ["album_name"],
              empty: "none"
            },
            albumBrush: {
              type: "interval",
              encodings: ["x"]
            },
            trackSelect2: {
              type: "multi",
              fields: ["track_name"],
              empty: "none"
            }
          }
        }
      ],
      resolve: {
        selection: {
          brush2: "union",
          genreSelect2: "union",
          genrePieSelect: "union",
          popularityPieSelect: "union",
          albumSelect2: "union",
          albumBrush: "union",
          trackSelect2: "union"
        }
      }
    },
    {
      // Middle column: Popularity scatter + Popularity pie
      vconcat: [
        {
          // Popularity scatterplot
          $schema: "https://vega.github.io/schema/vega-lite/v5.json",
          description: "PCA Colored by Popularity",
          data: { url: "embeddings_2d.csv" },
          width: 500,
          height: 350,
          title: {
            text: "PCA Colored by Popularity",
            color: "#ffffff",
            font: "Poppins, sans-serif",
            fontSize: 14,
            fontWeight: 600
          },
          background: "transparent",
          transform: [
            {
              calculate: "datum.popularity < 20 ? '(0,20]' : datum.popularity < 40 ? '(20,40]' : datum.popularity < 60 ? '(40,60]' : datum.popularity < 80 ? '(60,80]' : '(80,100]'",
              as: "pop_bin"
            }
          ],
          mark: { type: "circle", size: 60 },
          encoding: {
            x: {
              field: "pca1",
              type: "quantitative",
              title: "PCA 1",
              scale: { zero: false }
            },
            y: {
              field: "pca2",
              type: "quantitative",
              title: "PCA 2",
              scale: { zero: false }
            },
            color: {
              condition: {
                selection: "brush2",
                field: "popularity",
                type: "quantitative",
                scale: { scheme: "greens" }
              },
              value: "lightgrey"
            },
            opacity: {
              condition: [
                { selection: "genreSelect2", value: 1 },
                { selection: "genrePieSelect", value: 1 },
                { selection: "popularityPieSelect", value: 1 },
                { selection: "albumSelect2", value: 1 },
                { selection: "trackSelect2", value: 1 }
              ],
              value: 0
            },
            tooltip: [
              { field: "track_name", type: "nominal", title: "Track" },
              { field: "album_name", type: "nominal", title: "Album" },
              { field: "track_genre", type: "nominal", title: "Genre" },
              { field: "popularity", type: "quantitative", title: "Popularity" }
            ]
          },
          selection: {
            brush2: {
              type: "interval",
              encodings: ["x", "y"]
            },
            genreSelect2: {
              type: "multi",
              fields: ["track_genre"]
            },
            genrePieSelect: {
              type: "multi",
              fields: ["track_genre"]
            },
            popularityPieSelect: {
              type: "multi",
              fields: ["pop_bin"]
            },
            albumSelect2: {
              type: "multi",
              fields: ["album_name"],
              empty: "none"
            },
            albumBrush: {
              type: "interval",
              encodings: ["x"]
            },
            trackSelect2: {
              type: "multi",
              fields: ["track_name"],
              empty: "none"
            }
          }
        },
        {
          // Popularity pie chart
          $schema: "https://vega.github.io/schema/vega-lite/v5.json",
          description: "Popularity Distribution",
          data: { url: "embeddings_2d.csv" },
          width: 500,
          height: 300,
          title: {
            text: "Popularity Distribution",
            color: "#ffffff",
            font: "Poppins, sans-serif",
            fontSize: 14,
            fontWeight: 600
          },
          background: "transparent",
          transform: [
            {
              calculate: "datum.popularity < 20 ? '(0,20]' : datum.popularity < 40 ? '(20,40]' : datum.popularity < 60 ? '(40,60]' : datum.popularity < 80 ? '(60,80]' : '(80,100]'",
              as: "pop_bin"
            },
            { filter: { selection: "brush2" } }
          ],
          mark: { type: "arc" },
          encoding: {
            theta: { aggregate: "count", type: "quantitative", stack: true },
            color: {
              field: "pop_bin",
              type: "nominal",
              scale: { scheme: "greens" },
              legend: { title: "Popularity" }
            },
            opacity: {
              condition: { selection: "popularityPieSelect", value: 1 },
              value: 0.7
            },
            tooltip: [
              { field: "pop_bin", type: "nominal", title: "Popularity Range" },
              { aggregate: "count", type: "quantitative", title: "Count" }
            ]
          },
          selection: {
            brush2: {
              type: "interval",
              encodings: ["x", "y"]
            },
            genreSelect2: {
              type: "multi",
              fields: ["track_genre"]
            },
            genrePieSelect: {
              type: "multi",
              fields: ["track_genre"]
            },
            popularityPieSelect: {
              type: "multi",
              fields: ["pop_bin"]
            },
            albumSelect2: {
              type: "multi",
              fields: ["album_name"],
              empty: "none"
            },
            albumBrush: {
              type: "interval",
              encodings: ["x"]
            },
            trackSelect2: {
              type: "multi",
              fields: ["track_name"],
              empty: "none"
            }
          }
        }
      ],
      resolve: {
        selection: {
          brush2: "union",
          genreSelect2: "union",
          genrePieSelect: "union",
          popularityPieSelect: "union",
          albumSelect2: "union",
          albumBrush: "union",
          trackSelect2: "union"
        }
      }
    },
    {
      // Right column: Albums linked views
      vconcat: [
        {
          // Albums bar chart
          $schema: "https://vega.github.io/schema/vega-lite/v5.json",
          description: "Album Popularity",
          data: { url: "filtered.csv" },
          width: 600,
          height: 180,
          background: "transparent",
          transform: [
            {
              aggregate: [
                { op: "mean", field: "popularity", as: "mean_popularity" },
                { op: "count", field: "track_id", as: "num_songs" }
              ],
              groupby: ["album_name", "track_genre"]
            },
            {
              filter: "datum.num_songs >= 5 && datum.num_songs <= 15 && datum.mean_popularity > 1"
            }
          ],
          mark: { type: "bar" },
          encoding: {
            x: {
              field: "album_name",
              type: "nominal",
              axis: { labels: false, ticks: false, title: "Albums" }
            },
            y: {
              field: "mean_popularity",
              type: "quantitative",
              title: "Album Popularity"
            },
            color: {
              condition: { selection: "albumBrush", value: "red" },
              value: "lightgray"
            },
            tooltip: [
              { field: "album_name", type: "nominal", title: "Album" },
              { field: "mean_popularity", type: "quantitative", title: "Popularity", format: ".2f" },
              { field: "num_songs", type: "quantitative", title: "Songs" }
            ]
          },
          selection: {
            albumBrush: {
              type: "interval",
              encodings: ["x"]
            }
          }
        },
        {
          // Albums zoomed bar chart
          $schema: "https://vega.github.io/schema/vega-lite/v5.json",
          description: "Album Popularity (Zoomed)",
          data: { url: "filtered.csv" },
          width: 600,
          height: 180,
          background: "transparent",
          transform: [
            {
              aggregate: [
                { op: "mean", field: "popularity", as: "mean_popularity" },
                { op: "count", field: "track_id", as: "num_songs" }
              ],
              groupby: ["album_name", "track_genre"]
            },
            {
              filter: "datum.num_songs >= 5 && datum.num_songs <= 15 && datum.mean_popularity > 1"
            },
            { filter: { selection: "albumBrush" } }
          ],
          mark: { type: "bar" },
          encoding: {
            x: {
              field: "album_name",
              type: "nominal",
              axis: { labels: false, ticks: false, title: "Albums (Zoomed)" }
            },
            y: {
              field: "mean_popularity",
              type: "quantitative",
              title: "Album Popularity"
            },
            color: {
              condition: { selection: "albumSelect2", value: "red" },
              value: "lightgray"
            },
            tooltip: [
              { field: "album_name", type: "nominal", title: "Album" },
              { field: "mean_popularity", type: "quantitative", title: "Popularity", format: ".2f" },
              { field: "num_songs", type: "quantitative", title: "Songs" }
            ]
          },
          selection: {
            albumSelect2: {
              type: "multi",
              fields: ["album_name"],
              empty: "none"
            }
          }
        },
        {
          // Tracks bar chart
          $schema: "https://vega.github.io/schema/vega-lite/v5.json",
          description: "Selected Album Songs",
          data: { url: "filtered.csv" },
          width: 600,
          height: 180,
          background: "transparent",
          transform: [
            {
              aggregate: [
                { op: "mean", field: "popularity", as: "popularity" }
              ],
              groupby: ["album_name", "track_name", "track_genre"]
            },
            {
              calculate: "datum.track_name + ' (' + datum.track_genre + ')'",
              as: "track_with_genre"
            },
            { filter: { selection: "albumSelect2" } }
          ],
          mark: { type: "bar", size: 30 },
          encoding: {
            x: {
              field: "track_with_genre",
              type: "nominal",
              axis: { labels: false, ticks: false, title: "Selected Album Songs" },
              scale: { paddingInner: 0.5, paddingOuter: 0.5 }
            },
            y: {
              field: "popularity",
              type: "quantitative",
              title: "Song Popularity"
            },
            color: {
              condition: {
                selection: "trackSelect2",
                field: "track_genre",
                type: "nominal",
                title: "Genre"
              },
              value: "lightgray"
            },
            tooltip: [
              { field: "track_name", type: "nominal", title: "Track" },
              { field: "track_genre", type: "nominal", title: "Genre" },
              { field: "album_name", type: "nominal", title: "Album" },
              { field: "popularity", type: "quantitative", title: "Popularity", format: ".2f" }
            ]
          },
          selection: {
            albumSelect2: {
              type: "multi",
              fields: ["album_name"],
              empty: "none"
            },
            trackSelect2: {
              type: "multi",
              fields: ["track_name"],
              empty: "none"
            }
          }
        }
      ],
      resolve: {
        selection: {
          albumBrush: "union",
          albumSelect2: "union",
          trackSelect2: "union"
        }
      }
    }
  ],
  resolve: {
    selection: {
      brush2: "union",
      genreSelect2: "union",
      genrePieSelect: "union",
      popularityPieSelect: "union",
      albumSelect2: "union",
      albumBrush: "union",
      trackSelect2: "union"
    }
  }
};

// Function to update embedding view based on genre selection from bottom bar chart
function updateEmbeddingView(selectedGenres) {
  // Create a new spec with the selected genres pre-set in the genreHighlight selection
  const spec = {
    ...embeddingWithGenreSpec,
    vconcat: [
      {
        hconcat: [
          {
            $schema: "https://vega.github.io/schema/vega-lite/v5.json",
            description: "PCA embedding of Spotify tracks.",
            data: { url: "embeddings_2d.csv" },
            width: 500,
            height: 320,
            background: "transparent",
            selection: {
              brush: {
                type: "interval",
                encodings: ["x", "y"]
              },
              genreHighlight: {
                type: "multi",
                fields: ["track_genre"],
                value: selectedGenres && selectedGenres.length > 0 ? selectedGenres : null
              }
            },
            encoding: {
              x: {
                field: "pca1",
                type: "quantitative",
                title: "PCA 1 (Energy/Loudness vs Acousticness)",
                scale: { zero: false }
              },
              y: {
                field: "pca2",
                type: "quantitative",
                title: "PCA 2 (Danceability vs Valence)",
                scale: { zero: false }
              },
              color: {
                field: "track_genre",
                type: "nominal",
                title: "Genre",
                legend: null
              },
              opacity: {
                condition: [
                  { selection: "brush", value: 0.9 },
                  { selection: "genreHighlight", value: 1.0 }
                ],
                value: 0.3
              },
              tooltip: [
                { field: "track_name", type: "nominal", title: "Track" },
                { field: "track_genre", type: "nominal", title: "Genre" },
                { field: "energy", type: "quantitative", format: ".2f" },
                { field: "valence", type: "quantitative", format: ".2f" },
                { field: "danceability", type: "quantitative", format: ".2f" },
                { field: "tempo", type: "quantitative", format: ".1f" }
              ]
            },
            mark: { type: "point", filled: true, size: 50 }
          },
          {
            ...energyValenceLinkedSpec,
            width: 500,
            height: 320,
            transform: [
              { filter: { selection: "brush" } }
            ],
            selection: {
              brush: {
                type: "interval",
                encodings: ["x", "y"]
              },
              genreHighlight: {
                type: "multi",
                fields: ["track_genre"],
                bind: "legend",
                value: selectedGenres && selectedGenres.length > 0 ? selectedGenres : null
              }
            }
          }
        ],
        resolve: {
          selection: {
            brush: "union",
            genreHighlight: "union"
          }
        }
      },
      {
        ...brushedGenreSpec,
        selection: {
          brush: {
            type: "interval",
            encodings: ["x", "y"]
          }
        }
      }
    ],
    resolve: {
      selection: {
        brush: "union"
      }
    }
  };
  
  vegaEmbed("#embeddingView", spec, embedOpts).then(result => {
    embeddingView = result.view;
  }).catch(err => {
    console.error("Error updating embedding view:", err);
  });
}

// Embed all charts when the page loads
window.addEventListener("load", () => {
  console.log("Page loaded, embedding charts...");
  console.log("Embedding spec:", JSON.stringify(embeddingWithGenreSpec, null, 2));
  
  // Embed main embedding view (now includes energy-valence view)
  vegaEmbed("#embeddingView", embeddingWithGenreSpec, embedOpts).then(result => {
    console.log("Main view embedded successfully");
    console.log("View object:", result.view);
    embeddingView = result.view;
  }).catch(err => {
    console.error("Error embedding main view:", err);
    console.error("Error details:", err.message);
    console.error("Error stack:", err.stack);
    // Try to show a simple error message
    document.getElementById("embeddingView").innerHTML = 
      "<p style='color: red; padding: 20px;'>Error loading visualization: " + err.message + "</p>";
  });

  // Embed genre bar chart (single-view)
  vegaEmbed("#genreBarView", genreBarSpec, embedOpts).then(result => {
    console.log("Genre bar view embedded successfully");
    genreBarView = result.view;
    
    // Listen for genre selection changes
    genreBarView.addSignalListener("genreSelect", (name, value) => {
      const selectedGenres = value && value.track_genre ? value.track_genre : [];
      updateEmbeddingView(selectedGenres);
    });
  }).catch(err => {
    console.error("Error embedding genre bar view:", err);
    console.error("Error details:", err.message, err.stack);
    document.getElementById("genreBarView").innerHTML = 
      "<p style='color: red; padding: 20px;'>Error loading visualization: " + err.message + "</p>";
  });

  // Embed second embedding view
  vegaEmbed("#secondEmbeddingView", secondEmbeddingSpec, embedOpts).then(result => {
    console.log("Second embedding view embedded successfully");
  }).catch(err => {
    console.error("Error embedding second view:", err);
    console.error("Error details:", err.message, err.stack);
    document.getElementById("secondEmbeddingView").innerHTML = 
      "<p style='color: red; padding: 20px;'>Error loading visualization: " + err.message + "</p>";
  });
});
  
