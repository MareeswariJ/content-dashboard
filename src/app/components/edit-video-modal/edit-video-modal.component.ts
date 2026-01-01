import { Component, EventEmitter, Input, Output, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Video } from '../../models/video.model';
import { VideoService } from '../../services/video.service';

@Component({
    selector: 'app-edit-video-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './edit-video-modal.component.html',
    styleUrl: './edit-video-modal.component.scss'
})
export class EditVideoModalComponent implements OnInit {
    @Input() video!: Video;
    @Output() close = new EventEmitter<void>();
    @Output() saved = new EventEmitter<void>();

    private videoService = inject(VideoService);
    private cdr = inject(ChangeDetectorRef);

    // Editable fields
    editTitle = '';
    editCategory = '';
    editTags: string[] = [];
    tagInput = '';
    isSaving = false;

    categories = ['Testimonial', 'Tutorial', 'Event', 'Webinar', 'Workshop', 'General'];

    ngOnInit() {
        // Initialize with current video values
        this.editTitle = this.video.title;
        this.editCategory = this.video.category;
        // Load existing tags from video
        this.editTags = this.video.tags ? [...this.video.tags] : [];
    }

    // Tag management
    addTag() {
        const tag = this.tagInput.trim();
        if (tag && !this.editTags.includes(tag)) {
            this.editTags.push(tag);
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
        this.editTags = this.editTags.filter(t => t !== tag);
    }

    async saveChanges() {
        if (!this.editTitle.trim()) {
            alert('Title is required');
            return;
        }

        this.isSaving = true;

        try {
            await this.videoService.updateVideo(this.video.id, {
                title: this.editTitle.trim(),
                category: this.editCategory,
                tags: this.editTags,
                tagsUsed: this.editTags.length
            });

            this.saved.emit();
            this.close.emit();
        } catch (error) {
            console.error('Error saving video:', error);
            alert('Failed to save changes');
        } finally {
            this.isSaving = false;
            this.cdr.detectChanges();
        }
    }

    onClose() {
        if (!this.isSaving) {
            this.close.emit();
        }
    }
}
