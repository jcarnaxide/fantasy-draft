export type Column<T> = {
  header: string;
  render: (item: T) => React.ReactNode;
};

export type TableProps<T> = {
  items: T[];
  columns: Column<T>[];
  getKey: (item: T) => string;
};

export function DataTable<T>({ items, columns, getKey }: TableProps<T>) {
  return (
    <table>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.header}>{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={getKey(item)}>
            {columns.map((col) => (
              <td key={col.header}>{col.render(item)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
