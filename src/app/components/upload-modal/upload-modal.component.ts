import { Component, EventEmitter, Output, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VideoService } from '../../services/video.service';
import { UploadProgress } from '../../models/video.model';

@Component({
    selector: 'app-upload-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './upload-modal.component.html',
    styleUrl: './upload-modal.component.scss'
})
export class UploadModalComponent {
    @Output() close = new EventEmitter<void>();
    @Output() uploadComplete = new EventEmitter<void>();

    private videoService = inject(VideoService);
    private cdr = inject(ChangeDetectorRef);

    // Use signals for reactive state
    uploadProgress = signal<number>(0);
    uploadState = signal<'idle' | 'running' | 'success' | 'error'>('idle');
    isUploading = signal<boolean>(false);
    isFinalizing = signal<boolean>(false);
    errorMessage = signal<string>('');

    // Form data
    selectedFile: File | null = null;
    videoTitle = '';
    videoCategory = 'Testimonial';
    videoDuration = '00:00:00';
    videoTags: string[] = [];
    tagInput = '';
    isDragOver = false;

    categories = ['Testimonial', 'Tutorial', 'Event', 'Webinar', 'Workshop', 'General'];

    onDragOver(event: DragEvent) {
        event.preventDefault();
        this.isDragOver = true;
    }

    onDragLeave() {
        this.isDragOver = false;
    }

    onDrop(event: DragEvent) {
        event.preventDefault();
        this.isDragOver = false;

        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            this.handleFileSelect(files[0]);
        }
    }

    onFileSelect(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.handleFileSelect(input.files[0]);
        }
    }

    handleFileSelect(file: File) {
        if (file.type.startsWith('video/')) {
            this.selectedFile = file;
            this.videoTitle = file.name.replace(/\.[^/.]+$/, '');
            // Auto-detect video duration
            this.detectVideoDuration(file);
        } else {
            alert('Please select a video file');
        }
    }

    // Auto-detect video duration from the file
    detectVideoDuration(file: File) {
        const video = document.createElement('video');
        video.preload = 'metadata';

        video.onloadedmetadata = () => {
            window.URL.revokeObjectURL(video.src);
            const duration = video.duration;
            this.videoDuration = this.formatDuration(duration);
            this.cdr.detectChanges();
        };

        video.src = URL.createObjectURL(file);
    }

    // Format seconds to HH:MM:SS
    formatDuration(seconds: number): string {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Tag management
    addTag() {
        const tag = this.tagInput.trim();
        if (tag && !this.videoTags.includes(tag)) {
            this.videoTags.push(tag);
            this.tagInput = '';
        }
    }

    addTagOnEnter(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.addTag();
        }
    }

    removeTag(tag: string) {
        this.videoTags = this.videoTags.filter(t => t !== tag);
    }

    removeFile() {
        this.selectedFile = null;
        this.videoTitle = '';
        this.videoDuration = '00:00:00';
        this.videoTags = [];
    }

    startUpload() {
        if (!this.selectedFile) return;

        this.isUploading.set(true);
        this.uploadState.set('running');
        this.uploadProgress.set(0);
        this.errorMessage.set('');

        this.videoService.uploadVideo(this.selectedFile, {
            title: this.videoTitle,
            category: this.videoCategory,
            duration: this.videoDuration,
            tags: this.videoTags,
            tagsUsed: this.videoTags.length
        }).subscribe({
            next: (progress: UploadProgress) => {
                queueMicrotask(() => {
                    this.uploadProgress.set(progress.progress);

                    if (progress.progress === 100 && progress.state === 'running') {
                        this.isFinalizing.set(true);
                    }

                    if (progress.state === 'success' || progress.state === 'error' || progress.state === 'running' || progress.state === 'paused') {
                        this.uploadState.set(progress.state === 'paused' ? 'running' : progress.state);
                    }

                    if (progress.state === 'error') {
                        this.isUploading.set(false);
                        this.isFinalizing.set(false);
                        this.errorMessage.set(progress.error || 'Upload failed');
                    }

                    if (progress.state === 'success') {
                        this.isUploading.set(false);
                        this.isFinalizing.set(false);
                        setTimeout(() => {
                            this.uploadComplete.emit();
                            this.close.emit();
                        }, 500);
                    }

                    this.cdr.detectChanges();
                });
            },
            error: (err: any) => {
                console.error('Upload error:', err);
                queueMicrotask(() => {
                    this.uploadState.set('error');
                    this.isUploading.set(false);
                    this.isFinalizing.set(false);
                    this.errorMessage.set(err?.message || 'Network error');
                    this.cdr.detectChanges();
                });
            }
        });
    }

    onClose() {
        if (!this.isUploading()) {
            this.close.emit();
        }
    }

    formatFileSize(bytes: number): string {
        if (bytes >= 1073741824) {
            return (bytes / 1073741824).toFixed(2) + ' GB';
        } else if (bytes >= 1048576) {
            return (bytes / 1048576).toFixed(2) + ' MB';
        }
        return (bytes / 1024).toFixed(2) + ' KB';
    }
}
