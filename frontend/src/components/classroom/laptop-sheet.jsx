/**
 * A chart shown the way a student actually makes one: in a spreadsheet, on a
 * laptop. Title bar, menu, formula bar, lettered columns and numbered rows,
 * the data typed into cells on the left and the chart floating beside it as a
 * selected chart object. Sheet tabs along the bottom.
 *
 * The chrome is ornament (`aria-hidden`); the data table is real, so the values
 * behind the chart stay readable without the plot. `laptop={false}` drops the
 * laptop and keeps just the app window, for small tiles.
 */
const COLS = "ABCDEFGHIJKL".split("")

export function LaptopSheet({
  file,
  formula,
  cell = "A1",
  headers,
  rows,
  sheet = "Sheet1",
  laptop = true,
  children,
}) {
  const app = (
    <div className="rb-sheet">
      <div className="rb-sheet-titlebar" aria-hidden="true">
        <span className="rb-sheet-dots">
          <i />
          <i />
          <i />
        </span>
        <span className="rb-sheet-file">{file}</span>
      </div>

      <div className="rb-sheet-menu" aria-hidden="true">
        {["File", "Home", "Insert", "Data", "Chart", "View"].map((item) => (
          <span key={item} className={item === "Chart" ? "is-active" : undefined}>
            {item}
          </span>
        ))}
      </div>

      <div className="rb-sheet-formula" aria-hidden="true">
        <span className="rb-sheet-namebox">{cell}</span>
        <span className="rb-sheet-fx">fx</span>
        <span className="rb-sheet-expr">{formula}</span>
      </div>

      <div className="rb-sheet-cols" aria-hidden="true">
        <span className="rb-sheet-corner" />
        {COLS.map((col) => (
          <span key={col}>{col}</span>
        ))}
      </div>

      <div className="rb-sheet-area">
        <div className="rb-sheet-rows" aria-hidden="true">
          {Array.from({ length: 40 }, (_, i) => (
            <span key={i}>{i + 1}</span>
          ))}
        </div>

        <div className="rb-sheet-cells">
          {headers ? (
            <table className="rb-sheet-table">
              <thead>
                <tr>
                  {headers.map((header) => (
                    <th key={header} scope="col">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i}>
                    {row.map((value, j) =>
                      j === 0 ? (
                        <th key={j} scope="row">
                          {value}
                        </th>
                      ) : (
                        <td key={j}>{value}</td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}

          <div className="rb-sheet-chart">
            <span className="rb-sheet-handle" data-corner="tl" aria-hidden="true" />
            <span className="rb-sheet-handle" data-corner="tr" aria-hidden="true" />
            <span className="rb-sheet-handle" data-corner="bl" aria-hidden="true" />
            <span className="rb-sheet-handle" data-corner="br" aria-hidden="true" />
            {children}
          </div>
        </div>
      </div>

      <div className="rb-sheet-tabs" aria-hidden="true">
        <span className="is-active">{sheet}</span>
        <span>notes</span>
        <span>+</span>
      </div>
    </div>
  )

  if (!laptop) return app

  return (
    <div className="rb-laptop">
      <div className="rb-laptop-lid">
        <span className="rb-laptop-cam" aria-hidden="true" />
        {app}
      </div>
      <div className="rb-laptop-base" aria-hidden="true" />
    </div>
  )
}
