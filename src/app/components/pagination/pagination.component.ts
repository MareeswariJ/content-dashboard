import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-pagination',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './pagination.component.html',
    styleUrl: './pagination.component.scss'
})
export class PaginationComponent {
    @Input() currentPage = 1;
    @Input() totalPages = 1;
    @Input() totalResults = 0;
    @Output() pageChange = new EventEmitter<number>();

    get visiblePages(): (number | string)[] {
        const pages: (number | string)[] = [];
        const maxVisible = 6;

        if (this.totalPages <= maxVisible + 2) {
            for (let i = 1; i <= this.totalPages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);

            if (this.currentPage > 3) {
                pages.push('...');
            }

            const start = Math.max(2, this.currentPage - 1);
            const end = Math.min(this.totalPages - 1, this.currentPage + 1);

            for (let i = start; i <= end; i++) {
                if (!pages.includes(i)) {
                    pages.push(i);
                }
            }

            if (this.currentPage < this.totalPages - 2) {
                pages.push('...');
            }

            pages.push(this.totalPages);
        }

        return pages;
    }

    goToPage(page: number | string) {
        if (typeof page === 'number' && page !== this.currentPage && page >= 1 && page <= this.totalPages) {
            this.pageChange.emit(page);
        }
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.pageChange.emit(this.currentPage - 1);
        }
    }

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.pageChange.emit(this.currentPage + 1);
        }
    }
}
