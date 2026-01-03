import { Component, inject, OnInit, signal, computed, WritableSignal, ApplicationRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VideoService } from '../../services/video.service';
import { Video } from '../../models/video.model';
import { VideoTableComponent } from '../../components/video-table/video-table.component';
import { PaginationComponent } from '../../components/pagination/pagination.component';
import { UploadModalComponent } from '../../components/upload-modal/upload-modal.component';
import { EditVideoModalComponent } from '../../components/edit-video-modal/edit-video-modal.component';
import { CustomDropdownComponent, DropdownOption } from '../../components/custom-dropdown/custom-dropdown.component';

@Component({
    selector: 'app-content-upload',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        VideoTableComponent,
        PaginationComponent,
        UploadModalComponent,
        EditVideoModalComponent,
        CustomDropdownComponent
    ],
    templateUrl: './content-upload.component.html',
    styleUrl: './content-upload.component.scss'
})
export class ContentUploadComponent implements OnInit {
    private videoService = inject(VideoService);
    private appRef = inject(ApplicationRef);

    // State using Signals
    videos = signal<Video[]>([]);
    loading = signal<boolean>(true);
    selectedIds = signal<string[]>([]);
    showUploadModal = signal<boolean>(false);
    showEditModal = signal<boolean>(false);
    showDeleteModal = signal<boolean>(false);
    editingVideo = signal<Video | null>(null);

    // Filters using Signals
    searchQuery = signal<string>('');
    selectedTags = signal<string>('');
    selectedContentType = signal<string>('');
    selectedDateRange = signal<string>('Last Month');
    selectedVisibility = signal<string>('');
    selectMultiple = signal<boolean>(false);
    selectedSpecificDate = signal<string>(''); // For the calendar date picker

    // Tabs
    activeTab = signal<string>('video');
    tabs = [
        { id: 'video', label: 'Video', icon: 'video' },
        { id: 'audio', label: 'Audio', icon: 'audio' },
        { id: 'image', label: 'Image', icon: 'image' }
    ];


    // Dropdown Options - Tags dynamically generated from videos
    tagOptions = computed(() => {
        const allTags = new Set<string>();
        this.videos().forEach(v => {
            if (v.tags) {
                v.tags.forEach(tag => allTags.add(tag));
            }
        });
        const options: DropdownOption[] = [{ value: '', label: 'All Tags' }];
        allTags.forEach(tag => {
            options.push({ value: tag, label: tag });
        });
        return options;
    });

    contentTypeOptions: DropdownOption[] = [
        { value: '', label: 'Content Type' },
        { value: 'testimonial', label: 'Testimonial' },
        { value: 'tutorial', label: 'Tutorial' },
        { value: 'event', label: 'Event' }
    ];

    dateRangeOptions: DropdownOption[] = [
        { value: 'Last Month', label: 'Last Month' },
        { value: 'Last Week', label: 'Last Week' },
        { value: 'Last Year', label: 'Last Year' },
        { value: 'All Time', label: 'All Time' }
    ];

    visibilityOptions: DropdownOption[] = [
        { value: '', label: 'Visibility' },
        { value: 'visible', label: 'Visible' },
        { value: 'hidden', label: 'Hidden' }
    ];


    // Filter Logic using Computed Signals
    filteredVideos = computed(() => {
        const query = this.searchQuery().toLowerCase();
        const contentType = this.selectedContentType();
        const visibility = this.selectedVisibility();
        const selectedTag = this.selectedTags();

        const dateRange = this.selectedDateRange();

        return this.videos().filter(v => {
            // Search filter
            const matchesSearch = v.title.toLowerCase().includes(query) ||
                v.category.toLowerCase().includes(query);

            // Category filter
            const matchesCategory = !contentType ||
                v.category.toLowerCase() === contentType.toLowerCase();

            // Visibility filter
            const matchesVisibility = !visibility || v.status === visibility;

            // Tag filter
            const matchesTag = !selectedTag || (v.tags && v.tags.includes(selectedTag));

            // Date filter - specific date takes priority over range
            const specificDate = this.selectedSpecificDate();
            let matchesDate: boolean;
            if (specificDate) {
                // Filter by specific date selected from calendar
                const uploadDate = new Date(v.uploadedDate);
                const selectedDate = new Date(specificDate);
                matchesDate = uploadDate.getFullYear() === selectedDate.getFullYear() &&
                    uploadDate.getMonth() === selectedDate.getMonth() &&
                    uploadDate.getDate() === selectedDate.getDate();
            } else {
                // Use dropdown range filter
                matchesDate = this.checkDateRange(v.uploadedDate, dateRange);
            }

            return matchesSearch && matchesCategory && matchesVisibility && matchesTag && matchesDate;
        });
    });

    private checkDateRange(date: Date, range: string): boolean {
        if (!date) return false;
        const now = new Date();
        const uploadDate = new Date(date);

        // Reset time part for accurate date comparison
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const target = new Date(uploadDate.getFullYear(), uploadDate.getMonth(), uploadDate.getDate());

        switch (range) {
            case 'Last Week':
                const lastWeek = new Date(today);
                lastWeek.setDate(today.getDate() - 7);
                return target >= lastWeek;
            case 'Last Month':
                const lastMonth = new Date(today);
                lastMonth.setMonth(today.getMonth() - 1);
                return target >= lastMonth;
            case 'Last Year':
                const lastYear = new Date(today);
                lastYear.setFullYear(today.getFullYear() - 1);
                return target >= lastYear;
            case 'All Time':
            default:
                return true;
        }
    }

