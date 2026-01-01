import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Video } from '../../models/video.model';

@Component({
    selector: 'app-video-table',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './video-table.component.html',
    styleUrl: './video-table.component.scss'
})
export class VideoTableComponent {
    @Input() videos: Video[] = [];
    @Input() loading = false;
    @Input() selectMultiple = false;
    @Output() toggleStatus = new EventEmitter<Video>();
    @Output() editVideo = new EventEmitter<Video>();
    @Output() deleteVideo = new EventEmitter<Video>();
    @Output() toggleConverted = new EventEmitter<Video>();
    @Output() selectionChange = new EventEmitter<string[]>();
    @Output() viewDraft = new EventEmitter<Video>();

    selectedIds: Set<string> = new Set();
    selectAll = false;

    // Video player
    showVideoPlayer = false;
    currentVideoUrl = '';

    // Delete confirmation modal
    showDeleteModal = false;
    videoToDelete: Video | null = null;

    // Draft preview modal
    showDraftModal = false;
    draftVideo: Video | null = null;

    get selectedCount(): number {
        return this.selectedIds.size;
    }

    toggleSelectAll() {
        if (this.selectAll) {
            this.videos.forEach(v => this.selectedIds.add(v.id));
        } else {
            this.selectedIds.clear();
        }
        this.emitSelection();
    }

    toggleSelect(video: Video) {
        if (this.selectedIds.has(video.id)) {
            this.selectedIds.delete(video.id);
        } else {
            this.selectedIds.add(video.id);
        }
        this.selectAll = this.selectedIds.size === this.videos.length;
        this.emitSelection();
    }

    isSelected(video: Video): boolean {
        return this.selectedIds.has(video.id);
    }

    onToggleStatus(video: Video) {
        this.toggleStatus.emit(video);
    }

    onToggleConverted(video: Video) {
        this.toggleConverted.emit(video);
    }

    onEdit(video: Video) {
        this.editVideo.emit(video);
    }

    // Show delete confirmation modal
    onDelete(video: Video) {
        this.videoToDelete = video;
        this.showDeleteModal = true;
    }

    // Confirm delete action
    confirmDelete() {
        if (this.videoToDelete) {
            this.deleteVideo.emit(this.videoToDelete);
        }
        this.closeDeleteModal();
    }

    // Cancel delete action
    closeDeleteModal() {
        this.showDeleteModal = false;
        this.videoToDelete = null;
    }

    // Play video in modal
    playVideo(video: Video) {
        this.currentVideoUrl = video.thumbnail; // thumbnail is actually the video URL
        this.showVideoPlayer = true;
    }

    closeVideoPlayer() {
        this.showVideoPlayer = false;
        this.currentVideoUrl = '';
    }

    // View Draft modal methods
    onViewDraft(video: Video) {
        this.draftVideo = video;
        this.showDraftModal = true;
        this.viewDraft.emit(video);
    }

    closeDraftModal() {
        this.showDraftModal = false;
        this.draftVideo = null;
    }

    onEditFromDraft() {
        if (this.draftVideo) {
            this.editVideo.emit(this.draftVideo);
            this.closeDraftModal();
        }
    }

    onConvertDraft() {
        if (this.draftVideo) {
            this.toggleConverted.emit(this.draftVideo);
            this.closeDraftModal();
        }
    }

    formatDate(date: Date): string {
        return new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    private emitSelection() {
        this.selectionChange.emit(Array.from(this.selectedIds));
    }
}
