import React from 'react';
import Icon from './Icons';
import './Pagination.css';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
    }

    // Industrial logic: show limited pages if too many
    const renderPages = () => {
        if (totalPages <= 7) return pages;

        // Simplification for now: show first, current-1, current, current+1, last
        const current = currentPage;
        const last = totalPages;
        const delta = 1;
        const left = current - delta;
        const right = current + delta + 1;
        const range = [];
        const rangeWithDots = [];
        let l;

        for (let i = 1; i <= last; i++) {
            if (i === 1 || i === last || (i >= left && i < right)) {
                range.push(i);
            }
        }

        for (let i of range) {
            if (l) {
                if (i - l === 2) {
                    rangeWithDots.push(l + 1);
                } else if (i - l !== 1) {
                    rangeWithDots.push('...');
                }
            }
            rangeWithDots.push(i);
            l = i;
        }

        return rangeWithDots;
    };

    return (
        <div className="pagination">
            <button
                className="pagination__btn"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Previous page"
            >
                <Icon name="chevronLeft" size={18} />
            </button>

            <div className="pagination__numbers">
                {renderPages().map((page, index) => (
                    <button
                        key={index}
                        className={`pagination__num ${page === currentPage ? 'pagination__num--active' : ''} ${page === '...' ? 'pagination__num--dots' : ''}`}
                        onClick={() => typeof page === 'number' && onPageChange(page)}
                        disabled={page === '...'}
                    >
                        {page}
                    </button>
                ))}
            </div>

            <button
                className="pagination__btn"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Next page"
            >
                <Icon name="chevronRight" size={18} />
            </button>
        </div>
    );
};

export default Pagination;
