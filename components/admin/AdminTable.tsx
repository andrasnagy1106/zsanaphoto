import type { ReactNode } from "react";

export interface AdminTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
}

interface AdminTableProps<T> {
  columns: AdminTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  mobileCard: (row: T) => ReactNode;
}

export function AdminTable<T>({ columns, rows, rowKey, mobileCard }: AdminTableProps<T>) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-lg border border-border bg-white lg:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-foreground/60">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 font-medium">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)} className="border-b border-border last:border-0">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 align-middle">
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 lg:hidden">
        {rows.map((row) => (
          <div key={rowKey(row)} className="rounded-lg border border-border bg-white p-4">
            {mobileCard(row)}
          </div>
        ))}
      </div>
    </>
  );
}
