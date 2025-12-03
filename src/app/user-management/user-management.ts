import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, getDocs, deleteDoc, doc, getDoc } from '@angular/fire/firestore';
import { UserProfile } from '../models/user.model';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.html',
  styleUrl: './user-management.css'
})
export class UserManagement implements OnInit {
  private firestore = inject(Firestore);

  allUsers = signal<UserProfile[]>([]);
  selectedUser = signal<UserProfile | null>(null);
  loading = signal(false);
  actionMessage = signal<{type: 'success' | 'error', text: string} | null>(null);

  searchEmail = signal<string>('');
  searchRole = signal<string>('');
  showDeleteConfirmModal = false;
  userToDelete: string | null = null;

  currentPage = signal<number>(1);
  pageSize = signal<number>(10);
  pageSizeOptions = [5, 10, 25, 50];

  filteredUsers = computed(() => {
    let filtered = this.allUsers();

    const email = this.searchEmail().toLowerCase();
    const role = this.searchRole();

    if (email) {
      filtered = filtered.filter(user => user.email.toLowerCase().includes(email));
    }

    if (role) {
      filtered = filtered.filter(user => user.role === role);
    }

    return filtered;
  });

  totalPages = computed(() => Math.ceil(this.filteredUsers().length / this.pageSize()));

  paginatedUsers = computed(() => {
    const filtered = this.filteredUsers();
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return filtered.slice(start, end);
  });

  async ngOnInit() {
    await this.loadUsers();
  }

  async loadUsers() {
    this.loading.set(true);
    try {
      const usersCollection = collection(this.firestore, 'users');
      const snapshot = await getDocs(usersCollection);

      const users: UserProfile[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          uid: doc.id,
          ...data,
          createdAt: data['createdAt']?.toDate ? data['createdAt'].toDate() : data['createdAt']
        } as UserProfile;
      });

      this.allUsers.set(users);
      this.currentPage.set(1);
    } catch (error) {
      console.error('Error loading users:', error);
      this.showMessage('error', 'Failed to load users');
    } finally {
      this.loading.set(false);
    }
  }

  resetFilters() {
    this.searchEmail.set('');
    this.searchRole.set('');
    this.currentPage.set(1);
  }

  selectUser(user: UserProfile) {
    this.selectedUser.set(user);
    this.actionMessage.set(null);
  }

  closeModal() {
    this.selectedUser.set(null);
    this.actionMessage.set(null);
  }

  openDeleteConfirm(userId: string) {
    this.userToDelete = userId;
    this.showDeleteConfirmModal = true;
  }

  closeDeleteConfirm() {
    this.showDeleteConfirmModal = false;
    this.userToDelete = null;
  }

  async confirmDelete() {
    if (!this.userToDelete) return;

    try {
      await deleteDoc(doc(this.firestore, 'users', this.userToDelete));
      await this.loadUsers();
      this.showMessage('success', 'User has been deleted');
      this.closeDeleteConfirm();
      this.closeModal();
    } catch (error) {
      console.error('Error deleting user:', error);
      this.showMessage('error', 'Failed to delete user');
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  previousPage() {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  changePageSize(size: number) {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'admin':
        return 'bg-danger';
      case 'employer':
        return 'bg-primary';
      case 'applicant':
        return 'bg-success';
      default:
        return 'bg-secondary';
    }
  }

  showMessage(type: 'success' | 'error', text: string) {
    this.actionMessage.set({ type, text });
    setTimeout(() => this.actionMessage.set(null), 3000);
  }
}
