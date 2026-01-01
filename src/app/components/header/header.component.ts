import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './header.component.html',
    styleUrl: './header.component.scss'
})
export class HeaderComponent {
    @Output() uploadClick = new EventEmitter<void>();

    searchQuery = '';
    userName = 'Antano & Harini';
    userAvatar = 'https://ui-avatars.com/api/?name=A+H&background=random';

    onUploadClick() {
        this.uploadClick.emit();
    }
}