    // Pagination using Signals
    currentPage = signal<number>(1);
    itemsPerPage = 10;

    paginatedVideos = computed(() => {
        const start = (this.currentPage() - 1) * this.itemsPerPage;
        return this.filteredVideos().slice(start, start + this.itemsPerPage);
    });

    totalPages = computed(() => {
        return Math.ceil(this.filteredVideos().length / this.itemsPerPage);
    });

    private subscription?: any;

    ngOnInit() {
        this.loadVideos();
        // Sync with sidebar
        this.videoService.activeTabSubject.subscribe(tab => {
            this.activeTab.set(tab);
        });
    }

    ngOnDestroy() {
        this.subscription?.unsubscribe();
    }
    loadVideos() {
        this.loading.set(true);

        // Unsubscribe from old subscription if it exists
        if (this.subscription) {
            this.subscription.unsubscribe();
        }

        // Timeout fallback - stop loading after 5 seconds even if no data
        setTimeout(() => {
            if (this.loading()) {
                console.log('Loading timeout - setting loading to false');
                this.loading.set(false);
            }
        }, 5000);

        this.subscription = this.videoService.getVideos().subscribe({
            next: (videos) => {
                console.log('Received videos:', videos.length);
                this.videos.set(videos);
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error loading videos:', err);
                this.loading.set(false);
            }
        });
    }




    setActiveTab(tabId: string) {
        this.activeTab.set(tabId);
        this.videoService.activeTabSubject.next(tabId);
    }

    onSelectionChange(ids: string[]) {
        this.selectedIds.set(ids);
    }

    onToggleStatus(video: Video) {
        // Optimistic update
        this.videos.update(videos =>
            videos.map(v => v.id === video.id ? { ...v, status: v.status === 'visible' ? 'hidden' : 'visible' } : v)
        );
        this.videoService.toggleVisibility(video.id, video.status);
    }

    onToggleConverted(video: Video) {
        // Optimistic update
        this.videos.update(videos =>
            videos.map(v => v.id === video.id ? { ...v, converted: !v.converted } : v)
        );
        this.videoService.toggleConverted(video.id, video.converted);
    }

    onExportCSV() {
        const selected = this.selectedIds();
        // Export selected videos if any, otherwise export all filtered videos
        const videosToExport = selected.length > 0
            ? this.videos().filter(v => selected.includes(v.id))
            : this.filteredVideos();

        if (videosToExport.length === 0) {
            alert('No videos to export');
            return;
        }

        const headers = ['Title', 'Duration', 'Category', 'Size', 'Status', 'Uploaded Date', 'Converted', 'Tags', 'Video URL'];
        const csvContent = [
            headers.join(','),
            ...videosToExport.map(v => {
                const tags = v.tags ? v.tags.join(';') : '';
                return [
                    `"${v.title.replace(/"/g, '""')}"`, // Handle commas in title
                    v.duration,
                    v.category,
                    v.size,
                    v.status,
                    v.uploadedDate?.toISOString().split('T')[0],
                    v.converted ? 'Yes' : 'No',
                    `"${tags}"`,
                    `"${v.thumbnail}"` // Assuming thumbnail field holds the download URL based on service logic, or we should check if there's a separate url field. Checking video model...
                ].join(',');
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `video_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    onEditVideo(video: Video) {
        this.editingVideo.set(video);
        this.showEditModal.set(true);
    }

    closeEditModal() {
        this.showEditModal.set(false);
        this.editingVideo.set(null);
        this.appRef.tick();
    }

    onEditSaved() {
        console.log('Edit saved, refreshing...');
        this.appRef.tick();
    }

    onDeleteVideo(video: Video) {
        // Delete directly - confirmation is handled by the popup modal in video-table component
        this.videoService.deleteVideo(video.id);
    }

    onDeleteSelected() {
        if (this.selectedIds().length === 0) return;
        this.showDeleteModal.set(true);
    }

    confirmDeleteSelected() {
        const ids = this.selectedIds();
        if (ids.length > 0) {
            this.videoService.deleteMultiple(ids);
            this.selectedIds.set([]);
        }
        this.closeDeleteModal();
    }

    closeDeleteModal() {
        this.showDeleteModal.set(false);
    }

    onMakeVisibleAll() {
        this.selectedIds().forEach(id => {
            this.videoService.updateVideo(id, { status: 'visible' });
        });
    }

    onPageChange(page: number) {
        this.currentPage.set(page);
    }

    onDateSelected(date: string) {
        this.selectedSpecificDate.set(date);
        // Clear the dropdown range when a specific date is selected
        if (date) {
            this.selectedDateRange.set('All Time');
        }
        this.currentPage.set(1); // Reset to first page
    }

    openUploadModal() {
        this.showUploadModal.set(true);
    }

    closeUploadModal() {
        this.showUploadModal.set(false);
        // Force change detection when modal closes
        this.appRef.tick();
    }

    onUploadComplete() {
        // Force UI refresh after upload completes
        // The real-time listener will handle data updates, but we ensure change detection runs
        console.log('Upload complete, triggering change detection');
        this.appRef.tick();
    }
}
