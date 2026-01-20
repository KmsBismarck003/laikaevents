import React, { useState } from 'react';
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
    if (!sortable || !sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig, sortable]);

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

  if (loading) {
    return (
      <div className={classNames}>
        <div className="table__loading">
          <div className="table__spinner"></div>
          <p>Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={classNames}>
        <div className="table__empty">
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

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
          {sortedData.map((row, rowIndex) => (
            <tr 
              key={rowIndex}
              onClick={() => onRowClick && onRowClick(row)}
              className={onRowClick && 'table__row--clickable'}
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
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
