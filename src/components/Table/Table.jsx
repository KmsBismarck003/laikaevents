import React, { useState } from 'react';
import Skeleton from '../Skeleton/Skeleton';
import './Table.css';

const Table = ({
  columns = [],
  data = [],
  onRowClick,
  hoverable = true,
  striped = false,
  bordered = false,
  loading = false,
  emptyMessage = 'No hay datos disponibles',
  sortable = false,
  rowPriority = null, // Function (row) => number
  rowClassName = null, // Function (row) => string
  className = '',
  ...props
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    if (!sortable) return;

    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = React.useMemo(() => {
    let baseData = [...data];

    // Primero ordenamos por la columna seleccionada si existe
    if (sortable && sortConfig.key) {
      baseData.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Luego aplicamos la prioridad (si existe) para "fijar" arriba los de mayor peso
    if (rowPriority) {
      baseData.sort((a, b) => {
        const priorityA = rowPriority(a) || 0;
        const priorityB = rowPriority(b) || 0;
        return priorityB - priorityA; // Descendente: más prioridad arriba
      });
    }

    return baseData;
  }, [data, sortConfig, sortable, rowPriority]);

  const classNames = [
    'table-container',
    className
  ].filter(Boolean).join(' ');

  const tableClassNames = [
    'table',
    hoverable && 'table--hoverable',
    striped && 'table--striped',
    bordered && 'table--bordered'
  ].filter(Boolean).join(' ');


  return (
    <div className={classNames} {...props}>
      <table className={tableClassNames}>
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                onClick={() => column.sortable !== false && handleSort(column.key)}
                className={[
                  sortable && column.sortable !== false && 'table__th--sortable',
                  sortConfig.key === column.key && 'table__th--sorted'
                ].filter(Boolean).join(' ')}
                style={{ width: column.width }}
              >
                <div className="table__th-content">
                  {column.header}
                  {sortable && column.sortable !== false && (
                    <span className="table__sort-icon">
                      {sortConfig.key === column.key ? (
                        sortConfig.direction === 'asc' ? '▲' : '▼'
                      ) : '⇅'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column, colIndex) => (
                  <td key={colIndex}>
                    <Skeleton type="text" height="14px" width="80%" />
                  </td>
                ))}
              </tr>
            ))
          ) : sortedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: '2rem', color: '#888', fontWeight: 600 }}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={() => onRowClick && onRowClick(row)}
                className={[
                  onRowClick && 'table__row--clickable',
                  rowClassName && rowClassName(row)
                ].filter(Boolean).join(' ')}
              >
                {columns.map((column, colIndex) => (
                  <td key={colIndex}>
                    {column.render
                      ? column.render(row[column.key], row, rowIndex)
                      : row[column.key]
                    }
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
