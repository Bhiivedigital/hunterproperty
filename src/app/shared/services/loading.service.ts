import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private pendingCount = 0;
  readonly pending$ = new BehaviorSubject<number>(0);

  increment(): void {
    this.pendingCount++;
    this.pending$.next(this.pendingCount);
  }

  decrement(): void {
    this.pendingCount = Math.max(0, this.pendingCount - 1);
    this.pending$.next(this.pendingCount);
  }
}
