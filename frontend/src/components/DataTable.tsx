import type { ReactNode } from 'react';

interface Column<T> {
  header: string;
  render: (row: T) => ReactNode;
  key: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
}

export default function DataTable<T>({ columns, rows, rowKey, emptyMessage = 'No records yet.' }: DataTableProps<T>) {
  if (rows.length === 0) {
    return <p className="text-slate-500 text-sm py-8 text-center">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-800 text-slate-400">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-2.5 font-medium">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {rows.map((row) => (
            <tr key={rowKey(row)} className="bg-slate-900 hover:bg-slate-800/60">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-2.5 text-slate-200">
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
